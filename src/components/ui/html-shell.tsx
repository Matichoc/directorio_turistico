import type { ReactNode } from "react";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Fuente "mística" (ver `font-display` en globals.css) — pedido del
 * usuario de que el título del home "llame la atención", algo de "cielo y
 * diablo" en vez de la tipografía normal del sitio. Cinzel (no la variante
 * "Decorative"): tiene ese aire épico/de leyenda antigua sin sacrificar
 * legibilidad en una oración larga como el título del home.
 */
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
});

/**
 * `<html>` y `<body>` del sitio, con el idioma que le pasa cada layout.
 * Antes vivía en `app/layout.tsx` y leía el idioma con `getLocale()`, que en
 * el layout raíz sale de los encabezados de la petición: eso volvía dinámica
 * **cada** página y ninguna se podía cachear (docs/RENDIMIENTO.md). Ahora lo
 * usan `[locale]/layout.tsx` (idioma de la URL), el panel y el 404 raíz.
 */
export function HtmlShell({
  lang,
  children,
}: {
  lang: string;
  children: ReactNode;
}) {
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
