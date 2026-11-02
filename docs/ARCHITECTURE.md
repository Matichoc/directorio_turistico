# Arquitectura — El diablo murió en Petorca y en La Ligua lo enterraron

Aplicación única Next.js 16 (App Router) con TypeScript, sin monorepo.
(Árbol revisado contra el código el 2026-11-01.)

## Capas

```
src/
├── app/
│   ├── [locale]/          interfaz pública (es/en), localizada con next-intl:
│   │                      inicio, explorar, lugares, pueblos, rutas,
│   │                      recorrido, informacion, privacidad
│   ├── admin/             panel administrativo, protegido por Supabase Auth
│   │                      (fuera de [locale]: sin i18n, sin bottom nav):
│   │                      lugares (+ CSV), rutas, pueblos, comunas-categorias,
│   │                      verificaciones, metricas, login
│   ├── api/               route handlers: analytics, place-photo (proxy de
│   │                      fotos de Google), directions (rutas por calle),
│   │                      trip/places
│   ├── manifest.ts        manifest PWA
│   ├── sitemap.ts / robots.ts
│   └── (public/sw.js)     service worker escrito a mano ("sin señal")
├── components/
│   ├── ui/                genéricos (nav, PageHero, íconos, fichas, auspicio)
│   ├── home/              portada (vuelo 3D, banner de municipios, buscador)
│   ├── explore/           /explorar (mapa por sectores, árbol, filtros)
│   ├── map/               MapLibre/react-map-gl (pines, sectores, ficha del jugador)
│   ├── place/             tarjetas/ficha de lugar (fotos, me gusta, comentarios)
│   ├── route/             tarjetas/detalle de ruta (checklist, navegación)
│   ├── trip/              UI de "Mi recorrido"
│   ├── admin/             formularios del panel
│   └── analytics/         TrackEvent
├── lib/
│   ├── data/              lectura de datos públicos (Supabase, RLS anon/auth)
│   ├── server/content/    server actions de escritura (contenido, verificación, comentarios)
│   ├── supabase/          clientes: browser, server (SSR/cookies), admin (service
│   │                      role), middleware; env.ts elige el esquema
│   ├── itinerary-engine/  módulo TS puro: build(input) → Itinerary
│   ├── maps/              estilo de mapa, relieve 3D, direcciones
│   ├── ui/                lógica de UI pura (árbol de explorar, sectores,
│   │                      escenas, gradientes por categoría)
│   ├── trip/, likes/, route-progress/, navigation/, session/
│   │                      estado del visitante (recorrido, me gusta,
│   │                      progreso de ruta, ficha, sesión anónima)
│   ├── http/              rate limit (en memoria, por instancia)
│   └── analytics/         nombres de evento + envío
├── i18n/                  routing/navigation/request config de next-intl
├── messages/              es.json / en.json
├── proxy.ts               middleware (Next 16 lo llama proxy): locale + sesión de /admin
└── types/                 database.ts (esquema) + domain.ts (modelos de UI)
```

## Flujo de datos

- **Esquema de la base**: todos los clientes (y los scripts) pasan por `supabaseDbOptions()` de `lib/supabase/env.ts`. En el proyecto compartido con Papudo (city_tour) usan `legacy`, y `public` se rechaza; en cualquier otro proyecto, `public`. Ver `docs/SUPABASE-LEGACY.md`. Abajo, "`admin_users`"/"`is_admin()`" son las de ese esquema (`legacy.*` en producción).
- **Lectura pública** (`lib/data/*`): usa `createPublicClient()` (`lib/supabase/public.ts`: anon key, **sin cookies**), sujeto a RLS, y cada consulta va envuelta en `cachedContent` (`lib/data/cache.ts`, etiqueta `contenido`, 5 min). Nunca usa el service role. Las consultas del panel (`listAdmin…`) siguen con el cliente "server" con sesión y sin caché.
- **Caché de páginas**: `[locale]/layout.tsx` exporta `revalidate = 300` (ISR); las fichas de ruta y de pueblo se generan al primer pedido (`generateStaticParams` vacío). Al guardar en el panel, `refreshPublicContent()` (`lib/server/content/refresh.ts`) borra la etiqueta `contenido` y las páginas. Diagnóstico y reglas en `docs/RENDIMIENTO.md`.
- **Escritura desde admin** (`lib/server/content/*`, server actions de `app/admin`): usa el mismo cliente "server" autenticado — el usuario admin debe estar en `admin_users` para que las políticas RLS permitan el insert/update.
- **Equipo del panel** (`lib/server/team.ts`, `/admin/personas`): invitar, cambiar rol, quitar y "link para cambiar clave" usan el cliente de servicio, solo después de revisar que quien lo pide tiene rol `admin`. Como Supabase Auth es compartido con Papudo, las invitaciones no salen por correo de Supabase (su link volvería a la URL del proyecto, que es la de Papudo): `auth.admin.generateLink` da un código de un solo uso y el panel arma un link propio a `/admin/aceptar`, que canjea el código (`verifyOtp`) y pide crear la clave. Quitar a alguien solo lo saca de `admin_users`: nunca se borra su cuenta.
- **Analítica**: `/api/analytics` usa el cliente normal (anon key; la RLS permite insert anónimo). **Seed**: usa el cliente "admin" (`lib/supabase/admin.ts`, service role), porque corre fuera de la app. `admin.ts` está marcado `server-only` para evitar que se filtre al bundle del navegador.
- **Visitante (me gusta, comentarios, Mi recorrido)**: sesión anónima real de Supabase Auth (`lib/session/visitor-session.ts`, `signInAnonymously()`). La RLS exige `user_id = auth.uid()`, así que el navegador lee y escribe lo suyo directo, sin cliente admin, y nadie puede enumerar recorridos ajenos (ver `docs/DATA-MODEL.md`, migración `0018`).

## i18n

- `next-intl` con `localePrefix: "always"` (`/es`, `/en`) y rutas localizadas por `pathnames` (p. ej. `/rutas` ↔ `/routes`).
- `src/proxy.ts` (en Next 16 el middleware se llama "proxy") combina el middleware de locale con el refresco de sesión de Supabase Auth para `/admin`, que queda excluido del ruteo por locale.
- El layout raíz (`app/layout.tsx`) **no** pone `<html>`: lo pone `HtmlShell` en `[locale]/layout.tsx` (con el idioma de la URL), en `admin/layout.tsx` y en el 404 raíz. Antes el raíz usaba `getLocale()`, que lee encabezados y dejaba todo el sitio sin caché (`docs/RENDIMIENTO.md`).

## SEO y compartir

`lib/seo.ts` es el único lugar que arma la metadata de una página pública (`buildPageMetadata`: título, descripción, canonical, hreflang, Open Graph/Twitter, `noIndex`). Cada página exporta `generateMetadata` y la llama; `app/layout.tsx` fija `metadataBase` y el título por defecto/plantilla. Las fichas de lugar, ruta y pueblo llevan además datos estructurados JSON-LD (`lib/seo-json-ld.ts` + `components/seo/json-ld.tsx`). `app/sitemap.ts` (todo el catálogo, todos los idiomas, siempre dinámico) y `app/robots.ts` salen de la misma fuente. La URL pública base sale de `NEXT_PUBLIC_SITE_URL` (o del dominio de Vercel como respaldo, `getSiteUrl`). Hasta el lanzamiento el sitio está oculto de los buscadores (`lib/site-indexing.ts`): `X-Robots-Tag: noindex` en toda respuesta, `<meta name="robots">` en cada página y el robots.txt sin sitemap; `SITE_INDEXING=on` en Production lo abre.

## Panel admin

- `app/admin/*` está protegido por `proxy.ts` → `lib/supabase/middleware.ts`, que redirige a `/admin/login` si no hay sesión, y cierra la sesión si la cuenta no está en `admin_users` (una sesión anónima de visitante no basta).
- Autorización fina (qué puede hacer un usuario autenticado) vive en RLS vía `is_admin()`, no solo en el middleware.

## Motor de itinerarios

`lib/itinerary-engine` no importa nada de `app/`, `components/` ni `lib/supabase/*`. Su única API pública es:

```ts
ItineraryEngine.build(input: ItineraryBuildInput): Itinerary
```

Implementación: con hasta `EXACT_ORDER_STOPS_LIMIT` paradas prueba todos los órdenes y usa el óptimo exacto; con más, vecino más cercano sobre distancia Haversine, con topes de paradas/duración. Es determinista y no depende del reloj del sistema, lo que la hace fácil de testear (`tests/unit/itinerary-engine.test.ts`) y reutilizable desde una futura interfaz conversacional sin cambios.

## PWA

Service worker **escrito a mano** en `public/sw.js` (desde 2026-11-01). Antes se usaba `Serwist` (`@serwist/next`), pero su plugin es de webpack y Next 16 compila con Turbopack: el build nunca generó `sw.js` y el sitio publicado no tenía service worker (`/sw.js` daba 404). Lo registra `ServiceWorkerRegister` (`components/offline/`) solo en producción (o con `NEXT_PUBLIC_SW_DEV=1`). Estrategias: páginas con red primero y copia guardada de respaldo (tope de 6 s) y `/offline.html` si no hay copia; `/_next/static` guardado para siempre; imágenes y mapa (OpenFreeMap) guardados al verse; `/api` y los datos RSC de Next siempre a la red. "Guardar para usar sin señal" (`OfflineSaveButton`, `lib/offline/plan.ts`) baja de antemano las páginas de una ruta o de Mi recorrido, sus archivos y el mapa de la zona (zooms 8–14). Al cambiar `sw.js`, subir su `VERSION`.

## Mapas

MapLibre GL 6 + `react-map-gl`, siempre cargado con `mapLib={loadMaplibre()}` (`lib/maps/maplibre.ts`): la v6 trae su worker en un archivo aparte y hay que darle la URL que genera el empaquetador, o el mapa base queda en blanco (lo que pasó con la v6 en septiembre, Riesgo #15 de `docs/PLAN.md`). Estilo resuelto por `NEXT_PUBLIC_MAP_STYLE_URL` (`lib/maps/config.ts`). Sin esa variable, usa OpenFreeMap "liberty" (gratis, sin API key), oscurecido con la clase `map-dark` para ir a juego con el sitio. El relieve del vuelo 3D del inicio se sirve desde el propio sitio (`public/terrain`, `lib/maps/terrain.ts`).

## Seguridad

Encabezados en `next.config.ts` (`SECURITY_HEADERS`): `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` y una CSP completa en modo informe (`Content-Security-Policy-Report-Only`) que se aplica de verdad compilando con `CSP_MODE=enforce`. Un dominio externo nuevo (imágenes, API llamada desde el navegador, estilo de mapa) hay que sumarlo a `CONTENT_SECURITY_POLICY`. Hallazgos y estado en `docs/AUDITORIA-2026-11-02.md`.
