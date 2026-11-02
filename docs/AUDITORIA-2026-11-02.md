# Auditoría integral — El diablo murió en Petorca (2026-11-02)

Rama `feat/recursos-y-auditoria` (desde `develop`). Cubre la integración de
los 13 recursos gráficos del diablo campesino y una auditoría de código,
dependencias, seguridad, SEO, accesibilidad, rendimiento, privacidad y
contenido. Nada de esto está en `main` (producción).

## 1. Resumen ejecutivo

- **Lo más grave estaba en las dependencias**: `next` 16.3.5 tenía 4
  vulnerabilidades críticas (ejecución remota de código en el optimizador de
  imágenes con SVG, en `next/og` y en `use cache`) y varias altas (SSRF en
  imágenes, DoS en Server Actions). **Corregido**: `next` 16.4.3 y
  `maplibre-gl` 6.16; `pnpm audit --prod` queda en 0 vulnerabilidades.
- **Lentitud (H-24)**: ninguna página se guardaba en caché y cada visita se
  armaba de cero en EE. UU.: 0,8–3,2 s por pantalla. **Corregido** (ver
  `docs/RENDIMIENTO.md`); confirmar las cifras en la vista previa.
- **El sitio no enviaba encabezados de seguridad** (clickjacking, `nosniff`,
  permisos del navegador) y anunciaba `X-Powered-By`. **Corregido**.
- **`/api/analytics` aceptaba eventos sin límite**: cualquiera podía inflar
  las métricas. **Corregido** (límite por IP y tamaño).
- **Arte**: 11 de los 13 recursos son el diablo campesino y están integrados;
  **2 no** (el `logo.png` y la portada de "Donde el Diablo perdió el poncho"
  son el diablito anterior) y se reportan en vez de publicarse.
- **Producción está muy atrasada** respecto de `develop` (fotos rotas, sin
  portugués, panel sin roles). Es el riesgo principal para los visitantes hoy.
- La autorización del panel está bien hecha (roles verificados antes de usar
  la llave de servicio; RLS en la base) y la privacidad es buena (sin
  cuentas de visitantes, analítica anónima, sin guardar IP).

## 2. Cambios realizados

**Arte (commit `feat(arte)`)**

- Respaldo de lo anterior en `docs/arte/respaldo-2026-11-02/`.
- Fondos `atardecer`, `cerro`, `pueblo`, `tunel`, portada ferroviaria y 4
  escenas de leyendas convertidas a WebP (calidad 82); originales PNG al lado,
  fuera de Git (`.gitignore`).
- `icono.png` (campesino, reducido a 1024×1024) es ahora la fuente de **todos**
  los íconos: favicon, ícono de pestaña e iPhone, íconos de la app (192, 512,
  maskable), logo de la barra y la imagen para compartir (`og.png`).
  `scripts/build-brand-png.mjs` adaptado; íconos de `public/` con paleta
  (512 px: de ~500 KB a 130 KB); los de `src/app/` en RGBA (Next lo exige: con
  paleta el favicon rompía el servidor).
- `/leyenda`: las 4 escenas (cueca, Año Nuevo, Escalera, diablo buscando) con
  pie de foto y texto alternativo en es/en/pt; `next.config.ts` permite
  `/leyendas/**`.
- Foco de las escenas (`SCENE_POSITION`) ajustado a la cara nueva. El nuevo
  atardecer trae al diablo **al centro**: las cabeceras anchas (inicio,
  Explorar sin categoría, Información, Privacidad) usan escenas con el diablo a
  la derecha (cerro, pueblo). Prueba `scene-backgrounds` actualizada a
  propósito (la escena por defecto pasó de atardecer a cerro).
- `docs/PROMPTS-IMAGENES.md` y `docs/DESIGN.md`: personaje nuevo, estado de
  cada recurso y la regla de composición.

**Correcciones de la auditoría (commit `fix(auditoria)`)**

- `next` 16.3.5 → 16.4.3, `eslint-config-next` 16.4.3, `zod` 4.6.7,
  `next-intl` 4.14.9; `source-map-js` forzado a ^1.2.2 (`pnpm-workspace.yaml`).
- Encabezados de seguridad en todo el sitio y `poweredByHeader: false`.
- `/api/analytics`: 60 eventos por minuto por IP, hasta 12 propiedades, claves
  de 40 y textos de 200 caracteres.
- Plantilla de títulos con el nombre real ("… · El diablo murió en Petorca").
- `robots.txt`: "Mi recorrido" fuera del índice en los tres idiomas (faltaba
  `/pt/meu-roteiro`).
- Sitemap con `x-default` en cada URL (las páginas ya lo tenían).
- Logo del auspiciador con `sizes`: el navegador bajaba la versión de 3840 px
  en cada página.
- Botones ES · EN · PT de 40 px de alto mínimo (antes ~26 px).

**Segunda tanda (commit `perf+fix(auditoria)`)**

- **Rendimiento (H-24)**: las páginas públicas salen de la caché (de 0,8–3,2 s
  a 5–60 ms medido en un build local); lo publicado en el panel se ve al
  instante. Diagnóstico, cifras y cómo revisarlo en `docs/RENDIMIENTO.md`.
- `maplibre-gl` 5.24 → 6.16 (H-02) con el worker cargado explícitamente
  (`src/lib/maps/maplibre.ts`): la v6 lo trae en un archivo aparte y sin esto
  el mapa base queda en negro (lo que pasó en septiembre). Probados a la
  vista: vuelo 3D, Explorar, ficha de ruta y ficha de lugar.
- CSP completa en modo informe, activable con `CSP_MODE=enforce` (H-05).
- Datos estructurados para Google en las fichas (H-14), foco visible con
  teclado (H-17), `listTeam()` con revisión de rol (H-22), diablito campesino
  en la ruta del poncho (H-11).
- Pruebas de punta a punta de los flujos principales (H-18).
- Script SQL propuesto para la analítica (H-07), sin correr.

## 3. Problemas detectados y prioridades

Esfuerzo: S = menos de 2 h, M = medio día, L = 1–2 días. "Sin cambiar
funciones" = se puede corregir sin alterar lo que el sitio hace hoy.

| ID   | Gravedad | Problema y evidencia                                                                                                                                                       | Dónde                                                    | Impacto para visitantes                                         | Solución                                                                                                                                                                                              | Esfuerzo | Sin cambiar funciones | Estado                            |
| ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------- | --------------------------------- |
| H-01 | Crítica  | `pnpm audit --prod`: 15 vulnerabilidades (4 críticas) en `next` 16.3.5, `zod`, `sharp`, `source-map-js`                                                                    | `package.json`                                           | Riesgo de toma del servidor o caída                             | Actualizar a `next` 16.4.3 y parches                                                                                                                                                                  | S        | Sí                    | **Corregido**                     |
| H-02 | Media    | `maplibre-gl` 5.24: XSS en `DOM.sanitize` (GHSA-jrc7-96c5-q579, crítica en el aviso). El sitio no usa `setHTML`: solo lo procesaría texto del estilo del mapa (atribución) | `package.json`, mapas                                    | Bajo: requiere un estilo de mapa malicioso                      | `maplibre-gl` 6.16 + worker con URL explícita (`lib/maps/maplibre.ts`); probados vuelo 3D, Explorar, ruta y lugar                                                                                     | M        | No (versión mayor)    | **Corregido**                     |
| H-03 | Alta     | Producción (`main`) lleva 55 commits detrás de `develop`: fotos de Google rotas, sin portugués, panel sin roles                                                            | Vercel / `main`                                          | Ven un sitio con fotos faltantes y menos funciones              | Revisar `develop` y pasarlo a `main` (correr antes los SQL pendientes)                                                                                                                                | S        | —                     | Propuesta                         |
| H-04 | Media    | Sin encabezados de seguridad; `X-Powered-By: Next.js`                                                                                                                      | `next.config.ts`                                         | Clickjacking del panel, MIME sniffing                           | Encabezados + `poweredByHeader: false`                                                                                                                                                                | S        | Sí                    | **Corregido**                     |
| H-05 | Media    | Sin política de contenido (CSP) completa                                                                                                                                   | `next.config.ts`                                         | Menos defensa ante XSS                                          | CSP completa en `next.config.ts`, en modo informe; `CSP_MODE=enforce` la aplica (probada aplicada sin bloqueos en inicio, Explorar, ruta, lugar, leyenda y login)                                     | M        | Sí, con pruebas       | **Corregido** (activar en Vercel) |
| H-06 | Media    | `/api/analytics` sin límite de pedidos ni de tamaño                                                                                                                        | `src/app/api/analytics/route.ts`                         | Métricas falseables, tabla inflada                              | Límite por IP y por tamaño                                                                                                                                                                            | S        | Sí                    | **Corregido**                     |
| H-07 | Media    | La política RLS deja insertar en `analytics_events` directo por la API REST de Supabase con la llave pública, saltándose H-06                                              | Base (`0008_rls.sql`)                                    | Igual que H-06                                                  | `supabase/manual/analitica-solo-eventos-validos.sql` (política con nombres válidos y ≤ 4 KB)                                                                                                          | M        | Sí                    | Script listo (correr)             |
| H-08 | Media    | El límite de pedidos vive en memoria de cada instancia; en Vercel hay varias                                                                                               | `src/lib/http/rate-limit.ts`                             | Límites fáciles de esquivar (fotos, rutas, analítica)           | Límite distribuido (Upstash o Vercel KV)                                                                                                                                                              | M        | Sí                    | Propuesta                         |
| H-09 | Media    | Una portada reemplazada con el mismo nombre se siguió viendo vieja en local hasta reiniciar                                                                                | `public/rutas`, `routes.cover_image`                     | Pueden ver la portada anterior tras publicar                    | En Vercel no aplica: la caché de imágenes usa un hash del contenido y se renueva al desplegar ([docs](https://vercel.com/docs/image-optimization)). Plan B: `vercel cache invalidate --srcimg <ruta>` | S        | Sí                    | **Descartado** (solo local)       |
| H-10 | Media    | Identidad: el `logo.png` entregado y la portada de "Donde el Diablo perdió el poncho" son el diablito anterior                                                             | `public/brand/logo.png`, `public/rutas/ruta-del-diablo…` | Mezcla de dos personajes                                        | Provisoria: portada con la escena de la Escalera del Diablo (`portada-poncho-campesino.sql`). Pedir la portada y el logo con la referencia campesina                                                  | —        | Sí                    | Parcial (correr SQL)              |
| H-11 | Baja     | El `DevilMascot` era el SVG del diablito anterior, y además no se mostraba: buscaba la ruta `ruta-del-diablo`, que ya no existe                                            | `src/components/ui/devil-mascot.tsx`                     | Inconsistencia visual menor                                     | Cabeza del diablo campesino (`icons/icon-192.png`) en la ruta del poncho                                                                                                                              | S        | Sí                    | **Corregido**                     |
| H-12 | Baja     | Títulos con "El diablo en Petorca" (el sitio se llama "El diablo murió en Petorca")                                                                                        | `src/app/layout.tsx`                                     | Marca inconsistente en buscadores                               | Plantilla con `SITE_NAME`                                                                                                                                                                             | S        | Sí                    | **Corregido**                     |
| H-13 | Baja     | `robots.txt` no excluía `/pt/meu-roteiro`; el sitemap no tenía `x-default`                                                                                                 | `src/app/robots.ts`, `src/app/sitemap.ts`                | Indexación de páginas personales                                | Por idioma desde `routing`                                                                                                                                                                            | S        | Sí                    | **Corregido**                     |
| H-14 | Media    | Sin datos estructurados (JSON-LD `TouristAttraction`, `TouristTrip`, `Place`)                                                                                              | Fichas de lugar, ruta y pueblo                           | Menos presencia en resultados de Google                         | `lib/seo-json-ld.ts` + `JsonLd`: `TouristAttraction`, `TouristTrip` (con paradas) y `Place`, solo con datos reales y sin fotos de Google                                                              | M        | Sí                    | **Corregido**                     |
| H-15 | Media    | Logo del auspiciador pedido a 3840 px en cada página                                                                                                                       | `src/components/ui/sponsor-banner.tsx`                   | Página más lenta en celular                                     | `sizes`                                                                                                                                                                                               | S        | Sí                    | **Corregido**                     |
| H-16 | Baja     | Botones de idioma de ~26 px (mínimo recomendado 44 px)                                                                                                                     | `src/components/ui/locale-switcher.tsx`                  | Difíciles de tocar                                              | Mínimo 40 px                                                                                                                                                                                          | S        | Sí                    | **Corregido**                     |
| H-17 | Baja     | Sin estilos propios de foco visible (se depende del navegador)                                                                                                             | `src/app/globals.css`                                    | Navegación con teclado menos clara                              | `:focus-visible` con anillo de brasa en `globals.css` (`@layer base`)                                                                                                                                 | S        | Sí                    | **Corregido**                     |
| H-18 | Media    | Pruebas de punta a punta mínimas (2 de humo, sin datos reales)                                                                                                             | `tests/e2e`                                              | Errores de flujo llegan a producción                            | `tests/e2e/flujos.spec.ts`: caché, leyenda e idioma, ruta con mapa y JSON-LD, Explorar, ficha, 404, panel. Corre con el Chrome instalado (`PLAYWRIGHT_CHANNEL=chrome`)                                | L        | Sí                    | **Corregido** (18/18)             |
| H-19 | Media    | Contenido: 10 de 20 lugares sin verificar en terreno; 3 fotos que Google ya no tiene; `scripts/seed.ts` sin portugués ni los scripts recientes                             | Base, `scripts/seed.ts`                                  | Datos no confirmados; reconstruir la base perdería traducciones | Verificar en terreno; actualizar el seed                                                                                                                                                              | M        | Sí                    | Propuesta                         |
| H-20 | Media    | Supabase compartido con Papudo (autenticación y plan)                                                                                                                      | Supabase `city_tour`                                     | Un cambio en uno afecta al otro                                 | Proyecto propio cuando haya ambiente profesional                                                                                                                                                      | L        | Sí                    | Propuesta                         |
| H-21 | Media    | El panel no tiene segundo factor (2FA)                                                                                                                                     | `/admin`                                                 | Una clave filtrada da acceso al contenido                       | 2FA (TOTP de Supabase) para administradores                                                                                                                                                           | M        | Sí                    | Propuesta                         |
| H-22 | Baja     | `listTeam()` usa la llave de servicio y confía en que la página revise el rol                                                                                              | `src/lib/data/team.ts`                                   | Ninguno hoy (la única página que lo usa revisa el rol)          | `listTeam()` revisa que quien llama sea administrador                                                                                                                                                 | S        | Sí                    | **Corregido**                     |
| H-23 | Baja     | Dos proyectos de Vercel publican cada cambio; `.env.local` con `NEXT_PUBLIC_MAP_STYLE_URL=CARTO` inválido                                                                  | Vercel, `.env.local`                                     | Confusión de URLs; mapa negro en local                          | Línea comentada en `.env.local` (local, fuera de Git). Falta apagar el proyecto de Vercel sobrante                                                                                                    | S        | Sí                    | Parcial                           |
| H-24 | Alta     | Todas las páginas tardaban 0,8–3,2 s: `Cache-Control: private, no-store`, ninguna en caché (layout raíz con `getLocale()` y Supabase con cookies)                          | `src/app/layout.tsx`, `src/lib/data/*`                   | Esperar 1–3 s en cada pantalla                                  | Caché de datos y páginas (ISR 5 min) y refresco al guardar en el panel; ver `docs/RENDIMIENTO.md`                                                                                                     | M        | Sí                    | **Corregido**                     |

**Lo que está bien** (sin hallazgos): las acciones del equipo verifican el
rol de administrador antes de usar la llave de servicio
(`src/lib/server/team.ts`); el panel exige sesión y estar en `admin_users`
(`src/lib/supabase/middleware.ts`); entradas validadas con `zod` en las APIs;
sin `dangerouslySetInnerHTML`; fotos de Google por proxy (la llave nunca va al
navegador); fuentes servidas desde el propio sitio; analítica anónima sin IP;
`lang`, `canonical`, `hreflang` y `og:locale` correctos en los tres idiomas.

## 4. Estado de los 13 recursos gráficos

Ver la tabla completa en `docs/PROMPTS-IMAGENES.md` ("Estado"). Resumen:

| Recurso                                              | Campesino | Estado                                                  |
| ---------------------------------------------------- | --------- | ------------------------------------------------------- |
| referencias/diablo-referencia                        | Sí        | Integrado (`docs/arte/diablo-campesino-referencia.png`) |
| brand/icono                                          | Sí        | Integrado (fuente de todos los íconos)                  |
| brand/logo                                           | **No**    | **No integrado** (diablito anterior)                    |
| fondos/atardecer, cerro, pueblo, tunel               | Sí        | Integrados (WebP)                                       |
| rutas/ruta-ferroviaria-pedegua-las-palmas            | Sí        | Integrada (mismo puente aprobado)                       |
| rutas/ruta-del-diablo-pedegua-chincolco              | **No**    | **No integrada** (igual a la anterior)                  |
| leyendas/cueca, ano-nuevo, escalera, diablo-buscando | Sí        | Integradas en `/leyenda`                                |

## 5. Resultados de las pruebas

Ver el PR (sección "Pruebas"), con la salida real de cada comando. Las de
punta a punta se corren contra un build levantado:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e
```

## 6. Riesgos pendientes y lo que no se arregla desde el código

| ID   | Qué falta                                                                                                  | Quién / dónde                             |
| ---- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| H-03 | Pasar `develop` a `main` después de revisar la vista previa                                                | Cristóbal, GitHub                         |
| H-05 | Revisar la vista previa con `CSP_MODE=enforce` (sobre todo el panel con sesión) y dejarla puesta en Vercel | Vercel → Settings → Environment Variables |
| H-07 | Correr `supabase/manual/analitica-solo-eventos-validos.sql`                                                | SQL Editor de city_tour                   |
| H-08 | Límite de pedidos distribuido (Upstash Redis o Vercel KV): requiere crear la cuenta/servicio               | Vercel Marketplace                        |
| H-10 | Logo y portada de la ruta del poncho con el diablo campesino                                               | Arte                                      |
| H-19 | Verificar en terreno los 10 lugares pendientes; poner al día `scripts/seed.ts`                             | Terreno + una rama propia                 |
| H-20 | Proyecto de Supabase propio (hoy compartido con Papudo)                                                    | Cuando haya ambiente profesional          |
| H-21 | 2FA para administradores (TOTP de Supabase): cambia el ingreso de todos, va como propuesta aparte          | Rama propia                               |
| H-23 | Apagar el proyecto de Vercel que sobra                                                                     | Vercel                                    |
| —    | Región de las funciones de Vercel (`iad1` → la de Supabase), ver `docs/RENDIMIENTO.md`                     | Vercel → Settings → Functions             |

## 7. Recomendaciones antes de publicar

1. Revisar este PR en la vista previa de Vercel (celular y escritorio).
2. Mezclarlo en `develop` y, con `develop` revisado, pasarlo a `main`.
3. Antes de `main`: correr en el SQL Editor los scripts pendientes
   (`petorca-portadas.sql`, `analitica-solo-eventos-validos.sql`).
4. Medir la vista previa con el `curl` de `docs/RENDIMIENTO.md`: las
   páginas públicas deben responder `s-maxage` y no `no-store`.
5. Pedir el logo y la portada de la ruta del poncho con el diablo campesino.
