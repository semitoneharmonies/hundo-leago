# Matchup games tallied and remaining: local verification

Graem requested small per-team game counts in the existing Scoring stat key bar. Local implementation is complete. This new feature has not been committed, pushed or deployed; production and signed-in hosted acceptance remain unverified.

## Implementation

- Each team displays separate `GP 12` and `GR 38` pills centered beneath its score, without repeating its name. The stat-key summary still expands the key. Below 680px of available bar width, the key label sits above the two aligned pill groups within the same bar.
- Counts are player-games for the locked matchup lineup. Two lineup players in one NHL game represent two potential player-games.
- Tallied is the sum of accepted `gamesPlayedDelta` from the existing canonical scoring service, including appearances earning zero or negative points. It is not inferred from an NHL game's final status.
- Remaining counts scheduled/in-progress games and completed games not yet accepted by Hundo. Accepted scratches/DNPs resolve without becoming played games. Late locks, sealed exclusions, matchup date boundaries and postponed/cancelled games are respected.
- Unknown schedule/team information preserves any verified tallied count and leaves remaining unknown. Missing scoring evidence fails closed. Final matchups use their official result source refresh and have zero remaining.
- New authenticated, league-scoped read-only GET: `/api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId/matchups/:matchupId/game-progress`. Responses use `Cache-Control: no-store`. No new tables, migrations, persisted writes or refresh commands.
- The public NHL schedule adapter/cache is shared with the roster schedule view. Frontend query keys isolate league/season/week/matchup/status/scoring refresh; live totals refresh every minute while observed. Only expanded NHL completed-game scoring is supported.

## Isolated source

- Frontend: `E:/hundo-leago/.hundo.local/matchup-game-progress-20261011/frontend`, based on `999fb0f7feb178cd800a3ffed4b171985ec585bf`.
- Backend: `E:/hundo-leago-backend/.hundo.local/matchup-game-progress-20261011/backend`, based on `1a6d0c4ece9ed34585a8846d78cceed815e9238f`.
- Existing unrelated root worktree changes were preserved.
- Backend changes: game-progress domain policy/service, runtime wiring, matchup router, focused policy/HTTP tests, canonical scoring integration test and endpoint-count contract.
- Frontend changes: game-progress query/component/styles/tests, optional ScoringStatGuide summary content, MatchupCard integration and synthetic browser fixture/tests.

## Combined release preparation (supersedes preview-only limitations below)

The matchup page now reads schedule details from its authenticated game-progress endpoint. Counts and details share the locked lineup, half-open matchup dates, late-lock start, sealed exclusions and accepted scoring evidence. GP=0 confirmed non-appearances are excluded; accepted appearances remain visible in today's game popup. Finished games awaiting accepted statistics remain in GR. Final matchup counts retain their original accepted scoring source and remain available if the public schedule fails. Details use the league timezone. The synthetic browser fixture now exercises the same connected component and response contract as the real matchup page.

This release also includes the approved fixed player-card pattern assignment across all 32 NHL teams, preserving dark backgrounds, existing colours, numeral assets and the Utah/Boston numeral fallback. Rejected team-colour backgrounds and experimental comparison pages are excluded.

Combined checks: 40 frontend component/query tests; 23 targeted backend tests; 24 desktop/mobile Chromium and WebKit feature checks; focused lint; production build; four browser startup checks of the exact production bundle; 72 publicly served build asset hashes; both Git diff checks. Firefox failed in the local browser harness before page creation and remains unverified. No signed-in hosted acceptance is claimed.

An encrypted production backup was verified and restored to a separate rehearsal database. Candidate service reads checked 12 matchup scopes and 24 team sides, including 1,130 schedule-detail entries, with scope/authorization checks and unchanged restored database bytes. Integrity was OK, foreign-key violations zero, schema 89, verification writes zero. Production publication is tracked separately in the private release receipts.

## Executed checks (earlier checkpoints)

Node 24.14.1; all temporary files stayed on E:.

1. `node --test test/foundation/matchupGameProgressFoundation.test.js test/foundation/rosterScheduleFoundation.test.js`: 13 passed.
2. `node --test --test-name-pattern="game progress uses" test/foundation/matchupScoringFoundation.test.js`: 1 passed. Uses actual SQLite scoring/read repositories and sealed accepted evidence; serialized database equality before/after live and final reads; wrong league/week rejected; unavailable provider and invalid evidence covered.
3. `node --test --test-name-pattern="exact target endpoint dispatch|constructs every repository" test/foundation/targetRuntimeFoundation.test.js`: 8 passed. 206 endpoint contracts and runtime composition without writes/listening.
4. `vitest run src/features/competition/MatchupGameProgress.test.jsx src/features/competition/CompetitionPages.test.jsx`: 30 passed.
5. Focused ESLint for every changed frontend JS/JSX file: passed.
6. `vite build`: passed; existing large-bundle advisory remains.
7. Playwright `matchup-game-progress.spec.js` and `matchup-readability.spec.js`, desktop/mobile Chromium and WebKit: 14 passed, 2 intentionally skipped desktop-only alignment cases on mobile. No page errors; compact bar, stat-key interaction, unavailable state, overflow and existing player/header readability checked. Desktop Chromium and mobile WebKit screenshots inspected.
8. `git diff --check` in both isolated worktrees: passed.

An initially broader scoring/runtime test run was stopped to restrict verification to relevant suites; it is not claimed as a full-suite pass. An inconsistent synthetic scoring fixture and authentication stub were corrected before the successful focused runs above. No live tests or live data writes occurred.

## Local preview

### Simplified interaction revision (current preview)

Per Graem's latest request, the GR panel now has only Player / GR / Opp. columns with one row per player, no explanatory text, and a small close control. Collected games are excluded from remaining counts; opponent abbreviations retain one entry per remaining player-game. Home/away panels open on their respective side.

Compact / Full stats is one sliding switch centered in the Scoring stat key row, including narrow layouts. Its keyboard and pointer events do not expand the scoring key. The green-dot header explanation is removed. Clicking a dot now opens a small portal popup at the click position, clamped inside the viewport, with no player-row height change. Escape, outside click, scrolling and resizing dismiss the popup. Finished games keep their green dot; their popup reads Stats collected or Stats pending. Upcoming/live popups retain only opponent, start time and live status as applicable.

The synthetic fixture now includes collected, awaiting-scoring, live and upcoming games on its fixed demonstration day. It still reconciles 38 home / 34 away remaining games after excluding collected games. Real backend schedule-detail integration remains unimplemented and is not implied by this design preview. No deployment occurred.

This revision changed ScoringStatGuide, MatchupCard, MatchupScheduleDetails, shared matchup progress styles, the synthetic fixture and browser tests; added MatchupTodayDot. Verification: 30 component/competition tests passed; 16 desktop/mobile Chromium/WebKit browser tests passed; focused lint, production build and diff check passed. Browser checks cover centered/same-row switch and team-aligned pills at 320–1280px, grouped GR totals, retained collected/pending dots, viewport-bounded overlays, unchanged player-row height/points and keyboard closing/focus. Desktop GR and mobile collected-status screenshots visually inspected. Historical revision descriptions below describe prior iterations, not the current layout.

### Three interaction previews

Graem requested local previews of all three suggested improvements. The synthetic fixture now opens in Compact mode; Compact/Full stats switches between GP+FP and the existing category rows. A green dot beside a player scheduled today provides opponent/start-time information through its hover title and a tap-to-expand row. Clicking a team's GR pill opens an inline panel grouped by day, with a separate finished/awaiting-scoring section. The panel switches teams, closes by button or Escape, and returns keyboard focus to its trigger; GR interaction does not toggle the scoring key.

The fixture supplies explicitly synthetic schedule details through the optional `scheduleDetails` prop. Its clock is frozen to October 11, 2026, in America/Vancouver for repeatable review, with 38 home and 34 away remaining player-games. These new schedule-detail interactions are not yet connected to the real backend; production integration and deployment are not claimed. Existing actual game-count calculation is unchanged. Without schedule details, production-shaped MatchupCard uses the existing full-stat default and does not invent markers or clickable breakdowns.

Changed files for this preview iteration: `CompetitionPages.jsx`, `MatchupGameProgress.jsx`, new `MatchupScheduleDetails.jsx`/`.css` and `matchupSchedulePresentation.js`, synthetic fixture and existing browser test. Verification: 30 component/competition tests passed, focused ESLint and Vite build passed, and 16 Chromium/WebKit desktop/mobile browser checks passed. Checks cover pill alignment, unavailable data, keyboard opening/closing and focus return, exact per-team breakdown counts, separate awaiting-scoring entries, compact/full-stat counts with unchanged FP, visible zero GP, and tap details. Desktop compact and mobile breakdown screenshots were inspected. Two initial browser assertions were corrected for heading whitespace and selecting the intended zero-GP player before the successful rerun. No backend changes, public source push, or deployment in this iteration.

### Requested pill alignment revision

Graem requested removal of repeated team names and replacement of the text counts with separate GP and GR pills. Updated `MatchupGameProgress.jsx`, `MatchupGameProgress.css` and their existing unit/browser tests. Counting logic and backend are unchanged. Team names remain in accessible labels; pill tooltips explain the terms. Loading uses ellipses and unavailable values use dashes.

Revision verification: 5 focused component/query tests passed; focused ESLint and `git diff --check` passed; 8 desktop/mobile Chromium and WebKit browser tests passed. Browser checks compare pill-group centers with the respective score-panel centers within 1px at widths 320, 390, 900, 1024 and 1280 as appropriate to each project, check no page overflow, and verify key expansion and unavailable states. Desktop Chromium and mobile WebKit screenshots visually inspected. This revision remains local and is served at the same preview URL.

`http://127.0.0.1:5207/e2e/fixtures/matchup-game-progress.html`

Synthetic teams, counts and statistics only. `?unavailable` demonstrates unavailable counts. Browser evidence: `E:/hundo-leago/.hundo.local/matchup-game-progress-20261011/browser-results/`. Firefox and authenticated hosted acceptance were not run.
