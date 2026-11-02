-- Analítica: la base solo acepta eventos con nombre conocido y tamaño
-- razonable (auditoría H-07, 2026-11-02). PROPUESTA: revisar antes de correr.
--
-- Por qué: `/api/analytics` ya valida nombre, cantidad y largo de las
-- propiedades y limita pedidos por IP, pero la política de inserción de la
-- base es `with check (true)`: con la llave pública (que va en el navegador)
-- cualquiera puede insertar directo por la API REST de Supabase, saltándose
-- esas validaciones. Esto pone las mismas reglas en la base.
--
-- Qué hace, en `legacy` y `legacy_dev` (nunca en `public`, que es de Papudo):
--   * borra las políticas de INSERT que haya en `analytics_events` (si
--     quedara una permisiva al lado, Postgres las suma con OR y la nueva no
--     serviría de nada) y avisa sus nombres;
--   * crea `analytics_events_insert_valid`: nombre de la lista, propiedades
--     como objeto JSON de hasta 4 KB.
-- No toca filas existentes ni la política de lectura. Repetible.
--
-- La lista de nombres es la de `src/lib/analytics/events.ts`
-- (ANALYTICS_EVENT_NAMES): un evento nuevo en el código necesita sumarse
-- acá y volver a correr el script, o la base lo rechazará.
--
-- Pegar tal cual en el SQL Editor de city_tour.

do $$
declare
  s text;
  p record;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    if to_regclass(format('%I.analytics_events', s)) is null then
      raise notice 'En % no existe analytics_events: se salta.', s;
      continue;
    end if;

    for p in
      select policyname from pg_policies
      where schemaname = s
        and tablename = 'analytics_events'
        and cmd in ('INSERT', 'ALL')
    loop
      execute format('drop policy %I on %I.analytics_events', p.policyname, s);
      raise notice 'En %: se quitó la política %.', s, p.policyname;
    end loop;

    execute format($policy$
      create policy analytics_events_insert_valid on %I.analytics_events
        for insert
        with check (
          name = any (array[
            'place_view',
            'route_view',
            'locality_view',
            'route_added_to_trip',
            'place_added_to_trip',
            'place_liked',
            'search_performed',
            'filter_applied'
          ])
          and jsonb_typeof(properties) = 'object'
          and pg_column_size(properties) <= 4096
        )
    $policy$, s);
    raise notice 'Listo en %: analytics_events solo acepta eventos válidos.', s;
  end loop;
end $$;
