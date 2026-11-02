import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  supabaseDbOptions,
} from "@/lib/supabase/env";

/**
 * Cliente para leer el contenido público (lugares, rutas, pueblos…) con la
 * llave pública y **sin cookies**. El de `server.ts` lee las cookies de
 * sesión, y eso obligaba a Next a armar cada página de cero en cada visita:
 * ninguna se cacheaba y tardaban de 0,5 a 3 s (medido el 2026-11-02, ver
 * docs/RENDIMIENTO.md). Lo que lee este cliente lo cachea `cachedContent`
 * (`lib/data/cache.ts`). Para el panel y lo que depende de quién mira, se
 * sigue usando `server.ts`.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      ...supabaseDbOptions(),
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
