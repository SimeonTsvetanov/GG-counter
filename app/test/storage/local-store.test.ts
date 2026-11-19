import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeStorage, blockStorage, unblockStorage, useStorage } from "./fake-storage.ts";

/** Loads a fresh copy of the module (its in-memory fallback starts empty). */
async function loadStore() {
  vi.resetModules();
  return import("../../src/storage/local-store.ts");
}

afterEach(unblockStorage);

describe("local-store with a working storage", () => {
  it("writes, reads back, lists and removes a value", async () => {
    const storage = useStorage(new FakeStorage({ other: "x" }));
    const store = await loadStore();
    expect(store.writeRaw("k", "v")).toEqual({ ok: true });
    expect(store.readRaw("k")).toBe("v");
    expect(store.listKeys().sort()).toEqual(["k", "other"]);
    expect(store.removeRaw("k")).toEqual({ ok: true });
    expect(store.readRaw("k")).toBeNull();
    expect(storage.snapshot()).toEqual({ other: "x" });
  });

  it("a full storage gives STORAGE_FULL and keeps the value in memory for this session", async () => {
    const storage = useStorage(new FakeStorage());
    storage.writeBehaviour = () => "full";
    const store = await loadStore();
    const result = store.writeRaw("k", "v");
    expect(result).toMatchObject({ ok: false, error: { code: "STORAGE_FULL" } });
    expect(result.ok ? "" : result.error.message).toMatch(/full/);
    expect(storage.snapshot()).toEqual({});
    expect(store.readRaw("k")).toBe("v");
    expect(store.listKeys()).toEqual(["k"]);
  });

  it("a refused write gives STORAGE_UNAVAILABLE; a later successful write ends the memory copy", async () => {
    const storage = useStorage(new FakeStorage());
    storage.writeBehaviour = () => "denied";
    const store = await loadStore();
    expect(store.writeRaw("k", "v1")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    storage.writeBehaviour = () => "ok";
    expect(store.writeRaw("k", "v2")).toEqual({ ok: true });
    storage.items.set("k", "changed elsewhere");
    expect(store.readRaw("k")).toBe("changed elsewhere");
  });

  it("a value that does not read back equal is not kept in storage and is not reported as saved", async () => {
    const storage = useStorage(new FakeStorage());
    storage.writeBehaviour = () => "corrupt";
    const store = await loadStore();
    expect(store.writeRaw("k", "value")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(storage.snapshot()).toEqual({});
    expect(store.readRaw("k")).toBe("value");
  });

  it("errors from getItem, key and removeItem never escape", async () => {
    const storage = useStorage(new FakeStorage({ k: "v" }));
    const denied = () => {
      throw new DOMException("denied", "SecurityError");
    };
    vi.spyOn(storage, "getItem").mockImplementation(denied);
    vi.spyOn(storage, "key").mockImplementation(denied);
    vi.spyOn(storage, "removeItem").mockImplementation(denied);
    const store = await loadStore();
    expect(store.readRaw("k")).toBeNull();
    expect(store.listKeys()).toEqual([]);
    expect(store.removeRaw("k")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
  });
});

describe("local-store without storage", () => {
  for (const [label, setUp] of [
    ["blocked (reading localStorage throws)", blockStorage],
    ["missing (no localStorage global)", () => vi.stubGlobal("localStorage", undefined)],
  ] as const) {
    it(`${label}: works in memory and says persistence is off`, async () => {
      setUp();
      const store = await loadStore();
      expect(store.readRaw("k")).toBeNull();
      expect(store.writeRaw("k", "v")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
      expect(store.readRaw("k")).toBe("v");
      expect(store.listKeys()).toEqual(["k"]);
      expect(store.removeRaw("k")).toEqual({ ok: true });
      expect(store.readRaw("k")).toBeNull();
    });
  }
});
