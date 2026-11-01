-- Categorías de Explorar para la comuna de Petorca, y varias categorías por
-- lugar. Un solo script para pegar en el SQL Editor de city_tour, tal cual:
-- se aplica en `legacy` (sitio publicado) y en `legacy_dev` (desarrollo, si
-- existe). No toca `public` (Papudo).
--
-- Decisión del usuario (2026-11-01): Explorar por categorías, como en el
-- directorio de Papudo, con la "lista Petorca":
--   Gastronomía · Alojamiento · Naturaleza y aventura · Patrimonio y cultura
--   · Recreación   (más un acceso directo a Rutas, que no es categoría)
-- y que un lugar pueda estar en más de una.
--
-- Qué hace, en cada esquema:
--   1. Crea las categorías `alojamiento` y `recreacion` (si no están) y deja
--      los nombres es/en de las 5. Los slugs de siempre no cambian
--      (`naturaleza`, `cultura`, `gastronomia`): solo su nombre visible.
--   2. Crea `place_secondary_categories`: las categorías ADICIONALES de un
--      lugar. La principal sigue en `places.category_id` (ícono y color del
--      pin). Lectura pública si el lugar está publicado; escritura solo
--      admin (mismo patrón que `place_tags`).
--   3. Petroglifos de Chincolco: también "Naturaleza y aventura" (se llega
--      caminando por el cerro; el Club de Montaña Arrank'a hace visitas
--      guiadas — docs/PROPUESTA-CONTENIDO-PETORCA.md).
--
-- Es repetible. Una sola transacción: si algo falla, no cambia nada.
-- El sitio funciona antes y después de correrlo (si la tabla no existe,
-- cada lugar queda solo con su categoría principal).

begin;

do $$
declare
  s text;
  c record;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    -- 1) Categorías y sus nombres
    for c in
      select * from (values
        ('gastronomia', 'utensils', 'Gastronomía', 'Food & drink'),
        ('alojamiento', 'cama', 'Alojamiento', 'Places to stay'),
        ('naturaleza', 'mountain', 'Naturaleza y aventura', 'Nature & adventure'),
        ('cultura', 'landmark', 'Patrimonio y cultura', 'Heritage & culture'),
        ('recreacion', 'recreacion', 'Recreación', 'Leisure')
      ) as t(slug, icon, name_es, name_en)
    loop
      execute format(
        'insert into %1$I.categories (slug, icon) values ($1, $2)
         on conflict (slug) do nothing', s)
        using c.slug, c.icon;
      execute format(
        'insert into %1$I.category_translations (category_id, locale, name)
         select id, l.locale::%1$I.locale, l.name
           from %1$I.categories,
                (values (''es'', $2), (''en'', $3)) as l(locale, name)
          where slug = $1
         on conflict (category_id, locale) do update set name = excluded.name', s)
        using c.slug, c.name_es, c.name_en;
    end loop;

    -- 2) Categorías adicionales por lugar
    -- Sin llave hacia `places` a propósito: con llaves a `places` y a
    -- `categories` la API (PostgREST) ve un segundo camino entre lugares y
    -- categorías y la consulta "lugar con su categoría" se vuelve ambigua
    -- (pasó el 2026-11-01: el sitio quedó sin lugares). Ver
    -- arreglo-categorias-ambiguas.sql, que además borra las filas de un
    -- lugar eliminado con un disparador.
    execute format(
      'create table if not exists %1$I.place_secondary_categories (
         place_id uuid not null,
         category_id uuid not null references %1$I.categories (id) on delete cascade,
         primary key (place_id, category_id)
       )', s);
    execute format(
      'alter table %1$I.place_secondary_categories enable row level security', s);
    execute format(
      'drop policy if exists place_secondary_categories_public_read
         on %1$I.place_secondary_categories', s);
    execute format(
      'create policy place_secondary_categories_public_read
         on %1$I.place_secondary_categories for select using (
           %1$I.is_admin()
           or exists (
             select 1 from %1$I.places p
             where p.id = place_secondary_categories.place_id
               and p.publication_status = ''published''
           )
         )', s);
    execute format(
      'drop policy if exists place_secondary_categories_admin_write
         on %1$I.place_secondary_categories', s);
    execute format(
      'create policy place_secondary_categories_admin_write
         on %1$I.place_secondary_categories for all
         using (%1$I.is_admin()) with check (%1$I.is_admin())', s);
    execute format(
      'grant all on table %1$I.place_secondary_categories
         to anon, authenticated, service_role', s);

    -- 3) Petroglifos de Chincolco: también naturaleza y aventura
    execute format(
      'insert into %1$I.place_secondary_categories (place_id, category_id)
       select p.id, c.id
         from %1$I.places p, %1$I.categories c
        where p.slug = ''petorca-petroglifos-chincolco''
          and c.slug = ''naturaleza''
          and p.category_id <> c.id
       on conflict do nothing', s);

    raise notice 'Listo en %.', s;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
