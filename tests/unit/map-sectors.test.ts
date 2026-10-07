import { describe, expect, it } from "vitest";
import { buildMapSectors } from "@/lib/ui/map-sectors";
import { getPlaceTheme } from "@/lib/ui/category-gradient";
import { getSceneForTheme } from "@/lib/ui/scene-backgrounds";
import type { Commune, Locality, PlaceCard } from "@/types/domain";

const communes: Commune[] = [
  { id: "c1", slug: "la-ligua", name: "La Ligua" },
  { id: "c2", slug: "papudo", name: "Papudo" },
  { id: "c3", slug: "zapallar", name: "Zapallar" },
];

function locality(
  slug: string,
  name: string,
  communeName: string,
  coords: [number, number] | null,
): Locality {
  return {
    id: slug,
    slug,
    name,
    summary: null,
    summarySourceUrl: null,
    summarySourceLabel: null,
    communeId: communeName,
    communeName,
    latitude: coords?.[0] ?? null,
    longitude: coords?.[1] ?? null,
  };
}

function place(
  id: string,
  communeName: string,
  categorySlug: string,
  icon: string | null,
  coords: [number, number],
): PlaceCard {
  return {
    id,
    slug: id,
    name: id,
    shortDescription: null,
    communeName,
    localityName: null,
    localitySlug: null,
    categoryName: categorySlug,
    categorySlug,
    icon,
    latitude: coords[0],
    longitude: coords[1],
    verificationStatus: "pending",
    isFeatured: false,
    photoUrl: null,
    photoCount: 0,
    tags: [],
  };
}

const localities = [
  locality("la-ligua", "La Ligua", "La Ligua", [-32.45, -71.23]),
  locality("valle-hermoso", "Valle Hermoso", "La Ligua", [-32.42, -71.2]),
  locality("papudo", "Papudo", "Papudo", [-32.5, -71.44]),
  locality("zapallar", "Zapallar", "Zapallar", null),
];

const places = [
  place("dulces", "La Ligua", "gastronomia", "dulce", [-32.451, -71.231]),
  place("museo", "La Ligua", "cultura", null, [-32.46, -71.25]),
  place("tejidos", "La Ligua", "cultura", "tejido", [-32.44, -71.22]),
  place("playa", "Papudo", "playa", null, [-32.51, -71.45]),
];

describe("getPlaceTheme", () => {
  it("uses the real place icon before the category", () => {
    expect(getPlaceTheme("gastronomia", "dulce")).toBe("dulces");
    expect(getPlaceTheme("cultura", "diablo")).toBe("diablo");
    expect(getPlaceTheme("naturaleza", "surf")).toBe("playa");
    expect(getPlaceTheme("gastronomia", null)).toBe("sabores");
    expect(getPlaceTheme("playa", null)).toBe("playa");
  });

  it("gives each theme its own scene", () => {
    expect(getSceneForTheme("playa")).toBe("playa");
    expect(getSceneForTheme("dulces")).toBe("dulces");
    expect(getSceneForTheme("diablo")).toBe("tunel");
    expect(getSceneForTheme(null)).toBe("atardecer");
  });
});

describe("buildMapSectors", () => {
  it("ranks what each commune really offers", () => {
    const sectors = buildMapSectors(communes, localities, places);
    const laLigua = sectors.find((s) => s.communeSlug === "la-ligua");
    expect(laLigua).toMatchObject({
      latitude: -32.45,
      longitude: -71.23,
      attractions: 3,
      villages: 2,
      themes: [
        { theme: "historia", count: 2 },
        { theme: "dulces", count: 1 },
      ],
      bounds: [
        [-71.25, -32.46],
        [-71.2, -32.42],
      ],
    });
  });

  it("never invents a point for a commune without coordinates", () => {
    const sectors = buildMapSectors(communes, localities, places);
    expect(sectors.map((s) => s.communeSlug)).toEqual(["papudo", "la-ligua"]);
  });

  it("drops empty communes when the map is filtered", () => {
    const filtered = places.filter((p) => p.categorySlug === "playa");
    expect(
      buildMapSectors(communes, localities, filtered, {
        includeEmpty: false,
      }).map((s) => s.communeSlug),
    ).toEqual(["papudo"]);
    expect(
      buildMapSectors(communes, localities, filtered).find(
        (s) => s.communeSlug === "la-ligua",
      )?.themes,
    ).toEqual([]);
  });
});
