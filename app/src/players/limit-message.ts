// Turns core's error codes for new input into the message shown under the field (SPEC §7 limits:
// 50 players, 40-character names, scores −999,999…999,999). Codes without a message keep their
// pre-forge behaviour: a blank name or a non-number is ignored silently. Components keep the code
// and ask for the message while rendering, so it follows a language switch (PLAN T-09).
import { MAX_NAME_LENGTH, MAX_PLAYERS, MAX_SCORE, MIN_SCORE } from "gg-counter-core";
import { formatNumber, t } from "../i18n";

/** A refusal that is explained to the user. */
export type LimitCode = "PLAYERS_TOO_MANY" | "NAME_TOO_LONG" | "SCORE_OUT_OF_RANGE";

/** Returns `code` when it is a limit with a message, or null when the rejection is silent. */
export function limitCode(code: string): LimitCode | null {
  return code === "PLAYERS_TOO_MANY" || code === "NAME_TOO_LONG" || code === "SCORE_OUT_OF_RANGE" ? code : null;
}

/** Returns the message for a rejected input in the active language, or null when the rejection is silent. */
export function limitMessage(code: string): string | null {
  switch (limitCode(code)) {
    case "PLAYERS_TOO_MANY":
      return t("app.limits.PLAYERS_TOO_MANY", { max: MAX_PLAYERS });
    case "NAME_TOO_LONG":
      return t("app.limits.NAME_TOO_LONG", { max: MAX_NAME_LENGTH });
    case "SCORE_OUT_OF_RANGE":
      return t("app.limits.SCORE_OUT_OF_RANGE", { min: formatNumber(MIN_SCORE), max: formatNumber(MAX_SCORE) });
    case null:
      return null;
  }
}
