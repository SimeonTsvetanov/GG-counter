// The eager description of the Scores mini-app (contract `MiniAppMeta`, Quizzard PLAN §1.2): Quizzard's
// Home card, route and Settings → Data read it without loading the game screen. Also the few values of
// the repo's app.config.ts the package needs, because it never imports that file (Quizzard bundles the
// package alone); scripts/miniapp-sync.test.ts keeps them equal.
import type { MiniAppMeta, StorageArea } from "./contract.ts";

/**
 * The browser storage the screen owns (contract `StorageArea`); the standalone page's context takes it
 * from here too.
 * @remarks The standalone site's real area (Quizzard PLAN §1.1 item 8). The game screen writes `state`
 * (the game) and `migrated` (the one-time copy marker) under the prefix and copies the two pre-forge keys
 * (read only, never written). The standalone shell keeps its own prefs under the same prefix (`theme`,
 * `lang`, `last-seen-version`), so they are part of the area on purpose: both sites share the origin,
 * and clearing the area matches the standalone "Clear my data" (every `gg-counter:v1:*` key and the two
 * pre-forge keys). No IndexedDB database, no OPFS folder.
 */
export const STORAGE_AREA: StorageArea = { prefix: "gg-counter:v1:", extraKeys: ["gg-counter/state", "gg-counter-theme"] };

/**
 * The Scores mini-app's meta.
 * @remarks
 * - `icon` is a path relative to the host page, not a bundled asset: Quizzard serves its own mark
 *   there (`miniapps/scores.svg`); the standalone site shows no mini-app icon.
 * - `storage` = {@link STORAGE_AREA}.
 */
export const meta: MiniAppMeta = {
  contract: 1,
  id: "scores",
  name: { en: "Scores", bg: "Точки" },
  tagline: { en: "Keep score on game night", bg: "Резултатът на игралната вечер" },
  icon: "miniapps/scores.svg",
  languages: ["en", "bg"],
  status: "ready",
  storage: STORAGE_AREA,
};

/** The standalone site's id (`app.config.id`): the storage namespace `gg-counter:v1:` and the export file's `app`. */
export const STANDALONE_ID = "gg-counter";

/** The standalone site's name (`app.config.name`); shared leaderboards and the share title carry it. */
export const STANDALONE_NAME = "GG Counter";

/** The standalone site (`app.config.url`); every shared leaderboard ends with it (the attribution line). */
export const STANDALONE_URL = "https://simeontsvetanov.github.io/GG-counter/";
