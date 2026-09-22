import { useTranslations } from "next-intl";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import { CategoryBadge } from "@/components/place/category-badge";
import { getCategoryGradient } from "@/lib/ui/category-gradient";

/**
 * Cabecera de la ficha de lugar: muestra la foto real si existe (Wikimedia
 * Commons con licencia libre, cargada por `scripts/seed.ts`) con su crédito;
 * si no hay foto, cae a un gradiente por categoría con ícono en vez de un
 * hueco vacío (ver docs/PLAN.md Riesgos).
 *
 * Alto fijo (`h-48 sm:h-64`) en vez de `aspect-ratio`: con aspect-ratio el
 * alto crece junto con el ancho de pantalla (100vw), así que en monitores
 * anchos la foto terminaba ocupando casi toda la pantalla ("se ve gigante",
 * feedback repetido del usuario incluso con una foto real bien encuadrada).
 * Con alto fijo el recorte (`object-cover`) hace más trabajo, por eso se
 * mantiene `object-[center_65%]` (sesgado hacia abajo) para fotos en
 * formato retrato/arquitectura donde el centro exacto muestra puro cielo.
 */
export function PlacePhotoHero({
  categorySlug,
  categoryName,
  name,
  photoUrl,
  photoAttribution,
}: {
  categorySlug: string;
  categoryName?: string | null;
  name: string;
  photoUrl?: string | null;
  photoAttribution?: string | null;
}) {
  const t = useTranslations("place");

  return (
    <div
      className={`relative flex h-48 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br sm:h-64 ${getCategoryGradient(categorySlug)}`}
    >
      <PhotoOrIcon
        photoUrl={photoUrl}
        alt={name}
        categorySlug={categorySlug}
        iconClassName="h-20 w-20 text-white/25"
        imgClassName="object-cover object-[center_65%]"
        sizes="100vw"
      />
      <CategoryBadge
        categorySlug={categorySlug}
        categoryName={categoryName}
        className="absolute top-2 left-2"
      />
      <span className="absolute right-2 bottom-2 rounded-full bg-black/40 px-2 py-1 text-[11px] text-white/90 backdrop-blur-sm">
        {photoUrl
          ? (photoAttribution ?? t("photoCredit"))
          : t("photosComingSoon")}
      </span>
    </div>
  );
}
