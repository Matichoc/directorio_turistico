"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createLocality,
  updateLocality,
  type LocalityFormInput,
} from "@/lib/server/content/localities";
import type { AdminLocalityDetail } from "@/lib/data/localities";
import { slugify } from "@/lib/slug";

const inputClassName =
  "border-accent-soft focus:border-accent rounded-xl border bg-transparent px-3 py-2 text-sm outline-none dark:border-white/15";
const labelClassName = "flex flex-col gap-1 text-sm";

function readTranslation(formData: FormData, locale: "es" | "en") {
  return {
    name: String(formData.get(`${locale}.name`) ?? ""),
    summary: String(formData.get(`${locale}.summary`) ?? ""),
  };
}

export function LocalityForm({
  communes,
  locality,
}: {
  communes: { id: string; name: string }[];
  locality?: AdminLocalityDetail;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const slugTouchedRef = useRef(Boolean(locality));

  function handleNameEsChange(event: ChangeEvent<HTMLInputElement>) {
    if (slugTouchedRef.current || !slugInputRef.current) return;
    slugInputRef.current.value = slugify(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const esTranslation = readTranslation(formData, "es");
    const enTranslation = readTranslation(formData, "en");
    const input: LocalityFormInput = {
      slug: String(formData.get("slug") ?? ""),
      communeId: String(formData.get("communeId") ?? ""),
      latitude: String(formData.get("latitude") ?? ""),
      longitude: String(formData.get("longitude") ?? ""),
      summarySourceUrl: String(formData.get("summarySourceUrl") ?? ""),
      summarySourceLabel: String(formData.get("summarySourceLabel") ?? ""),
      translations: {
        es: esTranslation,
        // Sin nombre en inglés todavía no debería bloquear el alta — usa el
        // nombre en español mientras nadie lo traduzca (igual criterio que
        // la carga CSV de lugares).
        en: {
          ...enTranslation,
          name: enTranslation.name.trim() || esTranslation.name,
        },
      },
    };

    try {
      if (locality) {
        await updateLocality(locality.id, input);
      } else {
        await createLocality(input);
      }
      router.push("/admin/pueblos");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el pueblo.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={labelClassName}>
          Slug
          <input
            name="slug"
            required
            ref={slugInputRef}
            defaultValue={locality?.slug}
            placeholder="mi-pueblo"
            onChange={() => {
              slugTouchedRef.current = true;
            }}
            className={inputClassName}
          />
          <span className="text-foreground/50 text-xs">
            Se genera solo a partir del nombre — cámbialo solo si sabés qué
            hace.
          </span>
        </label>
        <label className={labelClassName}>
          Comuna
          <select
            name="communeId"
            required
            defaultValue={locality?.communeId}
            className={inputClassName}
          >
            <option value="" disabled>
              Selecciona una comuna
            </option>
            {communes.map((commune) => (
              <option key={commune.id} value={commune.id}>
                {commune.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Latitud (opcional)
          <input
            name="latitude"
            type="number"
            step="any"
            placeholder="Déjalo vacío si todavía no la sabés"
            defaultValue={locality?.latitude ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Longitud (opcional)
          <input
            name="longitude"
            type="number"
            step="any"
            placeholder="Déjalo vacío si todavía no la sabés"
            defaultValue={locality?.longitude ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Fuente del resumen — enlace (opcional)
          <input
            name="summarySourceUrl"
            type="url"
            placeholder="https://…"
            defaultValue={locality?.summarySourceUrl ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Fuente del resumen — nombre (opcional)
          <input
            name="summarySourceLabel"
            placeholder="Ej: Wikipedia, Municipalidad de Cabildo"
            defaultValue={locality?.summarySourceLabel ?? ""}
            className={inputClassName}
          />
        </label>
      </div>

      {(["es", "en"] as const).map((locale) => (
        <fieldset
          key={locale}
          className="border-accent-soft flex flex-col gap-3 rounded-xl border p-3 dark:border-white/10"
        >
          <legend className="text-foreground/60 px-1 text-xs font-medium tracking-wide uppercase">
            {locale === "es" ? "Español" : "English"}
          </legend>
          <label className={labelClassName}>
            Nombre
            <input
              name={`${locale}.name`}
              required={locale === "es"}
              defaultValue={locality?.translations[locale].name}
              onChange={locale === "es" ? handleNameEsChange : undefined}
              placeholder={
                locale === "en" ? "Vacío = usa el nombre en español" : undefined
              }
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Resumen
            <textarea
              name={`${locale}.summary`}
              rows={4}
              defaultValue={locality?.translations[locale].summary ?? ""}
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
            : locality
              ? "Guardar cambios"
              : "Crear pueblo"}
        </button>
      </div>
    </form>
  );
}
