import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import type { StreetRoute, TravelMode } from "@/lib/navigation/street-route";

/** Pide la ruta por calles a nuestro servidor (`/api/ruta`); null si no se pudo. */
export async function fetchStreetRoute(
  from: GeoPoint,
  to: GeoPoint,
  mode: TravelMode,
  signal?: AbortSignal,
): Promise<StreetRoute | null> {
  const query = new URLSearchParams({
    mode,
    fromLat: String(from.latitude),
    fromLng: String(from.longitude),
    toLat: String(to.latitude),
    toLng: String(to.longitude),
  });
  try {
    const response = await fetch(`/api/ruta?${query}`, { signal });
    if (!response.ok) return null;
    return (await response.json()) as StreetRoute;
  } catch {
    return null;
  }
}

/** Link a Google Maps con el modo elegido: para la navegación con voz del teléfono. */
export function externalDirectionsUrl(to: GeoPoint, mode: TravelMode): string {
  const query = new URLSearchParams({
    api: "1",
    destination: `${to.latitude},${to.longitude}`,
    travelmode: mode === "walk" ? "walking" : "driving",
  });
  return `https://www.google.com/maps/dir/?${query}`;
}
