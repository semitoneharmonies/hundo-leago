# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M7-04
```

## Work Item

```text
Controlled Scheduler, Outbox, and Account-Email Lifecycle
```

# Objective

Compose the target runtime's durable auction, trade-expiry, matchup, league
outbox, and account-email jobs behind one explicit deployed lifecycle. Jobs
must remain inert during maintenance or whenever scheduled jobs are disabled,
must avoid overlapping cycles, and must close before the database.

# Authority and Boundary

Grae requested continued M7 implementation on `2026-07-22`. This plan
authorizes local code and temporary-database verification only.

It does not authorize changing a provider variable, restarting a hosted
service, entering a real maintenance window, migrating, importing, resetting,
deploying, committing, pushing, enabling jobs, sending real email, or opening
production writes.

# Scope

1. Compose all approved target scheduled jobs with the existing SQLite
   repositories and target services; do not invoke compatibility jobs.
2. Add one lifecycle coordinator with explicit disabled, maintenance-paused,
   starting, running, stopping, stopped, and failed states.
3. Require scheduled jobs to be both explicitly enabled and in open write mode
   before any timer or job starts.
4. Prevent overlapping scheduler cycles and run durable domain jobs before
   post-commit outbox publication; keep account-email delivery controlled by
   the same lifecycle.
5. Start only after target database validation and stop scheduler/email work
   before closing the SQLite database.
6. Expose safe scheduler state through operational health without paths,
   secrets, lease tokens, provider payloads, or email addresses.
7. Prove disabled and maintenance-paused startup are write-free; prove enabled
   local startup, overlap suppression, failure containment, and shutdown order
   without provider calls or production data.

# Expected Files

```text
hundo-leago-backend/src/application/services/operations/createTargetScheduler.js
hundo-leago-backend/src/bootstrap/createTargetRuntime.js
hundo-leago-backend/src/bootstrap/createTargetHttpServer.js
hundo-leago-backend/src/bootstrap/startTargetProcess.js
hundo-leago-backend/src/infrastructure/persistence/sqlite/SqliteMatchupJobRepository.js
hundo-leago-backend/test/foundation/targetSchedulerFoundation.test.js
hundo-leago-backend/test/foundation/targetDeploymentFoundation.test.js
```

# Completion Gate

M7-04 is complete only when focused lifecycle, pause, overlap, error, health,
and shutdown tests pass; the complete backend suite and syntax checks pass;
protected hashes and runtime baselines remain unchanged; and documentation
records exact evidence.

# Completion Evidence

Completed locally on `2026-07-22`.

* The final scheduler, deployment, durable occurrence, handler, and schedule
  materialization gate passed `30/30`.
* Wider target runtime, statistics, matchup, auction, trade, outbox, and email
  focused regressions also passed.
* The complete backend suite passed `854/854` across `227` suites under Node
  `24.14.1`.
* JavaScript syntax checks passed `403/403`; `git diff --check` passed.
* Protected player/reset hashes matched, no SQLite artifacts remained, and the
  two-process Node baseline was unchanged.
* A 22-week five-team schedule atomically materialized `132` durable
  occurrences. Disabled and maintenance-paused starts remained write-free;
  enabled/open no-due startup composed auction, trade, matchup, outbox, and
  account-email lifecycles without external effects.
* No hosted variable, service, database, job, provider, traffic state,
  production data, commit, or push was changed.

# Next Step Boundary

After M7-04, the next bounded plan may implement encrypted offsite SQLite
backup and clean restore controls. Scheduler composition does not authorize
hosted enablement or any production operation.
