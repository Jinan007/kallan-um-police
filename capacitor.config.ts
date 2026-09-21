import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kallanumpolice.app",
  appName: "Kallan um Police",
  // the built game: `npm run build` writes it here, and `cap sync` copies it into the Android app
  webDir: "dist",
  backgroundColor: "#1c1108",
  android: {
    // the game is a single-player-hand-off phone game: no need for remote debugging in release builds
    webContentsDebuggingEnabled: false,
  },
};

export default config;
