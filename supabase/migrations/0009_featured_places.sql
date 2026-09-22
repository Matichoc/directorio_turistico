-- Lugares "destacados" (posición publicitaria pagada, gestionada a mano
-- por el dueño del sitio — sin pasarela de pago, ver docs/PLAN.md).
-- featured_until nulo = no destacado; con fecha futura = destacado hasta
-- esa fecha; el listado no filtra por esto, solo lo usa para ordenar.

alter table public.places
  add column featured_until timestamptz;

create index places_featured_until_idx
  on public.places (featured_until)
  where featured_until is not null;
