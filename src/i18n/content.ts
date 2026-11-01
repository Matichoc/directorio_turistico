import type { Locale } from "@/types/database";

/**
 * Idiomas en los que se busca el contenido de la base (lugares, rutas,
 * pueblos, comunas, categorías, auspiciadores), en orden de preferencia.
 * El portugués se sumó después (2026-11-01): un lugar cargado en el panel
 * sin traducción al portugués se muestra en español en vez de desaparecer
 * del sitio en `/pt`. Español e inglés siguen exigiendo su propia
 * traducción, como siempre (el panel completa el inglés con el español).
 */
const CONTENT_LOCALES: Record<Locale, Locale[]> = {
  es: ["es"],
  en: ["en"],
  pt: ["pt", "es"],
};

export function contentLocales(locale: Locale): Locale[] {
  return CONTENT_LOCALES[locale];
}

/** La traducción en el idioma pedido o, si falta, la de respaldo. */
export function pickTranslation<T extends { locale: string }>(
  translations: readonly T[] | null | undefined,
  locale: Locale,
): T | undefined {
  for (const candidate of CONTENT_LOCALES[locale]) {
    const match = translations?.find((t) => t.locale === candidate);
    if (match) return match;
  }
  return undefined;
}
