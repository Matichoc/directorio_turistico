"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { refreshPublicContent } from "./refresh";
import { createClient } from "@/lib/supabase/server";
import { portugueseCleared, savedTranslations } from "./translations";

const eventLocaleContentSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre"),
  description: z.string().trim().optional().or(z.literal("")),
  whenNote: z.string().trim().optional().or(z.literal("")),
});

/** Portugués: opcional; sin nombre no se guarda (ver translations.ts). */
const eventOptionalLocaleSchema = eventLocaleContentSchema.extend({
  name: z.string().trim(),
});

/** Vacío = null (un select o un campo sin llenar), nunca un valor inventado. */
function optional<T extends z.ZodType>(schema: T) {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null))
    .pipe(
      schema.nullable() as unknown as z.ZodType<
        z.output<T> | null,
        string | null
      >,
    );
}

const DAY = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");
const MONTH = z.coerce.number().int().min(1).max(12);

const eventFormSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "El slug debe ser minúsculas, números y guiones (ej: fiesta-de-la-merced)",
      ),
    communeId: z.uuid(),
    localityId: optional(z.uuid()),
    placeId: optional(z.uuid()),
    startsOn: optional(DAY),
    endsOn: optional(DAY),
    startTime: optional(z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida")),
    usualMonth: optional(MONTH),
    usualMonthEnd: optional(MONTH),
    organizer: optional(z.string()),
    sourceUrl: optional(
      z
        .string()
        .regex(
          /^https?:\/\//i,
          "La fuente debe ser un enlace que empiece con http:// o https://",
        ),
    ),
    sourceLabel: optional(z.string()),
    coverImage: optional(
      z
        .string()
        .regex(
          /^(\/|https:\/\/)/,
          "La portada debe ser una ruta del sitio (/eventos/…) o un enlace https://",
        ),
    ),
    published: z.boolean(),
    translations: z.object({
      es: eventLocaleContentSchema,
      en: eventLocaleContentSchema,
      pt: eventOptionalLocaleSchema.optional(),
    }),
  })
  // Nunca un evento sin cuándo: o la fecha confirmada, o el mes de cada año.
  .refine((event) => event.startsOn !== null || event.usualMonth !== null, {
    message:
      "Falta cuándo es: pon la fecha confirmada o, si se repite cada año, el mes.",
    path: ["startsOn"],
  })
  .refine(
    (event) =>
      event.endsOn === null ||
      (event.startsOn !== null && event.endsOn >= event.startsOn),
    {
      message: "La fecha de término tiene que ser igual o posterior al inicio.",
      path: ["endsOn"],
    },
  )
  .refine(
    (event) => event.usualMonthEnd === null || event.usualMonth !== null,
    {
      message:
        "Para poner el mes en que termina, primero pon el mes de inicio.",
      path: ["usualMonthEnd"],
    },
  );

export type EventFormInput = z.input<typeof eventFormSchema>;
type ParsedEvent = z.output<typeof eventFormSchema>;

function normalize(value: string | undefined | null): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

function eventRow(parsed: ParsedEvent) {
  return {
    slug: parsed.slug,
    commune_id: parsed.communeId,
    locality_id: parsed.localityId,
    place_id: parsed.placeId,
    starts_on: parsed.startsOn,
    ends_on: parsed.endsOn,
    start_time: parsed.startTime,
    usual_month: parsed.usualMonth,
    usual_month_end: parsed.usualMonthEnd,
    organizer: parsed.organizer,
    source_url: parsed.sourceUrl,
    source_label: parsed.sourceLabel,
    cover_image: parsed.coverImage,
    published: parsed.published,
  };
}

function translationRows(eventId: string, parsed: ParsedEvent) {
  return savedTranslations(parsed.translations).map(([locale, content]) => ({
    event_id: eventId,
    locale,
    name: content.name,
    description: normalize(content.description),
    when_note: normalize(content.whenNote),
  }));
}

/** El primer error de validación, en palabras (el panel lo muestra tal cual). */
function parseEvent(input: EventFormInput): ParsedEvent {
  const result = eventFormSchema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Datos inválidos.");
  }
  return result.data;
}

export async function createEvent(
  input: EventFormInput,
): Promise<{ id: string }> {
  const parsed = parseEvent(input);
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .insert(eventRow(parsed))
    .select("id")
    .single();

  if (error || !event) {
    throw new Error(
      `No se pudo crear el evento: ${error?.message ?? "error desconocido"}`,
    );
  }

  const { error: translationsError } = await supabase
    .from("event_translations")
    .insert(translationRows(event.id, parsed));

  if (translationsError) {
    throw new Error(
      `No se pudo guardar la traducción: ${translationsError.message}`,
    );
  }

  refreshPublicContent();
  revalidatePath("/admin/eventos");
  return { id: event.id };
}

export async function updateEvent(
  id: string,
  input: EventFormInput,
): Promise<void> {
  const parsed = parseEvent(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update(eventRow(parsed))
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el evento: ${error.message}`);
  }

  const { error: translationsError } = await supabase
    .from("event_translations")
    .upsert(translationRows(id, parsed), { onConflict: "event_id,locale" });

  if (translationsError) {
    throw new Error(
      `No se pudo actualizar la traducción: ${translationsError.message}`,
    );
  }

  if (portugueseCleared(parsed.translations)) {
    await supabase
      .from("event_translations")
      .delete()
      .eq("event_id", id)
      .eq("locale", "pt");
  }

  refreshPublicContent();
  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${id}`);
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar el evento: ${error.message}`);
  }

  refreshPublicContent();
  revalidatePath("/admin/eventos");
}
