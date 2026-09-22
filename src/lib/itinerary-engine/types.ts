export interface ItineraryPlaceInput {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  visitDurationMinutes: number;
}

export interface ItineraryBuildInput {
  places: ItineraryPlaceInput[];
  /** Índice en `places` desde donde comenzar. Por defecto, el primer lugar. */
  startIndex?: number;
  maxStops?: number;
  maxDurationMinutes?: number;
  averageSpeedKmh?: number;
}

export interface ItineraryStop {
  placeId: string;
  name: string;
  order: number;
  travelFromPreviousMinutes: number;
  visitDurationMinutes: number;
  arrivalOffsetMinutes: number;
  departureOffsetMinutes: number;
  distanceFromPreviousKm: number;
}

export interface Itinerary {
  stops: ItineraryStop[];
  totalDurationMinutes: number;
  totalDistanceKm: number;
  skippedPlaceIds: string[];
}
