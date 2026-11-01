# Propuesta de contenido — comuna de Petorca

> Investigación del 2026-11-01 en fuentes públicas, para el sitio acotado a la
> comuna de Petorca (rama `petorca`). Es una **propuesta**: nada de esto está
> cargado todavía. Regla del proyecto: no se publica nada sin fuente, y lo que
> viene de una sola fuente secundaria (marcado ⚠️) se confirma antes, idealmente
> con la Oficina de Turismo de la Municipalidad o con la gente de la zona.

## Hoy en la base

8 lugares (todos con descripción y fotos; ninguno con dirección, horario ni
contacto), 14 pueblos (5 con resumen), 0 rutas publicadas (hasta correr
`supabase/manual/petorca-rutas.sql`) y nada sobre la leyenda del diablo más
allá de una línea en una ruta.

---

## ⚠️ Decisión urgente: el nombre "Donde el diablo perdió el poncho" ya existe

**Es una ruta turística real de Petorca**, con dueños:

- La crearon en 2018 la **Municipalidad de Petorca e INDAP** con
  emprendedores de turismo rural de la comuna; va de **Pedegua a Chalaco**,
  con 20 señaléticas y, al lanzarse, un bus guiado que terminaba con
  degustación en la viña El Sobrante ([El Informador, 2018][elinformador];
  [Economía y Negocios, 2018][eyn]).
- Su presidenta es **Nataly Muñoz**; en septiembre de 2026 ganó un **Premio
  Regional de Turismo** (Corporación Regional de Turismo de Valparaíso y
  Sernatur) ([La Ligua Noticias, 24-09-2026][premio]).
- Organiza con la Municipalidad **"Cocinando con el Diablo"**: la segunda
  versión fue ayer, 31 de octubre de 2026, en la Plaza de Petorca, con feria
  de emprendedores, cocinerías, vinos del valle, buses a viñas y petroglifos,
  y talleres ([La Ligua Noticias, 23-10-2026][cocinando]).
- Instagram citado en prensa: `@ruta_dondeeldiabloperdio`
  ([El Mercurio de Valparaíso, 29-09-2024][mercurio]).

Nuestra ruta nueva se llama igual. Publicarla así puede parecer que es la de
ellos, o que hablamos en su nombre. **Propuesta:**

1. Se probó renombrar la nuestra a "Ruta del Diablo: de Pedegua a Chincolco",
   pero el usuario decidió (2026-11-01) que se llame **"Donde el Diablo perdió
   el poncho"**. Sigue siendo recomendable hablar con la ruta oficial.
2. **Contactar a la ruta** (Nataly Muñoz) para ofrecerles aparecer en el sitio
   con sus emprendedores, sus paradas reales y sus eventos — con su permiso y
   sus datos. Es la alianza más natural para el sitio: ya hacen lo que el sitio
   quiere mostrar.

---

## 1. Página nueva: "La leyenda del diablo" (prioridad alta)

> **Hecho (2026-11-01)**: `/leyenda`, con Escuchar. Fuente principal nueva y
> sólida: FUCOA, _El Mandinga. Historias del diablo en la zona central de
> Chile_ (2021, apoyo del Ministerio de Agricultura), que recoge el poema de
> 1894 y las versiones del libro de 2015 — reemplaza a Academia X-Ray ⚠️.

El sitio se llama como el dicho, pero no lo cuenta. Hay material:

- **De dónde viene el dicho**: del poema **"La Muerte del Diablo"**, de
  **Elías Lizana**, vicepárroco de Hierro Viejo, publicado en **1894** en la
  sección "Canciones Populares" del periódico **_La Voz de Petorca_**. Cuenta
  las andanzas del diablo por la zona: **pierde el poncho en Chalaco**, muere
  en Petorca, lo entierran en La Ligua y sus honras fúnebres son en Quillota;
  también aparecen la diabla y los diablitos ([Academia X-Ray][xray] ⚠️).
- **Las leyendas que lo explican**, del libro **_Narraciones tradicionales de
  Petorca y sus alrededores_** (2015, Ministerio de las Culturas)
  ([Academia X-Ray][xray] ⚠️):
  - Versión de **Ana Leyton Morales**: en la bonanza del oro y la plata, un
    forastero elegante gana siempre en la cantina; los mineros creen que es el
    diablo, lo siguen hasta la tinaja donde guarda sus ganancias y lo matan.
    En su bolsillo encuentran una estampita de la Virgen: no era el diablo.
  - Otra: un minero llegado del valle del Choapa, buen trabajador pero
    pendenciero, a quien apodaron "El Diablo".
- **La versión de la ruta turística**: el diablo bailaba cueca con los mineros
  los días de pago, de frac negro y con dentadura de oro; dejó olvidado el
  poncho tras una fiesta de Año Nuevo en la que pagó la cuenta de todos, y
  huía de los curas por la **Escalera del Diablo**, cuyos peldaños están "al
  revés" ([El Informador, 2018][elinformador]).

**Antes de publicar**: conseguir el libro de 2015 (fuente primaria; quizá en la
biblioteca de la Casa de Manuel Montt o en la Municipalidad) y, si se puede, el
texto del poema. Se puede enlazar desde el inicio y leer con "Escuchar".

## 2. Lugares nuevos

| Lugar                                   | Pueblo                                     | Qué es                                                                                                                                    | Fuente                                                             | Estado                         |
| --------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| **Viña y bodega El Sobrante**           | El Sobrante                                | Bodega que conserva cepas de origen colonial; vino, chicha y ensamblajes; sala de ventas (`bodega@elsobrante.cl`). Fin de la ruta en 2018 | [Radio Agricultura, 2016][sobrante]; [El Informador][elinformador] | Confirmar visitas y horario    |
| **Petroglifos de El Arenal**            | Chincolco                                  | Arte rupestre a ~27 km al noreste de Petorca, camino a El Pedernal (~2 ha)                                                                | [Tesis U. de Chile, 2022][tesis]; [EcuRed][ecured] ⚠️              | Confirmar acceso               |
| **Petroglifos de Quebrada La Monhuaca** | Chincolco / Chalaco (las fuentes difieren) | Sitio de arte rupestre; parada de la ruta                                                                                                 | [Tesis U. de Chile, 2022][tesis]; [El Informador][elinformador]    | Confirmar ubicación            |
| **Petroglifos de Cerro Tongorito**      | Chincolco                                  | Sitio de arte rupestre                                                                                                                    | [Tesis U. de Chile, 2022][tesis]                                   | Confirmar acceso               |
| **Artesanía en pedernalita**            | El Pedernal                                | Artesanía en piedra; parada de la ruta                                                                                                    | [El Informador][elinformador]                                      | Falta quién la hace y dónde    |
| **Poza del Renegado**                   | El Pedernal                                | Poza en el río                                                                                                                            | [EcuRed][ecured] ⚠️                                                | Confirmar en terreno           |
| **Portada de Chincolco**                | Chincolco                                  | Lugar de interés                                                                                                                          | [EcuRed][ecured] ⚠️                                                | Confirmar qué es               |
| **Plaza de Hierro Viejo**               | Hierro Viejo                               | Plaza del pueblo                                                                                                                          | [EcuRed][ecured] ⚠️                                                | Falta foto y texto             |
| **Rincón Criollo** (restaurante)        | ?                                          | Restaurante de la presidenta de la ruta                                                                                                   | [El Mercurio de Valparaíso][mercurio]                              | Falta dirección; pedir permiso |
| **Turismo Rural La Nina**               | Pedegua (Ruta E-35, km 37,5)               | Restorán de turismo rural, punto de partida de la ruta en 2018                                                                            | [El Informador][elinformador]                                      | Confirmar que siga abierto     |

Los guías de petroglifos que aparecen en "Cocinando con el Diablo" (**Club de
Montaña Arrank'a**) podrían ser el contacto para visitarlos con guía.

### 2.1 Candidatos para las categorías nuevas (2026-11-01)

Explorar pasó a tener pestañas por categoría (Gastronomía, Alojamiento,
Naturaleza y aventura, Patrimonio y cultura, Recreación). Para Gastronomía,
Alojamiento y Recreación **no hay todavía nada cargado**. Esto es lo que se
encontró en internet: fuentes débiles (anuncios, Facebook, directorios
viejos) y **sin ubicación exacta**, así que no se cargó nada. Confirmar que
siguen abiertos y cargarlos desde `/admin/lugares/nuevo` con su ubicación de
Google Maps. Un lugar puede ir en más de una categoría ("También aparece en").

| Candidato                                             | Dónde       | Categorías                 | Fuente                                              |
| ----------------------------------------------------- | ----------- | -------------------------- | --------------------------------------------------- |
| Viña y bodega El Sobrante                             | El Sobrante | Gastronomía (+ Patrimonio) | Ver tabla de arriba (fuente sólida)                 |
| Camping Don Juanito                                   | Chincolco   | Alojamiento + Recreación   | [Facebook][donjuanito] (piscina, quinchos, cabañas) |
| Hospedaje Petro-Chalaco                               | Chalaco     | Alojamiento                | [Facebook][petrochalaco] (cabaña de 3 piezas)       |
| Hostal La Taquilla (Luchito Silva)                    | Chincolco   | Alojamiento                | [Mundo Chileno][hostales] ⚠️ (directorio)           |
| Domos "Aguas de Chincol"                              | Chincolco   | Alojamiento + Recreación   | [Airbnb][airbnb] ⚠️ (anuncio)                       |
| Hotel Andino Petorca, Casa Petorca                    | Petorca     | Alojamiento                | [Alojamiento Chile][alojamiento] ⚠️ (≈2 años)       |
| El Rincón Criollo                                     | Chincolco   | Gastronomía                | [Classici Stranieri][classici] ⚠️ (texto antiguo)   |
| Valsof, Donde Manuel, Tamy's Club, El Yugo, La Casona | Petorca     | Gastronomía                | [Classici Stranieri][classici] ⚠️ (texto antiguo)   |

Lo más rápido para completarlo: pedirle a la Municipalidad (Oficina de
Turismo o Fomento Productivo) su catastro de alojamientos y restaurantes, y a
la ruta "Donde el Diablo perdió el poncho" sus emprendedores.

[donjuanito]: https://www.facebook.com/campingdonjuanito/
[petrochalaco]: https://www.facebook.com/Petrochalaco/
[hostales]: https://www.mundochileno.com/petorca/hostales
[airbnb]: https://es-l.airbnb.com/rooms/51268411
[alojamiento]: https://alojamientochile.com/valparaiso/petorca/
[classici]: https://www.classicistranieri.com/es/articles/p/e/t/Petorca.html

## 3. Mejorar los lugares que ya están

- **Iglesia La Merced**: construida por los jesuitas en 1640 y reconstruida en
  1780, 1800 y 1857; guarda un Cristo de madera articulado de 1660 y un
  sagrario de plata ([EcuRed][ecured] ⚠️). La **Fiesta de Nuestra Señora de la
  Merced** (septiembre) tiene bailes chinos ([Patrimonio Inmaterial][chinos];
  [G5 Noticias, 2025][merced]).
- **Casa natal de Manuel Montt**: Monumento Nacional desde 1929; hoy es
  biblioteca pública ([EcuRed][ecured] ⚠️).
- **Escalera del Diablo**: sumar la leyenda (peldaños al revés, el diablo
  huyendo de los curas) y que la visitó "Socios por Chile" (Canal 13) en 2026
  ([La Ligua Noticias][cocinando]).
- A los 8 lugares les falta **dirección, horario y contacto**: pedirlos a la
  Municipalidad o a cada lugar.

## 4. Pueblos

- **Agregar Chalaco** (hecho 2026-11-01: `supabase/manual/chalaco.sql`, coordenada de OpenStreetMap): no estaba en la base, y es donde el diablo perdió el
  poncho (según el poema) y donde termina la ruta.
- **El Pedernal**: el río Pedernal (también llamado río Chalaco) se junta con
  el Petorca frente a Chincolco; en sus cerros se trabajaron minas de plata y
  cobre (diccionario de Asta-Buruaga, 1899, citado en [Kiddle][kiddle] ⚠️).
- **Manuel Montt y Hierro Viejo**: estaciones del ramal ferroviario Pedegua–
  Petorca (1924; pasajeros hasta 1965) ([Hispanopedia][hispano] ⚠️).
- **Palquico, Frutillar, Las Palmas, La Polcura, Santa Julia, La Chimba, La
  Ñipa**: no encontré material citable. Pedir a la Municipalidad o a juntas de
  vecinos; mientras tanto se quedan sin resumen (nunca relleno).

## 5. Sección nueva: "Qué pasa en Petorca" (calendario)

| Cuándo           | Qué                                                                                                                 | Dónde                            | Fuente                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Enero–febrero    | Semanas de cada localidad: **Semana Petorquina, Chincolcana y Hierruna** (deportes, reinas, festival de la canción) | Petorca, Chincolco, Hierro Viejo | [EcuRed][ecured] ⚠️                                    |
| Septiembre       | **Fiesta de Nuestra Señora de la Merced**, con bailes chinos                                                        | Petorca                          | [Patrimonio Inmaterial][chinos]; [G5 Noticias][merced] |
| Septiembre       | **Fiesta de la Virgen de la Merced**                                                                                | Hierro Viejo                     | [Patrimonio Inmaterial][chinos]                        |
| Octubre          | **Fiesta de la Virgen del Rosario**                                                                                 | Hierro Viejo                     | [Patrimonio Inmaterial][chinos]                        |
| Fines de octubre | **Cocinando con el Diablo** (2.ª versión: 31-10-2026)                                                               | Plaza de Petorca                 | [La Ligua Noticias][cocinando]                         |

Las fechas exactas de cada año se confirman con la Municipalidad.

## 6. Página "Sobre Petorca" (historia y contexto)

- Fundada el **8 de abril de 1753** por Domingo Ortiz de Rozas como **Villa
  Santa Ana de Briviesca**, en honor a su esposa ([EcuRed][ecured] ⚠️; otra
  fuente dice 1754, [Hispanopedia][hispano] ⚠️ — hay que confirmar).
- **Oro**: hallazgo del manto aurífero de los Tornos, en Hierro Viejo, en 1730
  ([EcuRed][ecured] ⚠️; coincide con el resumen de Hierro Viejo ya cargado).
- 1.523 km² y 9.826 habitantes (Censo 2017) ([EcuRed][ecured]).
- **Geoparque Valle de Petorca**: iniciativa de 2019 (geólogo Vladimir
  Vicencio, arqueóloga Claudia Montero y otros) que pone en valor los cerros
  volcánicos, el río y los petroglifos ([El Mostrador, 2019][geoparque]).
- **Crisis hídrica** (opcional, con cuidado): la zona fue declarada en escasez
  hídrica 14 veces desde 2008 y es símbolo de la lucha por el agua
  ([El Mostrador, 2019][geoparque]). Es parte real del territorio; contarlo con
  respeto o dejarlo fuera es decisión tuya.

## 7. A quién contactar

1. **Oficina de Turismo de la Municipalidad de Petorca** (la web
   `munipetorca.com` no respondió al revisarla): direcciones, horarios,
   fechas, fotos y los pueblos sin resumen.
2. **Ruta "Donde el diablo perdió el poncho"** (Nataly Muñoz): alianza y
   permiso para mostrar su ruta y emprendedores.
3. **Club de Montaña Arrank'a**: visitas guiadas a petroglifos.
4. **Viña El Sobrante** (`bodega@elsobrante.cl`): visitas y horario.

## Orden sugerido

1. Escribirle a la ruta oficial (nuestra ruta usa su mismo nombre).
2. Página de la leyenda (con lo que ya hay, marcando las fuentes).
3. Viña El Sobrante y los 3 sitios de petroglifos (tienen fuente sólida).
4. Calendario de fiestas.
5. Lo marcado ⚠️, a medida que se confirme.

[elinformador]: https://www.elinformador.cl/actualidad-regional/donde-diablo-perdio-poncho-la-nueva-ruta-turistica-petorca/
[eyn]: http://www.economiaynegocios.cl/noticias/noticias.asp?id=444399
[premio]: https://laliguanoticias.cl/2026/09/24/ruta-turistica-donde-el-diablo-perdio-el-poncho-recibe-reconocimiento-regional-por-su-aporte-al-turismo-rural-y-cultural-de-petorca/
[cocinando]: https://laliguanoticias.cl/2026/10/23/cocinando-con-el-diablo-reunira-en-petorca-gastronomia-musica-y-patrimonio-este-31-de-octubre/
[mercurio]: https://www.mercuriovalpo.cl/impresa/2024/09/29/full/cuerpo-reportajes/8
[xray]: https://academiaxray.cl/blog/coche-de-guagua-antiguo/
[sobrante]: https://www.radioagricultura.cl/programas/el-agro/desempolvan-la-olvidada-tradicion-vitivinicola-del-valle-petorca_20161201/
[tesis]: https://repositorio.uchile.cl/handle/2250/201561
[ecured]: https://www.ecured.cu/Petorca_(Chile)
[chinos]: https://www.patrimonioinmaterial.gob.cl/sites/www.patrimonioinmaterial.gob.cl/files/2021-11/Infograf%C3%ADa-Bailes-Chinos-Valpara%C3%ADso_VERSION-DIGITAL.pdf
[merced]: https://g5noticias.cl/2025/10/01/religiosidad-patrimonio-y-cultura-comunitaria-petorca-celebro-con-alegria-la-fiesta-de-nuestra-senora-de-la-merced/
[kiddle]: https://ninos.kiddle.co/R%C3%ADo_Pedernal
[hispano]: https://es.hispanopedia.com/wiki/Petorca
[geoparque]: https://www.elmostrador.cl/cultura/2019/05/05/nace-geoparque-de-petorca-en-medio-de-crisis-ambiental/
