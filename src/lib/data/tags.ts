import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { cachedContent } from "@/lib/data/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

async function listTagsUncached(): Promise<Tag[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, name")
    .order("name");

  if (error || !data) {
    return [];
  }

  return data;
}
export const listTags = cachedContent(listTagsUncached, "listTags");
