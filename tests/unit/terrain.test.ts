import { describe, expect, it } from "vitest";
import { terrainTilesAround, tileForPoint } from "@/lib/maps/terrain";

describe("tileForPoint", () => {
  it("matches the tile of a known point (La Ligua, zoom 11)", () => {
    // Misma tesela que genera scripts/build-terrain-tiles.py para La Ligua.
    expect(tileForPoint(-32.4499, -71.2321, 11)).toEqual({ x: 618, y: 1219 });
  });
});

describe("terrainTilesAround", () => {
  it("returns the 3x3 block around each point, without duplicates", () => {
    const near = { latitude: -32.4499, longitude: -71.2321 };
    const urls = terrainTilesAround([near, near], 11, "https://x.cl");
    expect(urls).toHaveLength(9);
    expect(urls).toContain("https://x.cl/terrain/11/618/1219.webp");
    expect(urls).toContain("https://x.cl/terrain/11/617/1218.webp");
  });
});
