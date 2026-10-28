# Illegal roster helper and scheduled-games optimization

Status: implemented in the existing isolated local candidates; final local verification recorded below. No release, live roster changes, buyouts or other live transactions are authorized by this feature request.

## Requested behavior and bounded design

The user requested a button inside the illegal-roster flag that suggests a legal arrangement, preferably automatically applying a legal roster with the most scheduled games in its matchup week. If roster moves cannot solve it, show instructions. Buyouts must not be automatic.

The primary current flag is `src/features/rosters/TeamRosterPage.jsx`. Authorized managers/commissioners will receive **Suggest a fix**, which expands a read-only preview. It lists player moves, final cap, the exact target matchup week and game-opportunity comparison. **Apply these moves** separately confirms the whole plan. Opening the flag/page does not change rosters.

The backend is authoritative. Its planner considers only currently owned Active, Bench and Injured Reserve players. It preserves prospect categories, contracts, retained salary, buyout obligations, trade assets and ownership. It enforces maximum 12 forwards/6 defence, four Bench slots with underlying AAV at most $4, four IR slots with the existing injury eligibility rules, supported positions, valid contracts, and net active salary plus existing obligations under the configured cap. Empty active slots remain legal under current rules. Existing unknown-status IR assignments may remain under current rules, but an explicitly healthy player cannot remain there; new IR placement still requires eligibility.

With complete schedule/team evidence, the exact planner maximizes scheduled NHL game opportunities for players not currently marked injured, then prefers fewer injured active players and fewer moves with deterministic ties. It does not predict appearances, injury recovery or fantasy points. Without sufficient schedule evidence it offers a legal arrangement with minimal moves and clearly omits game-optimization claims. Missing contract/position/cap data or an impossible arrangement produces explicit manual blockers; no guess, buyout, release, signing or trade occurs.

The backend chooses an applicable persisted week and states it in the preview. Before a normal lock, the full saved week window matters. A currently illegal/unlocked team during its week can only benefit from future games after a successful late lock; already-started games and prior points cannot be recovered. An existing legal scoring lock remains immutable: target the next available week, or offer legality-only repair if none exists. Late-lock capture remains the established coordinator's responsibility.

Application is one atomic command with a server-generated revision binding roster/contract/injury/cap/week/schedule state and the planned assignments. The server rechecks authority and rebuilds that plan, validates the final state, applies the existing logged movement semantics in one transaction and coordinates late lock once after final commit. It does not loop over independent HTTP moves: an intermediate legal roster could otherwise lock before the final lineup is ready. Bench/IR transitions retain Active-mediated movement semantics internally. Failure rolls back the entire batch; stale plans require another preview.

## Workspace and ownership

Frontend: `E:/hundo-leago/.hundo.local/loading-menu-20261027/frontend`, accepted base `9955d66a84799539c08d8fb52f1b30d2aa8cb9ec`.

Backend: `E:/hundo-leago/.hundo.local/loading-menu-20261027/backend`, accepted base `4fd3aa385ba6a3b2f524d36a268ffb8246d87ea5`.

Both branches are `codex/loading-menu-20261027`. Earlier loading/menu/logo, announcement and IR-name fixes remain in place. Original dirty roots and accepted release sources are preserved.

## Verification plan

Pure planner tests will compare small cases with an exhaustive oracle and exercise cap/retention, gross Bench salary, healthy IR, injury prioritization, deterministic ties, impossible rosters, missing schedule, and input preservation. API/database tests will cover authorization and league isolation, read-only preview, CSRF/input validation, stale injury/contract/ownership/week state, atomic rollback, explicit apply, one final late-lock call, immutable locked snapshots and unchanged unrelated records. Frontend and browser tests will cover the dropdown review, explicit apply, permission/identity changes, failure recovery, unavailable schedule and manual blockers. Build/lint/diff checks complete the local scope.

## Implemented paths

Backend paths, relative to the backend candidate above:

- `src/domain/rosters/rosterRepairPolicy.js`: exact bounded roster-assignment search, deterministic ties, minimal-change fallback and no partial result after search exhaustion.
- `src/application/services/leagues/createRosterRepairService.js`: authorized preview, saved matchup-week selection, NHL team alias normalization, schedule evidence, revision checks and one transactional apply followed by one late-lock coordination call.
- `src/infrastructure/persistence/sqlite/SqliteRosterRepairRepository.js`: scoped read evidence and outer immediate transaction around existing movement repository semantics.
- `src/transport/http/createRosterRepairRouter.js`: additive POST `roster/repair-preview` and `roster/repair` endpoints with the existing session, origin and CSRF controls. Preview is read-only despite using POST.
- `src/bootstrap/createTargetRuntime.js`: guarded repository/service/router registration; no schema migration.
- `test/foundation/rosterRepairPolicy.test.js` and `test/foundation/rosterRepairFoundation.test.js`: planner, service, database and HTTP regression coverage. `test/foundation/targetRuntimeFoundation.test.js` updates the route inventory from 226 to 228 and asserts both new paths dispatch to the repair router.

Frontend paths, relative to the frontend candidate above:

- `src/features/rosters/RosterRepairPanel.jsx`, `.css` and `rosterRepairApi.js`: expandable review, contract-validated preview and explicit apply, error/stale handling and local league cache refresh. Incomplete cap values are hidden when a plan is unavailable.
- `src/features/rosters/TeamRosterPage.jsx`: helper inside the current illegal-roster flag for managers/commissioners; disables competing roster move, order and cap actions during apply.
- `src/features/rosters/RosterRepairPanel.test.jsx` and `TeamRosterPage.test.jsx`: review/application states, authority, identity isolation, stale responses, retry, concurrent controls and unchanged reviews during statistics-only refresh.
- `e2e/fixtures/roster-repair.html`, `roster-repair.jsx`, `e2e/roster-repair.spec.js`, and `playwright.loading-menu.config.js`: synthetic local browser coverage only.

## Local verification results

Commands use Node `E:/hundo-tools/node-v24.14.1-win-x64/node.exe`. TEMP/TMP and browser test artifacts remain on E:.

- `node --test test/foundation/rosterRepairPolicy.test.js test/foundation/rosterRepairFoundation.test.js`: **21/21 passed**. The pure planner includes 80 independent exhaustive comparisons on small rosters, full 26-player capacity, cap/retention, gross Bench limits, injury rules, ties and bounded-search failure. Database/HTTP tests prove read-only preview, exact confirmation, permissions, isolation, stale revisions, rejection after authority changes, byte-preserving rollback on a second-move failure, repeat-apply rejection, final source-slot ownership witnesses and preservation of contracts, prospects, pending trades and existing scoring snapshots. Schedule regressions cover NHL aliases, unknown teams/TBD times, complete pre-lock week counts, exclusion of started games after lock, and same-ID week-boundary changes during the provider wait. The final run included `lateLockCoordinatorFoundation.test.js`: **36/36 passed** together.
- Selected `targetRuntimeFoundation.test.js` bootstrap/dispatch/composition checks: **7/7 passed**, covering the exact 228-endpoint inventory, every endpoint/preflight dispatch, application construction, repository/service/router/socket construction without writes/listening, installed endpoint uniqueness, unmigrated-database rejection and explicit local database closing.
- Selected `lateLockCoordinatorRepositoryFoundation.test.js` and `rosterMovementFoundation.test.js` regressions: **7/7 passed**, covering read-only final ownership receipts, stale ownership rejection, existing legal-lock exclusion, transactional movement and source-slot synchronization, durable-publication rollback, affected ownership witnesses and Active/IR transitions. Final backend total: **50/50 passed**. Logs: backend `.tmp/repair-and-coordinator.log`, `.tmp/repair-bootstrap.log`, `.tmp/repair-existing-writers.log`.
- `node node_modules/vitest/vitest.mjs run src/features/rosters/RosterRepairPanel.test.jsx src/features/rosters/TeamRosterPage.test.jsx --no-cache --configLoader runner`: **41/41 passed**.
- `node node_modules/@playwright/test/cli.js test --config playwright.loading-menu.config.js e2e/roster-repair.spec.js --workers=1 --output ../roster-repair-browser-results`: **12/12 passed**, desktop/mobile Chromium/WebKit. Tests exercise preview without roster writes, explicit apply, failed-apply recovery, blocked plans and viewer restrictions. Both desktop Chromium and mobile WebKit review screenshots were visually inspected. Browser game counts and roster data are illustrative synthetic values.
- Focused ESLint over the eight changed/new roster and browser JavaScript/JSX/config files: **passed**. The browser fixture was exported to satisfy the existing React refresh rule.
- `node node_modules/vite/bin/vite.js build --configLoader runner`: **passed**, 1,943 modules. The existing large-chunk warning remains.
- `git diff --check` in both candidates: **passed**.

Browser preview: `http://127.0.0.1:5197/e2e/fixtures/roster-repair.html`. Evidence: `../roster-repair-browser-results`, `../roster-repair-desktop-chromium.png`, and `../roster-repair-mobile-webkit.png`.

Reproduction commands for the final bounded backend run (from the backend candidate; Node path and TEMP/TMP as above):

```powershell
node --test test/foundation/rosterRepairFoundation.test.js test/foundation/rosterRepairPolicy.test.js test/foundation/lateLockCoordinatorFoundation.test.js
node --test --test-name-pattern="declares 228|selects exactly one intended|requires the exact router set|constructs every repository|installs every declared target|fails closed for an unmigrated|opens and idempotently closes" test/foundation/targetRuntimeFoundation.test.js
node --test --test-name-pattern="accepts a canonical multi-ownership receipt|fails closed when any present ownership|excludes legal, late, non-live|synchronizes the moved|returns every ownership changed|rolls the roster move and histories back|supports the required Active-to-IR" test/foundation/lateLockCoordinatorRepositoryFoundation.test.js test/foundation/rosterMovementFoundation.test.js
```

Syntax checks passed for the service, repository, router, bootstrap, new integration tests and updated route-inventory tests. The private tracker was validated at revision 1581 with this task locally complete; its launch measure was unchanged.

## Verification boundary and release scope

The feature optimizes scheduled opportunities for players not marked injured, not actual appearances or fantasy points. Missing schedule/team evidence falls back to minimal roster changes, with no game-count claim. The search is bounded; exhaustion offers no partial automatic plan. No legal arrangement means a separate manager decision, never an automatic buyout, trade, signing or release. An apply that succeeds while late-lock data is unavailable still saves the legal roster and reports that scoring capture is waiting.

The new repair integration tests spy on the once-after-commit coordinator boundary; the existing late-lock subsystem remains responsible for actual scoring capture. No physical-device checks, Firefox, full repository suite or authenticated hosted acceptance is claimed. No live roster, contract, account or league record was accessed or changed for this implementation.

An initial broader six-file regression run was deliberately stopped after about five minutes of repeated disk-backed migration fixtures. Its coordinator checks completed, but no full-run success is claimed. The final bounded checks above cover the changed routes and the relevant existing movement/locking boundaries. A new synthetic week-race test initially violated the fixture's end/rollover constraint; updating both fixture timestamps made the intended stale-preview assertion pass. No application rule was relaxed to pass that test.

Earlier loading/menu/logo, seven-day announcement/removal and IR first-name fixes remain in these same candidates, documented in their separate records. This feature adds two API endpoints and requires a coordinated backend/frontend release. All changes remain uncommitted, unpublished and undeployed. Deployment and authenticated hosted acceptance remain separate.

## Readability follow-up — 27 October 2026

The user found the roster-fix preview too wordy. Presentation is now compact: one visible timing sentence, separate cap/games tiles, larger player names with from/to rows and abbreviated IR destinations, a primary Apply these moves button, and a quieter Refresh suggestion button. Longer backend explanations and the game-opportunity caveat are collapsed under Details; blocked-plan instructions remain accessible under How to fix it. Essential locked-lineup and late-lock distinctions remain visible. Incomplete cap totals remain hidden. The illegal flag wraps the helper onto its own row, and scoped typography overrides prevent the flag's small-text rules from shrinking move labels.

Changed files for this follow-up: `src/features/rosters/RosterRepairPanel.jsx`, `RosterRepairPanel.css`, `RosterRepairPanel.test.jsx`, `e2e/roster-repair.spec.js`, `e2e/fixtures/roster-repair.jsx`, and this record. The synthetic blocked fixture now displays its actual blocked-state message. Backend, API contract, optimization, permissions, preview revision and apply behavior are unchanged.

Verification: the existing focused Vitest pair passed **41/41**, using the command above. The existing roster-repair browser spec passed **12/12** with `--workers=1 --output ../roster-repair-simple-browser-results`, across desktop/mobile Chromium/WebKit. Checks now verify the compact visible summary, collapsed/expanded explanation, manual guidance, explicit apply, retry and viewer permissions. Focused ESLint, `git diff --check` and Vite production build passed; the existing bundle-size warning remains. No backend rerun was needed for this presentation-only follow-up.

Desktop and mobile Chromium screenshots were visually inspected: `../roster-repair-simple-desktop-chromium.png` and `../roster-repair-simple-mobile-chromium.png`. Preview URL is unchanged. No deployment, commit, push or live-data operation occurred. Physical-device and hosted acceptance remain unverified.
