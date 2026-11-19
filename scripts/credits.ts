// Credits for the About dialog (app-shell §9): the open-source packages shipped in the app, with
// licence and home page, read from app/package.json and each package's own package.json at build time.
import { readFileSync } from "node:fs";

/** Licences allowed in shipped code (app-shell rule 11). */
export const ALLOWED_LICENSES = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "Unlicense", "CC0-1.0", "OFL-1.1"] as const;

/** Packages shipped in the bundle that are dev dependencies (the service worker's page helper). */
const SHIPPED_DEV_DEPENDENCIES = ["workbox-window"] as const;

/** One credited package. */
export interface Credit {
  readonly name: string;
  readonly license: string;
  /** https home page or repository. */
  readonly url: string;
}

interface PackageJson {
  readonly license?: string;
  readonly homepage?: string;
  readonly repository?: string | { readonly url?: string };
  readonly dependencies?: Readonly<Record<string, string>>;
}

/** Reads and parses a package.json (trusted build input). */
function readPackage(url: URL): PackageJson {
  // because package.json files of installed packages are trusted build input with this shape
  return JSON.parse(readFileSync(url, "utf8")) as PackageJson;
}

/** Returns an https URL for a package: its home page, else its repository (GitHub shorthand allowed). */
function homeUrl(name: string, pkg: PackageJson): string {
  if (pkg.homepage?.startsWith("https://")) return pkg.homepage;
  const repository = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  if (repository === undefined) return `https://www.npmjs.com/package/${name}`;
  const url = repository.replace(/^git\+/, "").replace(/\.git$/, "");
  return url.startsWith("https://") ? url : `https://github.com/${url}`;
}

/**
 * Returns the credits for the app in `appDir` (a URL ending in `/`), sorted by name.
 *
 * @throws {@link Error} when a shipped package has a licence outside {@link ALLOWED_LICENSES}.
 */
export function appCredits(appDir: URL): Credit[] {
  const dependencies = Object.entries(readPackage(new URL("package.json", appDir)).dependencies ?? {})
    .filter(([, range]) => !range.startsWith("workspace:"))
    .map(([name]) => name);
  return [...dependencies, ...SHIPPED_DEV_DEPENDENCIES].sort().map((name) => {
    const pkg = readPackage(new URL(`node_modules/${name}/package.json`, appDir));
    const license = pkg.license ?? "UNKNOWN";
    if (!(ALLOWED_LICENSES as readonly string[]).includes(license)) throw new Error(`${name}: licence ${license} is not allowed (app-shell rule 11)`);
    return { name, license, url: homeUrl(name, pkg) };
  });
}
