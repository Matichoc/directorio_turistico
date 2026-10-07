import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/events";

const eventSchema = z.object({
  name: z.enum(ANALYTICS_EVENT_NAMES),
  properties: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .optional(),
});

export async function POST(request: NextRequest) {
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
