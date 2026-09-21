# Hundo Leago - SQLite Migration

## Document Status

`APPROVED`

This technical specification defines:

* the approved SQLite runtime, database layout, connection policy, and schema controls;
* the conversion of current file-backed JSON into the approved relational data model;
* the migration ledger, commands, reports, validation, cutover, rollback, and recovery rules;
* the handling of resettable Season 1 records and protected project data;
* the backup and production safeguards required before SQLite becomes authoritative;
* technical decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the SQLite-migration decisions and approved adoption of the resulting design on 2026-07-18.

---

## Technical Purpose

Hundo Leago must replace mutable JSON files with one transactional SQLite database per environment.

The migration must:

* preserve protected data;
* reset only records explicitly authorized by the current operating mode and an approved reset manifest;
* implement the relationships and constraints in `DATA_MODEL.md`;
* make multi-record league operations atomic;
* prevent read requests from writing;
* produce a reproducible explanation of every imported, omitted, rejected, and transformed record;
* prove the new database is internally consistent before it receives live writes;
* preserve a usable rollback point.

SQLite becomes authoritative only after an explicit, verified cutover. Merely adding a database file or migration library does not authorize removal or mutation of current JSON data.

---

## Out of Scope

This specification does not itself:

* perform the migration;
* reset production data;
* deploy a new backend build;
* define product behaviour already owned by rule and product specifications;
* replace the approved logical model in `DATA_MODEL.md`;
* select an email provider;
* define backup retention periods owned by `BACKUP_AND_RESTORE.md`;
* authorize dual writes to JSON and SQLite;
* authorize production access from local scripts.

Implementation must be divided into small work-plan steps with a backup, verification result, and rollback path for each step.

---

# Part 1 - Authority and Safety

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/04-technical-specs/SECURITY.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/08-operations/BACKUP_AND_RESTORE.md
```

`DATA_MODEL.md` owns the logical entities, relationships, invariants, and history requirements. This document owns how that model is represented, migrated, verified, and introduced safely in SQLite.

---

## Current Operating Mode

The reviewed operating mode is:

```text
OFFSEASON_RESET
```

This permits a future controlled reset of explicitly approved Season 1 competition records. It does not make the database, player identifiers, source files, secrets, documentation, backups, or new Season 2 account data disposable.

No command in this specification is permission to execute a production migration or reset.

---

## Safety Invariants

The migration must always satisfy these invariants:

1. Source JSON is copied and hashed before transformation.
2. Migration never edits a source JSON file in place.
3. Production and staging use separate storage, secrets, and databases.
4. A database is built at a temporary path before it can replace the authoritative path.
5. Every reset omission is named by an approved, versioned reset manifest.
6. Unknown or ambiguous data causes a failure or quarantine report; it is never guessed into a relationship.
7. No application traffic writes during the final production cutover.
8. No dual-write period is permitted.
9. A failed migration leaves the previous authoritative store intact.
10. Read-only HTTP routes remain read-only after migration.

---

# Part 2 - Approved Runtime

## Node.js Version

The migration implementation targets:

```text
Node.js 24.14.1
```

The backend must add:

```text
.node-version
```

containing:

```text
24.14.1
```

and `package.json` must declare:

```json
{
  "engines": {
    "node": ">=24.14.1 <25"
  }
}
```

Local, staging, and production must use the same Node major version. The reviewed local runtime was Node `24.11.1`; it must be upgraded before migration implementation or verification begins.

The exact version may be advanced only through a separate dependency-maintenance change that verifies the SQLite driver, lockfile, tests, staging build, and Render runtime together.

---

## SQLite Driver

The approved initial driver is:

```text
better-sqlite3 12.11.1
```

It must be saved as an exact production dependency and pinned in the lockfile.

The specification originally named `12.11.2`, but that version was not published in the authoritative npm registry. Grae approved correcting the pin to the published Node 24-compatible `12.11.1` release on 2026-07-19 before driver installation.

This driver was selected because it provides:

* a small synchronous API appropriate for the current single-process modular monolith;
* explicit transaction helpers;
* prepared statements;
* a supported online-backup API;
* mature WAL-mode operation on supported Node releases.

The Node 24 built-in `node:sqlite` API is not selected because the reviewed Node 24 implementation is still marked experimental. It may be reconsidered after the project upgrades to a Node release where the API is stable and a focused migration proves equivalent behavior.

No SQLite extension loading and no driver unsafe mode are allowed.

---

## One Database Per Environment

Each environment has exactly one Hundo Leago database:

| Environment | Database |
| --- | --- |
| Local development | Local disposable or copied-data database |
| Automated test | New isolated temporary database per test or test worker |
| Staging | Staging-only persistent database |
| Production | Production-only persistent database |

The path comes from:

```text
DATABASE_PATH
```

Recommended paths are:

```text
Local:      .data/local/hundo-leago.sqlite3
Production: /opt/render/project/data/hundo/hundo-leago.sqlite3
```

Staging must use its own persistent disk and its own explicit path. It must never mount or reference the production disk.

The production path must not be silently defaulted. Production startup fails if `DATABASE_PATH` is absent, relative, unwritable, or outside the approved persistent-disk root.

SQLite sidecar files such as `-wal` and `-shm` must live beside the database on the same persistent filesystem.

---

## Process Model

The initial production deployment uses:

* one backend service instance;
* one Node.js process;
* one application database connection;
* serialized SQLite writes through short transactions.

Horizontal scaling is not approved while the service uses a single local SQLite file. Adding instances requires a new persistence design or an explicitly tested shared-storage architecture.

Scheduled jobs run through the same repository and transaction boundaries as HTTP operations. They must not open an independent uncoordinated writer.

---

# Part 3 - Database Opening and Configuration

## Central Connection Factory

Only the infrastructure database module may open SQLite.

Application routes, services, domain modules, jobs, and scripts receive repositories or an explicit database dependency. They must not call the driver directly from feature code.

Opening the database performs:

1. path and environment validation;
2. connection creation;
3. required PRAGMA configuration;
4. SQLite-version and capability checks;
5. migration-ledger validation;
6. schema-version compatibility validation;
7. a lightweight readiness query.

It must not apply migrations automatically.

---

## Required PRAGMAs

Every application connection must establish and verify:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = FULL;
PRAGMA busy_timeout = 5000;
PRAGMA wal_autocheckpoint = 1000;
PRAGMA journal_size_limit = 67108864;
PRAGMA trusted_schema = OFF;
```

The staging-only `db-commit-reset-migration-report.js` maintenance command is
the one approved lock-wait exception. After the ordinary connection factory has
established and verified the settings above, that command raises
`busy_timeout` to `60000` milliseconds and reads it back on both its serialized
zero-row/one-row decision connection and its reopened post-commit verification
connection. The longer wait remains bounded and exists only so simultaneous
operators can converge on one commit and one read-only replay while the winner
performs the complete trusted continuity proof. Ordinary application
connections remain fixed at `5000` milliseconds.

Reasons:

* foreign keys enforce approved relationships;
* WAL permits readers while the single writer commits;
* `FULL` prioritizes durable commits over small write-speed gains;
* a bounded busy timeout handles brief contention without hanging indefinitely;
* automatic checkpoints limit ordinary WAL growth;
* the journal-size limit prevents indefinite retained WAL allocation after checkpoints;
* untrusted schema reduces exposure to unsafe schema-defined behavior.

Startup fails if foreign keys are not active or WAL cannot be established on a persistent non-test database.

Tests may use an in-memory database only when they are not testing WAL, backup, restart, filesystem, or migration behavior. Migration and recovery tests must use real temporary files.

---

## Schema Representation

Tables created for the approved data model must use:

* `STRICT` tables;
* explicit primary keys;
* declared foreign keys;
* `NOT NULL` where absence is not meaningful;
* `CHECK` constraints for closed statuses, non-negative quantities, and bounded integers;
* partial unique indexes for one-current-row rules;
* explicit indexes for foreign keys and approved query paths;
* integer cents for money;
* scaled integers for fantasy points;
* UTC Unix milliseconds for persisted instants;
* lowercase canonical UUID text for application-generated IDs.

SQLite dynamic typing must not weaken the approved model. Booleans are integer `0` or `1` with a `CHECK`; enum-like values use text plus an explicit `CHECK` or authoritative reference table.

Values must remain inside JavaScript's safe-integer range. Boundary validation occurs before a statement is executed.

Core relationships, ownership, money, permissions, and status must not be hidden in JSON columns.

Append-only `ownership_events.ownership_id` is deliberately a stable historical
reference rather than a foreign key to current `player_ownerships`. This is the
documented exception that permits a release to remove current ownership without
deleting or rewriting history. The release transaction verifies the live row's
exact league, owner, version, and stable ID before deletion; all other event
relationships remain declared foreign keys.

---

## Initial Schema Order

The initial migration creates table families in dependency order:

1. schema and application metadata;
2. users, credentials, security tokens, sessions, roles, and account events;
3. leagues, settings, seasons, memberships, invitations, teams, and manager assignments;
4. players, provider IDs, source state, position corrections, ownerships, and ownership events;
5. roster slots, placements, locks, snapshots, and legality records;
6. contracts, contract-year schedules, retention, buyouts, and related events;
7. auctions and sealed bids;
8. trade proposals, participants, assets, acceptances, and execution records;
9. draft configuration, lotteries, picks, ownership history, queues, and selections;
10. stat snapshots and scoring inputs;
11. matchup periods, pairings, locked lineups, player results, team results, and corrections;
12. standings inputs and snapshots;
13. league activity, notifications, audit records, scheduled-job occurrences, idempotency records, and outbox events.

Exact fields and constraints come from `DATA_MODEL.md`. If the DDL cannot enforce a required invariant directly, the migration must document the service transaction and trigger or validation that enforces it.

---

# Part 4 - Migration Files and Ledger

## Repository Layout

The backend will use:

```text
src/
|-- infrastructure/
|   `-- database/
|       |-- connection.js
|       |-- migrate.js
|       |-- health.js
|       `-- backup.js
|-- repositories/
`-- ...
database/
|-- migrations/
|   `-- 0001_initial.sql
|-- reset-manifests/
|-- fixtures/
`-- README.md
scripts/
|-- db-migrate.js
|-- db-inventory.js
|-- db-import-json.js
|-- db-verify.js
|-- db-backup.js
`-- db-restore-verify.js
```

Migration SQL is committed source code. Generated database files, copied production JSON, reports containing private data, WAL files, and backup artifacts must be ignored by Git.

---

## Immutable Ordered Migrations

Migration IDs use four-digit increasing prefixes:

```text
0001_initial.sql
0002_example_change.sql
```

Once applied outside disposable local development, a migration file is immutable. Corrections use a new migration.

Each file has a SHA-256 checksum over its exact bytes. The checksum is stored in `schema_migrations`.

An already-applied ID with a changed checksum is a fatal startup and migration error.

---

## Migration Ledger

`schema_migrations` is authoritative and records:

* numeric migration ID;
* file name;
* SHA-256 checksum;
* application build identifier;
* started and applied UTC timestamps;
* duration in milliseconds.

Only successfully committed migrations appear as applied.

`PRAGMA user_version` mirrors the latest numeric migration ID for inspection, but it does not replace the ledger.

`application_metadata` records:

* data-model version;
* environment identity;
* database creation time;
* migration source-bundle ID;
* import completion marker;
* current application compatibility version.

It must not contain passwords, tokens, provider secrets, or league settings.

---

## Explicit Migration Command

The backend must provide:

```powershell
npm run db:migrate -- --database <path>
```

Migrations are never applied:

* during an HTTP request;
* from a read endpoint;
* as an incidental server-start side effect;
* by the frontend;
* by an unversioned production console snippet.

Production startup compares the ledger with the application migration set:

* behind: fail closed and report that an explicit migration is required;
* ahead: fail closed because the application is incompatible;
* checksum mismatch: fail closed;
* exact match: continue.

Each migration executes under an exclusive maintenance window and a `BEGIN IMMEDIATE` transaction. Migrations must remain deterministic and must not make network calls.

---

# Part 5 - Source Inventory and Reset Manifest

## Source Bundle

Before transformation, the inventory command creates a read-only source bundle containing copies of all relevant current files, including when present:

```text
league-state.json
players.json
stats-cache.json
backups/
snapshots/
```

It also records:

* absolute source paths;
* byte sizes;
* modification timestamps;
* SHA-256 hashes;
* detected top-level shape;
* record counts;
* parse failures;
* source Git commit and application build when known.

The bundle gets a unique source-bundle ID. Every dry run and final import cites that ID.

The inventory process is read-only with respect to current application files.

---

## Reset Manifest

Resettable records are omitted only through a committed, versioned manifest such as:

```text
database/reset-manifests/2026-season-1-reset.json
```

The manifest contains:

* manifest version and ID;
* applicable source-bundle or source-shape version;
* operating mode required;
* explicitly named record families to omit;
* reason for each omission;
* protected families that must be retained;
* approval reference and date;
* expected count treatment;
* checksum.

Broad labels such as `all old data` are invalid.

The approved current reset scope may include Season 1 teams, rosters, contracts, retention, buyouts, trades, auction history, matchups, standings, and other explicitly listed Season 1 competition records. Player identities and stable provider identifiers remain protected.

If source data contains new Season 2 user accounts or other protected records, the importer must preserve them or stop. The reset manifest cannot silently broaden itself.

---

## Current Frontend Credentials

Hard-coded frontend names, roles, and plaintext passwords are not migrated into `users` or `user_credentials`.

Season 2 accounts are created only through the approved secure account workflows or the one-time first-administrator bootstrap procedure.

No migration report may reproduce a plaintext password found in source code or data.

---

# Part 6 - Deterministic Transformation

## Import Command

The importer will expose:

```powershell
npm run db:import-json -- `
  --source-bundle <path> `
  --database <temporary-database-path> `
  --reset-manifest <path> `
  --report <path> `
  --dry-run
```

Removing `--dry-run` requires:

* a new or empty target database;
* an explicit environment;
* an exact source-bundle checksum match;
* an exact reset-manifest checksum match;
* a schema at the expected migration version.

The command refuses to overwrite a non-empty target unless a separate disposable-test flag is present and the target is proven to be inside an approved test directory. That flag is forbidden in staging and production.

---

## Stable ID Mapping

Imported records receive deterministic UUIDs from:

* a fixed, committed Hundo Leago migration namespace;
* the source-bundle type;
* the stable source collection;
* a stable source key.

Running the same importer against the same bundle and manifest must produce the same IDs and semantic database contents.

A mapping report records:

```text
source collection
source key
target table
target ID
mapping method
mapping confidence
```

Player mapping prioritizes stable provider identifiers. A name-only mapping is accepted only when it is uniquely resolvable under an explicit reviewed rule. Ambiguity fails the import.

Display names are never used as durable relationship keys when a stable identifier is available.

---

## Transform Rules

Transform functions must be pure and separately tested.

They must:

* normalize email and case-insensitive names according to approved specifications;
* preserve user-facing display values separately from normalized uniqueness keys;
* convert money once to integer cents using the approved nearest-cent rule;
* convert fantasy points once to the approved scaled integer;
* convert known times to UTC Unix milliseconds;
* assign explicit statuses instead of inferring state from missing fields;
* preserve provider identifiers exactly;
* construct contract-year, retention-year, and buyout-year schedules;
* preserve immutable history where the reset manifest does not authorize omission;
* record every default or repair in the report.

Importer repairs may correct only mechanically provable representation differences. They may not invent ownership, contract terms, actor identity, league membership, or approval.

---

## Reject and Quarantine Policy

The final import fails rather than guesses when:

* JSON cannot be parsed;
* a player has no stable or uniquely approved mapping;
* two teams own the same player in one league;
* a required relationship is missing;
* a cross-league relationship would result;
* money or fantasy points cannot be represented exactly under approved rounding;
* contract, retention, or buyout schedules do not reconcile under their
  approved integer-cent rounding rules;
* a protected record would be omitted;
* an unsupported source shape is encountered.

Dry runs may place rejected source references in a quarantine section of the report. Quarantine does not allow production cutover; every blocking rejection must be resolved by code, source correction with explicit authority, or an approved manifest update.

---

# Part 7 - Transactions and Repository Behavior

## Write Transactions

Every business operation that changes more than one row runs in one `IMMEDIATE` transaction.

Examples include:

* auction resolution;
* trade execution;
* contract signing;
* buyout and retention creation;
* roster movement with legality recalculation;
* matchup lock and result correction;
* draft selection and pick ownership change;
* season rollover;
* account status change plus session revocation;
* domain event plus outbox insertion.

Transactions must be short. They must not contain:

* external HTTP requests;
* email delivery;
* Socket.IO emission;
* filesystem copying;
* blocking waits.

Required notifications are written to the outbox in the same transaction and delivered afterward.

---

## Read Behavior

A read repository may issue only `SELECT`, read-only PRAGMAs, or an explicit read transaction.

Protected GET and HEAD requests may perform the narrowly approved session `last_used_at` security refresh through authentication middleware, no more often than once every five minutes. That security metadata write is separate from league-domain repositories and must not change league state.

League-domain file hashes are no longer the final read-only proof after cutover. Tests instead compare:

* `PRAGMA data_version` where appropriate;
* tracked table row versions or a database snapshot;
* absence of domain write statements;
* unchanged domain table content before and after read requests.

---

## Idempotency and Concurrency

Retryable write endpoints use the approved idempotency table and request fingerprint.

Repositories must:

* use prepared statements;
* reject stale expected versions;
* use unique constraints as the final duplicate barrier;
* map constraint errors to stable domain or API errors;
* never implement read-modify-write across separate unprotected transactions.

Auction resolution, scheduled occurrences, outbox delivery, migration commands, and restore commands must be safe against accidental duplicate execution.

---

# Part 8 - Verification

## Database Integrity Checks

The following are mandatory after schema creation, import, backup creation, and restore rehearsal:

```sql
PRAGMA integrity_check;
PRAGMA foreign_key_check;
```

`integrity_check` must return exactly `ok`.

`foreign_key_check` must return zero rows.

Routine readiness may use:

```sql
PRAGMA quick_check;
```

but a quick check never replaces the full migration and restore checks.

---

## Migration Reconciliation

The report compares source and target for every applicable family:

* source file hashes;
* migration and data-model versions;
* users, leagues, memberships, teams, and players;
* stable player external IDs;
* ownership by league, team, and roster category;
* contracts and total/AAV cents;
* retention and buyout schedules and totals;
* auctions, bids, trades, and activity;
* draft assets and selections when present;
* matchup weeks, locks, baselines, player results, and team results;
* standings inputs and snapshots;
* security and activity event counts;
* scheduled jobs, idempotency rows, notifications, and outbox state;
* reset omissions by manifest rule;
* duplicates, orphans, rejects, repairs, and warnings.

Money is reconciled both by count and by integer sum. Contract obligations are reconciled by season and team, not only by record count.

The report contains a machine-readable JSON file and a human-readable Markdown summary.

---

## Determinism Check

Before production cutover, staging performs two imports from the same source bundle and manifest into two new databases.

After normalizing allowed physical differences such as database file layout and application timestamps, the verifier must prove:

* identical migration ledgers;
* identical stable IDs;
* identical row counts;
* identical ordered semantic row hashes;
* identical reconciliation reports.

Non-deterministic import results block cutover.

---

## Required Test Coverage

Tests must cover:

* empty database migration;
* copied current JSON;
* all approved source-shape variants;
* malformed JSON and missing files;
* duplicate and ambiguous records;
* every reset-manifest family;
* protected-data omission rejection;
* cents, fantasy-point, timestamp, and Unicode boundaries;
* all unique, check, and foreign-key invariants;
* transaction rollback after injected failure;
* stale-version and idempotency conflict;
* WAL mode and concurrent read behavior;
* busy-timeout failure;
* application startup behind, ahead, and checksum-mismatched;
* backup during controlled application operation;
* restore into a clean path;
* integrity and foreign-key verification;
* rollback rehearsal;
* multi-league isolation;
* read-only endpoint proof.

Migration implementation cannot be considered complete while `npm test` is a placeholder.

---

# Part 9 - Backup and Restore

## Database-Safe Backup

Copying only the main database file while WAL writes may exist is not an approved backup method.

The backend backup command uses the driver's online backup API to write a new temporary database file. It then:

1. opens the backup separately;
2. verifies the migration ledger;
3. runs `integrity_check`;
4. runs `foreign_key_check`;
5. records byte size and SHA-256 hash;
6. writes a backup manifest;
7. atomically renames the verified temporary artifact.

The manifest records source environment, database ID, schema version, build, start and finish timestamps, file hash, verification result, and reason.

Backup filenames must not contain secrets.

---

## Render Disk Snapshots

Render persistent-disk snapshots are an additional recovery layer. They are not a substitute for:

* application-consistent SQLite backups;
* off-service backup copies;
* restore verification;
* migration source bundles;
* a rehearsed recovery procedure.

At least one verified pre-cutover database backup and the final JSON source bundle must be stored outside the live database directory according to the operations specification.

---

## Restore Rule

A backup is not considered usable until it has been restored to a clean staging or temporary path and has passed:

* file-hash comparison;
* migration-ledger validation;
* full integrity and foreign-key checks;
* key count and money reconciliation;
* application startup;
* authenticated smoke tests;
* representative roster, auction, trade, matchup, standings, and public-roster reads.

Restoration never overwrites the only copy of an existing database.

---

# Part 10 - Cutover and Rollback

## Staging Gate

Production cutover is blocked until staging has completed:

1. source inventory;
2. dry run;
3. deterministic repeated import;
4. full migration report review;
5. automated tests;
6. restore rehearsal;
7. representative API contract tests;
8. account and permission tests;
9. scheduled-job and Socket.IO tests;
10. a timed cutover rehearsal using copied data.

Staging must use no production secrets and no production persistent disk.

---

## Production Cutover Sequence

The approved sequence is:

1. Confirm operating mode, approved work-plan step, branch, build, and responsible operator.
2. Create and verify a final pre-cutover backup or snapshot of current production files.
3. Enter a maintenance window and block manager and commissioner writes.
4. Stop scheduled jobs and external refresh processes.
5. Stop the application process or otherwise prove no source writes can occur.
6. Copy the final JSON source bundle and record all hashes.
7. Run the approved reset-manifest validation.
8. Build and migrate a new SQLite database at a temporary persistent-disk path.
9. Import the final bundle.
10. Run full integrity, foreign-key, count, value, and semantic reconciliation.
11. Create and independently verify a SQLite backup.
12. Activate the new database path atomically or through a reviewed environment change.
13. Start the compatible application in closed maintenance mode.
14. Run readiness and smoke tests without opening manager writes.
15. Confirm jobs are still paused and no unexpected outbox action occurred.
16. Open application traffic and manager writes.
17. Resume jobs one at a time.
18. Monitor errors, database size, WAL size, latency, job outcomes, and business totals.
19. Record the cutover result and preserve the source bundle and rollback artifacts.

No step may be skipped because the league is off-season.

---

## Rollback Boundary

Before the first accepted SQLite business write, rollback may:

* stop the new build;
* restore the prior application configuration;
* reopen the unchanged JSON-backed build;
* leave the failed temporary database for diagnosis.

After any SQLite business write, stale JSON is no longer an authoritative rollback target.

Rollback after that boundary must use:

* the verified SQLite pre-write or post-cutover backup when no accepted transaction would be lost;
* a forward corrective migration;
* an explicitly approved recovery that accounts for every accepted transaction.

The smoke-test gate is intentionally placed before manager writes so ordinary cutover failures remain on the simpler side of this boundary.

---

## No Dual Write

The application must not write JSON and SQLite as co-authoritative stores.

Dual write would permit:

* partial success;
* divergent ordering;
* conflicting rollback state;
* duplicated scheduled actions;
* unprovable authority.

During implementation, compatibility readers may compare SQLite with copied JSON in tests or staging. In production, exactly one store is authoritative for mutable domain data.

After cutover, original JSON remains read-only recovery evidence until the retention and archive plan authorizes its removal.

---

# Part 11 - Operational Controls

## Health and Readiness

The liveness endpoint proves only that the process is alive.

Readiness must fail when:

* the database cannot be opened;
* the database path is unsafe;
* required PRAGMAs are absent;
* migration versions do not match;
* a checksum mismatch exists;
* the database is read-only when writes are required;
* the environment identity is wrong.

Public health responses must not reveal paths, SQL, schema details, file hashes, or secrets.

---

## Checkpoint and File Growth

WAL checkpoints are monitored and performed through the database infrastructure module.

The application records safe metrics for:

* main database size;
* WAL size;
* checkpoint duration and result;
* busy and lock errors;
* transaction latency;
* backup duration and result.

An abnormally growing WAL is investigated before forcing a destructive checkpoint. Long-lived readers and failed jobs must be identified first.

Vacuum operations are explicit maintenance tasks. They do not run on startup or ordinary requests.

---

## Query Performance

Before release, representative queries must be measured on staging-scale data.

`EXPLAIN QUERY PLAN` must confirm appropriate indexes for:

* league-scoped roster and ownership reads;
* current contracts and obligations;
* active auctions and team bids;
* pending trade proposals;
* matchup periods and locked lineups;
* standings snapshots;
* player external-ID lookup;
* current membership and team authorization;
* due scheduled jobs and outbox rows.

Indexes are added for demonstrated query and constraint needs, not speculatively for every column.

---

## Logging

Migration and database logs may include:

* command name;
* environment;
* source-bundle ID;
* migration IDs;
* counts;
* durations;
* safe error codes;
* verification outcomes.

They must not include:

* passwords or hashes;
* raw account or action tokens;
* session secrets;
* secret environment values;
* full private source records;
* active sealed bid values;
* provider credentials.

Private migration reports are access-controlled operational artifacts, not public league activity.

---

# Part 12 - Implementation Sequence

SQLite work must proceed in these separate verified stages:

1. Pin Node and add test foundations.
2. Add the driver and central connection factory without changing authority.
3. Add migration files, ledger, and empty-database verification.
4. Implement repositories against SQLite behind existing service interfaces.
5. Add source inventory and reset-manifest validation.
6. Implement pure transforms and deterministic ID mapping.
7. Implement dry-run reporting and rejection handling.
8. Import copied current data locally.
9. Complete repository, transaction, API contract, and read-only tests.
10. Implement database-safe backup and restore verification.
11. Establish isolated staging.
12. Rehearse migration, cutover, rollback, jobs, and account security in staging.
13. Review the production report and obtain explicit cutover authority.
14. Execute the production cutover procedure.
15. Monitor and retain rollback evidence.

Each stage gets its own active work-plan step, affected-file list, verification command, and rollback instructions.

The backend refactor should establish repository and service boundaries before feature code is moved onto SQLite. The migration must not be combined with an uncontrolled authentication, frontend, and league-rule rewrite.

---

# Part 13 - Completion Criteria

SQLite migration preparation is complete only when:

* runtime and driver versions are pinned;
* the full approved data model has versioned DDL;
* migration checksums and startup compatibility checks work;
* source inventory and reset manifests are deterministic;
* copied current data migrates without unresolved blocking rejects;
* protected records and stable player IDs are proven preserved;
* reset omissions exactly match the approved manifest;
* all integrity, foreign-key, count, value, and semantic checks pass;
* repositories and transactions pass required tests;
* read-only endpoints are proven not to change domain data;
* backup and restore are verified;
* staging is isolated and the cutover rehearsal passes;
* rollback is rehearsed on both sides of the first-write boundary;
* production authority remains explicit;
* current JSON is retained as read-only evidence after cutover.

The production migration is complete only after the cutover report is reviewed, manager writes are reopened, scheduled jobs are safely resumed, and monitoring shows no unexplained discrepancy.

---

# Part 14 - Verification Commands

Document validation:

```powershell
Get-Content docs/04-technical-specs/SQLITE_MIGRATION.md
rg -n "TODO|TBD|NEEDS DECISION|PENDING|\\[ \\]" docs/04-technical-specs/SQLITE_MIGRATION.md
```

Implemented migration, import, staging-verification, backup, and clean-restore
verification commands:

```powershell
npm test
npm run db:migrate -- --database .data/test/migration.sqlite3
npm run db:import-json -- --source-bundle <bundle> --database .data/test/import.sqlite3 --reset-manifest database/reset-manifests/2026-season-1-reset.json --report .data/test/import-report --dry-run
npm run db:verify-staging-import -- --descriptor <descriptor-path> --source-bundle <bundle> --database <absolute-database-path> --reset-manifest <reset-manifest-path> --import-report <import-report-path> --operating-mode <operating-mode>
npm run db:backup -- --reason manual-platform-operation
npm run db:backup:verify -- --manifest-object-key <manifestObjectKey>
npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <absolute-clean-restore-path>
```

There is no `db:verify` package command. The implemented import verifier is the
staging-specific `db:verify-staging-import` interface above and requires its
complete descriptor and evidence set. The deployed backup command derives the
database and object-storage destination from validated environment
configuration and returns the exact `manifestObjectKey` consumed by both
verification commands. The older `db:backup -- --database ... --output ...`
and `db:restore-verify -- --backup ...` forms are not the current release
interface and must not appear in deployment instructions.

The approved `db:restore:plan` and `db:restore:execute` package commands remain
unimplemented. Verification restores only to the named absolute clean path;
replacing an authoritative database remains blocked until those interfaces and
their separate authority exist.

Representative direct checks:

```powershell
node -e "const Database=require('better-sqlite3'); const db=new Database(process.argv[1],{readonly:true}); console.log(db.pragma('integrity_check',{simple:true})); console.log(db.pragma('foreign_key_check'));" .data/test/import.sqlite3
```

Expected result:

* integrity result is `ok`;
* foreign-key result is an empty array;
* migration, import, and applicable staging-verification commands exit
  successfully;
* source and target reports contain no unresolved blocking reject;
* the deployed backup emits a `manifestObjectKey`, backup verification passes,
  and clean restore verification never replaces the authoritative database;
* no protected source file changes hash.

---

# Final Approved Decisions

The SQLite design is approved with:

* Node `24.14.1`;
* exact `better-sqlite3` `12.11.1`;
* one persistent SQLite database and one backend instance per environment;
* WAL, full synchronous durability, foreign keys, strict tables, and trusted-schema restrictions;
* explicit immutable SQL migrations with checksums;
* no automatic production migration on application startup;
* deterministic copied-JSON import with stable IDs and complete reports;
* an explicit reset manifest for every omitted Season 1 record family;
* protected player identifiers and new Season 2 account data preserved;
* database-safe online backups and verified restores;
* a maintenance-window cutover with no dual write;
* rollback to JSON only before the first accepted SQLite write;
* small, separately verified implementation stages.

No SQLite migration or production reset was performed by writing this specification.
