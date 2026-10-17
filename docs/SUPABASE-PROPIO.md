# Guía: el directorio del diablo en su propio proyecto de Supabase

> Escrita el 2026-10-17. Situación: el proyecto de Supabase
> `qbfvsnkywlvozvxeujgh` (llamado **city_tour**) ahora lo usa el sitio de
> **Papudo** en su esquema `public`. Todo lo del diablo se movió, a propósito,
> al esquema **`legacy`** del mismo proyecto. El sitio del diablo todavía busca
> sus tablas en `public`, por eso no muestra lugares.
>
> Solución: darle al diablo su **propio** proyecto de Supabase y copiarle lo
> que está en `legacy`. **Nada de Papudo se toca**: del proyecto compartido
> solo se lee el esquema `legacy`, y todo lo que se escribe va al proyecto
> nuevo.

## Qué hay en `legacy` (consulta del 2026-10-17)

37 lugares (74 traducciones, 168 fotos, 47 fuentes), 5 comunas, 63 pueblos
(126 traducciones), 4 categorías, 4 tags, 3 rutas (22 paradas), 24 contactos,
2 auspiciadores, 37 eventos de métricas, 2 comentarios, 1 "me gusta", 1
recorrido y 1 administrador. Además una tabla `_archivo` (38 filas) que no es
del directorio.

## ⚠️ Hasta terminar: tres cosas que NO hacer en el repo del diablo

Mientras el repo y Vercel sigan apuntando al proyecto compartido:

1. **No correr `pnpm db:seed`**: cargaría los lugares del diablo encima de las
   tablas de Papudo.
2. **No correr `supabase db push` sin haber hecho antes el paso 3** (enlazar
   el proyecto nuevo): aplicaría las migraciones del diablo sobre Papudo.
3. **No usar el `/admin` del sitio del diablo**: escribiría en las tablas de
   Papudo.

## Resumen

| #   | Qué                                                  | Dónde                         |
| --- | ---------------------------------------------------- | ----------------------------- |
| 1   | Crear el proyecto nuevo del diablo                   | supabase.com                  |
| 2   | Configurar el inicio de sesión del proyecto nuevo    | supabase.com                  |
| 3   | Enlazar el repo al proyecto nuevo y crear las tablas | Terminal, en el repo          |
| 4   | Copiar `legacy` → proyecto nuevo (simulacro y copia) | Terminal, en el repo          |
| 5   | Recrear tu usuario administrador                     | supabase.com (proyecto nuevo) |
| 6   | Apuntar el sitio al proyecto nuevo                   | `.env.local` y Vercel         |
| 7   | Revisar que todo se vea                              | Navegador                     |
| 8   | Limpieza                                             | `.env.local`                  |

Los pasos 3, 4 y 6 necesitan un computador con el repo (el mismo donde ya
corriste `supabase db push` antes).

---

## 1. Crear el proyecto nuevo

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Nombre: por ejemplo `diablo-petorca`. Región: **South America (São
   Paulo)**. Plan: Free (o Pro si ya lo vas a presentar; ver abajo).
3. **Database password**: genera una y **guárdala** (la vas a necesitar en los
   pasos 3 y 4).
4. Espera a que el proyecto termine de crearse (un par de minutos).

Anota el **código del proyecto nuevo**: está en la URL,
`supabase.com/dashboard/project/<código>/...`.

> Si Supabase no te deja crearlo por el límite de proyectos gratis activos,
> las opciones son pasar esa organización a Pro o pausar otro proyecto que no
> uses. Eso lo decides tú; no hace falta tocar Papudo.

## 2. Configurar el inicio de sesión (proyecto nuevo)

1. **Authentication → Sign In / Providers** → activa **Allow anonymous
   sign-ins** ("Mi recorrido" y los "me gusta" lo usan).
2. **Authentication → URL Configuration**:
   - **Site URL**: el link del sitio (`https://<tu-proyecto>.vercel.app`, o el
     dominio propio si ya lo tienes).
   - **Redirect URLs**: agrega `https://<tu-proyecto>.vercel.app/**` (y el
     dominio propio con `/**` si lo tienes).

## 3. Enlazar el repo al proyecto nuevo y crear las tablas

En el computador, dentro del repo del diablo:

```bash
git checkout main && git pull        # trae el script de copia
pnpm install                         # instala lo nuevo (conector de Postgres)

supabase link --project-ref <código-del-proyecto-NUEVO>
# te pide la contraseña de la base del proyecto NUEVO (paso 1)

cat supabase/.temp/project-ref       # tiene que mostrar el código NUEVO
supabase db push                     # crea las tablas del diablo en el proyecto NUEVO
```

Si `cat` muestra `qbfvsnkywlvozvxeujgh` (el compartido), **detente**: el
enlace no cambió. Vuelve a correr `supabase link` con el código nuevo.

## 4. Copiar `legacy` → proyecto nuevo

### 4a. Las dos direcciones de conexión

En cada proyecto: botón **Connect** (arriba) → pestaña de cadenas de conexión
→ **Session pooler** → copia la **URI** y reemplaza `[YOUR-PASSWORD]` por la
contraseña de **ese** proyecto. Usa "Session pooler" (la "Direct connection"
no funciona desde muchas redes).

- **Origen** (proyecto compartido `qbfvsnkywlvozvxeujgh`, city_tour).
- **Destino** (proyecto nuevo del diablo).

Agrégalas al final de `.env.local` (ese archivo no se sube al repo):

```
LEGACY_DATABASE_URL=postgresql://postgres.qbfvsnkywlvozvxeujgh:<clave-compartido>@...:5432/postgres
TARGET_DATABASE_URL=postgresql://postgres.<código-nuevo>:<clave-nuevo>@...:5432/postgres
```

### 4b. Simulacro (no guarda nada)

```bash
pnpm db:copy-legacy
```

Copia todo dentro de una transacción, compara las cantidades y **deshace**.
Tiene que terminar con `✓ Simulacro OK` y una lista con `✓` en cada tabla
(37 lugares, 63 pueblos, 168 fotos, etc.).

### 4c. Copia de verdad

```bash
pnpm db:copy-legacy --aplicar
```

Termina con `✓ Copia guardada en el proyecto nuevo.`

### Qué garantiza el script (`scripts/copy-from-legacy.ts`)

- **El origen es de solo lectura**: la sesión con el proyecto compartido se
  pone en modo solo lectura (Postgres rechaza cualquier escritura) y solo lee
  el esquema `legacy`. `public` (Papudo) ni se consulta.
- **El destino no puede ser el proyecto compartido**: si
  `TARGET_DATABASE_URL` trae `qbfvsnkywlvozvxeujgh`, se detiene sin hacer
  nada. Tampoco corre si origen y destino son la misma base.
- **El destino tiene que tener las tablas del diablo** (paso 3) y **estar
  vacío**. Para repetir la copia sobre el proyecto nuevo: `pnpm
db:copy-legacy --reemplazar --aplicar` (vacía antes las tablas del
  directorio del destino).
- **Todo o nada**: si una tabla falla o una cantidad no calza, se deshace
  completo.
- Probado contra una copia local que imita la situación (diablo en `legacy`,
  Papudo en `public`): datos idénticos tabla por tabla y la base compartida sin
  ningún cambio (misma huella antes y después).

### Lo que no se copia (queda en `legacy`, intacto)

Las cuentas de usuario viven en el proyecto compartido y no se pueden llevar
con el script, así que no se copian las tablas que dependen de una cuenta:
`admin_users` (tu admin se recrea en el paso 5), los 2 comentarios, el
"me gusta" y el recorrido (con sus 7 paradas). Por lo que se ve, eran pruebas.
Si quieres conservar el texto de los 2 comentarios, avísame y lo vemos aparte.
La tabla `_archivo` tampoco se copia porque no es del directorio.

## 5. Recrear tu usuario administrador (proyecto nuevo)

1. **Authentication → Users → Add user → Create new user**: tu correo y una
   contraseña, con **Auto Confirm User** marcado.
2. Copia el **UID** del usuario creado.
3. **SQL Editor** (del proyecto **nuevo**) → corre:

```sql
insert into public.admin_users (user_id) values ('<UID-copiado>');
```

## 6. Apuntar el sitio al proyecto nuevo

En el proyecto nuevo: **Project Settings → API Keys**. Necesitas la URL del
proyecto, la llave **publishable** (`sb_publishable_…`) y la **secret**
(`sb_secret_…`).

**En `.env.local`** (para tu computador):

```
NEXT_PUBLIC_SUPABASE_URL=https://<código-nuevo>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
SUPABASE_SERVICE_ROLE_KEY=sb_secret_…
```

Prueba con `pnpm dev` → `http://localhost:3000/es/explorar`.

**En Vercel** (en cada proyecto que publique el diablo; hoy son dos,
`directorio-turistico` y `directorio-turistico-bgl3`): **Settings →
Environment Variables** → cambia esas mismas tres → **Deployments** → último
de Production → **⋯ → Redeploy**.

`GOOGLE_PLACES_API_KEY` no cambia: las fotos de Google se copian con sus
referencias y siguen funcionando.

## 7. Revisión final

- [ ] `/es/explorar` muestra el mapa con las 5 comunas y sus lugares.
- [ ] La ficha de un pueblo (p. ej. `/es/pueblos/la-ligua`) muestra su resumen.
- [ ] Las fotos de los lugares cargan.
- [ ] `/es/rutas` muestra las 3 rutas.
- [ ] El auspicio (Matichoc) aparece.
- [ ] `/admin` deja entrar con el usuario del paso 5 y guardar un cambio.
- [ ] "Mi recorrido": agregar un lugar funciona.
- [ ] El sitio de Papudo sigue igual (no se tocó nada, pero vale mirarlo).

## 8. Limpieza

- Borra `LEGACY_DATABASE_URL` y `TARGET_DATABASE_URL` de `.env.local`
  (tienen contraseñas).
- El esquema `legacy` del proyecto compartido **queda como respaldo**. Si
  algún día se quiere borrar, es una decisión aparte (y desde el lado de
  Papudo, no desde este repo).
- Desde ahora, `pnpm db:seed` y `supabase db push` en este repo van al
  proyecto nuevo del diablo, que es lo correcto.

## Si algo falla

| Síntoma                                             | Qué hacer                                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `TARGET_DATABASE_URL apunta al proyecto compartido` | Pusiste la URL del compartido como destino. Usa la del proyecto nuevo.                          |
| `El destino no tiene las tablas del directorio`     | Falta el paso 3 (`supabase link` al nuevo + `supabase db push`).                                |
| `El destino ya tiene datos en: …`                   | Ya copiaste antes. Si es el proyecto nuevo: `pnpm db:copy-legacy --reemplazar --aplicar`.       |
| `password authentication failed`                    | La contraseña de esa URL no corresponde a ese proyecto; revisa `[YOUR-PASSWORD]`.               |
| `ENOTFOUND` / `timeout` al conectar                 | Usa la URI de **Session pooler**, no la "Direct connection".                                    |
| El sitio sigue sin lugares después del paso 6       | Falta el Redeploy en Vercel, o quedó alguna de las tres variables con el proyecto compartido.   |
| `/admin` no deja entrar                             | Revisa el paso 5 (UID en `admin_users` del proyecto **nuevo**) y el paso 2 (URL Configuration). |
