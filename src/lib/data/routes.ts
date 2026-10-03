import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  Locale,
  PublicationStatus,
  VerificationStatus,
} from "@/types/database";
import type { Route, RouteCard, RouteStop } from "@/types/domain";

const ROUTE_QUERY = `id, slug, estimated_duration_minutes, cover_image,
   publication_status,
   route_translations!inner(name, description, locale),
   route_stops(id, place_id, position,
     route_stop_translations(notes, locale),
     places(slug, latitude, longitude, icon,
       place_translations(name, short_description, locale),
       place_images(storage_path, position),
       categories(slug)))` as const;

interface RouteQueryResult {
  id: string;
  slug: string;
  estimated_duration_minutes: number | null;
  cover_image: string | null;
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
    route_stop_translations: { notes: string | null; locale: Locale }[];
    places: {
      slug: string;
      latitude: number;
      longitude: number;
      icon: string | null;
      place_translations: {
        name: string;
        short_description: string | null;
        locale: Locale;
      }[];
      place_images: { storage_path: string; position: number }[];
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
    .map((stop) => {
      const firstPhoto = (stop.places?.place_images ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)[0];

      return {
        id: stop.id,
        placeId: stop.place_id,
        placeSlug: stop.places?.slug ?? "",
        placeName:
          stop.places?.place_translations.find((t) => t.locale === locale)
            ?.name ?? "",
        placeShortDescription:
          stop.places?.place_translations.find((t) => t.locale === locale)
            ?.short_description ?? null,
        placePhotoUrl: firstPhoto?.storage_path ?? null,
        categorySlug: stop.places?.categories?.slug ?? null,
        placeIcon: stop.places?.icon ?? null,
        latitude: stop.places?.latitude ?? 0,
        longitude: stop.places?.longitude ?? 0,
        position: stop.position,
        notes:
          stop.route_stop_translations.find((t) => t.locale === locale)
            ?.notes ?? null,
      };
    });

  return {
    id: data.id,
    slug: data.slug,
    name: translation?.name ?? slug,
    description: translation?.description ?? null,
    estimatedDurationMinutes: data.estimated_duration_minutes,
    coverImageUrl: data.cover_image,
    publicationStatus: data.publication_status,
    stops,
  };
}

const ROUTES_LIST_QUERY = `id, slug, estimated_duration_minutes, cover_image,
   route_translations!inner(name, description, locale),
   route_stops(id, position,
     places(place_images(storage_path, position)))` as const;

interface RouteListQueryResult {
  id: string;
  slug: string;
  estimated_duration_minutes: number | null;
  cover_image: string | null;
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

export interface AdminRouteListItem {
  id: string;
  slug: string;
  name: string;
  stopsCount: number;
  publicationStatus: PublicationStatus;
  statusChangedAt: string;
}

const ADMIN_ROUTES_LIST_QUERY =
  `id, slug, publication_status, status_changed_at,
   route_translations!inner(name, locale),
   route_stops(id)` as const;

interface AdminRouteListQueryResult {
  id: string;
  slug: string;
  publication_status: PublicationStatus;
  status_changed_at: string;
  route_translations: { name: string; locale: Locale }[];
  route_stops: { id: string }[];
}

/** Lista TODAS las rutas (cualquier `publication_status`) para el panel admin. */
export async function listAdminRoutes(): Promise<AdminRouteListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select<typeof ADMIN_ROUTES_LIST_QUERY, AdminRouteListQueryResult>(
      ADMIN_ROUTES_LIST_QUERY,
    )
    .eq("route_translations.locale", "es")
    .order("slug");

  if (error || !data) {
    return [];
  }

  return data.map((route) => ({
    id: route.id,
    slug: route.slug,
    name: route.route_translations[0]?.name ?? route.slug,
    stopsCount: route.route_stops?.length ?? 0,
    publicationStatus: route.publication_status,
    statusChangedAt: route.status_changed_at,
  }));
}

export interface AdminRouteTranslation {
  name: string;
  description: string | null;
}

export interface AdminRouteStop {
  id: string;
  placeId: string;
  placeName: string;
  position: number;
}

export interface AdminRouteDetail {
  id: string;
  slug: string;
  estimatedDurationMinutes: number | null;
  coverImageUrl: string | null;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  translations: Record<Locale, AdminRouteTranslation>;
  stops: AdminRouteStop[];
}

const ADMIN_ROUTE_DETAIL_QUERY =
  `id, slug, estimated_duration_minutes, cover_image, publication_status,
   verification_status,
   route_translations(locale, name, description),
   route_stops(id, place_id, position,
     places(place_translations(name, locale)))` as const;

interface AdminRouteDetailQueryResult {
  id: string;
  slug: string;
  estimated_duration_minutes: number | null;
  cover_image: string | null;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  route_translations: {
    locale: Locale;
    name: string;
    description: string | null;
  }[];
  route_stops: {
    id: string;
    place_id: string;
    position: number;
    places: { place_translations: { name: string; locale: Locale }[] } | null;
  }[];
}

const EMPTY_ROUTE_TRANSLATION: AdminRouteTranslation = {
  name: "",
  description: null,
};

export async function getAdminRouteById(
  id: string,
): Promise<AdminRouteDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select<typeof ADMIN_ROUTE_DETAIL_QUERY, AdminRouteDetailQueryResult>(
      ADMIN_ROUTE_DETAIL_QUERY,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const translations: Record<Locale, AdminRouteTranslation> = {
    es: { ...EMPTY_ROUTE_TRANSLATION },
    en: { ...EMPTY_ROUTE_TRANSLATION },
  };
  for (const translation of data.route_translations) {
    translations[translation.locale] = {
      name: translation.name,
      description: translation.description,
    };
  }

  const stops = (data.route_stops ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((stop) => ({
      id: stop.id,
      placeId: stop.place_id,
      placeName:
        stop.places?.place_translations.find((t) => t.locale === "es")?.name ??
        "",
      position: stop.position,
    }));

  return {
    id: data.id,
    slug: data.slug,
    estimatedDurationMinutes: data.estimated_duration_minutes,
    coverImageUrl: data.cover_image,
    publicationStatus: data.publication_status,
    verificationStatus: data.verification_status,
    translations,
    stops,
  };
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
      photoUrl:
        route.cover_image ?? pickRouteCoverPhoto(route.route_stops ?? []),
    };
  });
}
