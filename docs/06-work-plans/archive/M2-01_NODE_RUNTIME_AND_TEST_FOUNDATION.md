# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-01
```

## Active Step

```text
SQLite Foundation and Migration Step 1 - Node Runtime and Test Foundation
```

Grae approved the M2 planning boundary, the canonical work-plan update, and this first implementation step on 2026-07-19.

M2-01 is limited to pinning and verifying the approved Node.js runtime. It does not add SQLite, change persistence authority, or modify application behavior.

---

## Objective

Pin the backend to the approved Node.js `24.14.1` runtime and add a focused automated foundation check before any SQLite driver, connection, migration, repository, import, staging, or cutover work begins.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
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
../hundo-leago/docs/06-work-plans/archive/BR-13_REFACTOR_COMPLETION_GATE.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm the backend branch is `stage2`.
2. Confirm the completed BR-01 through BR-13 backend work remains present and uncommitted.
3. Confirm the canonical documentation working tree and preserve unrelated frontend source changes.
4. Record hashes for protected repository JSON files and package manifests.
5. Confirm the installed Node version and available runtime-management path.
6. Stop if this step would require SQLite, application-source, persistence, frontend-source, production, or data changes.

---

# Part 2 - Exact Scope

Create:

```text
.node-version
test/foundation/nodeRuntimeFoundation.test.js
```

Modify:

```text
package.json
package-lock.json
```

The exact runtime declarations are:

```text
.node-version: 24.14.1
package engines.node: >=24.14.1 <25
package-lock root engines.node: >=24.14.1 <25
```

No other backend or frontend source file is in scope.

---

# Part 3 - Completion Assertions

The focused foundation test must prove:

* `.node-version` contains exactly `24.14.1`;
* `package.json` declares `>=24.14.1 <25`;
* the lockfile root package declares the identical engine range;
* the executing Node runtime is exactly `24.14.1`;
* the package and lockfile continue to agree on name, version, dependencies, and development dependencies;
* no SQLite dependency is introduced in this step.

The full evidence must additionally prove:

* all existing characterization and complete Node tests still pass;
* syntax and whitespace checks pass;
* protected repository JSON files remain byte-for-byte unchanged;
* no database, WAL, shared-memory, temporary persistence, or lock artifact is created;
* no application behavior or persistence authority changes.

---

# Part 4 - Safety Rules

* Do not add `better-sqlite3` or any other dependency.
* Do not create a database connection, schema, migration, database file, source bundle, reset manifest, import report, backup, or restore artifact.
* Do not edit application source, routes, services, repositories, jobs, adapters, frontend source, or protected repository JSON.
* Do not run a seed, reset, cleanup, migration, staging, production, cutover, or deployment operation.
* Do not weaken an existing test.
* Preserve all unrelated local modifications in both repositories.
* Do not commit, push, merge, or deploy.

---

# Part 5 - Execution Sequence

1. Record backend and frontend worktree state and protected hashes.
2. Establish Node.js `24.14.1` locally through the available approved runtime-management path.
3. Add `.node-version`.
4. Add the Node engine range to `package.json` and the lockfile root package.
5. Add the focused runtime-foundation test.
6. Run the focused test under Node.js `24.14.1`.
7. Run the complete characterization and Node suites plus syntax and whitespace checks.
8. Reconcile protected hashes, dependency declarations, generated artifacts, processes, and both worktrees.
9. Record completion evidence and stop before M2-02.

---

# Part 6 - Verification

```powershell
node --version
node --test test/foundation/nodeRuntimeFoundation.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
git diff --check
git status --short
```

Required:

* `node --version` returns `v24.14.1`;
* the focused test passes all assertions;
* all existing characterization and complete Node tests pass;
* package metadata and lockfile declarations agree;
* protected JSON hashes match the recorded baseline;
* no SQLite dependency or database artifact exists;
* only the four exact backend files and this canonical work-plan file are added or modified by M2-01;
* no production, data, frontend-source, commit, push, merge, or deployment operation occurred.

---

# Part 7 - Stop Conditions

Stop when:

* Node.js `24.14.1` cannot be installed or selected safely;
* a focused or existing test fails for a reason requiring broader source changes;
* package metadata cannot be synchronized without changing dependencies;
* a protected hash changes;
* completion requires SQLite, application-source, persistence, frontend-source, schema, data, staging, production, cutover, or deployment work;
* rollback cannot be limited to the four exact backend files and this work-plan transition.

---

# Part 8 - Rollback

Remove only:

```text
.node-version
test/foundation/nodeRuntimeFoundation.test.js
```

Restore only the M2-01 changes within:

```text
package.json
package-lock.json
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Do not restore, discard, stash, or otherwise alter the completed BR-01 through BR-13 work or unrelated frontend changes.

No data rollback should be required because M2-01 creates no database and changes no league data.

---

# Part 9 - Completion Checklist

M2-01 completes only when:

* Node.js `24.14.1` is selected for verification;
* all runtime declarations and the focused test agree;
* existing test and safety gates pass;
* protected files remain unchanged;
* the user receives a completion report;
* work stops before the separately planned M2-02 driver and connection-factory step.

No production, dependency, SQLite, data, frontend-source, commit, push, merge, deployment, migration, reset, or cutover authority is included.

---

# Part 10 - Completion Evidence

Files created:

```text
.node-version
test/foundation/nodeRuntimeFoundation.test.js
```

Files modified:

```text
package.json
package-lock.json
```

Verified on 2026-07-19:

* the official Node.js Windows x64 portable archive was downloaded outside both repositories and matched the signed SHA-256 checksum;
* `node --version` returned `v24.14.1`;
* the focused runtime foundation passed 3 of 3 tests;
* the characterization suite passed 164 of 164 tests across 41 suites;
* the complete Node suite passed 175 of 175 test entries across 41 suites;
* `.node-version`, `package.json`, and the lockfile root package declared the approved runtime values;
* package and lockfile dependency declarations remained synchronized;
* no dependency was added and `better-sqlite3` remained absent;
* `npm.cmd run check`, the focused test syntax check, backend `git diff --check`, and canonical-document `git diff --check` passed;
* all five protected repository JSON hashes matched the recorded baseline;
* no SQLite database, WAL, shared-memory, or database-lock artifact existed in the repository;
* the completed BR-01 through BR-13 backend work and unrelated frontend source modification remained untouched;
* no application behavior, persistence authority, production data, frontend source, commit, push, merge, deployment, migration, reset, or cutover changed.

Outcome:

```text
SQLite Foundation and Migration Step 1: COMPLETE
Milestone M2: IN PROGRESS
Next implementation plan: NONE ACTIVE
```
