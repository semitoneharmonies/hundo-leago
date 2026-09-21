# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M5-11
```

## Work Item

```text
Frontend Auction, Trade, Activity, and Notification Integration
```

# Objective

Complete the final M5 integration boundary by exposing the approved target
trade workflow and replacing the legacy browser-authoritative transaction UI
with authenticated, league-scoped auction, trade, League Activity, and in-app
notification screens. The backend remains authoritative for permissions,
timing, sealed values, validation, transfers, recovery, and persisted history.

# Exact Scope

M5-11 may:

1. compose the approved league-member trade list and detail reads, typed
   proposal creation, read-only acceptance preview, acceptance, decline, and
   cancellation routes in the isolated target runtime;
2. return proposal details with approved typed asset snapshots and status
   history while excluding operational secrets and cross-league data;
3. add frontend response contracts, queries, mutations, route paths, and
   authenticated league-context pages for active auctions and each manager's
   own sealed bid state;
4. add an authenticated trade list, status filters, typed proposal builder,
   proposal detail, acceptance preview and explicit confirmation, receiving-
   team decline, proposing-team cancellation, and current-commissioner safe
   reversal or correction-required controls;
5. add deterministic League Activity pagination and owner-only in-app
   notification list, one-notification read, and read-all controls;
6. invalidate only affected private query families when authenticated
   metadata-only Socket.IO events announce auction, trade, activity, or
   notification changes; and
7. remove or visibly quarantine legacy browser-authoritative transaction
   controls from authenticated target workflows without changing the separate
   compatibility backend or production authority.

# Explicit Boundaries

M5-11 does not:

* reveal another team's active bid value or term, including to commissioners;
* resolve, expire, accept, reverse, acknowledge, or otherwise mutate data from
  a GET request or Socket.IO invalidation;
* compute authoritative auction outcomes, trade transfers, cap, roster
  legality, permissions, deadlines, or recovery eligibility in the browser;
* add email or push notifications for normal auction or trade status;
* add trade counters, multi-team trades, cash, cap-space transfers, or new
  tradeable asset types;
* add generic correction, database-editing, or compatibility-state write
  controls;
* start M6 matchup, statistics, standings, or commissioner-recovery work;
* deploy, commit, push, or change production authority.

# Request and UI Rules

All target requests use the shared credentialed HTTP client, current backend
session and CSRF token. Unsafe commands use fresh idempotency keys and refetch
authoritative state after success. The UI displays server-safe errors and
request IDs, disables actions the current authenticated league context cannot
perform, and never treats cached browser state as proof that a write is legal.

The auction UI shows active auction timing, player identity, participation,
and only the caller team's bid value, term, AAV, cooldown and remaining edits.
Resolved results appear through League Activity. The trade UI shows approved
typed snapshots and performs acceptance preview before explicit acceptance.
Expired proposals leave the normal list and remain discoverable in activity.

# Verification

Completion must prove:

* all approved trade HTTP routes enforce authentication, active membership,
  participant or commissioner authority, CSRF, exact input, idempotency, stable
  error mapping, league isolation, and read-only GET behavior;
* trade list and detail projections preserve typed assets and safe history,
  including `reversed` and `correction_required` status projection;
* auction screens never render or retain competing active bid values;
* managers can start or update only authorized bids and see cooldown, edit,
  timing, precision, and server-warning states;
* proposal creation supports each approved typed asset shape and rejects
  malformed browser input before sending it;
* acceptance always previews and requires explicit confirmation; decline,
  cancellation, reversal, and correction controls appear only in their
  approved actor and status contexts;
* League Activity reads paginate without mutation and notifications remain
  owner-scoped with explicit read writes;
* metadata-only Socket.IO events trigger scoped refetch without applying an
  authoritative transaction in the browser;
* focused backend and frontend tests, complete backend and frontend suites,
  frontend lint and production build, JavaScript syntax, protected hashes,
  database-artifact checks, process checks, and diff checks pass.

# Expected Files

```text
src/transport/http/createTradeRouter.js
src/application/services/trades/createTradeReadService.js
src/infrastructure/persistence/sqlite/SqliteTradeProposalRepository.js
src/bootstrap/createTargetRuntime.js
test/foundation/tradeHttpFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
../hundo-leago/src/app/routePaths.js
../hundo-leago/src/App.jsx
../hundo-leago/src/features/transactions/*
../hundo-leago/src/features/notifications/*
../hundo-leago/src/features/leagues/LeaguePages.jsx
../hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

# Completion Gate

M5-11 is complete only when the focused integration evidence and the complete
M5 gate are recorded. Completion closes M5 and stops at the M6 planning
checkpoint; it does not authorize M6 implementation.

---

# Completion Record

Completed locally on `2026-07-21`.

## Behavior Delivered

* The isolated target runtime now composes authenticated, league-scoped trade
  list, proposal creation, detail, acceptance-preview, accept, decline, and
  cancel routes.
* Safe trade reads preserve every approved typed asset snapshot and status
  history, including `reversed` and `correction_required`, without writing.
* Authenticated auction pages expose active timing, participation, cooldown,
  remaining edits, and only the caller team's sealed bid values.
* Authenticated trade pages support all eight approved asset shapes, explicit
  acceptance preview and confirmation, actor-scoped lifecycle actions, and
  commissioner reversal or correction-required recovery controls.
* League Activity and owner-only notification pages use deterministic reads
  and explicit notification acknowledgement writes.
* Authenticated metadata-only Socket.IO events invalidate the affected list,
  detail, activity, and notification query families. The browser never applies
  an auction or trade transaction from event payloads.

## Files Changed

```text
src/domain/trades/tradeProposalPolicy.js
src/infrastructure/persistence/sqlite/SqliteAuctionBidRepository.js
src/infrastructure/persistence/sqlite/SqliteTradeProposalRepository.js
src/application/services/trades/createTradeReadService.js
src/transport/http/createTradeRouter.js
src/bootstrap/createTargetRuntime.js
test/foundation/auctionBidFoundation.test.js
test/foundation/tradeHttpFoundation.test.js
test/foundation/tradeProposalCreationFoundation.test.js
test/foundation/tradeProposalFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
../hundo-leago/src/App.jsx
../hundo-leago/src/app/AppProviders.jsx
../hundo-leago/src/app/routePaths.js
../hundo-leago/src/components/TopBar.jsx
../hundo-leago/src/features/leagues/LeaguePages.jsx
../hundo-leago/src/features/notifications/*
../hundo-leago/src/features/transactions/*
```

## Verification Result

All backend verification used Node `24.14.1`.

```text
Focused M5-11 backend trade/runtime gate: 34/34 passed
Focused auction sealed-display gate: 18/18 passed
Complete backend suite: 756/756 passed across 196 suites
Backend JavaScript syntax: 330/330 parsed
Complete frontend suite: 71/71 passed across 16 files
Frontend lint: passed
Frontend production build: passed (169 modules; bundle-size advisory only)
Protected players.json SHA-256:
C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1
Protected reset manifest SHA-256:
0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491
Generated database artifacts: 0
Additional Node processes: 0
Backend and frontend diff checks: passed apart from existing line-ending advisories
```

No deployment, production authority change, database artifact, commit, or push
was performed. M5 is complete and M6 implementation has not started.
