export interface DirectionsResult {
  /** [lng, lat] pairs — GeoJSON LineString listo para un Source de MapLibre. */
  coordinates: [number, number][];
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  legs: { durationSeconds: number; distanceMeters: number }[];
}

/** Llama al proxy /api/directions (Google Routes API). null si falla. */
export async function fetchDirections(
  waypoints: { lat: number; lng: number }[],
): Promise<DirectionsResult | null> {
  try {
    const response = await fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waypoints }),
    });
    if (!response.ok) return null;
    return (await response.json()) as DirectionsResult;
  } catch {
    return null;
  }
}
