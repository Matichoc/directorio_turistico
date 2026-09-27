-- Backend real para "Mi recorrido" (antes solo `localStorage`, Riesgo
-- #13) — pedido explícito del usuario. Usa la misma identidad real de
-- visitante que ya tienen "me gusta"/comentarios (`user_id uuid
-- references auth.users`, `default auth.uid()`) en vez del `session_id`
-- de texto del diseño original: el propio cliente lee/escribe su
-- recorrido directo, con RLS acotada a `auth.uid()`, sin depender del
-- cliente admin como se planteaba en la versión anterior de
-- docs/DATA-MODEL.md.
--
-- Un solo itinerario activo por visitante (`unique(user_id)`) — coincide
-- con la UX de hoy (un solo carrito "Mi recorrido"), no una lista de
-- viajes guardados. `order_mode` se suma acá (antes vivía aparte, en
-- localStorage) para que el modo auto/manual también sea real.
--
-- Sin datos reales que migrar todavía (tablas sin uso desde la Fase 0).

delete from public.itinerary_stops;
delete from public.itineraries;

alter table public.itineraries drop column session_id;
alter table public.itineraries
  add column user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade;
alter table public.itineraries
  add constraint itineraries_user_id_key unique (user_id);
alter table public.itineraries
  add column order_mode text not null default 'auto'
    check (order_mode in ('auto', 'manual'));

-- Se relaja el unique(itinerary_id, position) original: reordenar a mano
-- actualiza las posiciones una fila a la vez (una petición por fila vía
-- PostgREST, no una sola transacción), así que dos filas pueden coincidir
-- de forma transitoria durante un intercambio. El orden visual (`order by
-- position`) sigue siendo correcto igual; un empate se resuelve arbitrario
-- pero estable.
alter table public.itinerary_stops
  drop constraint if exists itinerary_stops_itinerary_id_position_key;

drop policy itineraries_admin_only on public.itineraries;
create policy itineraries_owner_rw on public.itineraries
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy itinerary_stops_admin_only on public.itinerary_stops;
create policy itinerary_stops_owner_rw on public.itinerary_stops
  for all using (
    exists (
      select 1 from public.itineraries i
      where i.id = itinerary_stops.itinerary_id
        and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.itineraries i
      where i.id = itinerary_stops.itinerary_id
        and (i.user_id = auth.uid() or public.is_admin())
    )
  );
