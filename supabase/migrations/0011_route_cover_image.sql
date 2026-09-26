-- CORRECCIÓN (2026-09-26): esta migración estaba de más. `routes.cover_image`
-- ya existía desde `0004_routes.sql` (Fase 0) — error mío al asumir, sin
-- revisar esa migración, que el campo declarado en `types/database.ts`
-- (`RouteRow.cover_image`) no tenía columna real detrás. `if not exists`
-- para que sea segura de correr igual (no-op en un proyecto que ya la
-- tenía, y crea la columna en uno nuevo que por algún motivo no la tuviera).
--
-- Portada curada a mano por ruta (pedido del usuario: imágenes generadas
-- con IA, estilo cartel de viaje, mostrando los hitos reales de cada
-- ruta). null = sin portada propia; RouteCard cae a la foto de la primera
-- parada (comportamiento de siempre, ver pickRouteCoverPhoto en
-- lib/data/routes.ts). Es una ruta local (`/rutas/<archivo>`), no una
-- referencia a place_images.

alter table public.routes
  add column if not exists cover_image text;
