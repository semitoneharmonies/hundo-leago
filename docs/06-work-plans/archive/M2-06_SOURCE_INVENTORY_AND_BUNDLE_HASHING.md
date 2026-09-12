# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-06
```

## Active Step

```text
SQLite Foundation and Migration Step 6 - Source Inventory and Bundle Hashing
```

Grae approved continuous technical execution through the M2 gate on 2026-07-19. M2-05 passed every gate, so this exact plan activates M2-06 without another continuation prompt.

M2-06 implements read-only source inventory and byte-exact source bundles using synthetic temporary fixtures. It does not interpret current league rules, transform a record, apply a reset manifest, import into SQLite, or create a persistent bundle from protected repository data.

---

## Objective

Add an explicit command and reusable module that inventories caller-named files or directories, copies them without mutation into a new atomic bundle, records source paths and safe structural metadata, derives a content-addressed source-bundle ID, and verifies the manifest and copied files fail closed.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/04-technical-specs/SQLITE_MIGRATION.md
../hundo-leago/docs/08-operations/BACKUP_AND_RESTORE.md
../hundo-leago/docs/06-work-plans/archive/M2-05_SQLITE_REPOSITORY_FOUNDATION.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm backend `stage2`, cumulative M1 through M2-05 work, and both worktrees.
2. Record protected JSON hashes and confirm no repository database or bundle artifact.
3. Confirm source inventory requirements and source-path safety.
4. Use synthetic operating-system temporary sources for implementation tests.
5. Stop if this step requires current source interpretation, reset decisions, transformation, import, staging, or production access.

---

# Part 2 - Exact Scope

Create:

```text
scripts/db-inventory.js
src/infrastructure/migration/sourceInventory.js
test/foundation/sourceInventory.test.js
```

Modify:

```text
package.json
```

Canonical completion records:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/06-work-plans/archive/M2-06_SOURCE_INVENTORY_AND_BUNDLE_HASHING.md
```

No migration, schema, repository, bootstrap, source JSON, reset manifest, or frontend source is in scope.

---

# Part 3 - Explicit Command

The command contract is:

```powershell
npm run db:inventory -- `
  --output <new-bundle-directory> `
  --captured-at-ms <utc-unix-milliseconds> `
  --source <label=absolute-or-relative-path> `
  [--source <label=path> ...] `
  [--build <application-build-id>] `
  [--git-commit <source-git-commit>]
```

Rules:

* `--output`, `--captured-at-ms`, and at least one `--source` are required;
* labels use lowercase letters, numbers, underscores, and hyphens;
* labels are unique;
* sources must exist as regular files or directories;
* output must not exist;
* output, its temporary sibling, and all sources must not overlap;
* unknown or repeated singleton arguments fail before copying;
* no current repository source is selected implicitly;
* success prints a minimal JSON summary without file contents.

---

# Part 4 - Bundle Layout and Manifest

```text
<bundle>/
|-- source-bundle.json
`-- files/
    |-- <source-label>/
    `-- ...
```

The manifest records:

* manifest version;
* source-bundle ID;
* bundle checksum;
* explicit capture time;
* application build and source Git commit when provided;
* absolute source path for each named source;
* source kind;
* deterministic relative copied path;
* byte size and exact SHA-256 for every file;
* source modification time;
* detected JSON top-level shape;
* deterministic top-level array record counts;
* parse status and a stable parse error code without raw source excerpts.

The source-bundle ID is content-addressed from a canonical descriptor of copied relative paths, sizes, hashes, shapes, counts, and parse statuses. It excludes the capture time so identical source bytes and structure produce the same ID.

The bundle checksum covers the canonical manifest payload before its checksum field. Verification recomputes both identifiers and every copied file hash and size.

---

# Part 5 - Filesystem Safety

Inventory must:

* resolve and validate all paths before creating output;
* reject symbolic links, junction traversal, unsupported file types, duplicate labels, duplicate physical sources, and case-folded copied-path collisions;
* enumerate directories in deterministic ordinal order;
* copy exact bytes;
* hash each source before and after copying;
* compare source and copied hashes and byte sizes;
* fail if source size, modification time, or hash changes during capture;
* build into a unique sibling temporary directory;
* write the manifest only after every copied file verifies;
* rename the completed temporary directory atomically to the requested new output;
* remove only its verified temporary directory on failure;
* never write to, rename, timestamp, lock, or delete a source.

---

# Part 6 - JSON Shape Safety

For files whose names end in `.json`:

* parse from copied bytes only after byte verification;
* record `array`, `object`, scalar, or parse failure;
* record the top-level array length;
* for an object, record counts only for its direct array-valued properties;
* sort count keys deterministically;
* record `JSON_PARSE_FAILED` without storing parser excerpts or source content.

Non-JSON files record `not_json` and are not parsed.

Parse failure is inventory evidence and does not by itself prevent bundle capture. Import remains responsible for rejecting an unusable source bundle.

---

# Part 7 - Test Assertions

Focused synthetic tests must prove:

* explicit file and nested-directory sources copy byte-for-byte;
* source paths, sizes, mtimes, SHA-256 hashes, shapes, counts, and parse failures are correct;
* deterministic enumeration and canonical manifest key ordering pass;
* identical content produces the same source-bundle ID;
* changed content produces a different source-bundle ID;
* capture time may change without changing the content ID;
* bundle checksum verification passes;
* copied-byte, manifest, size, ID, and checksum tampering fail closed;
* missing, duplicate, malformed, overlapping, existing-output, symlink, and unsupported sources fail safely;
* source files retain their exact hashes, sizes, and mtimes;
* a simulated copy or rename failure removes only the owned temporary output;
* the CLI requires explicit arguments, succeeds on synthetic files, and reports stable errors;
* no repository bundle or database artifact remains.

---

# Part 8 - Safety Rules

* Use only synthetic operating-system temporary sources and outputs in automated tests.
* Do not inventory the protected repository JSON files in this step.
* Do not infer source lists or default paths.
* Do not transform, normalize, repair, omit, quarantine, reset, or import records.
* Do not include file contents or JSON values in command summaries or errors.
* Do not write a bundle inside the repository.
* Do not access staging or production.
* Preserve all prior and unrelated work.
* Do not commit, push, merge, deploy, reset, or cut over.

---

# Part 9 - Execution Sequence

1. Activate M2-06 and record safety baselines.
2. Add canonical hashing, inventory, copy, manifest, and verification logic.
3. Add the explicit inventory CLI and package script.
4. Add synthetic content, determinism, tamper, path, cleanup, and CLI tests.
5. Run focused source-inventory and cumulative foundation suites.
6. Run characterization and complete Node suites plus syntax and whitespace checks.
7. Reconcile protected hashes, bundle/database artifacts, processes, and both worktrees.
8. Archive M2-06 and activate M2-07 explicit Season 1 reset manifest.

---

# Part 10 - Verification

```powershell
node --test test/foundation/sourceInventory.test.js
node --test test/foundation/nodeRuntimeFoundation.test.js test/foundation/sqliteConnectionFoundation.test.js test/foundation/sqliteMigrationFoundation.test.js test/foundation/sqliteInitialSchema.test.js test/foundation/sqliteRepositoryFoundation.test.js test/foundation/sourceInventory.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
git diff --check
git status --short
```

Required:

* all inventory, exact-copy, path, hash, content-ID, manifest, tamper, cleanup, and CLI assertions pass;
* all existing tests pass;
* protected JSON hashes remain unchanged;
* no repository source bundle or database artifact remains;
* no reset, transformation, import, bootstrap, authority, staging, production, frontend-source, commit, push, merge, deployment, or cutover change occurs.

---

# Part 11 - Stop Conditions

Stop when:

* a source path cannot be proven separate from output;
* copied bytes or source stability cannot be proven;
* manifest or content-ID calculation is not deterministic;
* verification cannot detect copied-file or manifest tampering;
* cleanup could remove anything other than the owned temporary output;
* a fix requires current source interpretation, reset scope, transformation, import, staging, production, or frontend work;
* a protected hash or unrelated local modification changes.

---

# Part 12 - Rollback

Remove only:

```text
scripts/db-inventory.js
src/infrastructure/migration/sourceInventory.js
test/foundation/sourceInventory.test.js
```

Restore only M2-06 changes within:

```text
package.json
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Do not alter cumulative M1 through M2-05 or unrelated frontend work. No data rollback should be required because every source and output is a synthetic temporary fixture.

---

# Part 13 - Completion Checklist

M2-06 completes only when:

* explicit source inventory creates a byte-exact, content-addressed, self-verifying bundle;
* source stability and output cleanup fail closed;
* no protected repository source is inventoried;
* no transform, reset, or import behavior exists;
* existing suites and safety gates pass;
* completion evidence is archived;
* work transitions to M2-07 explicit Season 1 reset manifest.

No current-source inventory, reset, transformation, import, bootstrap selection, application-authority, staging, production, frontend-source, commit, push, merge, deployment, or cutover authority is included.

---

# Completion Evidence

Completed on 2026-07-19.

Implemented:

* explicit caller-selected source inventory;
* byte-exact, content-addressed source bundles;
* canonical manifests with per-file SHA-256, size, mtime, JSON shape, and safe record counts;
* source-stability checks, path-overlap and link rejection, atomic publication, and owned-temporary cleanup;
* bundle and copied-file tamper verification;
* an explicit CLI with no default repository source selection and content-free summaries.

Verification results:

* focused source-inventory suite: `7/7` tests passed;
* cumulative M2 foundation suite: `36/36` tests passed;
* characterization suite: `164/164` tests passed;
* complete Node suite: `208/208` tests passed across `46` suites;
* syntax/import check, `git diff --check`, protected JSON hash comparison, artifact scan, process reconciliation, and both-worktree inspection passed.

Only synthetic operating-system temporary sources and outputs were used. No protected repository JSON was inventoried or modified, and no repository source bundle or SQLite database artifact remained. No reset manifest, transform, import, staging, production, frontend-source, commit, push, merge, deployment, or cutover action occurred.
