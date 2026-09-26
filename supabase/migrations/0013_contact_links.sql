-- Enlaces de contacto y redes reales (sitio, Facebook, Instagram, teléfono,
-- email, WhatsApp...) de un lugar, ruta o comuna. Un solo mecanismo
-- genérico en vez de una columna por red social — mismo principio que
-- `sources` (docs/DESIGN.md, "un solo lugar de verdad"), esta vez para
-- datos de contacto en vez de fuentes de verificación. `kind` es texto
-- libre a propósito (mismo criterio que `places.icon`, migración
-- 0010_place_icon.sql): agregar una red nueva no debería requerir otra
-- migración.

create table public.contact_links (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  entity_id uuid not null,
  kind text not null,
  value text not null,
  label text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index contact_links_entity_idx
  on public.contact_links (entity_type, entity_id);

alter table public.contact_links enable row level security;

create policy contact_links_public_read on public.contact_links
  for select using (true);
create policy contact_links_admin_write on public.contact_links
  for all using (public.is_admin()) with check (public.is_admin());
