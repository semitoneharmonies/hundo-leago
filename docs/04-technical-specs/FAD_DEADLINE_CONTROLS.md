# FAD deadline controls — local implementation, 29 September 2026

These slices control and reschedule open Candidate Card deadlines and planned
rounds, configure nomination cutoffs, and change unused future rounds during
rapid FAD. Broader calendar edits, accepted-auction clocks, resets, scoring and recovery remain separate
approved work. No deployment or live operation is included.

## Contract

All routes are under
`/api/v1/leagues/:leagueId/free-agent-drafts/:fadId/deadline-control`.

| Route | Contract |
| --- | --- |
| GET base | Current commissioner/admin only; status and unfinished team names; no writes |
| POST /preview | CSRF and current authority; reason of 3–500 characters; read-only state-bound preview |
| POST /proceed | CSRF, reason, previewHash, confirmed=true and Idempotency-Key; atomic reviewed authorization |
| GET /timing | Current commissioner/admin only; public draft clocks and edit availability; no card contents or writes |
| POST /timing/preview | deadlineAtMs, rolloverTimesAtMs, reason; read-only before/after review |
| POST /timing/apply | Same timing values plus previewHash, confirmed=true and Idempotency-Key; atomic reschedule |

The preview exposes no player, offer, term, bid or revision contents. It binds
the current draft, deadline job, card versions/readiness and control version.
Changed state rejects confirmation with 409. Repeating the same accepted
request returns the stored receipt without additional history or notifications.
An accepted receipt authorizes the worker; it does not claim completed allocation.

Manual processing requires an active league, open cards, all participating card
records, a pending deadline job, a reached target, and more than an hour
until the first scheduled auction rollover. The worker rechecks that timing
when executing a manual authorization. Late execution returns to a hold.

## Persistence and workers

Migration 67 adds league-scoped deadline controls and immutable command history.
Existing league rows are untouched; schema metadata advances. Three existing
Candidate Card triggers permit current managers to edit after the target while
the card and draft remain open. Every other trigger permission predicate is
preserved. Commissioner help authority is not extended by this migration.

The deadline writer evaluates current eligibility and cap state inside its
normal transaction. If any card is incomplete or ineligible without an explicit
proceed authorization, the attempt rolls back, preserving every open card.
A separate transaction releases that exact claimed job and records a durable
hold with private-safe league activity and in-app notices. Held jobs are omitted
from subsequent scheduler scans before the batch limit. Rollover and completion
jobs are also omitted while cards are open. Reads do not release holds.

The manager private-card and mutation paths remain assignment-bound while open.
All-ready cards process automatically at the target, never early. Once held,
the final saved card does not restart processing; the commissioner must decide.
No historical result is replayed. Old fixture schemas retain their old contract.

The additive overview property `deadlinePolicy: "soft"` lets the coordinated
frontend retain the manager's editor after the target while observing actual
phase/authorization changes. Help-grant expiration still removes private access.
The FAD page shows a commissioner-only status/preview/confirm panel.
Status and authorization changes create ordinary inbox links to the FAD.

## Rescheduling an open draft (schema 68)

Commissioners/admins can change a future target and each planned round while
cards are open, including after a hold. The target must be in the future and
before Week 1; the first round must leave more than one hour after the target.
Rounds remain strictly increasing and end by Week 1. Multiple rounds per day
are supported. This slice preserves the existing round count; adding/removing
rounds and editing active auction closing times are pending. Schema 69 adds the
cutoff gap control described below.

Migration 68 adds immutable `fad_timing_changes` history. It changes no existing
league rows. The original forward-transition trigger bodies are retained, with
an exception bound to exact before/after root, round and job snapshots. The
deadline reminder barrier also recognizes an unchanged, already-sent reminder
bound to the latest rescheduling receipt. Other barriers remain unchanged.

The application validates current authority, active/current season, open cards,
unprocessed rounds, absence of allocations/auctions/snapshots, and pending jobs.
Running/failed jobs require recovery. A preview binds the complete timing state
and actor; confirmation rechecks the future target, state and authority inside
an immediate transaction. Job occurrence keys/times, round clocks, and the FAD
root change together. Exact receipt replay is read-only. Every changed record
retains its identity. Round updates are ordered to avoid clock uniqueness
collisions when one round adopts another round's former time.

Saved cards, revisions, help grants, rosters, contracts, original readiness
receipts and season schedule history remain untouched. Existing help grants
retain their original expiry. The root's help-window start follows the revised
target. A pending reminder moves with the target; an already-sent reminder
stays unchanged and is not sent again. Commissioners can use league
communications for an additional reminder. Members receive a generic schedule
change notice linking to the FAD; the audit records the actor, reason and clocks.

Confirmation clears a held or previously authorized processing control, whose
prior state remains in timing history. Complete valid cards then process at
the revised target; unfinished cards hold again. Editing dates never reopens
locked cards or reverses awards. UI dates explicitly use the viewer's local
time zone. Both timing reads and previews avoid loading hidden card/bid data.

## FAD nomination cutoff gaps (schema 69)

The existing deadline-control router also provides `GET /auction-cutoff`,
`POST /auction-cutoff/preview` and `POST /auction-cutoff/apply` under the scoped
FAD deadline-control base. Preview takes exactly `gapMinutes` (integer 0..10080)
and `reason` (3..500 characters). Apply adds `confirmed: true`, `previewHash`
and the normal Idempotency-Key header. All routes enforce current commissioner
or administrator authority; unsafe requests require the normal session/CSRF
boundary. GET and preview are read-only and no-store.

The league must be active in the FAD's current season and the root must be
`cards_open` or `rapid`. Running/leased/failed jobs, processing/recovery rounds
and overdue scheduled rounds block editing. The plan updates only unused
scheduled rounds and stores the gap for future extensions. A round is retained
if any auction context references it or any queue record references it as a
source, opening or resolution round. All queue statuses count. This protects
immutable acceptance/replay evidence; even cancelled auctions retain the rule
under which they were accepted.

Responses include only clocks, round numbers, retained status/reason and impact
flags. No player, bidder, offer or card contents are fetched. The preview hash
binds current league/root/round/settings/job state, accepted-round presence,
actor, input and immediate nomination-window impact. A new commitment or clock
boundary can invalidate the preview. Confirmation uses one clock value and an
immediate transaction to recheck authority and state. Exact replay adds no writes.

`fad_auction_cutoff_settings` stores the versioned gap; absent settings mean
60 minutes. Immutable `fad_auction_cutoff_changes` stores actor, reason,
previous/new settings versions and exact before/after round snapshots. Changes,
settings, round clocks, activity and inbox notices commit or roll back together.
Auction close times, jobs, cards, bids, accepted queues and original readiness
records are untouched. Rescheduling an open-card FAD retains this setting.

Migration 69 rebuilds only the rollover table with all existing columns/rows
preserved, widening its cutoff CHECK from exactly one hour to within the round.
It recreates all dependent objects; only the rollover forward-update guard and
queue forward-update cutoff validation change. The former permits an exact
receipt-bound change only without auction/queue references. New rounds must
match the configured setting (default one hour). The original readiness clock
and receipt rules remain unchanged. Runtime readers validate saved cutoffs;
queued, fallback and recovery extension writers use the configured gap. Older
fixture schemas continue to use the default without querying the new table.

The range includes zero (start until closing) and gaps at least as long as a
round (no immediate nomination window). These effects are shown before saving.
Protected rounds may differ from the current setting. Show each saved cutoff,
not a single inferred time for all rounds. Creation-form configuration and
ordinary in-season timing are outside this completed slice.

## Unused future rounds during rapid FAD (schema 72)

The same timing endpoints also support the rapid phase. The response adds
`canEditDeadline` and `roundDates: [{sequence, canEdit, blockedReason}]`.
The deadline and help window stay fixed after locking cards. The editor disables
protected dates and explains why. Neither status nor preview returns player,
manager, card, offer or bid contents. The existing exact input shape is retained:
send the unchanged deadline and all round dates, changing only eligible dates.

A change requires the active current season, successful opening/deadline/reminder
records, sequential initial rounds and matching idle jobs. Overdue rounds,
extensions, recovery and running jobs require attention first. Only scheduled
rounds whose opening is still in the future can change. Every auction context
and every queued nomination protects its referenced rounds regardless of status.
Queue source/opening successors are protected too, since saved acceptance
receipts derive their closing time from that later clock.

Changing a close also changes the following opening, so both rounds must be
eligible. If the successor is protected, the preceding close is disabled.
Round order and the Week 1 boundary still apply. Changed rounds use the current
cutoff gap; untouched rounds retain their exact clocks and versions.

Confirmation rechecks authority, state, new accepted nominations and elapsed
time within the transaction. It records exact before/after history and updates
only changed rounds and pending rollover jobs, then the draft's planned dates.
Locked-card records, original readiness, completed jobs, existing deadline
authorization records, auction/bid records, accepted queues and their receipts
are preserved. Public activity and member inbox notices commit atomically.
Retries return the same accepted command without further writes.

Migration 72 changes four existing trigger definitions and adds one rapid-phase
audit validation trigger. It does not modify stored league rows or rebuild
tables. The existing lifecycle trigger bodies remain unchanged. The new guard
requires exact recorded changes and rejects changes to opened or committed
rounds, the locked deadline or completed job receipts.

Schema 73 extends the eligible direct-auction paths as described below. Queue,
restricted/fallback, extension, round-count and immediate/backdated corrections
remain pending.

## Open direct manager auctions during rapid FAD (schema 73)

Status now includes `canEditActiveAuctions`; preview adds only an
`affectedAuctions` count. An eligible initial round may already have opened,
but its opening cannot move once reached. Its old and proposed closes must
both remain in the future. Every auction linked to a changed close must be an
open `fad_open_rapid` / `manager_nomination` auction with no result or recovery
and an exact pending, unattempted, unleased `auction.resolve.target` job.
All queued nomination dependencies, restricted/fallback paths and completed
results retain the existing protection. Extension rounds still block timing.

The repository reads only auction clock, context-kind and job metadata for
planning. It never loads bid rows, amounts, bidder identities or card contents.
The preview hash includes these effective clocks and job versions. Confirmation
rechecks scope, current authority, state and elapsed time inside an immediate
transaction. Bids accepted before confirmation remain unchanged.

New immutable `fad_auction_clock_changes` rows bind each old/new auction clock,
version, cutoff and resolution job snapshot to one `fad_timing_changes` record.
The parent foreign key is deferred so the child snapshots can authorize the
exact parent plan in the same transaction. Database guards require the current
idle direct-auction state, exact job identities, matching parent/round snapshots
and coordinated final auction/round clocks. Missing job clock/version fields
are rejected. The existing auction lifecycle guard body is retained verbatim;
only the exact audited clock transition bypasses its ordinary lifecycle path.

The write updates the existing job occurrence, auction close/version, round
closes/cutoffs and successor opening, then the root planned dates. It preserves
auction contexts, original events, bids, bid timestamps, idempotency records,
draw commitments and completed history. Activity, inbox notices and a public
`auction.changed` signal per changed auction are atomic with the correction.
Signals contain record IDs and versions only and refresh connected auction
views through the existing invalidation handling. An exact retry is read-only.

Direct-start replay validates the original accepted close against the earliest
clock-correction snapshot and the current worker job against the effective
close. Its immutable start event identifies the opening bid even after a later
bid edit changes that bid's current idempotency pointer. Publication validation
is scoped to event type and version, allowing a later clock signal in the same
millisecond without accepting duplicate original start signals. The returned
auction page projection uses the current close; original accepted terms remain
in the permanent receipt. Resolution and rollover follow the new occurrence.

Migration 73 adds one empty audit table and its guards. It changes only the
existing rapid timing validation and auction update trigger definitions; all
prior league rows are preserved. This is a local implementation awaiting the
release checks below, not authority to move any live league clock.

## Verification and release limits

Real disposable runtime scenarios cover automatic processing, held-card saving,
sticky holds, stale previews, session/CSRF/role checks, byte-identical read and
retry behavior, downstream allocation and migration of an already-open draft.
Migration comparison checks every existing table and the exact permission-only
delta of the three replaced triggers. Frontend checks cover editor access,
preview/confirmation, retry identity, invalid responses and notifications.
Synthetic desktop and mobile previews never contact hosted APIs.

See the [work plan](../06-work-plans/COMMISSIONER_CONTROLS_2026-09-29.md) for
recorded command results. A production-copy rehearsal, rollback review,
coordinated publication and authenticated hosted acceptance are still required
before release. Never roll an older worker over a schema-67 held draft without
an explicit compatibility review; the older worker does not honor these holds.
Schema-68 timing history and revised schedules also require compatible workers;
publication must include the coordinated backend and frontend changes.
Schema-69 custom cutoffs also require compatible readers and workers; an older
application cannot safely interpret non-default cutoffs. The local migration
tests are not a production-copy rehearsal or a tested production rollback.
Schema-72 rapid timing also requires the coordinated application version;
rolling back to an older application requires a compatibility review.
Schema-73 active timing requires the matching start-replay reader and workers.
Do not roll back to an application that assumes every accepted auction still
closes at its original receipt time.
