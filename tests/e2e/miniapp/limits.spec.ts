import { expect, test, type Page } from "@playwright/test";
import { NEW_STATE_KEY } from "../../../packages/core/test/fixtures/saved-state";
import { openApp, reloadApp } from "../support/entry.ts";

// PLAN T-08: the game screen's limits (core) — a name too long, the 50th player, a score out of range —
// each refused with a message that says why. Moved from tests/e2e/shell/shell.spec.ts (GG-03). The same
// messages in Bulgarian: tests/e2e/miniapp/i18n.spec.ts. Desktop + phone.

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string>): Promise<void> {
  await openApp(page, { storage: entries });
}

const playerNames = (page: Page) => page.getByRole("textbox", { name: /^Player name for / });

/** A game with one player at `score`. */
function oneScore(score: number) {
  return { players: [{ id: "p1", name: "Ana", score, createdAt: "2026-11-19T10:00:00.000Z" }], lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
}

test("limit messages: name too long, 50 players, score out of range — each says why", async ({ page }) => {
  const fifty = { players: Array.from({ length: 50 }, (_, index) => ({ id: `p${String(index)}`, name: `P${String(index)}`, score: 0, createdAt: "2026-11-19T10:00:00.000Z" })), lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(fifty) });
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill("Dana");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("A game can have up to 50 players. Remove a player to add another.")).toBeVisible();
  await expect(playerNames(page)).toHaveCount(50);

  await page.evaluate(([key, value]) => { localStorage.setItem(key, value); }, [NEW_STATE_KEY, JSON.stringify(oneScore(999_999))] as const);
  await reloadApp(page);
  const tooLong = "A".repeat(41);
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill(tooLong);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Names can be up to 40 characters" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Player name", exact: true })).toHaveAttribute("aria-invalid", "true");

  // The rename field has the same 40-character limit (it was 32 before T-08).
  const rename = page.getByRole("textbox", { name: "Player name for Ana" });
  await rename.fill("B".repeat(40));
  await rename.press("Enter");
  await expect(page.getByRole("textbox", { name: `Player name for ${"B".repeat(40)}` })).toBeVisible();
  const renamed = page.getByRole("textbox", { name: `Player name for ${"B".repeat(40)}` });
  await renamed.fill(tooLong);
  await renamed.press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "Names can be up to 40 characters" })).toHaveCount(2);

  await page.getByRole("button", { name: /^Increase score for / }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Scores go from -999,999 to 999,999." })).toBeVisible();
  await page.getByRole("button", { name: /^Adjust score for / }).click();
  const dialog = page.getByRole("dialog", { name: "Adjust score" });
  await dialog.getByRole("spinbutton").fill("5");
  await dialog.getByRole("button", { name: "Apply" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(/Scores go from -999,999 to 999,999/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^Adjust score for / })).toHaveText("999999");
});
