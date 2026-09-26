/**
 * Ficha ("token" tipo Monopoly, pedido del usuario) que representa al
 * usuario mismo en el mapa de navegación en vivo — no un lugar. Se elige
 * entre los íconos "de la zona" ya existentes (ver ICON_PATHS en
 * category-icon.tsx) y se guarda solo en este dispositivo (localStorage),
 * igual que el resto del estado de recorrido/progreso. Mismo patrón de
 * evento en `window` que `lib/trip/storage.ts` para que los componentes
 * montados se mantengan sincronizados sin prop drilling.
 */

const STORAGE_KEY = "petorca-nav-avatar";
export const AVATAR_EVENT = "avatar:change";

/** Íconos elegibles como ficha — los temáticos "de la zona", no los de
 * categoría genérica (mountain/utensils/landmark/waves), para que la
 * ficha se sienta propia de Petorca/La Ligua. */
export const AVATAR_ICONS = [
  "diablo",
  "dulce",
  "tejido",
  "surf",
  "casco-minero",
  "palta",
] as const;

export type AvatarIcon = (typeof AVATAR_ICONS)[number];

/** Ficha por defecto si el usuario no eligió ninguna: el diablo, mascota
 * del sitio. */
export const DEFAULT_AVATAR_ICON: AvatarIcon = "diablo";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAvatarIcon(): AvatarIcon {
  if (!isBrowser()) return DEFAULT_AVATAR_ICON;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return (AVATAR_ICONS as readonly string[]).includes(stored ?? "")
    ? (stored as AvatarIcon)
    : DEFAULT_AVATAR_ICON;
}

export function setAvatarIcon(icon: AvatarIcon): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, icon);
  window.dispatchEvent(new Event(AVATAR_EVENT));
}
