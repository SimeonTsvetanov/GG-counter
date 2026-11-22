import { expect, test, type Page } from "@playwright/test";
import { NEW_STATE_KEY, STATE_KEY, V1_STATE, V2_STATE } from "../../../packages/core/test/fixtures/saved-state";
import { openApp, reloadApp } from "../support/entry.ts";

// GG Counter 1.1, part A (SPEC 1.1 F13–F15, PLAN T-15): the one "what to clear" alert behind Clear session
// and Reset scores, the same alert on a player's delete button, and the score history saved with the game.

/** A saved player as the tests read it back. */
interface SavedPlayer {
  name: string;
  score: number;
  history: { id: string; delta: number; at: string }[];
}

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string>): Promise<void> {
  await openApp(page, { storage: entries });
}

const savedPlayers = (page: Page) => page.evaluate((key) => (JSON.parse(localStorage.getItem(key) ?? "null") as { players: SavedPlayer[] } | null)?.players ?? [], NEW_STATE_KEY);
const savedPlayer = async (page: Page, name: string) => (await savedPlayers(page)).find((p) => p.name === name);
const playerNames = (page: Page) => page.getByRole("textbox", { name: /^Player name for / });
const withHistory = { [NEW_STATE_KEY]: JSON.stringify(V2_STATE) };

test("F13: Clear session asks what to clear; Scores only keeps every player at 0 and empties the history", async ({ page }) => {
  await openWith(page, withHistory);
  await page.getByRole("button", { name: "Clear session" }).first().click();
  const alert = page.getByRole("alertdialog", { name: "Clear session?" });
  await expect(alert.getByRole("radio", { name: "Players and scores" })).toBeChecked();
  await expect(alert.getByRole("button", { name: "Cancel" })).toBeFocused();
  await expect(alert.getByRole("button").last()).toHaveText("Clear");

  await alert.getByText("Scores only").click();
  await expect(alert.getByRole("radio", { name: "Scores only" })).toBeChecked();
  await expect(alert.getByRole("button").last()).toHaveText("Reset");
  await alert.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(alert).toBeHidden();
  await expect(playerNames(page)).toHaveCount(3);
  await expect.poll(async () => (await savedPlayers(page)).map((p) => [p.name, p.score, p.history.length])).toEqual([["Ana", 0, 0], ["Boris", 0, 0], ["Чен", 0, 0]]);

  // The choice starts at the default every time the alert opens.
  await page.getByRole("button", { name: "Clear session" }).first().click();
  await expect(alert.getByRole("radio", { name: "Players and scores" })).toBeChecked();
  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(playerNames(page)).toHaveCount(3);
});

test("F13: Reset scores (Leaderboard card and dialog) opens the same alert with Scores only checked", async ({ page }) => {
  await openWith(page, withHistory);
  const card = page.locator(".card").filter({ has: page.getByRole("heading", { level: 2, name: "Leaderboard" }) });
  await card.getByRole("button", { name: "Reset scores" }).click();
  const alert = page.getByRole("alertdialog", { name: "Clear session?" });
  await expect(alert.getByRole("radio", { name: "Scores only" })).toBeChecked();
  await alert.getByRole("button", { name: "Cancel" }).click();
  await expect(card.getByRole("button", { name: "Reset scores" })).toBeFocused();

  await card.getByRole("button", { name: "Clear session" }).click();
  await expect(alert.getByRole("radio", { name: "Players and scores" })).toBeChecked();
  await alert.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Open leaderboard" }).first().click();
  await page.getByRole("dialog", { name: "Leaderboard" }).getByRole("button", { name: "Reset scores" }).click();
  await expect(alert.getByRole("radio", { name: "Scores only" })).toBeChecked();
  await alert.getByRole("button", { name: "Reset", exact: true }).click();
  await expect.poll(async () => (await savedPlayers(page)).map((p) => p.score)).toEqual([0, 0, 0]);
});

test("F14: a player's delete button — Player and score is the default; Score only keeps the player at 0", async ({ page }) => {
  await openWith(page, withHistory);
  await page.getByRole("button", { name: "Remove Ana" }).click();
  const alert = page.getByRole("alertdialog", { name: "Remove player or score?" });
  await expect(alert).toContainText("Choose what to remove for Ana.");
  await expect(alert.getByRole("radio", { name: "Player and score" })).toBeChecked();
  await expect(alert.getByRole("button").last()).toHaveText("Remove");
  await alert.getByText("Score only").click();
  await alert.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(alert).toBeHidden();
  await expect(page.getByRole("textbox", { name: "Player name for Ana" })).toBeVisible();
  await expect.poll(() => savedPlayer(page, "Ana")).toMatchObject({ score: 0, history: [] });
  expect(await savedPlayer(page, "Boris")).toMatchObject({ score: 27, history: [{ delta: -1 }] });

  await page.getByRole("button", { name: "Remove Boris" }).click();
  const boris = page.getByRole("alertdialog", { name: "Remove player or score?" });
  await expect(boris.getByRole("radio", { name: "Player and score" })).toBeChecked();
  await boris.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Player name for Boris" })).toHaveCount(0);
  // Focus is not lost with the removed card: it moves to the next player's delete button (accessibility §3).
  await expect(page.getByRole("button", { name: "Remove Чен" })).toBeFocused();
});

test("keyboard: Cancel first, Shift+Tab reaches the options, arrows change the choice and the confirm label, Escape returns focus", async ({ page }) => {
  await openWith(page, withHistory);
  const trash = page.getByRole("button", { name: "Remove Чен" });
  await trash.focus();
  await page.keyboard.press("Enter");
  const alert = page.getByRole("alertdialog", { name: "Remove player or score?" });
  await expect(alert.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(alert.getByRole("radio", { name: "Player and score" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(alert.getByRole("radio", { name: "Score only" })).toBeChecked();
  await expect(alert.getByRole("button").last()).toHaveText("Reset");
  await page.keyboard.press("Escape");
  await expect(alert).toBeHidden();
  await expect(trash).toBeFocused();
  expect(await savedPlayer(page, "Чен")).toMatchObject({ score: -3 });
});

test("F15: every score change is saved as a history entry; quick taps merge into one; a 1.0.0 game upgrades", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-20T20:00:00.000Z"));
  // A 1.0.0 user: the game under the pre-forge key only (also proves the old-key path still works).
  await openWith(page, { [STATE_KEY]: JSON.stringify(V1_STATE) });
  await expect(playerNames(page)).toHaveCount(3);
  for (let tap = 0; tap < 3; tap += 1) await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await expect.poll(() => savedPlayer(page, "Ana")).toMatchObject({ score: 37, history: [{ delta: 3, at: "2026-11-20T20:00:00.000Z" }] });

  // A pause longer than the merge window starts a new entry.
  await page.clock.setFixedTime(new Date("2026-11-20T20:00:05.000Z"));
  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await page.getByRole("button", { name: /^Adjust score for Boris/ }).click();
  const adjust = page.getByRole("dialog", { name: "Adjust score" });
  await adjust.getByRole("spinbutton", { name: "Custom score adjustment" }).fill("-5");
  await adjust.getByRole("button", { name: "Apply" }).click();
  await expect.poll(async () => (await savedPlayer(page, "Ana"))?.history.map((e) => e.delta)).toEqual([3, 1]);
  expect(await savedPlayer(page, "Boris")).toMatchObject({ score: 22, history: [{ delta: -5, at: "2026-11-20T20:00:05.000Z" }] });
  expect(await savedPlayer(page, "Чен")).toMatchObject({ score: -3, history: [] });

  await reloadApp(page);
  await expect(page.getByRole("button", { name: /^Adjust score for Ana: 38/ })).toBeVisible();
  expect((await savedPlayer(page, "Ana"))?.history).toHaveLength(2);
});
