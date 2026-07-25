# M7 Hosted Staging Acceptance

## Status

`READY FOR GRAE MANUAL ACCEPTANCE`

Production remains `NO-GO`. This record does not authorize a production
reset, migration, deploy, traffic change, job activation, or merge to `main`.

## Exact Candidate

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

## Provider Evidence

The hosted verifier intentionally did not trigger an NHL refresh. Operations
health reported a last-valid 2026-27 statistics refresh. Provider failure
containment and last-valid preservation remain covered by the full automated
suite. A focused live NHL refresh is still a manual/provider gate.

Email remains capture-only. Scheduled jobs remain disabled.

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

## Remaining Manual Gates

* Grae's hosted browser acceptance using the manual website test guide;
* staging offsite object-storage upload and encrypted clean restore after the
  staging-only provider target is reviewed;
* a focused live NHL provider smoke if Grae chooses to authorize it.

Production remains blocked pending Grae's separate staging acceptance and
separate explicit production authorization.
