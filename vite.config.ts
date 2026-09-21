import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Makes the game work fully offline: a service worker caches every file of the build on the
    // first visit. The install manifest is our own file (public/manifest.webmanifest).
    VitePWA({
      registerType: "autoUpdate", // a new deploy is picked up in the background and used on the next launch
      injectRegister: "auto",
      manifest: false,
      workbox: {
        // woff2 only: every browser that can run the service worker supports it, and the old
        // woff copies would just double the download
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,txt,webmanifest}"],
        globIgnores: ["**/sfx/README.txt"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
