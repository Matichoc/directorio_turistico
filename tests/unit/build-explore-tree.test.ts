import { describe, expect, it } from "vitest";
import { buildExploreTree } from "@/lib/ui/build-explore-tree";
import type { Commune, Locality, PlaceCard } from "@/types/domain";

const communes: Commune[] = [
  { id: "c1", slug: "petorca", name: "Petorca" },
  { id: "c2", slug: "papudo", name: "Papudo" },
];

function locality(slug: string, name: string, communeName: string): Locality {
  return {
    id: slug,
    slug,
    name,
    summary: null,
    communeId: communeName,
    communeName,
    latitude: null,
    longitude: null,
  };
}

function place(
  id: string,
  communeName: string,
  localitySlug: string | null,
): PlaceCard {
  return {
    id,
    slug: id,
    name: id,
    shortDescription: null,
    communeName,
    localityName: localitySlug,
    localitySlug,
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

describe("buildExploreTree", () => {
  it("groups places under their village inside each commune", () => {
    const tree = buildExploreTree(
      communes,
      [locality("hierro-viejo", "Hierro Viejo", "Petorca")],
      [place("escalera", "Petorca", "hierro-viejo")],
    );

    expect(tree).toHaveLength(1);
    expect(tree[0].localities[0]).toMatchObject({
      slug: "hierro-viejo",
      places: [expect.objectContaining({ id: "escalera" })],
    });
  });

  it("keeps villages with no places (the catalog is also a directory)", () => {
    const tree = buildExploreTree(
      communes,
      [locality("pedernal", "Pedernal", "Petorca")],
      [],
    );

    expect(tree[0].localities).toEqual([
      { slug: "pedernal", name: "Pedernal", places: [] },
    ]);
  });

  it("puts places without a village in a trailing 'others' group per commune", () => {
    const tree = buildExploreTree(
      communes,
      [locality("pullally", "Pullally", "Papudo")],
      [place("plaza", "Papudo", null), place("laguna", "Papudo", "pullally")],
    );

    const papudo = tree.find((commune) => commune.slug === "papudo");
    expect(papudo?.localities.map((node) => node.slug)).toEqual([
      "pullally",
      null,
    ]);
    expect(papudo?.localities[1].places.map((p) => p.id)).toEqual(["plaza"]);
  });

  it("never loses a place whose village is missing from the catalog", () => {
    const tree = buildExploreTree(
      communes,
      [],
      [place("huerfano", "Petorca", "no-existe")],
    );

    expect(tree[0].localities).toEqual([
      expect.objectContaining({
        slug: null,
        places: [expect.objectContaining({ id: "huerfano" })],
      }),
    ]);
  });

  it("drops communes with nothing to show", () => {
    expect(buildExploreTree(communes, [], [])).toEqual([]);
  });
});
