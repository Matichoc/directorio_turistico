/**
 * ¿Pueden los buscadores indexar el sitio? Mientras no se lance, no
 * (pedido del usuario, 2026-11-02: "esto aún es privado"): el sitio funciona
 * igual con el link (WhatsApp, sin señal, todo), pero cada respuesta lleva
 * `X-Robots-Tag: noindex` (next.config.ts), cada página su `<meta
 * name="robots">` (buildPageMetadata) y el robots.txt no anuncia el sitemap.
 *
 * El día del lanzamiento: `SITE_INDEXING=on` en Vercel (solo Production) y
 * volver a desplegar (docs/DOMINIO.md, paso 8). Se lee al compilar y en el
 * servidor; nunca en el navegador.
 */
export function isSiteIndexable(): boolean {
  return process.env.SITE_INDEXING === "on";
}
