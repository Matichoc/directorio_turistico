"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const routeLocaleContentSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre"),
  description: z.string().trim().optional().or(z.literal("")),
});

const routeFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "El slug debe ser minúsculas, números y guiones (ej: mi-ruta)",
    ),
  estimatedDurationMinutes: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .or(z.literal("")),
  publicationStatus: z.enum(["draft", "published", "archived"]),
  verificationStatus: z.enum(["pending", "verified", "outdated"]),
  translations: z.object({
    es: routeLocaleContentSchema,
    en: routeLocaleContentSchema,
  }),
});

export type RouteFormInput = z.input<typeof routeFormSchema>;

function normalize(value: string | undefined | null): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

function normalizeDuration(value: number | "" | undefined): number | null {
  return value === "" || value === undefined ? null : value;
}

export async function createRoute(
  input: RouteFormInput,
): Promise<{ id: string }> {
  const parsed = routeFormSchema.parse(input);
  const supabase = await createClient();

  const { data: route, error } = await supabase
    .from("routes")
    .insert({
      slug: parsed.slug,
      estimated_duration_minutes: normalizeDuration(
        parsed.estimatedDurationMinutes,
      ),
      publication_status: parsed.publicationStatus,
      verification_status: parsed.verificationStatus,
    })
    .select("id")
    .single();

  if (error || !route) {
    throw new Error(
      `No se pudo crear la ruta: ${error?.message ?? "error desconocido"}`,
    );
  }

  const { error: translationsError } = await supabase
    .from("route_translations")
    .insert(
      (["es", "en"] as const).map((locale) => ({
        route_id: route.id,
        locale,
        name: parsed.translations[locale].name,
        description: normalize(parsed.translations[locale].description),
      })),
    );

  if (translationsError) {
    throw new Error(
      `No se pudo guardar la traducción: ${translationsError.message}`,
    );
  }

  revalidatePath("/admin/rutas");
  return { id: route.id };
}

export async function updateRoute(
  id: string,
  input: RouteFormInput,
): Promise<void> {
  const parsed = routeFormSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("routes")
    .update({
      slug: parsed.slug,
      estimated_duration_minutes: normalizeDuration(
        parsed.estimatedDurationMinutes,
      ),
      publication_status: parsed.publicationStatus,
      verification_status: parsed.verificationStatus,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar la ruta: ${error.message}`);
  }

  const { error: translationsError } = await supabase
    .from("route_translations")
    .upsert(
      (["es", "en"] as const).map((locale) => ({
        route_id: id,
        locale,
        name: parsed.translations[locale].name,
        description: normalize(parsed.translations[locale].description),
      })),
      { onConflict: "route_id,locale" },
    );

  if (translationsError) {
    throw new Error(
      `No se pudo actualizar la traducción: ${translationsError.message}`,
    );
  }

  revalidatePath("/admin/rutas");
  revalidatePath(`/admin/rutas/${id}`);
}

export async function deleteRoute(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("routes").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar la ruta: ${error.message}`);
  }

  revalidatePath("/admin/rutas");
}

/**
 * Renumera las paradas de una ruta a posiciones contiguas (0..n-1) en el
 * orden dado. `route_stops` tiene `unique (route_id, position)`
 * (`0004_routes.sql`), así que asignar la posición final de una podría
 * chocar con la posición actual de otra a mitad de camino — por eso se
 * mueven todas primero a un rango temporal (10000+) libre de colisiones y
 * recién ahí se asignan las posiciones finales.
 */
async function renumberStops(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderedStopIds: string[],
): Promise<void> {
  await Promise.all(
    orderedStopIds.map((stopId, index) =>
      supabase
        .from("route_stops")
        .update({ position: 10_000 + index })
        .eq("id", stopId),
    ),
  );
  await Promise.all(
    orderedStopIds.map((stopId, index) =>
      supabase.from("route_stops").update({ position: index }).eq("id", stopId),
    ),
  );
}

/**
 * Agrega una parada al final de la ruta (posición = cantidad actual).
 * Recibe `FormData` (en vez de `placeId` directo) porque se usa como
 * `action` de un `<form>` con `routeId` ya vinculado vía `.bind` y el
 * lugar elegido en un `<select name="placeId">` — el único dato que
 * puede variar en cada submit.
 */
export async function addRouteStop(
  routeId: string,
  formData: FormData,
): Promise<void> {
  const placeId = String(formData.get("placeId") ?? "");
  if (!placeId) {
    throw new Error("Selecciona un lugar para agregar.");
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("route_stops")
    .select("id", { count: "exact", head: true })
    .eq("route_id", routeId);

  const { error } = await supabase.from("route_stops").insert({
    route_id: routeId,
    place_id: placeId,
    position: count ?? 0,
  });

  if (error) {
    throw new Error(`No se pudo agregar la parada: ${error.message}`);
  }

  revalidatePath(`/admin/rutas/${routeId}`);
}

export async function removeRouteStop(
  routeId: string,
  stopId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("route_stops")
    .delete()
    .eq("id", stopId);

  if (error) {
    throw new Error(`No se pudo quitar la parada: ${error.message}`);
  }

  const { data: remaining } = await supabase
    .from("route_stops")
    .select("id")
    .eq("route_id", routeId)
    .order("position");

  if (remaining && remaining.length > 0) {
    await renumberStops(
      supabase,
      remaining.map((stop) => stop.id),
    );
  }

  revalidatePath(`/admin/rutas/${routeId}`);
}

/** Sube o baja una parada un lugar (misma UX que "Mi recorrido"). */
export async function moveRouteStop(
  routeId: string,
  stopId: string,
  direction: -1 | 1,
): Promise<void> {
  const supabase = await createClient();
  const { data: stops, error } = await supabase
    .from("route_stops")
    .select("id")
    .eq("route_id", routeId)
    .order("position");

  if (error || !stops) {
    throw new Error(`No se pudo reordenar: ${error?.message ?? "sin datos"}`);
  }

  const order = stops.map((stop) => stop.id);
  const index = order.indexOf(stopId);
  const targetIndex = index + direction;
  if (index === -1 || targetIndex < 0 || targetIndex >= order.length) {
    return;
  }

  [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
  await renumberStops(supabase, order);

  revalidatePath(`/admin/rutas/${routeId}`);
}
