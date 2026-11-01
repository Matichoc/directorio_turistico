import { describe, expect, it } from "vitest";
import {
  formatSharedStops,
  MAX_SHARED_STOPS,
  parseSharedStops,
} from "@/lib/trip/share-link";

describe("shared trip link", () => {
  it("round-trips the stops in order", () => {
    const stops = ["pedegua", "escalera-del-diablo", "petorca-plaza"];
    expect(parseSharedStops(formatSharedStops(stops))).toEqual(stops);
  });

  it("drops junk, duplicates and anything that isn't a slug", () => {
    expect(
      parseSharedStops(
        "pedegua,,PEDEGUA, petorca-plaza ,<script>,../admin,a--b,-x",
      ),
    ).toEqual(["pedegua", "petorca-plaza"]);
  });

  it("accepts a repeated query param and an empty one", () => {
    expect(parseSharedStops(["pedegua", "petorca-plaza"])).toEqual([
      "pedegua",
      "petorca-plaza",
    ]);
    expect(parseSharedStops(undefined)).toEqual([]);
  });

  it("caps the number of stops", () => {
    const many = Array.from({ length: 40 }, (_, i) => `lugar-${i}`).join(",");
    expect(parseSharedStops(many)).toHaveLength(MAX_SHARED_STOPS);
  });
});
