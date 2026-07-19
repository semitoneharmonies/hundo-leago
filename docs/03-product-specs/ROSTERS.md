# Hundo Leago — Rosters

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 roster categories, sizes, positions, cap treatment, and ownership rules;
* approved permission and public-visibility boundaries;
* approved interaction between roster legality and matchup eligibility;
* current implementation limitations that must not be treated as the target roster model;
* approved user-visible roster decisions that implementation must follow.

Grae approved the Season 2 Rosters product specification recorded in this document on 2026-07-18.

---

## Product Purpose

Hundo Leago needs one authoritative roster system for every team in every league.

This specification defines how:

* players and prospect rights belong to teams;
* active, bench, injured-reserve, and prospect assignments are represented;
* managers and commissioners move players between roster categories;
* position and category eligibility are validated;
* roster legality and cap usage are calculated and explained;
* normal roster state remains separate from a locked matchup roster;
* public and authenticated users view rosters;
* concurrent, repeated, stale, and invalid roster actions fail safely.

The goal is a predictable roster workflow that Contracts, Auctions, Trades, Matchups, Entry Draft, and Commissioner Tools can use without recreating roster rules.

---

## Out of Scope

This document does not define:

* contract value and term creation;
* auction bidding or resolution;
* trade proposal or acceptance workflows;
* draft order or selection workflows;
* fantasy-point formulas;
* matchup scheduling or standings calculations;
* the exact API request and response shapes;
* database tables;
* external player-data provider implementation;
* automatic real-life ELC detection, notification, deadlines, or enforcement.

Those subjects belong in the related rule, product, technical, testing, and operations documents.

---

# Part 1 — Product Authority

## Source Documents

This specification depends on:

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/CONTRACTS.md
```

When this specification conflicts with an approved shared rule, the approved shared rule remains authoritative until the conflict is deliberately resolved.

---

## Existing Behaviour Is Not the Target Model

The current application has a primarily single-list roster model with an `onIR` flag, frontend roster calculations, and Season 1 assumptions.

Current code also contains:

* original-team constants;
* local roster ordering;
* frontend cap and buyout calculations;
* name fallbacks where stable player IDs are incomplete;
* position and legality helpers that do not represent every Season 2 category;
* no complete bench or prospect model;
* no complete multi-league roster isolation.

This behaviour is current-state evidence only.

It does not override the approved Season 2 roster rules and must not be copied into new roster code without deliberate compatibility and removal plans.

---

## Backend Authority

The backend is authoritative for:

* player ownership within a league;
* roster category;
* position normalization;
* category eligibility;
* active, bench, injured-reserve, and prospect counts;
* contract and AAV information used by roster validation;
* cap usage and cap space;
* roster legality and every legality reason;
* persisted roster moves;
* matchup roster snapshots and eligibility baselines;
* roster activity records.

The frontend may preview a result for usability, but it must display the backend’s final authoritative result.

---

## League Isolation

Every roster assignment belongs to exactly one:

* league;
* team in that league;
* stable player or prospect-right record.

A player may be owned once in each separate league, but may not be owned by more than one team in the same league.

Missing or conflicting league context must fail without changing state.

---

# Part 2 — Roster Actors

## Team Manager

A manager may perform approved normal roster moves for an assigned team.

The backend must verify the manager’s current membership and team assignment for every write.

A manager may not:

* modify another team without a separate assignment;
* invent a player or contract;
* override category eligibility;
* rewrite a matchup snapshot;
* correct historical roster records;
* bypass a league freeze.

---

## Commissioner

A commissioner may:

* perform ordinary roster moves for any team in the assigned league;
* make explicit roster corrections;
* make the approved manual prospect-signing decisions for a team;
* correct roster-category and related contract records where authorized.

Commissioner actions must be clearly identified as commissioner actions.

No written reason is required.

Commissioner corrections create league activity unless they affect only matchup or standings records.

---

## Platform Administrator

A platform administrator needs an active league membership and approved administrative authority to operate on a league roster.

Platform authority alone does not silently create league membership or player ownership.

---

## Authenticated League Member

An authenticated user with an active league membership may view the league’s approved roster and contract information.

Viewing does not grant roster-management authority.

---

## Unauthenticated Visitor

An unauthenticated visitor may view every league’s approved public rosters through read-only access.

No public roster request may create, normalize, repair, reorder, or otherwise change roster state.

---

# Part 3 — Core Roster Records

## Roster Assignment

A roster assignment connects:

* one stable assignment ID;
* one league ID;
* one team ID;
* one stable player ID or prospect-right ID;
* one explicit roster category;
* the approved timestamps and history references.

Display name, list index, salary, or team name must not serve as the sole ownership key.

---

## Required Categories

Season 2 requires:

* `Active`;
* `Bench`, also called `Inactive`;
* `Injured Reserve`;
* `Prospect`.

The category must be stored explicitly.

No goalie category exists.

Additional roster categories require later approval.

---

## Active Roster

Each team has:

```text
12 forward slots
6 defence slots
18 total active slots
0 goalie slots
```

Empty active slots are legal.

Forward and defence slots are not interchangeable.

Only active-roster player AAV contributes player salary to cap usage.

Only the persisted active players in the scoring-eligible matchup snapshot may collect matchup points.

---

## Bench or Inactive Roster

Each team has four bench slots shared by forwards and defence players.

A player may occupy or remain on the bench only when the underlying contract AAV is `$4.00` or less.

A benched player:

* remains owned;
* keeps the same contract;
* contributes no player salary to cap usage;
* collects no matchup points;
* remains visible in roster, contract, and activity records.

---

## Injured Reserve

Each team has four injured-reserve slots.

An eligible player on injured reserve:

* remains owned;
* keeps the same contract;
* contributes no player salary to cap usage;
* collects no matchup points;
* remains visible in roster, contract, and activity records.

A player unavailable because of injury or illness is eligible for injured reserve.

The initial release does not automatically import or enforce NHL player-status data for injured-reserve eligibility. That integration, automatic eligibility rechecks, and automatic warnings are assigned to a future update.

Managers make the initial manual placement decision, and commissioners may explicitly override eligibility when source information is missing or wrong.

---

## Prospect Roster

Prospect slots are unlimited.

A player may enter a prospect roster only when:

* the team drafted that player; or
* the team received the player’s prospect rights from another team that held the player as a prospect.

A prospect before fantasy ELC signing:

* has no fantasy salary;
* has no normal contract before signing;
* uses no active, bench, or injured-reserve slot;
* contributes nothing to cap usage;
* collects no matchup points;
* remains a tradeable player-rights asset.

After signing the fantasy ELC, a player may remain in the Prospect category. While there, the player’s ELC salary does not count against the cap and the player does not collect matchup points.

An ordinary free agent or contracted roster player may not be converted into a prospect.

---

# Part 4 — Position Model

## Position Groups

NHL positions normalize as:

```text
C, LW, RW → F
LD, RD → D
```

Hundo Leago has no forward-and-defence dual-position player.

A player must resolve to exactly one permitted position group before occupying an active or bench slot.

---

## Position Changes

A source-data position change must not silently rewrite a persisted matchup snapshot.

The normal roster must be revalidated against the current authoritative position.

The authoritative NHL player database supplies the source position before normalization.

An imported position change takes effect for normal roster legality when the backend saves it. If the change makes the normal roster illegal, assignments remain in place and the roster is marked illegal.

A commissioner may explicitly correct a missing or incorrect Hundo Leago position within the commissioner’s league.

---

# Part 5 — Normal Roster Moves

## Move Types

The roster workflow must support eligible moves between:

* active and bench;
* active and injured reserve;
* bench and injured reserve by moving through active;
* prospect and a normal roster category only through an approved prospect-signing action.

Acquisition and ownership changes enter through Auctions, Trades, Entry Draft, approved prospect signing, or commissioner correction.

An ordinary category move does not create or replace ownership.

---

## Normal Move Sequence

The intended sequence is:

1. The authorized user selects a player and destination category.
2. The frontend shows known eligibility and resulting-count information.
3. The backend authenticates the actor and reloads current league and team authority.
4. The backend loads the current player, ownership, category, contract, cap obligations, and league rules.
5. The backend verifies destination eligibility.
6. The backend calculates the complete resulting roster, cap usage, and legality result.
7. If the result is illegal, the product displays a general illegality flag.
8. The user completes any required confirmation.
9. The backend revalidates current state and saves the move atomically.
10. The backend creates the required activity record.
11. The backend returns authoritative roster, cap, and legality information.

The transaction may complete with an illegal resulting roster after the user confirms the general illegality flag.

---

## No Hidden Contract Change

Moving a player between active, bench, and injured reserve:

* changes roster category;
* may change whether player AAV counts against the cap;
* does not change AAV;
* does not change remaining years;
* does not create a new contract;
* does not extend a contract.

---

## Duplicate and Stale Actions

A repeated or stale request must not:

* move the player twice;
* create duplicate assignment records;
* overwrite a newer category;
* apply to a different team;
* duplicate activity history;
* create a contract;
* rewrite a matchup snapshot.

The backend must reject a stale precondition or return the already-completed authoritative result when the operation is safely idempotent.

---

# Part 6 — Prospect Workflows

## Prospect Acquisition

An Entry Draft selection creates prospect rights for the drafting team.

A trade of existing prospect rights:

* removes those rights from the sending team;
* assigns them to the receiving team;
* preserves prospect status;
* creates no salary or normal contract;
* uses no normal roster slot.

---

## Fantasy ELC

The approved fantasy ELC is:

```text
Total contract value: $3
Term: 3 years
AAV: $1
```

A real-life ELC signing is the intended trigger for the manager’s fantasy signing option.

Automatic detection, notification, deadline enforcement, forced signing, forced release, and automatic roster movement are deferred.

Until a future approved update implements that automation, the system must not silently sign or release a prospect because of external data.

The manager has complete manual authority over the prospect-signing decision during this deferred period.

---

## Prospect Signing Boundary

Signing a prospect must be an explicit action that:

* verifies ownership of the prospect rights;
* creates exactly one fantasy ELC;
* permits the signed player to remain in Prospects or move to an approved normal roster category;
* calculates resulting roster and cap legality;
* saves every effect atomically;
* creates one activity record.

The manager may initiate this action manually at any time while automatic real-life ELC enforcement remains deferred.

The signing screen reminds the manager that the intended trigger is the player’s real-life ELC signing.

The manager may:

* keep the signed player in Prospects with no cap charge;
* move the player to Active;
* move the player to Bench;
* move the player to Injured Reserve when eligible.

A signing destination that would make the roster illegal is rejected. The player may remain in Prospects instead.

Once a signed player moves to Active or Bench, that player may not return to Prospects.

A separate `Decline ELC` action releases the prospect rights rather than creating the fantasy ELC.

The manager may also voluntarily release unsigned prospect rights.

Release:

* requires an `Are you sure?` confirmation;
* makes the rights unowned;
* creates league activity history;
* does not make the player eligible for a normal free-agent auction unless a later approved specification permits it;
* permits the player to re-enter the Entry Draft only when the player was drafted in the immediately preceding year.

---

# Part 7 — Injured-Reserve Workflow

## Placement

An injured-reserve placement must verify:

* league and team;
* player ownership;
* current roster category;
* the manager’s or commissioner’s explicit injury-or-illness eligibility selection;
* available injured-reserve space;
* actor permission;
* resulting roster and cap state.

The placement changes category only and preserves the contract.

---

## Eligibility Change

The system must not silently delete, release, or move a player whose injury status changes.

In the initial release:

* NHL status imports do not automatically determine or recheck eligibility;
* no automatic ineligibility warning is required;
* a status change does not automatically make the roster illegal;
* the system does not automatically move the player;
* there is no formal grace period after eligibility ends, although the deferred automation means the status change does not itself mark the roster illegal;
* an authorized manager or commissioner must explicitly move the player;
* movement between Bench and Injured Reserve must pass through Active.

Automated imported eligibility, rechecks, and warnings are future updates.

---

# Part 8 — Cap and Legality

## Salary Cap

The Season 2 salary cap is `$100`.

Cap usage is:

```text
active player AAV
+ retained-salary obligations
+ buyout penalties
```

Bench, injured-reserve, prospect, and empty-slot amounts do not contribute player salary.

All pages must display the same backend-authoritative cap usage and cap space.

---

## Structured Legality Result

A legality result must be capable of explaining:

* cap usage and cap limit;
* active player count and limit;
* forward count and limit;
* defence count and limit;
* goalie or unsupported-position assignments;
* bench count and limit;
* bench players over `$4.00 AAV`;
* injured-reserve count and limit;
* injured-reserve eligibility failures;
* invalid prospect assignments;
* duplicate or cross-league ownership;
* missing or invalid required contracts;
* every other approved legality failure.

Empty active slots are not legality failures.

---

## Temporary Illegality

A transaction that creates an illegal normal roster may complete after a general illegality flag and confirmation.

The product must:

* avoid presenting the roster as legal;
* retain the authoritative legality result after the transaction;
* provide a visible path to correct the roster.

No read-only request may repair illegality.

---

# Part 9 — Matchup Boundary

## Normal Lock

The normal matchup roster lock is Monday at `4:00 PM Pacific`, using the league’s `America/Vancouver` timezone.

Managers do not submit a separate lineup.

When the normal roster is legal, the backend automatically persists the active roster as that team’s scoring-eligible snapshot.

---

## Illegal at Normal Lock

When a team is illegal at the normal lock:

1. No normal scoring-eligible snapshot is created.
2. The team collects no points while it lacks a legal scoring snapshot.
3. Normal roster adjustments remain available.
4. When the roster first becomes legal, the backend persists a team-specific snapshot, eligibility time, and scoring baseline.
5. Only points earned after that baseline count.
6. Earlier points are not recovered.

---

## Post-Lock Changes

After a legal scoring snapshot exists:

* later roster moves affect normal roster state and future matchup eligibility;
* later moves do not change the current snapshot;
* a newly illegal normal roster does not interrupt current locked-player scoring;
* read operations do not rebuild the snapshot.

The Matchups specification defines snapshot storage, week boundaries, and matchup-only corrections.

Matchup snapshots, baselines, and scoring information do not create league activity-history entries.

---

# Part 10 — Public and Authenticated Views

## Public Roster

Every league’s roster is public and read-only while the league is publicly eligible under Leagues and Teams.

At minimum, the approved public roster includes:

* stable public player reference;
* player name;
* normalized position;
* roster category;
* fantasy AAV or salary;
* remaining contract years.

Public rosters also show:

* team cap usage and cap space;
* retained-salary total;
* buyout-penalty total;
* player age and season statistics when external data is available.

---

## Authenticated Roster

An authenticated league member may view the approved roster, contract, activity, and competitive information for that league.

Manager controls appear only for assigned teams.

Commissioner controls must be visibly distinguished from ordinary manager controls.

Frontend visibility is not authorization.

---

# Part 11 — Activity and Corrections

## Roster Activity

Every completed roster ownership or category change creates a durable league activity record using the shared activity-history format.

No additional roster-specific activity display field set is required.

Failed or cancelled attempts do not create league transaction history.

---

## Commissioner Correction

A commissioner correction must:

* be explicit;
* identify the commissioner as actor;
* identify affected records;
* preserve useful before-and-after information;
* validate and save the complete result atomically;
* create activity history unless it affects only matchup or standings state.

No written correction reason is required.

---

# Part 12 — User Interface Requirements

## Team Roster Page

The page must clearly show:

* team identity;
* active, bench, injured-reserve, and prospect categories;
* used and available slots;
* normalized positions;
* AAV and remaining years where applicable;
* cap usage, cap limit, and cap space;
* retained salary and buyout totals used by the cap calculation;
* current legality;
* every known legality reason;
* current manager or commissioner controls.

---

## Move Feedback

The interface must provide:

* a clear selected player and destination;
* eligibility feedback;
* pending state;
* general illegal-result flag;
* success or failure result;
* refreshed authoritative roster and cap values.

It must not optimistically show a durable move as complete before backend confirmation.

---

## Accessibility

Roster moves must not require pointer drag-and-drop as the only control.

Every move must be possible with keyboard-accessible controls and labeled actions.

Colour alone must not communicate category, position, legality, or cap state.

---

# Part 13 — Validation and Edge Cases

## Required Validation

The backend must validate:

* authenticated actor;
* current membership, role, and team assignment;
* league and team relationship;
* stable player identity;
* same-league ownership;
* source category;
* destination category;
* position;
* category eligibility;
* contract existence where required;
* slot limits;
* cap result;
* league freeze;
* current record version or equivalent stale-write protection.

---

## Missing External Data

Missing player, position, injury, or contract data must not be guessed.

The system must:

* show what information is missing;
* reject actions whose eligibility cannot be proved;
* preserve existing durable state;
* provide an approved commissioner correction path.

---

## Atomic Save Failure

If a roster action affects assignment, contract, cap, prospect rights, or activity records, all effects must complete or none may complete.

The frontend must not claim success when the durable result is uncertain.

---

# Part 14 — Required Testing

## Category and Position Tests

Tests must cover:

* 0 through 12 forwards;
* rejection or illegality beyond 12 forwards;
* 0 through 6 defence players;
* rejection or illegality beyond 6 defence players;
* empty active slots;
* no goalies;
* C, LW, and RW normalization to F;
* LD and RD normalization to D;
* no F/D dual position;
* four bench slots;
* `$4.00` bench eligibility;
* rejection above `$4.00`;
* four injured-reserve slots;
* unlimited eligible prospects.

---

## Ownership and Move Tests

Tests must cover:

* one owner per player per league;
* the same player owned independently in separate leagues;
* stable player IDs;
* active, bench, and injured-reserve moves;
* prospect-right trade preservation;
* prospect-signing atomicity;
* unauthorized team access;
* cross-league identifiers;
* duplicate submission;
* stale category;
* concurrent moves for the same player;
* failed save without partial changes.

---

## Cap and Legality Tests

Tests must cover:

* active-player AAV;
* excluded bench, injured-reserve, and prospect salary;
* retained obligations;
* buyout penalties;
* exactly `$100`;
* above `$100`;
* every structured legality reason;
* an illegal transaction completing with a warning;
* no hidden repair through reads;
* consistent cap totals on every page.

---

## Matchup-Boundary Tests

Tests must cover:

* legal normal lock;
* illegal normal lock;
* late legality and team-specific baseline;
* exclusion of pre-baseline points;
* post-lock normal roster changes;
* post-lock normal-roster illegality without scoring interruption;
* immutable persisted snapshots;
* no roster-lock or baseline activity-history entry.

---

# Part 15 — Approval Checklist

Grae approved the following Season 2 Rosters product decisions on 2026-07-18.

## Approved Roster Foundation

- [x] Each team has 18 active slots: 12 forward and 6 defence.
- [x] Empty active slots are legal.
- [x] Forward and defence slots are not interchangeable.
- [x] C, LW, and RW normalize to F; LD and RD normalize to D.
- [x] Hundo Leago has no F/D dual-position players and no goalies.
- [x] Each team has four bench or inactive slots shared by forwards and defence players.
- [x] A benched player may have no more than `$4.00 AAV`.
- [x] Each team has four injured-reserve slots.
- [x] Prospect slots are unlimited.
- [x] Only drafted prospects or prospect rights received as prospects through trade may enter the prospect roster.
- [x] Unsigned prospects have no salary; signed prospects kept in Prospects have a cap-exempt ELC, use no normal roster slot, and collect no matchup points.
- [x] A player or prospect right may have only one owner in a league.
- [x] Ownership and assignments use stable IDs and remain league-scoped.

## Approved Cap and Matchup Rules

- [x] The salary cap is `$100`.
- [x] Cap usage includes active-player AAV, retained salary, and buyout penalties only.
- [x] Bench, injured-reserve, and prospect player salary does not count against the cap.
- [x] Only active players in a persisted scoring-eligible snapshot collect matchup points.
- [x] The normal roster locks Monday at `4:00 PM Pacific`.
- [x] Managers do not submit a separate matchup lineup.
- [x] Transactions that create an illegal roster may complete with a warning.
- [x] A team illegal at normal lock collects no points until a legal team-specific snapshot and baseline are persisted.
- [x] Points earned before the late-legality baseline are not recovered.
- [x] Post-lock normal roster changes do not alter an existing legal matchup snapshot or interrupt its scoring.
- [x] Matchup and standings information does not enter league activity history.

## Approved Permission and History Rules

- [x] Managers may perform approved normal roster moves for assigned teams.
- [x] Commissioners may perform roster moves and explicit corrections for any team in their league.
- [x] A platform administrator needs active league membership and authority to operate in a league.
- [x] Public rosters are read-only and available for every publicly eligible league.
- [x] Every completed roster ownership or category change creates league activity history.
- [x] Commissioner roster corrections are distinct from ordinary manager moves.
- [x] No written reason is required for a commissioner correction.
- [x] Read-only roster requests never repair, normalize, reseed, or mutate state.
- [x] A league freeze blocks every manager roster write while authorized commissioner actions remain available.

## Roster Presentation Decisions

- [x] The roster page displays separate sections for Active, Bench, Injured Reserve, and Prospects.
- [x] Active players display forwards first and defence second; within each group the default order is AAV descending and then player name.
- [x] Managers may save a custom player order within each roster category.
- [x] Reordering players within the same category does not create league activity history.
- [x] Roster moves support both drag-and-drop and labeled keyboard-accessible move controls.
- [x] Moving a player requires confirmation only when the resulting normal roster is illegal.
- [x] The interface shows the current normal roster and the current matchup snapshot as separate views after lock; future updates may add alternate view methods.
- [x] Public rosters show player name, stable public player reference, normalized position, roster category, AAV, and remaining contract years.
- [x] Public rosters also show team cap usage, cap space, retained-salary total, and buyout-penalty total.
- [x] Public rosters show player age and season statistics when that external data is available.

## Position Decisions

- [x] The authoritative current NHL player database supplies the source position before Hundo Leago normalization.
- [x] Position changes take effect for normal roster legality as soon as the backend imports and saves the new position.
- [x] A source position change never alters an already persisted matchup snapshot.
- [x] A position change that makes the normal roster illegal leaves the assignments in place and marks the roster illegal.
- [x] The commissioner may explicitly correct a player’s Hundo Leago position when source data is missing or wrong.
- [x] A commissioner position correction applies only within the commissioner’s league.

## Injured-Reserve Decisions

- [x] Automatic injured-reserve eligibility from imported authoritative NHL status data is deferred to a future update.
- [x] Any player unavailable because of injury or illness is eligible for injured reserve.
- [x] The commissioner may explicitly override injured-reserve eligibility when source data is missing or wrong.
- [x] Automatic status-import rechecks and automatic pre-move status verification are deferred to a future update.
- [x] A player whose status changes remains in place and the status change does not automatically make the normal roster illegal in the initial release.
- [x] The system never moves a newly ineligible player out of injured reserve automatically.
- [x] Automatic manager and commissioner warnings for changed injured-reserve eligibility are deferred to a future update.
- [x] There is no formal grace period after injured-reserve eligibility ends, but the deferred automation means the status change does not itself mark the roster illegal.
- [x] Movement between Bench and Injured Reserve must pass through Active.

## Prospect Decisions

- [x] During deferred automatic ELC enforcement, the manager may initiate the fantasy ELC signing action manually at any time.
- [x] The manual prospect-signing screen reminds the manager that the intended trigger is the player’s real-life ELC signing.
- [x] A signed prospect may remain in Prospects without the ELC salary affecting the cap, or move to Active, Bench, or eligible Injured Reserve.
- [x] Prospect signing may not complete with an illegal resulting roster.
- [x] Once a signed prospect moves to Active or Bench, the player may not return to Prospects.
- [x] The initial release includes a separate `Decline ELC` action.
- [x] A manager may voluntarily release unsigned prospect rights.
- [x] Released rights become unowned; the player cannot enter a normal free-agent auction unless later approved and may re-enter the Entry Draft only when drafted in the immediately preceding year.
- [x] Prospect-right release requires an `Are you sure?` confirmation and creates league activity history.

## Move, Warning, and Correction Decisions

- [x] Ordinary Active, Bench, and Injured Reserve moves remain available at all times except during a league freeze.
- [x] A legal move is saved immediately without an additional confirmation.
- [x] An illegal-result confirmation requires only a general illegality flag rather than a list of every legality reason.
- [x] Failed, rejected, and cancelled roster moves do not create league activity history.
- [x] A commissioner correction uses the same slot, position, and cap legality calculation as a manager move.
- [x] A commissioner may save an illegal corrected roster after the same general illegality flag and confirmation.
- [x] A commissioner correction never changes a matchup snapshot unless the commissioner uses a separate matchup-correction workflow.
- [x] Roster activity uses the shared league activity format without a separate roster-specific display-field requirement.

## Approval

- [x] Remaining implementation details are assigned to the appropriate product and technical specifications.
- [x] Grae approves this document as the Season 2 Rosters product specification.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The rule-approval phase for this product specification is complete because:

* Grae approved or revised every material product decision;
* active, bench, injured-reserve, and prospect workflows are explicit;
* the manual initial injured-reserve boundary and future automation are separated;
* signed-prospect, ELC, decline, and release behaviour are explicit;
* position changes, roster moves, illegality flags, and corrections are explicit;
* public display and matchup-snapshot boundaries are explicit;
* no unchecked workflow is presented as final behaviour.

The planned Data Model, API Contracts, Security, Testing Strategy, and migration work must implement these approved workflows without relying on the current single-list or frontend-authoritative assumptions.

Verification must prove roster reads cannot reseed, repair, or overwrite live league data.

---

# Related Documents

```text
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/07-testing/TESTING_STRATEGY.md
```
