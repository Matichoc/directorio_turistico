# Guía: el diablo y Papudo en el mismo Supabase (esquemas `legacy` y `public`)

> Escrita el 2026-10-17. Los dos sitios comparten **un** proyecto de Supabase
> (`qbfvsnkywlvozvxeujgh`, llamado **city_tour**), cada uno en su esquema:
>
> | Sitio                                              | Esquema  | Alcance                                                                 |
> | -------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
> | **Papudo** (más acotado, con más funciones nuevas) | `public` | Solo Papudo                                                             |
> | **El diablo** (este repo)                          | `legacy` | Provincia de Petorca: Petorca, Cabildo, La Ligua, **Papudo** y Zapallar |
>
> Son bases distintas que conviven en un mismo proyecto: no se mezclan datos
> ni se comparten tablas, aunque los nombres se repitan (`places`,
> `localities`, `routes`…). Todo cabe en el plan gratis. El proyecto
> `matiweb` no se toca.

## Reglas de oro

1. **Este repo nunca lee ni escribe `public` de ese proyecto.** El código lo
   garantiza solo (ver "Cómo lo hace el código").
2. **Nunca `supabase db push` desde este repo contra ese proyecto.** Aplicaría
   las migraciones del diablo en `public` y ensuciaría las tablas de Papudo.
   Los cambios de la base del diablo se escriben como SQL con `legacy.`
   explícito (carpeta `supabase/manual/`) y se corren a mano en el SQL Editor.
3. **No corras `supabase/manual/*.sql` por la CLI ni como migración**: son
   scripts manuales.

## Estado

Revisado el 2026-11-01 desde fuera, con la llave pública (solo lectura):

| #   | Paso                                                       | Estado                                                      |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Exponer `legacy` en la API (Exposed schemas)               | Hecho                                                       |
| 2   | Permisos y funciones de `legacy` (`legacy-acceso-api.sql`) | Hecho (comprobado 2026-11-01, ver abajo)                    |
| 3   | Código del diablo con el esquema `legacy`                  | Hecho (PR #49, en `main`)                                   |
| 4   | Variables y Redeploy en Vercel                             | Hecho en `directorio-turistico-bgl3.vercel.app` (ver abajo) |
| 5   | Revisar auth (inicio de sesión anónimo y URL del sitio)    | Por revisar                                                 |
| 6   | Revisión final                                             | Por hacer                                                   |

## Paso 1 · Exponer `legacy` en la API (hecho)

Supabase → Integrations → Data API → Settings → **Exposed schemas**: marcados
`public`, `legacy` y `graphql_public`. No tocar "Automatically expose new
tables" (afecta a Papudo).

## Paso 2 · Permisos y funciones de `legacy` (hecho)

**Comprobado el 2026-11-01** con la llave pública: `legacy` responde a la API
con 37 lugares (36 verificados), 63 pueblos (todos con coordenada, 25 con
resumen en es y en), 3 rutas, 168 fotos, 5 comunas, 4 categorías, 2
auspiciadores y 24 enlaces de contacto; `legacy.is_admin()` responde (`false`
sin sesión) y `legacy.place_like_counts()` devuelve los "me gusta" del diablo
— y `public.place_likes` ni existe, así que la función ya lee `legacy`, no
`public`. `public` sigue con los 21 lugares de Papudo. Lo que no se puede ver
con la llave pública es el cuerpo de las funciones; si alguna vez hay dudas,
correr de nuevo el script es seguro (es repetible).

Lo que sigue es el detalle de qué hacía el script (por si hay que repetirlo).
Antes de correrlo, el esquema `legacy` no dejaba entrar a la API
(`permission denied for schema legacy`), y las funciones del diablo, al
moverse de esquema, **seguían diciendo `public.` por dentro**: `legacy.is_admin()` consultaría
`public.admin_users` (de Papudo, si existe), y `analytics_top/totals` y
`place_like_counts` leerían tablas de Papudo.

El archivo `supabase/manual/legacy-acceso-api.sql` lo arregla, **solo dentro
de `legacy`**, en una sola transacción:

0. Verifica que las 27 tablas del diablo existan y tengan RLS activa; si no,
   **aborta sin cambiar nada**.
1. Reescribe `is_admin`, `place_like_counts`, `analytics_top` y
   `analytics_totals` para que lean solo `legacy`.
2. Vuelve a apuntar los 2 disparadores de estado (`places`, `routes`) a la
   función de `legacy`.
3. Da `usage` sobre el esquema y permisos sobre esas 27 tablas y 4 funciones a
   `anon`, `authenticated` y `service_role` (la RLS decide quién ve y escribe
   qué). La tabla `_archivo` queda sin acceso.

No lee ni cambia nada de `public`, no crea ni borra tablas ni mueve datos. Es
repetible (correrlo dos veces deja lo mismo).

**Cómo correrlo:** Supabase → proyecto city_tour → **SQL Editor** → New query
→ pegar el contenido completo del archivo → **Run**. Debe terminar sin error
(`Success. No rows returned`). Si aparece un error que empieza con "Falta la
tabla…" o "…no tiene RLS activa…", no se cambió nada: mándame el mensaje.

**Cómo se probó:** réplica local (Postgres 16 + PostGIS) con el diablo en
`legacy` —funciones y tipos incluidos, con sus cuerpos aún diciendo
`public.`— y un `public` de "Papudo" con las mismas tablas, su propio
`admin_users`, métricas y funciones de igual nombre:

- **Antes del SQL** se reproduce el problema: el admin de Papudo pasaba por
  admin del diablo y las métricas del diablo salían de las de Papudo.
- **Después**, el admin de Papudo ya no es admin del diablo, y las métricas
  son las de `legacy`.
- Huella (md5 de datos y permisos) de `public` y `auth`, y de las funciones de
  Papudo, **idéntica antes y después**.
- Con los roles reales de la API: `anon` lee lo publicado y no escribe lugares
  ni ve métricas; un visitante da "me gusta", comenta (queda pendiente) y
  guarda su recorrido; el admin del diablo escribe y ve métricas; `_archivo`
  no es accesible; el disparador de estado funciona; si una tabla no tiene
  RLS, aborta sin dejar nada a medias.

**Después de correrlo** se comprueba desde fuera, con la llave pública (solo
lectura), que `legacy` responde y que Papudo (`public`) sigue igual — es lo
que se hizo el 2026-11-01 (arriba).

## Paso 3 · Código del diablo (hecho, PR #49)

Todos los clientes de Supabase (servidor, navegador, admin, middleware y los
scripts `db:seed`, `fetch:google-photos`, `export:content-gaps`) usan
`supabaseDbOptions()` (`src/lib/supabase/env.ts`), que elige el esquema:

- Proyecto compartido (`qbfvsnkywlvozvxeujgh` en la URL) → **`legacy`**, sin
  configurar nada.
- Cualquier otro proyecto → `public`.
- `NEXT_PUBLIC_SUPABASE_SCHEMA` lo fuerza; poner `public` en el proyecto
  compartido **da error a propósito** (esas tablas son de Papudo).

Hay pruebas (`tests/unit/supabase-schema.test.ts`) que verifican, en las
cabeceras HTTP reales (`Accept-Profile` / `Content-Profile`), que lecturas,
escrituras y llamadas a funciones van a `legacy`.

Con esto, `pnpm db:seed` ya no puede escribir en `public` de Papudo: en el
proyecto compartido escribe en `legacy`. (Igual no lo corras mientras no haga
falta: el seed hace `upsert` y pisaría ediciones hechas desde `/admin`.)

## Paso 4 · Vercel

No hace falta ninguna variable nueva (el esquema se elige solo por la URL).
Después de mezclar el PR, Vercel publica solo. **Comprobado el 2026-11-01**:
`https://directorio-turistico-bgl3.vercel.app/es/rutas` muestra las 3 rutas
con datos de `legacy`. El otro proyecto (`directorio-turistico.vercel.app`)
respondió 404 en su link `*.vercel.app`: confirmar en Vercel cuál queda y
apagar el otro (`docs/DOMINIO.md`, paso 1). Si quieres dejarlo explícito,
agrega `NEXT_PUBLIC_SUPABASE_SCHEMA=legacy` en los proyectos de Vercel del
diablo y haz Redeploy; **nunca `public`**.

## Paso 5 · Auth (afecta a los dos sitios, se revisa, no se cambia a ciegas)

Las cuentas de usuario (`auth.users`) también son compartidas:

- **Tu administrador del diablo** (1 fila en `legacy.admin_users`) sigue
  siendo la misma cuenta: entra a `/admin` con el mismo correo y contraseña.
- **Inicio de sesión anónimo** (lo usan "Mi recorrido" y los "me gusta"):
  Authentication → Sign In / Providers → **Allow anonymous sign-ins** tiene
  que estar activado. Es una opción del proyecto entero. **Activado el
  2026-11-01** (estaba apagado y por eso Mi recorrido, los "me gusta" y los
  comentarios no funcionaban). Comprobado en local contra la base real: dar
  "me gusta" y agregar al recorrido funcionan (la prueba se deshizo).
  **Revisado el 2026-11-01 contra el repo de Papudo** (`directorio_papudo`,
  migraciones 0001–0029): activarla no le da permisos de más a nadie en
  Papudo. Una sesión anónima entra como `authenticated`, pero en Papudo todo
  permiso de escritura o moderación pasa por `has_role(...)`, que exige una
  fila activa en `public.profiles` (un visitante anónimo no la tiene), y
  `verify_entity()` también lo revisa; lo que queda abierto a cualquiera
  (lecturas públicas) ya lo estaba para `anon`. En el diablo, `/admin` exige
  estar en `legacy.admin_users`. Recomendado al activarla: el límite de
  inicios anónimos por IP de Supabase (Authentication → Rate Limits) y, más
  adelante, CAPTCHA.
- **URL Configuration:** agrega el link del sitio del diablo a **Redirect
  URLs** (`https://<sitio-del-diablo>/**`) **sin cambiar el Site URL**, que
  hoy es de Papudo.

## Paso 6 · Revisión final

- [ ] `/es/explorar` muestra el mapa con las 5 comunas y sus lugares.
- [ ] La ficha de un pueblo muestra su resumen con fuente.
- [ ] Las fotos cargan.
- [ ] `/es/rutas` muestra las 3 rutas.
- [ ] El auspicio aparece.
- [ ] `/admin` deja entrar y guardar un cambio.
- [ ] "Mi recorrido": agregar un lugar funciona.
- [ ] El sitio de Papudo sigue exactamente igual.

## Rutas de la comuna de Petorca (`petorca-rutas.sql`)

El sitio acotado a Petorca (rama `petorca`) muestra solo rutas con todas sus
paradas en la comuna. `supabase/manual/petorca-rutas.sql` carga las dos:
"Donde el Diablo perdió el poncho" (Pedegua → Chincolco, slug
`ruta-del-diablo-pedegua-chincolco`) y "Ruta Ferroviaria: de Pedegua a Las
Palmas". El nombre de la primera lo decidió el usuario (2026-11-01, después de
probar "Ruta del Diablo: de Pedegua a Chincolco"); para cambiarlo en la base
basta volver a correr el script. Solo toca esas 2 rutas en `legacy`, verifica antes
que las 6 paradas existan en Petorca y es repetible. Se corre igual que el
paso 2 (SQL Editor → pegar → Run). Estado: **hecho (2026-11-01)**. Comprobado
desde fuera con la llave pública: las 2 rutas están publicadas y verificadas,
con sus paradas en orden (5 y 3), sin ruta con el nombre viejo; las 3 rutas de
la provincia y los 21 lugares de Papudo (`public`) siguen iguales.

Ojo: como la base es una sola, mientras el sitio de la provincia siga
publicado también va a mostrar estas 2 rutas (junto a la Ruta del Diablo).

## Copia de desarrollo (`legacy_dev`)

`supabase/manual/crear-legacy-dev.sql` crea en el mismo proyecto el esquema
`legacy_dev`, copia completa de `legacy` para el ambiente de desarrollo
(rama `develop` y vistas previas). Pasos y reglas en `docs/DESARROLLO.md`.

## Scripts de contenido de Petorca (2026-11-01)

Se pegan tal cual en el SQL Editor; cada uno se aplica solo en `legacy` y
`legacy_dev` (si existe), es repetible y, si algo falla, no cambia nada:

- `petorca-nombres-oficiales.sql`: nombre propio de las 2 rutas; portadas
  nuevas solo en `legacy_dev`.
- `categorias-petorca.sql`: categorías de Explorar (alojamiento, recreación,
  nombres nuevos) y la tabla `place_secondary_categories` (varias categorías
  por lugar). El sitio funciona antes y después de correrlo.
- `petorca-portadas.sql`: portadas nuevas en `legacy`, recién cuando `main`
  tenga los archivos.

## Cambios futuros en la base del diablo

Cada cambio de tablas se escribe como un archivo SQL en `supabase/manual/`,
con `legacy.` en **todo** (tablas, funciones, políticas) y `set search_path =
legacy` en las funciones, se prueba en una réplica local y se corre a mano en
el SQL Editor. Las migraciones numeradas de `supabase/migrations/` quedan
como historial del esquema original: sirven para armar una réplica local, no
para aplicarse al proyecto compartido.

## Si algo falla

| Síntoma                                       | Qué hacer                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `permission denied for schema legacy`         | Falta correr el paso 2.                                                                          |
| `Invalid schema: legacy`                      | Falta el paso 1 (Exposed schemas) o no se guardó.                                                |
| El sitio sigue sin lugares después del paso 2 | Falta publicar el PR (el sitio viejo busca en `public`), o Redeploy en Vercel.                   |
| `/admin` no deja entrar                       | Revisa que tu usuario esté en `legacy.admin_users` y que la URL del sitio esté en Redirect URLs. |
| Error "NEXT_PUBLIC_SUPABASE_SCHEMA=public …"  | Quita esa variable o ponla en `legacy`: `public` es de Papudo.                                   |
