// The score on a player card is one line of large digits; a 390 px phone card fits 7 characters
// ("-999999", the limits since PLAN T-08). Saved games from before the limits may hold longer numbers —
// those get the smaller size (player-card.css `.score[data-long]`).

/** Longest score text (with its minus sign) that fits the large size on a phone card. */
export const MAX_LARGE_SCORE_LENGTH = 7;

/** Returns whether `score` is written with more characters than the large size fits. */
export function isLongScore(score: number): boolean {
  return String(score).length > MAX_LARGE_SCORE_LENGTH;
}
