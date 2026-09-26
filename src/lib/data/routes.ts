import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale, PublicationStatus } from "@/types/database";
import type { Route, RouteCard, RouteStop } from "@/types/domain";

const ROUTE_QUERY = `id, slug, estimated_duration_minutes, publication_status,
   route_translations!inner(name, description, locale),
   route_stops(id, place_id, position,
     places(slug, latitude, longitude, icon, place_translations(name, locale),
       categories(slug)))` as const;

interface RouteQueryResult {
  id: string;
  slug: string;
  estimated_duration_minutes: number | null;
  publication_status: PublicationStatus;
  route_translations: {
    name: string;
    description: string | null;
    locale: Locale;
  }[];
  route_stops: {
    id: string;
    place_id: string;
    position: number;
    places: {
      slug: string;
      latitude: number;
      longitude: number;
      icon: string | null;
      place_translations: { name: string; locale: Locale }[];
      categories: { slug: string } | null;
    } | null;
  }[];
}

export async function getRouteBySlug(
  slug: string,
  locale: Locale,
): Promise<Route | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select<typeof ROUTE_QUERY, RouteQueryResult>(ROUTE_QUERY)
    .eq("slug", slug)
    .eq("route_translations.locale", locale)
    .eq("publication_status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const translation = data.route_translations[0];
  const stops: RouteStop[] = (data.route_stops ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((stop) => ({
      id: stop.id,
      placeId: stop.place_id,
      placeSlug: stop.places?.slug ?? "",
      placeName:
        stop.places?.place_translations.find((t) => t.locale === locale)
          ?.name ?? "",
      categorySlug: stop.places?.categories?.slug ?? null,
      placeIcon: stop.places?.icon ?? null,
      latitude: stop.places?.latitude ?? 0,
      longitude: stop.places?.longitude ?? 0,
      position: stop.position,
      notes: null,
    }));

  return {
    id: data.id,
    slug: data.slug,
    name: translation?.name ?? slug,
    description: translation?.description ?? null,
    estimatedDurationMinutes: data.estimated_duration_minutes,
    publicationStatus: data.publication_status,
    stops,
  };
}

const ROUTES_LIST_QUERY = `id, slug, estimated_duration_minutes,
   route_translations!inner(name, description, locale),
   route_stops(id, position,
     places(place_images(storage_path, position)))` as const;

interface RouteListQueryResult {
  id: string;
  slug: string;
  estimated_duration_minutes: number | null;
  route_translations: {
    name: string;
    description: string | null;
    locale: Locale;
  }[];
  route_stops: {
    id: string;
    position: number;
    places: {
      place_images: { storage_path: string; position: number }[];
    } | null;
  }[];
}

/** Foto de portada de una ruta: la primera foto de su primera parada. */
function pickRouteCoverPhoto(
  routeStops: RouteListQueryResult["route_stops"],
): string | null {
  const firstStop = routeStops
    .slice()
    .sort((a, b) => a.position - b.position)[0];
  const images = firstStop?.places?.place_images ?? [];
  const firstImage = images.slice().sort((a, b) => a.position - b.position)[0];
  return firstImage?.storage_path ?? null;
}

export async function listRoutes(
  locale: Locale,
  limit?: number,
): Promise<RouteCard[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  let builder = supabase
    .from("routes")
    .select<typeof ROUTES_LIST_QUERY, RouteListQueryResult>(ROUTES_LIST_QUERY)
    .eq("publication_status", "published")
    .eq("route_translations.locale", locale)
    .order("slug");

  if (limit) {
    builder = builder.limit(limit);
  }

  const { data, error } = await builder;

  if (error || !data) {
    return [];
  }

  return data.map((route) => {
    const translation = route.route_translations[0];
    return {
      id: route.id,
      slug: route.slug,
      name: translation?.name ?? route.slug,
      description: translation?.description ?? null,
      estimatedDurationMinutes: route.estimated_duration_minutes,
      stopsCount: route.route_stops?.length ?? 0,
      photoUrl: pickRouteCoverPhoto(route.route_stops ?? []),
    };
  });
}
