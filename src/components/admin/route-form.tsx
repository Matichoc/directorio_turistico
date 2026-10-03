"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createRoute,
  updateRoute,
  type RouteFormInput,
} from "@/lib/server/content/routes";
import type { AdminRouteDetail } from "@/lib/data/routes";

const PUBLICATION_OPTIONS: {
  value: RouteFormInput["publicationStatus"];
  label: string;
}[] = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Desactivado" },
];

const VERIFICATION_OPTIONS: {
  value: RouteFormInput["verificationStatus"];
  label: string;
}[] = [
  { value: "pending", label: "Pendiente" },
  { value: "verified", label: "Verificado" },
  { value: "outdated", label: "Desactualizado" },
];

const inputClassName =
  "border-accent-soft focus:border-accent rounded-xl border bg-transparent px-3 py-2 text-sm outline-none dark:border-white/15";
const labelClassName = "flex flex-col gap-1 text-sm";

function readTranslation(formData: FormData, locale: "es" | "en") {
  return {
    name: String(formData.get(`${locale}.name`) ?? ""),
    description: String(formData.get(`${locale}.description`) ?? ""),
  };
}

export function RouteForm({ route }: { route?: AdminRouteDetail }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const durationRaw = String(formData.get("estimatedDurationMinutes") ?? "");
    const input: RouteFormInput = {
      slug: String(formData.get("slug") ?? ""),
      estimatedDurationMinutes: durationRaw === "" ? "" : Number(durationRaw),
      publicationStatus: formData.get(
        "publicationStatus",
      ) as RouteFormInput["publicationStatus"],
      verificationStatus: formData.get(
        "verificationStatus",
      ) as RouteFormInput["verificationStatus"],
      translations: {
        es: readTranslation(formData, "es"),
        en: readTranslation(formData, "en"),
      },
    };

    try {
      if (route) {
        await updateRoute(route.id, input);
        router.refresh();
      } else {
        const created = await createRoute(input);
        router.push(`/admin/rutas/${created.id}`);
        router.refresh();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar la ruta.",
      );
    } finally {
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
            defaultValue={route?.slug}
            placeholder="mi-ruta"
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Duración estimada (minutos)
          <input
            name="estimatedDurationMinutes"
            type="number"
            min={0}
            defaultValue={route?.estimatedDurationMinutes ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Estado de publicación
          <select
            name="publicationStatus"
            defaultValue={route?.publicationStatus ?? "draft"}
            className={inputClassName}
          >
            {PUBLICATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Verificación
          <select
            name="verificationStatus"
            defaultValue={route?.verificationStatus ?? "pending"}
            className={inputClassName}
          >
            {VERIFICATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
              required
              defaultValue={route?.translations[locale].name}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Descripción
            <textarea
              name={`${locale}.description`}
              rows={3}
              defaultValue={route?.translations[locale].description ?? ""}
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
          {submitting ? "Guardando…" : route ? "Guardar cambios" : "Crear ruta"}
        </button>
      </div>
    </form>
  );
}
