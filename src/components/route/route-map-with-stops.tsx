"use client";

import { useState } from "react";
import { RouteNavigationMap } from "@/components/map/route-navigation-map";
import type { MapMarkerData } from "@/components/map/map-view";
import { RouteStopChecklist } from "@/components/route/route-stop-checklist";
import type { RouteStop } from "@/types/domain";

/**
 * Junta el mapa de navegación y el checklist de paradas bajo un solo
 * `highlightedSlug` compartido — resaltado cruzado mapa↔lista (pedido del
 * usuario: pasar el mouse por una parada destaca su pin, y viceversa).
 * Server component no puede tener este estado, por eso ambos viven bajo un
 * wrapper cliente en vez de quedar sueltos en la página de la ruta.
 */
export function RouteMapWithStops({
  routeId,
  routeSlug,
  stops,
  mapClassName,
}: {
  routeId: string;
  routeSlug: string;
  stops: RouteStop[];
  mapClassName?: string;
}) {
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  const markers: MapMarkerData[] = stops.map((stop) => ({
    slug: stop.placeSlug,
    name: stop.placeName,
    shortDescription: stop.placeShortDescription,
    latitude: stop.latitude,
    longitude: stop.longitude,
    categorySlug: stop.categorySlug,
    icon: stop.placeIcon,
  }));

  return (
    <div className="flex flex-col gap-4">
      {stops.length > 0 && (
        <RouteNavigationMap
          className={mapClassName}
          markers={markers}
          highlightedSlug={highlightedSlug}
          onMarkerClick={setHighlightedSlug}
        />
      )}

      <RouteStopChecklist
        routeId={routeId}
        routeSlug={routeSlug}
        stops={stops}
        highlightedSlug={highlightedSlug}
        onHoverStop={setHighlightedSlug}
      />
    </div>
  );
}
