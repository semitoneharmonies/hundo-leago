# Hundo Leago — Free Agent Draft

## Document Status

`APPROVED`

This product specification consolidates:

* the approved annual Free Agent Draft lifecycle;
* private Candidate Card preparation and visibility;
* contracted-player carryover;
* automatic player and contract allocation;
* restricted tie auctions;
* the preseason daily rapid-auction period;
* manager-requested commissioner assistance;
* user-interface, history, recovery, notification, and testing requirements;
* the approved Season 2 and Season 3 presentation-video boundary.

Grae approved the product rules recorded in this document on 2026-07-27.
On 2026-07-28, Grae amended Candidate Card allocation so equal highest totals
rank by highest AAV before the restricted-tie procedure is considered, and
clarified that an authorized commissioner or administrator chooses the first
matchup start from which the FAD clock is derived rather than the system using
a fixed annual date.
On 2026-07-29, Grae approved the consolidated lifecycle package: scheduled
Entry Draft-start rollover, automatic all-or-nothing card opening, adaptive
help timing, strict whole-card carried-roster/cap legality, improvement-required restricted
ties, FAD-only exact-tie draws, final-hour nomination queueing, and automatic
whole-Monday Week 1 recovery when draft or FAD processing runs late.
On 2026-08-08, Grae clarified the exact event-linked evidence required to
restore Candidate eligibility after a fantasy-ELC decline or unsigned
prospect-rights release.
On 2026-08-11, Grae clarified the player-data boundary: the FAD is a preseason
event and requires only the persisted player catalogue, stable identity,
effective position, and league-scoped eligibility/ownership/contract state.
On 2026-08-14, Grae changed Candidate offers to AAV-first entry in exact
`$0.25` increments, with a server-derived total, save-time contract and cap
blocking, and an Active-AAV summary on the Candidate Card.
Prior-season statistics, current-season statistics, and an in-game/live feed
are neither Candidate inputs nor FAD deployment prerequisites.

The preseason FAD-only staging candidate disables the shared automatic
matchup-occurrence runner in full: statistics refresh, baseline, normal lock,
finalization, and matchup-week rollover occurrences do not run. FAD, Entry Draft, auction,
trade, and outbox jobs remain available subject to their own gates. A later
provider-neutral matchup/statistics slice must restore or split the runner
before automatic matchup processing is enabled.

The core Free Agent Draft is required before every Hundo Leago season,
including the initial 2026–27 season. The optional presentation video may be
omitted from Season 2 when it cannot be delivered safely. A short,
league-specific AI-generated Free Agent Draft video is a required product
component beginning in Season 3.

---

## Product Purpose

Hundo Leago needs an annual league- and season-scoped process that lets every
team privately nominate a complete opening roster and proposed contracts, then
allocates each free agent first by highest total contract value and then, when
totals tie, by highest AAV.

The Free Agent Draft consists of:

1. a private summer Candidate Card for each team;
2. one automatic Candidate Card deadline and allocation;
3. restricted auctions for offers tied on both highest total and contract term;
4. a full seven-day rapid-auction period with daily resolution and any
   additional cycles required by queued or fallback processing;
5. a final transition to the ordinary weekly in-season auction schedule.

The process should create an exciting preseason competition without weakening
backend authority, league isolation, contract rules, roster rules, or recovery
safety.

---

## Terminology

In this specification:

* **Free Agent Draft** may be abbreviated as **FAD**;
* **Candidate Card** means one team's private preseason player-and-contract
  nomination card;
* **roster player card** means the visual player treatment used by the normal
  roster interface and is not a Candidate Card;
* **Candidate Card deadline** means the instant exactly 168 elapsed hours
  before the Week 1 start snapshotted when cards open;
* **automatic allocation** means the deadline operation that awards all
  uniquely highest Candidate Card offers;
* **restricted tie auction** means an auction available only to teams whose
  Candidate Card offers tie on both highest total and contract term for one
  player;
* **rapid-auction period** means the period after automatic allocation and
  through durable FAD completion, during which FAD auctions resolve every 24
  elapsed hours and unfinished processing may move competition Week 1;
* **ordinary weekly auction** means the in-season auction process defined by
  `AUCTIONS.md`.

---

## Out of Scope

This document does not define:

* Entry Draft order, lottery, eligibility, or prospect-right selection;
* ordinary weekly auction ranking and pricing rules except where this
  specification explicitly reuses them;
* exact database tables, migrations, API paths, payloads, event names, or job
  implementation;
* exact external player-import or statistics-provider behavior;
* general roster movement, trade, buyout, or commissioner-correction rules;
* the media-generation provider, narration model, rendering service, storage
  format, or final playback design for the presentation video;
* public Candidate Card access;
* a guarantee that every team will be legal or complete before the first
  matchup.

Those subjects remain controlled by their approved product and technical
specifications.

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
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/03-product-specs/MATCHUPS.md
docs/04-technical-specs/FREE_AGENT_DRAFT.md
```

Approved shared rules remain authoritative unless this specification records a
more specific FAD rule.

---

## Existing Behavior Is Not the Target Model

The current application does not implement Candidate Cards, automatic FAD
allocation, restricted tie auctions, daily preseason auction rollover, or
Candidate Card help access.

The existing player catalog, roster, contract, auction, activity, notification,
and commissioner foundations may be reused, but they are not proof that the FAD
workflow already exists or is approved.

The existing season-level FAD completion timestamp is only a foundation. It
does not represent the complete lifecycle defined here.

---

## Backend Authority

The backend is authoritative for:

* league, season, team, manager, and commissioner identity;
* the first matchup and Candidate Card deadline;
* Candidate Card state and revisions;
* carried contract and roster obligations;
* eligible free-agent identity;
* proposed contract value and term;
* help-request access;
* deadline locking;
* automatic allocation;
* restricted-auction participants;
* rapid-auction rollover instants;
* ownership, contract, roster, cap, activity, and notification effects;
* FAD completion.

The frontend may display and submit FAD information but must not decide
visibility, winners, access, timing, or persisted results.

---

## League and Season Isolation

Every Candidate Card, offer, result, help request, rapid auction, contract,
ownership, and activity record belongs to exactly one league and season.

A player may be free in one league and owned in another. Candidate eligibility
and allocation must therefore use the requested league's authoritative state.

No Candidate Card, offer, help grant, auction participant list, or result may
cross league boundaries.

---

# Part 2 — Annual Lifecycle

## Required Every Season

Every league runs one FAD before every season.

For a league's first season:

* teams have empty normal rosters at league creation;
* Candidate Cards have no prior-season carryovers;
* an approved Entry Draft prospect signing or roster move made before the
  Candidate Card deadline is still projected into Active, Bench, or Injured
  Reserve under the normal rules;
* managers use the FAD to construct the remainder of the initial roster.

For later seasons:

* contracts advance or expire during the automatic rollover at the scheduled
  start of the next Entry Draft;
* expired players become free agents;
* players with remaining normal contracts carry into the next season;
* carried players automatically occupy locked Candidate Card positions;
* managers fill only the remaining positions.

The FAD is not replaced by contract carryover, the Entry Draft, or ordinary
weekly auctions.

---

## Candidate Card Opening Gate

Entry Draft completion is the normal automatic Candidate Card-readiness
trigger. The future final `T-108` selection or confirmed-forfeiture transaction
that makes the Entry Draft `Complete` commits one durable
`entry_draft_completed` readiness handoff in that same transaction. If the
handoff cannot persist, neither the terminal pick action nor draft completion
commits. The handoff does not open Candidate Cards inline. A later server-owned
readiness worker opens cards only when every prerequisite below passes in its
all-or-nothing opening transaction.

Before Candidate Cards open, the backend must confirm that:

* prior-season contract rollover is complete when applicable;
* the applicable Entry Draft is complete when one exists;
* the target season exists;
* the target season's first matchup start is persisted;
* the participating team set and manager assignments are ready;
* authoritative ownership, roster, contract, and prospect-right state is
  available for carryover.

When every check passes, the backend creates the FAD, snapshots setup, and
opens every participating team's Candidate Card at the same committed instant.
If any check fails, no FAD or card opens and the commissioner receives the
exact blocker list and retry action. There is no separate commissioner
confirmation that may delay an otherwise-ready draft or open a subset of
cards.

There is no standalone or manual Entry Draft completion endpoint and no manual
FAD-opening endpoint. FAD-08 implements the shared internal transaction-bound
readiness-handoff primitive; the complete `T-108` command and Entry Draft user
interface remain deferred to M8.

The FAD has no system-fixed calendar date. Before draft completion, an authorized
commissioner or administrator sets and persists the target season's first
matchup start through the approved schedule workflow. The Candidate Card
deadline is then automatically derived as exactly 168 elapsed hours before
that chosen first-matchup instant.

If Entry Draft completion is at or after that derived deadline, the backend
advances Week 1 by whole league-local Mondays to the earliest otherwise-valid
start whose deadline is strictly after completion and whose complete
seven-day FAD period fits. The NHL regular-season ending and all four fantasy
playoff weeks remain fixed. Each delay removes an early regular-season
matchup week; the remaining pairings and byes are regenerated as fairly as
possible and dependent unexecuted jobs are replaced atomically before cards
open.

For FAD and league-competition purposes, that chosen first-matchup instant is
the start of the Hundo Leago season. It is not inferred from the season label,
the NHL opening date, an annual default, or a date embedded in application
code.

An approved no-draft transition may replace the Entry Draft prerequisite when
the target season legitimately has no preceding Hundo Leago Entry Draft. This
includes:

* a newly created league's inaugural season;
* the original league's initial Season 2 transition while the Entry Draft
  feature is not yet available.

The no-draft transition still requires every other opening prerequisite. The
system must record the approved transition reason, must never invent a
completed Entry Draft, and must commit its durable readiness handoff before the
server-owned worker can open all cards together.

The approved no-draft transaction ownership remains exact. For an ordinary
new league, `T-036` owns the `no_draft_inaugural` handoff inside initial
league/season activation. When `T-036` instead activates the exact
reset-created original league and initial Season 2, it creates no readiness
handoff; `T-037` later owns the `no_draft_initial_season2` handoff inside the
audited exemption and lifecycle transaction. Partial or ambiguous reset-origin
evidence fails the complete `T-036` transaction closed. If confirmed `T-095`
schedule creation supplies the missing schedule after a genuine-inaugural
readiness occurrence has already blocked, the same `T-095` transaction may
correctively requeue only that same operation and canonical job. It never
creates a second readiness trigger.

At automatic Candidate Card opening, the backend snapshots:

* the participating team set;
* the target season;
* the first matchup start;
* the Candidate Card deadline and rapid-rollover instants derived from that
  start.

Until FAD completion:

* no participating team may be added, erased, or deactivated;
* no manager or commissioner action may move the frozen Week 1 or historical
  FAD clock;
* schedule pairings may change only when that frozen clock remains unchanged;
* manager assignments may change under the normal rules, transferring future
  card and auction authority without changing the team.

This freeze does not permit competition to begin while FAD processing is
unfinished. If the proposed FAD completion instant is at or after the
snapshotted Week 1, the same atomic completion transaction moves competition
Week 1 to the first otherwise-valid league-local Monday strictly after that
instant, fixes the NHL and playoff endings, removes early regular-season
weeks, regenerates the remaining schedule fairly, replaces future jobs, and
only then exposes the FAD as complete. It does not change the Candidate
deadline, historical FAD rollovers, cards, bids, or results.

---

## Summer Preparation

Candidate Cards remain open from the applicable opening gate until the
Candidate Card deadline.

This period is intentionally long so managers may:

* research players;
* review statistics;
* plan positions and Bench use;
* choose AAV values and terms while reviewing calculated totals;
* review possible cap outcomes;
* revise their choices;
* ask the commissioner for help during the approved help window.

There is no early irrevocable submission. A manager may continue editing valid
non-carryover entries until the deadline.

---

## Approved Sequence

The normal annual order is:

1. the competition season ends after the final NHL regular-season game;
2. results and standings finalize;
3. Entry Draft setup may be prepared while contracts display `Pending
   Rollover`;
4. upcoming-season team additions close before Entry Draft setup confirmation
   freezes that draft's participating teams;
5. at the scheduled Entry Draft start, automatic rollover advances or expires
   contracts and makes expired players free agents;
6. only after rollover succeeds, trading opens and the Entry Draft runs;
7. the final selection or confirmed forfeiture makes the draft complete and
   commits the durable FAD-readiness handoff in the same transaction;
8. any required post-draft team finalization finishes while all cards remain
   closed;
9. Week 1 advances by whole Mondays when needed to leave a future deadline and
   complete seven-day period;
10. the readiness worker performs the first all-prerequisite evaluation and,
    when it succeeds, automatically opens every Candidate Card together;
11. managers prepare private Candidate Cards, with help available for the
    final 48 hours or the entire remaining period when shorter;
12. the Candidate Card deadline locks every card;
13. unresolved carried-roster structural conflicts or over-cap projections
    exclude all new offers while valid entries on conflict-free incomplete,
    cap-compliant cards participate;
14. automatic allocation applies the approved total-first/AAV-second ranking;
15. offers tied on both highest total and term create restricted tie auctions;
16. open and restricted blind auctions resolve on daily rollovers, with
    queued nominations or no-improvement fallbacks creating later cycles;
17. FAD becomes complete only after every required active or queued path is
    terminal;
18. when completion overruns Week 1, competition moves to the first valid
    Monday after completion;
19. ordinary weekly auctions operate under `AUCTIONS.md`.

An approved no-draft transition replaces steps 4 through 7. On that path,
normal team additions remain available only until the equivalent automatic
opening readiness transaction succeeds. The transition does not replace the
schedule, team-freeze, card, or deadline requirements.

---

## Participating-Team Cutoff

For a season with an Entry Draft, every normal upcoming-season team addition
must finish before Entry Draft setup confirmation freezes that draft's
participating teams. A team added after that point would have missed its draft
rights, so normal addition remains closed for the rest of that season.

For an approved no-draft transition, normal team addition remains available
until the automatic opening readiness transaction succeeds.

Team erasure or deactivation has a separate window. It may occur only after
Entry Draft completion, or an approved no-draft transition, and before FAD
opening readiness succeeds and opens Candidate Cards. If team finalization is
still pending when the draft completes, it is an explicit blocker and no card
opens; completing the team decision reruns the all-or-nothing readiness check.

Before opening, an authorized team erasure or deactivation must reconcile the
schedule, ownership, roster, contract, draft, and other approved team-dependent
records. Players released by an authorized erasure become available under the
normal league rules.

At and after opening, the participating team set is frozen. Adding, erasing, or
deactivating a participating team must fail until a later approved lifecycle
window. A manager-assignment change does not change the participating team set
and transfers future authority to the newly assigned manager.

---

# Part 3 — Actors, Permissions, and Visibility

## Team Manager

A manager with an active assignment may:

* view the Candidate Card for each assigned team;
* edit selectable entries before the deadline;
* rearrange a carried player between eligible Active and Bench positions
  without removing the player's ownership or contract;
* view validation, completeness, cap, and deadline information;
* request commissioner help during the final 48 hours, or throughout the
  entire remaining preparation period when cards opened later;
* bid for an assigned team in open rapid auctions;
* bid for an assigned team in a restricted tie auction only when that team is
  an approved participant;
* view every league Candidate Card after the deadline.

A manager may not:

* view another team's Candidate Card before the deadline;
* remove or replace a carried contracted player through the Candidate Card;
* change a carried contract through the Candidate Card;
* edit any Candidate Card after the deadline;
* bid for a non-participating team in a restricted tie auction.

Authority follows the team assignment, not the user who first created an entry.

---

## Commissioner Role Before a Help Request

Commissioner authority by itself does not reveal private Candidate Cards for
teams the commissioner does not manage.

A commissioner who is also the assigned manager of a team retains ordinary
manager access to that team's card. That access comes from the manager
assignment, not from the commissioner role.

Before the deadline, the commissioner may see only:

* league-level completion status;
* whether a team is complete, incomplete, or has requested help;
* deadline and operational health;
* non-sensitive validation counts needed to operate the event.

The commissioner may not see a team's selected players, proposed values, or
terms unless that team's manager has requested help.

---

## Commissioner After a Help Request

During the help window, a manager may select **Ask commissioner for help**.
That window is normally the final 48 hours and begins at card opening when
less time remains.

Submitting the request immediately grants the assigned league commissioner
permission to:

* view that team's complete private Candidate Card;
* add, remove, move, or edit selectable candidate entries;
* review validation and completeness;
* help the manager finish the card.

The grant:

* applies only to the requesting team and current FAD;
* begins when the request is accepted by the backend;
* remains active until the Candidate Card deadline;
* does not reveal any other private Candidate Card;
* does not permit changes to carried ownership or contracts;
* does not extend or bypass the deadline;
* does not make commissioner edits appear to be manager edits.

The manager retains full normal editing access while the grant is active and
sees the commissioner's changes.

Every commissioner Candidate Card write must identify the commissioner as the
actor and preserve useful before-and-after audit information.

---

## Platform Administrator

A platform administrator does not receive automatic private Candidate Card
visibility.

With an explicit active league membership, a platform administrator may
exercise the same help-request-gated Candidate Card authority as the league
commissioner. The action must identify the administrator and the commissioner
authority being exercised.

Platform recovery authority remains separate and must not become an ordinary
private-card browsing path.

---

## Authenticated League Member

Before the deadline, an authenticated league member may not view another
team's private Candidate Card.

After the deadline, every active league member may view every Candidate Card
from that league as an immutable read-only record.

The post-deadline view includes:

* carried players;
* nominated free agents;
* entered AAV values and terms;
* calculated total values;
* the requested Candidate Card position;
* won, lost, tied, pending-auction, invalid, or unresolved outcome;
* the final contract and owning team when resolved.

---

## Public Viewer

Candidate Cards, FAD offers, help requests, rapid auctions, and FAD results are
not public.

Normal public-roster rules apply only to authoritative roster state, not to
private or historical Candidate Card data.

---

# Part 4 — Candidate Card Model

## One Card Per Team and Season

Every active participating team has exactly one Candidate Card for one FAD.

The card belongs to the team rather than a particular manager. A manager
assignment change transfers future card authority without changing or
duplicating the card.

The card must retain a version or equivalent stale-write boundary.

---

## Slot Structure

Every Candidate Card contains:

```text
Active forwards: 12 mandatory slots
Active defence:   6 mandatory slots
Bench:            4 optional slots
```

There are no Candidate Card slots for goalies, Injured Reserve, or Prospects.

The card always displays the complete structure. Carried players occupy part of
that structure and selectable candidates fill the remaining positions.

An empty mandatory slot makes the card incomplete. An empty Bench slot does
not.

---

## Candidate Entry

Each selectable Candidate Card entry contains:

* stable player ID;
* effective league position;
* requested Active F, Active D, or Bench slot;
* proposed AAV, which may remain empty while the card is
  being prepared;
* proposed term of one, two, or three years, which may remain empty while the
  card is being prepared;
* calculated total contract value when both contract fields are present;
* current eligibility and validation state;
* created and last-edited timestamps;
* current version.

A manager may save a selected player before entering the proposed AAV,
term, or both. The saved row remains an incomplete private-card draft rather
than an FAD offer until both contract fields form a valid contract. An
incomplete row never creates a bid, player ownership, or contract merely
because the Candidate Card deadline arrives.

Display name, NHL team, and age are optional presentation fields and are not
ownership or allocation keys. Statistics are outside the required Candidate
Card contract. A card must remain fully searchable, editable, validatable, and
allocatable when current-season statistics are all zero and no historical
statistics are available.

---

## Eligible Candidate

A selectable Candidate Card player must:

* have a stable player ID;
* belong to the league's approved player pool;
* be an eligible F or D;
* be active and available under the approved player-state rules;
* be unowned in that league;
* have no blocking prospect right;
* not be excluded from normal free agency because prospect rights were
  released or declined without the exact later confirmed re-entry evidence
  defined below;
* have no active contract in that league;
* not appear more than once on the same Candidate Card.

The same free agent may appear on Candidate Cards belonging to different teams.
That duplication is the intended source of automatic competition.

Each league-scoped ownership event of type `fantasy_elc_declined` or
`unsigned_prospect_rights_released` independently blocks Candidate eligibility.
The event is cleared only when one `draft_eligible_players` row:

* belongs to the same league and player;
* has `eligibility_reason = rights_release_reentry`;
* has `rights_release_event_id` equal to that exact ownership-event ID; and
* belongs to an eligibility snapshot whose status is `confirmed` and whose
  `confirmed_at_ms` is strictly later than the release event's
  `occurred_at_ms`.

A draft, superseded, same-time, wrong-player, wrong-league, or wrong-event
record does not clear the block. A confirmed row for an earlier release does
not clear a later release; every later qualifying release event blocks the
player again until separately cleared. Being unowned, absent from every roster,
or both never clears a release-event block by itself.

Eligibility is checked consistently in Candidate search, when an entry is
saved, and again at the deadline.

Candidate search reads the persisted catalogue; it does not call a statistics
provider. A paid provider credential, provider probe manifest, live
observation, or capability artifact cannot block card opening, FAD allocation,
rapid auctions, staging acceptance, or FAD completion.

---

## Contract Rules

A proposed Candidate Card contract follows the normal contract rules:

* one-, two-, or three-year term;
* at least `$1 AAV` for every contract year;
* AAV entered directly in exact `$0.25` increments;
* no separate monetary maximum;
* total contract value equals AAV multiplied by term with no rounding.

A selectable Bench entry must also satisfy the approved `$4 AAV` Bench limit.

The frontend must show player, entered AAV, term, and calculated total value in
four compact columns. It must identify calculated total as the primary
Candidate Card ranking value and AAV as the secondary equal-total ranking
value.

---

## Completeness and Legality Preview

The card must separately show:

* mandatory-slot completeness;
* contract validation;
* candidate eligibility;
* complete Candidate Card cap usage assuming every new offer is won;
* current carried obligations;
* exact over-cap or structural-illegality blockers.

At the top of the card, the frontend shows the read-only total AAV of every
Active F and D entry, the `$100` Active cap, and the separately identified
cap-exempt Bench AAV. The authoritative cap projection still includes any
other approved cap-counting obligations.

Bench players are position-neutral, cap-exempt, and limited to `$4 AAV`.
Active-player AAV plus retained salary, buyout penalties, and every other
approved cap obligation must leave the complete Candidate Card at or below the
salary cap.

A card with an unresolved carried-roster structural conflict or an over-cap
projection remains editable before the deadline and is visibly illegal. At the
deadline it still locks, but none of its new Candidate offers participate.
Carryover ownerships and contracts remain owned and visible, and the published
card explains the card-wide exclusion. The backend never chooses a subset of
new offers to discard. A manager or help-authorized commissioner may correct
the card only before the deadline; there is no post-deadline repair.

A conflict-free incomplete, cap-compliant card also locks. Its individually
valid new offers participate, while empty or invalid slots create no player or
contract. A Candidate made invalid or unplaced by an authoritative summer
player-state change is excluded individually; it does not create carried-roster
illegality or disqualify the card's other valid offers.

---

# Part 5 — Contract Carryover

## Automatic Carryover

After the scheduled Entry Draft-start contract rollover, every owned Active,
Bench, or Injured Reserve player with an active contract that has at least one
remaining year automatically appears on the next Candidate Card.

The carried entry uses the authoritative:

* player;
* ownership;
* effective position;
* Active, Bench, or projected Active Candidate category;
* original contract value;
* original term;
* AAV;
* remaining years.

The Candidate Card must not recreate, restart, extend, or otherwise modify the
contract.

---

## Locked Carryover

A carried player:

* cannot be removed from the Candidate Card;
* cannot be replaced by a free agent in the occupied position;
* cannot receive a new Candidate Card contract;
* continues to belong to the team regardless of FAD competition;
* reduces the number of open positions the manager must fill.

An eligible carried player may be rearranged through the Candidate Card
between a compatible Active F/D slot and a position-neutral Bench slot. That
atomic target-season roster movement preserves ownership and contract, applies
the `$4 AAV` Bench limit, and never creates a replacement free-agent offer.

---

## Injured Reserve and Prospects

An Injured Reserve assignment does not create an extra FAD position or a hidden
roster move.

A still-contracted player on Injured Reserve:

* remains on the authoritative Injured Reserve roster;
* occupies a locked projected Active F or D Candidate position;
* cannot be replaced by an additional selectable candidate;
* does not move to Active merely because the Candidate Card opens.

If an Active or Bench carryover moves to Injured Reserve while cards are open,
the player's locked Candidate position remains reserved. A later explicit
normal roster move updates the projection without recreating the contract.

Prospect rights and players held in the Prospect category remain governed by
the Entry Draft and Roster specifications. They do not occupy Candidate Card
positions unless an approved roster operation moves them into Active, Bench,
or Injured Reserve before the Candidate Card deadline. A signed player who
remains in Prospects does not occupy a Candidate position.

Retained salary and buyout penalties remain cap obligations but do not occupy
Candidate Card positions.

---

## Summer Transactions

An approved trade, buyout, prospect signing, commissioner correction, or roster
movement during the open-card period must update affected carried entries
automatically.

The system must never leave a traded or released player locked on the wrong
team's Candidate Card.

If a new carried obligation cannot fit a normal finite position:

* the obligation remains visible;
* it is not silently deleted;
* the card reports the structural conflict;
* selectable entries are not silently discarded;
* the team must correct the roster through an approved transaction or
  commissioner workflow.

At the deadline, unresolved carried-roster or cap illegality does not erase
carryovers. It makes the card illegal and excludes every new Candidate offer
under the whole-card rule. The normal matchup legality rules still apply
before scoring.

---

# Part 6 — Preparation, Saving, and Help

## Editing

Before the deadline, an authorized manager or help-authorized commissioner may:

* rearrange an eligible carryover between compatible Active and Bench slots
  without changing ownership or contract;
* add an eligible free agent to an open compatible position;
* remove a selectable candidate;
* move a selectable candidate to another compatible open position;
* change AAV;
* change term;
* correct an invalid entry.

The primary Candidate Card edit is one atomic whole-card save. An authorized
editor may change any number of editable rows and press one **Save** control;
the backend either persists the complete requested card draft or none of it.
There are no row-level save, submit, or lock-in controls.

Every save must validate every changed player and every contract field that is
present, preserve incomplete rows as incomplete drafts, and reject stale
writes without overwriting a newer card draft. A row containing a complete
contract must pass the normal Candidate offer rules before it can become an
allocatable offer. Carryover rows remain locked and cannot be changed by the
whole-card save.

The backend rejects the complete whole-card save when any completed offer is
below `$1 AAV`, is not an exact `$0.25` increment, or places a Bench player
above `$4 AAV`. It also rejects the save when the authoritative projected cap
usage for Active F and D entries plus other cap-counting obligations exceeds
`$100`. A player-only row or a row missing AAV or term remains a permitted
incomplete draft and contributes no proposed AAV until both fields are present.

---

## No Early Submission

Managers do not permanently submit or lock cards early.

The interface may show **Ready** when every mandatory position and entry is
valid, but the card remains editable until the backend deadline.

At the deadline, the backend locks every card automatically.

---

## Incomplete Card

Managers are responsible for filling every open mandatory position.

The system must:

* show every missing position;
* warn the manager before the help window;
* expose the commissioner-help action during the final 48 hours or throughout
  the entire remaining preparation period when cards opened later;
* continue to show an incomplete state until corrected.

An incomplete card does not delay the league or cause the backend to invent a
player or contract.

At the deadline, when the incomplete card is otherwise cap compliant:

* valid completed entries still participate;
* empty or invalid positions remain empty;
* the card locks as incomplete;
* the team fills remaining vacancies during rapid or ordinary weekly auctions.

---

## Final 48-Hour Help Window

The help window normally begins exactly `48 elapsed hours` before the
Candidate Card deadline. If automatic opening occurs less than 48 hours before
the deadline, it begins at opening and covers the entire remaining preparation
period.

During that window, the Candidate Card shows a clearly labeled
**Ask commissioner for help** action.

The request may include an optional message but requires no reason. It may be
used because the manager:

* does not understand the workflow;
* needs contract or roster guidance;
* lacks time;
* encounters an accessibility or technical problem;
* wants commissioner assistance for any other reason.

The backend records the request, grants the scoped access, and notifies the
commissioner atomically.

---

# Part 7 — Deadline and Automatic Allocation

## Deadline

The Candidate Card deadline is exactly `168 elapsed hours` before the Week 1
instant snapshotted when Candidate Cards open. That deadline begins the full
seven-day FAD auction period.

For the original league, clocks are displayed in `America/Vancouver`. The
backend must store and compare unambiguous instants, derive the full FAD clock
at automatic opening, and must not rely on a browser clock.

The derived Candidate deadline and FAD rollover history cannot change after
Candidate Cards open. A manager or commissioner schedule edit that would move
that clock fails rather than retroactively shortening, extending, reopening,
or invalidating the FAD. The separate server-owned overrun recovery may move
competition Week 1 after FAD completion without rewriting any historical FAD
instant.

At the exact deadline:

* every Candidate Card locks;
* manager and commissioner card editing ends;
* help grants end;
* the participant and offer snapshot becomes immutable;
* every active league member gains read-only access to all league Candidate
  Cards;
* every card with an unresolved carried-roster structural conflict or an over-
  cap projection is published as illegal and all of its new offers are
  excluded;
* each individually valid offer on a conflict-free incomplete, cap-compliant
  card remains eligible;
* automatic allocation becomes due once.

---

## Ranking Order

Candidate Card allocation uses this order:

1. highest original total contract value;
2. if two or more top offers have the same total, highest AAV;
3. if the top offers have the same total and term, a restricted tie auction.

Because total is AAV multiplied by term, a shorter term produces the higher AAV
when totals are equal.

Examples:

```text
$8 total over 2 years defeats $7 total over 1 year.
$6 total over 2 years defeats $6 total over 3 years.
$6 total over 2 years ties another $6 total over 2 years.
```

A lower total never defeats a higher total because of AAV.

---

## One Team Requested the Player

When exactly one valid team requested an eligible player:

* that team wins the player;
* the exact proposed AAV and term create the contract;
* the backend calculates total contract value;
* the player is assigned to the requested Candidate Card position;
* the signing begins the approved 14-day free-agent signing buyout lock;
* ownership, contract, roster, result, and activity effects are saved
  atomically.

---

## Unique Highest Total

When multiple teams requested a player and one team offered the unique highest
total:

* that team wins the player;
* lower offers lose regardless of AAV or term;
* the winning team's exact proposed total and term create the contract;
* the player is assigned to the winning team's requested position;
* the signing begins the approved 14-day free-agent signing buyout lock;
* every offer and outcome remains in immutable FAD history.

---

## Highest AAV at an Equal Highest Total

When two or more teams share the highest valid total and one of those offers
has the unique highest AAV:

* the highest-AAV offer wins;
* the winning team's exact proposed total and term create the contract;
* all other equal-total and lower-total offers lose;
* no restricted tie auction is created.

For equal totals, this is equivalent to the shortest valid offered term
winning.

---

## Equal Highest Total and Term

When two or more teams share both the highest valid total and the same term:

* no team receives the player during automatic allocation;
* lower-total teams and lower-AAV equal-total teams are eliminated from that
  player's FAD competition;
* the backend creates one restricted tie auction;
* only the teams tied on both highest total and term are eligible participants;
* the Candidate Cards show the result as pending restricted auction.

The participant allowlist belongs to teams, not the current manager user IDs,
so an authorized manager-assignment change does not invalidate the team's
right to participate.

---

## Atomic and Idempotent Resolution

Each player's automatic allocation is atomic and idempotent.

A retry must not create:

* duplicate ownership;
* duplicate contracts;
* duplicate restricted auctions;
* duplicate activity;
* a second result.

Independent player allocations may complete separately so one malformed player
does not roll back every other valid league result. The overall FAD does not
advance past allocation until every player is resolved, explicitly invalid, or
placed into correction-required state.

A player with an unresolved or correction-required allocation record is
quarantined from open rapid auctions. The player becomes auction-eligible only
after the original FAD result reaches an explicit terminal state that permits
normal free agency.

The same quarantine applies to a player in any failed or unresolved FAD rapid
auction recovery, including an open rapid auction that has no Candidate
allocation record. FAD completion alone does not release that player into a
new rapid or ordinary weekly auction; an explicit terminal recovery,
no-winner cancellation, or correction must account for the original auction
first.

---

# Part 8 — Restricted Tie Auctions

## Participant Restriction

A restricted tie auction is available only to the teams tied on both the
highest Candidate Card total and contract term for that player.

Other managers and teams:

* may see the auction and its eligible teams after the Candidate Card deadline;
* may not create a bid;
* may not join;
* may not become eligible through a trade or manager change.

An authorized commissioner may administer the auction under the normal
commissioner auction rules but may submit a bid only on behalf of an eligible
team.

---

## Candidate Minimums and Active Improvements

Each tied team's Candidate Card offer becomes that team's system-created
restricted minimum. It preserves the original contract commitment but is not
an active leading bid and cannot win without manager action.

All Candidate minimums:

* are created at the same restricted-auction opening instant;
* retain a durable reference to the Candidate Card offer;
* remain valid minimums when the original Candidate Card contract is below
  the ordinary joining-team minimum;
* may not be withdrawn by the manager.

They create no auction bid, leader, edit count, or cooldown. No tied team
receives an auction-starter advantage.

A tied manager contends only by submitting an opening bid that is strictly
better than the Candidate minimum under the floor comparison: higher total, or
equal total with higher AAV. The improvement may change term or increase total
under valid contract rules, must satisfy the ordinary joining-team minimum for
the submitted term, and may never rank below the original tied contract. A
same-total lower-AAV longer term is below the floor. Once committed, the bid is
binding and cannot be withdrawn. It then receives the ordinary joining-team
allowance of one later manager edit and the ordinary 75-minute cooldown after
the opening bid and that edit.

A manager who takes no action has not withdrawn the Candidate commitment; the
Candidate contract remains the public minimum. It simply does not count as an active
contending bid.

The original Candidate minimum total and term remain visible on the locked Candidate
Cards. Blind-auction privacy applies to later bid edits and current edited
values; it does not make already revealed Candidate Card history secret again.

---

## Delayed Creation and Fair Rollover Assignment

A restricted tie auction created successfully during deadline allocation
targets the first rapid rollover, exactly 24 elapsed hours after the Candidate
Card deadline.

If delayed or retried deadline processing completes later, the system must not
backdate manager access or place the auction into a rollover that does not
provide the approved access period. When committed more than 60 minutes before
a rollover, it may open immediately for that rollover. When committed in the
final 60 minutes, it remains a private pending FAD path and opens
automatically at rollover for resolution at the following 24-hour rollover.

If that following rollover is beyond the current Week 1, FAD remains
incomplete and the server-owned schedule recovery advances competition Week 1
by whole Mondays. The restricted path is never deferred into an ordinary
weekly auction merely to preserve the old matchup date. Its participant
allowlist, minimums, Candidate Card history, and full opportunity remain
unchanged. A commissioner may retry the idempotent operation but may not
shorten the window, change participants, or select a winner manually.

---

## Reused Auction Rules

After the Candidate minimums are created, restricted tie auctions use the
ordinary Auction specification's:

* blind visibility for post-opening bid edits;
* AAV-first ranking;
* anti-bluff pricing;
* ordinary joining-team edit allowance after the opening improvement;
* ordinary 75-minute cooldown anchored to that team's auction bid activity;
* prohibition on manager withdrawal;
* contract precision;
* invalid-bid handling;
* atomic resolution;
* Active-roster assignment;
* illegality treatment;
* history and commissioner recovery.

Candidate Card allocation ranks total first and AAV second. A restricted tie
auction begins only after total and term are both equal, and it is a new blind
auction phase. The interface must explain that the tied contract is only the
minimum and that a team must actively improve once to contend.

Restricted-auction ranking is:

1. highest current AAV;
2. if tied, shortest current contract term;
3. if still tied, an auditable equal-chance draw among the remaining exactly
   tied teams.

The restricted-auction draw uses the shared FAD-only draw rule and replaces
the ordinary earliest-bid and stable-ID tie-breaks. The exact participant set,
randomness evidence, algorithm/version, and result are persisted before
assignment and become league-visible history after resolution.

Normal anti-bluff pricing is calculated first, but the restricted-auction
winner's final total may never be lower than that team's original tied
Candidate Card total. If necessary, the final total is raised to the smallest
term-valid amount that satisfies both the normal anti-bluff AAV and the
original tied-total floor.

At resolution, at least one tied team must have an eligible current active
strict improvement. An invalidated or commissioner-removed improvement does
not count merely because it was submitted earlier. If none remains, the
restricted auction closes without a winner and no equal-chance draw occurs.
The player immediately enters a new league-wide blind FAD auction with a fresh
24-hour period. The original tied contract remains the minimum, but no team
begins as leader and any normally authorized league team may submit a binding
bid. A fallback bid may equal the floor; across terms it may not have both the
same total and a lower AAV.

---

# Part 9 — Rapid-Auction Period

## Purpose

Automatic allocation will usually leave teams with empty positions because
they lost contested players or entered restricted tie auctions.

The Candidate Card deadline begins a complete seven-day rapid-auction period.
Queued final-hour nominations, restricted no-improvement fallbacks, or
recoverable processing may require additional daily cycles; matchups wait and
Week 1 moves by whole Mondays when those cycles overrun it.

It does not guarantee a full or legal roster.

---

## Auction Types

The rapid-auction period contains:

1. **open rapid auctions**, which any normally authorized league team may join;
2. **restricted tie auctions**, which only approved tied teams may join.

A player in an unresolved restricted tie auction or non-terminal automatic
allocation state cannot simultaneously enter an open rapid auction in the same
league.

All rapid auctions are blind. Managers see the player, rules, minimum,
participant eligibility, deadline, and only their own active bid. Open rapid
auctions reuse the ordinary Auction specification except for the preseason
schedule and FAD-only exact-tie draw defined here. They inherit ordinary
starter/non-starter edit limits, the 75-minute cooldown, and the prohibition
on manager withdrawal.

Simultaneous bids are independent and binding. Outstanding bids reserve no
cap, position capacity, or roster slot, and a team may win every auction it
entered even when the combined result makes its roster illegal. Every valid
winning contract takes effect; the manager legalizes afterward. Each bid,
edit, or queued nomination submission is the binding confirmation of that
possibility, and scheduled resolution never pauses for another prompt.

Every open or restricted rapid-auction contract belongs to the FAD's target
upcoming season, even though resolution occurs before the first matchup. Its
first contract year advances or expires only during the automatic rollover at
the scheduled start of the following Entry Draft.

---

## Daily Rollover

The first rapid-auction rollover occurs exactly `24 elapsed hours` after the
Candidate Card deadline.

Later rapid rollovers occur at exact `24 elapsed-hour` intervals. The seventh
initial rollover occurs at the Week 1 instant snapshotted when cards opened.
It is final only when no active, pending, fallback, recovery, or queued FAD
auction path remains. Required additional cycles continue at the same elapsed
interval while competition Week 1 is moved under the approved recovery rule.

Every auction created during an open rapid cycle belongs to the immediately
following rapid rollover.

The scheduler must use the persisted instants created at automatic opening and remain
safe across restart, delay, retry, and daylight-saving handling. A
daylight-saving transition may change the displayed local wall-clock hour; it
does not change an elapsed 24-hour interval.

---

## One-Hour Nomination Queue Boundary

A manager nomination committed during the final hour before rollover is
accepted privately and queued rather than rejected. The queued record contains
the player, nominating team, binding opening bid, submission evidence, and
following-cycle identity. It prevents duplicate nomination of that player
without exposing the nomination or bid to competitors.

The exact boundary is:

```text
More than 60 minutes before rollover: new auctions may start.
Exactly 60 minutes before rollover:   nomination is accepted into the queue.
Less than 60 minutes before rollover: nomination is accepted into the queue.
```

Existing auctions remain open for authorized bids and valid edits until the
rollover instant.

At rollover, each valid queued nomination opens atomically with the
nominator's binding opening bid and targets the following 24-hour rollover.
That bid is the starter's original bid and uses the ordinary starter edit
allowance, cooldown measured from its committed submission, and no-withdrawal
rule.

An open rapid auction that reaches resolution with no eligible bid closes
without a winner and returns the player to the unclaimed pool. The player may
be nominated again during FAD or through ordinary weekly auctions later.

---

## Ordinary Weekly Auction Exception

Ordinary weekly auctions remain closed during the playoffs and off-season.

The rapid-auction period is a specific approved preseason exception. It does
not reopen the ordinary Monday-through-Sunday weekly schedule early and does
not change ordinary weekly ranking or pricing.

At each rapid rollover:

* every due rapid auction resolves or enters an explicit recoverable state;
* valid queued nominations open for the following cycle;
* a restricted auction with no eligible current active improvement closes
  without a winner and creates its fresh league-wide 24-hour fallback auction;
* the FAD becomes complete only when every required operation is accounted for
  and no active, pending, fallback, recovery, or queued path remains.

---

## Incomplete Teams

Teams should use rapid auctions to fill vacancies, but the system does not
promise or fabricate a full roster.

A team that remains incomplete or illegal when the first matchup begins:

* may use ordinary weekly auctions after they open;
* receives the normal legality warnings;
* follows the approved matchup lock and late-baseline rules;
* does not itself delay the league or another team's matchup.

Unfinished FAD processing is different: matchups cannot begin until it
finishes. If FAD completion would occur at or after the current Week 1, the
same transaction moves competition to the first valid league-local Monday
strictly after the proposed completion instant before it commits FAD
completion.

---

# Part 10 — Completion and Season Boundary

## Meaning of FAD Completion

FAD completion is not the Candidate Card deadline.

The FAD becomes complete only after:

* every Candidate Card is locked;
* every automatic allocation is resolved or explicitly accounted for;
* every restricted tie path has a terminal auction or an explicit recoverable
  FAD allocation state;
* the initial seven-day rapid period has run;
* no rapid auction remains active;
* no private queued nomination, restricted no-improvement fallback, pending
  activation, or non-terminal recovery remains;
* required result and operational records exist.

The completion timestamp controls the transition to ordinary weekly auctions
and the server-owned Week 1 overrun check. When completion would be at or
after the current Week 1, one atomic transition moves competition to the first
otherwise-valid league-local Monday strictly after the proposed completion
instant, fixes the NHL and playoff endings, removes early regular-season
weeks, fairly regenerates the remainder and replaces future jobs, then marks
the FAD complete. A matchup-start job can therefore observe neither a
completed FAD with stale Week 1 nor a moved schedule with incomplete
completion evidence.

---

## Ordinary Weekly Auctions

After the new season has started and the FAD is complete, ordinary weekly
auctions operate under `AUCTIONS.md`.

Managers may use those auctions to fill remaining vacancies throughout the
season.

The FAD does not replace the weekly auction system.

---

## Matchup Boundary

FAD assignments and rapid-auction wins affect the normal roster. Each committed
assignment or win is therefore a registered roster mutation and enters the
shared post-commit late-lock coordinator batch for its affected team. Delayed
late-lock evidence never repeats or reverses the FAD result.

The Matchups specification remains authoritative for:

* first-week baseline;
* first-week roster lock;
* legality;
* late lock;
* scoring eligibility.

No Candidate Card or FAD result is itself a matchup roster snapshot.

---

# Part 11 — User Interface and Navigation

## Dedicated FAD Area

The FAD should have a dedicated league-scoped area rather than being embedded
inside the normal roster screen.

The area includes:

* league status and countdown;
* the manager's Candidate Card while private;
* commissioner help status where authorized;
* league-wide read-only cards after the deadline;
* automatic allocation results;
* restricted tie auctions;
* open rapid auctions;
* next rollover;
* completion and historical access.

---

## Main Navigation

From Candidate Card opening through the final rapid-auction period, the main
application dropdown shows **Free Agent Draft**.

The link:

* opens the manager's own card by default before the deadline;
* opens the league results hub after the deadline;
* remains visible through the rapid-auction period;
* leaves the main dropdown at the first-matchup start.

The active link should expose concise urgency such as deadline, incomplete
state, help request, tie auction, or next rollover without revealing another
team's private choices.

If operational recovery remains required after season start, managers use the
roster's historical FAD link for read-only status and commissioners use the
approved recovery controls. A recovery state does not keep the summer workflow
in the main navigation.

---

## Roster Navigation

The normal roster page provides contextual access:

* before opening: **Next season's Candidate Card opens when preseason FAD
  setup is complete**;
* while open: **Build next season's roster**;
* after the deadline and during the season: **View this season's Candidate
  Card**.

The in-season link opens the finalized historical read-only card for the viewed
team.

This preserves discoverability without keeping an inactive seasonal workflow
in the main navigation.

---

## Candidate Card Presentation

The Candidate Card uses one compact vertical form with exactly:

```text
12 Forward rows
 6 Defence rows
 4 Bench rows
```

Each row presents four primary fields in columns: player name, proposed AAV,
term, and calculated total contract value. Player name uses the approved
eligible-player autocomplete. Total is read-only and remains empty until AAV
and term are both present.
One Save control appears at the top of the card and saves every changed
editable row together. A manager may leave any editable row empty and may save
a selected player while cost, term, or both remain empty.

The Candidate Card must clearly distinguish:

* locked carryover players;
* editable free-agent candidates;
* mandatory and optional positions;
* entered AAV;
* term;
* calculated total contract value;
* total Active AAV and authoritative projected cap use;
* validation;
* maximum possible cap use;
* missing positions;
* help availability;
* time remaining.

Colour alone must not communicate locked, invalid, incomplete, winning, losing,
or tied state.

All entry, movement, contract, help, and auction actions require labeled,
keyboard-accessible controls.

---

## Post-Deadline Results

Every league Candidate Card becomes read-only at the deadline.

The result view must make it possible to understand:

* what each team requested;
* what each team carried;
* each proposed contract;
* which team won each player;
* whether total value or the equal-total AAV comparison decided the result;
* which players entered restricted tie auctions;
* which positions remain empty;
* final contracts after automatic or auction resolution.

The published card preserves incomplete saved rows as non-participating
historical requests. They must be visibly identified as incomplete and not
won; they must not be rewritten as valid offers or silently removed from what
the team saved.

The original card must not be rewritten to look as though the manager requested
only the players eventually won.

---

# Part 12 — Activity, Audit, Notifications, and Presentation

## Private Revision History

Pre-deadline Candidate Card edits remain private competitive information.

The backend must preserve enough private revision history to:

* resolve stale writes;
* identify commissioner edits;
* investigate failure or abuse;
* recover the deadline snapshot.

Normal manager edits do not create public League Activity before the deadline.

---

## League Activity and FAD History

Automatic allocations and auction results create durable authenticated league
history.

History must identify:

* league and season;
* FAD;
* player;
* participating teams;
* Candidate Card totals and terms;
* total-first and AAV-second comparison outcome;
* automatic, tied, auction, invalid, or corrected outcome;
* winning contract;
* owning team;
* timestamp;
* actor or system operation;
* resulting general illegality flag when applicable.

Commissioner Candidate Card edits remain attributable after the card becomes
visible.

---

## Notifications

Required low-noise in-app notifications include:

* Candidate Cards opened;
* approaching Candidate Card deadline;
* commissioner help requested;
* Candidate Cards locked and results available;
* a team's automatic wins and losses;
* restricted tie-auction eligibility;
* rapid-auction result;
* commissioner-actionable correction-required state;
* FAD completion.

Notifications must not reveal private Candidate Card content before the
deadline.

---

## League Presentation Video

The FAD video is one short, league-specific, AI-generated presentation created
after initial Candidate Card allocation as quickly as safely possible.

The video may:

* highlight notable player assignments;
* highlight large contracts;
* identify heavily contested players;
* identify restricted tie auctions;
* use approved league and team names, logos, colours, and branding;
* welcome the league and wish every manager a good and fair fantasy-hockey
  season.

The video:

* is optional for Season 2;
* is a required product component beginning in Season 3;
* is generated only from authoritative finalized FAD records;
* is presentation only;
* cannot calculate, alter, delay, or become authoritative for any FAD result;
* cannot block Candidate Card publication, auction opening, FAD completion, or
  season start;
* must fail safely when generation or playback is unavailable.

Exact generation, disclosure, accessibility, storage, playback, cost, and
retention requirements require a later approved technical and presentation
design.

---

# Part 13 — Commissioner Controls and Recovery

## Operational Controls

The commissioner may:

* review non-sensitive league completion state before the deadline;
* respond to help requests;
* edit a requesting team's card before the deadline;
* view every card after the deadline;
* retry a due automatic-allocation operation;
* administer rapid auctions under the Auction specification;
* inspect correction-required operational state;
* perform an approved explicit correction.

The commissioner may not:

* use commissioner authority to browse another team's private card without a
  help grant;
* extend one team's deadline;
* unlock one card after the deadline;
* select an automatic winner manually when valid offers can be resolved by the
  approved rules;
* add a non-tied team to a restricted tie auction;
* silently rewrite original Candidate Card history.

---

## Recovery

If deadline processing fails:

* the immutable deadline snapshot remains authoritative;
* no card reopens automatically;
* successful atomic player results remain idempotent;
* failed players or auctions enter explicit recoverable state;
* the commissioner may retry the same operation;
* FAD completion remains blocked until every required operation is accounted
  for.

A completed incorrect result may be changed only by an explicit atomic
correction that reconciles:

* Candidate Card result;
* auction where applicable;
* ownership;
* contract;
* roster;
* cap;
* activity and audit history.

The original result remains visible.

---

## League Freeze

A league freeze blocks manager Candidate Card and auction writes.

Already due deadline locking, automatic allocation, and scheduled rapid
resolution continue because they complete previously authorized league work.

Commissioner help and recovery actions remain available subject to their normal
authorization and audit rules.

---

# Part 14 — Validation and Failure Behavior

## Required Validation

The backend must validate:

* authenticated actor;
* league membership and team assignment;
* commissioner help grant where applicable;
* league and season;
* FAD phase and deadline;
* stable team and player IDs;
* active team participation;
* card version;
* slot compatibility;
* carryover lock;
* free-agent eligibility;
* duplicate candidate use on one card;
* contract value, precision, term, and AAV;
* Bench eligibility;
* restricted-auction team allowlist;
* auction cutoff and rollover;
* ownership again at allocation and auction resolution.

Client-supplied team, role, time, winner, access, or FAD status is not
authoritative.

---

## Failure Behavior

A failed action must:

* return a safe clear error;
* avoid partial state;
* preserve the latest valid card or result;
* avoid revealing another private Candidate Card;
* avoid granting commissioner access accidentally;
* avoid creating duplicate ownership, contract, auction, result, or activity;
* identify refresh or retry requirements where safe.

A read-only Candidate Card, result, or auction request must remain read-only.
It must not lock a card, allocate a player, grant help, resolve an auction, or
repair state as a hidden side effect.

---

# Part 15 — Required Testing

## Lifecycle and Clock Tests

Required tests include:

* inaugural-league opening without a fabricated Entry Draft;
* original-league Season 2 transition without a fabricated Entry Draft;
* the future final T-108 selection or confirmed-forfeiture transaction making
  the last pick terminal, marking the Entry Draft complete, and committing the
  `entry_draft_completed` readiness handoff atomically;
* handoff failure rolling back the terminal pick action and completion, while a
  later blocked readiness worker leaves the completed draft intact and opens no
  card;
* automatic continuing-league opening by the later readiness worker only after
  scheduled-start rollover and every FAD prerequisite pass;
* absence of a standalone/manual Entry Draft completion or FAD-opening route;
* ordinary-inaugural T-036 and initial-Season-2 T-037 creating only their owned
  exact no-draft triggers, reset-origin T-036 creating none, and T-095 only
  requeueing the same blocked inaugural occurrence after confirmed schedule
  creation;
* team addition before Entry Draft setup confirmation and rejection afterward;
* no-draft team addition only before automatic opening readiness succeeds;
* post-draft team erasure or deactivation only before automatic opening;
* all cards opening simultaneously without commissioner confirmation when
  readiness passes, and no card opening when any prerequisite fails;
* required persisted first-matchup start;
* two different commissioner- or administrator-selected first-matchup starts
  deriving two different FAD clocks without a fixed annual default;
* card opening with more than, exactly, and less than 48 hours remaining;
* help beginning at opening when less than 48 hours remain;
* participating-team and first-matchup-start freeze at card opening;
* rejection of a schedule edit that would move the frozen FAD clock;
* normal exact 48-hour help boundary;
* exact 168-hour Candidate Card deadline;
* deadline derived from the persisted first matchup;
* seven exact initial 24-hour rapid rollovers;
* extra daily cycles created by queued nominations or restricted fallback;
* exact one-hour nomination queue boundary;
* bidding remaining open during the last hour;
* one- and multi-Monday Week 1 advance after a late Entry Draft;
* FAD completion before Week 1 and at/after Week 1;
* overrun movement to the first valid Monday strictly after completion;
* simultaneous FAD-completion and matchup-start attempts proving that schedule
  recovery, future-job replacement, and the completed FAD gate commit
  atomically and the losing attempt revalidates without partial effects;
* fixed NHL regular-season ending and playoff weeks plus fair regeneration of
  the shortened regular-season schedule;
* incomplete or illegal rosters not moving Week 1;
* ordinary weekly auction transition;
* controlled-clock and daylight-saving behavior.

---

## Candidate Card and Carryover Tests

Required tests include:

* empty league-creation baseline and no inaugural prior-season carryovers;
* inaugural pre-open or open-card prospect movement projecting normally;
* 12 F, 6 D, and 4 Bench structure;
* mandatory and optional completeness;
* Active, Bench, and Injured Reserve multi-year contract carryover;
* expired contract exclusion;
* carried contract immutability;
* eligible carryover rearrangement between compatible Active and
  position-neutral Bench slots;
* Bench cap exemption and `$4 AAV` limit;
* IR projection without a hidden roster move or extra Candidate position;
* Prospect separation;
* Prospect-to-Active, Prospect-to-Bench, and Prospect-to-IR movement before the
  deadline;
* both `fantasy_elc_declined` and `unsigned_prospect_rights_released` events
  excluding the player from Candidate search, save, and deadline eligibility;
* a later confirmed same-league, same-player `rights_release_reentry` row tied
  to the exact release event clearing only that event;
* draft, superseded, same-time, wrong-player, wrong-league, and wrong-event
  re-entry evidence failing to clear the release block;
* unowned status and roster absence failing to clear a release block;
* a later release event blocking the player again despite valid evidence for
  an earlier release;
* summer trade, buyout, prospect-signing, and correction projection;
* overflow or structural conflict;
* duplicate same-team candidate rejection;
* stale card update rejection;
* complete-card cap calculation;
* carried-roster-conflicted or over-cap card locking with every new offer
  excluded, every carryover preserved, a published explanation, and no
  arbitrary subset selection;
* candidate-only conflict exclusion without disqualifying other valid offers;
* no post-deadline cap repair;
* incomplete cap-compliant card locking with individually valid offers
  participating and no invented players.

---

## Privacy and Permission Tests

Required tests include:

* manager access to the assigned card;
* commissioner access to an own managed-team card through the manager role;
* manager denial against another private card;
* commissioner denial before help request;
* help request grant for exactly one card;
* commissioner view and edit after the request;
* commissioner actor attribution;
* help-grant expiry at the deadline;
* platform-administrator membership and scoped authority;
* league isolation;
* post-deadline league-wide read-only visibility;
* public denial;
* no private information in notifications or errors.

---

## Allocation Tests

Required tests include:

* sole candidate wins;
* highest total wins;
* higher total defeating higher AAV;
* same total with a shorter term and higher AAV winning;
* same total and same term producing a restricted tie;
* lower offers excluded from a restricted tie auction;
* exact winning contract creation;
* 14-day automatic-FAD-signing buyout lock;
* requested-position assignment;
* every new offer on a carried-roster-conflicted or over-cap card excluded
  while carryovers remain;
* a candidate-only conflict excluded individually while other valid offers
  remain eligible;
* individually valid offers on a conflict-free incomplete cap-compliant card
  participating;
* ownership conflict;
* invalid candidate at deadline;
* concurrent allocation;
* retry without duplicate effects;
* independent player failure containment.

---

## Rapid-Auction Tests

Required tests include:

* open rapid-auction participation;
* restricted participant enforcement;
* tied Candidate contracts acting as minimums rather than active bids or
  leaders;
* no cooldown before a participant's opening improvement, followed by the
  ordinary 75-minute bid-activity cooldown;
* public original Candidate minimum values with private later bids/edits;
* Candidate-minimum admission below the ordinary joining minimum and normal
  minimum enforcement on the opening improvement;
* ordinary joining-team one-edit allowance after every tied team's opening
  improvement;
* open-auction starter/non-starter edit limits, 75-minute cooldown, and
  manager-withdrawal rejection;
* no decrease below tied total;
* no eligible current active improvement producing no restricted winner or
  random draw and opening a fresh league-wide 24-hour auction with no leader,
  including an improvement later invalidated or commissioner-removed;
* one or more active improvements producing restricted ranking;
* cross-term floor checks: higher total, equal-total higher/equal AAV, and
  same-total lower-AAV rejection;
* exact top ties in both restricted and open FAD auctions using one auditable
  equal-chance draw with stable replay;
* restricted final-price floor at the original tied Candidate total;
* one player not entering open, restricted, and correction-required paths
  simultaneously;
* rapid-auction contracts belonging to the FAD target season;
* daily resolution;
* private final-hour nomination acceptance and queueing;
* queued nomination opening at rollover with the nominator's binding starter
  bid and following-rollover resolution;
* delayed restricted activation receiving a full fair cycle even when it
  extends FAD and moves Week 1;
* existing bids and edits until rollover;
* open rapid auction with no bid returning the player to the unclaimed pool
  and allowing later renomination;
* simultaneous independent bids, no cap/slot reservation, and a team winning
  every entered auction even when the roster becomes illegal;
* binding confirmation at bid/edit/queued-nomination submission and scheduled
  resolution without a second prompt;
* ordinary auction contract and roster behavior;
* no-winner and correction-required handling;
* completion only after active, pending, fallback, recovery, and queued paths
  are all terminal.

---

## User Interface and Presentation Tests

Required tests include:

* active main-navigation visibility;
* inactive main-navigation removal;
* roster contextual links;
* private and post-deadline views;
* carryover and selectable-entry distinction;
* keyboard-accessible editing and help;
* narrow-layout and table overflow handling;
* countdown and status clarity;
* read-only historical card fidelity;
* presentation-video failure never delaying authoritative FAD behavior.
* all FAD player search, card, allocation, and auction workflows succeeding
  from the persisted catalogue with no current-season statistics and no live-
  statistics provider configured, while any retained prior-season rows have no
  effect on FAD behavior.

---

# Part 16 — Approval Checklist

## Approved Annual Model

- [x] Every league runs one FAD before every season.
- [x] Inaugural teams have empty normal rosters at league creation and no prior-season carryovers; later approved prospect moves still project normally.
- [x] Continuing teams carry Active, Bench, and IR multi-year contracts into locked Candidate Card positions or projections.
- [x] Scheduled Entry Draft-start rollover must succeed before the Entry Draft opens or Candidate Cards can follow.
- [x] The future final T-108 selection or confirmed-forfeiture transaction atomically records the `entry_draft_completed` readiness handoff; its later worker opens every Candidate Card together when all prerequisites pass, while a failed readiness check opens none.
- [x] There is no standalone/manual Entry Draft completion or FAD-opening endpoint; FAD-08 provides only the internal transaction-bound handoff primitive while the complete Entry Draft remains M8-deferred.
- [x] Ordinary-inaugural T-036 owns `no_draft_inaugural`; reset-origin T-036 creates no handoff; T-037 owns `no_draft_initial_season2`; and T-095 may only requeue the same blocked inaugural occurrence after confirmed schedule creation.
- [x] A legitimate no-draft transition covers an inaugural league and the original league's initial Season 2 transition.
- [x] In a draft season, normal team addition closes at Entry Draft setup confirmation; on a no-draft path it closes when automatic opening readiness succeeds.
- [x] Team erasure and deactivation use the separate post-draft or no-draft, pre-opening window and block all cards until finalized.
- [x] Automatic opening snapshots and freezes participating teams and the historical FAD clock.
- [x] An authorized commissioner or administrator chooses the first-matchup start; the system has no fixed annual FAD or league-season start date.
- [x] Late Entry Draft completion advances Week 1 by whole Mondays until the derived Candidate deadline is future-facing and the full seven-day FAD period fits.
- [x] The Candidate Card deadline is exactly 168 elapsed hours before the Week 1 snapshotted at opening.
- [x] Unfinished FAD processing delays competition; required Week 1 movement, remaining-schedule/job regeneration, and durable FAD completion commit atomically before matchup start can proceed.
- [x] Incomplete or illegal rosters do not delay Week 1.
- [x] The FAD completes only when every active, pending, fallback, recovery, and queued auction path is terminal.

## Approved Candidate Card Rules

- [x] Candidate Card is the approved term and is distinct from a roster player card.
- [x] Every card has 12 mandatory F, 6 mandatory D, and 4 optional Bench positions.
- [x] Managers may edit selectable entries until the deadline.
- [x] Managers cannot remove or recontract carried players through the card.
- [x] Eligible carryovers may be rearranged between compatible Active and position-neutral Bench slots without changing ownership or contract.
- [x] Bench is cap-exempt and limited to `$4 AAV`.
- [x] A contracted IR player reserves a Candidate position without a hidden roster move.
- [x] Each `fantasy_elc_declined` or `unsigned_prospect_rights_released` event blocks Candidate eligibility until a later confirmed same-league, same-player `rights_release_reentry` row references that exact event; unowned status or roster absence alone never clears it, and every later release blocks again.
- [x] Candidate eligibility and FAD operation require catalogue identity,
      position, ownership, contract, and eligibility evidence only; player
      statistics and live-provider capability are not inputs or gates.
- [x] The complete Candidate Card must have no unresolved carried-roster structural conflict and must be cap compliant.
- [x] A carried-roster-conflicted or over-cap card locks as illegal, excludes every new offer, preserves every carryover, publishes the reason, and receives no post-deadline repair.
- [x] Managers cannot view another team's card before the deadline.
- [x] All league cards become read-only to league members at the deadline.
- [x] Conflict-free incomplete, cap-compliant cards lock and individually valid entries still resolve; a candidate-only conflict is excluded individually.

## Approved Help Rules

- [x] The help button appears during the final 48 hours or throughout the entire remaining period when cards open later.
- [x] A help request grants the commissioner view and edit access to that team's card.
- [x] The grant applies only to the requesting card and ends at the deadline.
- [x] Manager and commissioner edits use the same validation.
- [x] Commissioner edits identify the commissioner and preserve audit history.
- [x] Help does not extend the deadline.

## Approved Allocation Rules

- [x] Candidate allocation ranks highest total first and highest AAV second.
- [x] A sole or unique highest valid offer wins with its exact total and term.
- [x] An automatic FAD signing begins the approved 14-day free-agent signing buyout lock.
- [x] Equal highest totals are resolved by highest AAV.
- [x] Only offers tied on both highest total and term create a restricted tie auction.
- [x] Only the exact top-tied teams may bid in that restricted auction.
- [x] Lower-total teams are excluded.
- [x] Automatic allocation is atomic, idempotent, and backend-authoritative.

## Approved Rapid-Auction Rules

- [x] Rapid auctions resolve every 24 hours for the full initial seven-day period and any additional required FAD cycles before competition begins.
- [x] Open rapid auctions are available to normally authorized league teams.
- [x] Restricted tie auctions are available only to teams tied on both highest total and term.
- [x] Tied Candidate offers create equal-status minimums rather than bids or active leaders; a team's first strict improvement is its opening bid and then receives the ordinary joining-team edit allowance.
- [x] A valid tied Candidate minimum may sit below the ordinary joining minimum, but an active improvement must meet that minimum.
- [x] Original Candidate minimum values remain public through locked cards while later auction bids and edits remain blind.
- [x] At least one tied team must have an eligible current active strict improvement at resolution; if improvements are absent, invalid, or commissioner-removed, no draw occurs and the player enters a fresh league-wide 24-hour auction with no leader.
- [x] The tied floor applies across terms by total first and AAV second; restricted improvements must rank strictly above it and fallback bids may equal it.
- [x] Exact top ties in open and restricted FAD auctions use one auditable equal-chance draw; ordinary weekly tie rules remain unchanged.
- [x] Restricted anti-bluff pricing cannot reduce the final total below the original tied Candidate total.
- [x] Correction-required players remain quarantined from open rapid auctions.
- [x] Players in failed or unresolved FAD auction recovery remain quarantined from both rapid and ordinary weekly auctions until an explicit terminal recovery accounts for the original auction.
- [x] Rapid-auction contracts belong to the FAD target season.
- [x] Open FAD auctions inherit ordinary starter/non-starter edit limits, the 75-minute cooldown, and no manager withdrawal.
- [x] A restricted Candidate minimum creates no bid or cooldown; the participant's strict opening improvement then receives the ordinary joining-team edit allowance, 75-minute bid-activity cooldown, and no manager withdrawal.
- [x] A final-hour nomination is accepted privately and queued, opens at rollover with the nominator's binding bid, and resolves at the following rollover.
- [x] A delayed restricted tie auction receives a full fair cycle even when FAD must extend and Week 1 must move.
- [x] Existing bids and valid edits remain open until rollover.
- [x] Open auctions with no bid close without a winner, return the player to the unclaimed pool, and allow later renomination.
- [x] Bid/edit/queued-nomination submission is the binding illegality confirmation; scheduled resolution never waits for a second prompt.
- [x] Outstanding bids reserve no cap or roster capacity, and every valid winning contract takes effect even when the team becomes illegal.
- [x] Rapid auctions are an explicit exception to ordinary offseason weekly-auction closure.
- [x] Remaining vacancies may be filled through ordinary weekly auctions after FAD completion.

## Approved Navigation and Presentation

- [x] The FAD has a dedicated league area.
- [x] Main navigation shows FAD only while the seasonal workflow is active.
- [x] The roster page links to active preparation or historical Candidate Cards.
- [x] The original locked card remains visible rather than being rewritten to show only winners.
- [x] A league-specific FAD video is optional for Season 2.
- [x] A short, league-specific AI-generated FAD video is required beginning in Season 3.
- [x] Presentation generation can never alter or delay authoritative FAD results.

## Approval

- [x] Grae approved this document as the Hundo Leago Free Agent Draft product specification.
- [x] Document status is `APPROVED`.
- [x] The related technical specification is approved; no implementation is authorized without a separate approved work plan.

---

# Definition of Done

The FAD product is complete only when:

* the approved related technical specification remains current;
* Candidate Cards open from the correct annual lifecycle gate;
* carryovers are complete and immutable;
* privacy and help-grant rules are enforced by the backend;
* the deadline snapshot and automatic allocation are deterministic and
  retry-safe;
* restricted tie auctions and open rapid auctions use the approved rules;
* the daily clock and one-hour cutoff are verified;
* completion safely transitions to ordinary weekly auctions;
* authoritative ownership, contract, roster, cap, history, and notification
  effects reconcile;
* manager, commissioner, league-isolation, accessibility, and recovery tests
  pass;
* manual QA confirms the complete annual workflow;
* presentation generation, when enabled, cannot affect authoritative results.

---

# Related Documents

```text
docs/README.md
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
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/03-product-specs/MATCHUPS.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/FREE_AGENT_DRAFT.md
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/05-roadmap/FUTURE_BACKLOG.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/07-testing/RELEASE_CHECKLIST.md
```
