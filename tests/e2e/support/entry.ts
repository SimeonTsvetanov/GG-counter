// The one way a mini-app spec (tests/e2e/miniapp) opens and reloads the Scores screen, in whichever host
// runs the suite: this repo's standalone page, or Quizzard behind `#/scores` (its PLAN T-13: projects
// `scores*`). The route comes from the project's `metadata.miniappHash`, else `E2E_MINIAPP_HASH`, else
// none (standalone). Shell specs (tests/e2e/shell) are standalone-only and navigate directly.
import { expect, type Locator, type Page } from "@playwright/test";
import { miniAppRoot, runSetting } from "./host.ts";

/** Options of {@link openApp}. */
export interface OpenAppOptions {
  /** localStorage entries written before the first load of the test (not again on a reload). */
  readonly storage?: Readonly<Record<string, string>>;
  /** Launch parameters without `?` (contract `context.query`); the screen reads none today. */
  readonly query?: string;
}

/**
 * Returns the address of the screen relative to the baseURL.
 * @remarks Standalone the launch parameters are the page's query (`./?x=1`); behind a hash route they
 * follow the route (`./#/scores?x=1`), which is where Quizzard's router reads them.
 */
export function appUrl(query?: string): string {
  const hash = runSetting("miniappHash", "E2E_MINIAPP_HASH") ?? "";
  const search = query ? `?${query}` : "";
  return hash ? `./${hash}${search}` : `./${search}`;
}

/**
 * Writes `entries` to localStorage before the page's own scripts run, once per test: a reload (or a
 * second navigation) keeps what the app saved since.
 * @remarks Shell specs use it too, before their own `page.goto`.
 */
export async function seedStorage(page: Page, entries: Readonly<Record<string, string>>): Promise<void> {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, entries);
}

/**
 * Opens the Scores screen (with `storage` already saved, as a returning user has it) and waits until it
 * is on screen — Quizzard loads it as a lazy chunk.
 * @returns the screen's root; scope a locator to it where it could also match host UI
 */
export async function openApp(page: Page, { storage, query }: OpenAppOptions = {}): Promise<Locator> {
  if (storage !== undefined) await seedStorage(page, storage);
  await page.goto(appUrl(query));
  const root = miniAppRoot(page);
  await expect(root).toBeVisible();
  return root;
}

/**
 * Reloads the page — the hash route stays, so the same screen comes back — and waits until the screen's
 * root is visible again. Read saved data only after a web-first assertion on the screen's content.
 */
export async function reloadApp(page: Page): Promise<void> {
  await page.reload();
  await expect(miniAppRoot(page)).toBeVisible();
}
