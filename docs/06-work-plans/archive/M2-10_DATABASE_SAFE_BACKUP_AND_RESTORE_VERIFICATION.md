# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

`M2-10`

## Active Step

`Database-Safe Backup and Restore Verification`

M2-10 adds a test/local recovery primitive without production or activation authority.

## Scope

Create:

```text
scripts/db-backup.js
scripts/db-restore-verify.js
src/infrastructure/database/sqliteBackup.js
test/foundation/sqliteBackupRestore.test.js
```

Modify `package.json` and `database/README.md`.

The online backup command requires an existing SQLite database, a new external temporary output directory, environment `test`, an approved reason, and explicit capture time. It uses the `better-sqlite3` online backup API, verifies standalone integrity, foreign keys, schema version, migration checksums, row counts and SHA-256, then atomically publishes the backup plus a canonical checksummed manifest.

The restore-verification command requires the verified backup/manifest and a new external temporary target. It copies exact bytes to the clean path, verifies the plaintext checksum, schema, migration ledger, integrity, foreign keys and row counts, and leaves the verified target isolated. It never replaces or activates a live database.

Focused tests cover live-WAL consistency, manifest/file tampering, wrong environment, existing/overlapping paths, corruption, clean-path restore, semantic row equality, and source non-mutation. Run all cumulative and safety gates, archive M2-10, then activate M2-11 isolated staging configuration.

No encryption-key, offsite-object, production scheduling, restore execution, application-authority, deployment, commit, push, or cutover action is included.

## Completion Evidence

Completed 2026-07-19. Focused backup/restore tests passed `4/4`; the complete suite passed `236/236` across `50` suites. Live-WAL online backup, canonical manifest/checksums, clean-path restore, exact backup boundary, integrity `ok`, zero foreign-key violations, tamper failure, and central-driver isolation passed. No production backup, restore, or activation occurred.
