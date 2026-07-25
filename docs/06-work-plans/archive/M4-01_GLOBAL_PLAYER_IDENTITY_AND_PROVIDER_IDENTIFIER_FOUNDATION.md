Exit code: 0
Wall time: 0.5 seconds
Output:
# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M4-01
```

## Milestone

```text
M4 - League Assets and Cap System
```

## Work Item

```text
Global Player Identity and Provider Identifier Foundation
```

---

# Part 1 - Objective

Establish the first bounded, SQLite-backed global-player repository and domain
foundation needed by later M4 roster and contract work. M2 has already created
the stable internal player identity and separately stored provider-identifier
schema; this work item makes that approved schema available through a focused
application boundary without changing the current compatibility player API or
any league-owned state.

The intended result is a small, tested repository and domain boundary that
can create and read global players by stable Hundo Leago ID and resolve a
provider-owned text identifier without treating either a display name or a
provider identifier as the internal primary key. It reuses M2's existing
`players` and `player_external_ids` tables and does not add a migration.

---

# Part 2 - Authority

This plan is governed by:

```text
docs/01-project/OPERATING_MODE.md
docs/01-project/CURRENT_STATE.md
docs/02-rules/LEAGUE_RULES.md
docs/03-product-specs/ROSTERS.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/05-roadmap/ACTIVE_ROADMAP.md
```

The active operating mode is `OFFSEASON_RESET`. This permits isolated local
and test development only; it does not authorize production storage, a
production database, production persistent disk, reset, migration, import,
deployment, or authority cutover.

---

# Part 3 - Exact Scope

The implementation may add only the foundations required for:

1. creation and reading of the existing global `players` record with an opaque
   internal UUID, canonical first, last, and full names, optional birth date,
   global active-or-historical state, timestamps, and integer version;
2. creation and resolution of the existing separately stored provider
   identifier per provider namespace and player, with its identifier value
   persisted as text;
3. repository behavior that honours the existing database constraints that
   prevent a provider and identifier value from resolving to more than one
   global player;
4. domain and repository tests for creation, lookup, duplicate rejection,
   text-valued identifiers, and transaction rollback; and
5. focused migration-ledger and schema verification using only temporary or
   isolated test SQLite databases.

The first implementation step must start with the existing repository and
domain conventions, characterize the unchanged compatibility player endpoints,
and make the smallest necessary repository and domain change.

---

# Part 4 - Non-Goals and Protected Boundaries

This work item must not:

* add `player_source_state`, aliases, source-position normalization,
  league-specific position corrections, ownership, roster assignments,
  contracts, retention, buyouts, cap calculation, auctions, trades,
  statistics, matchups, standings, Entry Draft, activity, or notifications;
* add player-import HTTP endpoints, provider clients, scheduled jobs, live
  provider requests, provider credentials, or a provider account;
* change `GET /api/players`, `GET /api/players/:id`,
  `GET /api/players/debug`, `POST /api/players/reload`, their file-backed
  compatibility behavior, or their response contracts;
* add `/api/v1/players` or operational import endpoints;
* read from, write to, migrate, seed, reset, replace, or otherwise alter
  shared staging or production data;
* switch application authority from file-backed JSON to SQLite, introduce a
  dual-write path, alter the approved reset manifest, or run a cutover;
* modify frontend code, dependencies, package locks, environment variables,
  secrets, deployment configuration, or production branches; or
* discard, stage, commit, stash, reformat, or otherwise modify unrelated
  local work.

Existing compatibility player IDs and display names remain compatibility data;
no ambiguous name-only association may be guessed or backfilled by this work.

---

# Part 5 - Data and Design Requirements

* `players.id` is the opaque internal Hundo Leago identifier. It is never
  derived from a name, NHL team, or provider ID.
* Provider identifiers live in `player_external_ids` (or an equivalent table
  with the documented responsibility), separate from `players`.
* An external identifier value is text. Numeric-looking values must preserve
  their exact text value, including leading zeroes where supplied.
* The provider namespace and external identifier value together are unique.
  The same player may have identifiers from more than one provider.
* Canonical names and mutable NHL-team/source attributes are not ownership
  keys and do not establish cross-league relationships.
* The existing `0001_initial.sql` migration remains immutable and is exercised
  only through temporary or isolated SQLite databases in this work item.
* A read must not initialize, normalize, repair, refresh, import, or write a
  player record.
* Errors use the existing target-foundation error and transaction patterns;
  callers must be able to distinguish invalid input, duplicate external ID,
  and missing player without an incidental database error.

---

# Part 6 - Expected File Scope

Exact filenames will be confirmed against existing M2 conventions before the
first code edit. Expected implementation scope is limited to:

```text
src/domain/players/
src/infrastructure/persistence/sqlite/SqlitePlayerRepository.js
test/foundation/globalPlayerIdentityFoundation.test.js
```

If existing conventions require a different repository registration file or
focused-test location, record the exact substitution before editing. A need to
touch code outside this boundary is a stop condition, not permission to
broaden the work.

---

# Part 7 - Execution Sequence

1. Record backend and frontend worktree status and preserve all unrelated
   modifications.
2. Inspect the M2 migration ledger, SQLite repository catalog, target runtime
   composition, player compatibility routes, and their focused tests.
3. Record hashes for the file-backed compatibility player data and the
   current reset manifest before any test or code change.
4. Confirm the existing M2 `players` and `player_external_ids` definitions,
   constraints, and migration-ledger checksum evidence require no change.
5. Add only the pure domain validation and SQLite repository methods needed
   to create and look up global player identity and provider IDs.
6. Register the repository only through the existing composition boundary if
   that boundary does not already expose it;
   do not expose a target HTTP route in this work item.
7. Add focused tests for UUID identity, text provider IDs, duplicate rejection,
   independent provider namespaces, lookup behavior, rollback, and no
   mutation on reads.
8. Run the narrow migration/repository tests, relevant M2 schema and
   repository foundation tests, the complete backend suite, syntax checks,
   diff checks, and protected-file hashes.
9. Reconcile both worktrees, generated artifacts, and protected hashes.
10. Record evidence, archive this plan only after every completion criterion
    passes, and stop before M4-02.

---

# Part 8 - Verification

Before implementation, determine the exact focused test command from
`package.json`. At minimum, completion requires successful evidence for:

```powershell
npm.cmd test -- --test-name-pattern="global player|player identity|sqlite"
npm.cmd test
npm.cmd run check
git diff --check
git status --short --branch
```

The focused proof must establish all of the following:

* a global player receives a stable opaque internal ID;
* two players with the same canonical name remain distinct when their stable
  IDs differ;
* a numeric-looking provider ID round-trips as text without numeric coercion;
* the same provider/value pair cannot attach to two players;
* different provider namespaces may use the same text value;
* an unknown internal or external ID reads as missing and causes no write;
* invalid or duplicate input changes no persisted test state;
* the existing migration application and checksum verification succeed in an
  isolated database; and
* current file-backed compatibility player data and reset-manifest hashes are
  byte-for-byte unchanged.

The full backend suite and syntax check must pass. No test may target shared
staging or production storage.

---

# Part 9 - Stop Conditions

Stop and report before broadening scope if:

* the approved model requires ownership, position corrections, roster,
  contract, or provider-import work to make the player foundation usable;
* a required compatibility player-route behavior would change;
* an ambiguous name-only legacy record requires a guessed association;
* the existing reset manifest, staged import, or target authority would need
  to change;
* the existing M2 player schema does not support the documented repository
  contract without an unrelated schema change;
* a test requires a real provider request, shared staging database, or
  production path;
* a protected player-data or reset-manifest hash changes unexpectedly;
* a focused, existing M2, complete-suite, syntax, or diff check fails for a
  reason outside the exact scope; or
* the implementation needs frontend, deployment, secret, package-lock, or
  unrelated-M3 changes.

---

# Part 10 - Rollback

Before any shared-environment authority change, rollback is limited to the
new M4-01 source and focused test files. No persisted shared data exists to
roll back because this plan permits only temporary or isolated test SQLite
databases.

Do not delete, reverse, rewrite, or renumber the existing `0001_initial.sql`
migration or any applied migration.

---

# Part 11 - Completion Checklist

M4-01 completes only when:

* global player identity and provider IDs are persisted separately under the
  approved model;
* provider IDs are text-valued and uniquely resolved within a provider
  namespace;
* the repository boundary is covered by focused creation, lookup, duplicate,
  rollback, and read-only tests;
* the existing M2 migration remains immutable, checksum-verified, and tested
  only in isolated SQLite databases;
* compatibility player routes and file-backed player data remain unchanged;
* no provider request, HTTP endpoint, job, import, ownership, roster,
  contract, frontend, staging, production, deployment, reset, or authority
  change occurred;
* required focused, existing M2, complete-backend, syntax, hash, whitespace,
  artifact, and worktree checks pass; and
* completion evidence is recorded and work stops before M4-02.

---

# Part 12 - Next-Step Boundary

After M4-01 completes, the next proposed item is:

```text
M4-02 - League-Specific Position Corrections and Player Ownership Foundation
```

M4-02 requires its own bounded active work plan. It may not begin from this
plan.



---

# Part 13 - Completion Record

## Completion Date

`2026-07-21`

## Files Changed

```text
hundo-leago-backend/src/domain/players/playerIdentityPolicy.js
hundo-leago-backend/src/infrastructure/persistence/sqlite/SqlitePlayerRepository.js
hundo-leago-backend/test/foundation/globalPlayerIdentityFoundation.test.js
```

## Behavior Delivered

* Global player records are created and read through stable internal UUIDs.
* Provider identifiers are stored and resolved separately as exact text, so
  numeric-looking values preserve leading zeroes.
* Same-name players remain distinct by stable ID; the same identifier may exist
  in different provider namespaces.
* A duplicate provider/value pair fails atomically and leaves no partial player
  row.
* Missing and invalid player lookups are read-only.

The implementation reuses the existing M2 `players` and
`player_external_ids` schema. It adds no migration, target endpoint, provider
client, import, scheduled job, compatibility change, or application-authority
cutover.

## Verification Evidence

All implementation tests used only temporary SQLite databases.

```text
Focused M4-01 suite: 7/7 passed
M4-01 plus M2 schema/repository suite: 22/22 passed
Complete backend suite under Node 24.14.1: 553/553 passed across 138 suites
JavaScript syntax parsed under Node 24.14.1: 240/240 files
Whitespace check: passed
```

The workstation's installed Node was `24.11.1`, which correctly failed the
repository's exact-runtime test. A temporary official Node `24.14.1` archive
was used solely for verification; it did not change the project, PATH, or
system Node installation.

## Safety Result

No shared staging or production path, database, provider, credential, reset,
import, deployment, compatibility endpoint, frontend file, or application
authority changed. Existing unrelated M3 worktree modifications, including the
pre-existing reset-manifest modification, were preserved.

M4-01 is complete. Stop before M4-02.
