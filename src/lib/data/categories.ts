import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Locale } from "@/types/database";
import type { Category } from "@/types/domain";

const CATEGORIES_QUERY =
  `id, slug, icon, category_translations!inner(name, locale)` as const;

interface CategoryQueryResult {
  id: string;
  slug: string;
  icon: string | null;
  category_translations: { name: string; locale: Locale }[];
}

export async function listCategories(locale: Locale): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select<typeof CATEGORIES_QUERY, CategoryQueryResult>(CATEGORIES_QUERY)
    .eq("category_translations.locale", locale)
    .order("slug");

  if (error || !data) {
    return [];
  }

  return data
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      icon: category.icon,
      name: category.category_translations[0]?.name ?? category.slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
