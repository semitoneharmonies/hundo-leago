# Hundo Leago — Standings

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 regular-season standings formulas, columns, sorting, permission, correction, and history rules;
* current standings behaviour that informs but does not control the target design;
* approved ranking, display, historical-season, incompleteness, rebuild, and notification workflows.

Grae approved the standings workflow and delegated the remaining notification-trigger decision on 2026-07-18.

The explicit official-finalization and correction-coupling amendment was
approved on 2026-07-29. It closes the season-rollover gap by requiring one
canonical final standings snapshot with exact source-result provenance before
the scheduled Entry Draft-start rollover can run. Competition-season end does
not itself run that rollover.

On 2026-08-20, Grae approved contextual result correction on the Standings
page. A commissioner selects a recognizable week/matchup identified by team
names, previews the corrected result and projected standings impact, and then
confirms once. Confirmation stores the corrected official result and its
recalculated current standings atomically; partial correction without the
corresponding standings state is forbidden. The normal interface has no
separate standings-rebuild step after a result correction. The explicit
backend rebuild remains an exceptional recovery capability for independently
detected derived-state failure and is not removed by this presentation change.

---

## Product Purpose

Hundo Leago needs league- and season-scoped regular-season standings derived entirely from official matchup results.

This specification defines:

* authoritative standings inputs;
* row calculations and official ordering;
* tied-team rank presentation;
* current and historical season views;
* byes, missing results, inactive teams, and corrections;
* read-only access, explicit finalization, and commissioner rebuilds;
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
* explicitly finalize complete regular-season standings;
* preview a contextual matchup-result correction beside the affected standings,
  including current and projected rows, then apply the confirmed correction;
* preview and run an explicit rebuild only as an exceptional recovery action
  outside the normal standings UI;
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
* a canonical hash of the exact included result-version set;
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
* official standings finalization, the scheduled Entry Draft-start rollover,
  and playoff-seeding readiness remain blocked.

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

## Official Final Standings Snapshot

At regular-season completion, the backend must persist an immutable canonical
standings snapshot containing:

* league and season IDs;
* official result-version set;
* the canonical result-set hash;
* standings-rule version;
* every row and official rank;
* expected and included result counts;
* participant count;
* `Complete` status;
* finalization timestamp.

The snapshot content and its exact result-version links never change. A newer
canonical final snapshot may replace it only through the approved atomic
matchup-result correction workflow. The prior snapshot remains preserved as
historical evidence.

A snapshot produced by legacy calculation or rebuild behaviour does not
qualify as the canonical final snapshot unless it carries all required
provenance and explicit finalization evidence. The system does not infer or
backfill missing provenance from a legacy row.

---

## Explicit Official Finalization

Official finalization is a separate confirmed action by the current
commissioner or an inherited platform administrator with active league
membership. It is not a side effect of:

* viewing standings;
* weekly matchup rollover;
* a standings rebuild;
* competition-season completion or the scheduled Entry Draft-start rollover;
* application startup, migration, or repair.

The action:

1. verifies that every persisted regular-season week has reached its required
   terminal state;
2. verifies that every expected non-bye matchup has exactly one current
   official or corrected result version;
3. rejects missing, duplicate, void, pending, cross-league, cross-season, or
   internally inconsistent results;
4. binds the request to the current canonical result-set hash;
5. calculates every participant row and official rank under the season's
   standings-rule version;
6. atomically stores the immutable final snapshot, its exact result-version
   provenance, operation and audit evidence, member notifications, and
   post-commit invalidation work;
7. returns the same durable result for an exact retry.

Every active league member receives the one approved in-app completion
notification from this transaction. No email or push notification is sent.
The scheduled Entry Draft-start rollover remains blocked until this
finalization exists and still matches every current official result version.

---

## Recovery-Only Explicit Rebuild

A full commissioner rebuild is an exceptional recovery operation and is absent
from the normal Standings UI. When recovery is required, it:

1. selects one league and season;
2. previews expected and included results;
3. reports missing, duplicate, or invalid results;
4. requires confirmation;
5. calculates every row and rank;
6. creates a new derived snapshot version when persistence is required;
7. preserves previous snapshot versions;
8. changes no matchup result.

No written reason is required.

A rebuild may create or replace non-final derived standings. It does not create
the canonical official-final snapshot and cannot replace one after
finalization. Final-snapshot replacement belongs only to the coupled result
correction workflow.

---

# Part 9 — Result Corrections

## Latest Approved Version

When a matchup result is corrected, standings use the latest approved result
version. The normal correction surface is presented beside the affected
Standings result context rather than as a generic rebuild panel.

Earlier result versions remain in matchup correction history.

---

## Correction Propagation

The read-only correction preview accepts proposed home and away scores plus an
optional reason and returns the week and matchup/team identities, proposed
result version and outcome, current rows, projected rows, and changed team IDs.
It changes no state.

Before official finalization, applying the confirmed correction atomically
commits the new authoritative result version, any required current derived-state
update or invalidation, correction evidence, and post-commit publication work.
For standings calculated on read, the corrected result appears on the next
successful read; there is no interval in which a committed result is paired
with a knowingly authoritative stale current table.

After official finalization, result correction and a replacement canonical
final standings snapshot complete through one explicit atomic correction
workflow. The result correction may not commit unless the replacement snapshot,
its complete result-version provenance, operation and audit evidence, required
member notification, and post-commit invalidation work also commit.

Even when corrected totals leave every displayed row and rank unchanged, the
workflow still creates a new immutable snapshot because the official
result-version set changed. A member notification is created only when an
official row or rank changed.

Before official finalization, if an explicitly requested non-final derived
rebuild fails, the prior valid derived snapshot remains available with a
stale/correction-pending label.

If replacement-snapshot calculation or persistence fails, the corrected result
version also rolls back. The previous result version and canonical final
snapshot remain authoritative.

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
* canonical result-set hash for a complete or finalized result set;
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

All authenticated active league members receive a deduplicated in-app
notification atomically with the authoritative write when:

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
* immutable standings snapshot versions and their exact result-version links;
* standings finalization, rebuild, and operational records;
* Security Audit, notification, idempotency, and scoped outbox records where
  the operation requires them.

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
* a finalization before all regular-season weeks and results are terminal;
* a finalization request whose result-set hash no longer matches;
* a second fresh finalization when one canonical final snapshot already exists;
* a legacy snapshot that lacks exact result-version provenance or explicit
  finalization evidence;
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
* current derived response and explicit official finalization;
* exact result-set hashing and immutable snapshot-to-result-version
  provenance;
* exact finalization replay, changed-payload idempotency conflict, stale
  season version, and simultaneous finalization;
* missing, duplicate, void, pending, corrected, cross-league, and cross-season
  result rejection at finalization;
* legacy snapshots never satisfying official-finalization readiness;
* the scheduled Entry Draft-start rollover refusing missing, stale, legacy, or
  ambiguous final standings evidence;
* post-finalization result correction and replacement snapshot committing
  atomically, including rollback at every late write seam;
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
- [x] Regular-season completion requires one explicitly finalized immutable,
  versioned canonical standings snapshot before the scheduled Entry
  Draft-start rollover.
- [x] A completed-season snapshot identifies its exact result-version set and standings-rule version.
- [x] The canonical snapshot also preserves the canonical result-set hash,
  expected and included counts, participant count, and finalization evidence.
- [x] A legacy snapshot without complete provenance and explicit finalization
  evidence does not satisfy the finalization or rollover prerequisite.
- [x] The normal commissioner surface previews contextual matchup-result correction with current/projected rows and applies the confirmed result correction atomically.
- [x] Full standings rebuild is an exceptional recovery action absent from the normal UI; it previews inputs and problems, requires confirmation, and changes no matchup result.
- [x] A recovery rebuild creates a new snapshot version when persistence is required and preserves prior versions.
- [x] A recovery standings rebuild never creates or replaces the canonical final
  snapshot.
- [x] No written reason is required for a recovery standings rebuild; contextual result correction may include an optional reason.
- [x] Current derived standings reflect an approved result correction on the next successful read.
- [x] Completed-season result correction and snapshot rebuilding use one explicit atomic workflow.
- [x] After finalization, a corrected result cannot commit without the complete
  replacement canonical snapshot and provenance committing in the same
  transaction.
- [x] If a non-final derived rebuild fails, the prior valid derived snapshot remains visible with a stale or correction-pending label.
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
