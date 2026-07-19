# Hundo Leago — League Rules

## Document Status

`APPROVED`

Grae approved the Season 2 league-rule baseline recorded in this document on 2026-07-18.

This document consolidates:

* rules already used during Season 1;
* Season 2 requirements established by the canonical project foundation;
* cross-feature rules that must remain consistent;
* approved boundaries for decisions that belong in more specific product or technical specifications.

Existing code is evidence of current behaviour. It is not automatically proof that a rule is approved for Season 2.

---

## Document Purpose

This document defines league-wide rules that affect more than one Hundo Leago feature.

It is intended to prevent roster, contract, auction, trade, buyout, matchup, and commissioner systems from implementing different versions of the same rule.

This document defines:

* league isolation;
* rule ownership and configuration;
* roster and salary-cap baselines;
* roster-legality principles;
* injured-reserve treatment;
* shared contract and cap-obligation rules;
* cross-feature transaction rules;
* important league timing;
* activity-history requirements;
* commissioner correction requirements;
* decisions that must be resolved in more specific specifications.

This document does not define:

* fantasy-point formulas;
* standings formulas;
* complete user and role permissions;
* complete feature workflows;
* API shapes;
* database tables;
* implementation file structure;
* deployment or migration steps.

Those subjects belong in the related rules, product specifications, technical specifications, and work plans.

---

# Part 1 — Rule Authority

## League Rules Are League-Scoped

Every team, roster, contract, auction, trade, buyout, matchup, and standings record must belong to one league.

A league-specific action must use the rules belonging to that same league.

The system must not:

* use one global league state for all leagues;
* combine records from different leagues;
* apply one league’s settings to another league;
* infer league identity from a team name;
* infer league identity from a player name;
* reuse stale selected-league state for another account;
* silently fall back to the original Hundo Leago league when league context is missing.

When league context is missing or ambiguous, the action must fail clearly without changing state.

---

## Backend Authority

The backend is authoritative for:

* roster ownership;
* roster category;
* roster size;
* positional counts;
* roster legality;
* player salary;
* contract state;
* salary-cap totals;
* cap obligations;
* cap space;
* auction validation and resolution;
* trade validation and completion;
* buyout validation and consequences;
* matchup eligibility;
* persisted activity history.

The frontend may display calculations and provide early validation for usability, but it must not become an independent authority for league rules.

Frontend and backend calculations must not be allowed to drift.

---

## Rule Configuration

Season 2 must be designed so league-wide limits can be stored as league settings rather than scattered through frontend and backend source files.

At minimum, the rule model must be capable of representing approved values for:

* salary cap;
* active-roster position limits;
* bench or inactive-roster limit;
* bench salary eligibility;
* prospect-roster rules;
* injured-reserve limit;
* contract-term limits;
* contract-value precision;
* retained-salary limit;
* retention-slot limit;
* buyout formula;
* transaction deadlines;
* matchup and roster-lock timing.

The initial Season 2 release is not required to support every possible rule variation.

Only approved settings need to be configurable. Unsupported variations must not be presented as working options.

---

## Rule Changes

A material league-rule change requires:

1. Grae’s approval.
2. An update to the authoritative rule or product specification.
3. Identification of affected stored data.
4. Identification of affected frontend and backend behaviour.
5. A migration plan when existing records are affected.
6. Focused verification.
7. An activity or decision record when appropriate.
8. A clear effective date or effective season.

A code change must not silently redefine a league rule.

---

# Part 2 — Season 2 Baseline

## Approval Boundary

The values in this part are approved for the original Hundo Leago league’s Season 2 baseline.

They must not be hard-coded as permanent limits for every possible league.

---

## Core Values

| Rule | Season 2 baseline | Status |
| --- | ---: | --- |
| Salary cap | `$100` | Approved 2026-07-18 |
| Active-roster slots | `18` | Approved 2026-07-18 |
| Forward slots | `12` | Approved 2026-07-18 |
| Defence slots | `6` | Approved 2026-07-18 |
| Goalie slots | `0` | Approved 2026-07-18 |
| Bench or inactive-roster slots | `4` | Approved 2026-07-18 |
| Maximum salary for a benched player | `$4 AAV` | Approved 2026-07-18 |
| Prospect-roster slots | `Unlimited` | Approved 2026-07-18 |
| Maximum injured-reserve assignments | `4 players` | Approved 2026-07-18 |
| Maximum retained salary on one player | `50% of that player’s AAV, cumulative` | Approved 2026-07-18 |
| Maximum retained-salary slots per team | `3` | Approved 2026-07-18 |
| Standard buyout penalty | `25% of AAV for each remaining contract year` | Approved 2026-07-18 |
| Contract length | `1 to 3 years` | Approved 2026-07-18 |
| Team-wide total contract-year limit | `None` | Approved 2026-07-18 |
| Contract extensions | `Not permitted` | Approved 2026-07-18 |
| Fantasy ELC | `$3 total over 3 years; $1 AAV` | Approved 2026-07-18 |
| Free-agent signing buyout lock | `14 days` | Approved 2026-07-18 |
| Trade-proposal lifetime | `7 days` | Approved 2026-07-18 |
| Auction rollover | `Sunday at 4:00 PM Pacific` | Approved 2026-07-18 |
| New-auction opening | `Monday at 12:00 AM Pacific` | Approved 2026-07-18 |
| New-auction cutoff | `Thursday at 11:59 PM Pacific` | Approved 2026-07-18 |
| Seasonal auction closure | `Start of playoffs through completion of next season’s Free Agent Draft` | Approved 2026-07-18 |
| Contract-year rollover | `End of league season` | Approved 2026-07-18 |
| Weekly roster lock | `Monday at 4:00 PM Pacific` | Approved 2026-07-18 |
| Regular-season matchup opening | `First full Monday–Sunday week of the NHL regular season` | Approved 2026-07-18 |
| Fantasy playoff length | `4 weeks across 3 rounds: 1 week, 1 week, 2 weeks` | Approved 2026-07-18 |
| Fantasy playoff finish | `Final two weeks of the NHL regular season` | Approved 2026-07-18 |
| League timezone | `America/Vancouver` | Approved 2026-07-18 |

The approval checklist near the end of this document records the completed decisions.

---

## Units and Precision

Contract values, bids, average annual values, retained salary, buyout penalties, and cap totals use the following approved precision rules:

* A one-year contract bid may contain up to two decimal places.
* The total contract value bid for a two-year or three-year contract must be a whole number.
* Average annual value may contain up to two decimal places.
* Average annual value is calculated as total contract value divided by contract years.
* A calculated average annual value is rounded to the nearest hundredth.
* Retained salary and buyout penalties are calculated from average annual value and rounded to the nearest hundredth.
* Stored and displayed cap amounts must not contain more than two decimal places.

Examples:

```text
1 year at $4.25 total = $4.25 AAV
2 years at $9 total = $4.50 AAV
3 years at $10 total = $3.33 AAV after rounding
```

The technical specifications must define one decimal implementation that avoids inconsistent floating-point results.

---

# Part 3 — Rosters

## Roster Ownership

A player or that player’s prospect rights may not be simultaneously owned by more than one team in the same league.

Player ownership must use stable player IDs.

Display names must not be used as the sole ownership key.

The system must reject a roster assignment when:

* the league does not exist;
* the team does not belong to the league;
* the player does not exist;
* the player ID is invalid;
* the player is already owned by another team in the same league;
* the requesting user lacks permission;
* the requested roster category is not enabled for the league.

---

## Required Season 2 Roster Categories

The launch-critical roster model must support:

* active roster assignments;
* bench or inactive-roster assignments;
* injured-reserve assignments;
* prospect-roster assignments.

These categories have different eligibility, salary, cap, and matchup effects. The system must store the category explicitly rather than infer it from list position or salary.

No goalie category exists in Hundo Leago.

Any additional category requires explicit approval before implementation.

---

## Active Roster

The active roster contains:

```text
18 available slots
12 forward slots
6 defence slots
0 goalie slots
```

The active roster may contain empty slots.

Empty slots do not make a roster illegal by themselves.

A team may not use an empty forward slot as an additional defence slot or an empty defence slot as an additional forward slot.

A legal active roster therefore has:

* no more than 12 forwards;
* no more than 6 defence players;
* no goalies;
* no more than 18 total active players;
* any number of empty slots within those limits;
* no other roster or cap violation.

NHL source positions are normalized as follows:

```text
C, LW, RW → F
LD, RD → D
```

Hundo Leago has no forward-and-defence dual-position players. A player must resolve to exactly one permitted Hundo Leago position group before occupying an active or bench slot.

The backend must return authoritative roster counts and legality results.

---

## Bench or Inactive Roster

Each team has:

```text
4 bench or inactive-roster slots
```

A benched player may be a forward or defence player.

A player may occupy a bench slot only when the player’s average annual value is:

```text
$4.00 or less
```

A player with an average annual value above `$4.00` may not be moved to or remain on the bench.

Benched players:

* remain owned by the team;
* keep their existing contract unchanged;
* do not collect matchup points while benched;
* do not have their salary included in team cap usage;
* remain visible in roster, contract, and history records.

Moving a player to or from the bench must be an explicit logged roster move.

---

## Prospect Roster

Prospect-roster slots are unlimited.

A player may enter a team’s prospect roster only when:

* that team drafted the player; or
* the team acquired the player through a trade from another team that held the player in its prospect roster.

A normal free agent, active-roster player, benched player, or injured-reserve player may not be converted into a prospect merely to avoid salary, roster, contract, or cap rules.

A prospect:

* has no fantasy salary while remaining an unsigned prospect;
* does not use an active, bench, or injured-reserve slot;
* does not count against the salary cap;
* does not collect matchup points;
* remains a tradeable player-rights asset;
* remains linked to the drafting history and current rights-owning team.

A prospect who signs the fantasy ELC may remain in the Prospect category. The contract exists, but its salary remains cap-exempt and the player remains ineligible for matchup points while assigned to Prospects.

Once a signed prospect moves to Active or Bench, the player may not return to Prospects.

The approved Hundo Leago fantasy entry-level contract is:

```text
Total contract value: $3
Contract length: 3 years
Average annual value: $1
```

The long-term rule is that a prospect becomes eligible for this fantasy ELC when the player signs a real-life entry-level contract.

Automatic detection, notification, deadlines, forced decisions, and enforcement of this rule are deferred to a future update. Until that update is deliberately planned and implemented, the system must not silently sign, release, or move a prospect because of real-life contract status.

Managers may initiate the manual ELC signing, decline, and prospect-right release workflows approved in the Rosters specification.

Declining the ELC or voluntarily releasing unsigned prospect rights makes the rights unowned. The player may re-enter the Entry Draft only when drafted in the immediately preceding year and may not enter a normal free-agent auction unless a later approved specification permits it.

The future Roster, Contract, and Entry Draft specifications must define:

* how the real-life entry-level signing is detected and confirmed;
* how and when the manager is notified;
* the deadline for exercising the fantasy signing option;
* the result when the manager declines or misses the signing deadline;
* the roster and cap effects of signing the prospect.

The absence of current enforcement is a documented deferred feature, not permission for code to invent an automatic workflow.

---

## Injured Reserve

The injured-reserve limit is:

```text
4 players
```

The approved cap treatment is:

```text
An eligible player assigned to injured reserve does not count against the salary cap.
```

This exemption must not erase or replace the player’s contract.

The player remains:

* owned by the team;
* associated with the same league;
* associated with the same contract;
* visible in team and commissioner records;
* part of the activity trail for roster moves.

For the initial release, injury-or-illness eligibility is selected manually by a manager or commissioner. Automatic imported NHL status, rechecks, and changed-status warnings are deferred.

The Roster specification defines:

* manual injury eligibility;
* the future imported eligibility source;
* the absence of initial automatic rechecks and warnings;
* movement after an eligibility change;
* whether injured-reserve players count toward any separate ownership limit;
* how injured reserve affects matchup eligibility;
* commissioner correction authority.

The frontend must not decide injury eligibility on its own.

---

## Roster Moves

A roster move must:

1. identify the league;
2. identify the team;
3. identify the player by stable ID;
4. identify the source and destination roster categories;
5. verify the user’s permission;
6. verify category eligibility;
7. calculate the resulting roster and cap state;
8. save the change atomically;
9. create an activity record;
10. return the authoritative result.

A read-only roster request must not normalize, repair, reseed, or otherwise change the roster.

---

# Part 4 — Salary Cap and Roster Legality

## Salary Cap

The proposed salary cap for the original Hundo Leago league is:

```text
$100
```

The backend must calculate cap usage from approved cap obligations.

The frontend must display the backend result or use a shared, verified contract that cannot disagree with the backend.

---

## Cap Obligations

The approved Season 2 cap composition is:

```text
cap usage
= active player salaries
+ retained-salary obligations
+ buyout penalties
```

Only the following affect cap usage:

* the average annual value of active-roster player contracts;
* retained-salary obligations;
* buyout penalties.

The following do not affect cap usage:

* benched or inactive-player salaries;
* injured-reserve player salaries;
* unsigned prospects and signed prospects assigned to the Prospect category;
* empty roster slots.

Moving a player between roster categories changes whether that player’s average annual value is included in cap usage. It does not change the contract itself.

Retained-salary obligations and buyout penalties remain cap obligations even though no active player salary is attached to that portion of the cap charge.

---

## Cap Space

Cap space is conceptually:

```text
salary cap - cap usage
```

All pages and panels must use the same authoritative calculation.

The known disagreement between current cap displays must be reproduced and resolved before the Season 2 roster and contract systems are considered complete.

---

## Legality Result

Roster legality must be returned as structured information rather than one unexplained boolean.

At minimum, a legality result should be able to identify:

* cap usage;
* cap limit;
* roster count;
* roster limit;
* forward count;
* forward-slot limit;
* defence count;
* defence-slot limit;
* unsupported goalie count;
* bench count;
* bench limit;
* each benched player’s average annual value;
* bench salary limit;
* injured-reserve count;
* injured-reserve limit;
* invalid roster assignments;
* invalid or missing contracts;
* each reason the roster is illegal.

The exact API shape belongs in `docs/04-technical-specs/API_CONTRACTS.md`.

---

## Temporary Illegality

Transactions are allowed to complete when their resulting roster is illegal.

Before completion, the system must:

* calculate the resulting roster and cap state;
* display a general illegality flag;
* require any normal transaction confirmation defined by the applicable product specification;
* log the completed transaction.

The backend must not report an illegal result as legal merely because the transaction is permitted to complete.

Roster legality affects matchup scoring when a team’s scoring-eligible roster snapshot is created.

When a team has an illegal roster at the normal Monday `4:00 PM Pacific` roster lock:

1. The team does not receive its normal scoring-eligible roster snapshot.
2. The team’s players do not collect matchup points while the team remains without a legal scoring snapshot.
3. The team may make approved adjustments to become legal.
4. When the roster first becomes legal, the backend records a team-specific scoring-eligible roster snapshot, eligibility time, and scoring baseline.
5. Only fantasy points earned after that team-specific baseline count for the team in that matchup week.
6. Points earned before legality was restored are not recovered.

Once a legal scoring-eligible roster snapshot has been created for the matchup week, later roster adjustments do not affect that matchup. The team’s normal roster may become illegal after its lock without interrupting the locked players’ fantasy-point earnings for the current matchup.

Post-lock roster changes apply to normal roster state and future matchup eligibility. They must not silently rewrite the current locked roster snapshot.

Roster legality must not be repaired through a read-only request or hidden automatic roster move.

This rule must be implemented consistently across Rosters, Auctions, Trades, Matchups, Standings, and Commissioner Tools.

---

# Part 5 — Contracts and Cap Obligations

## Contract Requirement

Every normally owned active, benched, or injured-reserve player must have one league-specific contract record unless an approved product specification defines a different ownership type.

A signed prospect retained in the Prospect category also has the approved fantasy ELC, but its salary remains cap-exempt while the player remains there.

A contract must remain linked to:

* one league;
* one team;
* one player ID;
* its original total contract value and average annual value;
* its approved term and status.

Moving a player between roster categories must not create a duplicate contract.

---

## Contract Length and Renewal

Normal Hundo Leago contracts range from:

```text
1 to 3 years
```

There is no team-wide limit on the total number of contract years held.

Contracts may not be extended.

Remaining contract years include the current league season.

Examples:

```text
1 year remaining = the contract expires after the current season
2 years remaining = the current season plus one additional season
3 years remaining = the current season plus two additional seasons
```

Contract-year advancement and expiration are processed at the end of the league season.

Every contract held during that season advances or expires in the same end-of-season rollover, including a contract won in a midseason auction. A midseason acquisition does not delay the use of that contract year.

When a contract expires:

1. The contract ends.
2. The player is immediately removed from the team roster.
3. The player immediately becomes a free agent.
4. The former team receives no exclusive re-signing opportunity.
5. The expiration and roster removal are recorded in league history.

An expired contract may not be extended or renewed in place. Any later contract must be created through an approved free-agent process.

The approved normal non-ELC minimum is `$1 AAV` per contract year:

```text
1 year = at least $1 total
2 years = at least $2 total
3 years = at least $3 total
```

There is no separate monetary maximum, and three years remains the maximum term.

The Contract specification defines:

* the exact idempotent rollover operation;
* how fantasy entry-level contracts are created;
* what history must be preserved.

---

## Auction Contract Creation

An auction bid includes:

* total contract value;
* contract length of one, two, or three years.

When an auction is won:

1. The approved total contract value becomes the contract’s original total value.
2. Average annual value is calculated by dividing total contract value by contract length.
3. Average annual value is rounded to the nearest hundredth.
4. The winning team receives the player and the resulting contract.
5. The transaction and contract creation are recorded in activity history.

The total contract value for a two-year or three-year auction bid must be a whole number. A one-year bid may use up to two decimal places.

---

## Contract Transfer

A trade transfers a player’s contract as it exists at the time of the trade.

The transfer does not:

* restart the contract;
* add contract years;
* create an extension;
* recalculate the original total contract value;
* recalculate average annual value except to preserve approved numeric precision.

The receiving team receives the same:

* average annual value;
* remaining contract years;
* contract expiration;
* other approved contract status.

Any retained salary changes the cap portions paid by the teams. It does not rewrite the player’s underlying average annual value.

---

## Retained Salary

The retained-salary limits are:

```text
Maximum cumulative retained amount on one player: 50% of that player’s AAV
Maximum retained-salary slots per team: 3
```

Retained salary:

* remains a cap obligation for its currently responsible team;
* is defined as an average-annual-value amount;
* lasts for every remaining year of the transferred contract;
* is linked to the relevant league, player, contract, and transaction;
* must survive normal application restarts;
* must not be stored only as a display adjustment;
* must be included in authoritative cap calculations;
* must be visible in team and commissioner views;
* must be included in activity history.

For each remaining contract year:

```text
retaining team cap obligation = retained AAV
receiving team player AAV = original player AAV - retained AAV
```

The receiving team’s player AAV affects its cap only while the player occupies an active roster slot. The team responsible for a retained-salary obligation carries that cap charge and uses the retention slot for the duration of the remaining contract.

More than one former team may hold retained salary on the same player after successive trades.

A team re-trading the player may retain an additional portion when:

* that team has an available retention slot;
* total retained AAV across every retaining team does not exceed 50% of the player’s original AAV;
* the new retention is recorded separately and lasts for the remaining contract term.

If the player is bought out, every existing retained-salary obligation remains unchanged for the original remaining contract term.

An existing retained-salary obligation may be traded as a whole. Its amount, remaining schedule, underlying-contract reference, and history do not change. The receiving team becomes responsible for the cap charge and retention slot.

The buying-out team’s annual buyout penalty is calculated from the player’s full underlying AAV. Existing retention does not reduce that penalty.

The Trade and Contract specifications must define how chained retention records are identified and displayed, and how a corrected or reversed trade restores them.

---

## Buyouts

The standard buyout formula is:

```text
annual buyout penalty = 25% of player AAV, rounded to the nearest hundredth
```

The annual buyout penalty applies in each remaining contract year.

An existing buyout-penalty obligation may be traded as a whole. Its annual amount, remaining schedule, underlying buyout reference, and history do not change. The receiving team becomes responsible for the cap charge.

The free-agent signing restriction is:

```text
A player signed through an auction cannot be bought out for 14 days.
```

The buyout lock follows the player if the player is traded during the lock period.

A completed buyout must:

1. verify league, team, player, contract, and actor;
2. verify that no buyout lock applies;
3. calculate the approved penalty;
4. eliminate the active contract;
5. release the player to free agency;
6. preserve the eliminated contract in history;
7. create one annual cap obligation equal to 25% of AAV for each remaining contract year;
8. cancel affected pending transactions when required;
9. save all effects atomically;
10. create an activity record;
11. return the authoritative new state.

The penalty does not decay during those remaining years.

---

# Part 6 — Shared Transaction Rules

## General Requirements

Every state-changing transaction must:

* identify the league;
* verify the actor;
* verify authorization;
* validate stable record IDs;
* validate current ownership;
* validate current record status;
* calculate all resulting cap and roster effects;
* prevent duplicate processing;
* save related changes atomically;
* create an activity record;
* return a clear success or failure result.

An unsuccessful transaction must not be presented as successful.

A validation failure must not partially change league state.

---

## Auctions

The Season 2 auction system remains a blind free-agent auction system.

Active competing bid values and contract terms are hidden from managers, other league members, and commissioners. A user may view only that user’s own active bid value and term. Resolved bid details are visible to authenticated league members in League Activity.

Cross-feature rules include:

* auctions belong to one league;
* bids belong to one authorized team in that league;
* players are identified by stable player ID;
* an already-owned player cannot be assigned as an auction winner;
* resolution must be deterministic;
* resolution must be idempotent;
* a winning assignment must create or attach the approved contract;
* the resulting roster and cap state must use the shared legality rules;
* the result must create activity history.
* roster or cap illegality does not invalidate an otherwise valid bid or winning assignment.

The approved Auction specification defines:

* minimum starting bid;
* minimum joining bid;
* bid edit limits;
* edit cooldown;
* bid visibility;
* anti-bluff pricing;
* tie-breaking;
* cutoff behaviour;
* exact resolution behaviour;
* failed-winner handling;
* temporary-illegality treatment;
* commissioner recovery.

The approved auction schedule is:

```text
New-auction opening: Monday at 12:00 AM Pacific
New-auction cutoff: Thursday at 11:59 PM Pacific
Auction rollover: Sunday at 4:00 PM Pacific
```

Auctions close at playoff start and remain closed through the playoffs and off-season. They reopen only after the next season starts and the pre-season Free Agent Draft is complete.

---

## Trades

Trades are open from the start of the entry draft until the league’s commissioner-configured trade deadline.

The commissioner sets the trade deadline during league creation.

Trading reopens at the start of the next entry draft.

The trade deadline must be stored as a league setting with the league timezone. It must not be hard-coded globally.

A trade proposal expires:

```text
7 days after creation
```

A proposal’s effective deadline is the earlier of exactly `168 hours` after creation or the league trade deadline. At that instant it becomes expired and cannot be accepted. Expired proposals leave the normal proposal interface, remain visible to authenticated league members in League Activity, and do not revive.

Cross-feature trade rules include:

* both teams belong to the same league;
* roster players, prospects or player rights, draft picks, existing retained-salary obligations, existing buyout-penalty obligations, and Future Considerations are approved tradeable asset types;
* the proposing user may act for the proposing team;
* the accepting user may act for the receiving team;
* all assets must still be owned by the expected team at acceptance;
* an active, benched, or injured-reserve player transfers with the existing contract unchanged except for approved retained salary;
* a prospect acquired from another team’s prospect roster remains a prospect for the receiving team;
* draft-pick identity and original-team history are preserved when ownership changes;
* an unspent draft pick may be traded multiple times, including while its Entry Draft is in progress;
* proposals do not reserve assets, and the same asset may appear in multiple pending proposals;
* resulting contracts, retained salary, cap usage, and roster state must be validated;
* acceptance must be atomic and protected against duplicate processing;
* completing one trade automatically cancels other proposals made stale by the transferred assets;
* completion, rejection, cancellation, expiration, and automatic cancellation must be recorded.

These asset types still require stable identifiers and an approved data model before implementation. That technical prerequisite does not change their approved status as tradeable league assets.

Buying out a player automatically cancels every pending trade involving that player.

The automatic cancellation and its reason must be recorded in league history.

---

## Transaction Timing

All league deadlines must:

* use an explicitly stored timezone;
* be calculated by the backend;
* handle daylight-saving changes correctly;
* be visible to users with an unambiguous date and time;
* be testable with a controlled clock;
* be protected against duplicate scheduled processing;
* support a documented commissioner recovery path.

The timezone for the original Hundo Leago league is:

```text
America/Vancouver
```

User-facing text may say:

```text
Pacific time
```

Code must not assume the server’s local timezone or the browser’s local timezone is Pacific time.

---

# Part 7 — Matchup Eligibility Boundary

## Matchup and Playoff Calendar

Regular-season matchups begin with the first full Monday-through-Sunday fantasy week contained in the NHL regular season.

The application automatically creates the regular-season schedule so each team plays every other team equally often or as evenly as the available teams and weeks permit. The commissioner may adjust the generated schedule.

Hundo Leago playoffs occupy the final four fantasy scoring weeks of the NHL regular season:

```text
Round 1: 1 week
Round 2: 1 week
Final:   2 weeks
```

Real NHL playoff games do not affect Hundo Leago under the current format.

---

## Weekly Roster Lock

The weekly roster-lock time is:

```text
Monday at 4:00 PM Pacific
```

The Matchup specification must determine:

* how active-roster players are persisted as the scoring-eligible roster;
* the exact week boundaries;
* how locked rosters are persisted;
* how commissioner corrections are made.

Only active-roster players are eligible to collect matchup points.

Benched, injured-reserve, and prospect players do not collect matchup points.

If the roster is illegal at the normal Monday `4:00 PM Pacific` roster lock, the team does not begin collecting points. When the roster becomes legal, the backend records the team-specific snapshot and baseline required by the Temporary Illegality rules in this document.

A locked roster must be a persisted snapshot.

It must not silently change when the team later changes its normal roster.

After a legal scoring roster is locked, later normal-roster adjustments—including adjustments that make the normal roster illegal—do not affect the current matchup or the locked players’ fantasy-point earnings.

---

## Separation From Scoring Rules

This document does not define fantasy-point or standings calculations.

Those rules belong in:

```text
docs/02-rules/SCORING_RULES.md
```

Roster legality and matchup eligibility must use the same approved roster definitions, but scoring code must not invent roster rules.

---

# Part 8 — Commissioner Corrections

## Commissioner Authority

Commissioner authority is limited to the commissioner’s league and the permissions approved in:

```text
docs/02-rules/PERMISSIONS.md
```

Commissioner tools must not provide unrestricted hidden access to all platform data.

---

## Correction Requirements

A commissioner correction must:

* be an explicit action;
* identify the league;
* identify the commissioner;
* identify the affected records;
* explain the reason when appropriate;
* preserve useful before-and-after information;
* validate the resulting state;
* create an activity record unless the correction affects only matchup or standings records;
* avoid silent side effects.

A commissioner correction must not be triggered by merely opening a page or reading data.

Matchup and standings corrections must be preserved in the applicable result or correction records, but they must not appear in league activity history.

---

## No Hidden Repair

The system must not use a read-only request to:

* repair a roster;
* add a missing contract;
* remove an invalid player;
* recalculate and save cap obligations;
* migrate data;
* reseed league state;
* resolve an auction;
* cancel a trade;
* finalize a matchup;
* change standings.

Repairs must use an explicit approved write operation.

---

# Part 9 — Activity History

## Required Activity

Every league transaction must create a durable history record.

This includes:

* roster ownership changes;
* roster-category changes;
* contract creation or change;
* auction bids when the approved privacy rules permit;
* auction resolution;
* trade proposal and status changes;
* retained-salary creation or change;
* buyouts;
* commissioner corrections that do not affect only matchups or standings;
* material rule or setting changes.

Matchup and standings information must not be written to league activity history.

This exclusion includes:

* matchup schedule creation or change;
* roster locks and late locks;
* scoring baselines;
* live scoring changes;
* result finalization;
* matchup rollover;
* matchup corrections;
* standings calculation, rebuilds, or corrections.

The matchup and standings systems may preserve their own required result, correction, and operational records outside league activity history.

---

## Activity Record Requirements

An activity record should identify:

* stable activity ID;
* league ID;
* actor user ID;
* affected team IDs;
* affected player or asset IDs;
* action type;
* timestamp;
* relevant transaction ID;
* human-readable summary;
* useful before-and-after information when appropriate.

Activity history must not expose:

* passwords;
* session tokens;
* private secrets;
* hidden auction information before the approved reveal time;
* unrelated private user information.

---

# Part 10 — Implementation Requirements

## One Shared Rule Contract

League rules must have one authoritative backend representation.

The frontend must consume authoritative values and results rather than maintaining unrelated constants.

When temporary compatibility code is necessary, the work plan must identify:

* the temporary duplicate;
* why it is required;
* how it is verified;
* when it will be removed.

---

## Atomic Writes

A transaction affecting more than one record must either complete all approved changes or complete none of them.

Examples include:

* auction resolution and contract assignment;
* trade acceptance and asset transfer;
* retained-salary creation;
* buyout and player release;
* commissioner corrections involving multiple records.

Partial success must be treated as failure and recovered through the approved rollback path.

---

## Idempotent Processing

Scheduled and retryable operations must be idempotent.

Running the same approved operation more than once must not:

* assign the same player twice;
* create duplicate contracts;
* charge the same cap obligation twice;
* complete the same trade twice;
* advance more than one matchup week;
* duplicate standings results;
* duplicate activity records.

---

## Validation Order

Before a write, the backend should validate in this general order:

1. request shape;
2. authentication;
3. league context;
4. authorization;
5. stable IDs and record existence;
6. current ownership and status;
7. feature-specific business rules;
8. resulting roster, contract, and cap state;
9. duplicate-processing protection;
10. atomic persistence.

The exact implementation belongs in the applicable technical specification.

---

## Error Behaviour

Rule failures must return clear, structured errors.

An error should distinguish:

* unauthenticated;
* unauthorized;
* league not found;
* team not found;
* player not found;
* ownership conflict;
* invalid roster category;
* cap violation;
* roster-size violation;
* positional violation;
* injured-reserve eligibility failure;
* transaction expired;
* duplicate or already-processed transaction;
* server or persistence failure.

The frontend must not convert a failed write into apparent success.

---

# Part 11 — Verification Expectations

## Rule Verification

Each implemented rule requires focused verification.

Tests must cover:

* a valid action;
* every important validation failure;
* the exact boundary value;
* one value below the boundary when applicable;
* one value above the boundary when applicable;
* unauthorized access;
* wrong-league access;
* duplicate processing;
* persistence after restart when applicable;
* activity-history creation when Part 9 requires it;
* confirmation that matchup and standings operations do not create league activity records;
* confirmation that failed actions did not change state.

---

## Multi-League Verification

Every league-scoped rule must be tested with at least two leagues.

Verification must confirm:

* league A uses league A’s settings;
* league B uses league B’s settings;
* actions in league A do not change league B;
* users cannot act for teams outside their memberships;
* identically named teams do not cause cross-league collisions.

---

## Time-Based Verification

Time-based rules must be tested with controlled dates and times.

Tests must not require waiting for a real Thursday, Sunday, Monday, or calendar week.

At minimum, test:

* before the deadline;
* exactly at the deadline;
* after the deadline;
* a daylight-saving transition where relevant;
* a repeated scheduled-job run.

---

# Part 12 — Approval Checklist

Grae approved the following Season 2 baseline decisions on 2026-07-18.

## Core Values

- [x] Salary cap is `$100`.
- [x] Active roster has `18` slots: `12` forward and `6` defence.
- [x] Empty active-roster slots are permitted.
- [x] Forward and defence slots are not interchangeable.
- [x] Hundo Leago has no goalies.
- [x] Bench or inactive roster has `4` slots for forwards or defence players.
- [x] A benched player may have no more than `$4.00 AAV`.
- [x] Prospect-roster slots are unlimited.
- [x] Injured-reserve limit is `4`.
- [x] Only active-player AAV, retained salary, and buyout penalties affect the cap.

## Roster Model

- [x] Active, bench or inactive, injured reserve, and prospect are required roster categories.
- [x] Only drafted players, or prospects acquired as prospects through trade, may enter a prospect roster.
- [x] Unsigned prospects have no salary; signed prospects kept in Prospects have a cap-exempt ELC, and no prospect collects matchup points.
- [x] A real-life entry-level-contract signing triggers the manager’s fantasy entry-level-contract signing option.
- [x] Fantasy ELC is `$3` over `3 years`, for `$1 AAV`.
- [x] Automatic prospect-signing enforcement is deferred to a future update.
- [x] C, LW, and RW normalize to F; LD and RD normalize to D.
- [x] Hundo Leago has no forward-and-defence dual-position players.
- [x] Transactions that create an illegal roster may complete with a warning.
- [x] An illegal team collects no matchup points while illegal.
- [x] A team that restores legality begins collecting points from a newly persisted team-specific baseline.
- [x] After a legal scoring roster is locked, later roster adjustments do not affect the current matchup.
- [x] A normal roster may become illegal after its matchup lock without interrupting the locked players’ scoring.

## Contracts

- [x] Contracts range from `1` to `3` years.
- [x] Contracts may not be extended.
- [x] There is no team-wide total contract-year limit.
- [x] One-year values may use up to two decimal places.
- [x] Two-year and three-year total contract values and bids must be whole numbers.
- [x] AAV is total contract value divided by contract years and rounded to the nearest hundredth.
- [x] Auction wins create a contract by dividing total winning contract value across the bid years.
- [x] Trades transfer AAV and remaining years without restarting or extending the contract.
- [x] Remaining years include the current season.
- [x] A contract with one year remaining expires after the current season.
- [x] Contract years advance and eligible contracts expire at the end of the league season.
- [x] A contract won in a midseason auction still uses that season as its current contract year.
- [x] Expired players are removed from the roster and immediately become free agents.
- [x] Former teams receive no exclusive re-signing opportunity.

## Retained Salary

- [x] Maximum cumulative retained salary is `50%` of the player’s original AAV.
- [x] Maximum retained-salary slots is `3` per team.
- [x] Retention is an AAV amount charged in every remaining year of the contract.
- [x] The receiving team’s player amount is original AAV minus retained AAV.
- [x] Multiple former teams may retain salary after successive trades.
- [x] A re-trading team may retain additional salary within the cumulative 50% limit and its slot limit.
- [x] Retention ends when the underlying contract’s remaining term ends.
- [x] Existing retained-salary obligations are not affected by a later buyout.
- [x] An existing retained-salary obligation may be traded as a whole without changing its amount or remaining schedule.
- [x] The receiving team assumes the traded retention cap charge and retention slot.
- [x] The buying-out team’s penalty uses the player’s full underlying AAV.

## Buyouts

- [x] Buyout eliminates the contract and releases the player to free agency.
- [x] Annual buyout penalty is `25% of AAV`, rounded to the nearest hundredth.
- [x] The annual penalty applies in each remaining contract year.
- [x] There is no penalty decay during the remaining contract term.
- [x] Auction signings have a `14-day` buyout lock.
- [x] The buyout lock follows the player after a trade.
- [x] An existing buyout-penalty obligation may be traded as a whole without changing its amount or remaining schedule.

## Transactions and Timing

- [x] The commissioner sets the league trade deadline during league creation.
- [x] Trading reopens at the start of the entry draft.
- [x] Trade proposals expire after `7 days`.
- [x] Proposals may not be accepted after the league trade deadline.
- [x] Buying out a player automatically cancels pending trades involving that player.
- [x] Active, Bench, and Injured Reserve players, prospects or player rights, draft picks, retention obligations, buyout-penalty obligations, and Future Considerations are tradeable assets.
- [x] The same asset may appear in multiple pending proposals because proposals do not reserve assets.
- [x] Unspent draft picks may be traded repeatedly, including during the Entry Draft.
- [x] Every completed transaction is recorded in league history.
- [x] Matchup and standings information is excluded from league activity history.
- [x] Weekly new-auction opening is Monday at `12:00 AM Pacific`.
- [x] New-auction cutoff is Thursday at `11:59 PM Pacific`.
- [x] Auction rollover is Sunday at `4:00 PM Pacific`.
- [x] Auctions close at playoff start and reopen only after the next season starts and its Free Agent Draft completes.
- [x] Weekly roster lock is Monday at `4:00 PM Pacific`.
- [x] Regular-season matchups begin with the first full Monday-through-Sunday week of the NHL regular season.
- [x] The application automatically balances round-robin pairings as evenly as possible.
- [x] Hundo Leago playoffs use three rounds lasting one week, one week, and two weeks.
- [x] The two-week Final occupies the final two fantasy scoring weeks of the NHL regular season.
- [x] Real NHL playoff games do not affect Hundo Leago under the current format.
- [x] `America/Vancouver` is the stored timezone for the original league.

## Approval

- [x] Deferred ELC enforcement is explicitly assigned to a future update.
- [x] Remaining implementation details are assigned to the applicable product and technical specifications.
- [x] Grae approves this document as the Season 2 league-rule baseline.
- [x] Document status is `APPROVED`.

---

## Definition of Done

The rule-approval phase for this document is complete because:

* Grae has approved or revised every material league-wide rule in scope;
* no unresolved implementation detail is presented as approved behaviour;
* League Rules, Scoring Rules, and Permissions have clear boundaries;
* the original Hundo Leago league’s default settings are unambiguous;
* future code can determine which league-wide rules to enforce without relying on old chat history or duplicated root documents.

The planned product and technical specifications must reference these rules and define the remaining feature workflows, data structures, APIs, and implementation details.

---

## Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/10-decisions/DECISION_LOG.md
```
