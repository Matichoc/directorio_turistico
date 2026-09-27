import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale } from "@/types/database";
import type { Sponsor } from "@/types/domain";

const SPONSORS_QUERY =
  `id, slug, logo_path, website_url, instagram_url, position,
   sponsor_translations!inner(name, tagline, locale)` as const;

interface SponsorQueryResult {
  id: string;
  slug: string;
  logo_path: string;
  website_url: string | null;
  instagram_url: string | null;
  position: number;
  sponsor_translations: { name: string; tagline: string | null }[];
}

/**
 * Auspiciadores activos, ordenados para el banner rotativo
 * (`SponsorBanner`) — antes un solo slot fijo (Matichoc, hardcodeado por
 * env vars), ahora datos reales para poder sumar más de uno.
 */
export async function listActiveSponsors(locale: Locale): Promise<Sponsor[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .select<typeof SPONSORS_QUERY, SponsorQueryResult>(SPONSORS_QUERY)
    .eq("active", true)
    .eq("sponsor_translations.locale", locale)
    .order("position");

  if (error || !data) return [];

  return data.map((sponsor) => ({
    id: sponsor.id,
    slug: sponsor.slug,
    name: sponsor.sponsor_translations[0]?.name ?? sponsor.slug,
    tagline: sponsor.sponsor_translations[0]?.tagline ?? null,
    logoPath: sponsor.logo_path,
    websiteUrl: sponsor.website_url,
    instagramUrl: sponsor.instagram_url,
  }));
}
