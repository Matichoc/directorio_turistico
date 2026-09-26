const ICON_PATHS: Record<string, string> = {
  mountain: "M3 20l6-10 4 6 3-4 5 8H3z",
  utensils:
    "M7 3v7a2 2 0 0 0 2 2v9M7 3v7a2 2 0 0 1-2 2v9M17 3c-2 0-3 3-3 6s1 4 3 4 3-1 3-4-1-6-3-6zm0 10v9",
  landmark: "M4 21h16M5 21V10M19 21V10M3 10l9-6 9 6M9 10v11M15 10v11",
  waves:
    "M2 17c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M2 12c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0",
  // Íconos "de la zona" (pedido del usuario, ver PLACE_ICON_OVERRIDES en
  // lib/ui/category-gradient.ts): reemplazan al ícono de categoría en
  // lugares puntuales cuyo contenido calza con el tema, para que el mapa y
  // las fichas se sientan más propias de Petorca/La Ligua.
  dulce:
    "M5 9h14a3 3 0 0 1 0 6H5a3 3 0 0 1 0-6Z M5 9L2 7M5 15L2 17M19 9l3-2M19 15l3 2",
  tejido: "M8 4L12 8L16 4M8 4L6 7V20H18V7L16 4M8 4H16",
  diablo:
    "M7 9a5 5 0 0 1 10 0c0 3-1.5 5.5-5 7-3.5-1.5-5-4-5-7Z M6 9c-1-1.5-1-3-.3-4.5 M18 9c1-1.5 1-3 .3-4.5 M9.5 15c1.5 1 3.5 1 5 0",
  surf: "M12 2c3.5 5 3.5 15 0 20-3.5-5-3.5-15 0-20Z M12 7v10",
  "casco-minero": "M4 15a8 8 0 0 1 16 0v1H4v-1Z M9.5 13v-2a2.5 2.5 0 0 1 5 0v2",
  palta:
    "M12 3c4 3.5 6 8.5 6 12.5a6 6 0 0 1-12 0c0-4 2-9 6-12.5Z M9.6 15.5a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 1 0 -4.8 0",
};

export function CategoryIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: string | null | undefined;
  className?: string;
}) {
  const path = (icon && ICON_PATHS[icon]) || ICON_PATHS.landmark;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
