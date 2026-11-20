import { expect, test } from "@playwright/test";

// The on-screen keyboard must not cover a sheet's buttons (DECISIONS 2026-11-20). Android resizes the
// layout viewport through the viewport meta; iOS Safari only shrinks the visual viewport, which a
// headless browser cannot do — so the test replaces `visualViewport` with one it controls.

const KEYBOARD = 340;

test("the viewport meta asks Android to resize the page for the keyboard", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /interactive-widget=resizes-content/);
});

test("a keyboard that only shrinks the visual viewport lifts the sheet: Apply stays visible above it", async ({ page }) => {
  await page.addInitScript(() => {
    const target = new EventTarget();
    const fake = Object.assign(target, { height: window.innerHeight, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: fake });
  });
  await page.goto("./");
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
  await expect.poll(async () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--keyboard-inset"))).toBe("0px");
});
