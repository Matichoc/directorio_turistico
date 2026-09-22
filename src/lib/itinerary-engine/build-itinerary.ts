import { haversineDistanceKm } from "@/lib/itinerary-engine/geo";
import type {
  Itinerary,
  ItineraryBuildInput,
  ItineraryPlaceInput,
  ItineraryStop,
} from "@/lib/itinerary-engine/types";

const DEFAULT_AVERAGE_SPEED_KMH = 40;

/**
 * Ordena los lugares por vecino más cercano a partir de `startIndex` y arma
 * un itinerario respetando los topes de paradas/duración. Determinista dado
 * el mismo input: no usa aleatoriedad ni el reloj.
 */
export function buildItinerary(input: ItineraryBuildInput): Itinerary {
  const {
    places,
    startIndex = 0,
    maxStops = places.length,
    maxDurationMinutes = Number.POSITIVE_INFINITY,
    averageSpeedKmh = DEFAULT_AVERAGE_SPEED_KMH,
  } = input;

  if (places.length === 0) {
    return {
      stops: [],
      totalDurationMinutes: 0,
      totalDistanceKm: 0,
      skippedPlaceIds: [],
    };
  }

  const remaining = new Set(places.map((_, index) => index));
  const stops: ItineraryStop[] = [];
  let totalDurationMinutes = 0;
  let totalDistanceKm = 0;
  let cursor: ItineraryPlaceInput = places[startIndex]!;
  remaining.delete(startIndex);

  const firstStop: ItineraryStop = {
    placeId: cursor.id,
    name: cursor.name,
    order: 0,
    travelFromPreviousMinutes: 0,
    visitDurationMinutes: cursor.visitDurationMinutes,
    arrivalOffsetMinutes: 0,
    departureOffsetMinutes: cursor.visitDurationMinutes,
    distanceFromPreviousKm: 0,
  };
  stops.push(firstStop);
  totalDurationMinutes = cursor.visitDurationMinutes;

  while (remaining.size > 0 && stops.length < maxStops) {
    let nearestIndex: number | null = null;
    let nearestDistanceKm = Number.POSITIVE_INFINITY;

    for (const index of remaining) {
      const distanceKm = haversineDistanceKm(cursor, places[index]!);
      if (distanceKm < nearestDistanceKm) {
        nearestDistanceKm = distanceKm;
        nearestIndex = index;
      }
    }

    if (nearestIndex === null) break;

    const next = places[nearestIndex]!;
    const travelMinutes = (nearestDistanceKm / averageSpeedKmh) * 60;
    const arrivalOffsetMinutes = totalDurationMinutes + travelMinutes;
    const departureOffsetMinutes =
      arrivalOffsetMinutes + next.visitDurationMinutes;

    if (departureOffsetMinutes > maxDurationMinutes) {
      break;
    }

    remaining.delete(nearestIndex);
    stops.push({
      placeId: next.id,
      name: next.name,
      order: stops.length,
      travelFromPreviousMinutes: travelMinutes,
      visitDurationMinutes: next.visitDurationMinutes,
      arrivalOffsetMinutes,
      departureOffsetMinutes,
      distanceFromPreviousKm: nearestDistanceKm,
    });

    totalDurationMinutes = departureOffsetMinutes;
    totalDistanceKm += nearestDistanceKm;
    cursor = next;
  }

  const visitedIds = new Set(stops.map((stop) => stop.placeId));
  const skippedPlaceIds = places
    .map((place) => place.id)
    .filter((id) => !visitedIds.has(id));

  return { stops, totalDurationMinutes, totalDistanceKm, skippedPlaceIds };
}
