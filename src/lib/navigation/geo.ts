import { haversineDistanceKm, type GeoPoint } from "@/lib/itinerary-engine/geo";

/**
 * Geometría de la guía en vivo: distancias, rumbos y cómo ubicar a la
 * persona sobre la ruta por calles. Basado en `live-nav.ts` del directorio
 * de Papudo (mismo equipo), que ya se probó en terreno allá.
 */

/** Punto de una ruta: [longitud, latitud], como en GeoJSON. */
export type LngLat = [number, number];

const EARTH_R = 6371000;

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  return haversineDistanceKm(a, b) * 1000;
}

export function normalizeDegrees(d: number): number {
  return ((d % 360) + 360) % 360;
}

/** Rumbo inicial de `a` hacia `b`, en grados (0 = norte, 90 = este). */
export function bearingDegrees(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI);
}

/**
 * Cuánto debe girar la flecha en pantalla: rumbo deseado menos hacia dónde
 * apunta el teléfono. Entre -180 y 180 (negativo = a la izquierda).
 */
export function relativeBearing(target: number, heading: number): number {
  const d = normalizeDegrees(target - heading);
  return d > 180 ? d - 360 : d;
}

/**
 * Hacia dónde apunta la parte superior del teléfono (0 = norte), a partir de
 * un evento de orientación. iOS entrega `webkitCompassHeading`; Android,
 * `alpha` absoluto (sentido antihorario), corregido por la rotación de la
 * pantalla.
 */
export function headingFromOrientation(
  e: {
    alpha: number | null;
    absolute?: boolean;
    webkitCompassHeading?: number;
  },
  screenAngle = 0,
): number | null {
  if (typeof e.webkitCompassHeading === "number") {
    return normalizeDegrees(e.webkitCompassHeading + screenAngle);
  }
  if (e.alpha === null || e.absolute === false) return null;
  return normalizeDegrees(360 - e.alpha + screenAngle);
}

/** «45 m», «1,2 km» (los metros, de a 5). */
export function formatMeters(meters: number, locale: string): string {
  if (meters < 1000) return `${Math.max(5, Math.round(meters / 5) * 5)} m`;
  return `${(meters / 1000).toLocaleString(locale, {
    maximumFractionDigits: 1,
  })} km`;
}

/** «45 min», «1 h», «1 h 30 min». */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Proyección plana local (metros) alrededor de `origin`: sirve en distancias cortas. */
function toXY(origin: GeoPoint, lng: number, lat: number): [number, number] {
  const toRad = Math.PI / 180;
  return [
    (lng - origin.longitude) *
      toRad *
      Math.cos(origin.latitude * toRad) *
      EARTH_R,
    (lat - origin.latitude) * toRad * EARTH_R,
  ];
}

const toPoint = ([longitude, latitude]: LngLat): GeoPoint => ({
  latitude,
  longitude,
});

/** Largo total de una ruta, en metros. */
export function polylineLength(line: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    total += distanceMeters(toPoint(line[i - 1]), toPoint(line[i]));
  }
  return total;
}

export interface RouteSnap {
  /** Distancia (m) del punto a la ruta. */
  distance: number;
  /** Tramo de la ruta donde cae (0 = entre los dos primeros puntos). */
  segment: number;
  /** Metros avanzados desde el inicio de la ruta hasta ese punto. */
  along: number;
  /** El punto de la ruta más cercano. */
  point: GeoPoint;
}

/** Punto de la ruta más cercano a `p` (medido en perpendicular a cada tramo). */
export function snapToPolyline(p: GeoPoint, line: LngLat[]): RouteSnap | null {
  if (line.length < 2) return null;
  let best: RouteSnap | null = null;
  let before = 0;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = toXY(p, line[i - 1][0], line[i - 1][1]);
    const [bx, by] = toXY(p, line[i][0], line[i][1]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const len = Math.sqrt(len2);
    // `p` es el origen (0, 0) de la proyección.
    const t =
      len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const distance = Math.hypot(ax + t * dx, ay + t * dy);
    if (!best || distance < best.distance) {
      best = {
        distance,
        segment: i - 1,
        along: before + t * len,
        point: {
          latitude: line[i - 1][1] + t * (line[i][1] - line[i - 1][1]),
          longitude: line[i - 1][0] + t * (line[i][0] - line[i - 1][0]),
        },
      };
    }
    before += len;
  }
  return best;
}

/** Punto de la ruta a `along` metros de su inicio; no pasa del final. */
export function pointAlong(line: LngLat[], along: number): GeoPoint {
  let remaining = Math.max(0, along);
  for (let i = 1; i < line.length; i++) {
    const a = toPoint(line[i - 1]);
    const b = toPoint(line[i]);
    const len = distanceMeters(a, b);
    if (remaining <= len) {
      const t = len === 0 ? 0 : remaining / len;
      return {
        latitude: a.latitude + t * (b.latitude - a.latitude),
        longitude: a.longitude + t * (b.longitude - a.longitude),
      };
    }
    remaining -= len;
  }
  return toPoint(line[line.length - 1]);
}

/** Lo que falta de la ruta, desde el punto más cercano a la persona. */
export function remainingLine(line: LngLat[], snap: RouteSnap): LngLat[] {
  return [
    [snap.point.longitude, snap.point.latitude],
    ...line.slice(snap.segment + 1),
  ];
}
