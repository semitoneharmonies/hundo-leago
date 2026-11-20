import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import process from "node:process";

const origin = "http://127.0.0.1:4785";
export default defineConfig({
  testDir: "e2e", testMatch: "hundo-daily*.spec.js", outputDir: "../browser-results",
  workers: 1, reporter: "list", timeout: 60_000, use: { baseURL: origin, serviceWorkers: "block" },
  webServer: {
    command: `"${process.execPath}" "${fileURLToPath(new URL("bin/vite.js", import.meta.resolve("vite/package.json")))}" --host 127.0.0.1 --port 4785 --strictPort`,
    url: origin, reuseExistingServer: false,
    env: { VITE_APP_ENV: "local", VITE_API_ORIGIN: origin, VITE_SOCKET_ORIGIN: origin },
  },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
