/**
 * Rules app.config.ts must meet before anything is generated from it (growth → seo-geo §3,
 * geo-content §1–3). Pure; scripts/generate.ts fails the build with the problems it returns.
 */
import type { AppConfig, AppText, LanguageCode } from "../app.config.ts";
import { pageTitle } from "./seo.ts";

/** Style budgets of seo-geo §3 (house): they read well when search results cut them. */
export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 155;

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOUR = /^#[0-9A-Fa-f]{6}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** What {@link configProblems} compares the config with. */
export interface ConfigContext {
  /** `version` of the root package.json (unknown until checked). */
  readonly packageVersion: unknown;
  /** The texts of the other UI languages (`l10n` of app.config.ts). */
  readonly l10n: Readonly<Partial<Record<LanguageCode, AppText>>>;
}

/** Returns a problem when `count` is outside `min`–`max`, else nothing. */
function countProblem(what: string, count: number, [min, max]: readonly [number, number]): string[] {
  return count < min || count > max ? [`${what}: ${String(count)} items, expected ${String(min)}–${String(max)}`] : [];
}

/**
 * Returns the problems of the UI languages (app-shell → i18n §3): English first, no duplicates, and
 * every other language has its texts with the same number of steps, features and FAQ items.
 */
function languageProblems(app: AppConfig, l10n: ConfigContext["l10n"]): string[] {
  const problems = [
    ...(app.languages[0] === "en" ? [] : [`languages must start with "en" (the default and fallback)`]),
    ...(new Set(app.languages).size === app.languages.length ? [] : ["languages has duplicates"]),
    ...Object.keys(l10n).filter((lang) => !(app.languages as readonly string[]).includes(lang)).map((lang) => `l10n.${lang} is not in languages`),
  ];
  for (const lang of app.languages.filter((code) => code !== "en")) {
    const text = l10n[lang];
    if (text === undefined) {
      problems.push(`l10n.${lang} is missing`);
      continue;
    }
    for (const part of ["steps", "features", "faq"] as const) {
      if (text[part].length !== app[part].length) problems.push(`l10n.${lang}.${part}: ${String(text[part].length)} items, English has ${String(app[part].length)}`);
    }
    if (!text.answer.includes(app.name)) problems.push(`l10n.${lang}.answer does not name the app`);
  }
  return problems;
}

/**
 * Returns every rule `app` breaks, as readable sentences; an empty list means the config is valid.
 *
 * @param app - the config to check.
 * @param context - facts from outside `app`: package.json version and the other languages' texts.
 */
export function configProblems(app: AppConfig, context: ConfigContext): string[] {
  const title = pageTitle(app);
  return [
    ...(KEBAB_CASE.test(app.id) ? [] : [`id "${app.id}" is not kebab-case`]),
    ...(app.url.endsWith(app.basePath) ? [] : [`url "${app.url}" does not end with basePath "${app.basePath}"`]),
    ...(app.version === context.packageVersion ? [] : [`version ${app.version} differs from package.json ${String(context.packageVersion)}`]),
    ...(title.length <= MAX_TITLE_LENGTH ? [] : [`title has ${String(title.length)} characters (max ${String(MAX_TITLE_LENGTH)}): ${title}`]),
    ...(app.description.length <= MAX_DESCRIPTION_LENGTH ? [] : [`description has ${String(app.description.length)} characters (max ${String(MAX_DESCRIPTION_LENGTH)})`]),
    ...(app.answer.includes(app.name) ? [] : ["answer does not name the app"]),
    ...countProblem("steps", app.steps.length, [3, 5]),
    ...countProblem("faq", app.faq.length, [5, 7]),
    ...[app.accent, app.manifest.themeColor, app.manifest.backgroundColor].filter((c) => !HEX_COLOUR.test(c)).map((c) => `colour "${c}" is not #RRGGBB`),
    ...(ISO_DATE.test(app.seo.contentUpdated) ? [] : [`seo.contentUpdated "${app.seo.contentUpdated}" is not YYYY-MM-DD`]),
    ...languageProblems(app, context.l10n),
  ];
}
