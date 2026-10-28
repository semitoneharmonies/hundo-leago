import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["dashboard-performance.spec.js", "desktop-navigation.spec.js", "coordinated-pages.spec.js", "guest-games.spec.js", "announcements.spec.js", "injury-import.spec.js", "roster-repair.spec.js"],
  outputDir: "../browser-results",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5197",
    locale: "en-CA",
    timezoneId: "America/Vancouver",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "mobile-chromium", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "desktop-webkit", use: { browserName: "webkit", viewport: { width: 1440, height: 1000 } } },
    { name: "mobile-webkit", use: { browserName: "webkit", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
