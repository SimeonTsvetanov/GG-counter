import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build served by `vite preview` under /GG-counter/.
// E2E_BASE_URL=https://simeontsvetanov.github.io/GG-counter/ runs the same tests against the live site.
const LIVE = process.env.E2E_BASE_URL;
// E2E_PORT: another preview port when a second app's tests run on this machine at the same time (default 4173).
const PORT = process.env.E2E_PORT ?? "4173";
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  // locale: a fixed browser language, so runs do not depend on the machine; the app starts in English
  // whatever it is (PLAN T-09, no browser detection — tests/e2e/i18n.spec.ts checks it with bg-BG).
  use: { baseURL: LIVE ?? `http://localhost:${PORT}/GG-counter/`, trace: "retain-on-failure", locale: "en-US" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: LIVE ? undefined : { command: `pnpm -F gg-counter-app preview --port ${PORT} --strictPort`, url: `http://localhost:${PORT}/GG-counter/`, reuseExistingServer: !process.env.CI },
});
