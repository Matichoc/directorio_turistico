import type { MunicipalityLink } from "@/types/domain";

/**
 * `href` real para un `contact_links.kind` (`tel:`/`mailto:` para
 * teléfono/email, la URL tal cual para el resto) — un solo lugar de verdad
 * usado por `MunicipalityBanner` y `/informacion` (docs/DESIGN.md).
 */
export function contactLinkHref(kind: string, value: string): string {
  if (kind === "phone") return `tel:${value}`;
  if (kind === "email") return `mailto:${value}`;
  return value;
}

/**
 * Texto visible del link. Para teléfono/email se muestra el dato real
 * (el usuario lo pidió explícitamente: un botón que solo dice "Teléfono" y
 * que además puede no abrir ninguna app en desktop se siente "roto" — con
 * el número/correo a la vista, sirve igual aunque el `tel:`/`mailto:` no
 * dispare nada). El resto de los tipos (sitio, redes) siguen mostrando la
 * etiqueta genérica: la URL completa ahí sería ruido, no dato útil.
 */
export function contactLinkLabel(
  link: MunicipalityLink,
  kindLabels: Record<string, string>,
): string {
  if (link.label) return link.label;
  if (link.kind === "phone" || link.kind === "email") return link.value;
  return kindLabels[link.kind] ?? link.kind;
}
