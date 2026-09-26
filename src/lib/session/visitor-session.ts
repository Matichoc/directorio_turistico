/**
 * Identificador anónimo de sesión del visitante — generado y guardado en
 * el navegador (no en el servidor), porque hoy no existe login real.
 * Mismo espíritu que `itineraries.session_id`. Nació para "me gusta"
 * (migración `0014_place_likes.sql`) y ahora también identifica a quien
 * deja un comentario (`0015_place_comments.sql`) — un solo concepto de
 * "quién es este visitante anónimo" en vez de uno por feature. Un login
 * opcional real (Google/Facebook) puede convivir con esto después sin
 * romper nada, ver docs/PLAN.md sección 8.1.
 */
// Mismo nombre de clave que cuando esto vivía en `lib/likes/session.ts` —
// no se cambia al mover/renombrar para no invalidar el `session_id` de
// visitantes que ya volvieron con esta clave guardada (perderían el
// vínculo con sus "me gusta" ya dados).
const STORAGE_KEY = "petorca-like-session";

export function getVisitorSessionId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
