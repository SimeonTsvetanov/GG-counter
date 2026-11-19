// Vitest — unit and property tests of packages/core, the storage module of the app and the generator in
// scripts/ (engineering → testing §1, §3). Playwright runs tests/e2e.
import { defineConfig } from "vitest/config";
import { app, l10n } from "./app.config.ts";

export default defineConfig({
  // Same constants as app/vite.config.ts: the storage namespace and the Bulgarian texts of app.config.ts.
  define: { __APP_ID__: JSON.stringify(app.id), __APP_TEXT_BG__: JSON.stringify(l10n.bg) },
  test: {
    // Every test starts clean: spies/mocks, vi.stubGlobal and vi.stubEnv are undone after each test.
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    include: ["packages/*/test/**/*.test.ts", "app/test/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**", "app/src/storage/**"],
      thresholds: { lines: 90 },
    },
  },
});
