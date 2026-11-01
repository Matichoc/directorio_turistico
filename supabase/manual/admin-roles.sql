-- Admin para varias personas (decisión del usuario: "varias personas, con
-- roles", para poder entregarle el panel a otros). Un solo script para pegar
-- en el SQL Editor de city_tour, tal cual: se aplica en `legacy` y en
-- `legacy_dev` (si existe). No toca `public` (Papudo) ni `auth`.
--
-- Qué hace, en cada esquema:
--   1. `admin_users.role`: 'admin' (todo, incluso personas) o 'editor'
--      (contenido). Los que ya están quedan como 'admin'. Más quién lo
--      agregó y cuándo.
--   2. `is_admin_role()`: ¿quien llama es 'admin'? `is_admin()` sigue igual
--      (cualquiera del equipo: es lo que usan las políticas de contenido).
--      `admin_users` sigue sin políticas de escritura: solo el servidor
--      (service role, desde /admin/personas, que revisa el rol) la cambia.
--   3. Registro de cambios (`audit_log`): quién cambió qué y cuándo, con un
--      disparador en las tablas de contenido. Solo el equipo lo lee; nadie
--      lo puede editar ni borrar desde la API.
--
-- Repetible. Una sola transacción: si algo falla, no cambia nada.

begin;

do $$
declare
  s text;
  t text;
  audited constant text[] := array[
    'places', 'place_translations', 'place_images', 'place_tags',
    'place_secondary_categories', 'routes', 'route_translations',
    'route_stops', 'localities', 'locality_translations', 'communes',
    'commune_translations', 'categories', 'category_translations',
    'sponsors', 'sponsor_translations', 'contact_links', 'sources',
    'admin_users'
  ];
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    -- 1) Roles
    execute format(
      'alter table %1$I.admin_users
         add column if not exists role text not null default ''admin'',
         add column if not exists added_by uuid,
         add column if not exists created_at timestamptz not null default now()', s);
    execute format(
      'alter table %1$I.admin_users
         drop constraint if exists admin_users_role_check', s);
    execute format(
      'alter table %1$I.admin_users
         add constraint admin_users_role_check check (role in (''admin'', ''editor''))', s);

    -- 2) ¿Quien llama es administrador (no editor)?
    execute format($f$
      create or replace function %1$I.is_admin_role()
      returns boolean
      language sql
      stable
      security definer
      set search_path = %1$I, pg_temp
      as $body$
        select exists (
          select 1 from %1$I.admin_users
          where user_id = auth.uid() and role = 'admin'
        );
      $body$ $f$, s);
    execute format(
      'grant execute on function %1$I.is_admin_role() to anon, authenticated, service_role', s);

    -- 3) Registro de cambios
    execute format(
      'create table if not exists %1$I.audit_log (
         id bigint generated always as identity primary key,
         at timestamptz not null default now(),
         user_id uuid,
         table_name text not null,
         action text not null,
         row_ref text
       )', s);
    execute format(
      'create index if not exists audit_log_at_idx on %1$I.audit_log (at desc)', s);
    execute format('alter table %1$I.audit_log enable row level security', s);
    execute format(
      'drop policy if exists audit_log_team_read on %1$I.audit_log', s);
    execute format(
      'create policy audit_log_team_read on %1$I.audit_log
         for select using (%1$I.is_admin())', s);
    -- Solo lectura desde la API: lo escribe el disparador, nunca un usuario.
    execute format(
      'revoke insert, update, delete on table %1$I.audit_log from anon, authenticated', s);
    execute format('grant select on table %1$I.audit_log to authenticated, service_role', s);

    execute format($f$
      create or replace function %1$I.log_change()
      returns trigger
      language plpgsql
      security definer
      set search_path = %1$I, pg_temp
      as $body$
      declare
        r jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
      begin
        insert into %1$I.audit_log (user_id, table_name, action, row_ref)
        values (
          auth.uid(),
          tg_table_name,
          lower(tg_op),
          coalesce(r->>'slug', r->>'name', r->>'storage_path', r->>'id',
                   r->>'place_id', r->>'route_id', r->>'locality_id',
                   r->>'user_id')
        );
        return null;
      end;
      $body$ $f$, s);

    foreach t in array audited loop
      if to_regclass(format('%I.%I', s, t)) is not null then
        execute format('drop trigger if exists audit_changes on %I.%I', s, t);
        execute format(
          'create trigger audit_changes after insert or update or delete
             on %I.%I for each row execute function %I.log_change()',
          s, t, s);
      end if;
    end loop;

    -- Comentarios: solo la moderación (no cada comentario de un visitante).
    if to_regclass(format('%I.place_comments', s)) is not null then
      execute format('drop trigger if exists audit_changes on %I.place_comments', s);
      execute format(
        'create trigger audit_changes after update or delete
           on %I.place_comments for each row execute function %I.log_change()',
        s, s);
    end if;

    raise notice 'Roles y registro listos en %.', s;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
