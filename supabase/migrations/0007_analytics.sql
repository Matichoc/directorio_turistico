-- Eventos de analítica anónimos (sin PII).

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_name_idx on public.analytics_events (name);
create index analytics_events_created_at_idx on public.analytics_events (created_at);
