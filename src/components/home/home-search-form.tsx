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
    <form onSubmit={handleSubmit} role="search">
      <label>
        <span className="sr-only">{t("searchPlaceholder")}</span>
        <input
          type="search"
          name="q"
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-full border border-black/10 px-4 py-3 dark:border-white/20"
        />
      </label>
    </form>
  );
}
