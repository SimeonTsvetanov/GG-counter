// React wrapper around the gg-counter-core game transitions: holds the game in a reducer, saves every
// change to this browser (app/src/storage) and derives the ranking. All game rules live in core.
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  addPlayer as addPlayerToGame,
  adjustScore as adjustScoreInGame,
  rank,
  removePlayer as removePlayerFromGame,
  renamePlayer as renamePlayerInGame,
  resetScores as resetScoresInGame,
  setScore as setScoreInGame,
  type AddPlayerErrorCode,
  type GameState,
  type NewPlayer,
  type Ranking,
  type RenamePlayerErrorCode,
  type Result,
  type ScoreErrorCode,
} from "gg-counter-core";
import { readGame, removeGame, writeGame } from "../storage/game";

type GameAction =
  | { type: "add-player"; player: NewPlayer }
  | { type: "remove-player"; id: string }
  | { type: "rename-player"; id: string; name: string }
  | { type: "adjust-score"; id: string; delta: number }
  | { type: "set-score"; id: string; score: number }
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
      return valueOr(state, adjustScoreInGame(state, action.id, action.delta));
    case "set-score":
      return valueOr(state, setScoreInGame(state, action.id, action.score));
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
  /** Changes a score; the result says whether core accepted it (score range). */
  adjustScore: (id: string, delta: number) => Result<GameState, ScoreErrorCode>;
  setScore: (id: string, score: number) => void;
  resetScores: () => void;
  /** Deletes the saved game and starts an empty one. */
  resetGame: () => void;
  /**
   * Shows the game saved in storage now (after Settings → Import or Clear my data) without saving it
   * again, so a cleared game is not written back as an empty one.
   */
  reloadFromStorage: () => void;
  /** Leaderboard order (ties in the order added), total score and leader. */
  ranking: Ranking;
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

  const adjustScore = useCallback(
    (id: string, delta: number) => {
      dispatch({ type: "adjust-score", id, delta });
      return adjustScoreInGame(state, id, delta);
    },
    [state]
  );

  const setScore = useCallback((id: string, score: number) => { dispatch({ type: "set-score", id, score }); }, []);

  const resetScores = useCallback(() => { dispatch({ type: "reset-scores" }); }, []);

  const resetGame = useCallback(() => {
    removeGame();
    dispatch({ type: "replace", state: readGame() });
  }, []);

  const reloadFromStorage = useCallback(() => {
    const stored = readGame();
    setSavedGame(stored);
    dispatch({ type: "replace", state: stored });
  }, []);

  const ranking = useMemo(() => rank(state.players), [state.players]);

  return {
    state,
    addPlayer,
    removePlayer,
    renamePlayer,
    adjustScore,
    setScore,
    resetScores,
    resetGame,
    reloadFromStorage,
    ranking,
  };
}
