-- Pedido del usuario: el panel admin simple para gente de negocio no debe
-- "pisar" (eliminar/sobreescribir sin dejar rastro) un lugar o ruta al
-- desactivarlo — solo cambia su estado, y queda guardado cuándo fue ese
-- cambio. Antes `publication_status` no tenía fecha propia (solo
-- `updated_at`, que se confunde con cualquier otra edición de contenido).
--
-- `status_changed_at` se actualiza únicamente cuando `publication_status`
-- cambia de verdad (no en cada UPDATE), vía trigger — así el admin puede
-- mostrar "publicado desde el 3 de octubre" sin que una edición de
-- descripción, por ejemplo, pise esa fecha.
alter table public.places
  add column status_changed_at timestamptz not null default now();
alter table public.routes
  add column status_changed_at timestamptz not null default now();

create or replace function public.touch_status_changed_at()
returns trigger
language plpgsql
as $$
begin
  if new.publication_status is distinct from old.publication_status then
    new.status_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger places_touch_status_changed_at
  before update on public.places
  for each row execute function public.touch_status_changed_at();

create trigger routes_touch_status_changed_at
  before update on public.routes
  for each row execute function public.touch_status_changed_at();
