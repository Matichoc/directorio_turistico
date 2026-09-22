"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/ui/category-icon";

/**
 * Muestra la foto real del lugar si `photoUrl` carga bien; si no hay foto o
 * falla la carga (URL rota, hotlink caído), cae al ícono de categoría — el
 * llamador solo necesita poner el fondo con gradiente detrás.
 */
export function PhotoOrIcon({
  photoUrl,
  alt,
  categorySlug,
  iconClassName,
  imgClassName = "h-full w-full object-cover",
}: {
  photoUrl?: string | null;
  alt: string;
  categorySlug?: string | null;
  iconClassName?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    // `<img>` a propósito: son fotos externas hotlinkeadas desde Wikimedia
    // Commons (`Special:FilePath`, ver scripts/seed.ts) con `onError` como
    // respaldo — configurar next/image para un dominio externo variable no
    // vale la pena para el puñado de fotos que hay hoy.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    );
  }

  return <CategoryIcon icon={categorySlug} className={iconClassName} />;
}
