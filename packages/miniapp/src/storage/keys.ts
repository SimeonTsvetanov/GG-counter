// The storage keys of GG Counter. All of Moni's apps share the origin simeontsvetanov.github.io, so
// every key is namespaced `<app.id>:v1:<name>` (engineering → browser-storage §2). Used by the other
// storage modules only (packages/miniapp/src/storage and the standalone shell's app/src/storage).
import { STANDALONE_ID } from "../meta";

/** This app's id (`app.config.id`, scripts/miniapp-sync.test.ts); the package never imports app.config.ts. */
export const APP_ID: string = STANDALONE_ID;

/** The start of every key this app writes. */
export const KEY_PREFIX = `${APP_ID}:v1:`;

/** The keys written since PLAN T-07 (game, theme, one-time migration marker) and T-09 (UI language). */
export const STORAGE_KEYS = {
  state: `${KEY_PREFIX}state`,
  theme: `${KEY_PREFIX}theme`,
  migrated: `${KEY_PREFIX}migrated`,
  lang: `${KEY_PREFIX}lang`,
} as const;

/**
 * The keys of the pre-forge app (SPEC §4): read by the migration, never written.
 *
 * @remarks 2026-11-19 (PLAN T-07): kept untouched in this release, so nothing is lost if a new value
 * cannot be verified and an older cached copy of the app still finds its data. Removal is planned in
 * PLAN T-14: a later release of its own, at least 30 days after this one is live, deletes an old key
 * only when the marker `gg-counter:v1:migrated` lists its item (the new value was verified); never
 * while the marker is missing.
 */
export const LEGACY_KEYS = {
  state: "gg-counter/state",
  theme: "gg-counter-theme",
} as const;

/** Returns true for a key of this app: in its namespace or one of the pre-forge keys. */
export function isOwnKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX) || key === LEGACY_KEYS.state || key === LEGACY_KEYS.theme;
}
