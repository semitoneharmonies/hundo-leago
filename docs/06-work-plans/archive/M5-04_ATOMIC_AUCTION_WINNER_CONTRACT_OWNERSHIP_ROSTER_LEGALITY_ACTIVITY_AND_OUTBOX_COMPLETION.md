# M5-04 - Atomic Auction Winner, Contract, Ownership, Roster, Legality, Activity, and Outbox Completion

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Approved Boundary

M5-04 completed one due target auction as one league-scoped, idempotent
SQLite transaction while preserving the separate production-activation
boundary.

The completed boundary:

1. revalidates auction version, due state, current season, player availability,
   current bids, and historical submission authority inside one immediate
   transaction;
2. persists one authoritative winner, no-winner, player-unavailable, or
   season-closed resolution and terminal auction/bid states;
3. creates a winner's rounded-AAV contract, yearly schedule, 14-day buyout
   lock, ownership, first available Active slot, and immutable history;
4. reuses matching future seasons or creates only the next one or two required
   planned seasons without dates, activation, or current-season changes;
5. permits only an auction resolution to persist an explicitly unplaced Active
   winner when every finite position slot is occupied, then records structural
   and cap warning evidence with the general-illegality result;
6. appends authenticated League Activity only for a completed signing, keeps
   skipped-invalid-bid details out of that activity, and writes a metadata-only
   socket invalidation to the outbox;
7. returns exact occurrence replays without duplicate writes or publication;
   and
8. rolls back every completion write when any late contract, ownership,
   history, activity, resolution, or outbox operation fails.

## Files Changed

```text
database/migrations/0011_add_atomic_auction_completion.sql
src/domain/auctions/auctionCompletionPolicy.js
src/domain/rosters/rosterAssignmentPolicy.js
src/infrastructure/persistence/sqlite/SqliteAuctionResolutionRepository.js
src/application/services/auctions/createAuctionResolutionService.js
src/bootstrap/createTargetRuntime.js
src/infrastructure/migration/rehearseStagingCutover.js
src/infrastructure/migration/verifyStagingImport.js
test/foundation/auctionCompletionMigrationFoundation.test.js
test/foundation/auctionCompletionFoundation.test.js
test/foundation/auctionBidFoundation.test.js
test/foundation/jsonImportDryRun.test.js
test/foundation/rosterAssignmentFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
test/foundation/commissionerCorrectionFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
docs/04-technical-specs/DATA_MODEL.md
```

## Verification Evidence

All authoritative verification used the official Node `24.14.1` Windows
runtime after its SHA-256 matched Node's published manifest.

```text
Focused completion, migration, prior resolution, job, roster, and runtime slice: 57/57 passed across 13 suites
Complete backend suite: 688/688 passed across 176 suites
Backend root and runtime-declaration slice: 7/7 passed
Backend JavaScript syntax: 296/296 parsed
Backend and documentation diff checks: passed
SQLite integrity and foreign-key checks: passed
Generated repository database artifacts: 0
Protected compatibility-data hash changes: 0
Temporary Node verification artifacts removed: 3/3
```

## Safety Result

No public result endpoint, commissioner recovery action, notification delivery,
trade behavior, running scheduler, compatibility-authority change, deployment,
production mutation, commit, or push was added. The target runtime composes the
completion service but does not start the auction-resolution job. M5-05 is the
next review checkpoint.
