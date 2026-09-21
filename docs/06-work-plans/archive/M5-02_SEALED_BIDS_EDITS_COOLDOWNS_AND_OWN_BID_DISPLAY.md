# M5-02 - Sealed Bids, Edits, Cooldowns, and Own-Bid Display

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Approved Boundary

M5-02 added target-authoritative sealed bidding and safe active-auction reads
without enabling resolution or production authority.

The completed boundary:

1. adds immutable migration `0010`, preserving each pre-migration bid while
   deriving and storing its lowest valid offered AAV for later anti-bluff
   pricing;
2. enforces one current bid per team, one-to-three-year terms, exact precision,
   `$1.50`/`$3`/`$5` joining minimums, and the exact 75-minute manager cooldown;
3. preserves stable bid IDs, original timestamps, private append-only events,
   two manager edits for the starter, and one for every other bidder;
4. lets the current commissioner submit or replace a stable identified bid
   without seeing active values or consuming manager edit allowance;
5. provides authenticated active-auction list/detail projections with player,
   participant, count, and deadline data while returning bid values only to the
   current assigned manager for that team;
6. composes target POST start, GET list/detail, PUT own-bid, and PATCH
   commissioner-bid routes while providing no manager withdrawal route; and
7. preserves league isolation, optimistic versions, idempotent replay, atomic
   rollback, safe errors, read immutability, and production isolation.

## Files Changed

```text
database/migrations/0010_add_auction_bid_lowest_offered_aav.sql
src/domain/auctions/auctionBidPolicy.js
src/infrastructure/persistence/sqlite/SqliteAuctionRepository.js
src/infrastructure/persistence/sqlite/SqliteAuctionBidRepository.js
src/application/services/auctions/createAuctionService.js
src/transport/http/createAuctionRouter.js
src/bootstrap/createTargetRuntime.js
src/infrastructure/migration/verifyStagingImport.js
src/infrastructure/migration/rehearseStagingCutover.js
test/foundation/auctionBidFoundation.test.js
test/foundation/auctionHttpFoundation.test.js
test/foundation/auctionCreationFoundation.test.js
test/foundation/commissionerCorrectionFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
test/foundation/jsonImportDryRun.test.js
test/foundation/targetRuntimeFoundation.test.js
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/DATA_MODEL.md
```

## Verification Evidence

All authoritative verification used Node `24.14.1`.

```text
Focused M5-02 policy, migration, persistence, service, and HTTP suite: 18/18 passed across 5 suites
M5-02 migration and target-runtime regression slice: 81/81 passed across 18 suites
Complete backend suite: 658/658 passed across 169 suites
Backend root-boundary suite: 3/3 passed
Backend JavaScript syntax: 286/286 parsed
Backend and documentation diff checks: passed
Generated backend database artifacts: 0
Protected compatibility-data hash changes: 0
```

## Safety Result

No commissioner-removal, cancellation, resolution, contract, ownership,
roster-assignment, League Activity, notification, Socket.IO publication,
frontend integration, shared database, deployment, production mount, commit,
or push was created or changed. M5-03 is the next planning checkpoint.
