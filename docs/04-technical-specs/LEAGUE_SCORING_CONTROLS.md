# League scoring controls

Local implementation for the approved commissioner/admin controls update.
Publication and authenticated staging acceptance remain separate.

## Rules and persistence

Migration 0078 adds immutable, league- and season-scoped `league_scoring_rules`.
Untouched leagues continue using `expanded-2026-v1`. Existing raw statistics,
scores, source snapshots and roster locks are unchanged by migration or editing.
The current expanded-statistics season is 20262027; earlier seasons retain their
original calculation. Next-season rule carry-forward needs the rollover review.

Each revision records all 13 category weights for forwards and defence, an
effective matchup-week sequence, actor, authority, reason, before-values and a
repeat-safe command hash. Weights are exact integer hundredths within +/-100000.
Zero and deductions are supported. The greatest applicable effective week wins;
the newest revision breaks ties. A previously scheduled later rule stays effective
at its own boundary, which the preview displays.

The editor defaults to the next available future week. Commissioners can choose
an unfinished current week; this recalculates its live points from that week's
original eligible games. Elapsed weeks, any week with a finalized matchup, and
final/cancelled weeks cannot receive retroactive rule edits. SQL guards also
preserve these boundaries. Completed results use explicit existing result correction.
An unscheduled league may set Week 1 without creating placeholder dates or jobs.

## HTTP and confirmation

Base: `/api/v1/leagues/:leagueId/scoring`.

- GET: current rules, editable weeks and commissioner history.
- GET `/rules`: member-visible category values and scheduled revisions.
- POST `/preview`: `{weights,effectiveWeekSequence,comparisonWeekId,reason}`.
- POST `/apply`: the same fields plus `confirmed:true`, `previewHash`, and an
  `Idempotency-Key` header.

Preview/apply require current commissioner/admin authority and CSRF protection.
GET and preview are read-only and all responses use private/no-store. Preview
binds league state, rule revisions, affected finality and any comparison statistics.
Apply rechecks the preview in the write transaction. An uncertain-response retry
uses the same key. Rule history, league version, general activity, member notices
and invalidation commit atomically. Private cards and auction bids are never read.

Comparison uses the original locked lineup, exclusions, game eligibility and
sealed statistics. Current and completed weeks can be compared without writes.
Unavailable evidence is shown as unavailable. The recorded result is displayed
separately from the recalculated comparison; preview does not rewrite results.

## Calculation and display

Matchup calculations select rules by the matchup's own season/week. Result and
provider-correction transactions compare the calculated rule version with current
storage before saving. Later provider corrections retain the original rule and
locked lineup; finalization prevents subsequent rule insertion for that period.

League player season totals, roster views and rankings use current league values.
Player sorting and cursor lookup apply weights in SQL before pagination. Global
catalogue totals retain the default scoring. Raw default totals remain stored.
Custom responses include `scoringWeights` and `scoringRuleVersion:league-scoring-ID`.
Frontend contracts verify exact weighted totals; stat guides and the league rules
menu show actual weights, including scheduled/historical week selection.

## Local evidence

All fixtures and tool output are on E: under commissioner-controls-20260929/tmp.
Focused policy, real authenticated HTTP and migration checks pass. The populated
77-to-78 upgrade retains every prior row and schema object. HTTP covers read-only
access, role/CSRF denial, rollback on late notification failure, repeated confirmation,
league ranking changes before pagination and unchanged global catalogue values.

Existing result finalization/correction/public roster checks pass. Expanded NHL
refresh tests cover custom league values, live and historical comparison, exact
rule-version checks, final-result protection and later provider corrections.
The release-QA fixture verifier explicitly supports schema78; its existing
workspace, cap, roster, identity and preservation checks pass.

Frontend controls, dashboard, competition, player catalogue, roster, notifications,
rules and top bar checks pass across focused runs. Desktop/mobile Chromium previews
pass and were visually inspected. The initial mobile table layout was corrected
to fit both value columns. Changed-file lint and Vite build pass; the existing
bundle-size warning remains. Logs: scoring-*.log; initial failures are retained
alongside corrected reruns. Final whole-package regression and staging handoff
remain pending.
