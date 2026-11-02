import { afterEach, describe, expect, it, vi } from "vitest";
// `@/i18n/navigation` carga next/navigation, que vitest no resuelve; acá solo
// se prueban helpers puros.
vi.mock("@/i18n/navigation", () => ({ getPathname: () => "/" }));

import { getSiteUrl, truncateDescription } from "@/lib/seo";
import { isSiteIndexable } from "@/lib/site-indexing";

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

  it("never publishes a localhost URL in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    // El valor de .env.example copiado tal cual a Vercel (bug real 2026-11-02).
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(getSiteUrl()).toBe("https://directorio-turistico-bgl3.vercel.app");

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(getSiteUrl()).toBe("https://directorio-turistico-bgl3.vercel.app");

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ejemplo.cl");
    expect(getSiteUrl()).toBe("https://ejemplo.cl");
  });
});

describe("isSiteIndexable", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("keeps the site out of search engines until launch", () => {
    vi.stubEnv("SITE_INDEXING", "");
    expect(isSiteIndexable()).toBe(false);
    vi.stubEnv("SITE_INDEXING", "true");
    expect(isSiteIndexable()).toBe(false);
  });

  it("opens it only with SITE_INDEXING=on", () => {
    vi.stubEnv("SITE_INDEXING", "on");
    expect(isSiteIndexable()).toBe(true);
  });
});
