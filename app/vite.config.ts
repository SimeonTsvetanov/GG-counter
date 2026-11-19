// Vite build of the GG Counter PWA. Base path, static head, page text and manifest values come from
// app.config.ts (PLAN T-06); service-worker settings are unchanged until PLAN T-08.
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA, type ManifestOptions } from "vite-plugin-pwa";
import { app as config, type AppConfig } from "../app.config.ts";
import { OG_IMAGE, headTags } from "../scripts/seo.ts";
import { noscriptHtml, pageInfoHtml } from "../scripts/static-page.ts";

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
    // The storage namespace (app/src/storage/keys.ts) comes from app.config.ts, like everything else.
    define: { __APP_ID__: JSON.stringify(app.id) },
    plugins: [
      appHtml(),
      pagesNotFound(base),
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: pwaManifest(base),
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,webp,ico}"],
          // The social image is for link previews only, never needed offline (pwa §3).
          globIgnores: [OG_IMAGE.file],
          cacheId: "gg-counter",
          cleanupOutdatedCaches: true,
        },
        includeAssets: [
          "favicon.svg",
          "icons/icon-192x192.svg",
          "icons/icon-512x512.svg",
          "icons/icon-maskable.svg",
        ],
      }),
    ],
    server: {
      port: 5173,
    },
  };
});
