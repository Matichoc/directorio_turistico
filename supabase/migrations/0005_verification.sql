-- Fuentes y bitácora de verificación de contenido (lugares y rutas).

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  entity_id uuid not null,
  url text not null,
  label text,
  created_at timestamptz not null default now()
);

create index sources_entity_idx on public.sources (entity_type, entity_id);

create table public.verification_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  entity_id uuid not null,
  status public.verification_status not null,
  notes text,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz not null default now()
);

create index verification_logs_entity_idx
  on public.verification_logs (entity_type, entity_id);
