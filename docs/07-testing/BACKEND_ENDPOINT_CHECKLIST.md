# Hundo Leago - Backend Endpoint Checklist

## Document Status

`APPROVED`

## Checklist Status

`ACTIVE`

This testing document defines:

* the reviewed 2026-07-18 34-route compatibility baseline;
* the approved Season 2 target endpoint catalogue as of its 2026-07-18 design;
* the evidence required before an endpoint is connected to the frontend, staged, or used in production;
* authentication, permission, league-isolation, validation, read-only, transaction, idempotency, concurrency, privacy, Socket.IO, and activity checks;
* technical checklist decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the endpoint-checklist decisions and approved adoption of the resulting checklist on 2026-07-18.

The Free Agent Draft product specification approved on 2026-07-27 and amended
on 2026-07-28 for Candidate Card ranking, tie handling, and the explicitly
selected first-matchup clock now has the approved
technical contract at `docs/04-technical-specs/FREE_AGENT_DRAFT.md`. Its exact
routes are `T-126` through `T-144`; existing auction rows `T-076` through
`T-083` also require the FAD-context proof defined below.
The 2026-07-29 FAD decision package replaces manual opening with automatic
readiness/retry, schedules continuing rollover at Entry Draft start, and adds
adaptive help, whole-card legality, strict-improvement fallback, FAD-only
draws, final-hour nomination queueing, and whole-Monday schedule recovery.

The explicit final-standings amendment approved on 2026-07-29 adds `T-145`.
Its finalization evidence is a required prerequisite for a later-season
`T-037` rollover and raises the approved target catalogue to 145 routes.

The atomic whole-card Candidate Card amendment approved on 2026-08-13 adds
`T-146` and raises the approved target catalogue to 146 routes. `T-145`
remains the distinct standings-finalization route.

## 2026-08-18 FAD Shared-Staging Closure

Release `HL-20260818-1` completed FAD-18 and M7-25 on isolated staging schema
`52`. Backend commit `9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68` is live as Render deploy
`dep-da2147e417fc73brkqmg`; frontend application commit
`50f2414cdda5926942975577f70114b5868917a9` from preserved source head
`2ba016c9d5e6b016a150a62da757f28a9c0140c0` is live as Netlify deploy
`6a8420054c9c5a624d86b2c3`. The exact hosted Node `24.14.1` backend suite passed
`3,356/3,356`; the encrypted backup, distinct clean restore, migration,
identity, health, privacy, and authenticated non-mutating browser gates passed.
Exact evidence is recorded in
`docs/07-testing/release-runs/FAD_AUCTIONS_PLAYERS_UX_2026-08-18.md`.

The FAD-context auction rows `T-076` through `T-083`, FAD rows `T-126` through
`T-144`, and atomic whole-card row `T-146` are therefore `STAGING VERIFIED`.
Production was untouched and remains unauthorized. M7-26 is the sole active
full-site UI-review plan.

## 2026-08-20 M7-26 Active-Tree Inventory Amendment

The current shared local tree targets schema `54` with `54` migration files,
`133` application tables and repository-catalog entries, and `134` physical
tables including `schema_migrations`. The composed runtime registers `123`
routes. The conceptual endpoint catalogue is `148`: T-147 is exact displayed-
batch notification acknowledgement and T-148 is commissioner approval of a
receiver-accepted Future-Considerations trade. Runtime-route count and
conceptual catalogue count are different measures.

This amendment records inventory and current normative boundaries only. It does
not claim a final M7-26 full-suite pass, shared-staging migration/deployment, or
production change. The dated FAD-18 evidence above remains exact historical
evidence; in particular, it does not verify the new M7-26 viewer-filtered FAD
privacy projection, which still requires the active plan's final gates and
hosted evidence.

M7-26 staging verification is not releasable until two additional hosted
privacy gates are recorded: (1) persisted T-082 FAD-cancellation and T-144
legacy-receipt scans plus replay prove every public offer, winner,
restricted/fallback minimum, and delta money field is null even when a stored
pre-amendment receipt contains full money; and (2) an authenticated manager-
transfer role smoke proves all T-131/T-132/T-140 caches are removed, the prior
manager receives null offers and no tie action, the replacement receives
complete values/action only for the exact newly managed team, and a second
selected team remains independently scoped. Local tests or the 2026-08-18
hosted evidence do not substitute for either gate.

Gate (1) uses only
`npm run db:scan:fad-public-receipts:staging -- --database '<absolute database path>' --environment staging --persistent-root '<absolute persistent root>'`
against the exact physical, identity-bound staging database. Its read-only
result must account for every T-082 cancellation and T-144 correction receipt,
prove current projector-plus-strict-validator safety for legacy full-money
evidence, contain only stable IDs/reason codes, report no malformed unsafe
receipt, and show identical `total_changes()` before and after.

## Historical 2026-08-21 M7-26 Held-Staging Attempt (BLOCKED / RECOVERED)

The migration candidate `a747430500fbf6887dd748e5e3dfc0ecee77dc07`
passed `3,428/3,428` tests in held Render deploy
`dep-da4e092fngtc739dipm0`. The held backend candidate
`fe6047552857376b490756ff63ac593d431ee561` passed the expanded
`3,440/3,440` gate across `443` suites in held deploy
`dep-da4gkpoed13c739gm0dg`. The final frontend candidate
`0e8eee92e2e323dd7f25ec3112988feaf23f96f0` passed `386/386` tests across
`58` files, the browser-authority gate, and `45/45` Playwright cases, and is
published as Netlify staging deploy `6a89709ffc9c88762ae8e74e`.

The exact staging database passed read-only T-082/T-144 receipt scans before
schema migration at `52` and after migration at `54`. Both scans reported zero
persisted receipts, zero malformed unsafe receipts, safe public replay, and a
zero SQLite `total_changes()` delta. Repeated authority previews required no
mutation, so no authority reconciliation ran. Backup, distinct clean restore,
migration, post-migration backup, integrity, and foreign-key gates passed.

The held staging-only credential command then rotated nine synthetic
release-QA accounts, revoked one active synthetic session, produced receipt
`d5e9c784-db5f-42f6-8fcb-1918e93f26c0`, replayed with zero writes, and was
bounded by independently verified pre- and post-rotation encrypted backups.
No password value is present in this checklist or the linked evidence.

Quiescent deploy `dep-da4hm30jo6nc73d26l80` passed `3,440/3,440`, public
health, anonymous session/CORS/cache, and sequential basic sign-in/dashboard/
sign-out checks for `Admin`, `Man A Leag A`, and `Man B Leag A`. Notifications
was not opened. FAD routes remained disabled, so T-131/T-132/T-140 selected-
team monetary privacy, restricted-tie action, and manager-transfer cache
invalidation were not exercised.

The shared staging QA password was then disclosed in chat and is treated as
compromised without recording its value. Second rotation `HL-20260821-2`
rotated nine accounts, revoked zero sessions, wrote receipt
`9152f844-d8cd-42f7-b0d5-b12f530ad618`, and replayed with zero writes. Verified
backup `adcbbbab-e857-4cae-af71-dbce95553ce5` is its strict pre-fixture restore
point.

Grae explicitly selected strict hosted evidence for the remaining transfer
gate. The planned isolated sidecar fixture must not rewrite Gamma League
history; it requires live `A -> B -> A` smoke and restoration of exact backup
`adcbbbab-e857-4cae-af71-dbce95553ce5` afterward. Pinned fixture preparation
and replay passed. Live smoke stopped after phase one on exact T-132 counter
drift. Abort materialization/replay, restored-target cutover
`dep-da51hjvqj5pc73bh8g3g`, held target verification, and the post-cutover
backup now pass. The strict privacy release remains blocked under the full
hold.

The release-bound `HL-20260821-3` four-command strict recovery family passed
its focused exact-Node `24.14.1` gate at `56/56`, and the selective strict
manager-outbox publisher separately passed `56/56`. Its combined complete
local gate then passed `3,500` of `3,502` tests across `443` suites with only
two intentional Windows capability skips and zero failures. Exact commit
`23971a4d66ee6383c6ad54339e769dbc9a76561e` is published on `origin/staging`,
and held deploy `dep-da4p5hu7bikc73aaeiq0` passed `3,502/3,502` with zero
skips/failures, clean startup, exact pinned boundary checks, live/ready `200`,
and session `503 SERVICE_MAINTENANCE`.

The exact backup reverified before strict preparation. Preparation reported
`writeCount: 744`, receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, and an exact
zero-write replay. Controlled-unhold deploy `dep-da4pvcrl550s738l8rmg` passed;
phase-one publisher invocation and exact replay passed, but the combined strict
smoke failed its Manager B counter gate before phase two.

Full-hold deploy `dep-da50hssaud7c73d3mqeg` then passed `3,502/3,502` on exact
commit `23971a4d66ee6383c6ad54339e769dbc9a76561e`. Initial abort planning failed
closed with `RELEASE_QA_STRICT_RESTORE_PATH_UNSAFE` on exact source WAL/SHM
sidecars, with zero open source/sidecar file descriptors. Pre-checkpoint
incident backup `44791a01-f62a-4729-b328-d3303bf79a12` verified plaintext
SHA-256 `9d36b59a7b2d0d38ef47fc5bc0514a51cb5a754629e3242597b9d4400849a51f`.
The guarded checkpoint returned `busy/log/checkpointed: 0/0/0`, integrity
`ok`, foreign-key violations `0`, schema `54`, and absent sidecars.

Abort planning passed at exact `to_b_accepted` / `published` / `none`. A
manual-transcription execute was rejected with
`RELEASE_QA_STRICT_RESTORE_PLAN_MISMATCH` and no target; byte-extracted execute
passed at `replayed: false`, database mutations `0`, filesystem mutations `2`,
`sourcePreserved: true`, and `targetVerified: true`. Immediate replay passed at
`replayed: true`, both mutation counts `0`, and no temporary restore. Post-
checkpoint incident backup `fa8c7b2d-04c9-4454-aae4-285673432fb7` verified the
same plaintext SHA-256. Only `DATABASE_PATH` changed for target deploy
`dep-da51hjvqj5pc73bh8g3g`. It completed `LIVE` at
`2026-08-22T22:37:35.066844Z` on exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e`, passed all `443` suites and
`3,502/3,502` hosted tests, and logged zero errors through
`2026-08-22T22:38:46Z`. Public live/ready returned `200`/`no-store`; anonymous
session returned `503 SERVICE_MAINTENANCE`/`no-store`.

The fresh shell matched exact build/path/root/runtime/identity and full-hold
values. Read-only temporary-copy verifier SHA-256
`5f7de38f2673d3bb4c7d2b086b5d699afab1d173aceb86298d6e40eacb48b77f`
returned `HL_POST_CUTOVER_TARGET_VERIFIED` without opening or mutating the
authoritative target. It verified source SHA-256
`859eda97cd4c55724907abb5cd91f8dd741dd4cab9f9543df8942a1e2310ee05`,
target SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`,
absent sidecars, abort activation-receipt SHA-256
`009227a315708be575d553eb39d72797c6f18824f0cd63b6a95580d026cb67bb`,
derived plan/state `to_b_accepted/published/none`, integrity `ok`, foreign keys
`0`, schema/data-model/migrations `54`, checksum
`6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89`,
exact IDs, second-rotation receipt
`9152f844-d8cd-42f7-b0d5-b12f530ad618`, active sessions `0`, strict-fixture
absence including league `60c82aa0-54f9-4c93-83f5-73b0d6d6f63e`, preparation
receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, and its transfer chain, plus
temporary-copy removal.

Post-cutover backup `2044fcae-24e8-4392-a1ac-4064d9cd2807` verified from
`staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json`
with encrypted SHA-256
`cee039557278c41f59fa9d6a5b09cf4f69f1b9f3589cb3774420ef34be255162`,
manifest checksum
`08e3d3bde81843a683017d9952b30e02dd02978181a8644323cfbd590eca2ac8`,
plaintext SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`,
integrity `ok`, and foreign keys `0`. This is held recovery evidence, not a
privacy-smoke pass or production evidence.

The selective component is a release-only operational exception, not a new
general endpoint family and therefore not assigned a durable `T-` number:

| Release-only operation | Exact boundary | Historical status |
| --- | --- | --- |
| `POST /api/v1/operations/release-qa/strict-manager-outbox` | In-process canonical publication of only the exact accepted Team 1 manager-assignment row; exact source-path/open-smoke environment, schema/checksum/frontend/deployed-backend/season bindings; global scheduler false; accepting Manager B for `team1-to-manager-b` or Manager A for `team1-return-to-manager-a`; credentialed cookie, current CSRF, allowed Origin/fetch metadata, exact four-key JSON body, confirmation, and `Idempotency-Key`; fresh target row claim+publish only, replay zero-write; target runtime/route not composed under hold (`503` maintenance server), and unmounted on hold-false target path or any drift (`404`) | `LOCAL COMPONENT 56/56 + COMBINED LOCAL 3,500 PASS/2 CAPABILITY SKIPS + HELD HOSTED 3,502/3,502 VERIFIED; HOSTED PHASE-ONE FRESH/REPLAY PASS; COMBINED STRICT SMOKE FAIL; ABORT TARGET MATERIALIZED/REPLAY VERIFIED; HELD TARGET CUTOVER/VERIFY/BACKUP PASS (2026-08-22)` |

The surrounding Team 1 proposals and acceptances are direct authenticated API
calls. Admin proposes to Manager B and back to Manager A with keys
`HL-20260821-3-team1-to-b-propose` and
`HL-20260821-3-team1-to-a-propose`; the emitted assignment IDs are accepted by
Manager B and Manager A with keys `HL-20260821-3-team1-to-b-accept` and
`HL-20260821-3-team1-to-a-accept`. The publisher calls use confirmations
`PUBLISH-HL-20260821-3-TEAM1-TO-MANAGER-B` and
`PUBLISH-HL-20260821-3-TEAM1-RETURN-TO-MANAGER-A` plus keys
`HL-20260821-3-outbox-team1-to-manager-b` and
`HL-20260821-3-outbox-team1-return-to-manager-a`. Exact request bodies, caller
IDs, and two-cookie T-132 checkpoints are pinned in Testing Strategy and the
release record. A failed/crashed publisher is never retried: re-hold and run
the matching abort recovery. The restored target must not expose this route.

These results advanced the historical automated, persisted-receipt, held-
hosted candidate, fixture-preparation, phase-one publisher, and abort-recovery
gates, but they did not mark T-131, T-132, T-140, T-147, or T-148 `STAGING
VERIFIED`. The combined live fixture smoke failed. Target cutover, re-
verification, and backup passed; this attempt is closed as blocked/recovered
and must not be resumed.
Exact evidence is recorded in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-21.md`.
Production remains untouched and unauthorized.

## 2026-08-22 M7-26 Fresh Held-Staging Rerun (BLOCKED; ABORT-RECOVERED; VERIFIED HELD RECOVERY COMPLETE)

Release `HL-20260822-1` is no longer active. Its exact frontend/backend local,
publication, held-hosted, backup, and fixture prepare/replay evidence remains
valid. Helper deploy `6a8b678ddbcf0b4ea8ba623c` passed canonical and
immutable byte/header checks for all four helper files while preserving the
sealed application. A physical `.html` browser entry then immediately returned
`STRICT_STOP / ORIGIN_GUARD / EXACT_STAGING_ORIGIN_REQUIRED` with every control
disabled. The tab was closed without replacement. The full hold never lifted;
Render logged zero requests from `21:35Z` through `21:42Z`; no session check,
proposal, acceptance, publisher, replay, endpoint call, or backend write ran.
The T-131/T-132/T-140 two-phase hosted comparator therefore remains unverified.

The required abort plan classified exact `prepared_only` with publication
states `none/none`, source SHA-256 `c26fdebc...`, absent target, zero mutations,
and verified temporary cleanup. Abort execute/replay preserved the source,
materialized and verified the clean target at plaintext SHA-256 `cf3ca07d...`,
created receipt SHA-256
`b846edcffca67b1e6ba29e7ff2d1335d44f30ab251bc4daf40e9dd49de920592`, and
reported mutations `0/2` then `0/0`; both classify the release blocked and
rollback-only. Helper-retirement deploy `6a8b6b25126dabed39fa404d` restored the
sealed baseline, and all `10/10` retired helper-path checks passed on canonical
and immutable origins.

Only `DATABASE_PATH` was then merge-updated to target
`hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3`. Held cutover deploy
`dep-da5mmpu417fc73807ptg` reached `LIVE` as then-newest on exact B after `443`
suites / `3,503` hosted tests all passed in `2941574.017632ms`; instance
`mq8dr`, zero startup errors, live/readiness `200`/`no-store`, and held leagues
`503 SERVICE_MAINTENANCE`/`no-store` passed. Corrected exact-Node-`24` verifier
v2 returned `HL_POST_CUTOVER_TARGET_VERIFIED`: the preserved source,
authoritative target, abort receipt, full hold/provider absence, target
identity/integrity/schema/checksum/rotation receipt, zero sessions, all ten
fixture/transfer artifact counts `0`, and owned scratch cleanup verified without
opening the authoritative database. Fresh backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` passed, and separate verification proved
plaintext `cf3ca07d...`, integrity `ok`, and foreign keys `0`. Retained verifier
v1 `6157adfd598cbf9d7d306dd849822e494ffefe7aee29f3eb14ce2ea4d9ec38c7` is
diagnostic evidence of a scratch-sidecar false negative; v2
`61610cb991fb049075f4b997688da31bacf20b772ede4f994c197298b40f76a0` corrected
it. Recovery is complete under the full hold.
No historical or current action key, receipt, fixture, helper marker, or
incomplete transfer may be reused. At that recovery boundary no replacement
release was authorized. Exact historical evidence lives in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-22.md`.

---

## 2026-08-23 M7-26 Fresh Strict Release (FIXTURE PREPARE/REPLAY + HELD POSTFLIGHT PASS; HELPER CONSTRUCTION PENDING)

Grae requested and approved `HL-20260823-1` at
`2026-08-23T23:23:29.877Z`. F
`4dfe12d1366314e3d9df722c50771324647743c9` is frozen. B
`8e313902feefcd683b0f5edd746a9dd2a9029a18` is the verified held starting
baseline. Executable B-prime
`234547e4d8453b7515fc081ea6ebe4c2d022dc54` passes its exact two-file focused,
complete, check, dependency, and `origin/staging` publication gates. Held
deploy `dep-da5sh0e417fc738i254g`, started
`2026-08-24T04:28:49.802474Z`, is newest and `LIVE` on exact B-prime after all
`3,503/3,503` hosted tests, build/startup, zero-error, held-health, and external
read-only gates passed.

The clean pre-fixture source boundary was exact path
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3`,
`37105664` bytes / SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`.
Fresh prepare/replay passed at `729` then `0` writes. Held verifier v2 then
proved that same path is the current authoritative fixture-bearing source at
`37744640` bytes / SHA-256
`b4163695d6f9db9e1f2db2b3aee536126e42b83f540fb0ee919b962fbd92b103`.
Fresh target
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3`
is absent. Verified backup `e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` binds exact
manifest and `.sqlite3.gz.enc` storage-object prefix
`staging/backups/hundo-leago_staging_20260823T225620203Z_e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6`,
`createdAt` `2026-08-23T22:56:20.203Z`, encrypted SHA-256
`e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448`,
manifest checksum
`54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155`,
and verified plaintext `cf3ca07d...`. Its exact reason/retention/requester/
expiry/backend metadata is recorded in the fresh run ledger.

The full hold remains active. Fresh helper construction/local verification is
next. Helper publication, controlled unhold, session verification,
release-specific actions, publisher
replays, T-131/T-132/T-140 comparator, restore, activation, and final review are
all `PENDING`. No write endpoint or action request has run; fixture preparation
is the only authoritative database mutation so far. Exact current
evidence is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-23.md`.

---

## Testing Purpose

An endpoint is not complete because:

* its route exists;
* one happy-path request returned `200`;
* the frontend appeared to update;
* a database row changed;
* a Socket.IO event arrived.

Each endpoint must prove the full approved contract, including what it must refuse and what it must not change.

This checklist makes that evidence visible feature by feature.

---

## Out of Scope

This checklist does not:

* implement an endpoint;
* change an API contract;
* authorize production requests that mutate data;
* replace feature specifications;
* replace automated test source;
* treat a checked box as evidence without a command and result;
* permit debug or recovery routes in production;
* require all target endpoints for the initial Season 2 launch when the roadmap explicitly defers the feature.

`API_CONTRACTS.md` remains the contract authority. This file tracks implementation and proof.

---

# Part 1 - Authority

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/DEPLOYMENT.md
docs/07-testing/TESTING_STRATEGY.md
```

When this checklist and API Contracts differ, stop and reconcile the documents before implementation continues.

---

## Reviewed Basis

The compatibility inventory was reviewed from:

```text
Backend branch: stage2
Review date:    2026-07-18
```

Approved count:

```text
34 current route registrations
6 conditional debug routes
28 routes when MATCHUPS_DEBUG is disabled
```

The target catalogue is approved design. A target row marked `PLANNED` does not claim that code exists.

---

# Part 2 - Status Model

## Allowed Endpoint Statuses

| Status | Meaning |
| --- | --- |
| `PLANNED` | Approved contract exists; implementation has not started |
| `CHARACTERIZED` | Current compatibility behavior has automated evidence |
| `IMPLEMENTED` | Route and application path exist locally |
| `CONTRACT TESTED` | Request, response, error, permission, and safety tests pass |
| `FRONTEND CONNECTED` | Approved frontend caller uses the endpoint |
| `LOCAL VERIFIED` | Integrated disposable-local backend, frontend, privacy, read-only, and browser evidence passes; no staging claim |
| `STAGING VERIFIED` | Deployed staging contract and security checks pass |
| `PRODUCTION VERIFIED` | Authorized read-only smoke or real workflow evidence passes |
| `RETIRED` | Compatibility endpoint is removed after every approved caller moved |
| `BLOCKED` | A named dependency or conflict prevents safe progress |

Only evidence-backed status changes are allowed.

---

## Current Inventory Status

Current compatibility rows begin as:

```text
EXISTS / CHARACTERIZATION REQUIRED
```

This records the reviewed route registration without falsely marking the endpoint tested.

---

## Target Inventory Status

Target rows begin as:

```text
PLANNED
```

Implementation proceeds in roadmap order, not table order.

---

# Part 3 - Evidence Required Per Endpoint

## Evidence Record

Each endpoint status update records:

```text
endpoint ID
method and path
repository
branch
commit or working-tree identity
implementation work-plan ID
test files
commands
passed, failed, and skipped counts
fixture and database identity
authorized actor
league and second-league fixture IDs
before/after data proof
response-schema evidence
Socket.IO or outbox evidence when applicable
frontend caller path when applicable
staging deploy ID when applicable
known risks
status
review date
```

Do not place cookies, CSRF values, passwords, tokens, active bid values, or secrets in the evidence record.

---

## Minimum Automated Proof

Every implemented endpoint tests the applicable items:

- [ ] Exact method and path are registered.
- [ ] Success status and response envelope match API Contracts.
- [ ] Required fields, types, units, and stable IDs match.
- [ ] Unknown fields and malformed input are rejected.
- [ ] Safe stable error code and request ID are returned.
- [ ] Unauthenticated access returns the approved result.
- [ ] Authorized role succeeds.
- [ ] Unauthorized role fails.
- [ ] Cross-league access fails without disclosing resource existence.
- [ ] Frozen-league behavior matches the feature.
- [ ] `If-Match` behavior passes when the aggregate is versioned.
- [ ] Idempotency replay and mismatched replay pass when required.
- [ ] Database changes are atomic.
- [ ] Failure and rollback leave state unchanged.
- [ ] Outbox and Socket.IO occur only after commit.
- [ ] Response and logs exclude secrets and private fields.
- [ ] Read behavior is proven not to mutate domain data.

`Not applicable` requires a short reason in the evidence.

---

## GET and HEAD Safety

For every read endpoint:

- [ ] No league-domain table changes.
- [ ] No file normalization or rewrite.
- [ ] No backup, snapshot, import, refresh, repair, or migration starts.
- [ ] No job occurrence advances.
- [ ] No League Activity entry is created.
- [ ] No outbox message or Socket.IO invalidation is emitted.
- [ ] The narrowly approved session `lastUsedAt` refresh, when present, remains separate from league-domain proof.

Before SQLite cutover, compare protected file hashes.

After SQLite cutover, compare domain transaction state or semantic table hashes.

---

## Material Write Safety

For every material write:

- [ ] CSRF is required for browser session requests.
- [ ] Actor identity and role come from the session and database.
- [ ] Body-supplied team, role, league, or ownership claims are ignored as authority.
- [ ] Validation finishes before mutation.
- [ ] Approved optimistic version is enforced.
- [ ] Approved idempotency key is scoped to actor, league, route, and payload.
- [ ] All related writes use one SQLite transaction.
- [ ] Constraint or service failure rolls back every change.
- [ ] Activity, Security Audit, notification, and outbox records follow their separate approved rules.
- [ ] One committed domain change produces at most one scoped invalidation.

---

# Part 4 - Current Compatibility Inventory

## Compatibility Gate

Compatibility endpoints preserve reviewed behavior during the backend refactor.

Characterization is not permission to expose them indefinitely. Current security gaps remain launch blockers until target endpoints replace them.

| ID | Method and path | Class | Current state | Required focused proof |
| --- | --- | --- | --- | --- |
| `C-001` | `GET /` | Public read | Exists; characterization required | Plain-text compatibility and no writes |
| `C-002` | `GET /health` | Public operational read | Exists; characterization required | Shape, no writes, document current path disclosure |
| `C-003` | `GET /api/league` | Broad public read | Exists; characterization required | Complete normalized shape and protected-file hash proof |
| `C-004` | `POST /api/league` | Broad compatibility write | Exists; characterization required | Shape, wipe/freeze guards, save behavior, event attempt, failure atomicity |
| `C-005` | `GET /api/players` | Public read | Exists; characterization required | Query and limit boundaries, response shape, no file change |
| `C-006` | `GET /api/players/debug` | Public debug read | Exists; characterization required | Exact current exposure and no writes |
| `C-007` | `GET /api/players/:id` | Public read | Exists; characterization required | Valid, malformed, missing ID, stable shape |
| `C-008` | `POST /api/players/reload` | Compatibility operation | Exists; characterization required | Cache replacement, source preservation, failure behavior |
| `C-009` | `GET /api/stats` | Public read | Exists; characterization required | Empty-cache, full-cache, one-player forms and no writes |
| `C-010` | `POST /api/stats/refresh` | Token operation | Exists; characterization required | Token rejection, last-valid-cache protection, failure atomicity |
| `C-011` | `GET /api/stats/debug` | Public debug read | Exists; characterization required | Exact current exposure and no writes |
| `C-012` | `GET /api/stats/debug-localpath` | Public debug read | Exists; characterization required | Exact current exposure and no writes |
| `C-013` | `GET /api/matchups/current` | Public calculated read | Exists; characterization required | Current week boundaries, server time, no writes |
| `C-014` | `GET /api/matchups/standings` | Public calculated read | Exists; characterization required | Current derived sort/result behavior and no writes |
| `C-015` | `GET /api/matchups/locks` | Public read | Exists; characterization required | Lock metadata shape and no writes |
| `C-016` | `GET /api/matchups/locks/preview` | Public preview | Exists; characterization required | Preview determinism and no lock mutation |
| `C-017` | `GET /api/matchups/baseline/preview` | Public preview | Exists; characterization required | Sample and readiness behavior, no baseline mutation |
| `C-018` | `GET /api/matchups/baseline/status` | Public read | Exists; characterization required | Gate state and no writes |
| `C-019` | `GET /api/matchups/scoring/preview` | Public preview | Exists; characterization required | Current baseline calculation and no writes |
| `C-020` | `GET /api/matchups/rollover/status` | Public read | Exists; characterization required | Eligibility/result state and no rollover |
| `C-021` | `POST /api/matchups/schedule/generate` | Compatibility write | Exists; characterization required | Role metadata, replacement/clear behavior, invalid request rollback |
| `C-022` | `POST /api/matchups/schedule/updateWeek` | Compatibility write | Exists; characterization required | Boundary validation, future-week constraints, failure rollback |
| `C-023` | `POST /api/matchups/schedule/shiftFrom` | Compatibility write | Exists; characterization required | Deterministic shift, preserved earlier weeks, failure rollback |
| `C-024` | `GET /api/matchups/debug/stateSummary` | Conditional debug read | Exists only with flag; characterization required | Registration count, safe fixture only, no writes |
| `C-025` | `POST /api/matchups/debug/resetLocks` | Conditional destructive debug | Exists only with flag; characterization required | Isolated fixture, exact clearing behavior, never production |
| `C-026` | `POST /api/matchups/debug/resetBaselineForWeek` | Conditional destructive debug | Exists only with flag; characterization required | Isolated fixture, exact week deletion, never production |
| `C-027` | `POST /api/matchups/debug/captureBaselineNow` | Conditional debug job | Exists only with flag; characterization required | Job invocation and idempotency on fixture, never production |
| `C-028` | `POST /api/matchups/debug/runLockNow` | Conditional debug job | Exists only with flag; characterization required | Job invocation and idempotency on fixture, never production |
| `C-029` | `POST /api/matchups/debug/setTeamRosterEmpty` | Conditional destructive debug | Exists only with flag; characterization required | Fixture mutation boundaries and never production |
| `C-030` | `GET /api/snapshots` | Public operational read | Exists; characterization required | Listing shape, no writes, current exposure |
| `C-031` | `POST /api/snapshots/create` | Public compatibility operation | Exists; characterization required | Snapshot name, contents, failure behavior, source unchanged |
| `C-032` | `POST /api/snapshots/restore` | Public destructive operation | Exists; characterization required | Isolated fixture only, restore/activity/event behavior, pre/post hashes |
| `C-033` | `GET /api/backups?limit=50` | Public operational read | Exists; characterization required | Limit/list shape, current path exposure, no writes |
| `C-034` | `POST /api/backups/restore` | Compatibility destructive operation | Exists; characterization required | Isolated fixture only, role metadata, restore/save/activity/event behavior |

---

## BR-00 Compatibility Completion

Backend Refactor `BR-00` may mark a compatibility row `CHARACTERIZED` only when:

* its route registration is in the exact manifest;
* a representative success response passes;
* applicable failure behavior passes;
* GET/read file-hash proof passes;
* write tests use explicit temporary fixture paths;
* no current production or repository data changes.

Debug rows also prove:

```text
MATCHUPS_DEBUG=false -> 28 registered routes
MATCHUPS_DEBUG=true  -> 34 registered routes
```

---

# Part 5 - Target Session Endpoints

Target rows in Parts 5 through 17 were initially recorded as `PLANNED`; each
table now records the highest evidence-backed current status.

### Session-router reconciliation - 2026-08-22

The current target runtime composes all T-001 through T-013 routes. Current
Node `24.14.1` service, router, and composed-runtime tests prove T-001 through
T-003 and T-008, T-012, and T-013 at `CONTRACT TESTED`; T-010 is implemented
with exact self-only fields, `If-Match`, uniqueness, and versioned transaction
guards, but has no exact-path HTTP contract test and is therefore only
`IMPLEMENTED`.

The remaining rows expose two real contract gaps rather than missing catalogue
bookkeeping. T-005 returns safe user/session/CSRF data but omits the memberships
and selected-safe defaults promised by `API_CONTRACTS.md`. The global Security
contract requires an already-connected Socket.IO client to disconnect when its
session is revoked or expires. Current HTTP/services revoke sessions for a
replacement login, sign-out, password change/reset, and deactivation, but no
production bridge proactively reauthorizes or disconnects those sockets. The
existing socket test invokes reauthorization manually and therefore does not
close that runtime gap. T-004, T-006, T-007, T-009, and T-011 remain blocked
despite their otherwise strong HTTP, transaction, audit, and rollback tests.

This reconciliation does not promote any row to `FRONTEND CONNECTED`, `LOCAL
VERIFIED`, `STAGING VERIFIED`, or `PRODUCTION VERIFIED`: the recorded basic
hosted sign-in, bootstrap, and sign-out smoke is not substituted for endpoint-
by-endpoint hosted or manual evidence, and no hosted password-change, reset,
deactivation, reactivation, profile-edit, or registration write is claimed
here.

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-001` | `POST /api/v1/accounts` | Rate limits, matching password fields, unique normalized email/display name, no granted membership | `CONTRACT TESTED - CURRENT NODE 24.14.1 SERVICE + HTTP + COMPOSED RUNTIME (2026-08-22)` |
| `T-002` | `POST /api/v1/accounts/email-verifications` | Single-use token, expiry, atomic activation and initial session | `CONTRACT TESTED - CURRENT NODE 24.14.1 SERVICE + HTTP (2026-08-22)` |
| `T-003` | `POST /api/v1/accounts/email-verification-requests` | Non-enumeration, replacement invalidates prior live link, rate limit | `CONTRACT TESTED - CURRENT NODE 24.14.1 SERVICE + HTTP (2026-08-22)` |
| `T-004` | `POST /api/v1/session` | Generic failure, rate limit, password verification, one active session | `BLOCKED - REPLACEMENT SESSION DOES NOT PROACTIVELY DISCONNECT THE REVOKED SESSION'S LIVE SOCKET; HTTP + TRANSACTION LOCALLY TESTED (2026-08-22)` |
| `T-005` | `GET /api/v1/session` | Safe user and membership bootstrap, CSRF bootstrap, no credential fields | `BLOCKED - ROUTER/APPROVED-CONTRACT MISMATCH; USER/SESSION/CSRF + READ-ONLY LOCALLY TESTED (2026-07-20)` |
| `T-006` | `DELETE /api/v1/session` | Current session revoked, cookie cleared, Socket.IO disconnected | `BLOCKED - LIVE SOCKET DISCONNECT NOT WIRED; HTTP REVOCATION + COOKIE CLEAR LOCALLY TESTED (2026-08-22)` |
| `T-007` | `POST /api/v1/session/password` | Current-password check, matching new fields, all sessions revoked, signed-out response | `BLOCKED - REVOKED LIVE SOCKETS ARE NOT PROACTIVELY DISCONNECTED; HTTP + TRANSACTION LOCALLY TESTED (2026-08-22)` |
| `T-008` | `POST /api/v1/password-reset-requests` | Non-enumeration, 30-minute single-use token, rate limit | `CONTRACT TESTED - CURRENT NODE 24.14.1 SERVICE + HTTP (2026-08-22)` |
| `T-009` | `POST /api/v1/password-resets` | Token expiry/use, matching password fields, session revocation, no automatic sign-in | `BLOCKED - REVOKED LIVE SOCKETS ARE NOT PROACTIVELY DISCONNECTED; HTTP + TRANSACTION LOCALLY TESTED (2026-08-22)` |
| `T-010` | `PATCH /api/v1/account` | `If-Match`, unique display name, safe self-only fields | `IMPLEMENTED - SERVICE/POLICY TESTED; EXACT-PATH HTTP CONTRACT TEST PENDING (2026-08-22)` |
| `T-011` | `POST /api/v1/account/deactivation` | Current password, typed confirmation, membership effects, session revocation | `BLOCKED - REVOKED LIVE SOCKETS ARE NOT PROACTIVELY DISCONNECTED; HTTP + TRANSACTION LOCALLY TESTED (2026-08-22)` |
| `T-012` | `POST /api/v1/account/reactivation-requests` | Non-enumeration, rate limit, single live link | `CONTRACT TESTED - CURRENT NODE 24.14.1 SERVICE + HTTP (2026-08-22)` |
| `T-013` | `POST /api/v1/account/reactivations` | Token and current password, no session creation, restored allowed state only | `CONTRACT TESTED - CURRENT NODE 24.14.1 SERVICE + HTTP (2026-08-22)` |

---

# Part 6 - Target Platform Administration Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-014` | `GET /api/v1/admin/users` | Platform administrator only, pagination/search, no credential hashes | `PLANNED` |
| `T-015` | `POST /api/v1/admin/users` | Unique identity, no operator-known password, audited creation | `PLANNED` |
| `T-016` | `GET /api/v1/admin/users/:userId` | Safe profile only, malformed/missing ID behavior | `PLANNED` |
| `T-017` | `PATCH /api/v1/admin/users/:userId` | Approved fields, version conflict, status invariants | `PLANNED` |
| `T-018` | `POST /api/v1/admin/users/:userId/credential-setup-requests` | 72-hour single-use link, replacement, no password disclosure | `PLANNED` |
| `T-019` | `POST /api/v1/admin/users/:userId/password-reset-requests` | Admin initiates email only, cannot set/view password | `PLANNED` |
| `T-020` | `POST /api/v1/admin/leagues` | League and initial season atomic, unique stable IDs, protected active `member` membership provisioned for every active platform administrator | `PLANNED` |
| `T-021` | `POST /api/v1/admin/leagues/:leagueId/commissioner-assignments` | Eligible non-administrator existing member, proposal grants no active authority, notification/outbox | `PLANNED` |
| `T-022` | `DELETE /api/v1/admin/leagues/:leagueId` | Protected request, typed confirmation, backup, idempotent approved workflow | `PLANNED` |
| `T-023` | `GET /api/v1/admin/requests` | Safe pagination and status filter, no protected payload leakage | `PLANNED` |
| `T-024` | `GET /api/v1/admin/requests/:requestId` | Safe review context and inaccessible-resource behavior | `PLANNED` |
| `T-025` | `POST /api/v1/admin/requests/:requestId/approve` | Strong reauthentication, status race, one execution, Security Audit | `PLANNED` |
| `T-026` | `POST /api/v1/admin/requests/:requestId/decline` | Recorded reason, final-state race, notification | `PLANNED` |
| `T-027` | `GET /api/v1/admin/security-audit` | Platform-only pagination, safe metadata, read-only proof | `PLANNED` |

---

# Part 7 - Target League Discovery and Settings Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-028` | `GET /api/v1/public/leagues` | Active discoverable leagues only, public projection, noindex metadata | `PLANNED` |
| `T-029` | `GET /api/v1/public/leagues/:leagueId` | Discoverability rule, public fields only, missing/private behavior | `PLANNED` |
| `T-030` | `GET /api/v1/public/leagues/:leagueId/teams` | Public team projection only, no membership data | `PLANNED` |
| `T-031` | `GET /api/v1/leagues` | Only caller-visible leagues, no cross-user leakage | `PLANNED` |
| `T-032` | `GET /api/v1/leagues/:leagueId` | Membership authorization, safe active season summary | `PLANNED` |
| `T-033` | `GET /api/v1/leagues/:leagueId/settings` | Effective settings, member-only, no secret configuration | `PLANNED` |
| `T-034` | `PATCH /api/v1/leagues/:leagueId/settings` | Platform admin only, commissioners denied, `If-Match`, editable allowlist | `PLANNED` |
| `T-035` | `PUT /api/v1/leagues/:leagueId/setup/trade-deadline` | Commissioner/member-admin during Setup only, league/settings CAS, durable replay, informational setting, no hidden event | `CONTRACT TESTED` |
| `T-036` | `POST /api/v1/leagues/:leagueId/start` | Complete settings including stored trade deadline, minimum four teams, invitation/manager readiness, atomic team/season/league transition, durable replay and rollback | `CONTRACT TESTED` |
| `T-037` | `POST /api/v1/leagues/:leagueId/lifecycle-transitions` | Exact exemption or blocked-scheduled-rollover retry discriminator; retry binds current Entry Draft `If-Match`, durable occurrence and idempotency, while system execution remains job-only; one completed FAD with every initial/extension path terminal, canonical current T-145/T-097 lineage, persisted target calendar, atomic versioned effects plus immutable per-effect manifest; exemption forbids `If-Match` and requires exact member platform-administrator authority, reset report/bootstrap identity, explicit Activity, exact-current-commissioner notification, canonical three-event publication, and no card opening | `CONTRACT TESTED - LOCAL ONLY (FAD-04/FAD-14; 2026-08-11)` |
| `T-038` | `POST /api/v1/leagues/:leagueId/freeze` | Commissioner, approved write families blocked, activity/audit rules | `PLANNED` |
| `T-039` | `DELETE /api/v1/leagues/:leagueId/freeze` | Commissioner, exact prior state, idempotent unfreeze | `PLANNED` |

---

# Part 8 - Target Membership and Team Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-040` | `GET /api/v1/leagues/:leagueId/memberships` | Commissioner only, safe user projection, league isolation | `PLANNED` |
| `T-041` | `POST /api/v1/leagues/:leagueId/invitations` | Existing user, no premature authority, expiry and notification | `PLANNED` |
| `T-042` | `GET /api/v1/league-invitations/:invitationId` | Invited user only, safe league/team context | `PLANNED` |
| `T-043` | `POST /api/v1/league-invitations/:invitationId/accept` | One use, membership/team workflow atomic, conflict behavior | `PLANNED` |
| `T-044` | `POST /api/v1/league-invitations/:invitationId/decline` | Invited user only, final status, no membership | `PLANNED` |
| `T-045` | `PATCH /api/v1/leagues/:leagueId/memberships/:membershipId` | Commissioner, approved ordinary status/role fields; current-commissioner and protected-administrator mutation rejected | `PLANNED` |
| `T-046` | `DELETE /api/v1/leagues/:leagueId/memberships/:membershipId` | Ordinary membership only; protected administrator/current commissioner rejected; manager assignment effects and session authorization refresh atomic | `PLANNED` |
| `T-047` | `GET /api/v1/leagues/:leagueId/teams` | Member-only list, stable IDs, league isolation | `PLANNED` |
| `T-048` | `POST /api/v1/leagues/:leagueId/teams` | Commissioner, non-live-season restriction, stable identity | `PLANNED` |
| `T-049` | `GET /api/v1/leagues/:leagueId/teams/:teamId` | Safe member projection, team belongs to league | `PLANNED` |
| `T-050` | `PATCH /api/v1/leagues/:leagueId/teams/:teamId` | Manager field allowlist versus commissioner fields, `If-Match` | `PLANNED` |
| `T-125` | `GET /api/v1/leagues/:leagueId/teams/:teamId/logo` | Member-only exact-team BLOB read, inspected media, no-store, strictly read-only | `PLANNED` |
| `T-051` | `POST /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment` | Commissioner, one active assignment, eligible ordinary active member only; protected administrators rejected | `PLANNED` |
| `T-052` | `DELETE /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment` | Commissioner, no unauthorized team control remains and no protected membership changes | `PLANNED` |
| `T-053` | `DELETE /api/v1/leagues/:leagueId/teams/:teamId` | Commissioner request plus admin approval, no live-season deletion, backup | `PLANNED` |
| `T-054` | `GET /api/v1/commissioner-assignments/:assignmentId` | Proposed user only, safe details | `PLANNED` |
| `T-055` | `POST /api/v1/commissioner-assignments/:assignmentId/accept` | One use; replacement is an eligible non-administrator; old commissioner demotes to manager/member, replacement promotes, and league pointer changes atomically | `PLANNED` |
| `T-056` | `POST /api/v1/commissioner-assignments/:assignmentId/decline` | Proposed user only, no authority granted | `PLANNED` |

---

# Part 9 - Target Player and Statistics Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-057` | `GET /api/v1/players` | Cursor pagination, query/filter limits, stable provider mapping | `PLANNED` |
| `T-058` | `GET /api/v1/players/:playerId` | Stable global player identity, no league-private fields | `PLANNED` |
| `T-059` | `GET /api/v1/players/:playerId/statistics` | Season totals and integer-hundredths FP, last-valid data | `PLANNED` |
| `T-060` | `GET /api/v1/leagues/:leagueId/players/:playerId` | League ownership/eligibility/contract projection, cross-league denial | `PLANNED` |
| `T-061` | `POST /api/v1/operations/players/import` | Platform admin, durable/idempotent import, validation report, provider failure | `PLANNED` |
| `T-062` | `POST /api/v1/operations/statistics/refresh` | Platform admin, durable occurrence, last-valid-cache preservation | `PLANNED` |
| `T-063` | `GET /api/v1/operations/statistics/refreshes/:jobId` | Platform admin, safe job state, no provider-secret leakage | `PLANNED` |

---

# Part 10 - Target Roster and Cap Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-064` | `GET /api/v1/public/leagues/:leagueId/teams/:teamId/roster` | Exact public projection, no private fields, no normalization write | `PLANNED` |
| `T-065` | `GET /api/v1/leagues/:leagueId/teams/:teamId/roster` | Groups, slots, ownership, contracts, cap and legality reconcile | `PLANNED` |
| `T-066` | `GET /api/v1/leagues/:leagueId/teams/:teamId/roster/legality` | Complete authoritative reasons, strictly read-only | `PLANNED` |
| `T-067` | `POST /api/v1/leagues/:leagueId/teams/:teamId/roster/:ownershipId/move` | Team control, group/slot rules, prospect no-return rule, warning behavior; when the move first restores late legality, fresh authoritative NHL game state drives one atomic roster snapshot/baseline/immutable player-game exclusion set, already-underway games are excluded in full, and replay/racing moves converge | `PLANNED` |
| `T-068` | `POST /api/v1/leagues/:leagueId/teams/:teamId/prospects/:playerId/sign` | Exact manager/team/right/version authority; server-derived `$3/3y` ELC and season plan; atomic remain-in-Prospects or legal Active/Bench/eligible-IR destination; strict illegality rejection, activity, rollback, late-lock coordination, and cancellation/history/socket publication for every pending proposal whose unsigned prospect-right snapshot is converted by signing | `LOCAL VERIFIED - M7-26 (2026-08-20)` |
| `T-069` | `POST /api/v1/leagues/:leagueId/teams/:teamId/prospects/:playerId/decline` | Exact confirmation/version; current unsigned right only; distinct atomic decline, rights deletion, retained history/activity, affected pending-trade cancellation/publication, rollback, isolation, and late-lock coordination | `LOCAL VERIFIED - M7-26 (2026-08-20)` |
| `T-070` | `DELETE /api/v1/leagues/:leagueId/teams/:teamId/prospect-rights/:playerId` | Exact confirmation/version; current manager and unsigned-right ownership; distinct atomic voluntary release, retained history/activity, affected pending-trade cancellation/publication, rollback, isolation, and late-lock coordination | `LOCAL VERIFIED - M7-26 (2026-08-20)` |

---

# Part 11 - Target Contract, Retention, and Buyout Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-071` | `GET /api/v1/leagues/:leagueId/teams/:teamId/contracts` | Current contracts only, integer money, remaining years | `PLANNED` |
| `T-072` | `GET /api/v1/leagues/:leagueId/contracts/:contractId` | League ownership and remaining schedule, no expired/bought-out display | `PLANNED` |
| `T-073` | `GET /api/v1/leagues/:leagueId/teams/:teamId/cap-obligations` | Retention and buyout schedules reconcile by season | `PLANNED` |
| `T-074` | `POST /api/v1/leagues/:leagueId/teams/:teamId/contracts/:contractId/buyout` | Authorized owning-team manager or approved commissioner/inherited-admin actor, 14-day lock, 25% full-AAV schedule, release and every affected pending-trade cancellation atomic, including signed `Prospect` snapshots represented as `prospect_right`; current known staging failure leaves all state unchanged and requires a separate P1 production-promotion follow-up | `PLANNED` |
| `T-075` | `POST /api/v1/leagues/:leagueId/contracts/:contractId/corrections` | Commissioner, explicit before/after version, no hidden extension | `PLANNED` |

---

# Part 12 - Target Auction and Bid Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-076` | `GET /api/v1/leagues/:leagueId/auctions` | Ordinary/FAD context/filters, bounded opaque-cursor search, per-managed-team `viewerTeams[]`/`startTeams[]`, identity-only commissioner administration, draw commitment and terminal safe result, no competing or queued-nomination values; fresh full-migration authenticated runtime proves exact envelopes, privacy, and no writes | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-077` | `POST /api/v1/leagues/:leagueId/auctions` | Server-derived weekly/open-rapid context and target season; AAV-first quarter-increment input and derived total; before cutoff opens an auction, at/after cutoff returns the private queued-nomination discriminator with binding starter bid and next-rollover identity; quarantine and no-reservation confirmation | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-078` | `GET /api/v1/leagues/:leagueId/auctions/:auctionId` | Context/timing, immutable restricted public Candidate allowlist plus current removal state, per-managed-team bid/capability rows, identity-only commissioner bid projection, every terminal FAD commitment/reveal with optional exact-tie selection, terminal no-winner/fallback-safe detail, and stable player position after provider conflict/source replacement | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-079` | `PUT /api/v1/leagues/:leagueId/auctions/:auctionId/bids/mine` | Exact team row control; AAV-first quarter-increment input and derived total; total-first/AAV-second ranking; server-derived restricted, allocation-linked fallback, direct, or queued open-rapid context; restricted allowlist and active-participant improvement; ordinary starter/nonstarter edit allowance; current edit limit; 75-minute bid-activity cooldown; total/AAV floor; binding confirmation; no manager withdrawal; and immutable idempotent replay | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-080` | `PATCH /api/v1/leagues/:leagueId/auctions/:auctionId/bids/:bidId` | Commissioner/member-admin stable bid administration, AAV-first quarter-increment input and derived total, actual authority attribution, required bid version/idempotency, no value reveal | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-081` | `DELETE /api/v1/leagues/:leagueId/auctions/:auctionId/bids/:bidId` | Exact confirmation, bid `If-Match`/idempotency, no reveal; restricted bid plus participant removal permanent and allocation linked | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-082` | `POST /api/v1/leagues/:leagueId/auctions/:auctionId/cancel` | Exact confirmation, auction `If-Match`/idempotency; restricted cancellation atomically creates FAD correction/recovery and quarantine; nullable fresh or legacy-replayed FAD allocation passes through the current all-null money projector without rewriting its immutable receipt | `M7-26 HELD-STAGING AUTOMATED AND PERSISTED-RECEIPT GATES PASS; AUTHENTICATED HOSTED ROLE SMOKE PENDING (2026-08-21); historical status: STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-083` | `POST /api/v1/leagues/:leagueId/auctions/:auctionId/resolve` | Due-only `202` trigger with version/idempotency; same scheduler/retry service; atomic FAD draw or no-bid result; restricted strict-improvement winner or no-draw league-wide fallback; direct/queued rapid allocation/event/update and recovery remain atomic | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |

---

The FAD-11 status records verified FAD-linked administration and durable
resolution-request boundaries in addition to the ordinary auction contract.
At that checkpoint, it did not claim scheduled FAD resolution or restricted/
fallback activation; those were FAD-12/FAD-13 gates. FAD-12 composes and
verifies restricted and allocation-linked fallback resolution and activation.
FAD-13 composes immediate and queued starts, queued activation, direct/queued
open-rapid resolution, rollover finalization, completion, and the ordinary-
auction handoff.

FAD-06 closure evidence passed `161/161` auction-family tests across `22`
suites in `17` files. It includes hand-schema repository/projection coverage,
fresh-full-migration real repository/service/router GET coverage, exact opaque
cursor paging and response envelopes, own-bid/cross-manager privacy, immutable
restricted allowlist plus removal-state compatibility, terminal player-source
replacement durability, and a SQLite `total_changes` proof that both GET routes
perform no writes.

---

# Part 13 - Target Trade Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-084` | `GET /api/v1/leagues/:leagueId/trades` | Authorized team views, commissioner safe inspection, private proposal isolation | `PLANNED` |
| `T-085` | `POST /api/v1/leagues/:leagueId/trades` | Current proposing-team manager only; fresh standalone retention rejected; historical rows/proposals remain readable and executable/reversible as their state permits; exact completed creation retry replays before fresh grammar; no premature reservation; deadline and ownership validation | `PLANNED` |
| `T-086` | `GET /api/v1/leagues/:leagueId/trades/:tradeId` | Participant or commissioner safe inspection, no cross-team private leakage and no implied write authority | `PLANNED` |
| `T-087` | `POST /api/v1/leagues/:leagueId/trades/:tradeId/accept` | Current receiving-team manager only; full in-transaction revalidation; no-Future-Considerations proposal completes atomically, while one containing Future Considerations persists an acceptance snapshot and moves nothing pending T-148 | `PLANNED` |
| `T-088` | `POST /api/v1/leagues/:leagueId/trades/:tradeId/decline` | Current receiving-team manager only, final state and notification | `PLANNED` |
| `T-089` | `POST /api/v1/leagues/:leagueId/trades/:tradeId/cancel` | Current proposing-team manager only, completed/final-state conflict behavior | `PLANNED` |
| `T-148` | `POST /api/v1/leagues/:leagueId/trades/:tradeId/approve` | Current commissioner or inherited platform administrator; only a receiver-accepted Future-Considerations proposal awaiting approval; full in-transaction revalidation, idempotent replay, and atomic completion | `M7-26 HELD-STAGING AUTOMATED GATE PASS; AUTHENTICATED HOSTED ROLE SMOKE PENDING (2026-08-21)` |

There is no counter endpoint or counter service in the current implementation.
Countering remains planned product scope and is not part of T-084 through T-089
or T-148. A receiver may reject, then independently create a new proposal only
when they are the current manager of that new proposing team.

---

# Part 14 - Target Matchup and Standings Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-090` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks` | Persisted schedule only, season/league match, read-only | `PLANNED` |
| `T-091` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/current` | Server-authoritative week and boundaries, read-only | `PLANNED` |
| `T-092` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId` | Pairings, status, stable IDs, read-only | `PLANNED` |
| `T-093` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId/matchups/:matchupId` | Matchup-period G/A/points/FP from the applicable zero baseline; a late snapshot exposes safe exclusion state and counts no event from a selected player whose NHL game was already underway, including post-baseline events from that game | `PLANNED` |
| `T-094` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/standings` | Finalized results only, approved sorting, no write/rebuild | `PLANNED` |
| `T-095` | `POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-schedules` | Commissioner/member-admin authority, exact explicit NHL/playoff calendar plus `firstWeekStartsAtMs`; `confirmed: false` read-only exact preview; `confirmed: true` season `If-Match`/idempotency and exact `201`; atomically fills an all-null initial/reset calendar or requires an exact later-season match, writes the balanced schedule, and evidence-requeues only the same blocked genuine-inaugural readiness occurrence when that schedule was its missing prerequisite; no fixed-date substitution | `COMPLETE - LOCAL ONLY (2026-07-30); FAD-08 CORRECTIVE COMPOSITION CONTRACT-TESTED LOCALLY` |
| `T-096` | `PATCH /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId` | Commissioner/member-admin exact `shift_week_one` body, Week 1 `If-Match`/idempotency, atomic boundary/job shift; manual movement only before automatic FAD opening, pairing-only actions preserve it, and later whole-Monday late-draft/completion recovery is server-owned rather than a browser override | `COMPLETE - LOCAL ONLY (2026-07-30)` |
| `T-097` | `POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-results/:resultId/corrections` | Normal commissioner/member-admin standings correction: contextual no-write preview beside the affected standings result, then confirmed attributable result version plus rebuilt current standings atomically; after T-145, replacement canonical snapshot/provenance/notification commits in the same transaction or correction rolls back; no League Activity | `COMPLETE - LOCAL ONLY (2026-07-29)` |
| `T-098` | `POST /api/v1/leagues/:leagueId/seasons/:seasonId/standings/rebuilds` | Recovery-only commissioner/member-admin command, absent from normal standings UI; official result versions only, non-final derived snapshots only, never creates or replaces T-145 evidence, no League Activity | `COMPLETE - LOCAL ONLY (2026-07-29)` |
| `T-145` | `POST /api/v1/leagues/:leagueId/seasons/:seasonId/standings/finalizations` | Commissioner/member-admin, season `If-Match`, idempotency, exact result-set hash and typed confirmation; terminal complete sources, immutable final snapshot and links, audit/member notifications/scoped outbox atomic, no League Activity | `COMPLETE - LOCAL ONLY (2026-07-29)` |

---

## T-145 Finalization and Correction Proof

- [x] Exact method/path, season `If-Match`, `Idempotency-Key`, CSRF, JSON
  content type, 64-character lowercase result-set hash, typed confirmation,
  and unknown-field rejection pass.
- [x] Current commissioner and inherited platform administrator with active
  league membership succeed; manager, inactive membership, other league, and
  body-supplied authority fail safely.
- [x] Every regular-season week is terminal and every expected non-bye
  matchup contributes exactly one current official or corrected result
  version.
- [x] Missing, duplicate, pending, void, correction-pending, invalid-total,
  invalid-outcome, wrong-team, cross-season, and cross-league inputs reject
  without writes.
- [x] The submitted canonical result-set hash is recalculated inside the
  transaction; result-version drift rejects with
  `STANDINGS_RESULT_SET_CHANGED`.
- [x] One immutable canonical final snapshot, all participant rows, every
  exact result-version link, rule/hash/count/finalization evidence, one
  succeeded standings operation, and one Security Audit event commit.
- [x] Every active league member receives exactly one deduplicated in-app
  completion notification, inactive or ended members receive none, and the
  scoped outbox contains metadata-only invalidation.
- [x] Exact replay returns the original `201` representation without clock,
  mutable-season, current-version, notification, outbox, operation, or
  snapshot writes; changed-payload replay conflicts.
- [x] Simultaneous fresh finalizations have one winner and no duplicate
  snapshot, row, link, audit, notification, outbox, or idempotency effect.
- [x] Failure injection at every snapshot, row, provenance, operation, audit,
  notification, outbox, season-version, and idempotency seam rolls back the
  complete transaction.
- [x] A legacy `final` row, ordinary `current` snapshot, incomplete
  provenance, wrong hash, stale links, ambiguous canonical designation, or
  missing succeeded T-145 operation never qualifies.
- [x] `T-037` returns `SEASON_ROLLOVER_NOT_READY` for missing, stale, legacy,
  incomplete, or ambiguous finalization evidence and performs no repair,
  rebuild, finalization, or partial rollover write.
- [x] After finalization, T-097 atomically commits the corrected official
  result plus a complete replacement immutable snapshot and provenance, or
  commits neither; every prior result and snapshot remains preserved.
- [x] A correction that changes an official row or rank deduplicates one
  notification per active member; provenance-only replacement sends none.
- [x] T-098 can rebuild non-final derived snapshots but cannot create,
  promote, supersede, or replace the canonical T-145 snapshot.
- [x] T-145, T-097, and T-098 create no League Activity.
- [x] T-037 creates its approved rollover aggregate, per-expired-contract, and
  per-auto-cancelled-trade activity only; it never synthesizes matchup or
  standings activity.

### T-037 Exact Lifecycle-Transition Contract

- [x] The exemption and blocked-scheduled-rollover retry require an `active`
  or `frozen` league and preserve status/freeze; retry accepts current
  commissioner/member-admin authority while the one-time exemption accepts
  member platform-admin authority only. Initial scheduled execution is
  system-job-only and cannot be invoked through a browser command.
- [x] The exemption forbids `If-Match`; retry requires the quoted current
  Entry Draft version, exact failed occurrence identity, and
  `Idempotency-Key`. The scheduled job is idempotent by persisted occurrence
  key, and neither path accepts a calendar, completion time, target override,
  or manual contract-year command.
- [x] Exact replay is evaluated after current authority but before mutable
  lifecycle/clock/version state, returns the original `201`, and writes no
  duplicate result, item, event, activity, audit, notification, or outbox row.
- [x] Exemption replay after FAD consumption still returns the original
  `consumed: false, version: 1`; changed key reuse conflicts.
- [x] Exemption requires exactly one qualifying immutable reset report and the
  exact original bootstrap league/season/activity/idempotency/audit actor and
  timestamp projection for `2026` / `20262027`.
- [x] Exemption requires one active exact current commissioner recipient,
  applies the absent-or-before-derived-help-window rule, writes the explicit
  eleventh FAD Activity and thirteenth FAD notification with exact safe copy,
  destination and deduplication identity, commits only league
  `league.changed/league_changed`, league
  `activity.created/setup_exemption_authorized`, and exact-user
  `notification.created/setup_exemption_authorized`, and never creates or
  opens a FAD or card.
- [x] Rollover requires exactly one completed same-season FAD with matching
  completion marker; every persisted initial or extension FAD rollover,
  allocation, queued/fallback/recovery path, auction/resolution, scoped job,
  matchup/result, and trade satisfies the exact terminal or recovered-failure
  matrices.
- [x] The current finalization is one complete descendant lineage rooted at
  the succeeded regular-completion T-145 operation; every T-097 replacement,
  current result link/hash/count/rule/row/identity, and root is revalidated
  without repair.
- [x] The immutable schema-1 source-readiness projection contains the exact
  closed-set source FAD/finalization lineage plus every validated FAD,
  auction/bid/resolution, matchup/result, operation, job, and trade row in the
  normative order; an unknown operation family fails closed.
- [x] Source-readiness team identities omit only logo bytes, retain null-or-
  exact byte length/SHA, and independently rehash each non-null raw BLOB.
  Canonical JSON parsing and Node SHA-256 recomputation reject reordered,
  duplicate-key, unsafe-number, invalid-Unicode, or hash-mismatched evidence.
- [x] The rollover root's source FAD, lineage-root/current finalization,
  snapshot, and standings-operation IDs exactly match the readiness projection;
  its readiness schema/hash are also bound into the effect-manifest hash and
  exact `201`/replay representation.
- [x] Source and persisted target calendars are canonical, nonoverlapping, and
  not accelerated; the scheduled Entry Draft binds one source season, one
  planned target season, and one immutable rollover occurrence. A mismatched
  draft/occurrence/calendar identity rejects without writes.
- [x] Entry Draft setup, order, pool, picks, and queues may exist before the
  scheduled occurrence, but selection and every trading command remain locked
  until rollover succeeds. Failure persists exact blockers and a retry
  capability without exposing partial contract or season state.
- [x] The total Rostered/Prospect/contract/retention/buyout matrix holds.
  Every affected mutable parent advances version/time exactly once; every
  unversioned year update asserts its exact old predicate and affected count.
- [x] Expiration releases normal and signed-ELC ownership, carryover preserves
  every nonseason ownership field, and qualifying proposed trades cancel once
  with sorted causal asset/item evidence.
- [x] Migration `0029` preserves released ownership UUIDs in auction
  resolutions and FAD allocation/history rows without a live ownership FK,
  while all other table constraints/indexes/triggers/rows remain exact.
  Rollover hashes and removes every display-order entry referencing a carried
  or released ownership before the move/delete and leaves no blocking child.
- [x] The immutable version-1 rollover manifest has one typed item per effect,
  complete contract/retention/buyout year arrays, complete unchanged
  cancelled-trade asset/snapshot arrays, exact event/activity links,
  recomputable payload/root SHA-256, and per-kind totals equal to all nine
  summary counts.
- [x] Idempotency completes last. Failure injection at every state, item,
  event, activity, audit, notification, outbox, root, and completion seam rolls
  back the entire immediate transaction.
- [x] Exact retry replay returns the original durable attempt/result without a
  second effect; a changed occurrence, draft, actor, body, or version conflicts,
  and a race between scheduled execution and retry commits exactly one result.
- [x] Later valid Entry Draft/trade/correction/roster descendants preserve
  historical manifest validity; automatic FAD readiness separately revalidates
  current live structural state rather than demanding historical byte
  equality.

### T-097 Exact Correction Contract

- [x] Preview accepts only `{ "confirmed": false }`, requires no mutation
  headers, returns the exact current result/version projection, and is
  byte-for-byte read-only.
- [x] Apply requires quoted result-aggregate `If-Match`, opaque
  `Idempotency-Key`, exact confirmed scores, optional safe written reason,
  current commissioner or inherited member-administrator authority, and
  rejects unknown fields. Omission records the canonical correction-type
  fallback and remains distinct in the request hash.
- [x] Exact replay returns the original response after current authority but
  before mutable matchup/standings reads, clock, or ID generation; changed-key
  payload conflicts and incomplete evidence fails closed.
- [x] Before canonical finalization, one transaction appends/selects the
  attributable result version, writes exact result-correction operation,
  Security Audit and scoped outbox evidence, completes idempotency last, and
  creates no canonical standings evidence.
- [x] After canonical finalization, the same transaction stages a complete
  replacement generation, supersedes the prior finalization, selects the new
  result version, inserts the replacement finalization, advances the season,
  conditionally notifies members, writes audit/outbox, and completes
  idempotency last.
- [x] Replacement result-version links differ at exactly one matchup and all
  other links, identities, rows, hashes, counts, rule versions, and
  provenance are complete and exact.
- [x] A completed non-current season can receive the same exact replacement
  without changing the current-season pointer or borrowing current-season
  rules; initial T-145 remains current-active-only.
- [x] Official row/rank change creates one deduplicated notification per
  active member; provenance-only change creates none.
- [x] Concurrent corrections have one compare-and-swap winner, and failure
  injection at every late seam commits neither a result correction nor a
  standings replacement.
- [x] Paired matchup/week `correction_required` recovery is restored to
  `final` before replacement links are inserted; mixed state rejects and any
  later failure rolls the paired state back.
- [x] A pre-final exact replay remains null-replacement after later T-145 only
  when the initial final snapshot links that correction or a direct
  descendant; an earlier link rejects omitted replacement evidence.

---

# Part 15 - Target Entry Draft Endpoints

These endpoints are approved in-season work and are not required for the initial Season 2 launch unless the roadmap promotes them.

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-099` | `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId` | Safe configuration/status, league isolation | `PLANNED` |
| `T-100` | `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/order` | One immutable four-round order and fixed finalist positions | `PLANNED` |
| `T-101` | `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligible-players` | Confirmed eligibility snapshot, F/D only, search pagination | `PLANNED` |
| `T-102` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligibility-snapshots` | Commissioner import/preview, versioned pool, no live replacement | `PLANNED` |
| `T-103` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligibility-snapshots/:snapshotId/confirm` | Commissioner, one frozen pool, validation report | `PLANNED` |
| `T-104` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/lottery-runs` | Commissioner, secure randomness evidence, two draws, one immutable result | `PLANNED` |
| `T-105` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/schedule` | Commissioner, confirmed order/pool, persisted start and rollover occurrence; drafting and trading remain locked until scheduled rollover succeeds | `PLANNED` |
| `T-106` | `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/queue` | Manager sees only own team queue | `PLANNED` |
| `T-107` | `PUT /api/v1/leagues/:leagueId/entry-drafts/:draftId/queue` | Own team only, ordered replacement, `If-Match` | `PLANNED` |
| `T-108` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/selections` | On-clock manager, attributable commissioner, or timeout job; immutable selection or confirmed commissioner forfeiture; final terminal pick atomically marks the draft complete and invokes the internal readiness handoff | `PLANNED - M8; FAD-08 INTERNAL HANDOFF PROVEN LOCALLY` |

---

# Part 16 - Target Activity and Notification Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-109` | `GET /api/v1/leagues/:leagueId/activity` | Cursor pagination, approved event types, no matchup/standings entries | `PLANNED` |
| `T-110` | `GET /api/v1/leagues/:leagueId/security-audit` | Approved league-member safe view, protected metadata, read-only | `PLANNED` |
| `T-111` | `GET /api/v1/notifications` | Caller-owned cursor page; `readStatus=all|unread|read` defaults to `all`; listing is strictly read-only | `PLANNED` |
| `T-112` | `POST /api/v1/notifications/:notificationId/read` | Owner only, idempotent read transition | `PLANNED` |
| `T-113` | `POST /api/v1/notifications/read-all` | Caller scope only, bounded update, idempotent | `PLANNED` |
| `T-147` | `POST /api/v1/notifications/read-batch` | Exact 1-100 unique displayed IDs; caller ownership, all-or-none validation, transactionality, and idempotent replay; normal UI sends only after that captured unread batch renders and keeps it visible for the mounted visit | `M7-26 HELD-STAGING AUTOMATED GATE PASS; AUTHENTICATED HOSTED ROLE SMOKE PENDING (2026-08-21)` |

---

# Part 17 - Target Operations, Backup, and Recovery Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-114` | `GET /api/v1/health/live` | Minimal public process liveness, no dependency details | `PLANNED` |
| `T-115` | `GET /api/v1/health/ready` | Minimal readiness, no paths/secrets/private state | `PLANNED` |
| `T-116` | `GET /api/v1/operations/health` | Platform admin, safe build/schema/job/backup details, read-only | `PLANNED` |
| `T-117` | `GET /api/v1/operations/backups` | Platform admin, safe metadata, no raw paths or keys | `PLANNED` |
| `T-118` | `POST /api/v1/operations/backups` | Platform admin, online verified encrypted offsite backup, idempotent job | `PLANNED` |
| `T-119` | `POST /api/v1/operations/restores` | Platform admin plus approved plan, maintenance and pre-restore backup | `PLANNED` |
| `T-120` | `GET /api/v1/operations/restores/:restoreId` | Platform admin, safe status and verification, no artifact access | `PLANNED` |
| `T-121` | `GET /api/v1/leagues/:leagueId/recovery` | Commissioner, safe league context only, read-only | `PLANNED` |
| `T-122` | `POST /api/v1/leagues/:leagueId/backups` | Commissioner request, platform-level artifact hidden, verified status | `PLANNED` |
| `T-123` | `POST /api/v1/leagues/:leagueId/restoration-requests` | Commissioner request only, awaiting administrator approval, no mutation | `PLANNED` |
| `T-124` | `POST /api/v1/leagues/:leagueId/recovery/actions` | Commissioner approved action allowlist, explicit correction/audit boundaries | `PLANNED` |

---

# Part 18 - Target Free Agent Draft Endpoints

All FAD routes are launch-critical and were initially recorded as `PLANNED`;
the tables now retain evidence-backed current statuses.

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-126` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/navigation` | Always-safe current descriptor, multiple managed teams, optional exact season/team roster link, urgency priority, no competitor details, read-only | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-127` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/readiness?seasonId=:seasonId` | Commissioner-only operation plus latest immutable completed-attempt projection, selected and adjusted Week 1 before/after, adaptive clocks, exact three-field public diagnostics, no preflight/preview/retry/schedule/job/card write | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-128` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/readiness/retries` | Commissioner, exact blocked readiness operation `If-Match`/idempotency/confirmation; atomically resets the same job cleanly to pending, records one immutable receipt, advances blocked readiness one version without incrementing its attempt count, accepts no opening or schedule override, and exact replay always returns the stored receipt without writes | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-129` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId` | Viewer-filtered manager/commissioner/member overview, no pre-deadline side channel | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-130` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/private` | Exact team manager or active exact-card help authority, manager-first dual-role precedence, exact 22-slot private DTO, deadline-processing read-only mode, no-store, unauthorized/cross-scope `404`, byte and semantic no-write proof | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-131` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards` | Active member after publication; paginated exact league/season/FAD/team identity, team, lifecycle, and `{ signed, notWon, tied }` counts only; no money, card, slot, cap, editor, conflict, intervention, descriptor, resource ID, or pre-deadline access | `M7-26 HELD-STAGING AUTOMATED GATE PASS; AUTHENTICATED HOSTED ROLE SMOKE PENDING (2026-08-21); historical status: STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-132` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/history` | Legacy compatibility path after publication; exact selected-team identities/team plus final `results[]`, each row exactly player/status/nullable offer/nullable actionable tie-auction ID; no complete-card or audit exposure, and normal UI redirects to team-scoped T-140 results | `M7-26 HELD-STAGING AUTOMATED GATE PASS; AUTHENTICATED HOSTED ROLE SMOKE PENDING (2026-08-21); historical status: STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-133` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/eligible-players` | Authorized private editor; exact slot/search grammar, 200-code-point normalized search, deterministic order and exact-card/filter-bound cursor, no other-card nomination signal | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-134` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/revision-previews` | Authorized editor, exact add/edit/move/remove projection, ignored concurrency/idempotency headers, byte/table-hash/side-effect read-only proof | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-135` | `PUT /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/slots/:slotKey/candidate` | Exact card `If-Match`/idempotency, authority-before-replay, AAV-first quarter-increment player/slot/contract validation, derived total, hard whole-card cap rejection, original `201` replay | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-136` | `PATCH /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId` | Candidate only, authority-before-replay, card `If-Match`, AAV-first quarter-increment contract plus hard whole-card cap rejection, carryover locked, safe entry `404` | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-137` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId/move` | Candidate or compatible carryover, authority-before-replay, compatible open slot, Bench rules, card `If-Match`, atomic card revision plus authoritative roster movement for a carryover | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-138` | `DELETE /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId` | Candidate only, authority-before-replay, carryover denied, card `If-Match`, idempotency, no body, safe entry `404` | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-139` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/help-requests` | Manager adaptive help boundary; normalized optional 500-code-point message, authority-before-replay, exact-card grant, immutable command result/private message, notification/audience atomic, fresh/existing `201`/`200` fidelity | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-140` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/results?teamId=:teamId` | Active member after publication; exact required `teamId` plus bounded search/status/page grammar; final rows exactly player, Signed/Not won/Tied status, nullable complete selected-team-manager offer, and nullable manager-actionable tie-auction ID; pending/correction-required rows and every rank/winner/participant/draw/cap/card/audit field are omitted; commissioner/admin role alone does not widen; read-only | `M7-26 HELD-STAGING AUTOMATED GATE PASS; AUTHENTICATED HOSTED MANAGER-TRANSFER ROLE SMOKE PENDING (2026-08-21); historical status: STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-141` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/recovery` | Commissioner-safe jobs/allocations/initial and extension rollovers/queued/fallback/schedule-recovery state, no current blind bid or unrelated private content | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-142` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/recovery/actions` | Commissioner allowlisted retry only, same service/occurrence, no winner/participant/timing/Week 1 override; `recover_schedule` is absent/rejected and only `complete_fad` may commit the atomic server-owned overrun recovery | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-143` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/allocations/:allocationId/correction-previews` | Commissioner locked-snapshot recomputation from complete internal money, complete downstream delta, table-hash read-only proof, and externally redacted all-null offer/winner/restricted/fallback/delta money; correction authority alone does not reveal values, and both complete-money and partial-null public tuples fail closed | `M7-26 HELD-STAGING AUTOMATED GATE PASS; AUTHENTICATED HOSTED ROLE SMOKE PENDING (2026-08-21); historical status: STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-144` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/allocations/:allocationId/corrections` | Commissioner reason/confirmation/fingerprint/`If-Match`, deterministic atomic reconciliation using complete internal money, original retained, and externally redacted all-null offer/winner/restricted/fallback/delta money on fresh return and replay; correction authority alone does not reveal values, and both complete-money and partial-null public tuples fail closed | `M7-26 HELD-STAGING AUTOMATED AND PERSISTED-RECEIPT GATES PASS; AUTHENTICATED HOSTED ROLE SMOKE PENDING (2026-08-21); historical status: STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |
| `T-146` | `PUT /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId` | Authorized private editor; exact canonical 22-slot AAV-first body, derived totals, quarter/minimum/Bench validation, hard authoritative cap rejection, one card `If-Match` and idempotency intent, atomic whole-card replacement, nullable incomplete Candidate contract fields, server-owned carryover preservation, one version/revision advance, and no partial writes | `STAGING VERIFIED - HL-20260818-1 (2026-08-18)` |

### FAD-17 Local Verification Record - 2026-08-11

The former FAD-17 `LOCAL VERIFIED` status was backed by exact Node.js `24.14.1`
disposable-local evidence:
`28/28` schema-22-to-49, fresh-schema, repository-catalog, reset/cutover, and
real two-league fixture tests; `49/49` affected resolution service, real SQLite
writer, and durable-job tests; and `202/202` representative mandatory-package
policy, writer, late-lock, and ordinary-auction compatibility tests. All three
gates have zero failure, cancellation, and skip. The real two-league Playwright
release matrix passes `40/40` across five desktop/mobile Chromium, Firefox, and
WebKit projects with zero retries. GET and preview no-write proofs, no-bid later
renomination, simultaneous unreserved aggregate wins, distinct Week 1/help
chronology, disabled/nonblocking video, cross-league privacy, reconnect, and
recovery are included. That local evidence alone did not claim a shared-
staging or production deployment; the later FAD-18 evidence recorded at the
top of this checklist raised the listed rows to `STAGING VERIFIED`.

### 2026-07-29 FAD Decision-Package Endpoint Proof

- [x] The internal readiness-handoff primitive requires the caller's active
  transaction. Caller rollback or either pair-write failure leaves no
  operation/job; exact trigger replay creates one pair; mismatched source
  evidence fails closed; route inventory contains no Entry Draft `/complete`
  or public handoff route.
- [x] A simulated future final T-108 selection/confirmed-forfeiture transaction
  commits the terminal pick, Entry Draft `Complete` state, and exact
  `entry_draft_completed` pair together. The real T-108 endpoint/UI remains M8
  `PLANNED` and is not falsely counted as FAD-08 implementation.
- [x] Ordinary-inaugural T-036 and initial-Season-2 T-037 create only their
  exact readiness pair in their own transaction; reset-origin T-036 activates
  without a pair. Confirmed T-095 creates no new trigger and
  evidence-requeues only the same blocked/failed genuine-inaugural pair;
  absent, pending, running, or succeeded state is a no-op, split state rolls
  T-095 back, and exact replay writes nothing.
- [x] Automatic readiness is triggered only by committed Entry Draft or
  approved no-draft evidence. Success creates one FAD, every team/card,
  carryover projection, initial seven rollovers, and jobs atomically; any
  blocker creates none of them.
- [x] `T-127` is byte-for-byte read-only, reads the operation plus latest
  immutable completed attempt, and returns its blockers, warnings, selected
  Week 1, adjusted Week 1, adaptive clock, and current retry capability without
  evaluating readiness. There is no readiness-preview route.
- [x] Every T-127 blocker and warning is exactly public `{code, message,
  resourceId}`. The operation's persistence-only blocker mirror remains
  exactly `{code, field, resourceType, resourceId, message}` and never exposes
  `field` or `resourceType` through T-127.
- [x] Every completed readiness worker attempt commits one immutable,
  canonically hashed blocked or succeeded attempt for its exact operation/job/
  attempt/version. A real retry that returns identical blockers creates a new
  attempt; stale attempt or operation evidence fails closed.
- [x] Fresh pending, blocked-retry, and expired-running readiness claims update
  the canonical job and operation in one transaction. Counts advance together,
  except an expired-running handoff preserves both counts and original start
  times; a live lease cannot be replaced, reclaim requires a fresh fencing
  token, injected failure rolls both writes back, and no separate completed-
  attempt row is invented for the abandoned lease.
- [x] `T-128` reuses the blocked occurrence, accepts no setup path, time,
  reason, team subset, or schedule field, resets the same canonical job cleanly
  to `pending`, leaves attempt count unchanged, advances blocked readiness
  exactly one version, and records one immutable receipt in one transaction.
  It creates no duplicate FAD, rollover, card, notification, outbox, or job on
  replay or concurrency; exact replay is write-free and always returns the
  stored receipt after later blocking or success.
- [x] Repeated blocked attempts notify the same current commissioner once per
  season/operation/commissioner; a later replacement commissioner receives one
  notification under that replacement user's distinct deduplication key.
- [x] Migration verification covers fresh `1 -> 31` and exact `30 -> 31`, pins
  migration `0031` at `46,693` bytes and SHA-256
  `f2c5104f2eb06e261cc902067bd4623b841f2c37a04f73d27487863077b2662a`,
  preserves frozen migration `0030`, and reproduces the exact schema-31 table,
  catalog, reset-policy, and delete-guard inventory.
- [x] Additive migration `0032` leaves migrations `0030` and `0031` unchanged,
  is pinned at `27,882` bytes with SHA-256
  `ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`,
  creates no table or index, retains that inventory, adds only the job-side
  reclaim guard, replaces only the readiness forward-update trigger, and passes
  fresh `1 -> 32` plus exact `31 -> 32` expired-lease-handoff verification.
- [x] Additive migration `0033` leaves migrations `0030` through `0032`
  unchanged, adds only immutable
  `free_agent_draft_readiness_corrective_requeues` evidence and its exact
  job/readiness guards, and passes fresh plus exact `32 -> 33` verification.
  Same-league source/result/generation, prior/resulting versions, unchanged
  attempt/blockers, uniqueness, immutability, every write seam, and exact
  replay are proved.
- [x] Index-only migration `0034` leaves every earlier migration identity,
  application row, table, trigger, view, catalog/reset-policy count, and delete
  guard unchanged; fresh `1 -> 34` and exact `33 -> 34` advance both schema
  version authorities, preserve integrity and foreign keys, verify the exact
  three index definitions including order and partial predicates, and prove
  the real T-133 release, re-entry, and recovery query plans use them without
  a temporary ordered-release sort.
- [x] Additive migration
  `0035_add_candidate_card_help_command_results.sql` is pinned at `10,981`
  bytes with SHA-256
  `cbbaf5322c111f3d13659cf6adc1a5046c8b49ba0ab84c3541d770a1dae3b669`;
  immutable T-139 created/already-active evidence and exact original status/
  response replay pass while migrations `0030` through `0034` remain unchanged.
- [x] Additive migration
  `0036_add_fad_eligibility_revalidation_occurrences.sql` is pinned at `22,871`
  bytes with SHA-256
  `1351e25758d7192ab804214f0abeb696a9b0a9b3509e81dcd276ac7570fbb1f6`.
  Fresh `1 -> 36` and exact `35 -> 36` reproduce `129` application tables,
  `130` including the ledger, `129` catalog entries, `47` require-empty tables,
  `82` signed-policy tables, and `69` delete guards with integrity and foreign
  keys clean. Exact semantic evidence, pending-job and global
  `player_catalog_applied` sealing, immutability, and the deadline terminal-job
  barrier pass.
- [x] Additive migration `0037_allow_atomic_fad_deadline_allocations.sql` is
  pinned at `4,142` bytes with SHA-256
  `33b8e7c3479f9a3dc64011a29ced6421a5cc59eca62da8b8144cf82b1d0d80b3`.
  Fresh and exact-upgrade proof permits only the deadline-owned pending
  allocation insert under the live claimed `fad_deadline` occurrence
  while the FAD remains `cards_open`; fabricated, stale, or unrelated writes
  remain rejected.
- [x] Additive migration
  `0038_allow_pre_fad12_restricted_scheduling.sql` is pinned at `17,157` bytes
  with SHA-256
  `b4567d087b31ff70dfa2776f2a15e6d22e182600d3dd5e5446a169bb64bb5ac5`.
  Fresh and exact-upgrade proof preserves exact Candidate ties as
  `restricted_scheduled` for the next complete rapid rollover, rejects
  mismatched or past-due scheduling, and leaves ordinary-auction behavior
  unchanged. Schema `38` retains `129` application tables, `130` including the
  ledger, `129` catalog entries, `47` require-empty tables, `82` signed-policy
  tables, and `69` delete guards.
- [x] Additive migration `0039_add_fad_recovery_correction_evidence.sql` is
  pinned at `201,713` bytes with SHA-256
  `a176479f3eb3fc1183c595a68026a2e5b73d6b975b66b6bcab5de4954945ae6f`.
  Fresh and exact-upgrade proof covers immutable T-142/T-144 results,
  recovery/correction causality, queue acceptance, replay, and rollback.
- [x] Additive migration
  `0040_allow_atomic_fad_restricted_fallback_overlap.sql` is pinned at `9,449`
  bytes with SHA-256
  `cff71c33b628504d38b53cfe1621363740791c119c5b214d7d11e10f216a5a92`.
  Schema `40` was the FAD-11 local target with `131` application tables, `132`
  including the ledger, and `131` catalog entries; only the exact transaction-
  bound restricted-source/fallback overlap and complete target window are
  admitted.
- [x] Additive migration
  `0041_allow_fad_auction_resolution_recovery_resume.sql` is pinned at `35,525`
  bytes with SHA-256
  `00d6926934d46089df6581a8c3edc296394ce57958155e36da7d15b2be61111b`.
  Exact causal recovery, failed auction, private draw, canonical job, retry
  receipt, and failure evidence are required before a restricted or allocation-
  linked fallback allocation can resume for T-142 auction-resolution retry.
- [x] Additive migration
  `0042_use_current_aav_for_restricted_participant_floor.sql` is pinned at
  `9,326` bytes with SHA-256
  `4269c4a0c320364b65d20c01b167ff8738f1a67c7e4d52160e6e2245e201e537`.
  Restricted participant improvements use the current rounded AAV for their
  equal-total floor check while preserving the immutable lowest-offered AAV.
- [x] Additive migration
  `0043_allow_repeat_fad_auction_resolution_recovery.sql` is pinned at `92,011`
  bytes with SHA-256
  `1623d40ffaa477e3ba0be6bdd7c831f3d16489b53e4befc03eb7aa0e6efa6ae3`.
  Latest matching failure evidence permits exact repeat terminal failure,
  T-142 resume, delayed fallback, and system-owned semantic recovery resolution
  without weakening commissioner recovery or ordinary-auction guards. Schema
  `43` was the FAD-12 local target with `131` application tables, `132`
  including the ledger, and `131` catalog entries.
- [x] Late Entry Draft readiness advances Week 1 by one or more whole
  league-local Mondays to the earliest valid start with a strictly future
  Candidate deadline and complete seven-day FAD period. Remaining pairings,
  byes, and unexecuted jobs change in the same transaction; NHL-season end and
  playoff weeks do not.

FAD-08 local evidence recorded on `2026-08-08`: the behavior selection passed
`336/336` and the schema selection passed `64/64`, with no failure or skip.
The repository, service, router, target-runtime, worker, handoff, and migration
tests use disposable databases; T-126/T-127/T-129 prove no-write reads, and
T-128 proves original-data/current-request replay with unchanged database bytes
after terminal readiness success. There was no frontend caller or staging
deployment at that historical checkpoint, and production remained untouched.

### 2026-08-08 FAD-09 Internal Candidate Foundation Evidence

- [x] The internal T-130 repository/service/runtime path resolves hidden scope,
  returns the exact 22-slot private card, enforces manager-first or active
  exact-card help authority, remains read-only during deadline processing, and
  passes cross-team/cross-league plus byte/semantic no-write cases.
- [x] The internal T-133 path implements exact normalized search and card/
  filter-bound paging, excludes all same-league ownership, contract, release,
  allocation, recovery, and active-auction signals without revealing another
  card, and permits re-entry only through a later confirmed exact-event
  `rights_release_reentry`; a later release blocks again.
- [x] The internal T-134 path projects all four actions from an unchanged base,
  uses a deterministic non-persisted add identity, disables every capability
  with `PREVIEW_ONLY`, projects retained-AAV carryover moves, returns the closed
  diagnostic order, remains readable during freeze, and proves unchanged
  bytes, rows, SQLite change count, and side effects.
- [x] The Candidate repository gate passes `30/30`, Candidate service `16/16`,
  preview policy `5/5`, composed-runtime assertions `2/2`, and schema-34
  migration/initial-schema gate `10/10`. At this internal foundation
  checkpoint the endpoint inventory remained exactly `102`; T-130/T-133/T-134
  had no routes yet.

### 2026-08-08 FAD-09 Local Closure Evidence

The provider occurrence/job/deadline selection passes `60/60`, the complete
summer-writer selection passes `262/262`, direct Candidate HTTP passes `36/36`,
composed runtime passes `66/66`, the local staging verifier passes `9/9`, and
reset bootstrap passes `8/8`, with no failure or skip. T-130 and T-133 through
T-139 are composed and contract-tested locally, and the target endpoint
inventory is exactly `110`. There was no frontend caller or shared-staging
deployment or verification at that historical checkpoint, and production
remained untouched.

- [x] `T-130` returns the exact private Candidate root and 22 ordered slots,
  manager-first authorization evidence, safe player/editor/help/intervention
  projections, current cap/completeness and exact capabilities. Manager,
  dual-role, active-help, former-manager, expired-help, cross-team, and two-
  league cases prove no private side channel and no database or side effect.
- [x] At the deadline before publication, `T-130` returns
  `deadline_processing`/`private_read_only` with denied mutations; `T-133`
  through `T-138` return `FAD_DEADLINE_PASSED`, and `T-139` returns
  `FAD_HELP_WINDOW_CLOSED`. All private Candidate paths return
  `FAD_PHASE_CONFLICT` after publication.
- [x] `T-133` rejects unknown/duplicate/malformed query, over-200-code-point
  search, overlong or malformed cursor, and stale/cross-filter/cross-slot/cross-
  card cursor. Valid search collapses whitespace, trims and matches lowercase,
  orders normalized name then ID, returns only eligible players, and never
  reveals a competing card or offer.
- [x] `T-134` ignores `If-Match` and `Idempotency-Key`, returns the exact
  projected card/slot and warnings, and proves unchanged bytes, table hashes,
  SQLite change count, revisions, idempotency, notification, audit, and outbox.
  Add uses a deterministic non-persisted preview-only UUID; projected version
  is exactly one greater than the unchanged base version, every projected
  capability is denied with `PREVIEW_ONLY`, move returns its destination slot,
  remove returns null, and
  exact diagnostics are deduplicated and sorted. An authorized preview remains
  available during a league freeze.
- [x] `T-135` through `T-138` accept only the exact quoted positive card
  version and bounded control-free key, revalidate authority before replay,
  then replay before later phase/version/resource/business checks. Exact replay
  preserves original `201` or `200` and representation after later changes;
  changed intent conflicts, and former managers/expired help cannot replay.
- [x] Candidate add/edit/move/remove and compatible carryover movement return
  the complete authoritative card. Carryover removal/identity/contract changes
  remain denied; carryover movement updates its authoritative roster position
  atomically. Missing and cross-scope entries share
  `CANDIDATE_CARD_ENTRY_NOT_FOUND`; stale writes expose only current version
  plus `refetch: true`.
- [x] `T-139` accepts `{}`, explicit null, whitespace-only-to-null, and a
  trimmed control-free message through 500 Unicode code points; all malformed,
  unknown, control-character, and overlong forms fail without effects. Fresh
  creation atomically persists the request/grant/result/private audit/current-
  commissioner notification/outbox; a new key for the existing active request
  returns `200` without mutation, and exact replay retains its original status.
- [x] Every summer ownership, contract, prospect-right, effective-position,
  and active-state writer synchronizes affected cards in its own transaction or
  rolls back. Provider bulk changes create one exact semantic player/open-FAD/
  source-operation occurrence plus pending shared-lease job, sealed by the
  global `player_catalog_applied` event; presentation-only and masked changes
  create none. Shared execution deduplicates/restarts safely, and final deadline
  reconciliation performs one all-card sync, consumes observed nonterminal jobs
  as `skipped` with `deadline_reconciled`, fences stale workers, and cannot be
  bypassed by deadline locking.

### 2026-08-09 FAD-10 Local Closure Evidence

The exact FAD-10 closure matrix passes `200/200` tests across `23` suites.
Separate recorded gates pass `4/4` composed-runtime tests, `18/18` allocation-
coordinator tests, `103/103` shared-auction regression tests, and `7/7` post-
amendment deadline-reminder tests. These counts are separate evidence, not one
combined aggregate. The local target endpoint inventory is exactly `113`.

- [x] The reminder resolves the current manager/team recipients at execution,
  deduplicates each occurrence, commits notification/outbox/job state
  atomically, and creates no overdue reminder.
- [x] The deadline performs final eligibility reconciliation, locks and
  revisions every card, expires help, seals every immutable 22-slot snapshot,
  creates every distinct-player allocation and durable job, changes the root
  to `deadline_locked`, and publishes all teams or none in one transaction.
- [x] T-131 and T-132 enforce publication and active-league membership,
  project only their exact selected-team summary/result DTOs, paginate where
  specified, and prove read-only behavior. Team-required T-140 omits pending
  and `correction_required` allocations and exposes only exact final result
  rows; no card, slot, decision, winner, rank, resolution, recovery, draw, cap,
  or audit field crosses the public boundary.
- [x] Each player resolves independently to an exact requested-slot award,
  scheduled/quarantined exact tie, unclaimed outcome, or explicit
  `correction_required` recovery. Semantic ownership, contract, auction, slot,
  and destination races cannot silently award or move the player, and one
  player's failure does not roll back another result.
- [x] One scheduler cycle runs allocation coordinator -> per-player allocation
  -> allocation coordinator before ordinary auction resolution. The first
  coordinator moves `deadline_locked` to `allocating`, or directly to `rapid`
  for zero allocations; the second moves `allocating` to `rapid` only after no
  pending allocation remains and writes one aggregate result notification per
  current manager/team pair.
- [x] At FAD-10 closure, exact Candidate ties could not activate before the
  future restricted-auction privacy/activation gate, FAD-linked T-080 through
  T-083 remained fail-closed for FAD-11, and T-141 through T-144 remained
  planned.

There was no frontend caller at this historical checkpoint. Shared staging was not
deployed, migrated, or verified, and production was not opened or changed.

### 2026-08-10 FAD-11 Local Closure Evidence

T-141 through T-144 and the FAD-linked T-080 through T-083 administration and
durable-request contracts are composed and contract-tested locally. The shared
transaction-owned restricted no-improvement fallback is verified for immediate
and delayed full-window outcomes, lease/recovery fencing, replay, privacy-safe
publication timing, same-millisecond collision isolation, and rollback. The
local target endpoint inventory remains exactly `117`.

Separate gates pass `197/197` broader recovery/correction/administration,
`96/96` schema/runtime, `62/62` ordinary-auction compatibility, and `40/40`
complete administration-repository tests on exact Node.js `24.14.1`. At that
checkpoint, scheduled FAD resolution and restricted/fallback activation
remained FAD-12/FAD-13 work. There was no frontend caller; shared staging and
production were not opened, migrated, deployed, or verified.

### 2026-08-10 FAD-12 Local Closure Evidence

FAD-12 composes server-derived restricted and allocation-linked fallback
manager bidding, immutable idempotent replay, read/edit-limit projection,
resolution, durable recovery, activation, and scheduler execution. It preserves
the ordinary auction request hash, policy, resolver, and administration paths.
The local target endpoint inventory remains exactly `117`.

Separate gates pass `52/52` resolver policy/persistence/shared fallback,
`15/15` application service/durable runner, `71/71` activation/job repository,
`50/50` bid/HTTP-boundary/auction-read capability across six suites, `170/170`
ordinary-auction/administration compatibility, `303/303` schema-43/current-
head, and `94/94` final scheduler/runtime/deployment/ordinary compatibility on
exact Node.js `24.14.1`. The `94/94` gate partitions as scheduler `6`, composed
T-083 runtime `1`, FAD ordinary compatibility `3`, ordinary resolver and job
`17`, target runtime `36`, and target deployment `31`.

The awaited scheduler order was FAD resolution -> restricted activation ->
fallback activation -> ordinary resolution -> FAD completion. At that
checkpoint, direct and queued open-rapid resolution, extension scheduling, and
completion recovery remained FAD-13 work. No frontend, shared staging, or
production environment was opened, migrated, deployed, or changed.

### 2026-08-10 FAD-13 Local Closure Evidence

T-077 immediate/private-queued creation, T-079 direct/queued open-rapid bidding,
and T-083 durable request plus scheduled direct/queued resolution are composed
and contract-tested locally. Queued activation opens the binding starter at the
exact rollover for a full following cycle. Rollover finalization ensures
canonical jobs before shared due/claim/lease/reclaim execution. Completion and
whole-Monday Week 1 recovery remain atomic, matchup start revalidates
completion, and ordinary auctions require both season start and FAD completion.
The local target endpoint inventory remains exactly `117` on schema `47`.

Separate, overlapping Node.js `24.14.1` milestones pass `11/11` start-decision
policy, `10/10` immediate-start writer, `23/23` FAD start/lifecycle, `12/12`
ordinary creation compatibility, `125/125` queued activation, `22/22` focused
allocation-null resolution writer, `18/18` focused resolution service/runner,
`73/73` broader allocation-null resolution, and `122/122` bid/read
compatibility. Final gates pass `280/280` schema-47/current-head, `42/42`
rollover policy/writer/service/runner, `31/31` completion, `77/77` runtime
composition, and `15/15` matchup-start guard tests. The supporting canonical
writer-to-shared-JobRepository integration passes `1/1`, the rollover writer
passes `13/13`, and the shared JobRepository passes `28/28`. These records are
not added into one aggregate total.

Migrations `0023` through `0047` remain local only at this historical FAD-13
checkpoint. No frontend, shared staging, or production environment was opened,
migrated, deployed, or changed.

### 2026-08-11 FAD-14 Local Closure Evidence

The exact eleven-type Activity and thirteen-type notification registries, four
Candidate Card opening publications, canonical envelopes whose `related`
object contains exactly `fadId`, `teamId`, `cardId`, `allocationId`,
`auctionId`, `recoveryId`, `nominationQueueId`, and
`scheduleRecoveryOperationId`, audience privacy, reconnect reauthorization,
and setup-exemption exact current-commissioner three-publication contract are
composed and contract-tested locally. `T-037` is contract-tested locally, and
the target endpoint inventory remains exactly `117`.

- [x] `0048_require_canonical_fad_realtime_evidence.sql` is pinned at `73,524`
  bytes, `1,490` lines, and SHA-256
  `c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`;
  schema `48` is the preserved intermediate realtime checkpoint.
- [x] `0049_require_canonical_fad_setup_exemption_publications.sql` is pinned
  at `29,571` bytes, `748` lines, and SHA-256
  `5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`;
  schema `49` was the FAD-14 local target with `131` application tables, `132`
  including the ledger, and `131` repository-catalog entries.
- [x] Focused FAD-14 core passes `1,294/1,294` across `142` suites and `110`
  unique files; production JavaScript syntax passes `95/95`; schema-49 pin,
  runtime, reset, release, and staging-verifier selection passes `265/265`; and
  former-failure consolidation passes `189/189` on pinned Node.js `24.14.1`.
- [x] The authoritative full backend gate records `3,266` tests across `436`
  suites: `3,264` passed, zero failed, cancelled, or todo, and two intentional
  Windows link-capability skips (`symlink` and `target`) in
  `sportsDataIoLiveCapabilityArtifactFoundation.test.js`, in about
  `30m03.603s`.

Migrations `0023` through `0049` remained local only at this historical FAD-14
checkpoint. No FAD frontend, shared staging, or production environment was
opened, migrated, deployed, or changed at that checkpoint.

- [x] `T-139` accepts before neither opening nor `helpOpensAtMs`, accepts
  exactly at that instant, and expires exactly at deadline. Opening with less
  than 48 hours remaining sets `helpOpensAtMs = openedAtMs`.
- [x] Composed Candidate/help JSON bodies enforce the exact `16 KiB` boundary,
  and their shared limiter enforces both per-session and per-league ceilings
  with isolated windows and no-write `429`: `fad_candidate_write` is
  `120`/session and `600`/league per 15 elapsed minutes, and `fad_help_write`
  is `5`/session and `25`/league per 60 elapsed minutes. The shared policy also
  configures `fad_operational_write` at `30`/session and `120`/league per 15
  elapsed minutes; HTTP composition remains part of each planned operational
  endpoint's own gate.
- [x] Candidate preview and mutation endpoints return the signed whole-card
  cap projection but do not reject an otherwise valid edit merely for being
  over cap. Deadline evidence excludes all new offers on an over-cap card and
  retains individually valid offers from an incomplete cap-compliant card.
- [x] Immediately after publication, T-131 counts only durable final outcomes
  and T-132/T-140 omit pending and `correction_required` allocations. Processed
  public rows derive Signed/Not won/Tied from immutable internal evidence but
  contain exactly player, status, nullable offer, and nullable manager-
  actionable tie-auction ID; fallback winner, draw, snapshot, rank, and other
  audit evidence remain internal.
- [x] `T-077` returns only `auction_opened` before the cutoff and only
  `nomination_queued` exactly at or after it before rollover. The queued DTO is
  private to the nominating team/recovery authority and binds the opening bid,
  opening rollover, following resolution rollover, and no-reservation
  confirmation. A cross-team collision with a private queue returns only the
  generic `FAD_ALLOCATION_QUARANTINED` shape and reveals no queue, team,
  player, bid, or timing cause.
- [x] `T-079` enforces ordinary starter/non-starter limits for open rapid; a
  restricted Candidate minimum creates no bid, edit count, or cooldown, while
  a participant's strict opening improvement receives the ordinary
  joining-team one-edit allowance and 75-minute bid-activity cooldown; manager
  withdrawal remains prohibited and the total-first/AAV-second floor covers
  cross-term cases.
- [x] `T-083`, scheduler, and recovery invoke one resolver. Restricted
  resolution requires a current eligible strict improvement; otherwise it
  records no winner/no draw and creates one fresh league-wide fallback with no
  leader. Open no-bid resolution returns the player to the unclaimed pool.
- [x] An exact top FAD tie records one committed/revealed auditable
  equal-chance draw and stable replay. The same values in an ordinary weekly
  auction produce the unchanged ordinary tie result. Every other semantic
  terminal FAD auction also reveals its original commitment; non-tied,
  no-bid, and no-improvement outcomes use `selectionUsed = false` with no
  selected bid/team and remain verifiable through T-078/operational evidence,
  never the four-key T-140 selected-team result row.
- [x] Resolution never asks for a second illegality confirmation. Concurrent
  bids reserve no cap, position, or roster capacity, and every otherwise-valid
  winner commits even when aggregate wins make the roster illegal.
- [x] FAD completion requires every active, pending, queued, fallback, delayed,
  and recovery path terminal. Completion at or after Week 1 moves Week 1 to
  the first valid Monday strictly after completion and atomically regenerates
  remaining schedule/jobs before the completion marker, activity,
  notifications, and outbox publish.
- [x] Completion recovery preserves locked cards, historical deadlines and
  rollover instants, bids, draws, allocations, and completed results. No valid
  pre-playoff Monday, injected failure, restart, replay, or matchup-start race
  leaves a moved schedule without FAD completion or completion with stale Week
  1.
- [x] `T-142` rejects or omits `recover_schedule`; schedule-recovery evidence
  cannot commit independently and appears only when `complete_fad` also commits
  completed FAD state, both completion timestamps, the schedule version, and
  replacement jobs in that same transaction.
- [x] Incomplete or illegal rosters do not trigger schedule movement; only
  unfinished FAD processing does.

---

# Part 19 - Cross-Cutting Contract Matrices

## Authentication Matrix

For each authorization class:

| Class | Required checks |
| --- | --- |
| Public | Rate limit where applicable, generic errors, no private data, Origin policy where applicable |
| Authenticated | Missing, expired, replaced, revoked, deactivated, and valid session |
| League member | No membership, inactive membership, other league, active membership |
| Team manager | Wrong team, ended assignment, commissioner without team control, correct assignment |
| Commissioner | Other league, inactive commissioner, permitted operation, manager-only boundary |
| Platform administrator | Normal user denied, active admin allowed, league membership still required for internal league operation |
| System job | No browser invocation, occurrence identity, lease, idempotency, recovery authority |

---

## League-Isolation Matrix

Every private league endpoint uses at least two fixture leagues with:

* the same team display name;
* the same player pool;
* overlapping user display names;
* similar contracts and transactions;
* different stable IDs.

Tests attempt:

- [ ] League A session with League B URL.
- [ ] League A resource ID under League B URL.
- [ ] Team A ID under League B.
- [ ] Season A ID under League B.
- [ ] Guessable and malformed IDs.
- [ ] Body-supplied League A ID with League B URL.
- [ ] Socket room subscription to League B.
- [ ] notification or request ID owned by another user.

Private-resource probing returns the approved `404` without disclosing existence.

---

## Response Matrix

Every target response proves:

- [ ] `camelCase`.
- [ ] integer cents for money.
- [ ] integer hundredths for persisted fantasy points.
- [ ] epoch milliseconds for instants.
- [ ] stable opaque IDs.
- [ ] `data` plus safe `meta` success envelope.
- [ ] stable error code, safe message, optional safe details, and request ID.
- [ ] no credential hashes or account-action tokens.
- [ ] no internal paths or stack traces.
- [ ] no active competing auction-bid values.
- [ ] correct `Cache-Control`.
- [ ] cursor pagination where catalogued.

---

## Concurrency Matrix

Applicable endpoints test:

- [ ] Two writers using the same version.
- [ ] Stale `If-Match`.
- [ ] Same idempotency key and same payload.
- [ ] Same idempotency key and different payload.
- [ ] Duplicate request after response loss.
- [ ] Concurrent auction resolution.
- [ ] Concurrent trade acceptance for overlapping assets.
- [ ] Concurrent job lease acquisition.
- [ ] Transaction rollback before outbox commit.
- [ ] Socket.IO event count after commit and rollback.

---

# Part 20 - Feature Completion Gate

## Ready for Frontend

An endpoint may be marked `FRONTEND CONNECTED` only when:

* service and repository behavior is implemented;
* contract tests pass;
* authorization and two-league isolation pass;
* error codes are stable;
* response projection is approved;
* frontend HTTP client uses the target path;
* frontend does not reproduce authorization or authoritative calculations;
* compatibility rollback remains available.

---

## Ready for Staging

An endpoint may be marked `STAGING VERIFIED` only when:

* exact backend and frontend deploy IDs are recorded;
* real deployed CORS, cookies, CSRF, and Socket.IO pass;
* staging database and environment identity are correct;
* two-league tests pass;
* affected Playwright workflow passes;
* provider, email, job, backup, or recovery integration passes when applicable;
* no production resource is reachable.

---

## Ready for Production

An endpoint may be marked `PRODUCTION VERIFIED` only when:

* release authority exists;
* release checklist passes;
* staging evidence applies to the exact commits;
* production automated smoke remains read-only;
* any real write is an authorized normal user or administrator action;
* monitoring and rollback evidence are recorded.

---

## Compatibility Retirement

A current endpoint may be marked `RETIRED` only when:

* every caller moved to target endpoints;
* frontend fallback is disabled and verified in staging;
* no job, script, or operations tool still uses it;
* target behavior has production evidence;
* rollback no longer requires the compatibility route;
* API Contracts and this checklist are updated;
* route, service glue, tests, and exposed configuration are removed in a focused cleanup.

Debug mutation routes are removed rather than promoted to production.

---

# Part 21 - Checklist Maintenance

## Update Procedure

At the end of an endpoint work-plan step:

1. update only the affected rows;
2. link the exact automated-test evidence;
3. record frontend and staging evidence when applicable;
4. keep unrelated rows unchanged;
5. reconcile any contract change with `API_CONTRACTS.md`;
6. report remaining failed, skipped, or untested cases;
7. review the next active work-plan item.

Do not mark an entire feature family complete because one endpoint passed.

---

## Adding an Endpoint

A new endpoint requires:

1. approved product need;
2. API Contracts update;
3. stable method, path, authorization, request, response, errors, idempotency, and version rules;
4. a new permanent checklist ID;
5. tests;
6. frontend and deployment order when applicable.

Removed IDs are not reused.

---

## Count Verification

Reviewed 2026-07-18 compatibility baseline inventory (not composed runtime):

```text
C-001 through C-034 = 34 routes
C-024 through C-029 = 6 conditional debug routes
```

Target catalogue:

```text
T-001 through T-148 = 148 approved target routes
```

T-147 is notification displayed-batch acknowledgement. T-148 is approval of a
receiver-accepted Future-Considerations trade. Neither ID represents a counter
endpoint; no counter endpoint or service is implemented.

Count changes require a matching API Contracts review.

---

# Part 22 - Completion Criteria

The endpoint foundation is complete for initial launch when:

* every launch-critical target row has at least `STAGING VERIFIED`;
* every active compatibility endpoint is characterized;
* every retired compatibility endpoint meets the retirement gate;
* public endpoints expose only approved fields;
* private endpoints pass authentication and two-league isolation;
* manager, commissioner, platform-administrator, and system-job boundaries pass;
* reads are proven read-only;
* material writes are transactional, versioned, and idempotent where required;
* active bids remain secret;
* matchup and standings operations remain outside League Activity;
* Socket.IO invalidation follows commit and stays league-scoped;
* debug and destructive compatibility routes are unavailable in production;
* no unexplained skipped launch-critical endpoint test remains.

Entry Draft rows may remain `PLANNED` for the initial release because that feature is approved for in-season completion.

Free Agent Draft rows `T-126` through `T-144`, plus FAD-context cases for
`T-076` through `T-083`, and atomic whole-card save `T-146` may not remain
`PLANNED` for launch. M7-26 closure also requires current-contract evidence for
T-147 notification acknowledgement and T-148 trade approval; the dated FAD-18
status does not substitute for the amended T-131/T-132/T-140 privacy gate, the
T-082 legacy FAD-cancellation replay gate, or the T-143/T-144 internal-complete/
external-redacted correction gate.

`T-145` is `COMPLETE - LOCAL ONLY` and may not regress to `PLANNED`. It must
reach `STAGING VERIFIED` before the first official regular-season standings
finalization or any `T-037` scheduled Entry Draft-start rollover
occurrence/retry staging verification. T-037 cannot advance beyond local
contract proof by substituting legacy or rebuilt standings evidence.

---

# Verification

Documentation verification:

```powershell
Get-Content docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
Select-String -Path docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md -Pattern '^`APPROVED`$','C-034','T-145','T-146','T-147','T-148','Target Free Agent Draft Endpoints','T-145 Finalization and Correction Proof','GET and HEAD Safety','Compatibility Retirement','Count Verification'
```

Future compatibility manifest verification:

```powershell
# Backend repository
npm run test:characterization
```

Future full backend verification:

```powershell
# Backend repository
npm test
```

Expected:

* the current manifest proves 34 routes with debug enabled and 28 without it;
* target endpoint status changes include actual commands and results;
* all fixtures and databases are synthetic or temporary;
* no test reads from or writes to production storage.
