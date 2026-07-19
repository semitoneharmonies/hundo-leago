# Hundo Leago — Standings

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 regular-season standings formulas, columns, sorting, permission, correction, and history rules;
* current standings behaviour that informs but does not control the target design;
* approved ranking, display, historical-season, incompleteness, rebuild, and notification workflows.

Grae approved the standings workflow and delegated the remaining notification-trigger decision on 2026-07-18.

---

## Product Purpose

Hundo Leago needs league- and season-scoped regular-season standings derived entirely from official matchup results.

This specification defines:

* authoritative standings inputs;
* row calculations and official ordering;
* tied-team rank presentation;
* current and historical season views;
* byes, missing results, inactive teams, and corrections;
* read-only access and commissioner rebuilds;
* interface, failure, and testing requirements.

Standings must never become a second source of truth that drifts from matchup results.

---

## Out of Scope

This document does not define:

* matchup scoring or result finalization;
* playoff qualification count, seeding, bracket, or tiebreak;
* playoff standings and bracket display;
* divisions or conferences;
* all-time franchise standings;
* exact database tables;
* exact API routes or payloads;
* public standings access;
* spreadsheet export.

---

# Part 1 — Product Authority

## Source Documents

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/MATCHUPS.md
```

Approved shared rules remain authoritative.

---

## Existing Behaviour Is Not the Target Model

The current backend provides read-only standings from finalized matchup results and calculates wins, losses, ties, standings points, percentage, fantasy points for, fantasy points against, and differential.

The current frontend supports column sorting and visual treatment for top rows, but some client sorting differs from the approved official order.

Current code remains implementation evidence. The backend response and official rank must use the approved scoring rules.

---

## Backend Authority and Isolation

The backend is authoritative for:

* league and season identity;
* official matchup-result versions;
* standings-rule version;
* calculated rows;
* official order and rank;
* incompleteness and correction state;
* historical season snapshots when persisted.

Results from different leagues or seasons must never be combined.

---

# Part 2 — Actors and Visibility

## Authenticated League Member

Every authenticated active league member may view:

* current regular-season standings;
* completed-season standings;
* official ranking and row calculations;
* last-updated and completeness status.

---

## Team Manager

Managers have read-only standings access.

They cannot edit rows, records, rank, points, or tiebreakers.

---

## Commissioner

A commissioner may:

* view standings health and source-result information;
* preview and run an explicit rebuild;
* correct source matchup results through the Matchups workflow;
* recover a failed derived-standings update.

A commissioner may not directly type replacement standings values into a row.

---

## Public Viewer

Standings are not public in the initial release.

---

# Part 3 — Authoritative Inputs

## Finalized Results Only

Standings use the latest approved version of each finalized regular-season matchup result.

They exclude:

* live provisional scores;
* future matchups;
* byes;
* unresolved cancelled or postponed matchups;
* playoff results;
* results from another league or season;
* direct frontend values.

---

## Result Set

The backend identifies the expected regular-season matchups from the persisted schedule and compares them with official final results.

The standings response preserves:

* league and season ID;
* standings-rule version;
* included result IDs and versions;
* expected and finalized matchup counts;
* weeks counted;
* generated or last-updated timestamp;
* completeness state.

---

# Part 4 — Approved Calculations

## Standings Points

| Result | Points |
| --- | ---: |
| Win | `2` |
| Tie | `1` |
| Loss | `0` |

```text
GP = W + L + T
PTS = W × 2 + T
PCT = PTS ÷ (GP × 2)
PF = sum of official team fantasy points
PA = sum of official opponent fantasy points
DIFF = PF − PA
```

When `GP = 0`, `PCT` is zero.

---

## Required Columns

Approved statistical columns are:

```text
GP  W  L  T  PTS  PCT  PF  PA  DIFF
```

The interface also includes:

```text
RANK  TEAM
```

GP, W, L, T, and PTS are whole numbers.

PCT, PF, PA, and DIFF display to the nearest hundredth.

---

# Part 5 — Official Order and Rank

## Approved Competitive Order

1. standings points, descending;
2. fantasy-point differential, descending;
3. fantasy points for, descending.

Teams still equal remain competitively tied. Team name ascending is only a deterministic display fallback.

PCT, wins, head-to-head results, and points against are not additional competitive tiebreakers.

---

## Competition Ranking

Competitively tied teams display the same rank using competition ranking:

```text
1, 2, 2, 4
```

The next rank skips the number of tied positions.

Team-name fallback orders equal rows visually without assigning different official ranks.

---

## Visual Rank Treatment

Gold, silver, and bronze treatment corresponds to official ranks 1, 2, and 3.

Every team sharing one of those official ranks receives the same treatment.

If a tie causes a rank to be skipped, the skipped rank receives no medal treatment.

---

# Part 6 — Teams, Byes, and Incomplete Seasons

## Season Participants

Every team registered as a participant in the selected league season receives a standings row, including a team with `0 GP`.

A team renamed during the current season displays its current name while stable team identity remains unchanged.

A deactivated or removed team with season results remains in that season’s standings and historical records.

Completed seasons preserve the final team name, colours, and logo context stored for that season.

---

## Byes

A bye creates:

* no GP;
* no W, L, or T;
* no standings points;
* no PF or PA.

It does not create a zero-point matchup.

---

## Incomplete State

When an expected matchup lacks an approved final result:

* existing valid results remain included;
* the table is marked `Incomplete`;
* the missing week and matchup are identified;
* no invented result is added;
* season completion and playoff-seeding readiness remain blocked.

A cancelled matchup remains missing until it receives an approved permanent disposition.

---

# Part 7 — Current and Historical Views

## Default Season

The Standings page defaults to the active league season.

When no active season exists, it defaults to the most recently completed season.

---

## Season Selector

Authenticated league members may select any completed season for that league.

Historical standings use the scoring and standings rule versions applicable to that season.

Historical rows do not silently recalculate under a later rule version.

---

## Regular Season Only

The initial page contains one regular-season league table.

Playoff results, bracket state, and qualification cut lines are deferred to the Playoffs specification.

---

# Part 8 — Derived Response and Rebuild

## Initial Calculation Model

The initial release calculates the authoritative standings response on the backend from finalized result versions.

A normal standings read performs calculation only and creates no persistent write.

If a persisted cache is added later, it remains replaceable derived data and normal reads still do not repair or rebuild it.

---

## Completed-Season Snapshot

At regular-season completion, the backend may persist an immutable standings snapshot containing:

* league and season IDs;
* official result-version set;
* standings-rule version;
* every row and official rank;
* completeness status;
* finalization timestamp.

The snapshot remains rebuildable and may be replaced only by an explicit versioned rebuild after an approved result correction.

---

## Explicit Rebuild

A commissioner rebuild:

1. selects one league and season;
2. previews expected and included results;
3. reports missing, duplicate, or invalid results;
4. requires confirmation;
5. calculates every row and rank;
6. creates a new derived snapshot version when persistence is required;
7. preserves previous snapshot versions;
8. changes no matchup result.

No written reason is required.

---

# Part 9 — Result Corrections

## Latest Approved Version

When a matchup result is corrected, standings use the latest approved result version.

Earlier result versions remain in matchup correction history.

---

## Correction Propagation

For live/current standings calculated on read, the corrected result appears on the next successful read.

For a persisted completed-season snapshot, result correction and a new standings snapshot version complete through one explicit atomic correction workflow.

If rebuilding fails, the prior valid snapshot remains available with a stale/correction-pending label.

---

## No Direct Row Edits

Neither a manager nor commissioner may directly edit GP, W, L, T, PTS, PCT, PF, PA, DIFF, or rank.

An error must be corrected in the source result, schedule disposition, team-season participation record, or approved standings rule.

---

# Part 10 — Standings Interface

## Default Table

The default table shows:

* Rank;
* Team;
* GP;
* W;
* L;
* T;
* PTS;
* PCT;
* PF;
* PA;
* DIFF.

The official backend order is used on initial load.

---

## Percentage Display

PCT displays as a percentage with two decimals:

```text
0.75 → 75.00%
0 GP → 0.00%
```

---

## Manual Sorting

Users may temporarily sort the visible table by any statistical column.

Manual sorting:

* does not change official rank;
* does not save a new official order;
* provides a Reset to Official Order control;
* uses team name only as deterministic fallback.

---

## Status Context

The page shows:

* selected season;
* weeks counted;
* expected and finalized matchup counts;
* standings-rule version;
* generated or last-updated timestamp;
* `Current`, `Complete`, `Incomplete`, `Stale`, or `Correction Pending` status.

Missing and invalid source results link to the applicable matchup view for authorized users.

---

## Mobile Behaviour

The table remains one horizontally scrollable table on small screens.

Rank and Team remain the first two columns. Alternate compact views may be considered in future updates.

---

## Notifications

Standings notifications use in-app delivery only.

Standings notifications do not use email or push in the initial release.

All authenticated active league members receive an in-app notification when:

* the regular-season standings become officially complete; or
* an approved correction changes any official standings row or rank.

Only the commissioner receives an in-app notification when:

* standings become `Incomplete`, `Stale`, or `Correction Pending` because required source results are missing or invalid; or
* a standings rebuild or correction-propagation operation fails.

Routine weekly result processing, ordinary rank movement, viewing, sorting, refreshing, and a successful rebuild that changes no official value do not send standings notifications.

The notification links to the Standings page or the relevant authorized recovery context without exposing private technical data.

---

# Part 11 — Activity and Audit Boundary

Standings calculation, viewing, rebuilding, correction propagation, and season snapshots do not create League Activity entries.

Required evidence remains in:

* matchup result and correction records;
* standings snapshot versions;
* standings rebuild and operational records.

Normal reads remain read-only.

---

# Part 12 — Validation and Failure Behaviour

The backend must reject or report:

* cross-league or cross-season results;
* duplicate official results for one matchup;
* a result for teams outside the selected season;
* malformed result totals or outcomes;
* mismatched W/L/T outcomes;
* missing scoring- or standings-rule version;
* direct row-edit requests;
* unauthorized rebuilds;
* a rebuild that would silently omit invalid expected results.

A failure must not erase the last valid completed-season snapshot or change matchup results.

---

# Part 13 — Required Testing

Tests must cover:

* zero games played;
* win, loss, tie, and zero-versus-zero results;
* multiple weeks;
* byes;
* every formula and rounding boundary;
* every official tiebreak stage;
* fully tied teams and competition ranks;
* manual sorting without rank mutation;
* incomplete, cancelled, missing, duplicate, and corrected results;
* renamed, deactivated, and removed teams;
* current and historical seasons;
* rule-version isolation;
* explicit rebuild and failed rebuild;
* current derived response and completed-season snapshot;
* league and season isolation;
* authenticated and public visibility;
* proof that reads and rebuild previews do not write;
* proof that standings operations never enter League Activity;
* in-app notification when regular-season standings become officially complete;
* in-app notification after a correction changes an official row or rank;
* commissioner-only notification for incomplete, stale, correction-pending, and failed-rebuild states;
* absence of notification for routine processing, ordinary rank movement, views, sorting, refreshes, and unchanged successful rebuilds.

---

# Part 14 — Approval Checklist

## Inherited Approved Rules

- [x] Standings are league- and season-scoped.
- [x] Standings use finalized regular-season matchup results only.
- [x] The latest approved result version drives standings.
- [x] Live provisional scores and byes do not enter standings.
- [x] A win awards `2`, a tie `1`, and a loss `0` standings points.
- [x] `GP = W + L + T`.
- [x] `PTS = W × 2 + T`.
- [x] `PCT = PTS ÷ (GP × 2)` and is zero when GP is zero.
- [x] `DIFF = PF − PA`.
- [x] Approved statistical columns are GP, W, L, T, PTS, PCT, PF, PA, and DIFF.
- [x] Official order is PTS, DIFF, and PF, all descending.
- [x] Teams equal after PF remain competitively tied.
- [x] Team name is only a deterministic display fallback.
- [x] Standings are rebuildable from authoritative results.
- [x] Managers have read-only standings access.
- [x] Commissioners cannot directly edit standings rows.
- [x] Matchup and standings corrections do not enter League Activity.
- [x] Normal standings reads never write or repair state.

## Approved Standings Decisions

- [x] Every authenticated league member may view current and completed-season standings for that league.
- [x] Standings remain unavailable to unauthenticated public viewers.
- [x] The response identifies included result IDs and versions, expected and finalized matchup counts, weeks counted, rule version, timestamp, and completeness.
- [x] Rank and Team are included before the approved statistical columns.
- [x] GP, W, L, T, and PTS display as whole numbers.
- [x] PCT, PF, PA, and DIFF display to the nearest hundredth.
- [x] PCT, wins, head-to-head, and PA are not additional competitive tiebreakers.
- [x] Competitively tied teams receive the same competition rank using `1, 2, 2, 4`.
- [x] Team-name fallback never assigns different official ranks to competitively tied teams.
- [x] Gold, silver, and bronze treatment follows official ranks 1, 2, and 3.
- [x] Teams sharing a medal rank receive the same treatment, and skipped ranks receive none.
- [x] Every registered season participant receives a standings row, including teams with zero GP.
- [x] A current-season team rename updates its displayed name without changing stable identity.
- [x] A deactivated or removed team with season results remains in that season’s standings.
- [x] Completed seasons preserve their stored team name, colours, and logo context.
- [x] A bye creates no GP, result, standings points, PF, or PA.
- [x] When an expected result is missing, valid results remain included and the table is marked `Incomplete`.
- [x] An incomplete table identifies the missing week and matchup.
- [x] Missing expected results block season completion and playoff-seeding readiness.
- [x] A cancelled matchup remains missing until it receives an approved permanent disposition.
- [x] The page defaults to the active season or, if none exists, the most recently completed season.
- [x] Authenticated league members may select any completed season in that league.
- [x] Historical standings use that season’s scoring and standings rule versions.
- [x] Historical rows do not silently recalculate under later rules.
- [x] The initial Standings page contains regular-season standings only.
- [x] Playoff results, qualification cut lines, and bracket state are deferred to the Playoffs specification.
- [x] The initial backend calculates standings from finalized result versions on each read without persisting a write.
- [x] A future persisted cache remains replaceable derived data and is never repaired by a read.
- [x] Regular-season completion may persist an immutable, versioned standings snapshot.
- [x] A completed-season snapshot identifies its exact result-version set and standings-rule version.
- [x] A commissioner rebuild previews inputs and problems, requires confirmation, and changes no matchup result.
- [x] A rebuild creates a new snapshot version when persistence is required and preserves prior versions.
- [x] No written reason is required for a standings rebuild.
- [x] Current derived standings reflect an approved result correction on the next successful read.
- [x] Completed-season result correction and snapshot rebuilding use one explicit atomic workflow.
- [x] If rebuilding fails, the prior valid snapshot remains visible with a stale or correction-pending label.
- [x] Standings errors are corrected through source results, schedule disposition, season participation, or approved rules—not direct row edits.
- [x] The default table shows Rank, Team, GP, W, L, T, PTS, PCT, PF, PA, and DIFF.
- [x] PCT displays as a percentage with two decimals, including `0.00%` at zero GP.
- [x] Users may temporarily sort by any statistical column without changing official rank.
- [x] Manual sorting provides Reset to Official Order and is not persisted as official order.
- [x] The page shows season, weeks counted, matchup counts, rule version, timestamp, and status.
- [x] Standings statuses are `Current`, `Complete`, `Incomplete`, `Stale`, and `Correction Pending`.
- [x] Missing or invalid source results link to the relevant matchup for authorized users.
- [x] Mobile presentation uses one horizontally scrollable table with Rank and Team first.
- [x] Grae approves every substantive Standings workflow.
- [x] Standings notifications use in-app delivery only.
- [x] Standings notifications do not use email or push in the initial release.
- [x] Every active league member is notified when regular-season standings become officially complete.
- [x] Every active league member is notified when an approved correction changes an official standings row or rank.
- [x] Only the commissioner is notified when standings become `Incomplete`, `Stale`, or `Correction Pending` because source results are missing or invalid.
- [x] Only the commissioner is notified when a standings rebuild or correction-propagation operation fails.
- [x] Routine processing, ordinary rank movement, viewing, sorting, refreshing, and unchanged successful rebuilds send no standings notification.
- [x] Grae delegated and approved the low-noise notification trigger design.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The rule-approval phase is complete.

Implementation is complete only when authoritative-result, correction, rebuild, failure, league-isolation, season-history, and read-only-boundary tests pass.

---

# Related Documents

```text
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/07-testing/TESTING_STRATEGY.md
```
