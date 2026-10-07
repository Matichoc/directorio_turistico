const GRADIENTS: Record<string, string> = {
  naturaleza: "from-emerald-700 via-emerald-600 to-teal-500",
  gastronomia: "from-amber-700 via-orange-600 to-amber-500",
  cultura: "from-indigo-700 via-violet-600 to-fuchsia-500",
  playa: "from-sky-700 via-cyan-600 to-teal-400",
};

const DEFAULT_GRADIENT = GRADIENTS.cultura;

export function getCategoryGradient(categorySlug: string | null | undefined) {
  return (categorySlug && GRADIENTS[categorySlug]) || DEFAULT_GRADIENT;
}

/** Colores sólidos por categoría para los pines del mapa (ver map-view.tsx). */
const PIN_COLORS: Record<string, string> = {
  naturaleza: "#059669", // emerald-600 — cordillera/bosque
  gastronomia: "#ea580c", // orange-600
  cultura: "#7c3aed", // violet-600
  playa: "#0891b2", // cyan-600 — mar
};

const DEFAULT_PIN_COLOR = "#b3401f"; // acento del sitio (terracota)

export function getCategoryPinColor(categorySlug: string | null | undefined) {
  return (categorySlug && PIN_COLORS[categorySlug]) || DEFAULT_PIN_COLOR;
}

/**
 * Nombre de ícono (para `<CategoryIcon icon={...}>`) por slug de
 * categoría — coincide con `categories.icon` de `scripts/seed.ts`. Bug
 * real corregido acá: varios llamadores le pasaban el slug directo a
 * `CategoryIcon` (que espera un nombre de ícono, no un slug), así que
 * siempre caían al ícono por defecto salvo coincidencia casual.
 */
const CATEGORY_ICONS: Record<string, string> = {
  naturaleza: "mountain",
  gastronomia: "utensils",
  cultura: "landmark",
  playa: "waves",
};

const DEFAULT_CATEGORY_ICON = CATEGORY_ICONS.cultura;

export function getCategoryIcon(categorySlug: string | null | undefined) {
  return (
    (categorySlug && CATEGORY_ICONS[categorySlug]) || DEFAULT_CATEGORY_ICON
  );
}

/**
 * Ícono "de la zona" por lugar puntual (pedido del usuario: que el mapa y
 * las fichas se sientan de Petorca/La Ligua, no genéricas). Antes era un
 * mapa fijo acá mismo (`PLACE_ICON_OVERRIDES`); ahora `placeIcon` viene del
 * campo `places.icon` (ver migración 0010_place_icon.sql) — dato, no
 * código, para que asignar o cambiar el ícono de un lugar no requiera un
 * deploy y quede listo para que un futuro panel de administración lo deje
 * elegir. `null`/vacío cae al ícono de la categoría.
 */
export function getPlaceIcon(
  categorySlug: string | null | undefined,
  placeIcon: string | null | undefined,
) {
  return placeIcon || getCategoryIcon(categorySlug);
}

/**
 * Lo que "ofrece" un lugar en el mapa de /explorar (pedido del usuario: un
 * mapa con animaciones de playa, de dulces, de historias, de diablos). Sale
 * siempre de datos reales — la categoría del lugar y su `places.icon` —,
 * nunca de una asignación decorativa: un lugar de "dulces" es uno cuyo ícono
 * real es `dulce`, y "diablo" solo los que tienen el ícono `diablo` en la
 * base. Cada tema trae su ícono, su color y su animación (`MapThemeAura`).
 */
export type PlaceTheme =
  "playa" | "dulces" | "sabores" | "historia" | "naturaleza" | "diablo";

const THEME_BY_ICON: Record<string, PlaceTheme> = {
  diablo: "diablo",
  dulce: "dulces",
  surf: "playa",
  waves: "playa",
  "casco-minero": "historia",
  tejido: "historia",
  landmark: "historia",
  mountain: "naturaleza",
  palta: "naturaleza",
  utensils: "sabores",
};

const THEME_BY_CATEGORY: Record<string, PlaceTheme> = {
  playa: "playa",
  gastronomia: "sabores",
  cultura: "historia",
  naturaleza: "naturaleza",
};

export function getPlaceTheme(
  categorySlug: string | null | undefined,
  placeIcon: string | null | undefined,
): PlaceTheme {
  return (
    (placeIcon && THEME_BY_ICON[placeIcon]) ||
    (categorySlug && THEME_BY_CATEGORY[categorySlug]) ||
    "historia"
  );
}

export const THEME_STYLE: Record<PlaceTheme, { icon: string; color: string }> =
  {
    playa: { icon: "waves", color: PIN_COLORS.playa },
    dulces: { icon: "dulce", color: "#ec4899" }, // pink-500 — dulces de La Ligua
    sabores: { icon: "utensils", color: PIN_COLORS.gastronomia },
    historia: { icon: "landmark", color: PIN_COLORS.cultura },
    naturaleza: { icon: "mountain", color: PIN_COLORS.naturaleza },
    diablo: { icon: "diablo", color: "#dc2626" }, // red-600 — el diablo de la zona
  };
