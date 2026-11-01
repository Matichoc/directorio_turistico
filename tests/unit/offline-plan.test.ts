import { describe, expect, it } from "vitest";
import {
  boundsAround,
  fontStacksIn,
  staticAssetsIn,
  tileAt,
  tilesInBounds,
  tileUrl,
} from "@/lib/offline/plan";

// Paradas reales de "Donde el Diablo perdió el poncho" (aprox.).
const PEDEGUA = { latitude: -32.354, longitude: -71.086 };
const CHINCOLCO = { latitude: -32.2237, longitude: -70.8427 };

describe("offline plan", () => {
  it("frames every stop plus a margin", () => {
    const b = boundsAround([PEDEGUA, CHINCOLCO], 2)!;
    expect(b.west).toBeLessThan(PEDEGUA.longitude);
    expect(b.east).toBeGreaterThan(CHINCOLCO.longitude);
    expect(b.south).toBeLessThan(PEDEGUA.latitude);
    expect(b.north).toBeGreaterThan(CHINCOLCO.latitude);
    // 2 km ≈ 0,018° de latitud
    expect(CHINCOLCO.latitude - b.north).toBeCloseTo(-0.018, 2);
    expect(boundsAround([])).toBeNull();
  });

  it("finds the slippy-map tile of a point", () => {
    // Zoom 0: el mundo entero es una sola tesela.
    expect(tileAt(-70.84, -32.22, 0)).toEqual({ x: 0, y: 0 });
    // Hemisferio sur y oeste: mitad izquierda, mitad de abajo.
    expect(tileAt(-70.84, -32.22, 1)).toEqual({ x: 0, y: 1 });
  });

  it("covers the valley route with a reasonable number of tiles", () => {
    const tiles = tilesInBounds(boundsAround([PEDEGUA, CHINCOLCO])!, 10, 14);
    const at = (z: number) => tiles.filter((t) => t.z === z).length;
    expect(at(10)).toBeGreaterThanOrEqual(1);
    expect(at(14)).toBeGreaterThan(at(13));
    // Unos cientos, no miles: se puede bajar por datos móviles.
    expect(tiles.length).toBeLessThan(1000);
    expect(new Set(tiles.map((t) => `${t.z}/${t.x}/${t.y}`)).size).toBe(
      tiles.length,
    );
  });

  it("builds a tile URL from the TileJSON template", () => {
    expect(
      tileUrl("https://t.example/planet/v1/{z}/{x}/{y}.pbf", {
        z: 14,
        x: 4972,
        y: 9590,
      }),
    ).toBe("https://t.example/planet/v1/14/4972/9590.pbf");
  });

  it("lists the site's JS and CSS a page needs, once each", () => {
    const html = `<link rel="stylesheet" href="/_next/static/css/a.css"/>
      <script src="/_next/static/chunks/main.js"></script>
      <script src="/_next/static/chunks/main.js"></script>
      <img src="/fondos/cerro.webp"/>`;
    expect(staticAssetsIn(html)).toEqual([
      "/_next/static/css/a.css",
      "/_next/static/chunks/main.js",
    ]);
  });

  it("reads the font stacks a map style uses", () => {
    expect(
      fontStacksIn({
        layers: [
          { layout: { "text-font": ["Noto Sans Regular"] } },
          { layout: { "text-font": ["Noto Sans Bold"] } },
          { layout: { "text-font": ["Noto Sans Regular"] } },
          { layout: {} },
        ],
      }),
    ).toEqual(["Noto Sans Regular", "Noto Sans Bold"]);
  });
});
