# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-03
```

## Active Step

```text
Backend Refactor Step 3 - Statistics Module and NHL Adapter
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-03 passed every required gate on 2026-07-18 and this record is archived as complete.

---

## Objective

Move statistics-cache access, one-player lookup, debug reads, refresh-token compatibility checks, refresh orchestration, lock handling, atomic cache replacement, and NHL provider access into explicit repository, service, adapter, and router boundaries.

The step must prove:

* absent, full, one-player, invalid-cache, debug, unauthorized-refresh, authorized-refresh, lock-held, and provider-failure behavior;
* failed refresh preserves the last valid statistics cache;
* statistics reads remain read-only;
* refresh never changes league state;
* NHL pagination and current response sanity checks are preserved;
* the command-line refresh script and HTTP route call the same service;
* all 34 compatibility routes and current response contracts remain.

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
../hundo-leago/docs/06-work-plans/archive/BR-02_PLAYER_READ_AND_RELOAD_MODULE.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 and BR-02.
3. Re-run the characterization suite.
4. Record protected JSON hashes and Node process IDs.
5. Stop for unrelated overlap in planned files.
6. Use only temporary statistics, lock, and league files in tests.
7. Never call the live NHL API during automated tests.

---

# Part 2 - Current Compatibility Facts

Current endpoints:

```text
GET  /api/stats
GET  /api/stats/debug
GET  /api/stats/debug-localpath
POST /api/stats/refresh
```

Current `GET /api/stats` behavior:

* missing cache returns `200` with `{ ok: true, ready: false, byPlayerId: {} }`;
* optional `playerId` returns `{ ok, playerId, stats }`;
* full read returns the cache JSON unchanged;
* invalid JSON returns `500` with `Failed to load stats cache`.

Current refresh behavior:

* requires exact `x-stats-token` equality and a non-empty configured token;
* uses one filesystem lock with a 15-minute stale threshold;
* requests regular-season skater summary pages of 100;
* rejects unexpected first/page shapes;
* refuses to write fewer than 200 player rows;
* writes a temporary JSON file and renames it atomically;
* releases the lock in `finally`;
* provider failure leaves the prior cache unchanged.

Current matchup preview/job code also reads the statistics cache directly. BR-03 routes those reads through the repository without moving or changing matchup calculations.

---

# Part 3 - Exact Files

## Modify

```text
server.js
scripts/refreshStats.js
src/config/loadConfig.js
test/characterization/configBootstrap.test.js
test/characterization/endpointManifest.test.js
test/helpers/startCompatibilityServer.js
```

## Add

```text
src/application/services/statistics/createStatisticsService.js
src/infrastructure/persistence/json/JsonStatisticsRepository.js
src/infrastructure/nhl/NhlStatisticsAdapter.js
src/transport/http/routes/statisticsCompatibilityRouter.js
test/characterization/statisticsCompatibility.test.js
```

No dependency, package file, repository JSON, player module, or frontend file may change.

---

# Part 4 - Module Responsibilities

## `JsonStatisticsRepository.js`

* receive explicit cache and lock paths;
* report cache existence and safe file stats;
* parse full cache synchronously and asynchronously for existing callers;
* return optional/null reads where current matchup code currently catches absence;
* acquire the current lock and replace stale/malformed locks;
* release the lock safely;
* atomically replace the cache using same-filesystem temporary rename;
* expose no league-state access.

## `NhlStatisticsAdapter.js`

* receive injected `fetch`, season ID, game type, page size, and user agent;
* build the current NHL skater-summary URLs;
* fetch the first page, derive page count, and fetch remaining pages sequentially;
* validate current first-page and later-page shapes;
* return provider rows without filesystem access;
* throw visible errors for non-success HTTP responses and invalid shapes.

Automated tests use a fake provider only.

## `createStatisticsService.js`

* serve missing/full/one-player reads through the repository;
* orchestrate lock, provider fetch, numeric row projection, minimum-count check, payload timestamp, atomic write, and lock release;
* receive an explicit clock;
* return current refresh result semantics;
* never modify league state;
* preserve the prior cache on provider, validation, or write failure.

## `statisticsCompatibilityRouter.js`

Register:

```text
GET  /api/stats/debug-localpath
GET  /api/stats/debug
GET  /api/stats
POST /api/stats/refresh
```

The router preserves current statuses, keys, path/debug exposure, token failure, and error strings. The token check remains compatibility transport behavior and is not the target Security design.

## `scripts/refreshStats.js`

The script becomes a thin composition/CLI adapter:

* parse current compatibility environment values through shared configuration;
* create the same repository, NHL adapter, and statistics service used by HTTP;
* call the service when run directly;
* export a composition function for safe tests;
* contain no duplicate provider, lock, projection, or write algorithm.

---

# Part 5 - Tests

`statisticsCompatibility.test.js` covers:

* missing cache;
* full cache passthrough;
* one known and one missing player;
* invalid JSON;
* debug and local-debug shapes;
* GET hash preservation;
* empty, absent, and incorrect token rejection;
* authorized refresh with 200 synthetic rows;
* multi-page provider pagination and URL inputs;
* lock-held no-op behavior;
* stale and malformed lock replacement;
* provider HTTP and shape failure;
* fewer-than-200 refusal;
* failed refresh preserving the last valid cache hash;
* successful atomic replacement;
* lock cleanup after success and failure;
* league-state hash unchanged during refresh;
* CLI and HTTP composition using the same service code.

Existing endpoint and read-only suites remain passing. Manifest source assertions identify the new statistics router.

---

# Part 6 - Implementation Order

1. Record baseline evidence and re-run characterization.
2. Extend configuration for current refresh data/lock/season settings.
3. Add and test `JsonStatisticsRepository`.
4. Add and test `NhlStatisticsAdapter`.
5. Add and test the statistics service.
6. Add and test the compatibility router.
7. Rewrite `scripts/refreshStats.js` as a thin adapter.
8. Extend the compatibility child-server environment so statistics data, cache, and lock paths all resolve inside its temporary runtime.
9. Compose repository/service/router in `server.js`.
10. Replace remaining direct statistics-cache reads in root with repository methods only.
11. Remove inline statistics route handlers.
12. Update manifest source assertions.
13. Run focused, characterization, complete, syntax, hash, process, and whitespace gates.
14. Record completion evidence.
15. Stop before BR-04.

---

# Part 7 - Verification

```powershell
node --test test/characterization/statisticsCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check scripts/refreshStats.js
node --check src/application/services/statistics/createStatisticsService.js
node --check src/infrastructure/persistence/json/JsonStatisticsRepository.js
node --check src/infrastructure/nhl/NhlStatisticsAdapter.js
node --check src/transport/http/routes/statisticsCompatibilityRouter.js
git diff --check
git status --short
```

Required:

* all tests pass;
* route inventory remains 34/6/28;
* failed refresh preserves the statistics cache;
* all stats GETs preserve hashes;
* league-state hash never changes during refresh;
* no live network request occurs;
* locks, temporary files, listeners, and child processes are cleaned;
* only exact BR-01 through BR-03 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* baseline tests fail;
* a test contacts the live NHL API;
* any explicit test path leaves `os.tmpdir()`;
* a failed refresh changes the prior cache;
* refresh changes league state;
* current statuses, shapes, projections, season/game type, page size, minimum count, or token behavior cannot be preserved;
* route inventory changes;
* matchup calculations must move or change;
* another production file or dependency is required;
* cleanup leaves a lock, temporary file, process, or listener;
* rollback cannot be limited to BR-03.

---

# Part 9 - Rollback

Restore inline statistics routes and direct cache reads in `server.js`, restore the prior refresh script and configuration fields, and remove only the four new statistics modules and focused test.

No data rollback should be required. Tests use temporary files, and failed writes preserve the prior cache.

---

# Part 10 - Completion Checklist

BR-03 completes only when:

* all statistics cache access is behind the JSON repository;
* NHL access is behind the adapter;
* one service owns refresh orchestration;
* HTTP and CLI use the same service;
* current compatibility endpoints pass;
* failure preserves last valid cache;
* league-state hash remains unchanged;
* full verification and cleanup pass;
* evidence is archived;
* work stops before BR-04.

---

# Part 11 - Completion Record

```text
Work plan: BR-03
Branch and starting status: stage2 at aa0718d with verified cumulative BR-01 and BR-02 work
Exact files: scripts/refreshStats.js; server.js; src/config/loadConfig.js; src/application/services/statistics/createStatisticsService.js; src/infrastructure/persistence/json/JsonStatisticsRepository.js; src/infrastructure/nhl/NhlStatisticsAdapter.js; src/transport/http/routes/statisticsCompatibilityRouter.js; test/characterization/configBootstrap.test.js; test/characterization/endpointManifest.test.js; test/characterization/statisticsCompatibility.test.js; test/helpers/startCompatibilityServer.js
Behavior changed: no intended compatibility behavior changed
Behavior preserved: absent/full/one-player/invalid cache reads, debug responses, token handling, refresh projection, NHL paging, lock behavior, atomic replacement, CLI behavior, and route inventory
Read proof: statistics GET requests and direct repository reads preserved all protected fixture hashes
Provider/refresh proof: fake paged NHL responses exercised the shared service used by both HTTP and CLI; no live network request occurred
Failure/hash proof: provider, minimum-count, lock, parse, and atomic-write failures preserved the last valid cache; league state never changed
Commands/results: 57/57 characterization tests; 65/65 complete tests; npm run check; five node --check commands; git diff --check
Temporary fixtures: all explicit statistics, league, lock, and refresh files were under operating-system temporary directories
Cleanup: lock and temporary files removed; Node process set unchanged
Known test not run: no live NHL integration test, by design
Defects: none introduced; the documented Socket.IO no-op remains deferred to BR-11
Rollback: restore the prior refresh script and inline statistics handlers, then remove only the four BR-03 modules and focused test
Ending status: complete, local, uncommitted, not pushed, not merged, and not deployed
Next: BR-04
```

---

# Part 12 - Next-Step Boundary

After BR-03 passes, archive it and activate:

```text
BR-04 - Snapshot and Backup Operations
```

---

# Document Verification

```powershell
Select-String -Path ..\hundo-leago\docs\06-work-plans\ACTIVE_WORK_PLAN.md -Pattern '^`APPROVED`$','^`READY TO START`$','BR-03','Stop Conditions'
```

BR-03 is complete and archived. No production, frontend, commit, push, merge, or deployment action occurred.
