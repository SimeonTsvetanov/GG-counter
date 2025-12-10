import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ mode }) => {
    const isProduction = mode === "production";
    const base = isProduction ? "/GG-counter/" : "/";
    return {
        base,
        plugins: [
            react(),
            VitePWA({
                registerType: "autoUpdate",
                manifest: {
                    id: "gg-counter-pwa-v1",
                    name: "GG Counter",
                    short_name: "GG Counter",
                    description: "Offline-first score tracker for Carcassonne and other tabletop games.",
                    start_url: base,
                    scope: base,
                    display: "standalone",
                    orientation: "portrait-primary",
                    background_color: "#1F4ED8",
                    theme_color: "#1F4ED8",
                    icons: [
                        {
                            src: "icons/icon-192x192.svg",
                            sizes: "192x192",
                            type: "image/svg+xml",
                            purpose: "any",
                        },
                        {
                            src: "icons/icon-512x512.svg",
                            sizes: "512x512",
                            type: "image/svg+xml",
                            purpose: "any",
                        },
                        {
                            src: "icons/icon-maskable.svg",
                            sizes: "512x512",
                            type: "image/svg+xml",
                            purpose: "maskable",
                        },
                    ],
                },
                workbox: {
                    globPatterns: ["**/*.{js,css,html,svg,png,webp,ico}"],
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
