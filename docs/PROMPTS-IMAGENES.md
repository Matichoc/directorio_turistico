# Arte del diablo de Petorca (imágenes con ChatGPT)

> Escrito el 2026-11-01. El sitio pasó a ser solo de la comuna de Petorca, y
> el diablo que tenía (casco minero de Cabildo, tabla de surf, dulces de La
> Ligua) era de toda la provincia. El usuario pidió un personaje nuevo, solo
> de Petorca, con el logo y las ilustraciones hechos con GPT.

## Estado

**Entregado e integrado** (ZIP "8 imágenes individuales", 2026-11-01):

| Archivo de origen (PNG, no se sube)                    | Lo que usa el sitio                                     |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `public/brand/logo.png` (sí se sube)                   | Íconos de la app, logo de la barra, imagen al compartir |
| `public/brand/icono.png` (sí se sube)                  | Favicon, ícono de pestaña y de iPhone                   |
| `public/fondos/atardecer.png`                          | `public/fondos/atardecer.webp` (inicio y general)       |
| `public/fondos/cerro.png`                              | `public/fondos/cerro.webp` (naturaleza)                 |
| `public/fondos/pueblo.png`                             | `public/fondos/pueblo.webp` (cultura)                   |
| `public/fondos/tunel.png`                              | `public/fondos/tunel.webp` (rutas)                      |
| `public/rutas/ruta-del-diablo-pedegua-chincolco.png`   | `public/rutas/ruta-del-diablo-pedegua-chincolco.webp`   |
| `public/rutas/ruta-ferroviaria-pedegua-las-palmas.png` | `public/rutas/ruta-ferroviaria-pedegua-las-palmas.webp` |

Los íconos anteriores quedaron respaldados en `docs/arte/respaldo-2026-11-01/`.
Las escenas SVG anteriores siguen en `public/fondos/*.svg` (sin uso, salvo
`playa` y `dulces`, de la versión de la provincia).

**Pendiente:**

- Portadas de las rutas en la base: correr `supabase/manual/petorca-portadas.sql`
  (primero en `legacy_dev`; en `legacy` recién cuando `main` tenga los archivos).
- Opcionales: `public/brand/diablo-buscando.png` (páginas vacías) y las
  ilustraciones de una futura página de la leyenda (prompts abajo).

## El personaje (aprobado)

Referencia: [`docs/arte/diablo-referencia-aprobada.png`](arte/diablo-referencia-aprobada.png).
Adjuntarla en **cada** pedido nuevo a ChatGPT con _"Usa este personaje
exactamente como en la imagen adjunta"_.

Sale de la versión de la leyenda que cuenta la ruta (fuentes en
`docs/PROPUESTA-CONTENIDO-PETORCA.md`): un forastero elegante que bailaba con
los mineros y olvidó su poncho tras una fiesta de Año Nuevo.

- Diablito simpático y pícaro, proporciones de mascota.
- Piel roja anaranjada, cuernos curvos marfil, pelo negro engominado, perilla,
  **un diente de oro**, orejas puntiagudas, cola con punta de corazón.
- Frac negro, humita roja, botones dorados, zapatos de charol.
- Poncho rojo con franjas crema y negra y flecos dorados, sobre un hombro.
- **Cucharón de madera con borla roja y dorada** (reemplazó al pañuelo; nunca
  pañuelo, ramitas ni cintas).
- **Nunca**: casco minero, tabla de surf, dulces, playa (eran de otras
  comunas).

## Reglas para cualquier imagen nueva

- Una imagen por pedido, a tamaño nativo (1536×1024 o 1024×1024), ocupando
  el cuadro completo: nada de láminas recortadas ni relleno desenfocado.
- Sin texto ni letras.
- **Son ilustraciones, no fotos**: nunca se presentan como foto real de un
  lugar (las fichas llevan fotos reales, `public/fotos/README.md`).
- **No parecerse al logo de la ruta oficial** "Donde el Diablo perdió el
  poncho" (`public/brand/ruta-oficial-poncho.webp`: círculo azul y blanco con
  la silueta de un diablo tirando de un poncho). Nada de silueta plana tirando
  del poncho, nada de azul y blanco.
- Escenas de cabecera: el diablo en el tercio derecho y lo importante en la
  franja del medio (el sitio recorta arriba y abajo; el punto que queda a la
  vista se ajusta en `SCENE_POSITION`, `lib/ui/scene-backgrounds.ts`).

Bloque de estilo para pegar al final de cada prompt:

```text
Estilo: ilustración digital de libro de cuentos, acabado semi 3D suave, formas redondeadas, iluminación cálida de atardecer o de noche con brillo de brasa. Paleta: noche azul-violeta (#07060c, #1b0e1f, #3a1f55), brasa naranja (#ff7a45), rojo poncho (#c4272d), oro (#f2c44d). Ambiente travieso y mágico, nunca terrorífico. Sin texto, sin letras, sin marcas de agua.
```

## Integración (cuando llegue una imagen nueva)

1. Guardar el PNG con su nombre en su carpeta de `public/`.
2. `node scripts/build-brand-png.mjs --check`: dice qué falta y rechaza lo que
   no cumple (tamaño, transparencia del logo).
3. `node scripts/build-brand-png.mjs`: convierte a WebP y, si están
   `logo.png` e `icono.png`, regenera favicon, íconos y la imagen al compartir.
4. Conectar en el código si es un recurso nuevo y revisarlo a la vista en
   computador y celular.

## Prompts opcionales

### Diablo buscando (páginas vacías y "no encontrado")

- Archivo: `public/brand/diablo-buscando.png`, 1024×1024, fondo transparente.

```text
El diablo de la imagen adjunta, de cuerpo entero, buscando algo con un farol en alto en una mano y el cucharón en la otra, con cara de curiosidad, agachado como si mirara detrás de una piedra. Fondo transparente, sin suelo. Sin texto.
[bloque de estilo]
```

### Página "La leyenda del diablo" (propuesta, aún no existe)

Tres de 1536×1024 en `public/leyenda/` (sección 1 de
`docs/PROPUESTA-CONTENIDO-PETORCA.md`):

- `cueca.png`: _"Interior de una cantina minera antigua del valle de Petorca,
  de noche, con lámparas de aceite. El diablo de la imagen adjunta, de frac,
  baila con su cucharón en alto frente a mineros que aplauden contentos el
  día de pago. [bloque de estilo]"_
- `ano-nuevo.png`: _"Amanecer después de una fiesta de Año Nuevo en un pueblo
  de adobe del valle: mesas vacías, guirnaldas, y el poncho rojo del diablo
  olvidado sobre una silla. A lo lejos, el diablo se va por el camino sin
  darse cuenta. [bloque de estilo]"_
- `escalera.png`: _"Una escalera de piedra en un cerro, de noche. El diablo
  de la imagen adjunta sube corriendo y riéndose, mientras abajo dos curas
  con sotana lo persiguen con faroles. Tono de cuento, cómico. [bloque de
  estilo]"_
