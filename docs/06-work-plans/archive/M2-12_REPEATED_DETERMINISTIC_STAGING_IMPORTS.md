# Hundo Leago - Active Work Plan

Status: `APPROVED` / `COMPLETE`

Work Plan: `M2-12 - Repeated Deterministic Staging Imports`

Add a staging-only persistent import runner and CLI that require a
validated staging descriptor, the approved operating mode and reset
manifest, a verified copied source bundle, and new non-overlapping
database/report paths below the descriptor's persistent root. Persist
prepared rows in one `BEGIN IMMEDIATE` transaction, publish a canonical
report only after commit, and remove only runner-owned database files if
the import fails before publication.

Files:
`src/infrastructure/migration/runStagingImport.js`,
`scripts/db-import-staging.js`, and
`test/foundation/stagingImport.test.js`; modify
`src/infrastructure/migration/runJsonImport.js`, `package.json`, and
`database/README.md`.

Run two imports of the same verified current copied-data bundle into
separate clean OS-temporary staging-shaped roots. Require exact source,
reset, target-row, stable-player-ID, money, ownership, schema-ledger, and
semantic-report equality. The application remains JSON-authoritative and
the imported SQLite files are never activated.

Local staging-shaped evidence does not claim that a Render staging service
or persistent disk exists. After tests and current-data evidence, archive
M2-12 and activate M2-13 integrity and semantic verification.

## Completion Evidence

Completed 2026-07-19. Focused staging-import tests passed `4/4`, the
cumulative database foundation passed `74/74`, and the complete backend
suite passed `246/246` across `52` suites.

Two clean external OS-temporary staging-shaped imports of verified source
bundle
`source-bundle-v1-d9a882d888b5caabea45b3f862e39f9c77b0e0419d8f0cd91befbdea7a3a4e71`
each committed exactly `6,099` protected rows: `2,033` players, `2,033`
NHL provider identifiers, and `2,033` source-state rows. Both produced
database SHA-256
`77856309515093885cac3dc6a7d981b6ee2dc071c12c11c641f61f2fa5df05d5`
and report SHA-256
`ae8212a9c8f1327ef9048598a1f949099c3e841e89146d76692c3eea86835548`;
the database and report bytes were independently confirmed identical.
The semantic report hash is
`edfac48cfd5798240771d6a911fa1035de6875d7136dd66675b3ca7d511e0612`.
Integrity is `ok`; foreign-key violations, blocking rejects, and
quarantine entries are zero.

JSON remains application authority and SQLite application authority
remains disabled. Protected JSON hashes are unchanged, no migration
artifact was written to either repository, and no production or deployed
staging resource was accessed.
