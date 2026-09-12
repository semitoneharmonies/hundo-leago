# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-08
```

## Active Step

```text
Backend Refactor Step 8 - Auction Resolution and Snapshot Jobs
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-07 passed its gates on 2026-07-18, so BR-08 may begin without another continuation prompt.

---

## Objective

Move the current compatibility auction calculation, auction-resolution orchestration, automatic auction-resolution job, and automatic weekly-snapshot job into explicit domain, service, and job boundaries.

The step must prove:

* no-bid, single-bid, multiple-bid, amount tie, missing-team, duplicate-run, buyout-lock, activity, save-failure, and event-failure behavior;
* the weekly snapshot job runs once for one Sunday occurrence;
* job state and data commit before the current event attempt;
* both jobs receive a fixed clock, await their work, report outcomes, and block overlaps;
* current compatibility differences from the approved Season 2 Auctions specification remain documented rather than silently changed.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/03-product-specs/AUCTIONS.md
../hundo-leago/docs/04-technical-specs/API_CONTRACTS.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
../hundo-leago/docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
../hundo-leago/docs/06-work-plans/archive/BR-07_MATCHUP_JOBS.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-07.
3. Record protected JSON hashes and Node process IDs.
4. Characterize the auction calculation and both jobs using temporary or in-memory fixtures and fixed time.
5. Stop for unrelated overlap in planned files.
6. Keep every explicit data path below the operating-system temporary directory.

---

# Part 2 - Current Compatibility Facts and Target Differences

Current automatic processing:

* checks Pacific time and becomes eligible at or after Sunday `4:00 PM`;
* derives one calendar occurrence marker for auction resolution and one for weekly snapshots;
* uses `lastAutoAuctionRolloverId` and `lastAutoWeeklySnapshotId` as JSON idempotency markers;
* groups active bid records by `auctionKey`, falling back to normalized player name;
* ranks highest numeric `amount` first and uses the earliest timestamp for an amount tie;
* charges the winner its submitted `amount`;
* assigns a name/salary/position roster record with a 14-day buyout lock;
* sorts the winning roster by F before D, salary descending, then name;
* removes every grouped bid when its winning team exists and adds a leading `faSigned` activity entry;
* writes the snapshot artifact before saving its occurrence marker;
* attempts current events through `app.get("io")`, which remains a compatibility no-op until BR-11.

These are compatibility facts, not the approved Season 2 target. The approved Auctions specification instead requires stable league, auction, bid, player, team, actor, contract, and history identities; ranking by AAV, term, timestamp, and bid ID; multi-year contracts; approved anti-bluff pricing; validation and skipping of stale bids; atomic ownership/contract/activity persistence; and league-scoped durable resolution. BR-08 must not introduce those target changes early.

---

# Part 3 - Exact Scope

Create:

```text
src/domain/auctions/resolveCompatibilityAuctions.js
src/application/services/auctions/resolveCompatibilityAuctions.js
src/jobs/definitions/resolveAuctions.js
src/jobs/definitions/createWeeklySnapshot.js
test/characterization/auctionSnapshotJobsCompatibility.test.js
```

Modify:

```text
server.js
```

The exact scope may omit a listed modification when inspection proves it unnecessary. Another production file requires a plan amendment before editing.

---

# Part 4 - Required Boundaries

## Auction Domain Calculation

The pure calculation:

* receives state, fixed time, and deterministic ID generation explicitly;
* performs no filesystem, persistence, event, timer, or wall-clock work;
* preserves current grouping, ranking, tie, missing-team, roster ordering, buyout-lock, bid-removal, and activity shapes;
* returns a projected result without mutating its input.

## Auction Resolution Service

The service:

* loads current league state;
* invokes the pure compatibility calculation;
* applies the occurrence marker;
* performs exactly one awaited save;
* attempts one event only after the save;
* reports the current signing count and occurrence ID.

## Job Definitions

Both jobs:

* receive fixed clocks and dependencies explicitly;
* use the BR-07 shared job runner for overlap and outcome reporting;
* preserve Sunday Pacific occurrence boundaries and current JSON markers;
* await state and artifact persistence before an event attempt;
* permit a later retry after failure.

---

# Part 5 - Safety Rules

* Every test write must stay in an operating-system temporary fixture.
* Do not implement the approved target anti-bluff, contract, authentication, league-isolation, audit, or transaction model in this extraction.
* Do not change current bid grouping, numeric ranking, earliest tie-break, winner salary, buyout duration, roster ordering, activity shape, or missing-team behavior.
* Do not change snapshot naming, contents, or current artifact-before-marker order.
* Do not change the 34/6/28 route inventory or debug guards.
* Do not restore Socket.IO registration before BR-11.
* Do not add dependencies, SQLite, frontend work, or production operations.

---

# Part 6 - Execution Sequence

1. Capture current no-bid, single-bid, multiple-bid, tie, missing-team, buyout-lock, roster-order, activity, and input-immutability behavior.
2. Extract and test the pure compatibility auction calculation.
3. Add and test the auction-resolution service with save-before-event ordering.
4. Extract and test the automatic auction-resolution job at before, exact, and after Sunday boundaries.
5. Extract and test the weekly-snapshot job and one-occurrence marker.
6. Compose both jobs in `server.js` and remove their inline feature bodies.
7. Prove duplicate, restart, overlap, save-failure, event-failure, and retry behavior.
8. Run focused, characterization, complete, syntax, hash, process, route, debug-guard, and whitespace gates.
9. Record completion evidence and activate BR-09.

---

# Part 7 - Verification

```powershell
node --test test/characterization/auctionSnapshotJobsCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/domain/auctions/resolveCompatibilityAuctions.js
node --check src/application/services/auctions/resolveCompatibilityAuctions.js
node --check src/jobs/definitions/resolveAuctions.js
node --check src/jobs/definitions/createWeeklySnapshot.js
git diff --check
git status --short
```

Required:

* all tests pass;
* every acceptance fixture passes;
* auction and snapshot occurrence markers prevent duplicate work across a recreated job;
* save or artifact failure prevents an event attempt;
* event failure occurs only after committed state and data;
* route inventory remains 34/6/28;
* no protected repository JSON changes;
* no listener or child process remains;
* only exact BR-01 through BR-08 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* baseline tests fail;
* an explicit test path leaves `os.tmpdir()`;
* current grouping, ranking, tie, missing-team, roster, buyout-lock, bid-removal, activity, marker, snapshot, save, or event behavior cannot be preserved;
* target Season 2 auction behavior must replace compatibility behavior early;
* duplicate or overlapping work mutates twice;
* route inventory or debug guarding changes;
* another production file or dependency is required without a plan amendment;
* cleanup leaves a process or listener;
* rollback cannot be limited to BR-08.

---

# Part 9 - Rollback

Restore the inline auction resolver and both automatic job bodies in `server.js`, then remove only the four BR-08 production modules and focused test.

No data rollback should be required. Every focused fixture is in memory or below the operating-system temporary directory.

---

# Part 10 - Completion Checklist

BR-08 completes only when:

* the auction calculation is pure and explicit;
* resolution persistence is behind a service;
* both automatic jobs use fixed clocks, awaited execution, overlap guards, and outcome reporting;
* compatibility differences remain documented;
* all acceptance, full verification, and cleanup gates pass;
* evidence is archived;
* BR-09 is activated under the continuous-execution authority.

---

# Part 11 - Next-Step Boundary

After BR-08 passes, archive it and activate:

```text
BR-09 - Broad League Compatibility Write
```

No production, frontend, commit, push, merge, or deployment authority is included.

---

# Part 12 - Completion Evidence

Completed locally on 2026-07-18.

Files created:

```text
src/domain/auctions/resolveCompatibilityAuctions.js
src/application/services/auctions/resolveCompatibilityAuctions.js
src/jobs/definitions/resolveAuctions.js
src/jobs/definitions/createWeeklySnapshot.js
test/characterization/auctionSnapshotJobsCompatibility.test.js
```

File modified:

```text
server.js
```

Current compatibility behavior remains intact. The extracted domain calculation preserves numeric amount ranking, earliest timestamp tie-breaking, submitted-amount salary, current roster records and ordering, 14-day buyout locks, grouped bid removal, missing-team behavior, and leading `faSigned` activity. The extracted jobs preserve Sunday `4:00 PM` Pacific occurrence IDs and JSON markers. Approved Season 2 AAV, term, anti-bluff, identity, validation, transaction, and league-isolation rules remain documented target differences rather than accidental BR-08 changes.

Verification completed:

```text
14 of 14 focused auction and snapshot tests passed
133 of 133 characterization tests passed
141 of 141 complete Node test entries passed
npm run check passed
all four new production modules passed node --check
git diff --check passed
```

No-bid, single-bid, multiple-bid, amount-tie, missing-team, buyout-lock, roster-order, activity, input-immutability, before/exact/after, duplicate, restart, overlap, retry, snapshot-failure, save-failure, event-failure, and one-occurrence fixtures passed. Protected repository JSON and package hashes were unchanged. The route inventory remained 34 total, six conditional matchup-debug, and 28 non-debug routes. Debug guarding remained intact, no temporary or lock file remained, and no new listener or child process survived verification.
