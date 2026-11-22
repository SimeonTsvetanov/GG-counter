// Keeps a removed item on screen for its exit animation (SPEC 1.2 F20): the game state drops it at once (saved,
// counted, ranked), while the list still shows it — inert and hidden from assistive tech — in its old slot for
// the length of the fade, so nothing jumps under the finger; then it goes and the others slide (use-flip.ts).
import { useEffect, useRef, useState } from "react";
import { tokenMs } from "../lib/css-tokens";

/** An item on its way out and the index it had. */
export interface Leaving<T> {
  readonly item: T;
  readonly index: number;
}

/** Returns how long the exit lasts: the fade token under reduced motion (a fade is still a cue), else the base one. */
function exitDuration(): number {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? tokenMs("--duration-fade") : tokenMs("--duration-base");
}

/** Returns the items leaving now and the function that sends one out. */
export function useLeaving<T>(): { leaving: readonly Leaving<T>[]; leave: (item: T, index: number) => void } {
  const [leaving, setLeaving] = useState<readonly Leaving<T>[]>([]);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
    };
  }, []);

  const leave = (item: T, index: number): void => {
    const duration = exitDuration();
    if (duration === 0) return;
    const entry: Leaving<T> = { item, index };
    setLeaving((current) => [...current, entry]);
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setLeaving((current) => current.filter((other) => other !== entry));
    }, duration);
    timers.current.add(timer);
  };

  return { leaving, leave };
}
