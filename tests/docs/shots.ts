// The screenshots the user docs use (forge-engineering → user-docs §6). The docs-writer agent adds
// one entry per image a page needs; `pnpm docs:images` writes docs/images/<page>/<name>-{light,dark}.png.
import type { Locator, Page } from "@playwright/test";

/**
 * Sample game (user-docs §5: real-looking, mixed names): each player's name and the amounts entered for
 * them, in the order they are entered. Liam's three amounts come last, more than 3 s apart (they stay three
 * changes and his card is the last-scored one, SPEC 1.1 F16–F17).
 */
const SAMPLE_GAME: readonly (readonly [string, readonly number[]])[] = [
  ["Maria", [34]],
  ["Liam", [10, 7, 10]],
  ["Aisha", [19]],
  ["Kenji", [12]],
  ["Elena", [8]],
];

/** Minutes between two entries, like turns at a table (and far over the 3 s in which changes merge). */
const PAUSE_MS = 3 * 60_000;

/** Adds `amount` for `name` through Adjust score. */
async function enterAmount(page: Page, name: string, amount: number): Promise<void> {
  await page.getByRole("button", { name: new RegExp(`^Adjust score for ${name}:`) }).click();
  const field = page.getByRole("spinbutton", { name: "Custom score adjustment" });
  await field.fill(String(amount));
  await field.press("Enter");
  await field.waitFor({ state: "hidden" });
}

/** Adds the sample players through the Add player card and enters their amounts through Adjust score. */
async function playSampleGame(page: Page): Promise<void> {
  const nameField = page.getByRole("textbox", { name: "Player name", exact: true });
  for (const [name] of SAMPLE_GAME) {
    await nameField.fill(name);
    await nameField.press("Enter");
  }
  const ordered = [...SAMPLE_GAME].sort(([a], [b]) => Number(a === "Liam") - Number(b === "Liam"));
  for (const [name, amounts] of ordered) {
    for (const amount of amounts) {
      await page.clock.fastForward(PAUSE_MS);
      await enterAmount(page, name, amount);
    }
  }
  // Focus went back to the last score button: no focus ring in the picture.
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
}

/** One docs image: where it goes, how to reach the state, and what to crop to. */
export interface DocsShot {
  /** Page folder under docs/images/, e.g. "manage-players" for docs/how-to/manage-players.md. */
  readonly page: string;
  /** Image name without theme suffix, e.g. "player-card". */
  readonly name: string;
  /** Viewport: "phone" (390×844) or "desktop" (1280×800). */
  readonly device: "phone" | "desktop";
  /** Brings the app into the state to capture (sample data only — never personal data). */
  readonly setUp: (page: Page) => Promise<void>;
  /** Part of the page to crop to; whole viewport when omitted. */
  readonly crop?: (page: Page) => Locator;
  /** Extra CSS pixels around the crop, for parts that stick out of it (the medals on the cards). */
  readonly cropMargin?: number;
  /** Parts to cover with a solid mask (personal or changing data). */
  readonly mask?: (page: Page) => Locator[];
  /** Keep toasts visible — only for an image that documents a toast (hidden by default). */
  readonly showToasts?: boolean;
}

/**
 * Every docs image, added by the docs-writer agent with the page that embeds it (an image no page
 * uses fails `pnpm docs:check`).
 */
export const DOCS_SHOTS: readonly DocsShot[] = [
  {
    page: "manage-players", name: "player-card", device: "phone",
    setUp: playSampleGame,
    crop: (page) => page.locator(".player-grid"), // medals, Liam's last-scored mark, compact cards (5 players)
    cropMargin: 16,
  },
  {
    page: "change-scores", name: "adjust-score", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      await playSampleGame(page);
      await page.getByRole("button", { name: /^Adjust score for Liam:/ }).click();
      await page.getByRole("spinbutton", { name: "Custom score adjustment" }).fill("-5");
    },
    crop: (page) => page.getByRole("dialog", { name: "Adjust score" }),
  },
  {
    page: "change-scores", name: "history", device: "phone",
    setUp: async (page: Page): Promise<void> => {
      await playSampleGame(page);
      await page.getByRole("button", { name: /^Score history for Liam/ }).click();
      await page.getByRole("button", { name: "Remove +10 from Liam's score" }).first().click();
    },
    crop: (page) => page.getByRole("dialog", { name: "Liam" }),
  },
  {
    page: "share-leaderboard", name: "leaderboard", device: "phone",
    setUp: playSampleGame,
    crop: (page) => page.locator(".card").filter({ has: page.getByRole("heading", { level: 2, name: "Leaderboard" }) }),
  },
  {
    page: "manage-your-data", name: "settings", device: "desktop",
    setUp: async (page: Page): Promise<void> => {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("menuitem", { name: "Settings" }).click();
      await page.getByRole("dialog", { name: "Settings" }).waitFor();
    },
    crop: (page) => page.getByRole("dialog", { name: "Settings" }),
  },
];
