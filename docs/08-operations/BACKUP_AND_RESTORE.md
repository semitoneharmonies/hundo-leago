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

### M7-26 staging-only strict restore materializer

Grae authorized one release-bound isolated-staging restoration for strict
hosted evidence. The backend exposes four narrow commands for that operation:
the normal pair is available only after complete hosted smoke, while the abort
pair is the rollback-only path from an exact recognized incomplete or failed
smoke state. Under exact Node `24.14.1`, this four-command family has current
focused component evidence at `56/56`; the required selective manager-outbox
publisher separately has `56/56`. Their combined strict candidate subsequently
passed the complete local Node `24.14.1` gate (`3,500` pass plus two intentional
Windows capability skips of `3,502`, zero failures) and the exact held-hosted
gate (`3,502/3,502`, zero skips/failures, clean startup) at commit
`23971a4d66ee6383c6ad54339e769dbc9a76561e` and deploy
`dep-da4p5hu7bikc73aaeiq0`. Those results are candidate/held-preparation
evidence, not restore execution evidence.

```text
npm run release:qa:strict-restore:plan -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3' --target '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --service-id 'srv-d9eo2turnols73ekb830' --release-id 'HL-20260821-3' --manifest-object-key 'staging/backups/hundo-leago_staging_20260822T083634565Z_adcbbbab-e857-4cae-af71-dbce95553ce5.manifest.json'

npm run release:qa:strict-restore:execute -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3' --target '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --service-id 'srv-d9eo2turnols73ekb830' --release-id 'HL-20260821-3' --manifest-object-key 'staging/backups/hundo-leago_staging_20260822T083634565Z_adcbbbab-e857-4cae-af71-dbce95553ce5.manifest.json' --plan-id '<exact planId emitted by plan>' --confirmation '<exact confirmation emitted by plan>'

npm run release:qa:strict-restore:abort:plan -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3' --target '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --service-id 'srv-d9eo2turnols73ekb830' --release-id 'HL-20260821-3' --manifest-object-key 'staging/backups/hundo-leago_staging_20260822T083634565Z_adcbbbab-e857-4cae-af71-dbce95553ce5.manifest.json'

npm run release:qa:strict-restore:abort:execute -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3' --target '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --service-id 'srv-d9eo2turnols73ekb830' --release-id 'HL-20260821-3' --manifest-object-key 'staging/backups/hundo-leago_staging_20260822T083634565Z_adcbbbab-e857-4cae-af71-dbce95553ce5.manifest.json' --plan-id '<exact planId emitted by abort plan>' --confirmation '<exact confirmation emitted by abort plan>'
```

The pinned contract is:

```text
Release ID:                    HL-20260821-3
Operator-asserted service ID: srv-d9eo2turnols73ekb830
Environment ID:               test:release-qa
Database ID:                  m7-release-qa-fixture
Schema version:               54
Migration checksum set:       6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
Frontend build:               0e8eee92e2e323dd7f25ec3112988feaf23f96f0
Source path:                  /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3
Inactive target path:         /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
Activation receipt path:      /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3.activation-receipt.json
Backup ID:                    adcbbbab-e857-4cae-af71-dbce95553ce5
Backup created:               2026-08-22T08:36:34.565Z
Backup reason:                pre-bulk-operation
Backup backend build:         fe6047552857376b490756ff63ac593d431ee561
Manifest object:              staging/backups/hundo-leago_staging_20260822T083634565Z_adcbbbab-e857-4cae-af71-dbce95553ce5.manifest.json
Storage object:               staging/backups/hundo-leago_staging_20260822T083634565Z_adcbbbab-e857-4cae-af71-dbce95553ce5.sqlite3.gz.enc
Encrypted SHA-256:            ee3a3b375f7bc86b845efd0f12bad69937732e973c1661353876952b2330e115
Manifest checksum:            24898a9e872477cbe4170bea8dc18a8a94016709202e5fad47bd7ca97126a948
Plaintext SHA-256:             cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
```

Immediately before strict fixture preparation, this exact backup reverified:
its decrypted payload again matched the pinned plaintext SHA-256, SQLite
integrity was `ok`, and foreign-key violations were zero. The held deploy also
passed the exact environment/full-hold/provider-absence and source/root/target/
private-work/WAL/SHM boundaries. Strict fixture preparation then reported
`writeCount: 744`, receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, and an exact
zero-write replay. That preparation leaves the normal restore correctly
blocked until live smoke completes; it does not constitute strict restore
planning, materialization, restore replay, `DATABASE_PATH` handoff, or
activation.

All four commands run only from the attached Render service shell while the exact
source path is current and the full hold is active:

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

The operator must verify the Render service separately before invocation. The
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
/opt/render/project/data/hundo-staging/sqlite/.hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3.strict-restore-work-v1
```

Any pre-existing work directory is preserved and fails closed. Normal
process-local failures clean only allowlisted paths owned by that invocation.
Abrupt termination may leave the deterministic work directory as a recovery
blocker; it requires manual inspection under the full hold and must never be
blindly deleted or bypassed.

Normal execution remains blocked until the complete exact hosted strict smoke
is present in the source database: Team 1 has the commissioner-created initial
Manager A assignment followed by platform-administrator-proposed and manager-
accepted `A -> B -> A` transfers; Team 2 remains on its original Manager B
assignment; both corresponding accepted-assignment outbox rows have their
exact payload and league audience and are each `published` once with
`attempt_count=1`, non-null publication time, null error, and row `version=3`;
and no auction bid, resolution, allocation, or allocation-event drift
occurred. The candidate backup must independently verify schema, checksums,
environment/database identity, the second credential-rotation receipt, zero
active sessions, and absence of the strict sidecar fixture.

Abort planning and execution are instead restricted to one of these five
finite source-state classifications:

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
generic restore. If either exact manager-outbox publisher call fails or leaves
`failed` or `publishing`, do not retry it: restore the full hold, preserve the
evidence, and use the abort plan/execute pair.

The first successful normal or abort execute invocation creates exactly two
durable files: the verified inactive target and its mode-specific activation
receipt. It writes zero rows to the current authoritative database, preserves
the source and its absence of WAL/SHM sidecars, and reports the temporary
plaintext work and cleanup truthfully. Exact replay uses the receipt and
hashes, performs no object-store request, encryption-key resolution, or
temporary restore, and reports zero authoritative-database and zero durable-
filesystem mutations. A normal plan/receipt cannot be supplied to an abort
execute, and an abort plan/receipt cannot be supplied to a normal execute.
After an interrupted target publication, only an exact verified receipt with
an absent target may resume by publishing that target after any work-area
residue is manually reviewed; a target without its receipt fails closed. Any
mismatch or unexpected path also fails closed.

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
The full hold remains active and the release remains blocked; this recovery
evidence does not authorize reopening or privacy-release closeout.

These commands never update Render configuration, redeploy the service, or
make the target authoritative. Activation and rollback are separate operator
actions: change only `DATABASE_PATH` between the two pinned paths while the
full hold remains active, redeploy the exact compatible backend, and record
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
