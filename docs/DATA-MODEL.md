# Modelo de datos — Petorca en Ruta

Fuente de verdad: `supabase/migrations/*.sql`. Este documento es un resumen legible;
ante cualquier discrepancia, las migraciones mandan. El tipo TypeScript espejo
vive en `src/types/database.ts` (a reemplazar por `supabase gen types typescript`
cuando exista un proyecto real).

## Tipos enumerados

- `locale`: `es` | `en`
- `publication_status`: `draft` | `published` | `archived`
- `verification_status`: `pending` | `verified` | `outdated`
- `entity_type`: `place` | `route` (usado por `sources`/`verification_logs`)

## Catálogo y geografía

| Tabla        | Notas                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `communes`   | Slug único. Traducciones en `commune_translations` (PK compuesta `commune_id, locale`).                                               |
| `localities` | Pertenece a una comuna. `geog` es una columna generada (`geography(Point,4326)`) con índice GiST, derivada de `latitude`/`longitude`. |
| `categories` | Slug único, ícono libre. Traducciones en `category_translations`.                                                                     |
| `tags`       | Sin tabla de traducciones (nombre único, no localizado — decisión del plan original).                                                 |

## Lugares

`places` referencia `communes` (obligatorio), `localities` (opcional) y `categories`.
Tiene su propia columna `geog` generada + índice GiST, y `publication_status` +
`verification_status` independientes (un lugar puede estar publicado y aun así
pendiente de reverificación).

- `place_translations`: `(place_id, locale)` único; incluye `needs_review` para
  marcar una traducción desincronizada respecto al idioma fuente (Riesgo #2 del plan).
- `place_hours`: una fila por día de semana (`0`–`6`), `unique(place_id, day_of_week)`.
- `place_images`: ordenadas por `position`.
- `place_tags`: tabla puente `place_id, tag_id`.

Índices trigram (`gin_trgm_ops`) en `name`/`description` para búsqueda por
similitud (buscador de Fase 1).

## Rutas

`routes` + `route_translations` siguen el mismo patrón que `places`.
`route_stops` ordena lugares dentro de una ruta (`unique(route_id, position)`);
`route_stop_translations` permite notas por parada localizadas.

## Verificación

`sources` y `verification_logs` son genéricas vía `(entity_type, entity_id)`
en lugar de FKs directas a `places`/`routes`, para no duplicar el modelo de
fuentes entre ambas entidades. **Trade-off**: no hay integridad referencial a
nivel de Postgres entre `entity_id` y la fila real — se valida en la capa de
aplicación (`lib/server/content/*`). Si esto resulta insuficiente, migrar a
dos FKs nullable (`place_id`, `route_id`) con un `check` de exclusividad.

Ambas tablas son de solo-admin en RLS (no se exponen públicamente en Fase 0).

## Itinerarios

`itineraries`/`itinerary_stops` son anónimos: se identifican por `session_id`
(un string generado en el cliente), no por `auth.users`. **Decisión de
seguridad**: la política RLS es deny-by-default para `anon`/`authenticated`
(solo `is_admin()` puede leer/escribir directamente vía PostgREST). El acceso
real del visitante debe implementarse como server actions que reciban el
`session_id` desde una cookie/localStorage y usen el cliente admin — así se
evita que cualquiera con la anon key pueda listar todos los itinerarios
(`select * from itineraries` sería público si la política fuera `using (true)`).
Este server action queda pendiente de implementar en Fase de itinerarios.

## Analítica

`analytics_events` acepta `insert` anónimo (para telemetría de la app pública)
pero solo lectura de administrador. No debe contener PII: `properties` es un
`jsonb` libre, validado con `zod` en `/api/analytics` (lista cerrada de
`name`s permitidos).

## Auth / administración

`admin_users(user_id)` mapea usuarios de `auth.users` a rol de administrador.
`public.is_admin()` es una función `security definer` que evalúa
`auth.uid()` contra esa tabla; todas las políticas de escritura la usan.
Alta de administradores: manual (insert directo con service role), no hay UI
todavía.

## Pendientes / no confirmado con el cliente

- `commune_translations` fue propuesta en el plan original marcada con `*`
  (no estaba en el esquema inicial del encargo). Se implementó igual, porque
  sin ella no habría nombres de comuna en inglés. Señalar explícitamente al
  cliente si el encargo original no contemplaba traducir comunas.
- Proveedor de tiles y su costo — ver Riesgos en `docs/PLAN.md`.
