/**
 * Relieve servido desde el propio sitio (`public/terrain`, generado con
 * `scripts/build-terrain-tiles.py`): teselas Terrarium de AWS Terrain Tiles
 * convertidas a WebP sin pérdida. Estos límites tienen que coincidir con la
 * cobertura de ese script — fuera de ellos no hay teselas.
 */
export const TERRAIN_TILE_PATH = "/terrain/{z}/{x}/{y}.webp";

/** [oeste, sur, este, norte] — todo lo que cubre `public/terrain`. */
export const TERRAIN_BOUNDS: [number, number, number, number] = [
  -72.2, -33.5, -69.8, -31.5,
];
export const TERRAIN_MIN_ZOOM = 5;
/** Más allá de esto MapLibre agranda la tesela de zoom 12 (no hay más detalle). */
export const TERRAIN_MAX_ZOOM = 12;

/** Tesela (esquema XYZ de la web) que contiene un punto. */
export function tileForPoint(
  latitude: number,
  longitude: number,
  zoom: number,
): { x: number; y: number } {
  const n = 2 ** zoom;
  const latRad = (latitude * Math.PI) / 180;
  return {
    x: Math.floor(((longitude + 180) / 360) * n),
    y: Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        n,
    ),
  };
}

/**
 * URLs de las teselas alrededor de cada punto (el punto y sus 8 vecinas),
 * sin repetir — para precargar el relieve de las paradas del vuelo antes de
 * que la cámara llegue, y que se vea con detalle apenas aterriza.
 */
export function terrainTilesAround(
  points: { latitude: number; longitude: number }[],
  zoom: number,
  origin: string,
): string[] {
  const urls = new Set<string>();
  for (const point of points) {
    const { x, y } = tileForPoint(point.latitude, point.longitude, zoom);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        urls.add(
          `${origin}${TERRAIN_TILE_PATH.replace("{z}", String(zoom))
            .replace("{x}", String(x + dx))
            .replace("{y}", String(y + dy))}`,
        );
      }
    }
  }
  return [...urls];
}
