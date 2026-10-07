"use client";

import { Fragment, useEffect, useState } from "react";
import { Marker, useMap } from "react-map-gl/maplibre";
import { useTranslations } from "next-intl";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ThemeAura } from "@/components/map/theme-aura";
import { THEME_STYLE } from "@/lib/ui/category-gradient";
import { SCENE_SRC, getSceneForTheme } from "@/lib/ui/scene-backgrounds";
import type { MapSector } from "@/lib/ui/map-sectors";

/** Tamaño aproximado de una burbuja, para que no se tapen entre sí. */
const BUBBLE_W = 150;
const BUBBLE_H = 56;

/**
 * Acomodo simple de etiquetas: de la comuna con más atractivos a la con
 * menos, cada burbuja va en su lugar real o, si choca con una ya puesta, se
 * corre hacia arriba o abajo (un punto de luz marca igual la cabecera real).
 * Papudo y Zapallar, o La Ligua y Cabildo, quedan casi encima en un celular.
 */
function layoutSectors(
  sectors: MapSector[],
  project: (lngLat: [number, number]) => { x: number; y: number },
): Record<string, number> {
  const placed: { x: number; y: number }[] = [];
  const offsets: Record<string, number> = {};
  const order = [...sectors].sort((a, b) => b.attractions - a.attractions);
  for (const sector of order) {
    const point = project([sector.longitude, sector.latitude]);
    const steps = [0, -1, 1, -2, 2, -3, 3].map((k) => k * (BUBBLE_H + 4));
    const dy =
      steps.find((step) =>
        placed.every(
          (other) =>
            Math.abs(other.x - point.x) >= BUBBLE_W ||
            Math.abs(other.y - (point.y + step)) >= BUBBLE_H,
        ),
      ) ?? 0;
    placed.push({ x: point.x, y: point.y + dy });
    offsets[sector.communeSlug] = dy;
  }
  return offsets;
}

/**
 * La provincia por sectores (mapa de /explorar, ver docs/DESIGN.md): con el
 * mapa alejado, una burbuja por comuna con el diablito en la escena de lo que
 * más ofrece (playa, dulces, pueblo, cerro, túnel) y sus temas animados. Al
 * tocarla, la cámara vuela a la comuna y aparecen los pines de sus lugares;
 * desde `maxZoom` las burbujas se esconden. Va dentro de `MapView` (usa
 * `useMap`).
 */
export function SectorMarkers({
  sectors,
  maxZoom,
  onSelect,
}: {
  sectors: MapSector[];
  maxZoom: number;
  onSelect?: (sector: MapSector) => void;
}) {
  const t = useTranslations("explore");
  const { current: map } = useMap();
  const [visible, setVisible] = useState(true);
  const [offsets, setOffsets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!map) return;
    const sync = () => setVisible(map.getZoom() < maxZoom);
    const layout = () =>
      setOffsets(layoutSectors(sectors, (lngLat) => map.project(lngLat)));
    sync();
    const frame = requestAnimationFrame(layout);
    map.on("zoom", sync);
    map.on("moveend", layout);
    return () => {
      cancelAnimationFrame(frame);
      map.off("zoom", sync);
      map.off("moveend", layout);
    };
  }, [map, maxZoom, sectors]);

  if (!visible) return null;

  function flyInto(sector: MapSector) {
    if (!map) return;
    // Si la comuna entera cabe con detalle, se encuadra completa; si no (un
    // celular angosto), se acerca a su cabecera, donde está casi todo.
    const camera = map.cameraForBounds(sector.bounds, { padding: 56 });
    const minZoom = maxZoom + 0.5;
    const fits = camera?.zoom !== undefined && camera.zoom >= minZoom;
    map.flyTo({
      center:
        fits && camera?.center
          ? camera.center
          : [sector.longitude, sector.latitude],
      zoom: fits ? camera.zoom : minZoom,
      duration: 1600,
    });
    onSelect?.(sector);
  }

  return sectors.map((sector, index) => {
    const lead = sector.themes[0]?.theme;
    const dy = offsets[sector.communeSlug] ?? 0;
    return (
      <Fragment key={sector.communeSlug}>
        {dy !== 0 && (
          // La burbuja se corrió para no tapar a otra: un punto de luz marca
          // dónde está de verdad la cabecera.
          <Marker
            latitude={sector.latitude}
            longitude={sector.longitude}
            anchor="center"
          >
            <span
              aria-hidden="true"
              className="block h-2.5 w-2.5 rounded-full border border-white/70 bg-[var(--neon-2)] shadow-[0_0_10px_var(--neon-2)]"
            />
          </Marker>
        )}
        <Marker
          latitude={sector.latitude}
          longitude={sector.longitude}
          anchor="center"
          offset={[0, dy]}
          style={{ zIndex: 2 }}
        >
          <button
            type="button"
            onClick={() => flyInto(sector)}
            aria-label={t("sectorZoom", { name: sector.name })}
            className="animate-stop-in flex items-center gap-2 rounded-full border border-white/15 bg-[#120c1c]/90 py-1 pr-3 pl-1 text-left shadow-[0_0_18px_rgba(0,0,0,0.6)] transition-transform duration-200 hover:scale-105 hover:border-white/40 hover:shadow-[0_0_22px_2px_var(--accent-soft)]"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <span
              aria-hidden="true"
              className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/20 bg-[#1d0f22] bg-[length:300%] [background-position:86%_72%]"
              style={{
                backgroundImage: `url(${SCENE_SRC[getSceneForTheme(lead)]})`,
              }}
            />
            <span className="flex flex-col gap-1 leading-none">
              <span className="text-foreground text-sm font-semibold whitespace-nowrap">
                {sector.name}
              </span>
              <span className="flex items-center gap-1.5">
                {sector.themes.map(({ theme }, themeIndex) => (
                  <span
                    key={theme}
                    title={t(`themes.${theme}`)}
                    className="relative flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: THEME_STYLE[theme].color }}
                  >
                    <ThemeAura
                      theme={theme}
                      size={26}
                      delayMs={index * 300 + themeIndex * 450}
                    />
                    <CategoryIcon
                      icon={THEME_STYLE[theme].icon}
                      className="relative h-3 w-3"
                    />
                  </span>
                ))}
                <span className="text-foreground/60 text-[11px] whitespace-nowrap">
                  {sector.themes.length > 0
                    ? sector.attractions
                    : t("placesCount", { count: sector.attractions })}
                </span>
              </span>
            </span>
          </button>
        </Marker>
      </Fragment>
    );
  });
}
