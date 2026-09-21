# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-02
```

## Active Step

```text
SQLite Foundation and Migration Step 2 - SQLite Driver and Central Connection Factory
```

Grae requested continuation of the approved M2 sequence on 2026-07-19. This exact plan activates only M2-02.

M2-02 adds the approved SQLite driver and an isolated infrastructure connection foundation. It does not change persistence authority, application bootstrap, API behavior, or league data.

---

## Scope Amendment

The first focused run proved that M2-01's runtime-foundation test intentionally asserted the SQLite driver was absent. That historical assertion is superseded by M2-02's approved dependency addition.

M2-02 therefore also modifies:

```text
test/foundation/nodeRuntimeFoundation.test.js
```

Only the two obsolete driver-absence assertions may be removed. Runtime, engine, package, lockfile, and dependency-synchronization assertions remain. The new M2-02 foundation test owns stricter exact driver-version and import-boundary assertions.

---

## Resolved Dependency Decision

Implementation stopped before source edits because the approved exact dependency version is not published:

```text
npm.cmd install --save-exact better-sqlite3@12.11.2
npm error code ETARGET
npm error notarget No matching version found for better-sqlite3@12.11.2.
```

The authoritative npm registry reports:

```text
Latest published version: 12.11.1
Published 12.11.2:        no
Node support for 12.11.1: 20.x || 22.x || 23.x || 24.x || 25.x || 26.x
```

The failed install did not add a package declaration, lockfile entry, or installed module.

Grae approved correcting the exact driver pin in:

```text
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

from `12.11.2` to the published `12.11.1` on 2026-07-19. M2-02 may resume with exact `12.11.1`; no other substitute version may be selected silently.

---

## Objective

Pin `better-sqlite3` `12.11.1` exactly and add the only infrastructure module permitted to open SQLite. Prove explicit path safety, required PRAGMA configuration, SQLite capability, readiness, foreign-key enforcement, and dependency boundaries using operating-system temporary databases.

Migration-ledger validation and application schema compatibility remain M2-03 work. The M2-02 factory is not wired into normal application startup.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/NORTH_STAR.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/01-project/PROJECT_SCOPE.md
../hundo-leago/docs/01-project/GLOSSARY.md
../hundo-leago/docs/04-technical-specs/ARCHITECTURE.md
../hundo-leago/docs/04-technical-specs/DATA_MODEL.md
../hundo-leago/docs/04-technical-specs/SQLITE_MIGRATION.md
../hundo-leago/docs/05-roadmap/ACTIVE_ROADMAP.md
../hundo-leago/docs/06-work-plans/archive/M2-01_NODE_RUNTIME_AND_TEST_FOUNDATION.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm backend `stage2` and the expected cumulative M1 and M2-01 work.
2. Confirm no implementation plan is active and M2-02 is the documented next boundary.
3. Record protected repository JSON hashes and both worktrees.
4. Confirm Node.js `24.14.1` is selected.
5. Confirm the exact driver version is available from the package registry.
6. Stop if this step requires application composition, schema, migration, repository conversion, copied data, or production access.

---

# Part 2 - Exact Scope

Create:

```text
src/infrastructure/database/connection.js
test/foundation/sqliteConnectionFoundation.test.js
```

Modify:

```text
.gitignore
package.json
package-lock.json
test/foundation/nodeRuntimeFoundation.test.js
```

Canonical completion records:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/06-work-plans/archive/M2-02_SQLITE_DRIVER_AND_CONNECTION_FACTORY.md
```

No other backend or frontend source file is in scope.

---

# Part 3 - Required Behavior

The connection foundation must:

* import `better-sqlite3` only inside the infrastructure database boundary;
* require an explicit non-empty database path;
* reject SQLite in-memory and URI-style paths because this foundation verifies real-file WAL behavior;
* resolve non-production relative paths against an explicit working directory;
* require production database and persistent-root paths to be absolute;
* reject a production database outside its explicit persistent root;
* require the production parent directory to exist and be writable;
* create missing non-production parent directories only during an explicit open;
* configure and verify foreign keys, WAL, full synchronous durability, busy timeout, WAL autocheckpoint, journal size limit, and untrusted schema;
* require a SQLite version supporting `STRICT` tables;
* complete a lightweight readiness query;
* close a partially opened connection when configuration or verification fails;
* return the explicit resolved path and open database handle to its caller.

It must not:

* read `DATABASE_PATH` itself;
* create a default production path;
* load an extension or enable unsafe mode;
* apply migrations automatically;
* inspect or mutate JSON league state;
* connect from routes, services, jobs, repositories, scripts, or bootstrap;
* become application persistence authority.

---

# Part 4 - Test Assertions

Focused tests must prove:

* package and lockfile pin `better-sqlite3` exactly at `12.11.1`;
* only the infrastructure database module imports the driver;
* missing, blank, in-memory, URI, relative-production, missing-root, and outside-root paths fail before database creation;
* an explicit temporary local path opens successfully;
* all seven required PRAGMAs have their exact approved values;
* the SQLite runtime supports `STRICT` tables;
* foreign-key violations fail;
* production-style validation accepts only an explicit database below an existing writable temporary persistent root;
* WAL and sidecar behavior stays within the temporary database directory;
* closing the returned handle releases it cleanly;
* no repository database artifact remains after tests.

---

# Part 5 - Safety Rules

* Use only isolated operating-system temporary database files.
* Do not open repository JSON, a repository-local database, staging, Render storage, or production storage.
* Do not add schema migrations, repositories, data transforms, source bundles, reset manifests, imports, backups, or restore logic.
* Do not wire the factory into `loadConfig`, dependencies, bootstrap, routes, services, jobs, or scripts.
* Do not alter application behavior or JSON persistence authority.
* Do not edit frontend source or protected repository JSON.
* Do not commit, push, merge, deploy, migrate, reset, or cut over.
* Preserve every unrelated local modification.

---

# Part 6 - Execution Sequence

1. Activate this exact plan and record safety baselines.
2. Install exact production dependency `better-sqlite3@12.11.1` under Node.js `24.14.1`.
3. Add database and sidecar ignore rules.
4. Add the isolated central connection foundation.
5. Add focused temporary-file and boundary tests.
6. Run the focused foundation tests.
7. Run all characterization and complete Node tests plus syntax and whitespace checks.
8. Reconcile dependency declarations, protected hashes, generated artifacts, processes, and both worktrees.
9. Archive M2-02 and stop before M2-03.

---

# Part 7 - Verification

```powershell
node --version
npm.cmd ls better-sqlite3 --depth=0
node --test test/foundation/nodeRuntimeFoundation.test.js test/foundation/sqliteConnectionFoundation.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/infrastructure/database/connection.js
node --check test/foundation/sqliteConnectionFoundation.test.js
git diff --check
git status --short
```

Required:

* the runtime is Node.js `24.14.1`;
* exact driver `12.11.1` is installed and locked;
* focused and existing tests pass;
* only the infrastructure connection module imports the driver;
* all required path, PRAGMA, capability, readiness, foreign-key, close, and cleanup checks pass;
* protected repository JSON hashes match the baseline;
* no database artifact exists in either repository;
* no application behavior, authority, production, frontend-source, commit, push, merge, deployment, migration, reset, or cutover changes.

---

# Part 8 - Stop Conditions

Stop when:

* exact driver installation or native loading fails under Node.js `24.14.1`;
* required PRAGMAs cannot be established and verified on a temporary real file;
* the SQLite runtime does not support `STRICT` tables;
* production path containment cannot be proven cross-platform;
* a focused or existing test requires broader source changes;
* a protected hash or unrelated local modification changes;
* completion requires schema, ledger, repository, bootstrap, JSON, copied-data, staging, production, or frontend-source work.

---

# Part 9 - Rollback

Remove only:

```text
src/infrastructure/database/connection.js
test/foundation/sqliteConnectionFoundation.test.js
```

Restore only the M2-02 changes within:

```text
.gitignore
package.json
package-lock.json
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Remove only dependency artifacts belonging to exact driver `12.11.1`. Do not restore, discard, stash, or alter cumulative M1, M2-01, or unrelated frontend work.

No data rollback should be required because all focused databases are disposable temporary fixtures.

---

# Part 10 - Completion Checklist

M2-02 completes only when:

* exact driver and lockfile pin are verified;
* the isolated connection foundation and all focused assertions pass;
* application bootstrap and JSON authority remain unchanged;
* existing suites and safety gates pass;
* temporary database fixtures are removed;
* completion evidence is archived;
* work stops before M2-03 migration files, ledger, and empty-database verification.

No production, application-authority, schema, migration, repository, data, frontend-source, commit, push, merge, deployment, reset, or cutover authority is included.

---

# Part 11 - Completion Evidence

Created:

```text
src/infrastructure/database/connection.js
test/foundation/sqliteConnectionFoundation.test.js
```

Modified:

```text
.gitignore
package.json
package-lock.json
test/foundation/nodeRuntimeFoundation.test.js
```

Verified on 2026-07-19:

* the invalid unpublished `12.11.2` pin was corrected consistently to approved `12.11.1`;
* `better-sqlite3@12.11.1` installed exactly and loaded under Node.js `24.14.1`;
* the driver reported SQLite `3.53.2`;
* 7 of 7 combined runtime and SQLite connection-foundation checks passed;
* 164 of 164 characterization tests passed;
* 179 of 179 complete Node test entries passed across 42 suites;
* all seven required PRAGMAs, strict-table capability, readiness, and foreign-key enforcement passed against temporary real files;
* missing, in-memory, URI, unsafe production, and outside-root paths failed before database creation;
* the only source import of `better-sqlite3` remained the infrastructure connection module;
* the root lockfile contains the exact registry integrity and dependency tree;
* npm audit reported nine pre-existing transitive findings attributable to Express, Socket.IO, and nodemon paths, with none introduced through the SQLite driver path;
* the npm-generated tracked `node_modules/.package-lock.json` was restored byte-for-byte to its original Git object;
* `npm.cmd run check`, direct syntax checks, and `git diff --check` passed;
* protected repository JSON hashes remained unchanged;
* no SQLite database or sidecar artifact remained in either repository;
* no application bootstrap, persistence authority, JSON state, API behavior, production, staging, frontend source, commit, push, merge, deployment, migration, reset, or cutover changed.

Outcome:

```text
SQLite Foundation and Migration Step 2: COMPLETE
Milestone M2: IN PROGRESS
Next implementation plan: M2-03
```
