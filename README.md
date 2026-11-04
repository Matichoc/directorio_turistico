# El diablo murió en Petorca

Guía turística de la **comuna de Petorca** (Región de Valparaíso, Chile): sus
pueblos, lugares, rutas, fiestas y la leyenda del diablo que le da nombre,
con datos reales y sus fuentes. Funciona en el celular como una app (se
instala desde el navegador y sirve sin señal en el valle) y en el computador.

- **Sitio publicado:** <https://directorio-turistico-bgl3.vercel.app> (oculto
  de Google hasta el lanzamiento).
- **Panel del equipo:** `/admin` en el mismo sitio.
- **Hecho por** Matichoc (desarrollo: Cristóbal Roco).

**Contenido** (2026-11-04):

- 17 pueblos (6 con resumen).
- 20 lugares publicados (39 fotos).
- 2 rutas: "Donde el Diablo perdió el poncho" y la ruta ferroviaria Pedegua – Las Palmas.
- 7 fiestas y eventos con fuente.
- 4 reportajes de TV y 2 auspiciadores.
- 3 idiomas: español, inglés y portugués.

---

## Índice

1. [Cómo se usa (visitantes)](#1-cómo-se-usa-visitantes)
2. [Cómo se administra (equipo)](#2-cómo-se-administra-equipo)
3. [Parte técnica](#3-parte-técnica)
4. [Documentación](#4-documentación)

---

## 1. Cómo se usa (visitantes)

Guía completa, pantalla por pantalla: [`docs/GUIA-USO.md`](docs/GUIA-USO.md).

| Sección          | Qué hay                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Inicio**       | Buscador, vuelo 3D por el relieve real de la comuna, la leyenda, los reportajes de TV, "Qué pasa en Petorca" (próximas fiestas), postales por categoría, Municipalidad y rutas |
| **Explorar**     | Mapa (o listado) con todos los lugares y pueblos; pestañas por categoría y filtros                                                                                             |
| **Rutas**        | Rutas con paradas en orden, guía paso a paso por calle (con voz) y mapa                                                                                                        |
| **Mi recorrido** | Tu propio recorrido: suma lugares y rutas, ordénalos, guárdalos sin señal y compártelos por link                                                                               |
| **Más**          | Eventos ("Qué pasa en Petorca"), La leyenda del diablo, Información (y "Panel del equipo" si iniciaste sesión en el panel)                                                     |

Lo que hace distinto al sitio:

- **Funciona sin señal.** En cada ruta y en Mi recorrido, "Guardar para usar
  sin señal" baja las páginas, las paradas y el mapa de la zona.
- **Guía paso a paso.** "Iniciar guía" te lleva por calle hasta la próxima
  parada, a pie o en auto, con voz. A pie también puedes usar la cámara con
  una flecha.
- **Escuchar.** Las fichas de lugar, ruta y pueblo, la leyenda y los eventos
  se leen en voz alta.
- **Tres idiomas.** Botones ES · EN · PT, arriba.
- **Todo con fuente.** Cada lugar, resumen, evento y leyenda cita de dónde
  sale. Las ilustraciones del diablo están hechas con IA y lo dicen
  ("Ilustración con IA"); las fotos de lugares son reales.

## 2. Cómo se administra (equipo)

Guía del panel, qué se edita y qué no: [`docs/GUIA-PANEL.md`](docs/GUIA-PANEL.md).

- **Entrar:** `/admin` con correo y clave. Roles: **Administrador** (todo,
  incluso invitar personas) y **Editor** (contenido).
- **Se edita en el panel:**
  - lugares (varias categorías, características y carga por CSV);
  - rutas y sus paradas;
  - pueblos (resumen y fuente);
  - eventos;
  - verificaciones y comentarios de visitantes;
  - métricas;
  - personas del equipo, registro de cambios y tu cuenta.
- **No se edita en el panel** (se pide a quien desarrolla):
  - textos fijos de las páginas;
  - fotos de los lugares;
  - auspiciadores;
  - arte del diablo;
  - categorías nuevas.
- **Dos ambientes:** lo que edites en el panel de **desarrollo** (franja
  amarilla arriba) no pasa a producción. El contenido real se edita en el
  sitio publicado.

## 3. Parte técnica

### Stack

| Pieza                | Qué se usa                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Aplicación           | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript                                     |
| Estilos              | Tailwind CSS 4; tokens y animaciones en `src/app/globals.css`                                  |
| Idiomas              | next-intl (`/es`, `/en`, `/pt`, rutas traducidas)                                              |
| Base de datos y auth | Supabase (Postgres + RLS + Auth), esquema `legacy` del proyecto compartido **city_tour**       |
| Mapas                | MapLibre GL 6 + react-map-gl; mapa base OpenFreeMap; relieve 3D servido desde `public/terrain` |
| Guía por calle       | OSRM (OpenStreetMap) vía `/api/ruta`                                                           |
| Fotos de Google      | Places API (New) vía el proxy `/api/place-photo`                                               |
| Sin señal            | Service worker propio (`public/sw.js`)                                                         |
| Pruebas              | Vitest + Testing Library (unitarias e integración), Playwright (punta a punta)                 |
| Hosting              | Vercel (proyecto `directorio-turistico-bgl3`)                                                  |

### Requisitos

- Node.js 22+ y pnpm 10+.
- Acceso al proyecto de Supabase (o uno propio: ver "Base de datos").

### Primeros pasos

```bash
pnpm install
```

```bash
cp .env.example .env.local
```

```bash
pnpm dev
```

Abre <http://localhost:3000> (redirige a `/es`). Sin variables de Supabase el
sitio igual compila y se ve, pero vacío.

### Variables de entorno

Todas están explicadas en [`.env.example`](.env.example).

| Variable                                                     | Para qué                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Conexión a Supabase                                                                           |
| `SUPABASE_SERVICE_ROLE_KEY`                                  | Solo servidor y scripts: invitar personas al panel, seed. Secreta                             |
| `NEXT_PUBLIC_SUPABASE_SCHEMA`                                | Vacía en producción (elige `legacy` solo). `legacy_dev` en desarrollo y en las vistas previas |
| `NEXT_PUBLIC_SITE_URL`                                       | Dominio público: sitemap, canonical, vistas previas al compartir                              |
| `SITE_INDEXING`                                              | `on` el día del lanzamiento (solo Production) para aparecer en Google                         |
| `NEXT_PUBLIC_MAP_STYLE_URL`                                  | Estilo de mapa propio (vacío = OpenFreeMap, oscurecido)                                       |
| `GOOGLE_PLACES_API_KEY`                                      | Fotos de Google de los lugares (proxy y script). Secreta                                      |
| `ROUTING_OSRM_WALK_URL` / `ROUTING_OSRM_CAR_URL`             | Servidor OSRM propio para la guía (vacío = servidores públicos)                               |
| `CSP_MODE`                                                   | `enforce` aplica la política de contenido completa (por defecto, solo informa)                |

### Ambientes y flujo de trabajo

| Ambiente     | Rama          | Link                                                        | Datos                                     |
| ------------ | ------------- | ----------------------------------------------------------- | ----------------------------------------- |
| Producción   | `main`        | `directorio-turistico-bgl3.vercel.app`                      | `legacy` (reales)                         |
| Desarrollo   | `develop`     | `directorio-turistico-bgl3-git-develop-matichoc.vercel.app` | `legacy_dev` (copia, con franja amarilla) |
| Vista previa | rama de un PR | el link que deja Vercel en el PR                            | `legacy_dev`                              |

El flujo es: rama → PR a `develop` → probar en desarrollo → PR de `develop` a
`main`. Nada pasa a `main` sin el visto bueno del dueño del proyecto.
Detalles en [`docs/DESARROLLO.md`](docs/DESARROLLO.md).

**Antes de cada push** pasan cinco chequeos, los mismos que corre la CI
(`.github/workflows/ci.yml`):

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm format:check
```

### Base de datos

El diablo vive en el esquema **`legacy`** del proyecto Supabase **city_tour**,
que comparte con el sitio de Papudo (dueño de `public`). Guía completa:
[`docs/SUPABASE-LEGACY.md`](docs/SUPABASE-LEGACY.md).

- **Nunca correr `supabase db push` contra city_tour**: escribiría en `public`
  (Papudo). Tampoco leer ni escribir en `public`.
- **Cambios de tablas o de datos:** se hacen con un SQL en
  `supabase/manual/`. Cada uno nombra el esquema explícito, se aplica a
  `legacy` y a `legacy_dev`, se puede repetir y corre en una sola transacción.
  Lo corre a mano el dueño del proyecto, en el SQL Editor. El índice de cada
  script está en `docs/SUPABASE-LEGACY.md`.
- **Orden al subir archivos nuevos:** si un SQL apunta a un archivo nuevo de
  `public/` (una portada, por ejemplo), se corre **después** de que ese
  archivo esté en producción. Si se corre antes, la imagen sale rota.
- **`supabase/migrations/`:** es el historial del esquema, para armar una
  réplica o un proyecto propio. Solo ahí sirve `supabase db push`.
- **Modelo de datos:** [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md).

### Scripts

| Comando                                         | Para qué                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm dev` / `build` / `start`                  | Desarrollo, build y servir el build                                                                     |
| `pnpm typecheck` / `lint` / `test`              | Chequeo de tipos, ESLint, Vitest                                                                        |
| `pnpm format` / `format:check`                  | Prettier                                                                                                |
| `pnpm test:e2e`                                 | Playwright (punta a punta)                                                                              |
| `pnpm db:seed`                                  | Carga `scripts/seed.ts`. **Pisa lo editado en el panel**: no se corre salvo que haga falta              |
| `pnpm export:content-gaps`                      | CSV de lugares sin descripción larga o sin foto                                                         |
| `pnpm geocode:localities`                       | Coordenadas de pueblos desde Google Places                                                              |
| `pnpm fetch:google-photos`                      | Fotos de Google para lugares sin foto                                                                   |
| `node scripts/build-brand-png.mjs`              | Integra el arte: revisa tamaños (`--check`), pasa a WebP, arma íconos, logo web e imagen para compartir |
| `node scripts/capture-flyover-poster.mjs <url>` | Regenera la imagen fija del vuelo 3D                                                                    |
| `python scripts/build-terrain-tiles.py`         | Regenera el relieve 3D (`public/terrain`)                                                               |

### Estructura (resumen)

```
src/
├── app/[locale]/   páginas públicas: inicio, explorar, lugares, pueblos, rutas,
│                   recorrido, eventos, leyenda, informacion, privacidad
├── app/admin/      panel (lugares, rutas, pueblos, eventos, verificaciones,
│                   métricas, personas, registro, cuenta)
├── app/api/        analytics, place-photo, ruta (OSRM), trip
├── components/     interfaz por área (ui, home, explore, map, place, route,
│                   events, legend, video, trip, offline, admin…)
├── lib/            datos (data/), escritura del panel (server/), Supabase,
│                   mapas, guía, recorrido, eventos, SEO, lógica de UI pura
├── messages/       textos fijos es.json / en.json / pt.json
└── types/          tipos de la base y del dominio
supabase/manual/    SQL que se corre a mano (fuente de los cambios en city_tour)
supabase/migrations/ historial del esquema
scripts/            seed, fotos, relieve, arte
public/             fondos, leyendas, rutas, eventos, brand, terrain, sw.js
tests/              unit/, integration/, e2e/
```

El detalle de cada capa y del flujo de datos está en
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Alcance: solo la comuna de Petorca

El alcance lo define `SITE_COMMUNE_SLUGS` (`src/lib/site-scope.ts`), que
filtra todo al leerlo; la base no se toca. Una ruta entra solo si todas sus
paradas son de la comuna. La versión con las 5 comunas de la provincia está
en la rama `provincia-completa`. Dejar la lista vacía vuelve a mostrar la
provincia.

## 4. Documentación

| Documento                                                                    | Para quién        | Qué tiene                                                                  |
| ---------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| [`docs/GUIA-USO.md`](docs/GUIA-USO.md)                                       | Cualquiera        | Cómo se usa el sitio, pantalla por pantalla                                |
| [`docs/GUIA-PANEL.md`](docs/GUIA-PANEL.md)                                   | Equipo del panel  | Qué se edita y qué no, roles, rutina, guion para mostrarlo                 |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                               | Desarrollo        | Capas, flujo de datos, caché, i18n, SEO, mapas, PWA, seguridad             |
| [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md)                                   | Desarrollo        | Tablas, relaciones, RLS                                                    |
| [`docs/SUPABASE-LEGACY.md`](docs/SUPABASE-LEGACY.md)                         | Desarrollo        | Proyecto compartido con Papudo, reglas e índice de los SQL manuales        |
| [`docs/DESARROLLO.md`](docs/DESARROLLO.md)                                   | Desarrollo        | Ambiente de desarrollo (`develop` + `legacy_dev`)                          |
| [`docs/DESIGN.md`](docs/DESIGN.md)                                           | Desarrollo/diseño | Lineamientos visuales, tokens y patrones (leer antes de tocar la interfaz) |
| [`docs/PROMPTS-IMAGENES.md`](docs/PROMPTS-IMAGENES.md)                       | Diseño/contenido  | El personaje, reglas del arte, prompts para ChatGPT, imágenes pendientes   |
| [`docs/DOMINIO.md`](docs/DOMINIO.md)                                         | Lanzamiento       | Dominio propio, DNS, Vercel, Search Console, abrir a Google                |
| [`docs/RENDIMIENTO.md`](docs/RENDIMIENTO.md)                                 | Desarrollo        | Caché, ISR, tiempos medidos                                                |
| [`docs/AUDITORIA-2026-11-02.md`](docs/AUDITORIA-2026-11-02.md)               | Desarrollo        | Auditoría de seguridad y calidad, estado de cada hallazgo                  |
| [`docs/PROPUESTA-CONTENIDO-PETORCA.md`](docs/PROPUESTA-CONTENIDO-PETORCA.md) | Contenido         | Investigación con fuentes: leyenda, lugares, fiestas, historia             |
| [`docs/CATALOGO-CANDIDATOS-PETORCA.md`](docs/CATALOGO-CANDIDATOS-PETORCA.md) | Contenido         | Lugares candidatos (Sernatur, OpenStreetMap, Google)                       |
| [`docs/PLAN.md`](docs/PLAN.md)                                               | Todos             | Plan por fases y **bitácora** de cada cambio con su porqué                 |
