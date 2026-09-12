# M5-01 - Auction Creation Window and Player Eligibility

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Approved Boundary

M5-01 created the first target auction foundation without adding an endpoint or
changing compatibility authority.

The completed boundary:

1. adds nullable `seasons.free_agent_draft_completed_at_ms` through immutable
   migration `0009`, preserving every pre-migration season value;
2. calculates the Monday opening, Friday cutoff, and Sunday `4:00 PM` bid-close
   and resolution instant from the stored IANA timezone, including daylight-
   saving transitions;
3. requires the active current season to have started, remain before regular-
   season/playoff closure, and have a completed Free Agent Draft;
4. derives manager or commissioner team authority from current league,
   membership, assignment, and commissioner records, including manager freeze
   enforcement;
5. validates the active F/D player pool, current ownership and rights absence,
   released-rights exclusion, and one-active-auction rule within one league;
6. validates starting-bid minimum, precision, one-to-three-year term, and
   rounded AAV; and
7. atomically creates one stable auction, first bid, append-only start event,
   and completed scoped idempotency record, with matching-key replay and full
   rollback after a late failure.

## Files Changed

```text
database/migrations/0009_add_free_agent_draft_completion.sql
src/domain/auctions/auctionCreationPolicy.js
src/infrastructure/persistence/sqlite/SqliteAuctionRepository.js
src/infrastructure/migration/verifyStagingImport.js
src/infrastructure/migration/rehearseStagingCutover.js
test/foundation/auctionCreationFoundation.test.js
test/foundation/commissionerCorrectionFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
test/foundation/jsonImportDryRun.test.js
test/foundation/targetRuntimeFoundation.test.js
docs/04-technical-specs/DATA_MODEL.md
```

## Verification Evidence

All authoritative verification used Node `24.14.1`.

```text
Focused M5-01 policy, migration, and repository suite: 10/10 passed
Migration and target-runtime regression slice: 58/58 passed across 11 suites
Cumulative M4 and M5 foundation set: 138/138 passed across 36 suites
Complete backend suite: 640/640 passed across 164 suites
Backend architecture suite: 4/4 passed
Backend JavaScript syntax: 280/280 parsed
Backend and documentation diff checks: passed
Generated backend database artifacts: 0
Protected compatibility-data hash changes: 0
```

## Safety Result

No compatibility route, target HTTP route, public read, scheduled resolution,
contract, roster assignment, League Activity, outbox event, Socket.IO event,
shared database, deployment, production mount, commit, or push was created or
changed. M5-02 is the next planning checkpoint.
