"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import type { Category, Commune } from "@/types/domain";
import type { Tag } from "@/lib/data/tags";

export interface ExploreFiltersValue {
  q: string;
  comuna: string;
  categoria: string;
  caracteristica: string;
}

interface ExploreFiltersProps {
  value: ExploreFiltersValue;
  communes: Commune[];
  categories: Category[];
  tags: Tag[];
}

const PARAM_KEYS = ["q", "comuna", "categoria", "caracteristica"] as const;

export function ExploreFilters({
  value,
  communes,
  categories,
  tags,
}: ExploreFiltersProps) {
  const t = useTranslations("explore");
  const router = useRouter();
  const pathname = usePathname();

  function updateParam(key: (typeof PARAM_KEYS)[number], newValue: string) {
    const params = new URLSearchParams();
    for (const paramKey of PARAM_KEYS) {
      const current = paramKey === key ? newValue : value[paramKey];
      if (current) params.set(paramKey, current);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem(
      "q",
    ) as HTMLInputElement | null;
    updateParam("q", input?.value.trim() ?? "");
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <label className="flex-1 sm:min-w-48">
        <span className="sr-only">{t("searchPlaceholder")}</span>
        <input
          type="search"
          name="q"
          defaultValue={value.q}
          placeholder={t("searchPlaceholder")}
          className="focus:border-accent focus:ring-accent-soft w-full rounded-full border border-black/10 px-4 py-2 text-sm outline-none focus:ring-2 dark:border-white/20"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-foreground/60">{t("filters.commune")}</span>
        <select
          value={value.comuna}
          onChange={(event) => updateParam("comuna", event.target.value)}
          className="rounded border border-black/10 bg-transparent px-2 py-1.5 dark:border-white/20"
        >
          <option value="">—</option>
          {communes.map((commune) => (
            <option key={commune.slug} value={commune.slug}>
              {commune.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-foreground/60">{t("filters.category")}</span>
        <select
          value={value.categoria}
          onChange={(event) => updateParam("categoria", event.target.value)}
          className="rounded border border-black/10 bg-transparent px-2 py-1.5 dark:border-white/20"
        >
          <option value="">—</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {tags.length > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-foreground/60">{t("filters.features")}</span>
          <select
            value={value.caracteristica}
            onChange={(event) =>
              updateParam("caracteristica", event.target.value)
            }
            className="rounded border border-black/10 bg-transparent px-2 py-1.5 dark:border-white/20"
          >
            <option value="">—</option>
            {tags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </form>
  );
}
