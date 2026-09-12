# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-12
```

## Active Step

```text
Backend Refactor Step 12 - Remove Feature Code from Root
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-11 passed its gates on 2026-07-18, so BR-12 may begin without another continuation prompt.

BR-12 completed on 2026-07-18. The archive below records the approved scope and final evidence.

---

## Objective

Leave root `server.js` responsible only for configuration, compatibility-runtime construction, background-start invocation, signal handling, listening, and startup-failure shutdown.

Move:

* the six conditional matchup-debug route handlers into a compatibility router;
* all feature repository, adapter, service, operation, route, job, and scheduler composition into an explicit bootstrap runtime.

The move must preserve all 34 compatibility route registrations, the six-route debug flag, response contracts, job enablement and startup order, Socket.IO delivery, process lifecycle, and every current feature behavior.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/04-technical-specs/ARCHITECTURE.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
../hundo-leago/docs/06-work-plans/archive/BR-11_SOCKET_IO_COMPATIBILITY_RESTORATION.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-11.
3. Record protected hashes and existing Node process IDs.
4. Run endpoint, debug-route, startup, shutdown, job, broad-write, recovery, player, statistics, and matchup baselines.
5. Record root `server.js` route-handler, business-calculation, filesystem-feature, and line-count facts.
6. Keep every mutable fixture below the operating-system temporary directory.

---

# Part 2 - Current Compatibility Facts

Root `server.js` currently has 657 lines. It directly imports and constructs feature repositories, adapters, services, operations, routers, and jobs.

It also owns six route handlers guarded by `DEBUG_MATCHUPS`:

```text
GET  /api/matchups/debug/stateSummary
POST /api/matchups/debug/resetLocks
POST /api/matchups/debug/resetBaselineForWeek
POST /api/matchups/debug/captureBaselineNow
POST /api/matchups/debug/runLockNow
POST /api/matchups/debug/setTeamRosterEmpty
```

The handlers preserve body-supplied commissioner checks, current response text, persistence metadata, event timing, placeholder-player behavior, and current error mapping. They are compatibility-only debug behavior and remain unavailable unless the debug flag is enabled.

Current startup invokes the weekly-snapshot and auction jobs immediately when enabled, tracks their intervals, starts the ordered matchup scheduler only when enabled, installs signal handlers, then listens. BR-12 preserves that sequence.

---

# Part 3 - Exact Scope

Create:

```text
src/bootstrap/createCompatibilityRuntime.js
src/transport/http/routes/matchupsDebugCompatibilityRouter.js
test/characterization/matchupsDebugCompatibility.test.js
test/characterization/rootServerBoundary.test.js
```

Modify:

```text
server.js
test/helpers/readEndpointManifest.js
test/characterization/endpointManifest.test.js
```

The existing root route adapters may remain only while imported by the compatibility runtime:

```text
routes/healthRoutes.js
routes/leagueReadRoutes.js
```

A listed modification may be omitted when inspection proves it unnecessary. Another production file requires a plan amendment before editing.

---

# Part 4 - Required Boundaries

## Debug router

The debug router:

* registers all six routes together;
* receives repository-compatible state access, fixed job dependencies, publisher, clock, and logger explicitly;
* contains current HTTP request and response mapping;
* remains registered only when `debugMatchups` is true;
* performs no process, listener, interval, or environment work.

## Compatibility runtime

The runtime:

* is the composition root for current feature repositories, adapters, services, operations, routers, jobs, and scheduler;
* receives parsed config and backend root explicitly;
* creates but does not hide the application, HTTP server, Socket.IO server, listen function, shutdown lifecycle, and background-start function;
* registers every route exactly once;
* preserves current feature and job dependency wiring;
* exposes background startup as an explicit idempotent boundary.

## Root server

Root `server.js`:

* loads configuration;
* constructs the compatibility runtime;
* starts current background work;
* installs signal handlers;
* starts listening;
* maps startup failure to process exit state and bounded shutdown;
* contains no route handler, business calculation, feature filesystem access, feature repository, service, operation, job, adapter, or router construction.

---

# Part 5 - Safety Rules

* Do not change any route method, path, order dependency, status, body, validation, debug guard, or event contract.
* Do not change job enablement, immediate-run behavior, interval duration, job order, or shutdown tracking.
* Do not change JSON authority, normalization, persistence, backup, restore, player, statistics, matchup, auction, broad-write, CORS, or Socket.IO behavior.
* Do not add dependencies, SQLite, authentication, rooms, frontend work, production operations, seeds, migrations, or resets.
* Debug routes must remain conditional and body-role compatible.
* Read-only endpoints must remain read-only.
* Root must not import feature files after extraction.

---

# Part 6 - Execution Sequence

1. Characterize all six debug routes and current root structural facts.
2. Extract the debug router with explicit dependencies and preserve its conditional registration.
3. Compose all current features in `createCompatibilityRuntime.js`.
4. Replace root `server.js` with startup and shutdown wiring only.
5. Update endpoint-manifest guard/source inspection for the new router and runtime.
6. Prove background startup is explicit, idempotent, ordered, and tracked.
7. Run focused debug, root-boundary, endpoint, startup, shutdown, job, characterization, complete, syntax, hash, process, route, debug-guard, read-only, and whitespace gates.
8. Record completion evidence and activate BR-13.

---

# Part 7 - Verification

```powershell
node --test test/characterization/matchupsDebugCompatibility.test.js test/characterization/rootServerBoundary.test.js test/characterization/endpointManifest.test.js test/characterization/serverStartup.test.js test/characterization/shutdown.test.js test/characterization/matchupJobsCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check server.js
node --check src/bootstrap/createCompatibilityRuntime.js
node --check src/transport/http/routes/matchupsDebugCompatibilityRouter.js
git diff --check
git status --short
```

Required:

* all tests pass;
* root `server.js` contains startup and shutdown wiring only;
* no route handler, business calculation, feature filesystem access, or feature construction remains in root;
* all 34 route definitions remain, with six debug routes controlled by the flag;
* debug responses, writes, events, jobs, and errors remain compatible;
* background startup and shutdown remain bounded with no duplicate intervals;
* complete read-only tree-hash proof passes;
* no protected JSON or package-manifest changes;
* no listener, child process, temporary file, or lock remains;
* only exact BR-01 through BR-12 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* the baseline fails;
* a route, debug guard, job order, lifecycle, event, persistence, response, or error behavior cannot be preserved;
* root cannot be made thin without a dependency, frontend, production, schema, or contract change;
* a read-only route writes;
* another production file is required without a plan amendment;
* cleanup leaves a listener, process, interval, temporary file, or lock;
* rollback cannot be limited to BR-12.

---

# Part 9 - Rollback

Restore the BR-11 root server composition and inline debug routes, remove the BR-12 runtime, debug router, and focused structural tests, and restore the previous endpoint-manifest source inspection.

No data rollback should be required. All route writes use in-memory or temporary fixture state.

---

# Part 10 - Completion Checklist

BR-12 completes only when:

* all debug routes live in their compatibility router;
* all feature composition lives in the compatibility runtime;
* root contains startup and shutdown wiring only;
* all route, job, feature, lifecycle, read-only, and full gates pass;
* evidence is archived;
* BR-13 is activated under the continuous-execution authority.

---

# Part 10A - Completion Evidence

Files created:

```text
src/bootstrap/createCompatibilityRuntime.js
src/transport/http/routes/matchupsDebugCompatibilityRouter.js
test/characterization/matchupsDebugCompatibility.test.js
test/characterization/rootServerBoundary.test.js
```

Files modified:

```text
server.js
test/helpers/readEndpointManifest.js
test/characterization/endpointManifest.test.js
```

Verified on 2026-07-18:

* the final focused endpoint, debug-route, runtime, root-boundary, and startup run passed 19 of 19 tests;
* the final characterization suite passed 160 of 160 tests;
* the complete Node suite passed 168 of 168 tests;
* syntax checks passed for root server, compatibility runtime, debug router, and endpoint-manifest helper;
* `npm.cmd run check` and `git diff --check` passed;
* root `server.js` is 50 lines and contains zero route handlers, feature imports, or filesystem calls;
* compatibility runtime construction does not listen;
* background startup is idempotent and preserves snapshot, auction, then ordered matchup scheduling;
* all six debug routes preserve disabled registration, body-role checks, response contracts, state changes, metadata, events, manual job behavior, placeholder normalization, and failure mapping;
* the compatibility endpoint inventory remained 34 total, six guarded debug routes, and 28 non-debug routes;
* complete read-only and feature characterization remained green through the full suite;
* protected league JSON and package-manifest hashes remained unchanged;
* no test listener, child server, temporary state file, or lock file remained;
* the pre-existing Node process remained PID 20636;
* the unrelated frontend worktree modification was preserved without change.

No feature behavior, dependency, schema, frontend, production data, deployment, seed, migration, or reset change was introduced.

---

# Part 11 - Next-Step Boundary

After BR-12 passes, archive it and activate:

```text
BR-13 - Refactor Completion Gate
```

No production, frontend, commit, push, merge, or deployment authority is included.
