import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { app } from "../../../app.config.ts";
import { NEW_STATE_KEY, V1_STATE, V1_STATE_READ } from "../../../packages/core/test/fixtures/saved-state";
import { seedStorage } from "../support/entry.ts";

// PLAN T-08: the app shell — menu (keyboard), Settings (theme, export → clear → import), Help, What's
// new, About, Report a problem and the error screen. Desktop + phone. The limit messages are the
// screen's: tests/e2e/miniapp/limits.spec.ts.

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string> = {}) {
  await seedStorage(page, entries);
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

test("ArrowDown + Enter (and typing a label + Enter) opens the item that has the focus, every time", async ({ page }) => {
  // Regression (PLAN T-08 review): Radix moves menu focus in a timer, so a quick Enter clicked the old item.
  await openWith(page);
  // The second item of the first group is Settings (app.config.ts shell.menu).
  expect(app.shell.menu[0].items[1]).toBe("settings");
  const label = "Settings";
  for (const how of ["ArrowDown", "ArrowDown", "ArrowDown", "type", "type"] as const) {
    await menuButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Help" })).toBeFocused();
    if (how === "ArrowDown") await page.keyboard.press("ArrowDown");
    else await page.keyboard.type(label);
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: label });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Help" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menuButton(page)).toBeFocused();
  }
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
  // 1.1 (DECISIONS 2026-11-20): the export carries each player's score history (empty for a 1.0.0 game).
  expect(exported.data.state.players).toEqual(V1_STATE_READ.players);

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
  // The newest numbered release is this build's version (release chapter §7: What's new shows it).
  await expect(whatsNew.getByRole("heading", { name: new RegExp(`^${app.version.replace(/\./g, "\\.")} · \\d{4}-\\d{2}-\\d{2}$`) })).toBeVisible();
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
