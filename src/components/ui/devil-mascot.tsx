import Image from "next/image";

/**
 * Mascota decorativa del diablo del dicho popular que le da nombre al
 * sitio — travieso, no terrorífico (mismo tono que "donde el diablo perdió
 * el poncho"). Es la cabeza del diablo campesino (`public/icons/icon-192.png`,
 * generada desde `brand/icono.png`): antes era un SVG de línea del diablito
 * anterior, que ya no calzaba con el personaje (auditoría H-11).
 */
export function DevilMascot({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <Image
      src="/icons/icon-192.png"
      alt=""
      width={48}
      height={48}
      className={`rounded-full ${className}`}
      aria-hidden="true"
    />
  );
}
