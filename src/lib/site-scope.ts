/**
 * Comunas que muestra este sitio. La base (`legacy`) sigue teniendo la
 * provincia completa (5 comunas, ver docs/SUPABASE-LEGACY.md): este sitio se
 * acota en la lectura, nunca borrando datos. Pedido del usuario (2026-11-01):
 * "acotar la información a solo la comuna de Petorca" sin perder el
 * desarrollo de la provincia, que queda guardado en la rama
 * `provincia-completa`. Sumar o quitar una comuna = editar esta lista.
 *
 * Lista vacía = sin filtro (las 5 comunas).
 */
export const SITE_COMMUNE_SLUGS: readonly string[] = ["petorca"];

export function isSiteScoped(): boolean {
  return SITE_COMMUNE_SLUGS.length > 0;
}

export function isCommuneInScope(communeSlug: string | null | undefined) {
  if (!isSiteScoped()) return true;
  return Boolean(communeSlug && SITE_COMMUNE_SLUGS.includes(communeSlug));
}
