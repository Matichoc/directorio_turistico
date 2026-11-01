-- Ambiente de desarrollo del diablo: crea (o recrea desde cero) el esquema
-- `legacy_dev` como copia completa de `legacy`, en el mismo proyecto
-- compartido (city_tour). Ver docs/DESARROLLO.md.
--
-- Para qué: que la rama `develop` y las vistas previas de Vercel lean y
-- escriban una copia de los datos, así lo que se pruebe en el admin no toca
-- el sitio publicado. Decisión del usuario (2026-11-01); el plan gratis de
-- Supabase no admite otro proyecto, pero sí otro esquema.
--
-- Qué hace (en una sola transacción):
--   0. Verifica que exista `legacy`. Borra `legacy_dev` si ya existía (se
--      pierde lo que se haya probado ahí: es una copia descartable).
--   1. Copia los tipos enumerados (estados, idiomas…).
--   2. Copia cada tabla (columnas, valores por defecto, columnas calculadas,
--      restricciones e índices) y sus datos — salvo `_archivo` y los datos
--      de `analytics_events` (métricas de visitantes reales).
--   3. Pasa las columnas a los tipos de `legacy_dev`.
--   4. Rehace las relaciones entre tablas (llaves foráneas) dentro de
--      `legacy_dev` (las que apuntan a `auth.users` siguen apuntando ahí).
--   5. Copia las funciones y los disparadores, apuntando a `legacy_dev`.
--   6. Activa RLS y copia todas las políticas, apuntando a `legacy_dev`.
--   7. Copia los permisos de la API (anon, authenticated, service_role).
--
-- Qué NO hace: no cambia nada de `legacy` (solo lo lee) ni de `public`
-- (Papudo). Las cuentas de usuario (`auth.users`) son las mismas: Supabase
-- tiene un solo sistema de cuentas por proyecto, así que los administradores
-- de `legacy_dev` son los mismos de `legacy` (se copia `admin_users`).
--
-- Después de correrlo: Supabase → Integrations → Data API → Settings →
-- Exposed schemas → agregar `legacy_dev` (una sola vez).
--
-- NO ponerlo en `supabase/migrations/`. Se ejecuta a mano en el SQL Editor.
-- Se puede volver a correr para refrescar la copia con los datos de hoy.

begin;

-- 0) Verificación y limpieza -------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'legacy') then
    raise exception 'No existe el esquema legacy. No se cambió nada.';
  end if;
end $$;

drop schema if exists legacy_dev cascade;
create schema legacy_dev;

do $$
declare
  src constant text := 'legacy';
  dst constant text := 'legacy_dev';
  r record;
  col record;
  cols text;
  def text;
  roles text;
begin
  -- Con search_path vacío, Postgres escribe los nombres con su esquema
  -- ("legacy.places"), así el reemplazo legacy. → legacy_dev. es exacto.
  perform set_config('search_path', 'pg_catalog', true);

  -- 1) Tipos enumerados ------------------------------------------------------
  for r in
    select t.typname,
           string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder) as labels
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = src
    group by t.typname
  loop
    execute format('create type %I.%I as enum (%s)', dst, r.typname, r.labels);
  end loop;

  -- 2) Tablas y datos ----------------------------------------------------------
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = src and c.relkind in ('r', 'p') and c.relname <> '_archivo'
    order by c.relname
  loop
    execute format('create table %I.%I (like %I.%I including all)',
                   dst, r.relname, src, r.relname);

    if r.relname <> 'analytics_events' then
      -- Las columnas calculadas (p. ej. `geog`) no se insertan: se recalculan.
      select string_agg(quote_ident(a.attname), ', ' order by a.attnum)
        into cols
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = src and c.relname = r.relname
        and a.attnum > 0 and not a.attisdropped and a.attgenerated = '';
      -- `overriding system value`: columnas de identidad (p. ej. el id de
      -- `audit_log`) se copian con su valor original.
      execute format(
        'insert into %I.%I (%s) overriding system value select %s from %I.%I',
        dst, r.relname, cols, cols, src, r.relname);
    end if;

    -- Que los ids nuevos sigan después de los copiados (si no, el primer
    -- insert en la copia chocaría con un id existente).
    for col in
      select a.attname
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = dst and c.relname = r.relname
        and a.attnum > 0 and not a.attisdropped and a.attidentity <> ''
    loop
      execute format(
        'select setval(pg_get_serial_sequence(%L, %L), coalesce(max(%I), 0) + 1, false) from %I.%I',
        format('%I.%I', dst, r.relname), col.attname, col.attname, dst, r.relname);
    end loop;
  end loop;

  -- 3) Columnas con tipos de `legacy` → tipos de `legacy_dev` ------------------
  for r in
    select c.relname, a.attname, t.typname,
           pg_get_expr(d.adbin, d.adrelid) as default_expr
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_type t on t.oid = a.atttypid
    join pg_namespace tn on tn.oid = t.typnamespace
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where n.nspname = dst and tn.nspname = src
      and c.relkind in ('r', 'p')  -- solo tablas (los índices se rehacen solos)
      and a.attnum > 0 and not a.attisdropped
  loop
    if r.default_expr is not null then
      execute format('alter table %I.%I alter column %I drop default',
                     dst, r.relname, r.attname);
    end if;
    execute format(
      'alter table %I.%I alter column %I type %I.%I using %I::text::%I.%I',
      dst, r.relname, r.attname, dst, r.typname, r.attname, dst, r.typname);
    if r.default_expr is not null then
      execute format('alter table %I.%I alter column %I set default %s',
                     dst, r.relname, r.attname,
                     replace(r.default_expr, src || '.', dst || '.'));
    end if;
  end loop;

  -- 4) Llaves foráneas ---------------------------------------------------------
  for r in
    select c.relname, con.conname, pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = src and con.contype = 'f' and c.relname <> '_archivo'
  loop
    execute format('alter table %I.%I add constraint %I %s',
                   dst, r.relname, r.conname,
                   replace(r.def, src || '.', dst || '.'));
  end loop;

  -- 5) Funciones y disparadores -----------------------------------------------
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = src and p.prokind = 'f'
  loop
    def := pg_get_functiondef(r.oid);
    def := replace(def, src || '.', dst || '.');
    def := replace(def, quote_literal(src), quote_literal(dst));
    execute def;
  end loop;

  for r in
    select pg_get_triggerdef(tg.oid) as def
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = src and not tg.tgisinternal and c.relname <> '_archivo'
  loop
    execute replace(r.def, src || '.', dst || '.');
  end loop;

  -- 6) RLS y políticas ---------------------------------------------------------
  for r in
    select c.relname, c.relrowsecurity, c.relforcerowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = src and c.relkind in ('r', 'p') and c.relname <> '_archivo'
  loop
    if r.relrowsecurity then
      execute format('alter table %I.%I enable row level security', dst, r.relname);
    end if;
    if r.relforcerowsecurity then
      execute format('alter table %I.%I force row level security', dst, r.relname);
    end if;
  end loop;

  for r in
    select pol.polname, c.relname, pol.polpermissive, pol.polcmd, pol.polroles,
           pg_get_expr(pol.polqual, pol.polrelid) as qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = src and c.relname <> '_archivo'
  loop
    if r.polroles = array[0::oid] then
      roles := 'public';
    else
      select string_agg(quote_ident(rolname), ', ') into roles
      from pg_roles where oid = any (r.polroles);
    end if;
    execute format(
      'create policy %I on %I.%I as %s for %s to %s%s%s',
      r.polname, dst, r.relname,
      case when r.polpermissive then 'permissive' else 'restrictive' end,
      case r.polcmd when 'r' then 'select' when 'a' then 'insert'
                    when 'w' then 'update' when 'd' then 'delete' else 'all' end,
      roles,
      case when r.qual is null then ''
           else ' using (' || replace(r.qual, src || '.', dst || '.') || ')' end,
      case when r.with_check is null then ''
           else ' with check (' || replace(r.with_check, src || '.', dst || '.') || ')' end);
  end loop;

  -- 7) Permisos de la API -----------------------------------------------------
  execute format('grant usage on schema %I to anon, authenticated, service_role', dst);

  for r in
    select c.relname, acl.grantee, acl.privilege_type
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(c.relacl) acl
    where n.nspname = src and c.relkind in ('r', 'p') and c.relname <> '_archivo'
      and acl.grantee in (
        select oid from pg_roles where rolname in ('anon', 'authenticated', 'service_role'))
  loop
    execute format('grant %s on %I.%I to %I',
                   r.privilege_type, dst, r.relname,
                   (select rolname from pg_roles where oid = r.grantee));
  end loop;

  for r in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args, acl.grantee
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(p.proacl) acl
    where n.nspname = src and acl.privilege_type = 'EXECUTE'
      and acl.grantee in (
        select oid from pg_roles where rolname in ('anon', 'authenticated', 'service_role'))
  loop
    execute format('grant execute on function %I.%I(%s) to %I',
                   dst, r.proname, replace(r.args, src || '.', dst || '.'),
                   (select rolname from pg_roles where oid = r.grantee));
  end loop;
end $$;

-- Que la API de Supabase vea el esquema nuevo sin esperar.
notify pgrst, 'reload schema';

commit;
