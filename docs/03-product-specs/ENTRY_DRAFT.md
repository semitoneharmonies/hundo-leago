# Hundo Leago - Entry Draft

## Document Status

`APPROVED`

This product specification consolidates:

* approved rules for prospect rights, prospect rosters, fantasy ELCs, traded draft picks, and trading windows;
* approved manager, commissioner, and league-isolation permissions;
* current implementation limitations;
* the approved Entry Draft workflow;
* the approved deferral of Entry Draft implementation until during the season.

Grae approved this specification on 2026-07-18.

The initial Season 2 launch does not include the Entry Draft. Development may occur during the season, but the complete approved system, including the lottery, automatic best-player selection, and private queues, must be ready before the season's Entry Draft is used.

---

## Product Purpose

Hundo Leago needs a league- and season-scoped Entry Draft that assigns eligible player rights to teams while preserving traded-pick ownership and a complete draft history.

This specification defines:

* draft setup, order, rounds, and timing;
* draft-pick identity and ownership;
* player eligibility;
* live selections, timeout selections, pauses, immutable picks, and technical recovery;
* the effect of a selection on prospect rights;
* manager and commissioner controls;
* draft visibility, activity, failure handling, and testing.

The draft must never rely on display names or mutable frontend state to determine who owns a pick or player right.

---

## Out of Scope

This document does not define:

* the preseason Free Agent Draft planned for a future update;
* normal free-agent auctions;
* automatic detection or enforcement of real-life ELC signings;
* NHL amateur-draft rules;
* a player-statistics import contract;
* exact database tables;
* exact API routes or payloads;
* public draft access;
* automatic draft-pick trading inside a selection request.

---

# Part 1 - Product Authority

## Source Documents

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/STANDINGS.md
```

Approved shared rules remain authoritative.

---

## Existing Behaviour Is Not the Target Model

The current frontend repository does not contain a complete Entry Draft product workflow.

Existing player, team, roster, and commissioner code may inform implementation, but it must not be treated as proof that draft order, pick ownership, eligibility, or permissions are approved.

---

## Backend Authority and Isolation

The backend is authoritative for:

* league and season identity;
* draft identity and status;
* draft configuration and order;
* stable pick identity, original team, current owner, and use state;
* player eligibility and ownership;
* the current pick and clock;
* completed immutable selections and technical recovery state;
* prospect-right ownership;
* draft history.

Every draft read and write must be scoped to one league and season.

---

# Part 2 - Inherited Approved Rules

## Prospect Rights

An Entry Draft selection creates prospect rights for the selecting team.

The selected player:

* enters that team's unlimited Prospect roster;
* has no salary merely because the player was drafted;
* does not affect the salary cap;
* remains a prospect if the rights are later traded from one Prospect roster to another.

Only an Entry Draft selection or a trade of existing prospect rights may place a player in a Prospect roster.

---

## Fantasy ELC

When an eligible prospect is manually signed to a fantasy ELC, the contract is:

```text
Total value: $3
Term: 3 years
AAV: $1 per year
```

A signed fantasy ELC player may remain in the Prospect roster without the salary affecting the cap.

After that player moves to Active, Bench, or Injured Reserve, the player may not return to the Prospect roster.

Automatic detection or enforcement of the real-life ELC signing trigger is deferred.

---

## Released Rights

Declining a fantasy ELC or voluntarily releasing unsigned prospect rights makes the rights unowned.

The player:

* may re-enter an Entry Draft only if the player was drafted in the immediately preceding Hundo Leago Entry Draft;
* may not enter a normal free-agent auction unless a later approved specification permits it.

---

## Draft Picks as Assets

Draft picks are tradeable assets.

Each pick must preserve:

* stable pick ID;
* league and draft identity;
* season;
* round and position;
* original team;
* current owning team;
* complete ownership history;
* unused, used, or forfeited state;
* the selection created when used.

An unused pick may be traded repeatedly, including while its Entry Draft is in progress, until the pick is used.

---

## Trading Window

Trading opens at the start of the Entry Draft.

It remains open until the commissioner-configured trade deadline and reopens at the start of the next Entry Draft.

Trade proposals and accepted trades continue to follow the Trades specification.

---

## Contract Rollover

Contract years advance and expiring contracts end during the end-of-season rollover before the next Entry Draft.

The Entry Draft does not itself expire contracts.

An expired player is immediately removed from the roster and becomes a free agent without an exclusive re-signing opportunity.

---

# Part 3 - Actors and Visibility

## Authenticated League Member

Every authenticated active league member may view the draft setup, live draft board, completed selections, and draft history for that league.

---

## Team Manager

A manager may:

* view the full league draft;
* make a selection only for a team the manager is actively assigned to control;
* view the team's current and future picks;
* use the normal Trades workflow to trade unused picks;
* manage a persistent private player queue.

A manager may not:

* select for another team;
* change draft configuration;
* reveal another manager's private queue;
* edit completed selections;
* reuse a spent pick.

---

## Commissioner

A commissioner may:

* configure the assigned league's draft;
* make a selection for any team in that league;
* start, pause, resume, and complete the draft;
* manage the lottery and pick order before the draft begins;
* manage pick ownership only through the approved setup, trade, or pre-draft correction workflow;
* recover a technical failure without changing a completed selection.

Every commissioner write must identify the commissioner as the actor.

---

## Platform Administrator

A platform administrator with an active league membership may perform approved commissioner actions without taking the commissioner role.

Platform authority does not permit hidden cross-league changes.

---

## Public Viewer

The Entry Draft is not public.

Unauthenticated visitors may not view the board, order, picks, queues, or history.

---

# Part 4 - Draft Lifecycle

## Statuses

The draft statuses are:

* `Setup`;
* `Scheduled`;
* `Live`;
* `Paused`;
* `Complete`;
* `Correction Required`;
* `Cancelled`.

The backend stores the status explicitly and does not infer it only from the clock.

---

## Off-Season Order

The approved sequence is:

1. the Hundo Leago season ends;
2. official results and standings are finalized;
3. end-of-season rollover advances contracts and expires eligible contracts;
4. draft-order inputs are finalized;
5. the commissioner reviews and confirms the Entry Draft;
6. the Entry Draft starts and trading reopens;
7. the draft completes;
8. the approved team-erase window remains available until the future Free Agent Draft;
9. preseason preparation continues.

## Setup

The setup workflow is:

1. The backend creates the draft for one league and season.
2. The system creates every pick from the approved team and round structure.
3. Existing traded ownership is applied to each stable pick.
4. The commissioner reviews the order, owners, eligible-player pool, date, time, and pick clock.
5. The system reports missing teams, duplicate positions, invalid owners, spent picks, and unavailable players.
6. The commissioner confirms the complete setup.
7. The draft becomes `Scheduled`.

Setup must save atomically.

---

## Draft Date and Time

The commissioner sets the Entry Draft date and start time in `America/Vancouver`.

The system shows the local league time and an unambiguous timezone label.

Changing a scheduled time requires explicit confirmation and an in-app league notification.

---

# Part 5 - Order, Lottery, and Pick Creation

## Draft Order

The draft order is determined as follows:

* the Hundo Leago playoff champion selects last;
* the team that loses the Hundo Leago Final selects second-last;
* all other teams are initially ordered by reverse official regular-season standings;
* the approved lottery results are then applied to the eligible order positions.

The Entry Draft is not required for the initial Season 2 launch. The lottery may be developed during the season, but the initial season's Entry Draft still uses the lottery.

## Lottery Participants

Every active team except:

* the Hundo Leago playoff champion; and
* the team that lost the Hundo Leago Final

participates in the lottery.

The champion's original pick remains last. The losing finalist's original pick remains second-last.

Lottery position belongs to the original team's pick. If that pick was traded, the current pick owner receives the resulting selection position.

---

## Lottery Weights

Lottery teams are ordered by reverse official regular-season standings.

For `N` participating teams, weights are assigned:

```text
worst-ranked lottery team: N
next team:                 N - 1
...
best-ranked lottery team: 1
```

Each team's probability is its weight divided by the sum of all participant weights.

For four lottery teams, the weights produce:

```text
40% / 30% / 20% / 10%
```

Official standings order resolves tied regular-season records before weights are assigned.

---

## Lottery Draws and Movement

The system conducts two weighted draws without replacement:

1. the first draw receives the first overall pick;
2. the first winner is removed;
3. the second draw receives the second overall pick;
4. every undrawn lottery team fills the remaining positions in its original reverse-standings order;
5. the losing finalist and champion remain second-last and last.

Any participating team may move to first or second overall. There is no additional upward-movement limit.

An undrawn team can move down by no more than two positions.

The resulting order is used unchanged in all four linear rounds.

---

## Lottery Execution

The commissioner previews the participants, official source order, weights, current pick owners, and algorithm version, then explicitly starts the lottery.

The backend:

* uses a cryptographically secure random draw;
* records the random draw inputs needed for audit;
* saves both selections and the complete final order atomically;
* records one immutable lottery result;
* publishes the approved League Activity event and in-app notification only after commit.

A committed lottery cannot be rerun, undone, or manually reordered.

If the operation fails before commit, no official result exists and the commissioner may safely retry.

---

## Format

The draft:

* has four rounds;
* uses the same order in every round;
* is linear rather than snake.

---

## Future Picks

The system creates picks for:

* the upcoming Entry Draft;
* the following three Entry Drafts.

This allows each team to own and trade picks in the current draft and the following three drafts.

---

## Team Changes

The complete draft field is frozen when setup is confirmed.

No team may be added to or removed from the draft after it becomes `Scheduled`.

An exceptional team problem requires an explicit commissioner correction and must not silently renumber historical picks.

---

# Part 6 - Player Eligibility

## Eligible Pool

The eligible pool contains players who:

* exist in the canonical player database with a stable player ID;
* were selected in the most recently completed real NHL Entry Draft before Hundo Leago draft setup; or
* qualify for the approved one-year Hundo Leago rights-release re-entry;
* are not currently owned by any team in the league;
* are not already selected in the same draft;
* are not under an active Hundo Leago contract in that league;
* are not blocked by a rights-release rule;
* normalize to F or D;
* are not goalies.

A player is not Entry Draft eligible merely because the player is young, unsigned, described as a prospect, or was selected in an older NHL Entry Draft.

Signing a real-life ELC before the Hundo Leago Entry Draft does not by itself make an otherwise eligible newly drafted player ineligible.

The canonical imported NHL draft result is the normal eligibility source. Missing or conflicting source identity must be corrected before the draft setup is confirmed.

---

## Prior-Year Rights Release

A player whose rights were released may appear again only if:

* the rights are currently unowned; and
* the player was selected in the immediately preceding Hundo Leago Entry Draft.

The system must not infer eligibility only from a display name or roster absence.

---

## Eligibility Snapshot

The draft freezes an eligibility snapshot when the commissioner confirms setup.

A commissioner may add or remove a player after confirmation only through an explicit eligibility correction that records the change.

Eligibility does not update automatically after setup confirmation.

A post-confirmation eligibility correction is limited to fixing a provable source or identity error. It cannot be used to add an otherwise ineligible older prospect by preference.

---

# Part 7 - Live Draft Workflow

## Starting the Draft

At the scheduled start, the commissioner presses `Start Draft`.

The backend:

1. revalidates setup, pick ownership, and player ownership;
2. changes the draft to `Live`;
3. opens trading;
4. places the first unused pick on the clock;
5. records and broadcasts the authoritative state.

The draft does not start automatically without commissioner action.

---

## Pick Clock

The pick clock is:

```text
Five minutes per pick
```

The clock runs only while the draft is `Live`.

Pausing the draft freezes the remaining time. Resuming continues from the stored remaining time.

---

## Making a Selection

For the on-the-clock pick:

1. an authorized manager or commissioner chooses one eligible player;
2. the interface shows the team, pick, player, and resulting prospect right;
3. the actor confirms;
4. the backend revalidates authority, current pick, pick owner, player eligibility, and player ownership;
5. the pick becomes used;
6. the player right enters the current pick owner's Prospect roster;
7. the selection and history save atomically;
8. the next unused pick goes on the clock.

A selection creates no salary or contract.

---

## Duplicate and Concurrent Selections

Only one selection may win for a pick and player.

Retries, double-clicks, two browser tabs, and simultaneous manager and commissioner submissions must not:

* use one pick twice;
* select one player twice;
* advance the draft twice;
* create duplicate prospect rights.

The losing request receives the authoritative current state.

---

## Timeout and Automatic Selection

There are no skipped picks.

If the five-minute clock expires before an authorized user confirms a selection, the backend automatically selects the highest remaining eligible player from the top of the team's ordered player list.

The timeout operation uses the same atomic eligibility, ownership, pick-use, prospect-right, history, and advancement operation as a manual selection.

The automatic selection is final and is identified as system-selected in draft history.

---

## Pick Queue

The private queue:

* belongs to one user, team, league, and draft;
* is visible only to that user;
* orders eligible players;
* removes players selected by another team;
* participates in the approved automatic best-player-available workflow;
* survives refresh and reconnect.

---

## Trading During the Draft

Unused picks remain tradeable through the normal Trades workflow.

The on-clock behaviour is:

* an accepted trade changes the pick's current owner atomically;
* the original team and ownership history remain unchanged;
* trading an on-clock pick resets the pick to a new five-minute clock;
* the new owner receives the full reset time;
* a trade submitted after the pick is used fails without partial transfer.

---

## Draft Completion

The draft may become `Complete` only when every pick is either:

* used; or
* explicitly forfeited by the commissioner after confirmation.

Completion:

* closes selection writes;
* preserves the immutable board and selection history;
* leaves created prospect rights on their teams;
* does not close the trading window;
* creates the next required off-season state.


---

# Part 8 - Commissioner Operation and Technical Recovery

## Selection for a Team

A commissioner may select for any team in the assigned league.

The interface must clearly label the action as a commissioner selection and must not make it appear to have been submitted by the team's manager.

No written reason is required. An optional reason may be recorded.

---

## Selection Immutability

There is no Entry Draft undo feature.

After a manual or automatic selection is confirmed:

* the selected player cannot be replaced;
* the pick cannot be restored or reused;
* the selection cannot be reassigned to another team;
* the commissioner cannot alter the selection;
* later trades transfer the resulting prospect rights through the normal Trades workflow.

---

## Technical Recovery

A draft may enter `Correction Required` only when a technical failure leaves the system unable to prove that the approved atomic selection operation completed consistently.

Recovery may repair missing technical links or finish the already-authoritative selection result, but it may not change the selected player, selecting team, or used-pick outcome.

Unsafe recovery must stop and preserve the last provable state rather than partially changing draft data.

---

# Part 9 - History and Notifications

## Draft History

The draft board and history preserve:

* pick ID, round, and position;
* original team and selecting/current owning team;
* selected player and stable player ID;
* actor and authority used;
* selection time;
* manual, automatic-timeout, or commissioner-selection source;
* lottery, pause, resume, forfeit, and technical recovery events;
* related trade IDs where applicable.

---

## League Activity

League Activity records only:

* Entry Draft start;
* lottery results;
* Entry Draft completion.

Individual selections, automatic timeout selections, setup previews, page views, queue changes, clock ticks, pauses, resumes, and read-only refreshes do not enter League Activity.

Draft history remains the detailed source for selections and operational events.

---

## Notifications

The Entry Draft uses in-app notifications for:

* draft scheduling or rescheduling;
* draft start, pause, resume, and completion;
* a team's on-clock turn;
* a team's automatic timeout selection;
* a trade that resets an on-clock pick;
* a technical recovery affecting a team.

Email and push notifications are deferred.

---

# Part 10 - User Interface

## Draft Setup

The commissioner setup view must show:

* league and season;
* draft status;
* date, time, and timezone;
* round count and pick clock;
* official source order;
* every pick's original and current owner;
* missing or invalid setup data;
* eligible-player count;
* preview and confirmation controls.

---

## Live Draft Board

The authenticated league view must show:

* draft status and current round;
* on-clock team, pick, and remaining time;
* completed, forfeited, and upcoming picks;
* original team when a pick was traded;
* selected player information;
* pause or delayed-state notices;
* current user's authorized controls.

The frontend must render backend authority and must not independently advance picks.

---

## Player Search

The selection view should support:

* name search;
* Hundo Leago position;
* NHL organization when available;
* draft-eligibility context;
* selected or unavailable state.

Search results must not imply that an ineligible player can be selected.

---

# Part 11 - Validation and Failure Handling

Every draft write must validate:

* authenticated actor;
* active league membership;
* manager assignment or commissioner authority;
* league and season;
* draft status;
* stable pick identity;
* current pick owner;
* unused-pick state;
* eligible and unowned player;
* absence of conflicting rights or contract;
* current draft version;
* complete resulting state.

A failed write must:

* save no partial selection or ownership change;
* leave the current pick authoritative;
* return an understandable error;
* allow safe retry when appropriate.

Read-only draft endpoints must never create picks, repair order, advance the clock, or mutate draft state.

---

# Part 12 - Required Testing

Tests must cover:

* league and season isolation;
* setup creation and atomic confirmation;
* reverse-standings source order and fixed playoff-finalist placement;
* lottery participants and linear weights for minimum and maximum league sizes;
* two weighted draws without replacement using deterministic test randomness;
* traded original-team picks receiving the correct lottery position;
* lottery atomicity, audit inputs, immutable completion, and safe pre-commit retry;
* traded picks and repeated pick transfers;
* current and future pick creation;
* stable original-team and current-owner history;
* most-recent NHL draftees, goalies, older prospects, signed ELC players, owned players, released rights, and source-identity corrections;
* every round boundary;
* manager, commissioner, administrator, public, and cross-league permissions;
* start, pause, resume, automatic timeout selection, forfeit, and completion;
* on-clock pick trades;
* duplicate and concurrent selections;
* retry and reconnect;
* prospect-right creation without salary or contract;
* proof that confirmed selections cannot be undone or changed;
* technical recovery without selection changes;
* dependent rights trades and fantasy ELCs;
* League Activity and detailed draft history;
* notification delivery;
* proof that read-only endpoints never write;
* controlled-clock full-draft simulation.

---

# Part 13 - Approval Checklist

## Inherited Approved Rules

- [x] Entry Draft records are scoped to one league and season.
- [x] An Entry Draft selection creates prospect rights in the selecting team's Prospect roster.
- [x] Prospect rosters have unlimited slots.
- [x] A drafted prospect has no salary merely because the rights were drafted.
- [x] Signed fantasy ELC prospects may remain in Prospects without affecting the cap.
- [x] A player cannot return to Prospects after moving to Active, Bench, or Injured Reserve.
- [x] Fantasy ELCs are `$3` over three years at `$1 AAV`.
- [x] Automatic real-life ELC detection and enforcement are deferred.
- [x] Released rights may re-enter only when selected in the immediately preceding Entry Draft.
- [x] Released rights may not enter normal free-agent auctions unless later approved.
- [x] Draft picks and prospect rights are tradeable assets.
- [x] An unused pick may be traded repeatedly, including during its Entry Draft.
- [x] A draft pick preserves a stable identity, original team, current owner, and ownership history.
- [x] Trading opens at the start of the Entry Draft.
- [x] A manager may select only for an assigned team.
- [x] A commissioner may select for any team in the assigned league.
- [x] Commissioner authority does not cross league boundaries.
- [x] Contract expiration occurs during end-of-season rollover before the Entry Draft.
- [x] The Entry Draft does not itself expire contracts.
- [x] There are no goalies in Hundo Leago.

## Approved Lottery and Eligibility Decisions

- [x] Every active non-finalist participates in the Entry Draft lottery.
- [x] The playoff champion's original pick remains last.
- [x] The losing finalist's original pick remains second-last.
- [x] Traded picks retain their original team's lottery position and award the resulting position to the current owner.
- [x] Lottery weights descend linearly from `N` for the worst-ranked participant to `1` for the best-ranked participant.
- [x] Official standings order resolves tied regular-season records before lottery weights are assigned.
- [x] Two weighted draws without replacement determine first and second overall.
- [x] Any lottery participant may move to first or second overall.
- [x] Undrawn teams retain reverse-standings order and can fall by no more than two positions.
- [x] The completed lottery order is used in all four linear rounds.
- [x] The commissioner previews and explicitly starts the lottery.
- [x] The backend uses cryptographically secure randomness and preserves auditable draw inputs and algorithm version.
- [x] Lottery results save atomically and are immutable after commit.
- [x] A failed pre-commit lottery creates no official result and may be safely retried.
- [x] The normal player pool contains F or D players selected in the most recently completed real NHL Entry Draft.
- [x] Goalies are never eligible.
- [x] An unowned player released from rights may re-enter only under the approved immediately-prior Hundo Leago Entry Draft rule.
- [x] Players from older NHL drafts are not eligible merely because they remain young, unsigned, or described as prospects.
- [x] A real-life ELC signing does not by itself disqualify an otherwise eligible newly drafted player.
- [x] Every eligible player requires a stable canonical player ID, no league owner, no active league contract, and no conflicting right.
- [x] Eligibility freezes at setup confirmation.
- [x] A later correction may fix only a provable source or identity error and never adds an otherwise ineligible player by preference.

## Approved Entry Draft Decisions

- [x] Every authenticated active league member may view the complete setup, live board, selections, and history.
- [x] The Entry Draft is unavailable to unauthenticated public viewers.
- [x] Draft statuses are `Setup`, `Scheduled`, `Live`, `Paused`, `Complete`, `Correction Required`, and `Cancelled`.
- [x] The off-season order is rollover, draft-order finalization, Entry Draft, team-erase window, then preseason preparation.
- [x] The commissioner sets the draft date and time in `America/Vancouver`.
- [x] Rescheduling requires confirmation and an in-app league notification.
- [x] The commissioner confirms an atomic setup containing order, picks, owners, eligible players, timing, and clock.
- [x] The playoff champion selects last and the losing finalist selects second-last.
- [x] Every other team begins in reverse official regular-season standings order before approved lottery movement.
- [x] Entry Draft development is deferred until during the season and is not required for the initial Season 2 launch.
- [x] The initial season's Entry Draft still requires the lottery before it can be used.
- [x] Lottery participants, weights, draws, movement, execution, and audit rules are defined in this specification.
- [x] The Entry Draft has four rounds.
- [x] The draft is linear and uses the same team order in every round.
- [x] Picks are created for the current draft and the following three drafts.
- [x] Teams cannot be added to or removed from a confirmed draft.
- [x] The real-world player-eligibility boundary is defined in this specification.
- [x] Eligibility requires a canonical stable player ID, no current league owner, no active league contract, and no conflicting rights-release restriction.
- [x] Eligibility freezes when draft setup is confirmed.
- [x] Post-confirmation eligibility changes require an explicit commissioner correction.
- [x] The commissioner manually starts the scheduled draft after backend revalidation.
- [x] Starting the Entry Draft reopens trading.
- [x] Each pick has a five-minute clock.
- [x] Pausing freezes the stored remaining time and resuming continues it.
- [x] A confirmed selection atomically spends the pick, creates prospect rights, records history, and advances the draft.
- [x] A selection creates no salary or contract.
- [x] There are no skipped picks.
- [x] A timeout automatically selects the highest remaining eligible player from the top of the team's ordered list.
- [x] Automatic best-player-available selection and private persistent queues are required when the Entry Draft is built.
- [x] An accepted trade of an on-clock pick resets the clock to five minutes for the new owner.
- [x] A draft completes only after every pick is used or explicitly forfeited by the commissioner.
- [x] Completing the draft closes selections but leaves trading open.
- [x] No written reason is required for a commissioner draft action; an optional reason is allowed.
- [x] There is no Entry Draft undo feature.
- [x] A completed manual or automatic selection cannot be changed.
- [x] `Correction Required` is limited to technical recovery that preserves the confirmed selection.
- [x] League Activity records only Entry Draft start, lottery results, and Entry Draft completion.
- [x] Individual selections, setup previews, queue changes, clock ticks, and read-only views do not appear in League Activity.
- [x] Entry Draft notifications are in-app only.
- [x] Notifications cover scheduling, rescheduling, start, pause, resume, completion, on-clock turns, automatic timeout selections, on-clock trade resets, and team-affecting technical recovery.
- [x] The live board shows original-team identity for traded picks.
- [x] The frontend never independently advances the pick or clock state.
- [x] Read-only draft requests never create, repair, or advance draft state.
- [x] Grae approved this document as the Season 2 Entry Draft product specification.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The general workflow approval phase is complete.

Implementation is complete only when setup, eligibility, live selection, traded-pick, clock, recovery, permission, activity, notification, isolation, concurrency, and read-only-boundary tests pass.

---

# Related Documents

```text
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/07-testing/TESTING_STRATEGY.md
```
