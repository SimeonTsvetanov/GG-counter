/**
 * app.config.ts — the single source of truth for GG Counter (APP-STANDARD §0, app-shell §1).
 * The static head and page text of app/index.html, the PWA manifest, sitemap.xml, llms.txt,
 * robots.txt and 404.html are generated from this object (scripts/generate.ts, app/vite.config.ts).
 * Only the sections this app uses: no embed, API, MCP or n8n (DECISIONS 2026-11-19); the one URL
 * parameter is `?lang=` (PLAN T-09, app-shell → i18n), never in the sitemap or canonical.
 */

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
  readonly backgroundColor: string;
  readonly themeColor: string;
}

/**
 * The entries the app shell knows (app-shell §3). Each id has a label (`shell.menu.items.<id>` in
 * app/src/i18n/en.ts) and an action (app/src/ui/menu-items.ts); both are checked by the compiler,
 * so a new entry (PLAN T-10: terms, privacy, ai-notice, legal-notice, contact) is one id + its page.
 */
export type ShellItemId = "help" | "settings" | "whats-new" | "share-app" | "install" | "report" | "about" | "support" | "source";

/** One group of the menu, in the order of app-shell §3 (Use · App · About · Support). */
export interface MenuGroup {
  readonly id: "use" | "app" | "about" | "support";
  readonly items: readonly ShellItemId[];
}

/** The app frame: menu groups, footer links and the support links (app-shell §3, §7). */
export interface ShellConfig {
  /** Only the entries that apply to this app (app-shell rule 9): no service modes, no legal pages yet. */
  readonly menu: readonly MenuGroup[];
  /** Footer links after the version link (which opens What's new); T-10 adds the policy pages. */
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
  /** Accent / theme colour (hex). */
  readonly accent: string;
  readonly author: { readonly name: string; readonly github: string };
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
  version: "0.1.0",
  languages: ["en", "bg"],
  accent: "#1F4ED8",
  author: { name: "Simeon Tsvetanov", github: "https://github.com/SimeonTsvetanov" },
  contact: { email: "tsvetanov.simeon@gmail.com" },
  manifest: {
    id: "gg-counter-pwa-v1",
    shortName: "GG Counter",
    display: "standalone",
    orientation: "portrait-primary",
    backgroundColor: "#1F4ED8",
    themeColor: "#1F4ED8",
  },
  steps: [
    "Type a player's name and tap Add. Repeat for everyone at the table, up to 50 players.",
    "Tap + or − on a player's card to change that score by one point.",
    "Tap the score itself to add or subtract any amount, for example 12 or −12, then tap Apply.",
    "Check the Leaderboard card: players are ranked by score, with 🥇 🥈 🥉 for the top three.",
    "Tap Share to send the leaderboard as text, or Reset scores to play again with the same players.",
  ],
  features: [
    "Up to 50 players per game",
    "+1 / −1 buttons and custom score changes",
    "Leaderboard ranked by score",
    "Share the leaderboard as text",
    "Works offline after the first visit",
    "Game saved on the device only",
  ],
  faq: [
    {
      q: "Is GG Counter free?",
      a: "Yes. GG Counter is free to use, with no account, no sign-up and no ads. The source code is open under the MIT licence.",
    },
    {
      q: "Does GG Counter work offline?",
      a: "Yes, after the first visit. Your browser keeps a copy of GG Counter, so it opens and keeps score without internet. A notice under the header shows when you are offline.",
    },
    {
      q: "Where are my scores saved, and are they sent anywhere?",
      a: "GG Counter saves players and scores in your browser's storage on this device only. Nothing is sent to a server: there are no accounts, cookies or analytics. Clearing the browser's data for the site deletes the saved game.",
    },
    {
      q: "How many players can I add?",
      a: "GG Counter takes up to 50 players per game. Each score can go from −999,999 to 999,999.",
    },
    {
      q: "How do I share the result?",
      a: "Tap Share on the Leaderboard card. GG Counter opens your device's share menu with the ranked leaderboard as text; where there is no share menu, GG Counter copies the text so you can paste it into any chat.",
    },
    {
      q: "How do I install GG Counter on my phone?",
      a: "On Android, open GG Counter in Chrome and tap Install app when the banner offers it, or choose Add to Home screen in the browser menu. On iPhone or iPad, open GG Counter in Safari, tap Share, then Add to Home Screen.",
    },
    {
      q: "Does GG Counter work for any game?",
      a: "Yes, for any game scored in points, such as Carcassonne, Star Realms, card games or a quiz night. GG Counter adds and subtracts the points you enter; it does not know the rules of any game.",
    },
  ],
  shell: {
    menu: [
      { id: "use", items: ["help", "settings", "whats-new"] },
      { id: "app", items: ["share-app", "install", "report"] },
      { id: "about", items: ["about"] },
      { id: "support", items: ["support", "source"] },
    ],
    footer: ["support"],
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
    steps: [
      "Напишете името на играч и натиснете „Добави“. Повторете за всички на масата — до 50 играчи.",
      "Натиснете + или − на картата на играча, за да промените точките му с една.",
      "Натиснете самия резултат, за да добавите или извадите произволна стойност, например 12 или −12, после натиснете „Приложи“.",
      "Вижте картата „Класиране“: играчите са подредени по точки, с 🥇 🥈 🥉 за първите трима.",
      "Натиснете „Сподели“, за да изпратите класирането като текст, или „Нулирай точките“, за да играете отново със същите играчи.",
    ],
    features: [
      "До 50 играчи в една игра",
      "Бутони +1 / −1 и произволна промяна на точките",
      "Класиране по точки",
      "Споделяне на класирането като текст",
      "Работи без интернет след първото отваряне",
      "Играта се пази само на устройството",
    ],
    faq: [
      {
        q: "Безплатен ли е GG Counter?",
        a: "Да. GG Counter е безплатен — без акаунт, без регистрация и без реклами. Изходният код е отворен под лиценза MIT.",
      },
      {
        q: "Работи ли GG Counter без интернет?",
        a: "Да, след първото отваряне. Браузърът пази копие на GG Counter, така че той се отваря и брои точки и без интернет. Под заглавната лента се показва известие, когато сте без интернет.",
      },
      {
        q: "Къде се пазят точките и изпращат ли се някъде?",
        a: "GG Counter пази играчите и точките в хранилището на браузъра, само на това устройство. Нищо не се изпраща към сървър: няма акаунти, бисквитки или статистики. Ако изтриете данните на браузъра за сайта, запазената игра се изтрива.",
      },
      {
        q: "Колко играчи мога да добавя?",
        a: "GG Counter приема до 50 играчи в една игра. Всеки резултат може да е от −999 999 до 999 999.",
      },
      {
        q: "Как да споделя резултата?",
        a: "Натиснете „Сподели“ в картата „Класиране“. GG Counter отваря менюто за споделяне на устройството с класирането като текст; където няма такова меню, GG Counter копира текста, за да го поставите във всеки чат.",
      },
      {
        q: "Как да инсталирам GG Counter на телефона си?",
        a: "На Android отворете GG Counter в Chrome и натиснете „Инсталирай приложението“, когато банерът го предложи, или изберете Add to Home screen в менюто на браузъра. На iPhone или iPad отворете GG Counter в Safari, натиснете Share, после Add to Home Screen.",
      },
      {
        q: "Става ли GG Counter за всяка игра?",
        a: "Да, за всяка игра с точки — Carcassonne, Star Realms, игри с карти или куиз вечер. GG Counter събира и изважда точките, които въвеждате; не знае правилата на никоя игра.",
      },
    ],
  },
} as const satisfies Readonly<Record<Exclude<LanguageCode, "en">, AppText>>;
