-- PostGIS, paso 1 de 2 (2026-11-17): SOLO LECTURA. Lista todo lo que depende
-- de PostGIS antes de sacarlo de `public` (alerta de Supabase
-- `rls_disabled_in_public` por `public.spatial_ref_sys`, la tabla de sistemas
-- de coordenadas que instala PostGIS: su dueño es `supabase_admin`, así que
-- no se le puede activar la RLS ni quitarle permisos desde `postgres`).
--
-- No cambia nada. Pegar en el SQL Editor de city_tour y mandar los cuatro
-- resultados. Lo esperado: solo las columnas `geog` de `places` y
-- `localities` (en `legacy` y `legacy_dev`), sus índices GiST y nada en las
-- tablas de Papudo. Si aparece algo más, NO correr el paso 2 todavía.

-- 1) La extensión: dónde está, quién es su dueño y qué versión es.
select e.extname as extension,
       e.extnamespace::regnamespace as esquema,
       e.extowner::regrole as dueno,
       e.extversion as version
from pg_extension e
where e.extname like 'postgis%' or e.extname in ('address_standardizer', 'pgrouting')
order by 1;

-- 2) Columnas de cualquier tabla con un tipo de PostGIS (geometry, geography…).
select n.nspname as esquema, c.relname as tabla, a.attname as columna,
       format_type(a.atttypid, a.atttypmod) as tipo,
       case a.attgenerated when 's' then 'calculada' else 'normal' end as clase
from pg_attribute a
join pg_class c on c.oid = a.attrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_type t on t.oid = a.atttypid
join pg_depend d on d.classid = 'pg_type'::regclass and d.objid = t.oid and d.deptype = 'e'
join pg_extension e on e.oid = d.refobjid and e.extname = 'postgis'
where a.attnum > 0 and not a.attisdropped and c.relkind in ('r', 'p', 'v', 'm')
order by 1, 2, 3;

-- 3) Índices que usan esas columnas (GiST u otros).
select schemaname as esquema, tablename as tabla, indexname as indice, indexdef as definicion
from pg_indexes
where indexdef ~* '\m(geog|geom|geography|geometry)\M|using gist'
order by 1, 2, 3;

-- 4) Todo lo demás que fuera de la extensión depende de algo de PostGIS
--    (vistas, funciones, columnas calculadas, disparadores…).
with miembros as (
  select d.classid, d.objid
  from pg_depend d
  join pg_extension e on e.oid = d.refobjid and e.extname = 'postgis'
  where d.deptype = 'e'
)
select distinct pg_describe_object(d.classid, d.objid, d.objsubid) as objeto
from pg_depend d
join miembros m on m.classid = d.refclassid and m.objid = d.refobjid
where d.deptype in ('n', 'a')
  and not exists (select 1 from miembros x where x.classid = d.classid and x.objid = d.objid)
order by 1;
