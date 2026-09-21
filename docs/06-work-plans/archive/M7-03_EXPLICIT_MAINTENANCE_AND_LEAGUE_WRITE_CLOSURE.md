# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M7-03
```

## Work Item

```text
Explicit Maintenance and League-Write Closure
```

# Objective

Add an explicit deployed write mode that can keep all league-domain mutations
closed while public/authenticated reads, health, and the minimum session
operations needed for closed-mode smoke remain available. The gate must run
before any domain handler and must never turn a blocked request into a write.

# Authority and Boundary

Grae requested continued M7 implementation on `2026-07-22`. This plan
authorizes local code and temporary-database verification only.

It does not authorize changing a provider variable, restarting a hosted
service, entering a real maintenance window, migrating, importing, resetting,
deploying, committing, pushing, enabling jobs, or opening production writes.

# Scope

1. Add required `LEAGUE_WRITE_MODE` configuration with exact values `closed`
   and `open`; no boolean or fallback coercion is allowed.
2. Add a centralized target HTTP gate that, while closed:
   * permits every GET/HEAD read to reach its normal authentication and
     authorization boundary;
   * permits only sign-in and sign-out session mutations needed for safe closed
     authenticated smoke;
   * rejects every other POST/PUT/PATCH/DELETE target endpoint before its
     router/service call;
   * returns an exact safe `503 LEAGUE_WRITES_CLOSED` response for an approved
     browser origin;
   * leaves disallowed-origin requests to the normal security boundary.
3. Report the configured mode through authenticated operational health.
4. Keep staging Blueprint startup closed by default.
5. Prove closed requests create no database, activity, outbox, job, email, or
   Socket.IO effect; prove open mode preserves existing behavior.

# Expected Files

```text
hundo-leago-backend/render.yaml
hundo-leago-backend/src/application/services/operations/createLeagueWriteGate.js
hundo-leago-backend/src/application/services/operations/createRuntimeHealthService.js
hundo-leago-backend/src/bootstrap/createTargetRuntime.js
hundo-leago-backend/src/config/loadTargetRuntimeConfig.js
hundo-leago-backend/test/foundation/targetMaintenanceFoundation.test.js
hundo-leago-backend/test/foundation/renderStagingBlueprint.test.js
```

# Completion Gate

M7-03 is complete only when focused closed/open/read/origin/session/no-write
tests pass, the complete backend suite and syntax checks pass, protected hashes
and runtime baselines remain unchanged, and documentation records exact
evidence.

# Completion Evidence

Completed locally on `2026-07-22`.

* Focused maintenance, configuration, Render Blueprint, and target deployment
  tests passed `39/39`.
* The complete backend suite passed `845/845` across `227` suites under Node
  `24.14.1`.
* JavaScript syntax checks passed `399/399`.
* `git diff --check` passed.
* Protected `players.json` and reset-manifest hashes matched their approved
  baselines.
* No SQLite artifacts were created and the Node-process baseline remained the
  same two pre-existing processes.
* No hosted configuration, service, database, traffic, production write mode,
  or scheduled job was changed.

# Next Step Boundary

After M7-03, the next bounded plan may compose controlled scheduler, outbox,
and email lifecycles. Maintenance passing does not authorize job enablement or
provider changes.
