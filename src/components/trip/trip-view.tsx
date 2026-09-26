"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { RouteNavigationMap } from "@/components/map/route-navigation-map";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import { getCategoryGradient } from "@/lib/ui/category-gradient";
import { ItineraryEngine, type Itinerary } from "@/lib/itinerary-engine";
import {
  clearTrip,
  getTripOrderMode,
  getTripPlaceIds,
  removeTripPlace,
  reorderTripPlaces,
  resetTripOrder,
  TRIP_EVENT,
  type TripOrderMode,
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
  const [orderMode, setOrderMode] = useState<TripOrderMode>("auto");
  const [places, setPlaces] = useState<PlaceCard[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    function sync() {
      setPlaceIds(getTripPlaceIds());
      setOrderMode(getTripOrderMode());
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

  /**
   * En modo manual, `places` llega en el orden que devolvió la consulta
   * (no el del usuario — ver nota en `getPlacesByIds`), así que se reordena
   * acá según el orden guardado en `placeIds` antes de armar el itinerario.
   */
  const orderedPlaces = useMemo(() => {
    if (!places) return null;
    if (orderMode !== "manual" || !placeIds) return places;
    const position = new Map(placeIds.map((id, index) => [id, index]));
    return [...places].sort(
      (a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0),
    );
  }, [places, orderMode, placeIds]);

  const itinerary: Itinerary | null = useMemo(() => {
    if (!orderedPlaces || orderedPlaces.length === 0) return null;
    const placeInputs = orderedPlaces.map((place) => ({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      visitDurationMinutes: DEFAULT_VISIT_MINUTES,
    }));
    return orderMode === "manual"
      ? ItineraryEngine.buildInOrder(placeInputs)
      : ItineraryEngine.build({ places: placeInputs });
  }, [orderedPlaces, orderMode]);

  /** Sube/baja una parada e inmediatamente pasa a orden manual (ver storage). */
  function moveStop(index: number, direction: -1 | 1) {
    if (!itinerary) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= itinerary.stops.length) return;
    const order = itinerary.stops.map((stop) => stop.placeId);
    [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
    reorderTripPlaces(order);
  }

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
      icon: place.icon,
    }));

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 rounded-xl border border-black/10 p-4 text-center text-sm dark:border-white/10">
        <div>
          <dt className="text-foreground/50 text-xs">{t("summaryStops")}</dt>
          <dd className="font-semibold">{itinerary.stops.length}</dd>
        </div>
        <div>
          <dt className="text-foreground/50 text-xs">{t("summaryDuration")}</dt>
          <dd className="font-semibold">
            {formatDuration(itinerary.totalDurationMinutes)}
          </dd>
        </div>
        <div>
          <dt className="text-foreground/50 text-xs">{t("summaryDistance")}</dt>
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

      {orderMode === "manual" && (
        <p className="text-foreground/60 flex flex-wrap items-center gap-2 text-xs">
          {t("orderManualNotice")}
          <button
            type="button"
            onClick={() => resetTripOrder()}
            className="text-accent underline"
          >
            {t("optimizeAuto")}
          </button>
        </p>
      )}

      {markers.length > 0 && (
        <RouteNavigationMap
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
              <span className="border-foreground/30 text-foreground/50 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium">
                {index + 1}
              </span>
              {place && (
                <Link
                  href={{
                    pathname: "/lugares/[slug]",
                    params: { slug: place.slug },
                  }}
                  className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${getCategoryGradient(place.categorySlug)}`}
                >
                  <PhotoOrIcon
                    photoUrl={place.photoUrl}
                    alt={place.name}
                    categorySlug={place.categorySlug}
                    icon={place.icon}
                    iconClassName="h-5 w-5 text-white/70"
                    imgClassName="object-cover object-[center_65%]"
                    sizes="44px"
                  />
                </Link>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
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
                {place?.shortDescription && (
                  <span className="text-foreground/60 line-clamp-1 text-xs">
                    {place.shortDescription}
                  </span>
                )}
                {index > 0 && (
                  <span className="text-foreground/50 text-xs">
                    {t("travelFromPrevious")}:{" "}
                    {formatDuration(stop.travelFromPreviousMinutes)} ·{" "}
                    {stop.distanceFromPreviousKm.toFixed(1)} km
                  </span>
                )}
              </div>
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => moveStop(index, -1)}
                  disabled={index === 0}
                  aria-label={t("moveUp")}
                  className="text-foreground/60 hover:text-foreground disabled:opacity-25"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveStop(index, 1)}
                  disabled={index === itinerary.stops.length - 1}
                  aria-label={t("moveDown")}
                  className="text-foreground/60 hover:text-foreground disabled:opacity-25"
                >
                  ▼
                </button>
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
