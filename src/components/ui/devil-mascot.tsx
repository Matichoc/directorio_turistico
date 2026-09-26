/**
 * Mascota decorativa del diablo del dicho popular que le da nombre al
 * sitio — travieso, no terrorífico (mismo tono que "donde el diablo perdió
 * el poncho" en la descripción de la Ruta del Diablo). Línea simple,
 * mismo lenguaje visual que CategoryIcon/los íconos dibujados a mano del
 * sitio (stroke, sin relleno).
 */
export function DevilMascot({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 8c-1.2-1.8-1.2-3.8-.3-5.5" />
      <path d="M17.5 8c1.2-1.8 1.2-3.8.3-5.5" />
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4-2 7-6 9-4-2-6-5-6-9Z" />
      <path d="M8.5 9.8c.8-.7 1.7-.7 2.4 0" />
      <path d="M13.1 9.8c.7-.7 1.6-.7 2.4 0" />
      <path d="M9.3 13.8c1.7 1.3 3.4 1.3 5.1 0" />
      <path d="M11 17.6c.5.8 1.5.8 2 0" />
    </svg>
  );
}
