/**
 * Qué guardar para usar el sitio sin señal (pedido del usuario: que
 * funcione "sin señal en el valle"). Funciones puras: el botón
 * `OfflineSaveButton` las usa para armar la lista de descargas y el
 * service worker (`public/sw.js`) es el que después las sirve sin red.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Rectángulo que contiene todos los puntos, más un margen en km para lo que
 * rodea el camino (calles cercanas, el pueblo de al lado).
 */
export function boundsAround(points: LatLng[], marginKm = 2): Bounds | null {
  if (points.length === 0) return null;
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const dLat = marginKm / 111.32;
  const midLat = ((south + north) / 2) * (Math.PI / 180);
  const dLng = marginKm / (111.32 * Math.cos(midLat));
  return {
    west: Math.min(...lngs) - dLng,
    south: south - dLat,
    east: Math.max(...lngs) + dLng,
    north: north + dLat,
  };
}

/** Columna y fila de la tesela (esquema XYZ "slippy map") de un punto. */
export function tileAt(longitude: number, latitude: number, zoom: number) {
  const n = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * n);
  const rad = (latitude * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
  );
  return {
    x: Math.min(Math.max(x, 0), n - 1),
    y: Math.min(Math.max(y, 0), n - 1),
  };
}

/** Todas las teselas que cubren `bounds` entre `minZoom` y `maxZoom`. */
export function tilesInBounds(
  bounds: Bounds,
  minZoom: number,
  maxZoom: number,
): { z: number; x: number; y: number }[] {
  const tiles: { z: number; x: number; y: number }[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const topLeft = tileAt(bounds.west, bounds.north, z);
    const bottomRight = tileAt(bounds.east, bounds.south, z);
    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

/** `https://…/{z}/{x}/{y}.pbf` → URL de una tesela. */
export function tileUrl(
  template: string,
  tile: { z: number; x: number; y: number },
) {
  return template
    .replace("{z}", String(tile.z))
    .replace("{x}", String(tile.x))
    .replace("{y}", String(tile.y));
}

/**
 * Archivos del sitio que necesita una página para funcionar (JS y CSS de
 * `/_next/static/`), sacados de su HTML. Sin ellos, una página guardada se
 * vería pero no respondería a los toques.
 */
export function staticAssetsIn(html: string): string[] {
  const found = html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? [];
  return [...new Set(found)];
}

/** Nombre de las fuentes de letras que usa un estilo de MapLibre. */
export function fontStacksIn(style: {
  layers?: { layout?: Record<string, unknown> }[];
}): string[] {
  const stacks = new Set<string>();
  for (const layer of style.layers ?? []) {
    const font = layer.layout?.["text-font"];
    if (Array.isArray(font) && font.every((f) => typeof f === "string")) {
      stacks.add(font.join(","));
    }
  }
  return [...stacks];
}
