// An in-memory stand-in for the browser's localStorage, shared by the storage module tests. It can
// refuse writes the way browsers do (full quota, blocked storage) or keep a different value.
import { vi } from "vitest";

/** How a write to one key behaves: stored, refused (full / blocked) or stored differently. */
export type WriteBehaviour = "ok" | "full" | "denied" | "corrupt";

/** A Map-backed localStorage with the Storage API the app uses. */
export class FakeStorage {
  readonly items: Map<string, string>;
  /** Decides per key how `setItem` behaves; everything is stored by default. */
  writeBehaviour: (key: string) => WriteBehaviour = () => "ok";

  constructor(initial: Record<string, string> = {}) {
    this.items = new Map(Object.entries(initial));
  }

  get length(): number {
    return this.items.size;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    const behaviour = this.writeBehaviour(key);
    if (behaviour === "full") throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    if (behaviour === "denied") throw new DOMException("The operation is insecure.", "SecurityError");
    this.items.set(key, behaviour === "corrupt" ? value.slice(1) : value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  clear(): void {
    this.items.clear();
  }

  /** Returns every stored key and value. */
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.items);
  }
}

/** Installs `storage` as the global localStorage for the current test (undone by `unstubGlobals`). */
export function useStorage(storage: FakeStorage): FakeStorage {
  vi.stubGlobal("localStorage", storage);
  return storage;
}

/** Makes reading the global localStorage throw, as when the browser has storage turned off. */
export function blockStorage(): void {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => {
      throw new DOMException("Access is denied for this document.", "SecurityError");
    },
  });
}

/** Removes the global set by {@link blockStorage}; call in `afterEach`. */
export function unblockStorage(): void {
  Reflect.deleteProperty(globalThis, "localStorage");
}

/** Keys of another forge app and an unrelated key on the same origin: never read or changed by GG Counter. */
export const OTHER_APPS: Readonly<Record<string, string>> = {
  "teamsync-random-team-generator:v1:theme": "\"dark\"",
  "teamsync-random-team-generator:v1:state": "{\"teams\":[[\"Ana\"]]}",
  "gg-counter-pro:v1:state": "{\"players\":[]}",
  theme: "dark",
};
