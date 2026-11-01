"use client";

import { useEffect } from "react";

/**
 * Registra `public/sw.js` (ver ese archivo): lo que hace que el sitio y lo
 * guardado con "Guardar para usar sin señal" funcionen sin red. Solo en
 * producción — en `next dev` guardaría archivos que cambian a cada rato —,
 * salvo `NEXT_PUBLIC_SW_DEV=1` para probarlo localmente.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_SW_DEV === "1";
    if (!enabled || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker el sitio funciona igual, solo que no sin señal.
    });
  }, []);

  return null;
}
