# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-04
```

## Work Item

```text
Immutable Team-Specific Locked Lineups and Scoring Baselines
```

# Objective

Capture each eligible team's exact active lineup and player scoring totals as
one immutable, team-specific matchup snapshot so every locked player starts the
week at zero and later normal-roster changes cannot alter the matchup.

# Exact Scope

M6-04 may:

1. read one authoritative league, season, week, matchup team, active lineup,
   and latest successful season-stat snapshot;
2. require the latest successful statistics to be no more than six hours old;
3. persist one normal roster lock and its exact player-slot baselines
   atomically;
4. preserve stable player IDs, position groups, slot numbers, and baseline
   games, goals, assists, and fantasy points;
5. make exact replay write-free and conflicting second locks fail closed;
6. prove later roster or stat changes do not alter persisted lock rows; and
7. add focused policy, repository, service, isolation, freshness, immutability,
   and rollback tests.

# Explicit Boundaries

M6-04 does not:

* decide whether an incomplete or otherwise illegal roster may lock;
* create a late-legality lock;
* calculate live deltas or final results;
* update standings, run a scheduler, or add HTTP/frontend behavior;
* write League Activity or notification rows;
* deploy, commit, push, or change production authority.

# Snapshot Contract

The caller supplies an already-approved eligible team lock request. The
service re-reads authoritative active roster assignments and the latest
successful stat snapshot in the same league and NHL season. Every active
player is copied once with its current slot and exact cumulative baseline. A
missing player total is represented by explicit zero categories. Statistics
older than six hours at capture time fail closed. The normal lock is unique by
league, matchup week, and team and is never updated in place.

# Verification

Completion must prove exact zero-baseline deltas, six-hour freshness boundaries,
player/slot identity, immutable snapshots after source changes, exact replay,
conflict rejection, cross-scope denial, late rollback, no League Activity, and
complete focused, backend, syntax, protected-hash, artifact, process, and diff
checks.

# Expected Files

```text
src/domain/matchups/matchupLockPolicy.js
src/infrastructure/persistence/sqlite/SqliteMatchupLockRepository.js
src/application/services/matchups/createMatchupLockService.js
test/foundation/matchupLockFoundation.test.js
../hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

# Completion Gate

M6-04 completes only after one eligible team's exact active players and fresh
season totals are captured immutably and atomically. Completion archives this
plan and activates M6-05; it does not decide illegal or late-lock behavior.

# Completion Evidence

M6-04 is complete locally. The lock service selects the latest successful
provider refresh at or before the persisted `1:00 AM` baseline, accepts the
exact six-hour freshness edge, fills missing player totals with explicit zeros,
and atomically freezes the exact `4:00 PM` active lineup into immutable
snapshot and lock-player rows. Exact replay is write-free, conflicting locks
fail closed, later roster changes do not alter the snapshot, cross-scope access
is denied, and late failure rolls every row back.

Verification under Node `24.14.1` passed `15/15` focused policy, lock, week,
and architecture tests, the complete backend suite passed `786/786` across 206
suites, and JavaScript syntax passed `349/349`. Protected hashes were unchanged,
no database artifacts were left behind, the two baseline Node processes
remained, and `git diff --check` reported no errors.
