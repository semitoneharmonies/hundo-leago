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

Last reviewed: **2026-07-28**

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
14. The annual Free Agent Draft reaches its final rapid rollover no later than
    the first-matchup start.

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
* every active platform administrator has one protected active `member`
  membership in every non-deleted league, and ordinary membership,
  commissioner, and team-manager writers cannot mutate or assign it;
* unauthorized users cannot perform write operations;
* commissioner and administrator actions are logged.

---

## 9. Teams and Memberships

Season 2 must support:

* users belonging to leagues;
* users being assigned to teams;
* teams belonging to one league;
* commissioners belonging to the leagues they manage;
* exactly one current commissioner per operational league and explicit atomic
  transfer to an eligible non-administrator replacement;
* users participating in more than one league when approved.

The meaning of “membership” must be formally documented in the data model and glossary.

---

## 10. Rosters

The roster system must support the approved 2026–27 roster model.

At minimum, it must handle:

* player ownership;
* 18 active-roster slots divided into 12 forward and 6 defence slots;
* permitted empty active-roster slots;
* four bench or inactive-roster slots;
* the $4 maximum average annual value for a benched player;
* four injured-reserve slots;
* unlimited prospect-roster slots;
* prospect eligibility based on the entry draft or a trade of existing prospect rights;
* signed prospects remaining in the Prospect category with ELC salary excluded from the cap;
* manual ELC decline and voluntary prospect-right release;
* Entry Draft re-entry only for released rights drafted in the immediately preceding year;
* the absence of goalies;
* position normalization of C, LW, and RW to F and LD and RD to D;
* roster-size limits;
* positional requirements;
* roster legality;
* salary calculations;
* contract display;
* player identifiers;
* league isolation.

The Roster specification must define movement, eligibility, signing, correction, and display workflows without changing these approved category rules.

---

## 11. Contracts

The Season 2 contract system must support the minimum approved contract model.

This is expected to include:

* total contract value;
* one-to-three-year contract length;
* average annual value rounded to the nearest hundredth;
* remaining contract years;
* contract ownership by team and league;
* contract creation;
* contract expiration;
* prohibition of contract extensions;
* no team-wide total contract-year limit;
* auction contract creation;
* contract transfer without restarting or extending the contract;
* a $3, three-year fantasy entry-level contract with $1 AAV for signed prospects;
* a `$1 AAV` minimum per contract year for normal non-ELC contracts;
* no separate monetary maximum contract value;
* retained salary;
* buyout consequences;
* contract history or activity records.

The Contract specification must implement the approved rules that remaining
years include the current season, remain `Pending Rollover` after competition
ends, and advance or expire only at the persisted scheduled start of the next
Entry Draft. Expiration then removes the player from the roster and returns the
player to free agency without exclusive re-signing rights.

Automatic detection and enforcement of real-life prospect ELC signings is deferred to a future update.

Automatic imported NHL injured-reserve eligibility, automatic rechecks, and automatic warnings are also deferred. Initial injured-reserve placement uses the approved manual workflow.

Detailed free-agent signing workflows must be finalized in:

`docs/03-product-specs/CONTRACTS.md`

Speculative contract types must not be implemented until approved.

---

## 12. Salary Cap and Roster Legality

The backend must consistently calculate:

* the $100 salary cap;
* active-player average annual value;
* retained salary;
* buyout penalties;
* remaining cap;
* roster size;
* positional legality;
* other approved restrictions.

Benched, injured-reserve, and prospect players do not contribute player salary to cap usage.

Transactions may complete when they create an illegal roster, but the user must receive a warning and the result must be logged.

A team that is illegal at the normal Monday `4:00 PM Pacific` roster lock does not collect matchup points until the roster becomes legal. The backend must then record a team-specific locked roster and scoring baseline so earlier points are excluded. After a legal matchup roster is locked, later normal-roster adjustments do not affect the current matchup, even when the normal roster becomes illegal.

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
* contract creation by dividing the winning total contract value across the one-to-three-year bid term;
* activity logging;
* protection against duplicate processing.

The exact business rules belong in:

`docs/03-product-specs/AUCTIONS.md`

### Free Agent Draft

The annual pre-season Free Agent Draft is launch-critical.

The core Season 2 workflow includes:

* an empty league-creation roster baseline with no inaugural prior-season
  carryovers, while approved prospect moves still project normally, and locked
  multi-year contract carryover in later seasons;
* 12 mandatory forward, 6 mandatory defence, and 4 optional Bench positions;
* private summer preparation after automatic all-or-none FAD readiness
  following Entry Draft completion or an approved no-draft transition;
* manager-requested commissioner help during the final 48 hours, or the entire
  remaining preparation period when cards open later;
* an automatic deadline exactly 168 elapsed hours before the frozen
  first-matchup start;
* post-deadline viewer-filtered results: every active member sees selected-team
  player identity and Signed/Not won/Tied status, while money, restricted
  minimums, and complete-card/audit detail remain limited to the selected
  team's current manager or protected internal evidence;
* automatic allocation by highest total contract value and then highest AAV;
* restricted auctions only for equal highest totals with equal terms, using
  Candidate minimums that require an active improvement and a league-wide
  fallback when none remains;
* seven initial daily rapid-auction boundaries plus contiguous extensions for
  queued, fallback, delayed, or recovery work;
* a private final-hour nomination queue rather than last-minute rejection;
* FAD-only auditable equal-chance draws for exact top auction ties;
* whole-Monday Week 1 recovery when late Entry Draft or FAD processing makes
  it necessary;
* transition to ordinary weekly auctions without guaranteeing every roster is
  complete or legal.

The exact business rules belong in:

`docs/03-product-specs/FREE_AGENT_DRAFT.md`

The AI-generated FAD presentation video is optional for Season 2. It must not
block the core FAD, and its implementation is required for Season 3 readiness.

---

## 14. Trades

The trade system must support league-specific authenticated transactions.

Launch-critical functionality includes:

* proposing a trade;
* accepting or rejecting a trade;
* trade expiration;
* ownership validation;
* roster and contract validation;
* contract transfer with unchanged average annual value and remaining years;
* average-annual-value salary retention for every remaining contract year;
* multiple retention records up to a cumulative 50% of original AAV and three retention slots per team;
* the normal new-proposal presentation of Player, Draft pick, Buyout obligation,
  and Future Considerations, with requested retention nested on an outgoing
  contracted Player and no fresh standalone existing-retention asset;
* persisted historical retention proposals/assets remaining readable and
  executable/reversible when their recorded state permits, including exact
  idempotent creation-result replay;
* proposer-manager-only create/cancel and receiver-manager-only accept/reject;
* receiver acceptance of Future Considerations persisting an awaiting-approval
  projection without transfers, followed by commissioner/inherited-admin
  revalidation and atomic approval completion;
* a commissioner-configured trade deadline set during league creation;
* reopening of trading only after the scheduled Entry Draft-start rollover
  succeeds atomically with draft start;
* seven-day proposal expiration;
* automatic cancellation when required;
* activity logging;
* duplicate-processing protection.

No counter endpoint or service is implemented for M7-26. Countering remains
planned; reject plus a separately manager-authorized reversed proposal are
independent actions.

Draft picks and player rights require stable identifiers and an approved data model before implementation.

---

## 15. Buyouts

The buyout system must continue to support:

* approved penalty calculations;
* player release;
* elimination of the bought-out contract;
* release of the player to free agency;
* an annual cap penalty of 25% of average annual value in each remaining contract year;
* a 14-day buyout lock for auction and direct automatic FAD signings that
  follows the player after a trade;
* preservation of existing retained-salary obligations after a buyout;
* automatic cancellation of pending trades involving the bought-out player;
* transaction history;
* league-specific state;
* authenticated permissions.

Buyout penalties do not decay during the remaining contract term.

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

The preseason Free Agent Draft and the later Entry Draft require the persisted
player catalogue, including stable identity, display name, effective position,
and applicable eligibility evidence. Neither draft requires prior-season
statistics or an in-game/live statistics feed.

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

At every season rollover or start, the new current season initializes every
player's games played, goals, assists, NHL points, and fantasy points to
exactly zero. Prior-season rows may remain as historical or migration evidence,
but they must never populate current-season FAD, Entry Draft, roster, matchup,
or standings projections.

Season 2 does not require an in-game points feed. The approved operating model
refreshes completed-game cumulative statistics in four scheduled runs each
evening, matching the sufficient Season 1 cadence. Exact clock times and the
provider-neutral source contract belong to a separate statistics/matchup work
item. Missing or stale post-game data must remain visible and must not be
silently converted to an earned zero after a player's game has completed.

The preseason FAD-only staging candidate intentionally disables the shared
automatic matchup-occurrence runner as one unit. Statistics refresh, baseline,
normal lock, finalization, and matchup-week rollover occurrences do not run in that
candidate; FAD, Entry Draft, auction, trade, and outbox jobs remain available
subject to their own safety gates. A later provider-neutral matchup/statistics
slice must restore or split automatic matchup processing before season play.

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
* contextually correctable beside a recognizable finalized matchup, with a
  read-only projected standings preview and atomic confirmed recalculation;
* rebuildable only through an explicit recovery capability absent from the
  normal standings interface;
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

Matchup and standings operations are excluded from league activity history. Their schedules, locks, baselines, results, corrections, rollovers, and standings calculations must use separate matchup, result, correction, or operational records where persistence is required.

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

The launch-critical notification inbox uses read-only listing with explicit
unread/read filters. After one captured unread batch renders, the normal UI may
send exactly one authenticated idempotent acknowledgement for those displayed
IDs, retain that batch for the mounted visit, and surface failure. This is the
sole normal automatic-on-view write; legacy single/read-all commands remain
compatibility APIs rather than the ordinary workflow.

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

The platform must support Hundo Leago playoffs before the final four fantasy scoring weeks of the NHL regular season.

The approved calendar is:

```text
Round 1: 1 week
Round 2: 1 week
Final:   2 weeks using the final two weeks of the NHL regular season
```

Real NHL playoff games do not affect the current Hundo Leago format.

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

The platform must support the league’s approved Entry Draft process before the first Season 2 Entry Draft is used.

The Entry Draft is not required for the initial Season 2 launch. It may be developed during the season, but it must be complete and verified before the Entry Draft takes place.

Before the draft is needed, the system may require:

* draft order;
* lottery results;
* traded draft picks;
* future draft-pick ownership;
* player rights;
* drafted-player records;
* commissioner-entered draft results;
* unlimited team prospect rosters;
* preservation of prospect status when prospect rights are traded;
* a $3, three-year fantasy entry-level contract with $1 AAV;
* future manager signing decisions triggered by the player signing a real-life entry-level contract.

Automatic enforcement of the prospect-signing trigger is not required for the initial implementation and must not be added without an approved future work plan.

The completed Entry Draft system must include:

* the approved lottery;
* four linear rounds;
* the current draft and following three draft classes;
* live manager and commissioner selections;
* a five-minute pick clock;
* automatic best-player-available timeout selections with no skipped picks;
* persistent private queues;
* immutable completed selections;
* on-clock trade resets;
* approved in-app notifications and limited League Activity events.

The approved lottery:

* includes every active non-finalist;
* uses linear weights based on reverse official regular-season standings;
* draws first and second overall without replacement;
* leaves undrawn teams in their original order;
* fixes the losing finalist second-last and champion last;
* applies the result to all four rounds.

The approved normal eligibility pool contains F or D players selected in the most recently completed NHL Entry Draft. It also includes the approved immediately-prior Hundo Leago rights-release re-entry. Goalies and otherwise ineligible older prospects are excluded.

---

## 3. Season Completion and Rollover

Before the end of the 2026–27 season, the system must support:

* season finalization;
* historical results;
* competition completion without contract-year mutation;
* `Pending Rollover` contract display after the final NHL regular-season game;
* contract-year advancement and expiration during the automatic persisted
  scheduled Entry Draft-start rollover;
* immediate roster removal and free-agency conversion for expired players;
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
* notification channels or enhancements beyond the approved in-app unread,
  previous, and displayed-batch acknowledgement workflow;
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
