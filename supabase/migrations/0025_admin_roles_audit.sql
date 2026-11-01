-- Equipo del panel con roles y registro de cambios. Historial del esquema
-- para réplicas y proyectos propios: en el proyecto compartido city_tour se
-- aplica con supabase/manual/admin-roles.sql (esquemas `legacy` y
-- `legacy_dev`), nunca con `supabase db push`.

alter table public.admin_users
  add column role text not null default 'admin'
    check (role in ('admin', 'editor')),
  add column added_by uuid;

-- ¿Quien llama es administrador (no editor)? `is_admin()` sigue siendo
-- "cualquiera del equipo" (contenido).
create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,
  table_name text not null,
  action text not null,
  row_ref text
);
create index audit_log_at_idx on public.audit_log (at desc);
alter table public.audit_log enable row level security;
create policy audit_log_team_read on public.audit_log
  for select using (public.is_admin());

create or replace function public.log_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (user_id, table_name, action, row_ref)
  values (
    auth.uid(), tg_table_name, lower(tg_op),
    coalesce(r->>'slug', r->>'name', r->>'storage_path', r->>'id',
             r->>'place_id', r->>'route_id', r->>'locality_id', r->>'user_id')
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'places', 'place_translations', 'place_images', 'place_tags',
    'place_secondary_categories', 'routes', 'route_translations',
    'route_stops', 'localities', 'locality_translations', 'communes',
    'commune_translations', 'categories', 'category_translations',
    'sponsors', 'sponsor_translations', 'contact_links', 'sources',
    'admin_users'
  ] loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format(
        'create trigger audit_changes after insert or update or delete
           on public.%I for each row execute function public.log_change()', t);
    end if;
  end loop;
end $$;

create trigger audit_changes after update or delete on public.place_comments
  for each row execute function public.log_change();
