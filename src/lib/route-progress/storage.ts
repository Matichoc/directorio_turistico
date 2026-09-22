/**
 * Checklist de paradas visitadas por ruta: solo localStorage del
 * navegador, sin backend — mismo patrón que `lib/trip/storage.ts`.
 * Dispara `ROUTE_PROGRESS_EVENT` en `window` en cada mutación.
 */

const STORAGE_KEY = "petorca-route-progress";
export const ROUTE_PROGRESS_EVENT = "route-progress:change";

type ProgressMap = Record<string, string[]>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): ProgressMap {
  if (!isBrowser()) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeAll(data: ProgressMap): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(ROUTE_PROGRESS_EVENT));
}

export function getVisitedPlaceIds(routeId: string): string[] {
  return readAll()[routeId] ?? [];
}

export function isPlaceVisited(routeId: string, placeId: string): boolean {
  return getVisitedPlaceIds(routeId).includes(placeId);
}

export function toggleVisited(routeId: string, placeId: string): string[] {
  const all = readAll();
  const current = all[routeId] ?? [];
  const next = current.includes(placeId)
    ? current.filter((id) => id !== placeId)
    : [...current, placeId];
  writeAll({ ...all, [routeId]: next });
  return next;
}

export function clearRouteProgress(routeId: string): void {
  const all = readAll();
  delete all[routeId];
  writeAll(all);
}
