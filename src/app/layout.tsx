import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, getSiteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Directorio turístico de la comuna de Petorca, la tierra donde murió el diablo: pueblos, rutas y leyendas.",
  manifest: "/manifest.webmanifest",
};

/**
 * Solo pasa el contenido: el `<html>` lo pone cada sección con
 * `HtmlShell` (`[locale]/layout.tsx` con el idioma de la URL, el panel y el
 * 404). Si este layout leyera el idioma (`getLocale()`), lo sacaría de los
 * encabezados y ninguna página se podría cachear (docs/RENDIMIENTO.md).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
