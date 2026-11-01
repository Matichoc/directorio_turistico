import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  announceStage,
  guide,
  instructionFor,
  suggestedMode,
} from "@/lib/navigation/guidance";
import { parseOsrmRoute, RoutingError } from "@/lib/navigation/osrm";
import { formatMeters, polylineLength } from "@/lib/navigation/geo";
import type { RouteStep, StreetRoute } from "@/lib/navigation/street-route";
import type { LngLat } from "@/lib/navigation/geo";

// Un tramo real en Petorca (respuesta de OSRM a pie, recortada): sale por la
// Costanera, dobla a la izquierda por Serrano y a la derecha por Manuel Montt.
const COSTANERA: LngLat = [-70.932934, -32.25418];
const SERRANO: LngLat = [-70.931795, -32.253856];
const MANUEL_MONTT: LngLat = [-70.932218, -32.252573];
const END: LngLat = [-70.931273, -32.252231];

function step(
  type: string,
  modifier: string | null,
  name: string,
  location: LngLat,
  distance: number,
) {
  return {
    name,
    distance,
    maneuver: {
      type,
      ...(modifier ? { modifier } : {}),
      location,
    },
  };
}

const osrm = {
  code: "Ok",
  routes: [
    {
      distance: 0,
      duration: 300,
      geometry: { coordinates: [COSTANERA, SERRANO, MANUEL_MONTT, END] },
      legs: [
        {
          steps: [
            step("depart", "left", "Avenida Costanera del Río", COSTANERA, 113),
            step("turn", "left", "Serrano", SERRANO, 148),
            step("turn", "right", "Manuel Montt", MANUEL_MONTT, 97),
            step("arrive", "left", "Manuel Montt", END, 0),
          ],
        },
      ],
    },
  ],
};
osrm.routes[0].distance = polylineLength(osrm.routes[0].geometry.coordinates);

function route(mode: "walk" | "car" = "walk"): StreetRoute {
  return parseOsrmRoute(osrm, mode);
}

describe("parseOsrmRoute", () => {
  it("keeps every turn with the meters at which it happens", () => {
    const { steps } = route();
    expect(
      steps.map((s) => [s.type, s.modifier, s.street, s.atMeters]),
    ).toEqual([
      ["depart", "left", "Avenida Costanera del Río", 0],
      ["turn", "left", "Serrano", 113],
      ["turn", "right", "Manuel Montt", 261],
      ["arrive", "left", "Manuel Montt", 358],
    ]);
  });

  it("tells apart no route from a failing service", () => {
    expect(() => parseOsrmRoute({ code: "NoRoute" }, "walk")).toThrow(
      RoutingError,
    );
    try {
      parseOsrmRoute(null, "walk");
    } catch (error) {
      expect((error as RoutingError).kind).toBe("upstream");
    }
  });
});

describe("instructionFor", () => {
  const base: RouteStep = {
    type: "turn",
    modifier: "right",
    street: "Serrano",
    location: SERRANO,
    atMeters: 0,
    exit: null,
  };

  it("maps OSRM maneuvers to simple actions", () => {
    expect(instructionFor(base).action).toBe("right");
    expect(instructionFor({ ...base, modifier: "slight left" }).action).toBe(
      "slightLeft",
    );
    expect(
      instructionFor({ ...base, type: "fork", modifier: "slight right" }),
    ).toMatchObject({ action: "keepRight" });
    expect(
      instructionFor({ ...base, type: "roundabout", exit: 2 }),
    ).toMatchObject({ action: "roundabout", exit: 2 });
    expect(instructionFor({ ...base, type: "arrive" }).action).toBe("arrive");
    expect(
      instructionFor({ ...base, type: "new name", modifier: "straight" })
        .action,
    ).toBe("straight");
  });
});

describe("guide", () => {
  it("at the start, the next thing is the turn onto Serrano (not the destination)", () => {
    const g = guide(
      { latitude: COSTANERA[1], longitude: COSTANERA[0] },
      route(),
    );
    expect(g?.next?.instruction).toMatchObject({
      action: "left",
      street: "Serrano",
    });
    expect(g?.next?.meters).toBeCloseTo(113, -1);
    expect(g?.offRoute).toBe(false);
    expect(g?.arrived).toBe(false);
  });

  it("after the first turn, announces the right onto Manuel Montt", () => {
    // Un poco pasado el giro, ya sobre Serrano.
    const onSerrano = { latitude: -32.2535, longitude: -70.93191 };
    const g = guide(onSerrano, route());
    expect(g?.next?.instruction).toMatchObject({
      action: "right",
      street: "Manuel Montt",
    });
  });

  it("aims the camera arrow along the street, ahead of the person", () => {
    const start = { latitude: COSTANERA[1], longitude: COSTANERA[0] };
    const g = guide(start, route());
    // El punto de mira está sobre la Costanera, hacia Serrano (al este).
    expect(g!.aim.longitude).toBeGreaterThan(start.longitude);
  });

  it("detects leaving the route", () => {
    const farAway = { latitude: -32.249, longitude: -70.936 };
    expect(guide(farAway, route())?.offRoute).toBe(true);
  });

  it("detects arriving", () => {
    const g = guide({ latitude: END[1], longitude: END[0] }, route());
    expect(g?.arrived).toBe(true);
    expect(g?.offRoute).toBe(false);
  });
});

describe("announcements and modes", () => {
  it("warns before a turn and again right at it", () => {
    expect(announceStage(200, "walk")).toBe("far");
    expect(announceStage(60, "walk")).toBe("prepare");
    expect(announceStage(10, "walk")).toBe("now");
    expect(announceStage(300, "car")).toBe("prepare");
  });

  it("suggests walking for short distances and the car for long ones", () => {
    expect(suggestedMode(800)).toBe("walk");
    expect(suggestedMode(12_000)).toBe("car");
  });

  it("formats distances for reading and speaking", () => {
    expect(formatMeters(83, "es")).toBe("85 m");
    expect(formatMeters(1250, "es")).toBe("1,3 km");
  });
});
