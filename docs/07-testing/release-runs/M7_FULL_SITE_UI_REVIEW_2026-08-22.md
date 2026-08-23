# M7-26 Full-Site UI Review - Fresh Isolated-Staging Rerun

## Status

`DRAFT - ACTIVE; HELD F/B DEPLOY + FIXTURE VERIFIED; STRICT SMOKE PENDING`

Release `HL-20260822-1` defines the fresh end-to-end rerun from the clean held
database produced by the recovered `HL-20260821-3` attempt. It does not resume,
waive, or rewrite that failed attempt. The historical failure and recovery
record is:

```text
docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-21.md
```

The frontend diagnostic correction and exact Netlify baseline are published.
The fresh backend release contract is exact committed build
`8e313902feefcd683b0f5edd746a9dd2a9029a18` and passes its focused and complete
local gates. Backend `origin/staging` resolves exactly to that commit. Its held
hosted deploy and fresh fixture prepare/replay pass. The controlled unhold has
not begun, the helper has not been published, and no fresh A-to-B-to-A action
has run.

Production remains untouched and unauthorized.

## Release Identity

```text
Release ID:                 HL-20260822-1
Frontend branch:            staging
Frontend application build: 4dfe12d1366314e3d9df722c50771324647743c9
Backend branch:             staging
Backend build:              8e313902feefcd683b0f5edd746a9dd2a9029a18
Schema:                     54
Environment ID:             test:release-qa
Database ID:                m7-release-qa-fixture
Render staging service:     srv-d9eo2turnols73ekb830
Render branch:              staging
Render auto-deploy:         no / trigger off
Render persistent mount:    /opt/render/project/data
Render held deploy:         dep-da5l8drtqb8s73ar74sg
Render deploy started:      2026-08-23T20:12:39.566001Z
Render deploy LIVE:         2026-08-23T21:02:43.868008Z
Render instance:            srv-d9eo2turnols73ekb830-wrhvw
Netlify staging site ID:    95af8aa7-0b13-4954-af6d-855762acb147
Netlify staging site name:  hundoleago-staging
Netlify baseline deploy:    6a8a3880f946cc39a2bf2bb6
Netlify deploy message:     HL-20260822-1-frontend-baseline-4dfe12d
Canonical frontend:         https://staging.hundoleago.com
Immutable frontend:         https://6a8a3880f946cc39a2bf2bb6--hundoleago-staging.netlify.app
Source database:            /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
Inactive target database:   /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3
```

The backend identity above is the exact tested commit; a branch name,
working-tree state, or earlier backend commit is not an acceptable substitute.
Backend `origin/staging` and held Render deploy `dep-da5l8drtqb8s73ar74sg`
resolve exactly to it. The deploy also binds exact frontend build
`4dfe12d1366314e3d9df722c50771324647743c9`. No newer deploy existed at the
evidence boundary. The old `23971a4d...` / `dep-da51hjvqj5pc73bh8g3g`
identity remains previous historical recovery evidence and backup provenance,
not current deployment truth.

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

## Backend Local Gate

Exact backend candidate `8e313902feefcd683b0f5edd746a9dd2a9029a18`
binds frozen normalized diff SHA-256
`7624c7b24319954a9a67da61346efab3d7485849aad3542eb321b2d6900a0235`.
Its exact local runtime was Node `24.14.1` with npm `11.11.0`:

- isolated strict-restore gate: `57/57` pass in `347.592s`;
- `npm run check`: exit `0`;
- `npm test`: `443` suites and `3,503` tests, with `3,501` pass, zero fail,
  two intentional Windows skips, zero cancelled, and zero todo in
  `15172.429s` (about `4h12m52s`); and
- `npm ls --all`: exit `0`.

The retained complete TAP SHA-256 is
`aa07d1df79e549c5b7828065d511c297737ef96c4c6cc422779850c802f8b663`.
This evidence proves the frozen local candidate; the held hosted evidence is
recorded separately below.

## Backend Held Hosted Gate

Held deploy `dep-da5l8drtqb8s73ar74sg` started at
`2026-08-23T20:12:39.566001Z` and finished `LIVE` at
`2026-08-23T21:02:43.868008Z` on exact backend
`8e313902feefcd683b0f5edd746a9dd2a9029a18`. The build succeeded. Instance
`srv-d9eo2turnols73ekb830-wrhvw` passed `443` suites / `3,503` tests with all
`3,503` passing, zero fail, cancel, skip, or todo, in `2954563.480743ms`, and
recorded zero startup error logs. Public live and readiness returned `200`,
`Cache-Control: no-store`, and status `ok`; `/api/v1/leagues` returned `503`,
`Cache-Control: no-store`, and `SERVICE_MAINTENANCE`. No newer deploy existed
at the evidence boundary.

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

The clean pre-fixture source boundary was a regular, non-symlink SQLite file:

```text
Path:              /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
Bytes:             37105664
Plain SHA-256:      cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
WAL/SHM sidecars:  absent
```

The fresh inactive target, its WAL/SHM sidecars, activation receipt, and
deterministic restore work directory were all absent at the boundary check.

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

The canonical backup verifier was rerun against that exact object immediately
before preparation and passed with plaintext SHA-256 `cf3ca07d...`, integrity
`ok`, and zero foreign-key violations. The exact B/F, environment/database
identity, and full-hold matrix also passed preflight.

After fixture prepare and replay, a fresh held-shell preflight recorded the
current authoritative source as:

```text
Path:              /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
Bytes:             37761024
Plain SHA-256:      c26fdebc9432c09371bc5c2bc6eed74f626e9589d891478a9f9b4e300d80d238
mtimeMs:            1787519337691.8423
Physical type:      regular, non-symlink, real path, same device
Source WAL/SHM:     absent
Fresh target:       absent
Target WAL/SHM:     absent
Activation receipt: absent
Restore work area:  absent
```

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
`503 SERVICE_MAINTENANCE`. There were zero active sessions and no installed
strict fixture at the clean pre-fixture boundary; the fresh strict fixture is
now intentionally installed while the full hold remains active.

## Fresh Fixture Execution Record

After the exact held F/B deployment and preflight passed, the operator ran this
command once in the attached Render shell and immediately ran the identical
command a second time as the replay:

```text
npm run release:qa:fad:privacy-gate:prepare -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --release-id 'HL-20260822-1' --confirmation 'PREPARE-RELEASE-QA-FAD-PRIVACY-GATE:HL-20260822-1:staging:test:release-qa:m7-release-qa-fixture'

npm run release:qa:fad:privacy-gate:prepare -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --release-id 'HL-20260822-1' --confirmation 'PREPARE-RELEASE-QA-FAD-PRIVACY-GATE:HL-20260822-1:staging:test:release-qa:m7-release-qa-fixture'
```

The complete sanitized first result is bound by:

```text
Operation/release:             HL-20260822-1
FAD ID:                        f474f00b-111c-4dec-8592-ffcbaf97e655
Restricted-auction ID:         551f475b-352f-4c06-831a-534b9750754a
Actionable until (ms):         1787554800000
Actionable until (UTC):        2026-08-24T07:00:00.000Z
Receipt event ID:              88a56507-73fd-47f9-ac66-c305f0075d24
Fixture fingerprint:           1a097b50afa8915c7cd98154dc455604965739c6d61213ac9caec90a6487620b
Prepared at (ms):              1787519331074
Active / selected teams:       4 / 2
Tied players:                  1
Restricted participants:      2
Replayed:                      false
Database write count:          744
```

Its exact inserted-row counts are:

```text
auction_contexts=1; auctions=1; candidate_card_entries=2;
candidate_card_revisions=10; candidate_card_snapshot_entries=88;
candidate_card_snapshots=4; candidate_cards=4;
free_agent_draft_allocation_events=3;
free_agent_draft_auction_participants=2; free_agent_draft_draws=1;
free_agent_draft_player_allocations=1;
free_agent_draft_readiness_attempts=1;
free_agent_draft_readiness_operations=1; free_agent_draft_rollovers=7;
free_agent_draft_teams=4; free_agent_drafts=1; idempotency_requests=2;
job_runs=203; league_activity=3; league_memberships=4;
league_player_positions=1; league_settings=1; leagues=1;
matchup_operations=1; matchup_schedule_job_bindings=192;
matchup_weeks=32; matchups=64; notifications=14;
outbox_event_audiences=29; outbox_events=29;
season_matchup_schedule_generations=1; seasons=1;
security_audit_events=1; team_manager_assignments=4; teams=4
```

The immediate identical replay returned the same IDs, times, public counts,
role/manager facts, and inserted-row counts with `replayed: true` and
`databaseWriteCount: 0`. The operation changed only the authoritative source;
the fresh target, sidecars, activation receipt, and work area remained absent.
Backup `2044fcae-24e8-4392-a1ac-4064d9cd2807` remains the clean restore point.
Do not run preparation again during this smoke attempt.

The exact operational deadline is `2026-08-24T07:00:00.000Z`. Both hosted
transfer phases must finish before it. If the hosted gate cannot complete in
time, preserve the source, restore the full hold, and use the abort-restore
path rather than preparing again or resuming after rollover.

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
| Pre-fixture clean restore boundary | `PASS` | Exact source/target paths, source hash `cf3ca07d...`, identity, sidecar/target/receipt/work-area absence, and backup `2044fcae...` verification recorded above. |
| Frontend diagnostic and complete local gate | `PASS` | Exact build `4dfe12d...`; `402/402`; ESLint, browser authority, Playwright, and build passed. |
| Sealed Netlify application baseline | `PASS` | Deploy `6a8a3880f946cc39a2bf2bb6`; `64/64` remote byte checks passed. |
| Backend focused strict contract | `PASS` | Exact backend `8e313902...` under Node `24.14.1` passed the isolated strict-restore gate `57/57` in `347.592s`. |
| Backend complete local gate and review | `PASS` | `npm run check` and `npm ls --all` exited `0`; `npm test` passed `443` suites / `3,503` tests with `3,501` pass, zero fail, two Windows skips, and zero cancelled/todo in `15172.429s`; TAP SHA-256 `aa07d1df...`. |
| Exact held Render deploy with F/B identity | `PASS` | Deploy `dep-da5l8drtqb8s73ar74sg` is `LIVE` on exact B/F; build passed; hosted gate passed `443` suites / `3,503` tests with `3,503` pass and zero fail/cancel/skip/todo; startup/health/maintenance checks passed; no newer deploy existed. |
| Fresh fixture preparation and zero-write replay | `PASS` | Receipt `88a56507...`; first invocation `replayed: false` / `databaseWriteCount: 744`; exact replay `replayed: true` / `databaseWriteCount: 0`; deadline `2026-08-24T07:00:00.000Z`. |
| Post-fixture held source and inactive-target boundary | `PASS` | Source is `37761024` bytes / SHA-256 `c26fdebc...`; exact B/F/full hold remain; source sidecars, fresh target/sidecars, activation receipt, and restore work area are absent. |
| Fresh helper publication and authorization | `PENDING` | Set an exact future marker expiry, publish only the additive sealed-baseline overlay, and pass the helper artifact/header/inert-load gates before controlled unhold. |
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
