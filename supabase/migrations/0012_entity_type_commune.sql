-- Se agrega 'commune' a entity_type para que `contact_links` (ver
-- 0013_contact_links.sql) pueda referenciar comunas además de lugares y
-- rutas, reusando el mismo enum que ya usan `sources`/`verification_logs`.
-- ALTER TYPE ... ADD VALUE no puede usarse en la misma transacción en que
-- se lee el nuevo valor, por eso va en su propia migración.
alter type public.entity_type add value 'commune';
