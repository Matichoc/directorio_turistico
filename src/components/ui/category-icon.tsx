const ICON_PATHS: Record<string, string> = {
  mountain: "M3 20l6-10 4 6 3-4 5 8H3z",
  utensils:
    "M7 3v7a2 2 0 0 0 2 2v9M7 3v7a2 2 0 0 1-2 2v9M17 3c-2 0-3 3-3 6s1 4 3 4 3-1 3-4-1-6-3-6zm0 10v9",
  landmark: "M4 21h16M5 21V10M19 21V10M3 10l9-6 9 6M9 10v11M15 10v11",
  waves:
    "M2 17c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M2 12c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0",
  // Íconos "de la zona" (pedido del usuario, asignados por lugar vía
  // `places.icon` — ver migración 0010_place_icon.sql y getPlaceIcon en
  // lib/ui/category-gradient.ts): reemplazan al ícono de categoría en
  // lugares puntuales cuyo contenido calza con el tema, para que el mapa y
  // las fichas se sientan más propias de la zona.
  dulce:
    "M5 9h14a3 3 0 0 1 0 6H5a3 3 0 0 1 0-6Z M5 9L2 7M5 15L2 17M19 9l3-2M19 15l3 2",
  tejido: "M8 4L12 8L16 4M8 4L6 7V20H18V7L16 4M8 4H16",
  diablo:
    "M7 9a5 5 0 0 1 10 0c0 3-1.5 5.5-5 7-3.5-1.5-5-4-5-7Z M6 9c-1-1.5-1-3-.3-4.5 M18 9c1-1.5 1-3 .3-4.5 M9.5 15c1.5 1 3.5 1 5 0",
  surf: "M12 2c3.5 5 3.5 15 0 20-3.5-5-3.5-15 0-20Z M12 7v10",
  "casco-minero": "M4 15a8 8 0 0 1 16 0v1H4v-1Z M9.5 13v-2a2.5 2.5 0 0 1 5 0v2",
  pueblo: "M3 11.5 8 7l5 4.5M5 10.5V19h6v-7.5M14 19v-5.5l3.5-3L21 13.5V19h-7Z",
  palta:
    "M12 3c4 3.5 6 8.5 6 12.5a6 6 0 0 1-12 0c0-4 2-9 6-12.5Z M9.6 15.5a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 1 0 -4.8 0",
  // Categorías de Explorar (alojamiento y recreación).
  cama: "M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6M7 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  recreacion: "M12 3v18M12 3c-4 0-7 2.5-8 6h16c-1-3.5-4-6-8-6Z M5 21h14",
  // De la comuna de Petorca (fichas del jugador): el cucharón y el poncho
  // del diablo aprobado, el ramal y el Túnel Las Palmas, y los petroglifos
  // de Chincolco.
  cucharon:
    "M11.5 8.5a5 5 0 0 0 10 0Z M15 8.5 5 18.5 M5 18.5l-1.5 3M5 18.5l.5 3.2",
  poncho:
    "M9 4h6l6 12H3L9 4Z M12 4v3 M5.5 11h13 M5 16v4M9 16v4M15 16v4M19 16v4",
  tren: "M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z M4 10h16 M8.5 14.5h.01M15.5 14.5h.01 M8 18l-2 3M16 18l2 3",
  tunel:
    "M3 21V11a9 9 0 0 1 18 0v10 M7.5 21v-9a4.5 4.5 0 0 1 9 0v9 M10.5 21l.7-5M13.5 21l-.7-5",
  petroglifo:
    "M12 12.5a1 1 0 1 1 1-1 2.5 2.5 0 1 1-2.5-2.5 4 4 0 1 1-4 4 5.5 5.5 0 1 1 5.5 5.5",
  // Eventos de la comuna (página /eventos).
  calendario:
    "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z M3 10h18 M8 3v4M16 3v4 M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01",
};

/** Claves válidas de `places.icon` — derivadas de `ICON_PATHS`, nunca duplicadas a mano. */
export const ICON_KEYS = Object.keys(ICON_PATHS);

export function CategoryIcon({
  icon,
  className = "h-5 w-5",
  strokeWidth = 1.75,
}: {
  icon: string | null | undefined;
  className?: string;
  /** Grosor del trazo: más grueso en las fichas metálicas, que lo "graban". */
  strokeWidth?: number;
}) {
  const path = (icon && ICON_PATHS[icon]) || ICON_PATHS.landmark;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

/**
 * Flechas de giro de la guía paso a paso (`LiveGuide`, `GuideCamera`): mismo
 * archivo que el resto de los íconos (ver docs/DESIGN.md), pero en su propio
 * `Record` — no son íconos de lugar, así que no entran en `ICON_KEYS`.
 */
const MANEUVER_PATHS: Record<string, string> = {
  straight: "M12 21V4M6 10l6-6 6 6",
  left: "M17 21v-7a4 4 0 0 0-4-4H5M9 6l-4 4 4 4",
  right: "M7 21v-7a4 4 0 0 1 4-4h8M15 6l4 4-4 4",
  slightLeft: "M15 21v-6L7.5 7.5M7 13V7h6",
  slightRight: "M9 21v-6l7.5-7.5M11 7h6v6",
  sharpLeft: "M16 21V8L7 17M7 11v6h6",
  sharpRight: "M8 21V8l9 9M17 11v6h-6",
  keepLeft: "M15 21v-6L7.5 7.5M7 13V7h6M17 21v-9",
  keepRight: "M9 21v-6l7.5-7.5M11 7h6v6M7 21v-9",
  uturn: "M8 21V9a4 4 0 0 1 8 0v7M12 12l4 4 4-4",
  roundabout: "M12 21v-5M12 16a4 4 0 1 1 4-4M16 12h-4M14.5 9.5 16 12l2.5-1.5",
  arrive: "M6 21V4M6 4h11l-2.5 4 2.5 4H6",
};

export function ManeuverIcon({
  action,
  className = "h-6 w-6",
}: {
  action: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={MANEUVER_PATHS[action] ?? MANEUVER_PATHS.straight} />
    </svg>
  );
}
