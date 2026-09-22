import { NextResponse, type NextRequest } from "next/server";

const PHOTO_REF_PATTERN = /^places\/[\w-]+\/photos\/[\w-]+$/;
const DEFAULT_MAX_WIDTH_PX = 1200;
const MAX_ALLOWED_WIDTH_PX = 1600;

/**
 * Sirve fotos de Google Places API (New) sin exponer `GOOGLE_PLACES_API_KEY`
 * al navegador: recibe el `name` del recurso foto (p. ej.
 * "places/XXX/photos/YYY", guardado como `place_images.storage_path` por
 * scripts/fetch-google-photos.ts) y hace streaming del binario desde
 * Google. `fetch` sigue el 302 que Google devuelve por defecto hacia el
 * CDN real de la foto.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!ref || !PHOTO_REF_PATTERN.test(ref)) {
    return NextResponse.json({ error: "invalid_ref" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const requestedWidth = Number(request.nextUrl.searchParams.get("w"));
  const maxWidthPx =
    Number.isFinite(requestedWidth) && requestedWidth > 0
      ? Math.min(Math.round(requestedWidth), MAX_ALLOWED_WIDTH_PX)
      : DEFAULT_MAX_WIDTH_PX;

  const googleUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;
  const upstream = await fetch(googleUrl);

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
