// Help of the Scores screen per language (contract `HelpSection`): Quizzard's Help dialog loads it lazily
// (`MiniAppEntry.help`); app.config.ts takes the steps, the feature names and the FAQ of each language
// from help/en.ts and help/bg.ts for the standalone site's Help, static page, FAQ JSON-LD and llms.txt —
// one source, no copy.
import type { HelpSection } from "./contract.ts";
import { helpBg } from "./help/bg.ts";
import { helpEn } from "./help/en.ts";

/** Help texts in every language the screen translates. */
export interface ScoresHelp {
  readonly en: HelpSection;
  readonly bg: HelpSection;
}

/** Quick-start steps (exact UI labels), every feature and the FAQ, in English and Bulgarian. */
export const help: ScoresHelp = { en: helpEn, bg: helpBg };

// The contract's `MiniAppEntry.help` loads this module and reads its default export.
export default help;
