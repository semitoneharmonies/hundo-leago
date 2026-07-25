# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-05
```

## Active Step

```text
SQLite Foundation and Migration Step 5 - SQLite Repository Foundation
```

Grae approved continuous technical execution through the M2 gate on 2026-07-19. M2-04 passed every gate, so this exact plan activates M2-05 without another continuation prompt.

M2-05 establishes transaction-aware, league-safe SQLite repository primitives behind the service boundary. It does not select SQLite in application composition, translate source JSON, import records, replace JSON authority, or access staging or production.

---

## Objective

Implement an explicit repository catalog and reusable SQLite record repositories for the approved initial schema.

Prove that repository reads are prepared and scope-safe, writes validate JavaScript values, optimistic versions fail closed, database constraints map to stable repository errors, and multi-row work commits or rolls back in one `IMMEDIATE` transaction.

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
../hundo-leago/docs/06-work-plans/archive/M2-04_INITIAL_RELATIONAL_SCHEMA.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm backend `stage2`, cumulative M1 through M2-04 work, and both worktrees.
2. Record protected JSON hashes and confirm no repository database artifact.
3. Confirm Node.js `24.14.1`, driver `12.11.1`, and schema version `1`.
4. Map the complete schema inventory into required-league, optional-league, and global repository scopes.
5. Stop if the repository layer would require source-data interpretation, product-policy decisions, bootstrap wiring, or a persistence-authority change.

---

# Part 2 - Exact Scope

Create:

```text
src/infrastructure/persistence/sqlite/SqliteRepositoryError.js
src/infrastructure/persistence/sqlite/repositoryCatalog.js
src/infrastructure/persistence/sqlite/createSqliteRecordRepository.js
src/infrastructure/persistence/sqlite/createSqliteRepositoryContext.js
test/foundation/sqliteRepositoryFoundation.test.js
```

Canonical completion records:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/06-work-plans/archive/M2-05_SQLITE_REPOSITORY_FOUNDATION.md
```

No existing application JavaScript, bootstrap composition, JSON repository, migration, schema, source JSON, or frontend source is in scope.

---

# Part 3 - Repository Catalog

The catalog must:

* explicitly list every approved application table except the migration ledger;
* classify each table as global, required-league, or optional-league scope;
* identify the stable key column and whether the table has an aggregate `version`;
* reject unknown, duplicate, malformed, or schema-incompatible definitions;
* keep SQL identifiers code-owned rather than caller-supplied;
* expose immutable definitions.

The runtime factory must compare the catalog with the migrated schema and fail closed for missing tables, missing keys, invalid scope columns, or version mismatches.

---

# Part 4 - Record Repository Contract

Every repository must:

* use prepared, parameterized statements;
* expose only its catalog-owned table and columns;
* validate record objects and reject unknown fields;
* reject unsafe JavaScript integers before statement execution;
* return plain cloned records rather than driver-owned mutable state;
* require an explicit league ID for required-league reads;
* require an explicit league ID or explicit `null` for optional-league reads;
* include `league_id` in every league-scoped lookup;
* expose global lookups only for global tables;
* provide deterministic key ordering;
* provide insert and versioned-update operations without generic delete.

`league_settings` uses `league_id` as both its stable key and required scope.

Versioned updates must:

* require a positive safe expected version;
* reject attempts to modify the key, league scope, or version directly;
* increment `version` exactly once;
* distinguish missing records from stale versions without changing data;
* map constraint failures to a stable repository error.

---

# Part 5 - Transaction Contract

The repository context must:

* receive an already opened and migrated database;
* never open a database or run migrations itself;
* expose the complete immutable repository map;
* execute multi-row callbacks through `BEGIN IMMEDIATE`;
* reject asynchronous transaction callbacks;
* commit all successful statements once;
* roll back every statement on error;
* support a contained nested transaction through SQLite savepoint behavior;
* never perform network, filesystem, Socket.IO, or external side effects.

Single-row repository methods may run directly. Services remain responsible for placing multi-row business operations in one context transaction.

---

# Part 6 - Error Contract

Stable internal error codes:

```text
REPOSITORY_ARGUMENT_INVALID
REPOSITORY_CATALOG_INVALID
REPOSITORY_SCHEMA_INCOMPATIBLE
REPOSITORY_SCOPE_REQUIRED
REPOSITORY_RECORD_NOT_FOUND
REPOSITORY_VERSION_CONFLICT
REPOSITORY_CONSTRAINT
REPOSITORY_TRANSACTION_ASYNC
REPOSITORY_OPERATION_FAILED
```

The original driver error remains available as `cause`, but feature policy and HTTP status mapping remain outside this step.

---

# Part 7 - Test Assertions

Focused real-database tests must prove:

* the catalog covers every schema table except `schema_migrations`;
* catalog scope matches actual `league_id` nullability;
* context creation fails for an incompatible schema;
* global, required-league, optional-league, and `league_settings` lookups pass;
* required and optional league scope cannot be omitted;
* same IDs in separate leagues never cross a scoped read;
* inserts use approved columns and reject unknown fields and unsafe integers;
* global and league uniqueness constraints map to `REPOSITORY_CONSTRAINT`;
* versioned updates increment once and reject stale, missing, or forbidden changes;
* read calls leave `total_changes`, `data_version`, and table content unchanged;
* successful multi-row work commits;
* a later constraint or explicit failure rolls back every row;
* asynchronous transaction callbacks fail and roll back;
* nested transactional work remains atomic;
* no repository database artifact remains.

---

# Part 8 - Safety Rules

* Use only disposable operating-system temporary databases.
* Do not inspect, copy, transform, or import repository JSON.
* Do not wire the context into `createDependencies`, `createCompatibilityRuntime`, routes, services, jobs, or server startup.
* Do not add generic delete, erase, cascade, migration, or reset behavior.
* Do not expose raw SQL or caller-selected table or column identifiers.
* Do not create a database in the repository.
* Do not access staging or production.
* Preserve all prior and unrelated work.
* Do not commit, push, merge, deploy, reset, or cut over.

---

# Part 9 - Execution Sequence

1. Activate M2-05 and record safety baselines.
2. Add the explicit repository catalog and stable error type.
3. Add the scoped prepared record repository.
4. Add the repository context and `IMMEDIATE` transaction boundary.
5. Add catalog, scope, read-only, version, error, and transaction tests.
6. Run focused repository and cumulative foundation suites.
7. Run characterization and complete Node suites plus syntax and whitespace checks.
8. Reconcile protected hashes, database artifacts, processes, and both worktrees.
9. Archive M2-05 and activate M2-06 source inventory and bundle hashing.

---

# Part 10 - Verification

```powershell
node --test test/foundation/sqliteRepositoryFoundation.test.js
node --test test/foundation/nodeRuntimeFoundation.test.js test/foundation/sqliteConnectionFoundation.test.js test/foundation/sqliteMigrationFoundation.test.js test/foundation/sqliteInitialSchema.test.js test/foundation/sqliteRepositoryFoundation.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
git diff --check
git status --short
```

Required:

* all catalog, schema, scope, prepared-read, write, safe-integer, version, error, transaction, rollback, and cleanup assertions pass;
* all existing tests pass;
* protected JSON hashes remain unchanged;
* no repository database artifact remains;
* no source-data, bootstrap, authority, staging, production, frontend-source, commit, push, merge, deployment, reset, or cutover change occurs.

---

# Part 11 - Stop Conditions

Stop when:

* catalog scope conflicts with the approved schema;
* a repository operation cannot guarantee league scoping;
* a write requires product policy or source-data interpretation;
* transaction rollback, version, or constraint mapping cannot fail closed;
* a fix requires bootstrap, JSON authority, schema, or application service changes;
* a protected hash or unrelated local modification changes;
* completion requires source import, staging, production, or frontend work.

---

# Part 12 - Rollback

Remove only:

```text
src/infrastructure/persistence/sqlite/SqliteRepositoryError.js
src/infrastructure/persistence/sqlite/repositoryCatalog.js
src/infrastructure/persistence/sqlite/createSqliteRecordRepository.js
src/infrastructure/persistence/sqlite/createSqliteRepositoryContext.js
test/foundation/sqliteRepositoryFoundation.test.js
```

Restore only M2-05 changes within:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Do not alter cumulative M1 through M2-04 or unrelated frontend work. No data rollback should be required because every database is a disposable temporary fixture.

---

# Part 13 - Completion Checklist

M2-05 completes only when:

* the catalog covers and validates the complete approved schema;
* global and league-scoped repository contracts fail closed;
* safe values, stable errors, optimistic versions, and atomic transactions pass;
* reads are proven read-only;
* application composition and JSON authority remain unchanged;
* existing suites and safety gates pass;
* completion evidence is archived;
* work transitions to M2-06 source inventory and source-bundle hashing.

No source-data interpretation, import, bootstrap selection, application-authority, staging, production, frontend-source, commit, push, merge, deployment, reset, or cutover authority is included.

---

# Part 14 - Completion Evidence

Created:

```text
src/infrastructure/persistence/sqlite/SqliteRepositoryError.js
src/infrastructure/persistence/sqlite/repositoryCatalog.js
src/infrastructure/persistence/sqlite/createSqliteRecordRepository.js
src/infrastructure/persistence/sqlite/createSqliteRepositoryContext.js
test/foundation/sqliteRepositoryFoundation.test.js
```

Verified on 2026-07-19:

* the immutable catalog covered all 76 application tables and excluded only `schema_migrations`;
* every catalog key, league scope, and version declaration matched live schema introspection;
* context creation failed closed for missing or unexpected schema tables;
* global, required-league, optional-league, and `league_settings` lookups passed;
* wrong or omitted league scope returned no cross-league record or a stable scope error;
* read methods changed neither `total_changes`, `data_version`, nor table content;
* returned rows were caller-owned copies;
* inserts rejected unknown fields, unsafe integers, booleans, and uniqueness conflicts before or at the correct boundary;
* database constraint causes mapped to `REPOSITORY_CONSTRAINT`;
* optimistic updates incremented once and distinguished stale, missing, scoped, forbidden, and constrained states;
* successful multi-row work committed;
* explicit, constraint, asynchronous, and outer-after-nested failures rolled back every row;
* nested successful work committed through the contained transaction boundary;
* repositories exposed no raw query, generic delete, database opening, or migration surface;
* 7 of 7 M2-05 focused repository checks passed;
* 29 of 29 cumulative M2 foundation checks passed;
* 164 of 164 characterization tests passed;
* 201 of 201 complete Node test entries passed across 45 suites;
* syntax, whitespace, protected hashes, temporary cleanup, and no-repository-database-artifact checks passed;
* pre-existing unrelated Node processes were left untouched, and no M2 test or server process remained;
* no existing application source, bootstrap composition, JSON repository, persistence authority, source data, staging, production, frontend source, commit, push, merge, deployment, reset, or cutover changed.

Outcome:

```text
SQLite Foundation and Migration Step 5: COMPLETE
Milestone M2: IN PROGRESS
Next implementation plan: M2-06
```
