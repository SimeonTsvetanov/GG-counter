import { expect, test, type Locator, type Page } from "@playwright/test";
import { openApp } from "../support/entry.ts";
import { stickyHeader } from "../support/host.ts";

// The on-screen keyboard must not cover a sheet's buttons (DECISIONS 2026-11-20). Android resizes the
// layout viewport through the viewport meta; iOS Safari only shrinks the visual viewport, which a
// headless browser cannot do — so the test replaces `visualViewport` with one it controls. The viewport
// meta for Android is the page's: tests/e2e/shell/keyboard.spec.ts.

const KEYBOARD = 340;

test("a keyboard that only shrinks the visual viewport lifts the sheet: Apply stays visible above it", async ({ page }) => {
  await page.addInitScript(() => {
    const target = new EventTarget();
    const fake = Object.assign(target, { height: window.innerHeight, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: fake });
  });
  const root = await openApp(page);
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill("Ana");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: /^Adjust score for Ana/ }).click();
  const dialog = page.getByRole("dialog", { name: "Adjust score" });
  const apply = dialog.getByRole("button", { name: "Apply" });
  await expect(apply).toBeVisible();

  const visible = await page.evaluate((keyboard) => {
    const viewport = window.visualViewport as unknown as EventTarget & { height: number };
    viewport.height = window.innerHeight - keyboard;
    viewport.dispatchEvent(new Event("resize"));
    return viewport.height;
  }, KEYBOARD);

  await expect.poll(async () => {
    const box = await apply.boundingBox();
    return box === null ? Number.POSITIVE_INFINITY : box.y + box.height;
  }).toBeLessThanOrEqual(visible);
  const top = (await dialog.boundingBox())?.y ?? -1;
  expect(top).toBeGreaterThanOrEqual(0);

  // Keyboard closed again: the sheet returns to the bottom edge.
  await page.evaluate(() => {
    const viewport = window.visualViewport as unknown as EventTarget & { height: number };
    viewport.height = window.innerHeight;
    viewport.dispatchEvent(new Event("resize"));
  });
  // Read on the screen's root: the property is set on <html> here and on the mount element in Quizzard,
  // and the root inherits it from <html>.
  await expect.poll(async () => root.evaluate((element) => getComputedStyle(element).getPropertyValue("--keyboard-inset"))).toBe("0px");
});

// SPEC 1.2 F19: the field you type in stays on screen. Each Add grows the grid above the Add card, which used to
// push the focused field under the keyboard.

/** Replaces `visualViewport` with one the test controls (as above), before the app starts. */
async function fakeViewport(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = new EventTarget();
    const fake = Object.assign(target, { height: window.innerHeight, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: fake });
  });
}

/** Opens the keyboard: the visual viewport loses `keyboard` px at the bottom. Returns the visible height. */
async function openKeyboard(page: Page, keyboard: number): Promise<number> {
  return page.evaluate((height) => {
    const viewport = window.visualViewport as unknown as EventTarget & { height: number };
    viewport.height = window.innerHeight - height;
    viewport.dispatchEvent(new Event("resize"));
    return viewport.height;
  }, keyboard);
}

/** Waits until every locator is between the header's bottom and `visible`. */
async function expectOnScreen(page: Page, locators: readonly Locator[], visible: number): Promise<void> {
  const header = (await stickyHeader(page).boundingBox())?.height ?? 0;
  for (const locator of locators) {
    await expect.poll(async () => {
      const box = await locator.boundingBox();
      return box !== null && box.y >= header - 1 && box.y + box.height <= visible + 1;
    }, { message: "field and button between the header and the keyboard" }).toBe(true);
  }
}

test("8 players in a row with the keyboard open: the field keeps focus and stays above the keyboard with Add", async ({ page }) => {
  await fakeViewport(page);
  await openApp(page);
  const field = page.getByRole("textbox", { name: "Player name", exact: true });
  const add = page.getByRole("button", { name: "Add", exact: true });
  await field.focus();
  const visible = await openKeyboard(page, KEYBOARD);
  for (let index = 1; index <= 8; index++) {
    await field.fill(`Player ${String(index)}`);
    // Enter and a tap on Add both keep the focus in the field (the keyboard would close otherwise).
    if (index % 2 === 0) await add.click();
    else await field.press("Enter");
    await expect(page.getByRole("textbox", { name: `Player name for Player ${String(index)}` })).toBeVisible();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("");
    await expectOnScreen(page, [field, add], visible);
  }
});

test("a player's name field focused under the keyboard moves above it", async ({ page }) => {
  await fakeViewport(page);
  await openApp(page);
  const field = page.getByRole("textbox", { name: "Player name", exact: true });
  for (const name of ["Ana", "Boris", "Chen", "Dana", "Emil", "Fia"]) {
    await field.fill(name);
    await field.press("Enter");
  }
  const visible = await openKeyboard(page, KEYBOARD);
  const rename = page.getByRole("textbox", { name: "Player name for Fia" });
  // Put the card's name field just under the keyboard's top, then tap it as a user would. The field is
  // inside the real viewport (the keyboard is simulated), so the tap itself scrolls nothing. A script
  // focus() is not used: mobile WebKit ignores it without a user gesture (CI 2026-11-22).
  await rename.evaluate((element, top) => {
    window.scrollBy({ top: element.getBoundingClientRect().top - top, behavior: "instant" });
  }, visible + 20);
  await rename.click();
  await expectOnScreen(page, [rename], visible);
});

// 1.2.3: on Moni's phone the page was pinch-zoomed by about 5 % and the reveal switched itself off.
test("a slightly zoomed page: the Add field still moves above the keyboard", async ({ page }) => {
  await fakeViewport(page);
  await openApp(page);
  const field = page.getByRole("textbox", { name: "Player name", exact: true });
  const add = page.getByRole("button", { name: "Add", exact: true });
  for (const name of ["Ana", "Boris", "Chen", "Dana"]) {
    await field.fill(name);
    await field.press("Enter");
  }
  await page.evaluate(() => { (window.visualViewport as unknown as { scale: number }).scale = 1.05; });
  await field.focus();
  const visible = await openKeyboard(page, KEYBOARD);
  await expectOnScreen(page, [field, add], visible);
});
