import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MIGRATED_KEY, NEW_STATE_KEY, NEW_THEME_KEY, NULL_ENTRY_STATE, STATE_KEY, THEME_KEY, V0_STATE, V1_STATE, V1_STATE_READ, V2_STATE } from "gg-counter-core/test-fixtures";
import { GAME_VERSION } from "gg-counter-core";
import { FakeStorage, OTHER_APPS, blockStorage, unblockStorage, useStorage } from "gg-counter-miniapp/test/fake-storage";

const NOW = "2026-11-19T12:00:00.000Z";
/** The UI language key (PLAN T-09). */
const LANG_KEY = "gg-counter:v1:lang";

/** Loads fresh copies of the storage modules. */
async function start() {
  vi.resetModules();
  const [data, game] = await Promise.all([import("../../src/storage/index.ts"), import("gg-counter-miniapp/storage/game")]);
  return { ...data, ...game };
}

/** Returns the text of an export file with `changes` applied to a valid one. */
function exportText(changes: Record<string, unknown> = {}, data: Record<string, unknown> = {}): string {
  return JSON.stringify({ app: "gg-counter", schemaVersion: 1, exportedAt: NOW, data: { state: V1_STATE, theme: "dark", ...data }, ...changes });
}

afterEach(unblockStorage);

describe("exportData", () => {
  it("returns { app, schemaVersion, exportedAt, data: { state, theme, lang } }", async () => {
    useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V1_STATE), [NEW_THEME_KEY]: "\"dark\"", [LANG_KEY]: "\"bg\"" }));
    const { exportData } = await start();
    expect(exportData(NOW)).toEqual({ app: "gg-counter", schemaVersion: 1, exportedAt: NOW, data: { state: V1_STATE_READ, theme: "dark", lang: "bg" } });
  });

  it("nothing saved → an empty game, the system theme and no language choice", async () => {
    useStorage(new FakeStorage({ [STATE_KEY]: JSON.stringify(V1_STATE), [LANG_KEY]: "\"de\"" }));
    const { exportData } = await start();
    expect(exportData(NOW).data).toEqual({ state: { players: [], lastUpdated: NOW, version: GAME_VERSION }, theme: "system", lang: null });
  });
});

describe("score history in export files (SPEC 1.1 F15)", () => {
  it("an export carries each player's history; export → clear → import gives it back", async () => {
    useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V2_STATE) }));
    const { exportData, clearData, importData, readGame } = await start();
    const file = exportData(NOW);
    expect(file.data.state).toEqual(V2_STATE);
    clearData();
    expect(importData(JSON.stringify(file), NOW).ok).toBe(true);
    expect(readGame(NOW)).toEqual(V2_STATE);
  });

  it("a 1.0.0 export file (no history) still imports: same players and scores, empty histories", async () => {
    useStorage(new FakeStorage());
    const { importData, readGame } = await start();
    expect(importData(exportText(), NOW)).toMatchObject({ ok: true, value: { state: V1_STATE_READ } });
    expect(readGame(NOW)).toEqual(V1_STATE_READ);
  });

  it("a damaged history is refused with the reason in the message", async () => {
    useStorage(new FakeStorage());
    const { checkImport } = await start();
    const damaged = { ...V2_STATE, players: [V2_STATE.players[0], { ...V2_STATE.players[1], history: [{ id: "x", delta: "1", at: NOW }] }] };
    expect(checkImport(exportText({}, { state: damaged }), NOW)).toEqual({
      ok: false,
      error: { code: "IMPORT_INVALID", message: "The file is damaged. The score history of player 2 is damaged." },
    });
  });
});

describe("importData", () => {
  it("round trip: export → clear → import restores the same data", async () => {
    const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V1_STATE), [NEW_THEME_KEY]: "\"light\"", [LANG_KEY]: "\"en\"" }));
    const { exportData, clearData, importData } = await start();
    const file = JSON.stringify(exportData(NOW));
    clearData();
    expect(storage.snapshot()).toEqual({});
    expect(importData(file, NOW)).toEqual({ ok: true, value: { state: V1_STATE_READ, theme: "light", lang: "en" } });
    expect(exportData(NOW)).toEqual(JSON.parse(file));
  });

  it("replaces the current game and theme; system removes the saved theme", async () => {
    const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V0_STATE), [NEW_THEME_KEY]: "\"dark\"" }));
    const { importData, readGame } = await start();
    expect(importData(exportText({}, { theme: "system" }), NOW).ok).toBe(true);
    expect(readGame(NOW)).toEqual(V1_STATE_READ);
    expect(storage.getItem(NEW_THEME_KEY)).toBeNull();
  });

  it("writes the file's language; a file from before T-09 (no lang) keeps the current choice", async () => {
    const storage = useStorage(new FakeStorage({ [LANG_KEY]: "\"bg\"" }));
    const { importData } = await start();
    expect(importData(exportText(), NOW)).toMatchObject({ ok: true, value: { lang: null } });
    expect(storage.getItem(LANG_KEY)).toBe("\"bg\"");
    expect(importData(exportText({}, { lang: "en" }), NOW)).toMatchObject({ ok: true, value: { lang: "en" } });
    expect(storage.getItem(LANG_KEY)).toBe("\"en\"");
    expect(importData(exportText({}, { lang: null }), NOW).ok).toBe(true);
    expect(storage.getItem(LANG_KEY)).toBe("\"en\"");
  });

  const rejected: readonly (readonly [string, string, string])[] = [
    ["too big", " ".repeat(1_000_001), "IMPORT_TOO_BIG"],
    ["not JSON", "{oops", "IMPORT_NOT_JSON"],
    ["not an object", "[1]", "IMPORT_INVALID"],
    ["another app", exportText({ app: "teamsync-random-team-generator" }), "IMPORT_NOT_THIS_APP"],
    ["no app", exportText({ app: undefined }), "IMPORT_NOT_THIS_APP"],
    ["newer schema", exportText({ schemaVersion: 2 }), "IMPORT_UNSUPPORTED_VERSION"],
    ["no exportedAt", exportText({ exportedAt: 5 }), "IMPORT_INVALID"],
    ["no data", exportText({ data: null }), "IMPORT_INVALID"],
    ["bad theme", exportText({}, { theme: "blue" }), "IMPORT_INVALID"],
    ["unknown language", exportText({}, { lang: "de" }), "IMPORT_INVALID"],
    ["state not an object", exportText({}, { state: [] }), "IMPORT_INVALID"],
    ["players missing", exportText({}, { state: { lastUpdated: NOW } }), "IMPORT_INVALID"],
    ["one player invalid (never imports part of a game)", exportText({}, { state: NULL_ENTRY_STATE }), "IMPORT_INVALID"],
    ["a history that is not a list", exportText({}, { state: { ...V2_STATE, players: [{ ...V2_STATE.players[0], history: {} }] } }), "IMPORT_INVALID"],
    ["a history entry with delta 0", exportText({}, { state: { ...V2_STATE, players: [{ ...V2_STATE.players[0], history: [{ id: "e", delta: 0, at: NOW }] }] } }), "IMPORT_INVALID"],
  ];
  for (const [label, text, code] of rejected) {
    it(`${label} → ${code}, nothing changed`, async () => {
      const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V0_STATE), [NEW_THEME_KEY]: "\"light\"" }));
      const before = storage.snapshot();
      const { importData } = await start();
      const result = importData(text, NOW);
      expect(result).toMatchObject({ ok: false, error: { code } });
      expect(result.ok ? "" : result.error.message.length).toBeGreaterThan(0);
      expect(storage.snapshot()).toEqual(before);
    });
  }

  it("a failure on the second write rolls the first one back", async () => {
    const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V0_STATE) }));
    storage.writeBehaviour = (key) => (key === NEW_THEME_KEY ? "full" : "ok");
    const { importData, readGame } = await start();
    expect(importData(exportText(), NOW)).toMatchObject({ ok: false, error: { code: "STORAGE_FULL" } });
    expect(storage.snapshot()).toEqual({ [NEW_STATE_KEY]: JSON.stringify(V0_STATE) });
    expect(readGame(NOW).players.map((p) => p.name)).toEqual(["Ana", "Boris"]);
  });

  it("a failure on the language write rolls the game and the theme back", async () => {
    const before = { [NEW_STATE_KEY]: JSON.stringify(V0_STATE), [NEW_THEME_KEY]: "\"light\"", [LANG_KEY]: "\"bg\"" };
    const storage = useStorage(new FakeStorage(before));
    storage.writeBehaviour = (key) => (key === LANG_KEY ? "full" : "ok");
    const { importData } = await start();
    expect(importData(exportText({}, { lang: "en" }), NOW)).toMatchObject({ ok: false, error: { code: "STORAGE_FULL" } });
    expect(storage.snapshot()).toEqual(before);
  });

  it("a failure on the first write leaves an empty storage empty", async () => {
    const storage = useStorage(new FakeStorage());
    storage.writeBehaviour = () => "full";
    const { importData, readGame } = await start();
    expect(importData(exportText(), NOW)).toMatchObject({ ok: false, error: { code: "STORAGE_FULL" } });
    expect(storage.snapshot()).toEqual({});
    expect(readGame(NOW).players).toEqual([]);
  });

  it("blocked storage → STORAGE_UNAVAILABLE and nothing applied, not even in memory", async () => {
    blockStorage();
    const { importData, readGame } = await start();
    expect(importData(exportText(), NOW)).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(readGame(NOW).players).toEqual([]);
  });

  it("property: never throws; anything rejected leaves storage unchanged", async () => {
    const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V0_STATE), ...OTHER_APPS }));
    const before = storage.snapshot();
    const { importData } = await start();
    const anyExport = fc.record({ app: fc.constantFrom("gg-counter", "x"), schemaVersion: fc.constantFrom(1, 2), exportedAt: fc.string(), data: fc.anything() });
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json(), anyExport.map((value) => JSON.stringify(value))), (text) => {
        const result = importData(text, NOW);
        if (!result.ok) {
          expect(storage.snapshot()).toEqual(before);
          return;
        }
        // An accepted import replaced the data: put the starting point back for the next run.
        storage.items.clear();
        for (const [key, value] of Object.entries(before)) storage.items.set(key, value);
      })
    );
  });
});

describe("checkImport (Settings checks a file before asking to replace the game)", () => {
  it("returns the file's data without changing anything", async () => {
    const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: JSON.stringify(V0_STATE), ...OTHER_APPS }));
    const before = storage.snapshot();
    const { checkImport } = await start();
    expect(checkImport(exportText(), NOW)).toEqual({ ok: true, value: { state: V1_STATE_READ, theme: "dark", lang: null } });
    expect(storage.snapshot()).toEqual(before);
  });

  it("gives the same error code as importData for a bad file", async () => {
    useStorage(new FakeStorage());
    const { checkImport, importData } = await start();
    for (const text of ["{not json", exportText({ app: "other" }), exportText({ schemaVersion: 2 }), exportText({}, { theme: "blue" })]) {
      const checked = checkImport(text, NOW);
      expect(checked.ok).toBe(false);
      expect(checked).toEqual(importData(text, NOW));
    }
  });

  it("property: never throws and agrees with importData on what is accepted", async () => {
    useStorage(new FakeStorage());
    const { checkImport, importData } = await start();
    const anyExport = fc.record({ app: fc.constantFrom("gg-counter", "x"), schemaVersion: fc.constantFrom(1, 2), exportedAt: fc.string(), data: fc.anything() });
    fc.assert(
      fc.property(fc.oneof(fc.string(), anyExport.map((value) => JSON.stringify(value))), (text) => {
        expect(checkImport(text, NOW).ok).toBe(importData(text, NOW).ok);
      })
    );
  });
});

describe("clearData", () => {
  it("removes the new keys, the marker and the pre-forge keys — nothing else on the origin", async () => {
    const storage = useStorage(new FakeStorage({
      ...OTHER_APPS,
      [STATE_KEY]: JSON.stringify(V1_STATE),
      [THEME_KEY]: "dark",
      [NEW_STATE_KEY]: JSON.stringify(V1_STATE),
      [NEW_THEME_KEY]: "\"dark\"",
      [MIGRATED_KEY]: "{}",
      [LANG_KEY]: "\"bg\"",
      "gg-counter:v1:later": "1",
    }));
    const { clearData } = await start();
    expect(clearData()).toEqual({ ok: true });
    expect(storage.snapshot()).toEqual(OTHER_APPS);
  });

  it("also forgets values kept in memory after a refused write", async () => {
    const storage = useStorage(new FakeStorage());
    storage.writeBehaviour = () => "full";
    const { clearData, writeGame, readGame } = await start();
    writeGame(V1_STATE_READ, NOW);
    expect(clearData()).toEqual({ ok: true });
    expect(readGame(NOW).players).toEqual([]);
  });

  it("reports a refused removal", async () => {
    const storage = useStorage(new FakeStorage({ [NEW_STATE_KEY]: "{}" }));
    vi.spyOn(storage, "removeItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    const { clearData } = await start();
    expect(clearData()).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });
});
