-- "Me gusta" y comentarios pasan de un `session_id` de texto (que
-- cualquiera con la anon key podía inventar o adivinar — hueco de
-- seguridad ya documentado en docs/DATA-MODEL.md) a una cuenta real de
-- Supabase Auth: anónima por defecto
-- (`supabase.auth.signInAnonymously()`, ver
-- `src/lib/session/visitor-session.ts`), que más adelante puede
-- vincularse a Google/Facebook sin perder el historial (mismo user_id).
-- Requiere habilitar "Allow anonymous sign-ins" en Authentication →
-- Settings del dashboard de Supabase — un solo toggle, sin credenciales
-- de terceros de por medio.
--
-- `default auth.uid()` en vez de que el cliente tenga que mandarlo: así
-- ni `LikeButton` ni `submitComment` necesitan pasar la identidad a
-- mano, y RLS (`with check (user_id = auth.uid())`) igual la valida.
--
-- Sin datos reales que migrar todavía (ambas tablas recién se sumaron
-- esta semana, sin tráfico real) — se reemplaza la columna en vez de
-- convivir con las dos; cualquier "me gusta"/comentario de prueba hecho
-- bajo el esquema anterior se pierde.

delete from public.place_likes;
alter table public.place_likes
  drop constraint if exists place_likes_place_id_session_id_key;
alter table public.place_likes drop column session_id;
alter table public.place_likes
  add column user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade;
alter table public.place_likes
  add constraint place_likes_place_id_user_id_key unique (place_id, user_id);

drop policy place_likes_insert on public.place_likes;
drop policy place_likes_delete on public.place_likes;

create policy place_likes_insert on public.place_likes
  for insert with check (user_id = auth.uid());
create policy place_likes_delete on public.place_likes
  for delete using (user_id = auth.uid());

delete from public.place_comments;
alter table public.place_comments drop column session_id;
alter table public.place_comments
  add column user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade;

drop policy place_comments_public_insert on public.place_comments;

create policy place_comments_public_insert on public.place_comments
  for insert with check (status = 'pending' and user_id = auth.uid());
