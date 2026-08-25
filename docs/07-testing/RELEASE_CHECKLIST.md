# Hundo Leago - Release Checklist

## Document Status

`APPROVED`

## Checklist Status

`ACTIVE`

## Release Readiness

`HL-20260823-1 PHASE ONE PUBLISHED; OPERATOR-SEQUENCING STRICT STOP; PHASE TWO NOT STARTED; FULL RE-HOLD PASS; ABORT-V2 B2 HELD DEPLOY/RUNTIME PASS; FRESH VERIFIER PASS; ABORT-V2 PLAN ONLY NEXT; PRODUCTION NOT EVALUATED`

This testing and operations checklist defines:

* the go/no-go gates for staging release candidates and production releases;
* source, scope, documentation, automated testing, endpoint, manual QA, security, environment, database, backup, deployment, smoke, monitoring, rollback, and closeout checks;
* explicit production, reset, migration, and restore authority boundaries;
* release-record and evidence requirements;
* technical release decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the release-checklist decisions and approved adoption of the resulting checklist on 2026-07-18.

Launch-critical FAD release gates were added on 2026-07-27 and expanded for
the approved 2026-07-29 decision package.

Approval of this template does not mark any release ready.

## 2026-08-23 M7-26 Fresh Strict Release (PHASE ONE PUBLISHED; STRICT STOP; HELD B2 + FRESH VERIFIER PASS; ABORT-V2 PLAN ONLY NEXT)

Grae's exact requested/approved/recorded time is
`2026-08-23T23:23:29.877Z` for new release `HL-20260823-1`. Frozen F is
`4dfe12d1366314e3d9df722c50771324647743c9`; B
`8e313902feefcd683b0f5edd746a9dd2a9029a18` is the held starting baseline.
Executable B-prime `234547e4d8453b7515fc081ea6ebe4c2d022dc54` passed its
focused, complete, check, dependency, and backend `origin/staging` publication
gates at the recorded B-prime boundary. Held deploy `dep-da5sh0e417fc738i254g` passed on exact B-prime after
`3,503/3,503` hosted tests and all build/startup, zero-error,
held-health, and external read-only gates passed.

The clean pre-fixture source boundary was exact path
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3`,
`37105664` bytes / SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`.
Fresh prepare/replay passed at `729` then `0` writes. Held verifier v2 proved
the pre-action fixture-bearing source at `37744640` bytes / SHA-256
`b4163695d6f9db9e1f2db2b3aee536126e42b83f540fb0ee919b962fbd92b103`.
Fresh target
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3`
is absent. Bound backup `e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` has exact
manifest and `.sqlite3.gz.enc` storage object under prefix
`staging/backups/hundo-leago_staging_20260823T225620203Z_e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6`,
`createdAt` `2026-08-23T22:56:20.203Z`, encrypted SHA-256
`e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448`,
manifest checksum
`54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155`,
and verified plaintext `cf3ca07d...`. Exact reason, requester, retention,
expiry, and backend-build metadata are bound in the new release record.

Frontend helper commit `e898e72272e5a052867832dcf9f128e5b8d5730e` passes
its exact canonical local gate: helper/original/overlay SHA-256 values
`43cd106d...` / `2d8069ca...` / `c6b553c5...`, syntax `5/5`, both verifiers,
Vitest `14/14`, lint exit `0`, and byte-identical rebuild. API deploy
`6a8bfef3ac0ff74a373404d8` is rejected pre-browser evidence because it omitted
the helper headers. Corrected CLI deploy `6a8c006abe46c8fb6269c40c` is
current/`READY`, processed six header and two redirect rules, deployed no
functions, and passed exact bytes, headers, marker, absence, normal-app, and
held-runtime checks. Fresh tab `1600151197` reached
`READY_NO_SESSION_REQUEST` with empty query/mutation caches and exactly two
pinned assets observed; no API, session, action, or write ran.

The exact controlled-unhold deploy `dep-da60sl0jo6nc73e0cfu0` and pre-action v2
verifier passed. Phase-one proposal `e00e0512-4a20-47fd-ad74-0986dd4abd27`
reached accepted state; publication event
`974342b5-94e5-42d8-af20-9e07c35bc847` and immediate replay passed at
`fresh 2` / `replay 0`. Chrome was Admin rather than required Manager A during
publication, selecting `STRICT_STOP`. Phase two never began and no retry is
allowed. Full re-hold deploy `dep-da6cu8h42hec738f2al0` passed as sole newest/
`LIVE` B-prime at that boundary after hosted `3,503/3,503`, build/startup,
zero-error, health/readiness, and maintenance-blocked ordinary-route gates; it
later deactivated at the verified held-B2 handoff.
Pending is not release evidence. The current gate ledger is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-23.md`.

Exact abort-v2 B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb`, direct
child of B-prime with tree `0a6a928d8f6308aa5aadd2031c71769164c1cfb7`, is
committed and published to backend `origin/staging`. It changes only the exact
implementation and foundation-test paths: numstat `369/18` / `830/2`, Git blobs
`4a198c71554b7e7c5fc8ee481cd79b51c1ef799f` /
`53ce37cd04e48eb42323bab914d71ef3933c2c63`, and SHA-256 values
`d49c870bdf300983a0b57577ce68e0647ba6ff318ccf55fe11a5596016671889` /
`3d9714ca93efa573593d983c992032fc4c473f2df23fd85395c9ed6d2873155c`.
The canonical `57541`-byte raw diff has SHA-256
`eb963d6b95311eeacc282ce9f8f743a83d4eae32f28922e2668ddcbfcbe84dc0`.
Diff/syntax, focused `72/72` before the final narrow wrapper, and exact-final
affected `5/5` pass; backend HEAD and `origin/staging` equal B2 and the backend
worktree is clean. Exact-B2 API deploy `dep-da6ghj67bikc738hbbv0` is sole
newest/`LIVE`; normal auto-deploy remains `no`/trigger off. Hosted `3,519/3,519`,
build/startup, zero-error, held external probes, post-live source-family/zero-
holder proof, and the fresh B2-pinned verifier pass. Netlify remains unchanged
current/`READY` deploy `6a8c006abe46c8fb6269c40c`.

The following fresh items are the only current controlled-unhold/action
checklist. They do not check forward any fenced `HL-20260822-1` item:

- [x] `RC-STG-006B23` Re-proved the exact held service/deploy/runtime/source and
  helper boundary, then performed one `replace: false` merge containing only
  `STAGING_MAINTENANCE_HOLD=false`, `LEAGUE_WRITE_MODE=open`, and
  `FREE_AGENT_DRAFT_ROUTES_ENABLED=true`. Preserve exact B-prime, F,
  environment/database/source/root/season and the disabled jobs, account-email/
  capture, debug, backup, and provider-absence matrix. Do not call
  `trigger_deploy`.
- [x] `RC-STG-006C23` The merge produced exactly one API-triggered deploy,
  `dep-da60sl0jo6nc73e0cfu0`, on exact B-prime. At that controlled-unhold
  boundary, it became sole newest `LIVE` only after `443` suites /
  `3,503` hosted tests all pass, build/startup and zero-error checks pass, the
  exact runtime matrix re-passes, versioned live/readiness return
  `200`/`no-store`, and anonymous session/leagues returned
  `401 SESSION_REQUIRED` with the required CORS/cache boundary. Frozen v2
  pre-smoke verification also passed with exact source/sidecar/target/privacy/
  cleanup evidence. It later deactivated when the full re-hold deploy became
  `LIVE`.
- [x] `RC-STG-006D23` The fresh extensionless helper/current-FAD/session gates
  permitted phase one to begin. This is historical partial evidence only and
  grants no current helper or action authority after the later strict stop.
- [ ] `RC-STG-006E23` Phase one reached accepted/published state with proposal
  `e00e0512-4a20-47fd-ad74-0986dd4abd27`, publish event
  `974342b5-94e5-42d8-af20-9e07c35bc847`, and publisher/replay
  `fresh 2` / `replay 0`. The overall smoke is incomplete: Chrome was Admin
  rather than required Manager A during publication, phase two never began,
  and no return key/confirmation or retry may run.
- [x] `RC-STG-006F23` Operator sequencing selected `STRICT_STOP`; exactly one
  merge-only three-key re-hold produced sole newest/`LIVE` B-prime deploy
  `dep-da6cu8h42hec738f2al0`. Hosted `443` suites / `3,503` tests all passed;
  build/startup, zero-error, health/readiness, and session/leagues/current-FAD
  `503 SERVICE_MAINTENANCE` gates pass. Prior `dep-da60sl0jo6nc73e0cfu0` is
  deactivated.
- [x] `RC-STG-006G23` Preserve the main-only verifier as `SAFE-FAIL /
  SUPERSEDED`, not pass evidence. It ran and returned
  `TARGET_FAMILY_OR_SIDECAR_PRESENT` because source WAL/SHM were nonempty while
  target family, receipt, and work were absent. No checkpoint, sidecar removal,
  abort-v1 plan, or target write followed.
- [x] `RC-STG-006H23` Preserve the B-prime WAL-aware run as `DIAGNOSTIC ONLY`.
  Script `24132` bytes / `685` LF lines / SHA-256 `c036a2b8...` and result
  `2747` bytes / SHA-256 `deda5da6...` / code
  `HL23_ABORT_WAL_PREFLIGHT_SOURCE_VERIFIED` bind exact main `37744640` /
  `b4163695...`, WAL `568592` / `0dde02d1...`, SHM `32768` / `e03d9ff8...`,
  zero holders, semantic state, downstream absence, and cleanup. It copied all
  three source-family members into owned scratch; SQLite opened only that copy,
  whose main/WAL stayed unchanged while SHM changed. This grants no B-prime
  abort-v1 execution authority.
- [x] `RC-STG-006I23` Exact abort-v2 B2
  `6359ec9997f90dddf17ba2c9b07481746ae171bb` is the direct child of B-prime,
  with tree `0a6a928d8f6308aa5aadd2031c71769164c1cfb7`, only the two exact
  implementation/test paths, blobs/hashes/numstat/raw-diff seal recorded above,
  and passing syntax/diff, focused `72/72` before the final narrow wrapper, and
  exact-final `5/5`. Backend HEAD and `origin/staging` both equal B2 and the
  backend worktree is clean.
- [x] `RC-STG-006J23` The single approved `replace: false`,
  `APP_BUILD_ID=B2`-only merge produced exact API deploy
  `dep-da6ghj67bikc738hbbv0`, sole newest/`LIVE` after `443` suites / `3,519`
  tests all passed, build/startup/zero-error and bare-maintenance probes passed,
  and Netlify stayed exact `6a8c006abe46c8fb6269c40c`. Post-live code
  `HL23_B2_POST_LIVE_HELD_FAMILY_VERIFIED` bound `20` runtime keys, nine absent
  providers, three stable source snapshots, two seven-process scans with zero
  denied/holders, and downstream absence. Current namespace-local device is
  `66313`; historical B-prime device `66332` remains historical only.
- [x] `RC-STG-006K23` Fresh derivative
  `post-b2-abort-v2-source-verifier.sh` is `35494` bytes / `1045` LF / SHA-256
  `6d5cfe50ecee26199c3f0a2c922c99a84d3f97e2fe98b6256b36583e6e98b70c`;
  syntax/static checks and cold audit pass. One-shot result is `6032` bytes /
  SHA-256 `80c7cadec0664625b0c4fc6eb86fd49f5e58842534fdebbc1aead63f5fe65976`
  with code `HL23_ABORT_B2_V2_SOURCE_PREFLIGHT_VERIFIED`. Six source boundaries,
  two eight-process/`85`-descriptor zero-holder scans, main+WAL-only scratch,
  private SHM creation, source/scratch stability, rollback-journal/downstream
  absence, semantic state, zero changes, and cleanup pass.
- [ ] `RC-STG-006L23` This is the sole next authorized mutation: run one exact
  abort-v2 plan. Require contract `2`, `main-wal`, exact WAL binding,
  `release-qa-strict-restore-abort-v2-<sha256>`, `targetState: "absent"`, and
  mutation counts `0/0`. Its `temporaryFilesystemWork` must be exact:
  `performed: true`, `plaintextDatabaseMaterialized: true`, deterministic path
  `/opt/render/project/data/hundo-staging/sqlite/.hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3.strict-restore-work-v1`,
  `retained: false`, `processLocalCleanup: "verified"`, and
  `abruptTerminationRecovery: "fail-closed-at-deterministic-work-directory"`.
  Nonzero, incomplete, ambiguous, disconnected, or unknown output forbids
  execute. Freeze and reconcile even an exact accepted plan before any next
  mutation.
- [ ] `RC-STG-006M23` `PENDING AUTHORITY`: do not execute under this amendment.
  Only a later amendment after exact accepted-plan reconciliation may authorize
  one matching execute.
  Require receipt version `2`, the exact main/WAL/SHM evidence, source
  persistent-family preservation, clean target, canonical receipt, absent target
  WAL/SHM/journal and work, and mutation counts `0/2`. Ambiguous execute forbids
  blind retry and replay. Only an unambiguous accepted execute authorizes its
  byte-identical replay once; require identical target/receipt hashes, no work or
  external restore access, and `0/0`. Then stop.
- [ ] `RC-STG-006N23` Post-abort helper retirement remains `PENDING AUTHORITY`.
  It requires a separate amendment after abort evidence is bound.
- [ ] `RC-STG-006O23` Post-abort target activation remains `PENDING AUTHORITY`.
  No `DATABASE_PATH` change is authorized by this checklist revision.
- [ ] `RC-STG-006P23` Post-abort target verification, backup, final staging
  reopening/review, closeout, and production remain `PENDING AUTHORITY` after
  the mandatory stop. Normal restore remains forbidden.

## 2026-08-22 M7-26 Fresh Staging Evaluation (BLOCKED; ABORT-RECOVERED; VERIFIED HELD RECOVERY COMPLETE)

Release `HL-20260822-1` was a clean rerun, not a continuation of the failed
strict phase. It is now blocked and abort-recovered to a clean target. Its
exact record is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-22.md`.

Checked across the recorded pre-fixture and post-fixture boundaries:

- clean pre-fixture schema-`54` source
  `/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3`,
  which is now the intentional post-fixture source described below;
- release-specific target, initially unused and now materialized by abort
  `/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3`;
- verified incident-preservation backup
  `2044fcae-24e8-4392-a1ac-4064d9cd2807`;
- fresh verified authoritative-source backup
  `e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6`;
- exact frontend build `4dfe12d1366314e3d9df722c50771324647743c9`;
- sealed Netlify baseline deploy `6a8a3880f946cc39a2bf2bb6`; and
- exact backend build `8e313902feefcd683b0f5edd746a9dd2a9029a18`,
  whose isolated strict-restore gate passed `57/57` in `347.592s` and whose
  complete local suite passed `443` suites / `3,503` tests with `3,501` pass,
  zero fail, two intentional Windows skips, and zero cancelled/todo in
  `15172.429s` under Node `24.14.1` / npm `11.11.0`.

Backend `npm run check` and `npm ls --all` both exit `0`. The full TAP SHA-256
is `aa07d1df79e549c5b7828065d511c297737ef96c4c6cc422779850c802f8b663`, and
the frozen normalized backend diff SHA-256 is
`7624c7b24319954a9a67da61346efab3d7485849aad3542eb321b2d6900a0235`.
Backend `origin/staging` resolves exactly to the backend build above. Held F/B
deploy `dep-da5l8drtqb8s73ar74sg` is `LIVE` on exact B after its build and all
`3,503/3,503` hosted tests across `443` suites passed with zero fail, cancel,
skip, or todo in `2954563.480743ms`. Instance
`srv-d9eo2turnols73ekb830-wrhvw` recorded zero startup error logs; live/ready
returned `200`/`no-store` and `/api/v1/leagues` returned held
`503 SERVICE_MAINTENANCE`/`no-store`; no newer deploy existed at that
pre-cutover evidence boundary.

The exact-B/F full-hold/source/target/sidecar/receipt/work-area preflight and
backup re-verification passed. Fresh prepare created receipt
`88a56507-73fd-47f9-ac66-c305f0075d24` with `databaseWriteCount: 744`; its
immediate identical replay used the same IDs/times/counts and returned
`databaseWriteCount: 0`. The recorded actionable deadline was
`2026-08-24T07:00:00.000Z`; the strict stop and abort closed this release before
either hosted phase, so that deadline grants no resume or reuse authority.
Post-fixture held preflight records source
`37761024` bytes / SHA-256 `c26fdebc...` and absent source sidecars, fresh
target/sidecars, activation receipt, and restore work area. Helper deploy
`6a8b678ddbcf0b4ea8ba623c` passed its hosted byte/header gates, but the first
browser entry used the physical `.html` path and immediately reported
`STRICT_STOP / ORIGIN_GUARD / EXACT_STAGING_ORIGIN_REQUIRED`. All controls
remained disabled; the tab was closed; the hold never lifted; Render logged
zero requests from `21:35Z` through `21:42Z`; and no session, action, endpoint,
or backend write ran. The two-phase privacy smoke did not begin.

The exact `prepared_only` / `none/none` abort plan/execute/replay passed,
preserving the source and materializing the clean target at SHA-256
`cf3ca07d...` with receipt SHA-256
`b846edcffca67b1e6ba29e7ff2d1335d44f30ab251bc4daf40e9dd49de920592`.
Helper-retirement deploy `6a8b6b25126dabed39fa404d` restored the sealed
baseline and passed all retired-path checks. Only `DATABASE_PATH` changed;
held cutover deploy `dep-da5mmpu417fc73807ptg` was the then-newest `LIVE`
deploy on exact B at the recovery boundary. Its `443` suites / `3,503` hosted
tests all passed with zero
fail/cancel/skip/todo in `2941574.017632ms`; instance `mq8dr` had zero startup
errors, live/readiness returned `200`/`no-store`, and leagues remained held at
`503 SERVICE_MAINTENANCE`/`no-store`.

Corrected exact-Node-`24` verifier v2
(`61610cb991fb049075f4b997688da31bacf20b772ede4f994c197298b40f76a0`, `19298`
bytes) returned
`HL_POST_CUTOVER_TARGET_VERIFIED`. It proved source `37761024` bytes /
`c26fdebc...`, authoritative target `37105664` bytes / `cf3ca07d...`, receipt
`4430` bytes / `b846edcf...`, the full hold/provider absence, integrity `ok`,
foreign keys `0`, schema/data/migrations `54/54/54`, exact checksum and rotation
receipt, zero sessions, and all ten fixture/transfer artifact counts `0`. It
never opened the authoritative database and removed its owned scratch WAL/SHM
and temporary copy. Retained v1
(`6157adfd598cbf9d7d306dd849822e494ffefe7aee29f3eb14ce2ea4d9ec38c7`) is
diagnostic only: its pre-backup
`SCRATCH_SIDECAR_PRESENT` stop was a false negative caused by its own transient
scratch sidecars.

Fresh backup `e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` passed with encrypted
SHA-256 `e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448`,
manifest checksum
`54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155`, and
separate verification at plaintext `cf3ca07d...`, integrity `ok`, and foreign
keys `0`. Recovery is complete under the full hold. At that recovery boundary,
no placeholder could be treated as release evidence and no new release was
authorized; the later `HL-20260823-1` record is current.

The final interactive-review matrix is hold false, writes open, FAD routes
enabled, scheduler disabled, account email disabled/capture, debug disabled,
live provider disabled with provider variables absent, and backup scheduling
disabled. That matrix is applied only after the preceding strict and recovery
gates pass.

Production remains untouched and unauthorized. Provider-neutral
statistics/matchup job operation, the late-legal T-067/T-093 contract, T-074
buyout cancellation for contract and `prospect_right` assets, and the legacy-
production migration remain separate launch gates. T-005 membership/default
bootstrap and proactive live Socket.IO disconnect on T-004/T-006/T-007/T-009/
T-011 session revocation/replacement are also unresolved launch-hardening
gates. None is waived or silently added to this strict rerun.

## Historical 2026-08-21 M7-26 Evaluation (BLOCKED; RECOVERED)

Release `HL-20260821-1` is an isolated-staging D3 candidate with schema `52`
to `54`. Its exact source commits, held Render and Netlify deploys, local and
hosted automated totals, read-only authority/receipt evidence, encrypted
pre-migration backup, distinct clean restore, migration, and post-migration
backup are recorded in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-21.md`.

The same record preserves the later verified pre-rotation backup, narrow
staging-only rotation of nine synthetic release-QA accounts, one synthetic
session revocation, idempotent zero-write replay receipt, post-rotation backup,
and the explicit rule that no password value enters project evidence.

The first quiescent deployment and basic three-account Chrome smoke passed,
but Notifications and the strict FAD tie/manager-transfer privacy gates were
not exercised because those routes remained disabled. The shared staging QA
password was then disclosed in chat and is treated as compromised without
recording its value. Second rotation `HL-20260821-2` and its immediate
zero-write replay passed without exposing the password. Fresh backup
`adcbbbab-e857-4cae-af71-dbce95553ce5` independently verified and is the exact
strict sidecar restore point.

Grae selected strict hosted transfer evidence through a planned isolated
sidecar fixture. It must not rewrite Gamma League history and requires an exact
pre-fixture backup, live `A -> B -> A` smoke, and exact backup restoration. The
backup gate passes. Live smoke executed phase one but failed the exact Manager
B T-132 counter, so the release is blocked. Abort restoration, held target
cutover/re-verification, and post-cutover backup now pass; the privacy gate
does not.

The narrow `HL-20260821-3` four-command fresh-path recovery family has now
passed its focused exact-Node `24.14.1` gate at `56/56`; the selective strict
manager-outbox publisher separately passes `56/56`. Those are component
implementation gates and are not, by themselves, hosted restore evidence; the
hosted recovery evidence is recorded below. The recovery contract is pinned to
service `srv-d9eo2turnols73ekb830`, source
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3`, and target
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3`,
backup `adcbbbab-e857-4cae-af71-dbce95553ce5`, migration checksum set
`6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89`,
and frontend build `0e8eee92e2e323dd7f25ec3112988feaf23f96f0`.

The complete strict backend gate now passes on exact Node `24.14.1`: `443`
suites discovered `3,502` tests, `3,500` passed, two intentional Windows
link-capability cases skipped, and zero failed. TAP SHA-256 is
`ED2BCC54D252925548658DA95E32E6C5152C8A52AE1681ED5D0388DE6516CCF6`.
Commit `23971a4d66ee6383c6ad54339e769dbc9a76561e` is published on
`origin/staging`. Exact held deploy `dep-da4p5hu7bikc73aaeiq0` finished `LIVE`
at `2026-08-22T13:05:02.585588Z`, passed `3,502/3,502` with zero skips/failures
and clean startup, passed every pinned environment/flag/provider-absence and
source/root/target/work/WAL/SHM boundary, returned live/ready `200`, and kept
session at `503 SERVICE_MAINTENANCE`.

Backup `adcbbbab...` then reverified at plaintext SHA `cf3ca07d...`, integrity
`ok`, and zero foreign-key violations. Strict preparation reported
`writeCount: 744`, receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, and exact
replay `replayed: true` / `writeCount: 0`. Controlled-unhold deploy
`dep-da4pvcrl550s738l8rmg` reached `LIVE` on exact commit
`23971a4d66ee6383c6ad54339e769dbc9a76561e`, passed
`3,502/3,502`, exact runtime-boundary, health/session/CORS/cache, startup, and
two-minute log gates. Hosted phase-one smoke then failed its exact counter
gate. Merge-only `STAGING_MAINTENANCE_HOLD=true` auto-triggered exact-commit
partial-hold deploy `dep-da50g0v40ujc73aa5i4g`; it was manually canceled at
`2026-08-22T20:39:55Z` and never reached `LIVE`. The exact full-hold matrix was
then merge-set without a `DATABASE_PATH` change. Replacement deploy
`dep-da50hssaud7c73d3mqeg` started at that timestamp on exact commit
`23971a4d66ee6383c6ad54339e769dbc9a76561e`, reached `LIVE`, and passed
`3,502/3,502` plus the exact full-hold runtime checks.

The first abort plan failed closed with
`RELEASE_QA_STRICT_RESTORE_PATH_UNSAFE` because exact source WAL/SHM sidecars
were present; the read-only process check found zero open file descriptors.
Before checkpointing, incident backup
`44791a01-f62a-4729-b328-d3303bf79a12` verified from
`staging/backups/hundo-leago_staging_20260822T213849188Z_44791a01-f62a-4729-b328-d3303bf79a12.manifest.json`
at plaintext SHA-256
`9d36b59a7b2d0d38ef47fc5bc0514a51cb5a754629e3242597b9d4400849a51f`.
The guarded canonical WAL checkpoint returned
`busy/log/checkpointed: 0/0/0`, integrity `ok`, zero foreign-key violations,
schema `54`, and absent sidecars.

The abort plan then passed as exact `to_b_accepted` / phase one `published` /
return `none`. A manually transcribed execute value was safely rejected with
`RELEASE_QA_STRICT_RESTORE_PLAN_MISMATCH` and no target. Execution with exact
byte-extracted values passed at `replayed: false`, database mutations `0`,
durable-filesystem mutations `2`, `sourcePreserved: true`, and
`targetVerified: true`; immediate exact replay passed at `replayed: true`, both
mutation counts `0`, and no temporary plaintext restore. Post-checkpoint
incident backup `fa8c7b2d-04c9-4454-aae4-285673432fb7` verified from
`staging/backups/hundo-leago_staging_20260822T214720472Z_fa8c7b2d-04c9-4454-aae4-285673432fb7.manifest.json`
at the same plaintext SHA-256. Abort materialization and replay are checked.
Only `DATABASE_PATH` was changed for target cutover; exact-commit deploy
`dep-da51hjvqj5pc73bh8g3g` started at `2026-08-22T21:46:55.442059Z`, finished
`LIVE` at `2026-08-22T22:37:35.066844Z`, and passed `443` suites plus exact
`3,502/3,502` hosted tests with zero fail/cancel/skip/todo. The build succeeded
at `2026-08-22T22:37:16.851Z`; instance
`srv-d9eo2turnols73ekb830-qx9zx` was live at
`2026-08-22T22:37:35.170Z`, with zero error logs through
`2026-08-22T22:38:46Z`. Public live/ready returned `200` and `no-store`.

Fresh-shell evidence matched exact backend/frontend builds, target path,
persistent root, staging/production runtime, environment/database IDs, and the
unchanged full hold. Read-only temporary-copy verifier
`5f7de38f2673d3bb4c7d2b086b5d699afab1d173aceb86298d6e40eacb48b77f`
returned `HL_POST_CUTOVER_TARGET_VERIFIED` without opening or mutating the
authoritative database. It proved source SHA-256
`859eda97cd4c55724907abb5cd91f8dd741dd4cab9f9543df8942a1e2310ee05`,
target SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`,
absent sidecars, receipt SHA-256
`009227a315708be575d553eb39d72797c6f18824f0cd63b6a95580d026cb67bb`,
verified abort plan/mode/state, integrity `ok`, foreign-key violations `0`,
schema/data-model/migrations `54`, checksum
`6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89`,
exact identities, second-rotation receipt
`9152f844-d8cd-42f7-b0d5-b12f530ad618`, zero active sessions, strict-fixture
absence including league `60c82aa0-54f9-4c93-83f5-73b0d6d6f63e`, preparation
receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, and its transfer chain, plus
temporary-copy removal.

Post-cutover backup `2044fcae-24e8-4392-a1ac-4064d9cd2807` verified from
`staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json`.
Encrypted SHA-256 was
`cee039557278c41f59fa9d6a5b09cf4f69f1b9f3589cb3774420ef34be255162`,
manifest checksum
`08e3d3bde81843a683017d9952b30e02dd02978181a8644323cfbd590eca2ac8`,
and verified plaintext SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`
had integrity `ok` and zero foreign-key violations. Anonymous session returned
`503 SERVICE_MAINTENANCE` with `no-store`. Abort restoration, cutover, held
target verification, and post-cutover backup are checked; reopening is not.

Grae has authorized a temporary same-cookie browser action helper on the exact
canonical staging origin. The first publication stopped before any action on
canonical-URL and response-header drift. Corrected helper deploy
`6a89e2c867e39d41cc630a26` then passed `64` baseline plus `8` helper hosted
byte/header gates and its inert initialization checks. Phase one ran but the
strict counter gate rejected it; phase two never began. Helper removal now
passes. Abort materialization/replay, restored-target cutover deploy
`dep-da51hjvqj5pc73bh8g3g`, held target verification, and post-cutover backup
also pass. The authorized shape is an additive
`/release-qa/hl-20260821-3/` overlay on the already-
audited Netlify artifact: the original index, application bundle, and every
baseline path remain byte-identical; the action tab has its own actual empty
TanStack Query `QueryClient`, no FAD query, and no `RealtimeProvider`; page
initialization makes no script-initiated API/fetch/XHR/WebSocket request after
normal static asset loading; only explicit verified/armed actions may perform
their pinned read prechecks or write; exact `enabled.json` is checked without
cache immediately before every POST; and the overlay is removed by redeploying
the exact baseline artifact. The helper
uses release-specific no-store/no-referrer/nosniff/deny/noindex and narrow-CSP
headers through one exact temporary helper-scoped `netlify.toml` rule, not a
helper `_headers` artifact or separate `netlify.app` origin, and never changes
Render `FRONTEND_BUILD_ID`. The temporary block is removed before the exact
baseline rollback/redeploy; all non-helper global header rules remain
unchanged. This is staging-only authority and changes no production boundary.

Corrected helper deploy `6a89e2c867e39d41cc630a26`, title
`HL-20260821-3-strict-action-helper-v2`, was ready/published at
`2026-08-22T17:56:25.803Z`. Double-browser inert reload window
`2026-08-22T18:04:01.882Z` through `2026-08-22T18:04:06.741Z` produced zero
Render request logs; both helpers were `READY` with actual empty isolated
QueryClients, and session checks matched exact Admin and Manager B. Phase one
passed every fresh-session/current-CSRF, per-POST marker/expiry, empty-
QueryClient, exact Team 1 proposal precheck, and exact pending-assignment
acceptance precheck. No other action-time state precheck ran. It then
recorded proposal `201` / assignment
`17746270-0706-4420-8efd-2f476dc00c68`, Manager A `complete 1/0/0`, Manager B
`null 1/0/0`, acceptance `200`, and publisher event
`acd9b9e8-9947-4988-8057-579737724869`: fresh `200` / false / two writes /
scheduler disabled, then replay `200` / true / zero writes. Settled Manager A
passed at `null 2/1/1`; Manager B failed at `complete 3/1/1` versus exact
required `complete 2/1/1`. A focus refetch is plausible, not proven, and not
waived. Notifications was never opened; no return proposal or phase-two action
ran; no password value is retained. Expected abort state is
`to_b_accepted` / phase one `published` / return `none`.

Helper rollback submitted the exact sealed baseline and restored Netlify
configuration to canonical staging with title
`HL-20260821-3-remove-strict-action-helper-baseline`. Deploy
`6a8a09c13d5e25282f64d2c7` was created at
`2026-08-22T20:42:41.902Z`, published at `2026-08-22T20:42:43.080Z`, and is
current/ready. Netlify exited `0`. Remote checks passed `64/64` baseline bytes,
`8/8` original headers, and `8/8` retired helper paths across canonical staging
and the immutable deploy origin. Each retired extensionless HTML, JS, CSS, and
marker path returned the exact `472`-byte SPA index fallback with SHA-256
`1982ECF04CC456D989F7B42F15F3CED49A5D825DF0DEDD948DEAFFE8D8C1ADC8`; the
physical `.html` path also fell back. The marker is `text/html` and non-JSON,
so stale helpers fail closed before a POST. Helper removal is `PASS`.

This checklist remains `NOT EVALUATED` for production. This historical M7-26
staging record is `BLOCKED`. Re-hold, strict abort materialization/replay, restored-target
cutover, held target verification, and post-cutover backup pass. The full hold
remained active; controlled reopening, remaining authenticated desktop/mobile
role smoke, final runtime flags/job restoration, observation, and closeout were
not completed by that attempt. The subsequent `HL-20260822-1` rerun is also
blocked and abort-recovered to a clean target, and it owns no further action
authority. Fresh `HL-20260823-1` was separately authorized later and does not
resume either predecessor. Production remains untouched and unauthorized.

---

## Release Purpose

A production release combines:

* exact source commits;
* exact hosted builds;
* environment configuration;
* API and schema compatibility;
* persistent data;
* external services;
* scheduled work;
* human authorization.

Each part may be correct in isolation while the combined release is unsafe.

This checklist requires evidence that the complete release candidate is compatible, recoverable, and explicitly authorized before production changes.

---

## Out of Scope

This checklist does not:

* authorize a deployment;
* execute a command;
* merge, commit, or push code;
* change Netlify, Render, DNS, secrets, disk, or database state;
* waive an approved rule or security control;
* convert a failed test into an accepted result;
* make production a test fixture;
* make code rollback restore SQLite;
* replace the release-specific work plan.

Every real release receives a completed copy or equivalent release record.

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
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
docs/04-technical-specs/DEPLOYMENT.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/08-operations/BACKUP_AND_RESTORE.md
```

Deployment owns release ordering and provider behavior. This checklist decides whether the recorded release satisfies those requirements.

---

## Production Authority

Grae must explicitly authorize the production release.

Separate explicit authorization is required when the release includes:

* production reset;
* JSON-to-SQLite cutover;
* destructive or transforming data migration;
* production restore;
* secret rotation that revokes access;
* disk, domain, or DNS change;
* permanent deletion.

General statements such as “continue,” “looks good,” or approval of this document are not production authority unless they clearly identify the production operation.

---

## Roles

Each release records:

```text
Release requester:
Technical operator:
Manual QA tester:
Release reviewer:
Production approver: Grae
Incident lead if emergency:
```

One person may hold multiple non-approval roles when team size requires it, but every role and piece of evidence remains explicit.

The production approver cannot be inferred from a Git merge.

---

# Part 2 - Release Identity and Status

## Release Record

Safe release records belong under:

```text
docs/07-testing/release-runs/
```

Suggested filename:

```text
HL-YYYYMMDD-N.md
```

Large logs, videos, traces, database reports, and provider artifacts remain in their private systems. The release record links or identifies them without copying secrets or private production data into Git.

---

## Release Header

```text
Release ID:
Release type:
Purpose:
Requested by:
Technical operator:
Manual QA tester:
Release reviewer:
Production approver:
Frontend commit:
Frontend deploy ID:
Backend commit:
Backend deploy ID:
Node version:
API contract version:
Schema version:
Migration checksum-set ID:
Environment identity:
Database ID suffix:
Backup ID:
Maintenance window:
First-write boundary:
Current status:
Created at:
Updated at:
```

---

## Allowed Release Statuses

```text
DRAFT
STAGING CANDIDATE
STAGING VERIFIED
NO-GO
READY FOR AUTHORIZATION
GO AUTHORIZED
IN PROGRESS
ROLLED BACK
COMPLETE
FAILED
```

`STAGING VERIFIED` is valid only when an isolated-staging release record has
passed every applicable hosted staging gate and explicitly records that
production remained untouched. It is staging evidence, not a production
readiness or authorization status, and it does not advance a production
candidate to `READY FOR AUTHORIZATION` or `GO AUTHORIZED`.

Only Grae's explicit approval changes a production candidate from `READY FOR AUTHORIZATION` to `GO AUTHORIZED`.

---

## Release Types

Use one Deployment type:

| Type | Meaning |
| --- | --- |
| `D0` | Documentation only; no hosted runtime input changes |
| `D1` | Frontend only |
| `D2` | Backend only with no schema change |
| `D3` | Additive API and/or backward-compatible schema change |
| `D4` | Data migration, reset, destructive schema change, or authority cutover |
| `D5` | Emergency code release |

The type controls applicability. It does not weaken safety for affected components.

---

# Part 3 - Gate Rules

## Check Values

Use:

```text
PASS
FAIL
BLOCKED
NOT APPLICABLE
DEFERRED BY APPROVED SCOPE
NOT RUN
```

Every `NOT APPLICABLE` includes the release-type reason.

Every approved deferral cites Project Scope or the Active Roadmap.

`NOT RUN` is not a pass.

---

## Hard Blockers

The release is `NO-GO` when any applicable item has:

* `FAIL`;
* `BLOCKED`;
* unexplained `NOT RUN`;
* missing evidence;
* ambiguous source or environment identity.

There is no conditional go for:

* critical or high-severity security issues;
* cross-league access;
* data corruption or unexplained reconciliation;
* missing verified backup for a data-risking release;
* untested migration;
* incompatible API/frontend/schema;
* production authority not granted.

---

## Known-Issue Rule

Open issues:

* `CRITICAL` or `HIGH`: release blocked;
* `MEDIUM`: explicit owner, workaround, impact, and Grae disposition required;
* `LOW`: owner and planned follow-up required when accepted.

An issue is not low merely because the fix is inconvenient.

---

# Part 4 - Scope and Change Review

- [ ] `RC-SCP-001` Release type is selected and justified.
- [ ] `RC-SCP-002` Release objective is one understandable outcome.
- [ ] `RC-SCP-003` Every changed path belongs to the release scope.
- [ ] `RC-SCP-004` Unrelated local modifications are excluded.
- [ ] `RC-SCP-005` Frontend, backend, documentation, schema, environment, and provider changes are listed separately.
- [ ] `RC-SCP-006` Launch-critical, in-season, optional, and out-of-scope boundaries match Project Scope.
- [ ] `RC-SCP-007` Deferred Entry Draft or playoff work is not accidentally treated as opening-day completion.
- [ ] `RC-SCP-008` No hidden reset, seed, normalization, repair, refresh, backup, or migration side effect exists.
- [ ] `RC-SCP-009` Read-only endpoints remain read-only.
- [ ] `RC-SCP-010` User-visible behavior changes have approved rule/product authority.
- [ ] `RC-SCP-011` Breaking API or data change has explicit compatibility and release order.
- [ ] `RC-SCP-012` Release notes identify manager, commissioner, and administrator effects.
- [ ] `RC-SCP-013` The core Free Agent Draft is included as launch-critical; only its Season 2 video may remain optional.

---

## Change Inventory

Complete:

```text
Frontend paths:
Backend paths:
Documentation paths:
Migration files:
Environment-variable names added/changed/removed:
Secret versions changed:
Provider configuration changed:
Persistent paths changed:
API endpoints added/changed/retired:
Socket.IO events changed:
Scheduled jobs changed:
Email templates/events changed:
League Activity event types changed:
Security Audit event types changed:
Known compatibility behavior retained:
```

Secret values are excluded.

---

# Part 5 - Source and Branch Gate

- [ ] `RC-SRC-001` Frontend repository path is the approved `hundo-leago` repository.
- [ ] `RC-SRC-002` Backend repository path is the approved `hundo-leago-backend` repository.
- [ ] `RC-SRC-003` Production source is reviewed on `main` in each changed repository.
- [ ] `RC-SRC-004` Staging source was reviewed on `staging`.
- [ ] `RC-SRC-005` Exact full commit SHAs are recorded.
- [ ] `RC-SRC-006` Commits are reachable from the intended protected branch.
- [ ] `RC-SRC-007` `git status --short` was reviewed before release preparation.
- [ ] `RC-SRC-008` Untracked and modified files not in the release are understood and excluded.
- [ ] `RC-SRC-009` Frontend and backend lockfile hashes are recorded.
- [ ] `RC-SRC-010` No dependency uses an unintended floating or locally linked source.
- [ ] `RC-SRC-011` Node version is exactly `24.14.1`.
- [ ] `RC-SRC-012` Backend SQLite driver is exact approved `12.11.1` when SQLite is implemented.
- [ ] `RC-SRC-013` Build uses the committed lockfile and `npm ci`.
- [ ] `RC-SRC-014` No commit or tag was rewritten after evidence was collected.

---

## Source Evidence Commands

```powershell
# Run in each repository
git branch --show-current
git rev-parse HEAD
git status --short
git diff --stat
git diff --cached --stat
Get-FileHash package-lock.json -Algorithm SHA256
node --version
npm --version
```

Record output safely.

---

# Part 6 - Documentation and Contract Gate

- [ ] `RC-DOC-001` Canonical README points to all applicable approved documents.
- [ ] `RC-DOC-002` Current State accurately describes implemented versus planned behavior.
- [ ] `RC-DOC-003` Active Roadmap status and milestone gate are current.
- [ ] `RC-DOC-004` Active Work Plan or release plan identifies the exact release scope.
- [ ] `RC-DOC-005` Product specifications match visible workflows.
- [ ] `RC-DOC-006` League Rules, Scoring Rules, and Permissions match implementation.
- [ ] `RC-DOC-007` API Contracts include every added, changed, and retired endpoint.
- [ ] `RC-DOC-008` Backend Endpoint Checklist statuses have evidence.
- [ ] `RC-DOC-009` Data Model and SQLite Migration match every schema change.
- [ ] `RC-DOC-010` Security matches session, token, CORS, CSRF, audit, and secret behavior.
- [ ] `RC-DOC-011` Environment Setup matches deployed variable names and topology.
- [ ] `RC-DOC-012` Deployment contains the selected release and rollback pattern.
- [ ] `RC-DOC-013` Backup and Restore matches artifact format and restore tooling.
- [ ] `RC-DOC-014` No contradictory unresolved approval item remains.
- [ ] `RC-DOC-015` Verification commands in changed documents are valid or explicitly future-target commands.
- [ ] `RC-DOC-016` The approved FAD technical specification, API amendment, data-model amendment, and contained work plan exist before FAD code is accepted.
- [ ] `RC-DOC-017` The 2026-07-29 FAD decision package is consistent across rules, product/technical contracts, endpoint proof, automated strategy, manual QA, and release gates with no stale manual-opening, final-hour-rejection, or fixed-Week-1 assumption.

---

# Part 7 - Automated Test Gate

## Frontend

- [ ] `RC-TST-001` Clean frontend install passed.
- [ ] `RC-TST-002` Frontend lint passed.
- [ ] `RC-TST-003` Frontend unit/component tests passed.
- [ ] `RC-TST-004` Frontend production build passed.
- [ ] `RC-TST-005` Affected Playwright Chromium workflows passed.
- [ ] `RC-TST-006` Required Firefox/WebKit automated coverage passed.
- [ ] `RC-TST-007` No unexplained skipped or quarantined launch-critical frontend test exists.
- [ ] `RC-TST-008` Coverage did not regress without approved explanation.

Commands:

```powershell
npm ci
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e
```

Only commands implemented by the release are run; a missing required script blocks the applicable gate.

---

## Backend

- [ ] `RC-TST-009` Clean backend install passed.
- [ ] `RC-TST-010` Backend syntax/check command passed.
- [ ] `RC-TST-011` Backend full test suite passed.
- [ ] `RC-TST-012` Compatibility characterization passed for affected compatibility code.
- [ ] `RC-TST-013` Domain and service tests passed.
- [ ] `RC-TST-014` SQLite repository and transaction tests passed.
- [ ] `RC-TST-015` API contract tests passed.
- [ ] `RC-TST-016` Authentication, authorization, and two-league isolation tests passed.
- [ ] `RC-TST-017` Scheduled-job restart, overlap, lease, and idempotency tests passed.
- [ ] `RC-TST-018` Socket.IO authentication, room, commit, rollback, and reconnect tests passed.
- [ ] `RC-TST-019` NHL provider failure and last-valid-cache tests passed.
- [ ] `RC-TST-020` Email/outbox retry and duplicate-protection tests passed.
- [ ] `RC-TST-021` No unexplained skipped or quarantined launch-critical backend test exists.
- [ ] `RC-TST-022` Coverage did not regress without approved explanation.

Commands:

```powershell
npm ci
npm run check
npm test
npm run test:characterization
npm run test:contract
npm run test:integration
```

---

## Data, Migration, and Recovery Tests

- [ ] `RC-TST-023` Empty-database migration passed.
- [ ] `RC-TST-024` Applied migration checksum refusal test passed.
- [ ] `RC-TST-025` Copied-JSON dry-run/import tests passed when applicable.
- [ ] `RC-TST-026` Repeat-import determinism passed.
- [ ] `RC-TST-027` Count, money, ownership, schedule, and semantic reconciliation passed.
- [ ] `RC-TST-028` `integrity_check` returned `ok`.
- [ ] `RC-TST-029` `foreign_key_check` returned zero rows.
- [ ] `RC-TST-030` Online backup creation and verification passed.
- [ ] `RC-TST-031` Clean-path restore and application startup passed.
- [ ] `RC-TST-032` Session/token, job, outbox, and email post-restore safeguards passed.
- [ ] `RC-TST-033` Accelerated regular season passed.
- [ ] `RC-TST-034` The complete `2026-07-29 FAD Decision-Package Matrix` in `TESTING_STRATEGY.md` passed at its assigned domain, repository, service, HTTP, job, migration, browser, privacy, concurrency, and restart layers with no unexplained skip.
- [ ] `RC-TST-035` Late-legality automation proved authoritative underway-game detection, atomic immutable snapshot/baseline/player-game evidence, full post-baseline event exclusion for that game, idempotent replay, and racing-attempt convergence.

---

## Test Evidence

```text
Frontend command record:
Backend command record:
Browser report:
Coverage report:
Migration report:
Backup/restore report:
Passed:
Failed:
Skipped:
Flaky:
Tests not run:
Remaining risk:
```

Never copy a prior release's pass without rerunning the applicable exact-commit gate.

---

# Part 8 - Endpoint Gate

- [ ] `RC-END-001` All launch-critical target endpoint rows are at least `STAGING VERIFIED`.
- [ ] `RC-END-002` Every still-active compatibility route is `CHARACTERIZED`.
- [ ] `RC-END-003` Retired routes meet the compatibility retirement gate.
- [ ] `RC-END-004` Current route count matches the intended compatibility state.
- [ ] `RC-END-005` Every changed endpoint has success, validation, error, permission, and league-isolation evidence.
- [ ] `RC-END-006` Every changed read has no-domain-write proof.
- [ ] `RC-END-007` Every material write has transaction, rollback, version, and idempotency proof where applicable.
- [ ] `RC-END-008` Outbox and Socket.IO occur only after commit.
- [ ] `RC-END-009` Active competing bid values remain absent for managers and commissioners.
- [ ] `RC-END-010` Public projections exclude private fields.
- [ ] `RC-END-011` Debug mutation routes are absent from production configuration.
- [ ] `RC-END-012` Frontend fallback to retired broad writes is disabled and staging-verified.
- [ ] `RC-END-013` Every launch-critical FAD endpoint row defined by the later approved technical contract exists and is at least `STAGING VERIFIED`.
- [ ] `RC-END-014` The complete `2026-07-29 FAD Decision-Package Endpoint Proof` passed, including automatic readiness/retry, adaptive help, queued nominations, strict-improvement fallback, FAD-only draws, server-owned Week 1 recovery, and T-093 whole-game late-snapshot exclusion.

Endpoint checklist evidence:

```text
Compatibility rows complete:
Target launch-critical rows complete:
Rows blocked:
Rows deferred by approved scope:
Evidence location:
```

---

# Part 9 - Manual QA Gate

- [ ] `RC-QA-001` Manual QA run header identifies exact staging deploys.
- [ ] `RC-QA-002` Complete initial-launch scope was tested.
- [ ] `RC-QA-003` Required desktop Chromium run passed.
- [ ] `RC-QA-004` Required Firefox run passed.
- [ ] `RC-QA-005` Required mobile Chromium run passed.
- [ ] `RC-QA-006` WebKit/iOS behavior has required evidence.
- [ ] `RC-QA-007` At least one physical mobile browser passed.
- [ ] `RC-QA-008` 200% zoom checks passed.
- [ ] `RC-QA-009` Keyboard and screen-reader spot checks passed.
- [ ] `RC-QA-010` Two-league manual isolation checks passed.
- [ ] `RC-QA-011` Loading, empty, error, conflict, reconnect, and stale-build states passed.
- [ ] `RC-QA-012` Backup/restore staging drill manual checks passed when applicable.
- [ ] `RC-QA-013` Every fixed critical/high/medium issue was retested.
- [ ] `RC-QA-014` Manual QA recommendation is `PASS`.
- [ ] `RC-QA-015` No critical or high defect remains open.
- [ ] `RC-QA-016` Every accepted medium/low issue has owner and disposition.
- [ ] `RC-QA-017` The complete `MQ-FAD-*` lifecycle, privacy, allocation, rapid-auction, navigation, and recovery scope passed.
- [ ] `RC-QA-018` Manual FAD evidence includes scheduled rollover and draft/trading gate, all-or-none automatic card opening, less-than-48-hour help, over-cap and incomplete-card outcomes, restricted fallback, private final-hour queueing, no-bid/no-reservation behavior, one- and multi-Monday draft delay, and atomic completion-overrun recovery.
- [ ] `RC-QA-019` `MQ-MAT-026` and `MQ-MAT-027` passed with evidence that an already-underway NHL game is excluded in full and that the late snapshot, baseline, and immutable player/game exclusion set commit atomically under replay and races.

Manual QA run ID:

```text
Run ID:
Tester:
Result:
Defects open:
Evidence:
```

---

# Part 10 - Security Gate

- [ ] `RC-SEC-001` Password hashing and credential tests pass.
- [ ] `RC-SEC-002` One-active-session and every revocation trigger pass.
- [ ] `RC-SEC-003` Verification, setup, reset, and reactivation token tests pass.
- [ ] `RC-SEC-004` Public account responses prevent enumeration.
- [ ] `RC-SEC-005` Durable rate limits pass boundary and restart tests.
- [ ] `RC-SEC-006` Exact deployed CORS allows only approved origins.
- [ ] `RC-SEC-007` Origin and CSRF enforcement pass for browser mutations.
- [ ] `RC-SEC-008` Production session cookie attributes match the deployed topology.
- [ ] `RC-SEC-009` Security headers and Content Security Policy pass.
- [ ] `RC-SEC-010` SQL injection strings remain values, and identifiers/sorts use allowlists.
- [ ] `RC-SEC-011` Output encoding prevents stored/reflected script execution.
- [ ] `RC-SEC-012` Logs and audits redact credentials, tokens, bids, and secrets.
- [ ] `RC-SEC-013` First-platform-administrator bootstrap is disabled after use.
- [ ] `RC-SEC-014` Every active platform administrator has a protected active `member` membership in every non-deleted league, and membership/commissioner/team-manager mutation attempts against it fail closed.
- [ ] `RC-SEC-015` Socket.IO uses session authentication and authorized league rooms.
- [ ] `RC-SEC-016` No active sealed bid value is visible to a commissioner.
- [ ] `RC-SEC-017` Public health and frontend assets contain no internal path or secret.
- [ ] `RC-SEC-018` Dependency audit is reviewed and every relevant finding has disposition.
- [ ] `RC-SEC-019` No critical or high-severity security defect remains.

Security review:

```text
Reviewer:
Date:
Dependency-audit evidence:
Open findings:
Recommendation:
```

---

# Part 11 - Environment and Infrastructure Gate

- [ ] `RC-ENV-001` Dedicated staging Netlify site exists.
- [ ] `RC-ENV-002` Dedicated staging Render service and disk exist.
- [ ] `RC-ENV-003` Staging database, users, leagues, secrets, email, and backup namespace are separate from production.
- [ ] `RC-ENV-004` Dedicated production Netlify and Render services are identified.
- [ ] `RC-ENV-005` Production SQLite path resolves under the approved persistent disk.
- [ ] `RC-ENV-006` Production backend remains one instance.
- [ ] `RC-ENV-007` Frontend and backend `APP_ENV`/build identities are correct.
- [ ] `RC-ENV-008` Database environment identity matches production.
- [ ] `RC-ENV-009` Required configuration names are present and unknown/empty values fail closed.
- [ ] `RC-ENV-010` No secret uses a `VITE_` variable.
- [ ] `RC-ENV-011` Production origin lists are exact and contain no arbitrary deploy preview.
- [ ] `RC-ENV-012` Production email mode and credentials are correct.
- [ ] `RC-ENV-013` Staging capture/sandbox email cannot send unrestricted production messages.
- [ ] `RC-ENV-014` Scheduled-job enablement is explicit.
- [ ] `RC-ENV-015` Debug-route enablement is false in production.
- [ ] `RC-ENV-016` Disk free space meets migration, backup, WAL, and safety-margin needs.
- [ ] `RC-ENV-017` Health checks use the intended safe endpoint.
- [ ] `RC-ENV-018` Provider notifications and operational alerts are configured.
- [ ] `RC-ENV-019` Environment changes have before/after version records and rollback.
- [ ] `RC-ENV-020` Domain/DNS changes are absent or have a separately approved plan.

Do not paste environment values into the release record.

---

# Part 12 - Database and Migration Gate

## Every SQLite Release

- [ ] `RC-DB-001` Database ID and environment identity are recorded safely.
- [ ] `RC-DB-002` Current schema ledger and checksum set match expectations.
- [ ] `RC-DB-003` Application build supports the current schema.
- [ ] `RC-DB-004` SQLite WAL, foreign keys, busy timeout, and durability settings are verified.
- [ ] `RC-DB-005` No startup, build, GET, or scheduled feature job automatically migrates.
- [ ] `RC-DB-006` Destructive cleanup is separated from expansion release.
- [ ] `RC-DB-007` Old backend rollback compatibility with current schema is known.

---

## Migration Release

For `D3` schema work or `D4`:

- [ ] `RC-DB-008` Migration IDs and exact checksums are recorded.
- [ ] `RC-DB-009` Migration is immutable and reviewed.
- [ ] `RC-DB-010` Staging migration ran against production-shaped data.
- [ ] `RC-DB-011` Migration plan output matches intended changes.
- [ ] `RC-DB-012` Maintenance/write-block procedure is tested.
- [ ] `RC-DB-013` Jobs, email, and outbox pause procedure is tested.
- [ ] `RC-DB-014` Migration command validates environment and database identity.
- [ ] `RC-DB-015` Migration requires explicit production confirmation.
- [ ] `RC-DB-016` Reconciliation queries and expected totals are prepared.
- [ ] `RC-DB-017` First-write boundary and rollback path are explicit.
- [ ] `RC-DB-018` Post-migration backup command and verification are prepared.
- [ ] `RC-DB-018A` M7-26 authority reconciliation, when required, uses only
  `npm run db:reconcile:m7-26:staging` with all five explicit arguments:
  absolute database path, `--environment staging`, absolute persistent root,
  release ID, and identity-bound confirmation
  `M7-26:<release ID>:staging:<environment ID>:<database ID>`.
- [ ] `RC-DB-018B` The M7-26 command ran only under the full staging
  maintenance hold after read-only preview plus verified backup/clean restore;
  its post-run preview is clean, its exact release replay makes zero writes,
  and its deterministic audit receipt is recorded before migrations `0053`
  and `0054` are applied.
- [ ] `RC-DB-018C` The exact held staging database passed
  `npm run db:scan:fad-public-receipts:staging -- --database '<absolute database path>' --environment staging --persistent-root '<absolute persistent root>'`
  before reconciliation/migration and after migration. The sanitized result
  accounts for every T-082 auction-cancellation and T-144 allocation-correction
  receipt as public-redacted, legacy full-money but safely reprojectable,
  null/no-FAD allocation where applicable, or malformed unsafe; malformed
  count and `total_changes()` delta are both zero.

---

## JSON-to-SQLite Cutover

Additionally:

- [ ] `RC-DB-019` Immutable source bundle inventory and hashes are complete.
- [ ] `RC-DB-020` Reset manifest contains only explicitly approved Season 1 omissions.
- [ ] `RC-DB-021` Stable player/provider identifiers are preserved.
- [ ] `RC-DB-022` Two deterministic staging imports produced identical semantic results.
- [ ] `RC-DB-023` Reject and quarantine reports contain no unresolved protected record.
- [ ] `RC-DB-024` Counts, money, ownership, schedules, and semantic reconciliation have no unexplained difference.
- [ ] `RC-DB-025` Original JSON remains immutable recovery evidence.
- [ ] `RC-DB-026` No dual-write period exists.
- [ ] `RC-DB-027` Pre-first-write reactivation plan is prepared.
- [ ] `RC-DB-028` Post-first-write recovery uses forward correction or verified restore.

---

# Part 13 - Backup and Recovery Gate

- [ ] `RC-BKP-001` Latest verified production backup is within required RPO.
- [ ] `RC-BKP-002` Pre-change backup is required and identified for data-risking release.
- [ ] `RC-BKP-003` Backup used online SQLite backup API rather than a live main-file copy.
- [ ] `RC-BKP-004` `integrity_check`, `foreign_key_check`, schema, identity, and checksum verification passed.
- [ ] `RC-BKP-005` Encrypted artifact exists outside the Render disk.
- [ ] `RC-BKP-006` Encrypted object size and SHA-256 match.
- [ ] `RC-BKP-007` Required encryption-key version is available.
- [ ] `RC-BKP-008` Staging restore drill passed within the last 30 days or after every material backup/restore change.
- [ ] `RC-BKP-009` Restore drill includes session/token revocation and job/outbox/email reconciliation.
- [ ] `RC-BKP-010` Pre-restore preservation behavior is tested.
- [ ] `RC-BKP-011` Operator knows that Render code rollback does not roll back disk state.
- [ ] `RC-BKP-012` Operator knows that Netlify rollback does not restore backend data.
- [ ] `RC-BKP-013` Provider disk snapshot is secondary, not primary SQLite recovery.
- [ ] `RC-BKP-014` Restore authority remains platform-administrator-only after approved request.
- [ ] `RC-BKP-015` Recovery-time and recovery-point targets are understood.

### Immutable `HL-20260822-1` RC-BKP-015A-J Evidence Fence

The following release-specific subitems preserve the closed
`HL-20260822-1` recovery checklist exactly. Their checked and unchecked marks
are historical evidence only. None of these IDs, paths, states, receipts, or
results satisfies `HL-20260823-1`, and none grants resume or reuse authority.

- [ ] `RC-BKP-015A` The M7-26 strict operation uses only release
  `HL-20260822-1`, service `srv-d9eo2turnols73ekb830`, environment
  `test:release-qa`, database `m7-release-qa-fixture`, the exact old/new paths,
  backup/manifest/storage hashes, schema `54`, migration checksum set, and
  frontend build pinned in Backup and Restore; the exact deployed backend
  build is captured in the plan and receipt.
- [ ] `RC-BKP-015B` The operator independently verified the attached Render
  service and every full-hold flag before plan/execute; no provider-verified
  service-identity claim is inferred from the command's operator-asserted
  `--service-id` argument.
- [x] `RC-BKP-015C` Restore plan output records zero authoritative-database and
  zero durable-filesystem mutations while disclosing deterministic private
  temporary plaintext work and verified cleanup. Any pre-existing or crash-
  residue work directory stops the operation for manual review under hold.
- [ ] `RC-BKP-015D` Normal execute verified the exact Admin-driven Team 1
  `A -> B -> A` chain, unchanged Team 2, both exact manager-assignment rows
  published once with attempt `1`, row version `3`, exact payload/audience,
  and no bid/resolution/allocation/allocation-event drift before creating only
  the inactive target and receipt. The source remains preserved and exact replay performs
  zero authoritative-database and durable-filesystem mutation without an
  object-store request or encryption-key resolution.
- [x] `RC-BKP-015E` The operator changed only `DATABASE_PATH` to the verified
  inactive target and redeployed under the full hold; the materializer itself
  did not change Render configuration or activate the target.
- [x] `RC-BKP-015F` Post-handoff checks prove old-source and receipt
  preservation, target hash/identity/schema/checksum/integrity/foreign keys,
  second credential-rotation receipt, zero active sessions, strict fixture
  absence, and an independently verified incident-preservation backup before
  fresh controlled activation.
- [x] `RC-BKP-015G` The operator selected exactly one matching command pair:
  normal plan/execute only after complete hosted smoke, or abort plan/execute
  after an exact recognized incomplete/failed smoke. Plan ID, confirmation,
  and receipt mode never crossed between normal and abort namespaces.
- [x] `RC-BKP-015H` Abort accepted exactly one finite classification:
  `prepared_only` (`none/none`), `to_b_pending` (exact B proposal,
  idempotency, and one delivered notification; no acceptance; `none/none`),
  `to_b_accepted` (phase one `pending|publishing|failed|published`; return
  `none`), `return_to_a_pending` (phase one `published`; exact A proposal,
  idempotency, and one delivered notification; return `none`), or
  `return_to_a_accepted` (phase one `published`; return
  `pending|publishing|failed|published`). Every abort output/receipt records
  `smokeCompleted: false`, `hostedSmokeCompleted: false`,
  `releaseBlocked: true`, and `rollbackOnly: true`; only the last
  classification may record `sourceSemanticChainCompleted: true`.
- [ ] `RC-BKP-015I` An unclassified source or publisher failure/crash stopped
  the release without manual SQL or generic restore. A `failed` or
  `publishing` publisher row was not retried; the operator restored the full
  hold and used the abort pair.
- [x] `RC-BKP-015J` After normal or abort restoration, account email remains
  disabled with `EMAIL_DELIVERY_MODE=capture` until a separate restored-outbox
  reconciliation decision and evidence authorize any delivery/allowlist
  change.

### Current `HL-20260823-1` Backup/Restore Boundary

The fresh source and verified backup binding pass only as recorded in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-23.md`. B-prime
implementation, local verification, and backend publication pass. Its held
deploy/runtime, fixture prepare/replay, held postflight proof, helper
construction/local verification, corrected helper publication/hosted proof,
controlled-unhold runtime, partial phase one, and full re-hold pass. Exact
abort-v2 B2 mint/publication, held deployment/runtime, and fresh verifier gates
also pass. Operator sequencing strict-stopped the smoke; phase two and normal
recovery are forbidden. The abort-v2 plan only is the next authorized mutation;
execute/replay remain `PENDING AUTHORITY` until accepted-plan reconciliation and
a later amendment. Post-abort helper
retirement, activation, verification, backup, and every later downstream step
require a separate amendment.
The historical RC-BKP-015A-J block above cannot be checked forward.

Backup evidence:

```text
Backup ID:
Created at:
Retention class:
Verification:
Offsite object verification:
Restore drill ID/date:
Restore duration:
Known recovery limitation:
```

---

# Part 14 - Staging Release-Candidate Gate

- [ ] `RC-STG-001` Staging frontend runs the exact proposed frontend commit.
- [ ] `RC-STG-002` Staging backend runs the exact proposed backend commit.
- [ ] `RC-STG-003` Unchanged component commit is explicitly recorded and compatible.
- [ ] `RC-STG-004` Staging schema and migration checksum set match the candidate.
- [ ] `RC-STG-005` Staging environment and database identities are not production.
- [ ] `RC-STG-006` Two-league fixtures and roles are complete.

### Immutable `HL-20260822-1` RC-STG-006A Evidence Fence

- [ ] `RC-STG-006A` The `HL-20260822-1` fixture was prepared under the full
  hold by the exact release-bound CLI and typed confirmation recorded in
  Backup and Restore, then the identical CLI replayed. The sanitized results
  record `replayed: false` with the emitted positive `databaseWriteCount`, then
  `replayed: true` with `databaseWriteCount: 0`. Prepare mutated only the pinned
  source; the fresh target, its WAL/SHM sidecars, and activation receipt stayed
  absent until the selected abort execute. Preparation/replay passed, but the
  hosted gate did not begin before the strict-stop abort. This combined item
  remains unchecked; the emitted `actionableUntilMs` is closed evidence, not
  authority to resume.

The preceding RC-STG-006A state is closed historical evidence. Fresh
`HL-20260823-1` fixture preparation and exact replay now `PASS` only in its own
ledger with new release-bound receipt/fingerprint/deadline, dynamic `729` then
`0` writes, and held postflight proof. This does not check forward any helper,
unhold, action, smoke, restore, or activation gate.

- [ ] `RC-STG-007` Deployed CORS, cookies, CSRF, and Socket.IO tests pass.
- [ ] `RC-STG-008` Account email capture/sandbox flows pass.
- [ ] `RC-STG-009` NHL provider success/failure behavior passes.
- [ ] `RC-STG-010` Scheduled-job and restart behavior pass.
- [ ] `RC-STG-011` Backup and restore rehearsal pass.

### Immutable `HL-20260822-1` RC-STG-011A-J Evidence Fence

The following ten subitems preserve the closed helper/action/smoke/recovery
contract. They cannot satisfy, seed, or authorize any `HL-20260823-1` action.

- [ ] `RC-STG-011A` During the strict transfer smoke the global scheduler
  remained disabled. The release-only in-process
  `POST /api/v1/operations/release-qa/strict-manager-outbox` route mounted only
  on the exact source path with the pinned open-smoke environment/database,
  schema/checksum/build/season bindings, email disabled in capture mode, FAD
  routes open, and every debug/backup/provider boundary disabled or absent.
  Under full hold the target runtime/route was not composed and the maintenance
  server returned `503 SERVICE_MAINTENANCE`; with hold false, the restored
  target or binding drift left the route unmounted and returned `404`.
- [ ] `RC-STG-011B` Admin made the Team 1-to-B and Team 1-to-A proposals by
  direct authenticated API calls for league
  `60c82aa0-54f9-4c93-83f5-73b0d6d6f63e` and Team 1
  `ebc815c7-8a41-4326-8faf-04548aa91c76`, using exact proposal bodies for
  Manager B `c2684bf0-d30d-4b37-ae14-66620259798e` and Manager A
  `e9f723c4-32d2-4823-a1d4-233fe0ce2f45`. Those managers made the corresponding
  direct `{}` acceptance calls using the assignment IDs returned by the
  proposals. All four used credentialed cookies, current CSRF, allowed
  Origin/fetch metadata, exact bodies, and fixed keys
  `HL-20260822-1-team1-to-b-propose`,
  `HL-20260822-1-team1-to-b-accept`,
  `HL-20260822-1-team1-to-a-propose`, and
  `HL-20260822-1-team1-to-a-accept`.
- [ ] `RC-STG-011C` Manager B invoked phase `team1-to-manager-b` with
  confirmation `PUBLISH-HL-20260822-1-TEAM1-TO-MANAGER-B` and key
  `HL-20260822-1-outbox-team1-to-manager-b`; Manager A invoked phase
  `team1-return-to-manager-a` with confirmation
  `PUBLISH-HL-20260822-1-TEAM1-RETURN-TO-MANAGER-A` and key
  `HL-20260822-1-outbox-team1-return-to-manager-a`. Each exact body contained
  only deployed `backendBuildId`, confirmation, phase, and release
  `HL-20260822-1`; each fresh success reported exactly two target-event writes,
  canonical Socket.IO publication, and scheduler still disabled while Gamma,
  Team 2, jobs, and unrelated outbox state remained unchanged.
- [ ] `RC-STG-011D` Two independent cookie jars proved the T-132 physical-cache
  choreography. Counters mean distinct successful Query instances / physical
  evictions / successful replacements. Persistent Manager A moved from
  complete `1/0/0` to null `2/1/1` to complete `3/2/2`; Manager B moved from
  null `1/0/0` to complete
  `2/1/1`, then after sign-out/remount started complete `1/0/0` and ended null
  `2/1/1`. Publisher actions ran in separate same-cookie action tabs with
  separate QueryClients. Every settled checkpoint was loaded/idle; at each
  event each mounted jar's T-132 Query object was physically removed and
  replaced; T-131 and T-140 independently refetched/flipped; no money or raw
  payload was retained.
- [ ] `RC-STG-011E` No failed or crashed publisher invocation was retried. The
  workflow immediately re-held and selected abort recovery for any
  `failed`/`publishing` row. After the restored-path deploy, the selective
  publisher route was absent and no generic scheduler enablement was used.
- [ ] `RC-STG-011F` The temporary helper was published only as an additive
  `/release-qa/hl-20260822-1/` overlay on exact canonical origin
  `https://staging.hundoleago.com`, with exact extensionless browser entry
  point
  `https://staging.hundoleago.com/release-qa/hl-20260822-1/strict-manager-transfer`.
  Remote deployment checks passed, but the browser opened the physical
  `.html` path rather than that authorized entry point. The helper immediately
  returned `STRICT_STOP / ORIGIN_GUARD / EXACT_STAGING_ORIGIN_REQUIRED`; this
  browser-entry requirement failed and the composite item remains unchecked.
  Remote hashes nevertheless proved every
  path from
  baseline deploy `6a8a3880f946cc39a2bf2bb6` byte-identical, including
  frontend build `4dfe12d1366314e3d9df722c50771324647743c9`,
  `dist/index.html` SHA-256
  `90620768a37b57b905a35cd576077cd4c4f1a760da28fc8c1c8a9347458383ca`, and
  `dist/assets/index-BFtuYVmF.js` at `527839` bytes with SHA-256
  `19ee27ed0fa33016e9614b5dd63095b3f1d3af1fc8f33616b4c30a3c961cd201`.
  No Vite rebuild, application-source change, bundle replacement, or frontend
  build-ID change occurred. Helper/marker responses had exact release-specific
  `Cache-Control: no-store`, `Referrer-Policy: no-referrer`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `X-Robots-Tag: noindex, nofollow, noarchive`, and narrow-CSP headers. The
  response CSP included `frame-ancestors 'none'` and `object-src 'none'`; the
  HTML meta CSP omitted only the inapplicable `frame-ancestors` directive. No
  separate `netlify.app` origin was used. The single header authority was the
  exact temporary helper-scoped `netlify.toml` rule for
  `/release-qa/hl-20260822-1/*`; no helper `_headers` artifact existed, and the
  existing global and every non-helper route header rule/response remained
  unchanged.
- [ ] `RC-STG-011G` After the normal static document/script/style requests,
  helper initialization issued zero script-initiated API, fetch, XHR, or
  WebSocket requests and performed no write. Its only action-time reads were
  explicit session verification, the fresh session/CSRF and activation-marker
  checks required by a clicked write, exact read-only Team 1 precheck
  `GET /api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/teams/ebc815c7-8a41-4326-8faf-04548aa91c76`
  inside each clicked proposal, and exact read-only pending-assignment precheck
  `GET /api/v1/team-manager-assignments/<exact assignmentId emitted by the proposal>`
  inside each clicked acceptance. Those state/predecessor checks never ran on
  initialization or in the background. The inert initialization subgate passed
  through zero Render requests from `21:35Z` through `21:42Z`; no session or
  action-time read was attempted. Every POST would have required verified
  exact identity, write arming, and a separate action click, but no POST ran.
  The unexercised action-time portions keep this combined item unchecked.
- [ ] `RC-STG-011H` The separate same-cookie helper tab constructed an actual
  isolated TanStack Query `QueryClient` whose query cache contained exactly
  zero FAD queries before, during, and after every action. It mounted no
  `RealtimeProvider`, created no Socket.IO listener, and did not share the
  mounted FAD page's application QueryClient.
- [ ] `RC-STG-011I` The helper exposed exactly four fixed modes: Admin
  `propose-to-b` with `HL-20260822-1-team1-to-b-propose`; Manager B
  `accept-and-publish-to-b` with
  `HL-20260822-1-team1-to-b-accept` and
  `HL-20260822-1-outbox-team1-to-manager-b`; Admin `propose-to-a` with
  `HL-20260822-1-team1-to-a-propose`; and Manager A
  `accept-and-publish-to-a` with `HL-20260822-1-team1-to-a-accept` and
  `HL-20260822-1-outbox-team1-return-to-manager-a`. Publisher modes issued
  only one approved fresh call followed immediately by its identical replay.
- [ ] `RC-STG-011J` Immediately before every POST, including each publisher
  replay, the helper fetched exact canonical-origin
  `/release-qa/hl-20260822-1/enabled.json` with `cache: no-store`,
  `credentials: same-origin`, and `redirect: error`. It required status `200`,
  exact response URL, response type `basic`, media type `application/json`,
  and exactly `contractVersion: 1`, `enabled: true`, release
  `HL-20260822-1`, expiry `2026-08-24T07:00:00.000Z`, frontend build
  `4dfe12d1366314e3d9df722c50771324647743c9`, exact backend commit
  `8e313902feefcd683b0f5edd746a9dd2a9029a18`, frontend origin
  `https://staging.hundoleago.com`, and API origin
  `https://api-staging.hundoleago.com`, and failed before every POST at or
  after that exact expiry. After evidence capture, the exact audited baseline
  `netlify.toml` configuration was first restored by removing the temporary
  helper-scoped block, then the exact audited baseline `dist/` was redeployed
  without rebuilding. Original hashes and non-helper global headers re-passed,
  helper/marker paths resolved only through the normal SPA fallback, and that
  invalid marker response made every stale helper tab fail closed before
  another write. Cleanup passed through deploy `6a8b6b25126dabed39fa404d`
  and `10/10` retired-path checks. The combined item remains unchecked because
  neither smoke phase ran.

### Current `HL-20260823-1` Staging Boundary

The fresh release-specific counterparts through controlled-unhold runtime and
unheld pre-smoke verification passed as recorded in the live ledger. Phase one
then reached accepted/published state, but operator sequencing selected
`STRICT_STOP`; phase two never began. Full re-hold, exact abort-v2 B2
mint/publication and held deployment/runtime, and fresh B2-pinned verification
pass. The only pending executable counterpart is the exact abort-v2 plan;
execute/replay require accepted-plan evidence and a later amendment;
normal restore and phase two are forbidden. Helper retirement, activation,
verification/backup, and final review await a separate post-abort amendment.
The authoritative live ledger is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-23.md`.

- [ ] `RC-STG-012` Manual QA recommendation is pass.
- [ ] `RC-STG-013` Rollback rehearsal uses exact prior frontend/backend candidates.
- [ ] `RC-STG-014` No staging defect invalidates earlier evidence.
- [ ] `RC-STG-015` Candidate is frozen against unrelated change.
- [ ] `RC-STG-016` A controlled-clock two-league staging rehearsal proves the full initial seven-day FAD, one queued or fallback extension, one late-draft Week 1 adjustment, one completion-overrun adjustment, restart/replay safety, and the invariant that roster incompleteness or illegality alone does not move Week 1.

---

# Part 15 - Deployment Plan and Rollback Gate

- [ ] `RC-DPL-001` Exact Netlify site and intended deploy ID are recorded.
- [ ] `RC-DPL-002` Exact Render service and intended commit/deploy are recorded.
- [ ] `RC-DPL-003` Render production auto-deploy is planned `Off`.
- [ ] `RC-DPL-004` Netlify auto-publishing lock procedure is prepared.
- [ ] `RC-DPL-005` Release order matches `D0` through `D5`.
- [ ] `RC-DPL-006` Backend expansion remains compatible with currently published frontend.
- [ ] `RC-DPL-007` New frontend remains compatible with intended backend.
- [ ] `RC-DPL-008` Long-lived previous frontend behavior is handled.
- [ ] `RC-DPL-009` Maintenance requirement is decided.
- [ ] `RC-DPL-010` User communication/maintenance page is prepared when required.
- [ ] `RC-DPL-011` Exact health and read-only smoke requests are prepared.
- [ ] `RC-DPL-012` Exact frontend rollback deploy ID is prepared.
- [ ] `RC-DPL-013` Exact backend rollback deploy/commit is prepared.
- [ ] `RC-DPL-014` Backend rollback is compatible with current schema/data.
- [ ] `RC-DPL-015` Configuration rollback is documented separately.
- [ ] `RC-DPL-016` Database rollback or forward-recovery path is documented.
- [ ] `RC-DPL-017` Rollback triggers and decision owner are explicit.
- [ ] `RC-DPL-018` Sixty-minute observation owner is assigned.
- [ ] `RC-DPL-019` Next affected scheduled-job boundary is identified.

---

## Deployment Order

Complete:

```text
1.
2.
3.
4.
5.

Writes closed at:
Migration step:
Backend step:
Frontend step:
Read-only smoke step:
Writes reopened at:
Jobs resumed at:
First-write boundary crossed at:
Post-change backup:
```

---

## Rollback Plan

```text
Rollback decision owner:
Frontend rollback deploy ID:
Backend rollback deploy ID/commit:
Current schema compatible with old backend: yes/no
Configuration rollback:
Database recovery before first write:
Database recovery after first write:
Job/outbox/email handling:
Session/token handling:
Smoke after rollback:
Communication:
```

---

# Part 16 - Production Authorization Gate

Before authorization:

- [ ] `RC-AUT-001` Every applicable previous section is complete.
- [ ] `RC-AUT-002` Release status is `READY FOR AUTHORIZATION`.
- [ ] `RC-AUT-003` Exact commits, deploy IDs, schema, backup, window, and rollback are summarized for Grae.
- [ ] `RC-AUT-004` Open medium/low issues and limitations are summarized plainly.
- [ ] `RC-AUT-005` Production-changing actions are listed in order.
- [ ] `RC-AUT-006` Reset, migration, restore, secret, disk, domain, or deletion authority is requested separately when applicable.
- [ ] `RC-AUT-007` Grae explicitly authorizes this identified production release.
- [ ] `RC-AUT-008` Approval time and exact scope are recorded.
- [ ] `RC-AUT-009` Release status changes to `GO AUTHORIZED`.

Approval record:

```text
Release ID:
Approved production actions:
Explicit exclusions:
Approved by: Grae
Approval time:
Authority expires or must be reconfirmed when:
```

Material change after approval returns the release to `READY FOR AUTHORIZATION`.

---

# Part 17 - Production Execution Gate

## Before First Change

- [ ] `RC-EXE-001` Current production frontend and backend IDs are recorded.
- [ ] `RC-EXE-002` Current schema, database ID suffix, job state, and health are recorded.
- [ ] `RC-EXE-003` Current backup remains verified.
- [ ] `RC-EXE-004` No overlapping deploy or protected operation is active.
- [ ] `RC-EXE-005` Netlify publishing is locked.
- [ ] `RC-EXE-006` Render auto-deploy is off.
- [ ] `RC-EXE-007` Operator confirms `GO AUTHORIZED`.

---

## Maintenance and Database

When applicable:

- [ ] `RC-EXE-008` Maintenance communication is active.
- [ ] `RC-EXE-009` Backend maintenance/write block is active.
- [ ] `RC-EXE-010` Jobs, auctions, email, and outbox dispatch are paused.
- [ ] `RC-EXE-011` No in-flight mutation remains.
- [ ] `RC-EXE-012` Fresh pre-change backup is verified.
- [ ] `RC-EXE-013` Migration plan matches approved IDs/checksums.
- [ ] `RC-EXE-014` Migration/import executes once.
- [ ] `RC-EXE-015` Ledger, integrity, foreign keys, identity, and reconciliation pass.
- [ ] `RC-EXE-016` Failure has not crossed an undocumented first-write boundary.

---

## Backend

- [ ] `RC-EXE-017` Render deploy targets exact approved backend commit.
- [ ] `RC-EXE-018` Build log shows expected Node, lockfile, and commands.
- [ ] `RC-EXE-019` Persistent-disk service restart completes.
- [ ] `RC-EXE-020` Liveness passes.
- [ ] `RC-EXE-021` Readiness passes with expected environment, build, schema, and database identity.
- [ ] `RC-EXE-022` Writes and jobs remain closed until smoke gate when required.
- [ ] `RC-EXE-023` Old frontend remains contract-compatible.

---

## Frontend

- [ ] `RC-EXE-024` Netlify deploy targets exact approved frontend commit.
- [ ] `RC-EXE-025` Build log shows expected Node, lockfile, and commands.
- [ ] `RC-EXE-026` Built assets contain only approved public configuration.
- [ ] `RC-EXE-027` Exact atomic deploy is published.
- [ ] `RC-EXE-028` Production domain serves expected deploy ID.
- [ ] `RC-EXE-029` Frontend targets approved backend origin.
- [ ] `RC-EXE-030` SPA direct routes and static assets load.

If any required item fails, stop and evaluate rollback before reopening writes.

---

# Part 18 - Production Smoke and Reopen Gate

## Automated Read-Only Smoke

- [ ] `RC-SMK-001` Production frontend root and static assets load.
- [ ] `RC-SMK-002` `GET /api/v1/health/live` returns minimal liveness.
- [ ] `RC-SMK-003` `GET /api/v1/health/ready` returns minimal readiness.
- [ ] `RC-SMK-004` Approved public league metadata loads.
- [ ] `RC-SMK-005` Approved public roster loads.
- [ ] `RC-SMK-006` Public responses contain no internal path, database filename, secret, or private state.
- [ ] `RC-SMK-007` Read-only proof shows no league-domain mutation.
- [ ] `RC-SMK-008` No automated smoke account, bid, trade, activity, job, backup, or restore is created.

Example safe requests:

```powershell
curl.exe -fsS https://<backend-origin>/api/v1/health/live
curl.exe -fsS https://<backend-origin>/api/v1/health/ready
curl.exe -fsS https://<frontend-origin>/
```

The release plan supplies approved public league/team IDs without placing private IDs in a public record.

---

## Closed Authenticated Smoke

When maintenance remains active, an authorized operator verifies:

- [ ] `RC-SMK-009` Fresh sign-in/session bootstrap works.
- [ ] `RC-SMK-010` One representative authorized read per affected feature works.
- [ ] `RC-SMK-011` Cross-league request fails safely.
- [ ] `RC-SMK-012` Socket.IO authenticates and joins only authorized rooms.
- [ ] `RC-SMK-013` Active competing bids are not exposed.
- [ ] `RC-SMK-014` Operational health shows expected build, schema, job, statistics, and backup state.

No fake production mutation is used.

---

## Reopen

- [ ] `RC-SMK-015` Outbox/email dispatch is resumed deliberately.
- [ ] `RC-SMK-016` Scheduled occurrences and stale leases are reconciled.
- [ ] `RC-SMK-017` Jobs resume once without duplicate advancement.
- [ ] `RC-SMK-018` Manager/commissioner writes reopen.
- [ ] `RC-SMK-019` Maintenance mode is disabled.
- [ ] `RC-SMK-020` An authorized normal real-user action is recorded separately when required.
- [ ] `RC-SMK-021` First authoritative post-release write time is recorded.
- [ ] `RC-SMK-022` First-write boundary status is recorded.
- [ ] `RC-SMK-023` Post-migration/post-release backup is created and verified when applicable.

---

# Part 19 - Monitoring and Closeout

## Observation

- [ ] `RC-MON-001` HTTP error rate and latency remain within approved baseline.
- [ ] `RC-MON-002` No unexpected process restart occurs.
- [ ] `RC-MON-003` SQLite busy, transaction, integrity, and disk signals remain healthy.
- [ ] `RC-MON-004` Authentication and rate-limit anomalies are reviewed.
- [ ] `RC-MON-005` Socket.IO connection and authorization failures are normal.
- [ ] `RC-MON-006` Scheduled-job delay, overlap, and failure are normal.
- [ ] `RC-MON-007` Outbox backlog and email failures are normal.
- [ ] `RC-MON-008` NHL refresh remains healthy or preserves last valid data.
- [ ] `RC-MON-009` Latest backup age remains inside RPO.
- [ ] `RC-MON-010` Financial, ownership, matchup, and standings spot totals remain expected.
- [ ] `RC-MON-011` Active observation lasted at least 60 minutes.
- [ ] `RC-MON-012` Next affected scheduled-job boundary passed or has a named follow-up owner.

---

## Closeout

- [ ] `RC-CLS-001` Final frontend/backend deploy IDs are recorded.
- [ ] `RC-CLS-002` Final schema and migration checksum set are recorded.
- [ ] `RC-CLS-003` Final backup ID and verification are recorded.
- [ ] `RC-CLS-004` Maintenance start/end and first-write boundary are recorded.
- [ ] `RC-CLS-005` Production smoke results are recorded.
- [ ] `RC-CLS-006` Open issues and owners are recorded.
- [ ] `RC-CLS-007` Rollback evidence remains retained.
- [ ] `RC-CLS-008` Release notes are understandable to managers/commissioners when needed.
- [ ] `RC-CLS-009` Documentation status is updated when implemented state changed.
- [ ] `RC-CLS-010` Release reviewer confirms record completeness.
- [ ] `RC-CLS-011` Release status changes to `COMPLETE`.

---

## Completion Summary

```text
Release ID:
Outcome: COMPLETE / ROLLED BACK / FAILED
Frontend deploy:
Backend deploy:
Schema:
Backup:
Maintenance duration:
First-write boundary:
Automated smoke:
Authenticated smoke:
Observation duration:
Scheduled-job boundary:
Defects opened:
Defects remaining:
Follow-up owners:
Technical operator:
Release reviewer:
Completed at:
```

---

# Part 20 - Rollback Checklist

## Trigger

- [ ] `RC-RBK-001` Rollback trigger and evidence are recorded.
- [ ] `RC-RBK-002` Writes/jobs/outbox are closed when data safety requires it.
- [ ] `RC-RBK-003` Current failed state is preserved.
- [ ] `RC-RBK-004` First-write boundary is identified.
- [ ] `RC-RBK-005` Rollback decision owner is identified.

---

## Frontend

- [ ] `RC-RBK-006` Netlify publishing remains locked.
- [ ] `RC-RBK-007` Exact prior verified atomic deploy is published.
- [ ] `RC-RBK-008` Prior frontend is compatible with current backend.
- [ ] `RC-RBK-009` Read-only smoke passes.

---

## Backend

- [ ] `RC-RBK-010` Exact prior Render deploy/commit is selected.
- [ ] `RC-RBK-011` Prior backend is compatible with current schema/data/configuration.
- [ ] `RC-RBK-012` Operator does not assume persistent disk is rolled back.
- [ ] `RC-RBK-013` Backend liveness/readiness and old-frontend compatibility pass.

---

## Database and External Effects

- [ ] `RC-RBK-014` Pre-first-write migration rollback follows SQLite Migration.
- [ ] `RC-RBK-015` Post-first-write recovery uses forward correction or Backup and Restore.
- [ ] `RC-RBK-016` No stale JSON is reactivated after new SQLite writes.
- [ ] `RC-RBK-017` Sessions/tokens are revoked when restore requires it.
- [ ] `RC-RBK-018` Jobs, outbox, and email are reconciled.
- [ ] `RC-RBK-019` Configuration is restored separately.
- [ ] `RC-RBK-020` Post-rollback backup and evidence are retained.
- [ ] `RC-RBK-021` Release status changes to `ROLLED BACK`.

---

# Part 21 - Documentation-Only Release

For `D0`, applicable minimum:

- [ ] `RC-D0-001` Diff contains documentation only.
- [ ] `RC-D0-002` No hosted build input, configuration, dependency, source, or data file changed.
- [ ] `RC-D0-003` Markdown structure and local references pass.
- [ ] `RC-D0-004` Status/index/roadmap cross-references are reconciled.
- [ ] `RC-D0-005` No secret-like value is present.
- [ ] `RC-D0-006` Verification commands are accurate.
- [ ] `RC-D0-007` Normal repository review/merge is complete.
- [ ] `RC-D0-008` Netlify and Render deployment is recorded as not required.

The runtime, database, backup, manual QA, and production gates are `NOT APPLICABLE` only because no runtime input changed.

---

# Part 22 - Emergency Release

For `D5`:

- [ ] `RC-EMG-001` Incident ID and production impact are recorded.
- [ ] `RC-EMG-002` Change is the smallest safe correction.
- [ ] `RC-EMG-003` Unrelated cleanup is excluded.
- [ ] `RC-EMG-004` Focused reproduction and regression test pass.
- [ ] `RC-EMG-005` Staging or equivalent isolated verification passes when technically possible.
- [ ] `RC-EMG-006` Current backup is verified when data risk exists.
- [ ] `RC-EMG-007` Security and league-isolation boundaries still pass.
- [ ] `RC-EMG-008` Exact deploy and rollback IDs are recorded.
- [ ] `RC-EMG-009` Grae explicitly authorizes the emergency production action.
- [ ] `RC-EMG-010` Read-only smoke and active observation pass.
- [ ] `RC-EMG-011` Skipped normal evidence has reason, risk, owner, and deadline.
- [ ] `RC-EMG-012` Retrospective review and permanent fix are scheduled.

Emergency does not authorize improvised data repair or restore.

---

# Part 23 - Final Go/No-Go

## Recommendations

```text
Manual QA:         PASS / FAIL / INCOMPLETE
Security review:   PASS / FAIL / INCOMPLETE
Technical review:  PASS / FAIL / INCOMPLETE
Recovery review:   PASS / FAIL / INCOMPLETE
Release reviewer:  GO / NO-GO
Grae authority:    AUTHORIZED / NOT AUTHORIZED
```

---

## Go Conditions

`GO` requires:

* every applicable checklist item passed;
* every non-applicable/deferred item justified;
* no critical/high defect;
* all medium issues explicitly dispositioned;
* exact staging evidence applies to exact production commits;
* backup and restore gates pass;
* migration and rollback boundaries are understood;
* production actions are listed;
* Grae explicitly authorizes the identified release.

---

## No-Go Conditions

Set `NO-GO` when:

* a required test or manual case is missing;
* builds or deploy IDs are ambiguous;
* environment isolation is unproved;
* frontend/backend/schema compatibility is unproved;
* critical/high security or data risk exists;
* backup/restore evidence is insufficient;
* migration reconciliation differs;
* rollback cannot be executed safely;
* production authority is absent or no longer matches the release;
* the release changed after approval.

There is no penalty for a correct no-go decision.

---

## Stop Conditions During Execution

Stop immediately when:

* the wrong service, site, branch, commit, environment, disk, or database is targeted;
* production and staging identity differ from the record;
* an unexpected migration appears;
* a backup or integrity check fails;
* a secret appears in logs or browser assets;
* a cross-league access or permission bypass succeeds;
* writes continue during required maintenance;
* data reconciliation changes unexpectedly;
* jobs, auctions, matchups, outbox, or email duplicate;
* the first-write boundary is crossed unexpectedly;
* a rollback target is incompatible.

Preserve evidence and follow the rollback or incident procedure.

---

# Verification

Documentation verification:

```powershell
Get-Content docs/07-testing/RELEASE_CHECKLIST.md
Select-String -Path docs/07-testing/RELEASE_CHECKLIST.md -Pattern '^`APPROVED`$','^`NOT EVALUATED`$','RC-SRC-001','RC-BKP-001','RC-AUT-001','Production Smoke','Final Go/No-Go'
```

Expected:

* the template is approved and active, but no release is automatically ready;
* production requires Grae's explicit authorization;
* automated production smoke remains read-only;
* code, configuration, and database rollback remain separate;
* documentation creation changes no runtime or production state.
