// Turns core's error codes for new input into the message shown under the field (SPEC §7 limits:
// 50 players, 40-character names, scores −999,999…999,999). Codes without a message keep their
// pre-forge behaviour: a blank name or a non-number is ignored silently.
import { MAX_NAME_LENGTH, MAX_PLAYERS, MAX_SCORE, MIN_SCORE } from "gg-counter-core";
import { formatNumber, t } from "../i18n";

/** Returns the message for a rejected input, or null when the rejection is silent. */
export function limitMessage(code: string): string | null {
  switch (code) {
    case "PLAYERS_TOO_MANY":
      return t("app.limits.PLAYERS_TOO_MANY", { max: MAX_PLAYERS });
    case "NAME_TOO_LONG":
      return t("app.limits.NAME_TOO_LONG", { max: MAX_NAME_LENGTH });
    case "SCORE_OUT_OF_RANGE":
      return t("app.limits.SCORE_OUT_OF_RANGE", { min: formatNumber(MIN_SCORE), max: formatNumber(MAX_SCORE) });
    default:
      return null;
  }
}
