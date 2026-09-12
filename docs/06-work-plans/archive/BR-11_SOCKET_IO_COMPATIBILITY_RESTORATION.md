# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-11
```

## Active Step

```text
Backend Refactor Step 11 - Socket.IO Compatibility Restoration
```

Grae requested continuous execution of the approved backend-refactor sequence. BR-10 passed its gates on 2026-07-18, so BR-11 may begin without another continuation prompt.

BR-11 completed on 2026-07-18. The archive below records the approved scope and final evidence.

---

## Objective

Restore the current compatibility invalidation path as a focused defect correction:

* attach the constructed Socket.IO server explicitly to the Express application;
* register exactly one connection handler;
* deliver one `league:updated` invalidation after a committed compatibility write;
* deliver none after a failed write;
* preserve HTTP operation when Socket.IO is unavailable;
* verify the existing frontend listener refetches once, survives reconnect, and cleans up without duplicate listeners.

This step does not add authenticated rooms, user identity, league isolation, new event contracts, or target notification behavior.

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
../hundo-leago/docs/06-work-plans/archive/BR-10_JSON_REPOSITORY_BOUNDARY.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm `stage2`.
2. Confirm cumulative changes belong only to completed BR-01 through BR-10.
3. Record protected JSON and package-manifest hashes and existing Node process IDs.
4. Run current CORS, broad-write, startup, and shutdown characterization.
5. Inspect the existing frontend Socket.IO effect read-only.
6. Keep every HTTP and persistence fixture below the operating-system temporary directory.

---

# Part 2 - Current Compatibility Facts

The HTTP bootstrap currently constructs Socket.IO with compatibility CORS but does not attach it to `app.get("io")` and registers no connection handler.

The current publisher looks up `app.get("io")` and safely does nothing when unavailable. Because attachment is missing, committed service and job event attempts currently produce no client invalidation.

The existing frontend `App.jsx` effect:

* constructs one Socket.IO client guarded by `socketRef`;
* registers one `league:updated` listener;
* performs one league fetch per event;
* keeps the listener on the same client across automatic reconnects;
* disconnects the client and clears the ref during cleanup.

BR-11 verifies this read-only frontend behavior but does not edit the frontend repository.

---

# Part 3 - Exact Scope

Create:

```text
src/infrastructure/realtime/SocketIoCompatibilityPublisher.js
test/characterization/socketIoCompatibility.test.js
```

Modify:

```text
src/bootstrap/createHttpServer.js
server.js
test/characterization/corsCompatibility.test.js
```

The exact scope may omit a listed modification when inspection proves it unnecessary. Another production file requires a plan amendment before editing.

---

# Part 4 - Required Boundaries

## HTTP transport

`createHttpServer`:

* constructs Socket.IO with unchanged compatibility CORS;
* attaches the exact constructed instance to the Express application;
* registers exactly one connection handler;
* does not listen until the explicit `listen` call;
* remains independently constructible and closable in tests.

## Compatibility publisher

The publisher:

* obtains the current Socket.IO instance from the application at publish time;
* emits the requested compatibility event once when available;
* returns safely without throwing when Socket.IO is absent or unavailable;
* contains no persistence or HTTP response logic.

## Service ordering

The existing broad compatibility save remains commit-before-event. A failed validation or save emits nothing; a committed save emits exactly one invalidation.

---

# Part 5 - Safety Rules

* Do not add Socket.IO dependencies or change versions.
* Do not add authenticated rooms, membership routing, acknowledgements, retries, durable outbox behavior, or new event names.
* Do not emit before persistence commits.
* Do not make HTTP success depend on Socket.IO availability.
* Do not edit the sibling frontend repository.
* Do not change compatibility CORS, route inventory, response contracts, league data, package manifests, jobs, league rules, or debug guards.
* Do not start a production or repository-data listener.

---

# Part 6 - Execution Sequence

1. Characterize current attachment, one-handler, publisher, write-ordering, failure, and unavailable-Socket.IO behavior.
2. Attach Socket.IO and register one connection handler in HTTP bootstrap.
3. Add the compatibility publisher and replace the root inline publisher.
4. Prove one invalidation after a committed broad write and none after validation or save failure.
5. Prove HTTP success remains available without Socket.IO.
6. Verify existing frontend one-fetch, reconnect, and cleanup behavior through read-only source inspection.
7. Run focused, characterization, complete, syntax, hash, process, route, CORS, debug-guard, and whitespace gates.
8. Record completion evidence and activate BR-12.

---

# Part 7 - Verification

```powershell
node --test test/characterization/socketIoCompatibility.test.js test/characterization/corsCompatibility.test.js test/characterization/leagueWriteCompatibility.test.js test/characterization/serverStartup.test.js test/characterization/shutdown.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/bootstrap/createHttpServer.js
node --check src/infrastructure/realtime/SocketIoCompatibilityPublisher.js
git diff --check
git status --short
```

Required:

* all tests pass;
* the exact Socket.IO instance is attached once;
* exactly one connection handler is registered;
* a committed compatibility write emits one `league:updated`;
* validation and save failure emit none;
* HTTP behavior succeeds without Socket.IO;
* compatibility CORS decisions remain unchanged;
* frontend source still contains one guarded client, one invalidation listener and fetch, reconnect-compatible lifecycle, and cleanup disconnect;
* route inventory remains 34/6/28;
* no protected repository JSON or package-manifest change;
* no listener, child process, temporary file, or lock remains;
* only exact BR-01 through BR-11 files are changed.

---

# Part 8 - Stop Conditions

Stop when:

* the baseline fails;
* event delivery requires a frontend edit, dependency change, target rooms, authentication, production traffic, or a response-contract change;
* an event occurs before a committed save or after failed validation/save;
* Socket.IO unavailability breaks HTTP behavior;
* connection or event listeners duplicate;
* compatibility CORS, route inventory, or debug guarding changes;
* another production file is required without a plan amendment;
* cleanup leaves a listener or process;
* rollback cannot be limited to BR-11.

---

# Part 9 - Rollback

Remove the explicit application attachment and connection handler, restore the root inline publisher, remove the BR-11 publisher and focused test, and restore the previous CORS characterization expectation.

No data rollback should be required. All writes use in-memory or temporary fixture repositories.

---

# Part 10 - Completion Checklist

BR-11 completes only when:

* Socket.IO is explicitly attached;
* exactly one connection handler exists;
* committed compatibility writes deliver one invalidation;
* failures deliver none;
* unavailable Socket.IO does not break HTTP;
* the existing frontend listener lifecycle is verified read-only;
* all focused and full gates pass;
* evidence is archived;
* BR-12 is activated under the continuous-execution authority.

---

# Part 10A - Completion Evidence

Files created:

```text
src/infrastructure/realtime/SocketIoCompatibilityPublisher.js
test/characterization/socketIoCompatibility.test.js
```

Files modified:

```text
src/bootstrap/createHttpServer.js
server.js
test/characterization/corsCompatibility.test.js
```

Verified on 2026-07-18:

* the final focused Socket.IO, CORS, broad-write, startup, and shutdown run passed 24 of 24 tests;
* the final characterization suite passed 152 of 152 tests;
* the complete Node suite passed 160 of 160 tests;
* syntax checks passed for HTTP bootstrap, the compatibility publisher, and root server;
* `npm.cmd run check` and `git diff --check` passed;
* the exact constructed Socket.IO instance is attached once and exactly one connection handler is registered;
* a committed broad compatibility save emits one `league:updated` after persistence;
* save failure emits nothing and unavailable Socket.IO leaves HTTP success intact;
* HTTP and Socket.IO compatibility CORS decisions remain unchanged;
* read-only frontend inspection found one guarded client, one invalidation listener, one league refetch, one cleanup disconnect, one ref clear, and no reconnect disabling; installed Socket.IO client 4.8.1 enables reconnect unless explicitly disabled;
* the compatibility endpoint inventory remained 34 total, six guarded debug routes, and 28 non-debug routes;
* protected league JSON and package-manifest hashes remained unchanged;
* no test listener, child server, temporary state file, or lock file remained;
* the pre-existing Node process remained PID 20636;
* the unrelated frontend worktree modification was preserved without change.

Authenticated rooms, durable outbox behavior, target notifications, frontend edits, league-rule changes, and production operations remain outside BR-11.

---

# Part 11 - Next-Step Boundary

After BR-11 passes, archive it and activate:

```text
BR-12 - Remove Feature Code from Root
```

No production, frontend, commit, push, merge, or deployment authority is included.
