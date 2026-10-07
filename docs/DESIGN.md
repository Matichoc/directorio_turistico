# Lineamientos de diseño — El diablo murió en Petorca y en La Ligua lo enterraron

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
  `DevilMascot` solo aparece donde tiene sentido narrativo (home, "Ruta del
  Diablo") — no ponerlo en cualquier página nueva "porque sí".

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
- **Recorrido**: arranca solo la primera vez que la sección entra en
  pantalla, vuela de oeste a este (del mar a la cordillera) mostrando una
  tarjeta por comuna con link a `/explorar?comuna=…`, y vuelve a la vista
  general. Cualquier gesto del usuario lo detiene; sin interacción la cámara
  gira lento.
- **Costo**: MapLibre se descarga recién cuando la sección está por verse
  (`next/dynamic` + `IntersectionObserver`); fuera de pantalla no se anima
  nada. Sin WebGL la sección no se muestra. Con movimiento reducido no hay
  vuelo ni giro (saltos directos). `cooperativeGestures`: en celular el mapa
  no secuestra el scroll de la página (se mueve con dos dedos).

## Aparición al hacer scroll

Clase `reveal` (en `globals.css`): las secciones y tarjetas suben y aparecen
al entrar en pantalla, con animaciones guiadas por el scroll de CSS — sin
JavaScript. Navegadores sin soporte, o con movimiento reducido, ven el
contenido normal desde el principio (nunca queda algo invisible). Se usa en
las secciones del home, las comunas de `/explorar` y las tarjetas de rutas.
No ponerla en un contenedor con hijos `position: fixed` (la transformación
los rompería).

## Fondos con el diablito (escenas)

Pedido del usuario: fondos únicos con el diablo de la ilustración (casco
minero con cuernos y linterna, poncho rojo, cola de flecha) "en la playa, en
el cerro, con poncho, según cómo lo busquen y dónde naveguen". Son SVG en
`public/fondos/` (`atardecer`, `playa`, `cerro`, `pueblo`, `dulces`,
`tunel`), compuestos con el diablito a la derecha y el cielo a la izquierda
para que el título de `PageHero` quede legible. La elección vive en un solo
lugar, `src/lib/ui/scene-backgrounds.ts`: `getSceneForCategory` (playa →
playa, naturaleza → cerro, cultura → pueblo, gastronomía → dulces, sin
categoría → atardecer) y `getSceneForRoute`. `PageHero` acepta `scene`:
`/explorar` la cambia con el filtro de categoría, la ficha de un pueblo usa la
categoría que más se repite entre sus atractivos, y el hero del home usa el
atardecer. Para cambiar un fondo por arte raster (webp, p. ej. generado con
IA) basta reemplazar el archivo y su extensión en `SCENE_SRC`.

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

Antes de escribir un `@keyframes` nuevo: revisa si alguno de estos ya sirve
para el efecto que quieres (una aparición, un pulso, un rebote) en vez de
duplicar uno casi igual con otro nombre.

## Íconos

`src/components/ui/category-icon.tsx` tiene un solo `Record<string,
string>` (`ICON_PATHS`) con los paths SVG de: `mountain`, `utensils`,
`landmark`, `waves` (por categoría) y `dulce`, `tejido`, `diablo`, `surf`,
`casco-minero`, `palta` (temáticos "de la zona").

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

## Ficha del jugador en el mapa en vivo

Pedido del usuario: que su posición real en el mapa de navegación se vea
como una "ficha tipo Monopoly" (un ícono elegido por él) en vez del punto
azul genérico de MapLibre. `lib/navigation/avatar-storage.ts` guarda la
elección (`localStorage`, mismo patrón que `lib/trip/storage.ts`) entre los
íconos temáticos "de la zona" (`AVATAR_ICONS`: diablo/dulce/tejido/surf/
casco-minero/palta — no los de categoría genérica, para que la ficha se
sienta propia de Petorca/La Ligua). `AvatarPicker` (junto al botón
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

Navegación entre las 5 secciones (Inicio/Explorar/Rutas/Mi
recorrido/Información): un solo `NAV_ITEMS` (`components/ui/nav-items.tsx`, links +
íconos) alimenta dos componentes que se muestran según el ancho de
pantalla, nunca los dos a la vez:

- `BottomNav` — fijo al fondo, solo celular (`sm:hidden`): patrón de app
  móvil, coherente con que el sitio se sienta "de celular" primero.
- `TopNav` — barra horizontal `sticky top-0`, solo desde `sm:` (tablet/
  escritorio): en una ventana de escritorio alta, una barra fija al fondo
  de la ventana pasa desapercibida y no es donde alguien en desktop espera
  navegación ("el botón para ver las secciones no está", feedback real).

Agregar una sexta sección = un solo ítem nuevo en `NAV_ITEMS`, nunca
duplicar el link a mano en cada uno de los dos componentes.

## Explorar: comuna → pueblo → atractivos

`/explorar` es la **única** pantalla para recorrer el catálogo por pueblos
(pedido del usuario: "no tendría dos pantallas para lo mismo"; `/pueblos`
solo redirige acá para no romper links viejos — la ficha de un pueblo,
`/pueblos/[slug]`, sigue existiendo). La vista lista es un árbol ordenado
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
activos) para que el árbol sea lo primero que se ve; achican los atractivos
dentro de cada pueblo, no esconden pueblos. La vista mapa (toggle
lista/mapa) muestra pines sueltos, sin agrupar: los atractivos como gota por
categoría y los **pueblos con coordenada confirmada** como círculo neón con
casita (`MapPin variant="locality"`, link a `/pueblos/[slug]`); con un
filtro de búsqueda/categoría/característica solo aparecen los pueblos que
tienen atractivos que coinciden. Un pueblo sin coordenada no se dibuja (nunca
un punto inventado).

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
