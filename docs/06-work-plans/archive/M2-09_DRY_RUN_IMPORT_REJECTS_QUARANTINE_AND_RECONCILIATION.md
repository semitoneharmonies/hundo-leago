# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-09
```

## Active Step

```text
SQLite Foundation and Migration Step 9 - Dry-Run Import, Rejects, Quarantine, and Reconciliation
```

Grae approved continuous technical execution through the M2 gate on 2026-07-19. M2-08 passed every gate, so this exact plan activates M2-09 without another continuation prompt.

M2-09 creates a byte-exact external bundle from explicitly named current repository sources, inspects only copied bytes, implements exact observed source-shape adapters, validates transformed rows against a temporary SQLite schema inside a rolled-back transaction, and writes safe reconciliation reports. It does not change source files, retain imported rows, select SQLite as application authority, or access production.

---

## Objective

Implement the documented `db:import-json --dry-run` contract with deterministic source adapters, manifest-controlled omissions, protected-data preservation, blocking rejects/quarantine, constraint validation, and machine/human reports tied to exact source-bundle and reset-manifest checksums.

---

# Part 1 - Explicit Current Source Bundle

Run the existing inventory command once with a new output below the operating-system temporary directory and these explicit repository sources when present:

```text
league_state=league-state.json
players=players.json
legacy_league=league.json
legacy_dump=league_dump.json
legacy_with_meta=league_with_meta.json
backups=backups/
snapshots=snapshots/
snapshots_local=snapshots-local/
```

Rules:

* capture every named source as exact bytes;
* record the current source Git commit and application build when available;
* never create the bundle inside either repository;
* verify the bundle before inspecting it;
* inspect copied files only;
* treat legacy variants, backups, and snapshots as recovery evidence unless an exact adapter explicitly selects them;
* compare all original hashes, sizes, and mtimes after capture.

The authoritative import inputs for this step are the copied `league_state` and `players` sources. If either is absent or malformed, dry-run fails. There is no implicit fallback to a legacy or recovery file.

---

# Part 2 - Exact Scope

Create:

```text
scripts/db-import-json.js
src/infrastructure/migration/importReport.js
src/infrastructure/migration/runJsonImport.js
src/infrastructure/migration/sourceShapeAdapters.js
test/foundation/jsonImportDryRun.test.js
```

Modify:

```text
database/README.md
package.json
```

Canonical completion records:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/06-work-plans/archive/M2-09_DRY_RUN_IMPORT_REJECTS_QUARANTINE_AND_RECONCILIATION.md
```

No schema, migration SQL, repository contract, application bootstrap, protected source, frontend source, or production resource is in scope.

---

# Part 3 - Source-Shape Adapters

After verifying the bundle, record one explicit version identifier for each supported observed shape.

Adapters must:

* accept only exact required top-level types and supported keys;
* select only copied `league_state` and `players`;
* preserve stable provider player IDs exactly;
* derive deterministic internal IDs through M2-08;
* translate protected league identity/configuration and global player/stat records when present;
* classify only explicit observed Season 1 competition collections into the corresponding M2-07 omission family;
* count every source record as imported, omitted, rejected, quarantined, evidence-only, or explicitly ignored metadata;
* fail on unlisted data, unknown protected collections, duplicate player IDs, ambiguous relationships, or unsupported shapes;
* never read hard-coded frontend credential source.

Legacy variants, backups, and snapshots remain counted recovery evidence and are not interpreted as additional authoritative records.

---

# Part 4 - Dry-Run Command

The exact command is:

```powershell
npm run db:import-json -- `
  --source-bundle <verified-bundle-path> `
  --database <new-temporary-database-path> `
  --reset-manifest database/reset-manifests/2026-season-1-reset.json `
  --report <new-report-directory> `
  --environment test `
  --operating-mode OFFSEASON_RESET `
  --dry-run
```

Every argument and `--dry-run` is required in M2-09. Unknown, repeated, missing, or implicit arguments fail.

The database and report paths must not exist, must be outside the repository, must not overlap the source bundle, and must be inside an approved operating-system temporary root. The command:

1. verifies the source bundle and reset manifest;
2. migrates a new temporary database to the exact schema;
3. builds a deterministic import plan;
4. starts `BEGIN IMMEDIATE`;
5. applies all planned rows through prepared repository inserts;
6. runs foreign-key and semantic checks;
7. records validation evidence;
8. always rolls back imported rows;
9. verifies only migration-ledger rows remain;
10. atomically publishes the report directory.

Failure removes only command-owned new database sidecars and report temporaries. It never overwrites an existing path.

---

# Part 5 - Rejects and Quarantine

Stable categories include:

```text
IMPORT_ARGUMENT_INVALID
IMPORT_PATH_UNSAFE
IMPORT_SOURCE_INVALID
IMPORT_SOURCE_SHAPE_UNSUPPORTED
IMPORT_MANIFEST_INVALID
IMPORT_PROTECTED_DATA_AT_RISK
IMPORT_MAPPING_NOT_FOUND
IMPORT_MAPPING_AMBIGUOUS
IMPORT_CONSTRAINT_FAILED
IMPORT_RECONCILIATION_FAILED
IMPORT_REPORT_FAILED
```

Blocking rejects stop success. Quarantine entries may be written to the report for review but do not permit a successful dry-run gate while blocking. Entries contain only source label, copied relative path, collection, stable source key or its SHA-256 reference, safe code, and disposition; they do not reproduce private payloads, passwords, active bid values, or unrestricted JSON.

---

# Part 6 - Reconciliation Reports

Publish:

```text
import-report.json
import-report.md
```

The canonical JSON report includes:

* report/schema/importer versions;
* source-bundle ID and checksum;
* reset-manifest ID and checksum;
* schema migration ledger/checksums;
* dry-run and rolled-back status;
* source shape versions;
* source collection counts;
* per-target planned and validated row counts;
* per-family reset omission counts and count treatment;
* protected-family preservation checks;
* deterministic ID mapping entries;
* money count/sum reconciliation;
* ownership/relationship checks;
* rejects, quarantine, repairs, warnings, and defaults;
* integrity, foreign-key, and semantic check results;
* a canonical semantic report hash.

The Markdown file summarizes the same evidence without introducing untracked facts.

---

# Part 7 - Verification

Focused tests use synthetic temporary bundles/databases/reports and cover:

* exact supported shapes and deterministic output;
* every reset family and protected-family guard;
* provider player ID preservation and duplicate/ambiguous failure;
* missing, malformed, unsupported, unlisted, and protected-at-risk sources;
* report count and hash reconciliation;
* safe reject/quarantine output;
* prepared insert constraint failure and transaction rollback;
* existing/overlapping/inside-repository path rejection;
* repeat dry-runs with identical semantic reports;
* unchanged source bytes and no imported target rows after rollback.

The explicit current bundle dry-run must then pass with zero blocking rejects. Run cumulative foundation, characterization, full Node, syntax, whitespace, protected-hash, artifact, process, and both-worktree gates.

---

# Part 8 - Safety Rules

* Read and copy current source only through the explicit inventory command.
* Inspect copied bundle bytes, never live source bytes, during import.
* Do not modify source files, backups, snapshots, or their timestamps.
* Do not silently select a legacy/recovery fallback.
* Do not broaden reset families or omit protected/unlisted data.
* Do not import hard-coded frontend credentials.
* Do not retain dry-run imported rows.
* Do not write inside either repository.
* Do not access production storage or secrets.
* Do not select SQLite as application authority.
* Preserve all prior and unrelated work.
* Do not commit, push, merge, deploy, reset, or cut over.

---

# Part 9 - Execution Sequence

1. Activate M2-09 and verify baselines.
2. Create and verify the explicit external current source bundle.
3. Inspect only copied shapes and write the exact adapters.
4. Add deterministic planning, rollback validation, and reports.
5. Add the explicit CLI and synthetic tests.
6. Run the current copied-bundle dry-run and every verification gate.
7. Archive M2-09 and activate M2-10 database-safe backup and restore verification.

---

# Part 10 - Completion Checklist

M2-09 completes only when:

* the current source bundle is byte-exact and verified;
* exact copied shapes are supported without guesses;
* reset omissions reconcile to the immutable manifest;
* protected identities and all unlisted data are preserved or block;
* constraint execution rolls back every imported row;
* JSON and Markdown reports are deterministic, complete, and safe;
* the explicit current copied-bundle dry-run has zero blocking rejects;
* existing suites and safety gates pass;
* work transitions to M2-10 database-safe backup and restore verification.

No persistent copied-data import, application-authority selection, staging, production, frontend-source, commit, push, merge, deployment, or cutover authority is included.

---

# Completion Evidence

Completed on 2026-07-19. The verified current source bundle contains `207` files and `31,092,929` bytes with content ID `source-bundle-v1-d9a882d888b5caabea45b3f862e39f9c77b0e0419d8f0cd91befbdea7a3a4e71`. Two current copied-data dry runs each validated and rolled back `6,099` protected player rows with zero rejects/quarantine and produced byte-identical canonical reports (SHA-256 `994a2f1b0ca6f4ff162978a116a05beba8fbe1e5c24d0089c57bbb8ed9d38082`).

Focused tests passed `8/8`; cumulative foundation passed `60/60`; characterization passed `164/164`; the complete suite passed `232/232` across `49` suites. Integrity was `ok`, foreign-key violations were zero, protected hashes were unchanged, and no repository data artifact or production action occurred.
