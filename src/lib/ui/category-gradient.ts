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
