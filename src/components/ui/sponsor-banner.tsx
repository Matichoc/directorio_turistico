import { useTranslations } from "next-intl";

const DEFAULT_SPONSOR_URL = "https://www.matichoc.cl";

/**
 * Auspiciador. Matichoc no es la marca del sitio, es un auspiciador — se
 * muestra como banner visual pero discreto, no como identidad de la app.
 * El link de Instagram solo se muestra si `NEXT_PUBLIC_SPONSOR_INSTAGRAM_URL`
 * está configurado: no inventamos una cuenta que no podamos verificar.
 */
export function SponsorBanner() {
  const t = useTranslations("common");
  const siteUrl = process.env.NEXT_PUBLIC_SPONSOR_URL || DEFAULT_SPONSOR_URL;
  const instagramUrl = process.env.NEXT_PUBLIC_SPONSOR_INSTAGRAM_URL;

  return (
    <div className="bg-sponsor border-t border-black/10 px-4 py-3 dark:border-white/10">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="from-accent to-accent-soft text-accent-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold"
          >
            M
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] tracking-wide text-white/60 uppercase">
              {t("sponsoredBy")} Matichoc
            </span>
            <span className="text-xs text-white/80">
              {t("sponsor.tagline")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white"
            >
              {t("sponsor.instagram")}
            </a>
          )}
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="bg-accent text-accent-foreground rounded-full px-3 py-1.5 text-xs font-medium hover:opacity-90"
          >
            {t("sponsor.cta")}
          </a>
        </div>
      </div>
    </div>
  );
}
