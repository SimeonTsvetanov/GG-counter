import { expect, test, type Page } from "@playwright/test";
import { MIGRATED_KEY, NEW_STATE_KEY, NEW_THEME_KEY, STATE_KEY, THEME_KEY, V0_STATE, V1_STATE, V1_STATE_READ } from "../../../packages/core/test/fixtures/saved-state";
import { openApp, reloadApp } from "../support/entry.ts";
import { isHostKey } from "../support/host.ts";

// PLAN T-07: the one-time copy of the pre-forge keys to `gg-counter:v1:*` in the real app, and the
// shared origin: other apps' keys are never read or changed (engineering → browser-storage §2).
// The screen's half: the game and the stored keys. The page's theme (the `dark` class on <html>) after
// the same steps is checked in tests/e2e/shell/storage.spec.ts under the same titles.

/** Another forge app's keys and an unrelated key on the same origin. */
const OTHER_APPS: Readonly<Record<string, string>> = {
  "teamsync-random-team-generator:v1:theme": "\"dark\"",
  "teamsync-random-team-generator:v1:state": "{\"teams\":[[\"Ana\"]]}",
  theme: "dark",
};

/** Returns every localStorage key and value of the page's origin. */
const storageOf = (page: Page) =>
  page.evaluate(() => {
    const items: Record<string, string | undefined> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key !== null) items[key] = localStorage.getItem(key) ?? undefined;
    }
    return items;
  });

/** Returns the game stored in `raw` (a JSON string), or null. */
const gameIn = (raw: string | undefined) => JSON.parse(raw ?? "null") as { players: { name: string; score: number }[] } | null;

const playerNames = (page: Page) => page.getByRole("textbox", { name: /^Player name for / });

test("only old keys: after two reloads the new keys hold the same game and theme, the old keys are intact", async ({ page }) => {
  const oldState = JSON.stringify(V1_STATE);
  await openApp(page, { storage: { [STATE_KEY]: oldState, [THEME_KEY]: "dark" } });
  await reloadApp(page);
  await reloadApp(page);
  await expect(playerNames(page)).toHaveCount(3);
  const stored = await storageOf(page);
  // 1.1 (DECISIONS 2026-11-20): the copy is stored in the current game format — same players and scores,
  // empty score histories, version 2; the marker still names the source format (version 1).
  expect(gameIn(stored[NEW_STATE_KEY])).toEqual(V1_STATE_READ);
  expect(stored[NEW_THEME_KEY]).toBe("\"dark\"");
  expect(JSON.parse(stored[MIGRATED_KEY] ?? "null") as unknown).toMatchObject({ sourceVersion: 1, items: ["state", "theme"] });
  expect(stored[STATE_KEY]).toBe(oldState);
  expect(stored[THEME_KEY]).toBe("dark");
});

test("only new keys: the game and theme load and nothing is written to the old keys", async ({ page }) => {
  await openApp(page, { storage: { [NEW_STATE_KEY]: JSON.stringify(V0_STATE), [NEW_THEME_KEY]: "\"dark\"" } });
  await expect(playerNames(page)).toHaveCount(2);
  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await expect.poll(async () => gameIn((await storageOf(page))[NEW_STATE_KEY])?.players[0]?.score).toBe(35);
  const stored = await storageOf(page);
  expect(stored[STATE_KEY]).toBeUndefined();
  expect(stored[THEME_KEY]).toBeUndefined();
});

test("both old and new keys with different games: the new one is shown and the old one is never changed", async ({ page }) => {
  const oldState = JSON.stringify(V1_STATE);
  const newState = { players: [{ id: "z1", name: "Zoe", score: 5, createdAt: "2026-11-19T10:00:00.000Z" }], lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
  await openApp(page, { storage: { [STATE_KEY]: oldState, [THEME_KEY]: "dark", [NEW_STATE_KEY]: JSON.stringify(newState), [NEW_THEME_KEY]: "\"light\"" } });
  await expect(page.getByRole("textbox", { name: "Player name for Zoe" })).toBeVisible();
  await expect(playerNames(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Increase score for Zoe" }).click();
  await reloadApp(page);
  await expect(playerNames(page)).toHaveCount(1);
  const stored = await storageOf(page);
  expect(gameIn(stored[NEW_STATE_KEY])?.players[0]?.score).toBe(6);
  expect(stored[STATE_KEY]).toBe(oldState);
  expect(stored[THEME_KEY]).toBe("dark");
});

test("another app's keys are unchanged after using and clearing a session in GG Counter", async ({ page }) => {
  await openApp(page, { storage: { ...OTHER_APPS, [STATE_KEY]: JSON.stringify(V1_STATE) } });
  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill("Dana");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Clear session" }).first().click();
  await page.getByRole("alertdialog", { name: "Clear session?" }).getByRole("button").last().click();
  await expect(playerNames(page)).toHaveCount(0);
  await reloadApp(page);
  await expect(playerNames(page)).toHaveCount(0);
  const stored = await storageOf(page);
  for (const [key, value] of Object.entries(OTHER_APPS)) expect(stored[key]).toBe(value);
  // Inside Quizzard the host's own prefs (`quizzard:v1:*`) are on the origin too; they are not another app's.
  const foreign = Object.keys(stored).filter((key) => !key.startsWith("gg-counter:v1:") && key !== STATE_KEY && key !== THEME_KEY && !isHostKey(key));
  expect(foreign.sort()).toEqual(Object.keys(OTHER_APPS).sort());
});
