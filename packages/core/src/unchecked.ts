// The type guard for values read from storage or a file (saved-state.ts, saved-history.ts): a plain
// object whose fields are still unchecked.

/** The fields read from a saved game, player or history entry; their types are still unchecked. */
export interface UncheckedFields {
  readonly players?: unknown;
  readonly lastUpdated?: unknown;
  readonly id?: unknown;
  readonly name?: unknown;
  readonly score?: unknown;
  readonly createdAt?: unknown;
  readonly history?: unknown;
  readonly delta?: unknown;
  readonly at?: unknown;
}

/** True for a plain object (not null, not an array); its fields are still unchecked. */
export function isObject(value: unknown): value is UncheckedFields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
