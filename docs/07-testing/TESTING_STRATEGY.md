# Hundo Leago - Testing Strategy

## Document Status

`APPROVED`

This testing strategy defines:

* the test layers, tools, environments, fixtures, and evidence required for Season 2;
* the distinction between behavior characterization and approved target-behavior tests;
* backend, frontend, database, security, Socket.IO, job, migration, recovery, and browser testing;
* the gates for local changes, work-plan completion, staging, migration, release, and production smoke checks;
* technical testing decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the testing decisions and approved adoption of this strategy on 2026-07-18.

Launch-critical FAD browser coverage was added on 2026-07-27. Exact FAD domain,
transaction, clock, privacy, API, frontend, job, recovery, and migration proof
is defined by the approved technical specification at
`docs/04-technical-specs/FREE_AGENT_DRAFT.md`.
The 2026-07-29 FAD decision package adds the explicit cross-layer acceptance
matrix below for scheduled rollover, automatic readiness, adaptive help,
whole-card legality, auction controls and draws, queued nominations, and
whole-Monday schedule recovery.

### FAD-06 Auction Read Closure Evidence - 2026-08-02

The final local auction-family gate passed `161/161` tests across `22` suites
in `17` files. Alongside focused hand-schema repository and projection tests,
a fresh full migration composes the real target runtime, SQLite read
repository, service, router, and authenticated managers. That proof covers
bounded opaque-cursor paging, exact collection/detail envelopes, own-bid
visibility, cross-manager active-value privacy, and unchanged SQLite
`total_changes` across GET requests. It also covers historical-plus-active bid
rows, immutable restricted Candidate allowlists with separate removal state,
and terminal safe player position after conflicting providers and preferred
source replacement. This evidence is local only; it opened no shared database
and authorized no staging or production write.

---

## Purpose

Hundo Leago contains financial-like cap obligations, timed auctions, multi-asset trades, immutable matchup snapshots, scheduled jobs, security-sensitive accounts, and a future production-data migration.

Testing must prove more than whether the application starts.

It must detect:

* accidental behavior changes during refactoring;
* hidden writes from read requests;
* partial multi-record transactions;
* duplicate scheduled or retried operations;
* cross-league information leaks;
* stale frontend data overwriting newer state;
* incorrect money, contract, roster, scoring, or standings calculations;
* session, CSRF, permission, and token failures;
* migration loss, duplication, ambiguity, or reset overreach;
* backup files that cannot actually be restored;
* browser workflows that pass only through manual assumptions.

The strategy favors small deterministic tests close to the responsible logic, then adds realistic integration and browser proof at the boundaries.

---

## Out of Scope

This document does not:

* implement the tests;
* authorize production writes;
* select a hosted continuous-integration provider;
* replace feature acceptance criteria;
* define production secrets;
* require visual snapshot testing of every page;
* make code coverage a substitute for behavior verification;
* authorize disposable use of production data.

Each active work plan identifies the exact tests required for its contained change.

---

# Part 1 - Authority and Current State

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Feature specifications own expected behavior. This strategy owns how evidence is produced.

---

## Operating Mode

Reviewed mode:

```text
OFFSEASON_RESET
```

Destructive tests are permitted only in a `DEVELOPMENT_TEST` environment using disposable local or staging data.

Production storage, the production persistent disk, production secrets, and unredacted production backups are never test fixtures.

---

## Reviewed Test State

Current reviewed state:

* backend work item `BR-00` completed the initial Node built-in test harness locally;
* the focused characterization suite passes 16 tests;
* `npm test` and the backend syntax check pass;
* the frontend has lint and build scripts but no automated test runner;
* the frontend has no browser end-to-end suite;
* the backend remains mostly in `server.js`;
* current validation has relied heavily on browser checks, curl, health responses, and direct file inspection;
* a fully isolated persistent staging environment does not yet exist;
* the repositories contain local and production-like data files that must not be rewritten by tests.

This strategy defines the target. It is not evidence that the target test system already exists.

---

# Part 2 - Core Principles

## Test the Contract, Not the Implementation

Tests should assert:

* inputs and outputs;
* persisted effects;
* emitted post-commit invalidations;
* authorization decisions;
* stable error codes;
* transaction and idempotency behavior;
* user-visible results.

They should not generally assert:

* private helper call order;
* component internals;
* exact SQL text;
* incidental log wording;
* CSS class names without a user-facing reason;
* implementation-specific React state.

Refactoring a correct implementation should not require rewriting every test.

---

## Characterization Is Not Approval

Compatibility characterization records what the current system does so behavior-preserving extraction is safe.

A characterization test may prove an insecure or outdated current fact, such as:

* public compatibility access;
* broad league replacement;
* body-supplied actor metadata;
* internal path disclosure.

The test must label that fact as compatibility behavior. It must not be reused as the target Season 2 acceptance test.

When a target endpoint replaces compatibility behavior:

1. keep the old characterization while old callers remain;
2. add approved target tests;
3. move the frontend caller;
4. retire the old test with the old endpoint.

---

## Determinism

Tests control:

* time;
* randomness;
* IDs;
* external provider responses;
* event publication;
* email delivery;
* filesystem paths;
* database files;
* network ports.

No test waits for a real Monday, auction deadline, NHL game, seven-day expiry, or five-minute draft clock.

Time is injected as UTC milliseconds and timezone calculations explicitly use `America/Vancouver` where league rules require it.

---

## Isolation

Every test owns its mutable state.

Tests do not depend on:

* execution order;
* a previous test's account;
* a shared modified database;
* a shared browser page;
* a production-like file in a repository root;
* another worker finishing first.

Tests may share immutable factory definitions but not mutable runtime records.

---

## Lowest Useful Level

Use:

* pure unit tests for calculations and policies;
* repository tests for persistence behavior;
* service tests for transactions and complete use cases;
* HTTP contract tests for transport and security;
* component tests for user interaction and rendering;
* browser tests for critical integrated workflows;
* manual QA for visual, exploratory, and operational confirmation.

Do not test every calculation only through a browser.

---

## Failure Must Be Visible

A failed test reports:

* the expected and actual outcome;
* safe request or fixture identity;
* relevant request ID;
* temporary artifact path when retained for debugging;
* server stdout/stderr when a child process fails;
* Playwright trace or screenshot when applicable.

Failure output must not contain a password, raw token, production secret, or active sealed bid belonging to another team.

---

# Part 3 - Approved Tooling

## Backend

The backend initially uses Node's built-in test runner:

```text
node --test
```

Reasons:

* no test-framework dependency is required;
* CommonJS is supported;
* the refactor specification already selects it;
* temporary filesystem, child process, HTTP, mocking, and concurrency tests are possible with Node APIs.

Initial backend scripts:

```json
{
  "scripts": {
    "test": "node --test",
    "test:unit": "node --test \"test/unit/**/*.test.js\"",
    "test:characterization": "node --test \"test/characterization/*.test.js\"",
    "test:contract": "node --test \"test/contract/**/*.test.js\"",
    "test:integration": "node --test \"test/integration/**/*.test.js\"",
    "check": "node --check server.js"
  }
}
```

Scripts are introduced only when their directories and useful tests exist.

No assertion library, HTTP test library, or mocking framework is added until Node's built-ins prove insufficient.

---

## Frontend Unit and Component Tests

The frontend uses:

```text
Vitest
jsdom
React Testing Library
DOM Testing Library
Testing Library user-event
Testing Library jest-dom matchers
Vitest V8 coverage provider
```

This stack is selected because it works with Vite's transformation pipeline and tests React through user-observable DOM behavior.

The exact compatible versions are pinned in `package-lock.json` when the test-foundation work plan is implemented. Dependency installation is a focused change, not a side effect of this document.

Target frontend scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

Vitest globals remain disabled. Tests explicitly import `describe`, `test`, `expect`, and mock functions so dependencies are visible.

---

## Browser Tests

Critical browser workflows use:

```text
Playwright Test
```

Projects:

| Project | Normal pull request | Nightly or release |
| --- | --- | --- |
| Desktop Chromium | Required | Required |
| Mobile Chromium | Required for affected responsive workflows | Required |
| Desktop Firefox | Focused when affected | Required |
| Desktop WebKit | Focused when affected | Required |
| Mobile WebKit | Focused when affected | Required for launch-critical pages |

Local retries are `0`.

Continuous-integration retries are at most `1`, with a trace retained on the first retry and screenshots only on failure. A retry pass is reported as flaky and does not become invisible success.

---

## API Mocking Decision

No general network-mocking dependency is selected initially.

Frontend unit and component tests inject:

* a fake HTTP client;
* a fresh Query Client;
* a fake session;
* a fake realtime invalidation source;
* an in-memory router.

Playwright uses a real local or staging backend with disposable data.

If repeated low-level fetch mocking becomes difficult, an approved later testing-maintenance step may add Mock Service Worker. It is not required preemptively.

---

## Accessibility Automation

Critical pages use automated accessibility checks through Playwright and a reviewed axe-core integration before release.

Automation supplements, but does not replace:

* keyboard testing;
* visible focus review;
* label and instruction review;
* zoom and reflow checks;
* screen-reader spot checks for critical account and transaction flows.

---

# Part 4 - Test Repository Structure

## Backend

```text
hundo-leago-backend/
|-- test/
|   |-- helpers/
|   |-- fixtures/
|   |-- characterization/
|   |-- unit/
|   |-- repositories/
|   |-- services/
|   |-- contract/
|   |-- integration/
|   |-- security/
|   |-- migration/
|   |-- recovery/
|   `-- jobs/
`-- ...
```

Tests use `.test.js`.

Pure domain tests may be colocated only when a future focused decision shows that colocating improves ownership. The initial backend uses the central `test/` tree.

---

## Frontend

```text
hundo-leago/
|-- src/
|   |-- test/
|   |   |-- setup.js
|   |   |-- renderApp.js
|   |   |-- createTestQueryClient.js
|   |   |-- fakes/
|   |   `-- fixtures/
|   `-- features/
|       `-- <feature>/
|           `-- *.test.jsx
|-- e2e/
|   |-- fixtures/
|   |-- pages/
|   `-- *.spec.js
|-- playwright.config.js
`-- vite.config.js
```

Frontend unit and component tests are colocated with the feature they verify. Shared test helpers live in `src/test/`. Full browser workflows live in `e2e/`.

---

## Generated Artifacts

Git ignores:

```text
coverage/
test-results/
playwright-report/
*.sqlite3
*.sqlite3-wal
*.sqlite3-shm
temporary migration reports
copied private source bundles
```

Reviewed synthetic fixtures and deliberate small golden reports may be committed.

---

# Part 5 - Test Data

## Synthetic by Default

Ordinary tests use synthetic data factories.

Factories create:

* users;
* credentials through test-only hash helpers;
* sessions;
* leagues;
* memberships;
* teams;
* players and provider IDs;
* roster placements;
* contracts and yearly schedules;
* auctions and bids;
* trade assets;
* matchup weeks and locks;
* statistics;
* finalized results;
* standings inputs;
* draft assets;
* audit and activity records.

Factory defaults are valid and minimal. Each test overrides only the condition it is testing.

---

## Required Two-League Fixture

Authorization and isolation suites use at least:

```text
League A
League B
```

They deliberately include:

* overlapping team display names;
* overlapping player pools;
* a user belonging to only one league;
* a user belonging to both leagues with different authority;
* a platform administrator without membership in one league;
* stable IDs that cannot be inferred from names.

Every league-owned endpoint receives a cross-league negative test.

---

## Sensitive Source Copies

Copied production or current live-like data may be used only for:

* approved migration rehearsal;
* backup and restore rehearsal;
* a specifically authorized defect reproduction that cannot be represented synthetically.

Controls:

* read-only source bundle;
* access-controlled local or staging location;
* no Git;
* no frontend asset directory;
* no logs containing private rows;
* derived test database stored outside production;
* deletion under the approved artifact-retention procedure.

---

## Fixture Versioning

Fixtures state:

* schema version;
* purpose;
* assumptions;
* expected current or target behavior.

When a schema migration changes fixtures, a migration test proves old supported fixtures still migrate or deliberately records their retirement.

---

# Part 6 - Time, Money, Randomness, and Concurrency

## Time

All time-dependent domain and service code receives an injected clock.

Tests cover:

* exact boundary millisecond;
* one millisecond before;
* one millisecond after;
* Pacific daylight-saving transitions;
* Monday `4:00 PM Pacific` roster lock;
* auction opening and closing windows;
* session absolute and idle expiry;
* reset, verification, setup, and reactivation token expiry;
* trade deadline and reopening;
* matchup rollover;
* competition end with contract years unchanged and displayed as
  `Pending Rollover`; and
* contract expiry/advancement only inside the persisted scheduled Entry
  Draft-start rollover, including failure and retry boundaries.

UI countdown tests use fake timers, but final authority is always the backend timestamp and response state.

---

## Money and Fantasy Points

Tests use integer:

```text
cents
fantasy-point hundredths
```

Boundary tables include:

* valid whole-number total contract values;
* one- and two-decimal AAV;
* nearest-cent rounding;
* non-divisible total and term rejection where required;
* `$1 AAV` yearly minimum;
* `$4.00 AAV` bench boundary;
* `$100.00` cap boundary;
* retention cumulative `50%` boundary;
* `25%` buyout schedule;
* large safe-integer rejection.

Tests do not compare authoritative floating-point money.

---

## Randomness

Lottery, tie-break, session, action-token, CSRF, and ID behavior use injected generators where deterministic output is required.

Security tests verify properties such as length, uniqueness, digest-only storage, and one-time use. They do not assert one hard-coded production secret.

Lottery tests supply recorded random draws and verify:

* integer weights;
* two draws without replacement;
* fixed finalists;
* undrawn order;
* immutable audit inputs and output.

---

## Concurrency

Concurrency tests deliberately race:

* two logins for one user;
* two token consumptions;
* duplicate auction resolution;
* duplicate trade acceptance;
* asset-changing trade and buyout;
* two roster moves;
* draft selection and on-clock pick trade;
* job lease acquisition;
* idempotent request retries;
* stale version updates;
* account deactivation and protected write.

Assertions cover final state, history, outbox, and absence of partial changes.

---

# Part 7 - Backend Test Layers

## Characterization

The characterization baseline was established by completed work plan `BR-00` and remains a required gate for each behavior-preserving backend-refactor step.

It proves:

* exact endpoint inventory;
* current safe response shape;
* current persistence effects;
* current job and event behavior;
* read-only file hashes;
* league-store behavior.

Characterization tests stay isolated from target tests through their directory and naming.

---

## Domain Unit Tests

Pure tests cover:

* roster legality;
* cap calculation;
* contract total, term, AAV, and yearly schedules;
* retention;
* buyout;
* auction ranking and winner price;
* trade asset validation;
* position normalization;
* schedule generation;
* fantasy points;
* matchup scoring;
* standings order;
* draft lottery and eligibility.

Each approved rule receives:

* normal case;
* lower boundary;
* upper boundary;
* invalid case;
* relevant empty state.

---

## Repository Tests

Every repository runs against a new temporary SQLite database migrated to the expected version.

Repository tests cover:

* row mapping;
* foreign keys;
* unique and partial unique constraints;
* same-league conditions;
* optimistic versions;
* ordering and pagination;
* exact money and time representation;
* prepared-statement behavior;
* transaction participation;
* read-only methods not changing data.

Repository tests do not mock SQLite.

---

## Service Transaction Tests

Service tests use real repositories and a temporary database where transaction behavior matters.

They verify:

* authentication context;
* permission policy;
* input and current-state validation;
* all related writes commit together;
* injected failure rolls everything back;
* activity, audit, notification, and outbox rows appear only when approved;
* events publish only after commit;
* event failure does not undo a committed transaction;
* idempotent replay returns the original result;
* stale versions cannot overwrite newer state.

---

## HTTP Contract Tests

Target endpoint tests cover:

* method and path;
* authorization category;
* request schema;
* success envelope;
* error envelope;
* status code;
* content type;
* cache and security headers;
* CSRF and Origin;
* `If-Match`;
* idempotency;
* pagination;
* information redaction.

The expected contract is written independently from the implementation.

---

## 2026-07-29 FAD Decision-Package Matrix

The FAD test suite must map each rule below to the lowest useful layer and to
at least one integrated service, HTTP, job, or browser proof where the rule
crosses a boundary:

* the next contract-year rollover runs at the persisted scheduled Entry Draft
  start; contracts remain visibly `Pending Rollover`, and both drafting and
  trading remain locked until one atomic attempt succeeds;
* a failed scheduled rollover leaves no partial contract, ownership,
  retention, buyout, trade, season, schedule, activity, notification, or
  outbox effect, persists exact blockers, and supports an idempotent retry;
* the internal readiness-handoff primitive can run only inside its caller's
  transaction: caller rollback leaves no operation/job, an injected pair-write
  failure rolls back the caller's terminal state, exact trigger replay creates
  one pair, mismatched source evidence fails closed, and no HTTP completion or
  handoff route exists;
* a simulated future final T-108 selection/confirmed-forfeiture transaction
  commits its terminal pick, Entry Draft `Complete` state, and exact
  `entry_draft_completed` operation/job together, while the real T-108 endpoint
  and Entry Draft UI remain M8 `PLANNED`;
* T-036 genuine-inaugural and T-037 initial-Season-2 exemption transactions
  create only their exact trigger pair atomically; T-095 never creates a
  trigger and may only evidence/requeue the same blocked inaugural occurrence
  after confirmed schedule creation;
* the resulting Entry Draft or approved no-draft trigger causes FAD readiness
  automatically, opens every team card or none, persists blockers, and exposes
  only an idempotent retry rather than manual opening parameters;
* all three readiness trigger paths bind the exact completed Entry Draft,
  inaugural target season, or initial-Season-2 exemption resource; each real
  retry advances the blocked occurrence and job even when blockers repeat,
  stale `If-Match` returns `FAD_READINESS_PRECONDITION_FAILED`, and exact
  idempotent replay returns the original immutable `202` receipt after later
  blocking or success without a write;
* T-127 reads only the readiness operation and latest immutable completed
  attempt, never invokes preflight or a preview route, and independently passes
  byte and semantic no-write proof; its public diagnostics are exactly `code`,
  `message`, and nullable `resourceId`, while the operation's internal blocker
  evidence remains exactly `code`, nullable `field`, nullable `resourceType`,
  nullable `resourceId`, and `message`;
* every completed worker attempt commits one immutable canonically hashed
  blocked or succeeded attempt for the exact operation, job, attempt number,
  and observed operation version; a real retry with identical blockers creates
  a new attempt, whereas stale replay cannot create or substitute evidence;
* fresh pending, blocked retry, and expired-running readiness claims update the
  same job and operation atomically; fresh/blocked claims advance synchronized
  attempt counts once, while expired reclaim preserves both counts and original
  start times, rejects a live lease, fences the expired token, and rolls back
  both writes at every injected seam; an abandoned lease has no separate
  completed-attempt row and the next terminal result uses the retained number;
* T-128 atomically validates authority, `If-Match`, and idempotency, resets the
  same canonical job cleanly to `pending`, leaves attempt count unchanged,
  inserts one immutable receipt, advances blocked readiness exactly one
  version, and completes idempotency; injected failure at every seam rolls all
  effects back and exact replay remains write-free after later state changes;
* repeated blocked attempts create at most one notification for the same
  season, readiness operation, and current commissioner, while a replacement
  commissioner receives one notification under a distinct deduplication key;
* fresh `1 -> 31` and exact `30 -> 31` migration tests pin migration `0031` at
  `46,693` bytes and SHA-256
  `f2c5104f2eb06e261cc902067bd4623b841f2c37a04f73d27487863077b2662a`,
  preserve frozen migration `0030`, and reproduce `126` application tables,
  `127` including the migration ledger, `126` catalog entries, `44`
  require-empty tables, `82` signed-policy tables, and `62` delete guards;
* additive migration `0032` preserves the exact bytes of migrations `0030`
  and `0031`, is pinned at `27,882` bytes with SHA-256
  `ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`,
  creates no table or index, retains that inventory, adds only the job-side
  reclaim guard, and replaces only the readiness forward-update trigger with
  the exact expired-lease handoff branch that preserves attempt counts and
  original start timestamps;
  fresh `1 -> 32` and exact `31 -> 32` paths are identical;
* additive migration `0033` preserves migrations `0030` through `0032`, adds
  only immutable T-095 corrective-requeue evidence plus its exact guards, and
  proves fresh and exact `32 -> 33` paths; its insert/update/delete,
  same-league/source, result/generation, old/new version, unchanged-attempt,
  canonical-blocker, duplicate-result, rollback, and exact-replay cases all
  fail closed outside the one approved T-095 transaction; it is pinned at
  `56,084` bytes and SHA-256
  `93714178a4c89687578ca340afbe69c317239118cb50765838e6123ff6faf7f1`
  and reproduces `127` application tables, `128` including the migration
  ledger, `127` catalog entries, `45` require-empty tables, `82` signed-policy
  tables, and `63` delete guards;
* additive migration `0034` is pinned at `1,158` bytes and SHA-256
  `9347331419ada113707a4e71ef87c578ddd3cd0bd4ddb9578164f08b3307bb36`;
  fresh `1 -> 34` and exact `33 -> 34` tests preserve every earlier ledger
  identity, application row, table, trigger, view, catalog/reset-policy count,
  and delete guard, advance both schema-version authorities to `34`, verify
  integrity and foreign keys, and prove the exact columns, direction, partial
  predicates, and real Candidate query-plan use of
  `free_agent_draft_recoveries_league_player_status`,
  `ownership_events_candidate_release_by_player`, and
  `draft_eligible_players_rights_release_reentry` without a temporary ordered-
  release sort;
* additive migration `0035_add_candidate_card_help_command_results.sql` is
  pinned at `10,981` bytes and SHA-256
  `cbbaf5322c111f3d13659cf6adc1a5046c8b49ba0ab84c3541d770a1dae3b669`;
  fresh and exact upgrade tests prove immutable T-139 created/already-active
  command-result evidence and exact status/response replay while every earlier
  migration identity and row remains unchanged;
* additive migration
  `0036_add_fad_eligibility_revalidation_occurrences.sql` is pinned at `22,871`
  bytes and SHA-256
  `1351e25758d7192ab804214f0abeb696a9b0a9b3509e81dcd276ac7570fbb1f6`;
  fresh `1 -> 36` and exact `35 -> 36` tests reproduce `129` application
  tables, `130` including the migration ledger, `129` repository-catalog
  entries, `47` require-empty tables, `82` signed-policy tables, and `69`
  delete guards with integrity and foreign keys clean; migration tests also
  prove immutable semantic before/after evidence, exact player/FAD/source-
  operation and pending-job uniqueness, the global `player_catalog_applied`
  batch seal, referenced-evidence tamper resistance, and the deadline status-
  transition barrier;
* additive migration `0037_allow_atomic_fad_deadline_allocations.sql` is pinned
  at `4,142` bytes and SHA-256
  `33b8e7c3479f9a3dc64011a29ced6421a5cc59eca62da8b8144cf82b1d0d80b3`;
  fresh and exact-upgrade tests preserve every prior ledger identity and row,
  permit only the deadline-owned pending allocation insert under the live
  claimed deadline occurrence while the root remains
  `cards_open`, and reject fabricated, stale, or mismatched witnesses;
* additive migration `0038_allow_pre_fad12_restricted_scheduling.sql` is pinned
  at `17,157` bytes and SHA-256
  `b4567d087b31ff70dfa2776f2a15e6d22e182600d3dd5e5446a169bb64bb5ac5`;
  fresh and exact-upgrade tests preserve exact Candidate ties as
  `restricted_scheduled` for the next complete rapid rollover, reject
  mismatched or past-due scheduling, leave ordinary-auction behavior
  unchanged, and reproduce schema `38` with `129` application tables, `130`
  including the ledger, `129` catalog entries, `47` require-empty tables,
  `82` signed-policy tables, and `69` delete guards;
* opening writes `free_agent_draft_started` only as League Activity and
  `fad_cards_opened` only as a notification, with a corresponding
  `notification.created/cards_opened` outbox publication; it is never an
  outbox event type;
* readiness with more than, exactly, and less than 48 elapsed hours remaining
  derives the normal or adaptive help window correctly, including help
  beginning at card opening when less than 48 hours remain;
* T-130 returns exactly one current authorized private Candidate Card with all
  22 canonical slots, safe player/editor projections, cap and completeness
  state, exact authorization evidence, private help/intervention evidence, and
  no public-card leakage; current manager assignment takes precedence for a
  dual-role viewer, exact active help is card-scoped, and unauthorized,
  former-manager, expired-help, cross-team, and cross-league reads are the same
  side-channel-safe `404` without writes;
* at the deadline before publication, T-130 remains readable as
  `deadline_processing`/`private_read_only` with every mutation capability
  denied; T-133 through T-138 return `FAD_DEADLINE_PASSED`, T-139 returns
  `FAD_HELP_WINDOW_CLOSED`, and every private Candidate path changes to
  `FAD_PHASE_CONFLICT` after publication;
* T-133 accepts only the exact query grammar, applies collapsed-whitespace,
  trimmed, lowercase matching bounded at 200 Unicode code points, orders by
  normalized player name then ID, and uses a versioned base64url cursor bound
  to the exact card, slot, normalized query, and limit; malformed, stale,
  overlong, cross-filter, cross-slot, and cross-card cursors fail before reads,
  while results reveal no competing nomination or offer information; release
  or declined-right evidence remains excluded unless a later confirmed same-
  league/player `rights_release_reentry` row references that exact event and
  was confirmed after it, and every later release blocks again; mismatched,
  unconfirmed, prior, and merely-unowned cases remain excluded;
* T-134 proves byte-for-byte and semantic no-write behavior, ignores supplied
  `If-Match` or `Idempotency-Key`, returns the exact projected card/slot and
  warnings, and never creates a receipt, revision, notification, audit, or
  outbox effect; add uses a deterministic non-persisted preview-only UUID,
  projected version is exactly one greater than the unchanged base version,
  every projected capability is denied with `PREVIEW_ONLY`, move returns its
  destination slot, remove returns null, and structural-conflict, over-cap,
  and candidate-warning diagnostics are exact, deduplicated, and
  deterministically ordered;
* T-135 through T-138 require exact card `If-Match` plus bounded control-free
  idempotency keys, return the complete authoritative private card, and cover
  candidate add/edit/move/remove plus compatible carryover movement; carryover
  identity, contract, and removal remain locked, cross-card entry references
  return the same `CANDIDATE_CARD_ENTRY_NOT_FOUND`, and stale writes expose only
  `{currentVersion, refetch: true}`;
* every Candidate command revalidates current exact-card authority before
  replay lookup, then checks exact replay before phase, deadline, freeze,
  version, resource, or business validation; original status and immutable
  representation survive later state changes, changed intent conflicts, and a
  former manager or expired help authority cannot replay private results;
* T-139 accepts `{}`, explicit null, and trimmed control-free messages through
  500 Unicode code points, normalizes whitespace-only text to null, rejects
  malformed or unknown shapes, and atomically creates the help request, exact
  scoped grant, immutable command result, private audit, deduplicated current-
  commissioner notifications, and private outbox audiences; a new key against
  an existing active request returns `200` without changing the message or
  duplicating effects, while exact replay preserves its original status;
* every FAD JSON route enforces the exact `16 KiB` boundary, with one byte over
  returning `413 FREE_AGENT_DRAFT_REQUEST_TOO_LARGE` before domain work; shared
  limiter tests prove both per-session and per-league ceilings, isolation,
  deterministic window reset, and no-write `429` behavior for
  `fad_candidate_write` (`120`/session and `600`/league per 15 elapsed
  minutes), `fad_help_write` (`5`/session and `25`/league per 60 elapsed
  minutes), and `fad_operational_write` (`30`/session and `120`/league per 15
  elapsed minutes);
* every authoritative summer ownership, contract, prospect-right, effective-
  position, or active-state writer synchronizes affected open cards in the
  same transaction or rolls the underlying write back; provider bulk changes
  create durable per-player/per-open-FAD/source-operation occurrences only for
  active-status or effective-F/D changes, while presentation, raw-payload, and
  source-version-only changes or source changes masked by a league override
  create none; the same import transaction creates the exact pending shared-
  lease jobs and seals them with one global `player_catalog_applied` event;
* eligibility revalidation worker tests prove restart and duplicate-delivery
  safety, exact occurrence/job/lease binding, one-transaction card
  synchronization and job terminalization, no-op success, rollback, and stale-
  lease fencing; deadline reconciliation performs one final all-card sync,
  leaves terminal jobs unchanged, compare-and-swap consumes every observed
  `pending`, `failed`, `leased`, or `running` job as `skipped` with
  `deadline_reconciled`, rolls back atomically on any failure or lost CAS, and
  permits locking only after every occurrence job is `succeeded` or `skipped`;
* deadline processing evaluates the complete Candidate Card: an unresolved
  carried-roster structural conflict or an over-cap projection excludes every
  new offer while preserving every carryover and publishing the deterministic
  reason, whereas individually valid offers on a conflict-free incomplete,
  cap-compliant card still participate; conflict-only, over-cap-only, both-
  illegalities, and conflict-free incomplete fixtures prove reason precedence
  and independent cap status; a candidate-only unplaced conflict remains an
  individual invalid offer and does not invoke the carried-roster whole-card
  exclusion;
* immediately after publication, T-132 leaves a pending candidate-slot outcome
  null and T-140 returns every pending allocation without a provisional
  decision, rank, winner, restricted/fallback state, recovery, resolution time,
  or draw; every immutable offer uses exact `outcomeCode = pending`, and replay
  remains byte-stable as long as no durable allocation event is committed;
* processed T-140 results derive every rank/outcome from immutable allocation
  events, allow a null `winner.snapshotEntryId` only for a league-wide fallback
  winner, and restrict draw `auctionType` to the shared `fad_restricted` and
  `fad_open_rapid` context values;
* restricted Candidate contracts are equal-status minimums, not bids or
  leaders; every tied team begins with no edit count or cooldown, submits its
  strict improvement as an opening bid, then receives the ordinary
  joining-team one-edit allowance and 75-minute bid-activity cooldown, with no
  manager withdrawal;
* a restricted winner requires at least one eligible current active strict
  improvement under total-first/AAV-second floor comparison; absent, invalid,
  or commissioner-removed improvements produce no draw and atomically create a
  fresh league-wide 24-hour fallback with no leader;
* open FAD auctions inherit ordinary starter/non-starter edit limits; a
  restricted participant begins with no bid/cooldown, then its opening
  improvement receives the ordinary joining-team edit allowance; both use the
  75-minute bid-activity cooldown while ordinary weekly behavior remains
  unchanged;
* after normal ranking, an exact top tie in an open or restricted FAD auction
  uses one auditable equal-chance draw with commitment, reveal, fixed-vector,
  unbiased-sampling, and replay proof; ordinary weekly ties keep their
  submission-time and stable-ID rules;
* every semantic terminal FAD auction reveals and verifies its original
  commitment, with `selectionUsed = false` and no selected bid for no-bid,
  no-improvement, and non-tied outcomes;
* before the 60-minute boundary a valid nomination opens normally; exactly at
  and after it, the same valid command creates a private queued nomination
  whose binding starter bid opens at rollover and resolves at the following
  contiguous 24-hour rollover;
* queued nomination privacy covers responses, errors, logs, notifications,
  outbox audiences, Socket.IO, DOM, storage, and cache until opening;
* an open rapid auction with no eligible bid closes without a winner and
  returns the player to the unclaimed pool;
* FAD bids reserve no cap, slot, or roster capacity; bid, edit, and queued-
  nomination submission is the binding possible-illegality confirmation, and
  resolution never pauses for a second prompt even when one team wins every
  simultaneous auction and becomes illegal;
* late Entry Draft completion advances Week 1 by one or multiple whole
  league-local Mondays to the earliest otherwise-valid start whose Candidate
  deadline is strictly future-facing and whose complete seven-day FAD period
  fits, while the NHL-season end and all four playoff weeks remain fixed;
* that late-draft adjustment atomically regenerates remaining pairings, byes,
  and unexecuted job occurrences; no valid pre-playoff Monday produces explicit
  blocked recovery and no partial schedule or card opening;
* FAD completion waits for every active, pending, queued, fallback, delayed,
  and recovery path; a proposed completion at or after Week 1 atomically moves
  Week 1 to the first valid league-local Monday strictly after completion,
  regenerates remaining schedule/jobs, and only then publishes completion;
* after initial generation, T-096 replacement, or FAD pre-open/completion
  recovery, T-145 binds exactly the one current schedule generation and its
  source-specific immutable provenance; superseded succeeded roots remain
  historical, a valid old-superseded/new-current lineage finalizes normally,
  and missing, multiple-current, cross-scope, noncontiguous, or malformed
  provenance fails without writes;
* FAD-overrun recovery never rewrites Candidate deadlines, completed rollover
  instants, locked cards, bids, draws, allocations, or other historical FAD
  evidence, and restart, retry, and matchup-start races have one committed
  winner with no split state;
* when an illegal team becomes legal late, authoritative NHL schedule/source
  data identifies every selected player whose game is already underway; the
  snapshot, baseline, and immutable player/game/start/source exclusion evidence
  commit atomically, the entire game is excluded including post-baseline
  events, and replay or racing restoration attempts converge on that one
  evidence set; and
* incomplete or illegal rosters alone never move Week 1, while unfinished FAD
  processing does.

The fixed-clock matrix includes exact boundaries, one- and multi-Monday
movement, daylight-saving transitions, restart before and after each commit,
failure injection at every atomic seam, two-league isolation, and stable
idempotent replay.

### FAD-08 Local Closure Evidence - 2026-08-08

The final FAD-08 behavior selection passes `336/336` with no failure,
cancellation, or skip. It covers the handoff and real trigger callers,
readiness worker/runtime and carryover opening, T-126/T-127/T-129 privacy and
zero-write GET proofs, and T-128 original-receipt replay after both later
blocking and terminal success with unchanged database bytes and SQLite change
count. The independent migration/schema/identity/catalog/reset selection
passes `64/64`. Every database was disposable and local; shared staging and
production were not opened or changed.

### FAD-09 Local Closure Evidence - 2026-08-08

The provider occurrence/job/deadline selection passes `60/60`, the complete
summer-writer selection passes `262/262`, direct Candidate HTTP passes `36/36`,
composed runtime passes `66/66`, the local staging verifier passes `9/9`, and
reset bootstrap passes `8/8`, with no failure, cancellation, or skip. This
covers T-130 and T-133 through T-139, exact body/rate boundaries, every known
summer writer, provider semantic occurrence production, shared leased
execution, final deadline reconciliation, schema 36, target inventory `110`,
and reset/deployment-runtime compatibility. All databases and verifier targets
were disposable and local; no frontend caller is connected, shared staging was
not deployed or verified, and production was not opened or changed.

### FAD-10 Local Closure Evidence - 2026-08-09

The exact FAD-10 closure matrix passes `200/200` tests across `23` suites. It
covers injected-clock reminder/deadline boundaries, authoritative final
reconciliation, atomic 22-slot league publication, whole-card disposition,
T-131/T-132/T-140 read contracts and pending-result semantics, independent
player allocation and race quarantine, lifecycle coordination, aggregate
automatic results, schema 38, and restart/replay behavior.

The following remain separate acceptance records and must not be restated as
one combined total:

- composed target-runtime gate: `4/4`;
- allocation coordinator gate: `18/18`;
- shared auction regression gate: `103/103`; and
- post-amendment deadline-reminder gate: `7/7`.

The runtime proof executes allocation coordinator -> per-player allocation ->
allocation coordinator in the same scheduler cycle before ordinary auction
resolution, including the zero-allocation direct-to-`rapid` path. The target
endpoint inventory is `113`; only T-131, T-132, and T-140 advance under this
slice. Exact Candidate ties remain scheduled or quarantined for the future
restricted-auction privacy and activation gate. At that checkpoint, FAD-linked
T-080 through T-083 remained fail-closed for FAD-11 and T-141 through T-144
remained planned. There was no frontend caller, shared staging deployment or
verification, or production change.

### FAD-11 Local Closure Evidence - 2026-08-10

The FAD-11 closure covers T-141 through T-144, FAD-linked T-080 through T-083
administration, atomic FAD completion, schema 40, and the shared transaction-
owned restricted no-improvement fallback. The local target endpoint inventory
remains `117`.

The following remain separate acceptance records and must not be restated as
one combined total:

- broader recovery/correction/administration matrix: `197/197`;
- schema/runtime matrix: `96/96`;
- ordinary-auction compatibility matrix: `62/62`; and
- complete administration repository: `40/40`.

All recorded commands used exact Node.js `24.14.1`. At that checkpoint, the
scheduled resolver still filtered to ordinary auctions and future restricted/
fallback activation was not composed; those were FAD-12/FAD-13 gates. No
frontend, shared staging, or production environment was opened, migrated, or
changed.

### FAD-12 Local Closure Evidence - 2026-08-10

FAD-12 closes the local restricted and allocation-linked fallback manager-bid,
resolution, durable retry/recovery, activation, and scheduler paths through
schema `43`. At that checkpoint, direct and queued open-rapid resolution,
extension scheduling, and completion recovery remained FAD-13 work.

The following remain separate acceptance records and must not be restated as
one combined total:

- resolver policy, persistence, and shared-fallback gate: `52/52`;
- application service and durable runner gate: `15/15`;
- activation and job-repository gate: `71/71`;
- bid, HTTP-boundary, and auction-read capability gate: `50/50` across six
  suites;
- ordinary-auction and administration compatibility gate: `170/170`;
- schema-43 and current-head gate: `303/303`; and
- final scheduler, target-runtime, deployment, and ordinary-compatibility gate:
  `94/94`, partitioned as scheduler `6`, composed T-083 runtime `1`, FAD
  ordinary compatibility `3`, ordinary resolver and job `17`, target runtime
  `36`, and target deployment `31`.

All recorded commands used exact Node.js `24.14.1`. At that checkpoint, the
scheduler proof awaited FAD resolution -> restricted activation -> fallback
activation -> ordinary resolution -> FAD completion in exact causal order. No
frontend, shared staging, or production environment was opened, migrated,
deployed, or changed.

### FAD-13 Local Closure Evidence - 2026-08-10

FAD-13 closes local immediate and private queued starts, restart-safe queued
activation, direct/queued rapid resolution, allocation-null and no-bid
outcomes, seven initial plus contiguous extension rollover finalization and
recovery, atomic completion and whole-Monday Week 1 recovery, matchup-start
fencing, and the ordinary weekly-auction handoff. Schema `47` retains `131`
application tables, `132` including the migration ledger, and `131` repository-
catalog entries. At this historical FAD-13 checkpoint, migrations `0023`
through `0047` remained local only; the target endpoint inventory was `117`.

The following exact Node.js `24.14.1` records are separate and overlapping and
must not be added into one aggregate total:

- start-decision policy: `11/11`;
- immediate-start writer: `10/10`;
- FAD start/lifecycle: `23/23`;
- ordinary creation compatibility: `12/12`;
- queued activation: `125/125`;
- focused allocation-null resolution writer: `22/22`;
- focused resolution service/runner: `18/18`;
- broader allocation-null resolution: `73/73`;
- bid/read compatibility: `122/122`;
- schema-47/current-head: `280/280`;
- rollover policy/writer/service/runner: `42/42`;
- completion: `31/31`;
- runtime composition: `77/77`; and
- matchup-start guard: `15/15`.

The canonical writer-to-shared-JobRepository list, claim, and exact-expiry
reclaim integration additionally passes `1/1`; the complete rollover writer
passes `13/13`; and the shared JobRepository passes `28/28`. These are
supporting overlapping repository gates, not a combined total. No frontend,
shared staging, or production environment was opened, migrated, deployed, or
changed.

### FAD-14 Local Closure Evidence - 2026-08-11

The Activity and notification registries, four exact Candidate Card opening
publications, canonical envelopes whose `related` object contains exactly
`fadId`, `teamId`, `cardId`, `allocationId`, `auctionId`, `recoveryId`,
`nominationQueueId`, and `scheduleRecoveryOperationId`, automatic-readiness and
queued-nomination audience privacy, publication invalidation, reconnect
reauthorization, and setup-exemption eleventh-Activity/thirteenth-notification
three-publication contract are verified locally. The target endpoint inventory
remains exactly `117`.

Trigger-only migration
`0048_require_canonical_fad_realtime_evidence.sql` is pinned at `73,524` bytes,
`1,490` lines, and SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`;
schema `48` is the preserved intermediate realtime checkpoint. Trigger-only
migration `0049_require_canonical_fad_setup_exemption_publications.sql` is
pinned at `29,571` bytes, `748` lines, and SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`.
Schema `49` is current with `131` application tables, `132` including the
migration ledger, and `131` repository-catalog entries.

Separate pinned Node.js `24.14.1` evidence passes:

- focused FAD-14 core: `1,294/1,294` tests across `142` suites and `110`
  unique test files, with no failure, cancellation, skip, or todo;
- production JavaScript syntax: `95/95` files;
- schema-49 pin/runtime/reset/release/staging-verifier selection: `265/265`;
- former-failure consolidation: `189/189`; and
- authoritative full backend: `3,266` tests across `436` suites, `3,264`
  passed, zero failed, cancelled, or todo, and two intentional Windows link-
  capability skips, in about `30m03.603s`.

The skipped cases are `symlink` (`symlink creation is unavailable`) and
`target` (`file links are unavailable`) in
`sportsDataIoLiveCapabilityArtifactFoundation.test.js`. Migrations `0023`
through `0049` remain local only. No FAD frontend, shared staging, or production
environment was opened, migrated, deployed, or changed.

### FAD-15 and FAD-16 Frontend Local Closure Evidence - 2026-08-11

Exact Node.js `24.14.1` verification records:

- complete Vitest: `316/316` across `52` test files;
- repository-wide ESLint: pass;
- production build: pass across `1,782` transformed modules, with only the
  existing advisory for one minified chunk above `500 kB`;
- dependency inspection: pass, with Playwright `1.61.1` and one deduplicated
  `playwright-core` `1.61.1`; and
- browser-authority verification: pass across `19` compatibility files and
  `154` shipped source files.

The V8 report for `src/features/freeAgentDraft/` records `1,754/2,012`
statements (`87.17%`) and `1,262/1,577` branches (`80.02%`). This coverage is
supporting evidence, not a substitute for the behavior and privacy gates.

### FAD-17 Integrated Local Closure Evidence - 2026-08-11

Exact Node.js `24.14.1` backend records are separate evidence gates and are not
summed into one total:

- schema-22-to-49, fresh-schema-49, repository-catalog, reset/cutover, and real
  two-league fixture: `28/28`, zero failed, cancelled, or skipped;
- affected resolution service, real SQLite writer, and durable job: `49/49`,
  zero failed, cancelled, or skipped; and
- representative amendment policy, writer, late-lock, and ordinary-auction
  compatibility: `202/202`, zero failed, cancelled, or skipped.

The acceptance package explicitly proves no-bid later renomination under a
distinct auction ID; zero pre-resolution reservation plus simultaneous binding
aggregate wins; disabled/nonblocking Season 2 video with no endpoint or service
inventory; exact schema `22 -> 49` agreement with fresh schema and catalog; and
two leagues with distinct Week 1 starts and adaptive-help chronology. GET and
preview no-write, two-league authorization/privacy, restart, lease, recovery,
queue, rollover, schedule, late-lock, and ordinary-auction compatibility also
pass.

The real disposable two-league Playwright release matrix passes `40/40` with
zero retries across desktop Chromium, mobile Chromium, desktop Firefox,
desktop WebKit, and mobile WebKit. T-076 through T-083 and T-126 through T-144
are therefore `LOCAL VERIFIED`. No shared-staging or production environment was
opened, migrated, deployed, or changed.

### FAD-18 Local Preflight Evidence - 2026-08-11

The focused and adjacent preflight package discovered `158` tests: `156`
passed, zero failed, and two intentional Windows link-capability cases skipped.
Source check, production syntax, JSON parsing, and whitespace checks pass. The
preflight verifies the contiguous base-22-to-target-49 source, `49` migrations
and `27` post-base migrations, checksum-set SHA-256
`6df4e827296ef3e63a143fb932f557b410511813ea421177afb7908fda15d636`,
`131` repository-catalog entries, `49` post-reset require-empty tables, valid
reset-policy coverage, and the quiesced provider-probe blueprint.

The FAD-18 provider-tool addendum is also green. The read-only discovery opens
only an identity- and SHA-verified private OS-temporary copy of a sidecar-free
guarded source, removes it before output, and fails without output on source
drift or cleanup failure. Its WAL-mode regression preserves source bytes,
identity metadata, and persistent-root entries. The discovery
foundation passes `14/14`, the independent artifact verifier passes its focused
`6/6`, and their focused combined gate passes `20/20`. The complete six-file
provider-capability family discovers `106` tests: `104` passed, zero failed,
cancelled, or todo, and two intentional Windows link-capability skips. These
are separate recorded gates and are not combined into one invented total.
The hold/discovery/publisher/verifier transition package passes `35/35`, and
the broader nine-file entrypoint, Render, preflight, target-runtime, hold, and
provider matrix passes `125/125`, both with zero fail, cancel, skip, or todo.

This is local preflight evidence only. The real Git-tracked provider manifest,
paid live key and signing configuration, isolated database/disk and operator
access, paid-source observation, offsite backup and clean restore, approved
fresh-path reset/import and schema-49 migration report, clean release commits,
auxiliary-bridge and final-held deploys, attached-service shell reachability,
database-path activation, and deploy/rollback identities remain required before
the externally mutating staging gate. The tools remove none of those external
blockers.
Production remains unauthorized.

---

# Part 8 - Frontend Test Layers

## Pure Frontend Utilities

Unit tests cover non-authoritative presentation helpers:

* money and fantasy-point formatting;
* timestamp display;
* API error translation;
* query-key factories;
* route construction;
* safe storage parsing;
* client-side form formatting and basic validation.

They must not recreate backend league calculations.

---

## Component Tests

React Testing Library tests components through:

* accessible roles;
* labels;
* visible names;
* user-event interactions;
* loading, empty, error, conflict, and success states.

`data-testid` is used only when no stable accessible query represents the user interaction.

Tests run with React Strict Mode to catch unsafe effect lifecycles.

---

## Feature Page Tests

Each feature page tests:

* route parameters;
* session state;
* league context;
* authorized and unauthorized presentation;
* request loading and cancellation;
* empty data;
* backend validation;
* stale conflict and refetch;
* duplicate-submit prevention;
* Socket.IO invalidation followed by refetch;
* responsive critical controls.

Hiding a button is not tested as proof of backend authorization.

---

## Query and Mutation Tests

Tests verify:

* query keys include league ID and other required scope;
* logout clears private query data;
* changing league does not display the prior league's cached records;
* mutations do not retry automatically;
* one user intent retains one idempotency key across an uncertain retry;
* a new intent receives a new key;
* `412` causes safe refetch and conflict presentation;
* `401` clears authenticated presentation state;
* Socket events invalidate only relevant keys.

---

# Part 9 - Browser Workflows

## Local End-to-End Environment

Playwright local tests start:

* a backend using a new temporary SQLite database;
* explicit `DEVELOPMENT_TEST` mode;
* synthetic accounts and two leagues;
* jobs disabled unless the test owns a fixed test clock;
* a frontend using explicit local API and Socket origins.

Seeding occurs through a test-only command-line setup script, not a production HTTP endpoint.

The environment is destroyed after the suite.

---

## Launch-Critical Browser Coverage

Before launch, browser tests cover:

* public roster view;
* self-sign-up and verification using a fake email adapter;
* sign-in, sign-out, and session replacement;
* password change and reset;
* deactivation and reactivation;
* league chooser;
* administrative league creation;
* membership, commissioner, and manager assignment;
* roster view and movement;
* contract and cap display;
* explicit commissioner- or administrator-selected Week 1 with no fixed-date
  substitution, scheduled Entry Draft-start rollover, automatic all-or-none
  FAD readiness, Candidate Card carryover/editing/privacy/adaptive help,
  whole-card deadline legality, total-first/AAV-second allocation,
  improvement-required restricted and fallback auctions, FAD-only exact-tie
  draw, final-hour nomination queue, daily and extension rollovers, and atomic
  whole-Monday Week 1 recovery;
* auction creation, bid, edit, and resolution result;
* trade proposal, concurrent offer, acceptance, decline, and cancellation;
* buyout;
* matchup lock, late legality with whole-game exclusion and immutable evidence,
  live display, final result, and correction;
* standings;
* activity and Security Audit separation;
* commissioner freeze and recovery;
* unauthorized and cross-league navigation.

Complex calculations are asserted at the backend layer and spot-checked in the browser.

---

## Browser Assertions

Prefer:

* role and label locators;
* backend-created stable fixture IDs hidden behind page objects;
* web-first assertions;
* explicit URL and visible-state checks.

Avoid:

* arbitrary sleep;
* brittle CSS selectors;
* shared page state;
* dependence on real NHL data;
* broad screenshots as the only assertion.

---

# Part 10 - Security Testing

Security tests follow `SECURITY.md` and include:

* password boundaries and scrypt encoding;
* dummy verification for unknown accounts;
* one active session;
* idle and absolute expiry;
* revocation triggers;
* cookie attributes;
* CSRF and Origin;
* exact CORS;
* action-token purpose, expiry, digest-only storage, and atomic consumption;
* rate limits by source and account;
* generic public responses;
* SQL injection strings as values;
* sort and identifier allowlists;
* output encoding;
* log and audit redaction;
* first-administrator bootstrap refusal after use;
* two-league object-level authorization;
* Socket.IO room authorization.

Dependency audit output informs review. It does not automatically justify an unsafe blind upgrade.

---

# Part 11 - Jobs, Realtime, and External Providers

## Scheduled Jobs

Every job tests:

* before eligibility;
* exact eligibility boundary;
* after eligibility;
* duplicate invocation;
* overlapping invocation;
* restart;
* lease expiry;
* stale occurrence;
* dependency failure;
* transaction failure;
* outbox failure;
* successful retry;
* no double advancement.

An accelerated season test runs job sequences through complete matchup weeks.

---

## Socket.IO

Tests prove:

* handshake authentication;
* allowed Origin;
* authorized room membership;
* no cross-league payload;
* no active sealed bid disclosure;
* one invalidation after commit;
* no invalidation after rollback;
* disconnect after session revocation;
* reconnect reauthorization;
* frontend listener cleanup;
* authoritative refetch after reconnect.

Socket delivery is not required for correctness when HTTP refetch succeeds.

---

## NHL Provider

Provider adapter tests use recorded synthetic responses for:

* successful list and detail;
* changed player name;
* position;
* inactive player;
* missing field;
* malformed response;
* timeout;
* rate limit;
* provider error;
* partial response;
* last-valid-cache preservation;
* live game-state and player-game-stat feeds sharing the expected provider
  capture identity;
* the adapter receiving the exact required stable-player/provider-player set
  plus sorted exact historical player/game/team/start bindings, with every
  game binding referencing its exact parent player identity;
* exact required-player coverage with the mutually exclusive `expected_game`,
  authoritative `no_due_game`, and authoritative `no_team` shapes;
* affirmative current membership from Players and FreeAgents remaining
  separate from per-game provider team identity;
* one player's old-team and current-team expected games coexisting in one
  response, and a currently free-agent player retaining an old-team historical
  expected game;
* an omitted player, locally inferred terminal disposition, unexpected player,
  duplicate identity, mixed disposition, or unresolved mapping rejecting the
  entire refresh;
* a missing historical schedule game, wrong scheduled start, wrong bound team,
  or missing/wrong explicit historical PlayerGame row rejecting the refresh;
* exact equality between `expected_game` player/game identities and observation
  player/game identities, including explicit zero-valued rows rather than
  missing-as-zero behavior;
* every historical required binding being an exact-value subset of flat
  expected coverage while the whole flat expected set still equals
  observations;
* coverage and observations sharing one provider, capture identity, and
  `sourceVersion`;
* provider output naming exactly the configured live-statistics provider, and
  `sourceVersion` changing when requested historical bindings, membership,
  targeted schedules, or PlayerGame rows change;
* independently fixed coverage- and observation-digest vectors, exact child
  counts, atomic seal/rollback, and immutability after sealing;
* missing, stale, regressed, cross-provider, duplicate, and unsealed
  player-game evidence failing closed;
* late-lock game-state requirements being derived from sealed coverage for
  every selected player rather than from available observation rows;
* current-minus-baseline per-game delta excluding the entire underway game,
  including events received after the late baseline;
* a missing current observation for any excluded pair keeping scoring and
  finalization `awaiting_data` instead of creating a partial official result;
* the same player scoring normally in a later game that week; and
* totals-only last-season/discovery imports being rejected for live scoring.

Ordinary automated tests do not call the real provider.

The FAD-18 provider sequence is operationally fixed:

The package scripts map discovery to
`node scripts/discover-sportsdataio-live-capability.js`, retain the existing
provider check at `node scripts/check-sportsdataio-live-capability.js`, and map
independent verification to
`node scripts/verify-sportsdataio-live-capability-artifact.js`.

1. deploy the auxiliary bridge commit against the existing schema-22 path with
   persisted `STAGING_MAINTENANCE_HOLD=true`, and prove Render stopped the old
   disk-backed instance before the bridge started;
2. prove the bridge exposes only generic exact-path GET/HEAD health, returns
   maintenance `503` for every other request including `OPTIONS`, and imports
   or opens no target/database runtime, application routes, jobs, Socket.IO, or
   email; hold readiness means only that this maintenance listener is live, and
   attached-service shell reachability remains an operator/provider check;
3. with the isolated staging database quiesced and live mode `probe`, run
   `npm run data:discover:sportsdataio-live:staging -- --historical-date YYYY-MM-DD`
   using the dedicated paid live key; the command requires exactly
   that argument pair, must inherit the persisted deployed hold value without
   an inline override, requires and rechecks a sidecar-free guarded source,
   copies it to a private OS-temporary snapshot, and opens only the identity-
   and SHA-verified copy read-only with `fileMustExist` and `query_only`; close
   and cleanup must finish before output, and any source drift or cleanup failure
   produces no output;
4. review the sanitized discovery output and commit its exact manifest at
   `config/provider-capability/sportsdataio-live-probe-v1.json`;
5. run `npm run release:candidate:preflight` for the exact final candidate and
   stop on any missing, untracked, invalid, season-mismatched, or build-omitted
   manifest or any checked-in hold default other than `false`;
6. deploy that exact final commit and build once with the persisted hold still
   `true` against the old path, re-prove the health-only surface, then create
   and verify the old schema-22 backup and run
   `npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <absolute-distinct-clean-restore-path>`
   against a previously absent inactive path; only after it passes, create the
   approved reset/import at a different, previously absent schema-49 path;
   complete the canonical closed-write artifact, first-administrator, reset-original-league,
   migration-report, and database-identity handoff in its approved order; the
   old file stays untouched and in-place `db:migrate` is excluded pending
   persistent-root hardening;
7. record both paths and identities plus activation and rollback evidence, then
   redeploy the same exact final build on only the new path with the persisted
   hold `false` in `probe` and run the zero-argument
   `npm run data:check:sportsdataio-live:staging` from its disk-backed service
   shell to publish the signed artifact;
8. while the service remains in `probe`, run the zero-argument
   package interface once from that shell as
   `SPORTSDATAIO_NHL_LIVE_MODE=required npm run data:verify:sportsdataio-live:staging`;
   this staging-only per-process invocation does not persist or change the
   deployed service mode; and
9. change only the deployed service mode from `probe` to `required`, restart or
   redeploy the same build, and require startup to independently re-verify the
   artifact before database open.

The bare `npm run data:verify:sportsdataio-live:staging` name describes its
zero-argument package interface only; it is not the executable transition step.
The exact operational invocation is the per-process command above. The
provider check and independent verifier are staging-only and require persisted
`STAGING_MAINTENANCE_HOLD=false`, production Node mode, closed league writes,
disabled scheduled jobs, FAD routes, account-email delivery, debug routes, and
backup schedule, and capture-only email before any provider, manifest, or
artifact I/O. The verifier is a one-off disk-backed shell command, not a Render
one-off job or deployed service-mode change. As part of FAD-18 isolated staging
acceptance, and before
FAD routes or jobs are enabled there, the read-only provider capability check
must use the configured staging live-source credentials and a recorded exact
required-player and historical-game request.
Without mutating shared league data, it
must prove that the source can authoritatively account for every requested
player, distinguish `expected_game`, `no_due_game`, and `no_team`, return an
explicit zero-valued row for an expected zero-stat pair, bind coverage and
observations to one `sourceVersion`, and surface incomplete responses as
unavailable. It must exercise Players and FreeAgents plus targeted historical
schedule and PlayerGame access, affirm exact game/start/team values, and prove
exhaustiveness by failing a controlled omitted required pair. Sanitized
evidence records the request/response identity sets and historical bindings,
dispositions, source version, capture time, and pass/fail result; it records no
credential or raw provider payload. An unavailable endpoint or credential,
unsupported provider semantic, incomplete historical access, or failed
capability check blocks staging acceptance rather than enabling a synthetic or
missing-as-zero fallback.

The command and artifact contract are accepted locally only when tests prove:

* fixed SHA-256, credential-binding HMAC, and artifact-HMAC vectors;
* exact closed shape/order, canonical Unicode handling, deep freeze, duplicate
  rejection, and malformed/open-shape rejection;
* tamper rejection for key, credential, origin, build, environment, current
  season, probe season, manifest, issue/expiry time, and payload;
* a historical-offseason success fixture with `expected_game`,
  `no_due_game`, `no_team`, and an explicit zero, plus an in-memory controlled
  omission that fails closed;
* provider HTTP, timeout, JSON, partial-response, game/start/team,
  source-version, and exact-set failures writing no artifact;
* absence of raw payloads and both secrets from files, serialization, stdout,
  stderr, and logs;
* atomic replacement, failed-write preservation, lock contention, symlink and
  path-escape rejection, corrupt-artifact rejection, and exact replay;
* `disabled` and `probe` composing no live adapter;
* `required` rejecting absent or invalid evidence before database open and
  composing exactly one live adapter for valid evidence;
* the legacy staging-import key being unable to enable live statistics;
* a staging artifact being unable to authorize production;
* the Render blueprint retaining manual two-stage deployment and a
  disk-contained artifact path;
* discovery accepting only the exact historical-date argument, exact staging
  production-Node `probe` identity, dedicated live key, persisted hold `true`,
  closed/disabled write, job, FAD, email, debug, and backup-schedule gates, and
  a read-only existing database, with every drift rejected before database,
  provider, or output work;
* the provider check requiring persisted hold `false` and the same normal-probe
  quiescence before manifest read, provider fetch, artifact write, or output;
* the independent verifier accepting zero arguments, performing only read-only
  artifact access, requiring persisted hold `false`, rejecting every
  non-staging or non-quiesced configuration before artifact read,
  requiring exact per-process required-mode verification configuration, and
  leaving artifact and database bytes unchanged; and
* the deployed service remaining in `probe` during that independent
  verification, then startup re-verifying before database open after the same
  build changes to deployed `required` mode.

The signed artifact is valid for exactly 24 elapsed hours and is bound to the
dedicated credential, configured current season, version-controlled probe
manifest, origin, environment, and exact backend build. The offseason manifest
uses the immediately previous completed NHL season for totals and an exact
historical zero-stat PlayerGame while current Players and FreeAgents prove the
two terminal dispositions. Ordinary automated tests use synthetic captured
fixtures and never make a real provider call.

## Late-Lock Coordinator and Evidence Acceptance

Late-lock implementation is not accepted until focused domain, repository,
service, job, HTTP, and composition tests prove all of the following:

* semantic replay reconstructs the committed business evidence and returns the
  existing result when only newly generated child UUIDs differ;
* changing any late-snapshot/evidence timestamp, statistics or game-state
  source lineage, selected-roster identity/order, sealed coverage selection, or
  exclusion changes replay to a conflict with no partial write;
* late-lock idempotency adds no request ID, idempotency-request column, or
  browser idempotency contract;
* one table-driven writer registry covers every current and future roster
  mutation: ordinary and Injured Reserve moves, buyouts/releases, ordinary and
  FAD auction wins, Candidate allocation and carryover movement, trade
  acceptance/reversal, commissioner changes, contract transitions, prospect
  operations, effective-position corrections, and every later equivalent
  writer;
* the same table-driven audit classifies a trade-block toggle as legality-neutral
  metadata, proves its SQL writes exactly `trade_blocked`, `updated_at_ms`, and
  `version`, and proves its unregistered mutation kind is rejected before any
  late-lock target read;
* player and prospect-right transfer fixtures prove that acceptance closes the
  source ownership tenure, creates a distinct destination ownership at version
  `1`, preserves stable player and contract IDs, and stores one immutable
  old-to-new ownership mapping; reversal and commissioner transfer use the same
  rule and never resurrect a deleted ownership ID;
* source and destination transfer groups contain globally unique deleted and
  present witnesses, both teams are evaluated, and exact command replay returns
  the same mapping without repeating ownership, contract, history, activity,
  notification, or outbox writes;
* one shared, never-rejecting post-commit coordinator receives an exact batch
  grouped by affected league, season, and team, with unique stable-ordered
  ownership witnesses and the last committed version for a deleted ownership;
* registry enforcement rejects an otherwise well-formed but unregistered
  mutation kind before target discovery;
* cap-only, contract-only, effective-position, and truly empty-roster fixtures
  prove that a durable committed result may identify an affected team with
  `ownershipWitnesses: []`, while unchanged or synthetic ownership witnesses
  are never invented and every supplied witness is still checked exactly;
* single-team, multiple-ownership, and multi-team fixtures prove that the whole
  batch is evaluated without duplicate team work and without more than one
  immediate refresh or evaluation retry;
* coordinator input-validation, target-read, repository, provider, and
  unexpected runtime failure injection proves the committed roster mutation
  occurs once, is never rerun, compensated, reversed, or rolled back, and
  remains a successful command with `awaiting_data`;
* original-command idempotent replay reconstructs the same committed batch and
  may retry late-lock evaluation without repeating any ownership, contract,
  activity, or outbox write;
* every successful roster-mutation response exposes only `lateLock.status` as
  `completed`, `awaiting_data`, `still_illegal`, or `not_applicable`, plus an
  optional safe `lockId`, with no evidence or provider-detail leakage;
* multi-team results aggregate in the exact priority `awaiting_data`,
  `still_illegal`, `completed`, `not_applicable`, and omit `lockId` unless
  exactly one safely identifiable completed lock applies;
* an immediate stale/unavailable command batch performs at most one live
  refresh and one evaluation retry in total;
* the scheduled statistics occurrence handler invokes eligible-lock retry only
  after successful refresh persistence, while provider or persistence failure
  invokes no retry and retry failure cannot fail or alter the successful
  statistics result;
* the scheduled retry attempts each eligible lock independently, performs no
  live refresh, never recursively invokes itself, and repeats no roster
  mutation;
* composition tests name the exact closed staging fixture reset and provider
  catalog import as the only maintenance exclusions, require closed writes,
  disabled jobs, and no live/correction matchup, and reject the exclusion or
  require bulk reconciliation when any precondition is false;
* a legal normal scheduled lock completes with no affirmative selected-player
  coverage or fresh game-state call, proving normal-lock behavior is unchanged;
* sealed coverage produces the exact distinct in-week due-game request for the
  selected roster, and the separate game-state read rejects missing or extra
  games, future observations, and observations older than `300000` milliseconds
  while accepting the exact boundary;
* compatible-provider statistics and game-state fixtures with deliberately
  different `sourceVersion` values succeed, while incompatible providers fail;
* use, semantic replay, scoring, and finalization independently recompute the
  coverage, player-game observation, game-state, and exclusion digests and
  exact child counts, with one tamper case for each root failing closed;
* exclusion creation requires exact baseline `expected_game` coverage and its
  linked baseline observation; and
* scoring and finalization remain `awaiting_data` for a terminal or missing
  current coverage pair, a missing current observation, an incompatible
  provider, or a source-update time regressed behind the baseline, and become
  eligible only with exact current `expected_game` coverage, exact observation,
  and non-regressed lineage.

Historical-coverage acceptance additionally requires:

* fixed vectors for the amended requirement schema-version-1 preimage with
  canonical sorted `requiredPlayers[]` and `requiredPlayerGames[]`;
* exact retained coverage across both weeks of the two-week Final and across a
  delayed `awaiting_data` overrun beyond the adapter's rolling date window;
* a `final` week removing its bindings, followed by
  `correction_required` re-entry restoring the same bindings;
* a traded-away or released snapshot player retaining the original historical
  game/team binding after ownership or current provider-team change;
* the same player having required old-team and due current-team games in one
  refresh, and a currently free-agent player having a required old-team game;
* adapter date requests equal to the deduplicated union of rolling dates and
  provider-Eastern historical dates, never a full-season poll;
* missing or wrong historical team, scheduled start, schedule row, or explicit
  PlayerGame row failing the whole refresh;
* exact configured-provider equality, required-game subset equality, and total
  flat-expected/observation equality; and
* compare-and-swap rejection when a roster, identity mapping, exclusion,
  sealed baseline binding, or matchup-week status mutates between requirement
  read and completion, while preserving the previous authoritative refresh.

---

# Part 12 - Migration and Recovery

Migration tests cover:

* empty schema;
* every ordered migration;
* changed-checksum refusal;
* application behind and ahead;
* copied current JSON;
* reset-manifest inclusion and omission;
* stable deterministic IDs;
* ambiguous mapping rejection;
* repeat-import determinism;
* counts, money, ownership, schedules, and semantic hashes;
* `integrity_check`;
* `foreign_key_check`;
* cutover rehearsal;
* rollback before first SQLite write;
* recovery after first SQLite write.

Backup testing creates an application-consistent backup, restores to a clean path, starts the application, and runs representative reads and writes.

A successful backup command without a successful restore test is incomplete evidence.

---

# Part 13 - Manual QA

## Written Checklist

Manual testing uses the approved `MANUAL_QA_CHECKLIST.md`.

It records:

* build and environment;
* tester;
* browser and device;
* account and league fixture;
* exact workflow;
* expected result;
* actual result;
* screenshots or request IDs when useful;
* issue reference.

Unstructured clicking is exploratory evidence, not release acceptance.

---

## Manual Focus

Manual QA focuses on:

* understandable wording;
* responsive layout;
* keyboard access;
* focus behavior;
* confirmations;
* disabled and loading states;
* delayed provider data;
* reconnect;
* conflicts;
* commissioner recovery;
* mobile usability;
* interaction between features.

---

# Part 14 - Continuous Integration and Gates

## Pull-Request Gate

Once CI is established, affected repositories run:

```text
lint
syntax or build
unit tests
characterization tests when compatibility code changes
repository and service tests when backend behavior changes
frontend component tests when frontend behavior changes
focused Chromium browser tests for critical integrated changes
documentation structure checks
```

Frontend and backend report independently.

---

## Milestone Gate

A work-plan step cannot complete unless:

* required focused tests pass;
* the broader affected suite passes;
* data hash or database proof passes;
* no unexplained skipped test exists;
* exact commands and results are recorded;
* untested risk is reported;
* rollback is still valid.

---

## Staging Gate

Staging acceptance adds:

* real deployed CORS, cookies, CSRF, and Socket.IO;
* separate environment validation;
* two-league workflows;
* email adapter;
* scheduled jobs;
* provider failure;
* backup and restore;
* migration rehearsal;
* desktop and mobile manual QA.

---

## Release Gate

Release requires:

* complete automated launch-critical suites;
* release browser matrix;
* no unexplained flaky test;
* no critical or high-severity open security defect;
* verified restore;
* migration reconciliation;
* written manual QA;
* production smoke and rollback commands prepared;
* explicit production authority.

---

## Production Smoke

Automated production smoke is read-only:

* frontend asset load;
* minimal liveness;
* public roster read;
* approved public metadata;
* no internal path or secret disclosure.

Production smoke does not:

* create test users;
* place bids;
* submit trades;
* reset data;
* run jobs;
* restore backups;
* write fake activity.

An authorized human may perform a real expected account action after launch and records the result separately.

---

# Part 15 - Coverage and Quality

## Coverage Policy

Coverage is diagnostic and ratcheted upward.

Initial refactor steps do not fail solely because old untested code lowers a global number.

New or materially changed:

* pure domain modules target at least `90%` branch coverage;
* security, authorization, transaction, migration, and job modules require every approved scenario even if line coverage is already high;
* frontend feature logic targets at least `80%` branch coverage where practical.

After the baseline is measured, coverage may not decline without an explained exception.

Generated files, configuration-only files, and unreachable defensive branches may be excluded only explicitly.

---

## Mutation and Property Testing

No mutation-test or property-test dependency is selected initially.

Boundary-rich calculations use table-driven tests.

If defects show example tests are insufficient, the Testing Strategy may add focused property or mutation testing through a separate reviewed tooling decision.

---

## Flaky Tests

A test is flaky when identical code and controlled inputs produce inconsistent results.

Policy:

1. preserve trace and evidence;
2. identify uncontrolled dependency;
3. fix or temporarily quarantine with an issue, owner, and expiry;
4. do not silently add sleeps or unlimited retries;
5. keep release blocked when the flaky test covers a launch-critical path.

One CI retry diagnoses flakiness; it does not erase it.

---

# Part 16 - Test Evidence

Every completed work-plan step reports:

```text
repository
branch
commit or working-tree identity
environment
commands
passed count
failed count
skipped count
duration
fixture or database identity
pre/post data proof
artifacts
tests not run
remaining risk
```

Never state that a suite passed without running it.

Screenshots, traces, coverage, and migration reports are artifacts. The authoritative result is the recorded command outcome plus reviewed behavior.

---

# Part 17 - Implementation Sequence

Testing capability is introduced in this order:

1. Approve `TESTING_STRATEGY.md` as the cross-project authority.
2. Maintain the completed backend `BR-00` characterization and safety harness.
3. Add configuration and bootstrap tests in `BR-01`, then add domain, repository, service, contract, job, and security suites as their modules are extracted.
4. Add the frontend Vitest and Testing Library foundation before frontend structural migration.
5. Add Query Client, HTTP client, session, league-context, and feature component tests with each frontend slice.
6. Add Playwright local environment and Chromium critical-path tests.
7. Add temporary SQLite factories, migration, and recovery suites.
8. Establish CI gates.
9. Establish isolated staging and deployed security tests.
10. Complete the release browser matrix and written manual QA.
11. Run production read-only smoke after authorized deployment.

Tooling is added through focused work plans. No dependency is installed by writing this strategy.

---

# Part 18 - Completion Criteria

The testing foundation is complete for launch when:

* backend and frontend test commands are real and passing;
* current compatibility behavior is characterized where still needed;
* approved target behavior has independent tests;
* pure league calculations have boundary coverage;
* SQLite repositories and transactions use real temporary databases;
* two-league isolation is tested across all private feature families;
* account and security suites pass;
* jobs pass restart, overlap, and duplicate tests;
* Socket.IO passes authentication and room-isolation tests;
* migration is deterministic and reconciled;
* backup restore is demonstrated;
* critical browser workflows pass on the release matrix;
* written manual QA is complete;
* production smoke is read-only;
* no unexplained flaky or skipped launch-critical test remains.

---

# Verification

```powershell
Get-Content docs/07-testing/TESTING_STRATEGY.md
Select-String -Path docs/07-testing/TESTING_STRATEGY.md -Pattern '^`APPROVED`$','BR-00','BR-01','Two-League Fixture','Production Smoke'
```

Expected:

* document status is `APPROVED`;
* backend `BR-00` is the completed characterization baseline and `BR-01` is the next refactor step;
* frontend and browser tools are selected;
* production automated smoke is read-only;
* no test may use production storage as disposable data.
