"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createTag } from "@/lib/server/content/tags";

const inputClassName =
  "border-accent-soft focus:border-accent rounded-full border bg-transparent px-3 py-1.5 text-sm outline-none dark:border-white/15";

export function TagForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      await createTag({
        slug: String(formData.get("slug") ?? ""),
        name: String(formData.get("name") ?? ""),
      });
      event.currentTarget.reset();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear el tag.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col gap-1 text-xs">
        Slug
        <input
          name="slug"
          required
          placeholder="pet-friendly"
          className={inputClassName}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Nombre
        <input
          name="name"
          required
          placeholder="Pet friendly"
          className={inputClassName}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="bg-accent text-accent-foreground rounded-full px-4 py-1.5 text-sm font-medium disabled:opacity-60"
      >
        {submitting ? "Creando…" : "+ Agregar tag"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
