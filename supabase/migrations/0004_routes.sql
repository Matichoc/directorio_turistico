-- Rutas turísticas y sus paradas.

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  cover_image text,
  estimated_duration_minutes integer,
  publication_status public.publication_status not null default 'draft',
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index routes_publication_status_idx on public.routes (publication_status);

create table public.route_translations (
  route_id uuid not null references public.routes (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  description text,
  primary key (route_id, locale)
);

create index route_translations_name_trgm_idx
  on public.route_translations using gin (name gin_trgm_ops);

create table public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete restrict,
  position integer not null,
  unique (route_id, position)
);

create index route_stops_route_id_idx on public.route_stops (route_id);
create index route_stops_place_id_idx on public.route_stops (place_id);

create table public.route_stop_translations (
  route_stop_id uuid not null references public.route_stops (id) on delete cascade,
  locale public.locale not null,
  notes text,
  primary key (route_stop_id, locale)
);
