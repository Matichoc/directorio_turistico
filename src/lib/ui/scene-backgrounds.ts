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
  "atardecer" | "playa" | "cerro" | "pueblo" | "dulces" | "tunel" | "cocina";

export const SCENE_SRC: Record<SceneId, string> = {
  atardecer: "/fondos/atardecer.webp",
  playa: "/fondos/playa.svg",
  cerro: "/fondos/cerro.webp",
  pueblo: "/fondos/pueblo.webp",
  dulces: "/fondos/dulces.svg",
  tunel: "/fondos/tunel.webp",
  // Cocina de campo bajo el parrón (2026-11-03): gastronomía.
  cocina: "/fondos/cocina.webp",
};

/**
 * Encuadre de cada ilustración del diablo (`object-position` /
 * `background-position`), por ruta de archivo: escenas, portadas de ruta y
 * escenas de la leyenda. Fuente única — toda vista que recorte un arte del
 * diablo usa esto, nunca un centrado por defecto.
 *
 * El primer valor es la cara (en horizontal); el segundo, el borde de arriba
 * del sombrero (con los cuernos). Ojo con el segundo: en CSS el punto p % de
 * la imagen cae en el p % del recuadro, así que con la cara (≈12 %) una
 * cabecera ancha y baja igual le cortaba la cabeza (pedido del usuario:
 * "se están viendo como cortada la cara del protagonista"). Con el borde del
 * sombrero, la cabeza entra entera en cualquier recuadro: lo que se recorta
 * son las botas.
 */
const ART_POSITION: Record<string, string> = {
  // Entrega del diablo campesino (2026-11-02).
  "/fondos/atardecer.webp": "55% 0%",
  "/fondos/cerro.webp": "72% 0%",
  "/fondos/pueblo.webp": "72% 0%",
  "/fondos/tunel.webp": "77% 0%",
  "/fondos/cocina.webp": "65% 0%",
  "/leyendas/escalera.webp": "66% 0%",
  "/leyendas/cueca.webp": "45% 4%",
  "/leyendas/ano-nuevo.webp": "24% 0%",
  "/rutas/ruta-ferroviaria-pedegua-las-palmas.webp": "51% 0%",
  // Portada de "Donde el Diablo perdió el poncho" (2026-11-03), sentado en
  // una piedra al atardecer.
  "/rutas/ruta-del-diablo-pedegua-chincolco-campesino.webp": "57% 0%",
  // Versión provincia (SVG), con el diablo abajo a la derecha.
  "/fondos/playa.svg": "85% 70%",
  "/fondos/dulces.svg": "85% 70%",
};

/**
 * Encuadre de un arte del diablo (ver `ART_POSITION`), o `undefined` si la
 * imagen no es uno de ellos (p. ej. la foto de una parada): ahí manda el
 * encuadre de siempre del componente. Acepta la URL completa del sitio.
 */
export function getArtPosition(src?: string | null): string | undefined {
  if (!src) return undefined;
  let path = src;
  try {
    path = new URL(src, "http://local").pathname;
  } catch {
    return undefined;
  }
  return ART_POSITION[path];
}

/**
 * Ilustraciones hechas con IA (ChatGPT, `docs/PROMPTS-IMAGENES.md`): todo
 * arte del diablo de `ART_POSITION` más los que no se recortan. Pedido del
 * usuario: que quede evidencia de que son generadas con IA mientras no haya
 * fotos reales — toda vista que las muestra pone `AiArtLabel`. Un arte nuevo
 * con IA = su entrada acá (o en `ART_POSITION`); una foto real nunca.
 */
const AI_ART = new Set([
  ...Object.keys(ART_POSITION),
  "/leyendas/diablo-buscando.webp",
  "/brand/logo.png",
]);

/** ¿Es una ilustración hecha con IA? Acepta la URL completa del sitio. */
export function isAiArt(src?: string | null): boolean {
  if (!src) return false;
  try {
    return AI_ART.has(new URL(src, "http://local").pathname);
  } catch {
    return false;
  }
}

/** Encuadre de cada escena (`ART_POSITION` de su archivo). */
export const SCENE_POSITION = Object.fromEntries(
  Object.entries(SCENE_SRC).map(([scene, src]) => [
    scene,
    getArtPosition(src) ?? "center",
  ]),
) as Record<SceneId, string>;

// Gastronomía va a la cocina de campo (2026-11-03), alojamiento al
// atardecer y recreación al cerro: la escena de dulces es de La Ligua
// (versión provincia) y trae el diablo viejo.
const SCENE_BY_CATEGORY: Record<string, SceneId> = {
  playa: "playa",
  naturaleza: "cerro",
  cultura: "pueblo",
  gastronomia: "cocina",
  alojamiento: "atardecer",
  recreacion: "cerro",
};

/** Escena según la categoría que se está mirando; sin categoría, el cerro (el valle de noche). */
export function getSceneForCategory(categorySlug?: string | null): SceneId {
  return (categorySlug && SCENE_BY_CATEGORY[categorySlug]) || "cerro";
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
  sabores: "cocina",
  historia: "pueblo",
  naturaleza: "cerro",
  diablo: "tunel",
};

/** Escena del tema que más ofrece un sector del mapa de /explorar. */
export function getSceneForTheme(theme?: PlaceTheme | null): SceneId {
  return (theme && SCENE_BY_THEME[theme]) || "atardecer";
}
