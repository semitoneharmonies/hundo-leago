# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`ACTIVE`

## Work Plan ID

```text
M5-07
```

## Work Item

```text
Trade Response, Cancellation, Expiry, and Acceptance-Preflight Lifecycle
```

# Objective

Add the authorized pending-proposal lifecycle around M5-06 without transferring
an asset: receiving-team rejection, proposing-team cancellation, durable expiry,
trade-deadline closure, and a read-only acceptance preflight that revalidates
current authority, deadlines, every typed asset, and the approved general-
illegality warning before M5-08 owns execution.

# Exact Scope

M5-07 may:

1. add one immutable ordered migration only for lifecycle evidence that the
   existing schema cannot represent safely;
2. add league-scoped manager and commissioner commands for rejection and
   cancellation of a currently pending proposal with exact participant roles;
3. add an idempotent expiry command and durable scheduled-job definition that
   marks overdue pending proposals expired at the earlier persisted effective
   deadline without mutating on reads or starting a scheduler;
4. make the configured trade deadline close new proposals and acceptance at the
   exact instant while preserving already terminal history;
5. add a read-only acceptance preflight for the receiving manager or explicit
   commissioner that revalidates proposal state, actor authority, ownership,
   eligibility, contracts, roster categories, picks, rights, obligations,
   retention ceiling and slots, cap, roster counts, and general illegality;
6. preserve append-only response, cancellation, and expiry trade events with
   actor or system identity and safe reason codes; and
7. compose services and the dormant job definition in the isolated target
   runtime without adding a public route or starting work automatically.

# Status Semantics

Storage `declined` projects as `Rejected`, `cancelled` as `Cancelled`, and
`expired` as `Expired`. Only `proposed` may transition. A receiving manager may
reject; a proposing manager may cancel. A current commissioner may explicitly
perform either action. Exact idempotent replay returns the same terminal result;
conflicting reuse fails without writes. Terminal proposals never revive.

Acceptance preflight does not accept, reserve, transfer, publish, or change a
proposal. It returns the authoritative effective deadline, current typed-asset
evidence, resulting team previews, and the one approved general-illegality flag.
M5-08 must repeat every authoritative check inside its execution transaction.

# Protected Boundaries

M5-07 must not transfer ownership, contracts, roster categories, draft picks,
prospect rights, retention, buyout penalties, or Future Considerations; create
new retention or Future Considerations obligations; set a proposal accepted or
completed; automatically cancel stale proposals because another trade executed;
counter, reverse, or correct a trade; add League Activity or notifications;
expose public trade data; start a scheduler; change compatibility authority;
deploy; or touch production data.

GET and other read-only calls must never expire, reject, cancel, accept, repair,
or otherwise mutate proposal state. Every lifecycle write must re-read the
proposal, actor authority, teams, league, and relevant deadline inside one
immediate transaction. Any validation, event, idempotency, or late persistence
failure must leave all tables unchanged.

# Verification

Completion must prove manager, commissioner, wrong-team, public, cross-league,
inactive, and frozen permissions; exact pending-only transitions; rejection,
cancellation, exact-boundary expiry, overdue durable expiry, deadline closure,
idempotent replay and conflict; append-only events; no mutation on reads;
acceptance-preflight current-state and stale-asset revalidation across every
typed asset; requested-retention and obligation-slot previews; legal and
generally illegal outcomes; atomic late-failure rollback; dormant target-runtime
job composition; complete backend regression, syntax, migration integrity,
protected hashes, and zero database artifacts under Node `24.14.1`.

# Expected Files

```text
database/migrations/0013_add_trade_lifecycle_idempotency.sql (only if required)
src/domain/trades/tradeLifecyclePolicy.js
src/infrastructure/persistence/sqlite/SqliteTradeProposalRepository.js
src/application/services/trades/respondToTradeProposalService.js
src/application/services/trades/previewTradeAcceptanceService.js
src/jobs/definitions/expireTradeProposals.js
src/bootstrap/createTargetRuntime.js
test/foundation/tradeLifecycleFoundation.test.js
test/foundation/tradeAcceptancePreviewFoundation.test.js
test/foundation/tradeLifecycleJobFoundation.test.js
test/foundation/tradeProposalCreationFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
../hundo-leago/docs/04-technical-specs/DATA_MODEL.md
../hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

# Approval Record and Next Boundary

Grae's 2026-07-21 instruction explicitly authorizes continued M5 checkpoint
implementation without repeated routine approval unless canonical documents are
unclear. M5-07 is therefore approved and active after the completed M5-06
checkpoint. After every M5-07 gate passes, archive it and advance to M5-08
atomic trade execution with unchanged transferred contract terms.
