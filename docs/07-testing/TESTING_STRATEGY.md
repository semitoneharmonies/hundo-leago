# Hundo Leago - Testing Strategy

## Document Status

`APPROVED`

This testing strategy defines:

* the test layers, tools, environments, fixtures, and evidence required for Season 2;
* the distinction between behavior characterization and approved target-behavior tests;
* backend, frontend, database, security, Socket.IO, job, migration, recovery, and browser testing;
* the gates for local changes, work-plan completion, staging, migration, release, and production smoke checks;
* technical testing decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the testing decisions and approved adoption of this strategy on 2026-07-18.

Launch-critical FAD browser coverage was added on 2026-07-27. Exact FAD domain,
transaction, clock, privacy, API, frontend, job, recovery, and migration proof
is defined by the approved technical specification at
`docs/04-technical-specs/FREE_AGENT_DRAFT.md`.
The 2026-07-29 FAD decision package adds the explicit cross-layer acceptance
matrix below for scheduled rollover, automatic readiness, adaptive help,
whole-card legality, auction controls and draws, queued nominations, and
whole-Monday schedule recovery.

Grae's 2026-08-11 clarification removes paid live-provider capability from FAD
and Entry Draft testing. Both depend on the persisted player catalogue, not
statistics. Each season starts all player GP/G/A/NHL-points/FP counters at
zero. A separate provider-neutral matchup/statistics slice must test four
scheduled completed-game cumulative refresh runs each evening; exact times and
implementation are not yet approved or claimed complete.

### M7-26 Current-Tree Gate Amendment - 2026-08-20

The active shared local tree targets schema `54` with `54` migration files,
`133` application tables and repository-catalog entries, and `134` physical
tables including `schema_migrations`. The composed runtime registers `123`
routes; the conceptual contract catalogue contains `148` entries after T-147
notification batch acknowledgement and T-148 trade approval. These counts are
inventory assertions, not final test, deployment, or release evidence.

M7-26 may close only after focused role, privacy, transaction, rollback,
replay, league-isolation, frontend, and browser evidence proves:

* notification GET filtering is read-only; T-147 accepts exactly 1-100 unique
  caller-owned IDs all-or-none; and the UI acknowledges only the captured
  successfully rendered unread batch, retains it for the mounted visit, and
  visibly reports acknowledgement failure;
* every active member sees only the exact selected-team FAD result contract:
  T-131 identity/lifecycle plus `{ signed, notWon, tied }` counts, T-132 the
  same selected-team identities plus `results[]`, and team-required T-140 rows
  containing exactly `player`, final Signed/Not won/Tied status, nullable
  `offer`, and nullable manager-actionable `tieAuctionId`; only the current
  manager of that exact selected team receives a complete offer or tie action,
  commissioner/admin authority alone remains redacted, pending and correction-
  required allocations are omitted, internal card/rank/winner/draw/cap/audit
  evidence is inaccessible, legacy deep links redirect, server search and
  cursors bind `teamId`, and viewer-sensitive caches cannot cross sessions,
  teams, or manager assignments; T-140 tests accept only null or complete
  offers, while every public T-082 FAD allocation and T-143/T-144 offer,
  winner, restricted/fallback minimum, and delta money field must be null and
  both complete-money and partial-null public projections fail frontend and
  backend gates;
* proposal creation/cancellation requires the current proposing-team manager,
  acceptance/rejection requires the current receiving-team manager, and
  commissioner authority permits only safe inspection, T-148 approval of an
  already accepted Future-Considerations proposal, and separate recovery;
  standalone retention is rejected, historical retention remains readable,
  and no counter endpoint/service or UI capability is advertised;
* normal standings correction presents a recognizable matchup/team/week and
  projected standings without writes, then confirmed correction and current
  standings rebuild commit atomically; T-098 remains recovery-only and absent
  from the normal UI;
* current-manager-only sign/decline/release decisions use exact versions and
  destinations, fixed signed-Prospect contract terms, server-derived legality,
  IR eligibility and no-return rules, affected-trade cancellation, distinct
  history/activity/realtime evidence, and complete rollback; and
* active platform administrators have protected active `member` memberships in
  every non-deleted league, ordinary writers cannot mutate or assign them, and
  commissioner transfer atomically demotes/promotes roles and changes the one
  canonical league pointer.

The signed-Prospect buyout limitation recorded in `FUTURE_BACKLOG.md` is a
separate P1 production-promotion follow-up, not an M7-26 isolated-staging
closure gate. Its current failure is atomic with no partial write; a future fix
must make buyout cancel every affected pending `prospect_right` proposal in the
same transaction. T-074 remains `PLANNED`, focused M7-26 prospect movement
remains complete, and no test/status may imply that buyout endpoint is done.
Full frontend/backend totals and hosted evidence are recorded only after the
commands actually finish successfully.

M7-26 release evidence must also include two explicit hosted privacy gates:

* scan every persisted legacy T-082 FAD-cancellation allocation and T-144
  command-response receipt before promotion, prove no replay returns a non-null
  public offer, winner, restricted/fallback minimum, or delta money field, and
  exercise at least one pre-amendment full-money receipt from each applicable
  family through the current all-null replay projector. The exhaustive
  read-only gate is
  `npm run db:scan:fad-public-receipts:staging -- --database '<absolute database path>' --environment staging --persistent-root '<absolute persistent root>'`;
  it must bind exact staging process/database/physical-path identity, report
  sanitized stable IDs/reason codes only, classify every receipt, fail on any
  malformed unsafe receipt, and prove zero `total_changes()` delta; and
* perform an authenticated manager-transfer role smoke in one exact league and
  two teams: remove the prior manager's T-131/T-132/T-140 caches, prove the
  prior manager receives null offer/no tie action, prove the replacement sees
  complete values and an actionable tie only for the newly managed team, and
  prove a second selected team remains independently redacted or authorized.

### M7-26 Fresh Strict Release - 2026-08-23 (V3 ACTION SUCCEEDED; O23 ACCEPTANCE PENDING O23A; V4 READ-ONLY CONTINUATION AUTHORIZED NEXT; P23 AND LATER GATES NOT AUTHORIZED)

Grae requested and approved `HL-20260823-1` at exact
requested/approved/recorded time `2026-08-23T23:23:29.877Z`. It freezes F
`4dfe12d1366314e3d9df722c50771324647743c9` and binds B
`8e313902feefcd683b0f5edd746a9dd2a9029a18` as the verified held starting
baseline. Exact executable B-prime
`234547e4d8453b7515fc081ea6ebe4c2d022dc54` passed its focused `57/57`, complete
`443`-suite / `3,503`-test, check, dependency, and backend `origin/staging`
publication gates at the recorded B-prime boundary. Held deploy
`dep-da5sh0e417fc738i254g` passed on exact
B-prime after `3,503/3,503` hosted tests and its
build/startup, zero-error, held-health, and external read-only gates passed.

The clean pre-fixture source boundary was
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260822-1.sqlite3`,
`37105664` bytes / SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`.
Fresh prepare/replay passed at `729` then `0` writes. Held postflight verified
that same path as the pre-action fixture-bearing source at `37744640` bytes /
SHA-256 `b4163695d6f9db9e1f2db2b3aee536126e42b83f540fb0ee919b962fbd92b103`.
Fresh target
`/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3`
is materialized and verified at `37105664` bytes / SHA-256 `cf3ca07d...`; at
that first-execute boundary the target was inactive. V3 later selected it; the
receipt remains byte-unchanged at `4991` bytes / SHA-256 `24adf2d...`, while
semantic target verification remains deferred. Backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` is verified and
binds exact manifest/storage identities, `createdAt`
`2026-08-23T22:56:20.203Z`, encrypted SHA-256
`e6c6269ffb6d3726822dd8e9c036e87841335a6f138cfbf7cf929a65684c5448`,
manifest checksum
`54df36b9999204822819989d5d6890bbe544001958825b4025c6ff591e24d155`,
plaintext `cf3ca07d...`, and the recorded incident-preservation metadata.

Frontend helper commit `e898e72272e5a052867832dcf9f128e5b8d5730e` passes
its exact local gate with canonical helper/original/overlay SHA-256 values
`43cd106d...` / `2d8069ca...` / `c6b553c5...`, syntax `5/5`, both verifiers,
Vitest `14/14`, lint exit `0`, and a byte-identical isolated build. API deploy
`6a8bfef3ac0ff74a373404d8` was rejected before browser or unhold after its
header rules were absent. Corrected CLI deploy
`6a8c006abe46c8fb6269c40c` became current/`READY` at that helper boundary, had
exact six-header/two-redirect processing and no functions, and passed all
canonical/immutable public bytes,
headers, marker/runtime, absence, normal-app, and held-runtime checks. Fresh tab
`1600151197` reached `READY_NO_SESSION_REQUEST`, both QueryClient caches were
empty, the browser observed only the pinned CSS and JavaScript, and no API,
session, action, or write ran.
It was later replaced by consumed helper-retirement deploy
`6a8e6c8fae36273a816a7539` under the amendment below.

The exact controlled-unhold deploy `dep-da60sl0jo6nc73e0cfu0` and pre-action v2
verification passed. Phase-one proposal
`e00e0512-4a20-47fd-ad74-0986dd4abd27` reached accepted state; publication
event `974342b5-94e5-42d8-af20-9e07c35bc847` and immediate replay passed at
`fresh 2` / `replay 0`. Chrome was Admin rather than required Manager A during
publication, so operator sequencing selected `STRICT_STOP`. The return phase
and complete `1/0/0 -> 2/1/1 -> 3/2/2` comparator never began; no retry is
allowed. No predecessor result may satisfy this release. Its live ledger is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-23.md`.

For this release only, controlled-unhold testing used one merge-only
`replace: false` delta: `STAGING_MAINTENANCE_HOLD=false`,
`LEAGUE_WRITE_MODE=open`, and `FREE_AGENT_DRAFT_ROUTES_ENABLED=true`. Every
other B-prime/F/environment/database/source/root/season binding and every
disabled job, email/capture, debug, backup, or provider value remained exact.
The resulting API-triggered B-prime deploy and complete hosted/runtime/pre-
smoke verification passed; no `trigger_deploy` call ran. The later phase-one
attempt is terminal evidence only after the operator-sequencing strict stop.

The only action-test keys permitted during that stopped attempt were:

```text
HL-20260823-1-team1-to-b-propose
HL-20260823-1-team1-to-b-accept
HL-20260823-1-outbox-team1-to-manager-b
PUBLISH-HL-20260823-1-TEAM1-TO-MANAGER-B
HL-20260823-1-team1-to-a-propose
HL-20260823-1-team1-to-a-accept
HL-20260823-1-outbox-team1-return-to-manager-a
PUBLISH-HL-20260823-1-TEAM1-RETURN-TO-MANAGER-A
```

Only the first three keys and first publisher confirmation were used. The
return keys/confirmation are forbidden. Exact three-key re-hold produced sole
newest/`LIVE` deploy `dep-da6cu8h42hec738f2al0` at that boundary after hosted
`3,503/3,503`,
build/startup, zero-error, health/readiness, and maintenance-blocked ordinary-
route gates passed; it later deactivated at the verified held-B2 handoff.

The old `18060`-byte / `9c323005...` main-only abort preflight ran and safely
failed its bundled family fence because the authoritative source WAL/SHM were
nonempty; target family, receipt, and work were absent. It authorized no
checkpoint, sidecar deletion, abort-v1 plan, or main-only classification.
Frozen B-prime WAL-aware diagnostic `24132` bytes / `685` LF lines /
`c036a2b8...` and result `2747` bytes / `deda5da6...` returned
`HL23_ABORT_WAL_PREFLIGHT_SOURCE_VERIFIED`. It proves main `37744640` /
`b4163695...`, WAL `568592` / `0dde02d1...`, SHM `32768` / `e03d9ff8...`, six
stable snapshots, two complete zero-holder scans, private copied-family
recovery, exact semantic state, downstream absence, and cleanup. It copied all
three source-family members into owned scratch and SQLite opened only that
scratch family; scratch main/WAL stayed unchanged while scratch SHM changed.
This is diagnostic, not B-prime execution authority.

Exact abort-v2 B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb`, direct
child of B-prime with tree `0a6a928d8f6308aa5aadd2031c71769164c1cfb7`, is
committed and published to backend `origin/staging`. It changes only the
implementation/test paths with numstat `369/18` / `830/2`, blobs
`4a198c71554b7e7c5fc8ee481cd79b51c1ef799f` /
`53ce37cd04e48eb42323bab914d71ef3933c2c63`, SHA-256
`d49c870bdf300983a0b57577ce68e0647ba6ff318ccf55fe11a5596016671889` /
`3d9714ca93efa573593d983c992032fc4c473f2df23fd85395c9ed6d2873155c`,
and canonical `57541`-byte raw-diff SHA-256
`eb963d6b95311eeacc282ce9f8f743a83d4eae32f28922e2668ddcbfcbe84dc0`.
Diff/syntax, focused `72/72` before the final narrow wrapper, and exact-final
affected `5/5` pass; backend HEAD and `origin/staging` equal B2 and the worktree
is clean.

The approved one-key environment merge produced exactly one API-triggered
deploy, `dep-da6ghj67bikc738hbbv0`, sole newest/`LIVE` on exact B2. Hosted `443`
suites / `3,519` tests all passed with zero fail/cancel/skip/todo; build/startup
on instance `thxsc`, zero-error logs, live/readiness `200`/`no-store`, and
session/leagues/current-FAD `503 SERVICE_MAINTENANCE`/`no-store` passed. Netlify
remained unchanged then-current/`READY` `6a8c006abe46c8fb6269c40c` at that gate.

Post-live shell proof `HL23_B2_POST_LIVE_HELD_FAMILY_VERIFIED` passed at
`2026-08-25T04:11:28.902Z`, binding `20` runtime keys, nine absent providers,
three stable source snapshots, two seven-process zero-holder scans, downstream
absence, and current container device `66313`. Historical B-prime device `66332`
is namespace-local only; all other family metadata/hashes are unchanged.

Fresh derivative `post-b2-abort-v2-source-verifier.sh` (`35494` bytes / SHA-256
`6d5cfe50ecee26199c3f0a2c922c99a84d3f97e2fe98b6256b36583e6e98b70c`)
passed shell/JavaScript/static checks and independent cold audit. Its one-shot
`6032`-byte result SHA-256
`80c7cadec0664625b0c4fc6eb86fd49f5e58842534fdebbc1aead63f5fe65976`
returned `HL23_ABORT_B2_V2_SOURCE_PREFLIGHT_VERIFIED`. It proves six stable
source-family boundaries, two eight-process/`85`-descriptor zero-holder scans,
main+WAL-only scratch with private SHM creation, unchanged source and scratch
main/WAL, exact integrity/schema/semantic state, zero changes, both rollback-
journal and downstream absence, and cleanup.

One exact abort-v2 plan ran once and passed at `0/0`. The detailed run record
seals stdout `4777` bytes / `cef33b8f...`, result `4146` bytes /
`30441740...`, cleanup-aware metadata `1809` bytes / `ec338025...`, empty
stderr, and exact plan ID
`release-qa-strict-restore-abort-v2-03f37c3c16ee7cc632c49a6b87f23819b398146fd8a0fe1c6aff5cbdcca47456`.
Contract `2`, `main-wal`, exact WAL/family/classifier binding, absent target,
both mutation counts `0`, and the exact `.strict-restore-work-v1` six-field
temporary-work object pass.

Published execute-only authority
`fd31b1f41b7c16521cf0eceb2c4af4a33a242636` dispatched the exact
`969`-byte / SHA-256 `bad1c78f...` command once. Native status was numeric `0`;
stdout/stderr/result seals are `4902` / `74610bcc...`, `0` / `e3b0c442...`, and
`3896` / `3d67f676...`. Result
`RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED` passed at contract `2`,
`replayed: false`, `0/2`, source preserved, target verified at `cf3ca07d...`,
receipt `24adf2d...`, and the exact performed/materialized temporary-work object.
The auxiliary status artifact's sealed literal three-byte `0\n` /
`101770a4...` serialization defect was not repaired; native wrapper status,
complete result, and postflight make execution unambiguous.

Envelope `7318` / `14733405...`, postflight `2059` / `fdd169d5...`, held probes
`1136` / `2d634d0d...`, cleanup `928` / `299496df...`, and final metadata
`5566` / `59cb7e89...` bind unchanged source family, exact target/receipt,
absent sidecars/journals/work, zero holders, full hold, and capture cleanup.
First-execute authority is consumed and cannot be rerun.

The one authorized replay is now `PASS / AUTHORITY CONSUMED / NO RERUN`.
Action-preflight script/result `9561` / `2837` bytes (`7f9f378a...` /
`b454c5a6...`) bound exact B2, `20` runtime keys, nine absent providers, three
snapshots, and two ten-process/`92`-descriptor zero-denied/zero-holder scans.
The same `969`-byte / `bad1c78f...` command dispatched once with native status
`0`; wrapper/envelope are `4098` / `7349` (`95cf1aa5...` / `63e4e662...`),
stdout `4905` / `65431c4c...`, stderr `0` / `e3b0c442...`, replay status `2`
/ one LF / hex `30 0a` / `9a271f2a...`, and canonical result `3899` /
`8b21edc8...`. Contract `2`, `replayed: true`, `0/0`, exact no-work object,
unchanged source family, and byte-identical target/receipt pass. The historical
first-execute three-byte literal `0\n` wart remains sealed and unrepaired.

Postflight script/result `12559` / `3047` (`c2e034de...` / `07ad847d...`)
passed three snapshots, five absences, and two ten-process/`92`-descriptor zero-
denied/zero-holder scans. Probe result `995` / `a31a8877...` passed live/ready
`200`, session/leagues/current-FAD `503 SERVICE_MAINTENANCE`, `no-store`, and no
`Set-Cookie`. Render stayed sole-newest/`LIVE` exact-B2
`dep-da6ghj67bikc738hbbv0`, no newer/pending deploy, auto-deploy off, and zero
error/`5xx` logs; Netlify stayed unchanged ready
`6a8c006abe46c8fb6269c40c`, six headers/two redirects/zero functions. Cleanup
script/result `11629` / `4023` (`9a908635...` / `67b1adbe...`) removed only the
three captures and preserved protected files. Final metadata `6012` /
`b2f706da...` records `HL23_ABORT_V2_REPLAY_EVIDENCE_COMPLETE`.

The now-consumed helper-retirement-only dispatch authority was published in
exact commit `7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb`, based on replay-evidence
commit `296cd690382b87a1cd4647ca98a24f14e98ee8ff`. It authorized exactly one
staging Netlify CLI publication. That dispatch ran once and must not be retried.
The consumed contract bound site
`95af8aa7-0b13-4954-af6d-855762acb147`, then-current helper deploy
`6a8c006abe46c8fb6269c40c`, title
`HL-20260823-1-abort-v2-retire-helper-baseline`, immutable original-dist `33`
files / `1932120` bytes /
`2d8069ca1aa61e02b5be14b09b97ded73b8363ae5e699c0e712f32026903ae6c`,
and exact five-header baseline config `1664` bytes /
`7720d21350b54735e11c86fd6fd4282887c7ce6e92b7d33ce9fdf788f66db422`.

The pre-dispatch requirements below are retained solely as the consumed
dispatch contract; their imperative wording grants no new action authority.
A new ignored, local-only preflight must be authored, frozen, and cold-audited
before dispatch. It verifies original-dist and frozen source config
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-control\netlify.toml`,
plain non-reparse `E:\Codex`, and absent `E:\Codex\temp`. The tracked helper-era
verifier is not authority for this no-tracked-edit path.

The wrapper exclusively creates owned `E:\Codex\temp`, external runtime control
`E:\Codex\temp\HL-20260823-1-helper-retirement-control-v1`, and separate profile
`E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`; created owner SIDs
must equal the wrapper process user SID. Control inventory at CLI start is only
the copied regular `1664`-byte / `37`-LF / zero-CR / five-header /
`7720d21350b54735e11c86fd6fd4282887c7ce6e92b7d33ce9fdf788f66db422`
`netlify.toml`; all six CLI-scanned function/edge paths are absent.

The shell-free action pins portable Node `24.14.1`
`E:\hundo-leago\.tools\node-v24.14.1-win-x64\node.exe` (`91426304` bytes /
`58e74bf02fc5bbacc41dcb8bef089961cd5bddd37830b87784e4fc624d145d1f`) and
direct Netlify CLI `27.0.0`
`C:\Users\graem\AppData\Roaming\npm\node_modules\netlify-cli\bin\run.js`.
Package/run seals are
`b5f0e60f06b774e0d087c735557e19f47ec25c56e9d5695b045f28a188e56156`
(`7358`) and
`e39432e46703049b6769e17c0a7a8f1748c345100a1f934d8a6c7076001d426c`
(`2800`); npm/npx/PATH resolution, `--cwd`, and an empty `.git` sentinel are
forbidden. CLI deploy has no `--config`; physical/logical cwd and config/
repository-root discovery resolve to the external control.

Bind `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`, `TMP`,
`XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `XDG_DATA_HOME`, `XDG_STATE_HOME`, and
`XDG_RUNTIME_DIR` to exact fresh E-scoped profile
`E:\Codex\temp\HL-20260823-1-helper-retirement-profile-v1`
with `CI=1`; and keep `NETLIFY_AUTH_TOKEN` child-environment/in-memory only, never
argv/capture/persistence. Exact argv is
`deploy --site 95af8aa7-0b13-4954-af6d-855762acb147 --dir E:\hundo-leago\.netlify\strict-release-HL-20260823-1\original-dist --no-build --skip-functions-cache --prod --message HL-20260823-1-abort-v2-retire-helper-baseline --json`.
Exact repo-ignored capture root
`E:\hundo-leago\.netlify\strict-release-HL-20260823-1\helper-retirement-captures`
must be exclusively acquired as the one-shot dispatch lock; residue consumes
authority and forbids retry.

The helper-retirement action preflight process environment has exactly the eight
keys `SystemRoot,WINDIR,ComSpec,PATHEXT,PATH,CI,NO_COLOR,NO_UPDATE_NOTIFIER`.
`SystemRoot`, `WINDIR`, `ComSpec`, and `PATHEXT` are copied exactly from the
wrapper process, with respective fallbacks `C:\Windows`, `C:\Windows`,
`C:\Windows\System32\cmd.exe`, and `.COM;.EXE;.BAT;.CMD`; `PATH` is exactly
`C:\Program Files\Git\cmd;C:\Windows\System32;C:\Windows`, and the constants are
`CI=1`, `NO_COLOR=1`, and `NO_UPDATE_NOTIFIER=1`. The deploy child environment
has exactly the 22 keys
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

Pre/post proof requires Netlify `build_settings: {}`; repo URL/branch, build
command, publish directory, and `stop_builds` absent or null; exact full hold;
source `DATABASE_PATH`; and inactive target/receipt. Dispatch is one-shot and
consumes authority; no blind retry. A pass requires one new current/ready CLI
deploy with five headers/two redirects/zero functions/zero edge functions,
`64/64` remote baseline bytes, `8/8` baseline headers, and `10/10` retired
helper paths across both origins, then mandatory stop.
Only after provider/HTTP/capture/postflight evidence is accepted may cleanup
remove the exact external control/profile, then owned `E:\Codex\temp` only if empty;
source config, original-dist, captures, and evidence remain preserved.
Render/environment/database changes, tracked `netlify.toml`, helper
source, original-
dist, rebuild, activation, verifier/backup, staging reopening/final review,
browser, closeout, and production remain unauthorized. The similarly named
`HL-20260822-1` strategy below is historical and cannot satisfy this sequence.

#### 2026-08-25 Helper-Retirement Post-Dispatch HTTP-Verifier Amendment

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

#### 2026-08-26 Helper-Retirement Completion

Published incident amendment `0498fd4fd400e8aad16c4cf9c405165d420bd489`
enabled only the corrected evidence sequence. One-dispatch authority
`7dd9075f18a001d85fb5783b5b4dfae4a3fb19fb` remains consumed; no retry ran or
is authorized. Refreshed provider postflight is `1862` bytes / SHA-256
`68cd773b3e2f104d71f8c96ce299eea7d89f542d8e5f449f33da4327100f9acd`.
The corrected official network-read-only result at
`2026-08-26T05:25:45.785Z` is `23014` bytes / SHA-256
`d0ef4d2ed2cf848fbec5959012c929c36a2ea3d74f684d836a6d809fe6d76d46`
and passes `64/64 + 8/8 + 10/10 + 5/5`, with no cookies sent and no writes
attempted. Local postflight is `4837` bytes / SHA-256
`6941c238289713ee3012a2abe868380dd240c46a8a44ff06e5a7a36c7c7ed4a8`;
cleanup is `1211` bytes / `1` LF / zero CR / final LF / SHA-256
`b49aca2fa65c2039c5b6e4661e9cf981dd9f29b9a1fdfaddac779609bca00c78`
at `2026-08-26T05:33:33.808Z`. Cleanup removed only exact external profile,
runtime control, and empty temp parent; baseline/captures/evidence remain. The
two false negatives, diagnostic, reconstructed chronology, and current kit
pins remain evidence. Helper retirement is `PASS / AUTHORITY CONSUMED / NO
RETRY`. At the N23 completion boundary, mandatory stop forbade activation,
backup, reopening/review, browser, closeout, and production. V1 and V2 were
later rejected at their recorded boundaries. V3 later completed its one
provider mutation and consumed its authority; O23 acceptance now awaits the
separately authorized V4/O23A read-only continuation below. Chrome disk/FD
reproof remains pending.

#### 2026-08-26 RC-STG-006O23 V1 Held Target-Handoff Test Authority - Rejected / Unconsumed Historical Evidence

Published commit `e855be9e1a4d92cd6428175965ecf934653ae965` recorded this V1
test design on frontend evidence base
`a0da13a5a6a1c1edb352aa1b606d0d3b97aec020` and exact held backend B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`, but action control rejected it
before PRE with `AUTHORITY_DOCS_DO_NOT_PIN_FROZEN_KIT`. It omitted exact frozen
artifact paths, never armed, made no provider call, and left O23 unchecked and
unconsumed. Every V1 pin/procedure below is immutable historical evidence only
and cannot authorize a test or mutation. Helper retirement remains
`PASS / AUTHORITY CONSUMED / NO RETRY`.

The frozen ignored pre-publication kit is pinned by manifest `7290` bytes /
`203` LF / zero CR / final LF / SHA-256
`0d3c5f2e1500b239efcf086818f6446ed31ab25f830ea951bacb4a5f8fc582af`
and canonical artifact-set SHA-256
`0ef3f7d87792727d321f938efd41ef5bf637f61fe155e64770a9b4e7bf556ee0`.
Every manifest row is exact (bytes/LF/SHA-256; all zero CR/final LF): contract
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
Independent cold audit passed all 11 pins, eight JavaScript syntax files,
`bash -n`, `10+` positive and `15` negative fixtures, 19 required guards, and
18 forbidden-operation absences. The manifest's false activity fields apply
only to support-kit authoring/local tests; they make no release-wide claim.
Its pre-publication runtime, critical-delta, semantic, and backup fields say
required/currently false or deferred, not already verified.
The pinned `26170`-byte held verifier is the required new abort-v2/main-WAL-
aware boundary verifier; no predecessor verifier may be reused.

After publication, create and audit the separate ignored immutable authority
binding without changing any frozen byte. It binds the full authority commit,
kit and invocation/result hashes, exact phases/tool/arguments, and permanent
tombstone
`target-activation-captures/hl-20260823-1-<authority16>-464f2e4805c79aef/`.
Both raw phases are boundary tests only. In each new Chrome-attached Render
shell, first set `HISTFILE=/dev/null`, disable history, and clear in-memory
history; then stream the exact pinned payload through stdin only as
`bash -s -- pre-boundary dep-da6ghj67bikc738hbbv0` or
`bash -s -- activation-post dep-<new>`. No remote verifier/payload file,
SQLite/project database module, database open, copy, checkpoint, sidecar
removal, scratch path, or write is allowed. Every raw result must state
`externalAuthorityBindingRequired=true`,
`externalAuthorityBindingVerifiedByVerifier=false`,
`standaloneAcceptanceAuthorized=false`, and
`verifierGrantsMutationAuthority=false`; only the external binding-aware local
envelope may authorize the phase.

PRE must prove exact B2 and hardened clean Git state; source `DATABASE_PATH`;
the exact critical 20-key/nine-absent runtime matrix; source main/WAL/SHM,
target main, and canonical receipt v2 at their durable identity/stat/hash pins;
source journal, target WAL/SHM/journal, and deterministic work path absent; four
stable boundaries; two complete zero-denied/zero-holder scans; and full hold.
Device identity is namespace-local: all five protected files share the current
container's device, but PRE and POST device numbers are never compared. The
receipt's historical device fields remain byte-bound. Five fresh anonymous
no-cookie/no-write probes separately prove two health `200` and three exact
held `503 SERVICE_MAINTENANCE` responses.

Immediately before arm, capture a complete paginated cursor-closed deploy-ID
edge set no more than two minutes old. Exclusive creation/fsync/re-read of the
authority root, attempt, and separate tombstone seal permanently consumes the
one-shot authority before dispatch. The only mutation is exactly one call to
`mcp__render__update_environment_variables` with canonical arguments
`{"envVars":[{"key":"DATABASE_PATH","value":"/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3"}],"replace":false,"serviceId":"srv-d9eo2turnols73ekb830","workspaceId":"tea-d4prbj7diees738tmg90"}`,
exactly `247` bytes / SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`.
The target/source values are each `103` bytes with SHA-256 values
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`
and `50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3`.
Do not call `trigger_deploy`, retain raw connector output, retry after error/
timeout/disconnect/ambiguity, or perform an automatic inverse rollback.

Provider-only evidence cannot prove source/target `DATABASE_PATH`, target
inactivity, or maintenance hold. It records only the exact requested target
call plus unique resulting deploy/build/service/log facts and must say
`providerEnvironmentReadAvailable:false`. A complete cursor-closed POST set
difference of exactly one new deploy ID is required; any second ID, incomplete
pagination, returned-ID mismatch, or contradiction is ambiguity and stops with
no retry. The new deploy must be sole newest/`LIVE`, API-triggered on B2, with
the old deploy deactivated, no competitor, observed Node `24.14.1`, npm
`11.11.0`, all `443` suites / `3519` tests passing, and complete clean build and
runtime log-source windows.

The fresh POST shell and held probes must prove actual target
`DATABASE_PATH`, full hold, only that one critical runtime-binding change, and
unchanged source family/target/receipt durable identities and hashes except
namespace-local device. The target remains selected but unopened; target WAL,
SHM, journal, deterministic work, and source journal remain absent; four stable
boundaries and both zero-holder scans pass; and no SQLite/scratch/write work
occurs. Combined local acceptance—not raw shell or provider evidence alone—must
record `runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`. Cleanup revalidates and deletes
nothing. Then mandatory stop.

`RC-STG-006P23` remains unauthorized. It must later and separately authorize a
private-copy semantic verifier plus fresh backup, including integrity `ok`,
zero foreign keys, schema/data/migrations `54/54/54`, exact migration checksum
and credential-rotation receipt, zero active sessions, and zeros for current/
predecessor/older fixture receipts, receipt events/fixture league, manager
assignments/activity/idempotency/notifications, and outbox events/audiences.
O23 cannot satisfy those checks. Reopening/final review, normal restore,
rollback, closeout, browser workflow, production, and any second provider update
remain forbidden.

#### 2026-08-26 RC-STG-006O23 V2 Correction Test Authority - Rejected During Local Arm / Unconsumed / No Retry

> Historical boundary: every conditional execution statement in this V2 section
> describes the now-rejected frozen design only. It grants no present authority,
> must not be resumed, and is superseded only by the separately pinned V3
> correction below.

The published V2 correction was not a V1 retry because V1 never armed. Preserve the V1 kit
and immutable rejected binding unchanged at
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
`target-activation-v2-authority-binding.json`. O23 remains unchecked. Each line
below is exact, standalone, and unique; the `15` lines joined in this order with
LF and no trailing LF have SHA-256
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

The frozen V2 runbook described only the bounded O23 shell-boundary sequence recorded
above under the new filenames, binding, and distinct permanent tombstone
`target-activation-v2-captures/hl-20260823-1-v2-<authority16>-df755011d0e4d4b1/`.
PRE and POST use the pinned new abort-v2/main-WAL-aware verifier through stdin in
fresh no-history shells. They perform no SQLite/scratch/copy/write work, prove
the exact source-to-target runtime-path-only delta, full protected family and
receipt, absences, full hold, and two complete zero-holder scans, and treat
device IDs as namespace-local. Provider evidence must say
`providerEnvironmentReadAvailable:false`; shell/probes prove runtime path/hold.

After a fresh complete deploy-ID edge set and durable tombstone, exactly one
`mcp__render__update_environment_variables` call is allowed with only
`DATABASE_PATH`, `replace:false`, canonical `247`-byte arguments SHA-256
`464f2e4805c79aef21a2e66dad0a4c46afc364c11b0bebb7d3e889d5575b373f`,
source/target value hashes `50eb4aaf0c007b3722c81d78ad1527ab32f9bbd116b19e3044c9397079db03a3` /
`4f07a7d35f7bb2787a57e718bbadfc6917087f67144977a5ed6f7244d859f645`.
No trigger, retry, automatic inverse, or second provider update is authorized.
POST requires a complete one-ID B2 deploy-set difference, target selected but
unopened, unchanged source/target/receipt identities and hashes except namespace-
local device, absent target WAL/SHM/journal/work, zero holders, and full hold.
Combined acceptance alone records `runtimeDatabasePathVerified=true`,
`criticalRuntimeBindingDeltaExact=true`,
`semanticTargetVerificationDeferred=true`, `backupAuthorized=false`, and
`globalProviderEnvironmentDeltaProven=false`; cleanup deletes nothing, then
mandatory stop. P23 semantic verification/backup, reopening/review, normal
restore, rollback, browser workflow, closeout, production, and all later gates
remain forbidden.

#### 2026-08-26 RC-STG-006O23 V3 Correction Test Authority - Action Succeeded / Consumed; Acceptance Pending O23A; Old POST Path Blocked

> Historical boundary: this section preserves the V3 authorization design and
> its exact pin block. V3 later consumed its authority and completed exactly one
> successful provider mutation. Its imperative PRE/POST wording grants no present
> authority, and its old POST path must never be resumed or populated.

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

#### 2026-08-26 RC-STG-006O23A V4 Read-Only Evidence Continuation Test Authority - Authorized Next / Pending Publication and Binding

Consumed V3 authority `43e99e686214a2f36f52ee7c426db2015d709bee`
completed exactly one successful provider `DATABASE_PATH` mutation and returned
sole newest/`LIVE` exact-B2 deploy `dep-da7d857avr4c73bnna90`. Its old POST path
is permanently blocked solely because exhaustive hosted logs lacked an explicit
npm `11.11.0` observation; all eight named V3 POST artifacts must remain absent
forever. V3 must not be retried or backfilled. O23 remains unchecked with its
acceptance pending O23A.

V4/O23A must be one literal non-merge exact-nine documentation child of
`43e99e686214a2f36f52ee7c426db2015d709bee`, published as frontend `HEAD` and
`origin/staging`, while backend `HEAD`/`origin/staging` remain clean at exact B2
`6359ec9997f90dddf17ba2c9b07481746ae171bb`. Only then may the separate ignored
immutable V4 binding be exclusively generated and audited. These are the exact
`21` runner-emitted authority rows; final-row success fields define the future
accepted state and do not claim the two currently unchecked gates passed.

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

### M7-26 Fresh Strict Rerun - 2026-08-22 (BLOCKED; ABORT-RECOVERED; VERIFIED HELD RECOVERY COMPLETE)

Release `HL-20260822-1` attempted the complete hosted privacy gate from the
clean held database restored after the rejected prior attempt. It is now
blocked and abort-recovered to a clean target. It must not be resumed or have
its helper marker, idempotency keys, publisher confirmations, fixture receipt,
target, or activation receipt reused.

The corrected staging-only T-132 diagnostic counts each distinct successful
TanStack Query instance once. It records physical evictions and successful
replacements separately, so focus-triggered updates on one Query object do not
inflate the comparator. The exact two-cookie sequence remains strict:

```text
1/0/0 -> 2/1/1 -> 3/2/2
```

Exact frontend build `4dfe12d1366314e3d9df722c50771324647743c9`
passes `402/402` tests across `59` files, ESLint, the `20/20` browser-authority
gate across `164` shipped sources, `45/45` Playwright cases, and the
staging-configured production build. Sealed Netlify baseline
`6a8a3880f946cc39a2bf2bb6` passes `64/64` remote byte checks. Exact fresh
backend commit `8e313902feefcd683b0f5edd746a9dd2a9029a18` passes its isolated
strict-restore gate at `57/57` in `347.592s`. Under Node `24.14.1` / npm
`11.11.0`, `npm run check` and `npm ls --all` exit `0`, and the complete suite
passes `443` suites and `3,503` tests (`3,501` pass, zero fail, two intentional
Windows skips, zero cancelled/todo) in `15172.429s`. Its full TAP SHA-256 is
`aa07d1df79e549c5b7828065d511c297737ef96c4c6cc422779850c802f8b663`.
Backend `origin/staging` resolves exactly to that commit. Held deploy
`dep-da5l8drtqb8s73ar74sg` is `LIVE` on exact B after `443` hosted suites /
`3,503` tests all passed with zero fail, cancel, skip, or todo in
`2954563.480743ms`. Its build/startup, zero-startup-error, live/readiness
`200`/`no-store`, and held `/api/v1/leagues` `503`/`no-store` gates pass.

The fresh exact-B/F full-hold preflight proved source plaintext SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`, absent
target/sidecars/receipt/work area, and reverified backup `2044fcae...` with the
same plaintext hash, integrity `ok`, and zero foreign-key violations. Exact
fixture preparation then reported `replayed: false` /
`databaseWriteCount: 744`; its immediate identical replay reported
`replayed: true` / `databaseWriteCount: 0`. Both bind receipt
`88a56507-73fd-47f9-ac66-c305f0075d24` and deadline
`2026-08-24T07:00:00.000Z`. Post-fixture held preflight recorded source
`37761024` bytes / SHA-256 `c26fdebc...` and an absent target boundary.

Helper deploy `6a8b678ddbcf0b4ea8ba623c` passed its canonical/immutable
four-file byte/header and sealed-critical-file gates. A physical `.html`
browser entry then failed the exact-path initialization guard as `STRICT_STOP /
ORIGIN_GUARD / EXACT_STAGING_ORIGIN_REQUIRED`, with all controls disabled. The
tab was closed without replacement. The full hold never lifted and Render
recorded zero requests from `21:35Z` through `21:42Z`, so no session check,
action, endpoint call, or persistent write ran. The hosted comparator was never
started; its acceptance remains unproved.

Abort plan/execute/replay passed at exact `prepared_only` / `none/none`. The
plan made zero mutations and cleaned temporary work; execute preserved the
source and materialized the clean target at SHA-256 `cf3ca07d...` with receipt
SHA-256 `b846edcffca67b1e6ba29e7ff2d1335d44f30ab251bc4daf40e9dd49de920592`;
the immediate replay made zero mutations and no temporary work. Sealed-baseline
deploy `6a8b6b25126dabed39fa404d` retired the helper, and all `10/10` retired path
checks passed. Only `DATABASE_PATH` then changed; held cutover deploy
`dep-da5mmpu417fc73807ptg` was the then-newest `LIVE` deploy on exact B at the
recovery boundary after all `3,503` hosted tests, zero-startup-error, and held
health/readiness/maintenance gates passed. Corrected exact-Node-`24` verifier v2 returned
`HL_POST_CUTOVER_TARGET_VERIFIED`; it proved the preserved source,
authoritative clean target and abort receipt, full hold/provider absence,
target identity/integrity/schema/checksum/rotation receipt, zero sessions, all
ten fixture/transfer artifact counts `0`, and owned scratch cleanup without
opening the authoritative database. Fresh backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` and separate plaintext/integrity/
foreign-key verification passed. Retained verifier v1
`6157adfd598cbf9d7d306dd849822e494ffefe7aee29f3eb14ce2ea4d9ec38c7` is
diagnostic
only; its pre-backup `SCRATCH_SIDECAR_PRESENT` stop was caused by its own
transient scratch sidecars and was corrected in v2
`61610cb991fb049075f4b997688da31bacf20b772ede4f994c197298b40f76a0`. The full hold
remained active and recovery completed. At that boundary no new release was
authorized; the later `HL-20260823-1` record is current.

The closed release contract and recovery ledger are recorded in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-22.md`. The final
interactive-review matrix keeps the scheduler, account email, debug routes,
live provider, and backup schedule disabled. Provider-neutral statistics/job
operation, T-067/T-093 late-legality evidence, T-074 buyout cancellation, and
production migration remain separate launch gates rather than waivers or
scope additions to this rerun. So do the account/session contract gaps: T-005
must return promised memberships/defaults, and T-004/T-006/T-007/T-009/T-011
revocation or replacement must proactively disconnect affected live Socket.IO
clients. None is claimed fixed by this rerun.

### Historical M7-26 Held-Staging Evidence - 2026-08-21 (BLOCKED; RECOVERED)

The current frontend candidate has passed `386/386` tests across `58` files,
ESLint, dependency inspection, exact staging build, `20/20` browser-authority
compatibility cases across `164` shipped sources, and `45/45` Playwright
cases. The pre-rotation backend discovered `3,428` tests across `443` suites
locally: `3,426` passed and the only two skips were the intentional Windows
link-capability cases. Held migration deploy
`dep-da4e092fngtc739dipm0` at commit `a747430...` passed `3,428/3,428`; held
final deploy `dep-da4gkpoed13c739gm0dg` at exact commit
`fe6047552857376b490756ff63ac593d431ee561` passed the expanded
`3,440/3,440` hosted gate with no skips.

Against the exact identity-bound staging database, the exhaustive public FAD
receipt scan ran read-only on schema `52` before migration and schema `54`
after migration. Each run reported zero T-082 receipts, zero T-144 receipts,
zero malformed unsafe receipts, safe public replay, and a zero
`total_changes()` delta. Because this staging fixture contains no persisted
receipt in either family, constructed legacy full-money cases remain covered
by the automated projector/validator gates rather than falsely claimed as
hosted persisted-receipt replays.

Repeated authority previews returned `mutationRequired: false` with all six
mutation arrays empty, so no authority reconciliation ran. Schema `52` to
`54`, both encrypted backup verifications, the distinct clean restore, and
post-migration integrity/foreign-key checks passed. Netlify staging deploy
`6a89709ffc9c88762ae8e74e` published exact frontend build
`0e8eee92e2e323dd7f25ec3112988feaf23f96f0`.

Under the full hold, a separately verified pre-rotation backup protected the
first credential write. The staging-only command rotated nine synthetic
release-QA accounts, revoked one active synthetic session, recorded receipt
`d5e9c784-db5f-42f6-8fcb-1918e93f26c0`, and replayed with zero writes. A
post-rotation backup then verified with integrity `ok` and zero foreign-key
violations. No password or secret appears in the evidence.

Quiescent deploy `dep-da4hm30jo6nc73d26l80` passed the exact `3,440/3,440`
hosted gate, zero-startup-error check, public health, anonymous session/CORS/
cache contract, and sequential basic Chrome sign-in/dashboard/sign-out smoke
for the administrator and two Alpha League manager accounts. Notifications was
not opened. FAD routes remained disabled, so the strict selected-team tie and
manager-transfer privacy/cache gates were not run. No split-evidence approval
has been given; the complete gates remain part of final acceptance.

Grae subsequently selected the strict hosted-evidence path. The planned gate
uses an isolated sidecar fixture, does not rewrite Gamma League's historical
records, runs the live `A -> B -> A` smoke, and restores its exact pre-fixture
backup afterward. The pre-fixture restore point is now verified backup
`adcbbbab-e857-4cae-af71-dbce95553ce5`.

The shared staging QA password was then disclosed in chat and is treated as
compromised without recording its value. Second rotation `HL-20260821-2`
rotated nine accounts, revoked zero sessions, wrote receipt
`9152f844-d8cd-42f7-b0d5-b12f530ad618`, and replayed with zero writes. Its
fresh post-rotation/pre-fixture backup independently verified.

#### Historical `HL-20260821-3` strict recovery and publisher contract

Under exact Node `24.14.1`, the release-bound `HL-20260821-3` four-command
restore family passed `56/56` focused tests and the selective manager-outbox
publisher separately passed `56/56`, plus syntax and package parsing. These
are frozen component gates, not hosted execution evidence. The restore tests
pin the single staging service, source path, absent inactive target, backup
manifest, storage object, encrypted/plaintext/manifest hashes, schema `54`,
migration checksum set, environment/database identities, and frontend build
`0e8eee92e2e323dd7f25ec3112988feaf23f96f0`. The executing backend build is
captured from `APP_BUILD_ID` in the exact plan and receipt.

The combined strict candidate subsequently passed the complete local Node
`24.14.1` gate across `443` suites and `3,502` tests: `3,500` passed, the two
Windows link-capability cases were intentionally skipped, and zero failed. Its
durable TAP SHA-256 is
`ED2BCC54D252925548658DA95E32E6C5152C8A52AE1681ED5D0388DE6516CCF6`.
Exact commit `23971a4d66ee6383c6ad54339e769dbc9a76561e` is published on
`origin/staging`. Exact held deploy `dep-da4p5hu7bikc73aaeiq0` finished `LIVE`
at `2026-08-22T13:05:02.585588Z`, passed `3,502/3,502` with zero skips/failures
and clean startup, and passed the pinned environment/full-hold/provider-
absence plus source/root/target/work/WAL/SHM boundaries. Live/ready returned
`200`; session remained `503 SERVICE_MAINTENANCE`.

The exact backup then reverified with plaintext SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`, SQLite
integrity `ok`, and zero foreign-key violations. Strict preparation reported
`replayed: false`, `writeCount: 744`, receipt
`0ed590d8-832a-469a-848e-f91b0b37fe56`, and the frozen fixture identifiers;
its immediate exact replay reported `replayed: true` and `writeCount: 0`.
Controlled-unhold deploy `dep-da4pvcrl550s738l8rmg` reached `LIVE` on exact
commit `23971a4d66ee6383c6ad54339e769dbc9a76561e`, passed `3,502/3,502`, its
pinned open-smoke runtime boundaries, liveness/readiness, anonymous-session/
CORS/cache checks, clean startup, and two-minute log observation. The strict
hosted run subsequently executed phase one but failed its exact Manager B
counter gate. No restore or activation result is inferred from that rejected
smoke.

Automated restore safety evidence covers:

- refusal outside the full staging hold or on wrong environment, database,
  service argument, source, target, backup, schema, checksum, build, path,
  sidecar, or typed-plan evidence;
- operator-asserted attached-service context without a false claim that the
  command independently queried Render;
- separate normal plan/execute and abort plan/execute namespaces whose plans,
  confirmations, and receipts cannot cross modes;
- both plan modes reporting zero authoritative-database and zero durable-
  filesystem mutations while accurately disclosing temporary plaintext
  materialization in a deterministic private `0700` work area and verified
  cleanup;
- preservation and fail-closed refusal for an unexpected existing work area,
  plus allowlisted cleanup for process-local failures; abrupt-termination
  residue remains a manual-review blocker under the hold;
- normal execute-time semantic proof of the commissioner-created initial Team
  1 assignment, exact platform-Admin-proposed and manager-accepted
  `A -> B -> A` chain, unchanged Team 2 assignment, both exact publisher rows
  `published` once with attempt `1`, row version `3`, exact payload/audience,
  and no auction bid/resolution/allocation/allocation-event drift;
- abort classification limited to `prepared_only` (`none/none`),
  `to_b_pending` (exact proposal/idempotency/one delivered notification,
  `none/none`), `to_b_accepted` (phase one
  `pending|publishing|failed|published`, return `none`),
  `return_to_a_pending` (phase one `published`, exact return
  proposal/idempotency/one delivered notification, return `none`), and
  `return_to_a_accepted` (phase one `published`, return
  `pending|publishing|failed|published`), including publisher-crash
  `publishing` states;
- `sourceSemanticChainCompleted: true` only for `return_to_a_accepted`, while
  every abort output/receipt reports `smokeCompleted: false`,
  `hostedSmokeCompleted: false`, `releaseBlocked: true`, and
  `rollbackOnly: true`; every unclassified or inconsistent state fails closed;
- candidate verification for the exact second-rotation receipt, zero active
  sessions, integrity, foreign keys, schema, checksum, identity, and absence
  of the sidecar fixture;
- no-replace publication of only the inactive target and mode-specific durable
  receipt, preservation of the source, cleanup on partial publication/source
  drift, rejection of target/receipt tamper, and the one-way recovery rule that
  only receipt-present/target-absent may resume after manual work-area review;
  and
- exact replay with zero authoritative-database and durable-filesystem
  mutation, no temporary plaintext work, no object-store request, and no
  encryption-key resolution.

The selective publisher component evidence covers the in-process
`POST /api/v1/operations/release-qa/strict-manager-outbox` route. It mounts
only on the exact source database and exact open-smoke bindings while
`SCHEDULED_JOBS_ENABLED=false`. Under the full hold the target runtime and
route are not composed and the maintenance server returns
`503 SERVICE_MAINTENANCE`; with the hold false, the restored target or binding
drift leaves the route unmounted and returns `404`. Browser security requires
the exact accepting-manager session, current `X-CSRF-Token`, allowed staging Origin,
compatible fetch metadata, credentialed cookies, JSON content type, and the
exact phase `Idempotency-Key`. Each body contains exactly `backendBuildId`,
`confirmation`, `phase`, and `releaseId`.

Phase one requires Manager B
`c2684bf0-d30d-4b37-ae14-66620259798e`, phase
`team1-to-manager-b`, confirmation
`PUBLISH-HL-20260821-3-TEAM1-TO-MANAGER-B`, and key
`HL-20260821-3-outbox-team1-to-manager-b`. Phase two requires Manager A
`e9f723c4-32d2-4823-a1d4-233fe0ce2f45`, phase
`team1-return-to-manager-a`, confirmation
`PUBLISH-HL-20260821-3-TEAM1-RETURN-TO-MANAGER-A`, and key
`HL-20260821-3-outbox-team1-return-to-manager-a`. The surrounding direct Admin
proposal and accepting-manager acceptance calls must have the four fixed keys
`HL-20260821-3-team1-to-b-propose`,
`HL-20260821-3-team1-to-b-accept`,
`HL-20260821-3-team1-to-a-propose`, and
`HL-20260821-3-team1-to-a-accept`.

A fresh publisher success uses only the canonical Socket.IO publication
service, performs exactly two database writes for the target event claim and
published transition, and proves the scheduler remained disabled. Gamma,
Team 2, job state, and unrelated outbox state remain byte-equivalent; exact
already-published replay is zero-write. A failure, crash, or persisted
`failed`/`publishing` state is never retried: the operator re-holds and selects
abort recovery.

Grae has authorized a temporary canonical-origin same-cookie action helper for
this strict staging run. Its first hosted publication stopped before any
action on canonical-URL and response-header drift. Corrected deploy
`6a89e2c867e39d41cc630a26` passed the hosted artifact/header and inert-
initialization gates and executed phase one. The exact T-132 Manager B counter
then failed, so the release is blocked. Exact sealed-baseline deploy
`6a8a09c13d5e25282f64d2c7` passed remote helper-removal verification. Abort
materialization and exact replay pass; restored-target cutover deploy
`dep-da51hjvqj5pc73bh8g3g`, target verification, and post-cutover backup also
pass under the unchanged full hold. No full privacy-smoke pass is inferred. The
helper gate requires:

- the overlay is additive under
  `/release-qa/hl-20260821-3/` on exact origin
  `https://staging.hundoleago.com`; its only accepted page URL is exact
  extensionless
  `https://staging.hundoleago.com/release-qa/hl-20260821-3/strict-manager-transfer`,
  and any uppercase-path or `.html` redirect fails before action; every path
  from Netlify baseline deploy
  `6a89709ffc9c88762ae8e74e` remains byte-identical, including frontend build
  `0e8eee92e2e323dd7f25ec3112988feaf23f96f0`, `dist/index.html` SHA-256
  `1982ECF04CC456D989F7B42F15F3CED49A5D825DF0DEDD948DEAFFE8D8C1ADC8`, and
  `dist/assets/index-CI54gRot.js` at `527839` bytes with SHA-256
  `5B2336E5B1E099EF32747B48124C331495CEFAD1511E26D244E09D5567460394`;
  the helper/marker responses are `Cache-Control: no-store` with
  `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `X-Robots-Tag: noindex, nofollow, noarchive`, and
  the exact narrow response CSP including `frame-ancestors 'none'` and
  `object-src 'none'`; the HTML meta CSP omits only the inapplicable
  `frame-ancestors` directive; the single header authority is an exact
  temporary helper-scoped `netlify.toml` rule for
  `/release-qa/hl-20260821-3/*`, no helper `_headers` artifact exists, all
  global/non-helper rules and responses remain unchanged, and no separate
  `netlify.app` origin or Render `FRONTEND_BUILD_ID` change is permitted;
- after normal static document/script/style loading, initialization issues zero
  script-initiated API, fetch, XHR, or WebSocket requests and performs no
  write; explicit controls may read the session, each clicked proposal may
  additionally perform only exact read-only Team 1 precheck
  `GET /api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/teams/ebc815c7-8a41-4326-8faf-04548aa91c76`,
  and each clicked acceptance may additionally perform only exact read-only
  pending-assignment precheck
  `GET /api/v1/team-manager-assignments/<exact assignmentId emitted by the proposal>`;
  neither state/predecessor check runs during initialization or in the
  background, and each POST still requires exact actor verification, write
  arming, a separate explicit action, and a fresh session/CSRF read;
- its separate same-cookie action tab constructs an actual isolated TanStack
  Query `QueryClient` whose cache contains exactly zero FAD queries before,
  during, and after each action, without `RealtimeProvider`, Socket.IO, or any
  reference to the mounted application's QueryClient;
- its only modes are `propose-to-b` by Admin with key
  `HL-20260821-3-team1-to-b-propose`, `accept-and-publish-to-b` by Manager B
  with keys `HL-20260821-3-team1-to-b-accept` and
  `HL-20260821-3-outbox-team1-to-manager-b`, `propose-to-a` by Admin with key
  `HL-20260821-3-team1-to-a-propose`, and `accept-and-publish-to-a` by Manager
  A with keys `HL-20260821-3-team1-to-a-accept` and
  `HL-20260821-3-outbox-team1-return-to-manager-a`; each publisher mode makes
  only the approved fresh call and its immediate identical replay; and
- immediately before every POST, including a publisher replay, the helper
  fetches exact canonical-origin
  `/release-qa/hl-20260821-3/enabled.json` with `cache: no-store`,
  `credentials: same-origin`, and `redirect: error`; it requires status `200`,
  exact `response.url`, response type `basic`, media type `application/json`,
  and the exact eight-key object: `contractVersion: 1`, `enabled: true`,
  release `HL-20260821-3`, expiry `2026-08-23T07:00:00.000Z`, frontend build
  `0e8eee92e2e323dd7f25ec3112988feaf23f96f0`, backend build
  `23971a4d66ee6383c6ad54339e769dbc9a76561e`, frontend origin
  `https://staging.hundoleago.com`, and API origin
  `https://api-staging.hundoleago.com`. The helper fails before any POST at or
  after that exact expiry. No arbitrary URL/body/key, background write,
  automatic retry, password/cookie/token output, or Notifications read is
  permitted.

After browser evidence is captured, the temporary helper-scoped
`netlify.toml` block must be removed and the exact original configuration
restored before the exact audited baseline `dist/` is redeployed without
rebuilding it. Remote checks must re-prove the original index/bundle/all-path
hashes, unchanged non-helper global headers, and that the helper and marker
paths now resolve only to the normal SPA fallback. Because that fallback
cannot satisfy the marker's exact media-type/payload check, a stale helper tab
must stop before any later write. These cleanup checks and the entire helper
gate are staging-only; production remains untouched and unauthorized.

Corrected helper overlay deploy `6a89e2c867e39d41cc630a26`, title
`HL-20260821-3-strict-action-helper-v2`, was ready/published at
`2026-08-22T17:56:25.803Z`. Hosted verification passed `64` baseline and `8`
helper byte/header gates and preserved the pinned main application artifact.
An inert double-browser reload from `2026-08-22T18:04:01.882Z` through
`2026-08-22T18:04:06.741Z` produced zero Render request logs. Both helpers
reported `READY` with actual isolated QueryClient query/mutation caches empty;
session verification matched the exact Admin and Manager B fixture identities.
Every executed phase-one POST passed fresh-session/current-CSRF,
per-POST marker/expiry, and empty-QueryClient assertions. The proposal passed
the exact Team 1 state/predecessor GET, and acceptance passed the exact pending-
assignment GET; no other action-time state precheck ran.

Phase-one hosted execution recorded:

- Admin proposal `201`, assignment
  `17746270-0706-4420-8efd-2f476dc00c68`;
- persistent Manager A `complete 1/0/0` and Manager B `null 1/0/0` before
  acceptance;
- Manager B acceptance `200`;
- publisher event `acd9b9e8-9947-4988-8057-579737724869`, fresh response
  `200` / `replayed: false` / `databaseWriteCount: 2` /
  `schedulerRemainedDisabled: true`, followed immediately by exact response
  `200` / `replayed: true` / `databaseWriteCount: 0`; and
- settled Manager A `null 2/1/1`, which passed, and settled Manager B
  `complete 3/1/1`, which failed the exact required `complete 2/1/1` gate.

An extra focus-triggered refetch is plausible but unproven and is not a waiver.
Strict execution stopped. Notifications was never opened; no return proposal,
phase-two acceptance, or phase-two publisher call ran; no password value is
retained. Expected abort classification is `to_b_accepted`, phase one
`published`, return `none`. Partial-hold deploy `dep-da50g0v40ujc73aa5i4g`
was manually canceled at `2026-08-22T20:39:55Z` and never reached `LIVE`. The
exact full-hold matrix was merge-set without a `DATABASE_PATH` change;
replacement deploy `dep-da50hssaud7c73d3mqeg` started at that timestamp on
exact backend `23971a4d66ee6383c6ad54339e769dbc9a76561e` and is now `LIVE`
after passing its exact `3,502/3,502` gate and full runtime-hold checks.

The first abort plan failed closed with
`RELEASE_QA_STRICT_RESTORE_PATH_UNSAFE`: exact source `-wal` and `-shm`
sidecars were present, although a read-only process check found zero open file
descriptors on the source and those sidecars. Pre-checkpoint incident backup
`44791a01-f62a-4729-b328-d3303bf79a12` verified from manifest
`staging/backups/hundo-leago_staging_20260822T213849188Z_44791a01-f62a-4729-b328-d3303bf79a12.manifest.json`
at plaintext SHA-256
`9d36b59a7b2d0d38ef47fc5bc0514a51cb5a754629e3242597b9d4400849a51f`.
The guarded canonical WAL checkpoint reported
`busy/log/checkpointed: 0/0/0`, integrity `ok`, zero foreign-key violations,
schema `54`, and absent WAL/SHM sidecars.

Abort planning then passed with exact classification `to_b_accepted`, phase
one `published`, and return `none`. The first execute used a manually
transcribed plan value and was rejected with
`RELEASE_QA_STRICT_RESTORE_PLAN_MISMATCH`; it failed safely and left the target
absent. Execution with the exact byte-extracted values passed with
`replayed: false`, authoritative-database mutations `0`, durable-filesystem
mutations `2`, `sourcePreserved: true`, and `targetVerified: true`. Immediate
exact replay passed with `replayed: true`, both mutation counts `0`, and no
temporary plaintext restore. Post-checkpoint incident backup
`fa8c7b2d-04c9-4454-aae4-285673432fb7` verified from manifest
`staging/backups/hundo-leago_staging_20260822T214720472Z_fa8c7b2d-04c9-4454-aae4-285673432fb7.manifest.json`
at the same plaintext SHA-256.

Only `DATABASE_PATH` was changed to the verified target while the full hold
remained intact. Deploy `dep-da51hjvqj5pc73bh8g3g` started at
`2026-08-22T21:46:55.442059Z` and completed `LIVE` at
`2026-08-22T22:37:35.066844Z` on exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e`. Its hosted gate passed `443`
suites and `3,502/3,502` tests with zero fail/cancel/skip/todo in
`3006420.142708ms`; upload took `1.9s`, compression `0.2s`, and the build was
successful at `2026-08-22T22:37:16.851Z`. New instance
`srv-d9eo2turnols73ekb830-qx9zx` started at `2026-08-22T22:37:29.025Z`, was
live at `2026-08-22T22:37:35.170Z`, and logged zero errors through
`2026-08-22T22:38:46Z`. Public live/ready returned `200`, `no-store`, and
`{status:'ok'}`.

Fresh-shell evidence matched the exact backend/frontend builds, target path,
persistent root, staging/production runtime, environment/database IDs, and
every full-hold value. Read-only temporary-copy verifier SHA-256
`5f7de38f2673d3bb4c7d2b086b5d699afab1d173aceb86298d6e40eacb48b77f`
returned `HL_POST_CUTOVER_TARGET_VERIFIED`, with
`authoritativeDatabaseOpened: false` and authoritative mutations `0`. It
proved source SHA-256
`859eda97cd4c55724907abb5cd91f8dd741dd4cab9f9543df8942a1e2310ee05`,
target SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`,
absent source/target sidecars, and activation-receipt SHA-256
`009227a315708be575d553eb39d72797c6f18824f0cd63b6a95580d026cb67bb`.
The abort receipt/derived plan passed in restore mode
`aborted-strict-smoke-rollback` at exact state
`to_b_accepted/published/none`: semantic, smoke, and hosted completion false;
release-blocked and rollback-only true.

The target verified integrity `ok`, foreign-key violations `0`, schema/data-
model `54`, `54` migrations, checksum
`6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89`,
exact IDs, second-rotation receipt
`9152f844-d8cd-42f7-b0d5-b12f530ad618`, zero active sessions, strict-fixture
absence including league `60c82aa0-54f9-4c93-83f5-73b0d6d6f63e`, preparation
receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, and its transfer chain, plus
temporary-copy removal. Post-cutover backup
`2044fcae-24e8-4392-a1ac-4064d9cd2807` verified from manifest
`staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json`
with encrypted SHA-256
`cee039557278c41f59fa9d6a5b09cf4f69f1b9f3589cb3774420ef34be255162`,
manifest checksum
`08e3d3bde81843a683017d9952b30e02dd02978181a8644323cfbd590eca2ac8`,
plaintext SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`,
integrity `ok`, and zero foreign-key violations. Anonymous session remained
`503 SERVICE_MAINTENANCE` with `no-store`. Recovery passes; the privacy release
remains blocked and the full hold stays active.

Helper rollback submitted the exact sealed baseline and restored Netlify
configuration to canonical staging with title
`HL-20260821-3-remove-strict-action-helper-baseline`. Deploy
`6a8a09c13d5e25282f64d2c7` was created at
`2026-08-22T20:42:41.902Z`, published at `2026-08-22T20:42:43.080Z`, and is
current/ready. Netlify exited `0`. The remote gate passed `64/64` baseline byte
checks, `8/8` original header checks, and `8/8` retired helper-path checks
across canonical staging and the immutable deploy origin. Each retired
extensionless HTML, JS, CSS, and marker path returned the exact `472`-byte SPA
index fallback with SHA-256
`1982ECF04CC456D989F7B42F15F3CED49A5D825DF0DEDD948DEAFFE8D8C1ADC8`; the
physical `.html` path also fell back. The marker is now `text/html` and
non-JSON, so stale helpers fail closed before a POST. Helper removal is
`PASS`.

The frozen T-132 acceptance contract required two independent cookie jars and
these exact settled checkpoints. It now explains the phase-one rejection; it
does not authorize resuming phase two after `STOP`:

1. Record environment, database, and fixture prechecks under the full hold.
   After controlled unhold, Jar X signs in as Admin, performs Admin role/privacy
   prechecks, proposes Team 1 to Manager B, signs Admin out, signs Manager A in,
   opens Team 1 results with `?releaseQaT132=1`, and keeps that component
   mounted through both events: initial offer `complete`, counters `1/0/0`
   for loads/evictions/successful refetches.
2. Jar Y signs Manager B in and opens the same selected-team result plus
   diagnostic before acceptance: initial offer `null`, counters `1/0/0`.
   Manager B accepts and performs phase one from a separate Jar-Y action tab
   with the same cookie and a separate QueryClient. After settlement, Jar X is
   `null` at `2/1/1`, Jar Y is `complete` at `2/1/1`, and the original T-132
   Query object has been removed and replaced.
3. Jar Y signs Manager B out, signs Admin in to propose the return to Manager
   A, signs Admin out, signs Manager B back in, and remounts Team 1. The fresh
   Jar-Y checkpoint is `complete` at `1/0/0`; persistent Jar X remains `null`
   at cumulative `2/1/1`.
4. Manager A accepts and performs phase two from a separate Jar-X action tab.
   After settlement, persistent Jar X is `complete` at cumulative `3/2/2`;
   remounted Jar Y is `null` at `2/1/1`. Jar Y is not reported cumulatively
   across its sign-out/remount.

Every settled checkpoint is `state=loaded` and `fetchStatus=idle`; transient
pending/refetching is acceptable only while settling. T-131 and T-140 must
independently refetch and flip complete offer/action versus null/no-action;
only the T-132 diagnostic proves physical Query replacement. Evidence stores
no money or raw HTTP/Socket.IO payload.

Hosted acceptance must not infer activation from component tests. After
complete smoke or any recognized failure, the service returns to the full
hold; the matching normal or abort plan/execute and replay results are
recorded; then the operator changes only `DATABASE_PATH` to the pinned target
and redeploys under hold. Post-handoff testing proves source/receipt
preservation, target hash and database evidence, second rotation, zero active
sessions, fixture/transfer absence, and a new verified incident-preservation
backup before controlled reopening. Account email stays disabled in capture
mode until explicit restored-outbox reconciliation evidence authorizes a
change. The materializer never changes Render configuration and supplies no
generic, in-place, or production restore capability.

This is not M7-26 closure evidence. Held preparation and controlled-unhold
runtime gates passed, but strict phase-one smoke is rejected on exact Manager
B counter drift. The normal restore path is no longer eligible. Re-hold deploy
`dep-da50g0v40ujc73aa5i4g` was canceled and never live; exact full-hold
replacement `dep-da50hssaud7c73d3mqeg` passed. Strict abort plan/execute/replay
also passed. `DATABASE_PATH`-only target deploy
`dep-da51hjvqj5pc73bh8g3g`, target re-verification, and the verified post-
cutover backup pass under full hold. Fresh controlled reopening, Notifications
and the remaining desktop/mobile role checks, final runtime flags/job
restoration, and observation remain `PENDING`.
Production remains untouched and unauthorized.
The release record is
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-21.md`.

### FAD-06 Auction Read Closure Evidence - 2026-08-02

The final local auction-family gate passed `161/161` tests across `22` suites
in `17` files. Alongside focused hand-schema repository and projection tests,
a fresh full migration composes the real target runtime, SQLite read
repository, service, router, and authenticated managers. That proof covers
bounded opaque-cursor paging, exact collection/detail envelopes, own-bid
visibility, cross-manager active-value privacy, and unchanged SQLite
`total_changes` across GET requests. It also covers historical-plus-active bid
rows, immutable restricted Candidate allowlists with separate removal state,
and terminal safe player position after conflicting providers and preferred
source replacement. This evidence is local only; it opened no shared database
and authorized no staging or production write.

---

## Purpose

Hundo Leago contains financial-like cap obligations, timed auctions, multi-asset trades, immutable matchup snapshots, scheduled jobs, security-sensitive accounts, and a future production-data migration.

Testing must prove more than whether the application starts.

It must detect:

* accidental behavior changes during refactoring;
* hidden writes from read requests;
* partial multi-record transactions;
* duplicate scheduled or retried operations;
* cross-league information leaks;
* stale frontend data overwriting newer state;
* incorrect money, contract, roster, scoring, or standings calculations;
* session, CSRF, permission, and token failures;
* migration loss, duplication, ambiguity, or reset overreach;
* backup files that cannot actually be restored;
* browser workflows that pass only through manual assumptions.

The strategy favors small deterministic tests close to the responsible logic, then adds realistic integration and browser proof at the boundaries.

---

## Out of Scope

This document does not:

* implement the tests;
* authorize production writes;
* select a hosted continuous-integration provider;
* replace feature acceptance criteria;
* define production secrets;
* require visual snapshot testing of every page;
* make code coverage a substitute for behavior verification;
* authorize disposable use of production data.

Each active work plan identifies the exact tests required for its contained change.

---

# Part 1 - Authority and Current State

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
docs/04-technical-specs/
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Feature specifications own expected behavior. This strategy owns how evidence is produced.

---

## Operating Mode

Reviewed mode:

```text
OFFSEASON_RESET
```

Destructive tests are permitted only in a `DEVELOPMENT_TEST` environment using disposable local or staging data.

Production storage, the production persistent disk, production secrets, and unredacted production backups are never test fixtures.

---

## 2026-07-18 Baseline Reviewed Test State

The following is the preserved baseline reviewed on 2026-07-18, not the current
M7-26 tree:

* backend work item `BR-00` completed the initial Node built-in test harness locally;
* the focused characterization suite passes 16 tests;
* `npm test` and the backend syntax check pass;
* the frontend has lint and build scripts but no automated test runner;
* the frontend has no browser end-to-end suite;
* the backend remains mostly in `server.js`;
* current validation has relied heavily on browser checks, curl, health responses, and direct file inspection;
* a fully isolated persistent staging environment does not yet exist;
* the repositories contain local and production-like data files that must not be rewritten by tests.

This strategy defines the target. It is not evidence that the target test system already exists.

---

# Part 2 - Core Principles

## Test the Contract, Not the Implementation

Tests should assert:

* inputs and outputs;
* persisted effects;
* emitted post-commit invalidations;
* authorization decisions;
* stable error codes;
* transaction and idempotency behavior;
* user-visible results.

They should not generally assert:

* private helper call order;
* component internals;
* exact SQL text;
* incidental log wording;
* CSS class names without a user-facing reason;
* implementation-specific React state.

Refactoring a correct implementation should not require rewriting every test.

---

## Characterization Is Not Approval

Compatibility characterization records what the current system does so behavior-preserving extraction is safe.

A characterization test may prove an insecure or outdated current fact, such as:

* public compatibility access;
* broad league replacement;
* body-supplied actor metadata;
* internal path disclosure.

The test must label that fact as compatibility behavior. It must not be reused as the target Season 2 acceptance test.

When a target endpoint replaces compatibility behavior:

1. keep the old characterization while old callers remain;
2. add approved target tests;
3. move the frontend caller;
4. retire the old test with the old endpoint.

---

## Determinism

Tests control:

* time;
* randomness;
* IDs;
* external provider responses;
* event publication;
* email delivery;
* filesystem paths;
* database files;
* network ports.

No test waits for a real Monday, auction deadline, NHL game, seven-day expiry, or five-minute draft clock.

Time is injected as UTC milliseconds and timezone calculations explicitly use `America/Vancouver` where league rules require it.

---

## Isolation

Every test owns its mutable state.

Tests do not depend on:

* execution order;
* a previous test's account;
* a shared modified database;
* a shared browser page;
* a production-like file in a repository root;
* another worker finishing first.

Tests may share immutable factory definitions but not mutable runtime records.

---

## Lowest Useful Level

Use:

* pure unit tests for calculations and policies;
* repository tests for persistence behavior;
* service tests for transactions and complete use cases;
* HTTP contract tests for transport and security;
* component tests for user interaction and rendering;
* browser tests for critical integrated workflows;
* manual QA for visual, exploratory, and operational confirmation.

Do not test every calculation only through a browser.

---

## Failure Must Be Visible

A failed test reports:

* the expected and actual outcome;
* safe request or fixture identity;
* relevant request ID;
* temporary artifact path when retained for debugging;
* server stdout/stderr when a child process fails;
* Playwright trace or screenshot when applicable.

Failure output must not contain a password, raw token, production secret, or active sealed bid belonging to another team.

---

# Part 3 - Approved Tooling

## Backend

The backend initially uses Node's built-in test runner:

```text
node --test
```

Reasons:

* no test-framework dependency is required;
* CommonJS is supported;
* the refactor specification already selects it;
* temporary filesystem, child process, HTTP, mocking, and concurrency tests are possible with Node APIs.

Initial backend scripts:

```json
{
  "scripts": {
    "test": "node --test",
    "test:unit": "node --test \"test/unit/**/*.test.js\"",
    "test:characterization": "node --test \"test/characterization/*.test.js\"",
    "test:contract": "node --test \"test/contract/**/*.test.js\"",
    "test:integration": "node --test \"test/integration/**/*.test.js\"",
    "check": "node --check server.js"
  }
}
```

Scripts are introduced only when their directories and useful tests exist.

No assertion library, HTTP test library, or mocking framework is added until Node's built-ins prove insufficient.

---

## Frontend Unit and Component Tests

The frontend uses:

```text
Vitest
jsdom
React Testing Library
DOM Testing Library
Testing Library user-event
Testing Library jest-dom matchers
Vitest V8 coverage provider
```

This stack is selected because it works with Vite's transformation pipeline and tests React through user-observable DOM behavior.

The exact compatible versions are pinned in `package-lock.json` when the test-foundation work plan is implemented. Dependency installation is a focused change, not a side effect of this document.

Target frontend scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

Vitest globals remain disabled. Tests explicitly import `describe`, `test`, `expect`, and mock functions so dependencies are visible.

---

## Browser Tests

Critical browser workflows use:

```text
Playwright Test
```

Projects:

| Project | Normal pull request | Nightly or release |
| --- | --- | --- |
| Desktop Chromium | Required | Required |
| Mobile Chromium | Required for affected responsive workflows | Required |
| Desktop Firefox | Focused when affected | Required |
| Desktop WebKit | Focused when affected | Required |
| Mobile WebKit | Focused when affected | Required for launch-critical pages |

Local retries are `0`.

Continuous-integration retries are at most `1`, with a trace retained on the first retry and screenshots only on failure. A retry pass is reported as flaky and does not become invisible success.

---

## API Mocking Decision

No general network-mocking dependency is selected initially.

Frontend unit and component tests inject:

* a fake HTTP client;
* a fresh Query Client;
* a fake session;
* a fake realtime invalidation source;
* an in-memory router.

Playwright uses a real local or staging backend with disposable data.

If repeated low-level fetch mocking becomes difficult, an approved later testing-maintenance step may add Mock Service Worker. It is not required preemptively.

---

## Accessibility Automation

Critical pages use automated accessibility checks through Playwright and a reviewed axe-core integration before release.

Automation supplements, but does not replace:

* keyboard testing;
* visible focus review;
* label and instruction review;
* zoom and reflow checks;
* screen-reader spot checks for critical account and transaction flows.

---

# Part 4 - Test Repository Structure

## Backend

```text
hundo-leago-backend/
|-- test/
|   |-- helpers/
|   |-- fixtures/
|   |-- characterization/
|   |-- unit/
|   |-- repositories/
|   |-- services/
|   |-- contract/
|   |-- integration/
|   |-- security/
|   |-- migration/
|   |-- recovery/
|   `-- jobs/
`-- ...
```

Tests use `.test.js`.

Pure domain tests may be colocated only when a future focused decision shows that colocating improves ownership. The initial backend uses the central `test/` tree.

---

## Frontend

```text
hundo-leago/
|-- src/
|   |-- test/
|   |   |-- setup.js
|   |   |-- renderApp.js
|   |   |-- createTestQueryClient.js
|   |   |-- fakes/
|   |   `-- fixtures/
|   `-- features/
|       `-- <feature>/
|           `-- *.test.jsx
|-- e2e/
|   |-- fixtures/
|   |-- pages/
|   `-- *.spec.js
|-- playwright.config.js
`-- vite.config.js
```

Frontend unit and component tests are colocated with the feature they verify. Shared test helpers live in `src/test/`. Full browser workflows live in `e2e/`.

---

## Generated Artifacts

Git ignores:

```text
coverage/
test-results/
playwright-report/
*.sqlite3
*.sqlite3-wal
*.sqlite3-shm
temporary migration reports
copied private source bundles
```

Reviewed synthetic fixtures and deliberate small golden reports may be committed.

---

# Part 5 - Test Data

## Synthetic by Default

Ordinary tests use synthetic data factories.

Factories create:

* users;
* credentials through test-only hash helpers;
* sessions;
* leagues;
* memberships;
* teams;
* players and provider IDs;
* roster placements;
* contracts and yearly schedules;
* auctions and bids;
* trade assets;
* matchup weeks and locks;
* statistics;
* finalized results;
* standings inputs;
* draft assets;
* audit and activity records.

Factory defaults are valid and minimal. Each test overrides only the condition it is testing.

---

## Required Two-League Fixture

Authorization and isolation suites use at least:

```text
League A
League B
```

They deliberately include:

* overlapping team display names;
* overlapping player pools;
* a user belonging to only one league;
* a user belonging to both leagues with different authority;
* a platform administrator with protected active memberships in both leagues,
  plus a deliberately corrupted missing-membership fixture that fails closed
  until additive reconciliation repairs it;
* stable IDs that cannot be inferred from names.

Every league-owned endpoint receives a cross-league negative test.

---

## Sensitive Source Copies

Copied production or current live-like data may be used only for:

* approved migration rehearsal;
* backup and restore rehearsal;
* a specifically authorized defect reproduction that cannot be represented synthetically.

Controls:

* read-only source bundle;
* access-controlled local or staging location;
* no Git;
* no frontend asset directory;
* no logs containing private rows;
* derived test database stored outside production;
* deletion under the approved artifact-retention procedure.

---

## Fixture Versioning

Fixtures state:

* schema version;
* purpose;
* assumptions;
* expected current or target behavior.

When a schema migration changes fixtures, a migration test proves old supported fixtures still migrate or deliberately records their retirement.

---

# Part 6 - Time, Money, Randomness, and Concurrency

## Time

All time-dependent domain and service code receives an injected clock.

Tests cover:

* exact boundary millisecond;
* one millisecond before;
* one millisecond after;
* Pacific daylight-saving transitions;
* Monday `4:00 PM Pacific` roster lock;
* auction opening and closing windows;
* session absolute and idle expiry;
* reset, verification, setup, and reactivation token expiry;
* trade deadline and reopening;
* matchup rollover;
* competition end with contract years unchanged and displayed as
  `Pending Rollover`; and
* contract expiry/advancement only inside the persisted scheduled Entry
  Draft-start rollover, including failure and retry boundaries.

UI countdown tests use fake timers, but final authority is always the backend timestamp and response state.

---

## Money and Fantasy Points

Tests use integer:

```text
cents
fantasy-point hundredths
```

Boundary tables include:

* valid whole-number total contract values;
* one- and two-decimal AAV;
* nearest-cent rounding;
* non-divisible total and term rejection where required;
* `$1 AAV` yearly minimum;
* `$4.00 AAV` bench boundary;
* `$100.00` cap boundary;
* retention cumulative `50%` boundary;
* `25%` buyout schedule;
* large safe-integer rejection.

Tests do not compare authoritative floating-point money.

---

## Randomness

Lottery, tie-break, session, action-token, CSRF, and ID behavior use injected generators where deterministic output is required.

Security tests verify properties such as length, uniqueness, digest-only storage, and one-time use. They do not assert one hard-coded production secret.

Lottery tests supply recorded random draws and verify:

* integer weights;
* two draws without replacement;
* fixed finalists;
* undrawn order;
* immutable audit inputs and output.

---

## Concurrency

Concurrency tests deliberately race:

* two logins for one user;
* two token consumptions;
* duplicate auction resolution;
* duplicate trade acceptance;
* asset-changing trade and buyout;
* two roster moves;
* draft selection and on-clock pick trade;
* job lease acquisition;
* idempotent request retries;
* stale version updates;
* account deactivation and protected write.

Assertions cover final state, history, outbox, and absence of partial changes.

---

# Part 7 - Backend Test Layers

## Characterization

The characterization baseline was established by completed work plan `BR-00` and remains a required gate for each behavior-preserving backend-refactor step.

It proves:

* exact endpoint inventory;
* current safe response shape;
* current persistence effects;
* current job and event behavior;
* read-only file hashes;
* league-store behavior.

Characterization tests stay isolated from target tests through their directory and naming.

---

## Domain Unit Tests

Pure tests cover:

* roster legality;
* cap calculation;
* contract total, term, AAV, and yearly schedules;
* retention;
* buyout;
* auction ranking and winner price;
* trade asset validation;
* position normalization;
* schedule generation;
* fantasy points;
* matchup scoring;
* standings order;
* draft lottery and eligibility.

Each approved rule receives:

* normal case;
* lower boundary;
* upper boundary;
* invalid case;
* relevant empty state.

---

## Repository Tests

Every repository runs against a new temporary SQLite database migrated to the expected version.

Repository tests cover:

* row mapping;
* foreign keys;
* unique and partial unique constraints;
* same-league conditions;
* optimistic versions;
* ordering and pagination;
* exact money and time representation;
* prepared-statement behavior;
* transaction participation;
* read-only methods not changing data.

Repository tests do not mock SQLite.

---

## Service Transaction Tests

Service tests use real repositories and a temporary database where transaction behavior matters.

They verify:

* authentication context;
* permission policy;
* input and current-state validation;
* all related writes commit together;
* injected failure rolls everything back;
* activity, audit, notification, and outbox rows appear only when approved;
* events publish only after commit;
* event failure does not undo a committed transaction;
* idempotent replay returns the original result;
* stale versions cannot overwrite newer state.

---

## HTTP Contract Tests

Target endpoint tests cover:

* method and path;
* authorization category;
* request schema;
* success envelope;
* error envelope;
* status code;
* content type;
* cache and security headers;
* CSRF and Origin;
* `If-Match`;
* idempotency;
* pagination;
* information redaction.

The expected contract is written independently from the implementation.

---

## 2026-07-29 FAD Decision-Package Matrix

The FAD test suite must map each rule below to the lowest useful layer and to
at least one integrated service, HTTP, job, or browser proof where the rule
crosses a boundary:

* the next contract-year rollover runs at the persisted scheduled Entry Draft
  start; contracts remain visibly `Pending Rollover`, and both drafting and
  trading remain locked until one atomic attempt succeeds;
* a failed scheduled rollover leaves no partial contract, ownership,
  retention, buyout, trade, season, schedule, activity, notification, or
  outbox effect, persists exact blockers, and supports an idempotent retry;
* the internal readiness-handoff primitive can run only inside its caller's
  transaction: caller rollback leaves no operation/job, an injected pair-write
  failure rolls back the caller's terminal state, exact trigger replay creates
  one pair, mismatched source evidence fails closed, and no HTTP completion or
  handoff route exists;
* a simulated future final T-108 selection/confirmed-forfeiture transaction
  commits its terminal pick, Entry Draft `Complete` state, and exact
  `entry_draft_completed` operation/job together, while the real T-108 endpoint
  and Entry Draft UI remain M8 `PLANNED`;
* T-036 genuine-inaugural and T-037 initial-Season-2 exemption transactions
  create only their exact trigger pair atomically; reset-origin T-036 creates
  none and fails atomically for partial, ambiguous, malformed, or conflicting
  reset evidence; T-095 never creates a trigger and may only
  evidence/requeue the same blocked inaugural occurrence after confirmed
  schedule creation;
* the resulting Entry Draft or approved no-draft trigger causes FAD readiness
  automatically, opens every team card or none, persists blockers, and exposes
  only an idempotent retry rather than manual opening parameters;
* all three readiness trigger paths bind the exact completed Entry Draft,
  inaugural target season, or initial-Season-2 exemption resource; each real
  retry advances the blocked occurrence and job even when blockers repeat,
  stale `If-Match` returns `FAD_READINESS_PRECONDITION_FAILED`, and exact
  idempotent replay returns the original immutable `202` receipt after later
  blocking or success without a write;
* T-127 reads only the readiness operation and latest immutable completed
  attempt, never invokes preflight or a preview route, and independently passes
  byte and semantic no-write proof; its public diagnostics are exactly `code`,
  `message`, and nullable `resourceId`, while the operation's internal blocker
  evidence remains exactly `code`, nullable `field`, nullable `resourceType`,
  nullable `resourceId`, and `message`;
* every completed worker attempt commits one immutable canonically hashed
  blocked or succeeded attempt for the exact operation, job, attempt number,
  and observed operation version; a real retry with identical blockers creates
  a new attempt, whereas stale replay cannot create or substitute evidence;
* fresh pending, blocked retry, and expired-running readiness claims update the
  same job and operation atomically; fresh/blocked claims advance synchronized
  attempt counts once, while expired reclaim preserves both counts and original
  start times, rejects a live lease, fences the expired token, and rolls back
  both writes at every injected seam; an abandoned lease has no separate
  completed-attempt row and the next terminal result uses the retained number;
* T-128 atomically validates authority, `If-Match`, and idempotency, resets the
  same canonical job cleanly to `pending`, leaves attempt count unchanged,
  inserts one immutable receipt, advances blocked readiness exactly one
  version, and completes idempotency; injected failure at every seam rolls all
  effects back and exact replay remains write-free after later state changes;
* repeated blocked attempts create at most one notification for the same
  season, readiness operation, and current commissioner, while a replacement
  commissioner receives one notification under a distinct deduplication key;
* fresh `1 -> 31` and exact `30 -> 31` migration tests pin migration `0031` at
  `46,693` bytes and SHA-256
  `f2c5104f2eb06e261cc902067bd4623b841f2c37a04f73d27487863077b2662a`,
  preserve frozen migration `0030`, and reproduce `126` application tables,
  `127` including the migration ledger, `126` catalog entries, `44`
  require-empty tables, `82` signed-policy tables, and `62` delete guards;
* additive migration `0032` preserves the exact bytes of migrations `0030`
  and `0031`, is pinned at `27,882` bytes with SHA-256
  `ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`,
  creates no table or index, retains that inventory, adds only the job-side
  reclaim guard, and replaces only the readiness forward-update trigger with
  the exact expired-lease handoff branch that preserves attempt counts and
  original start timestamps;
  fresh `1 -> 32` and exact `31 -> 32` paths are identical;
* additive migration `0033` preserves migrations `0030` through `0032`, adds
  only immutable T-095 corrective-requeue evidence plus its exact guards, and
  proves fresh and exact `32 -> 33` paths; its insert/update/delete,
  same-league/source, result/generation, old/new version, unchanged-attempt,
  canonical-blocker, duplicate-result, rollback, and exact-replay cases all
  fail closed outside the one approved T-095 transaction; it is pinned at
  `56,084` bytes and SHA-256
  `93714178a4c89687578ca340afbe69c317239118cb50765838e6123ff6faf7f1`
  and reproduces `127` application tables, `128` including the migration
  ledger, `127` catalog entries, `45` require-empty tables, `82` signed-policy
  tables, and `63` delete guards;
* additive migration `0034` is pinned at `1,158` bytes and SHA-256
  `9347331419ada113707a4e71ef87c578ddd3cd0bd4ddb9578164f08b3307bb36`;
  fresh `1 -> 34` and exact `33 -> 34` tests preserve every earlier ledger
  identity, application row, table, trigger, view, catalog/reset-policy count,
  and delete guard, advance both schema-version authorities to `34`, verify
  integrity and foreign keys, and prove the exact columns, direction, partial
  predicates, and real Candidate query-plan use of
  `free_agent_draft_recoveries_league_player_status`,
  `ownership_events_candidate_release_by_player`, and
  `draft_eligible_players_rights_release_reentry` without a temporary ordered-
  release sort;
* additive migration `0035_add_candidate_card_help_command_results.sql` is
  pinned at `10,981` bytes and SHA-256
  `cbbaf5322c111f3d13659cf6adc1a5046c8b49ba0ab84c3541d770a1dae3b669`;
  fresh and exact upgrade tests prove immutable T-139 created/already-active
  command-result evidence and exact status/response replay while every earlier
  migration identity and row remains unchanged;
* additive migration
  `0036_add_fad_eligibility_revalidation_occurrences.sql` is pinned at `22,871`
  bytes and SHA-256
  `1351e25758d7192ab804214f0abeb696a9b0a9b3509e81dcd276ac7570fbb1f6`;
  fresh `1 -> 36` and exact `35 -> 36` tests reproduce `129` application
  tables, `130` including the migration ledger, `129` repository-catalog
  entries, `47` require-empty tables, `82` signed-policy tables, and `69`
  delete guards with integrity and foreign keys clean; migration tests also
  prove immutable semantic before/after evidence, exact player/FAD/source-
  operation and pending-job uniqueness, the global `player_catalog_applied`
  batch seal, referenced-evidence tamper resistance, and the deadline status-
  transition barrier;
* additive migration `0037_allow_atomic_fad_deadline_allocations.sql` is pinned
  at `4,142` bytes and SHA-256
  `33b8e7c3479f9a3dc64011a29ced6421a5cc59eca62da8b8144cf82b1d0d80b3`;
  fresh and exact-upgrade tests preserve every prior ledger identity and row,
  permit only the deadline-owned pending allocation insert under the live
  claimed deadline occurrence while the root remains
  `cards_open`, and reject fabricated, stale, or mismatched witnesses;
* additive migration `0038_allow_pre_fad12_restricted_scheduling.sql` is pinned
  at `17,157` bytes and SHA-256
  `b4567d087b31ff70dfa2776f2a15e6d22e182600d3dd5e5446a169bb64bb5ac5`;
  fresh and exact-upgrade tests preserve exact Candidate ties as
  `restricted_scheduled` for the next complete rapid rollover, reject
  mismatched or past-due scheduling, leave ordinary-auction behavior
  unchanged, and reproduce schema `38` with `129` application tables, `130`
  including the ledger, `129` catalog entries, `47` require-empty tables,
  `82` signed-policy tables, and `69` delete guards;
* opening writes `free_agent_draft_started` only as League Activity and
  `fad_cards_opened` only as a notification, with a corresponding
  `notification.created/cards_opened` outbox publication; it is never an
  outbox event type;
* readiness with more than, exactly, and less than 48 elapsed hours remaining
  derives the normal or adaptive help window correctly, including help
  beginning at card opening when less than 48 hours remain;
* T-130 returns exactly one current authorized private Candidate Card with all
  22 canonical slots, safe player/editor projections, cap and completeness
  state, exact authorization evidence, private help/intervention evidence, and
  no public-card leakage; current manager assignment takes precedence for a
  dual-role viewer, exact active help is card-scoped, and unauthorized,
  former-manager, expired-help, cross-team, and cross-league reads are the same
  side-channel-safe `404` without writes;
* at the deadline before publication, T-130 remains readable as
  `deadline_processing`/`private_read_only` with every mutation capability
  denied; T-133 through T-138 return `FAD_DEADLINE_PASSED`, T-139 returns
  `FAD_HELP_WINDOW_CLOSED`, and every private Candidate path changes to
  `FAD_PHASE_CONFLICT` after publication;
* T-133 accepts only the exact query grammar, applies collapsed-whitespace,
  trimmed, lowercase matching bounded at 200 Unicode code points, orders by
  normalized player name then ID, and uses a versioned base64url cursor bound
  to the exact card, slot, normalized query, and limit; malformed, stale,
  overlong, cross-filter, cross-slot, and cross-card cursors fail before reads,
  while results reveal no competing nomination or offer information; release
  or declined-right evidence remains excluded unless a later confirmed same-
  league/player `rights_release_reentry` row references that exact event and
  was confirmed after it, and every later release blocks again; mismatched,
  unconfirmed, prior, and merely-unowned cases remain excluded;
* T-134 proves byte-for-byte and semantic no-write behavior, ignores supplied
  `If-Match` or `Idempotency-Key`, returns the exact projected card/slot and
  warnings, and never creates a receipt, revision, notification, audit, or
  outbox effect; add uses a deterministic non-persisted preview-only UUID,
  projected version is exactly one greater than the unchanged base version,
  every projected capability is denied with `PREVIEW_ONLY`, move returns its
  destination slot, remove returns null, and structural-conflict, over-cap,
  and candidate-warning diagnostics are exact, deduplicated, and
  deterministically ordered;
* T-135 through T-138 require exact card `If-Match` plus bounded control-free
  idempotency keys, return the complete authoritative private card, and cover
  candidate add/edit/move/remove plus compatible carryover movement; carryover
  identity, contract, and removal remain locked, cross-card entry references
  return the same `CANDIDATE_CARD_ENTRY_NOT_FOUND`, and stale writes expose only
  `{currentVersion, refetch: true}`;
* every Candidate command revalidates current exact-card authority before
  replay lookup, then checks exact replay before phase, deadline, freeze,
  version, resource, or business validation; original status and immutable
  representation survive later state changes, changed intent conflicts, and a
  former manager or expired help authority cannot replay private results;
* T-139 accepts `{}`, explicit null, and trimmed control-free messages through
  500 Unicode code points, normalizes whitespace-only text to null, rejects
  malformed or unknown shapes, and atomically creates the help request, exact
  scoped grant, immutable command result, private audit, deduplicated current-
  commissioner notifications, and private outbox audiences; a new key against
  an existing active request returns `200` without changing the message or
  duplicating effects, while exact replay preserves its original status;
* every FAD JSON route enforces the exact `16 KiB` boundary, with one byte over
  returning `413 FREE_AGENT_DRAFT_REQUEST_TOO_LARGE` before domain work; shared
  limiter tests prove both per-session and per-league ceilings, isolation,
  deterministic window reset, and no-write `429` behavior for
  `fad_candidate_write` (`120`/session and `600`/league per 15 elapsed
  minutes), `fad_help_write` (`5`/session and `25`/league per 60 elapsed
  minutes), and `fad_operational_write` (`30`/session and `120`/league per 15
  elapsed minutes);
* every authoritative summer ownership, contract, prospect-right, effective-
  position, or active-state writer synchronizes affected open cards in the
  same transaction or rolls the underlying write back; provider bulk changes
  create durable per-player/per-open-FAD/source-operation occurrences only for
  active-status or effective-F/D changes, while presentation, raw-payload, and
  source-version-only changes or source changes masked by a league override
  create none; the same import transaction creates the exact pending shared-
  lease jobs and seals them with one global `player_catalog_applied` event;
* eligibility revalidation worker tests prove restart and duplicate-delivery
  safety, exact occurrence/job/lease binding, one-transaction card
  synchronization and job terminalization, no-op success, rollback, and stale-
  lease fencing; deadline reconciliation performs one final all-card sync,
  leaves terminal jobs unchanged, compare-and-swap consumes every observed
  `pending`, `failed`, `leased`, or `running` job as `skipped` with
  `deadline_reconciled`, rolls back atomically on any failure or lost CAS, and
  permits locking only after every occurrence job is `succeeded` or `skipped`;
* deadline processing evaluates the complete Candidate Card: an unresolved
  carried-roster structural conflict or an over-cap projection excludes every
  new offer while preserving every carryover and publishing the deterministic
  reason, whereas individually valid offers on a conflict-free incomplete,
  cap-compliant card still participate; conflict-only, over-cap-only, both-
  illegalities, and conflict-free incomplete fixtures prove reason precedence
  and independent cap status; a candidate-only unplaced conflict remains an
  individual invalid offer and does not invoke the carried-roster whole-card
  exclusion;
* immediately after publication, T-131 counts only final selected-team
  outcomes and T-132/T-140 omit pending and `correction_required` allocations;
  no public slot, provisional decision, rank, winner, restricted/fallback,
  recovery, resolution, or draw structure is invented, and replay remains
  byte-stable while no durable final outcome is committed;
* processed T-132/T-140 rows derive Signed/Not won/Tied from immutable internal
  allocation evidence but expose exactly `player`, `status`, nullable `offer`,
  and nullable manager-actionable `tieAuctionId`; rank, winner-resource,
  participant, draw, cap, slot, and audit evidence remain internal regardless
  of role;
* restricted Candidate contracts are equal-status minimums, not bids or
  leaders; every tied team begins with no edit count or cooldown, submits its
  strict improvement as an opening bid, then receives the ordinary
  joining-team one-edit allowance and 75-minute bid-activity cooldown, with no
  manager withdrawal;
* a restricted winner requires at least one eligible current active strict
  improvement under total-first/AAV-second floor comparison; absent, invalid,
  or commissioner-removed improvements produce no draw and atomically create a
  fresh league-wide 24-hour fallback with no leader;
* open FAD auctions inherit ordinary starter/non-starter edit limits; a
  restricted participant begins with no bid/cooldown, then its opening
  improvement receives the ordinary joining-team edit allowance; both use the
  75-minute bid-activity cooldown while ordinary weekly behavior remains
  unchanged;
* after normal ranking, an exact top tie in an open or restricted FAD auction
  uses one auditable equal-chance draw with commitment, reveal, fixed-vector,
  unbiased-sampling, and replay proof; ordinary weekly ties keep their
  submission-time and stable-ID rules;
* every semantic terminal FAD auction reveals and verifies its original
  commitment, with `selectionUsed = false` and no selected bid for no-bid,
  no-improvement, and non-tied outcomes;
* before the 60-minute boundary a valid nomination opens normally; exactly at
  and after it, the same valid command creates a private queued nomination
  whose binding starter bid opens at rollover and resolves at the following
  contiguous 24-hour rollover;
* queued nomination privacy covers responses, errors, logs, notifications,
  outbox audiences, Socket.IO, DOM, storage, and cache until opening;
* an open rapid auction with no eligible bid closes without a winner and
  returns the player to the unclaimed pool;
* FAD bids reserve no cap, slot, or roster capacity; bid, edit, and queued-
  nomination submission is the binding possible-illegality confirmation, and
  resolution never pauses for a second prompt even when one team wins every
  simultaneous auction and becomes illegal;
* late Entry Draft completion advances Week 1 by one or multiple whole
  league-local Mondays to the earliest otherwise-valid start whose Candidate
  deadline is strictly future-facing and whose complete seven-day FAD period
  fits, while the NHL-season end and all four playoff weeks remain fixed;
* that late-draft adjustment atomically regenerates remaining pairings, byes,
  and unexecuted job occurrences; no valid pre-playoff Monday produces explicit
  blocked recovery and no partial schedule or card opening;
* FAD completion waits for every active, pending, queued, fallback, delayed,
  and recovery path; a proposed completion at or after Week 1 atomically moves
  Week 1 to the first valid league-local Monday strictly after completion,
  regenerates remaining schedule/jobs, and only then publishes completion;
* after initial generation, T-096 replacement, or FAD pre-open/completion
  recovery, T-145 binds exactly the one current schedule generation and its
  source-specific immutable provenance; superseded succeeded roots remain
  historical, a valid old-superseded/new-current lineage finalizes normally,
  and missing, multiple-current, cross-scope, noncontiguous, or malformed
  provenance fails without writes;
* FAD-overrun recovery never rewrites Candidate deadlines, completed rollover
  instants, locked cards, bids, draws, allocations, or other historical FAD
  evidence, and restart, retry, and matchup-start races have one committed
  winner with no split state;
* when an illegal team becomes legal late, authoritative NHL schedule/source
  data identifies every selected player whose game is already underway; the
  snapshot, baseline, and immutable player/game/start/source exclusion evidence
  commit atomically, the entire game is excluded including post-baseline
  events, and replay or racing restoration attempts converge on that one
  evidence set; and
* incomplete or illegal rosters alone never move Week 1, while unfinished FAD
  processing does.

The fixed-clock matrix includes exact boundaries, one- and multi-Monday
movement, daylight-saving transitions, restart before and after each commit,
failure injection at every atomic seam, two-league isolation, and stable
idempotent replay.

### FAD-08 Local Closure Evidence - 2026-08-08

The final FAD-08 behavior selection passes `336/336` with no failure,
cancellation, or skip. It covers the handoff and real trigger callers,
readiness worker/runtime and carryover opening, T-126/T-127/T-129 privacy and
zero-write GET proofs, and T-128 original-receipt replay after both later
blocking and terminal success with unchanged database bytes and SQLite change
count. The independent migration/schema/identity/catalog/reset selection
passes `64/64`. Every database was disposable and local; shared staging and
production were not opened or changed.

### FAD-09 Local Closure Evidence - 2026-08-08

The provider occurrence/job/deadline selection passes `60/60`, the complete
summer-writer selection passes `262/262`, direct Candidate HTTP passes `36/36`,
composed runtime passes `66/66`, the local staging verifier passes `9/9`, and
reset bootstrap passes `8/8`, with no failure, cancellation, or skip. This
covers T-130 and T-133 through T-139, exact body/rate boundaries, every known
summer writer, provider semantic occurrence production, shared leased
execution, final deadline reconciliation, schema 36, target inventory `110`,
and reset/deployment-runtime compatibility. All databases and verifier targets
were disposable and local; no frontend caller is connected, shared staging was
not deployed or verified, and production was not opened or changed.

### FAD-10 Local Closure Evidence - 2026-08-09

The exact FAD-10 closure matrix passes `200/200` tests across `23` suites. It
covers injected-clock reminder/deadline boundaries, authoritative final
reconciliation, atomic 22-slot league publication, whole-card disposition,
T-131/T-132/T-140 read contracts and pending-result semantics, independent
player allocation and race quarantine, lifecycle coordination, aggregate
automatic results, schema 38, and restart/replay behavior.

The following remain separate acceptance records and must not be restated as
one combined total:

- composed target-runtime gate: `4/4`;
- allocation coordinator gate: `18/18`;
- shared auction regression gate: `103/103`; and
- post-amendment deadline-reminder gate: `7/7`.

The runtime proof executes allocation coordinator -> per-player allocation ->
allocation coordinator in the same scheduler cycle before ordinary auction
resolution, including the zero-allocation direct-to-`rapid` path. The target
endpoint inventory is `113`; only T-131, T-132, and T-140 advance under this
slice. Exact Candidate ties remain scheduled or quarantined for the future
restricted-auction privacy and activation gate. At that checkpoint, FAD-linked
T-080 through T-083 remained fail-closed for FAD-11 and T-141 through T-144
remained planned. There was no frontend caller, shared staging deployment or
verification, or production change.

### FAD-11 Local Closure Evidence - 2026-08-10

The FAD-11 closure covers T-141 through T-144, FAD-linked T-080 through T-083
administration, atomic FAD completion, schema 40, and the shared transaction-
owned restricted no-improvement fallback. The local target endpoint inventory
remains `117`.

The following remain separate acceptance records and must not be restated as
one combined total:

- broader recovery/correction/administration matrix: `197/197`;
- schema/runtime matrix: `96/96`;
- ordinary-auction compatibility matrix: `62/62`; and
- complete administration repository: `40/40`.

All recorded commands used exact Node.js `24.14.1`. At that checkpoint, the
scheduled resolver still filtered to ordinary auctions and future restricted/
fallback activation was not composed; those were FAD-12/FAD-13 gates. No
frontend, shared staging, or production environment was opened, migrated, or
changed.

### FAD-12 Local Closure Evidence - 2026-08-10

FAD-12 closes the local restricted and allocation-linked fallback manager-bid,
resolution, durable retry/recovery, activation, and scheduler paths through
schema `43`. At that checkpoint, direct and queued open-rapid resolution,
extension scheduling, and completion recovery remained FAD-13 work.

The following remain separate acceptance records and must not be restated as
one combined total:

- resolver policy, persistence, and shared-fallback gate: `52/52`;
- application service and durable runner gate: `15/15`;
- activation and job-repository gate: `71/71`;
- bid, HTTP-boundary, and auction-read capability gate: `50/50` across six
  suites;
- ordinary-auction and administration compatibility gate: `170/170`;
- schema-43 and current-head gate: `303/303`; and
- final scheduler, target-runtime, deployment, and ordinary-compatibility gate:
  `94/94`, partitioned as scheduler `6`, composed T-083 runtime `1`, FAD
  ordinary compatibility `3`, ordinary resolver and job `17`, target runtime
  `36`, and target deployment `31`.

All recorded commands used exact Node.js `24.14.1`. At that checkpoint, the
scheduler proof awaited FAD resolution -> restricted activation -> fallback
activation -> ordinary resolution -> FAD completion in exact causal order. No
frontend, shared staging, or production environment was opened, migrated,
deployed, or changed.

### FAD-13 Local Closure Evidence - 2026-08-10

FAD-13 closes local immediate and private queued starts, restart-safe queued
activation, direct/queued rapid resolution, allocation-null and no-bid
outcomes, seven initial plus contiguous extension rollover finalization and
recovery, atomic completion and whole-Monday Week 1 recovery, matchup-start
fencing, and the ordinary weekly-auction handoff. Schema `47` retains `131`
application tables, `132` including the migration ledger, and `131` repository-
catalog entries. At this historical FAD-13 checkpoint, migrations `0023`
through `0047` remained local only; the target endpoint inventory was `117`.

The following exact Node.js `24.14.1` records are separate and overlapping and
must not be added into one aggregate total:

- start-decision policy: `11/11`;
- immediate-start writer: `10/10`;
- FAD start/lifecycle: `23/23`;
- ordinary creation compatibility: `12/12`;
- queued activation: `125/125`;
- focused allocation-null resolution writer: `22/22`;
- focused resolution service/runner: `18/18`;
- broader allocation-null resolution: `73/73`;
- bid/read compatibility: `122/122`;
- schema-47/current-head: `280/280`;
- rollover policy/writer/service/runner: `42/42`;
- completion: `31/31`;
- runtime composition: `77/77`; and
- matchup-start guard: `15/15`.

The canonical writer-to-shared-JobRepository list, claim, and exact-expiry
reclaim integration additionally passes `1/1`; the complete rollover writer
passes `13/13`; and the shared JobRepository passes `28/28`. These are
supporting overlapping repository gates, not a combined total. No frontend,
shared staging, or production environment was opened, migrated, deployed, or
changed.

### FAD-14 Local Closure Evidence - 2026-08-11

The Activity and notification registries, four exact Candidate Card opening
publications, canonical envelopes whose `related` object contains exactly
`fadId`, `teamId`, `cardId`, `allocationId`, `auctionId`, `recoveryId`,
`nominationQueueId`, and `scheduleRecoveryOperationId`, automatic-readiness and
queued-nomination audience privacy, publication invalidation, reconnect
reauthorization, and setup-exemption eleventh-Activity/thirteenth-notification
three-publication contract are verified locally. The target endpoint inventory
remains exactly `117`.

Trigger-only migration
`0048_require_canonical_fad_realtime_evidence.sql` is pinned at `73,524` bytes,
`1,490` lines, and SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`;
schema `48` is the preserved intermediate realtime checkpoint. Trigger-only
migration `0049_require_canonical_fad_setup_exemption_publications.sql` is
pinned at `29,571` bytes, `748` lines, and SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`.
Schema `49` was the FAD-14 local target with `131` application tables, `132`
including the migration ledger, and `131` repository-catalog entries.

Separate pinned Node.js `24.14.1` evidence passes:

- focused FAD-14 core: `1,294/1,294` tests across `142` suites and `110`
  unique test files, with no failure, cancellation, skip, or todo;
- production JavaScript syntax: `95/95` files;
- schema-49 pin/runtime/reset/release/staging-verifier selection: `265/265`;
- former-failure consolidation: `189/189`; and
- authoritative full backend: `3,266` tests across `436` suites, `3,264`
  passed, zero failed, cancelled, or todo, and two intentional Windows link-
  capability skips, in about `30m03.603s`.

The skipped cases are `symlink` (`symlink creation is unavailable`) and
`target` (`file links are unavailable`) in
`sportsDataIoLiveCapabilityArtifactFoundation.test.js`. Migrations `0023`
through `0049` remained local only at this historical FAD-14 checkpoint. No FAD
frontend, shared staging, or production environment was opened, migrated,
deployed, or changed at that checkpoint.

### FAD-15 and FAD-16 Frontend Local Closure Evidence - 2026-08-11

Exact Node.js `24.14.1` verification records:

- complete Vitest: `316/316` across `52` test files;
- repository-wide ESLint: pass;
- production build: pass across `1,782` transformed modules, with only the
  existing advisory for one minified chunk above `500 kB`;
- dependency inspection: pass, with Playwright `1.61.1` and one deduplicated
  `playwright-core` `1.61.1`; and
- browser-authority verification: pass across `19` compatibility files and
  `154` shipped source files.

The V8 report for `src/features/freeAgentDraft/` records `1,754/2,012`
statements (`87.17%`) and `1,262/1,577` branches (`80.02%`). This coverage is
supporting evidence, not a substitute for the behavior and privacy gates.

### FAD-17 Integrated Local Closure Evidence - 2026-08-11

Exact Node.js `24.14.1` backend records are separate evidence gates and are not
summed into one total:

- schema-22-to-49, fresh-schema-49, repository-catalog, reset/cutover, and real
  two-league fixture: `28/28`, zero failed, cancelled, or skipped;
- affected resolution service, real SQLite writer, and durable job: `49/49`,
  zero failed, cancelled, or skipped; and
- representative amendment policy, writer, late-lock, and ordinary-auction
  compatibility: `202/202`, zero failed, cancelled, or skipped.

The acceptance package explicitly proves no-bid later renomination under a
distinct auction ID; zero pre-resolution reservation plus simultaneous binding
aggregate wins; disabled/nonblocking Season 2 video with no endpoint or service
inventory; exact schema `22 -> 49` agreement with fresh schema and catalog; and
two leagues with distinct Week 1 starts and adaptive-help chronology. GET and
preview no-write, two-league authorization/privacy, restart, lease, recovery,
queue, rollover, schedule, late-lock, and ordinary-auction compatibility also
pass.

The real disposable two-league Playwright release matrix passes `40/40` with
zero retries across desktop Chromium, mobile Chromium, desktop Firefox,
desktop WebKit, and mobile WebKit. T-076 through T-083 and T-126 through T-144
were therefore `LOCAL VERIFIED` at the FAD-17 checkpoint. No shared-staging or
production environment had been opened, migrated, deployed, or changed at that
checkpoint. The FAD-18 closure below records their later staging verification.

### FAD-18 Local Preflight Evidence - 2026-08-11

The focused and adjacent preflight package discovered `158` tests: `156`
passed, zero failed, and two intentional Windows link-capability cases skipped.
Source check, production syntax, JSON parsing, and whitespace checks pass. The
preflight verifies the contiguous base-22-to-target-49 source, `49` migrations
and `27` post-base migrations, checksum-set SHA-256
`6df4e827296ef3e63a143fb932f557b410511813ea421177afb7908fda15d636`,
`131` repository-catalog entries, `49` post-reset require-empty tables, valid
reset-policy coverage, and the quiesced provider-probe blueprint.

The pre-clarification FAD-18 provider-tool addendum was also green. It is
retained as historical test evidence and is not an active FAD gate. The
read-only discovery opens
only an identity- and SHA-verified private OS-temporary copy of a sidecar-free
guarded source, removes it before output, and fails without output on source
drift or cleanup failure. Its WAL-mode regression preserves source bytes,
identity metadata, and persistent-root entries. The discovery
foundation passes `14/14`, the independent artifact verifier passes its focused
`6/6`, and their focused combined gate passes `20/20`. The complete six-file
provider-capability family discovers `106` tests: `104` passed, zero failed,
cancelled, or todo, and two intentional Windows link-capability skips. These
are separate recorded gates and are not combined into one invented total.
The hold/discovery/publisher/verifier transition package passes `35/35`, and
the broader nine-file entrypoint, Render, preflight, target-runtime, hold, and
provider matrix passes `125/125`, both with zero fail, cancel, skip, or todo.

This was local preflight evidence only. At that checkpoint, the provider-
independent startup and preflight amendment, isolated database/disk and
operator access, offsite backup and clean restore, approved fresh-path
reset/import and schema-49 migration report, clean release commits, auxiliary-
bridge and final-held deploys, attached-service shell reachability, database-
path activation, and deploy/rollback identities remained required before the
externally mutating staging gate. The tools removed none of those then-active
external blockers.

### FAD-18 Shared-Staging Closure Evidence - 2026-08-18

Release `HL-20260818-1` completed the provider-independent FAD-18 isolated
shared-staging gate and advanced staging to schema `52`. The exact deployed
backend commit is `9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68`; the exact frontend application
commit is `50f2414cdda5926942975577f70114b5868917a9`, preserved in frontend source head
`2ba016c9d5e6b016a150a62da757f28a9c0140c0`.

The focused affected backend matrix passed `152/152`, and the bid-policy and
persistence rerun passed `29/29`. The local full suite discovered `3,356`
tests; its sole failure was the workstation Node `24.11.1` version gate, with
two intentional Windows link-capability skips. Render's exact Node `24.14.1`
build then passed the authoritative hosted suite at `3,356/3,356`, with zero
failure or skip.

The held deployment created encrypted backup
`ccde64d6-bff6-4903-b078-3dd9c1c0b71a`; a restore to a distinct temporary path
reported SQLite integrity `ok` and zero foreign-key violations. The forward
migration reported schema `52`, integrity `ok`, and zero foreign-key
violations. Final Render deploy `dep-da2147e417fc73brkqmg` and final Netlify
deploy `6a8420054c9c5a624d86b2c3` passed health, build-identity, origin, asset, and
authenticated non-mutating browser checks. Exact detailed evidence and the
rollback boundary are recorded in
`docs/07-testing/release-runs/FAD_AUCTIONS_PLAYERS_UX_2026-08-18.md`.

M7-25 and FAD-18 are therefore `STAGING VERIFIED` and complete. M7-26 is the
sole active plan. Production remained untouched and remains unauthorized.

---

# Part 8 - Frontend Test Layers

## Pure Frontend Utilities

Unit tests cover non-authoritative presentation helpers:

* money and fantasy-point formatting;
* timestamp display;
* API error translation;
* query-key factories;
* route construction;
* safe storage parsing;
* client-side form formatting and basic validation.

They must not recreate backend league calculations.

---

## Component Tests

React Testing Library tests components through:

* accessible roles;
* labels;
* visible names;
* user-event interactions;
* loading, empty, error, conflict, and success states.

`data-testid` is used only when no stable accessible query represents the user interaction.

Tests run with React Strict Mode to catch unsafe effect lifecycles.

---

## Feature Page Tests

Each feature page tests:

* route parameters;
* session state;
* league context;
* authorized and unauthorized presentation;
* request loading and cancellation;
* empty data;
* backend validation;
* stale conflict and refetch;
* duplicate-submit prevention;
* Socket.IO invalidation followed by refetch;
* responsive critical controls.

Hiding a button is not tested as proof of backend authorization.

---

## Query and Mutation Tests

Tests verify:

* query keys include league ID and other required scope;
* logout clears private query data;
* changing league does not display the prior league's cached records;
* mutations do not retry automatically;
* one user intent retains one idempotency key across an uncertain retry;
* a new intent receives a new key;
* `412` causes safe refetch and conflict presentation;
* `401` clears authenticated presentation state;
* Socket events invalidate only relevant keys.

---

# Part 9 - Browser Workflows

## Local End-to-End Environment

Playwright local tests start:

* a backend using a new temporary SQLite database;
* explicit `DEVELOPMENT_TEST` mode;
* synthetic accounts and two leagues;
* jobs disabled unless the test owns a fixed test clock;
* a frontend using explicit local API and Socket origins.

Seeding occurs through a test-only command-line setup script, not a production HTTP endpoint.

The environment is destroyed after the suite.

---

## Launch-Critical Browser Coverage

Before launch, browser tests cover:

* public roster view;
* self-sign-up and verification using a fake email adapter;
* sign-in, sign-out, and session replacement;
* password change and reset;
* deactivation and reactivation;
* league chooser;
* administrative league creation;
* membership, commissioner, and manager assignment;
* roster view and movement;
* contract and cap display;
* explicit commissioner- or administrator-selected Week 1 with no fixed-date
  substitution, scheduled Entry Draft-start rollover, automatic all-or-none
  FAD readiness, Candidate Card carryover/editing/privacy/adaptive help,
  whole-card deadline legality, total-first/AAV-second allocation,
  improvement-required restricted and fallback auctions, FAD-only exact-tie
  draw, final-hour nomination queue, daily and extension rollovers, and atomic
  whole-Monday Week 1 recovery;
* auction creation, bid, edit, and resolution result;
* trade proposal, concurrent offer, acceptance, decline, and cancellation;
* buyout;
* matchup lock, late legality with whole-game exclusion and immutable evidence,
  live display, final result, and correction;
* standings;
* activity and Security Audit separation;
* commissioner freeze and recovery;
* unauthorized and cross-league navigation.

Complex calculations are asserted at the backend layer and spot-checked in the browser.

---

## Browser Assertions

Prefer:

* role and label locators;
* backend-created stable fixture IDs hidden behind page objects;
* web-first assertions;
* explicit URL and visible-state checks.

Avoid:

* arbitrary sleep;
* brittle CSS selectors;
* shared page state;
* dependence on real NHL data;
* broad screenshots as the only assertion.

---

# Part 10 - Security Testing

Security tests follow `SECURITY.md` and include:

* password boundaries and scrypt encoding;
* dummy verification for unknown accounts;
* one active session;
* idle and absolute expiry;
* revocation triggers;
* cookie attributes;
* CSRF and Origin;
* exact CORS;
* action-token purpose, expiry, digest-only storage, and atomic consumption;
* rate limits by source and account;
* generic public responses;
* SQL injection strings as values;
* sort and identifier allowlists;
* output encoding;
* log and audit redaction;
* first-administrator bootstrap refusal after use;
* two-league object-level authorization;
* Socket.IO room authorization.

Dependency audit output informs review. It does not automatically justify an unsafe blind upgrade.

---

# Part 11 - Jobs, Realtime, and External Providers

## Scheduled Jobs

Every job tests:

* before eligibility;
* exact eligibility boundary;
* after eligibility;
* duplicate invocation;
* overlapping invocation;
* restart;
* lease expiry;
* stale occurrence;
* dependency failure;
* transaction failure;
* outbox failure;
* successful retry;
* no double advancement.

An accelerated season test runs job sequences through complete matchup weeks.

---

## Socket.IO

Tests prove:

* handshake authentication;
* allowed Origin;
* authorized room membership;
* no cross-league payload;
* no active sealed bid disclosure;
* one invalidation after commit;
* no invalidation after rollback;
* disconnect after session revocation;
* reconnect reauthorization;
* frontend listener cleanup;
* authoritative refetch after reconnect.

Socket delivery is not required for correctness when HTTP refetch succeeds.

---

## NHL Provider

Provider adapter tests use recorded synthetic responses for:

* successful list and detail;
* changed player name;
* position;
* inactive player;
* missing field;
* malformed response;
* timeout;
* rate limit;
* provider error;
* partial response;
* last-valid-cache preservation;
* live game-state and player-game-stat feeds sharing the expected provider
  capture identity;
* the adapter receiving the exact required stable-player/provider-player set
  plus sorted exact historical player/game/team/start bindings, with every
  game binding referencing its exact parent player identity;
* exact required-player coverage with the mutually exclusive `expected_game`,
  authoritative `no_due_game`, and authoritative `no_team` shapes;
* affirmative current membership from Players and FreeAgents remaining
  separate from per-game provider team identity;
* one player's old-team and current-team expected games coexisting in one
  response, and a currently free-agent player retaining an old-team historical
  expected game;
* an omitted player, locally inferred terminal disposition, unexpected player,
  duplicate identity, mixed disposition, or unresolved mapping rejecting the
  entire refresh;
* a missing historical schedule game, wrong scheduled start, wrong bound team,
  or missing/wrong explicit historical PlayerGame row rejecting the refresh;
* exact equality between `expected_game` player/game identities and observation
  player/game identities, including explicit zero-valued rows rather than
  missing-as-zero behavior;
* every historical required binding being an exact-value subset of flat
  expected coverage while the whole flat expected set still equals
  observations;
* coverage and observations sharing one provider, capture identity, and
  `sourceVersion`;
* provider output naming exactly the configured live-statistics provider, and
  `sourceVersion` changing when requested historical bindings, membership,
  targeted schedules, or PlayerGame rows change;
* independently fixed coverage- and observation-digest vectors, exact child
  counts, atomic seal/rollback, and immutability after sealing;
* missing, stale, regressed, cross-provider, duplicate, and unsealed
  player-game evidence failing closed;
* late-lock game-state requirements being derived from sealed coverage for
  every selected player rather than from available observation rows;
* current-minus-baseline per-game delta excluding the entire underway game,
  including events received after the late baseline;
* a missing current observation for any excluded pair keeping scoring and
  finalization `awaiting_data` instead of creating a partial official result;
* the same player scoring normally in a later game that week; and
* totals-only last-season/discovery imports being rejected for live scoring.

Ordinary automated tests do not call the real provider.

### Superseded FAD-18 SportsDataIO sequence

The following provider sequence and its test inventory are retained only as
historical evidence of the pre-clarification implementation. They are not
operationally fixed, must not be executed for FAD-18, and cannot block FAD
staging acceptance. Every later statement in this historical subsection that a
credential, manifest, endpoint, observation, artifact, or provider mode blocks
FAD is superseded by the 2026-08-11 clarification.

The package scripts map discovery to
`node scripts/discover-sportsdataio-live-capability.js`, retain the existing
provider check at `node scripts/check-sportsdataio-live-capability.js`, and map
independent verification to
`node scripts/verify-sportsdataio-live-capability-artifact.js`.

1. deploy the auxiliary bridge commit against the existing schema-22 path with
   persisted `STAGING_MAINTENANCE_HOLD=true`, and prove Render stopped the old
   disk-backed instance before the bridge started;
2. prove the bridge exposes only generic exact-path GET/HEAD health, returns
   maintenance `503` for every other request including `OPTIONS`, and imports
   or opens no target/database runtime, application routes, jobs, Socket.IO, or
   email; hold readiness means only that this maintenance listener is live, and
   attached-service shell reachability remains an operator/provider check;
3. with the isolated staging database quiesced and live mode `probe`, run
   `npm run data:discover:sportsdataio-live:staging -- --historical-date YYYY-MM-DD`
   using the dedicated paid live key; the command requires exactly
   that argument pair, must inherit the persisted deployed hold value without
   an inline override, requires and rechecks a sidecar-free guarded source,
   copies it to a private OS-temporary snapshot, and opens only the identity-
   and SHA-verified copy read-only with `fileMustExist` and `query_only`; close
   and cleanup must finish before output, and any source drift or cleanup failure
   produces no output;
4. review the sanitized discovery output and commit its exact manifest at
   `config/provider-capability/sportsdataio-live-probe-v1.json`;
5. run `npm run release:candidate:preflight` for the exact final candidate and
   stop on any missing, untracked, invalid, season-mismatched, or build-omitted
   manifest or any checked-in hold default other than `false`;
6. deploy that exact final commit and build once with the persisted hold still
   `true` against the old path, re-prove the health-only surface, then create
   and verify the old schema-22 backup and run
   `npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <absolute-distinct-clean-restore-path>`
   against a previously absent inactive path; only after it passes, create the
   approved reset/import at a different, previously absent schema-49 path;
   complete the canonical closed-write artifact, first-administrator, reset-original-league,
   migration-report, and database-identity handoff in its approved order; the
   old file stays untouched and in-place `db:migrate` is excluded pending
   persistent-root hardening;
7. record both paths and identities plus activation and rollback evidence, then
   redeploy the same exact final build on only the new path with the persisted
   hold `false` in `probe` and run the zero-argument
   `npm run data:check:sportsdataio-live:staging` from its disk-backed service
   shell to publish the signed artifact;
8. while the service remains in `probe`, run the zero-argument
   package interface once from that shell as
   `SPORTSDATAIO_NHL_LIVE_MODE=required npm run data:verify:sportsdataio-live:staging`;
   this staging-only per-process invocation does not persist or change the
   deployed service mode; and
9. change only the deployed service mode from `probe` to `required`, restart or
   redeploy the same build, and require startup to independently re-verify the
   artifact before database open.

The bare `npm run data:verify:sportsdataio-live:staging` name describes its
zero-argument package interface only; it is not the executable transition step.
The exact operational invocation is the per-process command above. The
provider check and independent verifier are staging-only and require persisted
`STAGING_MAINTENANCE_HOLD=false`, production Node mode, closed league writes,
disabled scheduled jobs, FAD routes, account-email delivery, debug routes, and
backup schedule, and capture-only email before any provider, manifest, or
artifact I/O. The verifier is a one-off disk-backed shell command, not a Render
one-off job or deployed service-mode change. Under the retired plan, FAD-18
isolated staging would have used configured live-source credentials and a
recorded exact required-player and historical-game request. Its intended
read-only evidence covered exact-set dispositions, explicit-zero pairs,
source-version binding, targeted historical access, and controlled omissions
without shared league writes or raw-provider retention. Any provider failure
stopped only that retired sequence. None of this evidence or provider access
was part of the provider-independent FAD-18 acceptance gate that later closed
in isolated staging on `2026-08-18`.

The command and artifact contract are accepted locally only when tests prove:

* fixed SHA-256, credential-binding HMAC, and artifact-HMAC vectors;
* exact closed shape/order, canonical Unicode handling, deep freeze, duplicate
  rejection, and malformed/open-shape rejection;
* tamper rejection for key, credential, origin, build, environment, current
  season, probe season, manifest, issue/expiry time, and payload;
* a historical-offseason success fixture with `expected_game`,
  `no_due_game`, `no_team`, and an explicit zero, plus an in-memory controlled
  omission that fails closed;
* provider HTTP, timeout, JSON, partial-response, game/start/team,
  source-version, and exact-set failures writing no artifact;
* absence of raw payloads and both secrets from files, serialization, stdout,
  stderr, and logs;
* atomic replacement, failed-write preservation, lock contention, symlink and
  path-escape rejection, corrupt-artifact rejection, and exact replay;
* `disabled` and `probe` composing no live adapter;
* `required` rejecting absent or invalid evidence before database open and
  composing exactly one live adapter for valid evidence;
* the legacy staging-import key being unable to enable live statistics;
* a staging artifact being unable to authorize production;
* the Render blueprint retaining manual two-stage deployment and a
  disk-contained artifact path;
* discovery accepting only the exact historical-date argument, exact staging
  production-Node `probe` identity, dedicated live key, persisted hold `true`,
  closed/disabled write, job, FAD, email, debug, and backup-schedule gates, and
  a read-only existing database, with every drift rejected before database,
  provider, or output work;
* the provider check requiring persisted hold `false` and the same normal-probe
  quiescence before manifest read, provider fetch, artifact write, or output;
* the independent verifier accepting zero arguments, performing only read-only
  artifact access, requiring persisted hold `false`, rejecting every
  non-staging or non-quiesced configuration before artifact read,
  requiring exact per-process required-mode verification configuration, and
  leaving artifact and database bytes unchanged; and
* the deployed service remaining in `probe` during that independent
  verification, then startup re-verifying before database open after the same
  build changes to deployed `required` mode.

The signed artifact is valid for exactly 24 elapsed hours and is bound to the
dedicated credential, configured current season, version-controlled probe
manifest, origin, environment, and exact backend build. The offseason manifest
uses the immediately previous completed NHL season for totals and an exact
historical zero-stat PlayerGame while current Players and FreeAgents prove the
two terminal dispositions. Ordinary automated tests use synthetic captured
fixtures and never make a real provider call.

### Provider-independent FAD-18 acceptance

Focused amendment tests must prove:

* maintenance hold and ordinary candidate startup validate with live-statistics
  composition and the complete automatic matchup-occurrence runner disabled and
  no SportsDataIO manifest, credential, signing secret, provider request,
  capability artifact, or mode promotion;
* release preflight does not require the removed provider manifest;
* retained prior-season rows keep exact source-season identity and cannot
  affect FAD or Entry Draft; current-season roster/matchup reads never fall back
  to them, while missing current data remains unavailable pending the separate
  zero-baseline/provider-neutral implementation;
* Candidate and Entry Draft catalogue search exposes stable identity, display
  name, effective position, and eligibility without statistics availability;
* all FAD card, allocation, rapid/restricted auction, and completion workflows
  pass with statistics/provider composition absent; and
* statistics-refresh, baseline, normal-lock, finalization, and matchup-week
  rollover occurrences remain absent from scheduled-job composition and do not
  run while the provider-neutral completed-game follow-up is pending; any
  separately attempted provider-dependent statistics path fails closed and
  visibly; and
* FAD, Entry Draft, auction, trade, and outbox workers remain available subject
  to their own activation and safety gates.

The existing player-page last-season display and missing season filter must be
recorded as a known frontend gap. No test or document may claim that gap is
fixed until the separate frontend slice actually passes.

## Late-Lock Coordinator and Evidence Acceptance

This section preserves the pre-clarification provider-specific evidence test
inventory as historical design input. It is not an active FAD-18 acceptance
gate and does not authorize immediate external refresh, live-provider
composition, or the former five-minute game-state read. For the preseason FAD-
only candidate, late-lock execution and the full automatic matchup-occurrence
runner are absent. A later provider-neutral work plan must replace or explicitly
adopt each applicable evidence test before restoring or splitting that runner.

Future late-lock implementation is not accepted until the provider-neutral
amendment selects its final contract and focused domain, repository, service,
job, HTTP, and composition tests prove that contract. The historical candidate
test inventory below was:

* semantic replay reconstructs the committed business evidence and returns the
  existing result when only newly generated child UUIDs differ;
* changing any late-snapshot/evidence timestamp, statistics or game-state
  source lineage, selected-roster identity/order, sealed coverage selection, or
  exclusion changes replay to a conflict with no partial write;
* late-lock idempotency adds no request ID, idempotency-request column, or
  browser idempotency contract;
* one table-driven writer registry covers every current and future roster
  mutation: ordinary and Injured Reserve moves, buyouts/releases, ordinary and
  FAD auction wins, Candidate allocation and carryover movement, trade
  acceptance/reversal, commissioner changes, contract transitions, prospect
  operations, effective-position corrections, and every later equivalent
  writer;
* the same table-driven audit classifies a trade-block toggle as legality-neutral
  metadata, proves its SQL writes exactly `trade_blocked`, `updated_at_ms`, and
  `version`, and proves its unregistered mutation kind is rejected before any
  late-lock target read;
* player and prospect-right transfer fixtures prove that acceptance closes the
  source ownership tenure, creates a distinct destination ownership at version
  `1`, preserves stable player and contract IDs, and stores one immutable
  old-to-new ownership mapping; reversal and commissioner transfer use the same
  rule and never resurrect a deleted ownership ID;
* source and destination transfer groups contain globally unique deleted and
  present witnesses, both teams are evaluated, and exact command replay returns
  the same mapping without repeating ownership, contract, history, activity,
  notification, or outbox writes;
* one shared, never-rejecting post-commit coordinator receives an exact batch
  grouped by affected league, season, and team, with unique stable-ordered
  ownership witnesses and the last committed version for a deleted ownership;
* registry enforcement rejects an otherwise well-formed but unregistered
  mutation kind before target discovery;
* cap-only, contract-only, effective-position, and truly empty-roster fixtures
  prove that a durable committed result may identify an affected team with
  `ownershipWitnesses: []`, while unchanged or synthetic ownership witnesses
  are never invented and every supplied witness is still checked exactly;
* single-team, multiple-ownership, and multi-team fixtures prove that the whole
  batch is evaluated without duplicate team work and never requests or performs
  an external statistics refresh;
* coordinator input-validation, target-read, repository, provider, and
  unexpected runtime failure injection proves the committed roster mutation
  occurs once, is never rerun, compensated, reversed, or rolled back, and
  remains a successful command with `awaiting_data`;
* original-command idempotent replay reconstructs the same committed batch and
  may retry late-lock evaluation without repeating any ownership, contract,
  activity, or outbox write;
* every successful roster-mutation response exposes only `lateLock.status` as
  `completed`, `awaiting_data`, `still_illegal`, or `not_applicable`, plus an
  optional safe `lockId`, with no evidence or provider-detail leakage;
* multi-team results aggregate in the exact priority `awaiting_data`,
  `still_illegal`, `completed`, `not_applicable`, and omit `lockId` unless
  exactly one safely identifiable completed lock applies;
* a stale or unavailable command batch returns the applicable safe status and
  performs no external refresh; it may evaluate only from already committed,
  valid evidence;
* a future scheduled provider-neutral post-game statistics occurrence invokes
  eligible-lock retry only after successful refresh persistence, while provider
  or persistence failure invokes no retry and retry failure cannot fail or
  alter the successful statistics result;
* the future scheduled provider-neutral retry attempts each eligible lock
  independently, performs no external refresh, never recursively invokes
  itself, and repeats no roster mutation;
* composition tests name the exact closed staging fixture reset and provider
  catalog import as the only maintenance exclusions, require closed writes,
  disabled jobs, and no live/correction matchup, and reject the exclusion or
  require bulk reconciliation when any precondition is false;
* a legal normal scheduled lock remains independent of provider coverage once
  the future automatic matchup runner is deliberately restored or split;
* the provider-neutral amendment replaces the former sealed-coverage and
  five-minute game-state-read tests with an approved evidence/freshness matrix
  before late-lock execution is enabled;
* compatible-provider statistics and game-state fixtures with deliberately
  different `sourceVersion` values succeed, while incompatible providers fail;
* use, semantic replay, scoring, and finalization independently recompute the
  coverage, player-game observation, game-state, and exclusion digests and
  exact child counts, with one tamper case for each root failing closed;
* exclusion creation requires exact baseline `expected_game` coverage and its
  linked baseline observation; and
* scoring and finalization remain `awaiting_data` for a terminal or missing
  current coverage pair, a missing current observation, an incompatible
  provider, or a source-update time regressed behind the baseline, and become
  eligible only with exact current `expected_game` coverage, exact observation,
  and non-regressed lineage.

Historical-coverage acceptance additionally requires:

* fixed vectors for the amended requirement schema-version-1 preimage with
  canonical sorted `requiredPlayers[]` and `requiredPlayerGames[]`;
* exact retained coverage across both weeks of the two-week Final and across a
  delayed `awaiting_data` overrun beyond the adapter's rolling date window;
* a `final` week removing its bindings, followed by
  `correction_required` re-entry restoring the same bindings;
* a traded-away or released snapshot player retaining the original historical
  game/team binding after ownership or current provider-team change;
* the same player having required old-team and due current-team games in one
  refresh, and a currently free-agent player having a required old-team game;
* adapter date requests equal to the deduplicated union of rolling dates and
  provider-Eastern historical dates, never a full-season poll;
* missing or wrong historical team, scheduled start, schedule row, or explicit
  PlayerGame row failing the whole refresh;
* exact configured-provider equality, required-game subset equality, and total
  flat-expected/observation equality; and
* compare-and-swap rejection when a roster, identity mapping, exclusion,
  sealed baseline binding, or matchup-week status mutates between requirement
  read and completion, while preserving the previous authoritative refresh.

---

# Part 12 - Migration and Recovery

Migration tests cover:

* empty schema;
* every ordered migration;
* changed-checksum refusal;
* application behind and ahead;
* copied current JSON;
* reset-manifest inclusion and omission;
* stable deterministic IDs;
* ambiguous mapping rejection;
* repeat-import determinism;
* counts, money, ownership, schedules, and semantic hashes;
* `integrity_check`;
* `foreign_key_check`;
* cutover rehearsal;
* rollback before first SQLite write;
* recovery after first SQLite write.

Backup testing creates an application-consistent backup, restores to a clean path, starts the application, and runs representative reads and writes.

A successful backup command without a successful restore test is incomplete evidence.

---

# Part 13 - Manual QA

## Written Checklist

Manual testing uses the approved `MANUAL_QA_CHECKLIST.md`.

It records:

* build and environment;
* tester;
* browser and device;
* account and league fixture;
* exact workflow;
* expected result;
* actual result;
* screenshots or request IDs when useful;
* issue reference.

Unstructured clicking is exploratory evidence, not release acceptance.

---

## Manual Focus

Manual QA focuses on:

* understandable wording;
* responsive layout;
* keyboard access;
* focus behavior;
* confirmations;
* disabled and loading states;
* delayed provider data;
* reconnect;
* conflicts;
* commissioner recovery;
* mobile usability;
* interaction between features.

---

# Part 14 - Continuous Integration and Gates

## Pull-Request Gate

Once CI is established, affected repositories run:

```text
lint
syntax or build
unit tests
characterization tests when compatibility code changes
repository and service tests when backend behavior changes
frontend component tests when frontend behavior changes
focused Chromium browser tests for critical integrated changes
documentation structure checks
```

Frontend and backend report independently.

---

## Milestone Gate

A work-plan step cannot complete unless:

* required focused tests pass;
* the broader affected suite passes;
* data hash or database proof passes;
* no unexplained skipped test exists;
* exact commands and results are recorded;
* untested risk is reported;
* rollback is still valid.

---

## Staging Gate

Staging acceptance adds:

* real deployed CORS, cookies, CSRF, and Socket.IO;
* separate environment validation;
* two-league workflows;
* email adapter;
* scheduled jobs;
* provider failure when the release actually composes a provider; this is not a
  FAD-18 prerequisite;
* backup and restore;
* migration rehearsal;
* desktop and mobile manual QA.

---

## Release Gate

Release requires:

* complete automated launch-critical suites;
* release browser matrix;
* no unexplained flaky test;
* no critical or high-severity open security defect;
* verified restore;
* migration reconciliation;
* written manual QA;
* production smoke and rollback commands prepared;
* explicit production authority.

---

## Production Smoke

Automated production smoke is read-only:

* frontend asset load;
* minimal liveness;
* public roster read;
* approved public metadata;
* no internal path or secret disclosure.

Production smoke does not:

* create test users;
* place bids;
* submit trades;
* reset data;
* run jobs;
* restore backups;
* write fake activity.

An authorized human may perform a real expected account action after launch and records the result separately.

---

# Part 15 - Coverage and Quality

## Coverage Policy

Coverage is diagnostic and ratcheted upward.

Initial refactor steps do not fail solely because old untested code lowers a global number.

New or materially changed:

* pure domain modules target at least `90%` branch coverage;
* security, authorization, transaction, migration, and job modules require every approved scenario even if line coverage is already high;
* frontend feature logic targets at least `80%` branch coverage where practical.

After the baseline is measured, coverage may not decline without an explained exception.

Generated files, configuration-only files, and unreachable defensive branches may be excluded only explicitly.

---

## Mutation and Property Testing

No mutation-test or property-test dependency is selected initially.

Boundary-rich calculations use table-driven tests.

If defects show example tests are insufficient, the Testing Strategy may add focused property or mutation testing through a separate reviewed tooling decision.

---

## Flaky Tests

A test is flaky when identical code and controlled inputs produce inconsistent results.

Policy:

1. preserve trace and evidence;
2. identify uncontrolled dependency;
3. fix or temporarily quarantine with an issue, owner, and expiry;
4. do not silently add sleeps or unlimited retries;
5. keep release blocked when the flaky test covers a launch-critical path.

One CI retry diagnoses flakiness; it does not erase it.

---

# Part 16 - Test Evidence

Every completed work-plan step reports:

```text
repository
branch
commit or working-tree identity
environment
commands
passed count
failed count
skipped count
duration
fixture or database identity
pre/post data proof
artifacts
tests not run
remaining risk
```

Never state that a suite passed without running it.

Screenshots, traces, coverage, and migration reports are artifacts. The authoritative result is the recorded command outcome plus reviewed behavior.

---

# Part 17 - Implementation Sequence

Testing capability is introduced in this order:

1. Approve `TESTING_STRATEGY.md` as the cross-project authority.
2. Maintain the completed backend `BR-00` characterization and safety harness.
3. Add configuration and bootstrap tests in `BR-01`, then add domain, repository, service, contract, job, and security suites as their modules are extracted.
4. Add the frontend Vitest and Testing Library foundation before frontend structural migration.
5. Add Query Client, HTTP client, session, league-context, and feature component tests with each frontend slice.
6. Add Playwright local environment and Chromium critical-path tests.
7. Add temporary SQLite factories, migration, and recovery suites.
8. Establish CI gates.
9. Establish isolated staging and deployed security tests.
10. Complete the release browser matrix and written manual QA.
11. Run production read-only smoke after authorized deployment.

Tooling is added through focused work plans. No dependency is installed by writing this strategy.

---

# Part 18 - Completion Criteria

The testing foundation is complete for launch when:

* backend and frontend test commands are real and passing;
* current compatibility behavior is characterized where still needed;
* approved target behavior has independent tests;
* pure league calculations have boundary coverage;
* SQLite repositories and transactions use real temporary databases;
* two-league isolation is tested across all private feature families;
* account and security suites pass;
* jobs pass restart, overlap, and duplicate tests;
* Socket.IO passes authentication and room-isolation tests;
* migration is deterministic and reconciled;
* backup restore is demonstrated;
* critical browser workflows pass on the release matrix;
* written manual QA is complete;
* production smoke is read-only;
* no unexplained flaky or skipped launch-critical test remains.

---

# Verification

```powershell
Get-Content docs/07-testing/TESTING_STRATEGY.md
Select-String -Path docs/07-testing/TESTING_STRATEGY.md -Pattern '^`APPROVED`$','BR-00','BR-01','Two-League Fixture','Production Smoke'
```

Expected:

* document status is `APPROVED`;
* backend `BR-00` is the completed characterization baseline and `BR-01` is the next refactor step;
* frontend and browser tools are selected;
* production automated smoke is read-only;
* no test may use production storage as disposable data.
