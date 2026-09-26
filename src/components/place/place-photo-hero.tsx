"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import { CategoryBadge } from "@/components/place/category-badge";
import { FeaturedBadge } from "@/components/place/featured-badge";
import { getCategoryGradient } from "@/lib/ui/category-gradient";

interface PlacePhoto {
  url: string;
  attribution: string | null;
}

/**
 * Cabecera de la ficha de lugar: carrusel de fotos reales si existen
 * (Wikimedia Commons, Google Places o locales — ver `scripts/seed.ts` y
 * `scripts/fetch-google-photos.ts`) con flechas/puntos para navegar entre
 * ellas y su crédito; si no hay ninguna, cae a un gradiente por categoría
 * con ícono en vez de un hueco vacío (ver docs/PLAN.md Riesgos).
 *
 * Cuadrada y de tamaño tope fijo (`h-40 w-40 sm:h-52 sm:w-52`, centrada) en
 * vez de un banner a todo el ancho: con banner a 100vw, en monitores anchos
 * la foto terminaba ocupando casi toda la pantalla ("se ve gigante",
 * feedback repetido del usuario incluso con una foto real bien encuadrada),
 * y cuando no había foto el ícono de categoría quedaba flotando en un
 * bloque de color enorme y vacío ("mucho espacio usado en una imagen que
 * no está"). Con tamaño fijo el recorte (`object-cover`) hace más trabajo,
 * por eso se mantiene `object-[center_65%]` (sesgado hacia abajo) para
 * fotos en formato retrato/arquitectura donde el centro exacto muestra
 * puro cielo.
 *
 * `key={current?.url}` en `PhotoOrIcon`: sin esto, el estado interno de
 * "la imagen falló" (`useState` de un `onError`) queda pegado entre fotos
 * — una foto rota dejaría el ícono de categoría fijo aunque el usuario
 * navegue a otra foto que sí carga bien.
 */
export function PlacePhotoHero({
  categorySlug,
  categoryName,
  icon,
  name,
  photos,
  isFeatured = false,
}: {
  categorySlug: string;
  categoryName?: string | null;
  icon?: string | null;
  name: string;
  photos: PlacePhoto[];
  isFeatured?: boolean;
}) {
  const t = useTranslations("place");
  const [index, setIndex] = useState(0);

  const current = photos[index] ?? null;
  const hasMultiple = photos.length > 1;

  function goTo(nextIndex: number) {
    setIndex((nextIndex + photos.length) % photos.length);
  }

  return (
    <div
      className={`relative mx-auto flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br sm:h-52 sm:w-52 ${getCategoryGradient(categorySlug)}`}
    >
      <PhotoOrIcon
        key={current?.url ?? "placeholder"}
        photoUrl={current?.url}
        alt={name}
        categorySlug={categorySlug}
        icon={icon}
        iconClassName="h-12 w-12 text-white/25"
        imgClassName="object-cover object-[center_65%]"
        sizes="(min-width: 640px) 208px, 160px"
      />

      <CategoryBadge
        categorySlug={categorySlug}
        categoryName={categoryName}
        className="absolute top-2 left-2"
      />
      {isFeatured && <FeaturedBadge className="absolute top-2 right-2" />}

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={t("previousPhoto")}
            className="absolute top-1/2 left-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={t("nextPhoto")}
            className="absolute top-1/2 right-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-2 flex gap-1">
            {photos.map((photo, photoIndex) => (
              <button
                key={photo.url}
                type="button"
                onClick={() => setIndex(photoIndex)}
                aria-label={t("goToPhoto", { number: photoIndex + 1 })}
                aria-current={photoIndex === index}
                className={`h-1.5 rounded-full transition-all ${
                  photoIndex === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}

      <span className="absolute right-1.5 bottom-1.5 max-w-[70%] truncate rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] text-white/90 backdrop-blur-sm">
        {current
          ? (current.attribution ?? t("photoCredit"))
          : t("photosComingSoon")}
      </span>
    </div>
  );
}
