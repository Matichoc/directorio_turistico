import "server-only";
import { unstable_cache } from "next/cache";

/** Etiqueta de todo el contenido público cacheado (ver `refreshPublicContent`). */
export const CONTENT_TAG = "contenido";

/**
 * Cada cuánto se refresca el contenido aunque nadie lo edite (segundos). Lo
 * que se edita en el panel se ve al tiro: las acciones del panel invalidan la
 * etiqueta (`lib/server/content/refresh.ts`).
 */
export const CONTENT_REVALIDATE_SECONDS = 300;

/**
 * Envuelve una lectura pública para que su resultado se reutilice entre
 * visitas (caché de datos de Next/Vercel), en vez de consultar Supabase cada
 * vez. La clave incluye los argumentos (idioma, slug, filtros). Solo para
 * funciones que usan `createPublicClient` (sin cookies) y devuelven datos
 * serializables.
 */
export function cachedContent<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  key: string,
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, [CONTENT_TAG, key], {
    revalidate: CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_TAG],
  });
}
