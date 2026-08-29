# M5-03 - Durable Auction Resolution and Anti-Bluff Pricing

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Approved Boundary

M5-03 added deterministic target-authoritative resolution decisions and
durable job coordination while preserving the M5-04 atomic winner-completion
boundary.

The completed boundary:

1. calculates exact submitted AAV and ranks eligible bids by highest AAV,
   shorter term, earliest original submission, then stable ascending bid ID;
2. calculates single-bid and multi-bid anti-bluff prices, including tied-
   competitor behavior and the smallest term-valid precision-preserving total;
3. returns explicit not-due, seasonal-close, already-owned, no-winner, winner,
   and skipped-invalid-bid decisions without mutating league state;
4. loads due identities and candidates through league-scoped SELECT-only
   SQLite queries and revalidates starting/joining minimums plus historical
   submission authority from durable event evidence;
5. claims one durable `job_runs` occurrence per auction and due instant with
   expiring leases, retry, restart replay, attempt counts, optimistic versions,
   and sanitized completion metadata;
6. adds an unstarted coordinator that calls an injected future atomic
   completion service and succeeds only after that service confirms completion;
   and
7. composes only the read-only repository and decision service in the isolated
   target runtime.

## Files Changed

```text
src/domain/auctions/auctionResolutionPolicy.js
src/infrastructure/persistence/sqlite/SqliteAuctionResolutionRepository.js
src/application/services/auctions/createAuctionResolutionDecisionService.js
src/jobs/definitions/resolveTargetAuctions.js
src/infrastructure/persistence/sqlite/SqliteAuctionRepository.js
src/infrastructure/persistence/sqlite/SqliteAuctionBidRepository.js
src/bootstrap/createTargetRuntime.js
test/foundation/auctionResolutionFoundation.test.js
test/foundation/auctionResolutionJobFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
docs/04-technical-specs/DATA_MODEL.md
```

## Verification Evidence

All authoritative verification used Node `24.14.1`.

```text
Focused M5-03 policy, persistence, and job suite: 16/16 passed across 4 suites
Auction and target-runtime regression slice: 65/65 passed across 16 suites
Complete backend suite: 674/674 passed across 173 suites
Backend root-boundary suite: 3/3 passed
Backend JavaScript syntax: 292/292 parsed
Backend and documentation diff checks: passed
Generated backend and frontend database artifacts: 0
Protected compatibility-data hash changes: 0
```

## Safety Result

No `auction_resolutions`, auction-status, bid-status, winner, contract,
ownership, roster assignment, legality result, League Activity, notification,
or outbox write was added to resolution. No endpoint or scheduler was added or
started. Compatibility behavior, frontend behavior, shared databases,
deployment, production authority, commits, and pushes were unchanged. M5-04 is
the next planning checkpoint.
