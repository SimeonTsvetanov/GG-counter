// UI languages with i18next (app-shell → i18n, PLAN T-09). English (en.ts) is bundled, the default and
// the fallback; Bulgarian (bg.ts + the l10n texts of app.config.ts) is its own chunk, loaded before the
// first render only for people who get Bulgarian. Start language: detect.ts. Components call t() while
// rendering; the composition roots re-render on a change through useLanguage() (use-language.ts).
import i18next from "i18next";
import { app, type AppText, type LanguageCode } from "../config";
import { isLanguage, readLanguage, writeLanguage } from "../storage/lang";
import { pickLanguage } from "./detect";
import { en } from "./en";

export type { LanguageCode } from "../config";

/** Deep `string` version of the English dictionary — the type every other language must satisfy. */
export type Messages = Widen<typeof en>;

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Every dotted path to a text, plural forms named without `_one` / `_other` (e.g. `"app.players.count"`). */
export type MessageKey = Leaves<typeof en>;

type PluralBase<K extends string> = K extends `${infer Base}_${"one" | "other"}` ? Base : K;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${PluralBase<K>}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Values for the `{{name}}` placeholders of a text; `count` also picks the plural form. */
export type MessageValues = Readonly<Record<string, string | number>>;

/** Each language's own name — never translated, so people find their language in any UI language. */
export const LANGUAGE_NAMES: Readonly<Record<LanguageCode, string>> = { en: "English", bg: "Български" };

/** A non-English language: its dictionary and its app.config.ts texts. */
interface LanguagePack {
  readonly messages: Messages;
  readonly appText: AppText;
}

/** Loads each non-English language from its own chunk (precached by the service worker for offline use). */
const PACKS: Readonly<Record<Exclude<LanguageCode, "en">, () => Promise<LanguagePack>>> = {
  bg: () => import("./bg").then((module) => ({ messages: module.bg, appText: module.bgAppText })),
};

const ENGLISH_TEXT: AppText = { tagline: app.tagline, description: app.description, answer: app.answer, steps: app.steps, features: app.features, faq: app.faq };

/** The app.config.ts texts of every language loaded so far. */
const appTexts = new Map<LanguageCode, AppText>([["en", ENGLISH_TEXT]]);

// Synchronous: English is in the bundle, so t() works from the first line of code (and in unit tests).
void i18next.init({
  lng: "en",
  fallbackLng: "en",
  supportedLngs: [...app.languages],
  resources: { en: { translation: en } },
  // React escapes text and we never write HTML; skipOnVariables keeps "{{x}}" or "$t(x)" inside a
  // player's name as typed.
  interpolation: { escapeValue: false, skipOnVariables: true },
  initAsync: false,
});

/**
 * Returns the text for `key` in the active language with its `{{placeholders}}` filled from `values`.
 *
 * @remarks A placeholder without a value stays visible as `{{name}}`, so a missing value is noticed
 * in tests; numbers are written as given (format them with {@link formatNumber} where it matters).
 */
export function t(key: MessageKey, values: MessageValues = {}): string {
  return i18next.t(key, values);
}

/** Returns the active UI language. */
export function getLanguage(): LanguageCode {
  const lang = i18next.language;
  return isLanguage(lang) ? lang : "en";
}

/** Returns the app.config.ts texts (tagline, answer, steps, features, FAQ) in the active language. */
export function appText(): AppText {
  return appTexts.get(getLanguage()) ?? ENGLISH_TEXT;
}

/** Returns `value` with the active language's digit grouping (999,999 · 999 999). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLanguage()).format(value);
}

/** Calls `listener` after every language change; returns the function that stops it. */
export function onLanguageChange(listener: () => void): () => void {
  i18next.on("languageChanged", listener);
  return () => { i18next.off("languageChanged", listener); };
}

/** Loads `lang`'s chunk once; false when it cannot be loaded (offline before the chunk was cached). */
async function loadLanguage(lang: LanguageCode): Promise<boolean> {
  if (lang === "en" || appTexts.has(lang)) return true;
  try {
    const pack = await PACKS[lang]();
    i18next.addResourceBundle(lang, "translation", pack.messages);
    appTexts.set(lang, pack.appText);
    return true;
  } catch (error) {
    // because English is always there: the app stays usable and the choice is kept for the next start
    console.warn(`UI language ${lang} could not be loaded`, error);
    return false;
  }
}

/** Makes `lang` the active language (English when it cannot be loaded) and sets `<html lang>`. */
async function activate(lang: LanguageCode): Promise<void> {
  const active = (await loadLanguage(lang)) ? lang : "en";
  await i18next.changeLanguage(active);
  if (typeof document !== "undefined") document.documentElement.lang = active;
}

/** The start language: `?lang=`, the saved choice, else English (detect.ts). */
function startLanguage(): LanguageCode {
  return pickLanguage({ search: location.search, saved: readLanguage() });
}

/** Picks and loads the start language; main.tsx awaits it before the first render, so nothing flips from English. */
export function initI18n(): Promise<void> {
  return activate(startLanguage());
}

/** Switches to `lang` (Settings) and remembers it on this device; the screen re-renders without a reload. */
export function setLanguage(lang: LanguageCode): Promise<void> {
  writeLanguage(lang);
  return activate(lang);
}

/**
 * Applies the language after an import or Clear my data: the imported choice, else the start rule
 * again (the saved choice is gone after a clear, so the app is back in English).
 */
export function applyLanguage(lang: LanguageCode | null): Promise<void> {
  return activate(lang ?? startLanguage());
}
