# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-05
```

## Active Step

```text
Backend Refactor Step 5 - Matchup and Standings Pure Calculations
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-05 passed every required gate on 2026-07-18 and this record is archived as complete.

---

## Objective

Move Pacific-time helpers, round-robin pairing, schedule-window construction, weekly scoring preview, standings calculation, current-week reads, and matchup status reads into explicit pure-domain, read-service, and compatibility-router boundaries.

The step must prove:

* pure schedule functions receive timezone and current time explicitly;
* schedule construction remains daylight-saving safe;
* standings totals, sorting, and tie behavior remain compatible;
* scoring baseline deltas, lock behavior, player-ID fallbacks, clamps, rounding, samples, and metadata remain compatible;
* all current matchup GET responses retain their statuses and shapes;
* every matchup GET leaves all temporary fixture hashes unchanged;
* current Season 1 compatibility calculations are preserved even where approved Season 2 rules require later change.

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
../hundo-leago/docs/02-rules/SCORING_RULES.md
../hundo-leago/docs/04-technical-specs/API_CONTRACTS.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
../hundo-leago/docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
../hundo-leago/docs/06-work-plans/archive/BR-04_SNAPSHOT_AND_BACKUP_OPERATIONS.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-04.
3. Record protected JSON hashes and Node process IDs.
4. Characterize pure calculations and matchup GET variants with synthetic fixtures.
5. Stop for unrelated overlap in planned files.
6. Keep every explicit data path below the operating-system temporary directory.

---

# Part 2 - Current Compatibility Facts

Pure calculations currently embedded in `server.js` include:

```text
getPartsInTZ
weekdayIndexPT
makeUtcMsForTZ
getNextMondayStartMsPT
generateRoundRobinPairs
buildScheduleWeeks
computeStandingsFromResults
weekly scoring preview helpers
```

Current non-debug matchup reads:

```text
GET /api/matchups/standings
GET /api/matchups/current
GET /api/matchups/locks
GET /api/matchups/locks/preview
GET /api/matchups/baseline/preview
GET /api/matchups/baseline/status
GET /api/matchups/scoring/preview
GET /api/matchups/rollover/status
```

The conditional `GET /api/matchups/debug/stateSummary` route remains guarded and may remain in root until the job/debug extraction if moving it is unnecessary for BR-05.

Compatibility behavior includes:

* `America/Los_Angeles` calendar windows and a 26-week default;
* Monday 00:00 start, Monday 01:00 baseline, Monday 16:00 lock, Sunday 23:59 end, and next Monday 00:00 rollover;
* current round-robin rotation and odd-team bye omission;
* standings points `2/1/0` and sort by points, differential, points-for, then team name;
* unlocked teams score zero, locked teams without a baseline score `null`, and negative player deltas clamp to zero;
* fantasy points remain goals times `1.25` plus assists;
* current response keys, notes, diagnostic sample, statistics timestamps, and exposed `STATS_FILE` values remain unchanged.

---

# Part 3 - Exact Scope

Create:

```text
src/domain/matchups/buildSchedule.js
src/domain/matchups/calculateWeeklyScore.js
src/domain/standings/calculateStandings.js
src/application/services/matchups/readMatchups.js
src/transport/http/routes/matchupsReadCompatibilityRouter.js
test/characterization/matchupsReadCompatibility.test.js
```

Modify:

```text
server.js
test/characterization/endpointManifest.test.js
```

The exact scope may omit a listed modification when inspection proves it unnecessary. Another production file requires a plan amendment before editing.

---

# Part 4 - Required Boundaries

## Schedule Domain

`buildSchedule.js` owns:

* timezone part extraction and UTC conversion;
* explicit-time upcoming-Monday calculation;
* round-robin pair generation;
* daylight-saving-safe schedule-window construction.

It performs no I/O and receives timezone and `nowMs` explicitly.

## Weekly Score Domain

`calculateWeeklyScore.js` owns:

* current and baseline fantasy-point getters;
* current player-ID fallback extraction;
* per-team lock and baseline behavior;
* non-negative deltas, two-decimal rounding, and diagnostic sample;
* scoring projection from passed state and statistics only.

It performs no I/O and receives `nowMs` explicitly.

## Standings Domain

`calculateStandings.js` owns:

* schedule/result joins;
* team-row initialization;
* wins, losses, ties, points-for, points-against, differential, and `2/1/0` points;
* deterministic compatibility sorting;
* explicit `nowMs` projection.

It performs no I/O.

## Read Service

`readMatchups.js` owns:

* loading league state through the existing store;
* loading statistics through the statistics repository;
* current, lock, baseline, scoring, rollover, and standings read use cases;
* current team-legality compatibility check;
* passing explicit current time into pure calculations.

## Compatibility Router

`matchupsReadCompatibilityRouter.js` owns:

* the eight non-debug GET route registrations;
* current response statuses, shapes, and error text;
* no direct persistence or domain calculation.

---

# Part 5 - Safety Rules

* Matchup GETs and pure functions must never write.
* Do not change Season 1 formulas, rounding, schedule timing, pairing rotation, statuses, notes, or response fields.
* Do not implement Season 2 legality, bye, playoff, or scoring changes.
* Do not move matchup command or job writes before BR-06 and BR-07.
* Keep the conditional debug guard and 34/6/28 inventory unchanged.
* Do not add SQLite, authentication, multi-league behavior, frontend work, or dependencies.
* Keep current Socket.IO behavior unchanged until BR-11.

---

# Part 6 - Execution Sequence

1. Capture schedule, DST, standings, scoring, status, and read-only behavior.
2. Add and test pure schedule functions.
3. Add and test pure standings calculation.
4. Add and test pure weekly scoring calculation.
5. Add and test the matchup read service.
6. Add the compatibility router.
7. Compose the service/router and replace root calculation callers with pure functions.
8. Remove the eight inline read handlers and root pure implementations.
9. Update route-manifest source assertions.
10. Run focused, characterization, complete, syntax, hash, process, and whitespace gates.
11. Record completion evidence and activate BR-06.

---

# Part 7 - Verification

```powershell
node --test test/characterization/matchupsReadCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/domain/matchups/buildSchedule.js
node --check src/domain/matchups/calculateWeeklyScore.js
node --check src/domain/standings/calculateStandings.js
node --check src/application/services/matchups/readMatchups.js
node --check src/transport/http/routes/matchupsReadCompatibilityRouter.js
git diff --check
git status --short
```

Required:

* all tests pass;
* route inventory remains 34/6/28;
* DST boundary fixtures pass;
* standings sort and tie fixtures pass;
* scoring baseline fixtures pass;
* all matchup GET responses remain compatible;
* all matchup GETs preserve the complete temporary fixture tree hash;
* no protected repository JSON changes;
* no listener or child process remains;
* only exact BR-01 through BR-05 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* baseline tests fail;
* an explicit test path leaves `os.tmpdir()`;
* a matchup GET writes;
* current time, timezone, status, shape, formula, pairing, schedule, rounding, note, or diagnostic behavior cannot be preserved;
* a command or job write must move early;
* route inventory or debug guarding changes;
* another production file or dependency is required without a plan amendment;
* cleanup leaves a process or listener;
* rollback cannot be limited to BR-05.

---

# Part 9 - Rollback

Restore the eight inline matchup read handlers and pure helpers in `server.js`, restore root callers, and remove only the five BR-05 modules and focused test.

No data rollback should be required. This step is read-only outside existing command and job callers, and every test uses synthetic or temporary data.

---

# Part 10 - Completion Checklist

BR-05 completes only when:

* schedule, scoring, and standings calculations are pure modules;
* current time and timezone are explicit inputs;
* matchup reads are behind a service and router;
* all current matchup GET contracts pass;
* DST, tie, scoring, and read-only proof pass;
* full verification and cleanup pass;
* evidence is archived;
* BR-06 is activated under the continuous-execution authority.

---

# Part 11 - Completion Record

```text
Work plan: BR-05
Branch and starting status: stage2 at aa0718d with verified cumulative BR-01 through BR-04 work
Exact files: server.js; src/domain/matchups/buildSchedule.js; src/domain/matchups/calculateWeeklyScore.js; src/domain/standings/calculateStandings.js; src/application/services/matchups/readMatchups.js; src/transport/http/routes/matchupsReadCompatibilityRouter.js; test/characterization/endpointManifest.test.js; test/characterization/matchupsReadCompatibility.test.js
Behavior changed: no intended compatibility behavior changed
Behavior preserved: eight normal matchup GET routes, guarded debug read, Pacific schedule windows, current round-robin/odd-team behavior, scoring formula and deltas, status reasons, standings 2/1/0 totals and sorting, notes, diagnostics, and route inventory
Time/DST proof: pure functions receive explicit time/timezone; spring transition produced 167 hours and fall transition 169 hours between local Monday starts
Read proof: all nine matchup GET requests preserved complete temporary fixture tree hashes
Scoring proof: current player-ID fallbacks, locks, absent baselines, negative clamps, rounding, samples, and statistics metadata passed
Standings proof: wins, ties, unknown-week omission, points, differential, points-for, and team-name tie breakers passed
Commands/results: 22/22 focused composition tests; 86/86 characterization tests; 94/94 complete tests; npm run check; five node --check commands; git diff --check
Temporary fixtures: all HTTP and state paths remained below operating-system temporary directories; pure fixtures performed no I/O
Cleanup: Node process set unchanged
Known compatibility work: Season 2 timezone, odd-team bye, late-legality, and scoring eligibility changes remain outside this extraction
Defects: none introduced
Rollback: restore inline read handlers and pure helpers in server.js, then remove only the five BR-05 modules and focused test
Ending status: complete, local, uncommitted, not pushed, not merged, and not deployed
Next: BR-06
```

---

# Part 12 - Next-Step Boundary

After BR-05 passes, archive it and activate:

```text
BR-06 - Matchup Schedule Commands
```

No production, frontend, commit, push, merge, or deployment authority is included.
