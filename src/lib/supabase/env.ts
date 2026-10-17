function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisa .env.example y configura tu .env.local.`,
    );
  }
  return value;
}

// Ojo: cada `getX()` de acá abajo pasa el valor ya leído vía acceso
// directo (`process.env.NEXT_PUBLIC_...`), no vía `process.env[name]` con
// el nombre como variable — Next.js solo reemplaza `NEXT_PUBLIC_*` por su
// valor real en el bundle del navegador cuando encuentra ese acceso
// literal en el código fuente (lo hace en tiempo de build, buscando el
// texto exacto); con acceso dinámico (`[name]`) no lo detecta y queda
// `undefined` en el cliente aunque la variable esté bien configurada en
// Vercel. Esto rompió en producción el login admin, "me gusta"/
// comentarios y "Mi recorrido" (todo lo que crea un cliente de Supabase
// del lado del navegador) — ver docs/PLAN.md bitácora.
export function getSupabaseUrl(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

export function getSupabaseAnonKey(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Proyecto de Supabase compartido con el sitio de Papudo: ahí el esquema
 * `public` es de Papudo y todo lo del diablo vive en `legacy` (ver
 * docs/SUPABASE-LEGACY.md). Nunca se debe leer ni escribir `public` de ese
 * proyecto desde este repo.
 */
export const SHARED_SUPABASE_PROJECT_REF = "qbfvsnkywlvozvxeujgh";

/**
 * Esquema de Postgres donde viven las tablas del directorio. Se puede fijar
 * con `NEXT_PUBLIC_SUPABASE_SCHEMA`; sin esa variable, en el proyecto
 * compartido es `legacy` y en cualquier otro proyecto, `public`. Apuntar al
 * proyecto compartido con `public` sería leer (y, desde el admin, escribir)
 * las tablas de Papudo: se rechaza.
 */
export function resolveSupabaseSchema(
  url: string | undefined,
  explicit: string | undefined,
): string {
  const isShared = Boolean(url?.includes(SHARED_SUPABASE_PROJECT_REF));
  if (explicit && explicit !== "public") return explicit;
  if (isShared) {
    if (explicit === "public") {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_SCHEMA=public apunta a las tablas de Papudo en el proyecto compartido. Usa legacy (o quita la variable).",
      );
    }
    return "legacy";
  }
  return "public";
}

// Acceso literal (`process.env.NEXT_PUBLIC_...`), por la misma razón de arriba.
export function getSupabaseSchema(): string {
  return resolveSupabaseSchema(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SCHEMA,
  );
}

/**
 * Opción `db` de los clientes de Supabase. El tipo `Database` solo declara
 * `public`, así que el nombre se afirma como tal: en ejecución es el
 * esquema real (`legacy` en el proyecto compartido).
 */
export function supabaseDbOptions() {
  return { db: { schema: getSupabaseSchema() as "public" } };
}
