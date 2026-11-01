"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 10;

const inputClass =
  "border-accent-soft focus:border-accent rounded-xl border bg-transparent px-3 py-2 outline-none dark:border-white/15";

/**
 * Crear o cambiar la clave de la cuenta con sesión (aceptar invitación,
 * link para cambiar clave y "Mi cuenta"). La clave va directo a Supabase
 * Auth; el sitio nunca la guarda ni la ve.
 */
export function PasswordForm({
  submitLabel,
  onDone,
}: {
  submitLabel: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const repeat = String(data.get("repeat") ?? "");
    if (password.length < MIN_LENGTH) {
      setError(`La clave tiene que tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== repeat) {
      setError("Las dos claves no son iguales.");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: updateError } = await createClient().auth.updateUser({
      password,
    });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onDone();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        Clave nueva (al menos {MIN_LENGTH} caracteres)
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Repítela
        <input
          name="repeat"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
