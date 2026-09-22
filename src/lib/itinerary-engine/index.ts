import { buildItinerary } from "@/lib/itinerary-engine/build-itinerary";

export * from "@/lib/itinerary-engine/types";
export { haversineDistanceKm } from "@/lib/itinerary-engine/geo";

/**
 * Punto de extensión único hacia el motor de itinerarios. Módulo TS puro,
 * sin dependencias de UI ni de Supabase: pensado para reusarse desde una
 * futura interfaz conversacional.
 */
export const ItineraryEngine = {
  build: buildItinerary,
};
