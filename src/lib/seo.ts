import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { isSiteIndexable } from "@/lib/site-indexing";

/** Nombre del sitio: la parte del dicho que es de la comuna (ver docs/PLAN.md, 2026-11-01). */
export const SITE_NAME = "El diablo murió en Petorca";

/**
 * Imagen de vista previa cuando una página no tiene foto propia (logo y
 * nombre, 1200×630; sale de `scripts/build-brand-png.mjs`).
 */
export const DEFAULT_OG_IMAGE = "/brand/og.png";

const OG_LOCALE: Record<Locale, string> = {
  es: "es_CL",
  en: "en_US",
  pt: "pt_BR",
};

/**
 * Dominio publicado hoy. Se usa cuando no hay otra URL válida en producción:
 * el 2026-11-02 el sitio publicado decía `http://localhost:3000` en el
 * canonical, la imagen para compartir (WhatsApp no mostraba vista previa),
 * el sitemap y el robots.txt. Con dominio propio, basta
 * `NEXT_PUBLIC_SITE_URL` (docs/DOMINIO.md).
 */
const PUBLISHED_SITE_URL = "https://directorio-turistico-bgl3.vercel.app";

const isLocalUrl = (url: string) => /\/\/(localhost|127\.0\.0\.1)\b/.test(url);

/**
 * URL pública del sitio, base de las URLs absolutas de metadata/sitemap.
 * Prioridad: la variable explícita (dominio propio), luego el dominio de
 * producción que expone Vercel, luego el del despliegue (previews). En
 * desarrollo, localhost; en un build de producción nunca una URL local (si la
 * variable quedó con el valor de `.env.example`), sino el dominio publicado.
 */
export function getSiteUrl(): string {
  const production = process.env.NODE_ENV === "production";
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit && !(production && isLocalUrl(explicit))) return explicit;
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return production ? PUBLISHED_SITE_URL : "http://localhost:3000";
}

type Href = Parameters<typeof getPathname>[0]["href"];

/** Recorta a un largo razonable para la vista previa, sin cortar palabras. */
export function truncateDescription(
  text: string | null | undefined,
  max = 160,
): string | undefined {
  const clean = text?.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

/** Ruta localizada de un `href` del router (con prefijo de idioma). */
export function localizedPath(href: Href, locale: Locale): string {
  return getPathname({ href, locale });
}

/**
 * Metadata completa de una página pública: título, descripción, canonical,
 * hreflang (es/en/x-default) y vista previa para WhatsApp/Facebook/X. Una
 * sola función para que ninguna página se olvide de alguno de esos campos.
 */
export function buildPageMetadata({
  locale,
  href,
  title,
  description,
  image,
  noIndex = false,
  absoluteTitle = false,
}: {
  locale: Locale;
  href: Href;
  title: string;
  description?: string;
  image?: string | null;
  noIndex?: boolean;
  /** Para el inicio: el título ya es el nombre del sitio, sin sufijo. */
  absoluteTitle?: boolean;
}): Metadata {
  const path = localizedPath(href, locale);
  const languages: Record<string, string> = {};
  for (const alt of routing.locales) {
    languages[alt] = localizedPath(href, alt);
  }
  languages["x-default"] = localizedPath(href, routing.defaultLocale);

  const images = [{ url: image ?? DEFAULT_OG_IMAGE }];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path, languages },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      type: "website",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
    // Antes del lanzamiento ninguna página se indexa (lib/site-indexing.ts).
    ...(noIndex || !isSiteIndexable()
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}
