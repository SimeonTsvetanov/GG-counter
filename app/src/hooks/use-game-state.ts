// React wrapper around the gg-counter-core game transitions: holds the game in a reducer, saves every
// change to this browser (app/src/storage) and derives the ranking and the last-scored player. All game
// rules (score history included, SPEC 1.1) live in core.
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  addPlayer as addPlayerToGame,
  adjustScore as adjustScoreInGame,
  lastScoredPlayerId,
  rank,
  removePlayer as removePlayerFromGame,
  removeScoreEntry as removeScoreEntryInGame,
  renamePlayer as renamePlayerInGame,
  resetPlayerScore as resetPlayerScoreInGame,
  resetScores as resetScoresInGame,
  restoreScoreEntry as restoreScoreEntryInGame,
  type AddPlayerErrorCode,
  type GameState,
  type NewPlayer,
  type Ranking,
  type RenamePlayerErrorCode,
  type RestoreEntryErrorCode,
  type Result,
  type ScoreChange,
  type ScoreEntry,
  type ScoreEntryErrorCode,
  type ScoreErrorCode,
} from "gg-counter-core";
import { readGame, removeGame, writeGame } from "../storage/game";

type GameAction =
  | { type: "add-player"; player: NewPlayer }
  | { type: "remove-player"; id: string }
  | { type: "rename-player"; id: string; name: string }
  | { type: "adjust-score"; id: string; change: ScoreChange }
  | { type: "remove-score-entry"; id: string; entryId: string }
  | { type: "restore-score-entry"; id: string; entry: ScoreEntry; index: number }
  | { type: "reset-player-score"; id: string }
  | { type: "reset-scores" }
  | { type: "replace"; state: GameState };

/** Returns the new game, or `state` unchanged when core rejected the input. */
function valueOr(state: GameState, result: Result<GameState, string>): GameState {
  return result.ok ? result.value : state;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "replace":
      return action.state;
    case "add-player":
      return valueOr(state, addPlayerToGame(state, action.player));
    case "remove-player":
      return removePlayerFromGame(state, action.id);
    case "rename-player":
      return valueOr(state, renamePlayerInGame(state, action.id, action.name));
    case "adjust-score":
      return valueOr(state, adjustScoreInGame(state, action.id, action.change));
    case "remove-score-entry":
      return valueOr(state, removeScoreEntryInGame(state, action.id, action.entryId));
    case "restore-score-entry":
      return valueOr(state, restoreScoreEntryInGame(state, action.id, action.entry, action.index));
    case "reset-player-score":
      return valueOr(state, resetPlayerScoreInGame(state, action.id));
    case "reset-scores":
      return resetScoresInGame(state);
    default:
      return state;
  }
}

/** What {@link useGameState} returns: the game, its actions and the ranking. */
export interface GameStateApi {
  state: GameState;
  /** Adds a player; the result says whether core accepted the name (limits, blank name). */
  addPlayer: (name: string) => Result<GameState, AddPlayerErrorCode>;
  removePlayer: (id: string) => void;
  /** Renames a player; the result says whether core accepted the name (limits, blank name). */
  renamePlayer: (id: string, name: string) => Result<GameState, RenamePlayerErrorCode>;
  /** Changes a score and records it in the player's history; the result says whether core accepted it (score range). */
  adjustScore: (id: string, delta: number) => Result<GameState, ScoreErrorCode>;
  /** Removes one history entry and takes its points off the score (SPEC 1.1 F16); the result says why core refused. */
  removeScoreEntry: (playerId: string, entryId: string) => Result<GameState, ScoreEntryErrorCode>;
  /** Puts a removed entry back at `index` with its points (Restore in the history sheet); the result says why core refused. */
  restoreScoreEntry: (playerId: string, entry: ScoreEntry, index: number) => Result<GameState, RestoreEntryErrorCode>;
  /** Sets one player's score to 0 and empties their history; the player stays (SPEC 1.1 F14). */
  resetPlayerScore: (id: string) => void;
  /** Sets every score to 0 and empties every history; the players stay (SPEC F6, 1.1 F13). */
  resetScores: () => void;
  /** Deletes the saved game and starts an empty one. */
  resetGame: () => void;
  /**
   * Shows the game saved in storage now (after Settings → Import or Clear my data) without saving it
   * again, so a cleared game is not written back as an empty one.
   */
  reloadFromStorage: () => void;
  /** Leaderboard order (ties in the order added), places (ties share one), total score and leader. */
  ranking: Ranking;
  /** The player with the newest history entry, or null (the last-scored highlight, SPEC 1.1 F17). */
  lastScoredId: string | null;
}

/** The score actions of {@link useGameState}: change (recorded in the history), remove or restore an entry, reset one or all. */
function useScoreActions(
  state: GameState,
  dispatch: React.Dispatch<GameAction>
): Pick<GameStateApi, "adjustScore" | "removeScoreEntry" | "restoreScoreEntry" | "resetPlayerScore" | "resetScores"> {
  const adjustScore = useCallback(
    (id: string, delta: number) => {
      // Entry id and time are made here, once, so the reducer stays pure (as in addPlayer).
      const change: ScoreChange = { delta, entryId: crypto.randomUUID(), at: new Date().toISOString() };
      dispatch({ type: "adjust-score", id, change });
      return adjustScoreInGame(state, id, change);
    },
    [state, dispatch]
  );

  const removeScoreEntry = useCallback(
    (playerId: string, entryId: string) => {
      dispatch({ type: "remove-score-entry", id: playerId, entryId });
      return removeScoreEntryInGame(state, playerId, entryId);
    },
    [state, dispatch]
  );

  const restoreScoreEntry = useCallback(
    (playerId: string, entry: ScoreEntry, index: number) => {
      dispatch({ type: "restore-score-entry", id: playerId, entry, index });
      return restoreScoreEntryInGame(state, playerId, entry, index);
    },
    [state, dispatch]
  );

  const resetPlayerScore = useCallback((id: string) => { dispatch({ type: "reset-player-score", id }); }, [dispatch]);
  const resetScores = useCallback(() => { dispatch({ type: "reset-scores" }); }, [dispatch]);
  return { adjustScore, removeScoreEntry, restoreScoreEntry, resetPlayerScore, resetScores };
}

/** Holds the game in a reducer and saves every change to this browser. */
export function useGameState(): GameStateApi {
  const [savedGame, setSavedGame] = useState(readGame);
  const [state, dispatch] = useReducer(gameReducer, savedGame);

  useEffect(() => {
    // because writing back an unchanged load would create the new key and so hide a pre-forge game
    // the migration could not read (storage/migrate.ts); every change is saved.
    if (state === savedGame) return;
    const saved = writeGame(state);
    if (!saved.ok) console.error("Failed to persist state", saved.error);
  }, [state, savedGame]);

  const addPlayer = useCallback(
    (name: string) => {
      // Id and time are made here, once, so the reducer stays pure (React may run it twice).
      const player: NewPlayer = { name, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      dispatch({ type: "add-player", player });
      // The reducer applies the same check to the latest game; this tells the caller the outcome now.
      return addPlayerToGame(state, player);
    },
    [state]
  );

  const removePlayer = useCallback((id: string) => { dispatch({ type: "remove-player", id }); }, []);

  const renamePlayer = useCallback(
    (id: string, name: string) => {
      dispatch({ type: "rename-player", id, name });
      return renamePlayerInGame(state, id, name);
    },
    [state]
  );

  const resetGame = useCallback(() => {
    removeGame();
    dispatch({ type: "replace", state: readGame() });
  }, []);

  const reloadFromStorage = useCallback(() => {
    const stored = readGame();
    setSavedGame(stored);
    dispatch({ type: "replace", state: stored });
  }, []);

  const scoreActions = useScoreActions(state, dispatch);
  const ranking = useMemo(() => rank(state.players), [state.players]);
  const lastScoredId = useMemo(() => lastScoredPlayerId(state), [state]);

  return {
    state,
    addPlayer,
    removePlayer,
    renamePlayer,
    ...scoreActions,
    resetGame,
    reloadFromStorage,
    ranking,
    lastScoredId,
  };
}
