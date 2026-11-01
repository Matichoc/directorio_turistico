"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { portugueseCleared, savedTranslations } from "./translations";

const localeContentSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre"),
  shortDescription: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
});

/** Portugués: opcional; sin nombre no se guarda (ver translations.ts). */
const optionalLocaleContentSchema = localeContentSchema.extend({
  name: z.string().trim(),
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
  localityId: z.uuid().optional().or(z.literal("")),
  categoryId: z.uuid(),
  /** Categorías adicionales (además de la principal, `categoryId`). */
  secondaryCategoryIds: z.array(z.uuid()).default([]),
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
    pt: optionalLocaleContentSchema.optional(),
  }),
});

export type PlaceFormInput = z.input<typeof placeFormSchema>;

function normalize(value: string | undefined | null): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

/**
 * Deja las categorías adicionales de un lugar tal como vienen del
 * formulario (sin la principal, que ya está en `places.category_id`).
 * Si la tabla todavía no existe en esta base (falta correr
 * supabase/manual/categorias-petorca.sql) y no se eligió ninguna, no hace
 * nada; si se eligió alguna, avisa.
 */
async function saveSecondaryCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  placeId: string,
  primaryId: string,
  categoryIds: string[],
) {
  const wanted = [...new Set(categoryIds)].filter((id) => id !== primaryId);
  const { error: deleteError } = await supabase
    .from("place_secondary_categories")
    .delete()
    .eq("place_id", placeId);
  if (deleteError) {
    if (wanted.length === 0) return;
    throw new Error(
      `No se pudieron guardar las categorías adicionales (¿falta correr categorias-petorca.sql?): ${deleteError.message}`,
    );
  }
  if (wanted.length === 0) return;
  const { error } = await supabase.from("place_secondary_categories").insert(
    wanted.map((categoryId) => ({
      place_id: placeId,
      category_id: categoryId,
    })),
  );
  if (error) {
    throw new Error(
      `No se pudieron guardar las categorías adicionales: ${error.message}`,
    );
  }
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
      locality_id: normalize(parsed.localityId),
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
      savedTranslations(parsed.translations).map(([locale, content]) => ({
        place_id: place.id,
        locale,
        name: content.name,
        short_description: normalize(content.shortDescription),
        description: normalize(content.description),
      })),
    );

  if (translationsError) {
    throw new Error(
      `No se pudo guardar la traducción: ${translationsError.message}`,
    );
  }

  await saveSecondaryCategories(
    supabase,
    place.id,
    parsed.categoryId,
    parsed.secondaryCategoryIds,
  );

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
      locality_id: normalize(parsed.localityId),
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
      savedTranslations(parsed.translations).map(([locale, content]) => ({
        place_id: id,
        locale,
        name: content.name,
        short_description: normalize(content.shortDescription),
        description: normalize(content.description),
      })),
      { onConflict: "place_id,locale" },
    );

  if (translationsError) {
    throw new Error(
      `No se pudo actualizar la traducción: ${translationsError.message}`,
    );
  }

  if (portugueseCleared(parsed.translations)) {
    await supabase
      .from("place_translations")
      .delete()
      .eq("place_id", id)
      .eq("locale", "pt");
  }

  await saveSecondaryCategories(
    supabase,
    id,
    parsed.categoryId,
    parsed.secondaryCategoryIds,
  );

  revalidatePath("/admin/lugares");
  revalidatePath(`/admin/lugares/${id}`);
}

/**
 * Activa/desactiva un lugar desde el listado simple, sin abrir el
 * formulario completo — pedido del usuario: dar de baja algo debe ser tan
 * simple como un botón, y nunca borra el registro ni pisa su contenido,
 * solo cambia `publication_status` (la fecha de ese cambio queda sola en
 * `status_changed_at` vía trigger, ver `0020_status_tracking.sql`).
 */
export async function setPlacePublicationStatus(
  id: string,
  status: "published" | "archived",
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("places")
    .update({ publication_status: status })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  }

  revalidatePath("/admin/lugares");
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
