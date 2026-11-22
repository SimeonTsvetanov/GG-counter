// The UI language choice under gg-counter:v1:lang (PLAN T-09): saved as JSON, unknown values ignored.
import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeStorage, blockStorage, unblockStorage, useStorage } from "gg-counter-miniapp/test/fake-storage";

const LANG_KEY = "gg-counter:v1:lang";

/** Loads a fresh copy of the module (the memory fallback of local-store is per module instance). */
async function start() {
  vi.resetModules();
  return import("../../src/storage/lang.ts");
}

afterEach(unblockStorage);

describe("language choice", () => {
  it("no choice on a first visit; English and Bulgarian read back as saved", async () => {
    const storage = useStorage(new FakeStorage());
    const { readLanguage, writeLanguage } = await start();
    expect(readLanguage()).toBeNull();
    expect(writeLanguage("bg")).toEqual({ ok: true });
    expect(readLanguage()).toBe("bg");
    expect(writeLanguage("en")).toEqual({ ok: true });
    expect(readLanguage()).toBe("en");
    expect(storage.snapshot()).toEqual({ [LANG_KEY]: "\"en\"" });
  });

  it("an unreadable or unknown value counts as no choice", async () => {
    for (const raw of ["bg", "\"de\"", "{", "null", "[\"bg\"]"]) {
      useStorage(new FakeStorage({ [LANG_KEY]: raw }));
      const { readLanguage } = await start();
      expect(readLanguage(), raw).toBeNull();
    }
  });

  it("blocked storage: the choice lasts in memory for this page", async () => {
    blockStorage();
    const { readLanguage, writeLanguage } = await start();
    expect(writeLanguage("bg")).toMatchObject({ ok: false, error: { code: "STORAGE_UNAVAILABLE" } });
    expect(readLanguage()).toBe("bg");
  });

  it("property: isLanguage accepts exactly the languages of app.config.ts", async () => {
    const { isLanguage } = await start();
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(isLanguage(value)).toBe(value === "en" || value === "bg");
      }),
    );
  });
});
