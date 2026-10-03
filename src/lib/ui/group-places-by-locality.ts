import type { Locale, PlaceCard } from "@/types/domain";

export interface PlaceLocalityGroup {
  slug: string | null;
  name: string | null;
  places: PlaceCard[];
}

/**
 * Agrupa lugares por pueblo (`localitySlug`) — ver docs/DESIGN.md, sección
 * "Explorar: agrupado por pueblo". Los lugares sin pueblo asignado quedan
 * en un grupo aparte (`slug`/`name` null), siempre último, nunca
 * mezclado a ojo entre los grupos con pueblo real.
 */
export function groupPlacesByLocality(
  places: PlaceCard[],
  locale: Locale,
): PlaceLocalityGroup[] {
  const groups = new Map<string, PlaceLocalityGroup>();
  const ungrouped: PlaceCard[] = [];

  for (const place of places) {
    if (!place.localitySlug || !place.localityName) {
      ungrouped.push(place);
      continue;
    }
    const existing = groups.get(place.localitySlug);
    if (existing) {
      existing.places.push(place);
    } else {
      groups.set(place.localitySlug, {
        slug: place.localitySlug,
        name: place.localityName,
        places: [place],
      });
    }
  }

  const sortedGroups = Array.from(groups.values()).sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", locale),
  );

  return ungrouped.length > 0
    ? [...sortedGroups, { slug: null, name: null, places: ungrouped }]
    : sortedGroups;
}
