# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M4-02
```

## Milestone

```text
M4 - League Assets and Cap System
```

## Work Item

```text
League-Scoped Position Corrections and Player Ownership Read Foundation
```

---

# Part 1 - Objective

Add the smallest tested application boundary for the approved, existing
league-specific player-position correction and current player-ownership model.

This work item makes it possible for later roster and transaction services to
read an exact league/player ownership record and an exact league/player current
position correction without ever using a player name, team name, provider ID,
or global mutable source state as a league relationship key.

It also provides a narrow internal repository operation for recording or
replacing one current F/D position correction. It does not create a public
commissioner correction command; that authorization and HTTP integration remain
separate later work.

---

# Part 2 - Authority

This plan is governed by:

```text
docs/01-project/OPERATING_MODE.md
docs/01-project/CURRENT_STATE.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/ROSTERS.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/05-roadmap/ACTIVE_ROADMAP.md
```

The current operating mode is `OFFSEASON_RESET`. M4-02 may use only local,
temporary, or isolated test SQLite databases. It does not authorize staging or
production storage, data import, reset, migration, deployment, or authority
cutover.

---

# Part 3 - Exact Scope

M4-02 may add only:

1. pure validation for a stable league ID, season ID, team ID, player ID, user
   ID, F/D position group, position-correction timestamps, and exact current
   ownership lookup input;
2. a specialized SQLite repository over the existing
   `league_player_positions` and `player_ownerships` tables that can:
   * find the one current correction for an exact league and player;
   * record one new correction or atomically end the previous current
     correction before storing its replacement; and
   * find the one current ownership record for an exact league and player,
     plus safe league-scoped team ownership reads needed by later roster
     services;
3. focused isolated tests proving F/D-only correction records, current-
   correction replacement, two-league position isolation, exact ownership
   lookup, same-player independent ownership across leagues, missing-record
   read immutability, and transaction rollback; and
4. focused verification that existing M2 schema constraints, migration
   checksum evidence, current M4-01 player identity behavior, and file-backed
   compatibility player data remain unchanged.

The repository may persist a correction only behind its internal application
boundary. No M4-02 HTTP request, public command, UI action, job, or ordinary
manager mutation may invoke it.

---

# Part 4 - Non-Goals and Protected Boundaries

M4-02 must not:

* add a migration or change `0001_initial.sql`, the repository catalog, the
  reset manifest, staged import, or application authority;
* add or modify `player_source_state`, provider refresh/import, provider
  credentials, live provider traffic, source-position normalization, player
  aliases, statistics, or global player identity;
* infer or backfill a position from a player name, provider ID, team name, or
  existing file-backed compatibility data;
* create, transfer, release, overwrite, delete, or otherwise mutate a
  `player_ownerships` row; create an `ownership_events` row; or add roster
  category, slot, legality, cap, contract, prospect, auction, trade, matchup,
  standings, activity, or notification behavior;
* add a `/api/v1` target endpoint, change an existing compatibility endpoint,
  frontend caller, Socket.IO event, scheduled job, or commissioner workflow;
* decide whether a user is a commissioner, manager, or platform administrator;
  M3 authorization services remain the authority when a future feature exposes
  a command;
* access shared staging or production state, generate a repository database
  artifact, change dependencies, package locks, environment variables, or
  secrets; or
* discard, stage, commit, stash, reformat, or otherwise modify unrelated local
  work.

A normal roster may later use a league correction in its legality calculation,
but M4-02 does not calculate legality or change a matchup snapshot.

---

# Part 5 - Data and Design Requirements

* `league_player_positions` is a league-scoped override, never a global player
  mutation. It contains only `F` or `D`, and at most one current correction
  exists for a league/player pair.
* Replacing a current correction ends the old row and inserts the new row in
  one synchronous SQLite transaction. A failure leaves the previous correction
  current and leaves no partial replacement.
* A correction records the stable actor user ID and optional safe reason but
  does not itself claim that the actor is authorized; a future application
  service must establish that authority from the session and league membership.
* `player_ownerships` remains the one current ownership row for a player in a
  league. A player may therefore be owned independently in separate leagues,
  but a lookup must never cross league scope.
* Ownership reads return the persisted stable IDs, ownership kind, category,
  F/D group, slot, acquisition reference, timestamps, and version. They do not
  construct missing ownership or empty slots.
* Missing corrections and missing ownership return `null` and write nothing.
* Every returned row is defensive and immutable. All repository input is an
  exact plain object with no unknown fields.
* Existing database constraints remain the enforcement for current-correction
  uniqueness, one owner per league/player, valid roster-category/slot shape,
  and cross-league foreign keys. M4-02 adds no duplicate application rule.

---

# Part 6 - Expected File Scope

Exact filenames will be confirmed against established M3/M4 repository
conventions before the first code edit. Expected scope is:

```text
src/domain/players/leaguePlayerOwnershipPolicy.js
src/infrastructure/persistence/sqlite/SqliteLeaguePlayerOwnershipRepository.js
test/foundation/leaguePlayerOwnershipFoundation.test.js
```

The existing M4-01 player-identity policy may be imported for stable player-ID
validation but must not be broadened except for a directly required, shared
pure validation helper. Any other file is a stop condition.

---

# Part 7 - Execution Sequence

1. Record both worktree statuses and preserve unrelated changes.
2. Inspect the existing M2 table definitions, constraints, indexes, generic
   repository context, M3 league authorization boundaries, and M4-01 player
   identity foundation.
3. Record the current file-backed player-data and reset-manifest hashes before
   code or test changes.
4. Confirm that the existing schema and catalog already provide the required
   tables and that no migration is required.
5. Add the pure policy and specialized read/correction repository only.
6. Add isolated focused tests with separately seeded leagues, seasons, teams,
   users, and players. Test fixture ownership may use direct isolated-database
   setup only; no application ownership writer is added.
7. Run focused M4-02 tests, M4-01, relevant M2 schema/repository, M3
   league-authorization, complete-backend, syntax, whitespace, protected-hash,
   artifact, and worktree checks using Node `24.14.1`.
8. Reconcile both worktrees and record evidence.
9. Archive this plan only after every completion condition passes and stop
   before M4-03.

---

# Part 8 - Verification

Before implementation, confirm the exact focused commands from `package.json`.
At minimum, completion requires successful evidence for:

```powershell
node --test test/foundation/leaguePlayerOwnershipFoundation.test.js
node --test test/foundation/globalPlayerIdentityFoundation.test.js test/foundation/leaguePlayerOwnershipFoundation.test.js test/foundation/sqliteInitialSchema.test.js test/foundation/sqliteRepositoryFoundation.test.js test/foundation/leagueAccessFoundation.test.js
node --test
node --check server.js
git diff --check
git status --short --branch
```

The focused proof must establish:

* F/D is the only accepted correction group;
* current correction replacement is atomic and leaves exactly one current row;
* the same player can have distinct corrections in separate leagues without
  affecting global player data or the other league;
* exact ownership lookups require a stable league ID and player ID, return no
  cross-league data, and do not create missing ownership;
* the same player may have separate ownership records in separate leagues;
* invalid input, duplicate current correction, and an injected write failure
  leave persisted isolated state unchanged;
* correction and ownership reads are read-only;
* the M2 migration ledger and existing schema remain unchanged in temporary
  databases; and
* compatibility player data and reset-manifest hashes remain unchanged.

No verification may use shared staging or production resources.

---

# Part 9 - Stop Conditions

Stop and report before broadening scope if:

* the existing schema cannot represent the approved correction or ownership
  reads without a migration or catalog change;
* current-correction replacement needs a public authorization, HTTP, UI,
  provider, roster, or source-position feature to be safe;
* any action would create or mutate ownership, category, slot, contract,
  activity, or matchup state;
* an ambiguous name-only, provider-only, or cross-league relationship would
  need to be inferred;
* a correction would rewrite global player/provider data or a matchup snapshot;
* protected data hashes, existing M4-01 behavior, a relevant M2/M3 gate, or
  the full suite changes outside the exact scope; or
* Node `24.14.1` is unavailable and the exact-runtime gate cannot be executed.

---

# Part 10 - Rollback

Before any shared-environment authority change, rollback is limited to the new
M4-02 policy, specialized repository, and focused test files. No shared data
or migration is touched by this work item.

Do not edit, delete, renumber, or reverse `0001_initial.sql` or any applied
migration. Do not modify existing M4-01 code when rolling back M4-02.

---

# Part 11 - Completion Checklist

M4-02 completes only when:

* exact league-scoped correction and ownership reads are available through a
  focused repository boundary;
* current F/D correction replacement is atomic and league-isolated;
* no correction changes global provider data, player identity, or matchup
  snapshots;
* no ownership row or event is created or mutated by the application boundary;
* no endpoint, authorization claim, provider integration, roster/category,
  contract, cap, import, job, frontend, staging, production, reset, migration,
  or authority change occurred;
* focused, M4-01, relevant M2/M3, complete-backend, exact-runtime, syntax,
  whitespace, protected-hash, artifact, and worktree checks pass; and
* completion evidence is recorded and work stops before M4-03.

---

# Part 12 - Next-Step Boundary

After M4-02 completes, the next proposed item is:

```text
M4-03 - Roster Categories and Slot-Assignment Foundation
```

M4-03 requires its own bounded active work plan before implementation begins.

---

# Part 13 - Completion Record

## Completion Date

`2026-07-21`

## Files Changed

```text
hundo-leago-backend/src/domain/players/leaguePlayerOwnershipPolicy.js
hundo-leago-backend/src/infrastructure/persistence/sqlite/SqliteLeaguePlayerOwnershipRepository.js
hundo-leago-backend/test/foundation/leaguePlayerOwnershipFoundation.test.js
```

## Behavior Delivered

* Exact stable-ID lookup validation is available for league/player ownership,
  current position correction, and league/season/team ownership lists.
* Only `F` and `D` correction groups are accepted. Correction rows preserve the
  stable actor ID, optional safe reason, effective time, and optimistic version.
* Replacing a current correction ends the previous row and inserts the new row
  in one immediate SQLite transaction. A failed insertion rolls the entire
  replacement back.
* The same global player can have independent current corrections and ownership
  rows in separate leagues without changing global player identity.
* Ownership access is read-only: the specialized boundary exposes exact reads
  and safe immutable team lists but no ownership writer or event writer.

The implementation reuses the existing M2 `league_player_positions` and
`player_ownerships` schema and repository catalog. It adds no migration,
endpoint, authorization claim, provider integration, roster/category behavior,
contract/cap behavior, job, frontend change, or authority cutover.

## Verification Evidence

All implementation tests used only temporary SQLite databases.

```text
Focused M4-02 suite: 7/7 passed
M4-01, M4-02, M2 schema/repository, and M3 league-access suite: 39/39 passed
Architecture gate plus M4-02: 11/11 passed
Complete backend suite under Node 24.14.1: 560/560 passed across 140 suites
JavaScript syntax parsed under Node 24.14.1: 246/246 files
Repository-wide whitespace check: passed
SQLite/database artifact check: none found
```

Protected inputs remained byte-for-byte unchanged:

```text
players.json SHA-256:
C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1

database/reset-manifests/2026-season-1-reset.json SHA-256:
0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491
```

The workstation's installed Node was `24.11.1`. A temporary official Node
`24.14.1` runtime was used solely for exact-version verification and then
removed; it did not change the project, PATH, or system Node installation.

## Safety Result

No shared staging or production path, database, ownership row, ownership event,
provider, credential, reset, import, migration, deployment, compatibility
endpoint, frontend application file, or application authority changed. Existing
unrelated backend and frontend worktree modifications, including the
pre-existing reset-manifest modification, were preserved.

M4-02 is complete. Stop before M4-03.
