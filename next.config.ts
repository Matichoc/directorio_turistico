import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Encabezados de seguridad para todo el sitio (auditoría 2026-11-02). Sin
 * CSP completa todavía: MapLibre usa workers `blob:` y estilos en línea, y
 * una política mal armada rompe los mapas (ver docs/AUDITORIA-2026-11-02.md);
 * por ahora solo `frame-ancestors`, que no afecta nada del propio sitio.
 * Cámara y ubicación quedan permitidas solo al propio sitio (la guía paso a
 * paso las usa); el resto de los permisos, apagados.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        // Service worker escrito a mano (public/sw.js, "sin señal"): el
        // navegador tiene que ver siempre la última versión.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // El panel no debe indexarse (es un layout de cliente, así que no
        // puede exportar `metadata`; el header cubre todas sus páginas).
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Relieve del vuelo 3D (scripts/build-terrain-tiles.py): no cambia
        // nunca, así que el navegador lo guarda para siempre.
        source: "/terrain/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
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
    // OJO: declarar `localPatterns` convierte a next/image de "permite
    // cualquier imagen local sin query string" a "solo permite lo listado
    // acá" — por eso también hay que declarar `/fotos/**` (fotos locales
    // estáticas, ver public/fotos/), no solo la ruta nueva con query string;
    // si no, se rompen las fotos locales existentes (bug real detectado en
    // esta sesión al agregar la primera entrada).
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
      {
        // Fotos locales estáticas subidas a mano (ver public/fotos/README.md).
        pathname: "/fotos/**",
        search: "",
      },
      {
        // Assets de marca (logo de Matichoc, ver public/brand/).
        pathname: "/brand/**",
        search: "",
      },
      {
        // Logo del sitio en tamaño ícono (TopNav; scripts/build-brand-png.mjs).
        pathname: "/icons/**",
        search: "",
      },
      {
        // Portadas de ruta generadas con IA (ver public/rutas/ y
        // routes.cover_image, migración 0011_route_cover_image.sql).
        pathname: "/rutas/**",
        search: "",
      },
      {
        // Escenas de la leyenda (diablo campesino, página /leyenda).
        pathname: "/leyendas/**",
        search: "",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
