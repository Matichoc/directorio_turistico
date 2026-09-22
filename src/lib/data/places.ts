import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  Locale,
  PublicationStatus,
  VerificationStatus,
} from "@/types/database";
import type { Place } from "@/types/domain";

const PLACE_QUERY =
  `id, slug, commune_id, category_id, latitude, longitude, address,
   phone, website, publication_status, verification_status,
   place_translations!inner(name, short_description, description, locale),
   place_tags(tags(slug))` as const;

interface PlaceQueryResult {
  id: string;
  slug: string;
  commune_id: string;
  category_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  place_translations: {
    name: string;
    short_description: string | null;
    description: string | null;
    locale: Locale;
  }[];
  place_tags: { tags: { slug: string } | null }[];
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
    .eq("publication_status", "published")
    .maybeSingle();

  if (error || !data) {
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
    categoryId: data.category_id,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address,
    phone: data.phone,
    website: data.website,
    publicationStatus: data.publication_status,
    verificationStatus: data.verification_status,
    tags: (data.place_tags ?? [])
      .map((placeTag) => placeTag.tags?.slug)
      .filter((tagSlug): tagSlug is string => Boolean(tagSlug)),
  };
}
