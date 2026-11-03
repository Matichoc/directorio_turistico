"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createEvent,
  updateEvent,
  type EventFormInput,
} from "@/lib/server/content/events";
import type { AdminEventDetail } from "@/lib/data/events";
import { slugify } from "@/lib/slug";

const inputClassName =
  "border-accent-soft focus:border-accent rounded-xl border bg-transparent px-3 py-2 text-sm outline-none dark:border-white/15";
const labelClassName = "flex flex-col gap-1 text-sm";
const hintClassName = "text-foreground/50 text-xs";

const LOCALE_LABELS = {
  es: "Español",
  en: "English (vacío = usa el español)",
  pt: "Português (opcional: vacío = el sitio en portugués usa el español)",
} as const;

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function readTranslation(formData: FormData, locale: "es" | "en" | "pt") {
  return {
    name: String(formData.get(`${locale}.name`) ?? ""),
    description: String(formData.get(`${locale}.description`) ?? ""),
    whenNote: String(formData.get(`${locale}.whenNote`) ?? ""),
  };
}

function MonthSelect({
  name,
  defaultValue,
  emptyLabel,
}: {
  name: string;
  defaultValue: number | null | undefined;
  emptyLabel: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className={inputClassName}
    >
      <option value="">{emptyLabel}</option>
      {MONTHS.map((month, index) => (
        <option key={month} value={index + 1}>
          {month}
        </option>
      ))}
    </select>
  );
}

/**
 * Alta y edición de un evento (página /eventos del sitio). Cuándo: la fecha
 * confirmada, el mes en que se hace cada año, o las dos. Sin ninguna no se
 * guarda — nunca una fecha inventada para llenar el calendario.
 */
export function EventForm({
  communes,
  localities,
  places,
  event,
}: {
  communes: { id: string; name: string }[];
  localities: { id: string; name: string }[];
  places: { id: string; name: string }[];
  event?: AdminEventDetail;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const slugTouchedRef = useRef(Boolean(event));

  function handleNameEsChange(changeEvent: ChangeEvent<HTMLInputElement>) {
    if (slugTouchedRef.current || !slugInputRef.current) return;
    slugInputRef.current.value = slugify(changeEvent.target.value);
  }

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(submitEvent.currentTarget);
    const field = (name: string) => String(formData.get(name) ?? "");
    const esTranslation = readTranslation(formData, "es");
    const enTranslation = readTranslation(formData, "en");
    const input: EventFormInput = {
      slug: field("slug"),
      communeId: field("communeId"),
      localityId: field("localityId"),
      placeId: field("placeId"),
      startsOn: field("startsOn"),
      endsOn: field("endsOn"),
      startTime: field("startTime"),
      usualMonth: field("usualMonth"),
      usualMonthEnd: field("usualMonthEnd"),
      organizer: field("organizer"),
      sourceUrl: field("sourceUrl"),
      sourceLabel: field("sourceLabel"),
      coverImage: field("coverImage"),
      published: formData.get("published") === "on",
      translations: {
        es: esTranslation,
        // Sin inglés todavía no bloquea el alta: usa el español mientras
        // nadie lo traduzca (igual que pueblos y lugares).
        en: {
          name: enTranslation.name.trim() || esTranslation.name,
          description:
            enTranslation.description.trim() || esTranslation.description,
          whenNote: enTranslation.whenNote.trim() || esTranslation.whenNote,
        },
        pt: readTranslation(formData, "pt"),
      },
    };

    try {
      if (event) {
        await updateEvent(event.id, input);
      } else {
        await createEvent(input);
      }
      router.push("/admin/eventos");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el evento.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(submitEvent) => void handleSubmit(submitEvent)}
      className="flex flex-col gap-5"
    >
      <fieldset className="border-accent-soft flex flex-col gap-3 rounded-xl border p-3 dark:border-white/10">
        <legend className="text-foreground/60 px-1 text-xs font-medium tracking-wide uppercase">
          Cuándo
        </legend>
        <p className={hintClassName}>
          Pon la fecha si está confirmada. Si se hace todos los años, pon
          también el mes: cuando la fecha pase, el evento queda en &quot;Fiestas
          de cada año&quot; mostrando la última vez. Un evento de una sola vez
          (el aniversario de un club, por ejemplo) lleva solo la fecha y, al
          pasar, queda en &quot;Ya pasaron&quot;.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className={labelClassName}>
            Fecha (confirmada)
            <input
              name="startsOn"
              type="date"
              defaultValue={event?.startsOn ?? ""}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Termina (si dura más de un día)
            <input
              name="endsOn"
              type="date"
              defaultValue={event?.endsOn ?? ""}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Hora de inicio (opcional)
            <input
              name="startTime"
              type="time"
              defaultValue={event?.startTime ?? ""}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Se hace cada año en
            <MonthSelect
              name="usualMonth"
              defaultValue={event?.usualMonth}
              emptyLabel="No se repite"
            />
          </label>
          <label className={labelClassName}>
            …hasta (si dura varios meses)
            <MonthSelect
              name="usualMonthEnd"
              defaultValue={event?.usualMonthEnd}
              emptyLabel="Un solo mes"
            />
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClassName}>
          Comuna
          <select
            name="communeId"
            required
            defaultValue={event?.communeId ?? communes[0]?.id}
            className={inputClassName}
          >
            {communes.map((commune) => (
              <option key={commune.id} value={commune.id}>
                {commune.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Pueblo (opcional)
          <select
            name="localityId"
            defaultValue={event?.localityId ?? ""}
            className={inputClassName}
          >
            <option value="">Sin pueblo</option>
            {localities.map((locality) => (
              <option key={locality.id} value={locality.id}>
                {locality.name}
              </option>
            ))}
          </select>
          <span className={hintClassName}>
            El evento aparece también en la ficha de ese pueblo.
          </span>
        </label>
        <label className={labelClassName}>
          Lugar (opcional)
          <select
            name="placeId"
            defaultValue={event?.placeId ?? ""}
            className={inputClassName}
          >
            <option value="">Sin lugar</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
          <span className={hintClassName}>
            Si se hace en un lugar del sitio (una plaza, una iglesia), aparece
            también en su ficha.
          </span>
        </label>
        <label className={labelClassName}>
          Organiza (opcional)
          <input
            name="organizer"
            defaultValue={event?.organizer ?? ""}
            placeholder="Ej: Municipalidad de Petorca"
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Fuente — enlace
          <input
            name="sourceUrl"
            type="url"
            placeholder="https://… (nota de prensa, Instagram del evento)"
            defaultValue={event?.sourceUrl ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Fuente — nombre
          <input
            name="sourceLabel"
            placeholder="Ej: La Ligua Noticias, 23-10-2026"
            defaultValue={event?.sourceLabel ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Portada (opcional)
          <input
            name="coverImage"
            placeholder="/eventos/mi-evento.webp o https://…"
            defaultValue={event?.coverImage ?? ""}
            className={inputClassName}
          />
          <span className={hintClassName}>
            Solo una foto propia o con permiso. Sin portada, la tarjeta igual se
            ve bien.
          </span>
        </label>
        <label className={labelClassName}>
          Slug
          <input
            name="slug"
            required
            ref={slugInputRef}
            defaultValue={event?.slug}
            placeholder="mi-evento"
            onChange={() => {
              slugTouchedRef.current = true;
            }}
            className={inputClassName}
          />
          <span className={hintClassName}>
            Se genera solo a partir del nombre — cámbialo solo si sabes qué
            hace.
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="published"
            type="checkbox"
            defaultChecked={event?.published ?? true}
          />
          Publicado (se ve en el sitio)
        </label>
      </div>

      {(["es", "en", "pt"] as const).map((locale) => (
        <fieldset
          key={locale}
          className="border-accent-soft flex flex-col gap-3 rounded-xl border p-3 dark:border-white/10"
        >
          <legend className="text-foreground/60 px-1 text-xs font-medium tracking-wide uppercase">
            {LOCALE_LABELS[locale]}
          </legend>
          <label className={labelClassName}>
            Nombre
            <input
              name={`${locale}.name`}
              required={locale === "es"}
              defaultValue={event?.translations[locale].name}
              onChange={locale === "es" ? handleNameEsChange : undefined}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Cuándo, en palabras (opcional)
            <input
              name={`${locale}.whenNote`}
              defaultValue={event?.translations[locale].whenNote ?? ""}
              placeholder={
                locale === "es" ? "Ej: Último domingo de septiembre" : undefined
              }
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Descripción
            <textarea
              name={`${locale}.description`}
              rows={4}
              defaultValue={event?.translations[locale].description ?? ""}
              className={inputClassName}
            />
          </label>
        </fieldset>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {submitting
            ? "Guardando…"
            : event
              ? "Guardar cambios"
              : "Crear evento"}
        </button>
      </div>
    </form>
  );
}
