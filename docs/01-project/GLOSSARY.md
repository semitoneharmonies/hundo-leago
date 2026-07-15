# Hundo Leago — Glossary

## Document Purpose

This document defines the standard meanings of important Hundo Leago terms.

These definitions apply across:

* product specifications;
* technical specifications;
* database design;
* API documentation;
* frontend wording;
* testing;
* Codex instructions;
* team discussions.

When a document uses one of these terms differently, it must clearly state that exception.

Last reviewed: **2026-07-14**

---

# Product and Season Terms

## Hundo Leago

The complete fantasy hockey platform, including:

* the frontend;
* the backend;
* league data;
* player data;
* statistics;
* documentation;
* deployment systems;
* league-management features.

## Product Season

A major version of Hundo Leago prepared for a particular period of the product’s development.

Examples:

* Product Season 1 — league-management companion platform;
* Product Season 2 — standalone multi-league platform.

A product season describes the application version and capabilities.

It is not a database record for a particular league competition.

## League Season

A specific competition period belonging to a league.

Example:

```text
2026–27
```

A league season may contain:

* teams;
* rosters;
* contracts;
* matchup weeks;
* standings;
* playoffs;
* draft information;
* season results.

One league may eventually have many historical league seasons.

## In-Season

A period when managers are actively using Hundo Leago for real league activity.

During an active season, stability and data preservation take priority over major structural changes.

## Off-Season

A period between active league seasons.

The off-season may allow larger development changes, but it does not automatically mean league data is disposable.

The authoritative status is defined in:

```text
docs/01-project/OPERATING_MODE.md
```

## Launch

The point when a new product version is approved for real league use.

A deployment is not automatically a launch.

A launch requires the relevant testing, data preparation, backups, and release checks.

---

# User and Permission Terms

## User

A person with an account in Hundo Leago.

A user may participate in one or more leagues.

A user does not automatically control a team merely because the account exists.

## Platform Administrator

A user with authority across the Hundo Leago platform.

The initial platform administrator is Grae.

Platform-administrator responsibilities may include:

* creating leagues;
* assigning league commissioners;
* managing platform-level settings;
* performing approved recovery operations;
* accessing administrative tools unavailable to normal commissioners.

A platform administrator is not the same as a league commissioner.

## Commissioner

A user authorized to administer a particular league.

A commissioner’s authority applies only to the leagues they are authorized to manage unless they are also a platform administrator.

Commissioner actions should be explicit and logged.

## Manager

A user authorized to control a team.

A manager may perform approved team actions such as:

* managing rosters;
* submitting bids;
* proposing trades;
* responding to trades;
* managing lineups;
* making contract decisions where permitted.

A manager must not act for an unauthorized team.

## Unauthenticated Visitor

A person accessing the application without a valid authenticated session.

An unauthenticated visitor may access only explicitly public or login-related functionality.

## Role

A named category of authority.

Initial roles include:

* platform administrator;
* commissioner;
* manager.

A role describes what kinds of actions may be permitted.

Actual access may also depend on league membership and team assignment.

## Permission

Authorization to perform a specific action.

Examples:

* create a league;
* edit league settings;
* submit an auction bid;
* manage a team roster;
* correct a matchup result.

Permissions must be enforced by the backend.

Hiding a frontend button is not sufficient permission enforcement.

## Authentication

The process of proving which user is making a request.

Examples include:

* logging in;
* validating a password;
* validating an authenticated session.

## Authorization

The process of determining whether an authenticated user may perform a particular action.

Authentication answers:

> Who is this user?

Authorization answers:

> Is this user allowed to do this?

## Session

A securely managed authenticated login state.

A session allows the backend to identify the user across multiple requests without sending the password repeatedly.

---

# League Organization Terms

## League

An independent fantasy hockey competition inside Hundo Leago.

Each league has its own:

* name;
* settings;
* commissioner;
* memberships;
* teams;
* rosters;
* contracts;
* transactions;
* matchups;
* standings;
* activity history.

One league’s data must not affect another league.

## League ID

A stable identifier assigned to a league.

League-specific records should use the league ID rather than relying only on the league name.

League names may change. League IDs should remain stable.

## League Isolation

The requirement that information and actions belonging to one league cannot leak into or modify another league.

League isolation applies to:

* database queries;
* API endpoints;
* frontend displays;
* permissions;
* scheduled jobs;
* backups;
* tests.

## Membership

A record connecting a user to a league.

A membership may include information such as:

* user ID;
* league ID;
* league role;
* team assignment;
* active or inactive status.

A membership answers:

> How is this user connected to this league?

A user account alone does not establish league access.

## Team

A fantasy hockey organization belonging to one league.

A team may have:

* a name;
* a logo;
* one or more authorized managers;
* a roster;
* contracts;
* cap obligations;
* draft assets;
* matchup results;
* standings records.

A team belongs to exactly one league.

## Team ID

A stable identifier assigned to a team.

Team records should use the team ID rather than relying only on the team name.

A team may be renamed without changing its identity.

## Team Assignment

The connection authorizing a user to manage a particular team.

A team assignment may be represented through a league membership or a separate related record, depending on the approved data model.

## League Settings

Configuration applying to one league.

Examples include:

* salary cap;
* roster limits;
* scoring weights;
* matchup schedule;
* contract-year limits;
* enabled rule options.

League settings must not silently change during an active season.

---

# Player Terms

## Player

A real hockey player represented in the Hundo Leago player database.

A player may exist in the database without being owned by a fantasy team.

## Player ID

The stable identifier used to reference a player.

Player IDs—not names alone—must be used for:

* ownership;
* contracts;
* auctions;
* trades;
* matchup scoring;
* statistics;
* draft rights.

## Player Record

The central information stored for a player.

A player record may include:

* player ID;
* full name;
* first name;
* last name;
* birth date;
* position;
* NHL team;
* active status.

## Active Player

A player currently recognized as active by the player-data source or Hundo Leago’s approved player-state process.

This does not mean the player is on a fantasy team’s active roster.

## Free Agent

A player who is available to be acquired under the rules of a particular league.

A player may be a free agent in one league while owned in another league.

Free-agent status is therefore league-specific.

## Owned Player

A player connected to a team through an active ownership, roster, or contract record.

The approved data model will determine the exact relationship.

## Player Rights

A league-specific asset giving a team controlled rights to a player without necessarily placing that player on the active roster.

Player rights may apply to drafted prospects or other approved categories.

The exact rules must be defined before implementation.

## Prospect

A player treated under the league’s approved prospect rules.

A prospect is not simply any young player.

Prospect eligibility, roster treatment, rights, salary, and contract rules must be defined in the roster or draft specification.

---

# Roster Terms

## Roster

All players and player rights currently connected to a team under the approved league rules.

Depending on the approved roster model, the roster may include:

* active players;
* inactive players;
* injured-reserve players;
* prospects;
* player rights.

## Active Roster

Players occupying active roster positions.

The active roster may determine:

* roster legality;
* positional minimums;
* matchup eligibility;
* salary treatment.

The exact scoring relationship must be defined in the Matchups specification.

## Active Lineup

The players eligible to accumulate fantasy points for a particular matchup period.

The active lineup may be the same as the active roster or may be a selected subset, depending on the approved rules.

The terms must not be treated as interchangeable unless the product specification explicitly says they are.

## Inactive Roster

An approved roster category for players owned by a team but not currently occupying an active roster position.

This category is not considered implemented until its limits, salary treatment, movement rules, and matchup effects are approved.

## Injured Reserve

A roster category for players meeting the approved injured-reserve eligibility rules.

Injured reserve may be abbreviated as:

```text
IR
```

The exact eligibility and salary treatment belong in the Roster specification.

## Roster Assignment

A record connecting a player or player right to a team and roster category.

## Roster Move

An approved change in a player’s roster assignment.

Examples may include:

* active roster to injured reserve;
* injured reserve to active roster;
* inactive roster to active roster.

## Roster Legality

Whether a team’s roster satisfies all applicable league requirements.

Requirements may include:

* maximum roster size;
* positional minimums;
* salary cap;
* contract rules;
* injured-reserve rules;
* lineup requirements.

## Positional Minimum

The minimum number of players from a position group required for a legal roster or lineup.

## Position Group

The Hundo Leago category used for roster and scoring rules.

Current general position groups include:

* forward;
* defence;
* goalie.

Exact source positions may be normalized into these groups.

---

# Contract and Salary Terms

## Contract

A league-specific agreement connecting a player to a team under defined salary and term conditions.

A contract may include:

* league ID;
* team ID;
* player ID;
* salary;
* original term;
* remaining years;
* start season;
* expiration season;
* status;
* acquisition source.

## Salary

The cap amount assigned to a player contract.

Salary is not the player’s real NHL salary.

## Salary Cap

The maximum approved cap amount a team may carry under the league rules.

## Cap Hit

The amount a particular contract or obligation contributes to a team’s salary-cap calculation.

## Cap Space

The amount remaining below the salary cap.

A standard calculation is conceptually:

```text
salary cap − total cap obligations
```

The backend must be authoritative for this value.

## Cap Obligation

Any record that contributes to a team’s cap total.

Examples may include:

* player salaries;
* retained salary;
* buyout penalties;
* other approved penalties.

## Contract Term

The number of league seasons covered by a contract.

## Remaining Contract Years

The number of league seasons left on a contract, including or excluding the active season according to the approved contract specification.

The exact counting rule must be explicitly documented.

## Contract-Year Limit

A league restriction on the total contract years a team may hold.

The precise formula and applicability must be defined in the Contract specification.

## Expiring Contract

A contract reaching the end of its approved term.

An expiring contract does not automatically determine the player’s future status until the approved expiration process runs.

## Retained Salary

A cap obligation kept by a former team as part of a trade.

The player may belong to a new team while the former team continues carrying an approved portion of the salary.

## Retention Slot

A league-limited record representing one retained-salary obligation.

## Buyout

A transaction ending a player’s contract or ownership while creating the approved buyout consequences.

## Buyout Penalty

The cap obligation created by a buyout.

The calculation and duration must be defined in the approved league and contract rules.

---

# Transaction Terms

## Transaction

An approved action changing league state.

Examples include:

* roster moves;
* auctions;
* trades;
* buyouts;
* contract changes;
* commissioner corrections.

## Auction

A process through which teams bid for a free agent.

The exact visibility, timing, minimum bids, edit rules, tie-breaking, resolution, and contract effects belong in the Auction specification.

## Blind Auction

An auction in which teams cannot see competing bids before resolution.

## Bid

A team’s submitted offer for a player.

A bid may include:

* team;
* player;
* salary;
* contract term;
* submission time;
* edit history;
* status.

## Auction Resolution

The process that validates bids, chooses the winning bid, assigns the player, creates or updates the contract, and records the outcome.

Auction resolution must be protected against duplicate processing.

## Trade

An approved exchange of league assets between teams.

Trade assets may include only those explicitly supported by the product specification.

## Trade Proposal

A pending trade offered by one team to another.

## Salary Retention

A trade condition in which one team continues to carry part of a player’s cap obligation after the player is transferred.

## Draft Pick

A league-specific asset representing a selection in a future or current entry draft.

A draft pick should identify:

* league;
* draft year or season;
* round;
* original team;
* current owner.

## Activity Record

A durable record explaining an important league action.

An activity record may include:

* actor;
* league;
* team;
* action;
* timestamp;
* affected records;
* relevant before-and-after information.

## Audit Trail

The broader history formed by activity records and other traceable system events.

An audit trail should make it possible to understand how important league state changed.

---

# Matchup and Scoring Terms

## Matchup

A competition between two teams during a defined matchup week.

## Matchup Week

A persisted scoring window with explicit boundaries.

A matchup week is not merely a calculated calendar label.

It may include:

* week ID;
* start time;
* baseline time;
* lock time;
* end time;
* rollover time;
* team pairings.

## Week ID

A stable identifier for a matchup week.

Example:

```text
W01
```

The exact format may change, but references should use the stored identifier rather than calculating identity from dates alone.

## Week Start

The time when the matchup scoring window begins.

## Baseline

A stored snapshot of cumulative player statistics used as the starting point for calculating points earned during a matchup week.

## Baseline Time

The time at which the baseline should be captured.

## Baseline Delta

The difference between a player’s current cumulative fantasy points and the stored baseline.

Conceptually:

```text
weekly fantasy points = current cumulative fantasy points − baseline fantasy points
```

## Roster Lock

The event that records which players are eligible to score for a team during a matchup week.

## Lock Time

The scheduled time when eligible teams should lock.

## Locked Roster

The persisted roster snapshot used to determine matchup eligibility.

A locked roster must not silently change when the team later changes its normal roster.

## Legal Team

A team whose roster satisfies the approved requirements at the relevant validation time.

## Illegal Team

A team whose roster does not satisfy the approved requirements.

The Matchups specification defines how illegality affects locking and scoring.

## Late Lock

A lock occurring after the scheduled lock time because a previously illegal team later became legal, when this behaviour is approved.

## Fantasy Point

A scoring value calculated from player statistics according to the approved scoring rules.

Fantasy point may be abbreviated as:

```text
FP
```

## Fantasy Points Per Game

Average fantasy points earned per game played.

Fantasy points per game may be abbreviated as:

```text
FPG
```

## Matchup Result

The finalized outcome of a matchup.

A result may include:

* team totals;
* winner;
* loser;
* tie;
* finalized time;
* source matchup week.

## Finalization

The process that calculates and stores the official result of a completed matchup week.

Finalization should be idempotent.

## Idempotent

Safe to run more than once without creating duplicate effects.

For example, an idempotent rollover must not advance two weeks merely because the same job ran twice.

## Rollover

The process that closes a matchup week and advances league state to the next week.

Rollover may include:

* finalizing results;
* updating standings;
* advancing the current week;
* preparing the next week;
* recording completion.

## Standings

The ordered league table calculated from finalized results.

Standings may include:

* wins;
* losses;
* ties;
* standings points;
* winning percentage;
* fantasy points for;
* fantasy points against;
* point differential.

## Read-Only Standings

Standings that normal users may retrieve but may not directly edit.

Corrections must occur through approved result or commissioner-recovery processes.

---

# Draft Terms

## Entry Draft

The league process used to allocate eligible newly drafted or prospect players.

## Draft Order

The ordered sequence in which teams hold draft selections.

## Draft Lottery

The approved method used to determine some or all draft-order positions.

## Drafted-Player Rights

The rights held by a team after selecting a player, before or instead of immediately adding the player to a normal contract and roster.

## Entry-Level Contract

A contract type that may apply to drafted players under approved league rules.

Entry-level contract may be abbreviated as:

```text
ELC
```

No ELC rules are considered implemented until formally approved.

---

# Technical Terms

## Frontend

The React and Vite application displayed in the user’s browser.

The frontend:

* displays data;
* accepts user input;
* sends requests to the backend;
* receives live updates.

The frontend is not the authoritative source of league state.

## Backend

The Node.js and Express application responsible for:

* authoritative league state;
* permissions;
* validation;
* business rules;
* persistence;
* scheduled processing;
* APIs;
* Socket.IO updates.

## API

The interface through which the frontend or another approved client communicates with the backend.

## Endpoint

A specific API method and path.

Examples:

```text
GET /api/players
POST /api/stats/refresh
```

The HTTP method is part of the endpoint identity.

## Read-Only Endpoint

An endpoint that retrieves information without changing stored league state.

A read-only endpoint must remain read-only.

It must not create, edit, reset, migrate, or delete data as a hidden side effect.

## Write Endpoint

An endpoint intentionally authorized to change stored state.

Write endpoints require appropriate validation and permission checks.

## Request

Information sent to an API endpoint.

## Response

Information returned by an API endpoint.

## Source of Truth

The authoritative location from which a particular type of information is determined.

For mutable league state, the backend is the source of truth.

A source of truth should not have competing copies that can silently disagree.

## Schema

The defined structure of stored data.

A schema describes records, fields, types, relationships, and constraints.

## Schema Version

A stored number identifying which approved data structure a database or state file uses.

## Migration

A controlled process that converts data or system structure from one approved version to another.

A migration must not be treated as an unverified rewrite.

## Database Migration

A migration changing the database schema or transferring data into a new database structure.

## SQLite

The planned embedded relational database for authoritative mutable league data.

## JSON

A text-based data format currently used for league state, player data, and statistics caches.

Some JSON files may remain appropriate for read-oriented caches or migration input even after SQLite is introduced.

## Repository

A Git-controlled project folder with its own history and remote GitHub location.

Hundo Leago currently has separate frontend and backend repositories.

## Branch

An independent Git line of development.

Work should occur on a suitable branch before being merged into production’s `main` branch.

## Commit

A recorded Git snapshot containing an intentional group of changes.

Unrelated changes should not be combined in the same commit.

## Pull Request

A GitHub review process proposing that changes from one branch be merged into another branch.

Pull request may be abbreviated as:

```text
PR
```

## Refactor

A change to code structure intended to improve organization or maintainability without changing approved behaviour.

A refactor must not be used to hide feature or rule changes.

## Behaviour Change

A change affecting what the application does from the perspective of users, stored data, APIs, scheduled jobs, or league rules.

## Validation

The process of checking whether input or a proposed action satisfies required rules before it is accepted.

## Repository Layer

Code responsible for reading and writing stored data.

A repository layer separates data access from routes and business rules.

## Service Layer

Code responsible for business operations and feature logic.

A service may coordinate validation, repositories, transactions, and activity logging.

## Route

Backend code connecting an HTTP endpoint to validation and business logic.

A route should not contain unrelated large amounts of persistence or feature logic when that logic belongs in services or repositories.

## Scheduled Job

Backend work triggered automatically at a defined time or interval.

Examples include:

* statistics refresh;
* roster locking;
* matchup rollover;
* backup creation.

## Socket.IO Update

A live event sent from the backend to connected frontend clients.

The current general league-change event is:

```text
league:updated
```

---

# Environment and Safety Terms

## Local Development

Running the frontend and backend on a developer’s computer.

Local development should use local or explicitly safe test data.

## Development Environment

An environment intended for coding and early testing.

It may contain temporary instability and disposable data.

## Staging

An online test environment designed to resemble production without using production data or production storage.

Staging is used for team testing and launch rehearsal.

## Production

The real deployed Hundo Leago environment used by the league.

Production may include:

* the Netlify frontend;
* the Render backend;
* the production database;
* persistent storage;
* production environment variables;
* scheduled jobs.

## Production Data

Real league or platform information stored by the production environment.

Production data must not be assumed disposable merely because the league is in the off-season.

## Environment Variable

Configuration supplied outside the source code.

Examples may include:

* API addresses;
* secrets;
* storage paths;
* feature controls.

Secrets must not be committed to Git.

## Secret

Sensitive configuration such as:

* passwords;
* tokens;
* signing keys;
* private credentials.

Secrets must not be written into public documentation, source files, or Git history.

## Persistent Disk

Render storage intended to survive backend restarts and deployments.

Production data files must use the approved persistent-disk paths rather than temporary deployment storage.

## Backup

A recoverable copy of important data.

A backup is not considered reliable until it has been verified.

## Snapshot

A point-in-time capture of important application or league state.

A snapshot may be used for:

* recovery;
* migration verification;
* season-end preservation;
* comparison.

A snapshot is not automatically a substitute for a complete backup strategy.

## Restore

The process of replacing or rebuilding current data from an approved backup or snapshot.

Restore actions are destructive and require explicit authorization and verification.

## Rollback

Returning code, configuration, or data to a previously approved state after a failed change.

## Smoke Test

A brief set of checks confirming that the most important parts of a deployed application start and respond correctly.

## Verification

Evidence that a change worked and did not create known unintended effects.

Verification may include:

* automated tests;
* curl requests;
* browser checks;
* record-count comparisons;
* logs;
* database queries.

## Test Fixture

Controlled test data designed to reproduce a scenario consistently.

Test fixtures may be used to simulate:

* auctions;
* trades;
* matchup scoring;
* illegal rosters;
* rollovers;
* migrations.

## Feature Flag

A controlled setting that enables or disables a feature or behaviour.

A feature flag is not a substitute for testing or documentation.

## Operating Mode

The documented project condition controlling acceptable development risk and data-preservation requirements.

Available modes are defined in:

```text
docs/01-project/OPERATING_MODE.md
```

---

# Documentation Terms

## North Star

The document defining Hundo Leago’s product identity, direction, and non-negotiable principles.

## Current State

The document describing what is actually implemented now.

## Project Scope

The document defining what work is approved, required, optional, or deferred.

## Product Specification

A document defining how a feature must behave from the user and league perspective.

## Technical Specification

A document defining how a system or major technical change should be structured and implemented.

## League Rules

Authoritative rules applying across league features.

## Roadmap

A prioritized sequence of project milestones over a planning period.

A roadmap is not a complete feature specification.

## Work Plan

A contained execution plan for a current technical task.

A work plan may define:

* steps;
* affected files;
* risks;
* verification;
* rollback.

## Decision Log

A record of important approved decisions and their reasoning.

## Future Backlog

A list of possible future work that is not currently approved for implementation.

## Known Issue

A confirmed problem with the current system.

A future idea is not a known issue.

## Canonical Document

The approved authoritative version of a document.

Older or duplicate versions must not override the canonical document.

## Archived Document

A historical document preserved for reference but no longer active.

Archived documents must not be treated as current requirements.

---

## Definition Authority

These definitions should be used unless a more specific approved document clearly defines a narrower meaning.

When two approved documents use the same term differently:

1. Identify the conflict.
2. Do not guess which meaning applies.
3. Correct the documents before implementing dependent behaviour.

Only Grae may approve material changes to the project’s canonical terminology.
