// Reads a player's saved score history (game version 2, SPEC 1.1 F15) for saved-state.ts. Games saved
// before 1.1 have no `history` field: that is an empty, intact history (the score is the base).
import type { ScoreEntry } from "./game.ts";
import { capHistory } from "./history.ts";
import { isObject } from "./unchecked.ts";

/** A saved history as read: its valid entries and whether every saved entry was valid. */
export interface HistoryRead {
  readonly history: readonly ScoreEntry[];
  /** False when the value was not a list or an entry was dropped (wrong field, delta 0, repeated id). */
  readonly isIntact: boolean;
}

/** Returns the entry saved in `value`, or null when a field is missing or has the wrong type. */
function readEntry(value: unknown): ScoreEntry | null {
  if (!isObject(value)) return null;
  const { id, delta, at } = value;
  if (typeof id !== "string" || id === "" || typeof at !== "string" || Number.isNaN(Date.parse(at))) return null;
  // because a delta is always a JSON number written by the app; 0 is never recorded
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) return null;
  return { id, delta, at };
}

/**
 * Returns the valid entries of a saved history, oldest first, and whether all of them were valid.
 *
 * @remarks Invalid entries and repeated ids are dropped; more than `MAX_HISTORY_ENTRIES` keeps the newest
 * (the older ones are folded into the score's base, which is not damage).
 */
export function readHistory(value: unknown): HistoryRead {
  if (value === undefined) return { history: [], isIntact: true };
  if (!Array.isArray(value)) return { history: [], isIntact: false };
  const items: readonly unknown[] = value;
  const seen = new Set<string>();
  const entries: ScoreEntry[] = [];
  for (const item of items) {
    const entry = readEntry(item);
    if (entry === null || seen.has(entry.id)) continue;
    seen.add(entry.id);
    entries.push(entry);
  }
  return { history: capHistory(entries), isIntact: entries.length === items.length };
}
