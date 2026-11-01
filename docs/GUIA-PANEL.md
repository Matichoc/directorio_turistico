# Guía del panel: cómo usar el directorio día a día

> Escrita el 2026-11-01 para empezar a usar el sitio en serio y poder
> entregárselo a otras personas. Cifras de ese día: 20 lugares publicados en
> la comuna (10 verificados, 10 pendientes), 15 pueblos (6 con resumen), 2
> rutas y 5 categorías; 12 lugares todavía sin foto.

## 0. Antes de nada: dónde se edita lo real

Hay dos sitios y dos bases:

| Sitio                                               | Rama      | Datos                    | Para qué                           |
| --------------------------------------------------- | --------- | ------------------------ | ---------------------------------- |
| `directorio-turistico-bgl3.vercel.app` (publicado)  | `main`    | `legacy` (los reales)    | El contenido de verdad             |
| `directorio-turistico-bgl3-git-develop-…vercel.app` | `develop` | `legacy_dev` (una copia) | Probar sin miedo (franja amarilla) |

- **Lo que edites en desarrollo no pasa a producción.** Sirve para practicar
  y probar funciones nuevas.
- **Hoy el panel nuevo (Personas, Registro de cambios, varias categorías por
  lugar) solo está en `develop`.** El sitio publicado todavía tiene el panel
  anterior. Para editar el contenido real con todo lo nuevo hay que **pasar
  `develop` a `main`** (ver la sección 6).

## 1. Entrar

1. Abre `/admin` en el sitio (por ejemplo,
   `https://directorio-turistico-bgl3.vercel.app/admin`).
2. Entra con tu correo y tu clave.
3. ¿Alguien más va a ayudar? En **Personas** lo invitas con su correo y un
   rol; el panel te da un link para mandárselo por WhatsApp. Ese link sirve
   una vez y vence en 1 hora. Si alguien olvida su clave, desde Personas le
   generas un "Link para cambiar clave".

**Roles**

| Rol           | Puede                                                   |
| ------------- | ------------------------------------------------------- |
| Administrador | Todo, incluido invitar, cambiar roles y quitar personas |
| Editor        | Lugares, rutas, pueblos, comentarios y verificaciones   |

## 2. Lo que SÍ se edita desde el panel

### Lugares (`/admin/lugares`)

- **Crear** (`+ Nuevo lugar`) y **editar**: nombre y descripciones en
  español e inglés, comuna y pueblo, **categoría principal** (define el ícono
  y el color en el mapa) y **"También aparece en"** (más categorías),
  ubicación (latitud y longitud), dirección, teléfono, sitio web, ícono
  temático, estado de publicación y de verificación.
- **Activar / Desactivar** desde el listado: desactivar lo saca del sitio
  sin borrar nada (se puede volver a activar).
- **Descargar CSV** y **cargar CSV**: para editar muchos lugares de una vez en
  una planilla.
- La ubicación: en Google Maps, mantén apretado el punto exacto y copia los
  dos números (latitud, longitud). Mejor si la confirmas tú o el negocio.

### Rutas (`/admin/rutas`)

- Nombre y descripción (es/en), **duración estimada** (hoy las dos rutas
  dicen "sin estimar": complétala), estado de publicación y verificación.
- **Paradas**: agregar, quitar y cambiar el orden.

### Pueblos (`/admin/pueblos`)

- Nombre (es/en), **resumen** (es/en) con su **fuente** (enlace y nombre) y
  ubicación. Solo 6 de 15 tienen resumen: es un buen trabajo pendiente.

### Verificaciones (`/admin/verificaciones`)

- **Comentarios** de visitantes: aprobar o rechazar (nada se publica solo).
- **Datos por comuna**: marcar un lugar como verificado o desactualizado.

### Otros

- **Métricas**: vistas de lugares, rutas y pueblos, búsquedas, "me gusta" y
  lugares agregados a un recorrido. Sirve para mostrar uso real.
- **Comunas y categorías**: se ven (solo lectura) y se manejan las
  **características** (por ejemplo "Familiar", "Pet friendly").
- **Registro de cambios**: quién cambió qué y cuándo.
- **Mi cuenta**: cambiar tu clave y cerrar sesión.

## 3. Lo que NO se edita desde el panel (todavía)

Se cambia en el código o con un script de la base: pídeselo a quien
desarrolla.

| Qué                                                   | Dónde vive hoy                                    |
| ----------------------------------------------------- | ------------------------------------------------- |
| **Fotos de los lugares** (subir, ordenar)             | Base (`place_images`) / script de fotos de Google |
| **Portada de las rutas**                              | Base (`routes.cover_image`) + imagen en el sitio  |
| **Auspiciadores** (banner)                            | Base (`sponsors`)                                 |
| Enlaces de la Municipalidad                           | Base (`contact_links`)                            |
| Textos de las páginas (inicio, leyenda, información)  | Código (`src/messages/es.json` y `en.json`)       |
| Tarjeta de "Ruta turística oficial" (logo, Instagram) | Código (`lib/official-routes.ts`)                 |
| Crear categorías nuevas o cambiarles el nombre        | Script de la base                                 |
| Logo, fondos del diablo, íconos                       | Imágenes del sitio (`docs/PROMPTS-IMAGENES.md`)   |
| Fuentes citadas de un lugar                           | Base (`sources`)                                  |
| Calendario de fiestas                                 | No existe todavía                                 |

Los que más conviene sumar al panel después: **fotos**, **portada de
rutas** y **auspiciadores**.

## 4. Reglas de oro

1. **Desactivar, no borrar.** "Eliminar lugar" o "Eliminar pueblo" no se puede
   deshacer; "Desactivar" sí.
2. **No toques los lugares de otras comunas.** En el panel vas a ver unos 29
   lugares de La Ligua, Papudo, Zapallar y Cabildo: son de la versión de la
   provincia (rama `provincia-completa`) y viven en la misma base. El sitio de
   Petorca no los muestra; si los borras, se pierden para esa versión.
3. **"Verificado" = confirmado en terreno o por el dueño.** Lo que salió de
   internet queda "Pendiente" hasta confirmarlo (el sitio muestra un aviso
   ámbar).
4. **Nunca inventar.** Si no hay dato, mejor vacío que uno de relleno; los
   textos van con su fuente.
5. **No copiar de Google**: textos, fotos o reseñas. La ubicación sí la puedes
   confirmar mirando el mapa, pero el dato lo validas tú o el negocio.

## 5. Una rutina simple

- **Cada semana**: revisar Comentarios pendientes y Métricas.
- **Cada mes**: pasar por la lista de lugares "Pendientes" y confirmar los que
  se pueda (llamar, visitar); completar resúmenes de pueblos.
- **Cuando aparece un negocio nuevo**: pedirle nombre, ubicación (link de
  Google Maps), teléfono, una foto propia y dos líneas de descripción; cargarlo
  como Pendiente y verificarlo después.

## 6. Para dejarlo listo antes de mostrarlo

| Paso                                                                                           | Quién           |
| ---------------------------------------------------------------------------------------------- | --------------- |
| Pasar `develop` a `main` (que el sitio publicado tenga todo)                                   | Desarrollo      |
| Correr `supabase/manual/petorca-portadas.sql` en `legacy` (después de lo anterior)             | Tú (SQL Editor) |
| Fotos para los 12 lugares sin foto (propias o del script de Google)                            | Ambos           |
| Duración de las 2 rutas                                                                        | Tú (panel)      |
| Verificar los 10 lugares pendientes                                                            | Tú (panel)      |
| Cargar alojamientos con ubicación confirmada (Monhuaca, Petro-Chalaco, Tunquelén, Don Juanito) | Tú (panel)      |
| Dominio propio (`docs/DOMINIO.md`)                                                             | Tú + desarrollo |
| Permiso de las dos rutas oficiales para usar sus logos                                         | Tú              |

## 7. La reunión: qué mostrar en 10 minutos

Desde el celular, en el sitio publicado (después de pasar `develop` a
`main`). El orden cuenta una historia: el turista llega, se encanta, sale al
valle y el municipio lo administra.

1. **Inicio**: el diablo con su cucharón y el vuelo 3D del valle, de Pedegua a
   Chincolco. "Esto es Petorca, no la provincia".
2. **La leyenda** (`/leyenda`): tocar **Escuchar**. El folclore con fuentes
   (FUCOA, El Informador), leído en voz alta.
3. **Explorar**: las pestañas por categoría (Patrimonio y cultura, Naturaleza
   y aventura, Gastronomía, Alojamiento, Recreación) y el mapa con los pines.
   Un lugar puede estar en más de una.
4. **Una ruta oficial**: "Donde el Diablo perdió el poncho" o la Ruta
   Ferroviaria, con su logo y su Instagram. **Guardar para usar sin señal**
   y luego **Iniciar guía**: "en 80 m, dobla a la derecha", con voz, a pie o
   en auto.
5. **Mi recorrido**: armar uno con 3 paradas y **Compartir** por WhatsApp.
6. **El panel**: crear un lugar en 1 minuto, invitar a una persona como
   editora y mostrar el Registro de cambios ("cada cambio queda con nombre").
7. **Métricas**: lo que se puede medir para el municipio o la ruta.

**Cifras para decir**: 20 lugares reales con fuente, 15 pueblos, 2 rutas
oficiales, español e inglés, funciona sin señal, sin app que instalar
(se agrega a la pantalla de inicio), sin costo de mapas (OpenStreetMap).

**Qué ofrecer**: que el municipio, la oficina de turismo o las rutas
oficiales tengan sus propias cuentas de editor y mantengan sus datos; Matichoc
mantiene el sitio. Lo que se puede sumar después: calendario de fiestas (La
Merced, Quema de Judas, la veranada), subir fotos desde el panel y dominio
propio.

**Qué no prometer**: datos que no estén verificados, reseñas o fotos de
Google, ni lugares que nadie haya confirmado.
