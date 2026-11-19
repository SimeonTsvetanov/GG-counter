// The screenshots the user docs use (forge-engineering → user-docs §6). The docs-writer agent adds
// one entry per image a page needs; `pnpm docs:images` writes docs/images/<page>/<name>-{light,dark}.png.
import type { Locator, Page } from "@playwright/test";

/** Sample game (user-docs §5: real-looking, mixed names): name and score of each player. */
const SAMPLE_GAME: readonly (readonly [string, number])[] = [
  ["Maria", 34],
  ["Liam", 27],
  ["Aisha", 19],
  ["Kenji", 12],
  ["Elena", 8],
];

/** Adds the sample players through the Add player card and gives each their score through Adjust score. */
async function playSampleGame(page: Page): Promise<void> {
  const nameField = page.getByRole("textbox", { name: "Player name", exact: true });
  for (const [name] of SAMPLE_GAME) {
    await nameField.fill(name);
    await nameField.press("Enter");
  }
  for (const [name, score] of SAMPLE_GAME) {
    await page.getByRole("button", { name: new RegExp(`^Adjust score for ${name}:`) }).click();
    const amount = page.getByRole("spinbutton", { name: "Custom score adjustment" });
    await amount.fill(String(score));
    await amount.press("Enter");
    await amount.waitFor({ state: "hidden" });
  }
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
    crop: (page) => page.locator(".player-card").nth(1), // not the leader, whose card is tinted
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
