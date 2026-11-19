import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { app } from "../app.config.ts";
import { swHandoverScript } from "./sw-handover.ts";

type InstallListener = (event: { waitUntil: (promise: Promise<unknown>) => void }) => void;

/** Runs sw-handover.js in a fake service worker whose caches hold `cached` (cache name → URLs). */
async function install(cached: Record<string, readonly string[]>, { failing = false } = {}): Promise<{ skipped: boolean }> {
  const listeners: InstallListener[] = [];
  const skipWaiting = vi.fn(() => Promise.resolve());
  const caches = {
    keys: () => (failing ? Promise.reject(new Error("blocked")) : Promise.resolve(Object.keys(cached))),
    open: (name: string) => Promise.resolve({ keys: () => Promise.resolve((cached[name] ?? []).map((url) => ({ url }))) }),
  };
  const self = { addEventListener: (type: string, listener: InstallListener) => { if (type === "install") listeners.push(listener); }, skipWaiting };
  runInNewContext(swHandoverScript(app), { self, caches, URL, Promise });
  const pending: Promise<unknown>[] = [];
  for (const listener of listeners) listener({ waitUntil: (promise) => { pending.push(promise); } });
  await Promise.all(pending);
  return { skipped: skipWaiting.mock.calls.length > 0 };
}

const ORIGIN = "https://simeontsvetanov.github.io";
const PRECACHE = `gg-counter-precache-v2-${ORIGIN}${app.basePath}`;

describe("swHandoverScript", () => {
  it("the pre-T-08 auto-update worker's precache (it has registerSW.js) → the new worker takes over at once", async () => {
    const old = [`${ORIGIN}${app.basePath}index.html?__WB_REVISION__=1`, `${ORIGIN}${app.basePath}registerSW.js?__WB_REVISION__=2`];
    expect(await install({ [PRECACHE]: old })).toEqual({ skipped: true });
  });

  it("a worker of this version or later (no registerSW.js) → waits for the user's Reload", async () => {
    expect(await install({ [PRECACHE]: [`${ORIGIN}${app.basePath}index.html?__WB_REVISION__=1`] })).toEqual({ skipped: false });
  });

  it("a first install (no caches) waits as usual", async () => {
    expect(await install({})).toEqual({ skipped: false });
  });

  it("another app's precache on the shared origin never counts", async () => {
    expect(await install({ [`teamsync-precache-v2-${ORIGIN}/teamsync/`]: [`${ORIGIN}/teamsync/registerSW.js`], other: [`${ORIGIN}${app.basePath}registerSW.js`] })).toEqual({ skipped: false });
  });

  it("a cache error is swallowed: the worker waits as usual", async () => {
    expect(await install({}, { failing: true })).toEqual({ skipped: false });
  });
});
