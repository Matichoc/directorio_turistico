import type { SceneId } from "@/lib/ui/scene-backgrounds";

/**
 * Reportajes de TV y video sobre Petorca y sus rutas (pedido del usuario,
 * 2026-11-02). Fuente única: la leyenda, la ruta del poncho y el inicio los
 * leen de acá.
 *
 * Nunca se descargan ni se vuelven a subir (son de cada canal): se muestran
 * con el reproductor oficial de cada uno (YouTube sin cookies o Rudo, el de
 * Canal 13 y Chilevisión), con crédito y link al original. Solo datos
 * confirmados en la página de cada video: sin fecha o duración, no se muestra.
 * Solo de canales o programas reconocibles (pedido del usuario: "mientras que
 * son oficiales"); un video de un tercero que reúne material de otros, no.
 */
export interface Reportaje {
  key: "canal13" | "tvn24" | "chilevision" | "ntv";
  provider: "youtube" | "rudo";
  videoId: string;
  /** Título original, tal cual lo publicó el canal. */
  title: string;
  /** Canal y programa (nombres propios, no se traducen). */
  channel: string;
  /** Página original del video. */
  sourceUrl: string;
  sourceSite: string;
  publishedAt?: string;
  durationMinutes?: number;
  /** Escena del diablo de fondo para la tarjeta antes de reproducir. */
  scene: SceneId;
  /** Rutas del sitio de las que trata el reportaje. */
  routeSlugs: string[];
}

/** En el orden en que se muestran. */
export const REPORTAJES: Reportaje[] = [
  {
    key: "canal13",
    provider: "rudo",
    videoId: "CWfNlHCrUx6u",
    title:
      "La historia detrás de “Donde el Diablo perdió el poncho”: los Socios descubrieron una misteriosa leyenda de Petorca",
    channel: "Canal 13 · Socios por Chile",
    sourceUrl:
      "https://www.13.cl/programas/socios-por-chile/momentos/la-historia-detras-de-donde-el-diablo-perdio-el-poncho-los",
    sourceSite: "13.cl",
    publishedAt: "2026-09-14",
    durationMinutes: 20,
    scene: "pueblo",
    routeSlugs: ["ruta-del-diablo-pedegua-chincolco"],
  },
  {
    // Pedido del usuario (2026-11-03). Título y canal del oEmbed de YouTube;
    // la página del video pidió verificación, así que sin fecha ni duración.
    key: "tvn24",
    provider: "youtube",
    videoId: "1NJ-DgWr8qo",
    title:
      "Una ruta perfecta para este '18': encontramos \"Donde el Diablo perdió el poncho\"",
    channel: "TVN · 24 Horas",
    sourceUrl: "https://www.youtube.com/watch?v=1NJ-DgWr8qo",
    sourceSite: "YouTube",
    scene: "atardecer",
    routeSlugs: ["ruta-del-diablo-pedegua-chincolco"],
  },
  {
    key: "chilevision",
    provider: "rudo",
    videoId: "bXjT69",
    title:
      "Etienne Bobenrieth recorrió los misterios y leyendas de Petorca | De Pueblo en Pueblo",
    channel: "Chilevisión · Sabingo",
    sourceUrl:
      "https://www.chilevision.cl/programas/sabingo/etienne-bobenrieth-recorrio-los-misterios-y-leyendas-de-petorca-de-pueblo-en-pueblo-sabingo/",
    sourceSite: "chilevision.cl",
    publishedAt: "2026-09-24",
    durationMinutes: 71,
    scene: "cerro",
    routeSlugs: [],
  },
  {
    key: "ntv",
    provider: "youtube",
    videoId: "Dm8Z9msIis0",
    title: "Los Cuenteros en Ruta: “El diablo murió en Petorca”",
    channel: "NTV Chile · Los Cuenteros en Ruta",
    sourceUrl: "https://www.youtube.com/watch?v=Dm8Z9msIis0",
    sourceSite: "YouTube",
    scene: "tunel",
    routeSlugs: [],
  },
];

/** URL del reproductor oficial, que empieza a sonar al tocar "Ver". */
export function embedUrl(reportaje: Reportaje): string {
  return reportaje.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${reportaje.videoId}?autoplay=1&rel=0&playsinline=1`
    : `https://rudo.video/vod/${reportaje.videoId}?autostart=1`;
}

export function reportajesForRoute(routeSlug: string): Reportaje[] {
  return REPORTAJES.filter((reportaje) =>
    reportaje.routeSlugs.includes(routeSlug),
  );
}

/** «20 min», «1 h 11 min». */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
