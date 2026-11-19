// Unit tests of the licence texts (scripts/licenses.ts), on temporary package trees.
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { PWA_INJECTED, mitLicense, shippedPackages, thirdPartyLicensesTxt, withFallbackLicenseTexts, type ShippedPackage } from "./licenses.ts";

/** Writes files (path → content) into a fresh temp dir and returns it. */
function fixture(files: Readonly<Record<string, string>>): string {
  const dir = mkdtempSync(join(tmpdir(), "licenses-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

const pkg = (name: string, extra: object = {}): string => JSON.stringify({ name, version: "1.0.0", license: "MIT", ...extra });

/** A shipped package for the pure functions. */
function shipped(name: string, extra: Partial<ShippedPackage> = {}): ShippedPackage {
  return { name, version: "1.0.0", license: "MIT", url: `https://${name}.example`, repository: undefined, licenseText: undefined, noticeText: undefined, ...extra };
}

describe("shippedPackages", () => {
  it("follows app deps, nested deps and a workspace symlink; skips @types and the workspace package itself", () => {
    const root = fixture({
      "app/package.json": pkg("app", { dependencies: { a: "^1", core: "workspace:*", "@types/x": "^1" } }),
      "app/node_modules/a/package.json": pkg("a", { dependencies: { b: "^1" } }),
      "app/node_modules/a/LICENSE": "MIT License\n\nCopyright (c) 2026 A",
      "node_modules/b/package.json": pkg("b", { license: "Apache-2.0", repository: "git+https://github.com/b/b.git" }),
      "node_modules/b/LICENSE": "Apache License",
      "node_modules/b/NOTICE": "B notice",
      "packages/core/package.json": pkg("core", { dependencies: { c: "^1" } }),
      "packages/core/node_modules/c/package.json": pkg("c", { license: "GPL-3.0" }),
    });
    symlinkSync(join(root, "packages", "core"), join(root, "app", "node_modules", "core"));
    const result = shippedPackages(join(root, "app"));
    expect(result.packages.map((p) => p.name)).toEqual(["a", "b", "c"]);
    expect(result.packages.find((p) => p.name === "b")).toMatchObject({ noticeText: "B notice", repository: "https://github.com/b/b" });
    // @types/x is not installed, but type declarations never ship, so it is not reported either.
    expect(result.missing).toEqual([]);
    expect(result.disallowed).toEqual(["c (GPL-3.0)"]);
  });

  it("reports dependencies that are not installed", () => {
    const root = fixture({ "app/package.json": pkg("app", { dependencies: { gone: "^1" } }) });
    expect(shippedPackages(join(root, "app")).missing).toEqual(["gone"]);
  });

  it("adds the Workbox packages vite-plugin-pwa injects, found through workbox-build", () => {
    const files: Record<string, string> = {
      "app/package.json": pkg("app", { devDependencies: { "vite-plugin-pwa": "^2" } }),
      "app/node_modules/vite-plugin-pwa/package.json": pkg("vite-plugin-pwa"),
      "app/node_modules/vite-plugin-pwa/node_modules/workbox-build/package.json": pkg("workbox-build"),
    };
    for (const name of PWA_INJECTED) {
      const at = name === "workbox-window" ? "app/node_modules" : "app/node_modules/vite-plugin-pwa/node_modules/workbox-build/node_modules";
      files[`${at}/${name}/package.json`] = pkg(name);
    }
    const result = shippedPackages(join(fixture(files), "app"));
    expect(result.packages.map((p) => p.name)).toEqual([...PWA_INJECTED].sort((a, b) => a.localeCompare(b, "en")));
    expect(result.missing).toEqual([]);
  });
});

describe("withFallbackLicenseTexts", () => {
  it("keeps a package's own text, else uses an upstream copy, else a package of the same repository", () => {
    const repository = "https://github.com/radix-ui/primitives";
    const result = withFallbackLicenseTexts(
      [
        shipped("own", { licenseText: "Own text" }),
        shipped("cva"),
        shipped("@radix-ui/primitive", { repository, licenseText: "MIT WorkOS" }),
        shipped("@radix-ui/rect", { repository }),
        shipped("lonely", { repository: "https://github.com/x/y" }),
      ],
      new Map([["cva", "Apache text"]]),
    );
    expect(result.map((p) => p.licenseText)).toEqual(["Own text", "Apache text", "MIT WorkOS", "MIT WorkOS", undefined]);
    expect(result[1]?.licenseSource).toMatch(/upstream repository/);
    expect(result[3]?.licenseSource).toBe(`licence file of @radix-ui/primitive, same repository ${repository} (the package ships none)`);
    expect(result[0]?.licenseSource).toBeUndefined();
  });
});

describe("thirdPartyLicensesTxt", () => {
  it("has the full licence text, NOTICE, where a borrowed text comes from, and a line for a missing one", () => {
    const txt = thirdPartyLicensesTxt("Demo", [
      shipped("a", { licenseText: "Copyright (c) 2026 A" }),
      shipped("b", { version: "2.0.0", license: "Apache-2.0", licenseText: "Apache License", noticeText: "B notice", licenseSource: "copied" }),
      shipped("c"),
    ]);
    expect(txt).toMatch(/^Third-party licences — Demo\n/);
    expect(txt).toContain("a 1.0.0 — MIT\nhttps://a.example\n");
    expect(txt).toContain("Copyright (c) 2026 A");
    expect(txt).toContain("Licence text: copied\n");
    expect(txt).toContain("NOTICE (b)\n\nB notice");
    expect(txt).toContain("No licence file is included in this package — see https://c.example.");
  });
});

describe("mitLicense", () => {
  const template = "MIT License\n\nCopyright (c) {year} Simeon Tsvetanov\n";

  it("writes the years from the first publication to now, read at run time", () => {
    expect(mitLicense(template, 2025, new Date("2026-11-19"))).toBe("MIT License\n\nCopyright (c) 2025–2026 Simeon Tsvetanov\n");
    expect(mitLicense(template, 2026, new Date("2026-11-19"))).toContain("Copyright (c) 2026 Simeon");
  });
});
