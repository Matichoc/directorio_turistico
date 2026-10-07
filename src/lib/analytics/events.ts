/**
 * Fuente única de los nombres de evento: tanto el tipo como el `zod.enum`
 * de `/api/analytics` salen de acá (antes eran dos listas a mano y un
 * evento nuevo, `place_liked`, quedó fuera de la del servidor — el bug
 * real del 2026-09-26, ver docs/PLAN.md).
 */
export const ANALYTICS_EVENT_NAMES = [
  "place_view",
  "route_view",
  "locality_view",
  "route_added_to_trip",
  "place_added_to_trip",
  "place_liked",
  "search_performed",
  "filter_applied",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
}
