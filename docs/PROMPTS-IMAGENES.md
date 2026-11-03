# Arte del diablo de Petorca (imágenes con ChatGPT)

> Escrito el 2026-11-01. El sitio pasó a ser solo de la comuna de Petorca, y
> el diablo que tenía (casco minero de Cabildo, tabla de surf, dulces de La
> Ligua) era de toda la provincia. El usuario pidió un personaje nuevo, solo
> de Petorca, con el logo y las ilustraciones hechos con GPT.

## Estado

**Entrega del 2026-11-02 ("13 recursos", diablo campesino)** — integrada en la
rama `feat/recursos-y-auditoria`. Los anteriores quedaron en
`docs/arte/respaldo-2026-11-02/`. Los PNG originales se guardan al lado (no se
suben, ver `.gitignore`); el sitio usa WebP.

| Recurso del ZIP                           | Estado                                                                                                                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `referencias/diablo-referencia.png`       | Integrado como referencia: `docs/arte/diablo-campesino-referencia.png`.                                                                                                                                        |
| `brand/icono.png`                         | Integrado (reducido a 1024×1024; original en `icono-original.png`). De él salen **todos** los íconos: favicon, app, barra y la imagen para compartir.                                                          |
| `brand/logo.png`                          | **No integrado**: es el diablo infantil anterior, no el campesino. Falta un logo nuevo; mientras, el sitio no usa ningún logo (los íconos salen de `icono.png`).                                               |
| `fondos/atardecer.png`                    | Integrado. El diablo está **al centro**: solo sirve en formatos altos (postales); las cabeceras anchas usan el cerro.                                                                                          |
| `fondos/cerro.png`                        | Integrado (inicio, Explorar, naturaleza, recreación, privacidad).                                                                                                                                              |
| `fondos/pueblo.png`                       | Integrado (gastronomía, cultura, Información).                                                                                                                                                                 |
| `fondos/tunel.png`                        | Integrado (leyenda, rutas).                                                                                                                                                                                    |
| `rutas/ruta-ferroviaria-…png`             | Integrado. Conserva el puente de reticulado y el túnel aprobados; cambia el diablo al campesino.                                                                                                               |
| `rutas/ruta-del-diablo-pedegua-chincolco` | **No integrado**: es la misma portada con el diablo infantil que ya estaba. Falta la versión campesina. Mientras, la ruta usa `leyendas/escalera` de portada (`supabase/manual/portada-poncho-campesino.sql`). |
| `leyendas/cueca.png`                      | Integrado en `/leyenda` (versión de la ruta).                                                                                                                                                                  |
| `leyendas/ano-nuevo.png`                  | Integrado en `/leyenda` (versión de la ruta).                                                                                                                                                                  |
| `leyendas/escalera.png`                   | Integrado en `/leyenda` (versión de la ruta).                                                                                                                                                                  |
| `leyendas/diablo-buscando.png`            | Integrado en `/leyenda` ("Recórrela").                                                                                                                                                                         |

**Logo:** llegó el 2026-11-03 con el nombre del sitio ("El diablo murió en
Petorca"): `public/brand/logo.png`, 1024×1024 transparente (original en
`logo-original.png`, no se sube). La portada
campesina de "Donde el Diablo perdió el poncho" llegó el 2026-11-03
(`ruta-del-diablo-pedegua-chincolco-campesino.webp`). Las escenas SVG anteriores
siguen en `public/fondos/*.svg` (sin uso, salvo `playa` y `dulces`, de la
versión de la provincia).

## Pendientes (2026-11-02)

Todo el arte del diablo lleva en el sitio la marca **"Ilustración con IA"**
(`AiArtLabel`; lista de archivos en `isAiArt`, `lib/ui/scene-backgrounds.ts`)
y la página Información lo explica. Al llegar una foto real que lo reemplace,
se saca de esa lista.

### Para pedirle a ChatGPT (ilustraciones)

Adjuntar siempre `docs/arte/diablo-campesino-referencia.png` y pegar al final
el bloque de estilo (más abajo). `node scripts/build-brand-png.mjs --check`
dice cuáles faltan.

1. ~~**Logo**~~ — **llegó el 2026-11-03** con el nombre del sitio, "El diablo
   murió en Petorca" (revisado letra por letra): `public/brand/logo.png`,
   1024×1024, fondo transparente. El anterior decía "El Diablo de Petorca" y
   se pidió de nuevo (decisión del usuario).

2. ~~**Portada de "Donde el Diablo perdió el poncho"**~~ — **llegó el
   2026-11-03** (el diablo sentado en una piedra al atardecer):
   `public/rutas/ruta-del-diablo-pedegua-chincolco-campesino.webp`, conectada
   con `supabase/manual/portada-poncho-definitiva.sql`.

3. **Escena de gastronomía** — `public/fondos/cocina.png`, 1536×1024. Hoy
   gastronomía y cultura repiten el pueblo.

   ```text
   Una cocinería de campo bajo un parrón, al atardecer: horno de barro con empanadas, ollas de greda humeantes, una mesa larga con mantel y jarros de greda. El diablo de la imagen adjunta revuelve una olla grande con su cucharón, contento, en el tercio derecho. A la izquierda, el cielo y el parrón despejados para un título. Sin texto.
   [bloque de estilo]
   ```

4. **Escena de alojamiento** — `public/fondos/descanso.png`, 1536×1024. Hoy
   alojamiento usa el atardecer.

   ```text
   La galería de una casa de campo de adobe con tejas, de noche, con el cielo lleno de estrellas sobre los cerros. El diablo de la imagen adjunta descansa en una silla de mimbre con los pies en alto, el sombrero inclinado sobre los ojos y el cucharón apoyado al lado; un farol encendido junto a la puerta. El diablo en el tercio derecho; a la izquierda, cielo despejado para un título. Sin texto.
   [bloque de estilo]
   ```

5. **Escena de recreación** — `public/fondos/plaza.png`, 1536×1024. Hoy
   recreación y naturaleza repiten el cerro.

   ```text
   La plaza de un pueblo del valle en una tarde de verano: árboles grandes, una pileta, bancas, faroles y banderines de colores. El diablo de la imagen adjunta, sentado en una banca, le muestra a unos niños cómo hace girar su cucharón; ellos se ríen. El diablo en el tercio derecho; a la izquierda, cielo despejado para un título. Sin texto.
   [bloque de estilo]
   ```

6. **Portada de "Cocinando con el Diablo"** (opcional) —
   `public/eventos/cocinando-con-el-diablo.png`, 1536×1024. Es un evento de
   otros (la ruta y la Municipalidad): mejor una foto suya, con permiso. Si
   no llega:

   ```text
   Una feria de comida en la plaza de un pueblo de adobe al atardecer, con la iglesia al fondo, toldos de colores, guirnaldas de luces y ollas humeantes. El diablo de la imagen adjunta, de delantal sobre el poncho, revuelve una olla enorme con su cucharón mientras la gente hace fila contenta. El diablo en el tercio derecho. Sin texto.
   [bloque de estilo]
   ```

### Fotos reales (no con IA)

Un lugar real nunca lleva una ilustración que parezca foto (ver "Reglas"). Lo
que falta acá hay que pedirlo al dueño, a la Municipalidad o sacarlo en
terreno (con permiso de uso; `public/fotos/README.md`):

- **12 lugares sin foto** (2026-11-02): Turismo Rural La Nina y Hostal El Río
  (Pedegua); Tinajas Chincolco, Iglesia de Chincolco, Plaza de Armas de
  Chincolco, Medialuna de Chincolco y El Rincón Criollo (Chincolco); Plaza,
  Piscina y Panal de Hierro Viejo; Campo de Petroglifos El Arenal (Pedernal);
  Viña El Sobrante. Mientras, muestran el ícono de su categoría.
- **Fiestas religiosas y el natalicio de Manuel Montt** (`/eventos`): solo
  fotos reales; nunca el diablo en una fiesta religiosa.
- **Pueblos**: la ficha usa una escena del diablo; una foto real de cada
  pueblo la reemplazaría (todavía no hay dónde subirla en el panel).

## El personaje (aprobado desde 2026-11-02)

Referencia: [`docs/arte/diablo-campesino-referencia.png`](arte/diablo-campesino-referencia.png).
Adjuntarla en **cada** pedido nuevo con _"Usa este personaje exactamente como
en la imagen adjunta"_. La referencia anterior (diablito de mascota,
`diablo-referencia-aprobada.png`) queda solo como historia: ya no se usa.

- Hombre de campo de unos 50 años, clásico, pícaro y legendario.
- Sombrero de ala ancha con cuernos, pelo negro ondulado, bigote y perilla.
- Chaqueta y pantalón negros, chaleco con botones dorados, pañuelo rojo al
  cuello, botas con espuelas.
- Poncho rojo con franjas crema y negras y flecos dorados.
- **Cucharón de madera con borla roja y dorada**.
- Cola roja con punta de flecha.
- **Nunca**: casco minero, tabla de surf, dulces, playa (eran de otras
  comunas), ni el diablito infantil anterior.

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
