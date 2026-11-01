import { getSupabaseSchema, isDevelopmentSchema } from "@/lib/supabase/env";

/**
 * Franja de aviso en el ambiente de desarrollo (datos de `legacy_dev`, ver
 * docs/DESARROLLO.md): que nadie confunda la copia de prueba con el sitio
 * publicado — sobre todo en el admin, donde se guardan cambios. En
 * producción no se muestra nada.
 */
export function DevEnvironmentBanner() {
  const schema = getSupabaseSchema();
  if (!isDevelopmentSchema(schema)) return null;

  return (
    <div
      role="note"
      className="bg-amber-400 px-4 py-1 text-center text-xs font-semibold text-black"
    >
      Ambiente de desarrollo · datos de prueba ({schema}) · lo que cambies acá
      no afecta el sitio publicado
    </div>
  );
}
