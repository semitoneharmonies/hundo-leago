# Hundo Leago — Matchups

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 scoring, roster-lock, result, permission, and history rules;
* current matchup behaviour that informs but does not control the target design;
* approved schedule, display, data-freshness, finalization, and correction workflows;
* approved regular-season and fantasy-playoff calendar boundaries.

Grae approved the Season 2 Matchups product specification recorded in this document on 2026-07-18.

---

## Product Purpose

Hundo Leago needs a league-scoped matchup system that pairs teams into persisted scoring weeks, locks eligible players, calculates live fantasy points, finalizes official results, and provides safe commissioner recovery.

This specification defines:

* regular-season schedule creation;
* matchup-week identity and states;
* baselines and roster locks;
* late legality;
* live scoring and player breakdowns;
* missing or corrected statistics;
* finalization and rollover;
* result correction and audit;
* authenticated matchup views;
* failure recovery and testing.

The backend is authoritative. A page view must never create a baseline, lock a roster, finalize a result, roll over a week, refresh source statistics, or repair state.

---

## Out of Scope

This document does not define:

* playoff qualification, seeding, bracket pairing, and playoff tiebreakers;
* regular-season standings calculations beyond their matchup-result inputs;
* NHL statistics ingestion internals;
* exact database tables;
* exact API routes or payloads;
* email or push notifications;
* public matchup access;
* the future presentation of alternate matchup views.

---

# Part 1 — Product Authority

## Source Documents

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/ROSTERS.md
```

Approved shared rules and this reconciled product specification are authoritative.

---

## Existing Behaviour Is Not the Target Model

The current system includes:

* a persisted 26-week schedule;
* round-robin pairings;
* explicit week timestamps;
* normal baseline and roster-lock operations;
* weekly baseline-delta scoring;
* result finalization and rollover;
* stored results;
* standings input;
* commissioner schedule and recovery controls.

Known gaps include incomplete stable-ID use, incomplete late-legality handling, frontend display paths that may use current rosters, insufficient source-correction workflow, file-backed state, and limited accelerated testing.

Current implementation is evidence only.

---

## Backend Authority and Isolation

The backend is authoritative for:

* league, season, week, matchup, team, player, baseline, lock, result, and correction identity;
* schedule and pairings;
* week boundaries and status;
* roster legality and scoring eligibility;
* source-statistics snapshots;
* live and final fantasy-point calculations;
* result versions;
* rollover and recovery.

Every record belongs to one league and one season. Cross-league or cross-season data must never be combined.

---

# Part 2 — Actors and Visibility

## Team Manager

A manager may:

* view every matchup available to authenticated members of the manager’s league;
* view the assigned team’s normal roster separately from its persisted matchup snapshot;
* make approved normal roster adjustments when the team lacks a legal lock.

A manager does not submit a separate matchup lineup and cannot directly edit a baseline, lock, live total, result, or matchup schedule.

---

## Commissioner

A commissioner may:

* create and correct the assigned league’s matchup schedule;
* inspect baseline, lock, source-data, finalization, and rollover health;
* retry idempotent scheduled operations;
* correct a lock, baseline, pairing, or result through explicit controls.

No written reason is required. Corrections must preserve before-and-after state in matchup-specific records and must not enter League Activity.

---

## Authenticated League Member

Every authenticated active league member may view:

* all current league matchups;
* future scheduled pairings;
* prior finalized matchups;
* player scoring breakdowns;
* visible result corrections.

---

## Public Viewer

Matchups are not public in the initial release.

---

# Part 3 — Regular-Season Schedule

## Season Length and Fantasy Playoffs

The number of regular-season matchup weeks is derived from the NHL regular-season calendar rather than fixed at 26.

Week 1 is the first full Monday-through-Sunday scoring week contained in the NHL regular season. If the NHL regular season opens on a Monday, that week may be Week 1; otherwise Week 1 begins on the following Monday.

Hundo Leago playoffs occupy the final four fantasy scoring weeks of the NHL regular season:

```text
Round 1:  1 week
Round 2:  1 week
Final:    2 weeks
```

Regular-season matchups run from Week 1 until the fantasy playoffs begin.

The two-week Final uses the last two fantasy scoring weeks of the NHL regular season. Real NHL playoff games do not affect Hundo Leago under the current format.

---

## Automatic Schedule Generation

Before the regular season begins, the application:

1. reads the authoritative NHL regular-season dates;
2. selects the first full Monday-through-Sunday week as Week 1;
3. reserves the final four fantasy weeks for Hundo Leago playoffs;
4. determines the available regular-season matchup weeks;
5. generates deterministic pairings that make each pair of teams play an equal number of times, or as evenly as mathematically possible;
6. persists the complete schedule atomically.

The commissioner may preview and adjust the generated schedule.

Each team may have at most one opponent per week and may never play itself.

When the team count is odd, the schedule assigns one rotating bye each week.

The round-robin sequence repeats as needed to fill the available regular-season weeks.

Each later week begins exactly seven calendar days after the previous week in the league timezone.

---

## Schedule Changes

Before Week 1 starts, a commissioner may regenerate or edit the schedule through a confirmed action.

After Week 1 starts:

* the schedule is frozen for ordinary editing;
* a commissioner may make an explicit matchup correction;
* completed results are never silently reassigned;
* affected future pairings, byes, and week records update atomically;
* the correction remains outside League Activity but inside matchup correction history.

Adding, deactivating, removing, or restoring a season team after Week 1 begins requires the same explicit schedule-correction workflow. Historical pairings and finalized results remain unchanged.

Teams are not added to or removed from a live season. The correction workflow exists for exceptional recovery and does not authorize normal midseason membership changes.

---

# Part 4 — Week and Matchup Records

## Approved Week Boundaries

```text
Week start:      Monday at 12:00 AM Pacific, inclusive
Normal baseline: Monday at 1:00 AM Pacific
Roster lock:     Monday at 4:00 PM Pacific
Week end:        Monday at 12:00 AM Pacific, exclusive
Display end:     Sunday at 11:59 PM Pacific
Rollover:        Monday at 12:00 AM Pacific
Timezone:        America/Vancouver
```

There is no unscored or double-scored interval between adjacent weeks.

---

## Week Record

Every persisted week preserves:

* stable week ID and display number;
* league and season IDs;
* all boundary timestamps;
* scoring-rule version;
* matchup IDs and byes;
* status;
* scheduled-operation state;
* correction references.

---

## Week and Matchup Statuses

```text
Scheduled
Baseline Ready
Live
Awaiting Data
Final
Correction Required
Cancelled
```

The status must describe authoritative backend state rather than a frontend clock guess.

---

## Matchup Record

Each matchup preserves:

* stable matchup ID;
* league, season, and week IDs;
* both team IDs;
* finalized team display context;
* status;
* lock and baseline references;
* live-data health;
* official result and correction-version references.

A bye is a week-level assignment, not a fabricated matchup against a placeholder team.

Matchup statuses are:

```text
Scheduled
Live
Awaiting Data
Final
Postponed
Cancelled
Correction Required
```

---

# Part 5 — Baselines and Roster Locks

## Normal Baseline

At Monday `1:00 AM Pacific`, the backend persists the cumulative scoring source used as the normal weekly baseline.

It includes stable player IDs, goals, assists, calculated FP, source timestamps, and scoring-rule version.

Repeated execution must return the existing valid baseline without replacing it.

---

## Normal Lock

At Monday `4:00 PM Pacific`, every legal team’s Active roster is persisted as that team’s scoring-eligible snapshot.

Only players in that snapshot may score for the team during the week.

Empty Active slots contribute zero and do not make the roster illegal by themselves.

Bench, Injured Reserve, and Prospect players are excluded.

---

## Illegal Team at Lock

An illegal team receives no normal scoring snapshot and collects no matchup points while it lacks a valid lock.

Approved roster changes remain available.

When the team first becomes legal, it receives a team-specific snapshot, eligibility timestamp, and baseline. Earlier points are not recovered.

---

## Late-Lock Transaction

The workflow is:

1. an authorized roster transaction makes the normal roster legal;
2. the backend validates legality after the roster change;
3. the backend verifies a sufficiently fresh statistics cache;
4. the roster snapshot and team-specific baseline are created atomically;
5. scoring eligibility begins at the persisted baseline timestamp.

If statistics are too stale, the roster transaction still completes, but the late lock remains `Awaiting Data`. The team begins scoring only when a fresh baseline is persisted.

No late lock may be created at or after the exclusive week-end boundary.

---

## Snapshot Immutability

After a legal lock exists:

* normal roster changes do not change the current matchup snapshot;
* later roster illegality does not interrupt scoring;
* player source-position changes do not rewrite the snapshot;
* only an explicit matchup correction can change it.

---

# Part 6 — Live Scoring

## Approved Formula

```text
player FP = goals × 1.25 + assists × 1.00
player weekly FP = current cumulative FP − applicable baseline FP
team weekly FP = sum of locked-player weekly FP
```

Forwards and defence use identical scoring.

Team and player fantasy points display to the nearest hundredth.

---

## Player Breakdown

The authenticated matchup view shows only values accumulated during that matchup period:

* name and position group;
* weekly goals and assists;
* weekly NHL points, calculated as goals plus assists;
* weekly FP;
* data-availability status.

Every player displays `0` goals, assists, points, and FP at baseline. Season-to-date player totals belong on the Roster page and are not displayed as matchup values.

Empty snapshot slots remain visible as empty and contribute zero.

---

## Live Refresh

The matchup page polls the read-only live-scoring endpoint every five minutes while open.

A manual Refresh control rereads authoritative matchup data but does not refresh the external statistics source.

The normal manager view does not show the source timestamp or technical `current`, `stale`, `awaiting data`, or `final` data-state labels. When scoring data is delayed or unavailable, it shows a plain-language warning. Detailed source health remains available to commissioners through matchup recovery controls.

---

## Freshness Limit

For matchup locking and finalization, the maximum source-cache age is:

```text
6 hours
```

Live scoring may continue from the last valid older cache with a prominent stale label. Finalization and late-lock baseline creation are blocked until source data is within the limit.

---

## Missing and Corrected Statistics

The interface must distinguish zero performance from:

* missing player data;
* missing stable identity;
* stale or failed cache refresh;
* missing baseline;
* negative baseline delta;
* source correction.

A negative delta is never silently clamped to zero.

An unresolved missing-data or negative-delta condition moves the affected week to `Correction Required` or `Awaiting Data` and blocks finalization.

---

# Part 7 — Finalization and Rollover

## Finalization Snapshot

Finalization uses an authoritative statistics snapshot that:

* is captured at or after the exclusive week-end boundary;
* contains only scoring events assigned to the completed scoring window;
* satisfies the approved freshness limit;
* preserves source time and scoring-rule version.

The exact source-query method belongs in the technical specifications.

---

## Final Result

The higher team total wins, the lower total loses, and equal authoritative totals rounded to the nearest hundredth produce a tie.

There is no regular-season overtime or matchup tiebreaker.

`0.00–0.00` is an ordinary tie. A team without a valid lock receives zero, not a separate forfeit.

---

## Finalization Workflow

At rollover, the backend:

1. confirms the week ended;
2. validates pairings, locks, baselines, scoring rule, and statistics;
3. creates missing final results atomically;
4. records any byes without creating results;
5. marks the week Final;
6. advances to the next scheduled week;
7. preserves all prior records.

If data is unavailable, the week becomes `Awaiting Data`. The backend retries every 15 minutes until successful or until a commissioner intervenes.

No partial result or standings effect may remain after failure.

---

## Idempotency

Repeated or concurrent finalization and rollover requests must not:

* create duplicate results;
* count standings twice;
* overwrite a finalized result;
* advance more than one week;
* erase prior baselines or locks.

---

## Cancelled or Postponed Matchup

A cancelled or postponed matchup creates no result and no standings values until a commissioner explicitly reschedules, replaces, or permanently cancels it.

A permanently cancelled matchup is not treated as a bye.

The league and season remain visibly incomplete while an expected result lacks an approved final disposition.

---

# Part 8 — Result Corrections

## Source-Correction Workflow

Before finalization, a valid source refresh may update live totals.

After finalization:

1. a detected source change creates a review item;
2. the official result remains unchanged;
3. a commissioner reviews the source difference and affected players;
4. the commissioner confirms or rejects a corrected result version;
5. an approved version becomes official and drives rebuilt standings;
6. every prior version remains preserved.

There is no silent post-finalization overwrite.

---

## Commissioner Correction Types

Explicit controls may:

* repair a team lock;
* replace an invalid baseline;
* correct a pairing or week timestamp;
* reconcile missing or negative player statistics;
* create a corrected result version;
* cancel or reschedule an unresolved matchup;
* retry finalization or rollover.

Each action requires an `Are you sure?` confirmation, shows affected records, records the commissioner and correction type, and accepts an optional written reason. The correction type supplies the required recorded reason when no written explanation is provided.

---

## Standings Dependency

A corrected official result must cause the related standings rebuild or derived response to use the latest approved result version.

Result correction and any persisted derived-standings update must complete atomically.

---

# Part 9 — Matchup Interface

## Default View

The Matchups page defaults to the current week and shows:

* week number, dates, lock time, and status;
* all pairings and byes;
* team identity and current standings record;
* live or final team FP;
* selected matchup player breakdown;
* lock, late-lock, stale-data, and correction status.

The commissioner dashboard highlights one league matchup at a time and
advances through the current week's pairings every five seconds. Each incoming
matchup moves from right to left rather than changing abruptly. Reduced-motion
preferences disable that movement without disabling the rotation or matchup
information.

---

## Week Navigation

Authenticated league members may select:

* completed weeks and finalized results;
* the current week;
* future scheduled weeks without live scores.

Completed-season matchups remain available through a season selector.

The week selector lists the complete persisted season schedule. Scheduled and
live pairings resolve each stable team ID to its current team name so an
approved rename appears throughout the active schedule. Finalized matchups
preserve their stored historical team display context.

---

## Notifications

The initial release uses in-app status only.

It does not require email or push notifications for roster lock, late eligibility, finalization, corrections, or rollover.

---

# Part 10 — Records and Activity Boundary

Schedule changes, baselines, locks, live totals, results, finalization, rollover, failures, retries, and matchup corrections do not create League Activity entries.

They remain traceable through:

* matchup schedule records;
* baseline and lock records;
* result versions;
* correction records;
* scheduled-job and operational records.

Normal read requests remain read-only.

---

# Part 11 — Validation and Failure Behaviour

The backend must reject or safely block:

* cross-league or cross-season records;
* duplicate week or matchup IDs;
* a team paired with itself;
* more than one opponent for a team in a week;
* missing team, player, baseline, lock, or scoring-rule identity;
* a lock from an illegal roster;
* an unauthorized correction;
* finalization before week end;
* finalization using invalid or stale required data;
* duplicate or conflicting official results;
* rollover before eligible finalization.

Failure must preserve the last valid state and explain the required recovery.

---

# Part 12 — Required Testing

Tests must cover:

* schedule generation for even and odd team counts;
* NHL-calendar-derived regular-season length;
* the first full NHL regular-season week;
* reserved one-week, one-week, and two-week fantasy playoff rounds;
* repeated round-robin cycles, pair-frequency balancing, and byes;
* schedule preview, correction, and frozen-history behavior;
* every exact week boundary and daylight-saving transition;
* normal baseline and lock;
* illegal roster and late legality;
* stale data during late legality;
* post-lock roster changes and illegality;
* live player and team totals;
* missing players, failed refreshes, stale cache, and negative deltas;
* win, loss, tie, zero, and bye outcomes;
* cancelled and postponed matchups;
* result finalization and correction versions;
* idempotent retry, concurrent jobs, and restart recovery;
* league and season isolation;
* authenticated and public visibility;
* proof that read endpoints never write;
* proof that matchup operations never enter League Activity;
* accelerated full-week simulation.

---

# Part 13 — Approval Checklist

## Inherited Approved Rules

- [x] Matchups, weeks, baselines, locks, results, and corrections are league- and season-scoped.
- [x] Week start is Monday at `12:00 AM Pacific`, inclusive.
- [x] Normal baseline is Monday at `1:00 AM Pacific`.
- [x] Normal roster lock is Monday at `4:00 PM Pacific`.
- [x] Week end and rollover are the following Monday at `12:00 AM Pacific`.
- [x] The original league timezone is `America/Vancouver`.
- [x] Only players in a persisted legal Active-roster snapshot collect matchup points.
- [x] Empty Active slots contribute zero and do not make the roster illegal by themselves.
- [x] Bench, Injured Reserve, and Prospect players do not score.
- [x] An illegal team scores only after a legal late lock and team-specific baseline.
- [x] Points earned before late legality are not recovered.
- [x] Post-lock roster changes and later illegality do not change the current snapshot or scoring.
- [x] Goals are worth `1.25 FP`; assists are worth `1.00 FP`.
- [x] Forwards and defence use identical scoring values.
- [x] Higher FP wins, lower FP loses, and equal rounded FP ties.
- [x] There is no regular-season overtime or additional tiebreaker.
- [x] A team without a valid lock receives zero rather than a separate forfeit.
- [x] A bye creates no game played or standings values.
- [x] Final results are idempotent and corrections preserve prior versions.
- [x] Managers cannot directly edit matchup records.
- [x] Commissioners may manage schedules and correct locks, baselines, and results.
- [x] No written commissioner correction reason is required.
- [x] Matchup operations never create League Activity entries.
- [x] Read-only matchup requests never create or repair state.

## Approved Matchup Decisions

- [x] Regular-season matchup weeks run from the first full NHL regular-season week until Hundo Leago playoffs begin.
- [x] Hundo Leago playoffs use three rounds: one week, one week, and a two-week Final.
- [x] The Final occupies the final two fantasy scoring weeks of the NHL regular season.
- [x] Real NHL playoff games do not affect Hundo Leago under the current format.
- [x] The application automatically creates the complete schedule before Week 1.
- [x] Week 1 is the first full Monday-through-Sunday week of the NHL regular season.
- [x] The commissioner may adjust the automatically selected Week 1 start.
- [x] Every later week begins exactly seven calendar days after the prior week in the league timezone.
- [x] Schedule generation uses a deterministic round-robin sequence repeated for the available regular-season weeks.
- [x] Pairings make every pair of teams play equally often or as evenly as mathematically possible.
- [x] Each team has at most one opponent per week and never plays itself.
- [x] An odd team count creates one rotating bye per week.
- [x] Schedule generation saves the complete schedule atomically and provides commissioner preview and adjustment.
- [x] Before Week 1, the commissioner may regenerate or edit the schedule.
- [x] After Week 1 starts, ordinary schedule editing is frozen and changes require a matchup correction.
- [x] Post-start schedule corrections never silently reassign completed results.
- [x] Teams are not added to or removed from a live season.
- [x] Exceptional team-state recovery after Week 1 uses an explicit schedule correction and preserves historical results.
- [x] Week statuses are `Scheduled`, `Baseline Ready`, `Live`, `Awaiting Data`, `Final`, `Correction Required`, and `Cancelled`.
- [x] Matchup statuses are `Scheduled`, `Live`, `Awaiting Data`, `Final`, `Postponed`, `Cancelled`, and `Correction Required`.
- [x] A bye is stored as a week assignment rather than a fabricated placeholder matchup.
- [x] Matchup records preserve finalized team display context in addition to stable team IDs.
- [x] Scheduled and live matchup projections use the current team name while finalized matchups preserve stored historical names.
- [x] Every authenticated league member may view all current, future, and historical league matchups.
- [x] Matchups remain unavailable to unauthenticated public viewers.
- [x] The normal baseline operation is idempotent and preserves its original source snapshot.
- [x] The normal lock atomically persists every legal team’s Active scoring snapshot.
- [x] A roster transaction that restores legality triggers late-lock evaluation.
- [x] A late lock and team-specific baseline are created atomically from a sufficiently fresh cache.
- [x] If data is stale, the roster transaction completes but late-lock scoring waits for a fresh persisted baseline.
- [x] No late lock may be created at or after the exclusive week-end boundary.
- [x] Matchup player rows show only goals, assists, NHL points, and FP accumulated during that matchup period.
- [x] Every player begins the matchup display at zero; season totals remain on the Roster page.
- [x] Empty scoring slots remain visible and contribute zero.
- [x] The open Matchups page polls its read-only live-scoring endpoint every five minutes.
- [x] Manual Refresh rereads matchup data but does not refresh the external statistics source.
- [x] The manager view does not show source timestamps or technical data-state labels.
- [x] Plain-language delayed-data warnings are shown when necessary, while detailed health remains commissioner-only.
- [x] The maximum source-cache age for late locking and finalization is six hours.
- [x] Live scoring may use an older last-valid cache with a prominent plain-language stale warning.
- [x] Missing player data, missing IDs, missing baselines, and negative deltas are not displayed as ordinary zero performances.
- [x] An unresolved missing-data or negative-delta condition blocks finalization.
- [x] Finalization uses a source snapshot captured at or after week end containing only events assigned to the completed scoring window.
- [x] At rollover, missing results finalize before the current week advances.
- [x] A data-blocked week becomes `Awaiting Data`.
- [x] The backend retries data-blocked finalization every 15 minutes.
- [x] A failed matchup finalization leaves no partial result or standings effect.
- [x] A cancelled or postponed matchup creates no result until explicitly resolved.
- [x] A permanently cancelled matchup is not treated as a bye.
- [x] Missing expected results leave the league and season visibly incomplete.
- [x] A post-finalization source change creates commissioner review and never silently changes the official result.
- [x] The commissioner may approve or reject a corrected result version.
- [x] Commissioner controls may repair locks, baselines, pairings, week timestamps, statistics discrepancies, results, finalization, and rollover.
- [x] Every commissioner matchup correction requires confirmation, shows affected records, and accepts an optional written reason.
- [x] A corrected official result immediately drives rebuilt or derived standings.
- [x] The Matchups page defaults to the current week.
- [x] The default page shows week timing, pairings, byes, standings context, scores, player breakdowns, and health warnings.
- [x] Week navigation includes completed, current, and future scheduled weeks.
- [x] Week navigation exposes every persisted regular-season week through one selector.
- [x] Future weeks show schedules without live scores.
- [x] Completed-season matchups remain available through a season selector.
- [x] The initial release uses in-app status without separate email or push matchup notifications.
- [x] Grae approves this document as the Season 2 Matchups product specification.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The rule-approval phase is complete because the calendar, schedule, statistics freshness, correction, lock, finalization, visibility, and recovery workflows are approved and no unchecked decision remains.

Implementation is complete only when controlled-clock, accelerated-week, concurrency, data-failure, correction, league-isolation, and read-only-boundary tests pass.

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
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/STANDINGS.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/07-testing/TESTING_STRATEGY.md
```
