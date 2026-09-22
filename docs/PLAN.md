# El diablo murió en Petorca y en La Ligua lo enterraron — Plan del proyecto

> Documento vivo. Actualizar al cerrar cada fase o al tomar una decisión técnica relevante.

## Estado actual

- Fase: **Fase 1 — completada** (mergeada a `main`). Proyecto Supabase real ya creado por el usuario, migraciones y seed aplicados y verificados en vivo.
- Última actualización: 2026-09-22

## 1. Arquitectura

Aplicación única Next.js (App Router), no monorepo.

| Capa del encargo         | Implementación                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Interfaz pública         | `app/[locale]/...`                                                                     |
| Panel administrativo     | `app/admin/...`, protegido con Supabase Auth                                           |
| Acceso a datos           | `lib/data/*`                                                                           |
| Mapas/geocodificación    | `lib/maps/*` (MapLibre GL, proveedor de tiles por env var)                             |
| Motor de itinerarios     | `lib/itinerary-engine/*` — módulo TS puro, sin dependencias de UI ni Supabase directas |
| Contenido y verificación | Server actions en `lib/server/content/*` + `sources`, `verification_logs`              |
| Analítica                | `lib/analytics/*`, eventos anónimos                                                    |
| Futuro conversacional    | Interfaz `ItineraryEngine.build(input): Itinerary` como punto de extensión             |

### Decisiones técnicas (por defecto, reversibles)

- **i18n:** `next-intl` (rutas localizadas `/es`, `/en`, mensajes separados, hreflang).
- **PWA:** `Serwist` en vez de `next-pwa` (mejor mantenido, compatible con App Router). _Cambio respecto a lo implícito en el encargo original — señalado al usuario._
- **Mapas:** MapLibre GL JS + `react-map-gl`, proveedor de tiles configurable por env var (`NEXT_PUBLIC_MAP_STYLE_URL`). Proveedor comercial definitivo: **pendiente de definir antes de producción** (implica costos).
- **Validación:** `zod`.
- **Testing:** `vitest` + Testing Library + Playwright.
- **Gestor de paquetes:** `pnpm`.
- **Fechas:** `date-fns` + `date-fns-tz`.
- **Base de datos:** Supabase (Postgres + PostGIS + Auth + Storage). RLS deny-by-default en itinerarios; ver `docs/DATA-MODEL.md`.

## 2. Estructura de carpetas

```
directorio_turistico/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── page.tsx
│   │   │   ├── explorar/ (en: explore)
│   │   │   ├── rutas/[slug]/ (en: routes)
│   │   │   ├── lugares/[slug]/ (en: places)
│   │   │   ├── recorrido/ (en: my-trip)
│   │   │   └── informacion/ (en: info)
│   │   ├── admin/
│   │   │   ├── lugares/
│   │   │   ├── rutas/
│   │   │   ├── verificaciones/
│   │   │   ├── comunas-categorias/
│   │   │   └── login/
│   │   ├── api/
│   │   │   └── analytics/
│   │   └── manifest.ts / sw.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── map/
│   │   ├── place/
│   │   ├── route/
│   │   └── itinerary/
│   ├── lib/
│   │   ├── data/
│   │   ├── itinerary-engine/
│   │   ├── maps/
│   │   ├── analytics/
│   │   ├── server/content/
│   │   └── supabase/
│   ├── i18n/
│   ├── messages/
│   │   ├── es.json
│   │   └── en.json
│   └── types/
├── supabase/migrations/
├── public/
├── tests/{unit,integration,e2e}/
├── scripts/
├── docs/{ARCHITECTURE.md,PLAN.md,DATA-MODEL.md}
├── .env.example
└── README.md
```

## 3. Esquema de base de datos (resumen)

**Catálogo/geografía:** communes, commune_translations, localities, categories, category_translations, tags
**Lugares:** places, place_translations, place_hours, place_images, place_tags
**Rutas:** routes, route_translations, route_stops, route_stop_translations
**Verificación:** sources, verification_logs
**Itinerarios:** itineraries, itinerary_stops
**Analítica:** analytics_events
**Auth/admin:** admin_users (mapea `auth.users` a rol de administrador)

Ver detalle completo en `docs/DATA-MODEL.md` y `supabase/migrations/*.sql`.

Reglas: único `(entity_id, locale)` en cada tabla `*_translations`; columna `geography(Point,4326)` generada + índice GiST en places/localities; índice trigram en nombre/descripción; RLS por estado de publicación y por rol (`public.is_admin()`).

## 4. Dependencias principales

next, react, typescript, tailwindcss, next-intl, @supabase/supabase-js, @supabase/ssr, maplibre-gl, react-map-gl, zod, @serwist/next, serwist, date-fns, date-fns-tz, vitest, @testing-library/react, @playwright/test, eslint, prettier.

## 5. Riesgos

1. Costo/cuota del proveedor de tiles — definir antes de producción. Mientras tanto se usa el estilo demo gratuito de MapLibre.
2. Desincronización ES/EN si el marcado "requiere revisión" (`place_translations.needs_review`) falla.
3. Soporte parcial de PWA en iOS Safari — documentar limitaciones.
4. Complejidad del motor de itinerarios (coherencia geográfica, horarios) — requiere pruebas unitarias exhaustivas antes de UI. La Fase 0 entrega una versión base (vecino más cercano) con tests; falta soporte de horarios de apertura.
5. RLS debe cubrir tablas base y tablas de traducción — cubierto en `0008_rls.sql`, pendiente de probar contra datos reales.
6. Gobernanza de traducciones IA — decisión pendiente para Fase 4.
7. Aunque el seed usa lugares/rutas reales (con fuente citada en `sources`) y los publica para que se vean en el sitio, coordenadas, horarios y datos de contacto no están verificados en terreno — deben quedar marcados inequívocamente como "pendiente de verificación" hasta que un admin los confirme. Cubierto por `scripts/seed.ts` (`verification_status = 'pending'`, `publication_status = 'published'`) y el badge de la ficha de lugar.
8. Íconos PWA (`public/icons/icon-192.png`, `icon-512.png`) son placeholders pendientes de diseño final.
9. ~~Sin proyecto Supabase real conectado~~ — resuelto: el usuario creó el proyecto (`diablo_petorca_ligua`), aplicó las migraciones vía CLI y corrió el seed.
10. Sandbox de esta sesión sin salida de red hacia `supabase.co` (política de egress de la organización): no se pudo probar visualmente contra la base real desde el entorno de Claude Code; toda validación en vivo la hizo el usuario en su máquina. Si esto se repite, delegar la verificación visual al usuario o a CI con secretos propios.
11. `listPlaces`/`listRoutes` filtran `tagSlug`/`query` en memoria después de traer todos los lugares publicados (ver comentario en `lib/data/places.ts`) — válido mientras el catálogo sea pequeño (decenas de lugares); si crece, mover a filtros SQL/`!inner` dinámicos o paginar.
12. El selector de intención del home usa las 4 categorías reales del seed (naturaleza, gastronomía, cultura, playa) — se ajustó `home.intent` de "aventura" a "playa" para que coincida con datos reales en vez de una categoría inexistente.

## 6. Fase 0 — tareas

- [x] Crear repositorio y README inicial
- [x] Inicializar Next.js + TS + Tailwind + ESLint/Prettier
- [x] Configurar pnpm y scripts (dev/build/lint/test/test:e2e)
- [x] Crear .env.example documentado
- [x] Configurar clientes Supabase (browser/server/admin)
- [x] Migraciones iniciales (todas las tablas)
- [x] Políticas RLS base
- [x] Seed: 5 comunas, categorías/tags, 9 lugares reales (con fuente en `sources`) y 3 rutas — incluida "Ruta del Diablo" —, todos pendientes de verificación
- [x] Configurar next-intl (es/en, middleware de locale)
- [x] Configurar Vitest + Testing Library + Playwright (esqueleto)
- [x] Documentar arquitectura y este plan
- [ ] Crear proyecto Supabase real y aplicar migraciones (requiere acción del cliente/usuario)

## 7. Fase 1 — tareas

- [x] Layout raíz mobile-first + navegación inferior
- [x] Middleware de locale (/ → /es, selector ES|EN persistente)
- [x] Portada (hero, buscador → `/explorar?q=`, selector de intención → `/explorar?categoria=`, rutas destacadas reales, acceso a "Ver todas las rutas")
- [x] Explorador: listado de tarjetas + mapa (MapLibre, marcadores + popup) + toggle vía `?vista=mapa|lista`
- [x] Filtros (comuna, categoría, características) vía `lib/data/communes.ts`, `categories.ts`, `tags.ts` + `ExploreFilters` (query params en la URL, compartibles)
- [x] Buscador por nombre/localidad (`?q=`, filtra en memoria sobre nombre/comuna/descripción corta)
- [x] Ficha de lugar completa (dirección, teléfono, sitio web, tags, "abrir en Google Maps", compartir con Web Share API + fallback a copiar enlace, badge de verificación)
- [x] Ficha de ruta completa (duración, lista de paradas enlazadas a cada lugar)
- [x] Estados de carga (`loading.tsx` con skeletons en explorar/rutas), error (`error.tsx` genérico en `[locale]`) y sin resultados (`EmptyState`)
- [x] Accesibilidad WCAG AA básica: labels asociados a inputs/selects, `aria-pressed` en el toggle de vista, `aria-label` en marcadores del mapa, `role="search"`/`role="status"`, foco visible por defecto del navegador (sin `outline-none`)
- [x] Pruebas de integración para `PlaceCard`/`RouteCard` (se corrigió un bug real: faltaba `cleanup()` entre tests de Testing Library en `tests/setup.ts`, causaba falsos positivos/negativos por acumulación del DOM)
- [ ] `pnpm test:e2e` (Playwright) contra datos reales — no ejecutado en esta sesión (sandbox sin acceso de red a Supabase)

## Bitácora de decisiones

- 2026-09-21: Propuesta inicial de arquitectura, esquema y fases 0-1 presentada, pendiente de aprobación.
- 2026-09-22: Usuario aprueba ejecutar la Fase 0 completa. Sin proyecto Supabase real disponible (el usuario no tiene uno creado): se escriben migraciones, RLS y seed listos para aplicar, pero no se conecta a ningún proyecto en vivo. Scaffolding de Next.js 16 + next-intl + Supabase clients + itinerary-engine + testing completado. PR #1 mergeado a `main`.
- 2026-09-22: Cambio de marca — el sitio pasa a llamarse "El diablo murió en Petorca y en La Ligua lo enterraron" (dicho popular chileno sobre la rivalidad Petorca/La Ligua, documentado desde 1894). "Petorca en Ruta" queda solo como nombre de trabajo interno del repo/paquete npm. Matichoc deja de ser la marca del sitio: pasa a auspiciador, con un banner discreto (`components/ui/sponsor-banner.tsx`) en vez de branding. Se reemplazan los lugares/rutas demo por 9 lugares y 3 rutas reales de la provincia (Playa de Papudo, Playa Chica, Bahía y mirador de Zapallar, Museo y Plaza de La Ligua, Escalera del Diablo, Iglesia La Merced y casa natal de Manuel Montt en Petorca, Cerro Chache en Cabildo), investigados vía web search con fuente citada en la tabla `sources` para cada uno — incluida una "Ruta del Diablo" que conecta Hierro Viejo, Petorca y La Ligua siguiendo el dicho. Quedan `publication_status = 'published'` (para que se vean apenas se apliquen el seed) pero `verification_status = 'pending'`: son datos reales pero no verificados en terreno.
- 2026-09-22: Usuario prueba la app localmente (`pnpm dev` en Windows) — confirma que el home, el banner y la navegación funcionan, pero `/es/rutas` y `/es/explorar` solo muestran el esqueleto de Fase 0 (sin listado de tarjetas) y no hay datos porque aún no existe un proyecto Supabase real. Se corrige el seed para publicar el contenido (antes quedaba en `draft`, invisible incluso una vez cargado). Usuario pide ayuda para crear el proyecto Supabase paso a paso.
- 2026-09-22: Usuario crea el proyecto Supabase (`diablo_petorca_ligua`), aplica las 8 migraciones vía CLI (`supabase db push`) y corre el seed (`pnpm db:seed`), confirmado en vivo: ficha de "Escalera del Diablo" y de "Ruta del Diablo" cargan con datos reales y el badge "pendiente de verificación". Nota: `pnpm db:seed` fallaba porque el script no cargaba `.env.local` (a diferencia de `next dev`, un script suelto con `tsx` no pasa por la carga automática de env de Next.js) — se agrega `dotenv` para cargarlo explícitamente.
- 2026-09-22: Usuario aprueba avanzar con la Fase 1 completa. Se implementa: capa de datos (`listPlaces`, `listRoutes`, `listCommunes`, `listCategories`, `listTags`), componentes (`PlaceCard`, `RouteCard`, `ExploreFilters`, `ViewToggle`, `MapView` con marcadores/popup, `ShareButton`, `HomeSearchForm`, `EmptyState`), páginas completas (home, explorar con filtros+mapa, listado de rutas, fichas de lugar/ruta), estados de carga/error, y tests de integración. No se pudo probar visualmente desde el sandbox de esta sesión (sin egress de red hacia `supabase.co`, política de la organización) — el usuario compartió credenciales públicas (URL + publishable key) pero el build/typecheck/lint/tests corrieron localmente sin problema; falta que el usuario confirme visualmente en su máquina.
