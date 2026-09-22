/**
 * Completa `place_images` con fotos reales de Google Places API (New) para
 * cada lugar publicado, hasta `TARGET_PHOTOS_PER_PLACE` fotos por lugar,
 * enlazadas vía el proxy `/api/place-photo` (streaming del binario usando
 * GOOGLE_PLACES_API_KEY server-side — ver esa ruta, nunca se expone al
 * navegador).
 *
 * Solo administra las filas que él mismo creó (storage_path empieza con
 * `GOOGLE_PROXY_PREFIX`): las deja en 0 hasta llenar el cupo, y en cada
 * corrida las reemplaza por una búsqueda fresca (por si Google devuelve
 * fotos distintas) en vez de ir acumulando. Nunca toca ni cuenta como
 * "cupo lleno" una foto curada a mano (Wikimedia, `/fotos/...` local) — esa
 * sigue siempre en la posición 0 y las de Google se agregan después,
 * protegiendo así automáticamente las 4 fotos curadas a mano (Museo de La
 * Ligua, Plaza de Armas de La Ligua, Iglesia La Merced de Petorca,
 * Chocolatería Matichoc — ver scripts/seed.ts) sin lista de exclusión.
 *
 * Uso: pnpm fetch:google-photos (requiere NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY y GOOGLE_PLACES_API_KEY en .env.local).
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Configura .env.local.",
  );
  process.exit(1);
}
if (!googleApiKey) {
  console.error(
    "Falta GOOGLE_PLACES_API_KEY en .env.local (ver docs/PLAN.md, Riesgos, para cómo obtenerla).",
  );
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_PHOTOS_PER_PLACE = 5;
const PROXY_WIDTH = 1200;
const GOOGLE_PROXY_PREFIX = "/api/place-photo?ref=";
const SEARCH_RADIUS_METERS = 1500;
const DELAY_BETWEEN_REQUESTS_MS = 250;

interface GooglePhoto {
  name: string;
  authorAttributions?: { displayName?: string }[];
}

interface GoogleTextSearchResult {
  places?: { displayName?: { text?: string }; photos?: GooglePhoto[] }[];
}

async function searchPhotos(
  query: string,
  latitude: number,
  longitude: number,
): Promise<GooglePhoto[]> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleApiKey!,
        "X-Goog-FieldMask": "places.displayName,places.photos",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "es",
        maxResultCount: 1,
        locationBias: {
          circle: {
            center: { latitude, longitude },
            radius: SEARCH_RADIUS_METERS,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Google respondió ${response.status}: ${body.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as GoogleTextSearchResult;
  return data.places?.[0]?.photos ?? [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function photoToRow(
  photo: GooglePhoto,
  placeId: string,
  position: number,
): Database["public"]["Tables"]["place_images"]["Insert"] {
  const attributionName = photo.authorAttributions?.[0]?.displayName;
  return {
    place_id: placeId,
    storage_path: `${GOOGLE_PROXY_PREFIX}${encodeURIComponent(photo.name)}&w=${PROXY_WIDTH}`,
    alt_text: attributionName
      ? `Foto: ${attributionName} (Google Maps)`
      : "Foto: Google Maps",
    position,
  };
}

const PLACES_QUERY =
  "id, slug, latitude, longitude, place_translations!inner(name, locale)" as const;

interface PlaceQueryResult {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  place_translations: { name: string; locale: string }[];
}

async function main() {
  const { data: places, error: placesError } = await supabase
    .from("places")
    .select<typeof PLACES_QUERY, PlaceQueryResult>(PLACES_QUERY)
    .eq("publication_status", "published")
    .eq("place_translations.locale", "es");

  if (placesError || !places) {
    console.error("No se pudieron leer los lugares:", placesError);
    process.exit(1);
  }

  const { data: existingImages, error: imagesError } = await supabase
    .from("place_images")
    .select("place_id, storage_path");

  if (imagesError) {
    console.error("No se pudo leer place_images:", imagesError);
    process.exit(1);
  }

  const imagesByPlace = new Map<
    string,
    { protectedCount: number; googleCount: number }
  >();
  for (const image of existingImages ?? []) {
    const entry = imagesByPlace.get(image.place_id) ?? {
      protectedCount: 0,
      googleCount: 0,
    };
    if (image.storage_path.startsWith(GOOGLE_PROXY_PREFIX)) {
      entry.googleCount += 1;
    } else {
      entry.protectedCount += 1;
    }
    imagesByPlace.set(image.place_id, entry);
  }

  const pending = places
    .map((place) => {
      const { protectedCount = 0, googleCount = 0 } =
        imagesByPlace.get(place.id) ?? {};
      const slotsAvailable = Math.max(
        0,
        TARGET_PHOTOS_PER_PLACE - protectedCount,
      );
      return { place, protectedCount, googleCount, slotsAvailable };
    })
    .filter(({ googleCount, slotsAvailable }) => googleCount < slotsAvailable);

  console.log(
    `${pending.length} lugares con cupo de fotos sin llenar (de ${places.length} publicados, meta ${TARGET_PHOTOS_PER_PLACE}/lugar). Buscando en Google Places...\n`,
  );

  let placesUpdated = 0;
  let photosAdded = 0;
  let notFound = 0;
  let failed = 0;

  for (const { place, protectedCount, slotsAvailable } of pending) {
    const name = place.place_translations[0]?.name ?? place.slug;
    const query = `${name}, Provincia de Petorca, Chile`;

    try {
      const photos = (
        await searchPhotos(query, place.latitude, place.longitude)
      ).slice(0, slotsAvailable);

      if (photos.length === 0) {
        console.log(`⚠️  Sin resultado: ${name} (${place.slug})`);
        notFound += 1;
        continue;
      }

      await supabase
        .from("place_images")
        .delete()
        .eq("place_id", place.id)
        .like("storage_path", `${GOOGLE_PROXY_PREFIX}%`);

      const rows = photos.map((photo, index) =>
        photoToRow(photo, place.id, protectedCount + index),
      );
      const { error: insertError } = await supabase
        .from("place_images")
        .insert(rows);

      if (insertError) {
        console.log(
          `❌ Error guardando ${name} (${place.slug}):`,
          insertError.message,
        );
        failed += 1;
        continue;
      }

      console.log(`✅ ${name} (${place.slug}): ${rows.length} foto(s)`);
      placesUpdated += 1;
      photosAdded += rows.length;
    } catch (error) {
      console.log(
        `❌ Error consultando ${name} (${place.slug}):`,
        error instanceof Error ? error.message : error,
      );
      failed += 1;
    }

    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  console.log(
    `\nListo. Lugares actualizados: ${placesUpdated} (${photosAdded} fotos). Sin resultado en Google: ${notFound}. Errores: ${failed}.`,
  );
}

main();
