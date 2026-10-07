import type { PlaceTheme } from "@/lib/ui/category-gradient";

/**
 * Fondos ilustrados con el diablito (casco minero con linterna, poncho,
 * cola de flecha) en distintos escenarios de la zona — pedido del usuario:
 * "que el diablito aparezca o en la playa, o en el cerro, o con poncho,
 * según como lo busquen y donde naveguen". Son SVG en `public/fondos/`
 * (compuestos para que el diablito quede a la derecha y el título a la
 * izquierda); para cambiarlos por arte raster (webp) basta reemplazar el
 * archivo y su extensión en `SCENE_SRC`.
 */
export type SceneId =
  "atardecer" | "playa" | "cerro" | "pueblo" | "dulces" | "tunel";

export const SCENE_SRC: Record<SceneId, string> = {
  atardecer: "/fondos/atardecer.svg",
  playa: "/fondos/playa.svg",
  cerro: "/fondos/cerro.svg",
  pueblo: "/fondos/pueblo.svg",
  dulces: "/fondos/dulces.svg",
  tunel: "/fondos/tunel.svg",
};

const SCENE_BY_CATEGORY: Record<string, SceneId> = {
  playa: "playa",
  naturaleza: "cerro",
  cultura: "pueblo",
  gastronomia: "dulces",
};

/** Escena según la categoría que se está mirando; sin categoría, el atardecer general. */
export function getSceneForCategory(categorySlug?: string | null): SceneId {
  return (categorySlug && SCENE_BY_CATEGORY[categorySlug]) || "atardecer";
}

/** Escena de una ruta según su tema (túneles, costa, patrimonio). */
export function getSceneForRoute(routeSlug?: string | null): SceneId {
  if (!routeSlug) return "atardecer";
  if (routeSlug.includes("costera")) return "playa";
  if (routeSlug.includes("patrimonial")) return "pueblo";
  if (routeSlug.includes("diablo")) return "tunel";
  return "atardecer";
}

const SCENE_BY_THEME: Record<PlaceTheme, SceneId> = {
  playa: "playa",
  dulces: "dulces",
  sabores: "dulces",
  historia: "pueblo",
  naturaleza: "cerro",
  diablo: "tunel",
};

/** Escena del tema que más ofrece un sector del mapa de /explorar. */
export function getSceneForTheme(theme?: PlaceTheme | null): SceneId {
  return (theme && SCENE_BY_THEME[theme]) || "atardecer";
}
