# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-07
```

## Active Step

```text
Backend Refactor Step 7 - Matchup Jobs
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-06 passed its gates on 2026-07-18, so BR-07 may begin without another continuation prompt.

---

## Objective

Move roster locks, baseline capture, weekly result finalization, matchup-week rollover, shared job execution reporting, and matchup scheduler composition into explicit job boundaries.

The step must prove:

* every job receives a fixed clock and returns an awaited promise;
* overlapping runs do not execute the same job twice;
* every run reports skipped, succeeded, or failed;
* persisted JSON idempotency markers remain compatible;
* finalization failure prevents rollover;
* restart and duplicate invocations do not double-advance a matchup week;
* current debug routes and scheduler timing remain compatible.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/03-product-specs/MATCHUPS.md
../hundo-leago/docs/04-technical-specs/API_CONTRACTS.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
../hundo-leago/docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
../hundo-leago/docs/06-work-plans/archive/BR-06_MATCHUP_SCHEDULE_COMMANDS.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-06.
3. Record protected JSON hashes and Node process IDs.
4. Characterize all four jobs with temporary fixture state and fixed time.
5. Stop for unrelated overlap in planned files.
6. Keep every explicit data path below the operating-system temporary directory.

---

# Part 2 - Current Compatibility Facts

Current matchup jobs run in this order:

```text
1. roster locks
2. baseline capture
3. result finalization
4. week rollover
```

Current behavior includes:

* league-state JSON idempotency markers for locks, baselines, finalized results, and the last rollover;
* Monday Pacific matchup boundaries stored in the schedule;
* team-specific legality checks and locked-player snapshots;
* statistics-cache baselines and scoring deltas;
* finalization before rollover;
* a five-second scheduler interval when matchup jobs are enabled;
* debug routes for roster-lock and baseline execution;
* current event attempts through `app.get("io")`, which remain compatibility no-ops until BR-11.

---

# Part 3 - Exact Scope

Create:

```text
src/jobs/definitions/applyRosterLocks.js
src/jobs/definitions/captureMatchupBaseline.js
src/jobs/definitions/finalizeMatchupResults.js
src/jobs/definitions/rolloverMatchupWeek.js
src/jobs/runJob.js
src/jobs/startScheduler.js
test/characterization/matchupJobsCompatibility.test.js
```

Modify:

```text
server.js
test/characterization/endpointManifest.test.js
```

The exact scope may omit a listed modification when inspection proves it unnecessary. Another production file requires a plan amendment before editing.

---

# Part 4 - Required Boundaries

## Job Definitions

Each definition:

* receives its clock and dependencies explicitly;
* returns an awaited promise;
* uses services or repositories rather than invoking another job as an uncontrolled side effect;
* preserves current JSON state transitions and idempotency markers;
* reports a skipped, succeeded, or failed outcome;
* does not silently continue a dependent state transition after a prerequisite failure.

## Job Runner

The shared runner:

* provides an in-process overlap guard per job;
* awaits each job body;
* normalizes outcome reporting;
* clears its running marker after success or failure;
* permits a later retry after failure.

## Scheduler

The scheduler:

* invokes matchup jobs in the current required order;
* tracks its interval for process shutdown;
* relies on job overlap protection rather than starting parallel duplicate work;
* does not move auction or automatic-snapshot scheduling before BR-08.

---

# Part 5 - Safety Rules

* Every test write must stay in an operating-system temporary fixture.
* Do not alter the approved matchup scoring formula or schedule rules.
* Do not add SQLite or durable scheduled-job occurrences in this extraction.
* Do not move auction resolution or automatic snapshot jobs before BR-08.
* Do not change the 34/6/28 route inventory or debug guards.
* Do not restore Socket.IO registration before BR-11.
* Do not add authentication, multi-league behavior, frontend work, or dependencies.
* A failed finalization must not permit rollover in the same scheduler cycle.

---

# Part 6 - Execution Sequence

1. Capture before, exact-boundary, after, duplicate, restart, missing-statistics, invalid-state, save-failure, and event-failure behavior.
2. Extract and test roster locks.
3. Extract and test baseline capture.
4. Extract and test result finalization.
5. Extract and test week rollover.
6. Add the shared job runner and overlap tests.
7. Add the matchup scheduler and compose it in `server.js`.
8. Run an accelerated matchup-week cycle and prove no double advance.
9. Run focused, characterization, complete, syntax, hash, process, route, debug-guard, and whitespace gates.
10. Record completion evidence and activate BR-08.

---

# Part 7 - Verification

```powershell
node --test test/characterization/matchupJobsCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/jobs/definitions/applyRosterLocks.js
node --check src/jobs/definitions/captureMatchupBaseline.js
node --check src/jobs/definitions/finalizeMatchupResults.js
node --check src/jobs/definitions/rolloverMatchupWeek.js
node --check src/jobs/runJob.js
node --check src/jobs/startScheduler.js
git diff --check
git status --short
```

Required:

* all tests pass;
* before, exact-boundary, after, duplicate, restart, missing-statistics, invalid-state, save-failure, and event-failure fixtures pass;
* accelerated-week execution does not double-advance;
* failed finalization prevents rollover;
* route inventory remains 34/6/28;
* no protected repository JSON changes;
* no listener or child process remains;
* only exact BR-01 through BR-07 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* baseline tests fail;
* an explicit test path leaves `os.tmpdir()`;
* a duplicate or overlapping job mutates twice;
* finalization failure can still roll over the week;
* current lock, baseline, finalization, rollover, marker, debug-route, or scheduler behavior cannot be preserved;
* an auction or snapshot job must move early;
* route inventory or debug guarding changes;
* another production file or dependency is required without a plan amendment;
* cleanup leaves a process or listener;
* rollback cannot be limited to BR-07.

---

# Part 9 - Rollback

Restore the four inline matchup jobs and their scheduler calls in `server.js`, then remove only the six BR-07 production modules and focused test.

No data rollback should be required. Every job test uses copied temporary league and statistics files.

---

# Part 10 - Completion Checklist

BR-07 completes only when:

* all four matchup jobs are explicit definitions;
* every job has fixed-clock and awaited execution;
* overlap and outcome reporting pass;
* current idempotency markers remain compatible;
* accelerated-week and finalization-gating tests pass;
* full verification and cleanup pass;
* evidence is archived;
* BR-08 is activated under the continuous-execution authority.

---

# Part 11 - Next-Step Boundary

After BR-07 passes, archive it and activate:

```text
BR-08 - Auction Resolution and Snapshot Jobs
```

No production, frontend, commit, push, merge, or deployment authority is included.

---

# Part 12 - Completion Evidence

Completed locally on 2026-07-18.

Files created:

```text
src/jobs/definitions/applyRosterLocks.js
src/jobs/definitions/captureMatchupBaseline.js
src/jobs/definitions/finalizeMatchupResults.js
src/jobs/definitions/rolloverMatchupWeek.js
src/jobs/runJob.js
src/jobs/startScheduler.js
test/characterization/matchupJobsCompatibility.test.js
```

File modified:

```text
server.js
```

Behavior remained compatible except for the approved reliability boundary: the four independently launched matchup timers are now one ordered, awaited, overlap-guarded scheduler cycle. Current lock, baseline, result, rollover, end-of-schedule, save metadata, and event payload shapes remain compatible. Debug routes use the same extracted jobs.

Verification completed:

```text
21 of 21 focused matchup-job tests passed
119 of 119 characterization tests passed
127 of 127 complete Node test entries passed
npm run check passed
all six new production modules passed node --check
git diff --check passed
```

Before, exact-boundary, after, duplicate, restart, missing-statistics, invalid-state, save-failure, event-failure, overlap, accelerated-week, no-double-advance, and finalization-gating fixtures passed. Protected repository JSON and package hashes were unchanged. The route inventory remained 34 total, six conditional matchup-debug, and 28 non-debug routes. Debug guarding remained intact, no temporary or lock file remained, and no new listener or child process survived verification.
