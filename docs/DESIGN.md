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

| Token                                                                                     | Uso                                                                                                                                               |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--accent` / `--accent-foreground` / `--accent-soft`                                      | Color de marca del sitio (terracota). Botones primarios, bordes de tarjeta, glow de hover.                                                        |
| `--sponsor` / `--sponsor-foreground` / `--sponsor-accent` / `--sponsor-accent-foreground` | Solo para `SponsorBanner` — son los colores reales de la marca Matichoc (ver `matichoc/matiweb`), no la paleta del sitio. No reusar en otro lado. |

Colores **por categoría** (`naturaleza`/`gastronomia`/`cultura`/`playa`),
en `lib/ui/category-gradient.ts`:

- `getCategoryGradient(categorySlug)` → gradiente de fondo para heroes/tarjetas sin foto.
- `getCategoryPinColor(categorySlug)` → color sólido para pines de mapa y `CategoryBadge`.
- `getCategoryIcon(categorySlug)` / `getPlaceIcon(categorySlug, placeIcon)` → ver sección Íconos.

Agregar una categoría nueva = agregar una entrada a los tres `Record` de
ese archivo, nunca un `if` especial en un componente.

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

## Insignias sobre una foto/hero

Convención de posición fija (`PlacePhotoHero`, `PlaceCard`):
`CategoryBadge` siempre arriba-izquierda (`absolute top-2 left-2`),
`FeaturedBadge` siempre arriba-derecha (`absolute top-2 right-2`), badge de
cantidad de fotos abajo-derecha, puntos del carrusel abajo-izquierda — para
que nunca se solapen entre sí sea cual sea la combinación presente.
