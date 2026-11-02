import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { cachedContent } from "@/lib/data/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isSiteScoped, SITE_COMMUNE_SLUGS } from "@/lib/site-scope";
import type { Locale } from "@/types/database";
import type { Commune, Municipality } from "@/types/domain";
import { contentLocales, pickTranslation } from "@/i18n/content";

const COMMUNES_QUERY =
  `id, slug, commune_translations!inner(name, locale)` as const;

interface CommuneQueryResult {
  id: string;
  slug: string;
  commune_translations: { name: string; locale: Locale }[];
}

async function listCommunesUncached(locale: Locale): Promise<Commune[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createPublicClient();
  let builder = supabase
    .from("communes")
    .select<typeof COMMUNES_QUERY, CommuneQueryResult>(COMMUNES_QUERY)
    .in("commune_translations.locale", contentLocales(locale))
    .order("slug");
  if (isSiteScoped()) {
    builder = builder.in("slug", SITE_COMMUNE_SLUGS);
  }
  const { data, error } = await builder;

  if (error || !data) {
    return [];
  }

  return data
    .map((commune) => ({
      id: commune.id,
      slug: commune.slug,
      name:
        pickTranslation(commune.commune_translations, locale)?.name ??
        commune.slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
export const listCommunes = cachedContent(listCommunesUncached, "listCommunes");

interface ContactLinkQueryResult {
  entity_id: string;
  kind: string;
  value: string;
  label: string | null;
}

/**
 * Comunas + sus enlaces de contacto/redes reales (`contact_links`, ver
 * migración `0013_contact_links.sql`) — usado por `MunicipalityBanner` en
 * el home. Una comuna sin enlaces cargados todavía devuelve `links: []`
 * (el banner la muestra igual, sin inventar nada) en vez de excluirla.
 */
async function listMunicipalitiesUncached(
  locale: Locale,
): Promise<Municipality[]> {
  const communes = await listCommunes(locale);
  if (communes.length === 0 || !isSupabaseConfigured()) {
    return communes.map((commune) => ({ ...commune, links: [] }));
  }

  const supabase = createPublicClient();
  const { data: links } = await supabase
    .from("contact_links")
    .select<"entity_id, kind, value, label", ContactLinkQueryResult>(
      "entity_id, kind, value, label",
    )
    .eq("entity_type", "commune")
    .order("position");

  return communes.map((commune) => ({
    ...commune,
    links: (links ?? [])
      .filter((link) => link.entity_id === commune.id)
      .map(({ kind, value, label }) => ({ kind, value, label })),
  }));
}
export const listMunicipalities = cachedContent(
  listMunicipalitiesUncached,
  "listMunicipalities",
);
