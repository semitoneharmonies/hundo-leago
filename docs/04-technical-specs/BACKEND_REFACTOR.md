# Hundo Leago - Backend Refactor

## Document Status

`APPROVED`

This technical specification defines:

* the behaviour-preserving refactor of the current Node.js and Express backend;
* the target modular-monolith folder and dependency structure;
* the exact extraction order from `server.js`;
* characterization, persistence-safety, event, job, and rollback requirements for every step;
* the boundary between refactoring, defect correction, authentication, multi-league work, and SQLite migration;
* technical decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the backend-refactor decisions and approved adoption of the resulting design on 2026-07-18.

---

## Technical Purpose

The backend must become understandable and testable before major persistence, authentication, and multi-league changes are layered onto it.

The refactor must:

* preserve current observable behavior while code is moved;
* keep production data and protected files safe;
* make routes thin;
* move business operations into services;
* isolate pure domain calculations;
* place storage behind repositories;
* separate scheduled jobs from process startup;
* make configuration explicit;
* expose dependencies for testing;
* prepare for SQLite without performing the SQLite migration.

Refactoring is structural work. It is not permission to silently change league rules, API contracts, persisted data, scheduled timing, or production behavior.

---

## Out of Scope

This specification does not itself:

* introduce SQLite;
* migrate or reset production data;
* implement secure accounts and sessions;
* implement multi-league database relationships;
* change approved roster, contract, auction, trade, matchup, standings, or draft rules;
* repair every known current defect;
* redesign the frontend;
* deploy to production;
* remove current compatibility endpoints.

Those changes require their approved specifications and focused work-plan steps.

---

# Part 1 - Authority and Safety

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Approved feature specifications are required when their code is being extracted.

---

## Operating Mode

The reviewed operating mode is:

```text
OFFSEASON_RESET
```

This permits major documented work outside production. It does not make protected data disposable and does not authorize a production reset, migration, or deployment.

---

## Repository and Branch

The refactor occurs in:

```text
C:\Users\graem\Desktop\hundo-leago-backend
```

The reviewed local branch is:

```text
stage2
```

Before every step:

```powershell
git -C C:\Users\graem\Desktop\hundo-leago-backend status --short
git -C C:\Users\graem\Desktop\hundo-leago-backend branch --show-current
```

If Git requires a safe-directory override in a sandboxed environment, use a command-scoped `-c safe.directory=...` option. Do not modify the user’s global Git configuration merely to inspect the repository.

---

# Part 2 - Observed Current Backend

## Runtime

Current foundation:

```text
Node.js
Express 5
CommonJS
Socket.IO
file-backed JSON
Render persistent disk
```

Current package scripts:

```text
npm start
npm run dev
npm test
```

`npm test` is currently a placeholder that exits with failure. Characterization coverage must be added incrementally.

---

## Existing Structure

```text
hundo-leago-backend/
|-- server.js
|-- leagueStore.js
|-- routes/
|   |-- healthRoutes.js
|   |-- leagueReadRoutes.js
|   `-- playersReadRoutes.js
|-- scripts/
|   |-- refreshStats.js
|   `-- syncPlayers.js
|-- jobs/
|-- services/
|-- utils/
|-- validators/
|-- league-state.json
|-- players.json
|-- stats-cache.json
|-- backups/
`-- snapshots/
```

The `jobs`, `services`, `utils`, and `validators` directories currently contain only placeholders.

---

## Current `server.js` Responsibilities

`server.js` currently owns or coordinates:

* environment-derived paths and flags;
* CORS;
* Express body parsing;
* HTTP server creation;
* Socket.IO creation;
* directory creation;
* player-file bootstrapping;
* player normalization, caching, search, and reload;
* Pacific-time conversion;
* schedule generation;
* roster-legality placeholder logic;
* standings calculation;
* snapshot creation;
* auction resolution;
* broad league-state writes;
* statistics reads and refresh;
* snapshot and backup APIs;
* matchup read and preview endpoints;
* matchup schedule writes;
* debug mutation endpoints;
* roster-lock jobs;
* baseline-capture jobs;
* result-finalization jobs;
* rollover jobs;
* interval startup;
* server listening.

This concentration is the primary refactor problem.

---

## Extracted Work Already Present

The local branch already extracts:

```text
routes/healthRoutes.js
routes/leagueReadRoutes.js
routes/playersReadRoutes.js
leagueStore.js
```

These modules are treated as current work, not discarded or rewritten wholesale.

They receive characterization tests and are adapted gradually to the approved target boundaries.

---

## Current API and Job Risks

The refactor must preserve and explicitly track these facts:

* most endpoints are unauthenticated;
* compatibility commissioner checks trust `meta.actorRole` from the request body;
* `POST /api/league` accepts a broad client-created league object;
* public health and debug responses expose internal paths;
* snapshot creation and restoration are currently unauthenticated;
* debug matchup writes can destructively alter test state;
* current roster legality checks only that a roster is non-empty;
* current scoring reads the team’s current roster rather than a complete immutable locked-player snapshot;
* job execution uses in-memory one-minute timers and JSON markers;
* some job functions start queued writes without awaiting completion;
* Socket.IO emissions use `app.get("io")`, but the reviewed server does not set the instance on the app;
* no current authenticated Socket.IO room model exists;
* tests are insufficient for a safe broad rewrite.

These are not reasons to change everything in one step.

Each is assigned to either:

1. characterization and preservation during extraction;
2. a focused compatibility defect fix;
3. Security;
4. SQLite Migration;
5. a feature implementation plan.

---

# Part 3 - Approved Refactor Principles

## Small Vertical Steps

One work-plan step extracts one cohesive responsibility.

Each step:

* names exact files;
* has a behavior inventory;
* adds or updates focused tests;
* runs against copied or disposable state;
* compares persistence before and after read checks;
* leaves the server runnable;
* has a simple Git rollback;
* stops before the next step.

No mass move of the entire server is permitted.

---

## CommonJS During Refactor

The backend remains CommonJS:

```js
const moduleValue = require("./module");
module.exports = { moduleValue };
```

An ES-module conversion would add unrelated risk and is deferred.

---

## Dependency Direction

Approved dependency direction:

```text
bootstrap
   |
   v
transport/routes
   |
   v
application services
   |
   +------> domain
   |
   +------> repository interfaces
                  |
                  v
          JSON or SQLite adapters

jobs -----------> application services
adapters -------> external providers
outbox ---------> Socket.IO / notifications
```

Rules:

* domain modules import no Express, filesystem, Socket.IO, clock, environment, or database code;
* routes import services and transport utilities, not repositories;
* services own use cases and transaction boundaries;
* repositories own normal persistence access;
* jobs invoke services rather than route handlers;
* bootstrap is the only layer that constructs and connects concrete dependencies.

---

## Composition Root

`src/bootstrap/createApplication.js` is the composition root.

It receives or constructs:

* validated configuration;
* repositories;
* external adapters;
* services;
* job runner;
* event publisher;
* clock;
* ID generator;
* logger.

Tests may supply fakes without changing process environment or production files.

---

## Process Entrypoint

Root `server.js` becomes a thin compatibility entrypoint:

1. load configuration;
2. create dependencies;
3. create the application;
4. create HTTP and Socket.IO servers;
5. start scheduled jobs;
6. listen;
7. handle shutdown.

It contains no route handlers, business calculations, filesystem reads, or feature rules.

The root filename remains `server.js` during this refactor so Render and `npm start` do not change unexpectedly.

---

## Express Application Factory

`src/bootstrap/createApplication.js` returns an Express app without listening on a port.

This allows tests to:

* construct the app with temporary repositories;
* send requests without opening production storage;
* prove read-only behavior;
* test failure paths.

The application factory registers:

* request IDs;
* safe logging;
* CORS;
* parsers;
* session/auth middleware when later implemented;
* routes;
* not-found handling;
* centralized error handling.

---

## Express Routers

Feature routes use `express.Router()`.

Registration functions may remain temporarily for extracted compatibility routes, but the target is one router per feature boundary.

Routes:

* parse transport inputs;
* invoke one application-service use case;
* translate the result to the approved API response;
* pass errors to centralized handling.

Routes do not:

* perform direct filesystem or SQL access;
* calculate standings, cap, auction winners, or matchup scores;
* emit Socket.IO events before commit;
* read trusted roles from the request body.

---

## Services

An application service represents a complete operation such as:

```text
saveCompatibilityLeague
searchPlayers
refreshStatistics
generateMatchupSchedule
updateMatchupWeek
resolveAuctions
applyRosterLocks
captureMatchupBaseline
finalizeMatchupResults
rolloverMatchupWeek
createSnapshot
restoreBackup
```

During compatibility extraction, services may preserve current broad behavior.

Later target services use authenticated actor context, stable IDs, league scope, repositories, transactions, versions, idempotency, activity, and outbox records.

---

## Domain

Pure domain modules contain deterministic calculations and validation.

Examples:

```text
domain/auctions/resolveAuctions.js
domain/matchups/buildSchedule.js
domain/matchups/calculateWeeklyScore.js
domain/standings/calculateStandings.js
domain/rosters/evaluateRosterLegality.js
```

Pure functions receive:

* explicit input data;
* explicit timestamps when time matters;
* explicit settings;
* explicit random source only when approved.

They return values or typed domain errors and create no side effects.

---

## Repositories

The initial refactor introduces repository interfaces around current files without changing authoritative storage.

Initial adapters:

```text
JsonLeagueRepository
JsonPlayerRepository
JsonStatisticsRepository
JsonSnapshotRepository
JsonBackupRepository
```

Target SQLite adapters are added later under the same application boundaries.

Routes and domain modules never choose between JSON and SQLite.

Normal operation never dual-writes both as competing authorities.

---

## Configuration

Environment access is centralized in:

```text
src/config/loadConfig.js
```

Configuration is parsed once at startup.

It includes:

* environment name;
* port;
* allowed origins;
* league-state path;
* player-data path;
* statistics-cache path;
* snapshot path;
* backup path;
* feature flags;
* safe job intervals;
* external provider configuration;
* security configuration when implemented.

Production startup fails closed for missing or unsafe critical values.

Feature code does not call `process.env` directly.

---

## Time and IDs

Application services receive:

```js
clock.now()
idGenerator.uuid()
```

Compatibility adapters may preserve current numeric IDs where required.

New target records use approved stable UUIDs.

Tests use a fixed clock. Scheduled calculations never require changing the computer clock.

---

## Errors

Use typed application errors:

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
PreconditionError
FrozenError
ExternalServiceError
PersistenceError
```

A centralized transport mapper produces API error envelopes.

Compatibility routes preserve their current error bodies until migrated to `/api/v1`.

---

## Logging

A logger interface replaces unstructured feature-level `console.log`.

Required safe context:

```text
requestId or jobOccurrenceId
feature
operation
leagueId when known
actorId when known
outcome
durationMs
error code
```

Logs exclude:

* passwords;
* session cookies;
* secrets;
* full request bodies;
* active bid values;
* private cross-league data.

Bootstrap may use minimal console output before the logger is ready.

---

## Events

Services return or store post-commit events.

Current JSON compatibility:

* save completes first;
* then a compatibility invalidation may emit;
* emission failure does not roll back committed state.

Target SQLite:

* state and outbox commit atomically;
* the dispatcher publishes after commit;
* retries use stable event IDs.

Routes and repositories do not emit events directly.

---

## Scheduled Jobs

Jobs are split into:

```text
definition
runner
service operation
durable occurrence state
```

During JSON compatibility:

* existing timing and enablement remain unchanged;
* an in-process overlap guard prevents the same job function overlapping itself;
* job functions return promises that the runner awaits;
* fixed-clock tests call the service directly;
* production data is never used as a test fixture.

SQLite later supplies durable leases, attempts, and idempotency.

---

## Shutdown

Graceful shutdown:

1. stop accepting new HTTP connections;
2. stop job timers;
3. stop claiming new work;
4. wait for in-flight requests and current job operations within a bounded timeout;
5. flush safe logs;
6. close Socket.IO and persistence resources;
7. exit with the appropriate code.

No new destructive operation begins during shutdown.

---

# Part 4 - Target Folder Structure

```text
hundo-leago-backend/
|-- server.js
|-- package.json
|-- src/
|   |-- bootstrap/
|   |   |-- createApplication.js
|   |   |-- createHttpServer.js
|   |   |-- createDependencies.js
|   |   `-- shutdown.js
|   |-- config/
|   |   `-- loadConfig.js
|   |-- transport/
|   |   |-- http/
|   |   |   |-- middleware/
|   |   |   |-- errors/
|   |   |   `-- routes/
|   |   `-- socket/
|   |       |-- authorizeSocket.js
|   |       `-- publishInvalidation.js
|   |-- application/
|   |   |-- services/
|   |   |-- ports/
|   |   `-- errors/
|   |-- domain/
|   |   |-- auctions/
|   |   |-- contracts/
|   |   |-- matchups/
|   |   |-- rosters/
|   |   |-- standings/
|   |   `-- trades/
|   |-- infrastructure/
|   |   |-- persistence/
|   |   |   |-- json/
|   |   |   `-- sqlite/
|   |   |-- nhl/
|   |   |-- clock/
|   |   |-- ids/
|   |   `-- logging/
|   |-- jobs/
|   |   |-- definitions/
|   |   |-- runJob.js
|   |   `-- startScheduler.js
|   `-- operations/
|       |-- backups/
|       |-- snapshots/
|       `-- recovery/
|-- scripts/
|   |-- refreshStats.js
|   `-- syncPlayers.js
|-- test/
|   |-- characterization/
|   |-- contract/
|   |-- integration/
|   |-- unit/
|   |-- fixtures/
|   `-- helpers/
|-- leagueStore.js
|-- routes/
`-- data files and approved local fixtures
```

The old `routes/` and `leagueStore.js` remain until their importers have moved and tests pass. Their removal is a separate final cleanup, not an early step.

---

# Part 5 - Test Foundation

## Test Runner

Use Node’s built-in test runner initially:

```text
node --test
```

Reasons:

* no framework dependency is required;
* CommonJS is supported;
* unit and integration tests can be added incrementally;
* it avoids combining test-framework adoption with the structural refactor.

`package.json` target:

```json
{
  "scripts": {
    "test": "node --test",
    "test:unit": "node --test \"test/unit/**/*.test.js\"",
    "test:characterization": "node --test \"test/characterization/*.test.js\"",
    "test:contract": "node --test \"test/contract/**/*.test.js\"",
    "check": "node --check server.js"
  }
}
```

Additional test tooling may be selected in Testing Strategy if evidence requires it.

---

## Temporary Data

Tests use:

* an operating-system temporary directory;
* copied minimal JSON fixtures;
* fixed clocks;
* fake event publishers;
* fake external adapters;
* random available local ports only when an actual socket is required.

Tests never use:

* the production persistent disk;
* repository live state files as writable fixtures;
* production secrets;
* real restore targets.

---

## Read-Only Proof

For each `GET` compatibility endpoint:

1. hash league, player, statistics, snapshot, and backup fixtures;
2. call the endpoint;
3. hash them again;
4. assert identical hashes and file lists.

This catches normalization-and-save, backup-on-read, seed-on-read, and hidden repair behavior.

---

## Characterization Contract

Before moving a route or function, capture:

* representative request;
* response status;
* response body shape;
* validation failure;
* persistence changes;
* backup changes;
* event attempt;
* logs important to operations;
* timing or idempotency behavior.

Characterization tests describe current facts. They are not approval of insecure behavior for Season 2.

---

# Part 6 - Exact Refactor Sequence

Only one numbered step is active at a time.

## Step 0 - Baseline and Safety Harness

Create:

```text
test/helpers/
test/fixtures/
test/characterization/
```

Add:

* temporary-path application setup;
* file hashing;
* request helper;
* fixed clock;
* fake publisher;
* endpoint manifest test;
* current read-only tests;
* current league-store save/backup/restore tests.

Do not move feature code in this step.

Acceptance:

* the current endpoint manifest reports 34 endpoints with matchup debug enabled and 28 with it disabled;
* the server starts against copied state;
* read-only hashes remain unchanged;
* a failed write does not corrupt the live fixture;
* repository state files remain unchanged.

Rollback:

* revert only the new test files and package-script change.

---

## Step 1 - Configuration and Bootstrap

Create:

```text
src/config/loadConfig.js
src/bootstrap/createApplication.js
src/bootstrap/createHttpServer.js
src/bootstrap/createDependencies.js
src/bootstrap/shutdown.js
```

Move only:

* environment parsing;
* origin configuration;
* body-parser setup;
* HTTP and Socket.IO construction;
* startup and shutdown wiring.

Preserve:

* current root `server.js`;
* current port default;
* current endpoint paths;
* current flags and intervals;
* current CORS behavior during compatibility.

The missing Socket.IO app registration is not silently fixed while moving code. Reproduce it, record it, then address it through the focused defect step below.

Acceptance:

* endpoint manifest unchanged;
* startup output remains understandable;
* compatibility CORS tests pass;
* application factory runs without listening;
* shutdown test clears timers and closes server.

---

## Step 2 - Player Read and Reload Module

Create:

```text
src/application/services/players/
src/infrastructure/persistence/json/JsonPlayerRepository.js
src/transport/http/routes/playersCompatibilityRouter.js
```

Move:

* player normalization;
* in-memory indexing;
* search;
* player reads;
* current reload behavior.

Keep:

* current `/api/players` paths and response shapes;
* current ordering and limits;
* current active-player search behavior;
* current player ID semantics.

Acceptance:

* no-query, query, detail, not-found, invalid-ID, debug, and reload characterization tests pass;
* player-file hash is unchanged by reads;
* reload changes only process cache.

---

## Step 3 - Statistics Module and NHL Adapter

Create:

```text
src/application/services/statistics/
src/infrastructure/persistence/json/JsonStatisticsRepository.js
src/infrastructure/nhl/
src/transport/http/routes/statisticsCompatibilityRouter.js
```

Move:

* stats-cache reads;
* one-player lookup;
* refresh orchestration;
* provider access behind an adapter;
* current refresh token check as compatibility middleware.

Keep refresh scripts as thin command-line adapters to the same service.

Acceptance:

* absent cache, full cache, one-player, invalid JSON, unauthorized refresh, authorized refresh, and provider failure tests pass;
* failed refresh preserves the last valid cache;
* league-state hash never changes during stats refresh.

---

## Step 4 - Snapshot and Backup Operations

Create:

```text
src/operations/snapshots/
src/operations/backups/
src/infrastructure/persistence/json/JsonSnapshotRepository.js
src/infrastructure/persistence/json/JsonBackupRepository.js
src/transport/http/routes/recoveryCompatibilityRouter.js
```

Move:

* snapshot listing and creation;
* snapshot restore;
* backup listing;
* backup restore;
* safe-name and path-containment helpers.

Do not add target production authorization inside the extraction commit. Preserve current compatibility behavior in tests and immediately mark production exposure as blocked pending Security.

Acceptance:

* path traversal is characterized and then fixed only in a separate security patch if currently vulnerable;
* restore uses only temporary fixtures;
* pre-restore and post-restore hashes and logs are asserted;
* a failed parse leaves live state unchanged;
* no real repository snapshot or backup is changed.

---

## Step 5 - Matchup and Standings Pure Calculations

Create:

```text
src/domain/matchups/buildSchedule.js
src/domain/matchups/calculateWeeklyScore.js
src/domain/standings/calculateStandings.js
src/application/services/matchups/readMatchups.js
src/transport/http/routes/matchupsReadCompatibilityRouter.js
```

Move:

* timezone helpers;
* round-robin pairing;
* schedule-window construction;
* standings calculation;
* scoring preview calculation;
* current week and status reads.

Pass `nowMs` and timezone explicitly.

Preserve current compatibility calculations even where approved Season 2 rules require later changes.

Acceptance:

* daylight-saving boundary fixtures pass;
* standings sort and tie fixtures pass;
* scoring baseline fixtures pass;
* all matchup `GET` responses remain compatible;
* all matchup reads leave every fixture hash unchanged.

---

## Step 6 - Matchup Schedule Commands

Create:

```text
src/application/services/matchups/generateSchedule.js
src/application/services/matchups/updateWeek.js
src/application/services/matchups/shiftSchedule.js
src/transport/http/routes/matchupsScheduleCompatibilityRouter.js
```

Move:

* schedule generation;
* one-week updates;
* shift-from behavior;
* compatibility commissioner-role checks.

Acceptance:

* even-team generation remains compatible;
* current odd-team rejection remains compatible and is tracked for later approved bye support;
* future-only editing and non-production force behavior pass;
* overlap validation passes;
* save occurs before event attempt;
* failed validation changes no file.

---

## Step 7 - Matchup Jobs

Create:

```text
src/jobs/definitions/applyRosterLocks.js
src/jobs/definitions/captureMatchupBaseline.js
src/jobs/definitions/finalizeMatchupResults.js
src/jobs/definitions/rolloverMatchupWeek.js
src/jobs/runJob.js
src/jobs/startScheduler.js
```

Move each job independently in this order:

1. roster locks;
2. baseline capture;
3. finalization;
4. rollover.

Each job:

* receives a fixed clock;
* returns an awaited promise;
* has an in-process overlap guard;
* reports `skipped`, `succeeded`, or `failed`;
* preserves current JSON idempotency markers;
* calls services rather than another job by uncontrolled side effect.

Acceptance:

* before-time, exact-time, after-time, duplicate, restart, missing-stats, invalid-state, save-failure, and event-failure fixtures pass;
* accelerated complete-week simulation passes;
* no job advances twice;
* failed finalization prevents rollover.

---

## Step 8 - Auction Resolution and Snapshot Jobs

Create:

```text
src/domain/auctions/resolveCompatibilityAuctions.js
src/application/services/auctions/resolveCompatibilityAuctions.js
src/jobs/definitions/resolveAuctions.js
src/jobs/definitions/createWeeklySnapshot.js
```

Preserve the current compatibility auction algorithm while documenting its differences from the approved Auctions specification.

Acceptance:

* no-bid, single-bid, multiple-bid, tie, missing-team, duplicate-run, buyout-lock, activity, and save-failure fixtures pass;
* snapshot job runs once for one occurrence;
* job state and data commit before event attempt.

---

## Step 9 - Broad League Compatibility Write

Create:

```text
src/application/services/league/saveCompatibilityLeague.js
src/transport/http/routes/leagueWriteCompatibilityRouter.js
src/validators/compatibilityLeaguePayload.js
```

Move:

* shape validation;
* wipe protection;
* freeze check;
* backend-owned matchup preservation;
* auto-marker preservation;
* save metadata;
* compatibility event attempt.

Do not generalize the broad write or use it for new features.

Acceptance:

* success, invalid arrays, invalid matchup shape, wipe, freeze, commissioner compatibility, manager compatibility, save failure, and event failure pass;
* fields not accepted by the compatibility contract cannot silently overwrite server-owned values.

---

## Step 10 - JSON Repository Boundary

Adapt current `leagueStore.js` into:

```text
src/infrastructure/persistence/json/JsonLeagueRepository.js
```

Preserve:

* normalization;
* queued writes;
* temporary-file rename;
* current backup behavior;
* schema version;
* list and restore semantics.

Add explicit repository methods used by services. Do not let routes access the repository directly.

The temporary compatibility method `replaceCompatibilityLeagueState` may remain until frontend broad writes are retired. It is not available to new target services.

Acceptance:

* concurrent-save ordering passes;
* temporary-file failure leaves the prior live file intact;
* malformed JSON fails visibly without reseeding;
* missing file behavior is characterized;
* backup pruning is deterministic in fixtures;
* all endpoint characterization tests pass.

---

## Step 11 - Socket.IO Compatibility Restoration

This is a focused defect step, not a code-move side effect.

Implement and verify:

* explicit attachment of the Socket.IO instance;
* one connection handler;
* compatibility `league:updated` delivery;
* frontend refetch after the event;
* reconnect behavior;
* safe failure when Socket.IO is unavailable.

Do not add target authenticated rooms until Security and memberships are implemented.

Acceptance:

* a committed compatibility write produces one invalidation;
* a failed write produces none;
* the client refetches once;
* listener cleanup prevents duplicates;
* HTTP behavior works when Socket.IO is unavailable.

---

## Step 12 - Remove Feature Code from Root

After Steps 0 through 11 pass:

* remove moved functions and route handlers from root `server.js`;
* retain only bootstrap;
* remove unused compatibility imports;
* keep old adapter files only if still imported;
* update `CURRENT_STATE.md`.

Acceptance:

```text
server.js contains startup and shutdown wiring only
no route handler exists in server.js
no business calculation exists in server.js
no filesystem feature access exists in server.js
all 34 compatibility route definitions remain registered, with the six matchup-debug routes still controlled by their flag
all characterization tests pass
```

---

## Step 13 - Refactor Completion Gate

The behaviour-preserving refactor is complete when:

* the root server is a thin entrypoint;
* routes, services, domain, repositories, jobs, adapters, configuration, and operations have explicit boundaries;
* compatibility API tests pass;
* read-only proof passes;
* complete accelerated matchup-week simulation passes;
* persistence fixtures remain isolated;
* no production data was touched;
* known behavior and security gaps remain documented for their owning specifications;
* the SQLite Migration work plan can replace repository adapters without reorganizing the application again.

---

# Part 7 - Known Gaps and Ownership

| Current gap | Owner |
|---|---|
| Frontend-only passwords and body-supplied roles | Security plus User Accounts implementation |
| Single global league object | SQLite Migration plus leagues/memberships work |
| Broad `POST /api/league` | API target migration and Frontend Structure |
| Internal paths in public responses | Security and operations endpoints |
| Unprotected snapshot/restore controls | Security and Backup and Restore |
| Matchup debug mutations | Environment Setup, Security, and testing fixtures |
| Non-empty-only roster legality | Rosters feature implementation |
| Current roster used instead of immutable locked-player snapshot | Matchups feature implementation |
| Current auction amount treated as salary without full term model | Auctions and Contracts implementation |
| In-memory job markers | SQLite Migration durable jobs |
| Missing authenticated Socket.IO rooms | Security and multi-league implementation |
| Current even-team-only schedule generation | Matchups implementation for approved team-count behavior |

The refactor creates the seams for these changes but does not hide them inside code movement.

---

# Part 8 - Step Verification Template

Every implementation step records:

```text
Objective:
Exact files changed:
Behavior intentionally preserved:
Characterization added:
Command run:
Result:
Fixture paths:
Pre/post hashes:
Known test not run:
Rollback:
Next step:
```

Minimum commands:

```powershell
npm test
node --check server.js
git diff --check
git status --short
```

Focused endpoint example:

```powershell
curl.exe -sS http://localhost:4000/health
curl.exe -sS http://localhost:4000/api/league
```

State-safety example:

```powershell
Get-FileHash .\test\fixtures\runtime\league-state.json -Algorithm SHA256
```

Use copied test files, never production paths.

---

# Part 9 - Git and Rollback

## Commits

One refactor step should normally produce one focused backend commit after verification.

Do not combine:

* frontend changes;
* feature behavior changes;
* SQLite migration;
* production configuration;
* unrelated cleanup;
* documentation from another independent task.

---

## Rollback

Before SQLite:

* code rollback is a normal commit revert or deployment rollback;
* data rollback uses the verified pre-step copied fixture or approved production backup;
* a refactor step must not require a data migration merely to undo code movement.

Never use `git reset --hard` or discard unrelated work.

---

## Stop Conditions

Stop the active step when:

* current behavior cannot be characterized;
* code and approved behavior conflict and the step would change behavior;
* a test points at production storage;
* a read request changes a protected file;
* unrelated local modifications overlap the files;
* rollback cannot be described;
* the server cannot return to a runnable state within the step;
* a required decision belongs to Security, SQLite Migration, or a product specification.

Report the evidence and create a focused follow-up rather than expanding the step.

---

# Part 10 - Approval Checklist

## Inherited Constraints

- [x] The refactor preserves current behavior unless a separate approved change says otherwise.
- [x] Production data is never reseeded, overwritten, or treated as a test fixture.
- [x] Read-only endpoints remain read-only.
- [x] The backend remains CommonJS during refactor and SQLite migration.
- [x] The frontend and backend remain separate repositories.
- [x] Routes, services, domain, repositories, jobs, adapters, and bootstrap have explicit boundaries.
- [x] The refactor precedes authoritative SQLite cutover.
- [x] Existing JSON remains protected until approved migration and rollback criteria are satisfied.

## Approved Refactor Decisions

- [x] Root `server.js` remains the process entrypoint and becomes thin.
- [x] `src/bootstrap/createApplication.js` creates the Express app without listening.
- [x] Dependencies are composed in one bootstrap composition root.
- [x] Feature routes use Express Router.
- [x] Routes invoke services and do not access persistence directly.
- [x] Services own use cases and transaction boundaries.
- [x] Domain calculations are pure and receive time explicitly.
- [x] Current JSON files are placed behind repository adapters before SQLite work.
- [x] Configuration is parsed once and feature code does not read `process.env` directly.
- [x] Clocks, ID generation, logging, events, repositories, and external providers are injectable.
- [x] Node’s built-in test runner is the initial backend test foundation.
- [x] Characterization tests precede each extraction.
- [x] Read-only tests compare pre-request and post-request file hashes.
- [x] Every test writes only to temporary or disposable fixture paths.
- [x] Scheduled jobs call services, return awaited promises, and use overlap guards.
- [x] Current JSON job behavior is preserved before durable SQLite job records are introduced.
- [x] Socket.IO compatibility restoration is a focused defect step, not a silent extraction side effect.
- [x] The broad league write receives a compatibility service but is unavailable to new target features.
- [x] Refactor implementation follows the numbered sequence in this document.
- [x] Every step ends with focused verification and a clear rollback.
- [x] Known security, multi-league, and product gaps remain assigned to their owning work.
- [x] Grae approved this document by delegating the technical decisions to Codex.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The backend-refactor approval phase is complete.

The refactor itself is complete only when:

* all 14 stages, Step 0 through Step 13, satisfy their gates;
* root `server.js` is a thin entrypoint;
* current endpoint compatibility tests pass;
* feature boundaries are explicit;
* jobs are testable with a fixed clock;
* JSON persistence is behind repositories;
* read-only proof passes;
* no production data was modified;
* the next SQLite Migration step can proceed without another uncontrolled reorganization.

---

# Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/07-testing/TESTING_STRATEGY.md
docs/08-operations/BACKUP_AND_RESTORE.md
```
