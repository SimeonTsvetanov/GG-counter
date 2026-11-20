import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import { MIGRATED_KEY, NEW_STATE_KEY, NEW_THEME_KEY, NULL_ENTRY_STATE, STATE_KEY, THEME_KEY, V1_STATE, V1_STATE_READ, V2_STATE } from "gg-counter-core/test-fixtures";
import { GAME_VERSION, adjustScore } from "gg-counter-core";
import { FakeStorage, useStorage } from "./fake-storage.ts";

const NOW = "2026-11-19T12:00:00.000Z";

/** Loads fresh copies of the game and theme modules. */
async function loadModules() {
  vi.resetModules();
  const [game, theme, keys] = await Promise.all([
    import("../../src/storage/game.ts"),
    import("../../src/storage/theme.ts"),
    import("../../src/storage/keys.ts"),
  ]);
  return { ...game, ...theme, ...keys };
}

describe("keys", () => {
  it("are namespaced `gg-counter:v1:` (app.id — checked against app.config.ts in scripts/theme-init.test.ts) and match the e2e fixtures", async () => {
    const { STORAGE_KEYS, LEGACY_KEYS, KEY_PREFIX } = await loadModules();
    expect(KEY_PREFIX).toBe("gg-counter:v1:");
    expect(STORAGE_KEYS).toEqual({ state: NEW_STATE_KEY, theme: NEW_THEME_KEY, migrated: MIGRATED_KEY, lang: "gg-counter:v1:lang" });
    expect(LEGACY_KEYS).toEqual({ state: STATE_KEY, theme: THEME_KEY });
  });

  it("isOwnKey: the namespace and the two pre-forge keys only", async () => {
    const { isOwnKey } = await loadModules();
    for (const key of [NEW_STATE_KEY, NEW_THEME_KEY, MIGRATED_KEY, "gg-counter:v1:later", STATE_KEY, THEME_KEY]) expect(isOwnKey(key)).toBe(true);
    for (const key of ["theme", "gg-counter", "gg-counter-pro:v1:state", "teamsync-random-team-generator:v1:theme", "gg-counter/other", "x:gg-counter:v1:state"]) expect(isOwnKey(key)).toBe(false);
  });
});

describe("upgrade to 1.1 (score history, game version 2)", () => {
  it("a 1.0.0 game under the new key → same players and scores; the next save writes version 2 with histories", async () => {
    const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V1_STATE) }));
    const { readGame, writeGame } = await loadModules();
    const game = readGame(NOW);
    expect(game).toEqual(V1_STATE_READ);
    const scored = adjustScore(game, "a1", { delta: 1, entryId: "n1", at: NOW });
    expect(scored.ok && writeGame(scored.value, NOW)).toEqual({ ok: true });
    const saved: unknown = JSON.parse(storage.getItem(NEW_STATE_KEY) ?? "");
    expect(saved).toMatchObject({ version: 2, players: [{ name: "Ana", score: 35, history: [{ id: "n1", delta: 1, at: NOW }] }, { name: "Boris", score: 27, history: [] }, { name: "Чен", score: -3, history: [] }] });
  });

  it("a 1.1 game round-trips through storage unchanged", async () => {
    useStorage(new FakeStorage());
    const { readGame, writeGame } = await loadModules();
    writeGame(V2_STATE, V2_STATE.lastUpdated);
    expect(readGame(NOW)).toEqual(V2_STATE);
  });
});

describe("readGame / writeGame / removeGame", () => {
  it("nothing saved → an empty game", async () => {
    useStorage(new FakeStorage());
    const { readGame } = await loadModules();
    expect(readGame(NOW)).toEqual({ players: [], lastUpdated: NOW, version: GAME_VERSION });
  });

  it("reads the namespaced key only (the pre-forge key is the migration's job)", async () => {
    useStorage(new FakeStorage({ [STATE_KEY]: JSON.stringify(V1_STATE) }));
    const { readGame } = await loadModules();
    expect(readGame(NOW).players).toEqual([]);
  });

  it("reads a saved game; a null entry is dropped and the valid players survive", async () => {
    useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(NULL_ENTRY_STATE) }));
    const { readGame } = await loadModules();
    expect(readGame(NOW).players.map((p) => p.name)).toEqual(["Ana"]);
  });

  it("broken JSON or a value that is not a game → an empty game", async () => {
    for (const raw of ["{not json", "null", "[1,2]", "42"]) {
      useStorage(new FakeStorage({ [NEW_STATE_KEY]: raw }));
      const { readGame } = await loadModules();
      expect(readGame(NOW)).toEqual({ players: [], lastUpdated: NOW, version: GAME_VERSION });
    }
  });

  it("property: readGame never throws and always returns a game, whatever is stored", async () => {
    const storage = useStorage(new FakeStorage());
    const { readGame } = await loadModules();
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json()), (raw) => {
        storage.items.set(NEW_STATE_KEY, raw);
        const game = readGame(NOW);
        expect(Array.isArray(game.players)).toBe(true);
        expect(game.version).toBe(GAME_VERSION);
      })
    );
  });

  it("writeGame stamps version and time, writes the new key only; removeGame removes it only", async () => {
    const storage = useStorage(new FakeStorage({ [STATE_KEY]: "old" }));
    const { writeGame, removeGame } = await loadModules();
    expect(writeGame({ ...V1_STATE_READ, version: 0 }, NOW)).toEqual({ ok: true });
    expect(JSON.parse(storage.getItem(NEW_STATE_KEY) ?? "")).toEqual({ ...V1_STATE_READ, lastUpdated: NOW, version: GAME_VERSION });
    expect(removeGame()).toEqual({ ok: true });
    expect(storage.snapshot()).toEqual({ [STATE_KEY]: "old" });
  });

  it("writeGame on a full storage says persistence is off, and the game is still read this session", async () => {
    const storage = useStorage(new FakeStorage());
    storage.writeBehaviour = () => "full";
    const { writeGame, readGame } = await loadModules();
    expect(writeGame(V1_STATE_READ, NOW)).toMatchObject({ ok: false, error: { code: "STORAGE_FULL" } });
    expect(readGame(NOW).players).toHaveLength(3);
  });
});

describe("readTheme / writeTheme", () => {
  it("reads light, dark and system; nothing or anything else → null", async () => {
    const storage = useStorage(new FakeStorage());
    const { readTheme } = await loadModules();
    expect(readTheme()).toBeNull();
    for (const theme of ["light", "dark", "system"] as const) {
      storage.items.set(NEW_THEME_KEY, JSON.stringify(theme));
      expect(readTheme()).toBe(theme);
    }
    for (const raw of ["dark", "\"blue\"", "{", "1", "null"]) {
      storage.items.set(NEW_THEME_KEY, raw);
      expect(readTheme()).toBeNull();
    }
  });

  it("property: readTheme never throws and returns a theme or null", async () => {
    const storage = useStorage(new FakeStorage());
    const { readTheme } = await loadModules();
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json()), (raw) => {
        storage.items.set(NEW_THEME_KEY, raw);
        expect([null, "light", "dark", "system"]).toContain(readTheme());
      })
    );
  });

  it("writes light/dark as JSON and removes the key for system; the pre-forge key is never touched", async () => {
    const storage = useStorage(new FakeStorage({ [THEME_KEY]: "dark" }));
    const { writeTheme } = await loadModules();
    expect(writeTheme("light")).toEqual({ ok: true });
    expect(storage.getItem(NEW_THEME_KEY)).toBe("\"light\"");
    expect(writeTheme("system")).toEqual({ ok: true });
    expect(storage.snapshot()).toEqual({ [THEME_KEY]: "dark" });
  });
});
