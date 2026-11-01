import type { Locale } from "@/types/database";

/**
 * Traducciones que se guardan desde el panel: español e inglés siempre; el
 * portugués solo si trae nombre. Sin nombre en portugués no hay fila y el
 * sitio en `/pt` muestra el español (ver `src/i18n/content.ts`).
 */
export function savedTranslations<T extends { name: string }>(translations: {
  es: T;
  en: T;
  pt?: T;
}): [Locale, T][] {
  const saved: [Locale, T][] = [
    ["es", translations.es],
    ["en", translations.en],
  ];
  if (translations.pt && translations.pt.name !== "") {
    saved.push(["pt", translations.pt]);
  }
  return saved;
}

/** ¿Hay que borrar la fila en portugués? (se vació su nombre en el panel). */
export function portugueseCleared(translations: {
  pt?: { name: string };
}): boolean {
  return !translations.pt || translations.pt.name === "";
}
