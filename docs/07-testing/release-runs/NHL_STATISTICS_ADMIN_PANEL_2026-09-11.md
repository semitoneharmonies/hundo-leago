# Administrator NHL statistics panel — local acceptance

Graem approved implementation and local verification of this frontend panel on 11 September 2026. This candidate starts from published frontend `5a8b6746e71a66f9d74351aa00b27e54db3fa2ff` on isolated branch `codex/statistics-admin-panel-20260911`. It does not change the backend, provider controls or stored league data. Publication and shared source activation remain separate steps.

## Behaviour

**Your leagues** now includes **NHL statistics** for platform administrators, alongside existing platform administration. **Refresh now** sends one explicit authenticated `POST /api/v1/operations/statistics/refresh` with exactly `{}` through the existing HTTP client, including session credentials and CSRF proof. Opening or revisiting the page does not refresh statistics. Ordinary managers and commissioners do not see the panel; the existing backend remains the authorization boundary.

The request waits for the backend to finish. The button is disabled while pending, with a message explaining that the update can take a few minutes. A successful response must contain a valid refresh ID, `succeeded` status, nonnegative integer player count and usable capture timestamp. Only then does the panel show the confirmed count and local capture time. Internal IDs and raw diagnostics are not displayed.

Provider-disabled, running, provider-failure, access-denied, expired-session and rate-limit responses have separate plain-language messages. A network failure, cancelled request, malformed result or unknown failure is described as an unconfirmed outcome that may still be running. The administrator is directed to check the latest player statistics before another manual refresh. There is no automatic write retry. A new attempt clears the preceding result.

The panel uses the current surface, spacing, button and status-message styles. It is keyed to the current account. Existing league creation, commissioner assignment and role discovery are unchanged. No dependency, HTTP-client, backend API or stylesheet changes are required.

## Files

- `src/features/leagues/StatisticsRefreshPanel.jsx`
- `src/features/leagues/statisticsRefreshApi.js`
- `src/features/leagues/LeaguePages.jsx`
- `src/features/leagues/StatisticsRefreshPanel.test.jsx`
- `src/features/leagues/statisticsRefreshApi.test.js`
- `src/features/leagues/LeaguePages.test.jsx`
- `e2e/statistics-refresh.spec.js`
- This acceptance record.

## Verified locally

The final candidate passed **41 Vitest tests**, **8 Playwright checks** across desktop and mobile Chromium, ESLint and a Vite build. The full frontend unit suite was not rerun. The focused set includes the existing league-page tests as well as the new panel and response-contract tests.

Browser tests use the real frontend with intercepted local API responses, synthetic session data and no backend connection. They check the pending/success/disabled/uncertain states, CSRF and exact request body, duplicate prevention, no writes on page load, manager/commissioner visibility, mobile width and WCAG accessibility. Screenshots were inspected. Google Fonts is replaced with an empty stylesheet in this offline fixture, so the screenshots use fallback fonts.

The initial browser run failed its request-isolation assertion on existing font and draft-navigation requests; the test fixture was corrected. A second start was refused because the initial test server still owned its port. The final run passed all eight checks. Windows sandbox teardown required stopping only each positively identified task-owned Vite helper; final test exit was zero. This was local test tooling, not a staging service change. The build retains the existing large-main-chunk advisory.

Commands used from the isolated frontend checkout, with Node 24.14.1 on E:

```powershell
node node_modules/vitest/vitest.mjs run src/features/leagues/statisticsRefreshApi.test.js src/features/leagues/StatisticsRefreshPanel.test.jsx src/features/leagues/LeaguePages.test.jsx
node node_modules/eslint/bin/eslint.js .
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test --config ../browser-check.config.mjs
git diff --check
```

After the final timestamp punctuation fix and browser-fixture correction, the focused unit set, ESLint for all seven changed source/test files and build were run again and passed. Temporary test files and dependencies remained on E:.

Private receipts are under `E:/hundo-leago-backend/.hundo.local/statistics-admin-panel-20260911/`: `unit-results-final.json`, `browser-results-v3.json`, `verification-exits.json`, `lint-final.log`, `build-final.log`, screenshots under `browser-results-v3/`, and `CANDIDATE_REVIEW.json`.

## Remaining boundary

This is a locally verified, uncommitted candidate. No commit, push, deployment, live administrator refresh, source/job activation or production change occurred. Original frontend and backend working changes were preserved.

The next proposed checkpoint is to commit these exact eight files, push the reviewed frontend candidate to staging, publish it to the existing `hundoleago-staging` Netlify site, and verify the hosted administrator panel with provider refreshes still disabled. Source activation needs its own fresh backup and reviewed execution plan. Local intercepted-response tests do not establish signed-in hosted acceptance.
