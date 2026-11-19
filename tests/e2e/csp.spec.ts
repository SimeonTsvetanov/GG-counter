import { expect, test, type Page } from "@playwright/test";
import { app } from "../../app.config.ts";
import { NEW_STATE_KEY, V1_STATE } from "../../packages/core/test/fixtures/saved-state";

// Security §1: the meta CSP of scripts/csp.ts must not block anything the app does. Every test records
// `securitypolicyviolation` events (all pages, also after navigations) and the browser's CSP console
// errors, and fails on any of them — main flows, dialogs, menus, Bulgarian, offline and the static pages.

/** Starts recording CSP violations of every document the page loads; returns the live list. */
async function watchCsp(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction("reportCspViolation", (text: string) => { violations.push(text); });
  await page.addInitScript(() => {
    const report = (window as unknown as { reportCspViolation: (text: string) => void }).reportCspViolation;
    document.addEventListener("securitypolicyviolation", (e) => {
      report(`${e.effectiveDirective} blocked ${e.blockedURI || "inline"} (${e.sourceFile}:${String(e.lineNumber)}) on ${document.location.pathname}`);
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  return violations;
}

/** Opens the app with `entries` in localStorage (seeded once per test, not on reload). */
async function openWith(page: Page, entries: Record<string, string> = {}, path = "./"): Promise<void> {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, entries);
  await page.goto(path);
}

const menuButton = (page: Page) => page.locator("[data-menu-open]").first();

/** The page's scroll as the scroll lock of Radix modals leaves it (app/src/lib/style-singleton.ts). */
const bodyOverflow = (page: Page) => page.evaluate(() => getComputedStyle(document.body).overflow);

/** Opens a menu entry with the mouse, checks its dialog and the page's scroll lock, and closes it with Escape. */
async function openAndClose(page: Page, item: string, dialogName: string): Promise<void> {
  await menuButton(page).click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: dialogName, exact: true });
  await expect(dialog).toBeVisible();
  await expect.poll(() => bodyOverflow(page)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect.poll(() => bodyOverflow(page)).not.toBe("hidden");
}

/** Opens the app and reloads once so the service worker controls the page (as tests/e2e/pwa.spec.ts). */
async function openControlled(page: Page): Promise<void> {
  await page.goto("./");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test("the game, its dialogs, every menu entry and a theme change raise no CSP violation", async ({ page }) => {
  const violations = await watchCsp(page);
  await openWith(page);
  for (const name of ["Ana", "Boris"]) {
    await page.getByRole("textbox", { name: "Player name", exact: true }).fill(name);
    await page.getByRole("button", { name: "Add", exact: true }).click();
  }
  await page.getByRole("button", { name: "Increase score for Ana" }).click();
  await page.getByRole("button", { name: "Adjust score for Boris" }).click();
  const adjust = page.getByRole("dialog", { name: "Adjust score" });
  await adjust.getByRole("spinbutton").fill("5");
  await adjust.getByRole("button", { name: "Apply" }).click();
  await expect(adjust).toBeHidden();

  for (const [item, dialog] of [["Help", "Help"], ["What's new", "What's new"], ["About", `About ${app.name}`], ["Report a problem", "Report a problem"], ["Privacy", "Privacy"]] as const) {
    await openAndClose(page, item, dialog);
  }
  await menuButton(page).click();
  await page.getByRole("menuitem", { name: "Settings", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "Settings" });
  await settings.getByText("Dark", { exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await settings.getByRole("button", { name: "Clear my data" }).click();
  const confirm = page.getByRole("alertdialog", { name: "Delete all your data?" });
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();
  expect(violations).toEqual([]);
});

test("Bulgarian (the lazy language chunk) and its dialogs raise no CSP violation", async ({ page }) => {
  const violations = await watchCsp(page);
  await openWith(page, { [NEW_STATE_KEY]: JSON.stringify(V1_STATE), "gg-counter:v1:lang": "\"bg\"" });
  await expect(page.getByRole("button", { name: "Промени точките на Ana" })).toBeVisible();
  await page.getByRole("button", { name: "Промени точките на Ana" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  for (const hash of ["#help", "#settings", "#about", "#privacy"]) {
    await page.goto(`./${hash}`);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  await menuButton(page).click();
  await expect(page.getByRole("menu")).toBeVisible();
  expect(violations).toEqual([]);
});

test("offline: the reload, a lazy dialog and the offline 404 page raise no CSP violation", async ({ page, context }) => {
  const violations = await watchCsp(page);
  await openControlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Player name", exact: true })).toBeVisible();
  await openAndClose(page, "Help", "Help");
  await page.goto("./no-such-page/");
  await expect(page.getByRole("link", { name: `Open ${app.name}` })).toBeVisible();
  await context.setOffline(false);
  expect(violations).toEqual([]);
});

test("the policy pages and the 404 page raise no CSP violation", async ({ page }) => {
  const violations = await watchCsp(page);
  for (const path of ["terms", "privacy", "ai-notice", "legal-notice", "support"]) {
    await page.goto(`./${path}/`);
    await expect(page.locator("[data-year]").first()).toHaveText(String(new Date().getFullYear()));
  }
  await page.goto("./no-such-page/");
  await expect(page.getByRole("link", { name: `Open ${app.name}` })).toBeVisible();
  expect(violations).toEqual([]);
});
