import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const MAX_WAYPOINTS = 25;

const bodySchema = z.object({
  waypoints: z
    .array(z.object({ lat: z.number(), lng: z.number() }))
    .min(2)
    .max(MAX_WAYPOINTS),
});

interface GoogleRoutesResponse {
  routes?: {
    duration?: string;
    distanceMeters?: number;
    polyline?: { geoJsonLinestring?: { coordinates: [number, number][] } };
    legs?: { duration?: string; distanceMeters?: number }[];
  }[];
}

function parseDurationSeconds(duration: string | undefined): number {
  const match = duration ? /^(\d+(?:\.\d+)?)s$/.exec(duration) : null;
  return match ? Math.round(Number(match[1])) : 0;
}

/**
 * Proxy de Google Routes API (computeRoutes): calcula la ruta real por
 * calle (no línea recta) entre las paradas, en el mismo orden que se le
 * pasan — usado por el mapa de navegación en vivo (ver
 * src/lib/maps/directions.ts). Reutiliza GOOGLE_PLACES_API_KEY: hay que
 * habilitar además "Routes API" en el mismo proyecto de Google Cloud (ver
 * docs/PLAN.md, Riesgos).
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { waypoints } = parsed.data;
  const origin = waypoints[0];
  const rest = waypoints.slice(1);
  const destination = rest[rest.length - 1];
  const intermediates = rest.slice(0, -1);

  const upstream = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.polyline.geoJsonLinestring,routes.legs.duration,routes.legs.distanceMeters,routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng },
          },
        },
        intermediates: intermediates.map((point) => ({
          location: { latLng: { latitude: point.lat, longitude: point.lng } },
        })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        polylineQuality: "HIGH_QUALITY",
        polylineEncoding: "GEO_JSON_LINE_STRING",
        computeAlternativeRoutes: false,
        languageCode: "es",
      }),
    },
  );

  if (!upstream.ok) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  const data = (await upstream.json()) as GoogleRoutesResponse;
  const route = data.routes?.[0];
  const coordinates = route?.polyline?.geoJsonLinestring?.coordinates;

  if (!coordinates) {
    return NextResponse.json({ error: "no_route" }, { status: 404 });
  }

  return NextResponse.json(
    {
      coordinates,
      totalDurationSeconds: parseDurationSeconds(route.duration),
      totalDistanceMeters: route.distanceMeters ?? 0,
      legs: (route.legs ?? []).map((leg) => ({
        durationSeconds: parseDurationSeconds(leg.duration),
        distanceMeters: leg.distanceMeters ?? 0,
      })),
    },
    { headers: { "Cache-Control": "private, max-age=120" } },
  );
}
