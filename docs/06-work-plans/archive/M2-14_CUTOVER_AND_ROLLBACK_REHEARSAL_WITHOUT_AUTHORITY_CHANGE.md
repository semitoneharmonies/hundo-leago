# Hundo Leago - Active Work Plan

Status: `APPROVED` / `COMPLETE`

Work Plan: `M2-14 - Cutover and Rollback Rehearsal Without Authority Change`

Add a staging-only rehearsal runner and CLI. Require a validated staging
descriptor, independently verified M2-13 import, explicit rehearsal time,
new backup path below the staging backup root, and new rehearsal path
below the staging report root. Create and verify an online pre-cutover
backup, restore it to clean activation and rollback candidates, compare
both candidates with the verified source semantics, and atomically
publish canonical rehearsal evidence.

Files:
`src/infrastructure/migration/rehearseStagingCutover.js`,
`scripts/db-rehearse-staging-cutover.js`, and
`test/foundation/stagingCutoverRehearsal.test.js`; modify
`src/infrastructure/database/sqliteBackup.js`, `package.json`, and
`database/README.md`.

The rehearsal records the hypothetical cutover sequence but does not
change configuration, repository composition, JSON authority, traffic,
deployed services, or production. A failure cleans only runner-owned
temporary candidates and backup output while preserving the source
database, source bundle, import report, and descriptor.

Run the rehearsal against both current-data staging-shaped imports and
require identical backup, candidate, and rehearsal evidence. After
focused, cumulative, full, protected-data, and no-artifact checks, archive
M2-14 and evaluate the M2 gate. External staging-service, persistent-disk,
and secret-isolation evidence remains required before M2 can be marked
complete.

## Completion Evidence

Completed 2026-07-19. Focused rehearsal tests passed `4/4`, the combined
backup/rehearsal boundary passed `8/8`, the cumulative database foundation
passed `82/82`, and the complete backend suite passed `254/254` across
`54` suites.

Both current-data rehearsals independently produced rehearsal hash
`717db8c794f55166233bc956591d482e90e4758ff47974c267d1f075f124d90b`.
Their online backup, activation candidate, rollback candidate, canonical
JSON report, and Markdown report were byte-identical. Backup and both
candidates have SHA-256
`781168d545d8f569d62358d1d94314d73da1475922592b70522b30a1aa78879b`.
The rehearsal report has SHA-256
`7c9242af1be3041d59ecc265bf732218dbf39cc0915d0429343be027414f8718`.

The two source databases retained SHA-256
`77856309515093885cac3dc6a7d981b6ee2dc071c12c11c641f61f2fa5df05d5`;
all protected JSON hashes are unchanged; no sidecar, database, source
bundle, or rehearsal artifact remains in either repository. JSON remains
application authority, SQLite application authority remains disabled,
and production authority did not change.

This completes M2-01 through M2-14 locally. It does not satisfy the
separate M2 gate requirement for a real staging service, dedicated
persistent disk, and demonstrated absence of production secret or storage
access.
