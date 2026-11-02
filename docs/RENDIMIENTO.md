# Rendimiento: por qué las páginas demoraban 1 a 3 segundos

> Diagnóstico y arreglo del 2026-11-02 (rama `feat/recursos-y-auditoria`).
> Si una página nueva vuelve a sentirse lenta, empezar por la sección
> "Cómo revisar" al final.

## El síntoma

Casi todas las pantallas tardaban entre 1 y 3 segundos en empezar a
mostrarse. Medido en producción (`directorio-turistico-bgl3.vercel.app`,
desde Chile, 2026-11-02), tiempo hasta el primer byte (TTFB):

| Página            | Ronda 1 | Ronda 2 | Encabezados                                 |
| ----------------- | ------- | ------- | ------------------------------------------- |
| `/es`             | 3,24 s  | 1,29 s  | `Cache-Control: private, no-store` · `MISS` |
| `/es/rutas`       | 0,94 s  | 0,87 s  | igual                                       |
| `/es/explorar`    | 1,09 s  | 0,83 s  | igual                                       |
| `/es/informacion` | 1,29 s  | 1,25 s  | igual                                       |

`X-Vercel-Id: gru1::iad1` en todas: la visita entra por São Paulo y la
página se arma en un servidor de Washington (EE. UU.).

## La causa

**Ninguna página se guardaba en caché: cada visita la armaba de cero.**

1. **El layout raíz leía el idioma con `getLocale()`**, que en ese lugar sale
   de los encabezados de la petición. Leer encabezados vuelve dinámica la
   página, y como es el layout raíz, volvía dinámicas **todas** las páginas
   del sitio (de ahí el `private, no-store`).
2. **Los datos se pedían con el cliente de Supabase "con sesión"**, que lee
   las cookies del visitante: otra razón para que Next no pudiera cachear,
   aunque el contenido público sea igual para todos.
3. Entonces, en cada visita: arranque en frío de la función (a veces), varias
   consultas a Supabase (~110 ms cada una desde el servidor; la primera hasta
   1,3 s) y el viaje Chile ↔ EE. UU.

## El arreglo

| Pieza                               | Qué hace                                                                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/supabase/public.ts`        | Cliente de Supabase **sin cookies** (llave pública) para el contenido público. El panel sigue usando el de sesión.                                                                                                                                       |
| `src/lib/data/cache.ts`             | `cachedContent(fn, clave)`: guarda el resultado de cada consulta pública (lugares, rutas, pueblos, categorías, comunas, comentarios, auspiciadores, etiquetas) con la etiqueta `contenido`, 5 minutos.                                                   |
| `src/app/[locale]/layout.tsx`       | `export const revalidate = 300`: las páginas se generan una vez y se sirven desde la caché de Vercel; se regeneran cada 5 minutos en segundo plano.                                                                                                      |
| `src/components/ui/html-shell.tsx`  | El `<html>`/`<body>` salió del layout raíz: cada sección lo pone con su idioma (`[locale]` con el de la URL, el panel y el 404 en español). Así nada lee encabezados para saber el idioma.                                                               |
| `src/app/admin/layout.tsx`          | El panel queda siempre dinámico (`force-dynamic`): depende de quién entra.                                                                                                                                                                               |
| `src/lib/server/content/refresh.ts` | `refreshPublicContent()`: al guardar algo en el panel (lugares, pueblos, rutas, comentarios, etiquetas, verificaciones, carga masiva) borra la caché de contenido y de páginas. **Lo que se publica en el panel se ve al instante**, no a los 5 minutos. |
| Fichas de ruta y de pueblo          | `generateStaticParams` vacío: cada ficha se genera la primera vez que alguien la visita y queda en caché.                                                                                                                                                |

Qué sigue siendo dinámico (y por qué está bien):

- **Explorar** y **la ficha de un lugar**: leen parámetros de la URL
  (`?categoria=`, `?vista=`, `?ruta=`). Se arman en cada visita, pero sus
  datos ya salen de la caché: sin consultas a Supabase, ~20-30 ms de
  servidor en vez de ~1 s.
- **Recorrido compartido** (`?paradas=`), el panel y las API.

## Después (build de producción local, `next start`)

| Página                | Antes (Vercel) | Después, 1ª visita | Después, siguientes   |
| --------------------- | -------------- | ------------------ | --------------------- |
| `/es`                 | 1,3 – 3,2 s    | 9 ms (`HIT`)       | 5 ms (`HIT`)          |
| `/es/rutas`           | 0,9 s          | 21 ms (`HIT`)      | 5 ms                  |
| `/es/leyenda`         | —              | 18 ms (`HIT`)      | 5 ms                  |
| `/es/rutas/<ruta>`    | —              | 60 ms (`MISS`)     | 6 ms (`HIT`)          |
| `/es/pueblos/petorca` | —              | 272 ms (`MISS`)    | 5 ms (`HIT`)          |
| `/es/explorar`        | 0,8 – 1,1 s    | 190 ms             | 28 – 31 ms (dinámica) |
| `/es/lugares/<lugar>` | —              | 152 ms             | 16 – 22 ms (dinámica) |

Encabezado nuevo de las páginas cacheadas:
`Cache-Control: s-maxage=300, stale-while-revalidate=…` (antes
`private, no-store`).

Ojo: esto se midió en este computador, no en Vercel. En Vercel las páginas
cacheadas se sirven desde el borde más cercano (São Paulo), así que desde
Chile se espera del orden de 50-150 ms en vez de 1-3 s. **Hay que confirmarlo
en la vista previa del PR** con el mismo `curl` de abajo.

## Pendiente (propuesta, no hecho)

- **Región de las funciones de Vercel**: hoy `iad1` (Washington). Si el
  proyecto de Supabase está en São Paulo (`sa-east-1`), poner las funciones
  en `gru1` (Vercel → Settings → Functions → Region) bajaría Explorar y las
  fichas de lugar todavía más. Revisar primero la región de Supabase en su
  panel (no se pudo ver desde acá).
- **`unstable_cache` → `use cache`**: Next 16 recomienda pasar a "Cache
  Components" (`cacheComponents: true` + directiva `use cache`). Cambia el
  modelo de todo el sitio (cada `[slug]` necesita al menos un parámetro al
  compilar, los `searchParams` van en `Suspense`…), así que queda para una
  rama propia. `unstable_cache` sigue funcionando en 16.4.
- El primer arranque en frío de una función sigue existiendo para las páginas
  dinámicas; con la caché casi no se nota.

## Cómo revisar

```bash
curl -s -o /dev/null -D - -w "TTFB=%{time_starttransfer}s\n" https://<sitio>/es | grep -iE "cache|ttfb|x-vercel"
```

- `Cache-Control: private, no-store` en una página pública → algo la volvió
  dinámica. Sospechosos de siempre: `cookies()`, `headers()`, `getLocale()`
  fuera de `[locale]`, `searchParams`, o una consulta con
  `@/lib/supabase/server` (con cookies) en vez de `createPublicClient`.
- `pnpm build` muestra la tabla de rutas: `ƒ` = se arma en cada visita, `●`
  o `○` = cacheada. Una página pública nueva debería quedar en `●`/`○`.
- Al agregar una consulta pública nueva en `src/lib/data/`: usar
  `createPublicClient()` y envolverla con `cachedContent`. Al agregar una
  acción del panel que cambie contenido público: llamar a
  `refreshPublicContent()`.
