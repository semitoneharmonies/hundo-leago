# Commissioner announcement removal and seven-day visibility

Status: local implementation and focused verification complete. Nothing committed, published or deployed. No live announcement or other league data was changed.

## User decision and behavior

The user requested an X in the top-right of each announcement for commissioner removal, then explicitly chose automatic disappearance after seven days. Previously sidebar announcements were stored with no expiry, and commissioner communications allowed optional expiry. Both visible lists already respected archive and explicit expiry; there was no seven-day default or sidebar removal action.

Commissioners and administrators now see a small X on each visible sidebar/main announcement. It invokes the existing authenticated, CSRF-protected, version-checked archive endpoint immediately. Managers have no removal control, and the server independently denies them. Failed requests retain the notice and display a retry message. A stale version refreshes the data before retry. A response for another announcement is rejected. Both announcement query families refresh after removal or posting; unrelated leagues stay isolated. Existing commissioner history keeps its archive controls.

Every announcement now leaves visible lists at `created_at_ms + 604800000` (seven elapsed days), or an earlier explicit expiry, or manual archive. This applies to existing notices with no expiry, pinned notices and automatic league-change announcements. Filtering occurs in the read queries before pagination. Commissioner history and existing notification history remain available. Stored text, expiry fields and other records are preserved; viewing expired notices does not perform a cleanup write. Delayed push collection and its final send check also reject expired announcements. The displayed expiry and message preview explain the seven-day maximum even when an older/custom expiry is later.

An already-open page picks up expiry through its existing refresh/focus behavior (sidebar polling every 60 seconds; communications every 30 seconds). No background deletion job or migration is required.

## Sources and exact changed files

Frontend root: `E:/hundo-leago/.hundo.local/loading-menu-20261027/frontend`, branch `codex/loading-menu-20261027`, based on accepted `9955d66a84799539c08d8fb52f1b30d2aa8cb9ec`.

Runtime files added/changed for this follow-up:

- `src/features/leagues/AnnouncementRemoveButton.jsx` (new)
- `src/features/leagues/AnnouncementRemoveButton.css` (new)
- `src/features/leagues/LeagueAnnouncements.jsx`
- `src/features/leagues/announcementQueries.js`
- `src/features/commissioner/LeagueCommunications.jsx`
- `src/features/commissioner/LeagueCommunications.module.css`

Frontend test/support: new `src/features/leagues/LeagueAnnouncements.test.jsx`, existing `src/features/commissioner/LeagueCommunications.test.jsx`, `src/test/desktopNavigationFixture.js`, `e2e/fixtures/desktop-navigation.jsx`, new `e2e/announcements.spec.js`, `playwright.loading-menu.config.js`, this record and the linked loading/menu record.

Backend root: `E:/hundo-leago/.hundo.local/loading-menu-20261027/backend`, branch `codex/loading-menu-20261027`, isolated clone of accepted `4fd3aa385ba6a3b2f524d36a268ffb8246d87ea5`.

Backend runtime files:

- `src/application/services/activity/createLeagueAnnouncementService.js`
- `src/domain/leagues/leagueCommunicationPolicy.js`
- `src/infrastructure/persistence/sqlite/SqliteLeagueAnnouncementRepository.js`
- `src/infrastructure/persistence/sqlite/SqliteLeagueCommunicationRepository.js`
- `src/infrastructure/persistence/sqlite/SqlitePushRepository.js`

Backend tests: `test/foundation/leagueAnnouncementFoundation.test.js`, `test/foundation/leagueCommunicationFoundation.test.js`, `test/foundation/webPushFoundation.test.js`.

The API adds a positive integer `version` to sidebar GET/POST announcement records. The frontend uses it with existing `POST /api/v1/leagues/:leagueId/communications/:id/archive`, body `{version, confirmed:true}`. No new route or schema change.

## Verification

All commands used `E:/hundo-tools/node-v24.14.1-win-x64/node.exe` and candidate `.tmp` for TEMP/TMP. All data was synthetic/local.

- Frontend: `node node_modules/vitest/vitest.mjs run src/features/leagues/LeagueAnnouncements.test.jsx src/features/commissioner/LeagueCommunications.test.jsx --no-cache --configLoader runner`: **18/18 passed**. Roles, pending duplicate clicks, failure/retry, draft/history preservation, synchronized views, other-league cache preservation, stale version refresh, incorrect receipt rejection and later-expiry preview covered.
- Compatibility: same Vitest command with `src/components/TopBar.test.jsx src/features/accounts/AccountHome.test.jsx`: **22/22 passed**.
- Browser: `node node_modules/@playwright/test/cli.js test --config playwright.loading-menu.config.js e2e/announcements.spec.js --workers=1`: **8/8 passed**, desktop/mobile Chromium/WebKit. X top-right geometry, failure/retry, both views, preserved history, manager read-only and second-league preservation covered.
- Existing posting/retry browser checks: same config, `e2e/desktop-navigation.spec.js --grep 'commissioner announcements|sidebar failures' --project desktop-chromium --project desktop-webkit --workers=1 --output ../announcement-navigation-results`: **4/4 passed**.
- Every changed/new JavaScript/JSX file passed focused ESLint; both repositories passed `git diff --check`. Backend changed JavaScript passed `node --check`.
- `node node_modules/vite/bin/vite.js build --configLoader runner`: **passed**, production configuration, local build ID `loading-menu-local-20261027`. Existing large-chunk warning remains. Build was not deployed.
- Backend: `node --test test/foundation/leagueAnnouncementFoundation.test.js test/foundation/leagueCommunicationFoundation.test.js test/foundation/webPushFoundation.test.js`: **49/49 passed**, 36.86 seconds. HTTP authorization/version/CSRF/origin/isolation cases, idempotent archive retry, exact seven-day and earlier-expiry boundaries, both visible lists, stored-history/notification preservation and delayed-push suppression covered. Expiry and denied reads were verified against serialized database bytes.

Desktop/mobile screenshots were visually inspected: `E:/hundo-leago/.hundo.local/loading-menu-20261027/announcement-x-desktop-chromium.png` and `announcement-x-mobile-chromium.png`. Browser result files are under sibling `browser-results` and `announcement-navigation-results`. The earlier loading/menu/logo evidence remains in `LOADING_MENU_LOCAL_2026-10-27.md`.

## Limits and release ordering

The broad `eslint .` command also scanned unchanged vendored Tip Jar build bundles and the local Playwright transform cache, reporting 50 errors there. The focused lint over every changed/new source and test file passed; unrelated vendor bundles were preserved. An initial backend run passed 48 of 49 tests, with the existing push-encryption test unable to import missing shared `web-push`; the final run uses the existing pinned 3.6.7 package from `E:/hundo-leago-backend/.hundo.local/web-app-20261012/push-dependencies/node_modules` through NODE_PATH. No shared package files were modified.

No full repository suite, Firefox, physical-device or authenticated hosted acceptance was run. The synthetic preview is `http://127.0.0.1:5197/e2e/fixtures/desktop-navigation.html?announcements&commissioner#/leagues/11111111-1111-4111-8111-000000000001`.

A separately authorized release must include both candidates, deploy/verify the additive backend response before the frontend, and refresh accepted-production continuity if another release has occurred. Existing announcements older than seven days will leave visible lists upon that deployment; their rows and commissioner history remain. Do not deploy the new frontend alone against a backend that lacks announcement versions. Any rollback must also keep a compatible frontend/backend pair. The original dirty application checkouts and accepted release sources were left intact.
