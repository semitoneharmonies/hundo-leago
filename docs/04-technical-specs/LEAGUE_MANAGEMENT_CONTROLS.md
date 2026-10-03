# League management reports and missing-pick repair

Implemented locally in the commissioner competition page. No hosted acceptance
or deployment is implied. All endpoints require current commissioner or platform
administrator authority in the selected league, with no-store responses.

The readiness report is read-only: current manager assignments, status-only
Candidate Cards, existing roster/cap legality, calendar conflicts, missing picks,
and failed/interrupted jobs. Pre-FAD roster preparation is distinct from an illegal
competition lineup. The operations total includes all matches; details are bounded
to the first 100 and the UI explains truncation.

History searches the full scoped timeline before pagination, with a filter-bound
cursor. Private auction access events omit bidder identities and values. Raw
commissioner snapshots and reminder recipients are never selected. Before/after
values are supplied only by explicitly safe change records.

The explicit JSON download includes current-season league/team information,
rosters and current contracts, pick ownership, and recorded results. It excludes
private cards, bids, proposals, account contacts, credentials and private notes.
This reference export is not a backup or a restore format.

Missing-pick repair adds only absent records for a not-yet-started entry draft.
The recorded lottery or consistent existing matrix determines order. A single
absent team's position can be inferred from the remaining position; ambiguous or
contradictory orders are refused. The commissioner reviews every proposed owner,
which can differ from the original team. Started/completed drafts remain protected.

`GET /api/v1/leagues/:leagueId/management/{readiness,history,export,picks}`
is read-only. Pick repair uses separate POST `picks/preview` and `picks/apply`
endpoints. A fresh state-bound preview, reason, explicit confirmation and retry
key are required. Each inserted unused pick has an ownership event. Receipt,
activity, in-app notices, league invalidation and version changes are atomic.
Migration79 adds immutable management receipts and changes no existing records.

Verified on disposable local E: fixtures: populated schema78 upgrade with row and
schema-object preservation; real session/CSRF and current role denial; read-only
GET/preview bytes; cross-league protection; unchanged existing/traded picks;
notification-failure rollback; idempotent retry; immutable receipts; 52-row history
pagination; private-data canaries; 101-job totals; regular/daily FAD status reports;
focused frontend interaction tests; desktop/phone browser and visual checks.
Evidence is retained in task tmp/management-* and tmp/pick-repair-* logs.

## Private help requests

`GET /api/v1/leagues/:leagueId/help` lists open/closed/all requests in 50-row cursor pages. Managers see their own requests; current commissioners and platform administrators with membership see all. `GET /targets?kind=auction|roster|trade|general&teamId=...` returns labels only for a currently managed team (200 recent auction/trade records; current roster). `GET /:requestId` returns that authorized conversation. All reads are no-store and read-only.

`POST /help` accepts teamId, kind, targetId (null for general), subject and message. `POST /help/:requestId/events` accepts action, expectedVersion and message. Both require authenticated CSRF and Idempotency-Key. Only current authority is accepted, including on retries. Only commissioners/admins resolve; requesters withdraw; either may reply while open or reopen a closed request. Every event and original submission is retained. Notifications are private generic inbox notices; no external delivery occurs.

The dashboard and commissioner page contain an on-demand help panel. Target links do not add private-data permissions. Candidate Card help remains the existing explicit, time-limited grant from the card editor; the queue shows grant metadata and a deliberate card link, never card entries. General help supports older records beyond the recent target list.

## Recovery and season preview

`GET /management/recovery` returns at most 100 failed/interrupted operations with a full count, current FAD links, weeks needing correction/data, and 50 recent completed trades with a full count. It excludes payloads, raw errors and trade assets. Existing guarded FAD retry, trade reversal, result correction and roster tools remain authoritative. The derived-standings rebuild control uses the existing matchup API, current commissioner authorization, preview/version and a stable operation ID; replay returns the retained result even after the snapshot advances. Finalized canonical standings refuse rebuilds.

`GET /management/season-preview` is a current-state projection. It calls the same read-only rollover matrix used by execution, requires two distinct league-owned seasons, and hides individual trade proposals. Missing or inconsistent season/matrix state blocks exact player projections. No schedule is inferred or saved. The scheduled entry-draft transition retains final execution authority and all its readiness guards.

Admin `/operations/health` remains read-only/no-store and adds account-email queue counts, pending/running/failed/interrupted job totals and existing backup-attempt status. Raw delivery payloads and errors are not returned in these additions.

## Targeted administrator catalogue controls

`GET /api/v1/operations/catalogue?search=...` searches up to 50 saved players and returns 30 recent administrator catalogue receipts. Only a current platform administrator can use this global tool. `POST /preview` looks up a single numeric NHL ID at the fixed NHL player endpoint; it makes no database writes. Only validated skaters are supported. Existing NHL identity mappings are retained; a possible name/birth-date duplicate without a verified mapping refuses import rather than inventing a link.

`POST /apply` requires the reviewed state hash, reason and UUID operation ID. It fetches the source again, rechecks current authority and state inside the write transaction, and calls the existing catalogue writer. Only player/catalogue source records and supported eligibility revalidation occurrences may change. Ownerships, contracts, bids, cards and results are preserved. A confirmed position/status change may queue the existing eligibility checks. The import and its administrator receipt commit atomically. A saved retry returns the retained result without another provider request. Schema 82 adds immutable-update/delete guards for the administrator receipt without changing any existing records or SQL objects.

## Eligible administrative reversals

`GET /management/reversals` lists up to 100 roster/contract corrections. Preview and apply are explicit POST operations under that path. Current commissioner/admin authority and membership remain required. The original correction must belong to the current season; the current ownership/contract snapshot, including versions and year identities, must still match its recorded result. An already-reversed correction, later player transaction or incompatible dependencies refuses reversal. Events with an ambiguous identical timestamp conservatively require a fresh correction.

The preview displays current/restored values and roster/cap warnings. Confirmation rechecks the league/roster/contract/dependency hash and uses the existing correction repository, including its dependency, contract-year, roster-legality and Candidate Card summer synchronization rules. Original correction evidence remains. A team transfer creates a new ownership tenure rather than reusing a retired identity. Management history links the inverse correction; current members receive an in-app notice. Late-lock coordination runs after commit and an unresolved lock status is returned to the UI. A repeated key returns the retained result without repeating the inverse correction. Roster additions/removals and transactions with later dependencies use the existing specific correction/recovery tools instead of a blanket undo.


## Guided preseason restart

Schema 83 adds immutable encrypted archives and reset/restore actions. The commissioner page uses GET and POST preview/apply under /management/reset, requiring current commissioner or administrator authority, CSRF, a reason, a fresh preview and a typed league-name phrase. Reads and rehearsal previews never write. Reset requires a paused preseason league, an existing FAD, no played prior season or locked matchup, no entry draft, no claimed job and no unfinished delivery/request. It returns current season and teams to setup and clears only the explicit preseason gameplay table list. New dates remain unset. Manager accounts/access, team appearance, rules, communications, global records and other leagues are retained. The existing setup/start/calendar/readiness workflow opens the new FAD.

Before applying, the complete database is cloned in memory and the scoped reset and exact restoration are rehearsed with schema, foreign-key and protected-table fingerprints. The cleared snapshot is encrypted using AES-256-GCM with a purpose-derived key from the configured delivery encryption secret. League/archive/key-version identifiers are authenticated. Archives are never returned by HTTP or exports. Retain the configured encryption key when rotating secrets; an archive with a different or unavailable key fails closed. The synchronous rehearsal is bounded to a 256 MB database and a 24 MB scoped archive; larger databases require offline operation. Schema compatibility is explicit and must be reviewed with future migrations.

Apply, encrypted archive, immutable receipt, activity, inbox notices and invalidation are atomic. Unchanged retries return the original receipt. Restore requires the exact affected state and manager-access witnesses left by reset; later work is never overwritten. Restored gameplay state is exact, the league revision advances for client refresh, and competition remains paused. Original action history and communications remain. The history panel includes reset/restore receipts without private values.

Local evidence: core clone/reset/restore and protected second-league checks; authenticated HTTP read-only preview, role/CSRF denial, typed confirmation, injected late-failure rollback, encrypted archive privacy, exact retry, restore and later-work refusal, actual setup trade-deadline/start/calendar/readiness restart; archive tamper, cross-league, identity and key checks. Populated rehearsal includes awarded contracts and private bids and leaves the source byte-identical. Strict schema and route checks pass. Final frontend evidence is 877 passing tests and 46 desktop/mobile browser checks for the controls package. See the staging handoff for exact logs and backend regression reconciliation.


## Creation cutoff and missed roster-lock recovery

Schema84 permits an optional auctionCreationCutoffMinutes field (integer0..10080) in new confirmed schedule timing, retaining all existing schedule rows. It changes only the exact schedule-input guard and readiness-projection cutoff predicate. The opening writer stores the chosen gap in the existing scoped FAD cutoff settings before creating rounds. The immutable confirmed timetable retains its provenance. Older schedules default to60 minutes. Deadline override and late-worker hold use the configured gap so a0-minute gap supports15-minute rapid rounds. Open-card timing and future extension writers use the same effective gap; unknown fields and invalid values fail closed.

Calendar previews may recover an overdue roster lock only while every affected job is pending, never attempted and unleased, with no saved roster locks or results. The new boundary must be future. A preview explicitly warns about continued manager editing time and becomes stale if the old lock passes before confirmation. Dates, occurrence keys and next-attempt scheduling move atomically; the actual worker executes once at the new clock. Other elapsed or processed boundaries remain protected. This fixes a stale next_attempt_at_ms that otherwise could make a rescheduled job run at its old deadline.

Local verification: actual 15-minute/zero-gap FAD creation, hold, manual proceed, allocation and revised rollover workers pass. Missed Week 1 lock, changed preview boundary, current schedule bindings and once-only worker execution pass; policy cases cover pending work, existing results/locks and leases. The populated schema66-to84 migration and encrypted backup/isolated-restore rehearsal pass. The final frontend suite has 877 passing tests; initial outdated creation expectations were corrected. The staging handoff records exact runs and any superseded failures.

## Draft-bound calendar and Week 1 review

General calendar edits are refused while a current-season FAD is unfinished or
readiness has not yet created its draft. The read response explains this through
`blockedReason`; the UI disables the general editor. A completed draft takes
precedence over a stale unbound readiness row. This preserves the schedule used
by readiness and draft completion; dedicated FAD timing/recovery controls remain
available for their supported states.

Before cards open, the existing week endpoint accepts `preview_shift_week_one`.
Its read-only result includes affected dates, the current week version and a
preview hash bound to the actor and complete shift context. The website sends
that hash with `shift_week_one`, its If-Match version, a stable idempotency key
and the typed phrase `CHANGE WEEK 1 START`. Confirmation rechecks dependencies;
durable retries return their original result before evaluating mutable clocks.
Existing clients without the optional preview hash retain their established
guarded command contract.

A proposed shift must retain matchup count and pairings, exactly match the
canonical calendar through playoffs, and pass the FAD timetable recovery
planner. The actual readiness worker is tested after confirmation. Once cards
open, the existing explicit FAD recovery route remains authoritative.

Restricted-auction cancellation responses also remove private allocation
rankings, participant identities and draw evidence after validating the stored
result. This projection applies to fresh actions and historical retries without
rewriting immutable receipts. Cancellation retains its recovery identifiers and
status; viewing private offers still requires a separate audited reveal.
