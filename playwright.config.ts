import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build served by `vite preview` under /GG-counter/.
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4173/GG-counter/", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: { command: "pnpm preview --port 4173 --strictPort", url: "http://localhost:4173/GG-counter/", reuseExistingServer: !process.env.CI },
});
