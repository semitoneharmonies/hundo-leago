# M7-26 Full-Site UI Review - Fresh Isolated-Staging Rerun

## Status

`DRAFT - ACTIVE; HELD BASELINE VERIFIED; STRICT RERUN PENDING`

Release `HL-20260822-1` defines the fresh end-to-end rerun from the clean held
database produced by the recovered `HL-20260821-3` attempt. It does not resume,
waive, or rewrite that failed attempt. The historical failure and recovery
record is:

```text
docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-21.md
```

The frontend diagnostic correction and exact Netlify baseline are published.
The fresh backend release contract is locally verified, but its exact commit
and hosted deploy are still pending. The strict fixture has not been prepared,
the controlled unhold has not begun, and no fresh A-to-B-to-A action has run.

Production remains untouched and unauthorized.

## Release Identity

```text
Release ID:                 HL-20260822-1
Frontend branch:            staging
Frontend application build: 4dfe12d1366314e3d9df722c50771324647743c9
Backend branch:             staging
Backend build:              PENDING - exact reviewed commit not yet created
Schema:                     54
Environment ID:             test:release-qa
Database ID:                m7-release-qa-fixture
Render staging service:     srv-d9eo2turnols73ekb830
Render branch:              staging
Render auto-deploy:         no / trigger off
Render persistent mount:    /opt/render/project/data
Netlify staging site ID:    95af8aa7-0b13-4954-af6d-855762acb147
Netlify staging site name:  hundoleago-staging
Netlify baseline deploy:    6a8a3880f946cc39a2bf2bb6
Netlify deploy message:     HL-20260822-1-frontend-baseline-4dfe12d
Canonical frontend:         https://staging.hundoleago.com
Immutable frontend:         https://6a8a3880f946cc39a2bf2bb6--hundoleago-staging.netlify.app
Source database:            /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
Inactive target database:   /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3
```

The backend-build placeholder must be replaced with one exact tested commit
before any fresh fixture preparation or controlled unhold. A branch name,
working-tree state, or earlier backend commit is not an acceptable substitute.
Because Render auto-deploy is off, publishing the backend commit does not
deploy it. After publication, only `APP_BUILD_ID` and `FRONTEND_BUILD_ID` are
to be merge-updated to the exact B/F identities before one intentional held
deploy is triggered and observed. This paragraph records the plan, not a
completed deploy.

## Contained Scope

This rerun closes only the M7-26 isolated-staging release gates. Its code
change makes the staging-only T-132 diagnostic count distinct successful
TanStack Query instances once and count physical eviction/replacement
separately. It does not weaken the frozen privacy comparator or change normal
product behavior.

The strict browser sequence remains:

```text
Initial mounted page:       1 successful Query instance / 0 evictions / 0 replacements
After A -> B publication:   2 successful Query instances / 1 eviction / 1 replacement
After B -> A publication:   3 successful Query instances / 2 evictions / 2 replacements
```

The fresh run must execute both transfer phases from its own fresh fixture and
release-specific idempotency keys. It must not reuse an action, receipt,
activation target, or helper marker from `HL-20260821-3`.

## Historical Boundary

The `HL-20260821-3` run stopped after phase one because Manager B reported
`complete 3/1/1` instead of required `complete 2/1/1`. Phase two did not run.
The helper was removed, the full hold was restored, the abort materializer and
zero-mutation replay passed, the clean target became authoritative under the
hold, and post-cutover backup
`2044fcae-24e8-4392-a1ac-4064d9cd2807` verified. That attempt remains
`BLOCKED / RECOVERED` historical evidence; it is not an active release.

## Frontend Local Gate

Exact Node `24.14.1` evidence for frontend build
`4dfe12d1366314e3d9df722c50771324647743c9`:

- focused diagnostic tests: `25/25` across `2` files;
- complete Vitest gate: `402/402` across `59` files;
- ESLint: pass;
- browser-authority gate: `20/20` compatibility files across `164` shipped
  source files;
- Playwright: `45/45` across desktop/mobile Chromium, desktop Firefox, and
  desktop/mobile WebKit; and
- staging-configured Vite production build: pass across `1,786` modules.

The build emitted only the existing main-chunk size warning.

## Sealed Frontend Artifact and Deployment

The sealed application artifact is stored locally at:

```text
E:\hundo-leago\.netlify\strict-release-HL-20260822-1\original-dist
```

Pinned files:

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `index.html` | `472` | `90620768a37b57b905a35cd576077cd4c4f1a760da28fc8c1c8a9347458383ca` |
| `assets/index-BFtuYVmF.js` | `527839` | `19ee27ed0fa33016e9614b5dd63095b3f1d3af1fc8f33616b4c30a3c961cd201` |
| `assets/index-C-yMyteT.css` | `108551` | `74aab8400795639840c5efeff9e14ffe5539b71dda1a09c523e50edf63c1ab88` |
| `_redirects` | - | `368f029496e27e1b4aae7dace10e653c93a103039f596cefb426742a3011ae36` |

The sealed `33`-file dist was published with no rebuild as Netlify deploy
`6a8a3880f946cc39a2bf2bb6`. Remote verification passed `64/64` byte checks
across the canonical and immutable origins. The canonical root returned `200`,
the exact index hash, and `Cache-Control: no-store`; the main bundle returned
`200` with immutable caching.

Any temporary strict helper must be an additive overlay on this sealed dist.
Removing it must republish this same baseline without rebuilding the
application.

## Held Database and Backup Boundary

The currently authoritative held source is a regular, non-symlink SQLite file:

```text
Path:              /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
Bytes:             37105664
Plain SHA-256:      cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
WAL/SHM sidecars:  absent
```

The fresh inactive target, its WAL/SHM sidecars, and its activation receipt
were all absent at the boundary check.

The exact clean-boundary backup is:

```text
Backup ID:          2044fcae-24e8-4392-a1ac-4064d9cd2807
Created:            2026-08-22T22:40:11.048Z
Completed:          2026-08-22T22:40:14.558Z
Reason:             incident-preservation
Retention:          incident-preservation; no expiry
Requested-by type:  platform_operation
Requested-by ID:    HL-20260821-3-post-abort-cutover
Backup backend:     23971a4d66ee6383c6ad54339e769dbc9a76561e
Manifest object:    staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json
Storage object:     staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.sqlite3.gz.enc
Encrypted SHA-256:  cee039557278c41f59fa9d6a5b09cf4f69f1b9f3589cb3774420ef34be255162
Manifest checksum:  08e3d3bde81843a683017d9952b30e02dd02978181a8644323cfbd590eca2ac8
Plaintext SHA-256:   cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Migration checksum: 6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
SQLite integrity:    ok
Foreign-key errors:  0
Remote bytes/hash:   verified
```

The canonical backup verifier was rerun against that exact object and passed.
No additional pre-fixture backup is required unless the source bytes or
identity change before preparation.

## Current Held Runtime

This is the recovery posture now, not the intended final staging matrix:

```text
STAGING_MAINTENANCE_HOLD=true
LEAGUE_WRITE_MODE=closed
FREE_AGENT_DRAFT_ROUTES_ENABLED=false
SCHEDULED_JOBS_ENABLED=false
ACCOUNT_EMAIL_DELIVERY_ENABLED=false
EMAIL_DELIVERY_MODE=capture
DEBUG_ROUTES_ENABLED=false
SPORTSDATAIO_NHL_LIVE_MODE=disabled
SportsDataIO provider variables=absent
BACKUP_SCHEDULE_ENABLED=false
```

Public liveness and readiness return `200`; ordinary session traffic returns
`503 SERVICE_MAINTENANCE`. There are zero active sessions and no installed
strict fixture at the recorded clean boundary.

## Final Interactive-Review Matrix

After the complete strict smoke, clean restore/cutover, and final verification
pass, staging is to reopen only with this explicit matrix:

```text
STAGING_MAINTENANCE_HOLD=false
LEAGUE_WRITE_MODE=open
FREE_AGENT_DRAFT_ROUTES_ENABLED=true
SCHEDULED_JOBS_ENABLED=false
ACCOUNT_EMAIL_DELIVERY_ENABLED=false
EMAIL_DELIVERY_MODE=capture
DEBUG_ROUTES_ENABLED=false
SPORTSDATAIO_NHL_LIVE_MODE=disabled
SportsDataIO provider variables=absent
BACKUP_SCHEDULE_ENABLED=false
```

This is an interactive staging-review configuration. It deliberately does not
claim that production jobs, provider-backed statistics, or email delivery are
launch-ready.

## Fresh Gate Ledger

| Gate | Status | Evidence or stop condition |
| --- | --- | --- |
| Clean held source, unused target, and backup | `PASS` | Exact paths, hashes, identity, sidecar absence, backup verification, integrity, and foreign keys recorded above. |
| Frontend diagnostic and complete local gate | `PASS` | Exact build `4dfe12d...`; `402/402`; ESLint, browser authority, Playwright, and build passed. |
| Sealed Netlify application baseline | `PASS` | Deploy `6a8a3880f946cc39a2bf2bb6`; `64/64` remote byte checks passed. |
| Backend focused strict contract | `PASS` | Exact Node `24.14.1` focused contract gate passed `63/63`; exact backend commit remains pending. |
| Backend complete local gate and review | `PENDING` | Must pass before the exact backend commit is published. |
| Exact held Render deploy with F/B identity | `PENDING` | Must bind frontend build `4dfe12d...` and the eventual exact backend commit. |
| Fresh fixture preparation and zero-write replay | `PENDING` | Must use only `HL-20260822-1`, the pinned source, and the fresh unused target. |
| Hosted A-to-B-to-A privacy/cache smoke | `PENDING` | Both phases and every exact `1/0/0 -> 2/1/1 -> 3/2/2` comparator must pass. |
| Helper removal and sealed-baseline restoration | `PENDING` | Remote bytes, headers, and retired helper paths must pass. |
| Normal restore, replay, target handoff, and held verification | `PENDING` | Failure routes to the release-specific abort path; no retry or ad hoc SQL. |
| Post-cutover backup and final interactive matrix | `PENDING` | Reopen only after backup, runtime, role, desktop/mobile, and observation gates pass. |
| Documentation closeout | `PENDING` | Replace placeholders only with captured evidence; then archive M7-26. |

## Separate Launch Gates

These are real production-readiness gates, but they are not permission to
expand or weaken this strict staging rerun:

1. Complete and verify the provider-neutral statistics refresh and matchup
   occurrence runner required for normal season operation.
2. Complete the approved late-legal, already-underway-game exclusion contract
   and hosted evidence for T-067/T-093.
3. Complete T-074 so buyout atomically cancels every affected pending trade
   for both contract and `prospect_right` assets, matching the approved rule.
4. Close the account/session launch-hardening gaps: T-005 must return the
   promised memberships and selected-safe defaults, and session revocation or
   replacement in T-004/T-006/T-007/T-009/T-011 must proactively disconnect
   the affected live Socket.IO clients.
5. Plan, back up, rehearse, and obtain Grae's explicit authority for promotion
   from the legacy JSON/no-target-authentication/single-league production
   deployment to the Season 2 candidate.

M7-26 may close as `STAGING VERIFIED` without falsely marking those separate
production launch gates complete.

## Production Boundary

No production branch, service, site, environment variable, secret, disk,
database, schema, job, email setting, DNS record, or traffic is authorized by
this record. No production mutation or deployment has occurred in this fresh
rerun.
