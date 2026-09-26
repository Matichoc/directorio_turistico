"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapView, type MapMarkerData } from "@/components/map/map-view";
import { AvatarPicker } from "@/components/map/avatar-picker";
import { fetchDirections, type DirectionsResult } from "@/lib/maps/directions";

/**
 * MapView + modo "navegación en vivo": calcula la ruta real por calle
 * (Google Routes API, vía /api/directions) entre las paradas en el orden
 * dado y muestra tu posición real en el mapa mientras te mueves (control
 * nativo de MapLibre). Pedido del usuario: "mapa interactivo de
 * auto moviéndose... como tipo ruta de maps con paradas".
 *
 * Si la ruta por calle falla (sin API key, cuota, sin red), no rompe nada:
 * cae al mapa normal con los marcadores igual, solo sin la línea de ruta.
 */
export function RouteNavigationMap({
  className,
  markers,
}: {
  className?: string;
  markers: MapMarkerData[];
}) {
  const t = useTranslations("route");
  const [navigationOn, setNavigationOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [error, setError] = useState(false);

  async function startNavigation() {
    setNavigationOn(true);
    setError(false);

    if (!directions && markers.length >= 2) {
      setLoading(true);
      const result = await fetchDirections(
        markers.map((marker) => ({
          lat: marker.latitude,
          lng: marker.longitude,
        })),
      );
      setLoading(false);
      if (result) {
        setDirections(result);
      } else {
        setError(true);
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            navigationOn ? setNavigationOn(false) : startNavigation()
          }
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            navigationOn
              ? "bg-foreground text-background"
              : "bg-accent text-accent-foreground"
          }`}
        >
          {navigationOn ? t("stopNavigation") : t("startNavigation")}
        </button>
        {navigationOn && loading && (
          <span className="text-foreground/60 text-xs">
            {t("calculatingRoute")}
          </span>
        )}
        {navigationOn && !loading && directions && (
          <span className="text-foreground/60 text-xs">
            {t("navigationSummary", {
              distance: (directions.totalDistanceMeters / 1000).toFixed(1),
              duration: Math.round(directions.totalDurationSeconds / 60),
            })}
          </span>
        )}
      </div>

      <AvatarPicker />

      {navigationOn && error && (
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          {t("routeUnavailable")}
        </p>
      )}
      {navigationOn && !error && (
        <p className="text-foreground/50 text-xs">{t("liveLocationHint")}</p>
      )}

      <MapView
        className={className}
        markers={markers}
        routeLine={navigationOn ? directions?.coordinates : undefined}
        showLiveLocation={navigationOn}
      />
    </div>
  );
}
