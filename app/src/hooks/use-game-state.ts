import { useCallback, useEffect, useMemo, useReducer } from "react";
import { clearState, loadState, saveState } from "../lib/storage";
import type { GameState, Player } from "../types";

// no hard maximum for players

type GameAction =
  | { type: "add-player"; name: string }
  | { type: "remove-player"; id: string }
  | { type: "rename-player"; id: string; name: string }
  | { type: "adjust-score"; id: string; delta: number }
  | { type: "set-score"; id: string; score: number }
  | { type: "reset-scores" }
  | { type: "replace"; state: GameState };

function createPlayer(name: string): Player {
  return {
    id: crypto.randomUUID(),
    name,
    score: 0,
    createdAt: new Date().toISOString(),
  };
}

function ensurePlayerName(name: string, fallbackIndex: number): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : `Player ${String(fallbackIndex)}`;
}

/** Returns `players` with the player `id` replaced by `update(player)`; the others are kept as they are. */
function updatePlayer(
  players: readonly Player[],
  id: string,
  update: (player: Player) => Player
): Player[] {
  return players.map((player) => (player.id === id ? update(player) : player));
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "replace": {
      return action.state;
    }
    case "add-player": {
      const nextIndex = state.players.length + 1;
      const player = createPlayer(ensurePlayerName(action.name, nextIndex));
      return {
        ...state,
        players: [...state.players, player],
      };
    }
    case "remove-player": {
      return {
        ...state,
        players: state.players.filter((player) => player.id !== action.id),
      };
    }
    case "rename-player": {
      return {
        ...state,
        players: updatePlayer(state.players, action.id, (player) => ({
          ...player,
          name: ensurePlayerName(action.name, state.players.indexOf(player) + 1),
        })),
      };
    }
    case "adjust-score": {
      return {
        ...state,
        players: updatePlayer(state.players, action.id, (player) => ({
          ...player,
          score: player.score + action.delta,
        })),
      };
    }
    case "set-score": {
      return {
        ...state,
        players: updatePlayer(state.players, action.id, (player) => ({
          ...player,
          score: action.score,
        })),
      };
    }
    case "reset-scores": {
      return {
        ...state,
        players: state.players.map((player) => ({ ...player, score: 0 })),
      };
    }
    default:
      return state;
  }
}

/** Live totals derived from the players. */
export interface GameSummary {
  totalScore: number;
  /** The first player with the highest score, or null when there are no players. */
  leader: Player | null;
}

/** What {@link useGameState} returns: the game, its actions and the summary. */
export interface GameStateApi {
  state: GameState;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  renamePlayer: (id: string, name: string) => void;
  adjustScore: (id: string, delta: number) => void;
  setScore: (id: string, score: number) => void;
  resetScores: () => void;
  /** Deletes the saved game and starts an empty one. */
  resetGame: () => void;
  summary: GameSummary;
}

/** Holds the game in a reducer and saves every change to this browser. */
export function useGameState(): GameStateApi {
  const [state, dispatch] = useReducer(gameReducer, loadState());

  useEffect(() => {
    saveState(() => ({ ...state }));
  }, [state]);

  const addPlayer = useCallback((name: string) => {
    dispatch({ type: "add-player", name });
  }, []);

  const removePlayer = useCallback((id: string) => {
    dispatch({ type: "remove-player", id });
  }, []);

  const renamePlayer = useCallback((id: string, name: string) => {
    dispatch({ type: "rename-player", id, name });
  }, []);

  const adjustScore = useCallback((id: string, delta: number) => {
    dispatch({ type: "adjust-score", id, delta });
  }, []);

  const setScore = useCallback((id: string, score: number) => {
    dispatch({ type: "set-score", id, score });
  }, []);

  const resetScores = useCallback(() => {
    dispatch({ type: "reset-scores" });
  }, []);

  const resetGame = useCallback(() => {
    clearState();
    dispatch({ type: "replace", state: loadState() });
  }, []);

  const summary = useMemo((): GameSummary => {
    const total = state.players.reduce((acc, player) => acc + player.score, 0);
    const leader = state.players.reduce<Player | null>((top, player) => {
      if (!top || player.score > top.score) {
        return player;
      }
      return top;
    }, null);

    return {
      totalScore: total,
      leader,
    };
  }, [state.players]);

  return {
    state,
    addPlayer,
    removePlayer,
    renamePlayer,
    adjustScore,
    setScore,
    resetScores,
    resetGame,
    summary,
  };
}
