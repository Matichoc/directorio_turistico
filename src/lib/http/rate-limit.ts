/**
 * Limitador de tasa simple en memoria, por clave (IP) — protege endpoints
 * que llaman a APIs de Google con costo real por request (`/api/directions`,
 * `/api/place-photo`) de un abuso básico (loop de peticiones desde un
 * mismo origen). No es una garantía dura: en Vercel cada instancia de
 * función serverless tiene su propia memoria, así que el límite real es
 * "por instancia", no global — un atacante repartido entre varias
 * instancias lo esquiva. Si esto no basta (tráfico real y abuso real), la
 * solución correcta es un limitador distribuido (ej. Upstash Redis +
 * `@upstash/ratelimit`) — decisión pendiente de confirmar con el usuario,
 * implica sumar una cuenta/servicio nuevo.
 */
const WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 500;

const buckets = new Map<string, { count: number; resetAt: number }>();

function pruneExpired(now: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

/** `true` si `key` ya superó `limit` peticiones en la ventana actual (1 min). */
export function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
