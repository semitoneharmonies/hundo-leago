# Hundo Leago - Active Roadmap

## Document Status

`APPROVED`

## Roadmap Status

`ACTIVE`

This roadmap defines:

* the dependency-ordered path from the current documentation foundation to the 2026-27 Season 2 launch;
* the boundary between launch-critical, in-season, optional, and deferred work;
* the milestone gates that must be satisfied before higher-risk work begins;
* the relationship between the backend refactor, SQLite, security, multi-league conversion, feature completion, staging, and production cutover;
* the rule that only one contained work-plan step is active at a time;
* planning decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the roadmap-sequencing decisions and approved adoption of the resulting roadmap on 2026-07-18.

---

## Roadmap Purpose

Hundo Leago has approved product rules and technical designs, but much of the current application still uses:

* a large backend `server.js`;
* file-backed JSON;
* one global league;
* frontend-only identity;
* incomplete automated tests;
* production deployments without a fully isolated staging environment.

The roadmap converts that current system into the approved Season 2 platform without combining every risk into one rewrite.

The order is deliberate:

1. prove current behavior and data safety;
2. complete the structural backend seams;
3. introduce tested SQLite infrastructure;
4. implement secure identity and league boundaries;
5. move league features through those boundaries one vertical slice at a time;
6. prove the complete system in staging;
7. migrate and launch only with explicit authority.

---

## Out of Scope

This roadmap does not itself:

* authorize coding;
* authorize a production deployment;
* authorize a production reset or migration;
* change the current operating mode;
* replace feature specifications;
* assign exact calendar dates without evidence from implementation;
* move optional ideas into approved scope;
* permit multiple roadmap milestones to be implemented as one uncontrolled change.

Implementation authority comes from an approved active work plan plus Grae's request to execute that plan.

---

# Part 1 - Authority

## Required Foundation

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Approved rules and specifications own behavior. This roadmap owns order and gates.

If a roadmap milestone conflicts with a more authoritative document, implementation stops and the documents are reconciled before work continues.

---

## Current Operating Mode

The reviewed operating mode is:

```text
OFFSEASON_RESET
```

Large local and staging changes are permitted when planned and verified. Production data remains protected.

Only the explicitly approved Season 1 competition records may be reset through the future controlled reset procedure. This roadmap does not perform or authorize that reset.

---

## Product Target

```text
Project: Hundo Leago Season 2 - Standalone Multi-League Foundation
Season:  2026-27
```

The launch target is a secure standalone fantasy-hockey platform with:

* secure users and sessions;
* administrative league creation;
* memberships and team assignments;
* strict league isolation;
* SQLite authority;
* approved rosters, contracts, auctions, trades, buyouts, matchups, standings, and commissioner operations;
* repeatable testing;
* isolated staging;
* verified backup and restore;
* controlled production migration and recovery.

---

# Part 2 - Roadmap Rules

## One Active Work Step

Only one contained implementation step may be `ACTIVE`.

Other work may be:

* `READY` when every dependency is met;
* `BLOCKED` when it depends on unfinished work;
* `DEFERRED` when approved for later;
* `COMPLETE` when its evidence and completion gate are recorded.

Documentation may be prepared just in time for the active or next milestone, but it must not silently authorize adjacent code.

---

## Vertical Completion

After the structural foundations, features move as vertical slices.

A vertical slice includes the applicable:

* SQLite tables and constraints;
* repositories;
* domain rules;
* application services;
* authorization;
* `/api/v1` endpoints;
* Socket.IO invalidation when required;
* frontend workflow;
* League Activity, Security Audit, notification, job, or operational records;
* automated tests;
* focused manual verification.

A backend table without a usable and tested workflow is not a completed feature.

---

## Compatibility Before Replacement

Current unversioned endpoints remain compatibility behavior until their approved `/api/v1` replacement is working.

For each replacement:

1. characterize the current behavior;
2. implement the approved target behavior;
3. move the frontend caller;
4. verify local and staging behavior;
5. confirm no remaining caller depends on the compatibility endpoint;
6. retire it through a focused cleanup.

The broad `POST /api/league` endpoint is not a foundation for new features.

---

## Safety Before Speed

No milestone may bypass:

* copied or synthetic test data;
* read-only proof;
* league-isolation tests;
* transaction tests;
* backup and rollback;
* staging;
* exact verification evidence.

The absence of current manager activity does not make live storage disposable.

---

## Scope Boundaries

Launch-critical work takes priority over:

* visual polish;
* convenience additions;
* speculative analytics;
* media-generation ideas;
* commercial onboarding;
* billing;
* public self-service league creation;
* other Future Backlog items.

Approved self-service user sign-up is part of User Accounts. It does not grant league creation, membership, commissioner authority, or team control.

---

# Part 3 - Current Milestone Summary

| ID | Milestone | Status | Primary gate |
| --- | --- | --- | --- |
| M0 | Canonical foundation and approved design | `COMPLETE` | Active roadmap and work plan exist |
| M1 | Backend safety harness and behavior-preserving refactor | `COMPLETE` | Backend Refactor Step 13 passes |
| M2 | SQLite foundation, migration tooling, and repository conversion | `COMPLETE` | Verified staging SQLite database and restore |
| M3 | Secure accounts, permissions, leagues, teams, and memberships | `COMPLETE` | Two-league identity and authorization tests pass |
| M4 | Players, rosters, contracts, cap, retention, and buyouts | `COMPLETE` | Approved roster and cap invariants pass |
| M5 | Auctions, trades, activity, and notifications | `COMPLETE` | Transaction and concurrency suites pass |
| M6 | Matchups, statistics, standings, and commissioner recovery | `COMPLETE` | Accelerated season and correction tests pass |
| M7 | Frontend completion, staging release candidate, migration, and launch | `ACTIVE` | Launch checklist and explicit production authority |
| M8 | Required in-season completion | `DEFERRED` | Delivered before each league-calendar deadline |
| M9 | Optional and future backlog | `DEFERRED` | Explicit scope promotion by Grae |

`BLOCKED` describes dependency order, not a project failure.

---

# Part 4 - Milestone M0: Canonical Foundation

## Status

`COMPLETE`

## Completed Foundation

The canonical documentation now includes:

* North Star;
* Current State;
* Project Scope;
* Operating Mode;
* Glossary;
* League Rules;
* Scoring Rules;
* Permissions;
* approved product specifications;
* Architecture;
* Data Model;
* API Contracts;
* Backend Refactor;
* SQLite Migration;
* Security;
* Testing Strategy;
* Frontend Structure;
* Environment Setup;
* Backup and Restore;
* Deployment;
* Backend Endpoint Checklist;
* Manual QA Checklist;
* Release Checklist;
* this Active Roadmap;
* the Active Work Plan.

Both repositories contain agent instructions.

---

## Just-in-Time Document Status

Every just-in-time document identified by this roadmap is now approved:

```text
docs/07-testing/TESTING_STRATEGY.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
docs/08-operations/BACKUP_AND_RESTORE.md
docs/04-technical-specs/DEPLOYMENT.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/07-testing/RELEASE_CHECKLIST.md
```

The documentation queue is complete. M1 work items `BR-00` through
`BR-13`, M2 work items `M2-01` through `M2-14`, and the external M2
staging gate are complete. M3-01 through M3-21 and the M3 completion
gate are complete locally. The final backend passed `546/546`, the
frontend passed `57/57`, lint and build passed, and the ordinary-Chrome
connected-browser gate passed.

---

# Part 5 - Milestone M1: Backend Safety and Refactor

## Status

`COMPLETE`

## Objective

Create stable application, service, domain, repository, job, adapter, operation, and transport boundaries while preserving current compatibility behavior.

This milestone does not introduce SQLite, accounts, multi-league behavior, or new league rules.

---

## Sequence

The exact approved sequence is:

```text
BR-00  Baseline and safety harness
BR-01  Configuration and bootstrap
BR-02  Player read and reload module
BR-03  Statistics module and NHL adapter
BR-04  Snapshot and backup operations
BR-05  Matchup and standings pure calculations
BR-06  Matchup schedule commands
BR-07  Matchup jobs
BR-08  Auction resolution and snapshot jobs
BR-09  Broad league compatibility write
BR-10  JSON repository boundary
BR-11  Socket.IO compatibility restoration
BR-12  Remove feature code from root
BR-13  Refactor completion gate
```

Current sequence state:

```text
BR-00  COMPLETE
BR-01  COMPLETE
BR-02  COMPLETE
BR-03  COMPLETE
BR-04  COMPLETE
BR-05  COMPLETE
BR-06  COMPLETE
BR-07  COMPLETE
BR-08  COMPLETE
BR-09  COMPLETE
BR-10  COMPLETE
BR-11  COMPLETE
BR-12  COMPLETE
BR-13  COMPLETE
```

The Active Work Plan records M1 completion and authorizes no further implementation.

After each step:

* evidence is recorded;
* the current work plan is closed or advanced;
* the worktree is reviewed;
* the next step remains inactive until a separate work plan is approved.

---

## M1 Gate

M1 is complete only when:

* root `server.js` is a thin process entrypoint;
* the approved 34-route compatibility inventory remains registered, with six debug routes still conditional;
* routes do not own persistence;
* services own use cases;
* pure calculations receive time explicitly;
* JSON storage is behind repository adapters;
* jobs are independently testable and overlap-protected;
* Socket.IO compatibility invalidation works once per committed write;
* accelerated matchup-week simulation passes;
* read-only proof passes;
* every test uses temporary or synthetic data;
* no protected repository or production data changed.

---

# Part 6 - Milestone M2: SQLite Foundation and Migration

## Status

`COMPLETE`

## Objective

Introduce the approved SQLite runtime and replace JSON repository adapters without reorganizing the application again.

---

## Sequence

1. Pin Node `24.14.1` and exact `better-sqlite3` `12.11.1`.
2. Add the central connection factory and required PRAGMAs.
3. Add immutable migration files, checksums, and schema compatibility checks.
4. Implement the approved strict relational schema.
5. Implement SQLite repositories behind existing service interfaces.
6. Add source inventory and source-bundle hashing.
7. Add the explicit Season 1 reset manifest.
8. Add deterministic IDs and pure JSON transforms.
9. Add dry-run import, rejects, quarantine reporting, and reconciliation.
10. Add database-safe backup and restore verification.
11. Establish isolated staging storage and environment configuration.
12. Perform repeated deterministic staging imports.
13. Run integrity, foreign-key, count, money, ownership, and semantic checks.
14. Rehearse cutover and rollback without changing production authority.

Production cutover does not occur in M2 merely because the staging migration succeeds.

---

## M2 Gate

M2 is complete when:

* SQLite DDL implements the approved Data Model;
* migration checksums and startup version checks work;
* repository contracts pass against SQLite;
* copied current data imports deterministically;
* reset omissions exactly match the approved reset manifest;
* stable player identifiers are preserved;
* protected data is not omitted;
* `integrity_check` returns `ok`;
* `foreign_key_check` returns no rows;
* backup and clean-path restore pass;
* staging has a separate persistent disk and no production secret or storage access;
* no production migration has occurred.

---

## Completion Evidence

M2 completed on 2026-07-19 at backend commit
`734c52f865e1407dcd21fcc9ffa891ca4c022fb2`.

The exact commit passed a clean Render build and was deployed only to the
dedicated staging service and disk. Two clean current-data imports on
that disk produced identical `6,099`-row databases, zero rejects, zero
quarantine entries, identical semantic evidence, successful independent
verification, and byte-identical online backups, activation candidates,
rollback candidates, and canonical reports.

The post-gate audit confirmed a protected, network-isolated staging
environment, distinct staging and production disks, independent
staging secrets, disabled jobs, healthy JSON application authority, and
unchanged production service, disk, data, and authority. No production
migration or cutover occurred.

Detailed evidence is archived at:

`docs/06-work-plans/archive/M2-GATE_EXTERNAL_STAGING_ISOLATION_VERIFICATION.md`

---

# Part 7 - Milestone M3: Identity and Multi-League Core

## Status

`COMPLETE`

## Objective

Make the backend authoritative for identity, league access, team control, and platform administration.

---

## Feature Order

1. Remove shipped hard-coded frontend credentials and browser identity authority. `M3-01 COMPLETE`
2. Add users, credentials, account-action tokens, sessions, and Security Audit.
3. Add `scrypt` password storage and test-only account creation.
4. Add session cookies, expiry, replacement, revocation, CORS, Origin, and CSRF.
5. Add self-sign-up and email verification.
6. Add sign-in, sign-out, password change, password reset, deactivation, and reactivation.
7. Add durable authentication rate limits and generic public responses.
8. Add one-time first-platform-administrator bootstrap.
9. Add administrative league creation. `M3-10 COMPLETE`
10. Add memberships, commissioner assignment, teams, and manager assignments.
    `M3-11 INITIAL COMMISSIONER, M3-14 TEAM AUTHORITY, M3-15 INVITATIONS, M3-16 TEAM READ/CREATE, M3-17 MANAGER ASSIGNMENT, AND M3-18 TEAM PROFILE COMPLETE`
11. Add backend authorization policies and league-scoped repositories.
    `M3-12 COMPLETE`
12. Add authenticated league-scoped Socket.IO rooms.
    `M3-13 USER/LEAGUE AND M3-14 TEAM ROOMS COMPLETE`
13. Compose the local target runtime, then add the account and league-selection
    frontend. `M3-19 AND M3-20 COMPLETE`
14. Add provider-backed account email and required notifications.
    `M3-21 COMPLETE`

Work-plan progress: `M3-01` through `M3-04` are complete locally.
`M3-04` passed `17/17` focused, `47/47` combined security, `136/136`
cumulative foundation, and `309/309` complete backend tests. Grae
approved stable versioned HMAC-SHA-256 CSRF derivation from each opaque
random session token on 2026-07-20. `M3-05` is complete with `5/5`
focused, `39/39` combined security, `143/143` cumulative foundation,
and `316/316` complete backend tests passing. `M3-06` is complete with
`8/8` focused, `62/62` combined security, `151/151` cumulative
foundation, and `324/324` complete backend tests passing. On 2026-07-20
Grae approved M3-07 option 1, and `M3-07` is complete locally. Atomic
pending registration, encrypted durable action-link delivery, resend,
single-use activation, initial session creation, and isolated target HTTP
contracts passed `18/18` focused, `80/80` combined M3 account/security,
`169/169` cumulative foundation, and `342/342` complete backend tests under
Node `24.14.1`. `M3-08` is complete: its focused regression passed
`50/50`, combined M3 account/security passed `116/116`, cumulative
foundation passed `205/205`, and the complete backend passed `378/378`
under Node `24.14.1`. `M3-09` is complete: `14/14` focused,
`130/130` combined M3 account/security/migration/bootstrap, `219/219`
cumulative foundation, and `392/392` complete backend tests passed under
Node `24.14.1`. `M3-10` is complete: `18/18` focused, `148/148`
combined M3 account/security/bootstrap/administration, `237/237` cumulative
foundation, and `410/410` complete backend tests passed under Node `24.14.1`.
`M3-11` initial commissioner proposal, acceptance, and active membership is
complete: `16/16` focused, `164/164` combined M3, `253/253` cumulative
foundation, and `426/426` complete backend tests passed under Node `24.14.1`.
`M3-12` league-scoped authorization and authenticated read-only league
visibility is complete: `10/10` focused, `174/174` combined M3, `263/263`
cumulative foundation, and `436/436` complete backend tests passed under Node
`24.14.1`. `M3-13` authenticated user and league Socket.IO rooms is complete:
`15/15` focused, `190/190` combined M3, `279/279` cumulative foundation, and
`452/452` complete backend tests passed under Node `24.14.1`. `M3-14`
team-scoped manager authorization and authenticated team Socket.IO rooms is
complete: `7/7` focused, `197/197` combined M3, `286/286` cumulative
foundation, and `459/459` complete backend tests passed under Node `24.14.1`.
`M3-15` Option 1 is complete: `17/17` focused, `214/214` combined M3,
`303/303` cumulative foundation, and `476/476` complete backend tests passed
under Node `24.14.1`. `M3-16` authenticated team reads and commissioner-only
Setup team creation is complete: `9/9` focused, `223/223` combined M3,
`312/312` cumulative foundation, and `485/485` complete backend tests passed
under Node `24.14.1`. `M3-17` active-member manager assignment, transfer, and
removal is complete: `11/11` focused, `234/234` combined M3, `323/323`
cumulative foundation, and `496/496` complete backend tests passed under Node
`24.14.1`. `M3-18` team-profile representation, safe logo storage, and
versioned mutation is complete: `16/16` focused, `250/250` combined M3,
`339/339` cumulative foundation, and `512/512` complete backend tests passed
under Node `24.14.1`. `M3-19` local target-runtime composition and API
integration is complete: `21/21` focused, `271/271` combined M3, `360/360`
cumulative foundation, and `533/533` complete backend tests passed under Node
`24.14.1`. `M3-20` account and league-selection frontend integration is
complete: frontend tests passed `57/57`, the complete backend passed `533/533`,
lint and build passed, and ordinary Chrome passed the real-mobile, keyboard,
credential-clearing, history, action-link, and authority-free request gates.
`M3-21` provider-backed account email and required notifications is complete:
its focused provider, rendering, and job suite passed `12/12`, the complete
backend passed `546/546`, and no live provider request occurred. The M3
completion gate passed. Later milestone feature-order items remain inactive.

The Frontend Structure specification must exist before step 13.

---

## M3 Gate

M3 requires:

* no browser-only authentication path;
* no plaintext or hard-coded password in the shipped frontend;
* one active session per user;
* all expiry and revocation rules passing;
* CSRF and exact credentialed CORS passing in the deployed topology;
* user, commissioner, manager, and platform-administrator boundaries passing;
* platform administrators requiring active membership for internal league operation;
* public account flows not revealing account existence;
* at least two isolated test leagues;
* same display names and overlapping player pools not causing cross-league access;
* Socket.IO events isolated by authorized league room;
* Security Audit remaining separate from League Activity.

Gate result: `COMPLETE` on 2026-07-21. Detailed evidence is archived at
`docs/06-work-plans/archive/M3-GATE_SECURE_ACCOUNTS_PERMISSIONS_LEAGUES_TEAMS_AND_MEMBERSHIPS.md`.

---

# Part 8 - Milestone M4: League Assets and Cap System

## Status

`COMPLETE`

## Objective

Implement the authoritative player, roster, contract, retention, buyout, and salary-cap vertical slices.

---

## Feature Order

1. Global players and provider IDs. `M4-01 COMPLETE`
2. League-specific position corrections and ownership. `M4-02 COMPLETE`
3. Active, bench, injured-reserve, and prospect roster categories. `M4-03 COMPLETE`
4. Roster movements and legality. `M4-04 COMPLETE`
5. Contracts and contract-year schedules. `M4-05 COMPLETE`
6. Fantasy ELC signing and decline. `M4-06 COMPLETE`
7. Retained salary and yearly obligations. `M4-07 COMPLETE`
8. Buyout locks, contract elimination, player release, and yearly penalties. `M4-08 COMPLETE`
9. Authoritative cap calculation. `M4-09 COMPLETE`
10. Public roster projection with only approved fields. `M4-10 COMPLETE`
11. Commissioner roster and contract corrections. `M4-11 COMPLETE`
12. Frontend roster, contract, and cap integration. `M4-12 COMPLETE`

---

## M4 Gate

Tests prove:

* exactly 12 F and 6 D active capacity;
* four bench slots and `$4.00 AAV` bench maximum;
* four injured-reserve slots;
* unlimited eligible prospects;
* no goalies;
* correct position normalization;
* cap includes only active-player AAV, retention, and buyout obligations;
* prospects may remain off-cap after signing until moved out;
* a player cannot return to prospects after entering active, bench, or injured reserve;
* contracts are one to three years with no extension;
* contract total and AAV reconcile;
* retention and buyout schedules reconcile by season;
* transactions may create an illegal normal roster with warning;
* public roster reads do not write or expose private data;
* every record and operation remains league-scoped.

Gate result: `COMPLETE` on `2026-07-21`. Detailed evidence is archived in
`docs/06-work-plans/archive/M4-GATE_LEAGUE_ASSETS_AND_CAP_SYSTEM.md`.

---

# Part 9 - Milestone M5: Transactions and History

## Status

`COMPLETE`

## Objective

Implement auctions and trades as atomic league-scoped transactions using the approved assets and contract model.

---

## Feature Order

1. Auction creation window and player eligibility. `M5-01 COMPLETE`
2. Sealed bids, edits, cooldowns, and own-bid display. `M5-02 COMPLETE`
3. Durable auction-resolution job and anti-bluff contract pricing. `M5-03 COMPLETE`
4. Winning ownership, contract, roster placement, warning, activity, and outbox transaction. `M5-04 COMPLETE`
5. Trade proposals, participants, and independent simultaneous offers. `M5-05 COMPLETE`
6. Players, prospects, draft picks, player rights, retention, buyout penalties, and Future Considerations assets. `M5-06 COMPLETE`
7. Acceptance, decline, cancellation, expiry, and trade-deadline behavior. `M5-07 COMPLETE`
8. Atomic execution with unchanged transferred contract terms. `M5-08 COMPLETE`
9. League Activity and notifications. `M5-09 COMPLETE`
10. Commissioner correction and approved reversal behavior. `M5-10 COMPLETE`
11. Frontend auction, trade, activity, and notification integration. `M5-11 COMPLETE`

---

## M5 Gate

Tests prove:

* commissioners cannot view sealed bid values;
* managers see only their own bid values;
* joining minimums and one-to-three-year contract constraints pass;
* auction jobs do not resolve twice;
* auction shutdown and season rollover behavior pass;
* simultaneous proposals do not reserve assets prematurely;
* a completed trade cannot partially apply;
* draft picks may move repeatedly without losing ownership history;
* retained and buyout obligations remain explicit assets and schedules;
* failed validation changes nothing;
* outbox retry does not duplicate the transaction;
* League Activity contains approved transactions but no matchup or standings events.

Gate result: `COMPLETE` on `2026-07-21`. Detailed evidence is archived in
`docs/06-work-plans/archive/M5-GATE_TRANSACTIONS_AND_HISTORY.md`.

---

# Part 10 - Milestone M6: Season Competition

## Status

`COMPLETE`

## Objective

Complete launch-critical statistics, matchup, standings, and commissioner-recovery behavior.

---

## Feature Order

1. Provider-backed player-stat refresh and last-valid-cache protection. `M6-01 COMPLETE`
2. League and season matchup schedule generation. `M6-02 COMPLETE`
3. Matchup-week state machine and Monday `4:00 PM Pacific` lock. `M6-03 COMPLETE`
4. Team-specific locked lineups and scoring baselines. `M6-04 COMPLETE`
5. Illegal-at-lock and late-legality handling. `M6-05 COMPLETE`
6. Live player result calculation from baseline. `M6-06 COMPLETE`
7. Result finalization and correction. `M6-07 COMPLETE`
8. Read-only standings from finalized authoritative results. `M6-08 COMPLETE`
9. Durable scheduled-job occurrences, leases, and recovery. `M6-09 COMPLETE`
10. Commissioner matchup and standings recovery tools. `M6-10 COMPLETE`
11. Accelerated clock and complete-season simulation. `M6-11 COMPLETE`
12. Frontend matchup, standings, health, and commissioner integration. `M6-12 COMPLETE`

Normal-roster changes after lock do not change the current matchup snapshot.

Matchup and standings schedules, locks, baselines, results, corrections, rollover, and standings inputs remain outside League Activity.

---

## M6 Gate

Tests prove:

* week 1 is the first full NHL schedule week unless explicitly adjusted;
* pairings are as even as possible;
* locked player statistics begin at zero for the matchup period;
* an illegal team scores zero until a legal team-specific baseline is created;
* later normal-roster changes do not alter the locked matchup;
* scheduled occurrences do not execute twice;
* stale or failed statistics do not erase the last valid data;
* finalization and corrections are versioned;
* standings use only finalized results;
* standings reads never write;
* commissioner corrections are explicit and attributable;
* an accelerated regular season completes without waiting for real weeks.

Gate result: `COMPLETE` on `2026-07-22`. Detailed evidence is archived in
`docs/06-work-plans/archive/M6-GATE_SEASON_COMPETITION.md`.

---

# Part 11 - Milestone M7: Release Candidate and Launch

## Status

`ACTIVE`

## Objective

Prove the integrated platform, migrate approved production data, and launch through a controlled reversible process.

---

## Required Release Documents

Before this milestone can open:

```text
docs/04-technical-specs/DEPLOYMENT.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/07-testing/RELEASE_CHECKLIST.md
docs/08-operations/BACKUP_AND_RESTORE.md
```

---

## Release Sequence

1. Deploy isolated staging frontend and backend.
2. Confirm separate secrets, database, disk, users, and leagues.
3. Import a copied source bundle and apply the approved reset manifest.
4. Complete automated unit, integration, contract, security, migration, and recovery tests.
5. Complete written desktop and mobile manual QA.
6. Run at least two leagues through representative roster, contract, auction, trade, matchup, and standings workflows.
7. Rehearse backup, restore, deployment rollback, migration rollback, and provider failure.
8. Create the release candidate and freeze unrelated changes.
9. Review every launch gate and unresolved known issue.
10. Obtain Grae's explicit production reset, migration, and deployment authority.
11. Enter the approved maintenance window.
12. Execute the SQLite cutover sequence.
13. Run closed-mode smoke tests before manager writes.
14. Open traffic and resume jobs in controlled order.
15. Monitor application, database, WAL, jobs, email, and business totals.
16. Record the launch and preserve rollback evidence.

---

## M7 Gate

Launch is permitted only when:

* every launch-critical Project Scope item is complete or has an explicitly approved temporary replacement;
* staging is isolated and current;
* no critical or high-severity security issue remains open;
* backup restore has been demonstrated;
* migration reconciliation has no unexplained difference;
* two-league isolation passes;
* read-only and transaction guarantees pass;
* account email and recovery paths work;
* the release checklist is complete;
* the rollback boundary is understood;
* Grae explicitly authorizes the production operation.

---

# Part 12 - Milestone M8: Required In-Season Completion

## Status

`DEFERRED UNTIL AFTER INITIAL LAUNCH`

These features are approved and required before their league-calendar deadlines, but they do not block opening day when Project Scope says they may be completed during the season.

---

## Playoffs

Must be implemented and activated before the final four fantasy scoring weeks of the NHL regular season:

```text
Round 1: one week
Round 2: one week
Final:   final two NHL regular-season weeks
```

Real NHL playoff games do not count.

Playoff work requires an isolated feature flag, accelerated full-bracket tests, and a staging activation rehearsal.

---

## Entry Draft

Must be completed before the first Season 2 Entry Draft.

It includes:

* finalist placement;
* two weighted lottery draws without replacement;
* four linear rounds;
* current plus three future draft classes;
* five-minute clock;
* private queues;
* automatic best-player-available timeout selection;
* no skipped picks;
* immutable completed selections;
* on-clock traded-pick reset;
* prospect-right creation and approved re-entry.

The initial Season 2 launch does not require this interface.

---

## Season Completion and Rollover

Must be complete before the first Season 2 off-season:

* season finalization;
* historical results;
* contract-year advancement;
* contract expiration before the next Entry Draft;
* free-agency conversion;
* retention and buyout continuation;
* draft-order inputs;
* verified season-end snapshot;
* transition to the next approved operating mode.

---

## Future Free Agent Draft

The pre-season Free Agent Draft remains a future update.

It must receive its own approved product and technical specification before implementation. It does not replace the approved weekly auction system.

---

# Part 13 - Milestone M9: Optional and Deferred Work

## Status

`DEFERRED`

Optional work begins only after launch-critical and calendar-required work is safe.

Examples include:

* expanded player comparison and filters;
* additional historical statistics;
* non-critical branding and visual polish;
* additional convenience tools;
* presentation-video ideas;
* commercial onboarding and billing;
* public self-service league creation;
* speculative automation not approved in Project Scope.

An item moves out of this milestone only when Grae approves the scope change and the canonical documents are updated.

---

# Part 14 - Cross-Cutting Requirements

## Testing

Every milestone adds tests at the lowest useful level:

* domain unit tests;
* repository and database tests;
* service transaction tests;
* HTTP contract tests;
* authorization and league-isolation tests;
* scheduled-job tests with fixed time;
* frontend component and workflow tests;
* written manual QA;
* staging and release smoke tests.

Passing `npm run build` alone is not feature verification.

---

## Observability

Before launch, safe observability must cover:

* request correlation;
* error codes and durations;
* scheduled-job occurrences;
* outbox delivery;
* external provider refresh;
* database and WAL health;
* backup and restore;
* migration;
* security-rate limits and audit;
* release and rollback.

Logs must not contain secrets, raw tokens, passwords, active bid values, or unrestricted private payloads.

---

## Documentation

At every milestone gate:

* Current State is updated with implemented facts;
* the roadmap status is updated;
* the completed work plan is archived;
* the next work plan is activated;
* known issues are recorded;
* behavior changes update their owning specification only with proper authority.

Approved documents must not be rewritten merely to match accidental code.

---

## Git and Repository Boundaries

Frontend and backend remain separate repositories and separate commits.

Each implementation step:

* begins with `git status --short`;
* preserves unrelated local changes;
* stages only its own files when Grae requests a commit;
* avoids force-push and history rewrites;
* records the branch and verification;
* does not deploy merely because a branch is pushed.

---

# Part 15 - Current Next Action

The current next action is:

```text
Milestone: M7 - Release Candidate and Launch
Action: Complete Grae's independent M7-11 staging review and record any acceptance defects; do not touch production
Implementation status: M7-01 through M7-11 COMPLETE ON STAGING; USER ACCEPTANCE AND SEPARATE RELEASE GATES REMAIN; PRODUCTION REMAINS BLOCKED
Repositories: E:\hundo-leago and E:\hundo-leago-backend
Branches: staging and staging
```

The governing designs are defined in:

```text
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
```

M2-01 through M2-14 and the external staging gate are complete. M3-01
is complete locally: the focused security verifier, full lint, build,
isolated connected-browser visual and interaction checks, GET-only
network evidence, anonymous reload, Socket.IO invalidation, backend
suite, and protected hashes all passed. M3-02 is also complete locally:
its focused suite passed `15/15`, its cumulative foundation suite passed
`104/104`, and the complete backend suite passed `276/276`. M3-03 is
also complete locally: its focused suite passed `15/15`, its combined
security suite passed `30/30`, its cumulative foundation suite passed
`119/119`, and the complete backend suite passed `292/292`. M3-04 is
also complete locally: its focused suite passed `17/17`, combined
security passed `47/47`, cumulative foundation passed `136/136`, and
the complete backend suite passed `309/309`. Grae approved stable
versioned HMAC-SHA-256 CSRF derivation from each opaque random session
token. M3-05 is complete with `5/5` focused, `39/39` combined security,
`143/143` cumulative foundation, and `316/316` complete backend tests
passing. M3-06 is complete with `8/8` focused, `62/62` combined
security, `151/151` cumulative foundation, and `324/324` complete
backend tests passing. M3-07 is complete with `18/18` focused, `80/80`
combined M3 account/security, `169/169` cumulative foundation, and
`342/342` complete backend tests passing under Node `24.14.1`. M3-08 is
complete with `50/50` focused regression, `116/116` combined M3
account/security, `205/205` cumulative foundation, and `378/378` complete
backend tests passing. M3-09 is complete with `14/14` focused, `130/130`
combined M3, `219/219` cumulative foundation, and `392/392` complete
backend tests passing under Node `24.14.1`. The Active Work Plan now records
the M3-10 platform-administrator authorization and administrative league
creation boundary. M3-10 is complete with `18/18` focused, `148/148`
combined M3, `237/237` cumulative foundation, and `410/410` complete
backend tests passing. M3-11 is complete with `16/16` focused, `164/164`
combined M3, `253/253` cumulative foundation, and `426/426` complete backend
tests passing. M3-12 is complete with `10/10` focused, `174/174` combined M3,
`263/263` cumulative foundation, and `436/436` complete backend tests passing.
M3-13 is complete with `15/15` focused, `190/190` combined M3, `279/279`
cumulative foundation, and `452/452` complete backend tests passing. The
M3-14 is complete with `7/7` focused, `197/197` combined M3, `286/286`
cumulative foundation, and `459/459` complete backend tests passing. The
M3-15 is complete with `17/17` focused, `214/214` combined M3, `303/303`
cumulative foundation, and `476/476` complete backend tests passing. M3-16 is
complete with `9/9` focused, `223/223` combined M3, `312/312` cumulative
foundation, and `485/485` complete backend tests passing. M3-17 is complete
with `11/11` focused, `234/234` combined M3, `323/323` cumulative foundation,
and `496/496` complete backend tests passing. M3-18 is complete with `16/16`
focused, `250/250` combined M3, `339/339` cumulative foundation, and `512/512`
complete backend tests passing. M3-19 is complete with `21/21` focused,
`271/271` combined M3, `360/360` cumulative foundation, and `533/533` complete
backend tests passing. M3-20 is complete with `57/57` frontend tests,
`533/533` backend tests, lint, build, and the connected ordinary-Chrome gate
passing. M3-21 is complete with `12/12` focused provider/rendering/job tests
and `546/546` complete backend tests. The M3 completion gate passed with
`57/57` frontend tests, lint, build, and the connected ordinary-Chrome gate.
M4-01 and M4-02 are complete locally. M4-02 passed `7/7` focused tests,
`39/39` combined M4/M2/M3 compatibility tests, and `560/560` complete backend
tests across 140 suites under Node `24.14.1`. M3 through M6 and their
milestone gates are now complete locally. M7-01 through M7-07 are complete
locally with the deterministic two-league fixture, integrated loopback
rehearsal, recovery checks, `893/893` backend tests, `95/95` frontend tests,
lint, build, syntax, and rendered local evidence recorded. M7-08 completed the
exact source freeze, complete local gate rerun, separate frontend/backend
candidate commits, and publication of only the staging branches. M7-09
deployed the isolated staging services, then hosted acceptance failed on
player-detail, matchup-player-statistics, and reconnect recovery gates. M7-10
completed the staging-only SportsDataIO catalog import, deterministic fixture
and reset, commissioner roster tools, audit evidence, those acceptance repairs,
redeployment, and focused hosted retesting. The live staging site is ready for
Grae's independent retest. That review opened M7-11 for real fixture-player
identities, the authenticated team workspace and roster presentation, player
filtering/sorting/comparison and auction handoff, friendly trade and activity
presentation, and account/team settings. M7-11 is complete on staging. Its
frontend `110/110` test gate, lint, production build, browser-authority
verifier, and backend `967/967` test gate under Node `24.14.1` pass. The
exact release `HL-20260726-2` published frontend application commit
`1233c3c6185d4f7edfa8dcedc8d59dcedce0f0a5` and backend commit
`e7f089ecc81ca9fa17b8b0143949b760668f66d1` only to the dedicated staging
services. Schema `19`, backup, integrity, reset, hosted desktop/narrow-mobile,
manager workflow, and direct cross-league denial checks pass. Persisted
keyboard ordering and the DOM drag-event handler pass; manual native pointer
drag remains in user acceptance because the browser controller could not
synthesize the gesture. Production cutover remains separately authorized.

---

# Part 16 - Roadmap Completion

The launch roadmap is complete only when:

* M1 through M7 gates pass;
* the application is operating the approved Season 2 release;
* production migration and launch evidence is preserved;
* no unresolved discrepancy exists between approved rules and the running system;
* required in-season M8 work has dated follow-up plans;
* optional work remains deferred unless explicitly promoted.

---

# Verification

```powershell
Get-Content docs/05-roadmap/ACTIVE_ROADMAP.md
Select-String -Path docs/05-roadmap/ACTIVE_ROADMAP.md -Pattern '^`APPROVED`$','^`ACTIVE`$','M2','M3','COMPLETE','M4','READY','M7 Gate'
```

Expected result:

* document status is `APPROVED`;
* roadmap status is `ACTIVE`;
* M1 and M2 are complete, including the external staging gate;
* M3 through M6 and their milestone gates are complete locally;
* M7-01 through M7-11 are complete on the dedicated staging services;
* M7-11 passed its local automated, migration, reset, hosted desktop/mobile,
  manager workflow, and league-isolation gates, while manual native pointer
  drag and Grae's independent acceptance remain;
* launch requires staging, backup, recovery, testing, and explicit production authority;
* deferred work remains outside the launch path.
