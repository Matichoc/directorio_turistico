import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const eventSchema = z.object({
  name: z.enum([
    "place_view",
    "route_view",
    "route_added_to_trip",
    "place_added_to_trip",
    "search_performed",
    "filter_applied",
  ]),
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

  const supabase = createAdminClient();
  const { error } = await supabase.from("analytics_events").insert({
    name: parsed.data.name,
    properties: parsed.data.properties ?? {},
  });

  return NextResponse.json({ ok: !error, stored: !error });
}
