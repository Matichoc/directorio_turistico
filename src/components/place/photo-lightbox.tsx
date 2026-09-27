"use client";

import { useEffect } from "react";
import Image from "next/image";

/**
 * Foto a pantalla completa (tamaño real, sin el recorte cuadrado de la
 * miniatura) — pedido del usuario ("deberíamos poder ingresar a la imagen
 * en tamaño real"). Se cierra con la X, tocando el fondo, o Escape.
 */
export function PhotoLightbox({
  photoUrl,
  alt,
  onClose,
}: {
  photoUrl: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
      >
        ×
      </button>
      <div
        className="relative h-full max-h-[85vh] w-full max-w-4xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={photoUrl}
          alt={alt}
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}
