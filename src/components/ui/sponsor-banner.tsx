import { useTranslations } from "next-intl";

/**
 * Placeholder de auspiciador. Matichoc no es la marca del sitio, es un
 * auspiciador — se muestra como banner discreto, no como identidad de la
 * app. Reemplazar el link por el definitivo cuando Matichoc lo entregue
 * (por ahora usa NEXT_PUBLIC_SPONSOR_URL o "#").
 */
export function SponsorBanner() {
  const t = useTranslations("common");

  return (
    <div className="text-foreground/60 border-t border-black/10 bg-black/[.02] px-4 py-2 text-center text-xs dark:border-white/10 dark:bg-white/[.03]">
      {t("sponsoredBy")}{" "}
      <a
        href={process.env.NEXT_PUBLIC_SPONSOR_URL || "#"}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="text-foreground/80 hover:text-foreground font-medium underline underline-offset-2"
      >
        Matichoc
      </a>
    </div>
  );
}
