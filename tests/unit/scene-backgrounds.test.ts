import { describe, expect, it } from "vitest";
import {
  getArtPosition,
  getPostalArt,
  getSceneForCategory,
  getSceneForRoute,
  isAiArt,
  SCENE_POSITION,
  SCENE_SRC,
} from "@/lib/ui/scene-backgrounds";

describe("scene backgrounds", () => {
  it("maps each category to its own scene", () => {
    expect(getSceneForCategory("playa")).toBe("playa");
    expect(getSceneForCategory("naturaleza")).toBe("cerro");
    expect(getSceneForCategory("cultura")).toBe("pueblo");
    // Gastronomía tiene su cocina (2026-11-03); antes repetía el pueblo.
    expect(getSceneForCategory("gastronomia")).toBe("cocina");
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
    for (const scene of [
      "atardecer",
      "cerro",
      "pueblo",
      "tunel",
      "cocina",
    ] as const) {
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

describe("AI art", () => {
  it("marks every devil scene, route cover and legend scene as AI", () => {
    for (const src of Object.values(SCENE_SRC)) {
      expect(isAiArt(src)).toBe(true);
    }
    expect(isAiArt("/leyendas/diablo-buscando.webp")).toBe(true);
    expect(
      isAiArt(
        "https://directorio-turistico-bgl3.vercel.app/rutas/ruta-ferroviaria-pedegua-las-palmas.webp",
      ),
    ).toBe(true);
  });

  it("never marks a real photo", () => {
    expect(isAiArt("/api/place-photo?ref=abc&w=800")).toBe(false);
    expect(
      isAiArt(
        "https://commons.wikimedia.org/wiki/Special:FilePath/Petorca.jpg",
      ),
    ).toBe(false);
    expect(isAiArt(null)).toBe(false);
  });
});

describe("postal art", () => {
  it("uses the square art only on the lodging and leisure postcards", () => {
    expect(getPostalArt("alojamiento").src).toBe("/fondos/descanso.webp");
    expect(getPostalArt("recreacion").src).toBe("/fondos/plaza.webp");
    // Las cabeceras anchas de esas categorías siguen con su escena.
    expect(getSceneForCategory("alojamiento")).toBe("atardecer");
    expect(getSceneForCategory("recreacion")).toBe("cerro");
  });

  it("falls back to the category scene, framed, for the rest", () => {
    expect(getPostalArt("gastronomia")).toEqual({
      src: "/fondos/cocina.webp",
      position: "65% 0%",
    });
    expect(isAiArt(getPostalArt("alojamiento").src)).toBe(true);
  });
});
