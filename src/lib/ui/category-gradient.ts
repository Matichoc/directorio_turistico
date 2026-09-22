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
