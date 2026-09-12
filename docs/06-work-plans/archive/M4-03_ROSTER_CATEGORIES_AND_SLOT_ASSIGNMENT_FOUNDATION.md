# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M4-03
```

## Milestone

```text
M4 - League Assets and Cap System
```

## Work Item

```text
Roster Categories and Slot-Assignment Foundation
```

---

# Objective

Add the smallest pure domain foundation for the approved Active, Bench,
Injured Reserve, and Prospect roster categories. The foundation must normalize
approved source positions, validate occupied-slot assignments, and build an
immutable category projection with explicit empty finite slots.

---

# Exact Scope

M4-03 may add only:

1. pure exact-input validation for roster category, ownership kind, F/D group,
   finite slot number, stable IDs, acquisition reference, and timestamps;
2. source-position normalization for `C`, `LW`, and `RW` to `F`, and `LD` and
   `RD` to `D`, with goalies and dual/unknown positions rejected;
3. construction of schema-shaped occupied assignment records for later
   transactional application services;
4. an immutable league/season/team roster projection containing 12 forward
   Active slots, 6 defence Active slots, 4 Bench slots, 4 Injured Reserve
   slots, and an unlimited Prospect list; and
5. focused tests for boundaries, empty slots, ownership-kind/category
   compatibility, duplicate/cross-scope rejection, and input immutability.

---

# Protected Boundaries

M4-03 must not:

* persist, move, transfer, release, delete, or otherwise mutate ownership;
* create an ownership event, activity record, contract, cap obligation,
  matchup snapshot, endpoint, authorization decision, UI, provider import, or
  scheduled job;
* calculate bench AAV eligibility, injured-reserve eligibility, full roster
  legality, cap usage, prospect-signing history, or transaction confirmation;
* add or modify a migration, repository catalog entry, package, environment,
  reset manifest, staging resource, production state, or application authority;
* infer missing player position or ownership from a name or provider value; or
* alter unrelated backend or frontend worktree changes.

---

# Design Requirements

* Only occupied slots create records; empty slots exist only in the projection.
* Active F uses slots 1-12 and Active D uses slots 1-6.
* Bench and Injured Reserve each use shared slots 1-4.
* Prospect uses no slot and may be `Prospect Right` or a signed `Rostered`
  player; every other category requires `Rostered`.
* Every projection input must match the exact requested league, season, and
  team, and no finite slot or league/player pair may be duplicated.
* Returned records, arrays, slot descriptors, and projections are immutable.

---

# Expected File Scope

```text
src/domain/rosters/rosterAssignmentPolicy.js
test/foundation/rosterAssignmentFoundation.test.js
```

Any required code change outside those files is a stop condition for M4-03.

---

# Verification

Completion requires:

```powershell
node --test test/foundation/rosterAssignmentFoundation.test.js
node --test test/foundation/globalPlayerIdentityFoundation.test.js test/foundation/leaguePlayerOwnershipFoundation.test.js test/foundation/rosterAssignmentFoundation.test.js test/foundation/sqliteInitialSchema.test.js test/foundation/sqliteRepositoryFoundation.test.js
node --test
git diff --check
git status --short --branch
```

The full suite and complete JavaScript syntax check must pass under Node
`24.14.1`. Protected compatibility player data and the reset manifest must
remain byte-for-byte unchanged, and no database artifact may remain.

---

# Completion and Next Boundary

After every gate passes, archive M4-03 and prepare the separately bounded
M4-04 roster-movement and legality plan. Do not begin persistence or movement
logic under M4-03.

---

# Completion Record

Completed locally on `2026-07-21`.

Files changed:

```text
hundo-leago-backend/src/domain/rosters/rosterAssignmentPolicy.js
hundo-leago-backend/test/foundation/rosterAssignmentFoundation.test.js
```

Delivered approved source-position normalization, exact category/slot record
validation, ownership-kind/category compatibility, explicit immutable empty
finite slots, unlimited prospect projection, scope enforcement, and duplicate
player/slot rejection. No ownership write, event, endpoint, contract, cap,
matchup, provider, migration, frontend, or authority change was added.

Verification:

```text
Focused M4-03: 6/6
Cumulative M4/M2: 35/35
Architecture gate: 4/4
Complete backend under Node 24.14.1: 566/566 across 141 suites
JavaScript syntax under Node 24.14.1: 248/248 files
Whitespace, protected hashes, and artifact checks: passed
```

M4-03 is complete.
