-- Portada de "Cocinando con el Diablo" en /eventos (2026-11-03): ilustración
-- con el cartel del evento, entregada por el usuario para ese evento. Lleva
-- la marca "Ilustración con IA" en el sitio.
--
-- Qué hace, en `legacy` y `legacy_dev` (nunca en `public`, que es de Papudo):
-- pone `cover_image` en ese único evento, solo si todavía no tiene portada
-- (no pisa una foto real puesta después desde el panel). Repetible.
--
-- Pegar tal cual en el SQL Editor de city_tour, DESPUÉS de que el archivo
-- esté publicado (si no, la tarjeta queda un rato con una imagen rota). El
-- sitio cachea las páginas hasta 5 minutos. También se puede poner a mano
-- en el panel: Eventos → Cocinando con el Diablo → Portada.

do $$
declare
  s text;
  changed int;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    if to_regclass(format('%I.events', s)) is null then
      raise notice 'En % no está la tabla de eventos (falta eventos.sql).', s;
      continue;
    end if;
    execute format(
      'update %I.events
         set cover_image = %L
       where slug = %L and cover_image is null',
      s,
      '/eventos/cocinando-con-el-diablo.webp',
      'cocinando-con-el-diablo'
    );
    get diagnostics changed = row_count;
    raise notice 'En %: % evento(s) con portada.', s, changed;
  end loop;
end $$;
