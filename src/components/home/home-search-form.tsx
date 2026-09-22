"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function HomeSearchForm() {
  const t = useTranslations("home");
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem(
      "q",
    ) as HTMLInputElement | null;
    const query = input?.value.trim();
    router.push(
      query
        ? { pathname: "/explorar", query: { q: query } }
        : { pathname: "/explorar" },
    );
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative">
      <label>
        <span className="sr-only">{t("searchPlaceholder")}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="text-foreground/40 pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          name="q"
          placeholder={t("searchPlaceholder")}
          className="focus:border-accent focus:ring-accent-soft w-full rounded-full border border-black/10 bg-white/70 py-3 pr-4 pl-10 shadow-sm outline-none focus:ring-2 dark:border-white/20 dark:bg-white/5"
        />
      </label>
    </form>
  );
}
