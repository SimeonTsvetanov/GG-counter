import { expect, test, type Page } from "@playwright/test";
import { openApp } from "../support/entry.ts";

// SPEC 1.2 F20: short, quiet motion. These tests assert end states only (never a frame in the middle), so the
// motion cannot make them flaky; they also prove that quick taps never queue animations and that reduced
// motion moves and scales nothing (accessibility §8).

/** Adds players by name through the Add card. */
async function addPlayers(page: Page, names: readonly string[]): Promise<void> {
  const field = page.getByRole("textbox", { name: "Player name", exact: true });
  for (const name of names) {
    await field.fill(name);
    await field.press("Enter");
    await expect(page.getByRole("textbox", { name: `Player name for ${name}` })).toBeVisible();
  }
}

/** Number of animations still running anywhere on the page. */
const running = (page: Page) => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length);

/** The score on a card, read from its accessible name ("Adjust score for Ana: 3"). */
const scoreOf = (page: Page, name: string) => page.getByRole("button", { name: new RegExp(`^Adjust score for ${name}: `) });

/** Removes `name` through its delete button and the alert's default (Player and score). */
async function removePlayer(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: `Remove ${name}` }).click();
  await page.getByRole("alertdialog", { name: "Remove player or score?" }).getByRole("button", { name: "Remove", exact: true }).click();
}

test("a new card pops in and comes to rest; a removed one leaves, the others settle with focus kept", async ({ page }) => {
  await openApp(page);
  await addPlayers(page, ["Ana", "Boris", "Chen"]);
  await expect(page.locator(".player-card[data-motion='entering']")).toHaveCount(3);
  await expect.poll(() => running(page)).toBe(0);
  await expect(page.locator(".player-card").first()).toHaveCSS("opacity", "1");

  await removePlayer(page, "Boris");
  await expect(page.getByRole("textbox", { name: "Player name for Boris" })).toHaveCount(0);
  await expect(page.locator(".player-card")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Remove Chen" })).toBeFocused();
  await expect.poll(() => running(page)).toBe(0);
  for (const card of await page.locator(".player-card").all()) await expect(card).toHaveCSS("transform", "none");
});

test("10 quick +1 taps end at 10 with nothing queued; the score rolls once per change", async ({ page }) => {
  await openApp(page);
  await addPlayers(page, ["Ana", "Boris"]);
  const plus = page.getByRole("button", { name: "Increase score for Ana" });
  for (let tap = 0; tap < 10; tap++) await plus.click({ delay: 0 });
  // One digits element per score, restarted by each tap: at most one roll on it at any time.
  expect(await page.locator(".score-value[data-trend='up']").evaluateAll((spans) => spans.reduce((sum, span) => sum + span.getAnimations().length, 0))).toBeLessThanOrEqual(1);
  await expect(scoreOf(page, "Ana")).toHaveAccessibleName("Adjust score for Ana: 10");
  await expect.poll(() => running(page)).toBe(0);
  await page.getByRole("button", { name: "Decrease score for Boris" }).click();
  await expect(page.locator(".score-value[data-trend='down']")).toHaveText("-1");
  await expect.poll(() => running(page)).toBe(0);
});

test("history: a removed change goes, Restore brings it back, the rows end in place", async ({ page }) => {
  await openApp(page);
  await addPlayers(page, ["Ana"]);
  const plus = page.getByRole("button", { name: "Increase score for Ana" });
  await plus.click();
  // The other direction always starts a new entry (no merge), so the line gets a fresh one.
  await page.getByRole("button", { name: "Decrease score for Ana" }).click();
  await expect(page.locator(".history-strip-item[data-fresh]")).toHaveText("−1");
  await page.getByRole("button", { name: /^Score history for Ana/ }).click();
  const sheet = page.getByRole("dialog", { name: "Ana" });
  await sheet.getByRole("button", { name: "Remove −1 from Ana's score" }).click();
  await expect(sheet.locator(".history-row:not(.history-row--earlier)")).toHaveCount(1);
  await sheet.getByRole("button", { name: /^Restore/ }).click();
  await expect(sheet.locator(".history-row[data-restored]")).toHaveCount(1);
  await expect(sheet.locator(".history-row:not(.history-row--earlier)")).toHaveCount(2);
  await expect.poll(() => running(page)).toBe(0);
  for (const row of await sheet.locator(".history-row").all()) await expect(row).toHaveCSS("opacity", "1");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("nothing moves or scales: only fades, no slides from script", async ({ page }) => {
    await page.addInitScript(() => {
      const moving: string[] = [];
      Object.assign(window, { moving });
      // Script slides (use-flip.ts) must not start at all.
      const animate = Object.getOwnPropertyDescriptor(Element.prototype, "animate")?.value as (this: Element, ...args: Parameters<Element["animate"]>) => Animation;
      Element.prototype.animate = function (this: Element, ...args: Parameters<Element["animate"]>) {
        moving.push("script animation");
        return animate.apply(this, args);
      };
      // CSS animations: any keyframe with a transform is movement.
      document.addEventListener("animationstart", (event) => {
        for (const animation of (event.target as Element).getAnimations()) {
          const keyframes = animation.effect instanceof KeyframeEffect ? animation.effect.getKeyframes() : [];
          if (keyframes.some((frame) => "transform" in frame || "translate" in frame || "scale" in frame)) moving.push(event.animationName);
        }
      }, true);
    });
    await openApp(page);
    await addPlayers(page, ["Ana", "Boris", "Chen"]);
    await page.getByRole("button", { name: "Increase score for Chen" }).click();
    await page.getByRole("button", { name: "Increase score for Boris" }).click();
    await page.getByRole("button", { name: "Increase score for Boris" }).click();
    await removePlayer(page, "Ana");
    await expect(page.locator(".player-card")).toHaveCount(2);
    await expect(scoreOf(page, "Boris")).toHaveAccessibleName("Adjust score for Boris: 2");
    expect(await page.evaluate(() => (window as unknown as { moving: string[] }).moving)).toEqual([]);
  });
});
