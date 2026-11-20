import { expect, test, type Page } from "@playwright/test";
import { DIRTY_STATE, MIGRATED_KEY, NEW_STATE_KEY, NEW_THEME_KEY, NULL_ENTRY_STATE, STATE_KEY, THEME_KEY, V0_STATE, V1_STATE } from "../../packages/core/test/fixtures/saved-state";

// Characterization tests: they describe what GG Counter did before the forge migration
// (docs/SPEC.md AC1–AC8) and must stay green through every migration step. They seed the pre-forge
// keys, so since PLAN T-07 they also prove the one-time copy to the `gg-counter:v1:*` keys.

/** The namespaced keys; removing them makes the next load behave like the first load after an update. */
const NEW_KEYS = [NEW_STATE_KEY, NEW_THEME_KEY, MIGRATED_KEY] as const;

/** Turns a fixture into the stored string: `null` = nothing saved, strings are stored as they are (broken JSON). */
function toStoredValue(state: unknown): string | null {
  if (state === null) return null;
  return typeof state === "string" ? state : JSON.stringify(state);
}

/** Opens the app with `state` already saved, as an existing user would have it. */
async function openWith(page: Page, state: unknown, extra: Record<string, string> = {}) {
  await page.addInitScript(([key, value, more]) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    if (value !== null) localStorage.setItem(key, value);
    for (const [k, v] of Object.entries(more)) localStorage.setItem(k, v);
  }, [STATE_KEY, toStoredValue(state), extra] as const);
  await page.goto("./");
}

async function addPlayer(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill(name);
  await page.getByRole("button", { name: "Add", exact: true }).click();
}

/** A null entry is dropped and the valid players survive (fixed in PLAN T-04; the old app lost the whole game). */
const NULL_ENTRY_SURVIVORS: readonly string[] = ["Ana"];

// Since PLAN T-07 the app writes only the namespaced key, so the saved game is read from there.
const saved = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null") as { players: { name: string; score: number }[]; version: number } | null, NEW_STATE_KEY);
const scoreOf = async (page: Page, name: string) => (await saved(page))?.players.find((p) => p.name === name)?.score;

test("AC1: adding players; an empty name adds nobody", async ({ page }) => {
  await openWith(page, null);
  await addPlayer(page, "Ana");
  await addPlayer(page, "  Boris  ");
  await addPlayer(page, "   ");
  await expect(page.getByRole("textbox", { name: /^Player name for / })).toHaveCount(2);
  await expect.poll(async () => (await saved(page))?.players.map((p) => [p.name, p.score])).toEqual([["Ana", 0], ["Boris", 0]]);
});

test("AC2: rename and remove a player (remove asks first) and it stays gone after reload", async ({ page }) => {
  await openWith(page, V1_STATE);
  await page.getByRole("textbox", { name: "Player name for Boris" }).fill("Bobby");
  await page.getByRole("textbox", { name: "Player name for Boris" }).press("Enter"); // a rename is saved on Enter or blur
  await expect.poll(() => scoreOf(page, "Bobby")).toBe(27);
  await page.getByRole("button", { name: "Remove Ana" }).click();
  // 1.1 (SPEC F14, DECISIONS 2026-11-20): the alert is named "Remove player or score?" (was "Remove player?") and
  // has "Player and score" checked by default; its confirm "Remove" removes the player as before.
  await expect(page.getByRole("alertdialog", { name: "Remove player or score?" })).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("textbox", { name: "Player name for Ana" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Player name for Bobby" })).toBeVisible();
  await expect.poll(async () => (await saved(page))?.players.map((p) => p.name)).toEqual(["Bobby", "Чен"]);
});

test("AC3: +1, −1 and a custom amount give the exact sum", async ({ page }) => {
  await openWith(page, V1_STATE);
  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await page.getByRole("button", { name: "Decrease score for Boris" }).click();
  await page.getByRole("button", { name: "Adjust score for Ana" }).click();
  await page.getByRole("spinbutton", { name: "Custom score adjustment" }).or(page.getByRole("textbox", { name: "Custom score adjustment" })).fill("-12");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect.poll(() => scoreOf(page, "Ana")).toBe(24);
  await expect.poll(() => scoreOf(page, "Boris")).toBe(26);
});

test("AC4: the leaderboard is sorted by score with medals and totals", async ({ page }) => {
  await openWith(page, V1_STATE);
  await page.getByRole("button", { name: "Open leaderboard" }).first().click();
  const board = page.getByRole("dialog", { name: "Leaderboard" });
  await expect(board).toContainText("🥇 Ana");
  await expect(board).toContainText("🥈 Boris");
  await expect(board).toContainText("🥉 Чен");
  await expect(board).toContainText("34 pts");
});

// 1.2 (SPEC F21, DECISIONS 2026-11-20): Moni asked for a nicer text with the app link, so the pre-forge format
// of AC5 changed on purpose. Every leaderboard Share (card, dialog) hands the same text to Web Share,
// without `url` — the link is the text's last line, and apps that append `url` would print it twice.
const APP_URL = "https://simeontsvetanov.github.io/GG-counter/";

/** Records what the page hands to `navigator.share`. */
async function recordShares(page: Page) {
  await page.addInitScript(() => {
    const shared: unknown[] = [];
    Object.assign(window, { shared });
    Object.defineProperty(navigator, "share", { configurable: true, value: (data: unknown) => { shared.push(data); return Promise.resolve(); } });
  });
}

/** Returns the last data handed to `navigator.share`, once there are `count` of them. */
async function lastShare(page: Page, count: number) {
  await expect.poll(() => page.evaluate(() => (window as unknown as { shared: unknown[] }).shared.length)).toBe(count);
  return page.evaluate(() => (window as unknown as { shared: { title?: string; text: string; url?: string }[] }).shared.at(-1));
}

test("AC5: every leaderboard Share sends the 1.2 text with the app link once, without a separate url", async ({ page }) => {
  await recordShares(page);
  await openWith(page, V1_STATE);
  const openers = [
    () => page.locator("[data-flip='main:leaderboard']").getByRole("button", { name: "Share", exact: true }).click(),
    async () => {
      await page.getByRole("button", { name: "Open leaderboard" }).first().click();
      await page.getByRole("dialog", { name: "Leaderboard" }).getByRole("button", { name: "Share", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Leaderboard" })).toBeHidden();
    },
  ];
  for (const [index, open] of openers.entries()) {
    await open();
    const data = await lastShare(page, index + 1);
    expect(data?.title).toBe("GG Counter session");
    expect(data?.url).toBeUndefined();
    const lines = String(data?.text).split("\n");
    expect(lines[0]).toBe("🏆 GG Counter — Leaderboard");
    expect(lines[1]).toMatch(/^📅 \S/);
    expect(lines.slice(2)).toEqual([
      "",
      "🥇 34 · Ana",
      "🥈 27 · Boris",
      "🥉 −3 · Чен",
      "",
      "👑 Winner: Ana — 34 points",
      "👥 3 players · 58 points in total",
      "",
      `— Made with GG Counter · ${APP_URL}`,
    ]);
    expect(String(data?.text).split(APP_URL)).toHaveLength(2);
  }
});

test("AC5: without Web Share the same text is copied and a toast says so; a cancelled share sheet does nothing", async ({ page }) => {
  await page.addInitScript(() => {
    const copied: string[] = [];
    Object.assign(window, { copied });
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (text: string) => { copied.push(text); return Promise.resolve(); } } });
  });
  await openWith(page, V1_STATE);
  await page.locator("[data-flip='main:leaderboard']").getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Leaderboard copied ✓")).toBeVisible();
  const copied = await page.evaluate(() => (window as unknown as { copied: string[] }).copied);
  expect(copied).toHaveLength(1);
  expect(copied[0]?.split("\n").at(-1)).toBe(`— Made with GG Counter · ${APP_URL}`);

  // The user closes the share sheet: nothing is copied, no toast.
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: () => Promise.reject(new DOMException("cancelled", "AbortError")) });
  });
  await page.locator("[data-flip='main:leaderboard']").getByRole("button", { name: "Share", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { copied: string[] }).copied.length)).toBe(1);
});

// 1.2.1: the header has no Share button (it gave a wrong "blocked" message with no players; Share stays in the
// Leaderboard card — disabled while there are no players — the leaderboard window and the menu).
test("the header has no share button and the card's Share is disabled without players", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Open leaderboard" }).first()).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: /share/i })).toHaveCount(0);
  await expect(page.locator("[data-flip='main:leaderboard']").getByRole("button", { name: "Share", exact: true })).toBeDisabled();
});

// 1.1 (SPEC F13): the alert now has a choice; its default "Players and scores" (confirm = the last button)
// is the clear-everything of AC6, so this test is unchanged.
test("AC6: clear session removes everything after a confirmation", async ({ page }) => {
  await openWith(page, V1_STATE);
  await page.getByRole("button", { name: "Clear session" }).first().click();
  const dialog = page.getByRole("alertdialog", { name: "Clear session?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("textbox", { name: "Player name for Ana" })).toBeVisible();
  await page.getByRole("button", { name: "Clear session" }).first().click();
  await dialog.getByRole("button").last().click();
  await expect(page.getByRole("textbox", { name: "Player name for Ana" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("textbox", { name: /^Player name for / })).toHaveCount(0);
});

test("AC7: state saved by the old app loads unchanged (version 1, no version, broken entries, broken JSON)", async ({ page }) => {
  await openWith(page, V1_STATE);
  for (const name of ["Ana", "Boris", "Чен"]) await expect(page.getByRole("textbox", { name: `Player name for ${name}` })).toBeVisible();
  expect(await scoreOf(page, "Чен")).toBe(-3);

  for (const [state, names] of [[V0_STATE, ["Ana", "Boris"]], [DIRTY_STATE, ["Valid"]], ["{not json", []], [NULL_ENTRY_STATE, NULL_ENTRY_SURVIVORS]] as const) {
    // As saved by the old app on a device the new app has not opened yet (PLAN T-07: the new key wins once it exists).
    await page.evaluate(([key, value, newKeys]) => { for (const k of newKeys) localStorage.removeItem(k); localStorage.setItem(key, value); }, [STATE_KEY, typeof state === "string" ? state : JSON.stringify(state), NEW_KEYS] as const);
    await page.reload();
    await expect(page.getByRole("textbox", { name: /^Player name for / })).toHaveCount(names.length);
    for (const name of names) await expect(page.getByRole("textbox", { name: `Player name for ${name}` })).toBeVisible();
  }
});

test("AC8: the saved theme is applied on load", async ({ page }) => {
  await openWith(page, V1_STATE, { [THEME_KEY]: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  // As saved by the old app on a device the new app has not opened yet (PLAN T-07: the new key wins once it exists).
  await page.evaluate(([key, newKeys]) => { for (const k of newKeys) localStorage.removeItem(k); localStorage.setItem(key, "light"); }, [THEME_KEY, NEW_KEYS] as const);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
