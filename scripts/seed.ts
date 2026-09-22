/**
 * Seed de datos demo para desarrollo. Todo el contenido de lugares queda
 * marcado `verification_status = 'pending'` — nunca usar en producción sin
 * pasar por el flujo de verificación.
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
];

const demoPlaces = [
  {
    slug: "playa-papudo",
    communeSlug: "papudo",
    categorySlug: "playa",
    latitude: -32.5061,
    longitude: -71.4472,
    es: { name: "Playa de Papudo", short: "Playa principal del balneario." },
    en: { name: "Papudo Beach", short: "The resort town's main beach." },
  },
  {
    slug: "plaza-de-armas-la-ligua",
    communeSlug: "la-ligua",
    categorySlug: "cultura",
    latitude: -32.4525,
    longitude: -71.2306,
    es: {
      name: "Plaza de Armas de La Ligua",
      short: "Centro histórico de la ciudad.",
    },
    en: { name: "La Ligua Main Square", short: "The town's historic center." },
  },
  {
    slug: "mirador-zapallar",
    communeSlug: "zapallar",
    categorySlug: "naturaleza",
    latitude: -32.5522,
    longitude: -71.4614,
    es: { name: "Mirador de Zapallar", short: "Vista panorámica de la bahía." },
    en: { name: "Zapallar Lookout", short: "Panoramic view of the bay." },
  },
];

const demoRoutes = [
  {
    slug: "costa-petorca",
    durationMinutes: 240,
    es: {
      name: "Ruta Costera de Petorca",
      description: "Un recorrido borrador por el litoral.",
    },
    en: {
      name: "Petorca Coastal Route",
      description: "A draft trip along the coastline.",
    },
    stopSlugs: ["playa-papudo", "mirador-zapallar"],
  },
  {
    slug: "centro-la-ligua",
    durationMinutes: 120,
    es: {
      name: "Centro Histórico de La Ligua",
      description: "Ruta borrador por el casco histórico.",
    },
    en: {
      name: "La Ligua Historic Center",
      description: "Draft route through the old town.",
    },
    stopSlugs: ["plaza-de-armas-la-ligua"],
  },
  {
    slug: "naturaleza-y-mar",
    durationMinutes: 300,
    es: {
      name: "Naturaleza y Mar",
      description: "Ruta borrador combinando miradores y playas.",
    },
    en: {
      name: "Nature and Sea",
      description: "Draft route combining lookouts and beaches.",
    },
    stopSlugs: ["mirador-zapallar", "playa-papudo"],
  },
];

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

async function seedPlaces(
  communeIds: Record<string, string>,
  categoryIds: Record<string, string>,
) {
  const placeIds: Record<string, string> = {};

  for (const place of demoPlaces) {
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
  }

  console.log(
    `✔ ${demoPlaces.length} lugares demo (pendientes de verificación)`,
  );
  return placeIds;
}

async function seedRoutes(placeIds: Record<string, string>) {
  for (const route of demoRoutes) {
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
  }

  console.log(`✔ ${demoRoutes.length} rutas borrador`);
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
