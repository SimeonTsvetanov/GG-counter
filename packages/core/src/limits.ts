// Limits for new input (Moni 2026-11-19, SPEC §7). Saved games beyond them still load unchanged.

/** Most players a game accepts. */
export const MAX_PLAYERS = 50;

/** Longest player name, in characters (Unicode code points) after trimming. */
export const MAX_NAME_LENGTH = 40;

/** Lowest score a change may produce. */
export const MIN_SCORE = -999_999;

/** Highest score a change may produce. */
export const MAX_SCORE = 999_999;
