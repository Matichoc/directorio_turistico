import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPlacesByIds } from "@/lib/data/places";
import { locales } from "@/i18n/routing";

const MAX_IDS = 50;

const querySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, MAX_IDS),
    ),
  locale: z.enum(locales).default("es"),
});

/**
 * Resuelve los ids de lugares del carrito de recorrido (guardados en
 * `localStorage`, ver `lib/trip/storage.ts`) a datos completos para armar
 * el itinerario en `/recorrido`. Solo devuelve lugares publicados.
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    ids: request.nextUrl.searchParams.get("ids") ?? "",
    locale: request.nextUrl.searchParams.get("locale") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ places: [] });
  }

  const places = await getPlacesByIds(parsed.data.ids, parsed.data.locale);
  return NextResponse.json({ places });
}
