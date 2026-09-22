"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Link } from "@/i18n/navigation";
import {
  getMapStyleUrl,
  PETORCA_CENTER,
  PETORCA_DEFAULT_ZOOM,
} from "@/lib/maps/config";

export interface MapMarkerData {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface MapViewProps {
  className?: string;
  markers?: MapMarkerData[];
}

export function MapView({ className, markers = [] }: MapViewProps) {
  const [selected, setSelected] = useState<MapMarkerData | null>(null);

  const center = markers[0]
    ? { latitude: markers[0].latitude, longitude: markers[0].longitude }
    : PETORCA_CENTER;

  return (
    <div className={className}>
      <Map
        mapStyle={getMapStyleUrl()}
        initialViewState={{
          latitude: center.latitude,
          longitude: center.longitude,
          zoom: PETORCA_DEFAULT_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        {markers.map((marker) => (
          <Marker
            key={marker.slug}
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="bottom"
          >
            <button
              type="button"
              aria-label={marker.name}
              onClick={() => setSelected(marker)}
              className="h-6 w-6 -translate-y-1 rounded-full border-2 border-white bg-red-600 shadow"
            />
          </Marker>
        ))}
        {selected && (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            anchor="top"
            onClose={() => setSelected(null)}
            closeOnClick={false}
          >
            <Link
              href={{
                pathname: "/lugares/[slug]",
                params: { slug: selected.slug },
              }}
              className="text-foreground text-sm font-medium underline"
            >
              {selected.name} →
            </Link>
          </Popup>
        )}
      </Map>
    </div>
  );
}
