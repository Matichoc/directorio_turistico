"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Map, {
  AttributionControl,
  Marker,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Link } from "@/i18n/navigation";
import type { ProvinceFlyoverData } from "@/lib/ui/province-flyover";

/**
 * Relieve real de la provincia: modelo de elevación abierto de AWS (Terrain
 * Tiles, formato Terrarium) — gratis, sin API key, y pensado para usarse así.
 * Con él se dibujan tres cosas a la vez: el terreno en 3D, el sombreado de
 * las laderas y un color por altura (mar → valle → cordillera) en la paleta
 * del sitio (brasa/violeta), sin necesidad de un mapa base de calles.
 */
const TERRAIN_TILES = [
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
];
const TERRAIN_ATTRIBUTION =
  '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles (AWS, Mapzen)</a>';

const FLYOVER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    // Fuentes separadas para el 3D y para el sombreado: MapLibre recomienda
    // no compartir una misma fuente raster-dem entre `terrain` y capas.
    terrainSource: {
      type: "raster-dem",
      tiles: TERRAIN_TILES,
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 13,
      attribution: TERRAIN_ATTRIBUTION,
    },
    reliefSource: {
      type: "raster-dem",
      tiles: TERRAIN_TILES,
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 13,
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#07060c" },
    },
    {
      id: "relief-color",
      type: "color-relief",
      source: "reliefSource",
      paint: {
        "color-relief-color": [
          "interpolate",
          ["linear"],
          ["elevation"],
          0,
          "#081a2e",
          2,
          "#120a1c",
          300,
          "#1f0f2e",
          900,
          "#3a1638",
          1600,
          "#6b2335",
          2400,
          "#b4472c",
          3400,
          "#f0a57a",
          4500,
          "#fbe7d6",
        ],
        "color-relief-opacity": 0.95,
      },
    },
    {
      id: "relief-shade",
      type: "hillshade",
      source: "reliefSource",
      paint: {
        "hillshade-shadow-color": "#05030a",
        "hillshade-highlight-color": "rgba(255, 122, 69, 0.45)",
        "hillshade-accent-color": "#8b5cf6",
        "hillshade-exaggeration": 0.65,
        "hillshade-illumination-direction": 300,
      },
    },
  ],
  terrain: { source: "terrainSource", exaggeration: 1.6 },
  sky: {
    "sky-color": "#120a1f",
    "horizon-color": "#ff7a45",
    "fog-color": "#07060c",
    "sky-horizon-blend": 0.55,
    "horizon-fog-blend": 0.7,
    "fog-ground-blend": 0.35,
    "atmosphere-blend": 0.8,
  },
};

/** Vista de toda la provincia: desde el mar, mirando hacia la cordillera. */
const OVERVIEW = {
  longitude: -71.12,
  latitude: -32.4,
  zoom: 8.9,
  pitch: 62,
  bearing: 72,
};

const FLY_MS = 5200;
const HOLD_MS = 3800;
/** Grados por segundo de la rotación lenta cuando nadie toca el mapa. */
const IDLE_SPIN_DEG_PER_S = 2.2;
/** Tras interactuar, la rotación vuelve a arrancar recién después de esto. */
const IDLE_RESUME_MS = 6000;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ProvinceFlyoverMap({
  data,
  active,
}: {
  data: ProvinceFlyoverData;
  /** La sección está a la vista: fuera de pantalla no se anima nada. */
  active: boolean;
}) {
  const t = useTranslations("home.flyover");
  const mapRef = useRef<MapRef>(null);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const autoplayedRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const [reducedMotion] = useState(prefersReducedMotion);

  const { stops, villages } = data;
  const current = index === null ? null : stops[index];

  const goTo = useCallback(
    (next: number | null) => {
      const map = mapRef.current;
      setIndex(next);
      if (!map) return;
      const stop = next === null ? null : stops[next];
      const camera = stop
        ? {
            center: [stop.longitude, stop.latitude] as [number, number],
            zoom: 12.2,
            pitch: 68,
            // Cada parada entra con un ángulo distinto, siempre mirando hacia
            // el interior (la cordillera queda al fondo).
            bearing: 55 + ((next ?? 0) % 3) * 22,
          }
        : {
            center: [OVERVIEW.longitude, OVERVIEW.latitude] as [number, number],
            zoom: OVERVIEW.zoom,
            pitch: OVERVIEW.pitch,
            bearing: OVERVIEW.bearing,
          };
      if (reducedMotion) {
        map.jumpTo(camera);
      } else {
        map.flyTo({ ...camera, duration: FLY_MS, essential: true, curve: 1.6 });
      }
    },
    [stops, reducedMotion],
  );

  // Recorrido automático: vuela a cada comuna, se queda un momento mostrando
  // su tarjeta y pasa a la siguiente; al final vuelve a la vista general.
  useEffect(() => {
    if (!playing || !loaded) return;
    const nextIndex = index === null ? 0 : index + 1;
    const delay = index === null ? 300 : FLY_MS + HOLD_MS;
    const timer = window.setTimeout(() => {
      if (nextIndex >= stops.length) {
        setPlaying(false);
        goTo(null);
      } else {
        goTo(nextIndex);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [playing, loaded, index, stops.length, goTo]);

  // La primera vez que la sección aparece en pantalla, el recorrido arranca
  // solo (el efecto "wow"); con movimiento reducido, nunca.
  useEffect(() => {
    if (!active || !loaded || autoplayedRef.current || reducedMotion) return;
    if (stops.length === 0) return;
    // Un respiro para que se vea la vista general antes de despegar. La marca
    // de "ya arrancó" se pone recién al despegar: si la sección sale de
    // pantalla antes, el recorrido arranca la próxima vez que aparezca.
    const timer = window.setTimeout(() => {
      // Si alguien ya tocó el mapa o los botones, no se le quita el control.
      if (autoplayedRef.current) return;
      autoplayedRef.current = true;
      setPlaying(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [active, loaded, reducedMotion, stops.length]);

  // Rotación lenta de la cámara mientras nadie interactúa ni hay recorrido.
  useEffect(() => {
    if (!active || !loaded || playing || reducedMotion) return;
    let frame = 0;
    let last = performance.now();
    const spin = (now: number) => {
      const map = mapRef.current;
      const dt = now - last;
      last = now;
      if (
        map &&
        !map.isMoving() &&
        now - lastInteractionRef.current > IDLE_RESUME_MS
      ) {
        map.setBearing(map.getBearing() + (IDLE_SPIN_DEG_PER_S * dt) / 1000);
      }
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [active, loaded, playing, reducedMotion]);

  function markInteraction() {
    lastInteractionRef.current = performance.now();
    autoplayedRef.current = true;
  }

  function handleUserGesture(event: { originalEvent?: unknown }) {
    // Solo los gestos reales del usuario (no los `flyTo` del recorrido)
    // detienen el recorrido y pausan la rotación.
    if (!event.originalEvent) return;
    markInteraction();
    setPlaying(false);
  }

  function togglePlay() {
    markInteraction();
    if (playing) {
      setPlaying(false);
      return;
    }
    if (index !== null && index >= stops.length - 1) setIndex(null);
    setPlaying(true);
  }

  function jump(next: number | null) {
    markInteraction();
    setPlaying(false);
    goTo(next);
  }

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        mapStyle={FLYOVER_STYLE}
        initialViewState={OVERVIEW}
        maxPitch={78}
        cooperativeGestures
        attributionControl={false}
        // "load" espera a que llegue todo el relieve visible, y con conexión
        // lenta eso tarda: para animar la cámara basta con que el estilo esté
        // listo (las teselas siguen llegando mientras vuela).
        onStyleData={() => setLoaded(true)}
        onLoad={() => setLoaded(true)}
        // Una tesela de relieve que no llega (red lenta, sin conexión) no es
        // un error de la página: el mapa sigue funcionando con las demás.
        onError={(event) => {
          if (!/AJAXError|Failed to fetch/.test(event.error?.message ?? "")) {
            console.error(event.error);
          }
        }}
        onDragStart={handleUserGesture}
        onRotateStart={handleUserGesture}
        onPitchStart={handleUserGesture}
        onZoomStart={handleUserGesture}
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl compact position="top-right" />
        {villages.map((village) => {
          const isCurrent =
            current !== null &&
            village.isSeat &&
            village.latitude === current.latitude &&
            village.longitude === current.longitude;
          return (
            <Marker
              key={village.slug}
              longitude={village.longitude}
              latitude={village.latitude}
              anchor="center"
            >
              <Link
                href={{
                  pathname: "/pueblos/[slug]",
                  params: { slug: village.slug },
                }}
                aria-label={village.name}
                title={village.name}
                className="group relative flex items-center justify-center"
              >
                <span
                  className={`absolute rounded-full ${
                    village.isSeat
                      ? "bg-accent h-6 w-6 animate-ping opacity-40"
                      : "bg-neon-2 h-3 w-3 opacity-0 group-hover:animate-ping group-hover:opacity-40"
                  }`}
                />
                <span
                  className={`relative rounded-full border border-white/80 shadow-[0_0_12px_2px_var(--accent-soft)] transition-transform group-hover:scale-150 ${
                    village.isSeat
                      ? `bg-accent h-3.5 w-3.5 ${isCurrent ? "scale-150" : ""}`
                      : "bg-neon-2 h-2 w-2"
                  }`}
                />
                {village.isSeat && (
                  <span className="pointer-events-none absolute top-full mt-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white backdrop-blur-sm">
                    {village.name}
                  </span>
                )}
              </Link>
            </Marker>
          );
        })}
      </Map>

      {/* Viñeta: funde los bordes del mapa con la tarjeta oscura. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_20px_#07060c]"
      />

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-2 sm:inset-x-4 sm:bottom-4">
        <div
          key={current?.communeSlug ?? "overview"}
          aria-live="polite"
          className="surface-glass animate-stop-in pointer-events-auto max-w-sm rounded-2xl p-3 text-white sm:p-4"
        >
          {current ? (
            <>
              <p className="text-gradient text-xl font-semibold">
                {current.name}
              </p>
              <p className="text-xs text-white/70">
                {t("stats", {
                  villages: current.villages,
                  places: current.attractions,
                })}
              </p>
              {current.summary && (
                <p className="mt-2 line-clamp-2 text-sm text-white/85 sm:line-clamp-3">
                  {current.summary}
                </p>
              )}
              <Link
                href={{
                  pathname: "/explorar",
                  query: { comuna: current.communeSlug },
                }}
                className="bg-accent text-accent-foreground mt-3 inline-block rounded-full px-4 py-2 text-sm font-medium"
              >
                {t("explore", { name: current.name })}
              </Link>
            </>
          ) : (
            <>
              <p className="text-gradient text-xl font-semibold">
                {t("overviewTitle")}
              </p>
              <p className="mt-1 hidden text-sm text-white/80 sm:block">
                {t("overviewText")}
              </p>
            </>
          )}
        </div>

        {/* En celular los botones van en una sola fila deslizable, para no
            tapar el mapa con tres filas de botones. */}
        <div className="pointer-events-auto flex [scrollbar-width:none] items-center gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible">
          <button
            type="button"
            onClick={togglePlay}
            className="bg-accent text-accent-foreground shrink-0 rounded-full px-4 py-2 text-sm font-medium shadow-[0_0_20px_2px_var(--accent-soft)]"
          >
            {playing ? t("pause") : t("play")}
          </button>
          <button
            type="button"
            onClick={() => jump(null)}
            aria-pressed={index === null}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs backdrop-blur-sm ${
              index === null
                ? "border-accent bg-black/60 text-white"
                : "border-white/20 bg-black/40 text-white/80"
            }`}
          >
            {t("overview")}
          </button>
          {stops.map((stop, stopIndex) => (
            <button
              key={stop.communeSlug}
              type="button"
              onClick={() => jump(stopIndex)}
              aria-pressed={index === stopIndex}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs backdrop-blur-sm ${
                index === stopIndex
                  ? "border-accent bg-black/60 text-white"
                  : "border-white/20 bg-black/40 text-white/80"
              }`}
            >
              {stop.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
