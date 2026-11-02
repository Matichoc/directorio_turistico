-- Segunda tanda de lugares de Petorca (2026-11-01): de los "recomendados"
-- de docs/CATALOGO-CANDIDATOS-PETORCA.md, los que tienen una ubicación de
-- una fuente que se puede guardar (OpenStreetMap, Sernatur o el negocio;
-- nunca Google, cuyas condiciones lo prohíben). Pegar tal cual en el SQL
-- Editor de city_tour: se aplica en `legacy` y `legacy_dev`. No toca
-- `public` (Papudo). Repetible; si algo falla, no cambia nada.
--
--   1. Suma Panal de Hierro Viejo (miel; Sernatur vigente) y Viña El
--      Sobrante (chicha y chacolí; + Patrimonio), "Pendiente de
--      verificación". Ubicación aproximada: la calle y el caserío.
--   2. Completa El Rincón Criollo con su dirección, WhatsApp, sitio y
--      especialidades (sitio oficial y Sernatur), sin pisar lo editado.
-- Mismos datos que scripts/seed.ts.

begin;

do $$
declare
  s text;
  r record;
  pid uuid;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    for r in
      select * from (values
        ('panal-de-hierro-viejo', 'hierro-viejo', 'gastronomia', -32.27736, -71.0034, 'Comercio 763, Hierro Viejo', '+56985394079', 'Panal de Hierro Viejo', 'Productos agroelaborados de Hierro Viejo, como la miel, con registro vigente en Sernatur.', 'Panal de Hierro Viejo', 'Farm-made products from Hierro Viejo, such as honey, registered with Sernatur.', 'https://serviciosturisticos.sernatur.cl/96237-panal-de-hierro-viejo', 'Sernatur — Registro de servicios turísticos: Panal de Hierro Viejo'),
        ('vina-el-sobrante', 'el-sobrante', 'gastronomia', -32.2254, -70.80767, null, null, 'Viña El Sobrante', 'Bodega de la Hacienda El Sobrante, que guarda la herencia de las primeras vides del valle: chicha, chacolí y vinos, con sala de ventas. Fue el final de la ruta «Donde el Diablo perdió el poncho», con degustación.', 'Viña El Sobrante', 'Winery of Hacienda El Sobrante, heir to the valley''s first vines: chicha, chacolí and wines, with a sales room. It was the end of the «Donde el Diablo perdió el poncho» route, with a tasting.', 'https://www.radioagricultura.cl/programas/el-agro/desempolvan-la-olvidada-tradicion-vitivinicola-del-valle-petorca_20161201/', 'Radio Agricultura — La olvidada tradición vitivinícola del valle de Petorca (2016)')
      ) as t(slug, locality, cat, lat, lon, address, phone, name_es, short_es, name_en, short_en, src_url, src_label)
    loop
      execute format('select id from %1$I.places where slug = $1', s) into pid using r.slug;
      if pid is not null then
        continue;
      end if;
      execute format(
        'insert into %1$I.places
           (slug, commune_id, locality_id, category_id, latitude, longitude,
            address, phone, publication_status, verification_status)
         select $1, c.id, l.id, k.id, $2, $3, $4, $5, ''published'', ''pending''
           from %1$I.communes c
           join %1$I.categories k on k.slug = $6
           left join %1$I.localities l on l.commune_id = c.id and l.slug = $7
          where c.slug = ''petorca''
         returning id', s)
        into pid using r.slug, r.lat, r.lon, r.address, r.phone, r.cat, r.locality;
      if pid is null then
        raise exception 'En %, no se pudo crear %. No se cambió nada.', s, r.slug;
      end if;
      execute format(
        'insert into %1$I.place_translations (place_id, locale, name, short_description)
         values ($1, ''es''::%1$I.locale, $2, $3), ($1, ''en''::%1$I.locale, $4, $5)', s)
        using pid, r.name_es, r.short_es, r.name_en, r.short_en;
      execute format(
        'insert into %1$I.sources (entity_type, entity_id, url, label) values (''place'', $1, $2, $3)', s)
        using pid, r.src_url, r.src_label;
    end loop;

    if to_regclass(format('%I.place_secondary_categories', s)) is not null then
      execute format(
        'insert into %1$I.place_secondary_categories (place_id, category_id)
         select p.id, k.id
           from (values (''vina-el-sobrante'', ''cultura'')) as x(slug, cat)
           join %1$I.places p on p.slug = x.slug
           join %1$I.categories k on k.slug = x.cat
          where p.category_id <> k.id
         on conflict do nothing', s);
    end if;

    -- El Rincón Criollo: solo lo que falte (no pisa lo editado en /admin).
    execute format(
      'update %1$I.places
          set address = coalesce(address, $1),
              phone = coalesce(phone, $2),
              website = coalesce(website, $3)
        where slug = ''el-rincon-criollo-chincolco''', s)
      using 'Pedro Montt 720, Chincolco', '+56972790432', 'https://miranchocriollo.cl/';
    execute format(
      'update %1$I.place_translations t
          set short_description = case t.locale::text when ''es'' then $1 else $2 end
         from %1$I.places p
        where p.id = t.place_id and p.slug = ''el-rincon-criollo-chincolco''
          and t.short_description like ''Restaurante típico de Chincolco%%''
           or p.id = t.place_id and p.slug = ''el-rincon-criollo-chincolco''
          and t.short_description like ''Traditional restaurant in Chincolco%%''', s)
      using 'Restaurante de campo chileno en Chincolco: parrilladas, pastel de choclo, porotos granados, prieta asada y postres como mote con huesillo y leche asada. Con registro vigente en Sernatur.', 'Chilean country-style restaurant in Chincolco: grilled meats, pastel de choclo, porotos granados, blood sausage and desserts such as mote con huesillo and leche asada. Registered with Sernatur.';
    execute format(
      'insert into %1$I.sources (entity_type, entity_id, url, label)
       select ''place'', p.id, $1, $2 from %1$I.places p
        where p.slug = ''el-rincon-criollo-chincolco''
          and not exists (select 1 from %1$I.sources x where x.entity_id = p.id and x.url = $1)', s)
      using 'https://miranchocriollo.cl/', 'Rincón Criollo (sitio oficial)';

    raise notice 'Listo en %.', s;
  end loop;
end $$;

commit;
