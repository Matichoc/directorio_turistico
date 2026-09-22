import { useTranslations } from "next-intl";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryGradient } from "@/lib/ui/category-gradient";

/**
 * Mientras no haya fotos reales cargadas (`place_images` sin poblar, ver
 * docs/PLAN.md Riesgos), esta cabecera decorativa por categoría reemplaza un
 * hueco vacío o un texto plano. No pretende ser una foto real.
 */
export function PlacePhotoHero({
  categorySlug,
  name,
}: {
  categorySlug: string;
  name: string;
}) {
  const t = useTranslations("place");

  return (
    <div
      className={`relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${getCategoryGradient(categorySlug)}`}
    >
      <CategoryIcon icon={categorySlug} className="h-20 w-20 text-white/25" />
      <span className="absolute right-2 bottom-2 rounded-full bg-black/25 px-2 py-1 text-[11px] text-white/90 backdrop-blur-sm">
        {t("photosComingSoon")}
      </span>
      <span className="sr-only">{name}</span>
    </div>
  );
}
