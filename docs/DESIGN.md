# Lineamientos de diseño — El diablo murió en Petorca

> Documento vivo (igual que `docs/PLAN.md`): cuando agregues una página, un
> componente o un color/animación nuevo, primero revisa si ya hay un token o
> patrón acá que sirva, y si agregas uno nuevo, anótalo acá también. La idea
> es que una página nueva "se sienta del mismo sitio" sin tener que copiar a
> ojo cómo se ve otra, y que un cambio de color/tono se replique solo en vez
> de tener que ir página por página.

## Regla de oro: un solo lugar de verdad por tipo de token

Nunca metas un color, ícono o animación nueva directo en un componente
puntual (`style={{ color: "#123456" }}`, un `@keyframes` local, un SVG de
ícono copiado a mano). Se agrega en su archivo fuente único y desde ahí se
usa en todos lados — así que agregarlo una vez lo "replica" en toda página
que use ese token, que es justo lo que se pidió:

| Tipo de token                           | Fuente única                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| Color / espaciado base                  | `src/app/globals.css` (`:root`, `@theme inline`)                                 |
| Color y gradiente por categoría         | `src/lib/ui/category-gradient.ts`                                                |
| Ícono por categoría o por lugar puntual | `src/components/ui/category-icon.tsx` (paths) + `getCategoryIcon`/`getPlaceIcon` |
| Animación (`@keyframes` + `animate-*`)  | `src/app/globals.css`                                                            |

## Principios generales

- **Fotos reales > ícono de relleno, siempre.** Todo componente que muestra
  una foto (`PhotoOrIcon`, `PlacePhotoHero`, `RouteCard`) cae a un ícono +
  gradiente de categoría si no hay foto o si falla la carga — nunca a un
  hueco vacío ni a una foto genérica de stock.
- **Nunca fabricar datos.** Tags, íconos "de la zona", leyendas o
  puntuaciones solo se muestran si hay contenido real detrás (ver
  `docs/PLAN.md`, sección Bitácora, para varios ejemplos de esto aplicado).
  Si un dato no existe todavía, la UI debe poder no mostrar nada (no-op),
  no inventar un placeholder que parezca real.
- **Toda página de contenido lleva la cabecera "mística"** (`PageHero`,
  `src/components/ui/page-hero.tsx`) — mismo gradiente oscuro
  (`from-[#1b0e1f] via-[#2a1420] to-[#1b0e1f]`) + `SparkleField` + halo
  `glow-pulse` que el hero del home, pero como tarjeta contenida
  (`rounded-2xl`), no a todo el ancho. Pedido explícito del usuario: "todo
  el sitio debe conservar la mística de la zona" (antes esto vivía solo en
  el home; ver `docs/PLAN.md` bitácora). Toda página nueva con un `<h1>`
  de título debería usar `<PageHero title={...} subtitle={...} />` en vez
  de un `<h1>` suelto — así se replica sola. Ojo: el contenido _dentro_ de
  `PageHero` (aparte de `title`/`subtitle`) tiene que verse bien en texto
  blanco sobre fondo oscuro — no metas ahí un control pensado para fondo
  claro (ej. `ViewToggle`, que usa `text-foreground/60`) sin adaptarlo
  primero; en `/explorar` ese control quedó fuera del `PageHero`, debajo.
  `MunicipalityBanner` usa el mismo gradiente + `SparkleField` (pedido del
  usuario: "más contraste" en los banners, efecto wow) — es la otra
  excepción a "solo cabeceras de página": un banner real, no un control
  suelto, así que el tratamiento místico completo sí le calza.
  Las páginas con su propia foto/portada a color (`PlacePhotoHero`, hero de
  ficha de ruta) no llevan `PageHero` encima — ya tienen su propio momento
  visual, duplicarlo se ve recargado.
- **El folclore del diablo es un condimento, no un tema constante.** El
  `DevilMascot` (la cabeza del diablo campesino, `icons/icon-192.png`) solo
  aparece donde tiene sentido narrativo (la ruta del poncho,
  `ruta-del-diablo-pedegua-chincolco`) — no ponerlo en cualquier página
  nueva "porque sí".
- **Foco visible**: todo link, botón o campo muestra un anillo de brasa
  (`--accent`) al llegar con el teclado (`:focus-visible` en `globals.css`).
  No apagarlo con `outline-none` sin poner otro indicador igual de visible.

## Color

Definidos en `src/app/globals.css`, con variante para `prefers-color-scheme:
dark` — usa siempre la clase/token de Tailwind (`bg-accent`,
`text-accent-foreground`, `border-accent-soft`), nunca el hex a mano:

| Token                                                                                     | Uso                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--background` / `--foreground`                                                           | Fondo/texto base del sitio, **oscuro de punta a punta** (`#07060c` / `#ecebf6`) — pedido del usuario tras probar el sitio claro: "más oscuro, tecnológico, con efecto wow". Antes: crema `#fbf4ee` (y antes blanco puro). |
| `--accent` / `--accent-foreground` / `--accent-soft`                                      | Color de marca del sitio (brasa, `#ff7a45`). Botones primarios, bordes, glow de hover (`--accent-soft` es un tinte translúcido pensado para halos).                                                                       |
| `--neon` / `--neon-2`                                                                     | Violeta y cian "tecnológicos": segundo y tercer color de los degradados neón (`glow-edge`, `text-gradient`, chips de conteo). Nunca como color de texto largo.                                                            |
| `--sponsor` / `--sponsor-foreground` / `--sponsor-accent` / `--sponsor-accent-foreground` | Solo para `SponsorBanner` — son los colores reales de la marca Matichoc (ver `matichoc/matiweb`), no la paleta del sitio. No reusar en otro lado.                                                                         |

Colores **por categoría** (`naturaleza`/`gastronomia`/`cultura`/`playa`),
en `lib/ui/category-gradient.ts`:

- `getCategoryGradient(categorySlug)` → gradiente de fondo para heroes/tarjetas sin foto.
- `getCategoryPinColor(categorySlug)` → color sólido para pines de mapa y `CategoryBadge`.
- `getCategoryIcon(categorySlug)` / `getPlaceIcon(categorySlug, placeIcon)` → ver sección Íconos.

Agregar una categoría nueva = agregar una entrada a los tres `Record` de
ese archivo, nunca un `if` especial en un componente.

## Vidrio y neón (look oscuro/tecnológico)

El sitio es oscuro siempre: `dark:` de Tailwind sigue la clase `dark` del
`<html>` (`@custom-variant` en `globals.css`), no el modo del sistema, así
que todo `dark:` ya escrito vale para todos. Fondo de todo el sitio
(`body::before/::after`): aurora animada (acento + violeta + cian, respeta
`prefers-reduced-motion`) y una cuadrícula fina que se desvanece hacia
abajo. Utilidades en `globals.css` — úsalas en vez de inventar bordes/fondos
sueltos:

- `surface-glass`: la superficie base de toda tarjeta/panel (vidrio oscuro
  con borde y brillo superior).
- `glow-edge`: borde de degradado neón que se enciende en hover o con
  `data-open="true"` (comunas y pueblos de `/explorar`).
- `text-gradient`: título con degradado y barrido de luz (`PageHero`,
  encabezados de comuna).

`PageHero` suma cuadrícula, tres halos (brasa/violeta/cian) y una línea de
luz superior.

**Mapa base oscuro**: `MapView` agrega la clase `map-dark` (en `globals.css`)
cuando se usa el estilo por defecto (OpenFreeMap "liberty", claro): invierte
el canvas y le devuelve el tono, así el mapa queda oscuro a juego con el
sitio y el agua sigue azul. Solo afecta al canvas — los pines son HTML y
conservan sus colores. Con un estilo propio (`NEXT_PUBLIC_MAP_STYLE_URL`,
p. ej. uno oscuro de un proveedor comercial) no se aplica.

**Globos y controles del mapa**: MapLibre los trae blancos; en `globals.css`
van en la paleta oscura (fondo `#120c1c`, texto `--foreground`, controles e
íconos invertidos) para todo mapa del sitio — antes el globo de un pin
mostraba texto claro sobre fondo blanco, ilegible (feedback real). Los
selectores llevan `.maplibregl-map` delante porque `maplibre-gl.css` se carga
después de `globals.css` y ganaría.

## Postales "¿Qué buscas hoy?" (home)

Cada categoría es una postal alta con la escena del diablito que le toca
(`getSceneForCategory`), un degradado oscuro abajo para que el texto se
lea, un halo del color de la categoría y la cantidad real de lugares (sin
número si no hay ninguno). Al pasar el mouse la escena se acerca lento y la
tarjeta se enciende con el glow de siempre. Pedido del usuario: las tarjetas
planas con un ícono "no me gustan".

## Sitio acotado a una comuna (`lib/site-scope.ts`)

Desde 2026-11-01 (rama `petorca`) el sitio muestra solo la comuna de
Petorca, sin perder el look ni el folclore. Lo visual que dependía de "varias
comunas" se adapta solo cuando hay una:

- **Vuelo 3D**: con una sola comuna, la cámara va de **pueblo en pueblo** por
  **todos** los pueblos con coordenada, tengan o no atractivos, de oeste a
  este (en Petorca, los 15: de Las Palmas a Chalaco), y el botón lleva a la
  ficha del pueblo; la vista general encuadra esas paradas. Pedido del
  usuario: "hay pueblos que se van a enojar si no los nombramos". Por lo mismo,
  ningún texto nombra a unos pueblos y no a otros: se habla de "sus N pueblos"
  (N sale de la base), y la tarjeta de un pueblo sin atractivos cargados no
  dice "sin atractivos" (solo su nombre, su resumen y su ficha).
- **Mapa de `/explorar`**: con una sola comuna no hay sectores (burbujas por
  comuna); arranca directo en los pines.
- **Postales "¿Qué buscas hoy?"**: solo las categorías con lugares reales
  (en Petorca: naturaleza y cultura) — nunca una postal que lleve a una lista
  vacía.
- **Rutas**: solo las que tienen todas sus paradas en la comuna.
- **Panel (`/admin`)**: Lugares, Pueblos, Rutas, Verificaciones, Métricas,
  la exportación CSV y los selectores de pueblo usan el mismo alcance (pedido
  del usuario: no ver los lugares de otras comunas guardados en la base).
  Nada se borra; una ruta nueva sin paradas sí se lista.

Los textos (`messages/*.json`) hablan de "la comuna de Petorca". Volver a la
provincia es vaciar `SITE_COMMUNE_SLUGS` (y los textos están en la rama
`provincia-completa`).

## Vuelo 3D por la provincia (home)

El "efecto wow" del inicio (`ProvinceFlyover`, `components/home/`): el
relieve real de la provincia en 3D, del mar a la cordillera, con la cámara
recorriendo las cinco comunas. Sin mapa de calles: el estilo se arma solo con
el modelo de elevación abierto de AWS (Terrain Tiles, formato Terrarium, sin
API key) — terreno 3D + sombreado de laderas + color por altura en la paleta
del sitio (mar azul noche → valles violeta → cordillera brasa). Reglas:

- **Relieve servido desde el propio sitio** (`public/terrain/{z}/{x}/{y}.webp`,
  generado con `scripts/build-terrain-tiles.py`, límites en
  `lib/maps/terrain.ts`): pedido directo al bucket de AWS en EE.UU. llegaba
  tarde (≈0,5 s por tesela desde Chile, de a 6 por vez) y el vuelo se veía
  lento y sin detalle — feedback real del usuario. Ahora sale de la caché de
  Vercel, por HTTP/2, cacheado para siempre; WebP **sin pérdida** porque las
  alturas van codificadas en los colores. Detalle (zoom 11-12) solo en la
  provincia; margen con menos detalle hasta el mar y la cordillera para el
  horizonte. Si se agranda la cobertura, cambiar el script **y**
  `TERRAIN_BOUNDS` juntos.
- **Fluidez**: la cámara vuela casi sin alejarse (`curve` bajo, zoom de
  parada 11,6 dentro del detalle disponible); el relieve de las paradas se
  precarga en segundo plano (no con "ahorro de datos"); los pueblos son una
  capa del mapa (GPU) y solo las cabeceras son marcadores HTML; resolución
  tope 2x; y nada con `backdrop-filter` encima del mapa (el desenfoque de
  fondo se recalcula en cada cuadro). El recorrido arranca cuando el relieve
  visible ya se dibujó (o a los 5 s, lo que pase primero).

- **Datos reales**: `buildProvinceFlyover` (`lib/ui/province-flyover.ts`)
  ubica cada comuna en su cabecera (o en otro pueblo de la comuna con
  coordenada) y cuenta pueblos y atractivos reales; una comuna sin ninguna
  coordenada queda fuera. Los puntos de luz son los pueblos con coordenada
  (los de cabecera, más grandes y con nombre) y llevan a su ficha.
- **Liviano hasta que lo piden** (pedido del usuario: "no todos van a querer
  ver eso"): al entrar se ve una imagen fija del mismo relieve
  (`public/vuelo/vuelo-poster.webp`, ~90 KB, `scripts/capture-flyover-poster.mjs`)
  con "▶ Ver el vuelo 3D", un aviso de cuántos datos usa y los pueblos. El 3D
  (motor del mapa + relieve, ~4 MB) se descarga recién al tocar el botón o un
  pueblo (ese abre el 3D y vuela directo a él). Medido: el inicio completo
  pasó de ~6,4 MB a 2,6 MB para quien no lo abre. Si cambia el relieve, los
  pueblos o el estilo del vuelo, volver a correr el script de la imagen.
- **Recorrido**: arranca solo al abrir el 3D con el botón, vuela de oeste a este (del mar a la cordillera) mostrando una
  tarjeta por comuna con link a `/explorar?comuna=…`, y vuelve a la vista
  general. Cualquier gesto del usuario lo detiene; sin interacción la cámara
  gira lento.
- **Costo**: MapLibre se descarga recién al tocar "Ver el vuelo 3D"
  (`next/dynamic`); fuera de pantalla no se anima nada (`IntersectionObserver`). Sin WebGL la sección no se muestra. Con movimiento reducido no hay
  vuelo ni giro (saltos directos). `cooperativeGestures`: en celular el mapa
  no secuestra el scroll de la página (se mueve con dos dedos).

## Logo e íconos

Un solo origen: `public/brand/logo.png` (insignia, transparente) e
`icono.png` (cabeza del diablo), arte aprobado hecho con GPT
(`docs/PROMPTS-IMAGENES.md`). `node scripts/build-brand-png.mjs` arma desde ahí
todo lo demás — nunca editar a mano los archivos generados:

| Archivo generado                     | Dónde se ve                                    |
| ------------------------------------ | ---------------------------------------------- |
| `src/app/favicon.ico`, `icon.png`    | Pestaña del navegador                          |
| `src/app/apple-icon.png`             | Ícono al agregar a inicio en iPhone            |
| `public/icons/icon-192/512.png`      | App instalable (manifiesto) y barra de arriba  |
| `public/icons/icon-maskable-512.png` | App instalable en Android (recorte en círculo) |
| `public/brand/og.png`                | Vista previa al compartir un link sin foto     |
| `public/brand/logo.webp`             | Título del inicio (el logo, sin margen)        |

## Aparición al hacer scroll

Clase `reveal` (en `globals.css`): las secciones y tarjetas suben y aparecen
al entrar en pantalla, con animaciones guiadas por el scroll de CSS — sin
JavaScript. Navegadores sin soporte, o con movimiento reducido, ven el
contenido normal desde el principio (nunca queda algo invisible). Se usa en
las secciones del home, las comunas de `/explorar` y las tarjetas de rutas.
No ponerla en un contenedor con hijos `position: fixed` (la transformación
los rompería).

## Fondos con el diablito (escenas)

Pedido del usuario: fondos únicos con el diablo "en la playa, en el cerro,
con poncho, según cómo lo busquen y dónde naveguen". Son SVG en
`public/fondos/` (`atardecer`, `playa`, `cerro`, `pueblo`, `dulces`,
`tunel`), compuestos con el diablito a la derecha y el cielo a la izquierda
para que el título de `PageHero` quede legible.

**El diablo de Petorca** (desde 2026-11-02, `docs/arte/diablo-campesino-referencia.png`):
un hombre de campo de unos 50 años, clásico y pícaro — sombrero con cuernos,
poncho rojo con flecos dorados, pañuelo rojo y **cucharón de madera con borla
roja y dorada**. Reemplazó al diablito de mascota (2026-11-01), que a su vez
reemplazó al de la provincia (casco minero, surf, dulces). Las escenas
`atardecer`, `cerro`, `pueblo` y `tunel`, la portada ferroviaria y las escenas
de `public/leyendas/` son WebP de ese arte; `playa` y `dulces` (solo
provincia) siguen en SVG. El logo con el nombre del sitio ("El diablo murió
en Petorca", túnel, puente e iglesia) llegó el 2026-11-03 a
`public/brand/logo.png`; los íconos siguen saliendo de la cara (`icono.png`),
que se lee mejor en chico. "Donde el Diablo perdió el poncho" lleva desde
2026-11-03 su portada propia con el personaje nuevo (sentado
en una piedra al atardecer, `ruta-del-diablo-pedegua-chincolco-campesino.webp`,
`supabase/manual/portada-poncho-definitiva.sql`); antes, de prestado, la
escena de la Escalera del Diablo.

**Recorte**: cada arte del diablo (escenas, portadas de ruta, escenas de la
leyenda) tiene su encuadre en `ART_POSITION` (`lib/ui/scene-backgrounds.ts`,
por archivo): en horizontal, la cara; en vertical, el borde de arriba del
sombrero. Así la cabeza entra entera en cualquier recuadro, ancho o angosto, y
lo que se recorta son las botas — antes, con el foco en la cara o centrado, las
cabeceras anchas (ficha de ruta, tarjeta de la leyenda) le cortaban la cabeza
(feedback real: "se están viendo como cortada la cara del protagonista").
Lo usan todas las vistas: `SCENE_POSITION` (`PageHero`, hero del inicio,
postales, tarjeta de la leyenda, reportajes, burbujas del mapa) y
`getArtPosition(src)` para una imagen suelta (`RouteCard`, hero de la ficha de
ruta, escenas de `/leyenda`); una foto real devuelve `undefined` y conserva su
encuadre de siempre. Nunca un `background-position`/`object-position` escrito
a mano; un arte nuevo = su entrada en `ART_POSITION`. En el hero del inicio, desde `sm:` el título, el texto y el buscador
ocupan el 62 % izquierdo para no taparle la cara. Desde 2026-11-03 el título
del inicio es el logo (`logo.webp`, con el nombre como texto oculto en el `<h1>`;
pedido del usuario: el logo "en compartir e inicio"), y la imagen al
compartir (`og.png`) es el logo sobre la noche con "Rutas, pueblos y leyendas
de la comuna" (180 KB, con paleta: más pesada, WhatsApp a veces no la muestra). En el atardecer nuevo el
diablo está al centro: las cabeceras anchas (inicio, `PageHero`) usan el
cerro, el pueblo o el túnel, con el diablo a la derecha; el atardecer queda
para las postales altas.

## Radios y espaciado

- **Tarjetas** (`PlaceCard`, `RouteCard`): `rounded-2xl`, borde
  `border-accent-soft` (o ámbar si está destacado), `hover:-translate-y-0.5`
  - glow de sombra al pasar el mouse (ver abajo).
- **Insignias/píldoras** (`CategoryBadge`, `FeaturedBadge`, badge de
  cantidad de fotos, tags): siempre `rounded-full`, texto `text-[11px]` o
  `text-xs`, `px-2 py-0.5`/`py-1`.
- **Botones de acción** (iniciar navegación, agregar a recorrido, CTA de
  estado vacío): `rounded-full`, `px-4 py-2`, `text-sm font-medium`.
- Ritmo de separación entre bloques: `gap-2` (elementos muy relacionados,
  ej. ícono + texto), `gap-3`/`gap-4` (tarjetas en una lista, secciones de
  una página).

## Brillo al pasar el mouse ("glow")

Patrón repetido en `PlaceCard`, `RouteCard` y los pines de mapa cercanos
(`MapPin`, prop `near`): un `box-shadow` de color a juego que aparece o se
intensifica en hover/estado activo, nunca un cambio de color plano. Ejemplo
real (`place-card.tsx`):

```
hover:border-accent hover:shadow-[0_0_20px_2px_var(--accent-soft)]
```

— con variante ámbar (`rgba(245,158,11,0.35)`) cuando el elemento está
"destacado" (`isFeatured`), para que destacado y hover nunca se confundan.

## Movimiento

Todas las animaciones viven en `globals.css` como `@keyframes` +
`--animate-*` (así Tailwind genera la clase `animate-<nombre>`):

| Clase                     | Para qué                                | Dónde se usa hoy                                     |
| ------------------------- | --------------------------------------- | ---------------------------------------------------- |
| `animate-pin-pop`         | Aparición con rebote                    | Pines de mapa nuevos                                 |
| `animate-stop-in`         | Aparición escalonada (delay por índice) | Checklist de paradas de ruta                         |
| `animate-check-pop`       | Rebote al marcar/desmarcar algo         | Checkbox de parada visitada, mensaje "ruta completa" |
| `animate-route-glow`      | Halo pulsante suave                     | Próxima parada por visitar en el checklist           |
| `animate-sparkle-twinkle` | Parpadeo de chispa                      | `SparkleField` (hero del home y `PageHero`)          |
| `animate-glow-pulse`      | Halo que "respira"                      | Fondo del hero del home, `PageHero`, `PlayerToken`   |
| `animate-devil-peek`      | Vaivén curioso                          | `DevilMascot`                                        |
| `reveal` (`reveal-up`)    | Aparición guiada por el scroll          | Secciones del home, comunas de `/explorar`, rutas    |
| `animate-aura-ripple`     | Ondas que se abren                      | Tema playa (`ThemeAura`)                             |
| `animate-aura-rise`       | Burbujas que suben                      | Temas dulces y sabores (`ThemeAura`)                 |
| `animate-aura-flicker`    | Luz de farol que titila                 | Temas historia y diablo (`ThemeAura`)                |
| `animate-aura-ember`      | Brasas que saltan                       | Tema diablo (`ThemeAura`)                            |

Antes de escribir un `@keyframes` nuevo: revisa si alguno de estos ya sirve
para el efecto que quieres (una aparición, un pulso, un rebote) en vez de
duplicar uno casi igual con otro nombre.

## Íconos

`src/components/ui/category-icon.tsx` tiene un solo `Record<string,
string>` (`ICON_PATHS`) con los paths SVG de: `mountain`, `utensils`,
`landmark`, `waves` (por categoría) y `dulce`, `tejido`, `diablo`, `surf`,
`casco-minero`, `palta` (temáticos "de la zona") y `calendario` (eventos).

- **Categoría** → `getCategoryIcon(categorySlug)`.
- **Lugar puntual** → `getPlaceIcon(categorySlug, place.icon)`; `place.icon`
  viene del campo `places.icon` (migración `0010_place_icon.sql`, dato en
  la base, no un mapa fijo en código) y gana sobre el ícono de categoría
  cuando tiene valor.
- **Regla al asignar un ícono temático a un lugar**: solo si el contenido
  real de ese lugar (su descripción/fuente en `scripts/seed.ts`) ya lo
  justifica — nunca una asignación decorativa forzada. Si no calza ningún
  ícono del catálogo, se deja `icon: null` y cae al de categoría.
- Agregar un ícono nuevo a la paleta = un nuevo path en `ICON_PATHS`, nunca
  un componente SVG suelto en otro archivo.

## Fotos y "cover" de contenido

- **Lugares** (`PlaceCard`, `PlacePhotoHero`): foto real desde
  `place_images` (Wikimedia, Google Places vía proxy, o subida a mano),
  con `PhotoOrIcon` como envoltorio único que decide foto-vs-ícono y maneja
  el `onError` — no reimplementar ese fallback en un componente nuevo.
- **Fotos de Google** (`/api/place-photo`): el `name` de una foto de Google
  vence, así que el proxy pide en el momento las fotos vigentes del lugar
  (cacheadas una hora) y sirve la del mismo autor que dice el crédito
  guardado (`lib/google/place-photo-ref.ts`). Si ese autor ya no está, no
  sirve otra foto con su nombre: cae al ícono. Antes de este arreglo
  (2026-11-01) no cargaba ninguna; ahora cargan 35 de las 38 de Petorca.
- **Ilustración con IA** (pedido del usuario: "dejar evidencia de que las
  imágenes están generadas con IA" hasta que lleguen fotos reales): todo arte
  del diablo lleva `AiArtLabel` (`components/ui/ai-art-label.tsx`), una
  píldora chica abajo-derecha — donde las fotos llevan su crédito — o en la
  esquina libre si esa está ocupada (postales: arriba-izquierda; reportajes:
  arriba-derecha). Qué archivos son con IA lo dice `isAiArt`
  (`lib/ui/scene-backgrounds.ts`, fuente única); Información lo explica en
  "Sobre las imágenes". Una foto real nunca la lleva. Lo que falta pedir
  está en `docs/PROMPTS-IMAGENES.md` ("Pendientes").
- **Crédito de foto**: la leyenda abajo-derecha de `PlacePhotoHero` solo
  muestra lo que la foto trae (`place_images.alt_text`: autor/fuente/
  licencia). Sin dato no hay leyenda — nunca una atribución por defecto.
- **Rutas** (`RouteCard`, hero de la ficha de ruta): `routes.cover_image`
  (portada curada a mano, hoy ilustraciones generadas con IA en
  `public/rutas/`) tiene prioridad; si una ruta no tiene portada propia,
  cae a la foto de la primera parada (`pickRouteCoverPhoto`).
- Cualquier imagen local nueva bajo `public/` necesita agregar su prefijo a
  `images.localPatterns` en `next.config.ts` (Next 16: declarar
  `localPatterns` pasa de "cualquier imagen local sin query string" a
  "solo lo listado" — un bug real ya se dio dos veces en esta sesión por
  olvidar este paso).

## Guía paso a paso (a pie y en auto)

Pedido del usuario (2026-11-01): "no quiero una brújula, quiero una guía de
vete por aquí, vete por allá… con la cámara abierta, que me muestre la ruta
hacia dónde tengo que ir". `RouteNavigationMap` (ficha de ruta y Mi
recorrido) ya no usa Google: "Iniciar guía" pide el camino por calle desde
donde estás hasta la próxima parada (`/api/ruta`, OSRM de OpenStreetMap, ver
`lib/navigation/osrm.ts`) y lo sigue con el GPS:

- **Tarjeta de giro**: ícono del giro (`ManeuverIcon`, mismas reglas que
  `CategoryIcon`, en `category-icon.tsx`) + "En 80 m · Dobla a la derecha por
  Serrano" + lo que falta. Los textos salen de `guide.action.*` (es/en); la
  lógica, de `lib/navigation/guidance.ts` (funciones puras, con pruebas).
- **Modo**: a pie o en auto, sugerido por la distancia (hasta 1,5 km, a pie)
  y elegible a mano.
- **Voz** (activada por defecto, con botón para apagarla): dice cada giro al
  volverse el próximo, al acercarse y en la esquina ("ahora, dobla…"), y la
  llegada. Usa la voz del teléfono (`lib/speech.ts`).
- **Cámara** (solo a pie, `GuideCamera`): la flecha no apunta al destino,
  sino a un punto de la calle unos metros más adelante sobre el camino
  (`LOOKAHEAD_M`), que al acercarse a una esquina ya está doblando.
- **Desvío**: lejos del camino se muestra "recalculando" (sin giros viejos) y
  se pide uno nuevo (como mucho cada 10 s).
- Al llegar ofrece seguir a la siguiente parada; tocar otra parada en el
  mapa cambia el destino. Siempre queda el link a Google Maps.

## Idiomas: español, inglés y portugués

`/es`, `/en` y `/pt` (portugués de Brasil, desde 2026-11-01; pedido del
usuario). Textos fijos en `src/messages/{es,en,pt}.json` (mismas claves) y
rutas traducidas en `src/i18n/routing.ts` (`/pt/rotas`, `/pt/lenda`…). El
contenido de la base sigue `src/i18n/content.ts`: en portugués, lo que no
tenga traducción se muestra en español en vez de desaparecer. Voz y fechas
en `pt-BR`. Un idioma nuevo = su archivo de mensajes, sus rutas, su entrada
en `CONTENT_LOCALES`, `SPEECH_LANG` y `OG_LOCALE`, y su valor en el tipo
`locale` de la base (script manual, como `portugues-1-idioma.sql`).

## Escuchar la página

`ListenButton` (`components/ui/listen-button.tsx`): botón "▶ Escuchar"
(píldora `bg-accent`, mismo glow que los CTA) que lee en voz alta un
apartado con la voz del teléfono (`lib/speech.ts`) — pensado para quien va
manejando o caminando. Va bajo el título de la ficha de lugar (nombre,
dónde está, descripción), de ruta (nombre, descripción y sus paradas en
orden) y de pueblo (nombre, resumen y sus atractivos). Nunca suena solo;
pausa, sigue, detiene y cambia velocidad (1×, 1,25×, 0,8×). Para sumarlo a
otra página: pasarle `segments` con textos reales de esa página — nunca un
texto escrito solo para la voz.

## Rutas turísticas de la comuna (oficial y ferroviaria)

Si una ruta del sitio corresponde a una ruta real de la comuna, su ficha
muestra `OfficialRouteCard` (`components/route/`): el logo de esa ruta, de
dónde viene (solo con fuente) y su Instagram, en una tarjeta `surface-glass`.
Los datos viven en `lib/official-routes.ts`, por slug, y los textos en
`route.official.routes.<clave>` (es/en). Hoy: "Donde el Diablo perdió el
poncho" (oficial: Municipalidad e INDAP) y la "Ruta Turística Ferroviaria
Pedegua – Palquico – Las Palmas" (sin fuente de quién la organiza: no se la
llama "oficial"). Nuestras rutas usan su **nombre propio**, sin traducir.
Nuestro arte nunca imita sus logos (`docs/PROMPTS-IMAGENES.md`).

## La leyenda del diablo (`/leyenda`)

La página que cuenta el dicho que le da nombre al sitio: el dicho, el poema
de 1894, tres versiones en tarjetas `surface-glass`, la versión de la ruta,
"Recórrela" (solo links a lo que existe en la base: Chalaco, la Escalera
del Diablo, la ruta) y las fuentes al pie. `PageHero` con la escena del
túnel; "Escuchar" lee la página entera en orden. Todo contado con palabras
propias desde fuentes citadas (nunca copiar el poema ni párrafos).

Cómo se llega (pedido del usuario: "esa página queda perdida"): la tarjeta
ancha `LegendCard` (`components/legend/`, escena del túnel) va en el inicio
después del vuelo 3D y en Rutas debajo de las rutas; en Explorar hay una
píldora "La leyenda" junto a "Rutas" (`CategoryTabs`); la tarjeta de la ruta
del poncho (`OfficialRouteCard`) suma "Conoce la leyenda", e Información
tiene un link. En la navegación va en "Más" (barra de arriba y de abajo).

## Qué pasa en Petorca (eventos, `/eventos`)

Pedido del usuario (2026-11-02): un apartado de eventos — "Cocinando con el
Diablo", el aniversario de Petorca, el de algún club. Página propia
(`PageHero` con la escena del pueblo, "Escuchar") en tres partes, ordenadas
por `buildAgenda` (`lib/events/agenda.ts`, funciones puras con pruebas):

- **Próximos**: con fecha confirmada que todavía no termina.
- **Fiestas de cada año**: las que se repiten (mes en la base) y no tienen
  fecha próxima, desde el mes actual. Sin fecha dicen "Fecha por confirmar";
  si ya se hicieron con fecha, "La última: …". Nunca un día inventado.
- **Ya pasaron**: eventos de una sola vez cuya fecha pasó (la historia queda).

Un evento cae en una sola parte. `EventCard` (`components/events/`):
`surface-glass` con un calendario chico (día y mes; borde y glow de brasa si
es próximo), cuándo, dónde (links al lugar y al pueblo si existen),
organizador y fuente. La portada solo si hay una foto propia o con permiso.

Cómo se llega: en la navegación, dentro de "Más" (y a la vista en la barra
de arriba desde `md:`); píldora "Eventos" en Explorar (junto a Rutas y La leyenda), bloque "Qué pasa en Petorca" en el
inicio (`EventsHighlight`: lo próximo y las fiestas que vienen, nunca lo
pasado; sin eventos no aparece), en la ficha del pueblo y del lugar donde se
hace, y un link en Información. Se cargan en el panel (`/admin/eventos`).

## Petorca en la tele (reportajes)

Reportajes de TV sobre la comuna (pedido del usuario: "extrae los videos y
ponlos para reproducir en nuestro sitio"). **Nunca se descargan ni se vuelven
a subir**: son de cada canal. Se muestran con el reproductor oficial (Rudo para
Canal 13 y Chilevisión, YouTube sin cookies para el resto), con el canal y un
link "Ver en …" al original. Lista y orden en `lib/reportajes.ts` (fuente
única); solo canales o programas reconocibles ("oficiales"), no videos de
terceros que reúnen material ajeno.

- `VideoReportaje` (`components/video/`): hasta que se toca "Ver reportaje" es
  una tarjeta con nuestra escena del diablo, el canal, el título y la duración
  y fecha si se conocen; recién entonces carga el reproductor (sin megas ni
  cookies de terceros si nadie lo mira).
- Dónde: los tres en `/leyenda` ("Petorca en la tele", `#reportajes`), el que
  trata de una ruta en su ficha ("La ruta en video") y el destacado en el
  inicio, con "Ver los N reportajes" hacia la leyenda.
- Un reproductor nuevo necesita su dominio en `frame-src` (CSP, `next.config.ts`).

## Sin señal (`OfflineSaveButton`)

Pedido del usuario: que funcione "sin señal en el valle". En la ficha de
cada ruta y en Mi recorrido, un botón "⬇ Guardar para usar sin señal (≈ N
MB)" (vidrio con borde, glow al pasar el mouse) baja al teléfono la página,
sus paradas y el mapa de la zona; mientras guarda muestra el porcentaje, y
después "✓ Guardada para usar sin señal el {fecha} · Actualizar". Si algo
esencial falla (las páginas o el estilo del mapa), avisa en ámbar en vez de
decir "guardada". Mi recorrido guarda su versión "compartida", que trae las
paradas sin pedirlas a `/api`. Sin señal, una página no guardada abre
`public/offline.html` (mismo fondo de noche y logo) con links a lo guardado.
La guía por calle necesita conexión: sin señal lo dice
(`guide.noRouteOffline`) y siguen el mapa y tu posición.

## Compartir un recorrido

"Compartir recorrido" (Mi recorrido) arma un link con las paradas en orden
(`/recorrido/compartido?paradas=a,b,c`, `lib/trip/share-link.ts`) y lo
manda con el menú de compartir del teléfono (o lo copia). Quien lo abre ve
la página "Recorrido compartido" — `PageHero`, Escuchar, el mapa con la
guía paso a paso, las paradas numeradas y "Agregar ruta completa" para
guardarlo en su Mi recorrido. Sin cuentas ni tablas nuevas: todo va en el
link. Paradas inexistentes o de otra comuna se omiten; sin ninguna, un
`EmptyState` con link a Explorar. `noIndex` (es el recorrido de una persona).

## Ficha del jugador en el mapa en vivo

Pedido del usuario: que su posición real en el mapa de navegación se vea
como una "ficha tipo Monopoly" (un ícono elegido por él) en vez del punto
azul genérico de MapLibre. `lib/navigation/avatar-storage.ts` guarda la
elección (`localStorage`, mismo patrón que `lib/trip/storage.ts`) entre los
íconos de la comuna (`AVATAR_ICONS`: diablo, cucharón, poncho, tren, Túnel
Las Palmas y petroglifo de Chincolco; hasta 2026-11-01 eran los de la
provincia — dulce, surf, palta… — y una ficha guardada que ya no existe
vuelve sola al diablo). `AvatarPicker` (junto al botón
"Iniciar navegación") deja elegirla; `PlayerToken` la dibuja en el mapa;
`MapView` pasa `showUserLocation={false}` a `GeolocateControl` para que
`PlayerToken` sea la única marca de posición, no las dos a la vez.

Las fichas se ven como **piezas de metal de verdad** (`GameToken`,
`components/ui/game-token.tsx`; pedido del usuario: "más realistas"): disco
de peltre con canto en relieve, cara hundida, ícono "grabado" y brillo
especular; la elegida (y tu posición en el mapa) es de oro y se levanta del
tablero. Los metales viven en `globals.css` (`token-pewter`, `token-gold`,
`token-face`, `token-engrave`) — no repetir esos degradados a mano.

## Ancho de página y navegación (mobile-first, pero también web)

El layout raíz (`src/app/[locale]/layout.tsx`) envuelve `{children}` en
`mx-auto w-full max-w-3xl` — el mismo ancho que ya usaban `SponsorBanner` y
`BottomNav`. Antes cada página crecía sin límite en monitores anchos
mientras nav/auspicio quedaban centrados a 768px, así que mapas y fotos se
veían "gigantes o poco proporcionales" en desktop (feedback real del
usuario). Cualquier página nueva hereda este ancho solo, sin tener que
ponerle un `max-w-*` a mano — si una sección puntual necesita salirse de
ese ancho (como el hero del home), es la excepción, no la regla.

Navegación: un solo origen (`components/ui/nav-items.tsx`, links + íconos)
con dos listas — `NAV_ITEMS` (Inicio, Explorar, Rutas, Mi recorrido: siempre
a la vista) y `MORE_ITEMS` (Eventos, La leyenda, Información: detrás de
"Más", `MoreMenu`). Pedido del usuario: la leyenda y los eventos "salen como
más ocultos" (antes solo había píldoras y tarjetas dentro de las páginas).
"Más" abre un menú (hacia arriba en celular, hacia abajo en escritorio) y,
solo si en ese navegador hay una sesión del panel (cookie de Supabase), suma
"Panel del equipo" → `/admin`; es solo un link, el panel sigue pidiendo la
clave. Las dos listas alimentan dos componentes que se muestran según el
ancho de pantalla, nunca los dos a la vez:

- `BottomNav` — fijo al fondo, solo celular (`sm:hidden`): patrón de app
  móvil, coherente con que el sitio se sienta "de celular" primero.
- `TopNav` — barra horizontal `sticky top-0`, solo desde `sm:` (tablet/
  escritorio): en una ventana de escritorio alta, una barra fija al fondo
  de la ventana pasa desapercibida y no es donde alguien en desktop espera
  navegación ("el botón para ver las secciones no está", feedback real).
  Desde `md:` los ítems de "Más" con `inWideBar` (Eventos) salen también a
  la vista. Va en una sola línea (`whitespace-nowrap`, `px-2`): con 6 ítems
  y los idiomas entra justo en 768 px — medido en es, en y pt.

Agregar una sección = un ítem nuevo en `NAV_ITEMS` (a la vista; en celular
no caben más de 5 botones, contando "Más") o en `MORE_ITEMS`, nunca
duplicar el link a mano en cada uno de los dos componentes.

**Auspicio siempre a la vista** (`SponsorBanner`; pedido del usuario: que
"esté siempre" al moverse por la página, pero "más disimulado"). Antes era
un bloque de dos filas al final de cada página. Ahora:

- **Celular y tablet** (hasta `lg`): franja delgada (~44 px) fija abajo, en
  una sola caja fija junto con `BottomNav` (`[locale]/layout.tsx`), para que
  se apilen solas. Rota entre auspiciadores. El layout deja al pie
  exactamente el alto de las barras (`pb-[6.5rem]` en celular, `sm:pb-11`):
  más que eso se ve como una franja negra vacía (feedback real).
- **Escritorio** (`lg` y más): barrita de ~1,5 cm (`w-14`) fija al costado
  derecho, de arriba abajo, en el espacio que el contenido de 768 px deja
  libre, con los logos de **todos** los auspiciadores a la vez (nombre y
  frase en el `title`). Una columna ancha con un solo auspiciador "está muy
  grande" (feedback real).
- Sin `backdrop-filter` (pasa encima del vuelo 3D).

**Cambio de idioma** (`LocaleSwitcher`): botones ES · EN · PT (píldora,
el activo en `bg-accent`), en `TopNav` a la derecha y, en celular, en
`MobileHeader` (logo + nombre + idioma, arriba, no fijo). Antes era un
`<select>` solo en el hero del inicio: las opciones no se leían (lista del
sistema clara con texto blanco) y en las otras páginas no había cómo
cambiar de idioma (feedback real del usuario).

## Panel para varias personas

Pedido del usuario: "varias personas, con roles" para poder entregar el
panel. Menú lateral: además de las secciones de contenido, **Personas**
(solo administradores: invitar con correo y rol, cambiar rol, "Link para
cambiar clave", quitar), **Registro de cambios** (quién cambió qué y cuándo,
los últimos 200) y **Mi cuenta** (cambiar la clave propia, cerrar sesión;
"Cerrar sesión" también al pie del menú en escritorio). Los links de
invitación aparecen en una caja verde con "Copiar link" y "Mandar por
WhatsApp" y el aviso de que sirven una vez y vencen en 1 hora. `/admin/aceptar`
usa el mismo diseño que el login (sin menú). Claves de al menos 10
caracteres.

## Explorar: comuna → pueblo → atractivos

`/explorar` es la **única** pantalla para recorrer el catálogo por pueblos
(pedido del usuario: "no tendría dos pantallas para lo mismo"; `/pueblos`
solo redirige acá para no romper links viejos — la ficha de un pueblo,
`/pueblos/[slug]`, sigue existiendo). Arranca en la **vista mapa** (ver
"Mapa de /explorar" abajo; pedido del usuario: el listado "se ve muy poco
amigable para navegar"); el listado queda a un toque (`?vista=lista`). La
vista lista es un árbol ordenado
por comuna y, dentro, por pueblo (`buildExploreTree`,
`src/lib/ui/build-explore-tree.ts`): el catálogo completo de pueblos manda,
así que un pueblo sin atractivos igual aparece (vacío); la cabecera comunal
(el pueblo que lleva el nombre de la comuna) va primero; los lugares de una
comuna sin pueblo van a un grupo "Otros lugares" al final de esa comuna.

Las comunas son listas desplegables que arrancan **plegadas** (pedido del
usuario: "deberían ser listas desplegables para que no se acumulen siempre
todos en la pantalla"): cada encabezado resume cuántos pueblos y atractivos
tiene, y un clic lo abre o cierra. Con filtros activos arrancan abiertas para
mostrar de entrada lo que coincide (la página remonta el componente al
cambiar los filtros, con `key`).

Interacción (`LocalityBrowser`): pasar el mouse sobre un pueblo previsualiza
sus atractivos; clic (o toque en celular) lo deja **fijo abierto** hasta
volver a tocarlo, y se pueden dejar varios abiertos. El hover solo responde a
`pointerType === "mouse"` — en táctil, los eventos de mouse sintéticos del
toque dejarían el pueblo pegado abierto. Cada pueblo real trae un link "Ver
pueblo" a su ficha.

Un pueblo con resumen real lo muestra al abrirse (3 líneas); la ficha
(`/pueblos/[slug]`) lo muestra completo en un bloque "Sobre {pueblo}" con
"Fuente: …" enlazada. Sin resumen, ninguno de los dos muestra nada — nunca
un texto de relleno.

Los filtros (buscador, comuna, categoría, característica) quedan plegados
detrás de un botón "Filtros" (`FiltersDisclosure`, con el conteo de filtros
activos) para que el mapa o el árbol sea lo primero que se ve; achican los
atractivos dentro de cada pueblo, no esconden pueblos.

## Categorías de Explorar (pestañas)

Pedido del usuario: Explorar "por categorías, como tenemos lo del Papudo", y
que un lugar pueda estar en más de una. `CategoryTabs`
(`components/explore/`) va bajo la cabecera: "Todo", una pestaña por
categoría con su cantidad real de lugares y un acceso a Rutas. Orden y lista
fija en `EXPLORE_CATEGORY_ORDER` (`lib/ui/category-gradient.ts`):
Gastronomía · Alojamiento · Naturaleza y aventura · Patrimonio y cultura ·
Recreación. Se muestran aunque estén vacías (para que se vea qué ofrece el
directorio); vacías muestran un `EmptyState` que invita a contar de uno,
nunca un lugar de relleno. Las postales del inicio, en cambio, solo con
lugares.

- **Varias categorías**: `PlaceCard.categorySlugs` (principal primero +
  `place_secondary_categories`); se filtra y se cuenta con esa lista. La
  principal (`categorySlug`) sigue mandando en ícono, color del pin y escena.
- Cambiar de pestaña conserva la vista (mapa/listado) y los demás filtros;
  la categoría ya no está en "Filtros".
- Categoría nueva = su entrada en `EXPLORE_CATEGORY_ORDER` y en los
  `Record` de `category-gradient.ts` (degradado, color, ícono) — y su escena
  en `SCENE_BY_CATEGORY`. Nunca la escena `dulces` (La Ligua) para Petorca.

## Mapa de /explorar (vista por defecto)

Pedido del usuario: "un mapa asociado a lo que ofrece el sector, con
animaciones de playa, de dulces, de historias, diablos". `ExploreMap`
(`components/explore/explore-map.tsx`):

- **Temas** (`getPlaceTheme` + `THEME_STYLE` en `lib/ui/category-gradient.ts`,
  fuente única): playa, dulces, sabores, historia, naturaleza y diablo. Salen
  del dato real del lugar — primero `places.icon` (`dulce` → dulces, `diablo`
  → diablo, `surf` → playa, `casco-minero`/`tejido` → historia), si no su
  categoría. Nunca se asigna un tema "porque se ve bien".
- **Animación por tema** (`ThemeAura`, keyframes `aura-*` en `globals.css`):
  ondas que se abren (playa), confites/vapor que suben (dulces/sabores), farol
  que titila (historia), halo que respira (naturaleza), brasas y el diablito
  meciéndose (diablo). Va detrás de cada pin (`MapPin`, así que se replica en
  todo mapa del sitio), en las burbujas de sector y en la leyenda (que solo
  lista los temas presentes). `motion-safe:`: con movimiento reducido, quieto.
- **Sectores**: con el mapa alejado (bajo `EXPLORE_SECTOR_MAX_ZOOM`,
  `lib/maps/config.ts`) se ve una burbuja por comuna (`SectorMarkers`,
  datos de `buildMapSectors`, `lib/ui/map-sectors.ts`) con la escena del
  diablito de lo que más ofrece (`getSceneForTheme`), sus tres temas
  principales y la cantidad real de atractivos; al tocarla la cámara vuela a
  la comuna y aparecen los pines (`MapView markersMinZoom`). Las burbujas no
  se tapan entre sí: si chocan, se corren arriba/abajo y un punto de luz
  marca la cabecera real. Con búsqueda, comuna o característica no hay
  sectores: van directo los pines.
- **Pines**: los atractivos como gota por categoría y los **pueblos con
  coordenada confirmada** como círculo neón con casita (`MapPin
variant="locality"`, link a `/pueblos/[slug]`); con un filtro de
  búsqueda/categoría/característica solo aparecen los pueblos que tienen
  atractivos que coinciden. Un pueblo sin coordenada no se dibuja (nunca un
  punto inventado).
- **Tira de tarjetas** bajo el mapa (de la costa a la cordillera), con el
  resaltado cruzado de siempre: tocar la foto de una tarjeta vuela a su pin
  (y sube el mapa a la vista si quedó arriba), tocar un pin centra su
  tarjeta, el nombre lleva a la ficha.

## Resaltado cruzado mapa↔lista

Pedido real del usuario ("lo que selecciono no sé dónde se ve"): al pasar
el mouse por una parada en la lista, su pin se destaca en el mapa, y
viceversa al tocar un pin. El estado (`highlightedSlug`) vive en un solo
lugar por pantalla y baja como prop a `MapView` (`highlightedSlug` +
`onMarkerClick`) y a la lista correspondiente — nunca duplicado ni sincronizado
por evento global, porque map y lista siempre son hijos directos del mismo
componente que lo sostiene:

- **Ficha de ruta**: `RouteMapWithStops` (client wrapper, ya que la página
  de la ruta es un server component y no puede tener este estado) envuelve
  `RouteNavigationMap` + `RouteStopChecklist`.
- **Mi recorrido**: `TripView` ya es client component, así que sostiene
  `highlightedSlug` directo, sin wrapper aparte.

Una pantalla nueva con mapa + lista de paradas debería seguir el mismo
patrón: un solo estado arriba, nunca un mapa y una lista resueltos por
separado sin saber uno del otro.

## Insignias sobre una foto/hero

Convención de posición fija (`PlacePhotoHero`, `PlaceCard`):
`CategoryBadge` siempre arriba-izquierda (`absolute top-2 left-2`),
`FeaturedBadge` siempre arriba-derecha (`absolute top-2 right-2`), badge de
cantidad de fotos abajo-derecha, puntos del carrusel abajo-izquierda — para
que nunca se solapen entre sí sea cual sea la combinación presente.
