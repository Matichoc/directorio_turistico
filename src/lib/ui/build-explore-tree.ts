import type { Commune, Locality, PlaceCard } from "@/types/domain";

/** Un pueblo (o el grupo "otros", `slug` null) con sus atractivos. */
export interface ExploreLocalityNode {
  slug: string | null;
  name: string | null;
  /** Resumen del pueblo, si tiene uno con fuente real (null en "otros"). */
  summary: string | null;
  /** Null mientras el pueblo no tenga coordenada confirmada (y en "otros"). */
  latitude: number | null;
  longitude: number | null;
  places: PlaceCard[];
}

export interface ExploreCommuneNode {
  slug: string;
  name: string;
  localities: ExploreLocalityNode[];
}

/**
 * Arma el árbol comuna → pueblo → atractivos de `/explorar` (ver
 * docs/DESIGN.md, "Explorar: comuna → pueblo"). El catálogo completo de
 * pueblos manda: un pueblo sin atractivos igual aparece (vacío), porque la
 * pantalla es también el directorio de pueblos. Los filtros ya vienen
 * aplicados a `places` y solo achican lo que hay dentro de cada pueblo.
 *
 * Los lugares de una comuna sin pueblo (o cuyo pueblo no está en el
 * catálogo) van a un grupo "otros" (`slug` null) al final de esa comuna,
 * nunca mezclados a ojo con los pueblos reales ni perdidos.
 */
export function buildExploreTree(
  communes: Commune[],
  localities: Locality[],
  places: PlaceCard[],
): ExploreCommuneNode[] {
  return communes
    .map((commune) => {
      const communePlaces = places.filter(
        (place) => place.communeName === commune.name,
      );
      const placed = new Set<string>();

      // La cabecera comunal lleva el nombre de su comuna (Cabildo, La
      // Ligua, Petorca…) y va primero; el resto sigue el orden recibido
      // (alfabético) — `sort` es estable.
      const villages = localities
        .filter((locality) => locality.communeName === commune.name)
        .sort(
          (a, b) =>
            Number(b.name === commune.name) - Number(a.name === commune.name),
        )
        .map((locality) => {
          const villagePlaces = communePlaces.filter(
            (place) => place.localitySlug === locality.slug,
          );
          for (const place of villagePlaces) placed.add(place.id);
          return {
            slug: locality.slug,
            name: locality.name,
            summary: locality.summary,
            latitude: locality.latitude,
            longitude: locality.longitude,
            places: villagePlaces,
          };
        });

      const others = communePlaces.filter((place) => !placed.has(place.id));

      return {
        slug: commune.slug,
        name: commune.name,
        localities:
          others.length > 0
            ? [
                ...villages,
                {
                  slug: null,
                  name: null,
                  summary: null,
                  latitude: null,
                  longitude: null,
                  places: others,
                },
              ]
            : villages,
      };
    })
    .filter((commune) => commune.localities.length > 0);
}
