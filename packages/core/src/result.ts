// Typed result shared by every core function: expected (user/input) problems come back with a
// stable code the app can translate, never as a thrown error (engineering → code-quality §6).

/** Either a value or an error with a stable `code` and an English `message`. */
export type Result<T, C extends string> = { readonly ok: true; readonly value: T } | Failure<C>;

/** Returns a successful {@link Result} holding `value`. */
export function ok<T>(value: T): { readonly ok: true; readonly value: T } {
  return { ok: true, value };
}

/** The failed side of a {@link Result}: a stable `code` and an English `message`. */
export interface Failure<C extends string> {
  readonly ok: false;
  readonly error: { readonly code: C; readonly message: string };
}

/** Returns a failed {@link Result} with a stable `code` and an English `message`. */
export function fail<C extends string>(code: C, message: string): Failure<C> {
  return { ok: false, error: { code, message } };
}
