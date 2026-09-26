/**
 * Carrito de recorrido: solo localStorage del navegador, sin backend. Es
 * intencional (ver docs/PLAN.md) — la persistencia de itinerarios por
 * sesión de servidor queda para una fase posterior. Dispara `TRIP_EVENT` en
 * `window` en cada mutación para que otros componentes montados (botones
 * "agregar", la página /recorrido) se mantengan sincronizados sin prop
 * drilling.
 */

const STORAGE_KEY = "petorca-trip-places";
// Ver getTripOrderMode/reorderTripPlaces/resetTripOrder: "auto" recalcula el
// orden por vecino más cercano en cada carga (comportamiento de siempre);
// "manual" respeta el orden exacto que el usuario armó a mano y deja de
// recalcularse solo hasta que lo resetee.
const ORDER_MODE_KEY = "petorca-trip-order-mode";
export const TRIP_EVENT = "trip:change";

export type TripOrderMode = "auto" | "manual";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getTripPlaceIds(): string[] {
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

function persist(ids: string[]): string[] {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(TRIP_EVENT));
  }
  return ids;
}

export function isInTrip(placeId: string): boolean {
  return getTripPlaceIds().includes(placeId);
}

export function addTripPlace(placeId: string): string[] {
  const current = getTripPlaceIds();
  if (current.includes(placeId)) return current;
  return persist([...current, placeId]);
}

export function addTripPlaces(placeIds: string[]): string[] {
  const current = new Set(getTripPlaceIds());
  for (const id of placeIds) current.add(id);
  return persist([...current]);
}

export function removeTripPlace(placeId: string): string[] {
  return persist(getTripPlaceIds().filter((id) => id !== placeId));
}

export function clearTrip(): string[] {
  if (isBrowser()) window.localStorage.removeItem(ORDER_MODE_KEY);
  return persist([]);
}

export function getTripOrderMode(): TripOrderMode {
  if (!isBrowser()) return "auto";
  return window.localStorage.getItem(ORDER_MODE_KEY) === "manual"
    ? "manual"
    : "auto";
}

/**
 * Guarda el orden exacto que el usuario armó a mano (arrastrando/subiendo-
 * bajando paradas) y pasa a modo manual: `TripView` deja de recalcular el
 * orden por vecino más cercano hasta que se llame a `resetTripOrder`.
 */
export function reorderTripPlaces(orderedIds: string[]): string[] {
  if (isBrowser()) {
    window.localStorage.setItem(ORDER_MODE_KEY, "manual");
  }
  return persist(orderedIds);
}

/** Descarta el orden a mano y vuelve a calcular por vecino más cercano. */
export function resetTripOrder(): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ORDER_MODE_KEY, "auto");
  window.dispatchEvent(new Event(TRIP_EVENT));
}
