import { afterEach, describe, expect, it, vi } from "vitest";
import { DIRTY_STATE, MIGRATED_KEY, NEW_STATE_KEY, NEW_THEME_KEY, NULL_ENTRY_STATE, STATE_KEY, THEME_KEY, V0_STATE, V1_STATE, V1_STATE_READ } from "gg-counter-core/test-fixtures";
import { GAME_VERSION } from "gg-counter-core";
import { FakeStorage, OTHER_APPS, blockStorage, unblockStorage, useStorage } from "./fake-storage.ts";

const NOW = "2026-11-19T12:00:00.000Z";
const OLD_STATE = JSON.stringify(V1_STATE);

/** Loads fresh copies of the storage modules (as on a new page load). */
async function start() {
  vi.resetModules();
  const [migrate, game, theme] = await Promise.all([
    import("../../src/storage/migrate.ts"),
    import("../../src/storage/game.ts"),
    import("../../src/storage/theme.ts"),
  ]);
  return { ...migrate, ...game, ...theme };
}

/** Returns the parsed migration marker, or null. */
function markerOf(storage: FakeStorage): unknown {
  return JSON.parse(storage.getItem(MIGRATED_KEY) ?? "null");
}

afterEach(unblockStorage);

describe("migrateLegacyStorage", () => {
  it("only old keys (a typical existing user): copies game and theme, verifies, marks, keeps the old values", async () => {
    const storage = useStorage(new FakeStorage({ [STATE_KEY]: OLD_STATE, [THEME_KEY]: "dark" }));
    const { migrateLegacyStorage, readGame, readTheme } = await start();
    expect(migrateLegacyStorage(NOW)).toEqual({ outcomes: { state: "copied", theme: "copied" }, markerWritten: true });
    expect(JSON.parse(storage.getItem(NEW_STATE_KEY) ?? "")).toEqual(V1_STATE_READ);
    expect(storage.getItem(NEW_THEME_KEY)).toBe("\"dark\"");
    expect(markerOf(storage)).toEqual({ migratedAt: NOW, sourceVersion: 1, items: ["state", "theme"] });
    expect(storage.getItem(STATE_KEY)).toBe(OLD_STATE);
    expect(storage.getItem(THEME_KEY)).toBe("dark");
    expect(readGame(NOW)).toEqual(V1_STATE_READ);
    expect(readTheme()).toBe("dark");
  });

  it("only new keys: they win, the old keys are never read", async () => {
    const newState = JSON.stringify(V0_STATE);
    const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: newState, [NEW_THEME_KEY]: "\"light\"" }));
    const getItem = vi.spyOn(storage, "getItem");
    const { migrateLegacyStorage } = await start();
    expect(migrateLegacyStorage(NOW).outcomes).toEqual({ state: "new-key-wins", theme: "new-key-wins" });
    expect(getItem.mock.calls.flat()).not.toContain(STATE_KEY);
    expect(getItem.mock.calls.flat()).not.toContain(THEME_KEY);
    expect(storage.getItem(NEW_STATE_KEY)).toBe(newState);
    expect(markerOf(storage)).toMatchObject({ items: ["state", "theme"] });
  });

  it("both present with different games: the new one wins and nothing is overwritten", async () => {
    const newState = JSON.stringify(V0_STATE);
    const storage = useStorage(new FakeStorage({ [STATE_KEY]: OLD_STATE, [THEME_KEY]: "dark", [NEW_STATE_KEY]: newState, [NEW_THEME_KEY]: "\"light\"" }));
    const { migrateLegacyStorage, readGame, readTheme } = await start();
    expect(migrateLegacyStorage(NOW).outcomes).toEqual({ state: "new-key-wins", theme: "new-key-wins" });
    expect(readGame(NOW).players.map((p) => p.name)).toEqual(["Ana", "Boris"]);
    expect(readTheme()).toBe("light");
    expect(storage.getItem(STATE_KEY)).toBe(OLD_STATE);
    expect(storage.getItem(NEW_STATE_KEY)).toBe(newState);
  });

  it("neither key (a new user): nothing written, not even a marker", async () => {
    const storage = useStorage(new FakeStorage());
    const { migrateLegacyStorage } = await start();
    expect(migrateLegacyStorage(NOW)).toEqual({ outcomes: { state: "nothing-to-migrate", theme: "nothing-to-migrate" }, markerWritten: false });
    expect(storage.snapshot()).toEqual({});
  });

  it("old game is broken JSON: empty game as before, the old value kept and not hidden by a marker", async () => {
    const storage = useStorage(new FakeStorage({ [STATE_KEY]: "{not json" }));
    const { migrateLegacyStorage, readGame } = await start();
    expect(migrateLegacyStorage(NOW)).toEqual({ outcomes: { state: "old-value-invalid", theme: "nothing-to-migrate" }, markerWritten: false });
    expect(storage.snapshot()).toEqual({ [STATE_KEY]: "{not json" });
    expect(readGame(NOW).players).toEqual([]);
  });

  it("old game with a null entry: the valid players survive (T-04 fix) in the new key", async () => {
    const storage = useStorage(new FakeStorage({ [STATE_KEY]: JSON.stringify(NULL_ENTRY_STATE) }));
    const { migrateLegacyStorage, readGame } = await start();
    expect(migrateLegacyStorage(NOW).outcomes.state).toBe("copied");
    expect(readGame(NOW).players.map((p) => p.name)).toEqual(["Ana"]);
    expect(storage.getItem(STATE_KEY)).toBe(JSON.stringify(NULL_ENTRY_STATE));
  });

  it("old games without a version or with dirty entries are copied as core reads them", async () => {
    for (const [state, names] of [[V0_STATE, ["Ana", "Boris"]], [DIRTY_STATE, ["Valid"]]] as const) {
      useStorage(new FakeStorage({ [STATE_KEY]: JSON.stringify(state) }));
      const { migrateLegacyStorage, readGame } = await start();
      migrateLegacyStorage(NOW);
      const game = readGame(NOW);
      expect(game.players.map((p) => p.name)).toEqual(names);
      expect(game.version).toBe(GAME_VERSION);
    }
  });

  it("old theme dark with no game: the theme is copied and only it is marked", async () => {
    const storage = useStorage(new FakeStorage({ [THEME_KEY]: "dark" }));
    const { migrateLegacyStorage, readTheme, readGame } = await start();
    expect(migrateLegacyStorage(NOW).outcomes).toEqual({ state: "nothing-to-migrate", theme: "copied" });
    expect(readTheme()).toBe("dark");
    expect(readGame(NOW).players).toEqual([]);
    expect(markerOf(storage)).toMatchObject({ items: ["theme"] });
  });

  it("an old theme that is not light/dark is not copied (the app follows the system, as before)", async () => {
    const storage = useStorage(new FakeStorage({ [THEME_KEY]: "blue" }));
    const { migrateLegacyStorage } = await start();
    expect(migrateLegacyStorage(NOW).outcomes.theme).toBe("old-value-invalid");
    expect(storage.snapshot()).toEqual({ [THEME_KEY]: "blue" });
  });

  it("storage blocked: never throws, nothing to migrate, the app starts empty", async () => {
    blockStorage();
    const { migrateLegacyStorage, readGame } = await start();
    expect(migrateLegacyStorage(NOW)).toEqual({ outcomes: { state: "nothing-to-migrate", theme: "nothing-to-migrate" }, markerWritten: false });
    expect(readGame(NOW).players).toEqual([]);
  });

  it("storage full or a read-back that differs: not marked, old values kept, the game shown from memory this session", async () => {
    for (const behaviour of ["full", "corrupt"] as const) {
      const storage = useStorage(new FakeStorage({ [STATE_KEY]: OLD_STATE, [THEME_KEY]: "dark" }));
      storage.writeBehaviour = () => behaviour;
      const { migrateLegacyStorage, readGame } = await start();
      expect(migrateLegacyStorage(NOW)).toEqual({ outcomes: { state: "not-saved", theme: "not-saved" }, markerWritten: false });
      expect(storage.snapshot()).toEqual({ [STATE_KEY]: OLD_STATE, [THEME_KEY]: "dark" });
      expect(readGame(NOW)).toEqual(V1_STATE_READ);
    }
  });

  it("run twice (every start): the second run changes nothing", async () => {
    const storage = useStorage(new FakeStorage({ [STATE_KEY]: OLD_STATE, [THEME_KEY]: "dark" }));
    (await start()).migrateLegacyStorage(NOW);
    const after = storage.snapshot();
    expect((await start()).migrateLegacyStorage("2026-12-01T00:00:00.000Z")).toEqual({ outcomes: { state: "already-migrated", theme: "already-migrated" }, markerWritten: false });
    expect(storage.snapshot()).toEqual(after);
  });

  it("after the migration, choosing system or clearing the game never brings the old values back", async () => {
    const storage = useStorage(new FakeStorage({ [STATE_KEY]: OLD_STATE, [THEME_KEY]: "dark" }));
    const first = await start();
    first.migrateLegacyStorage(NOW);
    first.writeTheme("system");
    first.removeGame();
    const next = await start();
    next.migrateLegacyStorage(NOW);
    expect(next.readTheme()).toBeNull();
    expect(next.readGame(NOW).players).toEqual([]);
    expect(storage.getItem(STATE_KEY)).toBe(OLD_STATE);
  });

  it("a later run completes an item the first run could not, and keeps the earlier one marked", async () => {
    const storage = useStorage(new FakeStorage({ [STATE_KEY]: "{not json", [THEME_KEY]: "dark" }));
    (await start()).migrateLegacyStorage(NOW);
    expect(markerOf(storage)).toMatchObject({ items: ["theme"] });
    storage.items.set(NEW_STATE_KEY, JSON.stringify(V0_STATE)); // the user played: the app saved a game
    expect((await start()).migrateLegacyStorage(NOW)).toEqual({ outcomes: { state: "new-key-wins", theme: "already-migrated" }, markerWritten: true });
    expect(markerOf(storage)).toMatchObject({ items: ["theme", "state"] });
  });

  it("an unreadable or foreign marker is ignored safely (the new keys still win)", async () => {
    for (const marker of ["{broken", "null", "{\"items\":\"state\"}", "{\"items\":[\"other\"]}"]) {
      const storage = useStorage(new FakeStorage({ [MIGRATED_KEY]: marker, [STATE_KEY]: OLD_STATE, [NEW_STATE_KEY]: JSON.stringify(V0_STATE) }));
      const { migrateLegacyStorage } = await start();
      expect(migrateLegacyStorage(NOW).outcomes.state).toBe("new-key-wins");
      expect(storage.getItem(NEW_STATE_KEY)).toBe(JSON.stringify(V0_STATE));
    }
  });

  it("another forge app's keys and an unrelated `theme` key are neither read nor changed", async () => {
    const storage = useStorage(new FakeStorage({ ...OTHER_APPS, [STATE_KEY]: OLD_STATE }));
    const getItem = vi.spyOn(storage, "getItem");
    const { migrateLegacyStorage, readTheme } = await start();
    migrateLegacyStorage(NOW);
    expect(readTheme()).toBeNull();
    const read = new Set(getItem.mock.calls.map(([key]) => key));
    for (const key of Object.keys(OTHER_APPS)) expect(read.has(key)).toBe(false);
    for (const [key, value] of Object.entries(OTHER_APPS)) expect(storage.getItem(key)).toBe(value);
  });
});
