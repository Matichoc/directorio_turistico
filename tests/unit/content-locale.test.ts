import { describe, expect, it } from "vitest";
import { contentLocales, pickTranslation } from "@/i18n/content";

const rows = [
  { locale: "es", name: "Escalera del Diablo" },
  { locale: "en", name: "The Devil's Staircase" },
];

describe("contentLocales", () => {
  it("el portugués busca también el español", () => {
    expect(contentLocales("pt")).toEqual(["pt", "es"]);
  });

  it("español e inglés siguen pidiendo solo lo suyo", () => {
    expect(contentLocales("es")).toEqual(["es"]);
    expect(contentLocales("en")).toEqual(["en"]);
  });
});

describe("pickTranslation", () => {
  it("usa la traducción del idioma pedido", () => {
    const withPt = [...rows, { locale: "pt", name: "Escada do Diabo" }];
    expect(pickTranslation(withPt, "pt")?.name).toBe("Escada do Diabo");
    expect(pickTranslation(withPt, "en")?.name).toBe("The Devil's Staircase");
  });

  it("sin portugués, muestra el español", () => {
    expect(pickTranslation(rows, "pt")?.name).toBe("Escalera del Diablo");
  });

  it("sin la traducción ni respaldo, nada", () => {
    expect(pickTranslation([rows[0]], "en")).toBeUndefined();
    expect(pickTranslation(undefined, "es")).toBeUndefined();
  });
});
