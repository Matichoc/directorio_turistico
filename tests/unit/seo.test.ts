import { afterEach, describe, expect, it, vi } from "vitest";
// `@/i18n/navigation` carga next/navigation, que vitest no resuelve; acá solo
// se prueban helpers puros.
vi.mock("@/i18n/navigation", () => ({ getPathname: () => "/" }));

import { getSiteUrl, truncateDescription } from "@/lib/seo";

describe("truncateDescription", () => {
  it("returns undefined for empty or missing text", () => {
    expect(truncateDescription(null)).toBeUndefined();
    expect(truncateDescription("   ")).toBeUndefined();
  });

  it("keeps short text and collapses whitespace", () => {
    expect(truncateDescription("Hola \n  mundo")).toBe("Hola mundo");
  });

  it("cuts long text at a word boundary with an ellipsis", () => {
    const text = "palabra ".repeat(40).trim();
    const result = truncateDescription(text, 50)!;
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toMatch(/palab…$/);
  });
});

describe("getSiteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("prefers the explicit site URL, without trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ejemplo.cl/");
    expect(getSiteUrl()).toBe("https://ejemplo.cl");
  });

  it("falls back to the Vercel URL, then localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "preview.vercel.app");
    expect(getSiteUrl()).toBe("https://preview.vercel.app");

    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
