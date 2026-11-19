import { defineConfig } from '@playwright/test';
import base from './playwright.daily.config.js';
export default defineConfig({
  ...base,
  testMatch: ['hundo-daily-screens.spec.js', 'hundo-daily.spec.js', 'hundo-daily-header.spec.js'],
  outputDir: '../daily-browser-results',
  projects: [
    ...base.projects,
    { name: 'landscape-webkit', use: { browserName: 'webkit', viewport: { width: 667, height: 375 }, isMobile: true, hasTouch: true } },
  ],
});
