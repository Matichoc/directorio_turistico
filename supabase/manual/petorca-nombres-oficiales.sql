-- Nombres oficiales de las 2 rutas de Petorca, y portadas nuevas en
-- desarrollo. Un solo script para pegar en el SQL Editor de city_tour, tal
-- cual (no hay que reemplazar nada):
--
--   1. En `legacy` (sitio publicado) y en `legacy_dev` (desarrollo, si
--      existe): nombre y descripción en español e inglés de
--        - "Donde el Diablo perdió el poncho"
--        - "Ruta Turística Ferroviaria Pedegua – Palquico – Las Palmas"
--      (nombres propios de cada ruta, sacados de sus logos: no se traducen).
--   2. Solo en `legacy_dev`: las portadas nuevas (public/rutas/*.webp, ya
--      publicadas en `develop`). En `legacy`, recién cuando `main` las tenga:
--      supabase/manual/petorca-portadas.sql.
--
-- No toca `public` (Papudo), ni otras rutas, ni paradas. Corre en una sola
-- transacción: si una de las rutas no está cargada, avisa y no cambia nada.
-- Es repetible. Mismos textos que scripts/seed.ts.

begin;

do $$
declare
  s text;
  r record;
  n integer;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    for r in
      select * from (values
        (
          'ruta-del-diablo-pedegua-chincolco', 'es',
          'Donde el Diablo perdió el poncho',
          'Tras la huella del diablo que, dice el dicho, murió en Petorca: parte en la antigua estación y el puente de Pedegua, y sigue valle arriba por la Escalera del Diablo en Hierro Viejo y la Iglesia La Merced de Petorca hasta los petroglifos de Chincolco.'
        ),
        (
          'ruta-del-diablo-pedegua-chincolco', 'en',
          'Donde el Diablo perdió el poncho',
          'Following the trail of the Devil who, as the saying goes, died in Petorca: it starts at Pedegua''s old railway station and bridge, then heads up the valley through the Devil''s Staircase in Hierro Viejo and La Merced Church in Petorca to the Chincolco petroglyphs.'
        ),
        (
          'ruta-ferroviaria-pedegua-las-palmas', 'es',
          'Ruta Turística Ferroviaria Pedegua – Palquico – Las Palmas',
          'Por el antiguo trazado del ferrocarril: desde la estación de Pedegua, que conserva su fachada y bodegas restauradas, por el puente sobre el río Petorca, hasta el Túnel Las Palmas: 966 m inaugurados en 1914 como parte de la red Longitudinal Norte, Monumento Histórico desde 2011.'
        ),
        (
          'ruta-ferroviaria-pedegua-las-palmas', 'en',
          'Ruta Turística Ferroviaria Pedegua – Palquico – Las Palmas',
          'Along the old railway line: from Pedegua station, which keeps its restored façade and warehouses, across the bridge over the Río Petorca, to the Túnel Las Palmas: 966 m opened in 1914 as part of the Northern Longitudinal network, a National Historic Monument since 2011.'
        )
      ) as t(slug, locale, name, description)
    loop
      execute format(
        'update %1$I.route_translations rt
            set name = $1, description = $2
           from %1$I.routes ro
          where ro.id = rt.route_id and ro.slug = $3 and rt.locale::text = $4',
        s)
        using r.name, r.description, r.slug, r.locale;
      get diagnostics n = row_count;
      if n <> 1 then
        raise exception 'En %, la ruta % (%) no está cargada. No se cambió nada.',
          s, r.slug, r.locale;
      end if;
    end loop;

    if s = 'legacy_dev' then
      execute format(
        'update %I.routes
            set cover_image = ''/rutas/'' || slug || ''.webp'', updated_at = now()
          where slug in (''ruta-del-diablo-pedegua-chincolco'',
                         ''ruta-ferroviaria-pedegua-las-palmas'')',
        s);
      get diagnostics n = row_count;
      if n <> 2 then
        raise exception 'En %, no están las 2 rutas de Petorca. No se cambió nada.', s;
      end if;
    end if;

    raise notice 'Listo en %.', s;
  end loop;
end $$;

commit;
