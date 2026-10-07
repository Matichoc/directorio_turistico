import type { Commune, Locality, PlaceCard } from "@/types/domain";

/** Una parada del vuelo 3D: la cabecera de una comuna, con sus cifras reales. */
export interface FlyoverStop {
  communeSlug: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Resumen real del pueblo cabecera (con fuente en su ficha); null si no hay. */
  summary: string | null;
  villages: number;
  attractions: number;
}

/** Un pueblo con coordenada, dibujado como punto de luz sobre el relieve. */
export interface FlyoverVillage {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  isSeat: boolean;
}

export interface ProvinceFlyoverData {
  stops: FlyoverStop[];
  villages: FlyoverVillage[];
}

/**
 * Arma los datos del vuelo 3D del home (ver docs/DESIGN.md, "Vuelo 3D por la
 * provincia") a partir del catálogo real: una parada por comuna, ubicada en
 * su cabecera (el pueblo que lleva el nombre de la comuna) o, si esa no tiene
 * coordenada, en el primer pueblo de la comuna que sí la tenga. Una comuna sin
 * ningún pueblo con coordenada queda fuera: nunca se inventa un punto.
 *
 * Las paradas van de oeste a este (del mar a la cordillera), que es el orden
 * en que la cámara recorre la provincia.
 */
export function buildProvinceFlyover(
  communes: Commune[],
  localities: Locality[],
  places: PlaceCard[],
): ProvinceFlyoverData {
  const located = localities.filter(
    (
      locality,
    ): locality is Locality & { latitude: number; longitude: number } =>
      locality.latitude !== null && locality.longitude !== null,
  );

  const stops: FlyoverStop[] = [];
  const seatSlugs = new Set<string>();

  for (const commune of communes) {
    const communeVillages = localities.filter(
      (locality) => locality.communeName === commune.name,
    );
    const anchor =
      located.find(
        (locality) =>
          locality.communeName === commune.name &&
          locality.name === commune.name,
      ) ?? located.find((locality) => locality.communeName === commune.name);
    if (!anchor) continue;

    seatSlugs.add(anchor.slug);
    stops.push({
      communeSlug: commune.slug,
      name: commune.name,
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      summary: anchor.summary,
      villages: communeVillages.length,
      attractions: places.filter((place) => place.communeName === commune.name)
        .length,
    });
  }

  stops.sort((a, b) => a.longitude - b.longitude);

  return {
    stops,
    villages: located.map((locality) => ({
      slug: locality.slug,
      name: locality.name,
      latitude: locality.latitude,
      longitude: locality.longitude,
      isSeat: seatSlugs.has(locality.slug),
    })),
  };
}
