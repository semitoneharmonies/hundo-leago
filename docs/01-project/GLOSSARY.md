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

Last reviewed: **2026-08-08**

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
* permitted contract lengths;
* salary and bid precision;
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

Drafted-prospect rights are tradeable assets.

When prospect rights are traded, the receiving team holds the player in its prospect roster rather than converting the player into a normal roster player.

## Prospect

A player drafted into a Hundo Leago prospect roster, or acquired by trading for prospect rights from a team that already held the player as a prospect.

A prospect is not simply any young player.

Prospect-roster slots are unlimited.

A prospect:

* has no fantasy salary before signing;
* does not count against the cap;
* does not collect matchup points;
* may be traded as a player-rights asset.

The approved fantasy ELC is `$3` over three years for `$1 AAV`.

A real-life entry-level-contract signing is the intended trigger for the manager’s fantasy signing option. Automatic detection and enforcement of that trigger are deferred to a future update.

A signed prospect may remain in the Prospect category with the ELC salary excluded from the cap. Once moved to Active or Bench, the player may not return to Prospects.

Declining the fantasy ELC or voluntarily releasing unsigned rights makes the rights unowned. The player may re-enter the Entry Draft only when drafted in the immediately preceding year.

---

# Roster Terms

## Roster

All players and player rights currently connected to a team under the approved league rules.

The Season 2 roster may include:

* active players;
* inactive players;
* injured-reserve players;
* prospects;
* player rights.

## Active Roster

Players occupying one of the team’s 18 active roster slots.

The active roster contains:

* 12 forward slots;
* 6 defence slots;
* no goalie slots.

Empty active slots are permitted.

Only active-roster players are eligible to collect matchup points. Their average annual values count against the salary cap.

## Active Lineup

The legal, locked active-roster players eligible to accumulate fantasy points for a particular matchup period.

For Season 2, the active lineup is derived from the active roster. Benched, injured-reserve, and prospect players are not part of the active lineup.

## Inactive Roster

A four-slot roster category for owned forwards or defence players not occupying active roster positions.

A player may be benched only when the player’s average annual value is `$4.00` or less.

Benched players keep their contracts but their salaries do not count against the cap and they do not collect matchup points.

Inactive roster and bench refer to the same Season 2 roster category unless a future approved rule deliberately separates them.

## Injured Reserve

A four-slot roster category for players meeting the approved injured-reserve eligibility rules.

Injured reserve may be abbreviated as:

```text
IR
```

Injured-reserve player salary does not count against the cap.

Initial eligibility is selected manually for a player unavailable through injury or illness. Imported NHL eligibility, automatic rechecks, and automatic warnings are future updates.

Movement between Bench and Injured Reserve passes through Active.

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
* forward and defence slot limits;
* the prohibition on goalies;
* bench size and salary eligibility;
* salary cap;
* contract rules;
* injured-reserve rules;
* lineup requirements.

## Position Slot Limit

The maximum number of active roster slots available to one position group.

Hundo Leago permits up to 12 active forwards and up to 6 active defence players. Empty slots are permitted, but the position groups are not interchangeable.

## Position Group

The Hundo Leago category used for roster and scoring rules.

Hundo Leago position groups are:

* forward;
* defence.

Source positions normalize as follows:

```text
C, LW, RW → F
LD, RD → D
```

Hundo Leago has no forward-and-defence dual-position players.

Hundo Leago does not roster goalies.

---

# Contract and Salary Terms

## Contract

A league-specific agreement connecting a player to a team under defined salary and term conditions.

A contract may include:

* league ID;
* team ID;
* player ID;
* original total contract value;
* average annual value;
* original term;
* remaining years;
* start season;
* expiration season;
* status;
* acquisition source.

## Salary

The financial value assigned to a player contract.

Salary is not the player’s real NHL salary.

When cap treatment is discussed, player salary means the contract’s average annual value.

## Total Contract Value

The complete value of a contract across all contract years.

For a two-year or three-year contract, total contract value and auction bids must be whole numbers.

A one-year contract value may contain up to two decimal places.

Normal non-ELC contracts require at least `$1 AAV` per contract year, producing minimum total values of `$1`, `$2`, and `$3` for one-, two-, and three-year terms.

There is no separate monetary maximum contract value.

## Average Annual Value

The per-year contract value used by roster, cap, retention, trade, and buyout rules.

Average annual value may be abbreviated as:

```text
AAV
```

It is calculated as:

```text
total contract value ÷ contract years
```

The result is rounded to the nearest hundredth.

## Salary Cap

The maximum approved cap amount a team may carry under the league rules.

The original Hundo Leago league’s Season 2 salary cap is `$100`.

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

* active-player average annual values;
* retained salary;
* buyout penalties.

Benched, injured-reserve, unsigned-prospect, and signed-ELC Prospect players do not contribute player salary to cap usage.

## Contract Term

The number of league seasons covered by a contract.

Normal contracts have a term of one, two, or three years.

Contracts may not be extended.

## Remaining Contract Years

The number of league seasons left on a contract, including the current season.

A contract with one year remaining expires after the current season.

There is no team-wide limit on total contract years held.

## Expiring Contract

A contract reaching the end of its approved term.

The completed competition season does not immediately change its remaining
years. Expiration is processed during the automatic contract-year rollover at
the scheduled start of the next Entry Draft.

The player is immediately removed from the roster and becomes a free agent. The former team has no exclusive re-signing opportunity.

## Pending Rollover

The visible contract state between the end of the competition season and the
successful scheduled Entry Draft-start contract-year rollover.

During this state, remaining-year counts stay unchanged. Draft selection and
trading remain locked until rollover succeeds.

## Contract-Year Rollover

The automatic league-level transaction at the scheduled start of the next
Entry Draft that advances or expires contracts, retention, and buyout
obligations; reconciles ownership and rosters; cancels affected pending trades;
and records immutable rollover evidence.

The Entry Draft and trading open only after this idempotent transaction
succeeds. A failed occurrence leaves no partial advancement and may be retried
through the approved commissioner recovery action.

## Retained Salary

A per-year average-annual-value cap obligation created when a team trading away a player retains part of the contract.

The player may belong to a new team while the team currently responsible for the retention carries the retained AAV in every remaining contract year.

The receiving team holds the player contract at:

```text
original AAV − retained AAV
```

Multiple former teams may hold retention after successive trades. Cumulative retention may not exceed 50% of the player’s original AAV.

Existing retained salary is not affected by a later buyout and continues for the original remaining term.

The whole retention obligation may later be traded to another team without changing its amount or remaining schedule.

## Retention Slot

A league-limited record representing one retained-salary obligation.

Each team may use no more than three retention slots.

## Buyout

A transaction eliminating a player’s contract, releasing the player to free agency, and creating the approved annual cap penalties.

An auction or direct automatic FAD signing cannot be bought out for 14 days.
The lock follows the player after a trade.

## Buyout Penalty

The annual cap obligation created by a buyout.

The penalty is 25% of the contract’s average annual value, rounded to the nearest hundredth, in each remaining contract year.

The calculation uses the full underlying AAV even when another team holds retained salary.

The whole buyout-penalty obligation may be traded to another team without changing its annual amount or remaining schedule.

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
* total contract value;
* contract term;
* submission time;
* edit history;
* status.

## Auction Resolution

The process that validates bids, chooses the winning bid, assigns the player, creates or updates the contract, and records the outcome.

Auction resolution must be protected against duplicate processing.

## Trade

An approved exchange of league assets between teams.

Approved trade assets include:

* active, benched, or injured-reserve roster players and their contracts;
* prospects or player rights;
* draft picks;
* retained-salary obligations;
* buyout-penalty obligations;
* Future Considerations.

## Trade Proposal

A pending trade offered by one team to another.

A trade proposal expires seven days after creation and may not be accepted after the league trade deadline.

Proposals do not reserve assets. The same asset may appear in multiple pending proposals, and acceptance revalidates current ownership and eligibility.

## Trade Deadline

The league-specific date and time after which trades may not be completed.

The commissioner sets the trade deadline during league creation. Trading
reopens only after the automatic contract-year rollover at the scheduled Entry
Draft start succeeds.

## Salary Retention

A trade condition in which one team continues to carry an approved amount of the player’s average annual value in every remaining contract year after the player is transferred.

## Future Considerations

A stable league-scoped trade obligation recording that one team owes future consideration to another team.

It has no immediate cap, roster, contract, draft-pick, or matchup effect. Its fulfillment or commissioner resolution must be explicit and logged.

## Draft Pick

A league-specific asset representing a selection in a future or current entry draft.

A draft pick should identify:

* league;
* draft year or season;
* round;
* original team;
* current owner.

## Activity Record

A durable record explaining a league transaction or other important league action.

An activity record may include:

* actor;
* league;
* team;
* action;
* timestamp;
* affected records;
* relevant before-and-after information.

Matchup and standings information is excluded from league activity history.

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

For the original league’s Season 2 baseline, the scoring window begins Monday at `12:00 AM Pacific`, includes a normal baseline at `1:00 AM`, locks eligible rosters at `4:00 PM`, and ends at the following Monday `12:00 AM` exclusive. The user-facing end label is Sunday at `11:59 PM Pacific`.

It may include:

* week ID;
* start time;
* baseline time;
* lock time;
* end time;
* rollover time;
* team pairings.

An authorized commissioner or administrator explicitly chooses and persists
the first regular-season matchup week's start through the approved schedule
workflow. That chosen instant is the Hundo Leago season start and the FAD clock
anchor. It must satisfy the approved matchup-window constraints. The
application may recommend the first full Monday-through-Sunday scoring week
contained in the NHL regular season, but that recommendation is not a fixed or
automatically persisted date.

## Hundo Leago Playoffs

The fantasy league playoffs, which take place during the final four fantasy scoring weeks of the NHL regular season.

The current format has three rounds:

```text
Round 1: 1 week
Round 2: 1 week
Final:   2 weeks
```

The Final uses the final two fantasy scoring weeks of the NHL regular season.

Real NHL playoff games are outside the current Hundo Leago scoring season.

## Week ID

A stable identifier for a matchup week.

Example:

```text
W01
```

The exact format may change, but references should use the stored identifier rather than calculating identity from dates alone.

## Week Start

The time when the matchup scoring window begins. The original league’s approved week start is Monday at `12:00 AM Pacific`.

## Baseline

A stored snapshot of cumulative player statistics used as the starting point for calculating points earned during a matchup week.

## Baseline Time

The time at which a scoring baseline is captured. The original league’s approved normal baseline time is Monday at `1:00 AM Pacific`.

A legal team may use the normal matchup baseline.

If a team is illegal at the normal Monday `4:00 PM Pacific` roster lock, that team receives a team-specific locked roster and baseline only when its roster becomes legal. Points earned before the team-specific baseline do not count.

## Baseline Delta

The difference between a player’s current cumulative fantasy points and the stored baseline.

Conceptually:

```text
weekly fantasy points = current cumulative fantasy points − baseline fantasy points
```

## Roster Lock

The event that records which players are eligible to score for a team during a matchup week.

## Lock Time

The scheduled time when eligible teams should lock. The original league’s approved lock time is Monday at `4:00 PM Pacific`.

## Locked Roster

The persisted roster snapshot used to determine matchup eligibility.

A locked roster must not silently change when the team later changes its normal roster.

Later normal-roster adjustments, including adjustments that make the normal roster illegal, do not affect the current matchup or the locked players’ fantasy-point earnings.

## Legal Team

A team whose roster satisfies the approved requirements at the relevant validation time.

## Illegal Team

A team whose roster does not satisfy the approved requirements.

If a team is illegal when it must create its normal matchup lock, it does not collect matchup points until it becomes legal and receives a late lock and team-specific baseline.

Illegality that begins after a legal matchup roster is locked does not affect the current matchup.

Transactions may still complete when they create an illegal roster, but the system must warn the user and log the result.

## Late Lock

A team-specific scoring lock and baseline recorded when a previously illegal team becomes legal after the normal matchup baseline.

Only points earned after the team-specific baseline count for that matchup week.

## Committed Roster Mutation Batch

The internal post-commit receipt that groups one successful command's roster
changes by affected league, season, and team for late-lock evaluation.

Each group contains stable ownership identities and committed versions. A
deleted ownership uses its last committed pre-delete version. The batch is not
a browser request or new idempotency record, and replaying it never repeats the
original roster mutation.

A team-to-team ownership transfer closes the source ownership tenure and
creates a distinct destination ownership tenure at version `1`. The source
group therefore carries the deleted source ID and last version, while the
destination group carries the new present ID and version. Player and contract
IDs remain stable. A reversal creates another new tenure instead of resurrecting
either earlier ownership ID.

## Post-Commit Late-Lock Coordinator

The shared, never-rejecting backend service that evaluates whether one
Committed Roster Mutation Batch makes an illegal normal-lock team eligible for
a late lock.

It may perform at most one immediate live-data refresh and one evaluation retry
for the whole command. A failure after the roster commit reports the safe
`awaiting_data` status without rejecting, reversing, or repeating that commit.
For a multi-team command, public status priority is `awaiting_data`,
`still_illegal`, `completed`, then `not_applicable`; `lockId` appears only when
one safely identifiable completed lock applies.

## Awaiting Data

A fail-closed matchup state used when the authoritative provider evidence
required to create a late lock, calculate a safe score, or finalize a result is
missing, incomplete, stale, regressed, or internally inconsistent.

`awaiting_data` never means zero points were earned. The system may retry after
fresh evidence arrives, but it cannot make the incomplete result official.

## Required Player-Game Binding

A server-authored live-refresh requirement that preserves one exact player,
provider player, provider team, NHL game, and scheduled game start needed to
score a prior whole-game exclusion safely.

Bindings come from sealed baseline `expected_game` coverage while the affected
matchup week is `live`, `awaiting_data`, or `correction_required`. A finalized
week leaves the active requirement scope and re-enters if it later becomes
`correction_required`. The binding survives a trade, release, NHL team change,
or current free-agent status and lets the provider fetch that exact historical
date without polling the full season.

## Player-Game Coverage Manifest

Immutable provider-backed evidence that accounts for the exact player identity
set requested by one live-scoring refresh.

Each required player has either one or more expected NHL games, an affirmative
`no_due_game` disposition for an identified team, or an affirmative `no_team`
disposition. A missing provider row is not a coverage disposition. The exact
expected player/game identity set must match the refresh's player-game
observations before both sets seal atomically.

The response separately affirms a player's current team or current free-agent
status, while every expected game carries its own provider team. Historical
required games are an exact subset of expected coverage. A player may therefore
have old-team and current-team expected games together, or an old-team expected
game while currently a free agent. Terminal `no_due_game` and `no_team`
dispositions apply only when no required historical or current due game exists.

## Player-Game Stat Observation

An immutable provider-backed record of one player's statistics in one NHL game
as seen by one successful live-scoring refresh.

Player-game observations are sealed in a content-addressed refresh set together
with its independently digested Player-Game Coverage Manifest. Missing
observations are not assumed to mean zero; an explicit zero-valued row is
required for every expected pair that produced no scoring events.

## Whole-Game Exclusion

Immutable late-lock evidence that prevents one selected player from scoring for
one NHL game that was already underway when the team's late snapshot committed.

The exclusion removes both the pre-baseline and post-baseline portions of that
game without excluding the player from later games in the fantasy week.

## Fantasy Point

A scoring value calculated from player statistics according to the approved scoring rules.

The original league’s approved Season 2 formula is:

```text
FP = goals × 1.25 + assists × 1.00
```

Goals and assists are the only scoring categories, and forwards and defence players use the same values.

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

The approved formula is:

```text
FPG = cumulative FP ÷ games played
```

FPG is zero when games played is zero and is displayed to the nearest hundredth.

## Matchup Result

The finalized outcome of a matchup.

A result may include:

* team totals;
* winner;
* loser;
* tie;
* finalized time;
* source matchup week.

The team with higher final FP wins, the team with lower final FP loses, and equal final totals rounded to the nearest hundredth produce a regular-season tie.

## Finalization

The process that calculates and stores the official result of a completed matchup week.

Finalization should be idempotent.

## Idempotent

Safe to run more than once without creating duplicate effects.

For example, an idempotent rollover must not advance two weeks merely because the same job ran twice.

## Matchup Rollover

The process that closes a matchup week and advances league state to the next week.

The original league’s approved rollover time is Monday at `12:00 AM Pacific`.

Rollover may include:

* finalizing results;
* updating standings;
* advancing the current week;
* preparing the next week;
* recording completion.

Use **Contract-Year Rollover** for the separate annual Entry Draft-start
operation and **FAD Rapid Rollover** for a Free Agent Draft auction boundary.

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

The approved standings-points values are two for a win, one for a tie, and zero for a loss.

The approved order is standings points, fantasy-point differential, then fantasy points for, all descending. Teams still equal remain tied and use team name only for deterministic display order.

## Read-Only Standings

Standings that normal users may retrieve but may not directly edit.

Corrections must occur through approved result or commissioner-recovery processes.

---

# Draft Terms

## Entry Draft

The four-round linear league process used to allocate eligible newly drafted or prospect players.

The Entry Draft is not part of the initial Season 2 launch but must be implemented during the season before the first Entry Draft is used.

The playoff champion selects last, the losing finalist selects second-last, and the remaining initial order uses reverse official regular-season standings before approved lottery movement.

The commissioner schedules the draft in advance. At its persisted start, the
backend first runs the automatic contract-year rollover. The draft, trading,
and first pick clock open only after that rollover succeeds.

An on-clock pick may complete one trade and then gives its new owner a fresh
full clock. Trade acceptance, manual selection, and automatic timeout selection
use first-commit-wins concurrency with no grace period.

The future final `T-108` selection or confirmed-forfeiture transaction makes
the last unused pick terminal, marks the Entry Draft `Complete`, and records
the `entry_draft_completed` FAD-readiness handoff atomically. There is no
standalone or manual Entry Draft completion endpoint. The complete Entry Draft
remains M8-deferred; FAD-08 supplies only the reusable internal,
transaction-bound handoff primitive.

## Free Agent Draft

The annual pre-season process for constructing opening rosters through private
Candidate Cards, automatic allocation ranked by total contract value and then
AAV, restricted tie auctions, and an initial seven-day daily rapid-auction
period plus any required contiguous extension cycles.

It is distinct from the Entry Draft and in-season free-agent auctions.

For a continuing league, Entry Draft completion atomically records one durable
FAD-readiness handoff. Its later server-owned worker evaluates readiness. Every
Candidate Card opens at the same committed instant when all prerequisites pass;
otherwise no card opens and the commissioner receives blockers plus the
approved retry action.

The Free Agent Draft may be abbreviated as:

```text
FAD
```

## Candidate Card

One team's private FAD record containing:

* 12 mandatory forward positions;
* 6 mandatory defence positions;
* 4 optional Bench positions;
* locked carried players and contracts;
* selectable free-agent candidates;
* each candidate's proposed total contract value and term.

Before the Candidate Card deadline, only the assigned manager and a
help-authorized commissioner may view its competitive contents. After the
deadline, every active league member may view every league Candidate Card as a
read-only historical record.

A Candidate Card is not the visual player card used in the normal roster
hockey-lines view.

The complete card must fit the Candidate cap projection. At the deadline, a
card with unresolved carried-roster or cap illegality keeps every carryover but
excludes every new Candidate offer. The backend never chooses a subset of new
offers and there is no post-deadline repair.

## Candidate Rights-Release Block

The league-, player-, and event-scoped exclusion from Candidate eligibility
created by each `fantasy_elc_declined` or
`unsigned_prospect_rights_released` ownership event.

One block is cleared only by a later `draft_eligible_players` row for the same
league and player with `eligibility_reason = rights_release_reentry`, a
`rights_release_event_id` referencing that exact event, and an eligibility
snapshot confirmed strictly after the event occurred. Evidence for one release
does not clear a later release. Unowned status, roster absence, or both never
clear the block by themselves.

## Candidate Card Opening Readiness

The all-or-nothing backend operation created by a durable handoff from Entry
Draft completion or an approved no-draft transition. The handoff and worker
execution are separate transaction boundaries: the handoff creates the exact
operation and canonical pending job, while the worker later evaluates and
opens cards.

The future final `T-108` selection or confirmed-forfeiture transaction owns
`entry_draft_completed`. `T-036` owns `no_draft_inaugural`, and `T-037` owns
`no_draft_initial_season2`. When confirmed `T-095` schedule creation supplies
a missing inaugural prerequisite after readiness has blocked, it may only
requeue that same operation and canonical job. It never creates another
trigger. None of these boundaries exposes a manual Entry Draft completion or
FAD-opening endpoint.

It validates rollover, draft, target-season, first-matchup, participating-team,
manager, ownership, contract, and carryover prerequisites. When the selected
Week 1 is too early, the same operation advances it by whole league-local
Mondays, regenerates the shortened schedule and dependent jobs, and only then
opens every Candidate Card together.

## FAD Readiness Attempt

The immutable record of one completed automatic-readiness worker attempt.

It binds the readiness operation, canonical job run, attempt number, observed
operation version, blocked or succeeded outcome, timestamps, and the exact
canonically hashed public readiness projection observed for that attempt. A
real retry that reaches the worker creates a new attempt even when its blockers
are identical to an earlier attempt.

## FAD Readiness Retry Receipt

The immutable `202 Accepted` result of one authorized, idempotent request to
retry a blocked FAD readiness operation.

It records the accepted operation version, resulting one-version advance,
retry attempt number, same canonical job occurrence, actor authority, and
canonical response hash. The T-128 transaction leaves the job and operation
attempt counts unchanged. Exact idempotency replay returns the stored receipt
without changing current readiness or job state.

## FAD Readiness Corrective Requeue

The system-owned, evidence-backed requeue performed inside confirmed `T-095`
when newly persisted schedule creation supplies the missing prerequisite for
the same blocked genuine-inaugural readiness occurrence.

It records one immutable row linking the T-095 command result, new schedule
generation, latest blocked readiness attempt, canonical job/operation,
unchanged attempt and blocker evidence, retained terminal/retry timestamps,
and aligned one-version advances. It is not a commissioner retry, creates no
new readiness trigger, and exact T-095 replay performs no corrective write.

## Candidate Card Help Window

The period in which a manager may grant the commissioner view-and-edit access
to that exact Candidate Card.

It begins 48 elapsed hours before the Candidate Card deadline, or at automatic
card opening when less than 48 hours remain, and always ends at the deadline.

## Candidate Card Deadline

The backend-controlled instant exactly `168 elapsed hours` before the league's
frozen first-matchup start.

At the deadline every Candidate Card locks, league-wide read-only visibility
opens, and automatic FAD allocation becomes due.

## Restricted Tie Auction

A FAD auction created when two or more teams submit the same highest total
contract value and the same contract term for one player.

An equal highest total with different terms is resolved by highest AAV before
the auction stage. Only the teams tied on both highest total and term may bid.
Lower-ranked teams and other league teams may not participate.

Each tied Candidate offer is a system-created minimum rather than an active
leader. A team contends only after submitting one valid strict improvement. If
no eligible current active improvement remains at resolution, the restricted
auction closes without a winner and opens a fresh league-wide 24-hour FAD
auction with the original tied floor and no initial leader.

## FAD Rapid-Auction Period

The initial seven elapsed days after the Candidate Card deadline plus any
contiguous 24-hour extension cycles required by queued nominations, restricted
fallbacks, delayed activation, or recovery.

Open and restricted FAD auctions normally resolve at each persisted FAD Rapid
Rollover. A nomination committed during the final 60 minutes is accepted
privately into the FAD Nomination Queue rather than rejected. Authorized bids
and valid edits on existing auctions remain available until rollover.

Every submitted FAD bid is binding. Outstanding bids reserve no cap, position,
or roster capacity, and every otherwise-valid winning contract takes effect
even when simultaneous wins leave the team illegal.

## FAD Rapid Rollover

One persisted 24 elapsed-hour boundary in the FAD rapid-auction period.

It resolves due auctions, activates delayed restricted paths, opens valid
queued nominations for the following cycle, creates required fallback and
extension paths, and records terminal or explicit recovery state
idempotently.

## FAD Nomination Queue

The private record created when a manager nominates a player during the final
60 minutes before a FAD Rapid Rollover.

It contains the nominating team and binding starter bid. At rollover, a still
valid queued nomination opens as an auction and resolves at the following
24-hour rollover. The queue does not reserve the player, cap room, position
capacity, or a roster slot.

## FAD Exact-Tie Draw

The persisted auditable equal-chance draw used only when eligible bids in an
open or restricted FAD auction remain exactly tied after highest AAV and
shortest-term ranking.

The draw includes only the exact top-tied bids and is replay-stable. Ordinary
weekly auctions retain their deterministic timestamp and stable-ID tie rules.

## FAD Completion

The durable terminal state reached only after the initial seven-day period and
every active, queued, fallback, delayed, or recovery path is accounted for.

If completion is at or after the current Week 1, the same atomic transition
moves competition to the first otherwise-valid league-local Monday strictly
after completion, removes unavailable early regular-season weeks, regenerates
the remaining schedule and unexecuted jobs, and preserves the historical FAD
clock and results.

## Draft Order

The ordered sequence in which teams hold draft selections.

The same order is used in each of the four Entry Draft rounds.

## Draft Lottery

The two-draw weighted process used to determine the first two Entry Draft positions among active non-finalists.

The playoff champion remains last and the losing finalist remains second-last.

For `N` lottery teams, weights descend linearly from `N` for the worst-ranked team to `1` for the best-ranked team. Winners are drawn without replacement. Undrawn teams retain reverse-standings order, and the completed order applies to all four rounds.

## Entry Draft Eligibility

The rule determining which players may be selected in one Hundo Leago Entry Draft.

The normal pool contains F or D players selected in the most recently completed real NHL Entry Draft. Goalies are excluded.

An unowned player whose Hundo Leago prospect rights were released may re-enter
only when selected in the immediately preceding Hundo Leago Entry Draft and a
confirmed `rights_release_reentry` eligibility row for the same league and
player references that exact release event after it occurred. Each later
release requires its own later confirmed event-linked row; unowned status or
roster absence alone is not re-entry evidence.

Every eligible player requires a stable canonical player ID and cannot already be owned or under an active Hundo Leago contract in that league.

## Drafted-Player Rights

The rights held by a team after selecting a player, before or instead of immediately adding the player to a normal contract and roster.

## Entry-Level Contract

The approved fantasy contract available for an eligible prospect:

```text
Total contract value: $3
Contract length: 3 years
Average annual value: $1
```

Entry-level contract may be abbreviated as:

```text
ELC
```

Automatic detection and enforcement based on a player signing a real-life ELC are deferred to a future update.

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
