-- Resúmenes de `analytics_events` para el panel `/admin/metricas`.
--
-- PostgREST corta las respuestas en 1.000 filas, así que agregar en el
-- servidor de la app (traer los eventos y contarlos) daría cifras
-- equivocadas apenas haya tráfico real. Se agrega en la base.
--
-- `security invoker` (por defecto): corre con los permisos de quien llama,
-- así que la RLS de `analytics_events` (solo administradores pueden leer,
-- ver 0008_rls.sql) sigue aplicando — un visitante recibe cero filas.

-- Los eventos más repetidos por el valor de una propiedad: p. ej. los
-- lugares más vistos (`place_view`, `slug`) o lo más buscado
-- (`search_performed`, `q`).
create or replace function public.analytics_top(
  p_name text,
  p_key text,
  p_days int default 30,
  p_limit int default 10
)
returns table (value text, total bigint)
language sql
stable
as $$
  select properties ->> p_key as value, count(*) as total
  from public.analytics_events
  where name = p_name
    and created_at >= now() - make_interval(days => p_days)
    and properties ->> p_key is not null
  group by 1
  order by 2 desc, 1
  limit p_limit;
$$;

-- Total de eventos por tipo en la ventana de días.
create or replace function public.analytics_totals(p_days int default 30)
returns table (name text, total bigint)
language sql
stable
as $$
  select name, count(*) as total
  from public.analytics_events
  where created_at >= now() - make_interval(days => p_days)
  group by 1
  order by 2 desc;
$$;
