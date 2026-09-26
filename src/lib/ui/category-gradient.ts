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
