import { defineConfig, devices } from "@playwright/test";

/**
 * `PLAYWRIGHT_BASE_URL`: probar contra un sitio ya levantado (otro puerto,
 * una vista previa de Vercel) sin compilar de nuevo.
 * `PLAYWRIGHT_CHANNEL=chrome`: usar el Chrome instalado en vez de bajar los
 * navegadores de Playwright.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    ...(channel ? { channel } : {}),
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm build && pnpm start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
