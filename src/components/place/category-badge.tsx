import { CategoryIcon } from "@/components/ui/category-icon";
import {
  getCategoryIcon,
  getCategoryPinColor,
} from "@/lib/ui/category-gradient";

/**
 * Insignia de categoría sobre la foto (esquina superior izquierda). Pedido
 * del usuario: que la gastronomía "se note" en vez de quedar plana entre
 * las demás categorías — se aplica a todas por consistencia visual, cada
 * una con su color/ícono (ver category-gradient.ts).
 */
export function CategoryBadge({
  categorySlug,
  categoryName,
  className = "",
}: {
  categorySlug?: string | null;
  categoryName?: string | null;
  className?: string;
}) {
  if (!categoryName) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm ${className}`}
      style={{ backgroundColor: `${getCategoryPinColor(categorySlug)}e6` }}
    >
      <CategoryIcon icon={getCategoryIcon(categorySlug)} className="h-3 w-3" />
      {categoryName}
    </span>
  );
}
