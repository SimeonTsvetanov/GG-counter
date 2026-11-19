/**
 * Rules app.config.ts must meet before anything is generated from it (growth → seo-geo §3,
 * geo-content §1–3). Pure; scripts/generate.ts fails the build with the problems it returns.
 */
import type { AppConfig } from "../app.config.ts";
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
}

/** Returns a problem when `count` is outside `min`–`max`, else nothing. */
function countProblem(what: string, count: number, [min, max]: readonly [number, number]): string[] {
  return count < min || count > max ? [`${what}: ${String(count)} items, expected ${String(min)}–${String(max)}`] : [];
}

/**
 * Returns every rule `app` breaks, as readable sentences; an empty list means the config is valid.
 *
 * @param app - the config to check.
 * @param context - facts from outside the config (package.json version).
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
  ];
}
