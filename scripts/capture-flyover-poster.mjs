// Imagen fija del vuelo 3D del inicio (`public/vuelo/vuelo-poster.webp`):
// la vista general real del relieve con los pueblos, sin tarjetas ni botones.
// Es lo que se ve antes de tocar "Ver el vuelo 3D" (~90 KB en vez de ~4 MB).
//
// Uso (con el sitio corriendo, local o publicado):
//   node scripts/capture-flyover-poster.mjs https://directorio-turistico-bgl3.vercel.app
// Usa el Edge instalado (sin bajar navegadores de Playwright). Volver a
// correrlo si cambia el relieve, los pueblos o el estilo del vuelo.
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";

// `sharp` viene con Next (igual que en scripts/build-brand-png.mjs).
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = process.argv[3] ?? "public/vuelo/vuelo-poster.webp";

const browser = await chromium.launch({
  channel: "msedge",
  args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  locale: "es-CL",
});
try {
  await page.goto(`${base}/es`, { waitUntil: "networkidle", timeout: 60000 });
} catch {
  // Sigue: el mapa deja conexiones abiertas.
}
const section = page.locator("section", { hasText: "Vuela sobre el valle" });
await section.scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Ver el vuelo 3D/ }).click();
await page.waitForTimeout(9000);
await page
  .getByRole("button", { name: /Pausar/ })
  .click()
  .catch(() => {});
await page.getByRole("button", { name: /Toda la comuna/ }).click();
await page.waitForTimeout(7000);
// Deja solo el relieve y los pueblos: oculta tarjetas, botones y controles.
await page.evaluate(() => {
  const map = document.querySelector(".maplibregl-map");
  map.parentElement
    .querySelectorAll(":scope > *:not(.maplibregl-map)")
    .forEach((el) => (el.style.visibility = "hidden"));
  map
    .querySelectorAll(".maplibregl-control-container")
    .forEach((el) => (el.style.visibility = "hidden"));
});
await page.waitForTimeout(800);
const box = await page.locator(".maplibregl-map").first().boundingBox();
const png = await page.screenshot({ clip: box });
await browser.close();

await sharp(png).resize({ width: 1200 }).webp({ quality: 78 }).toFile(OUT);
console.log(`Listo: ${OUT}`);
