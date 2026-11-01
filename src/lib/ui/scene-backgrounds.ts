import type { PlaceTheme } from "@/lib/ui/category-gradient";

/**
 * Fondos ilustrados con el diablo de Petorca en distintos escenarios de la
 * comuna — pedido del usuario: "que el diablito aparezca o en la playa, o en
 * el cerro, o con poncho, según como lo busquen y donde naveguen". Arte
 * aprobado (frac, poncho y cucharón de madera con borla; ver
 * docs/PROMPTS-IMAGENES.md) en `public/fondos/*.webp`, compuesto con el diablo
 * a la derecha y el título a la izquierda. `playa` y `dulces` son de la
 * versión de la provincia y siguen en SVG.
 */
export type SceneId =
  "atardecer" | "playa" | "cerro" | "pueblo" | "dulces" | "tunel";

export const SCENE_SRC: Record<SceneId, string> = {
  atardecer: "/fondos/atardecer.webp",
  playa: "/fondos/playa.svg",
  cerro: "/fondos/cerro.webp",
  pueblo: "/fondos/pueblo.webp",
  dulces: "/fondos/dulces.svg",
  tunel: "/fondos/tunel.webp",
};

/**
 * Punto de la escena que tiene que quedar a la vista al recortarla
 * (`background-position`): la cara y el torso del diablo. Usarlo en todo
 * lugar que muestre una escena, así una cabecera ancha o una postal angosta
 * nunca le cortan la cabeza.
 */
export const SCENE_POSITION: Record<SceneId, string> = {
  atardecer: "80% 22%",
  playa: "85% 70%",
  cerro: "78% 26%",
  pueblo: "78% 34%",
  dulces: "85% 70%",
  tunel: "82% 30%",
};

// Gastronomía y alojamiento van al pueblo en fiesta y recreación al cerro:
// la escena de dulces es de La Ligua (versión provincia) y trae el diablo
// viejo.
const SCENE_BY_CATEGORY: Record<string, SceneId> = {
  playa: "playa",
  naturaleza: "cerro",
  cultura: "pueblo",
  gastronomia: "pueblo",
  alojamiento: "atardecer",
  recreacion: "cerro",
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
  sabores: "pueblo",
  historia: "pueblo",
  naturaleza: "cerro",
  diablo: "tunel",
};

/** Escena del tema que más ofrece un sector del mapa de /explorar. */
export function getSceneForTheme(theme?: PlaceTheme | null): SceneId {
  return (theme && SCENE_BY_THEME[theme]) || "atardecer";
}
