"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export interface CsvImportRowResult {
  row: number;
  name: string;
  status: "created" | "updated" | "error";
  message?: string;
}

export interface CsvImportReport {
  results: CsvImportRowResult[];
  createdCount: number;
  updatedCount: number;
  errorCount: number;
}

/**
 * Carga de CSV/TXT genérica para el panel admin — recibe la acción de
 * servidor como prop para servir tanto a lugares como, más adelante,
 * rutas, sin duplicar este formulario por entidad.
 */
export function CsvImportForm({
  action,
  entityLabel,
}: {
  action: (csvText: string) => Promise<CsvImportReport>;
  entityLabel: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<CsvImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setReport(null);

    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Selecciona un archivo primero.");
      return;
    }

    setSubmitting(true);
    try {
      const text = await file.text();
      const result = await action(text);
      setReport(result);
      form.reset();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo procesar el archivo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const errors = report?.results.filter((result) => result.status === "error");

  return (
    <div className="border-accent-soft flex flex-col gap-3 rounded-2xl border p-4 text-sm dark:border-white/10">
      <p className="font-medium">Cargar {entityLabel} desde un archivo</p>
      <p className="text-foreground/60 text-xs">
        Descargá &ldquo;Descargar CSV&rdquo;, editalo en Excel o Google Sheets
        (guardalo como CSV o texto separado por comas) y subilo acá: cada fila
        con un identificador que ya existe actualiza ese registro, el resto crea
        uno nuevo.
      </p>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="file"
          name="file"
          accept=".csv,.txt,text/csv,text/plain"
          required
          className="text-foreground/80 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-accent-foreground rounded-full px-4 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Procesando…" : "Cargar archivo"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {report && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {report.createdCount} creado{report.createdCount === 1 ? "" : "s"},{" "}
            {report.updatedCount} actualizado
            {report.updatedCount === 1 ? "" : "s"}, {report.errorCount} con
            error.
          </p>
          {errors && errors.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-red-600">
              {errors.map((result) => (
                <li key={result.row}>
                  Fila {result.row} ({result.name}): {result.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
