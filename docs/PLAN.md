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
7. ~~Aunque el seed usa lugares/rutas reales...~~ — resuelto: cada lugar/ruta del seed cita una fuente pública en `sources` (Wikipedia, Sernageomin, municipios, sitio oficial de Matichoc, etc.), así que `scripts/seed.ts` los marca `verification_status = 'verified'` y la ficha muestra el badge "Verificado". Sigue pendiente la verificación en terreno propiamente tal (horarios exactos, datos de contacto de algunos lugares) — el admin puede bajar el estado a `pending`/`outdated` si detecta un error.
8. Íconos PWA (`public/icons/icon-192.png`, `icon-512.png`) son placeholders pendientes de diseño final.
9. ~~Sin proyecto Supabase real conectado~~ — resuelto: el usuario creó el proyecto (`diablo_petorca_ligua`), aplicó las migraciones vía CLI y corrió el seed.
10. Sandbox de esta sesión sin salida de red hacia `supabase.co` (política de egress de la organización): no se pudo probar visualmente contra la base real desde el entorno de Claude Code; toda validación en vivo la hizo el usuario en su máquina. Si esto se repite, delegar la verificación visual al usuario o a CI con secretos propios.
11. `listPlaces`/`listRoutes` filtran `tagSlug`/`query` en memoria después de traer todos los lugares publicados (ver comentario en `lib/data/places.ts`) — válido mientras el catálogo sea pequeño (decenas de lugares); si crece, mover a filtros SQL/`!inner` dinámicos o paginar.
12. El selector de intención del home usa las 4 categorías reales del seed (naturaleza, gastronomía, cultura, playa) — se ajustó `home.intent` de "aventura" a "playa" para que coincida con datos reales en vez de una categoría inexistente.
13. El carrito de recorrido (`lib/trip/storage.ts`) vive solo en `localStorage` del navegador, sin sesión de servidor — es la interpretación pragmática de las tablas `itineraries`/`itinerary_stops` del esquema (aún sin poblar) mientras no exista auth de sesión anónima. Migrar a esas tablas cuando se implemente sesión anónima real.
14. La galería de fotos de cada lugar (`place_images` en el esquema) sigue mayormente sin poblar. Se cargaron 4 fotos reales: 3 con licencia libre desde Wikimedia Commons (Museo de La Ligua, Plaza de Armas de La Ligua, Iglesia La Merced de Petorca — ver `scripts/seed.ts`, `wikimediaFilePath()`) vía `Special:FilePath`, y 1 foto real de producto de Chocolatería Matichoc copiada desde el repo `matichoc/matiweb` a `public/fotos/chocolateria-matichoc/` (archivo estático local, servido directo por Next.js — más simple y confiable que hotlinkear un dominio externo variable). El resto de los lugares (34 en total tras sumar los de abajo) sigue mostrando la cabecera con gradiente por categoría. `place_images.storage_path` se está usando como URL/path completo (externo o `/fotos/...` local), no como path real de Supabase Storage — atajo pragmático mientras no exista un pipeline de subida propio. Existe `public/fotos/<slug>/` (con README) para que el usuario pegue fotos propias — una carpeta por cada lugar del catálogo.
15. `maplibre-gl` está fijado a `^5.24.0` en `package.json` a propósito (no subir a v6 sin más trabajo): la v6 cambió cómo se cargan los workers/tiles y el mapa queda completamente en blanco con `react-map-gl`, sin ningún error en consola — bug real detectado en esta sesión (el usuario probó en su máquina y ningún mapa se veía) y reportado por varios proyectos del ecosistema. Antes de subir de versión, seguir la guía de migración de MapLibre para configurar el worker con el bundler de Next.js/Turbopack y volver a probar visualmente.
16. El estilo de mapa se cambió de "positron" (gris/minimalista) a "liberty" (colores vivos) a pedido del usuario ("mapas... poco interactivos, se ven plomos feos"); además se rediseñaron los pines (`components/map/map-pin.tsx`): forma de gota con color e ícono por categoría, halo pulsante y animación de aparición. Sigue pendiente cualquier decoración temática adicional (mar/cordillera/diablo) que el usuario pida tras ver este cambio.
17. El zoom del mapa estaba fijo en `PETORCA_DEFAULT_ZOOM` (10, toda la provincia) para cualquier vista, incluida la ficha de un solo lugar — se veía "genérico" sin mostrar la ubicación real. Se corrigió: un solo marcador usa `PLACE_DETAIL_ZOOM` (15, nivel calle); 2+ marcadores usan `fitBounds` para encuadrar la extensión real de los lugares en vez de un zoom fijo.
18. Varios lugares del seed compartían exactamente las mismas coordenadas (el centro del pueblo/comuna usado como aproximación): Museo/Plaza/Matichoc en La Ligua, Iglesia/Casa natal Manuel Montt en Petorca, Pedegua/Ruta de los Túneles en Cabildo. Se separaron con pequeños ajustes manuales (nudges) documentados en `scripts/seed.ts` — siguen siendo aproximados, no geocodificación exacta; de paso se corrigió la dirección de la Casa natal de Manuel Montt (845, no 835) con una fuente más autorizada (Consejo de Monumentos Nacionales).
19. El usuario pasó coordenadas GPS exactas (tomadas de Google Maps) para 5 lugares existentes cuyas coordenadas eran nudges/aproximaciones nuestras (Museo de La Ligua, Plaza de Armas de La Ligua, Iglesia La Merced de Petorca, Escalera del Diablo, Pedegua) — se reemplazaron por las exactas, y `ruta-de-los-tuneles` se reubicó en el punto de acceso real (Pedegua). Además pidió sumar ~23 lugares/sectores nuevos con coordenadas exactas, ya investigados y creados en `scripts/seed.ts`: Valle Hermoso, Área de los Dulces, La Chorreada, Los Molles y Pichicuy (La Ligua); Salinas de Pullally, Playa Los Lilenes, Costanera, Plaza y Paseo El Conquistador (Papudo); Laguna, Cachagua/Las Cujas y Catapilco/Palos Quemados (Zapallar); Plaza, Alicahue, San Lorenzo, La Vega y Túnel La Grupa (Cabildo); Puente Pedegua, Túnel Las Palmas, Plaza y Petroglifos de Chincolco (Petorca). Notas: (a) "La Chorreada" no tiene fuente sólida encontrada — descripción honesta y mínima, fuente débil (Instagram); (b) Túnel Las Palmas queda geográficamente en la comuna de Los Vilos (Región de Coquimbo), no en la provincia de Petorca — se asignó a la comuna Cabildo de nuestro catálogo por ser parte del mismo corredor ferroviario histórico, documentado en el código.
20. ~~Cobertura de fotos reales para los ~30 lugares sin foto curada a mano~~ — resuelto en su mayoría: el usuario eligió Google Places API (New) (Text Search + Place Photo media) en vez de Unsplash (conector encontrado incompleto/sin fotos) o seguir buscando en Wikimedia Commons. `GOOGLE_PLACES_API_KEY` nunca se expone al navegador: `src/app/api/place-photo/route.ts` hace streaming del binario server-side, y `scripts/fetch-google-photos.ts` (que corre el usuario localmente, con su propio proyecto de Google Cloud/GSuite con facturación habilitada) busca y guarda solo en lugares que **no** tenían ya una foto en `place_images` — esto protegió automáticamente las 4 fotos curadas a mano sin necesitar una lista de exclusión. El usuario lo corrió y confirmó: 26 fotos agregadas, 4 lugares sin resultado en Google (probablemente sectores/localidades menores sin ficha propia en Google Maps, no lugares con nombre incorrecto — pendiente de identificar cuáles si el usuario quiere cubrirlos a mano) y 0 errores. Bug real encontrado al probar en vivo: `/explorar`, `/` y la ficha de cualquier lugar con foto nueva de Google tiraban `Error: Image with src "/api/place-photo?ref=...&w=..." is using a query string which is not configured in images.localPatterns` (500 en la ficha, error boundary genérico en las demás) — cambio de breaking en Next 16 (`AGENTS.md`/`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`): las imágenes locales (mismo origen) con query string ahora requieren declarar `images.localPatterns` en `next.config.ts`, igual que `remotePatterns` para dominios externos, para evitar ataques de enumeración. Se agrega `localPatterns: [{ pathname: "/api/place-photo" }]` (sin `search`, para permitir cualquier query en esa ruta — la propia ruta ya valida `ref` y acota `w` antes de llamar a Google). Segundo bug relacionado, detectado también en vivo: declarar `localPatterns` convierte a `next/image` de "permite cualquier imagen local sin query string" a "solo permite lo listado ahí" — rompió la foto local de Chocolatería Matichoc (`/fotos/chocolateria-matichoc/tableta.jpg`, que no tiene query string pero tampoco estaba en la lista). Se agrega también `{ pathname: "/fotos/**", search: "" }`. Además se achica la cabecera de foto de `aspect-ratio` (crecía junto al ancho de pantalla, se veía "gigante" en monitores anchos aunque la foto fuera real y estuviera bien encuadrada — feedback repetido) a un alto fijo (`h-48 sm:h-64`). Confirmado visualmente por el usuario: la foto real de Playa de Papudo carga y se ve bien encuadrada.

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
- [x] Ficha de lugar completa (dirección, teléfono, sitio web, tags, mapa embebido en la misma página, compartir con Web Share API + fallback a copiar enlace, badge de verificación, botón "agregar a mi recorrido")
- [x] Ficha de ruta completa (duración, lista de paradas enlazadas a cada lugar, mapa embebido con todas las paradas, botón "agregar ruta completa" al recorrido)
- [x] Recorrido (`/recorrido`): carrito de lugares en `localStorage`, arma el itinerario real vía `ItineraryEngine.build` (orden por vecino más cercano, distancia y tiempo estimados), mapa con las paradas ordenadas
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
- 2026-09-22: PR de Fase 1 mergeado y confirmado por el usuario. Pide interacción completa "en la misma web" (sin salir a Google Maps), el link real de Matichoc (matichoc.cl), datos marcados como validados, opción de armar itinerario, banner de auspicio más visual, y mejor UI/UX general. Se investigan y suman 3 lugares reales más (pedido explícito del usuario): Chocolatería Matichoc (La Ligua, con dirección/teléfono/sitio real de matichoc.cl), Pedegua (Cabildo, antigua estación de ferrocarril) y Ruta de los Túneles (línea férrea Cabildo–Pedegua con 5 túneles y 2 puentes, incluido el túnel Las Palmas de 1914) — cada uno con fuente pública citada en `sources`; coordenadas sin geocodificación exacta se calcularon desde la referencia UTM publicada por la fuente. Todos los lugares/rutas del seed pasan de `verification_status = 'pending'` a `'verified'` (tienen fuente citada). Se implementa: mapa embebido (MapLibre + OpenFreeMap, estilo "positron" gratuito sin API key, reemplaza el estilo demo anterior) en fichas de lugar/ruta en vez de link externo a Google Maps; carrito de recorrido en `localStorage` (`lib/trip/storage.ts`) con botones "agregar a mi recorrido"/"agregar ruta completa" que emiten los eventos de analítica ya definidos (`place_added_to_trip`/`route_added_to_trip`); página `/recorrido` que arma el itinerario real vía `ItineraryEngine.build` (ya existía el motor puro, sin UI) mostrando orden, distancia y tiempo estimados sobre un mapa; banner de Matichoc rediseñado (tarjeta visual con logo/gradiente, link real a matichoc.cl, Instagram opcional solo si se configura — no se inventó una cuenta sin verificar); paleta de acento (terracota) + iconos SVG propios en nav inferior y categorías; rediseño visual de home (hero con gradiente, selector de intención como tiles con ícono), tarjetas de lugar/ruta y filtros. Bug real encontrado y corregido en el camino: `/rutas/[slug]` devolvía HTTP 200 en vez de 404 para una ruta inexistente — causado por `rutas/loading.tsx` (Suspense a nivel de segmento) haciendo que Next.js comprometa el status 200 al empezar a transmitir el skeleton antes de que `notFound()` se resuelva; se corrigió moviendo el listado (`rutas/page.tsx` + `loading.tsx`) a un route group `rutas/(list)/` que no envuelve a `rutas/[slug]`, sin cambiar las URLs. `pnpm typecheck`/`lint`/`test`/`build` verdes; smoke test con `curl` contra el dev server confirma códigos HTTP correctos en todas las rutas nuevas y existentes (imposible probar contra datos reales por el mismo bloqueo de red de siempre — falta confirmación visual del usuario).
- 2026-09-22: Usuario prueba localmente y reporta mapas "poco interactivos... plomos feos" y "no muestra bien los lugares... muestra algo genérico"; pide más "dinamismo" y ofrece habilitar herramientas si hace falta. Se detecta y corrige un bug real: `maplibre-gl` estaba en v6, que rompe la carga de tiles con `react-map-gl` sin ningún error visible (bug conocido del ecosistema) — se fija a `^5.24.0`. Se cambia el estilo de mapa de "positron" a "liberty" (más colorido) y se rediseñan los pines (forma de gota, color/ícono por categoría, halo pulsante, animación de aparición). Se corrige el zoom fijo en vista de toda la provincia (se veía "genérico" en la ficha de un lugar): ahora un solo marcador usa zoom de nivel calle y 2+ marcadores usan `fitBounds`. Se detectan y corrigen varios lugares con coordenadas idénticas (apiladas en un mismo pin) con nudges manuales documentados. Usuario manda captura mostrando una foto real de Wikimedia Commons (Iglesia La Merced) recortada casi todo cielo — causa: franja de altura fija con `object-cover` sobre una foto en formato retrato; se corrige a `aspect-ratio` responsivo + `object-position` sesgado hacia abajo. Usuario conecta Unsplash pero prefiere fotos reales; comparte el repo `matichoc/matiweb` para fotos de Matichoc (se usa `tableta.jpg`, foto real de producto, copiada a `public/fotos/chocolateria-matichoc/`) y pide una carpeta para ir pegando fotos de ~23 lugares/sectores nuevos — se crea `public/fotos/<slug>/` con README. Usuario pasa coordenadas GPS exactas (de Google Maps) para 5 lugares existentes (reemplazando nudges/aproximaciones) y para los ~23 lugares/sectores nuevos, todos investigados y creados en el seed con fuente citada (Wikipedia, municipios, Consejo de Monumentos Nacionales, Sitrural, etc.) — el catálogo pasa de 12 a 34 lugares. `pnpm typecheck`/`lint`/`test`/`build`/`format:check` verdes en cada entrega; como siempre, no se pudo confirmar visualmente desde este sandbox (sin egress hacia `supabase.co`) — falta que el usuario corra `pnpm db:seed` y confirme en su máquina.
- 2026-09-22: Usuario reporta que las imágenes se ven "muy grandes" y no se ven bien en pantalla. Causa real: las fotos se mostraban con `<img>` plano, que descarga el archivo a tamaño completo (varios MB en una foto de celular sin comprimir) y lo achica solo con CSS — pesado y desproporcionado, sobre todo en mobile. Se migra `PhotoOrIcon` a `next/image` (`fill` + `sizes` por contexto: 100vw en la ficha de lugar, grilla responsiva en las tarjetas), que sirve un tamaño acorde a la pantalla del visitante y optimiza el formato — verificado en el sandbox: la misma foto de Matichoc baja de 132 KB a 44 KB en la variante w=640. Se agrega `commons.wikimedia.org` a `images.remotePatterns` en `next.config.ts` para que el optimizador de Next.js pueda procesar también las fotos hotlinkeadas de Wikimedia Commons. De paso se reduce el alto de la cabecera de foto en mobile (`aspect-[4/3]` → `aspect-[3/2]`): con el `aspect-ratio` más alto de la sesión anterior (para no recortar fotos verticales) la foto terminaba dominando la pantalla en mobile.
- 2026-09-22: Usuario pregunta si se pueden usar directo las fotos que muestra Google Maps en las coordenadas dadas. Se explica que no es posible sin API key propia + facturación (ToS de Google prohíbe scraping/rehosting permanente). El usuario responde "hagamos lo más económico y woow posible" — se evalúa Unsplash primero (gratis, ya lo tenía "conectado"), pero `ListConnectors` muestra el conector en estado `connect_incomplete`/sin fotos reales; el usuario corrige y pide seguir con Google Places, indicando que tiene cuenta GSuite propia para habilitar facturación. Se investiga el pricing vigente (2026): el crédito universal de US$200/mes se retiró en 2025, reemplazado por cuotas gratis mensuales por función (Places: ~5.000-10.000 llamadas gratis/mes) — para 34 lugares el costo esperado es US$0, pero igual requiere tarjeta asociada. Usuario pide guía paso a paso para Google Cloud Console. Se construye la integración: `src/app/api/place-photo/route.ts` (proxy que hace streaming de la foto usando `GOOGLE_PLACES_API_KEY` server-side, nunca expuesta al navegador, con `Cache-Control` corto) y `scripts/fetch-google-photos.ts` (script que el usuario corre localmente — el sandbox no tiene salida de red hacia Google — que busca vía Text Search el lugar más cercano a las coordenadas de cada `place` sin foto en `place_images` y guarda la referencia de la primera foto encontrada con su atribución; nunca toca lugares que ya tienen foto, protegiendo así automáticamente las 4 curadas a mano sin lista de exclusión hardcodeada). Se agrega `pnpm fetch:google-photos` y `GOOGLE_PLACES_API_KEY` a `.env.example`. `pnpm typecheck`/`lint`/`test`/`build`/`format:check` verdes. PR mergeado. El usuario reporta que la ficha se veía "gigante" y sin foto en lugares que todavía no tenían ninguna (esperado hasta correr el script) — se ajusta `PlacePhotoHero` para usar una altura fija chica en vez de `aspect-ratio` cuando no hay foto real, en vez del mismo alto que una foto real. El usuario completa el setup de Google Cloud y corre `pnpm fetch:google-photos`: 26 fotos agregadas, 4 lugares sin resultado en Google, 0 errores — confirmado por el usuario, falta solo verificación visual de cómo se ven las fotos nuevas en la ficha.
- 2026-09-22: Usuario prueba en vivo y reporta `/explorar`, `/` y varias fichas rotas con `images.localPatterns`. Se corrige en dos rondas (ver PR #13): falta declarar `/api/place-photo` (query string) y, al agregar esa entrada, se rompe la foto local de Matichoc porque declarar `localPatterns` pasa de "toda imagen local sin query permitida" a "solo lo listado" — se agrega también `/fotos/**`. Además se cambia `PlacePhotoHero` de `aspect-ratio` a alto fijo (`h-48 sm:h-64`): con aspect-ratio el alto crecía junto al ancho de pantalla y en ventanas de escritorio anchas la foto se veía "gigante" aunque fuera una foto real bien encuadrada. El usuario notaba el mismo problema probando en una ventana de Chrome de escritorio sin emular mobile — se le indica usar el modo dispositivo de DevTools (Ctrl+Shift+M) ya que el sitio es mobile-first sin ancho máximo en desktop. Confirmado: Playa de Papudo carga con foto real bien encuadrada. De paso, el usuario pide ajustes de contenido a dos rutas existentes: "Ruta Costera: Papudo y Zapallar" suma Los Molles y Pichicuy (tramo costero de La Ligua) como paradas; "Ruta del Diablo" se reordena para partir en Pedegua (estación y puente — "donde el diablo perdió el poncho") y terminar en los petroglifos de Chincolco, pasando por la Escalera del Diablo y la Iglesia La Merced de Petorca (se sacan Casa natal de Manuel Montt y Museo de La Ligua de las paradas, no mencionadas en la ruta pedida). `pnpm typecheck`/`lint`/`test`/`build`/`format:check` verdes en cada entrega.
- 2026-09-22: Usuario pide empezar a planificar la próxima versión: (1) más de una foto por lugar (4-5, sin selector de portada todavía) y (2) "dinámicas" para las rutas — checklist de paradas, efecto visual al seleccionar la ruta, animaciones, destacar comida en categoría gastronomía, y un mapa interactivo en movimiento tipo Waze/Google Maps. Se implementa (1): `scripts/fetch-google-photos.ts` reescrito para completar cada lugar hasta `TARGET_PHOTOS_PER_PLACE = 5` fotos (antes solo guardaba 1), administrando únicamente las filas cuyo `storage_path` empieza con el prefijo del proxy de Google (se identifican así, no por lista de slugs) — en cada corrida las reemplaza por una búsqueda fresca, y nunca toca ni cuenta las fotos curadas a mano (Wikimedia/`/fotos/` local), que siguen en posición 0 con las de Google agregándose después. El punto 2 queda pendiente de priorizar con el usuario antes de construir (ver mensaje siguiente): el mapa tipo Waze es un desarrollo grande aparte de las demás piezas (checklist, animaciones, etc.), que son más chicas e independientes entre sí. Usuario elige "primero lo chico, mapa después". Se implementan las piezas chicas: checklist de paradas marcables por ruta (`lib/route-progress/storage.ts`, mismo patrón que el carrito de recorrido — solo `localStorage`, sin backend), con barra de progreso, halo pulsante (`animate-route-glow`) en la próxima parada por visitar, y mensaje de felicitación al completar; animaciones de entrada escalonada (`animate-stop-in`) y rebote al marcar (`animate-check-pop`) en `globals.css`; brillo/glow en `RouteCard` al pasar el mouse; insignia de categoría (ícono + nombre, color por categoría) sobre la foto en `PlaceCard`/`PlacePhotoHero` para que gastronomía (y las demás) se distingan a simple vista. Bug real encontrado y corregido de paso: `CategoryIcon` recibía el _slug_ de categoría (`"gastronomia"`) donde esperaba un _nombre de ícono_ (`"utensils"`) en `map-pin.tsx`, `map-view.tsx` y `photo-or-icon.tsx` — como ninguna coincidía, siempre mostraba el ícono por defecto (landmark) sin importar la categoría real; se agrega `getCategoryIcon()` en `lib/ui/category-gradient.ts` y se corrigen los 3 llamadores. `pnpm typecheck`/`lint`/`test`/`build`/`format:check` verdes.
- 2026-09-22: Usuario prueba de nuevo y reporta que no ve más fotos ni las rutas actualizadas — pendiente de que corra `pnpm fetch:google-photos` y `pnpm db:seed` localmente (los cambios de la sesión anterior no se aplican solos a su base Supabase). De paso pide más contenido en las rutas: "Ruta Costera: Papudo y Zapallar" suma Salinas de Pullally (Papudo); "Ruta Patrimonial: La Ligua y Cabildo" se reemplaza por completo — de plaza/museo de La Ligua pasa a La Chorreada (La Ligua) + Cerro Chache, San Lorenzo, Alicahue y La Vega (interior cordillerano de Cabildo). `pnpm typecheck`/`lint`/`test`/`format:check` verdes.
- 2026-09-22: Usuario corre `pnpm db:seed` y `pnpm fetch:google-photos` con éxito: 30 lugares actualizados, 143 fotos agregadas, 4 sin resultado en Google (Salinas de Pullally, Costanera de Papudo, Paseo El Conquistador, San Lorenzo). El usuario, conocedor del terreno, da alternativas de búsqueda para 3 de los 4: Pullally → laguna/playa Las Salinas; Costanera de Papudo → Playa Grande; San Lorenzo → el puente (más fácil de encontrar en Google que el pueblo). Se agrega `SEARCH_QUERY_OVERRIDES` en `fetch-google-photos.ts` (mapa slug → texto de búsqueda alternativo) para esos 3; queda pendiente Paseo El Conquistador, para el que el usuario dice tener una referencia sacada directo de Google Maps pero no la compartió todavía. `pnpm typecheck`/`lint`/`test`/`format:check` verdes.
- 2026-09-22: Usuario pide reemplazar "Paseo El Conquistador" por Punta Pite (sendero costero entre Papudo y Zapallar diseñado por la paisajista Teresa Moller, 2004-2006, con piscinas naturales y avistamiento de pingüinos de Humboldt). Investigado vía WebSearch (Wikiloc/Wikiexplora/OpenStreetMap/teresamoller.cl bloqueados desde el sandbox, igual que siempre); el usuario provee las coordenadas exactas del acceso desde Google Maps. Se agrega como lugar nuevo `zapallar-punta-pite` (comuna Zapallar, la más citada en las fuentes) y se detecta un gap real en `scripts/seed.ts`: el script nunca borraba lugares sacados del array (solo hace upsert), así que cambiar de slug dejaba huérfano el lugar viejo publicado en la base — se agrega `REMOVED_PLACE_SLUGS` + `removePlaces()`, corrido después de `seedRoutes()` para evitar el `ON DELETE RESTRICT` de `route_stops.place_id` por si alguna ruta lo referenciara todavía. Se renombra la carpeta de staging en `public/fotos/` y se actualiza su README. `pnpm typecheck`/`lint`/`test`/`build`/`format:check` verdes.
