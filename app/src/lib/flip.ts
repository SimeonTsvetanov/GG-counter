/**
 * FLIP ("first, last, invert, play") for lists whose items move when another one is added, removed or
 * reordered (SPEC 1.2 F20): each item's layout position is remembered; after a change, an item that moved
 * starts at its old place (a transform) and slides to the new one. Positions are layout positions (offsets,
 * which ignore transforms), so a running animation never pollutes the next measurement.
 */

/** A position in CSS pixels relative to the list's root. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Items that move less than this are left alone (sub-pixel rounding). */
const MIN_MOVE = 1;

/**
 * Returns, for every key present before and after, how far its item moved back (old − new), leaving out
 * items that did not move. New and removed keys are not in the result.
 */
export function flipOffsets(before: ReadonlyMap<string, Point>, after: ReadonlyMap<string, Point>): Map<string, Point> {
  const offsets = new Map<string, Point>();
  for (const [key, now] of after) {
    const then = before.get(key);
    if (then === undefined) continue;
    const x = then.x - now.x;
    const y = then.y - now.y;
    if (Math.abs(x) >= MIN_MOVE || Math.abs(y) >= MIN_MOVE) offsets.set(key, { x, y });
  }
  return offsets;
}

/** Returns true when both lists hold the same keys in the same order. */
export function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/** Returns `items` with each leaving item put back at the index it had (clamped to the end), in index order. */
export function withLeaving<T>(items: readonly T[], leaving: readonly { readonly item: T; readonly index: number }[]): T[] {
  const result = [...items];
  for (const { item, index } of [...leaving].sort((a, b) => a.index - b.index)) {
    result.splice(Math.min(index, result.length), 0, item);
  }
  return result;
}
