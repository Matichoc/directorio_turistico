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
 * las fichas se sientan de Petorca/La Ligua, no genéricas) — solo para
 * lugares cuyo contenido ya sourceado en `scripts/seed.ts` calza de verdad
 * con el tema, no una asignación decorativa forzada:
 * - dulce: Área de los Dulces de La Ligua (patrimonio cultural inmaterial).
 * - tejido: Valle Hermoso, "la cuna del tejido" (barrio artesanal textil).
 * - diablo: Escalera del Diablo (la leyenda que le da nombre al sitio).
 * - surf: Los Molles y Pichicuy (ambos con ola/surf documentado).
 * - casco-minero: San Lorenzo (parroquia patrona de mineros) y la línea
 *   férrea Cabildo-Pedegua-Petorca (túneles, puente, construida para el
 *   transporte minero del norte de Chile).
 * "palta" (aguacate, cultivo emblemático de Petorca) queda en la paleta de
 * íconos pero sin asignar: ningún lugar del catálogo lo documenta todavía.
 */
const PLACE_ICON_OVERRIDES: Record<string, string> = {
  "la-ligua-area-de-dulces": "dulce",
  "la-ligua-valle-hermoso": "tejido",
  "escalera-del-diablo": "diablo",
  "la-ligua-los-molles": "surf",
  "la-ligua-pichicuy": "surf",
  "cabildo-san-lorenzo": "casco-minero",
  "cabildo-tunel-la-grupa": "casco-minero",
  "petorca-tunel-las-palmas": "casco-minero",
  "ruta-de-los-tuneles": "casco-minero",
  pedegua: "casco-minero",
  "pedegua-puente": "casco-minero",
};

export function getPlaceIcon(
  categorySlug: string | null | undefined,
  placeSlug: string | null | undefined,
) {
  if (placeSlug && PLACE_ICON_OVERRIDES[placeSlug]) {
    return PLACE_ICON_OVERRIDES[placeSlug];
  }
  return getCategoryIcon(categorySlug);
}
