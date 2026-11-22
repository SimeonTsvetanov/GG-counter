/**
 * app.config.ts — the single source of truth for GG Counter (APP-STANDARD §0, app-shell §1).
 * The static head and page text of app/index.html, the PWA manifest, sitemap.xml, llms.txt,
 * robots.txt and 404.html are generated from this object (scripts/generate.ts, app/vite.config.ts).
 * Only the sections this app uses: no embed, API, MCP or n8n (DECISIONS 2026-11-19); the one URL
 * parameter is `?lang=` (PLAN T-09, app-shell → i18n), never in the sitemap or canonical.
 * The steps, features and FAQ live in the game screen's package (packages/miniapp/src/help/), which
 * Quizzard's Help reads too; this file takes them from there (Bulgarian only into `l10n`, so it stays out
 * of the first load).
 */
import { faqBg, featureNamesBg, stepsBg } from "gg-counter-miniapp/help/bg";
import { faqEn, featureNamesEn, stepsEn } from "gg-counter-miniapp/help/en";

/** One question of the FAQ: shown in `<details>`, in the FAQPage JSON-LD and in llms.txt. */
export interface FaqItem {
  readonly q: string;
  readonly a: string;
}

/** A UI language: English is the default and the fallback (app-shell → i18n). */
export type LanguageCode = "en" | "bg";

/** The page and Help texts of `app` in another UI language: same number of steps, features and FAQ items. */
export interface AppText {
  readonly tagline: string;
  readonly description: string;
  readonly answer: string;
  readonly steps: readonly string[];
  readonly features: readonly string[];
  readonly faq: readonly FaqItem[];
}

/** The fields of the PWA manifest that installed copies depend on (SPEC §4 — never change `id`). */
export interface ManifestConfig {
  /** Manifest `id` of the pre-forge app; a new id would make installed copies a different app. */
  readonly id: string;
  readonly shortName: string;
  readonly display: "standalone";
  readonly orientation: "portrait-primary";
}

/**
 * The entries the app shell knows (app-shell §3). Each id has a label (`shell.menu.items.<id>` in
 * app/src/i18n/en.ts) and an action (app/src/ui/shell-items.ts); both are checked by the compiler.
 * The policy entries (PLAN T-10) open content/legal/<page>.md as a dialog; `contact` opens the Support page.
 */
export type ShellItemId =
  | "help"
  | "settings"
  | "whats-new"
  | "share-app"
  | "install"
  | "report"
  | "about"
  | "terms"
  | "privacy"
  | "ai-notice"
  | "legal-notice"
  | "contact"
  | "support"
  | "source";

/** One group of the menu, in the order of app-shell §3 (Use · App · About · Support). */
export interface MenuGroup {
  readonly id: "use" | "app" | "about" | "support";
  readonly items: readonly ShellItemId[];
}

/** The app frame: menu groups, footer links and the support links (app-shell §3, §7). */
export interface ShellConfig {
  /** Only the entries that apply to this app (app-shell rule 9): no service modes. */
  readonly menu: readonly MenuGroup[];
  /**
   * Footer links before the version line, in the order of the standalone policy pages' own footer
   * (WCAG 3.2.6 consistent help; scripts/legal-page.ts).
   */
  readonly footer: readonly ShellItemId[];
  /** Our own Buy Me a Coffee link — no widget script (app-shell rule 8). */
  readonly buyMeACoffee: string;
  /** "More free tools": the GitHub list of Moni's apps until the hub site exists (app-shell §7). */
  readonly moreTools: string;
}

/** Everything user-facing that the generator and the build read. */
export interface AppConfig {
  /** kebab-case; storage namespace (PLAN T-07) and package names. */
  readonly id: string;
  /** URL path on GitHub Pages. Differs from `id` (DECISIONS 2026-11-19), so it is explicit. */
  readonly basePath: `/${string}/`;
  readonly name: string;
  /** ≤ 47 characters, so `<title>` "{name} — {tagline}" stays ≤ 60. */
  readonly tagline: string;
  /** ≤ 155 characters: `<meta name="description">`, Open Graph, JSON-LD, manifest, llms.txt summary. */
  readonly description: string;
  /** The sentences right under the `<h1>`: what it is, for whom, the key facts (geo-content §1). */
  readonly answer: string;
  /** Absolute canonical URL = sitemap `<loc>` (seo-geo §2). */
  readonly url: string;
  readonly repo: string;
  /** = root package.json "version" (generate.ts fails on a mismatch). */
  readonly version: string;
  /** UI languages, English first; the static page, head, sitemap and llms.txt are English only (seo-geo §2). */
  readonly languages: readonly LanguageCode[];
  /**
   * The one accent (hex, design-system §3): scripts/accent.ts derives the accent tokens (fill, text,
   * focus ring) for both themes and fails the build below WCAG AA. The browser bar and manifest colours
   * are the page background from design/tokens.css (scripts/tokens.ts), not this value.
   */
  readonly accent: string;
  /** Legal notice, Privacy and Support (legal-pages §2, §6); taken from TeamSync's app.config.ts (forge DECISIONS 2026-11-06: LinkedIn in every app). */
  readonly author: { readonly name: string; readonly country: string; readonly github: string; readonly linkedin: string };
  /** Asked from Moni (DECISIONS 2026-11-19); used by the legal pages (PLAN T-10). */
  readonly contact: { readonly email: string };
  readonly manifest: ManifestConfig;
  /** "How it works": 3–5 steps with the exact UI labels. */
  readonly steps: readonly string[];
  /** JSON-LD `featureList`: short facts, each true for the app as it is. */
  readonly features: readonly string[];
  /** 5–7 real questions; each answer stands alone (names the app). */
  readonly faq: readonly FaqItem[];
  readonly shell: ShellConfig;
  readonly seo: {
    /** Search Console token for `google-site-verification`; null = no meta tag. */
    readonly googleVerification: string | null;
    /**
     * Date (YYYY-MM-DD) the page text last changed. The sitemap `lastmod` is the newer of this and
     * the latest dated CHANGELOG release — never the build date (seo-geo §6).
     */
    readonly contentUpdated: string;
  };
}

export const app = {
  id: "gg-counter",
  basePath: "/GG-counter/",
  name: "GG Counter",
  tagline: "Free offline score tracker for board games",
  description:
    "GG Counter keeps score at board-game nights: up to 50 players, +1/−1 or any amount, a leaderboard to share as text. Free, no account, works offline.",
  answer:
    "GG Counter is a free score tracker for board-game nights: add up to 50 players, change scores with +1, −1 or any amount, and share the ranked leaderboard as text. GG Counter needs no account, works offline after the first visit and saves the game on your device only.",
  url: "https://simeontsvetanov.github.io/GG-counter/",
  repo: "https://github.com/SimeonTsvetanov/GG-counter",
  version: "1.2.4",
  languages: ["en", "bg"],
  accent: "#1F4ED8",
  author: {
    name: "Simeon Tsvetanov",
    country: "Bulgaria",
    github: "https://github.com/SimeonTsvetanov",
    linkedin: "https://www.linkedin.com/in/simeon-tsvetanov-a00963159",
  },
  contact: { email: "tsvetanov.simeon@gmail.com" },
  manifest: {
    id: "gg-counter-pwa-v1",
    shortName: "GG Counter",
    display: "standalone",
    orientation: "portrait-primary",
  },
  steps: stepsEn,
  features: featureNamesEn,
  faq: faqEn,
  shell: {
    menu: [
      { id: "use", items: ["help", "settings", "whats-new"] },
      { id: "app", items: ["share-app", "install", "report"] },
      { id: "about", items: ["about", "terms", "privacy", "ai-notice", "legal-notice", "contact"] },
      { id: "support", items: ["support", "source"] },
    ],
    footer: ["terms", "privacy", "ai-notice", "legal-notice", "contact", "support"],
    buyMeACoffee: "https://buymeacoffee.com/simeontsvetanov",
    moreTools: "https://github.com/SimeonTsvetanov?tab=repositories&q=simeonts-microapp",
  },
  seo: { googleVerification: null, contentUpdated: "2026-11-19" },
} as const satisfies AppConfig;

/**
 * The texts of `app` in the other UI languages (app-shell → i18n §3); Bulgarian sentences in the
 * polite plural (i18n §5, forge DECISIONS 2026-11-06). A separate export, so the build ships them in the Bulgarian chunk
 * only (app/vite.config.ts `__APP_TEXT_BG__`); generate.ts checks the counts against English.
 * Steps name the exact Bulgarian UI labels of app/src/i18n/bg.ts.
 */
export const l10n = {
  bg: {
    tagline: "Безплатен брояч на точки за настолни игри, работи без интернет",
    description:
      "GG Counter брои точките на вечерите с настолни игри: до 50 играчи, +1/−1 или произволна стойност, класиране, което споделяте като текст. Безплатно, без акаунт, работи без интернет.",
    answer:
      "GG Counter е безплатен брояч на точки за вечери с настолни игри: добавяте до 50 играчи, променяте точките с +1, −1 или произволна стойност и споделяте класирането като текст. GG Counter не иска акаунт, работи без интернет след първото отваряне и пази играта само на Вашето устройство.",
    steps: stepsBg,
    features: featureNamesBg,
    faq: faqBg,
  },
} as const satisfies Readonly<Record<Exclude<LanguageCode, "en">, AppText>>;
