# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
BR-02
```

## Active Step

```text
Backend Refactor Step 2 - Player Read and Reload Module
```

This work plan records the completed Backend Refactor Step 2 implementation.

Grae requested continuous execution of the approved backend-refactor sequence on 2026-07-18. BR-01 completed and passed its gates, and BR-02 local implementation and verification completed on 2026-07-18.

---

## Objective

Move current player-file reading, normalization, in-memory indexing, search, compatibility reads, debug information, and reload behavior out of root `server.js` into explicit service, repository, and Express Router boundaries.

The step must prove:

* current player JSON formats normalize the same way;
* valid positive numeric player IDs remain authoritative;
* active-player search, token matching, order, and limits remain unchanged;
* no-query preload, query, debug, detail, invalid-ID, missing-ID, and reload response contracts remain compatible;
* every read leaves the player file unchanged;
* reload replaces only process memory;
* missing and malformed player-file behavior remains visible;
* the documented stale-cache reference defect is corrected through the approved service boundary;
* all 34 compatibility routes remain registered in the same effective order.

No player data is migrated or rewritten.

---

## Repository and Branch

```text
Repository: C:\Users\graem\Desktop\hundo-leago-backend
Branch: stage2
```

BR-01 is locally complete and intentionally uncommitted. BR-02 changes must remain distinguishable by exact file and verification evidence.

---

# Part 1 - Authority and Preconditions

## Required Reading

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
../hundo-leago/docs/06-work-plans/archive/BR-01_CONFIGURATION_AND_BOOTSTRAP.md
```

Re-read Backend Refactor Step 2 immediately before implementation.

---

## Operating Mode

```text
OFFSEASON_RESET
```

Reset authority is not used. All mutable test state remains below the operating-system temporary root.

---

## Reviewed Current Behavior

Current compatibility endpoints:

```text
GET  /api/players
GET  /api/players/debug
GET  /api/players/:id
POST /api/players/reload
```

Current list limits:

```text
No query: default 5000, minimum 1, maximum 5000
Query:    default 25, minimum 1, maximum 100
```

Current normalization accepts:

* a top-level array or `{ players: [...] }`;
* ID keys `id`, `playerId`, or `player_id`;
* current alternate name, position, team, and birth-date keys;
* missing `active` as active;
* explicit `active: false` as inactive;
* only finite player IDs greater than zero.

Search normalizes whitespace and case, matches every query token against the combined name forms, excludes inactive players, preserves file order, and stops at the effective limit.

Current reload behavior clears the process cache on a missing or malformed source. It does not write the player file.

The current extracted read-route module holds the empty array and Map passed before startup reload reassigns them. This documented defect makes route-visible cache state stale. BR-02 corrects that defect by giving the router one player service whose internal cache is replaced through methods rather than captured values.

---

## Start Preconditions

1. Confirm branch `stage2`.
2. Inspect `git status --short`.
3. Confirm existing changes belong only to completed BR-01.
4. Stop for any unrelated overlap in planned BR-02 files.
5. Re-run all BR-01 and BR-00 characterization tests.
6. Record protected repository JSON hashes.
7. Confirm no test path references production storage.

---

# Part 2 - Scope

## In Scope

This step may:

* create a JSON player repository for read/stat behavior;
* create pure player normalization helpers;
* create a stateful in-memory player service;
* create a compatibility Express Router;
* replace the current stale array/Map capture with service method calls;
* move the existing reload endpoint into the compatibility router;
* move current player startup loading and logging behind the service;
* remove the superseded `routes/playersReadRoutes.js`;
* extend the source endpoint-manifest helper to scan the new router path and recognize `router.get` and `router.post`;
* update the known-player characterization from the accidental `404` to the loaded player `200`;
* add focused player repository, service, router, read-only, and reload tests.

---

## Out of Scope

This step must not:

* change player JSON on disk;
* download, refresh, or synchronize external player data;
* add target pagination;
* change current list or search limits;
* change normalization keys or player ID rules;
* add authentication to reload or debug endpoints;
* remove debug path exposure;
* change statistics, roster, auction, trade, or matchup behavior;
* change target API contracts;
* change configuration/bootstrap behavior from BR-01;
* add a dependency;
* edit frontend code;
* access production data;
* commit, push, merge, or deploy without separate authority.

Target security and `/api/v1` behavior remain assigned to later milestones.

---

# Part 3 - Exact Files

## Modify

```text
server.js
test/characterization/readOnlyEndpoints.test.js
test/characterization/endpointManifest.test.js
test/helpers/readEndpointManifest.js
```

## Add

```text
src/application/services/players/normalizePlayer.js
src/application/services/players/createPlayerService.js
src/infrastructure/persistence/json/JsonPlayerRepository.js
src/transport/http/routes/playersCompatibilityRouter.js
test/characterization/playerCompatibility.test.js
```

## Remove After Replacement Passes

```text
routes/playersReadRoutes.js
```

No package file, repository JSON, or other feature source may change.

---

# Part 4 - Module Responsibilities

## `normalizePlayer.js`

Pure functions:

* normalize strings exactly as current search does;
* select the first current non-empty string key;
* select the first current finite numeric key;
* normalize one current player record;
* normalize an ordered array and discard invalid IDs;
* build the current search haystack.

No filesystem, cache, network, Express, clock, or logging access is allowed.

---

## `JsonPlayerRepository.js`

Responsibilities:

* receive an explicit player-file path;
* return current missing-file behavior without creating a file;
* read and parse UTF-8 JSON;
* accept a top-level array or `{ players: [...] }`;
* provide current file/debug stat information;
* expose the repository fallback player-file stat used by the compatibility debug route;
* never write, rename, copy, normalize-and-save, or refresh the source.

Malformed JSON remains an explicit load failure.

---

## `createPlayerService.js`

Responsibilities:

* own one current in-memory ordered player array and ID Map;
* reload through the repository;
* normalize and replace both indexes atomically in process memory;
* clear both indexes on current missing/malformed behavior as characterized;
* expose list, search, detail, cache-count, reload, and debug methods;
* preserve active-only search and current order;
* return copies or safe values so route code does not own mutable cache state.

The service resolves the stale-reference defect because route methods consult current service state after every reload.

---

## `playersCompatibilityRouter.js`

Register in this order:

```text
GET  /api/players
GET  /api/players/debug
GET  /api/players/:id
POST /api/players/reload
```

The router:

* uses Express Router;
* delegates all cache and repository behavior to the service;
* preserves current statuses, keys, list-limit coercion, and reload metadata;
* keeps `/api/players/debug` before `/api/players/:id`;
* performs no direct filesystem access.

---

# Part 5 - Tests

`playerCompatibility.test.js` covers:

* top-level array and wrapped-array loading;
* all current alternate normalization keys;
* missing active default and inactive exclusion;
* invalid, zero, and negative ID filtering;
* duplicate-ID Map behavior as currently produced;
* case-insensitive and whitespace-normalized all-token search;
* file-order preservation;
* no-query default/minimum/maximum limits;
* query default/minimum/maximum limits;
* known detail, missing detail, and malformed detail ID;
* debug response shape and file stats;
* missing file without creation;
* malformed file failure and cache clearing;
* reload replacing the visible service cache;
* player-file hash unchanged by every GET and POST reload;
* no write outside the temporary runtime.

Existing tests update only the intentional facts:

* `/api/players/1001` returns `200` with `{ ok, player }`;
* endpoint manifest source paths point to the new compatibility router;
* manifest scanning includes nested `src/transport/http/routes` files and `router.*` registrations.

Every other BR-00 and BR-01 assertion remains unchanged.

---

# Part 6 - Implementation Order

1. Record status, process IDs, and protected JSON hashes.
2. Re-run the complete characterization suite.
3. Add pure normalization helpers and tests.
4. Add `JsonPlayerRepository` and temporary-file tests.
5. Add the player service and cache/reload tests.
6. Add the compatibility router and HTTP tests.
7. Update the manifest helper for the new router source.
8. Update `server.js` imports, composition, startup reload, and route registration.
9. Update only the intentional known-player and manifest-source assertions.
10. Remove the superseded route module after its replacement passes.
11. Run focused player tests.
12. Run characterization and complete suites.
13. Run syntax, whitespace, hash, status, and process-cleanup checks.
14. Record completion evidence.
15. Stop before BR-03.

---

# Part 7 - Verification

```powershell
node --test test/characterization/playerCompatibility.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
node --check src/application/services/players/normalizePlayer.js
node --check src/application/services/players/createPlayerService.js
node --check src/infrastructure/persistence/json/JsonPlayerRepository.js
node --check src/transport/http/routes/playersCompatibilityRouter.js
git diff --check
git status --short
```

Required results:

* focused and complete tests pass;
* endpoint inventory remains 34/6/28;
* player debug precedes dynamic player detail;
* player reads and reload leave the player-file hash unchanged;
* all protected repository JSON hashes remain unchanged;
* no child process or listener remains;
* only exact BR-01 and BR-02 files are modified.

---

# Part 8 - Risks and Controls

| Risk | Control |
| --- | --- |
| Normalization changes player identity | Table-driven alternate-key and invalid-ID tests |
| Search changes results or order | Active, token, whitespace, limit, and order tests |
| Reload mutates disk | Pre/post player-file hashes and repository with no write methods |
| Stale cache persists | Reload test reads detail and list through the same service/router |
| Debug path becomes dynamic detail | Explicit registration-order and source-index tests |
| Route inventory loses moved routes | Recursive app/router manifest scan and exact 34-route assertion |
| Malformed source is hidden | Explicit failure result and cache-clear characterization |
| Test touches repository players.json | Every mutable test path is below `os.tmpdir()` |
| Step expands into target API/security | Exact compatibility-only router scope |

---

# Part 9 - Rollback

Rollback:

* restore the current player block and reload endpoint in `server.js`;
* restore `routes/playersReadRoutes.js`;
* remove only the four new player source modules and focused player test;
* restore only BR-02 changes in the three existing characterization/helper files.

No data rollback is required because the step performs no player-file write.

Never discard BR-01 or unrelated changes.

---

# Part 10 - Stop Conditions

Stop and report when:

* branch or worktree preconditions fail;
* BR-01/BR-00 tests fail before editing;
* a test path leaves the OS temporary root;
* a player read or reload changes a source-file hash;
* exact normalization, ordering, limits, statuses, or response keys cannot be preserved;
* endpoint inventory differs from 34/6/28;
* debug route no longer precedes `:id`;
* correcting the stale cache requires a target API change;
* implementation requires another production file or dependency;
* another feature behavior changes;
* a process or listener remains;
* rollback cannot be limited to BR-02.

---

# Part 11 - Completion Checklist

BR-02 is complete only when:

* player filesystem access is behind `JsonPlayerRepository`;
* player normalization and search are outside root `server.js`;
* one player service owns the current cache and ID Map;
* the compatibility router owns all four current player routes;
* startup and reload use the same service;
* the stale-cache defect is corrected and tested;
* no player read or reload writes the player file;
* endpoint and response compatibility gates pass;
* full tests, syntax, whitespace, hashes, and cleanup pass;
* exact evidence is recorded;
* work stops before BR-03.

---

# Part 12 - Completion Record Template

```text
Work plan: BR-02
Branch:
Starting status:
Exact files changed:
Behavior changed:
Behavior preserved:
Normalization/search proof:
Read/reload hash proof:
Endpoint proof:
Commands and results:
Temporary fixtures:
Process cleanup:
Known test not run:
Discovered defects:
Rollback:
Ending status:
Next proposed work item: BR-03
```

---

# Part 13 - Next-Step Boundary

After BR-02 passes:

```text
BR-03 - Statistics Module and NHL Adapter
```

Archive BR-02, advance the canonical plan, inspect the cumulative worktree, and continue only within the approved BR-03 scope.

---

# Part 14 - Completion Record

```text
Work plan: BR-02
Branch: stage2
Starting status: BR-01 locally complete and uncommitted; no unrelated backend changes.
Exact files changed: server.js; routes/playersReadRoutes.js removed; src/application/services/players/normalizePlayer.js; src/application/services/players/createPlayerService.js; src/infrastructure/persistence/json/JsonPlayerRepository.js; src/transport/http/routes/playersCompatibilityRouter.js; test/characterization/playerCompatibility.test.js; test/characterization/readOnlyEndpoints.test.js; test/characterization/endpointManifest.test.js; test/helpers/readEndpointManifest.js.
Behavior changed: The documented stale player-cache reference defect is corrected; startup and reload now update the route-visible service cache, so the known synthetic player returns 200 instead of the accidental 404.
Behavior preserved: Current player JSON formats, alternate normalization keys, positive numeric IDs, file order, active-only search, all-token matching, list/search limits, debug shape, invalid/missing ID errors, reload response, and four endpoint paths.
Normalization/search proof: Alternate keys, active defaults, invalid IDs, duplicate IDs, order, whitespace/case normalization, token matching, active filtering, and limits passed focused tests.
Read/reload hash proof: Every GET and POST reload preserved the source player-file hash; missing sources were not created; malformed sources were not overwritten.
Endpoint proof: Endpoint inventory remained 34/6/28; player debug remains before :id; known, missing, malformed, debug, list, query, and reload HTTP behavior passed.
Commands and results: Focused player integration passed 16/16; npm.cmd run test:characterization passed 42/42; npm.cmd test passed 50/50; syntax, git diff --check, protected JSON hashes, and Node-process comparison passed.
Temporary fixtures: hundo-leago-br02-players-* directories below the OS temporary root, removed during teardown.
Process cleanup: Node process IDs matched before and after; no test server or listener remained.
Known test not run: None.
Discovered defects: None beyond later approved compatibility/security work.
Rollback: Restore the prior server player block and routes/playersReadRoutes.js; remove only the four new player modules and focused test; restore BR-02 characterization/helper edits.
Ending status: BR-01 and BR-02 changes are local and unstaged; no commit, push, merge, or deployment occurred.
Next proposed work item: BR-03
```

BR-02 is complete locally and intentionally uncommitted.

---

# Document Verification

```powershell
Get-Content ..\hundo-leago\docs\06-work-plans\archive\BR-02_PLAYER_READ_AND_RELOAD_MODULE.md
Select-String -Path ..\hundo-leago\docs\06-work-plans\archive\BR-02_PLAYER_READ_AND_RELOAD_MODULE.md -Pattern '^`APPROVED`$','^`COMPLETE`$','BR-02','Completion Record'
```

Expected:

* BR-02 is approved and complete;
* completion evidence is recorded;
* exact files, behavior, tests, rollback, and stop conditions are defined;
* no production data, target API, frontend, commit, push, or deployment authority is included.
