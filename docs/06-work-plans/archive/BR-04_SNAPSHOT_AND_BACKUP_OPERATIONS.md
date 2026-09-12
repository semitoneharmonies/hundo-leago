# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-04
```

## Active Step

```text
Backend Refactor Step 4 - Snapshot and Backup Operations
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-04 passed every required gate on 2026-07-18 and this record is archived as complete.

---

## Objective

Move snapshot and backup listing, creation, restore orchestration, JSON access, compatibility validation, and recovery HTTP routing into explicit operation, repository, and router boundaries.

The step must prove:

* all five compatibility recovery routes preserve their statuses and response shapes;
* snapshot and backup listing remain read-only;
* snapshot creation never changes league state;
* successful restores use only temporary fixtures and record the current activity metadata;
* invalid, missing, and malformed restore sources leave live fixture state unchanged;
* current event attempts remain compatibility no-ops until BR-11;
* path traversal behavior is characterized without silently combining a security change with extraction;
* no repository snapshot, backup, or league file changes.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/04-technical-specs/API_CONTRACTS.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
../hundo-leago/docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
../hundo-leago/docs/06-work-plans/archive/BR-03_STATISTICS_MODULE_AND_NHL_ADAPTER.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-03.
3. Record protected JSON hashes and Node process IDs.
4. Inspect current snapshot and backup route, store, and fixture behavior.
5. Stop for unrelated overlap in planned files.
6. Use only operating-system temporary directories for create and restore tests.

---

# Part 2 - Current Compatibility Facts

Current endpoints:

```text
GET  /api/snapshots
POST /api/snapshots/create
POST /api/snapshots/restore
GET  /api/backups?limit=50
POST /api/backups/restore
```

Current exposure is intentionally insecure:

* snapshot listing, creation, and restore have no authorization;
* backup listing has no authorization and exposes the backup directory;
* backup restore trusts a body-supplied commissioner role;
* target production authorization belongs to the later Security milestone, not BR-04.

Compatibility behavior to preserve:

* snapshot IDs come from JSON filenames and listings are newest-first;
* snapshot names are lower-cased, filtered, hyphenated, and limited to 40 characters;
* snapshot restore merges the source over `emptyState`, prepends `commRestoreSnapshot`, saves, then attempts an event;
* backup listing delegates its current numeric limit behavior and returns `backupsDir`;
* backup restore accepts either `id` or `backupId`, requires body role `commissioner`, restores, merges defaults, saves again with `commRestoreBackup`, then attempts an event;
* the known missing `app.set("io", io)` defect remains unchanged until BR-11.

---

# Part 3 - Exact Scope

Create:

```text
src/operations/snapshots/createSnapshot.js
src/operations/snapshots/restoreSnapshot.js
src/operations/backups/restoreBackup.js
src/infrastructure/persistence/json/JsonSnapshotRepository.js
src/infrastructure/persistence/json/JsonBackupRepository.js
src/transport/http/routes/recoveryCompatibilityRouter.js
test/characterization/recoveryCompatibility.test.js
```

Modify:

```text
leagueStore.js
server.js
test/characterization/endpointManifest.test.js
test/characterization/leagueStore.test.js
test/helpers/startCompatibilityServer.js
```

The exact scope may omit a listed modification when inspection proves it unnecessary. Another production file requires a plan amendment before editing.

---

# Part 4 - Required Boundaries

## Snapshot Repository

The snapshot JSON repository owns:

* listing `.json` snapshot metadata;
* reading and parsing a snapshot;
* writing snapshot JSON;
* filename construction and current compatibility path resolution.

## Backup Repository

The backup JSON repository owns:

* versioned backup creation and pruning;
* listing backup metadata;
* reading and parsing a backup;
* atomic live-state replacement for restore;
* current compatibility path resolution.

`leagueStore` may consume this repository but must retain its single-writer queue and current save/restore semantics.

## Operations

Snapshot and backup operations own:

* current name normalization and timestamp IDs;
* merge-with-default behavior;
* restore activity records and saved-by metadata;
* exactly one post-save event attempt through an injected publisher.

## Compatibility Router

The recovery router owns:

* current request parsing;
* compatibility validation and status codes;
* response shapes and current error text;
* current body-supplied commissioner-role check;
* compatibility logging.

The router must not perform direct file access.

---

# Part 5 - Safety Rules

* Never read, restore, or rewrite repository or production recovery files in tests.
* Listing GETs must preserve the complete fixture tree hash.
* Parse and not-found validation must happen before any live write.
* Atomic rename failure must preserve the prior live fixture.
* Keep current path behavior during extraction; record any traversal defect for a separate security patch.
* Do not add authentication, sessions, CSRF, target authorization, SQLite, or multi-league behavior.
* Do not restore the documented Socket.IO registration defect before BR-11.
* Do not change the 34/6/28 route inventory.

---

# Part 6 - Execution Sequence

1. Capture focused route and store behavior with temporary fixtures.
2. Add and test the snapshot repository.
3. Add and test the backup repository.
4. Move snapshot creation and restore orchestration into operations.
5. Move backup restore orchestration into an operation.
6. Compose the backup repository through `leagueStore`.
7. Add the compatibility router and remove the five inline handlers.
8. Update route-manifest source assertions.
9. Run focused, characterization, complete, syntax, hash, process, and whitespace gates.
10. Record completion evidence and activate BR-05.

---

# Part 7 - Verification

```powershell
node --test test/characterization/recoveryCompatibility.test.js test/characterization/leagueStore.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check leagueStore.js
node --check src/operations/snapshots/createSnapshot.js
node --check src/operations/snapshots/restoreSnapshot.js
node --check src/operations/backups/restoreBackup.js
node --check src/infrastructure/persistence/json/JsonSnapshotRepository.js
node --check src/infrastructure/persistence/json/JsonBackupRepository.js
node --check src/transport/http/routes/recoveryCompatibilityRouter.js
git diff --check
git status --short
```

Required:

* all tests pass;
* route inventory remains 34/6/28;
* recovery GETs preserve hashes;
* failed restores preserve the live fixture hash;
* successful restores produce asserted pre/post hashes and activity records;
* no protected repository JSON changes;
* no listener, child process, lock, or temporary file remains;
* only exact BR-01 through BR-04 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* baseline tests fail;
* an explicit test path leaves `os.tmpdir()`;
* a recovery GET writes;
* a failed parse or validation changes live state;
* current status, shape, name, limit, metadata, log, or save ordering cannot be preserved;
* path behavior would be silently fixed during extraction;
* route inventory changes;
* another production file or dependency is required without a plan amendment;
* cleanup leaves a temporary file, process, or listener;
* rollback cannot be limited to BR-04.

---

# Part 9 - Rollback

Restore inline recovery handlers in `server.js`, restore backup implementation inside `leagueStore.js`, and remove only the new BR-04 operation, repository, router, and focused-test files.

No data rollback should be required. All tests use temporary copies and fixture-only recovery directories.

---

# Part 10 - Completion Checklist

BR-04 completes only when:

* snapshot and backup JSON access is behind repositories;
* recovery orchestration is behind operations;
* HTTP routing contains no direct persistence;
* all five compatibility endpoints pass;
* restore failure preserves prior state;
* current path behavior is documented;
* full verification and cleanup pass;
* evidence is archived;
* BR-05 is activated under the continuous-execution authority.

---

# Part 11 - Completion Record

```text
Work plan: BR-04
Branch and starting status: stage2 at aa0718d with verified cumulative BR-01 through BR-03 work
Exact files: leagueStore.js; server.js; src/operations/snapshots/createSnapshot.js; src/operations/snapshots/restoreSnapshot.js; src/operations/backups/restoreBackup.js; src/infrastructure/persistence/json/JsonSnapshotRepository.js; src/infrastructure/persistence/json/JsonBackupRepository.js; src/transport/http/routes/recoveryCompatibilityRouter.js; test/characterization/endpointManifest.test.js; test/characterization/leagueStore.test.js; test/characterization/recoveryCompatibility.test.js
Behavior changed: no intended compatibility behavior changed
Behavior preserved: five recovery route statuses and shapes, snapshot naming and contents, backup limits/path exposure, restore merges, activity records, saved-by metadata, two-save backup flow, body-supplied role check, event no-op, and route inventory
Read proof: snapshot and backup GET requests preserved the complete temporary fixture tree hash
Restore proof: successful temporary-fixture restores changed the expected live hash and produced the expected activity and metadata; missing and malformed sources preserved the prior hash
Path proof: current snapshot and backup traversal remained characterized against operating-system temporary fixtures and was not silently fixed
Commands/results: 30/30 focused tests; 72/72 characterization tests; 80/80 complete tests; npm run check; seven node --check commands; git diff --check
Temporary fixtures: all create, list, restore, traversal, backup, snapshot, and league paths were below operating-system temporary directories
Cleanup: no temporary recovery file remained; Node process set unchanged
Known security work: traversal, public recovery exposure, backup path disclosure, and body-supplied commissioner role remain blocked pending Security
Defects: the existing backup parse failure poisons the process-global write queue; documented compatibility behavior was preserved
Rollback: restore inline recovery handlers and backup persistence in leagueStore, then remove only BR-04 modules and focused tests
Ending status: complete, local, uncommitted, not pushed, not merged, and not deployed
Next: BR-05
```

---

# Part 12 - Next-Step Boundary

After BR-04 passes, archive it and activate:

```text
BR-05 - Matchup and Standings Pure Calculations
```

No production, frontend, commit, push, merge, or deployment authority is included.
