"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { MapView } from "@/components/map/map-view";
import { ItineraryEngine, type Itinerary } from "@/lib/itinerary-engine";
import {
  clearTrip,
  getTripPlaceIds,
  removeTripPlace,
  TRIP_EVENT,
} from "@/lib/trip/storage";
import type { Locale, PlaceCard } from "@/types/domain";

/**
 * Duración de visita por defecto usada por el motor de itinerarios: no hay
 * dato real por lugar todavía (ver `place_hours` en el esquema, sin poblar),
 * así que se asume una visita media de 45 min para todos los lugares.
 */
const DEFAULT_VISIT_MINUTES = 45;

function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function TripView({ locale }: { locale: Locale }) {
  const t = useTranslations("trip");
  const [placeIds, setPlaceIds] = useState<string[] | null>(null);
  const [places, setPlaces] = useState<PlaceCard[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    function sync() {
      setPlaceIds(getTripPlaceIds());
    }
    sync();
    window.addEventListener(TRIP_EVENT, sync);
    return () => window.removeEventListener(TRIP_EVENT, sync);
  }, []);

  const idsKey = placeIds?.join(",") ?? "";

  useEffect(() => {
    // placeIds === null: todavía no sincronizamos con localStorage.
    // placeIds.length === 0: el render ya cubre este caso con el estado
    // vacío (ver más abajo) sin necesitar `places`, así que no hay nada que
    // buscar.
    if (!placeIds || placeIds.length === 0) return;

    let cancelled = false;
    fetch(`/api/trip/places?ids=${encodeURIComponent(idsKey)}&locale=${locale}`)
      .then((response) => {
        if (!response.ok) throw new Error("request_failed");
        return response.json() as Promise<{ places: PlaceCard[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setPlaces(data.places);
        setLoadError(false);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey, locale, placeIds]);

  const placesById = useMemo(
    () => new Map((places ?? []).map((place) => [place.id, place])),
    [places],
  );

  const itinerary: Itinerary | null = useMemo(() => {
    if (!places || places.length === 0) return null;
    return ItineraryEngine.build({
      places: places.map((place) => ({
        id: place.id,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        visitDurationMinutes: DEFAULT_VISIT_MINUTES,
      })),
    });
  }, [places]);

  if (placeIds === null) {
    return <p className="text-foreground/60 text-sm">{t("loading")}</p>;
  }

  if (placeIds.length === 0) {
    return (
      <EmptyState>
        <div className="flex flex-col items-center gap-3">
          <p>{t("empty")}</p>
          <Link
            href="/explorar"
            className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium"
          >
            {t("emptyCta")}
          </Link>
        </div>
      </EmptyState>
    );
  }

  if (loadError) {
    return <EmptyState>{t("loadError")}</EmptyState>;
  }

  if (!places || !itinerary) {
    return <p className="text-foreground/60 text-sm">{t("loading")}</p>;
  }

  const markers = itinerary.stops
    .map((stop) => placesById.get(stop.placeId))
    .filter((place): place is PlaceCard => Boolean(place))
    .map((place) => ({
      slug: place.slug,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      categorySlug: place.categorySlug,
    }));

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 rounded-xl border border-black/10 p-4 text-center text-sm dark:border-white/10">
        <div>
          <dt className="text-foreground/50 text-xs">{t("summaryStops")}</dt>
          <dd className="font-semibold">{itinerary.stops.length}</dd>
        </div>
        <div>
          <dt className="text-foreground/50 text-xs">
            {t("summaryDuration")}
          </dt>
          <dd className="font-semibold">
            {formatDuration(itinerary.totalDurationMinutes)}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/50 text-xs">
            {t("summaryDistance")}
          </dt>
          <dd className="font-semibold">
            {itinerary.totalDistanceKm.toFixed(1)} km
          </dd>
        </div>
      </dl>

      {itinerary.skippedPlaceIds.length > 0 && (
        <p className="text-foreground/60 rounded-lg bg-amber-100 px-3 py-2 text-xs dark:bg-amber-900/30">
          {t("skippedNotice")}
        </p>
      )}

      {markers.length > 0 && (
        <MapView
          className="h-[40vh] w-full overflow-hidden rounded-xl"
          markers={markers}
        />
      )}

      <ol className="flex flex-col gap-2">
        {itinerary.stops.map((stop, index) => {
          const place = placesById.get(stop.placeId);
          return (
            <li
              key={stop.placeId}
              className="flex items-center gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
            >
              <span className="bg-foreground text-background flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs">
                {index + 1}
              </span>
              <div className="flex flex-1 flex-col">
                {place ? (
                  <Link
                    href={{
                      pathname: "/lugares/[slug]",
                      params: { slug: place.slug },
                    }}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {stop.name}
                  </Link>
                ) : (
                  <span className="font-medium">{stop.name}</span>
                )}
                {index > 0 && (
                  <span className="text-foreground/50 text-xs">
                    {t("travelFromPrevious")}:{" "}
                    {formatDuration(stop.travelFromPreviousMinutes)} ·{" "}
                    {stop.distanceFromPreviousKm.toFixed(1)} km
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeTripPlace(stop.placeId)}
                className="text-foreground/50 hover:text-foreground shrink-0 text-xs underline"
              >
                {t("remove")}
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => clearTrip()}
        className="text-foreground/60 self-start text-xs underline"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}
