# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M5-10
```

## Work Item

```text
Commissioner Trade Reversal and Correction-Required Recovery Routing
```

# Objective

Add the approved commissioner-only recovery boundary for completed model-
version-2 trades. A read-only preview must prove whether every transferred
asset and trade-created obligation is still in the exact post-trade state. A
safe reversal must restore the complete pre-trade asset and category state in
one idempotent transaction. An unsafe trade must not be partially reversed and
may be routed explicitly to `Correction Required` without exposing arbitrary
database editing.

# Exact Scope

M5-10 may:

1. add one minimum ordered migration for explicit reversal or correction-
   required evidence only where the existing trade, event, correction, activity,
   idempotency, and outbox tables cannot enforce the approved workflow;
2. add current-commissioner-only read-only reversal preview for one completed
   model-version-2 trade, including one deterministic recoverable flag and safe
   reason codes for every mismatch;
3. prove exact post-trade state for transferred rostered players and contracts,
   prospect rights and fantasy ELCs, unused draft picks, whole retention and
   buyout obligations, existing Future Considerations, and obligations created
   by that trade;
4. reject direct reversal when a transferred asset or created obligation has
   been consumed, moved, bought out, fulfilled, expired, corrected, deleted, or
   otherwise changed after completion;
5. atomically return every recoverable asset to its pre-trade owner and roster
   category, preserve unchanged contract terms, return whole obligation
   responsibility, remove only trade-created retention schedules and Future
   Considerations, set the trade to storage `reversed`, and append complete
   typed history;
6. perform reversal after the trade deadline because reversal is a correction,
   while still requiring the current commissioner, active membership, exact
   trade version, explicit confirmation, and exact idempotency;
7. add an explicit current-commissioner command that changes an unsafe completed
   trade to storage `correction_required`, moves no asset, and records the safe
   mismatch evidence in trade history and `commissioner_corrections` using a
   standardized recovery reason;
8. add safe League Activity and metadata-only transactional-outbox evidence in
   the same transaction as reversal or correction-required routing; and
9. compose the approved reversal-preview, reverse, and correction-required
   target services and `/api/v1` routes.

# Explicit Boundaries

M5-10 does not:

* provide generic undo, SQL, JSON, filesystem, or unrestricted asset editing;
* guess a destination when exact pre-trade state cannot be restored;
* partially move assets before deciding that a reversal is unsafe;
* reopen a reversed or correction-required trade;
* revive automatically cancelled proposals;
* create a new manager trade or enforce the ordinary trade deadline;
* alter matchup snapshots, points, results, or standings;
* expose active auction bids or private account data;
* edit frontend code; or
* deploy, commit, push, or change production authority.

# Atomicity and Idempotency

Preview is SELECT-only. Safe reversal and correction-required routing each use
one immediate SQLite transaction. The feature state, typed history,
commissioner correction index where applicable, League Activity, idempotency
result, and outbox evidence commit together or all roll back. Exact replay is
write-free; conflicting key reuse or a stale version changes nothing.

# Verification

Focused tests must prove:

* public, manager, inactive, replaced-commissioner, and cross-league identities
  gain no preview or write authority;
* preview is byte-for-byte read-only and reports every approved unsafe state;
* a safe reversal restores all eight approved execution asset forms, original
  roster categories and slots, unchanged contract terms, cap inputs, and
  retention-slot responsibility;
* only trade-created retention and Future Considerations rows are removed;
* repeated draft-pick ownership history remains append-only;
* reversal after the deadline succeeds when otherwise safe;
* unsafe reversal and late injected failure leave every asset and status
  unchanged;
* correction-required routing moves no asset and persists only approved
  recovery, activity, idempotency, and outbox evidence;
* exact replay and conflicting idempotency reuse behave deterministically;
* target routes enforce authentication, current commissioner authority, CSRF,
  exact confirmation input, and stable error mapping; and
* focused regression, the complete backend suite, syntax checks, protected
  hashes, artifact checks, and process checks pass.

# Completion Gate

M5-10 is complete when all verification above passes and its factual evidence
is recorded before M5-11 frontend integration becomes active.

# Completion Evidence

M5-10 completed locally on `2026-07-21`.

The implementation adds schema version `14`, exact post-trade recoverability
checks, SELECT-only commissioner reversal preview, an idempotent atomic safe
reversal, and explicit correction-required routing when direct reversal is not
safe. It covers rostered contracts, prospect rights and fantasy ELCs, unused
draft picks, existing retention and buyout obligations, existing Future
Considerations, requested retention, and Future Considerations created by the
completed trade. A safe reversal restores exact original ownership, roster
category and slot state while preserving unchanged terms. An unsafe reversal
moves no asset.

The three approved current-commissioner recovery routes are composed in the
isolated target runtime. Reversal and correction-required writes append typed
history, commissioner-correction evidence, League Activity, exact idempotency,
and metadata-only outbox evidence in the same immediate SQLite transaction.

## Files Changed

```text
database/migrations/0014_add_trade_reversal_and_correction_required.sql
src/domain/trades/tradeReversalPolicy.js
src/infrastructure/persistence/sqlite/SqliteTradeReversalRepository.js
src/application/services/trades/createTradeReversalService.js
src/transport/http/createTradeRecoveryRouter.js
src/bootstrap/createTargetRuntime.js
src/infrastructure/migration/rehearseStagingCutover.js
src/infrastructure/migration/verifyStagingImport.js
test/foundation/tradeProposalCreationFoundation.test.js
test/foundation/tradeRecoveryHttpFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
test/foundation/jsonImportDryRun.test.js
test/foundation/commissionerCorrectionFoundation.test.js
```

## Verification Result

All backend verification used Node `24.14.1`.

```text
Focused M5-10 and regression gate: 75/75 passed across 16 suites
Complete backend suite: 751/751 passed across 195 suites
Backend JavaScript syntax: 327/327 parsed
Protected players.json SHA-256:
C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1
Protected reset manifest SHA-256:
0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491
Generated database artifacts: 0
Additional Node processes: 0
Backend diff check: passed apart from existing line-ending advisories
```

No shared database, compatibility JSON authority, deployment, production mount,
commit, or push was created or changed. M5-11 frontend integration is the next
active checkpoint.
