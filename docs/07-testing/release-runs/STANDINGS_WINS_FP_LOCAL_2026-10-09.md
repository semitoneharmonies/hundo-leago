# Standings wins / total FP ranking — 9 October 2026

Local implementation only; no commit, push, deployment, live-data access, migration,
or stored standings rewrite. Prior player-card and matchup-row edits are preserved.

## Requested behavior

Official standings rank by total matchup wins descending, then total FP earned in
finalized matchups (PF) descending. Equal wins and equal PF share a competition
rank, with names used only for stable display order. Standings points, ties,
percentage, differential, and points against remain informational columns and do
not break ties. Live provisional scores and NHL season totals remain excluded.

## Files

Backend worktree: `E:/hundo-leago-backend/.hundo.local/matchup-row-readability-20261009`.

- `src/domain/matchups/matchupStandingsPolicy.js`: change shared ordering and rank
  equality criteria. Reads, correction previews, and recalculation callers share
  this policy; no duplicate frontend ranking formula.
- `test/foundation/standingsWinsRankingFoundation.test.js`: four business cases
  covering wins versus tie-derived PTS, PF versus differential, exact ties, signed FP.
- `test/foundation/matchupStandingsFoundation.test.js`: update expected official
  ranks and correction impacts for the new order.

Frontend worktree: `E:/hundo-leago/.hundo.local/player-card-branding-20261009`.

- `src/features/competition/CompetitionPages.jsx`: explain wins then total matchup PF.
- `src/components/LeagueRulesDropdown.jsx`: update the visible ranking rule.
- `src/features/competition/CompetitionPages.test.jsx`: updated wording expectations.
- `docs/03-product-specs/STANDINGS.md` and `docs/02-rules/SCORING_RULES.md`: record
  the user's amendment, replacing the previous PTS/DIFF/PF order.

## Verification

- `node --test test/foundation/standingsWinsRankingFoundation.test.js test/foundation/matchupStandingsFoundation.test.js`: 11 passed. Includes scoped final-result reads, zero writes on reads, current correction versions, zero-game teams, and correction preview ranks.
- `npx vitest run src/features/competition/CompetitionPages.test.jsx`: 25 passed.
- Focused ESLint: passed.
- `npm run build`: passed with the existing large-bundle warning.
- `git diff --check`: passed.

Backend test temporary storage remained on E:. Evidence logs are in
`E:/hundo-leago-backend/.hundo.local/matchup-row-test-temp/standings-results.txt`
and `E:/hundo-leago/.hundo.local/player-card-branding-references/standings-*.txt`.
Hosted acceptance is unverified; publication remains separate.
