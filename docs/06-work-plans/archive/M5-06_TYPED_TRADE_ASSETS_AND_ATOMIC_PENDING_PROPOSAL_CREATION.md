# M5-06 - Typed Trade Assets and Atomic Pending-Proposal Creation

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Work Plan ID

```text
M5-06
```

## Work Item

```text
Typed Trade Assets and Atomic Pending-Proposal Creation
```

# Objective

Add the approved stable typed-asset model and one idempotent league-scoped
transaction that creates a valid pending two-team proposal, its immutable asset
snapshots, and its creation event without reserving or transferring anything.

# Exact Scope

M5-06 may:

1. add one immutable ordered migration for creating-actor membership and
   authority, the effective acceptance-deadline snapshot, and strengthened
   typed trade-asset references and instructions;
2. validate at least one qualifying owned asset from each team and reject
   unsupported, duplicate, conflicting, cross-league, stale, released,
   expired, bought-out, spent, cancelled, or placeholder inputs;
3. support contracted Active, Bench, and Injured Reserve players; Prospect
   player rights; unspent existing draft picks; whole existing retained-salary
   and buyout-penalty obligations; existing outstanding Future Considerations;
   and an explicit Future Considerations instruction that creates no obligation
   until acceptance;
4. link requested retention to an included contract being sent by the current
   owner, validate exact positive cents and proposal-time ceiling/slot preview,
   and ensure the instruction does not by itself satisfy either team's minimum
   asset contribution;
5. preserve immutable proposal display evidence for identity, ownership,
   roster category, contract terms, pick history, obligation schedule, and
   requested instructions without treating snapshots as acceptance authority;
6. insert one `proposed` trade, all ordered asset rows, one append-only creation
   event, and one completed idempotency result inside a single immediate SQLite
   transaction; and
7. compose the creation service in the isolated target runtime without adding
   a public route or starting a job.

# Required Asset Semantics

Contracted-player assets use the stable contract identity and preserve the
current player and roster-category snapshot. Prospect rights use the stable
player identity only while the league ownership remains Prospect. Draft picks
must already exist, remain unspent, and preserve draft, round, original-team,
and current-owner evidence. Existing retention, buyout, and Future
Considerations obligations move only as whole stable obligations; their amount,
schedule, origin, and underlying reference do not change at proposal creation.

A requested-retention instruction must reference one included outgoing
contract and its current retaining team. A new Future Considerations instruction
must have its own stable proposal-asset identity and explicit safe description;
the stable outstanding obligation is created only if a later acceptance
transaction completes.

# Protected Boundaries

M5-06 must not reserve or transfer an asset, consume a retention slot, change
ownership, contract, roster, cap, pick, right, or obligation state, accept,
decline, cancel, counter, expire, automatically cancel, execute, reverse, or
correct a trade, add League Activity or notification writes, expose public
trade data, start a scheduler, change compatibility authority, deploy, or touch
production data.

Proposal creation must revalidate current manager or commissioner authority,
league and season state, Entry Draft opening, configured deadline, both teams,
and every asset inside the same transaction. Any validation, constraint,
idempotency, event, or late persistence failure must leave every table
unchanged. Separate pending proposals may contain the same asset.

# Verification

Completion must prove every approved asset type and mixed-asset proposals,
minimum contribution in both directions, duplicate/conflict rejection,
cross-league isolation, stale and unsupported asset denial, requested-retention
limits without slot consumption, immutable snapshots, independent simultaneous
proposals, idempotent exact replay and conflict, atomic rollback at every late
write seam, target-runtime composition without route or job startup, complete
backend regression, syntax, migration integrity, protected hashes, and zero
database artifacts under Node `24.14.1`.

# Expected Files

```text
database/migrations/0012_add_atomic_trade_proposal_assets.sql
src/domain/trades/tradeAssetPolicy.js
src/infrastructure/persistence/sqlite/SqliteTradeProposalRepository.js
src/application/services/trades/createTradeProposalService.js
src/bootstrap/createTargetRuntime.js
src/infrastructure/migration/rehearseStagingCutover.js
src/infrastructure/migration/verifyStagingImport.js
test/foundation/tradeAssetFoundation.test.js
test/foundation/tradeProposalCreationFoundation.test.js
test/foundation/tradeProposalMigrationFoundation.test.js
test/foundation/tradeProposalFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
test/foundation/jsonImportDryRun.test.js
test/foundation/stagingImportVerification.test.js
test/foundation/targetRuntimeFoundation.test.js
../hundo-leago/docs/04-technical-specs/DATA_MODEL.md
../hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

# Completion Record

M5-06 is complete locally. Migration `0012` preserves legacy proposal rows as
model version 1 while requiring creating membership, authority, a persisted
effective deadline, strict typed references or instructions, and non-empty JSON
snapshots for every model-version-2 proposal and asset.

The composed target service creates one pending proposal, all ordered assets,
one append-only creation event, and one completed idempotency result inside one
immediate transaction. It resolves and snapshots contracted players, prospect
rights, draft picks, retained-salary obligations, buyout obligations, existing
Future Considerations, new Future Considerations instructions, and requested
retention. Proposal-time retention preview includes obligations moving out and
in. No source asset is reserved, transferred, or otherwise changed, so the same
asset may remain in independent simultaneous pending proposals.

## Files Changed

```text
database/migrations/0012_add_atomic_trade_proposal_assets.sql
src/domain/trades/tradeAssetPolicy.js
src/domain/trades/tradeProposalPolicy.js
src/infrastructure/persistence/sqlite/SqliteTradeProposalRepository.js
src/application/services/trades/createTradeProposalService.js
src/bootstrap/createTargetRuntime.js
src/infrastructure/migration/rehearseStagingCutover.js
src/infrastructure/migration/verifyStagingImport.js
test/foundation/tradeAssetFoundation.test.js
test/foundation/tradeProposalCreationFoundation.test.js
test/foundation/tradeProposalMigrationFoundation.test.js
test/foundation/tradeProposalFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
test/foundation/jsonImportDryRun.test.js
test/foundation/commissionerCorrectionFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
docs/01-project/CURRENT_STATE.md
docs/04-technical-specs/DATA_MODEL.md
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

## Verification Evidence

All authoritative verification used the official Node `24.14.1` Windows
runtime after its SHA-256 matched Node's published manifest.

```text
Official Node archive SHA-256: 6E50CE5498C0CEBC20FD39AB3FF5DF836ED2F8A31AA093CECAD8497CFF126D70
Focused trade-policy, creation, migration, and runtime slice: 40/40 passed
Schema-integration slice: 50/50 passed
Architecture/import/trade integration slice: 22/22 passed
Complete backend suite: 707/707 passed across 181 suites
Backend runtime-declaration slice: 4/4 passed
Backend JavaScript syntax: 305/305 parsed
Backend diff check: passed
Generated repository database artifacts: 0
Protected compatibility-data hash changes: 0
Leaked Node processes from verification: 0
```

Protected hashes remained:

```text
players.json: C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1
database/reset-manifests/2026-season-1-reset.json: 0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491
```

No public trade route, scheduler, compatibility authority, production data, or
production deployment changed. M5-07 is the next checkpoint.
