export interface DirectionsResult {
  /** [lng, lat] pairs — GeoJSON LineString listo para un Source de MapLibre. */
  coordinates: [number, number][];
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  legs: { durationSeconds: number; distanceMeters: number }[];
}

export type DirectionsFetchResult =
  { ok: true; data: DirectionsResult } | { ok: false; detail: string };

/**
 * Llama al proxy /api/directions (Google Routes API). En caso de error
 * devuelve `detail` con el mensaje real de Google (ver route.ts) — se
 * muestra en la UI para poder diagnosticar sin ir a buscar logs de Vercel.
 */
export async function fetchDirections(
  waypoints: { lat: number; lng: number }[],
): Promise<DirectionsFetchResult> {
  try {
    const response = await fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waypoints }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;
      return { ok: false, detail: body?.detail ?? `HTTP ${response.status}` };
    }

    return { ok: true, data: (await response.json()) as DirectionsResult };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "network_error",
    };
  }
}
