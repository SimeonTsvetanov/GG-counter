// The game screen's UI texts with its own i18next instance (Quizzard PLAN §1.2: a mini-app translates its
// own subtree; the host's instance is never touched). English (en.ts) is bundled, the default and the
// fallback; Bulgarian (bg.ts) is its own chunk, loaded before the screen switches to it, so no English
// frame shows first. mount.tsx starts one instance per mount ({@link startTexts}); components and the
// share text call t(), which always reads the instance of the current mount.
import i18next, { type i18n } from "i18next";
import type { Lang, Unsubscribe } from "../contract.ts";
import type { Signal } from "../host.ts";
import { en } from "./en";

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

/** The languages the screen translates (`meta.languages`). */
const LANGUAGES: readonly Lang[] = ["en", "bg"];

/** Loads each non-English dictionary from its own chunk (precached by the host's service worker). */
const PACKS: Readonly<Record<Exclude<Lang, "en">, () => Promise<Messages>>> = {
  bg: () => import("./bg").then((module) => module.bg),
};

/** Dictionaries loaded so far; shared by every instance, so a language loads once per page. */
const loaded = new Map<Lang, Messages>([["en", en]]);

/** Returns true for a language the screen translates. */
function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/** Creates an English instance; synchronous, so t() works from the first render (and in unit tests). */
function createInstance(): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    lng: "en",
    fallbackLng: "en",
    supportedLngs: [...LANGUAGES],
    resources: { en: { translation: en } },
    // React escapes text and we never write HTML; skipOnVariables keeps "{{x}}" or "$t(x)" inside a
    // player's name as typed.
    interpolation: { escapeValue: false, skipOnVariables: true },
    initAsync: false,
  });
  return instance;
}

/** The instance of the current mount; an English one between mounts. */
let active = createInstance();

/**
 * Returns the text for `key` in the screen's language with its `{{placeholders}}` filled from `values`.
 * @remarks A placeholder without a value stays visible as `{{name}}`, so a missing value is noticed in tests.
 */
export function t(key: MessageKey, values: MessageValues = {}): string {
  return active.t(key, values);
}

/** Returns the screen's language. */
export function getLanguage(): Lang {
  return isLang(active.language) ? active.language : "en";
}

/** Returns `value` with the screen language's digit grouping (999,999 · 999 999). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLanguage()).format(value);
}

/** Calls `listener` after every language change of the current instance; returns the function that stops it. */
export function onLanguageChange(listener: () => void): Unsubscribe {
  const instance = active;
  instance.on("languageChanged", listener);
  return () => { instance.off("languageChanged", listener); };
}

/** The screen's language as a signal: it fires after the screen's own texts switched. */
export const screenLanguage: Signal<Lang> = {
  get: getLanguage,
  subscribe: (listener) => onLanguageChange(() => { listener(getLanguage()); }),
};

/**
 * Loads `lang`'s dictionary once.
 * @returns false when it cannot be loaded (offline before the chunk was cached); English always loads
 */
export async function loadLanguage(lang: Lang): Promise<boolean> {
  if (lang === "en" || loaded.has(lang)) return true;
  try {
    loaded.set(lang, await PACKS[lang]());
    return true;
  } catch (error) {
    // because English is always there: the screen stays usable in English
    console.warn(`UI language ${lang} could not be loaded`, error);
    return false;
  }
}

/** Switches `instance` to `lang` when its dictionary is loaded; i18next switches synchronously then. */
function switchTo(instance: i18n, lang: Lang): boolean {
  const messages = loaded.get(lang);
  if (messages === undefined) return false;
  if (!instance.hasResourceBundle(lang, "translation")) instance.addResourceBundle(lang, "translation", messages);
  void instance.changeLanguage(lang);
  return true;
}

/** Makes `lang` the screen's language (English when it cannot be loaded). */
export async function applyLanguage(lang: Lang): Promise<void> {
  const instance = active;
  switchTo(instance, (await loadLanguage(lang)) ? lang : "en");
}

/** The texts of one mount: its language follows the host's, and `stop` ends the instance. */
export interface ScreenTexts {
  /**
   * Switches to `lang`: at once when its dictionary is loaded (returns `null`), else after loading it
   * (returns the promise; English when it cannot be loaded).
   */
  readonly setLanguage: (lang: Lang) => Promise<void> | null;
  /** Drops the mount's instance and its listeners; t() is English again until the next mount. */
  readonly stop: () => void;
}

/** Starts a fresh instance for one mount; texts render in English until {@link ScreenTexts.setLanguage}. */
export function startTexts(): ScreenTexts {
  const instance = createInstance();
  active = instance;
  // The last request wins: a slow chunk must not switch back to a language the host already left.
  let wanted: Lang = "en";
  const setLanguage = (lang: Lang): Promise<void> | null => {
    wanted = lang;
    if (switchTo(instance, lang)) return null;
    return loadLanguage(lang).then((isLoaded) => {
      if (wanted === lang) switchTo(instance, isLoaded ? lang : "en");
    });
  };
  const stop = (): void => {
    instance.off("languageChanged");
    if (active === instance) active = createInstance();
  };
  return { setLanguage, stop };
}
