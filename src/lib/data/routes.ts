import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale, PublicationStatus } from "@/types/database";
import type { Route, RouteCard, RouteStop } from "@/types/domain";

const ROUTE_QUERY = `id, slug, estimated_duration_minutes, publication_status,
   route_translations!inner(name, description, locale),
   route_stops(id, place_id, position,
     places(slug, place_translations(name, locale)))` as const;

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
      place_translations: { name: string; locale: Locale }[];
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
   route_stops(id)` as const;

interface RouteListQueryResult {
  id: string;
  slug: string;
  estimated_duration_minutes: number | null;
  route_translations: {
    name: string;
    description: string | null;
    locale: Locale;
  }[];
  route_stops: { id: string }[];
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
    };
  });
}
