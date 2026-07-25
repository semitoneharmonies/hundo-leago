# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-02
```

## Work Item

```text
League- and Season-Scoped Matchup Schedule Generation
```

# Objective

Generate and persist the complete regular-season matchup schedule from the
approved NHL calendar boundary, league timezone, season participants, and
four-week fantasy-playoff reservation. Pairings must be deterministic and as
even as mathematically possible, with explicit byes for odd team counts.

# Exact Scope

M6-02 may:

1. add finalized team display context to persisted pairing and bye rows so the
   complete schedule preserves current and historical season participation;
2. calculate the first eligible Monday-through-Sunday week, every exact Pacific
   boundary, and the available regular-season week count before playoffs;
3. create a deterministic repeated round robin for even and odd team counts;
4. persist weeks, pairings, byes, season-participant display context, and one
   schedule operation atomically for one league and season;
5. reject generation after Week 1 starts or when any schedule already exists;
6. preserve stable team IDs and snapshot the approved team display context; and
7. add focused calendar, daylight-saving, balance, isolation, rollback,
   migration, and repository tests.

# Explicit Boundaries

M6-02 does not:

* activate a week, capture statistics, lock a roster, calculate a score,
  finalize a result, update standings, or start a scheduler;
* add schedule-edit or correction HTTP routes;
* add or remove teams from a live season;
* infer a league or season from the current date;
* write League Activity or notification rows;
* modify compatibility schedule state, deploy, commit, push, or change
  production authority.

# Schedule Contract

Week 1 is the first Monday whose local calendar day is not before the NHL
regular-season opening day. Each later week begins exactly seven local calendar
days later. Every persisted week uses Monday `12:00 AM`, baseline `1:00 AM`,
lock `4:00 PM`, and the next Monday `12:00 AM` exclusive end/rollover in the
league timezone. Regular-season weeks stop before the approved fantasy-playoff
start.

The complete schedule is previewed as a pure immutable plan and then inserted
once in one immediate SQLite transaction. A team appears in at most one pairing
or bye per week and never plays itself. Repeated generation never replaces a
stored schedule.

# Verification

Completion must prove:

* first-full-week selection and exact spring/fall daylight-saving boundaries;
* even and odd team schedules, explicit rotating byes, repeat cycles, and pair
  frequency differences no greater than one;
* league/season/team/display-context isolation and stable identifiers;
* atomic rollback after a late failure and no League Activity writes;
* focused tests, complete backend tests, syntax, protected hashes, artifact,
  process, and diff checks pass.

# Expected Files

```text
database/migrations/0015_add_matchup_schedule_participants.sql
src/domain/matchups/matchupSchedulePolicy.js
src/infrastructure/persistence/sqlite/SqliteMatchupScheduleRepository.js
src/application/services/matchups/createMatchupScheduleService.js
test/foundation/matchupScheduleFoundation.test.js
test/foundation/matchupScheduleMigrationFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
../hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

# Completion Gate

M6-02 completes only after deterministic schedule calculation and one atomic
persist are proven. Completion archives this plan and activates M6-03; it does
not begin week-state or lock behavior.

# Completion Evidence

M6-02 is complete locally. Schema version `15` preserves stable team IDs and
snapshotted display names on every pairing and bye row. The pure schedule
policy selects the first eligible Monday, preserves Pacific daylight-saving
boundaries, balances repeated round robins, and rotates explicit odd-team
byes. Commissioner-only preview remains read-only, generation persists the
complete schedule and one operation atomically, duplicate or late generation
fails closed, and no League Activity row is written.

Verification under Node `24.14.1` passed `61/61` focused tests across 14
suites, the architecture regression plus the two M6-02 suites passed `12/12`,
the complete backend suite passed `774/774` across 201 suites, and JavaScript
syntax passed `340/340`. Protected player and reset-manifest hashes were
unchanged, no database artifacts were left behind, the two baseline Node
processes remained, and `git diff --check` reported no errors.
