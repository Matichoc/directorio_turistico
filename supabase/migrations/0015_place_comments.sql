-- Comentarios de visitantes por lugar, con moderación previa del admin
-- antes de publicarse — pedido explícito del usuario ("dejar un
-- comentario del lugar para que se vayan ganando reputación"), pero
-- decidió moderación previa en vez de publicación inmediata: un
-- comentario de texto libre puede ser negativo o inapropiado, y eso
-- choca con el principio ya seguido en todo el sitio de nunca mostrar
-- contenido negativo (docs/DESIGN.md).
--
-- Anónimo, atado al mismo `session_id` de cliente que ya usa
-- `place_likes` (ver `lib/session/visitor-session.ts`) — un solo
-- concepto de "quién es este visitante" en vez de uno por feature.

create type public.comment_status as enum ('pending', 'approved', 'rejected');

create table public.place_comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  session_id text not null,
  body text not null check (char_length(body) between 1 and 500),
  status public.comment_status not null default 'pending',
  created_at timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid references auth.users (id) on delete set null
);

create index place_comments_place_id_idx on public.place_comments (place_id);
create index place_comments_status_idx on public.place_comments (status);

alter table public.place_comments enable row level security;

-- Lectura pública de solo lo aprobado; el admin ve todo (incluida la cola
-- de pendientes, para moderar).
create policy place_comments_public_read on public.place_comments
  for select using (status = 'approved' or public.is_admin());

-- Cualquiera puede insertar, pero siempre en 'pending' — el `with check`
-- rechaza un intento de auto-aprobarse el comentario vía API.
create policy place_comments_public_insert on public.place_comments
  for insert with check (status = 'pending');

create policy place_comments_admin_write on public.place_comments
  for all using (public.is_admin()) with check (public.is_admin());
