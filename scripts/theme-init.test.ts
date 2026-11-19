import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { app } from "../app.config.ts";
import { LEGACY_KEYS, STORAGE_KEYS } from "../app/src/storage/keys.ts";
import { LEGACY_THEME_KEY, themeInitScript } from "./theme-init.ts";

const script = themeInitScript(app);

/** Runs theme-init.js against `stored` (null = storage blocked) and returns the classes it set on <html>. */
function run(stored: Record<string, string> | null, { systemDark = false } = {}): string[] {
  const classes: string[] = [];
  const localStorage = {
    getItem: (key: string) => {
      if (stored === null) throw new Error("SecurityError");
      return stored[key] ?? null;
    },
  };
  runInNewContext(script, {
    localStorage,
    window: { matchMedia: () => ({ matches: systemDark }) },
    document: { documentElement: { classList: { add: (name: string) => classes.push(name) } } },
  });
  return classes;
}

describe("themeInitScript", () => {
  it("uses the storage module's keys (app.id namespace, pre-forge fallback)", () => {
    expect(STORAGE_KEYS).toEqual({ state: `${app.id}:v1:state`, theme: `${app.id}:v1:theme`, migrated: `${app.id}:v1:migrated` });
    expect(LEGACY_THEME_KEY).toBe(LEGACY_KEYS.theme);
    expect(script).toContain(JSON.stringify(STORAGE_KEYS.theme));
    expect(script).toContain(JSON.stringify(STORAGE_KEYS.migrated));
  });

  it("the new key wins", () => {
    expect(run({ [STORAGE_KEYS.theme]: "\"dark\"", [LEGACY_KEYS.theme]: "light" })).toEqual(["dark"]);
    expect(run({ [STORAGE_KEYS.theme]: "\"light\"" }, { systemDark: true })).toEqual(["light"]);
  });

  it("falls back to the pre-forge key until the migration marker lists the theme", () => {
    expect(run({ [LEGACY_KEYS.theme]: "dark" })).toEqual(["dark"]);
    expect(run({ [LEGACY_KEYS.theme]: "dark", [STORAGE_KEYS.migrated]: "{\"items\":[\"state\"]}" })).toEqual(["dark"]);
    expect(run({ [LEGACY_KEYS.theme]: "dark", [STORAGE_KEYS.migrated]: "{\"items\":[\"state\",\"theme\"]}" })).toEqual(["light"]);
  });

  it("nothing saved, an unreadable value or blocked storage → the system theme", () => {
    expect(run({})).toEqual(["light"]);
    expect(run({}, { systemDark: true })).toEqual(["dark"]);
    expect(run({ [STORAGE_KEYS.theme]: "{broken" }, { systemDark: true })).toEqual(["dark"]);
    expect(run({ [LEGACY_KEYS.theme]: "blue" })).toEqual(["light"]);
    expect(run(null, { systemDark: true })).toEqual(["dark"]);
  });
});
