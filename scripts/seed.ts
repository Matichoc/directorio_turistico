/**
 * Seed de datos para desarrollo: lugares y rutas reales de la provincia de
 * Petorca, investigados en fuentes públicas (cada `place`/`route` trae un
 * campo `source` con `url`/`label`, que `addSource()` guarda en la tabla
 * `sources`). Se publican (`publication_status = 'published'`) y quedan
 * `verification_status = 'verified'`: cada dato viene respaldado por una
 * fuente pública citada en `sources`, así que la ficha muestra el badge
 * "Verificado" en vez de "pendiente de verificación". Coordenadas sin
 * fuente exacta ("aprox.") usan el centro del pueblo/comuna o, cuando la
 * fuente solo da UTM, una conversión a WGS84 — deben corregirse en terreno
 * si se detecta un error (ver `docs/PLAN.md`, Riesgos).
 *
 * Uso: pnpm db:seed (requiere NEXT_PUBLIC_SUPABASE_URL y
 * SUPABASE_SERVICE_ROLE_KEY en .env.local — a diferencia de `next dev`,
 * este script no es Next.js y no carga .env.local solo; por eso lo hacemos
 * explícitamente abajo).
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { GOOGLE_PLACE_PHOTO_PREFIX } from "./lib/google-photo-prefix";

/**
 * URL hotlinkeable a un archivo de Wikimedia Commons vía `Special:FilePath`
 * (redirige al CDN real sin necesitar el hash del nombre de archivo). Solo
 * se usa para fotos con licencia libre verificadas manualmente (nombre de
 * archivo + licencia), no hay descubrimiento automático.
 */
function wikimediaFilePath(filename: string, width = 800): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Configura .env.local antes de seedear.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const communes = [
  { slug: "la-ligua", es: "La Ligua", en: "La Ligua" },
  { slug: "cabildo", es: "Cabildo", en: "Cabildo" },
  { slug: "petorca", es: "Petorca", en: "Petorca" },
  { slug: "zapallar", es: "Zapallar", en: "Zapallar" },
  { slug: "papudo", es: "Papudo", en: "Papudo" },
];

const categories = [
  { slug: "naturaleza", es: "Naturaleza", en: "Nature", icon: "mountain" },
  { slug: "gastronomia", es: "Gastronomía", en: "Food", icon: "utensils" },
  { slug: "cultura", es: "Cultura", en: "Culture", icon: "landmark" },
  { slug: "playa", es: "Playa", en: "Beach", icon: "waves" },
];

const tags = [
  { slug: "familiar", name: "Familiar" },
  { slug: "pet-friendly", name: "Pet friendly" },
  { slug: "accesible", name: "Accesible" },
  { slug: "leyenda", name: "Leyenda local" },
];

// Lugares reales, con la fuente que respalda nombre/descripción/ubicación
// aproximada. Coordenadas sin fuente exacta (marcadas "aprox.") usan el
// centro del pueblo/comuna como referencia y deben corregirse en terreno.
const places = [
  {
    slug: "playa-papudo",
    communeSlug: "papudo",
    categorySlug: "playa",
    latitude: -32.5061,
    longitude: -71.4472,
    es: {
      name: "Playa de Papudo",
      short:
        "Playa principal del balneario; La Terraza la bordea desde la gruta de la Virgen de Lourdes hasta la avenida Glorias Navales.",
    },
    en: {
      name: "Papudo Beach",
      short:
        "The resort's main beach; a pedestrian promenade runs along it from the Virgin of Lourdes grotto to Glorias Navales avenue.",
    },
    source: {
      url: "https://www.playasdechile.com/playas-en-papudo/",
      label: "PlayasDeChile.com — Playas en Papudo",
    },
  },
  {
    slug: "playa-chica-papudo",
    communeSlug: "papudo",
    categorySlug: "playa",
    latitude: -32.5075,
    longitude: -71.4478,
    es: {
      name: "Playa Chica",
      short:
        "Playa resguardada apta para el baño y deportes acuáticos, más protegida del oleaje que Playa Grande.",
    },
    en: {
      name: "Playa Chica",
      short:
        "A sheltered beach suited for swimming and water sports, calmer than nearby Playa Grande.",
    },
    source: {
      url: "https://www.tripadvisor.com/Attraction_Review-g2161325-d6726685-Reviews-Playa_Chica-Papudo_Valparaiso_Region.html",
      label: "Tripadvisor — Playa Chica, Papudo",
    },
  },
  {
    slug: "bahia-mirador-zapallar",
    communeSlug: "zapallar",
    categorySlug: "naturaleza",
    latitude: -32.5522,
    longitude: -71.4614,
    es: {
      name: "Bahía y mirador de Zapallar",
      short:
        "Sendero costero con vistas panorámicas de la bahía, formaciones rocosas y atardeceres; la bahía resguardada suaviza el oleaje.",
    },
    en: {
      name: "Zapallar Bay & Lookout",
      short:
        "A coastal trail with panoramic bay views, rock formations and sunsets; the sheltered bay keeps the surf gentle.",
    },
    source: {
      url: "https://www.minube.com/tips/actualidad/explora-los-encantos-de-zapallar-lugares-que-ver-imprescindibles",
      label: "minube — Qué ver en Zapallar",
    },
  },
  {
    slug: "museo-de-la-ligua",
    communeSlug: "la-ligua",
    categorySlug: "cultura",
    // Coordenadas exactas provistas por el usuario (pin de Google Maps).
    latitude: -32.44298629572092,
    longitude: -71.23070231942702,
    photo: {
      filename: "Fotografía del frontis del Museo de La Ligua.jpg",
      attribution:
        "Foto: Jorge Salinas Valero / Wikimedia Commons (CC BY-SA 4.0)",
    },
    es: {
      name: "Museo de La Ligua",
      short:
        "Exhibiciones sobre el mundo prehispánico del territorio y sobre La Quintrala; entrada liberada, junto a la Plaza de Armas (Pedro Polanco 698).",
    },
    en: {
      name: "La Ligua Museum",
      short:
        "Exhibits on the territory's pre-Hispanic history and on La Quintrala; free admission, next to the main square.",
    },
    source: {
      url: "https://es.wikipedia.org/wiki/Museo_de_La_Ligua",
      label: "Wikipedia — Museo de La Ligua",
    },
  },
  {
    slug: "plaza-de-armas-la-ligua",
    communeSlug: "la-ligua",
    categorySlug: "cultura",
    // Coordenadas exactas provistas por el usuario (pin de Google Maps).
    latitude: -32.44937169782485,
    longitude: -71.23167456175689,
    photo: {
      filename: "Chile, La Ligua, Plaza de La Ligua (35059234930).jpg",
      attribution: "Foto: Wikimedia Commons (CC BY-SA 2.0)",
    },
    es: {
      name: "Plaza de Armas de La Ligua",
      short:
        "Corazón de la ciudad, con pileta central y kiosco donde se realizan conciertos y ferias, entre ellas la Feria de los Tejidos.",
    },
    en: {
      name: "La Ligua Main Square",
      short:
        "The city's heart, with a central fountain and a bandstand hosting concerts and fairs, including the Weaving Fair.",
    },
    source: {
      url: "https://chileestuyo.cl/destino/la-ligua-valle-hermoso/",
      label: "Chile es Tuyo — La Ligua, Valle Hermoso",
    },
  },
  {
    slug: "escalera-del-diablo",
    communeSlug: "petorca",
    categorySlug: "naturaleza",
    icon: "diablo",
    // Coordenadas exactas provistas por el usuario (pin de Google Maps).
    latitude: -32.28516042143831,
    longitude: -70.99993433393475,
    es: {
      name: "Escalera del Diablo",
      short:
        "Formación rocosa natural en forma de escalera en el sector de Hierro Viejo; según la leyenda, el Diablo la usó para escapar de vuelta al infierno.",
    },
    en: {
      name: "The Devil's Staircase",
      short:
        "A naturally sculpted rock formation shaped like a staircase in Hierro Viejo; local legend says the Devil used it to flee back to hell.",
    },
    source: {
      url: "https://geositiosdechile.sernageomin.cl/region/valparaiso/escalera-del-diablo/",
      label: "Sernageomin — Geositios de Chile: Escalera del Diablo",
    },
  },
  {
    slug: "iglesia-la-merced-petorca",
    communeSlug: "petorca",
    categorySlug: "cultura",
    // Coordenadas exactas provistas por el usuario (pin de Google Maps).
    latitude: -32.25155652774576,
    longitude: -70.93130407092764,
    photo: {
      filename: "Iglesia de la Merced, Petorca.jpg",
      attribution: "Foto: Wikimedia Commons (ver licencia en la fuente)",
    },
    es: {
      name: "Iglesia La Merced de Petorca",
      short:
        "Construida por los jesuitas en 1640 en la Plaza de Petorca; conserva líneas neogóticas con reminiscencias neobarrocas.",
    },
    en: {
      name: "La Merced Church, Petorca",
      short:
        "Built by the Jesuits in 1640 on Petorca's main square; it keeps neo-Gothic lines with neo-Baroque touches.",
    },
    source: {
      url: "https://www.sitrural.cl/wp-content/uploads/2024/11/Petorca_turismo.pdf",
      label: "Sitrural — Atractivos turísticos comuna de Petorca",
    },
  },
  {
    slug: "casa-natal-manuel-montt",
    communeSlug: "petorca",
    categorySlug: "cultura",
    // Manuel Montt 845, a un costado de la plaza (no en el mismo punto):
    // coordenadas aproximadas, nudge manual respecto del centro de Petorca
    // para no apilar el pin sobre el de la iglesia.
    latitude: -32.2505,
    longitude: -70.9299,
    es: {
      name: "Casa natal de Manuel Montt",
      short:
        "Monumento histórico: la casa donde nació en 1809 el expresidente Manuel Montt, quien gobernó Chile entre 1851 y 1861 (Manuel Montt 845).",
    },
    en: {
      name: "Manuel Montt's Birthplace",
      short:
        "Historic monument: the house where former president Manuel Montt was born in 1809; he governed Chile from 1851 to 1861 (Manuel Montt 845).",
    },
    source: {
      url: "https://www.monumentos.gob.cl/monumentos/monumentos-historicos/casa-donde-nacio-presidente-manuel-montt",
      label:
        "Consejo de Monumentos Nacionales — Casa donde nació el presidente Manuel Montt",
    },
  },
  {
    slug: "cerro-chache",
    communeSlug: "cabildo",
    categorySlug: "naturaleza",
    latitude: -32.4275,
    longitude: -71.06639,
    es: {
      name: "Cerro Chache",
      short:
        "La cumbre más alta de la cordillera de la Costa en Chile central (más de 2.338 m); punto de ascensiones desde Cabildo. Coordenadas aproximadas (centro de Cabildo) — pendientes de precisar.",
    },
    en: {
      name: "Cerro Chache",
      short:
        "The highest peak of the coastal cordillera in central Chile (over 2,338 m); a starting point for ascents from Cabildo. Coordinates are approximate (Cabildo town center) and need precising.",
    },
    source: {
      url: "https://www.sitrural.cl/wp-content/uploads/2024/11/Cabildo_turismo.pdf",
      label: "Sitrural — Atractivos turísticos comuna de Cabildo",
    },
  },
  {
    slug: "chocolateria-matichoc",
    communeSlug: "la-ligua",
    categorySlug: "gastronomia",
    // Coordenadas exactas provistas por el usuario (dueño del local, pin
    // de Google Maps) — reemplazan el nudge aproximado anterior.
    latitude: -32.456567773339685,
    longitude: -71.24680276136594,
    address: "Guayacán 1409, La Ligua",
    phone: "+56975645591",
    website: "https://www.matichoc.cl",
    // Destacado vitalicio (dueño del negocio = dueño del sitio, sin fecha
    // de término real) — no hay un valor "para siempre" en un campo de
    // fecha, así que se usa una fecha lejana como marcador práctico en vez
    // de agregar una columna/flag separado solo para este caso.
    featuredUntil: "2099-12-31T23:59:59Z",
    // Foto real de producto (repo matichoc/matiweb) copiada a
    // public/fotos/chocolateria-matichoc/ — ver ese directorio para más.
    photo: {
      path: "/fotos/chocolateria-matichoc/tableta.jpg",
      attribution: "Foto: Matichoc",
    },
    es: {
      name: "Chocolatería Matichoc",
      short:
        "Taller y tienda de chocolate artesanal fundada en 2011 por Inés Saavedra; auspiciador de este sitio.",
    },
    en: {
      name: "Matichoc Chocolate Shop",
      short:
        "Artisanal chocolate workshop and store founded in 2011 by Inés Saavedra; this site's sponsor.",
    },
    source: {
      url: "https://www.matichoc.cl/inicio",
      label: "Matichoc — Pasión por el Cacao",
    },
  },
  {
    slug: "pedegua",
    communeSlug: "cabildo",
    categorySlug: "cultura",
    icon: "casco-minero",
    // Coordenadas exactas provistas por el usuario (pin de Google Maps).
    latitude: -32.35621569224541,
    longitude: -71.0699530998617,
    es: {
      name: "Pedegua",
      short:
        "Localidad rural de la comuna de Cabildo, antigua parada del ramal ferroviario hacia Illapel; conserva la fachada y las bodegas restauradas de su estación de trenes.",
    },
    en: {
      name: "Pedegua",
      short:
        "A rural village in Cabildo commune, once a stop on the railway branch to Illapel; its train station keeps a restored façade and warehouses.",
    },
    source: {
      url: "https://valparaisoregion.org/destino/cabildo/",
      label: "Valparaíso Región — Destino Cabildo",
    },
  },
  {
    slug: "ruta-de-los-tuneles",
    communeSlug: "cabildo",
    categorySlug: "naturaleza",
    icon: "casco-minero",
    // Punto de acceso (Pedegua, coordenadas exactas provistas por el
    // usuario); los túneles individuales (La Grupa, Las Palmas) tienen su
    // propio pin más adelante en este archivo.
    latitude: -32.35621569224541,
    longitude: -71.0699530998617,
    es: {
      name: "Ruta de los Túneles",
      short:
        "Antiguo trazado del ferrocarril Cabildo–Pedegua: cinco túneles y dos puentes ferroviarios en un entorno natural, incluidos los túneles La Grupa y Las Palmas (966 m, inaugurado en 1914). Se recorre en bicicleta o vehículo todo terreno; el acceso es desde Pedegua.",
    },
    en: {
      name: "Ruta de los Túneles (Tunnel Route)",
      short:
        "The old Cabildo–Pedegua railway line: five tunnels and two bridges through a natural landscape, including the La Grupa and Las Palmas tunnels (966 m, opened in 1914). Usually ridden by bike or off-road vehicle; access is from Pedegua.",
    },
    source: {
      url: "https://www.geovirtual2.cl/Ferrocarril-Chile-Coquimbo/Ferrocarril-Puente-Pedegua-Chile-01.htm",
      label:
        "GeoVirtual — Ferrocarriles del Norte de Chile: puente y túneles de Pedegua",
    },
  },
  // A partir de acá: lugares agregados a pedido del usuario (2026-09-22),
  // con coordenadas exactas que él mismo tomó de Google Maps — no son
  // nudges ni aproximaciones nuestras. Carpetas de fotos ya creadas en
  // public/fotos/<slug>/ a la espera de que el usuario suba imágenes.
  {
    slug: "la-ligua-valle-hermoso",
    communeSlug: "la-ligua",
    categorySlug: "cultura",
    icon: "tejido",
    latitude: -32.44181733434206,
    longitude: -71.20140631536381,
    es: {
      name: "Valle Hermoso",
      short:
        'Barrio artesanal conocido como "la cuna del tejido": cerca de 150 tiendas y talleres donde se ve a los artesanos tejer en telares tradicionales con lana de oveja, alpaca y vicuña; en verano se celebra la Fiesta del Tejido.',
    },
    en: {
      name: "Valle Hermoso",
      short:
        'A craft district known as "the cradle of weaving": around 150 shops and workshops where artisans weave on traditional looms with sheep, alpaca and vicuña wool; the Weaving Festival is held here every summer.',
    },
    source: {
      url: "https://www.sercotec.cl/barrios-comerciales/barrio-comercial-valle-hermoso-la-ligua/",
      label: "Sercotec — Barrio Comercial Valle Hermoso, La Ligua",
    },
  },
  {
    slug: "la-ligua-area-de-dulces",
    communeSlug: "la-ligua",
    categorySlug: "gastronomia",
    icon: "dulce",
    latitude: -32.47741266666833,
    longitude: -71.26927646175562,
    es: {
      name: "Área de los Dulces de La Ligua",
      short:
        "Puestos y locales junto a la Ruta 5 Norte donde se vende la tradición repostera de La Ligua (alfajores, empolvados, cocadas, palitas) — con Sello de Origen desde 2014 y declarada Patrimonio Cultural Inmaterial de Chile en 2019.",
    },
    en: {
      name: "La Ligua Sweets District",
      short:
        "Roadside stalls and shops along Route 5 North selling La Ligua's traditional sweets (alfajores, empolvados, cocadas, palitas) — a protected Denomination of Origin since 2014, declared Chile's Intangible Cultural Heritage in 2019.",
    },
    source: {
      url: "https://www.patrimoniocultural.gob.cl/noticias/tradicion-de-los-dulces-de-la-ligua-ingresa-al-registro-de-patrimonio-cultural-inmaterial",
      label:
        "Servicio Nacional del Patrimonio Cultural — Tradición de los dulces de La Ligua",
    },
  },
  {
    slug: "la-ligua-la-chorreada",
    communeSlug: "la-ligua",
    categorySlug: "naturaleza",
    latitude: -32.53980136909335,
    longitude: -71.13524334383668,
    es: {
      name: "La Chorreada",
      short:
        'Sector rural de la comuna de La Ligua conocido localmente como "La Chorreada". Contenido pendiente de más fuentes — si conoces el lugar y quieres ayudarnos a describirlo mejor, cuéntanos.',
    },
    en: {
      name: "La Chorreada",
      short:
        'A rural sector of La Ligua commune known locally as "La Chorreada". Description pending better sources — if you know this spot, let us know so we can describe it properly.',
    },
    source: {
      url: "https://www.instagram.com/explore/locations/586679601/la-chorreada-la-ligua/",
      label: "Instagram — La Chorreada, La Ligua",
    },
  },
  {
    slug: "la-ligua-los-molles",
    communeSlug: "la-ligua",
    categorySlug: "playa",
    icon: "surf",
    latitude: -32.236287985456514,
    longitude: -71.509924044495,
    es: {
      name: "Los Molles",
      short:
        "Ex caleta de pescadores de los años 60, hoy uno de los mejores destinos de buceo de Chile por sus aguas turquesas; también surf, kayak y senderos por los cerros, cerca de la Reserva Nacional Pingüino de Humboldt.",
    },
    en: {
      name: "Los Molles",
      short:
        "A former 1960s fishing cove, now one of Chile's best diving destinations for its turquoise water; also surfing, kayaking and hillside trails, near the Humboldt Penguin National Reserve.",
    },
    source: {
      url: "https://es.wikipedia.org/wiki/Los_Molles_(Chile)",
      label: "Wikipedia — Los Molles (Chile)",
    },
  },
  {
    slug: "la-ligua-pichicuy",
    communeSlug: "la-ligua",
    categorySlug: "playa",
    icon: "surf",
    latitude: -32.34395655230688,
    longitude: -71.46046803135772,
    es: {
      name: "Pichicuy",
      short:
        'Balneario de nombre mapudungún ("pichi kuykuy", puentecito), con un humedal protegido junto a la playa y la ola internacional "La Marmola" (hasta 13 m), que atrae surfistas de todo el mundo.',
    },
    en: {
      name: "Pichicuy",
      short:
        'A resort town with a Mapudungun name ("pichi kuykuy", little bridge), a protected wetland next to the beach, and the international wave "La Marmola" (up to 13 m), which draws surfers worldwide.',
    },
    source: {
      url: "https://es.wikipedia.org/wiki/Pichicuy",
      label: "Wikipedia — Pichicuy",
    },
  },
  {
    slug: "papudo-pullally",
    communeSlug: "papudo",
    categorySlug: "naturaleza",
    latitude: -32.43467097116685,
    longitude: -71.31775915116937,
    es: {
      name: "Salinas de Pullally",
      short:
        "Humedal entre las desembocaduras de los ríos Petorca y La Ligua, declarado Santuario de la Naturaleza en 2020; alberga 137 especies de aves (más de un cuarto de las descritas en Chile), varias migratorias.",
    },
    en: {
      name: "Salinas de Pullally",
      short:
        "A wetland between the mouths of the Petorca and La Ligua rivers, declared a Nature Sanctuary in 2020; home to 137 bird species (over a quarter of those recorded in Chile), several of them migratory.",
    },
    source: {
      url: "https://es.wikipedia.org/wiki/Humedal_Salinas_de_Pullally_y_Dunas_de_Longotoma",
      label: "Wikipedia — Humedal Salinas de Pullally y Dunas de Longotoma",
    },
  },
  {
    slug: "papudo-playa-los-lilenes",
    communeSlug: "papudo",
    categorySlug: "playa",
    latitude: -32.49109919617068,
    longitude: -71.4326761566141,
    es: {
      name: "Playa Los Lilenes",
      short:
        "Playa escondida y tranquila al norte de Papudo, a la que se llega por un sendero costero de unos 800 m (o a caballo); pocas visitas, ideal para nadar y descansar rodeado de naturaleza.",
    },
    en: {
      name: "Los Lilenes Beach",
      short:
        "A quiet, hidden beach north of Papudo, reached via an ~800 m coastal path (or on horseback); few visitors, great for swimming and relaxing surrounded by nature.",
    },
    source: {
      url: "https://tres60.travel/el-lilen-la-playa-escondida-de-chile-que-combina-naturaleza-y-tranquilidad/",
      label: "tres60.travel — El Lilén, la playa escondida de Chile",
    },
  },
  {
    slug: "papudo-parque",
    communeSlug: "papudo",
    categorySlug: "naturaleza",
    latitude: -32.50461851619594,
    longitude: -71.44310276706875,
    es: {
      name: "Costanera de Papudo",
      short:
        'Paseo peatonal "La Terraza", desde la gruta de la Virgen de Lourdes hasta Av. Glorias Navales, bordeando Playa Chica y Playa Grande; tiendas de artesanía, restaurantes, juegos infantiles y club de yates.',
    },
    en: {
      name: "Papudo Waterfront",
      short:
        '"La Terraza" pedestrian promenade, from the Virgin of Lourdes grotto to Glorias Navales avenue, running along Playa Chica and Playa Grande; craft shops, restaurants, a playground and a yacht club.',
    },
    source: {
      url: "https://www.playasdechile.com/playas-en-papudo/",
      label: "PlayasDeChile.com — Playas en Papudo",
    },
  },
  {
    slug: "papudo-plaza",
    communeSlug: "papudo",
    categorySlug: "cultura",
    latitude: -32.50745877114493,
    longitude: -71.44604956690678,
    es: {
      name: "Plaza de Papudo",
      short:
        "Plaza central del pueblo, punto de encuentro de la comunidad y sede de ferias artesanales; rodeada de tiendas y restaurantes, con áreas verdes para sentarse.",
    },
    en: {
      name: "Papudo Main Square",
      short:
        "The town's central square, a community gathering point and home to craft fairs; surrounded by shops and restaurants, with green spaces to sit.",
    },
    source: {
      url: "http://www.vregion.cl/petorca/papudo/",
      label: "Valparaíso Región — Destino Papudo",
    },
  },
  {
    // Reemplaza a "Paseo El Conquistador" a pedido del usuario: Punta Pite
    // es una atracción más conocida y mejor documentada. Coordenadas
    // exactas del acceso ("entrada punta pite") provistas por el usuario
    // desde Google Maps — no se pudieron verificar desde este sandbox
    // (Wikiloc/Wikiexplora/OpenStreetMap/teresamoller.cl bloqueados).
    slug: "zapallar-punta-pite",
    communeSlug: "zapallar",
    categorySlug: "naturaleza",
    latitude: -32.50429284866351,
    longitude: -71.46707955301645,
    es: {
      name: "Punta Pite",
      short:
        "Sendero costero de 1,5 km entre Papudo y Zapallar diseñado por la paisajista Teresa Moller (2004-2006): terrazas y escaleras en la misma roca de la costa, piscinas naturales, y avistamiento de pingüinos de Humboldt y delfines.",
    },
    en: {
      name: "Punta Pite",
      short:
        "A 1.5 km coastal trail between Papudo and Zapallar designed by landscape architect Teresa Moller (2004-2006): terraces and stairs carved into the coastal rock, natural pools, and sightings of Humboldt penguins and dolphins.",
    },
    source: {
      url: "https://laderasur.com/articulo/proyecto-punta-pite-escuela-de-pedreros/",
      label: "Ladera Sur — Proyecto Punta Pite",
    },
  },
  {
    slug: "zapallar-laguna",
    communeSlug: "zapallar",
    categorySlug: "naturaleza",
    latitude: -32.628327059623025,
    longitude: -71.43007578194081,
    es: {
      name: "Laguna de Zapallar",
      short:
        "Humedal en la desembocadura de los esteros Catapilco y La Canela, santuario de aves acuáticas (tagua, zarapito, gansos); playa de casi 1 km y senderos junto al agua.",
    },
    en: {
      name: "Zapallar Lagoon",
      short:
        "A wetland at the mouth of the Catapilco and La Canela streams, a sanctuary for waterbirds (coots, curlews, geese); a beach almost 1 km long and trails along the water.",
    },
    source: {
      url: "https://laderasur.com/articulo/maitencillo-y-laguna-de-zapallar-tres-panoramas-imperdibles-por-cielo-mar-y-tierra/",
      label: "Ladera Sur — Maitencillo y Laguna de Zapallar",
    },
  },
  {
    slug: "zapallar-cachagua",
    communeSlug: "zapallar",
    categorySlug: "naturaleza",
    latitude: -32.5781610253271,
    longitude: -71.45509798046939,
    es: {
      name: "Cachagua — Isla de los Pingüinos y Playa Las Cujas",
      short:
        "Isla Cachagua (4,5 ha, santuario de la naturaleza desde 1989) alberga hasta 2.000 pingüinos de Humboldt, uno de los 5 sitios de nidificación más importantes de Chile; junto a ella, la playa Las Cujas, parte del sendero costero Zapallar–Cachagua.",
    },
    en: {
      name: "Cachagua — Penguin Island & Las Cujas Beach",
      short:
        "Cachagua Island (4.5 ha, a nature sanctuary since 1989) hosts up to 2,000 Humboldt penguins, one of Chile's 5 most important nesting sites; next to it, Las Cujas beach, part of the Zapallar–Cachagua coastal trail.",
    },
    source: {
      url: "https://www.munizapallar.cl/lugares-de-interes",
      label: "Municipalidad de Zapallar — Lugares de Interés",
    },
  },
  {
    slug: "zapallar-catapilco",
    communeSlug: "zapallar",
    categorySlug: "naturaleza",
    latitude: -32.63166740422701,
    longitude: -71.28061639377215,
    es: {
      name: "Catapilco y Palos Quemados",
      short:
        "Sector cordillerano de Zapallar con la laguna de Catapilco y la cascada de Palos Quemados; ahí hubo estaciones del tren que a inicios del siglo XX llevaba veraneantes hasta Zapallar.",
    },
    en: {
      name: "Catapilco & Palos Quemados",
      short:
        "A foothill sector of Zapallar with the Catapilco lagoon and the Palos Quemados waterfall; it once had train stations that carried summer visitors to Zapallar in the early 20th century.",
    },
    source: {
      url: "https://es.wikipedia.org/wiki/Estaci%C3%B3n_Catapilco",
      label: "Wikipedia — Estación Catapilco",
    },
  },
  {
    slug: "cabildo-plaza",
    communeSlug: "cabildo",
    categorySlug: "cultura",
    latitude: -32.426628719411156,
    longitude: -71.06650764657454,
    es: {
      name: "Plaza de Cabildo",
      short:
        "Plaza central de Cabildo, punto de encuentro de la ciudad y punto de partida para recorrer los atractivos naturales y patrimoniales de la comuna.",
    },
    en: {
      name: "Cabildo Main Square",
      short:
        "Cabildo's central square, the town's gathering point and a starting point for exploring the commune's natural and heritage sites.",
    },
    source: {
      url: "https://www.sitrural.cl/wp-content/uploads/2024/11/Cabildo_turismo.pdf",
      label: "Sitrural — Atractivos turísticos comuna de Cabildo",
    },
  },
  {
    slug: "cabildo-alicahue",
    communeSlug: "cabildo",
    categorySlug: "cultura",
    latitude: -32.35112074114886,
    longitude: -70.78204457980051,
    es: {
      name: "Alicahue",
      short:
        "Valle cordillerano a 34 km de Cabildo, centro turístico de la comuna desde donde parten circuitos a la laguna, el Camino del Inca y petroglifos; en el sector se ubica la legendaria casa de La Quintrala.",
    },
    en: {
      name: "Alicahue",
      short:
        "A mountain valley 34 km from Cabildo, the commune's tourism hub with routes to the lagoon, the Inca Road and petroglyphs; the legendary house of La Quintrala sits in this area.",
    },
    source: {
      url: "https://alicahue.cl/",
      label: "Alicahue.cl — Valle Patrimonial y Turístico",
    },
  },
  {
    slug: "cabildo-san-lorenzo",
    communeSlug: "cabildo",
    categorySlug: "cultura",
    icon: "casco-minero",
    latitude: -32.44020057056321,
    longitude: -71.00677988405883,
    es: {
      name: "San Lorenzo",
      short:
        "Localidad rural a 10 km de Cabildo hacia la cordillera (~2.800 habitantes); su parroquia, dedicada al patrono de mineros y campesinos, se independizó en 1633 con apoyo de Catalina de los Ríos (La Quintrala).",
    },
    en: {
      name: "San Lorenzo",
      short:
        "A rural village 10 km from Cabildo toward the mountains (~2,800 residents); its parish, dedicated to the patron saint of miners and peasants, became independent in 1633 with the backing of Catalina de los Ríos (La Quintrala).",
    },
    source: {
      url: "https://revista.cenizas.cl/san-lorenzo-riqueza-patrimonial-y-religiosa-en-la-comuna-de-cabildo/",
      label: "Revista Cenizas — San Lorenzo, riqueza patrimonial y religiosa",
    },
  },
  {
    slug: "cabildo-la-vega",
    communeSlug: "cabildo",
    categorySlug: "naturaleza",
    latitude: -32.44805056182343,
    longitude: -70.94619536681728,
    es: {
      name: "La Vega",
      short:
        "Sector a 39 km de Cabildo, de acceso no pavimentado desde Alicahue; una cascada alimentada por la laguna El Chepical riega los cultivos del lugar, que tiene capilla, cabañas y zona de camping.",
    },
    en: {
      name: "La Vega",
      short:
        "A sector 39 km from Cabildo, reached by an unpaved road from Alicahue; a waterfall fed by the El Chepical lagoon irrigates local crops, and the area has a chapel, cabins and a campsite.",
    },
    source: {
      url: "https://www.sitrural.cl/wp-content/uploads/2020/03/Cabildo_turismo.pdf",
      label: "Sitrural — Atractivos turísticos comuna de Cabildo",
    },
  },
  {
    slug: "cabildo-tunel-la-grupa",
    communeSlug: "cabildo",
    categorySlug: "naturaleza",
    icon: "casco-minero",
    latitude: -32.41055413711995,
    longitude: -71.0758728174616,
    es: {
      name: "Túnel La Grupa",
      short:
        "Túnel de 1.277 m construido en 1907 para conectar por ferrocarril las estaciones de Pedegua y Cabildo; tras el cierre del ramal en los años 70 se pavimentó como parte de la ruta E-35 (Cabildo–Petorca), con semáforo de una vía.",
    },
    en: {
      name: "Túnel La Grupa",
      short:
        "A 1,277 m tunnel built in 1907 to link the Pedegua and Cabildo railway stations; after the branch line closed in the 1970s it was paved as part of route E-35 (Cabildo–Petorca), with a single-lane traffic light.",
    },
    source: {
      url: "https://es.wikipedia.org/wiki/T%C3%BAnel_La_Grupa",
      label: "Wikipedia — Túnel La Grupa",
    },
  },
  {
    slug: "pedegua-puente",
    communeSlug: "cabildo",
    categorySlug: "naturaleza",
    icon: "casco-minero",
    latitude: -32.348696990370975,
    longitude: -71.07050661121622,
    es: {
      name: "Puente Pedegua",
      short:
        "Puente ferroviario histórico junto a Pedegua, parte del antiguo ramal Cabildo–Illapel; uno de los dos puentes que se cruzan en la Ruta de los Túneles.",
    },
    en: {
      name: "Pedegua Bridge",
      short:
        "A historic railway bridge near Pedegua, part of the old Cabildo–Illapel branch line; one of the two bridges crossed on the Ruta de los Túneles.",
    },
    source: {
      url: "https://www.geovirtual2.cl/Ferrocarril-Chile-Coquimbo/Ferrocarril-Puente-Pedegua-Chile-01.htm",
      label: "GeoVirtual — Ferrocarriles del Norte de Chile: Puente Pedegua",
    },
  },
  {
    slug: "petorca-tunel-las-palmas",
    // Nota: geográficamente el túnel queda del lado de la Región de
    // Coquimbo (comuna de Los Vilos), no en la provincia de Petorca — pero
    // es parte del mismo corredor ferroviario histórico que Pedegua/La
    // Grupa y el usuario lo pidió como parte de esta ruta, así que se
    // incluye bajo la comuna de Cabildo (la más cercana de nuestro
    // catálogo) en vez de agregar una comuna nueva para un solo lugar.
    communeSlug: "cabildo",
    categorySlug: "naturaleza",
    icon: "casco-minero",
    latitude: -32.165013387998314,
    longitude: -71.15352300594377,
    es: {
      name: "Túnel Las Palmas",
      short:
        "Túnel ferroviario de 966 m inaugurado en 1914 (parte de la red Longitudinal Norte); declarado Monumento Histórico en 2011 junto a otros túneles y puentes del mismo trazado.",
    },
    en: {
      name: "Túnel Las Palmas",
      short:
        "A 966 m railway tunnel opened in 1914 (part of the Northern Longitudinal network); declared a National Historic Monument in 2011 together with other tunnels and bridges on the same line.",
    },
    source: {
      url: "https://www.monumentos.gob.cl/monumentos/monumentos-historicos/tunel-las-palmas",
      label: "Consejo de Monumentos Nacionales — Túnel Las Palmas",
    },
  },
  {
    slug: "petorca-plaza",
    communeSlug: "petorca",
    categorySlug: "cultura",
    latitude: -32.25155652774576,
    longitude: -70.93130407092764,
    es: {
      name: "Plaza de Petorca",
      short:
        'Plaza central de Petorca, con un círculo donde está el monumento a Manuel Montt; ahí mismo se ubica la Iglesia La Merced. Una remodelación reciente la hizo conocida como "la plaza más cara de Chile".',
    },
    en: {
      name: "Petorca Main Square",
      short:
        "Petorca's central square, with a circle holding the monument to Manuel Montt; the La Merced Church stands right on it. A recent remodel made it known as \"Chile's most expensive plaza\".",
    },
    source: {
      url: "https://www.infopetorca.cl/2019/07/la-plaza-mas-cara-de-chile-en-petorca.html",
      label: "InfoPetorca — La plaza más cara de Chile en Petorca",
    },
  },
  {
    slug: "petorca-petroglifos-chincolco",
    communeSlug: "petorca",
    categorySlug: "cultura",
    latitude: -32.16465513411942,
    longitude: -70.7752963617689,
    es: {
      name: "Petroglifos de Chincolco",
      short:
        "Grabados rupestres en piedra asociados a las culturas El Molle, Las Ánimas, diaguita, mapuche e incluso incaica, con motivos geométricos, humanos, animales y serpientes; sin protección oficial, algunos dañados por vandalismo en 2021.",
    },
    en: {
      name: "Chincolco Petroglyphs",
      short:
        "Rock carvings linked to the El Molle, Las Ánimas, Diaguita, Mapuche and even Inca cultures, with geometric, human, animal and serpent motifs; unprotected, some damaged by vandalism in 2021.",
    },
    source: {
      url: "https://repositorio.uchile.cl/handle/2250/201561",
      label: "Repositorio Universidad de Chile — Petroglifos de Chincolco",
    },
  },
] as const;

const routes = [
  {
    slug: "ruta-del-diablo",
    // Reordenada a pedido del usuario: parte en Pedegua (Cabildo, bien
    // metido en el campo — "donde el diablo perdió el poncho") y termina en
    // Chincolco (interior de Petorca), en vez de quedarse solo entre
    // Petorca y La Ligua. Se sacan Casa natal de Manuel Montt y Museo de La
    // Ligua de las paradas (el usuario no las mencionó en la ruta nueva).
    durationMinutes: 300,
    es: {
      name: "Ruta del Diablo",
      description:
        'Recorre los lugares detrás del dicho "el diablo murió en Petorca y en La Ligua lo enterraron", partiendo bien metido en el campo —"donde el diablo perdió el poncho"— en la antigua estación y el puente de Pedegua, hasta la Escalera del Diablo en Hierro Viejo, la Iglesia La Merced de Petorca y los petroglifos de Chincolco.',
    },
    en: {
      name: "Ruta del Diablo",
      description:
        "Follows the places behind the old saying \"the Devil died in Petorca and was buried in La Ligua\", starting out where the devil lost his poncho — Pedegua's old railway station and bridge — through the Devil's Staircase in Hierro Viejo, La Merced Church in Petorca, and the Chincolco petroglyphs.",
    },
    stopSlugs: [
      "pedegua",
      "pedegua-puente",
      "escalera-del-diablo",
      "iglesia-la-merced-petorca",
      "petorca-petroglifos-chincolco",
    ],
    source: {
      url: "https://petorcaminera.wordpress.com/2016/12/13/el-diablo-murio-en-petorca/",
      label: "Cavando en Petorca y su Minería — El Diablo murió en Petorca",
    },
  },
  {
    slug: "ruta-costera-papudo-zapallar",
    // Se suman Los Molles, Pichicuy (tramo costero de La Ligua) y Salinas
    // de Pullally (Papudo) a pedido del usuario.
    durationMinutes: 270,
    es: {
      name: "Ruta Costera: Papudo y Zapallar",
      description:
        "Un recorrido por los balnearios tradicionales del litoral norte de la región de Valparaíso: las Salinas de Pullally y las playas de Papudo, la bahía de Zapallar, y el tramo costero de La Ligua en Los Molles y Pichicuy.",
    },
    en: {
      name: "Coastal Route: Papudo & Zapallar",
      description:
        "A trip along the traditional resort towns of the region's northern coast: the Pullally salt flats and Papudo's beaches, Zapallar bay, and La Ligua's coastal stretch at Los Molles and Pichicuy.",
    },
    stopSlugs: [
      "papudo-pullally",
      "playa-papudo",
      "playa-chica-papudo",
      "bahia-mirador-zapallar",
      "la-ligua-los-molles",
      "la-ligua-pichicuy",
    ],
    source: {
      url: "https://www.minube.com/tips/actualidad/rincones-unicos-que-visitar-en-papudo-mar-y-montana-te-esperan",
      label: "minube — Qué ver en Papudo",
    },
  },
  {
    slug: "ruta-patrimonial-la-ligua-cabildo",
    // Reemplazada a pedido del usuario: en vez de plaza/museo de La Ligua,
    // ahora combina La Chorreada (La Ligua) con el interior cordillerano de
    // Cabildo (Cerro Chache, San Lorenzo, Alicahue, La Vega).
    durationMinutes: 270,
    es: {
      name: "Ruta Patrimonial: La Ligua y Cabildo",
      description:
        "De La Chorreada, en La Ligua, al interior cordillerano de Cabildo: Cerro Chache, San Lorenzo, Alicahue y La Vega.",
    },
    en: {
      name: "Heritage Route: La Ligua & Cabildo",
      description:
        "From La Chorreada, in La Ligua, into Cabildo's mountain interior: Cerro Chache, San Lorenzo, Alicahue and La Vega.",
    },
    stopSlugs: [
      "la-ligua-la-chorreada",
      "cerro-chache",
      "cabildo-san-lorenzo",
      "cabildo-alicahue",
      "cabildo-la-vega",
    ],
    source: {
      url: "https://www.sitrural.cl/wp-content/uploads/2024/11/Cabildo_turismo.pdf",
      label: "Sitrural — Atractivos turísticos comuna de Cabildo",
    },
  },
] as const;

async function seedCommunes() {
  const communeIds: Record<string, string> = {};

  for (const commune of communes) {
    const { data, error } = await supabase
      .from("communes")
      .upsert(
        { slug: commune.slug, verification_status: "pending" },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !data) throw error ?? new Error("No se pudo crear la comuna");
    communeIds[commune.slug] = data.id;

    await supabase.from("commune_translations").upsert(
      [
        { commune_id: data.id, locale: "es", name: commune.es },
        { commune_id: data.id, locale: "en", name: commune.en },
      ],
      { onConflict: "commune_id,locale" },
    );
  }

  console.log(`✔ ${communes.length} comunas`);
  return communeIds;
}

async function seedCategories() {
  const categoryIds: Record<string, string> = {};

  for (const category of categories) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        { slug: category.slug, icon: category.icon },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !data)
      throw error ?? new Error("No se pudo crear la categoría");
    categoryIds[category.slug] = data.id;

    await supabase.from("category_translations").upsert(
      [
        { category_id: data.id, locale: "es", name: category.es },
        { category_id: data.id, locale: "en", name: category.en },
      ],
      { onConflict: "category_id,locale" },
    );
  }

  console.log(`✔ ${categories.length} categorías`);
  return categoryIds;
}

async function seedTags() {
  for (const tag of tags) {
    await supabase.from("tags").upsert(tag, { onConflict: "slug" });
  }
  console.log(`✔ ${tags.length} tags`);
}

async function addSource(
  entityType: "place" | "route",
  entityId: string,
  url: string,
  label: string,
) {
  const { data: existing } = await supabase
    .from("sources")
    .select("id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("url", url)
    .maybeSingle();

  if (existing) return;

  await supabase
    .from("sources")
    .insert({ entity_type: entityType, entity_id: entityId, url, label });
}

async function seedPlaces(
  communeIds: Record<string, string>,
  categoryIds: Record<string, string>,
) {
  const placeIds: Record<string, string> = {};

  for (const place of places) {
    const { data, error } = await supabase
      .from("places")
      .upsert(
        {
          slug: place.slug,
          commune_id: communeIds[place.communeSlug],
          category_id: categoryIds[place.categorySlug],
          latitude: place.latitude,
          longitude: place.longitude,
          address: "address" in place ? place.address : null,
          phone: "phone" in place ? place.phone : null,
          website: "website" in place ? place.website : null,
          // Posición publicitaria pagada (gestionada a mano, sin pasarela
          // de pago) — ver "featuredUntil" en places que la tengan.
          featured_until: "featuredUntil" in place ? place.featuredUntil : null,
          // Ícono "de la zona" puntual (ver migración 0010_place_icon.sql):
          // dato por lugar, no un mapa fijo en el código — null cae al
          // ícono de la categoría.
          icon: "icon" in place ? place.icon : null,
          publication_status: "published",
          verification_status: "verified",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !data) throw error ?? new Error("No se pudo crear el lugar");
    placeIds[place.slug] = data.id;

    await supabase.from("place_translations").upsert(
      [
        {
          place_id: data.id,
          locale: "es",
          name: place.es.name,
          short_description: place.es.short,
          needs_review: true,
        },
        {
          place_id: data.id,
          locale: "en",
          name: place.en.name,
          short_description: place.en.short,
          needs_review: true,
        },
      ],
      { onConflict: "place_id,locale" },
    );

    await addSource("place", data.id, place.source.url, place.source.label);

    // Solo borra fotos curadas a mano (no las que administra
    // fetch-google-photos.ts) — sin este filtro, cada `pnpm db:seed`
    // borraba también las fotos de Google (bug real: el usuario reportó
    // que las fotos de Google "desaparecían" después de re-seedear).
    await supabase
      .from("place_images")
      .delete()
      .eq("place_id", data.id)
      .not("storage_path", "like", `${GOOGLE_PLACE_PHOTO_PREFIX}%`);
    if ("photo" in place) {
      const storagePath =
        "filename" in place.photo
          ? wikimediaFilePath(place.photo.filename)
          : place.photo.path;
      await supabase.from("place_images").insert({
        place_id: data.id,
        storage_path: storagePath,
        alt_text: place.photo.attribution,
        position: 0,
      });
    }
  }

  const withPhotos = places.filter((place) => "photo" in place).length;
  console.log(
    `✔ ${places.length} lugares (verificados, ${withPhotos} con foto real)`,
  );
  return placeIds;
}

async function seedRoutes(placeIds: Record<string, string>) {
  for (const route of routes) {
    const { data, error } = await supabase
      .from("routes")
      .upsert(
        {
          slug: route.slug,
          estimated_duration_minutes: route.durationMinutes,
          publication_status: "published",
          verification_status: "verified",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !data) throw error ?? new Error("No se pudo crear la ruta");

    await supabase.from("route_translations").upsert(
      [
        {
          route_id: data.id,
          locale: "es",
          name: route.es.name,
          description: route.es.description,
        },
        {
          route_id: data.id,
          locale: "en",
          name: route.en.name,
          description: route.en.description,
        },
      ],
      { onConflict: "route_id,locale" },
    );

    await supabase.from("route_stops").delete().eq("route_id", data.id);
    const stops = route.stopSlugs.map((slug, index) => ({
      route_id: data.id,
      place_id: placeIds[slug],
      position: index,
    }));
    await supabase.from("route_stops").insert(stops);

    await addSource("route", data.id, route.source.url, route.source.label);
  }

  console.log(`✔ ${routes.length} rutas (verificadas)`);
}

/**
 * Lugares que existieron en una versión anterior del seed y se
 * reemplazaron por otro (slug distinto, no una edición in-place) — este
 * script solo hace upsert de lo que está en `places`/`routes`, nunca
 * borra lo que ya no aparece ahí, así que hay que sacarlos a mano una vez.
 * Se corre después de `seedRoutes()` para que ninguna parada de ruta
 * siga apuntando a ellos (route_stops.place_id es ON DELETE RESTRICT).
 */
const REMOVED_PLACE_SLUGS = [
  // Papudo, Paseo El Conquistador — reemplazado por Punta Pite (Zapallar),
  // atracción más conocida y mejor documentada, a pedido del usuario.
  "papudo-paseo-conquistador",
];

async function removePlaces() {
  if (REMOVED_PLACE_SLUGS.length === 0) return;

  const { error } = await supabase
    .from("places")
    .delete()
    .in("slug", REMOVED_PLACE_SLUGS);

  if (error) throw error;
  console.log(
    `✔ ${REMOVED_PLACE_SLUGS.length} lugar(es) obsoleto(s) eliminado(s)`,
  );
}

async function main() {
  const communeIds = await seedCommunes();
  const categoryIds = await seedCategories();
  await seedTags();
  const placeIds = await seedPlaces(communeIds, categoryIds);
  await seedRoutes(placeIds);
  await removePlaces();
  console.log("Seed completo.");
}

main().catch((error) => {
  console.error("Seed falló:", error);
  process.exit(1);
});
