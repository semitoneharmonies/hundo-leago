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

On 2026-08-11, Grae separated FAD/Entry Draft player-catalogue needs from
matchup statistics. New-season counters begin at zero; neither draft requires
statistics or a paid live provider. FAD-18 therefore has no SportsDataIO
manifest/key/artifact gate. Provider-neutral completed-game cumulative refresh
with four scheduled evening runs is a later matchup/statistics slice whose
exact times and implementation remain unapproved and incomplete.

The preseason FAD-only staging candidate disables the shared automatic
matchup-occurrence runner in full: statistics refresh, baseline, normal lock,
finalization, and matchup-week rollover occurrences do not run. FAD, Entry Draft, auction,
trade, and outbox workers remain available subject to their own gates. The
later provider-neutral slice must restore or split the runner deliberately.

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
| M6 | Matchups, statistics, standings, and commissioner recovery | `COMPLETE — ORIGINAL GATE; JULY 29 AMENDMENT REOPENED IN M7` | Accelerated season/correction tests plus amended late-snapshot proof |
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
5. Illegal-at-lock and late-legality handling. `M6-05 COMPLETE` for the
   original baseline-only contract; the July 29 whole-game exclusion amendment
   is reopened under the active M7/FAD gate.
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

* an authorized commissioner or administrator explicitly selects a valid Week
  1 start, with no fixed-date substitution;
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

This is the historical result for the original approved contract. The
2026-07-29 amendment does not rewrite that evidence, but the launch gate is
open again until a late legal snapshot atomically persists immutable
player/game exclusion evidence and excludes every already-underway NHL game in
full, including post-baseline events, under replay and racing attempts.

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

## Free Agent Draft Launch Gate

The core annual Free Agent Draft is launch-critical and must reach its final
rapid rollover no later than the first Season 2 matchup start.

The approved product specification is:

```text
docs/03-product-specs/FREE_AGENT_DRAFT.md
```

The project has now approved:

* the related technical specification, now approved at
  `docs/04-technical-specs/FREE_AGENT_DRAFT.md`;
* the completed M7-25 implementation sequence archived at
  `docs/06-work-plans/archive/M7-25_FREE_AGENT_DRAFT_IMPLEMENTATION_SEQUENCE.md`;
* the Candidate Card, allocation, restricted-auction, rapid-scheduler, privacy,
  recovery, and migration test strategy embodied by those documents.

`FAD-01` through `FAD-18` and M7-25 are complete through isolated staging.
FAD-18 reached `STAGING VERIFIED` on schema `52` on `2026-08-18`; the exact
release is recorded at
`docs/07-testing/release-runs/FAD_AUCTIONS_PLAYERS_UX_2026-08-18.md`.
Production remained untouched and unauthorized. M7-26 is the sole active
full-site UI-review plan.

The M7-26 candidate targets schema `54` with `54` migration files, `133`
application tables/repository-catalog entries, and `134` physical tables
including `schema_migrations`. Its composed runtime registers `123` routes and
its conceptual contract catalogue contains `148` entries after T-147
notification batch acknowledgement and T-148 trade approval.

### Fresh M7-26 rerun - 2026-08-22 (blocked; abort-recovered; verified held recovery complete)

Release `HL-20260822-1` is no longer active. Exact frontend build
`4dfe12d1366314e3d9df722c50771324647743c9`, sealed Netlify baseline
`6a8a3880f946cc39a2bf2bb6`, exact backend commit
`8e313902feefcd683b0f5edd746a9dd2a9029a18`, held deploy
`dep-da5l8drtqb8s73ar74sg`, backup verification, and fixture prepare/replay all
passed their recorded gates. Additive helper deploy
`6a8b678ddbcf0b4ea8ba623c`, title
`HL-20260822-1-strict-helper-fe6d2dd`, published at
`2026-08-23T21:35:11.134Z`; canonical and immutable checks passed all four
helper-file byte/header boundaries and preserved the sealed critical files.

A browser then opened the physical `.html` path instead of the sole authorized
extensionless path. Initialization immediately reported `STRICT_STOP /
ORIGIN_GUARD / EXACT_STAGING_ORIGIN_REQUIRED`, kept every control disabled,
and made no request. The tab was closed without replacement. The full hold
never lifted, Render logged zero requests from `21:35Z` through `21:42Z`, and no
session check, proposal, acceptance, publisher, replay, or backend write ran.
The strict smoke therefore never began, and the release-specific contract made
abort recovery mandatory.

The exact abort plan classified `prepared_only` with `none/none`, source
SHA-256 `c26fdebc...`, absent target, zero mutations, and verified temporary
cleanup. Abort execute/replay preserved the source, materialized and verified
the clean target at plaintext SHA-256 `cf3ca07d...`, created receipt SHA-256
`b846edcffca67b1e6ba29e7ff2d1335d44f30ab251bc4daf40e9dd49de920592`, and
reported first/replay mutations `0/2` then `0/0`. Both record
`releaseBlocked: true` and `rollbackOnly: true`. Sealed-baseline deploy
`6a8b6b25126dabed39fa404d` retired the helper at
`2026-08-23T21:50:30.415Z`; baseline checks and all `10/10` retired helper-path
checks passed across canonical and immutable origins.

Only `DATABASE_PATH` was then merge-updated to the clean target. Held cutover
deploy `dep-da5mmpu417fc73807ptg` reached `LIVE` at
`2026-08-23T22:41:18.393652Z` as the then-newest deploy on exact B after all `3,503`
hosted tests passed. Instance/startup and held health/readiness/maintenance
checks passed. Corrected exact-Node-`24` verifier v2 returned
`HL_POST_CUTOVER_TARGET_VERIFIED`, proving the preserved source, authoritative
clean target, abort receipt, full hold/provider absence, target integrity and
identity, zero sessions, all ten fixture/transfer artifact counts `0`, and
owned scratch cleanup without opening the authoritative database. Fresh backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6` and separate plaintext/integrity/
foreign-key verification passed. At that recovery boundary no replacement
release ID, helper, controlled unhold, smoke, restore exception, activation,
or production authority existed. Fresh `HL-20260823-1` was separately
authorized later; production authority still does not exist. Exact historical evidence is in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-22.md`.

### Historical M7-26 attempt - 2026-08-21 (blocked and recovered)

Release `HL-20260821-1` was active but became blocked on isolated staging.
Held Render deploy `dep-da4e092fngtc739dipm0` passed `3,428/3,428` tests at
exact backend commit
`a747430500fbf6887dd748e5e3dfc0ecee77dc07`; verified backup/restore preceded
the schema-`52`-to-`54` migration; repeated authority previews required no
reconciliation; and pre/post public FAD receipt scans were read-only and safe.
Held final deploy `dep-da4gkpoed13c739gm0dg` then passed `3,440/3,440` tests at
exact commit `fe6047552857376b490756ff63ac593d431ee561`. A verified backup
preceded rotation of nine synthetic release-QA credentials and one synthetic
session revocation; its exact receipt replay wrote zero rows, and the
post-rotation backup verified. Netlify deploy `6a89709ffc9c88762ae8e74e` published
exact frontend commit `0e8eee92e2e323dd7f25ec3112988feaf23f96f0` after the
privacy/documentation candidate `c119f119ffd4aa96635fe382792e704d535a7cbd`.

Quiescent deploy `dep-da4hm30jo6nc73d26l80` passed `3,440/3,440`, health,
session/CORS/cache, and basic sequential Chrome smoke for the administrator and
two manager accounts. Notifications and strict FAD tie/manager-transfer gates
were not run because FAD routes remained disabled. The shared staging QA
password was then disclosed in chat and is treated as compromised without
recording its value.

Second rotation `HL-20260821-2` then replaced all nine synthetic credentials,
revoked zero sessions, wrote its exact receipt, and replayed with zero writes.
Verified backup `adcbbbab-e857-4cae-af71-dbce95553ce5` is the exact strict
sidecar restore point. The isolated sidecar and release-bound fresh-path
restore materializer focused gates pass. Their combined exact Node `24.14.1`
candidate then passed `3,500` of `3,502` local tests with only two intentional
Windows capability skips and zero failures, was committed/published at
`23971a4d66ee6383c6ad54339e769dbc9a76561e`, and passed `3,502/3,502` hosted
tests with clean startup in held deploy `dep-da4p5hu7bikc73aaeiq0`. All pinned
environment/full-hold/provider-absence and path/sidecar boundaries passed.
The exact backup reverified, and strict sidecar preparation reported
`writeCount: 744`, receipt `0ed590d8-832a-469a-848e-f91b0b37fe56`, then an
exact zero-write replay. Controlled-unhold deploy
`dep-da4pvcrl550s738l8rmg` reached `LIVE`, but strict smoke stopped after phase
one: Manager A reached required `null 2/1/1`, while Manager B reached
`complete 3/1/1` instead of required `complete 2/1/1`. No return proposal or
phase-two action ran. Sealed-baseline Netlify deploy
`6a8a09c13d5e25282f64d2c7` removed the temporary helper.

The full hold was restored and remains active. Abort recovery and exact replay
passed. `DATABASE_PATH`-only target deploy `dep-da51hjvqj5pc73bh8g3g` is
`LIVE` on exact backend `23971a4d66ee6383c6ad54339e769dbc9a76561e` after
passing `3,502/3,502` hosted tests; read-only temporary-copy target
verification and post-cutover backup
`2044fcae-24e8-4392-a1ac-4064d9cd2807` also passed. The release remains
`BLOCKED` and M7-26 remains `ACTIVE`. Staging was not reopened, final jobs were
not restored, production remains untouched and unauthorized, and no archive
transition occurred. Detailed evidence is in
`docs/07-testing/release-runs/M7_FULL_SITE_UI_REVIEW_2026-08-21.md`.

This historical release remains blocked; it is no longer the active execution.

Separate launch gates remain outside the strict rerun: T-005 membership/default
bootstrap completion; proactive live Socket.IO disconnect after session
revocation or replacement in T-004/T-006/T-007/T-009/T-011; provider-neutral
statistics/matchup job operation; T-067/T-093 late-legal already-underway-game
exclusion; T-074 atomic buyout cancellation for both contract and
`prospect_right` pending-trade assets; and the production migration that still
requires separate explicit authority. The current T-074 path fails atomically
without a partial write and remains `PLANNED`.

The historical migration-impact audit, corrective schema-30 boundary,
scheduled `T-037` rollover, reset/backup rehearsal, and integrated `FAD-01`
through `FAD-04` gate passed. `FAD-07` closed after its final `276/276`
migration/policy/repository/schema/reset gate and independent closure audit.
`FAD-05` closed after its complete recovery/job/late-lock and migration-freeze
gates. `FAD-06` closed locally after its final `161/161` auction-family gate
across `22` suites in `17` files, post-gate `10/10` administration check, and
fresh full-migration composed GET proof. Independent review's terminal
player-source P2 was corrected, leaving no remaining P1/P2 issue. FAD-linked
`T-080` through `T-083` remained fail-closed until their FAD-11 gate. FAD-11
through FAD-17 later closed locally before the completed FAD-18 staging gate.

FAD-08 closed with the shared internal, transaction-bound readiness-handoff
primitive, but it did not pull the Entry Draft into M7. The future final
`T-108` selection or confirmed-forfeiture transaction remains M8 work and owns
`entry_draft_completed`; there is no standalone/manual Entry Draft completion
route. The no-draft owners remain exact: ordinary-inaugural `T-036` commits
`no_draft_inaugural`, reset-origin `T-036` creates no handoff, `T-037` commits
`no_draft_initial_season2`, and confirmed `T-095` schedule creation may only
correctively requeue the same blocked inaugural operation/job after supplying
its missing schedule prerequisite.
That T-095 path is protected by additive schema-33 immutable corrective-requeue
evidence; migrations `0030` through `0032` remain frozen. Migration `0033` is
pinned at `56,084` bytes and SHA-256
`93714178a4c89687578ca340afbe69c317239118cb50765838e6123ff6faf7f1`.

The completed FAD-09 migration audit includes index-only migration `0034`,
immutable Candidate-help result migration `0035`, and immutable provider-
eligibility occurrence migration `0036`. Migration `0035` is pinned at
`10,981` bytes and SHA-256
`cbbaf5322c111f3d13659cf6adc1a5046c8b49ba0ab84c3541d770a1dae3b669`; migration `0036`
is pinned at `22,871` bytes and SHA-256
`1351e25758d7192ab804214f0abeb696a9b0a9b3509e81dcd276ac7570fbb1f6`.
The schema-36 inventory is `129` application tables, `130` including
the migration ledger, `129` repository-catalog entries, `47` post-reset
require-empty tables, `82` signed-reset-policy tables, and `69` immutable-
delete guards.

FAD-10 adds migration `0037_allow_atomic_fad_deadline_allocations.sql`, pinned
at `4,142` bytes and SHA-256
`33b8e7c3479f9a3dc64011a29ced6421a5cc59eca62da8b8144cf82b1d0d80b3`,
for the exact live-deadline-job allocation insert seam. Migration
`0038_allow_pre_fad12_restricted_scheduling.sql`, pinned at `17,157` bytes and
SHA-256
`b4567d087b31ff70dfa2776f2a15e6d22e182600d3dd5e5446a169bb64bb5ac5`,
keeps exact Candidate ties scheduled for the next complete rapid rollover
until the later restricted-auction slice. Schema `38` was the FAD-10 local
target and retained the schema-36 inventory: `129` application tables, `130`
including the ledger, `129` repository-catalog entries, `47` post-reset
require-empty tables, `82` signed-reset-policy tables, and `69` immutable-
delete guards.

FAD-11 adds migration `0039_add_fad_recovery_correction_evidence.sql`, pinned
at `201,713` bytes and SHA-256
`a176479f3eb3fc1183c595a68026a2e5b73d6b975b66b6bcab5de4954945ae6f`,
and migration `0040_allow_atomic_fad_restricted_fallback_overlap.sql`, pinned
at `9,449` bytes and SHA-256
`cff71c33b628504d38b53cfe1621363740791c119c5b214d7d11e10f216a5a92`.
Schema `40` was the FAD-11 local target with `131` application tables, `132`
including the ledger, and `131` repository-catalog entries.

FAD-12 adds migration
`0041_allow_fad_auction_resolution_recovery_resume.sql`, pinned at `35,525`
bytes and SHA-256
`00d6926934d46089df6581a8c3edc296394ce57958155e36da7d15b2be61111b`;
migration `0042_use_current_aav_for_restricted_participant_floor.sql`, pinned
at `9,326` bytes and SHA-256
`4269c4a0c320364b65d20c01b167ff8738f1a67c7e4d52160e6e2245e201e537`;
and migration `0043_allow_repeat_fad_auction_resolution_recovery.sql`, pinned
at `92,011` bytes and SHA-256
`1623d40ffaa477e3ba0be6bdd7c831f3d16489b53e4befc03eb7aa0e6efa6ae3`.
Schema `43` was the FAD-12 local target with the same `131` application tables,
`132` including the ledger, and `131` repository-catalog entries.

FAD-13 adds migration `0044_allow_immediate_fad_open_rapid_starts.sql`, pinned
at `32,654` bytes and SHA-256
`79f759030c01281f4a21aeba0584a3681d0ae84982d2b7a48dfcd7a5bf0274ee`;
migration
`0045_allow_restart_safe_fad_queued_nomination_activation.sql`, pinned at
`74,289` bytes and SHA-256
`cd2a7d3059b6ab0f484267b6999cbadd6db1a86114fcdb67e4220296dca9ae37`;
migration `0046_bind_fad_open_rapid_starter_edit_limit.sql`, pinned at `18,329`
bytes and SHA-256
`78626350a1efa3e76b09f3ba2dc812b135b1e2d19dd2c01d2e973a57a6a884bb`;
and migration
`0047_allow_restart_safe_fad_rollover_finalization.sql`, pinned at `14,129`
bytes and SHA-256
`bdabbcff52cd87c932c3f2e067d825786fd6dac6354ea4a3a90396ec972b0b2b`.
Schema `47` was the FAD-13 local target with `131` application tables, `132`
including the ledger, and `131` repository-catalog entries.

FAD-14 first added trigger-only migration
`0048_require_canonical_fad_realtime_evidence.sql`, pinned at `73,524` bytes,
`1,490` lines, and SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`.
Schema `48` is the preserved intermediate realtime checkpoint. Trigger-only
reconciliation migration
`0049_require_canonical_fad_setup_exemption_publications.sql` is pinned at
`29,571` bytes, `748` lines, and SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`.
Schema `49` was the FAD-14 local target with the same `131` application tables,
`132` including the ledger, and `131` repository-catalog entries. At that
checkpoint, migrations `0023` through `0049` had not been applied to shared
staging or production.

The composed readiness worker/runtime, carryover opening, T-126 through T-129
privacy and no-write contracts, and original-receipt T-128 replay after later
terminal success are complete locally. The final FAD-08 behavior package
passes `336/336`; the independent schema-33 package passes `64/64`. Shared
staging and production were not opened or changed.

`FAD-09` is `COMPLETE - LOCAL ONLY (2026-08-08)`. T-130 and T-133 through
T-139 are jointly exposed in the local target runtime, increasing the target
endpoint inventory from `102` to `110`. Candidate writes, help, every
authoritative summer writer, semantic provider revalidation, shared-lease
worker execution, and deadline reconciliation use the same transaction-bound
Candidate synchronizer. Outstanding occurrence-bound work is terminalized as
`deadline_reconciled`, and stale workers are fenced.

Launch defaults are `fad_candidate_write` at `120` per session and `600` per
league per `15` elapsed minutes, `fad_help_write` at `5` per session and `25`
per league per elapsed hour, and `fad_operational_write` at `30` per session
and `120` per league per `15` elapsed minutes. Closure gates pass `60/60`
provider occurrence/job/deadline tests, `262/262` summer-writer tests, `36/36`
direct Candidate HTTP-boundary tests, and `66/66` composed-runtime tests. The
local staging-verifier regression passes `9/9`, and reset bootstrap passes
`8/8`. No shared staging or production environment was opened or changed.

`FAD-10` is `COMPLETE - LOCAL ONLY (2026-08-09)`. T-131, T-132, and T-140
are composed and contract-tested locally, increasing the target endpoint
inventory from `110` to `113`. Durable reminders, exact deadline locking,
whole-card legality, immutable league-wide publication, pending-result reads,
independent per-player allocation, and aggregate team results are composed in
the target runtime. One scheduler cycle orders the allocation coordinator,
per-player runner, and coordinator again before ordinary auction resolution;
zero-allocation FADs use the same coordinator-owned direct transition to
`rapid`. Exact Candidate ties stay scheduled or quarantined for the future
restricted-auction privacy and activation gate.

The FAD-10 closure matrix passes `200/200` across `23` suites. Separate gates
pass `4/4` composed-runtime tests, `18/18` coordinator tests, `103/103` shared-
auction regression tests, and `7/7` post-amendment reminder tests. There is no
frontend caller, shared-staging deployment or verification, or production
change at that checkpoint.

`FAD-11` is `COMPLETE - LOCAL ONLY (2026-08-10)`. T-141 through T-144,
FAD-linked T-080 through T-083 administration, atomic FAD completion, and the
shared transaction-owned restricted no-improvement fallback are complete
locally. The target runtime inventory remains `117`. Separate closure gates
pass `197/197` broader recovery/correction/administration, `96/96` schema/
runtime, `62/62` ordinary-auction compatibility, and `40/40` complete
administration-repository tests on Node.js `24.14.1`.

`FAD-12` is `COMPLETE - LOCAL ONLY (2026-08-10)`. Server-derived restricted/
fallback bidding and reads, current strict improvements, exact-top committed
draws, no-selection reveals, restricted no-improvement fallback, allocation-
linked fallback winner/no-winner settlement, normal pricing, winner resources,
post-commit late-lock, delayed activation, transient reclaim, deterministic
recovery, repeated T-142 retry, and exact replay are composed through schema
`43`. The target runtime inventory remains `117`.

Separate exact Node.js `24.14.1` gates pass `52/52` resolver policy/
persistence/shared fallback, `15/15` application service/runner, `71/71`
activation/job-repository, `50/50` bid/HTTP/read capability, `170/170`
ordinary auction/administration compatibility, `303/303` schema-43/current-
head, and `94/94` final scheduler/runtime/deployment/ordinary compatibility tests. The
final runtime gate includes `6/6` scheduler-order, `1/1` composed T-083, `3/3`
FAD ordinary compatibility, `17/17` ordinary resolver/job, `36/36` target-
runtime, and `31/31` target-deployment tests.

At FAD-12 closure, `FAD-13` became active. Direct and queued open-rapid
resolution, final-hour private queueing, contiguous extension rollovers, and
completion recovery remained its scope. FAD-12 rejected those contexts and
preserved the ordinary resolver and auction paths. No frontend, shared staging,
or production environment was opened, migrated, deployed, or changed at that
checkpoint.

`FAD-13` is `COMPLETE - LOCAL ONLY (2026-08-10)`. Immediate and private queued
starts, restart-safe queued activation, direct/queued rapid resolution,
allocation-null and no-bid outcomes, contiguous extension finalization and
recovery, atomic completion and whole-Monday Week 1 recovery, the matchup-start
guard, and the season-start-plus-FAD-completion ordinary-auction handoff are
composed locally. The target endpoint inventory remains exactly `117`.

Separate, overlapping Node.js `24.14.1` milestones pass `11/11` start-decision
policy, `10/10` immediate-start writer, `23/23` FAD start/lifecycle, `12/12`
ordinary creation compatibility, `125/125` queued activation, `22/22` focused
allocation-null resolution writer, `18/18` focused resolution service/runner,
`73/73` broader allocation-null resolution, and `122/122` bid/read
compatibility. Final gates pass `280/280` schema-47/current-head, `42/42`
rollover policy/writer/service/runner, `31/31` completion, `77/77` runtime
composition, and `15/15` matchup-start guard tests. These records overlap and
are not added into one aggregate total.

`FAD-14` is `COMPLETE - LOCAL ONLY (2026-08-11)`. The exact Activity and
notification registries, four Candidate Card opening publication sets,
eight-related-ID envelopes, audience privacy, reconnect authorization, and the
setup-exemption eleventh-Activity/thirteenth-notification three-publication
contract are composed locally. The target endpoint inventory remains exactly
`117` on schema `49`.

Separate pinned Node.js `24.14.1` evidence passes `1,294/1,294` focused core
tests across `142` suites and `110` unique files, `95/95` production syntax,
`265/265` schema-49 pin/runtime/reset/release/staging-verifier tests, and
`189/189` former-failure consolidation tests. The authoritative full backend
gate records `3,266` tests across `436` suites: `3,264` passed, zero failed,
cancelled, or todo, and two intentional Windows link-capability skips in
`sportsDataIoLiveCapabilityArtifactFoundation.test.js`, in about `30m03.603s`.

`FAD-15` and `FAD-16` are `COMPLETE - LOCAL ONLY (2026-08-11)`. Server-directed
Candidate Card preparation, results, FAD auctions, private queue confirmation,
commissioner recovery, notification routing, realtime reauthorization, deep-
link reload, cross-league isolation, keyboard/focus, responsive, and
accessibility behavior are implemented. Exact Node.js `24.14.1` gates pass
`316/316` tests across `52` files, lint, production build, dependency-tree
inspection, and browser-authority verification across `19` compatibility files
and `154` shipped source files. FAD feature coverage is `87.17%` statements and
`80.02%` branches.

`FAD-17` is `COMPLETE - LOCAL ONLY (2026-08-11)`. The real disposable two-
league browser matrix passes `40/40` across five Playwright projects with zero
retries. Exact backend local acceptance passes `28/28` migration/fixture/reset/
cutover tests, `49/49` affected resolution service/writer/job tests, and
`202/202` representative mandatory-package tests with no failure,
cancellation, or skip. This includes exact schema `22 -> 49` plus fresh schema-
49/catalog agreement, no-bid later renomination, simultaneous no-reservation
aggregate wins, absent/disabled nonblocking video, distinct Alpha/Beta Week 1
and help chronology, GET/preview no-write proof, restart/recovery, privacy, and
ordinary-auction compatibility. T-076 through T-083 and T-126 through T-144 are
`LOCAL VERIFIED` at that FAD-17 checkpoint; FAD-18 later raised them to
`STAGING VERIFIED` under release `HL-20260818-1`.

The amendment requires automatic all-or-none Candidate Card readiness,
server-owned whole-Monday Week 1 recovery, strict whole-card cap exclusion,
restricted minimums that require a current improvement, league-wide fallback
when no improvement remains, exact-top FAD draws for open and restricted
auctions, private final-hour nomination queueing, no-bid unclaimed outcomes,
no cap/slot reservation, binding aggregate wins, and contiguous rollover
extensions beyond the initial seven when required.

Grae's continuation instruction carried the isolated staging gate through
completion on `2026-08-18`. FAD-18 and M7-25 are complete. The exact backend
commit `9a2f5e8f06b054c84e37d086c1c3a43d0fafbc68` passed the final Render-hosted
Node `24.14.1` suite at `3,356/3,356`, migrated isolated staging to schema `52`,
and is live as Render deploy `dep-da2147e417fc73brkqmg`. Netlify deploy
`6a8420054c9c5a624d86b2c3` serves exact frontend application commit
`50f2414cdda5926942975577f70114b5868917a9` from preserved source head
`2ba016c9d5e6b016a150a62da757f28a9c0140c0`. The encrypted pre-migration backup,
distinct clean restore, release preflight, health checks, and authenticated
non-mutating browser acceptance passed. Production remained untouched and
unauthorized.

For historical rollback provenance, the `2026-08-11` pre-mutation inspection
recorded Render deploy `dep-d9kmv0ijobas73fsp8kg` at commit
`fa85e75c904389284a030459cd8a68f452cdac02`, Netlify deploy
`6a6bede0e1742b6b750017cb`, published frontend source head
`29d4d89ea6def41464fc48b6390e7f567c480039`, and backend bridge head
`26cf9606b8ee1f33efeb9e667cd265f947bc5387`. The bridge implementation began at
`1ad052300ef00e82c16e6abfe2d0f1cc5a15dfbd`. Those were pre-release identities;
the inspection itself changed no hosted resource.

The executed maintenance sequence used the schema-agnostic hold, verified
encrypted backup and distinct clean restore, forward migration, and final
hold-false activation with the complete automatic matchup-occurrence runner
disabled. FAD, Entry Draft, auction, trade, and outbox workers remain available
subject to their own gates. Exact operational and rollback evidence is in the
2026-08-18 release record.

The core gate includes:

* scheduled Entry Draft-start rollover that gates drafting and trading until
  success, plus the approved no-draft transition for initial Season 2;
* an empty inaugural league-creation baseline with no prior-season carryovers,
  approved prospect projection, and later-season locked carryovers;
* private Candidate Cards opened together by automatic all-or-none readiness,
  without commissioner-authored FAD opening parameters;
* explicit commissioner- or administrator-selected first-matchup timing, no
  fixed annual FAD date, frozen historical FAD clocks, and server-owned
  whole-Monday recovery before opening or at completion;
* adaptive commissioner help for the final 48 hours or all remaining time when
  cards open later;
* deadline locking, whole-card cap disposition, and league-wide reveal;
* total-first, AAV-second allocation;
* restricted minimums and strict improvements, league-wide no-improvement
  fallback, and exact-top open/restricted FAD draws;
* seven initial daily rollovers plus required contiguous extensions, private
  final-hour nomination queueing, no-bid unclaimed outcomes, and binding
  no-reservation wins;
* persisted player-catalogue search and eligibility with no live-provider
  dependency; zero is the approved current-season semantic baseline, while the
  season-explicit projection remains deferred rather than claimed complete;
* final transition to ordinary weekly auctions only after all FAD paths are
  terminal.

The presentation video does not block Season 2. It remains optional for Season
2, and its implementation is required for Season 3 readiness. An individual
generation failure must still fail safely without delaying results or season
start.

### Post-FAD Matchup/Statistics Follow-Up

After FAD staging acceptance, a separate contained work plan must select and
verify a provider-neutral source for completed-game cumulative statistics. It
must schedule four evening refresh runs, preserve explicit missing/stale
states, prevent prior-season rows from entering current-season projections,
and reconcile the deferred late-lock design before restoring or splitting the
shared runner. That runner owns statistics refresh, baseline, normal lock,
finalization, and matchup-week rollover occurrences; none may be enabled accidentally as a
side effect of enabling another. Historical-statistics browsing and the current
legacy player-page season-filter gap are not part of FAD and remain deferred
frontend/product work.

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
* confirmed commissioner forfeitures;
* on-clock traded-pick reset;
* prospect-right creation and approved re-entry;
* the final `T-108` selection or confirmed-forfeiture transaction atomically
  making the last pick terminal, marking the draft `Complete`, and invoking the
  internal `entry_draft_completed` readiness handoff.

There is no separate manual Entry Draft completion endpoint. The initial Season
2 launch does not require this interface; FAD-08's internal handoff primitive
does not change the M8 deferral of the complete Entry Draft.

---

## Season Completion and Rollover

Must be complete before the first Season 2 off-season:

* season finalization;
* historical results;
* competition completion with contract years unchanged and displayed as
  `Pending Rollover`;
* automatic contract-year advancement/expiration at the persisted scheduled
  Entry Draft start, gating draft and trading until success;
* free-agency conversion;
* retention and buyout continuation;
* draft-order inputs;
* verified season-end snapshot;
* transition to the next approved operating mode.

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

For M7-25, this also required the recorded historical `0023` through `0029`
amendment impact dispositions, the resulting verified `0023` through `0049`
migration set, and the complete 2026-07-29 FAD acceptance package to pass
locally and in isolated staging before the FAD launch gate could close. Those
requirements passed under release `HL-20260818-1`.

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
Action: Mandatory stop after accepted abort-v2 replay; preserve evidence and mint a separate evidence-bound amendment before any helper retirement, activation, post-activation verifier/backup, staging reopening/final review, or closeout
Implementation status: M7-26 ACTIVE / HL-20260822-1 BLOCKED + ABORT-RECOVERED HISTORY PRESERVED / HL-20260823-1 BLOCKED AFTER PHASE ONE PUBLISHED / OPERATOR-SEQUENCING STRICT_STOP / PHASE TWO NOT STARTED + NO RETRY / FULL RE-HOLD PASS / NETLIFY 6a8c006 CURRENT + READY + UNCHANGED / EXACT TWO-FILE ABORT-V2 B2 6359ec9997f90dddf17ba2c9b07481746ae171bb MINTED + PUSHED / EXACT HELD B2 DEPLOY dep-da6ghj67bikc738hbbv0 SOLE NEWEST + LIVE / HOSTED 3519/3519 + STARTUP + ZERO-ERROR + MAINTENANCE PROBES PASS / POST-LIVE HELD FAMILY PROOF PASS / FRESH POST-B2 ABORT-V2 VERIFIER 6d5c+80c7 PASS / ABORT-V2 PLAN 30441740+EC338025 PASS / FIRST EXECUTE 3d67f676 PASS + AUTHORITY CONSUMED + NO RERUN / AUXILIARY THREE-BYTE STATUS DEFECT 101770a4 SEALED + UNREPAIRED / REPLAY 8b21edc8 PASS + REPLAYED TRUE + 0/0 + AUTHORITY CONSUMED + NO RERUN / PREFLIGHT+POSTFLIGHT+PROBES+PROVIDER+CLEANUP+METADATA BOUND / MANDATORY STOP / CHECKPOINT+SIDECAR REMOVAL+NORMAL RESTORE+PHASE TWO FORBIDDEN / POST-ABORT RETIREMENT+ACTIVATION+VERIFICATION+BACKUP+REOPENING+FINAL REVIEW PENDING SEPARATE AMENDMENT / PRODUCTION UNTOUCHED AND UNAUTHORIZED
Repositories: E:\hundo-leago and E:\hundo-leago-backend
Local branches: codex/m7-26-completion and codex/m7-26-completion
Deployment branches: staging and staging
```

The governing designs are defined in:

```text
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/FREE_AGENT_DRAFT.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/FREE_AGENT_DRAFT.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

The held cutover, exact target/source/receipt/runtime verification, fresh
incident-preservation backup, and `HL-20260822-1` recovery closeout are complete.
Grae explicitly requested and approved fresh release `HL-20260823-1` at
`2026-08-23T23:23:29.877Z`. It binds F
`4dfe12d1366314e3d9df722c50771324647743c9`, held starting B
`8e313902feefcd683b0f5edd746a9dd2a9029a18`, clean starting source
`...HL-20260822-1.sqlite3` (`37105664` bytes / `cf3ca07d...`), absent target
`...HL-20260823-1.sqlite3`, and verified incident-preservation backup
`e735e6a4-53d1-479a-bc5e-4b6bcf3d58a6`. Its manifest and storage-object
identities, `2026-08-23T22:56:20.203Z` creation time, metadata, encrypted hash
`e6c6269f...`, checksum `54df36b9...`, and plaintext `cf3ca07d...` are exact.

Exact B-prime `234547e4d8453b7515fc081ea6ebe4c2d022dc54` passed its two-file
local and backend `origin/staging` publication gates at the recorded B-prime
boundary. Held deploy
`dep-da5sh0e417fc738i254g` passed on exact B-prime after all
`3,503/3,503` hosted tests, build/startup, zero-error, held-health, and external
read-only runtime gates passed. Fresh fixture prepare/replay then passed with
`729` and `0` writes. Held postflight verified the pre-action fixture-bearing
source at `37744640` bytes / `b4163695...`, with target family absent, full hold
intact, no authoritative open, zero scratch mutations, and cleanup complete.

Frontend helper commit `e898e72272e5a052867832dcf9f128e5b8d5730e` now
passes its exact canonical local gate. API deploy
`6a8bfef3ac0ff74a373404d8` was rejected before browser or unhold because its
header rules were absent. Corrected current/`READY` CLI deploy
`6a8c006abe46c8fb6269c40c` passes all public-file byte, exact helper-header,
marker, absence, normal-app, and held-runtime checks with no functions. Fresh
tab `1600151197` reached `READY_NO_SESSION_REQUEST`, both QueryClient caches
were empty, exactly two pinned assets were observed, and no API, session,
action, or write ran. The exact controlled-unhold merge then produced sole
newest/`LIVE` B-prime deploy `dep-da60sl0jo6nc73e0cfu0`; its hosted
`3,503/3,503`, build/startup, zero-error, exact runtime, health, unauthenticated
CORS/cache, and mounted-route gates pass. Frozen unheld pre-smoke verifier v2
then emitted `HL23_UNHELD_PRE_SMOKE_SOURCE_VERIFIED` at
`2026-08-24T10:42:47.380Z`, preserving the pre-action source `37744640` / `b4163695...`, WAL
`0`, SHM `32768`, target-family absence, and owned cleanup.

Phase one reached accepted/published state: proposal
`e00e0512-4a20-47fd-ad74-0986dd4abd27`, publish event
`974342b5-94e5-42d8-af20-9e07c35bc847`, and exact publisher/replay
`fresh 2` / `replay 0`. Chrome remained Admin rather than required Manager A
during publication, so operator sequencing selected `STRICT_STOP`. Phase two
never began and no retry is allowed. Exact re-hold deploy
`dep-da6cu8h42hec738f2al0` became sole newest/`LIVE` on B-prime at that boundary
after `443` hosted suites / `3,503` tests all passed, build/startup and zero-error gates passed,
and live/readiness plus maintenance-blocked session/leagues/current-FAD probes
passed; it later deactivated at the verified held-B2 handoff.

The old `18060`-byte / `9c323005...` main-only abort preflight ran and safely
failed its bundled family fence on the source WAL/SHM while target/receipt/work
remained absent. B-prime WAL-aware diagnostic `c036a2b8...` and result
`deda5da6...` instead bind the exact main `37744640` / `b4163695...`, WAL
`568592` / `0dde02d1...`, SHM `32768` / `e03d9ff8...`, zero holders, exact
`to_b_accepted` / `published` / `none`, private copied-family recovery,
downstream absence, and cleanup. The diagnostic copied source main/WAL/SHM into
owned scratch and opened only that scratch family; scratch main/WAL stayed
unchanged while scratch SHM changed. SQLite never opened the authoritative
paths. This diagnostic authorizes no B-prime abort-v1 action, checkpoint, or
sidecar removal.

Exact abort-v2 B2 `6359ec9997f90dddf17ba2c9b07481746ae171bb` is minted
and pushed to backend `origin/staging` as the direct child of B-prime, with tree
`0a6a928d8f6308aa5aadd2031c71769164c1cfb7`. It changes only the
implementation and foundation test: numstat `369/18` and `830/2`, Git
blobs `4a198c71554b7e7c5fc8ee481cd79b51c1ef799f` and
`53ce37cd04e48eb42323bab914d71ef3933c2c63`, and SHA-256 values
`d49c870bdf300983a0b57577ce68e0647ba6ff318ccf55fe11a5596016671889`
and `3d9714ca93efa573593d983c992032fc4c473f2df23fd85395c9ed6d2873155c`.
The `57541`-byte raw diff has SHA-256
`eb963d6b95311eeacc282ce9f8f743a83d4eae32f28922e2668ddcbfcbe84dc0`.
Diff/syntax, focused `72/72` before the final narrow wrapper, and exact-final
affected `5/5` pass; backend HEAD and `origin/staging` equal B2 and the backend
worktree is clean. The approved one-key merge produced sole newest/`LIVE` exact-
B2 deploy `dep-da6ghj67bikc738hbbv0`; held B-prime deploy
`dep-da6cu8h42hec738f2al0` deactivated only at safe handoff. Hosted `443` suites /
`3,519` tests all passed, followed by build/startup on instance `thxsc`, zero
error logs, health/readiness `200`/`no-store`, and maintenance-blocked session/
leagues/current-FAD `503 SERVICE_MAINTENANCE`/`no-store`. Netlify remains
unchanged current/`READY` `6a8c006abe46c8fb6269c40c`.

Post-live shell proof `HL23_B2_POST_LIVE_HELD_FAMILY_VERIFIED` passed at
`2026-08-25T04:11:28.902Z`: `20` exact runtime keys, nine absent providers,
three stable source snapshots, two seven-process scans with zero denied/holders,
and downstream absence. Current container device `66313` replaces historical
B-prime namespace-local device `66332`; all other family metadata and hashes are
unchanged.

Fresh derivative `post-b2-abort-v2-source-verifier.sh` (`35494` bytes / SHA-256
`6d5cfe50ecee26199c3f0a2c922c99a84d3f97e2fe98b6256b36583e6e98b70c`)
passed syntax/static/cold audit. Its one-shot `6032`-byte result SHA-256
`80c7cadec0664625b0c4fc6eb86fd49f5e58842534fdebbc1aead63f5fe65976` emitted
`HL23_ABORT_B2_V2_SOURCE_PREFLIGHT_VERIFIED`. It proves six stable family
boundaries, two eight-process/`85`-descriptor zero-holder scans, main+WAL-only
scratch with private SHM creation, source and scratch main/WAL stability, exact
schema/integrity/semantic state, zero changes, both rollback-journal and
downstream absence, and cleanup.

One exact abort-v2 plan ran once after the fresh-shell guards and passed at
`0/0`. Exact stdout/result/capture-metadata seals are `4777` bytes /
`cef33b8f...`, `4146` bytes / `30441740...`, and `1809` bytes /
`ec338025...`; stderr is empty. The accepted contract-`2` plan ID is
`release-qa-strict-restore-abort-v2-03f37c3c16ee7cc632c49a6b87f23819b398146fd8a0fe1c6aff5cbdcca47456`.
It binds `main-wal`, the exact WAL/family/classifier, absent target, both
mutation counts `0`, and the exact six-field `.strict-restore-work-v1`
temporary-work object. Postflight retained exact main/WAL/SHM on device `66313`
and inodes `131156` / `131151` / `131152`; seven processes / `65` descriptors /
zero holders passed, and source journal plus target family/journal, receipt, and
work remained absent. Verified remote captures were removed after local proof.

Published execute-only authority
`fd31b1f41b7c16521cf0eceb2c4af4a33a242636` was consumed by exactly one
`969`-byte / SHA-256 `bad1c78f...` command. Native status was numeric `0`;
stdout/stderr/result seals are `4902` / `74610bcc...`, `0` / `e3b0c442...`, and
`3896` / `3d67f676...`. The result passed as
`RELEASE_QA_STRICT_RESTORE_ABORT_MATERIALIZED`, contract `2`,
`replayed: false`, `0/2`, source preserved, target verified at `cf3ca07d...`,
and receipt `24adf2d...`. The sealed auxiliary status artifact is the literal
three-byte `0\n` / `101770a4...`, not a newline; it was not repaired. Native
wrapper status, complete output, and postflight make the execution unambiguous.

Envelope `7318` / `14733405...`, postflight `2059` / `fdd169d5...`, probes
`1136` / `2d634d0d...`, cleanup `928` / `299496df...`, and final metadata
`5566` / `59cb7e89...` bind unchanged source family, exact target/receipt,
sidecar/journal/work absence, zero holders, full hold, and capture cleanup.
First execute cannot be rerun. The one authorized replay is now `PASS /
AUTHORITY CONSUMED / NO RERUN`. Action-preflight script/result are `9561` /
`2837` bytes (`7f9f378a...` / `b454c5a6...`) and bound exact B2, `20` runtime
keys, nine absent providers, three snapshots, and two ten-process/`92`-
descriptor zero-denied/zero-holder scans. The same `969`-byte / `bad1c78f...`
command dispatched once with native status `0`; wrapper/envelope are `4098` /
`7349` (`95cf1aa5...` / `63e4e662...`), stdout `4905` / `65431c4c...`,
stderr `0` / `e3b0c442...`, replay status `2` / one LF / hex `30 0a` /
`9a271f2a...`, and canonical result `3899` / `8b21edc8...`. Contract `2`,
`replayed: true`, `0/0`, exact no-work object, unchanged source family, and
byte-identical target/receipt pass. The first-execute literal three-byte `0\n`
wart stays sealed and unrepaired.

Postflight script/result `12559` / `3047` (`c2e034de...` / `07ad847d...`)
passed three snapshots, five absences, and two ten-process/`92`-descriptor zero-
denied/zero-holder scans. Probes `995` / `a31a8877...` passed held `200/503`,
`no-store`, and no-`Set-Cookie` boundaries. Render stayed sole-newest/`LIVE`
exact-B2 `dep-da6ghj67bikc738hbbv0`, no newer/pending deploy, auto-deploy off,
and zero error/`5xx` logs; Netlify stayed unchanged ready
`6a8c006abe46c8fb6269c40c`, six headers/two redirects/zero functions. Cleanup
script/result `11629` / `4023` (`9a908635...` / `67b1adbe...`) removed only the
three captures and preserved protected files. Final metadata `6012` /
`b2f706da...` records `HL23_ABORT_V2_REPLAY_EVIDENCE_COMPLETE`.

Mandatory stop is active. Normal restore, phase two/retry, helper or Netlify
change/retirement, activation, post-activation verifier/backup, staging
reopening/final review, closeout, and production remain unauthorized pending a
later evidence-bound amendment; neither predecessor may be resumed or reused.

## Historical Milestone Evidence

The dated totals and status narrative below preserve earlier milestone
evidence. They do not override the current action, current release record, or
environment matrix above.

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
* M3 through the original M6 gate are complete locally, while the 2026-07-29
  late-snapshot amendment is reopened and remains part of the active M7/FAD
  launch gate;
* M7-01 through M7-11 are complete on the dedicated staging services;
* M7-11 passed its local automated, migration, reset, hosted desktop/mobile,
  manager workflow, and league-isolation gates, while manual native pointer
  drag and Grae's independent acceptance remain;
* launch requires staging, backup, recovery, testing, and explicit production authority;
* deferred work remains outside the launch path.
