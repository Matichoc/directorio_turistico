import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listPlacesByLocalityId } from "@/lib/data/places";
import type { Locale } from "@/types/database";
import type { Locality, LocalityWithPlaces } from "@/types/domain";

const LOCALITIES_QUERY =
  `id, slug, latitude, longitude, summary_source_url, summary_source_label,
   locality_translations!inner(name, summary, locale),
   communes!inner(id, commune_translations!inner(name, locale))` as const;

interface LocalityQueryResult {
  id: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  summary_source_url: string | null;
  summary_source_label: string | null;
  locality_translations: {
    name: string;
    summary: string | null;
    locale: Locale;
  }[];
  communes: {
    id: string;
    commune_translations: { name: string; locale: Locale }[];
  } | null;
}

function mapLocality(row: LocalityQueryResult): Locality {
  const translation = row.locality_translations[0];
  return {
    id: row.id,
    slug: row.slug,
    name: translation?.name ?? row.slug,
    summary: translation?.summary ?? null,
    // La fuente describe el resumen: sin resumen en este idioma no hay
    // nada que citar (los resúmenes se cargan solo en español).
    summarySourceUrl: translation?.summary ? row.summary_source_url : null,
    summarySourceLabel: translation?.summary ? row.summary_source_label : null,
    communeId: row.communes?.id ?? "",
    communeName: row.communes?.commune_translations[0]?.name ?? "",
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

/** Todos los pueblos, para `/pueblos` (agrupados por comuna en la página). */
export async function listLocalities(locale: Locale): Promise<Locality[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("localities")
    .select<typeof LOCALITIES_QUERY, LocalityQueryResult>(LOCALITIES_QUERY)
    .eq("locality_translations.locale", locale)
    .eq("communes.commune_translations.locale", locale);

  if (error || !data) {
    return [];
  }

  return data
    .map(mapLocality)
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function getLocalityBySlug(
  slug: string,
  locale: Locale,
): Promise<LocalityWithPlaces | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("localities")
    .select<typeof LOCALITIES_QUERY, LocalityQueryResult>(LOCALITIES_QUERY)
    .eq("slug", slug)
    .eq("locality_translations.locale", locale)
    .eq("communes.commune_translations.locale", locale)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const locality = mapLocality(data);
  const places = await listPlacesByLocalityId(locality.id, locale);

  return { ...locality, places };
}

export interface AdminLocalityListItem {
  id: string;
  slug: string;
  name: string;
  communeName: string;
  placesCount: number;
  /** Cobertura de contenido: qué le falta todavía a la ficha del pueblo. */
  hasSummary: boolean;
  hasCoordinates: boolean;
}

const ADMIN_LOCALITIES_LIST_QUERY = `id, slug, latitude, longitude,
   locality_translations!inner(name, summary, locale),
   communes!inner(commune_translations!inner(name, locale)),
   places(id)` as const;

interface AdminLocalityListQueryResult {
  id: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  locality_translations: {
    name: string;
    summary: string | null;
    locale: Locale;
  }[];
  communes: { commune_translations: { name: string; locale: Locale }[] } | null;
  places: { id: string }[];
}

/** Todos los pueblos (panel admin) — siempre en español, igual que el resto del panel. */
export async function listAdminLocalities(): Promise<AdminLocalityListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("localities")
    .select<typeof ADMIN_LOCALITIES_LIST_QUERY, AdminLocalityListQueryResult>(
      ADMIN_LOCALITIES_LIST_QUERY,
    )
    .eq("locality_translations.locale", "es")
    .eq("communes.commune_translations.locale", "es")
    .order("slug");

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.locality_translations[0]?.name ?? row.slug,
      communeName: row.communes?.commune_translations[0]?.name ?? "",
      placesCount: row.places?.length ?? 0,
      hasSummary: Boolean(row.locality_translations[0]?.summary),
      hasCoordinates: row.latitude !== null && row.longitude !== null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export interface AdminLocalityTranslation {
  name: string;
  summary: string | null;
}

export interface AdminLocalityDetail {
  id: string;
  slug: string;
  communeId: string;
  latitude: number | null;
  longitude: number | null;
  summarySourceUrl: string | null;
  summarySourceLabel: string | null;
  translations: Record<Locale, AdminLocalityTranslation>;
}

const ADMIN_LOCALITY_DETAIL_QUERY = `id, slug, commune_id, latitude, longitude,
   summary_source_url, summary_source_label,
   locality_translations(locale, name, summary)` as const;

interface AdminLocalityDetailQueryResult {
  id: string;
  slug: string;
  commune_id: string;
  latitude: number | null;
  longitude: number | null;
  summary_source_url: string | null;
  summary_source_label: string | null;
  locality_translations: {
    locale: Locale;
    name: string;
    summary: string | null;
  }[];
}

const EMPTY_LOCALITY_TRANSLATION: AdminLocalityTranslation = {
  name: "",
  summary: null,
};

export async function getAdminLocalityById(
  id: string,
): Promise<AdminLocalityDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("localities")
    .select<typeof ADMIN_LOCALITY_DETAIL_QUERY, AdminLocalityDetailQueryResult>(
      ADMIN_LOCALITY_DETAIL_QUERY,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const translations: Record<Locale, AdminLocalityTranslation> = {
    es: { ...EMPTY_LOCALITY_TRANSLATION },
    en: { ...EMPTY_LOCALITY_TRANSLATION },
  };
  for (const translation of data.locality_translations) {
    translations[translation.locale] = {
      name: translation.name,
      summary: translation.summary,
    };
  }

  return {
    id: data.id,
    slug: data.slug,
    communeId: data.commune_id,
    latitude: data.latitude,
    longitude: data.longitude,
    summarySourceUrl: data.summary_source_url,
    summarySourceLabel: data.summary_source_label,
    translations,
  };
}

export interface LocalityOption {
  id: string;
  slug: string;
  name: string;
  communeId: string;
  communeName: string;
}

const LOCALITY_OPTIONS_QUERY = `id, slug, commune_id,
   locality_translations!inner(name, locale),
   communes!inner(commune_translations!inner(name, locale))` as const;

interface LocalityOptionQueryResult {
  id: string;
  slug: string;
  commune_id: string;
  locality_translations: { name: string; locale: Locale }[];
  communes: { commune_translations: { name: string; locale: Locale }[] } | null;
}

/**
 * Lista liviana de pueblos para selects (formulario de lugar, carga CSV) —
 * siempre en español, agrupable por comuna en el UI.
 */
export async function listLocalityOptions(): Promise<LocalityOption[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("localities")
    .select<typeof LOCALITY_OPTIONS_QUERY, LocalityOptionQueryResult>(
      LOCALITY_OPTIONS_QUERY,
    )
    .eq("locality_translations.locale", "es")
    .eq("communes.commune_translations.locale", "es");

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.locality_translations[0]?.name ?? row.slug,
      communeId: row.commune_id,
      communeName: row.communes?.commune_translations[0]?.name ?? "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
