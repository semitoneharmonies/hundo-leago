# Dashboard roster leaders and matchup cards

Local implementation and verification completed 4 October 2026 (America/Vancouver).

Source: isolated worktree `E:/hundo-leago/.hundo.local/dashboard-matchup-roster-20261003`, branch `codex/dashboard-matchup-roster-20261003`, based on released frontend `16b0f555b0199bbad4e247c0a8c6f850108f3123`. The original frontend and backend working copies contain unrelated work and were preserved. No commit, push, deployment, live-data access or backend change was performed.

## Behavior

- Dashboard shows every pairing in the current week vertically, with links to that exact season/week/matchup and team branding. Byes and loading/error/empty states remain visible.
- Dashboard roster shows the top ten current roster members by authoritative season-total FP, across Active, Bench, Injured Reserve and Prospect. Negative values sort above unavailable values. Matchup participant totals are not mixed with season totals. The heading explicitly identifies season statistics.
- Dashboard uses the normal roster action buttons and the same extracted mutation/confirmation implementation as the roster page. Backend `canManage`, ownership/contract versions, injury eligibility, buyout confirmation, illegal-roster confirmation and prospect confirmations are retained. Successful commands invalidate the league's query cache so cap, roster and trade displays refresh together. No action runs on page load.
- Actions remain visible at the right on desktops at least 1280px wide. Expanded statistics retain horizontal scrolling.
- Matchup submenu has a smaller season selector below week navigation, 16px spacing between cards and a 3px divider between teams. Each team has its matchup FP on the right. Official result totals take precedence over live scoring; unavailable scores are not displayed as zero. Individual failures offer Retry without hiding the other matchups.
- Dashboard and sidebar reuse existing league/season/week/matchup query keys. Scores require one read per displayed pairing and refresh every five minutes while displayed. No new API contract or scoring formula was added.

## Files changed (relative to the isolated worktree)

- `src/features/leagues/LeagueDashboard.jsx`, `LeagueDashboard.css`, `LeagueDashboardLoading.test.jsx`
- `src/components/DesktopSidebar.jsx`, `DesktopSidebar.css`
- `src/components/MatchupCard.jsx`, `MatchupCard.css`, `MatchupCard.test.jsx`
- `src/features/rosters/TeamRosterPage.jsx`, `RosterActions.jsx`, `useRosterActions.js`
- `src/test/desktopNavigationFixture.js`
- `e2e/desktop-navigation.spec.js`, `e2e/fixtures/desktop-navigation.jsx`
- This verification record.

## Verification

All test data and mutations were synthetic/local. Unit commands used `VITE_APP_ENV=local`, `VITE_API_ORIGIN=http://localhost:4000`, and `VITE_SOCKET_ORIGIN=http://localhost:4000` for this isolated checkout.

- `npm test -- src/features/leagues/LeagueDashboardLoading.test.jsx src/features/leagues/LeagueDashboard.test.jsx src/features/rosters/TeamRosterPage.test.jsx`: 46 passed.
- Final focused `npm test -- src/features/leagues/LeagueDashboardLoading.test.jsx src/components/MatchupCard.test.jsx`: 20 passed, including three additional score tests. Total distinct covered tests: 49.
- `npm run lint`: passed.
- `npm run build`: passed; existing large-chunk advisory remains.
- `git diff --check`: passed.
- With `HUNDO_NAVIGATION_PREVIEW_ORIGIN=http://127.0.0.1:5197`, `playwright test e2e/desktop-navigation.spec.js --project=desktop-chromium --project=mobile-chromium --project=desktop-webkit --project=mobile-webkit --grep 'dashboard|weekly matchups|season'`: all 10 applicable checks passed after a focused rerun corrected selector CSS specificity. Two desktop-only navigation cases are intentionally skipped on mobile.
- Additional Chromium `--grep 'isolates leagues'`: passed across two fixture leagues. Total applicable browser checks: 11.
- Dashboard geometry checked at 1024, 1440, 1920 and 2560px, plus mobile device widths; no page overflow. Pinned actions, ranking with a bench leader and IR runner-up, score placement, season-selector size/location, divider/card spacing, deep links, week/season changes and browser history verified.
- Inspected saved dashboard and submenu screenshots under `.hundo.local/layout-review/` in the isolated worktree.

Firefox and authenticated hosted acceptance were not run. This is local completion, not staging or production acceptance.

Local synthetic preview: `http://127.0.0.1:5197/e2e/fixtures/desktop-navigation.html?dashboard#/leagues/11111111-1111-4111-8111-000000000001`.

## Dashboard layout follow-up — 4 October 2026

Graem clarified that each dashboard matchup should retain the original side-by-side scoreboard presentation, with all matchup rows stacked vertically. Updated only `src/components/MatchupCard.jsx` and `src/components/MatchupCard.css`: dashboard cards now show coloured team panels, prominent orange totals, and a central status/VS column. The submenu keeps its two stacked team rows and right-aligned FP. Roster behavior and all data/query contracts are unchanged.

Verified with targeted ESLint, `npm run build`, `git diff --check`, and four passing desktop/mobile Chromium dashboard/submenu checks (`--grep 'dashboard|submenu browses'`). Visually inspected the regenerated 1920px dashboard screenshot; each pairing is side-by-side. Existing width checks also cover 1024, 1440, 1920 and 2560px and mobile, including large-score fit. WebKit was not rerun for this follow-up. Local preview remains on port 5197. No deployment or live data changes.
