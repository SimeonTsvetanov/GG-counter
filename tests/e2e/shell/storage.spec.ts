import { expect, test, type Page } from "@playwright/test";
import { MIGRATED_KEY, NEW_STATE_KEY, NEW_THEME_KEY, STATE_KEY, THEME_KEY, V0_STATE, V1_STATE } from "../../../packages/core/test/fixtures/saved-state";
import { seedStorage } from "../support/entry.ts";

// The page's half of the saved-data tests: the theme it applies (the `dark` class on <html>, set by
// theme-init.js and the page's theme provider) from the keys of a returning user. The game and the stored
// keys after the same steps are checked in tests/e2e/miniapp/storage.spec.ts under the same titles;
// AC8 moved here from tests/e2e/miniapp/game.spec.ts (docs/SPEC.md AC8, characterization).

/** Another forge app's keys and an unrelated key on the same origin (as in the mini-app half). */
const OTHER_APPS: Readonly<Record<string, string>> = {
  "teamsync-random-team-generator:v1:theme": "\"dark\"",
  "teamsync-random-team-generator:v1:state": "{\"teams\":[[\"Ana\"]]}",
  theme: "dark",
};

/** The namespaced keys; removing them makes the next load behave like the first load after an update. */
const NEW_KEYS = [NEW_STATE_KEY, NEW_THEME_KEY, MIGRATED_KEY] as const;

/** Opens the app with `entries` already in localStorage (seeded once per test, not on reload). */
async function openWithStorage(page: Page, entries: Record<string, string>): Promise<void> {
  await seedStorage(page, entries);
  await page.goto("./");
}

const playerNames = (page: Page) => page.getByRole("textbox", { name: /^Player name for / });

test("only old keys: after two reloads the new keys hold the same game and theme, the old keys are intact", async ({ page }) => {
  await openWithStorage(page, { [STATE_KEY]: JSON.stringify(V1_STATE), [THEME_KEY]: "dark" });
  await page.reload();
  await page.reload();
  await expect(playerNames(page)).toHaveCount(3);
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("only new keys: the game and theme load and nothing is written to the old keys", async ({ page }) => {
  await openWithStorage(page, { [NEW_STATE_KEY]: JSON.stringify(V0_STATE), [NEW_THEME_KEY]: "\"dark\"" });
  await expect(playerNames(page)).toHaveCount(2);
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("both old and new keys with different games: the new one is shown and the old one is never changed", async ({ page }) => {
  const newState = { players: [{ id: "z1", name: "Zoe", score: 5, createdAt: "2026-11-19T10:00:00.000Z" }], lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
  await openWithStorage(page, { [STATE_KEY]: JSON.stringify(V1_STATE), [THEME_KEY]: "dark", [NEW_STATE_KEY]: JSON.stringify(newState), [NEW_THEME_KEY]: "\"light\"" });
  await expect(page.getByRole("textbox", { name: "Player name for Zoe" })).toBeVisible();
  await expect(playerNames(page)).toHaveCount(1);
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("another app's keys are unchanged after using and clearing a session in GG Counter", async ({ page }) => {
  await openWithStorage(page, { ...OTHER_APPS, [STATE_KEY]: JSON.stringify(V1_STATE) });
  // An unrelated `theme: dark` key is not GG Counter's: the page follows the system (light here).
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("AC8: the saved theme is applied on load", async ({ page }) => {
  await openWithStorage(page, { [STATE_KEY]: JSON.stringify(V1_STATE), [THEME_KEY]: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  // As saved by the old app on a device the new app has not opened yet (PLAN T-07: the new key wins once it exists).
  await page.evaluate(([key, newKeys]) => { for (const k of newKeys) localStorage.removeItem(k); localStorage.setItem(key, "light"); }, [THEME_KEY, NEW_KEYS] as const);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
