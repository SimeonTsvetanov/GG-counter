import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    base: isProduction ? "/GG-counter/" : "/",
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,webp,ico}"],
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
