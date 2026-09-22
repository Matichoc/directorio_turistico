import { useTranslations } from "next-intl";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import { getCategoryGradient } from "@/lib/ui/category-gradient";

/**
 * Cabecera de la ficha de lugar: muestra la foto real si existe (Wikimedia
 * Commons con licencia libre, cargada por `scripts/seed.ts`) con su crédito;
 * si no hay foto, cae a un gradiente por categoría con ícono en vez de un
 * hueco vacío (ver docs/PLAN.md Riesgos).
 *
 * `aspect-[3/2]` (más alto que ancho relativo) en vez de una altura fija:
 * muchas fotos reales usadas acá son retratos/arquitectura tomados en
 * vertical (p. ej. una torre de iglesia) — con una franja baja y fija
 * `object-cover` recortaba casi todo menos el cielo. Con más alto relativo
 * y `object-[center_65%]` (sesgado hacia abajo, no el centro exacto) se ve
 * más del edificio y menos cielo vacío. No se usa `aspect-[4/3]` (más alto
 * todavía) porque en mobile la foto terminaba dominando la pantalla.
 */
export function PlacePhotoHero({
  categorySlug,
  name,
  photoUrl,
  photoAttribution,
}: {
  categorySlug: string;
  name: string;
  photoUrl?: string | null;
  photoAttribution?: string | null;
}) {
  const t = useTranslations("place");

  return (
    <div
      className={`relative flex aspect-[3/2] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br sm:aspect-video ${getCategoryGradient(categorySlug)}`}
    >
      <PhotoOrIcon
        photoUrl={photoUrl}
        alt={name}
        categorySlug={categorySlug}
        iconClassName="h-20 w-20 text-white/25"
        imgClassName="object-cover object-[center_65%]"
        sizes="100vw"
      />
      <span className="absolute right-2 bottom-2 rounded-full bg-black/40 px-2 py-1 text-[11px] text-white/90 backdrop-blur-sm">
        {photoUrl
          ? (photoAttribution ?? t("photoCredit"))
          : t("photosComingSoon")}
      </span>
    </div>
  );
}
