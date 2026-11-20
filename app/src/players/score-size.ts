// The score on a player card is one line of large digits; a 390 px phone card fits 7 characters
// ("-999999", the limits since PLAN T-08). Saved games from before the limits may hold longer numbers —
// those get the smaller size (player-card.css `.score[data-long]`). Compact cards (5+ players, SPEC 1.1
// F18) put a short score beside − and + (player-card.css `[data-short-score]`); a longer one keeps its row.

/** Longest score text (with its minus sign) that fits the large size on a phone card. */
export const MAX_LARGE_SCORE_LENGTH = 7;

/** Longest score text that fits beside − and + on a compact card of a 360 px phone ("999", "-99"). */
export const MAX_SHORT_SCORE_LENGTH = 3;

/** Returns whether `score` is written with more characters than the large size fits. */
export function isLongScore(score: number): boolean {
  return String(score).length > MAX_LARGE_SCORE_LENGTH;
}

/** Returns whether `score` is short enough to sit beside − and + on a compact card. */
export function isShortScore(score: number): boolean {
  return String(score).length <= MAX_SHORT_SCORE_LENGTH;
}
