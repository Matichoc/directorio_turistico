import { NextResponse, type NextRequest } from "next/server";
import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import { getClientIp, isRateLimited } from "@/lib/http/rate-limit";
import {
  MAX_POINTS,
  RoutingError,
  decimate,
  fetchOsrmRoute,
  withinReach,
} from "@/lib/navigation/osrm";
import type { StreetRoute, TravelMode } from "@/lib/navigation/street-route";

/**
 * Ruta por calles (a pie o en auto), con sus giros, desde donde está la
 * persona hasta una parada — la usa la guía paso a paso (`LiveGuide`). Pasa
 * por el servidor para cachear, espaciar las consultas (el servicio público
 * de OSRM pide como máximo 1 por segundo) y frenar el abuso. No guarda ni
 * registra coordenadas: solo se reenvían al servicio de rutas, redondeadas
 * (origen ≈ 11 m, destino ≈ 1 m).
 */
const MAX_REQUESTS_PER_MINUTE = 30;
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX_ENTRIES = 300;
const MIN_INTERVAL_MS = 1100;

const cache = new Map<string, { route: StreetRoute; expiresAt: number }>();
let queue: Promise<void> = Promise.resolve();
let lastCallAt = 0;

/** Espacia las llamadas al servicio externo (una a la vez, ≥ 1,1 s entre ellas). */
async function throttle() {
  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>((resolve) => (release = resolve));
  await previous;
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCallAt = Date.now();
  release();
}

const noStore = { "Cache-Control": "no-store" };
const fail = (status: number, error: string) =>
  NextResponse.json({ error }, { status, headers: noStore });

function readPoint(
  params: URLSearchParams,
  lat: string,
  lng: string,
): GeoPoint | null {
  const latitude = Number(params.get(lat));
  const longitude = Number(params.get(lng));
  if (!params.get(lat) || !params.get(lng)) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

const round = (n: number, decimals: number) => Number(n.toFixed(decimals));

export async function GET(request: NextRequest) {
  // Solo desde esta misma app (no como servicio para otros sitios).
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return fail(403, "forbidden");
  }
  if (isRateLimited(`ruta:${getClientIp(request)}`, MAX_REQUESTS_PER_MINUTE)) {
    return fail(429, "rate_limited");
  }

  const params = request.nextUrl.searchParams;
  const mode = params.get("mode");
  const rawFrom = readPoint(params, "fromLat", "fromLng");
  const rawTo = readPoint(params, "toLat", "toLng");
  if ((mode !== "walk" && mode !== "car") || !rawFrom || !rawTo) {
    return fail(400, "invalid");
  }
  if (!withinReach(rawFrom, rawTo)) return fail(400, "out_of_area");

  const from = {
    latitude: round(rawFrom.latitude, 4),
    longitude: round(rawFrom.longitude, 4),
  };
  const to = {
    latitude: round(rawTo.latitude, 5),
    longitude: round(rawTo.longitude, 5),
  };
  const key = `${mode}:${from.latitude},${from.longitude}:${to.latitude},${to.longitude}`;

  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return NextResponse.json(hit.route, { headers: noStore });
  }

  try {
    await throttle();
    const found = await fetchOsrmRoute(from, to, mode as TravelMode);
    const route = {
      ...found,
      coordinates: decimate(found.coordinates, MAX_POINTS),
    };
    if (cache.size >= CACHE_MAX_ENTRIES) {
      cache.delete(cache.keys().next().value!);
    }
    cache.set(key, { route, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json(route, { headers: noStore });
  } catch (error) {
    if (error instanceof RoutingError && error.kind === "no-route") {
      return fail(404, "no_route");
    }
    console.error("[/api/ruta] el servicio de rutas no respondió");
    return fail(502, "upstream");
  }
}
