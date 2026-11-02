import { describe, expect, it } from "vitest";
import {
  getArtPosition,
  getSceneForCategory,
  getSceneForRoute,
  SCENE_POSITION,
} from "@/lib/ui/scene-backgrounds";

describe("scene backgrounds", () => {
  it("maps each category to its own scene", () => {
    expect(getSceneForCategory("playa")).toBe("playa");
    expect(getSceneForCategory("naturaleza")).toBe("cerro");
    expect(getSceneForCategory("cultura")).toBe("pueblo");
    // Gastronomía ya no usa la escena de dulces (La Ligua, diablo viejo).
    expect(getSceneForCategory("gastronomia")).toBe("pueblo");
    expect(getSceneForCategory("alojamiento")).toBe("atardecer");
    expect(getSceneForCategory("recreacion")).toBe("cerro");
  });

  it("falls back to the valley at night without a known category", () => {
    expect(getSceneForCategory(undefined)).toBe("cerro");
    expect(getSceneForCategory("")).toBe("cerro");
    expect(getSceneForCategory("otra-cosa")).toBe("cerro");
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

describe("art framing", () => {
  it("keeps the devil's hat in view for every scene", () => {
    for (const scene of ["atardecer", "cerro", "pueblo", "tunel"] as const) {
      expect(SCENE_POSITION[scene]).toMatch(/^\d+% 0%$/);
    }
  });

  it("frames route covers and legend scenes, even as full URLs", () => {
    expect(getArtPosition("/leyendas/escalera.webp")).toBe("66% 0%");
    expect(
      getArtPosition(
        "https://directorio-turistico-bgl3.vercel.app/rutas/ruta-ferroviaria-pedegua-las-palmas.webp",
      ),
    ).toBe("51% 0%");
  });

  it("leaves real photos to the component's own framing", () => {
    expect(getArtPosition("/api/place-photo?ref=abc&w=800")).toBeUndefined();
    expect(getArtPosition(null)).toBeUndefined();
  });
});
