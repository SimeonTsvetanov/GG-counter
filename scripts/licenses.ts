/**
 * Licence texts (app-shell → legal-pages §5): MIT, Apache-2.0 §4 and OFL need the full licence (+ NOTICE)
 * with every copy, so generate.ts writes app/public/third-party-licenses.txt (linked from About) for
 * every package the web app ships, and the repo's own MIT LICENSE. Ported from the forge template.
 */
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { ALLOWED_LICENSES } from "./credits.ts";

/** One package whose code ends up in the app bundle or the service worker. */
export interface ShippedPackage {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly url: string;
  /** The source repository without `git+` and `.git`, for the same-repository fallback. */
  readonly repository: string | undefined;
  readonly licenseText: string | undefined;
  readonly noticeText: string | undefined;
  /** Where the text comes from when the package has no licence file (shown in the file). */
  readonly licenseSource?: string;
}

/** The shipped packages plus what could not be read or is not allowed. */
export interface ShippedPackages {
  readonly packages: readonly ShippedPackage[];
  /** Dependencies that are not installed. */
  readonly missing: readonly string[];
  /** Packages whose licence is not in ALLOWED_LICENSES (app-shell rule 11). */
  readonly disallowed: readonly string[];
}

interface PackageJson {
  readonly name?: string;
  readonly version?: string;
  readonly license?: string;
  readonly homepage?: string;
  readonly repository?: string | { readonly url?: string };
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
}

/**
 * Packages the build injects although they are not `dependencies`: vite-plugin-pwa bundles
 * workbox-window (app/src/ui/pwa.ts) and generates sw.js from these Workbox modules (precache,
 * NetworkOnly navigation route with the 404 fallback). compliance-check reads the real set from dist.
 */
export const PWA_INJECTED = ["workbox-window", "workbox-core", "workbox-precaching", "workbox-routing", "workbox-strategies"] as const;

const LICENSE_FILE = /^(licen[sc]e|copying)([-.][\w.-]+)?$/i;
const NOTICE_FILE = /^notice(\.(md|txt))?$/i;
const RULE = "=".repeat(72);

/** Reads a package.json (trusted local build input); undefined when it is missing or broken. */
function readPackage(path: string): PackageJson | undefined {
  try {
    // because package.json files are trusted build input; only the fields above are read
    return JSON.parse(readFileSync(path, "utf8")) as PackageJson;
  } catch {
    // because a missing or broken package.json means "not installed", reported by the caller
    return undefined;
  }
}

/** Returns the text of the first regular file in `dir` whose name matches `pattern`, if any. */
function readMatchingFile(dir: string, pattern: RegExp): string | undefined {
  const name = readdirSync(dir).sort().find((file) => pattern.test(file) && statSync(join(dir, file)).isFile());
  return name === undefined ? undefined : readFileSync(join(dir, name), "utf8").trim();
}

/** Finds an installed package the way Node does: `node_modules/<name>` in `from` or a parent. */
function findPackageDir(from: string, name: string): string | undefined {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return realpathSync(candidate);
    if (dirname(dir) === dir) return undefined;
  }
}

/** Finds a build-injected package: next to the app, else among vite-plugin-pwa's or workbox-build's dependencies. */
function findInjectedDir(appDir: string, name: string): string | undefined {
  const pwa = findPackageDir(appDir, "vite-plugin-pwa");
  const build = pwa === undefined ? undefined : findPackageDir(pwa, "workbox-build");
  return [appDir, pwa, build].filter((dir) => dir !== undefined).map((dir) => findPackageDir(dir, name)).find((dir) => dir !== undefined);
}

/** Returns the repository URL of a package.json without `git+` and `.git`, if it has one. */
function repositoryUrl(pkg: PackageJson): string | undefined {
  const url = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  return url?.replace(/^git\+/, "").replace(/\.git$/, "");
}

/** Returns the licence facts of the package in `dir`. */
function toShipped(dir: string, pkg: PackageJson & { readonly name: string }): ShippedPackage {
  return {
    name: pkg.name,
    version: pkg.version ?? "",
    license: pkg.license ?? "UNKNOWN",
    url: pkg.homepage ?? `https://www.npmjs.com/package/${pkg.name}`,
    repository: repositoryUrl(pkg),
    licenseText: readMatchingFile(dir, LICENSE_FILE),
    noticeText: readMatchingFile(dir, NOTICE_FILE),
  };
}

/** Returns the directories to start from: the app and, with vite-plugin-pwa, the injected Workbox packages. */
function startDirs(root: string, missing: Set<string>): string[] {
  const injected = readPackage(join(root, "package.json"))?.devDependencies?.["vite-plugin-pwa"] === undefined ? [] : PWA_INJECTED;
  const dirs = [root];
  for (const name of injected) {
    const dir = findInjectedDir(root, name);
    if (dir === undefined) missing.add(name);
    else dirs.push(dir);
  }
  return dirs;
}

/**
 * Returns every production package shipped by the app in `appDir`: its `dependencies`, theirs, the
 * dependencies of workspace packages (which are not listed themselves) and the injected Workbox
 * packages. Sorted by name.
 */
export function shippedPackages(appDir: string): ShippedPackages {
  const found = new Map<string, ShippedPackage>();
  const missing = new Set<string>();
  const visited = new Set<string>();
  const queue = startDirs(realpathSync(appDir), missing);
  for (let dir = queue.shift(); dir !== undefined; dir = queue.shift()) {
    if (visited.has(dir)) continue;
    visited.add(dir);
    const pkg = readPackage(join(dir, "package.json"));
    const isWorkspace = !dir.split(sep).includes("node_modules");
    if (pkg?.name !== undefined && !isWorkspace && !found.has(pkg.name)) found.set(pkg.name, toShipped(dir, { ...pkg, name: pkg.name }));
    // Type declarations never reach the bundle.
    for (const dependency of Object.keys(pkg?.dependencies ?? {}).filter((name) => !name.startsWith("@types/"))) {
      const dependencyDir = findPackageDir(dir, dependency);
      if (dependencyDir === undefined) missing.add(dependency);
      else queue.push(dependencyDir);
    }
  }
  const packages = [...found.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
  return {
    packages,
    missing: [...missing].sort(),
    disallowed: packages.filter((pkg) => !(ALLOWED_LICENSES as readonly string[]).includes(pkg.license)).map((pkg) => `${pkg.name} (${pkg.license})`),
  };
}

/**
 * Returns `packages` with a licence text for those that ship none: a copy of the upstream file from
 * `upstreamTexts` (package name → text, scripts/page-assets/licenses/), else the licence file of
 * another shipped package from the same repository. Packages still without a text stay as they are.
 */
export function withFallbackLicenseTexts(packages: readonly ShippedPackage[], upstreamTexts: ReadonlyMap<string, string>): ShippedPackage[] {
  return packages.map((pkg) => {
    if (pkg.licenseText !== undefined) return pkg;
    const upstream = upstreamTexts.get(pkg.name);
    if (upstream !== undefined) return { ...pkg, licenseText: upstream, licenseSource: "copied from the upstream repository (the package ships no licence file)" };
    const sibling = packages.find((other) => other.licenseText !== undefined && other.repository !== undefined && other.repository === pkg.repository);
    if (sibling === undefined) return pkg;
    return { ...pkg, licenseText: sibling.licenseText, licenseSource: `licence file of ${sibling.name}, same repository ${String(pkg.repository)} (the package ships none)` };
  });
}

/** Returns third-party-licenses.txt: one block per package with its full licence and NOTICE. */
export function thirdPartyLicensesTxt(appName: string, packages: readonly ShippedPackage[]): string {
  const blocks = packages.map((pkg) =>
    [
      RULE,
      `${pkg.name} ${pkg.version} — ${pkg.license}`,
      pkg.url,
      ...(pkg.licenseSource === undefined ? [] : [`Licence text: ${pkg.licenseSource}`]),
      RULE,
      "",
      pkg.licenseText ?? `No licence file is included in this package — see ${pkg.url}.`,
      ...(pkg.noticeText === undefined ? [] : ["", `NOTICE (${pkg.name})`, "", pkg.noticeText]),
      "",
    ].join("\n"),
  );
  const intro = `Third-party licences — ${appName}\n\n${appName} includes the open-source packages below. Each keeps its own licence; the full texts follow. ${appName} uses the device's system fonts and ships no font files.\n`;
  return `${intro}\n${blocks.join("\n")}`;
}

/**
 * Returns the repo's MIT LICENSE from the template text with `{year}` replaced by "since–now" (or one
 * year): the current year is read at generate time, never written into the code (app-shell rule 3).
 */
export function mitLicense(template: string, since: number, now: Date = new Date()): string {
  const year = now.getFullYear();
  return template.replace("{year}", since < year ? `${String(since)}–${String(year)}` : String(year));
}
