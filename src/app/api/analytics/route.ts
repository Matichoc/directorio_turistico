import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/events";
import { getClientIp, isRateLimited } from "@/lib/http/rate-limit";

// Una visita normal manda unos pocos eventos por página; con más que esto es
// un script. Sin tope, cualquiera inflaba las métricas o la tabla
// (auditoría 2026-11-02).
const MAX_EVENTS_PER_MINUTE = 60;
const MAX_PROPERTIES = 12;

const eventSchema = z.object({
  name: z.enum(ANALYTICS_EVENT_NAMES),
  properties: z
    .record(
      z.string().max(40),
      z.union([z.string().max(200), z.number(), z.boolean(), z.null()]),
    )
    .refine((value) => Object.keys(value).length <= MAX_PROPERTIES)
    .optional(),
});

export async function POST(request: NextRequest) {
  if (
    isRateLimited(`analytics:${getClientIp(request)}`, MAX_EVENTS_PER_MINUTE)
  ) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, stored: false });
  }

  // Cliente normal (anon key), no el de service role: la política RLS de
  // `analytics_events` (0008_rls.sql) ya permite insert anónimo — usar el
  // cliente admin acá daba de más (bypass de RLS en TODA la base) sin
  // necesitarlo para esta única escritura.
  const supabase = await createClient();
  const { error } = await supabase.from("analytics_events").insert({
    name: parsed.data.name,
    properties: parsed.data.properties ?? {},
  });

  return NextResponse.json({ ok: !error, stored: !error });
}
