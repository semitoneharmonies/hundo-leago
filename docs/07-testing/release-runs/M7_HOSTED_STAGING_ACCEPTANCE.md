# M7 Hosted Staging Acceptance

## Status

`M7-14 FINAL PRODUCT-REVIEW BATCH PASSED / USER ACCEPTANCE READY`

Production remains `NO-GO`. This record does not authorize a production
reset, migration, deploy, traffic change, job activation, or merge to `main`.

## Original M7-09 Candidate

```text
Release ID:          HL-20260724-1
Frontend branch:     staging
Frontend commit:     3d2cc5989badd9432c312410d4306d07d6c400ce
Backend branch:      staging
Backend commit:      1b366691a3edb14eac2af68e52f74fdbe32cf089
```

## Hosted Resources

```text
Netlify project:     hundoleago-staging
Netlify site ID:     95af8aa7-0b13-4954-af6d-855762acb147
Netlify URL:         https://hundoleago-staging.netlify.app
Netlify deploy ID:   6a6406ea4958711f91ddc4f0

Render service:      hundo-leago-backend-staging
Render service ID:   srv-d9eo2turnols73ekb830
Render URL:          https://hundo-leago-backend-staging.onrender.com
Render deploy ID:    dep-d9i0t77aqgkc73c96l8g
```

The dedicated staging resources are distinct from Netlify production project
`hundoleago` and Render production service `hundo-leago-backend`.

## Publication Evidence

Netlify reported the final deploy `ready` at
`2026-07-25T00:44:50.381Z`.

* one SPA redirect rule was processed successfully;
* 295 files were secret-scanned with zero matches;
* `/` and `/sign-in` returned HTTP 200;
* the published bundle contains the exact Render staging origin and frontend
  commit;
* the published bundle contains no localhost API fallback.

Render reported the final deploy `live` at
`2026-07-25T01:19:26.422270Z`.

* public liveness returned HTTP 200 with `live`;
* public readiness returned HTTP 200 with `ready`;
* authenticated operations health reported the exact backend and frontend
  commits;
* schema version is 18;
* migration checksum-set ID is
  `02aff6b32705d53716c41d0e6e4396bd04922ba9173c979ac02d80059540982a`;
* environment ID is `test:release-qa`;
* database ID suffix is `-fixture`;
* scheduled jobs are disabled;
* maintenance/write mode is `open`;
* outbox state was two pending fixture events, zero publishing, and zero
  failed.

## Deterministic Fixture

```text
Fixture manifest checksum:
6ae04870c33a6b723a0f53c604a3c964773b8e6fb6b7f10ed4e1ac5bbfd9c98c

Database identity:
m7-release-qa-fixture

Database path:
/opt/render/project/data/hundo-staging/sqlite/hundo-leago.sqlite3
```

The fixture contains nine controlled account states and two isolated leagues.

## Verification

### Local candidate gates

Frontend:

* 95/95 automated tests passed;
* lint passed;
* M3 browser-authority verification passed;
* the production build completed with 1,746 modules.

Backend:

* syntax check passed;
* 894/894 automated tests passed after the final hosted-verifier correction;
* the Render build independently passed 893/893 tests for the preceding
  runtime-equivalent commit before the verifier-only cookie assertion changed.

### Hosted release-QA verifier

The canonical verifier completed successfully against the two public HTTPS
staging origins.

```text
Report checksum:
465980974b2fa2c9aaeb084b0f25348179ac2358341720d05e87f15e8e137c71
```

Passed checks:

* account-state rejection;
* authentication, reload, and session lifecycle;
* exact Origin enforcement;
* CSRF rejection and authorized write;
* administrator authority across two explicit memberships;
* commissioner authorization and sealed-bid privacy;
* representative league, team, roster, player, auction, trade, matchup, and
  standings reads;
* cross-league read and write denial;
* operations-health authorization;
* scheduled-job disablement.

The hosted Socket.IO check also passed:

* the exact Netlify staging origin completed an authenticated WebSocket
  handshake;
* a hostile origin was denied;
* the verification session signed out cleanly.

### Live browser smoke

The dedicated Netlify site rendered successfully in the live browser.

* the staging administrator signed in;
* both Release QA leagues were visible;
* Release QA Alpha opened successfully;
* the dashboard rendered Week 2, all six teams, one open auction, two pending
  trades, and recent activity.

## Grae Manual Hosted Staging Acceptance

Manual review was completed against the public staging site using the original
72-check browser checklist. This is user-observed evidence only; it does not
replace the automated hosted verifier or authorize a production action.

```text
Passed:      62
Failed:       4
Not tested:   6
Overall:      FAIL / BLOCKED
```

### Passed

* A01-A06; B01-B15; C01-C03, C05-C08, C11-C13; D01-D04, D06-D10;
  E01-E02, E04-E07; F01-F12; and G01-G03, G05.

### Failed

* C04 — player names were readable, but there was no player-detail page.
* C09 — matchups did not show player lists.
* C10 — team fantasy totals were readable, but player statistics could not be
  reviewed because no players were listed.
* G04 — after reconnecting, the user had to click a link to reload.

### Not tested

* A07 — the application navigation uses the root URL, so direct protected
  nested-URL behavior could not be exercised.
* D05 — the Players page did not show team ownership.
* E03 — no Beta commissioner test account was available.
* E08-E10 — not tested during the interactive review.

The failures and untested gates mean the candidate is not release-ready.
Production remains blocked. Grae must decide whether to authorize a scoped
staging defect-fix plan, supply the missing test coverage/accounts, or close
the acceptance review with these gates explicitly deferred.

## Backup and Restore

The staging backup configuration validates with:

* environment `staging`;
* prefix `hundo-leago/staging/`;
* local staging directory under the staging persistent root;
* HTTPS object-storage endpoint;
* configured staging credentials;
* scheduled backups disabled.

The encrypted offsite upload was attempted and failed safely with
`BACKUP_OFFSITE_OPERATION_FAILED`. No offsite manifest was available for an
offsite restore. The provider/credential target must be reviewed before this
gate can pass; no production storage value may be substituted.

A hosted online SQLite backup and clean-path restore were then verified on the
staging disk:

```text
Backup ID:
backup-v1-c5ab2c75353274af89c3207fb89ba3ba0f9e51dd81dd4bc2414ac3a35e4f3d47

Plaintext SHA-256:
c5ab2c75353274af89c3207fb89ba3ba0f9e51dd81dd4bc2414ac3a35e4f3d47

Manifest checksum:
29eef03b34aba68766a745b86f60de2e645d2473ab7a0d985520948905d8cb66

Integrity:
ok

Foreign-key violations:
0

Restored schema version:
18
```

The clean restore used a new path and did not replace the live staging
database.

## Original M7-09 Provider Evidence (Superseded)

The hosted verifier intentionally did not trigger an NHL refresh. Operations
health reported a last-valid 2026-27 statistics refresh. This is retained as
historical M7-09 evidence only; its former focused-live-refresh gate is retired
for FAD-18.

Email remains capture-only. Scheduled jobs remain disabled.

## FAD-18 Provider-Independent Procedure

Grae's 2026-08-11 clarification removes the SportsDataIO live-provider
capability gate from FAD-18. FAD and Entry Draft use the persisted player
catalogue. Zero is the authoritative semantic baseline for every current-season
counter, but the current application does not yet materialize or project that
baseline consistently; that separate frontend/statistics gap cannot make prior-
season values current. The active hosted procedure requires live-statistics
composition and the shared automatic matchup-occurrence runner to remain
disabled in full. Statistics refresh, baseline, normal lock, finalization, and
matchup-week rollover occurrences do not run; FAD, Entry Draft, auction, trade, and outbox
workers remain available subject to their own gates. It requires no paid key, probe
manifest, discovery/provider call, signing secret, capability artifact,
independent artifact verification, or `required` provider mode.

The detailed numbered SportsDataIO procedure below is retained only as a
superseded historical record of the pre-clarification plan. Do not execute its
provider discovery, manifest, check, verifier, or mode-promotion steps. No
credential, endpoint, historical binding, or provider semantic in that record
has any effect on FAD-18.

### Active amended sequence

1. Amend and verify startup, release preflight, maintenance hold, and hosted
   acceptance with live-statistics composition and the complete automatic
   matchup-occurrence runner disabled and no provider manifest/artifact
   requirement.
2. In the exact Render staging service and every linked staging environment
   group, delete—not blank—these nine variables:

   ```text
   SPORTSDATAIO_NHL_LIVE_API_KEY
   SPORTSDATAIO_NHL_LIVE_API_ORIGIN
   SPORTSDATAIO_NHL_LIVE_CAPABILITY_SECRET
   SPORTSDATAIO_NHL_LIVE_CAPABILITY_KEY_VERSION
   SPORTSDATAIO_NHL_LIVE_CAPABILITY_ARTIFACT
   SPORTSDATAIO_NHL_LIVE_PROBE_MANIFEST
   SPORTSDATAIO_NHL_API_KEY
   SPORTSDATAIO_NHL_API_ORIGIN
   SPORTSDATAIO_NHL_LAST_SEASON_START_YEAR
   ```

   Blank dedicated live-provider values still fail disabled-mode backend
   validation. Deleting only a service override is insufficient if a linked
   group still supplies the name. Inspect the service's effective resolved
   environment and record only that all nine names are absent; never display,
   copy, or log any former value. Keep
   `SPORTSDATAIO_NHL_LIVE_MODE=disabled`. Complete this check before the held
   startup, and do not touch production services or groups.
3. Deploy the exact auxiliary hold build to the exact isolated staging service
   and disk; prove the old disk-backed instance stopped and the health-only
   surface opens no application/database runtime.
4. Preflight and deploy the exact final build still held against the old path.
5. Create and verify the current encrypted backup and distinct inactive clean
   restore.
6. Create and verify the fresh schema-49 reset/import path, complete the ordered
   reset artifact/bootstrap/migration-report/database-identity handoff, and
   preserve the old path untouched.
7. Immediately before ordinary startup, repeat the name-only effective-
   environment inspection and verify all nine deleted variables remain absent
   from the exact staging service and linked groups. Do not log values.
8. Activate the same exact final build on only the new verified path with hold
   false, live-statistics composition disabled, and no automatic statistics-
   refresh, baseline, normal-lock, finalization, or matchup-week rollover processing. Keep
   FAD, Entry Draft, auction, trade, and outbox workers behind their own gates.
9. Prove retained prior-season rows keep their source-season identity and do
   not affect FAD catalogue/search/card/allocation/auction/completion workflows.
   FAD requires no statistics provider. The separate follow-up owns the current-
   season zero/unavailable projection and legacy player-page season-filter gap.
10. Keep the complete automatic matchup-occurrence runner disabled; the separate
   future provider-neutral implementation will run four completed-game
   cumulative refreshes each evening after exact clock times are approved and
   will deliberately restore or split baseline, normal-lock, finalization, and
   rollover processing.
11. Record resource, build, database path, backup, activation, rollback, QA, and
   deploy identities. Production remains unauthorized.

### Superseded historical SportsDataIO sequence

The words “must”, “requires”, “blocks”, and “acceptance requires” in this
subsection describe the retired plan only. They are not current operator
instructions.

This retired procedure once superseded the original focused-refresh note for a
FAD release candidate. Its provider credential and source prerequisites no
longer apply. The active sequence above retains only the resource-isolation,
operator-access, backup, reset/import, migration-report, activation, and
rollback gates.

The accepted M7-09 provider evidence above remains historical. The detailed
sequence below records the retired design and must not be used to promote any
release candidate to persistent `required` mode:

### FAD-18 pre-mutation read-only identity checkpoint - 2026-08-11

```text
Render workspace:                         tea-d4prbj7diees738tmg90
Render staging service:                   srv-d9eo2turnols73ekb830
Render staging disk:                      dsk-d9eo2u6rnols73ekb8t0
Current live Render rollback deploy:      dep-d9kmv0ijobas73fsp8kg
Current live Render rollback commit:      fa85e75c904389284a030459cd8a68f452cdac02
Existing schema-22 database path:         /opt/render/project/data/hundo-staging/sqlite/hundo-leago.sqlite3
Current ready Netlify rollback deploy:    6a6bede0e1742b6b750017cb
Published frontend source head:           29d4d89ea6def41464fc48b6390e7f567c480039
Bridge implementation commit:             1ad052300ef00e82c16e6abfe2d0f1cc5a15dfbd
Published backend bridge source head:      26cf9606b8ee1f33efeb9e667cd265f947bc5387
Auxiliary bridge deployed:                 no
Final backend candidate at checkpoint:     pending provider-manifest commit; dependency later superseded
Final candidate deployed:                  no
Environment/disk/database mutation:        none
Production mutation or authorization:      none
```

The exact Render staging service and disk above share a workspace with separate
production resources. Every later mutation must remain pinned to those staging
identities. This inspection establishes the current pre-FAD rollback point; it
does not claim that either published FAD source head has been deployed.

1. Record and deploy the auxiliary bridge commit against the existing
   schema-22 `DATABASE_PATH` with the persisted Render service value
   `STAGING_MAINTENANCE_HOLD=true`. Its other exact prerequisites are
   `APP_ENV=staging`, `NODE_ENV=production`, `LEAGUE_WRITE_MODE=closed`,
   scheduled jobs, FAD routes, account-email delivery, debug routes, and backup
   schedule all `false`, `EMAIL_DELIVERY_MODE=capture`, and provider mode
   `probe`. A Render persistent-disk redeploy stops the old instance before the
   replacement starts; record both deploy identities and prove the old process
   no longer holds the disk.
2. Verify exact-path GET/HEAD liveness and readiness and maintenance `503` for
   every other request, including `OPTIONS`. The bridge must import and open no
   target/database runtime and compose no application routes, jobs, Socket.IO,
   or email. A hold `ready` response means only that the maintenance listener is
   live, not that the application or database is ready. Confirming the attached
   Dashboard Shell or SSH session is reachable is an external operator/provider
   check.
3. From that disk-backed shell, quiesce the isolated schema-22 database and run
   exactly:

   ```text
   npm run data:discover:sportsdataio-live:staging -- --historical-date YYYY-MM-DD
   ```

   Discovery must inherit the persisted deployed
   `STAGING_MAINTENANCE_HOLD=true`; do not prefix, spoof, or override that value
   on the command. It must use only the dedicated paid live key, require and
   recheck a sidecar-free guarded source, copy the guarded main database to a
   private OS-temporary snapshot, and open only that copy read-only with
   `fileMustExist` and `query_only`. Source and copy identity and SHA-256 must
   agree; the copy must close and be removed before sanitized output is
   published. Any source drift or cleanup failure blocks with no output. The
   command makes no shared database or league write and retains no raw provider
   response.
4. Have the operator review the sanitized discovery output and commit its exact
   manifest as
   `config/provider-capability/sportsdataio-live-probe-v1.json`. Record the
   manifest commit and semantic SHA-256; do not commit raw provider data or a
   credential.
5. From the clean exact final-candidate checkout, run
   `npm run release:candidate:preflight`. A missing, untracked, invalid,
   season-mismatched, or build-omitted manifest, or a checked-in
   `STAGING_MAINTENANCE_HOLD` default other than `false`, blocks activation.
6. Deploy that exact final commit and build once against the old schema-22 path
   with the persisted hold still `true`. Re-prove the health-only surface before
   any disk mutation. From this held final build, create and independently
   verify the current old-path backup:

   ```text
   npm run db:backup -- --reason pre-reset
   npm run db:backup:verify -- --manifest-object-key <manifestObjectKey>
   npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <absolute-distinct-clean-restore-path>
   ```

   The restore target must be a previously absent, absolute clean path distinct
   from both the old schema-22 database and the new schema-49 import path. Record
   the clean-restore path and successful result, then leave it inactive. Do not
   begin reset/import until all three backup gates pass.

7. Still on that exact held final build, create the approved Season 1
   reset/import at a distinct, previously absent schema-49 database path beneath
   the isolated persistent root, then run the exact staging import verifier:

   ```text
   npm run db:import-staging -- --descriptor <descriptor-path> --source-bundle <bundle> --database <absolute-new-database-path> --reset-manifest <reset-manifest-path> --report <new-import-report-path> --operating-mode <operating-mode>
   npm run db:verify-staging-import -- --descriptor <descriptor-path> --source-bundle <bundle> --database <absolute-new-database-path> --reset-manifest <reset-manifest-path> --import-report <new-import-report-path> --operating-mode <operating-mode>
   ```

   The descriptor must bind that exact new path. Keep the old schema-22 file
   and sidecars untouched. Do not run an in-place `db:migrate`; that path is
   excluded unless mandatory isolated persistent-root enforcement is first
   hardened and accepted. Verify the pristine schema `49`, integrity, foreign
   keys, ledger, and import reconciliation. The import verifier alone is not a
   runnable activation target.

   Before step 8, complete the exact
   [Closed-Write Reset Evidence Handoff](../../04-technical-specs/FREE_AGENT_DRAFT.md#closed-write-reset-evidence-handoff)
   without reordering or omission: publish the reset/import verification
   artifact with:

   ```text
   npm run db:publish-reset-import-verification -- --descriptor <descriptor-path> --source-bundle <bundle> --database <absolute-new-database-path> --reset-manifest <reset-manifest-path> --import-report <new-import-report-path> --operating-mode OFFSEASON_RESET
   ```

   Then run the pinned-
   Node `scripts/bootstrap-first-platform-administrator.js`; run the pinned-
   Node `scripts/bootstrap-reset-original-league.js`; run the pinned-Node
   `scripts/db-commit-reset-migration-report.js`; and only after the exact
   succeeded report and post-commit continuity proof, initialize the deployed
   environment identity with:

   ```text
   npm run db:initialize-environment -- --database <absolute-new-database-path> --persistent-root <absolute-staging-persistent-root> --environment staging --environment-id <staging-environment-id> --database-id <new-database-id> --created-at <approved-created-at> --migrations <absolute-migrations-path>
   ```

   Use every exact argument, typed confirmation, protected environment input,
   and pinned Node executable required by the linked handoff; the short names
   above are sequencing labels, not substitutes for those interfaces. Record
   both database paths and identities, the backup, reset/import artifact,
   succeeded migration report, activation path, and path-and-build rollback
   pair.
8. Change `DATABASE_PATH` to only the verified new path, persist
   `STAGING_MAINTENANCE_HOLD=false`, and redeploy the same exact final commit and
   build in `probe` with every quiescence gate still closed. From its disk-backed
   service shell, run the zero-argument
   publisher:

   ```text
   npm run data:check:sportsdataio-live:staging
   ```

   The publisher must reject before manifest read, provider fetch, artifact
   write, or output unless Node mode is `production`, the persisted hold is
   `false`, writes are closed, scheduled jobs, FAD routes, account-email
   delivery, debug routes, and backup schedule are disabled, and email is
   capture-only.

9. While the deployed service remains in `probe`, independently verify the
   artifact from that same disk-backed shell with the exact per-process
   invocation:

   ```text
   SPORTSDATAIO_NHL_LIVE_MODE=required npm run data:verify:sportsdataio-live:staging
   ```

   The verifier accepts zero package arguments, is staging-only, requires that
   same normal-probe boundary including persisted hold `false`, disabled debug
   routes and backup schedule, and capture-only email before artifact read, and
   does not persist or change the deployed service mode. It is a one-off command
   in the service shell, not a Render one-off job. Do not change the persistent
   service mode before this verifier passes.
10. Only after independent verification passes, change the deployed service's
   persistent `SPORTSDATAIO_NHL_LIVE_MODE` from `probe` to `required` and
   restart or redeploy the same commit and build. Startup must independently
   re-verify the artifact before SQLite opens.

Local-only transition evidence is green under exact Node `24.14.1`: the hold,
discovery, publisher, and verifier pass `35/35`; the broader nine-file
entrypoint/Render/preflight/target-runtime/transition matrix passes `125/125`;
and the six-file provider family discovers `106`, with `104` passing, two
intentional Windows link-capability skips, and zero fail, cancel, or todo. This
does not satisfy any numbered external step above.

Do not run discovery or the publisher in build, pre-deploy, Render one-off-job,
or start-command contexts. Those contexts do not provide the required service
database and attached-disk boundary.

Complete and retain this record across discovery and before candidate
deployment:

```text
Old disk-backed instance/deploy stopped:
Auxiliary bridge commit/build/deploy identity:
Auxiliary hold prerequisites and health-only proof:
Attached-service shell reachability proof:
Discovery tool commit/build identity:
Final candidate commit/build identity:
Final candidate held deploy identity:
Environment identity:
Old schema-22 database path/identity:
Old-path backup manifest object key:
Clean backup-restore verification path/result:
New schema-49 database path/identity:
Reset/import artifact and migration-report identity:
Activation path-and-build pair:
Rollback path-and-build pair:
Configured NHL season:
Probe NHL season:
Historical date:
Probe-manifest SHA-256:
Manifest commit:
Release preflight result:
Dedicated credential version:
Persisted hold for discovery/final-held work: true
Persisted hold for candidate activation:       false
Persistent mode:                probe
Artifact path:                  /opt/render/project/data/hundo-staging/provider-capability/sportsdataio-live-v1.json
Writes/jobs/FAD/email:          closed/disabled/disabled/capture
```

The sanitized receipt must record only the passed status, evidence ID and
digest, environment/build identity, issued/expiry times, source version, and
assertion names. Independently verify the artifact on the service and record:

```text
Evidence ID:
Evidence SHA-256:
Issued at:
Expires at:                     exactly 24 elapsed hours after issue
Source version:
Assertions:
Explicit-zero pair:
Controlled omission:           rejected as incomplete
Raw payload retained:          no
Shared league data changed:    no
```

The retired acceptance model expected exhaustive current Players and
FreeAgents access, previous-completed-season totals, targeted historical
schedule and PlayerGame access, explicit dispositions and zero rows, exact
coverage/observation equality, one capture and source version, and controlled-
omission rejection. Missing provider inputs stopped only that retired model;
they do not stop the active staging release.

The retired plan would then have recorded health and capability status after
required-mode startup. No active FAD route/job gate depends on that startup or
its environment, build, origin, season, manifest, credential, time, digest, or
HMAC checks. This historical procedure never authorized production;
production remains unauthorized.

## Rollback Evidence

* current accepted Netlify staging deploy:
  `6a6406ea4958711f91ddc4f0`;
* prior Render staging deploy that passed the hosted application checks:
  `dep-d9i0pajtqb8s73ad57hg` at backend commit
  `311cf268cc4c486e12b1941a22f365ad88b0468a`;
* current accepted Render staging deploy:
  `dep-d9i0t77aqgkc73c96l8g` at backend commit
  `1b366691a3edb14eac2af68e52f74fdbe32cf089`.

Rollback must select only one of these staging identities. Code rollback does
not roll back or restore SQLite state.

## M7-10 Remediation Retest

The staging-only remediation was published and retested on `2026-07-25`.

```text
Frontend application commit: 84bb957ff75c351e2c55238bacb982f8dcf8b46b
Frontend Netlify deploy:      6a64b810e7798072d13f104e
Backend commit:               0e97b056a3946bcbaeb782d23d849bb2b508a125
Backend Render deploy:        dep-d9ib71l8nd3s739k1v60
Fixture build:                m7-release-qa-fixture-v6
```

Local publication gates passed:

* backend provider-contract focus: `32/32`;
* complete backend: `962/962`;
* complete frontend: `106/106`;
* frontend lint, production build, and browser-authority verification.

The explicit staging import ran only while writes were closed. SportsDataIO
Discovery Lab returned `3,154` catalog players and `1,091` mapped 2025-26
regular-season statistics rows. The adapter derives provider season
`2026REG`, rejects non-regular-season totals, and exposes no subscription key.
After reopening writes, provider health retained the successful import and a
real Connor McDavid detail page displayed 82 games, 48 goals, 90 assists, and
138 points with a visible last-season label.

The accepted M7-09 failures and untested authority cases were retested:

* league-scoped player details show ownership, contract, and statistics;
* current matchups show player lists plus G, A, PTS, and FP values;
* a Render staging restart preserved the selected matchup route and all 20
  table rows without a manual refresh;
* direct protected commissioner URLs deny the Alpha manager;
* the Beta commissioner cannot address the Alpha league; and
* the platform administrator can inspect both deliberately different fixture
  leagues.

The commissioner smoke added a real imported free agent to Alpha Foxes,
moved the player through Bench, Active, Injured Reserve, Prospect, and back to
Bench, corrected total salary and term, then removed the player. Every apply
followed a read-only preview, returned an activity identifier, updated the cap
projection, and appeared in League Activity. The exceptional IR and Prospect
warnings required confirmation. The player returned to free agency and Alpha
Foxes returned to its fixture cap.

The seeded trade view restored three pending, one accepted, and one rejected
record. The invalid-cap acceptance preview displayed
`SALARY_CAP_EXCEEDED`, projected usage of `$102.00` against the `$100.00`
limit, and the approved general-illegality warning. The trade was not accepted
during smoke testing. This matches `TRADES.md`, which allows completion only
after explicit warning confirmation; the manual guide now tests the warning
instead of incorrectly requiring a hard block.

The final staging-only reset:

* created and verified backup
  `backup-v1-14c101189ceadd0de55d7cffd6b0727ddb2e43af820968804b525f9756fe4215`;
* invalidated all fixture sessions;
* restored six Alpha and six Beta teams;
* restored Fixture Player 19 to Alpha Owls Bench and Beta Vipers Bench;
* restored all five seeded trade states and populated matchup statistics; and
* preserved the `3,154`-player catalog and `1,091`-player successful import.

The final Render staging runtime has writes open and scheduled jobs disabled.
The final Netlify staging deploy is healthy. No production service, data,
configuration, branch, job, provider, or traffic setting was changed.

## M7-11 Usability Remediation

The second staging-only remediation was published and verified on
`2026-07-26`.

```text
Release ID:                    HL-20260726-2
Frontend application commit:   1233c3c6185d4f7edfa8dcedc8d59dcedce0f0a5
Frontend Netlify deploy:        6a6638fa90a1d936d7ab5426
Frontend Netlify build:         6a6638fa90a1d936d7ab5424
Backend application commit:     e7f089ecc81ca9fa17b8b0143949b760668f66d1
Backend Render deploy:          dep-d9j3ghhba33s73821490
Preflight report checksum:      8dcdd49eb3903fb658815cd9460f3dd1fbb04d10736e56b16d526f36a129299a
Fixture build:                  m7-release-qa-fixture-v7
```

The release preflight returned `ready-for-freeze-review`. The frontend
application commit is the exact source used for the prebuilt Netlify artifact;
the later documentation commit does not alter the application bundle.
Netlify reported the deploy `ready`, processed two redirect rules, scanned
`341` files with zero secret matches, and published a bundle containing the
exact frontend commit and Render staging origin with no configured localhost
origin.

Render reported the deploy `live`. Public liveness returned `live`, public
readiness returned `ready`, scheduled jobs remained disabled, and writes
remained open. The final runtime reports the exact frontend and backend
application commits.

### Schema 19 migration

The first deploy attempts failed closed with `MIGRATION_DATABASE_BEHIND`; the
previous runtime remained live. Before migration, the staging database was
schema `18`, `integrity_check=ok`, and had zero foreign-key violations.

The verified persistent pre-migration backup is:

```text
Backup ID and plaintext SHA-256:
backup-v1-81b3ca0f587fc64b24c2dba445e04db156e27f19055de0736f9582536560d7dd

Manifest checksum:
11e22b8db32572a413bb2ddc428ecc72cb026cd047c23a3a17260ab035b46d0d
```

Migration `19` ran once from the exact backend candidate. The final database
has schema `19`, nineteen migration-ledger rows, the exact migration checksum,
both new tables, `integrity_check=ok`, and zero foreign-key violations.

### Final fixture reset

The protected staging-only reset:

* created and verified backup
  `backup-v1-4605c937816ac2469b3e62f3a804d236a5c53df6bc7dddcbfaef5bd3c3d353a6`;
* invalidated all fixture sessions;
* installed fixture build `m7-release-qa-fixture-v7`;
* preserved the `3,154`-player catalog and `1,091`-row successful statistics
  import; and
* restored both isolated six-team leagues, their controlled accounts, seeded
  trades, matchups, rosters, and authoritative activity.

### Hosted browser acceptance

The administrator and Alpha-manager workflows confirmed:

* the dashboard and Alpha Ravens roster use provider-backed NHL player names;
* Alpha Ravens reports `$7.25` usage, `$6.50` active salary, `$0.75`
  retained salary, `$0.00` buyout penalties, `1/3` retention slots, and
  `$92.75` available against a `$100.00` limit;
* the roster exposes sixteen owned picks across four chronological years,
  switches between league teams, supports table and hockey-line views, and
  persists keyboard display ordering;
* the Players page loads `3,154` available records, excludes unavailable
  records, defaults to descending fantasy points, sorts columns, filters,
  compares selected players, and sends a stable player selection to Auctions;
* Connor McDavid was prefilled in the auction form while the single eligible
  team appeared as implicit `Starting for Alpha Ravens` context;
* the trade composer exposes only Contract, Prospect, Draft pick, Buyout
  penalty, Retention, and Future Considerations, and contract selection shows
  named authoritative players instead of stable identifiers;
* pending trade panels show player names and contract terms instead of raw
  JSON;
* League Activity defaults to readable summaries, times, and team names;
* Account settings expose display name, immutable email, password change, and
  the authorized Alpha Ravens name, logo, and two-colour profile controls; and
* a direct Alpha-manager request for the Beta Vipers roster was denied with a
  user-facing team-access message.

Dashboard, roster, Players, Trades, Activity, and Account had document width
equal to viewport width at `390 × 844`, with no visible whole-page overflow.

The connected browser cannot synthesize a native HTML pointer drag. Focused
frontend coverage proves the DOM drag handler and saved-order payload, and the
hosted browser proves equivalent keyboard ordering persists after reload.
Manual native pointer drag remains an explicit user-acceptance check.

No production service, branch, deploy, data, schema, configuration, job,
provider state, domain, or traffic setting was changed.

## M7-12 Acceptance-Fix Remediation

The third staging-only remediation was published and verified on
`2026-07-26`.

```text
Release ID:                    HL-20260726-3
Frontend application commit:   7146bd042fd86f11dd4f1226c61d879f4956f358
Frontend Netlify deploy:        6a66610577aa69f808ad00a9
Frontend Netlify build:         6a66610477aa69f808ad00a7
Backend application commit:     a821a95a267a370d7f3fe3ef0b8cfdacea83aea5
Backend Render deploy:          dep-d9j5vnt8nd3s73asjkn0
Preflight report checksum:      d92192498d533c90ea160867c7b1c5378324c2c1c2b1d40aec47b2a309d68d06
Fixture build:                  m7-release-qa-fixture-v8
```

The preflight returned `ready-for-freeze-review`. The complete frontend gate
passed `115/115` tests across 23 files, lint, production build, and
browser-authority verification across 15 compatibility files and 98 shipped
source files. The complete backend gate passed `968/968` tests across 232
suites under Node `24.14.1`, plus the repository check.

Render reported deploy `dep-d9j5vnt8nd3s73asjkn0` `live`. Public liveness
returned `live` and public readiness returned `ready`. Netlify reported deploy
`6a66610577aa69f808ad00a9` `ready`, processed two redirect rules, scanned
`343` files, and found no secret matches. The frontend application commit is
the exact source used for the uploaded Netlify artifact; the later
documentation-only commit does not alter that bundle.

### Fixture v8 reset

The protected staging-only reset:

* created and verified backup
  `backup-v1-d90df160904d8d36441233bffc6037207fa4bb666677798557f82a4a07412ca1`;
* invalidated all prior staging sessions;
* installed fixture build `m7-release-qa-fixture-v8`;
* preserved the complete `3,154`-player provider catalog; and
* restored both isolated release-QA leagues with the commissioner account
  separate from team-manager assignments and all 22 regular-season weeks.

### Hosted browser acceptance

The platform-administrator and Alpha Ravens manager sessions confirmed:

* a commissioner-only dashboard has no implicit managed team, while the
  Alpha Ravens manager dashboard retains its team context;
* Commissioner Roster Operations has the cleaner operation guide and no
  Import health or raw-JSON pane;
* team-directory cards render team-specific two-colour stripe backgrounds;
* Alpha Ravens reports `$7.25` usage, `$92.75` space, `$6.50` active salary,
  `$0.75` retained salary, `1/3` retention slots, and `$0.00` buyouts in five
  finance cards;
* the roster defaults to forwards before defence, exposes sortable GP, G, A,
  P, FP, and FPG columns, switches teams from one control, shows sixteen
  owned picks over four years, switches to hockey lines, and persists and
  restores keyboard ordering;
* the Players page exposes All Players, Free Agents, Favourites, every team,
  and Prospects, includes FPG, loads `3,154` visible provider records, defaults
  to descending FP, and filters a selected favourite;
* Connor McDavid handed off to Auctions by stable ID and appeared prefilled
  while the team was implicit as `Starting for Alpha Ravens`;
* contract selection exposes optional retained AAV, Future Considerations
  exposes only a notes field, and Alpha Foxes' selectable buyout reads
  `Adam Klapka · $92.50 penalty · 1y`;
* the selected buyout detail identifies Adam Klapka's buyout as `$92.50 AAV`
  with `1 season remaining` and states that the complete remaining obligation
  transfers;
* pending trade panels use player names and contract terms instead of JSON;
* Matchups exposes all 22 regular-season weeks, Week 1 loads without a
  response-shape error, Week 10 shows future opponents, and live fixture team
  totals differ; and
* League Activity remains summary-first and Account settings remains
  reachable.

No auction, trade, roster correction, account change, or team-profile change
was submitted during acceptance. The temporary roster keyboard reordering was
restored.

At the connected browser's narrow `667`-pixel viewport, the tested document
width equalled the viewport width with no whole-page horizontal overflow. The
connected browser cannot synthesize a native HTML pointer drag. Focused
frontend coverage proves the DOM drag handler and saved-order payload, and the
hosted browser proves equivalent keyboard ordering. Manual native pointer
drag remains an explicit user-acceptance check.

No production service, branch, deploy, data, schema, configuration, job,
provider state, domain, or traffic setting was changed.

## M7-13 Residual-Review Remediation

The fourth staging-only remediation was published and verified on
`2026-07-26`.

```text
Release ID:                    HL-20260726-4
Frontend application commit:   51f9c22c8127dcc992ca35ffcb9bdd10c14d3634
Frontend Netlify deploy:        6a666d6791675949811e06c9
Frontend Netlify build:         6a666d6791675949811e06c7
Backend application commit:     a821a95a267a370d7f3fe3ef0b8cfdacea83aea5 (unchanged)
Backend Render deploy:          dep-d9j5vnt8nd3s73asjkn0 (unchanged)
Fixture build:                  m7-release-qa-fixture-v8 (unchanged)
```

The exact frontend commit was pushed to `origin/staging` before artifact
publication. Netlify reported the final deploy `ready`, processed both redirect
rules, scanned `344` files, and found no secret matches.

The complete frontend gate passed `115/115` tests across 23 files, lint,
production build, browser-authority verification across 15 compatibility
files and 98 shipped source files, and `git diff --check`.

### Hosted browser acceptance

The platform-administrator session confirmed:

* the dashboard represents the administrator as league-wide, with All teams,
  no assigned team, and no managed roster;
* Commissioner Roster Operations shows one selected workflow at a time, has
  no Import health pane, collapses the cap and staging-reset support panels,
  and has corrected narrow-layout spacing;
* team-directory cards show strong horizontal primary/secondary colour bands;
* all 22 matchup weeks and completed Week 1 load; and
* League Activity remains summary-first without raw activity or user IDs.

The Alpha Ravens manager session confirmed:

* the dashboard and auction composer use the assigned Alpha Ravens context;
* the roster shows `$7.25` usage, `$92.75` space, `$6.50` active salary,
  `$0.75` retained salary, `1/3` retention slots and `$0.00` buyouts in five
  cards, plus sixteen picks over four years;
* active players default to forwards then defence by descending AAV and render
  larger GP, G, A, P, FP and FPG values in both table and hockey-line views;
* keyboard ordering saves authoritatively and was restored, while explicit
  mouse/touch drag handles are present in both views;
* provider-backed player names replace fixtures; FP is the default sort; FPG,
  Favourites, Free Agents, every team and Prospects are available; and a
  selected Connor McDavid handed off to Auctions prefilled with the manager's
  team implicit;
* Trades exposes optional contract retention, notes-only Future
  Considerations, and the named `Adam Klapka · $92.50 penalty · 1y` buyout
  obligation instead of an arbitrary amount;
* all 22 matchup weeks, completed Week 1 and scheduled Week 22 are selectable;
  and
* a temporary team rename appeared immediately in Matchups and the dashboard
  quick view, then the original Alpha Ravens name was restored.

The tested narrow browser document width equalled the viewport width with no
whole-page horizontal overflow. No auction, trade, commissioner correction or
fixture reset was submitted. The temporary roster display-order and team-name
changes were restored.

The connected browser's raw drag synthesis did not activate the application
gesture. Focused tests pass the desktop-native handle path, mouse/touch pointer
drop-target path, keyboard fallback, and saved-order payload. Manual native
pointer dragging remains the explicit Grae acceptance check.

No production service, branch, deploy, data, schema, configuration, job,
provider state, domain, or traffic setting was changed.

## M7-14 Final Product-Review Batch

The fifth staging-only remediation was published and verified on
`2026-07-26`.

```text
Release ID:                    HL-20260726-5
Frontend feature commit:       152d2131275b0686feaffbc5c17268732f597053
Frontend application commit:   ae7cb7d0dc5d9cba14b8f5d8b080aa3eb932eeb9
Frontend Netlify deploy:        6a669ac2e7798097bd3f111c
Frontend Netlify build:         prebuilt verified artifact; no separate build
Backend application commit:     9b1b89aebcd79ced9343eb1cde68543fa80023f3
Backend Render deploy:          dep-d9j98evaqgkc73b587mg
Schema transition:              19 -> 20
Fixture build:                  m7-release-qa-fixture-v8 (unchanged)
```

The exact backend and frontend application commits were pushed to their
respective `origin/staging` branches before publication. The frontend artifact
was built with the dedicated Render staging API and Socket.IO origins, embeds
application commit `ae7cb7d0dc5d9cba14b8f5d8b080aa3eb932eeb9`, and contains no
configured localhost origin. Netlify reported deploy
`6a669ac2e7798097bd3f111c` ready.

Render reported deploy `dep-d9j98evaqgkc73b587mg` live. Public liveness
returned `live` and public readiness returned `ready`.

### Migration and backup evidence

Before the staging migration, the standard backup workflow created:

```text
Backup ID:
backup-v1-02af141187ca38d6746b3d85bd4351cc045639c2755dd5a22af639c7a0a536ed

Backup directory:
/opt/render/project/data/hundo-staging/sqlite-backups/m7-14-pre-migration-1785106772436

Manifest checksum:
22b730fdcd893c9fc347dde9b46a93d173a4c0f07e2fdc289f0f3c9f03dbde61
```

The additive migration installed schema `20`, the twentieth migration-ledger
entry, optional tertiary team colour, and stable trade-block state. The
migration checksum was
`8e3692e3b0846ce7e6b0cb0a069f5e7e498b79c5ea26888b2ae207f4102acb0e`.
SQLite integrity returned `ok`, foreign-key verification returned zero
violations, and the expected columns and cleanup trigger were present. No
fixture reset occurred.

### Automated verification

The complete frontend gate passed:

* `118/118` tests across 23 files;
* lint;
* configured production build;
* browser-authority verification across 15 compatibility files and 99 shipped
  source files; and
* `git diff --check`.

The complete backend gate passed:

* `974/974` tests across 234 suites under Node `24.14.1`;
* repository syntax verification; and
* `git diff --check`.

### Hosted browser acceptance

The platform-administrator and commissioner session confirmed:

* the league-selection page retains existing leagues and exposes protected
  league creation and commissioner assignment;
* a commissioner dashboard has no implicit team and prioritizes a
  five-second rotating matchup spotlight, live auctions, pending trades,
  membership, and invitations;
* member removal is commissioner-only, explicit, and confirmation-protected;
* Commissioner Roster Operations remains simplified with no Import health
  pane; and
* the Teams directory displays readable identity plates over each team's
  two- or three-colour horizontal bands.

The team-manager session confirmed:

* the roster header uses the selected team's colour bands, the finance area
  remains at five cards, active players default to forwards and then defence
  ordered by descending AAV, and both roster views preserve drag ordering;
* visual arrow controls are removed while the keyboard fallback remains;
* compact expanding Buyout, Move to IR, Trade, and Trade Block controls are
  present, and Trade hands off the selected contract to the composer;
* the Players page uses colour-changing hockey helmets for favourites, has no
  duplicate selected-player table, includes FPG, and offers selectable
  player-name autocomplete;
* Matchups uses a professional week/date label, exposes all 22 weeks, includes
  GP for both teams, and colours both score headers with the corresponding
  team identity; and
* Account team settings switch between two and three colours and expose the
  third colour only in three-colour mode.

Pending league-invitation notifications were then rechecked. Manage-team
invitations expose Accept and Decline controls; accepting the invitation uses
the protected API, refreshes league access, and displays the accepted state.

During the member-removal confirmation check, the connected browser accepted
the native confirmation and temporarily removed the synthetic Alpha Wolves
manager membership. The same user was immediately re-invited through the
commissioner workflow and accepted through the repaired notification action.
The Alpha Wolves manager assignment is authoritatively restored. The
plain-language removal, invitation, and acceptance audit entries remain by
design.

No auction, trade, buyout, IR move, trade-block change, league creation,
team-profile update, roster correction, or fixture reset was submitted.
Production remained untouched.

## M7-15 Roster Flexibility and Final Review Follow-up

The sixth staging-only remediation was published on `2026-07-26`.

```text
Release ID:                    HL-20260726-6
Frontend application commit:   5cb9f63c1185581eed0687188b9bc25bc885dac2
Frontend Netlify deploy:        6a66c4f9708a1baaa94b6135
Frontend Netlify build:         6a66c4f9708a1baaa94b6133
Backend application commit:     d46104e754ffe56d68fc75baa3ec672a17f80d38
Backend Render deploy:          dep-d9jcs0urnols738i11pg
Fixture build:                  m7-release-qa-fixture-v10
```

The exact frontend and backend commits were pushed to their respective
`origin/staging` branches before publication. The immutable Netlify artifact
contains the exact frontend build identifier and dedicated Render staging API
origin, contains no configured localhost origin, processed two redirect rules,
scanned `404` files, and found no secret matches. Render reported the exact
backend commit `live`; public liveness returned `live` and readiness returned
`ready`.

### Automated verification

The complete frontend gate passed:

* `119/119` tests across 23 files;
* lint;
* configured production build;
* browser-authority verification across 15 compatibility files and 99 shipped
  source files; and
* `git diff --check`.

The final complete backend gate passed:

* `976/976` tests across 234 suites under Node `24.14.1`;
* repository syntax verification;
* provider-identity and protected-reset fixture coverage; and
* `git diff --check`.

### Fixture resets and corrective acceptance

The first protected reset installed fixture v9 after creating verified backup
`backup-v1-ba4e8665b6a69db12dc9a916c182a3c264c025ee7823fd14b9bc0bb57c3279dd`.
The connected hosted check then detected that full roster depth had fallen
back to synthetic display identities, and that the matchup table exceeded its
internal scroll container by `13` pixels at a `727`-pixel viewport. Neither
defect was accepted.

The corrected backend selects active provider-backed NHL identities for
normal roster slots and may select unavailable under-19 provider records only
for Prospect slots. The corrected matchup grid no longer allows its team
colgroup header to distort the twelve player-stat columns and clips compact
cell content inside the fixed grid.

The final protected reset:

* created verified backup
  `backup-v1-6a143967ddc394e1bcdf539f813c988a4fe1768b6e986fab28c5561640f17847`;
* installed fixture build `m7-release-qa-fixture-v10`;
* preserved all `3,154` provider-catalog players; and
* invalidated all prior staging sessions.

### Schema 21 correction

The first final hosted roster-move check proved ordinary Active-to-Bench and
Bench-to-Active moves worked, but accepting the warning for a `19/18` Active
roster returned a safe generic failure and left the roster unchanged.
Diagnosis showed that the service correctly accepted `confirmedIllegal=true`,
while the schema-20 ownership constraint permitted an unplaced overflow only
when its original acquisition type was an auction or trade.

Additive migration `21` removes that acquisition-type restriction for a
temporarily unplaced Active, Bench, or injured-reserve ownership. The
application service remains authoritative for warning confirmation and still
hard-rejects invalid contracts, Bench AAV, injured-reserve eligibility,
Prospect transitions, stale versions, authority, and cross-league scope.

The complete backend suite passed `976/976` tests across 234 suites under the
pinned Node `24.14.1` runtime. The Render candidate then failed closed with
`MIGRATION_DATABASE_BEHIND`, leaving the schema-20 runtime live. An
exact-staging-identity, one-time bridge created and verified:

```text
Backup ID:
backup-v1-8fc3212d1387f55cd5ed5f34ab3a017af7d1026b9c058d39e00f12ee78a66fb8

Manifest checksum:
d6c729cc9d34efd68018b32e463109967efbde362e33d80cf58d3c48f73c9305
```

It then applied only migration `21`, whose source SHA-256 is
`41d6db004e5b10f890197e4c32f88a97255e3ddc4f50748a51a793ce1a9dbe99`.
The bridge was removed and its confirmation environment value disabled before
the final backend application commit
`d46104e754ffe56d68fc75baa3ec672a17f80d38` reached `live` in Render deploy
`dep-d9jcs0urnols738i11pg`. Public liveness returned `live` and readiness
returned `ready`.

### Final hosted browser acceptance

The connected administrator, commissioner, and manager sessions confirmed:

* all twelve Alpha/Beta teams have 12 active forwards, 6 active defence
  players, 1-4 Bench players, the selected injured-reserve examples, and
  three Prospects, with no synthetic active player names;
* receiver trade notifications are present, pending trades involving the
  managed team carry the managed-team highlight, and unrelated trades do not;
* Players uses the recognizable hockey-helmet favourite action and compact
  start-auction action, the Favourites filter has no duplicate selected-player
  panel, and the auction form receives the selected player;
* team and matchup identity gradients preserve the colour bands while fading
  toward a readable neutral centre;
* the matchup table fits both teams' Player, GP, G, A, PTS, and FP columns
  without internal overflow at a `727`-pixel viewport;
* auction forms contain no redundant `Starting for` or `Bidding for` box;
* Commissioner Roster Operations has four clean operation tabs, searchable
  provider-backed player choices, team-scoped roster choices, and automatic
  position/slot handling; and
* moving Adam Engstrom from Bench to a full Active roster required explicit
  confirmation, persisted at `19/18` and `D 7/6`, and displayed the red
  authoritative `Illegal roster` flag. Moving him back to Bench restored
  `18/18`, `D 6/6`, and the original two-player Bench.

The hosted acceptance mutation was fully reversed. Fixture v10 remains in its
intended legal state.

### Final identity-fade and helmet clarification

Grae clarified that the configured horizontal stripes must remain unchanged
except where they pass behind the team identity. Frontend commit
`9044974306badd8df192880b5f7b229397d8a685` therefore fades the stripes to the
standard dark-blue background only beneath the team name/logo area on:

* the team index;
* the dashboard league-teams panel;
* both matchup score headers; and
* the roster identity header.

The dashboard team links now receive their authoritative two- or three-colour
CSS variables. The Players favourite action also replaces the prior abstract
symbol with a symmetrical front-facing hockey helmet while preserving the
compact expanding action.

The full frontend suite passed `119/119` tests across 23 files, lint passed,
the configured staging production build passed, and `git diff --check`
passed. Focused hosted manager acceptance visually confirmed all five affected
surfaces.

The first CLI upload, deploy `6a66d482be43e385d7023b7a`, rebuilt with local
default public variables and correctly failed closed before sending any league
request. It changed no backend or league data. The verified prebuilt artifact
was then uploaded with the rebuild explicitly disabled. Netlify deploy
`6a66d52d249ebdc854dbf6f1` is `ready`, embeds exact application build ID
`9044974306badd8df192880b5f7b229397d8a685`, and contains only the dedicated
Render staging origins in its configured public variables.

### Player pagination and managed-team badge follow-up

Frontend commit `72d30d687841196e1cf7e80051eaf0782079c402` and backend
commit `c1c3a3b53f397747ecf219a8cc4dc7a428339b3b` passed the complete local
gates. Frontend lint and the configured staging production build passed, as
did `120/120` tests across 23 files. Backend syntax verification and
`978/978` tests across 234 suites passed under pinned Node `24.14.1`.
`git diff --check` passed in both repositories.

Backend deploy `dep-d9jdn5vavr4c73caolmg` reached `live`, with public
liveness returning `live` and readiness returning `ready`. No schema or data
change was required. The exact prebuilt frontend artifact was uploaded with
the Netlify rebuild disabled. Deploy `6a66dc51cc47020a84ddc746` is `ready`,
embeds application build ID
`72d30d687841196e1cf7e80051eaf0782079c402`, contains the dedicated staging
backend origin, and contains no localhost backend origin.

Hosted manager acceptance confirmed:

* the first Players request renders exactly 100 player rows;
* Connor McDavid, Nikita Kucherov, and Nathan MacKinnon lead the first page in
  descending total-fantasy-point order;
* **Load next 100 players** appends one cursor page, producing exactly 200
  player rows while retaining another continuation for the remaining catalog;
* the page reports `Showing 100 of 100 loaded players.` and then
  `Showing 200 of 200 loaded players.`;
* entering `kuch` still returns Nikita Kucherov from the bounded server-backed
  autocomplete; and
* the managed Alpha Ravens card presents **Your team** as a white,
  dark-text, double-outline pill that remains visually distinct from the
  configured stripe colours.

## Remaining Gates

* Grae's independent browser retest, including native pointer drag;
* staging offsite object-storage upload and encrypted clean restore after the
  provider-independent FAD candidate is verified; and
* separate explicit production authorization and release execution.

Production remains blocked pending those separate gates.
