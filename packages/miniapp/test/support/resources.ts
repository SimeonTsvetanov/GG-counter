// Counts what a mounted screen holds on to in a jsdom test: event listeners on the window, the document,
// the visual viewport and nodes still in the page, intersection/resize observers that were never
// disconnected, timers and animation frames still pending. mount.test.ts compares two snapshots.
import { vi } from "vitest";

/** One listener added through EventTarget.addEventListener and not removed yet. */
interface ListenerEntry {
  readonly target: EventTarget;
  readonly type: string;
  readonly listener: unknown;
  readonly capture: boolean;
}

/** What is held at one moment (see {@link ResourceTracker.snapshot}). */
export interface ResourceSnapshot {
  readonly listeners: ReadonlySet<ListenerEntry>;
}

/** What was added after a snapshot and is still held. */
export interface Leaks {
  readonly listeners: readonly string[];
  readonly observers: number;
  readonly timers: number;
  readonly frames: number;
}

/** The tracker {@link trackResources} installs. */
export interface ResourceTracker {
  readonly snapshot: () => ResourceSnapshot;
  readonly leaks: (before: ResourceSnapshot) => Leaks;
  /** Restores the listener spies (globals are unstubbed by Vitest after each test). */
  readonly restore: () => void;
}

function captureOf(options: unknown): boolean {
  return typeof options === "boolean" ? options : typeof options === "object" && options !== null && Reflect.get(options, "capture") === true;
}

/** Names a listener's target for the report. */
function targetName(target: EventTarget): string {
  if (target === window) return "window";
  if (target === document) return "document";
  if (target instanceof Element) return target.tagName.toLowerCase();
  return "viewport";
}

/** True for a target whose listeners outlive an unmount: not a node that left the page. */
function isLive(target: EventTarget): boolean {
  return !(target instanceof Node) || target === document || target.isConnected;
}

/** The real listener methods, taken once before any spy replaces them. */
const realAdd = Reflect.get(EventTarget.prototype, "addEventListener");
const realRemove = Reflect.get(EventTarget.prototype, "removeEventListener");

/** Stubs observers, timers, frames and a visual viewport, and records every listener from now on. */
export function trackResources(): ResourceTracker {
  const active = new Set<ListenerEntry>();
  // Spies call the real methods (and are restored by Vitest's restoreMocks); `this` is the target.
  vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(function (this: EventTarget, type, listener, options) {
    active.add({ target: this, type, listener, capture: captureOf(options) });
    realAdd.call(this, type, listener, options);
  });
  vi.spyOn(EventTarget.prototype, "removeEventListener").mockImplementation(function (this: EventTarget, type, listener, options) {
    for (const entry of active) {
      if (entry.target === this && entry.type === type && entry.listener === listener && entry.capture === captureOf(options)) active.delete(entry);
    }
    realRemove.call(this, type, listener, options);
  });

  let observers = 0;
  const observer = class {
    private isObserving = false;
    observe(): void { if (!this.isObserving) observers += 1; this.isObserving = true; }
    unobserve(): void { /* the screen disconnects */ }
    disconnect(): void { if (this.isObserving) observers -= 1; this.isObserving = false; }
    takeRecords(): [] { return []; }
  };
  vi.stubGlobal("IntersectionObserver", observer);
  vi.stubGlobal("ResizeObserver", observer);

  const timers = new Set<number>();
  const realSetTimeout = window.setTimeout.bind(window);
  const realClearTimeout = window.clearTimeout.bind(window);
  vi.stubGlobal("setTimeout", (callback: () => void, delay?: number) => {
    const id = realSetTimeout(() => { timers.delete(id); callback(); }, delay);
    timers.add(id);
    return id;
  });
  vi.stubGlobal("clearTimeout", (id: number) => { timers.delete(id); realClearTimeout(id); });

  const frames = new Set<number>();
  let nextFrame = 0;
  vi.stubGlobal("requestAnimationFrame", () => { nextFrame += 1; frames.add(nextFrame); return nextFrame; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { frames.delete(id); });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }));
  vi.stubGlobal("visualViewport", Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 }));

  return {
    snapshot: () => ({ listeners: new Set(active) }),
    leaks: (before) => ({
      listeners: [...active].filter((entry) => !before.listeners.has(entry) && isLive(entry.target)).map((entry) => `${targetName(entry.target)}:${entry.type}`),
      observers,
      timers: timers.size,
      frames: frames.size,
    }),
    restore: () => { vi.restoreAllMocks(); },
  };
}
