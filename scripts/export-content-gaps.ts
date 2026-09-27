/**
 * Genera una planilla CSV con el estado real (contra la base de datos, no a
 * ojo) de cada lugar: si tiene descripción larga y si tiene al menos una
 * foto real cargada en `place_images`. Pensado para que el usuario sepa
 * exactamente dónde falta contenido y pueda ir completando una fila a la
 * vez (columna "Link o fuente" para descripciones, sube la foto directo en
 * Storage para las fotos — ver docs/PLAN.md sección 9).
 *
 * Uso: pnpm export:content-gaps (requiere las mismas env vars que
 * pnpm db:seed — se conecta a la misma base real).
 */
import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Configura .env.local antes de correr esto.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

async function main() {
  const { data: places, error } = await supabase
    .from("places")
    .select(
      `slug,
       communes!inner(slug, commune_translations!inner(name, locale)),
       place_translations!inner(name, description, locale),
       place_images(id)`,
    )
    .order("slug");

  if (error || !places) {
    throw error ?? new Error("No se pudieron leer los lugares.");
  }

  const rows = places.map((place) => {
    const commune = place.communes as unknown as {
      slug: string;
      commune_translations: { name: string; locale: string }[];
    };
    const translations = place.place_translations as unknown as {
      name: string;
      description: string | null;
      locale: string;
    }[];
    const images = place.place_images as unknown as { id: string }[];

    const es = translations.find((t) => t.locale === "es");
    const communeName =
      commune.commune_translations.find((t) => t.locale === "es")?.name ??
      commune.slug;

    return {
      name: es?.name ?? place.slug,
      commune: communeName,
      slug: place.slug,
      hasDescription: Boolean(es?.description),
      hasPhoto: images.length > 0,
    };
  });

  rows.sort((a, b) => a.name.localeCompare(b.name, "es"));

  const header =
    "Lugar,Comuna,Slug,Descripcion,Fotos,Link o fuente (para descripcion),Notas";
  const lines = rows.map((row) =>
    [
      csvCell(row.name),
      csvCell(row.commune),
      csvCell(row.slug),
      csvCell(row.hasDescription ? "ok" : "falta"),
      csvCell(row.hasPhoto ? "ok" : "falta"),
      csvCell(""),
      csvCell(""),
    ].join(","),
  );

  const csv = [header, ...lines].join("\n") + "\n";
  const outPath = "lugares-estado.csv";
  writeFileSync(outPath, csv, "utf-8");

  const missingDescription = rows.filter((r) => !r.hasDescription).length;
  const missingPhoto = rows.filter((r) => !r.hasPhoto).length;
  console.log(`✔ ${outPath} generado (${rows.length} lugares).`);
  console.log(`  Sin descripción: ${missingDescription}`);
  console.log(`  Sin foto real: ${missingPhoto}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
