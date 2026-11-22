import { expect, test, type Page } from "@playwright/test";
import { NEW_STATE_KEY, V1_STATE } from "../../../packages/core/test/fixtures/saved-state";
import { openApp, reloadApp } from "../support/entry.ts";
import { attribution, savedLanguage } from "../support/host.ts";

// PLAN T-09: the game screen in Bulgarian — the T-01 flows, the share text and the limit messages with
// Bulgarian labels and number grouping, in a Bulgarian browser (locale bg-BG). How the language is chosen
// (no auto-detect, Settings, `?lang=bg`, <html lang>, the first frame) is the page's:
// tests/e2e/shell/i18n.spec.ts. Desktop + phone.

test.use({ locale: "bg-BG" });

/** The host's saved choice "Български" (this page: Settings → Language); read inside a test (support/host.ts). */
const bulgarian = () => savedLanguage("bg");

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string>): Promise<void> {
  await openApp(page, { storage: entries });
}

/** The V1 fixture (Ana 34, Boris 27, Чен −3) with Bulgarian saved. */
const withGame = () => ({ [NEW_STATE_KEY]: JSON.stringify(V1_STATE), ...bulgarian() });
const saved = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null") as { players: { name: string; score: number }[] } | null, NEW_STATE_KEY);
const scoreOf = async (page: Page, name: string) => (await saved(page))?.players.find((p) => p.name === name)?.score;
const playerNames = (page: Page) => page.getByRole("textbox", { name: /^Име на играча / });

/** Adds a player through the Add card. */
async function addPlayer(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Име на играч", exact: true }).fill(name);
  await page.getByRole("button", { name: "Добави", exact: true }).click();
}

test("add, score, rename and remove with a confirmation — in Bulgarian", async ({ page }) => {
  await openWith(page, bulgarian());
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
  // The closing dialog gives focus back to the score button (Radix does it a tick after the dialog is gone);
  // typing before that would be blurred mid-rename, so wait for the focus itself.
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Промени точките на Ана: 13" })).toBeFocused();

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
  await openWith(page, withGame());
  await page.getByRole("button", { name: "Отвори класирането" }).first().click();
  const board = page.getByRole("dialog", { name: "Класиране" });
  await expect(board).toContainText("🥇 Ana");
  await expect(board).toContainText("34 точки");
  await board.getByRole("button", { name: "Сподели" }).click();
  const text = await page.waitForFunction(() => (window as unknown as { shared?: string }).shared).then((handle) => handle.jsonValue());
  const lines = String(text).split("\n");
  // 1.2 (SPEC F21): the new text in Bulgarian words; the attribution with the app link stays English.
  expect(lines[0]).toBe(`🏆 ${attribution().name} — Класиране`);
  expect(lines[1]).toMatch(/^📅 \d{1,2}\.\d{2}\.\d{4}/);
  expect(lines.slice(2)).toEqual([
    "",
    "🥇 34 · Ana",
    "🥈 27 · Boris",
    "🥉 −3 · Чен",
    "",
    "👑 Победител: Ana — 34 точки",
    "👥 3 играчи · общо 58 точки",
    "",
    `— Made with ${attribution().name} · ${attribution().url}`,
  ]);

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
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(one), ...bulgarian() });
  await addPlayer(page, "А".repeat(41));
  await expect(page.getByRole("alert").filter({ hasText: "Имената могат да са до 40 знака. Съкратете името и опитайте отново." })).toBeVisible();
  await page.getByRole("button", { name: "Увеличи точките на Ана" }).click();
  // \s: Bulgarian groups digits with a no-break space.
  await expect(page.getByRole("alert").filter({ hasText: /^Точките са от -999\s999 до 999\s999\. Тази промяна излиза извън границата\.$/ })).toBeVisible();

  const fifty = { players: Array.from({ length: 50 }, (_, index) => ({ id: `p${String(index)}`, name: `И${String(index)}`, score: 0, createdAt: "2026-11-19T10:00:00.000Z" })), lastUpdated: "2026-11-19T10:00:00.000Z", version: 1 };
  await page.evaluate(([key, value]) => { localStorage.setItem(key, value); }, [NEW_STATE_KEY, JSON.stringify(fifty)] as const);
  await reloadApp(page);
  await addPlayer(page, "Дана");
  await expect(page.getByText("В една игра може да има до 50 играчи. Премахнете играч, за да добавите друг.")).toBeVisible();
});
