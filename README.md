# Petorca en Ruta

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

## Base de datos

Las migraciones viven en `supabase/migrations/`. Con el [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
pnpm db:seed   # datos demo (comunas, categorías, 3 rutas borrador, lugares "pendientes de verificación")
```

Todo el contenido del seed queda marcado explícitamente como pendiente de
verificación (`verification_status = 'pending'`, `publication_status = 'draft'`)
— no debe usarse en producción sin pasar por el flujo de verificación.

## Scripts

| Comando                        | Descripción                          |
| ------------------------------ | ------------------------------------ |
| `pnpm dev`                     | Servidor de desarrollo               |
| `pnpm build`                   | Build de producción                  |
| `pnpm start`                   | Sirve el build de producción         |
| `pnpm lint`                    | ESLint                               |
| `pnpm format` / `format:check` | Prettier                             |
| `pnpm typecheck`               | `tsc --noEmit`                       |
| `pnpm test` / `test:watch`     | Tests unitarios/integración (Vitest) |
| `pnpm test:e2e`                | Tests end-to-end (Playwright)        |
| `pnpm db:seed`                 | Seed de datos demo                   |

## Estructura

Ver `docs/ARCHITECTURE.md`.
