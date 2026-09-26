/**
 * Caché local de qué lugares le dio "me gusta" este navegador — evita
 * depender de una consulta al servidor solo para saber si el corazón debe
 * verse lleno o no (el dato real y compartido vive en `place_likes`,
 * atado a `getLikeSessionId()`). Mismo patrón que `lib/trip/storage.ts`.
 */
const STORAGE_KEY = "petorca-liked-places";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readLiked(): string[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]): void {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

export function isPlaceLiked(placeId: string): boolean {
  return readLiked().includes(placeId);
}

export function markPlaceLiked(placeId: string): void {
  const current = readLiked();
  if (!current.includes(placeId)) persist([...current, placeId]);
}

export function markPlaceUnliked(placeId: string): void {
  persist(readLiked().filter((id) => id !== placeId));
}
