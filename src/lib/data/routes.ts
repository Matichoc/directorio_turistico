import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale, PublicationStatus } from "@/types/database";
import type { Route, RouteStop } from "@/types/domain";

const ROUTE_QUERY = `id, slug, estimated_duration_minutes, publication_status,
   route_translations!inner(name, description, locale),
   route_stops(id, place_id, position,
     places(place_translations(name, locale)))` as const;

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
