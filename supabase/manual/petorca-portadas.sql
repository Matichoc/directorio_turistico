-- Portadas nuevas de las 2 rutas de Petorca (arte del diablo aprobado, ver
-- docs/PROMPTS-IMAGENES.md). Solo cambia `cover_image` de esas 2 rutas en
-- `legacy`; no toca `public` (Papudo) ni nada más.
--
-- Cuándo correrlo (si no, la ficha apunta a una imagen que no existe):
--   - En `legacy_dev` (cambiar `legacy.` por `legacy_dev.`): apenas
--     `develop` tenga los archivos (public/rutas/ruta-del-diablo-pedegua-
--     chincolco.webp y ruta-ferroviaria-pedegua-las-palmas.webp).
--   - En `legacy`: recién cuando `main` (producción) los tenga.
--
-- scripts/seed.ts ya tiene estas portadas. supabase/manual/petorca-rutas.sql
-- sigue con la portada vieja a propósito (se puede volver a correr hoy en
-- `legacy` para el nombre de la ruta sin romper producción): después de
-- correr este, si se vuelve a correr ese, correr este de nuevo.

begin;

update legacy.routes
set cover_image = '/rutas/' || slug || '.webp', updated_at = now()
where slug in (
  'ruta-del-diablo-pedegua-chincolco',
  'ruta-ferroviaria-pedegua-las-palmas'
);

-- Deben ser exactamente 2: si no, algo no calza y no se cambia nada.
do $$
begin
  if (select count(*) from legacy.routes
      where slug in ('ruta-del-diablo-pedegua-chincolco',
                     'ruta-ferroviaria-pedegua-las-palmas')
        and cover_image = '/rutas/' || slug || '.webp') <> 2 then
    raise exception 'No se encontraron las 2 rutas de Petorca. No se cambió nada.';
  end if;
end $$;

commit;
