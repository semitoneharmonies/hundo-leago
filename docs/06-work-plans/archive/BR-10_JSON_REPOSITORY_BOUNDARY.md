# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-10
```

## Active Step

```text
Backend Refactor Step 10 - JSON Repository Boundary
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-09 passed its gates on 2026-07-18, so BR-10 may begin without another continuation prompt.

BR-10 completed on 2026-07-18. The archive below records the approved scope, one test-scope amendment, and final evidence.

---

## Objective

Adapt the current root `leagueStore.js` implementation into:

```text
src/infrastructure/persistence/json/JsonLeagueRepository.js
```

Preserve current JSON authority and every observable persistence behavior while making the concrete adapter replaceable at the composition boundary.

The step must prove:

* normalization and schema-version compatibility;
* deterministic missing-file and malformed-JSON behavior;
* single-writer queue ordering for concurrent saves and restores;
* temporary-file write and rename behavior;
* prior-live-file backup behavior and deterministic pruning;
* list and restore semantics;
* explicit compatibility replacement for the broad league write;
* unchanged HTTP endpoint behavior.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/04-technical-specs/ARCHITECTURE.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/04-technical-specs/SQLITE_MIGRATION.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
../hundo-leago/docs/06-work-plans/archive/BR-09_BROAD_LEAGUE_COMPATIBILITY_WRITE.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-09.
3. Record protected JSON and package-manifest hashes.
4. Record existing Node process IDs.
5. Run the current league-store, recovery, and endpoint characterization baseline.
6. Keep every write fixture below the operating-system temporary directory.

---

# Part 2 - Current Compatibility Facts

The current root store:

* returns a normalized empty state when the live file is missing;
* catches malformed JSON, reports the failure, and returns a normalized empty state with `meta.loadError`;
* normalizes teams, players, buyouts, bids, trades, matchups, settings, metadata, and automatic markers;
* serializes saves through one shared promise chain;
* writes a backup of the prior live JSON before a save when one exists;
* treats backup and pruning failures as best-effort;
* writes formatted JSON to `<dataFilePath>.tmp` and renames it over the live file;
* serializes restore with saves, atomically writes restored state, records restore metadata, and writes a restore backup;
* exposes current backup listing and restore semantics;
* uses schema version `1`.

These are compatibility behaviors. BR-10 does not correct their known reliability or security limitations unless the approved Step 10 acceptance gate explicitly requires a fixture-visible guarantee.

---

# Part 3 - Exact Scope

Create:

```text
src/infrastructure/persistence/json/JsonLeagueRepository.js
test/characterization/jsonLeagueRepository.test.js
```

Modify:

```text
leagueStore.js
src/bootstrap/createDependencies.js
src/application/services/league/saveCompatibilityLeague.js
test/characterization/configBootstrap.test.js
test/characterization/leagueStore.test.js
test/characterization/leagueWriteCompatibility.test.js
```

The root `leagueStore.js` may remain only as a temporary compatibility adapter for imports not yet removed. A listed modification may be omitted when inspection proves it unnecessary. Another production file requires a documented plan amendment before editing.

---

# Part 4 - Required Boundaries

## JSON repository

The repository owns:

* filesystem access for the authoritative league JSON file;
* normalization and schema metadata;
* the shared write queue;
* temporary-file replacement;
* current pre-write backup integration;
* backup listing and restore integration.

It exposes explicit methods for reading current state, committing current state, and replacing the broad compatibility state. The broad compatibility replacement remains temporary and is not available to new target services.

## Compatibility adapter

The root adapter:

* contains no normalization, queue, filesystem, or backup implementation;
* delegates current `createLeagueStore` construction to the JSON repository;
* preserves legacy method names required by compatibility code until Step 12.

## Composition

Bootstrap constructs the JSON repository. Services receive a repository-compatible dependency from composition; routes do not construct or choose persistence adapters.

---

# Part 5 - Safety Rules

* JSON remains the sole authoritative mutable store.
* Do not add SQLite, database dependencies, dual writes, migrations, seeds, or resets.
* Do not read or write production league data during tests.
* Do not alter normalized state shape, metadata, schema version, JSON formatting, backup names, backup pruning, save order, or restore order.
* A temporary-file or rename failure must leave the prior live file intact.
* Malformed JSON must remain visible and must not overwrite or reseed the live file.
* Missing-file characterization must remain explicit.
* Routes must not import or construct the concrete JSON repository.
* Do not change the 34/6/28 route inventory, response contracts, debug guards, Socket.IO behavior, dependencies, or frontend.

---

# Part 6 - Execution Sequence

1. Extend current fixtures for missing, malformed, concurrent-save, rename-failure, backup-pruning, list, and restore behavior.
2. Move normalization and persistence implementation into `JsonLeagueRepository.js`.
3. Add explicit repository methods and the temporary broad-write compatibility method.
4. Reduce `leagueStore.js` to a compatibility adapter.
5. Construct the repository from bootstrap without changing external dependency shape needed by current composition.
6. Point the BR-09 save service at the explicit compatibility method.
7. Run focused repository, league-store, recovery, characterization, complete, syntax, hash, process, route, debug-guard, and whitespace gates.
8. Record completion evidence and activate BR-11.

---

# Part 7 - Verification

```powershell
node --test test/characterization/leagueStore.test.js test/characterization/jsonLeagueRepository.test.js test/characterization/recoveryCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check leagueStore.js
node --check src/infrastructure/persistence/json/JsonLeagueRepository.js
node --check src/bootstrap/createDependencies.js
node --check src/application/services/league/saveCompatibilityLeague.js
git diff --check
git status --short
```

Required:

* all tests pass;
* concurrent saves persist in invocation order;
* temporary-file failure preserves the prior live file;
* malformed JSON fails visibly without changing the source;
* missing-file behavior is unchanged;
* backup pruning is deterministic in temporary fixtures;
* compatibility replacement cannot be used accidentally by target services;
* route inventory remains 34/6/28;
* no protected repository JSON changes;
* no listener, child process, temporary file, or lock remains;
* only exact BR-01 through BR-10 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* the baseline fails;
* an explicit test path leaves `os.tmpdir()`;
* moving the implementation changes normalization, save, backup, restore, list, metadata, or error behavior;
* a failure can truncate or replace prior live state;
* the repository requires SQLite, a dependency change, a production data operation, or a route contract change;
* another production file is required without a plan amendment;
* route inventory or debug guarding changes;
* cleanup leaves a process or listener;
* rollback cannot be limited to BR-10.

---

# Part 9 - Rollback

Restore the full implementation in root `leagueStore.js`, restore the previous bootstrap factory, restore the broad compatibility service's current store calls, and remove only the BR-10 repository and focused test.

No data rollback should be required. Every persistence test uses copied or synthetic state below the operating-system temporary directory.

---

# Part 10 - Completion Checklist

BR-10 completes only when:

* the JSON league repository owns the current persistence implementation;
* the root store is only a compatibility adapter;
* explicit repository and broad compatibility methods are composed without route-level adapter selection;
* all concurrency, failure, normalization, backup, restore, endpoint, full-verification, and cleanup gates pass;
* evidence is archived;
* BR-11 is activated under the continuous-execution authority.

---

# Part 10A - Completion Evidence

Files created:

```text
src/infrastructure/persistence/json/JsonLeagueRepository.js
test/characterization/jsonLeagueRepository.test.js
```

Files modified:

```text
leagueStore.js
src/bootstrap/createDependencies.js
src/application/services/league/saveCompatibilityLeague.js
test/characterization/configBootstrap.test.js
test/characterization/leagueStore.test.js
test/characterization/leagueWriteCompatibility.test.js
```

The active plan was amended before implementation to add the focused league-write test path. No production scope was added by that amendment.

Verified on 2026-07-18:

* the final focused persistence, recovery, bootstrap, and broad-write run passed 48 of 48 tests;
* the final characterization suite passed 149 of 149 tests;
* the complete Node suite passed 157 of 157 tests;
* syntax checks passed for the repository, compatibility adapter, bootstrap dependency composition, service, and root server;
* `npm.cmd run check` and `git diff --check` passed;
* concurrent saves completed in invocation order;
* a simulated rename failure preserved the prior live state;
* missing and malformed sources remained visible without source writes or reseeding;
* deterministic backup pruning, listing, restore metadata, and restore ordering passed in temporary fixtures;
* only bootstrap, the compatibility adapter, and tests import the concrete JSON league repository; routes do not;
* the compatibility endpoint inventory remained 34 total, six guarded debug routes, and 28 non-debug routes;
* protected league JSON and package-manifest hashes remained unchanged;
* no test listener, child server, temporary state file, or lock file remained;
* the pre-existing Node process remained PID 20636;
* the unrelated frontend worktree modification was preserved without change.

JSON remains the only authoritative mutable league store. SQLite, dual writes, migrations, seeds, resets, frontend changes, and production operations remain outside BR-10.

---

# Part 11 - Next-Step Boundary

After BR-10 passes, archive it and activate:

```text
BR-11 - Socket.IO Compatibility Restoration
```

No production, frontend, commit, push, merge, or deployment authority is included.
