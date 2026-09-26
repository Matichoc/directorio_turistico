import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale } from "@/types/database";

export interface PlaceComment {
  id: string;
  body: string;
  createdAt: string;
}

/** Comentarios ya aprobados de un lugar — para la ficha pública. */
export async function listApprovedComments(
  placeId: string,
): Promise<PlaceComment[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("place_comments")
    .select("id, body, created_at")
    .eq("place_id", placeId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((comment) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.created_at,
  }));
}

const PENDING_COMMENTS_QUERY =
  `id, body, created_at, places(slug, place_translations(name, locale))` as const;

interface PendingCommentQueryResult {
  id: string;
  body: string;
  created_at: string;
  places: {
    slug: string;
    place_translations: { name: string; locale: Locale }[];
  } | null;
}

export interface PendingComment {
  id: string;
  body: string;
  createdAt: string;
  placeSlug: string;
  placeName: string;
}

/**
 * Cola de comentarios pendientes de moderar, con el lugar al que
 * corresponden — solo para `/admin/verificaciones`. La política RLS de
 * `place_comments` ya restringe esto a sesiones de administrador
 * (`public.is_admin()`); si quien llama no lo es, simplemente no ve filas.
 */
export async function listPendingComments(): Promise<PendingComment[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("place_comments")
    .select<typeof PENDING_COMMENTS_QUERY, PendingCommentQueryResult>(
      PENDING_COMMENTS_QUERY,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((comment) => {
    const translation =
      comment.places?.place_translations.find((t) => t.locale === "es") ??
      comment.places?.place_translations[0];

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      placeSlug: comment.places?.slug ?? "",
      placeName: translation?.name ?? "—",
    };
  });
}
