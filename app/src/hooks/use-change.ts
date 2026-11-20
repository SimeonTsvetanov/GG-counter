// Remembers how a value changed since the previous render, so CSS can animate the change once (SPEC 1.2 F20).
// Uses React's "store information from previous renders" pattern (state set during render, no effect): the
// first render reports no change, so nothing animates when the page loads.
import { useState } from "react";

/** Which way a number went: up, down, or not changed since the component appeared. */
export type Trend = "up" | "down" | null;

/** Returns the direction of the last change of `value`; it stays until the next change. */
export function useTrend(value: number): Trend {
  const [seen, setSeen] = useState<{ value: number; trend: Trend }>({ value, trend: null });
  if (seen.value === value) return seen.trend;
  const trend: Trend = value > seen.value ? "up" : "down";
  setSeen({ value, trend });
  return trend;
}

/** Returns `key` once it differs from the first one seen (a new item arrived), else null. */
export function useFreshKey(key: string | null): string | null {
  const [seen, setSeen] = useState<{ key: string | null; fresh: string | null }>({ key, fresh: null });
  if (seen.key === key) return seen.fresh;
  setSeen({ key, fresh: key });
  return key;
}
