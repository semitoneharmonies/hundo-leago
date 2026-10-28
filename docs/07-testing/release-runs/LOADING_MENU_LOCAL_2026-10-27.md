# Coordinated page loading and Mini Games navigation — 27 October 2026

Status: locally implemented and verified. No commit, push, deployment or live-data write was performed. The later announcement follow-up also changes the isolated backend candidate; see `ANNOUNCEMENT_REMOVAL_LOCAL_2026-10-27.md` before preparing a release.

The later IR matching follow-up is also included locally; see `IR_FIRST_NAME_LOCAL_2026-10-27.md` for the user-approved first-name filtering, preservation checks and release boundary.

## Source and scope

Candidate: `E:/hundo-leago/.hundo.local/loading-menu-20261027/frontend`, branch `codex/loading-menu-20261027`, based on accepted frontend commit `9955d66a84799539c08d8fb52f1b30d2aa8cb9ec`.

The Netlify read-only lookup confirmed the current ready production deployment as `6ae0af1e828e84aea52a7450`, matching the latest Mr. Boni acceptance receipt at `E:/hundo-leago/.hundo.local/codex-documents/2026-10-25/i-x20/work/mr-boni-hundo-20261026/release/production-accepted.json`. A local clone preserves that release and the unrelated dirty original checkouts. Do not replace a later release with this candidate without comparing its source first.

The user requested an explanation and fix for staged dashboard loading, matching fixes on other affected pages, and a Mini Games submenu beside the navigation using the two game logos.

## Diagnosis and resulting behavior

The dashboard already fetched several independent summaries in parallel, but revealed the layout before those responses completed. Nested matchup cards and trade-block panels started further reads after mounting. Different response timings therefore produced several visible stages. The latest game release did not change these loading paths. Cold caches or slower responses can make this existing pattern more noticeable; authenticated production latency was not measured, so no specific server slowdown is claimed.

- Dashboard: team workspaces start as soon as authorized teams arrive; summaries, roster, trade block, matchup scores, and the applicable commissioner panels settle before the first content reveal.
- Matchups: current-season schedule reads can start from the authorized league summary while season metadata loads. Initial teams, schedule, selected matchup and applicable game-progress data settle together. Explicit historical-season selection remains respected.
- Trades: existing team-workspace reads start before the initial composer/list/trade block reveal.
- Players: teams, auction permissions and the active catalogue/favourites reads settle together. Disabled queries do not block the page, including a league switch while Favourites is selected.
- Already visible content stays visible during background refresh. Failed reads count as settled and show the existing error/unavailable state. Preloaded child queries do not immediately restart failed reads on mount; explicit retry still works.
- Standings, the main roster view and auction lists already gate their primary payloads. User-selected later tabs, filters, weeks and proposal workflows retain their existing loading behavior.
- Mini Games uses the existing desktop side flyout. The mobile adjacent submenu is retained. Tip Jar uses its existing wordmark and Mr. Boni its existing SVG; accessible Play names, selected links, Escape and focus recovery remain.

Coordinating the first display waits for the slowest required read. It avoids fragmented presentation; it does not make all network responses finish simultaneously or establish a measured production speedup.

## Exact application files changed

All paths below are relative to the absolute candidate directory above.

- `src/components/DesktopSidebar.jsx`
- `src/components/MatchupCard.jsx`
- `src/components/MiniGamesLinks.jsx`
- `src/components/MiniGamesLinks.css` (new)
- `src/components/TipJarNavLabel.jsx`
- `src/features/accounts/AccountHome.jsx`
- `src/features/competition/CompetitionPages.jsx`
- `src/features/competition/MatchupGameProgress.jsx`
- `src/features/leagues/LeagueDashboard.jsx`
- `src/features/leagues/LeaguePages.jsx`
- `src/features/leagues/dashboardQueries.js`
- `src/features/players/PlayersCatalogPage.jsx`
- `src/features/transactions/TradeBlockPanel.jsx`
- `src/features/transactions/TransactionPages.jsx`

Test/support files changed: `src/components/TopBar.test.jsx`; `src/features/competition/CompetitionPages.test.jsx`; `src/features/leagues/LeagueDashboard.test.jsx`; `src/features/leagues/LeaguePages.test.jsx`; `src/features/leagues/dashboardQueries.test.js`; `src/features/players/PlayersCatalogPage.test.jsx`; `src/features/transactions/TransactionPages.test.jsx`; `e2e/dashboard-performance.spec.js`; `e2e/desktop-navigation.spec.js`; `e2e/fixtures/dashboard-performance.jsx`; new `e2e/coordinated-pages.spec.js`, `e2e/fixtures/coordinated-pages.html`, `e2e/fixtures/coordinated-pages.jsx`, and `playwright.loading-menu.config.js`; this verification record.

Private supporting artifacts are outside the candidate source in `E:/hundo-leago/.hundo.local/loading-menu-20261027/`. The private tracker was updated through its validated CLI. The original loading/menu scope changed no game package, scoring, saved score, backend, API contract, session policy, league rule or persistent league-data file. The separately documented announcement follow-up adds backend visibility rules and an additive response version field.

## Verification actually run

Commands ran from the candidate directory with Node `E:/hundo-tools/node-v24.14.1-win-x64/node.exe`. TEMP/TMP were directed to its `.tmp` directory; browser binaries were already installed under `E:/Codex/cache/ms-playwright`.

1. `node node_modules/vitest/vitest.mjs run src/components/TopBar.test.jsx src/features/leagues/LeaguePages.test.jsx src/features/leagues/LeagueDashboard.test.jsx src/features/leagues/dashboardQueries.test.js src/features/competition/CompetitionPages.test.jsx src/features/competition/MatchupDay.test.jsx src/features/players/PlayersCatalogPage.test.jsx src/features/transactions/TransactionPages.test.jsx --no-cache --configLoader runner`: **134/134 passed**, eight files. Public test environment was local with localhost API/socket origins. Log: `../unit-tests.txt`.
2. Focused `node node_modules/eslint/bin/eslint.js` over every changed/new JavaScript and JSX file: **passed**. `git diff --check`: **passed**.
3. `node node_modules/vite/bin/vite.js build --configLoader runner`: **passed** after final runtime changes. Production configuration used the accepted API/socket origin, with local build ID `loading-menu-local-20261027`. This was not deployed. The existing bundle-size warning remains. Log: `../build.txt`.
4. `node node_modules/@playwright/test/cli.js test --config playwright.loading-menu.config.js` with scope filters: **48 distinct final browser checks passed** across desktop/mobile Chromium/WebKit: 32 dashboard checks, four Mini Games checks, and 12 Matchups/Trades/Players checks. All requests used synthetic local data. They verify delayed first reads, errors settling, no duplicate initial reads, background refresh, league isolation, denied access, submenu side placement, loaded logos, correct links and keyboard recovery.

The browser server is `http://127.0.0.1:5197`. Navigation tests use `HUNDO_NAVIGATION_PREVIEW_ORIGIN` with that origin. Filters used were `dashboard reveals|dashboard settles|dashboard loads summaries|inaccessible dashboard|Mini Games opens`, and the dedicated `e2e/coordinated-pages.spec.js` file. Final menu-only WebKit rerun passed both projects serially with `--workers 1`; log: `../menu-webkit-tests.txt`.

Evidence directories: `../browser-results`, `../menu-final-browser-results`, `../menu-webkit-final-browser-results`, and `../coordinated-browser-results`. Desktop/mobile menu screenshots were visually inspected.

## Intermediate failures and limits

Earlier test runs exposed fixture omissions, disabled-query handling on a Players league switch, and child retry-on-mount flicker. The latter two were fixed with regression tests. A logo readiness assertion was changed to wait for SVG decoding instead of assuming visibility meant decoding had completed. Concurrent Windows browser launches caused setup/startup timeouts; serial final checks passed. Two mobile test selectors incorrectly targeted desktop-only navigation and were corrected to the actual score region.

A separate synthetic mobile WebKit Trades layout check observed a 390px viewport with a 947px document, associated with the existing 940px trade-block table and its hidden action label. Exact measurements are in `../coordinated-browser-results/trades-mobile-webkit-layout.json`. This change does not alter that layout; loading checks passed separately. No full-layout acceptance or overflow fix is claimed for Trades.

No full repository suite, Firefox, physical-device checks or authenticated hosted acceptance was run. Production response timing remains unmeasured. These results establish local behavior and build readiness only. Publication/deployment is a separate unperformed step. Canonical league rules need no update; this record documents the presentation change.

## Guest home logo follow-up — 27 October 2026

Before deployment, the user additionally requested logos for the public games on the sign-in home screen. `AccountHome.jsx` now reuses `MiniGamesLinks` on the normal unauthenticated screen and while session checking/account service unavailability is shown. The explicit `publicGames` option selects the existing `/games/tip-jar` and `/games/mr-boni` URLs; league navigation keeps its default league-specific routes. `MiniGamesLinks.css` adds a scoped two-column public layout. The same Tip Jar wordmark and Mr. Boni SVG are used, with accessible Play names and no-account-needed text preserved. Sign-in, account creation and gameplay logic are unchanged.

Exact follow-up runtime files: `src/features/accounts/AccountHome.jsx`, `src/components/MiniGamesLinks.jsx`, `src/components/MiniGamesLinks.css`. `playwright.loading-menu.config.js` now also permits the existing guest-games spec to run against the same local server. This record and the private tracker were updated; no other product scope was added.

Focused verification after these changes:

- `node node_modules/vitest/vitest.mjs run src/features/accounts/AccountHome.test.jsx src/components/TopBar.test.jsx --no-cache --configLoader runner`: **22/22 passed**, including existing session checking, public link destinations and league navigation checks. Log: `../guest-logo-unit-tests.txt`.
- `node node_modules/@playwright/test/cli.js test --config playwright.loading-menu.config.js --grep 'sign-in page opens guest play' --output ../guest-logo-browser-results`: **4/4 passed**, desktop/mobile Chromium/WebKit. The existing test uses synthetic local gameplay and scores only. Log: `../guest-logo-browser-tests.txt`.
- Focused ESLint for `AccountHome.jsx` and `MiniGamesLinks.jsx`, and `git diff --check`: **passed**.
- Production-configured Vite build after the logo update: **passed**, with the existing large-chunk warning. Log: `../guest-logo-build.txt`.
- Desktop 1440x1000 and mobile 390x844 sign-in screenshots were captured with the Playwright screenshot CLI and visually inspected; both logos fit their existing button styles without clipping. Evidence: `../guest-logos-desktop.png` and `../guest-logos-mobile.png`.

Preview: `http://127.0.0.1:5197/e2e/fixtures/guest-games.html`. This is synthetic local data. The combined candidate is still uncommitted, unpublished and undeployed. No live account, league or game records were accessed or changed by this follow-up.

## Roster repair follow-up

The user also requested a reviewed automatic repair inside the illegal-roster flag, maximizing scheduled matchup-week games when possible. The same isolated candidates now include the frontend review/apply panel, exact planner and atomic backend command. Scope, paths, verification and scoring boundaries are documented in `ROSTER_REPAIR_LOCAL_2026-10-27.md`. This addition requires coordinated backend/frontend deployment; it has not been released or applied to live rosters.
