-- PostGIS, reversa de postgis-2-quitar.sql (2026-11-17). Solo si hiciera falta
-- volver a tener las columnas `geog` (por ejemplo, para búsquedas "cerca de
-- mí" hechas en la base).
--
-- Qué hace: reinstala PostGIS en el esquema `extensions` (no en `public`, así
-- no vuelve la alerta `rls_disabled_in_public`) y recrea en `legacy` y
-- `legacy_dev` las columnas calculadas `geog` de `places` y `localities`, con
-- sus índices GiST, igual que las migraciones 0002 y 0003. Los valores se
-- recalculan solos desde `latitude`/`longitude`.
--
-- Si `create extension` avisa que falta permiso: activar PostGIS en
-- Database → Extensions → postgis eligiendo el esquema `extensions`, y volver
-- a correr este script (lo demás es repetible).
--
-- Pegar tal cual en el SQL Editor de city_tour. Repetible. Una transacción.

begin;

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

do $$
declare
  s text;
  t text;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    foreach t in array array['places', 'localities'] loop
      if to_regclass(format('%I.%I', s, t)) is not null and not exists (
        select 1 from information_schema.columns
        where table_schema = s and table_name = t and column_name = 'geog'
      ) then
        execute format(
          'alter table %I.%I add column geog extensions.geography(Point, 4326)
             generated always as (
               extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
             ) stored', s, t);
        execute format(
          'create index if not exists %I on %I.%I using gist (geog)',
          t || '_geog_idx', s, t);
        raise notice '%.%: columna geog recreada.', s, t;
      end if;
    end loop;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
