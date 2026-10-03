"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const localityLocaleContentSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre"),
  summary: z.string().trim().optional().or(z.literal("")),
});

/**
 * Coordenada opcional: no se conoce la ubicación exacta de varios pueblos
 * confirmados (ver migración `0021_locality_translations.sql`) — vacío
 * debe quedar en `null`, nunca en `0` (que `z.coerce.number()` produciría
 * para un string vacío y se vería en el mapa como un punto real frente a
 * África, peor que no mostrar nada).
 */
function optionalCoordinate(min: number, max: number) {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    })
    .refine(
      (value) => value === null || (value >= min && value <= max),
      "Coordenada fuera de rango",
    );
}

const localityFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "El slug debe ser minúsculas, números y guiones (ej: mi-pueblo)",
    ),
  communeId: z.uuid(),
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
  summarySourceUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      "La fuente debe ser un enlace que empiece con http:// o https://",
    ),
  summarySourceLabel: z.string().trim().optional().or(z.literal("")),
  translations: z.object({
    es: localityLocaleContentSchema,
    en: localityLocaleContentSchema,
  }),
});

export type LocalityFormInput = z.input<typeof localityFormSchema>;

function normalize(value: string | undefined | null): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

export async function createLocality(
  input: LocalityFormInput,
): Promise<{ id: string }> {
  const parsed = localityFormSchema.parse(input);
  const supabase = await createClient();

  const { data: locality, error } = await supabase
    .from("localities")
    .insert({
      slug: parsed.slug,
      commune_id: parsed.communeId,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      summary_source_url: normalize(parsed.summarySourceUrl),
      summary_source_label: normalize(parsed.summarySourceLabel),
    })
    .select("id")
    .single();

  if (error || !locality) {
    throw new Error(
      `No se pudo crear el pueblo: ${error?.message ?? "error desconocido"}`,
    );
  }

  const { error: translationsError } = await supabase
    .from("locality_translations")
    .insert(
      (["es", "en"] as const).map((locale) => ({
        locality_id: locality.id,
        locale,
        name: parsed.translations[locale].name,
        summary: normalize(parsed.translations[locale].summary),
      })),
    );

  if (translationsError) {
    throw new Error(
      `No se pudo guardar la traducción: ${translationsError.message}`,
    );
  }

  revalidatePath("/admin/pueblos");
  return { id: locality.id };
}

export async function updateLocality(
  id: string,
  input: LocalityFormInput,
): Promise<void> {
  const parsed = localityFormSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("localities")
    .update({
      slug: parsed.slug,
      commune_id: parsed.communeId,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      summary_source_url: normalize(parsed.summarySourceUrl),
      summary_source_label: normalize(parsed.summarySourceLabel),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el pueblo: ${error.message}`);
  }

  const { error: translationsError } = await supabase
    .from("locality_translations")
    .upsert(
      (["es", "en"] as const).map((locale) => ({
        locality_id: id,
        locale,
        name: parsed.translations[locale].name,
        summary: normalize(parsed.translations[locale].summary),
      })),
      { onConflict: "locality_id,locale" },
    );

  if (translationsError) {
    throw new Error(
      `No se pudo actualizar la traducción: ${translationsError.message}`,
    );
  }

  revalidatePath("/admin/pueblos");
  revalidatePath(`/admin/pueblos/${id}`);
}

/**
 * Elimina un pueblo. `places.locality_id` referencia `localities` con
 * `on delete set null` (ver `0003_places.sql`): los lugares que lo tenían
 * asignado simplemente pierden esa referencia, nunca se borran con él.
 */
export async function deleteLocality(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("localities").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar el pueblo: ${error.message}`);
  }

  revalidatePath("/admin/pueblos");
}
