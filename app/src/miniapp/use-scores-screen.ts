// Mounts the Scores screen (gg-counter-miniapp) on the page's <main> through the contract, like Quizzard
// mounts it in its outlet (PLAN GG-02). The mount lives as long as the <main>: React's StrictMode runs a
// layout effect twice in development, so a release waits until the commit is over and a re-run of the
// effect on the same element keeps the mount instead of unmounting a root during a commit.
import { useLayoutEffect, type RefObject } from "react";
import type { MiniAppContext, Unmount } from "gg-counter-miniapp/contract";
import { setStandaloneOptions, type StandaloneOptions } from "gg-counter-miniapp/host-api";
import { scoresModule } from "gg-counter-miniapp/module";

/** One mount of the screen on one element. */
interface ScreenMount {
  readonly element: HTMLElement;
  /** Null until an asynchronous mount settled. */
  unmount: Unmount | null;
  /** False from a release until the effect runs again on the same element. */
  isLive: boolean;
}

/** Mounts released in this commit, by element; the next layout effect on the element takes its mount back. */
const releasing = new Map<HTMLElement, ScreenMount>();

/** Returns the mount of `element`: the one being released, else a new one. */
function acquire(element: HTMLElement, context: MiniAppContext, options: StandaloneOptions): ScreenMount {
  const kept = releasing.get(element);
  if (kept !== undefined) {
    releasing.delete(element);
    kept.isLive = true;
    return kept;
  }
  setStandaloneOptions(element, options);
  const mount: ScreenMount = { element, unmount: null, isLive: true };
  const result = scoresModule.mount(element, context);
  if (typeof result === "function") {
    mount.unmount = result;
    return mount;
  }
  void result.then((unmount) => {
    if (mount.isLive) mount.unmount = unmount;
    else unmount();
  });
  return mount;
}

/** Unmounts `mount` after the current commit unless the effect takes it back first. */
function release(mount: ScreenMount): void {
  mount.isLive = false;
  releasing.set(mount.element, mount);
  queueMicrotask(() => {
    if (mount.isLive || releasing.get(mount.element) !== mount) return;
    releasing.delete(mount.element);
    mount.unmount?.();
  });
}

/**
 * Mounts the Scores screen on the element of `ref` for the lifetime of that element.
 * @param ref - the page's `<main>` (React renders it without children)
 * @param context - the standalone context; must keep its identity
 * @param options - the page's extras (host-api.ts); must keep their identity
 */
export function useScoresScreen(ref: RefObject<HTMLElement | null>, context: MiniAppContext, options: StandaloneOptions): void {
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const mount = acquire(element, context, options);
    return () => { release(mount); };
  }, [ref, context, options]);
}
