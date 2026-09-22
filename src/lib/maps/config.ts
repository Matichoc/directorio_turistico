/**
 * Proveedor de tiles configurable por env var. Por defecto usa OpenFreeMap
 * (estilo "positron"): tiles vectoriales gratis, sin API key ni límite de
 * requests, con atribución OSM/OpenMapTiles incluida en el propio style.json
 * (MapLibre la muestra solo con el `AttributionControl` habilitado). Es
 * mejor que el estilo demo anterior y no requiere definir un proveedor
 * comercial todavía — ver docs/PLAN.md, sección Riesgos, si igual se
 * necesita uno con SLA en el futuro.
 */
export function getMapStyleUrl(): string {
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (styleUrl) return styleUrl;

  return "https://tiles.openfreemap.org/styles/positron";
}

export const PETORCA_CENTER = { latitude: -32.25, longitude: -70.93 } as const;
export const PETORCA_DEFAULT_ZOOM = 10;
