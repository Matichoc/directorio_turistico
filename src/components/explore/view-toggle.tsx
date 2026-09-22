"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ViewToggle({ current }: { current: "lista" | "mapa" }) {
  const t = useTranslations("explore");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: "lista" | "mapa") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "lista") {
      params.delete("vista");
    } else {
      params.set("vista", view);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div
      role="group"
      aria-label={t("mapView")}
      className="inline-flex rounded-full border border-black/10 p-0.5 text-sm dark:border-white/20"
    >
      <button
        type="button"
        aria-pressed={current === "lista"}
        onClick={() => setView("lista")}
        className={`rounded-full px-3 py-1 ${
          current === "lista"
            ? "bg-accent text-accent-foreground"
            : "text-foreground/60"
        }`}
      >
        {t("listView")}
      </button>
      <button
        type="button"
        aria-pressed={current === "mapa"}
        onClick={() => setView("mapa")}
        className={`rounded-full px-3 py-1 ${
          current === "mapa"
            ? "bg-accent text-accent-foreground"
            : "text-foreground/60"
        }`}
      >
        {t("mapView")}
      </button>
    </div>
  );
}
