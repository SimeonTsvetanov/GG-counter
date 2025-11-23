import type { GameState, Player } from "../types";

const STORAGE_KEY = "gg-counter/state";
const STORAGE_VERSION = 1;

const DEFAULT_STATE: GameState = {
  players: [],
  lastUpdated: new Date().toISOString(),
  version: STORAGE_VERSION,
};

interface RawPlayer {
  id?: unknown;
  name?: unknown;
  score?: unknown;
  createdAt?: unknown;
}

interface RawState {
  players?: unknown;
  lastUpdated?: unknown;
  version?: unknown;
}

function isValidPlayer(raw: RawPlayer): raw is Player {
  return (
    typeof raw.id === "string" &&
    typeof raw.name === "string" &&
    Number.isFinite(raw.score) &&
    typeof raw.createdAt === "string"
  );
}

function sanitizePlayers(players: unknown): Player[] {
  if (!Array.isArray(players)) {
    return [];
  }

  return players
    .map((item) => ({
      id: (item as RawPlayer).id,
      name: (item as RawPlayer).name,
      score: Number((item as RawPlayer).score),
      createdAt: (item as RawPlayer).createdAt,
    }))
    .filter(isValidPlayer);
}

function fromRawState(raw: RawState | null): GameState {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_STATE;
  }

  const version = typeof raw.version === "number" ? raw.version : 0;
  const players = sanitizePlayers(raw.players);
  const lastUpdated =
    typeof raw.lastUpdated === "string"
      ? raw.lastUpdated
      : new Date().toISOString();

  if (version !== STORAGE_VERSION) {
    return {
      ...DEFAULT_STATE,
      players,
      lastUpdated,
    };
  }

  return {
    players,
    lastUpdated,
    version,
  };
}

export function loadState(): GameState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const item = window.localStorage.getItem(STORAGE_KEY);

    if (!item) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(item) as RawState;
    const state = fromRawState(parsed);

    if (state.version !== STORAGE_VERSION) {
      return {
        ...state,
        version: STORAGE_VERSION,
      };
    }

    return state;
  } catch (error) {
    console.error("Failed to read state from storage", error);
    return DEFAULT_STATE;
  }
}

export function saveState(getState: () => GameState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const state = getState();
    const payload: GameState = {
      ...state,
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to persist state", error);
  }
}

export function clearState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
