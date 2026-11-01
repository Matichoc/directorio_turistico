/**
 * Google no deja reutilizar el `name` de una foto de Places (API New):
 * "places/{placeId}/photos/{photoId}" vence, y pedirlo después responde 400
 * ("The photo resource in the request is invalid"). Así se perdieron 163 de
 * 168 fotos guardadas (bug real, 2026-11-01). Lo que sí se puede guardar es
 * el `placeId`, así que `/api/place-photo` pide en el momento las fotos
 * vigentes de ese lugar y elige cuál servir con estas funciones (puras, con
 * pruebas en tests/unit/place-photo-ref.test.ts).
 */

const PLACE_PHOTO_REF = /^places\/([\w-]+)\/photos\/[\w-]+$/;

export interface CurrentPlacePhoto {
  name: string;
  authorAttributions?: { displayName?: string }[];
}

/** `placeId` de Google dentro del `name` guardado, o null si no tiene esa forma. */
export function parsePlacePhotoRef(ref: string): string | null {
  return PLACE_PHOTO_REF.exec(ref)?.[1] ?? null;
}

/**
 * Autor guardado en `place_images.alt_text` por scripts/fetch-google-photos.ts
 * ("Foto: {autor} (Google Maps)"). Null si la foto no traía autor.
 */
export function authorFromAltText(altText: string | null): string | null {
  const match = /^Foto: (.+) \(Google Maps\)$/.exec(altText ?? "");
  return match?.[1] ?? null;
}

/**
 * Qué foto vigente servir en lugar de la guardada, en este orden:
 * 1. la misma foto, si su `name` sigue siendo válido;
 * 2. una del mismo autor (así el crédito que muestra la ficha sigue siendo
 *    cierto), prefiriendo la de la misma posición;
 * 3. sin autor guardado, la de la misma posición.
 * Si nada calza, null: la ficha cae al ícono de su categoría en vez de
 * mostrar una foto con el crédito de otra persona.
 */
export function pickCurrentPhotoName(
  photos: CurrentPlacePhoto[],
  stored: { ref: string; author: string | null; position: number },
): string | null {
  if (photos.some((photo) => photo.name === stored.ref)) return stored.ref;

  const authorOf = (photo: CurrentPlacePhoto) =>
    photo.authorAttributions?.[0]?.displayName ?? null;

  if (stored.author) {
    const atPosition = photos[stored.position];
    if (atPosition && authorOf(atPosition) === stored.author) {
      return atPosition.name;
    }
    return (
      photos.find((photo) => authorOf(photo) === stored.author)?.name ?? null
    );
  }

  return photos[stored.position]?.name ?? null;
}
