import { test, expect } from "@playwright/test";

// El sitio elige el idioma según el navegador: sin esto, un Chrome en inglés
// iría a /en y la prueba fallaría sin que el sitio esté mal.
test.use({ locale: "es-CL" });

test("redirects to the default locale and shows the home page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "El diablo murió en Petorca",
  );
});

test("bottom navigation links to explorar", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("link", { name: "Explorar" }).click();
  await expect(page).toHaveURL(/\/es\/explorar$/);
});
