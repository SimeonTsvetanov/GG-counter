// Vitest — unit and property tests of packages/core, the game screen (packages/miniapp; its mount test in
// jsdom), the app's shell and storage modules and the generator in scripts/ (engineering → testing §1,
// §3). Coverage gate: the storage modules of both and core. Playwright runs tests/e2e.
import { defineConfig } from "vitest/config";
import { l10n } from "./app.config.ts";

export default defineConfig({
  // Same constant as app/vite.config.ts: the Bulgarian texts of app.config.ts.
  define: { __APP_TEXT_BG__: JSON.stringify(l10n.bg) },
  test: {
    // Every test starts clean: spies/mocks, vi.stubGlobal and vi.stubEnv are undone after each test.
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    include: ["packages/*/test/**/*.test.ts", "app/test/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**", "packages/miniapp/src/storage/**", "app/src/storage/**"],
      thresholds: { lines: 90 },
    },
  },
});
