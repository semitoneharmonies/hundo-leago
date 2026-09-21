# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-06
```

## Active Step

```text
Backend Refactor Step 6 - Matchup Schedule Commands
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-05 passed its gates on 2026-07-18, so BR-06 may begin without another continuation prompt.

---

## Objective

Move schedule generation, one-week window updates, shift-from behavior, compatibility validation, commissioner-role checks, save orchestration, and event attempts into explicit command-service and compatibility-router boundaries.

The step must prove:

* even-team generation remains compatible;
* current odd-team rejection remains compatible and tracked for approved later bye support;
* future-only editing and non-production `force=true` behavior remain compatible;
* numeric, ordering, baseline, lock, and neighbor-overlap validation remain compatible;
* shift-from preserves earlier weeks and rebuilds later local calendar windows without overlap;
* successful commands save before attempting the current event;
* failed validation changes no temporary fixture file;
* all three route statuses and response shapes remain compatible.

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
../hundo-leago/docs/06-work-plans/archive/BR-05_MATCHUP_AND_STANDINGS_PURE_CALCULATIONS.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-05.
3. Record protected JSON hashes and Node process IDs.
4. Characterize all three commands with temporary fixture state.
5. Stop for unrelated overlap in planned files.
6. Keep every explicit data path below the operating-system temporary directory.

---

# Part 2 - Current Compatibility Facts

Current command routes:

```text
POST /api/matchups/schedule/generate
POST /api/matchups/schedule/updateWeek
POST /api/matchups/schedule/shiftFrom
```

Current behavior includes:

* body-supplied `meta.actorRole=commissioner`;
* generation requires at least two teams and rejects an odd team count;
* generation defaults to 26 weeks, next Monday 00:00 Pacific, Monday 16:00 lock, and the existing season ID;
* generation resets locks, week baselines, results, and last rollover while preserving legacy `baselineByPlayerId`;
* update requires an existing non-negative week index;
* production ignores `force=true`, while non-production permits it;
* baseline remains one hour after week start;
* update validates positive timestamps, ordering, lock containment, and neighboring overlaps;
* shift rebuilds the selected and later weeks from the prior rollover using Pacific calendar boundaries;
* saves occur before the current `app.get("io")` event attempt;
* the documented missing Socket.IO registration keeps the server event attempt a compatibility no-op until BR-11.

---

# Part 3 - Exact Scope

Create:

```text
src/application/services/matchups/generateSchedule.js
src/application/services/matchups/updateWeek.js
src/application/services/matchups/shiftSchedule.js
src/transport/http/routes/matchupsScheduleCompatibilityRouter.js
test/characterization/matchupsScheduleCompatibility.test.js
```

Modify:

```text
server.js
test/characterization/endpointManifest.test.js
```

The exact scope may omit a listed modification when inspection proves it unnecessary. Another production file requires a plan amendment before editing.

---

# Part 4 - Required Boundaries

## Command Services

The three command services own:

* current input validation after role authorization;
* loading current league state;
* schedule projection through BR-05 pure helpers;
* current state reset/preservation semantics;
* exactly one successful save;
* one post-save event attempt through an injected publisher;
* current success results and typed compatibility failures.

They receive current time, timezone, and production-mode decisions explicitly.

## Compatibility Router

The schedule router owns:

* the three route registrations;
* current body parsing;
* current body-supplied commissioner-role check;
* mapping service failures to current status codes and error text;
* current generic 500 responses and logging.

The router performs no persistence or schedule calculation.

---

# Part 5 - Safety Rules

* Failed role, shape, range, time, ordering, or overlap validation must not save.
* Tests may write only operating-system temporary fixtures.
* Do not add approved Season 2 odd-team bye behavior in this extraction.
* Do not weaken production force behavior.
* Do not move roster-lock, baseline, finalization, or rollover jobs before BR-07.
* Do not change the 34/6/28 route inventory or debug guards.
* Do not restore Socket.IO registration before BR-11.
* Do not add SQLite, authentication, multi-league behavior, frontend work, or dependencies.

---

# Part 6 - Execution Sequence

1. Capture generation, update, shift, validation, hashes, and save/event ordering.
2. Add and test the generation service.
3. Add and test the one-week update service.
4. Add and test the shift-from service.
5. Add the compatibility router.
6. Compose the services/router and remove the three inline handlers.
7. Update route-manifest source assertions.
8. Run focused, characterization, complete, syntax, hash, process, and whitespace gates.
9. Record completion evidence and activate BR-07.

---

# Part 7 - Verification

```powershell
node --test test/characterization/matchupsScheduleCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/application/services/matchups/generateSchedule.js
node --check src/application/services/matchups/updateWeek.js
node --check src/application/services/matchups/shiftSchedule.js
node --check src/transport/http/routes/matchupsScheduleCompatibilityRouter.js
git diff --check
git status --short
```

Required:

* all tests pass;
* route inventory remains 34/6/28;
* generation, update, and shift response contracts pass;
* odd-team rejection passes and changes no hash;
* future-only and force behavior pass;
* overlap rejection changes no hash;
* save-before-event order passes;
* no protected repository JSON changes;
* no listener or child process remains;
* only exact BR-01 through BR-06 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* baseline tests fail;
* an explicit test path leaves `os.tmpdir()`;
* failed validation writes;
* current role, status, error, schedule, reset, force, overlap, save, event, or response behavior cannot be preserved;
* a matchup job must move early;
* route inventory or debug guarding changes;
* another production file or dependency is required without a plan amendment;
* cleanup leaves a process or listener;
* rollback cannot be limited to BR-06.

---

# Part 9 - Rollback

Restore the three inline schedule handlers in `server.js` and remove only the three BR-06 services, compatibility router, and focused test.

No data rollback should be required. Every command test uses a copied temporary league file, and failed validation must preserve its prior hash.

---

# Part 10 - Completion Checklist

BR-06 completes only when:

* all three schedule commands are behind services;
* the router owns only HTTP compatibility concerns;
* current validation and response contracts pass;
* failed validation preserves state;
* save-before-event ordering passes;
* full verification and cleanup pass;
* evidence is archived;
* BR-07 is activated under the continuous-execution authority.

---

# Part 11 - Next-Step Boundary

After BR-06 passes, archive it and activate:

```text
BR-07 - Matchup Jobs
```

No production, frontend, commit, push, merge, or deployment authority is included.

---

# Part 12 - Completion Evidence

Completed locally on 2026-07-18.

Files created:

```text
src/application/services/matchups/generateSchedule.js
src/application/services/matchups/updateWeek.js
src/application/services/matchups/shiftSchedule.js
src/transport/http/routes/matchupsScheduleCompatibilityRouter.js
test/characterization/matchupsScheduleCompatibility.test.js
```

Files modified:

```text
server.js
test/characterization/endpointManifest.test.js
test/helpers/readEndpointManifest.js
```

Behavior remained compatible. Schedule generation, one-week updates, shift-from behavior, body-supplied commissioner-role checks, odd-team rejection, development-only forced editing, ordering and overlap validation, state-reset semantics, and response contracts passed focused tests.

Verification completed:

```text
20 of 20 focused matchup-schedule tests passed
98 of 98 characterization tests passed
106 of 106 complete Node test entries passed
npm run check passed
all four new production modules passed node --check
git diff --check passed
```

Protected repository JSON hashes and package manifest hashes were unchanged. The route inventory remained 34 total, six conditional matchup-debug, and 28 non-debug routes. The debug guard remained in place. No new Node listener or child process remained after verification.
