# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M4-05
```

## Milestone

```text
M4 - League Assets and Cap System
```

## Work Item

```text
Rounded-AAV Contract and Contract-Year Schedule Foundation
```

---

# Objective

Implement the approved one-to-three-year normal contract representation with
exact original total cents and independently rounded AAV cents. Preserve all
existing contract relationships through a forward migration, then add a pure
contract policy and an atomic SQLite contract/schedule/event repository.

---

# Approved Representation

```text
original total: exact accepted bid/contract total in cents
AAV: original total divided by term, rounded to the nearest cent
example: 1000 cents / 3 years = 333 cents AAV
```

The one-cent difference between rounded AAV multiplied by term and original
total is a rounding consequence, not a modified original total.

---

# Completion Record

Completed locally on `2026-07-21`.

Files added:

```text
hundo-leago-backend/database/migrations/0006_allow_rounded_contract_aav.sql
hundo-leago-backend/src/domain/contracts/contractPolicy.js
hundo-leago-backend/src/infrastructure/persistence/sqlite/SqliteContractRepository.js
hundo-leago-backend/test/foundation/contractAavMigrationFoundation.test.js
hundo-leago-backend/test/foundation/contractFoundation.test.js
```

Schema-version expectations were advanced from 5 to 6 in the existing schema,
repository, target-runtime, JSON-import, independent-verification, and cutover-
rehearsal foundations. The migration preserves contracts and every approved
child relationship while changing only the AAV consistency check.

Delivered pure integer-cent nearest-cent calculation, exact normal-contract
minimum and precision rules, immutable current/future schedules, atomic
contract/year/event creation, one-active-contract enforcement, exact league
scope, and complete rollback for cross-league and late aggregate failures.

Verification:

```text
Focused M4-05: 9/9
Cumulative M4/M2/M3: 72/72
Affected import/verification/rehearsal: 16/16
Architecture boundary checks: 4/4
Complete backend under Node 24.14.1: 582/582 across 146 suites
JavaScript syntax under Node 24.14.1: 252/252 files
Whitespace, protected hashes, and artifact checks: passed
```

M4-05 is complete. No endpoint, authorization, frontend, deployment, or
production authority changed.
