import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryPinColor } from "@/lib/ui/category-gradient";

/**
 * Pin temático por categoría (forma de gota, ícono blanco al centro, halo
 * pulsante detrás) en vez del círculo genérico anterior — a pedido del
 * usuario, para que el mapa se vea vivo y alusivo a cada lugar en vez de
 * "plomo". `style.animationDelay` se pasa por marcador para que no todos
 * aparezcan/pulsen sincronizados.
 */
export function MapPin({
  categorySlug,
  selected = false,
  delayMs = 0,
}: {
  categorySlug?: string | null;
  selected?: boolean;
  delayMs?: number;
}) {
  const color = getCategoryPinColor(categorySlug);

  return (
    <span
      className="relative flex h-9 w-9 items-center justify-center"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className="absolute h-6 w-6 animate-ping rounded-full opacity-40"
        style={{ backgroundColor: color, animationDelay: `${delayMs}ms` }}
      />
      <span
        className={`animate-pin-pop relative block h-8 w-8 -rotate-45 rounded-[50%_50%_50%_0] border-2 border-white shadow-lg transition-transform duration-150 hover:scale-110 ${
          selected ? "scale-110" : ""
        }`}
        style={{ backgroundColor: color, animationDelay: `${delayMs}ms` }}
      >
        <span className="flex h-full w-full rotate-45 items-center justify-center">
          <CategoryIcon icon={categorySlug} className="h-4 w-4 text-white" />
        </span>
      </span>
    </span>
  );
}
