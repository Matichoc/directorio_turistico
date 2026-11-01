import "server-only";
import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import { distanceMeters, type LngLat } from "@/lib/navigation/geo";
import type {
  RouteStep,
  StreetRoute,
  TravelMode,
} from "@/lib/navigation/street-route";

/**
 * Rutas por calle (a pie y en auto) con sus giros, desde los servidores
 * públicos OSRM de FOSSGIS (datos de OpenStreetMap) — el mismo servicio que
 * usa el directorio de Papudo. Decisión del usuario (2026-11-01): gratis y sin
 * llave, en vez de Google Routes (que cobra por consulta y pide mostrar sus
 * rutas en su propio mapa). Política de uso: atribución, User-Agent válido,
 * como máximo 1 consulta por segundo y sin uso intensivo; para más tráfico,
 * apuntar `ROUTING_OSRM_WALK_URL` / `ROUTING_OSRM_CAR_URL` a un servidor propio.
 */
const DEFAULT_URLS: Record<TravelMode, string> = {
  walk: "https://routing.openstreetmap.de/routed-foot",
  car: "https://routing.openstreetmap.de/routed-car",
};
const USER_AGENT =
  "ElDiabloEnPetorca/1.0 (+https://github.com/Matichoc/directorio_turistico)";
const TIMEOUT_MS = 8000;

export class RoutingError extends Error {
  /** `no-route`: no hay camino entre los puntos. `upstream`: el servicio falló. */
  constructor(public kind: "no-route" | "upstream") {
    super(kind);
  }
}

export interface OsrmResponse {
  code?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: LngLat[] };
    legs: {
      steps: {
        name: string;
        distance: number;
        maneuver: {
          type: string;
          modifier?: string;
          location: LngLat;
          exit?: number;
        };
      }[];
    }[];
  }[];
}

/** Respuesta de OSRM → nuestra ruta (con cada giro y a cuántos metros está). */
export function parseOsrmRoute(
  data: OsrmResponse | null,
  mode: TravelMode,
): StreetRoute {
  if (data?.code === "NoRoute" || data?.code === "NoSegment") {
    throw new RoutingError("no-route");
  }
  const route = data?.code === "Ok" ? data.routes?.[0] : undefined;
  if (!route || route.geometry.coordinates.length < 2) {
    throw new RoutingError("upstream");
  }

  const steps: RouteStep[] = [];
  let atMeters = 0;
  for (const leg of route.legs) {
    for (const step of leg.steps) {
      steps.push({
        type: step.maneuver.type,
        modifier: step.maneuver.modifier ?? null,
        street: step.name ?? "",
        location: step.maneuver.location,
        atMeters: Math.round(atMeters),
        exit: step.maneuver.exit ?? null,
      });
      // La distancia de un paso es la que se recorre DESPUÉS de su giro.
      atMeters += step.distance;
    }
  }

  return {
    mode,
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
    coordinates: route.geometry.coordinates,
    steps,
  };
}

export async function fetchOsrmRoute(
  from: GeoPoint,
  to: GeoPoint,
  mode: TravelMode,
  env: Record<string, string | undefined> = process.env,
): Promise<StreetRoute> {
  const base =
    (mode === "walk" ? env.ROUTING_OSRM_WALK_URL : env.ROUTING_OSRM_CAR_URL) ||
    DEFAULT_URLS[mode];
  // El perfil (a pie o auto) lo fija el servidor elegido; el de la URL no importa.
  const url =
    `${base}/route/v1/driving/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=false`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new RoutingError("upstream");
  }
  if (!response.ok && response.status !== 400) {
    throw new RoutingError("upstream");
  }
  const data = (await response.json().catch(() => null)) as OsrmResponse | null;
  return parseOsrmRoute(data, mode);
}

/**
 * Dónde se aceptan rutas: el destino, en la comuna de Petorca (con margen, el
 * Túnel Las Palmas queda al borde); el origen, en la región. Así el servicio
 * no sirve de ruteador general para cualquiera que lo descubra.
 */
export const DEST_BOX = {
  south: -32.5,
  north: -31.9,
  west: -71.3,
  east: -70.4,
};
export const ORIGIN_BOX = {
  south: -34.5,
  north: -31.0,
  west: -72.5,
  east: -69.5,
};
/** Distancia máxima entre origen y destino (en línea recta). */
export const MAX_DISTANCE_M = 300_000;
/** Largo máximo de la línea que se devuelve (puntos). */
export const MAX_POINTS = 1500;

function inBox(p: GeoPoint, box: typeof DEST_BOX) {
  return (
    p.latitude >= box.south &&
    p.latitude <= box.north &&
    p.longitude >= box.west &&
    p.longitude <= box.east
  );
}

export function withinReach(from: GeoPoint, to: GeoPoint) {
  return (
    inBox(to, DEST_BOX) &&
    inBox(from, ORIGIN_BOX) &&
    distanceMeters(from, to) <= MAX_DISTANCE_M
  );
}

/** Conserva el inicio y el final y reparte el resto parejo hasta `max` puntos. */
export function decimate<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const out: T[] = [];
  const step = (points.length - 1) / (max - 1);
  for (let i = 0; i < max - 1; i++) out.push(points[Math.round(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}
