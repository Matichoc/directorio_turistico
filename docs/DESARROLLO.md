# Ambiente de desarrollo (`develop` + `legacy_dev`)

> Escrita el 2026-11-01. Decisión del usuario: poder ir viendo los cambios en
> desarrollo sin tocar el sitio publicado. El plan gratis de Supabase no
> admite otro proyecto, así que la base de prueba es **otro esquema dentro del
> mismo proyecto city_tour**: `legacy_dev`, una copia de `legacy`.

## Cómo queda

| Ambiente                | Rama           | Link                                                         | Datos                          |
| ----------------------- | -------------- | ------------------------------------------------------------ | ------------------------------ |
| **Producción**          | `main`         | `directorio-turistico-bgl3.vercel.app` (o el dominio propio) | `legacy` (reales)              |
| **Desarrollo**          | `develop`      | `directorio-turistico-bgl3-git-develop-matichoc.vercel.app`  | `legacy_dev` (copia de prueba) |
| Vista previa de cada PR | la rama del PR | el link que deja Vercel en el PR                             | `legacy_dev`                   |

En desarrollo el sitio y el admin muestran arriba una **franja amarilla**
("Ambiente de desarrollo · datos de prueba"). Si no la ves, estás en
producción.

Flujo: cada mejora en su rama → PR hacia `develop` → se prueba en el link de
desarrollo → cuando está bien, PR de `develop` hacia `main` (producción).

## Puesta en marcha (una sola vez)

1. **Crear la copia**: Supabase → proyecto city_tour → **SQL Editor** → New
   query → pegar todo `supabase/manual/crear-legacy-dev.sql` → **Run**. Debe
   terminar con "Success". No toca `legacy` ni `public` (Papudo): solo los
   lee. Probado en una réplica local (PGlite, Postgres 17) con las
   migraciones del repo: `legacy` queda idéntico; se copian las 27 tablas con
   sus datos, las políticas, funciones, disparadores y permisos; y lo que el
   admin crea en `legacy_dev` no aparece en `legacy`.
2. **Exponerla a la API**: Supabase → **Integrations → Data API → Settings →
   Exposed schemas** → agregar `legacy_dev` → Save. (Sin esto, el sitio de
   desarrollo da "Invalid schema: legacy_dev".)
3. **Vercel**: proyecto `directorio-turistico-bgl3` → Settings → Environment
   Variables → **Add**: `NEXT_PUBLIC_SUPABASE_SCHEMA` = `legacy_dev`,
   marcando **solo Preview** (¡no Production!). Así `develop` y las vistas
   previas usan la copia, y `main` sigue con los datos reales.
4. **Volver a desplegar `develop`** (Deployments → el último de `develop` →
   ⋯ → Redeploy), o mezclar un PR en `develop`.

Para trabajar en tu PC contra la copia: en `.env.local`,
`NEXT_PUBLIC_SUPABASE_SCHEMA=legacy_dev` (vacío = datos reales).

## Qué se comparte y qué no

- **Se comparte**: las cuentas de usuario (`auth.users`) — Supabase tiene un
  solo sistema de cuentas por proyecto. Tu usuario de admin sirve en los dos
  ambientes, y los visitantes anónimos también son los mismos.
- **No se comparte**: todo lo demás (lugares, rutas, pueblos, fotos,
  comentarios, "me gusta", recorridos, administradores). Lo que cambies en el
  admin de desarrollo **no pasa solo a producción**: el contenido real se
  edita en el admin de producción. Desarrollo es para probar funciones nuevas.
- **Administradores**: la copia trae los de `legacy` del momento en que se
  creó. Si agregas uno en desarrollo, no queda en producción (y al revés).

## Refrescar la copia

Volver a correr `crear-legacy-dev.sql`: borra `legacy_dev` y lo crea de nuevo
con los datos de hoy. **Se pierde lo que se haya probado en desarrollo.**

## Cambios de base de datos (tablas nuevas, columnas, políticas)

1. Escribir el SQL para `legacy` en `supabase/manual/` (como siempre, con
   `legacy.` explícito; ver `docs/SUPABASE-LEGACY.md`).
2. Probarlo primero en desarrollo: correr una copia con `legacy_dev.` en vez
   de `legacy.` (o refrescar la copia después de aplicarlo).
3. Recién entonces correrlo en `legacy` (producción).

## Si algo falla

| Síntoma                                    | Qué hacer                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| El sitio de desarrollo sin datos           | ¿Se corrió el paso 1? ¿Se hizo Redeploy después del paso 3?                  |
| "Invalid schema: legacy_dev"               | Falta el paso 2 (Exposed schemas).                                           |
| No aparece la franja amarilla en `develop` | La variable del paso 3 no está en Preview, o falta Redeploy.                 |
| La franja aparece en producción            | La variable quedó marcada también en Production: quitarla de ahí y Redeploy. |
| Error al correr el script                  | No se cambió nada (corre en una sola transacción): mandar el mensaje.        |
