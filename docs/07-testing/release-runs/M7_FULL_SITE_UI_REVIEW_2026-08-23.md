# M7-26 Full-Site UI Review - Fresh Strict Release

## Status

`AUTHORIZED / MINTED; B-PRIME LOCAL + PUBLICATION + HELD DEPLOY PASS; FIXTURE PREPARATION PENDING; FULL HOLD ACTIVE`

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
Executable backend (B-prime):   234547e4d8453b7515fc081ea6ebe4c2d022dc54
Environment:                    isolated staging
Source database:                /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3
Source bytes:                   37105664
Source plaintext SHA-256:       cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Fresh inactive target:          /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3
Fresh target state:             absent
```

Backend `8e313902feefcd683b0f5edd746a9dd2a9029a18` remains the verified held
starting baseline. Executable B-prime
`234547e4d8453b7515fc081ea6ebe4c2d022dc54` is its exact child and now passes
implementation, local verification, and backend `origin/staging` publication.
Its held hosted deploy now passes. Fixture preparation remains the next gate;
helper construction/publication, controlled unhold, session check, and action
remain blocked behind it.

## B-Prime Implementation, Local Verification, and Publication

The executable release contract was rebound in exact backend commit
`234547e4d8453b7515fc081ea6ebe4c2d022dc54`, parent
`8e313902feefcd683b0f5edd746a9dd2a9029a18`, through only:

```text
src/operations/release/materializeReleaseQaStrictRestore.js
test/foundation/stagingReleaseQaStrictRestoreFoundation.test.js
```

The commit changes `30` lines in and `30` lines out. Its canonical no-external-
diff patch SHA-256 is
`1d6054f6288079e28a42d0e0d65e6b42548788dfaeaf5d3ce028442efc144739`.
Final file SHA-256 values are:

```text
materializeReleaseQaStrictRestore.js:             2df59fa97280d53c4849f879cafd4d1db4969c55013c5169a9936173f66a40e0
stagingReleaseQaStrictRestoreFoundation.test.js:  8d807128e18517db7d43899924f149a35e8fd4668bfd422d05db76b33d57645d
```

Syntax and diff checks passed. Exact Node `24.14.1` / npm `11.11.0` evidence:

```text
node --test --test-concurrency=1 test/foundation/stagingReleaseQaStrictRestoreFoundation.test.js
npm test
npm run check
npm ls --all
```

* the final focused single-concurrency strict-restore gate passed `57/57`, with
  zero fail, cancel, skip, or todo, in `313928.4501ms`;
* the canonical unfiltered `npm test` passed `443` suites / `3,503` tests:
  `3,501` pass, zero fail/cancel/todo, and two expected Windows capability
  skips, in `16187267.7425ms`;
* `npm run check` exited `0` in `831.494ms`; and
* `npm ls --all` exited `0`; its log SHA-256 is
  `6eb35024ca2c939a4dc5727c311e5b1fe9a2d507eed312a9390e46a98ef1dfce`.

The first focused diagnostic passed `2` tests before `55` dependent cases
failed together because old synthetic expiry `2026-11-21T08:36:34.565Z` was
less than the exact required `90` days after the newly bound backup creation
time. The test-only expiry was corrected to exact
`2026-11-21T22:56:20.203Z`; the final focused gate above then passed
completely. This was a corrected pre-publication diagnostic, not an unresolved
release failure.

The retained complete TAP is
`E:\hundo-leago\node_modules\.e\bf1\full.tap`, `378423` bytes, SHA-256
`1b1a075e6eaa835043eafc734c856d85e0736e2d709352007886707371de55e3`.
Its evidence metadata is
`E:\hundo-leago\node_modules\.e\bf1\meta.txt`, `1778` bytes, SHA-256
`32cafdc102fa090d8f294865d5659eee366467d1b64aaa2505f3e104e6f88c19`.
The owned temporary root `E:\hundo-leago\node_modules\.t\bf1` was removed
after all approved Node processes exited. Backend HEAD and `origin/staging`
both resolve exactly to B-prime, and the backend repository is clean.

An exact `APP_BUILD_ID`-only merge then triggered held Render deploy
`dep-da5sh0e417fc738i254g` at `2026-08-24T04:28:49.802474Z` on B-prime. It
finished `LIVE` at `2026-08-24T05:19:31.5435Z` as the newest deploy on exact
`234547e4d8453b7515fc081ea6ebe4c2d022dc54`; prior deploy
`dep-da5mmpu417fc73807ptg` was deactivated and no newer deploy existed.

The hosted terminal summary at `2026-08-24T05:18:53.877Z` reported `443`
suites / `3,503` tests / `3,503` pass / zero fail, cancel, skip, or todo in
`2992028.95308ms`. Build success was recorded at
`2026-08-24T05:18:57.462805131Z`. Instance
`srv-d9eo2turnols73ekb830-t7cbj` started `npm start` at
`2026-08-24T05:19:25.734250578Z`, started `node server.js` at
`2026-08-24T05:19:26.54479Z`, and recorded live at
`2026-08-24T05:19:31.635633617Z`. Startup and post-live logs contained zero
errors through `2026-08-24T05:26:18.764595906Z`.

External read-only probes passed: `/health/live` and `/health/ready` each
returned `200`, `Cache-Control: no-store`, and `{ "status": "ok" }`;
anonymous `/api/v1/leagues` remained held at `503`, `Cache-Control: no-store`,
and `SERVICE_MAINTENANCE`. All full-hold and storage settings, including
`DATABASE_PATH`, remained unchanged. No data, source, target, helper, or
production action occurred.

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
| B-prime implementation, local gates, and publication | `PASS` | Exact commit/parent/two-file diff and hashes; syntax/diff checks; final `57/57` focused gate; `443` suites / `3,503` full tests; check/dependency evidence; backend HEAD and `origin/staging` identity are bound above. |
| B-prime held deployment and runtime verification | `PASS` | Exact deploy `dep-da5sh0e417fc738i254g` is newest and `LIVE` on B-prime after `443` suites / `3,503` hosted tests all passed, build/startup and zero-error gates passed, external live/ready returned `200`/`no-store`, and anonymous leagues remained held at `503 SERVICE_MAINTENANCE`/`no-store`. |
| Fresh fixture preparation and exact replay | `PENDING` | No preparation command has run. |
| Release-specific helper construction and local verification | `PENDING` | No new helper files exist. |
| Helper publication and canonical/immutable proof | `PENDING` | No helper deploy has been requested. |
| Controlled unhold and session verification | `PENDING` | Full hold remains active. |
| A-to-B-to-A action, publisher, replay, and privacy/cache smoke | `PENDING` | No release-specific session, action, or publisher request has run. |
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

After mint, B-prime implementation, final local verification, commit, and
backend `origin/staging` publication passed exactly as recorded above. The
held deployment/runtime gate now also passes exactly as recorded above. The
source remains held, the fresh target remains absent, and no fixture, helper,
controlled unhold, session request, action request, publisher, restore,
activation, database, or production action has occurred for this release.
Fresh fixture preparation and exact replay are the next `PENDING` gate.
