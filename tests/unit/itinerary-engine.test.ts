import { describe, expect, it } from "vitest";
import { ItineraryEngine } from "@/lib/itinerary-engine";
import type { ItineraryPlaceInput } from "@/lib/itinerary-engine/types";

const places: ItineraryPlaceInput[] = [
  {
    id: "a",
    name: "A",
    latitude: -32.25,
    longitude: -70.93,
    visitDurationMinutes: 30,
  },
  {
    id: "b",
    name: "B",
    latitude: -32.26,
    longitude: -70.94,
    visitDurationMinutes: 30,
  },
  {
    id: "c",
    name: "C",
    latitude: -32.6,
    longitude: -71.2,
    visitDurationMinutes: 30,
  },
];

describe("ItineraryEngine.build", () => {
  it("returns an empty itinerary for no places", () => {
    const result = ItineraryEngine.build({ places: [] });
    expect(result.stops).toHaveLength(0);
    expect(result.totalDurationMinutes).toBe(0);
  });

  it("visits the closest place first, then the next closest", () => {
    const result = ItineraryEngine.build({ places });
    expect(result.stops.map((stop) => stop.placeId)).toEqual(["a", "b", "c"]);
    expect(result.skippedPlaceIds).toHaveLength(0);
  });

  it("respects maxStops", () => {
    const result = ItineraryEngine.build({ places, maxStops: 2 });
    expect(result.stops).toHaveLength(2);
    expect(result.skippedPlaceIds).toEqual(["c"]);
  });

  it("stops adding places once maxDurationMinutes would be exceeded", () => {
    const result = ItineraryEngine.build({
      places,
      maxDurationMinutes: 40,
    });
    expect(result.stops).toHaveLength(1);
    expect(result.totalDurationMinutes).toBeLessThanOrEqual(40);
  });

  it("is deterministic for the same input", () => {
    const first = ItineraryEngine.build({ places });
    const second = ItineraryEngine.build({ places });
    expect(first).toEqual(second);
  });
});
