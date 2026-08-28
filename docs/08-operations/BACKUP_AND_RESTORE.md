# Hundo Leago - Backup and Restore

## Document Status

`APPROVED`

This operations specification defines:

* backup layers, creation, encryption, storage, schedules, retention, verification, and pruning;
* restore authority, planning, execution, validation, reopening, and reconciliation;
* SQLite, legacy JSON, migration, security, job, email, and audit recovery boundaries;
* recovery objectives and required staging drills;
* technical recovery decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the backup-and-restore decisions and approved adoption of the resulting design on 2026-07-18.

---

## Operations Purpose

Hundo Leago contains records that cannot be reconstructed reliably from the NHL:

* users and sessions;
* league memberships and team assignments;
* player ownership and prospect rights;
* contracts, retention, and buyout obligations;
* bids and auction results;
* trades and draft-pick ownership;
* matchup locks, baselines, and finalized results;
* commissioner corrections;
* Security Audit and League Activity;
* durable jobs, outbox entries, and recovery records.

A backup is useful only when it is complete, protected, independently stored, and proven restorable.

Copying the live SQLite file while it is open, keeping a snapshot on the same disk, or reporting that an upload succeeded is not sufficient.

---

## Out of Scope

This specification does not:

* perform a backup or restore;
* authorize access to production data;
* authorize a production maintenance window;
* select or purchase an object-storage vendor;
* replace incident response or deployment checklists;
* permit commissioners to execute restores;
* make a Render disk snapshot the primary database backup;
* permit live JSON and SQLite dual writes;
* define deletion of normal league history.

Every production restore is a separate controlled operation.

---

# Part 1 - Authority and Scope

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/OPERATING_MODE.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
docs/07-testing/TESTING_STRATEGY.md
```

Permissions owns who may request and approve recovery. SQLite Migration owns migration cutover and its source bundle. Security owns access, secrets, sessions, and Security Audit. This document owns backup artifacts and restore procedure.

---

## Reviewed Operating Mode

```text
OFFSEASON_RESET
```

Local and staging recovery work may be rehearsed through approved plans.

Production restore authority remains protected regardless of operating mode.

---

## Protected Systems

This procedure covers:

* production SQLite;
* staging SQLite;
* pre-migration legacy JSON source bundles;
* operational backup catalog and manifests;
* required persistent application files not stored in SQLite;
* the encryption keys needed to read retained artifacts.

Source code is recovered from Git and reviewed release artifacts, not from the database backup.

Provider configuration and secrets are inventoried separately without placing secret values in a backup manifest.

---

# Part 2 - Recovery Objectives

## Objectives

Initial targets:

| Operating period | Recovery-point objective | Recovery-time objective |
| --- | --- | --- |
| Active season or transaction-open period | No more than 1 hour of committed database changes | Restore service within 4 hours |
| Off-season normal operation | No more than 24 hours of committed database changes | Restore service within 4 hours |
| Planned migration, rollover, reset, import, or release | Backup immediately before the operation | Roll back or restore within the approved maintenance window |

These are service targets, not a guarantee that every external side effect can be reversed automatically.

If application code can be rolled back safely without changing data, the target service recovery time is one hour.

---

## Recovery Priorities

Order:

1. prevent further unsafe writes;
2. preserve evidence and the current damaged state;
3. protect account and security state;
4. recover authoritative committed league data;
5. prevent duplicate jobs, emails, and transactions;
6. verify permissions and league isolation;
7. reopen controlled traffic;
8. reconcile the known time gap explicitly.

Speed does not justify overwriting the only remaining copy.

---

# Part 3 - Backup Layers

## Required Layers

Production uses all applicable layers:

1. **Online SQLite backup** created through the database driver.
2. **Encrypted offsite copy** stored outside the Render service and disk.
3. **Render disk snapshot** as an additional infrastructure recovery layer.
4. **Pre-change backup** before a migration, reset, rollover, bulk correction, or risky release.
5. **Immutable pre-migration JSON source bundle** for the JSON-to-SQLite cutover.
6. **Git and release records** for application source and migration files.

No single layer replaces the others.

---

## Primary Database Backup

The primary database backup is an application-consistent SQLite backup created with the approved `better-sqlite3` backup API.

The application must not:

* copy only `hundo-leago.sqlite3` while WAL mode is active;
* omit `-wal` state by using a normal filesystem copy;
* pause halfway through a multi-file copy and call it consistent;
* treat a same-disk snapshot directory as offsite protection.

The backup API produces a standalone temporary SQLite file representing a consistent source snapshot while normal operation continues.

---

## Render Disk Snapshots

Render's automatic disk snapshots are secondary infrastructure protection.

They are not the normal SQLite restore path because:

* a disk snapshot covers the whole disk rather than one verified database artifact;
* changes after the snapshot are lost;
* partial restore is unavailable;
* restoring an arbitrary filesystem image of an active custom database can be unsafe.

A provider snapshot may assist platform-level disaster recovery only after current provider guidance is reviewed and the database consistency risk is addressed.

Normal recovery uses the verified application-created backup.

---

## Legacy JSON Source Bundle

Before production SQLite migration, create the immutable source bundle required by `SQLITE_MIGRATION.md`.

It contains:

* every approved source JSON file;
* path, byte length, modification time, and SHA-256 for every file;
* source inventory and inclusion decision;
* reset manifest;
* importer version and Git commit;
* generated mapping, reject, quarantine, and reconciliation reports;
* no secret environment file.

The source bundle is encrypted and stored offsite separately from the migrated SQLite backup.

It is never modified after creation.

---

# Part 4 - Backup Artifact Format

## Artifact Pipeline

The approved pipeline is:

```text
live SQLite
  -> online backup to unique temporary SQLite file
  -> SQLite verification
  -> SHA-256 and safe manifest
  -> gzip compression
  -> AES-256-GCM encryption
  -> offsite upload
  -> remote size and SHA-256 verification
  -> catalog completion
  -> local temporary cleanup
```

Compression occurs before encryption.

Plaintext temporary artifacts are removed after successful completion or quarantined securely after a diagnosed failure.

---

## Encryption

Backup payloads use:

```text
AES-256-GCM
random 12-byte IV per artifact
16-byte authentication tag
32-byte encryption key
explicit encryption-key version
```

The safe manifest fields used to identify the artifact are authenticated as additional authenticated data.

The encryption key:

* is generated from cryptographically secure randomness;
* is stored in managed secret configuration, not SQLite or Git;
* differs between staging and production;
* is not stored beside the encrypted artifact;
* is versioned;
* remains available for every retained artifact encrypted with it.

Key rotation creates new backups with the new version. It does not make retained backups unreadable.

---

## File Names

Encrypted database artifact:

```text
hundo-leago_<environment>_<utcTimestamp>_<backupId>.sqlite3.gz.enc
```

Safe manifest:

```text
hundo-leago_<environment>_<utcTimestamp>_<backupId>.manifest.json
```

Names use UTC and filesystem-safe characters.

Object names do not include:

* league names;
* user names;
* email addresses;
* team names;
* secret values.

---

## Backup Manifest

The safe manifest includes:

```text
formatVersion
backupId
environment
environmentId
databaseId
createdAt
completedAt
reason
requestedByType
requestedById
backendBuildId
schemaVersion
migrationChecksumSetId
sourceDatabaseSize
plainBackupSha256
compressedSize
encryptedSize
encryptedArtifactSha256
encryptionAlgorithm
encryptionKeyVersion
storageObjectKey
verificationResults
retentionClass
expiresAt or keepIndefinitely
```

The manifest excludes secrets and private league contents.

The full manifest is access-controlled even when its fields are designed to be safe.

---

# Part 5 - Configuration Contract

## Approved Variables

| Variable | Purpose |
| --- | --- |
| `BACKUP_LOCAL_DIR` | Persistent staging area for temporary backup artifacts |
| `BACKUP_OBJECT_ENDPOINT` | S3-compatible object-storage endpoint when required |
| `BACKUP_OBJECT_REGION` | Object-storage region |
| `BACKUP_OBJECT_BUCKET` | Environment-specific bucket |
| `BACKUP_OBJECT_PREFIX` | Environment-specific object prefix |
| `BACKUP_OBJECT_ACCESS_KEY_ID` | Write/read credential identifier |
| `BACKUP_OBJECT_SECRET_ACCESS_KEY` | Write/read secret |
| `BACKUP_ENCRYPTION_KEY_VERSION` | Active backup-key version |
| `BACKUP_ENCRYPTION_KEY` | Active 32-byte key encoded in the approved secret format |
| `BACKUP_SCHEDULE_ENABLED` | Explicit scheduler enablement |

If previous key versions remain required, the secret loader resolves them by version without exposing them through generic configuration output.

---

## Storage Adapter

The application uses a small provider-neutral S3-compatible object-storage adapter.

The exact vendor and account may be selected during the deployment work plan, provided it supports:

* encrypted HTTPS transport;
* private objects by default;
* environment-separated credentials and namespaces;
* object metadata and checksum verification;
* lifecycle or retention controls;
* access logs;
* tested download;
* sufficient durability.

The application must not make backup objects public.

---

## Least Privilege

Normal production backup credentials may:

* create objects in the production backup prefix;
* read objects required for verification;
* list the production prefix when required.

Automatic pruning should use separately reviewed delete authority when the provider supports that separation.

Staging credentials cannot access the production prefix.

Restore execution credentials are available only to the platform-administration operation.

---

# Part 6 - Backup Creation

## Backup Reasons

Every backup has one reason:

```text
scheduled-hourly
scheduled-daily
commissioner-request
pre-deploy
pre-migration
pre-restore
pre-reset
pre-rollover
pre-bulk-operation
incident-preservation
manual-platform-operation
```

Free-form operator notes may supplement but not replace the reason code.

---

## Creation Sequence

1. Authenticate and authorize the request when user-initiated.
2. Generate a unique backup ID and temporary paths.
3. Create a catalog record with status `CREATING`.
4. Confirm environment identity and available disk space.
5. Run the online SQLite backup into a unique temporary file.
6. Open the temporary database read-only.
7. Run `PRAGMA integrity_check`.
8. Run `PRAGMA foreign_key_check`.
9. verify schema version and migration checksums.
10. Verify database and environment identity.
11. Record approved reconciliation counts and financial totals.
12. Close the temporary database.
13. Calculate plaintext SHA-256.
14. Compress and encrypt the artifact.
15. Calculate encrypted-artifact SHA-256.
16. Upload to the environment-specific offsite object key.
17. Verify remote object size and checksum.
18. Write the safe manifest and complete the external catalog record.
19. Mark status `VERIFIED`.
20. Remove plaintext and local encrypted staging files when retention does not require them.
21. Emit the appropriate operational and security record.

Failure at any step prevents `VERIFIED`.

---

## Verification Requirements

A verified backup requires:

```text
integrity_check = ok
foreign_key_check = zero rows
schema version recognized
migration checksum set recognized
database identity matched
environment identity matched
approved reconciliation queries completed
plaintext SHA-256 recorded
encrypted object SHA-256 matched after upload
object exists outside the Render disk
manifest and catalog completed
```

An uploaded but unverified object is marked `FAILED` or `QUARANTINED`, never `VERIFIED`.

---

## Catalog Location

Backup history is written to:

1. the operational database for application visibility; and
2. an external append-only catalog or manifest namespace outside that database.

The external catalog is required because the live database may be unavailable during recovery.

Catalog entries use backup IDs and safe metadata. They do not contain encryption keys.

---

# Part 7 - Schedule and Retention

## Schedule

Production schedule:

| State | Frequency |
| --- | --- |
| Active season or transaction-open period | Hourly |
| Off-season normal operation | Daily |
| Immediately before a risky data operation | On demand and blocking |

Staging:

* daily while persistent staging is active;
* immediately before a restore drill or migration rehearsal;
* otherwise according to the staging work plan.

Local and automated test backups are disposable unless retained as test evidence.

---

## Retention Classes

Minimum encrypted offsite retention:

| Class | Retention |
| --- | --- |
| Hourly | 48 hours |
| Daily | 14 days |
| Weekly | 8 weeks |
| Monthly | 12 months |
| Pre-deploy or pre-migration | 90 days or two verified later releases, whichever is longer |
| Season-end | Indefinite until an explicit archival policy is approved |
| Incident-preservation | Until incident closure plus explicit legal/operational release |

The JSON-to-SQLite source bundle is retained for at least one year and until:

* the first full Season 2 rollover and season-end backup are verified;
* no unresolved migration discrepancy remains;
* explicit deletion is approved.

The longest applicable class wins.

---

## Pruning

Pruning:

1. evaluates verified artifact metadata;
2. protects legal holds, incidents, season-end, and migration artifacts;
3. confirms a newer verified recovery chain exists;
4. records the proposed deletions;
5. uses reviewed delete authority;
6. verifies deletion results;
7. records completion in the external catalog.

Pruning never deletes:

* the only verified backup;
* every backup readable by a retained key version;
* a pre-restore preservation backup during an open recovery;
* an artifact with incomplete catalog state;
* an artifact based only on local disk pressure.

---

# Part 8 - Monitoring and Failure Behavior

## Required Alerts

Alert when:

* a scheduled backup does not start;
* creation, verification, encryption, upload, or catalog completion fails;
* the latest verified backup exceeds the active RPO;
* persistent-disk space is below the approved threshold;
* offsite credentials fail;
* a checksum differs;
* a backup key version is unavailable;
* pruning tries to remove a protected artifact;
* a restore is requested or executed;
* repeated backup jobs overlap.

---

## Job Safety

Backup jobs use durable scheduled occurrences and leases.

Rules:

* one occurrence creates at most one verified backup ID;
* retry resumes or safely supersedes incomplete work;
* overlapping jobs do not write the same temporary path or object key;
* stale leases are recoverable;
* the scheduler records failure without hiding the last verified backup;
* backup failure does not silently stop the application unless a release or risky operation requires a fresh backup.

---

## Disk Space

Before creating a local backup, verify sufficient free space for:

* the temporary standalone SQLite file;
* compression and encryption staging;
* SQLite WAL growth during the operation;
* a safety margin.

If insufficient:

* scheduled backup fails visibly and alerts;
* a risky operation remains blocked;
* no existing verified artifact is deleted automatically to make room.

---

# Part 9 - Roles and Authorization

## Commissioner Authority

An authenticated commissioner may request an immediate backup for their league context without separate approval.

That request:

* triggers a platform-level database backup because SQLite contains multiple leagues;
* does not grant access to the artifact;
* does not reveal other leagues;
* records the requester's identity and league context safely;
* returns status and completion time, not a download link or filesystem path.

Commissioners cannot:

* download production backup artifacts;
* decrypt backups;
* select an arbitrary filesystem path;
* execute a restore;
* bypass retention;
* inspect sealed-bid or private cross-league data through backup metadata.

---

## Restore Authority

A commissioner may submit a restore request.

A platform administrator must:

* review the request;
* determine scope and feasibility;
* approve or reject it;
* execute any approved restore;
* record evidence.

A league-specific correction should use an approved commissioner correction workflow where possible. Restoring the whole multi-league database to repair one league is a last resort because it affects every league.

---

## Emergency Authority

During a production incident, a platform administrator may begin an emergency restore when delay would materially worsen data loss or outage.

Emergency execution still requires:

* current strong reauthentication;
* an explicit typed confirmation;
* a recorded incident ID;
* a pre-restore preservation backup when technically possible;
* full post-operation Security Audit;
* retrospective review.

A second approver is preferred when available but does not block urgent recovery by the sole authorized platform administrator.

---

# Part 10 - Restore Planning

## Restore Is Not In-Place

Never overwrite the only live database with an unverified artifact.

Restore uses:

```text
download -> verify encrypted hash -> decrypt -> decompress
-> verify standalone SQLite -> open at temporary path
-> generate restore plan -> approve -> atomic activation
```

The previous live database and sidecars are preserved as incident evidence until recovery closes.

---

## Restore Plan

Every restore plan records:

```text
incident or request ID
target environment
requested scope
candidate backup ID
candidate creation time
expected data-loss window
current and candidate database IDs
current and candidate schema versions
current and candidate build compatibility
current and candidate reconciliation counts
current and candidate financial totals
affected leagues
pending auctions and trades
matchup and standings periods
scheduled jobs and leases
outbox and notification state
sessions and account-action tokens
required migrations after restore
rollback artifact
approval identity
maintenance and communication plan
```

The platform administrator reviews the plan before activation.

---

## Candidate Selection

Choose the newest verified backup that:

* predates the corrupt or destructive event;
* has a recognized schema and checksum set;
* passes integrity and foreign-key checks after decryption;
* matches the target environment identity or is explicitly authorized for a controlled environment clone;
* can run on the selected application build;
* does not contain the known corruption;
* minimizes lost committed work.

Do not choose a backup only because its timestamp looks recent.

---

# Part 11 - Restore Execution

## Production Restore Sequence

1. Open the incident and identify the authorized platform administrator.
2. Place the application in maintenance mode and block mutations.
3. Pause scheduled jobs, auction resolution, email sending, and outbox dispatch.
4. Record current frontend and backend build IDs, schema version, database identity, and health.
5. Create an incident-preservation online backup when technically possible.
6. Copy the current database, WAL, SHM, and operation evidence into a protected incident area without treating that copy as a valid backup.
7. Select the candidate through the restore plan.
8. Download the encrypted artifact and manifest to a unique temporary directory.
9. Verify encrypted size and SHA-256 before decryption.
10. Resolve the required encryption key by version.
11. Authenticate, decrypt, and decompress to a new temporary SQLite file.
12. Verify plaintext SHA-256.
13. Open the candidate read-only.
14. Run integrity, foreign-key, schema, checksum, identity, and reconciliation checks.
15. Produce and approve the final data-loss and compatibility report.
16. Stop the application process holding the live SQLite connection.
17. Move the current live database and sidecars into the protected pre-restore location.
18. Atomically move the verified candidate into the approved `DATABASE_PATH`.
19. Start the selected compatible backend in maintenance mode.
20. Apply only explicitly approved forward migrations if required.
21. Perform the post-restore safety actions below.
22. Run authenticated operational and read-only feature verification.
23. Re-enable jobs and outbox handling selectively.
24. Open user traffic only after the recovery gate passes.
25. Monitor and reconcile the known loss window.
26. Close the recovery only after evidence is retained and reviewed.

If any gate fails, stop and reactivate the protected pre-restore database or choose another verified candidate through a new plan.

---

## Post-Restore Safety Actions

Before normal traffic resumes:

* revoke every active session;
* revoke every outstanding verification, password-reset, setup, and reactivation token;
* require users to sign in again;
* increment the recovery epoch used by idempotency and job execution safeguards;
* mark restored leases stale and recover them through the job policy;
* hold pending outbox and email records for reconciliation;
* prevent restored email from being sent a second time automatically;
* inspect pending auctions, bids, trades, and transaction deadlines;
* inspect matchup lock, baseline, finalization, correction, and rollover state;
* verify current league phase and transaction windows;
* verify team ownership, contract, cap, retention, and buyout totals;
* verify platform-administrator and commissioner assignments;
* verify Security Audit continuity and record the recovery boundary.

These actions prevent old credentials and external side effects from being resurrected by a database rollback.

---

## Email and Notification Reconciliation

Database restore cannot unsend email already delivered.

For restored outbox entries:

1. compare restored records with provider delivery evidence when available;
2. suppress entries already sent;
3. regenerate time-sensitive account messages only through the current secure workflow;
4. do not resend stale reset or verification links;
5. release remaining messages deliberately;
6. record manual decisions.

In-app notification state may be rebuilt from authoritative records where the applicable specification permits it.

---

## Scheduled Job Reconciliation

For every occurrence in the loss window:

* identify whether it executed externally;
* compare its idempotency key and durable result;
* do not rerun solely because the restored database says it is pending;
* rerun only through the approved recovery command;
* verify auctions and matchup transitions cannot resolve twice;
* record the final state.

Wall-clock deadlines are re-evaluated against approved league rules and commissioner recovery authority.

---

# Part 12 - Data-Loss Reconciliation

## Known Loss Window

The loss window is:

```text
candidate backup completedAt -> mutations stopped
```

The recovery report identifies every available source of evidence in that window:

* application and security logs;
* external email-provider events;
* object-storage and hosting logs;
* payment-free transaction records inside league communications, if voluntarily provided;
* user reports;
* commissioner records;
* preserved damaged database when readable.

---

## Reconstruction Rule

Do not guess missing league transactions.

Recoverable missing changes are applied through:

* normal idempotent replay when authoritative evidence exists; or
* an approved commissioner/platform correction workflow.

Each correction records:

* reason;
* source evidence;
* before and after values;
* actor;
* time;
* affected league and records.

Matchup and standings events remain outside League Activity according to their specifications. Recovery records belong in operational history and Security Audit; league-visible corrections use the feature's approved correction history.

---

# Part 13 - Restore Verification

## Database Verification

Required:

```sql
PRAGMA integrity_check;
PRAGMA foreign_key_check;
```

Also verify:

* schema version and migration checksums;
* database and environment identity;
* user, membership, team, and league counts;
* player ownership uniqueness;
* roster, contract, retention, and buyout reconciliation;
* auction and trade state;
* draft-pick ownership;
* matchup schedule, lock, baseline, and result state;
* standings derivation inputs;
* scheduled occurrences, leases, outbox, notifications, and audit continuity.

---

## Application Verification

While mutations remain blocked:

* public liveness succeeds;
* authenticated readiness shows the expected environment, build, schema, and backup identity;
* sign-in requires a fresh session;
* cross-league access is denied;
* roster, auction, trade, matchup, and standings reads return expected safe data;
* read-only endpoints do not change database or files;
* Socket.IO authenticates and joins only allowed league rooms;
* email remains held;
* jobs remain paused.

After reopening:

* perform one approved reversible mutation in a test or controlled administrative context;
* confirm one committed write and one invalidation;
* confirm no duplicate outbox or job effect;
* create and verify a new post-restore backup.

---

## Recovery Completion Gate

Recovery is complete only when:

* the selected backup and pre-restore artifact are identified;
* all database checks pass;
* schema and application builds are compatible;
* sessions and account-action tokens are revoked;
* jobs and outbox state are reconciled;
* security and league isolation tests pass;
* expected data loss is documented;
* required corrections are complete or tracked;
* a new verified offsite backup exists;
* monitoring remains normal through the review window;
* the platform administrator closes the incident.

---

# Part 14 - Staging Restore Drills

## Frequency

Run a complete staging restore:

* before the first production SQLite cutover;
* before Season 2 launch;
* monthly while production SQLite is active;
* after material backup-format, encryption, schema, storage-adapter, or restore-code changes;
* before relying on a newly rotated key version;
* after a failed production backup or recovery incident when the procedure changes.

---

## Drill Requirements

The drill:

1. starts with deterministic staging data;
2. creates known records after the selected backup;
3. performs the full maintenance and restore sequence;
4. proves the expected post-backup records are absent;
5. proves pre-backup records and financial totals are intact;
6. proves sessions and account tokens are revoked;
7. proves held outbox and jobs do not duplicate effects;
8. proves two-league isolation;
9. creates a new post-restore backup;
10. records actual recovery time, failure points, and evidence.

A backup system is not launch-ready until this drill passes.

---

# Part 15 - Security, Privacy, and Audit

## Backup Sensitivity

Even when passwords are hashed, a database backup contains sensitive data.

Treat every artifact as confidential production data.

Required controls:

* private object storage;
* HTTPS transport;
* application-layer authenticated encryption;
* least-privilege credentials;
* access logging;
* no public links;
* no attachment to ordinary email or chat;
* no commit to Git;
* secure temporary paths;
* controlled key access;
* documented retention and deletion.

---

## Audit Records

Security Audit records:

* backup requested by a privileged actor;
* backup verification failure;
* artifact access for restore;
* restore requested, approved, rejected, started, failed, or completed;
* session and token revocation after restore;
* backup key rotation;
* retention-policy or pruning changes.

Operational records contain:

* scheduled backup outcome;
* safe backup ID;
* timings and checks;
* storage and retention class;
* drill evidence.

Neither record exposes:

* encryption keys;
* provider secrets;
* session tokens;
* private bid values;
* raw database content.

Matchup and standings processing is not added to League Activity.

---

# Part 16 - Command Interface

## Implemented and Planned Commands

The backend currently exposes these explicit non-interactive backup and clean-
restore verification operations. The backup result supplies the exact
`manifestObjectKey` used by both verification commands:

```powershell
npm run db:backup -- --reason manual-platform-operation
npm run db:backup:verify -- --manifest-object-key <manifestObjectKey>
npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <absolute-clean-restore-path>
```

The approved generic restore-plan and restore-activation interfaces remain
required but are not implemented as `db:restore:plan` or
`db:restore:execute` package commands. Their absence remains a blocker for a
generic restore that would replace an authoritative staging or production
database. The single M7-26 exception below does not remove that blocker for any
other release, environment, backup, source path, or target path.

### M7-26 release-bound staging-only strict restore materializer - closed record

Grae authorized one release-bound isolated-staging restoration for strict
hosted evidence. The backend exposes four narrow commands for that operation:
the normal pair is available only after complete hosted smoke, while the abort
pair is the rollback-only path from an exact recognized incomplete or failed
smoke state. Under exact Node `24.14.1`, the fresh release-bound restore and
publisher contract at exact backend commit
`8e313902feefcd683b0f5edd746a9dd2a9029a18` passes its isolated `57/57` gate in
`347.592s`. Under npm `11.11.0`, `npm run check` and `npm ls --all` exit `0`,
and the complete local suite passes `443` suites / `3,503` tests with `3,501`
pass, zero fail, two intentional Windows skips, and zero cancelled/todo in
`15172.429s`. Backend `origin/staging` resolves exactly to that commit. Held
deploy `dep-da5l8drtqb8s73ar74sg` is `LIVE` on exact B; its build, all
`3,503/3,503` hosted tests across `443` suites, zero-startup-error check,
live/readiness `200`/`no-store`, and held league `503`/`no-store` checks pass.
The fresh fixture prepare and immediate zero-write replay also passed under the
full hold. Release `HL-20260822-1` subsequently stopped at its pre-action helper
origin guard and used the exact abort pair recorded below; it is blocked and no
longer active. The historical
`HL-20260821-3` component, complete, hosted, and abort-recovery evidence remains
in the separately labelled historical subsection below; it cannot satisfy the
fresh run.

```text
npm run release:qa:strict-restore:plan -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --target '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --service-id 'srv-d9eo2turnols73ekb830' --release-id 'HL-20260822-1' --manifest-object-key 'staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json'

npm run release:qa:strict-restore:execute -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --target '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --service-id 'srv-d9eo2turnols73ekb830' --release-id 'HL-20260822-1' --manifest-object-key 'staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json' --plan-id '<exact planId emitted by plan>' --confirmation '<exact confirmation emitted by plan>'

npm run release:qa:strict-restore:abort:plan -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --target '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --service-id 'srv-d9eo2turnols73ekb830' --release-id 'HL-20260822-1' --manifest-object-key 'staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json'

npm run release:qa:strict-restore:abort:execute -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --target '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --service-id 'srv-d9eo2turnols73ekb830' --release-id 'HL-20260822-1' --manifest-object-key 'staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json' --plan-id '<exact planId emitted by abort plan>' --confirmation '<exact confirmation emitted by abort plan>'
```

The pinned contract is:

```text
Release ID:                    HL-20260822-1
Operator-asserted service ID: srv-d9eo2turnols73ekb830
Environment ID:               test:release-qa
Database ID:                  m7-release-qa-fixture
Schema version:               54
Migration checksum set:       6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
Frontend build:               4dfe12d1366314e3d9df722c50771324647743c9
Source path:                  /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
Inactive target path:         /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3
Activation receipt path:      /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3.activation-receipt.json
Backup ID:                    2044fcae-24e8-4392-a1ac-4064d9cd2807
Backup created:               2026-08-22T22:40:11.048Z
Backup completed:             2026-08-22T22:40:14.558Z
Backup reason:                incident-preservation
Retention:                    incident-preservation / no expiry
Requested-by type:             platform_operation
Requested-by ID:               HL-20260821-3-post-abort-cutover
Backup backend build:         23971a4d66ee6383c6ad54339e769dbc9a76561e
Manifest object:              staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json
Storage object:               staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.sqlite3.gz.enc
Encrypted SHA-256:            cee039557278c41f59fa9d6a5b09cf4f69f1b9f3589cb3774420ef34be255162
Manifest checksum:            08e3d3bde81843a683017d9952b30e02dd02978181a8644323cfbd590eca2ac8
Plaintext SHA-256:             cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
```

The exact backup reverified against the clean held source immediately before
preparation: its decrypted payload matched the pinned plaintext SHA-256,
SQLite integrity was `ok`, foreign-key violations were zero, and remote
bytes/hash matched. The source WAL/SHM sidecars and fresh
target/receipt/work area were absent. Fresh fixture
preparation and its exact zero-write replay are `PASS`; the `HL-20260821-3`
preparation receipt was not reused. Preparation does not constitute strict
restore planning, materialization, restore replay, `DATABASE_PATH` handoff, or
activation.

In the closed release sequence, fixture preparation preceded the four restore
commands above and deliberately mutated the pinned source. The second
invocation was the replay; there was no separate replay script:

```text
npm run release:qa:fad:privacy-gate:prepare -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --release-id 'HL-20260822-1' --confirmation 'PREPARE-RELEASE-QA-FAD-PRIVACY-GATE:HL-20260822-1:staging:test:release-qa:m7-release-qa-fixture'

npm run release:qa:fad:privacy-gate:prepare -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --release-id 'HL-20260822-1' --confirmation 'PREPARE-RELEASE-QA-FAD-PRIVACY-GATE:HL-20260822-1:staging:test:release-qa:m7-release-qa-fixture'
```

Both sanitized results were retained. They bind FAD
`f474f00b-111c-4dec-8592-ffcbaf97e655`, restricted auction
`551f475b-352f-4c06-831a-534b9750754a`, deadline
`1787554800000` / `2026-08-24T07:00:00.000Z`, receipt
`88a56507-73fd-47f9-ac66-c305f0075d24`, fingerprint
`1a097b50afa8915c7cd98154dc455604965739c6d61213ac9caec90a6487620b`, and
prepared time `1787519331074`. The first result reports `replayed: false` with
`databaseWriteCount: 744`; the immediate identical replay reports
`replayed: true` with `databaseWriteCount: 0` and the same IDs, times, public
counts, and inserted-row counts. That full field name is canonical;
`writeCount` in older historical prose is only shorthand. The first command
changed the source bytes, so its clean pre-fixture hash is not a post-prepare
invariant. The verified backup remains the clean restore point.

The post-fixture held preflight records the source as a real regular,
non-symlink, same-device file of `37761024` bytes, SHA-256
`c26fdebc9432c09371bc5c2bc6eed74f626e9589d891478a9f9b4e300d80d238`, and
`mtimeMs: 1787519337691.8423`. Source WAL/SHM, the fresh target and its WAL/SHM,
the activation receipt, and the deterministic restore work directory are all
absent. Exact B/F and the full hold remain bound.

At the pre-abort boundary, the target, target WAL/SHM sidecars, activation
receipt, and restore work area were required to remain absent through any
controlled unhold, hosted smoke, and restore planning. Only the selected normal
or abort restore execute could materialize the target and receipt under the
full hold. The recorded actionable boundary was
`2026-08-24T07:00:00.000Z`; both hosted transfer phases would have had to finish
before it. The hosted gate instead stopped before either phase, and the selected
abort execute materialized the clean target and receipt. These are historical
pre-abort decision rules; they grant no authority to prepare again, resume the
release, or reuse any release-bound value.

The closed contract allowed its four commands only from the attached Render
service shell while the exact source path was current and the full hold was
active:

```text
STAGING_MAINTENANCE_HOLD=true
APP_ENV=staging
NODE_ENV=production
LEAGUE_WRITE_MODE=closed
SCHEDULED_JOBS_ENABLED=false
FREE_AGENT_DRAFT_ROUTES_ENABLED=false
ACCOUNT_EMAIL_DELIVERY_ENABLED=false
DEBUG_ROUTES_ENABLED=false
EMAIL_DELIVERY_MODE=capture
SPORTSDATAIO_NHL_LIVE_MODE=disabled
SPORTSDATAIO_NHL_API_KEY: absent
SPORTSDATAIO_NHL_API_ORIGIN: absent
SPORTSDATAIO_NHL_LAST_SEASON_START_YEAR: absent
SPORTSDATAIO_NHL_LIVE_API_KEY: absent
SPORTSDATAIO_NHL_LIVE_API_ORIGIN: absent
SPORTSDATAIO_NHL_LIVE_CAPABILITY_SECRET: absent
SPORTSDATAIO_NHL_LIVE_CAPABILITY_KEY_VERSION: absent
SPORTSDATAIO_NHL_LIVE_CAPABILITY_ARTIFACT: absent
SPORTSDATAIO_NHL_LIVE_PROBE_MANIFEST: absent
BACKUP_SCHEDULE_ENABLED=false
```

The operator was required to verify the Render service separately before
invocation. The
command compares the supplied service ID with its compiled release contract,
but it does not independently query Render to prove which service owns the
shell. The current deployed backend build is captured from `APP_BUILD_ID` and
bound into the plan and durable receipt.

Neither normal nor abort planning is described as read-only. Each plan mode
performs zero authoritative-database mutations and leaves zero durable
filesystem mutations, but it does materialize temporary plaintext databases
inside this deterministic private `0700` work directory before verified
cleanup:

```text
/opt/render/project/data/hundo-staging/sqlite/.hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3.strict-restore-work-v1
```

Any pre-existing work directory is preserved and fails closed. Normal
process-local failures clean only allowlisted paths owned by that invocation.
Abrupt termination may leave the deterministic work directory as a recovery
blocker; it requires manual inspection under the full hold and must never be
blindly deleted or bypassed.

Under the closed contract, normal execution was blocked unless the complete
exact hosted strict smoke was present in the source database: Team 1 had the
commissioner-created initial
Manager A assignment followed by platform-administrator-proposed and manager-
accepted `A -> B -> A` transfers; Team 2 remains on its original Manager B
assignment; both corresponding accepted-assignment outbox rows have their
exact payload and league audience and are each `published` once with
`attempt_count=1`, non-null publication time, null error, and row `version=3`;
and no auction bid, resolution, allocation, or allocation-event drift
occurred. The candidate backup must independently verify schema, checksums,
environment/database identity, the second credential-rotation receipt, zero
active sessions, and absence of the strict sidecar fixture.

Abort planning and execution were restricted to one of these five finite
source-state classifications:

1. `prepared_only`: only the initial fixture exists; phase-one and return
   publication states are both `none`.
2. `to_b_pending`: the exact Manager B proposal, proposal idempotency record,
   and one delivered notification exist, with no acceptance or publication;
   both publication states are `none`.
3. `to_b_accepted`: Manager B accepted and phase one is exactly `pending`,
   `publishing`, `failed`, or `published`, while the return state is `none`.
   The `publishing` case includes a publisher-process crash after claim.
4. `return_to_a_pending`: phase one is `published`; the exact Manager A return
   proposal, proposal idempotency record, and one delivered notification
   exist; the return publication state is `none`.
5. `return_to_a_accepted`: phase one is `published`; Manager A accepted and
   the return publication state is exactly `pending`, `publishing`, `failed`,
   or `published`.

Only classification 5 reports `sourceSemanticChainCompleted: true`. Every
abort result and receipt reports `restoreMode: aborted-strict-smoke-rollback`,
`smokeCompleted: false`, `hostedSmokeCompleted: false`,
`releaseBlocked: true`, and `rollbackOnly: true`. An unclassified or internally
inconsistent source fails closed and must not be repaired with ad hoc SQL or a
generic restore. The closed contract prohibited retry after either exact
manager-outbox publisher call failed or remained `failed` or `publishing`; it
instead required restoration of the full hold, evidence preservation, and the
abort plan/execute pair.

The first successful normal or abort execute invocation creates exactly two
durable files: the verified inactive target and its mode-specific activation
receipt. It writes zero rows to the current authoritative database, preserves
the source and its absence of WAL/SHM sidecars, and reports the temporary
plaintext work and cleanup truthfully. Exact replay uses the receipt and
hashes, performs no object-store request, encryption-key resolution, or
temporary restore, and reports zero authoritative-database and zero durable-
filesystem mutations. A normal plan/receipt cannot be supplied to an abort
execute, and an abort plan/receipt cannot be supplied to a normal execute.
Under the pre-execution recovery rule, only an exact verified receipt with an
absent target could resume interrupted target publication after manual review
of any work-area residue; a target without its receipt failed closed. Any
mismatch or unexpected path also failed closed. That rule does not authorize a
new invocation or resumption of `HL-20260822-1` now that abort materialization
and exact replay are complete.

#### HL-20260823-1 fresh strict release binding - V3 action succeeded/consumed; V4 and V5 retired; V6 retired at prehost bootstrap abort; V7 published / unbound / diagnostic attempt consumed / no phase reservation / retired; O23-O23D pending O23E; O23E unchecked; V8/O23E authorized next; P23 and later gates not authorized

Grae requested and approved fresh isolated-staging release `HL-20260823-1` at
exact requested/approved/recorded time `2026-08-23T23:23:29.877Z`. It binds F
`4dfe12d1366314e3d9df722c50771324647743c9` and held starting B baseline
`8e313902feefcd683b0f5edd746a9dd2a9029a18`.
Executable B-prime `234547e4d8453b7515fc081ea6ebe4c2d022dc54` passed its
exact local and backend `origin/staging` publication gates at the recorded
B-prime boundary. Held deploy
`dep-da5sh0e417fc738i254g` passed on exact B-prime after its full
hosted/runtime gate passed.

```text
Authoritative source:       /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3
Clean boundary bytes/SHA:   37105664 / cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Pre-action fixture bytes/SHA: 37744640 / b4163695d6f9db9e1f2db2b3aee536126e42b83f540fb0ee919b962fbd92b103
Fresh target:               /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3
Target state at plan:       absent
Target state after execute: 37105664 / cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc; inactive
Receipt after execute:      4991 / 24adf2d36c1adae8674552d44fc99fb43fd875dd58be85008f0c00b35450e8c8; inactive handoff
```

The release binds verified incident-preservation backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6`:

```text
Manifest:             staging/backups/hundo-leago_staging_20260823T225620203Z_e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6.manifest.json
Storage object:       staging/backups/hundo-leago_staging_20260823T225620203Z_e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6.sqlite3.gz.enc
Created at:           2026-08-23T22:56:20.203Z
Encrypted SHA-256:    e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448
Manifest checksum:    54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155
Plaintext SHA-256:     cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Reason:               incident-preservation
Requested-by type:    platform_operation
Requested-by ID:      HL-20260822-1-post-abort-cutover
Retention class:      incident-preservation
Expires at:           null
Backend build ID:     8e313902feefcd683b0f5edd746a9dd2a9029a18
SQLite integrity:     ok
Foreign-key violations: 0
```

The release began under full hold. B-prime implementation/local verification and
Git publication passed without a data, target, helper, or production action.
The only later environment change was the exact `APP_BUILD_ID`-only merge that
triggered the now-passed held deploy; the hold and `DATABASE_PATH` stayed
unchanged. Fresh fixture prepare/replay then passed at `729` and `0` writes;
held postflight verified the pre-action source `37744640` / `b4163695...`, exact fixture and
privacy evidence, target-family absence, zero scratch mutations, and cleanup.
Frontend helper commit `e898e72272e5a052867832dcf9f128e5b8d5730e` then
passed its exact canonical local gate. API deploy
`6a8bfef3ac0ff74a373404d8` was rejected before browser or unhold because its
header rules were absent; corrected current/`READY` CLI deploy
`6a8c006abe46c8fb6269c40c` passed exact bytes, headers, marker, absence,
normal-app, held-probe, and inert-tab checks with no functions. Fresh tab
`1600151197` reported `READY_NO_SESSION_REQUEST` with empty QueryClient caches
and no API, session, action, or write. The clean `cf3ca07d...` backup remains
the restore boundary. Exact controlled-unhold deploy
`dep-da60sl0jo6nc73e0cfu0` and frozen pre-action v2 verifier passed. Phase-one
proposal `e00e0512-4a20-47fd-ad74-0986dd4abd27` reached accepted state;
publication event `974342b5-94e5-42d8-af20-9e07c35bc847` and immediate replay
passed at `fresh 2` / `replay 0`. Chrome was Admin rather than required Manager
A during publication, so operator sequencing selected `STRICT_STOP`. Phase two
never began and no retry is allowed. Its abort plan and receipt must use only
the new release namespace; no prior plan, receipt, target, work area, or
release-specific value may be reused. Exact current gates are recorded in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-23.md`.

Exact merge-only re-hold with only `true` / `closed` / `false` produced sole
newest/`LIVE` B-prime deploy `dep-da6cu8h42hec738f2al0` at that boundary. Hosted
`443` suites /
`3,503` tests / `3,503` pass, build/startup, zero-error, live/readiness, and
maintenance-blocked session/leagues/current-FAD gates passed. Prior unhold
deploy `dep-da60sl0jo6nc73e0cfu0` is deactivated. The source path remains
authoritative under full hold; its exact current post-write family is bound by
the B-prime WAL-aware diagnostic and must be freshly re-proved unchanged by the
B2-pinned verifier before plan, not inferred from the pre-action main-only
baseline.
The clean backup remains the rollback boundary. The fresh target remained
absent through planning and was later materialized only by the exact accepted
first execute described below.

The former main-only verifier
`pre-abort-source-verifier.sh` (`18060` bytes / SHA-256 `9c323005...`) ran and
safely failed `TARGET_FAMILY_OR_SIDECAR_PRESENT`. The target, target WAL/SHM,
activation receipt, and work area were absent; that verifier did not bind source
or target rollback-journal absence. Its bundled fence rejected the nonempty
authoritative source WAL/SHM. No checkpoint, source-
sidecar removal, plan, restore, or target write followed.

Replacement B-prime diagnostic
`wal-aware-abort-source-verifier.sh` is `24132` bytes / `685` LF lines /
SHA-256 `c036a2b847fe97c8ff8eade5a633d2d6815404344e2f683e241edce4f596e51e`.
Its `2747`-byte result SHA-256 is
`deda5da68dabed9225b25165727e9c36d6cf46875947596e2b0f1b61afec1a9a`
with code `HL23_ABORT_WAL_PREFLIGHT_SOURCE_VERIFIED`. It binds exact main
`37744640` / `b4163695...` / inode `131156`, WAL `568592` / `0dde02d1...` /
inode `131151`, and SHM `32768` / `e03d9ff8...` / inode `131152`; each was device
`66332` in the historical B-prime container mount namespace, UID `1000`, mode
`0600`, and link count `1`. Six stable snapshots and
two complete zero-holder process scans passed. It copied source main/WAL/SHM
byte-for-byte into owned scratch. Private scratch main/WAL hashes remained
identical across recovery; only private scratch SHM changed. SQLite opened only
the scratch family and never opened the authoritative paths. Integrity/foreign keys/schema/migrations,
identity/rotation, semantic state, zero database changes, downstream absence,
and cleanup passed. This diagnostic cannot authorize B-prime abort-v1.

Exact abort-v2 B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb`, direct
child of B-prime with tree `0a6a928d8f6308aa5aadd2031c71769164c1cfb7`, is
committed and published to backend `origin/staging`. Its only implementation/
test paths retain numstat `369/18` / `830/2`, Git blobs
`4a198c71554b7e7c5fc8ee481cd79b51c1ef799f` /
`53ce37cd04e48eb42323bab914d71ef3933c2c63`, and SHA-256 values
`d49c870bdf300983a0b57577ce68e0647ba6ff318ccf55fe11a5596016671889` /
`3d9714ca93efa573593d983c992032fc4c473f2df23fd85395c9ed6d2873155c`;
the canonical `57541`-byte raw diff has SHA-256
`eb963d6b95311eeacc282ce9f8f743a83d4eae32f28922e2668ddcbfcbe84dc0`.
B2 preserves normal v1, upgrades abort contract/receipt to `2`, binds main+WAL,
excludes authoritative SHM from SQLite, rejects rollback journals, and retains
work-area version/literal v1. Diff/syntax, focused `72/72` before the final
narrow wrapper, and exact-final affected `5/5` pass; backend HEAD and
`origin/staging` equal B2 and the worktree is clean.

The approved one-key merge produced API deploy `dep-da6ghj67bikc738hbbv0`, sole
newest/`LIVE` on exact B2; B-prime re-hold deploy
`dep-da6cu8h42hec738f2al0` deactivated at the safe handoff. Hosted `443` suites /
`3,519` tests all passed with zero fail/cancel/skip/todo. Build/startup on
instance `thxsc`, zero-error, health/readiness `200`/`no-store`, and maintenance-
blocked session/leagues/current-FAD `503 SERVICE_MAINTENANCE`/`no-store` passed.
Netlify stayed current/`READY` `6a8c006abe46c8fb6269c40c`; no other environment,
database-path, helper, backup, or production change occurred.

Post-live shell proof `HL23_B2_POST_LIVE_HELD_FAMILY_VERIFIED` passed at
`2026-08-25T04:11:28.902Z`, binding all `20` runtime keys, nine absent provider
fields, three stable source snapshots, two seven-process scans with zero denied/
holders, and downstream absence. Device `66313` is the current B2 `thxsc`
container's namespace-local mount identity; all other main/WAL/SHM metadata and
hashes match the historical proof.

Fresh verifier `post-b2-abort-v2-source-verifier.sh` is `35494` bytes / SHA-256
`6d5cfe50ecee26199c3f0a2c922c99a84d3f97e2fe98b6256b36583e6e98b70c`;
local syntax/static/cold audit passed. Its one-shot `6032`-byte result SHA-256
`80c7cadec0664625b0c4fc6eb86fd49f5e58842534fdebbc1aead63f5fe65976`
returned `HL23_ABORT_B2_V2_SOURCE_PREFLIGHT_VERIFIED`. It proves six stable
family boundaries with fingerprint `21efc183...`, two eight-process/`85`-
descriptor zero-holder scans, main+WAL-only scratch, private `32768`-byte SHM
creation, unchanged source and scratch main/WAL, integrity/FK/schema/migration/
checksum and exact semantic state, zero changes, rollback-journal/downstream
absence, and cleanup.

One abort-v2 plan ran exactly once after the fresh-shell guards and passed at
`0/0`. The detailed run ledger seals stdout `4777` bytes / `cef33b8f...`,
canonical result `4146` bytes / `30441740...`, cleanup-aware metadata `1809`
bytes / `ec338025...`, empty stderr, and exact plan ID
`release-qa-strict-restore-abort-v2-03f37c3c16ee7cc632c49a6b87f23819b398146fd8a0fe1c6aff5cbdcca47456`.
Contract version `2`, `sourcePersistenceMode: "main-wal"`, exact WAL/family/
classifier/backup/source binding, SHM observed but not included in SQLite
inspection, target absent, both mutation counts `0`, and the exact temporary-
work object below pass. Postflight retained exact main/WAL/SHM on current device
`66313`, inodes `131156` / `131151` / `131152`, with seven processes / `65`
descriptors / zero holders; journals and all downstream objects remained absent.

Published execute-only authority
`fd31b1f41b7c16521cf0eceb2c4af4a33a242636` was in frontend
`origin/staging` before action. Fresh action-time preflight passed on exact B2,
full hold, unchanged source main/WAL/SHM, absent target/receipt/work, and two
zero-holder scans. The exact `969`-byte / SHA-256
`bad1c78f0867977c65d457684ee3440c3707a48977694364470038a9cad4f275`
command ran once only. Its `7318`-byte capture envelope has SHA-256
`147334054423894703aae5cdb67453a186281d716f422b5e3ccccd04b2bbffe3`;
stdout is `4902` bytes / `74610bcc...`; stderr is empty / `e3b0c442...`;
canonical result is `3896` bytes / `3d67f676...`.

The wrapper's authoritative native spawn status was numeric `0`, with null
signal and error. The auxiliary status file contains literal three ASCII bytes
`0\n`—digit zero, backslash, lowercase `n`, not an LF—with SHA-256
`101770a4004c3406015d7e013e2729f1d23b7e8ceb486069d48f2693088cf7c4`.
That serialization defect was sealed and not repaired. It creates no execution
ambiguity because native status, complete stdout/result, empty stderr, and exact
postflight independently agree.

Result `RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED` passed at contract `2`,
`replayed: false`, authoritative-database/durable-filesystem mutations `0/2`,
`sourcePreserved: true`, and `targetVerified: true`. It preserved exact
`main-wal` source identity, materialized target `37105664` / `cf3ca07d...`, and
wrote canonical format-v2 receipt `4991` / `24adf2d...`. The result retained
the exact performed/materialized `true`, retained `false`, cleanup `verified`,
deterministic-path, fail-closed temporary-work contract.

Postflight is `2059` bytes / `fdd169d5...`; held probes are `1136` bytes /
`2d634d0d...`; capture cleanup is `928` bytes / `299496df...`; final metadata
is `5566` bytes / `59cb7e89...`. They bind unchanged source family, regular
non-symlink UID-`1000` mode-`0600` target/receipt, target and receipt inodes
`131160` / `131161`, source-journal plus target-WAL/SHM/journal and work absence,
two nine-process/`88`-descriptor zero-holder scans, full hold, unchanged Render/
Netlify, and verified removal of all three remote captures. At this post-abort
first-execute boundary, `DATABASE_PATH` remained on the preserved source and the
target was inactive. V3 later selected the target; receipt bytes remain
unchanged, while semantic target verification remains deferred. First-execute authority
is consumed and cannot be rerun.

The deterministic work path remains exactly
`/opt/render/project/data/hundo-staging/sqlite/.hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3.strict-restore-work-v1`.
The accepted plan and consumed first execute required performed/materialized
`true`, retained `false`, cleanup `verified`, and fail-closed abrupt recovery.
The one authorized replay is now `PASS / AUTHORITY CONSUMED / NO RERUN` and
returned performed/materialized `false`, retained `false`, cleanup
`not-needed`, and the same fail-closed abrupt-recovery value.

Action-preflight script/result `9561` / `2837` bytes (`7f9f378a...` /
`b454c5a6...`) bound exact B2, `20` runtime keys, nine absent providers, three
snapshots, and two ten-process/`92`-descriptor zero-denied/zero-holder scans.
The same `969`-byte / `bad1c78f...` command dispatched once with native status
`0`; wrapper/envelope are `4098` / `7349` (`95cf1aa5...` / `63e4e662...`),
stdout `4905` / `65431c4c...`, stderr `0` / `e3b0c442...`, replay status `2`
/ one LF / hex `30 0a` / base64 `MAo=` / `9a271f2a...`, and canonical result
`3899` / `8b21edc8...`. Contract `2`, `replayed: true`, `0/0`, the exact no-work
object, unchanged source family, and byte-identical target/receipt pass; no
temporary/object/key/restore/write activity occurred. Historical first-execute
status remains the sealed, unrepaired literal three-byte `0\n` wart.

Postflight script/result `12559` / `3047` (`c2e034de...` / `07ad847d...`)
passed three snapshots, five absences, and two ten-process/`92`-descriptor zero-
denied/zero-holder scans. Probes `995` / `a31a8877...` passed live/ready `200`,
session/leagues/current-FAD `503 SERVICE_MAINTENANCE`, `no-store`, and no
`Set-Cookie`. Render stayed sole-newest/`LIVE` exact-B2
`dep-da6ghj67bikc738hbbv0`, no newer/pending deploy, auto-deploy off, and zero
error/`5xx` logs; Netlify stayed unchanged ready
`6a8c006abe46c8fb6269c40c`, six headers/two redirects/zero functions. Cleanup
script/result `11629` / `4023` (`9a908635...` / `67b1adbe...`) removed only the
three byte-pinned remote captures via exact-path unlink and protected files
stayed stable. Final metadata `6012` / `b2f706da...` records
`HL23_ABORT_V2_REPLAY_EVIDENCE_COMPLETE` at
`2026-08-26T01:57:14.3214070Z`.

First-execute and replay authorities are consumed and neither may be rerun.
The now-consumed helper-retirement-only dispatch authority was published in
exact commit `7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb`, based on replay-evidence
commit `296cd690382b87a1cd4647ca98a24f14e98ee8ff`. It authorized exactly one
staging Netlify CLI publication. That dispatch ran once and must not be retried.
The consumed contract bound site
`95af8aa7-0b13-4954-af6d-855762acb147`, then-current helper deploy
`6a8c006abe46c8fb6269c40c`, title
`HL-20260823-1-abort-v2-retire-helper-baseline`, immutable original-dist `33`
files / `1932120` bytes /
`2d8069ca1aa61e02b5be14b09b97ded73b8363ae5e699c0e712f32026903ae6c`,
and exact five-header baseline config `1664` bytes /
`7720d21350b54735e11c86fd6fd4282887c7ce6e92b7d33ce9fdf788f66db422`.

The pre-dispatch requirements below are retained solely as the consumed
dispatch contract; their imperative wording grants no new action authority.
A new ignored, local-only preflight must be authored, frozen, and cold-audited
before dispatch. It verifies original-dist and frozen source config
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-control\netlify.toml`,
plain non-reparse `E:\Codex`, and absent `E:\Codex\temp`. The tracked helper-era
verifier is not authority for this no-tracked-edit path.

The wrapper exclusively creates owned `E:\Codex\temp`, external runtime control
`E:\Codex\temp\HL-20260823-1-helper-retirement-control-v1`, and separate profile
`E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`; created owner SIDs
must equal the wrapper process user SID. Control inventory at CLI start is only
the copied regular `1664`-byte / `37`-LF / zero-CR / five-header /
`7720d21350b54735e11c86fd6fd4282887c7ce6e92b7d33ce9fdf788f66db422`
`netlify.toml`; all six CLI-scanned function/edge paths are absent.

The shell-free action pins portable Node `24.14.1`
`E:\hundo-leago\.tools\node-v24.14.1-win-x64\node.exe` (`91426304` bytes /
`58e74bf02fc5bbacc41dcb8bef089961cd5bddd37830b87784e4fc624d145d1f`) and
direct Netlify CLI `27.0.0`
`C:\Users\graem\AppData\Roaming\npm\node_modules\netlify-cli\bin\run.js`.
Package/run seals are
`b5f0e60f06b774e0d087c735557e19f47ec25c56e9d5695b045f28a188e56156`
(`7358`) and
`e39432e46703049b6769e17c0a7a8f1748c345100a1f934d8a6c7076001d426c`
(`2800`); npm/npx/PATH resolution, `--cwd`, and an empty `.git` sentinel are
forbidden. CLI deploy has no `--config`; physical/logical cwd and config/
repository-root discovery resolve to the external control.

Bind `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`, `TMP`,
`XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `XDG_DATA_HOME`, `XDG_STATE_HOME`, and
`XDG_RUNTIME_DIR` to exact fresh E-scoped profile
`E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`
with `CI=1`; and keep `NETLIFY_AUTH_TOKEN` child-environment/in-memory only, never
argv/capture/persistence. Exact argv is
`deploy --site 95af8aa7-0b13-4954-af6d-855762acb147 --dir E:\hundo-leago\.netlify\strict-release-HL-20260823-1\original-dist --no-build --skip-functions-cache --prod --message HL-20260823-1-abort-v2-retire-helper-baseline --json`.
Exact repo-ignored capture root
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-captures`
must be exclusively acquired as the one-shot dispatch lock; residue consumes
authority and forbids retry.

The helper-retirement action preflight process environment has exactly the eight
keys `SystemRoot,WINDIR,ComSpec,PATHEXT,PATH,CI,NO_COLOR,NO_UPDATE_NOTIFIER`.
`SystemRoot`, `WINDIR`, `ComSpec`, and `PATHEXT` are copied exactly from the
wrapper process, with respective fallbacks `C:\Windows`, `C:\Windows`,
`C:\Windows\System32\cmd.exe`, and `.COM;.EXE;.BAT;.CMD`; `PATH` is exactly
`C:\Program Files\Git\cmd;C:\Windows\System32;C:\Windows`, and the constants are
`CI=1`, `NO_COLOR=1`, and `NO_UPDATE_NOTIFIER=1`. The deploy child environment
has exactly the 22 keys
`SystemRoot,WINDIR,ComSpec,PATHEXT,PATH,CI,NO_COLOR,TERM,NETLIFY_TELEMETRY_DISABLED,NO_UPDATE_NOTIFIER,NETLIFY_AUTH_TOKEN,HOME,USERPROFILE,APPDATA,LOCALAPPDATA,TEMP,TMP,XDG_CONFIG_HOME,XDG_CACHE_HOME,XDG_DATA_HOME,XDG_STATE_HOME,XDG_RUNTIME_DIR`.
Its five system/path values are byte-identical to preflight; its constants are
`CI=1`, `NO_COLOR=1`, `TERM=dumb`, `NETLIFY_TELEMETRY_DISABLED=1`, and
`NO_UPDATE_NOTIFIER=1`. All eleven of `HOME`, `USERPROFILE`, `APPDATA`,
`LOCALAPPDATA`, `TEMP`, `TMP`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`,
`XDG_DATA_HOME`, `XDG_STATE_HOME`, and `XDG_RUNTIME_DIR` equal exact external
profile `E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`.
`NETLIFY_AUTH_TOKEN` is memory-only in that exact child environment; every
unlisted variable is absent.

Persisted provider evidence is an allowlisted projection only; persisting raw
`getSite` or any other raw provider payload is forbidden. Both phases have
the exact top-level key set
`code,observedAt,releaseId,frontendAuthorityCommit,netlify,render,safety`.
PRE `netlify` keys are exactly
`siteId,siteName,canonicalOrigin,netlifyOrigin,currentDeployId,currentDeployTitle,currentDeployState,currentDeployPublishedAt,currentDeployOrigin,currentIsNewest,noPendingDeploy,headers,redirects,functions,edgeFunctions,buildSettings,automaticPublishFence,retirementTitleAbsent,activeDeployCount,inspectedDeployCount,newestFirst`;
POST `netlify` keys are exactly
`siteId,siteName,canonicalOrigin,netlifyOrigin,currentDeployId,currentDeployTitle,currentDeployState,currentDeployPublishedAt,currentDeployOrigin,currentIsNewest,noPendingDeploy,previousHelperDeployId,previousHelperNoLongerCurrent,retirementTitleMatchCount,activeDeployCount,headers,redirects,functions,edgeFunctions,buildSettings,automaticPublishFence,deployMethod,inspectedDeployCount,newestFirst`.
Both `render` projections have exactly
`workspaceId,serviceId,deployId,commit,state,soleNewestLive,noNewerOrPendingDeploy,autoDeploy,autoDeployTrigger,maintenanceHold,databasePath,targetInactive,applicationErrorLogs,request5xxLogs`.
PRE `safety` keys are exactly
`fullHold,replayAuthorityConsumed,replayRerunAuthorized,normalRestoreAuthorized,activationAuthorized,backupAuthorized,stagingReopenAuthorized,productionAuthorized`;
POST `safety` keys are exactly
`fullHold,helperRetirementComplete,replayAuthorityConsumed,replayRerunAuthorized,normalRestoreAuthorized,activationAuthorized,backupAuthorized,stagingReopenAuthorized,productionAuthorized`.
PRE must prove `currentIsNewest=true`, `noPendingDeploy=true`,
`retirementTitleAbsent=true`, `activeDeployCount=0`, `inspectedDeployCount=50`,
and `newestFirst=true`. POST must prove `currentIsNewest=true`,
`noPendingDeploy=true`, `previousHelperDeployId=6a8c006abe46c8fb6269c40c`,
`previousHelperNoLongerCurrent=true`, `retirementTitleMatchCount=1`,
`activeDeployCount=0`, `inspectedDeployCount=50`, `newestFirst=true`, and
`deployMethod=manual-cli`. PRE safety has `fullHold=true` and
`replayAuthorityConsumed=true`; every authorization field is false. POST adds
`helperRetirementComplete=true` and leaves those safety values unchanged.

The exact ordered HTTP `8/8` matrix is the canonical origin
`https://staging.hundoleago.com` followed by the new immutable origin
`https://<deployId>--hundoleago-staging.netlify.app`, each in path order `/`,
`/index.html`, `/assets/index-BFtuYVmF.js`, and
`/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e`. Every response is `200` and
has no `Set-Cookie`; `/`, `/index.html`, and the league path have exact
`Cache-Control: no-store`, while the asset has exact
`Cache-Control: public, max-age=31536000, immutable`. Every response must carry
the exact seven-header map whose canonical SHA-256 is
`a1ade439bda16fafea1afdd1360bb9ec906e598fc48ca989b7b5ffc6c3af0245`:
`content-security-policy=default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://api-staging.hundoleago.com https://hundo-leago-backend-staging.onrender.com https://api.hundoleago.com https://hundo-leago-backend.onrender.com; media-src 'self' data: blob:; connect-src 'self' https://api-staging.hundoleago.com wss://api-staging.hundoleago.com https://hundo-leago-backend-staging.onrender.com wss://hundo-leago-backend-staging.onrender.com https://api.hundoleago.com wss://api.hundoleago.com https://hundo-leago-backend.onrender.com wss://hundo-leago-backend.onrender.com; worker-src 'self' blob:; upgrade-insecure-requests`,
`cross-origin-opener-policy=same-origin`,
`cross-origin-resource-policy=same-origin`,
`permissions-policy=camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()`,
`referrer-policy=strict-origin-when-cross-origin`,
`x-content-type-options=nosniff`, and `x-frame-options=DENY`.

The action gate also binds a fresh held-probe matrix under
`https://api-staging.hundoleago.com`: `/api/v1/health/live` and
`/api/v1/health/ready` each return `200` with exact body `{"status":"ok"}`;
`/api/v1/session`, `/api/v1/leagues`, and
`/api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/free-agent-draft/f47032fd-57a2-443b-89a6-ce32894f2fc1`
each return `503` with exact body
`{"error":{"code":"SERVICE_MAINTENANCE","message":"Service is temporarily unavailable."}}`.
All five have a `Content-Type` whose media type begins `application/json`, exact
`Cache-Control: no-store`, and no `Set-Cookie`.

Pre/post gates require Netlify `build_settings: {}`; repo URL/branch, build
command, publish directory, and `stop_builds` absent or null; unchanged full
hold; source `DATABASE_PATH`; and inactive target/receipt. Dispatch is one-shot
and consumes authority; no blind retry. A pass requires exactly one new current/
ready CLI deploy with five headers/two redirects/zero functions/zero edge
functions, `64/64` baseline bytes, `8/8` baseline headers, and `10/10` retired
helper paths across both origins, then mandatory stop.
Only after provider/HTTP/capture/postflight evidence is accepted may cleanup
remove the exact external control/profile, then owned `E:\Codex\temp` only if empty;
source config, original-dist, captures, and evidence remain preserved.
Phase two, normal restore, Render/environment/database mutation,
checkpoint, source-sidecar removal, tracked `netlify.toml`, helper source,
original-dist, rebuild, `DATABASE_PATH` activation, post-activation verifier/
backup, staging reopening/final review, browser, closeout, and production remain
unauthorized pending later evidence-bound authority.

#### 2026-08-25 Helper-Retirement Post-Dispatch HTTP-Verifier Amendment

Published dispatch authority `7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb` is
consumed: exactly one Netlify CLI spawn ran, and no retry/redeploy is authorized.
Its `1902`-byte envelope SHA-256
`b5cd9f492e41b392ec854e05a9fa91480b2e4ebc592ac80ab52b99d0e8295204`
records the expected completion code, one command, no retry, and status `0`.
The `1862`-byte provider-postflight SHA-256
`642b5fac4989c9440ed6fe2015e84de943824ca5e4b95673b15a45cb94f1350d`
proves `6a8e6c8fae36273a816a7539` current/newest/`ready`, exact title,
five headers/two redirects/zero functions/zero edge functions, empty
`build_settings: {}`, no Git link, and unchanged B2 full hold/source path/
inactive target.

The initial official read-only HTTP verifier ran twice and rejected solely with
`CACHE_CONTROL_HEADER_MISMATCH`: Node `24.14.1` exposed the immutable list
without optional comma whitespace. An independent eight-path diagnostic proved
all `200`, exact global headers and `Cache-Control: no-store`, the exact
ordered immutable directives, and no `Set-Cookie`; it made no hosted mutation,
provider write, deploy, or redeploy, but is not official acceptance. The original
pre-dispatch manifest (`3358` bytes / `99` LF / zero CR / final LF /
`6234451ab4ad6af0910fa7c13b38b21cc613509b23e7cae63e5f426b7d63a305`)
was overwritten after dispatch and not continuously retained; its later labeled
reconstruction must never be called the retained original.
The exact reconstructed-manifest path is
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-support-manifest-pre-dispatch-reconstructed.json`;
the exact provenance-note path/name is
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-support-manifest-pre-dispatch-reconstruction-note.json`
(`657` bytes / `18` LF / zero CR / final LF / SHA-256
`3754bcd54f7bde37081d69e5c95e667355021bd9693356430f6911da1fd8a6ef`),
and the note binds exact `reconstructedAfterDispatch=true` /
`continuouslyRetained=false`.

Corrected ignored pins (bytes/LF/SHA-256) are manifest `3358/99/7aab6845725ae90a0d245222529c91a9177b002f516ca6708d37470fdb4d7a4e`;
HTTP verifier `20991/522/26ca6f493f82999eae029c907f3bc666b460362b464b6dd97302b7e390196830`;
contract `30211/854/b3ae7da8019870dead3caa863316f6d7e05d530386ccfcf67afee7b54297a77c`;
and wrapper `21343/628/8bb2a13142fb913b6f13b836ca47b28caed28e1fd064563808451d74e713c605`;
all have zero CR/final LF. `no-store` and global headers remain exact. The
immutable comparator only splits on commas, trims edge SP/HTAB, rejects empty
directives, rejoins, and compares exactly—no reorder, case fold, addition,
removal, or change is accepted.

Only after this nine-document amendment is published may the release obtain a
fresh provider projection, exactly one corrected network-read-only HTTP-verifier result capture,
local postflight, and conditional exact cleanup, in order. Failure/ambiguity
grants no retry. Under that N23 continuation authority, activation, backup,
reopening/review, browser, closeout, and production were forbidden; Chrome
disk/FD reproof remained pending.

#### 2026-08-26 Helper-Retirement Completion

Published incident amendment `0498fd4fd400e8aad16c4cf9c405165d420bd489`
permitted only evidence collection; one-dispatch action authority
`7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb` remains consumed and no retry ran
or is authorized. Refreshed provider postflight is `1862` bytes / SHA-256
`68cd773b3e2f104d71f8c96ce299eea7d89f542d8e5f449f33da4327100f9acd`.
Corrected official HTTP evidence at `2026-08-26T05:25:45.785Z` is `23014` bytes /
SHA-256 `d0ef4d2ed2cf848fbec5959012c929c36a2ea3d74f684d836a6d809fe6d76d46`
and passes `64/64 + 8/8 + 10/10 + 5/5`, no cookies, and no writes. Local
postflight is `4837` bytes / SHA-256
`6941c238289713ee3012a2abe868380dd240c46a8a44ff06e5a7a36c7c7ed4a8`.
Cleanup is `1211` bytes / `1` LF / zero CR / final LF / SHA-256
`b49aca2fa65c2039c5b6e4661e9cf981dd9f29b9a1fdfaddac779609bca00c78`
at `2026-08-26T05:33:33.808Z`; it deleted only the exact external profile,
runtime control, and empty temp parent while preserving baseline, captures, and
evidence. The false-negative/reconstructed chronology and current kit pins stay
preserved. Helper retirement is `PASS / AUTHORITY CONSUMED / NO RETRY`. At the
N23 completion boundary, mandatory stop forbade target activation, backup,
reopening/review, browser, closeout, and production. V1 and V2 were later
rejected at their recorded boundaries. V3 later completed its one provider
mutation and consumed its authority. Bound V4 later failed its diagnostic-only
opaque-cursor read, remained unconsumed, and was retired. Published V5
authority `dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10` then failed its binding
launch before the runner body or any write and is exactly
`PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED`; it may
not be retried, rebound, resumed, or repurposed. Published and bound 3c87/V6
then aborted its sole manually transcribed bootstrap cell at the crypto
self-test before `ProviderCaptureHost` or phase reservation. Its one-shot
attempt is consumed; V6 is retired with no retry or rebind. Published
d0d80e98/V7 then consumed its sole prebinding diagnostic-loader attempt,
remained unbound with no phase reservation, and retired with no retry or
binding. O23 through O23D are `UNCHECKED_PENDING_O23E`; O23E is `UNCHECKED`.
Only the exact-nine V8/O23E child of d0d80e98 may proceed through one
sessionless prebinding diagnostic, exact observation binding, and the frozen
three-phase sequence.
Chrome disk/FD reproof remains pending.

#### 2026-08-26 RC-STG-006O23 V1 Held DATABASE_PATH Handoff Authority - Rejected / Unconsumed Historical Evidence

Published commit `e855be9e1a4d92cd6428175965ecf934653ae965` recorded this V1
operations design on frontend evidence base
`a0da13a5a6a1c1edb352aa1b606d0d3b97aec020` and exact held backend B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`, but action control rejected it
before PRE with `AUTHORITY_DOCS_DO_NOT_PIN_FROZEN_KIT`. It omitted exact frozen
artifact paths, never armed, made no provider call, and left O23 unchecked and
unconsumed. Every V1 pin/procedure below is immutable historical evidence only,
cannot authorize operations, and cannot authorize semantic verification or
backup. Helper retirement remains `PASS / AUTHORITY CONSUMED / NO RETRY`.

The frozen ignored pre-publication kit is pinned by manifest `7290` bytes /
`203` LF / zero CR / final LF / SHA-256
`0d3c5f2e1500b239efcf086818f6446ed31ab25f830ea951bacb4a5f8fc582af`
and canonical artifact-set SHA-256
`0ef3f7d87792727d321f938efd41ef5bf637f61fe155e64770a9b4e7bf556ee0`.
Every manifest row is exact (bytes/LF/SHA-256; all zero CR/final LF): contract
`39951/818/c9a4d008777eff6e0a270347f8eaa0508b97b6001f71c979dbbbc5aba2895fd1`;
held verifier
`26170/636/4b72a3eb494a52b1de8628571f6b1fc65355dbeb5f554f2f313bc847fa44ecad`;
shell envelope
`14882/330/f12d6952e79f0251e1de5858d207353c451ec0ab6db2ea9fd83bf1826d6baeaa`;
held probes
`4878/145/bd9e57a973987ccd4a660730fd61927cbab58beb9e6fa9cccac41113fabf7a58`;
action control
`27138/611/5e36b6eb699ac4e2beb711808a1c144cd904e1fa6c0ec1ab9e3b21a4ec3c1e50`;
postflight
`12157/279/61c277ba79e2f58601f437862066fee39c96ae1167bde6b1739a79a113915c23`;
cleanup
`9035/192/8819988c5254699280327cb9658c0a89b5adeb249d3794758a401a705c63c4fb`;
self-test
`22738/594/af04ef693784b9a9fc9164455ba6c240b4678080c88fc3305aa60524d3ba6fe8`;
freeze verifier
`15243/315/c808cb33199957df8cef5bb966da4dd7789694930ca66f1d13e78fcf8f388a78`;
binding template
`1718/46/bb505cb585e7cce1728fa6c90f10be26673d45febee018f318ae65f20f01b5bf`;
and runbook
`9000/148/e398b0299cf20fc8058dfdabbb13e5c978ff170aba7d6946c097e6229fbb8355`.
Independent cold audit passed all 11 pins, eight JavaScript syntax files,
`bash -n`, `10+` positive and `15` negative fixtures, 19 required guards, and
18 forbidden-operation absences. Manifest false activity fields apply only to
support-kit authoring/local tests, not release-wide activity.
Its pre-publication runtime, critical-delta, semantic, and backup fields say
required/currently false or deferred, not already verified.
The pinned `26170`-byte held verifier is the required new abort-v2/main-WAL-
aware boundary verifier; no predecessor verifier may be reused.

After publication, create and audit the separate ignored immutable authority
binding without changing any frozen byte. It binds the full authority commit,
kit and invocation/result hashes, exact phases/tool/arguments, and permanent
tombstone
`target-activation-captures/hl-20260823-1-<authority16>-464f2e4805c79aef/`.
Both raw phases are shell-boundary proof only. In each new Chrome-attached
Render shell, first set `HISTFILE=/dev/null`, disable history, and clear in-
memory history; then stream the exact payload through stdin only as
`bash -s -- pre-boundary dep-da6ghj67bikc738hbbv0` or
`bash -s -- activation-post dep-<new>`. No remote verifier/payload file,
SQLite/project database module, database open, file copy, checkpoint, sidecar
removal, scratch path, or write is allowed. Each raw result must state
`externalAuthorityBindingRequired=true`,
`externalAuthorityBindingVerifiedByVerifier=false`,
`standaloneAcceptanceAuthorized=false`, and
`verifierGrantsMutationAuthority=false`; only the external binding-aware local
envelope may authorize the phase.

Fresh PRE must prove exact B2 and hardened clean Git state; source
`DATABASE_PATH`; the critical 20-key/nine-absent runtime matrix; source main/
WAL/SHM, target main, and canonical receipt v2 at their durable identity/stat/
hash pins; source journal, target WAL/SHM/journal, and deterministic work path
absent; four stable boundaries; two complete zero-denied/zero-holder scans; and
full hold. Device IDs are namespace-local: the five protected files share the
current container device, but PRE and POST device numbers are never compared;
receipt historical device fields remain byte-bound. Five fresh anonymous no-
cookie/no-write probes separately prove two health `200` and three exact held
`503 SERVICE_MAINTENANCE` responses.

Immediately before arm, capture a complete paginated cursor-closed deploy-ID
edge set no more than two minutes old. Exclusive creation/fsync/re-read of the
authority root, attempt, and separate tombstone seal permanently consumes the
one-shot authority before dispatch. The only mutation is exactly one call to
`mcp__render__update_environment_variables` with canonical arguments
`{"envVars":[{"key":"DATABASE_PATH","value":"/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3"}],"replace":false,"serviceId":"srv-d9eo2turnols73ekb830","workspaceId":"tea-d4prbj7diees738tmg90"}`,
exactly `247` bytes / SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`.
The target/source values are each `103` bytes with SHA-256
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`
and `50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3`.
Do not call `trigger_deploy`, persist raw connector output, retry after error/
timeout/disconnect/ambiguity, or perform an automatic inverse rollback.

Provider evidence cannot prove source/target `DATABASE_PATH`, target inactivity,
or maintenance hold. It records only the exact requested target call plus unique
deploy/build/service/log facts and says
`providerEnvironmentReadAvailable:false`. POST requires a complete cursor-
closed deploy-set difference of exactly one new ID. Any second ID, incomplete
pagination, returned-ID mismatch, or contradiction is ambiguity and stops with
no retry. The new deploy must be sole newest/`LIVE`, API-triggered on B2, with
the old deploy deactivated, no competitor, observed Node `24.14.1`, npm
`11.11.0`, all `443` suites / `3519` tests passing, and complete clean build and
runtime log-source windows.

The fresh POST shell and held probes prove actual target `DATABASE_PATH`, full
hold, only that one critical runtime-binding change, and unchanged source
family/target/receipt durable identities and hashes except namespace-local
device. The target remains selected but unopened; target WAL, SHM, journal,
deterministic work, and source journal remain absent; four stable boundaries
and both zero-holder scans pass; and no SQLite/scratch/write work occurs.
Combined local acceptance—not provider evidence or raw shell output alone—must
record `runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`. Cleanup revalidates everything
and deletes nothing. Then mandatory stop.

`RC-STG-006P23` remains unauthorized and is the only later gate that may
separately authorize a private-copy semantic target verifier and fresh backup.
Its required proof includes integrity `ok`, zero foreign keys, schema/data/
migrations `54/54/54`, exact migration checksum and credential-rotation
receipt, zero active sessions, and zeros for current/predecessor/older fixture
receipts, receipt events/fixture league, manager assignments/activity/
idempotency/notifications, and outbox events/audiences. O23 cannot satisfy those
checks. Reopening/final review, normal restore, rollback, closeout, browser
workflow, production, and any second provider update remain forbidden.

#### 2026-08-26 RC-STG-006O23 V2 Correction Handoff Authority - Rejected During Local Arm / Unconsumed / No Retry

> Historical boundary: every conditional execution statement in this V2 section
> describes the now-rejected frozen design only. It grants no present authority,
> must not be resumed, and is superseded only by the separately pinned V3
> correction below.

The published V2 correction was not a V1 retry because V1 never armed. Preserve the V1 kit
and immutable rejected binding unchanged at
`.netlify/strict-release-HL-20260823-1/target-activation-authority-binding.json`,
exactly `1747` bytes / `46` LF / zero CR / final LF / SHA-256
`a939aaac0770e53cb16c2fd69eea61ef5818d361fbc9a3fa57b64f556d939954`.
They remain historical evidence and permanently non-authorizing.

The rejected V2 authority was published as one literal non-merge docs-only child of
`e855be9e1a4d92cd6428175965ecf934653ae965` changing exactly the standard nine
documents. Its former contract would have activated only after publication as frontend HEAD/
`origin/staging`, confirmation that backend HEAD/`origin/staging` remain clean
at B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb`, and exclusive creation/audit
of the distinct ignored post-publication
`target-activation-v2-authority-binding.json`. O23 remains unchecked. Each line
below is exact, standalone, and unique; the `15` lines joined in this order with
LF and no trailing LF have SHA-256
`4e8cfdd4ffb8f2d80fc7676e3d71358790952ad74dfb7e2848d4b4a563b1fbe5`.

HL23-V2-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-support-manifest.json|bytes=9510|lf=246|cr=0|finalLf=true|sha256=991cb21b885cccb5aebf32af2f0665abe7a5566ce39c3c68f12615a318c81e33
HL23-V2-FROZEN-ARTIFACT-SET|sha256=8d55d858e55c5b3d2edb246df2ffa4cf54175f5c4740292e830680b473010089
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-contract.cjs|bytes=51401|lf=1064|cr=0|finalLf=true|sha256=cfeebad02ed06f93212c7e20e6c4ed2287e15a1f84f86650b2cfea18613cbfad
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-held-verifier.sh|bytes=26189|lf=637|cr=0|finalLf=true|sha256=dccac0c4603a595fd9297900a8d77ddbf25b123632506deeb0d4021b816e32b6
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-shell-envelope.cjs|bytes=14925|lf=331|cr=0|finalLf=true|sha256=c897c0840bcbba97e4ea2cdc2b976a2fac5767cfa88c416fa706d551342d023a
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-held-probes.cjs|bytes=4891|lf=146|cr=0|finalLf=true|sha256=1a056371074d2abce8af289432f6cbf1755be05c03e04ea33a97aecd1592de90
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-action-control.cjs|bytes=34487|lf=773|cr=0|finalLf=true|sha256=10135f961270955c3d488fef0b80eeb86a81722f191eee5f96d61e30e92e4544
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-postflight.cjs|bytes=12226|lf=280|cr=0|finalLf=true|sha256=599499f1371281248ef8911dc5487476e0e91cef4a365e7b832aa629f5ad3fed
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-cleanup.cjs|bytes=9057|lf=193|cr=0|finalLf=true|sha256=018ea28d97d4501e7db890f7409f9afc813ab3b053f6c59e4fba03276c6badb9
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-support-self-test.cjs|bytes=26333|lf=657|cr=0|finalLf=true|sha256=2abc6bd7b01eb51a3ce6b4749700dee776b24bf7e35b837dc3a87cd2930b3cb8
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-verify-freeze.cjs|bytes=20961|lf=418|cr=0|finalLf=true|sha256=5cea7a8fe8b6aa473952714dcb61cd5d8feb382ed4c02851823ff17a01884ca2
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.template.json|bytes=2886|lf=72|cr=0|finalLf=true|sha256=49cb9ca31efe68fccf8981fca527726f04447dcc8a87dfae90ff39010c3bad01
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-RUNBOOK.md|bytes=10982|lf=182|cr=0|finalLf=true|sha256=8619674e891574f7093be684c8c8faceb2170081ca1456a57fd296b3e5f8eb39
HL23-V2-REJECTED-AUTHORITY|commit=e855be9e1a4d92cd6428175965ecf934653ae965|bindingPath=.netlify/strict-release-HL-20260823-1/target-activation-authority-binding.json|bindingBytes=1747|bindingSha256=a939aaac0770e53cb16c2fd69eea61ef5818d361fbc9a3fa57b64f556d939954|failureCode=AUTHORITY_DOCS_DO_NOT_PIN_FROZEN_KIT|authorizing=false|rejectedBeforeAction=true
HL23-V2-REJECTED-SESSION-ACTIVITY|source=root-coordinator-record|providerDispatchOccurred=false|browserShellInputOccurred=false|shellVerifierInvocationOccurred=false|captureArmOccurred=false|rootActivationMutationOccurred=false

The frozen V2 runbook described only the bounded O23 shell-boundary sequence recorded
above under the new filenames, binding, and distinct permanent tombstone
`target-activation-v2-captures/hl-20260823-1-v2-<authority16>-df755011d0e4d4b1/`.
PRE and POST use the pinned new abort-v2/main-WAL-aware verifier through stdin in
fresh no-history shells. They perform no SQLite/scratch/copy/write work, prove
the exact source-to-target runtime-path-only delta, full protected family and
receipt, absences, full hold, and two complete zero-holder scans, and treat
device IDs as namespace-local. Provider evidence must say
`providerEnvironmentReadAvailable:false`; shell/probes prove runtime path/hold.

After a fresh complete deploy-ID edge set and durable tombstone, exactly one
`mcp__render__update_environment_variables` call is allowed with only
`DATABASE_PATH`, `replace:false`, canonical `247`-byte arguments SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`,
source/target value hashes `50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3` /
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`.
No trigger, retry, automatic inverse, or second provider update is authorized.
POST requires a complete one-ID B2 deploy-set difference, target selected but
unopened, unchanged source/target/receipt identities and hashes except namespace-
local device, absent target WAL/SHM/journal/work, zero holders, and full hold.
Combined acceptance alone records `runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`; cleanup deletes nothing, then
mandatory stop. O23 performs no semantic verification and authorizes no backup.
P23 semantic verification/backup, reopening/review, normal restore, rollback,
browser workflow, closeout, production, and all later gates remain forbidden.

#### 2026-08-26 RC-STG-006O23 V3 Correction Handoff Authority - Action Succeeded / Consumed; Acceptance Pending O23A; Old POST Path Blocked

> Historical boundary: this section preserves the V3 authorization design and
> its exact pin block. V3 later consumed its authority and completed exactly one
> successful provider mutation. Its imperative PRE/POST wording grants no present
> authority, and its old POST path must never be resumed or populated.

Published V2 commit `3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323`
collected its immutable binding and seven PRE evidence files, including fresh
provider, shell, and held-probe evidence, and then invoked local `--arm`. Arm
failed closed with `CAPTURE_DIRECTORY_OWNER_OR_MODE_INVALID` before provider
dispatch. The verified V2 binding plus all `21` frozen/PRE/failure files remain
immutable. The binding is
`.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.json`
at `2915` bytes / SHA-256
`d30f9e25c080060e74797b8aed2e831f06507555194058cdecde5ebc12bb1e3a`,
failure JSON at `165` bytes / SHA-256
`1c0faa5e7cf8d1cf12410bd5ca424e59f3e6bd83e3adac1b14ce0d6b28950ea7`,
and residue JSON at `1026` bytes / SHA-256
`b9fe005c8dd35d943fdf534a3406917a95194abe2bd50e935d88131baed598ee`.
Only the empty, ACL-identical Windows parent
`.netlify/strict-release-HL-20260823-1/target-activation-v2-captures` exists and
reports mode `0666`; no authority-specific root, attempt, seal, dispatch, provider
response, or POST evidence exists. V2 made zero provider mutations and zero
`DATABASE_PATH` updates. It is unconsumed but permanently rejected and cannot be
retried or used to authorize V3. Preserve all V1/V2 kit, bindings, PRE, failure,
residue, and empty-parent evidence unchanged.

The root-coordinator reconciliation at `2026-08-26T10:11:44.827Z` recorded sole
live B2, zero new deploys, and auto deploy disabled after the V2 failure. That is
an external attestation, not global provider state proved by local absence. Fresh
V3 provider, shell, probe, and complete cursor-closed deploy-edge PRE evidence
must reconfirm B2 and topology before V3 arm. V3 is a new authority and namespace,
not a retry of V2.

The only eligible V3 correction is one literal non-merge docs-only child of
`3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323`, changing exactly the same standard
nine authority documents. That commit must be published as frontend HEAD and
`origin/staging`; backend HEAD and `origin/staging` must remain clean at B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`. Only then may the distinct ignored
immutable `target-activation-v3-authority-binding.json` be exclusively created
from its frozen template and audited. The binding is post-publication evidence,
is excluded from the frozen kit, and cannot alter these pins. O23 remains
unchecked and conditional until every V3 step passes.

Each line below is an exact, unique, standalone V3 pin using its full
repo-relative path. Joined in this order with LF after every line, including the
last, the `15`-line block is `3261` bytes and has SHA-256
`12da4b1f0d5ad78e0b4c6ae8d922397b3a4e26780949e800d1e9b009f81bde95`.

HL23-V3-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-support-manifest.json|bytes=12378|lf=312|cr=0|finalLf=true|sha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f
HL23-V3-FROZEN-ARTIFACT-SET|sha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-contract.cjs|bytes=88806|lf=1812|cr=0|finalLf=true|sha256=f5500a62f243b0a5743ffc4b31e279da6f493a93358b415535bc63d9bbfd9aba
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-held-verifier.sh|bytes=26190|lf=638|cr=0|finalLf=true|sha256=9d0c02916e8eff54f98d3b3121774f7740b0af3bd30d9d5d588c768f674812ac
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-shell-envelope.cjs|bytes=14926|lf=332|cr=0|finalLf=true|sha256=61a5f62e07e41787ff7b70d7e487ed5481346bb5c12a5b7b43e4ec60cbf85529
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-held-probes.cjs|bytes=4892|lf=147|cr=0|finalLf=true|sha256=6012eee2b69c744e3779354e8a2d82edba71597b502bca3e08ae299469ed13ba
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-action-control.cjs|bytes=48066|lf=1078|cr=0|finalLf=true|sha256=b67b14e3f8b5a6e325b9c595255df72450c25cccb0e4181c1f864b80105640af
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-postflight.cjs|bytes=18441|lf=420|cr=0|finalLf=true|sha256=167cb32e107815dc3ebec1e89abc148529922df15b2d0d3d66597cc09fa37f42
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-cleanup.cjs|bytes=9786|lf=205|cr=0|finalLf=true|sha256=b91ac81fc981e620740933c25571eefc94a55deee6e656b0603aa905356bdfc3
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-support-self-test.cjs|bytes=29733|lf=727|cr=0|finalLf=true|sha256=0a16e984f34f7752721f482700798f7f71d22af86a86da03c2cb6df259336575
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-verify-freeze.cjs|bytes=25017|lf=492|cr=0|finalLf=true|sha256=9a167a73f12e38e301679a4d6f155942c6a04aa42b4d716a0e34d228032a8046
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-authority-binding.template.json|bytes=4818|lf=124|cr=0|finalLf=true|sha256=411b7ccd099a2c26481a69c7c7d149252b8572361d771f8c57bfb21d4be107e6
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-RUNBOOK.md|bytes=13751|lf=218|cr=0|finalLf=true|sha256=a7d46231cce61a7b309c77d23d25a6482f97fb99c7c2c907db39d4bcac8c2473
HL23-V3-REJECTED-AUTHORITY|commit=3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323|bindingPath=.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.json|bindingBytes=2915|bindingSha256=d30f9e25c080060e74797b8aed2e831f06507555194058cdecde5ebc12bb1e3a|failureCode=CAPTURE_DIRECTORY_OWNER_OR_MODE_INVALID|authorizing=false|rejectedBeforeProviderDispatch=true
HL23-V3-REJECTED-SESSION-ACTIVITY|source=root-coordinator-record|providerDispatchOccurred=false|databasePathUpdateOccurred=false|captureArmSucceeded=false|v2PreEvidenceAuthorizing=false|freshV3PreRequired=true

The frozen V3 manifest is exactly `12378` bytes / `312` LF / zero CR / final LF
with SHA-256 `07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f`;
its `11` artifacts total `284426` bytes and have canonical artifact-set SHA-256
`1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03`.
Only the pinned V3 abort-v2/main-WAL-aware held verifier may run, and only for
raw phases `pre-boundary` and `activation-post`. In a fresh attached shell,
disable and clear history with `HISTFILE=/dev/null`, then stream it through stdin
as `bash -s -- pre-boundary dep-da6ghj67bikc738hbbv0` and later
`bash -s -- activation-post dep-<new>`; persist no remote verifier or scratch
file. Both phases are shell-boundary proof only: no
SQLite/project database module, database open, copy, checkpoint, sidecar removal,
scratch creation, or write is reachable.

Fresh PRE must prove the exact source path and full source main/WAL/SHM family,
target main and canonical receipt, five required absences, the critical `20`-key
runtime matrix plus nine absent provider fields, four stable boundaries, two
complete zero-denied/zero-holder `/proc/*/fd` scans, and the full hold. Device IDs
are namespace-local: internal identity consistency is required, historical
receipt device values remain bound, and PRE/POST container devices are never
compared. Raw results remain non-authorizing and state
`externalAuthorityBindingRequired=true`,
`externalAuthorityBindingVerifiedByVerifier=false`,
`standaloneAcceptanceAuthorized=false`, and
`verifierGrantsMutationAuthority=false`.

Provider evidence may record only the exact requested target call and unique
deploy/build/service/log facts; it cannot prove configured/runtime path or the
hold and must record `providerEnvironmentReadAvailable:false`; never persist raw
provider payload or secrets. Provider PRE, shell envelope, and probes must precede
a fresh, complete, paginated, cursor-closed deploy-ID edge set captured within two
minutes of arm, with held B2 still sole newest/`LIVE` and no active/pending
competitor. V3 arm creates
the single authority-specific permanent sentinel directly under the trusted
release root:
`target-activation-v3-capture-hl-20260823-1-v3-<authority16>-9ea94bc779a0ce54/`.
It creates no shared parent. On Windows, exact inherited owner/SID/SDDL/ACE,
non-reparse realpath, atomic exclusivity, stable rereads, and expected mode `0666`
apply; no POSIX `0700` equivalent, confidentiality, or hostile-authorized-principal
tamper resistance is claimed. POSIX uses directory/file modes `0700`/`0600`.
Durable root, attempt, separate tombstone seal, fsyncs, and stable exact entry-set
proof must finish before dispatch; root presence permanently consumes V3.

The sole mutation is exactly one
`mcp__render__update_environment_variables` call with canonical `247`-byte
arguments SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`:
`{"envVars":[{"key":"DATABASE_PATH","value":"/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3"}],"replace":false,"serviceId":"srv-d9eo2turnols73ekb830","workspaceId":"tea-d4prbj7diees738tmg90"}`.
Source/target value hashes remain
`50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3` /
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`.
No trigger, retry, automatic inverse, or second provider update is authorized;
error, timeout, disconnect, or ambiguity requires read-only reconciliation.

POST must prove a complete deploy-ID set difference of exactly one new
API-triggered B2 deploy, sole newest/`LIVE`, with the prior deploy deactivated,
no competitor, exact Node `24.14.1` / npm `11.11.0`, all `443` suites / `3519`
tests passing, and complete clean build/runtime log windows. Fresh activation-POST
shell evidence and five held probes must prove only `DATABASE_PATH` changed,
target selected but unopened, source/target/receipt durable identities and hashes
unchanged except namespace-local device, target WAL/SHM/journal/work and source
journal absent, two zero-holder scans, and full hold. Combined local acceptance
alone may record `runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`. Cleanup revalidates and deletes
nothing; then stop. `RC-STG-006P23` alone may later authorize private-copy
semantic verification and backup. P23, reopening/review, normal restore,
rollback, browser workflow, closeout, production, and every second provider
update remain forbidden.

#### 2026-08-26 RC-STG-006O23A V4 Read-Only Evidence Continuation Operations Authority - Published / Bound / Diagnostic Failed / Unconsumed / Retired

> Historical boundary: V4 was published and separately bound, but its action
> path was never consumed. Its diagnostic used the wrong continuation token,
> produced no provider evidence/action artifact/capture sentinel, and is now
> `BOUND_UNCONSUMED_RETIRED`. Every imperative V4 statement below is retired;
> only its exact inherited pin rows remain authoritative historical evidence.

Consumed V3 authority `43e99e686214a2f36f52ee7c426db2015d709bee`
completed exactly one successful provider `DATABASE_PATH` mutation and returned
sole newest/`LIVE` exact-B2 deploy `dep-da7d857avr4c73bnna90`. Its old POST path
is permanently blocked solely because exhaustive hosted logs lacked an explicit
npm `11.11.0` observation; all eight named V3 POST artifacts must remain absent
forever. V3 must not be retried or backfilled. O23 remains unchecked with its
acceptance pending O23A.

V4/O23A must be one literal non-merge exact-nine documentation child of
`43e99e686214a2f36f52ee7c426db2015d709bee`, published as frontend `HEAD` and
`origin/staging`, while backend `HEAD`/`origin/staging` remain clean at exact B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`. Only then may the separate ignored
immutable V4 binding be exclusively generated and audited. These are the exact
`21` runner-emitted authority rows; final-row success fields define the future
accepted state and do not claim the two currently unchecked gates passed.

HL23-V4-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-support-manifest.json|bytes=11358|lf=286|cr=0|finalLf=true|sha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428
HL23-V4-FROZEN-ARTIFACT-SET|sha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-contract.cjs|bytes=75803|lf=1499|cr=0|finalLf=true|sha256=9868b381d735b109519be63cddd62869e72cb3037489046a5ff8b7b037a31f57
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=af911c11d71dba90ab1a068475622bcab67d3dbe1897b25e0bd95f943ef1686b
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-shell-envelope.cjs|bytes=35536|lf=770|cr=0|finalLf=true|sha256=5359876b097d8cb05f07a9befd5d7d4e5e3612f363cb66700d09b18ae22679b1
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=adbf73addb943d9c7f7d6d4c3b75d4e9b42cac06358100cf03a0673e70d4792f
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-action-control.cjs|bytes=42066|lf=910|cr=0|finalLf=true|sha256=7b67d758468aabd11a6594d25aab0cdc6c77cd80c32144036265ae28408bdfa7
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-provider-projection.cjs|bytes=67106|lf=1525|cr=0|finalLf=true|sha256=c825826c3651369f94aff0bfb75de63a115b301077db8feb84aa88ad1364b358
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-authority-ops.cjs|bytes=11363|lf=262|cr=0|finalLf=true|sha256=89d2d34604f5a3df03f5161d6d024eba793fbf5b7145d26a3b9fe4e3f3d6102e
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-local-runner.ps1|bytes=51440|lf=1087|cr=0|finalLf=true|sha256=89c6887fa3e31b6885c3ec62e7d8c0796541f5292c387f12999473e963d90f02
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-postflight.cjs|bytes=17194|lf=398|cr=0|finalLf=true|sha256=b907741e922295012bc66cd54ed6c0d01cdc9e39982cec50acba352285295f08
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-cleanup.cjs|bytes=5313|lf=141|cr=0|finalLf=true|sha256=91e9d7ecbf5df1da46d2122a341a10c726974b7e7a25faed4a2a917e8b1f8294
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-support-self-test.cjs|bytes=40052|lf=843|cr=0|finalLf=true|sha256=3eb5499c80fd92b0f199f6d83083b7577ee257f36a0157fc1f3c20e39bd41862
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-verify-freeze.cjs|bytes=31193|lf=591|cr=0|finalLf=true|sha256=54e6711c8fa38cd95182d290bbf1f01a8d10ba0f1d23a6b8453548e3a8c34399
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-authority-binding.template.json|bytes=7134|lf=176|cr=0|finalLf=true|sha256=b0c64c20901ed5d67498d392e023475e480c6a1817b5755262a6339a027f6962
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-RUNBOOK.md|bytes=18634|lf=320|cr=0|finalLf=true|sha256=e26ba353e79a1fe07244211f17226ab6fde8d0dc22c48fa66475ba396b5a8886
HL23-V4-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV4ProviderMutation=false
HL23-V4-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V4-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V4-CONTINUATION-AUTHORITY|parent=43e99e686214a2f36f52ee7c426db2015d709bee|checklistId=RC-STG-006O23A|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V4-STATUS|authorityO23=UNCHECKED_PENDING_O23A|authorityO23A=UNCHECKED|v3PostPathPermanentlyBlocked=true|o23AcceptancePendingO23A=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|mandatoryStopBefore=RC-STG-006P23

After publication/binding, execute only this order: provider PRE; five held PRE
probes; preflight and durable one-shot O23A arm; one sealed live-runtime npm
`11.11.0` observation; provider POST; one sealed byte-exact inherited V3
`activation-post` observation; five held POST probes; provider FINAL topology
bracket; aggregate postflight; zero-delete cleanup; mandatory stop before P23.
The npm sample uses actual exported runtime values with no expected-value
injection and is not build-time proof. Provider request evidence accounts for
expected held `503` tuples rather than claiming generic zero 5xx. V4 authorizes
zero provider mutations; the combined total remains one. O23 and O23A stay
unchecked until completion and must then be checked together. P23, backup,
reopen, rollback, production, and later gates remain forbidden. No backup,
restore, SQLite open, or semantic target verification is authorized by V4.

#### 2026-08-26 RC-STG-006O23B V5 Opaque-Cursor Authority - Published / Binding Launch Failed Prewrite / Unconsumed Retired

Published V5 authority
`dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10`, literal non-merge child of
`f17b2278542ef6836550a556abd97d82c9bf79db`, never produced its required
authority binding. The exact RUNBOOK launch carried authority
`dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10` and committed-at
`2026-08-26T22:09:21.000Z`; its created-at value was generated immediately
before the call but was not printed or captured, so the exact value is
unavailable and must not be reconstructed.

Windows PowerShell 5.1 rejected the array-over-`-File` transport during outer
parameter binding, before the runner body, runner self-pin, Node, binding-
candidate generation, or any write began, and returned native exit code `1`.
The sanitized operator-observed safe text was exactly
`target-activation-v5-local-runner.ps1 : A positional parameter cannot be found that accepts argument '2026-08-26T22:09:21.000Z'.`
(128 UTF-8 bytes; SHA-256
`bb1498b816e09c94654563f7b251068e8529f2d3d952eda097ddbb1fade5df22`).
The category was `InvalidArgument` / `ParentContainsErrorRecordException`; the
fully qualified ID was
`PositionalParameterNotFound,target-activation-v5-local-runner.ps1`. The
just-before wall sample was `2026-08-26T22:10:25.643Z`. No canonical stdout
existed, and the transport did not preserve raw stdout/stderr separately, so
the raw transport digest is unavailable. These are operator-attested
diagnostic facts, not an invented failure receipt or continuation-attempt
evidence.

The V5 binding was absent before and after the failed launch, with zero bytes;
all 20 binding/action paths and every V5 capture sentinel remain absent.
Provider reads, provider mutations, browser actions, and network requests were
all zero. V5 is exactly
`PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED`; it must
never be resumed, rebound, retried, repaired in place, or repurposed.

V8/O23E is the only eligible continuation. Published V7 authority
`d0d80e98f27e9a5b0079eeb88134523f443a7cad`, literal child of
`3c87d50e613e9f3292ac5808a5dcbabd7aa29108`, consumed its sole prebinding
diagnostic-loader attempt. Its exact terminal was
`{"code":"HL23_TARGET_ACTIVATION_V7_PREBINDING_DIAGNOSTIC_LOADER_ABORTED","diagnosticOnly":true,"diagnosticRetryAuthorized":false,"productionOneShotConsumed":false,"productionPhaseAttempted":false,"providerCaptureHostStarted":false,"providerMutationAuthorizedCount":0,"reason":"V7_LOADER_VERIFIER_TERMINAL_STATE_UNKNOWN"}`.
The outer cell completed in 22.5 seconds. The diagnostic-loader role and its
own-source reread were established; the production-loader and bootstrap
sources were locally reread, but the production loader was never submitted
and the bootstrap was never evaluated. Verifier start was attempted, but no
safe-integer session ID was acquired, no READY was accepted, no input frame
was submitted, and no receipt was observed. The original safe code is
unavailable; the only honest possibilities are
`V7_LOADER_VERIFIER_START_FAILED` and `V7_LOADER_VERIFIER_START_INVALID`.
Whether a short-lived verifier process started or reached terminal state is
unknown.

V7's binding remained absent, no phase reservation was created, production
was unattempted and unconsumed, and the scoped audited loader flow recorded
zero provider reads and mutations. External connector telemetry is
unavailable and absence of an untrusted prefix is unproven. V7 is exactly
`PUBLISHED_UNBOUND_PREBINDING_DIAGNOSTIC_LOADER_ABORTED_NO_PHASE_RESERVATION_RETIRED`;
it must never be retried, bound, resumed, repaired in place, repurposed, or
used for a production phase. The failure consumed no production phase, but
that does not grant another V7 diagnostic attempt.

V8 removes both interactive local hosts. Its loader uses frozen pure-JavaScript
UTF-8/SHA-256 verification before executing the same in-memory bootstrap; the
phase path is sessionless and uses CreateNew reservation, CreateNew claim, and
one bounded pinned-Node output-then-commit transaction. Self-hash evidence is
accidental integrity only, not platform submission attestation or proof that an
untrusted prefix is absent. V8 authorizes no provider mutation, deployment,
retry, rollback, database open, backup, reopen, semantic verification, or
production action. The release-wide provider-mutation count remains exactly
one, inherited from V3.

O23, O23A, O23B, O23C, and O23D are `UNCHECKED_PENDING_O23E`; O23E is
`UNCHECKED`. Only a successful V8 aggregate plus zero-delete cleanup may make
all six eligible for a separate completion-evidence documentation commit
marking them `PASS_CONSUMED` together. This authority publication checks none
of them.

V8/O23E must be one literal non-merge exact-nine documentation child of
`d0d80e98f27e9a5b0079eeb88134523f443a7cad`, published as frontend `HEAD`
and `origin/staging`, while backend `HEAD` and `origin/staging` remain clean
at exact B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb`. Only after publication
may the distinct frozen sessionless prebinding diagnostic loader run once.
Only its exact accepted terminal may feed one separate ignored immutable
`target-activation-v8-authority-binding.json`; only after that binding is
created and independently audited may a V8 production evidence phase begin.

All 142 published standalone V1-V7 rows below remain byte-for-byte and in
exact total document order. Immediately after the final V7 row, the frozen
scalar runner and authority generator append the exact 40 standalone V8 rows.
Joined in generated order with LF after every V8 row, that block is 21,271
UTF-8 bytes / 40 LF / zero CR / final LF with SHA-256
`a60c619e7012a28dc89a41fb74c39c44352294a9d415684123cc5fb50cd57b5d`.
Prospective success fields define only the future accepted completion state;
they do not claim that any currently unchecked gate has passed.
HL23-V5-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-support-manifest.json|bytes=20229|lf=474|cr=0|finalLf=true|sha256=47f98ab16da1d858508a0b0abf2686e51e7af3132b3abacb7efa5b2b640574ff
HL23-V5-FROZEN-ARTIFACT-SET|sha256=894fc3cdcd88ea21ca7a373a7349dd326f03fae07537a650670ac49abd8b67da
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-contract.cjs|bytes=141708|lf=2828|cr=0|finalLf=true|sha256=cf83a4d73cd3e3b9367872491cddeff1f05ea7ccc8ab79eb1e51d41cb9874836
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=42b723446feb04089b452571ad25dfb292c3bb05f5f3787cbc19120e95bf9c5e
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-shell-envelope.cjs|bytes=36179|lf=782|cr=0|finalLf=true|sha256=f319720cf01ed3eb4b3a1ea7a76f0d3ff96ce79c27700aa70bb1dfb22b6a86f2
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=8e550c9ca59c19495919c22dd261cb33889bca43855017d27378bbaeb90387c3
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-action-control.cjs|bytes=58108|lf=1232|cr=0|finalLf=true|sha256=c7070f220b48f6e9d0275bdec38dbdf2fcbda640985cba76c62a50a4f441bc5e
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-provider-projection.cjs|bytes=230685|lf=4892|cr=0|finalLf=true|sha256=2f7a1f7b123b99e43dcd59d6481739b23e8aaa9e77507470799c16aafa0704a1
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-authority-ops.cjs|bytes=12451|lf=284|cr=0|finalLf=true|sha256=fcacde2ba10da408cf5ab18abdb796787d6bf1a637b90476344caf91a9467b8b
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-local-runner.ps1|bytes=102644|lf=2033|cr=0|finalLf=true|sha256=5eec1777e3d815686ea9d94b7fce55d8e397093bfb17be7a226a3df06b820c45
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-postflight.cjs|bytes=18583|lf=423|cr=0|finalLf=true|sha256=8a8ca65197132b166837ce117949e17e696cd094bf4cacad3a0ff48eb9e2a6e7
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-cleanup.cjs|bytes=5313|lf=141|cr=0|finalLf=true|sha256=a4abad2902ed2899e195b44d52bdc4ede54a40e266995ff45ea95f2d092b38f2
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-support-self-test.cjs|bytes=36803|lf=771|cr=0|finalLf=true|sha256=eed8801d5e504799008be0021749439c8b3cd989f63d66e1d62768123be7e9e3
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-verify-freeze.cjs|bytes=44938|lf=874|cr=0|finalLf=true|sha256=81cac116b97f9bd3f0e28b2f565a4c7998bfb25005278e5355e2a2fa9caebb2b
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-authority-binding.template.json|bytes=14951|lf=349|cr=0|finalLf=true|sha256=b23339b72fc15cdfd55276a37ff1049f6b663694988c95f7c4c164e14f8ffebe
HL23-V5-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v5-RUNBOOK.md|bytes=22764|lf=431|cr=0|finalLf=true|sha256=b02a5640e2080f04672e5543619b0d9a4fe6906997d34da98ca390ffce5ade91
HL23-V5-PROVIDER-EXECUTABLE-SOURCE|kind=full-phase-orchestrator|artifact=target-activation-v5-provider-projection.cjs|command=--orchestrator-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V5_FULL_PHASE_PROVIDER_ORCHESTRATOR_SOURCE|bytes=38331|lf=821|cr=0|finalLf=true|sha256=df769cf53c405dbb4c9bd1f591c981ef31b777247b2e9d90d5f25f3dc777ac09|loadedOnlyByExactBootstrap=true
HL23-V5-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-bootstrap|artifact=target-activation-v5-provider-projection.cjs|command=--bootstrap-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V5_FUNCTIONS_EXEC_BOOTSTRAP_SOURCE|bytes=32412|lf=664|cr=0|finalLf=true|sha256=574c24062ee5c0dbbb91b21bea09d18e3daa1c66fe05699c08daab9e4246c3d2|functionsExecEntireInput=true|prefixSuffixAllowed=false|platformSubmittedSourceAttested=false|operatorAuditedExactWholeCellRequired=true
HL23-V5-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV5ProviderMutation=false
HL23-V5-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V5-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V5-INHERITED-V4-AUTHORITY|commit=f17b2278542ef6836550a556abd97d82c9bf79db|parent=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=11358|manifestSha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428|artifactSetSha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422|artifactCount=14|bindingBytes=6067|bindingSha256=2c6c4876a50bc5b40476d50e70e27f4eba5214de6d3dd9f2d8acbbdb4b3905df|state=BOUND_UNCONSUMED_RETIRED|authorizingV5ProviderMutation=false
HL23-V5-FORBIDDEN-V4-ACTION|count=16|paths=target-activation-v4-provider-preflight.json,target-activation-v4-held-probes-preflight.json,target-activation-v4-npm-observation-plan.json,target-activation-v4-npm-observation-stdin.txt,target-activation-v4-npm-observation.json,target-activation-v4-npm-observation-envelope.json,target-activation-v4-provider-postflight.json,target-activation-v4-shell-postflight-plan.json,target-activation-v4-shell-postflight-stdin.txt,target-activation-v4-shell-postflight.json,target-activation-v4-shell-postflight-envelope.json,target-activation-v4-held-probes-postflight.json,target-activation-v4-provider-final.json,target-activation-v4-postflight-result.json,target-activation-v4-cleanup-result.json,target-activation-v4-arm-failure.json|mustRemainAbsent=true|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V5-INHERITED-V4-DIAGNOSTIC|canonicalSha256=a86a897e5652e6c8c40bf6a5aae7a6349e6afe9c827429ff2de25c285a15743f|evidenceStatus=diagnostic-only-no-provider-evidence-file|firstPageEntryCount=100|rejectionStatus=400|outputPersisted=false|captureSentinelCreated=false|providerMutationCount=0|diagnosticOnly=true|requiredExecutionShape=false|authorizing=false
HL23-V5-CONTINUATION-AUTHORITY|parent=f17b2278542ef6836550a556abd97d82c9bf79db|checklistId=RC-STG-006O23B|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V5-STATUS|authorityO23=UNCHECKED_PENDING_O23B|authorityO23A=UNCHECKED_PENDING_O23B|authorityO23B=UNCHECKED|v3PostPathPermanentlyBlocked=true|v4ActionPathRetiredUnconsumed=true|o23AcceptancePendingO23B=true|o23AAcceptancePendingO23B=true|o23BAcceptancePending=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|successfulO23B=PASS_CONSUMED|prospectiveSuccessOnlyTogether=true|mandatoryStopBefore=RC-STG-006P23
HL23-V6-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-support-manifest.json|bytes=30664|lf=698|cr=0|finalLf=true|sha256=d2d27f03eea8904d4d20124a7a76772ef5d97c9249bbb942d9cb882fb5cb4fa0
HL23-V6-FROZEN-ARTIFACT-SET|sha256=91bd4b8e69d55903342b4391c4383fed5a19d3afe2d2a8f64a289950466cc63b
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-contract.cjs|bytes=157028|lf=3174|cr=0|finalLf=true|sha256=2b5f2d059c7c6ffd83b0cb782f5cf45b9920548e84d46d287114b3c45194b9b7
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=c17d661f4033e54df10961e60759126126579eb881829f46379aaf287462fd26
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-shell-envelope.cjs|bytes=36179|lf=782|cr=0|finalLf=true|sha256=6075cf98cc9bbeb23af0a14dcda60b7eade19f7235e836e2cff614aa8694dbcf
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=987f22caf039d3dee7943abadaa865a7f9215e16b3e76a052c3da6deee6988d8
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-action-control.cjs|bytes=74515|lf=1591|cr=0|finalLf=true|sha256=38c734370ad91436cc9d39e29ecb48ee09affb225234d8b399ac968fe538186f
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-provider-projection.cjs|bytes=232623|lf=4918|cr=0|finalLf=true|sha256=2f2b6ae371b9f719c2dc3a772719bc19078eedd3c38323901e67321abaa1394e
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-authority-ops.cjs|bytes=12595|lf=287|cr=0|finalLf=true|sha256=2d6a56a59dacafb44018a40b5e61ba2228e72c775229e131a166d0ab9253a14f
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-local-runner.ps1|bytes=142487|lf=2901|cr=0|finalLf=true|sha256=521acba6595dcb90c2cee62fdf6ea4bd46e9b01cf90a2cb04da4ab075dcd63fc
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-pre-node-dependency-lock.json|bytes=7308|lf=227|cr=0|finalLf=true|sha256=4a2dfecf604e8da2a9204a5ee7f30e38dabe9145a453c4f6845924b285265612
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-postflight.cjs|bytes=19509|lf=450|cr=0|finalLf=true|sha256=ec9883231346b0caad63dd85e2b03df51068e2c6b711b74108e709fb01af2894
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-cleanup.cjs|bytes=6929|lf=180|cr=0|finalLf=true|sha256=97735125f8f02bc52232c2b057f95dd3cfeb2eacf9005fb8f5f35121ffb739ad
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-support-self-test.cjs|bytes=63034|lf=1266|cr=0|finalLf=true|sha256=bda4670291421fd4c4c5b3f5cb4cdad39d1ba21656b378e4b6852bc276b41c3d
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-verify-freeze.cjs|bytes=65136|lf=1232|cr=0|finalLf=true|sha256=92c820cf1b5b72671ab7db73a7d3d3ee382862c200c285daec9142e760d07881
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-authority-binding.template.json|bytes=23107|lf=532|cr=0|finalLf=true|sha256=cf3cf5d84154e1cf35093cacd2c38dde17ec0102c2aa99eba84f4661f04e0228
HL23-V6-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v6-RUNBOOK.md|bytes=36233|lf=623|cr=0|finalLf=true|sha256=034ed0b0ac0f6c2d50414bdb756d7fded4992c5ef263c66b193e37fd35556f15
HL23-V6-PROVIDER-EXECUTABLE-SOURCE|kind=full-phase-orchestrator|artifact=target-activation-v6-provider-projection.cjs|command=--orchestrator-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V6_FULL_PHASE_PROVIDER_ORCHESTRATOR_SOURCE|bytes=38331|lf=821|cr=0|finalLf=true|sha256=b081ec740cf7444569ce2b857fff6f512b34a0e74eaf5bb2af418646d500b52b|loadedOnlyByExactBootstrap=true
HL23-V6-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-bootstrap|artifact=target-activation-v6-provider-projection.cjs|command=--bootstrap-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V6_FUNCTIONS_EXEC_BOOTSTRAP_SOURCE|bytes=32416|lf=664|cr=0|finalLf=true|sha256=fdc88fcf0c46d5dab434dc133d26b8c08ee63945429507737b9d41864eb388e8|functionsExecEntireInput=true|prefixSuffixAllowed=false|platformSubmittedSourceAttested=false|operatorAuditedExactWholeCellRequired=true
HL23-V6-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV6ProviderMutation=false
HL23-V6-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V6-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V6-INHERITED-V4-AUTHORITY|commit=f17b2278542ef6836550a556abd97d82c9bf79db|parent=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=11358|manifestSha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428|artifactSetSha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422|artifactCount=14|bindingBytes=6067|bindingSha256=2c6c4876a50bc5b40476d50e70e27f4eba5214de6d3dd9f2d8acbbdb4b3905df|state=BOUND_UNCONSUMED_RETIRED|authorizingV6ProviderMutation=false
HL23-V6-FORBIDDEN-V4-ACTION|count=16|paths=target-activation-v4-provider-preflight.json,target-activation-v4-held-probes-preflight.json,target-activation-v4-npm-observation-plan.json,target-activation-v4-npm-observation-stdin.txt,target-activation-v4-npm-observation.json,target-activation-v4-npm-observation-envelope.json,target-activation-v4-provider-postflight.json,target-activation-v4-shell-postflight-plan.json,target-activation-v4-shell-postflight-stdin.txt,target-activation-v4-shell-postflight.json,target-activation-v4-shell-postflight-envelope.json,target-activation-v4-held-probes-postflight.json,target-activation-v4-provider-final.json,target-activation-v4-postflight-result.json,target-activation-v4-cleanup-result.json,target-activation-v4-arm-failure.json|mustRemainAbsent=true|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V6-INHERITED-V4-DIAGNOSTIC|canonicalSha256=a86a897e5652e6c8c40bf6a5aae7a6349e6afe9c827429ff2de25c285a15743f|evidenceStatus=diagnostic-only-no-provider-evidence-file|firstPageEntryCount=100|rejectionStatus=400|outputPersisted=false|captureSentinelCreated=false|providerMutationCount=0|diagnosticOnly=true|requiredExecutionShape=false|authorizing=false
HL23-V6-INHERITED-V5-AUTHORITY|commit=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|parent=f17b2278542ef6836550a556abd97d82c9bf79db|committedAt=2026-08-26T22:09:21.000Z|manifestBytes=20229|manifestLf=474|manifestCr=0|manifestFinalLf=true|manifestSha256=47f98ab16da1d858508a0b0abf2686e51e7af3132b3abacb7efa5b2b640574ff|artifactSetSha256=894fc3cdcd88ea21ca7a373a7349dd326f03fae07537a650670ac49abd8b67da|artifactCount=14|artifactBytes=747682|bindingRequired=true|bindingPresent=false|bindingBytes=0|state=PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED|authorizingV6ProviderMutation=false
HL23-V6-FORBIDDEN-V5-BINDING-AND-ACTION|count=20|paths=target-activation-v5-authority-binding.json,target-activation-v5-provider-preflight.json,target-activation-v5-provider-preflight.commit.json,target-activation-v5-held-probes-preflight.json,target-activation-v5-npm-observation-plan.json,target-activation-v5-npm-observation-stdin.txt,target-activation-v5-npm-observation.json,target-activation-v5-npm-observation-envelope.json,target-activation-v5-provider-postflight.json,target-activation-v5-provider-postflight.commit.json,target-activation-v5-shell-postflight-plan.json,target-activation-v5-shell-postflight-stdin.txt,target-activation-v5-shell-postflight.json,target-activation-v5-shell-postflight-envelope.json,target-activation-v5-held-probes-postflight.json,target-activation-v5-provider-final.json,target-activation-v5-provider-final.commit.json,target-activation-v5-postflight-result.json,target-activation-v5-cleanup-result.json,target-activation-v5-arm-failure.json|mustRemainAbsent=true|prefixInventoryCount=15|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V6-INHERITED-V5-BINDING-LAUNCH-FAILURE|authorityCommit=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|committedAt=2026-08-26T22:09:21.000Z|justBeforeWallSample=2026-08-26T22:10:25.643Z|nativeExitCode=1|failureStage=outer-powershell-parameter-binding-pre-runner-body|safeTextUtf8Bytes=128|safeTextSha256=bb1498b816e09c94654563f7b251068e8529f2d3d952eda097ddbb1fade5df22|category=InvalidArgument|exceptionType=ParentContainsErrorRecordException|fullyQualifiedErrorId=PositionalParameterNotFound,target-activation-v5-local-runner.ps1|invocationMatchedRunbookBindingBlock=true|createdAtGeneratedImmediatelyPreCall=true|exactCreatedAtUnavailable=true|runnerBodyEntered=false|runnerSelfPinRan=false|pinnedNodeStarted=false|bindingCandidateGenerationStarted=false|captureWriteAttempted=false|canonicalStdoutPresent=false|rawTransportDigestUnavailable=true|bindingAbsentBeforeAndAfter=true|failureReceiptCreated=false|operatorAttestedDiagnostic=true|authoritativeActionEvidence=false|continuationAttemptEvidence=false|providerReadCount=0|providerMutationCount=0|browserActionCount=0|networkRequestCount=0
HL23-V6-CONTINUATION-AUTHORITY|parent=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|checklistId=RC-STG-006O23C|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|v5BindingRetryAuthorized=false|v5ResumptionAuthorized=false|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V6-STATUS|authorityO23=UNCHECKED_PENDING_O23C|authorityO23A=UNCHECKED_PENDING_O23C|authorityO23B=UNCHECKED_PENDING_O23C|authorityO23C=UNCHECKED|v3PostPathPermanentlyBlocked=true|v4ActionPathRetiredUnconsumed=true|v5ActionPathRetiredUnconsumed=true|v5BindingRetryAuthorized=false|o23AcceptancePendingO23C=true|o23AAcceptancePendingO23C=true|o23BAcceptancePendingO23C=true|o23CAcceptancePending=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|successfulO23B=PASS_CONSUMED|successfulO23C=PASS_CONSUMED|prospectiveSuccessOnlyTogether=true|mandatoryStopBefore=RC-STG-006P23
HL23-V7-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-support-manifest.json|bytes=41076|lf=909|cr=0|finalLf=true|sha256=77fa1f99a27a9aa885e05e7b7ee23efc7d5ef1452f6befbc3d065665163b457a
HL23-V7-FROZEN-ARTIFACT-SET|sha256=40170902e06ba4cadc84ae9fc7103a62acfa201655c932eb18d3627c71a29e18
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-contract.cjs|bytes=186909|lf=3786|cr=0|finalLf=true|sha256=a098a1b2e2d5240f077b3e6668ec65a64dfa82167f7891712e0e8eebc2eb82c7
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=db57bd20eb49271c4a35e17de33c0cc763d195e8902a6ea7afd2a2901c57bcb9
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-shell-envelope.cjs|bytes=36179|lf=782|cr=0|finalLf=true|sha256=9304cae98ebddc66773f314a9c47f7b718d721daec9f22f26388c784431c2c24
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=409db1ad0cf9177237bd93badd3fb18be5ed90245143931806623d723ea5fced
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-action-control.cjs|bytes=84207|lf=1779|cr=0|finalLf=true|sha256=762b2999a6f67f2836945dcc3a563156ee35d24154e34d74a745e4c1e2046cb0
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-provider-projection.cjs|bytes=301523|lf=6236|cr=0|finalLf=true|sha256=a5ef681821d1aa72b95fe6d3cce666d37252bb0c8c0d2e4f8de598c8986340ec
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-authority-ops.cjs|bytes=19481|lf=446|cr=0|finalLf=true|sha256=c6d6973e2644102551e7a5fe973e1b8cdf6e8bfe44dd1040267f0975066ee55a
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-local-runner.ps1|bytes=162240|lf=3264|cr=0|finalLf=true|sha256=c52f3fbc07eee427a432ecabc2906067e7a83a4da1514fbe3d141a5e06538d1e
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-pre-node-dependency-lock.json|bytes=8521|lf=262|cr=0|finalLf=true|sha256=14da996585fa9c1335af27f877957cc2a2e747d9b76465b3f7a87794792056bf
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-postflight.cjs|bytes=19547|lf=451|cr=0|finalLf=true|sha256=926f8c70258f35cbd94db2633cf55b83a6333c855048b456e126829a82de3a95
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-cleanup.cjs|bytes=6929|lf=180|cr=0|finalLf=true|sha256=415b9ba6aa211a02ba945ed5059535c2dbc6f28dc41d499a5b76e0f8c9175673
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-support-self-test.cjs|bytes=78947|lf=1558|cr=0|finalLf=true|sha256=024a16401580e30a26d944ecfce1b99bca7a2340dfa7c5db46413f394616396c
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-verify-freeze.cjs|bytes=78349|lf=1480|cr=0|finalLf=true|sha256=db5d4c078a95832dd50b0761004b3a28c43a9a2f16aeb027873c687ed702a103
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-authority-binding.template.json|bytes=35512|lf=798|cr=0|finalLf=true|sha256=b1b84522efc176e959263db0f2f24509a10dd68c4fcb20a74008bd1ec9e05a12
HL23-V7-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v7-RUNBOOK.md|bytes=45283|lf=742|cr=0|finalLf=true|sha256=c07d7f6dc63529f8bffaf7b77356d0ac4d7904a92865d27a294243c555d3a9a7
HL23-V7-PROVIDER-EXECUTABLE-SOURCE|kind=full-phase-orchestrator|artifact=target-activation-v7-provider-projection.cjs|command=--orchestrator-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V7_FULL_PHASE_PROVIDER_ORCHESTRATOR_SOURCE|bytes=38331|lf=821|cr=0|finalLf=true|sha256=663399083c4b030fe5dedc39496a7a41b164b8443e70aa90341e17526f6a24bf|loadedOnlyByExactBootstrap=true
HL23-V7-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-bootstrap|artifact=target-activation-v7-provider-projection.cjs|command=--bootstrap-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V7_FUNCTIONS_EXEC_BOOTSTRAP_SOURCE|bytes=45833|lf=917|cr=0|finalLf=true|sha256=c848bba5e6cdf5143dfdf7e1e82382658a0b4789a2821ed427a15e89f05749d6|retrievedByExactAuditedLoader=true|generatedPayloadIsSubmittedCell=false|verifiedByPinnedLoaderSourceVerifierHostBeforeEvaluation=true|sameInMemorySourceExecutedRequired=true|platformSubmittedSourceAttested=false
HL23-V7-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-dynamic-loader|artifact=target-activation-v7-provider-projection.cjs|command=--loader-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V7_FUNCTIONS_EXEC_DYNAMIC_LOADER_SOURCE|bytes=21002|lf=412|cr=0|finalLf=true|sha256=4e4e9c7c5cd7813a73d1acee9fd86921e23151a5da5c7c85da825b7bfa40a469|minimalAuditedDynamicLoader=true|generatedPayloadIsSubmittedCell=true|exactGeneratedLoaderSourceIsEntireFunctionsExecCell=true|productionLoaderSubmissionCount=3|productionLoaderSubmissionPhases=pre,post,final|eachProductionPhaseSubmissionIsSoleOneShot=true|platformSubmittedLoaderSourceAttested=false|asciiOnly=true|manualTranscriptionRiskReducedNotEliminated=true|ownSourceRereadRequiredBeforeVerifierHost=true
HL23-V7-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-prebinding-diagnostic-loader|artifact=target-activation-v7-provider-projection.cjs|command=--diagnostic-loader-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V7_FUNCTIONS_EXEC_DIAGNOSTIC_LOADER_SOURCE|bytes=21001|lf=412|cr=0|finalLf=true|sha256=ff7f684f5802a6189eee989a2ccc3c40c4a0212474a9b910458a9de031d4b6f0|minimalAuditedDiagnosticLoader=true|diagnosticOnly=true|generatedPayloadIsSubmittedCell=true|exactGeneratedLoaderSourceIsEntireFunctionsExecCell=true|diagnosticLoaderSubmissionCount=1|diagnosticLoaderSubmissionTiming=prebinding-only|productionLoaderMayBeSubmittedByThisRole=false|productionLoaderMustRemainUnsubmittedUntilBinding=true|providerCaptureHostAllowed=false|providerReadAllowed=false|platformSubmittedLoaderSourceAttested=false|asciiOnly=true|ownSourceRereadRequiredBeforeVerifierHost=true
HL23-V7-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV7ProviderMutation=false
HL23-V7-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V7-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V7-INHERITED-V4-AUTHORITY|commit=f17b2278542ef6836550a556abd97d82c9bf79db|parent=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=11358|manifestSha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428|artifactSetSha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422|artifactCount=14|bindingBytes=6067|bindingSha256=2c6c4876a50bc5b40476d50e70e27f4eba5214de6d3dd9f2d8acbbdb4b3905df|state=BOUND_UNCONSUMED_RETIRED|authorizingV7ProviderMutation=false
HL23-V7-FORBIDDEN-V4-ACTION|count=16|paths=target-activation-v4-provider-preflight.json,target-activation-v4-held-probes-preflight.json,target-activation-v4-npm-observation-plan.json,target-activation-v4-npm-observation-stdin.txt,target-activation-v4-npm-observation.json,target-activation-v4-npm-observation-envelope.json,target-activation-v4-provider-postflight.json,target-activation-v4-shell-postflight-plan.json,target-activation-v4-shell-postflight-stdin.txt,target-activation-v4-shell-postflight.json,target-activation-v4-shell-postflight-envelope.json,target-activation-v4-held-probes-postflight.json,target-activation-v4-provider-final.json,target-activation-v4-postflight-result.json,target-activation-v4-cleanup-result.json,target-activation-v4-arm-failure.json|mustRemainAbsent=true|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V7-INHERITED-V4-DIAGNOSTIC|canonicalSha256=a86a897e5652e6c8c40bf6a5aae7a6349e6afe9c827429ff2de25c285a15743f|evidenceStatus=diagnostic-only-no-provider-evidence-file|firstPageEntryCount=100|rejectionStatus=400|outputPersisted=false|captureSentinelCreated=false|providerMutationCount=0|diagnosticOnly=true|requiredExecutionShape=false|authorizing=false
HL23-V7-INHERITED-V5-AUTHORITY|commit=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|parent=f17b2278542ef6836550a556abd97d82c9bf79db|committedAt=2026-08-26T22:09:21.000Z|manifestBytes=20229|manifestLf=474|manifestCr=0|manifestFinalLf=true|manifestSha256=47f98ab16da1d858508a0b0abf2686e51e7af3132b3abacb7efa5b2b640574ff|artifactSetSha256=894fc3cdcd88ea21ca7a373a7349dd326f03fae07537a650670ac49abd8b67da|artifactCount=14|artifactBytes=747682|bindingRequired=true|bindingPresent=false|bindingBytes=0|state=PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED|authorizingV7ProviderMutation=false
HL23-V7-FORBIDDEN-V5-BINDING-AND-ACTION|count=20|paths=target-activation-v5-authority-binding.json,target-activation-v5-provider-preflight.json,target-activation-v5-provider-preflight.commit.json,target-activation-v5-held-probes-preflight.json,target-activation-v5-npm-observation-plan.json,target-activation-v5-npm-observation-stdin.txt,target-activation-v5-npm-observation.json,target-activation-v5-npm-observation-envelope.json,target-activation-v5-provider-postflight.json,target-activation-v5-provider-postflight.commit.json,target-activation-v5-shell-postflight-plan.json,target-activation-v5-shell-postflight-stdin.txt,target-activation-v5-shell-postflight.json,target-activation-v5-shell-postflight-envelope.json,target-activation-v5-held-probes-postflight.json,target-activation-v5-provider-final.json,target-activation-v5-provider-final.commit.json,target-activation-v5-postflight-result.json,target-activation-v5-cleanup-result.json,target-activation-v5-arm-failure.json|mustRemainAbsent=true|prefixInventoryCount=15|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V7-INHERITED-V5-BINDING-LAUNCH-FAILURE|authorityCommit=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|committedAt=2026-08-26T22:09:21.000Z|justBeforeWallSample=2026-08-26T22:10:25.643Z|nativeExitCode=1|failureStage=outer-powershell-parameter-binding-pre-runner-body|safeTextUtf8Bytes=128|safeTextSha256=bb1498b816e09c94654563f7b251068e8529f2d3d952eda097ddbb1fade5df22|category=InvalidArgument|exceptionType=ParentContainsErrorRecordException|fullyQualifiedErrorId=PositionalParameterNotFound,target-activation-v5-local-runner.ps1|invocationMatchedRunbookBindingBlock=true|createdAtGeneratedImmediatelyPreCall=true|exactCreatedAtUnavailable=true|runnerBodyEntered=false|runnerSelfPinRan=false|pinnedNodeStarted=false|bindingCandidateGenerationStarted=false|captureWriteAttempted=false|canonicalStdoutPresent=false|rawTransportDigestUnavailable=true|bindingAbsentBeforeAndAfter=true|failureReceiptCreated=false|operatorAttestedDiagnostic=true|authoritativeActionEvidence=false|continuationAttemptEvidence=false|providerReadCount=0|providerMutationCount=0|browserActionCount=0|networkRequestCount=0
HL23-V7-INHERITED-V6-AUTHORITY|commit=3c87d50e613e9f3292ac5808a5dcbabd7aa29108|parent=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|committedAt=2026-08-27T05:03:18.000Z|manifestBytes=30664|manifestLf=698|manifestSha256=d2d27f03eea8904d4d20124a7a76772ef5d97c9249bbb942d9cb882fb5cb4fa0|artifactSetSha256=91bd4b8e69d55903342b4391c4383fed5a19d3afe2d2a8f64a289950466cc63b|artifactCount=15|artifactBytes=899238|bindingBytes=19309|bindingLf=1|bindingSha256=36edfafae3369c5ec404963cf16e254bfa9bce47dbe74af7d2fb87c9f7a359cf|state=PUBLISHED_BOUND_PREHOST_BOOTSTRAP_ABORTED_NO_PHASE_RESERVATION_RETIRED|oneShotExecutionAttemptConsumed=true|providerPhaseReservationCreated=false|authorizingV7ProviderMutation=false
HL23-V7-FORBIDDEN-V6-ACTION|count=19|paths=target-activation-v6-provider-preflight.json,target-activation-v6-provider-preflight.commit.json,target-activation-v6-held-probes-preflight.json,target-activation-v6-npm-observation-plan.json,target-activation-v6-npm-observation-stdin.txt,target-activation-v6-npm-observation.json,target-activation-v6-npm-observation-envelope.json,target-activation-v6-provider-postflight.json,target-activation-v6-provider-postflight.commit.json,target-activation-v6-shell-postflight-plan.json,target-activation-v6-shell-postflight-stdin.txt,target-activation-v6-shell-postflight.json,target-activation-v6-shell-postflight-envelope.json,target-activation-v6-held-probes-postflight.json,target-activation-v6-provider-final.json,target-activation-v6-provider-final.commit.json,target-activation-v6-postflight-result.json,target-activation-v6-cleanup-result.json,target-activation-v6-arm-failure.json|prefixInventoryCount=17|mustRemainAbsent=true|captureSentinelCount=0|auditedBootstrapHostStartAttempted=false|auditedBootstrapProviderReadCount=0|auditedBootstrapProviderMutationCount=0|externalConnectorTelemetryAvailable=false|untrustedPrefixAbsenceProven=false
HL23-V7-INHERITED-V6-BOOTSTRAP-ABORT|failureStage=functions-exec-bootstrap-pre-host-crypto-self-test|terminalCode=HL23_TARGET_ACTIVATION_V6_FUNCTIONS_EXEC_BOOTSTRAP_ABORTED|terminalReason=V6_BOOTSTRAP_CRYPTO_SELF_TEST_INVALID|terminalProviderMutationAuthorizedCount=0|retryAuthorized=false|submittedCellKnownNonidentical=true|manualTranscriptionUsed=true|expectedLiteral=0x4ed8aa4a|submittedLiteral=0x4ed8aa4f|submittedCellDigestUnavailable=true|submittedCellBytesUnavailable=true|rawTerminalTransportDigestUnavailable=true|operatorAttestedDiagnostic=true|platformSubmittedSourceAttested=false
HL23-V7-CONTINUATION-AUTHORITY|parent=3c87d50e613e9f3292ac5808a5dcbabd7aa29108|checklistId=RC-STG-006O23D|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|v6RetryAuthorized=false|v6RebindAuthorized=false|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V7-STATUS|authorityO23=UNCHECKED_PENDING_O23D|authorityO23A=UNCHECKED_PENDING_O23D|authorityO23B=UNCHECKED_PENDING_O23D|authorityO23C=UNCHECKED_PENDING_O23D|authorityO23D=UNCHECKED|v3PostPathPermanentlyBlocked=true|v4ActionPathRetiredUnconsumed=true|v5ActionPathRetiredUnconsumed=true|v5BindingRetryAuthorized=false|v6ActionPathRetiredNoPhaseReservation=true|v6RetryAuthorized=false|o23AcceptancePendingO23D=true|o23AAcceptancePendingO23D=true|o23BAcceptancePendingO23D=true|o23CAcceptancePendingO23D=true|o23DAcceptancePending=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|successfulO23B=PASS_CONSUMED|successfulO23C=PASS_CONSUMED|successfulO23D=PASS_CONSUMED|prospectiveSuccessOnlyTogether=true|mandatoryStopBefore=RC-STG-006P23
HL23-V8-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-support-manifest.json|bytes=47301|lf=1054|cr=0|finalLf=true|sha256=d58c4543398da9c7e0b38ea818f90abd48820ce55f97823d09caa8443a7b4fa5
HL23-V8-FROZEN-ARTIFACT-SET|sha256=7d092d169ee1fea9ca091d4fbe9ae40e95d9e75ff8062b18ea85cc25327ffe53
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-contract.cjs|bytes=151827|lf=3216|cr=0|finalLf=true|sha256=70fc452cd30942d07662404509957ae55c91ef8e1c7b4f91f84f702556b56396
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=51a4127a0e58d957694762a3372c78eefbca855702aac3d63756be7162f4e670
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-shell-envelope.cjs|bytes=36179|lf=782|cr=0|finalLf=true|sha256=5e2758ea85aefc99b3143e38e521d1382992dea84e66388da835cab3e755bf47
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=035eba664cc53ee3a65e45ecbdb38744de88260ba180ed7212da249bd36a394e
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-action-control.cjs|bytes=102132|lf=2148|cr=0|finalLf=true|sha256=274c2079857100bb7b82da007d70a24f46adfa407d8bf80309e792ddb45614f0
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-provider-projection.cjs|bytes=239169|lf=4852|cr=0|finalLf=true|sha256=0982007588c8e0dcdb042816ae4dd749265a8675ce5d7ecdea1d9bce7eaed2a6
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-authority-ops.cjs|bytes=19483|lf=446|cr=0|finalLf=true|sha256=4e3f9168fbe889de67b384c6f01763f7bc60752ffb8d16db3c14741eef7d8796
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-local-runner.ps1|bytes=152954|lf=3195|cr=0|finalLf=true|sha256=197aee46b73c642e727edae971fab7aa2fb3aa36f68aa5435d3b5ce90e2e128a
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-pre-node-dependency-lock.json|bytes=12950|lf=364|cr=0|finalLf=true|sha256=632093289a154a13d1bf8d19ea793d014ed2814043da6093839b7f6f543e9d63
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-postflight.cjs|bytes=27751|lf=619|cr=0|finalLf=true|sha256=2bb683d9f96e4439c0e167e6c3ce7425e6d82aba4a217e5e6388e4bc317a9144
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-cleanup.cjs|bytes=11767|lf=274|cr=0|finalLf=true|sha256=7d546c3a090be420f998a9889b0e0f11129ceaf6d1d8d8e44fa0be90d87e8b02
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-support-self-test.cjs|bytes=57348|lf=1136|cr=0|finalLf=true|sha256=b3fdd55912685de9370eb4334f530b68280cabddb131fa8401d8150754d45038
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-verify-freeze.cjs|bytes=92067|lf=1732|cr=0|finalLf=true|sha256=1e635ebf800ee4834cbb15e0b58066009ee1e3f4cb4ba333749d2e087148736e
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-authority-binding.template.json|bytes=40242|lf=919|cr=0|finalLf=true|sha256=06897531489d33ca46279dcc57ff2eed274828c887c7c95c587bd99f50bf6d8a
HL23-V8-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v8-RUNBOOK.md|bytes=34294|lf=572|cr=0|finalLf=true|sha256=5a30ab0e2487591c6a71e1ab01102611abbb3aae0cb48fffb836f0a11e06e124
HL23-V8-PROVIDER-EXECUTABLE-SOURCE|kind=full-phase-orchestrator|artifact=target-activation-v8-provider-projection.cjs|command=--orchestrator-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V8_FULL_PHASE_PROVIDER_ORCHESTRATOR_SOURCE|bytes=38346|lf=821|cr=0|finalLf=true|sha256=d793ae46280504ebffa22fbac5049cd1c745e1dd9fe607f9fc7078c0d272bce4|loadedOnlyByExactBootstrap=true
HL23-V8-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-bootstrap|artifact=target-activation-v8-provider-projection.cjs|command=--bootstrap-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V8_FUNCTIONS_EXEC_BOOTSTRAP_SOURCE|bytes=34087|lf=654|cr=0|finalLf=true|sha256=49755e7460dd5f0fadcaf30793599e3d327d279ef378c461a57dcdc8101b2ba7|retrievedByExactAuditedLoader=true|generatedPayloadIsSubmittedCell=false|verifiedByPureJsUtf8Sha256BeforeEvaluation=true|pureJsSha256SelfTestVectorCount=11|sameInMemorySourceExecutedRequired=true|platformSubmittedSourceAttested=false
HL23-V8-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-dynamic-loader|artifact=target-activation-v8-provider-projection.cjs|command=--loader-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V8_FUNCTIONS_EXEC_DYNAMIC_LOADER_SOURCE|bytes=19358|lf=381|cr=0|finalLf=true|sha256=8acfc9d7bec23768ad283c14f553b7071e3a235806dedb8b7b062c14a62e93fb|minimalAuditedDynamicLoader=true|generatedPayloadIsSubmittedCell=true|exactGeneratedLoaderSourceIsEntireFunctionsExecCell=true|productionLoaderSubmissionCount=3|productionLoaderSubmissionPhases=pre,post,final|eachProductionPhaseSubmissionIsSoleOneShot=true|platformSubmittedLoaderSourceAttested=false|asciiOnly=true|manualTranscriptionRiskReducedNotEliminated=true|ownSourceRereadRequiredBeforeBootstrapEvaluation=true|streamingHostAuthorized=false
HL23-V8-PROVIDER-EXECUTABLE-SOURCE|kind=functions-exec-prebinding-diagnostic-loader|artifact=target-activation-v8-provider-projection.cjs|command=--diagnostic-loader-source|identityScope=raw-source-field-utf8-bytes-not-json-envelope|code=HL23_TARGET_ACTIVATION_V8_FUNCTIONS_EXEC_DIAGNOSTIC_LOADER_SOURCE|bytes=19357|lf=381|cr=0|finalLf=true|sha256=854c894065b9a31bca44d080761ec2d062ec7e099d8281c625d3af3f72389597|minimalAuditedDiagnosticLoader=true|diagnosticOnly=true|generatedPayloadIsSubmittedCell=true|exactGeneratedLoaderSourceIsEntireFunctionsExecCell=true|diagnosticLoaderSubmissionCount=1|diagnosticLoaderSubmissionTiming=prebinding-only|productionLoaderMayBeSubmittedByThisRole=false|productionLoaderMustRemainUnsubmittedUntilBinding=true|streamingHostAllowed=false|providerReadAllowed=false|platformSubmittedLoaderSourceAttested=false|asciiOnly=true|ownSourceRereadRequiredBeforeBootstrapEvaluation=true
HL23-V8-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV8ProviderMutation=false
HL23-V8-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V8-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V8-INHERITED-V4-AUTHORITY|commit=f17b2278542ef6836550a556abd97d82c9bf79db|parent=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=11358|manifestSha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428|artifactSetSha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422|artifactCount=14|bindingBytes=6067|bindingSha256=2c6c4876a50bc5b40476d50e70e27f4eba5214de6d3dd9f2d8acbbdb4b3905df|state=BOUND_UNCONSUMED_RETIRED|authorizingV8ProviderMutation=false
HL23-V8-FORBIDDEN-V4-ACTION|count=16|paths=target-activation-v4-provider-preflight.json,target-activation-v4-held-probes-preflight.json,target-activation-v4-npm-observation-plan.json,target-activation-v4-npm-observation-stdin.txt,target-activation-v4-npm-observation.json,target-activation-v4-npm-observation-envelope.json,target-activation-v4-provider-postflight.json,target-activation-v4-shell-postflight-plan.json,target-activation-v4-shell-postflight-stdin.txt,target-activation-v4-shell-postflight.json,target-activation-v4-shell-postflight-envelope.json,target-activation-v4-held-probes-postflight.json,target-activation-v4-provider-final.json,target-activation-v4-postflight-result.json,target-activation-v4-cleanup-result.json,target-activation-v4-arm-failure.json|mustRemainAbsent=true|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V8-INHERITED-V4-DIAGNOSTIC|canonicalSha256=a86a897e5652e6c8c40bf6a5aae7a6349e6afe9c827429ff2de25c285a15743f|evidenceStatus=diagnostic-only-no-provider-evidence-file|firstPageEntryCount=100|rejectionStatus=400|outputPersisted=false|captureSentinelCreated=false|providerMutationCount=0|diagnosticOnly=true|requiredExecutionShape=false|authorizing=false
HL23-V8-INHERITED-V5-AUTHORITY|commit=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|parent=f17b2278542ef6836550a556abd97d82c9bf79db|committedAt=2026-08-26T22:09:21.000Z|manifestBytes=20229|manifestLf=474|manifestCr=0|manifestFinalLf=true|manifestSha256=47f98ab16da1d858508a0b0abf2686e51e7af3132b3abacb7efa5b2b640574ff|artifactSetSha256=894fc3cdcd88ea21ca7a373a7349dd326f03fae07537a650670ac49abd8b67da|artifactCount=14|artifactBytes=747682|bindingRequired=true|bindingPresent=false|bindingBytes=0|state=PUBLISHED_UNBOUND_BINDING_LAUNCH_FAILED_PREWRITE_UNCONSUMED_RETIRED|authorizingV8ProviderMutation=false
HL23-V8-FORBIDDEN-V5-BINDING-AND-ACTION|count=20|paths=target-activation-v5-authority-binding.json,target-activation-v5-provider-preflight.json,target-activation-v5-provider-preflight.commit.json,target-activation-v5-held-probes-preflight.json,target-activation-v5-npm-observation-plan.json,target-activation-v5-npm-observation-stdin.txt,target-activation-v5-npm-observation.json,target-activation-v5-npm-observation-envelope.json,target-activation-v5-provider-postflight.json,target-activation-v5-provider-postflight.commit.json,target-activation-v5-shell-postflight-plan.json,target-activation-v5-shell-postflight-stdin.txt,target-activation-v5-shell-postflight.json,target-activation-v5-shell-postflight-envelope.json,target-activation-v5-held-probes-postflight.json,target-activation-v5-provider-final.json,target-activation-v5-provider-final.commit.json,target-activation-v5-postflight-result.json,target-activation-v5-cleanup-result.json,target-activation-v5-arm-failure.json|mustRemainAbsent=true|prefixInventoryCount=15|captureSentinelCount=0|providerMutationCount=0|totalProviderMutationCountRemains=1
HL23-V8-INHERITED-V5-BINDING-LAUNCH-FAILURE|authorityCommit=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|committedAt=2026-08-26T22:09:21.000Z|justBeforeWallSample=2026-08-26T22:10:25.643Z|nativeExitCode=1|failureStage=outer-powershell-parameter-binding-pre-runner-body|safeTextUtf8Bytes=128|safeTextSha256=bb1498b816e09c94654563f7b251068e8529f2d3d952eda097ddbb1fade5df22|category=InvalidArgument|exceptionType=ParentContainsErrorRecordException|fullyQualifiedErrorId=PositionalParameterNotFound,target-activation-v5-local-runner.ps1|invocationMatchedRunbookBindingBlock=true|createdAtGeneratedImmediatelyPreCall=true|exactCreatedAtUnavailable=true|runnerBodyEntered=false|runnerSelfPinRan=false|pinnedNodeStarted=false|bindingCandidateGenerationStarted=false|captureWriteAttempted=false|canonicalStdoutPresent=false|rawTransportDigestUnavailable=true|bindingAbsentBeforeAndAfter=true|failureReceiptCreated=false|operatorAttestedDiagnostic=true|authoritativeActionEvidence=false|continuationAttemptEvidence=false|providerReadCount=0|providerMutationCount=0|browserActionCount=0|networkRequestCount=0
HL23-V8-INHERITED-V6-AUTHORITY|commit=3c87d50e613e9f3292ac5808a5dcbabd7aa29108|parent=dceb3c79d4df647e1929ffe807ad5f0ed6bb2d10|committedAt=2026-08-27T05:03:18.000Z|manifestBytes=30664|manifestLf=698|manifestSha256=d2d27f03eea8904d4d20124a7a76772ef5d97c9249bbb942d9cb882fb5cb4fa0|artifactSetSha256=91bd4b8e69d55903342b4391c4383fed5a19d3afe2d2a8f64a289950466cc63b|artifactCount=15|artifactBytes=899238|bindingBytes=19309|bindingLf=1|bindingSha256=36edfafae3369c5ec404963cf16e254bfa9bce47dbe74af7d2fb87c9f7a359cf|state=PUBLISHED_BOUND_PREHOST_BOOTSTRAP_ABORTED_NO_PHASE_RESERVATION_RETIRED|oneShotExecutionAttemptConsumed=true|providerPhaseReservationCreated=false|authorizingV8ProviderMutation=false
HL23-V8-FORBIDDEN-V6-ACTION|count=19|paths=target-activation-v6-provider-preflight.json,target-activation-v6-provider-preflight.commit.json,target-activation-v6-held-probes-preflight.json,target-activation-v6-npm-observation-plan.json,target-activation-v6-npm-observation-stdin.txt,target-activation-v6-npm-observation.json,target-activation-v6-npm-observation-envelope.json,target-activation-v6-provider-postflight.json,target-activation-v6-provider-postflight.commit.json,target-activation-v6-shell-postflight-plan.json,target-activation-v6-shell-postflight-stdin.txt,target-activation-v6-shell-postflight.json,target-activation-v6-shell-postflight-envelope.json,target-activation-v6-held-probes-postflight.json,target-activation-v6-provider-final.json,target-activation-v6-provider-final.commit.json,target-activation-v6-postflight-result.json,target-activation-v6-cleanup-result.json,target-activation-v6-arm-failure.json|prefixInventoryCount=17|mustRemainAbsent=true|captureSentinelCount=0|auditedBootstrapHostStartAttempted=false|auditedBootstrapProviderReadCount=0|auditedBootstrapProviderMutationCount=0|externalConnectorTelemetryAvailable=false|untrustedPrefixAbsenceProven=false
HL23-V8-INHERITED-V6-BOOTSTRAP-ABORT|failureStage=functions-exec-bootstrap-pre-host-crypto-self-test|terminalCode=HL23_TARGET_ACTIVATION_V6_FUNCTIONS_EXEC_BOOTSTRAP_ABORTED|terminalReason=V6_BOOTSTRAP_CRYPTO_SELF_TEST_INVALID|terminalProviderMutationAuthorizedCount=0|retryAuthorized=false|submittedCellKnownNonidentical=true|manualTranscriptionUsed=true|expectedLiteral=0x4ed8aa4a|submittedLiteral=0x4ed8aa4f|submittedCellDigestUnavailable=true|submittedCellBytesUnavailable=true|rawTerminalTransportDigestUnavailable=true|operatorAttestedDiagnostic=true|platformSubmittedSourceAttested=false
HL23-V8-INHERITED-V7-AUTHORITY|commit=d0d80e98f27e9a5b0079eeb88134523f443a7cad|parent=3c87d50e613e9f3292ac5808a5dcbabd7aa29108|committedAt=2026-08-27T16:23:38.000Z|manifestBytes=41076|manifestLf=909|manifestCr=0|manifestFinalLf=true|manifestSha256=77fa1f99a27a9aa885e05e7b7ee23efc7d5ef1452f6befbc3d065665163b457a|artifactSetSha256=40170902e06ba4cadc84ae9fc7103a62acfa201655c932eb18d3627c71a29e18|artifactCount=15|artifactBytes=1086182|bindingRequired=true|bindingPresent=false|bindingBytes=0|state=PUBLISHED_UNBOUND_PREBINDING_DIAGNOSTIC_LOADER_ABORTED_NO_PHASE_RESERVATION_RETIRED|diagnosticLoaderAttemptConsumed=true|diagnosticRetryAuthorized=false|bindingAuthorized=false|productionLoaderSubmitted=false|productionPhaseAttempted=false|productionOneShotConsumed=false|providerPhaseReservationCreated=false|authorizingV8ProviderMutation=false
HL23-V8-FORBIDDEN-V7-BINDING-AND-ACTION|count=20|paths=target-activation-v7-authority-binding.json,target-activation-v7-provider-preflight.json,target-activation-v7-provider-preflight.commit.json,target-activation-v7-held-probes-preflight.json,target-activation-v7-npm-observation-plan.json,target-activation-v7-npm-observation-stdin.txt,target-activation-v7-npm-observation.json,target-activation-v7-npm-observation-envelope.json,target-activation-v7-provider-postflight.json,target-activation-v7-provider-postflight.commit.json,target-activation-v7-shell-postflight-plan.json,target-activation-v7-shell-postflight-stdin.txt,target-activation-v7-shell-postflight.json,target-activation-v7-shell-postflight-envelope.json,target-activation-v7-held-probes-postflight.json,target-activation-v7-provider-final.json,target-activation-v7-provider-final.commit.json,target-activation-v7-postflight-result.json,target-activation-v7-cleanup-result.json,target-activation-v7-arm-failure.json|prefixInventoryCount=16|prefixProjectionBytes=3399|prefixProjectionSha256=86744cac1f03afeade5e3ee64a5abe09457598d447a3e9aa3767d22ac9c7baa0|mustRemainAbsent=true|captureSentinelCount=0|auditedLoaderFlowProviderReadCount=0|auditedLoaderFlowProviderMutationCount=0|externalConnectorTelemetryAvailable=false|untrustedPrefixAbsenceProven=false|totalProviderMutationCountRemains=1
HL23-V8-INHERITED-V7-DIAGNOSTIC-LOADER-ABORT|failureStage=functions-exec-prebinding-diagnostic-loader-verifier-start-no-session|terminalCode=HL23_TARGET_ACTIVATION_V7_PREBINDING_DIAGNOSTIC_LOADER_ABORTED|terminalReason=V7_LOADER_VERIFIER_TERMINAL_STATE_UNKNOWN|terminalDiagnosticOnly=true|terminalProductionPhaseAttempted=false|terminalProductionOneShotConsumed=false|terminalProviderCaptureHostStarted=false|terminalProviderMutationAuthorizedCount=0|diagnosticRetryAuthorized=false|operatorAttestedDiagnostic=true|rawTerminalBytesUnavailable=true|rawTerminalTransportDigestUnavailable=true|submittedCellBytesUnavailable=true|submittedCellDigestUnavailable=true|platformSubmittedSourceAttested=false
HL23-V8-INHERITED-V7-FORENSIC-NARROWING|outerCellWallTimeSeconds=22.5|verifierCleanupLoopBoundMilliseconds=125000|diagnosticLoaderRoleEstablished=true|diagnosticLoaderOwnSourceRereadMatched=true|productionLoaderSourceLocallyReread=true|productionLoaderSubmitted=false|bootstrapSourceLocallyReread=true|bootstrapEvaluated=false|verifierHostStartAttempted=true|verifierSessionIdSafeIntegerAcquired=false|verifierReadyAccepted=false|verifierInputFrameSubmitted=false|verifierReceiptObserved=false|verifierReceiptAccepted=false|originalSafeCodeUnavailable=true|possibleOriginalSafeCodes=V7_LOADER_VERIFIER_START_FAILED,V7_LOADER_VERIFIER_START_INVALID|verifierProcessStartedState=unknown|verifierTerminalState=unknown|bindingAbsentBeforeAndAfter=true|providerCaptureHostStarted=false|providerPhaseReservationCreated=false|auditedLoaderFlowProviderReadCount=0|auditedLoaderFlowProviderMutationCount=0|externalConnectorTelemetryAvailable=false|untrustedPrefixAbsenceProven=false
HL23-V8-SESSIONLESS-PHASE-PROTOCOL|phaseCount=3|phaseEvidenceFileCount=4|phaseEvidenceRoles=reservation,claim,output,commit|reservationCreateNewBeforeCell=true|reservationConsumesPhase=true|claimInvocationExpectedInsideAuditedFunctionsExecWorkflow=true|claimInvocationOriginMechanicallyAttested=false|claimCreatedBeforeProviderReadRequired=true|providerCommitInsideCell=true|providerPostReturnCaptureInput=false|streamingHostAuthorized=false|writeStdinEmptyPhaseCommitTerminalPollingOnly=true|nonemptyWriteStdinCharsAuthorized=false|phaseCommitWriter=pinned-node-child|powershellPhaseCommitWrites=false|phaseCommitChildDeadlineMilliseconds=22000|phaseCommitChildTerminationBeforeRunnerReturnRequired=true|phaseCommitTerminalPollMaximumCount=3|pollUnknownReconcileNotBeforeOffsetMilliseconds=60000|terminalMaxUtf8Bytes=4096|terminalMaxBase64urlChars=5462|wholeCommitCommandCharsLessThan=8191|selfHashSecurityClaim=accidental-integrity-only-not-platform-attestation|partialOrCollisionConsumesAndRetires=true|retryAuthorized=false
HL23-V8-CONTINUATION-AUTHORITY|parent=d0d80e98f27e9a5b0079eeb88134523f443a7cad|checklistId=RC-STG-006O23E|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|v7RetryAuthorized=false|v7BindingAuthorized=false|v7ResumptionAuthorized=false|streamingHostAuthorized=false|phaseReservationCreateNewRequired=true|phaseExecutionClaimCreateNewRequired=true|missingOrMalformedTerminalRetires=true|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V8-STATUS|authorityO23=UNCHECKED_PENDING_O23E|authorityO23A=UNCHECKED_PENDING_O23E|authorityO23B=UNCHECKED_PENDING_O23E|authorityO23C=UNCHECKED_PENDING_O23E|authorityO23D=UNCHECKED_PENDING_O23E|authorityO23E=UNCHECKED|v3PostPathPermanentlyBlocked=true|v4ActionPathRetiredUnconsumed=true|v5ActionPathRetiredUnconsumed=true|v5BindingRetryAuthorized=false|v6ActionPathRetiredNoPhaseReservation=true|v6RetryAuthorized=false|v7DiagnosticPathRetiredNoPhaseReservation=true|v7DiagnosticRetryAuthorized=false|v7BindingAuthorized=false|o23AcceptancePendingO23E=true|o23AAcceptancePendingO23E=true|o23BAcceptancePendingO23E=true|o23CAcceptancePendingO23E=true|o23DAcceptancePendingO23E=true|o23EAcceptancePending=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|successfulO23B=PASS_CONSUMED|successfulO23C=PASS_CONSUMED|successfulO23D=PASS_CONSUMED|successfulO23E=PASS_CONSUMED|prospectiveSuccessOnlyTogether=true|mandatoryStopBefore=RC-STG-006P23

#### 2026-08-27 RC-STG-006O23E V8 Sessionless Read-Only Evidence Continuation Authority - Authorized Next / Execution Gated on Exact-Nine Publication, Prebinding Diagnostic, and Binding

Published V7 authority `d0d80e98f27e9a5b0079eeb88134523f443a7cad`,
literal child of 3c87, returned the exact
`HL23_TARGET_ACTIVATION_V7_PREBINDING_DIAGNOSTIC_LOADER_ABORTED` terminal
with reason `V7_LOADER_VERIFIER_TERMINAL_STATE_UNKNOWN`. Its sole diagnostic
attempt is consumed, all 20 binding-and-action paths remain absent, no
phase reservation was created, and production was unsubmitted, unattempted,
and unconsumed. V7 is
`PUBLISHED_UNBOUND_PREBINDING_DIAGNOSTIC_LOADER_ABORTED_NO_PHASE_RESERVATION_RETIRED`
and permits no retry, binding, resumption, repair, repurposing, or production
phase. The scoped audited loader flow recorded zero provider reads and
mutations; external connector telemetry is unavailable and absence of an
untrusted prefix is unproven.

After this exact-nine V8 publication, submit the freshly retrieved exact
diagnostic-only loader source alone as the entire `functions.exec` cell once
before binding, with no prefix, suffix, wrapper, or edit. A top-level `Script running with cell ID` result
is nonterminal: never resubmit the source; call only `functions.wait` with the
same `cell_id`, `yield_time_ms:60000`, and `max_tokens:200000` until terminal.
Accept only `HL23_TARGET_ACTIVATION_V8_PREBINDING_DIAGNOSTIC_OK` with all four
sources verified, same-memory bootstrap execution, production unsubmitted and
unattempted, reservation and claim absent, and provider read/mutation counts
zero. Copy only its exact `at` and `bindingObservationProjectionSha256`,
revalidate the binding-absent plan, all 26 absences, and frozen kit, then
create and audit one separate immutable V8 binding within the frozen 15-minute
chronology: authority commit <= diagnostic `at` <= binding `createdAt` <=
current time, with binding `createdAt` no more than 15 minutes after diagnostic
`at`. Never submit the diagnostic
loader again. Any diagnostic, outer-wait, or binding failure retires V8 and
authorizes no retry.

For PRE, POST, and FINAL in that order, create only the next CreateNew
reservation immediately before its one production-loader cell; reservation
creation consumes that phase before provider reads. Submit the freshly retrieved
exact production-loader source alone as the entire cell, with no prefix, suffix,
wrapper, edit, or resubmission. Inside that cell, the bootstrap verifies the
reservation and creates the CreateNew claim before
using only the four allowlisted provider tool types. The audited workflow
expects that claim invocation inside the cell, but its origin is not
mechanically attested. It commits one compact
canonical result through one bounded pinned-Node child, which creates output
first and commit last; PowerShell writes neither provider output nor commit.
After `HL23_TARGET_ACTIVATION_V8_PROVIDER_PHASE_COMMITTED`, validate that phase
exactly once. UNKNOWN reconciliation is allowed only for
`HL23_TARGET_ACTIVATION_V8_FUNCTIONS_EXEC_LOADER_ABORTED` with its exact
unknown-state tuple, boolean `pairMayExist`, `productionOneShotConsumed:true`,
and `retryAuthorized:false`, or production
`HL23_TARGET_ACTIVATION_V8_LOADER_ROLE_UNCLASSIFIED_ABORTED` with the common
UNKNOWN fields listed below, `pairMayExist:false`, and
`automaticRetryAuthorized:false`. Each
tuple must state `localCommandTerminalStateKnown:false`,
`processMayStillRun:true`, `phaseArtifactsMayExist:true`,
`reconciliationRequired:true`, `reconciliationAllowedReadOnlyOnce:true`, and a
canonical
non-null `reconcileNotBeforeUtc`. Wait until that exact time, at least 60
seconds after command start, then validate exactly once. Validation performs no
provider read and
grants no retry. A known rejection, malformed or missing terminal, wrong UNKNOWN
tuple, absent/partial/colliding/malformed pair, or failed validation consumes
and retires the phase; never submit a second cell or reconcile twice.

The exact continuation order is Provider PRE; five held PRE probes; V8
preflight and one-shot O23E arm; one sealed live-runtime npm observation; at
least 61 seconds from PRE provider compact `capturedAt` to POST reservation;
Provider POST; one sealed
byte-exact inherited V3 `activation-post` observation; five held POST probes;
at least 61 seconds from POST provider compact `capturedAt` to FINAL reservation;
Provider FINAL;
aggregate postflight;
zero-delete cleanup; mandatory stop before `RC-STG-006P23`. Each production
submission is that phase's sole one-shot. Raw provider payloads and cursors stay
inside the isolate, and provider output never uses post-return `CaptureInput`.

The scalar-transport process suite performs no filesystem write. The broader
frozen support suite may CreateNew, verify, and delete only suite-owned unique
`.hl23-v8-*` temporary files or directories under the release root and outside
the `target-activation-v8-` prefix; it requires zero residue and creates no
release or provider artifact.
Apart from those bounded local fixtures, it permits no filesystem write,
provider call, browser action, network action, or mutation.

O23, O23A, O23B, O23C, and O23D are `UNCHECKED_PENDING_O23E`; O23E is
`UNCHECKED`. Only after the complete V8 aggregate and zero-delete cleanup pass
may a separate completion-evidence documentation commit mark all six
`PASS_CONSUMED` together. P23, backup, reopen, rollback, production, and every
later gate remain forbidden.
#### HL-20260822-1 pre-action abort-recovery record

Additive helper deploy `6a8b678ddbcf0b4ea8ba623c` passed its exact hosted
byte/header gates, but a physical `.html` browser entry immediately reported
`STRICT_STOP / ORIGIN_GUARD / EXACT_STAGING_ORIGIN_REQUIRED`. Every control
remained disabled. The tab was closed without replacement, the full hold never
lifted, Render recorded zero requests from `21:35Z` through `21:42Z`, and no
session, publisher, endpoint, or backend write ran. The release-specific
contract required abort recovery.

Abort plan
`release-qa-strict-restore-abort-v1-59641427f2021cbb3285f6ef59635301fbcdb93177288827afd787fed1a28a99`
returned exact classifier `prepared_only`, publication states `none/none`,
source SHA-256 `c26fdebc...`, absent target, zero authoritative-database and
durable-filesystem mutations, and verified deterministic temporary cleanup.

The matching abort execute returned
`RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED` with `replayed: false`, zero
authoritative-database mutations, two durable-filesystem mutations,
`sourcePreserved: true`, `targetVerified: true`, `releaseBlocked: true`, and
`rollbackOnly: true`. The clean target plaintext SHA-256 is
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`; the
activation-receipt SHA-256 is
`b846edcffca67b1e6ba29e7ff2d1335d44f30ab251bc4daf40e9dd49de920592`.
Immediate exact replay reported `replayed: true`, zero mutations in both
categories, and no temporary work.

Helper-retirement deploy `6a8b6b25126dabed39fa404d`, title
`HL-20260822-1-abort-retire-helper-baseline`, published at
`2026-08-23T21:50:30.415Z` with five header rules and no functions. Baseline
byte checks and all `10/10` retired helper-path checks passed across canonical
and immutable origins; every retired path returned the exact `472`-byte
`text/html` index fallback with SHA-256 `90620768...`.

Only `DATABASE_PATH` was merge-updated to the clean target. Held cutover deploy
`dep-da5mmpu417fc73807ptg` started at `2026-08-23T21:51:35.442888Z` and reached
`LIVE` at `2026-08-23T22:41:18.393652Z` as the newest deploy on exact backend
`8e313902feefcd683b0f5edd746a9dd2a9029a18`. Its build succeeded, and the
hosted gate passed `443` suites / `3,503` tests with all `3,503` passing and zero
fail/cancel/skip/todo in `2941574.017632ms`. Instance `mq8dr` recorded zero
startup errors; live/readiness returned `200`/`no-store`, and leagues remained
held at `503 SERVICE_MAINTENANCE`/`no-store`. The materializer did not alter
Render configuration.

The first retained post-cutover verifier artifact, SHA-256
`6157adfd598cbf9d7d306dd849822e494ffefe7aee29f3eb14ce2ea4d9ec38c7`,
stopped before backup as `SCRATCH_SIDECAR_PRESENT`. This is diagnostic evidence
of a false negative caused only by transient sidecars owned by its scratch copy,
not evidence of authoritative-target drift. The corrected exact-Node-`24`
verifier v2 artifact, SHA-256
`61610cb991fb049075f4b997688da31bacf20b772ede4f994c197298b40f76a0` and `19298`
bytes, returned
`HL_POST_CUTOVER_TARGET_VERIFIED` and proved:

```text
Preserved source:         37761024 bytes / c26fdebc9432c09371bc5c2bc6eed74f626e9589d891478a9f9b4e300d80d238
Authoritative target:     37105664 bytes / cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Activation receipt:       4430 bytes / b846edcffca67b1e6ba29e7ff2d1335d44f30ab251bc4daf40e9dd49de920592
SQLite integrity:         ok
Foreign-key violations:   0
Schema/data/migrations:   54/54/54
Migration checksum:       6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
Credential rotation:      9152f844-d8cd-42f7-b0d5-b12f530ad618
Active sessions:          0
Fixture/transfer counts:  0 across all 10 checked categories
```

The corrected verifier re-proved the full hold and required provider-variable
absence without opening the authoritative database. Its owned scratch WAL was
`0` bytes and scratch SHM was `32768` bytes; both were removed, and its
temporary verification copy was removed.

Fresh backup `e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` passed:

```text
Manifest:          staging/backups/hundo-leago_staging_20260823T225620203Z_e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6.manifest.json
Encrypted SHA-256: e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448
Manifest checksum: 54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155
Plaintext SHA-256: cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
SQLite integrity:  ok
Foreign-key violations: 0
```

The plaintext, integrity, and foreign-key fields passed in a separate
`db:backup:verify` invocation. The clean target is now the verified and backed-
up authoritative source under the unchanged full hold. At that recovery
boundary this record granted no new release, restore, unhold, or production
authority; the separate 2026-08-23 authorization is current and production
remains unauthorized.

#### HL-20260821-3 hosted abort-recovery record

After the strict browser run stopped at the recognized incomplete state, full-
hold deploy `dep-da50hssaud7c73d3mqeg` reached `LIVE` on exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e`, passed `3,502/3,502`, and
re-proved the complete runtime hold. The first abort-plan invocation then
failed closed with `RELEASE_QA_STRICT_RESTORE_PATH_UNSAFE`: the exact current
source had WAL and SHM sidecars. A read-only process check reported zero open
file descriptors on the source or those sidecars; the inactive target remained
absent.

Before any checkpoint, incident-preservation backup
`44791a01-f62a-4729-b328-d3303bf79a12` verified from manifest
`staging/backups/hundo-leago_staging_20260822T213849188Z_44791a01-f62a-4729-b328-d3303bf79a12.manifest.json`.
Its plaintext SHA-256 was
`9d36b59a7b2d0d38ef47fc5bc0514a51cb5a754629e3242597b9d4400849a51f`.
The guarded canonical WAL checkpoint reported
`busy/log/checkpointed: 0/0/0`; the same guarded operation verified integrity
`ok`, zero foreign-key violations, schema `54`, and absent WAL/SHM sidecars.

Abort planning then passed with exact classification `to_b_accepted`, phase-
one publication `published`, and return publication `none`. The first execute
attempt used a manually transcribed plan value, was rejected with
`RELEASE_QA_STRICT_RESTORE_PLAN_MISMATCH`, and materialized no target. The
operator then supplied the exact byte-extracted values. First execution passed
with `replayed: false`, authoritative-database mutations `0`, durable-
filesystem mutations `2`, `sourcePreserved: true`, and
`targetVerified: true`. Immediate exact replay passed with `replayed: true`,
both mutation counts `0`, and no temporary plaintext restore.

Post-checkpoint incident-preservation backup
`fa8c7b2d-04c9-4454-aae4-285673432fb7` verified from manifest
`staging/backups/hundo-leago_staging_20260822T214720472Z_fa8c7b2d-04c9-4454-aae4-285673432fb7.manifest.json`
at the same plaintext SHA-256. This proves the guarded zero-frame checkpoint
did not change the authoritative database bytes. Only `DATABASE_PATH` was then
changed to the verified target while the full hold remained intact.

Cutover deploy `dep-da51hjvqj5pc73bh8g3g` started at
`2026-08-22T21:46:55.442059Z`, built successfully at
`2026-08-22T22:37:16.851Z`, and finished `LIVE` at
`2026-08-22T22:37:35.066844Z` on exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e`. Upload took `1.9s` and
compression `0.2s`. The hosted gate passed `443` suites and all `3,502` tests,
with zero fail/cancel/skip/todo, in `3006420.142708ms`. New instance
`srv-d9eo2turnols73ekb830-qx9zx` ran `npm start` at
`2026-08-22T22:37:29.025Z`, became live at `2026-08-22T22:37:35.170Z`, and
recorded zero error logs through `2026-08-22T22:38:46Z`. Public live/ready
returned `200`, `Cache-Control: no-store`, and `{status:'ok'}`.

The fresh attached shell proved:

```text
APP_BUILD_ID:                     23971a4d66ee6383c6ad54339e769dbc9a76561e
FRONTEND_BUILD_ID:                0e8eee92e2e323dd7f25ec3112988feaf23f96f0
DATABASE_PATH:                    /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
STAGING_PERSISTENT_ROOT:          /opt/render/project/data/hundo-staging
APP_ENV:                          staging
NODE_ENV:                         production
Environment ID:                  test:release-qa
Database ID:                     m7-release-qa-fixture
STAGING_MAINTENANCE_HOLD:         true
LEAGUE_WRITE_MODE:                closed
SCHEDULED_JOBS_ENABLED:           false
FREE_AGENT_DRAFT_ROUTES_ENABLED:  false
ACCOUNT_EMAIL_DELIVERY_ENABLED:   false
DEBUG_ROUTES_ENABLED:             false
EMAIL_DELIVERY_MODE:              capture
SPORTSDATAIO_NHL_LIVE_MODE:       disabled
BACKUP_SCHEDULE_ENABLED:          false
```

The read-only temporary-copy verifier had scratch SHA-256
`5f7de38f2673d3bb4c7d2b086b5d699afab1d173aceb86298d6e40eacb48b77f`
and returned `HL_POST_CUTOVER_TARGET_VERIFIED`. Its authoritative-database
opened flag was false and authoritative mutation count was zero. It verified:

```text
Source SHA-256:             859eda97cd4c55724907abb5cd91f8dd741dd4cab9f9543df8942a1e2310ee05
Target SHA-256:             cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Activation-receipt SHA-256: 009227a315708be575d553eb39d72797c6f18824f0cd63b6a95580d026cb67bb
Source WAL/SHM sidecars:    absent
Target WAL/SHM sidecars:    absent
Receipt kind:               abort
Restore mode:               aborted-strict-smoke-rollback
Derived plan:               verified
Source state:               to_b_accepted / published / none
Semantic chain completed:   false
Smoke completed:            false
Hosted smoke completed:     false
Release blocked:            true
Rollback only:              true
Integrity:                  ok
Foreign-key violations:     0
Schema/data-model version:  54
Applied migrations:         54
Migration checksum set:     6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
Environment ID:             test:release-qa
Database ID:                m7-release-qa-fixture
Credential-rotation receipt: 9152f844-d8cd-42f7-b0d5-b12f530ad618
Active sessions:            0
Strict fixture:             absent (league 60c82aa0-54f9-4c93-83f5-73b0d6d6f63e; receipt 0ed590d8-832a-469a-848e-f91b0b37fe56; transfer chain)
Temporary copy:             removed
```

Post-cutover backup `2044fcae-24e8-4392-a1ac-4064d9cd2807` then passed from
manifest
`staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json`:

```text
Encrypted SHA-256: cee039557278c41f59fa9d6a5b09cf4f69f1b9f3589cb3774420ef34be255162
Manifest checksum: 08e3d3bde81843a683017d9952b30e02dd02978181a8644323cfbd590eca2ac8
Verify status:     verified
Plaintext SHA-256: cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Integrity:         ok
Foreign keys:      0
```

A fresh-shell anonymous-session request returned
`503 SERVICE_MAINTENANCE` with `Cache-Control: no-store`. Abort restoration,
target cutover, post-cutover verification, and post-cutover backup are `PASS`.
At that historical `HL-20260821-3` boundary, the full hold remained active and
the release remained blocked; this recovery evidence does not authorize
reopening or privacy-release closeout.

These commands never update Render configuration, redeploy the service, or
make the target authoritative. Activation and rollback are separate operator
actions: the historical procedure required changing only `DATABASE_PATH`
between the two pinned paths while the full hold remained active, redeploying
the exact compatible backend, and recording
the Render configuration/deploy evidence. The old source remains preserved.
Post-activation verification, incident-preservation backup, controlled job and
route reopening, and observation remain required by the M7-26 work plan and
release record. After either normal or abort restoration,
`ACCOUNT_EMAIL_DELIVERY_ENABLED=false` and `EMAIL_DELIVERY_MODE=capture` remain
the required default until an explicit restored-outbox reconciliation decision
and evidence authorize any email allowlist or delivery change.

This exception is a fresh-path materialization and external activation
handoff. It is not in-place restore, generic staging recovery, production
restore authority, or implementation of the full production sequence in Parts
10 through 13.

Commissioner requests use an authenticated application service and do not execute shell commands directly.

---

## FAD-18 Provider-Independent Backup Boundary

Grae's 2026-08-11 clarification removes provider capability from FAD-18. The
active backup/reset/restore sequence contains no SportsDataIO discovery,
manifest, paid key, provider check, signing secret, artifact verifier, or mode
promotion. It still requires the exact old-path backup, verified distinct clean
restore, fresh schema-49 reset/import, database/path/build identity, activation,
rollback, and post-transition backup evidence. Production remains unauthorized.

The activated preseason FAD-only candidate also omits the shared automatic
`matchup_occurrences` runner in full. Its `statistics_refresh`, `baseline`,
`normal_lock`, `finalize`, and matchup-week `rollover` occurrences do not run.
This does not disable the separate Entry Draft season-rollover, FAD, auction,
trade, or outbox workers; those remain available subject to their own gates.
The future provider-neutral matchup/statistics slice must deliberately restore
or split the runner without weakening backup, activation, or rollback evidence.

The provider-command material below is a superseded historical record only. Do
not execute those commands for FAD-18, and do not treat any missing provider
input as a backup, restore, reset, or deployment blocker.

### Superseded historical provider command boundary

Any imperative or blocker wording in this historical subsection is retired and
is not a current operator instruction.

The provider capability tools are separate from backup and restore operations
and do not satisfy the required old-path backup, fresh-path reset/import, or
clean-restore drill. The four package commands below are milestones, not a
standalone executable sequence:

```text
npm run data:discover:sportsdataio-live:staging -- --historical-date YYYY-MM-DD
npm run release:candidate:preflight
npm run data:check:sportsdataio-live:staging
SPORTSDATAIO_NHL_LIVE_MODE=required npm run data:verify:sportsdataio-live:staging
```

The authoritative order is the
[FAD-18 hosted staging procedure](../07-testing/release-runs/M7_HOSTED_STAGING_ACCEPTANCE.md#fad-18-provider-independent-procedure).
In summary, the auxiliary bridge first deploys persistently held against the
old schema-22 path; Render stops the old disk-backed instance before starting
that replacement. Discovery runs from the attached-service shell, must inherit
deployed `STAGING_MAINTENANCE_HOLD=true`, never an inline spoof, and opens only
a verified private OS-temporary copy of the sidecar-free guarded source.
An operator reviews and commits its exact manifest, and final-candidate
preflight requires the checked-in hold default `false`. That exact final build
then deploys once with the persisted hold still `true` for the verified old-
path backup, exact clean-restore verification at a distinct inactive path, and
the complete approved fresh schema-49 reset/import at a different path,
including the ordered verification-artifact, first-admin,
reset-original-league, migration-report, and database-identity handoff. The old
schema-22 file remains untouched, and both path/build activation and rollback
pairs are recorded.

Only after the same final build activates on the verified new path with
persisted `STAGING_MAINTENANCE_HOLD=false` in `probe` may the provider check
publish the artifact. Both the check and verifier require closed writes,
disabled scheduled jobs, FAD routes, account email, debug routes, and backup
schedule, capture-only email, and hold `false` before provider, manifest, or
artifact work. The zero-argument verifier runs once from that disk-backed shell
with required-mode verification configuration through the exact per-process
invocation above while the deployed service remains in `probe`; it does not
persist or change service mode. Only after it passes may the same build change
service mode to `required` and restart, where startup re-verifies before
database open.

Under the retired plan, these tools did not supply the manifest, credential,
isolated database, operator access, object storage, backup, restore, release
identity, or deploy authority. Provider inputs are no longer FAD-18
prerequisites. The isolated-resource, operator-access, object-storage, backup,
restore, release-identity, and deploy-authority gates remain active, and
production remains unauthorized.

---

## Command Safeguards

Restore execution requires:

* explicit target environment;
* environment identity match;
* incident and approved plan IDs;
* current platform-administrator reauthentication;
* typed target confirmation;
* maintenance mode;
* paused jobs and outbox;
* verified candidate;
* protected pre-restore artifact.

Flags such as `--force`, `--skip-integrity`, `--ignore-environment`, or `--no-backup` are not provided for production.

---

# Part 17 - Implementation Sequence

1. Approve this specification.
2. Complete backend configuration and repository seams.
3. Implement the SQLite online-backup operation behind a testable service.
4. Implement manifest, checksum, compression, and encryption modules.
5. Implement the S3-compatible storage adapter.
6. Implement external catalog records.
7. Implement durable backup scheduling and alerts.
8. Add backup status and commissioner request authorization.
9. Implement restore download, verification, and planning without activation.
10. Implement protected local and staging activation.
11. Add session, token, job, and outbox recovery safeguards.
12. Run automated backup corruption, wrong-key, wrong-environment, and restore tests.
13. Run the complete staging restore drill.
14. Select and configure production object storage through the deployment work plan.
15. Establish production scheduling only after the first verified offsite backup.
16. Perform production cutover only through explicit migration and deployment authority.

Each step has focused tests and rollback. Writing this document installs nothing and changes no data.

---

# Part 18 - Failure and Stop Conditions

Backup or restore work stops when:

* the target environment is ambiguous;
* the candidate is unverified;
* an encryption key is missing or authentication fails;
* a checksum differs;
* integrity or foreign-key checks fail;
* schema or application compatibility is unknown;
* the environment or database identity mismatches;
* the loss window is not understood;
* maintenance mode or write blocking cannot be proved;
* jobs or outbox dispatch cannot be paused;
* the only current database would be overwritten;
* staging credentials can access production artifacts;
* a secret or raw artifact would enter Git, logs, email, or public storage;
* the required approval is absent;
* unrelated working-tree or infrastructure changes would be included.

The operator preserves evidence and escalates. They do not bypass the gate.

---

# Part 19 - Completion Criteria

Backup and restore is launch-ready when:

* application-consistent SQLite backup is implemented;
* every artifact passes database and checksum verification;
* payloads are encrypted with versioned AES-256-GCM keys;
* verified artifacts and catalog records exist off the Render disk;
* hourly, daily, pre-change, and retention behavior are tested;
* staging and production credentials and namespaces are isolated;
* commissioner backup requests and restore-request boundaries pass;
* only an authorized platform administrator can execute restore;
* restore never overwrites the sole copy;
* session, token, email, outbox, and job rollback hazards are handled;
* data-loss reconciliation is explicit;
* the complete staging drill meets the target recovery time;
* a new verified backup is created after restore;
* no production backup or restore was performed by writing this specification.

---

# External Platform Reference

The implementation must re-check current provider behavior before production setup:

* [Render persistent disks and disk snapshots](https://render.com/docs/disks)

Render documents that only files under the disk mount persist, that disks attach to a single runtime instance, and that disk snapshots have database-restoration limitations. Hundo Leago therefore uses an application-consistent encrypted offsite backup as its primary recovery artifact.

---

# Verification

Documentation verification:

```powershell
Get-Content docs/08-operations/BACKUP_AND_RESTORE.md
Select-String -Path docs/08-operations/BACKUP_AND_RESTORE.md -Pattern '^`APPROVED`$','AES-256-GCM','Recovery-point objective','Commissioner Authority','Production Restore Sequence','Staging Restore Drills'
```

Current implemented-command verification:

```powershell
npm run db:backup -- --reason manual-platform-operation
npm run db:backup:verify -- --manifest-object-key <manifestObjectKey>
npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <absolute-clean-restore-path>
```

Expected:

* backup verification reports SQLite integrity, zero foreign-key violations, and matching checksums;
* clean restore verification never replaces the authoritative database;
* the future restore-planning operation must remain read-only;
* restore verification uses isolated staging or an explicitly authorized maintenance operation;
* no verification command treats production storage as disposable.
