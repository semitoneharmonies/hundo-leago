Phase 5.5 — Annual Free Agent Draft System
Phase 5.5 Definition
Allowed

New pre-season–only systems

New pages that become read-only after completion

Contract assignment logic

Non-blind auction logic (pre-season only)

Reveal / presentation UX

Audit logging and reproducibility tooling

Not Allowed

Any in-season auction changes

Blind auction modifications

Cap / contract rule changes

Mid-draft commissioner overrides (except emergency abort)

Anything that mutates data after the draft is finalized

1. Preconditions (Must Be True Before Phase 5.5 Begins)

☐ League Setup schema exists and is locked pre-season (Phase 2)
☐ Inactive roster rules implemented and enforced (Phase 3)
☐ Optional rule toggles are defined and immutable at season start (Phase 4)
☐ Entry Draft & prospect rights system exists (Phase 5)
☐ Clear “Preseason” vs “In-Season” league state flag exists

If any of these are missing → stop. Do not start Phase 5.5.

2. Free Agent Draft Lifecycle (System Truth)

The Free Agent Draft is:

Annual

Pre-season only

Happens after Entry Draft

Happens before Start Season

Fully deterministic

Fully auditable

Becomes read-only once complete

☐ Draft state enum defined:

NOT_STARTED

PLAYER_CARDS_OPEN

LOCKED_PROCESSING

TIE_AUCTIONS

OPEN_AUCTIONS

COMPLETED (READ-ONLY)

☐ Draft cannot be skipped or re-run without a full season reset

3. Player Eligibility & Pool Construction

☐ Eligible players defined as:

Unsigned

Age ≥ 20

Not held as rights (unless explicitly released)

Not already under contract

☐ Entry-drafted players excluded unless ELC signing is enabled and used

☐ FA pool snapshot created at draft start
☐ Pool does not change mid-draft

Verification
☐ FA pool count is reproducible
☐ Same inputs → same eligible list

4. Player Card System (Core Mechanic)
A) Player Card Submission

☐ Dedicated Free Agent Draft page
☐ One Player Card per team
☐ Player Card includes:

playerId

salary

term (1–3 years)

☐ Cards are:

private

editable

validated live

not visible to other teams

B) Validation Rules (Hard Stops)

☐ Cannot exceed:

active roster size

inactive roster size

contract years cap
☐ Inactive slot restriction enforced:

salary ≤ threshold (e.g. $5)
☐ Cap math preview shown
☐ Clear error messages on invalid cards

☐ Cards cannot be submitted partially (no “maybe” entries)

5. Draft Start & Global Lock

When commissioner clicks Start Free Agent Draft:

☐ All Player Cards lock simultaneously
☐ No further edits allowed
☐ Draft state → LOCKED_PROCESSING
☐ FA pool snapshot frozen
☐ Validation re-run server-side (defensive)

If any card is invalid at lock:
☐ Draft cannot proceed
☐ Errors shown clearly to affected teams

6. Initial Assignment Pass (System Digest)

For each player in FA pool:

☐ If exactly one bidder:

Assign player

Contract recorded

Roster slot assigned (active/inactive)

☐ If multiple bidders:

Highest salary wins

Term applied from winning card

Losing bids discarded

☐ If salary tie:

Player flagged for tie-break auction

Only tied teams eligible

Verification
☐ Assignment pass is deterministic
☐ Re-running digest with same inputs yields same results

7. Tie-Breaker Auctions (Non-Blind)

☐ Separate draft state: TIE_AUCTIONS
☐ Auction UI limited to tied teams only
☐ Open bidding (not blind)
☐ Clear rules displayed:

bid increment

timer

winning condition

☐ Winning bid:

overrides original salary

preserves contract term (or clearly re-selected if you choose)

☐ All tie auctions must complete before moving on

Audit
☐ Auction logs include:

bids

timestamps

participants

final result

8. Open Free Agent Auctions (Roster Fill)

After tie-breakers:

☐ Remaining FA pool visible
☐ Open (non-blind) auctions enabled
☐ Used only to fill remaining roster slots
☐ All standard cap / contract validation enforced

☐ Commissioner can close open auctions only when:

all teams are legal

or explicitly choose to end phase

9. Draft Completion & Lock

When Free Agent Draft completes:

☐ Draft state → COMPLETED
☐ Page becomes read-only
☐ All contracts persisted
☐ Rosters finalized
☐ Cap & contract-year totals recalculated

☐ No further FA Draft writes allowed

Verification
☐ Reload page → no edit controls
☐ Historical data visible
☐ Contracts appear everywhere consistently

10. Auditability & Safety (Non-Negotiable)

☐ Log every write:

card submission

card lock

player assignment

auction bid

auction resolve

draft completion

Each log includes:
☐ actor
☐ timestamp
☐ draftPhase
☐ before/after summary
☐ playerId where relevant

☐ Draft results exportable as JSON
☐ Draft can be replayed in dry-run mode in dev

11. UX & Trust Features (Critical)

☐ Clear countdowns:

“Cards lock in…”

“Draft starting…”
☐ Status banners explaining current phase
☐ Clear “This will lock” warnings
☐ Visual separation between:

assigned players

tied players

remaining pool

☐ Post-draft summary page:

per-team signings

total cap used

contract years used

12. Failure & Abort Handling

☐ Emergency abort button (commissioner-only):

available only before COMPLETED

rolls back to NOT_STARTED

requires confirmation + reason

☐ Abort action logged loudly
☐ Abort not available after draft completion

13. Validation Plan (How You Know It’s Correct)
A) Determinism Test

☐ Same Player Cards → same results
☐ No hidden randomness
☐ No order-dependent behavior

B) Edge Case Tests

☐ Two-team tie
☐ Three-team tie
☐ Team hits contract-years cap exactly
☐ Inactive slot overflow prevented
☐ Team submits empty card

14. Phase 5.5 Exit Criteria

You “pass” Phase 5.5 only if:

☐ Free Agent Draft runs start → finish without commissioner intervention
☐ Results are reproducible and auditable
☐ Draft becomes read-only and cannot be mutated
☐ Managers understand why they won or lost players
☐ Transition to “Start Season” is clean and obvious

Only after this should you proceed to Phase 6 — League Identity & Transparency.
