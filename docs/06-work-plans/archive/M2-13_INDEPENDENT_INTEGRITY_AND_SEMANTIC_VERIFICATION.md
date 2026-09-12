# Hundo Leago - Active Work Plan

Status: `APPROVED` / `COMPLETE`

Work Plan: `M2-13 - Independent Integrity and Semantic Verification`

Add a read-only staging-import verifier and CLI that independently load
the validated staging descriptor, verified copied source bundle, approved
reset manifest, canonical import report, and existing isolated SQLite
database. Recompute and compare source identity, reset omissions,
protected and never-import evidence, schema/migration ledger, target row
counts and semantic hashes, stable provider identifiers, money,
ownership, integrity, foreign keys, and database/report checksums.

Files:
`src/infrastructure/migration/verifyStagingImport.js`,
`scripts/db-verify-staging-import.js`, and
`test/foundation/stagingImportVerification.test.js`; modify
`src/infrastructure/migration/runStagingImport.js`, `package.json`, and
`database/README.md`.

Verification must not mutate the database, source bundle, import report,
protected JSON, application authority, or repository. Run it against both
M2-12 current-data imports and require identical verified semantic
evidence. Archive M2-13 after focused, cumulative, full, protected-data,
and no-artifact checks, then activate M2-14 cutover and rollback
rehearsal.

The local verifier does not establish that an external Render staging
service or persistent disk exists and does not authorize a production
cutover.

## Completion Evidence

Completed 2026-07-19. Focused verifier tests passed `4/4`, the cumulative
database foundation passed `78/78`, and the complete backend suite passed
`250/250` across `53` suites. Tampered reports, changed database
semantics, and substituted paths fail safely. Whole-fixture hashing proves
that verification does not change any staging input; an exact disposable
copy prevents SQLite from creating WAL sidecars beside the input.

Both M2-12 current-data imports independently produced verification hash
`90a2ee123299076e4dc52f2490ad591fa19cdec19fc9e9d23545e3bd5b8e7db1`.
The verifier recomputed `6,099` protected rows, all `76` application-table
counts, the two approved seeded metadata rows, `72` expected empty tables,
all target semantic hashes, `6,099` stable mapping entries, reset,
protected, never-import, money, ownership, source, schema, migration,
database, and report evidence. Integrity is `ok`; foreign-key violations
are zero.

JSON remains application authority, SQLite application authority remains
disabled, protected JSON hashes are unchanged, and no repository,
deployed staging, or production data changed.
