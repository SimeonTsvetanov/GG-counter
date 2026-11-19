// Vitest — unit and property tests of packages/core and the generator in scripts/ (engineering →
// testing §1, §3). Playwright runs tests/e2e.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every test starts clean: spies/mocks, vi.stubGlobal and vi.stubEnv are undone after each test.
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    include: ["packages/*/test/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**"],
      thresholds: { lines: 90 },
    },
  },
});
