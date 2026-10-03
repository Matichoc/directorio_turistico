# Modelo de datos — Petorca en Ruta

Fuente de verdad: `supabase/migrations/*.sql`. Este documento es un resumen legible;
ante cualquier discrepancia, las migraciones mandan. El tipo TypeScript espejo
vive en `src/types/database.ts` (a reemplazar por `supabase gen types typescript`
cuando exista un proyecto real).

## Tipos enumerados

- `locale`: `es` | `en`
- `publication_status`: `draft` | `published` | `archived`
- `verification_status`: `pending` | `verified` | `outdated`
- `entity_type`: `place` | `route` | `commune` (usado por `sources`/`verification_logs`/`contact_links`)

## Catálogo y geografía

| Tabla        | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `communes`   | Slug único. Traducciones en `commune_translations` (PK compuesta `commune_id, locale`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `localities` | Pertenece a una comuna (`unique(commune_id, slug)` — el slug no es único a secas, dos comunas pueden tener un pueblo con el mismo slug). `geog` es una columna generada (`geography(Point,4326)`) con índice GiST, derivada de `latitude`/`longitude`. **`latitude`/`longitude` son opcionales** (migración `0021_locality_translations.sql`): varios pueblos confirmados no tienen coordenada verificada todavía — se deja `null` en vez de inventar una (`geog` queda `null` también mientras tanto). Traducciones en `locality_translations` (`name` + `summary` opcional, PK compuesta `locality_id, locale`) — igual patrón que `commune_translations`; antes de esa migración el nombre vivía en una columna `localities.name` sin localizar. |
| `categories` | Slug único, ícono libre. Traducciones en `category_translations`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `tags`       | Sin tabla de traducciones (nombre único, no localizado — decisión del plan original).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

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
- `status_changed_at` (migración `0020_status_tracking.sql`, también en
  `routes`): cuándo cambió `publication_status` por última vez, vía trigger
  (`touch_status_changed_at`) — no se toca en otras ediciones. Alimenta el
  botón simple "Activar"/"Desactivar" del panel admin: nunca borra el
  registro, solo cambia el estado y deja la fecha.

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

## Itinerarios (2026-09-27: backend real)

`itineraries`/`itinerary_stops` respaldan de verdad el carrito de "Mi
recorrido" — hasta la migración `0018_itinerary_backend.sql` vivían sin usar,
mientras la app guardaba todo en `localStorage` (Riesgo #13). Se identifican
por `user_id uuid references auth.users` (`default auth.uid()`), la misma
sesión real de visitante que `place_likes`/`place_comments`
(`lib/session/visitor-session.ts`) — ya no por el `session_id` de texto
original. RLS scoped a `user_id = auth.uid() (or is_admin())`, tanto en
`itineraries` como en `itinerary_stops` (vía subconsulta a su itinerario
padre): el propio cliente lee/escribe su recorrido directo, sin pasar por el
cliente admin como planteaba el diseño original de este documento.

`unique(user_id)` en `itineraries`: un solo itinerario activo por
visitante, coincide con la UX de hoy (un carrito, no una lista de viajes
guardados). `order_mode` (`auto`/`manual`) vive en `itineraries` en vez de en
`localStorage` aparte, como antes. El `unique(itinerary_id, position)`
original de `itinerary_stops` se relaja (se quita la constraint): reordenar a
mano actualiza posiciones una fila a la vez vía PostgREST (no en una sola
transacción), así que dos filas pueden coincidir de forma transitoria durante
un intercambio — el orden visual sigue siendo correcto (`order by position`),
un empate se resuelve arbitrario pero estable.

`start_place_id`/`return_to_start` (migración `0019_itinerary_start_return.sql`,
pedido del usuario: "preguntar donde inicia y donde termina tu travesía, si
te vas a quedar en el último punto, o vas a volver a tu punto de origen"):
`start_place_id` (nullable, `on delete set null`) es qué lugar del carrito
debería usar el motor como punto de partida — sin elección explícita, sigue
usando el primer lugar agregado (comportamiento de siempre). `return_to_start`
le dice al motor (`findOptimalOrder`/`buildItinerary`) si el recorrido debe
volver a ese punto de partida al terminar la última parada (viaje redondo) o
quedarse ahí — afecta tanto el orden óptimo elegido como los totales de
distancia/duración expuestos (`Itinerary.returnLegDistanceKm`/
`returnLegDurationMinutes`).

## Contactos y "me gusta" (2026-09-26)

- `contact_links` (migración `0013_contact_links.sql`): enlaces de contacto/redes
  reales (sitio, Facebook, Instagram, teléfono, email...) de un lugar, ruta o
  comuna, vía `(entity_type, entity_id)` — mismo mecanismo genérico que
  `sources`, pero para datos de contacto en vez de fuentes de verificación.
  `kind` es texto libre a propósito (mismo criterio que `places.icon`): sumar
  una red nueva no requiere otra migración. Lectura pública, escritura solo
  admin. Hoy poblada con el sitio/redes oficiales de las 5 municipalidades
  (`scripts/seed.ts`, `communeLinks`) — usada por `MunicipalityBanner` (home)
  y la sección de contactos de `/informacion`.
- `place_likes` (migraciones `0014_place_likes.sql`, `0017_visitor_identity.sql`):
  "me gusta" por lugar, solo positivo (nunca reseña ni calificación
  negativa). Identidad real de Supabase Auth (`user_id uuid references
auth.users`, `default auth.uid()`) en vez del `session_id` de texto
  original — `ensureVisitorSession()` (`lib/session/visitor-session.ts`)
  crea una sesión **anónima** (`supabase.auth.signInAnonymously()`, sin
  email/contraseña) la primera vez que hace falta; RLS exige `user_id =
auth.uid()` tanto para insertar como para borrar, cerrando el hueco que
  tenía la v1 (cualquiera con la anon key podía dar/quitar un "me gusta"
  con solo adivinar un `session_id` ajeno). El conteo público se expone
  solo agregado vía `place_like_counts()` (función `security definer`),
  nunca la tabla cruda. La sesión anónima puede subirse después a una
  cuenta real de Google/Facebook (`linkIdentity()`) sin perder el
  historial (mismo `user_id`) — ver `docs/PLAN.md` sección 8.1. Requiere
  habilitar **"Allow anonymous sign-ins"** en Authentication → Settings
  del dashboard de Supabase (un toggle, sin credenciales de terceros).
- `place_comments` (migraciones `0015_place_comments.sql`,
  `0017_visitor_identity.sql`): comentario de texto libre por lugar, para
  que "vayan ganando reputación" (pedido del usuario) — pero con
  **moderación previa del admin** antes de publicarse (decisión explícita
  del usuario, no publicación inmediata): un `status`
  (`pending`/`approved`/`rejected`, default `pending`) gatea la lectura
  pública (`status = 'approved' or is_admin()`) y el insert (`with check
(status = 'pending' and user_id = auth.uid())`, así nadie se autoaprueba
  ni suplanta a otro visitante vía API). Mismo `user_id` de sesión real que
  `place_likes` — un solo identificador de visitante para ambas features.
  `lib/server/content/comments.ts` tiene los dos server actions
  (`submitComment`/`moderateComment`); `/admin/verificaciones` es hoy la
  cola de moderación real (antes un placeholder puro) — primer uso real
  del panel admin en este proyecto.

## Auspiciadores (2026-09-27)

`sponsors` + `sponsor_translations` (migración `0016_sponsors.sql`): antes un
solo slot fijo (Matichoc, hardcodeado por variables de entorno
`NEXT_PUBLIC_SPONSOR_*`, ya retiradas). Ahora una lista real que
`SponsorBanner` rota si hay más de uno (pedido del usuario al sumar Ember
Accesorios como segundo auspiciador). Lectura pública de los `active`,
escritura solo admin. Matichoc conserva su paleta de marca real (tokens
`--sponsor*`) por ser un caso ya aprobado; el resto usa la paleta estándar
del sitio (`--accent`) para no inventar un color de marca sin verificar.

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
