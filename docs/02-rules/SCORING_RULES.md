# Hundo Leago — Scoring Rules

## Document Status

`APPROVED`

Grae approved the Season 2 scoring-rule baseline recorded in this document on 2026-07-18.

This document records:

* scoring boundaries already approved in `LEAGUE_RULES.md`;
* current frontend and backend behaviour observed on 2026-07-18;
* approved Season 2 fantasy-point, matchup-result, and standings rules;
* implementation details deliberately assigned to more specific product and technical specifications.

Existing code is evidence of current behaviour. It is not automatically proof that a scoring rule is approved for Season 2.

The completed approval checklist near the end of this document records the confirmed decisions.

---

## Document Purpose

This document defines league-wide scoring rules shared by:

* player statistics;
* fantasy-point calculation;
* matchup-week scoring;
* roster locks and scoring eligibility;
* result finalization;
* regular-season standings;
* commissioner scoring corrections;
* future playoff scoring.

It is intended to prevent the statistics, matchup, standings, frontend, and backend systems from implementing different versions of the same calculation.

This document defines:

* approved scoring eligibility boundaries;
* approved fantasy-point values;
* approved matchup scoring and precision;
* approved regular-season result rules;
* approved standings points and sorting;
* correction and audit requirements;
* failure behaviour;
* decisions that belong in more specific product and technical specifications.

This document does not define:

* roster construction or salary-cap rules;
* complete matchup-page workflows;
* complete commissioner permissions;
* API response shapes;
* database tables;
* statistics-provider implementation;
* deployment schedules;
* playoff qualification, seeding, bracket pairing, and winner-producing tiebreakers.

Those subjects belong in League Rules, Permissions, product specifications, technical specifications, and work plans.

---

# Part 1 — Rule Authority

## Relationship to League Rules

`docs/02-rules/LEAGUE_RULES.md` is authoritative for:

* roster categories;
* active-roster position limits;
* roster legality;
* temporary illegality;
* the weekly roster-lock time;
* which roster categories may collect matchup points;
* the original league timezone.

This document must not redefine those rules.

If this document and League Rules conflict, League Rules control until the contradiction is deliberately resolved and both documents are reconciled.

---

## Backend Authority

The backend is authoritative for:

* scoring configuration;
* player-stat inputs used for scoring;
* fantasy-point calculations;
* matchup-week identity and boundaries;
* team scoring eligibility;
* locked-roster snapshots;
* scoring baselines;
* live matchup totals;
* finalized matchup results;
* standings calculations;
* commissioner corrections;
* persisted matchup results and correction records.

The frontend may display calculations and provide explanatory previews, but it must not maintain a competing authoritative scoring formula.

Any frontend fantasy-point calculation must use backend-provided values or one shared, versioned scoring configuration that cannot drift from backend behaviour.

---

## League and Season Isolation

Every scoring configuration, matchup week, baseline, locked roster, result, correction, and standings row must belong to:

* one league;
* one league season.

The system must not:

* combine results from different leagues;
* combine results from different seasons;
* reuse one league’s baseline for another league;
* infer season identity only from a calendar date;
* silently fall back to the original Hundo Leago league;
* calculate current standings from stale results belonging to another season.

When league or season context is missing or ambiguous, the calculation must fail clearly without changing state.

---

## Scoring-Rule Changes

A material scoring-rule change requires:

1. Grae’s approval.
2. An update to this document.
3. A clear effective league and season.
4. Identification of affected statistics, matchups, results, and standings.
5. A decision on whether historical results remain under the old rule version.
6. A migration or recalculation plan when stored records are affected.
7. Focused verification.
8. A project decision record when appropriate.

A scoring change must not silently recalculate completed historical matchups.

Every finalized result must be traceable to the scoring-rule version used to create it.

---

# Part 2 — Approved Scoring Boundaries

## Approved Values

The following boundaries were approved through League Rules on 2026-07-18.

| Rule | Season 2 baseline | Status |
| --- | ---: | --- |
| Weekly roster lock | `Monday at 4:00 PM Pacific` | Approved |
| League timezone | `America/Vancouver` | Approved |
| Active-roster players may collect matchup points | `Yes` | Approved |
| Benched players collect matchup points | `No` | Approved |
| Injured-reserve players collect matchup points | `No` | Approved |
| Prospects collect matchup points | `No` | Approved |
| Team illegal at normal lock collects points before a late legal lock | `No` | Approved |
| Points earned before late legality are recovered | `No` | Approved |
| Locked roster is a persisted snapshot | `Yes` | Approved |
| Post-lock roster changes affect the current matchup | `No` | Approved |
| Post-lock normal-roster illegality interrupts locked-player scoring | `No` | Approved |

These rules are final unless Grae deliberately changes League Rules.

---

## Active Scoring Roster

Only players in the team’s approved scoring-eligible active-roster snapshot may contribute matchup points.

The active scoring roster may include:

* forwards;
* defence players.

It may not include:

* benched or inactive players;
* injured-reserve players;
* prospects;
* goalies;
* unowned players;
* players belonging to another league;
* players without a stable player ID;
* players not included in the persisted scoring-eligible roster for that period.

An empty active slot contributes zero points and does not make the roster illegal by itself.

---

## Locked-Roster Snapshot

The scoring-eligible roster must be persisted.

It must not be reconstructed later from the team’s current roster.

At minimum, the persisted snapshot must preserve:

* league ID;
* season ID;
* week ID;
* team ID;
* player IDs;
* each player’s scoring position group;
* the effective eligibility time;
* the lock or segment-creation time;
* the roster-legality result used;
* the scoring-rule version.

A normal roster transaction after a lock must not silently rewrite the already persisted scoring roster.

The Matchups product specification must define which roster changes affect the current week and which take effect in the next scoring period.

---

## Illegal-Roster Scoring

Roster legality affects matchup scoring when the scoring-eligible roster snapshot is created.

If a team is illegal at the normal Monday `4:00 PM Pacific` roster lock:

1. No normal scoring-eligible roster snapshot is created.
2. The team does not collect matchup points while it remains without a legal scoring snapshot.
3. The team may complete approved roster adjustments.
4. When the roster becomes legal, the backend persists a team-specific scoring roster, eligibility time, and baseline.
5. Only fantasy points earned after that team-specific baseline count.
6. Earlier points are not recovered.

Once a legal scoring-eligible roster snapshot exists, later normal-roster changes do not affect the current matchup. The normal roster may become illegal after lock without interrupting fantasy-point earnings by the players in the persisted scoring snapshot.

---

# Part 3 — Current Implementation Evidence

## Observed Fantasy-Point Formula

The current frontend and backend calculate:

```text
fantasy points = goals × 1.25 + assists × 1.00
```

Current code assigns:

| Statistic | Current value | Approval status |
| --- | ---: | --- |
| Goal | `1.25 FP` | Approved 2026-07-18 |
| Assist | `1.00 FP` | Approved 2026-07-18 |
| All other skater statistics | `0 FP` | Approved 2026-07-18 |

The code currently calculates the same values for forwards and defence players.

This formula is approved for Season 2.

---

## Observed Weekly Calculation

The current matchup engine stores cumulative player-stat baselines and calculates:

```text
player weekly FP = current cumulative FP − baseline cumulative FP
team weekly FP = sum of eligible player weekly FP
```

Current code:

* uses goals and assists from the statistics cache;
* clamps a negative player delta to zero;
* rounds the team total to the nearest hundredth;
* assigns zero to a team that has no current lock;
* finalizes a week only after the stored week-end time;
* refuses to overwrite an already stored weekly result.

The listed behaviour matches the approved rules except that a negative player delta may not be silently clamped. It must follow the approved source-correction boundary in this document.

---

## Observed Standings Calculation

The current backend awards:

```text
Win:  2 standings points
Tie:  1 standings point
Loss: 0 standings points
```

The current backend sorts regular-season standings by:

1. standings points, descending;
2. fantasy-point differential, descending;
3. fantasy points for, descending;
4. team name, ascending.

The current frontend calculates standings percentage as:

```text
standings percentage = standings points ÷ (games played × 2)
```

These standings calculations are approved for Season 2.

---

## Known Current Gaps

The current implementation does not yet fully satisfy the approved League Rules because it:

* scores the team’s current roster rather than a complete persisted player-ID roster snapshot in every scoring path;
* does not implement team-specific baselines for a team that becomes legal late;
* treats an unlocked team as zero without preserving the complete reason;
* relies on team names in parts of matchup and standings state;
* does not consistently persist a scoring-rule version;
* does not provide a fully specified correction workflow;
* has not completed a full production season as the sole scoring system;
* still requires repeatable accelerated matchup tests.

This document must guide correction of those gaps after the scoring decisions are approved. It must not be rewritten merely to legitimize the existing shortcuts.

---

# Part 4 — Player Scoring

## Season 2 Formula

The approved original-league formula is:

```text
player FP = goals × 1.25 + assists × 1.00
```

Under this rule:

* a goal is worth `1.25 FP`;
* an assist is worth `1.00 FP`;
* goals and assists are the only scoring categories;
* forwards and defence players use the same values;
* games played does not directly award fantasy points;
* no goalie statistics are supported.

Examples:

```text
0 goals, 0 assists = 0.00 FP
1 goal, 0 assists  = 1.25 FP
0 goals, 1 assist  = 1.00 FP
2 goals, 3 assists = 5.50 FP
```

This formula is approved for the original league’s Season 2 baseline.

---

## Fantasy Points Per Game

Fantasy points per game is an approved display statistic:

```text
FPG = cumulative fantasy points ÷ games played
```

When games played is zero:

```text
FPG = 0
```

FPG does not directly affect matchup results or standings.

FPG is displayed to the nearest hundredth.

---

## Position Treatment

The approved scoring values are identical for:

* forwards;
* defence players.

Position affects roster eligibility, but it does not multiply or otherwise modify fantasy points.

NHL positions must first be normalized through the approved League Rules:

```text
C, LW, RW → F
LD, RD → D
```

Scoring code must not create a separate position classification.

---

## Statistics Source and Identity

Scoring must use a league-approved statistics source and stable NHL player IDs.

Player names must not be the sole join key.

Each scored statistic record must be traceable to:

* player ID;
* NHL season;
* source update time;
* the cumulative goals and assists used;
* the derived fantasy-point value.

The technical specifications must define:

* the statistics provider;
* refresh scheduling;
* retry behaviour;
* cache format;
* source timestamps;
* correction detection;
* missing-player handling;
* source-season validation.

---

## Numeric Precision

The approved precision rules are:

* calculate player fantasy points from exact stored category totals;
* do not round each category before applying its scoring value;
* calculate baseline deltas using the same formula and scoring-rule version;
* round displayed player and team totals to the nearest hundredth;
* persist enough information to reproduce the unrounded calculation;
* use one decimal implementation across backend jobs and read-only previews.

The backend, frontend, finalization job, and standings rebuild must not use different rounding methods.

---

## Source Corrections and Negative Deltas

Statistics providers may correct previously reported goals or assists.

The current implementation clamps a negative player baseline delta to zero. That approach is not approved because it can hide a legitimate source correction.

The approved boundary is:

* a negative delta must be identified as a possible source correction;
* the system must report the affected player, baseline, current statistics, and source timestamps;
* finalization is blocked until the discrepancy is reconciled through the approved correction workflow;
* an ordinary scheduled job must not silently clamp, discard, or overwrite the discrepancy;
* a correction discovered after finalization creates a new result version or explicit correction record;
* the latest approved result version drives rebuilt standings;
* every prior result version remains preserved.

The Matchups product specification, Permissions, and the applicable technical specifications must define the authorized review workflow and exact data-reconciliation operation.

---

# Part 5 — Matchup Week and Baselines

## Matchup-Week Record

Every matchup week must be a persisted, league-specific and season-specific record.

At minimum, it must identify:

* week ID;
* week number or display label;
* league ID;
* season ID;
* start time;
* normal baseline time;
* roster-lock time;
* end time;
* rollover time;
* team pairings;
* status;
* scoring-rule version.

The week ID must remain stable even if a commissioner corrects one of its timestamps.

---

## Approved Week Boundaries

The approved original-league schedule is:

```text
Week start:      Monday at 12:00 AM Pacific
Normal baseline: Monday at 1:00 AM Pacific
Roster lock:     Monday at 4:00 PM Pacific
Week end:        Sunday at 11:59 PM Pacific
Rollover:        Monday at 12:00 AM Pacific
Timezone:        America/Vancouver
```

The scoring window begins at Monday `12:00 AM Pacific`, inclusive, and ends at the following Monday `12:00 AM Pacific`, exclusive. The user-facing week-end label is Sunday at `11:59 PM Pacific`.

Rollover occurs at the exclusive end boundary. This creates no unscored or double-scored interval between adjacent weeks.

---

## Normal Baseline

The normal baseline is a persisted snapshot of cumulative scoring statistics.

It must:

* belong to one league season and matchup week;
* use the approved scoring-rule version;
* identify its source-statistics update time;
* preserve the player IDs and cumulative category totals used;
* be idempotent;
* never be silently overwritten by a repeated scheduled job;
* remain available for audit and result rebuilding.

A read-only matchup or standings request must not create or replace a baseline.

---

## Baseline and Lock Relationship

The normal baseline occurs Monday at `1:00 AM Pacific`, before the roster lock.

A legal team’s players ultimately locked Monday at `4:00 PM Pacific` receive eligible points earned after the earlier Monday baseline.

Live preview and finalization must use this same relationship.

---

## Late-Legal Team Baseline

League Rules already require a new team-specific baseline when an illegal team becomes legal after the normal baseline.

The team-specific baseline must:

* be captured at or after the legality-restoration event;
* include only the newly eligible roster snapshot;
* preserve the legality result;
* prevent recovery of points earned before legality;
* be idempotent;
* be included in the persisted matchup-week baseline records.

The product and technical specifications must define how concurrent transactions, statistics refreshes, and scheduled scoring jobs are ordered at the effective timestamp.

---

## Post-Lock Roster Adjustments

Once a team has a legal scoring-eligible roster snapshot for the matchup week:

1. The snapshot remains the current matchup roster.
2. Later normal-roster adjustments do not add or remove players from that snapshot.
3. A later illegal normal roster does not pause or reduce current-matchup scoring.
4. Players in the locked snapshot continue earning fantasy points for the current matchup.
5. The adjusted normal roster is evaluated for the next matchup lock.

Only an explicit authorized matchup correction may change a persisted current-week scoring roster. Ordinary roster transactions must not do so.

---

# Part 6 — Live Scoring and Finalization

## Live Matchup Totals

Live team fantasy points must be calculated from:

* the persisted scoring-eligible player IDs;
* the team’s applicable normal or late-lock baseline;
* the approved scoring formula;
* the latest valid statistics cache.

Conceptually:

```text
player weekly FP = current cumulative FP − applicable baseline FP
team weekly FP = sum of eligible locked-player weekly FP
```

The calculation must not:

* use the team’s current roster as a substitute for the locked snapshot;
* add benched, injured-reserve, or prospect players;
* recover points earned before a late legal lock;
* use statistics from another NHL season;
* use a different formula from finalization.

Live totals are provisional until the matchup is finalized.

---

## Missing or Stale Statistics

The system must distinguish:

* a player who earned zero points;
* a player missing from the statistics cache;
* a cache that has not refreshed;
* a failed statistics refresh;
* a source correction;
* a missing player ID;
* a missing baseline.

These conditions must not all appear as an unexplained zero.

Live scoring may continue from the last valid cache during a temporary refresh failure, but the interface must identify that the displayed total is stale.

Finalization is blocked when:

* required statistics are missing;
* a required player or player ID cannot be resolved;
* the cache is older than the configured freshness limit;
* an unresolved source correction affects the result.

The exact freshness duration is a league setting or technical constant that must be defined in the Matchups product specification and applicable technical specification before implementation. Missing data must be reported and must not appear as an ordinary zero-point performance.

After the source returns, an explicit retry or recovery operation may complete finalization from valid authoritative data.

The last valid statistics cache must not be erased because a refresh fails.

---

## Result Finalization

A finalized matchup result must be based on:

* the persisted matchup week;
* the persisted pair;
* each team’s persisted scoring-eligible roster and applicable baseline;
* the approved scoring rule;
* a valid statistics snapshot;
* the approved end-of-week boundary.

At minimum, a finalized result must preserve:

* result ID;
* league ID;
* season ID;
* week ID;
* both team IDs;
* each team’s final fantasy points;
* win, loss, or tie outcome;
* finalization time;
* statistics-source time;
* scoring-rule version;
* correction version or status.

Finalization must be idempotent.

A repeated scheduled job must not:

* create duplicate results;
* add standings values twice;
* advance more than one week;
* silently replace a previously finalized result.

---

## Regular-Season Outcome

The approved result rule is:

```text
Higher final team FP = win
Lower final team FP  = loss
Equal final team FP  = tie
```

Equality is determined from the final authoritative team totals rounded to the nearest hundredth.

There is no regular-season overtime or additional matchup tiebreaker.

---

## Zero-Point Matchups

Under the approved result rule:

* `0.00` versus a positive total is a loss for the zero-point team;
* `0.00` versus `0.00` is a tie.

This also applies when a team never obtains a valid scoring lock during the week. That team receives an ordinary zero-point result rather than a separate forfeit.

---

## Rollover

Rollover must occur only after the current week is eligible for finalization.

It may:

1. verify the final statistics snapshot;
2. finalize missing results;
3. record completion;
4. advance the current week;
5. prepare the next week;
6. preserve the old week’s baseline, locks, and results.

Rollover must not erase the evidence needed to rebuild standings.

The approved rollover time is Monday at `12:00 AM Pacific`.

---

# Part 7 — Regular-Season Standings

## Authoritative Inputs

Regular-season standings must be calculated from finalized matchup results.

They must not be calculated from:

* live provisional matchup totals;
* the current roster;
* manually entered frontend values;
* a mutable standings table with no finalized result records;
* results from another league or season.

Standings must be safely rebuildable from authoritative finalized results.

Normal manager access is read-only.

---

## Standings Points

The approved standings-points system is:

| Result | Standings points |
| --- | ---: |
| Win | `2` |
| Tie | `1` |
| Loss | `0` |

Conceptually:

```text
PTS = wins × 2 + ties
```

This matches current behaviour.

---

## Standings Columns

The approved regular-season standings record includes:

| Column | Meaning |
| --- | --- |
| `GP` | Finalized matchups played |
| `W` | Wins |
| `L` | Losses |
| `T` | Ties |
| `PTS` | Standings points |
| `PCT` | Percentage of available standings points earned |
| `PF` | Finalized fantasy points for |
| `PA` | Finalized fantasy points against |
| `DIFF` | Fantasy points for minus fantasy points against |

Approved formulas:

```text
GP = W + L + T
PTS = W × 2 + T
PCT = PTS ÷ (GP × 2)
DIFF = PF − PA
```

When `GP = 0`, `PCT` is displayed as zero.

Displayed fantasy-point values and percentage are rounded to the nearest hundredth.

---

## Standings Order

The approved order is:

1. standings points, descending;
2. fantasy-point differential, descending;
3. fantasy points for, descending;
4. team name, ascending as a deterministic display fallback.

Team name is not a competitive tiebreaker. Teams still equal after fantasy-point differential and fantasy points for remain tied and use team name only for deterministic display order.

---

## Byes and Unplayed Matchups

A team receives:

* no game played;
* no win, loss, or tie;
* no standings points;
* no points for or against

for a week in which it has no finalized scheduled opponent.

A postponed, cancelled, missing, or invalid matchup must not silently count as a bye.

The Matchups specification must define those states and their recovery.

---

## Rebuildability

A standings rebuild must:

* use one league and season;
* read finalized results only;
* apply the approved standings-rule version;
* produce the same table when repeated against unchanged inputs;
* report missing or invalid results;
* avoid changing matchup results;
* avoid creating hidden writes from a normal read-only standings request.

If standings are cached, the cache is derived data and must be replaceable from finalized results.

---

# Part 8 — Playoff Scoring Boundary

## Shared Player Formula

Playoff player fantasy points use the same scoring categories and values as the regular season.

---

## Approved Playoff Calendar

Hundo Leago playoffs occur during the NHL regular season and occupy its final four fantasy scoring weeks:

```text
Round 1:  1 fantasy week
Round 2:  1 fantasy week
Final:    2 fantasy weeks
```

The Final uses the last two fantasy scoring weeks of the NHL regular season.

Real NHL playoff games do not affect Hundo Leago under the current format.

Regular-season matchup scheduling begins with the first full Monday-through-Sunday week contained in the NHL regular season and ends before the four playoff weeks.

---

## Playoff Matchup Ties

Regular-season ties may be permitted while playoff matchups require a winner.

The playoff specification must define:

* whether playoff matchups can end tied;
* the playoff tiebreak sequence;
* whether seeding is used as a final tiebreak;
* whether a scoring window can be extended;
* how corrections affect an advanced bracket.

No playoff tiebreak is approved in this document yet.

---

# Part 9 — Corrections and Audit

## Correction Principles

A scoring correction must:

* identify the league, season, week, matchup, team, and affected player when applicable;
* preserve the original result;
* preserve the corrected result;
* record the reason;
* record the actor;
* record the timestamp;
* recalculate dependent standings;
* remain auditable;
* be applied atomically.

The system must not require direct production JSON or database editing for a normal commissioner correction.

---

## Source-Statistics Corrections

The technical and product specifications must distinguish:

* an automatic source refresh before finalization;
* a source correction detected after finalization;
* a commissioner correction;
* a data-repair operation.

Post-finalization source corrections never silently overwrite official results.

They create a new result version or explicit correction record. The latest approved result version becomes official and drives rebuilt standings. The exact authorized review and approval workflow belongs in Permissions and the Matchups product specification.

---

## Result Immutability

The current implementation never overwrites a finalized weekly result.

The approved long-term rule is:

* ordinary scheduled jobs never overwrite a finalized result;
* corrections create a new version or explicit correction record;
* the latest approved result version drives standings;
* every prior version remains available for audit.

This correction model requires a technical specification before implementation.

---

## Activity-History Exclusion

Matchup and standings information must not be written to league activity history.

This exclusion includes:

* schedule creation or change;
* baseline creation;
* team lock or late lock;
* live scoring changes;
* matchup finalization;
* rollover;
* source-statistics corrections affecting matchups;
* commissioner matchup corrections;
* standings calculations, rebuilds, or corrections;
* failed or recovered matchup and standings jobs.

Matchup results, correction versions, and operational evidence must remain available in the matchup, result, correction, and operational records required to reproduce official outcomes. Those records are separate from league activity history.

Routine read-only score and standings views also remain read-only.

---

# Part 10 — Failure and Recovery

## Safe Failure

The scoring system must fail clearly rather than publish an invented result when required authoritative input is missing.

Examples include:

* missing league or season;
* missing week;
* missing pairings;
* missing baseline;
* missing locked roster;
* missing scoring-rule version;
* unavailable or stale statistics beyond the approved limit;
* duplicate or conflicting result records.

A failed finalization must not partially update standings or advance the week.

---

## Recovery

Recovery controls must:

* be commissioner-authorized;
* be league-scoped;
* show the operation before execution;
* be idempotent where possible;
* preserve backups or prior versions;
* report exactly what changed;
* preserve the operation in the applicable matchup, result, correction, or operational record;
* avoid creating a league activity-history entry;
* avoid modifying unrelated weeks or leagues.

The exact permissions belong in `docs/02-rules/PERMISSIONS.md`.

---

## Read-Only Boundaries

The following requests must remain read-only:

* view current matchup;
* preview live scoring;
* view a finalized result;
* view standings;
* view scoring configuration;
* view matchup result and correction records.

They must not silently:

* capture a baseline;
* lock a roster;
* finalize a result;
* roll over a week;
* refresh statistics;
* rebuild persisted standings;
* repair state.

Required writes must use explicit scheduled operations or authorized write endpoints.

---

# Part 11 — Configuration and Implementation Requirements

## Configuration

The rule model must be capable of representing:

* category values;
* position-specific values if ever approved;
* numeric precision;
* week boundaries;
* baseline timing;
* lock timing;
* finalization timing;
* standings points;
* standings tiebreakers;
* playoff scoring differences;
* scoring-rule version.

The initial Season 2 release does not need to expose every setting in the user interface.

Unsupported variations must not be presented as working configuration.

---

## One Authoritative Calculator

The backend should expose or use one authoritative scoring service for:

* player totals;
* baseline snapshots;
* live matchup previews;
* weekly finalization;
* corrections;
* test fixtures.

The standings service must use finalized outputs from that same scoring model.

Copying the formula into unrelated routes or pages creates drift and must be removed through an approved implementation plan.

---

## Stable Identifiers

Implementation must use stable IDs for:

* leagues;
* seasons;
* teams;
* players;
* matchup weeks;
* matchups;
* scoring rules;
* results;
* corrections.

Display names may be stored as finalized display context, but they must not be the sole relational key.

---

## Time Handling

All scoring timestamps must:

* be stored unambiguously;
* use `America/Vancouver` for the original league’s configured timezone;
* handle daylight-saving transitions;
* be calculated by the backend;
* be testable with a controlled clock;
* not depend on server-local or browser-local timezone assumptions.

---

# Part 12 — Verification Requirements

## Formula Tests

At minimum, test:

* zero goals and assists;
* goals only;
* assists only;
* multiple goals and assists;
* forward and defence equality;
* zero games played for FPG;
* approved rounding boundaries;
* source correction behaviour;
* missing-stat behaviour.

---

## Matchup Tests

At minimum, test:

* a legal team at normal baseline and lock;
* an illegal team at normal baseline;
* a team becoming legal late;
* a roster change after lock;
* a normal roster becoming illegal after lock without changing the locked roster or current scoring;
* no recovery of points earned before a late legal lock;
* a player missing a stable ID;
* a failed statistics refresh;
* a stale cache;
* repeated baseline capture;
* repeated finalization;
* repeated rollover;
* simultaneous scheduled-job attempts;
* daylight-saving boundaries;
* two leagues with overlapping week times.

---

## Result and Standings Tests

At minimum, test:

* a win;
* a loss;
* a tie;
* a zero-versus-zero matchup;
* standings points;
* percentage;
* points for;
* points against;
* differential;
* every approved tiebreak stage;
* a bye;
* a missing result;
* a corrected result;
* a complete standings rebuild;
* league isolation;
* season isolation.

---

## Accelerated Testing

A complete matchup week must be testable in minutes with:

* a controlled clock;
* non-production league state;
* deterministic statistics fixtures;
* explicit baseline and lock execution;
* simulated statistic changes;
* finalization;
* rollover;
* standings verification.

Tests must never require waiting for a real Monday or a real NHL statistics refresh.

---

# Part 13 — Approval Checklist

Grae approved every checklist decision on 2026-07-18.

Approved League Rules are included as checked items so their authority remains visible.

## Already Approved Through League Rules

- [x] Only scoring-eligible active-roster players may collect matchup points.
- [x] Benched, injured-reserve, and prospect players do not collect matchup points.
- [x] Hundo Leago has no goalies.
- [x] The normal weekly roster lock is Monday at `4:00 PM Pacific`.
- [x] The original league timezone is `America/Vancouver`.
- [x] A team that is illegal at the normal lock collects no points until it receives a late legal lock and baseline.
- [x] A team becoming legal late receives a new team-specific baseline.
- [x] Points earned before late legality are not recovered.
- [x] A locked roster is a persisted snapshot and does not silently follow later normal-roster changes.
- [x] Post-lock roster adjustments do not affect the current matchup.
- [x] A normal roster may become illegal after lock without interrupting the locked players’ scoring.
- [x] Matchup and standings information does not appear in league activity history.

## Player Scoring

- [x] A goal is worth `1.25 FP`.
- [x] An assist is worth `1.00 FP`.
- [x] Goals and assists are the only Season 2 scoring categories.
- [x] Forwards and defence players use identical scoring values.
- [x] Games played does not directly award fantasy points.
- [x] FPG equals cumulative FP divided by games played, with zero when games played is zero.
- [x] Displayed player and team FP are rounded to the nearest hundredth.
- [x] Final equality for matchup ties is evaluated using authoritative totals rounded to the nearest hundredth.

## Matchup Week

- [x] Regular-season matchup Week 1 is the first full Monday-through-Sunday fantasy week contained in the NHL regular season.
- [x] Week start is Monday at `12:00 AM Pacific`.
- [x] Normal baseline is Monday at `1:00 AM Pacific`.
- [x] Week end is Sunday at `11:59 PM Pacific`.
- [x] Rollover is Monday at `12:00 AM Pacific`.
- [x] The week boundary is implemented without an unscored or double-scored interval.
- [x] Players locked Monday at 4:00 PM receive eligible points earned since the earlier Monday baseline.
- [x] A team with no valid scoring lock receives zero team FP unless a more specific approved status applies.

## Statistics and Corrections

- [x] Live scoring may continue from the last valid cache during a temporary refresh failure.
- [x] Finalization is blocked when statistics are missing or older than an approved freshness limit.
- [x] A missing player or missing player ID is reported and is not silently treated as an ordinary zero-point performance.
- [x] Negative player deltas caused by source corrections are handled by an explicitly approved correction rule rather than an unexplained clamp.
- [x] Ordinary scheduled jobs never overwrite finalized results.
- [x] A corrected result is stored as a new version or explicit correction record.
- [x] The latest approved result version drives rebuilt standings.
- [x] The policy for source corrections discovered after finalization is approved.

## Regular-Season Results

- [x] Higher final team FP wins and lower final team FP loses.
- [x] Equal final team FP produces a regular-season tie.
- [x] There is no regular-season overtime or additional matchup tiebreaker.
- [x] A `0.00`–`0.00` matchup is an ordinary tie unless a forfeit rule applies.
- [x] A team that never obtains a valid scoring lock during the week receives an ordinary zero-point result rather than a separate forfeit.
- [x] A bye does not count as a game played and awards no standings values.

## Standings

- [x] A win awards `2` standings points.
- [x] A tie awards `1` standings point.
- [x] A loss awards `0` standings points.
- [x] `PCT = PTS ÷ (GP × 2)`, with zero when GP is zero.
- [x] Standings display `GP`, `W`, `L`, `T`, `PTS`, `PCT`, `PF`, `PA`, and `DIFF`.
- [x] The first standings sort is standings points, descending.
- [x] The second competitive tiebreak is fantasy-point differential, descending.
- [x] The third competitive tiebreak is fantasy points for, descending.
- [x] Teams still equal after every competitive tiebreak remain tied and use team name only for deterministic display order.
- [x] Standings are rebuilt from finalized results and remain read-only for normal managers.

## Playoffs

- [x] Playoffs use the same player fantasy-point formula as the regular season.
- [x] Hundo Leago playoffs occur during the final four fantasy scoring weeks of the NHL regular season.
- [x] Round 1 lasts one week, Round 2 lasts one week, and the Final lasts two weeks.
- [x] The Final uses the last two fantasy scoring weeks of the NHL regular season.
- [x] Real NHL playoff games do not affect Hundo Leago under the current format.
- [x] The playoff specification will define a winner-producing playoff tiebreak before playoff implementation.

## Approval

- [x] Every unresolved scoring decision is approved or deliberately assigned to a later specification.
- [x] Existing implementation gaps are not presented as approved behaviour.
- [x] Grae approves this document as the Season 2 scoring-rule baseline.
- [x] Document status is changed to `APPROVED`.

---

## Definition of Done

The rule-approval phase for this document is complete because:

* Grae has approved or revised every material scoring decision;
* no current-code behaviour is presented as approved merely because it exists;
* League Rules and Scoring Rules have a clear boundary;
* formula, matchup-result, and standings rules are unambiguous;
* correction boundaries are explicit and the authorized workflow is assigned to Permissions and the Matchups specification;
* playoff scoring dependencies are assigned;
* product and technical specifications can implement the rules without relying on old roadmaps, chat history, or duplicated calculations.

The exact statistics freshness duration, correction authorization workflow, persistence model, and API shapes remain implementation details for the applicable product and technical specifications.

---

## Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/STANDINGS.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/07-testing/TESTING_STRATEGY.md
docs/10-decisions/DECISION_LOG.md
```
