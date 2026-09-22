/**
 * Proveedor de tiles configurable por env var. El proveedor comercial
 * definitivo está pendiente de definir antes de producción (ver
 * docs/PLAN.md, sección Riesgos).
 */
export function getMapStyleUrl(): string {
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (styleUrl) return styleUrl;

  // Estilo demo gratuito de MapLibre, solo para desarrollo.
  return "https://demotiles.maplibre.org/style.json";
}

export const PETORCA_CENTER = { latitude: -32.25, longitude: -70.93 } as const;
export const PETORCA_DEFAULT_ZOOM = 10;
