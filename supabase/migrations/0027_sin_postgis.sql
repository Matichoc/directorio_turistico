-- Sin PostGIS (2026-11-17). Historial del esquema para réplicas y proyectos
-- propios: en el proyecto compartido city_tour se aplica con
-- supabase/manual/postgis-2-quitar.sql (esquemas `legacy` y `legacy_dev`),
-- nunca con `supabase db push`.
--
-- Las columnas calculadas `geog` (0002 y 0003) nunca se leyeron desde el
-- sitio: el mapa, las distancias y el orden de las paradas usan
-- `latitude`/`longitude`. PostGIS instalado en `public` dejaba expuesta por la
-- API su tabla `spatial_ref_sys` (alerta `rls_disabled_in_public`) sin poder
-- activarle la RLS, porque su dueño es `supabase_admin`.

alter table public.places drop column if exists geog;
alter table public.localities drop column if exists geog;
drop extension if exists postgis;
