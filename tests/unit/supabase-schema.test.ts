import { afterEach, describe, expect, it, vi } from "vitest";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  SHARED_SUPABASE_PROJECT_REF,
  getSupabaseSchema,
  resolveSupabaseSchema,
  supabaseDbOptions,
} from "@/lib/supabase/env";

const SHARED_URL = `https://${SHARED_SUPABASE_PROJECT_REF}.supabase.co`;
const OWN_URL = "https://otroproyecto.supabase.co";

describe("resolveSupabaseSchema", () => {
  it("uses legacy by default in the project shared with Papudo", () => {
    expect(resolveSupabaseSchema(SHARED_URL, undefined)).toBe("legacy");
    expect(resolveSupabaseSchema(SHARED_URL, "")).toBe("legacy");
    expect(resolveSupabaseSchema(SHARED_URL, "legacy")).toBe("legacy");
  });

  it("refuses public in the shared project (those tables are Papudo's)", () => {
    expect(() => resolveSupabaseSchema(SHARED_URL, "public")).toThrow(/Papudo/);
  });

  it("uses public in any other project unless told otherwise", () => {
    expect(resolveSupabaseSchema(OWN_URL, undefined)).toBe("public");
    expect(resolveSupabaseSchema(undefined, undefined)).toBe("public");
    expect(resolveSupabaseSchema(OWN_URL, "public")).toBe("public");
    expect(resolveSupabaseSchema(OWN_URL, "diablo")).toBe("diablo");
  });
});

describe("getSupabaseSchema", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads the project URL and the override from the environment", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SHARED_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SCHEMA", "");
    expect(getSupabaseSchema()).toBe("legacy");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", OWN_URL);
    expect(getSupabaseSchema()).toBe("public");
  });
});

describe("requests carry the legacy schema", () => {
  afterEach(() => vi.unstubAllEnvs());

  function spyFetch() {
    const calls: { url: string; method: string; headers: Headers }[] = [];
    const fetchSpy = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({
          url: String(input),
          method: init?.method ?? "GET",
          headers: new Headers(init?.headers),
        });
        return new Response("[]", {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    );
    return { calls, fetchSpy };
  }

  /** Lo mínimo que se usa de un cliente, sin los tipos de `Database`. */
  interface LooseClient {
    from(table: string): {
      select(columns: string): PromiseLike<unknown>;
      insert(values: object): PromiseLike<unknown>;
    };
    rpc(fn: string, args?: object): PromiseLike<unknown>;
  }

  async function exercise(client: LooseClient) {
    await client.from("places").select("id");
    await client.from("places").insert({ slug: "x" });
    await client.rpc("analytics_totals", { p_days: 30 });
  }

  it("supabase-js client (scripts, admin): read, write and function calls", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SHARED_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SCHEMA", "");
    const { calls, fetchSpy } = spyFetch();
    const client = createClient(SHARED_URL, "k", {
      ...supabaseDbOptions(),
      global: { fetch: fetchSpy },
    });
    await exercise(client as unknown as LooseClient);
    expect(calls).toHaveLength(3);
    expect(calls[0].headers.get("accept-profile")).toBe("legacy");
    expect(calls[1].headers.get("content-profile")).toBe("legacy");
    expect(calls[2].headers.get("content-profile")).toBe("legacy");
    expect(
      calls.every((c) => !c.headers.get("accept-profile")?.includes("public")),
    ).toBe(true);
  });

  it("server client (@supabase/ssr, the one the site uses)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SHARED_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SCHEMA", "");
    const { calls, fetchSpy } = spyFetch();
    const client = createServerClient(SHARED_URL, "k", {
      ...supabaseDbOptions(),
      global: { fetch: fetchSpy },
      cookies: { getAll: () => [], setAll: () => {} },
    });
    await exercise(client as unknown as LooseClient);
    expect(calls[0].headers.get("accept-profile")).toBe("legacy");
    expect(calls[1].headers.get("content-profile")).toBe("legacy");
    expect(calls[2].headers.get("content-profile")).toBe("legacy");
  });

  it("another project keeps using public (no profile override needed)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", OWN_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SCHEMA", "");
    const { calls, fetchSpy } = spyFetch();
    const client = createClient(OWN_URL, "k", {
      ...supabaseDbOptions(),
      global: { fetch: fetchSpy },
    });
    await exercise(client as unknown as LooseClient);
    expect(calls[0].headers.get("accept-profile")).toBe("public");
  });
});
