# Auditoría integral — El diablo murió en Petorca (2026-11-02)

Rama `feat/recursos-y-auditoria` (desde `develop`). Cubre la integración de
los 13 recursos gráficos del diablo campesino y una auditoría de código,
dependencias, seguridad, SEO, accesibilidad, rendimiento, privacidad y
contenido. Nada de esto está en `main` (producción).

## 1. Resumen ejecutivo

- **Lo más grave estaba en las dependencias**: `next` 16.3.5 tenía 4
  vulnerabilidades críticas (ejecución remota de código en el optimizador de
  imágenes con SVG, en `next/og` y en `use cache`) y varias altas (SSRF en
  imágenes, DoS en Server Actions). **Corregido**: `next` 16.4.3; de 15
  vulnerabilidades de producción queda 1 (`maplibre-gl`, exposición baja,
  ver H-02).
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

## 3. Problemas detectados y prioridades

Esfuerzo: S = menos de 2 h, M = medio día, L = 1–2 días. "Sin cambiar
funciones" = se puede corregir sin alterar lo que el sitio hace hoy.

| ID   | Gravedad | Problema y evidencia                                                                                                                                                       | Dónde                                                    | Impacto para visitantes                                         | Solución                                                                                              | Esfuerzo | Sin cambiar funciones | Estado         |
| ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- | --------------------- | -------------- |
| H-01 | Crítica  | `pnpm audit --prod`: 15 vulnerabilidades (4 críticas) en `next` 16.3.5, `zod`, `sharp`, `source-map-js`                                                                    | `package.json`                                           | Riesgo de toma del servidor o caída                             | Actualizar a `next` 16.4.3 y parches                                                                  | S        | Sí                    | **Corregido**  |
| H-02 | Media    | `maplibre-gl` 5.24: XSS en `DOM.sanitize` (GHSA-jrc7-96c5-q579, crítica en el aviso). El sitio no usa `setHTML`: solo lo procesaría texto del estilo del mapa (atribución) | `package.json`, mapas                                    | Bajo: requiere un estilo de mapa malicioso                      | Subir a `maplibre-gl` 6.x y probar `react-map-gl` 8 y todos los mapas                                 | M        | No (versión mayor)    | Propuesta      |
| H-03 | Alta     | Producción (`main`) lleva 55 commits detrás de `develop`: fotos de Google rotas, sin portugués, panel sin roles                                                    | Vercel / `main`                                          | Ven un sitio con fotos faltantes y menos funciones              | Revisar `develop` y pasarlo a `main` (correr antes los SQL pendientes)                                | S        | —                     | Propuesta      |
| H-04 | Media    | Sin encabezados de seguridad; `X-Powered-By: Next.js`                                                                                                                      | `next.config.ts`                                         | Clickjacking del panel, MIME sniffing                           | Encabezados + `poweredByHeader: false`                                                                | S        | Sí                    | **Corregido**  |
| H-05 | Media    | Sin política de contenido (CSP) completa                                                                                                                                   | `next.config.ts`                                         | Menos defensa ante XSS                                          | CSP con `worker-src blob:`, Supabase, OpenFreeMap, OSRM, Google; probar en modo `Report-Only` primero | M        | Sí, con pruebas       | Propuesta      |
| H-06 | Media    | `/api/analytics` sin límite de pedidos ni de tamaño                                                                                                                        | `src/app/api/analytics/route.ts`                         | Métricas falseables, tabla inflada                              | Límite por IP y por tamaño                                                                            | S        | Sí                    | **Corregido**  |
| H-07 | Media    | La política RLS deja insertar en `analytics_events` directo por la API REST de Supabase con la llave pública, saltándose H-06                                              | Base (`0008_rls.sql`)                                    | Igual que H-06                                                  | Restricción en la base (largo de `properties`, nombres válidos) o insertar solo desde el servidor     | M        | Sí                    | Propuesta      |
| H-08 | Media    | El límite de pedidos vive en memoria de cada instancia; en Vercel hay varias                                                                                               | `src/lib/http/rate-limit.ts`                             | Límites fáciles de esquivar (fotos, rutas, analítica)           | Límite distribuido (Upstash o Vercel KV)                                                              | M        | Sí                    | Propuesta      |
| H-09 | Media    | Las imágenes optimizadas se guardan por nombre de archivo: una portada reemplazada con el mismo nombre se siguió viendo vieja en local hasta reiniciar                     | `public/rutas`, `routes.cover_image`                     | Pueden ver la portada anterior tras publicar                    | Versionar nombres (`…-v2.webp`) y actualizar `cover_image` con SQL                                    | S        | Sí                    | Propuesta      |
| H-10 | Media    | Identidad: el `logo.png` entregado y la portada de "Donde el Diablo perdió el poncho" son el diablito anterior                                                             | `public/brand/logo.png`, `public/rutas/ruta-del-diablo…` | Mezcla de dos personajes                                        | Pedir esas dos imágenes con la referencia campesina                                                   | —        | Sí                    | Pendiente arte |
| H-11 | Baja     | El ícono `DevilMascot` (SVG del diablito anterior) sigue en la ficha de ruta                                                                                               | `src/components/ui/devil-mascot.tsx`                     | Inconsistencia visual menor                                     | Reemplazarlo por un detalle del arte nuevo o quitarlo                                                 | S        | Sí                    | Propuesta      |
| H-12 | Baja     | Títulos con "El diablo en Petorca" (el sitio se llama "El diablo murió en Petorca")                                                                                        | `src/app/layout.tsx`                                     | Marca inconsistente en buscadores                               | Plantilla con `SITE_NAME`                                                                             | S        | Sí                    | **Corregido**  |
| H-13 | Baja     | `robots.txt` no excluía `/pt/meu-roteiro`; el sitemap no tenía `x-default`                                                                                                 | `src/app/robots.ts`, `src/app/sitemap.ts`                | Indexación de páginas personales                                | Por idioma desde `routing`                                                                            | S        | Sí                    | **Corregido**  |
| H-14 | Media    | Sin datos estructurados (JSON-LD `TouristAttraction`, `TouristTrip`, `Place`)                                                                                              | Fichas de lugar, ruta y pueblo                           | Menos presencia en resultados de Google                         | JSON-LD con datos reales (nombre, coordenadas, dirección)                                             | M        | Sí                    | Propuesta      |
| H-15 | Media    | Logo del auspiciador pedido a 3840 px en cada página                                                                                                                       | `src/components/ui/sponsor-banner.tsx`                   | Página más lenta en celular                                     | `sizes`                                                                                               | S        | Sí                    | **Corregido**  |
| H-16 | Baja     | Botones de idioma de ~26 px (mínimo recomendado 44 px)                                                                                                                     | `src/components/ui/locale-switcher.tsx`                  | Difíciles de tocar                                              | Mínimo 40 px                                                                                          | S        | Sí                    | **Corregido**  |
| H-17 | Baja     | Sin estilos propios de foco visible (se depende del navegador)                                                                                                             | `src/app/globals.css`                                    | Navegación con teclado menos clara                              | `:focus-visible` con el color de acento                                                               | S        | Sí                    | Propuesta      |
| H-18 | Media    | Pruebas de punta a punta mínimas (2 de humo, sin datos reales)                                                                                                             | `tests/e2e`                                              | Errores de flujo llegan a producción                            | Playwright para Explorar, ficha, ruta con guía, panel                                                 | L        | Sí                    | Propuesta      |
| H-19 | Media    | Contenido: 10 de 20 lugares sin verificar en terreno; 3 fotos que Google ya no tiene; `scripts/seed.ts` sin portugués ni los scripts recientes                             | Base, `scripts/seed.ts`                                  | Datos no confirmados; reconstruir la base perdería traducciones | Verificar en terreno; actualizar el seed                                                              | M        | Sí                    | Propuesta      |
| H-20 | Media    | Supabase compartido con Papudo (autenticación y plan)                                                                                                                      | Supabase `city_tour`                                     | Un cambio en uno afecta al otro                                 | Proyecto propio cuando haya ambiente profesional                                                      | L        | Sí                    | Propuesta      |
| H-21 | Media    | El panel no tiene segundo factor (2FA)                                                                                                                                     | `/admin`                                                 | Una clave filtrada da acceso al contenido                       | 2FA (TOTP de Supabase) para administradores                                                           | M        | Sí                    | Propuesta      |
| H-22 | Baja     | `listTeam()` usa la llave de servicio y confía en que la página revise el rol                                                                                              | `src/lib/data/team.ts`                                   | Ninguno hoy (la única página que lo usa revisa el rol)          | Revisar el rol también adentro (defensa en profundidad)                                               | S        | Sí                    | Propuesta      |
| H-23 | Baja     | Dos proyectos de Vercel publican cada cambio; `.env.local` con `NEXT_PUBLIC_MAP_STYLE_URL=CARTO` inválido                                                                  | Vercel, `.env.local`                                     | Confusión de URLs; mapa negro en local                          | Apagar el proyecto sobrante; borrar la línea                                                          | S        | Sí                    | Propuesta      |

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

Ver el PR (sección "Pruebas"), con la salida real de cada comando.

## 6. Riesgos pendientes

H-02 (MapLibre), H-03 (producción atrasada), H-05 (CSP), H-07 (RLS de
analítica), H-08 (límite distribuido), H-09 (caché de imágenes), H-10 (arte
faltante), H-20 y H-21 (Supabase compartido, sin 2FA).

## 7. Recomendaciones antes de publicar

1. Revisar este PR en la vista previa de Vercel (celular y escritorio).
2. Mezclarlo en `develop` y, con `develop` revisado, pasarlo a `main`.
3. Antes de `main`: correr en el SQL Editor los scripts pendientes
   (`petorca-portadas.sql`) y versionar las portadas reemplazadas (H-09).
4. Pedir el logo y la portada de la ruta del poncho con el diablo campesino.
5. Planificar la subida de `maplibre-gl` a 6.x con pruebas de los mapas.
