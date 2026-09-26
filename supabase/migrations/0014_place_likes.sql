-- "Me gusta" por lugar: solo positivo, nunca reseña ni calificación
-- negativa (pedido explícito del usuario). Anónimo por ahora, atado a un
-- identificador de sesión de cliente (mismo espíritu que
-- `itineraries.session_id`, 0006_itineraries.sql) en vez de requerir login
-- real — login opcional con Google/Facebook queda para una fase
-- posterior (ver docs/PLAN.md, sección 8.1) y puede convivir con esto
-- después.
--
-- Mismo nivel de confianza que ya acepta `analytics_events` (RLS con
-- `using`/`with check (true)`, ver 0008_rls.sql): cualquiera con la anon
-- key podría en teoría dar/quitar un "me gusta" con un session_id ajeno —
-- aceptable para un contador de bajo riesgo, no para datos sensibles. El
-- conteo público se expone solo agregado, vía `place_like_counts()`
-- (security definer), no la tabla cruda con los session_id.

create table public.place_likes (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  session_id text not null,
  created_at timestamptz not null default now(),
  unique (place_id, session_id)
);

create index place_likes_place_id_idx on public.place_likes (place_id);

alter table public.place_likes enable row level security;

create policy place_likes_insert on public.place_likes
  for insert with check (true);
create policy place_likes_delete on public.place_likes
  for delete using (true);

create or replace function public.place_like_counts()
returns table (place_id uuid, likes_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select place_id, count(*)::bigint as likes_count
  from public.place_likes
  group by place_id;
$$;
