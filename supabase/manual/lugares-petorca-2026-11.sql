-- Lugares nuevos de la comuna de Petorca y sus categorías (2026-11-01).
-- Pedido del usuario: "investiguemos más cositas y lugares" y que "se sumen y
-- acomoden en las categorías". Un solo script para pegar en el SQL Editor de
-- city_tour, tal cual: se aplica en `legacy` y en `legacy_dev` (si existe).
-- No toca `public` (Papudo).
--
-- Qué hace, en cada esquema:
--   1. Suma 10 lugares con su ubicación y su fuente: Turismo Rural La
--      Nina y El Rincón Criollo (Gastronomía, verificados: el usuario los
--      conoce), Hostal El Río y Tinajas Chincolco (Alojamiento), plazas,
--      piscina y medialuna (Recreación), iglesia de Chincolco y el campo de
--      petroglifos El Arenal. Los demás quedan publicados como "Pendiente de
--      verificación" (aviso ámbar en la ficha) hasta confirmarlos en /admin.
--   2. "Petroglifos de Chincolco" pasa a llamarse "Petroglifos de Chalaco":
--      OpenStreetMap ubica ese mismo sitio en Chalaco (a ~30 m del pin
--      actual), con 51 rocas y 70 paneles de 800 a 1.500 años.
--   3. Iglesia La Merced: su dirección (Matriz 135, InfoPetorca).
--   4. Ubica lugares en más de una categoría (ver supabase/manual/
--      categorias-petorca.sql).
-- Si un lugar ya existe (mismo slug), no se duplica ni se pisa lo editado.
-- Repetible. Una sola transacción: si algo falla, no cambia nada.
-- Mismos datos que scripts/seed.ts.

begin;

do $$
declare
  s text;
  r record;
  pid uuid;
  n integer;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    for r in
      select * from (values
        ('turismo-rural-la-nina', 'pedegua', 'gastronomia', -32.367683, -71.076079, 'Ruta E-35 km 37,5, Pedegua', '+56999593235', null, 'verified', 'Turismo Rural La Nina', 'Restorán al paso en la entrada de Pedegua, punto de partida de la ruta «Donde el Diablo perdió el poncho»: empanadas de pino con mote con huesillo o jugos naturales, y en verano humitas y pastel de choclo. Lo llevan César Arancibia y su madre, Cristina Delgado.', 'Turismo Rural La Nina', 'Roadside eatery at the entrance to Pedegua, starting point of the «Donde el Diablo perdió el poncho» route: beef empanadas with mote con huesillo or fresh juices, and humitas and pastel de choclo in summer. Run by César Arancibia and his mother, Cristina Delgado.', 'https://www.indap.gob.cl/noticias/emprendedor-de-turismo-rural-de-petorca-enfrenta-crisis-con-delivery-de-empanadas-caseras', 'INDAP — Emprendedor de turismo rural de Petorca (Turismo Rural La Nina)'),
        ('hostal-el-rio-pedegua', 'pedegua', 'alojamiento', -32.35448, -71.06973, 'Ferroviario 507, Pedegua', null, null, 'pending', 'Hostal El Río', 'Hostal en Pedegua, en la calle Ferroviario: jardín, terraza, sala de estar, cocina compartida y chimenea; admite mascotas.', 'Hostal El Río', 'Hostel in Pedegua, on Ferroviario street: garden, terrace, lounge, shared kitchen and fireplace; pets allowed.', 'https://destinia.com/es/hoteles/america-del-sur/chile/valparaiso/petorca/hostal-el-rio/ho-5484611', 'Destinia — Albergue Hostal El Río (Pedegua)'),
        ('tinajas-chincolco', 'chincolco', 'alojamiento', -32.2171, -70.8462, null, '+56996240044', 'https://tinajaschincolco.cl/', 'pending', 'Tinajas Chincolco', 'Refugio natural en Chincolco con hospedaje y tinajas termales con hidromasaje; también se puede ir solo por la tinaja (3 horas).', 'Tinajas Chincolco', 'Nature retreat in Chincolco with lodging and hot tubs with hydromassage; you can also book just the hot tub (3 hours).', 'https://tinajaschincolco.cl/', 'Tinajas Chincolco (sitio oficial)'),
        ('el-rincon-criollo-chincolco', 'chincolco', 'gastronomia', -32.22599, -70.84923, null, null, null, 'verified', 'El Rincón Criollo', 'Restaurante típico de Chincolco, conocido por sus parrilladas y su vino casero.', 'El Rincón Criollo', 'Traditional restaurant in Chincolco, known for its grilled meats and homemade wine.', 'https://www.classicistranieri.com/es/articles/p/e/t/Petorca.html', 'Petorca (artículo enciclopédico, versión antigua)'),
        ('iglesia-de-chincolco', 'chincolco', 'cultura', -32.2243, -70.84318, 'Avenida Pedro Montt, Chincolco', null, null, 'pending', 'Iglesia de Chincolco', 'Iglesia del pueblo de Chincolco, en la avenida Pedro Montt.', 'Chincolco Church', 'The village church of Chincolco, on Pedro Montt avenue.', 'https://www.openstreetmap.org/way/686139194', 'OpenStreetMap — Iglesia Chincolco'),
        ('plaza-de-armas-chincolco', 'chincolco', 'recreacion', -32.22272, -70.83635, 'Pedro Montt, Chincolco', null, null, 'pending', 'Plaza de Armas de Chincolco', 'Plaza del pueblo, en la calle Pedro Montt: un lugar tranquilo para descansar, frente a la Casa Pueblo y a la radio de Chincolco.', 'Chincolco Main Square', 'The village square on Pedro Montt street: a quiet place to rest, across from the Casa Pueblo and Chincolco''s radio station.', 'https://www.infopetorca.cl/p/turismo-en-chincolco.html', 'InfoPetorca — Turismo en Chincolco'),
        ('medialuna-de-chincolco', 'chincolco', 'recreacion', -32.23125, -70.85333, null, null, null, 'pending', 'Medialuna de Chincolco', 'La medialuna del pueblo, el recinto donde se corren los rodeos.', 'Chincolco Rodeo Arena', 'The village medialuna, the arena where rodeos are held.', 'https://www.openstreetmap.org/way/686139192', 'OpenStreetMap — Medialuna de Chincolco'),
        ('plaza-hierro-viejo', 'hierro-viejo', 'recreacion', -32.28123, -71.01388, null, null, null, 'pending', 'Plaza de Hierro Viejo', 'Plaza del pueblo de Hierro Viejo, que creció a lo largo del camino entre Cabildo y Petorca.', 'Hierro Viejo Square', 'The square of Hierro Viejo, a village that grew along the road between Cabildo and Petorca.', 'https://hierroviejo.cl/', 'hierroviejo.cl'),
        ('piscina-hierro-viejo', 'hierro-viejo', 'recreacion', -32.2796, -71.0103, null, null, null, 'pending', 'Piscina de Hierro Viejo', 'Piscina pública del pueblo, a orillas del camino.', 'Hierro Viejo Swimming Pool', 'The village''s public swimming pool, by the road.', 'http://www.vregion.cl/petorca/petorca/', 'V Región — Petorca'),
        ('petroglifos-el-arenal', 'pedernal', 'cultura', -32.10853, -70.79644, null, null, null, 'pending', 'Campo de Petroglifos El Arenal', 'Arte rupestre en una antigua llanura aluvial: unos 80 bloques de roca con grabados de alrededor del año 800 d.C., a unos 27 km al noreste de Petorca, camino a El Pedernal.', 'El Arenal Petroglyph Field', 'Rock art on an old alluvial plain: about 80 boulders with carvings from around 800 AD, some 27 km northeast of Petorca on the way to El Pedernal.', 'https://repositorio.uchile.cl/handle/2250/201561', 'Universidad de Chile — tesis sobre arte rupestre del valle de Petorca (2022)')
      ) as t(slug, locality, cat, lat, lon, address, phone, website, verif, name_es, short_es, name_en, short_en, src_url, src_label)
    loop
      execute format(
        'select id from %1$I.places where slug = $1', s)
        into pid using r.slug;
      if pid is not null then
        continue;
      end if;
      execute format(
        'insert into %1$I.places
           (slug, commune_id, locality_id, category_id, latitude, longitude,
            address, phone, website, publication_status, verification_status)
         select $1, c.id, l.id, k.id, $2, $3, $4, $5, $8, ''published'', $9::%1$I.verification_status
           from %1$I.communes c
           join %1$I.categories k on k.slug = $6
           left join %1$I.localities l on l.commune_id = c.id and l.slug = $7
          where c.slug = ''petorca''
         returning id', s)
        into pid
        using r.slug, r.lat, r.lon, r.address, r.phone, r.cat, r.locality, r.website, r.verif;
      if pid is null then
        raise exception 'En %, no se pudo crear % (¿falta la comuna o la categoría %?). No se cambió nada.', s, r.slug, r.cat;
      end if;
      execute format(
        'insert into %1$I.place_translations (place_id, locale, name, short_description)
         values ($1, ''es''::%1$I.locale, $2, $3), ($1, ''en''::%1$I.locale, $4, $5)', s)
        using pid, r.name_es, r.short_es, r.name_en, r.short_en;
      execute format(
        'insert into %1$I.sources (entity_type, entity_id, url, label)
         values (''place'', $1, $2, $3)', s)
        using pid, r.src_url, r.src_label;
    end loop;

    -- Petroglifos de Chalaco (antes "de Chincolco"): mismo sitio, bien ubicado.
    execute format(
      'update %1$I.places p set locality_id = l.id
         from %1$I.localities l
        where p.slug = ''petorca-petroglifos-chincolco'' and l.slug = ''chalaco''', s);
    execute format(
      'update %1$I.place_translations t
          set name = case t.locale::text when ''es'' then $1 else $3 end,
              short_description = case t.locale::text when ''es'' then $2 else $4 end
         from %1$I.places p
        where p.id = t.place_id and p.slug = ''petorca-petroglifos-chincolco''', s)
      using 'Petroglifos de Chalaco', 'Grabados rupestres en el sector de Chalaco, donde según la leyenda el diablo perdió el poncho: 51 rocas y 70 paneles de entre 800 y 1.500 años, asociados a las culturas El Molle, Las Ánimas, diaguita, mapuche e incluso incaica; sin protección oficial, algunos dañados por vandalismo en 2021.', 'Chalaco Petroglyphs', 'Rock carvings in the Chalaco area, where legend says the Devil lost his poncho: 51 boulders and 70 panels between 800 and 1,500 years old, linked to the El Molle, Las Ánimas, Diaguita, Mapuche and even Inca cultures; with no official protection, some were damaged by vandalism in 2021.';

    execute format(
      'update %1$I.place_translations t
          set description = replace(replace(t.description,
                ''En Chincolco, sector rural de la comuna de Petorca (9.826 habitantes, Censo 2017)'',
                ''En Chalaco, sector rural de la comuna de Petorca cerca de Chincolco (9.826 habitantes en la comuna, Censo 2017)''),
                ''In Chincolco, a rural sector of Petorca commune (9,826 residents, 2017 census)'',
                ''In Chalaco, a rural sector of Petorca commune near Chincolco (9,826 residents in the commune, 2017 census)'')
         from %1$I.places p
        where p.id = t.place_id and p.slug = ''petorca-petroglifos-chincolco''', s);

    execute format(
      'update %1$I.places set address = ''Matriz 135, Petorca''
        where slug = ''iglesia-la-merced-petorca'' and address is null', s);

    -- Más de una categoría (si la tabla existe: categorias-petorca.sql).
    if to_regclass(format('%I.place_secondary_categories', s)) is not null then
      execute format(
        'insert into %1$I.place_secondary_categories (place_id, category_id)
         select p.id, k.id
           from (values (''tinajas-chincolco'', ''recreacion''), (''plaza-de-armas-chincolco'', ''cultura''), (''medialuna-de-chincolco'', ''cultura''), (''petroglifos-el-arenal'', ''naturaleza''), (''petorca-tunel-las-palmas'', ''cultura''), (''pedegua-puente'', ''cultura''), (''escalera-del-diablo'', ''cultura''), (''petorca-plaza'', ''recreacion''), (''petorca-petroglifos-chincolco'', ''naturaleza'')) as x(slug, cat)
           join %1$I.places p on p.slug = x.slug
           join %1$I.categories k on k.slug = x.cat
          where p.category_id <> k.id
         on conflict do nothing', s);
    end if;

    execute format(
      'select count(*) from %1$I.places p join %1$I.communes c on c.id = p.commune_id
        where c.slug = ''petorca'' and p.publication_status = ''published''', s)
      into n;
    raise notice 'Listo en %: % lugares publicados en la comuna.', s, n;
  end loop;
end $$;

commit;
