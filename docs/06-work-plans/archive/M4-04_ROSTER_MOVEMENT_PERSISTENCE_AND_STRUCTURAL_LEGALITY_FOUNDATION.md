# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M4-04
```

## Milestone

```text
M4 - League Assets and Cap System
```

## Work Item

```text
Roster Movement Persistence and Structural Legality Foundation
```

---

# Objective

Add a narrow internal transaction for ordinary roster-category moves and a
pure structural-legality calculation. The change must preserve league/team/
season/player scope, optimistic versions, ownership identity, and required
history without exposing a public command before authorization, contract, cap,
and idempotency integration are ready.

---

# Exact Scope

M4-04 may add only:

1. pure validation for an exact ordinary move from Active to Bench or Injured
   Reserve, or back to Active, including expected source category, destination
   F/D slot, actor authority, timestamp, and optional reason;
2. pure structural-legality output using current effective F/D positions,
   approved active limits, and explicit invalid/missing position reasons;
3. a specialized SQLite repository that atomically updates the one existing
   ownership row and appends one `ownership_events` row plus one
   `league_activity` row; and
4. isolated tests for allowed/rejected transitions, stable ownership identity,
   version conflict, exact scope, occupied-slot rollback, event/activity
   rollback, and read-only structural calculation.

---

# Protected Boundaries

M4-04 must not:

* acquire, transfer, release, delete, or create ownership;
* move directly between Bench and Injured Reserve, move a Prospect, sign or
  decline an ELC, or change a contract;
* decide bench AAV, injured-reserve eligibility, cap usage, complete legality,
  matchup eligibility, or transaction confirmation;
* add authorization, idempotency, HTTP, UI, Socket.IO, job, notification,
  provider, import, migration, catalog, reset, staging, production, deployment,
  or authority-cutover behavior; or
* modify unrelated worktree content.

---

# Expected File Scope

```text
src/domain/rosters/rosterMovementPolicy.js
src/infrastructure/persistence/sqlite/SqliteRosterMovementRepository.js
test/foundation/rosterMovementFoundation.test.js
```

M4-03 files may be imported but not broadened. Any other code file is a stop
condition.

---

# Verification

Completion requires the focused M4-04 suite, cumulative M4/M2 schema and
repository suites, the architecture gate, complete backend suite, all-file
syntax, whitespace, protected-hash, artifact, and worktree checks. The complete
and syntax gates use Node `24.14.1` and only isolated temporary SQLite data.

---

# Completion and Next Boundary

After every gate passes, archive M4-04 and prepare M4-05 for contracts and
contract-year schedules. Do not add contract or cap behavior under M4-04.

---

# Completion Record

Completed locally on `2026-07-21`.

Files changed:

```text
hundo-leago-backend/src/domain/rosters/rosterMovementPolicy.js
hundo-leago-backend/src/infrastructure/persistence/sqlite/SqliteRosterMovementRepository.js
hundo-leago-backend/test/foundation/rosterMovementFoundation.test.js
```

Delivered exact Active-mediated ordinary transitions, structural position and
count legality, optimistic ownership updates, and atomic ownership-event plus
league-activity history. Occupied-slot, stale-state, scope, and history failures
roll back without partial mutation. No ownership creation/release, prospect,
contract, cap, authorization, endpoint, frontend, migration, or authority
change was added.

Verification:

```text
Focused M4-04: 7/7
Cumulative M4/M2: 42/42
Architecture gate: 4/4
Complete backend under Node 24.14.1: 573/573 across 143 suites
JavaScript syntax under Node 24.14.1: 251/251 files
Whitespace, protected hashes, and artifact checks: passed
```

M4-04 is complete.
