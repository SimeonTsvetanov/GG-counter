import { expect, test } from "@playwright/test";

// The on-screen keyboard must not cover a sheet's buttons (DECISIONS 2026-11-20). The page's part: Android
// resizes the layout viewport through the viewport meta. The screen's part (iOS Safari's visual viewport,
// the field kept above the keyboard) is in tests/e2e/miniapp/keyboard.spec.ts.

test("the viewport meta asks Android to resize the page for the keyboard", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /interactive-widget=resizes-content/);
});
