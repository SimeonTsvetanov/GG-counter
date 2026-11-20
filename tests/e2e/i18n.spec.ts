import { expect, test, type Page } from "@playwright/test";
import { NEW_STATE_KEY, V1_STATE } from "../../packages/core/test/fixtures/saved-state";

// PLAN T-09: English + Bulgarian (forge DECISIONS 2026-11-06: no browser auto-detect). English is the
// default even in a Bulgarian browser (locale bg-BG); Bulgarian comes from the choice saved in Settings
// or `?lang=bg`. With Bulgarian saved, the first frame is already Bulgarian; the T-01 flows work in
// Bulgarian; Settings switches both ways without a reload and the choice survives one; <html lang>
// follows; the raw HTML stays English for crawlers. Desktop + phone.

test.use({ locale: "bg-BG" });

const LANG_KEY = "gg-counter:v1:lang";
/** The choice "Български" saved in Settings. */
const BULGARIAN = { [LANG_KEY]: "\"bg\"" };

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string> = {}, path = "./") {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, entries);
  await page.goto(path);
}

/** The V1 fixture (Ana 34, Boris 27, Чен −3) with Bulgarian saved. */
const withGame = { [NEW_STATE_KEY]: JSON.stringify(V1_STATE), ...BULGARIAN };
const saved = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null") as { players: { name: string; score: number }[] } | null, NEW_STATE_KEY);
const scoreOf = async (page: Page, name: string) => (await saved(page))?.players.find((p) => p.name === name)?.score;
const playerNames = (page: Page) => page.getByRole("textbox", { name: /^Име на играча / });
const menuButton = (page: Page) => page.locator("[data-menu-open]").first();

/** Adds a player through the Add card. */
async function addPlayer(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Име на играч", exact: true }).fill(name);
  await page.getByRole("button", { name: "Добави", exact: true }).click();
}

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

test("add, score, rename and remove with a confirmation — in Bulgarian", async ({ page }) => {
  await openWith(page, BULGARIAN);
  await addPlayer(page, "Ана");
  await addPlayer(page, "  Борис  ");
  await addPlayer(page, "   ");
  await expect(playerNames(page)).toHaveCount(2);
  await expect(page.getByText("2 играчи").first()).toBeVisible();

  await page.getByRole("button", { name: "Увеличи точките на Ана" }).click();
  await page.getByRole("button", { name: "Намали точките на Борис" }).click();
  await page.getByRole("button", { name: "Промени точките на Ана" }).click();
  const dialog = page.getByRole("dialog", { name: "Промени точките" });
  await dialog.getByRole("spinbutton", { name: "Промяна на точките" }).fill("12");
  await dialog.getByRole("button", { name: "Приложи" }).click();
  await expect.poll(() => scoreOf(page, "Ана")).toBe(13);
  await expect.poll(() => scoreOf(page, "Борис")).toBe(-1);
  // The closing dialog gives focus back to the score button; typing before that would be blurred mid-rename.
  await expect(dialog).toBeHidden();

  await page.getByRole("textbox", { name: "Име на играча Борис" }).fill("Боби");
  await page.getByRole("textbox", { name: "Име на играча Борис" }).press("Enter");
  await expect.poll(() => scoreOf(page, "Боби")).toBe(-1);
  await page.getByRole("button", { name: "Премахни Ана" }).click();
  // 1.1 (SPEC F14, DECISIONS 2026-11-20): the alert asks what to remove; "Играча и точките" is the default.
  const confirm = page.getByRole("alertdialog", { name: "Да се премахне ли играчът или точките?" });
  await expect(confirm).toContainText("Изберете какво да се премахне за Ана.");
  await expect(confirm.getByRole("radio", { name: "Играча и точките" })).toBeChecked();
  await expect(confirm.getByRole("radio", { name: "Само точките" })).not.toBeChecked();
  await confirm.getByRole("button", { name: "Премахни", exact: true }).click();
  await expect(playerNames(page)).toHaveCount(1);
  await expect(page.getByText("1 играч", { exact: true }).first()).toBeVisible();
});

test("leaderboard, share text and clear session — in Bulgarian", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: (data: { text: string }) => { (window as unknown as { shared: string }).shared = data.text; return Promise.resolve(); } });
  });
  await openWith(page, withGame);
  await page.getByRole("button", { name: "Отвори класирането" }).first().click();
  const board = page.getByRole("dialog", { name: "Класиране" });
  await expect(board).toContainText("🥇 Ana");
  await expect(board).toContainText("34 точки");
  await board.getByRole("button", { name: "Сподели" }).click();
  const text = await page.waitForFunction(() => (window as unknown as { shared?: string }).shared).then((handle) => handle.jsonValue());
  const lines = String(text).split("\n");
  expect(lines.slice(0, 8)).toEqual(["🏆 Класиране в GG Counter", "", "🥇 1-во — Ana (34 точки)", "🥈 2-ро — Boris (27 точки)", "🥉 3-то — Чен (-3 точки)", "", "🎯 Общо точки: 58", "👥 Играчи: 3"]);
  expect(lines[8]).toMatch(/^🕒 Към \d{1,2}\.\d{2}\.\d{4}/);

  await page.getByRole("button", { name: "Изчисти сесията" }).first().click();
  const clear = page.getByRole("alertdialog", { name: "Да се изчисти ли сесията?" });
  await clear.getByRole("button", { name: "Отказ" }).click();
  await expect(playerNames(page)).toHaveCount(3);
  await page.getByRole("button", { name: "Изчисти сесията" }).first().click();
  // 1.1 (SPEC F13): the default option "Играчите и точките" clears everything, as before.
  await expect(clear.getByRole("radio", { name: "Играчите и точките" })).toBeChecked();
  await clear.getByText("Само точките").click();
  await expect(clear.getByRole("button").last()).toHaveText("Нулирай");
  await clear.getByText("Играчите и точките").click();
  await clear.getByRole("button", { name: "Изчисти", exact: true }).click();
  await expect(playerNames(page)).toHaveCount(0);
});

test("limit messages say why — in Bulgarian, with Bulgarian number grouping", async ({ page }) => {
  const one = { players: [{ id: "p1", name: "Ана", score: 999_999, createdAt: "2026-11-19T10:00:00.000Z" }], lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(one), ...BULGARIAN });
  await addPlayer(page, "А".repeat(41));
  await expect(page.getByRole("alert").filter({ hasText: "Имената могат да са до 40 знака. Съкратете името и опитайте отново." })).toBeVisible();
  await page.getByRole("button", { name: "Увеличи точките на Ана" }).click();
  // \s: Bulgarian groups digits with a no-break space.
  await expect(page.getByRole("alert").filter({ hasText: /^Точките са от -999\s999 до 999\s999\. Тази промяна излиза извън границата\.$/ })).toBeVisible();

  const fifty = { players: Array.from({ length: 50 }, (_, index) => ({ id: `p${String(index)}`, name: `И${String(index)}`, score: 0, createdAt: "2026-11-19T10:00:00.000Z" })), lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
  await page.evaluate(([key, value]) => { localStorage.setItem(key, value); }, [NEW_STATE_KEY, JSON.stringify(fifty)] as const);
  await page.reload();
  await addPlayer(page, "Дана");
  await expect(page.getByText("В една игра може да има до 50 играчи. Премахнете играч, за да добавите друг.")).toBeVisible();
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
