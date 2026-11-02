-- Portada provisoria de "Donde el Diablo perdió el poncho" con el diablo
-- campesino (2026-11-02). La portada actual
-- (`/rutas/ruta-del-diablo-pedegua-chincolco.webp`) es el diablito anterior
-- (auditoría H-10) y se veía en Rutas, en el inicio y en la ficha. Mientras
-- llega una portada propia con el personaje nuevo, usa la escena de la
-- Escalera del Diablo (`/leyendas/escalera.webp`), que es una parada de esta
-- ruta y ya está publicada en `develop` y en `main`.
--
-- Qué hace, en `legacy` y `legacy_dev` (nunca en `public`, que es de Papudo):
-- cambia `cover_image` de esa única ruta, y solo si todavía tiene la portada
-- vieja (no pisa una portada puesta después). Repetible.
--
-- Pegar tal cual en el SQL Editor de city_tour. El sitio cachea las páginas
-- hasta 5 minutos: la portada nueva aparece a más tardar en ese tiempo.
--
-- Cuando llegue la portada definitiva: guardarla como
-- `public/rutas/ruta-del-diablo-pedegua-chincolco-campesino.webp` (nombre
-- nuevo) y apuntar `cover_image` ahí con un script como este.

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
       where slug = %L and cover_image = %L',
      s,
      '/leyendas/escalera.webp',
      'ruta-del-diablo-pedegua-chincolco',
      '/rutas/ruta-del-diablo-pedegua-chincolco.webp'
    );
    get diagnostics changed = row_count;
    raise notice 'En %: % ruta(s) con la portada nueva.', s, changed;
  end loop;
end $$;
