// @vitest-environment jsdom
// Unit tests of `mount` (src/mount.tsx, PLAN GG-02) as Quizzard calls it: mount → unmount → mount; unmount
// leaves no node, listener, observer, timer or theme class behind; the screen's language follows the
// context (Bulgarian before the first frame, then each switch); its overlays render inside the mount
// element; the storage migration runs before the first render and only once.
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MIGRATED_KEY, NEW_STATE_KEY, STATE_KEY, V1_STATE } from "gg-counter-core/test-fixtures";
import type { Lang, MiniAppContext, Unmount } from "../src/contract.ts";
import scoresModule from "../src/index.ts";
import { OVERLAYS_ATTRIBUTE } from "../src/placement.ts";
import { FakeStorage, useStorage } from "./storage/fake-storage.ts";
import { trackResources, type ResourceTracker } from "./support/resources.ts";

// because React's act() needs this flag in a test environment (react.dev/reference/react/act)
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

/** A contract signal the test sets; `listeners` shows who still listens. */
interface TestSignal<T> {
  get(): T;
  subscribe(listener: (value: T) => void): () => void;
  set(value: T): void;
  readonly listeners: Set<(value: T) => void>;
}

/** Returns a {@link TestSignal} starting at `initial`. */
function signal<T>(initial: T): TestSignal<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  return {
    get: () => value,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    set: (next) => {
      value = next;
      for (const listener of listeners) listener(next);
    },
    listeners,
  };
}

/** Quizzard's context with spies, a header slot in the page and controllable signals. */
function quizzardContext(lang: Lang = "en") {
  const language = signal<Lang>(lang);
  const theme = signal<"light" | "dark">("dark");
  const headerActions = document.createElement("div");
  document.body.append(headerActions);
  const context: MiniAppContext = {
    host: "quizzard",
    language,
    theme,
    query: new URLSearchParams(),
    shell: { toast: vi.fn(), confirm: vi.fn(() => Promise.resolve(true)), share: vi.fn(() => Promise.resolve("shared" as const)), setTitle: vi.fn(), setBusy: vi.fn() },
    navigation: { home: vi.fn(), open: vi.fn() },
    slots: { headerActions },
    storage: { area: { prefix: "gg-counter:v1:" }, prefs: { get: (_key, fallback) => fallback, set: () => true, remove: () => undefined }, notifySaved: vi.fn() },
  };
  return { context, language, theme, headerActions };
}

/** Mounts the screen on `element` inside act(), so its first render and effects have run. */
async function mount(element: HTMLElement, context: MiniAppContext): Promise<Unmount> {
  let unmount: Unmount = () => undefined;
  await act(async () => { unmount = await scoresModule.mount(element, context); });
  return unmount;
}

/** The Add player card's title: the screen's language as the user sees it. */
function addTitle(element: HTMLElement): string | null | undefined {
  return element.querySelector(".card-title")?.textContent;
}

let storage: FakeStorage;
let resources: ResourceTracker;
let element: HTMLElement;

beforeEach(() => {
  storage = useStorage(new FakeStorage());
  resources = trackResources();
  element = document.createElement("div");
  element.dataset.miniapp = "scores";
  document.body.append(element);
});

afterEach(() => {
  resources.restore();
  document.body.replaceChildren();
});

describe("mount (Quizzard host)", () => {
  it("mount → unmount → mount: renders the screen inside the element each time and leaves nothing behind", async () => {
    const { context, headerActions } = quizzardContext();
    // A first cycle installs React's one-time document listeners; the second one is measured.
    (await mount(element, context))();
    const before = resources.snapshot();
    const unmount = await mount(element, context);
    expect(element.querySelector(".app-main")).not.toBeNull();
    expect(addTitle(element)).toBe("Add Player");
    expect(headerActions.querySelector("[data-action='clear-session']")).not.toBeNull();
    expect(element.classList.contains("dark")).toBe(true);
    act(() => { unmount(); });
    expect(element.childNodes).toHaveLength(0);
    expect(headerActions.childNodes).toHaveLength(0);
    expect(element.classList.contains("dark")).toBe(false);
    expect(resources.leaks(before)).toEqual({ listeners: [], observers: 0, timers: 0, frames: 0 });
    expect(context.language.get()).toBe("en");
  });

  it("unmount with an alert open and a reveal frame pending leaves no node, listener, observer or timer", async () => {
    const { context, headerActions } = quizzardContext();
    (await mount(element, context))();
    const before = resources.snapshot();
    const unmount = await mount(element, context);
    act(() => { element.querySelector<HTMLInputElement>("input")?.focus(); });
    expect(resources.leaks(before).frames).toBe(1);
    act(() => { headerActions.querySelector<HTMLElement>("[data-action='clear-session']")?.click(); });
    const overlays = element.querySelector(`[${OVERLAYS_ATTRIBUTE}]`);
    expect(overlays?.querySelector("[role='alertdialog']")).not.toBeNull();
    expect(document.body.querySelector(":scope > [role='alertdialog']")).toBeNull();
    act(() => { unmount(); });
    // Radix returns focus in a zero-delay timer of its own after an open dialog unmounts; let it run.
    await act(async () => { await new Promise((resolve) => { setTimeout(resolve, 20); }); });
    expect(element.childNodes).toHaveLength(0);
    expect(document.querySelector("[role='alertdialog']")).toBeNull();
    expect(resources.leaks(before)).toEqual({ listeners: [], observers: 0, timers: 0, frames: 0 });
  });

  it("renders the first frame in Bulgarian, then follows each language switch of the context", async () => {
    const { context, language } = quizzardContext("bg");
    let unmount: Unmount = () => undefined;
    await act(async () => {
      const result = scoresModule.mount(element, context);
      // Bulgarian is not loaded yet: nothing is rendered until it is, so no English frame shows.
      expect(element.textContent).toBe("");
      unmount = await result;
    });
    expect(addTitle(element)).toBe("Добави играч");
    expect(element.lang).toBe("bg");
    act(() => { language.set("en"); });
    expect(addTitle(element)).toBe("Add Player");
    expect(element.lang).toBe("en");
    // Bulgarian is loaded now, so the switch is synchronous (the standalone page relies on it).
    act(() => { language.set("bg"); });
    expect(addTitle(element)).toBe("Добави играч");
    act(() => { unmount(); });
    expect(language.listeners.size).toBe(0);
  });

  it("runs the storage migration before the first render, and only once", async () => {
    storage.setItem(STATE_KEY, JSON.stringify(V1_STATE));
    const { context } = quizzardContext();
    const unmount = await mount(element, context);
    expect(element.textContent).toContain("Ana");
    const marker = storage.getItem(MIGRATED_KEY);
    expect(marker).not.toBeNull();
    expect(JSON.parse(storage.getItem(NEW_STATE_KEY) ?? "null")).toMatchObject({ players: [{ name: "Ana" }, { name: "Boris" }, { name: "Чен" }] });
    act(() => { unmount(); });
    const again = await mount(element, context);
    expect(storage.getItem(MIGRATED_KEY)).toBe(marker);
    expect(storage.getItem(STATE_KEY)).toBe(JSON.stringify(V1_STATE));
    act(() => { again(); });
  });
});
