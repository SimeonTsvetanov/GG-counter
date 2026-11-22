// What the Scores screen reaches outside its own root — its header buttons, the host's toasts and share
// sheet, the language choice and the host's own storage keys — differs per host. Mini-app specs
// (tests/e2e/miniapp) find it only here: ONE place to adapt per host. The host comes from the
// Playwright project's `metadata.host` (Quizzard's `scores*` projects, PLAN T-13), else `E2E_HOST`,
// else "standalone".
import { expect, test, type Locator, type Page } from "@playwright/test";

/** A language the screen translates (contract `Lang`). */
export type ScreenLanguage = "en" | "bg";

/** Where a host keeps what the screen uses outside its root. */
interface HostUi {
  /** The app shared text names (its title line and last line) and its address. */
  readonly attribution: { readonly name: string; readonly url: string };
  /** The element the screen is mounted on (its blocks; Quizzard: also its overlays). */
  readonly root: (page: Page) => Locator;
  /** Where the screen's header buttons are (contract `slots.headerActions`). */
  readonly headerActions: (page: Page) => Locator;
  /** The sticky header the screen keeps a focused field below (use-reveal-while-focused.ts). */
  readonly stickyHeader: (page: Page) => Locator;
  /** Every toast region (contract `shell.toast`). */
  readonly toasts: (page: Page) => Locator;
  /** Finishes `shell.share` on a device without a share sheet, so the text ends up copied. */
  readonly copyWithoutShareSheet: (page: Page) => Promise<void>;
  /** The storage entries that make the host start in `lang` (seeded before the first load). */
  readonly savedLanguage: (lang: ScreenLanguage) => Record<string, string>;
  /** True for a localStorage key the host itself writes (not the screen's, not a foreign app's). */
  readonly isHostKey: (key: string) => boolean;
}

/** This repo's page (app/src): the screen is its `<main>`, overlays and toasts go to `<body>`. */
const STANDALONE: HostUi = {
  attribution: { name: "GG Counter", url: "https://simeontsvetanov.github.io/GG-counter/" },
  // The element, not the role: an open Radix modal hides `<main>` from the accessibility tree.
  root: (page) => page.locator("main"),
  // The whole page header, as the 1.2.1 check ("the header has no Share button") always looked at it.
  headerActions: (page) => page.locator("header"),
  stickyHeader: (page) => page.locator(".app-header"),
  // The page's region and the one inside an open dialog (app/src/ui/toast.tsx) are both `status`.
  toasts: (page) => page.getByRole("status"),
  // because app/src/ui/web-share.ts copies at once when there is no share sheet
  copyWithoutShareSheet: () => Promise.resolve(),
  savedLanguage: (lang) => ({ "gg-counter:v1:lang": JSON.stringify(lang) }),
  // because the page's own prefs (theme, lang, last-seen-version) are in the screen's area on purpose (meta.ts)
  isHostKey: () => false,
};

/**
 * Quizzard (app/index.html, app/src/miniapps/{outlet,context}.ts, app/src/ui/{toast,share}.ts at Quizzard
 * PLAN T-11): the outlet's `[data-miniapp="scores"]` holds the screen and its overlays; the header slot
 * is `[data-header-slot="scores"]`; without a share sheet `shareText` opens its WhatsApp + Copy sheet.
 */
const QUIZZARD: HostUi = {
  // Quizzard names itself in shared text (it passes `attribution-name` / `attribution-url` to the screen).
  attribution: { name: "Quizzard", url: "https://simeontsvetanov.github.io/Quizzard/" },
  root: (page) => page.locator('[data-miniapp="scores"]'),
  headerActions: (page) => page.locator('[data-header-slot="scores"]'),
  stickyHeader: (page) => page.locator("[data-header]"),
  toasts: (page) => page.locator("[data-toasts]"),
  // Quizzard's sheet stays open after Copy (its own shell behaviour): close it, or it covers the next tap.
  copyWithoutShareSheet: async (page) => {
    const sheet = page.locator('dialog[data-dialog="share"]');
    await sheet.getByRole("button", { name: "Copy" }).click();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();
  },
  savedLanguage: (lang) => ({ "quizzard:v1:lang": JSON.stringify(lang) }),
  isHostKey: (key) => key.startsWith("quizzard:v1:"),
};

const HOSTS = { standalone: STANDALONE, quizzard: QUIZZARD } as const satisfies Record<string, HostUi>;

function isHostName(name: string): name is keyof typeof HOSTS {
  return Object.hasOwn(HOSTS, name);
}

/**
 * Returns a setting of the run: the project's `metadata[name]` first (one value per Quizzard project),
 * then the environment variable (one value for every worker), else undefined.
 * @param name - the metadata key
 * @param variable - the environment variable
 * @throws {@link Error} `E2E_METADATA_INVALID` when the project sets the key to something not a string
 */
export function runSetting(name: string, variable: string): string | undefined {
  const value: unknown = test.info().project.metadata[name];
  if (value === undefined) return process.env[variable];
  if (typeof value !== "string") throw new Error(`E2E_METADATA_INVALID: project metadata "${name}" must be a string`);
  return value;
}

/**
 * Returns the UI of the host under test.
 * @throws {@link Error} `E2E_HOST_UNKNOWN` for a host that has no entry here
 */
function hostUi(): HostUi {
  const name = runSetting("host", "E2E_HOST") ?? "standalone";
  if (!isHostName(name)) throw new Error(`E2E_HOST_UNKNOWN: ${name} (known: ${Object.keys(HOSTS).join(", ")})`);
  return HOSTS[name];
}

/** Returns the element the Scores screen is mounted on. */
export function miniAppRoot(page: Page): Locator {
  return hostUi().root(page);
}

/** Returns the place of the screen's header buttons (contract `slots.headerActions`). */
export function headerActions(page: Page): Locator {
  return hostUi().headerActions(page);
}

/** Returns the host's sticky header. */
export function stickyHeader(page: Page): Locator {
  return hostUi().stickyHeader(page);
}

/** Returns the host's toast regions (contract `shell.toast`). */
export function toasts(page: Page): Locator {
  return hostUi().toasts(page);
}

/** Completes a share on a device without a share sheet: the host copies the text (contract `shell.share`). */
export function copyWithoutShareSheet(page: Page): Promise<void> {
  return hostUi().copyWithoutShareSheet(page);
}

/** Returns the storage entries that start the host in `lang`; pass them to `openApp({ storage })`. */
export function savedLanguage(lang: ScreenLanguage): Record<string, string> {
  return hostUi().savedLanguage(lang);
}

/** True for a localStorage key the host writes for itself. */
export function isHostKey(key: string): boolean {
  return hostUi().isHostKey(key);
}

/** Returns the app name and address the host puts in shared text. */
export function attribution(): HostUi["attribution"] {
  return hostUi().attribution;
}
