# Expanded scoring implementation and staging review

The approved formula and edge cases are in [Scoring Rules](../02-rules/SCORING_RULES.md).
The 19 September publication instruction is staging first, followed by Graem's
review and explicit production approval. The production target is before
29 September 2026.

## Data and API contract

Backend migration 57 adds immutable expanded totals and player-game categories
alongside existing statistical evidence. It preserves legacy totals, lineup
baselines, result history and all previous seasons. It permits signed result
and standings fantasy-point values.

An available expanded statistics object adds `scoringRuleVersion:
"expanded-2026-v1"` and `scoringStats`, containing all thirteen category counts.
Existing GP, G, A, points and fantasy-point fields remain. Fantasy points use
exact integer hundredths and can be negative. Player and roster statistics are
unavailable until complete expanded evidence exists; missing categories are
never fabricated as zero.

`scoringStats` keys: `evenStrengthGoals`, `powerPlayGoals`, `shortHandedGoals`,
`gameWinningGoals`, `primaryAssists`, `secondaryAssists`, `shotsOnGoal`, `hits`,
`blockedShots`, `takeaways`, `giveaways`, `penaltiesDrawn`, `penaltiesTaken`.

Matchup team and player scores identify the same rule version. Each player's
`scoringBreakdown` gives `key`, `count`, `weightHundredths` and
`pointsHundredths`. Scores use the player's locked F/D position, original
lineup, scoring window and late-lock exclusions. Roster totals use the roster
position; the global catalogue uses the provider's normalized position.

NHL summary, realtime, scoring-per-game, penalties and penalty-shot reports
must have consistent player/game coverage. Successful penalty shots use the
goal classification evidence to apply the approved even-strength goal value.
Incomplete or conflicting reports retain the last successful snapshot.

## Corrections and activation

`EXPANDED_SCORING_ENABLED=true` requires
`NHL_COMPLETED_STATISTICS_ENABLED=true`. The new rules apply only to NHL season
`20262027`. Historical season payloads retain their previous contract.

Completed-statistics jobs and the administrator refresh operation reconcile
regular-season results when matchup processing is enabled. Changed statistics
create a `provider_correction` result version with the reason
`Automatic NHL statistics correction`; prior versions and locked lineups remain.
Stat-only changes receive an updated breakdown even if FP is unchanged.
Repeated identical evidence does not create another result. Current standings
read the corrected result version. Finalized seeding requires the existing
playoff review controls and is logged for operator review.

The staging review release preserves its currently disabled matchup processing
setting because it contains unrelated older fixture locks and schedules. Any
later activation must be scoped and verified; deploying code alone is not job
activation evidence.

## Review and release gates

Verify all thirteen columns, F/D weights, negative scores, FP/FPG, missing data,
historical seasons, and desktop/mobile scrolling on Players, roster and
Matchups. Matchup tables keep player names and FP visible while scrolling.
League Rules includes the updated values and penalty explanations.

Require backend/frontend regression checks, browser review, a populated
schema-56-to-57 preservation rehearsal, an encrypted pre-migration backup and
clean restore verification, exact staging release identities, and hosted
acceptance. Keep all source and evidence separate from unrelated owner changes.
Production publication requires Graem's approval after staging review.
