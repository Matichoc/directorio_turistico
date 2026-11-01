import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  isCommuneInScope,
  isSiteScoped,
  SITE_COMMUNE_SLUGS,
} from "@/lib/site-scope";
import type {
  Locale,
  PublicationStatus,
  VerificationStatus,
} from "@/types/database";
import type { Place, PlaceCard, PlaceFilters } from "@/types/domain";

interface PlaceImageResult {
  storage_path: string;
  alt_text: string | null;
  position: number;
}

/** Fotos ordenadas por `position` (0 o más `place_images` por lugar). */
function sortPhotos(images: PlaceImageResult[] | null | undefined) {
  return (images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((image) => ({ url: image.storage_path, attribution: image.alt_text }));
}

/**
 * Posición publicitaria pagada (gestionada a mano por el dueño del sitio,
 * sin pasarela de pago — ver docs/PLAN.md): `featured_until` nulo o en el
 * pasado no cuenta como destacado.
 */
function isCurrentlyFeatured(featuredUntil: string | null): boolean {
  return Boolean(
    featuredUntil && new Date(featuredUntil).getTime() > Date.now(),
  );
}

const PLACE_QUERY =
  `id, slug, commune_id, category_id, locality_id, latitude, longitude, address,
   phone, website, featured_until, icon, publication_status, verification_status,
   place_translations!inner(name, short_description, description, locale),
   communes!inner(slug, commune_translations!inner(name, locale)),
   localities(slug, locality_translations(name, locale)),
   categories!inner(slug, category_translations!inner(name, locale)),
   place_tags(tags(slug)),
   place_images(storage_path, alt_text, position)` as const;

interface PlaceQueryResult {
  id: string;
  slug: string;
  commune_id: string;
  category_id: string;
  locality_id: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  featured_until: string | null;
  icon: string | null;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  place_translations: {
    name: string;
    short_description: string | null;
    description: string | null;
    locale: Locale;
  }[];
  communes: {
    slug: string;
    commune_translations: { name: string; locale: Locale }[];
  } | null;
  localities: {
    slug: string;
    locality_translations: { name: string; locale: Locale }[];
  } | null;
  categories: {
    slug: string;
    category_translations: { name: string; locale: Locale }[];
  } | null;
  place_tags: { tags: { slug: string } | null }[];
  place_images: PlaceImageResult[];
}

export async function getPlaceBySlug(
  slug: string,
  locale: Locale,
): Promise<Place | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select<typeof PLACE_QUERY, PlaceQueryResult>(PLACE_QUERY)
    .eq("slug", slug)
    .eq("place_translations.locale", locale)
    .eq("communes.commune_translations.locale", locale)
    .eq("categories.category_translations.locale", locale)
    .eq("publication_status", "published")
    .maybeSingle();

  // Fuera del alcance del sitio (ver lib/site-scope.ts): como si no existiera.
  if (error || !data || !isCommuneInScope(data.communes?.slug)) {
    return null;
  }

  const translation = data.place_translations[0];

  return {
    id: data.id,
    slug: data.slug,
    name: translation?.name ?? slug,
    description: translation?.description ?? null,
    shortDescription: translation?.short_description ?? null,
    communeId: data.commune_id,
    communeName: data.communes?.commune_translations[0]?.name ?? "",
    localityId: data.locality_id,
    localityName:
      data.localities?.locality_translations.find((t) => t.locale === locale)
        ?.name ?? null,
    localitySlug: data.localities?.slug ?? null,
    categoryId: data.category_id,
    categoryName: data.categories?.category_translations[0]?.name ?? "",
    categorySlug: data.categories?.slug ?? "",
    icon: data.icon,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address,
    phone: data.phone,
    website: data.website,
    photos: sortPhotos(data.place_images),
    isFeatured: isCurrentlyFeatured(data.featured_until),
    publicationStatus: data.publication_status,
    verificationStatus: data.verification_status,
    tags: (data.place_tags ?? [])
      .map((placeTag) => placeTag.tags?.slug)
      .filter((tagSlug): tagSlug is string => Boolean(tagSlug)),
  };
}

const PLACES_LIST_QUERY =
  `id, slug, latitude, longitude, featured_until, icon, verification_status,
   place_translations!inner(name, short_description, locale),
   communes!inner(slug, commune_translations!inner(name, locale)),
   localities(slug, locality_translations(name, locale)),
   categories!inner(slug, category_translations!inner(name, locale)),
   place_tags(tags(slug)),
   place_images(storage_path, alt_text, position)` as const;

interface PlaceListQueryResult {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  featured_until: string | null;
  icon: string | null;
  verification_status: VerificationStatus;
  place_translations: {
    name: string;
    short_description: string | null;
    locale: Locale;
  }[];
  communes: {
    slug: string;
    commune_translations: { name: string; locale: Locale }[];
  } | null;
  localities: {
    slug: string;
    locality_translations: { name: string; locale: Locale }[];
  } | null;
  categories: {
    slug: string;
    category_translations: { name: string; locale: Locale }[];
  } | null;
  place_tags: { tags: { slug: string } | null }[];
  place_images: PlaceImageResult[];
}

/**
 * Categorías adicionales de cada lugar (`place_secondary_categories`), por
 * id de lugar. Consulta aparte a propósito: si la tabla todavía no existe en
 * una base (ver supabase/manual/categorias-petorca.sql), el sitio sigue
 * funcionando con la categoría principal de cada lugar.
 */
async function loadSecondaryCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from("place_secondary_categories")
    .select<
      "place_id, categories(slug)",
      { place_id: string; categories: { slug: string } | null }
    >("place_id, categories(slug)");
  const byPlace = new Map<string, string[]>();
  if (error || !data) return byPlace;
  for (const row of data) {
    if (!row.categories) continue;
    byPlace.set(row.place_id, [
      ...(byPlace.get(row.place_id) ?? []),
      row.categories.slug,
    ]);
  }
  return byPlace;
}

/** Principal primero, sin repetir. */
function allCategorySlugs(primary: string, secondary: string[] = []) {
  return [...new Set([primary, ...secondary].filter(Boolean))];
}

function mapPlaceCard(
  place: PlaceListQueryResult,
  locale: Locale,
  secondary: Map<string, string[]> = new Map(),
): PlaceCard {
  const translation = place.place_translations[0];
  return {
    id: place.id,
    slug: place.slug,
    name: translation?.name ?? place.slug,
    shortDescription: translation?.short_description ?? null,
    communeName: place.communes?.commune_translations[0]?.name ?? "",
    localityName:
      place.localities?.locality_translations.find((t) => t.locale === locale)
        ?.name ?? null,
    localitySlug: place.localities?.slug ?? null,
    categoryName: place.categories?.category_translations[0]?.name ?? "",
    categorySlug: place.categories?.slug ?? "",
    categorySlugs: allCategorySlugs(
      place.categories?.slug ?? "",
      secondary.get(place.id),
    ),
    icon: place.icon,
    latitude: place.latitude,
    longitude: place.longitude,
    verificationStatus: place.verification_status,
    isFeatured: isCurrentlyFeatured(place.featured_until),
    photoUrl: sortPhotos(place.place_images)[0]?.url ?? null,
    photoCount: place.place_images?.length ?? 0,
    tags: (place.place_tags ?? [])
      .map((placeTag) => placeTag.tags?.slug)
      .filter((tagSlug): tagSlug is string => Boolean(tagSlug)),
  };
}

/**
 * Lista lugares publicados. Los filtros por categoría (principal o
 * adicional), `tagSlug` y `query` (nombre) se aplican en memoria después de
 * traer los resultados: a la escala actual del catálogo (decenas de lugares)
 * es más simple que armar un `!inner` dinámico en PostgREST. Si el catálogo
 * crece mucho, moverlos a la consulta.
 */
export async function listPlaces(
  locale: Locale,
  filters: PlaceFilters = {},
): Promise<PlaceCard[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  let builder = supabase
    .from("places")
    .select<typeof PLACES_LIST_QUERY, PlaceListQueryResult>(PLACES_LIST_QUERY)
    .eq("publication_status", "published")
    .eq("place_translations.locale", locale)
    .eq("communes.commune_translations.locale", locale)
    .eq("categories.category_translations.locale", locale);

  if (filters.communeSlug) {
    builder = builder.eq("communes.slug", filters.communeSlug);
  }
  if (isSiteScoped()) {
    builder = builder.in("communes.slug", SITE_COMMUNE_SLUGS);
  }

  const [{ data, error }, secondary] = await Promise.all([
    builder,
    loadSecondaryCategories(supabase),
  ]);

  if (error || !data) {
    return [];
  }

  const query = filters.query?.trim().toLowerCase();

  return data
    .map((place) => mapPlaceCard(place, locale, secondary))
    .filter((place) => {
      if (
        filters.categorySlug &&
        !place.categorySlugs.includes(filters.categorySlug)
      ) {
        return false;
      }
      if (filters.tagSlug && !place.tags.includes(filters.tagSlug)) {
        return false;
      }
      if (query) {
        const haystack =
          `${place.name} ${place.communeName} ${place.shortDescription ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }
      return a.name.localeCompare(b.name, locale);
    });
}

/** Lugares publicados que pertenecen a un pueblo (`locality_id`) — ficha de pueblo. */
export async function listPlacesByLocalityId(
  localityId: string,
  locale: Locale,
): Promise<PlaceCard[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  let builder = supabase
    .from("places")
    .select<typeof PLACES_LIST_QUERY, PlaceListQueryResult>(PLACES_LIST_QUERY)
    .eq("locality_id", localityId)
    .eq("publication_status", "published")
    .eq("place_translations.locale", locale)
    .eq("communes.commune_translations.locale", locale)
    .eq("categories.category_translations.locale", locale);
  if (isSiteScoped()) {
    builder = builder.in("communes.slug", SITE_COMMUNE_SLUGS);
  }
  const { data, error } = await builder;

  if (error || !data) {
    return [];
  }

  return data
    .map((place) => mapPlaceCard(place, locale))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * Trae lugares publicados por `id` (para el carrito de recorrido, que
 * guarda ids en `localStorage` — ver `lib/trip/storage.ts`). El orden de
 * salida no sigue el de `ids`: quien llama reordena si lo necesita.
 */
export interface AdminPlaceListItem {
  id: string;
  slug: string;
  name: string;
  communeName: string;
  categoryName: string;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  statusChangedAt: string;
}

const ADMIN_PLACES_LIST_QUERY =
  `id, slug, publication_status, verification_status, status_changed_at,
   place_translations!inner(name, locale),
   communes!inner(commune_translations!inner(name, locale)),
   categories!inner(category_translations!inner(name, locale))` as const;

interface AdminPlaceListQueryResult {
  id: string;
  slug: string;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  status_changed_at: string;
  place_translations: { name: string; locale: Locale }[];
  communes: { commune_translations: { name: string; locale: Locale }[] } | null;
  categories: {
    category_translations: { name: string; locale: Locale }[];
  } | null;
}

/**
 * Lista TODOS los lugares (cualquier `publication_status`) para el panel
 * admin — a diferencia de `listPlaces`, que solo muestra publicados. El
 * panel administra en español únicamente (ver CLAUDE.md: Cristóbal siempre
 * en español), así que se filtra a esa traducción sin recibir `locale`.
 */
export async function listAdminPlaces(): Promise<AdminPlaceListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select<typeof ADMIN_PLACES_LIST_QUERY, AdminPlaceListQueryResult>(
      ADMIN_PLACES_LIST_QUERY,
    )
    .eq("place_translations.locale", "es")
    .eq("communes.commune_translations.locale", "es")
    .eq("categories.category_translations.locale", "es")
    .order("slug");

  if (error || !data) {
    return [];
  }

  return data.map((place) => ({
    id: place.id,
    slug: place.slug,
    name: place.place_translations[0]?.name ?? place.slug,
    communeName: place.communes?.commune_translations[0]?.name ?? "",
    categoryName: place.categories?.category_translations[0]?.name ?? "",
    publicationStatus: place.publication_status,
    verificationStatus: place.verification_status,
    statusChangedAt: place.status_changed_at,
  }));
}

/**
 * slug→id (y estado actual) de todos los lugares, para la carga masiva:
 * decide alta vs. edición por slug, y deja saber el estado vigente de un
 * lugar existente para no pisarlo cuando la fila no trae columna "estado"
 * (ver `importPlacesCsv`).
 */
export async function listAllPlacesForImport(): Promise<
  { id: string; slug: string; publicationStatus: PublicationStatus }[]
> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select("id, slug, publication_status");

  if (error || !data) {
    return [];
  }

  return data.map((place) => ({
    id: place.id,
    slug: place.slug,
    publicationStatus: place.publication_status,
  }));
}

export interface AdminPlaceTranslation {
  name: string;
  shortDescription: string | null;
  description: string | null;
}

export interface AdminPlaceDetail {
  id: string;
  slug: string;
  communeId: string;
  localityId: string | null;
  categoryId: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  icon: string | null;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  translations: Record<Locale, AdminPlaceTranslation>;
  /** Categorías adicionales (`place_secondary_categories`). */
  secondaryCategoryIds: string[];
}

const ADMIN_PLACE_DETAIL_QUERY =
  `id, slug, commune_id, category_id, locality_id, latitude, longitude, address, phone,
   website, icon, publication_status, verification_status,
   place_translations(locale, name, short_description, description)` as const;

interface AdminPlaceDetailQueryResult {
  id: string;
  slug: string;
  commune_id: string;
  category_id: string;
  locality_id: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  icon: string | null;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  place_translations: {
    locale: Locale;
    name: string;
    short_description: string | null;
    description: string | null;
  }[];
}

const EMPTY_TRANSLATION: AdminPlaceTranslation = {
  name: "",
  shortDescription: null,
  description: null,
};

export async function getAdminPlaceById(
  id: string,
): Promise<AdminPlaceDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select<typeof ADMIN_PLACE_DETAIL_QUERY, AdminPlaceDetailQueryResult>(
      ADMIN_PLACE_DETAIL_QUERY,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Aparte: si la tabla todavía no existe en esta base, sin adicionales.
  const { data: secondary } = await supabase
    .from("place_secondary_categories")
    .select("category_id")
    .eq("place_id", id);

  const translations: Record<Locale, AdminPlaceTranslation> = {
    es: { ...EMPTY_TRANSLATION },
    en: { ...EMPTY_TRANSLATION },
  };
  for (const translation of data.place_translations) {
    translations[translation.locale] = {
      name: translation.name,
      shortDescription: translation.short_description,
      description: translation.description,
    };
  }

  return {
    id: data.id,
    slug: data.slug,
    communeId: data.commune_id,
    localityId: data.locality_id,
    categoryId: data.category_id,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address,
    phone: data.phone,
    website: data.website,
    icon: data.icon,
    publicationStatus: data.publication_status,
    verificationStatus: data.verification_status,
    translations,
    secondaryCategoryIds: (secondary ?? []).map((row) => row.category_id),
  };
}

export async function getPlacesByIds(
  ids: string[],
  locale: Locale,
): Promise<PlaceCard[]> {
  if (!isSupabaseConfigured() || ids.length === 0) {
    return [];
  }

  const supabase = await createClient();
  // Un recorrido armado antes de acotar el sitio puede traer lugares de otra
  // comuna: quedan fuera, igual que en el resto del sitio.
  let builder = supabase
    .from("places")
    .select<typeof PLACES_LIST_QUERY, PlaceListQueryResult>(PLACES_LIST_QUERY)
    .in("id", ids)
    .eq("publication_status", "published")
    .eq("place_translations.locale", locale)
    .eq("communes.commune_translations.locale", locale)
    .eq("categories.category_translations.locale", locale);
  if (isSiteScoped()) {
    builder = builder.in("communes.slug", SITE_COMMUNE_SLUGS);
  }
  const { data, error } = await builder;

  if (error || !data) {
    return [];
  }

  return data.map((place) => mapPlaceCard(place, locale));
}

/**
 * Lugares publicados por `slug`, en el mismo orden pedido — para un
 * recorrido compartido por link (`/recorrido/compartido?paradas=a,b,c`). Lo
 * que no existe o queda fuera del sitio (`lib/site-scope.ts`) se omite.
 */
export async function getPlacesBySlugs(
  slugs: string[],
  locale: Locale,
): Promise<PlaceCard[]> {
  if (!isSupabaseConfigured() || slugs.length === 0) {
    return [];
  }

  const supabase = await createClient();
  let builder = supabase
    .from("places")
    .select<typeof PLACES_LIST_QUERY, PlaceListQueryResult>(PLACES_LIST_QUERY)
    .in("slug", slugs)
    .eq("publication_status", "published")
    .eq("place_translations.locale", locale)
    .eq("communes.commune_translations.locale", locale)
    .eq("categories.category_translations.locale", locale);
  if (isSiteScoped()) {
    builder = builder.in("communes.slug", SITE_COMMUNE_SLUGS);
  }
  const { data, error } = await builder;

  if (error || !data) {
    return [];
  }

  const bySlug = new Map(
    data.map((place) => [place.slug, mapPlaceCard(place, locale)]),
  );
  return slugs.flatMap((slug) => {
    const place = bySlug.get(slug);
    return place ? [place] : [];
  });
}

export interface AdminPlaceExportRow {
  slug: string;
  communeName: string;
  localityName: string | null;
  categoryName: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  icon: string | null;
  publicationStatus: PublicationStatus;
  translations: Record<Locale, AdminPlaceTranslation>;
}

const ADMIN_PLACES_EXPORT_QUERY =
  `slug, latitude, longitude, address, phone, website, icon, publication_status,
   place_translations(locale, name, short_description, description),
   communes!inner(commune_translations!inner(name, locale)),
   localities(locality_translations(name, locale)),
   categories!inner(category_translations!inner(name, locale))` as const;

interface AdminPlaceExportQueryResult {
  slug: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  icon: string | null;
  publication_status: PublicationStatus;
  place_translations: {
    locale: Locale;
    name: string;
    short_description: string | null;
    description: string | null;
  }[];
  communes: { commune_translations: { name: string; locale: Locale }[] } | null;
  localities: {
    locality_translations: { name: string; locale: Locale }[];
  } | null;
  categories: {
    category_translations: { name: string; locale: Locale }[];
  } | null;
}

/** Todos los lugares con los campos necesarios para la plantilla de carga masiva. */
export async function listAdminPlacesForExport(): Promise<
  AdminPlaceExportRow[]
> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select<typeof ADMIN_PLACES_EXPORT_QUERY, AdminPlaceExportQueryResult>(
      ADMIN_PLACES_EXPORT_QUERY,
    )
    .eq("communes.commune_translations.locale", "es")
    .eq("categories.category_translations.locale", "es")
    .order("slug");

  if (error || !data) {
    return [];
  }

  return data.map((place) => {
    const translations: Record<Locale, AdminPlaceTranslation> = {
      es: { ...EMPTY_TRANSLATION },
      en: { ...EMPTY_TRANSLATION },
    };
    for (const translation of place.place_translations) {
      translations[translation.locale] = {
        name: translation.name,
        shortDescription: translation.short_description,
        description: translation.description,
      };
    }

    return {
      slug: place.slug,
      communeName: place.communes?.commune_translations[0]?.name ?? "",
      localityName:
        place.localities?.locality_translations.find((t) => t.locale === "es")
          ?.name ?? null,
      categoryName: place.categories?.category_translations[0]?.name ?? "",
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      phone: place.phone,
      website: place.website,
      icon: place.icon,
      publicationStatus: place.publication_status,
      translations,
    };
  });
}

export interface PlaceVerificationLog {
  verifiedAt: string;
  notes: string | null;
}

/**
 * Último registro de verificación de cada lugar (`verification_logs`),
 * por `placeId`. Un lugar verificado antes de que existiera el registro
 * (p. ej. por el seed) simplemente no aparece acá.
 */
export async function listLatestPlaceVerifications(): Promise<
  Record<string, PlaceVerificationLog>
> {
  if (!isSupabaseConfigured()) {
    return {};
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("verification_logs")
    .select("entity_id, notes, verified_at")
    .eq("entity_type", "place")
    .order("verified_at", { ascending: false });

  if (error || !data) {
    return {};
  }

  const latest: Record<string, PlaceVerificationLog> = {};
  for (const row of data) {
    // Ordenado de más nuevo a más viejo: el primero de cada lugar gana.
    latest[row.entity_id] ??= {
      verifiedAt: row.verified_at,
      notes: row.notes,
    };
  }
  return latest;
}
