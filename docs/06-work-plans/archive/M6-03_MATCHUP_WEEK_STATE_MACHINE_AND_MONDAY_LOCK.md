# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-03
```

## Work Item

```text
Matchup-Week State Machine and Monday 4:00 PM Pacific Lock
```

# Objective

Define and persist the authoritative matchup-week lifecycle and enforce the
exact configured Monday `4:00 PM` league-time lock boundary without capturing
lineups, baselines, or scores ahead of their bounded work items.

# Exact Scope

M6-03 may:

1. migrate matchup-week and matchup statuses to the approved M6 lifecycle;
2. validate exact league-time baseline, lock, end, and rollover boundaries;
3. derive the only legal next state from authoritative time and stored state;
4. persist one compare-and-set week transition and its durable operation
   evidence atomically;
5. make the exact lock instant inclusive so manager-controlled roster changes
   are closed at and after the persisted boundary;
6. keep transition retries idempotent and concurrent claims single-winner; and
7. add focused migration, policy, repository, service, boundary, rollback, and
   isolation tests.

# Explicit Boundaries

M6-03 does not:

* capture a player lineup or statistics baseline;
* decide team legality, late legality, or live score;
* finalize a matchup, update standings, or run a scheduler;
* create HTTP routes or frontend behavior;
* infer a league or season from wall-clock time;
* write League Activity or notification rows;
* deploy, commit, push, or change production authority.

# State Contract

Approved week states are `scheduled`, `baseline_ready`, `live`,
`awaiting_data`, `final`, `correction_required`, and `cancelled`. Approved
matchup states are `scheduled`, `live`, `awaiting_data`, `final`, `postponed`,
`cancelled`, and `correction_required`. A transition uses the persisted league,
season, week, expected status, and exact instant; stale retries do not rewrite
state. At the exact persisted lock instant the week becomes lock-eligible and
manager-controlled roster writes are closed for that week.

# Verification

Completion must prove:

* legacy status migration preserves all existing rows;
* exact pre-boundary, boundary, and post-boundary behavior across Pacific DST;
* only approved state transitions are accepted;
* concurrent or replayed transitions cannot execute twice;
* a late transactional failure rolls back state and operation evidence;
* cross-league and cross-season access fails closed;
* no League Activity, notification, production data, or compatibility state is
  changed;
* focused tests, complete backend tests, syntax, protected hashes, artifact,
  process, and diff checks pass.

# Expected Files

```text
database/migrations/0016_update_matchup_lifecycle_statuses.sql
src/domain/matchups/matchupWeekPolicy.js
src/infrastructure/persistence/sqlite/SqliteMatchupWeekRepository.js
src/application/services/matchups/createMatchupWeekService.js
test/foundation/matchupWeekFoundation.test.js
test/foundation/matchupWeekMigrationFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
../hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

# Completion Gate

M6-03 completes only after the approved lifecycle, exact lock boundary,
single-winner persistence, and write-gate decision are proven. Completion
archives this plan and activates M6-04; it does not capture locked lineups or
baselines.

# Completion Evidence

M6-03 is complete locally. Schema version `16` maps every legacy week and
matchup lifecycle label into the approved M6 state model while preserving
pairing display context and foreign keys. The pure policy makes baseline,
lock, and end instants inclusive and closes manager roster writes exactly at
the persisted lock. Atomic compare-and-set transitions advance one boundary at
a time, update eligible matchups, record one durable operation, replay safely,
isolate league and season scope, and roll back completely after a late failure.

Verification under Node `24.14.1` passed `80/80` focused tests across 19
suites, the complete backend suite passed `781/781` across 204 suites, and
JavaScript syntax passed `345/345`. Protected player and reset-manifest hashes
were unchanged, no database artifacts were left behind, the two baseline Node
processes remained, and `git diff --check` reported no errors.
