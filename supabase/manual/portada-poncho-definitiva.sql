-- Portada definitiva de "Donde el Diablo perdió el poncho" (2026-11-03): el
-- diablo campesino sentado en una piedra al atardecer, junto al camino del
-- valle. Reemplaza a la provisoria (la escena de la Escalera del Diablo,
-- supabase/manual/portada-poncho-campesino.sql). Nombre de archivo nuevo para
-- que nadie vea la portada vieja guardada en caché.
--
-- Qué hace, en `legacy` y `legacy_dev` (nunca en `public`, que es de Papudo):
-- cambia `cover_image` de esa única ruta, y solo si tiene la provisoria o la
-- del diablito anterior (no pisa una portada puesta después). Repetible.
--
-- Pegar tal cual en el SQL Editor de city_tour, DESPUÉS de que el archivo
-- esté publicado (si no, la ruta queda un rato sin portada). El sitio cachea
-- las páginas hasta 5 minutos.

do $$
declare
  s text;
  changed int;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    execute format(
      'update %I.routes
         set cover_image = %L, updated_at = now()
       where slug = %L and cover_image in (%L, %L)',
      s,
      '/rutas/ruta-del-diablo-pedegua-chincolco-campesino.webp',
      'ruta-del-diablo-pedegua-chincolco',
      '/leyendas/escalera.webp',
      '/rutas/ruta-del-diablo-pedegua-chincolco.webp'
    );
    get diagnostics changed = row_count;
    raise notice 'En %: % ruta(s) con la portada definitiva.', s, changed;
  end loop;
end $$;
