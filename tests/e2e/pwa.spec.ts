import { expect, test, type Page } from "@playwright/test";
import { app } from "../../app.config.ts";

// PLAN T-08 (pwa → pwa §3–5): offline after the first visit, the offline-only fallback, and updates
// that wait for the user's Reload. Service workers run in Chromium (both projects here).

/** Opens the app and reloads once so the service worker controls the page. */
async function openControlled(page: Page): Promise<void> {
  await page.goto("./");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test("offline: the app reloads, Help (a lazy chunk) opens, and an unsaved address shows our page", async ({ page, context }) => {
  await openControlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Player name", exact: true })).toBeVisible();
  await page.goto("./?from=home-screen");
  await expect(page.getByRole("textbox", { name: "Player name", exact: true })).toBeVisible();
  await page.locator("[data-menu-open]").first().click();
  await page.getByRole("menuitem", { name: "Help" }).click();
  await expect(page.getByRole("dialog", { name: "Help" })).toBeVisible();
  await page.goto("./no-such-page/");
  await expect(page.getByRole("link", { name: `Open ${app.name}` })).toBeVisible();
  await context.setOffline(false);
});

test("online: a file the service worker did not save comes from the network, not the app or the 404 page", async ({ page }) => {
  await openControlled(page);
  const sitemap = await page.goto("./sitemap.xml");
  expect(sitemap?.headers()["content-type"]).toContain("xml");
  expect(await sitemap?.text()).toContain("<urlset");
  const missing = await page.goto("./no-such-page/");
  expect(missing?.status()).toBe(404);
});

test("a new version waits for the user: the toast offers Reload and only that applies it", async ({ page, context }) => {
  // Needs the `vite preview` seam that serves a changed sw.js; the live site cannot produce a new version on demand.
  test.skip(Boolean(process.env.E2E_BASE_URL), "runs only against the local preview server");
  await openControlled(page);
  const before = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL);
  // A changed sw.js = a new deploy (the preview server adds a comment for this cookie, app/vite.config.ts).
  await context.addCookies([{ name: "e2e-next-deploy", value: String(Date.now()), url: page.url() }]);
  await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
  const toast = page.getByRole("status").filter({ hasText: "New version available" });
  await expect(toast).toBeVisible({ timeout: 15_000 });
  // Nothing reloads by itself: the waiting worker stays waiting while the game goes on.
  await page.getByRole("textbox", { name: "Player name", exact: true }).fill("Ana");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.waiting !== null)).toBe(true);

  const reloaded = page.waitForEvent("load");
  await toast.getByRole("button", { name: "Reload" }).click();
  await reloaded;
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.waiting ?? null)).toBeNull();
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toBe(before);
  await expect(page.getByRole("textbox", { name: "Player name for Ana" })).toBeVisible();
});
