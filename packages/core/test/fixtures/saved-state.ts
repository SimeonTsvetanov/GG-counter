// Real shapes written to localStorage by GG Counter before the forge migration (commit 83fd838).
// The key and these shapes are a contract with existing users: the app must keep loading them.

export const STATE_KEY = "gg-counter/state";
export const THEME_KEY = "gg-counter-theme"; // "light" | "dark"; the key is removed for "system"

// The namespaced keys written since PLAN T-07 (`<app.id>:v1:<name>`, app/src/storage/keys.ts); the
// pre-forge keys above are copied to them once and left untouched.
export const NEW_STATE_KEY = "gg-counter:v1:state";
export const NEW_THEME_KEY = "gg-counter:v1:theme"; // JSON: "\"light\"" | "\"dark\""; removed for "system"
export const MIGRATED_KEY = "gg-counter:v1:migrated"; // { migratedAt, sourceVersion, items }

/** Version 1 — what every current user has. */
export const V1_STATE = {
  players: [
    { id: "a1", name: "Ana", score: 34, createdAt: "2025-12-01T19:00:00.000Z" },
    { id: "b2", name: "Boris", score: 27, createdAt: "2025-12-01T19:00:05.000Z" },
    { id: "c3", name: "Чен", score: -3, createdAt: "2025-12-01T19:00:09.000Z" },
  ],
  lastUpdated: "2025-12-01T21:30:00.000Z",
  version: 1,
};

/** No version field (older builds): players are kept. */
export const V0_STATE = { players: V1_STATE.players.slice(0, 2), lastUpdated: "2025-11-01T10:00:00.000Z" };

/** Entries with wrong field types are dropped, valid ones kept; a numeric string score is accepted. */
export const DIRTY_STATE = {
  players: [{ id: "x", name: "Valid", score: "12", createdAt: "2025-12-01T19:00:00.000Z" }, { id: 7, name: "NoId" }],
  version: 1,
};

/**
 * A `null` entry among the players. The pre-forge app's loader threw on it and showed (then saved) an
 * empty game; since PLAN T-04 the entry is dropped and the valid players survive.
 */
export const NULL_ENTRY_STATE = { players: [V1_STATE.players[0], null], version: 1 };
