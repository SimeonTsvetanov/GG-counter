import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeStorage, blockStorage, unblockStorage, useStorage } from "./fake-storage.ts";

/** Loads fresh copies of the modules (the memory fallback of local-store is per module instance). */
async function start() {
  vi.resetModules();
  const [prefs, session, data] = await Promise.all([
    import("../../src/storage/prefs.ts"),
    import("../../src/storage/session.ts"),
    import("../../src/storage/index.ts"),
  ]);
  return { ...prefs, ...session, ...data };
}

afterEach(() => {
  unblockStorage();
  Reflect.deleteProperty(globalThis, "sessionStorage");
});

describe("last seen version (What's new)", () => {
  it("a first visit has none; a saved one reads back; it lives in the app's namespace", async () => {
    const storage = useStorage(new FakeStorage());
    const { readLastSeenVersion, writeLastSeenVersion, LAST_SEEN_VERSION_KEY } = await start();
    expect(readLastSeenVersion()).toBeNull();
    expect(writeLastSeenVersion("1.2.0")).toEqual({ ok: true });
    expect(readLastSeenVersion()).toBe("1.2.0");
    expect(LAST_SEEN_VERSION_KEY).toBe("gg-counter:v1:last-seen-version");
    expect(storage.snapshot()).toEqual({ [LAST_SEEN_VERSION_KEY]: "\"1.2.0\"" });
  });

  it("an unreadable or non-string value counts as none", async () => {
    useStorage(new FakeStorage({ "gg-counter:v1:last-seen-version": "{broken" }));
    const first = await start();
    expect(first.readLastSeenVersion()).toBeNull();
    useStorage(new FakeStorage({ "gg-counter:v1:last-seen-version": "42" }));
    const second = await start();
    expect(second.readLastSeenVersion()).toBeNull();
  });

  it("Clear my data removes it", async () => {
    const storage = useStorage(new FakeStorage());
    const { writeLastSeenVersion, clearData } = await start();
    writeLastSeenVersion("0.1.0");
    clearData();
    expect(storage.snapshot()).toEqual({});
  });

  it("blocked storage: kept for this session only", async () => {
    blockStorage();
    const { readLastSeenVersion, writeLastSeenVersion } = await start();
    expect(writeLastSeenVersion("0.1.0")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(readLastSeenVersion()).toBe("0.1.0");
  });
});

describe("preload-reload guard (sessionStorage)", () => {
  it("nothing recorded → null; a recorded time reads back", async () => {
    vi.stubGlobal("sessionStorage", new FakeStorage());
    const { readPreloadReloadAt, writePreloadReloadAt } = await start();
    expect(readPreloadReloadAt()).toBeNull();
    expect(writePreloadReloadAt(1_700_000_000_000)).toBe(true);
    expect(readPreloadReloadAt()).toBe(1_700_000_000_000);
  });

  it("a garbage value reads as null", async () => {
    vi.stubGlobal("sessionStorage", new FakeStorage({ "gg-counter:v1:preload-reload": "soon" }));
    const { readPreloadReloadAt } = await start();
    expect(readPreloadReloadAt()).toBeNull();
  });

  it("no sessionStorage, a refused write or a blocked one → not saved, never throws", async () => {
    const { readPreloadReloadAt, writePreloadReloadAt } = await start();
    expect(readPreloadReloadAt()).toBeNull();
    expect(writePreloadReloadAt(1)).toBe(false);

    const full = new FakeStorage();
    full.writeBehaviour = () => "full";
    vi.stubGlobal("sessionStorage", full);
    expect(writePreloadReloadAt(1)).toBe(false);

    const corrupt = new FakeStorage();
    corrupt.writeBehaviour = () => "corrupt";
    vi.stubGlobal("sessionStorage", corrupt);
    expect(writePreloadReloadAt(12)).toBe(false);

    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get: () => {
        throw new DOMException("Access is denied for this document.", "SecurityError");
      },
    });
    expect(readPreloadReloadAt()).toBeNull();
    expect(writePreloadReloadAt(1)).toBe(false);
  });

  it("a getItem that throws reads as null", async () => {
    const storage = new FakeStorage();
    storage.getItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    vi.stubGlobal("sessionStorage", storage);
    const { readPreloadReloadAt } = await start();
    expect(readPreloadReloadAt()).toBeNull();
  });
});
