# Full-Site UI Review Isolated-Staging Release

## Status

`DRAFT - STAGING RELEASE BLOCKED; HELD RECOVERY PASS`

Release `HL-20260821-1` has not completed its final hosted acceptance and
closeout gates. Basic quiescent role smoke passed, but the staging QA password
was then disclosed in chat and treated as compromised. Second rotation
`HL-20260821-2`, its zero-write replay, and its exact strict restore-point backup
now pass. The frozen four-command strict recovery family and selective
manager-outbox publisher component gates separately pass `56/56` under exact
Node `24.14.1`. Their combined backend candidate passed its complete local and
held-hosted gates, is committed and published at exact
`23971a4d66ee6383c6ad54339e769dbc9a76561e`, and prepared the pinned strict
fixture with an exact zero-write replay. Controlled-unhold deploy
`dep-da4pvcrl550s738l8rmg` reached `LIVE` and passed its exact runtime gates.
Live strict phase one published successfully, but Manager B settled at
`complete 3/1/1` instead of required `complete 2/1/1`; the strict gate stopped
and the release is blocked. Partial-hold deploy `dep-da50g0v40ujc73aa5i4g`
was canceled and never live; exact full-hold replacement
`dep-da50hssaud7c73d3mqeg` passed. Strict abort materialization and exact
replay passed after a fail-closed source-sidecar recovery. Baseline helper rollback deploy
`6a8a09c13d5e25282f64d2c7` passed its remote removal gate. Restored-path
cutover, held target verification, and post-cutover backup now pass. The full
hold remains active. Fresh controlled reopening, final staging runtime flags,
observation, and documentation closeout are explicitly pending below.

Production remains untouched and unauthorized.

## Release Identity

```text
Release ID:                 HL-20260821-1
Frontend branch:            staging
Frontend broad UI commit:   d82583dea2132d94e53a60853da6dddc549a0126
Frontend privacy commit:    c119f119ffd4aa96635fe382792e704d535a7cbd
Frontend final commit:      0e8eee92e2e323dd7f25ec3112988feaf23f96f0
Backend branch:             staging
Backend broad commit:       ac1e12baadce4fcc08b6fb680b34db6992a4f891
Backend migration commit:   a747430500fbf6887dd748e5e3dfc0ecee77dc07
Backend held commit:        fe6047552857376b490756ff63ac593d431ee561
Backend strict-gate commit: 23971a4d66ee6383c6ad54339e769dbc9a76561e
Source schema:               52
Target schema:               54
Render staging service:      srv-d9eo2turnols73ekb830
Held migration deploy:       dep-da4e092fngtc739dipm0
Held final deploy:           dep-da4gkpoed13c739gm0dg
Netlify privacy deploy:      6a88f270666a3e6fa778ccc2
Netlify final deploy:        6a89709ffc9c88762ae8e74e
Quiescent Render deploy:      dep-da4hm30jo6nc73d26l80
Re-hold Render deploy:        dep-da4j4r49v7es738bkih0 (LIVE; finished 2026-08-22T06:11:11Z)
Strict held Render deploy:    dep-da4p5hu7bikc73aaeiq0 (LIVE; finished 2026-08-22T13:05:02.585588Z)
Strict unhold Render deploy:  dep-da4pvcrl550s738l8rmg (LIVE; started 2026-08-22T13:10:11.981036Z)
First helper Netlify deploy:  6a89df45fc9c888f37e8e739 (REJECTED PRE-ACTION; published 2026-08-22T17:41:27.258Z)
Corrected helper deploy:      6a89e2c867e39d41cc630a26 (READY; published 2026-08-22T17:56:25.803Z)
Partial-hold Render deploy:   dep-da50g0v40ujc73aa5i4g (CANCELED 2026-08-22T20:39:55Z; never LIVE)
Full-hold Render deploy:      dep-da50hssaud7c73d3mqeg (LIVE; exact 23971a4d66ee6383c6ad54339e769dbc9a76561e; 3,502/3,502 PASS)
Helper rollback deploy:       6a8a09c13d5e25282f64d2c7 (CURRENT/READY; published 2026-08-22T20:42:43.080Z; removal PASS)
Restored-target cutover:      dep-da51hjvqj5pc73bh8g3g (LIVE; DATABASE_PATH-only; exact 23971a4d66ee6383c6ad54339e769dbc9a76561e; held verification/backup PASS)
```

The broad commits contain the coordinated full-site implementation. The
frontend privacy commit includes the reviewed privacy/documentation follow-up;
the final frontend commit adds the staging-only T-132 physical-eviction/refetch
diagnostic without changing default staging or production UI.
Backend migration commit `a747430...` includes migration-identity and
hosted-test isolation hardening; held backend commit `fe604755...` adds the
narrow staging release-QA credential-rotation safety boundary. Strict-gate
commit `23971a4d...` adds the sidecar, selective-publisher, and strict-recovery
boundaries and is published on `origin/staging`. Its exact held Render deploy
passed before fixture preparation. Final staging artifacts identify the final
commits, not the earlier broad commits.

## Contained Scope

This release implements the approved M7-26 full-site UI review across shared
plain-language presentation, dashboard and team identity, rosters and hockey
lines, Drafts and selected-team Free Agent Draft results, Players and
Auctions, Trades and Future Considerations approval, Matchups, Standings and
contextual result correction, League Activity, Notifications, League Rules,
account navigation, commissioner tools, protected administrator membership,
and atomic commissioner transfer.

The collectible hockey-card interaction remains deferred. The existing
player-detail path remains available. The known signed-Prospect buyout and
pending-`prospect_right`-trade cancellation limitation remains a separate P1
production-promotion follow-up; its current path fails atomically and is not
claimed complete by this release.

## Local Verification

Frontend evidence from the privacy candidate:

- `379/379` unit/component tests passed;
- `45/45` browser-authority tests passed; and
- the exact staging production artifact was built as `index-BqieaRpv.js`,
  `526,755` bytes, SHA-256
  `e8e5049028e41b3977f781441bb11580f0190f2a04d4a1e845af2cb4400fd9c0`.

The artifact embeds frontend build ID
`c119f119ffd4aa96635fe382792e704d535a7cbd`, targets
`https://api-staging.hundoleago.com` for API and Socket traffic, and does not
embed the production API origin.

The subsequent staging-only T-132 diagnostic candidate passed:

- `386/386` tests across `58` files;
- ESLint and dependency inspection;
- browser-authority verification across `20` compatibility cases and `164`
  shipped sources;
- `45/45` Playwright cases across the approved desktop/mobile browser matrix;
  and
- an exact staging build whose JavaScript artifact is `index-CI54gRot.js`,
  `527,839` bytes, SHA-256
  `5b2336e5b1e099ef32747b48124c331495cefad1511e26d244e09d5567460394`.

Netlify deploy `6a89709ffc9c88762ae8e74e` publishes exact frontend build
`0e8eee92e2e323dd7f25ec3112988feaf23f96f0`; all `64/64` remote files matched
at the immutable deploy and canonical staging endpoints. Production remained
untouched.

Backend evidence from the pre-rotation migration candidate under the
workstation environment:

- `443` suites discovered `3,428` tests;
- `3,426` passed;
- `2` Windows link-capability tests were intentionally skipped; and
- `0` failed, cancelled, or remained todo.

The exact held Render build at backend commit
`a747430500fbf6887dd748e5e3dfc0ecee77dc07` then passed the authoritative
hosted Linux gate: `443` suites and `3,428/3,428` tests, with no failures or
skips.

The credential-rotation follow-up produced final backend commit
`fe6047552857376b490756ff63ac593d431ee561`. Its exact held Render build passed
the expanded authoritative hosted Linux gate: `443` suites and `3,440/3,440`
tests, with no failures or skips.

The later frozen release-only components first produced focused local evidence
under exact Node `24.14.1`:

- four-command normal/abort strict recovery: `56/56`;
- accepting-manager selective outbox publisher: `56/56`; and
- syntax and package parsing: pass.

The combined strict-gate candidate then passed its complete local Node
`24.14.1` gate across `443` suites and `3,502` tests: `3,500` passed, the two
Windows link-capability cases were intentionally skipped, and zero failed. The
durable TAP artifact SHA-256 is
`ED2BCC54D252925548658DA95E32E6C5152C8A52AE1681ED5D0388DE6516CCF6`.
Exact commit `23971a4d66ee6383c6ad54339e769dbc9a76561e` is published on
`origin/staging`.

Held Render deploy `dep-da4p5hu7bikc73aaeiq0` of that exact commit finished
`LIVE` at `2026-08-22T13:05:02.585588Z`. Its authoritative hosted
Linux gate passed `3,502/3,502` across `443` suites with zero failures or skips,
and startup remained clean. The exact environment, full-hold flags, provider-
configuration absences and source/persistent-root/inactive-target/private-work/
WAL/SHM boundaries all passed. Public
liveness and readiness returned `200`; session traffic remained blocked at
`503 SERVICE_MAINTENANCE`. These results authorize only the pinned held
preparation step and do not claim live smoke, restore, or activation.

## Held Runtime and Database Identity

The migration and backup sequence ran only against the held dedicated staging
service and this exact database identity:

```text
Database path:       /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3
Persistent root:     /opt/render/project/data/hundo-staging
Environment ID:      test:release-qa
Database ID:         m7-release-qa-fixture
Held backend commit: fe6047552857376b490756ff63ac593d431ee561
Held Render deploy:  dep-da4gkpoed13c739gm0dg
Deploy live at:      2026-08-22T03:21:33Z
```

During the sequence, the full staging maintenance hold was active, league
writes were closed, and scheduled jobs, Free Agent Draft routes, account email
delivery, debug routes, and scheduled backups were disabled. Email remained in
capture mode and live SportsDataIO operation remained disabled. The held final
deploy produced zero post-start application errors. Public liveness and
readiness returned `200`; the session path returned `503 SERVICE_MAINTENANCE`,
confirming ordinary authenticated traffic remained blocked during the
credential operation.

```text
STAGING_MAINTENANCE_HOLD:          true
LEAGUE_WRITE_MODE:                 closed
SCHEDULED_JOBS_ENABLED:            false
FREE_AGENT_DRAFT_ROUTES_ENABLED:   false
ACCOUNT_EMAIL_DELIVERY_ENABLED:    false
DEBUG_ROUTES_ENABLED:              false
EMAIL_DELIVERY_MODE:               capture
SPORTSDATAIO_NHL_LIVE_MODE:        disabled
BACKUP_SCHEDULE_ENABLED:           false
```

## Authority Reconciliation

The reviewed read-only M7-26 authority preview ran before the backup boundary
and again immediately before migration. Both results were identical:

```text
mutationRequired: false
mutation arrays:   6 of 6 empty
```

No authority reconciliation command ran because there was nothing to
reconcile. No administrator membership, commissioner role, team access, or
canonical commissioner pointer was changed by the M7-26 reconciliation
workflow.

## Public FAD Receipt Privacy Scans

The exhaustive read-only public-receipt scanner ran against schema `52` before
migration and schema `54` after migration. Both runs reported:

```text
totalReceipts:            0
T-082 receipts:           0
T-144 receipts:           0
malformedUnsafeReceipts:  0
safeForPublicReplay:      true
readOnly:                 true
SQLite total_changes():   unchanged (delta 0)
Environment ID:           test:release-qa
Database ID:              m7-release-qa-fixture
```

The scanner therefore accounted for every persisted receipt in this staging
database without rewriting immutable evidence. There were no persisted T-082
or T-144 receipts to replay in this fixture; the local automated gates remain
the evidence for constructed legacy full-money projector cases.

## Pre-Migration Backup and Clean Restore

```text
Backup ID:           dd37f2ea-e3d2-4cd2-85bd-fb377431acce
Manifest object key: staging/backups/hundo-leago_staging_20260822T004502647Z_dd37f2ea-e3d2-4cd2-85bd-fb377431acce.manifest.json
Encrypted SHA-256:   23288dbc7da3af994380f2ac99267a68a7b0a91816b03b73cf7a2e66f3877979
Manifest checksum:   4d84ae2e7d9237b394ade54d82c43446e5ce12fe64b14ead20a8850b5ef98fdd
Plaintext SHA-256:    57d6921161207422c7049f141b3de7945a984425e311bf22c689f2d442176725
SQLite integrity:     ok
Foreign-key errors:   0
```

The encrypted offsite artifact verified successfully. A separate clean-restore
verification used the inactive path
`/opt/render/project/data/hundo-staging/backups/HL-20260821-1-clean-restore.sqlite3`
and reproduced the exact plaintext SHA-256 with SQLite integrity `ok` and zero
foreign-key violations. It did not replace the authoritative staging
database.

## Schema Migration

The held database advanced additively and forward-only from schema `52` to
schema `54` after the verified pre-migration backup and distinct clean restore.

```text
Migration result:          {"status":"exact","appliedCount":54,"latestMigrationId":54}
Pre-migration checksum ID: 1979cc016fc1102e0f970940e7b6551a73644b7b94bacbe511202c7ac1111546
Canonical checksum-set ID: 6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
Operations-health ID:     af678f94e25b5fbc8f808c1e525304ebf01a022a52341acc74c410cda4ea0a85
Post-migration integrity:  ok
Foreign-key violations:   0
```

The migration count is the complete ledger count, not a claim that 54 new
migrations ran. Migrations `0053` and `0054` were the only pending migrations
at the recorded source boundary. The canonical migration/preflight/backup
checksum-set ID and the operations-health `migrationChecksumSetId` are
generated by separate defined algorithms, so their different values are
expected and are not a ledger mismatch.

## Post-Migration Backup

```text
Backup ID:           ad6e1aaf-7e20-4c10-9671-30078f7d56a2
Manifest object key: staging/backups/hundo-leago_staging_20260822T004703307Z_ad6e1aaf-7e20-4c10-9671-30078f7d56a2.manifest.json
Encrypted SHA-256:   734e5ab16e60f0f6f5cfde59732e1989403aba163b418524429a4c09996d64db
Manifest checksum:   cb61869ed3a66c245a5ef25709d9bf6613074d328b4cb86f5daccb71e42e8306
Plaintext SHA-256:    bfe2bf5902db22b1ab9166c09ffd8519112db3bd6974856d77936b931745e34c
SQLite integrity:     ok
Foreign-key errors:   0
```

The post-migration encrypted artifact and its decrypted SQLite payload both
verified. This backup is the current schema-`54` staging recovery artifact.
Netlify or Render code rollback does not roll back this database.

## Pre-Credential-Rotation Backup

The held final backend created and verified another encrypted offsite backup
immediately before the first credential write:

```text
Backup ID:           f215cccc-7043-49ad-8e42-443acf036921
Manifest object key: staging/backups/hundo-leago_staging_20260822T032558300Z_f215cccc-7043-49ad-8e42-443acf036921.manifest.json
Encrypted SHA-256:   0e79b2dd78030e748fbfd5537fc6625cde43cdcf0326c10d0789c726f0bc55de
Manifest checksum:   1961f43cc44edd2bf984b6d244f634c4c699f5d6d0706b368126c77ac0069b3c
Plaintext SHA-256:    bfe2bf5902db22b1ab9166c09ffd8519112db3bd6974856d77936b931745e34c
SQLite integrity:     ok
Foreign-key errors:   0
```

Its plaintext SHA-256 matches the verified post-migration backup, proving the
database had not changed between those two protected boundaries.

## Synthetic Release-QA Credential Rotation

The prior shared staging QA password was unavailable. Under the exact held
service, the reviewed staging-only command rotated only the nine synthetic
release-QA accounts and revoked only their active sessions. The safe command
interface was:

```text
Secret input fields: M7_RELEASE_QA_PASSWORD and M7_RELEASE_QA_PASSWORD_CONFIRMATION
Package command: npm run release:qa:credentials:rotate -- --database '/opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3' --environment staging --persistent-root '/opt/render/project/data/hundo-staging' --release-id 'HL-20260821-1' --confirmation 'ROTATE-RELEASE-QA-CREDENTIALS:HL-20260821-1:staging:test:release-qa:m7-release-qa-fixture'
```

No password value appeared in the command arguments, receipt, logs retained in
this record, or documentation.

```text
Receipt ID:             d5e9c784-db5f-42f6-8fcb-1918e93f26c0
Rotated at:             2026-08-22T03:42:18.106Z
rotatedAtMs:            1787370138106
Accounts rotated:       9
Active sessions revoked: 1
First run replayed:     false
First run writeCount:   20
Second run receipt:     d5e9c784-db5f-42f6-8fcb-1918e93f26c0
Second run replayed:    true
Second run writeCount:  0
```

The exact replay proves the operation is idempotent for this release. It did
not change league, team, roster, contract, competition, or production data.

Important operator warning: all nine synthetic release-QA accounts now require
the rotated staging password, and the one prior active synthetic session is no
longer valid. The application retains only password hashes; the replacement
password cannot be recovered from SQLite, the receipt, logs, or this document.
It was required to remain in the operator's approved secret-handling channel.
The later disclosure recorded below invalidates that credential for further
release use; it must not be reused.

## Post-Credential-Rotation Backup

```text
Backup ID:           a958cef3-db7b-445c-8a60-3e8b752aa85a
Manifest object key: staging/backups/hundo-leago_staging_20260822T034316039Z_a958cef3-db7b-445c-8a60-3e8b752aa85a.manifest.json
Encrypted SHA-256:   0c09bf3e1c52d121b8eabf5729ea008b89ec266c70ea9e8c79282a9af61ca197
Manifest checksum:   de38f1cf5fb15a7c70507679971b59c596ab11176d12bcc5efc2f6757f06cb92
Plaintext SHA-256:    9ba315b2c1d8089fa5822a9ff25626a1f2d847ef5629a601d350563681bdbe42
SQLite integrity:     ok
Foreign-key errors:   0
```

The post-rotation backup verified the expected credential, session-revocation,
and audit write boundary while retaining SQLite integrity and zero foreign-key
violations.

## Frontend Staging Publications

The privacy candidate's exact prebuilt artifact was first published to the
dedicated Netlify staging site:

```text
Deploy ID:       6a88f270666a3e6fa778ccc2
Immutable URL:   https://6a88f270666a3e6fa778ccc2--hundoleago-staging.netlify.app
Frontend build:  c119f119ffd4aa96635fe382792e704d535a7cbd
Bundle:          index-BqieaRpv.js
Bundle bytes:    526755
Bundle SHA-256:  e8e5049028e41b3977f781441bb11580f0190f2a04d4a1e845af2cb4400fd9c0
```

Publication occurred while the backend remained under the full staging
maintenance hold. It did not publish or reconfigure the production site.

The later staging-only T-132 diagnostic follow-up was then published:

```text
Deploy ID:       6a89709ffc9c88762ae8e74e
Immutable URL:   https://6a89709ffc9c88762ae8e74e--hundoleago-staging.netlify.app
Canonical URL:   https://staging.hundoleago.com
Frontend build:  0e8eee92e2e323dd7f25ec3112988feaf23f96f0
Bundle:          index-CI54gRot.js
Bundle bytes:    527839
Bundle SHA-256:  5b2336e5b1e099ef32747b48124c331495cefad1511e26d244e09d5567460394
Index SHA-256:   1982ecf04cc456d989f7b42f15f3ced49a5d825df0dedd948deaffe8d8c1adc8
Remote matches:  64/64 at immutable and canonical staging endpoints
```

The diagnostic is available only when the exact `releaseQaT132=1` query flag
is present and `VITE_APP_ENV=staging`. Default staging and production UI are
unchanged. Production was not published or reconfigured.

## Quiescent Deployment and Partial Hosted Smoke

The first unheld-but-quiescent deployment completed on the exact final backend
commit:

```text
Render deploy:       dep-da4hm30jo6nc73d26l80
Backend commit:      fe6047552857376b490756ff63ac593d431ee561
Deploy started:      2026-08-22T03:44:12Z
Deploy live:         2026-08-22T04:32:15Z
Hosted backend gate: 443 suites; 3,440/3,440 passed
Startup errors:      0
```

Public liveness and readiness each returned `200` with the exact `live` and
`ready` state. An anonymous session request returned `401 SESSION_REQUIRED`
with `Cache-Control: no-store` and the dedicated staging CORS contract.

Sequential ordinary-Chrome smoke then proved:

- `Admin`, `Man A Leag A`, and `Man B Leag A` each signed in successfully with
  the rotated staging credential;
- each account displayed its exact expected identity;
- the applicable Alpha League and Gamma League dashboards loaded with zero
  alert banners; and
- each account signed out cleanly before the next account signed in.

Notifications was not opened, so no unread-batch acknowledgement or Previous
notifications claim is made. Free Agent Draft routes remained disabled at this
quiescent boundary, so selected-team monetary privacy, restricted-tie action,
and manager-transfer cache invalidation were not exercised. Those strict
hosted gates remain pending. No split-evidence approval has been given.

## Credential Disclosure and Second Rotation

After the partial hosted smoke, the shared staging QA password was disclosed in
chat. Its value is intentionally absent from this release record and every
canonical document, but the credential must now be treated as compromised.
The first rotation and its backups remain valid historical evidence; they do
not authorize final staging activation with the disclosed password.

Render re-hold deploy `dep-da4j4r49v7es738bkih0` started at
`2026-08-22T05:23:57Z` on exact backend commit
`fe6047552857376b490756ff63ac593d431ee561` and reached `LIVE`, finishing at
`2026-08-22T06:11:11Z`. Its hosted TAP gate passed `3,440/3,440` tests across
`443` suites with zero failed, cancelled, skipped, or todo tests. `npm start`
ran at `2026-08-22T06:11:05Z`, and captured post-start application error logs
were zero.

Those deploy facts do not add an unrecorded health or general runtime-flag
claim. The successful `HL-20260821-2` rotation command itself separately
proved its exact full-hold, database-path, environment/database-identity, and
schema-`54` guards at the command boundary. Under that guarded boundary, the
second credential rotation completed successfully without exposing its
password in project evidence:

```text
Rotation ID:             HL-20260821-2
Accounts rotated:        9
Active sessions revoked: 0
First databaseWriteCount: 19
Receipt event ID:        9152f844-d8cd-42f7-b0d5-b12f530ad618
First command exit:      0
Immediate replayed:      true
Replay databaseWriteCount: 0
Replay command exit:     0
```

The replacement secret remains only in the approved secret-handling channel.
It is absent from command arguments, receipts, logs retained here, and project
documentation.

## Strict Sidecar Restore-Point Backup

The first backup attempt used unapproved reason
`pre-release-qa-fad-privacy-gate` and failed safely with
`BACKUP_INPUT_INVALID` before writing a local or remote backup artifact. The
operator then used approved reason `pre-bulk-operation`. The resulting exact
post-`HL-20260821-2`, pre-fixture backup completed and independently verified:

```text
Backup ID:           adcbbbab-e857-4cae-af71-dbce95553ce5
Manifest object key: staging/backups/hundo-leago_staging_20260822T083634565Z_adcbbbab-e857-4cae-af71-dbce95553ce5.manifest.json
Storage object key:  staging/backups/hundo-leago_staging_20260822T083634565Z_adcbbbab-e857-4cae-af71-dbce95553ce5.sqlite3.gz.enc
Encrypted SHA-256:   ee3a3b375f7bc86b845efd0f12bad69937732e973c1661353876952b2330e115
Manifest checksum:   24898a9e872477cbe4170bea8dc18a8a94016709202e5fad47bd7ca97126a948
Plaintext SHA-256:    cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Migration checksums: 6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
SQLite integrity:     ok
Foreign-key errors:   0
```

This exact manifest is the strict sidecar fixture restore point. It must be
used for the required post-smoke restoration; an older or later manifest is
not an equivalent substitute.

## Strict Hosted Evidence and Restore Contract

Grae explicitly selected the strict hosted-evidence path. The authorized plan
is an isolated sidecar fixture workflow, not a rewrite of Gamma League's
historical records. The exact verified pre-fixture restore point is backup
`adcbbbab-e857-4cae-af71-dbce95553ce5`. The workflow must run the required live
`A -> B -> A` smoke and restore that exact backup afterward.

The frozen four-command recovery family has passed `56/56` focused tests and
the selective accepting-manager outbox publisher has separately passed
`56/56` under exact Node `24.14.1`, plus syntax and package parsing. This is
component evidence only. Their hosted contract is pinned to:

```text
Restore release ID:          HL-20260821-3
Render service:              srv-d9eo2turnols73ekb830 (operator-asserted)
Environment ID:              test:release-qa
Database ID:                 m7-release-qa-fixture
Schema:                      54
Migration checksum set:      6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
Frontend build:              0e8eee92e2e323dd7f25ec3112988feaf23f96f0
Source DATABASE_PATH:        /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema51-aav-20260815T082700Z.sqlite3
Inactive target path:        /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
Activation receipt path:     /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3.activation-receipt.json
Deterministic work directory: /opt/render/project/data/hundo-staging/sqlite/.hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3.strict-restore-work-v1
Backup ID:                   adcbbbab-e857-4cae-af71-dbce95553ce5
```

The combined candidate has now passed its complete gate and is committed and
published at `23971a4d66ee6383c6ad54339e769dbc9a76561e`. Exact held deploy
`dep-da4p5hu7bikc73aaeiq0` recorded matching `APP_BUILD_ID` and
`FRONTEND_BUILD_ID` values and passed every pinned source/root/target/work and
WAL/SHM boundary before the fixture command ran.

### Strict sidecar fixture preparation

Under the still-active full hold, backup
`adcbbbab-e857-4cae-af71-dbce95553ce5` was reverified before the first fixture
write. Its decrypted payload again matched plaintext SHA-256
`cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc`, SQLite
integrity was `ok`, and foreign-key violations were zero.

The pinned `HL-20260821-3` preparation then completed:

```text
First run replayed:       false
First run writeCount:     744
Receipt event ID:         0ed590d8-832a-469a-848e-f91b0b37fe56
Fixture fingerprint prefix: b2ffbc
FAD ID prefix:              0aee0824
Restricted auction prefix:  8efe9f6a
Actionable until:         2026-08-23T07:00:00Z
Window at preparation:    approximately 17.8 hours
Immediate replayed:       true
Replay writeCount:        0
```

The fingerprint/FAD/auction values above are explicitly prefixes because those
are the verified values available in the execution evidence; no full identifier
is invented. The first run created the isolated Gamma Strict Privacy Gate
fixture, and the exact replay proved the release-bound preparation was
idempotent. This is fixture-preparation evidence only: no manager-transfer
proposal, acceptance, selective publication, live privacy/cache smoke, restore,
or activation is claimed.

Controlled-unhold deploy `dep-da4pvcrl550s738l8rmg` of the same exact backend
commit reached `LIVE` and passed `3,502/3,502` hosted tests across `443` suites
with zero failures/skips, clean startup, liveness/readiness, anonymous-session/
CORS/cache behavior, exact controlled-unhold flag/provider/database/build
bindings, and a clean two-minute log watch. Those runtime gates authorized the
strict smoke only; they do not convert its later counter failure into a pass.

### Temporary canonical-origin browser helper (`PHASE ONE REJECTED`)

Grae approved a temporary browser helper solely to perform the already-
authorized strict proposal, acceptance, and selective-publication calls from
the real staging browser sessions. This records authority and the required
verification contract. The first helper publication is recorded below as a
pre-action stop, not a pass. The corrected replacement passed hosted artifact,
header, and initialization gates and executed phase one, but the strict T-132
counter gate rejected the smoke. Helper removal, re-hold completion, abort
restore, and cutover were then entered as recovery gates. Helper removal,
re-hold, abort materialization/replay, restored-target cutover
`dep-da51hjvqj5pc73bh8g3g`, held target verification, and the post-cutover
backup now pass. The strict privacy release remains blocked under the full
hold.

The helper is allowed only as an additive static overlay under
`https://staging.hundoleago.com/release-qa/hl-20260821-3/`. Its only authorized
browser entry point is exact extensionless URL
`https://staging.hundoleago.com/release-qa/hl-20260821-3/strict-manager-transfer`;
an uppercase-path or `.html` redirect is a pre-action failure. It must not
replace or rebuild the application. Before publication and again against the
hosted overlay, verification must prove every original path from audited Netlify
deploy `6a89709ffc9c88762ae8e74e` byte-identical, including:

```text
Frontend build:          0e8eee92e2e323dd7f25ec3112988feaf23f96f0
dist/index.html SHA-256: 1982ECF04CC456D989F7B42F15F3CED49A5D825DF0DEDD948DEAFFE8D8C1ADC8
Main bundle path:        dist/assets/index-CI54gRot.js
Main bundle bytes:       527839
Main bundle SHA-256:     5B2336E5B1E099EF32747B48124C331495CEFAD1511E26D244E09D5567460394
```

The overlay changes the temporary Netlify content digest only. It does not
change the pinned frontend build identity and authorizes no Vite rebuild,
application-source edit, or replacement app bundle. Every helper and marker
response must carry release-specific `Cache-Control: no-store`,
`Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `X-Robots-Tag: noindex, nofollow, noarchive`, and
`Content-Security-Policy: default-src 'none'; base-uri 'none'; connect-src
'self' https://api-staging.hundoleago.com; form-action 'none'; frame-ancestors
'none'; img-src 'none'; object-src 'none'; script-src 'self'; style-src
'self'`. The HTML meta CSP repeats that policy with `object-src 'none'` and
omits only `frame-ancestors 'none'`, which browsers do not apply from a meta
policy. The helper cannot use a separate `netlify.app` origin and cannot change
Render `FRONTEND_BUILD_ID`; the browser cookie and exact Origin contract
require the canonical staging origin and pinned build.

The single response-header authority for the conforming temporary harness is
this exact helper-scoped local deployment block in `netlify.toml`:

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

No helper `_headers` artifact is permitted. The existing global and every
non-helper route header rule remain unchanged; the temporary block is scoped
only to the lowercase release-QA path and is deployment configuration, not
application source or a new frontend build.

After the required static document, script, and style requests, helper
initialization issues zero script-initiated API, fetch, XHR, or WebSocket
requests and performs no write. An explicit session-verification control may
make the credentialed session read. Only within a separately clicked proposal
action, the helper may additionally make exact read-only Team 1 precheck
`GET /api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/teams/ebc815c7-8a41-4326-8faf-04548aa91c76`.
Only within a separately clicked acceptance action, it may additionally make
exact read-only pending-assignment precheck
`GET /api/v1/team-manager-assignments/<exact assignmentId emitted by the proposal>`.
Those state/predecessor checks must fail closed and cannot run during
initialization or in the background. Every POST must be preceded by exact
caller verification, explicit write arming, a separate action click, and a
fresh session/CSRF read. The page offers no sign-in, password, cookie/token
display, Notifications reader, arbitrary endpoint, arbitrary JSON body,
arbitrary idempotency key, background action, or retry.

The helper is a separate action tab in the same cookie jar as the applicable
mounted FAD results page. It constructs an actual isolated TanStack Query
`QueryClient` whose query cache must contain exactly zero FAD queries before,
during, and after every action. It does not mount `RealtimeProvider`, create a
Socket.IO listener, or share the application's QueryClient. The four fixed
operator modes are:

| Mode | Required actor | Exact persistent operations |
| --- | --- | --- |
| `propose-to-b` | Admin `dbc0118a-21f9-408c-abf5-b01d9ca05e64` | Team 1 proposal with key `HL-20260821-3-team1-to-b-propose` |
| `accept-and-publish-to-b` | Manager B `c2684bf0-d30d-4b37-ae14-66620259798e` | acceptance with key `HL-20260821-3-team1-to-b-accept`; publisher fresh call and immediate identical replay with key `HL-20260821-3-outbox-team1-to-manager-b` |
| `propose-to-a` | Admin `dbc0118a-21f9-408c-abf5-b01d9ca05e64` | Team 1 proposal with key `HL-20260821-3-team1-to-a-propose` |
| `accept-and-publish-to-a` | Manager A `e9f723c4-32d2-4823-a1d4-233fe0ce2f45` | acceptance with key `HL-20260821-3-team1-to-a-accept`; publisher fresh call and immediate identical replay with key `HL-20260821-3-outbox-team1-return-to-manager-a` |

Immediately before every POST, including both publisher replays, the helper
must fetch the release activation marker at
`https://staging.hundoleago.com/release-qa/hl-20260821-3/enabled.json` using
`cache: no-store`, `credentials: same-origin`, and `redirect: error`. It fails
closed unless status is `200`, `response.url` is the exact marker URL,
`response.type` is `basic`, media type is `application/json`, and the body has
exactly these keys and values:

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

The helper must fail before any POST at or after exact `expiresAt`
`2026-08-23T07:00:00.000Z`. This hosted marker is independent of the isolated
empty QueryClient.

After strict browser evidence is captured, removal is an exact baseline
redeploy: first remove the temporary helper-scoped `netlify.toml` block and
restore the original configuration, then publish the previously audited
original `dist/` without rebuilding it. Re-prove every original remote
path/hash, verify non-helper routes retain the original global headers, and
verify the helper and marker paths resolve only through the normal SPA
fallback. The fallback's media type and payload cannot satisfy `enabled.json`,
so stale tabs fail closed before another POST. This temporary authority is
staging-only. It changes no production branch, site, service, configuration,
database, credential, DNS record, or traffic.

#### First temporary helper publication - pre-action `STOPPED`

Netlify deploy `6a89df45fc9c888f37e8e739`, titled
`HL-20260821-3-strict-action-helper`, reached ready/published state at
`2026-08-22T17:41:27.258Z`. That fact proves publication only. It is not a
helper acceptance pass and was not used for a persistent action.

At approximately `2026-08-22T17:44Z`, pre-action hosted verification found:

- the originally configured uppercase `.html` request returned `301` with
  `Location: /release-qa/hl-20260821-3/strict-manager-transfer`;
- the lowercase extensionless helper and lowercase `enabled.json` returned
  `200` with their exact published bytes, `Cache-Control: no-store`, and the
  noindex/noarchive policy;
- their response `Content-Security-Policy` and `Referrer-Policy` were the
  global application values rather than the required narrow helper values,
  because the global `netlify.toml` rule overrode the overlay `_headers`
  declarations; and
- the pinned application artifact remained exact, including `dist/index.html`
  SHA-256
  `1982ECF04CC456D989F7B42F15F3CED49A5D825DF0DEDD948DEAFFE8D8C1ADC8` and
  `dist/assets/index-CI54gRot.js` at `527839` bytes with SHA-256
  `5B2336E5B1E099EF32747B48124C331495CEFAD1511E26D244E09D5567460394`.

The strict gate therefore stopped before any proposal, acceptance, publisher
call, publisher replay, or other persistent browser action; zero persistent
browser actions or writes occurred. Deploy `6a89df45fc9c888f37e8e739` is
rejected for action use and supplies no role/privacy/cache smoke evidence. The
conforming replacement had to use the lowercase extensionless URL and marker
plus the single temporary helper-scoped `netlify.toml` header rule above; its
separate evidence follows.

#### Corrected helper publication and phase-one strict rejection

Corrected Netlify deploy `6a89e2c867e39d41cc630a26`, titled
`HL-20260821-3-strict-action-helper-v2`, reached ready/published state at
`2026-08-22T17:56:25.803Z`. Exact hosted verification passed `64` baseline
byte/header gates and `8` helper byte/header gates. The pinned main application
remained unchanged, including `dist/index.html` SHA-256
`1982ECF04CC456D989F7B42F15F3CED49A5D825DF0DEDD948DEAFFE8D8C1ADC8` and
`dist/assets/index-CI54gRot.js` at `527839` bytes with SHA-256
`5B2336E5B1E099EF32747B48124C331495CEFAD1511E26D244E09D5567460394`.

Both browsers reloaded the exact extensionless helper during inert window
`2026-08-22T18:04:01.882Z` through `2026-08-22T18:04:06.741Z`. Render recorded
zero request logs during that window, proving helper initialization did not
reach the API. Both tabs reported `READY` and an actual isolated QueryClient
with query and mutation caches empty. Explicit session verification matched:

```text
Jar X: Admin     dbc0118a-21f9-408c-abf5-b01d9ca05e64
Jar Y: Manager B c2684bf0-d30d-4b37-ae14-66620259798e
```

Every executed phase-one POST passed its fresh-session/current-CSRF,
per-POST activation-marker/expiry, and empty-QueryClient assertions. The Admin
proposal additionally passed the exact Team 1 state/predecessor GET; Manager B
acceptance additionally passed the exact pending-assignment GET. No other
action-time state precheck ran.

The phase-one hosted sequence then recorded:

| Checkpoint | Exact result |
| --- | --- |
| Admin proposal | `201`; assignment `17746270-0706-4420-8efd-2f476dc00c68` |
| Manager A before acceptance | `complete 1/0/0` |
| Manager B before acceptance | `null 1/0/0` |
| Manager B acceptance | `200` |
| Fresh publisher | event `acd9b9e8-9947-4988-8057-579737724869`; `200`; `replayed: false`; `databaseWriteCount: 2`; `schedulerRemainedDisabled: true` |
| Immediate exact replay | same event; `200`; `replayed: true`; `databaseWriteCount: 0` |
| Manager A after settlement | `null 2/1/1` - exact required result, `PASS` |
| Manager B after settlement | `complete 3/1/1` - required `complete 2/1/1`, `FAIL` |

An extra focus-triggered refetch is a plausible explanation for Manager B's
additional load, but it is not proven and does not waive the frozen counter
contract. The strict run therefore entered `STOP`. No return-to-A proposal,
phase-two acceptance, or phase-two publisher call occurred. Notifications was
never opened. The replacement password and every other credential value remain
absent from this record.

The expected recognized abort classification is `to_b_accepted`, with phase
one `published` and return phase `none`. Initial partial-hold deploy
`dep-da50g0v40ujc73aa5i4g` was manually canceled at
`2026-08-22T20:39:55Z` and never reached `LIVE`. The exact full-hold matrix was
then merge-set without changing `DATABASE_PATH`:

```text
STAGING_MAINTENANCE_HOLD:          true
LEAGUE_WRITE_MODE:                 closed
SCHEDULED_JOBS_ENABLED:            false
FREE_AGENT_DRAFT_ROUTES_ENABLED:   false
ACCOUNT_EMAIL_DELIVERY_ENABLED:    false
DEBUG_ROUTES_ENABLED:              false
EMAIL_DELIVERY_MODE:               capture
SPORTSDATAIO_NHL_LIVE_MODE:        disabled
BACKUP_SCHEDULE_ENABLED:           false
```

That merge started replacement full-hold deploy
`dep-da50hssaud7c73d3mqeg` at `2026-08-22T20:39:55Z` on exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e`. It reached `LIVE`, passed the
exact `3,502/3,502` held gate with clean startup, and re-proved every full-hold
runtime value above. Normal restore is not authorized for this incomplete
smoke.

The first strict abort-plan invocation failed closed with
`RELEASE_QA_STRICT_RESTORE_PATH_UNSAFE`. Exact source WAL and SHM sidecars were
present; a read-only process check found zero open file descriptors on the
source or either sidecar. The inactive target was absent. Before any
checkpoint, incident-preservation backup
`44791a01-f62a-4729-b328-d3303bf79a12` verified from exact manifest
`staging/backups/hundo-leago_staging_20260822T213849188Z_44791a01-f62a-4729-b328-d3303bf79a12.manifest.json`
with plaintext SHA-256
`9d36b59a7b2d0d38ef47fc5bc0514a51cb5a754629e3242597b9d4400849a51f`.

The guarded canonical WAL checkpoint then reported:

```text
busy:         0
log:          0
checkpointed: 0
integrity:    ok
foreign keys: 0 violations
schema:       54
WAL sidecar:  absent
SHM sidecar:  absent
```

The next abort plan passed with exact source classification
`to_b_accepted`, phase-one publication `published`, and return publication
`none`. It remained rollback-only and release-blocked. The first execute used
a manually transcribed plan value; it failed safely with
`RELEASE_QA_STRICT_RESTORE_PLAN_MISMATCH` and materialized no target. The plan
values were then extracted byte-for-byte from the saved output rather than
retyped. First execution passed with:

```text
replayed:                     false
authoritative DB mutations:  0
durable filesystem mutations: 2
sourcePreserved:              true
targetVerified:               true
```

Immediate exact replay passed with `replayed: true`, authoritative-database
mutations `0`, durable-filesystem mutations `0`, and no temporary plaintext
restore. Post-checkpoint incident-preservation backup
`fa8c7b2d-04c9-4454-aae4-285673432fb7` verified from exact manifest
`staging/backups/hundo-leago_staging_20260822T214720472Z_fa8c7b2d-04c9-4454-aae4-285673432fb7.manifest.json`
with the same plaintext SHA-256
`9d36b59a7b2d0d38ef47fc5bc0514a51cb5a754629e3242597b9d4400849a51f`.
The identical verified backup hash proves the guarded zero-frame checkpoint
did not change the authoritative database bytes.

With the full hold unchanged, the operator then changed only `DATABASE_PATH`
to the verified inactive target. Exact-backend deploy
`dep-da51hjvqj5pc73bh8g3g` started at
`2026-08-22T21:46:55.442059Z`, built successfully at
`2026-08-22T22:37:16.851Z`, and finished `LIVE` at
`2026-08-22T22:37:35.066844Z` on exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e`. Upload took `1.9s` and
compression `0.2s`. The hosted gate ran `443` suites and passed all
`3,502/3,502` tests with zero fail/cancel/skip/todo in
`3006420.142708ms`.

New instance `srv-d9eo2turnols73ekb830-qx9zx` ran `npm start` at
`2026-08-22T22:37:29.025Z`, became live at `2026-08-22T22:37:35.170Z`, and
recorded zero error logs through `2026-08-22T22:38:46Z`. Public live and ready
checks each returned `200`, `Cache-Control: no-store`, and `{status:'ok'}`.
Fresh-shell configuration evidence was exact:

```text
APP_BUILD_ID:                     23971a4d66ee6383c6ad54339e769dbc9a76561e
FRONTEND_BUILD_ID:                0e8eee92e2e323dd7f25ec3112988feaf23f96f0
DATABASE_PATH:                    /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260821-3.sqlite3
STAGING_PERSISTENT_ROOT:          /opt/render/project/data/hundo-staging
APP_ENV:                          staging
NODE_ENV:                         production
Environment ID:                  test:release-qa
Database ID:                     m7-release-qa-fixture
STAGING_MAINTENANCE_HOLD:         true
LEAGUE_WRITE_MODE:                closed
SCHEDULED_JOBS_ENABLED:           false
FREE_AGENT_DRAFT_ROUTES_ENABLED:  false
ACCOUNT_EMAIL_DELIVERY_ENABLED:   false
DEBUG_ROUTES_ENABLED:             false
EMAIL_DELIVERY_MODE:              capture
SPORTSDATAIO_NHL_LIVE_MODE:       disabled
BACKUP_SCHEDULE_ENABLED:          false
```

The read-only temporary-copy verifier had scratch SHA-256
`5f7de38f2673d3bb4c7d2b086b5d699afab1d173aceb86298d6e40eacb48b77f`
and returned code `HL_POST_CUTOVER_TARGET_VERIFIED`. It reported
`authoritativeDatabaseOpened: false` and authoritative-database mutations `0`.
The exact verification result was:

```text
Source preserved SHA-256:   859eda97cd4c55724907abb5cd91f8dd741dd4cab9f9543df8942a1e2310ee05
Target SHA-256:             cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Activation-receipt SHA-256: 009227a315708be575d553eb39d72797c6f18824f0cd63b6a95580d026cb67bb
Source WAL/SHM sidecars:    absent
Target WAL/SHM sidecars:    absent
Receipt kind:               abort
Restore mode:               aborted-strict-smoke-rollback
Derived plan:               verified
Source state:               to_b_accepted / published / none
Semantic chain completed:   false
Smoke completed:            false
Hosted smoke completed:     false
Release blocked:            true
Rollback only:              true
Integrity:                  ok
Foreign-key violations:     0
Schema/data-model version:  54
Applied migrations:         54
Migration checksum set:     6032a48eb5126eff1bfa371937c3a086cb629bdbebaddfcb912cb4bb4799ff89
Environment ID:             test:release-qa
Database ID:                m7-release-qa-fixture
Credential-rotation receipt: 9152f844-d8cd-42f7-b0d5-b12f530ad618
Active sessions:            0
Strict fixture:             absent (league 60c82aa0-54f9-4c93-83f5-73b0d6d6f63e; receipt 0ed590d8-832a-469a-848e-f91b0b37fe56; transfer chain)
Temporary copy:             removed
```

Post-cutover backup `2044fcae-24e8-4392-a1ac-4064d9cd2807` then passed from
manifest
`staging/backups/hundo-leago_staging_20260822T224011048Z_2044fcae-24e8-4392-a1ac-4064d9cd2807.manifest.json`:

```text
Encrypted SHA-256: cee039557278c41f59fa9d6a5b09cf4f69f1b9f3589cb3774420ef34be255162
Manifest checksum: 08e3d3bde81843a683017d9952b30e02dd02978181a8644323cfbd590eca2ac8
Verify status:     verified
Plaintext SHA-256: cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
Integrity:         ok
Foreign keys:      0
```

A fresh-shell anonymous-session request returned `503`,
`SERVICE_MAINTENANCE`, and `Cache-Control: no-store`. Abort restoration,
`DATABASE_PATH`-only cutover, held target re-verification, and post-cutover
backup are `PASS`. The exact Manager B `3/1/1` counter failure still blocks the
privacy release. The full hold remains active; this record does not authorize
reopening, completion, or archive transition.

The helper rollback submitted the exact sealed baseline plus restored original
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
physical `.html` path also fell back. The retired marker is `text/html` and
non-JSON, so a stale helper fails closed before its next POST. Helper removal
is `PASS`.

### Strict hosted selective-publication contract

The global scheduler stays disabled throughout the controlled unhold. Enabling
it would start unrelated workers and could mutate Gamma League, so it is not
an approved way to publish the manager-assignment events. The only approved
publication operation is the in-process release-only route:

```text
POST /api/v1/operations/release-qa/strict-manager-outbox
```

It mounts only on the pinned source path with the exact release/environment/
database, schema/checksum/frontend/deployed-backend, season `2026`, NHL
`20262027`, and open-smoke bindings. The full hold is false, league writes and
FAD routes are open, while scheduled jobs, account-email delivery, debug
routes, scheduled backups, and SportsDataIO live/import operation remain
disabled or absent; email stays in capture mode. Under the full hold the target
runtime/route is not composed and the maintenance server returns
`503 SERVICE_MAINTENANCE`. With hold false, the restored target or binding
drift leaves the route unmounted and returns `404`.

The fixture identities are:

```text
League:       60c82aa0-54f9-4c93-83f5-73b0d6d6f63e
Team 1:       ebc815c7-8a41-4326-8faf-04548aa91c76
Team 2:       b43e5c7f-0585-46d9-b71c-596c3c024b66
Admin:        dbc0118a-21f9-408c-abf5-b01d9ca05e64
Commissioner: 6d31c7c9-e636-440f-98f5-4fdf82a758f0
Manager A:    e9f723c4-32d2-4823-a1d4-233fe0ce2f45
Manager B:    c2684bf0-d30d-4b37-ae14-66620259798e
```

Both proposals are direct Admin browser API calls to
`POST /api/v1/leagues/60c82aa0-54f9-4c93-83f5-73b0d6d6f63e/teams/ebc815c7-8a41-4326-8faf-04548aa91c76/manager-assignment`
with exact body `{ "userId": "c2684bf0-d30d-4b37-ae14-66620259798e" }` for
Manager B and later
`{ "userId": "e9f723c4-32d2-4823-a1d4-233fe0ce2f45" }` for Manager A. Each
acceptance is a direct call by that proposed manager to
`POST /api/v1/team-manager-assignments/<assignmentId emitted by proposal>/accept`
with exact body `{}`. Their fixed `Idempotency-Key` values, in order, are:

```text
HL-20260821-3-team1-to-b-propose
HL-20260821-3-team1-to-b-accept
HL-20260821-3-team1-to-a-propose
HL-20260821-3-team1-to-a-accept
```

Every unsafe call uses credentialed cookies, the current session's
`X-CSRF-Token`, an allowed staging Origin, compatible browser fetch metadata,
and JSON content type. After each acceptance, the accepting manager invokes
the publisher from a separate action tab in the same cookie jar and a separate
QueryClient:

| Phase | Caller | Confirmation | Publisher `Idempotency-Key` |
| --- | --- | --- | --- |
| `team1-to-manager-b` | Manager B | `PUBLISH-HL-20260821-3-TEAM1-TO-MANAGER-B` | `HL-20260821-3-outbox-team1-to-manager-b` |
| `team1-return-to-manager-a` | Manager A | `PUBLISH-HL-20260821-3-TEAM1-RETURN-TO-MANAGER-A` | `HL-20260821-3-outbox-team1-return-to-manager-a` |

Each body contains exactly four keys: `backendBuildId` set to the exact
deployed `APP_BUILD_ID`, that row's `confirmation`, its `phase`, and
`releaseId: "HL-20260821-3"`. Fresh success
uses the canonical Socket.IO publication path, changes the target outbox row
exactly twice for claim then publication, and reports
`databaseWriteCount: 2` plus `schedulerRemainedDisabled: true`. Gamma, Team 2,
job state, and unrelated outbox rows remain unchanged. Exact already-published
replay is zero-write.

The frozen hosted browser contract required two independent cookie jars. It is
retained as the exact rejection comparator and does not authorize phase-two
resumption after `STOP`:

1. Record environment, database, and fixture prechecks under the full hold.
   After controlled unhold, Jar X signs in as Admin, performs Admin role/privacy
   prechecks, proposes Team 1 to Manager B, signs out, and Manager A signs in.
   Manager A opens Team 1 results with `?releaseQaT132=1` and keeps that exact
   component mounted through both publications. Settled initial A is offer
   `complete`, loads/evictions/successful refetches `1/0/0`.
2. Jar Y signs Manager B in and opens Team 1 results plus the diagnostic before
   acceptance. Settled initial B is `null`, `1/0/0`. B accepts, then calls the
   phase-one publisher from a separate Jar-Y action tab. After settlement,
   persistent A is `null`, `2/1/1`; B is `complete`, `2/1/1`; and the original
   T-132 Query object has been removed and replaced.
3. Jar Y signs B out, signs Admin in to propose Team 1 back to A, signs Admin
   out, signs B back in, and remounts Team 1 before A accepts. Fresh B is
   `complete`, `1/0/0`; persistent A remains `null`, cumulative `2/1/1`.
4. A accepts, then calls phase two from a separate Jar-X action tab. After
   settlement, persistent A is `complete`, cumulative `3/2/2`; remounted B is
   `null`, `2/1/1`. B is not reported cumulatively across sign-out/remount.

Every settled checkpoint is `state=loaded` and `fetchStatus=idle`; transient
pending/refetching is allowed only while the event settles. T-131 and T-140
must independently refetch and flip complete offer/action versus null/no-
action; the T-132 diagnostic alone proves physical cache replacement. Evidence
must not persist money or raw HTTP/Socket.IO payloads.

If either publisher call fails, crashes, or leaves `failed` or `publishing`,
there is no publisher retry. The operator immediately restores the full hold,
preserves the exact state, blocks the release, and selects abort recovery.

### Four-command strict recovery contract

The exact full command forms, manifest/storage identities, hashes, and full-
hold configuration are recorded in Backup and Restore. The four package
commands are:

```text
release:qa:strict-restore:plan
release:qa:strict-restore:execute
release:qa:strict-restore:abort:plan
release:qa:strict-restore:abort:execute
```

The normal pair is permitted only after the full smoke above completes and
both exact publisher rows are `published` once with attempt `1`, row version
`3`, non-null publication time, null error, exact payload/audience, unchanged
Team 2, and no auction bid, resolution, allocation, or allocation-event drift.
The abort pair is the rollback-only
path from exactly one recognized incomplete/failed source state:

| Classification | Required source boundary | Phase one | Return | `sourceSemanticChainCompleted` |
| --- | --- | --- | --- | --- |
| `prepared_only` | Initial fixture only | `none` | `none` | `false` |
| `to_b_pending` | Exact B proposal, idempotency, and one delivered notification; no acceptance/publication | `none` | `none` | `false` |
| `to_b_accepted` | B accepted | `pending`, `publishing`, `failed`, or `published` | `none` | `false` |
| `return_to_a_pending` | Phase one published; exact A proposal, idempotency, and one delivered notification | `published` | `none` | `false` |
| `return_to_a_accepted` | Phase one published; A accepted | `published` | `pending`, `publishing`, `failed`, or `published` | `true` |

The `publishing` cases explicitly include a publisher-process crash after
claim. Every abort output/receipt reports
`restoreMode: aborted-strict-smoke-rollback`, `smokeCompleted: false`,
`hostedSmokeCompleted: false`, `releaseBlocked: true`, and
`rollbackOnly: true`. Any other or inconsistent source fails closed; no manual
SQL repair or generic restore is allowed. Normal and abort plan IDs,
confirmations, and receipts cannot cross modes.

Either selected plan mode must report:

```text
authoritativeDatabaseMutationCount: 0
durableFilesystemMutationCount:     0
temporary plaintext work:           performed, private, then removed
Render environment changed:         false
external activation required:       true
```

Calling either plan read-only would be misleading: each verifies a temporary
plaintext restoration inside its deterministic private `0700` work directory,
then proves cleanup. Any pre-existing directory, including abrupt-termination
residue, fails closed for manual review under the hold. The service argument
is checked against the release contract but does not independently prove the
Render shell's provider identity; the operator must record that check.

The first successful normal or abort execute may create only the inactive
target and its mode-specific receipt, reports zero authoritative-database
mutations, preserves the old source, and leaves the target inactive. Exact
replay must report `replayed: true`, zero authoritative-database and durable-
filesystem mutations, no temporary plaintext work, no object-store request,
and no encryption-key resolution. A verified receipt with an absent target is
the only partial-publication state that may resume after work-area review; a
target without its receipt fails closed.

The materializer never changes Render configuration or deploys. After execute
and replay evidence pass, the operator separately changes only
`DATABASE_PATH` to the pinned target and redeploys the exact backend under the
full hold. The old source remains preserved as evidence. Post-handoff checks
must prove target hash, identity, schema, checksum, integrity, foreign keys,
second rotation, zero active sessions, and absence of the sidecar league,
fixture receipt, and transfer chain before a verified incident-preservation
backup and fresh controlled activation. On the target deploy the selective
publisher route must be absent. Account email stays disabled with
`EMAIL_DELIVERY_MODE=capture` until an explicit restored-outbox reconciliation
decision and evidence authorize any delivery or allowlist change.

Fixture preparation, controlled-unhold runtime gates, corrected helper hosted
gates, phase-one proposal/acceptance, and the exact fresh-plus-replay publisher
results now pass. The combined strict smoke does not: Manager B's settled
counter mismatch blocks the release and makes normal restore ineligible.
Re-hold, exact abort plan/execute/replay, and pre-/post-checkpoint incident-
backup verification pass. External activation deploy
`dep-da51hjvqj5pc73bh8g3g`, held target re-verification, and the post-cutover
backup also pass. The full hold remains active; fresh controlled reopening and
privacy acceptance remain `PENDING`. Nothing in this draft claims the workflow
is complete. Helper removal separately passes. This contract authorizes no
generic, in-place, or production restore.

## Pending Completion Gates

The following are intentionally not claimed complete. Strict held deploy
`dep-da4p5hu7bikc73aaeiq0` and fixture preparation are recorded above with
their exact evidence. Controlled-unhold deploy, corrected helper hosted gates,
phase-one execution, and helper removal are also recorded above. The counter
failure is a hard release blocker; phase two must not resume.

- `PASS`: full-hold deploy `dep-da50hssaud7c73d3mqeg` reached `LIVE` on exact
  commit `23971a4d66ee6383c6ad54339e769dbc9a76561e`, passed `3,502/3,502`,
  and re-proved the full maintenance-hold runtime;
- `PASS`: strict abort plan/execute and exact replay accepted only
  classification `to_b_accepted`, phase one `published`, return `none`,
  remained rollback-only/release-blocked, materialized the verified target
  with zero source-database mutations and two durable files, and replayed with
  zero mutations;
- `PASS`: independently verified incident-preservation backups bracketed the
  guarded zero-frame WAL checkpoint and had identical plaintext SHA-256
  `9d36b59a7b2d0d38ef47fc5bc0514a51cb5a754629e3242597b9d4400849a51f`;
- `PASS`: the external `DATABASE_PATH` handoff changed only that setting;
  held restored-target deploy `dep-da51hjvqj5pc73bh8g3g` passed its complete
  `3,502/3,502` hosted gate, runtime identity and full-hold checks, read-only
  source/target/receipt/integrity/identity/fixture verification, and fresh
  verified post-cutover backup `2044fcae-24e8-4392-a1ac-4064d9cd2807`;
- `PENDING`: the full hold remains active and controlled reopening has not
  begun;
- `PENDING`: the remaining authenticated desktop and narrow-mobile hosted
  acceptance must cover Notifications and every strict selected-team FAD tie
  and manager-transfer privacy/cache gate applicable after restoration; the
  rejected partial smoke above does not satisfy them;
- `PENDING`: final staging runtime flags and the deliberately restored job,
  route, and account-email state must be recorded and observed without
  duplicate work or delivery; the fixture-specific FAD route state must be
  explicitly restored, the selective publisher route must be absent on the
  target, and email must remain disabled/capture unless restored-outbox
  reconciliation is explicitly decided and evidenced;
- `PENDING`: fresh post-restore activation using only the replacement
  credential must pass health, basic role smoke, and the controlled job/route
  reopening sequence;
- `PENDING`: final hosted errors/traffic observation and rollback identities
  must be recorded; and
- `PENDING`: Current State, Active Roadmap, Testing Strategy, Backend Endpoint
  Checklist, Release Checklist, documentation index, and the M7-26 work-plan
  archive transition must be closed only after the gates above pass.

Until those items finish, M7-26 remains active and this record remains a draft.

## Production Boundary

No production branch, service, Netlify site, Render service, environment
variable, secret, disk, database, schema, job, email, DNS record, or traffic
was changed. Production promotion, any production authority repair, and any
production migration remain separate explicit decisions for Grae.
