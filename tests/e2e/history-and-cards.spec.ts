import { expect, test, type Page } from "@playwright/test";
import { NEW_STATE_KEY, V2_STATE } from "../../packages/core/test/fixtures/saved-state";

// GG Counter 1.1, part B (SPEC 1.1 F16–F18, PLAN T-16): the "last changes" line on each card and the
// history sheet behind it (× removes at once, Restore puts it back), the last-scored mark, the medals and
// the compact cards from the fifth player. V2_STATE: Ana 34 (18 earlier + 4 + 12), Boris 27 (28 − 1,
// the newest change of the game), Чен −3 (no history).

/** A saved player as the tests read it back. */
interface SavedPlayer {
  name: string;
  score: number;
  history: { id: string; delta: number; at: string }[];
}

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string>, path = "./"): Promise<void> {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, entries);
  await page.goto(path);
}

/** A saved game of players with `[name, score]` and no history. */
function gameOf(players: readonly (readonly [string, number])[]): Record<string, string> {
  const state = {
    players: players.map(([name, score], i) => ({ id: `p${String(i)}`, name, score, createdAt: "2026-11-20T19:00:00.000Z", history: [] })),
    lastUpdated: "2026-11-20T19:00:00.000Z",
    version: 2,
  };
  return { [NEW_STATE_KEY]: JSON.stringify(state) };
}

const withHistory = { [NEW_STATE_KEY]: JSON.stringify(V2_STATE) };
const MINUS = "−";
const savedPlayer = (page: Page, name: string) =>
  page.evaluate(({ key, wanted }) => (JSON.parse(localStorage.getItem(key) ?? "null") as { players: SavedPlayer[] } | null)?.players.find((p) => p.name === wanted), { key: NEW_STATE_KEY, wanted: name });
const card = (page: Page, name: string) => page.locator(".player-card").filter({ has: page.getByRole("textbox", { name: `Player name for ${name}` }) });
const markedCards = (page: Page) => page.locator(".player-card[data-last-scored]");

test("F16: the line shows the newest changes; × removes one at once, Restore puts it back, the total follows (AC16)", async ({ page }) => {
  await openWith(page, withHistory);
  const strip = page.getByRole("button", { name: "Score history for Ana: +12, +4" });
  await expect(strip).toHaveText("+12+4");
  await expect(card(page, "Чен").getByRole("button", { name: /^Score history/ })).toHaveCount(0);

  await strip.click();
  const sheet = page.getByRole("dialog", { name: "Ana" });
  await expect(sheet.getByRole("heading", { name: "Ana" })).toBeFocused();
  await expect(sheet).toContainText("Total: 34 points");
  await expect(sheet.getByRole("listitem")).toHaveText([/^\+12/, /^\+4/, "+18Earlier points"]);

  await sheet.getByRole("button", { name: "Remove +12 from Ana's score" }).click();
  await expect(sheet).toContainText("Total: 22 points");
  await expect(sheet.getByRole("button", { name: "Remove +4 from Ana's score" })).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Removed +12. Total now 22." })).toBeAttached();

  await sheet.getByRole("button", { name: "Restore +12" }).click();
  await expect(sheet).toContainText("Total: 34 points");
  await expect(sheet.getByRole("button", { name: "Remove +12 from Ana's score" })).toBeFocused();
  await expect(sheet.getByRole("button", { name: /^Restore/ })).toHaveCount(0);
  await expect.poll(async () => (await savedPlayer(page, "Ana"))?.history.map((e) => e.id)).toEqual(["e1", "e2"]);

  await sheet.getByRole("button", { name: "Remove +12 from Ana's score" }).click();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Score history for Ana: +4" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Adjust score for Ana: 22" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Adjust score for Ana: 22" })).toBeVisible();
  await expect.poll(async () => (await savedPlayer(page, "Boris"))?.score).toBe(27);
});

test("F16: removing every change empties the sheet, focus never drops to the page", async ({ page }) => {
  await openWith(page, withHistory);
  await page.getByRole("button", { name: /^Score history for Boris/ }).click();
  const sheet = page.getByRole("dialog", { name: "Boris" });
  await sheet.getByRole("button", { name: `Remove ${MINUS}1 from Boris's score` }).click();
  await expect(sheet).toContainText("Total: 28 points");
  await expect(sheet.getByRole("listitem")).toHaveText(["+28Earlier points"]);
  await expect(sheet.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Adjust score for Boris: 28" })).toBeFocused();
  await expect(card(page, "Boris").getByRole("button", { name: /^Score history/ })).toHaveCount(0);
});

test("F16: a removal that would pass the limit says why and changes nothing (AC16)", async ({ page }) => {
  const top = { players: [{ id: "a", name: "Ana", score: 999_999, createdAt: "2026-11-20T19:00:00.000Z", history: [{ id: "x", delta: -5, at: "2026-11-20T19:10:00.000Z" }] }], lastUpdated: "2026-11-20T19:10:00.000Z", version: 2 };
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(top) });
  await page.getByRole("button", { name: /^Score history for Ana/ }).click();
  const sheet = page.getByRole("dialog", { name: "Ana" });
  await sheet.getByRole("button", { name: `Remove ${MINUS}5 from Ana's score` }).click();
  await expect(sheet.getByRole("alert").filter({ hasText: "Scores go from" })).toBeVisible();
  await expect(sheet).toContainText("Total: 999999 points");
  await expect(sheet.getByRole("button", { name: /^Restore/ })).toHaveCount(0);
  await expect.poll(async () => (await savedPlayer(page, "Ana"))?.history).toHaveLength(1);
});

test("F17: the mark follows the newest change and goes back when it is removed (AC17)", async ({ page }) => {
  await openWith(page, withHistory);
  await expect(markedCards(page)).toHaveCount(1);
  await expect(markedCards(page).getByRole("textbox")).toHaveAccessibleName("Player name for Boris");
  await expect(page.getByRole("button", { name: `Score history for Boris (scored last): ${MINUS}1` })).toBeVisible();

  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await expect(markedCards(page).getByRole("textbox")).toHaveAccessibleName("Player name for Ana");
  await expect(page.getByRole("button", { name: "Score history for Ana (scored last): +1, +12, +4" })).toBeVisible();

  await page.getByRole("button", { name: /^Score history for Ana/ }).click();
  await page.getByRole("dialog", { name: "Ana" }).getByRole("button", { name: "Remove +1 from Ana's score" }).click();
  await page.keyboard.press("Escape");
  await expect(markedCards(page).getByRole("textbox")).toHaveAccessibleName("Player name for Boris");
});

test("F18: medals 1, 2, 2 for 34, 27, 27 on the cards and in the leaderboard; none while all scores are equal (AC18)", async ({ page }) => {
  await openWith(page, gameOf([["Ana", 34], ["Boris", 27], ["Aisha", 27], ["Kenji", 5]]));
  await expect(card(page, "Ana").getByRole("img", { name: "1st place" })).toBeVisible();
  await expect(card(page, "Boris").getByRole("img", { name: "2nd place" })).toBeVisible();
  await expect(card(page, "Aisha").getByRole("img", { name: "2nd place" })).toBeVisible();
  await expect(card(page, "Kenji").getByRole("img")).toHaveCount(0);
  const board = page.locator(".card").filter({ has: page.getByRole("heading", { level: 2, name: "Leaderboard" }) });
  await expect(board.locator(".rank-row")).toHaveText([/^🥇 Ana/, /^🥈 Boris/, /^🥈 Aisha/, /^4\. Kenji/]);
  // The cards keep the order the players were added in.
  await expect.poll(() => page.getByRole("textbox", { name: /^Player name for / }).evaluateAll((fields) => fields.map((f) => f.getAttribute("aria-label")))).toEqual(["Player name for Ana", "Player name for Boris", "Player name for Aisha", "Player name for Kenji"]);

  await page.getByRole("button", { name: "Clear session" }).first().click();
  const alert = page.getByRole("alertdialog", { name: "Clear session?" });
  await alert.getByText("Scores only").click();
  await alert.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".place-medal")).toHaveCount(0);
  await expect(board.locator(".rank-row")).toHaveText([/^1\. Ana/, /^1\. Boris/, /^1\. Aisha/, /^1\. Kenji/]);
});

test("F18: up to 4 players roomy cards; from 5 compact ones — more per screen, targets still 44 px (AC18)", async ({ page }, testInfo) => {
  await openWith(page, gameOf([["Ana", 3], ["Boris", 120], ["Aisha", 7]]));
  const grid = page.locator(".player-grid");
  await expect(grid).toHaveAttribute("data-density", "comfortable");
  const roomy = await page.locator(".player-card").first().boundingBox();

  const nine = gameOf([["Ana", 3], ["Boris", 120], ["Aisha", 7], ["Kenji", 0], ["Elena", 12], ["Liam", 9], ["Sofia", 999_999], ["Noah", -5], ["Yuki", 40]]);
  await page.evaluate((state) => { localStorage.setItem(Object.keys(state)[0] ?? "", Object.values(state)[0] ?? ""); }, nine);
  await page.reload();
  await expect(grid).toHaveAttribute("data-density", "compact");
  const compact = await card(page, "Ana").boundingBox();
  expect(compact?.height).toBeLessThan(roomy?.height ?? 0);

  const tops = await page.locator(".player-card").evaluateAll((cards) => cards.map((c) => Math.round(c.getBoundingClientRect().top)));
  const perRow = tops.filter((top) => top === tops[0]).length;
  if (testInfo.project.name === "phone") {
    expect(perRow).toBe(2);
    // 1.0.0's phone card was 180 px tall (PLAN T-12 screenshots): a compact one with a short score is shorter.
    expect(compact?.height).toBeLessThan(180);
  } else {
    expect(perRow).toBe(5);
  }
  for (const control of await card(page, "Ana").getByRole("button").all()) {
    const box = await control.boundingBox();
    expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  }
  // The 6-digit score keeps its own row and fits inside its card.
  const sofia = card(page, "Sofia");
  const score = await sofia.getByRole("button", { name: /^Adjust score for Sofia/ }).evaluate((b) => b.scrollWidth <= b.clientWidth);
  expect(score).toBe(true);
});

test("F16–F18 in Bulgarian: the line, the sheet, Restore and the medal", async ({ page }) => {
  await openWith(page, { ...withHistory, "gg-counter:v1:lang": "\"bg\"" });
  await expect(page.getByRole("img", { name: "1-во място" })).toBeVisible();
  await expect(page.getByRole("button", { name: `История на точките на Boris (последна промяна в играта): ${MINUS}1` })).toBeVisible();
  await page.getByRole("button", { name: "История на точките на Ana: +12, +4" }).click();
  const sheet = page.getByRole("dialog", { name: "Ana" });
  await expect(sheet).toContainText("Общо: 34 точки");
  await expect(sheet).toContainText("По-ранни точки");
  await sheet.getByRole("button", { name: "Премахни +12 от точките на Ana" }).click();
  await expect(sheet).toContainText("Общо: 22 точки");
  await expect(sheet.getByRole("button", { name: "Върни +12" })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Затвори" })).toBeVisible();
});
