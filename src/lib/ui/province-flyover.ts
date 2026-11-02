import type { Commune, Locality, PlaceCard } from "@/types/domain";

/**
 * Una parada del vuelo 3D, con sus cifras reales: la cabecera de una comuna
 * (sitio con varias comunas) o un pueblo (sitio acotado a una sola comuna,
 * ver `lib/site-scope.ts`).
 */
export interface FlyoverStop {
  /** Único entre las paradas: el slug del pueblo o, si no, el de la comuna. */
  id: string;
  communeSlug: string;
  /** Solo en paradas por pueblo: su ficha es el destino del botón. */
  localitySlug: string | null;
  name: string;
  latitude: number;
  longitude: number;
  /** Resumen real del pueblo (con fuente en su ficha); null si no hay. */
  summary: string | null;
  /** Pueblos de la comuna; null en una parada que ya es un pueblo. */
  villages: number | null;
  attractions: number;
}

/** Cámara de la vista general (antes de la primera parada). */
export interface FlyoverOverview {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

/** Vista de toda la provincia: desde el mar, mirando hacia la cordillera. */
export const PROVINCE_OVERVIEW: FlyoverOverview = {
  longitude: -71.12,
  latitude: -32.4,
  zoom: 9.2,
  pitch: 60,
  bearing: 72,
};

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
  overview: FlyoverOverview;
}

type LocatedLocality = Locality & { latitude: number; longitude: number };

export function isLocated(locality: Locality): locality is LocatedLocality {
  return locality.latitude !== null && locality.longitude !== null;
}

/**
 * Dónde se ubica una comuna en un mapa: su cabecera (el pueblo que lleva el
 * nombre de la comuna) o, si esa no tiene coordenada, el primer pueblo de la
 * comuna que sí la tenga. Sin ninguno, `undefined`: nunca se inventa un punto.
 */
export function findCommuneAnchor(
  commune: Commune,
  localities: Locality[],
): LocatedLocality | undefined {
  const located = localities.filter(isLocated);
  return (
    located.find(
      (locality) =>
        locality.communeName === commune.name && locality.name === commune.name,
    ) ?? located.find((locality) => locality.communeName === commune.name)
  );
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
  if (communes.length === 1) {
    return buildCommuneFlyover(communes[0], localities, places);
  }

  const located = localities.filter(isLocated);

  const stops: FlyoverStop[] = [];
  const seatSlugs = new Set<string>();

  for (const commune of communes) {
    const communeVillages = localities.filter(
      (locality) => locality.communeName === commune.name,
    );
    const anchor = findCommuneAnchor(commune, localities);
    if (!anchor) continue;

    seatSlugs.add(anchor.slug);
    stops.push({
      id: commune.slug,
      communeSlug: commune.slug,
      localitySlug: null,
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
    overview: PROVINCE_OVERVIEW,
  };
}

/**
 * Vuelo de un sitio acotado a una sola comuna: con una sola parada por comuna
 * no habría recorrido, así que la cámara va de pueblo en pueblo — los que
 * tienen al menos un atractivo, más la cabecera —, de oeste a este (en
 * Petorca: de Pedegua a Chincolco). La vista general encuadra esas paradas.
 */
function buildCommuneFlyover(
  commune: Commune,
  localities: Locality[],
  places: PlaceCard[],
): ProvinceFlyoverData {
  const communeLocalities = localities.filter(
    (locality) => locality.communeName === commune.name,
  );
  const located = communeLocalities.filter(isLocated);
  const seat = findCommuneAnchor(commune, communeLocalities);
  const attractionsOf = (slug: string) =>
    places.filter((place) => place.localitySlug === slug).length;

  const stops: FlyoverStop[] = located
    .filter(
      (locality) =>
        locality.slug === seat?.slug || attractionsOf(locality.slug) > 0,
    )
    .map((locality) => ({
      id: locality.slug,
      communeSlug: commune.slug,
      localitySlug: locality.slug,
      name: locality.name,
      latitude: locality.latitude,
      longitude: locality.longitude,
      summary: locality.summary,
      villages: null,
      attractions: attractionsOf(locality.slug),
    }))
    .sort((a, b) => a.longitude - b.longitude);

  return {
    stops,
    villages: located.map((locality) => ({
      slug: locality.slug,
      name: locality.name,
      latitude: locality.latitude,
      longitude: locality.longitude,
      isSeat: locality.slug === seat?.slug,
    })),
    overview: communeOverview(stops),
  };
}

/** Centro de las paradas, mirando al este como la vista de la provincia. */
function communeOverview(stops: FlyoverStop[]): FlyoverOverview {
  if (stops.length === 0) return PROVINCE_OVERVIEW;
  const lngs = stops.map((stop) => stop.longitude);
  const lats = stops.map((stop) => stop.latitude);
  return {
    ...PROVINCE_OVERVIEW,
    // Un poco al oeste del centro: con la cámara inclinada mirando al este,
    // así las paradas quedan en el medio de la pantalla y no al fondo.
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2 - 0.08,
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    zoom: 10.2,
  };
}
