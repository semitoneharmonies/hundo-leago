# Hundo Leago - Archived Work Plan

Status: `APPROVED` / `COMPLETE`

Work Plan: `M2-GATE - External Staging Isolation Verification`

Completed: `2026-07-19`

---

## Objective

Close the external portion of the Milestone M2 gate without changing
production or application authority:

1. publish the exact reviewed backend source on a `staging` branch;
2. establish a dedicated Render staging service, protected environment,
   persistent disk, staging-only configuration, secrets, and backup
   namespace;
3. prove that staging cannot access production secrets or storage;
4. run M2-12 deterministic imports, M2-13 independent verification, and
   M2-14 backup/cutover/rollback rehearsal on the real staging disk;
5. stop before M3 and before any production migration or cutover.

---

## Published Source and Clean Build

The backend work was committed and pushed only to `origin/staging`.
The final reviewed commit is:

`734c52f865e1407dcd21fcc9ffa891ca4c022fb2`

Render deploy `dep-d9ephln41pts73fbiqig` built that exact commit with a
cleared build cache. The configured build command ran `npm ci`,
`npm run check`, and the complete test suite before the deploy reached
`live`.

A staging-discovered portability defect was corrected in commit
`734c52f`: copied-source manifests record provenance paths from their
capture operating system, so verification now accepts either POSIX or
Windows absolute provenance syntax while continuing to read only the
copied bundle. The focused source-inventory and staging-import gate
passed `12/12`. The complete backend suite passed `261/261` across
`55` suites on exact Node `24.14.1`. Protected JSON hashes remained
unchanged.

The real disk gate recorded:

* Node `24.14.1`;
* npm `11.11.0`;
* `better-sqlite3` `12.11.1`;
* SQLite `3.53.2`.

---

## Staging Resources and Isolation

The verified resources are:

* environment `evm-d9eo1v3rjlhs73cpujvg` (`Staging`), protected and
  network isolated;
* service `srv-d9eo2turnols73ekb830`
  (`hundo-leago-backend-staging`);
* service URL
  `https://hundo-leago-backend-staging.onrender.com`;
* branch `staging`, manual deployment, one `starter` instance;
* disk `dsk-d9eo2u6rnols73ekb8t0`
  (`hundo-leago-staging-disk`), mounted at
  `/opt/render/project/data`;
* persistent gate evidence root
  `/opt/render/project/data/hundo-staging/m2-gate-734c52f8-v3`.

All `41` staging environment variables were audited without printing
secret values. Six required staging secrets are present and independent
of production values. Production has no `BACKUP_*` variables. The
staging backup prefix is `hundo-leago/staging`. Scheduled jobs, backup
scheduling, debug routes, matchups, snapshots, auctions, and matchup
debugging are disabled.

The supplied backup endpoint and bucket remain nonfunctional staging
placeholders and backup scheduling remains disabled. This M2 gate proves
the isolated persistent-disk backup and recovery path; it does not claim
that encrypted offsite upload or restore is operational.

The post-gate provider audit passed `17/17` isolation checks.

---

## Source Evidence

The explicitly approved copied-current-data source is:

`source-bundle-v1-d9a882d888b5caabea45b3f862e39f9c77b0e0419d8f0cd91befbdea7a3a4e71`

The uploaded archive SHA-256 is:

`3b9f05adf04a73da66d11abe3b4bb371f8c02ded8349661f4b2b48229e51c4e0`

The archive contained league JSON, player data, backups, and snapshots.
Grae explicitly approved transfer to the dedicated Render staging
service. SSH encrypted the transfer in transit. The ephemeral archive
and gate scripts were removed after the successful run; the verified
staging copies and gate evidence remain under the dedicated staging disk
gate root.

---

## M2-12 Deterministic Imports

Two separate clean staging-disk roots imported the same verified bundle
with the approved reset manifest.

Each attempt:

* imported `6,099` protected rows;
* imported `2,033` players, `2,033` provider identifiers, and `2,033`
  source-state rows;
* produced zero blocking rejects and zero quarantine entries;
* produced database SHA-256
  `77856309515093885cac3dc6a7d981b6ee2dc071c12c11c641f61f2fa5df05d5`;
* produced semantic report hash
  `770231ad7de52656897b1443d39082c8684db74e4f82288ac5faefc525d59589`;
* produced canonical import-report SHA-256
  `ec66c71bdb32a63abf5f54ab4c071c185703b9191d9c0e25d7d08e43512b9deb`.

The database and canonical import reports are byte-identical across the
two attempts.

---

## M2-13 Independent Verification

Both imports independently produced verification hash:

`596e828713863dcfdb1a2e1a17ebab6c9f1bc57fcc7b4437ecea9ea0217d6954`

For both attempts:

* SQLite integrity is `ok`;
* foreign-key violation count is zero;
* all application-table counts, stable provider identifiers, protected
  and never-import families, reset omissions, money, ownership, schema,
  migration, source, database, and report evidence passed;
* JSON remained application authority;
* SQLite application authority remained disabled;
* no verification input changed.

---

## M2-14 Recovery Rehearsal

Both attempts independently produced rehearsal hash:

`f107b6786c5f1c0166c390a3f902c4aaa9854e581cdb570a095797f5e48f35c1`

The online backup, activation candidate, and rollback candidate are
byte-identical across both attempts and have SHA-256:

`781168d545d8f569d62358d1d94314d73da1475922592b70522b30a1aa78879b`

The canonical rehearsal report SHA-256 is:

`8b4f3d18ee5a31c47f16b47de77c6667b4573ed7341b9dddf8c5dec6aa9aff00`

The final artifact audit found zero unexpected SQLite WAL/SHM sidecars
and zero nonempty command stderr files.

---

## Application and Production Boundary

After the gate, staging health returned:

* `ok: true`;
* schema version `1`;
* no load error;
* JSON data path
  `/opt/render/project/data/hundo-staging/compatibility/league-state.json`;
* zero compatibility backups.

The production service remained:

* service `srv-d4prd02dbo4c73bg95eg`;
* branch `main`;
* disk `dsk-d4tp9jm3jp1c73f1qvu0`;
* unchanged service configuration timestamp
  `2026-02-05T02:02:55.786901Z`.

The staging and production disks are distinct. No production resource,
deployment, data, traffic, or authority changed. The provider audit read
production resource metadata and compared secret values only in memory;
the migration tools never received or used production secret, storage,
backup-prefix, or disk access.

---

## Final Evidence

The canonical content-free gate summary has SHA-256:

`7e35e1491cad6b79cf307033f0a65ec93aa7031b8225dfbca18036bbbd5d3a77`

Its final comparisons are all `true`:

* deterministic imports;
* independent verification;
* byte-identical backups and candidates;
* byte-identical canonical reports.

Milestone M2 is complete. Milestone M3 is now dependency-ready but was
not started. No production cutover is authorized by this completion.
