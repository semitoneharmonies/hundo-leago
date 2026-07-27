# Hundo Leago — Trades

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 tradeable assets, contract transfer, retention, deadline, permission, roster, and history rules;
* current trade behaviour that may inform, but does not control, the target design;
* approved user-visible trade decisions.

Grae approved the Season 2 Trades product specification recorded in this document on 2026-07-18.

---

## Product Purpose

Hundo Leago needs a league-scoped trade workflow in which two teams can exchange approved assets without losing player identity, contract terms, prospect status, draft-pick history, retained-salary obligations, or transaction history.

This specification defines:

* who may create, respond to, cancel, administer, and view proposals;
* which assets may be traded;
* proposal lifetime and trade-deadline behaviour;
* acceptance-time asset revalidation without proposal reservations;
* contract, retention, roster, and cap effects;
* automatic cancellation, commissioner reversal, and correction;
* user-interface, history, validation, and testing requirements.

Acceptance must be one backend-authoritative atomic transaction.

---

## Out of Scope

This document does not define:

* auction bidding or resolution;
* Entry Draft order or draft-pick creation;
* the future pre-season Free Agent Draft;
* exact roster-lock and matchup snapshot implementation;
* exact database tables;
* exact API routes or payloads;
* email, push, or alternate notification channels planned for future updates;
* multi-team trades unless later approved;
* the detailed fulfillment workflow for future-considerations obligations.

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

Approved shared rules and this reconciled product specification are authoritative. Related shared documents were updated for tradeable retention, buyout penalties, future considerations, simultaneous proposals, and closed-proposal visibility.

---

## Existing Behaviour Is Not the Target Model

The current application includes trade proposals, player movement, retained salary, expiry, acceptance, cancellation, buyout interaction, trade block features, and history.

Current implementation also includes assumptions that are not established as Season 2 rules, including:

* frontend-driven state mutation;
* file-backed state;
* name-oriented or incomplete identifiers;
* buyout-penalty transfer fields;
* incomplete draft-pick and prospect-right support;
* incomplete league isolation and trade-deadline enforcement;
* current roster and salary calculations that predate the approved specifications.

Existing code is evidence only. Approved buyout-penalty transfers must be rebuilt against stable obligation records; cash, cap space, and unsupported assets remain non-tradeable.

---

## Backend Authority

The backend is authoritative for:

* proposal identity, league, teams, actors, status, and timestamps;
* asset identity, ownership, and eligibility;
* contract and retention terms;
* trade deadline and proposal expiry;
* acceptance, cancellation, automatic cancellation, reversal, and correction;
* roster and cap results;
* activity and proposal history;
* idempotency and concurrency control.

The frontend may preview a trade but may not independently transfer an asset or create retention.

---

## League Isolation

Every proposal belongs to one league and exactly two teams in that league.

Every asset, contract, retention record, draft pick, and prospect right must belong to the same league.

Cross-league reads and writes are rejected.

---

# Part 2 — Actors and Permissions

## Proposing Manager

A manager may:

* create a proposal from an assigned team to another team in the same league;
* select approved assets currently owned by the proposing team;
* request approved assets currently owned by the receiving team;
* propose retained salary within approved limits;
* cancel a pending proposal created by the assigned team;
* view proposals allowed to authenticated league members.

A manager may not accept on behalf of the opposing team or directly transfer assets.

---

## Receiving Manager

The receiving team’s manager may:

* accept a pending proposal;
* reject a pending proposal;
* create a separate counterproposal;
* view the proposal and acceptance-time preview.

Acceptance requires current authority for the receiving team.

---

## Commissioner

A commissioner may:

* create, accept, reject, or cancel a proposal for any team in the assigned league;
* complete an explicit commissioner trade action;
* reverse or correct a completed trade through the approved recovery workflow.

No written reason is required.

Commissioner actions must identify the commissioner and the teams for which the action was taken.

---

## Authenticated League Member

Every authenticated active member of a league may view that league’s pending, rejected, cancelled, expired, automatically cancelled, and completed trade information under the approved permissions.

Membership in one league grants no visibility into another league.

---

## Public Viewer

Unauthenticated viewers may not view trade proposals or trade history through public roster access.

Public roster pages may show only the approved current roster and contract result after completion.

---

# Part 3 — Proposal Model

## Trade Proposal Record

A proposal must preserve:

* stable proposal ID;
* league ID;
* proposing and receiving team IDs;
* creating actor ID;
* asset IDs offered by each team;
* proposed retention amount and retaining team for each retained contract;
* creation, update, expiry, deadline, and status timestamps;
* current status;
* acceptance, rejection, cancellation, automatic-cancellation, reversal, and correction references;
* related completed transaction ID when applicable.

Display names are not ownership authority.

---

## Proposal Statuses

Proposal statuses are:

```text
Pending
Accepted
Rejected
Cancelled
Expired
Automatically Cancelled
Reversed
Correction Required
```

Only `Pending` may be accepted, rejected, or cancelled through the normal manager workflow.

Terminal proposals never become pending again.

---

## Two-Team Limit

The initial Season 2 workflow supports exactly two teams per proposal.

Multi-team trades are out of scope until deliberately specified.

---

# Part 4 — Tradeable Assets

## Approved Asset Types

Approved tradeable assets are:

* Active roster players and their contracts;
* Bench players and their contracts;
* Injured Reserve players and their contracts;
* prospects and player rights;
* draft picks;
* existing retained-salary obligations;
* existing buyout-penalty obligations;
* future considerations.

Trades transfer contracts as-is except for approved retained salary.

---

## Non-Tradeable Items

The initial release does not permit trading:

* cash or cap space;
* an expired or bought-out contract;
* a free agent;
* a matchup snapshot position or points;
* league membership, team ownership, or commissioner authority;
* any other unnamed or unsupported asset.

The current buyout-penalty transfer capability remains part of the target workflow but must be rebuilt around stable league-scoped obligation records and backend validation.

---

## Minimum Asset Rule

Each team must offer at least one approved asset.

A one-sided transfer with no asset from one team is not a normal trade and requires a separate commissioner correction or future workflow.

---

## Stable Identity

Every selected asset uses a stable type-specific ID.

The system must reject a proposal or acceptance that relies only on a player name, pick label, team name, or other mutable display text.

---

## Retention and Buyout-Penalty Assets

An existing retained-salary obligation or buyout-penalty obligation may be included as a tradeable asset.

The entire identified obligation transfers to the receiving team with:

* the same underlying contract or buyout reference;
* the same annual AAV charge;
* the same remaining years and expiration;
* the same history and originating transaction.

The transfer changes the team responsible for the cap charge and, for retention, the team using the retention slot. It does not change the player’s underlying contract, reduce the obligation, split it, restart it, or extend it.

Acceptance must validate that the sending team still owns the obligation and that the receiving team can legally assume it. A received retention obligation uses one of the receiving team’s three retention slots.

---

## Future Considerations

Future Considerations is an explicit tradeable obligation asset.

It must be represented by a stable league-scoped record identifying:

* the completed trade;
* the team owing the consideration;
* the team entitled to receive it;
* its status;
* creation and status timestamps.

Future Considerations has no immediate cap, roster, contract, draft-pick, or matchup effect. It cannot silently transfer an unnamed player or pick.

Its later fulfillment or commissioner resolution requires an explicit logged workflow defined by the Commissioner Tools and technical specifications.

---

# Part 5 — Player and Roster Effects

## Contracted Players

An Active, Bench, or Injured Reserve player transfers with:

* the same stable player and contract IDs;
* the same original total value and term;
* the same AAV;
* the same remaining years;
* the same expiration;
* the same active auction buyout-lock end time;
* existing retention records;
* any new approved retention created by this trade.

The trade does not restart, extend, or replace the contract.

---

## Receiving Category

The receiving team preserves the player’s roster category:

```text
Active → Active
Bench → Bench
Injured Reserve → Injured Reserve
Prospect → Prospect
```

The receiving team may make a separate normal roster move after the trade.

Preserving category may create an illegal normal roster; the trade may still complete through the approved general warning and confirmation.

---

## Prospects

A prospect acquired from another team’s Prospect roster remains a prospect.

An unsigned prospect remains unsigned and has no salary.

A signed fantasy-ELC prospect remains signed and cap-exempt while in Prospects.

Once a signed prospect previously moved to Active or Bench, that player cannot return to Prospects through a trade.

---

## Injured Reserve

An Injured Reserve player transfers while preserving Injured Reserve status only if the player remains eligible at acceptance.

If eligibility no longer exists, the trade does not silently move the player; acceptance fails until the proposal is replaced or corrected.

---

# Part 6 — Draft Picks and Player Rights

## Draft Pick Identity

A draft pick must preserve:

* stable pick ID;
* league and draft identity;
* draft year or season;
* round;
* original team;
* current owning team;
* selection status.

Trading changes current ownership only. Original-team history remains unchanged.

---

## Pick Eligibility

An unspent pick may be traded:

* before the current year’s Entry Draft;
* while that Entry Draft is in progress, until the pick is used;
* for any already-created future draft.

A pick may be traded any number of times while it remains unspent. Every transfer changes current ownership and preserves original-team and complete ownership history.

A used, cancelled, expired, or not-yet-created placeholder pick cannot be traded.

The Entry Draft and Data Model specifications must define when future picks are created and how many future seasons exist.

---

## Player Rights

Player rights move as the same prospect asset represented on the Prospect roster.

The player remains in Prospects for the receiving team, and the receiving team receives the same signing option and restrictions.

A right that has already been released, expired, or converted to normal owned-player status cannot be traded.

---

# Part 7 — Proposal Creation

## Proposal Workflow

The manager workflow is:

1. choose another team in the same league;
2. select at least one owned asset from each side;
3. add any proposed retained AAV to an included contracted player;
4. review contract, retention-slot, roster, cap, and ownership previews;
5. confirm proposal creation;
6. save one pending proposal and its creation history atomically.

Creating a proposal does not transfer assets or change cap usage.

---

## Simultaneous Proposals

Trade proposals do not reserve assets.

A team may receive multiple proposals involving the same asset and may send multiple proposals involving one of its assets.

Proposal creation changes no ownership, cap amount, roster state, or asset availability.

Acceptance revalidates every asset. When one completed transaction changes ownership or eligibility, every other pending proposal affected by that change is automatically cancelled and recorded.

---

## Editing and Countering

A pending proposal cannot be edited in place.

The proposing team may cancel it and create a new proposal.

A receiver’s counterproposal rejects the original and atomically creates a new proposal with the teams’ proposing and receiving roles reversed.

The original becomes `Rejected`, shown to managers as declined, even if creation of the counterproposal fails.

---

# Part 8 — Timing and Deadline

## Approved Trading Window

Trading opens at the start of the Entry Draft.

Trading closes at the commissioner-configured league trade deadline.

Trading reopens at the start of the next Entry Draft.

The deadline belongs to the league, uses the stored league timezone, is calculated by the backend, handles daylight-saving time, and is displayed unambiguously.

---

## Approved Proposal Lifetime

A trade proposal expires seven days after creation.

Seven days means exactly:

```text
7 × 24 hours = 168 hours
```

At the exact expiry instant, acceptance is closed.

---

## Deadline Precedence

The proposal’s effective acceptance deadline is the earlier of:

* its 168-hour expiry instant; or
* the league trade deadline.

At the exact effective deadline, the proposal immediately becomes `Expired` and cannot be accepted.

Expired proposals leave the normal proposal interface, remain preserved and visible to authenticated league members in League Activity, and do not revive when trading reopens.

---

## Controlled Clock

Tests must control time before, exactly at, and after proposal expiry and trade deadline.

Read-only requests must never expire proposals as a hidden side effect. A scheduler or explicit write operation performs overdue status transitions idempotently.

---

# Part 9 — Retained Salary

## Approved Retention Limits

Retention:

* is an AAV amount greater than `$0`;
* may use up to two decimal places;
* may not make cumulative retention exceed 50% of original AAV;
* uses one active retention slot for each retaining team and contract;
* is limited to three active slots per team;
* lasts through every remaining year of the contract;
* remains unchanged if the player is later traded or bought out;
* ends when the underlying contract term ends.

One team may hold only one active retention obligation on the same contract.

---

## New Retention Entry

Retention may be added only by the team currently trading away an included contracted player.

The proposal specifies one exact retained AAV amount. The amount is not a percentage and cannot be changed after acceptance. Its responsible team may later change only when the entire obligation is traded, reversed, or corrected.

A team receiving a player cannot create retention for itself in the same trade.

---

## Retention Validation

Proposal creation previews retention but does not consume a slot.

Acceptance revalidates:

* current full underlying AAV;
* current cumulative retention;
* 50% ceiling rounded down to cents when necessary;
* retaining team’s available slot;
* absence of another retention by that team on the same contract;
* contract status and remaining years.

The current owner’s player amount becomes original AAV minus all retained AAV, rounded to the nearest hundredth.

---

## Chained Retention

On a later trade, the current owner may retain an additional amount when all limits are satisfied.

Every retaining team’s obligation remains a separate record linked to the same underlying contract.

Existing obligations remain with their responsible teams unless an obligation is explicitly included as a tradeable asset. Trading the player alone does not move an existing retention obligation.

---

# Part 10 — Acceptance

## Acceptance Preview

Immediately before confirmation, the receiving manager sees:

* every asset moving in each direction;
* player categories;
* original AAV and remaining years;
* existing and new retention;
* retention slots before and after;
* Active cap before and after;
* roster-category counts before and after;
* a general illegality flag for either resulting roster;
* proposal expiry and league deadline.

---

## Acceptance-Time Revalidation

The backend must verify:

* proposal is pending;
* actor may accept for the receiving team;
* current time is before the effective deadline;
* both teams remain active in the league;
* every asset is still owned by the expected team;
* every asset remains tradeable;
* each contract and prospect state is unchanged or still compatible;
* every draft pick remains unspent;
* all retention rules remain satisfied;
* every traded retention and buyout-penalty obligation remains owned by the expected team;
* the receiving team can assume every traded obligation;
* every Future Considerations asset has valid owing and entitled teams;
* the request has not already completed.

---

## General Illegality Confirmation

A trade may complete even when it leaves either normal roster illegal.

The accepting manager must receive the approved general illegality flag and explicitly confirm completion. The warning does not need to enumerate every issue.

A commissioner completing a trade receives the same flag and confirmation.

---

## Atomic Completion

Acceptance must atomically:

1. transfer every player, prospect right, and draft pick;
2. preserve or update roster categories as approved;
3. transfer player contracts unchanged;
4. create new retention obligations;
5. preserve or transfer existing retention and buyout-penalty obligations exactly as listed;
6. create Future Considerations obligation records;
7. recalculate authoritative cap and retention-slot results;
8. set the proposal to `Accepted`;
9. automatically cancel every other pending proposal made stale by the transfer;
10. create one completed trade and activity record.

Failure rolls back the entire acceptance.

---

# Part 11 — Rejection, Cancellation, and Automatic Cancellation

## Manager Actions

The receiving team may reject a pending proposal.

The proposing team may cancel a pending proposal.

Rejection or cancellation is immediate, preserves proposal details in authenticated history, and cannot be undone by a manager.

---

## Approved Buyout Cancellation

Buying out a player automatically cancels every pending trade involving that player.

The cancellation and reason are recorded.

Existing retained salary is not changed by the buyout.

---

## Approved Contract-Expiration Cancellation

Contract expiration automatically cancels every pending trade involving the expired player.

The cancellation is part of the atomic league rollover and is recorded.

---

## Other Asset Changes

A pending proposal is automatically cancelled when:

* a selected player or prospect is traded through another authorized correction;
* selected prospect rights are released or converted incompatibly;
* a selected draft pick is used, removed, or corrected to another owner;
* a team is removed or made inactive;
* an included contract is corrected so the proposed retention is no longer valid.
* a selected retention or buyout-penalty obligation changes responsible teams;
* a selected Future Considerations obligation is fulfilled, cancelled, or corrected.

A normal roster-category move alone does not cancel the proposal. Acceptance revalidates the new category.

---

# Part 12 — Commissioner Completion, Reversal, and Correction

## Commissioner Completion

A commissioner may explicitly complete a pending trade for the teams without a separate receiving-manager action.

The interface identifies this as a commissioner completion, requires confirmation, and uses the same validation and atomic acceptance operation.

No written reason is required.

---

## Reversal Eligibility

A commissioner may reverse a completed trade only when every transferred asset and created obligation is still in the exact recoverable state produced by that trade.

Reversal is rejected if a player, prospect, pick, contract, retention, buyout penalty, or Future Considerations obligation has since been consumed, moved, bought out, fulfilled, expired, or changed by another completed transaction.

When direct reversal is unsafe, the commissioner must use a separately planned atomic correction workflow rather than partially undoing the trade.

---

## Atomic Reversal

An eligible reversal must atomically:

* return every asset to its pre-trade owner and category;
* remove only retention and Future Considerations obligations created by the trade;
* return traded retention and buyout-penalty obligations to their pre-trade responsible teams;
* restore authoritative cap and retention-slot results;
* set the completed trade to `Reversed`;
* append reversal history without deleting the original completion.

A reversal may occur after the trade deadline because it is correction of a completed transaction, not a new manager trade.

---

## Correction Required

If a recovery operation cannot safely complete, no partial reversal is saved.

The transaction may be marked `Correction Required` and routed to the commissioner recovery process defined by Commissioner Tools and technical specifications.

---

# Part 13 — Freeze and Matchups

## League Freeze

An active league freeze blocks manager proposal creation, acceptance, rejection, cancellation, and countering.

Commissioner trade administration remains available through explicit controls.

Scheduled expiry and automatic cancellation continue because those actions close existing proposals without transferring assets.

---

## Matchup Separation

A completed trade after Monday at 4:00 PM does not alter the current matchup snapshot.

Players and normal-roster legality affect a future snapshot when eligible under the Matchups specification.

Trade activity history must not record matchup points or standings changes.

---

# Part 14 — User Interface

## Proposal Builder

The proposal builder shows:

* both teams;
* owned and eligible assets grouped by type;
* player position, roster category, AAV, and remaining years;
* prospect signing state;
* draft-pick year, round, original team, and current owner;
* retention entry and remaining ceiling;
* retention slots;
* proposal expiry and trade deadline;
* roster, cap, and general-illegality preview.

Unavailable assets are disabled with a clear explanation.

Player and draft-pick actions on a team roster may open the proposal builder
with one stable asset ID preloaded. An action on the manager's own team
preloads the proposing side. A request action while viewing another team
preloads that team as the receiver and the selected asset on the receiving
side. The user must still review and explicitly submit the proposal.

---

## Proposal Views

Authenticated league proposal views show:

* both teams and all assets;
* contract and retention terms;
* proposal status;
* creating and responding actors;
* timestamps;
* automatic-cancellation reason;
* completion, reversal, or correction references.

When a proposal requests new salary retention on an included player contract,
the proposal view presents that requested retention within the matching
contract card. The combined card shows the player, contract AAV and term,
roster category, and requested retained AAV. Draft picks, existing retention
obligations, and every other independent tradeable asset remain separate
items. Pairing uses the stable contract ID and does not change the underlying
proposal assets.

The initial release uses one normal proposal list with status filters for pending and other non-expired proposal states. Expired proposals leave that interface and remain available in League Activity. Alternate view methods may be added in future updates.

---

## Trade Block

The initial release keeps a simple league-visible trade block where a manager may flag an owned player as available. The flag:

* is informational only;
* does not create, approve, or alter a trade;
* does not expose private bid or negotiation notes;
* clears automatically when the player leaves the team;
* may be removed by the manager or commissioner.

## Notifications

Creating a proposal atomically creates an in-app notification for every active
manager of the receiving team other than the actor. The notification links the
recipient directly to the identified proposal and opens its authoritative
acceptance preview when that recipient has response authority. It does not
reveal the proposal to a user outside the league.

The league dashboard and normal Trades list visually distinguish a pending
proposal when the signed-in receiving manager is expected to respond. This
presentation is not an authorization boundary.

The initial release does not require separate email or push notifications for
new, accepted, rejected, cancelled, expired, or countered proposals.

---

# Part 15 — Activity and History

## Completed Trade Activity

Completed trade activity must record:

* actor;
* league, proposal, transaction, team, and asset IDs;
* every transferred player, prospect right, and draft pick;
* transferred contract AAV and remaining years;
* every new retention amount and retaining team;
* every transferred retention and buyout-penalty obligation;
* every created Future Considerations obligation;
* timestamp;
* commissioner-completion reference;
* resulting general illegality flag.

It must not record matchup or standings effects.

---

## Proposal Status History

Creation, rejection, cancellation, expiration, automatic cancellation, completion, reversal, and correction are preserved with actor or system identity and timestamp.

Failed validation that makes no state change is not a completed league transaction.

The normal interface need not show raw operational failures, secrets, or internal stack details.

---

# Part 16 — Validation and Failure Behaviour

The backend must reject:

* unauthenticated or unauthorized actions;
* cross-league teams or assets;
* a proposal to the same team;
* an unsupported asset type;
* an asset not owned by the expected team;
* duplicate or conflicting assets within the same proposal;
* an invalid, spent, or placeholder pick;
* invalid retention;
* a proposal or acceptance outside the trading window;
* acceptance at or after effective expiry;
* a non-pending proposal action;
* stale ownership, contract, or prospect state;
* repeated acceptance that would transfer twice;
* unsafe partial reversal.

Errors must be clear and leave all related state unchanged.

---

# Part 17 — Required Testing

Tests must cover:

* manager, receiver, commissioner, league-member, public, and cross-league permissions;
* each asset type and mixed-asset trades;
* stable identities and duplicate assets;
* category-preserving player and prospect transfers;
* signed and unsigned prospects;
* draft-pick original-team history;
* repeated draft-pick transfers before and during an Entry Draft;
* contract AAV, remaining years, and buyout lock transfer;
* one and chained retention records;
* whole-obligation retention and buyout-penalty transfers;
* responsible-team cap and retention-slot changes;
* Future Considerations creation, visibility, and later explicit resolution boundary;
* retention ceiling, cent rounding, and slot limits;
* multiple incoming and outgoing proposals involving the same asset;
* acceptance-time stale-asset revalidation and automatic cancellation;
* cancellation, rejection, countering, expiry, deadline, and reopening;
* before, exactly at, and after all deadlines;
* buyout and expiration automatic cancellation;
* stale assets and concurrent acceptances;
* legal and illegal resulting rosters;
* current matchup snapshot separation;
* commissioner completion, safe reversal, unsafe reversal, and correction;
* atomic rollback and idempotent retry;
* activity fields and absence of matchup or standings entries;
* proof that reads never expire, cancel, accept, or repair a proposal.

---

# Part 18 — Approval Checklist

## Inherited Approved Rules

- [x] Trading is league-scoped and both teams belong to the same league.
- [x] Trading opens at Entry Draft start and closes at the commissioner-configured deadline.
- [x] Trading reopens at the next Entry Draft start.
- [x] Proposals expire seven days after creation and cannot be accepted after the trade deadline.
- [x] Active, Bench, and Injured Reserve players with contracts are tradeable.
- [x] Prospects and player rights are tradeable and remain prospects after transfer.
- [x] Draft picks are tradeable and retain original-team history.
- [x] Contracts transfer without changing AAV, remaining years, expiration, or auction buyout lock.
- [x] Approved retained salary may be added and persists for the remaining contract term.
- [x] Cumulative retention is limited to 50% of original AAV and three active slots per team.
- [x] Existing retention is unchanged by a later trade or buyout.
- [x] Assets and retention are revalidated at acceptance.
- [x] Acceptance is atomic, idempotent, and protected against duplicate processing.
- [x] Transactions may complete with a general illegality warning and confirmation.
- [x] Buyout and contract expiration cancel pending trades involving the player.
- [x] Managers may propose, accept, reject, and cancel for assigned teams.
- [x] Commissioners may propose, accept, reject, cancel, and reverse within their league.
- [x] No written reason is required for a commissioner trade action.
- [x] Authenticated league members may view pending, rejected, cancelled, and expired proposals.
- [x] Public viewers may not view trade information.
- [x] Trade status changes and completion are recorded without matchup or standings activity.
- [x] Read-only requests never mutate trade state.

## Approved Trade Decisions

- [x] The initial trade workflow supports exactly two teams.
- [x] Proposal statuses are `Pending`, `Accepted`, `Rejected`, `Cancelled`, `Expired`, `Automatically Cancelled`, `Reversed`, and `Correction Required`.
- [x] A terminal proposal never becomes pending again.
- [x] Cash, cap space, free agents, matchup results, and unsupported unnamed assets are not tradeable.
- [x] Existing buyout-penalty obligations, retained-salary obligations, and Future Considerations are tradeable assets.
- [x] Current buyout-penalty transfer capability remains in the target model and is rebuilt with stable obligation identities.
- [x] Each team must contribute at least one approved asset to a normal trade.
- [x] A player’s receiving roster category is preserved as Active, Bench, Injured Reserve, or Prospect.
- [x] The receiving team makes any later category change through a separate normal roster move.
- [x] Injured Reserve status transfers only when the player remains eligible at acceptance; otherwise acceptance fails.
- [x] Signed fantasy-ELC prospects remain signed and cap-exempt while transferred within Prospects.
- [x] A signed prospect that already left Prospects cannot return through a trade.
- [x] Unspent current-year picks may be traded before or during the Entry Draft.
- [x] Already-created future picks may be traded.
- [x] A draft pick may be traded multiple times while unspent and preserves complete ownership history.
- [x] Used, cancelled, expired, and not-yet-created placeholder picks cannot be traded.
- [x] Prospect rights use the Prospect-roster asset and cannot be traded after release, expiry, or conversion.
- [x] Creating a proposal changes no ownership or cap amount.
- [x] Each team selects at least one asset, reviews the preview, and confirms proposal creation.
- [x] An asset may appear in multiple pending proposals.
- [x] Proposals do not reserve assets.
- [x] Teams may receive or send multiple offers involving the same player or other asset.
- [x] Acceptance revalidates ownership, eligibility, contract, obligation, and category state.
- [x] A pending proposal cannot be edited in place.
- [x] The proposer changes terms by cancelling and creating a new proposal.
- [x] A counterproposal rejects the original and atomically creates a reversed-role proposal.
- [x] If counterproposal creation fails, the original remains rejected and is shown as declined.
- [x] Seven days means exactly 168 hours after creation.
- [x] The effective deadline is the earlier of 168-hour expiry and the league trade deadline.
- [x] At the exact effective deadline, the proposal becomes `Expired` and cannot be accepted.
- [x] Expired proposals leave the normal proposal interface, remain in League Activity, and never revive.
- [x] Overdue expiry is performed by an idempotent scheduler or explicit write, never by a read.
- [x] Only the team trading away an included contracted player may create new retention in that trade.
- [x] Retention is entered as one exact AAV amount rather than a percentage.
- [x] The receiving team cannot retain salary for itself in the same trade.
- [x] Proposal creation previews retention but consumes a slot only at acceptance.
- [x] Every chained retention obligation remains a separate record linked to the underlying contract.
- [x] An existing retention obligation may be traded as a whole without changing its amount or schedule.
- [x] A traded retention obligation changes the responsible team and uses the receiving team’s retention slot.
- [x] An existing buyout-penalty obligation may be traded as a whole without changing its amount or schedule.
- [x] Future Considerations creates an explicit stable obligation record with no immediate cap or roster effect.
- [x] The acceptance preview shows assets, categories, contracts, obligations, slots, cap, roster counts, general illegality, and deadlines.
- [x] The accepting manager explicitly confirms after any general illegality flag.
- [x] Acceptance transfers assets, contracts, obligations, and new retention and updates status, cap, stale proposals, and history atomically.
- [x] Receiver rejection and proposer cancellation are immediate and cannot be undone by a manager.
- [x] Rejection and cancellation preserve proposal history.
- [x] Asset transfer, rights release or conversion, pick use or correction, team deactivation, and incompatible contract correction automatically cancel affected pending proposals.
- [x] A normal roster-category move alone does not automatically cancel a proposal.
- [x] Commissioners may complete a pending trade without separate receiver acceptance through an explicit confirmed action.
- [x] Commissioner completion uses the same validation and atomic operation as manager acceptance.
- [x] Direct reversal is allowed only while every asset and created obligation remains in the exact recoverable post-trade state.
- [x] A consumed, moved, bought-out, expired, or later-modified asset makes direct reversal unsafe.
- [x] An eligible reversal returns every asset and category, removes only trade-created obligations, restores cap results, and appends history atomically.
- [x] Commissioner reversal may occur after the trade deadline because it corrects a completed transaction.
- [x] Unsafe reversal makes no partial change and must use the separate correction workflow.
- [x] A league freeze blocks manager trade writes but allows scheduled expiry and automatic cancellation.
- [x] The initial proposal interface uses one league-visible list with status filters; alternate views may be future updates.
- [x] The initial release keeps a simple informational trade block.
- [x] A trade-block flag creates no approval or transaction effect.
- [x] A trade-block flag clears when the player leaves the team and may be removed by the manager or commissioner.
- [x] The initial release uses in-app status and activity without separate email or push trade notifications.
- [x] Failed validation that changes no state is not a completed league transaction.
- [x] Grae approves this document as the Season 2 Trades product specification.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The rule-approval phase for this specification is complete because:

* every material trade decision was approved or revised;
* tradeable and non-tradeable asset boundaries are explicit;
* simultaneous proposals, expiry, deadline, and counter behaviour are approved;
* player-category, draft-pick, retention, buyout-penalty, Future Considerations, and reversal behaviour are explicit;
* no unchecked workflow is presented as final behaviour.

Implementation is complete only when backend authority, league isolation, stable identities, atomic acceptance, deadline safety, retention, recovery, permissions, history, and required tests are proven.

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
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/07-testing/TESTING_STRATEGY.md
```
