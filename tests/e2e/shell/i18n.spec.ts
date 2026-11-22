import { expect, test, type Page } from "@playwright/test";
import { NEW_STATE_KEY, V1_STATE } from "../../../packages/core/test/fixtures/saved-state";
import { seedStorage } from "../support/entry.ts";

// PLAN T-09: English + Bulgarian (forge DECISIONS 2026-11-06: no browser auto-detect). English is the
// default even in a Bulgarian browser (locale bg-BG); Bulgarian comes from the choice saved in Settings
// or `?lang=bg`. With Bulgarian saved, the first frame is already Bulgarian; Settings switches both ways
// without a reload and the choice survives one; <html lang> follows; the raw HTML stays English for
// crawlers. The T-01 flows in Bulgarian are the screen's: tests/e2e/miniapp/i18n.spec.ts. Desktop + phone.

test.use({ locale: "bg-BG" });

const LANG_KEY = "gg-counter:v1:lang";
/** The choice "Български" saved in Settings. */
const BULGARIAN = { [LANG_KEY]: "\"bg\"" };

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string> = {}) {
  await seedStorage(page, entries);
  await page.goto("./");
}

/** The V1 fixture (Ana 34, Boris 27, Чен −3) with Bulgarian saved. */
const withGame = { [NEW_STATE_KEY]: JSON.stringify(V1_STATE), ...BULGARIAN };
const menuButton = (page: Page) => page.locator("[data-menu-open]").first();

/** Opens a menu entry with the mouse. */
async function openFromMenu(page: Page, item: string) {
  await menuButton(page).click();
  await page.getByRole("menuitem", { name: item }).click();
}

test("a Bulgarian browser with nothing saved starts in English (no auto-detect)", async ({ page }) => {
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(V1_STATE) });
  await expect(page.getByRole("button", { name: "Adjust score for Ana" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(await page.evaluate((key) => localStorage.getItem(key), LANG_KEY)).toBeNull();
});

test("with Bulgarian saved, the first frame is Bulgarian: no English text ever shows in the app", async ({ page }) => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { seen: string[] }).seen = seen;
    // innerText = what is rendered; textContent would include the <noscript> source, never shown with JavaScript on.
    new MutationObserver(() => { seen.push(document.getElementById("root")?.innerText ?? ""); }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await openWith(page, withGame);
  await expect(page.getByRole("button", { name: "Промени точките на Ana" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "bg");
  await expect(page.getByRole("heading", { name: "Как работи" })).toBeAttached();
  const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen);
  expect(seen.length).toBeGreaterThan(0);
  for (const english of ["Add Player", "Leaderboard", "How it works", "Frequently asked questions", "pts"]) {
    expect(seen.some((text) => text.includes(english)), english).toBe(false);
  }
});

test("Settings switches the language both ways without a reload; the choice survives a reload", async ({ page }) => {
  await openWith(page, withGame);
  await page.evaluate(() => { (window as unknown as { samePage: boolean }).samePage = true; });
  await openFromMenu(page, "Настройки");
  const settings = page.getByRole("dialog", { name: "Настройки" });
  await expect(settings.getByRole("radio", { name: "Български" })).toBeChecked();
  await settings.getByText("English", { exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Adjust score for Ana" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How it works" })).toBeAttached();
  expect(await page.evaluate(() => (window as unknown as { samePage?: boolean }).samePage)).toBe(true);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Adjust score for Ana" })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), LANG_KEY)).toBe("\"en\"");

  await openFromMenu(page, "Settings");
  await page.getByRole("dialog", { name: "Settings" }).getByText("Български", { exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Настройки" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "bg");
  await page.reload();
  await expect(page.getByRole("button", { name: "Промени точките на Ana" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "bg");
});

test("Help shows the Bulgarian texts of app.config.ts; the raw HTML stays English for crawlers", async ({ page, request }) => {
  await openWith(page, BULGARIAN);
  await openFromMenu(page, "Помощ");
  const help = page.getByRole("dialog", { name: "Помощ" });
  await expect(help.getByText("Безплатен ли е GG Counter?", { exact: true })).toBeAttached();
  await expect(help.getByText("До 50 играчи в една игра.", { exact: true })).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-text=faq] summary").first()).toHaveText("Безплатен ли е GG Counter?");

  const html = await (await request.get("./")).text();
  expect(html).toMatch(/<html lang="en"/);
  expect(html).toContain("Is GG Counter free?");
  expect(html).not.toMatch(/hreflang|[А-Яа-я]/);
});

test.describe("an English browser", () => {
  test.use({ locale: "en-US" });

  test("starts in English; ?lang=bg shows Bulgarian for this visit without saving it", async ({ page }) => {
    await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(V1_STATE) });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("button", { name: "Adjust score for Ana" })).toBeVisible();
    await page.goto("./?lang=bg");
    await expect(page.locator("html")).toHaveAttribute("lang", "bg");
    await expect(page.getByRole("button", { name: "Промени точките на Ana" })).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), LANG_KEY)).toBeNull();
  });

  test("Clear my data forgets the language choice: the app is back in English", async ({ page }) => {
    await openWith(page, withGame);
    await expect(page.locator("html")).toHaveAttribute("lang", "bg");
    await openFromMenu(page, "Настройки");
    await page.getByRole("dialog", { name: "Настройки" }).getByRole("button", { name: "Изтрий данните ми" }).click();
    await page.getByRole("alertdialog", { name: "Да се изтрият ли всички данни?" }).getByRole("button", { name: "Изтрий" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), LANG_KEY)).toBeNull();
  });
});
