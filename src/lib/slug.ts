/**
 * Convierte un nombre libre en un slug kebab-case sin acentos (ej:
 * "La Ligua" → "la-ligua"). Usado para autogenerar el slug en el alta
 * simple (formulario y carga por CSV) — alguien de negocio no debería
 * tener que inventar un slug a mano.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
