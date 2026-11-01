-- Categorías adicionales por lugar (un lugar puede estar en más de una). La
-- principal sigue en `places.category_id` (ícono y color del pin).
-- Historial del esquema para réplicas y proyectos propios: en el proyecto
-- compartido city_tour esto se aplica con supabase/manual/categorias-petorca.sql
-- (esquemas `legacy` y `legacy_dev`), nunca con `supabase db push`.

create table public.place_secondary_categories (
  place_id uuid not null references public.places (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (place_id, category_id)
);

alter table public.place_secondary_categories enable row level security;

create policy place_secondary_categories_public_read
  on public.place_secondary_categories for select using (
    public.is_admin()
    or exists (
      select 1 from public.places p
      where p.id = place_secondary_categories.place_id
        and p.publication_status = 'published'
    )
  );
create policy place_secondary_categories_admin_write
  on public.place_secondary_categories for all
  using (public.is_admin()) with check (public.is_admin());
