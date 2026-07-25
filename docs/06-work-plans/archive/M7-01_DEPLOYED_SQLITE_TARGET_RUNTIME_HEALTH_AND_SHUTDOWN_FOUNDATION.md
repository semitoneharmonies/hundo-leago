# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M7-01
```

## Work Item

```text
Deployed SQLite Target Runtime, Health, and Shutdown Foundation
```

# Objective

Replace the deployment entrypoint's legacy JSON composition with the completed
SQLite target application composition while keeping compatibility behavior
available only to its existing focused tests and tools. Add the public liveness
and readiness contracts, an authenticated platform-operations health contract,
and deterministic graceful shutdown required before an integrated staging
release can exist.

# Authority

Grae requested continued implementation of M7 through its launch gate on
2026-07-22. The approved roadmap and release specifications authorize this
small local implementation step.

This plan does not authorize a commit, push, provider change, staging deploy,
data import, reset-manifest application, migration, production deploy,
production traffic change, secret change, job enablement, or production write.

# Reviewed Starting State

* M6 is complete locally with its full backend and frontend gates passing.
* All seven required M7 release documents exist and are approved.
* `npm start` still launches `createCompatibilityRuntime` against file-backed
  JSON and starts compatibility background jobs.
* `render.yaml` still checks the compatibility `/health` route even though the
  approved release contract requires `/api/v1/health/live` and
  `/api/v1/health/ready`.
* `createTargetRuntime` composes the completed SQLite application but its
  convenience opener intentionally permits only local and test databases.
* No deployed target-runtime opener, release health router, or target process
  entrypoint exists.

# Scope

## Backend implementation

1. Add a target-runtime deployment configuration boundary that validates:
   * environment and build identity;
   * absolute database and persistent-root paths;
   * migrations directory and expected season identity;
   * explicit scheduler and maintenance state;
   * the already approved security configuration.
2. Add a deployed target-runtime opener that accepts only `staging` or
   `production`, proves the database is inside that environment's persistent
   root, and checks the immutable migration ledger without applying migrations.
3. Add minimal public liveness and readiness routes. Public responses expose no
   filesystem path, database filename, secret, private league state, or raw
   stack.
4. Add authenticated platform-administrator operational health with safe
   environment, build, schema, database-identity suffix, scheduler, statistics,
   outbox, and verified-backup state. Missing optional operational evidence is
   reported as unavailable, not invented.
5. Add the target process entrypoint and graceful shutdown state. Readiness
   becomes false before the server, Socket.IO, email worker, and SQLite close.
6. Preserve the legacy compatibility entrypoint for its existing focused
   characterization and test helpers; it must not remain the deployment start
   command.
7. Point the staging Blueprint health check at target readiness and keep all
   job flags disabled.

## Focused verification

Add tests proving:

* deployed opening fails closed for local/test, unsafe paths, missing identity,
  and incompatible or unapplied migrations;
* build/start/GET paths never apply a migration or mutate league state;
* liveness is minimal and readiness reflects startup/shutdown state;
* operational health requires an authenticated platform administrator and
  redacts paths and secrets;
* `SIGTERM` ordering makes readiness false before resource closure;
* the compatibility characterization helper still uses isolated temporary JSON;
* `render.yaml` names the target readiness route and keeps staging jobs off.

# Files Expected to Change

```text
hundo-leago-backend/server.js
hundo-leago-backend/server-compatibility.js
hundo-leago-backend/package.json
hundo-leago-backend/render.yaml
hundo-leago-backend/src/bootstrap/createTargetHttpServer.js
hundo-leago-backend/src/bootstrap/createTargetRuntime.js
hundo-leago-backend/src/bootstrap/openDeployedTargetRuntime.js
hundo-leago-backend/src/config/loadTargetRuntimeConfig.js
hundo-leago-backend/src/transport/http/createOperationsHealthRouter.js
hundo-leago-backend/src/transport/http/createPublicHealthRouter.js
hundo-leago-backend/test/helpers/startCompatibilityServer.js
hundo-leago-backend/test/foundation/targetDeploymentRuntimeFoundation.test.js
hundo-leago-backend/test/foundation/renderStagingBlueprint.test.js
```

The exact implementation may use fewer files. Any additional file must be
directly required by this objective and recorded at completion.

# Safety Boundaries

* No migration is applied by build, start, health, or `GET`.
* No existing SQLite or JSON data is used in verification.
* Every database test uses a unique temporary root.
* Production opening requires explicit `APP_ENV=production`, but tests do not
  open a production database or use a production path.
* Scheduler, email dispatch, auctions, matchups, and other external-effect jobs
  remain disabled in this step.
* Public health never reveals database paths or private state.
* The existing production service, disk, data, branches, and authority remain
  unchanged.

# Completion Gate

M7-01 is complete only when:

* `npm start` is the fail-closed SQLite target runtime entrypoint;
* compatibility startup is explicit and no longer the deployment default;
* public live/ready and authenticated operations health contracts pass;
* deployed opening never applies migrations and rejects an incompatible ledger;
* graceful shutdown ordering passes;
* the focused suite, complete backend suite, and JavaScript syntax checks pass;
* protected JSON and reset-manifest hashes are unchanged;
* no generated database artifact or extra server process remains;
* documentation records actual evidence and activates only the next bounded M7
  step.

# Next Step Boundary

After M7-01, the next dependency-safe M7 plan may implement explicit
maintenance/write closure and controlled scheduler, outbox, and email startup.
It may not deploy or import data merely because this runtime foundation passes.

# Completion Evidence

Completed locally on `2026-07-22`.

Implemented:

* immutable deployed target configuration with exact environment, database,
  frontend/backend build, season, path, port, integration, job, debug, and
  security values;
* hosted-staging and production persistent-root guards without weakening the
  existing isolated M2 staging-import path;
* existing-file, exact-migration, exact-environment-identity deployed opening
  with no implicit database creation, identity initialization, or migration;
* minimal public live/ready endpoints and authenticated platform-administrator
  operational health;
* readiness transitions tied to listen and shutdown;
* one idempotent SIGTERM/SIGINT shutdown path;
* SQLite target `npm start` with explicit legacy JSON compatibility startup;
* staging Render readiness and required target variable declarations.

Verification:

```text
Focused deployment/runtime/Render/compatibility gate: 40/40 passed
Affected import/cutover regression gate:               26/26 passed
Complete backend suite:                                 837/837 passed across 225 suites
Backend JavaScript syntax:                              394/394 parsed under Node 24.14.1
Unconfigured target start:                              exited 1 with safe generic record
Protected players.json SHA-256:                         C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1
Reset-manifest SHA-256:                                  0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491
Generated database artifacts:                           0
Additional Node processes:                              0
```

No provider configuration, staging data, production data, deployment, commit,
push, migration, import, reset, traffic, or job authority changed.
