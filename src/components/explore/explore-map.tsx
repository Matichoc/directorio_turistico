"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapView, type MapMarkerData } from "@/components/map/map-view";
import { SectorMarkers } from "@/components/map/sector-markers";
import { ThemeAura } from "@/components/map/theme-aura";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import {
  THEME_STYLE,
  getCategoryGradient,
  getPlaceTheme,
  type PlaceTheme,
} from "@/lib/ui/category-gradient";
import type { MapSector } from "@/lib/ui/map-sectors";
import type { PlaceCard } from "@/types/domain";

const THEME_ORDER: PlaceTheme[] = [
  "playa",
  "dulces",
  "sabores",
  "historia",
  "naturaleza",
  "diablo",
];

/** Lleva la cámara a un lugar elegido desde la tira de tarjetas. */
function FlyToPlace({
  target,
}: {
  /** Un objeto nuevo en cada toque (aunque sea el mismo lugar) vuelve a volar. */
  target: { latitude: number; longitude: number } | null;
}) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map || !target) return;
    map.flyTo({
      center: [target.longitude, target.latitude],
      zoom: Math.max(map.getZoom(), 13),
      duration: 1400,
    });
  }, [map, target]);
  return null;
}

/**
 * Vista por defecto de /explorar (pedido del usuario: "debería tener siempre
 * por defecto la vista del mapa, un mapa asociado a lo que ofrece el sector").
 * Mapa con sectores por comuna (`SectorMarkers`) y pines animados por tema,
 * más una tira de tarjetas debajo con el resaltado cruzado de siempre: tocar
 * una tarjeta vuela a su pin; tocar un pin centra su tarjeta.
 */
export function ExploreMap({
  markers,
  places,
  sectors,
  sectorMaxZoom,
}: {
  markers: MapMarkerData[];
  places: PlaceCard[];
  sectors: MapSector[];
  /** Con valor, el mapa arranca por sectores hasta ese zoom. */
  sectorMaxZoom?: number;
}) {
  const t = useTranslations("explore");
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);
  const [target, setTarget] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());

  // De la costa a la cordillera, igual que se lee el mapa.
  const strip = [...places].sort((a, b) => a.longitude - b.longitude);
  const themesPresent = THEME_ORDER.filter((theme) =>
    places.some(
      (place) => getPlaceTheme(place.categorySlug, place.icon) === theme,
    ),
  );

  function centerCard(slug: string) {
    const container = stripRef.current;
    const card = cardRefs.current.get(slug);
    if (!container || !card) return;
    container.scrollTo({
      left: card.offsetLeft - (container.clientWidth - card.clientWidth) / 2,
      behavior: "smooth",
    });
  }

  function focusPlace(place: PlaceCard) {
    // La tira queda bajo el mapa: si el mapa ya se fue hacia arriba con el
    // scroll, se vuelve a mostrar para que se vea el vuelo al lugar.
    if (mapRef.current && mapRef.current.getBoundingClientRect().top < 0) {
      mapRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setHighlightedSlug(place.slug);
    setTarget({
      latitude: place.latitude,
      longitude: place.longitude,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={mapRef} className="scroll-mt-16">
        <MapView
          className="glow-edge h-[55vh] min-h-[380px] w-full rounded-2xl border border-white/10"
          markers={markers}
          highlightedSlug={highlightedSlug}
          onMarkerClick={(slug) => {
            setHighlightedSlug(slug);
            centerCard(slug);
          }}
          markersMinZoom={sectorMaxZoom}
        >
          {sectorMaxZoom !== undefined && (
            <SectorMarkers
              sectors={sectors}
              maxZoom={sectorMaxZoom}
              onSelect={(sector) => {
                const first = strip.find(
                  (place) => place.communeName === sector.name,
                );
                if (first) centerCard(first.slug);
              }}
            />
          )}
          <FlyToPlace target={target} />
        </MapView>
      </div>

      {themesPresent.length > 0 && (
        <ul
          aria-label={t("themesLegend")}
          className="text-foreground/70 flex flex-wrap gap-x-4 gap-y-2 text-xs"
        >
          {themesPresent.map((theme, index) => (
            <li key={theme} className="flex items-center gap-2">
              <span
                className="relative flex h-5 w-5 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: THEME_STYLE[theme].color }}
              >
                <ThemeAura theme={theme} size={24} delayMs={index * 300} />
                <CategoryIcon
                  icon={THEME_STYLE[theme].icon}
                  className="relative h-3 w-3"
                />
              </span>
              {t(`themes.${theme}`)}
            </li>
          ))}
        </ul>
      )}

      {strip.length > 0 && (
        <div
          ref={stripRef}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2"
        >
          {strip.map((place) => {
            const active = highlightedSlug === place.slug;
            return (
              <article
                key={place.slug}
                ref={(node) => {
                  if (node) cardRefs.current.set(place.slug, node);
                  else cardRefs.current.delete(place.slug);
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse")
                    setHighlightedSlug(place.slug);
                }}
                className={`surface-glass w-52 shrink-0 snap-center overflow-hidden rounded-2xl border transition-all duration-200 ${
                  active
                    ? "border-accent shadow-[0_0_20px_2px_var(--accent-soft)]"
                    : "border-accent-soft"
                }`}
              >
                <button
                  type="button"
                  onClick={() => focusPlace(place)}
                  aria-label={t("showOnMap", { name: place.name })}
                  className={`relative flex h-24 w-full items-center justify-center bg-gradient-to-br text-white ${getCategoryGradient(place.categorySlug)}`}
                >
                  <PhotoOrIcon
                    photoUrl={place.photoUrl}
                    alt=""
                    categorySlug={place.categorySlug}
                    icon={place.icon}
                    iconClassName="h-8 w-8 opacity-80"
                    sizes="208px"
                  />
                </button>
                <Link
                  href={{
                    pathname: "/lugares/[slug]",
                    params: { slug: place.slug },
                  }}
                  className="flex flex-col gap-0.5 px-3 py-2"
                >
                  <span className="text-foreground line-clamp-1 text-sm font-medium">
                    {place.name} →
                  </span>
                  <span className="text-foreground/55 line-clamp-1 text-xs">
                    {place.localityName ?? place.communeName} ·{" "}
                    {place.categoryName}
                  </span>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
