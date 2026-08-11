# Hundo Leago - Deployment

## Document Status

`APPROVED`

This technical specification defines:

* how frontend and backend changes move from focused work through staging to production;
* branch, CI, build, publish, database, maintenance, health, smoke, and rollback gates;
* safe coordination between Netlify, Render, SQLite, API compatibility, Socket.IO, jobs, email, and backups;
* release evidence, authority, failure handling, and emergency deployment boundaries;
* technical deployment decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the deployment decisions and approved adoption of the resulting design on 2026-07-18.

---

## Technical Purpose

Hundo Leago uses:

```text
Frontend: React + Vite on Netlify
Backend:  Node.js + Express + Socket.IO on Render
Storage:  SQLite on one Render persistent disk
```

The frontend and backend live in separate repositories and may need to change together.

A successful build is not enough to prove a safe release. A deployment must also preserve:

* frontend/backend contract compatibility;
* SQLite schema and data compatibility;
* one authoritative store;
* exact environment isolation;
* secure cookies, CORS, CSRF, and Socket.IO;
* scheduled-job and outbox idempotency;
* backup and recovery;
* production authority.

This document defines that controlled path.

---

## Out of Scope

This specification does not:

* deploy either repository;
* merge, commit, or push a branch;
* create Netlify or Render resources;
* change an environment variable or secret;
* migrate, reset, restore, reseed, or overwrite production data;
* grant production authority;
* replace the Release Checklist or Manual QA Checklist;
* replace feature-specific implementation plans;
* make a code rollback equivalent to a database rollback.

Every real deployment still requires a contained release plan and the applicable checklist.

---

# Part 1 - Authority and Required Documents

## Required Reading

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/08-operations/BACKUP_AND_RESTORE.md
```

The approved `MANUAL_QA_CHECKLIST.md` and `RELEASE_CHECKLIST.md` become mandatory execution records when their roadmap gates are reached.

Environment Setup owns environment topology and configuration names. SQLite Migration owns schema and JSON-to-SQLite cutover. Backup and Restore owns recovery artifacts. API Contracts owns compatibility. This document owns release movement and ordering.

---

## Operating Mode

Reviewed mode:

```text
OFFSEASON_RESET
```

Local and staging deployment work may be planned and performed when requested.

Production changes require explicit production authority even while the league is in an off-season reset.

---

## Production Authority

Grae provides the explicit approval to deploy production.

The operator may prepare:

* a release candidate;
* staging deployments;
* test evidence;
* a release record;
* exact production commands;
* rollback commands.

Preparation is not production authority.

The operator stops before the first production-changing action unless Grae has explicitly authorized that release.

---

# Part 2 - Reviewed Current State

## Repositories and Branches

```text
Frontend and docs repository: hundo-leago
Current docs branch:          docs/summer-2026-foundation

Backend repository:           hundo-leago-backend
Current refactor branch:      stage2

Target production branch:     main in each repository
Target staging branch:        staging in each repository
```

`stage2` and `docs/summer-2026-foundation` are work branches. They do not deploy production merely because their changes are ready locally.

---

## Current Package Commands

Reviewed frontend commands:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

Reviewed backend commands:

```powershell
npm start
npm run dev
npm test
npm run test:characterization
npm run check
```

The approved Testing Strategy adds focused frontend, backend, and browser commands as implementation proceeds.

---

## Current Configuration Gaps

At review time, the copied repository manifests did not include:

```text
.node-version
netlify.toml
render.yaml
```

The approved Environment Setup requires Node `24.14.1` and explicit deployment configuration.

Those files are introduced through focused implementation plans. This document does not create them.

---

# Part 3 - Deployment Environments

## Environment Mapping

| Environment | Frontend | Backend | Data | Deployment source |
| --- | --- | --- | --- | --- |
| Local | Vite dev server | Local Node process | Disposable local data | Current focused branch |
| Test | Test runner or Playwright server | Test child process | Unique temporary data | Checked-out commit |
| Staging | Dedicated Netlify staging site | Dedicated Render staging service | Staging-only disk and SQLite | `staging` |
| Production | Dedicated Netlify production site | Dedicated Render production service | Production-only disk and SQLite | `main` |

Staging and production share no mutable resource or secret.

---

## Deployment Context Policy

Netlify:

* production site uses `main`;
* staging site uses `staging`;
* deploy previews may build focused branches;
* preview origins receive no backend access automatically.

Render:

* production service is linked to backend `main`;
* staging service is linked to backend `staging`;
* the production service remains one instance while SQLite and its disk are authoritative;
* each service has its own persistent disk and environment group or variables.

---

# Part 4 - Build and Publish Policy

## Reproducible Inputs

Every release identifies:

```text
frontend commit SHA
frontend lockfile SHA-256
backend commit SHA
backend lockfile SHA-256
Node version
build commands
schema version
migration checksum-set ID
frontend environment identity
backend environment identity
```

Uncommitted files are not deployment inputs.

An unrelated dirty working tree blocks creation of a release commit until its scope is separated.

---

## Dependency Installation

Hosted builds and CI use:

```powershell
npm ci
```

`npm install` is not a release command.

A changed lockfile is reviewed, tested, and recorded.

---

## Frontend Build

Target Netlify build:

```powershell
npm ci
npm run build
```

Publish directory:

```text
dist
```

Required pre-publish checks:

```powershell
npm run lint
npm test
npm run build
```

When the focused Playwright gate applies:

```powershell
npm run test:e2e
```

The production build requires the approved `VITE_` configuration and embeds no secret.

---

## Backend Build and Start

Target Render build:

```powershell
npm ci
npm run check
npm test
```

Target start:

```powershell
npm start
```

The build phase does not:

* open the persistent SQLite database;
* run a migration;
* import JSON;
* create a backup;
* execute scheduled jobs;
* send email;
* change league data.

Render persistent disks are runtime-only, so disk operations belong to the controlled runtime maintenance procedure.

---

## Infrastructure Configuration

Target committed safe configuration:

```text
hundo-leago/netlify.toml
hundo-leago/.node-version
hundo-leago-backend/render.yaml
hundo-leago-backend/.node-version
```

`netlify.toml` owns:

* build and publish paths;
* SPA redirects;
* safe security headers;
* non-secret context configuration.

`render.yaml` may own:

* service runtime;
* build and start commands;
* health-check path;
* disk mount declaration;
* secret placeholders;
* safe non-secret environment names.

The existing Render service is not placed under Blueprint control until a staging comparison proves that applying the Blueprint will not replace, detach, resize, or misconfigure the production disk or service.

Secret values remain in managed provider configuration.

---

# Part 5 - Continuous Integration

## Pull-Request Gate

Affected repositories must pass the Testing Strategy gate before merge.

Frontend gate:

```text
clean install
lint
unit/component tests
production build
focused browser tests when applicable
documentation checks when docs change
```

Backend gate:

```text
clean install
syntax check
unit tests
characterization tests when compatibility behavior is touched
repository/service/contract/integration tests when applicable
migration and recovery tests when applicable
documentation checks when docs change
```

Required checks may not be bypassed with a successful manual click-through.

---

## Staging Auto-Deployment

Target staging behavior:

* Render deploys the `staging` branch only after CI checks pass;
* Netlify builds and publishes the dedicated staging site's `staging` branch;
* a failed build does not replace the last successful staging release;
* staging smoke begins only after both expected commit SHAs are live.

If either repository is intentionally unchanged, the release record identifies the existing compatible staging commit.

---

## Production Manual Publication

Production is not published automatically from an ordinary merge.

Approved controls:

* Render production auto-deploy is `Off`;
* Render deploys one explicitly selected backend commit SHA;
* Netlify production auto-publishing is locked during release preparation;
* Netlify builds the production branch, then an operator publishes the exact approved deploy;
* production is unlocked only when the release policy deliberately permits later publishing.

This prevents an unrelated later commit from replacing a selected release or rollback.

---

# Part 6 - Release Types

## D0 - Documentation Only

Applies when only documentation changes and no hosted build input, environment, or runtime behavior changes.

Requirements:

* documentation validation;
* repository review;
* normal merge process.

No Netlify or Render deployment is required.

---

## D1 - Frontend Only

Applies when:

* backend contract is unchanged or already supports the new frontend;
* no backend environment or schema change exists.

Order:

1. verify against current and target backend;
2. stage frontend;
3. run frontend and browser gates;
4. publish frontend;
5. run read-only smoke.

---

## D2 - Backend Only, No Schema Change

Applies when:

* frontend remains compatible;
* SQLite schema and data format are unchanged.

Order:

1. stage backend;
2. run contract and integration gates;
3. create the required fresh backup;
4. deploy backend;
5. verify readiness and compatibility;
6. run read-only smoke.

---

## D3 - Additive API or Schema Change

Preferred cross-repository release shape:

```text
expand backend/schema -> deploy compatible backend -> deploy frontend
-> observe -> retire old contract in a later release
```

The expansion must remain compatible with the currently published frontend.

Schema cleanup, column removal, endpoint removal, or changed response meaning does not occur in the same release.

---

## D4 - Data Migration or Authority Change

Applies to:

* JSON-to-SQLite cutover;
* destructive or transforming schema migration;
* bulk import;
* season reset;
* authority transfer between stores.

This release requires:

* explicit maintenance window;
* current verified backup;
* staging rehearsal;
* deterministic migration plan and report;
* separate production authority;
* write freeze and paused jobs;
* first-write rollback boundary;
* post-migration backup.

The exact JSON-to-SQLite sequence remains owned by `SQLITE_MIGRATION.md`.

---

## D5 - Emergency Code Release

An emergency release repairs a current production incident with the smallest verified change.

It still requires:

* incident ID;
* exact commits and diff;
* focused automated test;
* staging or equivalent isolated reproduction when technically possible;
* current backup when data risk exists;
* explicit production authority;
* smoke and rollback evidence.

Emergency does not authorize:

* unrelated cleanup;
* hidden data repair;
* skipped identity or league-isolation checks;
* destructive Git commands;
* an unverified database restore.

---

# Part 7 - Compatibility and Release Ordering

## Backend Expansion First

When both repositories change, the normal order is:

1. additive database migration when required and compatible;
2. backward-compatible backend expansion;
3. frontend cutover;
4. observation period;
5. backend compatibility retirement in a later focused release.

The old frontend must remain usable after step 2.

The new frontend must be able to report a clear compatibility error rather than corrupt state if it reaches an unexpected backend.

---

## API Compatibility

Before a target endpoint replaces a compatibility endpoint:

* current behavior is characterized;
* target contract tests pass;
* frontend uses the target endpoint;
* Socket.IO invalidation refetches the target resource;
* staging has compatibility fallback disabled;
* no remaining caller uses the old write;
* rollback ordering is recorded.

`POST /api/league` remains until every ordinary broad-write caller is gone.

---

## Build Compatibility

The frontend and backend expose safe build identifiers.

The release record defines:

```text
minimum supported frontend build
maximum tested frontend build
minimum supported backend build
maximum tested backend build
API contract version
schema version
```

Normal requests do not fail solely because build IDs differ when the contract is compatible.

---

## Long-Lived Browsers

Netlify publishing is atomic, but an already open browser may continue running an older JavaScript bundle.

Therefore:

* backend expansion remains compatible with at least the immediately previous published frontend;
* removed capabilities return stable errors;
* the frontend refetches after Socket.IO reconnect;
* unrecoverable build skew shows a reload prompt;
* a stale page cannot bypass server authorization or version checks.

---

# Part 8 - Database and Migration Deployment

## No Automatic Migration

The backend never applies SQLite migrations:

* during `npm ci`;
* during the Render build;
* during ordinary startup;
* during an HTTP read;
* from a Netlify build;
* from a scheduled feature job.

Startup fails closed when the database migration ledger is incompatible.

---

## Migration Execution

Production migration uses the approved runtime database path under an exclusive maintenance window.

The migration command:

```powershell
npm run db:migrate -- --database <approved-database-path>
```

must:

* validate `APP_ENV` and database identity;
* verify the exact pending migration set and checksums;
* require explicit production confirmation;
* acquire the approved SQLite write lock;
* run deterministically without a network call;
* commit each approved migration according to SQLite Migration;
* stop on any error;
* produce an access-controlled report.

The production work plan supplies the real path through managed configuration. It is not pasted into public logs or documentation.

---

## FAD Live-Provider Capability Gate

The live matchup-statistics credential is dedicated and never falls back to
the staging-import credential. Deployed configuration sets
`SPORTSDATAIO_NHL_LIVE_MODE` to exactly `disabled`, `probe`, or `required`,
uses an independent generated
`SPORTSDATAIO_NHL_LIVE_CAPABILITY_SECRET`, and keeps the signed artifact at
`SPORTSDATAIO_NHL_LIVE_CAPABILITY_ARTIFACT` beneath the validated persistent
root. The staging canonical path is
`/opt/render/project/data/hundo-staging/provider-capability/sportsdataio-live-v1.json`.

FAD-18 uses a schema-agnostic maintenance-hold bridge, then one read-only
discovery gate and a two-stage activation of the exact final candidate:

1. deploy the full backend bridge commit before the real provider manifest
   exists, against the existing schema-22 disk path, with deployed
   `STAGING_MAINTENANCE_HOLD=true`; the exact hold prerequisites are staging
   application identity, production Node mode, closed league writes, disabled
   jobs, FAD routes, account-email delivery, debug routes, and backup schedule,
   capture-only email, and provider `probe` mode;
2. verify the bridge exposes only generic GET/HEAD liveness and readiness plus
   the provider's attached-service shell; it must not import or open the
   database runtime or compose application routes, jobs, Socket.IO, or email;
   shell reachability is an external operator/provider check, and hold
   readiness means only that the maintenance process is listening, not that the
   application or database is ready;
3. from that disk-backed shell, with the isolated schema-22 database quiesced,
   use the dedicated paid live key to run exactly
   `npm run data:discover:sportsdataio-live:staging -- --historical-date YYYY-MM-DD`;
   do not prefix or override `STAGING_MAINTENANCE_HOLD` for the command:
   discovery must inherit the bridge's deployed exact `true` value; the command
   requires and rechecks a sidecar-free guarded source, copies its main file to
   a private OS-temporary snapshot, verifies source/copy identity and SHA-256,
   and opens only the copy read-only with `fileMustExist` and `query_only`; it
   closes and removes the copy before sanitized output and fails without output
   on any source drift or cleanup failure;
4. have the operator review that output and commit its exact sanitized manifest
   as `config/provider-capability/sportsdataio-live-probe-v1.json`;
5. run `npm run release:candidate:preflight` against the exact final candidate,
   whose Blueprint default is `STAGING_MAINTENANCE_HOLD=false`; a missing,
   untracked, invalid, season-mismatched, or build-omitted manifest, or a
   Blueprint that still enables the hold, stops candidate activation;
6. deploy that exact final commit and build once with the persisted service
   hold still set to `true` against the old schema-22 path; verify the same
   health-only surface before any disk mutation, so every backup and import
   command runs from the final release source rather than the auxiliary bridge;
7. while that exact final build remains in hold, create and independently verify
   a backup of the old schema-22 database, then run
   `npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <absolute-distinct-clean-restore-path>`;
   record the previously absent clean-restore path and passed result, leave that
   path inactive, and only then build the approved reset/import into a different,
   previously absent schema-49 database path; never migrate, replace, or open
   the old path with the FAD runtime;
8. record both paths and database identities, backup identity, import and
   schema-49 evidence, selected activation path, and the path-and-build rollback
   pair;
9. point the service at only the verified new database path and redeploy the
   same exact final commit and build with
   `STAGING_MAINTENANCE_HOLD=false` in provider `probe`,
   keeping scheduled jobs, FAD routes, league writes, email delivery, and the
   application live adapter disabled;
10. from the paid web service's Dashboard Shell or SSH session, where the
   attached disk is available, run the zero-argument
   `npm run data:check:sportsdataio-live:staging` command to publish the signed
   artifact; it must reject before manifest, provider, artifact, or output work
   unless Node mode is production, persisted hold is `false`, writes are
   closed, jobs, FAD routes, account email, debug routes, and backup schedule
   are disabled, and email is capture-only;
11. while the deployed service remains in `probe`, run the zero-argument
    package interface once from that disk-backed shell with the exact
    per-process invocation
    `SPORTSDATAIO_NHL_LIVE_MODE=required npm run data:verify:sportsdataio-live:staging`;
    it is staging-only, requires that same hold-false normal-probe boundary
    before artifact read, and does not persist or change the deployed service
    mode;
12. change only the deployed service's live mode from `probe` to `required` and
    restart or redeploy the same commit and build identity;
13. before database open, startup independently re-verifies the artifact's
    digest, HMAC, credential binding, environment, build, origin, configured
    season, probe-manifest digest, issue time, and fixed 24-hour expiry; and
14. verify health and safe capability status before enabling any remaining FAD
    route or scheduled-job gates.

Do not run the discovery or provider check in a Render build command,
pre-deploy command, or Render one-off job because those contexts do not have
the required service database and attached disk. The independent verifier is a
one-off command in the disk-backed service shell, not a Render one-off job and
not a persistent service-mode change. Do not put the provider check in the
start command: provider failure must not replace deterministic artifact
verification or make a disk-backed candidate unavailable during a deployment.
An unavailable endpoint, credential, database, required semantic, manifest, or
operator blocks FAD-18. None of these tools enables a fallback, persists a raw
provider body, changes shared league data, or weakens database safeguards.

The artifact is published atomically on the persistent disk with an exclusive
owned lock, mode-0700 directory, mode-0600 same-directory temporary file,
file and directory fsync, atomic rename, and post-rename verification. A failed
replacement preserves the previous valid artifact. Symlinks, path escapes,
concurrent publication, truncation, noncanonical JSON, or a forged artifact
fail closed.

The version-controlled input manifest is distinct from that signed runtime
artifact. The operator-reviewed discovery output supplies the exact manifest;
the exact release must contain it Git-tracked at
`config/provider-capability/sportsdataio-live-probe-v1.json`, bound to configured
season `20262027`, probe season `20252026`, and the approved expected-game,
no-due-game, no-team, and historical zero-stat observations. A missing,
untracked, invalid, season-mismatched, or build-omitted manifest blocks FAD-18.
Synthetic test evidence cannot replace the paid-source observation.

---

## Free Agent Draft Schema 22-49 Transition

The Free Agent Draft migrations `0023` through `0049` and the schema-49
runtime form one indivisible deployment boundary from the shared schema-22
baseline.

Migration `0027` backfills audiences for existing league realtime events. An
old process left running after that backfill could create a new league event
without an audience. Migrations `0028` through `0047` add the final-standings,
lifecycle-transition, FAD decision, recovery, auction, rollover, and completion
evidence that the same runtime requires. Migrations `0048` and `0049` require
the canonical realtime and setup-exemption publications atomically. Conversely,
the new runtime requires schema `49`, writes each league event and its audiences
atomically, and refuses to publish an event without a stored audience.
Therefore:

* do not apply any of `0023` through `0049` piecemeal to a shared environment;
* do not deploy the FAD runtime before schema `49`;
* do not leave the prior runtime accepting writes after the migration begins;
* do not reopen writes, jobs, or outbox publication between migration and
  deployment of the exact verified runtime;
* do not treat a code-only rollback as compatible with schema `49`.

The FAD-18 staging transition uses a fresh-path reset/import instead of an
in-place migration. The persistent-disk bridge deploy stops the old instance
before the new hold-only instance starts, so no prior process remains connected
to the disk. The bridge leaves both database paths unopened by the service
while the following controlled sequence runs:

1. Record the existing schema-22 database path and identity, bridge commit and
   deploy ID, and prior build rollback identity.
2. Keep deployed `STAGING_MAINTENANCE_HOLD=true` and verify the exact hold
   prerequisites and health-only surface.
3. Run discovery from the attached-service shell with the inherited deployed
   hold value, review and commit the manifest, and pass release preflight for a
   final candidate whose Blueprint hold default is `false`.
4. Deploy that exact final commit and build with the persisted service hold
   still `true` against the old schema-22 path, and re-prove the health-only
   surface before any disk mutation.
5. Create and independently verify a current backup of the untouched schema-22
   database. Before reset/import, run
   `npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <absolute-distinct-clean-restore-path>`
   against a previously absent clean path distinct from both database paths;
   record the path and successful result and leave it inactive.
6. Use the approved staging reset/import flow from that held final build to
   create a new schema-49 database at a distinct, previously absent path
   beneath the isolated
   persistent root. The old schema-22 file and sidecars remain untouched; the
   default FAD-18 activation path does not run `db:migrate` against them.
7. Without leaving the hold, complete the exact
   [Closed-Write Reset Evidence Handoff](FREE_AGENT_DRAFT.md#closed-write-reset-evidence-handoff):
   independently verify the pristine import; publish the reset/import
   verification artifact; run the first-platform-administrator bootstrap; run
   the reset-original-league bootstrap; commit and post-commit verify the exact
   reset migration report; then initialize the new database's deployed
   environment identity. Use the exact pinned-Node interfaces, typed
   confirmations, and protected inputs in that section; none may be reordered
   or omitted.
8. Before starting the final runtime, verify the contiguous
   base-22-to-target-49 source (`49` migrations, `27` post-base) and
   checksum-set SHA-256
   `6df4e827296ef3e63a143fb932f557b410511813ea421177afb7908fda15d636`;
   then verify the migration ledger, schema `49`, `131` application tables
   (`132` including `schema_migrations`),
   `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, required row-count
   reconciliation, the `131`-entry application repository catalog with SHA-256
   `89b4eb536aef7c4c6d1519c5311f94c449109a55d8b71d130e5b952a157b49ff`, `49`
   post-reset require-empty tables with policy SHA-256
   `52d2d5ba6faaad9cc877132ad0153d8e52665b8aa0ae05394b685c9e48267808`, `82`
   signed-reset-policy table
   classifications, all `76` immutable-delete guards, one
   league audience for every existing league event, no audience for
   global/account/security/email events, null deduplication keys on existing
   notifications, and no fabricated FAD state.
9. Record the new database path and identity, exact succeeded import/migration
   report, reconciliation and verification artifacts, and the explicit
   activation and rollback path-and-build pairs.
10. Change `DATABASE_PATH` to only the verified new path, set deployed
   `STAGING_MAINTENANCE_HOLD=false`, and deploy and start only the exact backend
   artifact verified against schema `49` in provider `probe`, keeping writes,
   jobs, FAD enablement, email delivery, and the application live adapter
   closed.
11. From the disk-backed service shell, run and review the zero-argument
   `npm run data:check:sportsdataio-live:staging` provider command to publish the
   sanitized signed artifact and prove controlled omission without changing
   shared league data. Then run the zero-argument package interface once as
   `SPORTSDATAIO_NHL_LIVE_MODE=required npm run data:verify:sportsdataio-live:staging`
   while the deployed service itself remains in `probe`. This per-process
   staging-only invocation does not persist or change the service mode. Both
   commands reject before provider, manifest, or artifact I/O unless the
   persisted hold is `false` and every normal-probe write/job/FAD/email/debug/
   backup-schedule gate remains quiesced with capture-only email.
12. Change only the deployed service's provider mode from `probe` to `required`
     and restart or redeploy the same commit and build. Startup must
     independently re-verify the artifact before database open and compose
     exactly one live adapter.
13. Verify liveness, readiness, database identity, safe capability status,
    writer composition, and audience-enforcing publication. An audience-less
    league event must emit nothing and enter its safe retryable failure state.
14. Verify league, team, and user-room delivery across two isolated leagues,
    including delivery-time suppression of a user whose active membership
    ended after the event was created.
15. Reconcile pending and interrupted outbox work, then deliberately resume
    outbox publication, remaining jobs, and league writes in that order.
16. Record the first accepted post-transition write and verify that its event
    and audience committed together.
17. Create and independently verify the post-transition staging backup.

Before the first accepted post-transition write, rollback restores the
recorded old schema-22 path and exact prior backend artifact together; the
verified pre-change backup remains the recovery artifact. After that write,
rollback requires a forward-compatible corrective artifact or a verified
database restore with external-effect reconciliation; the prior backend must
not be started against schema `49`.

An in-place schema-22-to-49 `db:migrate` path is excluded from FAD-18 unless
that command first gains and passes mandatory isolated persistent-root
enforcement. This exclusion does not weaken the requirement to verify the
complete migration source and exact schema-49 result.

This section authorizes no staging or production action by itself. FAD-18
requires its own release record and staging authority.
Production remains unauthorized and requires a separate explicit decision.

---

## Persistent-Disk Constraint

The Render disk:

* is accessible only to the attached service at runtime;
* is unavailable during build and pre-deploy commands;
* is unavailable to a separate one-off job;
* prevents multiple service instances;
* prevents zero-downtime deployment: Render stops the existing instance before
  bringing up the replacement so two versions cannot access the same disk.

The deployment plan must account for that interruption and record the stopped
old instance and replacement deploy identities. See the current
[Render persistent-disk limitations](https://render.com/docs/disks#disk-limitations-and-considerations).

Migration is not moved into a pre-deploy command to make the release appear automatic.

---

## First-Write Boundary

Before the first authoritative SQLite write after JSON cutover, rollback may reactivate the verified original authority under the SQLite Migration plan.

After the first authoritative SQLite write:

* do not switch back to stale JSON;
* do not dual write;
* use a forward correction or verified database restore;
* reconcile external effects explicitly.

The release record states when this boundary was crossed.

---

## Destructive Schema Changes

Destructive cleanup is delayed until:

* every deployed application version ignores the old field or table;
* the immediately previous backend can safely run without it or is no longer an approved rollback;
* the retention window has passed;
* a verified backup exists;
* staging rehearsal passes;
* a separate release is approved.

Expand and contract are never collapsed into one production deployment.

---

# Part 9 - Pre-Deployment Release Record

## Release Identity

Each release receives:

```text
HL-YYYYMMDD-N
```

where `N` is a sequence for that UTC date.

The release ID is not derived from a league or team name.

---

## Required Record

The release record contains:

```text
releaseId
releaseType
requestedBy
approvedBy
operator
frontend commit and deploy ID
backend commit and deploy ID
Node version
lockfile hashes
environment identities
schema version and migration checksum-set ID
API contract version
database ID suffix
backup ID
staging evidence
automated test evidence
manual QA evidence
open known risks
maintenance window
deployment order
smoke commands
rollback commands
first-write boundary
startedAt
completedAt
outcome
```

Secret values and raw production data are excluded.

---

## Preflight

Production preflight proves:

* both worktrees and release commits are understood;
* no unrelated change is included;
* required CI checks passed on exact commits;
* staging runs the intended commits;
* staging environment identity is not production;
* production environment-name inventory is complete;
* Node, lockfiles, build commands, and start command match the plan;
* API and schema compatibility are documented;
* latest backup is verified and within the required RPO;
* staging restore drill is current;
* disk space is sufficient;
* jobs, outbox, email, and statistics state are understood;
* exact CORS, cookie, CSRF, and Socket.IO checks are prepared;
* rollback is valid for the release type;
* Grae's production approval is recorded.

---

# Part 10 - Staging Deployment Procedure

## Procedure

1. Record frontend and backend source commits.
2. Confirm both repositories pass CI.
3. Merge or promote the focused backend commit to `staging`.
4. Wait for the Render staging deploy after CI.
5. Verify backend build ID, environment identity, schema compatibility, liveness, and readiness.
6. Run any approved staging migration explicitly.
7. Merge or promote the focused frontend commit to `staging`.
8. Wait for the Netlify staging deployment.
9. Verify frontend build ID and configured backend origin.
10. Run the Backend Endpoint Checklist for affected endpoints.
11. Run deployed CORS, cookie, CSRF, Socket.IO, and two-league isolation tests.
12. Run affected Playwright workflows.
13. Run provider, email, job, and backup scenarios when applicable.
14. Complete focused manual QA.
15. Record deploy IDs, commands, results, and defects.

Staging failure is fixed in a focused branch and redeployed. It is not accepted as a production exception without explicit risk review.

---

# Part 11 - Production Deployment Procedure

## Phase A - Prepare

1. Create the release record.
2. Identify the release type.
3. Confirm exact frontend and backend commits.
4. Confirm staging evidence and required checklists.
5. Confirm production configuration by variable name and version, not secret value.
6. Confirm schema and API compatibility.
7. Confirm the rollback path and first-write boundary.
8. Verify the current encrypted offsite backup.
9. Create a fresh pre-deploy backup when required.
10. Lock Netlify auto-publishing.
11. Confirm Render production auto-deploy is off.
12. Obtain explicit production authority.

---

## Phase B - Enter Maintenance When Required

Maintenance is required for:

* JSON-to-SQLite cutover;
* schema or data migration requiring exclusive access;
* environment or disk changes;
* restore;
* bulk correction;
* any release that cannot preserve write compatibility.

Procedure:

1. announce the approved window;
2. enable Render maintenance mode;
3. place application writes in maintenance state;
4. pause jobs, auction resolution, email, and outbox dispatch;
5. verify no in-flight mutation remains;
6. create or reconfirm the pre-change backup;
7. record the maintenance start.

Netlify may show a release-specific maintenance page, but the backend remains authoritative for blocking writes.

---

## Phase C - Database Step

When the release has no database change, record:

```text
No database migration required.
```

When it has a migration:

1. run migration plan;
2. compare planned IDs and checksums with the release record;
3. run the approved migration;
4. verify ledger, integrity, foreign keys, identity, and reconciliation;
5. retain the report;
6. stop on any discrepancy.

Initial JSON-to-SQLite cutover follows its longer approved sequence instead.

---

## Phase D - Backend

1. Trigger Render deployment of the exact approved backend commit.
2. Confirm the intended commit and build log.
3. Confirm the expected Node version and `npm ci`.
4. Wait for the disk-backed service restart.
5. Verify minimal liveness.
6. Verify readiness, environment identity, build ID, schema version, and scheduler state.
7. Keep writes and jobs closed until the smoke gate.
8. Verify the old published frontend remains contract-compatible.

Do not proceed to the frontend when backend readiness or compatibility fails.

---

## Phase E - Frontend

1. Identify the exact successful Netlify deploy for the approved frontend commit.
2. Confirm build environment and public configuration.
3. Confirm no secret-like value appears in built assets or build logs.
4. Publish that atomic deploy.
5. Confirm the production domain serves the expected deploy ID.
6. Confirm the frontend targets the approved backend origin.
7. Confirm SPA navigation and static assets.

---

## Phase F - Smoke and Reopen

While writes remain closed:

* load frontend assets;
* verify public liveness and readiness;
* verify approved public metadata and public roster;
* verify authenticated session bootstrap;
* verify one representative authorized read per affected feature;
* verify two-league denial;
* verify Socket.IO authentication and room scope;
* verify no private path, secret, or active bid is exposed;
* verify read-only requests do not change domain state.

Then:

1. enable outbox and email deliberately;
2. resume scheduled jobs with occurrence reconciliation;
3. reopen writes;
4. record the first authoritative post-release write;
5. cross the first-write boundary only when accepted;
6. disable maintenance mode;
7. monitor errors, latency, jobs, backups, email, and Socket.IO;
8. create and verify a post-migration backup when applicable;
9. complete the release record.

---

# Part 12 - Health and Smoke Contracts

## Public Health

```text
GET /api/v1/health/live
GET /api/v1/health/ready
```

Public health contains no:

* filesystem path;
* database filename;
* secret;
* private league state;
* raw error stack.

Readiness checks the ability to serve safely, including database and schema compatibility.

---

## Authenticated Operations Health

```text
GET /api/v1/operations/health
```

The platform administrator verifies safe operational values:

```text
environment
frontend and backend build IDs
schema version
database identity suffix
scheduler state
last verified backup
last valid statistics refresh
outbox health
```

---

## Production Smoke Is Read-Only

Automated production smoke does not:

* create an account;
* change a roster;
* place a bid;
* propose a trade;
* execute a job;
* send a real email;
* create or restore a backup;
* reset or repair data;
* add fake activity.

An authorized real-user action after launch is separate evidence.

---

# Part 13 - Rollback

## Rollback Decision

Rollback begins when:

* backend readiness fails;
* error rate or latency crosses the approved threshold;
* authentication, authorization, or league isolation fails;
* data reconciliation differs;
* a migration checksum is unexpected;
* jobs, auctions, matchups, email, or outbox duplicate;
* the frontend cannot use the backend;
* private information is exposed;
* the release cannot be made safe within the approved window.

---

## Frontend Rollback

Netlify rollback publishes the previously verified atomic deploy.

Procedure:

1. keep publishing locked;
2. select the exact prior deploy ID from the release record;
3. publish it;
4. verify its backend compatibility;
5. run read-only smoke;
6. record the rollback.

A later Git-triggered deploy must not overwrite the rollback automatically.

---

## Backend Rollback

Render rollback selects the exact prior successful deploy or commit.

Before rollback, verify that the prior backend can safely use:

* the current environment configuration;
* the current SQLite schema;
* the current data;
* the current frontend.

The persistent disk is not rolled back with backend code.

If schema or data is incompatible, use:

* a forward corrective release; or
* the approved Backup and Restore procedure.

Do not blindly roll back code against a changed database.

---

## Configuration Rollback

Configuration changes have their own before/after record.

Code rollback is not assumed to restore:

* current provider settings;
* domain or DNS changes;
* disk configuration;
* environment-group linkage;
* secret rotation;
* CORS origins;
* email mode.

Restore configuration deliberately and redeploy or restart only as documented.

---

## Database Rollback

Database rollback follows:

* SQLite Migration before the first-write boundary; or
* Backup and Restore after the first-write boundary.

Never:

* copy a live WAL database file casually;
* restore a disk snapshot as the normal SQLite recovery;
* reactivate stale JSON after new SQLite writes;
* reverse a committed migration with improvised SQL;
* erase the current failed state before preserving evidence.

---

# Part 14 - Socket.IO, Jobs, Email, and External Effects

## Socket.IO

Deployment may disconnect clients.

The client must:

* reconnect with the current session;
* reauthorize room membership;
* refetch authoritative HTTP data;
* clean up old listeners;
* show a reload prompt on unrecoverable build skew.

No feature depends on uninterrupted Socket.IO delivery for correctness.

---

## Graceful Shutdown

On `SIGTERM`, the backend:

1. stops accepting new connections;
2. marks readiness false;
3. stops scheduling new work;
4. allows in-flight HTTP mutations to finish within the approved timeout;
5. releases or expires job leases safely;
6. flushes committed operational logs;
7. closes Socket.IO and SQLite;
8. exits.

Forced termination must not produce a partially committed transaction.

---

## Scheduled Jobs

After deploy:

* durable occurrence IDs remain unchanged;
* a restarted scheduler does not repeat completed work;
* stale leases are recovered deliberately;
* missed occurrences are evaluated once;
* auction and matchup jobs do not resolve twice;
* schedule enablement matches the environment.

---

## Email and Outbox

During a maintenance release:

* dispatch pauses before data migration;
* committed outbox records remain durable;
* restart resumes eligible records idempotently;
* no account or league email is generated merely by deployment;
* staging never sends unrestricted production email.

Provider delivery evidence is used when a retry outcome is ambiguous.

---

# Part 15 - Security and Secret Changes

## Secret Rotation

Secret rotation is a release operation when it affects runtime behavior.

The plan defines:

* old and new version identifiers;
* dual-read window when required;
* activation order;
* session or token revocation;
* backup-key retention;
* rollback limitations.

Secret values never appear in the release record.

---

## Browser Security

Staging and production deployment verification proves:

* exact credentialed CORS;
* expected Origin rejection;
* secure session-cookie attributes;
* CSRF enforcement;
* security headers and CSP;
* no sensitive data in URLs;
* no private caching;
* no debug routes in production.

---

# Part 16 - Monitoring

## Release Watch

Minimum monitored signals:

* HTTP error rate and latency;
* process restarts;
* readiness;
* SQLite busy and transaction failures;
* disk use;
* failed login and rate-limit anomalies;
* Socket.IO connections and authorization failures;
* scheduled job delay, overlap, and failure;
* outbox backlog and email failures;
* NHL refresh status;
* backup age and failures.

---

## Observation Window

A production release remains under active observation for at least:

```text
60 minutes
```

and through the next affected scheduled-job boundary when the release changes jobs, auctions, matchups, rollover, or backups.

The release may be technically complete while its extended job observation remains an owned follow-up.

---

# Part 17 - Failed Deployments

## Build Failure

When a build fails:

* do not retry with changed commands without a new reviewed plan;
* preserve logs;
* determine whether source, lockfile, runtime, configuration, or provider state caused it;
* fix on a focused branch;
* rerun CI and staging.

---

## Partial Cross-Repository Release

If backend succeeds but frontend fails:

* keep the backward-compatible backend;
* do not remove old endpoints;
* repair and republish the frontend or roll back the backend if schema-compatible.

If frontend publishes but backend fails:

* immediately republish the previous frontend unless the new frontend safely handles the old backend;
* keep writes closed when behavior is uncertain.

---

## Stop Conditions

Deployment stops when:

* production authority is missing;
* exact commits or deploy IDs are ambiguous;
* required CI or staging evidence is missing;
* staging and production resource isolation cannot be proved;
* the latest backup is outside the required RPO;
* restore rehearsal is missing for a data-risking release;
* migration checksums differ;
* schema compatibility is unknown;
* unrelated changes are included;
* secret-like data appears in source, logs, or browser assets;
* maintenance cannot block writes;
* job or outbox duplication cannot be prevented;
* rollback is invalid and no forward-recovery plan exists;
* production smoke would require disposable writes.

The operator reports the blocker. They do not weaken the gate.

---

# Part 18 - Completion Criteria

A deployment is complete when:

* exact frontend and backend commits and deploy IDs are recorded;
* the expected Node, lockfiles, configuration identities, API, and schema are live;
* required migrations and reconciliation pass;
* frontend and backend compatibility passes;
* CORS, cookies, CSRF, Socket.IO, and league isolation pass;
* read-only production smoke passes;
* jobs, outbox, email, NHL refresh, disk, and backups are healthy;
* maintenance is disabled only after the reopen gate;
* the first-write boundary is recorded when applicable;
* rollback remains documented;
* the observation window has an owner;
* no unexplained data change occurred;
* the release record is complete.

---

# External Platform References

Current provider behavior must be re-checked at release time:

* [Render deploys](https://render.com/docs/deploys)
* [Render health checks](https://render.com/docs/health-checks)
* [Render maintenance mode](https://render.com/docs/maintenance-mode)
* [Render rollbacks](https://render.com/docs/rollbacks)
* [Render persistent disks](https://render.com/docs/disks)
* [Netlify deploy overview and contexts](https://docs.netlify.com/deploy/deploy-overview/)
* [Netlify deploy management, locks, and rollbacks](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/)

Provider capability does not override Hundo Leago's release authority or database safeguards.

---

# Verification

Documentation verification:

```powershell
Get-Content docs/04-technical-specs/DEPLOYMENT.md
Select-String -Path docs/04-technical-specs/DEPLOYMENT.md -Pattern '^`APPROVED`$','Production Manual Publication','No Automatic Migration','First-Write Boundary','Production Deployment Procedure','Backend Rollback'
```

Future release-candidate verification:

```powershell
# Frontend repository
npm ci
npm run lint
npm test
npm run build

# Backend repository
npm ci
npm run check
npm test
```

Expected:

* checks run against the exact recorded commits;
* staging uses separate resources;
* no production mutation occurs without explicit authority;
* documentation-only creation of this specification deploys nothing.
