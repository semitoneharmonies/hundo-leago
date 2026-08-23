# M7-26 Full-Site UI Review - Fresh Strict Release

## Status

`AUTHORIZED / MINTED; FULL HOLD ACTIVE; EXECUTION NOT STARTED`

Release `HL-20260823-1` is a new isolated-staging release. It does not reopen,
resume, or reuse blocked release `HL-20260822-1`. Production remains untouched
and unauthorized.

## Authorization

```text
requestedAt: 2026-08-23T23:23:29.877Z
approvedAt:  2026-08-23T23:23:29.877Z
recordedAt:  2026-08-23T23:23:29.877Z
authority:   Grae explicitly authorized a fresh strict isolated-staging release
releaseId:   HL-20260823-1
```

The release ID is sequence `1` for UTC date `2026-08-23`. Authorization covers
the fresh release contract and its ordered isolated-staging gates. It grants no
production branch, deployment, configuration, data, reset, migration, or
first-write authority.

## Frozen Starting Contract

```text
Frontend application build (F):  4dfe12d1366314e3d9df722c50771324647743c9
Held backend baseline (B):       8e313902feefcd683b0f5edd746a9dd2a9029a18
Executable backend (B-prime):   PENDING
Environment:                    isolated staging
Source database:                /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3
Source bytes:                   37105664
Source plaintext SHA-256:       cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Fresh inactive target:          /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3
Fresh target state:             absent
```

Backend `8e313902feefcd683b0f5edd746a9dd2a9029a18` is only the verified held
starting baseline. It is not the executable backend contract for this release.
The exact B-prime commit, focused and complete gates, `origin/staging` identity,
and held hosted deploy must all be recorded before any helper publication,
fixture preparation, controlled unhold, session check, or action.

## Bound Source Backup

```text
Backup ID:          e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6
Manifest:           staging/backups/hundo-leago_staging_20260823T225620203Z_e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6.manifest.json
Storage object:     staging/backups/hundo-leago_staging_20260823T225620203Z_e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6.sqlite3.gz.enc
Encrypted SHA-256:  e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448
Manifest checksum:  54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155
Plaintext SHA-256:   cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
SQLite integrity:    ok
Foreign keys:        0
Created at:          2026-08-23T22:56:20.203Z
Reason:              incident-preservation
Requested-by type:   platform_operation
Requested-by ID:     HL-20260822-1-post-abort-cutover
Retention class:     incident-preservation
Expires at:          null
Backend build ID:    8e313902feefcd683b0f5edd746a9dd2a9029a18
```

The backup ID, manifest and storage-object identities, created-at and retention
metadata, backend build, encrypted checksum, manifest checksum, and separate
plaintext/integrity/foreign-key verification are exact retained evidence from
the completed held recovery. No new backup or restore action occurred while
minting this record.

## Mandatory Starting Hold

The full hold remains unchanged:

```text
STAGING_MAINTENANCE_HOLD=true
APP_ENV=staging
NODE_ENV=production
LEAGUE_WRITE_MODE=closed
SCHEDULED_JOBS_ENABLED=false
FREE_AGENT_DRAFT_ROUTES_ENABLED=false
ACCOUNT_EMAIL_DELIVERY_ENABLED=false
EMAIL_DELIVERY_MODE=capture
DEBUG_ROUTES_ENABLED=false
SPORTSDATAIO_NHL_LIVE_MODE=disabled
SportsDataIO provider variables=absent
BACKUP_SCHEDULE_ENABLED=false
```

Minting is documentation-only. It does not lift the hold, create the target,
prepare a fixture, publish a helper, make an API request, or write the database.

## Release-Specific Isolation

Every helper marker, URL, fixture receipt, proposal, acceptance, publisher,
confirmation, idempotency key, restore plan, receipt, target, and deploy title
must be newly bound to `HL-20260823-1`. Nothing from `HL-20260821-3` or
`HL-20260822-1` may be resumed or reused.

The helper must authorize only the canonical extensionless staging URL. Its
source, tests, verifier, immutable deploy identity, headers, expiration, and
retirement proof remain pending. No helper file or `netlify.toml` change is
part of this mint.

## Gate Ledger

| Gate | Status | Required evidence |
| --- | --- | --- |
| Release authorization and UTC identity | `PASS` | Explicit authority and exact timestamps above; `HL-20260823-1` was unused in both clean repositories before mint. |
| Frozen F and held starting B | `PASS` | Exact F and B above. B is baseline only. |
| Clean authoritative source and fresh target absence | `PASS` | Source path/size/hash and absent release-specific target are bound above. |
| Verified source backup binding | `PASS` | Exact object identity, metadata, hashes, plaintext, integrity, and foreign-key verification are bound above. |
| B-prime implementation and local gates | `PENDING` | Exact commit and focused/complete results are not yet bound. |
| B-prime held deployment and runtime verification | `PENDING` | No new backend deploy has been requested. |
| Fresh fixture preparation and exact replay | `PENDING` | No preparation command has run. |
| Release-specific helper construction and local verification | `PENDING` | No new helper files exist. |
| Helper publication and canonical/immutable proof | `PENDING` | No helper deploy has been requested. |
| Controlled unhold and session verification | `PENDING` | Full hold remains active. |
| A-to-B-to-A action, publisher, replay, and privacy/cache smoke | `PENDING` | No action or request has run. |
| Full-hold restoration and strict restore/abort path | `PENDING` | No restore plan or command has run. |
| Target activation, post-cutover verification, and fresh backup | `PENDING` | Target remains absent. |
| Final desktop/mobile matrix, observation, and M7-26 closeout | `PENDING` | Requires every prior gate. |

Any strict stop or failed gate stops the release immediately and invokes only
the newly bound fail-closed recovery contract. Pending is not pass evidence.

## Current Boundary

At mint time:

* both repositories were clean with no staged, unstaged, or untracked files;
* frontend HEAD and local `origin/staging` were
  `566db40a0ca03c27f47d2d69140101666be87ddb`;
* backend HEAD and local `origin/staging` were
  `8e313902feefcd683b0f5edd746a9dd2a9029a18`;
* the authoritative clean source remained under the full hold;
* the fresh target was absent;
* no B-prime, helper, preparation, smoke, restore, activation, or production
  action had occurred.
