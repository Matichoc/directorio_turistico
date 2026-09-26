/**
 * Identificador anónimo de sesión para "me gusta" (ver migración
 * `0014_place_likes.sql`) — mismo espíritu que `itineraries.session_id`,
 * pero generado y guardado en el navegador en vez de en el servidor,
 * porque hoy no existe login real. Sirve de base para lo que el usuario
 * pidió ("un identificador de sesión para guardar la ruta, poder dar me
 * gusta y recomendar mejor lo que se ve"); un login opcional real
 * (Google/Facebook) puede convivir con esto después sin romper nada, ver
 * docs/PLAN.md sección 8.1.
 */
const STORAGE_KEY = "petorca-like-session";

export function getLikeSessionId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
