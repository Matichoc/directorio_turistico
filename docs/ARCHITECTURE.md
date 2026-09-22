# Arquitectura — Petorca en Ruta

Aplicación única Next.js 16 (App Router) con TypeScript, sin monorepo.

## Capas

```
src/
├── app/
│   ├── [locale]/        interfaz pública (es/en), localizada con next-intl
│   ├── admin/            panel administrativo, protegido por Supabase Auth
│   │                      (fuera de [locale]: sin i18n, sin bottom nav)
│   ├── api/               route handlers (p. ej. /api/analytics)
│   ├── manifest.ts        manifest PWA
│   └── sw.ts               service worker (Serwist)
├── components/
│   ├── ui/                componentes genéricos (nav, selectores)
│   ├── map/                MapLibre/react-map-gl
│   ├── place/               tarjetas/ficha de lugar
│   ├── route/                tarjetas/detalle de ruta
│   └── itinerary/             UI de "mi recorrido"
├── lib/
│   ├── data/                lectura de datos públicos (Supabase, RLS anon/auth)
│   ├── server/content/       server actions de escritura (verificación, fuentes)
│   ├── supabase/               clientes: browser, server (SSR/cookies), admin (service role)
│   ├── itinerary-engine/        módulo TS puro: build(input) → Itinerary
│   ├── maps/                     config de proveedor de tiles
│   └── analytics/                  tracking de eventos anónimos
├── i18n/                     routing/navigation/request config de next-intl
├── messages/                  es.json / en.json
└── types/                      database.ts (esquema) + domain.ts (modelos de UI)
```

## Flujo de datos

- **Lectura pública** (`lib/data/*`): usa el cliente Supabase "server" (anon key + cookies de sesión), sujeto a RLS. Nunca usa el service role.
- **Escritura desde admin** (`lib/server/content/*`, futuras acciones de `app/admin`): usa el mismo cliente "server" autenticado — el usuario admin debe estar en `public.admin_users` para que las políticas RLS permitan el insert/update.
- **Analítica y seed**: usan el cliente "admin" (`lib/supabase/admin.ts`, service role), porque escriben sin sesión de usuario. `admin.ts` está marcado `server-only` para evitar que se filtre al bundle del navegador.
- **Itinerarios anónimos**: por diseño, RLS los deniega a `anon`/`authenticated` directamente (ver `docs/DATA-MODEL.md`). Cualquier lectura/escritura debe pasar por un server action que valide la sesión anónima (cookie/localStorage) antes de usar el cliente admin. Esto evita que cualquiera pueda enumerar itinerarios ajenos vía PostgREST.

## i18n

- `next-intl` con `localePrefix: "always"` (`/es`, `/en`) y rutas localizadas por `pathnames` (p. ej. `/rutas` ↔ `/routes`).
- `src/middleware.ts` combina el middleware de locale con el refresco de sesión de Supabase Auth para `/admin`, que queda excluido del ruteo por locale.
- El layout raíz (`app/layout.tsx`) obtiene el locale con `getLocale()` para fijar `<html lang>`, ya que debe cubrir tanto `[locale]` como `admin`/`api`.

## Panel admin

- `app/admin/*` está protegido por `middleware.ts` → `lib/supabase/middleware.ts`, que redirige a `/admin/login` si no hay sesión.
- Autorización fina (qué puede hacer un usuario autenticado) vive en RLS vía `public.is_admin()`, no solo en el middleware.

## Motor de itinerarios

`lib/itinerary-engine` no importa nada de `app/`, `components/` ni `lib/supabase/*`. Su única API pública es:

```ts
ItineraryEngine.build(input: ItineraryBuildInput): Itinerary
```

Implementación base (Fase 0): heurística de vecino más cercano sobre distancia Haversine, con topes de paradas/duración. Es determinista y no depende del reloj del sistema, lo que la hace fácil de testear (`tests/unit/itinerary-engine.test.ts`) y reutilizable desde una futura interfaz conversacional sin cambios.

## PWA

`Serwist` (no `next-pwa`) por mejor soporte de App Router y mantenimiento activo. Desactivado en desarrollo (`disable: process.env.NODE_ENV === "development"`).

## Mapas

MapLibre GL + `react-map-gl`, con el estilo de mapa resuelto por `NEXT_PUBLIC_MAP_STYLE_URL` (`lib/maps/config.ts`). Sin esa variable, usa el estilo demo gratuito de MapLibre — solo para desarrollo, no para producción.
