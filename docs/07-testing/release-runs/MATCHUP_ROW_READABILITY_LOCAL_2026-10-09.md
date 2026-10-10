# Matchup row readability — local verification, 9 October 2026

Local implementation only. Nothing committed, pushed, or deployed. No live data
was accessed or modified. Player-card branding and Utah's Boston-style digits
remain in the frontend worktree from the preceding requests.

Frontend worktree: `E:/hundo-leago/.hundo.local/player-card-branding-20261009`.
Backend worktree: `E:/hundo-leago-backend/.hundo.local/matchup-row-readability-20261009`,
based on release `4fb1b30`.

## Changes

- `src/features/competition/CompetitionPages.jsx`: name/team/F-or-D identity,
  FP at each column's inside edge, measured sticky-header offset.
- `src/styles/theme-a.css`: shared roster position colour tokens, 6px outer bars,
  larger bold orange FP, stronger sticky headings with aligned stat columns.
- `src/features/competition/competitionContracts.js`: validate optional team metadata.
- `src/features/competition/sampleCompletedMatchup.js`: synthetic NHL team labels.
- `src/features/competition/CompetitionPages.test.jsx` and new
  `e2e/matchup-readability.spec.js` / `e2e/fixtures/matchup-readability.{html,jsx}`:
  focused page checks and a synthetic local preview.
- Backend `src/infrastructure/persistence/sqlite/SqliteMatchupScoringRepository.js`,
  `src/domain/matchups/matchupScoringPolicy.js`, and
  `src/domain/matchups/expandedMatchupScoringPolicy.js`: include current NHL team
  in the existing read response for both scoring formats, using the roster's
  source selection rule. No migration or additional player HTTP requests.
- Backend `test/foundation/matchupScoringFoundation.test.js`: verify team metadata
  on live/final rows, unknown/ended source handling, unchanged scores, zero writes.
- Product and API documentation updated in `MATCHUPS.md` and `API_CONTRACTS.md`.

NHL team labels are current catalogue metadata, including for old matchups;
locked positions, lineups, counting stats and historical FP remain authoritative.
Unknown NHL teams use a dash. Negative FP retains its minus sign and now uses the
requested orange colour. Mobile retains inline counting-stat labels rather than
displaying desktop column headings over wrapped stats.

## Verification

- `npx vitest run src/features/competition/CompetitionPages.test.jsx`: 25 passed.
- Focused ESLint and `git diff --check`: passed.
- `npm run build`: passed, with the existing large-bundle warning.
- Playwright: six applicable checks passed across desktop/mobile Chromium and
  WebKit; two desktop-only sticky-header cases skipped on mobile. Desktop recheck:
  four passed, including 1024px, 1100px and 1440px widths. No page errors or row/page
  overflow; opposing FP placement, header alignment and sticky offsets verified.
- Screenshots inspected for desktop and mobile; long names, three-digit FP,
  negative FP, and the forward/defence transition included in the synthetic data.
- Backend targeted `node --test --test-name-pattern='displays current NHL team'
  test/foundation/matchupScoringFoundation.test.js`: two passed. The expanded
  fixture initially lacked sealed category evidence; corrected before final pass.
- Broader `node --test test/foundation/matchupScoringFoundation.test.js
  test/foundation/expandedMatchupScoringFoundation.test.js`: all 51 pre-existing
  checks passed. This run started before the new fixture repair and reported
  52 passed / 1 failed; the sole failure was the new expanded fixture described
  above, which passed in the subsequent focused rerun. No implementation change
  was needed, and the entire suite was not repeated after the fixture-only repair.

Test temporary files and browser artifacts stayed on E:. Evidence logs:
`E:/hundo-leago/.hundo.local/player-card-branding-references/matchup-*.txt` and
`E:/hundo-leago-backend/.hundo.local/matchup-row-test-temp/`.

## Acceptance boundary

Preview: http://127.0.0.1:5189/e2e/fixtures/matchup-readability.html

Synthetic local browser evidence only. Authenticated hosted acceptance and Firefox
are unverified. Publication requires both frontend and backend changes for team
labels; an older backend still renders safely with a dash for unknown teams.
