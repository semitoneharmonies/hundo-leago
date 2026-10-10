# Dashboard and roster performance — local verification, 3 October 2026

Graem requested implementation after reporting several-second waits in dashboard containers and information-heavy pages. This record covers local implementation and synthetic verification only. Nothing was committed, pushed, or deployed. No production/staging database, account, league, or hosting configuration was changed.

## Changes

- Start five independent dashboard reads after authenticated visible-league membership is confirmed, alongside league/team detail requests. The existing panel query keys deduplicate pending requests and reuse fresh results. Membership checks, cancellation signals, private-cache cleanup, and existing freshness intervals remain intact.
- Fetch five activity entries for the dashboard instead of 25. Keep the full activity page's existing 25-entry query and cache key; the smaller response has its own key.
- Restrict roster statistics and player-source ranking to players owned by the selected team, league, and season before ranking historical rows. Preserve statistics selection order, source preference, response fields, and cap calculations.
- Select the current matchup week directly in SQLite and retrieve only that week's matchups/byes. Preserve the previous current-window, rollover, cancelled-week, and earliest-nonfinal fallback rules. Week-detail reads also filter by week in SQLite.

## Files changed

Frontend (`E:/hundo-leago/`):

- `src/features/leagues/LeaguePages.jsx`
- `src/features/leagues/LeagueDashboard.jsx`
- `src/features/leagues/dashboardQueries.js`
- `src/features/leagues/dashboardQueries.test.js`
- `src/features/transactions/transactionQueries.js`
- `e2e/dashboard-performance.spec.js`
- `e2e/fixtures/dashboard-performance.html`
- `e2e/fixtures/dashboard-performance.jsx`
- This verification record.

Backend (`E:/hundo-leago-backend/`):

- `src/infrastructure/persistence/sqlite/SqliteTeamWorkspaceRepository.js`
- `src/infrastructure/persistence/sqlite/SqlitePublicRosterRepository.js`
- `src/infrastructure/persistence/sqlite/SqliteMatchupReadRepository.js`
- `src/application/services/matchups/createMatchupIntegrationService.js`
- `test/foundation/matchupHttpFoundation.test.js`
- `test/foundation/dashboardReadPerformanceFoundation.test.js`
- `test/helpers/createPerformanceFixture.js`

Existing dirty files were patched narrowly. Their pre-change contents were saved under `E:/hundo-leago-backend/.hundo.local/performance-20261003/` for comparison. Private tracker task `idea-41b09ed7` records the authorized scope and outcome separately from publication.

## Measurements

An isolated release-QA database was populated with 2,000 additional unrelated players and 12 statistics refreshes (24,000 additional statistics rows). Each operation used five warmup calls and 35 measured calls on the same machine/database. The baseline used the exact saved pre-change repository code, including preexisting local changes.

| Read | Before median | After median | Ratio |
| --- | ---: | ---: | ---: |
| Full team workspace | 77.10 ms | 3.18 ms | 24.3 times faster |
| Public roster | 74.42 ms | 2.15 ms | 34.6 times faster |
| Current week repository work: full schedule versus targeted read | 0.606 ms | 0.144 ms | 4.2 times faster |

Full roster responses were deeply equal before/after. Database serialization was identical before/after all benchmark reads. The current-week comparison measures repository work, not full HTTP service latency. These synthetic timings are not live-site page timings or a promise of equivalent production speedup.

Evidence: `E:/hundo-leago-backend/.hundo.local/performance-20261003/benchmark.cjs` and `benchmark-results.json`.

## Verification

All temporary fixture work and logs were kept on E:. Backend test commands used `TEMP` and `TMP` set to `E:/hundo-leago-backend/.hundo.local/performance-20261003`.

1. **36 backend tests passed**:

   `node --require ./.hundo.local/performance-20261003/fixture-preload.cjs --test test/foundation/dashboardReadPerformanceFoundation.test.js test/foundation/matchupHttpFoundation.test.js test/foundation/matchupReadProviderHealthFoundation.test.js test/foundation/teamWorkspaceFoundation.test.js test/foundation/publicRosterFoundation.test.js test/foundation/publicRosterHttpFoundation.test.js`

   Checks included provider preference, prior-season exclusion, current-week boundaries/fallbacks, league isolation, cap/roster contracts, HTTP envelopes, and unchanged database bytes during reads.

2. **45 frontend tests passed**:

   `npm test -- --run src/features/leagues/dashboardQueries.test.js src/features/leagues/LeaguePages.test.jsx src/features/leagues/LeagueDashboard.test.jsx src/features/transactions/TransactionPages.test.jsx`

   Checks included parallel starts, request deduplication, fresh-cache reuse, session cancellation/private eviction, league isolation, and separate summary/full-history cache entries.

3. **8 browser checks passed**, desktop/mobile Chromium and desktop/mobile WebKit:

   `node node_modules/@playwright/test/cli.js test e2e/dashboard-performance.spec.js --config .hundo.local/performance-20261003/playwright.config.mjs --project desktop-chromium --project mobile-chromium --project desktop-webkit --project mobile-webkit`

   Used Vite at `http://127.0.0.1:5176` and synthetic responses. Held league/team requests open while confirming all five summary requests started, then released the gates and checked the rendered dashboard, no duplicate activity read, separate league caches, inaccessible-league denial, no page errors, and no horizontal overflow.

4. **`npm run lint`, focused changed-file lint, `npm run build`, backend syntax checks, and `git diff --check` passed.** The build retains the preexisting warning about an entry chunk above 500 kB.

## Test setup limitations and follow-up

- The first standard backend run hit an existing fixture mismatch: the release-QA seed verifier accepts schemas 54/55, while an unrelated local community-quotes migration produces schema 56. The new performance fixture helper verifies a schema-55 seed, then applies the current migrations to that isolated database. A local preload wrapper applied the same setup to existing fixture-based tests. The unrelated migration and production verifier were preserved. Standard tests that directly seed all local migrations still have that preexisting setup issue; the passing count above uses the documented wrapper.
- The first sandboxed browser run timed out while creating a page, before application execution. The identical browser checks passed outside the sandbox with temporary browser files on E:.
- No signed-in hosted timing, staging acceptance, or production acceptance was performed. A release requires a separately authorized, scoped deployment and post-deployment measurements. This local branch contains unrelated work that must not be included automatically.
- The trade-block panel still requests each team's workspace. Those reads now benefit from the narrowed statistics queries; consolidating them behind a dedicated summary endpoint is a possible later optimization, not part of this change.
