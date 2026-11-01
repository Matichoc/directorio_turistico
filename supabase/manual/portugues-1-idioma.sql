-- Portugués, paso 1 de 2 (2026-11-01): agrega el idioma 'pt' al tipo
-- `locale` del diablo, en `legacy` y `legacy_dev`. Pegar tal cual en el SQL
-- Editor de city_tour y correrlo ANTES del paso 2: Postgres no deja usar un
-- valor nuevo de un tipo en la misma transacción en que se agregó.
-- No toca `public` (Papudo tiene su propio tipo). Repetible.

do $$
declare
  s text;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    if to_regtype(format('%I.locale', s)) is null then
      raise exception 'En % no existe el tipo locale. No se cambió nada.', s;
    end if;
    execute format('alter type %I.locale add value if not exists %L', s, 'pt');
    raise notice 'Listo en %: el idioma pt ya existe.', s;
  end loop;
end $$;
