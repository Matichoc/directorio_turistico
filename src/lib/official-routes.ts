/**
 * Rutas turísticas de la comuna con nombre, logo y redes propias (de otros,
 * no del sitio) a las que corresponde una de nuestras rutas: la ficha muestra
 * su logo, de dónde viene y su Instagram. Logos y cuentas entregados por el
 * usuario — ver docs/PROPUESTA-CONTENIDO-PETORCA.md.
 */
export interface OfficialRoute {
  /** Clave de sus textos en `route.official.routes` (messages/*.json). */
  key: "poncho" | "ferroviaria";
  /** Logo de la ruta (public/brand/). */
  logo: string;
  instagramUrl: string;
}

const OFFICIAL_ROUTES: Record<string, OfficialRoute> = {
  // "Donde el Diablo perdió el poncho" (Municipalidad de Petorca e INDAP,
  // 2018; presidenta Nataly Muñoz).
  "ruta-del-diablo-pedegua-chincolco": {
    key: "poncho",
    logo: "/brand/ruta-oficial-poncho.webp",
    instagramUrl: "https://www.instagram.com/rutadondeeldiabloperdio/",
  },
  // "Ruta Turística Ferroviaria Pedegua – Palquico – Las Palmas". No hay
  // fuente de quién la organiza: la tarjeta no la llama "oficial".
  "ruta-ferroviaria-pedegua-las-palmas": {
    key: "ferroviaria",
    logo: "/brand/ruta-ferroviaria-logo.webp",
    instagramUrl: "https://www.instagram.com/ruta_ferroviaria/",
  },
};

export function getOfficialRoute(routeSlug: string): OfficialRoute | null {
  return OFFICIAL_ROUTES[routeSlug] ?? null;
}
