# Guía: dominio propio (.cl) y un solo proyecto de Vercel

> Paso a paso para dejar el directorio en un link propio (por ejemplo
> `https://eldiablodepetorca.cl`) en vez de `*.vercel.app`, con todo lo que
> hay que tocar para que nada se rompa. Escrita el 2026-10-07. Los precios
> y las pantallas de NIC, Vercel y Supabase cambian: si algo no calza, manda
> lo que ves y se ajusta esta guía.

## Resumen en una mirada

| #   | Qué                                                            | Dónde                            | Tiempo aprox.                         |
| --- | -------------------------------------------------------------- | -------------------------------- | ------------------------------------- |
| 0   | Decidir nombre, titular y cuenta definitiva                    | —                                | 15 min                                |
| 1   | Dejar **un solo** proyecto de Vercel (y en la cuenta correcta) | vercel.com                       | 20 min                                |
| 2   | Comprar el dominio `.cl`                                       | nic.cl                           | 15 min + pago                         |
| 3   | Agregar el dominio al proyecto                                 | Vercel → Settings → Domains      | 5 min                                 |
| 4   | Delegar el DNS del dominio a Vercel                            | nic.cl → tu dominio              | 5 min + propagación (minutos a horas) |
| 5   | `NEXT_PUBLIC_SITE_URL` con el dominio nuevo + redeploy         | Vercel → Environment Variables   | 5 min                                 |
| 6   | Avisarle el dominio a Supabase (login del admin)               | Supabase → Authentication        | 5 min                                 |
| 7   | Que la base no se pause                                        | Supabase → Billing               | 5 min                                 |
| 8   | Google Search Console + sitemap                                | search.google.com                | 15 min                                |
| 9   | (Opcional) correo `contacto@tudominio.cl`                      | Proveedor de correo + Vercel DNS | 30 min                                |
| 10  | Pruebas finales                                                | Celular + computador             | 15 min                                |

El código **no necesita cambios**: el sitemap, los links oficiales para
Google (canonical/hreflang) y las vistas previas de WhatsApp salen de una sola
variable, `NEXT_PUBLIC_SITE_URL` (ver `getSiteUrl` en `src/lib/seo.ts`).

---

## 0. Decisiones antes de empezar

1. **Nombre del dominio.** Corto, fácil de dictar por teléfono y sin
   guiones si se puede. Ideas (no se revisó si están libres):
   `eldiablodepetorca.cl`, `diablopetorca.cl`, `rutadeldiablo.cl`,
   `petorcalaligua.cl`. Se revisa en el buscador de la portada de
   [nic.cl](https://www.nic.cl).
2. **Titular del dominio** (a nombre de quién queda). Es el dueño legal: si
   el proyecto es de Matichoc, conviene inscribirlo con el **RUT de la
   empresa**, no a nombre personal — después cambiar de titular es un
   trámite aparte.
3. **Cuenta de Vercel definitiva.** El sitio hoy se publica en **dos
   proyectos**: `directorio-turistico` y `directorio-turistico-bgl3` (los dos
   se reconstruyen con cada cambio en `main`). Hay que quedarse con uno solo,
   en la cuenta o equipo que va a pagar y administrar el sitio (por ejemplo,
   un equipo "Matichoc").
4. **Plan de Vercel.** El plan gratis (Hobby) es solo para uso personal y
   **no comercial**; un sitio con auspiciador (el banner de Matichoc) o que
   se ofrece a municipios entra en uso comercial, que según Vercel requiere
   el plan **Pro**. Revisa el precio vigente en vercel.com/pricing.

## 1. Un solo proyecto de Vercel, en la cuenta correcta

### 1a. Elegir cuál de los dos queda

En [vercel.com](https://vercel.com), abre cada proyecto y revisa:

- **Settings → Environment Variables**: el que sirve es el que tiene las
  variables completas (lista abajo).
- **Deployments**: el que tiene la última versión de `main` en
  "Production" y funcionando (abre su link y entra a `/es/explorar`).
- **Settings → Domains**: cuál link `*.vercel.app` vienes compartiendo.

Quédate con ese. Anota su link actual por si alguien lo tiene guardado.

Variables que debe tener (en **Production**, y idealmente también en
Preview):

| Variable                        | Para qué                                                    | ¿Secreta? |
| ------------------------------- | ----------------------------------------------------------- | --------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Dirección de la base de datos                               | No        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública de Supabase                                   | No        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Llave de administrador (solo servidor)                      | **Sí**    |
| `GOOGLE_PLACES_API_KEY`         | Fotos de Google y rutas por calle (solo servidor)           | **Sí**    |
| `NEXT_PUBLIC_SITE_URL`          | El dominio propio (paso 5)                                  | No        |
| `NEXT_PUBLIC_MAP_STYLE_URL`     | Opcional: estilo de mapa propio; vacío = OpenFreeMap oscuro | No        |

Las llaves de Supabase están en Supabase → Project Settings → API.

### 1b. Si el proyecto tiene que cambiarse a otra cuenta o equipo

Vercel permite transferir un proyecto **sin caída del sitio**:

1. Proyecto → **Settings → General** → al final, **Transfer Project**.
2. Elegir la cuenta o equipo de destino (o crear uno ahí mismo). Si el
   destino no tiene medio de pago, Vercel lo pide antes.
3. Revisar la lista de dominios, alias y variables que se mueven; si en el
   destino ya existe un proyecto con el mismo nombre, pide uno nuevo.
4. **Transfer.** Hay que ser dueño del equipo de origen y miembro del de
   destino.

Si un dominio no se mueve con el proyecto: quitarlo del proyecto viejo y
usar **Domains → Move** hacia el equipo nuevo. (Si haces este paso 1 antes
de comprar el dominio, no hay nada que mover.)

Guía oficial: [Transferring a project](https://vercel.com/docs/projects/transferring-projects).

### 1c. Pasar a Pro (si corresponde)

Equipo → **Settings → Billing** → Upgrade to Pro. Hazlo en el equipo donde
quedó el proyecto.

### 1d. Apagar el proyecto sobrante

Recién cuando el elegido funcione: abre el otro proyecto → **Settings →
General** → al final, **Delete Project**. Así cada cambio se publica en un
solo lugar y no quedan dos sitios distintos dando vueltas.

## 2. Comprar el dominio en NIC Chile

1. Entra a [nic.cl](https://www.nic.cl) y busca el nombre en el buscador de
   la portada.
2. Si está disponible: **Inscribir**. Te pide crear una cuenta en NIC (correo
   y contraseña) si no tienes.
3. Datos del **titular** (persona o empresa, con RUT — ver paso 0) y del
   contacto administrativo. Usa un correo que revises: ahí llegan los avisos
   de vencimiento.
4. Elegir el período (1 año o más; los períodos largos suelen salir más
   baratos por año) y **pagar en línea**. Como referencia, el año ronda los
   $10.000 CLP; la tarifa vigente está en nic.cl.
5. Cuando el pago se confirma, el dominio aparece en tu cuenta de NIC como
   activo. Todavía no apunta a ningún lado: eso es el paso 4.

> También se puede comprar a través de un "agente registrador" acreditado
> (lista en registry.nic.cl), pero comprando directo en NIC es más simple y
> queda todo en un solo lugar.

## 3. Agregar el dominio en Vercel

1. Proyecto → **Settings → Domains** → **Add**.
2. Escribe `tudominio.cl` (sin `www`). Vercel ofrece agregar también
   `www.tudominio.cl` y **redirigirlo** al principal: acéptalo (así las dos
   direcciones funcionan y Google ve una sola).
3. Vercel mostrará el dominio como "Invalid Configuration" hasta que hagas
   el paso 4. Es normal.

## 4. Apuntar el dominio a Vercel (DNS)

En NIC Chile lo que se configura son los **servidores de nombre (DNS)** del
dominio. Lo más simple es usar los de Vercel:

1. En Vercel, en el dominio recién agregado, elige la opción de **usar los
   nameservers de Vercel** (Vercel DNS). Te muestra dos o más nombres de
   servidor: **cópialos tal cual** desde ahí.
2. En [nic.cl](https://www.nic.cl), entra a tu cuenta → tu dominio →
   **modificar servidores de nombre / DNS**. Borra los que vengan por defecto
   y pega los de Vercel. Guarda.
3. Espera. La propagación toma desde minutos hasta unas horas. Cuando
   termina, Vercel marca el dominio como **Valid Configuration** y emite
   solo el certificado HTTPS (el candado).

Ventaja de delegar a Vercel: los registros extra (verificación de Google,
correo) se agregan después en Vercel → Domains → el dominio → **DNS
Records**, sin volver a NIC.

**Alternativa** (si prefieres no delegar todo a Vercel): delegar el DNS a
Cloudflare (gratis) y ahí crear los registros que pida Vercel: un registro
`A` para `tudominio.cl` y un `CNAME` para `www`, **con los valores exactos
que muestra Vercel** en la pantalla del dominio (pueden ser propios de tu
proyecto). En Cloudflare deja esos registros en "DNS only" (nube gris).

## 5. Decirle al sitio cuál es su dominio

1. Vercel → proyecto → **Settings → Environment Variables**.
2. `NEXT_PUBLIC_SITE_URL` = `https://tudominio.cl` (sin `/` al final), en
   **Production**.
3. **Deployments** → el último de Production → menú **⋯** → **Redeploy**.
   (Las variables `NEXT_PUBLIC_*` se graban al construir el sitio: sin
   redeploy no cambian.)

Desde ahí el sitemap, los links para Google y las vistas previas al
compartir usan el dominio nuevo.

## 6. Supabase: el login del admin con el dominio nuevo

1. Supabase → tu proyecto → **Authentication → URL Configuration**.
2. **Site URL**: `https://tudominio.cl`.
3. **Redirect URLs**: agrega `https://tudominio.cl/**` (y
   `https://www.tudominio.cl/**` si vas a usar www). Deja el link
   `*.vercel.app` también mientras haya gente usándolo.
4. Guarda.

Sin esto, entrar a `/admin` desde el dominio nuevo puede fallar o devolverte
al link viejo.

## 7. Que la base de datos no se pause

En el plan gratis, Supabase **pausa el proyecto si pasa 7 días con poca
actividad** (manda un correo antes). Pausado, el sitio queda sin lugares ni
pueblos. Se puede reanudar desde el panel, pero no conviene que pase justo
cuando un municipio entra a mirar.

- Recomendado antes de presentarlo: **Supabase → Organization → Billing →
  plan Pro** (los proyectos pagados no se pausan).
- Mientras tanto: revisa el correo del dueño de Supabase; si llega el
  aviso, entra al proyecto y se cancela la pausa.

## 8. Google Search Console (que Google encuentre cada lugar)

1. [search.google.com/search-console](https://search.google.com/search-console)
   → **Agregar propiedad** → tipo **Dominio** → `tudominio.cl`.
2. Google te da un registro **TXT**. Agrégalo en Vercel → Domains →
   `tudominio.cl` → **DNS Records** (tipo `TXT`, nombre vacío o `@`, valor el
   que dio Google). Vuelve a Search Console → **Verificar** (puede tardar
   unos minutos).
3. En Search Console → **Sitemaps** → agrega `https://tudominio.cl/sitemap.xml`.

Ahí vas a ver qué busca la gente en Google para llegar al sitio.

## 9. (Opcional) Correo con el dominio

Para escribirle a los encargados de turismo desde
`contacto@tudominio.cl`. Opciones:

- **Google Workspace** (pago, el más conocido) o **Zoho Mail** (tiene plan
  gratis limitado): cada uno te da registros `MX` (y `TXT` de SPF/DKIM) que
  se agregan en Vercel → Domains → DNS Records.
- **Solo reenvío** (ImprovMX u otro): recibes en tu Gmail lo que llegue a
  `contacto@tudominio.cl`; también son registros `MX` en Vercel.

## 10. Pruebas finales (checklist)

- [ ] `https://tudominio.cl` abre el sitio con candado (HTTPS).
- [ ] `https://www.tudominio.cl` redirige a `https://tudominio.cl`.
- [ ] `/es/explorar` abre en el mapa por sectores.
- [ ] Pegar el link en WhatsApp muestra la vista previa con imagen y título.
- [ ] `https://tudominio.cl/sitemap.xml` muestra links con el dominio nuevo
      (no `vercel.app`).
- [ ] `https://tudominio.cl/robots.txt` apunta al sitemap del dominio nuevo.
- [ ] `/admin` permite entrar y guardar un cambio.
- [ ] Una ficha de lugar con foto de Google carga la foto.
- [ ] En el celular, el sitio instalado como app (si lo tenías) se ve
      actualizado tras cerrarlo y abrirlo.
- [ ] Search Console verificado y sitemap enviado.

## Mantenimiento

- **Renovación del dominio**: NIC avisa por correo antes del vencimiento; si
  no se renueva, el dominio se pierde y otro lo puede inscribir. Pon un
  recordatorio propio un mes antes.
- **Vercel y Supabase**: medio de pago al día en las dos cuentas.
- **Quién tiene acceso**: anota en un lugar seguro (no en este repo) qué
  correo administra NIC, Vercel, Supabase y Google Cloud.

## Si algo falla

| Síntoma                                     | Causa probable / qué hacer                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel sigue en "Invalid Configuration"     | El DNS aún se propaga (espera unas horas) o los nameservers en NIC no quedaron guardados.                                                |
| El sitio abre pero sin candado              | Vercel aún emite el certificado; tarda unos minutos después de validar el dominio.                                                       |
| WhatsApp muestra el link viejo o sin imagen | Falta el redeploy tras `NEXT_PUBLIC_SITE_URL`, o WhatsApp tiene la vista previa en caché (prueba con otro chat o agrega `?v=2` al link). |
| `/admin` vuelve al link `vercel.app`        | Falta el paso 6 (Site URL / Redirect URLs en Supabase).                                                                                  |
| El sitio abre pero sin lugares ni pueblos   | Supabase pausado (paso 7) o variables de Supabase faltantes en el proyecto elegido (paso 1a).                                            |
| El celular muestra una versión vieja        | Cerrar y abrir la pestaña o la app instalada; la versión nueva se carga al recargar.                                                     |

Fuentes consultadas para esta guía: documentación de Vercel
([agregar un dominio](https://vercel.com/docs/domains/working-with-domains/add-a-domain),
[transferir proyectos](https://vercel.com/docs/projects/transferring-projects),
[plan Hobby](https://vercel.com/docs/plans/hobby),
[uso justo](https://vercel.com/docs/limits/fair-use-guidelines)),
Supabase ([pausa de proyectos gratis](https://supabase.com/docs/guides/platform/free-project-pausing))
y [nic.cl](https://www.nic.cl).
