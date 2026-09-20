# Administrator league deletion

Status: implemented and verified locally on 20 September 2026; Graem then
approved staging publication. The isolated release adds only this feature to
backend `381ef8c` and frontend `ffb59eb`, preserving their newer administration,
buyout and scoring behavior. Publication and hosted acceptance are tracked
separately. No existing league is authorized for deletion.

## Request and approved behavior

Graem requested that admins be able to delete a league. This implements the
existing permanent-deletion rules in `LEAGUES_AND_TEAMS.md`, `PERMISSIONS.md`,
`DATA_MODEL.md`, and the declared DELETE route in `API_CONTRACTS.md`.
`OPERATING_MODE.md` was reviewed and remains `OFFSEASON_RESET`; no operating-mode
or production-release permission changed.

In **Your leagues → Platform administration**, choose the league to manage and
select **Review league deletion**. The preview identifies the league and affected
team, membership, season, and total record counts. The admin must type the exact
league name and explicitly confirm that deletion is permanent. Cancel sends no
DELETE. A confirmed success removes that league from the picker and its private
cache and remembered preference. Other leagues remain available.

## Backend contract

- `GET /api/v1/admin/leagues/:leagueId/deletion-preview`: read-only preview using
  current platform-administrator authority and protected active membership.
  Returns `LEAGUE_DELETION_PREVIEW`, league identity, `previewHash`, per-table
  `counts`, `retainedCounts`, and `totalRecords`.
- `DELETE /api/v1/admin/leagues/:leagueId`: authenticated, origin/CSRF-protected
  write. Requires an `Idempotency-Key` and JSON body
  `{ confirmed: true, leagueName, previewHash }`. Returns `LEAGUE_DELETED`, league
  identity, and `deletedRecords`.
- Invalid input returns 400; absent authentication 401; unauthorized authority
  or missing protected membership 403; nonexistent league 404; changed preview,
  in-flight league work, or reused incompatible idempotency key 409.
- The preview digest includes the current league and all its scoped rows, not
  just counts or the league version. Any changed data requires a fresh preview
  and confirmation. An exact retry returns the durable prior result without
  additional changes, even after the league itself is gone.

## Persistence and safety

The reviewed schema has 114 tables with required or optional league scope.
The dedicated deletion transaction explicitly targets `league_id`; users,
players, global statistics, and unrelated league/shared rows are preserved.
League teams, logos, memberships, invitations, notifications, rosters, contracts,
drafts, trades, matchups, history, pending jobs, and queued events are erased.
Leased/running league jobs and events currently publishing block deletion.

Existing security audit, migration report, and backup-catalog payloads are
retained with their removed league foreign key cleared. The new platform-level
operational receipt records the deleted league ID/name, row counts, preview
digest, and IDs of retained evidence, preserving their association with the
deleted league. A separate Security Audit event identifies the actor, session,
request, and deleted league. No backup objects or account credentials are touched.
There is no product-level deleted-league restoration action.

An immediate transaction excludes competing writers. Foreign keys remain enabled
and are deferred only until commit for cyclic relationships. As in the existing
fixture-erasure pattern, reviewed league delete guards are suspended inside that
transaction and restored from their exact original SQL before commit. Schema
equality and `foreign_key_check` must pass; any failure rolls back rows, receipts,
and schema changes. A pinned schema fingerprint rejects unreviewed schema or
guard changes before erasure. Future migrations must review the deletion scope
and advance that fingerprint deliberately.

The existing runtime write gate still applies. Publication and any operation on
a real league remain subject to the operating-mode and production-release rules.

## Changed application files

Backend, under `E:/hundo-leago-backend/`:

- `src/application/services/leagues/createLeagueDeletionService.js`
- `src/infrastructure/persistence/sqlite/SqliteLeagueDeletionRepository.js`
- `src/transport/http/createPlatformAdministrationRouter.js`
- `src/bootstrap/createTargetRuntime.js`
- `test/foundation/leagueDeletionFoundation.test.js`
- `test/foundation/targetRuntimeFoundation.test.js` (125 → 127 endpoint assertions)

Frontend, under `E:/hundo-leago/`:

- `src/features/leagues/LeaguePages.jsx`
- `src/features/leagues/LeagueDeletionPanel.jsx`
- `src/features/leagues/LeagueDeletionPanel.module.css`
- `src/features/leagues/leagueDeletionApi.js`
- `src/features/leagues/LeagueDeletionPanel.test.jsx`

Existing unrelated local changes were preserved; the already-dirty shared
`leagueQueries.js`, `theme-a.css`, and `API_CONTRACTS.md` were not edited.

## Verification actually run

1. `node --test test/foundation/leagueDeletionFoundation.test.js`: final 9/9 pass.
   Real migrated SQLite fixtures cover populated deletion, every fixture league,
   all unrelated rows, preserved backup/migration evidence, read-only preview,
   permissions, stale data, confirmation, in-flight work, audit failure,
   post-erasure rollback, exact trigger restoration, future-schema rejection,
   idempotent retry, and actual HTTP authentication/origin/CSRF behavior.
2. `node --test --test-isolation=none test/foundation/leagueDeletionFoundation.test.js test/foundation/platformAdministrationFoundation.test.js test/foundation/targetRuntimeFoundation.test.js`:
   the earlier eight-test deletion suite plus 64 existing cases yielded 70 passes
   and two obsolete endpoint-count failures. Both assertions were updated to 127;
   `node --test --test-name-pattern='declares 127|ordinary ten-team' test/foundation/targetRuntimeFoundation.test.js`
   then passed 2/2. These are separate runs, not a claim of one clean full-suite run.
3. `node node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1 src/features/leagues/LeagueDeletionPanel.test.jsx src/features/leagues/LeaguePages.test.jsx`:
   final 18/18 pass. The first fork-worker attempt timed out before running tests;
   the thread-worker run completed successfully.
4. Targeted ESLint on the four changed/new frontend JavaScript files passed.
5. `node node_modules/vite/bin/vite.js build --outDir .hundo.local/league-deletion-review/build`:
   passed; existing large-chunk warning remains.
6. Local Chromium at 1366px desktop and 390px phone widths: confirmed cancel is
   read-only, the destructive button requires confirmation, exactly one DELETE
   occurs, success removes only Alpha League, Beta League remains, no horizontal
   overflow, and no page errors. These browser checks use synthetic intercepted
   API responses; the real backend is verified separately above. Final screenshots
   were inspected and a discovered grid/checkbox layout issue was corrected.
7. Source syntax and focused Git whitespace checks passed.

Browser evidence: `E:/hundo-leago/.hundo.local/league-deletion-review/`, including
`browser-results.json`, desktop/phone screenshots, and `verify-ui.mjs`. Temporary
disk-based test fixtures were directed to
`E:/hundo-leago-backend/.hundo.local/league-deletion-tests/`; new deletion fixtures
were in memory. No staging or production database was accessed.

## Approved staging release preparation

The original working copy predates the deployed schema. Its local test results
above remain historical evidence; staging release validation uses the current
schema 57, including expanded scoring and commissioner-configured draft timing.
The erasure scope remains 114 tables; the three new statistics tables are global
and are preserved. The scoped delete guards are unchanged.

A read-only comparison of every staging schema object found one existing
allocation-table variant: its earlier rebuilt definition omits the historical
whole-dollar offer check and quotes the table name. Its columns, foreign keys and
delete guards are identical. The release explicitly pins both reviewed complete
schema digests, with a regression for this historical variant. Unknown schema
changes still fail closed. No schema or league-data repair is part of this release.

Backend deletion verification passed all 10 tests, including the exact historical
staging variant; the two affected runtime composition checks also pass. Backend
syntax and Git whitespace checks passed. Combined frontend verification passed all 669 tests across 81 files, including
27 focused administrator/deletion checks; targeted ESLint passed. The first
isolated frontend attempt lacked local Vite origins and was stopped; the passing
run sets those origins explicitly. The staging baseline read reported schema 57,
zero foreign-key violations and zero SQL changes, and recorded fingerprints of
18 protected tables. Release receipts live under
`E:/hundo-leago-backend/.hundo.local/league-deletion-release-20260920/`.

Remaining work is approved staging publication and read-only serving/data
verification. A signed-in hosted deletion journey requires a disposable league;
no current real league is selected or authorized for deletion.
