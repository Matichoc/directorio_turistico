import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export async function listTags(): Promise<Tag[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, name")
    .order("name");

  if (error || !data) {
    return [];
  }

  return data;
}
