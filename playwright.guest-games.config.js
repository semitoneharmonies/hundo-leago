import { defineConfig } from "@playwright/test";
import process from "node:process";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "guest-games.spec.js",
  outputDir: "../browser-results",
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5196",
    browserName: "chromium",
    launchOptions: { executablePath: process.env.HUNDO_QA_CHROMIUM },
    locale: "en-CA",
    timezoneId: "America/Vancouver",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
  ],
});
