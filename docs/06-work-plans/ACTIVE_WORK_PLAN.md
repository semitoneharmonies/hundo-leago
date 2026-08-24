# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`ACTIVE - M7-26; HL-20260823-1 B-PRIME LOCAL + PUBLICATION + HELD DEPLOY PASS; FIXTURE PREPARATION PENDING; FULL HOLD ACTIVE`

## Work Plan ID

```text
M7-26
```

## Work Item

```text
Full-site UI review, plain-language workflow correction, permission hardening,
and isolated staging release
```

## 2026-08-23 Fresh Strict Release - B-Prime Local + Publication + Held Deploy Pass; Fixture Preparation Pending

Grae requested and approved fresh isolated-staging release `HL-20260823-1` at
exact requested/approved/recorded time `2026-08-23T23:23:29.877Z`. It binds
frontend application build
`4dfe12d1366314e3d9df722c50771324647743c9` and current held backend
`8e313902feefcd683b0f5edd746a9dd2a9029a18` as the starting baseline.
Executable B-prime `234547e4d8453b7515fc081ea6ebe4c2d022dc54` passes its
exact two-file focused, complete, check, dependency, and backend
`origin/staging` publication gates. Held deploy
`dep-da5sh0e417fc738i254g`, started `2026-08-24T04:28:49.802474Z`, is newest
and `LIVE` on exact B-prime after `3,503/3,503` hosted tests and its build,
startup, zero-error, held-health, and external read-only gates passed.

The authoritative held source is
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3`,
`37105664` bytes / SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`.
Fresh target
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3`
is absent. Verified incident-preservation backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` binds manifest
`staging/backups/hundo-leago_staging_20260823T225620203Z_e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6.manifest.json`,
storage object with the identical prefix and `.sqlite3.gz.enc` suffix,
`createdAt` `2026-08-23T22:56:20.203Z`, encrypted SHA-256
`e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448`,
manifest checksum
`54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155`,
and verified plaintext `cf3ca07d...`. Reason/retention are
`incident-preservation`, requested-by is
`platform_operation` / `HL-20260822-1-post-abort-cutover`, `expiresAt` is
`null`, and backend build is exact starting B.

The full hold remains active. Fixture preparation/replay, helper
construction/publication, controlled unhold, session verification, all
release-specific actions and publisher replays,
A-to-B-to-A smoke, restoration, target activation, final matrix, and closeout
are `PENDING`. No value from either blocked predecessor may be resumed or
reused. Production remains untouched and unauthorized. The exact gate ledger is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-23.md`.

## 2026-08-22 Fresh Staging Rerun Status - Blocked, Abort-Recovered, Verified Held Recovery Complete

Release `HL-20260822-1` is no longer an active execution. Its exact frontend
build `4dfe12d1366314e3d9df722c50771324647743c9`, sealed Netlify baseline
`6a8a3880f946cc39a2bf2bb6`, backend build
`8e313902feefcd683b0f5edd746a9dd2a9029a18`, complete local gates, held Render
deploy `dep-da5l8drtqb8s73ar74sg`, backup verification, and fixture
prepare/replay remain valid evidence. The fixture-bearing source is preserved
at SHA-256
`c26fdebc9432c09371bc5c2bc6eed74f626e9589d891478a9f9b4e300d80d238`.

Additive helper deploy `6a8b678ddbcf0b4ea8ba623c`, title
`HL-20260822-1-strict-helper-fe6d2dd`, published at
`2026-08-23T21:35:11.134Z`. Canonical and immutable checks passed all four
helper runtime-file byte/header gates and preserved the sealed critical
application files. The browser nevertheless opened the physical `.html` path
instead of the sole authorized extensionless URL. Initialization immediately
reported `STRICT_STOP / ORIGIN_GUARD / EXACT_STAGING_ORIGIN_REQUIRED`; session,
arm, and action controls remained disabled. The tab was closed and no
replacement was opened. Render logs from `21:35Z` through `21:42Z` recorded
zero requests. The full hold never lifted, and no session check, proposal,
acceptance, publisher, replay, API request, or backend write ran. Hosted
A-to-B-to-A smoke never began. The release-specific README/runtime required
abort recovery after the reported strict stop.

Abort plan
`release-qa-strict-restore-abort-v1-59641427f2021cbb3285f6ef59635301fbcdb93177288827afd787fed1a28a99`
classified exact `prepared_only` / `none/none`, source SHA-256 `c26fdebc...`,
absent target, zero authoritative-database and durable-filesystem mutations,
and verified temporary cleanup. Abort execute returned
`RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED`, `replayed: false`, zero
authoritative-database mutations, two durable-filesystem mutations,
`sourcePreserved: true`, `targetVerified: true`, `releaseBlocked: true`, and
`rollbackOnly: true`. The clean target plaintext SHA-256 is
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`; receipt
SHA-256 is
`b846edcffca67b1e6ba29e7ff2d1335d44f30ab251bc4daf40e9dd49de920592`.
The identical replay reported `replayed: true`, zero mutations in both
categories, and no temporary work.

Helper-retirement deploy `6a8b6b25126dabed39fa404d`, title
`HL-20260822-1-abort-retire-helper-baseline`, published at
`2026-08-23T21:50:30.415Z` with five header rules and no functions. Baseline
byte checks and all `10/10` retired helper-path checks passed across canonical
and immutable origins; retired paths returned the exact `472`-byte `text/html`
SPA fallback with SHA-256 `90620768...`. Only `DATABASE_PATH` was then
merge-updated from the preserved source to the clean target. Held cutover
deploy `dep-da5mmpu417fc73807ptg` started at
`2026-08-23T21:51:35.442888Z` and reached `LIVE` at
`2026-08-23T22:41:18.393652Z` as the newest deploy on exact backend
`8e313902...`. Its hosted gate passed `443` suites / `3,503` tests with all
`3,503` passing and zero fail/cancel/skip/todo in `2941574.017632ms`; instance
`mq8dr`, zero startup errors, `200`/`no-store` live/readiness, and held
`503 SERVICE_MAINTENANCE`/`no-store` leagues all passed.

Corrected exact-Node-`24` verifier v2
(`61610cb991fb049075f4b997688da31bacf20b772ede4f994c197298b40f76a0`, `19298`
bytes) returned
`HL_POST_CUTOVER_TARGET_VERIFIED`. It preserved source `37761024` bytes /
`c26fdebc...`, verified authoritative target `37105664` bytes / `cf3ca07d...`
and receipt `4430` bytes / `b846edcf...`, re-proved the full hold/provider
absence, integrity/checksum/schema/migrations/rotation receipt, zero sessions,
and all ten fixture/transfer artifact counts `0`, and removed its owned scratch
WAL/SHM and temporary copy without opening the authoritative database. Retained
v1 (`6157adfd598cbf9d7d306dd849822e494ffefe7aee29f3eb14ce2ea4d9ec38c7`) is
diagnostic evidence of a pre-backup
`SCRATCH_SIDECAR_PRESENT` false negative caused only by its transient owned
scratch sidecars.

Fresh backup `e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` passed with encrypted
SHA-256 `e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448`,
manifest checksum
`54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155`, and
separate verification at plaintext `cf3ca07d...`, integrity `ok`, foreign keys
`0`. The clean target became the authoritative held source. At that recovery
boundary no replacement release ID or authorization existed; the later
`HL-20260823-1` record is current. Production remains untouched and
unauthorized. Exact historical evidence is recorded in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-22.md`.

## Historical 2026-08-21 Attempt - Blocked and Recovered

Checkpoints 1 through 5 and the local implementation portion of Checkpoint 6
were complete. The final release gate was not earned because unheld
hosted acceptance failed its exact phase-one Manager B counter gate. The
release is blocked. Strict abort materialization and exact zero-mutation replay
have passed. The restored-target `DATABASE_PATH`-only cutover, held target
verification, and post-cutover backup also pass. The full hold remains active;
privacy acceptance, controlled reopening, final runtime flags/job restoration,
observation, and documentation closeout remain pending.

The historical frontend candidate was
`0e8eee92e2e323dd7f25ec3112988feaf23f96f0`, following privacy/documentation
commit `c119f119ffd4aa96635fe382792e704d535a7cbd` and broad UI commit
`d82583dea2132d94e53a60853da6dddc549a0126`. The historical strict backend
candidate was
`23971a4d66ee6383c6ad54339e769dbc9a76561e`, following held credential-
rotation candidate `fe6047552857376b490756ff63ac593d431ee561`, migration
candidate `a747430500fbf6887dd748e5e3dfc0ecee77dc07`, and broad implementation
commit `ac1e12baadce4fcc08b6fb680b34db6992a4f891`. The final frontend gate passed
`386/386` tests across `58` files, ESLint, dependency inspection, an exact
staging build, `20/20` browser-authority compatibility cases across `164`
shipped sources, and `45/45` Playwright cases. The pre-rotation backend local
gate passed `3,426` of `3,428` tests with only two intentional Windows
link-capability skips. Held migration deploy `dep-da4e092fngtc739dipm0` passed
`3,428/3,428`; held final deploy `dep-da4gkpoed13c739gm0dg` passed the expanded
`3,440/3,440` hosted gate across `443` suites at exact commit `fe604755...`.
The strict candidate's complete exact-Node `24.14.1` gate then passed `3,500`
of `3,502` local tests across `443` suites with only two intentional Windows
link-capability skips and zero failures. Its durable TAP SHA-256 is
`ED2BCC54D252925548658DA95E32E6C5152C8A52AE1681ED5D0388DE6516CCF6`.
Exact commit `23971a4d...` is published on `origin/staging`; held deploy
`dep-da4p5hu7bikc73aaeiq0` passed `3,502/3,502` hosted tests with zero skips or
failures and clean startup, finishing `LIVE` at
`2026-08-22T13:05:02.585588Z`.

The held staging database advanced from schema `52` to `54` after encrypted
backup and distinct clean-restore verification. Repeated authority previews
required zero mutations, so the reconciliation command did not run. Pre- and
post-migration exhaustive FAD receipt scans were read-only and safe with zero
persisted T-082/T-144 receipts. Both the pre-migration and post-migration
encrypted backups verified. Netlify deploy
`6a89709ffc9c88762ae8e74e` serves the exact final frontend artifact.

Still under the exact full safety hold, a verified pre-rotation backup preceded
the narrow staging-only replacement of all nine synthetic release-QA account
credentials and revocation of one active synthetic session. Receipt
`d5e9c784-db5f-42f6-8fcb-1918e93f26c0` replayed with zero writes, and the
post-rotation encrypted backup verified. No credential secret is retained in
the documentation.

Quiescent deploy `dep-da4hm30jo6nc73d26l80` became live on exact `fe604755...`,
passed `3,440/3,440` with zero startup errors, passed public live/ready plus
anonymous session/CORS/cache checks, and allowed sequential clean sign-in,
dashboard loading, and sign-out for `Admin`, `Man A Leag A`, and
`Man B Leag A`. Notifications was not opened and FAD routes remained disabled,
so the strict notification, selected-team tie, and manager-transfer gates were
not exercised.

The shared staging QA password was then disclosed in chat and must be treated
as compromised. Its value is not recorded. Re-hold deploy
`dep-da4j4r49v7es738bkih0` hosted second rotation `HL-20260821-2`: nine
synthetic accounts rotated, zero sessions revoked, exact receipt
`9152f844-d8cd-42f7-b0d5-b12f530ad618`, and immediate zero-write replay.
Verified backup `adcbbbab-e857-4cae-af71-dbce95553ce5` is the exact
post-rotation/pre-fixture restore point. Its password is not recorded.

The strict held deploy passed its exact environment/full-hold/provider-absence
and source/root/target/work/WAL/SHM boundaries; live/ready returned `200` and
session remained `503 SERVICE_MAINTENANCE`. Backup `adcbbbab...` reverified with
plaintext SHA `cf3ca07d...`, integrity `ok`, and zero foreign-key violations.
The first strict prepare reported `writeCount: 744`, `replayed: false`, receipt
`0ed590d8-832a-469a-848e-f91b0b37fe56`, fixture fingerprint prefix `b2ffbc`,
FAD ID prefix `0aee0824`, restricted-auction ID prefix `8efe9f6a`, and
`actionableUntil: 2026-08-23T07:00:00Z` (approximately `17.8` hours at
preparation). Its immediate exact replay reported `replayed: true` and
`writeCount: 0`.

Controlled-unhold deploy `dep-da4pvcrl550s738l8rmg` reached `LIVE` on the exact
strict commit, passed its `3,502/3,502` hosted gate, liveness/readiness,
anonymous-session/CORS/cache boundary, exact controlled-unhold runtime flags,
clean startup, and two-minute log observation. The corrected helper overlay
passed its hosted artifact/header and inert-initialization gates, but the live
strict smoke stopped after phase one: Manager A reached exact required
`null 2/1/1`, while Manager B reached `complete 3/1/1` instead of required
`complete 2/1/1`. No waiver was given and no return proposal or phase-two
action ran. Partial-hold deploy `dep-da50g0v40ujc73aa5i4g` was manually
canceled at `2026-08-22T20:39:55Z` and never reached `LIVE`. The exact full-
hold matrix was then merge-set without a `DATABASE_PATH` cutover, triggering
replacement deploy `dep-da50hssaud7c73d3mqeg` on exact commit
`23971a4d66ee6383c6ad54339e769dbc9a76561e` at the same timestamp. It reached
`LIVE`, passed its exact `3,502/3,502` held gate and full runtime-hold checks,
and supplied the guarded recovery shell. Strict abort materialization and its
exact replay now pass. Only `DATABASE_PATH` was changed for target cutover;
deploy `dep-da51hjvqj5pc73bh8g3g` is `LIVE` on the same exact backend and
passed its hosted, runtime-identity, held-target, post-cutover backup, and
maintenance-response gates. The release remains blocked because the strict
privacy smoke failed its frozen Manager B counter.
Exact immutable evidence is maintained in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-21.md`.
Production remains untouched and unauthorized.

Grae explicitly selected the strict hosted-evidence path. Its isolated sidecar
fixture and narrow fresh-path recovery components now pass their frozen
focused reviews: the four-command strict restore family is `56/56` and the
selective manager-outbox publisher is separately `56/56` under exact Node
`24.14.1`. Their combined backend gate, exact commit/publication, and held
hosted gate now pass, and the pinned fixture has been prepared with a zero-
write replay. The workflow must not rewrite Gamma League history. The exact
pre-fixture backup is `adcbbbab-e857-4cae-af71-dbce95553ce5`. The attempted
live `A -> B -> A` smoke is incomplete and rejected after phase one; abort
restoration of that exact backup, held target cutover/re-verification, and
post-cutover backup now pass. The strict privacy gate remains failed and the
full hold remains active.

## Authority and Boundary

Grae supplied a complete site-review report on `2026-08-20`, asked Codex to
weight the whole update before coding, and authorized implementation through
the normal documented workflow until the verified deployment is complete.

This plan permits coordinated frontend and backend changes, focused additive
SQLite migrations when required, canonical documentation updates, disposable
local testing, separate repository commits, publication to the existing
dedicated staging services, and hosted role-based acceptance after every local
gate passes.

The approved deployment target for this plan is isolated staging. In addition
to its already recorded additive staging migration and recovered historical
attempt, this plan authorized only the exact `HL-20260822-1` staging fresh-path
materialization and external `DATABASE_PATH` handoff defined below. That
release authority is now spent by its strict stop and completed held recovery.
Its target handoff, corrected post-cutover verification, and fresh backup have
finished under the full hold. It does not itself authorize a replacement
release. Grae's separate explicit `2026-08-23T23:23:29.877Z` approval now
authorizes only `HL-20260823-1` and its ordered isolated-staging contract. It
does not authorize any unrelated staging
environment-variable change, reset, or restore, or any production branch
merge, deployment, data correction, configuration change, reset, restore, or
migration. Production remains a later explicit release decision.

The review is authoritative for the requested user experience. Where it
changes an older approved product or technical rule, the affected canonical
specification must be reconciled before dependent code is implemented.

## Release Progress Reporting

This plan is reported by named gates, not a completion percentage. UI scope,
local automated verification, hosted deployment, data recovery, authenticated
smoke, runtime activation, and documentation closeout are separate gates. A
completed implementation section must not be used to imply that a later
release or recovery gate is nearly complete.

Every status update must state:

1. which named gates passed;
2. which named gate is running;
3. which named gates remain;
4. whether staging is held or open; and
5. whether production remains untouched and unauthorized.

Elapsed time from an earlier implementation checkpoint is not an ETA. Any ETA
must be based on the actual remaining deploy, recovery, and hosted-observation
steps and must be revised when a new hard gate is discovered.

## Approved Scope and Checkpoints

### Checkpoint 1

Implement the shared plain-language/error and team-identity presentation,
dashboard, Teams, shared matchup-card treatment, Matchups copy, and account
menu cleanup. Preserve approved recent activity, team-directory behavior,
matchup data, notification bell, and main navigation.

### Checkpoint 2

Implement roster and Hockey Lines presentation, verify IR and Prospect moves,
complete server-side Players filters before pagination, fix autocomplete
overflow/results, simplify the Drafts results presentation and privacy, and
correct Auctions total-value and phase labels. Preserve Favorites, active-line
cards, Trade and Request trade actions, and working player-detail navigation.

### Checkpoint 3

Implement the simplified trade asset model, manager acceptance followed by
commissioner approval for Future Considerations, the shared detailed Trade
block, plain-language League Activity, and the unread-first Notifications
workflow with a separate Previous notifications view.

### Checkpoint 4

Implement compact branded Standings, contextual commissioner result
correction with preview and automatic recalculation, and the audited
commissioner competition and roster surfaces. Remove the normal standalone
Result correction and Standings rebuild panels only after the contextual
replacement works. Retain the backend rebuild endpoint as an explicit recovery
capability. Retain Correct roster because implementation review confirms it
uniquely supports team-transfer, category, position, and slot/re-slot
corrections not covered by Add player, Remove player, or Correct contract;
present that purpose plainly.

### Checkpoint 5

Audit the displayed League Rules against canonical behavior, protect platform
administrators from commissioner membership or team-access changes, guarantee
administrator access to every league through protected persisted membership,
enforce one current commissioner and an atomic transfer workflow, and verify
administrator league creation and membership/team-access surfaces.

The existing Beta League duplicate-commissioner presentation must be repaired
only through the canonical commissioner pointer and an explicit reversible
staging data operation. No production data repair is authorized by this plan.

### Checkpoint 6

Finish canonical documentation, complete focused and full backend/frontend
tests, lint, production build, desktop/mobile/keyboard/accessibility browser
checks, dependency and whitespace gates, exact staging builds, verified backup
and restore when a migration is required, isolated Render and Netlify staging
deployment, health checks, and authenticated hosted smoke tests.

## Reconciled Product Decisions

1. The dynamic season label comes from the league's authoritative persisted
   current-season display value; it is never advanced from the browser clock.
2. Uploaded team logos are preferred. The fallback is the shared team-pattern
   colour mark with no initials. Missing colours use the existing safe default
   pattern and accessible contrast treatment.
3. The collectible hockey-card interaction and removal of the standalone
   player-detail experience remain post-launch. Existing detail links remain
   until the replacement is implemented.
4. Published Free Agent Draft results expose player identity and Signed, Not
   won, or Tied status to league members. Offer amount and term are returned
   only to a current manager of the selected team. Commissioner or platform-
   administrator authority alone does not reveal those private offer details.
   Historical Candidate Card deep links redirect to the selected-team results
   view and do not bypass that projection.
5. New trades present Player, Draft pick, Buyout obligation, and Future
   considerations. Requested retained salary is nested on its outgoing Player.
   A standalone existing retention obligation cannot be added to a new trade;
   persisted historical proposals/assets remain readable and remain executable
   or reversible where their recorded state permits. An exact idempotent
   proposal-creation retry replays its original result without applying the new
   standalone-retention grammar as a fresh request.
6. Only the current proposing-team manager may create or cancel a proposal, and
   only the current receiving-team manager may accept or reject it. A receiving
   manager's acceptance of a trade containing Future considerations persists
   the acceptance snapshot and projects `Awaiting Commissioner Approval`
   without transferring assets. Commissioner or inherited platform-
   administrator authority permits safe inspection, that approval after
   current-state revalidation, and separate recovery only; it grants no manager
   write.
   No counter endpoint or service is implemented in M7-26.
7. Notification `GET` requests remain read-only. After the unread batch is
   successfully rendered, the page sends one explicit authenticated,
   idempotent batch acknowledgement for exactly the displayed notification
   IDs, retains that snapshot for the mounted visit, and surfaces any failure.
   A separate query displays previously read notifications. This is the sole
   approved automatic-on-view write in the normal interface.
8. Routine Active/Bench moves and lineup/position warnings are filtered from
   the normal League Activity projection; their underlying audit or operational
   evidence is not deleted.
9. Result-correction preview identifies the matchup by week and team names and
   includes projected standings impact. Confirmation stores the correction and
   rebuilt standings atomically or fails without partial state.
10. Platform administrators receive and retain a protected active membership
    in every league. League creation provisions it, existing leagues are
    reconciled additively, and commissioners cannot alter or remove it. All
    non-administrator league isolation remains unchanged.
11. Raw request IDs, internal codes, operation versions, database identifiers,
    and JSON remain available to server logs and protected technical evidence
    but are not shown in the normal user or commissioner interface.

## Data and Migration Safety

UI-only work must not write league state. Read-only previews remain read-only.
Every new state-changing workflow uses an explicit unsafe HTTP method,
authenticated server authority, optimistic or aggregate version checks,
idempotency, transaction boundaries, audit evidence, and focused
cross-league/role tests.

Any schema change is additive and forward-only. Before applying it to shared
staging, the operator must positively identify the staging Render service,
disk, database identity, source and target schema, create and verify an
encrypted backup, prove a clean restore to a distinct inactive path, and keep
production untouched. After a shared post-migration write, correction is
forward-only unless a separately authorized restore is selected.

The M7-26 staging authority repair must use the reviewed package command; ad
hoc SQL is not an approved substitute:

```text
npm run db:reconcile:m7-26:staging -- --database '<absolute database path>' --environment staging --persistent-root '<absolute persistent root>' --release-id '<HL release ID>' --confirmation 'M7-26:<release ID>:staging:<environment ID>:<database ID>'
```

Run the read-only authority preview before the backup and again immediately
before this command. The command is permitted only while the exact staging
service is under the full maintenance hold with writes, scheduled jobs, FAD
routes, delivery email, debug routes, and scheduled backups disabled. It must
preserve the pointer-backed commissioner, fail closed on an ambiguous or
unsafe authority record, reconcile only the reported administrator membership
and surplus-commissioner rows in one transaction, write its deterministic
audit receipt, and return an exact zero-write replay for the same release.
Afterward, the preview must report no mutation required before migrations
`0053` and `0054` are applied.

The same held, exact physical staging database must pass the exhaustive
read-only public-receipt privacy gate before reconciliation/migration and again
after migration:

```text
npm run db:scan:fad-public-receipts:staging -- --database '<absolute database path>' --environment staging --persistent-root '<absolute persistent root>'
```

That command scans every persisted T-082 auction-cancellation result and every
T-144 allocation-correction result, validates canonical response/hash/identity
evidence, executes the current all-null projector plus strict public validator
for each legacy full-money FAD allocation, reports null/no-FAD T-082 results,
fails the process for malformed unsafe receipts, and proves identical SQLite
`total_changes()` before and after. It never rewrites immutable evidence and
its findings contain only stable IDs and reason codes.

### M7-26 strict hosted manager-transfer publication exception - closed unused

The `HL-20260822-1` controlled-unhold boundary below was never entered. The
full hold remained active, the release-only endpoint was never requested, and
this exception is no longer action authority. It remains here only to preserve
the exact contract the blocked release would have had to satisfy.

The strict smoke must not enable the global scheduler. Accepted manager
assignments enqueue `team.changed`, but `SCHEDULED_JOBS_ENABLED=true` would
also start unrelated workers and could mutate Gamma League. Throughout the
controlled unhold, `SCHEDULED_JOBS_ENABLED=false`. The only authorized
publication path is the in-process release-only endpoint:

```text
POST /api/v1/operations/release-qa/strict-manager-outbox
```

It mounts only on the pinned source `DATABASE_PATH` with release
`HL-20260822-1`, environment `test:release-qa`, database
`m7-release-qa-fixture`, schema `54`, the pinned migration checksums and
frontend build, an exact SHA-shaped deployed `APP_BUILD_ID`, season `2026` /
NHL `20262027`, and this exact smoke boundary:

```text
APP_ENV=staging
NODE_ENV=production
APP_ENVIRONMENT_ID=test:release-qa
DATABASE_ID=m7-release-qa-fixture
DATABASE_PATH=/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
PERSISTENT_DATA_ROOT=/opt/render/project/data/hundo-staging
FRONTEND_BUILD_ID=4dfe12d1366314e3d9df722c50771324647743c9
APP_BUILD_ID=8e313902feefcd683b0f5edd746a9dd2a9029a18
CURRENT_SEASON_LABEL=2026
CURRENT_NHL_SEASON_KEY=20262027
STAGING_MAINTENANCE_HOLD=false
LEAGUE_WRITE_MODE=open
FREE_AGENT_DRAFT_ROUTES_ENABLED=true
SCHEDULED_JOBS_ENABLED=false
ACCOUNT_EMAIL_DELIVERY_ENABLED=false
EMAIL_DELIVERY_MODE=capture
DEBUG_ROUTES_ENABLED=false
BACKUP_SCHEDULE_ENABLED=false
SPORTSDATAIO_NHL_API_KEY: absent
SPORTSDATAIO_NHL_API_ORIGIN: absent
SPORTSDATAIO_NHL_LAST_SEASON_START_YEAR: absent
SPORTSDATAIO_NHL_LIVE_MODE=disabled
SPORTSDATAIO_NHL_LIVE_API_KEY: absent
SPORTSDATAIO_NHL_LIVE_API_ORIGIN: absent
SPORTSDATAIO_NHL_LIVE_CAPABILITY_SECRET: absent
SPORTSDATAIO_NHL_LIVE_CAPABILITY_KEY_VERSION: absent
SPORTSDATAIO_NHL_LIVE_CAPABILITY_ARTIFACT: absent
SPORTSDATAIO_NHL_LIVE_PROBE_MANIFEST: absent
```

This release did not earn final interactive review. Its intended final posture
would have used the verified `HL-20260822-1` target with the strict publisher
route absent and would have kept scheduler, account email, debug routes, live
provider, and scheduled backups disabled. That historical intended matrix is
not current activation authority or evidence that production job operation is
ready.

Under the full hold the target runtime and route are not composed, and the
maintenance server returns `503 SERVICE_MAINTENANCE`. With the hold false, the
restored target path or any binding drift leaves the route unmounted and an
external request returns `404`. It is not a general outbox or scheduler
control.

#### Historical `HL-20260821-3` helper contract and rejected phase one

This subsection through the fresh-rerun heading below is immutable historical
evidence, not current action authority. Its release ID, helper path, marker,
expiry, build IDs, idempotency keys, confirmations, hashes, and deploys must not
be reused. The full record is the 2026-08-21 release record.

Grae authorized a temporary release-QA browser helper solely to issue the
already-approved direct calls above from each actor's real staging cookie jar.
The first overlay publication was stopped before any helper action because its
public URL redirected and its CSP/referrer headers did not match this frozen
contract. Corrected deploy `6a89e2c867e39d41cc630a26` then passed the exact
hosted overlay and initialization gates. Its phase-one write path ran, but the
strict cache-counter result failed; the release is blocked. Exact baseline
rollback deploy `6a8a09c13d5e25282f64d2c7` passed remote helper-removal
verification. Abort materialization and replay pass; restored-target cutover
deploy `dep-da51hjvqj5pc73bh8g3g`, target verification, and the post-cutover
backup also pass under the unchanged full hold.

The helper may exist only as an additive static overlay on the canonical
`https://staging.hundoleago.com` origin at release-specific path
`/release-qa/hl-20260821-3/`. Its only authorized browser entry point is exact
extensionless URL
`https://staging.hundoleago.com/release-qa/hl-20260821-3/strict-manager-transfer`;
an uppercase-path or `.html` redirect is a pre-action failure. It must preserve
every file in the audited
Netlify baseline deploy `6a89709ffc9c88762ae8e74e` byte-for-byte, including
frontend build `0e8eee92e2e323dd7f25ec3112988feaf23f96f0`,
`dist/index.html` SHA-256
`1982ECF04CC456D989F7B42F15F3CED49A5D825DF0DEDD948DEAFFE8D8C1ADC8`, and
`dist/assets/index-CI54gRot.js` at `527839` bytes with SHA-256
`5B2336E5B1E099EF32747B48124C331495CEFAD1511E26D244E09D5567460394`.
Adding the helper changes the temporary Netlify content digest only; it does
not authorize a Vite rebuild, application-source change, replacement bundle,
or new frontend build identity. Every helper and marker response must be
served with release-specific `Cache-Control: no-store`,
`Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `X-Robots-Tag: noindex, nofollow, noarchive`, and
`Content-Security-Policy: default-src 'none'; base-uri 'none'; connect-src
'self' https://api-staging.hundoleago.com; form-action 'none'; frame-ancestors
'none'; img-src 'none'; object-src 'none'; script-src 'self'; style-src
'self'`. The HTML meta CSP repeats that policy with `object-src 'none'` but
omits only `frame-ancestors 'none'`, which browsers do not apply from a meta
policy. A separate `netlify.app` origin and any Render `FRONTEND_BUILD_ID`
change are forbidden; the real cookie and exact Origin contract require the
canonical staging origin and pinned frontend build.

The single response-header authority for this temporary harness is this exact
helper-scoped block in the local deployment `netlify.toml`:

```toml
[[headers]]
  for = "/release-qa/hl-20260821-3/*"
  [headers.values]
    Cache-Control = "no-store"
    Content-Security-Policy = "default-src 'none'; base-uri 'none'; connect-src 'self' https://api-staging.hundoleago.com; form-action 'none'; frame-ancestors 'none'; img-src 'none'; object-src 'none'; script-src 'self'; style-src 'self'"
    Referrer-Policy = "no-referrer"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-Robots-Tag = "noindex, nofollow, noarchive"
```

No helper `_headers` artifact is permitted. The existing global and
non-helper route header rules must remain unchanged, so this temporary block
can affect only the lowercase release-QA path above. It is staging deployment
configuration, not application source or a new frontend build.

The helper action tab constructs its own actual TanStack Query
`QueryClient`. That isolated client must contain exactly zero FAD queries
before, during, and after every action; the helper must not mount
`RealtimeProvider`, create a Socket.IO listener, or share the mounted FAD
page's application QueryClient. The normal FAD result page remains mounted in
the same cookie jar, while the helper is a separate same-cookie action tab.

After the required static document, script, and style requests, helper
initialization issues zero script-initiated API, fetch, XHR, or WebSocket
requests and performs no write. An explicit session-check control may make the
credentialed session read. Only inside a separately clicked proposal action,
the helper may also make the exact read-only Team 1 precheck
`GET /api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/teams/ebc815c7-8a41-4326-8faf-04548aa91c76`.
Only inside a separately clicked acceptance action, it may make the exact
read-only pending-assignment precheck
`GET /api/v1/team-manager-assignments/<exact assignmentId emitted by the proposal>`.
Those state/predecessor checks must fail closed and cannot run during
initialization or in the background. A persistent write is possible only after
exact identity verification, explicit write arming, and a separate click for
one of these four fixed modes:

| Helper mode | Exact actor | Authorized write keys |
| --- | --- | --- |
| `propose-to-b` | Admin `dbc0118a-21f9-408c-abf5-b01d9ca05e64` | proposal `HL-20260821-3-team1-to-b-propose` |
| `accept-and-publish-to-b` | Manager B `c2684bf0-d30d-4b37-ae14-66620259798e` | acceptance `HL-20260821-3-team1-to-b-accept`; publisher and its immediate identical replay `HL-20260821-3-outbox-team1-to-manager-b` |
| `propose-to-a` | Admin `dbc0118a-21f9-408c-abf5-b01d9ca05e64` | proposal `HL-20260821-3-team1-to-a-propose` |
| `accept-and-publish-to-a` | Manager A `e9f723c4-32d2-4823-a1d4-233fe0ce2f45` | acceptance `HL-20260821-3-team1-to-a-accept`; publisher and its immediate identical replay `HL-20260821-3-outbox-team1-return-to-manager-a` |

Immediately before every `POST`, including each publisher replay, the helper
must fetch
`https://staging.hundoleago.com/release-qa/hl-20260821-3/enabled.json` with
`cache: no-store`, `credentials: same-origin`, and `redirect: error`. It must
fail closed unless status is `200`, `response.url` is that exact URL,
`response.type` is `basic`, media type is `application/json`, and the response
has exactly this key set and values:

```json
{
  "contractVersion": 1,
  "enabled": true,
  "releaseId": "HL-20260821-3",
  "expiresAt": "2026-08-23T07:00:00.000Z",
  "frontendBuildId": "0e8eee92e2e323dd7f25ec3112988feaf23f96f0",
  "backendBuildId": "23971a4d66ee6383c6ad54339e769dbc9a76561e",
  "frontendOrigin": "https://staging.hundoleago.com",
  "apiOrigin": "https://api-staging.hundoleago.com"
}
```

The helper must compare the current time with exact `expiresAt` and fail
before any POST at or after `2026-08-23T07:00:00.000Z`. This marker check is
separate from the empty QueryClient invariant. No background action, retry,
arbitrary endpoint/body/key input, password field, cookie/token display,
Notifications read, or write on load is authorized.

After the strict browser evidence is captured, the helper and enablement
marker must be removed by first deleting the temporary helper-scoped
`netlify.toml` block and restoring the exact original configuration, then
redeploying the exact audited baseline `dist/` artifact without rebuilding it.
Remote verification must prove every baseline path and hash unchanged, prove
non-helper headers still match the original global rules, and prove that the
release-QA paths now resolve only through the ordinary SPA fallback. That
fallback has the wrong media type and payload for `enabled.json`, so any stale
helper tab fails closed before its next write. This temporary staging
authorization changes no production site, branch, service, data,
configuration, credential, DNS record, or traffic.

Corrected helper deploy `6a89e2c867e39d41cc630a26`, titled
`HL-20260821-3-strict-action-helper-v2`, reached ready/published state at
`2026-08-22T17:56:25.803Z`. Hosted verification passed `64` exact baseline
byte/header gates and `8` exact helper byte/header gates while preserving the
pinned main application. During double-browser inert reload window
`2026-08-22T18:04:01.882Z` through `2026-08-22T18:04:06.741Z`, Render recorded
zero request logs. Both helper tabs reported `READY` with actual isolated
`QueryClient` query and mutation caches empty; explicit session verification
matched Admin `dbc0118a-21f9-408c-abf5-b01d9ca05e64` and Manager B
`c2684bf0-d30d-4b37-ae14-66620259798e`.

Every executed phase-one POST passed its fresh-session/current-CSRF,
per-POST `enabled.json`, expiry, and empty-QueryClient assertions. The Admin
proposal additionally passed the exact Team 1 state/predecessor GET; Manager B
acceptance additionally passed the exact pending-assignment GET. These were
the only action-time state prechecks.

Phase one then produced exact proposal status `201` and assignment
`17746270-0706-4420-8efd-2f476dc00c68`. Before acceptance, persistent Manager
A was `complete 1/0/0` and Manager B was `null 1/0/0`, both loaded/idle.
Manager B acceptance returned `200`. Publisher event
`acd9b9e8-9947-4988-8057-579737724869` returned `200`, `replayed: false`,
`databaseWriteCount: 2`, and `schedulerRemainedDisabled: true`; its immediate
exact replay returned `200`, `replayed: true`, and `databaseWriteCount: 0`.
After settlement, Manager A passed at `null 2/1/1`; Manager B remained
`complete` but reached `3/1/1`, not required `2/1/1`. A focus-triggered extra
fetch is plausible but unproven and receives no waiver. Strict execution
stopped, Notifications was never opened, and no return proposal, phase-two
acceptance, or phase-two publisher call occurred. No password value is
retained in evidence.

The expected abort classifier is `to_b_accepted` with phase one `published`
and return phase `none`. Initial partial-hold deploy
`dep-da50g0v40ujc73aa5i4g` was manually canceled at
`2026-08-22T20:39:55Z` and never reached `LIVE`. The exact full-hold matrix—
maintenance true, writes closed, scheduled jobs/FAD routes/account email/debug/
scheduled backups false, email capture, and SportsDataIO live mode disabled—
was merge-set without changing `DATABASE_PATH`. Replacement deploy
`dep-da50hssaud7c73d3mqeg` started at `2026-08-22T20:39:55Z` on exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e`, reached `LIVE`, passed
`3,502/3,502`, and re-proved the exact full-hold runtime. Normal restore is not
authorized for this incomplete smoke.

The first abort-plan attempt failed closed with
`RELEASE_QA_STRICT_RESTORE_PATH_UNSAFE` because the current source had exact
`-wal` and `-shm` sidecars. A read-only process check found zero open file
descriptors on the source or either sidecar. Before checkpointing, incident-
preservation backup `44791a01-f62a-4729-b328-d3303bf79a12` at
`staging/backups/hundo-leago_staging_20260822T213849188Z_44791a01-f62a-4729-b328-d3303bf79a12.manifest.json`
verified plaintext SHA-256
`9d36b59a7b2d0d38ef47fc5bc0514a51cb5a754629e3242597b9d4400849a51f`.
The guarded canonical WAL checkpoint returned
`busy/log/checkpointed: 0/0/0`, integrity `ok`, zero foreign-key violations,
schema `54`, and both source sidecars absent.

The next abort plan passed with exact classification `to_b_accepted`, phase
one `published`, and return `none`. A first execute using a manually
transcribed plan value failed safely with
`RELEASE_QA_STRICT_RESTORE_PLAN_MISMATCH` and did not materialize the target.
Using the exact byte-extracted plan values, first execution passed with
`replayed: false`, zero authoritative-database mutations, two durable-
filesystem mutations, `sourcePreserved: true`, and `targetVerified: true`.
Immediate exact replay passed with `replayed: true`, zero authoritative-
database mutations, zero durable-filesystem mutations, and no temporary
plaintext restore. Post-checkpoint incident-preservation backup
`fa8c7b2d-04c9-4454-aae4-285673432fb7` at
`staging/backups/hundo-leago_staging_20260822T214720472Z_fa8c7b2d-04c9-4454-aae4-285673432fb7.manifest.json`
verified the same plaintext SHA-256, proving the checkpoint did not change the
authoritative database bytes.

Only `DATABASE_PATH` was then changed to the verified inactive target while
the full hold remained intact. Cutover deploy `dep-da51hjvqj5pc73bh8g3g`
started at `2026-08-22T21:46:55.442059Z`, completed `LIVE` at
`2026-08-22T22:37:35.066844Z`, and runs exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e`. Its hosted gate passed all `443`
suites and `3,502/3,502` tests with zero fail/cancel/skip/todo in
`3006420.142708ms`; build completion was `2026-08-22T22:37:16.851Z` after
`1.9s` upload and `0.2s` compression. New instance
`srv-d9eo2turnols73ekb830-qx9zx` ran `npm start` at
`2026-08-22T22:37:29.025Z`, became live at `2026-08-22T22:37:35.170Z`, and
recorded zero error logs through `2026-08-22T22:38:46Z`. Public live and ready
checks returned `200`, `Cache-Control: no-store`, and `{status:'ok'}`.

A fresh attached shell confirmed exact backend and frontend builds, target
`DATABASE_PATH`, persistent root `/opt/render/project/data/hundo-staging`,
`APP_ENV=staging`, `NODE_ENV=production`, environment `test:release-qa`,
database `m7-release-qa-fixture`, and the unchanged full hold: maintenance
true; writes closed; jobs, FAD routes, account email, debug routes, and backup
schedule false; email capture; provider disabled.

The read-only temporary-copy verifier had scratch SHA-256
`5f7de38f2673d3bb4c7d2b086b5d699afab1d173aceb86298d6e40eacb48b77f`
and returned `HL_POST_CUTOVER_TARGET_VERIFIED`. It never opened or mutated the
authoritative database. It proved source preservation at SHA-256
`859eda97cd4c55724907abb5cd91f8dd741dd4cab9f9543df8942a1e2310ee05`,
target SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`,
absent source/target sidecars, and activation-receipt SHA-256
`009227a315708be575d553eb39d72797c6f18824f0cd63b6a95580d026cb67bb`.
The abort receipt and derived plan verified at exact state
`to_b_accepted/published/none`, semantic/smoke/hosted completion all false,
and release-blocked/rollback-only both true. The target passed integrity `ok`,
zero foreign-key violations, schema and data-model version `54`, `54` applied
migrations, migration checksum
`6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89`,
exact environment/database identity, second-rotation receipt
`9152f844-d8cd-42f7-b0d5-b12f530ad618`, zero active sessions, strict-fixture
absence including league `60c82aa0-54f9-4c93-83f5-73b0d6d6f63e`, preparation
receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, and its transfer chain, plus
temporary-copy removal.

Post-cutover backup `2044fcae-24e8-4392-a1ac-4064d9cd2807` passed from
manifest
`staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json`.
Encrypted SHA-256 was
`cee039557278c41f59fa9d6a5b09cf4f69f1b9f3589cb3774420ef34be255162`,
manifest checksum was
`08e3d3bde81843a683017d9952b30e02dd02978181a8644323cfbd590eca2ac8`,
and verification returned plaintext SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`,
integrity `ok`, and zero foreign-key violations. A fresh-shell anonymous
session request returned `503 SERVICE_MAINTENANCE` with `no-store`. Held abort
restoration, cutover, re-verification, and post-cutover backup are `PASS`; the
strict privacy release remains `BLOCKED` and `ACTIVE`, and reopening is not
authorized by this evidence.

The temporary helper rollback submitted the exact sealed baseline and original
Netlify configuration to canonical staging with title
`HL-20260821-3-remove-strict-action-helper-baseline`. Deploy
`6a8a09c13d5e25282f64d2c7` was created at
`2026-08-22T20:42:41.902Z`, published at `2026-08-22T20:42:43.080Z`, and is
current/ready. Netlify exited `0`. Remote verification passed `64/64` baseline
byte checks, `8/8` original header checks, and `8/8` retired helper-path checks
across canonical staging and the immutable deploy origin. Each retired
extensionless HTML, JS, CSS, and marker path returned the exact `472`-byte SPA
index fallback with SHA-256
`1982ECF04CC456D989F7B42F15F3CED49A5D825DF0DEDD948DEAFFE8D8C1ADC8`; the
physical `.html` path also fell back. The retired marker is `text/html`, not
JSON, so a stale helper tab fails closed before any POST. Helper removal is
`PASS`; abort materialization/replay also pass, while restored-target cutover
deploy `dep-da51hjvqj5pc73bh8g3g`, target re-verification, and post-cutover
backup also pass under the unchanged full hold.

The exact fixture identities are:

```text
League:       60c82aa0-54f9-4c93-83f5-73b0d6d6f63e
Team 1:       ebc815c7-8a41-4326-8faf-04548aa91c76
Team 2:       b43e5c7f-0585-46d9-b71c-596c3c024b66
Admin:        dbc0118a-21f9-408c-abf5-b01d9ca05e64
Commissioner: 6d31c7c9-e636-440f-98f5-4fdf82a758f0
Manager A:    e9f723c4-32d2-4823-a1d4-233fe0ce2f45
Manager B:    c2684bf0-d30d-4b37-ae14-66620259798e
```

Both proposals and acceptances are direct authenticated browser API calls,
not UI approximations. Admin calls
`POST /api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/teams/ebc815c7-8a41-4326-8faf-04548aa91c76/manager-assignment`
first with `{ "userId": "c2684bf0-d30d-4b37-ae14-66620259798e" }` for
Manager B and later with
`{ "userId": "e9f723c4-32d2-4823-a1d4-233fe0ce2f45" }` for Manager A. The
target manager then calls
`POST /api/v1/team-manager-assignments/<assignmentId emitted by that proposal>/accept`
with the exact body `{}`. The four fixed `Idempotency-Key` values are, in
order:

```text
HL-20260821-3-team1-to-b-propose
HL-20260821-3-team1-to-b-accept
HL-20260821-3-team1-to-a-propose
HL-20260821-3-team1-to-a-accept
```

All six direct proposal, acceptance, and publisher calls use the active
caller's authenticated cookie jar, `credentials: include`, JSON content type,
the current session's `X-CSRF-Token`, an allowed staging `Origin`, and
compatible browser fetch metadata. The two publisher calls use these exact
phase contracts:

| Phase | Caller | `Idempotency-Key` | Exact confirmation |
| --- | --- | --- | --- |
| `team1-to-manager-b` | Manager B `c2684bf0-d30d-4b37-ae14-66620259798e` | `HL-20260821-3-outbox-team1-to-manager-b` | `PUBLISH-HL-20260821-3-TEAM1-TO-MANAGER-B` |
| `team1-return-to-manager-a` | Manager A `e9f723c4-32d2-4823-a1d4-233fe0ce2f45` | `HL-20260821-3-outbox-team1-return-to-manager-a` | `PUBLISH-HL-20260821-3-TEAM1-RETURN-TO-MANAGER-A` |

Each publisher body has exactly `backendBuildId`, `confirmation`, `phase`, and
`releaseId`; `backendBuildId` is the exact deployed `APP_BUILD_ID` SHA and
`releaseId` is `HL-20260821-3`. A fresh success uses the canonical Socket.IO
publication service, changes exactly the target row twice (claim then
published), returns `databaseWriteCount: 2` and
`schedulerRemainedDisabled: true`, and leaves Gamma, Team 2, job state, and
every unrelated outbox row unchanged. Its exact already-published replay is
zero-write. Normal restore requires both target rows to be published exactly
once with their exact payload/audience evidence.

The following two-cookie choreography remains the frozen acceptance comparator.
The recorded phase-one `STOP` prohibits resuming its return phase:

1. Record environment, database, and fixture prechecks under the full hold.
   After the controlled unhold, Jar X signs in as Admin, performs the Admin
   role/privacy prechecks, proposes Team 1 to Manager B, then signs out.
   Manager A signs into Jar X, opens Team 1 results with
   `?releaseQaT132=1`, and keeps that exact page/component mounted through both
   publication events. Its settled initial checkpoint is offer `complete`,
   loads/evictions/successful refetches `1/0/0`.
2. Jar Y signs in as Manager B and opens Team 1 results plus the diagnostic
   before acceptance. Its settled initial checkpoint is offer `null` and
   `1/0/0`. Manager B accepts, then invokes phase one from a separate Jar-Y
   action tab using the same cookie but a separate QueryClient. After the event
   settles, Jar X is `null` at `2/1/1`; Jar Y is `complete` at `2/1/1`; and
   the original T-132 Query object has been removed and replaced.
3. Jar Y signs Manager B out, signs Admin in, proposes Team 1 back to Manager
   A, signs Admin out, signs Manager B back in, and remounts Team 1 before
   Manager A accepts. That fresh Jar-Y mount starts `complete` at `1/0/0`.
   Jar X remains mounted and retains its phase-one cumulative `null` at
   `2/1/1`.
4. Manager A accepts and invokes phase two from a separate Jar-X action tab.
   After settlement, persistent Jar X is `complete` at cumulative `3/2/2`;
   remounted Jar Y is `null` at `2/1/1`. Do not report Jar Y as cumulative
   across its sign-out and remount.

Every settled diagnostic checkpoint must be `state=loaded` and
`fetchStatus=idle`; transient pending/refetching state is allowed only while
the event settles. T-131 and T-140 must independently refetch and flip between
complete offer/action and null/no-action, while the T-132 diagnostic is the
proof that the physical cache object was replaced. Evidence retains only the
classification and counters, never money or raw response/socket payloads.

If either publisher invocation fails, crashes, or leaves the target row
`failed` or `publishing`, do not retry it. Immediately restore the full hold,
preserve the failure state, and use the strict abort plan/execute path below.

#### Fresh `HL-20260822-1` fixture preparation handoff

Fixture preparation was an intentional write to the pinned authoritative
source database, not to the fresh inactive target. The operator ran the exact
prepare command below once under the full hold, then ran the identical command
once more as the idempotency replay:

```text
npm run release:qa:fad:privacy-gate:prepare -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --release-id 'HL-20260822-1' --confirmation 'PREPARE-RELEASE-QA-FAD-PRIVACY-GATE:HL-20260822-1:staging:test:release-qa:m7-release-qa-fixture'

npm run release:qa:fad:privacy-gate:prepare -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --release-id 'HL-20260822-1' --confirmation 'PREPARE-RELEASE-QA-FAD-PRIVACY-GATE:HL-20260822-1:staging:test:release-qa:m7-release-qa-fixture'
```

Both complete sanitized results were captured. They bind FAD
`f474f00b-111c-4dec-8592-ffcbaf97e655`, restricted auction
`551f475b-352f-4c06-831a-534b9750754a`, actionable deadline
`1787554800000` (`2026-08-24T07:00:00.000Z`), receipt
`88a56507-73fd-47f9-ac66-c305f0075d24`, fingerprint
`1a097b50afa8915c7cd98154dc455604965739c6d61213ac9caec90a6487620b`, and
prepared time `1787519331074`. The first reports `replayed: false` and
`databaseWriteCount: 744`; the immediate identical replay reports
`replayed: true` and `databaseWriteCount: 0` with the same IDs, times, public
counts, and inserted-row counts. `databaseWriteCount` is the canonical field;
the older `writeCount` wording elsewhere in historical narrative is only
shorthand and must not be copied into fresh evidence. Do not invoke preparation
again during this smoke attempt.

Before either command, the inactive target, its WAL/SHM sidecars, activation
receipt, and deterministic restore work area were proven absent. They remained
absent throughout prepare and replay and, under the then-active contract, were
required to remain absent through controlled unhold and hosted smoke. The
release stopped before either phase; the selected abort execute later
materialized the target and receipt under the full hold. This is a historical
pre-abort absence rule, not the current filesystem state or authority to resume.
The source bytes changed on the first prepare because the fixture was installed
there; backup
`2044fcae-24e8-4392-a1ac-4064d9cd2807`, not a post-prepare source hash, remains
the clean restore point. Only the selected normal or abort restore execute may
materialize the target and activation receipt under the restored full hold.

The fixture's exact emitted deadline was `2026-08-24T07:00:00.000Z`
(`actionableUntilMs: 1787554800000`), the next daily FAD rollover at midnight
in `America/Vancouver`. The release terminated before either hosted phase and
used abort recovery. This recorded deadline no longer permits preparation,
smoke, or resumption.

#### Fresh `HL-20260822-1` same-cookie helper record - blocked and retired

The now-closed helper contract authorized only an additive overlay on sealed
Netlify baseline `6a8a3880f946cc39a2bf2bb6`, under exact lowercase path
`/release-qa/hl-20260822-1/`. The overlay was required to preserve all `33`
application files and these pinned baseline identities:

```text
Frontend build: 4dfe12d1366314e3d9df722c50771324647743c9
index.html:     472 bytes / 90620768a37b57b905a35cd576077cd4c4f1a760da28fc8c1c8a9347458383ca
main bundle:    assets/index-BFtuYVmF.js / 527839 bytes / 19ee27ed0fa33016e9614b5dd63095b3f1d3af1fc8f33616b4c30a3c961cd201
CSS:            assets/index-C-yMyteT.css / 108551 bytes / 74aab8400795639840c5efeff9e14ffe5539b71dda1a09c523e50edf63c1ab88
```

The closed contract required the marker to bind release `HL-20260822-1`, the
frontend build above, exact backend commit
`8e313902feefcd683b0f5edd746a9dd2a9029a18`, canonical frontend/API origins,
and exact expiry `2026-08-24T07:00:00.000Z`. The helper was not deployed while
that value was a placeholder. Every marker check, header, CSP, inert-load,
empty isolated QueryClient, same-cookie, explicit arming, fresh CSRF/session,
exact-identity, no-secret, no-retry, and fail-closed rule was part of that
historical release-bound contract.

The closed contract reserved these release-derived idempotency and publisher
values; none was used because the strict smoke never began:

```text
HL-20260822-1-team1-to-b-propose
HL-20260822-1-team1-to-b-accept
HL-20260822-1-outbox-team1-to-manager-b
PUBLISH-HL-20260822-1-TEAM1-TO-MANAGER-B
HL-20260822-1-team1-to-a-propose
HL-20260822-1-team1-to-a-accept
HL-20260822-1-outbox-team1-return-to-manager-a
PUBLISH-HL-20260822-1-TEAM1-RETURN-TO-MANAGER-A
```

Had the smoke begun, both phases would have run from the newly prepared fixture.
The T-132 comparator would have counted distinct successful Query instances
once and physical eviction/replacement separately: initial `1/0/0`, after
A-to-B `2/1/1`, and after B-to-A `3/2/2`. The old `3/1/1` failure was not
waivable or a valid extra refetch. The closed contract required helper and
marker removal plus exact sealed-baseline republication after evidence capture;
the actual pre-action retirement is recorded below.

The additive overlay was published exactly once as deploy
`6a8b678ddbcf0b4ea8ba623c`, title
`HL-20260822-1-strict-helper-fe6d2dd`, at
`2026-08-23T21:35:11.134Z`. Canonical and immutable checks passed all four
helper byte/header boundaries and the sealed critical-file checks. The first
browser entry incorrectly used the physical `.html` URL. The runtime rejected
that pathname immediately as `STRICT_STOP / ORIGIN_GUARD /
EXACT_STAGING_ORIGIN_REQUIRED`; all controls stayed disabled. The tab was
closed without reload or replacement. Render recorded zero requests from
`21:35Z` through `21:42Z`, proving no session, marker, API, XHR, WebSocket, or
write request reached the backend. The full hold never lifted and the strict
smoke did not begin. Under the release-specific no-retry rule, this closed the
helper action path and selected abort recovery.

Retirement deploy `6a8b6b25126dabed39fa404d`, title
`HL-20260822-1-abort-retire-helper-baseline`, published at
`2026-08-23T21:50:30.415Z` with five header rules and no functions. Exact
baseline bytes and all `10/10` retired helper-path checks passed across
canonical and immutable origins; each retired path returned the `472`-byte
`text/html` SPA fallback with SHA-256 `90620768...`. The old helper must not be
reopened or reused. This entire helper contract is historical and grants no
authority to resume `HL-20260822-1` or reuse its marker, action, publisher, or
idempotency values.

### M7-26 fresh strict staging restore exception - exercised and closed

The now-closed exception required the service to return to the full maintenance
hold after either complete smoke or an exact recognized incomplete/failed state
and before any restore command. Only release `HL-20260822-1`, Render service
`srv-d9eo2turnols73ekb830`, environment `test:release-qa`, database
`m7-release-qa-fixture`, source
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3`,
and inactive target
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3`
were authorized by that exception. The exact candidate was backup
`2044fcae-24e8-4392-a1ac-4064d9cd2807`, schema `54`, migration checksum set
`6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89`,
and frontend build `4dfe12d1366314e3d9df722c50771324647743c9`.

Backup and Restore records four exact commands. Under the then-active
exception, the normal `release:qa:strict-restore:plan` /
`release:qa:strict-restore:execute` pair was permitted only after complete
hosted smoke; the rollback-only `release:qa:strict-restore:abort:plan` /
`release:qa:strict-restore:abort:execute` pair applied after a recognized
incomplete or failed smoke, including a publisher crash. The selected plan's
complete sanitized result had to be retained, and only its emitted `planId` and
`confirmation` could enter the matching execute mode; normal and abort evidence
could not cross. The operator also had to confirm the attached Render service
independently because the command's service ID is operator-asserted, not
provider-verified. The abort pair was selected and completed; this exception
grants no authority to run either pair again.

The abort classifier accepts only:

- `prepared_only` with publication states `none/none`;
- `to_b_pending` with the exact B proposal/idempotency/one delivered
  notification, no acceptance, and `none/none`;
- `to_b_accepted` with phase one exactly
  `pending|publishing|failed|published` and return `none`;
- `return_to_a_pending` with phase one `published`, the exact A return
  proposal/idempotency/one delivered notification, and return `none`; or
- `return_to_a_accepted` with phase one `published` and return exactly
  `pending|publishing|failed|published`.

Only `return_to_a_accepted` reports
`sourceSemanticChainCompleted: true`; every abort result/receipt reports
`smokeCompleted: false`, `hostedSmokeCompleted: false`,
`releaseBlocked: true`, and `rollbackOnly: true`. Anything else fails closed:
do not apply a manual SQL fix and do not substitute a generic restore.

Both plan modes perform zero authoritative-database and zero durable-
filesystem mutations, but truthfully create and remove temporary plaintext
database copies in the deterministic private work directory. A pre-existing
directory or abrupt-termination residue blocks reuse until manually reviewed
under the hold. Normal execute must prove the exact Admin-proposed and manager-
accepted Team 1 `A -> B -> A` chain, unchanged Team 2 assignment, both exact
publisher rows `published` once with attempt `1` and row version `3`, and no
auction bid, resolution, allocation, or allocation-event drift. A first
normal or abort execute may create only the
inactive target plus its mode-specific receipt while preserving the source;
exact replay must make zero authoritative-database and durable-filesystem
mutations without an object-store request or encryption-key resolution.

The commands do not change Render configuration or deploy. After successful
execute and zero-mutation replay, the operator may change only `DATABASE_PATH`
from the pinned source to the pinned target and redeploy the exact backend
while every hold flag remains active. The release record must then prove the
old source and receipt remain preserved; the target has the expected hash,
identity, schema, checksum, integrity, foreign keys, second credential-
rotation receipt, and zero active sessions; and the strict fixture and its
transfer records are absent. A verified incident-preservation backup precedes
fresh controlled activation. Account email remains disabled in capture mode
unless a separate restored-outbox reconciliation decision and evidence
authorize a change. This is not generic, in-place, or production restore
authority.

`HL-20260822-1` selected the abort namespace. Plan
`release-qa-strict-restore-abort-v1-59641427f2021cbb3285f6ef59635301fbcdb93177288827afd787fed1a28a99`
classified exact `prepared_only` with publication states `none/none`, source
SHA-256 `c26fdebc...`, absent target, zero authoritative-database and durable-
filesystem mutations, and verified temporary cleanup. Execute returned
`RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED`, `replayed: false`, zero
authoritative-database mutations, two durable-filesystem mutations,
`sourcePreserved: true`, `targetVerified: true`, `releaseBlocked: true`, and
`rollbackOnly: true`. Clean target plaintext SHA-256 is
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`, and the
activation-receipt SHA-256 is
`b846edcffca67b1e6ba29e7ff2d1335d44f30ab251bc4daf40e9dd49de920592`.
Immediate identical replay reported `replayed: true`, zero mutations in both
categories, and no temporary work.

Only `DATABASE_PATH` was then merge-updated to the clean target. Held cutover
deploy `dep-da5mmpu417fc73807ptg` was the then-newest `LIVE` deploy on exact B
at the recovery boundary after its complete hosted gate passed. Corrected
post-cutover verifier v2 returned
`HL_POST_CUTOVER_TARGET_VERIFIED`, removed its owned scratch artifacts, and
verified the clean target and abort receipt without opening the authoritative
database. Fresh backup `e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` and separate
plaintext/integrity/foreign-key verification passed. Recovery is complete under
the unchanged full hold; this is not activation or reopening authority.

No script or migration in this plan may open, repair, reset, or otherwise
modify production data. The user must be warned again before any later
production correction of Beta League or another protected membership record.

## Separate Launch Gates After M7-26

The strict staging rerun must not absorb or hide these independently confirmed
launch-hardening gaps:

1. T-005 session bootstrap omits the approved memberships and selected-safe
   defaults.
2. Session revocation or replacement in T-004/T-006/T-007/T-009/T-011 does
   not yet proactively disconnect the affected live Socket.IO clients.
3. Provider-neutral statistics and matchup-occurrence job operation, the
   T-067/T-093 late-legal game-source contract, and T-074 atomic cancellation
   for contract plus `prospect_right` trade assets remain incomplete.
4. Production still requires its own backup, rehearsal, explicit authority,
   migration, deployment, first-write, observation, and rollback gates.

These items are not fixed or waived by an M7-26 staging pass. They become the
next launch-readiness gates after strict release closeout.

## Required Verification

Frontend:

```text
npm run lint
npm test
npm run build
npm run verify:m3-browser-authority
npm ls --all
git diff --check
```

Backend:

```text
npm run check
npm test
git diff --check
```

Focused tests must cover every changed response contract, role boundary,
league-isolation case, hidden/internal-field rule, automatic acknowledgement,
trade approval transition, result correction/rebuild transaction, protected
administrator membership, commissioner transfer, legacy-history read, and the
approved focused prospect sign/decline/release movement.

Browser acceptance must cover manager, commissioner, and platform-
administrator roles at desktop and narrow mobile widths. Hosted smoke tests
avoid real auction, trade, roster, result, notification, membership, or data-
repair writes unless the exact staging fixture action is separately planned,
reversible, and recorded.

## Stop Conditions

Stop before production. Stop if an exact staging target, database identity,
backup, restore, migration boundary, release identity, or rollback point cannot
be proven. Stop rather than weakening authorization, exposing private offer or
bid data, inventing frontend league calculations, deleting audit evidence, or
removing a recovery path before its replacement is verified.

## Completion Conditions

M7-26 is complete only when:

1. all checkpoints are implemented and verified;
2. both repositories pass their focused and complete gates;
3. required canonical specifications reflect the implemented behavior;
4. exact frontend and backend commits are published separately to staging;
5. any staging migration has verified backup, clean-restore, integrity,
   foreign-key, and rollback evidence;
6. Render and Netlify deployments identify the exact tested builds;
7. public health and authenticated desktop/mobile role smoke tests pass;
8. protected staging data changed only through recorded approved workflows;
9. no production branch, service, data, configuration, job, or traffic changed;
   and
10. the release evidence records exact commands, results, deploy IDs, risks,
    and remaining production decision.

## Closeout and Archive Transition

M7-26 remains `PENDING`. Release `HL-20260822-1` is closed to further action as
`BLOCKED / ABORT-RECOVERED; VERIFIED HELD RECOVERY COMPLETE`. Fresh release
`HL-20260823-1` is authorized and minted. Its clean held source and verified
backup are bound, its target is absent, and B-prime implementation, local
verification, backend publication, and held deployment/runtime gate pass.
Fixture preparation/replay and every later gate through final review remain
pending.

After the final hosted gates pass, this plan's status will change to
`COMPLETE - STAGING ONLY`, the final evidence will replace every pending
placeholder in the M7-26 release record, and this plan will move to:

```text
docs/06-work-plans/archive/M7-26_FULL_SITE_UI_REVIEW.md
```

The active-plan path must not be emptied or replaced until the next contained
work plan is deliberately selected. No archive move, M7-26 completion claim,
production release or uncontrolled execution authority is made by this mint.
