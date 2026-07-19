# Hundo Leago — Current State

## Document Purpose

This document describes what currently exists in Hundo Leago.

It is a factual snapshot of the present implementation—not a roadmap, feature wish list, or description of the intended final product.

Use this document to understand:

* what is already built;
* what is partially completed;
* what remains dependent on the current architecture;
* what is planned but not yet implemented;
* which areas require verification before the 2026–27 season.

Last reviewed: **2026-07-14**

---

## Current Operating Condition

The current operating mode is:

`OFFSEASON_RESET`

The 2025–26 league season has ended, and managers are not actively using Hundo Leago.

A controlled reset of approved Season 1 league records is planned before the 2026–27 season.

Temporary instability is acceptable in local development, feature branches, and staging. Production must not be intentionally left broken.

The authoritative operating and data-preservation rules are defined in:

`docs/01-project/OPERATING_MODE.md`

---

## Repository Structure

Hundo Leago currently uses two separate Git repositories.

### Frontend repository

```text
hundo-leago
```

Purpose:

* React user interface;
* page navigation;
* team and commissioner controls;
* display of backend data;
* communication with the backend API;
* shared canonical project documentation.

### Backend repository

```text
hundo-leago-backend
```

Purpose:

* authoritative league state;
* business-rule enforcement;
* API endpoints;
* Socket.IO updates;
* scheduled jobs;
* player data;
* statistics ingestion and caching;
* backups and restoration.

The two repositories are opened together locally using:

```text
Hundo-Leago-Development.code-workspace
```

They remain separate Git repositories and separate deployment projects.

---

## Hosting and Deployment

### Frontend

The frontend is built with React and Vite and deployed through Netlify.

Netlify connects to the frontend GitHub repository.

The frontend communicates with the backend through configured API environment variables.

### Backend

The backend is built with Node.js, Express, and Socket.IO and deployed through Render.

The canonical Render backend currently handles:

* league APIs;
* player APIs;
* statistics APIs;
* scheduled statistics refresh;
* matchup processing;
* persistent league storage.

A previously separate secondary Render backend was suspended after its responsibilities were consolidated into the canonical backend.

### Production branches

Production deployments currently use the `main` branches.

Development work should occur on separate branches and be verified before it is merged into `main`.

---

## Current Technology

### Frontend

* React
* Vite
* JavaScript
* Browser `fetch` requests
* Socket.IO client
* Netlify deployment

### Backend

* Node.js
* Express
* Socket.IO
* CommonJS modules
* File-backed JSON persistence
* Scheduled background jobs
* Render persistent disk

### Planned but not yet implemented

* SQLite as the authoritative mutable league database;
* secure multi-user authentication;
* full league isolation through database relationships;
* automated test coverage sufficient for releases;
* a dedicated staging environment.

---

## Current Data Storage

The backend currently uses file-backed JSON state.

Important files include:

```text
league-state.json
players.json
stats-cache.json
```

### `league-state.json`

Contains mutable league information such as:

* teams;
* rosters;
* auctions;
* trades;
* buyouts;
* league activity;
* matchup state;
* standings-related results;
* commissioner state.

### `players.json`

Contains the centralized player database.

Player records use stable player identifiers.

The player database contains approximately 2,033 player records, including active and historical players used by the system.

### `stats-cache.json`

Contains imported NHL statistics used by the frontend and matchup calculations.

The current cache normally contains statistics for approximately 855–859 players, depending on source availability and season activity.

### Current limitation

The JSON files were designed around one primary league.

They are not yet an appropriate long-term source of truth for secure multi-league operation.

---

## Persistence and Data Safety

The backend is the authoritative source of league state.

The frontend must display backend state and must not independently create a competing version of league truth.

The current persistence layer includes:

* loading league state from disk;
* saving league changes to persistent storage;
* schema versioning;
* normalization and migration hooks;
* queued writes;
* temporary-file and rename-based saves;
* pre-write backups;
* snapshot creation;
* snapshot restoration;
* protection against accidental automatic reseeding.

The current league-state schema version is:

```text
SCHEMA_VERSION = 1
```

Production data is stored on Render’s persistent disk.

The backup and restoration system has been used successfully, but the complete production backup and disaster-recovery procedure still needs to be formally documented and rehearsed.

---

## League Management Features

The following core Season 1 systems exist and have been used by the league.

### Teams and rosters

The system supports the six original league teams and their player ownership.

Roster functionality includes:

* player ownership;
* active roster management;
* roster limits;
* salary-cap calculations;
* positional legality;
* injured-reserve handling;
* player identifiers rather than name-only ownership.

The roster interface is functional, although it requires changes for accounts, multiple leagues, expanded roster groups, and the 2026–27 contract system.

The current implementation does not yet represent the approved Season 2 roster model of:

* 18 active slots divided into 12 forward and 6 defence slots;
* four bench or inactive slots with a maximum `$4.00 AAV` per benched player;
* four injured-reserve slots;
* unlimited eligible prospect slots;
* no goalies;
* C, LW, and RW normalized to F and LD and RD normalized to D;
* cap usage based only on active-player AAV, retained salary, and buyout penalties.

### Salary cap

The backend calculates and enforces the current salary-cap rules.

Existing cap-related functionality includes:

* player salaries;
* cap totals;
* remaining cap;
* buyout penalties;
* retained salary;
* roster legality.

A previously reported frontend inconsistency exists where different pages or panels may display different remaining-cap values. This must be reproduced and resolved during future roster and contract work.

### Contracts

Basic contract data exists in the current league model.

The full Season 2 contract system is not yet complete.

Future work must add or formalize:

* one-to-three-year contract duration;
* total contract value and average annual value;
* remaining contract years;
* remaining years that include the current season;
* the absence of a team-wide total contract-year limit;
* the prohibition on contract extensions;
* carried-over contracts;
* auction contract creation from total value and bid term;
* the approved `$3` over three years fantasy ELC at `$1 AAV`;
* future automatic detection and enforcement of real-life ELC signing;
* contract expiration during end-of-season rollover before the next Entry Draft;
* immediate roster removal and free-agency conversion at expiration;
* contract history;
* league-specific contract rules.

### Blind auctions

The current application supports blind free-agent auctions.

Existing behaviour includes:

* auction submissions;
* bid editing limits;
* cooldown handling;
* minimum-bid rules;
* Sunday processing;
* winning-bid assignment;
* activity logging.

The auction system was used during Season 1.

It must be updated to:

* scope all auctions to a league;
* work with authenticated users;
* use SQLite storage;
* support the approved Season 2 roster and contract rules;
* provide repeatable automated and manual testing.

### Trades

The current trade system supports:

* player trades;
* salary retention;
* trade expiry;
* trade acceptance and cancellation;
* interaction with buyouts;
* activity history.

The current trade system must be adapted for:

* authenticated users;
* multiple leagues;
* transfer of existing average annual value and remaining contract years;
* retained average annual value for the remaining contract term;
* multiple retention records up to 50% cumulative original AAV;
* three retention slots per team;
* draft picks;
* player rights;
* prospect-status preservation when prospect rights are traded;
* a commissioner-configured trade deadline;
* reopening trading at the start of the entry draft;
* SQLite transactions;
* stricter permission validation.

### Entry Draft

The current application does not contain the approved Entry Draft workflow.

The Entry Draft is not required for the initial Season 2 launch. It is planned for development during the season and must be complete before the first Season 2 Entry Draft is used.

The later implementation must include the approved four-round linear draft, lottery, current plus three future draft classes, live selections, private queues, automatic timeout selections, immutable completed picks, traded-pick clock resets, and league-scoped history.

The approved lottery uses every active non-finalist, two weighted draws without replacement, linear reverse-standings weights, fixed finalist positions, and one immutable order across all four rounds.

The approved normal eligibility pool contains F or D players selected in the most recently completed NHL Entry Draft, plus the approved immediately-prior Hundo Leago rights-release re-entry. Goalies are excluded.

### Buyouts

The current application supports player buyouts and buyout penalties.

Current buyout calculations have been used successfully, but they do not yet prove compliance with the approved Season 2 rule.

Season 2 buyouts must eliminate the contract, release the player to free agency, and charge 25% of full underlying average annual value in each remaining contract year without penalty decay.

Existing retention obligations must continue unchanged after a buyout.

Auction signings must have a 14-day buyout lock that follows the player after a trade. Buying out a player must cancel pending trades involving that player.

### Commissioner tools

The existing commissioner panel provides controls for league administration and recovery.

Existing capabilities include:

* roster and league adjustments;
* snapshots;
* snapshot restoration;
* selected reset and debug controls;
* activity management.

The panel contains some outdated or redundant controls.

Season 2 requires clearer commissioner permissions, improved logging, safer recovery tools, and less need to manually edit code or JSON data.

### League activity history

Important league actions are recorded in an activity history.

The history provides a basic audit trail for:

* auctions;
* trades;
* buyouts;
* commissioner actions;
* roster changes.

The audit system should be preserved and expanded during the SQLite migration.

---

## Player Database

A centralized player database is implemented.

Player records include information such as:

* stable player ID;
* full name;
* first name;
* last name;
* position;
* NHL team abbreviation;
* birth date;
* active status.

Important current behaviour:

* roster ownership references player IDs;
* auctions reference player IDs;
* name-only ownership writes are blocked;
* the backend can reload and inspect player data;
* the frontend can search and filter players.

Important player endpoints currently include:

```text
GET /api/players
GET /api/players/:id
GET /api/players/debug
POST /api/players/reload
```

The complete compatibility inventory and approved Season 2 target endpoint definitions are maintained in:

`docs/04-technical-specs/API_CONTRACTS.md`

---

## Statistics System

The backend imports and caches player statistics.

The current implementation uses the approved Season 2 fantasy-point formula:

```text
FP = goals × 1.25 + assists
```

Fantasy points per game are calculated as:

```text
FPG = FP ÷ games played
```

The statistics system includes:

* a disk-backed statistics cache;
* a read-only statistics endpoint;
* a protected manual refresh endpoint;
* scheduled refresh jobs;
* current-season NHL statistics;
* frontend player-stat display;
* use by matchup calculations.

Important endpoints include:

```text
GET /api/stats
POST /api/stats/refresh
```

Statistics are dependent on external NHL data availability.

Off-season player totals may not provide useful live matchup-testing data, so dedicated test fixtures or simulated scoring will be required.

---

## Matchups

A significant matchup system has already been implemented.

It is more advanced than the old `STATUS.md` suggests.

Current backend matchup functionality includes:

* a persisted matchup schedule;
* 26 scheduled weeks;
* round-robin team pairings;
* explicit week identifiers;
* configurable week boundaries;
* baseline timestamps;
* roster-lock timestamps;
* week-end timestamps;
* rollover timestamps;
* roster locks by team;
* baseline snapshots;
* weekly player scoring based on baseline differences;
* weekly result finalization;
* idempotent rollover protection;
* stored results by week;
* scheduled matchup jobs;
* commissioner and debug controls.

The default week model is based on:

* week start: Monday at 12:00 AM Pacific;
* baseline: approximately one hour after week start;
* roster lock: Monday at 4:00 PM Pacific;
* week end: Sunday at 11:59 PM Pacific;
* rollover: the following Monday at 12:00 AM Pacific.

The backend—not the frontend—is responsible for deciding the current matchup week and its boundaries.

Important matchup endpoints include:

```text
GET /api/matchups/current
GET /api/matchups/baseline/status
GET /api/matchups/baseline/preview
GET /api/matchups/standings
```

Additional debug, preview, reset, and commissioner endpoints also exist.

The complete current compatibility inventory and approved target endpoint catalogue are documented in `API_CONTRACTS.md`.

### Matchup limitations

Although much of the matchup engine exists, it has not yet completed a full real fantasy season as Hundo Leago’s only matchup system.

It still requires:

* repeatable accelerated testing;
* simulated player-point changes;
* complete lock testing;
* illegal-roster testing;
* late-legal-roster testing;
* team-specific baseline creation when an illegal roster becomes legal;
* exclusion of points earned while a roster is illegal;
* rollover testing;
* failure-recovery testing;
* commissioner correction testing;
* multi-league isolation;
* SQLite migration;
* production launch rehearsal.

The old `phase 3 roadmap.md` is no longer an active roadmap. Much of it describes work that has already been implemented.

Its important behavioural rules must later be moved into:

`docs/03-product-specs/MATCHUPS.md`

The original roadmap should then be archived.

---

## Standings

A read-only standings backend endpoint exists.

The standings system calculates values based on finalized matchup results, including:

* wins;
* losses;
* ties;
* standings points;
* winning percentage;
* fantasy points for;
* fantasy points against;
* point differential.

The current `2/1/0` standings-points calculation and the current sorting sequence—standings points, fantasy-point differential, fantasy points for, then team name for deterministic display—match the approved Scoring Rules.

The frontend contains a standings page with:

* team display;
* standings columns;
* sorting;
* mobile-safe horizontal handling;
* visual ranking treatment.

Standings remain read-only for managers.

Future work must ensure standings:

* are isolated by league;
* derive from the correct season;
* survive SQLite migration;
* correctly support playoffs and future season history;
* can be rebuilt safely from finalized results.

---

## Frontend Pages and Interfaces

The frontend currently includes interfaces for major league-management functions.

Existing pages and interface areas include:

* team rosters;
* free agents and players;
* auctions;
* trades;
* commissioner tools;
* matchups;
* standings;
* navigation and team selection.

The Players page supports several scopes and filters, including:

* free agents;
* all players;
* the selected team;
* NHL-team filters;
* position filters;
* minimum-games-played filters;
* search;
* player comparison.

The Matchups page displays:

* the current matchup week;
* paired teams;
* matchup detail;
* eligible and locked players;
* scoring information.

The frontend is responsive in several important areas, but the complete site has not yet undergone a formal mobile and accessibility review.

---

## Authentication and Permissions

Secure user authentication is not yet implemented.

Any previous password or team-selection behaviour must not be treated as secure backend authentication.

The current system does not yet provide the complete Season 2 model for:

* users;
* password storage;
* sessions;
* league memberships;
* team ownership;
* manager permissions;
* commissioner permissions;
* administrator permissions.

This is a launch-critical area for the 2026–27 season.

---

## Multi-League Support

Multi-league support is not yet implemented.

The existing application was built primarily around one six-team league.

Season 2 requires every league-specific record to be associated with the correct league, including:

* memberships;
* teams;
* rosters;
* contracts;
* auctions;
* bids;
* trades;
* buyouts;
* draft picks;
* player rights;
* matchup schedules;
* matchup results;
* standings;
* league settings;
* activity history.

Only an authorized administrator will create leagues during the initial Season 2 release.

Public self-service league creation is outside the current release scope.

---

## Backend Refactor

The backend was originally concentrated in a large `server.js` file.

A behaviour-preserving refactor is currently in progress on the local backend branch:

```text
stage2
```

Completed or partially completed extractions include:

```text
routes/healthRoutes.js
routes/leagueReadRoutes.js
routes/playersReadRoutes.js
```

The extracted routes were tested locally against their existing endpoints.

The refactor is not complete.

Significant routing, services, scheduled jobs, validation, and data-access responsibilities remain inside or closely coupled to `server.js`.

The current refactor must be completed before or alongside the introduction of a clean repository/data-access layer.

The refactor must not silently change feature behaviour.

The approved Architecture, Data Model, API Contracts, Backend Refactor, SQLite Migration, Security, Frontend Structure, Environment Setup, Deployment, and Backup and Restore specifications now define the target modular-monolith, SQLite, transaction, identity, league-isolation, history, job, API, compatibility, extraction, migration, authentication, application-security, frontend, hosting-environment, release, and recovery boundaries.

The API review identified 34 current route registrations, including six conditional matchup-debug routes. Most remain coupled to `server.js`. The approved Backend Refactor defines a 14-stage sequence from the Step 0 safety harness through the Step 13 completion gate, with focused verification gates throughout.

The SQLite Migration specification selects Node 24.14.1 and exact `better-sqlite3` 12.11.2, deterministic copied-JSON import, explicit reset manifests, verified backups, a maintenance-window cutover, and no dual-write period. The Security specification selects Node `scrypt`, opaque server-side sessions, session-bound CSRF, exact credentialed CORS, durable rate limits, backend-derived authorization, and separate append-only security audit.

The approved Active Roadmap now defines nine dependency-ordered milestones from the canonical foundation through initial launch, required in-season completion, and deferred work. The approved Active Work Plan identifies only backend-refactor work item `BR-00`, the Baseline and Safety Harness, as ready to start.

`BR-00` is limited to the backend `stage2` branch. It adds Node built-in characterization tests, synthetic temporary fixtures, exact endpoint-inventory proof, read-only file-hash proof, and league-store characterization. It does not move feature code, add SQLite, implement authentication, change frontend behavior, or authorize deployment.

The approved Testing Strategy now defines backend, frontend, browser, security, database, migration, job, recovery, staging, release, and production-smoke evidence. The approved Frontend Structure selects TanStack Query for server state, one shared HTTP client, one Socket.IO lifecycle, URL-derived stable league context, feature modules, and an incremental `FE-00` through `FE-11` extraction from the current large `App.jsx`.

The approved Environment Setup defines isolated local, test, staging, and production resources, exact frontend and backend configuration contracts, Node `24.14.1`, a one-instance Render SQLite topology, fail-closed environment identity, and separate Netlify, Render, disk, database, secret, user, email, and backup boundaries.

The approved Backup and Restore specification selects application-consistent SQLite backup, verified AES-256-GCM-encrypted offsite artifacts, hourly in-season and daily off-season protection, platform-administrator restore execution, post-restore session and token revocation, job and outbox reconciliation, and mandatory staging drills.

The approved Deployment specification selects CI-gated staging, manual production publication of exact commits, compatibility-first backend and frontend ordering, explicit migrations, read-only production smoke, release records, first-write rollback boundaries, and separate code, configuration, and database recovery.

The approved Backend Endpoint Checklist tracks all 34 current route registrations and all 124 approved target routes with permanent IDs and evidence gates for characterization, contract tests, frontend connection, staging, production verification, and compatibility retirement.

The approved Manual QA Checklist defines repeatable release-candidate acceptance across desktop, mobile, keyboard, accessibility, roles, two leagues, feature workflows, failures, reconnect, recovery, defect handling, and retest. The approved Release Checklist defines hard go/no-go gates from exact source commits through production authorization, read-only smoke, monitoring, rollback, and closeout.

These specifications and checklists are approved design, not evidence that the target implementation, migration, authentication system, environment infrastructure, deployment pipeline, recovery tooling, endpoint catalogue, QA run, release approval, or refactor sequence is already complete.

---

## Current Local Development State

### Frontend

Current documentation work is occurring on:

```text
docs/summer-2026-foundation
```

The canonical North Star and operating-mode documents have been created on this branch.

An unrelated local modification currently exists in:

```text
src/components/TeamToolsPanel.jsx
```

That modification is intentionally being kept separate from the documentation commits.

### Backend

Current local refactor work is on:

```text
stage2
```

The backend branch contains refactor progress that may not yet exist on the remote `main` branch.

Before resuming backend coding, the branch state and its difference from `main` must be reviewed.

---

## Automated Testing

The project does not yet have enough automated test coverage to safely verify all core league behaviour.

The approved Testing Strategy now defines the required tools, layers, fixtures, gates, and evidence. The approved Backend Endpoint Checklist provides the exact route-level tracking structure, and the approved Manual QA and Release checklists provide staging acceptance and production go/no-go records. Their test foundations, endpoint evidence, QA runs, and release evidence have not yet all been completed.

Current verification has relied heavily on:

* manual browser testing;
* curl requests;
* endpoint inspection;
* health checks;
* commissioner actions;
* direct state inspection.

Season 2 requires repeatable testing for:

* authentication;
* permissions;
* league isolation;
* roster legality;
* cap calculations;
* contracts;
* auctions;
* trades;
* buyouts;
* matchup locks;
* scoring;
* rollover;
* standings;
* migrations;
* backups and restoration.

Read-only endpoints must remain read-only.

---

## Staging Environment

A fully documented and isolated staging environment is not yet established.

Its target topology and configuration are now documented in `docs/04-technical-specs/ENVIRONMENT_SETUP.md`. No staging Netlify site, Render service, persistent disk, database, secret set, or backup namespace was created by approving that design.

Current development has used:

* local frontend and backend servers;
* production deployments;
* manual verification.

Before Season 2 launches, staging must have:

* separate frontend deployment;
* separate backend deployment;
* separate database and files;
* test-only accounts;
* test leagues;
* non-production secrets;
* no access to the production persistent disk.

---

## Known Risks and Incomplete Areas

The following require attention before the 2026–27 launch:

1. The backend refactor is incomplete.
2. Mutable league data still uses file-backed JSON.
3. Secure authentication is not implemented.
4. Multi-league isolation is not implemented.
5. Contracts are not yet complete for the new season model.
6. Existing features are not yet scoped by league.
7. Automated tests are limited.
8. Staging is not yet established.
9. Backup and restoration are documented but not yet implemented or rehearsed.
10. Matchups and standings have not completed a full real season.
11. Off-season scoring makes realistic matchup testing difficult without simulation tools.
12. Some frontend cap displays may disagree.
13. Existing documentation is duplicated, outdated, or stored in inconsistent locations.
14. The frontend README still contains the default Vite template text.
15. The old `STATUS.md` no longer accurately describes the application.
16. The old Phase 3 roadmap mixes behavioural rules with completed engineering steps.
17. The production deployment procedure is documented, but the broader three-person development workflow and role handoffs are not yet documented.

---

## Immediate Development Priority

The current priority order is:

1. Establish canonical documentation and repository instructions.
2. Finish the behaviour-preserving backend refactor.
3. Document the current API and architecture.
4. Design and implement SQLite safely.
5. Introduce users, leagues, memberships, and permissions.
6. Convert existing features to league-scoped data.
7. Complete contracts and roster models.
8. Harden auctions and trades.
9. fully test matchups and standings.
10. Establish staging, backups, release procedures, and launch testing.

Architecture, Data Model, API Contracts, Backend Refactor, SQLite Migration, Security, Frontend Structure, Environment Setup, Deployment, Testing Strategy, Backend Endpoint Checklist, Manual QA Checklist, Release Checklist, Backup and Restore, Active Roadmap, and Active Work Plan are now approved. The next coding step, when Grae requests execution, remains backend-refactor work item `BR-00`: Baseline and Safety Harness.

The active schedule will be maintained in:

`docs/05-roadmap/ACTIVE_ROADMAP.md`

---

## Documents That This File Replaces

This document replaces the factual-status role previously attempted by:

```text
STATUS.md
```

The old file should not be deleted until it has been moved into the documentation archive and the cleanup branch has been reviewed.

This document does not replace:

* the North Star;
* the operating-mode policy;
* product specifications;
* technical specifications;
* league rules;
* the active roadmap;
* testing instructions.

It records only the current state of the project at the date shown above.
