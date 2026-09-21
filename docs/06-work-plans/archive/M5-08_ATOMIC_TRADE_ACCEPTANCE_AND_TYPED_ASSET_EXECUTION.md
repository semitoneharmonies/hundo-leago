# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`ACTIVE`

## Work Plan ID

```text
M5-08
```

## Work Item

```text
Atomic Trade Acceptance and Typed-Asset Execution
```

# Objective

Turn one currently pending model-version-2 proposal into one idempotent atomic
completed trade. Acceptance must repeat every M5-07 authority, deadline,
ownership, eligibility, cap, roster, retention, and asset check inside the
execution transaction, transfer every typed asset with unchanged underlying
terms and complete history, and automatically cancel proposals made stale by
the transferred identities.

# Exact Scope

M5-08 may:

1. add one immutable ordered migration for execution evidence and the minimum
   explicit unplaced-trade roster representation required to persist an
   approved generally illegal normal roster without violating finite-slot
   uniqueness;
2. add a receiving-manager or explicit current-commissioner acceptance command
   for a currently pending model-version-2 proposal before its persisted
   effective deadline;
3. repeat every M5-07 acceptance-preflight check inside one immediate SQLite
   transaction and return the resulting general-illegality evidence;
4. transfer rostered ownership and the active contract together while
   preserving roster category, F/D position, contract identity, type, original
   value, original term, AAV, year schedule, expiry, and buyout-lock instant;
5. transfer prospect rights, including an attached fantasy ELC, without
   changing prospect status or contract terms;
6. transfer unused draft-pick ownership while preserving stable pick identity,
   original team, target season, round, position, and append-only ownership
   history;
7. transfer whole retention and buyout obligations by changing only the current
   responsible team and appending attributable history without changing any
   amount, schedule, origin, contract, player, or transaction identity;
8. create the exact requested-retention obligation and remaining current/future
   yearly schedule, and create or transfer Future Considerations as directed;
9. append all required ownership, contract, pick, trade-completion, and
   automatic-cancellation evidence; and
10. atomically cancel other pending proposals whose transferred asset
    identities are no longer owned or eligible after completion.

# Execution Semantics

Successful acceptance moves the proposal directly from storage `proposed` to
`completed`, sets both response and completion instants to the one authoritative
acceptance instant, and increments its version once. The public product status
projects as `Accepted`. There is no intermediate externally observable
`accepted` state.

Finite destination slots are assigned deterministically in current category and
position order when available. A transfer that has no finite destination slot
uses the migration's explicit unplaced-trade representation, remains in its
current normal roster category, and sets the approved general-illegality flag.
The trade does not silently move a player between Active, Bench, Injured
Reserve, and Prospect categories.

Exact idempotent replay returns the already completed aggregate without another
transfer, event, history row, or cancellation. Conflicting reuse, concurrent
acceptance, stale ownership, a terminal proposal, exact-deadline arrival, or any
late write failure changes nothing.

# Protected Boundaries

M5-08 must not expose a public HTTP route; add League Activity, notification,
email, Socket.IO, or outbox publication owned by M5-09; reverse or correct a
completed trade owned by M5-10; implement the Entry Draft clock or selection
workflow; automatically expire through a read; start a scheduler; change
compatibility authority; deploy; or touch production data.

M5-08 must not rewrite contract value, term, AAV, year rows, buyout-lock timing,
retention amount or schedule, buyout penalty or schedule, pick origin, or
proposal snapshots. General cap or roster illegality is returned and persisted
as execution evidence where required; it is not a reason to partially apply,
silently normalize, or reject an otherwise authoritative approved transaction.

# Verification

Completion must prove receiving-manager and commissioner authority; wrong-team,
public, cross-league, inactive, frozen-manager, terminal, stale, and exact-
deadline denial; exact replay and conflicting reuse; all typed assets transfer
once; contract and obligation terms remain byte-for-byte unchanged except for
approved current responsibility fields; requested-retention ceiling, slot, and
year creation; repeated draft-pick transfers with full history; prospect status;
Future Considerations creation and transfer; deterministic occupied and
unplaced roster outcomes; legal and generally illegal results; conflicting
pending-proposal cancellation with recorded reason; concurrent acceptance; late
failure rollback at every effect boundary; target-runtime composition; complete
backend regression, syntax, migration integrity, protected hashes, and zero
database artifacts under Node `24.14.1`.

# Expected Files

```text
database/migrations/0013_add_atomic_trade_execution.sql
src/domain/trades/tradeExecutionPolicy.js
src/infrastructure/persistence/sqlite/SqliteTradeProposalRepository.js
src/application/services/trades/acceptTradeProposalService.js
src/bootstrap/createTargetRuntime.js
test/foundation/tradeExecutionFoundation.test.js
test/foundation/tradeExecutionMigrationFoundation.test.js
test/foundation/tradeProposalCreationFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
../hundo-leago/docs/04-technical-specs/DATA_MODEL.md
../hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

# Approval Record and Next Boundary

Grae's 2026-07-21 instruction explicitly authorizes continued M5 checkpoint
implementation without repeated routine approval unless canonical documents are
unclear. M5-08 is therefore approved and active after the completed M5-07
checkpoint. After every M5-08 gate passes, archive it and advance to M5-09
League Activity and notification publication for completed transactions.
