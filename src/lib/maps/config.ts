/**
 * Proveedor de tiles configurable por env var. Por defecto usa OpenFreeMap
 * (estilo "liberty"): tiles vectoriales gratis, sin API key ni límite de
 * requests, con atribución OSM/OpenMapTiles incluida en el propio style.json
 * (MapLibre la muestra solo con el `AttributionControl` habilitado).
 * "liberty" (en vez de "positron", gris/minimalista) se eligió a pedido del
 * usuario: colores vivos (verde en áreas naturales, celeste en el mar),
 * hace que el mapa se vea vivo en vez de plomo. No requiere definir un
 * proveedor comercial todavía — ver docs/PLAN.md, sección Riesgos, si igual
 * se necesita uno con SLA en el futuro.
 */
export function getMapStyleUrl(): string {
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (styleUrl) return styleUrl;

  return "https://tiles.openfreemap.org/styles/liberty";
}

export const PETORCA_CENTER = { latitude: -32.25, longitude: -70.93 } as const;
export const PETORCA_DEFAULT_ZOOM = 10;
/** Zoom para un mapa con un solo marcador (ficha de lugar): a nivel calle,
 * no de toda la provincia — si no, se ve "genérico" sin mostrar el lugar. */
export const PLACE_DETAIL_ZOOM = 15;
