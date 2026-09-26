"use client";

import { useState } from "react";
import Image from "next/image";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getPlaceIcon } from "@/lib/ui/category-gradient";

/**
 * Muestra la foto real del lugar si `photoUrl` carga bien; si no hay foto o
 * falla la carga (URL rota, hotlink caído), cae al ícono de categoría — el
 * llamador solo necesita poner el fondo con gradiente detrás.
 *
 * Usa `next/image` (no `<img>` plano): sin esto el navegador bajaba la
 * foto a tamaño completo (a veces varios MB, fotos de celular) y la
 * achicaba con CSS — pesado y desproporcionado en pantallas chicas.
 * `next/image` sirve un tamaño acorde al viewport (`sizes`) y optimiza el
 * formato automáticamente.
 */
export function PhotoOrIcon({
  photoUrl,
  alt,
  categorySlug,
  icon,
  iconClassName,
  imgClassName = "object-cover",
  sizes = "100vw",
  quality,
}: {
  photoUrl?: string | null;
  alt: string;
  categorySlug?: string | null;
  /** Ícono puntual del lugar (ver getPlaceIcon); null cae al de categoría. */
  icon?: string | null;
  iconClassName?: string;
  imgClassName?: string;
  sizes?: string;
  /** Calidad de compresión de `next/image` (por defecto 75). Subirla ayuda
   * en fotos que se muestran grandes y se ven "pixeladas" — aunque si la
   * foto original (ej. subida por un usuario a Google Maps) ya es de baja
   * resolución, ningún valor acá la va a hacer ver más nítida. */
  quality?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      <Image
        src={photoUrl}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    );
  }

  return (
    <CategoryIcon
      icon={getPlaceIcon(categorySlug, icon)}
      className={iconClassName}
    />
  );
}
