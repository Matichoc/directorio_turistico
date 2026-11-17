-- PostGIS, paso 2 de 2 (2026-11-17): saca PostGIS del proyecto compartido
-- city_tour. Correr DESPUÉS de revisar el paso 1 (postgis-1-dependencias.sql):
-- si ahí aparece algo más que las columnas `geog` de `places`/`localities` y
-- sus índices, no correr esto.
--
-- Por qué: Supabase marca `public.spatial_ref_sys` (la tabla de PostGIS) con
-- `rls_disabled_in_public`: la API pública la entrega y los roles `anon` y
-- `authenticated` pueden escribirla. Su dueño es `supabase_admin`: desde
-- `postgres` no se le puede activar la RLS ni quitarle permisos. PostGIS lo
-- instaló la migración 0001 del diablo cuando vivía en `public`; Papudo no lo
-- usa, y el diablo solo lo usa para las columnas calculadas `geog` de
-- `places` y `localities`, que el sitio nunca lee (el mapa, las distancias y
-- el orden de las paradas se calculan con `latitude`/`longitude`).
--
-- Qué hace:
--   1. En `legacy` y `legacy_dev`: quita la columna `geog` de `places` y de
--      `localities` (con ella se van sus índices GiST).
--   2. Quita la extensión PostGIS, SIN `cascade`: si algo más depende de
--      ella, falla y no cambia nada (ni las columnas). Con ella se va
--      `public.spatial_ref_sys` y la alerta.
-- No toca ninguna tabla de Papudo ni `latitude`/`longitude`.
--
-- Respaldo: no se pierde ningún dato. `geog` es una columna calculada a partir
-- de `latitude` y `longitude`, que quedan intactas; `spatial_ref_sys` es la
-- lista estándar de sistemas de coordenadas que trae PostGIS. Para volver
-- atrás: postgis-reversa.sql (lo reinstala en el esquema `extensions` y
-- recalcula las columnas desde las coordenadas).
--
-- Si el paso 2 avisa "Sin permiso para quitar la extensión": las columnas ya
-- se quitaron; desactivar PostGIS en Database → Extensions → postgis.
--
-- Pegar tal cual en el SQL Editor de city_tour. Repetible. Una transacción.

begin;

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
      if exists (
        select 1 from information_schema.columns
        where table_schema = s and table_name = t and column_name = 'geog'
      ) then
        execute format('alter table %I.%I drop column geog', s, t);
        raise notice '%.%: columna geog quitada.', s, t;
      end if;
    end loop;
  end loop;
end $$;

do $$
begin
  drop extension if exists postgis;
  raise notice 'PostGIS quitado (y con él public.spatial_ref_sys).';
exception when insufficient_privilege then
  raise notice 'Sin permiso para quitar la extensión: las columnas ya se quitaron; desactiva PostGIS en Database → Extensions → postgis.';
end $$;

notify pgrst, 'reload schema';

commit;
