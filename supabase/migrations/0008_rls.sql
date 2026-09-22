-- Políticas RLS base. Regla general:
--   * Lectura pública de contenido con publication_status = 'published'.
--   * Escritura (insert/update/delete) reservada a administradores
--     (public.admin_users), vía public.is_admin().
--   * Itinerarios anónimos ("mi recorrido") e `analytics_events` NO se
--     exponen a lectura pública por PostgREST: itinerarios se gestionan
--     desde server actions con el cliente admin (evita enumeración de
--     itinerarios ajenos vía RLS `using (true)`); analytics_events acepta
--     inserts anónimos pero solo administradores pueden leerlos.

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

alter table public.admin_users enable row level security;
create policy admin_users_select_self on public.admin_users
  for select using (user_id = auth.uid());

-- Catálogo: lectura pública, escritura solo admin.
alter table public.communes enable row level security;
alter table public.commune_translations enable row level security;
alter table public.localities enable row level security;
alter table public.categories enable row level security;
alter table public.category_translations enable row level security;
alter table public.tags enable row level security;

create policy communes_public_read on public.communes for select using (true);
create policy communes_admin_write on public.communes for all
  using (public.is_admin()) with check (public.is_admin());

create policy commune_translations_public_read on public.commune_translations
  for select using (true);
create policy commune_translations_admin_write on public.commune_translations
  for all using (public.is_admin()) with check (public.is_admin());

create policy localities_public_read on public.localities for select using (true);
create policy localities_admin_write on public.localities for all
  using (public.is_admin()) with check (public.is_admin());

create policy categories_public_read on public.categories for select using (true);
create policy categories_admin_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy category_translations_public_read on public.category_translations
  for select using (true);
create policy category_translations_admin_write on public.category_translations
  for all using (public.is_admin()) with check (public.is_admin());

create policy tags_public_read on public.tags for select using (true);
create policy tags_admin_write on public.tags for all
  using (public.is_admin()) with check (public.is_admin());

-- Lugares: lectura pública solo si publicados (o si eres admin).
alter table public.places enable row level security;
alter table public.place_translations enable row level security;
alter table public.place_hours enable row level security;
alter table public.place_images enable row level security;
alter table public.place_tags enable row level security;

create policy places_public_read on public.places for select
  using (publication_status = 'published' or public.is_admin());
create policy places_admin_write on public.places for all
  using (public.is_admin()) with check (public.is_admin());

create policy place_translations_public_read on public.place_translations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.places p
      where p.id = place_translations.place_id
        and p.publication_status = 'published'
    )
  );
create policy place_translations_admin_write on public.place_translations
  for all using (public.is_admin()) with check (public.is_admin());

create policy place_hours_public_read on public.place_hours
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.places p
      where p.id = place_hours.place_id
        and p.publication_status = 'published'
    )
  );
create policy place_hours_admin_write on public.place_hours for all
  using (public.is_admin()) with check (public.is_admin());

create policy place_images_public_read on public.place_images
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.places p
      where p.id = place_images.place_id
        and p.publication_status = 'published'
    )
  );
create policy place_images_admin_write on public.place_images for all
  using (public.is_admin()) with check (public.is_admin());

create policy place_tags_public_read on public.place_tags
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.places p
      where p.id = place_tags.place_id
        and p.publication_status = 'published'
    )
  );
create policy place_tags_admin_write on public.place_tags for all
  using (public.is_admin()) with check (public.is_admin());

-- Rutas: mismo patrón que lugares.
alter table public.routes enable row level security;
alter table public.route_translations enable row level security;
alter table public.route_stops enable row level security;
alter table public.route_stop_translations enable row level security;

create policy routes_public_read on public.routes for select
  using (publication_status = 'published' or public.is_admin());
create policy routes_admin_write on public.routes for all
  using (public.is_admin()) with check (public.is_admin());

create policy route_translations_public_read on public.route_translations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.routes r
      where r.id = route_translations.route_id
        and r.publication_status = 'published'
    )
  );
create policy route_translations_admin_write on public.route_translations
  for all using (public.is_admin()) with check (public.is_admin());

create policy route_stops_public_read on public.route_stops
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.routes r
      where r.id = route_stops.route_id
        and r.publication_status = 'published'
    )
  );
create policy route_stops_admin_write on public.route_stops for all
  using (public.is_admin()) with check (public.is_admin());

create policy route_stop_translations_public_read on public.route_stop_translations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.route_stops rs
      join public.routes r on r.id = rs.route_id
      where rs.id = route_stop_translations.route_stop_id
        and r.publication_status = 'published'
    )
  );
create policy route_stop_translations_admin_write on public.route_stop_translations
  for all using (public.is_admin()) with check (public.is_admin());

-- Verificación: solo administradores.
alter table public.sources enable row level security;
alter table public.verification_logs enable row level security;

create policy sources_admin_only on public.sources for all
  using (public.is_admin()) with check (public.is_admin());
create policy verification_logs_admin_only on public.verification_logs for all
  using (public.is_admin()) with check (public.is_admin());

-- Itinerarios: sin políticas públicas a propósito (deny-by-default).
-- Se gestionan desde server actions con el cliente admin.
alter table public.itineraries enable row level security;
alter table public.itinerary_stops enable row level security;

create policy itineraries_admin_only on public.itineraries for all
  using (public.is_admin()) with check (public.is_admin());
create policy itinerary_stops_admin_only on public.itinerary_stops for all
  using (public.is_admin()) with check (public.is_admin());

-- Analítica: cualquiera puede insertar (anónimo), solo admin puede leer.
alter table public.analytics_events enable row level security;

create policy analytics_events_public_insert on public.analytics_events
  for insert with check (true);
create policy analytics_events_admin_read on public.analytics_events
  for select using (public.is_admin());
