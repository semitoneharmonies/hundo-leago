import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: ['live-scoring.spec.js'], outputDir: '../browser-results', workers: 1,
  timeout: 60_000, expect: { timeout: 10_000 }, reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:5199', locale: 'en-CA', timezoneId: 'America/Vancouver', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5199 --strictPort', url: 'http://127.0.0.1:5199/e2e/fixtures/live-scoring.html', reuseExistingServer: false },
  projects: [
    { name: 'desktop-chromium', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-chromium', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'narrow-chromium', use: { browserName: 'chromium', viewport: { width: 320, height: 780 }, isMobile: true, hasTouch: true } },
    { name: 'mobile-webkit', use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
