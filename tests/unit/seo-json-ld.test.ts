import { describe, expect, it } from "vitest";
import { localityJsonLd, placeJsonLd, routeJsonLd } from "@/lib/seo-json-ld";
import type { Locality, Place, Route } from "@/types/domain";

const SITE = "https://ejemplo.cl";

const place: Place = {
  id: "1",
  slug: "escalera-del-diablo",
  name: "Escalera del Diablo",
  description: "Descripción larga.",
  shortDescription: "Descripción corta.",
  communeId: "c",
  communeName: "Petorca",
  localityId: "l",
  localityName: "Chincolco",
  localitySlug: "chincolco",
  categoryId: "k",
  categoryName: "Naturaleza",
  categorySlug: "naturaleza",
  icon: null,
  latitude: -32.2,
  longitude: -70.8,
  address: null,
  phone: null,
  website: null,
  photos: [
    { url: "/api/place-photo?id=x", attribution: null },
    { url: "https://upload.wikimedia.org/foto.jpg", attribution: null },
  ],
  isFeatured: false,
  publicationStatus: "published",
  verificationStatus: "verified",
  tags: [],
};

describe("placeJsonLd", () => {
  it("describe el atractivo con URL absoluta, coordenadas y pueblo", () => {
    const data = placeJsonLd(place, {
      siteUrl: SITE,
      path: "/es/lugares/escalera-del-diablo",
    });
    expect(data["@type"]).toBe("TouristAttraction");
    expect(data.url).toBe(`${SITE}/es/lugares/escalera-del-diablo`);
    expect(data.description).toBe("Descripción corta.");
    expect(data.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: -32.2,
      longitude: -70.8,
    });
    expect(data.containedInPlace).toMatchObject({
      name: "Chincolco",
      containedInPlace: { name: "Petorca, Chile" },
    });
  });

  it("no publica fotos de Google ni campos vacíos", () => {
    const data = placeJsonLd(place, { siteUrl: SITE, path: "/es/x" });
    expect(data.image).toEqual(["https://upload.wikimedia.org/foto.jpg"]);
    expect(data).not.toHaveProperty("address");
    expect(data).not.toHaveProperty("telephone");
    expect(data).not.toHaveProperty("sameAs");
  });
});

describe("routeJsonLd", () => {
  it("lista las paradas en orden", () => {
    const route = {
      slug: "r",
      name: "Ruta",
      description: null,
      estimatedDurationMinutes: null,
      coverImageUrl: "/rutas/r.webp",
      stops: [
        { placeSlug: "a", placeName: "A", latitude: 1, longitude: 2 },
        { placeSlug: "b", placeName: "B", latitude: 3, longitude: 4 },
      ],
    } as unknown as Route;
    const data = routeJsonLd(route, {
      siteUrl: SITE,
      path: "/es/rutas/r",
      stopPath: (slug) => `/es/lugares/${slug}`,
    });
    expect(data["@type"]).toBe("TouristTrip");
    expect(data.image).toBe(`${SITE}/rutas/r.webp`);
    expect(data).not.toHaveProperty("description");
    const itinerary = data.itinerary as {
      itemListElement: { position: number; item: { url: string } }[];
    };
    expect(itinerary.itemListElement.map((entry) => entry.position)).toEqual([
      1, 2,
    ]);
    expect(itinerary.itemListElement[1].item.url).toBe(`${SITE}/es/lugares/b`);
  });
});

describe("localityJsonLd", () => {
  it("omite la coordenada si el pueblo no la tiene confirmada", () => {
    const locality = {
      slug: "pedegua",
      name: "Pedegua",
      summary: null,
      communeName: "Petorca",
      latitude: null,
      longitude: null,
    } as unknown as Locality;
    const data = localityJsonLd(locality, {
      siteUrl: SITE,
      path: "/es/pueblos/pedegua",
    });
    expect(data).not.toHaveProperty("geo");
    expect(data).not.toHaveProperty("description");
    expect(data.containedInPlace).toMatchObject({ name: "Petorca, Chile" });
  });
});
