/**
 * gg-counter-core — GG Counter's pure score logic: players, scores, ranking, share text and reading
 * the saved game. No DOM, no storage, no network. Private workspace package used by the app only.
 */
export { GAME_VERSION, createEmptyGame, type GameState, type Player } from "./game.ts";
export { MAX_NAME_LENGTH, MAX_PLAYERS, MAX_SCORE, MIN_SCORE } from "./limits.ts";
export { formatLeaderboard, type LeaderboardTextInput } from "./leaderboard-text.ts";
export { ordinal } from "./ordinal.ts";
export type { NameErrorCode } from "./player-name.ts";
export { addPlayer, removePlayer, renamePlayer, type AddPlayerErrorCode, type NewPlayer, type RenamePlayerErrorCode } from "./players.ts";
export { rank, type Ranking } from "./ranking.ts";
export type { Result } from "./result.ts";
export { parseSavedState, type SavedStateErrorCode } from "./saved-state.ts";
export { adjustScore, resetScores, setScore, type ScoreErrorCode } from "./scores.ts";
