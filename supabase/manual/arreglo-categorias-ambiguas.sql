-- ARREGLO URGENTE (2026-11-01): después de categorias-petorca.sql el sitio
-- dejó de mostrar lugares (Explorar vacío, fichas en 404). Causa: la tabla
-- `place_secondary_categories`, con llaves hacia `places` y hacia
-- `categories`, le dio a la API (PostgREST) un segundo camino entre lugares
-- y categorías, y la consulta "lugar con su categoría" pasó a ser ambigua
-- (error PGRST201).
--
-- Qué hace, en `legacy` y `legacy_dev`:
--   - Quita la llave de `place_secondary_categories.place_id` hacia
--     `places` (sin ella no hay segundo camino). La de `category_id` se
--     queda: la usa el sitio para leer el nombre de la categoría.
--   - Lo que hacía esa llave (borrar las filas de un lugar eliminado) lo
--     hace ahora un disparador.
-- No borra datos ni toca `public` (Papudo). Repetible; si algo falla, no
-- cambia nada. Pegar tal cual en el SQL Editor de city_tour.

begin;

do $$
declare
  s text;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    if to_regclass(format('%I.place_secondary_categories', s)) is null then
      continue;
    end if;

    execute format(
      'alter table %I.place_secondary_categories
         drop constraint if exists place_secondary_categories_place_id_fkey', s);

    execute format($f$
      create or replace function %1$I.drop_place_secondary_categories()
      returns trigger
      language plpgsql
      security definer
      set search_path = %1$I, pg_temp
      as $body$
      begin
        delete from %1$I.place_secondary_categories where place_id = old.id;
        return old;
      end;
      $body$ $f$, s);
    execute format(
      'drop trigger if exists drop_secondary_categories on %I.places', s);
    execute format(
      'create trigger drop_secondary_categories after delete on %I.places
         for each row execute function %I.drop_place_secondary_categories()',
      s, s);

    raise notice 'Arreglado en %.', s;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
