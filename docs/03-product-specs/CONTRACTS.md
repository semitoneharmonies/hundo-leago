# Hundo Leago — Contracts

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 contract terms, precision, transfer, expiration, retention, ELC, and buyout rules;
* approved cap and roster interactions;
* approved permission, activity, and public-visibility boundaries;
* current implementation limitations that must not be treated as the target contract model;
* approved user-visible contract decisions that implementation must follow.

Grae approved the Season 2 Contracts product specification recorded in this document on 2026-07-18.

Grae approved the FAD contract and buyout-lock amendments on 2026-07-27.

Grae approved the season-boundary and Entry Draft rollover amendments on 2026-07-29.

---

## Product Purpose

Hundo Leago needs one league-scoped contract model that remains correct across rosters, auctions, trades, retention, buyouts, and season rollover.

This specification defines how:

* a normal player contract is represented;
* an auction win creates a contract;
* a prospect signing creates the approved fantasy ELC;
* a trade transfers a contract without changing its term or AAV;
* retained salary divides cap responsibility without rewriting the underlying contract;
* a buyout eliminates a contract and creates annual penalties;
* remaining years advance and contracts expire;
* contract information is displayed, corrected, logged, and tested.

The goal is to prevent every feature from maintaining a different meaning of salary, AAV, remaining years, retention, or buyout penalty.

---

## Out of Scope

This document does not define:

* auction timing, bid visibility, minimum bid, tie-breaking, or resolution priority;
* trade proposal, acceptance, expiry, or reversal workflows;
* normal roster movement controls;
* entry-draft order and selection;
* scoring formulas;
* exact database tables;
* exact API paths or payloads;
* decimal library selection;
* automatic real-life ELC detection and enforcement.

Those subjects belong in the related product and technical specifications.

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
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/ROSTERS.md
```

When this specification conflicts with an approved shared rule, the approved shared rule remains authoritative until the conflict is deliberately resolved.

---

## Existing Behaviour Is Not the Target Model

The current application stores basic salary and contract-like fields in file-backed league state.

Current behaviour includes:

* frontend salary and cap calculations;
* incomplete remaining-year representation;
* Season 1 auction contract assumptions;
* buyout rounding and exemptions that do not prove compliance with Season 2;
* retained salary represented alongside buyout-like records;
* incomplete contract history;
* no complete league-scoped rollover operation.

For example, current frontend code rounds buyouts upward and exempts some low salaries. The approved Season 2 rule instead charges `25% of full underlying AAV`, rounded to the nearest hundredth, for every remaining year.

Current code is implementation evidence only and must not override this specification.

---

## Backend Authority

The backend is authoritative for:

* contract identity and ownership;
* original total contract value;
* original term;
* AAV;
* remaining years;
* creation source and timestamps;
* contract status;
* expiration;
* retained-salary records;
* buyout locks and penalties;
* cap obligations;
* contract activity history.

The frontend must not independently recalculate and save contract or cap values.

---

## League Isolation

Every contract and cap obligation belongs to exactly one league.

Every active player contract belongs to exactly one team and one stable player ID in that league.

A contract ID from one league must never authorize or modify a contract in another league.

---

# Part 2 — Contract Actors

## Team Manager

A manager may:

* submit approved auction bids that specify total value and term;
* make the approved manual prospect-signing decision;
* trade an existing contract with the player;
* retain salary through an approved trade;
* buy out an eligible contracted player owned by an assigned team.

A manager may not:

* directly edit contract value, AAV, term, remaining years, retention, or penalties;
* extend a contract;
* create an arbitrary contract outside an approved workflow;
* correct contract history.

---

## Commissioner

A commissioner may:

* perform authorized contract actions for teams in the assigned league;
* correct contracts, retained salary, and buyout penalties;
* resolve auctions manually;
* reverse trades through the approved trade workflow.

Prospect sign, decline, and unsigned-rights release decisions belong to the
current team manager. Commissioner or platform-administrator authority alone
does not grant that decision; a commissioner may use only a separately
authorized correction workflow.

A commissioner correction must be explicit and identified as a correction.

No written reason is required.

---

## Platform Administrator

A platform administrator needs active league membership and approved administrative authority to operate on league contracts.

Platform-level recovery must remain separate from normal contract actions and commissioner corrections.

---

## Viewers

Public roster viewers and authenticated league members may view the approved contract fields associated with roster records.

Viewing contract information grants no contract-management authority.

---

# Part 3 — Core Contract Model

## Contract Record

A normal contract must preserve:

* stable contract ID;
* league ID;
* current team ID;
* stable player ID;
* original total contract value;
* original term;
* AAV;
* remaining years, including the current season;
* creation source;
* creation timestamp;
* expiration season or equivalent authoritative season reference;
* status;
* related auction, ELC, trade, buyout, and history references where applicable.

The current team may change through trade.

The underlying original total value, original term, AAV, and expiration do not change through an ordinary trade.

---

## One Contract Per Normally Owned Player

Every normally owned active, bench, or injured-reserve player must have exactly one active league-specific contract.

An unsigned prospect has no normal contract.

A signed prospect remaining in the Prospect category has exactly one active fantasy ELC whose salary is cap-exempt while the player stays there.

A roster-category move must not create, duplicate, replace, or extend the contract.

---

## Contract Term

Normal contracts have a term of:

```text
1, 2, or 3 years
```

There is no team-wide total contract-year limit.

Contracts may not be extended.

Remaining years include the current season.

---

## AAV and Total Contract Value

Total contract value means the complete value across the original contract term.

For a new manager-created Candidate Card or auction offer:

* the manager enters AAV, not total value;
* AAV must use exact `$0.25` increments;
* AAV must be at least `$1.00`;
* the manager chooses a one-, two-, or three-year term;
* the backend calculates original total value as exact AAV multiplied by term;
* the client displays that calculated total before the offer is saved or bid.

Every normal non-ELC contract requires at least `$1 AAV` for each contract year.

The minimum original total values are therefore:

```text
1 year: $1 total
2 years: $2 total
3 years: $3 total
```

There is no separate monetary maximum. The maximum term is three years, and oversized values remain subject to cap legality and transaction warnings.

Historical contracts created under an earlier approved precision rule retain
their original total and AAV. This input amendment does not round or rewrite
existing contract evidence.

---

## Average Annual Value

AAV for a new manager-created Candidate Card or auction contract is the exact
entered amount. Original total is:

```text
AAV × original contract term
```

AAV is stored in integer cents and must be divisible by 25 for those new
offers. No division or rounding is required to create the contract.

Examples:

```text
1 year at $4.25 AAV = $4.25 total
2 years at $4.50 AAV = $9.00 total
3 years at $3.25 AAV = $9.75 total
```

AAV does not change merely because remaining years decrease.

---

# Part 4 — Contract Creation

## Approved Creation Sources

A normal contract may be created through:

* an auction win;
* an approved fantasy ELC signing;
* the annual pre-season Free Agent Draft;
* an explicit commissioner correction or migration needed to repair approved league state.

A roster read, ordinary roster move, trade, page load, or cap calculation may not invent a missing contract.

---

## Auction Contract

An auction bid supplies:

* AAV in an approved `$0.25` increment;
* one-, two-, or three-year term.

On resolution:

1. The backend-derived winning total becomes the original total contract value.
2. The bid term becomes the original term and initial remaining years.
3. The submitted or anti-bluff-adjusted AAV becomes the contract AAV.
4. The backend creates the contract and player ownership atomically.
5. The backend records the auction signing timestamp used by the buyout lock.
6. The backend creates the required activity record.

The Auctions specification defines bidding and winning rules.

---

## Free Agent Draft Contract

A sole or unique highest Candidate Card offer supplies:

* the proposed AAV in an approved `$0.25` increment;
* the original one-, two-, or three-year term;
* the initial remaining years.

The backend-derived AAV-times-term value becomes the original total contract
value.

On automatic allocation:

1. the backend validates the deadline Candidate Card offer;
2. the exact submitted AAV and term become the contract;
3. the backend-derived AAV-times-term total becomes the original total;
4. the backend creates contract, ownership, roster assignment, FAD result, and
   required activity atomically;
5. the contract belongs to the upcoming season;
6. the FAD signing timestamp begins the approved 14-day free-agent signing
   buyout lock.

Restricted and open rapid-auction contracts follow the Auction contract rules
and belong to the FAD target upcoming season. The Free Agent Draft
specification defines Candidate Card ranking, tied-team eligibility, and
preseason timing.

---

## Fantasy ELC

The fantasy ELC is fixed:

```text
Original total value: $3
Original term: 3 years
Initial remaining years: 3
AAV: $1
```

An ELC:

* is created only through the approved prospect-signing action;
* may remain attached to a player in the Prospect category without counting against the cap;
* is otherwise a normal contract unless an approved rule says differently;
* may not be extended.

Automatic detection and enforcement of the real-life ELC trigger remain deferred.

---

## Atomic Creation

Contract creation and every required ownership, roster, cap, lock, and activity effect must complete together or not at all.

Failure must not leave:

* ownership without a required contract;
* a contract without ownership;
* two active contracts for the same player in one league;
* a partial ELC conversion;
* a player assigned to two teams;
* a missing buyout-lock timestamp for an auction signing.

---

# Part 5 — Contract Transfer

## Trade Transfer

A trade transfers the player’s active contract as it exists.

The transfer preserves:

* contract ID;
* original total value;
* original term;
* AAV;
* remaining years;
* expiration;
* buyout-lock deadline;
* approved status and history.

The trade changes current ownership and team responsibility only.

---

## No Restart or Extension

A trade must not:

* restart the term;
* restore elapsed years;
* add years;
* change original total value;
* recalculate AAV from remaining value;
* create a replacement contract.

Retained salary creates separate cap obligations without rewriting the underlying contract.

---

# Part 6 — Retained Salary

## Retention Limits

The approved limits are:

```text
Maximum cumulative retention on one contract: 50% of original AAV
Maximum active retention slots per team: 3
```

More than one former team may hold retention after successive trades.

A retained AAV amount:

* must be greater than `$0`;
* may use up to two decimal places;
* may not cause cumulative retention to exceed the ceiling.

When 50% of original AAV contains a fraction of a cent, the ceiling is rounded down to the nearest cent.

Each separate active obligation uses one retention slot. One team may hold only one active retention obligation on the same underlying contract.

---

## Retention Record

Each retained-salary obligation must preserve:

* stable retention ID;
* league ID;
* underlying contract ID;
* player ID;
* currently responsible team ID;
* original retaining team ID;
* receiving transaction and team context;
* retained AAV;
* start timestamp or season;
* remaining obligation years;
* status;
* activity references.

Retention is not a negative salary written onto the player contract.

---

## Annual Cap Treatment

For each remaining contract year:

```text
responsible team obligation = retained AAV
current owner player amount = original AAV - cumulative retained AAV
```

The current owner’s player amount contributes to cap usage only while the player is active.

Every responsible team’s obligation contributes to cap usage regardless of the player’s current roster category.

---

## Successive Trades

A team re-trading the player may retain an additional amount when:

* it has an available retention slot;
* the new amount is positive;
* cumulative retained AAV remains at or below 50% of original AAV;
* every retention record remains linked to the same underlying contract;
* all transfer and obligation changes save atomically.

Existing responsible teams and amounts remain unchanged unless an obligation is explicitly included as a tradeable asset.

---

## Retention End

Retention lasts for every remaining year of the underlying contract and ends when that original remaining term ends.

The retention slot becomes available immediately when the obligation ends.

A completed retained amount cannot be edited, split, voluntarily cancelled, or
selected as a standalone asset in a new proposal. Its responsible team may
change only through safe reversal or an explicit commissioner correction of a
persisted record.

The obligation does not end because:

* the player is benched;
* the player moves to injured reserve;
* the player is traded again;
* a later team buys out the player.

Expiration and rollover must advance and end retention records idempotently.

---

## Existing Obligations In New Trades

An existing retained-salary obligation is not selectable as a standalone asset
in a new proposal. New retained salary may be requested only within the
outgoing contracted-player asset that creates it. Persisted historical
retention records remain readable for accounting, correction, and safe reversal
with their retained AAV, remaining schedule, underlying references, and history
unchanged.

An existing buyout-penalty obligation may also be traded as a whole. Its annual amount, remaining schedule, underlying buyout reference, and history remain unchanged while the receiving team assumes the cap charge.

---

# Part 7 — Buyouts

## Buyout Eligibility

Managers may buy out an eligible contracted player owned by an assigned team.

Commissioners may buy out an eligible contracted player for any team in their league.

Active, Bench, Injured Reserve, and signed-ELC Prospect players are eligible
unless a free-agent acquisition buyout lock applies.

An unsigned prospect has no contract to buy out.

A fantasy ELC has no free-agent acquisition buyout lock and may be bought out
immediately.

---

## Free-Agent Acquisition Buyout Lock

A player signed through an auction or direct automatic FAD allocation cannot
be bought out for `14 days`.

The lock:

* begins from the persisted player-assignment time;
* belongs to the contract and player acquisition;
* follows the player through a trade;
* does not restart after a trade.

---

## Buyout Formula

The annual penalty is:

```text
25% of full underlying AAV, rounded to the nearest hundredth
```

The penalty applies in every remaining contract year.

It does not decay.

Existing retained salary does not reduce the full AAV used for the buying-out team’s penalty.

There is no low-AAV exemption. A `$1 AAV` contract creates a `$0.25` annual penalty.

---

## Completed Buyout

A completed buyout:

1. verifies actor, league, team, player, contract, and lock;
2. shows an `Are you sure?` confirmation;
3. shows full underlying AAV, remaining years, annual penalty, total scheduled penalty, existing retention, roster removal, free agency, and pending-trade cancellation;
4. calculates the penalty from full underlying AAV;
5. eliminates the active contract;
6. removes the player from the roster;
7. releases the player immediately to free agency;
8. creates the annual penalty obligations for every remaining year;
9. preserves existing retained-salary obligations unchanged;
10. cancels pending trades involving that player;
11. saves every effect atomically;
12. creates league activity history;
13. returns authoritative contract, roster, cap, and transaction state.

The eliminated contract remains available in historical records.

The former team may later reacquire the player through the ordinary free-agent auction process.

A manager cannot undo a completed buyout. A commissioner reversal or correction must explicitly and atomically restore every affected record.

---

# Part 8 — Remaining Years and Expiration

## Meaning of Remaining Years

Remaining years include the current league season.

Examples:

```text
1 remaining = current season only
2 remaining = current season plus one additional season
3 remaining = current season plus two additional seasons
```

---

## Rollover Boundary

The competition season ends after the final NHL regular-season game. That
competition-season boundary does not advance contract years or expire
contracts.

From the competition-season boundary until the next successful rollover,
contract displays keep their current remaining-year count and show
`Pending Rollover`.

Contract-year advancement and expiration occur automatically at the scheduled
start of the next Entry Draft. Entry Draft setup, order, eligible-player pool,
pick ownership, and private manager queues may be prepared before that instant,
but drafting and trading remain locked until the rollover succeeds.

Every contract held during the completed competition season advances or
expires in that same Entry Draft-start rollover. This includes a contract
created by a midseason auction win; acquisition timing does not delay use of
the completed contract year.

The rollover operation must:

* be backend-controlled;
* use the league’s season identity;
* start automatically at the persisted Entry Draft start instant;
* be idempotent;
* prevent duplicate year advancement;
* preserve history;
* coordinate contracts, retention, buyout penalties, rosters, free agency, and trading state.

At the scheduled Entry Draft-start boundary, one league-level atomic rollover:

1. advances contract years, retention, and buyout penalties;
2. expires eligible contracts and obligations;
3. removes expired players from rosters;
4. converts those players to free agents;
5. cancels pending trades involving expired players;
6. records expiration history;
7. records the completed season identity and rollover timestamp.

If any part fails, no contract or obligation in that league advances, drafting
and trading remain locked, and the commissioner receives an actionable blocker
list with an idempotent retry control. A successful retry performs the same
atomic operation once and only then opens drafting and trading.

Managers receive neither a separate in-app notice nor an email notification for upcoming expiration in the initial release.

---

## Expiration Result

When a contract reaches expiration:

1. The contract status becomes expired.
2. The player is removed from the roster.
3. The player immediately becomes a free agent.
4. The former team receives no exclusive re-signing opportunity.
5. Related retained obligations end after their final covered year.
6. The expiration and roster removal are recorded in league history.

An expired contract may not be renewed or extended in place.

Any later contract must come through an approved free-agent process.

---

# Part 9 — Cap Obligations

## Team Cap Calculation

Team cap usage is:

```text
active player amounts after cumulative retention
+ team retained-salary obligations
+ team buyout penalties
```

Bench, injured-reserve, unsigned-prospect, and signed-ELC Prospect player amounts do not count.

All roster, team, auction, trade, and commissioner views must use the same backend-authoritative result.

---

## Obligation Independence

Retained salary and buyout penalties are durable cap-obligation records.

They must not disappear because:

* the player is no longer on the team;
* the player changes roster category;
* the player is traded again;
* the player is bought out;
* a display list is rebuilt;
* the application restarts.

Only an approved expiration, reversal, correction, or recovery operation may change them.

---

# Part 10 — Contract Status and History

## Status

Contract state must distinguish an active contract from an expired or bought-out contract.

A traded contract remains active and changes current team ownership.

Retention and buyout obligations have their own statuses and must not masquerade as active player contracts.

Player contract displays show active contracts only.

Expired and bought-out contracts remain in history but do not need a normal player-contract display. A bought-out contract’s ongoing cap hit appears in the Buyout area of the roster panel.

---

## Contract History

History must preserve:

* creation source and original terms;
* ownership transfers;
* retention created by each trade;
* remaining-year advancement;
* expiration;
* buyout;
* commissioner corrections;
* related transaction IDs;
* useful before-and-after values.

Ordinary reads may not rewrite history.

---

# Part 11 — Commissioner Corrections

## Correction Boundary

A commissioner may explicitly correct:

* contract ownership;
* original total value;
* original term;
* AAV when required to restore the approved calculation;
* remaining years;
* expiration reference;
* retained salary;
* buyout lock;
* buyout penalties.

Corrections must not become an ordinary manager editing feature.

---

## Correction Sequence

A correction must:

1. authenticate and authorize the commissioner;
2. identify the league and affected records;
3. show current values;
4. accept the corrected values;
5. validate the approved contract and cap rules;
6. calculate every downstream cap and legality effect;
7. warn when the corrected result is illegal;
8. save every effect atomically;
9. record the commissioner, affected records, timestamp, and before-and-after values;
10. return authoritative state.

No written reason is required.

---

# Part 12 — Public and Authenticated Display

## Roster Contract Fields

Public rosters already expose:

* original total value;
* original term;
* AAV;
* remaining years;
* current owner player amount;
* total retained amount;
* active buyout-lock end time.

Public team roster views show team-level retained-salary and buyout-penalty totals but not individual obligation details or a former-team retention breakdown.

Authenticated league members may view every contract, retention, and buyout-obligation detail in their league.

---

## Contract Formatting

Monetary values must display consistently to two decimal places where shown as AAV or cap amounts.

Term and remaining years display as whole league-season counts.

The interface must distinguish:

* original total contract value;
* AAV;
* current owner player amount after retention;
* retained obligations;
* buyout penalties.

It must not label all of these values simply as `salary` when that would make the cap result ambiguous.

---

# Part 13 — User Interface Requirements

## Contract Summary

For a contracted player, the approved interface must be capable of showing:

* player and team;
* roster category;
* original total value;
* AAV;
* original term;
* remaining years;
* creation source;
* expiration;
* current retained portions;
* buyout lock when active;
* estimated buyout consequence;
* status.

Normal player-contract displays show active contracts only.

Expired and bought-out contracts remain in history but do not appear as normal player contracts. Buyout cap hits appear in the roster panel’s Buyout area.

---

## Action Confirmation

High-consequence contract actions must clearly show their durable effects before confirmation.

The product must not show contract creation, transfer, correction, expiration, or buyout as complete before backend confirmation.

---

## Errors

Errors must:

* identify the correctable problem;
* avoid exposing another league’s records;
* distinguish invalid values, stale state, missing authority, and unavailable operations;
* preserve entered non-secret data where safe;
* avoid claiming partial success.

---

# Part 14 — Validation and Concurrency

## Contract Validation

The backend must validate:

* league, team, player, and contract IDs;
* actor permission;
* same-league ownership;
* creation source;
* total-value precision;
* term;
* AAV calculation;
* remaining years;
* duplicate active contracts;
* retention amount and slots;
* buyout lock;
* resulting cap and roster legality;
* current record version or equivalent stale-write protection.

---

## Decimal Safety

Contract, retention, and penalty calculations must use one technical decimal strategy.

The implementation must not allow binary floating-point drift to produce:

* inconsistent AAV;
* a retention amount above 50%;
* different cap totals on different pages;
* a buyout penalty that changes after reload;
* values with more than the approved precision.

---

## Concurrent Actions

The backend must safely handle:

* two auction resolutions for the same player;
* trade acceptance racing with buyout;
* buyout racing with contract expiration;
* two commissioner corrections;
* repeated rollover;
* re-trade with concurrent retention;
* stale manager screens.

At most one authoritative outcome may persist.

---

# Part 15 — Activity Requirements

## Required Activity

League activity history includes:

* contract creation;
* prospect ELC signing;
* contract transfer through trade;
* retained-salary creation or correction;
* buyout;
* expiration and roster removal;
* commissioner contract or obligation correction.

The applicable Auction and Trade specifications determine when bid and proposal details become visible.

---

## Activity Fields

Contract-related activity should identify:

* activity ID;
* league ID;
* actor user ID;
* affected team IDs;
* player ID;
* contract ID;
* action type;
* timestamp;
* related auction, trade, retention, buyout, or rollover ID;
* approved before-and-after values;
* human-readable summary.

Matchup and standings information is excluded.

---

# Part 16 — Required Testing

## Value and Term Tests

Tests must cover:

* one-, two-, and three-year terms;
* rejection outside one to three years;
* one-year values with zero, one, and two decimals;
* rejection of excess decimals;
* whole-number two- and three-year values;
* rejection of fractional multi-year totals;
* AAV rounding to the nearest hundredth;
* no extension;
* no team-wide contract-year limit.

---

## Creation and Transfer Tests

Tests must cover:

* auction contract creation;
* fixed ELC creation;
* duplicate contract prevention;
* atomic ownership and contract assignment;
* trade transfer without changed AAV or years;
* buyout-lock transfer;
* cross-league rejection;
* stale and repeated requests.

---

## Retention Tests

Tests must cover:

* one retention record;
* successive retaining teams;
* exactly 50% cumulative;
* rejection above 50%;
* three slots;
* rejection of a fourth slot;
* current-owner player amount;
* active versus non-active cap treatment;
* retention after re-trade;
* retention after buyout;
* retention end at contract expiration;
* trade reversal and commissioner correction.

---

## Buyout Tests

Tests must cover:

* 25% of full underlying AAV;
* nearest-hundredth rounding;
* every remaining year;
* no decay;
* exactly before and after the 14-day lock deadline;
* lock following a trade;
* roster removal and free agency;
* pending-trade cancellation;
* existing retention preservation;
* atomic failure;
* low-AAV contracts without an unapproved exemption.

---

## Rollover Tests

Tests must cover:

* one-, two-, and three-year remaining terms;
* competition-season end without year advancement or expiration;
* current remaining years plus `Pending Rollover` before rollover succeeds;
* automatic expiration at the persisted Entry Draft start;
* pre-start draft preparation while drafting and trading remain locked;
* rollover failure with no partial advancement, an actionable blocker list, and
  drafting and trading still locked;
* idempotent commissioner retry and opening drafting and trading only after
  success;
* immediate roster removal and free agency;
* no exclusive re-signing;
* retention and penalty advancement;
* repeated rollover without duplicate advancement;
* partial-failure prevention;
* controlled-clock timing;
* multiple leagues in different lifecycle states.

---

# Part 17 — Approval Checklist

Grae approved the original Season 2 Contracts product decisions on 2026-07-18
and the FAD-related amendments on 2026-07-27.

## Approved Contract Foundation

- [x] Normal contracts have terms of one, two, or three years.
- [x] Contracts may not be extended.
- [x] There is no team-wide total contract-year limit.
- [x] Remaining years include the current season.
- [x] Manager-created Candidate Card and auction AAV uses exact `$0.25` increments and is at least `$1`.
- [x] Total contract value is calculated as AAV multiplied by original term.
- [x] Historical contracts retain their original approved total and AAV without rewriting.
- [x] Every normally owned Active, Bench, or Injured Reserve player has one league-specific contract.
- [x] Unsigned prospects have no salary and no normal contract.
- [x] A signed prospect may retain the fantasy ELC while remaining cap-exempt in Prospects.
- [x] Roster-category moves do not change or duplicate contracts.
- [x] Contracts and obligations use stable IDs and remain league-scoped.

## Approved Creation, Transfer, and Expiration Rules

- [x] Auction wins create contracts from winning total value and bid years.
- [x] The fantasy ELC is `$3` over three years for `$1 AAV`.
- [x] Automatic real-life ELC detection and enforcement are deferred.
- [x] Trades transfer the existing AAV and remaining years without restart or extension.
- [x] The competition season ends after the final NHL regular-season game without advancing contract years.
- [x] Until rollover succeeds, contracts keep their current remaining-year count and display `Pending Rollover`.
- [x] Contract-year advancement and expiration occur automatically at the scheduled start of the next Entry Draft.
- [x] A contract created by a midseason auction still uses that season as its current contract year.
- [x] Expiration removes the player from the roster and immediately makes the player a free agent.
- [x] The former team receives no exclusive re-signing opportunity.
- [x] Contract creation, transfer, expiration, and related ownership effects save atomically.

## Approved Retention and Buyout Rules

- [x] Cumulative retention may not exceed 50% of original AAV.
- [x] Each team may use at most three retention slots.
- [x] Retention is an AAV obligation in every remaining contract year.
- [x] Multiple former teams may retain salary after successive trades.
- [x] A re-trading team may retain an additional amount within the cumulative and slot limits.
- [x] The current owner player amount is original AAV minus cumulative retained AAV.
- [x] Retention ends with the underlying contract term.
- [x] Existing retention remains unchanged after a later buyout.
- [x] Buyout-penalty obligations may be traded as whole obligation records; existing retention remains with its responsible team and is not selectable in a fresh proposal, while historical retention proposals/assets remain readable and executable or reversible when their recorded state permits and exact completed creation retries replay the original result.
- [x] A buyout eliminates the contract and immediately releases the player to free agency.
- [x] The annual buyout penalty is 25% of full underlying AAV, rounded to the nearest hundredth.
- [x] The penalty applies in every remaining year and does not decay.
- [x] Auction and direct automatic FAD signings have a 14-day buyout lock that follows the player through trade.
- [x] A buyout must atomically cancel pending trades involving the player, including a signed player still rostered as `Prospect` whose proposal snapshot uses `prospect_right`; the known staging limitation fails without partial writes and remains a separate P1 production-promotion follow-up outside the M7-26 isolated-staging gate.

## Approved Permission, Cap, and History Rules

- [x] Managers may make approved auction, trade, prospect-signing, retention, and buyout decisions for assigned teams.
- [x] Managers may not directly edit authoritative contract records.
- [x] Commissioners may correct contracts, retention, buyout locks, and penalties in their league.
- [x] No written reason is required for a commissioner correction.
- [x] Active player amounts, retained obligations, and buyout penalties are the only contract-related cap charges.
- [x] Bench and Injured Reserve player amounts do not count against the cap.
- [x] Public rosters show fantasy AAV and remaining contract years.
- [x] Completed contract transactions and corrections create league activity history.
- [x] Read-only requests never create, correct, expire, or otherwise mutate contracts.

## Contract Value and Decimal Decisions

- [x] Every normal non-ELC contract has a minimum of `$1 AAV` per contract year: `$1` total for one year, `$2` total for two years, and `$3` total for three years.
- [x] There is no contract-specific monetary maximum; three years is the maximum term, and cap legality and transaction warnings govern oversized values.
- [x] A zero or negative contract value is invalid.
- [x] Nearest-hundredth calculations use conventional half-up rounding.
- [x] AAV and cap amounts are stored and returned with no more than two decimal places.
- [x] Original total value is immutable after creation except through an explicit commissioner correction.
- [x] The original term is immutable after creation except through an explicit commissioner correction.
- [x] Remaining years is always a whole number from `1` through the original term while the contract is active.

## Contract Creation and Status Decisions

- [x] Contract creation sources are Auction, Fantasy ELC, the annual pre-season Free Agent Draft, Commissioner Correction, and Approved Migration.
- [x] Automatic FAD allocation creates the winning team's exact Candidate Card total and term and begins the 14-day free-agent signing buyout lock.
- [x] The backend distinguishes `Active`, `Expired`, and `Bought Out`; normal player-contract displays show only active contracts, while buyout cap hits appear in the roster panel’s Buyout area.
- [x] A traded contract remains `Active`; trade is recorded in ownership and history rather than as a contract status.
- [x] An administrator-created migration contract must satisfy the same value, term, and AAV rules as a normal contract.
- [x] Auction- and automatic-FAD-created contracts receive a persisted acquisition timestamp used for the buyout lock.
- [x] The free-agent acquisition buyout lock expires exactly `14 × 24 hours` after the persisted assignment timestamp.
- [x] The 14-day free-agent acquisition buyout lock does not apply to a fantasy ELC.
- [x] A fantasy ELC is otherwise tradeable, retainable, and buyout-eligible like a normal contract.

## Expiration and Rollover Decisions

- [x] The scheduled Entry Draft-start lifecycle boundary processes contract-year advancement and expiration.
- [x] Contract-year advancement, expiration, retention advancement, penalty advancement, roster removal, and free-agency conversion run as one league-level atomic rollover.
- [x] If any part of the league-level rollover fails, no contract or obligation in that league advances.
- [x] Entry Draft setup may be prepared before rollover, but drafting and trading remain locked until rollover succeeds.
- [x] Rollover failure gives the commissioner an actionable blocker list and an idempotent retry control.
- [x] Managers do not receive a separate in-app notice listing contracts with one year remaining before the scheduled Entry Draft-start rollover.
- [x] The initial release sends no separate email notification for upcoming contract expiration.
- [x] Expiration automatically cancels every pending trade involving the expired player.
- [x] An expired player may enter the normal free-agent auction process as soon as trading and auctions are available under their separate specifications.
- [x] Expiration history shows player, former team, expired AAV, final term, timestamp, and roster-removal result.

## Retained-Salary Decisions

- [x] A retained AAV amount must be greater than `$0` and may use up to two decimal places.
- [x] The exact 50% retention ceiling is rounded down to the nearest cent when half of original AAV contains a fraction of a cent.
- [x] Each separate active retention obligation uses one retention slot for its currently responsible team.
- [x] One team may hold only one active retention obligation on the same underlying contract.
- [x] A retained-salary amount cannot be edited, split, voluntarily cancelled, or selected as a standalone asset in a new proposal; its responsible team may change only through safe reversal or explicit commissioner correction.
- [x] New retained salary may be requested only within an outgoing contracted-player trade asset.
- [x] Persisted historical retention proposals/assets remain readable and executable or reversible when their recorded state permits, without changing the obligation amount/schedule; exact completed creation retries replay the original result before fresh asset-grammar validation.
- [x] When a retention obligation ends at contract expiration, its retention slot becomes available immediately.
- [x] The current owner’s player amount is rounded to the nearest hundredth after subtracting every retained AAV record.
- [x] Contract views show every current responsible team, original retaining team, and retained AAV to authenticated members of the league.
- [x] Public rosters show only the current owner’s player amount and total retained amount, not a breakdown by former team.

## Buyout Decisions

- [x] Active, Bench, Injured Reserve, and signed-ELC Prospect players are buyout-eligible unless the free-agent acquisition buyout lock applies.
- [x] A prospect without a contract cannot be bought out.
- [x] A fantasy ELC may be bought out immediately because it has no free-agent acquisition buyout lock.
- [x] Buyout calculation has no low-AAV exemption; a `$1 AAV` contract creates a `$0.25` annual penalty.
- [x] A buyout requires an `Are you sure?` confirmation.
- [x] The confirmation shows full underlying AAV, remaining years, annual penalty, total scheduled penalty, existing retention, roster removal, free agency, and pending-trade cancellation.
- [x] The buying-out team may later reacquire the player through the ordinary free-agent auction process.
- [x] Buyout-penalty records advance and expire during the same league rollover as contracts.
- [x] A buyout-penalty obligation may transfer as a whole through an approved trade without changing its amount or remaining schedule.
- [x] A completed buyout cannot be undone by a manager.
- [x] A commissioner may reverse or correct a buyout only through an explicit atomic correction that restores every affected record.

## Display, Correction, and Activity Decisions

- [x] Public rosters show original total value, original term, AAV, remaining years, current owner player amount, total retained amount, and active buyout-lock end time.
- [x] Public roster views show team-level retained-salary and buyout-penalty totals but not individual obligation details.
- [x] Authenticated league members may view every contract, retention, and buyout-obligation detail in their league.
- [x] Monetary values display with exactly two decimal places.
- [x] Commissioner corrections may repair original value, original term, AAV, remaining years, expiration, retention, locks, and penalties.
- [x] A commissioner correction must preserve the relationship between original value, original term, and AAV.
- [x] A commissioner may save a correction that leaves the roster or team over the cap after an explicit warning.
- [x] Contract activity records show actor, player, affected teams, original value, AAV, term, remaining years, action, timestamp, and related transaction IDs.
- [x] Failed, rejected, and cancelled contract actions do not create league transaction history.

## Approval

- [x] Remaining implementation details are assigned to the appropriate product and technical specifications.
- [x] Grae approves this document as the Season 2 Contracts product specification.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The rule-approval phase for this product specification is complete because:

* Grae approved or revised every material product decision;
* minimum value, term, precision, AAV, creation source, and status behaviour are explicit;
* signed-prospect ELC treatment is aligned with Rosters;
* transfer, retention, buyout, expiration, and rollover behaviour are explicit;
* public, authenticated, active-contract, historical, and Buyout-area display boundaries are explicit;
* commissioner correction and activity behaviour are explicit;
* no unchecked workflow is presented as final behaviour.

The planned Auctions, Trades, Entry Draft, Free Agent Draft, Data Model, API
Contracts, Security, Testing Strategy, and migration work must implement these
approved workflows.

Verification must prove contract reads cannot repair, expire, reseed, or overwrite live data.

---

# Related Documents

```text
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/FREE_AGENT_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/07-testing/TESTING_STRATEGY.md
```
