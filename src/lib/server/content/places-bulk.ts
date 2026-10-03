"use server";

import { parseCsvWithHeader, toCsvDocument } from "@/lib/csv";
import { slugify } from "@/lib/slug";
import { ICON_KEYS } from "@/components/ui/category-icon";
import {
  listAdminPlacesForExport,
  listAllPlacesForImport,
} from "@/lib/data/places";
import { listCommunes } from "@/lib/data/communes";
import { listCategories } from "@/lib/data/categories";
import { createPlace, updatePlace, type PlaceFormInput } from "./places";
import type { PublicationStatus } from "@/types/database";

/**
 * Columnas en español, sin IDs técnicos — pensadas para alguien de negocio
 * que arma la carga en Excel/Sheets, no para quien conoce el esquema de la
 * base. El CSV que descarga `/admin/lugares/export` usa estas mismas
 * columnas: es la plantilla para volver a subir (ver docs/PLAN.md).
 */
const CSV_HEADERS = [
  "identificador",
  "nombre",
  "nombre_en",
  "categoria",
  "comuna",
  "latitud",
  "longitud",
  "direccion",
  "telefono",
  "sitio_web",
  "icono",
  "estado",
  "descripcion_corta",
  "descripcion",
  "descripcion_corta_en",
  "descripcion_en",
] as const;

const STATUS_TO_LABEL: Record<PublicationStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Desactivado",
};

const LABEL_TO_STATUS: Record<string, PublicationStatus> = {
  borrador: "draft",
  publicado: "published",
  desactivado: "archived",
  archivado: "archived", // nombre anterior del mismo estado, por compatibilidad
};

export async function exportPlacesCsv(): Promise<string> {
  const places = await listAdminPlacesForExport();

  const rows = places.map((place) => [
    place.slug,
    place.translations.es.name,
    place.translations.en.name,
    place.categoryName,
    place.communeName,
    String(place.latitude),
    String(place.longitude),
    place.address ?? "",
    place.phone ?? "",
    place.website ?? "",
    place.icon ?? "",
    STATUS_TO_LABEL[place.publicationStatus],
    place.translations.es.shortDescription ?? "",
    place.translations.es.description ?? "",
    place.translations.en.shortDescription ?? "",
    place.translations.en.description ?? "",
  ]);

  return toCsvDocument([[...CSV_HEADERS], ...rows]);
}

export interface ImportRowResult {
  row: number;
  name: string;
  status: "created" | "updated" | "error";
  message?: string;
}

export interface ImportReport {
  results: ImportRowResult[];
  createdCount: number;
  updatedCount: number;
  errorCount: number;
}

/**
 * Carga masiva de lugares desde el CSV exportado (editado o no). Reusa el
 * mismo schema/validación de `createPlace`/`updatePlace` — nunca duplica
 * reglas de negocio entre el alta 1 a 1 y la carga masiva.
 *
 * Upsert por "identificador" (slug): si coincide con un lugar existente,
 * lo edita; si viene vacío o no coincide con ninguno, crea uno nuevo (con
 * slug autogenerado del nombre si no trajo uno). Para los campos
 * opcionales, la fila reemplaza por completo lo que había (una celda
 * vacía borra ese dato) — la planilla es la fuente de verdad de esa fila.
 * La única excepción es "estado": vacío en una edición NO cambia el
 * estado actual (nunca pisa un alta/baja ya hecha desde el panel simple);
 * vacío en un alta nueva usa "Borrador", igual que el formulario 1 a 1.
 */
export async function importPlacesCsv(csvText: string): Promise<ImportReport> {
  const rows = parseCsvWithHeader(csvText);
  const [communes, categories, existingPlaces] = await Promise.all([
    listCommunes("es"),
    listCategories("es"),
    listAllPlacesForImport(),
  ]);

  const communeByName = new Map(
    communes.map((commune) => [commune.name.trim().toLowerCase(), commune.id]),
  );
  const categoryByName = new Map(
    categories.map((category) => [
      category.name.trim().toLowerCase(),
      category.id,
    ]),
  );
  const existingBySlug = new Map(
    existingPlaces.map((place) => [place.slug, place]),
  );

  const results: ImportRowResult[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowNumber = index + 2; // fila 1 = encabezado
    const name = (row.nombre ?? "").trim();

    try {
      if (!name) {
        throw new Error("Falta la columna 'nombre'.");
      }

      const communeId = communeByName.get(
        (row.comuna ?? "").trim().toLowerCase(),
      );
      if (!communeId) {
        throw new Error(
          `Comuna "${row.comuna ?? ""}" no existe. Usa una de: ${communes
            .map((commune) => commune.name)
            .join(", ")}.`,
        );
      }

      const categoryId = categoryByName.get(
        (row.categoria ?? "").trim().toLowerCase(),
      );
      if (!categoryId) {
        throw new Error(
          `Categoría "${row.categoria ?? ""}" no existe. Usa una de: ${categories
            .map((category) => category.name)
            .join(", ")}.`,
        );
      }

      const latitude = Number(row.latitud);
      const longitude = Number(row.longitud);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Latitud/longitud inválidas.");
      }

      const icon = (row.icono ?? "").trim();
      if (icon && !ICON_KEYS.includes(icon)) {
        throw new Error(
          `Ícono "${icon}" no existe. Usa uno de: ${ICON_KEYS.join(", ")} (o déjalo vacío para usar el de la categoría).`,
        );
      }

      const slug = (row.identificador ?? "").trim().toLowerCase();
      const existing = slug ? existingBySlug.get(slug) : undefined;

      const statusLabel = (row.estado ?? "").trim().toLowerCase();
      if (statusLabel && !LABEL_TO_STATUS[statusLabel]) {
        throw new Error(
          `Estado "${row.estado}" no reconocido. Usa Publicado, Borrador o Desactivado.`,
        );
      }
      const publicationStatus: PublicationStatus = statusLabel
        ? LABEL_TO_STATUS[statusLabel]
        : (existing?.publicationStatus ?? "draft");

      const input: PlaceFormInput = {
        slug: slug || slugify(name),
        communeId,
        categoryId,
        latitude,
        longitude,
        address: row.direccion ?? "",
        phone: row.telefono ?? "",
        website: row.sitio_web ?? "",
        icon,
        publicationStatus,
        verificationStatus: "pending",
        translations: {
          es: {
            name,
            shortDescription: row.descripcion_corta ?? "",
            description: row.descripcion ?? "",
          },
          en: {
            name: (row.nombre_en ?? "").trim() || name,
            shortDescription: row.descripcion_corta_en ?? "",
            description: row.descripcion_en ?? "",
          },
        },
      };

      if (existing) {
        await updatePlace(existing.id, input);
        results.push({ row: rowNumber, name, status: "updated" });
      } else {
        await createPlace(input);
        results.push({ row: rowNumber, name, status: "created" });
      }
    } catch (error) {
      results.push({
        row: rowNumber,
        name: name || "(sin nombre)",
        status: "error",
        message: error instanceof Error ? error.message : "Error desconocido.",
      });
    }
  }

  return {
    results,
    createdCount: results.filter((result) => result.status === "created")
      .length,
    updatedCount: results.filter((result) => result.status === "updated")
      .length,
    errorCount: results.filter((result) => result.status === "error").length,
  };
}
