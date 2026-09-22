-- Itinerarios anónimos ("mi recorrido"), asociados a una sesión del cliente.

create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text,
  created_at timestamptz not null default now()
);

create index itineraries_session_id_idx on public.itineraries (session_id);

create table public.itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  position integer not null,
  planned_at timestamptz,
  unique (itinerary_id, position)
);

create index itinerary_stops_itinerary_id_idx on public.itinerary_stops (itinerary_id);
