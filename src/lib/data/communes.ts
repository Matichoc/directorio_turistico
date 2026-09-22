import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale } from "@/types/database";
import type { Commune } from "@/types/domain";

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
