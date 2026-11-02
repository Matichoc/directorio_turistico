/**
 * Carga de MapLibre para todos los mapas del sitio (`mapLib` de
 * `react-map-gl`). Desde MapLibre 6 (auditoría H-02: la 5.x tenía un aviso de
 * seguridad sin parche) el "worker" que arma las teselas es un archivo
 * aparte, `maplibre-gl-worker.mjs`, que MapLibre busca al lado de su propio
 * código. Al empaquetarlo, Next lo deja en otra carpeta y el worker daba 404
 * (mapa base en negro, solo los pines). Con `new URL(…, import.meta.url)` el
 * empaquetador copia el archivo y nos da su URL real.
 *
 * Sigue siendo una carga diferida: MapLibre (≈1 MB) se baja solo cuando se
 * monta el primer mapa, y una sola vez.
 */
const WORKER_URL = new URL(
  "maplibre-gl/dist/maplibre-gl-worker.mjs",
  import.meta.url,
).href;

let loading: Promise<typeof import("maplibre-gl")> | null = null;

export function loadMaplibre(): Promise<typeof import("maplibre-gl")> {
  loading ??= import("maplibre-gl").then((maplibre) => {
    maplibre.setWorkerUrl(WORKER_URL);
    return maplibre;
  });
  return loading;
}
