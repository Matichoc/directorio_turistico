/**
 * Busca coordenadas reales para los pueblos de `scripts/seed.ts` que
 * todavía las tienen en `null`, usando Google Places API (New) Text Search
 * — mismo patrón y misma API key que `fetch-google-photos.ts`. Nunca
 * inventa un punto aproximado (ver docs/DESIGN.md, "nunca fabricar
 * datos"): si Google no encuentra una ficha real para el pueblo, o el
 * resultado cae fuera de la provincia de Petorca (nombre ambiguo con
 * otro lugar de Chile), lo deja en null en vez de escribir una
 * coordenada posiblemente equivocada.
 *
 * Reescribe directo `scripts/seed.ts` (reemplaza `latitude`/`longitude`
 * en el bloque de cada pueblo encontrado) para que las coordenadas
 * encontradas queden en la única fuente de verdad del catálogo — si se
 * escribieran aparte, directo en la base, el siguiente `pnpm db:seed` las
 * pisaría de vuelta a `null` (`seedLocalities` hace upsert incondicional
 * desde este archivo).
 *
 * Uso: pnpm geocode:localities (requiere GOOGLE_PLACES_API_KEY en
 * .env.local). Después: revisar el diff de scripts/seed.ts y correr
 * pnpm db:seed para aplicar las coordenadas nuevas a la base real.
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

config({ path: ".env.local" });

const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!googleApiKey) {
  console.error(
    "Falta GOOGLE_PLACES_API_KEY en .env.local (ver docs/PLAN.md, Riesgos, para cómo obtenerla).",
  );
  process.exit(1);
}

const SEED_PATH = path.join(__dirname, "seed.ts");
const DELAY_BETWEEN_REQUESTS_MS = 250;

// Caja aproximada de la provincia de Petorca (las 5 comunas) — un
// resultado de Google fuera de este rango es casi seguro un lugar
// homónimo en otra parte de Chile, no el pueblo real que buscamos.
const PROVINCE_BOUNDS = {
  minLat: -33.0,
  maxLat: -32.0,
  minLng: -71.7,
  maxLng: -70.6,
};

const COMMUNE_NAMES: Record<string, string> = {
  "la-ligua": "La Ligua",
  petorca: "Petorca",
  cabildo: "Cabildo",
  zapallar: "Zapallar",
  papudo: "Papudo",
};

interface LocalityEntry {
  slug: string;
  communeSlug: string;
  esName: string;
  hasCoordinates: boolean;
  start: number;
  end: number;
}

function parseLocalities(source: string): {
  entries: LocalityEntry[];
  sectionEnd: number;
} {
  const sectionStart = source.indexOf("const localities:");
  if (sectionStart === -1) {
    throw new Error('No se encontró "const localities:" en scripts/seed.ts');
  }
  const sectionEnd = source.indexOf("\n];", sectionStart);
  if (sectionEnd === -1) {
    throw new Error("No se encontró el cierre del array de localidades");
  }

  const entries: LocalityEntry[] = [];
  // Cada localidad es un objeto plano sin llaves anidadas, así que un
  // objeto por match no se desborda hacia el siguiente.
  const entryRe = /\{[^{}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = entryRe.exec(source))) {
    if (match.index < sectionStart || match.index > sectionEnd) continue;
    const block = match[0];
    const slug = /slug:\s*"([^"]+)"/.exec(block)?.[1];
    const communeSlug = /communeSlug:\s*"([^"]+)"/.exec(block)?.[1];
    const esName = /es:\s*"([^"]+)"/.exec(block)?.[1];
    if (!slug || !communeSlug || !esName) continue;

    const hasCoordinates = !/latitude:\s*null/.test(block);
    entries.push({
      slug,
      communeSlug,
      esName,
      hasCoordinates,
      start: match.index,
      end: match.index + block.length,
    });
  }

  return { entries, sectionEnd };
}

interface GoogleLocation {
  latitude: number;
  longitude: number;
}

interface GoogleTextSearchResult {
  places?: { location?: GoogleLocation; displayName?: { text?: string } }[];
}

async function searchLocality(query: string): Promise<GoogleLocation | null> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleApiKey!,
        "X-Goog-FieldMask": "places.displayName,places.location",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "es",
        maxResultCount: 1,
        locationBias: {
          circle: {
            center: { latitude: -32.5, longitude: -71.1 },
            radius: 50000,
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
  return data.places?.[0]?.location ?? null;
}

function isWithinProvince(location: GoogleLocation): boolean {
  return (
    location.latitude >= PROVINCE_BOUNDS.minLat &&
    location.latitude <= PROVINCE_BOUNDS.maxLat &&
    location.longitude >= PROVINCE_BOUNDS.minLng &&
    location.longitude <= PROVINCE_BOUNDS.maxLng
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const source = readFileSync(SEED_PATH, "utf-8");
  const { entries } = parseLocalities(source);
  const pending = entries.filter((entry) => !entry.hasCoordinates);

  console.log(
    `${pending.length} pueblos sin coordenada (de ${entries.length} en total). Buscando en Google Places...\n`,
  );

  // Se recorre de atrás hacia adelante para que reemplazar un bloque no
  // corra los índices (start/end) de los bloques que todavía faltan.
  const results = [];
  for (const entry of pending) {
    const communeName = COMMUNE_NAMES[entry.communeSlug] ?? entry.communeSlug;
    const query = `${entry.esName}, ${communeName}, Provincia de Petorca, Chile`;

    try {
      const location = await searchLocality(query);
      if (!location) {
        console.log(`⚠️  Sin resultado: ${entry.esName} (${entry.slug})`);
      } else if (!isWithinProvince(location)) {
        console.log(
          `⚠️  Resultado fuera de la provincia, descartado: ${entry.esName} (${entry.slug}) → ${location.latitude}, ${location.longitude}`,
        );
      } else {
        console.log(
          `✅ ${entry.esName} (${entry.slug}): ${location.latitude}, ${location.longitude}`,
        );
        results.push({ entry, location });
      }
    } catch (error) {
      console.log(
        `❌ Error consultando ${entry.esName} (${entry.slug}):`,
        error instanceof Error ? error.message : error,
      );
    }

    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  let updatedSource = source;
  for (const { entry, location } of results.sort(
    (a, b) => b.entry.start - a.entry.start,
  )) {
    const block = updatedSource.slice(entry.start, entry.end);
    const newBlock = block
      .replace(/latitude:\s*null/, `latitude: ${location.latitude}`)
      .replace(/longitude:\s*null/, `longitude: ${location.longitude}`);
    updatedSource =
      updatedSource.slice(0, entry.start) +
      newBlock +
      updatedSource.slice(entry.end);
  }

  if (results.length > 0) {
    writeFileSync(SEED_PATH, updatedSource);
  }

  console.log(
    `\nListo. ${results.length} pueblo(s) actualizados en scripts/seed.ts. Revisa el diff y corré "pnpm db:seed" para aplicarlo a la base real.`,
  );
}

main();
