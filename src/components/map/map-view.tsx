"use client";

import { useEffect, useRef, useState } from "react";
import Map, {
  GeolocateControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
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
import { PlayerToken } from "@/components/map/player-token";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryPinColor, getPlaceIcon } from "@/lib/ui/category-gradient";
import { haversineDistanceKm } from "@/lib/itinerary-engine";
import {
  AVATAR_EVENT,
  DEFAULT_AVATAR_ICON,
  getAvatarIcon,
  type AvatarIcon,
} from "@/lib/navigation/avatar-storage";
import {
  getMapStyleUrl,
  PETORCA_CENTER,
  PETORCA_DEFAULT_ZOOM,
  PLACE_DETAIL_ZOOM,
} from "@/lib/maps/config";

/**
 * Bajo esta distancia a una parada, su pin se destaca (pedido del usuario:
 * "que se destaque o brille al pasar por algún lugar"). 150 m es más o
 * menos 2 min caminando — cerca de verdad, no solo "en el mismo pueblo" —
 * y da margen a la precisión típica del GPS de un teléfono a pie/en auto.
 */
const NEAR_STOP_KM = 0.15;

export interface MapMarkerData {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  categorySlug?: string | null;
  /** Ícono puntual del lugar (ver migración 0010_place_icon.sql). */
  icon?: string | null;
}

export interface MapViewProps {
  className?: string;
  markers?: MapMarkerData[];
  /** [lng, lat] de una ruta real por calle (ver lib/maps/directions.ts) —
   * se dibuja como línea sobre el mapa, para el modo de navegación. */
  routeLine?: [number, number][] | null;
  /** Muestra el control de geolocalización de MapLibre (punto azul que
   * sigue tu posición real) — modo navegación. */
  showLiveLocation?: boolean;
}

export function MapView({
  className,
  markers = [],
  routeLine,
  showLiveLocation = false,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<MapMarkerData | null>(null);
  const [livePosition, setLivePosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [avatarIcon, setAvatarIconState] =
    useState<AvatarIcon>(DEFAULT_AVATAR_ICON);

  useEffect(() => {
    function sync() {
      setAvatarIconState(getAvatarIcon());
    }
    sync();
    window.addEventListener(AVATAR_EVENT, sync);
    return () => window.removeEventListener(AVATAR_EVENT, sync);
  }, []);

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
        {showLiveLocation && (
          <GeolocateControl
            position="top-right"
            trackUserLocation
            // La ficha (PlayerToken, más abajo) reemplaza al punto azul
            // genérico — pedido del usuario ("que te acompañe por el
            // recorrido... y sea quien se mueve en el mapa por ti").
            showUserLocation={false}
            positionOptions={{ enableHighAccuracy: true }}
            onGeolocate={(event) =>
              setLivePosition({
                latitude: event.coords.latitude,
                longitude: event.coords.longitude,
              })
            }
          />
        )}
        {showLiveLocation && livePosition && (
          <Marker
            latitude={livePosition.latitude}
            longitude={livePosition.longitude}
            anchor="center"
          >
            <PlayerToken icon={avatarIcon} />
          </Marker>
        )}
        {routeLine && routeLine.length > 1 && (
          <Source
            id="route-line-source"
            type="geojson"
            data={{
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: routeLine },
            }}
          >
            <Layer
              id="route-line-layer"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": "#2563eb",
                "line-width": 5,
                "line-opacity": 0.85,
              }}
            />
          </Source>
        )}
        {markers.map((marker, index) => {
          const isNear =
            showLiveLocation &&
            livePosition !== null &&
            haversineDistanceKm(livePosition, marker) < NEAR_STOP_KM;

          return (
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
                  placeIcon={marker.icon}
                  selected={selected?.slug === marker.slug}
                  near={isNear}
                  delayMs={Math.min(index * 60, 600)}
                />
              </button>
            </Marker>
          );
        })}
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
                <CategoryIcon
                  icon={getPlaceIcon(selected.categorySlug, selected.icon)}
                  className="h-3.5 w-3.5"
                />
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
