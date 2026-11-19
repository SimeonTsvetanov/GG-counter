import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { app } from "../../app.config.ts";
import { NEW_STATE_KEY, V1_STATE } from "../../packages/core/test/fixtures/saved-state";

// PLAN T-08: the app shell — menu (keyboard), Settings (theme, export → clear → import), Help, What's
// new, About, Report a problem, the limit messages and the error screen. Desktop + phone.

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string> = {}) {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, entries);
  await page.goto("./");
}

const playerNames = (page: Page) => page.getByRole("textbox", { name: /^Player name for / });
const menuButton = (page: Page) => page.locator("[data-menu-open]").first();
/** Players in the saved game (the page behind an open modal is hidden from the accessibility tree). */
const savedPlayers = (page: Page) => page.evaluate((key) => (JSON.parse(localStorage.getItem(key) ?? "null") as { players: unknown[] } | null)?.players.length ?? 0, NEW_STATE_KEY);
const ownKeys = (page: Page) => page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("gg-counter")).sort());

/** Opens the menu with the mouse and picks `item`. */
async function openFromMenu(page: Page, item: string) {
  await menuButton(page).click();
  await page.getByRole("menuitem", { name: item }).click();
}

/** A game with one player at `score`. */
function oneScore(score: number) {
  return { players: [{ id: "p1", name: "Ana", score, createdAt: "2026-11-19T10:00:00.000Z" }], lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
}

test("the menu opens and closes with the keyboard and focus comes back to its button", async ({ page }) => {
  await openWith(page);
  await menuButton(page).focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  for (const group of app.shell.menu) await expect(menu).toContainText(new RegExp(group.id, "i"));
  for (const label of ["Help", "Settings", "What's new", "Share app", "Report a problem", "About"]) await expect(page.getByRole("menuitem", { name: label })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton(page)).toBeFocused();

  // Arrow keys reach Settings; Enter opens it; Escape closes it and focus is back on the menu button.
  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await page.keyboard.type("Settings");
  await page.keyboard.press("Enter");
  const settings = page.getByRole("dialog", { name: "Settings" });
  await expect(settings).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();
  await expect(menuButton(page)).toBeFocused();
});

test("Settings: export → clear my data → import gives back the same game", async ({ page }, testInfo) => {
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(V1_STATE) });
  await openFromMenu(page, "Settings");
  const settings = page.getByRole("dialog", { name: "Settings" });

  const [download] = await Promise.all([page.waitForEvent("download"), settings.getByRole("button", { name: "Export my data" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^gg-counter-data-\d{4}-\d{2}-\d{2}\.json$/);
  const file = testInfo.outputPath(download.suggestedFilename());
  await download.saveAs(file);
  const fileText = await readFile(file, "utf8");
  const exported = JSON.parse(fileText) as { app: string; data: { state: { players: unknown[] } } };
  expect(exported.app).toBe("gg-counter");
  expect(exported.data.state.players).toEqual(V1_STATE.players);

  await settings.getByRole("button", { name: "Clear my data" }).click();
  const confirmClear = page.getByRole("alertdialog", { name: "Delete all your data?" });
  await expect(confirmClear).toContainText("all players, their scores and your theme choice");
  await expect(confirmClear.getByRole("button", { name: "Cancel" })).toBeFocused();
  await confirmClear.getByRole("button", { name: "Delete" }).click();
  await expect(confirmClear).toBeHidden();
  expect(await ownKeys(page)).toEqual([]);

  // A buffer, not the path: Chromium sets no file for a path with "→" (the test title is in it).
  await settings.locator('input[type="file"]').setInputFiles({ name: download.suggestedFilename(), mimeType: "application/json", buffer: Buffer.from(fileText) });
  const confirmImport = page.getByRole("alertdialog", { name: "Replace the current game?" });
  await expect(confirmImport).toContainText("3 players");
  await confirmImport.getByRole("button", { name: "Replace" }).click();
  await expect.poll(() => savedPlayers(page)).toBe(3);
  await page.keyboard.press("Escape");
  await expect(playerNames(page)).toHaveCount(3);
  await page.reload();
  await expect(page.getByRole("button", { name: "Adjust score for Ana" })).toHaveText("34");
  await expect(playerNames(page)).toHaveCount(3);
});

test("Settings: a file that is not an export is refused with a reason and nothing changes", async ({ page }) => {
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(V1_STATE) });
  await openFromMenu(page, "Settings");
  const settings = page.getByRole("dialog", { name: "Settings" });
  await settings.locator('input[type="file"]').setInputFiles({ name: "notes.json", mimeType: "application/json", buffer: Buffer.from("{\"app\":\"other\"}") });
  await expect(settings.getByRole("alert")).toHaveText(/exported by another app/);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(playerNames(page)).toHaveCount(3);
});

test("Settings: the theme choice applies at once and survives a reload; the phone header has no theme button", async ({ page, isMobile }) => {
  await openWith(page);
  // Hidden buttons have no role, so this counts the visible theme button only.
  await expect(page.getByRole("button", { name: "Toggle theme" })).toHaveCount(isMobile ? 0 : 1);
  await openFromMenu(page, "Settings");
  await page.getByRole("dialog", { name: "Settings" }).getByText("Dark", { exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await openFromMenu(page, "Settings");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
});

test("Help, What's new, About and Report a problem open from the menu with their content", async ({ page }) => {
  await openWith(page);
  await openFromMenu(page, "Help");
  const help = page.getByRole("dialog", { name: "Help" });
  for (const item of app.faq) await expect(help.getByText(item.q, { exact: true })).toBeAttached();
  await expect(help.getByText("Up to 50 players per game.", { exact: true })).toBeAttached();
  await help.getByRole("button", { name: "Close" }).click();
  await expect(menuButton(page)).toBeFocused();

  await openFromMenu(page, "What's new");
  const whatsNew = page.getByRole("dialog", { name: "What's new" });
  await expect(whatsNew.getByRole("heading", { name: "Latest changes" })).toBeVisible();
  await expect(whatsNew.getByRole("listitem").first()).toBeVisible();
  await page.keyboard.press("Escape");

  await openFromMenu(page, "About");
  const about = page.getByRole("dialog", { name: `About ${app.name}` });
  await expect(about).toContainText(`Version ${app.version}`);
  await expect(about.getByRole("link", { name: "react", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await openFromMenu(page, "Report a problem");
  const report = page.getByRole("dialog", { name: "Report a problem" });
  await report.getByRole("link", { name: "Send by email" }).click();
  await expect(report.getByRole("alert")).toHaveText("Describe the problem first.");
  await report.getByRole("textbox").fill("The score does not change");
  await expect(report.getByRole("link", { name: "Send by email" })).toHaveAttribute("href", new RegExp(`^mailto:${app.contact.email}\\?subject=`));
  await expect(report.getByRole("link", { name: "Open a GitHub issue" })).toHaveAttribute("href", new RegExp(`^${app.repo}/issues/new\\?title=`));
});

test("a deep link #settings opens Settings and the footer version opens What's new", async ({ page }) => {
  await page.goto("./#settings");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("contentinfo")).toContainText(`© ${String(new Date().getFullYear())} ${app.author.name}`);
  await page.getByRole("contentinfo").getByRole("button", { name: `Version ${app.version}` }).click();
  await expect(page.getByRole("dialog", { name: "What's new" })).toBeVisible();
});

test("limit messages: name too long, 50 players, score out of range — each says why", async ({ page }) => {
  const fifty = { players: Array.from({ length: 50 }, (_, index) => ({ id: `p${String(index)}`, name: `P${String(index)}`, score: 0, createdAt: "2026-11-19T10:00:00.000Z" })), lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(fifty) });
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill("Dana");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("A game can have up to 50 players. Remove a player to add another.")).toBeVisible();
  await expect(playerNames(page)).toHaveCount(50);

  await page.evaluate(([key, value]) => { localStorage.setItem(key, value); }, [NEW_STATE_KEY, JSON.stringify(oneScore(999_999))] as const);
  await page.reload();
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

test("an unexpected error shows the error screen, never a blank page", async ({ page }) => {
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(V1_STATE) });
  await page.evaluate(() => { document.dispatchEvent(new Event("app:test-crash")); });
  const screen = page.getByRole("alert").filter({ has: page.getByRole("heading", { name: "Something went wrong" }) });
  await expect(screen).toBeVisible();
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeFocused();
  await expect(screen).toContainText("Your game is saved on this device");
  await expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  await expect(screen.getByRole("link", { name: "Report a problem" })).toHaveAttribute("href", new RegExp(`^${app.repo}/issues/new`));
  const [download] = await Promise.all([page.waitForEvent("download"), screen.getByRole("button", { name: "Export my data" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^gg-counter-data-/);
  await screen.getByRole("button", { name: "Reload" }).click();
  await expect(page.getByRole("textbox", { name: "Player name for Ana" })).toBeVisible();
});
