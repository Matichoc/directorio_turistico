/**
 * Rutas turísticas oficiales (de otros, no del sitio) a las que corresponde
 * una de nuestras rutas: la ficha muestra su logo y su contacto. Solo con
 * permiso de sus dueños — ver docs/PROPUESTA-CONTENIDO-PETORCA.md.
 */
export interface OfficialRoute {
  /** Logo de la ruta oficial (public/brand/). */
  logo: string;
  instagramUrl: string;
}

const OFFICIAL_ROUTES: Record<string, OfficialRoute> = {
  // "Donde el Diablo perdió el poncho" (Municipalidad de Petorca e INDAP,
  // 2018; presidenta Nataly Muñoz). Instagram citado en El Mercurio de
  // Valparaíso, 29-09-2024. Logo provisorio entregado por el usuario.
  "ruta-del-diablo-pedegua-chincolco": {
    logo: "/brand/ruta-oficial-poncho.webp",
    instagramUrl: "https://www.instagram.com/ruta_dondeeldiabloperdio/",
  },
};

export function getOfficialRoute(routeSlug: string): OfficialRoute | null {
  return OFFICIAL_ROUTES[routeSlug] ?? null;
}
