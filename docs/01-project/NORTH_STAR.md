# Hundo Leago — North Star

## Purpose

Hundo Leago is a contract-driven fantasy hockey platform built around realism, league integrity, long-term decision-making, and commissioner reliability.

It is designed to make managing a serious fantasy hockey league feel more like managing a professional hockey organization. Team owners must balance player performance, salaries, contract length, roster construction, future assets, and long-term consequences.

Hundo Leago should create strategic depth through clear and consistently enforced rules—not through confusion, hidden behaviour, or unnecessary complexity.

---

## Product Identity

Hundo Leago is more than a traditional fantasy scoring website.

Its defining systems include:

* salary-cap management;
* multi-year player contracts;
* roster construction and positional requirements;
* blind free-agent auctions;
* trades involving contracts, retained salary, and future assets;
* buyouts and other long-term consequences;
* weekly head-to-head competition;
* entry drafts and player rights;
* commissioner tools;
* permanent league history and transparent activity records.

The platform should reward preparation, valuation, negotiation, patience, and long-term planning.

---

## Season-Based Product Development

Hundo Leago develops in product seasons that align with the hockey calendar.

A **product season** describes the version of Hundo Leago intended to operate during a specific fantasy hockey season.

Major structural changes should normally be developed and tested during the off-season. Once an active fantasy season begins, reliability becomes the priority.

### Between seasons

The development team may introduce major changes such as:

* database migrations;
* architectural refactors;
* new league systems;
* major rule additions;
* account and permission changes;
* significant interface redesigns.

These changes must still be backed up, tested, documented, and verified before production use.

### During an active season

Development should favour:

* bug fixes;
* security fixes;
* performance improvements;
* commissioner recovery tools;
* small, clearly understood improvements;
* changes that do not unexpectedly alter established league behaviour.

Major league rules should not silently change after a season begins.

The current operating and data-preservation requirements are defined separately in:

`docs/01-project/OPERATING_MODE.md`

---

## Season 1 — League Management Foundation

### Historical role

The first operational version of Hundo Leago functioned primarily as a companion to an external fantasy provider.

Hundo Leago was responsible for league management systems such as:

* team rosters;
* salary-cap enforcement;
* contracts;
* blind free-agent auctions;
* trades;
* salary retention;
* buyouts;
* commissioner actions;
* league activity history.

External systems were still used for some or all scoring, matchup, standings, draft, and playoff functions.

### Importance

Season 1 proved that Hundo Leago’s central league-management concept could support a real fantasy league.

It also established the need for:

* durable data storage;
* stronger player identity;
* automated scoring;
* weekly matchup processing;
* clearer documentation;
* safer commissioner controls;
* a more maintainable backend.

Season 1 should be treated as the foundation of the platform, not as the final product.

---

## Season 2 — Standalone Multi-League Platform

### Target season

2026–27

### Definition

For Season 2, Hundo Leago becomes a standalone fantasy hockey platform capable of operating an entire fantasy season without depending on another fantasy provider for core league functions.

The system must support multiple separate leagues.

Each league must have its own:

* users and memberships;
* teams;
* settings;
* rosters;
* contracts;
* auctions;
* trades;
* matchup schedule;
* results;
* standings;
* draft information;
* activity history.

Information from one league must never appear in or affect another league.

### League creation

During Season 2, league creation remains an administrative function.

Only Grae or another authorized platform administrator may create a new league.

Public users will not yet be able to create and configure their own leagues without administrative involvement.

This restriction keeps the first multi-league version manageable while the platform’s reliability is proven.

---

## Season 2 Core Capabilities

### Accounts and permissions

Each manager has a secure account.

The platform must know:

* who the user is;
* which leagues the user belongs to;
* which team or teams the user controls;
* which actions the user is permitted to perform.

Users must not be able to act on behalf of another team unless explicitly authorized.

Commissioner and administrator actions must be clearly separated from normal manager actions.

### League and team administration

Authorized administrators and commissioners can:

* create and configure leagues;
* add and remove teams;
* assign users to teams;
* edit approved league settings;
* prepare a league for a new season;
* correct recoverable league problems through transparent tools.

Commissioner power should be sufficient to operate and recover the league, but commissioner actions should be recorded rather than hidden.

### Player database and statistics

Hundo Leago maintains a centralized NHL player identity system.

Players must use stable identifiers rather than names alone.

The platform imports and processes the statistics required for:

* fantasy scoring;
* player research;
* matchup totals;
* standings;
* historical information when available.

### Rosters, contracts, and salary cap

Each league manages its own player ownership and roster state.

The platform supports:

* an 18-slot active roster divided into 12 forward and 6 defence slots, with empty slots permitted;
* a four-slot bench or inactive roster for players with an average annual value of no more than $4;
* four injured-reserve slots;
* an unlimited prospect roster for drafted players and prospect rights acquired through trades;
* no goalie position;
* player salaries;
* one-to-three-year contracts with no extensions;
* no team-wide total contract-year limit;
* retained salary;
* buyout consequences;
* roster and cap legality.

The original league’s salary cap is $100.

Only active-player average annual value, retained salary, and buyout penalties affect the salary cap.

Prospects use an approved $3, three-year fantasy entry-level contract when signed. A signed player may remain in Prospects with the ELC salary excluded from the cap; once moved to Active or Bench, the player may not return to Prospects. Automatic enforcement of real-life ELC signing is deferred to a future update.

Normal non-ELC contracts require at least $1 AAV per contract year. There is no separate monetary maximum, and three years is the maximum term.

Remaining contract years include the current season. Competition completion
does not advance or expire them; they remain displayed as `Pending Rollover`.
At the persisted scheduled start of the next Entry Draft, one automatic
rollover advances or expires them, immediately removes an expired player from
the roster, and returns that player to free agency without exclusive
re-signing rights.

Transactions may create a temporarily illegal roster with a warning. A team that is illegal at the Monday `4:00 PM Pacific` roster lock does not collect matchup points until it becomes legal and receives a team-specific locked roster and scoring baseline. Once a legal matchup roster is locked, later normal-roster adjustments—including adjustments that make the normal roster illegal—do not affect that matchup or the locked players’ fantasy-point earnings.

Exact formulas, limits, eligibility rules, and timing requirements belong in the approved league and feature specifications.

### Free-agent systems

Hundo Leago supports structured methods of assigning unsigned players.

These may include:

* an annual pre-season Free Agent Draft using private Candidate Cards,
  automatic total-first/AAV-second allocation, restricted exact-tie auctions,
  and daily rapid auctions;
* blind in-season free-agent auctions;
* follow-up or tie-breaking auctions;
* commissioner recovery controls.

The approved Free Agent Draft and Auction specifications determine the exact
pre-season and in-season bidding, timing, tie-breaking, editing, and assignment
rules.

### Trades and future assets

Managers can propose and complete trades involving approved league assets.

Approved tradeable asset types include:

* players;
* contracts;
* retained salary;
* draft picks;
* player rights;
* prospects held through drafted-player rights.

Trades must be validated against ownership, roster, contract, and league-specific rules.

Player contracts transfer with their existing average annual value and remaining years.

Multiple former teams may retain salary after successive trades, subject to a cumulative maximum of 50% of the player’s original AAV and three retention slots per team. Existing retention is not affected by a later buyout.

The commissioner sets the trade deadline during league creation. At the
scheduled Entry Draft start, trading remains locked until the automatic
contract/ownership rollover succeeds; successful rollover opens trading and
the draft atomically.

### Scoring, matchups, and standings

Hundo Leago calculates fantasy points from imported player statistics according to the league’s approved scoring rules.

The platform supports:

* weekly head-to-head matchups;
* scheduled lineup or roster locks;
* scoring baselines and snapshots;
* weekly result finalization;
* wins, losses, and ties;
* league standings;
* commissioner recovery tools;
* playoffs when included in the Season 2 release scope.

Weekly processing must be testable without waiting for real calendar weeks to pass.

### Entry draft

The platform will support an annual Entry Draft system.

The Entry Draft is not required for the initial Season 2 launch. It may be developed during the season but must be complete before the first Season 2 Entry Draft is used.

The approved system includes:

* draft order;
* a lottery;
* four linear rounds;
* the current draft and following three draft classes;
* traded picks;
* drafted-player rights;
* five-minute pick clocks;
* automatic best-player-available timeout selections with no skipped picks;
* persistent private queues;
* immutable completed selections;
* entry-level contract decisions;
* commissioner and system-managed draft results.

The two weighted lottery draws include every active non-finalist, with linear weights favouring lower-ranked teams. The champion remains last, the losing finalist remains second-last, and the resulting order applies to all four rounds.

Normal eligibility is limited to F or D players selected in the most recently completed NHL Entry Draft, plus the approved immediately-prior Hundo Leago rights-release re-entry. Goalies and older undrafted Hundo prospects are excluded.

The precise draft process is defined in its approved product specification.

### History and transparency

Every league transaction must produce a durable and understandable history record.

This includes actions involving:

* contracts;
* roster changes;
* auctions;
* trades;
* buyouts;
* commissioner overrides;
* draft assets;
* league configuration.

Matchup and standings information, including corrections, does not appear in league activity history. The matchup and standings systems preserve their required result and correction records separately.

Hundo Leago should make it possible to understand what happened, when it happened, and why the league state changed.

---

## Season 2 Primary Goal

Successfully operate the complete 2026–27 fantasy hockey season inside Hundo Leago without:

* data loss;
* cross-league data contamination;
* unexpected resets;
* recurring manual repair;
* managers acting as other teams;
* unexplained scoring or matchup results;
* dependence on another fantasy platform for core league operation.

The season is successful when managers can use Hundo Leago as the normal home of the league and the commissioner does not need to regularly repair the system manually.

---

## Future Product Direction

After the standalone multi-league platform has completed a stable real-world season, Hundo Leago may expand into a commercial product.

Possible future development includes:

* commissioner self-service league creation;
* public onboarding;
* league templates;
* configurable rule packages;
* subscription or commissioner-license models;
* advanced player analysis;
* historical graphs and reports;
* community and communication tools;
* improved mobile-first experiences;
* a dedicated mobile application;
* broader scaling for many leagues and users.

These ideas are not automatically approved Season 2 requirements.

They belong in:

`docs/05-roadmap/FUTURE_BACKLOG.md`

A future idea becomes active work only when Grae deliberately moves it into the current project scope and roadmap.

---

## Non-Goals for Season 2

Unless explicitly added to the active roadmap, Season 2 does not require:

* public self-service league creation;
* anonymous public registration;
* a dedicated mobile application;
* full commercial billing;
* every imaginable league-rule variation;
* unrestricted commissioner customization;
* community or social-network features;
* speculative systems that have not been approved as league rules.

The goal is a reliable core platform, not the largest possible feature list.

---

## Guiding Principles

### League integrity first

The system must consistently enforce approved rules and prevent unauthorized actions.

### Production data is deliberate

Data must never be silently seeded, replaced, erased, or reset.

An off-season does not automatically mean existing data is disposable.

### Active seasons are protected

Once a season begins, stability and predictable behaviour take priority over major new features.

### Major changes belong between seasons

Structural changes should be developed and tested during the off-season whenever practical.

### Automation by default

Normal league operations should happen automatically when the rules and timing are known.

### Commissioner recovery without hidden behaviour

Commissioners need tools to correct legitimate problems, but overrides should be explicit and recorded.

### One authoritative backend

The backend is the authoritative source of league state.

The frontend displays and interacts with that state but must not independently invent league truth.

### Stable player identity

Players must be referenced using stable identifiers, not names alone.

### League isolation

Every league-specific record and action must be scoped to the correct league.

### Clear rules over guessed behaviour

When requirements are missing or contradictory, the system and development process should surface the uncertainty rather than inventing a rule.

### No silent behaviour changes

Changes to established behaviour must be intentional, documented, tested, and communicated.

### Documentation travels with the project

Important product rules, technical decisions, operating instructions, and testing requirements must live in the repositories rather than relying on chat history or individual memory.

### Build for clarity

The codebase, interfaces, and documentation should remain understandable to Grae, Marty, Parker, and future contributors.

---

## Sources of Detailed Truth

This North Star defines the product’s identity, direction, and non-negotiable principles.

It does not define every implementation detail or league rule.

Detailed truth is maintained in the following document groups:

* `docs/01-project/` — current state, scope, terminology, and operating mode;
* `docs/02-rules/` — approved league-wide and scoring rules;
* `docs/03-product-specs/` — exact user-visible feature behaviour;
* `docs/04-technical-specs/` — architecture, data model, APIs, migrations, and refactors;
* `docs/05-roadmap/` — current milestones and future backlog;
* `docs/06-work-plans/` — execution plans for active development work;
* `docs/07-testing/` — verification and release requirements;
* `docs/08-operations/` — production, backups, staging, and recovery;
* `docs/10-decisions/` — important approved decisions and their reasoning.

When this document conflicts with a lower-level document about Hundo Leago’s fundamental direction or principles, the conflict must be resolved before coding proceeds.
