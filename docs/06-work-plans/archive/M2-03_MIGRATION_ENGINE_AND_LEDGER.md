# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-03
```

## Active Step

```text
SQLite Foundation and Migration Step 3 - Migration Engine and Ledger
```

Grae approved continuous technical execution through the M2 gate on 2026-07-19. M2-02 passed every gate, so this exact plan activates M2-03 without another continuation prompt.

M2-03 builds and verifies the migration mechanism using synthetic temporary migrations. It does not implement the approved application schema, convert a repository, import league data, or change runtime persistence authority.

---

## Objective

Add immutable ordered SQL discovery, SHA-256 checksums, a strict migration ledger, explicit transactional migration execution, `user_version` mirroring, compatibility validation, and the approved explicit `db:migrate` command.

Prove empty, behind, exact, ahead, checksum-mismatch, failed-migration, rerun, and command behavior using disposable operating-system temporary databases and migration directories.

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
../hundo-leago/docs/04-technical-specs/DATA_MODEL.md
../hundo-leago/docs/04-technical-specs/SQLITE_MIGRATION.md
../hundo-leago/docs/05-roadmap/ACTIVE_ROADMAP.md
../hundo-leago/docs/06-work-plans/archive/M2-02_SQLITE_DRIVER_AND_CONNECTION_FACTORY.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm backend `stage2`, cumulative M1 through M2-02 work, and both worktrees.
2. Record protected repository JSON hashes.
3. Select Node.js `24.14.1` and exact driver `12.11.1`.
4. Confirm no repository database artifact exists.
5. Stop if this step requires application DDL, feature repositories, bootstrap wiring, copied data, staging, or production access.

---

# Part 2 - Exact Scope

Create:

```text
database/README.md
scripts/db-migrate.js
src/infrastructure/database/migrate.js
test/foundation/sqliteMigrationFoundation.test.js
```

Modify:

```text
package.json
src/infrastructure/database/connection.js
```

Canonical completion records:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/06-work-plans/archive/M2-03_MIGRATION_ENGINE_AND_LEDGER.md
```

No production migration SQL is created in M2-03. M2-04 owns `database/migrations/0001_initial.sql` and the approved relational schema.

---

# Part 3 - Required Behavior

Migration discovery must:

* read explicit `.sql` files with four-digit increasing IDs and canonical names;
* sort numerically and reject duplicate IDs, duplicate names, malformed SQL names, and non-increasing order;
* compute SHA-256 over each file's exact bytes;
* avoid network, clock, database, or source-data behavior during discovery.

The ledger must be a `STRICT` table recording:

* numeric migration ID;
* file name;
* exact SHA-256 checksum;
* application build identifier;
* started and applied UTC Unix milliseconds;
* non-negative duration milliseconds.

Migration execution must:

* occur only through an explicit call or CLI command;
* create or validate the ledger before application migrations;
* reject database migrations missing from the application set;
* reject changed applied names or checksums;
* reject `user_version` disagreement;
* report exact, behind, ahead, or incompatible state without applying during validation;
* execute each pending migration under `BEGIN IMMEDIATE`;
* make no network call;
* insert a ledger row and update `user_version` in the same transaction as its SQL;
* roll back SQL, ledger, and `user_version` together on failure;
* be safe to rerun without duplicate effects.

The CLI must:

* implement `npm run db:migrate -- --database <path>`;
* require an explicit database path;
* accept an explicit migrations directory, build identifier, environment, and production persistent root when supplied;
* never use a hidden production default;
* return a nonzero exit code and safe error code on failure;
* never run from HTTP, startup, a read endpoint, or the frontend.

---

# Part 4 - Test Assertions

Focused tests must prove:

* exact-byte checksum and deterministic numeric discovery;
* malformed and duplicate migration rejection;
* empty migration sets validate without application DDL;
* behind state is reported without incidental application;
* two synthetic migrations commit in order with exact ledger metadata and `user_version`;
* rerun is idempotent;
* changed checksum and file name fail closed;
* ahead and `user_version` mismatch fail closed;
* a failing migration leaves no partial application table, ledger row, or version advance;
* the explicit CLI migrates a temporary database and fails safely without `--database`;
* server startup and reads do not import or invoke migration execution;
* every fixture and artifact is removed after the test.

---

# Part 5 - Safety Rules

* Use only synthetic SQL and operating-system temporary directories.
* Do not create `0001_initial.sql` or application tables.
* Do not inspect or import league JSON.
* Do not wire migrations into config, bootstrap, HTTP, services, repositories, jobs, or frontend code.
* Do not automatically migrate on open or startup.
* Do not access staging, Render, production paths, or production secrets.
* Preserve JSON authority and all unrelated work.
* Do not commit, push, merge, deploy, reset, or cut over.

---

# Part 6 - Execution Sequence

1. Activate M2-03 and record safety baselines.
2. Add repository migration-layout documentation.
3. Add deterministic discovery, ledger, validation, and transactional execution.
4. Add the explicit CLI and package script.
5. Add focused synthetic migration tests.
6. Run focused migration and prior foundation tests.
7. Run characterization and complete Node suites plus syntax and whitespace checks.
8. Reconcile protected hashes, database artifacts, processes, and both worktrees.
9. Archive M2-03 and activate M2-04.

---

# Part 7 - Verification

```powershell
node --test test/foundation/nodeRuntimeFoundation.test.js test/foundation/sqliteConnectionFoundation.test.js test/foundation/sqliteMigrationFoundation.test.js
npm.cmd run db:migrate -- --database <temporary-path> --migrations <temporary-directory> --build test-build
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/infrastructure/database/migrate.js
node --check scripts/db-migrate.js
git diff --check
git status --short
```

Required:

* every focused state, transaction, checksum, ledger, compatibility, CLI, and cleanup assertion passes;
* existing compatibility and complete tests pass;
* protected JSON hashes remain unchanged;
* no repository database artifact remains;
* no application DDL, repository conversion, bootstrap, authority, source-data, staging, production, frontend-source, commit, push, merge, deployment, reset, or cutover change occurs.

---

# Part 8 - Stop Conditions

Stop when:

* exact-byte checksums are not deterministic;
* ledger, SQL, and `user_version` cannot commit or roll back atomically;
* compatibility states cannot fail closed;
* the explicit CLI would require a production default;
* a test requires application schema or broader source changes;
* a protected hash or unrelated local modification changes;
* completion requires copied data, schema, repositories, bootstrap, staging, production, or frontend work.

---

# Part 9 - Rollback

Remove only:

```text
database/README.md
scripts/db-migrate.js
src/infrastructure/database/migrate.js
test/foundation/sqliteMigrationFoundation.test.js
```

Restore only M2-03 changes within:

```text
package.json
src/infrastructure/database/connection.js
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Do not alter cumulative M1 through M2-02 or unrelated frontend work. No data rollback should be required because every migration database is a disposable temporary fixture.

---

# Part 10 - Completion Checklist

M2-03 completes only when:

* discovery, checksum, ledger, compatibility, transactional execution, rerun, rollback, and CLI gates pass;
* no application migration or schema exists yet;
* startup and reads remain migration-free;
* existing suites and safety gates pass;
* temporary fixtures are removed;
* completion evidence is archived;
* work transitions to M2-04 full approved relational schema.

No application schema, repository, import, authority, staging, production, frontend-source, commit, push, merge, deployment, reset, or cutover authority is included.

---

# Part 11 - Completion Evidence

Created:

```text
database/README.md
scripts/db-migrate.js
src/infrastructure/database/migrate.js
test/foundation/sqliteMigrationFoundation.test.js
```

Modified:

```text
package.json
```

Verified on 2026-07-19:

* 14 of 14 combined runtime, connection, and migration-foundation checks passed;
* 164 of 164 characterization tests passed;
* 186 of 186 complete Node test entries passed across 43 suites;
* exact-byte SHA-256 discovery and numeric ordering passed;
* malformed and duplicate migration IDs failed closed;
* empty, behind, exact, ahead, changed-name, changed-checksum, and `user_version` mismatch states passed;
* two synthetic migrations committed SQL, ledger metadata, and `user_version` atomically in order;
* exact rerun performed no duplicate work;
* a failing migration rolled back its SQL, ledger row, and version advance;
* the explicit CLI succeeded with an explicit temporary database and failed safely without `--database`;
* startup and read paths did not import or invoke migration execution;
* all failed-run and successful-run temporary fixtures were removed;
* syntax, whitespace, protected hashes, and no-repository-database-artifact checks passed;
* no application migration, schema, repository, bootstrap, source data, authority, staging, production, frontend source, commit, push, merge, deployment, reset, or cutover changed.

Outcome:

```text
SQLite Foundation and Migration Step 3: COMPLETE
Milestone M2: IN PROGRESS
Next implementation plan: M2-04
```
