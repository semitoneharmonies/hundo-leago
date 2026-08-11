# Hundo Leago — Matchups

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 scoring, roster-lock, result, permission, and history rules;
* current matchup behaviour that informs but does not control the target design;
* approved schedule, display, data-freshness, finalization, and correction workflows;
* approved regular-season and fantasy-playoff calendar boundaries.

Grae approved the Season 2 Matchups product specification recorded in this document on 2026-07-18.

Grae approved the FAD clock-freeze amendment on 2026-07-27.
On 2026-07-29, Grae approved automatic whole-Monday Week 1 recovery for a late
Entry Draft or unfinished FAD, plus whole-game exclusion for NHL games already
underway when a late roster snapshot is created.

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

Before schedule generation, an authorized commissioner or administrator
explicitly supplies the NHL regular-season start/end, Hundo Leago playoff
start/end, and Week 1 start. The four calendar instants must form the approved
canonical season range, and the chosen Week 1 instant must satisfy the
Monday-through-Sunday scoring-window constraints, fall within that NHL regular
season, and leave the final four fantasy scoring weeks available for the Hundo
Leago playoffs.

The application may recommend the first full Monday-through-Sunday scoring
week contained in the NHL regular season. That recommendation is not a fixed
annual date and is not persisted until the authorized actor selects and
confirms a Week 1 start.

Hundo Leago playoffs occupy the final four fantasy scoring weeks of the NHL regular season:

```text
Round 1:  1 week
Round 2:  1 week
Final:    2 weeks
```

Regular-season matchups run from Week 1 until the fantasy playoffs begin.

The two-week Final uses the last two fantasy scoring weeks of the NHL regular season. Real NHL playoff games do not affect Hundo Leago under the current format.

---

## Confirmed Schedule Generation

Before the regular season begins, the application:

1. requires the authorized actor to supply the complete NHL/playoff calendar;
2. validates its canonical NHL-season identity, ordering, and four-week
   playoff reservation;
3. presents the approved Week 1 constraints and may recommend the first full
   Monday-through-Sunday week;
4. requires an authorized commissioner or administrator to choose and confirm
   the exact Week 1 start;
5. determines the available regular-season matchup weeks;
6. generates deterministic pairings that make each pair of teams play an equal number of times, or as evenly as mathematically possible;
7. persists the exact calendar, chosen Week 1 start, and complete schedule
   atomically when the season calendar was all null.

The inaugural season and the reset-created original league's initial Season 2
begin with all four calendar fields null. Confirmed schedule generation is
their sole authoritative calendar writer. A later season created by the
approved season-rollover command already has a complete calendar; schedule
generation must receive the exact same tuple. A partial persisted calendar or
a supplied tuple that conflicts with an existing complete calendar fails
without changing the season or creating any schedule row. Preview never
persists either the calendar or schedule.

The commissioner or administrator may preview and adjust the generated
schedule before automatic FAD readiness freezes its historical Week 1 anchor.

If Entry Draft completion would leave the Candidate Card deadline at or before
the completion instant, the backend advances Week 1 by whole league-local
Mondays to the earliest otherwise-valid start whose deadline is strictly in
the future and whose full seven-day FAD period fits. The NHL regular-season
ending and all four fantasy playoff weeks remain fixed. Delaying Week 1 removes
regular-season matchup weeks from the beginning; the backend regenerates the
remaining round-robin pairings and byes as fairly as possible and replaces
every dependent unexecuted job occurrence atomically.

Each team may have at most one opponent per week and may never play itself.

When the team count is odd, the schedule assigns one rotating bye each week.

The round-robin sequence repeats as needed to fill the available regular-season weeks.

Each later week begins exactly seven calendar days after the previous week in the league timezone.

---

## Schedule Changes

Before Candidate Cards open, a commissioner may regenerate or edit the
schedule through a confirmed action.

Automatic Candidate Card opening snapshots and freezes the historical FAD
clock because Week 1 controls the Candidate Card deadline and the initial
seven rapid-auction rollovers. From Candidate Card opening through FAD
completion:

* no manager or commissioner schedule action may move Week 1;
* a schedule regeneration or edit is allowed only when that start remains
  unchanged;
* a prohibited timing change fails without altering the FAD clock or schedule.

Matchups cannot begin while FAD processing is unfinished. If the proposed FAD
completion instant is at or after the current Week 1 start, the FAD completion
transaction moves competition Week 1 to the first otherwise-valid
league-local Monday strictly after that instant. It keeps the NHL
regular-season end and playoffs fixed, removes elapsed early regular-season
weeks, fairly regenerates the remaining pairings and byes, replaces all
dependent unexecuted jobs, and only then commits the completed FAD gate in the
same transaction. A matchup-start job must verify that gate and the matching
schedule version. In a simultaneous race, only the first transaction commits;
the loser revalidates and leaves no partial snapshot, schedule, job, or FAD
state. The recovery does not rewrite the Candidate deadline, rapid-rollover
history, locked cards, or completed FAD results. Incomplete or illegal team
rosters never trigger this delay; only unfinished FAD processing does. If no
valid pre-playoff Monday remains, the schedule and FAD enter explicit
`Correction Required` recovery without publishing completion.

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

Affirmative selected-player live coverage is not a normal-lock prerequisite.
It is required only by the late-lock workflow below, so this rule does not
delay or otherwise change the approved scheduled normal lock.

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
3. the backend verifies sufficiently fresh statistics and source-versioned NHL
   game-state evidence;
4. the roster snapshot, team-specific baseline, and immutable whole-game
   exclusion evidence are created atomically;
5. scoring eligibility begins at the persisted baseline timestamp;
6. every selected player whose NHL game was already underway at snapshot time
   is excluded for that entire NHL game, including events after the baseline;
7. every exclusion records the player ID, NHL game ID, scheduled game start,
   snapshot timestamp, and source/version evidence used to determine that the
   game was underway.

The late-lock occurrence is idempotent. Replaying the same occurrence returns
the committed snapshot, baseline, and exclusion set. Concurrent roster writes
or late-lock evaluations revalidate legality, snapshot timing, and source
version inside the transaction so only one valid set commits. An equivalent
losing attempt returns the committed result; a stale conflicting attempt
rejects without leaving any partial snapshot, baseline, or exclusion evidence.

Replay equivalence is semantic and reconstructed from committed evidence. A
new attempt may propose different generated child UUIDs without becoming a
conflict. Its late-snapshot and evidence timestamps, statistics and
game-state source lineages, selected-roster identities and order, sealed
coverage selection, and exclusions must otherwise be identical. Any difference
in those values conflicts. The late-lock occurrence does not add a browser or
internal request-ID schema.

One shared, never-rejecting post-commit coordinator evaluates late locking
after every registered current or future roster mutation. One committed batch
groups all changed ownership witnesses by affected team; a deleted ownership
uses its last committed version. The registry includes moves, buyouts and
releases, auction and FAD allocation wins, trades and reversals, commissioner
corrections, contract transitions, prospect operations, Candidate carryover
movement, effective-position corrections, and every later writer that can
change authoritative roster legality.

The coordinator never reruns, compensates, reverses, or rolls back the
committed roster mutation, including during original-command replay. Any
coordinator validation or runtime failure after commit safely reports
`awaiting_data` and cannot reject the successful command. One command batch may
trigger at most one server-owned live-statistics refresh and one evaluation
retry in total. Each later successful scheduled statistics refresh invokes an
isolated occurrence-handler retry only after the refresh commits; that hook
cannot change the refresh result, recursively refresh, or repeat a roster
mutation.

The coordinator's safe result is `lateLock` with status `completed`,
`awaiting_data`, `still_illegal`, or `not_applicable`, plus an optional safe
`lockId` and no evidence details. This result is included in successful
roster-mutation responses. Delayed evidence cannot turn a committed mutation
into a failed command.

For a command affecting multiple teams, the one public status uses this exact
priority: `awaiting_data`, then `still_illegal`, then `completed`, then
`not_applicable`. `lockId` is included only when exactly one safely identifiable
completed late lock applies; otherwise it is omitted.

The verified sealed coverage manifest selects the exact distinct NHL games
from the selected roster's `expected_game` entries whose scheduled starts are
inside this matchup week's inclusive-start, exclusive-end window. A separate
exact game-state read, observed at or before the snapshot and no more than five
elapsed minutes earlier, decides which requested games are underway. The
statistics refresh source version and game-state source version are
independently digested lineages from compatible providers; they are not
required to equal one another.

Before evidence is used or replayed, and again during scoring and finalization,
the backend recomputes the sealed coverage, player-game observation,
game-state, and exclusion digests with their exact committed children and
counts. Exclusion creation requires baseline `expected_game` coverage and its
exact baseline observation. Scoring and finalization require every excluded
pair to remain `expected_game` in the chosen current refresh, have its exact
current observation, and use compatible, non-regressed source-update lineage.
Any missing, terminal, regressed, or digest-invalid evidence leaves the
matchup `Awaiting Data`.

Live refreshes retain exact historical player/game requirements for every
whole-game exclusion in a week that is `Live`, `Awaiting Data`, or
`Correction Required`. This keeps the excluded game available throughout both
weeks of the Hundo Leago Final, through an awaiting-data overrun, and whenever
a finalized week re-enters correction. A week that is currently `Final` leaves
the active requirement scope and re-enters only on `Correction Required`.

The historical binding preserves the player, provider player, provider team,
NHL game, and scheduled start from the sealed baseline coverage. It remains
required if the player is later traded, released, changes NHL teams, or becomes
a free agent. One refresh may therefore affirm old-team and current-team games
for the same player, or an old-team historical game for a player whose current
membership is free agent. These are `expected_game` cases, not `no_team` or
`no_due_game`.

The provider request combines its ordinary rolling current dates with the
exact provider-Eastern dates needed for those retained games, without polling
the full season. The provider must affirm the exact historical schedule
game/start/team and explicit player-game row. The server binds the sorted
historical requirements into the requirement digest and completion
compare-and-swap, so a concurrent exclusion or week-status change rejects the
refresh rather than silently changing its scoring scope.

If statistics or NHL game-state evidence are too stale, the roster transaction
still completes, but the late lock remains `Awaiting Data`. The team begins
scoring only when a fresh baseline and its complete exclusion evidence are
persisted.

NHL game-state evidence is fresh when it was observed no more than five
elapsed minutes before the late-snapshot instant. The exact five-minute
boundary is valid. An observation from the future or older than five minutes
is invalid, writes no partial late-lock evidence, and leaves the existing
illegal lock awaiting data.

No late lock may be created at or after the exclusive week-end boundary.

---

## Snapshot Immutability

After a legal lock exists:

* normal roster changes do not change the current matchup snapshot;
* a traded-away or released player remains in the former team's immutable
  snapshot and continues scoring there for that week;
* an acquired player does not enter the new team's current snapshot and first
  becomes eligible at its next normal or valid late snapshot;
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
* explicit authorized four-instant calendar and Week 1 selection, missing-
  choice rejection, and the nonbinding first-full-week recommendation;
* read-only preview from an all-null inaugural/reset calendar;
* confirmed atomic all-null-calendar plus schedule persistence with one season
  version advance;
* rejection of a partial persisted calendar and a conflicting supplied
  calendar without writes;
* exact supplied-calendar equality for a later rollover-created season without
  rewriting its existing calendar;
* reserved one-week, one-week, and two-week fantasy playoff rounds;
* repeated round-robin cycles, pair-frequency balancing, and byes;
* late Entry Draft completion advancing Week 1 by one and multiple whole
  Mondays, fixing NHL/playoff endings, removing early regular-season weeks,
  fairly regenerating pairings/byes, and replacing unexecuted jobs;
* unfinished FAD at and after Week 1 moving competition to the first valid
  Monday after completion without changing historical FAD evidence;
* simultaneous FAD-completion and matchup-start transactions proving one
  first commit, schedule-version/gate revalidation, and no partial snapshot,
  schedule, job, or FAD state;
* incomplete or illegal rosters not moving Week 1;
* schedule preview, correction, and frozen-history behavior;
* every exact week boundary and daylight-saving transition;
* normal baseline and lock;
* illegal roster and late legality;
* stale data during late legality;
* whole-game exclusion for every NHL game already underway when a late
  snapshot is created, including events after the baseline;
* immutable player/game/start/snapshot/source evidence persisted atomically
  with the late snapshot and baseline;
* exact replay and racing legality-restoration attempts producing one
  committed snapshot, baseline, and exclusion set without partial state;
* semantic replay ignoring newly generated child UUID differences only, with
  timestamp, source-lineage, selected-roster, coverage, and exclusion changes
  rejecting as conflicts;
* all roster-mutating paths using one post-commit coordinator without
  repeating or rolling back the mutation;
* at most one immediate refresh and retry, followed by non-recursive
  scheduled-refresh retries for eligible illegal normal-lock records;
* safe four-state `lateLock` mutation responses and success preservation while
  evidence is delayed;
* normal-lock behavior remaining unchanged and independent of affirmative
  selected-player coverage;
* sealed coverage selecting the exact in-week due-game request and a separate
  game-state read at the inclusive five-minute freshness boundary deciding
  underway state;
* independent compatible statistics and game-state source-version lineages;
* recomputation of coverage, player-game observation, game-state, and
  exclusion digests at replay, use, scoring, and finalization;
* current `expected_game` coverage and exact current observation for every
  excluded pair, with non-regressed update lineage;
* traded-away players continuing for the former snapshot and acquired players
  waiting for the next snapshot;
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
- [x] A late snapshot excludes a player whose NHL game was already underway for that entire game, including events after the baseline.
- [x] Immutable player/game/start/snapshot/source exclusion evidence is persisted atomically with the late snapshot and baseline.
- [x] Exact replay and racing late-lock attempts produce one committed snapshot, baseline, and exclusion set without partial state.
- [x] Post-lock roster changes and later illegality do not change the current snapshot or scoring.
- [x] A traded-away player continues scoring for the former team's immutable snapshot that week, while the acquiring team waits for its next snapshot.
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

- [x] Regular-season matchup weeks run from the explicitly selected valid Week 1 start until Hundo Leago playoffs begin.
- [x] The authorized schedule command explicitly supplies the complete NHL/playoff calendar; no read, startup path, or inferred annual default silently writes it.
- [x] Confirmed schedule generation atomically fills an all-null inaugural/reset-created calendar, while a later rollover-created season requires an exact supplied-calendar match.
- [x] A partial or conflicting persisted calendar blocks schedule generation without writes.
- [x] Hundo Leago playoffs use three rounds: one week, one week, and a two-week Final.
- [x] The Final occupies the final two fantasy scoring weeks of the NHL regular season.
- [x] Real NHL playoff games do not affect Hundo Leago under the current format.
- [x] The application automatically creates the complete schedule after an authorized actor chooses Week 1.
- [x] Week 1 is an explicitly selected valid Monday-through-Sunday scoring week; the first full NHL-season week is a recommendation rather than a fixed date.
- [x] The commissioner or administrator may adjust the selected Week 1 start only before Candidate Cards open.
- [x] Every later week begins exactly seven calendar days after the prior week in the league timezone.
- [x] Schedule generation uses a deterministic round-robin sequence repeated for the available regular-season weeks.
- [x] Pairings make every pair of teams play equally often or as evenly as mathematically possible.
- [x] Each team has at most one opponent per week and never plays itself.
- [x] An odd team count creates one rotating bye per week.
- [x] Schedule generation saves the complete schedule atomically and provides commissioner preview and adjustment.
- [x] Before Candidate Cards open, the commissioner may regenerate or edit the schedule.
- [x] Automatic Candidate Card opening freezes the historical Candidate deadline and rapid-rollover clock against manager or commissioner edits.
- [x] Late Entry Draft completion moves Week 1 by whole Mondays until the Candidate deadline is future-facing and the full seven-day FAD period fits.
- [x] Unfinished FAD processing blocks matchup start; when Week 1 must move, schedule/job regeneration and the completed FAD gate commit in one atomic transaction without rewriting historical FAD clocks.
- [x] A matchup-start job requires the matching completed FAD gate and schedule version; a simultaneous completion/start race is first-commit-wins with no partial effects.
- [x] Incomplete or illegal rosters do not delay Week 1.
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
- [x] A late lock, team-specific baseline, and immutable whole-game exclusion evidence are created atomically from sufficiently fresh statistics and NHL game-state evidence.
- [x] Every selected player whose NHL game was already underway is excluded for that entire game, including post-baseline events, with immutable player ID, NHL game ID, scheduled start, snapshot timestamp, and source/version evidence.
- [x] Repeated or concurrent late-lock attempts commit exactly one snapshot, baseline, and exclusion set; equivalent replay returns it and stale conflicts leave no partial state.
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
