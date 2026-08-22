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

Last reviewed: **2026-08-22**

---

## 2026-08-21 M7-26 Isolated-Staging Release — Blocked and Held

Release `HL-20260821-1` has reached its held schema-migration and frontend
publication boundary, but it is not yet closed. The exact frontend candidate is
`0e8eee92e2e323dd7f25ec3112988feaf23f96f0` (privacy/documentation commit
`c119f119ffd4aa96635fe382792e704d535a7cbd`; broad UI commit
`d82583dea2132d94e53a60853da6dddc549a0126`), and the current strict backend
candidate is `23971a4d66ee6383c6ad54339e769dbc9a76561e`, following held credential-
rotation candidate `fe6047552857376b490756ff63ac593d431ee561`, migration
candidate `a747430500fbf6887dd748e5e3dfc0ecee77dc07`, and broad implementation
commit `ac1e12baadce4fcc08b6fb680b34db6992a4f891`.

Held migration deploy `dep-da4e092fngtc739dipm0` passed `3,428/3,428` hosted
tests. Held final deploy `dep-da4gkpoed13c739gm0dg` passed the expanded
`3,440/3,440` gate across `443` suites at exact commit `fe604755...`, produced
zero post-start errors, returned public live/ready `200`, and kept session
traffic at `503 SERVICE_MAINTENANCE` under the full safety hold.

The strict candidate's complete local Node `24.14.1` gate discovered `3,502`
tests across `443` suites: `3,500` passed, two Windows link-capability cases
were intentionally skipped, and zero failed. Exact held deploy
`dep-da4p5hu7bikc73aaeiq0` finished `LIVE` at
`2026-08-22T13:05:02.585588Z` and passed all `3,502/3,502` hosted tests with
zero skips/failures and clean startup. Its exact environment/full-hold/provider-
absence and source/root/target/work/WAL/SHM boundaries passed; live/ready were
`200` and session remained `503 SERVICE_MAINTENANCE`.

The identity-bound staging database advanced additively from schema `52` to
`54` only after encrypted backup `dd37f2ea-e3d2-4cd2-85bd-fb377431acce` and a
distinct clean restore verified. Post-migration backup
`ad6e1aaf-7e20-4c10-9671-30078f7d56a2` also verified. Repeated authority
previews reported no mutation required, and the exhaustive pre/post FAD receipt
scans were read-only and safe with zero persisted T-082/T-144 receipts.

After another verified backup, the held staging-only command rotated all nine
synthetic release-QA account credentials, revoked one active synthetic session,
and wrote receipt `d5e9c784-db5f-42f6-8fcb-1918e93f26c0`. Its exact replay
wrote zero rows, and post-rotation backup
`a958cef3-db7b-445c-8a60-3e8b752aa85a` verified with integrity `ok` and zero
foreign-key violations. No password value is retained in project evidence.

Quiescent deploy `dep-da4hm30jo6nc73d26l80` became live at
`2026-08-22T04:32:15Z` on exact `fe604755...`, passed `3,440/3,440` hosted
tests with zero startup errors, returned live/ready `200`, and returned
anonymous session `401 SESSION_REQUIRED` with `no-store` and staging CORS.
Sequential Chrome smoke signed `Admin`, `Man A Leag A`, and `Man B Leag A` in
and out cleanly, displayed each exact identity, and loaded the applicable Alpha
and Gamma dashboards with zero alert banners. Notifications was not opened and
FAD routes remained disabled, so their strict hosted gates were not exercised.

The shared staging QA password was then disclosed in chat and is treated as
compromised; its value is not recorded. Re-hold deploy
`dep-da4j4r49v7es738bkih0` started at `2026-08-22T05:23:57Z`. Second rotation
`HL-20260821-2` then replaced all nine synthetic release-QA credentials,
revoked zero active sessions, wrote receipt
`9152f844-d8cd-42f7-b0d5-b12f530ad618`, and replayed with zero writes. No
password value is recorded. Verified backup
`adcbbbab-e857-4cae-af71-dbce95553ce5` is the exact post-rotation/pre-fixture
strict sidecar restore point.

Netlify staging deploy `6a89709ffc9c88762ae8e74e` published exact frontend
build `0e8eee92...`. Backup `adcbbbab...` reverified immediately before strict
sidecar preparation with plaintext SHA `cf3ca07d...`, integrity `ok`, and zero
foreign-key violations. Preparation reported `writeCount: 744`, recorded
receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, and replayed with zero writes.

Controlled-unhold deploy `dep-da4pvcrl550s738l8rmg` reached `LIVE` and passed
its candidate gates, but strict smoke stopped after phase one. Manager A
reached required `null 2/1/1`; Manager B reached `complete 3/1/1` instead of
required `complete 2/1/1`. No return proposal or phase-two action ran. Sealed-
baseline Netlify deploy `6a8a09c13d5e25282f64d2c7` removed the temporary
same-cookie helper and its retired paths fail closed.

The full hold was restored and remains active. Strict abort recovery and exact
replay passed, and `DATABASE_PATH`-only target cutover deploy
`dep-da51hjvqj5pc73bh8g3g` is `LIVE` on exact backend
`23971a4d66ee6383c6ad54339e769dbc9a76561e` after passing `3,502/3,502` hosted
tests. Read-only temporary-copy target verification passed, as did post-cutover
backup `2044fcae-24e8-4392-a1ac-4064d9cd2807`. The release remains `BLOCKED`
and M7-26 remains `ACTIVE`; staging was not reopened, final jobs were not
restored, production remains untouched and unauthorized, and the plan was not
archived. Exact evidence is recorded in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-21.md`.

---

## 2026-08-18 Staging Release

The selected-team Free Agent Draft results, simplified Candidate Card history,
post-deadline auction nomination policy, restricted-tie manager privacy and
inline actions, and authoritative Players team filtering are deployed and
verified in staging on schema `52`. The release record is
`docs/07-testing/release-runs/FAD_AUCTIONS_PLAYERS_UX_2026-08-18.md`.

This release completed the M7-25 dependency sequence and its FAD-18 isolated
shared-staging gate. The exact frontend application commit is
`50f2414cdda5926942975577f70114b5868917a9`, the preserved frontend source head
is `2ba016c9d5e6b016a150a62da757f28a9c0140c0`, the backend commit is
`9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68`, the final Render deploy is
`dep-da2147e417fc73brkqmg`, and the final Netlify deploy is
`6a8420054c9c5a624d86b2c3`. M7-25 is archived, and M7-26 is the sole active
full-site UI-review plan.

Production was not changed and remains unauthorized for this release.

---

## 2026-08-20 M7-26 Candidate Baseline (Historical Pre-Release Snapshot)

M7-26 remains the sole active work plan. The current shared local backend tree
targets schema `54` with `54` migration files, `133` application tables and
repository-catalog entries, and `134` physical tables including
`schema_migrations`. The composed target runtime registers `123` routes. The
conceptual API catalogue contains `148` entries after T-147 notification batch
acknowledgement and T-148 trade approval; conceptual catalogue count and
composed runtime-route count are different measures.

The active local implementation is being reconciled to these boundaries:

* FAD results reveal selected-team player identity and Signed/Not won/Tied
  status to active members, but monetary, restricted-minimum, and audit detail
  only to that selected team's current manager;
* notification listing is read-only and the normal UI acknowledges exactly the
  captured displayed unread batch through T-147 after render;
* only the current proposing-team manager creates/cancels a trade and only the
  current receiving-team manager accepts/rejects it; commissioner authority is
  limited to safe inspection, T-148 Future-Considerations approval, and
  separate recovery; there is no implemented counter endpoint or service;
* standalone existing retention is rejected in new proposals while historical
  retention remains readable; normal standings correction is contextual and
  atomic while rebuild is recovery-only; and signed-Prospect decisions remain
  current-manager-only with IR legality/no-return and affected-trade
  cancellation; and
* every active platform administrator has a protected active `member`
  membership in every non-deleted league, and commissioner transfer changes the
  one canonical pointer and both roles atomically.

The signed-Prospect buyout/pending-`prospect_right`-trade cancellation gap is a
known staging limitation and separate P1 production-promotion follow-up outside
the contained M7-26 isolated-staging UI-review gate. The current command fails
atomically and leaves buyout/trade state unchanged, so there is no observed
partial-write risk; focused M7-26 prospect movement remains complete. T-074
remains `PLANNED`. At this dated snapshot, final M7-26 full-suite, browser,
dependency, staging migration/deploy, and hosted acceptance evidence had not
yet been recorded. The newer in-progress release section above supersedes that
execution status. Nothing in either section claims a production change.

Older implementation-state narratives and dated test/deployment records below
are retained as historical evidence. Where they describe JSON as the only
current local persistence, schema `49`/`52` as the current local target, 117
runtime contracts as the current inventory, complete Candidate Cards as
league-visible, or older M7 work as active, this dated M7-26 section and the
current canonical product/technical specifications govern the active tree.

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
* a complete frontend-and-backend staging release-candidate environment.

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
* `Pending Rollover` display after competition completion and automatic
  contract advancement/expiration at the persisted scheduled Entry Draft
  start;
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
* reopening trading only after the scheduled Entry Draft-start rollover
  succeeds atomically with draft start;
* SQLite transactions;
* stricter permission validation.

### Entry Draft

The current application does not contain the approved Entry Draft workflow.

The Entry Draft is not required for the initial Season 2 launch. It is planned for development during the season and must be complete before the first Season 2 Entry Draft is used.

There is currently no `T-108` selection/confirmed-forfeiture endpoint, Entry
Draft user interface, or standalone/manual Entry Draft completion route.
FAD-08 now supplies and proves only the shared internal, transaction-bound
readiness-handoff primitive that the future final T-108 transaction will call.
That completed primitive does not complete or pull forward the M8 Entry Draft
workflow.

The later implementation must include the approved four-round linear draft, lottery, current plus three future draft classes, live selections, private queues, automatic timeout selections, immutable completed picks, traded-pick clock resets, and league-scoped history.

The approved lottery uses every active non-finalist, two weighted draws without replacement, linear reverse-standings weights, fixed finalist positions, and one immutable order across all four rounds.

The approved normal eligibility pool contains F or D players selected in the most recently completed NHL Entry Draft, plus the approved immediately-prior Hundo Leago rights-release re-entry. Goalies are excluded.

### Buyouts

The current application supports player buyouts and buyout penalties.

Current buyout calculations have been used successfully, but they do not yet prove compliance with the approved Season 2 rule.

Season 2 buyouts must eliminate the contract, release the player to free agency, and charge 25% of full underlying average annual value in each remaining contract year without penalty decay.

Existing retention obligations must continue unchanged after a buyout.

Auction and direct automatic FAD signings must have a 14-day buyout lock that
follows the player after a trade. Buying out a player must cancel pending
trades involving that player.

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

### Season 2 statistics authority clarification - 2026-08-11

Every player begins Season 2 with exactly zero games played, goals, assists,
NHL points, and fantasy points. Existing 2025-26 SportsDataIO rows may remain
as migration, source, or historical evidence, but they are not the Season 2
scoreboard and must not populate current-season FAD, Entry Draft, roster,
matchup, or standings projections.

This is the approved Season 2 semantic baseline, not a claim that the current
global player API or frontend already implements season-explicit zero
projection. Current global player reads still expose labelled last-season data;
after a completed game is due for refresh, missing current-season data must
remain unavailable or stale rather than being silently reported as zero.

The FAD and Entry Draft need the persisted player catalogue—stable player ID,
display name, effective position, and applicable eligibility state—not player
statistics. A paid SportsDataIO live key, probe manifest, live observation, or
signed capability artifact is therefore no longer a FAD-18 prerequisite.

Season 2 does not require in-game statistic updates. The approved product
direction is provider-neutral completed-game cumulative refresh, scheduled four
times each evening as in Season 1. The provider choice, exact clock times,
and revised late-lock/scoring evidence design remain a separate matchup/
statistics implementation slice. For the preseason FAD-only staging candidate,
the shared `matchup_occurrences` runner is intentionally disabled in full:
statistics refresh, baseline, normal lock, finalization, and matchup-week rollover
occurrences do not run. FAD, Entry Draft, auction, trade, and outbox jobs remain
available subject to their own gates. The current SportsDataIO live adapter is
also disabled and is not part of FAD acceptance. A future provider-neutral
matchup/statistics slice must restore or split the runner deliberately.

The current Players and related roster/player presentation still contains
clearly labelled last-season statistics and fantasy-points-first sorting. That
is legacy/deferred historical presentation, not current-season authority. A
separate frontend slice must prevent those rows from being mistaken for Season
2 totals; this documentation change does not claim that UI work is complete.

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

A behaviour-preserving refactor and the M2 SQLite foundation are
complete on the backend branch:

```text
staging
```

The completed structure includes explicit boundaries under:

```text
src/bootstrap/
src/config/
src/domain/
src/application/services/
src/infrastructure/
src/jobs/
src/operations/
src/transport/http/routes/
src/validators/
```

The two imported root compatibility route adapters and the root league-store adapter remain intentionally temporary:

```text
routes/healthRoutes.js
routes/leagueReadRoutes.js
leagueStore.js
```

Backend-refactor work item `BR-00`, the Baseline and Safety Harness, is complete in backend commit:

```text
aa0718d Add BR-00 backend safety harness
```

The committed harness adds Node built-in characterization tests, handcrafted fixtures, isolated operating-system temporary runtimes, exact endpoint-inventory proof, read-only tree-hash proof, current league-store characterization, and bounded child-server cleanup.

Post-commit verification on 2026-07-18 passed 16 of 16 focused characterization tests and 24 of 24 complete Node test entries. The endpoint inventory remained 34 total, six conditional matchup-debug routes, and 28 non-debug routes. Syntax, whitespace, protected repository JSON hash, and child-process cleanup checks also passed.

The refactor and M2 foundation are committed and pushed to
`origin/staging` at
`734c52f865e1407dcd21fcc9ffa891ca4c022fb2`. That exact commit is
deployed only to the dedicated Render staging service. It is not merged
to or deployed from production `main`.

Root `server.js` is now a 50-line lifecycle entrypoint. Route definitions, services, pure domain calculations, JSON repositories, scheduled jobs, external adapters, configuration, operations, validators, Socket.IO compatibility publishing, and feature composition have explicit module boundaries.

The refactor preserves current compatibility behavior. It does not claim that current behavior already satisfies the approved Season 2 target rules or security model.

The approved Architecture, Data Model, API Contracts, Backend Refactor, SQLite Migration, Security, Frontend Structure, Environment Setup, Deployment, and Backup and Restore specifications now define the target modular-monolith, SQLite, transaction, identity, league-isolation, history, job, API, compatibility, extraction, migration, authentication, application-security, frontend, hosting-environment, release, and recovery boundaries.

The API review identified 34 current route registrations, including six conditional matchup-debug routes. All route definitions now have explicit route-module ownership, and root `server.js` owns none. The approved 14-stage Backend Refactor sequence from the Step 0 safety harness through the Step 13 completion gate is complete locally.

The SQLite Migration specification selects Node 24.14.1 and exact `better-sqlite3` 12.11.1, deterministic copied-JSON import, explicit reset manifests, verified backups, a maintenance-window cutover, and no dual-write period. The Security specification selects Node `scrypt`, opaque server-side sessions, session-bound CSRF, exact credentialed CORS, durable rate limits, backend-derived authorization, and separate append-only security audit.

The approved Active Roadmap defines dependency-ordered milestones from
the canonical foundation through initial launch, required in-season
completion, and deferred work. Milestone M1 is complete: `BR-00`
through `BR-13` passed their gates. Milestone M2 is also complete:
`M2-01` through `M2-14` and the external staging gate passed. Milestone
M3 is complete locally. `M3-01` is complete on the focused frontend
branch. The shipped credential list, browser password comparison,
local-storage identity, browser actor claims, old login UI, and
unguarded compatibility writes were removed or made fail-closed. The
focused verifier, repository-wide lint, production build, isolated
connected-browser visual and interaction checks, GET-only network
timeline, anonymous reload, Socket.IO invalidation, complete backend
suite, and protected-hash gates all passed. `M3-02` is also complete
locally. It added validated security configuration, an injectable UTC
clock, Node-crypto randomness, immutable bootstrap composition, and
secret-redacted structured logging foundations. Its focused suite
passed `15/15`, the cumulative foundation suite passed `104/104`, and
the complete backend suite passed `276/276`. `M3-03` is also complete
locally. It added the exact password policy, bounded asynchronous Node
`scrypt`, safe user and isolated credential repositories, atomic
credential replacement, and authority-free test-account creation. Its
focused suite passed `15/15`, the combined security suite passed
`30/30`, the cumulative foundation suite passed `119/119`, and the
complete backend suite passed `292/292`. `M3-04` is also complete
locally. It added opaque independent session and CSRF secrets,
digest-only session persistence, one-active-session replacement,
absolute and idle expiry, bounded activity refresh, revocation, and
safe local and deployed cookie transport. Its focused suite passed
`17/17`, the combined security suite passed `47/47`, the cumulative
foundation suite passed `136/136`, and the complete backend suite
passed `309/309`. On 2026-07-20 Grae approved stable versioned
HMAC-SHA-256 CSRF derivation from each opaque random session token so
reloads and multiple tabs work without recoverable CSRF storage or a
bootstrap write. `M3-05` is complete locally. Exact origin
configuration, stable derived CSRF bootstrap, constant-time unsafe
verification, credentialed CORS, bounded preflight, JSON and Fetch
Metadata enforcement, and API security headers passed `5/5` focused,
`39/39` combined security, `143/143` cumulative foundation, and
`316/316` complete backend tests. `M3-06` is complete locally.
Purpose-bound opaque tokens, digest-only single-use transitions,
append-only Security Audit, keyed privacy digests, and durable
authentication rate limits passed `8/8` focused, `62/62` combined
security, `151/151` cumulative foundation, and `324/324` complete
backend tests. On 2026-07-20 Grae approved M3-07 option 1, and M3-07 is now
complete locally. Atomic pending registration, 24-hour email verification,
AES-256-GCM encrypted action-link outbox delivery, retry and interrupted
claim recovery, terminal payload clearing, resend replacement, automatic
initial session creation, target HTTP envelopes, exact request security,
and generic public behavior passed `18/18` focused, `80/80` combined M3
account/security, `169/169` cumulative foundation, and `342/342` complete
backend tests under Node `24.14.1`. The initial migration, package lock,
protected JSON, compatibility route inventory, and runtime registration
remain unchanged. `M3-08` is complete locally. Credential authentication,
sign-in, sign-out, read-only session bootstrap, password change and reset,
self-deactivation and reactivation, encrypted reset/reactivation delivery,
notifications, atomic rollback, replay, expiry, concurrency, and isolated
HTTP contracts passed `50/50` focused regression, `116/116` combined M3
account/security, `205/205` cumulative foundation, and `378/378` complete
backend tests under Node `24.14.1`. `M3-09` is complete locally. Its
one-time first-platform-administrator command, pending credential setup,
forward-only migration `0002`, encrypted 72-hour setup delivery, permanent
self-refusal, password completion, rollback, replay, expiry, concurrency,
and isolated HTTP contracts passed `14/14` focused, `130/130` combined M3
account/security/migration/bootstrap, `219/219` cumulative foundation, and
`392/392` complete backend tests under Node `24.14.1`. `M3-10` is complete
locally. Backend-derived platform-administrator authorization, atomic
administrative league creation, planned current season, fixed settings,
League Activity, Security Audit, scoped idempotency, exact replay, conflicts,
simultaneous submissions, rollback, and isolated HTTP contracts passed
`18/18` focused, `148/148` combined M3, `237/237` cumulative foundation,
and `410/410` complete backend tests under Node `24.14.1`. `M3-11` initial
commissioner proposal, acceptance, and active membership is complete. Its
policy, specialized SQLite repository, atomic proposal/read/accept/decline
service, notification and dual-audit evidence, idempotency, eligibility and
ownership revalidation, rollback seams, simultaneous terminal action, and
isolated HTTP contracts passed `16/16` focused, `164/164` combined M3,
`253/253` cumulative foundation, and `426/426` complete backend tests under
Node `24.14.1`. `M3-12` league-scoped authorization and authenticated
read-only league visibility is complete. Its SELECT-only repository,
backend-derived active-member and current-commissioner authority, two-league
safe projections, full database immutability checks, and isolated GET HTTP
contracts passed `10/10` focused, `174/174` combined M3, `263/263` cumulative
foundation, and `436/436` complete backend tests under Node `24.14.1`.
`M3-13` authenticated user and league Socket.IO rooms is complete. Its
read-only session resolution, exact Origin and cookie authentication,
backend-derived user and league rooms, current-state reauthorization, safe
disconnection, full-database immutability checks, and metadata-only
invalidation boundary passed `15/15` focused, `190/190` combined M3,
`279/279` cumulative foundation, and `452/452` complete backend tests under
Node `24.14.1`. `M3-14` team-scoped manager authorization and authenticated
team Socket.IO rooms is complete. Its SELECT-only authority repository, exact
current-manager checks, multi-team support, team-room reauthorization, and
full-database immutability checks passed `7/7` focused, `197/197` combined M3,
`286/286` cumulative foundation, and `459/459` complete backend tests under
Node `24.14.1`. `M3-15` Option 1 is complete locally. Its immutable schema
migration, explicit `create_team` and `manage_team` invitation intent,
commissioner-authorized creation, invited-user safe read, atomic acceptance,
decline without authority, notification, League Activity, Security Audit,
idempotency, and isolated HTTP contracts passed `17/17` focused, `214/214`
combined M3, `303/303` cumulative foundation, and `476/476` complete backend
tests. `M3-16` authenticated team reads and commissioner-only Setup team
creation is complete locally. SELECT-only member reads and atomic direct team
creation passed `9/9` focused, `223/223` combined M3, `312/312` cumulative
foundation, and `485/485` complete backend tests. `M3-17` active-member team
manager assignment, transfer, acceptance, decline, and removal is complete
locally. Its additive transfer-intent migration, atomic service, and isolated
HTTP boundary passed `11/11` focused, `234/234` combined M3, `323/323`
cumulative foundation, and `496/496` complete backend tests. `M3-18` team
profile representation, safe logo storage, and versioned mutation is complete
locally. Its additive logo-object migration, dependency-free raster policy,
atomic service, safe team representation, binary read, and isolated HTTP
boundary passed `16/16` focused, `250/250` combined M3, `339/339` cumulative
foundation, and `512/512` complete backend tests. `M3-19` local target-runtime
composition and API integration is complete locally. Its exact 36-endpoint
dispatcher, explicit SQLite ownership, full account/league/team composition,
authenticated Socket.IO attachment, integrated workflows, and failure-safe
resource lifecycle passed `21/21` focused, `271/271` combined M3, `360/360`
cumulative foundation, and `533/533` complete backend tests. `M3-20` account
and league-selection frontend integration is complete with `57/57` frontend
tests, `533/533` backend tests, lint, build, and the connected ordinary-Chrome
gate passing. `M3-21` provider-backed account email and required notifications
is complete with `12/12` focused provider/rendering/job tests and `546/546`
complete backend tests. The M3 completion gate passed.
Nothing was deployed, merged, or changed in production.

`BR-01` extracted current compatibility configuration and process lifecycle. `BR-02` extracted player JSON access, normalization, indexing, search, reload, and compatibility routing. The stale player-cache reference defect is corrected: startup and reload now update the route-visible service cache. BR-02 verification passed 42 of 42 characterization tests and 50 of 50 complete Node test entries while preserving player source hashes and the 34/6/28 route inventory.

`BR-03` moved statistics cache access, refresh orchestration, provider access, lock handling, atomic cache replacement, refresh token compatibility checks, and statistics routes behind repository, service, NHL adapter, and router boundaries. Verification passed 57 of 57 characterization tests and 65 of 65 complete Node test entries. Failed refreshes preserved the last valid cache, statistics refresh never changed league state, the route inventory remained 34/6/28, and no live NHL request occurred.

`BR-04` extracted snapshot and backup listing, creation, and restore operations behind dedicated operation, repository, and compatibility-router boundaries. Verification passed 72 of 72 characterization tests and 80 of 80 complete Node test entries while preserving protected JSON hashes and the 34/6/28 route inventory. Current traversal, path disclosure, public exposure, body-supplied role, and write-queue defects remain documented and blocked pending the approved Security or later focused reliability work.

`BR-05` extracted Pacific-time schedule construction, round-robin pairing, weekly scoring, standings calculation, current-week/status reads, and matchup read routing. Verification passed 86 of 86 characterization tests and 94 of 94 complete Node test entries, including spring/fall daylight-saving fixtures, scoring baselines, standings sorting, complete matchup-read tree hashes, protected JSON hashes, and the 34/6/28 route inventory.

`BR-06` extracted schedule generation, one-week updates, shift-from behavior, and compatibility commissioner-role checks. Verification passed 98 of 98 characterization tests and 106 of 106 complete Node test entries. Current odd-team rejection, future-only editing, non-production force behavior, overlap validation, save-before-event ordering, protected JSON hashes, the 34/6/28 route inventory, and current response contracts were preserved.

`BR-07` extracted roster-lock, baseline-capture, weekly-finalization, and rollover jobs into fixed-clock, awaited, overlap-guarded definitions and composed them through an explicit ordered scheduler boundary. Verification passed 119 of 119 characterization tests and 127 of 127 complete Node test entries. Duplicate, restart, missing-statistics, invalid-state, save-failure, event-failure, scheduler-overlap, accelerated-week, no-double-advance, and failed-finalization gates passed.

`BR-08` extracted the current compatibility auction resolver, auction-resolution service and job, and automatic weekly-snapshot job while documenting their intentional differences from the approved Season 2 Auctions target. Verification passed 133 of 133 characterization tests and 141 of 141 complete Node test entries. No-bid, single-bid, multiple-bid, amount-tie, missing-team, buyout-lock, activity, exact-boundary, duplicate, restart, overlap, save-failure, event-failure, and one-snapshot-per-occurrence gates passed.

`BR-09` extracted the broad `POST /api/league` compatibility write behind explicit validation, service, and router boundaries without generalizing it for new features. Verification passed 145 of 145 characterization tests and 153 of 153 complete Node test entries. Freeze, wipe, required-array, optional-matchup, commissioner, manager, server-owned-field preservation, save-failure, event-failure, response-contract, protected-hash, and 34/6/28 route-inventory gates passed.

`BR-10` adapted the root league store into an explicit JSON league repository while preserving normalization, queued writes, atomic replacement, backup, schema, list, restore, and compatibility behavior. Verification passed 149 of 149 characterization tests and 157 of 157 complete Node test entries. The focused persistence gate passed 48 of 48 tests, the route inventory remained 34/6/28, and protected JSON and package-manifest hashes remained unchanged.

`BR-11` restored explicit Socket.IO attachment and compatibility invalidation delivery, including safe HTTP behavior when Socket.IO is unavailable. Verification passed 152 of 152 characterization tests and 160 of 160 complete Node test entries. One attached Socket.IO instance, one connection handler, commit-before-event delivery, failure suppression, compatibility CORS, frontend one-refetch lifecycle, protected hashes, and the 34/6/28 route inventory were verified.

`BR-12` removed the remaining debug route handlers and feature composition from root `server.js`, leaving startup and shutdown wiring only. Verification passed 160 of 160 characterization tests and 168 of 168 complete Node test entries. Root `server.js` is 50 lines with zero route handlers, feature imports, or filesystem calls. All 34 routes remain, the six debug routes remain flag-guarded, and protected hashes remain unchanged.

`BR-13` completed the final behavior-preserving refactor gate. The focused architecture and evidence run passed 61 of 61 tests, the final characterization suite passed 164 of 164 tests, and the complete Node suite passed 172 of 172 test entries. Thin-root, explicit-boundary, exact API, read-only tree-hash, accelerated matchup-week, persistence isolation, protected-data, known-gap ownership, and JSON-adapter replaceability gates passed.

The approved Testing Strategy now defines backend, frontend, browser, security, database, migration, job, recovery, staging, release, and production-smoke evidence. The approved Frontend Structure selects TanStack Query for server state, one shared HTTP client, one Socket.IO lifecycle, URL-derived stable league context, feature modules, and an incremental `FE-00` through `FE-11` extraction from the current large `App.jsx`.

The approved Environment Setup defines isolated local, test, staging, and production resources, exact frontend and backend configuration contracts, Node `24.14.1`, a one-instance Render SQLite topology, fail-closed environment identity, and separate Netlify, Render, disk, database, secret, user, email, and backup boundaries.

The approved Backup and Restore specification selects application-consistent SQLite backup, verified AES-256-GCM-encrypted offsite artifacts, hourly in-season and daily off-season protection, platform-administrator restore execution, post-restore session and token revocation, job and outbox reconciliation, and mandatory staging drills.

The approved Deployment specification selects CI-gated staging, manual production publication of exact commits, compatibility-first backend and frontend ordering, explicit migrations, read-only production smoke, release records, first-write rollback boundaries, and separate code, configuration, and database recovery.

The approved Backend Endpoint Checklist tracks all 34 current route
registrations and all 144 approved target routes, including 19 dedicated FAD
routes, with permanent IDs and evidence gates for characterization, contract
tests, frontend connection, staging, production verification, and compatibility
retirement.

The approved Manual QA Checklist defines repeatable release-candidate acceptance across desktop, mobile, keyboard, accessibility, roles, two leagues, feature workflows, failures, reconnect, recovery, defect handling, and retest. The approved Release Checklist defines hard go/no-go gates from exact source commits through production authorization, read-only smoke, monitoring, rollback, and closeout.

These specifications and checklists are approved design, not evidence that the target Season 2 implementation, migration, authentication system, environment infrastructure, deployment pipeline, recovery tooling, target endpoint catalogue, QA run, or release approval is complete. The behavior-preserving backend refactor sequence itself is complete locally.

---

## Current Local Development State

### Frontend

The canonical frontend workspace is:

```text
E:\hundo-leago
```

Current local candidate work is on:

```text
m3-01-browser-authority
```

The committed head is:

```text
8ff255348a10039eb9e3e4c72da3be570c6b1860
```

The complete M2-M7 frontend candidate remains preserved as an unfrozen dirty
worktree and is not represented by that committed head.

### Backend

The canonical backend workspace is:

```text
E:\hundo-leago-backend
```

Current backend candidate work is on:

```text
staging
```

The branch is synchronized with `origin/staging` at:

```text
734c52f865e1407dcd21fcc9ffa891ca4c022fb2
```

The complete M2-M7 backend candidate remains preserved as an unfrozen dirty
worktree and is not represented by that committed head.

On `2026-07-24`, the legacy `C:\Users\graem\Desktop\...` copies were compared
with the canonical E-drive workspaces across 726 relevant non-generated files.
The compared files, branches, committed heads, and dirty-state inventories
matched. The C-drive copies are not development, candidate, staging, or
production inputs.

Backend-refactor items `BR-00` through `BR-13`, M2 items `M2-01`
through `M2-14`, and the external M2 staging gate are complete. Their
exact plans and evidence are recorded under
`docs/06-work-plans/archive/`.

The final M2 gate used a dedicated protected Render staging environment,
service, and persistent disk. The exact staging commit passed a clean
build and `261/261` backend tests. Two real-disk imports, independent
verifications, and recovery rehearsals passed without switching
application authority.

This staging publication is not evidence that the work exists on
production `main`. Production was not deployed, migrated, reset, or
switched to SQLite.

---

## Automated Testing

The backend now has an initial automated characterization foundation, but the project does not yet have enough automated test coverage to safely verify all core league behaviour.

The committed BR-00 foundation currently covers:

* the exact 34/6/28 compatibility endpoint inventory;
* current root-server startup against copied synthetic state;
* all current GET routes leaving the complete temporary runtime tree unchanged;
* current league-store load, normalization, save, backup, restore, queue, and atomic-rename failure behavior;
* importable fixed-clock and fake-publisher test seams;
* bounded child-process cleanup.

Completed BR-01 coverage additionally proves:

* current compatibility configuration defaults and coercion;
* current Express and Socket.IO CORS decisions;
* application and transport construction without listening;
* explicit temporary-path dependency composition;
* tracked interval cleanup;
* bounded, idempotent HTTP and Socket.IO shutdown;
* removable SIGINT and SIGTERM handlers.

Completed BR-02 coverage additionally proves player normalization, active search, endpoint limits and errors, route order, reload visibility, and unchanged player-file hashes.

Completed BR-03 coverage additionally proves statistics cache reads, one-player lookup, debug behavior, refresh-token handling, NHL paging, refresh locking, minimum-count rejection, atomic replacement, shared HTTP/CLI orchestration, last-valid-cache preservation, and unchanged league-state hashes.

Completed BR-04 coverage additionally proves recovery listing hashes, snapshot naming and contents, successful restore hashes and activity, missing/malformed restore immutability, repository delegation, current traversal behavior, and temporary-fixture-only recovery.

Completed BR-05 coverage additionally proves explicit-time and timezone schedule calculations, daylight-saving boundaries, round-robin compatibility, weekly scoring baselines and diagnostics, standings results and tie breakers, read-service immutability, matchup response contracts, and complete read-only tree hashes.

Completed BR-06 coverage additionally proves schedule generation and reset semantics, one-week future editing, development-only forced editing, Pacific calendar shifts, ordering and neighbor-overlap validation, failed-command immutability, save-before-event ordering, and compatible command responses.

Completed BR-07 coverage additionally proves fixed-clock matchup job boundaries, awaited saves and event attempts, per-job and per-cycle overlap guards, durable compatibility markers, exact time boundaries, duplicate and restart behavior, missing-statistics safety, accelerated weekly execution, one-cycle advancement, and finalization-before-rollover gating.

Completed BR-08 coverage additionally proves pure compatibility auction projection, current numeric bid ranking and earliest tie-breaking, current missing-team and bid-removal behavior, roster ordering, 14-day buyout locks, leading activity, Sunday Pacific occurrence IDs, one resolved auction cycle and weekly snapshot per marker, awaited persistence, overlap guards, retries, and commit-before-event ordering.

Completed BR-09 coverage additionally proves ordered freeze, wipe, required-array, and optional-matchup validation; manager and commissioner projections; preservation of backend-owned fields and automatic markers; one load and one save; save-before-event ordering; current success and error mapping; generic failure behavior; and dedicated compatibility-router ownership.

Completed BR-10 coverage additionally proves direct JSON repository construction, explicit and compatibility save methods, independent single-writer queues, legacy store delegation, missing and malformed source behavior, normalization, atomic rename failure safety, pre-write backups, deterministic pruning, list and restore behavior, and repository composition with no route-level concrete adapter import.

Completed BR-11 coverage additionally proves explicit Socket.IO application attachment, exactly one connection handler, unchanged Socket.IO and HTTP CORS decisions, one compatibility invalidation after a committed save, no invalidation after save failure, safe HTTP success without Socket.IO, root publisher composition, transport shutdown, and the existing frontend's guarded one-listener, one-refetch, reconnect, and cleanup lifecycle.

Completed BR-12 coverage additionally proves all six debug-route contracts and their disabled state, commissioner guards, state summaries, reset semantics, manual job responses, placeholder normalization, commit-before-event ordering, error mapping, explicit compatibility-runtime construction, idempotent snapshot-then-auction-then-matchup startup, thin-root source structure, route-source ownership, and unchanged full behavior.

Completed BR-13 coverage additionally proves dependency direction across domain, services, routes, and jobs; explicit ownership for every compatibility endpoint; constrained concrete-adapter selection; all five replaceable JSON repository boundaries; the complete 61-test final evidence matrix; and unchanged full compatibility behavior across 172 Node test entries.

Completed M2 coverage additionally proves the exact Node and SQLite
runtime, migration ledger and checksums, strict schema, SQLite repository
contracts, portable copied-source inventory, approved reset manifest,
deterministic IDs and transforms, dry-run and persistent imports,
reconciliation, backup, clean restore, independent semantic
verification, and cutover/rollback rehearsal. The final exact-runtime
suite passed `261/261` tests across `55` suites.

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

The target topology and configuration are documented in
`docs/04-technical-specs/ENVIRONMENT_SETUP.md`. A dedicated backend
staging environment now exists on Render:

* protected, network-isolated environment
  `evm-d9eo1v3rjlhs73cpujvg`;
* service `srv-d9eo2turnols73ekb830` on branch `staging`;
* separately attached disk `dsk-d9eo2u6rnols73ekb8t0`;
* staging-only paths, secret values, and `hundo-leago/staging` backup
  prefix;
* jobs, backup scheduling, debug routes, matchups, snapshots, and
  auctions disabled.

The exact staging commit
`734c52f865e1407dcd21fcc9ffa891ca4c022fb2` is healthy. M2 ran two
complete current-data import, independent verification, backup, restore,
cutover, and rollback rehearsals on the real staging disk. JSON remains
application authority.

A staging Netlify frontend, test accounts, test leagues, and functional
encrypted offsite backup target have not yet been established. The
offsite endpoint and bucket remain nonfunctional staging placeholders,
and backup scheduling is disabled.

Current development has used:

* local frontend and backend servers;
* OS-temporary SQLite migration roots;
* the dedicated Render backend staging service and disk;
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

1. The completed M1 refactor and M2 SQLite migration foundation are
   published to `origin/staging` and deployed only to the dedicated
   staging service; they are not on production `main`.
2. Mutable league data still uses file-backed JSON.
3. Secure accounts, permissions, leagues, teams, memberships, account/league
   frontend integration, and provider email are complete locally through the
   M3 gate but remain isolated from production authority and are not deployed.
4. Existing compatibility feature workflows are not yet converted to the
   completed league-scoped target authority.
5. Contracts are not yet complete for the new season model.
6. Existing features are not yet scoped by league.
7. The backend has a 725-test exact-runtime suite and the M3 frontend/browser
   gates pass, but broader feature and integrated release-candidate coverage
   remains incomplete.
8. Dedicated backend staging exists, but staging frontend, test users,
   test leagues, and full integrated release-candidate workflows remain
   incomplete.
9. SQLite backup, clean restore, and rollback are verified on the
   staging disk, but encrypted offsite upload and offsite restore remain
   unverified.
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

1. Complete M7-07 integrated local release rehearsal, browser verification,
   recovery drills, and hosted-staging preflight without touching hosted state.
2. Keep production reset, migration, deployment, and job startup blocked until
   Grae gives explicit authority for their exact scope.
3. Complete staging frontend, test identities, offsite backups, release
   procedures, and launch testing through bounded M7 steps.

Architecture, Data Model, API Contracts, Backend Refactor, SQLite
Migration, Security, Frontend Structure, Environment Setup, Deployment,
Testing Strategy, Backend Endpoint Checklist, Manual QA Checklist,
Release Checklist, Backup and Restore, Active Roadmap, and Active Work
Plan are approved. Backend-refactor work items `BR-00` through `BR-13`
and Milestones M1, M2, and M3 are complete. `M3-01` is
complete locally with its focused verifier, full lint, build, isolated
connected-browser, GET-only network, anonymous-reload, Socket.IO,
backend, and protected-hash evidence passing. The exact `M3-02` plan is
complete with `15/15` focused, `104/104` cumulative foundation, and
`276/276` complete backend tests passing. `M3-03` is complete with
`15/15` focused, `30/30` combined security, `119/119` cumulative
foundation, and `292/292` complete backend tests passing. `M3-04` is
also complete locally. Its opaque session secrets, digest-only SQLite
repository, lifecycle service, one-active-session replacement, expiry,
revocation, refresh, and cookie transport foundations passed `17/17`
focused, `47/47` combined security, `136/136` cumulative foundation,
and `309/309` complete backend tests. Grae selected stable versioned
HMAC-SHA-256 derivation from the opaque random session token for
reload-safe and multi-tab-safe CSRF bootstrap. `M3-05` is complete with
`5/5` focused, `39/39` combined security, `143/143` cumulative
foundation, and `316/316` complete backend tests passing. `M3-06` is
complete with `8/8` focused, `62/62` combined security, `151/151`
cumulative foundation, and `324/324` complete backend tests passing.
`M3-07` is complete with `18/18` focused, `80/80` combined security,
`169/169` cumulative foundation, and `342/342` complete backend tests.
`M3-08` is complete with `50/50` focused regression, `116/116` combined
security, `205/205` cumulative foundation, and `378/378` complete backend
tests. `M3-09` is complete with `14/14` focused, `130/130` combined M3,
`219/219` cumulative foundation, and `392/392` complete backend tests.
`M3-10` is complete with `18/18` focused, `148/148` combined M3,
`237/237` cumulative foundation, and `410/410` complete backend tests.
`M3-11` is complete with `16/16` focused, `164/164` combined M3,
`253/253` cumulative foundation, and `426/426` complete backend tests.
`M3-12` is complete with `10/10` focused, `174/174` combined M3,
`263/263` cumulative foundation, and `436/436` complete backend tests.
`M3-13` is complete with `15/15` focused, `190/190` combined M3,
`279/279` cumulative foundation, and `452/452` complete backend tests.
`M3-14` is complete with `7/7` focused, `197/197` combined M3,
`286/286` cumulative foundation, and `459/459` complete backend tests.
`M3-15` is complete with `17/17` focused, `214/214` combined M3, `303/303`
cumulative foundation, and `476/476` complete backend tests. `M3-16` is
complete with `9/9` focused, `223/223` combined M3, `312/312` cumulative
foundation, and `485/485` complete backend tests. `M3-17` is complete with
`11/11` focused, `234/234` combined M3, `323/323` cumulative foundation, and
`496/496` complete backend tests. `M3-18` is complete with `16/16` focused,
`250/250` combined M3, `339/339` cumulative foundation, and `512/512` complete
backend tests. `M3-19` is complete with `21/21` focused, `271/271` combined M3,
`360/360` cumulative foundation, and `533/533` complete backend tests. `M3-20`
account and league-selection frontend integration is complete with `57/57`
frontend tests, `533/533` backend tests, lint, build, and the connected
ordinary-Chrome gate passing. `M3-21` provider-backed account email and
required notifications is complete with `12/12` focused tests and `546/546`
complete backend tests. The M3 completion gate passed. M4-01 global player
identity and provider identifiers is complete locally: its focused suite passed
`7/7`, its M4-01 plus M2 schema/repository suite passed `22/22`, and the
complete backend suite passed `553/553` under Node `24.14.1`. It reuses the
existing M2 player schema without a migration, endpoint, provider, or authority
cutover. M4-02 league-scoped position corrections and ownership reads is also
complete locally: its focused suite passed `7/7`, its M4-01/M4-02/M2/M3
compatibility suite passed `39/39`, and the complete backend suite passed
`560/560` across 140 suites under Node `24.14.1`. It adds atomic current F/D
correction replacement and immutable league-scoped ownership reads without an
ownership writer, migration, endpoint, roster-category behavior, provider, or
authority cutover. M4-03 roster categories and slot assignment is complete
locally with `6/6` focused and `566/566` complete backend tests passing under
Node `24.14.1`. M4-04 roster movement persistence and structural legality is
complete locally with `7/7` focused and `573/573` complete backend tests
passing. Grae selected the approved rounded-AAV representation for M4-05:
original total remains exact while AAV is stored independently to the nearest
cent. M4-05 is complete locally with `9/9` focused, `72/72` cumulative, and
`582/582` complete backend tests passing under Node `24.14.1`. The bounded
M4-06 fantasy ELC signing and prospect-rights decline is complete locally with
`10/10` focused and `592/592` complete backend tests passing. The bounded M4-07
retained-salary and yearly-obligation work is complete locally with `7/7`
focused and `599/599` complete backend tests passing. The bounded M4-08 buyout,
contract-elimination, release, and yearly-penalty work is complete locally with
`7/7` focused and `606/606` complete backend tests passing. The bounded M4-09
authoritative team-cap calculation is complete locally with `5/5` focused and
`611/611` complete backend tests passing. The bounded M4-10 approved public
roster projection is complete locally with `5/5` focused, `106/106` cumulative,
and `616/616` complete backend tests passing. The bounded M4-11 commissioner
roster and contract correction foundation is complete locally with `9/9`
focused, `114/114` cumulative, and `625/625` complete backend tests passing.
The bounded M4-12 frontend roster, contract, and cap integration is complete
locally with `5/5` focused public-roster tests, `119/119` cumulative M4
foundation tests, `630/630` complete backend tests, and `61/61` complete
frontend tests passing. The M4 milestone gate is complete locally. M5-01 is the
first complete M5 slice with `10/10` focused, `138/138` cumulative M4/M5,
and `640/640` complete backend tests passing. It adds the nullable auction-
lifecycle timestamp and atomic auction-plus-opening-bid foundation. M5-02 is
complete locally with `18/18` focused, `81/81` migration and target-runtime
regression, and `658/658` complete backend tests passing. It adds schema version
`10`, atomic sealed bid submission and editing, blind commissioner
administration, assigned-manager own-bid reads, and five isolated target auction
routes. M5-03 is complete locally with `16/16` focused, `65/65` auction and
target-runtime regression, and `674/674` complete backend tests passing. It
adds deterministic resolution and anti-bluff decisions, SELECT-only candidate
loading, historical submission-authority validation, and durable leased job
coordination without persisting a winner or starting a scheduler. M5-04 is
complete locally with `57/57` focused completion/resolution/runtime tests,
`688/688` complete backend tests, and `296/296` JavaScript syntax checks passing
under Node `24.14.1`. It adds schema version `11` and one idempotent atomic
winner/no-winner/cancellation transaction spanning future planned seasons,
contract years, the 14-day buyout lock, ownership and Active assignment,
general-illegality evidence, authenticated signing activity, terminal auction
history, and metadata-only outbox invalidation. Exact replay is write-free and
late failure rolls every effect back. M5-05 is complete locally with `29/29`
focused trade/runtime tests, `696/696` complete backend tests, `4/4` runtime-
declaration tests, and `300/300` JavaScript syntax checks passing under Node
`24.14.1`. It adds exact two-team, current-season, Entry-Draft-open, 168-hour,
trade-deadline, manager/commissioner, freeze, league-member visibility, and
independent simultaneous-preview policy with SELECT-only SQLite projections.
It persists no trade or asset and performs no expiry-on-read. M5-06 is complete
locally with `40/40` focused trade/runtime tests, `707/707` complete backend
tests across 181 suites, `4/4` runtime-declaration tests, and `305/305`
JavaScript syntax checks passing under Node `24.14.1`. It adds schema version
`12`, strict typed trade assets, immutable proposal snapshots, creating-actor
and effective-deadline evidence, exact idempotency, and one immediate atomic
pending-proposal transaction. Every approved asset family, requested-retention
preview, independent simultaneous offers, replay/conflict, and late rollback
passed without reserving or transferring source assets. M5-07 is complete
locally with `58/58` focused trade/schema/runtime tests, `725/725` complete
backend tests across 185 suites, and `311/311` JavaScript syntax checks passing
under Node `24.14.1`. It adds exact receiver rejection, proposer cancellation,
explicit commissioner handling during a freeze, exact-deadline closure, durable
leased expiry without expiry-on-read, and a byte-for-byte read-only acceptance
preflight. The preflight revalidates every typed asset from current state and
projects current cap, roster, retention-slot, and approved general-illegality
evidence without accepting, reserving, or transferring anything. M5-08 is
complete locally with `83/83` focused trade, schema, import, cutover, and
runtime tests, `734/734` complete backend tests across 188 suites, and `315/315`
JavaScript syntax checks passing under Node `24.14.1`. It adds schema version
`13` and one idempotent immediate transaction that repeats acceptance
validation, transfers every approved typed asset with unchanged terms and
complete history, represents approved unplaced normal-roster results
explicitly, completes the proposal, and automatically cancels other pending
proposals made stale by the transferred identities. Exact replay is write-free
and late failure rolls every effect back. M5-09 is complete locally with
`74/74` focused activity, notification, outbox, auction, trade, and runtime
tests, `740/740` complete backend tests across 193 suites, and `326/326`
JavaScript syntax checks passing under Node `24.14.1`. It adds safe atomic
auction and trade activity, metadata-only transactional outbox evidence,
deterministic league-member activity reads, owner-only notification reads and
explicit acknowledgement, retry-safe post-commit Socket.IO publication, and
the four approved target HTTP routes. No auction or trade email, push, or
separate notification row is created. M5-10 is complete locally with `75/75`
focused recovery and regression tests, `751/751` complete backend tests across
195 suites, and `327/327` JavaScript syntax checks passing under Node
`24.14.1`. It adds schema version `14`, exact SELECT-only recoverability
preview, atomic safe reversal for all approved executed asset forms, and
explicit correction-required routing that moves no asset when reversal is
unsafe. The three current-commissioner target recovery routes are composed with
typed history, correction, activity, exact-idempotency, and metadata-only
outbox evidence. M5-11 is complete locally with `34/34` focused backend
trade/runtime tests, `18/18` focused auction tests, `756/756` complete backend
tests across 196 suites, `330/330` JavaScript syntax checks, and `71/71`
complete frontend tests across 16 files passing. Frontend lint and production
build also pass. It composes the approved trade reads and participant workflow,
adds safe typed trade detail history, exposes only the caller team's sealed bid
state, integrates auction, trade, activity, and owner-only notification pages,
and uses authenticated metadata-only Socket.IO events solely for scoped query
invalidation. The complete M5 gate is recorded as passed. M6-01 is complete
locally with `25/25` focused schema/repository tests, `766/766` complete backend
tests across 198 suites, and `335/335` JavaScript syntax checks passing under
Node `24.14.1`. It adds atomic provider-backed statistics refreshes and preserves
the last valid successful season set after every tested failure. M6-02 is
complete locally with deterministic even and odd round-robin generation,
exact Pacific calendar boundaries, schema version `15` pairing and bye display
context, commissioner-only read-only preview, and one atomic persist. Its
`61/61` focused tests, architecture regression, `774/774` complete backend
tests across 201 suites, and `340/340` JavaScript syntax checks pass under Node
`24.14.1`. M6-03 is complete locally with schema version `16`, exact inclusive
baseline, lock, and end boundaries, manager-write closure at the lock instant,
and atomic single-winner week transitions. Its `80/80` focused tests,
`781/781` complete backend tests across 204 suites, and `345/345` JavaScript
syntax checks pass. M6-04 is complete locally with an immutable `1:00 AM`
scoring baseline and exact `4:00 PM` active-lineup snapshot. Its exact six-hour
freshness boundary, zero fallback totals, replay, conflict, isolation,
immutability, and rollback tests pass; the complete backend suite is `786/786`
across 206 suites and JavaScript syntax is `349/349` under Node `24.14.1`.
M6-05 is complete locally with schema version `17`, strict normal-lock illegal
evidence, zero scoring state, and one-way fresh late-legality conversion. Its
`68/68` focused tests, `791/791` complete backend tests across 209 suites, and
`353/353` JavaScript syntax checks pass under Node `24.14.1`. That completed
slice predates the 2026-07-29 whole-game amendment: launch-grade FAD work must
now add immutable player/game exclusion evidence atomically with every late
snapshot and baseline, exclude an already-underway NHL game in full including
post-baseline events, and prove idempotent/racing attempts before the amended
matchup gate is complete. M6-06 is complete
locally with exact SELECT-only player and team
deltas, illegal-team zero, independent baselines, last-valid stale health, and
source-regression rejection. Its `18/18` focused tests, `795/795` complete
backend tests across 211 suites, and `357/357` syntax checks pass under Node
`24.14.1`. M6-07 is complete locally with fresh post-end waiting, atomic
official version 1, durable replay, conditional week finalization, and
append-only attributable correction. Its `14/14` focused tests, `801/801`
complete backend tests across 213 suites, and `361/361` syntax checks pass.
M6-08 is complete locally with current-version-only 2/1/0 standings,
deterministic approved ordering, competition ranks, zero-game participants,
and no write-on-read. Its `13/13` focused tests, `804/804` complete backend
tests across 215 suites, and `365/365` syntax checks pass. M6-09 durable job
occurrences, leases, and recovery is complete locally with schema version `18`,
single-owner token leases, exact expiry takeover, explicit retry timing, and
terminal success. Its `63/63` focused tests, `809/809` complete backend tests
across 218 suites, and `370/370` syntax checks pass. M6-10 commissioner matchup
and standings recovery is complete locally with read-only previews, explicit
confirmed correction routing, exact authoritative rebuild, preserved
superseded snapshots, attribution, replay, and rollback. Its `17/17` focused
tests, `813/813` complete backend tests across 220 suites, and `374/374` syntax
checks pass. M6-11 is complete locally with an 88-event 22-week accelerated
simulation, exact DST boundaries, failed-event checkpoint, explicit resume,
scope isolation, and no production composition. Its `19/19` focused tests,
`817/817` complete backend tests across 222 suites, and `378/378` syntax checks
pass. M6-12 is complete locally with all nine authenticated target routes,
read-only GETs, CSRF-protected commissioner previews and versioned confirmations,
safe health, and manager/commissioner frontend states. Its focused backend gate
passed `30/30`, focused frontend gate passed `15/15`, complete backend suite
passed `826/826` across 224 suites, `386/386` syntax checks passed, and the
complete frontend passed `75/75`, lint, and production build. The M6 milestone
gate is complete on `2026-07-22`. M7-01 deployed SQLite target runtime, public
and authenticated health, exact migration/identity opening, safe target start,
and graceful shutdown are complete locally with `837/837` backend tests and
`394/394` JavaScript syntax checks passing. M7-02 explicit identity provisioning
is complete locally with `842/842` backend tests and `397/397` syntax checks
passing; the command was not run on staging or production. M7-03 explicit
maintenance and league-write closure is complete locally with `39/39` focused,
`845/845` complete backend, and `399/399` syntax checks passing. M7-04
controlled scheduler, outbox, account-email, durable matchup occurrence, and
shutdown composition is complete locally with `854/854` complete backend and
`403/403` syntax checks passing. M7-05 encrypted offsite backup and clean
restore foundation is complete locally with `17/17` focused, `862/862`
complete backend, and `413/413` syntax checks passing; no real offsite object
was created. M7-06 deterministic two-league release-QA fixture and automated
rehearsal is complete locally with `4/4` fixture, `68/68` focused, `866/866`
complete backend, and `418/418` syntax checks passing. M7-07 now runs the real
target backend and sibling Vite frontend together through a one-command,
loopback-only manual-QA launcher. It creates disposable temporary state, prints
all nine synthetic account identities without printing their password, keeps
the scheduler and provider disabled, and cleans up on shutdown. Its focused
launcher and integrated-environment gate passes `7/7`. The complete backend
passes `893/893` across 228 suites and `436/436` JavaScript syntax checks under
the required Node `24.14.1`; the complete frontend passes `95/95` across 19
files, lint, and production build. Canonical authenticated feature routes are
loaded as separate production chunks; the initial JavaScript chunk is
approximately `363.86 kB`, below Vite's `500 kB` advisory threshold. The
obsolete root dashboard is kept behind its already-disabled compatibility
backend-session gate and is absent from the active build. Its old quote storage,
league `GET`, and Socket.IO connection also refuse before starting without that
session. The updated M3 browser-authority verifier enforces these boundaries
and passes across 15 compatibility files while inventorying all 86 shipped
frontend source files.

Rendered loopback desktop, mobile, reload, sign-out, and two-league isolation
checks pass. Grae's local manual run also passed sign-in refresh, Tab and
Shift+Tab navigation, visible focus, Enter submission, and the rendered
Socket.IO reconnect procedure. The 200% zoom run preserved sign-in, sign-out,
and no whole-page horizontal overflow, but exposed header overlap, off-frame
navigation, mixed legacy/target navigation, and incomplete standings display
in the observed build. Functional navigation, six-team standings, player,
auction, matchup, and team-link corrections now pass focused automated tests.
The old direct player, matchup, and standings URLs now enter the one canonical
league-scoped feature, including safe multi-league selection and remembered
authorized-league behavior. An authenticated `/` entry redirects to league
selection, the logo no longer uses fixed absolute inline positioning, and
Escape closes the primary menu and restores trigger focus. The combined recent
frontend gate passes `38/38` across seven files. Theme A - Midnight Rink is now
implemented locally across the authenticated shell, account flows, league
selection, real-data dashboard, teams, rosters, players, auctions, trades,
matchups, standings, activity, notifications, and commissioner tools. It
preserves the canonical Hundo Leago data and authority contracts while
adapting the supplied Figma Make visual direction. The Theme A desktop,
narrow-mobile, and 200% zoom rendered acceptance passes for the documented
local matrix.

Grae's Theme A Tours 1 and 2 pass. Tour 3 confirms that a Beta auction
persists across sign-out/sign-in and remains invisible to the Alpha manager.
Tour 4 exposed and drove a local release-QA correction: the platform
administrator now has explicit active memberships in both fixture leagues,
backend league responses distinguish stored membership from inherited
`platform_administrator` authority, and the frontend exposes Commissioner tools
for that inherited authority. Platform role without active membership remains
denied. The pending-verification and deactivated accounts intentionally return
the same generic sign-in failure to prevent account enumeration.

On `2026-07-24`, Grae reported all six focused simplified-account checks
passing: administrator access to both leagues and Commissioner tools,
commissioner access, Alpha/Beta manager isolation, the explicit no-membership
state, and the matching generic rejection for pending and deactivated
accounts. The synchronized `E:` workspace then passed `893/893` complete
backend tests across 228 suites under Node `24.14.1`, `95/95` frontend tests
across 19 files, frontend lint, and the production build. M7-07 is complete
locally.

The actual read-only candidate inspection correctly blocks the non-staging
frontend branch, dirty worktrees, and absent exact candidate input without
mutation or authority. Encrypted private-object backup, wrong-key failure,
clean-path restore, provider-failure containment, disabled scheduler, protected
hashes, and clean teardown pass locally. M7-08 froze and published only the
staging branches. M7-09 deployed the isolated Netlify and Render staging
resources and recorded the original hosted browser failures.

M7-10 completed staging remediation on `2026-07-25`. The dedicated staging
application now has a SportsDataIO Discovery Lab catalog of `3,154` players
and `1,091` mapped 2025-26 regular-season statistics rows, deterministic
distinct Alpha/Beta six-team fixtures, complete controlled account states,
seeded trade scenarios, staging-only reset with verified backup, league-scoped
commissioner roster and contract tools, cap previews, activity audit evidence,
player details, matchup player statistics, and reconnect recovery. The final
backend passes `962/962`; the final frontend passes `106/106`, lint, build, and
browser-authority verification. Focused hosted retesting passed and the final
reset preserved provider data while restoring all fixture state. The staging
site is ready for Grae's independent retest.

M7-11 completed on staging on `2026-07-26` after Grae's independent staging
review. The implementation now includes a provider-backed release-QA roster
selection when
the retained catalog is available, corrected Alpha Ravens fixture cap state,
four years of draft picks, an authenticated team workspace with authoritative
cap components and retention-slot usage, and a separate versioned roster
display order. The roster UI supports team switching, striped team identity,
readable cap cards, draft-pick inventory, table and hockey-line views, drag and
keyboard ordering, and logo display.

The authenticated Players page now hides explicitly unavailable provider
records, loads the complete league-visible catalog, defaults to total fantasy
points, sorts every player-data column, filters by player, position, NHL team,
league assignment, and minimum games, keeps contract context, and builds a
comparison list. Eligible free agents link to an auction form prefilled by
stable player ID. Auction team choice is implicit only when the user has one
eligible managed team in the selected league.

Trade composition now resolves approved asset types through authoritative
team-workspace choices instead of asking users for stable IDs. Pending trade
details use one plain-language panel per team instead of raw JSON. League
Activity defaults to a summary, timestamp, resolved team name, approved
human-readable details, and a collapsed technical record. The new Account page
supports display-name and password changes plus authorized team name, logo,
and two-colour stripe settings; email remains read-only in this workflow.

Local frontend verification passes `110/110` across 22 files, lint, production
build, and the browser-authority verifier across 15 compatibility files and 97
shipped source files. The backend fixture, team-workspace, account-profile,
schema, reset-manifest, target-runtime, cap, draft-pick, trade-choice, and
display-order gates pass. The complete backend suite passes `967/967` across
232 suites under the repository-approved Node `24.14.1`.

A loopback API smoke confirms the Alpha Ravens team workspace reports `$7.25`
cap usage as `$6.50` active net AAV plus `$0.75` retained salary and `$0.00`
buyout penalties, one of three retention slots used, and sixteen owned picks
across four chronological draft years.

Release `HL-20260726-2` published frontend application commit
`1233c3c6185d4f7edfa8dcedc8d59dcedce0f0a5` in Netlify deploy
`6a6638fa90a1d936d7ab5426` and backend commit
`e7f089ecc81ca9fa17b8b0143949b760668f66d1` in Render deploy
`dep-d9j3ghhba33s73821490`. The backend is live and ready on schema `19`;
the migration ledger, SQLite integrity, and foreign-key checks pass. The
verified pre-migration backup is
`backup-v1-81b3ca0f587fc64b24c2dba445e04db156e27f19055de0736f9582536560d7dd`.
The final reset backup is
`backup-v1-4605c937816ac2469b3e62f3a804d236a5c53df6bc7dddcbfaef5bd3c3d353a6`;
fixture build `m7-release-qa-fixture-v7` preserves the `3,154`-player catalog
and `1,091`-row successful statistics import.

Hosted connected-browser desktop and `390 × 844` checks pass for dashboard,
roster, players, auction handoff, trades, activity, account and team settings,
and direct Alpha-to-Beta denial without whole-page horizontal overflow.
Provider-backed names, exact cap and retention values, all sixteen picks,
team switching, both roster views, persisted keyboard ordering, player
sorting/filtering/comparison, implicit-team auction prefill, named trade
choices, plain-language trade panels, and simplified activity all rendered
against the dedicated public staging services. The DOM drag-event handler and
saved-order payload pass automated coverage, but manual native pointer drag
remains a user-acceptance item because the connected browser cannot synthesize
that gesture.

M7-12 completed on staging on `2026-07-26`. Commissioner-only accounts no
longer inherit a fixture team, Commissioner Roster Operations has a cleaner
correction guide without import-health or raw-JSON panels, and team-directory
cards use each team's configured stripe identity. Roster finance presentation
now uses five authoritative cards, active players default to forwards then
defence ordered by descending AAV within each group, and roster statistics use
sortable GP, G, A, P, FP, and FPG columns in table and hockey-line workflows.

The Players page now includes FPG and exposes All Players, Free Agents,
Favourites, every league team, and Prospects while continuing to hide
unavailable provider records. Trade composition adds optional contract
retention and plain Future Considerations notes. Buyouts are selected as
specific player obligations with annual AAV and remaining term, and the
receiving team assumes the selected obligation's complete remaining schedule;
arbitrary buyout amounts and partial transfers are not supported.

Matchups now exposes all 22 regular-season weeks in one selector, accepts
completed Week 1 responses, shows future opponents, varies release-fixture
team totals, and resolves current team names for scheduled and live views
while preserving finalized historical names.

Release `HL-20260726-3` published frontend application commit
`7146bd042fd86f11dd4f1226c61d879f4956f358` in Netlify deploy
`6a66610577aa69f808ad00a9` and backend application commit
`a821a95a267a370d7f3fe3ef0b8cfdacea83aea5` in Render deploy
`dep-d9j5vnt8nd3s73asjkn0`. The reset installed
`m7-release-qa-fixture-v8`, preserved all `3,154` provider-catalog players,
and created verified backup
`backup-v1-d90df160904d8d36441233bffc6037207fa4bb666677798557f82a4a07412ca1`.

The complete frontend gate passes `115/115` tests across 23 files, lint,
production build, and browser-authority verification across 15 compatibility
files and 98 shipped source files. The complete backend gate passes `968/968`
tests across 232 suites under Node `24.14.1`, plus the repository check.
Hosted administrator and Alpha Ravens manager checks passed without submitting
an auction, trade, roster correction, or account/team-profile change.

M7-13 completed on staging on `2026-07-26`. Commissioner Roster Operations
now presents one correction workflow at a time, collapses supporting cap and
staging-reset panels, removes the Import health pane, and has verified
narrow-layout spacing. Team-directory identity now uses strong horizontal
primary/secondary bands. Roster table and hockey-line views expose explicit
desktop and touch drag handles plus keyboard controls, preserve within-position
ordering, and use larger player/statistic typography.

Release `HL-20260726-4` published exact frontend application commit
`51f9c22c8127dcc992ca35ffcb9bdd10c14d3634` in ready Netlify deploy
`6a666d6791675949811e06c9`. The backend remained at application commit
`a821a95a267a370d7f3fe3ef0b8cfdacea83aea5`, Render deploy
`dep-d9j5vnt8nd3s73asjkn0`, and fixture
`m7-release-qa-fixture-v8`; no backend deployment or reset occurred.

The complete frontend gate again passes `115/115` tests across 23 files,
lint, production build, and browser-authority verification across 15
compatibility files and 98 shipped source files. Hosted administrator and
Alpha Ravens manager acceptance reverified role separation, all immediate
review behavior, readable narrow layouts, real provider-backed players, named
whole-buyout selection, all 22 matchup weeks, and immediate current-name
propagation. The temporary roster ordering and Alpha Ravens rename used for
acceptance were restored. Manual native pointer dragging remains the explicit
Grae acceptance item because the connected browser cannot activate that raw
gesture; focused automated pointer and saved-order coverage passes.

M7-14 completed on staging on `2026-07-26`. Team identities now support either
two equal colour bands or the approved three-band pattern, with readable
identity plates on the team directory, roster header, and matchup score
headers. The roster uses drag handles without visual arrow controls, preserves
an accessible keyboard ordering path, and exposes compact Buyout, Move to IR,
Trade, and Trade Block actions. Trade-block state and eligible roster actions
are authorized and persisted by the backend.

The Players page now uses colour-changing hockey helmets for favourites,
removes the duplicated comparison table, and provides selectable player-name
autocomplete. Matchups uses a plain-language week/date label, includes GP in
both player tables, and retains all 22 selectable weeks. Commissioner
dashboards now prioritize rotating matchups, auctions, trades, membership, and
invitation controls instead of manager-empty panels. Platform administrators
can create leagues and assign commissioners through protected existing
administrative authority. Pending invitation notifications now expose
Accept/Decline actions and update league access after an authoritative
response.

Release `HL-20260726-5` published frontend application commit
`ae7cb7d0dc5d9cba14b8f5d8b080aa3eb932eeb9` in Netlify deploy
`6a669ac2e7798097bd3f111c` and backend application commit
`9b1b89aebcd79ced9343eb1cde68543fa80023f3` in Render deploy
`dep-d9j98evaqgkc73b587mg`. The backend migrated from schema `19` to schema
`20` after verified backup
`backup-v1-02af141187ca38d6746b3d85bd4351cc045639c2755dd5a22af639c7a0a536ed`.
Migration-ledger, SQLite integrity, foreign-key, liveness, and readiness checks
pass. Fixture `m7-release-qa-fixture-v8` remains installed; no fixture reset
occurred.

The complete frontend gate passes `118/118` tests across 23 files, lint,
configured production build, browser-authority verification across 15
compatibility files and 99 shipped source files, and `git diff --check`. The
complete backend gate passes `974/974` tests across 234 suites under Node
`24.14.1`, syntax verification, and `git diff --check`. Hosted administrator,
commissioner, and manager checks passed. A temporary Alpha Wolves manager
removal used to verify the confirmation path was repaired through the normal
invitation and acceptance workflow; the assignment is restored and the
plain-language audit entries remain.

M7-15 is complete on staging and ready for Grae's independent browser retest.
Ordinary
Active-to-Bench, Bench-to-Active, and eligible injured-reserve moves now use
one versioned command. A count or cap overage requires explicit confirmation,
then persists with an authoritative illegal-roster result until a separate
correcting move. Contract, Bench-AAV, injured-reserve eligibility, prospect,
ownership, authority, isolation, and stale-version failures remain hard
rejections.

The release fixture now gives every team 12 active forwards, 6 active defence
players, 1-4 Bench players, selected injured-reserve examples, and 3 under-19
Prospects. Fixture v10 assigns normal roster slots from active retained
SportsDataIO identities and permits unavailable under-19 provider records only
for Prospect slots; a deterministic synthetic identity is retained solely as
the local no-provider fallback.

Creating a trade proposal atomically notifies each active receiving-team
manager, and manager-facing pending-trade lists distinguish proposals
involving the managed team. Players use compact helmet and auction actions.
Team cards and matchup score headers fade colour bands toward neutral identity
areas. Matchup player statistics fit both six-column sides without internal
horizontal scrolling. Redundant auction team-context pills are removed.
Commissioner roster corrections use searchable player selection,
team-scoped choices, automatic position and slot handling, and one clean
four-operation control.

Release `HL-20260726-6` publishes frontend application commit
`5cb9f63c1185581eed0687188b9bc25bc885dac2` in Netlify deploy
`6a66c4f9708a1baaa94b6135` and backend application commit
`d46104e754ffe56d68fc75baa3ec672a17f80d38` in Render deploy
`dep-d9jcs0urnols738i11pg`. The verified final reset backup is
`backup-v1-6a143967ddc394e1bcdf539f813c988a4fe1768b6e986fab28c5561640f17847`;
fixture build `m7-release-qa-fixture-v10` preserves all `3,154` provider
catalog players.

Hosted acceptance found and corrected one final persistence defect: a
confirmed manager-originated overflow reached the application service but was
rejected by the schema-20 ownership constraint. Additive migration `21`
permits an explicitly unplaced Active, Bench, or injured-reserve ownership
while the authoritative service continues to enforce confirmation and every
hard eligibility rule. The migration followed verified backup
`backup-v1-8fc3212d1387f55cd5ed5f34ab3a017af7d1026b9c058d39e00f12ee78a66fb8`.
The one-time, exact-staging-identity migration bridge was removed before the
final deploy and its confirmation setting was disabled.

The complete frontend gate passes `119/119` tests across 23 files, lint, the
configured production build, browser-authority verification across 15
compatibility files and 99 shipped source files, and `git diff --check`. The
complete backend gate passes `976/976` tests across 234 suites under Node
`24.14.1`, syntax verification, and `git diff --check`.

Hosted administrator, commissioner, and manager acceptance now passes the
M7-15 list. All twelve fixture teams have the required real-player roster
depth with no synthetic active identities. The matchup player table has no
internal overflow at the checked `727`-pixel viewport. Receiver trade
notifications, managed-team trade highlighting, player action pills,
two-/three-colour identity treatments, auction context cleanup, and
commissioner roster workflows are present. A Bench-to-Active move required
confirmation, persisted at `19/18` with the red authoritative
`Illegal roster` flag, and a correcting Active-to-Bench move restored the
fixture to `18/18`.

The final identity clarification is published as frontend commit
`9044974306badd8df192880b5f7b229397d8a685` in ready Netlify deploy
`6a66d52d249ebdc854dbf6f1`. Team stripes now fade to the standard dark-blue
background only beneath the name/logo identity area on the team index,
dashboard team panel, matchup score headers, and roster header. The dashboard
team panel now receives each team's configured two- or three-colour stripe
variables. The Players favourite action uses a symmetrical front-facing hockey
helmet. Hosted manager acceptance visually confirmed all five affected
surfaces.

The final player-catalog pagination follow-up is published as frontend commit
`72d30d687841196e1cf7e80051eaf0782079c402` in ready Netlify deploy
`6a66dc51cc47020a84ddc746` and backend commit
`c1c3a3b53f397747ecf219a8cc4dc7a428339b3b` in live Render deploy
`dep-d9jdn5vavr4c73caolmg`. The Players page now requests only 100 records
initially, displays the number of loaded and currently visible players, and
follows one authoritative cursor only when **Load next 100 players** is
selected. The backend preserves the approved default experience by ordering
those cursor pages by total fantasy points with deterministic name and stable
ID tie breakers. Player-name autocomplete uses its own bounded server search
instead of depending on every catalog page already being loaded. The team
index now gives **Your team** a white, dark-text, double-outline badge that
remains distinct from every configured stripe colour.

The complete follow-up gates pass: frontend lint, configured staging build,
and `120/120` tests across 23 files; backend syntax verification and `978/978`
tests across 234 suites under Node `24.14.1`; and `git diff --check` in both
repositories. Hosted manager acceptance confirmed 100 initial player rows,
200 rows after one continuation, preserved fantasy-points ordering,
player-name autocomplete, and the high-contrast team badge. Public liveness
and readiness remain healthy. No database migration, fixture reset, or
production change occurred.

M7-16 trade navigation and roster-asset follow-up is published as frontend
commit `32b0e444aa546eca5c7c33a662cb9136cb611c61` in ready Netlify
staging deploy `6a66ea347cac9a645d5059d7`. The receiving manager's normal
Trades page now highlights proposals awaiting that manager's response, and
received-trade notifications deep-link to the identified pending proposal and
load its backend-authoritative acceptance preflight. Another team's player and
draft-pick controls open the proposal builder with stable team and asset IDs on
the requested side. Owned picks use a four-year by four-round matrix, matching
the approved four-round Entry Draft rather than the seven columns in the visual
reference, with original-owner logo or team-colour identity. Hockey-line player
cards use the team-stripe identity treatment, the favourite action uses a
hockey stick, and the commissioner matchup spotlight advances every five
seconds with right-to-left motion and reduced-motion support.

The complete M7-16 frontend gates pass: lint, configured staging build,
`124/124` tests across 23 files, and `git diff --check`. Hosted manager and
commissioner acceptance confirmed trade-list highlighting, notification
preflight navigation, player and pick preloading, the draft matrix, line-card
stripes, hockey-stick controls, and matchup rotation motion. No proposal was
submitted or resolved during acceptance. The backend, migration state,
fixture, database, Render service, and production remain untouched.

M7-17 trade-preview presentation is published as frontend commit
`6ee9db750b2060f148fbd67b64278cc333bac53d` in ready Netlify staging
deploy `6a66f059a77bc9c3d416ccb3`. A requested-retention asset now pairs
with its included player contract by stable contract ID and appears in one
combined card with player name, contract AAV and term, roster category, and
retained AAV. Draft picks, existing retention obligations, and independent
assets remain separate. Hosted acceptance on the accepted
**Riddles ↔ The Boobies** proposal confirmed Adam Pelech's contract and
`$1.00` requested retention share one card while the 2028-29 round-three pick
remains separate.

The M7-17 frontend gates pass: `125/125` tests across 23 files, the focused
`11/11` transaction suite, lint, configured staging build, and
`git diff --check`. The API contract, trade records, backend, database,
fixture, Render service, email configuration, and production remain
untouched.

M7-18 completed the broad staging hardening and regression pass. It corrected
inherited platform-administrator competition authority, replaced technical
commissioner previews with user-facing presentation, removed client diagnostic
payload logging, added cross-environment frontend configuration guards, and
hardened public response headers. Frontend Netlify deploy
`6a6713c190a1d98698ab558b` and backend Render deploy
`dep-d9jhfhsm0tmc73b0jjn0` passed the recorded local and hosted gates. The full
record is `docs/07-testing/release-runs/M7_HARDENING_REGRESSION_2026-07-27.md`.

M7-19 frontend release-readiness hardening is published as frontend commit
`d16ade0` in ready Netlify staging deploy
`6a676a67f354847de9aa60ac`. Another team's roster now identifies
commissioner-action mode for commissioners and inherited platform
administrators while a manager's own roster remains in ordinary manager mode.
Player and roster sortable headers expose their current direction through
`aria-sort`. Shared horizontally scrollable player, roster, matchup,
standings, and standings-preview tables are named keyboard-focusable regions,
and the auction dashboard uses correct singular and plural bidder copy.

The M7-19 frontend gates pass: lint, `129/129` tests across 23 files,
staging-configured production build, browser-authority verification across 15
compatibility files and 100 shipped source files, dependency-tree validation,
and `git diff --check`. Hosted acceptance passed at 390- and 1280-pixel
viewports for administrator and manager roster modes, player and roster sort
state, table keyboard access, matchup and standings regions, dashboard copy,
and whole-page overflow. Backend liveness returned `200`, and the inspected
Render window contained no application errors or `5xx` requests. The backend,
database, fixture, email, provider, jobs, and production remain untouched.

M7-20 restores the legacy static hockey-quote catalog to the modern
authenticated application shell in frontend commit `bc42937`. Quotes are
shuffled in memory on each full page load and move continuously from right to
left through the flexible top-bar space between location and account controls.
The ticker is clipped, low-contrast, slow, hover- and focus-pausable, and
reduced-motion aware. It performs no API request, mutation, or modern
browser-storage write.

Ready Netlify staging deploy `6a677c25e8319f5595bb8e36` passed hosted
administrator acceptance at 390- and 1280-pixel viewports. The quote order
changed on reload, normal motion ran without layout overflow, keyboard focus
paused the track, navigation and account controls retained their space, and
the browser console remained free of errors. The complete frontend gate passes
lint, `131/131` tests across 24 files, the staging-configured production build,
browser-authority verification across 18 compatibility files and 103 shipped
source files, dependency-tree validation, and `git diff --check`. The quote
catalog remains verbatim; no backend, database, fixture, email, provider, job,
or production change occurred.

M7-21 isolates durable account-email delivery from the general league
scheduler in backend commit `dfee0a0`. Staging now runs the account-email
worker behind `ACCOUNT_EMAIL_DELIVERY_ENABLED=true` while
`SCHEDULED_JOBS_ENABLED=false` continues to disable auction resolution, trade
expiry, matchup processing, the league outbox, and other league jobs. Runtime
health reports the separate email-delivery switch without exposing provider
secrets.

Render deploy `dep-d9jve7dbedkc738lrmpg` is live with the verified
`notify.hundoleago.com` sender. A fresh allowlisted account-verification
request returned `202 Accepted`, and Resend recorded the message as
`delivered`. Public liveness and readiness remain healthy. The complete
backend gate passed `985/985` tests across 234 suites, `npm run check`,
dependency-tree validation, a 467-file JavaScript syntax sweep under Node
`24.14.1`, and whitespace validation. No database, fixture, league job, or
production change occurred. The full record is
`docs/07-testing/release-runs/M7_ACCOUNT_EMAIL_DELIVERY_2026-07-27.md`.

M7-22 corrects the staging mobile-login loop by moving the frontend and API to
the same registrable domain. The staging application is now served from
`staging.hundoleago.com`, with API and Socket.IO traffic at
`api-staging.hundoleago.com`. The backend uses an explicit, host-only,
HttpOnly, Secure `SameSite=Lax` session cookie, and the former Netlify hostname
permanently redirects old bookmarks and deep links to the custom frontend
hostname.

Frontend application commit `66986b9`, frontend routing commit `8c96e71`, and
backend commit `d04f18f` are published in ready Netlify deploy
`6a68164f5056482991266e18` and live Render deploy
`dep-d9k11ltbedkc738pf5d0`. Hosted sign-in, reload persistence, old-host
redirect persistence, cookie-attribute inspection, authenticated session
bootstrap, authenticated Socket.IO, CSP, liveness, and readiness checks pass.
Complete frontend and backend regression gates pass. Physical phone
verification remains Grae's final device-specific acceptance item. No
database, fixture, provider, league job, production domain, production
environment, or production deployment changed. The full record is
`docs/07-testing/release-runs/M7_MOBILE_SAME_SITE_SESSIONS_2026-07-27.md`.

M7-23 publishes phone-layout polish in frontend commits `a3f4015`,
`a1da433`, and `d45373d`, with the exact final commit in ready Netlify
staging deploy `6a6823aaa8f41d9b53c1ca0d`. At phone width, matchup
player names now use each team's half of the table above evenly divided GP,
G, A, PTS, and FP cells. Valid player FP is orange and bold on phone and
desktop. The reviewed auction/bid forms use a responsive two-column layout,
and roster/player table density and icon controls are compact at phone width.

The complete frontend gate passes lint, `132/132` tests across `24` files,
the staging-configured production build, browser-authority verification,
dependency-tree validation, and whitespace validation. Hosted authenticated
acceptance at `390` and `1280` pixels confirms complete names, aligned stats,
orange bold FP, zero matchup and document overflow, responsive auction/bid
controls, compact roster/player actions, and internal wide-table scrolling.
No state-changing action was submitted. Backend-authoritative calculations,
API contracts, transaction rules, backend, database, fixture, provider,
email, jobs, and production remain untouched. The full record is
`docs/07-testing/release-runs/M7_MOBILE_LAYOUT_POLISH_2026-07-27.md`.

At the `2026-07-27` M7-24 checkpoint, team-identity templates were deployed to
the dedicated staging services for Grae's manual testing. The manager settings
page replaces its separate
two-/three-colour choice with a catalog of 35 fixed-count templates: the
existing two- and three-stripe even splits, 21 deduplicated hockey stripe
arrangements, and 12 decorative patterns. The selected template exposes
exactly two or three colour inputs, is persisted as
`teams.pattern_template`, and renders through the shared team-identity
treatment.

Staging migration `0022` completed after creating verified backup
`backup-v1-5d25e421cf21b9f59342f8fb08b16701311d98729f6fa907ff9b592eeed33b4a`.
At that checkpoint, backend deploy `dep-d9k4b7favr4c73a5ts8g` was live on
schema `22` without the temporary migration bridge, and Netlify deploy
`6a6845cd5e20aa47c911e71b` was ready at
`https://staging.hundoleago.com`. Hosted acceptance confirmed all 35 options,
fixed two-/three-colour switching, the matching preview, and no browser
console errors without submitting a profile write. The complete frontend
suite passed `135/135`; the final backend Render build passed `986/986`.
Those identities are historical release evidence, not the final M7-25/FAD-18
release identities. Exact release evidence is recorded in
`docs/07-testing/release-runs/M7_TEAM_IDENTITY_TEMPLATES_2026-07-27.md`.

The annual Free Agent Draft product rules were approved on `2026-07-27`, the
total-first/AAV-second ranking and selected-first-matchup clock were clarified
on `2026-07-28`, and the consolidated lifecycle amendment was approved on
`2026-07-29`. The amendment adds scheduled Entry Draft-start rollover,
automatic all-or-none Candidate Card readiness, server-owned whole-Monday Week
1 recovery, adaptive help timing, strict whole-card cap exclusion, restricted
minimums that require a current improvement, league-wide no-improvement
fallback, exact-top FAD draws for open and restricted auctions, private
final-hour nomination queueing, no-bid unclaimed outcomes, no cap/slot
reservation, binding aggregate wins, and rollover extensions beyond the
initial seven when required.

The FAD technical design remains approved. The contained M7-25 dependency
sequence, including `FAD-01` through `FAD-18`, completed its isolated
shared-staging gate on `2026-08-18` and is archived at
`docs/06-work-plans/archive/M7-25_FREE_AGENT_DRAFT_IMPLEMENTATION_SEQUENCE.md`.
Its final staging target is schema `52`; exact release and rollback evidence is
recorded in
`docs/07-testing/release-runs/FAD_AUCTIONS_PLAYERS_UX_2026-08-18.md`. M7-26 is
the sole active implementation plan. The migration details below preserve the
historical dependency checkpoints that led to that release.

The migration `0023` through `0029` impact audit completed, and corrective
migration `0030` remains the frozen schema-30 decision-package boundary after
the pre-staging T-145 current-generation compatibility correction, at
`636,077` bytes with SHA-256
`6f46b7a8c52108adfc0b51dc1eb9cdcab0ed274482ca396a31f7d45e42c07184`.

Additive migration `0031` supplies immutable readiness-attempt and retry-receipt
evidence and remains pinned at `46,693` bytes with SHA-256
`f2c5104f2eb06e261cc902067bd4623b841f2c37a04f73d27487863077b2662a`.
Additive migration `0032` advances the current local target to schema version
`32` without creating a table or index. It adds only the job-side expired-lease
reclaim guard and replaces only the readiness-operation forward trigger.
Migration `0032` is pinned at `27,882` bytes with SHA-256
`ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`.
Additive migration `0033` supplies immutable T-095 corrective-requeue evidence
and its exact job/readiness guards while preserving migrations `0030` through
`0032` byte-for-byte. It is pinned at `56,084` bytes with SHA-256
`93714178a4c89687578ca340afbe69c317239118cb50765838e6123ff6faf7f1`.
The schema-33 inventory is `127` application tables, `128` including
`schema_migrations`, `127` repository-catalog entries, `45` post-reset
require-empty tables, `82` signed-reset-policy tables, and `63`
immutable-delete guards. The focused schema, migration, database-identity,
catalog, reset-manifest, and reset-bootstrap package passes `64/64` with no
failure or skip.

Additive migration `0034` advances the current local target to schema version
`34` without adding a table, trigger, view, catalog entry, reset-policy entry,
or delete guard. It restores the FAD recovery league/player/status lookup lost
in the migration-0030 table rebuild and adds predicate-scoped, order-aware
seek paths for Candidate prospect-release exclusion and exact confirmed
rights-release re-entry evidence. It is pinned at `1,158` bytes with SHA-256
`9347331419ada113707a4e71ef87c578ddd3cd0bd4ddb9578164f08b3307bb36`.
The schema-34 structural inventory is therefore unchanged from schema 33. Its
focused exact `33 -> 34`, fresh `1 -> 34`, identity, row-preservation,
integrity, foreign-key, exact-index, and real-query-plan gate passes `10/10`.
Migrations `0023` through `0034` are independently byte/hash pinned locally.

Additive migration `0035` creates immutable Candidate Card help-command
results and is pinned at `10,981` bytes with SHA-256
`cbbaf5322c111f3d13659cf6adc1a5046c8b49ba0ab84c3541d770a1dae3b669`.
Additive migration `0036` creates immutable provider-catalog eligibility-
revalidation occurrences, binds every semantic player/FAD delta to its exact
shared-lease job and catalog event, and enforces the deadline barrier. It is
pinned at `22,871` bytes with SHA-256
`1351e25758d7192ab804214f0abeb696a9b0a9b3509e81dcd276ac7570fbb1f6`.
The schema-36 inventory is `129` application tables, `130` including
`schema_migrations`, `129` repository-catalog entries, `47` post-reset require-
empty tables, `82` signed-reset-policy tables, and `69` immutable-delete
guards.

Additive migration `0037_allow_atomic_fad_deadline_allocations.sql` permits
only the exact pending allocation insert owned by a live, claimed
`fad_deadline` occurrence while the root FAD is still `cards_open`.
It preserves the deadline barrier for every unrelated write and is pinned at
`4,142` bytes with SHA-256
`33b8e7c3479f9a3dc64011a29ced6421a5cc59eca62da8b8144cf82b1d0d80b3`.

Additive migration `0038_allow_pre_fad12_restricted_scheduling.sql` preserves
exact Candidate ties as `restricted_scheduled` for the next complete rapid
rollover instead of activating them before FAD-12. It changes no ordinary-
auction rule and is pinned at `17,157` bytes with SHA-256
`b4567d087b31ff70dfa2776f2a15e6d22e182600d3dd5e5446a169bb64bb5ac5`.
Schema `38` was the FAD-10 local target. Its structural inventory remained
`129` application tables, `130` including `schema_migrations`, `129`
repository-catalog entries, `47` post-reset require-empty tables, `82` signed-
reset-policy tables, and `69` immutable-delete guards.

Additive migration `0039_add_fad_recovery_correction_evidence.sql` is pinned at
`201,713` bytes with SHA-256
`a176479f3eb3fc1183c595a68026a2e5b73d6b975b66b6bcab5de4954945ae6f`.
It adds the FAD-11 recovery/correction command-result and queue-acceptance
evidence plus their exact guards. Additive migration
`0040_allow_atomic_fad_restricted_fallback_overlap.sql` is pinned at `9,449`
bytes with SHA-256
`cff71c33b628504d38b53cfe1621363740791c119c5b214d7d11e10f216a5a92`.
Schema `40` was the FAD-11 local target. It retains `131` application tables,
`132` including `schema_migrations`, and `131` repository-catalog entries while
admitting only the exact transaction-bound restricted-source/fallback overlap
required by the shared no-improvement handoff.

FAD-12 adds migration
`0041_allow_fad_auction_resolution_recovery_resume.sql`, pinned at `35,525`
bytes with SHA-256
`00d6926934d46089df6581a8c3edc296394ce57958155e36da7d15b2be61111b`;
migration `0042_use_current_aav_for_restricted_participant_floor.sql`, pinned
at `9,326` bytes with SHA-256
`4269c4a0c320364b65d20c01b167ff8738f1a67c7e4d52160e6e2245e201e537`;
and migration `0043_allow_repeat_fad_auction_resolution_recovery.sql`, pinned
at `92,011` bytes with SHA-256
`1623d40ffaa477e3ba0be6bdd7c831f3d16489b53e4befc03eb7aa0e6efa6ae3`.
Schema `43` was the FAD-12 local target. It has the same `131` application
tables, `132` including `schema_migrations`, and `131` repository-catalog
entries. It admits only exact current-AAV restricted improvements, causal
allocation/auction resolution retry resume, repeated terminal failure on one
recovery, latest-failure/receipt evidence, and automatic system settlement.

FAD-13 adds migration `0044_allow_immediate_fad_open_rapid_starts.sql`, pinned
at `32,654` bytes with SHA-256
`79f759030c01281f4a21aeba0584a3681d0ae84982d2b7a48dfcd7a5bf0274ee`;
migration
`0045_allow_restart_safe_fad_queued_nomination_activation.sql`, pinned at
`74,289` bytes with SHA-256
`cd2a7d3059b6ab0f484267b6999cbadd6db1a86114fcdb67e4220296dca9ae37`;
migration `0046_bind_fad_open_rapid_starter_edit_limit.sql`, pinned at `18,329`
bytes with SHA-256
`78626350a1efa3e76b09f3ba2dc812b135b1e2d19dd2c01d2e973a57a6a884bb`;
and migration
`0047_allow_restart_safe_fad_rollover_finalization.sql`, pinned at `14,129`
bytes with SHA-256
`bdabbcff52cd87c932c3f2e067d825786fd6dac6354ea4a3a90396ec972b0b2b`.
Schema `47` was the FAD-13 local target. It retained `131` application tables,
`132` including `schema_migrations`, and `131` repository-catalog entries.

FAD-14 adds trigger-only migration
`0048_require_canonical_fad_realtime_evidence.sql`, pinned at `73,524` bytes,
`1,490` lines, and SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`.
It replaces only the two live head-47 triggers that guarded automatic-award
resources and successful Candidate Card opening, requiring the approved exact
metadata-only publications without changing structural inventory. Schema `48`
is the preserved intermediate FAD-14 realtime checkpoint.

Reconciliation migration
`0049_require_canonical_fad_setup_exemption_publications.sql` is pinned at
`29,571` bytes, `748` lines, and SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`.
It replaces only the live head-48 setup-exemption insert trigger so the exact
commissioner Activity, notification, recipient, destination, and three-event
publication contract is required atomically. Schema `49` is the current local
target with `131` application tables, `132` including `schema_migrations`, and
`131` repository-catalog entries. None of migrations `0023` through `0049` has
been applied to shared staging or production.

The complete stable backend tree was verified on exact Node `24.14.1` in one
bounded-concurrency run: `2,145` tests across `337` suites, `2,143` passed,
zero failed, and two Windows link-capability subtests skipped because
symlink/file-link creation was unavailable. Their fail-closed paths passed.
Focused FAD-05 gates include `242/242` matchup/statistics, `196/196`
migration/amendment, `31/31` deployed-runtime, `3/3` writer-registry, and
`36/36` reset/import-artifact tests. The staging-only migration-report command
now read-back verifies a bounded `60000` millisecond lock wait on both of its
connections, while ordinary application connections remain at `5000`
milliseconds; deterministic contention beyond five seconds converges on one
commit and one read-only replay. None of migrations `0023` through `0034` has
been applied to shared staging or production.

`FAD-06` closed locally on `2026-08-02`. `T-076` and `T-078` now use exact,
read-only, league-isolated active and terminal projections with normalized,
bounded SQL selection and no competing active-bid values. Ordinary-context
`T-080` through `T-083` are composed through immutable idempotent
administration results; due `T-083` creates the exact durable resolution job,
and the real composed worker completes the ordinary contract, ownership,
activity, and outbox path exactly once. A fresh full-migration target-runtime
test also proves authenticated cursor paging, own-bid visibility,
cross-manager value privacy, exact envelopes, and zero writes across both GET
routes. Terminal detail retains a deterministic safe player position after
provider conflicts or source replacement. The final auction-family gate passed
`161/161` across `22` suites in `17` files, and the post-gate administration
repository passed `10/10`. Independent review's terminal player-source P2 was
corrected; refreshed verification leaves no remaining P1 or P2 issue.
At FAD-06 closure, FAD-linked `T-080` through `T-083` remained deliberately
fail-closed until FAD-11, and no restricted auction could activate. FAD-08
through FAD-17 later closed locally, and FAD-18 subsequently completed the
schema-52 isolated shared-staging gate on `2026-08-18`.

The closed-write reset evidence, first-administrator and
reset-original-league continuity, `T-035` trade-deadline command, and `T-036`
initial activation command remain complete locally.

The canonical `T-145` final-standings command, exact noncanonical `T-098`
rebuild/replay boundary, and atomic `T-097` result-correction/replacement
command are complete locally as `T-037` prerequisites.
`T-145` creates one immutable provenance-complete final generation with exact
schedule and result-version evidence, audit, member notifications, scoped
outbox, season compare-and-swap, and idempotency-last replay. `T-098` cannot
create or replace that evidence and fails replay closed when its command,
snapshot, or row evidence changes. `T-097` appends one attributable correction
and, after finalization, replaces the complete canonical generation in the
same immediate transaction. It also restores an exactly paired matchup/week
recovery state before inserting replacement provenance and supports later
correction of a completed non-current season without changing the current
season. Focused correction gates pass `33/33`, adjacent/runtime gates pass
`92/92`, and independent review found no remaining blocker, P1, or P2.
The amended `T-037` scheduled Entry Draft-start rollover is complete locally.
It persists exact blocker and retry history, executes only from the scheduled
occurrence, preserves exact replay and rollback evidence, and keeps drafting
and trading closed until rollover succeeds.

FAD-08 closed its Entry Draft-completion seam without implementing the deferred
draft. The future final `T-108` selection or confirmed-forfeiture transaction
owns `entry_draft_completed`; the simulated final caller proves that its
terminal pick, `Complete` draft state, readiness operation, and canonical
pending job commit or roll back together. There is no manual completion or
public handoff route. Ordinary-inaugural `T-036` and initial-Season-2 `T-037`
own their exact no-draft triggers; reset-origin `T-036` activates without a
readiness handoff. Confirmed `T-095` schedule creation can only evidence and
correctively requeue the same blocked genuine-inaugural operation/job.

FAD-08 also completes the readiness worker and scheduler composition,
all-or-none carryover/card opening, and the locally composed `T-126` through
`T-129` service, HTTP, privacy, error, and read-only contracts. Exact T-128
replay returns its original immutable `202` receipt without a write after both
later blocking and terminal success. The final behavior package passes
`336/336`, and the independent schema package passes `64/64`, with no failed,
cancelled, or skipped case. Shared staging and production were not opened or
changed.

`FAD-09` is `COMPLETE - LOCAL ONLY (2026-08-08)`. T-130 and T-133 through
T-139 are jointly exposed in the local target runtime, increasing the target
endpoint inventory from `102` to `110`. Candidate writes, help, every
authoritative summer mutation, semantic provider-catalog revalidation,
shared-lease worker execution, and deadline reconciliation now use the
transaction-bound Candidate synchronizer. Deadline reconciliation terminalizes
outstanding occurrence-bound work as `deadline_reconciled` and fences stale
workers.

The launch defaults are `fad_candidate_write` at `120` per session and `600`
per league per `15` elapsed minutes, `fad_help_write` at `5` per session and
`25` per league per elapsed hour, and `fad_operational_write` at `30` per
session and `120` per league per `15` elapsed minutes. Closure gates pass
`60/60` provider occurrence/job/deadline tests, `262/262` summer-writer tests,
`36/36` direct Candidate HTTP-boundary tests, and `66/66` composed-runtime
tests. The local staging-verifier regression passes `9/9`, and reset bootstrap
passes `8/8`.

`FAD-10` is `COMPLETE - LOCAL ONLY (2026-08-09)`. T-131, T-132, and T-140 are
composed and contract-tested in the local target runtime, increasing the target
endpoint inventory from `110` to `113`. The runtime now executes the durable
deadline reminder and exact deadline lock, publishes every immutable 22-slot
Candidate snapshot atomically, exposes pending results without inventing a
decision, processes each player independently, and completes the allocation
lifecycle through the same-cycle coordinator -> per-player allocation ->
coordinator order before ordinary auction resolution. Zero-allocation FADs
take the same coordinator-owned direct transition to `rapid`; exact Candidate
ties remain scheduled or quarantined for the later restricted-auction gate.

The FAD-10 closure matrix passes `200/200` tests across `23` suites. Separate
acceptance gates pass `4/4` composed-runtime tests, `18/18` coordinator tests,
`103/103` shared-auction regression tests, and the post-amendment reminder gate
passes `7/7`. There is no frontend caller at this checkpoint. No shared staging
or production environment was opened, migrated, or changed.

`FAD-11` is `COMPLETE - LOCAL ONLY (2026-08-10)`. T-141 through T-144, the
FAD-linked T-080 through T-083 administration paths, atomic FAD completion, and
the shared transaction-owned restricted no-improvement fallback primitive are
implemented and verified locally. The fallback transaction revalidates current
allocation, draw, contender, rollover, lease, and recovery evidence; preserves
a complete immediate or future 24-hour window; and commits its source result,
allocation, fallback shell/context/draw, activation job when delayed, and
immediate activity/notification/outbox evidence atomically.

The local target runtime remains at `117` unique endpoint contracts. Recorded
FAD-11 gates on exact Node.js `24.14.1` pass `197/197` for the broader recovery/
correction/administration matrix, `96/96` for schema/runtime, `62/62` for
ordinary-auction compatibility, and `40/40` for the complete administration
repository. No frontend or shared environment was changed.

`FAD-12` is `COMPLETE - LOCAL ONLY (2026-08-10)`. It composes server-derived
restricted/fallback manager bidding and read/edit-limit projection; strict
current improvements; AAV/term ranking; committed exact-top draws; no-selection
reveals; restricted no-improvement fallback; allocation-linked fallback winner
or no-winner settlement; normal anti-bluff pricing; contract, ownership,
roster, allocation, activity, outbox, summer-synchronization, and winner late-
lock side effects; restricted/fallback activation; and exact immutable replay.

Deterministic resolution failures enter one causal recovery/correction chain;
transient failures retain their lease for expired reclaim. T-142 resumes the
exact failed auction, allocation, job, and recovery, and schema `43` permits
repeated failure and later successful automatic settlement only from the
latest matching failure event and completed retry receipt. The composed target
scheduler runs FAD resolution, restricted activation, and fallback activation
before the preserved ordinary auction resolver and then FAD completion.

Recorded FAD-12 gates on exact Node.js `24.14.1` pass `52/52` for resolver
policy/persistence/shared fallback, `15/15` for the application service and
durable runner, `71/71` for activation/job repositories, `50/50` for bid/HTTP/
read capability, `170/170` for ordinary auction/administration compatibility,
`303/303` for schema-43/current-head coverage, and `94/94` for final scheduler/
runtime/deployment/ordinary compatibility. The local target runtime remains at
`117` unique endpoint contracts.

At the FAD-12 checkpoint, `FAD-13` became the sole active slice. Direct and
queued open-rapid resolution, final-hour private nomination queueing, extension
rollovers, and completion recovery remained FAD-13 work; FAD-12 explicitly
rejected those resolution contexts. No frontend, shared staging, or production
environment was opened, migrated, deployed, or changed at that checkpoint.

`FAD-13` is `COMPLETE - LOCAL ONLY (2026-08-10)`. T-077 now derives an
immediate start with more than 60 minutes remaining or a private queued start
at the cutoff. Queued activation atomically opens the binding starter at the
exact rollover for a complete following cycle, including a required extension.
The shared FAD resolver now covers direct and queued open-rapid auctions,
including allocation-null winners, exact-top draws, no-bid return to the
unclaimed pool, deterministic recovery, transient reclaim, and exact T-142
retry. Open-rapid bid/edit/read behavior preserves the ordinary starter,
nonstarter, cooldown, no-withdrawal, and no-reservation rules.

The rollover finalizer ensures missing canonical jobs before the shared due,
claim, lease, exact-expiry reclaim, and retry path. It accounts for seven
initial and all required contiguous extension boundaries, blocks completion on
unfinished or recovery-required work, and records one causal restart-safe
finalization result. Atomic completion includes any required whole-Monday Week
1 recovery and future-job replacement. Matchup start revalidates FAD completion
inside its transaction, and ordinary weekly auctions open only after both
season start and FAD completion while preserving quarantine. The local target
runtime remains at `117` unique endpoint contracts on schema `47`.

Separate, overlapping Node.js `24.14.1` milestones pass `11/11` start-decision
policy, `10/10` immediate-start writer, `23/23` FAD start/lifecycle, `12/12`
ordinary creation compatibility, `125/125` queued activation, `22/22` focused
allocation-null resolution writer, `18/18` focused resolution service/runner,
`73/73` broader allocation-null resolution, and `122/122` bid/read
compatibility. Final gates pass `280/280` schema-47/current-head, `42/42`
rollover policy/writer/service/runner, `31/31` completion, `77/77` runtime
composition, and `15/15` matchup-start guard tests. These records overlap and
are not added into one aggregate total.

`FAD-14` is `COMPLETE - LOCAL ONLY (2026-08-11)`. Candidate Card opening now
requires the four approved metadata-only publication sets, exact eight-ID
realtime envelopes, recipient-scoped notification delivery, private queued-
nomination audiences, and reconnect reauthorization. The setup exemption
preserves `fad_setup_exemption_authorized` as the explicit eleventh FAD
Activity and thirteenth FAD notification, with the exact current commissioner,
safe copy, destination, deduplication identity, and three-event publication
set. The target endpoint inventory remains exactly `117` on schema `49`.

Separate closure evidence on pinned Node.js `24.14.1` passes the focused
FAD-14 core gate at `1,294/1,294` tests across `142` suites and `110` unique
test files, production JavaScript syntax at `95/95`, and the schema-49 pin,
runtime, reset, release, and staging-verifier selection at `265/265`. The
former-failure consolidation passes `189/189`. The authoritative full backend
gate passes `3,264` of `3,266` tests across `436` suites with zero failure,
cancellation, or todo in about `30m03.603s`; the two skips are the intentional
Windows `symlink` and `target` link-capability cases in
`sportsDataIoLiveCapabilityArtifactFoundation.test.js`.

`FAD-15` and `FAD-16` are `COMPLETE - LOCAL ONLY (2026-08-11)`. The server-
directed Candidate Card workflow, published cards/results, open and restricted
auction views, private queue confirmation, commissioner recovery, notification
destinations, deep-link reload, realtime reauthorization, cross-league cache
isolation, keyboard/focus, responsive, and accessibility paths are implemented.
Exact Node.js `24.14.1` frontend gates pass `316/316` tests across `52` files,
repository-wide lint, the production build across `1,782` transformed modules,
the dependency tree, and browser-authority verification across `19`
compatibility files and `154` shipped source files. The build has only the
existing advisory for one minified chunk above `500 kB`.

`FAD-17` is `COMPLETE - LOCAL ONLY (2026-08-11)`. FAD feature coverage records
`1,754/2,012` statements (`87.17%`) and `1,262/1,577` branches (`80.02%`). The
real disposable two-league Playwright release matrix passes `40/40` across
desktop Chromium, mobile Chromium, desktop Firefox, desktop WebKit, and mobile
WebKit with zero retries. Exact backend integrated gates pass `28/28` for the
schema-22-to-49 migration, fresh schema, repository catalog, reset/cutover, and
two-league fixture; `49/49` for the affected resolution service, real SQLite
writer, and durable job; and `202/202` for the representative mandatory FAD
policy, writer, late-lock, and ordinary-auction compatibility package, with no
failure, cancellation, or skip. The explicit no-bid renomination, simultaneous
unreserved aggregate wins, disabled/nonblocking video, distinct Week 1/help
chronology, read-only, privacy, restart, and recovery cases pass. T-076 through
T-083 and T-126 through T-144 are therefore `LOCAL VERIFIED`.

No FAD shared-staging or production environment was opened, migrated, deployed,
or changed through FAD-17; migrations `0023` through `0049` remained local only
at that checkpoint. FAD-18 later advanced the isolated staging environment to
schema `52`; production remained untouched.

The `2026-08-11` pre-mutation read-only hosting inspection recorded the then-
current Render staging rollback identity as deploy `dep-d9kmv0ijobas73fsp8kg`
at
backend commit `fa85e75c904389284a030459cd8a68f452cdac02`, still on the existing
schema-22 database path. The then-ready Netlify staging rollback deploy was
`6a6bede0e1742b6b750017cb`. The published frontend source head inspected was
`29d4d89ea6def41464fc48b6390e7f567c480039`; the published backend bridge
implementation plus checksum-fix head was
`26cf9606b8ee1f33efeb9e667cd265f947bc5387`, whose bridge implementation began
at `1ad052300ef00e82c16e6abfe2d0f1cc5a15dfbd`. Neither source head had been
deployed at that inspection. The final backend candidate was pending an
operator-reviewed provider-manifest commit at the time of inspection. Grae's
later 2026-08-11 clarification removes that manifest from the FAD candidate
gate. At that checkpoint, the provider-independent preflight amendment still
required implementation and verification before a new final-candidate identity
could be claimed. The inspection itself changed no environment, disk, database,
or production resource.

At that checkpoint, Grae had authorized the isolated FAD-18 staging gate, but
deployment remained blocked pending attached-service operator access, offsite
object storage and encryption, a current backup and clean restore, the approved
reset/import and schema-49 migration report, final candidate/deploy identities,
and the rollback record. The SportsDataIO probe manifest, paid key, live
observation, signing configuration, and capability artifact had already been
removed from the FAD-18 blocker set by Grae's 2026-08-11 clarification.

The FAD-18 local preflight discovered `158` focused and adjacent tests: `156`
passed, zero failed, and two intentional Windows link-capability cases skipped.
It pinned a contiguous base-22-to-target-49 migration source, `131` catalog entries,
`49` post-reset require-empty tables, valid reset-policy coverage, and a
quiesced Render probe blueprint. This local result did not satisfy the then-
missing resource, backup, restore, reset, deploy, or operator evidence. Its provider-
tool coverage remains historical implementation evidence only and does not
create an external-provider prerequisite for FAD.

At the pre-deployment checkpoint, the FAD-18 staging maintenance-hold bridge
was implemented and published to the backend `staging` branch but had not yet
been deployed. Exact `true` was accepted
only for the staging/production-Node, closed-write,
jobs/FAD/email/debug/backup-disabled, capture-only, provider-probe boundary.
That provider-probe prerequisite was a known code/configuration conflict: the
amended FAD-18 candidate had to support the same hold with provider
composition and the complete automatic matchup-occurrence runner disabled.
At that checkpoint the amendment was not yet implemented or tested. The bridge
dispatches before the target runtime import, opens no database, and exposes
only generic exact-path GET/HEAD liveness and readiness; every other request is
maintenance `503`. Hold readiness means only that this listener is live, not
that the application or database is ready. Missing or exact `false` preserves
ordinary startup, and every malformed or drifted hold fails before either
runtime starts.

The approved external sequence was bridge-on-old-schema-22, final preflight,
exact-final-build-held backup plus distinct clean-restore verification, and
complete fresh-path schema-49 reset/import handoff. Provider discovery and a
manifest commit were omitted. Only then could the same build activate hold-false
on the new path with provider composition and all automatic matchup occurrences
disabled while FAD, Entry Draft, auction, trade, and outbox jobs remain
available subject to their own gates. The old
schema-22 file remains
untouched and paired with the prior build for rollback. No bridge, backup,
reset/import, deploy, provider call, or shared database action had occurred at
the local checkpoint described above.

Exact Node `24.14.1` historical maintenance-transition tests pass `35/35`: hold
`6/6`, discovery `14/14`, publisher `9/9`, and independent verifier `6/6`. The
historical broader entrypoint, Render, preflight, target-runtime, hold, and
provider matrix passes `125/125`. The complete six-file provider-capability
family discovers `106` tests: `104` pass, two intentional Windows link-
capability cases skip, and none fail, cancel, or remain todo. At that
checkpoint, those results did not prove the new provider-independent FAD
startup path; focused amendment tests remained required.

FAD-18 subsequently completed that isolated staging sequence. The encrypted
pre-migration backup and distinct clean restore passed; the final backend
commit `9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68` migrated staging to schema `52`;
Render deploy `dep-da2147e417fc73brkqmg` passed the hosted Node `24.14.1` suite
at `3,356/3,356`; and Netlify deploy `6a8420054c9c5a624d86b2c3` serves frontend
application commit `50f2414cdda5926942975577f70114b5868917a9` with preserved source head
`2ba016c9d5e6b016a150a62da757f28a9c0140c0`. The authenticated, non-mutating
staging walkthrough passed. M7-25 is complete and archived; M7-26 is the sole
active UI-review plan.

Production remains untouched and unauthorized. No M4, M5, M6, or M7
implementation is deployed or enabled in production.

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
