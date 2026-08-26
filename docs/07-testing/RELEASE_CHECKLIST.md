# Hundo Leago - Release Checklist

## Document Status

`APPROVED`

## Checklist Status

`ACTIVE`

## Release Readiness

`HL-20260823-1 PHASE ONE PUBLISHED; OPERATOR-SEQUENCING STRICT STOP; PHASE TWO NOT STARTED; FULL RE-HOLD PASS; ABORT-V2 B2 HELD DEPLOY/RUNTIME PASS; ABORT-V2 PLAN/FIRST EXECUTE/REPLAY PASS + AUTHORITIES CONSUMED; HELPER RETIREMENT PASS + AUTHORITY CONSUMED + NO RETRY; E855 V1 O23 REJECTED BEFORE PRE + UNCONSUMED + ZERO PROVIDER CALL; 3F0BC V2 O23 ARM REJECTED + UNCONSUMED + NO RETRY + ZERO PROVIDER MUTATION; 43E99 V3 O23 ACTION SUCCEEDED + AUTHORITY CONSUMED + EXACTLY ONE PROVIDER MUTATION; OLD V3 POST PERMANENTLY BLOCKED SOLELY BY ABSENT HOSTED NPM 11.11.0 OBSERVATION; O23 ACCEPTANCE PENDING UNCHECKED O23A; RC-STG-006O23A V4 READ-ONLY CONTINUATION AUTHORIZED NEXT AFTER DIRECT-CHILD PUBLICATION+BINDING + ZERO V4 PROVIDER MUTATIONS; RC-STG-006P23 SEMANTIC VERIFICATION/BACKUP AND LATER GATES NOT AUTHORIZED; PRODUCTION NOT EVALUATED`

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

## 2026-08-23 M7-26 Fresh Strict Release (V3 ACTION SUCCEEDED; O23 ACCEPTANCE PENDING O23A; V4 READ-ONLY CONTINUATION AUTHORIZED NEXT)

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
is materialized and verified at `37105664` bytes / SHA-256 `cf3ca07d...`; at
that first-execute boundary the target was inactive. V3 later selected it; the
receipt remains byte-unchanged at `4991` bytes / SHA-256 `24adf2d...`, while
semantic target verification remains deferred. Bound backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` has exact
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
worktree is clean. Activated exact-B2 API deploy
`dep-da7d857avr4c73bnna90` is sole newest/`LIVE`; prior B2 deploy
`dep-da6ghj67bikc738hbbv0` is deactivated and normal auto-deploy remains
`no`/trigger off. Hosted `3,519/3,519`, build/startup, zero-error, and held
external probes pass; source/target boundary acceptance remains pending O23A.
Netlify current/newest `ready` deploy is helper-retirement baseline
`6a8e6c8fae36273a816a7539`.

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
- [x] `RC-STG-006L23` One exact abort-v2 plan ran once after the fresh-shell
  guards and passed with exit `0`, code `RELEASE_QA_STRICT_RESTORE_ABORT_PLANNED`,
  contract `2`, and exact plan ID
  `release-qa-strict-restore-abort-v2-03f37c3c16ee7cc632c49a6b87f23819b398146fd8a0fe1c6aff5cbdcca47456`.
  Raw stdout is `4777` bytes / SHA-256 `cef33b8f...`; canonical result is `4146`
  bytes / `30441740...`; cleanup-aware metadata is `1809` bytes /
  `ec338025...`; stderr is empty. Exact `main-wal`, WAL/family/classifier,
  `targetState: "absent"`, and mutation counts `0/0` pass. Its
  `temporaryFilesystemWork` is exact:
  `performed: true`, `plaintextDatabaseMaterialized: true`, deterministic path
  `/opt/render/project/data/hundo-staging/sqlite/.hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3.strict-restore-work-v1`,
  `retained: false`, `processLocalCleanup: "verified"`, and
  `abruptTerminationRecovery: "fail-closed-at-deterministic-work-directory"`.
  Postflight retained exact main/WAL/SHM on current device `66313`, inodes
  `131156` / `131151` / `131152`; seven processes / `65` descriptors / zero
  holders passed. Source journal, target family/journal, receipt, and work were
  absent; verified remote captures were removed after local verification.
- [x] `RC-STG-006M23` `PASS / AUTHORITY CONSUMED / NO RERUN`: published
  execute-only authority `fd31b1f41b7c16521cf0eceb2c4af4a33a242636`
  dispatched exactly one `969`-byte / SHA-256 `bad1c78f...` command. Native
  wrapper status was numeric `0`; stdout/stderr/result are `4902` /
  `74610bcc...`, `0` / `e3b0c442...`, and `3896` / `3d67f676...`. Result
  `RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED` passed at contract `2`,
  `replayed: false`, `0/2`, exact source-family preservation, target
  `cf3ca07d...`, receipt `24adf2d...`, and performed/materialized temporary-
  work object. The auxiliary status artifact is the sealed literal three-byte
  `0\n` / `101770a4...` serialization defect, not an LF; it was not repaired.
  Native status, complete output, and postflight make execution unambiguous.
  Envelope `7318` / `14733405...`, postflight `2059` / `fdd169d5...`, held
  probes `1136` / `2d634d0d...`, cleanup `928` / `299496df...`, and metadata
  `5566` / `59cb7e89...` bind exact target/receipt, unchanged source family,
  sidecar/journal/work absence, zero holders, full hold, and capture removal.
  First-execute authority is consumed and cannot be rerun.
- [x] `RC-STG-006M23-REPLAY` `PASS / AUTHORITY CONSUMED / NO RERUN`: exact
  action-preflight script/result are `9561` / `2837` bytes with SHA-256
  `7f9f378a7bcce15deea7ab26d24f19fe2702ef78080bae45b8203186dd0227cf` /
  `b454c5a6b8279d9d389a846f725e978638145524a7732a14ccf6236ac3660bec`.
  They bound exact B2, `20` runtime keys, nine provider absences, three stable
  snapshots, and two ten-process/`92`-descriptor zero-denied/zero-holder scans.
  The same `969`-byte / `bad1c78f...` command dispatched exactly once; native
  status was numeric `0`. Wrapper/envelope are `4098` / `7349` bytes with
  SHA-256 `95cf1aa5...` / `63e4e662...`. Stdout is `4905` bytes / five LF /
  `65431c4c...`; stderr is empty / `e3b0c442...`; replay status is exact
  `2` bytes / one LF / hex `30 0a` / base64 `MAo=` / `9a271f2a...`.
  Canonical result is `3899` bytes / `8b21edc8...` and passed
  `RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED`, contract `2`,
  `replayed: true`, `0/0`, exact six-field no-work object, unchanged source
  family, and byte-identical target/receipt. No object/key/restore/write work
  occurred. The first-execute three-byte literal `0\n` wart remains sealed and
  unrepaired.
  Postflight script/result are `12559` / `3047` bytes with SHA-256
  `c2e034de...` / `07ad847d...`; three snapshots, five absences, exact captures,
  and two ten-process/`92`-descriptor zero-denied/zero-holder scans passed.
  Anonymous probe result `995` bytes / `a31a8877...` returned live/ready `200`,
  session/leagues/current-FAD `503 SERVICE_MAINTENANCE`, `no-store`, and no
  `Set-Cookie`. Render remained sole-newest/`LIVE` exact-B2 deploy
  `dep-da6ghj67bikc738hbbv0`, with no newer/pending deploy, auto-deploy off,
  and zero error/`5xx` logs; Netlify remained unchanged ready deploy
  `6a8c006abe46c8fb6269c40c`, six headers/two redirects/zero functions.
  Cleanup script/result are `11629` / `4023` bytes with SHA-256
  `9a908635...` / `67b1adbe...`; exact-path unlink removed only the three
  captures and protected files stayed stable. Final metadata is `6012` bytes /
  `b2f706da...`, code `HL23_ABORT_V2_REPLAY_EVIDENCE_COMPLETE`. Replay
  authority is consumed; no rerun.
- [x] `RC-STG-006N23` `PASS / AUTHORITY CONSUMED / NO RETRY`:
  helper-retirement-only dispatch authority was
  published in exact commit `7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb`, based
  on replay-evidence commit `296cd690382b87a1cd4647ca98a24f14e98ee8ff`.
  Exactly one staging Netlify CLI publication was authorized and dispatched;
  it must not be retried. The consumed contract required site
  `95af8aa7-0b13-4954-af6d-855762acb147` and first required proof that
  then-current/ready helper deploy `6a8c006abe46c8fb6269c40c` remained exact,
  with title `HL-20260823-1-strict-helper-e898e72`, six headers/two redirects,
  and zero functions/edge functions. The new title had to be exactly
  `HL-20260823-1-abort-v2-retire-helper-baseline`.
  The deploy input is immutable original-dist `33` files / `1932120` bytes /
  canonical inventory SHA-256
  `2d8069ca1aa61e02b5be14b09b97ded73b8363ae5e699c0e712f32026903ae6c`.
  The CLI config input is application F's exact baseline `netlify.toml` blob,
  `1664` bytes / `37` LF / zero CR / SHA-256
  `7720d21350b54735e11c86fd6fd4282887c7ce6e92b7d33ce9fdf788f66db422`,
  with five header rules. Do not edit tracked `netlify.toml`, helper source, or
  original-dist; do not rebuild.
  The pre-dispatch requirements below are retained solely as the consumed
  dispatch contract; their imperative wording grants no new action authority.
  A new ignored, local-only preflight must be authored, frozen, and cold-audited
  before dispatch. It must independently verify original-dist and frozen source
  config
  `E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-control\netlify.toml`,
  prove existing plain non-reparse `E:\Codex`, and prove `E:\Codex\temp` absent.
  The tracked helper-era retired-baseline verifier is not authority.
  The wrapper exclusively creates owned `E:\Codex\temp`, external runtime
  control `E:\Codex\temp\HL-20260823-1-helper-retirement-control-v1`, and separate
  profile `E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`. Each created
  directory and file owner SID must equal the wrapper process user SID. At CLI
  start, control inventory is only the copied regular non-reparse `netlify.toml`
  at `1664` bytes / `37` LF / zero CR / five headers / SHA-256
  `7720d21350b54735e11c86fd6fd4282887c7ce6e92b7d33ce9fdf788f66db422`,
  and all six CLI-scanned function/edge paths are absent.
  The shell-free route pins portable Node `24.14.1` at
  `E:\hundo-leago\.tools\node-v24.14.1-win-x64\node.exe` (`91426304` bytes /
  `58e74bf02fc5bbacc41dcb8bef089961cd5bddd37830b87784e4fc624d145d1f`)
  and directly executes global Netlify CLI `27.0.0`
  `C:\Users\graem\AppData\Roaming\npm\node_modules\netlify-cli\bin\run.js`.
  The CLI package is `7358` bytes /
  `b5f0e60f06b774e0d087c735557e19f47ec25c56e9d5695b045f28a188e56156`;
  `bin/run.js` is `2800` bytes /
  `e39432e46703049b6769e17c0a7a8f1748c345100a1f934d8a6c7076001d426c`.
  npm/npx, shell, PATH-based CLI resolution, alternate runtimes, `--cwd`, and an
  empty `.git` sentinel are forbidden. CLI deploy exposes no `--config`; the
  physical/logical cwd and config/repository-root discovery must resolve to the
  external control. Bind `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`,
  `TMP`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `XDG_DATA_HOME`, `XDG_STATE_HOME`,
  and `XDG_RUNTIME_DIR` to fresh
  E-scoped external profile
  `E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`
  with `CI=1`. `NETLIFY_AUTH_TOKEN` is permitted only in the child environment
  in memory, never in argv, captures, or persistent files.
  The exact argument vector is
  `deploy --site 95af8aa7-0b13-4954-af6d-855762acb147 --dir E:\hundo-leago\.netlify\strict-release-HL-20260823-1\original-dist --no-build --skip-functions-cache --prod --message HL-20260823-1-abort-v2-retire-helper-baseline --json`.
  Exact repo-ignored capture root
  `E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-captures`
  must be absent and exclusively acquired as the one-shot dispatch lock; any
  residue consumes authority and forbids retry.
  The helper-retirement action preflight process environment has exactly the
  eight keys `SystemRoot,WINDIR,ComSpec,PATHEXT,PATH,CI,NO_COLOR,NO_UPDATE_NOTIFIER`.
  `SystemRoot`, `WINDIR`, `ComSpec`, and `PATHEXT` are copied exactly from the
  wrapper process, with respective fallbacks `C:\Windows`, `C:\Windows`,
  `C:\Windows\System32\cmd.exe`, and `.COM;.EXE;.BAT;.CMD`; `PATH` is exactly
  `C:\Program Files\Git\cmd;C:\Windows\System32;C:\Windows`, and the constants
  are `CI=1`, `NO_COLOR=1`, and `NO_UPDATE_NOTIFIER=1`. The deploy child
  environment has exactly the 22 keys
  `SystemRoot,WINDIR,ComSpec,PATHEXT,PATH,CI,NO_COLOR,TERM,NETLIFY_TELEMETRY_DISABLED,NO_UPDATE_NOTIFIER,NETLIFY_AUTH_TOKEN,HOME,USERPROFILE,APPDATA,LOCALAPPDATA,TEMP,TMP,XDG_CONFIG_HOME,XDG_CACHE_HOME,XDG_DATA_HOME,XDG_STATE_HOME,XDG_RUNTIME_DIR`.
  Its five system/path values are byte-identical to preflight; its constants are
  `CI=1`, `NO_COLOR=1`, `TERM=dumb`, `NETLIFY_TELEMETRY_DISABLED=1`, and
  `NO_UPDATE_NOTIFIER=1`. All eleven of `HOME`, `USERPROFILE`, `APPDATA`,
  `LOCALAPPDATA`, `TEMP`, `TMP`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`,
  `XDG_DATA_HOME`, `XDG_STATE_HOME`, and `XDG_RUNTIME_DIR` equal exact external
  profile `E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`.
  `NETLIFY_AUTH_TOKEN` is memory-only in that exact child environment; every
  unlisted variable is absent.
  Persisted provider evidence is an allowlisted projection only; persisting raw
  `getSite` or any other raw provider payload is forbidden. Both phases have
  the exact top-level key set
  `code,observedAt,releaseId,frontendAuthorityCommit,netlify,render,safety`.
  PRE `netlify` keys are exactly
  `siteId,siteName,canonicalOrigin,netlifyOrigin,currentDeployId,currentDeployTitle,currentDeployState,currentDeployPublishedAt,currentDeployOrigin,currentIsNewest,noPendingDeploy,headers,redirects,functions,edgeFunctions,buildSettings,automaticPublishFence,retirementTitleAbsent,activeDeployCount,inspectedDeployCount,newestFirst`;
  POST `netlify` keys are exactly
  `siteId,siteName,canonicalOrigin,netlifyOrigin,currentDeployId,currentDeployTitle,currentDeployState,currentDeployPublishedAt,currentDeployOrigin,currentIsNewest,noPendingDeploy,previousHelperDeployId,previousHelperNoLongerCurrent,retirementTitleMatchCount,activeDeployCount,headers,redirects,functions,edgeFunctions,buildSettings,automaticPublishFence,deployMethod,inspectedDeployCount,newestFirst`.
  Both `render` projections have exactly
  `workspaceId,serviceId,deployId,commit,state,soleNewestLive,noNewerOrPendingDeploy,autoDeploy,autoDeployTrigger,maintenanceHold,databasePath,targetInactive,applicationErrorLogs,request5xxLogs`.
  PRE `safety` keys are exactly
  `fullHold,replayAuthorityConsumed,replayRerunAuthorized,normalRestoreAuthorized,activationAuthorized,backupAuthorized,stagingReopenAuthorized,productionAuthorized`;
  POST `safety` keys are exactly
  `fullHold,helperRetirementComplete,replayAuthorityConsumed,replayRerunAuthorized,normalRestoreAuthorized,activationAuthorized,backupAuthorized,stagingReopenAuthorized,productionAuthorized`.
  PRE must prove `currentIsNewest=true`, `noPendingDeploy=true`,
  `retirementTitleAbsent=true`, `activeDeployCount=0`, `inspectedDeployCount=50`,
  and `newestFirst=true`. POST must prove `currentIsNewest=true`,
  `noPendingDeploy=true`, `previousHelperDeployId=6a8c006abe46c8fb6269c40c`,
  `previousHelperNoLongerCurrent=true`, `retirementTitleMatchCount=1`,
  `activeDeployCount=0`, `inspectedDeployCount=50`, `newestFirst=true`, and
  `deployMethod=manual-cli`. PRE safety has `fullHold=true` and
  `replayAuthorityConsumed=true`; every authorization field is false. POST adds
  `helperRetirementComplete=true` and leaves those safety values unchanged.
  The exact ordered HTTP `8/8` matrix is the canonical origin
  `https://staging.hundoleago.com` followed by the new immutable origin
  `https://<deployId>--hundoleago-staging.netlify.app`, each in path order `/`,
  `/index.html`, `/assets/index-BFtuYVmF.js`, and
  `/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e`. Every response is `200` and
  has no `Set-Cookie`; `/`, `/index.html`, and the league path have exact
  `Cache-Control: no-store`, while the asset has exact
  `Cache-Control: public, max-age=31536000, immutable`. Every response must carry
  the exact seven-header map whose canonical SHA-256 is
  `a1ade439bda16fafea1afdd1360bb9ec906e598fc48ca989b7b5ffc6c3af0245`:
  `content-security-policy=default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://api-staging.hundoleago.com https://hundo-leago-backend-staging.onrender.com https://api.hundoleago.com https://hundo-leago-backend.onrender.com; media-src 'self' data: blob:; connect-src 'self' https://api-staging.hundoleago.com wss://api-staging.hundoleago.com https://hundo-leago-backend-staging.onrender.com wss://hundo-leago-backend-staging.onrender.com https://api.hundoleago.com wss://api.hundoleago.com https://hundo-leago-backend.onrender.com wss://hundo-leago-backend.onrender.com; worker-src 'self' blob:; upgrade-insecure-requests`,
  `cross-origin-opener-policy=same-origin`,
  `cross-origin-resource-policy=same-origin`,
  `permissions-policy=camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()`,
  `referrer-policy=strict-origin-when-cross-origin`,
  `x-content-type-options=nosniff`, and `x-frame-options=DENY`.
  The action gate also binds a fresh held-probe matrix under
  `https://api-staging.hundoleago.com`: `/api/v1/health/live` and
  `/api/v1/health/ready` each return `200` with exact body `{"status":"ok"}`;
  `/api/v1/session`, `/api/v1/leagues`, and
  `/api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/free-agent-draft/f47032fd-57a2-443b-89a6-ce32894f2fc1`
  each return `503` with exact body
  `{"error":{"code":"SERVICE_MAINTENANCE","message":"Service is temporarily unavailable."}}`.
  All five have a `Content-Type` whose media type begins `application/json`, exact
  `Cache-Control: no-store`, and no `Set-Cookie`.
  Preflight and postflight require Netlify `build_settings` exact `{}`; repo
  URL/branch, build command, publish directory, and `stop_builds` absent or
  null; unchanged Render exact-B2 full hold; source `DATABASE_PATH`; and
  inactive target/receipt. The site has no Git build linkage. Dispatch consumes
  authority regardless of CLI outcome; no blind retry is allowed.
  Success requires exactly one new current/ready CLI deploy with five headers,
  two redirects, zero functions and zero edge functions; `64/64` baseline bytes, `8/8`
  baseline headers, and `10/10` retired helper paths across canonical and
  immutable origins; then mandatory stop. Any preflight mismatch means no
  deploy; any post-dispatch failure or ambiguity requires read-only provider
  reconciliation and another amendment.
  Only after provider/HTTP/capture/postflight evidence is accepted may cleanup
  remove the exact external control and profile, then owned `E:\Codex\temp` only
  if empty. It must preserve source config, original-dist, captures, and provider/
  HTTP evidence; no broad cleanup or empty `.git` sentinel is authorized.
  Published incident amendment
  `0498fd4fd400e8aad16c4cf9c405165d420bd489` permitted only the evidence-only
  continuation. Refreshed provider postflight is `1862` bytes / `1` LF / zero
  CR / final LF / SHA-256
  `68cd773b3e2f104d71f8c96ce299eea7d89f542d8e5f449f33da4327100f9acd`.
  Exactly one corrected official HTTP result completed at
  `2026-08-26T05:25:45.785Z`: `23014` bytes / `1` LF / zero CR / final LF /
  SHA-256
  `d0ef4d2ed2cf848fbec5959012c929c36a2ea3d74f684d836a6d809fe6d76d46`,
  passing `64/64` baseline bytes, `8/8` normal headers, `10/10` retired helper
  paths, and `5/5` held backend probes with no cookies sent and no writes
  attempted. Local postflight completed at `2026-08-26T05:26:25.700Z`:
  `4837` bytes / `1` LF / zero CR / final LF / SHA-256
  `6941c238289713ee3012a2abe868380dd240c46a8a44ff06e5a7a36c7c7ed4a8`.
  Exact cleanup completed at `2026-08-26T05:33:33.808Z`: `1211` bytes / `1`
  LF / zero CR / final LF / SHA-256
  `b49aca2fa65c2039c5b6e4661e9cf981dd9f29b9a1fdfaddac779609bca00c78`.
  It removed only the exact external profile, runtime control, and empty owned
  temp parent; repo-ignored baseline control, original-dist, captures, and
  evidence remain preserved. The two false negatives, diagnostic,
  reconstructed-manifest chronology, and current corrected kit pins remain
  evidence. Exactly one dispatch ran, no retry ran or is authorized, and deploy
  `6a8e6c8fae36273a816a7539` remains current/newest/`ready`. Mandatory stop.
- [ ] `RC-STG-006O23` V1 `REJECTED BEFORE PRE / UNCONSUMED / ZERO PROVIDER
  CALL`: published commit `e855be9e1a4d92cd6428175965ecf934653ae965`
  omitted exact frozen artifact paths and action control rejected it with
  `AUTHORITY_DOCS_DO_NOT_PIN_FROZEN_KIT`. It never armed; no provider dispatch,
  browser shell input, shell verifier invocation, capture arm, or root activation
  mutation occurred. Every V1 pin/procedure below is immutable historical
  evidence only and permanently non-authorizing. N23 remains consumed.

  Frozen ignored pins are manifest `7290` bytes / `203` LF / zero CR / final
  LF / SHA-256
  `0d3c5f2e1500b239efcf086818f6446ed31ab25f830ea951bacb4a5f8fc582af`
  and canonical artifact-set SHA-256
  `0ef3f7d87792727d321f938efd41ef5bf637f61fe155e64770a9b4e7bf556ee0`.
  Every manifest row is exact (bytes/LF/SHA-256; all zero CR/final LF):
  contract
  `39951/818/c9a4d008777eff6e0a270347f8eaa0508b97b6001f71c979dbbbc5aba2895fd1`;
  held verifier
  `26170/636/4b72a3eb494a52b1de8628571f6b1fc65355dbeb5f554f2f313bc847fa44ecad`;
  shell envelope
  `14882/330/f12d6952e79f0251e1de5858d207353c451ec0ab6db2ea9fd83bf1826d6baeaa`;
  held probes
  `4878/145/bd9e57a973987ccd4a660730fd61927cbab58beb9e6fa9cccac41113fabf7a58`;
  action control
  `27138/611/5e36b6eb699ac4e2beb711808a1c144cd904e1fa6c0ec1ab9e3b21a4ec3c1e50`;
  postflight
  `12157/279/61c277ba79e2f58601f437862066fee39c96ae1167bde6b1739a79a113915c23`;
  cleanup
  `9035/192/8819988c5254699280327cb9658c0a89b5adeb249d3794758a401a705c63c4fb`;
  self-test
  `22738/594/af04ef693784b9a9fc9164455ba6c240b4678080c88fc3305aa60524d3ba6fe8`;
  freeze verifier
  `15243/315/c808cb33199957df8cef5bb966da4dd7789694930ca66f1d13e78fcf8f388a78`;
  binding template
  `1718/46/bb505cb585e7cce1728fa6c90f10be26673d45febee018f318ae65f20f01b5bf`;
  and runbook
  `9000/148/e398b0299cf20fc8058dfdabbb13e5c978ff170aba7d6946c097e6229fbb8355`.
  Independent cold audit passed all 11 pins, 8 JavaScript syntax files,
  `bash -n`, at least 10 positive and 15 negative fixtures, 19 required guards,
  and 18 forbidden-operation absences. The manifest's false activity fields
  describe support-kit construction only; they are not release-wide claims.
  Its PRE fields describe verification required/currently false or deferred,
  not already completed.
  The pinned `26170`-byte held verifier is the required new abort-v2/main-WAL-
  aware boundary verifier; no predecessor verifier may be reused.

  After publication, create and independently audit the separate exclusively
  created immutable ignored `target-activation-authority-binding.json`. It binds
  the full authority commit, unchanged manifest/artifact set/verifier, exact raw
  phases, exact provider tool/arguments, and permanent authority-specific
  tombstone without mutating any frozen byte. The tombstone path is exactly
  `target-activation-captures/hl-20260823-1-<authority16>-464f2e4805c79aef/`.
  Any pre-existing/mismatched binding or tombstone is a stop.

  PRE chronology is exact. First create a fresh allowlisted provider projection
  from complete deploy/build/service/log and Netlify facts. Provider-only
  evidence cannot read or prove `DATABASE_PATH`, target inactivity, or
  `STAGING_MAINTENANCE_HOLD`; it must record
  `providerEnvironmentReadAvailable:false` and defer those facts. Next use the
  frozen local shell envelope to prepare the pinned payload. In a fresh
  Chrome-attached Render shell, the first command sets `HISTFILE=/dev/null`,
  disables history, and clears memory; the second streams the exact payload only
  through stdin as
  `bash -s -- pre-boundary dep-da6ghj67bikc738hbbv0`. No remote verifier file,
  payload, SQLite/project database module, database open, file copy, checkpoint,
  sidecar removal, scratch path, or write may occur. Capture the single raw JSON
  result locally and seal it with the local envelope.

  Raw PRE must prove exact B2 and hardened clean Git state; the exact critical
  20-key runtime plus nine absent provider fields with source `DATABASE_PATH`;
  source main/WAL/SHM, target main, and canonical receipt v2 at every exact
  durable identity/stat/hash pin; source journal, target WAL/SHM/journal, and
  deterministic work directory absent; four stable boundaries; two complete
  zero-denied/zero-holder `/proc/*/fd` scans; and full hold. Current `st_dev`
  must be internally equal across all five protected files within that shell,
  but namespace-local device numbers are never compared between containers.
  The receipt's historical device fields remain byte-bound. Raw output must say
  `externalAuthorityBindingRequired=true`,
  `externalAuthorityBindingVerifiedByVerifier=false`,
  `standaloneAcceptanceAuthorized=false`, and
  `verifierGrantsMutationAuthority=false`; only the local binding-aware envelope
  may mark the phase authorized after verifying payload, stdin argv/transport,
  and raw-result SHA.

  Capture the separate exact five anonymous no-cookie/no-write probes:
  live/ready `200`, session/leagues/current-FAD `503 SERVICE_MAINTENANCE`, all
  JSON and `Cache-Control: no-store`. Readiness `200` proves only the held bare
  listener, not database readiness. Immediately before arm, obtain every page
  of Render deploys and durably capture the complete cursor-closed, sorted
  pre-dispatch deploy-ID edge with `dep-da6ghj67bikc738hbbv0` sole newest/`LIVE`
  B2 and no pending/active deploy. It must be no more than two minutes old.

  Arm validates ownership/mode, exclusively creates/fsyncs/re-reads the
  authority-specific capture root and attempt, and fsyncs a separate tombstone
  seal. Durable seal creation consumes authority before provider dispatch. The
  only call is tool `mcp__render__update_environment_variables` with canonical
  exact arguments
  `{"envVars":[{"key":"DATABASE_PATH","value":"/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3"}],"replace":false,"serviceId":"srv-d9eo2turnols73ekb830","workspaceId":"tea-d4prbj7diees738tmg90"}`,
  exactly `247` bytes / SHA-256
  `464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`.
  Target value is `103` bytes / SHA-256
  `4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`;
  source value is `103` bytes / SHA-256
  `50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3`.
  It requests `replace:false` and only `DATABASE_PATH`; it does not prove the
  global environment delta. Do not call `trigger_deploy`. Record local dispatch
  start/finish/capture chronology and persist only an allowlisted returned/
  failed/ambiguous observation, never raw connector output. Error, timeout,
  disconnect, ambiguity, or contradiction grants no retry. Reconcile read-only
  and stop when exact continuation proof is unavailable. An inverse source-path
  change is a separate rollback mutation requiring new written authority.

  POST provider reconciliation requires a complete paginated cursor-closed
  deploy-ID inventory whose set difference from the final PRE edge is exactly
  one ID. That ID must be sole newest/`LIVE`, API-triggered on exact B2, with the
  prior deploy deactivated, no newer/pending/canceled competitor, and any
  returned deploy ID matching. A `failed` outcome never becomes success merely
  because a deploy appeared; `ambiguous` may continue only through the exact
  set-difference proof plus later shell target proof. Hosted evidence must record
  observed Node `24.14.1`, npm `11.11.0`, exact `443` suites / `3519` tests all
  passing, and complete clean build/runtime log-source windows. Provider POST
  records the requested target call only and keeps runtime path, hold, and
  critical delta deferred.

  In a new attached shell on the new instance, use the same no-history stdin-only
  transport as `bash -s -- activation-post dep-<new>`, capture/seal the raw
  result, then capture the five POST held probes. Raw POST must prove actual
  target `DATABASE_PATH`, exact full hold, all other critical bindings unchanged,
  all durable protected identity/stat/hash fields unchanged from PRE excluding
  namespace-local device, the same five absences/four stable boundaries/two
  zero-holder scans, target unopened, and zero SQLite/module/copy/scratch/write
  behavior. Raw output remains non-authorizing.

  Combined local postflight, not provider evidence or raw shell output alone,
  must bind the published authority, immutable kit, invocation/result envelopes,
  strict chronology, exact one-ID deploy edge, provider facts, shell facts, and
  probes. It must record `runtimeDatabasePathVerified=true`,
  `criticalRuntimeBindingDeltaExact=true`,
  `semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
  `globalProviderEnvironmentDeltaProven=false`. Cleanup revalidates everything
  and deletes nothing. Then mandatory stop.
- [ ] `RC-STG-006P23` remains `PENDING AUTHORITY`. It must separately authorize
  a distinct private-copy semantic target verifier and fresh backup. Its required
  target proof includes integrity `ok`, zero foreign keys, schema/data/migrations
  `54/54/54`, exact migration checksum and credential-rotation receipt, zero
  active sessions, and zero current/predecessor/older fixture receipts, receipt
  events/fixture league, manager assignments/activity/idempotency/notifications,
  and outbox events/audiences. O23 raw boundary proof cannot satisfy P23.
  Reopening/final review, normal restore, rollback, closeout, browser workflow,
  production, and any second provider update remain forbidden.

### RC-STG-006O23 V2 Correction Authority - Rejected During Local Arm / Unconsumed / No Retry

> Historical boundary: every conditional execution statement in this V2 section
> describes the now-rejected frozen design only. It grants no present authority,
> must not be resumed, and is superseded only by the separately pinned V3
> correction below.

- [ ] O23 V2 is rejected and remains unchecked. It was not a V1 retry because V1 never
  armed. Preserve the V1 kit and immutable rejected binding unchanged at
  `.netlify/strict-release-HL-20260823-1/target-activation-authority-binding.json`,
  exactly `1747` bytes / `46` LF / zero CR / final LF / SHA-256
  `a939aaac0770e53cb16c2fd69eea61ef5818d361fbc9a3fa57b64f556d939954`.
  They remain historical evidence and permanently non-authorizing.

The rejected V2 authority was published as one literal non-merge docs-only child of
`e855be9e1a4d92cd6428175965ecf934653ae965` changing exactly the standard nine
documents. Its former contract would have activated only after publication as frontend HEAD/
`origin/staging`, confirmation that backend HEAD/`origin/staging` remain clean
at B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb`, and exclusive creation/audit
of the distinct ignored post-publication
`target-activation-v2-authority-binding.json`. Each line below is exact,
standalone, and unique; the `15` lines joined in this order with LF and no
trailing LF have SHA-256
`4e8cfdd4ffb8f2d80fc7676e3d71358790952ad74dfb7e2848d4b4a563b1fbe5`.

HL23-V2-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-support-manifest.json|bytes=9510|lf=246|cr=0|finalLf=true|sha256=991cb21b885cccb5aebf32af2f0665abe7a5566ce39c3c68f12615a318c81e33
HL23-V2-FROZEN-ARTIFACT-SET|sha256=8d55d858e55c5b3d2edb246df2ffa4cf54175f5c4740292e830680b473010089
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-contract.cjs|bytes=51401|lf=1064|cr=0|finalLf=true|sha256=cfeebad02ed06f93212c7e20e6c4ed2287e15a1f84f86650b2cfea18613cbfad
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-held-verifier.sh|bytes=26189|lf=637|cr=0|finalLf=true|sha256=dccac0c4603a595fd9297900a8d77ddbf25b123632506deeb0d4021b816e32b6
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-shell-envelope.cjs|bytes=14925|lf=331|cr=0|finalLf=true|sha256=c897c0840bcbba97e4ea2cdc2b976a2fac5767cfa88c416fa706d551342d023a
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-held-probes.cjs|bytes=4891|lf=146|cr=0|finalLf=true|sha256=1a056371074d2abce8af289432f6cbf1755be05c03e04ea33a97aecd1592de90
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-action-control.cjs|bytes=34487|lf=773|cr=0|finalLf=true|sha256=10135f961270955c3d488fef0b80eeb86a81722f191eee5f96d61e30e92e4544
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-postflight.cjs|bytes=12226|lf=280|cr=0|finalLf=true|sha256=599499f1371281248ef8911dc5487476e0e91cef4a365e7b832aa629f5ad3fed
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-cleanup.cjs|bytes=9057|lf=193|cr=0|finalLf=true|sha256=018ea28d97d4501e7db890f7409f9afc813ab3b053f6c59e4fba03276c6badb9
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-support-self-test.cjs|bytes=26333|lf=657|cr=0|finalLf=true|sha256=2abc6bd7b01eb51a3ce6b4749700dee776b24bf7e35b837dc3a87cd2930b3cb8
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-verify-freeze.cjs|bytes=20961|lf=418|cr=0|finalLf=true|sha256=5cea7a8fe8b6aa473952714dcb61cd5d8feb382ed4c02851823ff17a01884ca2
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.template.json|bytes=2886|lf=72|cr=0|finalLf=true|sha256=49cb9ca31efe68fccf8981fca527726f04447dcc8a87dfae90ff39010c3bad01
HL23-V2-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v2-RUNBOOK.md|bytes=10982|lf=182|cr=0|finalLf=true|sha256=8619674e891574f7093be684c8c8faceb2170081ca1456a57fd296b3e5f8eb39
HL23-V2-REJECTED-AUTHORITY|commit=e855be9e1a4d92cd6428175965ecf934653ae965|bindingPath=.netlify/strict-release-HL-20260823-1/target-activation-authority-binding.json|bindingBytes=1747|bindingSha256=a939aaac0770e53cb16c2fd69eea61ef5818d361fbc9a3fa57b64f556d939954|failureCode=AUTHORITY_DOCS_DO_NOT_PIN_FROZEN_KIT|authorizing=false|rejectedBeforeAction=true
HL23-V2-REJECTED-SESSION-ACTIVITY|source=root-coordinator-record|providerDispatchOccurred=false|browserShellInputOccurred=false|shellVerifierInvocationOccurred=false|captureArmOccurred=false|rootActivationMutationOccurred=false

The frozen V2 runbook described only the bounded O23 shell-boundary sequence above
under the new filenames, binding, and distinct permanent tombstone
`target-activation-v2-captures/hl-20260823-1-v2-<authority16>-df755011d0e4d4b1/`.
PRE and POST use the pinned new abort-v2/main-WAL-aware verifier through stdin in
fresh no-history shells; perform no SQLite/scratch/copy/write work; prove the
exact source-to-target runtime-path-only delta, protected family and receipt,
absences, full hold, and two complete zero-holder scans; and treat device IDs as
namespace-local. Provider evidence must say
`providerEnvironmentReadAvailable:false`; shell/probes prove path/hold.

After a fresh complete deploy-ID edge set and durable tombstone, exactly one
`mcp__render__update_environment_variables` call is allowed with only
`DATABASE_PATH`, `replace:false`, canonical `247`-byte arguments SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`,
source/target value hashes `50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3` /
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`.
No trigger, retry, automatic inverse, or second update is authorized. POST must
prove a complete one-ID B2 deploy-set difference, target selected but unopened,
unchanged protected identities/hashes except namespace-local device, required
absences, zero holders, and full hold. Combined acceptance alone records
`runtimeDatabasePathVerified=true`, `criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`; cleanup deletes nothing, then
mandatory stop. P23 semantic verification/backup, reopening/review, normal
restore, rollback, browser workflow, closeout, production, and all later gates
remain forbidden.

### RC-STG-006O23 V3 Correction Authority - Action Succeeded / Consumed; Acceptance Pending O23A; Old POST Path Blocked

> Historical boundary: this section preserves the V3 authorization design and
> its exact pin block. V3 later consumed its authority and completed exactly one
> successful provider mutation. Its imperative PRE/POST wording grants no present
> authority, and its old POST path must never be resumed or populated.

- [ ] `RC-STG-006O23` remains unchecked. Its V3 action succeeded and consumed
  exactly one provider mutation, but acceptance is pending the separate O23A
  continuation. It may be checked only together with O23A after V4 aggregate
  postflight and zero-delete cleanup both pass.

Published V2 commit `3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323`
collected its immutable binding and seven PRE evidence files, including fresh
provider, shell, and held-probe evidence, and then invoked local `--arm`. Arm
failed closed with `CAPTURE_DIRECTORY_OWNER_OR_MODE_INVALID` before provider
dispatch. The verified V2 binding plus all `21` frozen/PRE/failure files remain
immutable. The binding is
`.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.json`
at `2915` bytes / SHA-256
`d30f9e25c080060e74797b8aed2e831f06507555194058cdecde5ebc12bb1e3a`,
failure JSON at `165` bytes / SHA-256
`1c0faa5e7cf8d1cf12410bd5ca424e59f3e6bd83e3adac1b14ce0d6b28950ea7`,
and residue JSON at `1026` bytes / SHA-256
`b9fe005c8dd35d943fdf534a3406917a95194abe2bd50e935d88131baed598ee`.
Only the empty, ACL-identical Windows parent
`.netlify/strict-release-HL-20260823-1/target-activation-v2-captures` exists and
reports mode `0666`; no authority-specific root, attempt, seal, dispatch, provider
response, or POST evidence exists. V2 made zero provider mutations and zero
`DATABASE_PATH` updates. It is unconsumed but permanently rejected and cannot be
retried or used to authorize V3. Preserve all V1/V2 kit, bindings, PRE, failure,
residue, and empty-parent evidence unchanged.

The root-coordinator reconciliation at `2026-08-26T10:11:44.827Z` recorded sole
live B2, zero new deploys, and auto deploy disabled after the V2 failure. That is
an external attestation, not global provider state proved by local absence. Fresh
V3 provider, shell, probe, and complete cursor-closed deploy-edge PRE evidence
must reconfirm B2 and topology before V3 arm. V3 is a new authority and namespace,
not a retry of V2.

The only eligible V3 correction is one literal non-merge docs-only child of
`3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323`, changing exactly the same standard
nine authority documents. That commit must be published as frontend HEAD and
`origin/staging`; backend HEAD and `origin/staging` must remain clean at B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`. Only then may the distinct ignored
immutable `target-activation-v3-authority-binding.json` be exclusively created
from its frozen template and audited. The binding is post-publication evidence,
is excluded from the frozen kit, and cannot alter these pins. O23 remains
unchecked and conditional until every V3 step passes.

Each line below is an exact, unique, standalone V3 pin using its full
repo-relative path. Joined in this order with LF after every line, including the
last, the `15`-line block is `3261` bytes and has SHA-256
`12da4b1f0d5ad78e0b4c6ae8d922397b3a4e26780949e800d1e9b009f81bde95`.

HL23-V3-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-support-manifest.json|bytes=12378|lf=312|cr=0|finalLf=true|sha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f
HL23-V3-FROZEN-ARTIFACT-SET|sha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-contract.cjs|bytes=88806|lf=1812|cr=0|finalLf=true|sha256=f5500a62f243b0a5743ffc4b31e279da6f493a93358b415535bc63d9bbfd9aba
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-held-verifier.sh|bytes=26190|lf=638|cr=0|finalLf=true|sha256=9d0c02916e8eff54f98d3b3121774f7740b0af3bd30d9d5d588c768f674812ac
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-shell-envelope.cjs|bytes=14926|lf=332|cr=0|finalLf=true|sha256=61a5f62e07e41787ff7b70d7e487ed5481346bb5c12a5b7b43e4ec60cbf85529
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-held-probes.cjs|bytes=4892|lf=147|cr=0|finalLf=true|sha256=6012eee2b69c744e3779354e8a2d82edba71597b502bca3e08ae299469ed13ba
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-action-control.cjs|bytes=48066|lf=1078|cr=0|finalLf=true|sha256=b67b14e3f8b5a6e325b9c595255df72450c25cccb0e4181c1f864b80105640af
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-postflight.cjs|bytes=18441|lf=420|cr=0|finalLf=true|sha256=167cb32e107815dc3ebec1e89abc148529922df15b2d0d3d66597cc09fa37f42
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-cleanup.cjs|bytes=9786|lf=205|cr=0|finalLf=true|sha256=b91ac81fc981e620740933c25571eefc94a55deee6e656b0603aa905356bdfc3
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-support-self-test.cjs|bytes=29733|lf=727|cr=0|finalLf=true|sha256=0a16e984f34f7752721f482700798f7f71d22af86a86da03c2cb6df259336575
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-verify-freeze.cjs|bytes=25017|lf=492|cr=0|finalLf=true|sha256=9a167a73f12e38e301679a4d6f155942c6a04aa42b4d716a0e34d228032a8046
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-authority-binding.template.json|bytes=4818|lf=124|cr=0|finalLf=true|sha256=411b7ccd099a2c26481a69c7c7d149252b8572361d771f8c57bfb21d4be107e6
HL23-V3-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v3-RUNBOOK.md|bytes=13751|lf=218|cr=0|finalLf=true|sha256=a7d46231cce61a7b309c77d23d25a6482f97fb99c7c2c907db39d4bcac8c2473
HL23-V3-REJECTED-AUTHORITY|commit=3f0bc2a9c8bf5aaae86a4e0cbb875dbccd211323|bindingPath=.netlify/strict-release-HL-20260823-1/target-activation-v2-authority-binding.json|bindingBytes=2915|bindingSha256=d30f9e25c080060e74797b8aed2e831f06507555194058cdecde5ebc12bb1e3a|failureCode=CAPTURE_DIRECTORY_OWNER_OR_MODE_INVALID|authorizing=false|rejectedBeforeProviderDispatch=true
HL23-V3-REJECTED-SESSION-ACTIVITY|source=root-coordinator-record|providerDispatchOccurred=false|databasePathUpdateOccurred=false|captureArmSucceeded=false|v2PreEvidenceAuthorizing=false|freshV3PreRequired=true

The frozen V3 manifest is exactly `12378` bytes / `312` LF / zero CR / final LF
with SHA-256 `07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f`;
its `11` artifacts total `284426` bytes and have canonical artifact-set SHA-256
`1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03`.
Only the pinned V3 abort-v2/main-WAL-aware held verifier may run, and only for
raw phases `pre-boundary` and `activation-post`. In a fresh attached shell,
disable and clear history with `HISTFILE=/dev/null`, then stream it through stdin
as `bash -s -- pre-boundary dep-da6ghj67bikc738hbbv0` and later
`bash -s -- activation-post dep-<new>`; persist no remote verifier or scratch
file. Both phases are shell-boundary proof only: no
SQLite/project database module, database open, copy, checkpoint, sidecar removal,
scratch creation, or write is reachable.

Fresh PRE must prove the exact source path and full source main/WAL/SHM family,
target main and canonical receipt, five required absences, the critical `20`-key
runtime matrix plus nine absent provider fields, four stable boundaries, two
complete zero-denied/zero-holder `/proc/*/fd` scans, and the full hold. Device IDs
are namespace-local: internal identity consistency is required, historical
receipt device values remain bound, and PRE/POST container devices are never
compared. Raw results remain non-authorizing and state
`externalAuthorityBindingRequired=true`,
`externalAuthorityBindingVerifiedByVerifier=false`,
`standaloneAcceptanceAuthorized=false`, and
`verifierGrantsMutationAuthority=false`.

Provider evidence may record only the exact requested target call and unique
deploy/build/service/log facts; it cannot prove configured/runtime path or the
hold and must record `providerEnvironmentReadAvailable:false`; never persist raw
provider payload or secrets. Provider PRE, shell envelope, and probes must precede
a fresh, complete, paginated, cursor-closed deploy-ID edge set captured within two
minutes of arm, with held B2 still sole newest/`LIVE` and no active/pending
competitor. V3 arm creates
the single authority-specific permanent sentinel directly under the trusted
release root:
`target-activation-v3-capture-hl-20260823-1-v3-<authority16>-9ea94bc779a0ce54/`.
It creates no shared parent. On Windows, exact inherited owner/SID/SDDL/ACE,
non-reparse realpath, atomic exclusivity, stable rereads, and expected mode `0666`
apply; no POSIX `0700` equivalent, confidentiality, or hostile-authorized-principal
tamper resistance is claimed. POSIX uses directory/file modes `0700`/`0600`.
Durable root, attempt, separate tombstone seal, fsyncs, and stable exact entry-set
proof must finish before dispatch; root presence permanently consumes V3.

The sole mutation is exactly one
`mcp__render__update_environment_variables` call with canonical `247`-byte
arguments SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`:
`{"envVars":[{"key":"DATABASE_PATH","value":"/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3"}],"replace":false,"serviceId":"srv-d9eo2turnols73ekb830","workspaceId":"tea-d4prbj7diees738tmg90"}`.
Source/target value hashes remain
`50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3` /
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`.
No trigger, retry, automatic inverse, or second provider update is authorized;
error, timeout, disconnect, or ambiguity requires read-only reconciliation.

POST must prove a complete deploy-ID set difference of exactly one new
API-triggered B2 deploy, sole newest/`LIVE`, with the prior deploy deactivated,
no competitor, exact Node `24.14.1` / npm `11.11.0`, all `443` suites / `3519`
tests passing, and complete clean build/runtime log windows. Fresh activation-POST
shell evidence and five held probes must prove only `DATABASE_PATH` changed,
target selected but unopened, source/target/receipt durable identities and hashes
unchanged except namespace-local device, target WAL/SHM/journal/work and source
journal absent, two zero-holder scans, and full hold. Combined local acceptance
alone may record `runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`. Cleanup revalidates and deletes
nothing; then stop. `RC-STG-006P23` alone may later authorize private-copy
semantic verification and backup. P23, reopening/review, normal restore,
rollback, browser workflow, closeout, production, and every second provider
update remain forbidden.

### RC-STG-006O23A V4 Read-Only Evidence Continuation - Authorized Next / Pending Publication and Binding

- [ ] `RC-STG-006O23A` remains unchecked. It becomes eligible only after one
  literal non-merge exact-nine documentation child of
  `43e99e686214a2f36f52ee7c426db2015d709bee` is published as frontend `HEAD`
  and `origin/staging`, backend staging remains clean at exact B2
  `6359ec9997f90dddf17ba2c9b07481746ae171bb`, and the separate ignored immutable
  V4 binding is exclusively generated and independently audited. It authorizes
  zero provider mutations.

Consumed V3 completed exactly one successful provider `DATABASE_PATH` mutation
and returned sole newest/`LIVE` exact-B2 deploy
`dep-da7d857avr4c73bnna90`. Its old POST path is permanently blocked solely
because exhaustive hosted logs lacked an explicit npm `11.11.0` observation;
all eight named V3 POST artifacts must remain absent forever. V3 must not be
retried or backfilled. O23 remains unchecked with acceptance pending O23A.

These are the exact `21` runner-emitted authority rows. Final-row success fields
define the future accepted state and do not claim the two currently unchecked
gates passed.

HL23-V4-FROZEN-MANIFEST|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-support-manifest.json|bytes=11358|lf=286|cr=0|finalLf=true|sha256=63f49736b8f172704dee441a89e7ab66a5051b2463bb534f419c18e79b9cc428
HL23-V4-FROZEN-ARTIFACT-SET|sha256=8da9a6219f2a311cff5385cda178b37422795e85526b6467dec4d312eb375422
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-contract.cjs|bytes=75803|lf=1499|cr=0|finalLf=true|sha256=9868b381d735b109519be63cddd62869e72cb3037489046a5ff8b7b037a31f57
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-npm-verifier.sh|bytes=17958|lf=414|cr=0|finalLf=true|sha256=af911c11d71dba90ab1a068475622bcab67d3dbe1897b25e0bd95f943ef1686b
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-shell-envelope.cjs|bytes=35536|lf=770|cr=0|finalLf=true|sha256=5359876b097d8cb05f07a9befd5d7d4e5e3612f363cb66700d09b18ae22679b1
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-held-probes.cjs|bytes=4597|lf=131|cr=0|finalLf=true|sha256=adbf73addb943d9c7f7d6d4c3b75d4e9b42cac06358100cf03a0673e70d4792f
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-action-control.cjs|bytes=42066|lf=910|cr=0|finalLf=true|sha256=7b67d758468aabd11a6594d25aab0cdc6c77cd80c32144036265ae28408bdfa7
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-provider-projection.cjs|bytes=67106|lf=1525|cr=0|finalLf=true|sha256=c825826c3651369f94aff0bfb75de63a115b301077db8feb84aa88ad1364b358
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-authority-ops.cjs|bytes=11363|lf=262|cr=0|finalLf=true|sha256=89d2d34604f5a3df03f5161d6d024eba793fbf5b7145d26a3b9fe4e3f3d6102e
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-local-runner.ps1|bytes=51440|lf=1087|cr=0|finalLf=true|sha256=89c6887fa3e31b6885c3ec62e7d8c0796541f5292c387f12999473e963d90f02
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-postflight.cjs|bytes=17194|lf=398|cr=0|finalLf=true|sha256=b907741e922295012bc66cd54ed6c0d01cdc9e39982cec50acba352285295f08
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-cleanup.cjs|bytes=5313|lf=141|cr=0|finalLf=true|sha256=91e9d7ecbf5df1da46d2122a341a10c726974b7e7a25faed4a2a917e8b1f8294
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-support-self-test.cjs|bytes=40052|lf=843|cr=0|finalLf=true|sha256=3eb5499c80fd92b0f199f6d83083b7577ee257f36a0157fc1f3c20e39bd41862
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-verify-freeze.cjs|bytes=31193|lf=591|cr=0|finalLf=true|sha256=54e6711c8fa38cd95182d290bbf1f01a8d10ba0f1d23a6b8453548e3a8c34399
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-authority-binding.template.json|bytes=7134|lf=176|cr=0|finalLf=true|sha256=b0c64c20901ed5d67498d392e023475e480c6a1817b5755262a6339a027f6962
HL23-V4-FROZEN-ARTIFACT|path=.netlify/strict-release-HL-20260823-1/target-activation-v4-RUNBOOK.md|bytes=18634|lf=320|cr=0|finalLf=true|sha256=e26ba353e79a1fe07244211f17226ab6fde8d0dc22c48fa66475ba396b5a8886
HL23-V4-INHERITED-V3-AUTHORITY|commit=43e99e686214a2f36f52ee7c426db2015d709bee|manifestBytes=12378|manifestSha256=07bff3e023a128ab295faf8dccce6eedfce023bee31a31719ab6c3c8f7cdf89f|artifactSetSha256=1aa4934ec90360d672d03e6309862e860f8d4c67e9363182a9a8096599af6d03|bindingBytes=4848|bindingSha256=5755f87382ea07de2b04ebdba1b11cc25e5efb19c143d74a0c91f02d2ce71ddb|consumed=true|authorizingV4ProviderMutation=false
HL23-V4-INHERITED-V3-DISPATCH|candidateSha256=f8a8520f03ca769b6d884acba26ec130817a5ac3ac06f4ff1d5184ed9808bc4a|attemptSha256=203d85cf3378498f57fd7111793ad8b523a77cd9ba1aa7df655a55aef4517387|sealSha256=13ec2b61aae067260993eb38417d0b88a68317aab8a0fe2bf2cd316ff2f8eeb0|dispatchSha256=5daf9939eef4ff402bc7e8560cf4d5bf1db4651f3987aba2bb8639e772e925b5|outcome=returned|deployId=dep-da7d857avr4c73bnna90|totalProviderMutationCount=1|retryAuthorized=false|rollbackAuthorized=false
HL23-V4-FORBIDDEN-V3-POST|count=8|paths=target-activation-v3-provider-postflight.json,target-activation-v3-shell-postflight-plan.json,target-activation-v3-shell-postflight-stdin.txt,target-activation-v3-shell-postflight.json,target-activation-v3-shell-postflight-envelope.json,target-activation-v3-held-probes-postflight.json,target-activation-v3-postflight-result.json,target-activation-v3-cleanup-result.json|mustRemainAbsent=true
HL23-V4-CONTINUATION-AUTHORITY|parent=43e99e686214a2f36f52ee7c426db2015d709bee|checklistId=RC-STG-006O23A|providerMutationAuthorizedCount=0|totalProviderMutationCountRemains=1|npmObservationAuthorizedCount=1|activationPostAuthorizedCount=1|providerFinalReadRequired=true|actualExportedRuntimeSamplingRequired=true|expectedRuntimeValueInjection=false|genericRequest5xxZeroClaimed=false|shellRetryAuthorized=false|backupAuthorized=false|reopenAuthorized=false|rollbackAuthorized=false|productionAuthorized=false
HL23-V4-STATUS|authorityO23=UNCHECKED_PENDING_O23A|authorityO23A=UNCHECKED|v3PostPathPermanentlyBlocked=true|o23AcceptancePendingO23A=true|successfulO23=PASS_CONSUMED|successfulO23A=PASS_CONSUMED|mandatoryStopBefore=RC-STG-006P23

After publication/binding, execute only this order: provider PRE; five held PRE
probes; preflight and durable one-shot O23A arm; one sealed live-runtime npm
`11.11.0` observation; provider POST; one sealed byte-exact inherited V3
`activation-post` observation; five held POST probes; provider FINAL topology
bracket; aggregate postflight; zero-delete cleanup; mandatory stop before P23.
The npm sample uses actual exported runtime values with no expected-value
injection and is not build-time proof. Provider request evidence accounts for
expected held `503` tuples rather than claiming generic zero 5xx. V4 authorizes
zero provider mutations; the combined total remains one. O23 and O23A stay
unchecked until completion and must then be checked together. P23, backup,
reopen, rollback, production, and later gates remain forbidden.

### RC-STG-006N23 Post-Dispatch HTTP-Verifier Amendment

Published dispatch authority `7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb` is
consumed: exactly one Netlify CLI spawn ran, and no retry/redeploy is authorized.
Its `1902`-byte envelope SHA-256
`b5cd9f492e41b392ec854e05a9fa91480b2e4ebc592ac80ab52b99d0e8295204`
records the expected completion code, one command, no retry, and status `0`.
The `1862`-byte provider-postflight SHA-256
`642b5fac4989c9440ed6fe2015e84de943824ca5e4b95673b15a45cb94f1350d`
proves `6a8e6c8fae36273a816a7539` current/newest/`ready`, exact title,
five headers/two redirects/zero functions/zero edge functions, empty
`build_settings: {}`, no Git link, and unchanged B2 full hold/source path/
inactive target.

The initial official read-only HTTP verifier ran twice and rejected solely with
`CACHE_CONTROL_HEADER_MISMATCH`: Node `24.14.1` exposed the immutable list
without optional comma whitespace. An independent eight-path diagnostic proved
all `200`, exact global headers and `Cache-Control: no-store`, the exact
ordered immutable directives, and no `Set-Cookie`; it made no hosted mutation,
provider write, deploy, or redeploy, but is not official acceptance. The original
pre-dispatch manifest (`3358` bytes / `99` LF / zero CR / final LF /
`6234451ab4ad6af0910fa7c13b38b21cc613509b23e7cae63e5f426b7d63a305`)
was overwritten after dispatch and not continuously retained; its later labeled
reconstruction must never be called the retained original.
The exact reconstructed-manifest path is
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-support-manifest-pre-dispatch-reconstructed.json`;
the exact provenance-note path/name is
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-support-manifest-pre-dispatch-reconstruction-note.json`
(`657` bytes / `18` LF / zero CR / final LF / SHA-256
`3754bcd54f7bde37081d69e5c95e667355021bd9693356430f6911da1fd8a6ef`),
and the note binds exact `reconstructedAfterDispatch=true` /
`continuouslyRetained=false`.

Corrected ignored pins (bytes/LF/SHA-256) are manifest `3358/99/7aab6845725ae90a0d245222529c91a9177b002f516ca6708d37470fdb4d7a4e`;
HTTP verifier `20991/522/26ca6f493f82999eae029c907f3bc666b460362b464b6dd97302b7e390196830`;
contract `30211/854/b3ae7da8019870dead3caa863316f6d7e05d530386ccfcf67afee7b54297a77c`;
and wrapper `21343/628/8bb2a13142fb913b6f13b836ca47b28caed28e1fd064563808451d74e713c605`;
all have zero CR/final LF. `no-store` and global headers remain exact. The
immutable comparator only splits on commas, trims edge SP/HTAB, rejects empty
directives, rejoins, and compares exactly—no reorder, case fold, addition,
removal, or change is accepted.

Only after this nine-document amendment is published may the release obtain a
fresh provider projection, exactly one corrected network-read-only HTTP-verifier result capture,
local postflight, and conditional exact cleanup, in order. Failure/ambiguity
grants no retry. Under that N23 continuation authority, activation, backup,
reopening/review, browser, closeout, and production were forbidden; Chrome
disk/FD reproof remained pending.

### RC-STG-006N23 Completion Evidence

Published incident amendment `0498fd4fd400e8aad16c4cf9c405165d420bd489`
was followed by the accepted refreshed provider `1862`/`68cd773b...`, corrected
official HTTP `23014`/`d0ef4d2e...` at `64/64 + 8/8 + 10/10 + 5/5`, local
postflight `4837`/`6941c238...`, and exact cleanup `1211`/`b49aca2f...` evidence
bound above. The action authority remains consumed by one dispatch and no retry.
`RC-STG-006N23` is checked `PASS / AUTHORITY CONSUMED / NO RETRY`. The prior
comma-OWS false negatives and reconstructed chronology remain preserved.
At this N23 completion boundary O23/P23 were still pending. Published e855/V1
was later rejected before PRE; published 3f0bc/V2 later gathered PRE but failed
local arm before provider dispatch. Both are rejected and unconsumed. Published
43e99/V3 later completed one provider mutation and consumed its authority; O23
acceptance now awaits the separately authorized V4/O23A continuation. O23 and
O23A remain unchecked. P23, backup, reopening/review, browser, closeout, and
production remain unauthorized; Chrome disk/FD reproof remains pending.

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
recovery are forbidden. The abort-v2 plan, one published-authority first
execute, and the one authorized byte-identical replay passed. First-execute and
replay authorities are consumed; the exact target/receipt were materialized and
V3 later selected that target while preserving the source. Replay is `PASS /
AUTHORITY CONSUMED / NO RERUN`. `RC-STG-006N23` is checked `PASS / AUTHORITY
CONSUMED / NO RETRY`; refreshed provider, corrected official HTTP, local
postflight, and exact cleanup all pass. Published e855/V1 O23 was rejected before
PRE. Published 3f0bc/V2 gathered PRE but failed local arm before provider
dispatch; it is rejected, unconsumed, and cannot be retried. Published 43e99/V3
completed exactly one successful provider mutation and consumed its authority,
but its old POST path is permanently blocked by the missing explicit hosted npm
observation. `RC-STG-006O23`, `RC-STG-006O23A`, and `RC-STG-006P23` remain
unchecked. O23 acceptance now awaits the separately authorized zero-mutation V4/
O23A continuation. P23 semantic verification/backup and every later downstream
step remain unauthorized; Chrome disk/FD reproof remains pending.
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
pass. The exact abort-v2 plan, published-authority first execute, and one byte-
identical `0/0` replay pass; both execution authorities are consumed. Helper
retirement is `PASS / AUTHORITY CONSUMED / NO RETRY`. Published e855/V1 O23 was
rejected before PRE. Published 3f0bc/V2 gathered PRE but failed local arm before
provider dispatch; it is rejected, unconsumed, and cannot be retried. Published
43e99/V3 completed exactly one successful `DATABASE_PATH` provider mutation,
returned sole newest/`LIVE` `dep-da7d857avr4c73bnna90`, and consumed its
authority. Its old POST path is permanently blocked solely by the absent explicit
hosted npm `11.11.0` observation. O23 and O23A remain unchecked; the literal
non-merge exact-nine V4/O23A continuation is authorized next only after direct-
child publication and separate binding audit. Normal restore and phase two
remain forbidden; `RC-STG-006P23` semantic verification/backup and final review
remain pending separate authority.
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
