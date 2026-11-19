import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build served by `vite preview` under /GG-counter/.
// E2E_BASE_URL=https://simeontsvetanov.github.io/GG-counter/ runs the same tests against the live site.
const LIVE = process.env.E2E_BASE_URL;
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: LIVE ?? "http://localhost:4173/GG-counter/", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: LIVE ? undefined : { command: "pnpm -F gg-counter-app preview --port 4173 --strictPort", url: "http://localhost:4173/GG-counter/", reuseExistingServer: !process.env.CI },
});
