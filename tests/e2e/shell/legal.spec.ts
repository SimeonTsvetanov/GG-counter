import { expect, test, type Page } from "@playwright/test";
import { app } from "../../../app.config.ts";

// PLAN T-10 (app-shell → legal-pages §1): Terms, Privacy, AI notice, Legal notice and Support open as
// dialogs from the menu and the footer with the keyboard, open by deep link, and exist as standalone
// pages under the same base path that load directly, offline, and lead back to the app. Desktop + phone.

/** Each policy entry: its menu/footer label, a typeahead prefix without spaces, its page and dialog title. */
const ENTRIES = [
  { label: "Terms", typeahead: "Ter", page: "terms", title: "Terms & Conditions" },
  { label: "Privacy", typeahead: "Pri", page: "privacy", title: "Privacy" },
  { label: "AI notice", typeahead: "AI", page: "ai-notice", title: "AI notice" },
  { label: "Legal notice", typeahead: "Leg", page: "legal-notice", title: "Legal notice" },
  { label: "Contact", typeahead: "Con", page: "support", title: "Support" },
] as const;

const menuButton = (page: Page) => page.locator("[data-menu-open]").first();
const footer = (page: Page) => page.getByRole("contentinfo");

/** Opens the app and reloads once so the service worker controls the page (as in pwa.spec.ts). */
async function openControlled(page: Page): Promise<void> {
  await page.goto("./");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test("every policy entry opens from the menu with the keyboard, and focus comes back to the menu button", async ({ page }) => {
  await page.goto("./");
  for (const entry of ENTRIES) {
    await menuButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: entry.label, exact: true })).toBeVisible();
    await page.keyboard.type(entry.typeahead);
    await expect(page.getByRole("menuitem", { name: entry.label, exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: entry.title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Last updated:");
    await expect(dialog.getByRole("link", { name: "Open as a page" })).toHaveAttribute("href", `./${entry.page}/`);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menuButton(page)).toBeFocused();
  }
});

test("every policy link of the footer opens its dialog with the keyboard and gives the focus back", async ({ page }) => {
  await page.goto("./");
  for (const entry of ENTRIES) {
    const link = footer(page).getByRole("link", { name: entry.label, exact: true });
    await expect(link).toHaveAttribute("href", `./${entry.page}/`);
    await link.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: entry.title, exact: true });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(link).toBeFocused();
  }
  await expect(page).toHaveURL(/\/GG-counter\/$/);
});

test("the Privacy dialog shows the whole text; its links open other dialogs in place; #privacy deep-links", async ({ page }) => {
  await page.goto("./#privacy");
  const privacy = page.getByRole("dialog", { name: "Privacy", exact: true });
  await expect(privacy).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
  await expect(privacy.getByRole("heading", { name: "When data reaches us (GDPR Art. 13)" })).toBeVisible();
  await expect(privacy).toContainText("local storage");
  await expect(privacy.getByRole("link", { name: app.contact.email }).first()).toHaveAttribute("href", `mailto:${app.contact.email}`);
  await page.keyboard.press("Escape");

  // Legal notice → Terms opens the Terms dialog instead of leaving the app.
  await page.goto("./#legal-notice");
  await page.getByRole("dialog", { name: "Legal notice" }).getByRole("link", { name: "Terms", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Terms & Conditions" })).toBeVisible();
  await expect(page).toHaveURL(/\/GG-counter\/$/);
});

test("Help links to Privacy and Support; About links to the full licence texts", async ({ page, request }) => {
  await page.goto("./#help/privacy");
  await page.getByRole("dialog", { name: "Help" }).getByRole("button", { name: "Read the privacy policy" }).click();
  await expect(page.getByRole("dialog", { name: "Privacy", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("./#help/contact");
  await page.getByRole("dialog", { name: "Help" }).getByRole("button", { name: "Support page" }).click();
  await expect(page.getByRole("dialog", { name: "Support", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("./#about");
  const licences = page.getByRole("dialog", { name: `About ${app.name}` }).getByRole("link", { name: "Full licence texts" });
  await expect(licences).toHaveAttribute("href", "./third-party-licenses.txt");
  const response = await request.get("./third-party-licenses.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("react 19.2.0 — MIT");
});

test("each standalone policy page loads directly, has its text, the email and the way back to the app", async ({ page }) => {
  for (const entry of ENTRIES) {
    const response = await page.goto(`./${entry.page}/`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${entry.title} · ${app.name}`);
    await expect(page.getByRole("heading", { level: 1, name: entry.title })).toBeVisible();
    await expect(page.getByText(/^Last updated: \d{1,2} [A-Z][a-z]+ \d{4}$/)).toBeVisible();
    await expect(page.locator(`link[rel="canonical"]`)).toHaveAttribute("href", `${app.url}${entry.page}/`);
    const nav = page.getByRole("navigation", { name: "More about this app" });
    for (const other of ENTRIES) await expect(nav.getByRole("link", { name: other.label, exact: true })).toHaveAttribute("href", `/GG-counter/${other.page}/`);
  }
  // year.js assembles the email (never plain text in the HTML).
  await page.goto("./privacy/");
  await expect(page.getByRole("link", { name: app.contact.email }).first()).toHaveAttribute("href", `mailto:${app.contact.email}`);
  await page.getByRole("link", { name: `Back to ${app.name}` }).click();
  await expect(page.getByRole("textbox", { name: "Player name", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/GG-counter\/$/);
});

test("offline: the standalone policy pages open from the service worker and lead back to the app", async ({ page, context }) => {
  await openControlled(page);
  await context.setOffline(true);
  for (const entry of ENTRIES) {
    await page.goto(`./${entry.page}/`);
    await expect(page.getByRole("heading", { level: 1, name: entry.title })).toBeVisible();
  }
  await page.getByRole("link", { name: app.name }).first().click();
  await expect(page.getByRole("textbox", { name: "Player name", exact: true })).toBeVisible();
  await context.setOffline(false);
});

test.describe("in Bulgarian", () => {
  test.use({ locale: "bg-BG" });

  test("labels are Bulgarian, the policy text stays English and is marked lang=en", async ({ page }) => {
    await page.goto("./?lang=bg");
    await menuButton(page).click();
    await page.getByRole("menuitem", { name: "Поверителност", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Поверителност" });
    await expect(dialog).toContainText("Текстът е само на английски.");
    await expect(dialog.locator('[lang="en"]')).toContainText("Stored on your device only");
    await expect(dialog.getByRole("link", { name: "Отвори като страница" })).toHaveAttribute("href", "./privacy/");
    await page.keyboard.press("Escape");
    await expect(footer(page).getByRole("link", { name: "Условия за ползване" })).toHaveAttribute("href", "./terms/");
  });
});
