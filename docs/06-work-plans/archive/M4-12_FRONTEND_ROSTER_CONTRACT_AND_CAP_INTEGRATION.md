# M4-12 - Frontend Roster, Contract, and Cap Integration

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Approved Boundary

M4-12 connected the approved public roster projection to the isolated target
HTTP runtime and the stable-ID React team workspace. It did not add M4 command
controls, expose private fields, alter the compatibility production entrypoint,
deploy, or enable production authority.

The completed boundary:

1. adds one league- and team-scoped, read-only public roster service and target
   route with exact safe success and error envelopes;
2. composes the route only into the non-production target runtime;
3. validates the complete frontend response contract and rejects unknown,
   malformed, private, or internally inconsistent fields;
4. loads the selected team's roster through the existing authenticated league
   and stable-ID team workspace;
5. renders active, bench, injured-reserve, and prospect groups with capacity,
   player, contract, statistics, and empty-state information;
6. renders authoritative cap usage, limit, space, retention, buyout, and status
   values; and
7. keeps unavailable roster and contract mutations visibly read-only instead
   of simulating writes through the legacy JSON endpoint.

## Files Changed

### Backend public read integration

* `src/application/services/leagues/createPublicRosterService.js`
* `src/transport/http/createPublicRosterRouter.js`
* `src/bootstrap/createTargetRuntime.js`
* `test/foundation/publicRosterHttpFoundation.test.js`
* `test/foundation/targetRuntimeFoundation.test.js`

### Frontend roster integration

* `src/features/rosters/publicRosterContracts.js`
* `src/features/rosters/publicRosterQueries.js`
* `src/features/rosters/TeamRosterPage.jsx`
* `src/features/rosters/TeamRosterPage.test.jsx`
* `src/features/leagues/LeaguePages.jsx`
* `src/features/leagues/LeaguePages.test.jsx`

## Verification Evidence

All backend Node verification used Node `24.14.1`.

```text
Focused public-roster service and HTTP suite: 5/5 passed
Target-runtime integration slice: 26/26 passed across 7 suites
Cumulative M4 foundation set: 119/119 passed
Complete backend suite: 630/630 passed across 162 suites
Backend architecture suite: 4/4 passed
Backend JavaScript syntax: 277/277 parsed
Focused frontend roster and league-workspace suite: 10/10 passed
Complete frontend suite: 61/61 passed across 12 files
Frontend lint: passed
Frontend production build: passed
Backend and frontend diff checks: passed
Generated backend database artifacts: 0
Protected compatibility-data hash changes: 0
```

The frontend build retains one non-blocking advisory for a minified JavaScript
chunk larger than 500 kB.

## Safety Result

The public route is read-only and remains absent from the compatibility
production entrypoint. No shared database, compatibility JSON, deployment,
production mount, commit, or push was created or changed.
