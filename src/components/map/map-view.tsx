"use client";

import { useRef, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// `maplibre-gl` está fijado a la serie 5.x en package.json a propósito: la
// v6 cambió cómo se cargan los workers/tiles y el mapa queda en blanco sin
// ningún error en consola con `react-map-gl` (bug conocido y reportado en
// varios proyectos). No subir a v6 sin antes configurar el worker según la
// guía de migración de MapLibre para el bundler de Next.js/Turbopack.
import { Link } from "@/i18n/navigation";
import { MapPin } from "@/components/map/map-pin";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryPinColor } from "@/lib/ui/category-gradient";
import {
  getMapStyleUrl,
  PETORCA_CENTER,
  PETORCA_DEFAULT_ZOOM,
  PLACE_DETAIL_ZOOM,
} from "@/lib/maps/config";

export interface MapMarkerData {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  categorySlug?: string | null;
}

export interface MapViewProps {
  className?: string;
  markers?: MapMarkerData[];
}

export function MapView({ className, markers = [] }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<MapMarkerData | null>(null);

  const center = markers[0]
    ? { latitude: markers[0].latitude, longitude: markers[0].longitude }
    : PETORCA_CENTER;
  const initialZoom =
    markers.length === 1 ? PLACE_DETAIL_ZOOM : PETORCA_DEFAULT_ZOOM;

  function handleLoad() {
    // Con 2+ marcadores, encuadra el mapa a su extensión real en vez de
    // dejar el zoom fijo de toda la provincia — así cada vista muestra
    // dónde están realmente los lugares en vez de un mapa "genérico".
    if (markers.length < 2 || !mapRef.current) return;

    const lats = markers.map((marker) => marker.latitude);
    const lons = markers.map((marker) => marker.longitude);
    mapRef.current.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 56, maxZoom: 14, duration: 0 },
    );
  }

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        onLoad={handleLoad}
        mapStyle={getMapStyleUrl()}
        initialViewState={{
          latitude: center.latitude,
          longitude: center.longitude,
          zoom: initialZoom,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        {markers.map((marker, index) => (
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
            >
              <MapPin
                categorySlug={marker.categorySlug}
                selected={selected?.slug === marker.slug}
                delayMs={Math.min(index * 60, 600)}
              />
            </button>
          </Marker>
        ))}
        {selected && (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            anchor="top"
            offset={16}
            onClose={() => setSelected(null)}
            closeOnClick={false}
            className="[&_.maplibregl-popup-content]:rounded-xl [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:shadow-lg"
          >
            <Link
              href={{
                pathname: "/lugares/[slug]",
                params: { slug: selected.slug },
              }}
              className="flex items-center gap-2 px-3 py-2"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                style={{
                  backgroundColor: getCategoryPinColor(selected.categorySlug),
                }}
              >
                <CategoryIcon icon={selected.categorySlug} className="h-3.5 w-3.5" />
              </span>
              <span className="text-foreground text-sm font-medium">
                {selected.name} →
              </span>
            </Link>
          </Popup>
        )}
      </Map>
    </div>
  );
}
