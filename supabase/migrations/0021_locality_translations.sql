-- "Pueblos": nueva dimensión entre comuna y lugar (comuna → pueblo → lugares),
-- pedida por el usuario para armar un mapa real de la provincia con un
-- resumen por pueblo. `localities` ya existía desde `0002_catalog.sql` (con
-- `geog` + índice GiST) pero nunca se pobló ni se usó en código — hoy
-- `name` es un solo campo sin idioma, así que se reemplaza por una tabla de
-- traducciones, igual patrón que `commune_translations`/`category_translations`
-- (sin riesgo: la tabla está vacía).
alter table public.localities drop column name;

-- Coordenadas opcionales: se confirmó la existencia real de bastantes
-- pueblos/localidades de la provincia (fuentes cruzadas: Wikipedia, INE,
-- municipios, pueblosamerica.com) pero no de todos se pudo verificar una
-- coordenada precisa — mejor guardar el nombre real ahora y dejar la
-- ubicación exacta pendiente que inventar un punto que "parezca" preciso
-- (docs/DESIGN.md, "Nunca fabricar datos"). El mapa de `/pueblos/[slug]`
-- simplemente no dibuja el pin del pueblo mientras falte.
alter table public.localities alter column latitude drop not null;
alter table public.localities alter column longitude drop not null;

create table public.locality_translations (
  locality_id uuid not null references public.localities (id) on delete cascade,
  locale public.locale not null,
  name text not null,
  -- Resumen real del pueblo (fuente citada en `sources`, mismo criterio que
  -- lugares/rutas) — null mientras no haya contenido verificado, nunca un
  -- placeholder inventado (docs/DESIGN.md, "Nunca fabricar datos").
  summary text,
  primary key (locality_id, locale)
);

create index locality_translations_name_trgm_idx
  on public.locality_translations using gin (name gin_trgm_ops);

alter table public.locality_translations enable row level security;

create policy locality_translations_public_read on public.locality_translations
  for select using (true);
create policy locality_translations_admin_write on public.locality_translations
  for all using (public.is_admin()) with check (public.is_admin());
