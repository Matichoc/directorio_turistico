-- Lugares y su contenido asociado (traducciones, horarios, imágenes, tags).

create table public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  commune_id uuid not null references public.communes (id) on delete restrict,
  locality_id uuid references public.localities (id) on delete set null,
  category_id uuid not null references public.categories (id) on delete restrict,
  latitude double precision not null,
  longitude double precision not null,
  geog geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  ) stored,
  address text,
  phone text,
  website text,
  publication_status public.publication_status not null default 'draft',
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_geog_idx on public.places using gist (geog);
create index places_commune_id_idx on public.places (commune_id);
create index places_category_id_idx on public.places (category_id);
create index places_publication_status_idx on public.places (publication_status);

create table public.place_translations (
  place_id uuid not null references public.places (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  short_description text,
  description text,
  needs_review boolean not null default false,
  primary key (place_id, locale)
);

create index place_translations_name_trgm_idx
  on public.place_translations using gin (name gin_trgm_ops);
create index place_translations_description_trgm_idx
  on public.place_translations using gin (description gin_trgm_ops);

create table public.place_hours (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  unique (place_id, day_of_week)
);

create table public.place_images (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  position integer not null default 0
);

create index place_images_place_id_idx on public.place_images (place_id);

create table public.place_tags (
  place_id uuid not null references public.places (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (place_id, tag_id)
);
