// Slides the items of a list to their new place when an item is added, removed or reordered (SPEC 1.2 F20;
// lib/flip.ts). Items carry `data-flip="<group>:<key>"`; positions are measured after every render and on
// resize, and the slide plays only when the keys changed, so a resize or a +1 never moves anything. Web
// Animations API (transform only, CSP-safe: no style attribute); `--duration-base` is 0 under reduced
// motion, which turns the slides off. The item that holds focus never moves (the user is typing in it).
import { useEffect, useLayoutEffect, useRef } from "react";
import { readToken, tokenMs } from "../lib/css-tokens";
import { flipOffsets, sameKeys, type Point } from "../lib/flip";

/** The keys in order and where each item was. */
interface Snapshot {
  readonly keys: readonly string[];
  readonly points: ReadonlyMap<string, Point>;
  readonly items: ReadonlyMap<string, HTMLElement>;
}

/** Returns `element`'s layout position relative to `root` (offsets ignore transforms). */
function layoutPoint(element: HTMLElement, root: HTMLElement): Point {
  let x = 0;
  let y = 0;
  let node: Element | null = element;
  while (node instanceof HTMLElement && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return { x, y };
}

/** Measures every item of `group` inside `root`. */
function measure(root: HTMLElement, group: string): Snapshot {
  const prefix = `${group}:`;
  const items = new Map<string, HTMLElement>();
  for (const element of root.querySelectorAll<HTMLElement>(`[data-flip^="${prefix}"]`)) {
    items.set(element.dataset.flip ?? "", element);
  }
  const points = new Map([...items].map(([key, element]) => [key, layoutPoint(element, root)] as const));
  return { keys: [...items.keys()], points, items };
}

/** Plays the slide of every moved item from its old place. */
function play(offsets: ReadonlyMap<string, Point>, items: ReadonlyMap<string, HTMLElement>): void {
  const duration = tokenMs("--duration-base");
  if (duration === 0 || offsets.size === 0) return;
  const easing = readToken("--ease-ios").trim() || "ease-out";
  for (const [key, { x, y }] of offsets) {
    const element = items.get(key);
    if (element === undefined || element.contains(document.activeElement)) continue;
    element.animate([{ transform: `translate(${String(x)}px, ${String(y)}px)` }, { transform: "none" }], { duration, easing });
  }
}

/**
 * Slides the `group` items inside `rootRef` (a positioned element, so offsets are measured against it).
 *
 * @param group - the prefix of the items' `data-flip` values, e.g. "rank" for `data-flip="rank:<id>"`.
 */
export function useFlip(rootRef: React.RefObject<HTMLElement | null>, group: string): void {
  const last = useRef<Snapshot | null>(null);

  // Every render: the DOM is final here and not painted yet, so the slide starts without a flash.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      last.current = null;
      return;
    }
    const before = last.current;
    const now = measure(root, group);
    last.current = now;
    if (before !== null && !sameKeys(before.keys, now.keys)) play(flipOffsets(before.points, now.points), now.items);
  });

  // A resize or a font load moves items without a render: measure again, never animate.
  useEffect(() => {
    const root = rootRef.current;
    if (root === null || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => { last.current = measure(root, group); });
    observer.observe(root);
    return () => { observer.disconnect(); };
  }, [rootRef, group]);
}
