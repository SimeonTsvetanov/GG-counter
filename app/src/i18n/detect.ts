// The UI language at start (PLAN T-09, forge DECISIONS 2026-11-06): `?lang=` for this visit (links
// for people and the a11y check; never in the sitemap — seo-geo §2), then the choice saved in
// Settings, else English. No browser auto-detect: English is always the default. Pure, so it is
// unit-tested.
import type { LanguageCode } from "../config";
import { isLanguage } from "../storage/lang";

/** What {@link pickLanguage} decides from. */
export interface LanguageSources {
  /** `location.search`, e.g. "?lang=bg". */
  readonly search: string;
  /** The language saved in Settings, or null. */
  readonly saved: LanguageCode | null;
}

/** Returns the `lang` URL parameter when it names one of the app's languages ("bg", "BG"), else null. */
function fromUrl(search: string): LanguageCode | null {
  const lang = new URLSearchParams(search).get("lang")?.trim().toLowerCase() ?? "";
  return isLanguage(lang) ? lang : null;
}

/** Returns the UI language to start with; always one of the app's languages. */
export function pickLanguage({ search, saved }: LanguageSources): LanguageCode {
  return fromUrl(search) ?? saved ?? "en";
}
