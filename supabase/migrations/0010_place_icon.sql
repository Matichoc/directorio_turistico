-- Ícono "de la zona" por lugar puntual, ahora como dato en vez de un mapa
-- fijo en el código (ver PLACE_ICON_OVERRIDES, retirado de
-- src/lib/ui/category-gradient.ts): pedido del usuario para que asignar un
-- ícono a un lugar no requiera tocar código ni redeploy, y quede listo para
-- que el futuro panel de administración lo deje elegir por lugar.
--
-- null = usa el ícono de su categoría (comportamiento de siempre); con
-- valor = ese ícono puntual gana. Los nombres válidos hoy son las claves de
-- ICON_PATHS en src/components/ui/category-icon.tsx (mountain, utensils,
-- landmark, waves, dulce, tejido, diablo, surf, casco-minero, palta) — sin
-- CHECK acá a propósito, para no requerir una migración cada vez que se
-- agregue un ícono nuevo a esa paleta.

alter table public.places
  add column icon text;
