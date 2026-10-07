import { describe, expect, it } from "vitest";
import { buildProvinceFlyover } from "@/lib/ui/province-flyover";
import type { Commune, Locality, PlaceCard } from "@/types/domain";

const communes: Commune[] = [
  { id: "c1", slug: "petorca", name: "Petorca" },
  { id: "c2", slug: "papudo", name: "Papudo" },
  { id: "c3", slug: "cabildo", name: "Cabildo" },
];

function locality(
  slug: string,
  name: string,
  communeName: string,
  coords: [number, number] | null,
  summary: string | null = null,
): Locality {
  return {
    id: slug,
    slug,
    name,
    summary,
    summarySourceUrl: null,
    summarySourceLabel: null,
    communeId: communeName,
    communeName,
    latitude: coords?.[0] ?? null,
    longitude: coords?.[1] ?? null,
  };
}

function place(id: string, communeName: string): PlaceCard {
  return {
    id,
    slug: id,
    name: id,
    shortDescription: null,
    communeName,
    localityName: null,
    localitySlug: null,
    categoryName: "Naturaleza",
    categorySlug: "naturaleza",
    icon: null,
    latitude: 0,
    longitude: 0,
    verificationStatus: "pending",
    isFeatured: false,
    photoUrl: null,
    photoCount: 0,
    tags: [],
  };
}

describe("buildProvinceFlyover", () => {
  const localities = [
    locality("chincolco", "Chincolco", "Petorca", [-32.22, -70.84]),
    locality("petorca", "Petorca", "Petorca", [-32.25, -70.92], "Cabecera."),
    locality("papudo", "Papudo", "Papudo", [-32.5, -71.44]),
    locality("cabildo", "Cabildo", "Cabildo", null),
    locality("alicahue", "Alicahue", "Cabildo", [-32.35, -70.78]),
    locality("sin-coord", "Sin coord", "Papudo", null),
  ];

  it("anchors each commune on its seat, with real counts", () => {
    const { stops } = buildProvinceFlyover(communes, localities, [
      place("a", "Petorca"),
      place("b", "Petorca"),
    ]);
    const petorca = stops.find((stop) => stop.communeSlug === "petorca");
    expect(petorca).toMatchObject({
      latitude: -32.25,
      longitude: -70.92,
      summary: "Cabecera.",
      villages: 2,
      attractions: 2,
    });
  });

  it("falls back to another located village when the seat has no coordinates", () => {
    const { stops } = buildProvinceFlyover(communes, localities, []);
    expect(stops.find((stop) => stop.communeSlug === "cabildo")).toMatchObject({
      latitude: -32.35,
      longitude: -70.78,
    });
  });

  it("orders stops from the sea to the Andes (west to east)", () => {
    const { stops } = buildProvinceFlyover(communes, localities, []);
    expect(stops.map((stop) => stop.communeSlug)).toEqual([
      "papudo",
      "petorca",
      "cabildo",
    ]);
  });

  it("never invents a point: communes and villages without coordinates are left out", () => {
    const { stops, villages } = buildProvinceFlyover(
      communes,
      [locality("cabildo", "Cabildo", "Cabildo", null)],
      [],
    );
    expect(stops).toEqual([]);
    expect(villages).toEqual([]);
  });

  it("marks seats among the drawn villages", () => {
    const { villages } = buildProvinceFlyover(communes, localities, []);
    expect(villages.find((v) => v.slug === "petorca")?.isSeat).toBe(true);
    expect(villages.find((v) => v.slug === "chincolco")?.isSeat).toBe(false);
    expect(villages.some((v) => v.slug === "sin-coord")).toBe(false);
  });
});
