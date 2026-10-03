import { describe, expect, it } from "vitest";
import {
  getSceneForCategory,
  getSceneForRoute,
} from "@/lib/ui/scene-backgrounds";

describe("scene backgrounds", () => {
  it("maps each category to its own scene", () => {
    expect(getSceneForCategory("playa")).toBe("playa");
    expect(getSceneForCategory("naturaleza")).toBe("cerro");
    expect(getSceneForCategory("cultura")).toBe("pueblo");
    expect(getSceneForCategory("gastronomia")).toBe("dulces");
  });

  it("falls back to the general sunset without a known category", () => {
    expect(getSceneForCategory(undefined)).toBe("atardecer");
    expect(getSceneForCategory("")).toBe("atardecer");
    expect(getSceneForCategory("otra-cosa")).toBe("atardecer");
  });

  it("picks a route scene from its theme", () => {
    expect(getSceneForRoute("ruta-costera-papudo-zapallar")).toBe("playa");
    expect(getSceneForRoute("ruta-patrimonial-la-ligua-cabildo")).toBe(
      "pueblo",
    );
    expect(getSceneForRoute("ruta-del-diablo")).toBe("tunel");
    expect(getSceneForRoute(null)).toBe("atardecer");
  });
});
