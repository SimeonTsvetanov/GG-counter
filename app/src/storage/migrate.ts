// One-time copy of the pre-forge keys (`gg-counter/state`, `gg-counter-theme`) to the namespaced
// keys (flow → migrate §1). Run by main.tsx before the first render, on every start: it is idempotent
// and cheap. The old keys are never written or removed here (removal plan: LEGACY_KEYS in keys.ts).
import { LEGACY_KEYS, STORAGE_KEYS } from "./keys";
import { readRaw, writeRaw } from "./local-store";
import { decodeGame, encodeGame } from "./game";
import { encodeTheme } from "./theme";

/**
 * The saved-game version of the pre-forge key, written to the marker as `sourceVersion`. Not core's
 * `GAME_VERSION`, which moved to 2 in 1.1: the copied value is converted to it, the source stays 1.
 */
const LEGACY_GAME_VERSION = 1;

/** A saved item that has a pre-forge key. */
export type MigratedItem = "state" | "theme";

/** What happened to one item on this start. */
export type MigrationOutcome =
  /** The marker lists the item: the old key is not read. */
  | "already-migrated"
  /** The new key already holds a value: it wins, the old key is not read. */
  | "new-key-wins"
  /** Neither key holds a value. */
  | "nothing-to-migrate"
  /** The old value was valid, written to the new key and read back equal. */
  | "copied"
  /** The old value is not valid: nothing written, the app starts as before T-07 (empty game / system theme). */
  | "old-value-invalid"
  /** The browser did not keep the new value (blocked, full, read-back differs): it lives in memory this session. */
  | "not-saved";

/** The result of {@link migrateLegacyStorage}. */
export interface MigrationReport {
  readonly outcomes: Readonly<Record<MigratedItem, MigrationOutcome>>;
  /** True when the marker was written (or updated) on this start. */
  readonly markerWritten: boolean;
}

/** How one item moves from its old key to its new key. */
interface LegacyItem {
  readonly oldKey: string;
  readonly newKey: string;
  /** Returns the value to store under the new key, or null when the old value is invalid. */
  readonly convert: (oldValue: string, now: string) => string | null;
}

const ITEMS: Readonly<Record<MigratedItem, LegacyItem>> = {
  state: {
    oldKey: LEGACY_KEYS.state,
    newKey: STORAGE_KEYS.state,
    convert: (oldValue, now) => {
      const game = decodeGame(oldValue, now);
      return game ? encodeGame(game) : null;
    },
  },
  theme: {
    oldKey: LEGACY_KEYS.theme,
    newKey: STORAGE_KEYS.theme,
    // because the pre-forge app stored the bare word, not JSON, and never stored "system"
    convert: (oldValue) => (oldValue === "light" || oldValue === "dark" ? encodeTheme(oldValue) : null),
  },
};

/** Outcomes after which the old key is never read again. */
const SETTLED: ReadonlySet<MigrationOutcome> = new Set<MigrationOutcome>(["already-migrated", "new-key-wins", "copied"]);

/** Returns the items the stored marker lists as migrated; a missing or unreadable marker lists none. */
function readMigratedItems(): Set<MigratedItem> {
  const raw = readRaw(STORAGE_KEYS.migrated);
  if (raw === null) return new Set();
  let marker: unknown;
  try {
    marker = JSON.parse(raw);
  } catch {
    // because an unreadable marker only means the copy runs again, which is safe (the new key wins)
    return new Set();
  }
  const items = typeof marker === "object" && marker !== null && "items" in marker ? marker.items : undefined;
  if (!Array.isArray(items)) return new Set();
  return new Set(items.filter((item): item is MigratedItem => item === "state" || item === "theme"));
}

/** Moves one item: the new key wins; else a valid old value is written and verified (writeRaw reads it back). */
function migrateItem(item: LegacyItem, now: string): MigrationOutcome {
  if (readRaw(item.newKey) !== null) return "new-key-wins";
  const oldValue = readRaw(item.oldKey);
  if (oldValue === null) return "nothing-to-migrate";
  const newValue = item.convert(oldValue, now);
  if (newValue === null) return "old-value-invalid";
  return writeRaw(item.newKey, newValue).ok ? "copied" : "not-saved";
}

/**
 * Copies the pre-forge game and theme to the namespaced keys once, keeping the old values.
 *
 * @param now - ISO 8601 time for the marker and for a saved game without `lastUpdated`.
 * @returns What happened per item; never throws (storage problems become `not-saved` / `nothing-to-migrate`).
 * @remarks The marker `gg-counter:v1:migrated` = `{ migratedAt, sourceVersion, items }` lists only the
 * items whose new value exists and was verified, so an invalid or unsaved old value is never hidden.
 */
export function migrateLegacyStorage(now: string = new Date().toISOString()): MigrationReport {
  const migrated = readMigratedItems();
  const before = migrated.size;
  const outcomes: Record<MigratedItem, MigrationOutcome> = { state: "already-migrated", theme: "already-migrated" };
  for (const name of ["state", "theme"] as const) {
    if (migrated.has(name)) continue;
    outcomes[name] = migrateItem(ITEMS[name], now);
    if (SETTLED.has(outcomes[name])) migrated.add(name);
  }
  if (migrated.size === before) return { outcomes, markerWritten: false };
  // sourceVersion: the pre-forge layout (unversioned keys, saved game version 1) the values came from.
  const marker = { migratedAt: now, sourceVersion: LEGACY_GAME_VERSION, items: [...migrated] };
  return { outcomes, markerWritten: writeRaw(STORAGE_KEYS.migrated, JSON.stringify(marker)).ok };
}
