import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { cachedContent } from "@/lib/data/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isSiteScoped, SITE_COMMUNE_SLUGS } from "@/lib/site-scope";
import { contentLocales, pickTranslation } from "@/i18n/content";
import type { Locale } from "@/types/database";
import type { SiteEvent } from "@/types/domain";

const EVENTS_QUERY = `id, slug, starts_on, ends_on, start_time, usual_month,
   usual_month_end, organizer, source_url, source_label, cover_image,
   event_translations!inner(name, description, when_note, locale),
   communes!inner(slug),
   localities(slug, locality_translations(name, locale)),
   places(slug, place_translations(name, locale))` as const;

interface EventQueryResult {
  id: string;
  slug: string;
  starts_on: string | null;
  ends_on: string | null;
  start_time: string | null;
  usual_month: number | null;
  usual_month_end: number | null;
  organizer: string | null;
  source_url: string | null;
  source_label: string | null;
  cover_image: string | null;
  event_translations: {
    name: string;
    description: string | null;
    when_note: string | null;
    locale: Locale;
  }[];
  communes: { slug: string } | null;
  localities: {
    slug: string;
    locality_translations: { name: string; locale: Locale }[];
  } | null;
  places: {
    slug: string;
    place_translations: { name: string; locale: Locale }[];
  } | null;
}

function mapEvent(row: EventQueryResult, locale: Locale): SiteEvent {
  const translation = pickTranslation(row.event_translations, locale);
  const localityName = pickTranslation(
    row.localities?.locality_translations,
    locale,
  )?.name;
  const placeName = pickTranslation(
    row.places?.place_translations,
    locale,
  )?.name;
  return {
    id: row.id,
    slug: row.slug,
    name: translation?.name ?? row.slug,
    description: translation?.description ?? null,
    whenNote: translation?.when_note ?? null,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    startTime: row.start_time ? row.start_time.slice(0, 5) : null,
    usualMonth: row.usual_month,
    usualMonthEnd: row.usual_month_end,
    organizer: row.organizer,
    sourceUrl: row.source_url,
    sourceLabel: row.source_label,
    coverImage: row.cover_image,
    // Solo se enlaza lo que existe y se ve en el sitio (un lugar en
    // borrador no llega por la RLS): nunca un link a una página vacía.
    locality:
      row.localities && localityName
        ? { slug: row.localities.slug, name: localityName }
        : null,
    place:
      row.places && placeName
        ? { slug: row.places.slug, name: placeName }
        : null,
  };
}

/**
 * Todos los eventos publicados de la comuna (página /eventos, inicio y
 * fichas de pueblo y de lugar). Son pocos: cada vista filtra de esta lista.
 * Sin la tabla todavía (SQL sin correr) devuelve una lista vacía y el sitio
 * simplemente no muestra eventos.
 */
async function listEventsUncached(locale: Locale): Promise<SiteEvent[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createPublicClient();
  let builder = supabase
    .from("events")
    .select<typeof EVENTS_QUERY, EventQueryResult>(EVENTS_QUERY)
    .eq("published", true)
    .in("event_translations.locale", contentLocales(locale));
  if (isSiteScoped()) {
    builder = builder.in("communes.slug", SITE_COMMUNE_SLUGS);
  }
  const { data, error } = await builder;

  if (error || !data) {
    if (error) console.error("listEvents:", error.message);
    return [];
  }

  return data.map((row) => mapEvent(row, locale));
}
export const listEvents = cachedContent(listEventsUncached, "listEvents");

export interface AdminEventListItem {
  id: string;
  slug: string;
  name: string;
  startsOn: string | null;
  usualMonth: number | null;
  published: boolean;
  hasSource: boolean;
}

const ADMIN_EVENTS_LIST_QUERY = `id, slug, starts_on, usual_month, published,
   source_url, event_translations!inner(name, locale),
   communes!inner(slug)` as const;

interface AdminEventListQueryResult {
  id: string;
  slug: string;
  starts_on: string | null;
  usual_month: number | null;
  published: boolean;
  source_url: string | null;
  event_translations: { name: string; locale: Locale }[];
  communes: { slug: string } | null;
}

/** Todos los eventos (panel), también los no publicados — en español. */
export async function listAdminEvents(): Promise<AdminEventListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  let builder = supabase
    .from("events")
    .select<typeof ADMIN_EVENTS_LIST_QUERY, AdminEventListQueryResult>(
      ADMIN_EVENTS_LIST_QUERY,
    )
    .eq("event_translations.locale", "es");
  if (isSiteScoped()) {
    builder = builder.in("communes.slug", SITE_COMMUNE_SLUGS);
  }
  const { data, error } = await builder;

  if (error || !data) {
    if (error) console.error("listAdminEvents:", error.message);
    return [];
  }

  return data
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.event_translations[0]?.name ?? row.slug,
      startsOn: row.starts_on,
      usualMonth: row.usual_month,
      published: row.published,
      hasSource: Boolean(row.source_url),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export interface AdminEventTranslation {
  name: string;
  description: string | null;
  whenNote: string | null;
}

export interface AdminEventDetail {
  id: string;
  slug: string;
  communeId: string;
  localityId: string | null;
  placeId: string | null;
  startsOn: string | null;
  endsOn: string | null;
  startTime: string | null;
  usualMonth: number | null;
  usualMonthEnd: number | null;
  organizer: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  coverImage: string | null;
  published: boolean;
  translations: Record<Locale, AdminEventTranslation>;
}

const ADMIN_EVENT_DETAIL_QUERY = `id, slug, commune_id, locality_id, place_id,
   starts_on, ends_on, start_time, usual_month, usual_month_end, organizer,
   source_url, source_label, cover_image, published,
   event_translations(locale, name, description, when_note)` as const;

interface AdminEventDetailQueryResult {
  id: string;
  slug: string;
  commune_id: string;
  locality_id: string | null;
  place_id: string | null;
  starts_on: string | null;
  ends_on: string | null;
  start_time: string | null;
  usual_month: number | null;
  usual_month_end: number | null;
  organizer: string | null;
  source_url: string | null;
  source_label: string | null;
  cover_image: string | null;
  published: boolean;
  event_translations: {
    locale: Locale;
    name: string;
    description: string | null;
    when_note: string | null;
  }[];
}

const EMPTY_EVENT_TRANSLATION: AdminEventTranslation = {
  name: "",
  description: null,
  whenNote: null,
};

export async function getAdminEventById(
  id: string,
): Promise<AdminEventDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select<typeof ADMIN_EVENT_DETAIL_QUERY, AdminEventDetailQueryResult>(
      ADMIN_EVENT_DETAIL_QUERY,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const translations: Record<Locale, AdminEventTranslation> = {
    es: { ...EMPTY_EVENT_TRANSLATION },
    en: { ...EMPTY_EVENT_TRANSLATION },
    pt: { ...EMPTY_EVENT_TRANSLATION },
  };
  for (const translation of data.event_translations) {
    translations[translation.locale] = {
      name: translation.name,
      description: translation.description,
      whenNote: translation.when_note,
    };
  }

  return {
    id: data.id,
    slug: data.slug,
    communeId: data.commune_id,
    localityId: data.locality_id,
    placeId: data.place_id,
    startsOn: data.starts_on,
    endsOn: data.ends_on,
    startTime: data.start_time ? data.start_time.slice(0, 5) : null,
    usualMonth: data.usual_month,
    usualMonthEnd: data.usual_month_end,
    organizer: data.organizer,
    sourceUrl: data.source_url,
    sourceLabel: data.source_label,
    coverImage: data.cover_image,
    published: data.published,
    translations,
  };
}
