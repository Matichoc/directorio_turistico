"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createPlace,
  updatePlace,
  type PlaceFormInput,
} from "@/lib/server/content/places";
import type { AdminPlaceDetail } from "@/lib/data/places";
import { slugify } from "@/lib/slug";

const ICON_OPTIONS = [
  { value: "", label: "— (usar el de la categoría)" },
  { value: "mountain", label: "Montaña" },
  { value: "utensils", label: "Cubiertos" },
  { value: "landmark", label: "Monumento" },
  { value: "waves", label: "Olas" },
  { value: "dulce", label: "Dulce" },
  { value: "tejido", label: "Tejido" },
  { value: "diablo", label: "Diablo" },
  { value: "surf", label: "Surf" },
  { value: "casco-minero", label: "Casco minero" },
  { value: "palta", label: "Palta" },
];

const PUBLICATION_OPTIONS: {
  value: PlaceFormInput["publicationStatus"];
  label: string;
}[] = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Desactivado" },
];

const VERIFICATION_OPTIONS: {
  value: PlaceFormInput["verificationStatus"];
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
    shortDescription: String(formData.get(`${locale}.shortDescription`) ?? ""),
    description: String(formData.get(`${locale}.description`) ?? ""),
  };
}

export function PlaceForm({
  communes,
  categories,
  place,
}: {
  communes: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  place?: AdminPlaceDetail;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  // Si ya existe el lugar, su slug no se toca solo (podría ya estar
  // publicado con ese slug en otro lado) — el autocompletado es solo para
  // el alta de uno nuevo, para que quien lo crea no tenga que inventarlo.
  const slugTouchedRef = useRef(Boolean(place));

  function handleNameEsChange(event: ChangeEvent<HTMLInputElement>) {
    if (slugTouchedRef.current || !slugInputRef.current) return;
    slugInputRef.current.value = slugify(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const input: PlaceFormInput = {
      slug: String(formData.get("slug") ?? ""),
      communeId: String(formData.get("communeId") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      latitude: Number(formData.get("latitude")),
      longitude: Number(formData.get("longitude")),
      address: String(formData.get("address") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
      icon: String(formData.get("icon") ?? ""),
      publicationStatus: formData.get(
        "publicationStatus",
      ) as PlaceFormInput["publicationStatus"],
      verificationStatus: formData.get(
        "verificationStatus",
      ) as PlaceFormInput["verificationStatus"],
      translations: {
        es: readTranslation(formData, "es"),
        en: readTranslation(formData, "en"),
      },
    };

    try {
      if (place) {
        await updatePlace(place.id, input);
      } else {
        await createPlace(input);
      }
      router.push("/admin/lugares");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el lugar.",
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
            defaultValue={place?.slug}
            placeholder="mi-lugar"
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
            defaultValue={place?.communeId}
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
          Categoría
          <select
            name="categoryId"
            required
            defaultValue={place?.categoryId}
            className={inputClassName}
          >
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Ícono puntual
          <select
            name="icon"
            defaultValue={place?.icon ?? ""}
            className={inputClassName}
          >
            {ICON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Latitud
          <input
            name="latitude"
            type="number"
            step="any"
            required
            defaultValue={place?.latitude}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Longitud
          <input
            name="longitude"
            type="number"
            step="any"
            required
            defaultValue={place?.longitude}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Dirección
          <input
            name="address"
            defaultValue={place?.address ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Teléfono
          <input
            name="phone"
            defaultValue={place?.phone ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Sitio web
          <input
            name="website"
            type="url"
            defaultValue={place?.website ?? ""}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Estado de publicación
          <select
            name="publicationStatus"
            defaultValue={place?.publicationStatus ?? "draft"}
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
            defaultValue={place?.verificationStatus ?? "pending"}
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
              defaultValue={place?.translations[locale].name}
              onChange={locale === "es" ? handleNameEsChange : undefined}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Descripción corta
            <input
              name={`${locale}.shortDescription`}
              maxLength={200}
              defaultValue={place?.translations[locale].shortDescription ?? ""}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Descripción
            <textarea
              name={`${locale}.description`}
              rows={4}
              defaultValue={place?.translations[locale].description ?? ""}
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
            : place
              ? "Guardar cambios"
              : "Crear lugar"}
        </button>
      </div>
    </form>
  );
}
