import { describe, expect, it } from "vitest";
import {
  authorFromAltText,
  parsePlacePhotoRef,
  pickCurrentPhotoName,
} from "@/lib/google/place-photo-ref";

const photo = (name: string, author?: string) => ({
  name,
  authorAttributions: author ? [{ displayName: author }] : [],
});

describe("parsePlacePhotoRef", () => {
  it("saca el placeId del name guardado", () => {
    expect(parsePlacePhotoRef("places/ChIJ44IAAJv3iJY/photos/AVoNo-x_1")).toBe(
      "ChIJ44IAAJv3iJY",
    );
  });

  it("rechaza lo que no tiene la forma de una foto de Places", () => {
    expect(parsePlacePhotoRef("places/abc")).toBeNull();
    expect(parsePlacePhotoRef("../places/abc/photos/x")).toBeNull();
    expect(parsePlacePhotoRef("places/a/b/photos/x")).toBeNull();
  });
});

describe("authorFromAltText", () => {
  it("lee el autor que guardó el script", () => {
    expect(authorFromAltText("Foto: Italo Figueroa (Google Maps)")).toBe(
      "Italo Figueroa",
    );
  });

  it("devuelve null sin autor o con otro formato", () => {
    expect(authorFromAltText("Foto: Google Maps")).toBeNull();
    expect(authorFromAltText(null)).toBeNull();
    expect(authorFromAltText("Wikimedia Commons")).toBeNull();
  });
});

describe("pickCurrentPhotoName", () => {
  const current = [
    photo("places/p/photos/n1", "Ana"),
    photo("places/p/photos/n2", "Italo Figueroa"),
    photo("places/p/photos/n3", "Ana"),
  ];

  it("usa la foto guardada si sigue vigente", () => {
    expect(
      pickCurrentPhotoName(current, {
        ref: "places/p/photos/n3",
        author: "Ana",
        position: 0,
      }),
    ).toBe("places/p/photos/n3");
  });

  it("con el name vencido, busca la del mismo autor", () => {
    expect(
      pickCurrentPhotoName(current, {
        ref: "places/p/photos/viejo",
        author: "Italo Figueroa",
        position: 0,
      }),
    ).toBe("places/p/photos/n2");
  });

  it("entre varias del mismo autor, prefiere la de su posición", () => {
    expect(
      pickCurrentPhotoName(current, {
        ref: "places/p/photos/viejo",
        author: "Ana",
        position: 2,
      }),
    ).toBe("places/p/photos/n3");
  });

  it("si el autor ya no está, no inventa el crédito: null", () => {
    expect(
      pickCurrentPhotoName(current, {
        ref: "places/p/photos/viejo",
        author: "Otra Persona",
        position: 1,
      }),
    ).toBeNull();
  });

  it("sin autor guardado, usa la de la misma posición", () => {
    expect(
      pickCurrentPhotoName(current, {
        ref: "places/p/photos/viejo",
        author: null,
        position: 1,
      }),
    ).toBe("places/p/photos/n2");
    expect(
      pickCurrentPhotoName(current, {
        ref: "places/p/photos/viejo",
        author: null,
        position: 9,
      }),
    ).toBeNull();
  });
});
