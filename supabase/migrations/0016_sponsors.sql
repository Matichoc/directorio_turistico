-- Auspiciadores del banner (`SponsorBanner`) — antes un solo slot fijo
-- (Matichoc, hardcodeado por variables de entorno). Ahora una tabla real
-- para poder sumar más de uno (pedido del usuario: "Poner el segundo
-- auspiciador en el banner") y rotarlos igual que `MunicipalityBanner`.

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  logo_path text not null,
  website_url text,
  instagram_url text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.sponsor_translations (
  sponsor_id uuid not null references public.sponsors (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  tagline text,
  primary key (sponsor_id, locale)
);

alter table public.sponsors enable row level security;
alter table public.sponsor_translations enable row level security;

create policy sponsors_public_read on public.sponsors
  for select using (active or public.is_admin());
create policy sponsors_admin_write on public.sponsors
  for all using (public.is_admin()) with check (public.is_admin());

create policy sponsor_translations_public_read on public.sponsor_translations
  for select using (true);
create policy sponsor_translations_admin_write on public.sponsor_translations
  for all using (public.is_admin()) with check (public.is_admin());
