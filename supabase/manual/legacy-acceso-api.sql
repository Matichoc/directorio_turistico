-- Acceso de la API de Supabase al esquema `legacy` (el directorio del diablo).
--
-- Contexto: el proyecto compartido (city_tour) tiene en `public` el sitio de
-- Papudo y, en `legacy`, todo lo del diablo. Este script deja a `legacy`
-- funcionando como API sin tocar NADA de `public`.
--
-- Qué hace (todo dentro de `legacy`, en una sola transacción):
--   0. Verifica que las 27 tablas del diablo existan y tengan RLS activa.
--      Si algo no calza, aborta sin cambiar nada.
--   1. Reescribe las 4 funciones propias del diablo para que lean SOLO
--      `legacy` (al mover el esquema, sus cuerpos siguieron diciendo
--      `public.`, o sea, habrían leído las tablas de Papudo).
--   2. Vuelve a apuntar los 2 disparadores de estado a la función de legacy.
--   3. Da permisos de uso a los roles de la API, solo sobre esas 27 tablas y
--      4 funciones (no sobre `_archivo` ni nada más).
--
-- Qué NO hace: no lee, escribe ni cambia permisos de nada en `public`; no
-- crea ni borra tablas; no mueve datos.
--
-- NO ponerlo en `supabase/migrations/`: `supabase db push` lo correría
-- contra `public`. Se ejecuta a mano en el SQL Editor del proyecto.
-- Es idempotente: correrlo dos veces deja lo mismo.

begin;

-- 0) Verificaciones previas ------------------------------------------------
do $$
declare
  t text;
  tablas text[] := array[
    'admin_users', 'analytics_events', 'categories', 'category_translations',
    'commune_translations', 'communes', 'contact_links', 'itineraries',
    'itinerary_stops', 'localities', 'locality_translations',
    'place_comments', 'place_hours', 'place_images', 'place_likes',
    'place_tags', 'place_translations', 'places', 'route_stop_translations',
    'route_stops', 'route_translations', 'routes', 'sources',
    'sponsor_translations', 'sponsors', 'tags', 'verification_logs'
  ];
begin
  foreach t in array tablas loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'legacy' and c.relname = t and c.relkind = 'r'
    ) then
      raise exception 'Falta la tabla legacy.% — no se cambió nada.', t;
    end if;
    if not (
      select c.relrowsecurity from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'legacy' and c.relname = t
    ) then
      raise exception 'legacy.% no tiene RLS activa: no se dan permisos. No se cambió nada.', t;
    end if;
  end loop;
end $$;

-- 1) Funciones del diablo: que lean solo `legacy` ---------------------------
-- `create or replace` conserva la identidad de cada función: las reglas de
-- acceso (RLS) que ya la usan siguen apuntando a ella.

create or replace function legacy.is_admin()
returns boolean
language sql
stable
security definer
set search_path = legacy
as $$
  select exists (
    select 1 from legacy.admin_users where user_id = auth.uid()
  );
$$;

create or replace function legacy.place_like_counts()
returns table (place_id uuid, likes_count bigint)
language sql
stable
security definer
set search_path = legacy
as $$
  select place_id, count(*)::bigint as likes_count
  from legacy.place_likes
  group by place_id;
$$;

create or replace function legacy.analytics_top(
  p_name text,
  p_key text,
  p_days int default 30,
  p_limit int default 10
)
returns table (value text, total bigint)
language sql
stable
as $$
  select properties ->> p_key as value, count(*) as total
  from legacy.analytics_events
  where name = p_name
    and created_at >= now() - make_interval(days => p_days)
    and properties ->> p_key is not null
  group by 1
  order by 2 desc, 1
  limit p_limit;
$$;

create or replace function legacy.analytics_totals(p_days int default 30)
returns table (name text, total bigint)
language sql
stable
as $$
  select name, count(*) as total
  from legacy.analytics_events
  where created_at >= now() - make_interval(days => p_days)
  group by 1
  order by 2 desc;
$$;

-- 2) Disparadores de estado: que usen la función de legacy -------------------
-- (solo avisan cuándo cambió la publicación; la función no toca tablas).
create or replace function legacy.touch_status_changed_at()
returns trigger
language plpgsql
as $$
begin
  if new.publication_status is distinct from old.publication_status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists places_touch_status_changed_at on legacy.places;
create trigger places_touch_status_changed_at
  before update on legacy.places
  for each row execute function legacy.touch_status_changed_at();

drop trigger if exists routes_touch_status_changed_at on legacy.routes;
create trigger routes_touch_status_changed_at
  before update on legacy.routes
  for each row execute function legacy.touch_status_changed_at();

-- 3) Permisos para la API --------------------------------------------------
grant usage on schema legacy to anon, authenticated, service_role;

-- Igual que en cualquier tabla de Supabase: el acceso real lo gobierna la
-- RLS (verificada activa arriba). Solo las 27 tablas del diablo, una por una.
grant all on table
  legacy.admin_users, legacy.analytics_events, legacy.categories,
  legacy.category_translations, legacy.commune_translations,
  legacy.communes, legacy.contact_links, legacy.itineraries,
  legacy.itinerary_stops, legacy.localities, legacy.locality_translations,
  legacy.place_comments, legacy.place_hours, legacy.place_images,
  legacy.place_likes, legacy.place_tags, legacy.place_translations,
  legacy.places, legacy.route_stop_translations, legacy.route_stops,
  legacy.route_translations, legacy.routes, legacy.sources,
  legacy.sponsor_translations, legacy.sponsors, legacy.tags,
  legacy.verification_logs
  to anon, authenticated, service_role;

grant execute on function
  legacy.is_admin(), legacy.place_like_counts(),
  legacy.analytics_top(text, text, int, int), legacy.analytics_totals(int)
  to anon, authenticated, service_role;

-- Que la API vea los cambios de inmediato.
notify pgrst, 'reload schema';

commit;
