import { haversineDistanceKm } from "@/lib/itinerary-engine/geo";
import type {
  Itinerary,
  ItineraryPlaceInput,
  ItineraryStop,
} from "@/lib/itinerary-engine/types";

const DEFAULT_AVERAGE_SPEED_KMH = 40;

/**
 * Arma un itinerario respetando el orden exacto de `places` — a diferencia
 * de `buildItinerary` (vecino más cercano), acá el usuario ya eligió el
 * orden a mano (ver `reorderTripPlaces` en `lib/trip/storage.ts`) y no se
 * reordena ni se descarta ningún lugar.
 */
export function buildItineraryInOrder(
  places: ItineraryPlaceInput[],
  averageSpeedKmh = DEFAULT_AVERAGE_SPEED_KMH,
): Itinerary {
  if (places.length === 0) {
    return {
      stops: [],
      totalDurationMinutes: 0,
      totalDistanceKm: 0,
      skippedPlaceIds: [],
    };
  }

  const stops: ItineraryStop[] = [];
  let totalDurationMinutes = 0;
  let totalDistanceKm = 0;
  let previous: ItineraryPlaceInput | null = null;

  for (const [index, place] of places.entries()) {
    const distanceFromPreviousKm = previous
      ? haversineDistanceKm(previous, place)
      : 0;
    const travelFromPreviousMinutes =
      (distanceFromPreviousKm / averageSpeedKmh) * 60;
    const arrivalOffsetMinutes =
      totalDurationMinutes + travelFromPreviousMinutes;
    const departureOffsetMinutes =
      arrivalOffsetMinutes + place.visitDurationMinutes;

    stops.push({
      placeId: place.id,
      name: place.name,
      order: index,
      travelFromPreviousMinutes,
      visitDurationMinutes: place.visitDurationMinutes,
      arrivalOffsetMinutes,
      departureOffsetMinutes,
      distanceFromPreviousKm,
    });

    totalDurationMinutes = departureOffsetMinutes;
    totalDistanceKm += distanceFromPreviousKm;
    previous = place;
  }

  return { stops, totalDurationMinutes, totalDistanceKm, skippedPlaceIds: [] };
}
