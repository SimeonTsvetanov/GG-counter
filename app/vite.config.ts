// Vite build of the GG Counter PWA. Base path, static head, page text and manifest values come from
// app.config.ts (PLAN T-06); What's new, About and the policy dialogs read CHANGELOG.md, the shipped
// packages and content/legal at build time; the service worker follows pwa §3–5 since PLAN T-08 (prompt updates, offline-only fallback).
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA, type ManifestOptions } from "vite-plugin-pwa";
import { app as config, l10n, type AppConfig } from "../app.config.ts";
import { OG_IMAGE, headTags } from "../scripts/seo.ts";
import { noscriptHtml, pageInfoHtml } from "../scripts/static-page.ts";
import { whatsNew } from "../scripts/changelog.ts";
import { appCredits } from "../scripts/credits.ts";
import { readLegalDocuments } from "../scripts/legal.ts";
import { SW_HANDOVER_FILE } from "../scripts/sw-handover.ts";

const app: AppConfig = config;

/**
 * Fills the markers of index.html from app.config.ts: `<!--app-head-->` (title, meta, Open Graph,
 * JSON-LD), `<!--app-noscript-->` and `<!--app-page-info-->` (h1, answer, steps, FAQ) — seo-geo §2–5.
 */
function appHtml(): Plugin {
  return {
    name: "gg-counter-app-html",
    transformIndexHtml: {
      order: "pre",
      // Replacer functions: "$&" or "$'" in config text must not be expanded by String.replace.
      handler: (html) =>
        html
          .replace("%APP_LANG%", () => app.languages[0])
          .replace("<!--app-head-->", () => headTags(app))
          .replace("<!--app-noscript-->", () => noscriptHtml(app))
          .replace("<!--app-page-info-->", () => pageInfoHtml(app)),
    },
  };
}

/**
 * Makes `vite preview` answer like GitHub Pages: an unknown path under the base gets 404.html with
 * status 404 instead of Vite's index.html fallback (seo-geo §6), so checks see production's answer.
 */
function pagesNotFound(base: string): Plugin {
  return {
    name: "gg-counter-pages-404",
    configurePreviewServer(server) {
      const dist = resolve(server.config.root, server.config.build.outDir);
      const notFoundPage = join(dist, "404.html");
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
        const file = join(dist, path.slice(base.length));
        const isKnown = existsSync(file) && (!statSync(file).isDirectory() || existsSync(join(file, "index.html")));
        if (!path.startsWith(base) || isKnown || !existsSync(notFoundPage)) {
          next();
          return;
        }
        res.statusCode = 404;
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(readFileSync(notFoundPage));
      });
    },
  };
}

/** Cookie with which an e2e test asks `vite preview` for the next deploy's sw.js (tests/e2e/pwa.spec.ts). */
const NEXT_DEPLOY_COOKIE = /(?:^|;\s*)e2e-next-deploy=(\w+)/;

/**
 * `vite preview` only (GitHub Pages never runs it): with the cookie `e2e-next-deploy=<id>` sw.js gets a
 * comment added, so the browser sees a new service worker — how the e2e test makes a new version wait
 * (Playwright cannot intercept the service worker's own script request).
 */
function previewNextDeploy(base: string): Plugin {
  return {
    name: "gg-counter-preview-next-deploy",
    configurePreviewServer(server) {
      const script = join(resolve(server.config.root, server.config.build.outDir), "sw.js");
      server.middlewares.use((req, res, next) => {
        const deploy = NEXT_DEPLOY_COOKIE.exec(req.headers.cookie ?? "")?.[1];
        if (deploy === undefined || req.url?.split("?")[0] !== `${base}sw.js`) {
          next();
          return;
        }
        res.setHeader("content-type", "text/javascript; charset=utf-8");
        res.setHeader("cache-control", "no-cache");
        res.end(`${readFileSync(script, "utf8")}\n// e2e next deploy ${deploy}\n`);
      });
    },
  };
}

/**
 * Returns the web app manifest. id, start_url, scope, name, short_name, colours and icons are a
 * contract with installed copies (SPEC §4): same values as the pre-forge manifest.
 */
function pwaManifest(base: string): Partial<ManifestOptions> {
  return {
    id: app.manifest.id,
    name: app.name,
    short_name: app.manifest.shortName,
    description: app.description,
    start_url: base,
    scope: base,
    display: app.manifest.display,
    orientation: app.manifest.orientation,
    background_color: app.manifest.backgroundColor,
    theme_color: app.manifest.themeColor,
    icons: [
      { src: "icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "icons/icon-maskable.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  // Dev serves from "/" as before; the build and `vite preview` use the GitHub Pages path.
  const base = isProduction ? app.basePath : "/";

  return {
    base,
    // The storage namespace (app/src/storage/keys.ts) comes from app.config.ts, like everything else;
    // the Bulgarian config texts are used in app/src/i18n/bg.ts only, so they ship in its lazy chunk.
    define: {
      __APP_ID__: JSON.stringify(app.id),
      __APP_TEXT_BG__: JSON.stringify(l10n.bg),
      __CHANGELOG__: JSON.stringify(whatsNew(readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8"))),
      __CREDITS__: JSON.stringify(appCredits(new URL("./", import.meta.url))),
      // The policy pages (PLAN T-10): used only by the lazy legal dialog, so they ship in its chunk.
      __LEGAL__: JSON.stringify(readLegalDocuments(app, fileURLToPath(new URL("../content/legal", import.meta.url)))),
    },
    plugins: [
      appHtml(),
      pagesNotFound(base),
      previewNextDeploy(base),
      react(),
      VitePWA({
        // pwa §5: a new version waits for the user's Reload (update toast in app/src/ui/), never reloads
        // by itself; registration happens in app/src/ui/pwa.ts, so no injected registerSW.js.
        registerType: "prompt",
        injectRegister: false,
        manifest: pwaManifest(base),
        workbox: {
          // Same cache id, file name (sw.js) and scope as the pre-forge worker: installed copies update in place.
          cacheId: app.id,
          globPatterns: ["**/*.{js,css,html,svg,png,webp,ico}"],
          // The social image is for link previews only, never needed offline (pwa §3).
          globIgnores: [OG_IMAGE.file],
          cleanupOutdatedCaches: true,
          ignoreURLParametersMatching: [/.*/],
          // pwa §4: no navigateFallback (it would answer every unknown address with the app, online
          // too, e.g. sitemap.xml). Precached pages win; other navigations go to the network and only
          // when that fails (offline) our 404 page answers.
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkOnly",
              options: { precacheFallback: { fallbackURL: `${base}404.html` } },
            },
          ],
          // Lets the first update away from the pre-T-08 auto-update worker take over without
          // waiting for every window to close (scripts/sw-handover.ts).
          importScripts: [SW_HANDOVER_FILE],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: {
      port: 5173,
    },
  };
});
