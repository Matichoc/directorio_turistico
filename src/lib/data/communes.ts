import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale } from "@/types/database";
import type { Commune, Municipality } from "@/types/domain";

const COMMUNES_QUERY =
  `id, slug, commune_translations!inner(name, locale)` as const;

interface CommuneQueryResult {
  id: string;
  slug: string;
  commune_translations: { name: string; locale: Locale }[];
}

export async function listCommunes(locale: Locale): Promise<Commune[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communes")
    .select<typeof COMMUNES_QUERY, CommuneQueryResult>(COMMUNES_QUERY)
    .eq("commune_translations.locale", locale)
    .order("slug");

  if (error || !data) {
    return [];
  }

  return data
    .map((commune) => ({
      id: commune.id,
      slug: commune.slug,
      name: commune.commune_translations[0]?.name ?? commune.slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

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
export async function listMunicipalities(
  locale: Locale,
): Promise<Municipality[]> {
  const communes = await listCommunes(locale);
  if (communes.length === 0 || !isSupabaseConfigured()) {
    return communes.map((commune) => ({ ...commune, links: [] }));
  }

  const supabase = await createClient();
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
