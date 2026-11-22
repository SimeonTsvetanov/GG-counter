// The app a shared leaderboard names: its title line and its last line ("— Made with <name> · <url>").
// Standalone: GG Counter and its own address. A host (Quizzard) names itself through two launch
// parameters it sets itself — never from an address someone could link (the same keys as TeamSync).
import { STANDALONE_NAME, STANDALONE_URL } from "../meta";

/** `context.query` keys a host sets to name itself in shared text; both or neither. */
export const ATTRIBUTION_NAME_PARAM = "attribution-name";
/** See {@link ATTRIBUTION_NAME_PARAM}. */
export const ATTRIBUTION_URL_PARAM = "attribution-url";

/** The app a shared text names. */
export interface Attribution {
  readonly name: string;
  readonly url: string;
}

const STANDALONE: Attribution = { name: STANDALONE_NAME, url: STANDALONE_URL };
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'’&+!-]{0,38}[\p{L}\p{M}\p{N}]$/u;
const MAX_URL_LENGTH = 200;

let current: Attribution = STANDALONE;

/**
 * Returns a valid attribution from a host's launch parameters, or null.
 * @param query - the host's launch parameters (`context.query`)
 * @returns the name (short plain text) and an https address without credentials, else null
 */
export function parseAttribution(query: URLSearchParams): Attribution | null {
  const name = query.get(ATTRIBUTION_NAME_PARAM)?.trim() ?? "";
  const address = query.get(ATTRIBUTION_URL_PARAM)?.trim() ?? "";
  if (!NAME_PATTERN.test(name) || address.length > MAX_URL_LENGTH || /[\s@]/u.test(address)) return null;
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    // because anything that is not an address means "no host attribution"
    return null;
  }
  if (url.protocol !== "https:" || !url.hostname.includes(".")) return null;
  return { name, url: url.href };
}

/** Sets the app shared text names for this mount; null restores GG Counter. */
export function setAttribution(next: Attribution | null): void {
  current = next ?? STANDALONE;
}

/** Returns the app shared text names now. */
export function getAttribution(): Attribution {
  return current;
}
