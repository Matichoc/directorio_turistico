import type { Commune, Locality, PlaceCard } from "@/types/domain";
import { getPlaceTheme, type PlaceTheme } from "@/lib/ui/category-gradient";
import { findCommuneAnchor, isLocated } from "@/lib/ui/province-flyover";

/** Un tema que ofrece un sector, con cuántos lugares reales lo respaldan. */
export interface SectorTheme {
  theme: PlaceTheme;
  count: number;
}

/**
 * Un "sector" del mapa de /explorar: una comuna, ubicada en su cabecera, con
 * lo que de verdad ofrece (los temas de sus atractivos, del que más se repite
 * al que menos) y la extensión de sus lugares y pueblos para acercarse a ella.
 */
export interface MapSector {
  communeSlug: string;
  name: string;
  latitude: number;
  longitude: number;
  attractions: number;
  villages: number;
  /** Hasta `MAX_SECTOR_THEMES` temas, solo los que tienen lugares reales. */
  themes: SectorTheme[];
  /** [[oeste, sur], [este, norte]] de sus lugares y pueblos con coordenada. */
  bounds: [[number, number], [number, number]];
}

export const MAX_SECTOR_THEMES = 3;

/**
 * Un sector por comuna con cabecera ubicable (ver `findCommuneAnchor`), a
 * partir de los lugares que se están mostrando (ya filtrados): una comuna sin
 * coordenada queda fuera, y una sin atractivos solo aparece si
 * `includeEmpty` (sin filtros, el catálogo completo manda). El "diablo" es un
 * tema más: aparece solo donde hay lugares con ese ícono en la base.
 */
export function buildMapSectors(
  communes: Commune[],
  localities: Locality[],
  places: PlaceCard[],
  { includeEmpty = true }: { includeEmpty?: boolean } = {},
): MapSector[] {
  const sectors: MapSector[] = [];

  for (const commune of communes) {
    const anchor = findCommuneAnchor(commune, localities);
    if (!anchor) continue;

    const communePlaces = places.filter(
      (place) => place.communeName === commune.name,
    );
    if (communePlaces.length === 0 && !includeEmpty) continue;

    const communeVillages = localities.filter(
      (locality) => locality.communeName === commune.name,
    );

    const counts = new Map<PlaceTheme, number>();
    for (const place of communePlaces) {
      const theme = getPlaceTheme(place.categorySlug, place.icon);
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
    const themes = [...counts.entries()]
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme))
      .slice(0, MAX_SECTOR_THEMES);

    const points = [
      anchor,
      ...communePlaces,
      ...communeVillages.filter(isLocated),
    ];
    const lngs = points.map((point) => point.longitude);
    const lats = points.map((point) => point.latitude);

    sectors.push({
      communeSlug: commune.slug,
      name: commune.name,
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      attractions: communePlaces.length,
      villages: communeVillages.length,
      themes,
      bounds: [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
    });
  }

  return sectors.sort((a, b) => a.longitude - b.longitude);
}
