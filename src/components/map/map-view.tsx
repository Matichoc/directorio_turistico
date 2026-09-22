"use client";

import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  getMapStyleUrl,
  PETORCA_CENTER,
  PETORCA_DEFAULT_ZOOM,
} from "@/lib/maps/config";

export interface MapViewProps {
  className?: string;
}

export function MapView({ className }: MapViewProps) {
  return (
    <div className={className}>
      <Map
        mapStyle={getMapStyleUrl()}
        initialViewState={{
          latitude: PETORCA_CENTER.latitude,
          longitude: PETORCA_CENTER.longitude,
          zoom: PETORCA_DEFAULT_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
      </Map>
    </div>
  );
}
