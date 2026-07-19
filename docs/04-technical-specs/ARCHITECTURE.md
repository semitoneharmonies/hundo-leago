# Hundo Leago - Architecture

## Document Status

`APPROVED`

This technical specification consolidates:

* approved frontend, backend, persistence, permission, league-isolation, staging, and recovery boundaries;
* the current React/Vite frontend and Node/Express backend structure;
* the approved transition from file-backed league JSON to SQLite;
* the approved Season 2 target architecture;
* technical decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the technical architecture decisions and approved adoption of the resulting design on 2026-07-18.

---

## Technical Purpose

Hundo Leago needs a maintainable architecture that can operate multiple isolated leagues for a complete fantasy season without data loss, hidden writes, browser-authoritative calculations, or recurring production repair.

This specification defines:

* application and repository boundaries;
* frontend and backend responsibilities;
* backend module boundaries;
* authoritative persistence and transaction flow;
* REST and Socket.IO roles;
* scheduled-job execution;
* external NHL-data integration;
* environments, hosting, observability, recovery, and testing;
* the safe path from the current implementation to the target architecture.

---

## Out of Scope

This document does not define:

* exact database tables or columns;
* exact API paths, request bodies, or response bodies;
* exact password hashing, cookie, request-forgery, or rate-limit configuration;
* exact SQLite migration commands;
* exact frontend folders and component names;
* individual deployment steps;
* product rules already defined by approved rule and product specifications;
* implementation sequencing for the approved Entry Draft.

Those details belong in Data Model, API Contracts, Security, Backend Refactor, SQLite Migration, Frontend Structure, Deployment, Environment Setup, and feature-specific work plans.

---

# Part 1 - Authority and Current State

## Source Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/
```

Approved product behaviour remains authoritative. Architecture must implement that behaviour without creating a second rule set.

---

## Current Operating Mode

The current operating mode is:

```text
OFFSEASON_RESET
```

Major coordinated changes are permitted only with documentation, backups, isolated testing, verification, and explicit protection of records not approved for reset.

This architecture document does not authorize a migration, reset, deployment, or production write.

---

## Current Frontend

The current frontend uses:

* React;
* Vite;
* JavaScript;
* React Router;
* Socket.IO client;
* Netlify deployment.

Important current limitations include:

* much of the application state and behaviour remains concentrated in `src/App.jsx`;
* some league calculations and transaction helpers still run in the browser;
* the browser can submit the complete league object;
* temporary frontend-only login data is not secure authentication;
* local storage contains convenience state that must not become authorization;
* API URL handling is repeated across some pages;
* league context was designed around one original league.

---

## Current Backend

The current backend uses:

* Node.js;
* Express;
* CommonJS modules;
* Socket.IO;
* file-backed JSON;
* one large `server.js`;
* an extracted `leagueStore.js`;
* partially extracted read-only routes;
* in-process scheduled polling jobs;
* Render persistent-disk storage.

Important current limitations include:

* mutable state is centered on one league JSON object;
* most routes, services, jobs, and calculations remain coupled to `server.js`;
* secure sessions and complete backend authorization are not implemented;
* multi-league isolation is not implemented;
* scheduled jobs rely on in-memory timers and state checks;
* current debug and recovery endpoints need explicit permission and environment boundaries;
* JSON persistence cannot provide the target relational constraints and transactions.

---

# Part 2 - Target System Context

## Target Topology

```text
Manager / Commissioner / Administrator Browser
                     |
                     | HTTPS
                     v
          React + Vite frontend on Netlify
                     |
                     | REST requests
                     | Socket.IO connection
                     v
       Node.js + Express modular backend on Render
              |              |              |
              |              |              +--> NHL data provider
              |              |
              |              +--> verified backups / snapshots
              |
              +--> SQLite database on persistent storage
```

The frontend and backend remain independently deployable applications with separate repositories and Git histories.

---

## Modular Monolith

The Season 2 backend is a modular monolith:

* one Node.js application;
* one authoritative SQLite database per environment;
* feature modules inside one backend repository;
* one REST and Socket.IO boundary;
* one deployment unit;
* explicit internal service and repository boundaries.

Microservices, distributed queues, and multiple independently deployed feature services are not part of Season 2.

---

## Repository Boundary

The frontend repository owns:

* browser application code;
* static assets;
* frontend build configuration;
* Netlify deployment configuration;
* canonical shared project documentation.

The backend repository owns:

* Express and Socket.IO server code;
* authentication and authorization;
* business services and validation;
* scheduled jobs;
* external-data adapters;
* SQLite schema, repositories, and migrations;
* backup and recovery operations;
* Render deployment configuration.

Backend code must not be duplicated into the frontend repository's legacy `server.cjs`.

---

# Part 3 - Frontend Architecture

## Presentation and Interaction Boundary

The frontend may:

* render backend-provided state;
* collect and validate user input for usability;
* submit explicit feature-specific requests;
* display loading, empty, unauthorized, conflict, validation, delayed-data, and failure states;
* maintain temporary view state;
* react to league-scoped Socket.IO invalidation events;
* refetch authoritative records.

The frontend must not:

* decide authorization;
* persist league truth;
* calculate authoritative cap, legality, auction, trade, matchup, or standings results;
* post the complete league state as an ordinary save operation;
* infer league identity from team names;
* store passwords or authoritative roles;
* treat local storage as proof of identity or access;
* perform hidden writes while loading or viewing.

---

## Frontend Composition

The frontend separates:

* application shell and routing;
* authenticated user/session context;
* selected league context;
* feature pages;
* reusable display components;
* feature-specific forms;
* one shared HTTP client;
* one shared Socket.IO client lifecycle;
* user-facing error translation.

Feature state should be loaded close to the feature that owns it rather than rebuilding one global league object inside `App.jsx`.

---

## Server State and View State

Server state includes records returned by the backend and must be treated as replaceable authoritative data.

View state includes:

* open panels;
* filters;
* sort selection;
* form drafts;
* temporary comparison selections;
* dismissed non-authoritative notices.

View state may use React state or local storage when safe. Authorization, bids, transactions, roster ownership, contracts, and other league truth may not rely on local storage.

---

## HTTP Client

The frontend uses one shared HTTP client module that:

* derives the backend base URL once;
* includes the approved session mechanism;
* sends the selected league context in the approved API form;
* handles JSON parsing consistently;
* distinguishes network, authentication, authorization, validation, conflict, and server errors;
* supports idempotency keys for eligible writes;
* never converts a failed write into apparent success.

The exact endpoint and error contracts belong in API Contracts.

---

# Part 4 - Backend Architecture

## Module Layers

The backend is separated into:

```text
bootstrap / application composition
routes and transport adapters
authentication and authorization middleware
request validation
feature services
domain calculations and policies
repositories and transactions
scheduled jobs
external-data adapters
notifications and Socket.IO publishing
operations, backup, and recovery
```

The layers are responsibilities, not permission to create unnecessary abstraction.

---

## Route Boundary

Routes:

* parse transport input;
* attach authenticated actor and league context;
* call authorization and validation;
* invoke one feature service;
* map the authoritative outcome to an API response.

Routes do not directly:

* read or write SQLite tables;
* calculate business outcomes;
* emit an event before a transaction commits;
* construct hidden fallback state;
* repair missing records on a GET.

---

## Feature Services

Feature services own complete use cases such as:

* move a roster player;
* submit a bid;
* resolve an auction;
* accept a trade;
* create a matchup lock;
* finalize a result;
* rebuild standings;
* freeze a league.

A service:

1. receives authenticated actor and league context;
2. loads required records through repositories;
3. checks permission and current state;
4. applies approved domain rules;
5. saves all affected records in one transaction when required;
6. creates activity, correction, notification, or operational records;
7. commits;
8. publishes post-commit invalidation events;
9. returns authoritative result data.

---

## Domain Calculations

Pure domain modules should calculate:

* roster legality;
* cap usage;
* contract AAV and monetary rounding;
* auction ranking and contract creation;
* trade validation;
* fantasy points;
* matchup outcomes;
* standings order;
* schedule generation.

They should accept explicit input, return explicit output, and avoid direct database, network, clock, filesystem, or Socket.IO access.

---

## Repositories

Repositories:

* execute parameterized SQLite operations;
* enforce league scope in every league-specific query;
* map database rows into internal records;
* expose transaction-aware operations;
* avoid product-policy decisions that belong in services or domain modules.

Feature code must not scatter raw SQL across routes, UI code, and scheduled jobs.

---

# Part 5 - Persistence Architecture

## SQLite Authority

SQLite becomes the authoritative store for mutable Season 2 application data.

The deployment uses one SQLite database file per environment, containing every league in that environment.

Every league-specific row includes or derives an enforced league relationship.

---

## Legacy JSON

Current JSON files may remain as:

* verified migration inputs;
* pre-migration backups;
* approved player or statistics import artifacts;
* temporary read-only compatibility material during a controlled cutover.

After cutover, normal feature writes must not update both JSON and SQLite as two competing sources of truth.

No read request may create a database, seed a league, migrate records, or repair state.

---

## SQLite Runtime Configuration

The runtime enables:

* foreign-key enforcement;
* write-ahead logging;
* a defined busy timeout;
* explicit transactions;
* integrity checks;
* controlled connection creation;
* application-level schema compatibility checks.

The exact Node SQLite driver is deferred to the SQLite Migration specification.

---

## Transaction Boundary

Operations affecting multiple records use one SQLite transaction.

Examples include:

* auction resolution plus contract, ownership, roster, activity, and bid updates;
* trade acceptance plus every asset, contract, obligation, proposal, cancellation, and history update;
* matchup finalization plus result version and derived-standings update;
* commissioner corrections;
* season rollover.

Socket.IO events and external notifications are not published until the database transaction commits.

---

# Part 6 - Request and Event Flow

## Write Flow

```text
request
  -> authenticate session
  -> resolve league and membership
  -> authorize action
  -> validate request shape
  -> begin transaction
  -> load current records
  -> validate current versions and business rules
  -> save complete result
  -> create required history / notification / job records
  -> commit
  -> emit scoped invalidation event
  -> return authoritative response
```

Retries must not duplicate eligible writes.

---

## Read Flow

```text
request
  -> authenticate when required
  -> resolve and authorize league scope
  -> execute read-only query
  -> return authoritative response
```

A GET or other documented read-only request must not:

* migrate;
* normalize and save;
* create defaults;
* refresh external data;
* repair missing rows;
* advance scheduled work;
* update last-viewed state unless a separate explicit write is used.

---

## Optimistic Conflict Handling

Mutable aggregates carry a version.

Feature writes submit the version they were based on. If the authoritative version changed, the backend rejects the stale write with a conflict response and current state instead of overwriting newer work.

Database constraints remain the final protection against duplicate ownership, duplicate processing, and invalid relationships.

---

# Part 7 - Socket.IO

## Role

Socket.IO provides timely notice that authoritative backend state changed.

It does not:

* replace REST authorization;
* accept trusted business writes without normal backend validation;
* become a second persistence layer;
* guarantee that the client has every missed event.

---

## Socket Rooms

Authenticated sockets join only authorized rooms such as:

```text
user:{userId}
league:{leagueId}
team:{teamId}
```

The server authorizes every room join from the authenticated session and current membership.

League A events must never reach League B rooms.

---

## Socket Events

Events carry:

* event type;
* league ID when applicable;
* affected feature;
* stable affected-record IDs when safe;
* committed version or timestamp;
* instruction to refetch the relevant resource.

Events should avoid embedding complete private records or active competing bid data.

The current broad `league:updated` event may remain temporarily during migration but should be replaced by scoped feature invalidations.

---

## Reconnect

After reconnect, the frontend refetches authoritative data for the active page and league.

Correctness must not depend on receiving every Socket.IO event.

---

# Part 8 - Scheduled Jobs

## Season 2 Job Model

Season 2 uses in-process scheduled job runners inside the backend deployment.

Jobs include:

* statistics refresh;
* auction resolution;
* trade expiration;
* matchup baseline and lock processing;
* matchup finalization and rollover;
* standings rebuild or recovery;
* snapshots and maintenance.

---

## Durable Job State

Job execution state is persisted in SQLite.

Each run records:

* job type;
* league and season when applicable;
* scheduled occurrence;
* start and finish time;
* status;
* attempt;
* lease owner and expiry;
* idempotency key;
* result or plain error summary.

In-memory `setInterval` calls may wake the runner, but memory alone must not determine whether work already completed.

---

## Job Safety

Every scheduled operation:

* is idempotent for one logical occurrence;
* acquires a durable lease or uniqueness guard;
* rechecks current feature state inside its transaction;
* survives process restart;
* records failure without creating partial results;
* supports an approved commissioner retry;
* respects feature flags and league lifecycle.

---

## Process Count

The initial production architecture runs one backend application instance with embedded scheduled jobs.

The durable lease design must still prevent duplicate work if a deployment temporarily overlaps old and new processes.

A separate worker process or external queue is deferred until scale or reliability evidence requires it.

---

# Part 9 - External NHL Data

## Backend-Only Integration

The backend is the only trusted integration point for NHL player and statistics sources.

The frontend reads normalized Hundo Leago player and statistics responses rather than calling the external provider as league authority.

---

## Adapter Boundary

External-data adapters:

* fetch source responses;
* validate and normalize source identifiers and fields;
* preserve the last valid cache when refresh fails;
* record source and refresh timestamps;
* report missing or conflicting player mappings;
* avoid changing league ownership or contracts.

Feature services consume normalized internal records, not provider-specific response shapes.

---

## Failure Behaviour

An external-data failure:

* does not erase the last valid player or statistics data;
* does not convert missing data into ordinary zero performance;
* does not silently finalize a result when approved freshness requirements fail;
* creates operational health information;
* allows approved retry and commissioner review.

---

# Part 10 - Authentication and Security Boundary

## Backend Sessions

The architecture uses backend-managed sessions carried by secure browser cookies.

The frontend holds display-safe session information but not raw passwords, password hashes, or reusable bearer tokens in local storage.

The exact session lifetime, cookie flags, request-forgery protection, password hashing, reset tokens, and rate limits belong in Security.

---

## Authorization

Every private request is authorized from:

* authenticated user;
* active league membership;
* role;
* team assignment;
* feature state;
* record ownership;
* league and season scope.

Frontend button visibility is only a usability feature.

---

## Secrets

Secrets remain backend environment variables or approved platform secret configuration.

No secret is:

* committed;
* exposed through `VITE_` variables;
* included in Socket.IO payloads;
* returned by health endpoints;
* stored in league activity;
* displayed in Commissioner Tools.

---

# Part 11 - Environments and Hosting

## Environments

The environments are:

* local development;
* staging;
* production.

Each environment has separate:

* frontend configuration;
* backend deployment;
* SQLite database;
* persistent files and backups;
* accounts and leagues;
* secrets;
* allowed origins;
* Socket.IO rooms and connections.

Staging never mounts or writes the production persistent disk.

---

## Hosting

The initial hosting remains:

* Netlify for the built frontend;
* Render for the backend and its persistent disk.

The architecture does not require a hosting-provider change before Season 2.

---

## Environment Validation

At startup, the backend validates required configuration and environment identity.

Production startup fails closed when critical database, secret, origin, or storage configuration is missing or unsafe.

Feature flags use explicit values and safe defaults. Debug and destructive controls are disabled in production unless an approved production workflow explicitly enables them.

---

# Part 12 - Observability and Recovery

## Structured Logs

The backend produces structured logs containing:

* timestamp;
* severity;
* environment;
* request or job ID;
* feature and operation;
* league and season IDs when safe;
* actor ID for protected actions;
* outcome and duration;
* safe error code and summary.

Logs do not contain passwords, session secrets, active bid values, raw tokens, or unnecessary private payloads.

---

## Health Endpoints

The backend exposes:

* liveness: process can answer;
* readiness: required database and application dependencies are usable;
* protected operational health: detailed job, migration, cache, and backup state.

Public health responses do not expose filesystem paths, backup locations, secrets, or private league data.

All health checks are read-only.

---

## Backups

SQLite backups use a database-safe backup operation rather than an uncontrolled file copy during active writes.

Backups:

* are environment- and database-scoped;
* include schema version and creation metadata;
* are stored separately from the live database;
* are verified before being considered usable;
* follow the approved retention and restoration workflow;
* never make read-only endpoints write.

Exact schedules, retention counts, off-site storage, and restore commands belong in Backup and Restore.

---

# Part 13 - Migration and Delivery Boundaries

## Refactor Before Migration

The backend refactor and SQLite migration remain distinguishable.

The approved sequence is:

1. inventory current behaviour and endpoints;
2. extract routes and business services without changing behaviour;
3. introduce repository interfaces around current storage;
4. approve Data Model and SQLite Migration;
5. implement SQLite repositories and migration tooling;
6. test migration against copied data;
7. cut feature writes over to SQLite;
8. verify records and behaviour;
9. remove normal JSON writes only after rollback criteria are satisfied.

---

## Schema Migrations

Production schema migration is an explicit deployment operation.

Opening a page, starting a read request, or reading a repository does not run a destructive or data-changing migration.

The backend refuses unsafe startup when its code requires a schema newer than the database and the approved migration has not run.

---

## Compatibility

Coordinated API changes must:

* document the old and new contract;
* update backend and frontend deliberately;
* define deployment order;
* preserve a rollback path;
* avoid a period where production frontend writes an incompatible payload.

---

# Part 14 - Required Testing

Architecture verification must include:

* frontend and backend builds or startup checks;
* unit tests for pure domain calculations;
* repository tests against temporary SQLite databases;
* service transaction tests;
* API authentication, authorization, validation, conflict, and idempotency tests;
* multi-league isolation tests;
* Socket.IO room and reconnect tests;
* scheduled-job restart, overlap, retry, and idempotency tests;
* external-data failure and last-valid-cache tests;
* schema compatibility and migration tests;
* backup and restoration tests;
* local, staging, and production configuration validation;
* proof that read-only requests never write;
* proof that frontend calculations do not override backend authority.

---

# Part 15 - Approval Checklist

## Inherited Approved Constraints

- [x] The frontend and backend remain separate repositories with independent deployments and Git histories.
- [x] React and Vite remain the frontend foundation.
- [x] Node.js and Express remain the backend foundation.
- [x] The backend is authoritative for mutable league state and business calculations.
- [x] SQLite becomes authoritative for mutable league data.
- [x] Every private and league-specific operation is authenticated, authorized, and league-scoped.
- [x] Stable IDs replace display names as record relationships.
- [x] Read-only endpoints remain read-only.
- [x] Existing JSON data is preserved until an approved migration and rollback process permits retirement.
- [x] Staging uses separate deployments, data, accounts, secrets, and storage.
- [x] Production data is never treated as disposable merely because the league is inactive.
- [x] Matchup and standings operations remain outside League Activity.
- [x] Commissioner operations use explicit approved tools rather than unrestricted data editing.
- [x] Major structural work requires backups, isolated testing, verification, and rollback.

## Approved Architecture Decisions

- [x] Season 2 uses a modular monolith rather than microservices.
- [x] Production initially runs one Node.js backend application instance.
- [x] The backend remains CommonJS during the behaviour-preserving refactor and SQLite migration.
- [x] The frontend repository contains no active backend implementation; legacy `server.cjs` is retired through a separate approved cleanup.
- [x] Netlify remains the initial frontend host.
- [x] Render remains the initial backend host.
- [x] REST is the authoritative request/response interface.
- [x] Socket.IO is used for scoped invalidation and timely updates, not as a separate source of truth.
- [x] The current broad `league:updated` event is replaced gradually by feature-scoped invalidation events.
- [x] Authenticated sockets use authorized user, league, and team rooms.
- [x] Reconnecting clients refetch authoritative data and do not rely on receiving every event.
- [x] Socket payloads avoid complete private records and active competing bid information.
- [x] The frontend uses one shared HTTP client and one shared Socket.IO lifecycle.
- [x] The frontend separates session context, league context, feature server state, and temporary view state.
- [x] Ordinary frontend writes use feature-specific endpoints rather than posting the complete league object.
- [x] Local storage may hold safe view preferences but never authoritative roles, ownership, bids, contracts, or permissions.
- [x] Backend modules are organized around bootstrap, transport, auth, validation, services, domain logic, repositories, jobs, adapters, notifications, and recovery.
- [x] Routes do not contain direct SQL or authoritative business calculations.
- [x] Feature services own complete use cases and their transaction boundaries.
- [x] Domain calculations are pure modules without database, network, filesystem, clock, or Socket.IO side effects.
- [x] Repositories are the only normal location for SQLite queries.
- [x] One SQLite database file contains all leagues in one environment.
- [x] Foreign keys, write-ahead logging, a busy timeout, explicit transactions, and integrity checks are enabled.
- [x] The exact Node SQLite driver is selected in the SQLite Migration specification.
- [x] Normal operation does not dual-write authoritative state to JSON and SQLite.
- [x] JSON remains only migration input, backup material, or explicitly approved cache/compatibility data after cutover.
- [x] Multi-record feature operations commit atomically before events or notifications are published.
- [x] Mutable aggregates use optimistic versions and stale writes return conflicts rather than overwriting newer state.
- [x] Eligible retryable writes use idempotency keys in addition to database constraints.
- [x] Backend-managed sessions use secure browser cookies rather than reusable tokens in local storage.
- [x] Detailed password, cookie, CSRF, reset, and rate-limit choices remain owned by Security.
- [x] External NHL integrations exist only behind backend adapters.
- [x] Failed external refreshes preserve the last valid normalized data.
- [x] Season 2 scheduled jobs run inside the backend process.
- [x] In-memory timers may wake jobs, but durable SQLite job state determines execution and completion.
- [x] Every scheduled occurrence uses a durable lease or uniqueness guard and is idempotent.
- [x] Durable job design protects against deployment overlap even with one normal backend instance.
- [x] A separate worker process or external queue is deferred until evidence requires it.
- [x] Local, staging, and production are the required environments.
- [x] Every environment has separate frontend configuration, backend, SQLite data, accounts, secrets, origins, and persistent storage.
- [x] Startup validates environment identity and critical configuration.
- [x] Production fails closed when critical database, origin, secret, or storage configuration is missing or unsafe.
- [x] Debug and destructive controls are disabled in production unless an approved production workflow explicitly enables them.
- [x] Logs are structured and include safe request/job, feature, league, actor, outcome, and duration context.
- [x] Public liveness and readiness checks expose no secrets, filesystem paths, backup locations, or private league data.
- [x] Detailed operational health is authenticated and read-only.
- [x] SQLite backups use a database-safe backup operation and are verified before being considered usable.
- [x] The backend refactor introduces service and repository boundaries before authoritative SQLite cutover.
- [x] Production schema migration is explicit and never triggered by a page view or read-only request.
- [x] The backend refuses unsafe startup when code and schema versions are incompatible.
- [x] Coordinated frontend/backend contract changes define deployment order and rollback.
- [x] Grae approved this document as the Season 2 Architecture technical specification by delegating the technical decisions to Codex.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The architecture approval phase is complete.

Architecture implementation is complete only when the refactored boundaries, SQLite authority, explicit writes, authentication flow, league isolation, transaction ordering, scoped events, durable jobs, environment separation, health, backup, migration, and read-only guarantees are implemented and verified.

---

# Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/DEPLOYMENT.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/07-testing/TESTING_STRATEGY.md
docs/08-operations/BACKUP_AND_RESTORE.md
```
