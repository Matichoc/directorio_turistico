import { createClient } from "@/lib/supabase/client";

/**
 * Garantiza que este visitante tenga una sesión real de Supabase Auth —
 * anónima por defecto (`signInAnonymously()`), sin pedir email/contraseña.
 * Supabase persiste la sesión en cookies (vía `@supabase/ssr`), así que el
 * mismo `user_id` sirve tanto para escrituras directas desde el cliente
 * (`LikeButton`) como para server actions que leen la sesión desde
 * cookies (`submitComment`) — nadie tiene que pasar la identidad a mano,
 * `place_likes`/`place_comments` la toman solas vía `default auth.uid()`
 * (ver migración `0017_visitor_identity.sql`).
 *
 * Es el mismo `user_id` para siempre en este navegador, y más adelante
 * puede subirse a una cuenta real de Google/Facebook
 * (`supabase.auth.linkIdentity()`) sin perder el historial de "me
 * gusta"/comentarios — la base de "un identificador de sesión para
 * siempre" que pidió el usuario, con la puerta abierta a un login real
 * completo después (ver docs/PLAN.md sección 8.1).
 *
 * Requiere habilitar "Allow anonymous sign-ins" en el dashboard de
 * Supabase (Authentication → Settings) — sin eso, `signInAnonymously()`
 * devuelve un error, que se propaga para que el llamador lo maneje (ver
 * `LikeButton`/`PlaceCommentForm`).
 */
export async function ensureVisitorSession(): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session) return;

  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}
