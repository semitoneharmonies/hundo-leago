# Hundo Leago — Project Scope

## Document Purpose

This document defines the approved scope of the current Hundo Leago development project.

It separates:

* work required before the 2026–27 season begins;
* work required later during the 2026–27 season;
* work that is useful but optional;
* work that is explicitly deferred.

This document exists to prevent uncontrolled feature growth.

A feature mentioned in the North Star or future backlog is not automatically approved for immediate development.

Last reviewed: **2026-07-14**

---

## Current Project

The current project is:

**Hundo Leago Season 2 — Standalone Multi-League Foundation**

Target league season:

**2026–27**

Current operating mode:

`OFFSEASON_RESET`

The current active development period is the Summer 2026 off-season.

The active implementation schedule is maintained in:

`docs/05-roadmap/ACTIVE_ROADMAP.md`

---

## Primary Objective

Prepare Hundo Leago to operate the 2026–27 fantasy hockey season as a standalone platform.

The application must no longer depend on another fantasy provider for its core league-management, matchup, scoring, and standings systems.

The project must also establish the foundation for multiple separate leagues.

The initial Season 2 release does not need to support public self-service league creation.

---

## Definition of a Successful Season 2 Launch

Hundo Leago is ready to begin the 2026–27 season when:

1. Users can securely access their own accounts.
2. Users can see only the leagues and teams they are authorized to access.
3. An authorized administrator can create and configure leagues.
4. League-specific data cannot leak into another league.
5. Teams, rosters, salaries, and contracts are stored reliably.
6. The main auction, trade, and buyout systems work within the correct league.
7. Matchups, scoring, and standings can operate without another fantasy platform.
8. The backend uses SQLite for authoritative mutable league data.
9. Production data can be backed up and restored.
10. The application has a separate staging environment for testing.
11. Major workflows have written verification procedures.
12. The team can launch and recover the application without manually editing production data files.
13. The application can operate without recurring emergency commissioner intervention.

---

# Part 1 — Required Before the 2026–27 Season Begins

The following work is launch-critical.

These items must be completed, tested, or deliberately replaced by an approved temporary solution before the real league begins using Season 2.

## 1. Canonical Documentation

The project must have:

* one canonical North Star;
* one current-state document;
* one project-scope document;
* one operating-mode document;
* one active roadmap;
* repository instructions for Codex;
* an organized documentation index;
* archived versions of replaced documents.

Codex must be able to find the correct project documents without relying on chat history.

---

## 2. Repository Instructions

Both repositories must contain an appropriate `AGENTS.md`.

The frontend and backend instructions must:

* identify the purpose of each repository;
* direct Codex to the canonical shared documentation;
* require verification after code changes;
* prohibit unapproved destructive production actions;
* preserve read-only endpoint behaviour;
* require league isolation;
* require small, reviewable steps unless an approved work plan supports a larger coordinated change.

---

## 3. Backend Refactor

The existing backend refactor must be completed far enough that the application is reasonably understandable and maintainable.

The backend should separate major responsibilities such as:

* route registration;
* business services;
* scheduled jobs;
* validation;
* data access;
* persistence;
* recovery and backup operations.

The refactor must preserve existing behaviour unless a separate approved specification explicitly changes that behaviour.

The backend refactor and SQLite migration must remain distinguishable changes, even when their work overlaps.

---

## 4. SQLite Persistence

SQLite must become the authoritative storage system for mutable league data.

The SQLite work must include:

* an approved data model;
* schema creation;
* migration tooling;
* schema-version handling;
* backup procedures;
* rollback procedures;
* migration verification;
* record-count reporting;
* protection against accidental production overwrite.

Existing JSON data must not be silently deleted during development.

JSON files may remain as:

* migration input;
* temporary compatibility data;
* player or statistics cache files where approved;
* historical backup material.

---

## 5. Multi-League Foundation

The backend must support more than one league.

Each league-specific record must be associated with the correct league.

This includes, where applicable:

* memberships;
* teams;
* rosters;
* contracts;
* auctions;
* bids;
* trades;
* buyouts;
* retained salary;
* draft assets;
* matchup schedules;
* matchup locks;
* results;
* standings;
* league settings;
* activity history.

The application must prevent one league from reading or modifying another league’s information.

At least two test leagues must be used to verify isolation.

---

## 6. Administrative League Creation

Season 2 must allow an authorized platform administrator to create leagues.

For the initial release:

* only Grae or another explicitly authorized administrator may create a league;
* normal users may not create their own leagues;
* public league onboarding is not required;
* automated payment or subscription setup is not required.

Administrative league setup must support the minimum information necessary to operate a league, including:

* league name;
* league season;
* commissioner;
* teams;
* league settings;
* scoring configuration;
* matchup schedule preparation.

---

## 7. User Accounts and Authentication

Season 2 requires secure user accounts.

The minimum account system must support:

* user creation by an authorized administrator;
* secure password storage;
* login;
* logout;
* authenticated sessions;
* authorization checks on the backend;
* league membership;
* team assignment;
* commissioner and administrator permissions.

Frontend-only team selection is not sufficient authentication.

A user must not be able to impersonate another team by modifying a browser request.

Advanced public account recovery may be deferred if a safe administrator-managed recovery procedure exists.

---

## 8. Permissions

The application must distinguish between:

* platform administrator;
* league commissioner;
* team manager;
* unauthenticated visitor.

The backend—not only the frontend—must enforce permissions.

At minimum:

* managers can act only for their authorized teams;
* commissioners can use approved league-administration tools;
* platform administrators can create and manage leagues;
* unauthorized users cannot perform write operations;
* commissioner and administrator actions are logged.

---

## 9. Teams and Memberships

Season 2 must support:

* users belonging to leagues;
* users being assigned to teams;
* teams belonging to one league;
* commissioners belonging to the leagues they manage;
* users participating in more than one league when approved.

The meaning of “membership” must be formally documented in the data model and glossary.

---

## 10. Rosters

The roster system must support the approved 2026–27 roster model.

At minimum, it must handle:

* player ownership;
* active roster assignments;
* injured-reserve assignments;
* roster-size limits;
* positional requirements;
* roster legality;
* salary calculations;
* contract display;
* player identifiers;
* league isolation.

Any additional categories such as inactive players, prospects, or player rights must be explicitly approved in the roster specification before implementation.

---

## 11. Contracts

The Season 2 contract system must support the minimum approved contract model.

This is expected to include:

* player salary;
* contract length;
* remaining contract years;
* contract ownership by team and league;
* contract creation;
* contract expiration;
* contract updates through approved transactions;
* retained salary;
* buyout consequences;
* contract history or activity records.

The exact contract-year cap, renewal process, free-agent signing process, and penalty rules must be finalized in:

`docs/03-product-specs/CONTRACTS.md`

Speculative contract types must not be implemented until approved.

---

## 12. Salary Cap and Roster Legality

The backend must consistently calculate:

* team salary;
* retained salary;
* buyout penalties;
* remaining cap;
* roster size;
* positional legality;
* other approved restrictions.

All frontend cap displays must use the same authoritative backend calculations.

Known disagreements between cap displays must be resolved.

---

## 13. Auctions

The existing blind-auction system must be adapted for Season 2.

Launch-critical auction behaviour includes:

* authenticated bidding;
* league-specific auctions;
* team-specific permissions;
* player-ID validation;
* bid validation;
* minimum bids;
* edit restrictions;
* cooldown rules;
* deterministic tie handling;
* scheduled resolution;
* winning-player assignment;
* contract creation or attachment;
* activity logging;
* protection against duplicate processing.

The exact business rules belong in:

`docs/03-product-specs/AUCTIONS.md`

A more elaborate annual free-agent draft system is not automatically required for the initial launch unless it is added to the active roadmap.

---

## 14. Trades

The trade system must support league-specific authenticated transactions.

Launch-critical functionality includes:

* proposing a trade;
* accepting or rejecting a trade;
* trade expiration;
* ownership validation;
* roster and contract validation;
* salary retention where approved;
* automatic cancellation when required;
* activity logging;
* duplicate-processing protection.

Draft picks or player rights may be traded only after their data model and rules are approved.

---

## 15. Buyouts

The buyout system must continue to support:

* approved penalty calculations;
* player release;
* contract consequences;
* retained or continuing cap consequences;
* transaction history;
* league-specific state;
* authenticated permissions.

Any proposed penalty-decay system is deferred until explicitly approved.

---

## 16. Player Database

Season 2 must preserve the centralized player database and stable player identifiers.

The system must continue to support:

* player search;
* player detail;
* NHL team;
* position;
* age or birth date;
* active status;
* current statistics where available.

Player ownership, contracts, auctions, trades, and matchup records must reference stable player IDs.

---

## 17. Statistics

The application must obtain and cache the player statistics necessary for the approved scoring system.

The launch version must support:

* scheduled statistics refresh;
* protected manual refresh;
* fantasy-point calculation;
* games played;
* goals;
* assists;
* other approved scoring categories;
* understandable failure reporting;
* use by matchups and player pages.

The system must handle temporary external-data failures without erasing the last valid cache.

---

## 18. Matchups

The existing matchup engine must be hardened for Season 2.

Launch-critical behaviour includes:

* a stored matchup schedule;
* league-specific schedules;
* explicit matchup-week boundaries;
* scoring baselines;
* roster locks;
* legal-team handling;
* late legality handling where approved;
* weekly scoring;
* result finalization;
* rollover;
* duplicate-processing protection;
* activity and health information;
* commissioner recovery controls.

A complete matchup week must be testable in minutes without waiting for a real calendar week.

---

## 19. Standings

Season 2 must provide read-only league standings calculated from finalized matchup results.

Standings must be:

* league-specific;
* season-specific;
* derived from authoritative results;
* rebuildable;
* understandable;
* protected from normal manager writes.

The exact sorting and points rules belong in:

`docs/02-rules/SCORING_RULES.md`

---

## 20. Commissioner Tools

The commissioner must be able to operate and recover the league without directly editing production JSON or database records.

Required tools may include:

* league and team administration;
* roster corrections;
* contract corrections;
* matchup recovery;
* week scheduling;
* controlled result correction;
* snapshot creation;
* backup visibility;
* activity review;
* emergency freeze or maintenance controls.

Commissioner overrides must be explicit and logged.

A commissioner tool must not silently bypass league rules without recording the action.

---

## 21. Activity History and Audit Trail

Important write operations must produce understandable activity records.

The activity system should include:

* actor;
* league;
* affected team;
* action type;
* relevant player or transaction;
* timestamp;
* before-and-after context where practical;
* commissioner override identification.

The audit trail must survive the SQLite migration.

---

## 22. Staging

A staging environment must exist before production launch.

Staging must use:

* a separate frontend deployment;
* a separate backend deployment;
* separate environment variables;
* separate SQLite data;
* test users;
* test leagues;
* no production persistent disk;
* no production credentials unless explicitly safe and read-only.

Grae, Marty, and Parker must be able to use staging.

---

## 23. Backups and Recovery

Before launch, the team must have written and tested procedures for:

* backing up production data;
* verifying the backup;
* restoring data;
* rolling back a failed deployment;
* preserving season-end snapshots;
* comparing data before and after migration;
* responding to missing or corrupted data.

A backup is not considered complete until it has been verified.

---

## 24. Testing

The project must have a repeatable testing process for launch-critical systems.

This includes:

* backend endpoint checks;
* authentication tests;
* permission tests;
* multi-league isolation tests;
* roster and cap tests;
* contract tests;
* auction tests;
* trade tests;
* buyout tests;
* matchup simulation;
* rollover tests;
* standings tests;
* migration tests;
* backup and restore tests;
* browser testing;
* mobile testing;
* staging testing;
* production smoke tests.

Parker’s manual testing must use a written checklist rather than unstructured clicking alone.

---

# Part 2 — Required During the 2026–27 Season, but Not Necessarily Before Opening Day

Some features are necessary to complete a full standalone season but may be delivered after the season begins, provided their delivery date occurs safely before the league needs them.

These items still require planning and cannot be forgotten.

## 1. Playoffs

The platform must support playoffs before the real league reaches its playoff period.

Playoff work may include:

* qualification;
* seeding;
* brackets;
* playoff matchup scheduling;
* scoring windows;
* advancement;
* championship results;
* commissioner recovery tools.

Playoff development during the active season must be isolated and thoroughly tested before activation.

---

## 2. Entry Draft

The platform must eventually support the league’s approved entry-draft process.

Before the draft is needed, the system may require:

* draft order;
* lottery results;
* traded draft picks;
* future draft-pick ownership;
* player rights;
* drafted-player records;
* commissioner-entered draft results;
* entry-level contract decisions.

A complete live online draft room is not automatically required.

A commissioner-managed or imported draft process may satisfy the initial version if it is approved and documented.

---

## 3. Season Completion and Rollover

Before the end of the 2026–27 season, the system must support:

* season finalization;
* historical results;
* contract-year advancement;
* expiring contracts;
* retained obligations;
* draft-order inputs;
* season-end snapshots;
* transition into `OFFSEASON_PRESERVE`.

This work must be completed before the first off-season in which teams and contracts carry over.

---

# Part 3 — Optional if Time Allows

The following may be added only after launch-critical work is safe.

* improved player comparison tools;
* expanded historical statistics;
* advanced filters;
* improved team branding;
* additional commissioner convenience tools;
* visual polish;
* accessibility improvements beyond critical blockers;
* performance improvements;
* improved mobile layouts;
* additional automated tests;
* better notifications;
* clearer league activity presentation.

Optional work must not delay launch-critical work.

---

# Part 4 — Explicitly Out of Scope for the Initial Season 2 Release

The following are not approved launch requirements.

## Public league creation

Normal users will not create leagues themselves.

League creation remains an administrative function.

## Commercial billing

The project does not currently require:

* subscriptions;
* payment processing;
* invoices;
* commissioner licences;
* trial periods;
* automatic plan enforcement.

## Public open registration

The project does not require anyone on the internet to create an account without administrator involvement.

## Dedicated mobile application

A native iPhone or Android application is not part of the current launch.

The website should remain usable on mobile browsers.

## Full self-service password recovery

Email-based password-reset automation may be deferred if a safe administrator-assisted recovery process exists.

## Social and community features

The project does not currently require:

* public profiles;
* league chat;
* direct messaging;
* social feeds;
* public league discovery;
* community rankings.

## Advanced monetization and commercialization

Marketing sites, sales automation, billing dashboards, customer support systems, and commercial onboarding are deferred.

## Every possible league-rule variation

Season 2 does not need to support every fantasy-hockey format.

The first version should support the approved Hundo Leago rules and a limited set of clearly chosen configuration options.

## Experimental game systems

The following are not approved unless moved into active scope:

* fatigue;
* hot and cold streaks;
* rivalry bonuses;
* performance bonuses;
* late-lock penalties;
* complex front-loaded contracts;
* complex back-loaded contracts;
* unrestricted contract models;
* retained-salary decay;
* buyout-penalty decay.

These ideas belong in the future backlog.

## Unrestricted commissioner power

Commissioners should have useful recovery tools, but they should not receive undocumented tools that silently bypass all validation.

---

# Part 5 — Scope Rules for Codex and Contributors

## Approved work only

Codex may implement only:

* work explicitly requested by Grae;
* work included in an approved product specification;
* work included in an approved technical specification;
* work included in the active roadmap or work plan;
* necessary supporting changes clearly required by the approved task.

## No silent feature expansion

Codex must not add extra functionality merely because it appears useful.

Examples include:

* adding public registration while implementing login;
* adding user-created leagues while implementing admin-created leagues;
* adding new scoring categories while modifying statistics;
* changing contract rules while refactoring contract code;
* changing API behaviour during a behaviour-preserving refactor.

## Report adjacent work

When Codex discovers related work that is not required for the current task, it should report it separately rather than silently implementing it.

## Preserve approved behaviour

A refactor must preserve behaviour unless the task explicitly authorizes a behaviour change.

## Resolve contradictions

When approved documents contradict one another, Codex must stop and report:

* the conflicting documents;
* the conflicting rules;
* the likely effect on the task.

Codex must not silently choose whichever rule is easier to implement.

## One controlled step at a time

Work should normally be divided into contained, verifiable changes.

A larger coordinated change is permitted only when:

* the operating mode permits it;
* an approved technical specification exists;
* an approved work plan defines the steps;
* rollback and verification are included.

---

# Part 6 — Scope Change Authority

Only Grae may approve a material change to the current project scope.

A scope change should update the appropriate documents, which may include:

* this file;
* the active roadmap;
* a product specification;
* a technical specification;
* the decision log;
* the future backlog.

Codex must not edit this document unless Grae explicitly requests a scope change.

Marty and Parker may recommend scope changes, risks, or priorities, but Grae makes the final scope decision.

---

## Related Documents

* `docs/01-project/NORTH_STAR.md`
* `docs/01-project/CURRENT_STATE.md`
* `docs/01-project/OPERATING_MODE.md`
* `docs/05-roadmap/ACTIVE_ROADMAP.md`
* `docs/05-roadmap/FUTURE_BACKLOG.md`
* `docs/10-decisions/DECISION_LOG.md`

The North Star defines the long-term product direction.

This document defines what is currently approved for development.
