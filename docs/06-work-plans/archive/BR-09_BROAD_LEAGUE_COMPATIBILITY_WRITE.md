# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-09
```

## Active Step

```text
Backend Refactor Step 9 - Broad League Compatibility Write
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-08 passed its gates on 2026-07-18, so BR-09 may begin without another continuation prompt.

BR-09 completed on 2026-07-18. The archive below records the approved scope and final evidence.

---

## Objective

Move the current broad `POST /api/league` payload validation, wipe and freeze protection, server-owned matchup preservation, automatic-marker preservation, save metadata, compatibility event attempt, and HTTP response mapping into explicit validator, service, and router boundaries.

The step must prove:

* success and current `{ ok: true }` response compatibility;
* invalid required arrays and invalid optional matchup shape;
* wipe protection;
* frozen manager and non-commissioner rejection;
* commissioner and manager compatibility projections;
* backend-owned field preservation;
* save-failure and event-failure behavior;
* fields outside the compatibility contract cannot silently overwrite server-owned values.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/04-technical-specs/API_CONTRACTS.md
../hundo-leago/docs/04-technical-specs/BACKEND_REFACTOR.md
../hundo-leago/docs/07-testing/TESTING_STRATEGY.md
../hundo-leago/docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
../hundo-leago/docs/06-work-plans/archive/BR-08_AUCTION_RESOLUTION_AND_SNAPSHOT_JOBS.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-08.
3. Record protected JSON hashes and Node process IDs.
4. Characterize the route against copied temporary state.
5. Stop for unrelated overlap in planned files.
6. Keep every explicit data path below the operating-system temporary directory.

---

# Part 2 - Current Compatibility Facts

The current route:

```text
POST /api/league
```

Current behavior includes:

* body-supplied `meta.actorRole` and `meta.actorTeam`;
* every non-commissioner write is blocked with `423` while `settings.frozen` is true;
* an empty incoming teams array is blocked as a wipe only when stored teams already exist;
* `teams`, `freeAgents`, `leagueLog`, `tradeProposals`, and `tradeBlock` are required arrays;
* optional `matchups`, when provided, must be a non-array object;
* only a body-supplied commissioner may replace matchups;
* managers preserve stored matchups even when they submit a matchup object;
* settings use any non-null object, including arrays, or fall back to stored settings and then `{ frozen: false }`;
* a truthy `nextAuctionDeadline` replaces the stored value; falsey input preserves stored value or becomes null;
* stored automatic snapshot and auction markers are always preserved;
* all other stored fields begin from the stored state and are not replaced merely because the body contains them;
* `savedBy` is `commissioner` for a commissioner, otherwise the truthy actor team or `manager`;
* success returns `200 { ok: true }`;
* validation returns current `400` or `423` text;
* save or event exceptions return `500 { ok: false, error: "Failed to save state" }`.

This body-supplied role model is compatibility behavior only. BR-09 does not introduce approved target authentication or authorization.

---

# Part 3 - Exact Scope

Create:

```text
src/application/services/league/saveCompatibilityLeague.js
src/transport/http/routes/leagueWriteCompatibilityRouter.js
src/validators/compatibilityLeaguePayload.js
test/characterization/leagueWriteCompatibility.test.js
```

Modify:

```text
server.js
test/characterization/endpointManifest.test.js
```

The exact scope may omit a listed modification when inspection proves it unnecessary. Another production file requires a plan amendment before editing.

---

# Part 4 - Required Boundaries

## Validator

The validator:

* receives stored state and the incoming body;
* performs no persistence or event work;
* preserves current freeze, wipe, array, and optional matchup validation order and error text;
* returns a typed compatibility failure or validated projection inputs.

## Service

The service:

* loads stored state exactly once;
* invokes the validator;
* projects only current accepted fields;
* preserves stored backend-owned fields and automatic markers;
* performs exactly one awaited save;
* attempts exactly one event only after the save;
* exposes typed validation failures without HTTP concerns.

## Router

The router:

* owns only route registration, request body access, current status/error mapping, generic `500`, and logging;
* performs no league projection or persistence;
* preserves the exact success response.

---

# Part 5 - Safety Rules

* Failed validation must not save or publish.
* Every HTTP test write must stay in an operating-system temporary fixture.
* Do not generalize or reuse this broad compatibility write for new features.
* Do not strengthen body-supplied authorization in this extraction.
* Do not change validation order, status codes, error text, accepted fields, fallback semantics, save metadata, or response shape.
* Do not permit body fields outside the current compatibility contract to replace stored server-owned values.
* Do not change the 34/6/28 route inventory or debug guards.
* Do not restore Socket.IO registration before BR-11.
* Do not add dependencies, SQLite, frontend work, or production operations.

---

# Part 6 - Execution Sequence

1. Capture success, invalid arrays, invalid matchup, wipe, freeze, commissioner, manager, save-failure, event-failure, and server-owned-field preservation.
2. Extract and test the compatibility validator.
3. Add and test the save service.
4. Add the compatibility router and map typed failures.
5. Compose the router and remove the inline handler and helper validation from `server.js`.
6. Update route-manifest source assertions if required.
7. Run focused, characterization, complete, syntax, hash, process, route, debug-guard, and whitespace gates.
8. Record completion evidence and activate BR-10.

---

# Part 7 - Verification

```powershell
node --test test/characterization/leagueWriteCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/validators/compatibilityLeaguePayload.js
node --check src/application/services/league/saveCompatibilityLeague.js
node --check src/transport/http/routes/leagueWriteCompatibilityRouter.js
git diff --check
git status --short
```

Required:

* all tests pass;
* every acceptance fixture passes;
* failed validation leaves the temporary state hash unchanged;
* save occurs before event attempt;
* server-owned fields and automatic markers remain preserved;
* route inventory remains 34/6/28;
* no protected repository JSON changes;
* no listener or child process remains;
* only exact BR-01 through BR-09 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* baseline tests fail;
* an explicit test path leaves `os.tmpdir()`;
* validation order, error text, projection, preservation, save metadata, event, or response behavior cannot be preserved;
* failed validation writes;
* a body field outside the compatibility contract can overwrite server-owned data;
* target authentication or a narrower replacement endpoint is required early;
* route inventory or debug guarding changes;
* another production file or dependency is required without a plan amendment;
* cleanup leaves a process or listener;
* rollback cannot be limited to BR-09.

---

# Part 9 - Rollback

Restore the inline `POST /api/league` handler and its four validation helpers in `server.js`, then remove only the three BR-09 production modules and focused test.

No data rollback should be required. Every route test uses copied temporary league state, and direct tests use in-memory state.

---

# Part 10 - Completion Checklist

BR-09 completes only when:

* validation, service, and router boundaries are explicit;
* the broad write accepts and preserves exactly the current compatibility fields;
* all validation, preservation, save, event, response, full verification, and cleanup gates pass;
* evidence is archived;
* BR-10 is activated under the continuous-execution authority.

---

# Part 10A - Completion Evidence

Files created:

```text
src/application/services/league/saveCompatibilityLeague.js
src/transport/http/routes/leagueWriteCompatibilityRouter.js
src/validators/compatibilityLeaguePayload.js
test/characterization/leagueWriteCompatibility.test.js
```

Files modified:

```text
server.js
test/characterization/endpointManifest.test.js
```

Verified on 2026-07-18:

* the combined focused league-write and endpoint-location run passed 21 of 21 tests;
* the final characterization suite passed 145 of 145 tests;
* the complete Node suite passed 153 of 153 tests;
* syntax checks passed for the validator, service, router, and root server;
* `npm.cmd run check` and `git diff --check` passed;
* the compatibility endpoint inventory remained 34 total, six guarded debug routes, and 28 non-debug routes;
* protected league JSON and package-manifest hashes remained unchanged;
* no HTTP listener, child test server, temporary state file, or lock file remained;
* the unrelated frontend worktree modification was preserved without change.

Behavior remains compatibility-equivalent. The route now delegates ordered validation, accepted-field projection, persistence, compatibility event attempt, and HTTP mapping through explicit boundaries. The current body-supplied role model and broad-write security limitations remain intentionally unchanged for their owning later work.

---

# Part 11 - Next-Step Boundary

After BR-09 passes, archive it and activate:

```text
BR-10 - JSON Repository Boundary
```

No production, frontend, commit, push, merge, or deployment authority is included.
