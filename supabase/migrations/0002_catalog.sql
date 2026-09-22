-- Catálogo geográfico y de clasificación: comunas, localidades, categorías, tags.

create type public.verification_status as enum ('pending', 'verified', 'outdated');
create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.locale as enum ('es', 'en');
create type public.entity_type as enum ('place', 'route');

create table public.communes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commune_translations (
  commune_id uuid not null references public.communes (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  description text,
  primary key (commune_id, locale)
);

create index commune_translations_name_trgm_idx
  on public.commune_translations using gin (name gin_trgm_ops);

create table public.localities (
  id uuid primary key default gen_random_uuid(),
  commune_id uuid not null references public.communes (id) on delete cascade,
  slug text not null,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  geog geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  ) stored,
  created_at timestamptz not null default now(),
  unique (commune_id, slug)
);

create index localities_geog_idx on public.localities using gist (geog);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table public.category_translations (
  category_id uuid not null references public.categories (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  primary key (category_id, locale)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
