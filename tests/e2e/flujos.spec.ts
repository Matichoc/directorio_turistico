import { test, expect, type Page } from "@playwright/test";

/**
 * Flujos principales contra el sitio armado (`pnpm build && pnpm start`, o
 * `PLAYWRIGHT_BASE_URL` apuntando a uno ya levantado). Usan los datos reales
 * de la base que tenga configurada (`.env.local`), así que buscan rutas y
 * lugares desde las propias páginas en vez de fijar slugs. Auditoría H-18.
 */

/** Junta los errores de consola de la página (para mapas y CSP). */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("las páginas públicas salen de la caché, no se arman en cada visita", async ({
  request,
}) => {
  for (const path of ["/es", "/es/rutas", "/es/leyenda", "/en/legend"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["cache-control"], path).toContain("s-maxage");
  }
});

test("la leyenda tiene sus escenas y cambia de idioma", async ({ page }) => {
  await page.goto("/es/leyenda");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "La leyenda del diablo",
  );
  await expect(page.locator("main figure img").first()).toBeVisible();

  await page.getByRole("button", { name: "English" }).first().click();
  await expect(page).toHaveURL(/\/en\/legend$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("una ruta muestra su mapa, sus paradas y datos para Google", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto("/es/rutas");
  const firstRoute = page.locator('main a[href^="/es/rutas/"]').first();
  await firstRoute.click();
  await expect(page).toHaveURL(/\/es\/rutas\/[^/]+$/);

  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  );
  expect(jsonLd["@type"]).toBe("TouristTrip");

  // El mapa base de MapLibre (su worker va en un archivo aparte desde la v6).
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(2_000);
  expect(errors.filter((text) => /worker/i.test(text))).toEqual([]);
});

test("Explorar arranca en el mapa con los pines", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/es/explorar");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(".maplibregl-marker").first()).toBeVisible();
  await page.waitForTimeout(2_000);
  expect(
    errors.filter((text) => /worker|Content Security Policy/i.test(text)),
  ).toEqual([]);
});

test("la ficha de un lugar se abre desde una ruta", async ({ page }) => {
  await page.goto("/es/rutas");
  await page.locator('main a[href^="/es/rutas/"]').first().click();
  const href = await page
    .locator('main a[href^="/es/lugares/"]')
    .first()
    .getAttribute("href");
  await page.goto(href!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "{}",
  );
  expect(jsonLd["@type"]).toBe("TouristAttraction");
});

test("una dirección que no existe da 404", async ({ request }) => {
  const response = await request.get("/es/no-existe-esta-pagina");
  expect(response.status()).toBe(404);
});

test("el panel pide ingresar", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
});
