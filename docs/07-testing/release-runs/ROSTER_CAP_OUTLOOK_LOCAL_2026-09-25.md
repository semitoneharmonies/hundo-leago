# Roster cap outlook — local verification, 2026-09-25

Status: local implementation and verification complete. No commit, push,
staging publication, production deployment, or live-data change performed.

## Requested behaviour

Add Cap outlook beside Table and Hockey lines. Display the current season and
next two seasons with saved contract commitments, retained salary, buyouts,
subtotals, cap usage, and cap space. Allow authorized Active ↔ Bench moves
inside the view, preserving normal confirmation, versioning, and permissions.

The projection uses saved year rows, not repeated current amounts or recalculated
buyout penalties. It uses the existing backend cap policy. Incoming retention
reduces the matching player's salary; outgoing retention and buyouts remain
separate cap charges. Bench, IR, and prospect commitments are displayed separately.
Future totals hold today's roster categories and cap limit constant. Viewing
the projection performs no writes. Existing table/lines views, public response,
roster-move commands, and financial rules are preserved.

## Files changed

Backend:

- `E:/hundo-leago-backend/src/domain/contracts/capOutlookPolicy.js`
- `E:/hundo-leago-backend/src/infrastructure/persistence/sqlite/SqliteCapOutlookReader.js`
- `E:/hundo-leago-backend/src/infrastructure/persistence/sqlite/SqliteTeamWorkspaceRepository.js`
- `E:/hundo-leago-backend/src/application/services/leagues/createTeamWorkspaceService.js`
- `E:/hundo-leago-backend/test/foundation/capOutlookFoundation.test.js`

Frontend and verification fixtures:

- `E:/hundo-leago/src/features/rosters/TeamRosterPage.jsx`
- `E:/hundo-leago/src/features/rosters/CapOutlook.jsx`
- `E:/hundo-leago/src/features/rosters/CapOutlook.module.css`
- `E:/hundo-leago/src/features/rosters/CapOutlook.test.jsx`
- `E:/hundo-leago/src/features/rosters/teamWorkspaceContracts.js`
- `E:/hundo-leago/src/test/capOutlookFixture.js`
- `E:/hundo-leago/e2e/cap-outlook.spec.js`
- `E:/hundo-leago/e2e/fixtures/cap-outlook.html`
- `E:/hundo-leago/e2e/fixtures/cap-outlook.jsx`

Documentation:

- `E:/hundo-leago/docs/03-product-specs/ROSTERS.md`
- `E:/hundo-leago/docs/04-technical-specs/API_CONTRACTS.md` (narrow additive paragraph; existing local changes preserved)
- `E:/hundo-leago/docs/07-testing/release-runs/ROSTER_CAP_OUTLOOK_LOCAL_2026-09-25.md`

Private tracker: task `roster-cap-outlook`, season scope, local completion only.
Other Git changes in both repositories were left in place.

## Checks actually run

Temporary test databases and browser artifacts stayed on E:. Backend tests used
`TEMP` and `TMP` set to `E:/hundo-leago-backend/.hundo.local/cap-outlook-test-temp`.

| Command | Result |
| --- | --- |
| `node --test test/foundation/teamWorkspaceFoundation.test.js test/foundation/capFoundation.test.js` | 6 passed |
| `node --test test/foundation/capOutlookFoundation.test.js test/foundation/rosterMovementFoundation.test.js` | 17 passed |
| `npx vitest run src/features/rosters/CapOutlook.test.jsx src/features/rosters/TeamRosterPage.test.jsx` | 21 passed |
| `npx playwright test e2e/cap-outlook.spec.js --project=desktop-chromium --project=mobile-chromium --reporter=line` | 2 passed, at 1280px and 393px |
| Focused ESLint on the changed roster JavaScript/JSX and new fixture/spec files | Passed |
| `npm run build` | Passed; existing >500kB chunk warning remains |
| `git diff --check` on changed tracked application and documentation files | Passed |

Financial checks include 1/2/3-year expiration, net incoming retention that ends
before the contract, outgoing retention, saved $0.63 buyouts, cap-exempt unsigned
and signed prospects, IR and bench, negative space, and incomplete cap evidence.
An isolated SQLite test reads every team in two fixture leagues with
`PRAGMA query_only = ON`, reconciles current cap usage, and verifies unchanged
`total_changes()` across the reads. Future obligation rows are tested separately.

Frontend checks include active-to-bench and bench-to-active writes using the
existing endpoint, authoritative refetch of all columns, retained view selection,
failure preservation, illegal-roster confirmation, read-only permissions, older
responses without the additive field, malformed schedule rejection, and existing
Table/Hockey lines navigation. Browser checks confirm no page overflow, contained
horizontal scrolling, sticky player names/move controls, and no page errors.

## Preview and remaining boundary

Local fixture: `http://127.0.0.1:5173/e2e/fixtures/cap-outlook.html`.
Choose **Cap outlook**. This uses clearly labelled synthetic data; moves change
only the fixture in that browser session. Screenshots:

- `E:/hundo-leago/.hundo.local/cap-outlook-preview-1280.png`
- `E:/hundo-leago/.hundo.local/cap-outlook-preview-393.png`

Full repository suites and signed-in hosted acceptance were not run. Publishing
requires coordinated backend/frontend releases: an older backend displays the
unavailable message. Future cap figures are planning projections, not predictions
of future signings, assignments, league settings, or legality.

## Team-colour visual refinement

After accepting the view's function, Graem requested a more polished appearance
with team colours. Changes are limited to `CapOutlook.jsx` and
`CapOutlook.module.css`: the shared team-colour helper supplies the saved palette
and pattern, with accents in the header, section labels, move buttons, and cap
space. Subtle alternating rows, clearer type hierarchy, and muted expired cells
improve scanning. Mobile move targets are 44px tall. Financial and move logic
are unchanged; there are no additional product requests or backend changes.

Verification after styling:

- Existing roster/Cap outlook Vitest tests: 21 passed.
- Existing desktop/mobile Chromium move and overflow checks: 2 passed.
- Focused `npx eslint src/features/rosters/CapOutlook.jsx`: passed.
- `npm run build`: passed; the existing chunk-size advisory remains.
- Local `node .hundo.local/cap-outlook-style/check-palettes.mjs`: Own Goal Hatty,
  all-light, and all-dark palettes checked at 1280px and 393px. All six runs
  reported zero axe colour-contrast violations, zero page errors, and no page
  overflow. The Own Goal Hatty desktop and mobile screenshots were inspected.

Style preview screenshots:

- `E:/hundo-leago/.hundo.local/cap-outlook-style/team-colours-1280.png`
- `E:/hundo-leago/.hundo.local/cap-outlook-style/team-colours-mobile-top.png`

The same local sample-data preview URL remains available. No deployment or live
data changes were made. Backend suites were not repeated for this visual-only
follow-up; their earlier results remain recorded above.
