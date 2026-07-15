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

* contract duration;
* remaining contract years;
* contract-year limits;
* carried-over contracts;
* new contract creation;
* expiring contracts;
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
* contract terms;
* draft picks;
* player rights;
* SQLite transactions;
* stricter permission validation.

### Buyouts

The current application supports player buyouts and buyout penalties.

Current buyout calculations have been used successfully.

The exact future rules, including any penalty decay or contract interaction, must be defined in the approved contract and league-rule specifications.

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

The complete endpoint definitions will be maintained separately in:

`docs/04-technical-specs/API_CONTRACTS.md`

---

## Statistics System

The backend imports and caches player statistics.

The current fantasy-point formula is:

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

The exact endpoint inventory will be documented in `API_CONTRACTS.md`.

### Matchup limitations

Although much of the matchup engine exists, it has not yet completed a full real fantasy season as Hundo Leago’s only matchup system.

It still requires:

* repeatable accelerated testing;
* simulated player-point changes;
* complete lock testing;
* illegal-roster testing;
* late-legal-roster testing;
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
9. Backup and restoration procedures are not fully documented or rehearsed.
10. Matchups and standings have not completed a full real season.
11. Off-season scoring makes realistic matchup testing difficult without simulation tools.
12. Some frontend cap displays may disagree.
13. Existing documentation is duplicated, outdated, or stored in inconsistent locations.
14. The frontend README still contains the default Vite template text.
15. The old `STATUS.md` no longer accurately describes the application.
16. The old Phase 3 roadmap mixes behavioural rules with completed engineering steps.
17. Production and development workflows are not yet documented for the three-person team.

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
