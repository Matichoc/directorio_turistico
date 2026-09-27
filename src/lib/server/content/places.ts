"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const localeContentSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre"),
  shortDescription: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
});

const placeFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "El slug debe ser minúsculas, números y guiones (ej: mi-lugar)",
    ),
  communeId: z.uuid(),
  categoryId: z.uuid(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().optional().or(z.literal("")),
  icon: z.string().trim().optional().or(z.literal("")),
  publicationStatus: z.enum(["draft", "published", "archived"]),
  verificationStatus: z.enum(["pending", "verified", "outdated"]),
  translations: z.object({
    es: localeContentSchema,
    en: localeContentSchema,
  }),
});

export type PlaceFormInput = z.input<typeof placeFormSchema>;

function normalize(value: string | undefined | null): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

/**
 * Crea un lugar nuevo (`places` + traducción es/en en `place_translations`)
 * desde `/admin/lugares/nuevo`. Tags y fotos quedan fuera de este primer
 * corte de CRUD (fotos requieren subida a Storage, tags un selector propio)
 * — se pueden seguir editando a mano en Supabase mientras tanto, ver
 * docs/PLAN.md.
 */
export async function createPlace(
  input: PlaceFormInput,
): Promise<{ id: string }> {
  const parsed = placeFormSchema.parse(input);
  const supabase = await createClient();

  const { data: place, error } = await supabase
    .from("places")
    .insert({
      slug: parsed.slug,
      commune_id: parsed.communeId,
      category_id: parsed.categoryId,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      address: normalize(parsed.address),
      phone: normalize(parsed.phone),
      website: normalize(parsed.website),
      icon: normalize(parsed.icon),
      publication_status: parsed.publicationStatus,
      verification_status: parsed.verificationStatus,
    })
    .select("id")
    .single();

  if (error || !place) {
    throw new Error(
      `No se pudo crear el lugar: ${error?.message ?? "error desconocido"}`,
    );
  }

  const { error: translationsError } = await supabase
    .from("place_translations")
    .insert(
      (["es", "en"] as const).map((locale) => ({
        place_id: place.id,
        locale,
        name: parsed.translations[locale].name,
        short_description: normalize(
          parsed.translations[locale].shortDescription,
        ),
        description: normalize(parsed.translations[locale].description),
      })),
    );

  if (translationsError) {
    throw new Error(
      `No se pudo guardar la traducción: ${translationsError.message}`,
    );
  }

  revalidatePath("/admin/lugares");
  return { id: place.id };
}

export async function updatePlace(
  id: string,
  input: PlaceFormInput,
): Promise<void> {
  const parsed = placeFormSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("places")
    .update({
      slug: parsed.slug,
      commune_id: parsed.communeId,
      category_id: parsed.categoryId,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      address: normalize(parsed.address),
      phone: normalize(parsed.phone),
      website: normalize(parsed.website),
      icon: normalize(parsed.icon),
      publication_status: parsed.publicationStatus,
      verification_status: parsed.verificationStatus,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el lugar: ${error.message}`);
  }

  const { error: translationsError } = await supabase
    .from("place_translations")
    .upsert(
      (["es", "en"] as const).map((locale) => ({
        place_id: id,
        locale,
        name: parsed.translations[locale].name,
        short_description: normalize(
          parsed.translations[locale].shortDescription,
        ),
        description: normalize(parsed.translations[locale].description),
      })),
      { onConflict: "place_id,locale" },
    );

  if (translationsError) {
    throw new Error(
      `No se pudo actualizar la traducción: ${translationsError.message}`,
    );
  }

  revalidatePath("/admin/lugares");
  revalidatePath(`/admin/lugares/${id}`);
}

/**
 * Elimina un lugar. `route_stops.place_id` referencia `places` con
 * `on delete restrict` (ver `0004_routes.sql`): si el lugar es parada de
 * alguna ruta, Postgres rechaza el delete en vez de dejar una parada
 * huérfana — el mensaje de error de Supabase ya lo explica, no hace falta
 * chequearlo antes acá.
 */
export async function deletePlace(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("places").delete().eq("id", id);

  if (error) {
    throw new Error(
      `No se pudo eliminar el lugar (¿es parada de alguna ruta?): ${error.message}`,
    );
  }

  revalidatePath("/admin/lugares");
}
