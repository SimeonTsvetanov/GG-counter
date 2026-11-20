/**
 * gg-counter-core — GG Counter's pure score logic: players, scores and their history, ranking, share
 * text and reading the saved game. No DOM, no storage, no network. Private workspace package used by the app only.
 */
export { GAME_VERSION, createEmptyGame, type GameState, type Player, type ScoreEntry } from "./game.ts";
export { MAX_HISTORY_ENTRIES, MERGE_WINDOW_MS, lastScoredPlayerId, scoreBase, sumOfDeltas, type ScoreChange } from "./history.ts";
export { MAX_NAME_LENGTH, MAX_PLAYERS, MAX_SCORE, MIN_SCORE } from "./limits.ts";
export {
  englishLeaderboardLabels,
  formatLeaderboard,
  formatScore,
  placeMark,
  type LeaderboardTextInput,
  type LeaderboardTextLabels,
} from "./leaderboard-text.ts";
export type { NameErrorCode } from "./player-name.ts";
export { addPlayer, removePlayer, renamePlayer, type AddPlayerErrorCode, type NewPlayer, type RenamePlayerErrorCode } from "./players.ts";
export { podiumPlaces, rank, type PodiumPlace, type Ranking } from "./ranking.ts";
export type { Failure, Result } from "./result.ts";
export { checkSavedGame, parseSavedState, type SavedGameErrorCode, type SavedStateErrorCode } from "./saved-state.ts";
export {
  adjustScore,
  removeScoreEntry,
  resetPlayerScore,
  resetScores,
  restoreScoreEntry,
  type RestoreEntryErrorCode,
  type ScoreEntryErrorCode,
  type ScoreErrorCode,
} from "./scores.ts";
