import { useTranslations } from "next-intl";

/**
 * Insignia de "Destacado": posición publicitaria pagada, gestionada a
 * mano por el dueño del sitio (ver `places.featured_until`, sin pasarela
 * de pago — docs/PLAN.md). Ámbar a propósito, distinto del color de
 * cualquier categoría, para que se lea como promoción y no como un dato
 * más del lugar.
 */
export function FeaturedBadge({ className = "" }: { className?: string }) {
  const t = useTranslations("place");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[11px] font-semibold text-white shadow-sm ${className}`}
    >
      ★ {t("featured")}
    </span>
  );
}
