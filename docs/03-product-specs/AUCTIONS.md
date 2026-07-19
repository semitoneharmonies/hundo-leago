# Hundo Leago — Auctions

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 auction, contract, roster, timing, permission, and history rules;
* current auction behaviour that may inform, but does not control, the target design;
* approved user-visible auction decisions;
* the reconciled blind-bidding and auction-history visibility model.

Grae approved the Season 2 Auctions product specification recorded in this document on 2026-07-18.

---

## Product Purpose

Hundo Leago needs a league-scoped free-agent auction that lets teams compete for unowned players while producing one deterministic winner, one valid contract, one ownership change, and one activity record.

This specification defines:

* how an auction starts and accepts bids;
* what a bid contains;
* who may bid or administer an auction;
* when auctions open, close, and resolve;
* how bids rank and how the winning price is calculated;
* how the winning contract and roster assignment are created;
* how conflicts, stale data, temporary roster illegality, and retries are handled;
* what league members and the public may view.

The target workflow must be authoritative on the backend and safe under retries, concurrent requests, restarts, and scheduled processing.

---

## Out of Scope

This document does not define:

* the future pre-season Free Agent Draft;
* Entry Draft selections or prospect-rights acquisition;
* trade proposal and acceptance workflows;
* scoring or matchup calculations;
* exact database tables;
* exact API routes or payloads;
* the decimal library or job scheduler;
* email, push, or alternate notification channels planned for future updates.

Those subjects belong in their related product and technical specifications.

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
docs/03-product-specs/CONTRACTS.md
```

Approved shared rules and this reconciled product specification are authoritative. The related shared documents were updated with the approved blind-bidding, schedule, lifecycle, and history boundaries.

---

## Existing Behaviour Is Not the Target Model

The current application includes a Season 1 auction workflow with:

* frontend-oriented bid validation and state mutation;
* player-ID auction keys;
* a Thursday new-auction cutoff and Sunday resolution;
* one active bid per team and player;
* different edit limits for the auction starter and later bidders;
* a 75-minute edit cooldown;
* a current anti-bluff calculation;
* amount-based ranking with earliest-bid tie-breaking;
* commissioner-triggered resolution and bid removal;
* file-backed state and incomplete contract terms.

Current code assumes a one-year salary-like winning result and uses browser or frontend calculations in several places. It does not prove compliance with the approved multi-year contract model, backend timing authority, multi-league isolation, SQLite migration, or retry safety.

Current behaviour is implementation evidence only.

---

## Backend Authority

The backend is authoritative for:

* auction and bid identity;
* league, player, team, and actor identity;
* auction status and timestamps;
* bid value, term, edit count, and edit timing;
* visibility and authorization;
* deadlines and scheduled resolution;
* bid ranking and winning price;
* player availability;
* contract creation;
* roster assignment and legality flags;
* activity history;
* idempotency and recovery state.

The frontend may preview results but must not independently decide or save an auction winner.

---

## League Isolation

Every auction belongs to exactly one league and one stable player ID.

Every bid belongs to one auction and one authorized team in the same league.

No auction, bid, team, player ownership, contract, or history ID from one league may authorize a read or write in another league.

---

# Part 2 — Actors and Permissions

## Team Manager

A manager may:

* start an auction for an eligible unowned player before the approved cutoff;
* join an existing eligible auction;
* edit the assigned team’s bid within approved limits;
* view auction information allowed to authenticated league members.

A manager may not:

* withdraw a submitted bid;
* bid for another team;
* resolve, cancel, or delete an auction;
* remove another team’s bid;
* directly create the winning contract or roster assignment.

---

## Commissioner

A commissioner may:

* submit or edit a bid for any team in the assigned league;
* remove a specific bid;
* manually trigger auction resolution;
* perform an explicit auction correction or recovery action.

No written reason is required for an approved commissioner auction action.

Commissioner capability must remain explicit. Merely viewing an auction as commissioner must not mutate it.

---

## Authenticated League Member

An authenticated active member of a league may view the auction information allowed by the final visibility decision.

Membership in one league grants no access to private auction information in another.

---

## Public Viewer

An unauthenticated viewer may not view auction information or use auction endpoints.

---

# Part 3 — Auction and Bid Model

## Auction Record

An auction must preserve:

* stable auction ID;
* league ID;
* stable player ID;
* canonical player position;
* status;
* creating team and actor;
* creation timestamp;
* bid-close and scheduled-resolution timestamps;
* resolved timestamp when applicable;
* winning bid, contract, roster assignment, and history references when applicable;
* cancellation, no-winner, correction, or recovery references when applicable.

The player name is display data. Stable player identity controls eligibility and ownership.

---

## Auction Statuses

The auction statuses are:

```text
Active
Resolved
No Winner
Cancelled
Correction Required
```

`Active` accepts permitted bids.

`Resolved` has one completed winner, contract, roster assignment, and result.

`No Winner` closed without an eligible winning bid.

`Cancelled` was explicitly ended without assignment.

`Correction Required` records a failed scheduled or manual resolution that completed no partial assignment and needs commissioner recovery.

## Bid Record

A bid must preserve:

* stable bid ID;
* auction ID and league ID;
* bidding team ID;
* submitting actor ID;
* total contract value;
* contract term of one, two, or three years;
* calculated AAV preview;
* original submission timestamp;
* latest edit timestamp;
* edit count;
* status;
* commissioner-action reference when applicable.

A team may have only one current bid in an auction. An approved edit changes that bid rather than creating a second current bid.

Historical bid versions must remain recoverable for audit and activity purposes. Managers see only active auctions in the normal Auction interface. Resolved bid details appear in League Activity rather than in the active-auction interface.

---

# Part 4 — Player Eligibility

## Eligible Free Agent

An auction may start only for a player who:

* has a stable player ID;
* is available in the league’s approved player pool;
* is not owned on an Active, Bench, Injured Reserve, or Prospect roster in that league;
* does not have player rights owned by a team when those rights block normal free agency;
* is not already the subject of another active auction in that league.

Eligibility must be checked when the auction starts and again during resolution.

---

## Released Prospect Rights

An unowned player whose prospect rights were released does not automatically enter the normal auction pool under the approved roster rules.

That player may re-enter the next Entry Draft only when drafted in the immediately preceding year. Later auction eligibility must be explicitly established by the Entry Draft or league rules and must not be inferred by this workflow.

---

## Ownership Conflict

An already-owned player cannot be assigned as an auction winner.

If the player becomes owned before resolution, the resolution transaction must not create duplicate ownership or a second contract. The auction is cancelled as no longer available.

---

# Part 5 — Weekly Schedule and Seasonal Availability

## Approved Schedule

```text
New-auction cutoff: Thursday at 11:59 PM Pacific
Auction rollover: Sunday at 4:00 PM Pacific
League timezone: America/Vancouver
```

The backend must calculate and persist unambiguous instants while presenting the league-local date and time.

Daylight-saving transitions must use the stored timezone rather than a fixed UTC offset.

---

## Weekly Boundary Behaviour

The approved weekly interpretation is:

* the weekly new-auction window opens Monday at `12:00:00 AM`;
* a new auction may start through Thursday at `11:59:59.999 PM`;
* the weekly new-auction window closes Friday at `12:00:00.000 AM`;
* teams may join or edit an already active auction until, but not including, Sunday at `4:00:00 PM`;
* at exactly Sunday `4:00:00 PM`, bidding is closed and the auction is eligible for one resolution;
* an auction started before cutoff remains in the same Sunday resolution cycle;
* after Sunday resolution, new auctions remain closed until the next Monday at `12:00:00 AM`.

---

## Seasonal Closure

All auctions close when the league playoffs begin.

No new auction may start, no team may join or edit an auction, and no weekly auction cycle may operate during the playoffs or off-season.

Any auction still active at playoff start is cancelled without a winner and preserved in auction history.

Auctions reopen only after the next season has started and the pre-season Free Agent Draft has completed.

The league lifecycle and Free Agent Draft specifications must provide the authoritative playoff-start, season-start, and Free Agent Draft completion timestamps.

Every auction-created contract belongs to the season in which the auction resolves. Its current contract year advances or expires at that season’s end even when the player was won in a midseason auction.

---

## Controlled Clock and Scheduler

Production code must use a backend-controlled clock.

Tests must be able to set the clock before, exactly at, and after every deadline.

Scheduled resolution must be protected against duplicate jobs, concurrent manual resolution, delayed execution, server restart, and retry.

Read-only requests must never resolve an overdue auction.

---

# Part 6 — Starting and Joining

## Starting Workflow

The manager workflow is:

1. Search the approved league player pool.
2. Select a player by stable ID.
3. Choose a contract term.
4. enter a total contract value valid for that term;
5. review AAV and any general illegality warning;
6. confirm the bid;
7. create the auction and first bid atomically.

If either the auction or bid cannot be created, neither is saved.

---

## Bid Minimums

Minimum starting totals follow the approved `$1 AAV per year` contract minimum:

```text
1 year: $1 total
2 years: $2 total
3 years: $3 total
```

Minimum joining totals are:

```text
1 year: $1.50 total
2 years: $3 total
3 years: $5 total
```

A joining team does not need to exceed a visible or hidden current bid because each team states its own maximum willingness to pay.

---

## One Team, One Bid

Each team has one current bid per auction.

Submitting again is an edit subject to the edit limit and cooldown. It does not create a second competing bid for the same team.

---

# Part 7 — Bid Value and Contract Terms

## Approved Contract Precision

Bid total value follows the approved contract rules:

* one-year totals may use up to two decimal places;
* two-year and three-year totals must be whole numbers;
* the maximum contract term is three years;
* there is no separate monetary maximum;
* AAV is total value divided by term and rounded to the nearest hundredth using half-up rounding.

Examples:

```text
$1 over 1 year   = $1.00 AAV
$2 over 2 years  = $1.00 AAV
$10 over 3 years = $3.33 AAV
```

`$1 over 2 years` is invalid because it is below the `$1 AAV per year` minimum.

---

## Edit Behaviour

An edit may:

* increase or decrease total value;
* change the contract term;
* preserve the bid’s original submission timestamp for tie-breaking;
* preserve the lowest valid AAV the team offered for anti-bluff pricing;
* replace the current version atomically.

An edit must still satisfy all value, precision, term, cooldown, and edit-count rules.

---

## Edit Limits

The initial-release limits are:

```text
Auction-starting team: 2 edits after the original bid
Every other team:      1 edit after the original bid
Cooldown:              75 minutes after submission or an edit
```

Managers cannot withdraw a bid.

A commissioner may edit or remove a bid despite manager edit limits and cooldown, but the action is explicit and logged.

---

# Part 8 — Blind-Bid Visibility

## Active and Resolved Visibility

The approved visibility model is:

* while an auction is `Active`, league members may see the player, participating teams, bid count, their own bid value and term, and deadlines;
* competing values and terms remain hidden while active;
* commissioners cannot view active bid values or contract terms, including through an administrative reveal;
* managers see only active auctions in the Auction interface;
* after resolution, every authenticated league member may view every submitted bid value, term, edit history, winning bid, and price paid in League Activity;
* public viewers see no auction information.

Commissioner authority to edit or remove a bid does not reveal its value. A commissioner selects the bid through its stable bid, team, player, and auction identity and receives only the information required for the confirmed administrative action.

---

# Part 9 — Ranking and Anti-Bluff Pricing

## Ranking Value

Ranking compares bid AAV, not total contract value.

Ranking by AAV prevents a longer term from winning merely because its total spans more years. The underlying winning contract still uses the submitted total and term.

The deterministic order is:

1. highest submitted AAV;
2. if tied, shorter contract term;
3. if still tied, earliest original bid timestamp;
4. if still tied, stable bid ID in ascending order.

## Anti-Bluff Price

The anti-bluff rule applies only to the winning team:

* if only one team bid, the winner pays its current submitted total and term;
* if multiple teams bid, the winner keeps its submitted term;
* the winning AAV becomes the greater of:
  * the winner’s lowest valid AAV offered during that auction; or
  * the highest competing AAV;
* when the highest competing bid tied the winner and lost only on a later tie-break, the winner pays its own current submitted AAV;
* the final total is winning AAV multiplied by the winning term and must remain valid for that term’s precision rules.

If the calculated total would violate precision, it is rounded up only to the smallest total valid for that term that produces at least the required winning AAV.

## No Cross-Auction Budget Reservation

The initial release does not reserve cap room or roster slots for active bids.

A team may bid in multiple auctions and may win results that leave its normal roster illegal. Each completed transaction receives the approved general illegality flag and confirmation behaviour.

---

# Part 10 — Resolution

## Resolution Sequence

For each due auction, the backend should:

1. acquire an auction-specific resolution lock;
2. confirm the auction is active and due;
3. load current bids and ownership;
4. validate each bid’s team, actor authority at submission, value, term, and stable references;
5. rank eligible bids deterministically;
6. choose the highest eligible bid;
7. calculate the anti-bluff winning value;
8. create the contract;
9. assign the player to the winning team’s Active roster;
10. calculate the resulting roster and cap legality;
11. persist the result and activity record atomically;
12. mark the auction resolved;
13. return the winning result and any general illegality flag.

No partial contract, ownership, roster, or history write may remain after failure.

---

## Assignment Category

An auction winner is assigned to the winning team’s Active roster.

If that creates an Active-slot, F/D-ratio, cap, or other normal-roster illegality, the transaction may still complete after the approved general warning and confirmation. The team’s matchup treatment remains controlled by the Monday snapshot rules, not by midweek roster state.

---

## Invalid-Bid Handling

At resolution, an invalid or stale bid is skipped and the next eligible bid is considered.

Roster or cap illegality is never a reason to skip a bid. A bid remains eligible even when winning it creates an illegal roster for that team.

Examples include:

* missing team or league membership;
* deleted or invalid team;
* malformed value or term;
* cross-league reference;
* missing stable player identity;
* duplicate or corrupted current bid.

Skipped invalid bids are preserved in operational audit where required, but their invalidation details are not shown in League Activity.

---

## No-Winner Handling

If no eligible bid remains, the auction becomes `No Winner`.

No contract or roster assignment is created. The outcome is recorded in auction history but not as a completed league transaction.

---

## Player Becomes Owned

If the player is already owned when resolution begins, the result is `Cancelled` with reason `Player no longer available`.

No bid is reassigned to a different player, and no winning contract is created.

---

## Multiple Due Auctions

The scheduler resolves separate auctions independently in stable auction-ID order.

Because cap and roster illegality do not block an otherwise valid transaction, one result does not invalidate a later result solely because the same team already won another player.

A failure in one auction must not partially change that auction or prevent independent auctions from resolving.

---

# Part 11 — Commissioner Controls and Recovery

## Manual Resolution

A commissioner may trigger resolution only after the normal Sunday bid-close instant.

The action requires confirmation and uses the same backend operation, validation, ranking, idempotency protection, and history as scheduled resolution.

It must not provide a separate winner-selection shortcut.

---

## Bid Removal

A commissioner may remove a specific active bid through an explicit confirmed action.

The removed bid remains in authenticated auction history with actor and timestamp. No written reason is required.

If the last bid is removed, the auction remains active until its scheduled close and then becomes `No Winner`, unless the commissioner explicitly cancels it.

---

## Auction Cancellation

A commissioner may cancel an auction only before a winner is assigned.

Cancellation requires confirmation, preserves all bids in authenticated history, creates an auction-status activity record, and creates no contract or roster assignment.

---

## Recovery and Correction

If scheduled resolution fails before commit, the auction remains unchanged or becomes `Correction Required` without partial effects.

A commissioner may retry the same resolution operation.

If a completed result is later proven incorrect, correction must be an explicit atomic recovery action that reconciles auction, contract, roster, cap obligations, and history. The original record remains visible; it is not silently deleted.

---

# Part 12 — Freeze, Illegality, and Matchups

## League Freeze

An active league freeze blocks manager auction writes.

Due scheduled resolutions continue because they complete bids already submitted before the freeze. Commissioners retain explicit administrative actions.

The interface must explain whether a blocked action is caused by the league freeze, auction cutoff, bid close, cooldown, edit limit, or authorization.

---

## General Illegality Warning

Starting, joining, or editing a bid may show a preview that a win could make the roster illegal.

Because other auctions and roster changes can occur before resolution, the preview is advisory.

The completed assignment uses the approved general illegality flag and confirmation model; it does not need to enumerate every illegality in the transaction warning.

---

## Matchup Separation

An auction result after Monday at 4:00 PM does not alter the current matchup snapshot.

Midweek normal-roster legality does not change current matchup points. The acquired player affects a future snapshot when eligible under the Matchups specification.

Auction activity history must not record matchup points or standings changes.

---

# Part 13 — User Interface

## Manager View

The manager interface shows:

* player identity and position;
* auction status;
* bid count and participating teams;
* new-auction cutoff and bid-close timestamp;
* the manager’s own current total, term, and AAV;
* remaining edits and cooldown;
* value and precision validation;
* a general potential-illegality warning;
* clear success or failure results.

Competing values and terms follow the final visibility decision.

---

## Result View

After resolution, the authenticated League Activity result shows:

* winning team;
* submitted winning total and term;
* submitted winning AAV;
* final price-paid total and AAV;
* contract term and remaining years;
* tie-break used when applicable;
* all historical bids permitted by the final visibility decision;
* result timestamp;
* resulting general illegality flag when applicable.

Public viewers see no auction result page.

---

## Notifications

The initial release uses in-app status and activity only.

It does not require separate email or push notifications for auction start, being outbid, approaching close, win, or loss.

---

# Part 14 — Activity and Audit

## League Activity

Completed auction transactions must record:

* actor or scheduled-system identity;
* league, auction, player, team, bid, and contract IDs;
* player display name;
* submitted winning total, term, and AAV;
* final price-paid total and AAV;
* assignment category;
* timestamp;
* resulting general illegality flag;
* commissioner-action reference when applicable.

League activity records the completed signing, not matchup or standings effects.

---

## Auction History

Authenticated auction history should preserve:

* auction creation;
* every bid version;
* commissioner bid removal;
* resolution result;
* no-winner or cancellation status;
* recovery and correction references.

Skipped or invalid bid details remain in restricted operational audit and are not shown in League Activity.

Failed validation that makes no state change is not a completed league transaction.

---

# Part 15 — Validation and Failure Behaviour

The backend must reject:

* unauthenticated or unauthorized writes;
* cross-league IDs;
* a player without stable identity;
* a player outside the eligible pool;
* a new auction after cutoff;
* a bid after close;
* an invalid contract term or value;
* a duplicate team bid outside the edit workflow;
* an edit during cooldown or after the edit limit;
* a manager withdrawal;
* assignment of an already-owned player;
* stale or repeated resolution that would duplicate ownership or a contract.

Errors must be clear and must not partially change state.

---

# Part 16 — Required Testing

Tests must cover:

* Monday new-auction opening;
* starting before, exactly at, and after cutoff;
* joining and editing before, exactly at, and after bid close;
* daylight-saving and `America/Vancouver`;
* all valid and invalid total-value and term combinations;
* starter and non-starter edit limits;
* cooldown boundaries;
* visibility for manager, other league member, commissioner, public viewer, and another league;
* proof that commissioners cannot reveal competing active bid values;
* ranking across values and terms;
* every tie-break layer;
* anti-bluff calculations and precision;
* one bidder and many bidders;
* already-owned and newly-owned players;
* invalid bids and no-winner results;
* proof that roster or cap illegality does not invalidate a bid;
* Active assignment and general illegality;
* league freeze;
* scheduled and manual resolution collision;
* retry, duplicate job, concurrent request, restart, and partial-failure prevention;
* commissioner removal, cancellation, recovery, and correction;
* activity content and absence of matchup or standings history;
* playoff-start cancellation, playoff and off-season closure, and reopening after season start and Free Agent Draft completion;
* end-of-season advancement of contracts won midseason;
* proof that reads never resolve auctions.

---

# Part 17 — Approval Checklist

## Inherited Approved Rules

- [x] Auctions are league-scoped and use stable player, team, bid, contract, and activity identities.
- [x] Managers may submit and edit bids for assigned teams but may not withdraw them.
- [x] Commissioners may submit, edit, remove, and manually resolve bids in their league.
- [x] No written reason is required for a commissioner auction action.
- [x] The new-auction cutoff is Thursday at 11:59 PM Pacific.
- [x] Auction rollover is Sunday at 4:00 PM Pacific.
- [x] The original league timezone is `America/Vancouver`.
- [x] Deadlines are backend-calculated, daylight-saving safe, visible, testable, and retry-safe.
- [x] Already-owned players cannot be assigned as auction winners.
- [x] Winning assignment creates the approved contract and uses shared roster and cap rules.
- [x] Transactions that leave the normal roster illegal may complete with a general warning and confirmation.
- [x] Post-lock roster changes do not alter the current matchup snapshot.
- [x] Auction results create league activity without matchup or standings entries.
- [x] Public viewers cannot view auctions.
- [x] Read-only requests never resolve or mutate auctions.
- [x] One-year totals may use two decimals; two- and three-year totals are whole numbers.
- [x] Contracts require at least `$1 AAV` per year and have a maximum term of three years.

## Approved Auction Decisions

- [x] An auction is created atomically with the first valid bid.
- [x] Auction statuses are `Active`, `Resolved`, `No Winner`, `Cancelled`, and `Correction Required`.
- [x] Managers see active auctions in the Auction interface; resolved bids appear in League Activity.
- [x] A team has one current bid per player auction; later submissions use the edit workflow.
- [x] Historical bid versions are preserved.
- [x] A player’s owned status and auction eligibility are validated at auction creation and resolution.
- [x] The weekly new-auction window opens Monday at `12:00:00 AM`.
- [x] New auctions may start through Thursday at `11:59:59.999 PM` and close Friday at `12:00:00.000 AM`.
- [x] Existing-auction bidding closes exactly Sunday at `4:00:00 PM`.
- [x] A pre-cutoff auction belongs to the immediately following Sunday resolution cycle.
- [x] Starting-bid minimums are `$1`, `$2`, and `$3` total for one-, two-, and three-year bids.
- [x] Joining-bid minimums are `$1.50`, `$3`, and `$5` total for one-, two-, and three-year bids.
- [x] Joining teams do not have to exceed another team’s current bid.
- [x] A bid includes total value and a one-, two-, or three-year term.
- [x] A bid edit may increase or decrease value and may change term.
- [x] An edit preserves the original bid timestamp and bidder’s lowest valid offered AAV.
- [x] The auction starter receives two edits after the original bid.
- [x] Every other team receives one edit after the original bid.
- [x] A 75-minute cooldown applies after original submission and every edit.
- [x] Commissioner edits and removals may bypass manager limits and cooldown but remain explicit and logged.
- [x] Active auctions hide competing values and terms while showing the player, participants, bid count, deadlines, and viewer’s own bid.
- [x] Commissioners cannot view active bid values or terms, including through administrative reveal.
- [x] After resolution, authenticated league members may view every bid, term, edit, winner, and price paid in League Activity.
- [x] Bids rank first by highest submitted AAV.
- [x] Equal AAV is broken by shorter term, earliest original timestamp, then ascending stable bid ID.
- [x] With one bidding team, the winner pays its current submitted total and term.
- [x] With multiple teams, anti-bluff pricing keeps the winner’s term and uses the greater of its lowest offered AAV or highest competing AAV.
- [x] A winner that defeats an equal competing bid only through a later tie-break pays its current submitted AAV.
- [x] An anti-bluff total is rounded up only to the smallest term-valid total preserving the required winning AAV.
- [x] Active bids do not reserve cap room or roster slots.
- [x] A valid win assigns the player to the Active roster.
- [x] Resolution skips an invalid or stale bid and considers the next eligible bid.
- [x] Roster or cap illegality never invalidates a bid or prevents an otherwise valid win.
- [x] Skipped invalid-bid details remain in operational audit where required but are not shown in League Activity.
- [x] An auction with no eligible bid becomes `No Winner` and creates no completed transaction.
- [x] A player who becomes owned before resolution causes cancellation as no longer available.
- [x] Separate due auctions resolve independently in stable auction-ID order.
- [x] One failed auction does not block independent auction resolutions.
- [x] Manual commissioner resolution is available only after the normal Sunday bid-close instant.
- [x] Manual and scheduled resolution use the identical winner-selection operation.
- [x] Removing the last bid leaves the auction active until close, when it becomes `No Winner`, unless explicitly cancelled.
- [x] Commissioners may cancel an unresolved auction through a confirmed, logged action.
- [x] Failed resolution creates no partial effects and may enter `Correction Required`.
- [x] Commissioner retry uses the same idempotent resolution operation.
- [x] A completed result is repaired only through an explicit atomic correction preserving original history.
- [x] A league freeze blocks manager bids but does not stop due scheduled resolution.
- [x] Auctions close at playoff start and remain closed through the playoffs and off-season.
- [x] Auctions reopen only after the next season starts and the pre-season Free Agent Draft completes.
- [x] Contracts won at any point in a season advance or expire at that same season’s end.
- [x] The initial release uses in-app status and activity without separate email or push auction notifications.
- [x] Failed validation that changes no state is operational audit, not a completed league transaction.
- [x] Grae approves this document as the Season 2 Auctions product specification.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The rule-approval phase for this specification is complete because:

* every material auction decision was approved or revised;
* blind bidding, commissioner visibility, and resolved-bid history are reconciled;
* weekly and seasonal auction availability is explicit;
* ranking, anti-bluff pricing, contract creation, deadline boundaries, and recovery are approved;
* no unchecked workflow is presented as final behaviour.

Implementation is complete only when backend authority, league isolation, atomic assignment, idempotent resolution, controlled-clock timing, permissions, history, and the required tests are proven.

---

# Related Documents

```text
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/TRADES.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/07-testing/TESTING_STRATEGY.md
```
