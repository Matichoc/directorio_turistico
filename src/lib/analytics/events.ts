export type AnalyticsEventName =
  | "place_view"
  | "route_view"
  | "route_added_to_trip"
  | "place_added_to_trip"
  | "search_performed"
  | "filter_applied";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
}
