import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "El diablo murió en Petorca y en La Ligua lo enterraron",
  description: "Directorio turístico y planificador de rutas para Petorca.",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
