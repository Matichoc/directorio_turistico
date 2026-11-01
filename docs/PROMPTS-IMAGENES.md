# Prompts para las imágenes del sitio (ChatGPT)

> Escrito el 2026-11-01. El sitio pasó a ser solo de la comuna de Petorca, y
> el diablo que tenía (casco minero de Cabildo, tabla de surf, dulces de La
> Ligua) era de toda la provincia. El usuario pidió un personaje nuevo,
> parecido pero solo de Petorca, y que el logo y las ilustraciones se hagan
> con GPT. Este documento tiene los prompts listos para copiar.
>
> Hoy el sitio usa un diablo provisorio en SVG (`scripts/build-scene-devil.py`)
> que ya sigue esta misma idea. Las imágenes de GPT lo reemplazan.

## Antes de empezar

- **Primero el personaje, después todo lo demás.** Genera la hoja de
  personaje (prompt 1). Cuando te guste, súbela como imagen de referencia en
  **cada** prompt siguiente y escribe antes: _"Usa este personaje exactamente
  como en la imagen adjunta"_. Así sale el mismo diablo en todas.
- **Una conversación de ChatGPT para todo**: mantiene mejor el estilo.
- **Nada de texto dentro de las imágenes** (GPT suele escribir mal las
  letras). El nombre del sitio lo pone la página.
- **Son ilustraciones, no fotos.** Nunca se usan como "foto real" de un
  lugar: las fichas de lugares llevan fotos reales (`public/fotos/README.md`).
  Iglesias y paisajes de las escenas son **inspirados** en el valle, no
  retratos de un edificio en particular.
- **Ojo con la ruta oficial.** Ya existe una ruta turística llamada "Donde el
  Diablo perdió el poncho" (Nataly Muñoz; ver
  `docs/PROPUESTA-CONTENIDO-PETORCA.md`). Su logo (`public/brand/ruta-oficial-poncho.webp`)
  es un círculo azul y blanco con el título en letras negras y la silueta
  plana de un diablo rojo **tirando de un poncho**. Lo mostramos en la ficha
  de la ruta como "Ruta turística oficial", así que lo nuestro **no debe
  parecerse**: nada de silueta plana tirando del poncho, nada de azul y
  blanco, sin título. Se puede adjuntar su logo a ChatGPT diciendo _"que no se
  parezca a este"_.
- **Al terminar**: guarda cada imagen con el **nombre de archivo** indicado
  (PNG sirve) en la carpeta indicada y avísale a Claude. Él las convierte a
  WebP, regenera los íconos (`node scripts/build-brand-png.mjs`) y las
  conecta.

## Bloque de estilo (va al final de cada prompt)

Copia este párrafo al final de todos los prompts, para que todo se vea del
mismo sitio:

```text
Estilo: ilustración digital de libro de cuentos, acabado semi 3D suave, formas redondeadas (nada anguloso ni triangular), iluminación cálida de atardecer o de noche con brillo de brasa. Paleta: noche azul-violeta (#07060c, #1b0e1f, #3a1f55), brasa naranja (#ff7a45), rojo poncho (#c4272d), oro (#f2c44d), acentos violeta y cian suaves. Ambiente travieso y mágico, nunca terrorífico. Sin texto, sin letras, sin marcas de agua, sin logos de otras marcas.
```

## El personaje: el diablo de Petorca

Sale de la versión de la leyenda que cuenta la ruta (fuentes en
`docs/PROPUESTA-CONTENIDO-PETORCA.md`): un forastero elegante, de **frac negro
y diente de oro**, que **bailaba cueca con los mineros** los días de pago y
**olvidó su poncho** después de una fiesta de Año Nuevo. **No lleva** casco
minero, tabla de surf, dulces ni nada de playa: eso era de otras comunas.

### 1. Hoja de personaje (referencia, no va al sitio)

- Archivo: `public/brand/diablo-referencia.png` (solo para tenerla)
- Tamaño: 1536 × 1024 (horizontal)

```text
Hoja de personaje de una mascota turística: "el diablo de Petorca", un diablito chileno simpático y pícaro, de cuerpo entero, en tres vistas (frente, tres cuartos y perfil) sobre fondo liso oscuro.
Cómo es: piel roja anaranjada; dos cuernos curvos color marfil; pelo negro engominado con pico en la frente; perilla negra corta; ojos grandes y vivos; sonrisa amplia con UN diente de oro; orejas puntiagudas pero redondeadas; cola roja delgada terminada en punta de corazón.
Ropa: frac negro elegante con faldones, camisa blanca, humita roja y botones dorados; zapatos negros de charol. Un poncho chileno rojo con franjas crema, negra y dorada y flecos, puesto sobre un solo hombro y resbalándose (es el poncho que va a perder). En una mano, un pañuelo blanco de cueca.
Proporciones de mascota: cabeza grande, cuerpo bajo, gestos expresivos.
[pega aquí el bloque de estilo]
```

### 2. Logo (insignia)

- Archivo: `public/brand/logo.png`
- Tamaño: 1024 × 1024, **fondo transparente**

```text
Logo circular tipo insignia para un sitio de turismo de la comuna de Petorca (Chile), usando el personaje de la imagen adjunta.
Dentro del círculo: el diablo de busto (cabeza y hombros), sonriendo con el diente de oro, el pañuelo de cueca en alto y el poncho rojo resbalando de un hombro. Detrás, los cerros suaves del valle de Petorca de noche, con algunas estrellas y un halo de brasa detrás de la cabeza. Un aro exterior grueso en degradado naranja brasa.
Debe leerse bien en tamaño chico (64 px): siluetas claras, pocos detalles finos, buen contraste. Fondo exterior transparente. Sin texto. Que no parezca el logo de otra ruta turística: nada de fondo azul y blanco, nada de silueta plana de diablo ni de diablo tirando de un poncho.
[pega aquí el bloque de estilo]
```

### 3. Ícono chico (pestaña del navegador y app)

- Archivo: `public/brand/icono.png`
- Tamaño: 1024 × 1024

```text
Ícono de app cuadrado con esquinas redondeadas, fondo noche violeta oscuro con un halo naranja suave en el centro. Solo la cabeza del diablo de la imagen adjunta, de frente, grande, ocupando casi todo el cuadrado: cuernos marfil, pelo negro, sonrisa con diente de oro.
Tiene que reconocerse a 16 × 16 píxeles: formas muy simples y gruesas, sin detalles finos, colores planos con poco degradado. Sin texto.
[pega aquí el bloque de estilo]
```

Con `logo.png` e `icono.png` en `public/brand/`, el script arma solo el
favicon, el ícono de iPhone, los íconos de la app instalable, el logo de la
barra de arriba y la imagen al compartir el link (1200 × 630, con el nombre
"El diablo en Petorca").

## Fondos de las cabeceras (escenas)

Van detrás del título de cada página (`PageHero`) y en las postales del
inicio. La página los recorta a una franja ancha (más o menos 2,3 : 1), así
que:

- **Composición**: el diablo en el **tercio derecho**; la mitad izquierda
  despejada (cielo o paisaje tranquilo) porque ahí va el título en letras
  blancas.
- **Lo importante en la franja del medio**: arriba y abajo se cortan.
- Tamaño: 1536 × 1024. Carpeta: `public/fondos/`.

Con solo Petorca se usan cuatro (`lib/ui/scene-backgrounds.ts`). `playa` y
`dulces` son de la versión de la provincia: no hace falta hacerlas.

### 4. Atardecer (escena general: inicio y páginas sin categoría)

- Archivo: `public/fondos/atardecer.png`

```text
Escena ancha de paisaje: atardecer en el valle de Petorca, Chile central. Cerros secos con quiscos (cactus chilenos), el río bordeado de árboles, la cordillera de los Andes a lo lejos con un cielo que pasa de violeta noche arriba a naranja brasa en el horizonte, primeras estrellas.
En el tercio derecho, el diablo de la imagen adjunta, de cuerpo entero, bailando cueca: un pie adelante, el pañuelo blanco en alto, el poncho flameando.
Mitad izquierda despejada (cielo y cerros lejanos) para poner un título encima. Elementos importantes en la franja central (arriba y abajo se recortan).
[pega aquí el bloque de estilo]
```

### 5. Cerro (naturaleza)

- Archivo: `public/fondos/cerro.png`

```text
Escena ancha de paisaje: senderos de cerro en el interior de Petorca, Chile, al anochecer. Laderas con quiscos y espinos, rocas grandes, la cordillera de los Andes al fondo con la luna saliendo, cielo violeta con estrellas.
En el tercio derecho, el diablo de la imagen adjunta, de cuerpo entero, caminando cerro arriba con un bastón de madera, el poncho rojo flameando con el viento como si se le fuera a volar.
Mitad izquierda despejada para poner un título encima. Elementos importantes en la franja central.
[pega aquí el bloque de estilo]
```

### 6. Pueblo (cultura y patrimonio)

- Archivo: `public/fondos/pueblo.png`

```text
Escena ancha: calle de un pueblo colonial del valle de Petorca, Chile, de noche en fiesta. Casas de adobe blanqueadas con techos de teja y corredores, una iglesia antigua de adobe con campanario al fondo, banderines de colores cruzando la calle, faroles cálidos encendidos.
En el tercio derecho, el diablo de la imagen adjunta, de cuerpo entero, saludando con la mano libre y con una sonrisa pícara, como recién llegado a la fiesta.
Mitad izquierda despejada (cielo nocturno y techos) para poner un título encima. Elementos importantes en la franja central.
[pega aquí el bloque de estilo]
```

### 7. Túnel (ruta del diablo y ruta ferroviaria)

- Archivo: `public/fondos/tunel.png`

```text
Escena ancha: la boca de piedra de un antiguo túnel de ferrocarril en un cerro seco de Petorca, Chile, de noche. Rieles viejos que entran al túnel, durmientes de madera, una luz cálida que sale desde adentro, cielo estrellado.
En el tercio derecho, el diablo de la imagen adjunta, de cuerpo entero, de pie junto a los rieles sosteniendo un farol encendido, mirando al espectador con complicidad.
La boca del túnel a la izquierda y al centro, sin tapar el espacio del título en la mitad izquierda superior. Elementos importantes en la franja central.
[pega aquí el bloque de estilo]
```

## Portadas de las rutas

Aparecen en la tarjeta de cada ruta y arriba de su ficha. Tamaño: 1536 × 1024. Carpeta: `public/rutas/`. Hoy las dos rutas usan una portada de la
provincia (con el diablo viejo).

### 8. "Donde el Diablo perdió el poncho" (Pedegua → Chincolco)

- Archivo: `public/rutas/ruta-del-diablo-pedegua-chincolco.png`

```text
Ilustración de portada para una ruta turística por el valle de Petorca, Chile, de Pedegua a Chincolco. Un camino rural serpentea por el valle entre cerros secos, quiscos y pequeños pueblos de adobe, con la cordillera al fondo al atardecer.
El diablo de la imagen adjunta, sentado en una piedra a la orilla del camino, mira el valle con una sonrisa pícara mientras se acomoda el poncho rojo al hombro, con el pañuelo de cueca en la otra mano. Que no sea un diablo tirando del poncho ni persiguiéndolo (eso es el logo de otra ruta).
Composición horizontal centrada. Sin texto.
[pega aquí el bloque de estilo]
```

### 9. Ruta Ferroviaria (Pedegua hacia Las Palmas)

- Archivo: `public/rutas/ruta-ferroviaria-pedegua-las-palmas.png`

```text
Ilustración de portada para una ruta turística por el antiguo trazado del ferrocarril en Petorca, Chile, de Pedegua hacia Las Palmas. Una línea férrea antigua recorre el valle seco, cruza un puente de fierro sobre una quebrada y entra a un túnel de piedra en el cerro, al atardecer.
El diablo de la imagen adjunta camina sobre los rieles como equilibrista, con el farol en una mano y el poncho rojo al hombro.
Composición horizontal centrada. Sin texto.
[pega aquí el bloque de estilo]
```

## Opcionales (para lo que viene)

### 10. Diablo buscando (páginas vacías y "no encontrado")

- Archivo: `public/brand/diablo-buscando.png`
- Tamaño: 1024 × 1024, **fondo transparente**

```text
El diablo de la imagen adjunta, de cuerpo entero, buscando algo con un farol en alto y cara de curiosidad, agachado, como si mirara detrás de una piedra. Fondo transparente, sin suelo. Sin texto.
[pega aquí el bloque de estilo]
```

### 11. Página "La leyenda del diablo" (propuesta, aún no existe)

Tres ilustraciones de 1536 × 1024 para contar la leyenda
(`docs/PROPUESTA-CONTENIDO-PETORCA.md`, sección 1). Carpeta:
`public/leyenda/`.

- `cueca.png`: _"Interior de una cantina minera antigua del valle de Petorca,
  de noche, con lámparas de aceite. El diablo de la imagen adjunta, de frac,
  baila cueca con pañuelo frente a mineros que aplauden contentos el día de
  pago. [bloque de estilo]"_
- `ano-nuevo.png`: _"Amanecer después de una fiesta de Año Nuevo en un pueblo
  de adobe del valle: mesas vacías, guirnaldas, y el poncho rojo del diablo
  olvidado sobre una silla. A lo lejos, el diablo se va por el camino sin
  darse cuenta. [bloque de estilo]"_
- `escalera.png`: _"Una escalera de piedra en un cerro, de noche. El diablo
  de la imagen adjunta sube corriendo y riéndose, mientras abajo dos curas
  con sotana lo persiguen con faroles. Tono de cuento, cómico. [bloque de
  estilo]"_

## Resumen de archivos

| #   | Archivo                                                | Tamaño      | Para qué                          |
| --- | ------------------------------------------------------ | ----------- | --------------------------------- |
| 1   | `public/brand/diablo-referencia.png`                   | 1536 × 1024 | Referencia del personaje          |
| 2   | `public/brand/logo.png`                                | 1024 × 1024 | Logo (transparente)               |
| 3   | `public/brand/icono.png`                               | 1024 × 1024 | Favicon e ícono de app            |
| 4   | `public/fondos/atardecer.png`                          | 1536 × 1024 | Cabecera general e inicio         |
| 5   | `public/fondos/cerro.png`                              | 1536 × 1024 | Naturaleza                        |
| 6   | `public/fondos/pueblo.png`                             | 1536 × 1024 | Cultura                           |
| 7   | `public/fondos/tunel.png`                              | 1536 × 1024 | Rutas del diablo y ferroviaria    |
| 8   | `public/rutas/ruta-del-diablo-pedegua-chincolco.png`   | 1536 × 1024 | Portada "Donde el Diablo perdió…" |
| 9   | `public/rutas/ruta-ferroviaria-pedegua-las-palmas.png` | 1536 × 1024 | Portada Ruta Ferroviaria          |
| 10  | `public/brand/diablo-buscando.png`                     | 1024 × 1024 | Opcional: páginas vacías          |
| 11  | `public/leyenda/*.png`                                 | 1536 × 1024 | Opcional: página de la leyenda    |
