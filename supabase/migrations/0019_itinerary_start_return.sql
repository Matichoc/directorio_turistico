-- "Mi recorrido": el usuario pidió poder elegir dónde empieza su
-- travesía y si vuelve al punto de partida al terminar o se queda en el
-- último lugar ("preguntar donde inicia y donde termina tu travesía, si
-- te vas a quedar en el ultimo punto, o vas a volver a tu punto de
-- origen"). Antes el motor siempre partía del primer lugar agregado al
-- carrito y nunca volvía al origen.
--
-- `start_place_id` nullable: sin elección explícita, se sigue usando el
-- primer lugar del carrito (comportamiento de siempre). `on delete set
-- null` en vez de cascade — si el lugar elegido como inicio se despublica
-- o se borra, el recorrido no debería desaparecer con él, solo perder esa
-- preferencia puntual.
alter table public.itineraries
  add column start_place_id uuid references public.places (id) on delete set null;
alter table public.itineraries
  add column return_to_start boolean not null default false;
