import { describe, expect, it } from "vitest";
import {
  isCommuneInScope,
  isSiteScoped,
  SITE_COMMUNE_SLUGS,
} from "@/lib/site-scope";

describe("site scope", () => {
  it("is scoped to the commune of Petorca", () => {
    expect(isSiteScoped()).toBe(true);
    expect(SITE_COMMUNE_SLUGS).toEqual(["petorca"]);
  });

  it("keeps Petorca and leaves out the rest of the province", () => {
    expect(isCommuneInScope("petorca")).toBe(true);
    for (const slug of ["la-ligua", "cabildo", "papudo", "zapallar"]) {
      expect(isCommuneInScope(slug)).toBe(false);
    }
  });

  it("leaves out a place with no known commune", () => {
    expect(isCommuneInScope(null)).toBe(false);
    expect(isCommuneInScope(undefined)).toBe(false);
  });
});
