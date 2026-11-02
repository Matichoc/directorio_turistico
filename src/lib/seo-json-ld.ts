import type { Locality, Place, Route } from "@/types/domain";

/**
 * Datos estructurados (schema.org, JSON-LD) de las fichas: con ellos Google
 * entiende que la página es un atractivo, una ruta o un pueblo, y puede
 * mostrarlos con más detalle en los resultados (auditoría H-14).
 *
 * Solo campos con dato real (DESIGN.md: nunca fabricar datos): un campo
 * vacío no se escribe. Las fotos de Google no van (se muestran por proxy y
 * no se guardan, ver `/api/place-photo`); sí las propias o de Wikimedia.
 */
export type JsonLd = Record<string, unknown>;

/** URL absoluta: las del sitio vienen como ruta (`/es/lugares/...`). */
function absolute(siteUrl: string, pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${siteUrl}${pathOrUrl}`;
}

/** Quita las claves sin valor, para no publicar campos vacíos. */
function compact(data: JsonLd): JsonLd {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0),
    ),
  );
}

function geo(latitude: number, longitude: number): JsonLd {
  return { "@type": "GeoCoordinates", latitude, longitude };
}

/** El pueblo o la comuna donde está algo, como `containedInPlace`. */
function containedIn(localityName: string | null, communeName: string): JsonLd {
  const commune: JsonLd = {
    "@type": "AdministrativeArea",
    name: `${communeName}, Chile`,
  };
  return localityName
    ? { "@type": "Place", name: localityName, containedInPlace: commune }
    : commune;
}

export function placeJsonLd(
  place: Place,
  { siteUrl, path }: { siteUrl: string; path: string },
): JsonLd {
  const images = place.photos
    .map((photo) => photo.url)
    .filter((url) => !url.startsWith("/api/place-photo"))
    .map((url) => absolute(siteUrl, url));

  return compact({
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.name,
    description: place.shortDescription ?? place.description,
    url: absolute(siteUrl, path),
    image: images,
    geo: geo(place.latitude, place.longitude),
    address: place.address
      ? {
          "@type": "PostalAddress",
          streetAddress: place.address,
          addressLocality: place.localityName ?? place.communeName,
          addressCountry: "CL",
        }
      : null,
    telephone: place.phone,
    sameAs: place.website,
    containedInPlace: containedIn(place.localityName, place.communeName),
  });
}

export function routeJsonLd(
  route: Route,
  {
    siteUrl,
    path,
    stopPath,
  }: { siteUrl: string; path: string; stopPath: (slug: string) => string },
): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: route.name,
    description: route.description,
    url: absolute(siteUrl, path),
    image: route.coverImageUrl ? absolute(siteUrl, route.coverImageUrl) : null,
    itinerary:
      route.stops.length > 0
        ? {
            "@type": "ItemList",
            numberOfItems: route.stops.length,
            itemListElement: route.stops.map((stop, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "TouristAttraction",
                name: stop.placeName,
                url: absolute(siteUrl, stopPath(stop.placeSlug)),
                geo: geo(stop.latitude, stop.longitude),
              },
            })),
          }
        : null,
  });
}

export function localityJsonLd(
  locality: Locality,
  { siteUrl, path }: { siteUrl: string; path: string },
): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "Place",
    name: locality.name,
    description: locality.summary,
    url: absolute(siteUrl, path),
    geo:
      locality.latitude !== null && locality.longitude !== null
        ? geo(locality.latitude, locality.longitude)
        : null,
    containedInPlace: containedIn(null, locality.communeName),
  });
}
