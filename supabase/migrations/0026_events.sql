-- Eventos de la comuna ("Qué pasa en Petorca", página /eventos): fiestas de
-- cada año, ediciones con fecha y eventos puntuales (pedido del usuario:
-- "Cocinando con el Diablo", el aniversario de Petorca, el de un club…).
-- Historial del esquema para réplicas y proyectos propios: en el proyecto
-- compartido city_tour se aplica con supabase/manual/eventos.sql (esquemas
-- `legacy` y `legacy_dev`), nunca con `supabase db push`.
--
-- Una fila puede tener fecha confirmada (`starts_on`), mes de cada año
-- (`usual_month`) o las dos. Sin ninguna de las dos no hay qué mostrar, así
-- que no se acepta: nunca una fecha inventada para llenar el calendario.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  commune_id uuid not null references public.communes (id) on delete cascade,
  locality_id uuid references public.localities (id) on delete set null,
  place_id uuid references public.places (id) on delete set null,
  starts_on date,
  ends_on date,
  start_time time,
  usual_month smallint check (usual_month between 1 and 12),
  usual_month_end smallint check (usual_month_end between 1 and 12),
  organizer text,
  source_url text,
  source_label text,
  cover_image text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint events_has_when check (starts_on is not null or usual_month is not null),
  constraint events_end_after_start check (ends_on is null or (starts_on is not null and ends_on >= starts_on)),
  constraint events_month_end_needs_month check (usual_month_end is null or usual_month is not null)
);

create index events_commune_idx on public.events (commune_id);
create index events_locality_idx on public.events (locality_id);
create index events_place_idx on public.events (place_id);

create table public.event_translations (
  event_id uuid not null references public.events (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  description text,
  -- Cuándo es, en palabras ("Último domingo de septiembre", "Semana
  -- Santa"): solo lo que diga la fuente.
  when_note text,
  primary key (event_id, locale)
);

alter table public.events enable row level security;
alter table public.event_translations enable row level security;

create policy events_public_read on public.events
  for select using (published or public.is_admin());
create policy events_admin_write on public.events
  for all using (public.is_admin()) with check (public.is_admin());

create policy event_translations_public_read on public.event_translations
  for select using (true);
create policy event_translations_admin_write on public.event_translations
  for all using (public.is_admin()) with check (public.is_admin());

create trigger audit_changes after insert or update or delete
  on public.events for each row execute function public.log_change();
create trigger audit_changes after insert or update or delete
  on public.event_translations for each row execute function public.log_change();
