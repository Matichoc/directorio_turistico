-- Portada curada a mano por ruta (pedido del usuario: imágenes generadas
-- con IA, estilo cartel de viaje, mostrando los hitos reales de cada
-- ruta). null = sin portada propia; RouteCard cae a la foto de la primera
-- parada (comportamiento de siempre, ver pickRouteCoverPhoto en
-- lib/data/routes.ts). Es una ruta local (`/rutas/<archivo>`), no una
-- referencia a place_images.

alter table public.routes
  add column cover_image text;
