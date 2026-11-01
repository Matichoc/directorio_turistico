-- Chalaco, pueblo nuevo de la comuna de Petorca: donde el diablo perdió el
-- poncho según el poema "La Muerte del Diablo" (Elías Lizana, 1894). Un solo
-- script para pegar en el SQL Editor de city_tour, tal cual: se aplica en
-- `legacy` y en `legacy_dev` (si existe). No toca `public` (Papudo).
--
-- Coordenada: OpenStreetMap (nodo 5769887521). Resumen y fuente: FUCOA,
-- "El Mandinga. Historias del diablo en la zona central de Chile" (2021).
-- Mismos datos que scripts/seed.ts. Repetible; si algo falla, no cambia nada.

begin;

do $$
declare
  s text;
  lid uuid;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    execute format(
      'insert into %1$I.localities
         (commune_id, slug, latitude, longitude, summary_source_url, summary_source_label)
       select c.id, ''chalaco'', -32.178246, -70.7971751, $1, $2
         from %1$I.communes c
        where c.slug = ''petorca''
       on conflict (commune_id, slug) do update
         set latitude = excluded.latitude,
             longitude = excluded.longitude,
             summary_source_url = excluded.summary_source_url,
             summary_source_label = excluded.summary_source_label
       returning id', s)
      into lid
      using 'https://fucoa.cl/publicaciones/mandinga/',
            'FUCOA — El Mandinga. Historias del diablo en la zona central de Chile (2021)';
    if lid is null then
      raise exception 'En %, no está la comuna de Petorca. No se cambió nada.', s;
    end if;

    execute format(
      'insert into %1$I.locality_translations (locality_id, locale, name, summary)
       values ($1, ''es''::%1$I.locale, ''Chalaco'', $2),
              ($1, ''en''::%1$I.locale, ''Chalaco'', $3)
       on conflict (locality_id, locale) do update
         set name = excluded.name, summary = excluded.summary', s)
      using lid,
        'Caserío de la parte alta de la comuna, en el valle del río Pedernal, a unos 6,5 km al noreste de Chincolco. Según el poema "La Muerte del Diablo", que Elías Lizana publicó en 1894 en La Voz de Petorca, aquí perdió el diablo su poncho; otras versiones de la leyenda también pasan por sus cerros.',
        'Hamlet in the upper part of the commune, in the Pedernal River valley, about 6.5 km northeast of Chincolco. According to the poem "La Muerte del Diablo", published by Elías Lizana in 1894 in La Voz de Petorca, this is where the Devil lost his poncho; other versions of the legend also pass through its hills.';

    raise notice 'Chalaco listo en %.', s;
  end loop;
end $$;

commit;
