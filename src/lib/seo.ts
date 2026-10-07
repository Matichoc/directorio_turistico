import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_NAME =
  "El diablo murió en Petorca y en La Ligua lo enterraron";

/** Imagen de vista previa cuando una página no tiene foto propia. */
export const DEFAULT_OG_IMAGE = "/icons/icon-512.png";

const OG_LOCALE: Record<Locale, string> = { es: "es_CL", en: "en_US" };

/**
 * URL pública del sitio, base de las URLs absolutas de metadata/sitemap.
 * Prioridad: la variable explícita (dominio propio), luego el dominio de
 * producción que expone Vercel, luego el del despliegue (previews) y por
 * último localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
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
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
