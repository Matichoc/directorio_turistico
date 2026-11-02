-- San Ramón y El Francés, pueblos de la comuna de Petorca que faltaban en la
-- base (pedido del usuario: que el vuelo del inicio nombre a todos). Un solo
-- script para pegar en el SQL Editor de city_tour, tal cual: se aplica en
-- `legacy` y en `legacy_dev` (si existe). No toca `public` (Papudo).
--
-- Coordenadas: las marcó el usuario en el mapa, en la zona poblada de cada
-- sector (San Ramón ~1,2 km al oeste de Pedegua; El Francés entre Pedegua y
-- Santa Julia). Sin resumen: no hay todavía una fuente que lo respalde.
-- Mismos datos que scripts/seed.ts. Repetible; si algo falla, no cambia nada.

begin;

do $$
declare
  s text;
  lid uuid;
  pueblo record;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    for pueblo in
      select * from (values
        ('san-ramon', 'San Ramón', -32.352593::double precision, -71.082033::double precision),
        ('el-frances', 'El Francés', -32.328125::double precision, -71.083825::double precision)
      ) as v (slug, name, latitude, longitude)
    loop
      execute format(
        'insert into %1$I.localities (commune_id, slug, latitude, longitude)
         select c.id, $1, $2, $3
           from %1$I.communes c
          where c.slug = ''petorca''
         on conflict (commune_id, slug) do update
           set latitude = excluded.latitude,
               longitude = excluded.longitude
         returning id', s)
        into lid
        using pueblo.slug, pueblo.latitude, pueblo.longitude;
      if lid is null then
        raise exception 'En %, no está la comuna de Petorca. No se cambió nada.', s;
      end if;

      execute format(
        'insert into %1$I.locality_translations (locality_id, locale, name)
         values ($1, ''es''::%1$I.locale, $2),
                ($1, ''en''::%1$I.locale, $2)
         on conflict (locality_id, locale) do update
           set name = excluded.name', s)
        using lid, pueblo.name;

      raise notice '% listo en %.', pueblo.name, s;
    end loop;
  end loop;
end $$;

commit;
