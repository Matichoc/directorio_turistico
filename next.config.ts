import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Fotos de Wikimedia Commons hotlinkeadas vía Special:FilePath —
        // ver wikimediaFilePath() en scripts/seed.ts.
        protocol: "https",
        hostname: "commons.wikimedia.org",
        pathname: "/wiki/Special:FilePath/**",
      },
    ],
    localPatterns: [
      {
        // Proxy de fotos de Google Places (src/app/api/place-photo/route.ts):
        // usa `?ref=...&w=...`, y Next 16 bloquea por defecto imágenes
        // locales con query string (protección anti-enumeración) a menos
        // que se declaren explícitamente acá. Sin `search` se permite
        // cualquier query string en esta ruta — la propia ruta ya valida
        // el formato de `ref` y limita `w` antes de llamar a Google.
        pathname: "/api/place-photo",
      },
    ],
  },
};

export default withSerwist(withNextIntl(nextConfig));
