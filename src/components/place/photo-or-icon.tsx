"use client";

import { useState } from "react";
import Image from "next/image";
import { CategoryIcon } from "@/components/ui/category-icon";

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
  iconClassName,
  imgClassName = "object-cover",
  sizes = "100vw",
}: {
  photoUrl?: string | null;
  alt: string;
  categorySlug?: string | null;
  iconClassName?: string;
  imgClassName?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      <Image
        src={photoUrl}
        alt={alt}
        fill
        sizes={sizes}
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    );
  }

  return <CategoryIcon icon={categorySlug} className={iconClassName} />;
}
