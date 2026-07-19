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
* end-of-season contract expiry.

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
* auction creation, bid, edit, and resolution result;
* trade proposal, concurrent offer, acceptance, decline, and cancellation;
* buyout;
* matchup lock, late legality, live display, final result, and correction;
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
* last-valid-cache preservation.

Ordinary automated tests do not call the real provider.

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
