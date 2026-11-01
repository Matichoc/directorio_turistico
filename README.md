# El diablo murió en Petorca y en La Ligua lo enterraron

Directorio turístico y planificador de rutas para la provincia de Petorca (Chile).
Next.js 16 (App Router) + TypeScript + Tailwind + Supabase + next-intl (es/en).

Ver `docs/PLAN.md` para el plan completo por fases, `docs/ARCHITECTURE.md` para
la arquitectura y `docs/DATA-MODEL.md` para el esquema de base de datos.

## Requisitos

- Node.js 22+
- pnpm 10+
- Un proyecto de Supabase (para el panel admin y los datos; ver abajo)

## Primeros pasos

```bash
pnpm install
cp .env.example .env.local   # completa las variables de Supabase/mapas
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) — redirige a `/es`.

## Alcance: comuna de Petorca

Esta rama muestra solo la **comuna de Petorca**: la lista
`SITE_COMMUNE_SLUGS` (`src/lib/site-scope.ts`) filtra lugares, pueblos,
comunas y rutas al leerlos (una ruta entra solo si todas sus paradas son de
la comuna). La base no se toca. La versión con las 5 comunas de la provincia
queda en la rama `provincia-completa`; dejar la lista vacía también vuelve a
mostrar la provincia.

## Base de datos

**Producción (desde 2026-10-17):** el diablo vive en el esquema **`legacy`**
del proyecto de Supabase **city_tour** (`qbfvsnkywlvozvxeujgh`), que comparte
con el sitio de Papudo (dueño de `public`). El código elige `legacy` solo al
ver esa URL. Reglas, estado y cómo hacer cambios: `docs/SUPABASE-LEGACY.md`.

- **Nunca `supabase db push` contra ese proyecto**: aplicaría las migraciones
  en `public` (Papudo).
- Cambios de tablas: SQL con `legacy.` explícito en `supabase/manual/`,
  corrido a mano en el SQL Editor.
- `supabase/migrations/` queda como historial del esquema: sirve para armar
  una réplica local o un proyecto nuevo propio (ahí sí, `supabase db push`).

Datos actuales (2026-11-01): 5 comunas, 63 pueblos (todos con coordenada, 25
con resumen es/en), 4 categorías, 37 lugares publicados (36 verificados) con
168 fotos, 3 rutas (incluida "Ruta del Diablo") y 2 auspiciadores.

`pnpm db:seed` carga esos datos desde `scripts/seed.ts` (cada lugar con su
fuente pública en `sources`). Hace `upsert`: **pisa lo editado desde
`/admin`**, así que no se corre salvo que haga falta.

## Scripts

| Comando                                 | Descripción                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev`                              | Servidor de desarrollo                                                             |
| `pnpm build`                            | Build de producción                                                                |
| `pnpm start`                            | Sirve el build de producción                                                       |
| `pnpm lint`                             | ESLint                                                                             |
| `pnpm format` / `format:check`          | Prettier                                                                           |
| `pnpm typecheck`                        | `tsc --noEmit`                                                                     |
| `pnpm test` / `test:watch`              | Tests unitarios/integración (Vitest)                                               |
| `pnpm test:e2e`                         | Tests end-to-end (Playwright)                                                      |
| `pnpm db:seed`                          | Seed de lugares/rutas reales (pisa ediciones del admin, ver arriba)                |
| `pnpm export:content-gaps`              | CSV con lugares sin descripción larga o sin foto (lee la base real)                |
| `pnpm geocode:localities`               | Busca coordenadas de pueblos en Google Places (requiere `GOOGLE_PLACES_API_KEY`)   |
| `pnpm fetch:google-photos`              | Trae fotos de Google Places a lugares que no tienen                                |
| `python scripts/build-terrain-tiles.py` | Regenera el relieve del vuelo 3D (`public/terrain`, requiere `pip install pillow`) |

## Producción

- **CI:** `.github/workflows/ci.yml` corre typecheck, lint, tests, formato y build en cada PR.
- **Variable clave:** `NEXT_PUBLIC_SITE_URL` (dominio real) — de ahí salen el sitemap, los canonical y las vistas previas al compartir.
- **Supabase compartido con Papudo** (el diablo vive en el esquema `legacy`, Papudo en `public`): guía en `docs/SUPABASE-LEGACY.md`. El sitio elige el esquema solo (`NEXT_PUBLIC_SUPABASE_SCHEMA`); **nunca correr `supabase db push` contra ese proyecto**.
- **Dominio propio y un solo proyecto de Vercel:** guía paso a paso en `docs/DOMINIO.md` (NIC Chile, DNS, Vercel, Supabase, Search Console, correo y checklist final).
- **Sitio publicado:** `https://directorio-turistico-bgl3.vercel.app` (hay un segundo proyecto de Vercel por apagar; ver `docs/DOMINIO.md`).
- **Administración:** `/admin` (usuario en `legacy.admin_users` del proyecto compartido): lugares, rutas, pueblos, comunas/categorías, verificaciones por comuna, comentarios y métricas.
- **Hoja de ruta hacia la propuesta a turismo:** `docs/PLAN.md`, sección 10.
- **Diseño:** `docs/DESIGN.md` (tokens, componentes y patrones visuales).

## Estructura

Ver `docs/ARCHITECTURE.md`.
