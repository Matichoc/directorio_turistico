import { test, expect } from "@playwright/test";

test("redirects to the default locale and shows the home page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Petorca en Ruta",
  );
});

test("bottom navigation links to explorar", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("link", { name: "Explorar" }).click();
  await expect(page).toHaveURL(/\/es\/explorar$/);
});
