# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-01
```

## Active Step

```text
Backend Refactor Step 1 - Configuration and Bootstrap
```

This work plan records the completed Backend Refactor Step 1 implementation.

Grae requested advancement from completed work item `BR-00`, approved adoption, and requested continuous backend-refactor execution on 2026-07-18. Local implementation and verification completed on 2026-07-18.

---

## Objective

Extract configuration and process-lifecycle concerns from the current root `server.js` into explicit, import-safe bootstrap modules while preserving compatibility behavior.

The step must prove:

* current environment-variable defaults and coercion remain unchanged;
* Express application construction does not listen, schedule jobs, or write files;
* HTTP and Socket.IO construction is explicit;
* current HTTP and Socket.IO origin decisions remain unchanged;
* startup still uses root `server.js`;
* graceful shutdown clears every tracked interval and closes the HTTP server;
* all 34 current route registrations remain present, including the six conditional matchup-debug routes;
* existing endpoint responses and read-only file-hash behavior remain characterized;
* the known missing Socket.IO application registration is preserved and documented for `BR-11`.

No feature route, service, calculation, repository behavior, league rule, API contract, or production configuration is replaced in this step.

---

## Repository

```text
C:\Users\graem\Desktop\hundo-leago-backend
```

Required branch:

```text
stage2
```

The frontend repository receives no application-code change in this work plan.

Canonical documentation remains in:

```text
C:\Users\graem\Desktop\hundo-leago\docs
```

---

# Part 1 - Authority and Prerequisites

## Required Reading

```text
../hundo-leago/AGENTS.md
AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/NORTH_STAR.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/01-project/PROJECT_SCOPE.md
../hundo-leago/docs/01-project/GLOSSARY.md
../hundo-leago/docs/04-technical-specs/ARCHITECTURE.md
../hundo-leago/docs/04-technical-specs/API_CONTRACTS.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/04-technical-specs/ENVIRONMENT_SETUP.md
../hundo-leago/docs/05-roadmap/ACTIVE_ROADMAP.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
../hundo-leago/docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
../hundo-leago/docs/06-work-plans/archive/BR-00_BASELINE_AND_SAFETY_HARNESS.md
```

When implementation begins, re-read the exact `BACKEND_REFACTOR.md` Step 1 section and this plan. Do not rely on a prior chat summary.

---

## Operating Mode

Reviewed mode:

```text
OFFSEASON_RESET
```

This step does not use reset authority. Tests use only handcrafted fixtures and operating-system temporary directories.

---

## Reviewed BR-00 Evidence

Work item `BR-00` is complete in backend commit:

```text
aa0718d Add BR-00 backend safety harness
```

Post-commit verification on 2026-07-18 confirmed:

* the focused characterization suite passed 16 of 16 tests;
* the complete Node test run passed 24 of 24 entries;
* the endpoint inventory remained 34 total, six debug, and 28 non-debug;
* `node --check server.js` passed;
* `git diff --check` passed;
* protected repository JSON hashes were unchanged;
* the backend worktree was clean on `stage2` and synchronized with `origin/stage2`.

The review found no material mismatch requiring a Testing Strategy change. The Windows-compatible quoted `*.test.js` pattern already matches the approved Testing Strategy.

---

## Reviewed Current Backend Facts

At plan creation:

* root `server.js` is the process entrypoint and starts listening during module evaluation;
* Express, HTTP, and Socket.IO construction occur at root scope;
* CORS uses a fixed compatibility allowlist plus the current `.netlify.app` suffix rule;
* no-origin requests are currently allowed through the CORS origin callback;
* JSON and URL-encoded body limits are both `10mb`;
* current compatibility configuration reads 13 environment variables directly from `process.env`;
* `PORT` defaults to `4000`;
* matchup debug and matchup jobs enable only when the exact value is `true`;
* snapshot and auction jobs enable unless the exact value is `false`;
* enabled jobs wake every 60 seconds;
* interval handles are not currently retained for graceful shutdown;
* root `server.js` has no current SIGINT or SIGTERM shutdown wiring;
* a Socket.IO server is constructed, but the current app never calls `app.set("io", io)`;
* handlers that call `app.get("io")` therefore preserve a known missing-publication defect;
* current startup ensures configured directories exist and may bootstrap a missing players file using current compatibility behavior;
* most feature handlers and all job functions remain in `server.js`;
* BR-00 tests start the current process only against explicit temporary paths with jobs disabled.

These are characterization facts. They do not approve the current compatibility configuration or CORS behavior as the Season 2 security target.

---

## Start Preconditions

Before editing:

1. Confirm the branch is still `stage2`.
2. Confirm `git status --short`.
3. Stop if unrelated changes overlap `server.js`, `package.json`, `test/`, or planned `src/config/` and `src/bootstrap/` paths.
4. Confirm operating mode remains `OFFSEASON_RESET`.
5. Re-run the BR-00 focused characterization suite.
6. Record hashes of existing repository JSON files.
7. Record Node processes already running.
8. Confirm every test storage variable resolves under a fresh operating-system temporary directory.
9. Confirm no test configuration references `/opt/render/project/data`.

Commands:

```powershell
git branch --show-current
git status --short
node --version
npm.cmd --version
npm.cmd run test:characterization
Get-ChildItem -File -Filter *.json | Get-FileHash -Algorithm SHA256
Get-Process node -ErrorAction SilentlyContinue
```

Expected branch:

```text
stage2
```

Preserve unrelated work. Do not stash, discard, stage, or commit it.

---

# Part 2 - Scope

## In Scope

This step may:

* parse current compatibility environment variables once;
* move compatibility path derivation and flag coercion into one configuration module;
* move the current origin allowlist and origin decision into configuration/bootstrap;
* create an Express application without listening;
* apply the current CORS and body-parser middleware through the application factory;
* construct the HTTP and Socket.IO servers without listening;
* compose the current filesystem and league-store dependencies explicitly;
* preserve current startup directory preparation and player-file bootstrap behavior behind explicit dependency creation;
* retain and clear interval handles;
* add bounded, idempotent SIGINT and SIGTERM shutdown wiring;
* add focused configuration, application-factory, CORS, HTTP-server, and shutdown characterization tests;
* minimally adapt existing child-server test helpers to prove graceful exit;
* update `server.js` only as required to use the new modules.

---

## Out of Scope

This step must not:

* move a feature route or inline route handler;
* move player, statistics, snapshot, auction, matchup, standings, or persistence feature logic;
* change an endpoint method, path, ordering, response, validation, or authorization behavior;
* fix the known stale player-cache reference defect;
* call `app.set("io", io)` or otherwise restore Socket.IO invalidation;
* add Socket.IO connection handlers, rooms, authentication, or new events;
* implement target environment variables such as `APP_ENV`, `FRONTEND_ORIGINS`, or `PUBLIC_FRONTEND_ORIGIN`;
* tighten current CORS behavior as a hidden security change;
* change current path defaults or production fallbacks;
* change flag truthiness, timer intervals, or job execution order;
* add structured logging;
* add SQLite or another dependency;
* implement authentication, permissions, CSRF, multi-league behavior, or new league rules;
* change repository JSON;
* access production storage or services;
* edit frontend application code;
* deploy, commit, or push without a separate request.

Known compatibility weaknesses remain assigned to their approved later work.

---

# Part 3 - Exact Files

## Modify

```text
server.js
test/helpers/startCompatibilityServer.js
test/characterization/serverStartup.test.js
```

`server.js` changes only to consume the new configuration/bootstrap modules, retain interval handles, and use explicit start and shutdown wiring.

The existing test helper and startup test change only as needed to prove bounded graceful SIGTERM shutdown and preserve useful startup failure output.

---

## Add Configuration

```text
src/config/loadConfig.js
```

---

## Add Bootstrap Modules

```text
src/bootstrap/createApplication.js
src/bootstrap/createHttpServer.js
src/bootstrap/createDependencies.js
src/bootstrap/shutdown.js
```

---

## Add Characterization Tests

```text
test/characterization/configBootstrap.test.js
test/characterization/corsCompatibility.test.js
test/characterization/shutdown.test.js
```

No production dependency is added. `package-lock.json` remains unchanged.

If implementation requires another production source path, another test helper, or a package change, stop and revise the active plan before proceeding.

---

# Part 4 - Module Design

## `src/config/loadConfig.js`

Responsibilities:

* accept an explicit environment object for tests and default to `process.env` only at the process boundary;
* accept the backend root and a filesystem-existence seam needed for current stats-path selection;
* parse every current compatibility variable once;
* preserve the exact current default and coercion behavior;
* return named values for:
  * Node environment;
  * port;
  * league-state path;
  * snapshots path;
  * players path;
  * statistics path;
  * backups path;
  * maximum backups;
  * matchup-debug flag;
  * matchup-jobs flag;
  * snapshot-jobs flag;
  * auction-jobs flag;
  * statistics-refresh token;
  * current compatibility origins;
  * current one-minute job interval;
* provide or compose the current origin predicate without broadening or narrowing it;
* perform no directory creation, file copy, listener creation, timer scheduling, logging, or network access.

Exact compatibility semantics remain:

```text
PORT: process value or 4000
MATCHUPS_DEBUG: enabled only for "true"
MATCHUPS_ENABLED: enabled only for "true"
SNAPSHOTS_ENABLED: disabled only for "false"
AUCTIONS_ENABLED: disabled only for "false"
MAX_BACKUPS: current Number(... ) || 200 behavior
```

The target Environment Setup validation contract is not implemented in BR-01.

---

## `src/bootstrap/createApplication.js`

Responsibilities:

* create a new Express application when called;
* install current credentialed CORS middleware using the injected compatibility origin predicate;
* install JSON parsing with the current `10mb` limit;
* install URL-encoded parsing with the current `extended: true` and `10mb` settings;
* return the application without listening;
* accept injected Express/CORS dependencies where useful for focused tests;
* perform no filesystem write, player bootstrap, job scheduling, Socket.IO construction, or signal registration.

Existing route registrations remain in their current files and root `server.js` during BR-01.

---

## `src/bootstrap/createHttpServer.js`

Responsibilities:

* construct the Node HTTP server around an injected Express application;
* construct the Socket.IO server with the current methods, credentials, and origin callback;
* expose an explicit bounded listen operation used by root `server.js`;
* return the HTTP and Socket.IO instances needed for shutdown;
* perform no listening during module import or factory construction;
* preserve current startup output through the root entrypoint.

The factory must not attach Socket.IO to the Express app. The missing:

```text
app.set("io", io)
```

remains intentionally absent until `BR-11`.

---

## `src/bootstrap/createDependencies.js`

Responsibilities:

* serve as the explicit composition root for current bootstrap dependencies;
* receive parsed configuration rather than reading `process.env`;
* create the current league store with the same paths and maximum-backup value;
* preserve current directory preparation and missing-player-file bootstrap behavior;
* return explicit filesystem, path, league-store, and configuration dependencies consumed by current root feature code;
* run side effects only when the factory is explicitly called by the entrypoint;
* support injected filesystem and league-store factory seams for isolated tests;
* never fall back from an explicit test path to repository or production storage.

This module does not introduce a repository abstraction or change `leagueStore.js`; that boundary belongs to `BR-10`.

---

## `src/bootstrap/shutdown.js`

Responsibilities:

* track interval handles created by current startup wiring;
* clear every tracked interval exactly once;
* close Socket.IO and the HTTP server in a bounded, awaited sequence;
* handle a server that has not started or has already closed;
* make repeated shutdown calls idempotent;
* register at most one handler for each intended process signal when explicitly requested by root `server.js`;
* remove signal listeners during test teardown or explicit disposal;
* return a promise that tests can await;
* avoid `process.exit()` inside reusable module logic.

The root entrypoint may set a failure exit code after a shutdown failure, but tests must not terminate their own process.

---

## Root `server.js`

After BR-01:

* remains the CommonJS process entrypoint;
* calls `loadConfig()` once;
* calls the bootstrap factories explicitly;
* continues to own all current feature handlers and job functions;
* registers all current routes in the same effective order;
* starts the same enabled jobs in the same order;
* uses the same one-minute interval;
* retains each interval handle for shutdown;
* invokes the explicit listen operation with the current port;
* registers bounded shutdown only when running as the process entrypoint.

BR-01 does not attempt to make root `server.js` thin. That is the `BR-12` gate.

---

# Part 5 - Characterization and Test Cases

## Configuration

`configBootstrap.test.js` asserts:

* an empty environment produces the current port, path, backup, flag, and interval defaults;
* every explicit compatibility path is preserved exactly;
* the current Render-derived players and statistics path rules are unchanged;
* local statistics-file selection uses the injected existence check;
* maximum-backup coercion matches current behavior;
* exact lowercase `true` and `false` flag behavior is unchanged;
* an absent statistics-refresh token remains an empty compatibility value;
* loading configuration alone creates no file, directory, timer, listener, or server.

Tests do not print token values.

---

## Application Factory

`configBootstrap.test.js` also asserts:

* creating an application does not make an HTTP server listen;
* creating an application does not schedule timers;
* middleware accepts the same body-size settings;
* independent calls return independent Express applications;
* importing all five new modules has no startup side effect.

---

## CORS Compatibility

`corsCompatibility.test.js` uses a test-owned loopback listener and asserts current behavior for:

```text
no Origin header
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174
https://hundoleago.netlify.app
an arbitrary current *.netlify.app preview origin
a disallowed non-Netlify origin
a malformed origin
```

For allowed browser origins, the test checks the current access-control origin and credentials headers.

For disallowed and malformed origins, the test records the current Express and Socket.IO callback result without replacing it with the target Security behavior.

---

## HTTP and Socket.IO Construction

Focused tests assert:

* factory construction does not listen;
* listening uses the supplied loopback host and ephemeral test port;
* the returned Socket.IO server uses the same current CORS decision;
* `app.get("io")` remains undefined after construction;
* no connection handler or room behavior is added;
* shutdown closes the test-owned listener.

---

## Shutdown

`shutdown.test.js` asserts:

* every registered interval handle is cleared;
* multiple shutdown calls do not clear or close twice;
* a never-started server is handled safely;
* a listening server stops accepting requests;
* Socket.IO close completes or reports a bounded failure;
* installed SIGTERM and SIGINT handlers can be disposed during teardown;
* no timer, listener, or child process remains after the test.

The existing child-process startup test sends SIGTERM through its normal stop helper and confirms a bounded clean exit.

---

## Compatibility Regression

The complete BR-00 suite must continue to prove:

* 34 total route registrations;
* six conditional matchup-debug routes;
* 28 non-debug routes;
* current route ordering;
* current response statuses and safe body shapes;
* current league-store behavior;
* current GET requests do not change the temporary runtime tree;
* repository fixture sources remain unchanged;
* child processes terminate.

The source-level manifest remains authoritative for the exact count in BR-01 because inline route registration is intentionally not moved. HTTP characterization continues to supply runtime proof. A full importable compatibility-router manifest is deferred until route registration can be separated without moving feature code outside the numbered sequence.

---

# Part 6 - Implementation Order

Perform the work in this exact order:

1. Record branch, status, Node processes, and repository JSON hashes.
2. Re-run the complete BR-00 characterization suite.
3. Add `loadConfig.js`.
4. Add configuration tests and make exact default/coercion tests pass.
5. Add `createApplication.js`.
6. Add application-factory and Express CORS tests.
7. Add `createHttpServer.js`.
8. Add HTTP and Socket.IO construction tests, including proof that `app.get("io")` remains undefined.
9. Add `createDependencies.js`.
10. Characterize dependency creation only against temporary paths.
11. Add `shutdown.js`.
12. Add interval, server-close, signal-disposal, and idempotency tests.
13. Update `server.js` to consume the new modules without moving feature code.
14. Update only the existing startup helper/test needed for graceful child shutdown proof.
15. Run the focused BR-01 tests.
16. Run the focused BR-00 characterization suite.
17. Run the complete test suite.
18. Run syntax checks on root and every new source module.
19. Run whitespace, status, repository-data hash, and Node-process checks.
20. Record completion evidence.
21. Stop before `BR-02`.

Do not fix a discovered feature, CORS, Socket.IO, or persistence defect while moving bootstrap code.

---

# Part 7 - Verification

## Focused Commands

From:

```text
C:\Users\graem\Desktop\hundo-leago-backend
```

run:

```powershell
node --test test/characterization/configBootstrap.test.js
node --test test/characterization/corsCompatibility.test.js
node --test test/characterization/shutdown.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/config/loadConfig.js
node --check src/bootstrap/createApplication.js
node --check src/bootstrap/createHttpServer.js
node --check src/bootstrap/createDependencies.js
node --check src/bootstrap/shutdown.js
git diff --check
git status --short
```

Expected:

* every focused BR-01 test passes;
* the complete BR-00 characterization suite still passes;
* the complete Node test suite passes;
* all syntax checks pass;
* no whitespace error is reported;
* only planned BR-01 files are changed;
* `package.json`, `package-lock.json`, `leagueStore.js`, `routes/`, scripts, repository JSON, and frontend application code remain unchanged.

---

## Repository Data Hash Proof

Before tests:

```powershell
$protected = Get-ChildItem -File -Filter *.json |
  Where-Object Name -ne 'package.json' |
  Where-Object Name -ne 'package-lock.json'
$before = $protected | Get-FileHash -Algorithm SHA256
```

After tests:

```powershell
$after = $protected | Get-FileHash -Algorithm SHA256
Compare-Object `
  ($before | ForEach-Object { "$($_.Path)|$($_.Hash)" }) `
  ($after | ForEach-Object { "$($_.Path)|$($_.Hash)" })
```

Expected:

```text
no output
```

No test may rewrite a repository file and restore it merely to make the final hash pass.

---

## Process and Timer Safety

Record Node processes before and after:

```powershell
Get-Process node -ErrorAction SilentlyContinue
```

No BR-01 child process may remain. Focused tests must also prove that no test-owned HTTP listener or interval remains active.

---

# Part 8 - Risks and Controls

| Risk | Control |
| --- | --- |
| Importing bootstrap starts the server | Factories perform work only when called; direct import tests assert no listener |
| Configuration extraction changes defaults | Table-driven tests cover every compatibility variable and fallback |
| Test path falls back to repository or production | Explicit temporary paths plus health-path and `/opt/render/project/data` refusal |
| CORS changes during movement | HTTP and Socket.IO origin matrix records exact compatibility behavior |
| Socket.IO defect is silently fixed | Assert `app.get("io")` remains undefined; assign restoration to BR-11 |
| Job order or frequency changes | Preserve current flag semantics, immediate calls, and 60-second intervals |
| Interval survives shutdown | Retain every handle and assert all are cleared |
| Signal listeners leak between tests | Explicit disposer and teardown assertions |
| Shutdown hangs | Bounded close operations and useful safe failure output |
| Dependency composition writes on import | Side effects occur only through explicit `createDependencies()` |
| Player bootstrap touches real data | Dependency tests use a new temporary runtime only |
| Endpoint ordering changes | Existing explicit 34/6/28 manifest and route-order tests remain |
| Step expands into feature extraction | Exact source allowlist and stop condition |

---

# Part 9 - Rollback

BR-01 changes no schema and requires no data migration.

Rollback removes only:

```text
src/config/loadConfig.js
src/bootstrap/createApplication.js
src/bootstrap/createHttpServer.js
src/bootstrap/createDependencies.js
src/bootstrap/shutdown.js
test/characterization/configBootstrap.test.js
test/characterization/corsCompatibility.test.js
test/characterization/shutdown.test.js
```

and restores only the BR-01 edits in:

```text
server.js
test/helpers/startCompatibilityServer.js
test/characterization/serverStartup.test.js
```

Do not use:

```text
git reset --hard
git checkout -- .
```

when unrelated work exists.

If committed, normal rollback is a focused commit revert. No data rollback should be required because tests and dependency characterization use temporary paths only.

---

# Part 10 - Stop Conditions

Stop BR-01 and report evidence when:

* the backend branch is not `stage2`;
* overlapping local changes are present;
* BR-00 tests do not pass before editing;
* a configuration default or coercion cannot be preserved;
* importing a new module listens, schedules, writes, or registers process signals;
* an explicit test path leaves the operating-system temporary root;
* any test path references `/opt/render/project/data`;
* endpoint inventory differs from 34/6/28;
* route ordering or a response contract changes;
* a GET changes a fixture or repository hash;
* CORS behavior differs from the characterized matrix;
* `app.get("io")` becomes defined;
* a job flag, immediate invocation, order, or interval changes;
* shutdown cannot close timers and the HTTP server reliably;
* a test-owned process, listener, or timer remains;
* implementation requires moving feature code;
* implementation requires a file outside the exact plan;
* `package.json`, a dependency, `leagueStore.js`, a route module, or frontend code must change;
* rollback cannot be limited to BR-01 files.

A stop condition is not permission to broaden the step.

---

# Part 11 - Completion Checklist

BR-01 is complete only when:

* all preconditions are recorded;
* current compatibility configuration is parsed once;
* no feature code reads `process.env` directly after the planned extraction;
* the Express application factory does not listen;
* HTTP and Socket.IO construction is explicit;
* current CORS behavior is characterized and unchanged;
* root `server.js` remains the entrypoint;
* current routes, flags, job order, and intervals remain unchanged;
* the missing Socket.IO app registration remains documented and unchanged;
* every interval handle is retained and cleared during shutdown;
* shutdown is bounded and idempotent;
* focused and complete tests pass;
* syntax and whitespace checks pass;
* repository JSON hashes are unchanged;
* no production data or service was touched;
* exact files and evidence are reported;
* implementation stops before `BR-02`.

---

# Part 12 - Completion Record Template

When BR-01 is implemented, append or report:

```text
Work plan: BR-01
Branch:
Starting Git status:
Objective:
Exact files changed:
Behavior changed:
Behavior intentionally preserved:
Configuration proof:
CORS proof:
Application-factory proof:
Shutdown proof:
Commands run:
Results:
Fixture runtime roots:
Pre/post repository hashes:
Process and timer cleanup:
Known test not run:
Discovered current defects:
Rollback:
Ending Git status:
Next proposed work item: BR-02
```

Do not mark the plan complete until actual command results are available.

---

# Part 13 - Next-Step Boundary

After BR-01 passes, the next proposed work item is:

```text
BR-02 - Player Read and Reload Module
```

Before BR-02 begins:

* archive or mark BR-01 complete;
* update the Active Work Plan to BR-02;
* review BR-01 evidence;
* review the known stale player-cache reference defect against the BR-02 extraction;
* inspect the worktree;
* receive Grae's request to continue.

BR-01 does not pre-authorize BR-02.

---

# Part 14 - Completion Record

```text
Work plan: BR-01
Branch: stage2
Starting Git status: clean at aa0718d, synchronized with origin/stage2
Objective: Extract current compatibility configuration and process lifecycle into explicit bootstrap modules without changing feature behavior.
Exact files changed: server.js; src/config/loadConfig.js; src/bootstrap/createApplication.js; src/bootstrap/createHttpServer.js; src/bootstrap/createDependencies.js; src/bootstrap/shutdown.js; test/characterization/configBootstrap.test.js; test/characterization/corsCompatibility.test.js; test/characterization/shutdown.test.js; test/characterization/serverStartup.test.js; test/helpers/startCompatibilityServer.js.
Behavior changed: Configuration and bootstrap responsibilities now have import-safe modules; server intervals are retained; SIGINT and SIGTERM perform bounded graceful shutdown.
Behavior intentionally preserved: All 34 route registrations; six conditional matchup-debug routes; current response contracts; current environment defaults and coercion; current CORS decisions; current job enablement, order, and one-minute intervals; current JSON behavior; missing Socket.IO application registration.
Configuration proof: Eight focused configuration/dependency tests passed; all 13 compatibility environment reads moved out of feature code; explicit dependency tests wrote only below an operating-system temporary root.
CORS proof: Fixed browser origins, current Netlify preview suffix, no-origin requests, disallowed origins, malformed origins, credentials headers, and Socket.IO origin callbacks matched current behavior.
Application-factory proof: Independent Express applications and HTTP/Socket.IO servers construct without listening; app.get("io") remains undefined.
Shutdown proof: Tracked intervals clear once; shutdown is idempotent; a real loopback server closes; SIGINT/SIGTERM handlers install once and dispose; the child compatibility server exits on SIGTERM.
Commands run: node --test focused BR-01 files; npm.cmd run test:characterization; npm.cmd test; npm.cmd run check; node --check for every new source module; git diff --check; SHA-256 comparison; Node-process comparison; process.env source search.
Results: 33/33 characterization tests passed; 41/41 complete Node test entries passed; all syntax and whitespace checks passed; endpoint inventory remained 34/6/28.
Fixture runtime roots: New hundo-leago-br01-deps-* and BR-00 compatibility runtime directories below the operating-system temporary root; removed during teardown.
Pre/post repository hashes: Protected repository JSON files were identical before and after all BR-01 tests.
Process and timer cleanup: Node process IDs matched before and after verification; no test listener, timer, or child server remained.
Known test not run: None.
Discovered current defects: None beyond the already documented stale player-cache references and missing Socket.IO application registration. Windows path separators were characterized using Node's current platform path behavior.
Rollback: Remove only the five new src configuration/bootstrap files and three new characterization files; restore only BR-01 edits in server.js, serverStartup.test.js, and startCompatibilityServer.js.
Ending Git status: BR-01 source and tests are locally modified/untracked on stage2; no file is staged, committed, pushed, merged, or deployed.
Next proposed work item: BR-02
```

BR-01 is complete locally. It is intentionally uncommitted because no commit or push was requested.

---

# Document Verification

```powershell
Get-Content ..\hundo-leago\docs\06-work-plans\archive\BR-01_CONFIGURATION_AND_BOOTSTRAP.md
Select-String -Path ..\hundo-leago\docs\06-work-plans\archive\BR-01_CONFIGURATION_AND_BOOTSTRAP.md -Pattern '^`APPROVED`$','^`COMPLETE`$','BR-01','Completion Record'
```

Expected:

* the archived plan is approved and complete;
* BR-01 evidence is recorded;
* exact files, tests, commands, risks, rollback, and stop conditions are defined;
* the plan contains no feature extraction, SQLite migration, frontend change, production operation, commit, push, or deployment authority.
