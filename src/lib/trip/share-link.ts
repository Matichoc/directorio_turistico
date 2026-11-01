/**
 * Recorrido compartido por link: las paradas viajan en la URL, en orden
 * (`?paradas=slug-1,slug-2`). Decisión del usuario (2026-11-01): un link que
 * se manda por WhatsApp, sin cuentas ni cambios en la base; quien lo abre ve
 * el recorrido, lo navega con la guía y puede guardarlo como suyo.
 */
export const SHARE_PARAM = "paradas";
/** Tope de paradas en un link (el mismo de "Mi recorrido" en la práctica). */
export const MAX_SHARED_STOPS = 25;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Slugs válidos del parámetro, sin repetir y en el orden recibido. */
export function parseSharedStops(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const seen = new Set<string>();
  for (const part of value.split(",")) {
    const slug = part.trim().toLowerCase();
    if (SLUG.test(slug) && slug.length <= 120) seen.add(slug);
    if (seen.size >= MAX_SHARED_STOPS) break;
  }
  return [...seen];
}

export function formatSharedStops(slugs: string[]): string {
  return slugs.slice(0, MAX_SHARED_STOPS).join(",");
}
