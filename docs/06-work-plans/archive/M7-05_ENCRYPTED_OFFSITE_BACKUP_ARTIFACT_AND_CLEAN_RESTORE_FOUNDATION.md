# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M7-05
```

## Work Item

```text
Encrypted Offsite Backup Artifact and Clean-Restore Foundation
```

# Objective

Extend the verified online SQLite backup into the approved compressed,
AES-256-GCM encrypted, provider-neutral offsite artifact and external manifest
flow, then prove authenticated clean-path restoration without activating or
overwriting a live database.

# Authority and Boundary

Grae requested continued M7 implementation on `2026-07-22`. This plan
authorizes local code, in-memory/fake object storage, and temporary-database
verification only.

It does not authorize reading production data or secrets, selecting or
purchasing a provider, changing hosted configuration, uploading to a real
bucket, pruning objects, activating a restored database, entering maintenance,
deploying, committing, pushing, or changing production authority.

# Scope

1. Define strict backup configuration, identity, reason, retention, manifest,
   object-name, and versioned 32-byte key contracts without logging secrets.
2. Create a standalone SQLite backup with the existing online backup API and
   verify integrity, foreign keys, schema, migrations, database identity, and
   safe reconciliation evidence.
3. Gzip before AES-256-GCM encryption using a random 12-byte IV, 16-byte tag,
   and canonical safe-manifest additional authenticated data.
4. Upload encrypted artifact and safe manifest through a small private
   S3-compatible interface; verify remote byte size and SHA-256 before marking
   the external catalog verified.
5. Download, verify, authenticate, decrypt, decompress, and restore only to a
   new clean temporary path; never overwrite an existing or live database.
6. Fail closed for corruption, wrong key/version/environment/database identity,
   incomplete remote verification, existing targets, or temporary-path escape.
7. Add explicit non-interactive backup, verify, and clean restore-verification
   commands with safe JSON output and no production execution in this step.

# Expected Files

```text
hundo-leago-backend/src/operations/backups/createEncryptedOffsiteBackup.js
hundo-leago-backend/src/operations/backups/restoreEncryptedBackupToCleanPath.js
hundo-leago-backend/src/infrastructure/backups/backupArtifactCrypto.js
hundo-leago-backend/src/infrastructure/backups/createObjectStorageAdapter.js
hundo-leago-backend/src/config/loadBackupConfig.js
hundo-leago-backend/scripts/db-backup.js
hundo-leago-backend/scripts/db-backup-verify.js
hundo-leago-backend/scripts/db-restore-verify.js
hundo-leago-backend/test/foundation/encryptedOffsiteBackupFoundation.test.js
```

# Completion Gate

M7-05 completes only when online-backup, integrity, compression, authenticated
encryption, private upload, remote verification, external catalog, corruption,
wrong-key, scope-isolation, and clean-restore tests pass; the complete backend
suite and syntax checks pass; protected hashes and baselines remain unchanged;
and exact evidence is recorded.

# Completion Evidence

Completed locally on `2026-07-22`.

* The focused online-backup, configuration, gzip/AES-256-GCM, signed private
  S3-compatible storage, remote verification, external manifest, corruption,
  identity, existing-target, CLI compatibility, and clean-restore gate passed
  `17/17`.
* The complete backend suite passed `862/862` across `227` suites under Node
  `24.14.1`.
* JavaScript syntax checks passed `413/413`; `git diff --check` passed.
* Protected player/reset hashes matched, no SQLite artifacts remained, and the
  two-process Node baseline was unchanged.
* Tests used temporary databases and in-memory/fake private object storage.
  No real bucket, provider credential, hosted variable, production data,
  restore activation, network upload, commit, or push was used.

# Next Step Boundary

After M7-05, the next bounded plan may build deterministic two-league staging
release fixtures and automated release-candidate rehearsal. Local backup proof
does not establish a real offsite copy or authorize a hosted restore.
