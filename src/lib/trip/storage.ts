import { createClient } from "@/lib/supabase/client";
import { ensureVisitorSession } from "@/lib/session/visitor-session";

/**
 * Carrito de recorrido: backend real vía `itineraries`/`itinerary_stops`
 * (migración `0018_itinerary_backend.sql`), atado a la misma sesión real
 * de visitante que ya usan "me gusta"/comentarios
 * (`lib/session/visitor-session.ts`) — antes vivía solo en `localStorage`
 * del navegador (Riesgo #13 en docs/PLAN.md), pedido explícito del
 * usuario para que fuera "real". Dispara `TRIP_EVENT` en `window` en cada
 * mutación para que otros componentes montados (botones "agregar", la
 * página /recorrido) se mantengan sincronizados sin prop drilling — mismo
 * mecanismo de antes, ahora avisando al terminar la escritura async en
 * vez de un `localStorage.setItem` síncrono.
 */
export const TRIP_EVENT = "trip:change";
export type TripOrderMode = "auto" | "manual";

function notify(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRIP_EVENT));
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

async function getOwnItinerary(): Promise<{
  id: string;
  orderMode: TripOrderMode;
} | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("itineraries")
    .select("id, order_mode")
    .eq("user_id", userId)
    .maybeSingle();

  return data ? { id: data.id, orderMode: data.order_mode } : null;
}

/** Crea el itinerario del visitante si todavía no tiene uno (siempre uno solo, `unique(user_id)`). */
async function getOrCreateItineraryId(): Promise<string> {
  await ensureVisitorSession();
  const existing = await getOwnItinerary();
  if (existing) return existing.id;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("itineraries")
    .insert({})
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo crear el recorrido");
  }
  return data.id;
}

async function getNextPosition(itineraryId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("itinerary_stops")
    .select("position")
    .eq("itinerary_id", itineraryId)
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? -1) + 1;
}

export async function getTripPlaceIds(): Promise<string[]> {
  const itinerary = await getOwnItinerary();
  if (!itinerary) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("itinerary_stops")
    .select("place_id")
    .eq("itinerary_id", itinerary.id)
    .order("position");

  return (data ?? []).map((stop) => stop.place_id);
}

export async function isInTrip(placeId: string): Promise<boolean> {
  const ids = await getTripPlaceIds();
  return ids.includes(placeId);
}

export async function addTripPlace(placeId: string): Promise<void> {
  const current = await getTripPlaceIds();
  if (current.includes(placeId)) return;

  const itineraryId = await getOrCreateItineraryId();
  const position = await getNextPosition(itineraryId);
  const supabase = createClient();
  await supabase
    .from("itinerary_stops")
    .insert({ itinerary_id: itineraryId, place_id: placeId, position });
  notify();
}

export async function addTripPlaces(placeIds: string[]): Promise<void> {
  const current = new Set(await getTripPlaceIds());
  const toAdd = placeIds.filter((id) => !current.has(id));
  if (toAdd.length === 0) return;

  const itineraryId = await getOrCreateItineraryId();
  let nextPosition = await getNextPosition(itineraryId);
  const rows = toAdd.map((placeId) => ({
    itinerary_id: itineraryId,
    place_id: placeId,
    position: nextPosition++,
  }));

  const supabase = createClient();
  await supabase.from("itinerary_stops").insert(rows);
  notify();
}

export async function removeTripPlace(placeId: string): Promise<void> {
  const itinerary = await getOwnItinerary();
  if (!itinerary) return;

  const supabase = createClient();
  await supabase
    .from("itinerary_stops")
    .delete()
    .eq("itinerary_id", itinerary.id)
    .eq("place_id", placeId);
  notify();
}

export async function clearTrip(): Promise<void> {
  const itinerary = await getOwnItinerary();
  if (itinerary) {
    const supabase = createClient();
    await supabase
      .from("itinerary_stops")
      .delete()
      .eq("itinerary_id", itinerary.id);
    await supabase
      .from("itineraries")
      .update({ order_mode: "auto" })
      .eq("id", itinerary.id);
  }
  notify();
}

export async function getTripOrderMode(): Promise<TripOrderMode> {
  const itinerary = await getOwnItinerary();
  return itinerary?.orderMode ?? "auto";
}

/**
 * Guarda el orden exacto que el usuario armó a mano (arrastrando/subiendo-
 * bajando paradas) y pasa a modo manual: `TripView` deja de recalcular el
 * orden por vecino más cercano hasta que se llame a `resetTripOrder`.
 */
export async function reorderTripPlaces(orderedIds: string[]): Promise<void> {
  const itineraryId = await getOrCreateItineraryId();
  const supabase = createClient();

  await supabase
    .from("itineraries")
    .update({ order_mode: "manual" })
    .eq("id", itineraryId);

  for (const [position, placeId] of orderedIds.entries()) {
    await supabase
      .from("itinerary_stops")
      .update({ position })
      .eq("itinerary_id", itineraryId)
      .eq("place_id", placeId);
  }
  notify();
}

/** Descarta el orden a mano y vuelve a calcular por vecino más cercano. */
export async function resetTripOrder(): Promise<void> {
  const itinerary = await getOwnItinerary();
  if (!itinerary) return;

  const supabase = createClient();
  await supabase
    .from("itineraries")
    .update({ order_mode: "auto" })
    .eq("id", itinerary.id);
  notify();
}
