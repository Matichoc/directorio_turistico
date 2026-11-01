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
│   └── sw.ts              service worker (Serwist)
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
- **Lectura pública** (`lib/data/*`): usa el cliente Supabase "server" (anon key + cookies de sesión), sujeto a RLS. Nunca usa el service role.
- **Escritura desde admin** (`lib/server/content/*`, server actions de `app/admin`): usa el mismo cliente "server" autenticado — el usuario admin debe estar en `admin_users` para que las políticas RLS permitan el insert/update.
- **Analítica**: `/api/analytics` usa el cliente normal (anon key; la RLS permite insert anónimo). **Seed**: usa el cliente "admin" (`lib/supabase/admin.ts`, service role), porque corre fuera de la app. `admin.ts` está marcado `server-only` para evitar que se filtre al bundle del navegador.
- **Visitante (me gusta, comentarios, Mi recorrido)**: sesión anónima real de Supabase Auth (`lib/session/visitor-session.ts`, `signInAnonymously()`). La RLS exige `user_id = auth.uid()`, así que el navegador lee y escribe lo suyo directo, sin cliente admin, y nadie puede enumerar recorridos ajenos (ver `docs/DATA-MODEL.md`, migración `0018`).

## i18n

- `next-intl` con `localePrefix: "always"` (`/es`, `/en`) y rutas localizadas por `pathnames` (p. ej. `/rutas` ↔ `/routes`).
- `src/proxy.ts` (en Next 16 el middleware se llama "proxy") combina el middleware de locale con el refresco de sesión de Supabase Auth para `/admin`, que queda excluido del ruteo por locale.
- El layout raíz (`app/layout.tsx`) obtiene el locale con `getLocale()` para fijar `<html lang>`, ya que debe cubrir tanto `[locale]` como `admin`/`api`.

## SEO y compartir

`lib/seo.ts` es el único lugar que arma la metadata de una página pública (`buildPageMetadata`: título, descripción, canonical, hreflang, Open Graph/Twitter, `noIndex`). Cada página exporta `generateMetadata` y la llama; `app/layout.tsx` fija `metadataBase` y el título por defecto/plantilla. `app/sitemap.ts` (todo el catálogo, ambos idiomas, siempre dinámico) y `app/robots.ts` salen de la misma fuente. La URL pública base sale de `NEXT_PUBLIC_SITE_URL` (o del dominio de Vercel como respaldo, `getSiteUrl`).

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

`Serwist` (no `next-pwa`) por mejor soporte de App Router y mantenimiento activo. Desactivado en desarrollo (`disable: process.env.NODE_ENV === "development"`).

## Mapas

MapLibre GL (fijado en v5, ver Riesgo #15 de `docs/PLAN.md`) + `react-map-gl`, con el estilo de mapa resuelto por `NEXT_PUBLIC_MAP_STYLE_URL` (`lib/maps/config.ts`). Sin esa variable, usa OpenFreeMap "liberty" (gratis, sin API key), oscurecido con la clase `map-dark` para ir a juego con el sitio. El relieve del vuelo 3D del inicio se sirve desde el propio sitio (`public/terrain`, `lib/maps/terrain.ts`).
