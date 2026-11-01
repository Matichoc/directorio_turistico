-- Las dos rutas del sitio de la comuna de Petorca (rama `petorca`, ver
-- src/lib/site-scope.ts), en el esquema `legacy` del proyecto compartido:
--   - "Donde el Diablo perdió el poncho"
--   - "Ruta Turística Ferroviaria Pedegua – Palquico – Las Palmas"
--
-- La primera se cargó al principio con el slug
-- `donde-el-diablo-perdio-el-poncho`; hoy su slug es
-- `ruta-del-diablo-pedegua-chincolco` y su nombre, por decisión del usuario,
-- "Donde el Diablo perdió el poncho". Si quedó cargada con el slug viejo, el
-- paso 1 la renombra (no crea otra). Volver a correr el script actualiza el
-- nombre y la descripción.
--
-- Mismo contenido que `routes` en scripts/seed.ts (la fuente de verdad);
-- este script existe para cargarlas sin correr `pnpm db:seed`, que haría
-- `upsert` de todo el catálogo y pisaría lo editado desde /admin.
--
-- Qué hace (todo dentro de `legacy`, en una sola transacción):
--   0. Verifica que las 6 paradas existan y sean de la comuna de Petorca.
--      Si algo no calza, aborta sin cambiar nada.
--   1. Si la primera ruta quedó cargada con su nombre viejo, la renombra.
--   2. Crea (o actualiza) las 2 rutas, publicadas y verificadas, con sus
--      textos en español e inglés.
--   3. Rehace sus paradas en orden.
--   4. Agrega su fuente (si no estaba).
--
-- Qué NO hace: no toca `public` (Papudo), ni otras rutas (la Ruta del
-- Diablo de la provincia sigue igual), ni lugares.
--
-- NO ponerlo en `supabase/migrations/`. Se ejecuta a mano en el SQL Editor
-- del proyecto (ver docs/SUPABASE-LEGACY.md). Es repetible: correrlo dos
-- veces deja lo mismo.

begin;

-- 0) Verificaciones previas ------------------------------------------------
do $$
declare
  s text;
  paradas text[] := array[
    'pedegua', 'pedegua-puente', 'escalera-del-diablo',
    'iglesia-la-merced-petorca', 'petorca-petroglifos-chincolco',
    'petorca-tunel-las-palmas'
  ];
begin
  foreach s in array paradas loop
    if not exists (
      select 1
      from legacy.places p
      join legacy.communes c on c.id = p.commune_id
      where p.slug = s and c.slug = 'petorca'
    ) then
      raise exception 'Falta el lugar % en la comuna de Petorca (legacy.places). No se cambió nada.', s;
    end if;
  end loop;
end $$;

-- 1) Nombre viejo → nombre nuevo (solo si quedó cargada con el viejo) -------
update legacy.routes
set slug = 'ruta-del-diablo-pedegua-chincolco', updated_at = now()
where slug = 'donde-el-diablo-perdio-el-poncho'
  and not exists (
    select 1 from legacy.routes
    where slug = 'ruta-del-diablo-pedegua-chincolco'
  );

-- 2-4) Rutas, textos, paradas y fuente ---------------------------------------
do $$
declare
  r record;
  rid uuid;
  i int;
begin
  for r in
    select * from (values
      (
        'ruta-del-diablo-pedegua-chincolco',
        '/rutas/ruta-del-diablo.webp',
        'Donde el Diablo perdió el poncho',
        'Tras la huella del diablo que, dice el dicho, murió en Petorca: parte en la antigua estación y el puente de Pedegua, y sigue valle arriba por la Escalera del Diablo en Hierro Viejo y la Iglesia La Merced de Petorca hasta los petroglifos de Chincolco.',
        'Donde el Diablo perdió el poncho',
        'Following the trail of the Devil who, as the saying goes, died in Petorca: it starts at Pedegua''s old railway station and bridge, then heads up the valley through the Devil''s Staircase in Hierro Viejo and La Merced Church in Petorca to the Chincolco petroglyphs.',
        array['pedegua', 'pedegua-puente', 'escalera-del-diablo',
              'iglesia-la-merced-petorca', 'petorca-petroglifos-chincolco'],
        'https://petorcaminera.wordpress.com/2016/12/13/el-diablo-murio-en-petorca/',
        'Cavando en Petorca y su Minería — El Diablo murió en Petorca'
      ),
      (
        'ruta-ferroviaria-pedegua-las-palmas',
        null,
        'Ruta Turística Ferroviaria Pedegua – Palquico – Las Palmas',
        'Por el antiguo trazado del ferrocarril: desde la estación de Pedegua, que conserva su fachada y bodegas restauradas, por el puente sobre el río Petorca, hasta el Túnel Las Palmas: 966 m inaugurados en 1914 como parte de la red Longitudinal Norte, Monumento Histórico desde 2011.',
        'Ruta Turística Ferroviaria Pedegua – Palquico – Las Palmas',
        'Along the old railway line: from Pedegua station, which keeps its restored façade and warehouses, across the bridge over the Río Petorca, to the Túnel Las Palmas: 966 m opened in 1914 as part of the Northern Longitudinal network, a National Historic Monument since 2011.',
        array['pedegua', 'pedegua-puente', 'petorca-tunel-las-palmas'],
        'https://www.monumentos.gob.cl/monumentos/monumentos-historicos/tunel-las-palmas',
        'Consejo de Monumentos Nacionales — Túnel Las Palmas'
      )
    ) as t(slug, cover, name_es, desc_es, name_en, desc_en, stops, src_url, src_label)
  loop
    -- Duración sin estimar (null): se completa desde /admin/rutas.
    insert into legacy.routes
      (slug, cover_image, estimated_duration_minutes, publication_status, verification_status)
    values (r.slug, r.cover, null, 'published', 'verified')
    on conflict (slug) do update
      set cover_image = excluded.cover_image,
          publication_status = excluded.publication_status,
          verification_status = excluded.verification_status,
          updated_at = now()
    returning id into rid;

    insert into legacy.route_translations (route_id, locale, name, description)
    values (rid, 'es', r.name_es, r.desc_es), (rid, 'en', r.name_en, r.desc_en)
    on conflict (route_id, locale) do update
      set name = excluded.name, description = excluded.description;

    delete from legacy.route_stops where route_id = rid;
    for i in 1 .. array_length(r.stops, 1) loop
      insert into legacy.route_stops (route_id, place_id, position)
      select rid, p.id, i - 1 from legacy.places p where p.slug = r.stops[i];
    end loop;

    if not exists (
      select 1 from legacy.sources
      where entity_type = 'route' and entity_id = rid and url = r.src_url
    ) then
      insert into legacy.sources (entity_type, entity_id, url, label)
      values ('route', rid, r.src_url, r.src_label);
    end if;
  end loop;
end $$;

commit;
