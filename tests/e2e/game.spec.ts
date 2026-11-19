import { expect, test, type Page } from "@playwright/test";
import { DIRTY_STATE, NULL_ENTRY_STATE, STATE_KEY, THEME_KEY, V0_STATE, V1_STATE } from "../fixtures/saved-state";

// Characterization tests: they describe what GG Counter did before the forge migration
// (docs/SPEC.md AC1–AC8) and must stay green through every migration step.

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

/** Today a null entry loses the whole game (see the fixture); PLAN T-04 changes this to ["Ana"]. */
const NULL_ENTRY_SURVIVORS: readonly string[] = [];

const saved = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null") as { players: { name: string; score: number }[]; version: number } | null, STATE_KEY);
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
  await expect(page.getByRole("alertdialog", { name: "Remove player?" })).toBeVisible();
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

test("AC5: Share gives the leaderboard text in the known format", async ({ page }) => {
  await page.addInitScript(() => {
    const record = (text: string) => ((window as unknown as { shared: string }).shared = text);
    Object.defineProperty(navigator, "share", { configurable: true, value: (data: { text: string }) => (record(data.text), Promise.resolve()) });
  });
  await openWith(page, V1_STATE);
  await page.getByRole("button", { name: "Share session" }).first().click();
  const text = await page.waitForFunction(() => (window as unknown as { shared?: string }).shared).then((h) => h.jsonValue());
  const lines = String(text).split("\n");
  expect(lines.slice(0, 7)).toEqual(["🏆 GG Counter Leaderboard", "", "🥇 1st — Ana (34 pts)", "🥈 2nd — Boris (27 pts)", "🥉 3rd — Чен (-3 pts)", "", "🎯 Total score: 58"]);
  expect(lines[7]).toBe("👥 Players: 3");
  expect(lines[8]).toMatch(/^🕒 Snapshot: /);
});

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
    await page.evaluate(([key, value]) => { localStorage.setItem(key, value); }, [STATE_KEY, typeof state === "string" ? state : JSON.stringify(state)] as const);
    await page.reload();
    await expect(page.getByRole("textbox", { name: /^Player name for / })).toHaveCount(names.length);
    for (const name of names) await expect(page.getByRole("textbox", { name: `Player name for ${name}` })).toBeVisible();
  }
});

test("AC8: the saved theme is applied on load", async ({ page }) => {
  await openWith(page, V1_STATE, { [THEME_KEY]: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.evaluate(([key]) => { localStorage.setItem(key, "light"); }, [THEME_KEY] as const);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
