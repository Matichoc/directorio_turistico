/**
 * Prefijo de `place_images.storage_path` para fotos gestionadas por
 * `fetch-google-photos.ts` (vs. fotos curadas a mano en `seed.ts`, con
 * URLs de Wikimedia o rutas locales `/fotos/...`). Compartido entre ambos
 * scripts para que cada uno borre/reemplace solo lo que le corresponde —
 * sin esto, `pnpm db:seed` borraba también las fotos de Google en cada
 * corrida (bug real: el usuario reportó que las fotos de Google
 * "desaparecían" después de re-seedear).
 */
export const GOOGLE_PLACE_PHOTO_PREFIX = "/api/place-photo?ref=";
