import { useTranslations } from "next-intl";
import Image from "next/image";

const DEFAULT_SPONSOR_URL = "https://www.matichoc.cl";

/**
 * Auspiciador. Matichoc no es la marca del sitio, así que este bloque usa
 * a propósito la identidad visual real de Matichoc (colores y logo de
 * matichoc/matiweb) en vez de la paleta del sitio — busca destacar como
 * auspicio, no camuflarse. El logo siempre se muestra (antes era una
 * inicial genérica en un círculo, pedido explícito del usuario de que
 * "el logo salga sí o sí"). El link de Instagram solo se muestra si
 * `NEXT_PUBLIC_SPONSOR_INSTAGRAM_URL` está configurado: no inventamos una
 * cuenta que no podamos verificar.
 */
export function SponsorBanner() {
  const t = useTranslations("common");
  const siteUrl = process.env.NEXT_PUBLIC_SPONSOR_URL || DEFAULT_SPONSOR_URL;
  const instagramUrl = process.env.NEXT_PUBLIC_SPONSOR_INSTAGRAM_URL;

  return (
    <div className="bg-sponsor border-sponsor-accent border-t-4 px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/matichoc-logo.webp"
            alt="Matichoc"
            width={2000}
            height={2000}
            className="h-14 w-auto shrink-0 sm:h-16"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sponsor-accent text-[11px] font-bold tracking-wide uppercase">
              {t("sponsoredBy")}
            </span>
            <span className="text-sponsor-foreground/80 text-xs">
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
              className="border-sponsor-accent/40 text-sponsor-accent hover:bg-sponsor-accent/10 rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              {t("sponsor.instagram")}
            </a>
          )}
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="bg-sponsor-accent text-sponsor-accent-foreground rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105"
          >
            {t("sponsor.cta")}
          </a>
        </div>
      </div>
    </div>
  );
}
