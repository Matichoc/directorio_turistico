import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Origen de un estilo de mapa propio (`NEXT_PUBLIC_MAP_STYLE_URL`), si hay. */
function mapStyleOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "").origin;
  } catch {
    return "";
  }
}

/**
 * Política de contenido completa (auditoría H-05), por ahora en modo
 * **solo informe** (`Content-Security-Policy-Report-Only`): el navegador no
 * bloquea nada, solo avisa en la consola lo que bloquearía. Así se prueba en
 * la vista previa sin arriesgar los mapas (MapLibre usa workers `blob:`) y,
 * sin avisos, se aplica de verdad con `CSP_MODE=enforce` al compilar (variable
 * de entorno en Vercel, sin tocar código; docs/AUDITORIA-2026-11-02.md).
 * `unsafe-inline` en scripts: Next mete scripts en línea sin nonce en páginas
 * cacheadas; `unsafe-eval` solo en desarrollo (recarga en caliente).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://commons.wikimedia.org https://upload.wikimedia.org https://tiles.openfreemap.org",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://tiles.openfreemap.org ${mapStyleOrigin()}`.trim(),
  // Reportajes de TV (lib/reportajes.ts): el reproductor oficial de cada canal.
  "frame-src 'self' https://www.youtube-nocookie.com https://rudo.video",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/**
 * Encabezados de seguridad para todo el sitio (auditoría 2026-11-02).
 * `frame-ancestors` sí se aplica (no afecta nada del propio sitio); el resto
 * de la política va en modo informe, ver arriba. Cámara y ubicación quedan
 * permitidas solo al propio sitio (la guía paso a paso las usa); el resto de
 * los permisos, apagados.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(process.env.CSP_MODE === "enforce"
    ? [{ key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }]
    : [
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        {
          key: "Content-Security-Policy-Report-Only",
          value: CONTENT_SECURITY_POLICY,
        },
      ]),
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
        // El panel no debe indexarse (el header cubre todas sus páginas,
        // también las respuestas que no son HTML, como el CSV exportado).
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
