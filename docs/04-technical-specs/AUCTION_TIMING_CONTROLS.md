# Individual in-season auction timing controls

Local commissioner-controls implementation, 29 September 2026. This record does
not establish staging publication, authenticated hosted acceptance or deployment.

## Routes and access

Base: `/api/v1/leagues/:leagueId/auctions/:auctionId/timing`.

| Route | Result |
| --- | --- |
| GET base | Public auction clock, league timezone, season boundaries, edit availability and latest 25 changes |
| POST /preview | Before/after clock, shorter/longer window indication and state-bound preview hash |
| POST /apply | Explicit confirmed change with stable idempotency key |

Every request requires current commissioner or inherited platform administrator
authority for the exact league. GET and preview remain read-only. Responses are
private/no-store. POST uses the existing authenticated origin/CSRF boundary.
The control repository does not read bid, bidder, participant or offer tables.

Preview input is exactly `{ closesAtMs, reason }`: bounded safe UTC milliseconds
and a trimmed 3..500-character reason without control characters. Apply adds
`confirmed: true`, `previewHash` and the usual Idempotency-Key header.
The preview binds the actor, input and current auction/league/season/context/
resolution state. Confirmation rechecks authority and the actual clock inside
an immediate transaction. A successful retry returns its existing receipt;
conflicting use of the key is rejected.

## Eligibility and scheduling

Only `ordinary_weekly` auctions in the league's active current season qualify.
The selected auction must be open and its existing deadline strictly future.
Any linked resolution job, regardless of status, or resolution record blocks
editing. FAD, resolving, failed, completed, cancelled and elapsed auctions are
protected. The new time must differ, remain future, and precede both playoffs
and regular-season end where those boundaries are set.

Ordinary auction jobs are claimed when due; opening an ordinary auction does
not create a future resolution job. The existing worker selects due auctions
from `auctions.resolves_at_ms` and binds the auction version. Editing this clock
and version therefore updates bidding and resolution together without inventing
or replaying a job. A previously claimed job blocks editing.

Existing bids, bid events, original submission timestamps, edit counts and
cooldowns are unchanged. Original auction contexts and command receipts remain
intact. The worker resolves normally at the new deadline, preserving the existing
winner/pricing/ownership/contract rules.

## Persistence and notification

Migration 0071 adds `auction_timing_changes`, its league-first history index,
current-state insert validation and immutable update/delete guards. No existing
table rows or schema objects are changed, except the schema metadata advance and
migration ledger. Existing ordinary/FAD auction transition guards stay intact.
The historical signed reset policy requires the new table to be empty.

The audit records auction, actor/authority, reason, old/new time and versions.
One transaction inserts that audit, conditionally updates only the selected
auction clock/version, writes general activity, sends member inbox notices and
emits `auction.changed`. Failure rolls back all effects. No email is sent.
Notices link to the exact auction and reveal no bid information.

Runtime totals: 152 endpoint contracts, 150 tables including the migration
ledger, 149 application catalogue entries, and 85 immutable delete guards.

## Website and verified boundaries

`AuctionTimingControls.jsx` mounts only for commissioner/admin authority on
ordinary auction detail pages. Opening the disclosure loads timing metadata.
Dates use the league timezone; editing withdraws a prior preview. Confirmation
explains reduced/increased bidding time and preserved bids. Network retries keep
the same key. Closed auctions expose a reason/history without an editing form.

Verification includes populated schema-70-to-71 migration preserving every
existing row/object, byte-identical reads/previews/retries, late-write rollback,
real bid editing after the former deadline with unchanged original timestamp,
denial at the new exact deadline, and successful actual worker resolution.
Real session/CSRF tests cover commissioner/admin and denied manager/anonymous
access. UI tests and inspected desktop/mobile fixtures verify date conversion,
confirmation and no bid requests. Commands/logs are in the
[work plan](../06-work-plans/COMMISSIONER_CONTROLS_2026-09-29.md).

Still pending: recurring league closing schedules and creation cutoffs,
coordinated active FAD rounds/queues, reopening expired auctions, immediate
closure/backdated correction, and the remaining approved controls package.
No hosted/live records were accessed or changed. Production-copy rehearsal,
compatible rollback and authenticated hosted acceptance remain release work.
