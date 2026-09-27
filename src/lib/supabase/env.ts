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
