import { useCallback, useEffect, useMemo, useReducer } from "react";
import { clearState, loadState, saveState } from "../lib/storage";
import type { GameState, Player } from "../types";

const MAX_PLAYERS = 16;

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

function ensurePlayerName(name: string, fallbackIndex: number) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : `Player ${fallbackIndex}`;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "replace": {
      return action.state;
    }
    case "add-player": {
      if (state.players.length >= MAX_PLAYERS) {
        return state;
      }
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
        players: state.players.map((player) =>
          player.id === action.id
            ? {
                ...player,
                name: ensurePlayerName(
                  action.name,
                  state.players.indexOf(player) + 1
                ),
              }
            : player
        ),
      };
    }
    case "adjust-score": {
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.id
            ? {
                ...player,
                score: player.score + action.delta,
              }
            : player
        ),
      };
    }
    case "set-score": {
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.id
            ? {
                ...player,
                score: action.score,
              }
            : player
        ),
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

export function useGameState() {
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

  const summary = useMemo(() => {
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
