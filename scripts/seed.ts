/**
 * Seed de datos para desarrollo: lugares y rutas reales de la provincia de
 * Petorca, investigados en fuentes públicas (cada `place`/`route` trae un
 * campo `source` con `url`/`label`, que `addSource()` guarda en la tabla
 * `sources`). Aun así todo el contenido se marca `verification_status = 'pending'` y
 * `publication_status = 'draft'`: coordenadas, horarios y datos de contacto
 * no están verificados en terreno y deben confirmarse antes de publicar
 * (ver `docs/PLAN.md`, Riesgos).
 *
 * Uso: pnpm db:seed (requiere NEXT_PUBLIC_SUPABASE_URL y
 * SUPABASE_SERVICE_ROLE_KEY en el entorno).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

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
    latitude: -32.4525,
    longitude: -71.2306,
    es: {
      name: "Museo de La Ligua",
      short:
        "Exhibiciones sobre el mundo prehispánico del territorio y sobre La Quintrala; entrada liberada, junto a la Plaza de Armas.",
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
    latitude: -32.4525,
    longitude: -71.2306,
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
    latitude: -32.28528,
    longitude: -71.0,
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
    latitude: -32.25139,
    longitude: -70.93139,
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
    latitude: -32.25139,
    longitude: -70.93139,
    es: {
      name: "Casa natal de Manuel Montt",
      short:
        "Monumento histórico: la casa donde nació en 1809 el expresidente Manuel Montt, quien gobernó Chile entre 1851 y 1861 (Manuel Montt 835).",
    },
    en: {
      name: "Manuel Montt's Birthplace",
      short:
        "Historic monument: the house where former president Manuel Montt was born in 1809; he governed Chile from 1851 to 1861 (Manuel Montt 835).",
    },
    source: {
      url: "https://www.sitrural.cl/wp-content/uploads/2024/11/Petorca_turismo.pdf",
      label: "Sitrural — Atractivos turísticos comuna de Petorca",
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
] as const;

const routes = [
  {
    slug: "ruta-del-diablo",
    durationMinutes: 240,
    es: {
      name: "Ruta del Diablo",
      description:
        'Recorre los lugares detrás del dicho "el diablo murió en Petorca y en La Ligua lo enterraron": la Escalera del Diablo en Hierro Viejo, el centro histórico de Petorca y el Museo de La Ligua.',
    },
    en: {
      name: "Ruta del Diablo",
      description:
        "Follows the places behind the old saying \"the Devil died in Petorca and was buried in La Ligua\": the Devil's Staircase in Hierro Viejo, Petorca's historic center and the La Ligua Museum.",
    },
    stopSlugs: [
      "escalera-del-diablo",
      "iglesia-la-merced-petorca",
      "casa-natal-manuel-montt",
      "museo-de-la-ligua",
    ],
    source: {
      url: "https://petorcaminera.wordpress.com/2016/12/13/el-diablo-murio-en-petorca/",
      label: "Cavando en Petorca y su Minería — El Diablo murió en Petorca",
    },
  },
  {
    slug: "ruta-costera-papudo-zapallar",
    durationMinutes: 180,
    es: {
      name: "Ruta Costera: Papudo y Zapallar",
      description:
        "Un recorrido por los balnearios tradicionales del litoral norte de la región de Valparaíso: playas de Papudo y la bahía de Zapallar.",
    },
    en: {
      name: "Coastal Route: Papudo & Zapallar",
      description:
        "A trip along the traditional resort towns of the region's northern coast: Papudo's beaches and Zapallar bay.",
    },
    stopSlugs: ["playa-papudo", "playa-chica-papudo", "bahia-mirador-zapallar"],
    source: {
      url: "https://www.minube.com/tips/actualidad/rincones-unicos-que-visitar-en-papudo-mar-y-montana-te-esperan",
      label: "minube — Qué ver en Papudo",
    },
  },
  {
    slug: "ruta-patrimonial-la-ligua-cabildo",
    durationMinutes: 210,
    es: {
      name: "Ruta Patrimonial: La Ligua y Cabildo",
      description:
        "Centro histórico de La Ligua (plaza y museo) y la cordillera de la Costa en Cabildo, con el Cerro Chache como telón de fondo.",
    },
    en: {
      name: "Heritage Route: La Ligua & Cabildo",
      description:
        "La Ligua's historic center (square and museum) and Cabildo's coastal cordillera, with Cerro Chache in the background.",
    },
    stopSlugs: ["plaza-de-armas-la-ligua", "museo-de-la-ligua", "cerro-chache"],
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
          publication_status: "draft",
          verification_status: "pending",
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
  }

  console.log(`✔ ${places.length} lugares (pendientes de verificación)`);
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
          publication_status: "draft",
          verification_status: "pending",
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

  console.log(`✔ ${routes.length} rutas (pendientes de verificación)`);
}

async function main() {
  const communeIds = await seedCommunes();
  const categoryIds = await seedCategories();
  await seedTags();
  const placeIds = await seedPlaces(communeIds, categoryIds);
  await seedRoutes(placeIds);
  console.log("Seed completo.");
}

main().catch((error) => {
  console.error("Seed falló:", error);
  process.exit(1);
});
