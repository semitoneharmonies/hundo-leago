# Dashboard current-week and team-status readiness — September 10, 2026

Read-only navigation through the authorized existing Google Chrome manager session found a setup-league dashboard indefinitely displaying “Loading the current matchup week…” when no current week was available. The session is usable for manager-facing checks; it does not provide platform-administrator acceptance.

## Correction

`src/features/leagues/LeagueDashboard.jsx` now includes the matchup detail query in its pending indicator only when that query is enabled. A disabled query remains pending in the query library even after the current-week request finishes. Previously, that disabled query masked both the empty state and the current-week error.

The existing “No current matchup week” and request-error messages now appear. An active pending lookup still shows loading. A league without a configured season still makes no competition requests. Matchup query keys, refresh intervals, request eligibility, response contracts and persisted data are unchanged.

The same setup dashboard also showed “Team status could not be loaded.” The signed-in team roster page loaded successfully with zero roster players and a complete $0/$100 cap. The dashboard was using the public roster endpoint, whose repository deliberately requires an active league and team. The dashboard now reuses the existing authenticated `teamWorkspaceQuery` used by the roster page and trade block. Its private league/team cache and response validation remain intact. A small display adapter preserves cap usage/limit/space, retained salary, buyouts, player identity, contract values and season statistics. Incomplete cap projections still show an error. The public endpoint and its eligibility rules are unchanged.

## Verification

- `LeagueDashboardLoading.test.jsx`: the valid before-fix harness reproduced three failures and one pass. With the fix, all four cases pass: null week, rejected lookup, a pending lookup resolving to null, and no configured season.
- The dashboard and league-page neighborhood passed 26/26 tests with explicit local public configuration. After correcting an unrelated empty auction response in the new fixture, its four tests passed again. Initial runs without public configuration are preserved and are not product regression evidence.
- Focused ESLint and `git diff --check` passed. The Vite build passed with the existing large-chunk advisory.
- Chrome local synthetic preview verified all four states and the pending-to-empty transition. The corrected empty state was visually inspected at the existing desktop viewport. This is local component verification, not hosted acceptance of the unpublished code or a responsive-size claim.
- The team-status regression initially reproduced three failures among ten tests. The final dashboard/league/roster neighborhood passes 49/49, including all eleven cases in `LeagueDashboardLoading.test.jsx`: setup and active-league totals, retained/buyout charges, player identity and statistics, failed/invalid/incomplete workspace reads, and no roster reads without a managed team or configured season. The final lint and build also pass.
- Three additional Chrome local scenarios pass: empty setup team ($0 used, $100 available, zero retained/buyout totals), populated active team ($7 used, $93 available, $1 retained and $1 buyouts with correct player values), and visible team-request failure. Browser inspection caught the initially omitted retained/buyout mappings; both are corrected and asserted in the final tests. The final setup-team screenshot was inspected. These are synthetic local checks, not staging acceptance of the new code.

Commands, from the isolated candidate, using Node 24 on E: and `VITE_APP_ENV=local`, `VITE_API_ORIGIN=http://localhost:4000`, `VITE_SOCKET_ORIGIN=http://localhost:4000`:

```text
node node_modules/vitest/vitest.mjs run src/features/leagues/LeagueDashboardLoading.test.jsx src/features/leagues/LeagueDashboard.test.jsx src/features/leagues/LeaguePages.test.jsx src/features/rosters/TeamRosterPage.test.jsx --configLoader native --no-file-parallelism
node node_modules/eslint/bin/eslint.js src/features/leagues/LeagueDashboard.jsx src/features/leagues/LeagueDashboardLoading.test.jsx
node node_modules/vite/bin/vite.js build --configLoader native
git diff --check
```

Evidence and the combined review package are in `E:/hundo-leago-backend/.hundo.local/frontend-readiness-20260910/`. The four-file statistics candidate remains preserved, and its unchanged contents are included in this combined candidate. No new commit, push, deployment, account operation, email, job activation or league-data change occurred.

## Remaining acceptance

After direct approval for the exact new frontend publication, verify the served staging assets and the setup dashboard's empty-week and team-status views. The team-status correction is locally complete and awaits this hosted acceptance. The available Chrome manager session had no pending proposal for its managed receiving teams, so recipient-side trade acceptance remains unverified. Statistics activation, administrator workflows and production remain separate boundaries.
