# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-00
```

## Active Step

```text
Backend Refactor Step 0 - Baseline and Safety Harness
```

This work plan records the completed Backend Refactor Step 0 implementation.

Grae delegated the technical planning decisions and approved adoption of this work plan on 2026-07-18. Grae requested execution, and local implementation and verification completed on 2026-07-18.

---

## Objective

Create an isolated characterization-test foundation around the current backend before moving feature code.

The step must prove:

* the current compatibility endpoint inventory;
* the current server can start against copied synthetic data;
* read-only endpoints do not change fixture files;
* current league-store save, backup, restore, queue, and failure behavior is characterized;
* tests never write to repository or production data paths;
* later refactor steps can detect accidental behavior changes.

No application feature is moved in this step.

---

## Repository

```text
C:\Users\graem\Desktop\hundo-leago-backend
```

Reviewed branch:

```text
stage2
```

The frontend repository receives no code change in this work plan.

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
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/01-project/PROJECT_SCOPE.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/04-technical-specs/ARCHITECTURE.md
../hundo-leago/docs/04-technical-specs/API_CONTRACTS.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/05-roadmap/ACTIVE_ROADMAP.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
```

When implementation begins, re-read the exact `BACKEND_REFACTOR.md` Step 0 section and this plan. Do not rely on a prior chat summary.

---

## Operating Mode

Reviewed mode:

```text
OFFSEASON_RESET
```

The step uses only synthetic fixtures and operating-system temporary directories. The reset permission is not used.

---

## Reviewed Backend Facts

At plan creation:

* branch is `stage2`;
* the backend worktree reported no local modifications;
* runtime is Node.js and CommonJS;
* `package.json` still has a failing placeholder `npm test`;
* root `server.js` starts the process immediately and owns most routes, jobs, and feature logic;
* three route modules already exist under `routes/`;
* 34 literal HTTP route registrations exist when matchup debug is included;
* six of those routes are matchup-debug routes;
* 28 routes remain when matchup debug is disabled;
* scheduled snapshots and auctions default on unless explicitly disabled;
* the backend accepts explicit paths for league, player, statistics, snapshots, and backups;
* `leagueStore.js` exposes load, save, list-backup, and restore behavior;
* no test directory currently exists.

These are reviewed facts, not permission to preserve known insecurity in the Season 2 target.

---

## Start Preconditions

Before editing:

1. Confirm the branch is still `stage2`.
2. Confirm `git status --short`.
3. Stop if unrelated changes overlap `package.json`, `server.js`, `leagueStore.js`, `routes/`, or the planned `test/` paths.
4. Confirm the canonical operating mode.
5. Confirm no test environment variable points to `/opt/render/project/data`, a live Render disk, or repository data.
6. Record hashes of existing repository data files without modifying them.
7. Confirm no backend server from an earlier test is still running.

Commands:

```powershell
git status --short
git branch --show-current
node --version
npm --version
Get-ChildItem -File -Filter *.json | Get-FileHash -Algorithm SHA256
```

Expected branch:

```text
stage2
```

If the worktree is not clean, preserve the existing changes and determine whether they overlap before proceeding.

---

# Part 2 - Scope

## In Scope

This step may:

* replace the placeholder test script with Node's built-in test runner;
* add test-only helpers;
* add small synthetic JSON fixtures;
* add endpoint-manifest characterization;
* spawn the current server as a child process with explicit temporary paths;
* send local HTTP requests to that child process;
* characterize read-only file behavior;
* directly test `leagueStore.js` against temporary copies;
* capture current response statuses and safe body shapes;
* document any discovered current defect without fixing it.

---

## Out of Scope

This step must not:

* move or rewrite route handlers;
* split `server.js`;
* change `leagueStore.js`;
* fix Socket.IO registration;
* change CORS;
* change endpoint methods, paths, responses, or permissions;
* add SQLite or any other production dependency;
* pin the future SQLite Node runtime;
* add authentication;
* implement multi-league behavior;
* change league rules;
* run a reset;
* edit repository JSON;
* access production storage;
* edit frontend code;
* deploy, commit, or push without a separate request.

If a characterization test reveals a defect, record it. Do not expand `BR-00` into the fix.

---

# Part 3 - Exact Files

## Modify

```text
package.json
```

Only the `scripts` object changes.

Target scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node --test",
    "test:characterization": "node --test \"test/characterization/*.test.js\"",
    "check": "node --check server.js"
  }
}
```

Existing dependency versions and all other package fields remain unchanged.

`package-lock.json` must remain unchanged because no dependency is added.

---

## Add Helpers

```text
test/helpers/createFixtureRuntime.js
test/helpers/hashTree.js
test/helpers/findAvailablePort.js
test/helpers/startCompatibilityServer.js
test/helpers/httpRequest.js
test/helpers/readEndpointManifest.js
test/helpers/fixedClock.js
test/helpers/fakePublisher.js
```

---

## Add Synthetic Fixtures

```text
test/fixtures/minimal/league-state.json
test/fixtures/minimal/players.json
test/fixtures/minimal/stats-cache.json
```

Fixtures must be handcrafted and contain no copied production email, password, token, bid, private history, or other sensitive value.

They contain only enough data to characterize:

* one league-state shape;
* two teams;
* a minimal matchup week;
* one known F player;
* one known D player;
* a minimal statistics snapshot;
* league-store save and restore behavior.

Synthetic IDs use obvious test-only values.

---

## Add Characterization Tests

```text
test/characterization/endpointManifest.test.js
test/characterization/serverStartup.test.js
test/characterization/readOnlyEndpoints.test.js
test/characterization/leagueStore.test.js
```

No production source file is modified to make these tests easier.

---

# Part 4 - Test-Helper Design

## `createFixtureRuntime.js`

Responsibilities:

* create a new directory with `fs.mkdtemp` under `os.tmpdir()`;
* copy only files from `test/fixtures/minimal/`;
* create empty `snapshots/` and `backups/` directories;
* return absolute paths for every test environment variable;
* provide cleanup through `fs.rm(..., { recursive: true, force: true })`;
* refuse a runtime root outside `os.tmpdir()`;
* refuse a path containing `/opt/render/project/data`;
* never use a repository root as a writable runtime.

Cleanup runs through test teardown even after assertion failure.

---

## `hashTree.js`

Responsibilities:

* recursively list regular files in a supplied root;
* sort by normalized relative path;
* calculate SHA-256 for each file;
* return path, byte size, and hash;
* optionally ignore explicitly named transient test artifacts;
* never follow a symlink outside the supplied root.

Read-only endpoint proof compares the complete fixture-runtime tree after startup and again after the GET requests.

---

## `findAvailablePort.js`

Responsibilities:

* ask the operating system for an available loopback port;
* bind only to `127.0.0.1`;
* close the probe server before returning;
* provide a bounded retry when the child process encounters a port race.

No fixed development or production port is assumed.

---

## `startCompatibilityServer.js`

The helper spawns:

```text
node server.js
```

with an explicit test environment:

```text
NODE_ENV=test
PORT=<temporary-loopback-port>
LEAGUE_FILE=<temp>\league-state.json
PLAYERS_FILE=<temp>\players.json
STATS_FILE=<temp>\stats-cache.json
SNAPSHOT_DIR=<temp>\snapshots
BACKUPS_DIR=<temp>\backups
MAX_BACKUPS=10
SNAPSHOTS_ENABLED=false
AUCTIONS_ENABLED=false
MATCHUPS_ENABLED=false
MATCHUPS_DEBUG=<true-or-false>
STATS_REFRESH_TOKEN=characterization-test-only
```

Requirements:

* use `spawn` with an argument array and no shell;
* preserve a bounded stdout and stderr buffer for failures;
* poll `GET /health` until ready or timeout;
* confirm health-reported paths are under the temporary runtime before other requests;
* terminate the child in teardown;
* wait for exit;
* force termination only after a bounded graceful timeout;
* fail the test if the child remains alive;
* never inherit production path or secret variables for the listed keys.

The helper does not import `server.js` into the test process because current import has process-start side effects. Step BR-01 will create an application factory that can be imported safely.

---

## `httpRequest.js`

Responsibilities:

* use Node's built-in `fetch`;
* send requests only to the loopback base URL supplied by the test server helper;
* return status, selected headers, parsed JSON when valid, and text otherwise;
* apply a bounded request timeout;
* never retry a write request.

No external HTTP dependency is added.

---

## `readEndpointManifest.js`

Responsibilities:

* read only `server.js` and `routes/*.js`;
* find literal `app.get`, `app.post`, `app.put`, `app.patch`, and `app.delete` registrations;
* count only paths beginning with `/`;
* ignore `app.get("io")`;
* normalize method and literal path;
* sort deterministically;
* classify `/api/matchups/debug/*` as conditional debug routes;
* compare against the explicit compatibility manifest from `API_CONTRACTS.md`.

This is a source-level characterization for BR-00. BR-01 replaces or supplements it with a runtime application-router manifest after an import-safe application factory exists.

---

## `fixedClock.js`

Provides a test-only clock with:

```text
nowMs()
set(ms)
advance(ms)
```

It validates safe integer UTC milliseconds.

BR-00 does not inject it into current feature code. Later extraction steps pass it to pure domain and job modules.

---

## `fakePublisher.js`

Provides a test-only publisher that:

* records event name and cloned payload;
* supports inspection in call order;
* can be configured to fail the next publication;
* exposes a clear method;
* performs no network or Socket.IO action.

BR-00 uses it for helper contract tests only. Later steps inject it into services.

---

# Part 5 - Test Cases

## Endpoint Manifest

`endpointManifest.test.js` asserts:

* 34 unique method-and-path registrations with matchup debug included;
* exactly six paths under `/api/matchups/debug/`;
* 28 registrations after those six are excluded;
* no duplicate method-and-path pair;
* every expected API Contracts compatibility route exists;
* route ordering preserves `/api/players/debug` before `/api/players/:id`;
* the debug registrations remain under the current `MATCHUPS_DEBUG` condition.

The expected manifest is written explicitly in the test. It is not generated from the same source it tests.

---

## Server Startup

`serverStartup.test.js` starts the current process against the temporary runtime with all jobs disabled.

It asserts:

* the process reaches readiness within the timeout;
* `GET /` returns the current plain-text response;
* `GET /health` returns the current safe characterization shape;
* health paths point only inside the temporary runtime;
* the child exits during teardown;
* source fixtures and the temporary runtime behave as characterized.

The test does not treat the current health disclosure as approved Season 2 security behavior.

---

## Read-Only Endpoints

`readOnlyEndpoints.test.js` starts the child with `MATCHUPS_DEBUG=true` and calls every current GET route with a safe representative request:

```text
/
/health
/api/league
/api/players
/api/players?query=<synthetic-name>&limit=25
/api/players/debug
/api/players/<known-synthetic-id>
/api/players/not-a-number
/api/stats
/api/stats?playerId=<known-synthetic-id>
/api/stats/debug
/api/stats/debug-localpath
/api/snapshots
/api/backups
/api/matchups/current
/api/matchups/standings
/api/matchups/locks
/api/matchups/locks/preview
/api/matchups/baseline/preview
/api/matchups/baseline/status
/api/matchups/scoring/preview
/api/matchups/rollover/status
/api/matchups/debug/stateSummary
```

For each representative request, the test records the current:

* status;
* content type;
* stable response keys;
* approved or known-sensitive compatibility facts where applicable.

The test:

1. starts the server;
2. waits for startup side effects to finish;
3. hashes the entire temporary runtime;
4. performs the GET requests;
5. hashes the runtime again;
6. asserts identical path, size, and hash lists.

No GET may seed, save, normalize-and-write, back up, restore, refresh, or repair a fixture.

---

## League Store

`leagueStore.test.js` imports only `createLeagueStore` and uses a fresh temporary runtime for each test.

It characterizes:

* load of valid JSON;
* load of missing JSON without creating a file;
* load of malformed JSON returning the current load-error state without overwriting source;
* normalization of the minimal fixture;
* save through temporary-file rename;
* pre-write backup creation;
* backup listing order and limit;
* restore from a valid backup;
* missing-backup rejection;
* queued concurrent saves preserving call order;
* simulated `renameSync` failure rejecting the save while the prior live file hash remains unchanged;
* no writes outside the temporary runtime.

The simulated rename failure uses a narrowly scoped Node test mock, restores the original function in teardown, and runs without concurrency inside that test file.

If actual current behavior differs from the approved Backend Refactor characterization statement, record the discrepancy and stop before changing production code.

---

# Part 6 - Implementation Order

Perform the work in this exact order:

1. Record branch, status, runtime, and repository JSON hashes.
2. Add the synthetic fixture files.
3. Add `createFixtureRuntime.js` and `hashTree.js`.
4. Test the two fixture helpers.
5. Add `fixedClock.js` and `fakePublisher.js` with helper tests in the applicable characterization files.
6. Add `readEndpointManifest.js`.
7. Add `endpointManifest.test.js` and make its exact 34/6/28 assertions pass.
8. Add loopback port, HTTP, and child-server helpers.
9. Add `serverStartup.test.js`.
10. Add `readOnlyEndpoints.test.js`.
11. Add `leagueStore.test.js`.
12. Update only the `package.json` scripts.
13. Run the focused characterization suite.
14. Run the complete test suite.
15. Run syntax, whitespace, status, and repository-data hash checks.
16. Record the completion evidence.
17. Stop before BR-01.

Do not modify source behavior to make a characterization expectation pass.

---

# Part 7 - Verification

## Focused Commands

From:

```text
C:\Users\graem\Desktop\hundo-leago-backend
```

run:

```powershell
npm run test:characterization
npm test
npm run check
git diff --check
git status --short
```

Expected:

* all tests pass;
* `server.js` syntax passes;
* no whitespace errors;
* only `package.json` and new `test/` files belong to BR-00;
* `package-lock.json`, `server.js`, `leagueStore.js`, `routes/`, scripts, and repository JSON remain unchanged.

---

## Repository Data Hash Proof

Before tests:

```powershell
$protected = Get-ChildItem -File -Filter *.json | Where-Object Name -ne 'package.json' | Where-Object Name -ne 'package-lock.json'
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

Also confirm:

```powershell
Get-ChildItem -File -Filter *.json | Get-FileHash -Algorithm SHA256
```

No test is permitted to rewrite a repository JSON file and then restore its old content merely to make the final hash pass.

---

## Child-Process Safety Check

After the suite:

```powershell
Get-Process node -ErrorAction SilentlyContinue
```

Review the result against Node processes that were already running before the test. No BR-00 child server may remain.

The test output on failure must print its bounded child stdout/stderr and temporary runtime path for diagnosis. Cleanup still runs unless an explicit test-debug retention flag is deliberately added later.

---

# Part 8 - Risks and Controls

| Risk | Control |
| --- | --- |
| Test writes repository or production data | Every writable path is explicit and under `os.tmpdir()` |
| Default snapshot or auction job writes | Set all three job flags explicitly to `false` |
| Child process inherits a production path | Override every storage variable and verify `/health` paths |
| Child server remains running | Teardown, bounded graceful exit, then bounded force termination |
| Port conflict creates flaky tests | Loopback free-port helper with bounded retry |
| Manifest regex counts `app.get("io")` | Count only literal paths beginning with `/` |
| Source parser proves itself | Compare against an explicit independently written manifest |
| Mutable fixture leaks between tests | New temporary copy for every test |
| Mocked filesystem function leaks | Restore in teardown and disable concurrency for that case |
| Current defect gets silently fixed | Characterize, document, and stop before behavior changes |
| Test output exposes local paths | Paths may appear only in local failure output, never public API changes |
| Large current player data enters Git | Use two handcrafted synthetic players only |
| Step expands into refactor | Source files other than `package.json` remain unchanged |

---

# Part 9 - Rollback

BR-00 changes no production source behavior and no schema.

Rollback removes only:

```text
test/
```

and restores only the prior `package.json` scripts.

Do not use:

```text
git reset --hard
git checkout -- .
```

when unrelated work exists.

If the step is committed, normal rollback is a focused commit revert. If it is uncommitted, remove only the exact BR-00 additions and script edits after confirming their paths.

No data rollback should be necessary because repository and production data are never written.

---

# Part 10 - Stop Conditions

Stop BR-00 and report evidence when:

* the branch is not `stage2`;
* overlapping local work is present;
* any resolved test path leaves the OS temporary root;
* any path references `/opt/render/project/data`;
* a GET changes a fixture hash;
* a test changes repository JSON;
* the endpoint count is not 34/6/28;
* current behavior cannot be characterized without modifying source;
* the current server cannot be terminated reliably;
* `leagueStore` failure behavior risks a non-temporary file;
* a required change extends beyond `package.json` and `test/`;
* rollback cannot be limited to BR-00 files.

A stop condition is not permission to broaden the step.

---

# Part 11 - Completion Checklist

BR-00 is complete only when all of the following are true:

* plan preconditions were recorded;
* every fixture is synthetic;
* every writable runtime path is temporary;
* package scripts use Node's built-in test runner;
* exact endpoint manifest passes at 34 total, six debug, and 28 non-debug;
* server starts against copied synthetic state;
* all current GET requests leave the runtime tree unchanged;
* league-store load, save, backup, restore, queue, and failure behavior is characterized;
* child processes terminate;
* complete tests pass;
* syntax check passes;
* `git diff --check` passes;
* repository JSON hashes are unchanged;
* no production data or service was touched;
* exact files and verification results are reported;
* implementation stops before BR-01.

---

# Part 12 - Completion Record Template

When BR-00 is implemented, append or report:

```text
Work plan: BR-00
Branch:
Starting Git status:
Objective:
Exact files changed:
Behavior changed:
Behavior intentionally preserved:
Tests added:
Commands run:
Results:
Fixture runtime root:
Pre/post repository hashes:
Child process cleanup:
Known test not run:
Discovered current defects:
Rollback:
Ending Git status:
Next proposed work item: BR-01
```

Do not mark the plan complete until actual command results are available.

---

# Part 13 - Next-Step Boundary

After BR-00 passes, the next proposed work item is:

```text
BR-01 - Configuration and Bootstrap
```

Before BR-01 begins:

* archive or mark BR-00 complete;
* update this Active Work Plan to BR-01;
* review the completed evidence;
* review the approved Testing Strategy against the observed BR-00 evidence and update it only if implementation reveals a material mismatch;
* inspect the worktree;
* receive Grae's request to continue.

BR-00 does not pre-authorize BR-01.

---

# Part 14 - Completion Record

```text
Work plan: BR-00
Branch: stage2
Starting Git status: clean
Objective: Add an isolated baseline and safety harness before feature extraction.
Behavior changed: No backend feature, API, persistence, frontend, production, or deployment behavior changed.
Behavior intentionally preserved: All 34 current route registrations, including six conditional matchup-debug routes; current startup behavior; current GET response behavior; current JSON league-store behavior.
Tests added: 16 focused characterization tests plus reusable temporary-runtime helpers and three handcrafted fixtures.
Commands run: npm.cmd run test:characterization; npm.cmd test; npm.cmd run check; git diff --check; git status --short; SHA-256 comparison; Node-process comparison.
Results: 16/16 focused tests passed; 24/24 complete test-run entries passed; syntax passed; whitespace passed; endpoint inventory passed at 34/6/28.
Fixture runtime root: A new hundo-leago-br00-* directory under the operating-system temporary root for each test; every runtime was removed during teardown.
Pre/post repository hashes: league-state.json, league.json, league_dump.json, league_with_meta.json, and players.json were identical before and after testing.
Child process cleanup: All BR-00 child servers terminated; only the three Node processes present before testing remained.
Known test not run: None.
Discovered current defects: Player routes retain the empty array and Map supplied before loadPlayersFromDisk reassigns the populated cache, so the known synthetic player detail currently returns 404. This behavior is characterized and was not fixed.
Implementation mismatch: On Windows with Node 24.11.1, node --test test/characterization treats the directory as a module path and fails. The working script uses the quoted *.test.js pattern.
Git note: The repository-wide league-state.json ignore rule also matches the synthetic fixture. The fixture exists and is used by the suite; a later focused commit must force-add that one fixture without changing .gitignore.
Rollback: Remove only test/ and restore only the prior package.json scripts.
Ending Git status: package.json modified and test/ added; no file is staged.
Next proposed work item: BR-01
```

BR-00 is complete locally but has not been committed, pushed, merged, or deployed.

---

# Document Verification

```powershell
Get-Content ..\hundo-leago\docs\06-work-plans\archive\BR-00_BASELINE_AND_SAFETY_HARNESS.md
Select-String -Path ..\hundo-leago\docs\06-work-plans\archive\BR-00_BASELINE_AND_SAFETY_HARNESS.md -Pattern '^`APPROVED`$','^`COMPLETE`$','BR-00','Completion Record'
```

Expected result:

* the archived plan is approved and complete;
* BR-00 evidence is recorded;
* exact files, tests, commands, risks, rollback, and stop conditions are defined;
* the plan contains no production migration or deployment authority.
