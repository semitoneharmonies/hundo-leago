# Hundo Leago - Free Agent Draft Technical Specification

## Document Status

`APPROVED`

This technical specification defines the build contract for:

* annual automatic Free Agent Draft readiness and timing;
* Candidate Card persistence, carryover synchronization, privacy, and editing;
* manager-requested commissioner help;
* deadline locking and immutable snapshots;
* deterministic automatic allocation;
* restricted exact-tie auctions, fallback league-wide blind auctions, and open
  rapid auctions;
* durable jobs, recovery, completion, activity, notifications, and realtime
  invalidation;
* frontend routes, query boundaries, cache eviction, and accessibility;
* additive SQLite migration and test requirements.

Grae delegated the FAD implementation-design decisions to Codex on 2026-07-28.
This document records the resulting approved technical boundary. It does not
authorize coding by itself. A separate approved contained work plan is still
required before implementation begins.

On 2026-07-29, Grae approved the consolidated lifecycle, Candidate Card,
auction, schedule-recovery, Entry Draft pick-trading, and matchup-snapshot
amendments. This document incorporates that package as the controlling
technical contract.

On 2026-08-10, Grae approved the FAD-14 activity, notification, and realtime
clarification. Candidate Cards become fillable only after Entry Draft
completion, or the already-approved no-draft equivalent, and successful atomic
readiness commit. Each current accepted manager receives a private notification
for every participating team/card they manage; non-managers receive no card
notification and retain only normal League Activity visibility. The approved
opening publications and queued-nomination audiences below carry invalidation
metadata only and never disclose private card or auction content.

On 2026-08-11, Grae clarified that FAD and Entry Draft require only the
persisted player catalogue, including stable identity, display name, effective
position, and applicable eligibility/ownership/contract state. Current,
prior-season, and in-game statistics are not FAD inputs. A SportsDataIO paid
key, live probe manifest, live observation, signing secret, or capability
artifact is not a FAD-18 prerequisite. All later live-provider and immediate
late-lock-refresh language in this document is superseded for FAD deployment
and retained only as an unshipped historical matchup design. Provider-neutral
post-game scoring work is a separate follow-up.

For the preseason FAD-only staging candidate, the shared automatic
`matchup_occurrences` runner is disabled in full. Statistics refresh, baseline,
normal lock, finalization, and rollover occurrences do not execute. FAD, Entry
Draft, auction, trade, and outbox workers remain available subject to their own
gates. A later provider-neutral matchup/statistics slice must restore or split
the runner before automatic matchup processing is enabled.

On 2026-08-13, Grae replaced the row-command Candidate Card experience with a
compact whole-card draft. This amendment is controlling wherever the older
complete-entry-only or row-save language below conflicts with it:

* the private card remains exactly 12 Forward, 6 Defence, and 4 Bench slots;
* target route `T-146`,
  `PUT /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId`,
  replaces the complete 22-slot editable card draft atomically;
* the exact request body is `{ slots }`, where `slots` contains each canonical
  slot once and each item is `{ slotKey, candidate }`;
* `candidate` is either `null` or exactly
  `{ playerId, totalValueCents, termYears }`; a selected player is required for
  a non-null candidate, while total and term are independently nullable during
  preparation;
* `If-Match` carries the current quoted positive card version and
  `Idempotency-Key` carries one whole-card intent; one successful changed save
  advances the card version once and records one `candidate_card_saved`
  revision plus one scoped invalidation publication;
* every accepted new whole-card intent records one revision, including a
  logical no-op, while an idempotent replay returns that original result and a
  stale non-replay returns the normal precondition failure;
* the server validates all 22 rows before writing, rejects duplicate players,
  validates present money/term fields, rechecks player eligibility and slot
  compatibility, and commits every row or none;
* carryover occupants are server-owned. Their request item must have
  `candidate: null`; the save verifies and preserves them and cannot remove,
  replace, recontract, or move them;
* a candidate whose total, term, or both are null persists with null AAV,
  `eligibility_status = invalid`, and
  `validation_code = CANDIDATE_CONTRACT_INCOMPLETE`;
* only a candidate with both fields present and a valid derived AAV is an
  allocatable offer. Incomplete candidates remain visible when the card locks,
  copy into the immutable snapshot, receive an explicit invalid/not-won
  historical outcome, and never create ownership or a contract;
* additive migration 0050 rebuilds `candidate_card_entries`,
  `candidate_card_revisions`, and `candidate_card_snapshot_entries` under the
  approved foreign-key-rebuild protocol. It preserves all schema-49 rows,
  permits the nullable incomplete-candidate state, and adds the card-wide
  revision action without weakening complete-offer, carryover, actor,
  lifecycle, or immutable-history checks;
* T-135 through T-138 remain compatible transitional commands, but the compact
  frontend uses the whole-card PUT and exposes no row-level save, preview,
  submit, or lock-in control.

---

## Technical Purpose

The approved product rules in
`docs/03-product-specs/FREE_AGENT_DRAFT.md` require a league- and
season-scoped workflow that remains correct across:

* a long summer editing period;
* concurrent manager and help-authorized commissioner edits;
* a deadline that may pass while a process is restarting;
* hundreds of independent player decisions;
* restricted, fallback, and open auctions on at least seven persisted daily
  boundaries, with additional boundaries when queued or recovery work extends
  the FAD;
* manager assignment changes;
* daylight-saving transitions;
* partial operational failures and replay;
* multiple isolated leagues in one SQLite database.

The design must reuse the current roster, contract, auction, activity,
notification, outbox, job, authorization, and Socket.IO foundations without
turning the Candidate Card into a roster record or creating a second auction
engine.

---

## Product Authority

This specification implements, and may not override:

```text
docs/01-project/NORTH_STAR.md
docs/01-project/OPERATING_MODE.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/FREE_AGENT_DRAFT.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/07-testing/TESTING_STRATEGY.md
```

Where a shared technical document predates the approved FAD product rules,
this dedicated specification is the controlling FAD amendment.

---

## Current-System Facts

At the approval baseline, the `staging` implementation provided:

* Node.js, Express, and SQLite;
* authenticated sessions, CSRF, league membership, commissioner authority, and
  team-manager authority;
* league-scoped players, ownership, roster assignments, contracts, and contract
  years;
* weekly auctions, bids, resolution, activity, notifications, outbox events,
  and durable job runs;
* matchup weeks with persisted Week 1 timing;
* one existing nullable
  `seasons.free_agent_draft_completed_at_ms` lifecycle marker.

It did not provide Candidate Cards, automatic FAD readiness, deadline snapshots, help
grants, automatic allocation, auction participant restrictions, FAD rollovers,
or a writer for the completion marker.

The current auction implementation cannot be reused unchanged because it:

1. requires the regular season to have begun and FAD to be complete;
2. derives only weekly Monday-to-Sunday timing;
3. has no auction kind, FAD link, rollover link, participant allowlist,
   Candidate-minimum evidence, or allocation-linked fallback origin;
4. uses ordinary joining minimums for every created bid;
5. breaks exact ties by time and stable ID rather than the FAD-only
   equal-chance draw;
6. has no FAD allocation quarantine or private nomination queue.

Implementation must address those incompatibilities explicitly. It must not
work around them in frontend code.

---

## Required Pre-FAD Composition

The following approved target boundaries must be included as prerequisites in
the contained implementation work plan:

* `T-035` setup-only persistence of the commissioner-configured trade deadline,
  which must exist before initial league start;
* `T-036` initial league start, which atomically activates both a setup league
  and its sole planned current season after complete setup, team, manager, and
  launch-invitation validation;
* `T-037` lifecycle transition preparation, automatic scheduled Entry
  Draft-start execution, blocker persistence, idempotent retry, later-season
  rollover creation/current activation, and the one-time Season 2 no-draft
  exemption;
* committed cutover persistence of the one exact succeeded
  `migration_reports` row used by the original-league Season 2 exemption;
* the approved scheduled Entry Draft-start contract/ownership rollover that
  makes carryover state authoritative and gates both drafting and trading;
* `T-095` accepting the authorized actor's explicit complete NHL/playoff
  calendar plus `firstWeekStartsAtMs`, atomically filling an all-null initial
  season calendar or requiring an exact later-season match rather than
  silently deriving dates, plus `T-096` preserving historical FAD timestamps
  while allowing only approved server-owned whole-Monday Week 1 recovery;
* `T-081`, `T-082`, and `T-083` commissioner bid removal, auction cancellation,
  and manual durable resolution;
* context-aware platform-administrator auction authority;
* the shared multi-year contract-season planner defined below.
* a persisted player catalogue that supplies stable ID, display name,
  effective position, and FAD eligibility inputs without a statistics-provider
  call.

Neither Candidate Card opening nor any FAD route, job, allocation, auction, or
completion operation may depend on statistics availability. Zero is the
approved current-season semantic baseline, not an assertion that the current
runtime already materializes or projects zero rows. FAD ignores statistics,
keeps live-statistics composition disabled, and runs without the shared
automatic matchup-occurrence runner. Its `statistics_refresh`, `baseline`,
`normal_lock`, `finalize`, and matchup-week `rollover` occurrences all remain
off; the Entry Draft season-rollover, FAD, auction, trade, and outbox workers
remain available subject to their own gates.

Automatic FAD readiness cannot be composed until its lifecycle and rollover
prerequisites are composed. Restricted and fallback auctions cannot become
Active until all three
administration/recovery routes are composed and tested. Calling a route a
target contract in this document never implies it already exists in the
runtime.

---

# Part 1 - Architecture and Ownership

## Backend Module Boundary

Create a dedicated FAD module:

```text
src/domain/freeAgentDraft/
  freeAgentDraftPolicy.js
  candidateCardPolicy.js
  candidateAllocationPolicy.js
  freeAgentDraftAuctionDrawPolicy.js
  freeAgentDraftScheduleRecoveryPolicy.js

src/application/services/freeAgentDraft/
  createFreeAgentDraftReadinessService.js
  createCandidateCardService.js
  createFreeAgentDraftNominationQueueService.js
  createFreeAgentDraftRecoveryService.js
  createFreeAgentDraftCorrectionService.js

src/infrastructure/persistence/sqlite/
  SqliteFreeAgentDraftRepository.js
  SqliteCandidateCardRepository.js
  SqliteFreeAgentDraftJobRepository.js

src/jobs/definitions/
  revalidateFreeAgentDraftCandidateEligibility.js
  openReadyFreeAgentDraftCandidateCards.js
  sendFreeAgentDraftDeadlineReminders.js
  lockFreeAgentDraftDeadlines.js
  allocateFreeAgentDraftPlayers.js
  activateFreeAgentDraftRestrictedAuctions.js
  openQueuedFreeAgentDraftNominations.js
  activateFreeAgentDraftFallbackAuctions.js
  finalizeFreeAgentDraftRollovers.js
  completeFreeAgentDrafts.js

src/transport/http/
  createFreeAgentDraftRouter.js
```

Exact filenames may be split when one file becomes too large, but the
responsibilities and dependency direction are fixed.

The FAD module owns:

* readiness prerequisites and the frozen FAD clock;
* participating-team snapshots;
* Candidate Cards, entries, revisions, snapshots, and help grants;
* allocation ranking and per-player state;
* restricted-auction eligibility, participant-minimum evidence, delayed activation,
  no-improvement fallback, private final-hour nomination queues, and FAD
  recovery;
* seven initial rapid rollover records plus any contiguous extension records;
* approved server-owned Week 1 recovery after late Entry Draft completion or
  delayed FAD completion;
* FAD completion.

The existing modules remain authoritative for:

* player identity and effective position;
* ownership and prospect-right availability;
* roster placement and legality;
* contract validation, AAV, contract years, and buyout locks;
* auction bid storage and ordinary auction pricing;
* League Activity, notifications, outbox publication, and Socket.IO;
* membership, manager, commissioner, and platform-administrator authority;
* matchup timing and schedule records.

The matchup module also owns immutable weekly roster snapshots and the
late-legality rule that excludes a player for an entire NHL game already
underway when the late snapshot commits.

---

## Auction Extension Boundary

There is one auction engine.

Every auction receives a server-owned context:

```text
ordinary_weekly
fad_open_rapid
fad_restricted
```

The browser never selects:

* auction context;
* FAD;
* target season;
* rollover;
* restricted participants;
* participant minimums;
* edit limit;
* cooldown anchor;
* original-total floor;
* draw result.

The existing auction routes remain the bidding boundary. Context-aware domain
policies select timing, eligibility, edit, ranking, pricing, and completion
rules. Common auction completion primitives continue to create contracts,
ownership, roster assignment, activity, and outbox records atomically.

---

## Shared Contract-Season Planner

Automatic FAD awards and all FAD auction wins use one shared
`ContractSeasonPlanner`; the ordinary auction completion path is refactored to
use it too. It never parses `seasons.label`.

The planner requires canonical `nhl_season_key` format `YYYYYYYY`, where the
last four-digit year is exactly one greater than the first. For target key
`20262027`, contract offsets resolve to `20262027`, `20272028`, and
`20282029`. The migration adds verified uniqueness on
`(league_id, nhl_season_key)`.

For each required contract year, the atomic completion transaction:

1. reuses the one same-league season with the exact key when present;
2. creates a missing future row as `planned`, with no dates and canonical label
   `YYYY-YY`;
3. never changes `leagues.current_season_id` or activates the future row;
4. fails before any contract/ownership effect when a key is malformed,
   duplicated, ambiguous, or collides with a different canonical label.

The first planned year must be the FAD target/current active preseason season.
One-, two-, and three-year schedules therefore use stable season IDs and
canonical NHL season order regardless of display-label format. The current
`Number(seasons.label)` completion behavior is incompatible and must be removed
before any FAD contract path is composed.

---

## Composition

All FAD repositories, services, routes, jobs, and auction-context dependencies
are composed through:

```text
src/bootstrap/createTargetRuntime.js
```

Every new table is added to:

```text
src/infrastructure/persistence/sqlite/repositoryCatalog.js
```

The runtime must continue to fail closed when the actual SQLite table set or
schema version is incompatible.

---

# Part 2 - Lifecycle and Clock

## Persisted FAD Status

`free_agent_drafts.status` uses exactly:

```text
cards_open
deadline_locked
allocating
rapid
completed
```

Meaning:

| Status | Meaning |
| --- | --- |
| `cards_open` | Cards exist and selectable entries may be edited before the deadline |
| `deadline_locked` | The deadline snapshot committed and allocation rows exist |
| `allocating` | One or more per-player allocation operations are being processed |
| `rapid` | Every player allocation has left `pending`; rapid auctions are operating |
| `completed` | Every initial and extension rollover plus every FAD path is terminal, and any required Week 1 recovery committed atomically with completion |

There is no normal unlock, reopen, delete, or cancellation transition after
automatic readiness opens the cards. Failure is represented by player,
recovery, rollover, job, and operational records rather than by reopening
cards.

---

## Derived Viewer Phase

The API derives a viewer phase from persisted state and the injected server
clock:

```text
inactive
cards_open
help_window
deadline_processing
allocating
rapid
completed
```

`help_window` is a presentation phase within persisted `cards_open`.

If server time has reached the Candidate Card deadline but the durable deadline
job has not committed, the phase is `deadline_processing`:

* card writes are rejected immediately by the clock boundary;
* cards are not reopened;
* other teams' cards are not exposed from an uncommitted snapshot;
* the UI displays an awaiting-server-confirmation state;
* a GET does not run the deadline job.

---

## Continuing-Season Scheduled Rollover Prerequisite

For every continuing league season after the original Season 2 reset
transition, `T-037` is the one shared atomic rollover service. It is invoked
only by the durable scheduled Entry Draft-start job or by the commissioner
retry route after that occurrence has failed. There is no public command that
rolls contract years merely because the competition season ended.

The Entry Draft setup flow may create or reuse the planned target season,
persist its approved calendar, prepare order, eligible pool, pick ownership,
and private queues, and schedule the draft before rollover. Scheduling binds
the draft to one source season, one planned target season, and one immutable
rollover occurrence. Draft selection and every trading command remain locked.

The internal T-037 execution input is:

```json
{
  "transitionType": "execute_scheduled_entry_draft_rollover",
  "entryDraftId": "opaque-uuid",
  "rolloverOccurrenceId": "opaque-uuid"
}
```

The leased job envelope separately supplies the persisted job-run ID,
canonical occurrence key, scheduled instant, lease owner/token, and expected
job version. The service resolves and revalidates the source season, planned
target season, calendar, schedule, gates, and scheduling authority from
persisted state; none is accepted as command input.

The retry HTTP command supplies the same persisted draft and occurrence
identity, requires `If-Match` for the current draft version and
`Idempotency-Key`, and sets `trigger = commissioner_retry`. Retry authority is
the current commissioner or an inherited platform administrator with active
membership in the league. The scheduled path has system execution authority
and is idempotent by occurrence key. Both paths preserve the league's exact
`active` or `frozen` status and any active freeze rather than opening or
closing unrelated league operations.

The rollover root preserves the Entry Draft schedule authorization and the
actual execution trigger. A scheduled execution records `system`; a retry
records the retrying commissioner authority. Neither path attributes the
automatic contract effects to a manager.

Before any write, the transaction verifies:

* `fromSeasonId` is the league's one current active season;
* exactly one same-league FAD exists for the source season, its status is
  `completed`, its `completed_at_ms` is non-null, and that instant exactly
  equals `seasons.free_agent_draft_completed_at_ms`;
* every persisted source-FAD rapid-rollover row, including the seven initial
  rows and any contiguous extension rows, is `completed`; every allocation is
  `automatic_award`, `restricted_resolved`, `fallback_open_resolved`,
  `no_valid_offer`, or `invalid`; every FAD recovery is `resolved`; and no
  correction-required or quarantined FAD state remains;
* every source-FAD nomination queue row is `opened` or `invalid`, every opened
  row links its exact terminal auction, and no queued row remains;
* when FAD completion moved Week 1, the immutable schedule-recovery operation,
  old/new schedule versions, removed weeks, and replacement job identities all
  agree with the current source-season schedule; otherwise no recovery link is
  present;
* every FAD-linked or ordinary source-season auction is `resolved`,
  `no_winner`, or `cancelled`, has exactly one matching
  `auction_resolutions` row with a valid status/outcome pairing, and has no
  active bid state that contradicts that terminal result; `open`, `resolving`,
  and `failed` auctions block;
* every source-season matchup week and matchup is `final`, every matchup result
  is `official` or `corrected`, and no unresolved matchup recovery remains;
* every source-season `matchup_operations` row is `succeeded` or `skipped`
  with coherent completion evidence; `started` or `failed` blocks. Every
  source-season `standings_operations` row is `succeeded` with coherent
  completion evidence; `started` or `failed` blocks. Any other season-scoped
  operation table must satisfy its documented semantic terminal set, and an
  unknown operation type or status fails closed;
* exactly one valid current final-standings generation exists. Its unbroken
  direct replacement lineage begins with the one succeeded
  `regular_season_completion` T-145 operation and may continue only through
  succeeded T-097 `result_correction` replacements. The transaction validates
  the current generation's snapshot, row and team-identity counts, standings
  rule, result-set hash, and exact one-to-one current result-version links. A
  correction descendant is the canonical current generation; the original
  T-145 snapshot is required to remain as its valid root, not to remain the
  current snapshot;
* every source-season `job_runs` row, regardless of job family, has coherent
  terminal evidence. `pending`, `leased`, and `running` block.
  `succeeded` qualifies only with its required completed timestamp/result shape
  and no live lease. A documented completed `skipped` outcome must satisfy its
  own terminal shape. An untouched matchup occurrence skipped solely because
  its schedule generation was superseded instead qualifies only when
  `attempt_count = 0`, every lease/start/completion/result/error field and
  `next_attempt_at_ms` is null, its immutable binding names a superseded
  generation, and a later exact current generation exists for that
  league-season. This exception never manufactures completed evidence and does
  not admit an arbitrary incomplete skipped job. A `failed` row qualifies only
  when it is the exact causal job of a same-FAD recovery chain, every linked
  recovery in that chain is `resolved`, and the recovered semantic resource
  now satisfies its terminal predicate; every other `failed` row blocks;
* a storage-status `proposed` trade that references a contract, ownership,
  retention, or buyout asset expiring or being released by this rollover is
  cancelled inside the transaction. Any other `proposed` trade blocks.
  Storage statuses `accepted` and `correction_required` also block because the
  current execution model never leaves a successful accepted proposal in
  `accepted`; `declined`, `cancelled`, `expired`, `completed`, and `reversed`
  are terminal history;
* `targetNhlSeasonKey` is the canonical consecutive key after the source
  season;
* the source season has a complete canonical calendar with
  `regular start < playoff start < playoff end = regular end`, the source
  playoffs span exactly 28 elapsed days, the persisted Entry Draft start and
  injected execution time are at or after that shared source end, and the
  target regular-season start is strictly after it. T-037 does not support an
  accelerated early rollover or overlapping competition seasons;
* for both source and target, the UTC year of regular-season start equals the
  first four digits of its NHL key, while the UTC year of playoff start,
  playoff end, and regular-season end equals the last four digits. This is an
  identity check, not an inferred or substituted schedule;
* the four persisted target NHL/playoff calendar instants are safe UTC integers and
  satisfy
  `nhlRegularSeasonStartsAtMs < fantasyPlayoffsStartAtMs <
  fantasyPlayoffsEndAtMs = nhlRegularSeasonEndsAtMs`;
* `fantasyPlayoffsEndAtMs - fantasyPlayoffsStartAtMs` is exactly
  `28 * 24 * 60 * 60 * 1000` elapsed milliseconds; the service does not infer
  or substitute calendar instants from `targetNhlSeasonKey`;
* the league timezone is a valid persisted IANA zone, target
  `fantasyPlayoffsStartAtMs` is Monday 12:00 AM in that zone, and at least one
  league-local Monday Week 1 choice exists before fantasy playoffs. Rollover
  does not require a nine-day lead. After Entry Draft completion, the FAD
  readiness service advances Week 1 by whole league-local Mondays until the
  Candidate deadline is future-facing and the complete seven-day FAD period
  fits;
* target lookup uses both `(league_id, nhl_season_key)` and
  `(league_id, canonical label)`. Both identities resolve to the same one
  unactivated `planned` row already bound to the scheduled Entry Draft; an
  absent target, key/label split, or duplicate is rejected before a write;
* the target's four calendar columns are complete and exactly equal the
  calendar bound when the Entry Draft was scheduled. A null, partial, or
  mismatched tuple is rejected; T-037 accepts no calendar override;
* the planned target contains no competition or lifecycle state other than
  approved `future` contract, retention, and buyout year rows plus approved
  future draft-pick ownership/history rows, its one prepared `Scheduled` Entry
  Draft and setup children, its exact start job, and an approved prebuilt
  matchup schedule. It has no played matchup, result, standings, finalization,
  FAD, Candidate Card, allocation, FAD auction/result/rollover, unrelated
  operation/recovery, target-season player ownership, setup exemption, or
  prior season-rollover child;
* contract, ownership, retention, buyout, team, and trade rows are internally
  consistent and belong to the same league.

The same preflight freezes a canonical `sourceReadiness` projection before
any rollover effect is applied. It is the durable proof of the exact completed
FAD, final-standings generation, and terminal competition state that
authorized this transition; later approved correction or recovery work on the
completed source season does not rewrite the historical proof.

`sourceReadiness` contains exactly:

```text
leagueId
fromSeasonId
observedAtMs
sourceFadId
sourceFadCompletedAtMs
sourceFinalizationRootId
sourceFinalizationId
sourceStandingsSnapshotId
sourceStandingsOperationId
recognizedSeasonOperationTables
freeAgentDraft
freeAgentDraftReadinessOperation
freeAgentDraftTeams
candidateCards
candidateCardEntries
candidateCardRevisions
candidateCardHelpRequests
candidateCardSnapshots
candidateCardSnapshotEntries
freeAgentDraftPlayerAllocations
freeAgentDraftAllocationEvents
freeAgentDraftRollovers
freeAgentDraftNominationQueue
freeAgentDraftRecoveries
auctionContexts
freeAgentDraftAuctionParticipants
freeAgentDraftDraws
auctions
auctionBids
auctionResolutions
matchupWeeks
matchups
matchupResults
matchupResultVersions
matchupOperations
standingsOperations
jobRuns
trades
tradeAssets
finalStandingsFinalizations
standingsSnapshots
standingsRows
standingsSnapshotTeamIdentities
standingsSnapshotResultVersions
finalizationIdempotencyRequests
```

`observedAtMs` equals `completedAtMs`.
`recognizedSeasonOperationTables` is exactly
`["matchup_operations","standings_operations"]` for readiness schema version
1; a later migration that adds another season-scoped operation family must
version and extend this closed list before rollover may proceed.

`freeAgentDraft` is the complete persisted source-FAD row. Every other
collection contains the complete persisted schema-29 row projection for every
same-league/source-season row in that table that the readiness validator
examines, including explicit nulls. Projection keys are the exact SQLite
column names in `snake_case`; SQLite JSON text columns remain exact strings so
their stored bytes are bound rather than reparsed or normalized. Supporting
auction rows are limited to the source-season auctions in the projection.
The one binary exception is
`standings_snapshot_team_identities.logo_content_bytes`: that BLOB is omitted
from its projected row to avoid duplicating up to 512 KiB per participant.
The projection retains `logo_byte_length` and `logo_content_sha256`. A no-logo
identity encodes both as JSON null; an empty BLOB is invalid under the source
table contract and has no encoding. For a non-null BLOB, the repository
requires its byte length to equal `logo_byte_length` and recomputes lowercase
SHA-256 over the raw bytes to equal `logo_content_sha256` before the row may
enter the projection.
Final-standings collections contain the complete direct lineage from the one
root finalization through the canonical current descendant, every linked
snapshot/operation/idempotency row, every linked snapshot's standings rows
and team identities, and every lineage result-version link plus its referenced
matchup-result version. The general matchup/result arrays still contain every
source-season root required to prove terminal state and current-version
pointers.

Arrays use these exact ascending orders, with the final listed ID as the
deterministic tiebreak:

```text
readiness operations               created_at_ms, id
FAD teams                          team_id, id
Candidate Cards                    team_id, id
Candidate entries                  card_id, requested_slot_group,
                                   requested_slot_number, id
Candidate revisions                card_id, resulting_card_version, id
Candidate help requests             card_id, requested_at_ms, id
Candidate snapshots                 team_id, id
Candidate snapshot entries          snapshot_id, slot_key, id
allocations                       player_id, id
allocation events                 allocation_id, occurred_at_ms, id
FAD rollovers                     sequence, id
nomination queue                  accepted_at_ms, id
FAD recoveries                    created_at_ms, id
auction contexts                  auction_id, id
restricted participants           auction_id, team_id, id
draws                             auction_id, id
auctions                          id
auction bids                      auction_id, team_id, id
auction resolutions               auction_id, id
matchup weeks                     sequence, id
matchups                          matchup_week_id, id
matchup results                   matchup_id, id
matchup result versions           matchup_result_id, version_number, id
matchup operations                started_at_ms, id
standings operations              started_at_ms, id
job runs                          job_type, occurrence_key, id
trades                            id
trade assets                      trade_id, sequence, id
finalizations                     finalization_version, id
standings snapshots               snapshot_version, id
standings rows                    standings_snapshot_id, rank, team_id, id
team identities                   standings_snapshot_id, team_id, id
snapshot result-version links     standings_snapshot_id, matchup_id, id
finalization idempotency          id
```

The readiness hash is lowercase SHA-256 over canonical JSON exactly:

```json
{
  "domain": "hundo-leago.season-rollover-source-readiness",
  "schemaVersion": 1,
  "sourceReadiness": "<the projection above>"
}
```

Here the quoted placeholder denotes the projection object, not a JSON string.
The dedicated repository reads and validates all prerequisite rows, constructs
this projection, and computes the hash in Node inside the same
`BEGIN IMMEDIATE` that performs the rollover. The immutable rollover root
stores the exact canonical projection JSON, schema version, and hash, plus
same-league foreign-key links to the source FAD, lineage root finalization,
canonical finalization, canonical snapshot, and canonical standings
operation. Referenced final-standings evidence keeps its existing immutability
and supersession rules; other source rows remain available to later approved
correction/recovery services because the frozen projection, rather than a
blanket live-row lock, preserves what T-037 observed.

The preflight contract/ownership matrix is total rather than one-way:

* ownership kind and roster category are exact if-and-only-if pairs:
  `Rostered` if and only if Active, Bench, or Injured Reserve, and
  `Prospect Right` if and only if Prospect;
* every Active, Bench, or Injured Reserve `Rostered` ownership has exactly one
  same-league, same-player, same-team active contract and exactly one source
  `current` contract year;
* every Prospect Right or Prospect ownership has either no active contract
  when unsigned, or exactly one same-team active `fantasy_elc` contract with
  exactly one source `current` year when signed; an active normal contract is
  never a valid prospect contract;
* every active contract has exactly one current ownership matching
  `current_team_id` and one of those allowed shapes;
* every roster display-order entry that references a live ownership has a
  same-league order set and is included in that ownership's frozen rollover
  plan; an orphan or cross-league display preference rejects;
* current and future contract, retention, and buyout years are unique,
  consecutive, correctly ordered, and agree with their parent status. Every
  active retention or buyout parent has exactly one source `current` year and
  at most one exact target `future` year. A completed or cancelled parent has
  no `current` or `future` year. Retention years never extend beyond the
  underlying contract schedule and every retention/buyout year amount agrees
  with its parent or approved schedule;
* every active buyout obligation links the same-player underlying contract in
  `eliminated` status. Its current/future penalty years correspond exactly to
  the underlying contract years eliminated at the buyout for those season IDs,
  and each penalty equals the approved annual basis. The old eliminated
  contract has no roster ownership; a later re-signing is a distinct contract
  and is validated independently;
* an active retention obligation on an active contract has current/future
  season IDs exactly matching that contract's current/future years. When the
  underlying contract was eliminated by buyout, existing retention remains
  active unchanged and its current/future years instead match the remaining
  eliminated year season IDs through the original term. An active retention
  obligation cannot point to an expired/cancelled contract or extend beyond
  either approved schedule.

Any orphan, duplicate, mismatched team, signed-prospect error, malformed year
schedule, or cross-league link returns `409 SEASON_ROLLOVER_NOT_READY`.

The Entry Draft start occurrence runs one outer `BEGIN IMMEDIATE` transaction.
Within it, T-037:

1. reuses the one canonical same-key planned season already bound to the
   Entry Draft, including its persisted NHL/playoff calendar and approved
   prebuilt matchup schedule; it never creates a target season or accepts a
   replacement calendar;
2. marks the source season `completed`, marks the target season `active`, sets
   `leagues.current_season_id` to the target, and increments the league and
   season versions, without creating, choosing, or rewriting Week 1.
   The league changes only current-season ID, `updated_at_ms = completedAtMs`,
   and `version + 1`; status, commissioner, timezone, settings, and freeze are
   preserved. The source changes only status, updated time, and version and
   preserves its calendar and FAD completion marker. The target changes only
   status, updated time, and version and preserves its calendar and schedule.
   It requires `free_agent_draft_completed_at_ms = NULL`;
3. marks every source-season current contract year `completed` when the exact
   target future year exists, sets its `rollover_at_ms = completedAtMs`, makes
   that target year `current` while leaving the target year's
   `rollover_at_ms = NULL`, and preserves the active contract;
4. otherwise marks the final source contract year `expired` with
   `rollover_at_ms = completedAtMs`, marks the contract `expired`, and freezes
   the player's roster-ownership release plan;
5. for every active retention and buyout parent, marks its source current year
   `completed`. If an exact target future year exists, it becomes `current`
   and the parent remains `active`; otherwise the parent becomes `completed`.
   Amounts, contract/player links, originating and responsible teams, and all
   historical years are preserved;
6. deletes every mutable `roster_display_order_entries` row that references
   any carried or released ownership, preserving its exact before-image in
   that ownership's manifest item. Empty season-scoped display-order sets may
   remain and a target-season preference can be created later. It then moves
   surviving Active, Bench, Injured Reserve, and Prospect ownerships to the
   target season by changing only `season_id`, `updated_at_ms`, and
   `version + 1`. Stable ID, player, team, ownership kind, roster category,
   position group, nullable slot including a confirmed overage, acquisition
   type/ID, `trade_blocked`, and prospect-right meaning remain exact.
   Ownership has no `contract_id` column; for signed players, the derived
   same-league/player/team matching-contract relationship remains valid under
   the total matrix;
7. cancels every qualifying proposed trade that references an asset expired,
   released, or an obligation completed by this transaction;
8. increments `version` exactly once and sets `updated_at_ms` to the rollover
   instant on every affected surviving contract, carried ownership, retention
   obligation, buyout obligation, and cancelled trade root. Year rows use
   exact old-status/season predicates and asserted affected counts because
   they have no versions. A released ownership is deleted only after its
   immutable before-version and deletion result are recorded;
9. appends the exact contract, ownership, trade, Security Audit, approved
   League Activity, immutable rollover-item manifest, and metadata-only outbox
   evidence. The immutable `season_rollovers` root is the season-transition
   evidence; the item manifest is the retention/buyout history because those
   obligations have no separate event table. Each released ownership is
   deleted—and the player becomes a free agent—only after its exact ownership
   event and manifest tombstone have been inserted;
10. inserts one succeeded `season_rollovers` row. A scheduled execution binds
    the row to its persisted occurrence and system job evidence; a
    commissioner retry also completes its bound HTTP idempotency request last;
11. verifies the succeeded rollover evidence, opens target-season trading,
    changes the prepared Entry Draft from `Scheduled` to `Live`, starts its
    first pick clock, records the Entry Draft start occurrence as succeeded,
    and commits all effects together.

No observer can see rolled contract years while the Entry Draft remains
`Scheduled`, or a live Entry Draft while rollover evidence is missing. A
failure in any step rolls back the entire outer transaction, leaves draft
selection and trading locked, and records a safe blocker result for
commissioner retry outside the failed transaction.

Every advanced contract appends `contract_year_advanced`; every expired
contract appends `contract_expired`; every carried ownership appends
`ownership_carried_to_season`; and every released ownership appends
`player_released_by_contract_expiration`. These events use
`source_type = season_rollover`, `source_id = rolloverId`, exact before/after
versions and season/team/status fields, and `actor_user_id = NULL`. A carried
ownership event uses the target season; a released-ownership event uses the
source season. Contract events have no season column. Every emitted contract,
ownership, and trade event has
`occurred_at_ms = completedAtMs`; every affected parent has
`updated_at_ms = completedAtMs`.

An expired contract changes only status, `updated_at_ms`, and `version + 1`.
Its original value, AAV, term, type, start season, acquisition source, buyout
lock, and former `current_team_id` remain durable history. A released
ownership is deleted only after its exact before-image, event, and manifest
item have been written.

A rollover-cancelled trade must begin `proposed` with
`responded_at_ms = completed_at_ms = commissioner_completion_reference = NULL`.
It changes only status to `cancelled`,
`responded_at_ms = updated_at_ms = completedAtMs`, and `version + 1`;
season, teams, proposing user, creation authority/membership, proposal model,
deadlines, creation time, assets, snapshots, requested retention, and null
completion/commissioner fields are preserved.

All T-037 domain-event JSON is stored in exact `canonical-json-v1` form.
`contract_events.metadata_json` contains exactly `schemaVersion = 1`,
`rolloverId`, `rolloverItemId`, `fromSeasonId`, `toSeasonId`, `before`, and
`after`; its `before`/`after` values equal the linked item projections and
`reason = season_rollover`. `ownership_events.before_metadata_json` and
`after_metadata_json` are exactly the linked item `before` and `after`
projections; `reason = season_rollover`.
`trade_events.metadata_json` contains exactly `schemaVersion = 1`,
`rolloverId`, `rolloverItemId`, `fromSeasonId`, `toSeasonId`, `before`,
`after`, and the identical sorted `causalAssets`; its reason is
`asset_expired_during_season_rollover`. No linked event may contain an
additional metadata key.

Each expired contract also writes one League Activity row with
`event_type = contract_expired`, `related_type = contract`, the contract ID,
source season, former team and player columns, `actor_user_id = NULL`,
`actor_authority = system`, and summary
`Contract expired; player released.` Its metadata contains exactly
`rolloverId`, `contractId`, `ownershipId`, `expiredAavCents`,
`originalTermYears`, and `rosterRemoval = released`.

Each rollover-cancelled proposal writes `proposal_auto_cancelled` trade history
with source season, `actor_user_id = NULL`, and reason
`asset_expired_during_season_rollover` and one source-season League Activity
row with `event_type = trade_proposal_automatically_cancelled`,
`related_type = trade`, the trade ID, `actor_user_id = NULL`,
`actor_authority = system`, and summary
`Trade proposal automatically cancelled.` Its metadata contains exactly
`rolloverId`, `proposalId`, `fromStatus = Pending`,
`toStatus = Automatically Cancelled`, and
`reasonCode = asset_expired_during_season_rollover`, plus `causalAssets`.
`causalAssets` is a nonempty array sorted by trade-asset sequence then
rollover-item ID; each item contains exactly `tradeAssetSequence`,
`tradeAssetType`, and `rolloverItemId`. `tradeAssetType` is exactly one of
`contract`, `prospect_right`, `retention_obligation`, `buyout_obligation`, or
`requested_retention`; the other persisted trade-asset types cannot cause
rollover cancellation. Exactly one causal entry is allowed for each unique
trade-asset sequence. A `contract` asset maps to its `contract_expired` item,
`prospect_right` maps by player to its `ownership_released` item,
`retention_obligation` and `buyout_obligation` map to their respective
completed-obligation items, and a `requested_retention` asset whose paired
`requested_retention_contract_id` expires maps to that `contract_expired`
item. One proposal affected by multiple causal assets still creates exactly
one cancelled trade, manifest item, trade event, activity row, and
`tradesCancelled` count.

In addition to those required player/trade history rows, rollover writes
exactly one aggregate League Activity row with
`event_type = season_rolled_over`, `related_type = season`, and
`related_id = toSeasonId`, on the target season. Scheduled execution records
`actor_user_id = NULL` and `actor_authority = system`; commissioner retry
records the retrying user and their inherited authority. Its summary is exactly
`Season <fromLabel> completed; <toLabel> is now active.` Its metadata contains
exactly `rolloverId`, `fromSeasonId`, `toSeasonId`, `targetNhlSeasonKey`, and
the nine-count `summary` object returned by the command. The matching Security
Audit event type is `league.season_rolled_over`. The whole transaction writes
one league-scoped metadata-only `league.changed` outbox invalidation; the
multiple activity rows do not create duplicate invalidations. No per-player
expiration notification is created.

The rollover Security Audit row has `outcome = success`, route league, no
target user, and `occurred_at_ms = completedAtMs`. Scheduled execution records
system job/occurrence evidence and
`reason_code = scheduled_entry_draft_rollover`; commissioner retry records the
retrying user, normal authenticated request/session/network fields,
idempotency request hash, and
`reason_code = season_rollover_retry_authorized`. The rollover root stores its
exact audit row ID and discriminated trigger evidence. Through the root's
occurrence or idempotency link and manifest links, that audit is bound to both
season IDs, rollover ID, manifest hash, and all nine counts.

No manager receives a separate upcoming-expiration notification. If any
precondition or write fails, neither season changes status and no contract,
ownership, obligation, trade, evidence, or event advances.

The committed execution result contains exactly:

```text
rolloverId
rolloverAttemptId
leagueId
fromSeasonId
toSeasonId
fromSeasonStatus                completed
toSeasonStatus                  active
targetNhlSeasonKey
nhlRegularSeasonStartsAtMs
nhlRegularSeasonEndsAtMs
fantasyPlayoffsStartAtMs
fantasyPlayoffsEndAtMs
sourceFadId
sourceFinalizationRootId
sourceFinalizationId
sourceStandingsSnapshotId
sourceStandingsOperationId
sourceReadinessSchemaVersion
sourceReadinessSha256
entryDraftId
entryDraftRolloverBindingId
rolloverOccurrenceId
scheduledStartsAtMs
occurrenceKey
targetScheduleId
targetScheduleVersion
weekOneMatchupWeekId
weekOneStartsAtMs
trigger                           scheduled_job | commissioner_retry
leagueVersion
fromSeasonVersion
toSeasonVersion
entryDraftVersion
firstPickClockId
completedAtMs
retryAuthorizedByUserId          nullable; required only for commissioner_retry
retryAuthorizedAuthority         nullable; required only for commissioner_retry
summary
version
```

`summary` contains exactly:

```text
contractsAdvanced
contractsExpired
ownershipsCarried
ownershipsReleased
retentionYearsAdvanced
retentionObligationsCompleted
buyoutYearsAdvanced
buyoutObligationsCompleted
tradesCancelled
```

The scheduled occurrence replays by occurrence key and commissioner retry
replays by idempotency key; both return the original immutable execution
result, including its original versions, calendar, counts, and completion
instant. The commissioner retry route returns `202` when it accepts or replays
the operation. Malformed retry input is `400`; missing retry authority is
`403`; cross-league identity is side-channel-safe `404`; a nonterminal or
inconsistent source, nonconsecutive target, conflicting planned season, target
with no usable Week 1, or previously consumed source is
`409 SEASON_ROLLOVER_NOT_READY`; and a stale Entry Draft version is `412`.

The automatic FAD readiness operation treats rollover as complete only when:

* the target is the one current active season and its immediate prior season
  is completed;
* exactly one succeeded `season_rollovers` row links those two seasons;
* that row's immutable source-readiness JSON is canonical schema version 1,
  its Node-recomputed SHA-256 matches, and its five stored source FAD/
  finalization identity links equal the projection. Later approved changes to
  the completed source season do not require the projection to equal current
  source rows;
* the rollover has one immutable version-1 manifest whose recomputed canonical
  SHA-256 and per-kind cardinalities agree with its nine summary counts;
* no source-season contract, retention, or buyout year remains `current`;
* every active target-season contract has exactly one target `current` year
  and one matching current ownership under the total matrix above;
* every target Active, Bench, Injured Reserve, Prospect Right, and Prospect
  ownership satisfies that total matrix;
* every expired source normal or fantasy-ELC contract has an exact rollover
  release tombstone and its released ownership ID remains absent. A later
  valid summer acquisition may create a distinct target-season contract and
  ownership for the same player; that new pair is accepted only through the
  independent current total matrix;
* the immutable manifest remains internally valid, and an independent
  whole-league current-state check proves the total contract/ownership/
  prospect/obligation structure at readiness time. Version-by-version lineage from
  the manifest to current mutable rows is not a readiness predicate. Valid later
  same-league Entry Draft, trade, correction, roster, or contract transactions
  may advance versions and ownership after rollover; readiness does not require
  mutable live rows to remain byte-equal to the historical snapshot.

An inaugural league and the original league's reset-created initial Season 2
have no persisted prior league season and therefore require no
`season_rollovers` row. Their approved no-draft transition invokes the same
all-or-none FAD readiness operation directly after its own evidence commits.
Readiness never performs or repairs season rollover.

---

## Automatic Readiness Clock

The FAD has no hard-coded season date or calendar default. Before Candidate
Cards can open, an authorized commissioner or inherited platform administrator
uses the approved matchup-schedule command to supply the complete NHL/playoff
calendar and the target season's first matchup start. For an inaugural or
reset-created season whose calendar is all null, confirmed schedule creation
atomically persists that exact calendar with the schedule; for a continuing
planned season, the supplied tuple must exactly match the already-persisted
calendar.

Confirmed `T-095` creation and `T-096` Week 1 movement each persist one
immutable schedule-command result linked to the exact idempotency request,
request hash, actor, affected schedule generation, and before/after aggregate
versions. Exact replay reads that row rather than reconstructing a response from
the current schedule, so a later approved shift or server-owned recovery cannot
change the original response.

FAD-08 supplies one internal, transaction-bound readiness-handoff primitive.
It uses the caller's existing write transaction and does not commit, roll back,
or open a second connection. It validates the authoritative trigger source,
then creates or idempotently reuses exactly one canonical readiness operation
and pending `fad_readiness` job; mismatched trigger evidence fails closed. The
primitive has no HTTP route and never executes readiness itself.

The future final `T-108` selection or confirmed-forfeiture transaction owns
the `entry_draft_completed` call when it makes the last unused pick terminal
and changes the Entry Draft to `Complete`. Full T-108 selection, forfeiture,
timeout, and frontend behavior remain M8-deferred; the FAD-08 primitive is not
a partial Entry Draft workflow. `T-036` owns `no_draft_inaugural` creation in
the genuine inaugural league-start transaction. Its exact reset-origin branch
activates the reset-created original league and initial Season 2 but creates no
readiness operation or job; `T-037` then owns `no_draft_initial_season2`
creation in the original-league exemption/lifecycle transaction. Partial or
ambiguous reset-origin evidence fails `T-036` before activation writes. Each
actual handoff caller and its operation/job pair commit or roll back together.
There is no post-commit in-memory handoff, standalone Entry Draft completion
endpoint, commissioner opening command, startup repair, or GET-side creation
path.

When confirmed `T-095` schedule creation supplies the missing schedule after
the genuine-inaugural occurrence has already blocked, its same transaction may
perform only the approved corrective requeue of that exact operation and job.
It never creates a second readiness trigger, increments the worker attempt
count, or reuses T-128 commissioner-retry evidence. Absent, pending, running,
or succeeded readiness is a no-op; malformed split state fails the complete
T-095 transaction closed.

When a durable readiness occurrence is leased, the readiness worker locks the
schedule, validates every FAD prerequisite, and, when necessary, advances
Week 1 by whole league-local Mondays until:

```text
candidateDeadlineAtMs > nowMs
candidateDeadlineAtMs = firstMatchupStartsAtMs - 7 * 24 hours
```

Whole-Monday selection and validation run in Node against the league's
persisted IANA timezone. They do not use an elapsed-millisecond divisibility
test: consecutive league-local Mondays may be 167, 168, or 169 elapsed hours
apart across a daylight-saving transition. The Candidate deadline remains
exactly 168 elapsed hours before the selected Week 1 instant.

The schedule adjustment removes the now-unavailable early regular-season
matchup weeks, regenerates the remaining regular-season pairings/byes as fairly
as possible, increments the schedule version, and replaces every dependent
unexecuted job that still has a corresponding occurrence in the regenerated
schedule. An unexecuted job owned only by a removed week is instead safely
cancelled with durable cancellation evidence. It never moves the NHL
regular-season ending or any of the four fantasy playoff weeks. The readiness
operation stores the old and new Week 1 instants, removed week and matchup IDs,
old and new schedule generations/versions, and every replaced or
cancellation-only job effect.

After the final Week 1 choice commits, readiness persists:

```text
frozenFadFirstMatchupStartsAtMs = matchup_weeks.starts_at_ms
competitionFirstMatchupStartsAtMs = frozenFadFirstMatchupStartsAtMs
candidateDeadlineAtMs = frozenFadFirstMatchupStartsAtMs - 7 * 24 hours
cardsOpenedAtMs        = committed readiness time
helpOpensAtMs          = max(cardsOpenedAtMs, candidateDeadlineAtMs - 48 hours)
rollover[n]            = candidateDeadlineAtMs + n * 24 hours, n = 1..7
creationCutoff[n]      = rollover[n] - 60 minutes
```

Rollover 7 equals the Week 1 instant snapshotted when cards open. Sequences
`1..7` are the initial FAD window, not a maximum row count. A valid queued
nomination, delayed restricted activation, no-improvement fallback auction, or
recovery that still needs a fair 24-hour blind window creates the next
contiguous rollover row at the next 24-hour boundary. No sequence is skipped
or reused.

All values are integer UTC Unix milliseconds. The subtraction is elapsed time,
not calendar-wall-clock arithmetic. League-local formatting uses the persisted
IANA timezone, but DST never changes the elapsed interval.

The persisted Week 1 start is also the Hundo Leago competition-season start
for this design. No service may infer it from `seasons.label`,
`seasons.nhl_season_key`, the NHL opening date, a deployment environment
variable, or a hard-coded annual default.

Automatic readiness fails atomically and opens no Candidate Card when:

* Week 1 is absent or ambiguous;
* another FAD already exists for the league and season;
* any other readiness prerequisite is not satisfied.

Failure stores the complete safe blocker set. Correcting prerequisites causes
an automatic re-evaluation, and an authorized commissioner may also request an
idempotent readiness retry. Neither path may bypass a blocker or open only
some cards.

`seasons.regular_season_starts_at_ms` is not required to equal Week 1. The NHL
season may open before the first full Monday-through-Sunday fantasy week. The
persisted Week 1 `starts_at_ms` is the sole FAD deadline and rollover anchor.

The one approaching-deadline reminder is scheduled for 72 elapsed hours before
the deadline. If cards legitimately open after that reminder instant, the
reminder is due immediately after opening. If less than 48 hours remain, the
help action is available immediately for the entire remaining period.

---

## Schedule and Team Freeze

The FAD does not set `leagues.status = 'frozen'` merely to protect its clock.

Instead, team and matchup write services query the active FAD:

* a participating team cannot be added, erased, or deactivated from readiness
  commit through FAD completion;
* manager- or commissioner-authored schedule writes may continue only when
  Week 1 `starts_at_ms` remains exactly unchanged;
* the FAD completion service may invoke the approved server-owned schedule
  recovery once, moving Week 1 to the first valid league-local Monday after
  durable FAD completion, removing unavailable early regular-season weeks, and
  regenerating the remaining pairings fairly;
* server-owned recovery never rewrites the snapshotted Candidate deadline,
  prior rollover instants, bids, allocations, or results;
* manager assignments may change normally and transfer future team authority.

The existing league operational freeze remains separate:

* it blocks manager Candidate Card and auction writes;
* it does not stop already-due deadline, allocation, rollover, or completion
  jobs;
* commissioner help and approved recovery remain available.

---

# Part 3 - Target SQLite Model

## Global Conventions

Every FAD table:

* uses opaque UUID primary keys;
* includes `league_id` and `season_id`;
* enforces same-league composite foreign keys;
* stores timestamps as integer UTC milliseconds;
* stores money as integer cents;
* uses documented text checks;
* uses league-first lookup indexes;
* includes `created_at_ms`, and mutable aggregate roots also include
  `updated_at_ms` and `version`.

Core relationships, money, statuses, visibility, and participant restrictions
are normalized. JSON is limited to immutable before/after evidence, safe
warning details, result details, and job summaries.

---

## `entry_draft_rollover_bindings`

This mutable draft-level aggregate binds one Entry Draft to one source season,
one already-planned target season, and its current scheduled rollover
occurrence. It stores the stable binding ID, current occurrence ID, target
schedule ID/version, Week 1 matchup-week ID/start, scheduling-time source,
target and draft versions, `scheduled`, `blocked`, or `succeeded` status,
selection/trading gates, nullable successful rollover, timestamps, and
optimistic version.

The base `entry_drafts` row remains `ready` while this binding is scheduled or
blocked. Its selection and trading gates remain locked. Only the successful
outer rollover transaction may change the draft to `active`, open both gates,
link the successful rollover, and prepare/start the first pick clock.

---

## `entry_draft_schedule_operations`

This append-only row is the authoritative result of each commissioner
`schedule` or `reschedule` command. It stores the operation and idempotency
request, action, draft, stable binding, new occurrence and pending job,
scheduled start, before/after draft and binding versions, scheduling
user/membership/authority, nullable bounded reschedule reason, and, for
reschedule, the superseded occurrence and job.

The initial row is also the attributable setup-confirmation evidence. Before
writing it, the transaction proves the complete normalized order, confirmed
eligibility snapshot, pick set and current owners, target calendar and current
schedule generation. It then changes the base draft to `ready`. A reschedule
adds a new immutable row and never rewrites the original result.

The row projects the exact nine-field HTTP result. The idempotency request may
be completed only when it links this row as
`result_type = entry_draft_schedule`; exact replay reads this immutable row
rather than reconstructing history from the mutable rollover binding.

---

## `season_rollover_occurrences`

This append-only history stores a distinct immutable occurrence ID for every
initial schedule and reschedule. Each row binds the draft-level binding,
league, draft, source and target seasons, scheduled start, canonical occurrence
key, exact target schedule ID/version, Week 1 matchup-week ID/start,
scheduling-time source/target/draft versions, scheduling actor/membership/
authority, pending job-run ID, status, and nullable superseding occurrence.

The occurrence states are `scheduled`, `superseded`, `blocked`, or
`succeeded`. Rescheduling may supersede only an unexecuted `scheduled`
occurrence whose job has not become due, leased, running, or terminal and for
which no attempt exists. The same transaction safely skips that pending job,
inserts the replacement occurrence/job, advances the binding's current
occurrence and frozen schedule evidence, and records notification/audit
evidence. Blocked and succeeded occurrences are immutable and cannot be
rescheduled; a blocked occurrence is retried by its same occurrence ID.

---

## `entry_draft_pick_clocks` and `entry_draft_on_clock_trades`

`entry_draft_pick_clocks` stores immutable clock generations for one draft
pick, including the exact owning team for that generation, with `prepared`,
`running`, or `completed` state, start/deadline, completion evidence, and the
successful rollover attempt/root that authorized the first generation.

`entry_draft_on_clock_trades` stores at most one immutable use per draft pick.
It binds the exact completed trade and ownership event, prior running clock,
new owning team, and fresh full-clock generation. Same-league/draft/pick
constraints and a unique pick identity enforce the one completed on-clock
trade limit. The accepted trade transaction compares and advances the proposal,
trade, pick ownership, prior clock, use row, fresh clock, stale proposals,
events, and aggregate versions together; a racing selection or timeout either
commits first or leaves no partial effect.

---

## `season_rollovers`

This shared prerequisite table records the one successful league-level
contract and ownership advancement into a continuing season.

Fields include:

* ID and league;
* unique source and target season IDs;
* `status = 'succeeded'`;
* required unique same-league draft-level rollover binding and exact immutable
  occurrence IDs;
* one required, unique same-league `rollover_attempt_id`;
* required same-league scheduled Entry Draft ID, immutable scheduled-start
  instant, and occurrence key;
* exact target schedule ID/version and Week 1 matchup-week ID/start copied from
  the binding and occurrence;
* execution trigger `scheduled_job` or `commissioner_retry`;
* nullable scheduled job-run ID, required only for `scheduled_job`;
* nullable idempotency-request ID, retrying user, membership, and authority,
  required only for `commissioner_retry`;
* immutable Entry Draft schedule-authorizing user, membership, and authority;
* source/target season and league versions before and after the transition;
* proof that the already-planned target season was reused;
* immutable source NHL key/label, target NHL key/canonical label, and all four
  persisted target calendar instants;
* required same-league/source-season links to `source_fad_id`,
  `source_finalization_root_id`, `source_finalization_id`,
  `source_standings_snapshot_id`, and `source_standings_operation_id`;
* immutable canonical `source_readiness_json`,
  `source_readiness_schema_version = 1`, and its lowercase SHA-256;
* required unique same-league `aggregate_activity_id`,
  `security_audit_event_id`, and `outbox_event_id`; the outbox has exactly one
  league audience for the route league;
* completed timestamp;
* the nine exact summary counts returned by `T-037`;
* `manifest_schema_version = 1` and the lowercase SHA-256 of the canonical
  ordered item manifest;
* `created_at_ms = completed_at_ms` and `version = 1`.

Constraints require:

* one rollover from a source season and one rollover into a target season;
* distinct same-league source and target seasons;
* source `completed` and target `active` at commit;
* the five source-readiness identity links match the exact IDs inside the
  canonical projection, the linked FAD is the completed source FAD, and the
  linked finalization/snapshot/operation rows are the projection's canonical
  lineage generation;
* nonnegative summary counts;
* a scheduled execution has exactly one coherent succeeded Entry Draft-start
  job run and no HTTP idempotency row;
* a commissioner retry has exactly one started lifecycle idempotency request
  with the same league and actor and no job-run impersonation;
* the linked attempt may become `succeeded`, and a retry idempotency request
  may complete, only after all required item and event evidence exists and
  both identify `result_type = season_rollover`,
  `result_id = rolloverId`; and
* only a successfully committed transaction may insert a row.

Cross-table triggers make a non-null retry `idempotency_request_id` exclusive
across `season_rollovers` and `free_agent_draft_setup_exemptions`. Completion
requires exactly one lifecycle resource in the table implied by the declared
`result_type`, with the same result ID; one started request can never own both
resource types.

Failed attempts remain in `season_rollover_attempts` and job/security/
operational evidence and do not create a misleading rollover row.

---

## `season_rollover_attempts`

This append-only operational table makes the automatic failure and retry
contract inspectable without treating a failed rollover as a successful
season transition.

Each attempt stores:

* stable ID, league, source season, planned target season, and scheduled Entry
  Draft;
* the stable draft-level binding ID, exact immutable scheduled occurrence ID
  and key, and monotonic attempt number within that occurrence;
* trigger `scheduled_job` or `commissioner_retry`;
* nullable scheduled job-run ID or retry idempotency request and actor
  evidence, with exactly one trigger shape;
* `started`, `blocked`, or `succeeded` status;
* started and terminal timestamps;
* a canonical ordered `blockers_json` array for `blocked`, using only safe
  diagnostic code, field, resource type, resource ID, and message fields;
* nullable successful `season_rollover_id`;
* exact source-season, target-season, and Entry Draft versions observed.

A blocked attempt has a nonempty blocker array, no rollover ID, and no
contract, ownership, obligation, season-status, draft-status, or trading
effect. It leaves the base Entry Draft `ready`, marks the exact occurrence and
binding `blocked`, and keeps selection and trading locked. A succeeded attempt
has an empty blocker array, the one matching rollover, and allows the Entry
Draft start transition to continue to `active`.

Attempts are immutable after terminal state. The commissioner readiness
response derives the latest attempt from the greatest attempt number for the
exact occurrence, projects its blockers and an action capability for
idempotent retry, and never recomputes or mutates them during a GET.

---

## `season_rollover_items`

This immutable normalized manifest records one row for every entity counted by
the rollover summary. An item contains:

* ID, league, rollover, rollover attempt, source season, target season, and
  the same nullable retry `idempotency_request_id` used by the rollover root;
* exactly one effect kind:
  `contract_advanced`, `contract_expired`, `ownership_carried`,
  `ownership_released`, `retention_year_advanced`,
  `retention_obligation_completed`, `buyout_year_advanced`,
  `buyout_obligation_completed`, or `trade_cancelled`;
* the exact entity mapping:
  `contract_advanced` and `contract_expired` use
  `entity_type = contract` plus contract ID;
  `ownership_carried` and `ownership_released` use
  `entity_type = player_ownership` plus ownership ID;
  `retention_year_advanced` and `retention_obligation_completed` use
  `entity_type = retention_obligation` plus parent obligation ID;
  `buyout_year_advanced` and `buyout_obligation_completed` use
  `entity_type = buyout_obligation` plus parent obligation ID; and
  `trade_cancelled` uses `entity_type = trade` plus trade ID;
* canonical version-1 before/after JSON with exact status, season, team,
  player/contract relationship, complete year or trade-asset collections, and
  parent version/timestamp fields applicable to that kind;
* `payloadSha256`, the lowercase SHA-256 of the complete canonical item
  projection using the normative formula below;
* a required `contract_event_id` for contract effects, required
  `ownership_event_id` for ownership effects, required `trade_event_id` for a
  cancelled trade, and required League Activity ID for each expired-contract
  or cancelled-trade item; other event-link columns are null;
* the rollover timestamp.

Manifest hashing uses `canonical-json-v1`: JSON object keys are recursively
sorted by Unicode scalar value; array order is preserved; every specified
nullable key is present as `null`; numbers are safe base-10 integers; strings
use standard JSON escaping; and the preimage is the UTF-8 encoding with no
BOM, insignificant whitespace, or trailing newline.

Each item projection contains exactly:

```text
itemId
leagueId
rolloverId
rolloverAttemptId
idempotencyRequestId             nullable
fromSeasonId
toSeasonId
effectKind
entityType
entityId
before
after
contractEventId                 nullable
ownershipEventId                nullable
tradeEventId                    nullable
leagueActivityId                nullable
causalAssets                    [] except trade_cancelled
occurredAtMs
```

The `before` and `after` objects use the same complete shape for their entity:

* contract effects use the full immutable/mutable contract projection
  `id`, `playerId`, `currentTeamId`, `contractType`,
  `originalTotalValueCents`, `originalTermYears`, `aavCents`,
  `startSeasonId`, `status`, `acquisitionSourceType`,
  `acquisitionSourceId`, `auctionBuyoutLockExpiresAtMs`, `createdAtMs`,
  `updatedAtMs`, `version`, plus `years`;
* each contract year uses exactly `id`, `seasonId`, `yearNumber`, `aavCents`,
  `status`, `rolloverAtMs`, and `createdAtMs`;
* ownership effects use `exists`, `id`, `seasonId`, `playerId`, `teamId`,
  `ownershipKind`, `rosterCategory`, `positionGroup`, `slotNumber`,
  `acquiredTransactionType`, `acquiredTransactionId`, `tradeBlocked`,
  `createdAtMs`, `updatedAtMs`, `version`, and `displayOrderEntries`. A
  released after-image is the tombstone `exists = false`, `seasonId = null`,
  `version = null`, `updatedAtMs = completedAtMs`, with every stable
  identity/display field copied from the before-image. For both carried and
  released ownerships, the before array contains every referencing display
  entry ordered by `orderSetId` then ID, and the after array is empty;
* retention effects use `id`, `contractId`, `playerId`, `originatingTeamId`,
  `responsibleTeamId`, `retainedAavCents`, `creationTradeId`, `status`,
  `createdAtMs`, `updatedAtMs`, `version`, and `years`;
* buyout effects use `id`, `contractId`, `playerId`, `originatingTeamId`,
  `responsibleTeamId`, `annualPenaltyBasisCents`, `buyoutTransactionId`,
  `status`, `createdAtMs`, `updatedAtMs`, `version`, and `years`;
* each retention/buyout year uses exactly `id`, `seasonId`, `amountCents`,
  `status`, and `createdAtMs`; and
* trade effects use `id`, `seasonId`, `proposingTeamId`, `receivingTeamId`,
  `proposingUserId`, `creatingMembershipId`, `creatingAuthority`, `status`,
  `createdAtMs`, `expiresAtMs`, `effectiveDeadlineAtMs`, `respondedAtMs`,
  `completedAtMs`, `commissionerCompletionReference`,
  `proposalModelVersion`, `updatedAtMs`, `version`, and `assets`.

Every contract `years` array contains the complete schedule, ordered by
`yearNumber` then ID. Every retention/buyout `years` array contains the
complete persisted obligation schedule, ordered by `seasonId` then ID. Both
before and after images include completed/eliminated historical rows, the
source current row, the immediate nullable target row, and every later future
row. For an advance, only the exact source and target year status/timestamp
fields documented above may differ; for expiration/completion, only the
source year and parent fields documented above may differ. Every other year
row must be byte-equal between images and still match the live row immediately
before the rollover root commits and its attempt succeeds.

Each ownership display-order entry contains exactly `id`, `leagueId`,
`orderSetId`, `ownershipId`, `positionGroup`, `displayOrder`, and
`createdAtMs`. Its deletion is a mutable UI-preference cleanup, not a tenth
rollover summary kind; completeness is bound through the corresponding
ownership item and verified before completion.

Each trade `assets` array contains every proposal asset ordered by `sequence`
then ID. An asset contains exactly `id`, `leagueId`, `tradeId`, `direction`,
`sourceTeamId`, `destinationTeamId`, `assetType`, nullable `contractId`,
nullable `playerId`, nullable `draftPickId`, nullable
`retentionObligationId`, nullable `buyoutObligationId`, nullable
`futureConsiderationId`, nullable `requestedRetentionContractId`, nullable
`requestedRetentionCents`, nullable `futureConsiderationDescription`,
nullable `proposalSnapshotJson`, `assetModelVersion`, `sequence`, and
`createdAtMs`. The before and after asset arrays are byte-equal and must equal
the live rows immediately before completion. After the successful rollover
root commits, scoped triggers reject insertion, update, or deletion of any
asset belonging to that rollover-cancelled proposal.

The item payload hash is SHA-256 over canonical JSON exactly
`{"domain":"hundo-leago.season-rollover-item","schemaVersion":1,"item":<item
projection>}`. The manifest preimage is canonical JSON with exactly:

```text
domain                           hundo-leago.season-rollover-manifest
schemaVersion                    1
leagueId
rolloverId
rolloverAttemptId
idempotencyRequestId             nullable
entryDraftId
entryDraftRolloverBindingId
rolloverOccurrenceId
entryDraftScheduledStartsAtMs
occurrenceKey
targetScheduleId
targetScheduleVersion
weekOneMatchupWeekId
weekOneStartsAtMs
executionTrigger
scheduledJobRunId                nullable
fromSeasonId
fromSeasonLabel
fromNhlSeasonKey
toSeasonId
toSeasonLabel
targetNhlSeasonKey
nhlRegularSeasonStartsAtMs
nhlRegularSeasonEndsAtMs
fantasyPlayoffsStartAtMs
fantasyPlayoffsEndAtMs
sourceFadId
sourceFinalizationRootId
sourceFinalizationId
sourceStandingsSnapshotId
sourceStandingsOperationId
sourceReadinessSchemaVersion
sourceReadinessSha256
targetSeasonReused               true
leagueVersionBefore
leagueVersionAfter
fromSeasonVersionBefore
fromSeasonVersionAfter
toSeasonVersionBefore
toSeasonVersionAfter
entryDraftVersionBefore
entryDraftVersionAfter
entryDraftScheduledByUserId
entryDraftScheduledByAuthority
executedByUserId                 nullable
executedAuthority                system | commissioner | platform_administrator_as_commissioner
firstPickClockId
completedAtMs
aggregateActivityId
securityAuditEventId
outboxEventId
summary
items
```

`summary` contains the nine response keys exactly. `items` contains each item
projection plus `payloadSha256`, ordered by this effect ordinal and then
canonical entity UUID: contract advanced, contract expired, ownership carried,
ownership released, retention advanced, retention completed, buyout advanced,
buyout completed, trade cancelled. Those ordinals map one-to-one to
`contractsAdvanced`, `contractsExpired`, `ownershipsCarried`,
`ownershipsReleased`, `retentionYearsAdvanced`,
`retentionObligationsCompleted`, `buyoutYearsAdvanced`,
`buyoutObligationsCompleted`, and `tradesCancelled`.

`ownership_released.entity_id` is an immutable copied identity, not a foreign
key to the deleted live ownership. Its insertion trigger validates the
same-league ownership and exact before-image while the row still exists; the
deferred rollover-root foreign key and immutable item/event evidence preserve
the tombstone after deletion.

The table requires one item per `(rollover, effect kind, entity ID)`, exact
same-league/source/target identity, effect-kind/entity-type compatibility,
valid event-link shapes, and a closed-set trigger contract. An item may be
inserted only while its linked rollover attempt is `started`; a commissioner
retry additionally requires its linked idempotency request to be `started`.
After successful rollover completion, insert/update/delete are all rejected.

SQLite has no project-registered SHA-256 function. Therefore the dedicated
T-037 repository reads back the frozen typed rows, recomputes every item hash
and the root manifest hash in Node with `canonical-json-v1`; it also rereads
the root's canonical `source_readiness_json`, rejects noncanonical or
schema-inexact JSON, and recomputes its source-readiness hash. All hashes are
compared immediately before attempting the rollover-root insert and attempt
completion update inside the same `BEGIN IMMEDIATE`. A commissioner retry
completes its idempotency row last. SQL triggers enforce lowercase 64-hex shape,
closed-set/cardinality/link/state invariants, but do not falsely claim to
perform cryptographic hashing. The completion boundary—the repository
recomputation followed by the guarded final SQL update—verifies:

* the source-readiness projection, hash, source FAD, and four
  finalization-generation identity links are exact and same-league/source-
  season consistent;
* item totals by kind equal all nine root summary counts;
* every linked event/activity row has the exact source, entity, type, actor,
  timestamp, reason, version, and before/after shape;
* every item payload hash is valid and the ordered canonical item projection
  recomputes to the root manifest SHA-256;
* the aggregate season activity, Security Audit row, and one scoped outbox
  invalidation exist; and
* no duplicate or unmanifested rollover effect exists;
* every display-order entry captured by an ownership item is absent and no
  remaining display-order entry references any carried/released ownership;
* no live source ownership or source contract/retention/buyout `current` year
  remains; every active target contract/obligation and every target ownership
  created by the transition has exactly one matching item and satisfies the
  total matrix; every expired/completed root changed at `completedAtMs` has
  exactly one matching item; and no still-proposed trade references a
  released/completed effect; and
* closure identities equal the frozen preflight sets:
  `contractsAdvanced + contractsExpired = active contracts`,
  `ownershipsCarried + ownershipsReleased = live ownerships`,
  `retentionYearsAdvanced + retentionObligationsCompleted = active retention
  obligations`, `buyoutYearsAdvanced + buyoutObligationsCompleted = active
  buyout obligations`, and `tradesCancelled = qualifying proposed trades`.

Any `contract_events`, `ownership_events`, `trade_events`, League Activity, or
Security Audit evidence row referenced by a rollover root/item is protected
from update and delete by T-037-scoped triggers. Surviving live contract,
ownership, obligation, and trade aggregate roots remain mutable through later
approved services, except that the asset rows of a rollover-cancelled terminal
proposal are frozen as specified above. Referenced outbox identity, event
type, scope, payload,
audience, and creation fields are frozen; only the shared approved publication
status/attempt/delivery fields may advance. Once the rollover attempt succeeds,
triggers also reject new contract/ownership events with that
`season_rollover` source, new trade events carrying that rollover ID/reason,
and new T-037 activity/audit rows for that rollover. Unrelated later domain
history is outside the manifest and does not affect its validity.

Later valid transactions do not rewrite this manifest. Automatic FAD readiness proves the
historical transition from the immutable manifest and separately runs the
independent whole-league current structural check; it does not infer or require
an event-by-event lineage between those two proofs.

Migration `0029` also removes the live-ownership foreign key—without changing
the nullable historical `ownership_id` value or any other column, constraint,
index, trigger, or row—from `auction_resolutions`,
`free_agent_draft_player_allocations`, and
`free_agent_draft_allocation_events`. Those immutable result/history rows
retain the stable ownership UUID as evidence after a one-year signing is
released, following the existing released-ownership `ownership_events`
precedent. The live foreign key remains on `roster_display_order_entries`
because T-037 explicitly removes those mutable preference rows before deleting
an ownership.

---

## `free_agent_draft_setup_exemptions`

This table records a reviewed one-time no-draft exception for the original
league's initial Season 2 transition.

Fields include:

* ID, league, and season;
* `exemption_kind = 'initial_season2_transition'`;
* the exact succeeded legacy `migration_report_id`;
* one required, unique same-league `idempotency_request_id`;
* lowercase SHA-256 values for the exact canonical migration-report projection
  and reset-bootstrap identity projection validated at authorization;
* required same-league `bootstrap_idempotency_request_id`,
  `bootstrap_activity_id`, `bootstrap_security_audit_event_id`, and
  `bootstrap_actor_user_id` links used by that identity projection;
* required unique same-league `authorization_activity_id`,
  `authorization_security_audit_event_id`, `commissioner_notification_id`,
  and `outbox_event_id`;
* bounded reason;
* authorizing actor, required same-league active authorizing membership, and
  authority;
* authorized timestamp, with
  `created_at_ms = updated_at_ms = authorized_at_ms` at insertion;
* consumed FAD and consumed timestamp;
* `version = 1` at insertion.

There is at most one row per league and season and it may be consumed once.
Its sole consume transition sets the consumed FAD,
`consumed_at_ms = updated_at_ms`, and `version = 2`; no other field changes.
The linked lifecycle idempotency request must be `started`, same-league, and
same-actor at insertion and may complete only as
`result_type = free_agent_draft_setup_exemption`,
`result_id = exemptionId`. A migration-report row referenced by an exemption,
the authorization-time hash fields, and completed lifecycle idempotency
evidence are immutable and nondeletable. Its referenced activity and Security
Audit rows are immutable. Notification identity, recipient, type, message,
deduplication key, relation, and creation fields are frozen while approved
read/delivery-status fields may advance; outbox identity/type/scope/payload/
audience/creation fields are frozen while approved publication fields may
advance.

An inaugural league needs no exemption row: inaugural eligibility is derived
from the absence of any prior league season and any Entry Draft for the target
season, plus the absence of a qualifying original-league reset migration row
and bootstrap identity. The reset-created initial Season 2 can therefore never
masquerade as inaugural; it requires the explicit exemption. A normal
continuing season requires a completed Entry Draft. The exemption applies only
to the exact initial Season 2 transition above, and a commissioner-supplied
reason alone never bypasses the Entry Draft gate.

The already-approved but currently unimplemented lifecycle-transition target
route `T-037` is the only permitted writer for the original-league exemption:

```text
POST /api/v1/leagues/:leagueId/lifecycle-transitions
```

It accepts this exact command:

```json
{
  "transitionType": "authorize_initial_season2_no_draft",
  "seasonId": "opaque-uuid",
  "reason": "The Entry Draft feature is not available for this transition.",
  "confirmation": "AUTHORIZE INITIAL SEASON 2 WITHOUT ENTRY DRAFT"
}
```

The command requires `Idempotency-Key`, explicitly forbids `If-Match`, and
requires a platform administrator who also has active membership in the target
league. The league must be `active` or `frozen`, and the command preserves that
status and any active freeze. Inside one transaction it verifies:

* the season is the league's current active preseason season;
* it is the league's only persisted season because the approved Season 1 reset
  omitted the legacy competition-season container;
* the exact legacy migration predicate below identifies this as the original
  league;
* the target season has no Entry Draft, FAD, or previous exemption;
* automatic FAD readiness has not committed and no Candidate Card is open.
  The final-48-hour help boundary does not block the exemption; if automatic
  readiness later opens cards with less than 48 hours remaining, help is
  available immediately;
* the league has exactly one current commissioner membership, it is active,
  and its user is eligible to receive the required commissioner notification;
* every referenced row belongs to the same league;
* the reason equals its trimmed form, is 1 through 500 Unicode scalar values,
  and contains none of U+0000 through U+001F, U+007F through U+009F, U+2028,
  or U+2029. Application validation and migration-0029 insert/update triggers
  enforce the same character-count and forbidden-control rule.

It then creates the one exemption row plus commissioner-visible audit,
League Activity, notification, and outbox evidence. The Activity type
`fad_setup_exemption_authorized` is the explicit eleventh approved FAD Activity
type. It relates to the target season, uses the exact summary
`Initial Season 2 Free Agent Draft exemption authorized.`, and contains exactly
the three stable IDs `exemptionId`, `seasonId`, and `migrationReportId` as
metadata. It contains no reason, player, card, offer, contract, help, bid, path,
or private operational value. The Security Audit type is
`fad.setup_exemption_authorized`.

Exactly the current commissioner user receives one pending
`fad_setup_exemption_authorized` notification, the explicit thirteenth approved
FAD notification type. The recipient is resolved in the committing transaction
from `leagues.commissioner_membership_id`: the same-league membership must have
`status = active`, `permission_category = commissioner`,
`joined_at_ms <= authorizedAtMs`, and `ended_at_ms IS NULL`, and its user must
have `status = active`. Its safe list copy is exactly
`Initial Season 2 Free Agent Draft exemption authorized.` Its message data
contains exactly `leagueId`, `seasonId`, `exemptionId`, and destination
`{kind: commissioner_fad, leagueId, seasonId}`; its related feature is
`free_agent_draft_setup`, its related record is the exemption, and its
deduplication key is
`fad_setup_exemption_authorized:<leagueId>:<seasonId>:<exemptionId>:<userId>`.
The authorizing platform administrator receives no additional copy merely
because they performed the command. The outbox contains exactly three
metadata-only publications: league-audience `league.changed/league_changed`,
league-audience `activity.created/setup_exemption_authorized`, and
exact-recipient user-audience
`notification.created/setup_exemption_authorized`. The Activity and
notification resources use their persisted IDs and authoritative version `1`;
the league event uses the committed league resource/version. All eight
`related` IDs are null. No reason or other private text enters the notification
or outbox.

The exemption Security Audit row has
`event_type = fad.setup_exemption_authorized`, `outcome = success`, the
authorizing user, route league, no target user,
`reason_code = initial_season2_no_draft_authorized`, and
`occurred_at_ms = authorizedAtMs`; normal authenticated
request/session/network fields follow the shared audit contract. The exemption
row stores its exact audit row ID. Before consumption, the bounded private
reason is retained only on the exemption row. The automatic readiness
operation copies it exactly to the consuming FAD's required
`no_draft_reason`; both fields then remain frozen.
The root/audit link makes the exemption reason discoverable to authorized audit
readers without copying the text into Security Audit, League Activity,
notification, or outbox payloads.

The exemption command uses idempotency operation
`league.lifecycle.transition.v2`. The canonical request hash binds the
transition discriminator, route league, complete exact request body, actor,
and explicit absence of `If-Match`. A new exemption stores a unique
same-league reverse link to its `started` idempotency request. The transaction
completes that request last with result type
`free_agent_draft_setup_exemption` and the exact resource ID. The exemption
resource and completed idempotency row cannot be updated or deleted except for
the separately constrained one-time FAD-consumption fields. For this
operation, migration `0029` additionally makes
`(league_id, operation, client_key)` unique regardless of actor. Lookup uses
that same actor-independent scope, then requires the persisted actor and
request hash to match. A second currently authorized actor cannot reuse
another actor's key to create a second transition; it receives
`409 IDEMPOTENCY_KEY_REUSED`.

After route identity and current authority are revalidated, idempotency lookup
precedes current lifecycle, FAD, and eligibility checks. An
exact replay therefore returns the original `201` bytes without any write. An
exemption replay still returns the authorization-time
`consumed: false, version: 1` representation even if a later FAD consumed the
live exemption row. A changed body, discriminator, actor binding, or
`If-Match` reuse of the key returns `409 IDEMPOTENCY_KEY_REUSED`. A replay
creates no duplicate activity, audit, notification, outbox, item, or result
row. The command does not open cards, create the FAD, or consume the
exemption directly. Its committed lifecycle event enqueues the same automatic
readiness occurrence used after Entry Draft completion; that occurrence either
opens every card and consumes the exemption in one transaction or opens none
and records its safe blocker set.

Success returns `201` with exactly:

```text
exemptionId
leagueId
seasonId
exemptionKind
reason
authorizedByUserId
authorizedAuthority
authorizedAtMs
consumed
migrationReportId
version
```

Malformed input is `400`; missing authority is `403`; a cross-league season is
side-channel-safe `404`; an ineligible lifecycle state or existing exemption is
`409 INITIAL_SEASON2_NO_DRAFT_NOT_ELIGIBLE`.

A normally administrator-created league without that legacy import evidence
cannot use this exception merely because it is entering its second season.

Exactly one row must satisfy the legacy migration predicate:

```text
migration_reports.league_id = route leagueId
migration_reports.status = succeeded
migration_reports.completed_at_ms IS NOT NULL
migration_reports.reset_manifest_id = 2026-season-1-reset-v1
migration_reports.database_schema_version >= 1
migration_reports.source_hashes_json is valid JSON object
migration_reports.counts_json is valid JSON object
migration_reports.totals_json is valid JSON object
migration_reports.warnings_json is valid JSON array
migration_reports.rejects_json is valid empty JSON array
```

Its `source_bundle_id` must be nonempty and all parsed structures must have the
approved import-report shapes. Zero or multiple matching rows fails as missing
or ambiguous evidence. The exact row ID and SHA-256 of its complete canonical
qualifying projection are stored on the exemption, and a referenced report
becomes immutable. Merely naming the reset manifest, supplying an arbitrary
source bundle, or having a successful migration report for another league
never qualifies.

The report alone is insufficient. The same immediate snapshot must prove the
exact reset-bootstrap identity:

* the route league has exactly one persisted season; it is the league's current
  active season, has label `2026`, NHL key `20262027`, and the same stable ID
  originally created by the reset bootstrap;
* one completed idempotency row has operation
  `admin.league.bootstrap_reset_original.v1`,
  `result_type = league`, and `result_id = leagueId`;
* one `league_created` activity relates to that league and season and has the
  exact approved bootstrap metadata, summary, actor, and authority;
* one successful
  `system_bootstrap.reset_original_league_created` Security Audit row has
  reason `closed_write_reset_handoff`;
* the league and season `created_at_ms`, activity time, idempotency
  created/completed time, and audit time are identical, and all three evidence
  rows identify the same bootstrap administrator; and
* all stable IDs and immutable creation fields agree with the canonical
  reset-bootstrap projection even though T-035/T-036 legitimately changed
  current statuses, settings, timestamps, and versions afterward.

The exemption stores the SHA-256 of that canonical bootstrap-identity
projection. Zero, ambiguity, a legacy lookalike, or any mismatch returns
`409 INITIAL_SEASON2_NO_DRAFT_NOT_ELIGIBLE`.

Both exemption hashes use the `canonical-json-v1` encoding defined for the
rollover manifest.

The migration-report hash preimage contains exactly:

```text
domain                           hundo-leago.initial-season2-reset-report
schemaVersion                    1
id
leagueId
sourceBundleId
resetManifestId
databaseSchemaVersion
status
sourceHashes
counts
totals
warnings
rejects
startedAtMs
completedAtMs
createdAtMs
```

The five JSON columns are parsed, exact-shape validated, and embedded as
canonical JSON values; their original whitespace/key order is never hashed.
`rejects` is exactly `[]`.

The bootstrap-identity hash preimage contains exactly:

```text
domain                           hundo-leago.initial-season2-bootstrap-identity
schemaVersion                    1
bootstrapActorUserId
createdAtMs
league
season
idempotency
activity
securityAudit
```

`league` is exactly `id`, `currentSeasonId`, `createdAtMs`; `season` is exactly
`id`, `leagueId`, `label`, `nhlSeasonKey`, `createdAtMs`; and
`idempotency` is exactly `id`, `leagueId`, `actorUserId`, `operation`,
`clientKey`, `requestHash`, `status`, `resultType`, `resultId`, `createdAtMs`,
`completedAtMs`, `expiresAtMs`.

`activity` is exactly `id`, `leagueId`, `seasonId`, `eventType`,
`actorUserId`, `actorAuthority`, `teamId`, `playerId`, `relatedType`,
`relatedId`, `displaySummary`, `reason`, `metadata`, `occurredAtMs`.
`metadata` is the parsed exact bootstrap object, not raw JSON.
`securityAudit` is exactly `id`, `eventType`, `outcome`, `actorUserId`,
`targetUserId`, `leagueId`, `sessionId`, `requestCorrelationId`, `reasonCode`,
`networkKeyVersion`, `networkMetadataDigest`, `clientMetadata`,
`unknownAccountDigest`, `occurredAtMs`; every nullable bootstrap audit field is
present as null. `clientMetadata` is the parsed exact JSON value from
`client_metadata_json`, not the raw stored string; invalid JSON rejects the
evidence. The stored normalized bootstrap links identify the exact completed
bootstrap idempotency, activity, and Security Audit preimage rows.
T-037-scoped triggers protect those three evidence rows, the qualifying
migration report, and the exemption's stored hashes/identity links from
update/delete after authorization. They do not freeze the live league, season,
membership, user, or notification aggregate. Those authorization-time fields
remain durable in the frozen hash projection while later T-095 calendar work,
FAD lifecycle work, membership administration, notification delivery, and
other approved services advance their normal live state.

Inside the same `BEGIN IMMEDIATE`, the dedicated T-037 repository reloads the
exact report/bootstrap rows through those normalized links, recomputes both
canonical SHA-256 values in Node, and compares them immediately before the
guarded exemption idempotency-completion update. SQL enforces lowercase
64-hex shape, exact links, uniqueness, and immutability; it does not claim to
cryptographically recompute either hash.

The committed Season 1 reset/cutover is responsible for persisting this
succeeded report before league writes reopen. The implemented closed-write
report writer/verifier records evidence only; it never creates the no-draft
exemption. T-037 does not rerun the immediate-post-bootstrap continuity
command after normal setup changes. Under its own `BEGIN IMMEDIATE`, it loads
all league report candidates, applies the pure exact report-shape predicate,
and validates the bootstrap projection above without a time-of-check/time-of-
use gap.

### Closed-Write Reset Evidence Handoff

The pristine independent import verifier requires every non-imported
application table, including `leagues`, to remain empty. The league-scoped
`migration_reports` row cannot exist until its referenced league exists.
Cutover therefore uses the following explicit closed-write handoff; neither
requirement may be weakened to avoid the ordering boundary.

1. While application writes, scheduled jobs, outbox publication, notification
   delivery, and email delivery remain stopped, run the independent verifier
   against the pristine imported database.
2. Before any database bootstrap mutation, atomically publish a create-new
   private directory named
   `reset-import-verification-v1-<verificationHash>` under the approved
   migration-report root. The directory contains canonical
   `reset-import-verification.json` plus canonical `artifact-manifest.json`;
   it is assembled at a unique sibling path and renamed into place without
   overwrite. Publication uses a create-new canonical owner lock bound to the
   artifact hash, process, host, nonce, and creation time. A current owner is
   preserved; an abandoned owner is recovered only through bounded,
   identity-checked atomic quarantine; and a prior owner never removes a
   replacement lock. A CLI summary is not the artifact.
3. `artifact-manifest.json` binds the evidence filename, evidence byte length,
   and evidence SHA-256. The manifest `verificationHash` is that SHA-256 of the
   complete canonical evidence payload and therefore content-addresses the
   full artifact, including its continuity baseline. The distinct
   `importVerificationHash` is the independent import verifier's canonical
   verification hash and equals
   `payload.verification.verificationHash`. Keeping the two names distinct
   avoids any circular attempt to embed a file's whole-file digest inside
   itself. The evidence payload binds the source-bundle ID, checksum, and
   sanitized copied-file inventory; reset manifest ID, version, and checksum;
   canonical import-report byte hash, length, and semantic hash; database
   schema version and the full migration ledger row projection; pristine
   database byte hash and length; every imported target count and semantic
   hash; stable provider-ID preservation; and the approved reset, money,
   ownership, integrity, and foreign-key reconciliation facts. It also binds
   the exact staging-descriptor SHA-256, environment, database resource ID,
   remaining resource IDs, application-authority flags, and
   production-storage/secret isolation flags.
4. Only two named maintenance operations may change the database between
   artifact publication and continuity verification:

   1. the existing one-time
      `scripts/bootstrap-first-platform-administrator.js`, which creates
      exactly one pending-credential-setup user, one active platform-
      administrator role, one administrator-setup action token, one pending
      global account-action outbox row, and one matching Security Audit row;
   2. `scripts/bootstrap-reset-original-league.js`, which requires that exact
      bootstrap user and role plus explicit environment, database-identity,
      source-bundle, and typed confirmation values, then creates exactly one
      setup league, one default settings row, one sole planned current season
      labelled `2026` with NHL key `20262027`, one `league_created` League
      Activity row, one completed
      `admin.league.bootstrap_reset_original.v1` idempotency row, and one
      `system_bootstrap.reset_original_league_created` Security Audit row with
      reason code `closed_write_reset_handoff`.

   Both operations run while ordinary HTTP, manager, and commissioner writes
   remain closed. The second operation is not a public route and does not
   require credential setup, token delivery, or a session. The report writer
   does not create the league, activate the season, or manufacture an actor.

   Artifact version 1 makes
   `scripts/bootstrap-reset-original-league.js` a staging-only maintenance
   command. It requires these options exactly once:
   `--app-env staging`, `--confirm-app-env staging`, `--database`,
   `--migrations`, `--persistent-root`, `--descriptor`, `--source-bundle`,
   `--reset-manifest`, `--import-report`, `--artifact`,
   `--operating-mode OFFSEASON_RESET`, `--database-resource-id`,
   `--source-bundle-id`, `--verification-hash`, `--bootstrap-user-id`, and
   `--confirmation BOOTSTRAP_RESET_ORIGINAL_LEAGUE`. The three explicit IDs
   and the bootstrap-user ID are typed operator confirmations and must exactly
   equal the canonical artifact, descriptor, copied source bundle, and sole
   pending first-bootstrap administrator. The artifact path must resolve to
   the content-addressed child of the descriptor's report root. The database,
   source bundle, reset manifest, and import report must resolve to the same
   validated physical inputs bound by the artifact.

   For this handoff, database identity means the canonical staging-descriptor
   SHA-256, its `resourceIds.database` value, and the descriptor-validated
   physical database path. It does not mean adding `database_id`,
   `environment_id`, or `database_created_at` to `application_metadata`;
   artifact version 1 proves exactly the two migration-seeded metadata rows,
   and those rows remain byte-for-byte and semantically unchanged through
   report commit.

   The league display name comes only from the protected
   `BOOTSTRAP_RESET_LEAGUE_NAME` environment value and is validated by the
   ordinary league-name policy. It is never supplied in command output or
   inferred from imported private source content. The command's completed
   idempotency row uses the artifact `verificationHash` as `client_key`, a
   24-hour expiry, and a canonical SHA-256 request hash over exactly:
   `operation`, `verificationHash`, `stagingDescriptorSha256`,
   `databaseResourceId`, `sourceBundleId`, `bootstrapUserId`,
   `leagueNameNormalized`, `seasonLabel: 2026`, and
   `nhlSeasonKey: 20262027`. Exact replay is read-only and returns the original
   league and season IDs; any changed binding fails closed.

   The `league_created` activity summary is
   `<league name> was created in Setup.` and its canonical metadata is exactly
   `{"leagueStatus":"setup","seasonStatus":"planned"}`. Its actor is the
   bootstrap administrator with `platform_administrator` authority. The
   matching Security Audit actor is the same user; its target, session,
   request-correlation, network, client, and unknown-account fields are null.
   The operation creates no notification or outbox row and does not publish,
   consume, clear, or otherwise change the pending administrator-setup outbox
   event.

   Both bootstrap continuity and report commit require exactly five protected
   environment bindings:
   `BOOTSTRAP_RESET_LEAGUE_NAME`, `BOOTSTRAP_ADMIN_EMAIL`,
   `BOOTSTRAP_ADMIN_DISPLAY_NAME`, `ACTION_TOKEN_DELIVERY_KEY`, and
   `PUBLIC_FRONTEND_ORIGIN`. The administrator email and display name must
   exactly identify the sole pending first-bootstrap administrator. The
   delivery key and public origin authenticate the already-persisted action
   token and sealed pending outbox envelope only; neither command sends,
   publishes, consumes, or marks that message delivered.

   `scripts/db-commit-reset-migration-report.js` is a separate staging-only
   maintenance command. It requires the same first 14 binding options as the
   reset-original-league command through `--verification-hash`, followed by
   `--bootstrap-user-id`, `--league-id`, `--season-id`, and
   `--confirmation COMMIT_RESET_ORIGINAL_LEAGUE_MIGRATION_REPORT`, for exactly
   18 options supplied exactly once. It is invoked directly with the pinned
   Node executable; no package-script wrapper is authoritative for these
   secret-bearing operator arguments.

5. Immediately before report commit, all application tables must equal the
   pristine import plus exactly the two deltas above: one row in each of
   `users`, `platform_roles`, `account_action_tokens`, `outbox_events`,
   `leagues`, `league_settings`, `seasons`, `league_activity`, and
   `idempotency_requests`; two correctly typed rows in
   `security_audit_events`; zero rows in `migration_reports`; the imported
   player tables and seeded `application_metadata` unchanged; and every other
   application table empty. A pending account-action outbox row is evidence,
   not permission to publish it during the closed window.
6. A post-bootstrap continuity verifier rereads the private artifact, source
   manifest, reset manifest, canonical import report, and current database. It
   first revalidates the bound staging descriptor, physical database identity,
   and isolation flags, then proves that the schema and ledger still match;
   every imported protected target count, semantic hash, and stable provider
   ID is unchanged; all reset, money, and ownership facts still reconcile;
   integrity and foreign keys pass; and every bootstrap row has the exact
   relationship, status, authority, event type, operation, and safe metadata
   required above.
7. Only a genuine, one-use verifier capability, never request JSON, a browser
   value, an operator-authored projection, or an HTTP body, may authorize the
   migration-report projector. The commit service owns an `IMMEDIATE`
   transaction, creates the capability inside that transaction, binds it to a
   private transaction-lifetime savepoint and connection freshness counters,
   consumes it immediately before the insert-only repository call, and
   rereads the result through the exact-one persisted verifier. The command's
   zero-row commit versus one-row replay decision is serialized under the same
   outer `IMMEDIATE` boundary, so simultaneous operators produce one commit
   and one read-only replay. Both command-owned SQLite connections use and
   read-back verify a command-local bounded `60000` millisecond busy timeout;
   this maintenance-only wait does not change the ordinary application
   connection default of `5000` milliseconds.
8. After commit, the command closes and reopens SQLite. One internally owned
   `IMMEDIATE` read snapshot then proves the complete bootstrap state, reads
   the exact sole raw report row once, validates and hashes that same row,
   checks database integrity and foreign keys, and proves zero exemption, FAD,
   card, job, League Activity, notification, or outbox side effects from the
   report operation itself. A mixed-snapshot or caller-owned outer transaction
   cannot produce trusted post-commit evidence.
9. If any process stops before the row commits, writes stay closed. Recovery
   reruns continuity verification and the idempotent insert from the immutable
   artifact. It never inserts a nullable or unbound placeholder and never
   updates an earlier report into qualifying evidence.
10. The private artifact, source bundle, import report, and required backups are
   retained under the migration and backup retention policies. Ordinary league
   writes may reopen only after the row and the post-commit verification both
   succeed.

The setup/planned bootstrap state does not yet qualify for the no-draft
exemption. Normal league configuration and the approved `T-036` reset-origin
start branch must make that sole season the current active preseason season
before `authorize_initial_season2_no_draft` can succeed. That branch requires
one exact qualifying reset report plus one exact reset-bootstrap identity,
fails atomically on partial or ambiguous evidence, and deliberately creates no
`no_draft_inaugural` readiness row. `T-037` alone creates the
`no_draft_initial_season2` handoff. The ordinary genuine-inaugural `T-036`
branch remains unchanged and creates its owned handoff atomically. Neither the
handoff nor the report writer performs the reset-origin activation.

The full artifact is access-controlled operational evidence and is never
committed to Git or exposed through League Activity. Artifact publication is
create-new and no-overwrite. Logs and command output contain only safe IDs,
hashes, counts, and outcomes; the persisted row and logs omit absolute source
paths, raw source records, credentials or password hashes, tokens, sessions,
secret values, provider credentials, and sealed bid values.

No normal GET, FAD readiness retry, migration, manual SQL step, or startup repair
may invent the row. Inaugural eligibility remains derived and needs no writer.

---

## `free_agent_draft_readiness_operations`

This durable operational aggregate owns automatic all-or-none Candidate Card
opening and safe blocker/retry visibility.

Fields include:

* ID, league, target season, and one stable readiness occurrence key;
* trigger kind `entry_draft_completed`, `no_draft_inaugural`, or
  `no_draft_initial_season2`;
* exact trigger resource: completed Entry Draft ID for
  `entry_draft_completed`, target season ID for `no_draft_inaugural`, or
  no-draft exemption ID for `no_draft_initial_season2`;
* nullable completed Entry Draft or no-draft exemption identity;
* status `pending`, `running`, `blocked`, or `succeeded`;
* attempt count and lease fields;
* canonical ordered internal `blockers_json`, retained as the schema-30
  compatibility mirror of the latest blocked result, where every blocker is
  exactly `code`, nullable `field`, nullable `resourceType`, nullable
  `resourceId`, and `message`;
* before/after matchup-schedule versions and nullable schedule-recovery
  operation used for a late Entry Draft;
* nullable created FAD ID;
* started, next-retry, and terminal timestamps;
* version.

Only the worker, an idempotent authorized T-128 retry, or the exact
evidence-backed T-095 corrective-prerequisite transaction may advance a
blocked operation. An accepted T-128 retry leaves the operation `blocked`,
advances its version exactly once, and requeues the same job. T-095 may perform
the same count-preserving version/job requeue only for the already-blocked
genuine-inaugural occurrence whose missing confirmed schedule it has just
created, and records distinct immutable system-owned evidence. Only the later
worker claim moves `blocked` to `running` and increments the attempt count.
`succeeded` requires the one matching FAD,
all participating-team/card/carryover rows, seven initial rollover rows,
deadline/reminder jobs, activity, notifications, and scoped outbox evidence.
A blocked operation requires a nonempty blocker set and no FAD/card/schedule
write. GET projections never execute readiness or alter this row.

The readiness job claim and operation claim are one SQLite transaction. A
fresh pending operation, or a blocked operation whose same canonical job was
cleanly reset to `pending`, moves to `running` with the job; both attempt counts
advance exactly once, both leases identify the same owner, token, and expiry,
and a failure at either write rolls back both. A failed readiness job is not
ordinarily claimable and must first be reset by an authorized retry or the
approved corrective-prerequisite writer. A live lease cannot be replaced.

At or after an expired `running` readiness lease, reclaim uses a fresh fencing
token and atomically performs a guarded `running`-to-`running` lease handoff on
the same operation and job. Both attempt counts and original start timestamps
remain unchanged, both versions advance exactly once, all blocker, schedule,
opening, and terminal evidence remains unchanged, and the old token can no
longer complete work. The abandoned lease is not a completed worker attempt
and therefore creates no separate immutable attempt row; the reclaimed worker's
blocked or successful completion records the retained attempt number. A split
claim, count mismatch, live-lease takeover, or stale-token completion fails
without a write.
The job-side guard first proves that the old job lease, attempt, start, and
version match the still-running operation and that the job advances exactly one
version. The operation-side guard then proves the matching new bounded lease
and version. Neither guard substitutes for the application-owned transaction;
an injected failure between them rolls the job update back.

## `free_agent_draft_readiness_attempts`

Schema 31 adds one immutable row for every completed readiness-worker attempt.
It stores its ID, league, season, readiness operation, canonical job run,
attempt number, observed operation version, outcome `blocked` or `succeeded`,
observed and recorded timestamps, the exact canonical T-127 projection
snapshot, and the lowercase SHA-256 of that canonical JSON. Attempt number is
unique per readiness operation. Update and delete are prohibited.

The snapshot persists the attempt-time season version; nullable before and
after Week 1 projections; nullable deadline, reminder, and help instants;
zero-or-seven initial rollover projections; nullable prior-season rollover;
participating-team count; ordered team projections; and ordered public
blockers and warnings. Every public diagnostic in this snapshot is exactly
`code`, `message`, and nullable `resourceId`; internal `field` and
`resourceType` evidence never enters the attempt projection or T-127 response.
It omits viewer authority, `serverNowMs`, and the retry capability because
those are re-evaluated for the current T-127 caller.

A successful attempt row commits inside the all-or-none opening transaction.
If opening cannot proceed, the worker first rolls back that entire transaction.
The same still-valid leased job then uses a separate transaction to insert one
immutable blocked attempt, move the operation from `running` to `blocked`,
store the canonical ordered five-field internal blockers on the schema-30
operation row, store their corresponding ordered three-field public
projections in the attempt, and create the deduplicated
`fad_readiness_blocked` commissioner notification. That second transaction
creates no FAD, Candidate Card, schedule recovery, schedule write,
deadline/reminder occurrence, activity, opening notification, or any of the
four approved opening-publication outbox effects.

## `free_agent_draft_readiness_retry_receipts`

Schema 31 also adds one immutable receipt for every accepted T-128 intent. It
stores its ID, league, season, readiness operation, same-league idempotency
request, actor user and active membership, actual authority `commissioner` or
`platform_administrator_as_commissioner`, accepted-from and resulting
readiness versions, retry attempt number, canonical job run and occurrence
key, accepted timestamp, exact canonical response `data`, and its lowercase
SHA-256. The idempotency request and successful receipt are one-to-one. Update
and delete are prohibited.

Receipt insertion, the exact `blocked`-to-`blocked` one-version readiness
advance, and requeue of the same canonical job commit in one transaction. A
receipt never changes when readiness later runs, blocks again, or succeeds.
Exact replay reads its stored response data without writing or reprojecting
current readiness.

---

## `free_agent_draft_readiness_corrective_requeues`

Schema 33 adds one immutable system-owned row when confirmed T-095 schedule
creation supplies the missing schedule for an already-blocked genuine-
inaugural readiness occurrence. The row binds the league and season, readiness
operation, canonical job and occurrence, correction kind
`matchup_schedule_created`, immutable T-095 command result, new schedule
operation/generation and version, the latest immutable blocked readiness
attempt, prior and resulting aligned job/readiness versions, unchanged worker
attempt count and blocker mirror, prior blocked-terminal and next-retry
timestamps, requeue timestamp, and evidence version.

The row is unique by T-095 command result and by each resulting readiness/job
version. Its insert guard proves the exact same-league source result and newly
confirmed schedule, `no_draft_inaugural` source identity, blocked operation,
failed canonical job, synchronized versions/counts/timestamps, pristine opening
and schedule-recovery evidence, and nonempty canonical blockers. Update and
delete are prohibited.

The T-095 transaction first completes its schedule writes and immutable command
result, inserts this corrective evidence while the readiness pair still has its
blocked/failed old state, resets the job cleanly to `pending`, advances the
operation `blocked` to `blocked` by exactly one aligned version without changing
attempt or blocker evidence, and completes T-095 idempotency last. Database
guards require that row for both state changes. Exact T-095 replay performs no
write and cannot create a second corrective row. This evidence is distinct from
the actor-scoped T-128 retry receipt.

---

## `free_agent_drafts`

One row represents one league-season FAD.

Fields include:

* ID, league, and target season;
* frozen first matchup week;
* status;
* opening path:
  `completed_entry_draft`, `no_draft_inaugural`, or
  `no_draft_initial_season2`;
* nullable completed Entry Draft or no-draft exemption;
* nullable `prior_season_rollover_id`, required for every continuing season
  with a persisted prior league season;
* required bounded no-draft reason when applicable; the server-authored value
  for `no_draft_inaugural` is exactly `Inaugural league season.`, while the
  initial-Season-2 path copies the authorized exemption reason exactly;
* required automatic readiness operation/occurrence evidence;
* `opening_authority = system`, with no manager or commissioner opening actor;
* `opened_at_ms`;
* `help_opens_at_ms`;
* `candidate_deadline_at_ms`;
* frozen historical `first_matchup_starts_at_ms`;
* nullable recovered competition Week 1 and schedule-recovery evidence;
* `deadline_locked_at_ms`;
* `allocation_completed_at_ms`;
* `completed_at_ms`;
* version.

Constraints require:

* one FAD per league and season;
* opening evidence matching the opening path;
* prior-season rollover evidence matching the target season when required;
* the exact 168-hour deadline relationship and
  `help_opens_at_ms = max(opened_at_ms, candidate_deadline_at_ms - 48 hours)`;
* all milestone timestamps to be monotonic;
* the target season to be the league's current active preseason season.

`active` season status includes preseason in this technical model. FAD readiness
does not activate a planned season or complete a prior season. The approved
season-rollover operation must make the target season current and active before
the Entry Draft can complete and trigger FAD readiness.

---

## Schedule-Generation and Recovery Evidence

Each generated or regenerated matchup schedule has one immutable generation
root. Every dependent matchup-start, baseline, lock, scoring, finalization, and
rollover `job_runs` occurrence has a durable binding to that exact generation
operation and version. Claiming a job is not enough: the worker rechecks inside
its write transaction that its binding is the current generation and that the
season's FAD-completion gate is satisfied where required. A superseded
occurrence may become safely skipped but cannot mutate matchup state.

New matchup jobs use the exact generation-qualified internal occurrence key
`<jobType>:<leagueId>:<seasonId>:<weekId>:<scheduleOperationId>:<scheduleVersion>:<scheduledForMs>`.
This makes repeated valid manual shifts such as `A -> B -> A` collision-free
without reviving or rebinding an immutable skipped job. Backward-compatible
parsing of the older key without operation/version is limited to migrated
historical jobs; every new schedule generation uses the qualified form.

`free_agent_draft_schedule_recoveries` stores the immutable recovery root.
Child evidence stores:

* every removed week, including stable week ID, sequence, and original start;
* every removed matchup, including stable matchup ID and removed week ID; and
* every affected unexecuted job with disposition `replaced` or `cancelled`.

A `replaced` job effect binds the old job ID/occurrence key and old generation
to the new job ID/occurrence key and new generation. A `cancelled` effect binds
the old job and old generation and has no replacement identity. Equal old and
new scheduled instants are allowed when the generation changed; generation
identity, not timestamp inequality, proves which occurrence is current. The
recovery root and all children are inserted only in the readiness or completion
transaction and become immutable together.

The lowercase schedule-recovery `evidenceSha256` is SHA-256 over
`canonical-json-v1`, using the encoding defined for the rollover manifest. Its
preimage contains exactly:

```text
domain                           hundo-leago.fad-schedule-recovery
schemaVersion                    1
recoveryId
leagueId
seasonId
fadId
recoveryKind                    pre_open or completion
operationId
oldScheduleOperationId
newScheduleOperationId
oldScheduleVersion
newScheduleVersion
oldFirstMatchupWeekId
newFirstMatchupWeekId
oldWeek1StartsAtMs
newWeek1StartsAtMs
completedAtMs
removedWeeks[]
removedMatchups[]
jobEffects[]
```

Each `removedWeeks[]` item contains exactly `matchupWeekId`, `sequence`, and
`startsAtMs`, ordered by sequence and then week ID. Each
`removedMatchups[]` item contains exactly `matchupId` and `matchupWeekId`,
ordered by removed-week sequence and then matchup ID. Each `jobEffects[]` item
contains exactly `disposition`, `jobType`, `oldJobRunId`, `oldOccurrenceKey`,
`oldScheduleOperationId`, `oldScheduleVersion`, nullable `newJobRunId`,
nullable `newOccurrenceKey`, nullable `newScheduleOperationId`, and nullable
`newScheduleVersion`, ordered by old occurrence key and then old job ID. The
four new-job fields are all non-null for `replaced` and all null for
`cancelled`.

Late-lock legality uses durable authoritative NHL game observations rather than
an unpersisted provider read. Whole-game scoring also requires provider-backed
player/game statistics; cumulative season totals alone cannot identify the
post-baseline portion of one excluded NHL game.

Every refresh eligible for matchup scoring therefore has one immutable
`stat_refresh_player_game_sets` root, a complete sealed set of
`stat_refresh_player_game_coverage_entries`, and a complete sealed set of
`player_game_stat_observations`. The backend supplies the adapter with the
exact required stable-player/provider-player identity set for the refresh
scope. The adapter must return that exact set, not merely the players for whom
the statistics endpoint happened to return a row, and must bind its coverage
and observations to the same provider capture and `sourceVersion`.

Because this contract remains local and unshipped, coverage-requirement schema
version `1` is corrected in place rather than introducing a compatibility
version. `requirementsSha256` is SHA-256 over this exact
`canonical-json-v1` preimage:

```text
domain                           hundo-leago.player-game-coverage-requirements
schemaVersion                    1
nhlSeasonKey
playerIdentityProvider
requiredPlayers[]
requiredPlayerGames[]
```

Each `requiredPlayers[]` item remains exactly `playerId` and
`providerPlayerId`, ordered by player ID and then provider-player ID. Each
`requiredPlayerGames[]` item contains exactly `playerId`, `providerPlayerId`,
`providerTeamId`, `nhlGameId`, and `nhlGameScheduledStartsAtMs`, ordered by
player ID, then NHL game ID, scheduled-start timestamp, provider-player ID,
and provider-team ID. A `(playerId, nhlGameId)` pair is unique. Every game
binding must reference the one exact matching `(playerId, providerPlayerId)`
in `requiredPlayers`; its provider team is non-null.

The server authors `requiredPlayerGames` from the sealed baseline
`expected_game` coverage entries linked by whole-game exclusions whose matchup
week currently has status `live`, `awaiting_data`, or `correction_required`.
A `final` week leaves the requirement scope. The same historical bindings
re-enter when an authorized correction moves that week to
`correction_required`. The required-player set is the union of the ordinary
current refresh scope and every player referenced by these bindings, even when
that player was traded, released, changed provider team, or is now a free
agent.

The service sends both exact arrays and `requirementsSha256` to the adapter and
to persistence completion. Completion rereads and rebuilds the requirement
snapshot inside its compare-and-swap transaction. Any intervening roster,
mapping, exclusion, sealed-baseline, game/team/start binding, or matchup-week
status change that alters either array or the digest race-rejects the refresh;
partial totals, coverage, and observations do not become authoritative.

The adapter requests the union of its configured rolling current-game dates
and the provider-Eastern calendar date of every exact historical required
game. Dates are deduplicated and sorted before requests. For each required
historical binding, the targeted schedule response must affirm the exact NHL
game ID and scheduled start and must include the bound provider team as the
home or away team. The targeted PlayerGame response must include the exact
player, game, and bound team with an explicit Games-zero-or-one row and
explicit scoring values. Missing or conflicting schedule, start, team, or
PlayerGame evidence rejects the whole refresh.

The provider result's `provider` must equal the configured live-statistics
provider exactly. Its `sourceVersion` digest binds the exact requested
`requiredPlayers` and `requiredPlayerGames`, affirmative current membership
from both Players and FreeAgents, every requested schedule, and every selected
PlayerGame row.

### Superseded Live-Provider Capability Evidence (Historical Design Only)

The SportsDataIO contract below records the implementation that existed before
Grae's 2026-08-11 clarification. It is not an active requirement, it is not
composed for provider-independent FAD staging, and it cannot block FAD-18. No
paid credential, probe manifest, provider request, signed artifact, or
required-mode startup occurs in the amended FAD deployment. The later
provider-neutral matchup/statistics plan must explicitly replace or retire this
design before it restores or splits the shared automatic matchup-occurrence
runner.

Live SportsDataIO composition is controlled by the exact server mode
`disabled`, `probe`, or `required`. `disabled` has no live credential and does
not compose the live adapter. `probe` requires only the dedicated
`SPORTSDATAIO_NHL_LIVE_API_KEY`, keeps the live adapter disabled in the
application runtime, and permits the read-only capability command. `required`
requires that same dedicated key plus a valid signed capability artifact and
fails synchronously before opening SQLite when verification fails. The legacy
staging-import key can never enable live matchup statistics.

The capability artifact has exactly `evidence`, `evidenceSha256`, and
`evidenceHmacSha256`. `evidenceSha256` is SHA-256 over canonical-json-v1
`evidence`. `evidenceHmacSha256` is HMAC-SHA-256 with the independent
capability secret over:

```text
hundo-leago:sportsdataio-live-capability-evidence:v1\0
+ canonicalJsonEvidence
```

The exact evidence preimage contains:

```text
domain                           hundo-leago.sportsdataio-live-capability-evidence
schemaVersion                    1
evidenceId
status                           passed
provider                         sportsdataio-live
appEnv
environmentId
backendBuildId
origin
configuredNhlSeasonKey
probeNhlSeasonKey
probeKind                        historical_offseason | current
probeManifestSha256
capabilityKeyVersion
credentialBindingHmacSha256
issuedAtMs
expiresAtMs
request
capture
endpointProofs[]
explicitZeroPair
omissionProof
assertions[]
```

`credentialBindingHmacSha256` is HMAC-SHA-256 with the same independent
capability secret over the domain-separated dedicated live key:

```text
hundo-leago:sportsdataio-live-capability-credential:v1\0
+ dedicatedLiveApiKey
```

Verification uses constant-time digest comparison. Evidence is valid for
exactly 24 elapsed hours and is bound to the environment, backend build,
origin, configured current season, version-controlled probe-manifest digest,
and exact credential. A future-issued, expired, malformed, cross-environment,
cross-build, cross-origin, cross-season, cross-manifest, cross-credential, or
forged artifact fails before database access.

`request` contains canonical `requiredPlayers[]` and
`requiredPlayerGames[]`. `capture` contains only normalized capture time,
source version, coverage identities/dispositions, and normalized observation
identities and values. Each endpoint proof contains endpoint kind,
season-or-date scope, HTTP status, row count, and SHA-256 of the exact response
bytes. No credential or raw provider response is retained, logged, or emitted.

The version-controlled offseason probe uses the immediately previous
completed NHL season for historical totals and one exact zero-stat historical
PlayerGame while current Players and FreeAgents establish `no_due_game` and
`no_team`. It proves exhaustive Players, FreeAgents, season-total, targeted
schedule, and targeted PlayerGame access; exact game/start/team binding;
`expected_game`, `no_due_game`, and `no_team`; explicit zero; exact
coverage/observation equality; and one capture/source version. An in-memory
controlled replay with the zero-stat PlayerGame removed must fail as an
incomplete response. This proves credential entitlement and endpoint
semantics during the offseason without claiming that the configured next
season already has published rows.

Artifact publication is confined beneath the validated persistent root. It
uses an exclusive owned lock, a mode-0600 same-directory temporary file,
file fsync, reread verification, atomic rename, directory fsync, and final
reread verification. The directory is mode 0700. Symlinks, path escapes,
truncation, noncanonical JSON, concurrent publication, and forged replacement
fail closed; a failed replacement preserves the previous valid artifact.
Command output is a sanitized receipt only. Provider or semantic failure exits
`2`; configuration, artifact, or internal failure exits `1`; passed,
published, replaced, or exact replay exits `0`.

Each required player has one affirmative current-membership parent and exactly
one coverage disposition. The parent `providerTeamId` is the current Players
team or null only when FreeAgents affirm current free agency. For
`expected_game`, every `games[]` item separately carries its own non-null
`providerTeamId`, NHL game ID, scheduled start, and observed game state:

* `expected_game` has one game item for every required historical game plus
  every current due game in the refresh scope;
* `no_due_game` is one positive provider-backed assertion that the player's
  current identified team has no required historical or current due game; or
* `no_team` is one positive provider-backed assertion that the player has no
  current provider team and has no required historical game in that scope.

Therefore one player may have old-team and current-team expected games in the
same refresh. A currently free-agent player may have a null parent team while
retaining old-team required historical games. Either case has disposition
`expected_game`, never a terminal disposition. When normalized into sealed
flat coverage, each expected entry uses that game item's provider team; the
flat shape remains one `providerTeamId` per entry.

One player cannot mix `expected_game` with either terminal disposition, and a
terminal disposition has no NHL game identity. Local omission, an empty
statistics response, a missing identity mapping, or a failed provider read can
never manufacture `no_due_game` or `no_team`.

The distinct player identity set in coverage must equal the requested required
player set exactly. The `(playerId, nhlGameId)` identity set from
`expected_game` coverage entries must equal the observation identity set
exactly, with no duplicate, missing, or extra pair. Each observation child
also binds scheduled start, observed game state, goals, assists, NHL points,
fantasy-point hundredths, and source-update time. An explicit zero-valued row
from the authoritative live source is required for an expected pair that has
no scoring events; absence is never converted to zero. Totals-only
last-season/discovery imports are not eligible for live scoring.

Every exact `requiredPlayerGames` binding must appear as a flat
`expected_game` coverage entry with the same player, provider player/team,
game, and scheduled start. Required historical bindings are therefore a subset
of flat expected coverage; current due games may add entries. All flat expected
coverage, including both subsets, still equals the complete observation
identity set exactly.

The coverage set's lowercase `coverageSha256` is SHA-256 over this exact
`canonical-json-v1` preimage:

```text
domain                           hundo-leago.player-game-stat-coverage-set
schemaVersion                    1
setId
statSourceId
refreshId
nhlSeasonKey
provider
sourceVersion
capturedAtMs
requiredPlayerCount
coverageEntryCount
expectedPlayerGameCount
coverage[]
```

Each `coverage[]` item contains exactly `coverageEntryId`, `playerId`,
`providerPlayerId`, nullable `providerTeamId`, `disposition`, nullable
`nhlGameId`, and nullable `nhlGameScheduledStartsAtMs`, ordered by player ID,
then disposition, then NHL game ID with null first, and then coverage-entry ID.
`expected_game` requires non-null provider-team/game/start fields;
`no_due_game` requires a provider team and null game/start fields; `no_team`
requires null provider-team/game/start fields. The sealed root stores the exact
required-player, coverage-entry, expected-pair, and observation counts plus the
coverage and observation digests.

The set's lowercase `evidenceSha256` is SHA-256 over this exact
`canonical-json-v1` preimage:

```text
domain                           hundo-leago.player-game-stat-observation-set
schemaVersion                    1
setId
statSourceId
refreshId
nhlSeasonKey
provider
sourceVersion
capturedAtMs
observations[]
```

Each `observations[]` item contains exactly `observationId`, `playerId`,
`nhlGameId`, `nhlGameScheduledStartsAtMs`, `observedGameState`, `goals`,
`assists`, `nhlPoints`, `fantasyPointsHundredths`, and `sourceUpdatedAtMs`,
ordered by player ID, then NHL game ID, then observation ID. Children are
staged before the root and become immutable when its exact coverage and
observation counts and digests seal in one transaction. The existing
observation `schemaVersion`-1 preimage remains unchanged. A scoring refresh
without both complete sealed sets, or whose exact required-player or
expected-pair equality check fails, is unavailable.

Each whole-game exclusion references the exact baseline player/game stat
observation from the same provider refresh as the late baseline. Later scoring
subtracts the non-negative current-minus-baseline player/game delta from the
ordinary cumulative current-minus-baseline delta. Missing, stale, regressed,
cross-provider, source-version-unbound, or unsealed evidence keeps the matchup
`awaiting_data`. Late-lock game-state requirements are derived from the sealed
coverage entries for every selected player, never from whichever observation
rows happen to exist. A selected player with `expected_game` coverage requires
each exact game-state observation and baseline player/game observation;
authoritative `no_due_game` or `no_team` coverage requires neither. Scoring and
finalization require the exact current observation for every excluded pair,
with compatible provider lineage and a non-regressed source-update time. A
missing current pair leaves the result `awaiting_data` and prevents official
finalization.

One immutable game-state observation snapshot records the provider, source
version/snapshot key, observed-at time, freshness decision, and every NHL game
state consulted for the selected roster. Its lowercase `observationSha256` is
SHA-256 over this exact `canonical-json-v1` preimage:

For late-lock eligibility, `observedAtMs` must be at or before
`lateSnapshotAtMs` and its age must be no greater than `300000` elapsed
milliseconds. The exact boundary is fresh. Future or older observations fail
closed before the late-lock transaction commits.

```text
domain                           hundo-leago.nhl-game-observation-snapshot
schemaVersion                    1
observationSnapshotId
provider
sourceVersion
observedAtMs
freshnessStatus
games[]
```

Each `games[]` item contains exactly `nhlGameId`,
`nhlGameScheduledStartsAtMs`, and `observedGameState`, ordered by NHL game ID.

One immutable, sealed exclusion root belongs to the exact late roster lock,
baseline, and observation snapshot. It stores the expected exclusion count and
lowercase `evidenceSha256`; child exclusions cannot be added, changed, or
removed after the root is sealed. The digest uses this exact
`canonical-json-v1` preimage:

```text
domain                           hundo-leago.matchup-late-lock-exclusion-set
schemaVersion                    1
exclusionSetId
leagueId
seasonId
matchupWeekId
matchupId
teamId
matchupRosterLockId
lateSnapshotAtMs
observationSnapshotId
observationSha256
exclusions[]
```

Each `exclusions[]` item contains exactly `exclusionId`,
`matchupRosterPlayerId`, `playerId`, `nhlGameId`,
`nhlGameScheduledStartsAtMs`, `observedGameState`, and
`baselinePlayerGameStatObservationId`, ordered by player ID, then NHL game ID,
then exclusion ID. A zero-exclusion sealed root is valid when the fresh
observation proves no selected player's game was underway.

### Deferred Late-Lock Runtime Design Record

The runtime defaults below are retained only to document the unshipped
implementation. They are disabled for the FAD release and are not approved for
activation until reconciled with the completed-game, four-scheduled-evening-refresh
model in the Matchups and Scoring Rules documents.

Affirmative selected-player coverage is required only for a late lock. The
normal scheduled lock keeps its approved behavior and does not acquire a live
coverage or game-state prerequisite.

One shared, never-rejecting post-commit late-lock coordinator applies after
every transaction that commits a roster mutation. Every current and future
writer that can change ownership, roster category or slot, effective position,
active contract state, or authoritative roster legality is registered. The
registry includes ordinary and Injured Reserve moves, buyouts and releases,
ordinary and FAD auction resolution, automatic Candidate allocation, Candidate
carryover movement, trade acceptance and reversal, commissioner additions,
removals and corrections, contract rollover or correction, prospect signing,
release or activation, league position correction, and later equivalent
writers.

An ownership update that changes only `trade_blocked`, `updated_at_ms`, and
optimistic `version` is legality-neutral metadata. It is intentionally not a
registry member and does not invoke the late-lock coordinator because it cannot
change ownership tenure, contract/cap state, roster placement, effective
position, or authoritative roster legality.

The coordinator receives one closed committed-mutation batch:

```text
{
  mutationKind,
  teams: [{
    leagueId,
    seasonId,
    teamId,
    ownershipWitnesses: [{
      ownershipId,
      ownershipVersion,
      state: present | deleted
    }]
  }]
}
```

`mutationKind` must be an exact member of the canonical writer registry; a
bounded but unregistered string is invalid. The batch is grouped into one row
per affected league, season, and team. Team rows and supplied ownership
witnesses are unique and stable-ID ordered. A present ownership uses its
committed version. A deleted ownership uses the last committed version that the
successful writer observed before deletion.

`ownershipWitnesses` may be empty only when the committed writer changed that
team's authoritative roster legality without changing an ownership tenure,
including a cap-only or contract-only effect, an effective-position correction,
or an effect on a truly empty roster. The caller reconstructs that affected team
from its durable committed result. It must never invent an unchanged or
synthetic ownership witness merely to make the array non-empty. Every supplied
witness remains exact and is validated normally. The batch is an internal
post-commit receipt, not a browser request and not new idempotency state.

A team-to-team player or prospect-right transfer closes the source ownership
tenure and creates a distinct destination ownership ID at version `1`. The
source team row carries the deleted source ID and last committed version; the
destination team row carries the new present ID and version. Player and
contract IDs remain stable. Trade acceptance, trade reversal, and commissioner
team transfer persist the exact old-to-new ownership-ID mapping. Reversal
closes the destination tenure and creates another new source tenure; no deleted
ownership ID is resurrected. Exact command replay returns the original mapping
and never repeats the roster mutation.

The coordinator never reruns the writer, never rolls back, compensates, or
reverses the committed roster mutation, and never changes an already-valid
matchup lock. Original-command replay reuses or reconstructs the committed
batch and may retry late-lock evaluation, but it never repeats the original
mutation. After commit, coordinator input validation, target discovery,
repository, provider, or unexpected runtime failure is contained and returns
the safe `awaiting_data` projection; it cannot reject the command that already
committed.

One entire command batch may request at most one server-owned live-statistics
refresh and then retry late-lock evaluation once, regardless of the number of
teams or ownership witnesses. If evidence is still unavailable, the mutation
remains committed. A later scheduled live-statistics refresh invokes
`retryEligibleLateLocks` only from its occurrence handler, only after the
statistics refresh has persisted successfully. That hook is isolated from the
successful refresh result, processes eligible records independently, and must
not initiate another refresh, call the coordinator recursively, fail the
committed statistics occurrence, or repeat any roster mutation.

The public batch projection remains one `lateLock` object. When team results
differ, its `status` is selected in this exact priority order:
`awaiting_data`, `still_illegal`, `completed`, `not_applicable`. `lockId` is
included only when exactly one safely identifiable completed late lock applies
to the complete batch. It is omitted when zero, multiple, unresolved, or
otherwise ambiguous locks apply.

Two staging maintenance operations are explicit coordinator exclusions:

1. the deterministic release-QA fixture reset that reconstructs its complete
   roster and matchup-lock fixture state; and
2. the staging-only provider catalog import, even though a source-position
   change can alter a rostered player's effective position.

Either exclusion is valid only for the exact staging target while league
writes are closed, scheduled jobs are disabled, and no matchup is live or in a
correction state. The operations remain absent from production. If any of
those preconditions is false, the operation is not excluded and must use an
approved bulk post-commit legality reconciliation before writes or jobs reopen.
The registry and composition tests name these exclusions explicitly; no other
writer becomes exempt by analogy.

Late-lock replay is semantic and uses reconstructible committed evidence; it
does not add a request ID or idempotency-request schema. Replay first verifies
the committed roots and children, then compares their business preimage with
the current attempt. UUIDs newly proposed for child rows are ignored for this
equivalence comparison because they are generation artifacts. A
difference in the late-snapshot or evidence timestamps, either source lineage,
the selected-roster identity and ordering, the sealed coverage choice, or the
whole-game exclusion set is a conflict rather than an equivalent replay.
Stored UUIDs remain part of their normative digest preimages: ignoring a
newly generated candidate UUID never permits a stored digest mismatch.

The statistics refresh `sourceVersion` and the fresh NHL game-state read
`sourceVersion` are separate independently digested lineages. The statistics
lineage seals required-player coverage and player-game observations; the
game-state lineage seals the separate fresh underway decision. Their providers
must satisfy the configured compatible-provider rule, but their
`sourceVersion` values are not required to be equal.

For late-lock evaluation, the backend verifies the sealed coverage manifest
and selects the exact distinct NHL games from `expected_game` entries for the
selected roster whose scheduled starts fall inside the current matchup week's
inclusive-start, exclusive-end scoring window. That exact in-week due-game set
is the request to a separate NHL game-state read: no requested game may be
missing and no unrequested game may affect the decision. Coverage selects the
games; only the separate game-state result decides whether each game is
underway. Its `observedAtMs` must be at or before `lateSnapshotAtMs` and no more
than `300000` elapsed milliseconds earlier; the exact boundary is valid.

Every use, semantic replay, scoring calculation, and finalization recomputes
and verifies all four committed digests and their exact child counts:

1. player-game coverage `coverageSha256`;
2. player-game observation `evidenceSha256`;
3. fresh game-state `observationSha256`; and
4. late-lock exclusion `evidenceSha256`.

Creating an exclusion requires its exact pair to have sealed
`expected_game` coverage and the linked baseline player-game observation.
Scoring and finalization additionally require that every excluded pair remains
`expected_game` in the selected current refresh, has its exact current
observation, uses compatible provider lineage, and has a source-update time
that does not regress behind the linked baseline observation. A terminal
coverage disposition, omitted pair, digest/count mismatch, incompatible
provider, or regressed update keeps the lock or matchup `awaiting_data` and
cannot produce an official result.

---

## `free_agent_draft_teams`

This is the immutable participating-team snapshot.

Fields include:

* ID, league, season, FAD, and team;
* readiness-time team status;
* created timestamp.

There is one row per FAD and team. Manager user IDs are not participant keys.
Current accepted manager assignments determine future authority.

---

## `candidate_cards`

There is one card per FAD team.

Fields include:

* ID, league, season, FAD, and team;
* status: `open`, `locked_complete`, `locked_incomplete`, or
  `locked_conflicted`;
* derived completeness status;
* blocking validation count;
* total structural conflict count;
* carried-roster structural conflict count;
* maximum possible cap cents;
* `cap_status`: `compliant` or `over_cap`;
* `allocation_eligibility`: `eligible`, `excluded_structural_conflict`, or
  `excluded_over_cap`;
* nullable `allocation_exclusion_reason`, exactly
  `candidate_card_structural_conflict` or `candidate_card_over_cap` when
  excluded;
* locked timestamp;
* version.

The card is the optimistic-concurrency aggregate. Every selectable edit or
automatic carryover synchronization increments the card version once.

---

## Canonical Slot Keys

Slots are a fixed protocol and do not need a mutable slots table:

```text
F01 through F12
D01 through D06
B01 through B04
```

The backend parses and allowlists slot keys.

* `F` accepts an effective F.
* `D` accepts an effective D.
* `B` accepts an eligible F or D whose proposed or carried contract satisfies
  Bench rules.
* F and D slots are mandatory.
* B slots are optional.

No client-created slot ID is accepted.

---

## `candidate_card_entries`

This table materializes current card occupants.

Fields include:

* ID, league, season, FAD, card, and team;
* `entry_kind`: `carryover` or `candidate`;
* player and effective position group;
* requested slot group and number;
* placement state: `placed` or `conflict`;
* nullable conflict code;
* for carryovers: ownership, contract, source roster category, original
  contract total, original term, AAV, and remaining years;
* for candidates: proposed total, proposed term, derived AAV, eligibility
  status, and safe validation code;
* creating and last-editing actor evidence;
* created and updated timestamps;
* version.

Constraints require:

* one player at most once per card;
* one `placed` entry per slot;
* candidate proposal fields only on a candidate entry;
* ownership and contract linkage only on a carryover entry;
* a user-created candidate to be `placed`;
* F/D/B compatibility;
* server-derived AAV.

A summer synchronization may move a selectable candidate to `conflict` rather
than silently delete it when a newly carried obligation must claim that
position. The intended slot remains recorded and the card reports the conflict.
That candidate is invalid at the deadline unless corrected.

---

## `candidate_card_revisions`

This is immutable private audit history.

Fields include:

* ID, league, season, FAD, card, team, and resulting card version;
* action:
  `card_opened`, `candidate_added`, `candidate_edited`, `candidate_moved`,
  `candidate_removed`, `carryover_moved`, `carryover_synchronized`,
  `eligibility_revalidated`, `summer_state_synchronized`, or
  `deadline_locked`;
* affected entry and player when applicable;
* actor user, membership, and authority:
  `manager`, `commissioner`, `platform_administrator_as_commissioner`, or
  `system`;
* immutable bounded before and after JSON;
* safe cap and validation warning codes;
* occurrence timestamp.

There is one revision per resulting card version.

Automatic readiness creates every card at version `1` with one `card_opened`
revision. That revision's immutable after-evidence contains the initial
carryover projection, including an empty 22-slot inaugural card. Later writes
increment the card once and append exactly one matching revision.

Before publication, revision content is available only to:

* current managers of that team;
* a current commissioner or inherited platform administrator while an active
  help grant exists;
* explicit protected recovery tooling.

After publication, normal league members see safe actor attribution for
commissioner edits, but not unrestricted private operational metadata.

---

## `candidate_card_help_requests`

Fields include:

* ID, league, season, FAD, card, and team;
* status: `active` or `expired`;
* optional bounded message;
* requesting user and membership;
* requested and expiry timestamps;
* version.

There is at most one help request per card and FAD. Expiry equals the Candidate
Card deadline.

The grant follows the current commissioner authority, not a commissioner user
snapshot. A commissioner replacement receives current help-granted access; the
former commissioner loses it. A platform administrator must also hold active
league membership and exercise inherited commissioner authority.

There is no ordinary revoke or extension command.

---

## Deadline Snapshot Tables

`candidate_card_snapshots` stores:

* one immutable snapshot per card;
* card version at lock;
* effective deadline and actual processing timestamp;
* completeness, cap, validation, total-conflict, carried-roster-conflict, and
  whole-card allocation-eligibility summaries;
* locked status.

`candidate_card_snapshot_entries` stores:

* exactly one row for each of the 22 canonical slots, including empty slots;
* an additional row for every unplaced conflict;
* occupant kind: `empty`, `carryover`, or `candidate`;
* immutable player, slot, position, carryover, contract, offer, validation, and
  last-edit attribution fields;
* immutable card-level exclusion reason copied to every candidate offer when
  the complete card has an unresolved carried-roster structural conflict or is
  over cap;
* source current-entry ID when present.

The current card and snapshot are never rewritten to contain only winners. A
card with an unresolved carried-roster structural conflict or an over-cap
projection remains fully published with its carryovers and offers, but every
new candidate offer is marked ineligible with the card-wide exclusion reason.
The deadline transaction never removes an arbitrary offer or carryover to make
that card fit.

---

## `free_agent_draft_player_allocations`

There is one aggregate per distinct candidate player in the deadline snapshot.

Fields include:

* ID, league, season, FAD, and player;
* status:
  `pending`, `automatic_award`, `restricted_scheduled`,
  `restricted_active`, `restricted_fallback_open`,
  `restricted_resolved`, `fallback_open_resolved`, `no_valid_offer`,
  `invalid`, or `correction_required`;
* decision code:
  `sole_valid_offer`, `highest_total`, `highest_equal_total_aav`,
  `exact_total_and_term_tie`, `no_valid_offer`, `invalid_snapshot`,
  `candidate_card_structural_conflict`, `candidate_card_over_cap`,
  `restricted_auction_result`,
  `restricted_no_improvement_fallback`,
  `fallback_open_result`, `fallback_open_no_winner`, or `corrected`;
* winning snapshot entry, team, contract, and ownership when applicable;
* restricted auction and linked fallback-open auction when applicable;
* resolved or accounted timestamp;
* safe current error code;
* version.

There is one allocation per FAD and player, at most one linked restricted
auction, and at most one linked no-improvement fallback auction.

Allocation-phase accounting treats every status except `pending` as accounted.
Final FAD completion treats only these as terminal:

```text
automatic_award
restricted_resolved
fallback_open_resolved
no_valid_offer
invalid
```

`restricted_scheduled`, `restricted_active`, and
`restricted_fallback_open`, plus `pending` and `correction_required`, block
final completion.

Players with `pending`, `correction_required`, any unresolved restricted state,
or an unresolved fallback auction are quarantined from unrelated open rapid
and ordinary auctions.

Allocation status is not the only quarantine source. A player is also
FAD-recovery-quarantined while any linked `fad_open_rapid` or
`fad_restricted` auction has a recovery in `pending`, `ready`, `running`, or
`correction_required`, or is linked to a `recovery_required` rollover without
a resolved downstream recovery. This applies even when an open rapid auction
has no FAD allocation row and even after the parent FAD is `completed`.

Quarantine ends only when the authoritative transaction proves one of:

* the retry produced a terminal auction resolution and the linked recovery is
  `resolved`;
* an explicit commissioner cancellation produced the approved no-winner or
  correction-required state, with any required correction subsequently
  resolved; or
* an allocation correction atomically reconciled the player and resolved every
  linked recovery.

Marking the FAD or rollover complete, changing an auction to `failed`, or
recording a failed job attempt never releases quarantine.

---

## `free_agent_draft_allocation_events`

This append-only table preserves:

* all valid and invalid snapshot offers considered;
* total-first and AAV-second ranking evidence;
* original decision and later correction decisions;
* winner, losing reason, restricted-participant set, or invalid reason;
* linked contract, ownership, auction, activity, and correction records;
* system or commissioner actor;
* occurrence timestamp;
* immutable versioned decision JSON where needed.

The current allocation aggregate may change during recovery, but the original
decision event remains queryable.

---

## `free_agent_draft_rollovers`

Automatic readiness creates the seven initial rows. A rollover transaction
creates the next contiguous extension row when terminal FAD work requires
another complete 24-hour blind window.

Fields include:

* ID, league, season, FAD, and sequence `>= 1`;
* `window_kind`: `initial` for sequences `1..7` or `extension` thereafter;
* window opening timestamp;
* creation cutoff timestamp;
* rollover timestamp;
* status: `scheduled`, `processing`, `completed`, or `recovery_required`;
* processing and completion timestamps;
* safe error code;
* version.

Unique constraints cover FAD sequence and FAD rollover timestamp.

Constraints require sequences to remain contiguous, initial rows to be exactly
`1..7`, each later row to be exactly 24 elapsed hours after its predecessor,
and an extension row to be created only from a completed/processing
predecessor with durable queued, fallback, delayed, or recovery work. An
extension is not a synthetic ordinary-weekly boundary.

---

## `free_agent_draft_nomination_queue`

This private table stores a manager nomination accepted at or after the
60-minute creation cutoff for the next rollover.

Each row stores:

* ID, league, season, FAD, nominating team, player, and source rollover;
* exact binding opening total, term, and derived AAV;
* required binding-illegality confirmation and confirmation timestamp;
* submitting user/membership, accepted timestamp, and card/team version
  evidence;
* status `queued`, `opened`, or `invalid`;
* target opening rollover and following resolution rollover;
* nullable opened auction and terminal timestamps;
* safe validation/error code and version.

Queue contents are visible only to the nominating team and authorized
recovery tooling until the auction opens. At most one pending queue row for a
player may exist league-wide, regardless of nominating team or opening
boundary; a partial unique index enforces
`(league_id, season_id, player_id) WHERE status = 'queued'`. At rollover, each
still-valid row
atomically creates one `fad_open_rapid` blind auction, submits the nominator's
binding starter bid, marks the row `opened`, and targets the following
rollover. When the following row does not exist, the transaction first creates
the next contiguous extension. The starter bid preserves the queue's
`accepted_at_ms` as its first-submission and cooldown anchor; opening time does
not reset the ordinary cooldown.

The queue does not reserve cap, roster position, player ownership, or any
other auction. A queued row that becomes invalid before opening records its
safe reason and creates no auction; it is never silently discarded. A manager
cannot withdraw or cancel a queued nomination after the binding submission.

Schema constraints require an `invalid` row to have a safe validation code and
terminal timestamp with no auction link; an `opened` row to have its exact
auction link and opening timestamp; and `queued` to have neither terminal
evidence nor auction. Neither a manager nor a commissioner can cancel an
otherwise valid queued nomination; recovery may retry opening it or record an
objective validation failure.

A competing cross-team nomination that collides with a private queued row
returns the same generic `409 FAD_ALLOCATION_QUARANTINED` representation used
for every temporarily unavailable FAD player. Safe details omit causal
resource kind, queue identity, team, bid, and timing, so the response does not
confirm that another manager queued the player.

---

## `free_agent_draft_recoveries`

This table records explicit non-hidden recovery.

Fields include:

* ID, league, season, FAD;
* required player link for player-specific recovery and nullable allocation,
  rollover, auction, and job-run links;
* kind:
  `deadline_retry`, `allocation_retry`, `restricted_activation`,
  `queued_nomination_activation`, `fallback_activation`,
  `auction_resolution`, `rollover_finalize`, or `completion`;
* status:
  `pending`, `ready`, `running`, `resolved`, or `correction_required`;
* earliest activation and target resolution timestamps where applicable;
* safe error code and bounded commissioner reason;
* creating operation and resolving actor;
* created, updated, and resolved timestamps;
* version.

Every player-specific auction recovery stores both its player and auction.
Every rollover recovery stores the rollover plus each causal auction or
job-run link directly on one recovery row per causal operation; no implicit
many-to-many evidence is inferred from status alone. A recovery cannot become
`resolved` until its linked auction/allocation/result state satisfies the
approved terminal invariant.

---

## `auction_contexts`

This one-to-one auction sidecar stores:

* ID, league, season, and auction;
* `source_kind`:
  `ordinary_weekly`, `fad_open_rapid`, or `fad_restricted`;
* nullable FAD and rollover;
* nullable FAD allocation, required for a restricted auction and for a
  no-improvement fallback open auction;
* nullable FAD origin:
  `manager_nomination`, `queued_nomination`,
  `candidate_tie_restricted`, or
  `restricted_no_improvement_fallback`, required for FAD contexts and null for
  ordinary weekly auctions;
* created timestamp.

Existing auctions are backfilled as `ordinary_weekly`. Every newly created
auction writes its context in the same transaction.

An auction missing context after migration is operationally invalid; it is not
silently treated as ordinary.

The relationship matrix is exact:

* `ordinary_weekly` has no FAD, rollover, allocation, or FAD origin;
* `fad_open_rapid` has a FAD and target FAD rollover; its allocation is null
  for a manager-nominated auction and required for a restricted
  no-improvement fallback; its origin discriminates direct, queued, and
  fallback creation;
* `fad_restricted` always has a FAD, allocation, and
  `candidate_tie_restricted` origin;
* every FAD auction has its exact target FAD rollover, creating a contiguous
  extension rollover when no existing row provides the complete fair window.

No restricted or fallback path is deferred into an ordinary weekly auction to
preserve an old Week 1 date.

---

## `auction_administration_command_results`

Every successful commissioner HTTP command `T-080` through `T-083` has exactly
one immutable result row. This row is the authoritative source for exact
idempotency replay; a replay never reconstructs an earlier response from the
auction's later mutable state.

Fields include:

* ID, league, season, auction, and nullable bid;
* one required, unique, same-league `idempotency_request_id`;
* action:
  `edit_bid`, `remove_bid`, `cancel_auction`, or `request_resolution`;
* actor user, active league membership, and actual authority:
  `commissioner` or `platform_administrator_as_commissioner`;
* lowercase `request_sha256`, equal to the linked idempotency request's request
  hash;
* precondition kind, exactly `bid` or `auction`, and positive
  `expected_resource_version`, equal to the version supplied by the required
  `If-Match`;
* positive `resulting_resource_version`, preserving the exact resource-version
  evidence committed by the successful command;
* original HTTP status;
* exact successful response `data` as `canonical-json-v1`;
* lowercase `response_sha256`, equal to SHA-256 over the UTF-8 bytes stored in
  `response_json`;
* nullable `job_run_id`, required only for `request_resolution` and required
  null for every other action; it binds the exact `auction.resolve.target`
  durable job occurrence whose occurrence key is
  `auction:<auctionId>:<resolvesAtMs>`;
* created timestamp; and
* version, exactly `1`.

The action matrix is exact:

| Action | Command | Idempotency operation | Bid link | Precondition | Result version | HTTP status |
| --- | --- | --- | --- | --- | --- | --- |
| `edit_bid` | `T-080` | `auction.bid.put` | required | `bid` | expected + 1 | `200` |
| `remove_bid` | `T-081` | `auction.bid.remove` | required | `bid` | expected + 1 | `200` |
| `cancel_auction` | `T-082` | `auction.cancel` | null | `auction` | greater than expected | `200` |
| `request_resolution` | `T-083` | `auction.resolve.request` | null | `auction` | unchanged from expected | `202` |

The request hash uses `canonical-json-v1` over exactly:

```text
domain                           hundo-leago.auction-administration-request
schemaVersion                    1
leagueId
auctionId
bidId                            nullable
action
preconditionKind
preconditionVersion
body                             exact endpoint body
```

The idempotency key is already part of the linked request's uniqueness scope
and is not duplicated inside this preimage. Within league isolation, exact
replay is scoped by the exact operation above, actor user, and client key, and
must resolve to the linked immutable result row. A different operation or
actor with the same client key is a different idempotency scope. The body
preserves the exact approved command fields and values; omitted and
explicit-null values are not interchanged.

`response_json` contains the exact endpoint success `data` value, not
request-specific envelope metadata. On fresh success, the command's state
changes, audit/history/outbox evidence, this result row, and completion of the
linked idempotency request commit in one immediate transaction, with
idempotency completed last. Before commit, the service rereads the canonical
stored JSON, recomputes both hashes, and proves that the actor, precondition,
resource links, expected/resulting versions, status, and response agree.

After authentication, league isolation, and current auction-administration
authority are revalidated, an exact replay is checked before mutable auction
state, current resource version, clock, or new identifier generation. It
returns the stored HTTP status and parses the stored `response_json` as the
response `data`; the transport adds only the new request's `meta.requestId`.
The stored expected/resulting version evidence remains the authority for the
replayed representation; replay does not substitute a later resource version.
Later bid edits, removals, auction resolution, correction, job completion, or
authority-preserving resource changes cannot alter the replayed data. In
particular, a `T-083` replay returns the originally stored `pending` or
`already_succeeded` descriptor even if its job later changes state. Its
response `operationId` and `occurrenceKey` originate from the bound durable
`auction.resolve.target` job, never from separately generated response-only
identifiers.

The row, its hashes, and the completed idempotency back-link reject update and
delete. A malformed, unauthorized, missing, stale, conflicting, not-due, or
otherwise unsuccessful request commits neither a new idempotency request nor
an administration result. Changed-input reuse leaves the existing pair
untouched and returns the shared idempotency conflict. Scheduled resolution has
no commissioner HTTP idempotency request and therefore creates no
`auction_administration_command_results` row.

---

## `free_agent_draft_auction_participants`

One row represents one eligible team in a restricted auction.

Fields include:

* ID, league, season, FAD, allocation, auction, and team;
* status: `active` or `removed`;
* source Candidate snapshot entry;
* originating Candidate revision;
* immutable minimum total, term, and AAV copied from the original tied
  Candidate contract;
* nullable current active-improvement bid;
* the regular auction manager edit limit and cooldown duration copied at
  activation;
* nullable first-improvement and current cooldown-anchor timestamps;
* nullable improvement-committed timestamp;
* originating Candidate actor for historical attribution;
* nullable removing actor, authority, optional bounded reason, and removal
  timestamp;
* created and updated timestamps;
* optimistic version.

There is one row per restricted auction and team. Absence from this table
or status `removed` denies bid creation or editing for that team. A removed row
is retained permanently and cannot be recreated or returned to `active`.

Activation creates no auction bid, leader, or cooldown anchor. A participant
is a current contender only when its row remains `active`, it has one linked
valid current active-improvement bid, the ordinary edit/cooldown rules were
respected, and that contract ranks strictly above the participant minimum by
total first and AAV second. Commissioner removal or bid
invalidation removes that improvement from the resolution-time contender
set. Historical submission alone never qualifies.

The originating revision is the latest accepted non-system
`candidate_added`, `candidate_edited`, or `candidate_moved` revision for the
snapshot's source entry and player. Its actor user, membership, and authority
are copied to the participant as immutable provenance. Later system
reconciliation does not replace that historical actor. The minimum is
system-authored evidence; future bid authority belongs to the participant
team's current manager.

---

## `free_agent_draft_draws`

Every open or restricted FAD auction receives one private 32-byte random nonce
when the auction becomes Active. Ordinary weekly auctions receive no row and
retain their existing deterministic tie-break.

The row stores:

* ID, league, season, FAD, nullable allocation, and auction;
* algorithm version;
* private nonce;
* public pre-resolution commitment;
* ordered exact-tie bid IDs after resolution;
* rejection-sampling counter and selected index when used;
* selected bid and team;
* revealed, created, and updated timestamps;
* optimistic version.

The commitment is:

```text
SHA-256(
  frame(UTF8("hundo-fad-draw-v1")) ||
  frame(UTF8(lowercaseAuctionUuid)) ||
  frame(nonceBytes)
)
```

Before resolution, the API must expose the commitment on the active FAD
auction and must not expose the nonce.

For an exact remaining tie, the backend:

1. sorts eligible tied bid IDs lexicographically;
2. derives successive 256-bit values from
   `SHA-256(frame(UTF8("hundo-fad-draw-v1")) || frame(nonceBytes) ||
   frame(UTF8(lowercaseAuctionUuid)) || uint64be(rolloverAtMs) ||
   encodeBidIds(orderedBidIds) || uint32be(counter))`;
3. rejects values outside the largest multiple of participant count below
   `2^256`;
4. selects `value mod participantCount`;
5. persists and reveals the complete evidence with the resolution.

Canonical encoding is algorithm-versioned and exact:

```text
frame(bytes)       = uint32be(byteLength) || bytes
encodeBidIds(ids)  = uint16be(ids.length) ||
                     frame(UTF8(lowercaseUuid(ids[0]))) || ...
```

* UUID strings are canonical lowercase ASCII with hyphens, exactly 36 bytes
  when UTF-8 encoded; the domain label is the exact UTF-8 text shown above.
* The nonce is exactly 32 raw random bytes, never a hex or base64 string inside
  the digest input.
* `rolloverAtMs` is a non-negative unsigned 64-bit big-endian integer.
* `counter` is an unsigned 32-bit big-endian integer beginning at `0`.
* The ordered list contains canonical tied bid IDs, not team IDs; its count
  must fit unsigned 16-bit.
* SHA-256 output and stored commitment/digest values use lowercase hexadecimal
  for display, while selection interprets the raw 32-byte digest as one
  unsigned big-endian integer.
* For participant count `n`, the rejection threshold is
  `floor(2^256 / n) * n`; a digest value greater than or equal to that threshold
  is rejected and the counter increments.

This produces an unbiased, auditable, replay-stable draw. A retry uses the same
committed nonce and cannot redraw.

Every FAD draw is revealed exactly once with the transaction that commits a
semantic terminal result. An open-rapid commissioner cancellation reveals only
when that transaction commits the approved recovered/no-winner semantic
outcome. Restricted commissioner cancellation enters `correction_required`
and leaves the reveal null until a later correction or retry commits the
semantic result. An unresolved
operational failure may move the physical auction to `failed` for scheduling
and quarantine, but it is not yet a semantic result: it writes the exact system
event `fad_auction_resolution_failed` plus durable recovery, writes no
`auction_resolutions` row, leaves the draw private at version `1`, and leaves
the remaining bids frozen. A later retry uses that same committed nonce and
performs the one reveal; it cannot redraw.

When ranking did not require random selection, the ordered bid array is exactly
`[]`, while the rejection counter, selected index, selected bid, selected
team, and selection digest are null. The revealed nonce still proves the
original commitment; no unused winner is fabricated.

---

## Scoped Outbox and Notification Deduplication

Add `outbox_event_audiences` with:

* outbox event and required league;
* audience kind: `league`, `team`, or `user`;
* exactly one applicable league, team, or user target;
* uniqueness per event and audience.

Every audience row requires `league_id`; a user target is a user room scoped by
that league. Existing non-realtime global/account/security/email outbox rows do
not receive an audience row and are never joined to a league or team Socket.IO
room.

Existing league-scoped realtime outbox events are backfilled with a league
audience. Existing global, account, security, and email-delivery outbox rows
whose `league_id` is null retain their current pipeline and receive no invented
league audience. New FAD and other league-realtime publication code requires at
least one explicit audience and publishes only to the corresponding authorized
Socket.IO room.

Before the publisher begins requiring audiences, every existing league outbox
writer is moved behind one shared `LeagueOutboxWriter`. Its default for an
ordinary league-visible event is one league audience; private FAD callers must
provide narrower team/user audiences explicitly. The retrofit includes current
auction resolution, trade creation/execution/expiry/reversal, roster, contract,
activity, notification, and matchup league-event writers. Repository tests
prove that no league-scoped realtime outbox insert can commit without an
audience.

Migration/backfill, writer retrofit, and publisher enforcement are one ordered
deployment boundary. League writers are quiesced while the migration/backfill
runs, so an old process cannot insert an audience-less league event between
backfill and the new runtime starting.

Add nullable `notifications.deduplication_key` and a partial unique index over
user, event type, and non-null deduplication key.

These are general reliability extensions required because a league-wide
outbox broadcast is unsafe for private Candidate Card changes.

---

# Part 4 - Automatic Readiness and Carryover

## Automatic Readiness Evaluation

The readiness service's internal preflight is read-only and verifies:

* target season is current, active, and has no FAD completion timestamp;
* the exact succeeded prior-season rollover and live-state predicate above is
  complete when applicable;
* one completed Entry Draft exists, or an approved no-draft path is available;
* Week 1 exists and is the unique sequence-1 matchup week for the target
  season;
* Week 1 can be advanced by whole league-local Mondays, when necessary, until
  the Candidate deadline is future-facing and the full seven-day period fits;
* every participating team is active and has an accepted manager assignment;
* ownership, contract, roster, and prospect-right state is internally
  consistent;
* the participating team count and first-matchup boundary;
* projected carryover counts and structural conflicts.

Preflight creates no defaults, exemptions, cards, schedule changes, jobs,
notifications, or activity. `T-127` does not invoke preflight; it returns the
durable readiness-operation state plus the latest immutable attempt snapshot.
There is no readiness-preview HTTP route. No-write acceptance evidence covers
the T-127 response byte/semantics and the internal preflight independently.

---

## Automatic Readiness Transaction

Entry Draft completion, or the approved no-draft equivalent, atomically creates
the operation and pending `fad_readiness` occurrence described above. When its
worker is leased, one system-authored opening transaction:

1. revalidate the complete preflight;
2. advance Week 1 by whole Mondays and atomically regenerate the shortened
   regular-season schedule/jobs when required;
3. consume opening evidence;
4. create the FAD and frozen team rows;
5. create one card per team;
6. materialize carryovers;
7. create the seven initial rollover rows;
8. create the deadline and reminder job occurrences;
9. create `free_agent_draft_started` League Activity;
10. create one low-noise `fad_cards_opened` notification per current accepted
    manager/participating-team/card tuple;
11. create the exact metadata-only outbox publications:
    * one league-audience `free_agent_draft.changed/cards_opened` event;
    * one league-audience `activity.created/cards_opened` event for the
      `free_agent_draft_started` activity;
    * one `candidate_card.changed/card_changed` event per card to that card's
      team audience; and
    * one `notification.created/cards_opened` event per notification to that
      notification's exact user audience;
12. commit and then publish those events.

`free_agent_draft_started` is exclusively the League Activity event type.
`fad_cards_opened` is exclusively the manager notification type and is never
an outbox event type. The activity, notification, and four exact publication
sets are distinct evidence and are never substituted for one another.

No Candidate Card is fillable or readable as an open card before this entire
transaction commits after Entry Draft completion or the approved no-draft
equivalent. A manager responsible for multiple participating teams receives
the private notification and team/card invalidation separately for each team.
Non-managers receive no Candidate Card notification or private card
invalidation; their user-visible opening signal is the normal
`free_agent_draft_started` League Activity entry. League-scoped opening events
contain metadata only, grant no card access, and expose no card, player, offer,
slot, help, contract-value, or bid data.

Failure rolls back every opening step and opens no card. Only after that
rollback does the same leased worker commit the immutable blocked-attempt and
notification transaction defined above. Corrective prerequisite writes
re-enqueue evaluation; an authorized commissioner may request an idempotent
retry but may not provide an opening timestamp, bypass a blocker, or choose a
subset of teams. Idempotent replay returns the original FAD.

---

## Carryover Projection

Automatic readiness reads only target-season ownerships whose:

* ownership kind is `Rostered`;
* roster category is Active, Bench, or Injured Reserve;
* normal or fantasy-ELC contract is active and has one `current`
  `contract_years` row for the target season.

Projection rules are deterministic:

* Active F/D preserves the authoritative finite Active slot when possible.
* Bench preserves the authoritative finite Bench slot and eligibility.
* Injured Reserve remains IR in the authoritative roster and reserves the
  lowest available compatible F or D Candidate slot.
* Stable ownership ID is the tiebreak when more than one carried obligation
  competes for the same projection.
* After opening, an eligible carryover may be moved between a compatible
  Active F/D slot and any position-neutral Bench slot for which its AAV is
  eligible. One atomic target-season roster transaction changes the
  authoritative Active/Bench category and slot plus the Candidate projection;
  ownership identity and contract fields remain unchanged.
* An obligation that cannot be placed becomes a visible `conflict` entry.
* Prospect-category ownership, retained salary, and buyout penalties do not
  occupy Candidate slots.

The projection copies contract display evidence but does not create, restart,
extend, or modify the contract.

---

## Summer Synchronization

While cards are open, successful trades, buyouts, prospect signings,
commissioner corrections, and roster movements must invoke a shared
`CandidateCardCarryoverSynchronizer` inside the same SQLite transaction.

The synchronizer:

* recalculates the carryover projection for every directly affected team card;
* revalidates every open league card containing any player whose ownership,
  contract, prospect-right, effective-position, or active-state eligibility
  changed;
* adds, moves, updates, or removes carryover projections;
* preserves a manager's compatible target-season carryover rearrangement
  unless later authoritative eligibility or an unavoidable slot conflict
  invalidates it;
* never removes a selectable candidate silently;
* records one private `carryover_synchronized`, `eligibility_revalidated`, or
  combined `summer_state_synchronized` revision as applicable;
* records candidate validation changes, including invalid-to-valid recovery,
  without deleting the candidate;
* increments every changed card once;
* emits private invalidation metadata to each changed card's scoped audiences
  only.

League-scoped ownership, contract, prospect-right, effective-position, and
player-state writes must invoke this synchronization in the same transaction.
If synchronization cannot persist, the underlying summer transaction rolls
back. A provider import that can affect an unbounded set of players instead
creates one durable revalidation occurrence per semantically changed player,
affected open FAD, and source operation in the import transaction. Candidate
eligibility changes only when player active status or the effective F/D
position group changes. Presentation fields, raw payload, and source-version-
only changes create no occurrence, and a league position override may mask a
source-position change. The same transaction creates each exact pending
`fad_eligibility_revalidation` shared-lease job and ends by writing one global
`player_catalog_applied` operational event that seals the complete occurrence
and job batch.

Each leased occurrence revalidates that player's entries across every matching
card and terminalizes its job in the same transaction. Those occurrences must
finish, or be authoritatively consumed by deadline reconciliation, before
deadline locking can snapshot the cards. Eventual untracked asynchronous repair
is not an accepted path.

The deadline job runs one final authoritative all-card reconciliation before
snapshot creation. In that same transaction it leaves already terminal
occurrence jobs unchanged and compare-and-swap consumes every observed
`pending`, `failed`, `leased`, or `running` occurrence job as `skipped` with
canonical outcome `deadline_reconciled`. A prior worker lease and version then
fail stale. The schema rejects the `cards_open` to `deadline_locked` transition
unless every occurrence job is `succeeded` or `skipped`. This is an explicit
scheduled write, not a GET side effect.

---

# Part 5 - Candidate Card Commands

## Authorization

Before the deadline, private card read and write authority is granted only to:

1. a current accepted manager of that team; or
2. the current commissioner, or inherited platform administrator with active
   league membership, when that exact card has an active help request.

Commissioner role alone provides only safe completion and operational summary.

Every command derives actor, membership, role, team assignment, league, season,
clock, FAD, and help grant from authoritative backend state.

---

## Aggregate Concurrency

Candidate Card writes require:

```text
If-Match: "<cardVersion>"
Idempotency-Key: <opaque client intent key>
```

The card version, not an entry version, owns the mutation boundary. A stale
write returns `412 CANDIDATE_CARD_PRECONDITION_FAILED` and does not merge.

An exact idempotent replay returns the original authoritative result. Reusing a
key with changed intent returns `409 IDEMPOTENCY_KEY_REUSED`.

---

## Candidate Validation

Each add or edit revalidates:

* active authorized editor;
* FAD phase, league operational freeze, and exact server deadline;
* card version;
* canonical slot;
* slot availability and carryover identity/contract lock;
* stable player and effective F/D position;
* approved league player pool;
* player active state;
* league-specific ownership, contract, and prospect-right exclusion;
* released or declined prospect-right exclusion under the exact event-bound
  re-entry rule below;
* no duplicate player on the same card;
* total, term, precision, server-derived AAV, and minimum AAV;
* Bench eligibility and maximum `$4 AAV`;
* maximum possible cap and general-illegality warnings.

Eligibility is checked again at the deadline. Another team's nomination never
makes a player ineligible.

Rights-release re-entry is exact and event-specific. Each
`ownership_events` row for `fantasy_elc_declined` or
`unsigned_prospect_rights_released` excludes that league/player unless a
`draft_eligible_players` row in the same league has
`eligibility_reason = rights_release_reentry`, binds that exact release row
through `rights_release_event_id`, belongs to a same-league
`draft_eligibility_snapshots` row whose status is `confirmed`, and has a
snapshot `confirmed_at_ms` strictly later than the release event's
`occurred_at_ms`. Every such release event must have its own qualifying later
approval. An earlier approval never clears a newer release. T-133 search and
every Candidate action that evaluates player eligibility use this same
predicate, so preview and search cannot admit a player that the authoritative
save path would reject.

The move command accepts both candidate and carryover entry IDs. For a
carryover it permits only a compatible slot change and rejects removal,
player replacement, contract replacement, or contract edits.

---

## Candidate Cap Projection

The backend computes Candidate cap values for the target season as:

```text
carriedActivePlayerAmountCents =
  sum(
    target-season contract AAV
    - cumulative target-season retained AAV on that contract
    for every Active rostered player with an active normal or fantasy-ELC
    contract
  )

retentionObligationCents =
  sum(target-season retained-salary obligations charged to the team)

buyoutPenaltyCents =
  sum(target-season buyout penalties charged to the team)

carriedCapUsageCents =
  carriedActivePlayerAmountCents +
  retentionObligationCents +
  buyoutPenaltyCents

proposedCandidateAavCents =
  sum(server-derived AAV for every placed F or D candidate whose contract and
      eligibility status is valid or warning)

maximumPossibleCapCents =
  carriedCapUsageCents + proposedCandidateAavCents

maximumCapSpaceCents =
  capLimitCents - maximumPossibleCapCents
```

All inputs are integer cents. `cumulative target-season retained AAV` is the
sum of every active current retention year on that underlying contract and may
not exceed the shared retention ceiling. Subtracting those persisted cent
amounts produces the current owner's player amount; the responsible team or
teams separately carry the corresponding retention obligations, so retained
salary is neither omitted nor double-counted for one team.

Bench, Injured Reserve, Prospect-category contracts, and prospect rights remain
off-cap under the shared contract and roster rules, regardless of normal or
fantasy-ELC contract type. A valid Bench candidate therefore occupies a slot
and may win without increasing this projection. Retained salary and buyout
penalties count even though they occupy no Candidate slot. An invalid or
unplaced conflict candidate is excluded from
`proposedCandidateAavCents` and separately reported as blocking validation; it
cannot win in that state.

Whole-card allocation eligibility requires both
`carriedRosterStructuralConflictCount === 0` and
`maximumPossibleCapCents <= capLimitCents`. A structural conflict or negative
`maximumCapSpaceCents` may remain before the deadline after the approved
warning, but neither authorizes a new offer to participate at lock. An
unresolved carried-roster structural conflict produces
`allocationEligibility = excluded_structural_conflict` and
`candidate_card_structural_conflict`; otherwise an over-cap projection
produces `allocationEligibility = excluded_over_cap` and
`candidate_card_over_cap`. This ordering is the deterministic reason
precedence when both illegalities exist. `capStatus` still reports `over_cap`
when applicable, so neither condition is hidden. Every carryover remains owned
and published.

The Candidate Card API exposes one `capProjection` object containing exactly
`capLimitCents`, `carriedActivePlayerAmountCents`,
`retentionObligationCents`, `buyoutPenaltyCents`,
`carriedCapUsageCents`, `proposedCandidateAavCents`,
`maximumPossibleCapCents`, and `maximumCapSpaceCents`.
`maximumCapSpaceCents` is a signed integer and is negative when the maximum
winning outcome exceeds the cap.

---

## Candidate Cap Warning

The revision-preview command runs the exact domain calculation without writes.
It returns:

* projected changed slot or entry;
* projected completeness;
* maximum possible cap;
* safe warning codes;
* current card version.

The warning is advisory before the deadline and never blocks an otherwise
valid add, edit, move, or removal. Each command recalculates the projection
against the submitted `If-Match`; it never trusts the earlier preview. Only
the authoritative deadline transaction decides whole-card allocation
eligibility.

The preview samples no durable identifier and advances no persisted timestamp
or version. For an add only, the server derives an opaque
preview-only version-4 UUID from the logical card, current card version,
normalized action, and the first non-colliding deterministic nonce. That UUID
appears only in the projected DTO, is never persisted or accepted as authority,
and is not reused by the authoritative add command.

---

## Help Request

The help command:

* is available at `helpOpensAtMs <= now < candidateDeadlineAtMs`;
* requires current manager authority for that card;
* creates the request, scoped grant, commissioner notification, private audit
  evidence, and scoped outbox audiences atomically;
* accepts an optional trimmed message of at most 500 characters;
* does not extend the deadline;
* is idempotent.

If the card already has an active help request, a repeated command returns that
same request and grant without changing the private message or sending another
notification, even when the caller supplies a new idempotency key. A manager
cannot replace the message after granting access.

The message is never placed in a Socket.IO event, League Activity, general
commissioner list, or application log.

---

# Part 6 - Deadline and Automatic Allocation

## Deadline Transaction

The durable deadline occurrence key is:

```text
fad:<fadId>:deadline:<candidateDeadlineAtMs>
```

At or after the due instant, one transaction:

1. claims the durable occurrence with a lease token;
2. rechecks FAD status and clock;
3. performs final carryover reconciliation;
4. validates every current candidate entry;
5. locks every card as complete, incomplete, or conflicted and persists its
   cap status and whole-card allocation eligibility;
6. expires every help request;
7. creates immutable card and entry snapshots;
8. creates one `pending` allocation per distinct candidate player;
9. creates per-player durable job occurrences;
10. changes FAD status to `deadline_locked`;
11. records publication activity and safe notifications;
12. emits league-visible publication invalidation;
13. commits.

The effective lock instant is the persisted deadline. The processing timestamp
records actual execution time.

---

## Per-Player Ranking

The pure allocation policy:

1. removes invalid snapshot offers and every new offer from a card with an
   unresolved carried-roster structural conflict or over-cap projection from
   competition while preserving them in history;
2. finds the highest original total value;
3. among offers at that total, finds the highest server-derived AAV;
4. awards a unique highest offer;
5. creates a restricted tie only when two or more top offers share both total
   and term.

The policy accepts immutable snapshot values and returns a decision. It has no
database, network, clock, filesystem, random, or Socket.IO access.

---

## Automatic Award Transaction

After the deadline transaction commits, the allocation coordinator first uses
an idempotent compare-and-set transaction to change the FAD from
`deadline_locked` to `allocating`. It verifies that every pending allocation
has its durable occurrence. If no candidate allocations exist, it immediately
runs the same allocation-completion transition instead. A restart may observe
either status and safely continue; no player award begins while the FAD remains
`deadline_locked`.

Each player uses:

```text
fad:<fadId>:allocate:<playerId>
```

One transaction:

1. claims or reclaims the occurrence;
2. loads the pending allocation and immutable offers;
3. rechecks player availability and same-league scope;
4. reruns deterministic ranking;
5. verifies the exact requested Candidate slot remains the authoritative
   destination;
6. creates the winning offer's exact total and term contract;
7. creates contract years and the 14-day free-agent acquisition buyout lock;
8. creates ownership and assigns the exact requested Active or Bench slot;
9. records resulting legality evidence without silently discarding a valid
   award;
10. records allocation and offer-outcome evidence;
11. creates League Activity and scoped outbox events, but no per-player
    automatic-result notification;
12. marks the allocation `automatic_award`;
13. commits.

The existing physical
`contracts.auction_buyout_lock_expires_at_ms` remains the single persisted lock
column for the initial FAD implementation. Domain and API language call it the
free-agent acquisition buyout lock. No duplicate lock field is introduced.

If the exact requested slot cannot be reconciled because authoritative data is
corrupt or unexpectedly changed, the operation creates explicit
`correction_required` recovery evidence without awarding the player. It does
not silently choose another slot.

One player's failure never rolls back another player's committed allocation.
An excluded over-cap-card offer can never reach this transaction.

---

## Allocation Completion

After every allocation has left `pending`, one idempotent coordinator:

* records `allocation_completed_at_ms`;
* changes FAD status to `rapid`;
* creates one `fad_automatic_result` aggregate notification per current
  manager/team pair using deduplication key
  `fad:<fadId>:automatic-result:<teamId>:<userId>`;
* leaves quarantined correction or restricted players unavailable to open
  auctions.

---

# Part 7 - Rapid and Restricted Auctions

## Open Rapid Auction Creation

The existing:

```text
POST /api/v1/leagues/:leagueId/auctions
```

derives `fad_open_rapid` when:

* the league has one current FAD in `rapid`;
* server time is before the current rollover instant;
* the current rollover exists;
* the player is FAD-eligible, unowned, and not quarantined by allocation or
  any unresolved FAD auction/recovery.

When server time is strictly before the current rollover's creation cutoff,
the service creates the auction and assigns:

* FAD target season;
* current rollover;
* `resolves_at_ms = rolloverAtMs`;
* server-owned auction context.

At exactly the cutoff, and throughout the final hour while
`nowMs < rolloverAtMs`, the same command validates the nomination and binding
opening bid but creates only a private nomination-queue row. At rollover, that
row opens atomically with the nominator's starter bid and resolves at the
following rollover. The transaction creates the next contiguous extension
rollover first when necessary.

Existing auction joins and edits remain available until, but not including,
rollover.

Open rapid auctions otherwise use ordinary auction rules, including starter
and joining edit behavior, AAV ranking, anti-bluff pricing, blind values,
contract completion, and legality treatment. Every start, join, edit, and
queued nomination body carries the binding no-reservation/possible-illegality
confirmation. Resolution never requests a second confirmation.

Ordinary weekly auction creation applies the same unresolved FAD
auction/recovery quarantine after FAD completion. It may not treat the season
completion marker alone as proof that a failed FAD auction's player is free.

---

## Restricted Auction Activation

An exact Candidate tie transaction either:

1. creates an Active restricted auction and immutable participant minimums,
   but no bids or leader, immediately when the current rapid window provides
   strictly more than 60 minutes of access;
2. records `restricted_scheduled` for automatic activation at the current
   rollover when processing occurs in the final 60 minutes.

The scheduled activation always targets the following 24-hour rollover. It
creates the next contiguous extension row first when no existing row provides
that window. It never defers the player into an ordinary weekly auction.

Immediate creation atomically creates:

* auction and `fad_restricted` context;
* exact team allowlist;
* one participant minimum per tied team, with no active bid or leader;
* original total, term, and AAV floors;
* draw nonce and commitment;
* auction and FAD history;
* participant notifications;
* allocation link and state.

Delayed activation preserves the original allowlist and minimum values. It
never backdates access.

---

## Restricted No-Improvement Fallback

At restricted resolution, the service derives current contenders only from
participants that remain active and have one valid current active-improvement
bid strictly above their Candidate minimum. If that set is empty:

1. no draw is performed;
2. the restricted auction closes without a winner;
3. its complete participant/bid history is preserved;
4. the allocation becomes `restricted_fallback_open`;
5. one fresh league-wide `fad_open_rapid` auction opens with no bid or leader;
6. that auction links the allocation, carries the original tied floor, and
   resolves at the following 24-hour rollover;
7. the next contiguous extension rollover is created first when necessary.

The fallback floor is total-first/AAV-second across terms. A bid is eligible
when its total exceeds the tied total, or its total equals the tied total and
its AAV is at least the tied AAV. A same-total lower-AAV longer term is
rejected. An equal-floor bid may contend in the fresh fallback even though no
team began as leader.

---

## Restricted Bid Rules

For `fad_restricted`:

* only allowlisted teams may bid;
* authority follows the team's current accepted manager assignment;
* every Candidate offer remains a durable participant minimum if the manager
  does nothing, but is not an auction bid, current contender, or leader;
* the regular auction manager edit limit and cooldown duration apply;
* a participant's first active improvement is a join; later permitted changes
  are edits, and each cooldown anchors to that team's preceding active bid
  activity under the regular auction rule;
* a Candidate minimum may be below the ordinary joining minimum;
* the opening improvement and every later permitted edit must satisfy the
  ordinary joining minimum for its submitted term;
* the opening improvement and every edit must rank strictly above the team's
  Candidate minimum by total first and AAV second; a same-total lower-AAV
  longer term is invalid;
* managers cannot withdraw;
* original Candidate total and term remain public after publication;
* current edited values and terms remain blind;
* commissioner administration never reveals an edited value first.

---

## Restricted Resolution

The contender set is recomputed at resolution. A submitted improvement that is
now invalid or commissioner-removed is not a contender. If the set is empty,
the mandatory no-improvement fallback transaction above runs instead of
generic `no_winner` handling.

Restricted ranking is:

1. highest current AAV;
2. shortest current term;
3. the committed auditable equal-chance draw.

Ordinary anti-bluff pricing runs against valid competing bids. The final total
is then raised, when necessary, to the smallest term-valid amount satisfying:

* the ordinary required winning AAV; and
* the winner's original total-first/AAV-second floor.

Resolution uses the common atomic auction completion path and then changes the
FAD allocation to `restricted_resolved`.

---

## Open FAD No-Winner Resolution

A winning manager-nominated open auction uses the ordinary FAD completion
path. A winning allocation-linked fallback also changes its allocation to
`fallback_open_resolved` with decision `fallback_open_result` in the same
transaction.

A due `fad_open_rapid` auction with no eligible current bid atomically:

1. commits the auction and resolution as `no_winner`;
2. creates no contract, ownership, roster assignment, or draw selection;
3. records the public terminal auction history;
4. resolves any auction recovery;
5. if the auction is a restricted no-improvement fallback, changes its linked
   allocation to `fallback_open_resolved` with decision
   `fallback_open_no_winner`;
6. releases FAD quarantine for the player when no other nonterminal path
   exists; and
7. returns the player to the unclaimed pool.

The player may be nominated again during a later FAD cycle or through ordinary
weekly auctions after FAD and season opening. Normal no-bid resolution never
requires commissioner cancellation.

---

## Commissioner Auction Administration in FAD Context

The approved commissioner auction commands are context-aware and never reveal
a stored active value before the commissioner submits a replacement. `T-076`
and `T-078` safe reads plus ordinary-context `T-080` through `T-083` are
composed and contract-tested locally. FAD-11 now also composes every FAD-linked
administration case with its allocation, participant, quarantine, recovery,
and durable-resolution-request transaction. The scheduled context-aware FAD
resolver and restricted/fallback activation workers remained future work at
that checkpoint, so FAD-11 alone did not satisfy the complete FAD-context
launch gate.

FAD-12 now composes server-derived restricted/fallback manager bidding, the
private/current read and edit-limit projection, exact current participant
linkage, strict total-first/AAV-second Candidate-floor improvement, and the
ordinary joining-team one-edit allowance. Resolution considers current
eligible active bids only, ranks AAV descending then term ascending, and uses
the committed FAD draw only among the exact top tie. A sole or non-tied winner,
no restricted improvement, and an allocation-linked fallback with no contender
all reveal the original commitment with `selectionUsed = false` and null
selection fields. No restricted improvement opens the mandatory fresh league-
wide fallback without a leader; an allocation-linked fallback with no contender
closes without a winner.

The FAD-12 decision boundary accepts only `fad_restricted` Candidate-tie
auctions and allocation-linked `fad_open_rapid` auctions whose origin is
`restricted_no_improvement_fallback`. It rejects direct
`manager_nomination` and `queued_nomination` rapid auctions at that checkpoint.
FAD-13 composes those direct and queued contexts through the same FAD-only
resolver while preserving the FAD-12 restricted/fallback boundary. Winner
pricing retains the normal anti-bluff rule, persists `0`
as the sole-bid second-price input while projecting no competitor, and never
prices a restricted winner below the original Candidate total-first/AAV-second
floor.

For a restricted auction:

* a commissioner edit through `T-080` preserves the participant, the original
  Candidate minimum, and all history; it may bypass manager cooldown and edit
  count under the ordinary commissioner rule, but the supplied replacement
  must still satisfy restricted contract validation and does not consume the
  manager's one edit;
* a commissioner removal through `T-081` atomically marks the bid's existing
  physical status `withdrawn` with a `commissioner_bid_removed` event, marks
  its participant `removed`, records actor and timestamp, and retains every bid
  version; that team cannot recreate a bid or regain eligibility;
* the remaining active participants continue under the same scheduled
  resolution; zero eligible current active improvements, including after the
  last improvement is removed, performs the mandatory no-improvement fallback
  transaction and does not release the player from FAD quarantine;
* cancellation through `T-082` never pretends the Candidate tie was resolved:
  one transaction cancels the auction, writes an `auction_resolutions` row
  whose physical `status = cancelled` and `outcome_code = failed`, changes the
  allocation to `correction_required`, creates recovery and allocation-event
  evidence, and leaves the player quarantined;
* the cancelled terminal auction may be accounted by its rollover, but the
  explicit recovery blocks FAD completion until the correction is terminal.

For a failed `fad_open_rapid` auction, `T-082` is also the explicit
commissioner no-winner recovery. In one transaction it records the terminal
cancelled result with physical resolution `status = cancelled` and
`outcome_code = recovered`, plus the auction event: public auction `status` and
`result.outcomeCode` are both `cancelled`, every winner/contract/money field is
null, and no-winner is the recovery disposition rather than a second terminal
status. The same transaction resolves the linked player/auction recovery and
releases quarantine only when no other allocation or FAD recovery blocks that
player. It has no allocation to update and never creates a winner or contract.

Scheduled resolution, `T-083`, and FAD `retry_auction_resolution` all invoke the
same context-aware service. A successful restricted resolution writes the
auction terminal state, contract/ownership/roster effects when there is a
winner, draw evidence when needed, FAD allocation, and allocation event in one
transaction. A transient failure leaves the auction due and blocks rollover
accounting. A terminal automatic failure changes the auction to physical
status `failed`, exposed in FAD domain language as `correction_required`, and
atomically creates the system-authored `fad_auction_resolution_failed` event
and FAD recovery evidence. It does not create an `auction_resolutions` row,
reveal a restricted draw, or terminalize the remaining restricted bids. This
reuses the existing auction status instead of adding another one while
preserving one immutable semantic result for a later retry or correction.

Any later auction correction that changes a restricted result must update its
linked FAD allocation and append an allocation event in the same transaction.
If the complete linked reconciliation is not safely possible, it makes no
partial result change and leaves or moves the allocation to
`correction_required`.

---

## Auction Administration HTTP Amendment

Current commissioner authority or a platform administrator with active league
membership may use these commands. They persist the actor's actual authority
as `commissioner` or `platform_administrator_as_commissioner`; services must not
hard-code commissioner authority after authorization.

`T-080` requires bid-version `If-Match`, `Idempotency-Key`, and exactly:

```json
{
  "teamId": "opaque-uuid",
  "totalValueCents": 600,
  "termYears": 2
}
```

It returns `200` with the safe auction detail DTO.

`T-081` requires bid-version `If-Match`, `Idempotency-Key`, and exactly:

```json
{
  "confirmation": "REMOVE AUCTION BID"
}
```

It returns `200` with exactly `auction`, `removedBidId`, nullable
`restrictedParticipantStatus`, and nullable `fadAllocationVersion`.

`T-082` requires auction-version `If-Match`, `Idempotency-Key`, and exactly:

```json
{
  "confirmation": "CANCEL AUCTION"
}
```

It returns `200` with exactly `auction`, nullable `fadAllocation`, and nullable
`recoveryId`.

`T-083` is the commissioner HTTP trigger only; scheduled jobs call the same
service directly. It requires auction-version `If-Match`, `Idempotency-Key`,
server time at or after `resolvesAtMs`, and exactly:

```json
{
  "confirmation": "RESOLVE AUCTION"
}
```

It returns `202` with exactly `operationId`, `occurrenceKey`, `auctionId`,
`status`, `acceptedAtMs`, and `pollDescriptor`; `pollDescriptor` is exactly
kind `auction` plus league and auction IDs. `status` is `pending` or
`already_succeeded`. It never accepts a winner, team, value, term, participant,
or custom clock.

Each successful `T-080` through `T-083` transaction writes the exact immutable
`auction_administration_command_results` row defined above and completes its
linked idempotency request last. Exact replay returns that row's original HTTP
status and response `data`, even when the bid, auction, or durable resolution
job has since changed. It does not reproject the current auction or resample
the clock. Any request failure writes neither row.

No written reason is required for these approved auction actions. Malformed
input is `400`; unauthorized scope is `403` or side-channel-safe `404`; missing
auction/bid is `404 AUCTION_NOT_FOUND`; terminal/not-due/context conflicts are
`409`; stale versions are `412 AUCTION_PRECONDITION_FAILED`; and a
well-formed disallowed administration action is
`422 AUCTION_ADMIN_ACTION_INVALID`.

---

## Restricted Minimum and Administrator Authority

A restricted participant minimum is immutable evidence derived from one valid
Candidate snapshot; it is not a bid or a user submission. Context-aware
historical authority validation verifies:

* the `fad_restricted` context, allocation, participant, source snapshot entry,
  and minimum all agree;
* the originating Candidate revision had valid manager,
  help-authorized commissioner, or
  `platform_administrator_as_commissioner` authority when accepted;
* the participant team, not the originating user, owns future bid authority.

The first active improvement is a new binding auction submission by the
team's current authorized manager. Manager, commissioner, and administrator
changes append their actual authority to auction events without rewriting the
Candidate minimum evidence.

---

## Auction Read Contract Changes

Auction list items and auction detail use one exact safe `auction` DTO:

```text
auctionId
leagueId
seasonId
version
player
status
openedAtMs
resolvesAtMs
resolvedAtMs                     nullable only while active
updatedAtMs
bidCount
participatingTeamCount
sourceKind
fadOrigin                        nullable
fadId
fadRolloverId
targetRolloverAtMs
creationCutoffAtMs
eligibleTeams[]
minimumContract                   nullable
drawCommitment
viewerTeams[]
administrativeBids[]
result
capabilities
```

`player` uses the shared safe player projection. Its position comes from the
current league correction when one exists; otherwise the read selects
deterministic source evidence valid when the auction opened, then a current
source row, then a historical fallback, with stable provider and identity
ordering inside each tier. Active and terminal direct links therefore retain a
safe position after later provider conflicts or source replacement. Public
`status` is exactly `active`, `resolved`, `no_winner`, `cancelled`, or
`correction_required`; the repository maps physical `open`, `resolving`, and
`failed` states without exposing an undocumented status.

`sourceKind` is exactly `ordinary_weekly`, `fad_open_rapid`, or
`fad_restricted`. `fadId`, `targetRolloverAtMs`, and `creationCutoffAtMs` are
null for ordinary auctions and non-null for both FAD contexts.
`creationCutoffAtMs` is exactly `targetRolloverAtMs - 3,600,000`.
`fadOrigin` is null for ordinary auctions and otherwise exactly
`manager_nomination`, `queued_nomination`, `candidate_tie_restricted`, or
`restricted_no_improvement_fallback`, consistent with the source-kind matrix.
`fadRolloverId` is non-null for every FAD auction and null for an ordinary
auction. `eligibleTeams[]` contains exact safe team projections for the
immutable original Candidate-tie allowlist of a restricted auction after
Candidate publication and is empty otherwise. An identity remains in that
public allowlist if the commissioner later removes its participation; current
eligibility and removal state are reported only through `viewerTeams[]` and
`administrativeBids[]`.
`minimumContract` is non-null only for a restricted auction or its linked
no-improvement fallback and contains exact `totalValueCents`, `termYears`, and
`aavCents`.
`drawCommitment` is null or exactly 64 lowercase hexadecimal characters. It is
non-null for every active FAD auction or FAD auction awaiting terminal reveal
and null for ordinary auctions. `resolvedAtMs` is null exactly while
`status = active`; every terminal
state has a safe integer and that value equals `result.resolvedAtMs`.

Each `viewerTeams[]` row contains exactly:

```text
teamId
team
eligible
participantStatus               null, active, or removed
bid                             null or viewer-owned bid
join
edit
```

`join` and `edit` are action capabilities. `bid` is null when that managed team
has no bid visible to that team and otherwise contains exactly `bidId`,
`version`, `status`,
`totalValueCents`, `termYears`, `aavCents`, `editCount`, `editLimit`, and
`cooldownEndsAtMs`, plus `bindingIllegalityConfirmedAtMs` for a FAD bid.
`cooldownEndsAtMs` is always a non-null safe timestamp, including after the
cooldown has elapsed.
Bid status is exactly `active`, `won`, `lost`,
`withdrawn`, or `invalid`. A row exists even when a managed team is ineligible
or eligible without a bid, so the client never infers eligibility from
participant presence. A withdrawn or invalid historical bid does not prevent
an ordinary or open-rapid team from joining again; the new active bid becomes
the viewer's current bid while history remains visible to authorized
administration. A removed restricted participant cannot join again. Competing
current bid values remain absent.

Every `administrativeBids[]` row contains exactly:

```text
bidId
teamId
team
version
status
participantStatus               null, active, or removed
capabilities
```

`team` is the safe team projection, and `status` uses the bid-status enum
above. `participantStatus` is null for ordinary and open-rapid auctions and is
`active` or `removed` for restricted auctions. `capabilities` contains exactly
the action-capability objects `adminEditBid` and `adminRemoveBid`; capabilities
are evaluated per bid because removed and active rows can coexist.
`administrativeBids[]` is present but empty without current commissioner
authority. It never contains value, term, AAV, edit history, or minimum offer.
It supplies the stable IDs needed for `T-080` and `T-081` without creating an
administrative reveal.

`result` is null while `status = active`. Every terminal auction has exactly:

```text
outcomeCode                     resolved, no_winner, cancelled, or
                                correction_required
winningTeam                     nullable safe team
submittedTotalValueCents        nullable
submittedTermYears              nullable
submittedAavCents               nullable
finalContractValueCents         nullable
finalAavCents                   nullable
contractId                      nullable
ownershipId                     nullable
activityId                      nullable
recoveryId                      nullable
drawEvidence                    nullable
resolvedAtMs
```

The winner/contract/money fields are non-null only for `resolved`.
`recoveryId` is required for `correction_required`; it is otherwise nullable.
`drawEvidence` is null only for ordinary weekly auctions. For every semantic
terminal FAD result it contains `commitmentHex` and one `reveal` object with
`algorithmVersion`, `nonceHex`, `selectionUsed`, `orderedBidIds[]`, nullable
`counter`, nullable `digestHex`, nullable `selectedIndex`, nullable
`selectedBidId`, and nullable `selectedTeamId`. `selectionUsed = true` only
when an exact top tie required the equal-chance selection; otherwise the
ordered array is empty and every selection field is null. A physical
`correction_required` result that has not yet committed a semantic terminal
outcome exposes the commitment with `reveal = null`; the eventual retry or
correction reveals that same nonce exactly once.
This terminal safe detail remains addressable to league members after the
auction leaves the default Active list, so a result notification never deep
links to a resource the API can no longer read. This is a stable terminal
summary for a direct notification, League Activity, or commissioner-recovery
link. It does not create a browsable resolved-auction history in the normal
Auction interface. League Activity remains the historical discovery surface
and the only surface that shows every submitted bid and edit version.

Auction-level `capabilities` contains action-capability objects named
`view`, `adminCancel`, and `adminResolve`. Bid-specific edit and removal
capabilities live on each `administrativeBids[]` row.
Starting an auction is collection-level: the auction-list envelope adds
`startTeams[]`, one row per currently managed team, containing `teamId`, `team`,
`sourceKind`, nullable `fadId`, nullable `fadRolloverId`, nullable
`targetRolloverAtMs`, nullable `creationCutoffAtMs`, and `startAuction` action
capability.

Every manager FAD auction start, join, or permitted edit request includes the
required literal:

```json
{
  "bindingIllegalityConfirmed": true
}
```

This field is additive to the ordinary player/contract/team command body and
is rejected when absent or false. It confirms that the bid is binding without
reserving cap, roster space, position space, player ownership, or any other
active bid. Each otherwise valid auction win resolves independently even when
the same team wins every concurrent auction and the aggregate result is
illegal. The scheduled resolver records the resulting general illegality
warning and never asks for a second confirmation. Managers have no withdrawal
command in any FAD auction.

The auction-start command returns a discriminated result:

```text
kind                            auction_opened | nomination_queued
auction                         non-null only for auction_opened
queuedNomination                non-null only for nomination_queued
```

`queuedNomination` contains only its ID, FAD, player, nominating team, binding
own bid, accepted timestamp, opening rollover, resolution rollover, status,
and version. It is readable only by that team's current manager and protected
recovery authority. Another league member cannot infer that the player was
queued before the auction opens.

The collection response is exactly `data[]` of auction DTOs,
`actions.startTeams[]`, `page.nextCursor`, `page.hasMore`, and
`meta.requestId`. Detail is exactly one auction DTO under `data` plus
`meta.requestId`.

The collection accepts only `sourceKind`, `fadId`, repeatable `status`, `q`,
`cursor`, and `limit`. `sourceKind` uses its exact enum above. Each `status`
occurrence contains exactly one public status value; comma-separated values,
empty values, and unknown values are `400`. Omission means exactly
`status=active`. The server deduplicates repeated values and canonical-sorts
the set in this order: `active`, `resolved`, `no_winner`, `cancelled`,
`correction_required`. `fadId` is permitted only with omitted source kind or an
FAD source kind. `q` is bounded normalized player text. Default limit is 50 and
maximum is 100.

The exact active-only set orders by `resolvesAtMs` ascending then auction ID.
Any set containing only terminal values orders by `resolvedAtMs` descending
then auction ID. A set containing `active` and at least one terminal value
orders by `updatedAtMs` descending then auction ID. The opaque cursor is bound
to the complete normalized filter and order. The normal manager Auction
interface requests only the omitted/default active set; terminal reads are
used only by direct result, activity, or recovery links.

Frontend auction query keys include normalized `sourceKind`, `fadId`,
`statuses[]`, `q`, and limit; cursor remains the infinite-query page parameter.

---

# Part 8 - Durable Jobs, Recovery, and Completion

## Scheduler Order

The target scheduler runs FAD work in this order:

1. run due scheduled Entry Draft-start occurrences whose single outer
   transaction performs rollover, opens trading, moves the draft to `Live`,
   and starts the first pick clock;
2. run due FAD automatic-readiness occurrences;
3. revalidate due FAD Candidate eligibility changes;
4. send due FAD deadline reminders;
5. lock due FAD deadlines;
6. coordinate each published allocation lifecycle from `deadline_locked` to
   `allocating`, or directly to `rapid` when no allocation exists;
7. allocate pending FAD players independently;
8. coordinate every allocation lifecycle again, moving `allocating` to
   `rapid` only after no allocation remains pending and creating aggregate
   automatic-result notifications;
9. resolve due auctions through the context-aware auction resolver, including
   mandatory restricted no-improvement fallback creation;
10. activate restricted auctions scheduled for this boundary;
11. open valid private queued nominations and their binding starter bids;
12. ensure any required next contiguous extension rollover;
13. finalize due FAD rollovers;
14. complete eligible FADs, including atomic Week 1 recovery when required;
15. publish outbox events.

The FAD-10 target runtime executes steps 6 through 8 in the same scheduler wake
cycle as coordinator -> per-player allocation -> coordinator. This lets an
empty FAD reach `rapid` without fabricating player work and lets a fully
processed FAD publish its aggregate team results before ordinary auction
resolution. Exact Candidate ties remain scheduled or quarantined; their
restricted-auction activation and privacy gate belongs to the later slices.

FAD-11 adds the locally verified transaction-owned restricted no-improvement
fallback primitive and the FAD-linked administration/recovery contracts. It
does not insert that primitive into the scheduled resolver or compose future
restricted/fallback activation; that was the explicit FAD-11-to-FAD-12 seam.

FAD-12 composes a separate FAD-only resolution writer, application service, and
durable runner while leaving the ordinary resolver repository and policy
unchanged. The target scheduler awaits
`free_agent_draft_auction_resolution`,
`free_agent_draft_restricted_activation`, and
`free_agent_draft_fallback_activation` in that order before ordinary
`auction_resolution`, then runs `free_agent_draft_completion`. Candidate
allocation may activate a restricted auction immediately only because this
complete administration, recovery, resolver, and activation chain is present.
Direct/queued rapid resolution and its extension/completion scheduler remain
the historical FAD-12-to-FAD-13 seam.

FAD-13 adds immediate and queued open-rapid starts, restart-safe queued
activation, direct/queued no-bid and exact-top resolution, and a rollover
finalizer that ensures missing canonical jobs before using the shared due,
claim, lease, reclaim, and recovery path. The target scheduler now awaits FAD
resolution -> restricted activation -> fallback activation -> queued
activation -> rollover finalization -> ordinary resolution -> FAD completion.
Completion and any required whole-Monday Week 1 recovery remain one atomic
transaction, and ordinary weekly auctions require both season start and FAD
completion while retaining quarantine.

The existing scheduler overlap guard is retained. Every logical operation also
uses durable `job_runs` leases, lease tokens, retry timestamps, and occurrence
uniqueness.

In-memory intervals only wake work. They do not define whether work is due or
already complete.

---

## Occurrence Keys

Required stable forms include:

```text
league:entry_draft_rollover:<leagueId>:<entryDraftId>:<rolloverOccurrenceId>:<scheduledStartsAtMs>
fad-readiness:<leagueId>:<seasonId>:<triggerResourceId>
fad:<fadId>:eligibility-revalidate:<playerId>:<sourceOperationId>
fad:<fadId>:reminder:<reminderAtMs>
fad:<fadId>:deadline:<timestamp>
fad:<fadId>:allocate:<playerId>
fad:<fadId>:restricted-activate:<allocationId>:<timestamp>
fad:<fadId>:fallback-activate:<allocationId>:<timestamp>
fad:<fadId>:nomination-open:<queueId>:<rolloverAtMs>
fad:<fadId>:rollover:<sequence>:<timestamp>
fad:<fadId>:complete
```

For `fad-readiness`, `triggerResourceId` is exactly the completed Entry Draft
ID, the target season ID for `no_draft_inaugural`, or the persisted exemption
ID for `no_draft_initial_season2`. This mapping makes every trigger path stable
and independently auditable without inventing an inaugural setup row.

The exact `job_runs.job_type` values at this boundary are:

```text
fad_readiness
fad_eligibility_revalidation
fad_deadline_reminder
fad_deadline
fad_allocation
```

FAD-08 owns `fad_readiness` execution and creates the pending reminder and
deadline occurrences in the successful opening transaction. FAD-10 owns
execution of `fad_deadline_reminder` and `fad_deadline`; creating those two
durable rows in FAD-08 does not enable their handlers early. FAD-09 owns
`fad_eligibility_revalidation` execution and the deadline reconciliation seam
that safely consumes any outstanding occurrence-bound work. FAD-10's deadline
transaction creates one `fad_allocation` occurrence for each distinct
Candidate player and the same-cycle allocation runner owns their independent
execution.

Auction resolution retains its auction-specific occurrence key and includes
the FAD context in loaded candidate data.

Candidate-eligibility revalidation occurrences use the shared lease model.
They are idempotent for the exact player, FAD, and source operation, update
every matching open card and terminalize the job in one transaction, and
succeed as skipped if the card was already locked after the deadline job
performed its own final reconciliation. The final deadline transaction uses
the separate authoritative `deadline_reconciled` skipped outcome described
above and fences any stale worker terminal write.

---

## Deadline Reminder Job

Automatic readiness persists one reminder occurrence at
`candidateDeadlineAtMs - 72 elapsed hours`. If readiness commits after that
instant, the occurrence is immediately due.

When leased, `sendFreeAgentDraftDeadlineReminders.js`:

* rechecks the authoritative FAD and deadline;
* sends nothing and records succeeded/skipped when
  `now >= candidateDeadlineAtMs`, even if deadline locking has not committed;
* resolves current active manager assignments at execution time;
* creates at most one reminder for each current manager/team pair;
* includes only that team's current completeness summary and a deep link;
* records the occurrence as succeeded with sent/skipped counts;
* records it as succeeded/skipped without notifications when cards are already
  locked or the FAD is completed.

Each notification uses this uniqueness scope:

```text
type                    = fad_deadline_approaching
deduplication_key       = fad:<fadId>:deadline-reminder:<teamId>:<userId>
unique logical recipient = userId + teamId
```

The notification rows carrying those deduplication keys and the leased job
run's succeeded result counts commit in the same transaction. There is no
separate deduplication table. A retry, expired lease, deployment overlap, or
manager replacement cannot duplicate a logical recipient's reminder. A user
managing multiple participating teams receives one team-specific reminder for
each team.

---

## Rollover Finalization

At a rollover, auction resolutions remain independent atomic operations.

The rollover finalizer:

* verifies every auction linked to that rollover is terminal or has explicit
  recovery evidence linked to its player, auction, causal job, and rollover;
* verifies every private nomination queued for that opening boundary is
  `opened` or `invalid`;
* verifies every required restricted fallback was created with its following
  rollover;
* marks the rollover `completed` when all resolved normally;
* marks it `recovery_required` when every unresolved operation has explicit
  durable recovery;
* never invents a winner or hides a failed job;
* immediately opens the next rapid creation window whenever a next persisted
  rollover exists.

A transient resolver failure leaves the auction due and blocks rollover
finalization while the durable retry policy remains active. When the operation
cannot safely continue automatically, one transaction moves the auction to its
existing terminal `failed` status and creates explicit FAD recovery evidence.
An `open` or `resolving` auction can never be treated as accounted merely
because a job attempt failed.

A failed open rapid auction remains player-quarantined. `T-082` may explicitly
cancel that failed auction as a no-winner recovery and resolve its linked
recovery atomically. Cancelling a restricted auction continues to place its
allocation in `correction_required`; that player remains quarantined until the
allocation correction resolves.

---

## Commissioner Recovery

Recovery commands call the same idempotent services used by scheduled jobs.
Allowed actions are:

```text
retry_deadline
retry_allocation
activate_restricted
activate_queued_nomination
activate_fallback
retry_auction_resolution
finalize_rollover
complete_fad
```

There is no standalone schedule-recovery action. `complete_fad` re-enters the
one completion transaction, which may move Week 1 only while committing FAD
status, both completion timestamps, regenerated schedule/jobs, and immutable
schedule-recovery evidence together.

The command identifies the affected stable resource and a bounded reason. It
does not accept:

* winner;
* contract value or term;
* participant additions;
* custom deadline;
* custom rollover;
* card unlock.

---

## Correction

An allocation correction preview is read-only. It:

* loads the locked snapshot and complete current downstream state;
* recomputes the approved deterministic decision;
* reports exact ownership, contract, roster, cap, auction, activity, and
  history changes needed;
* returns a canonical preview fingerprint;
* refuses direct repair when downstream state is no longer safely reversible.

Confirmed apply:

* requires current commissioner authority, reason, typed confirmation,
  allocation `If-Match`, idempotency key, and the current preview fingerprint;
* recomputes before writing;
* applies the complete reconciliation in one transaction;
* appends correction and allocation events;
* indexes the action in `commissioner_corrections`;
* preserves the original result.

It cannot manually choose a different valid offer. The locked snapshot and
ranking policy remain authoritative.

---

## FAD Completion Transaction

Completion becomes eligible only after the seventh initial rollover has
elapsed and every persisted extension and downstream operation is terminal. It
may execute later after restart or explicit recovery.

The transaction verifies:

* all cards are locked;
* every allocation is exactly `automatic_award`, `restricted_resolved`,
  `fallback_open_resolved`, `no_valid_offer`, or `invalid`; `pending`,
  `restricted_scheduled`, `restricted_active`,
  `restricted_fallback_open`, and `correction_required` always block
  completion;
* the seven initial rollover rows exist, every persisted sequence through the
  latest extension is contiguous, and every row is `completed`;
* every private nomination queue row is terminal and no unopened valid queue
  item remains; every `invalid` row has its safe reason/terminal timestamp and
  no auction, and every `opened` row links its exact terminal auction;
* no FAD auction is `open` or `resolving`;
* every FAD auction is in exactly one evidenced terminal alternative:
  successful resolution has its resolution row, normal no-bid closure has its
  no-winner result, or recovered cancellation has its explicit terminal
  result;
* every FAD recovery is `resolved`; no failed auction, recovery-required
  rollover, correction-required allocation, or quarantined player qualifies;
* every normal terminal allocation, auction, rollover, contract, ownership,
  result, and operational record required by its status exists and agrees.

The transaction selects one `completedAtMs`. When that instant is at or after
current competition Week 1, it first invokes the matchup schedule-recovery
service inside the same `BEGIN IMMEDIATE` transaction. That service:

* chooses the first valid league-local Monday strictly after `completedAtMs`;
* keeps the NHL regular-season end and four playoff weeks fixed;
* removes elapsed early regular-season weeks;
* fairly regenerates remaining pairings and byes;
* replaces every dependent unexecuted baseline, lock, scoring, finalization,
  and rollover job that has a regenerated occurrence, and records a safe
  cancellation for an unexecuted removed-week job with no successor;
* persists exact old/new Week 1, removed week and matchup IDs, schedule
  generations/versions, every replaced or cancelled job effect, the canonical
  evidence digest, and its recovery operation;
* updates the FAD's current competition Week 1 and schedule-recovery link
  without changing its frozen historical FAD Week 1.

It then atomically:

* changes FAD status to `completed`;
* sets `free_agent_drafts.completed_at_ms`;
* sets `seasons.free_agent_draft_completed_at_ms` to the same actual commit
  timestamp;
* records activity, notification, and outbox evidence.

The two completion timestamps must either both be absent or agree. The season
column remains the compatibility gate for ordinary weekly auctions.

Completion:

* does not require every roster to be full or legal;
* blocks matchup/baseline jobs until the completed FAD gate and matching
  current schedule version both exist;
* does not activate a planned season;
* never converts a delayed restricted path into an ordinary weekly auction.

After the recovered Week 1 begins, a team that first becomes legal uses the
ordinary immutable matchup late-lock transaction. That transaction excludes
every selected player whose NHL game was already underway at snapshot time
for that entire NHL game, including events recorded after the baseline. It
uses sufficiently fresh authoritative NHL game state and atomically persists
the durable source observation snapshot, late roster snapshot, baseline,
sealed exclusion root, and immutable
player/game/scheduled-start/snapshot/source-version exclusion children. If
that evidence is not fresh, scoring remains `awaiting_data` and no partial
observation/lock/baseline/exclusion set commits. Replay and racing
legality-restoration attempts converge on the same sealed evidence set. The
transaction does not retroactively score an earlier illegal interval.

If no valid pre-playoff Monday remains or any schedule/job rewrite fails, the
whole transaction rolls back, persists explicit correction-required recovery
outside the failed transaction, and does not publish FAD completion. In a race
with a matchup-start job, the first transaction to commit wins; the loser
revalidates the FAD gate and schedule version and leaves no partial state.

---

# Part 9 - HTTP Contract

## General Rules

All paths use `/api/v1`, stable IDs, authenticated sessions, target success and
error envelopes, CSRF on unsafe methods, exact object validation, and
`Cache-Control: private, no-store`.

All FAD GET requests and read-only preview POST requests are proven free of
domain writes, job advancement, repair, notification, activity, and outbox
effects.

---

## Endpoint Catalogue

| ID | Method and path | Authorization and purpose |
| --- | --- | --- |
| `T-126` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/navigation` | League member; safe active navigation plus optional season/team roster descriptor |
| `T-127` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/readiness?seasonId=:seasonId` | Current commissioner or inherited platform administrator with active league membership; read-only automatic readiness/blocker state |
| `T-128` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/readiness/retries` | Current commissioner or inherited platform administrator with active league membership; enqueue an idempotent blocked-readiness retry without opening parameters |
| `T-129` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId` | League member; viewer-filtered overview |
| `T-130` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/private` | Team manager or active help authority; private current card |
| `T-131` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards` | League member after publication; card summaries |
| `T-132` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/history` | League member after publication; immutable locked card plus current outcomes |
| `T-133` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/eligible-players` | Authorized private editor; slot-scoped eligible-player search |
| `T-134` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/revision-previews` | Authorized private editor; read-only proposed revision |
| `T-135` | `PUT /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/slots/:slotKey/candidate` | Authorized private editor; add candidate |
| `T-136` | `PATCH /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId` | Authorized private editor; edit candidate contract |
| `T-137` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId/move` | Authorized private editor; move candidate or compatible carryover projection |
| `T-138` | `DELETE /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId` | Authorized private editor; remove candidate |
| `T-139` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/help-requests` | Team manager in adaptive help window; grant scoped help |
| `T-140` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/results` | League member after publication; paginated allocation results |
| `T-141` | `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/recovery` | Commissioner; safe read-only operational state |
| `T-142` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/recovery/actions` | Commissioner; retry an allowlisted idempotent operation |
| `T-143` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/allocations/:allocationId/correction-previews` | Commissioner; read-only exact repair preview |
| `T-144` | `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/allocations/:allocationId/corrections` | Commissioner; confirmed atomic repair |

Literal `navigation` and `readiness` routes are registered before the
`:fadId` route.

T-126 accepts either no query fields or exactly the complete
`rosterSeasonId`/`rosterTeamId` pair. T-127 accepts exactly one `seasonId`
query field. T-129 accepts no query fields. Missing required fields, a partial
pair, malformed IDs, duplicates, or any unknown query field are `400` before
repository access. Every league-member authorization in this catalogue means
current active membership; platform role without active membership grants no
league-scoped FAD access.

T-130 and T-134 through T-139 accept no query fields. T-133 accepts only
`slotKey`, `q`, `cursor`, and `limit`. `slotKey` is required. `q` collapses
internal whitespace, is trimmed and lowercased for matching, and is bounded at
200 Unicode code points. Search ordering is normalized player name then stable
player ID. `cursor`, when present, is an opaque base64url value of at most 1024
characters whose versioned payload is bound by a filter hash to the exact card,
slot, normalized `q`, and limit. A malformed, stale-version, cross-filter, or
cross-card cursor is `400`.

T-133 applies the exact event-bound rights-release re-entry predicate from
Candidate Validation. Its measured SQLite plan must use
`ownership_events_candidate_release_by_player` for release-event filtering and
stable newest-first order,
`draft_eligible_players_rights_release_reentry` for the correlated exact-event
approval probe, and
`free_agent_draft_recoveries_league_player_status` for the correlated FAD
recovery-quarantine probe. The ordered single-player release lookup must not
create a temporary sort B-tree.

T-134 is a read-only preview. It neither requires nor consumes `If-Match` or
`Idempotency-Key`; either header is ignored if supplied. T-135 through T-138
require an exactly quoted positive integer card version in `If-Match` and an
`Idempotency-Key` whose trimmed value is 1 through 128 control-free Unicode
code points. T-139 requires the same idempotency-key form and forbids
`If-Match`. The exact Candidate operations are `candidate_card.add`,
`candidate_card.edit`, `candidate_card.move`, `candidate_card.remove`, and
`candidate_card.help`.

---

## Success Status Matrix

| Endpoints | Success |
| --- | --- |
| `T-126`, `T-127`, `T-129` through `T-134`, `T-136` through `T-138`, `T-140`, `T-141`, `T-143`, `T-144` | `200` with the authoritative response resource |
| `T-128` | `202` with the immutable accepted readiness-retry receipt; exact replay returns that same receipt |
| `T-135` | `201` with the updated Candidate Card, revision ID, and created entry ID |
| `T-139` | `201` with the created help request; `200` when returning an already-active request under a new intent key |
| `T-142` | `202` with the accepted durable operation |

An exact idempotent replay returns the original status and response. Candidate
edit, move, and delete commands return the complete updated private card so the
client never has to construct aggregate state. Read-only previews always return
`200`; they never use `202`.

Candidate commands re-establish current exact-card authority before consulting
an idempotency receipt. A former manager, a commissioner whose exact-card help
grant expired, or an administrator without current active league membership
cannot replay an earlier result. After authority succeeds, exact replay is
checked before phase, deadline, operational-freeze, aggregate-version,
resource-existence, and business-rule validation, and returns the immutable
original status and representation. A changed intent with the same key remains
`409 IDEMPOTENCY_KEY_REUSED`.

The `authorize_initial_season2_no_draft` command on target endpoint `T-037`
returns `201` with its exact resource. The scheduled Entry Draft-start path is
not an HTTP command. After a blocked attempt, T-037 accepts only
`retry_scheduled_entry_draft_rollover`, returns `202` with the durable attempt
descriptor, and never accepts a calendar, completion instant, or manual
rollover target. Exact replays return their original representation.

---

## Shared FAD Projection Types

FAD HTTP validators use these exact reusable shapes.

`team` is:

```text
teamId
name
primaryColour
secondaryColour
tertiaryColour                  nullable
patternTemplate
logoReference                  nullable
```

`player` is:

```text
playerId
fullName
positionGroup                  F or D
```

A diagnostic is exactly `code`, `message`, and nullable `resourceId`.
An action capability is exactly:

```text
allowed                         boolean
reasonCode                      nullable
```

`reasonCode` is null when allowed and otherwise one of:

```text
NOT_AUTHORIZED
HELP_NOT_GRANTED
PHASE_CLOSED
DEADLINE_PASSED
LEAGUE_FROZEN
SLOT_LOCKED
SLOT_OCCUPIED
ENTRY_NOT_EDITABLE
PLAYER_INELIGIBLE
TEAM_NOT_PARTICIPANT
COOLDOWN_ACTIVE
EDIT_LIMIT_REACHED
PLAYER_QUARANTINED
RECOVERY_NOT_AVAILABLE
PREVIEW_ONLY
```

Candidate lifecycle status is exactly `open`, `locked_complete`,
`locked_incomplete`, or `locked_conflicted`. Candidate completeness is:

```text
code                            complete, incomplete, or conflicted
filledMandatoryCount
missingMandatoryCount
filledBenchCount
emptyBenchCount
blockingValidationCount
structuralConflictCount
carriedRosterStructuralConflictCount
```

Help-request status is `not_requested`, `active`, or `expired`. Slot occupant
kind is `empty`, `carryover`, or `candidate`. Validation is:

```text
status                          valid, warning, or invalid
codes[]                         stable strings
```

Published slot outcome is null or:

```text
code                            carryover, automatic_win, automatic_loss,
                                restricted_pending, restricted_win,
                                restricted_loss, fallback_pending,
                                fallback_win, fallback_loss,
                                fallback_no_winner, invalid_offer, or no_offer
allocationId                    nullable
auctionId                       nullable
```

Result recovery status is null or `pending`, `ready`, `running`, `resolved`,
or `correction_required`. A restricted-result status is `scheduled`, `open`,
`resolving`, `fallback_open`, `resolved`, `no_winner`, `cancelled`, or
`failed`; `auctionId` is nullable only for `scheduled`.

All field names and enum values above are protocol. “Safe team” and “safe
player” below mean these exact projections, not route-specific invention.

---

## Navigation Response

The navigation read always returns `200` to an authorized league member:

```json
{
  "data": {
    "serverNowMs": 1780000000000,
    "timeZone": "America/Vancouver",
    "fadId": "opaque-uuid-or-null",
    "seasonId": "opaque-uuid-or-null",
    "phase": "cards_open",
    "showMainNavigation": true,
    "candidateDeadlineAtMs": 1780600000000,
    "nextRolloverAtMs": null,
    "frozenFadFirstMatchupStartsAtMs": 1781204800000,
    "competitionFirstMatchupStartsAtMs": 1781809600000,
    "managedCards": [
      {
        "teamId": "opaque-uuid",
        "team": {
          "teamId": "opaque-uuid",
          "name": "Snow Owls",
          "primaryColour": "#112233",
          "secondaryColour": "#ffffff",
          "tertiaryColour": null,
          "patternTemplate": "mirrored-centre-band",
          "logoReference": null
        },
        "cardId": "opaque-uuid",
        "managerAssignmentId": "opaque-uuid",
        "cardVersion": 7,
        "lifecycleStatus": "open",
        "completenessCode": "incomplete",
        "missingMandatoryCount": 2,
        "conflictCount": 0,
        "capStatus": "compliant",
        "allocationEligibility": "eligible",
        "helpRequestStatus": "not_requested",
        "urgencyCode": "CARD_INCOMPLETE"
      }
    ],
    "rosterLinks": [
      {
        "mode": "private_card",
        "seasonId": "opaque-uuid",
        "fadId": "opaque-uuid",
        "teamId": "opaque-uuid",
        "cardId": "opaque-uuid",
        "authorizationEvidence": {
          "kind": "manager_assignment",
          "id": "opaque-uuid"
        }
      }
    ],
    "urgencyCode": "CARD_INCOMPLETE"
  },
  "meta": {
    "requestId": "opaque-request-id"
  }
}
```

Before automatic opening, `fadId`, `seasonId`, and timestamps may be null and phase is
`inactive`; arrays are empty. T-126 accepts optional
`rosterSeasonId` and `rosterTeamId` only as a complete pair. Without the pair,
`rosterLinks[]` contains current-season descriptors for viewer-accessible
cards. With the pair, it contains only the matching current or historical
descriptor, or is empty when no link is authorized.

`rosterLinks[]` is therefore keyed by season and team: before publication it
contains only a manager- or help-authorized `private_card`; after publication
it may contain the requested `published_card`. Its `mode` is exactly
`private_card` or `published_card`. The backend returns IDs and mode, never
frontend URL strings; `routePaths.js` constructs the route.

Every private descriptor includes `authorizationEvidence` with the exact
manager-assignment or help-request shape defined for the private Candidate Card
response. A published descriptor has `authorizationEvidence: null`.

Each managed card has its own urgency. Top-level urgency uses the first
applicable code in this fixed priority:

```text
DEADLINE_PROCESSING
CARD_CONFLICTED
HELP_WINDOW_INCOMPLETE
CARD_INCOMPLETE
RESTRICTED_ACTION_REQUIRED
RAPID_AUCTIONS_ACTIVE
NONE
```

The response never includes another team's selected player, contract, missing
position details, or help message.

---

## Readiness State Response

`T-127` returns exactly:

```text
leagueId
seasonId
operationId                      nullable before trigger
operationVersion                 nullable before trigger
status                           not_triggered, pending, running, blocked,
                                 or succeeded
triggerKind                      nullable
entryDraftId                     nullable
exemptionId                      nullable
serverNowMs
timeZone
observedSeasonVersion
firstMatchupWeekBefore           nullable when unavailable or ambiguous
firstMatchupWeekAfter            nullable until an attempt projects it
candidateDeadlineAtMs            nullable
reminderAtMs                     nullable
helpOpensAtMs                    nullable
initialRollovers[]
priorSeasonRollover              nullable
participatingTeamCount
teamProjections[]
blockers[]
warnings[]
resultFadId                      nullable
retryReadiness
```

`priorSeasonRollover` is null on approved initial paths. Otherwise it contains
exactly `rolloverId`, `fromSeasonId`, `toSeasonId`, `completedAtMs`, and
`manifestSha256` from the immutable successful rollover. A Week 1 projection
is null when the attempt could not identify one unambiguously; otherwise
`firstMatchupWeekBefore` and `firstMatchupWeekAfter` each contain exactly
`weekId`, `sequence`, `startsAtMs`, and `version`. Their starts differ only
when the approved late-Entry-Draft whole-Monday adjustment is required.

`initialRollovers` is empty before any attempt persists a complete clock
projection. Once projected, it contains exactly seven rows, sequence `1`
through `7`, and each row contains exactly `sequence`, `opensAtMs`,
`creationCutoffAtMs`, and `rollsOverAtMs`.

Each `teamProjections[]` item contains exactly:

```text
teamId
team
managerReady                    boolean
managerAssignmentId             nullable
carryoverCount
openForwardSlots
openDefenceSlots
openBenchSlots
structuralConflictCount
```

`team` is the shared exact safe-team shape. Every count is a nonnegative safe
integer. `managerAssignmentId` is non-null exactly when `managerReady` is true.
Diagnostics use the shared safe shape.

A response with an attempt uses that latest immutable attempt's clock, team,
prior-rollover, blocker, and warning snapshot; it does not recompute those
fields from newer mutable state. `serverNowMs` and `retryReadiness` are the only
request-time projections. Before the first attempt, the projection uses null,
zero, and empty values permitted above. A GET never preflights, retries
readiness, or changes the schedule.

`retryReadiness` is allowed only when the caller has current commissioner
authority, including inherited platform-administrator authority with active
membership, the operation is `blocked`, and its exact canonical job can be
requeued. It is denied with `NOT_AUTHORIZED` when authority is absent and with
`RECOVERY_NOT_AVAILABLE` for every other failed condition.

---

## Readiness Retry Command

`T-128` requires readiness-operation `If-Match` and `Idempotency-Key`. Its
exact body is:

```json
{
  "seasonId": "opaque-uuid",
  "readinessOperationId": "opaque-uuid",
  "confirmation": "RETRY FREE AGENT DRAFT READINESS"
}
```

The command accepts no opening time, setup path, Entry Draft override, no-draft
reason, team subset, schedule value, or blocker override. Its actor-scoped
idempotency identity is exactly actor user, league, operation
`free_agent_draft.readiness.retry.v1`, and client key; a fresh request expires
after 24 elapsed hours. The version-one canonical request-hash preimage contains
exactly `domain = hundo-leago.free-agent-draft-readiness-retry-request`,
`schemaVersion = 1`, `leagueId`, `actorUserId`, `expectedVersion`, the exact
three-field body above, and `operation = free_agent_draft.readiness.retry.v1`.

The service first revalidates current authority. It then probes exact
idempotency replay before sampling a clock or identifier. On a cache miss it
revalidates the exact blocked readiness-operation version, persisted trigger
evidence, and canonical job inside the repository transaction, then requeues
that same all-or-none occurrence and returns exactly:

```text
retryReceiptId
leagueId
seasonId
readinessOperationId
acceptedFromVersion
resultingReadinessVersion
retryAttemptNumber
jobRunId
occurrenceKey
acceptedAtMs
status                         accepted
```

The receipt is persisted in the same transaction as the guarded requeue of the
same job and an exact one-version readiness advance. That accepted transition
is `blocked` to `blocked`; it does not increment the operation attempt count or
clear the latest attempt snapshot. The worker's later successful lease claim
performs the `blocked`-to-`running` transition.

An exact idempotency replay always returns the receipt's original canonical
`data` under `202`, even if readiness later blocks again or succeeds. It
performs no write and does not replace the receipt with a FAD projection. The
envelope receives the current replay request's `meta.requestId`; byte identity
applies to `data`, not the complete envelope. Current readiness and the
resulting FAD remain available through T-127 and T-129.

A missing or cross-scope readiness operation returns side-channel-safe `404`.
A valid same-league operation that is not blocked, or whose canonical job is
not available for this exact requeue, returns
`409 FAD_READINESS_NOT_READY`. A stale readiness `If-Match` returns
`412 FAD_READINESS_PRECONDITION_FAILED`.

---

## FAD Overview Response

`T-129` returns exactly:

```text
leagueId
seasonId
fadId
version
status
phase
serverNowMs
timeZone
openedAtMs
reminderAtMs
helpOpensAtMs
candidateDeadlineAtMs
deadlineLockedAtMs
allocationCompletedAtMs
nextRolloverAtMs
frozenFadFirstMatchupStartsAtMs
competitionFirstMatchupStartsAtMs
scheduleRecoveryOperationId
completedAtMs
counts
viewer
presentation
capabilities
```

`counts` contains `participatingTeams`, `cardsLocked`, `allocationsPending`,
`allocationsAutomatic`, `restrictedPending`, `restrictedFallbackPending`,
`rapidAuctionsOpen`, `rolloversPersisted`, `rolloversCompleted`, and
`recoveriesOpen`. Before publication, a caller without commissioner authority
receives the numeric `participatingTeams` count and null for every other key in
this object. At and after publication, every key is a nonnegative safe integer.

`openedAtMs`, `reminderAtMs`, `helpOpensAtMs`, `candidateDeadlineAtMs`, and
`frozenFadFirstMatchupStartsAtMs` are non-null safe integers on every created
FAD. `competitionFirstMatchupStartsAtMs` is the current schedule's Week 1 and
initially equals the frozen value. It may differ only after the server-owned
atomic FAD-overrun recovery. `scheduleRecoveryOperationId` is null unless that
completion-overrun recovery committed. It never identifies the pre-open
readiness recovery; T-127 exposes that recovery's old/new Week 1 evidence from
the immutable readiness attempt.
`deadlineLockedAtMs`, `allocationCompletedAtMs`, and `completedAtMs` are null
until their milestone commits. `nextRolloverAtMs` is null only when no
persisted incomplete initial or extension rollover remains.

`viewer.managedCards[]` contains `teamId`, safe team identity, `cardId`,
`managerAssignmentId`, `cardVersion`, `lifecycleStatus`, `completenessCode`,
`missingMandatoryCount`, `conflictCount`, `capStatus`,
`allocationEligibility`, `helpRequestStatus`, and a
`cardDescriptor` containing exactly `mode`, season/FAD/team/card IDs, and
`authorizationEvidence`. Before publication its mode is `private_card` and its
evidence is exactly `{ kind: "manager_assignment", id:
managerAssignmentId }`. After publication its mode is `published_card` and its
evidence is null. A descriptor exists for every currently managed team.
`viewer` always contains exactly `managedCards`, `commissionerCards`, and
`queuedNominations` arrays. An array remains present and empty when the caller
lacks its authority. `viewer.commissionerCards[]` is populated only for the
current commissioner or an inherited platform administrator with active league
membership and contains `teamId`, safe team identity, coarse `lifecycleStatus`,
`completenessCode`, `missingMandatoryCount`, `conflictCount`,
`capStatus`, `allocationEligibility`, `helpRequestStatus`, nullable
`helpRequestId`, nullable `helpRequestedAtMs`, and
`openPrivateCard` action capability; before publication it contains no player,
slot, contract, revision, or help message. The two help fields are non-null
only for an active or expired request.
An ordinary league member receives an empty `commissionerCards` array and has
`managedCards` populated only for currently assigned teams.

`viewer.queuedNominations[]` is private to the exact currently assigned team
manager. It contains `queueId`, `teamId`, safe player identity,
`totalValueCents`, `termYears`, `aavCents`, `submittedAtMs`,
`opensAtRolloverId`, `targetRolloverId`, `status`, and a cancel capability that
is always denied. A commissioner does not receive another team's pending queue
merely by holding commissioner authority. Before its opening transaction
commits, no league-wide count or public event may reveal the nominating team,
player, or bid.

`presentation` may remain null throughout FAD-08. It is null when the optional
provider is disabled; otherwise it
contains only `presentationId`, `status`, and `availableAtMs`; the frontend
builds any playback route from the ID. `capabilities` contains action-capability
objects named `viewPublishedCards`, `viewRecovery`, and
`completeRecoveryAction`. Team-specific rapid-auction capability belongs to the
auction collection contract, not this global overview.

`viewPublishedCards` is allowed exactly after the immutable deadline
publication commits and is otherwise denied with `PHASE_CLOSED`.
`viewRecovery` is allowed for the current commissioner or inherited platform
administrator with active membership and is otherwise denied with
`NOT_AUTHORIZED`. `completeRecoveryAction` is denied with `NOT_AUTHORIZED`
before checking recovery state; for an authorized commissioner it is allowed
only when one exact actionable recovery exists and otherwise is denied with
`RECOVERY_NOT_AVAILABLE`.

---

## Candidate Card Response

Private and historical responses share a safe structural DTO but use different
paths and cache keys:

```text
leagueId
seasonId
fadId
teamId
cardId
cardVersion
phase
visibilityMode
accessReason
authorizationEvidence
lifecycleStatus
completeness
capProjection
capStatus
allocationEligibility
allocationExclusionReason
slots[22]
conflicts[]
helpContext
commissionerInterventions[]
capabilities
```

`visibilityMode` is:

```text
private_editable
private_read_only
published_history
```

`capStatus` is `compliant` or `over_cap`.
`allocationEligibility` is `eligible`, `excluded_structural_conflict`, or
`excluded_over_cap`. `allocationExclusionReason` is null when eligible,
`candidate_card_structural_conflict` when excluded for an unresolved carried-
roster structural conflict, or `candidate_card_over_cap` when excluded only
for cap. Structural conflict takes reason precedence when both illegalities
exist, while `capStatus` independently remains `over_cap`. These fields are
authoritative after the deadline and projected as the current warning state
beforehand.

`accessReason` is:

```text
team_manager
help_grant_commissioner
help_grant_platform_administrator
published_league_history
```

`authorizationEvidence` is null for `published_league_history`. For a private
response it is exactly:

```text
kind                            manager_assignment or help_request
id                              stable assignment/help-request ID
```

Its kind must agree with `accessReason`. It lets authorization-sensitive query
cache entries prove the exact persisted assignment or grant that allowed the
response.

`showMainNavigation` is true from automatic card opening until the earlier of
FAD completion or the current competition Week 1 start. It becomes false
exactly at `competitionFirstMatchupStartsAtMs`, including when a nonterminal
FAD recovery remains. Historical Candidate Cards remain reachable from
season/team roster descriptors and the commissioner page without keeping a
seasonal main-menu item active.

`helpContext` is null unless this is an authorized private card with an active
or expired request. Otherwise it contains exactly:

```text
helpRequestId
status
message
requestedByUserId
requestedByDisplayName
requestedAtMs
expiresAtMs
```

The message is visible only through this exact-card private projection. It is
always null in published history and never appears in commissioner overview.

Each slot includes:

```text
slotKey
slotGroup
required
occupantKind
entryId
entryVersion
player
authoritativeRosterCategory
locked
totalValueCents
termYears
aavCents
remainingYears
validation
outcome
lastEditedAtMs
lastEditedBy
capabilities
```

`lastEditedBy` is null or exactly `userId`, `displayName`, and `authority`;
system edits use null user/display name and authority `system`.
`capabilities` contains action-capability objects named `addCandidate`,
`editCandidate`, `moveCandidate`, `moveCarryover`, and `removeCandidate`.

Slot discrimination is exact:

* `empty`: entry, player, authoritative roster category, money, term, years,
  outcome, and
  last-editor fields are null;
* `carryover`: entry/player, authoritative roster category, original
  total/term, AAV,
  remaining years, and locked state are non-null; identity and contract
  mutation capabilities are denied, while `moveCarryover` is allowed before
  the deadline when the destination is compatible Active or Bench space;
* `candidate`: entry/player, proposed total/term/AAV, validation, and
  last-editor fields are non-null; authoritative roster category and remaining
  years are
  null.

Authoritative roster category is null, `Active`, `Bench`, or
`Injured Reserve`.
Outcome is null on private responses and uses the shared published-outcome
shape on history.

On published history, a candidate slot keeps `outcome = null` while its linked
allocation remains `pending` or before any durable allocation event exists.
The API does not infer a provisional win, loss, rank, or tie from mutable job
progress. Once an immutable allocation event exists, the slot uses the shared
published-outcome shape derived from that evidence.

Each `conflicts[]` row contains exactly `entryId`, `entryVersion`, `player`,
`intendedSlotKey`, `conflictCode`, `validation`, and `lastEditedBy`.
Card-level `capabilities` contains action-capability objects named
`editCard`, `requestHelp`, and `viewPublishedHistory`.

Each intervention has exactly `revisionId`, nullable `entryId`, `action`,
`actorUserId`, `actorDisplayName`, `authority`, and `occurredAtMs`. It includes
every commissioner or inherited platform-administrator Candidate edit preserved
by the locked revision history. A later manager edit may change
`lastEditedBy` on a slot but never erases this attribution.
`commissionerInterventions[]` is visible before the deadline only through the
same authorized private-card response and after publication through league
history. It is otherwise never returned.

The T-130 private path remains available after the deadline while publication
is pending. In that interval it returns phase `deadline_processing`, visibility
`private_read_only`, and denies every mutation capability. T-133 through T-138
return `409 FAD_DEADLINE_PASSED` in that interval. T-139 returns
`409 FAD_HELP_WINDOW_CLOSED` whenever its adaptive help window is not open.
After Candidate publication, every private Candidate path returns
`409 FAD_PHASE_CONFLICT`. History list and detail paths return
`409 FAD_CARDS_NOT_PUBLISHED` before the deadline snapshot commits.

---

## Published Card Summary and Result Responses

Each `T-131` published card summary contains:

```text
leagueId
seasonId
fadId
teamId
team
snapshotId
lockedCardVersion
lifecycleStatus
completeness
capStatus
allocationEligibility
allocationExclusionReason
maximumPossibleCapCents
carriedCapUsageCents
counts
outcomeCounts
commissionerInterventionCount
historyDescriptor
```

`allocationExclusionReason` follows the exact Candidate Card rule above.
`counts` contains `carryovers`, `candidates`, `emptyMandatory`, `emptyBench`,
and `conflicts`. `outcomeCounts` contains `automaticWins`,
`restrictedPending`, `restrictedWins`, `fallbackPending`, `fallbackWins`,
`fallbackNoWinner`, `losses`, and `invalidOffers`. `historyDescriptor` contains
only mode `published_card` plus season/FAD/team/card IDs; the frontend creates
the URL.

`T-131` accepts only `cursor` and `limit`; default limit is 50 and maximum is
100. It returns the shared collection envelope with the rows above under
`data[]`, plus exactly `page.nextCursor`, `page.hasMore`, and
`meta.requestId`. Ordering is deterministic team name then team ID.

Each `T-140` allocation result contains:

```text
allocationId
allocationVersion
player
status
decisionCode
rankedOffers[]
winner
restricted
fallback
draws[]
recoveryStatus
resolvedAtMs
```

Each ranked offer contains `snapshotEntryId`, `teamId`, `team`,
`slotKey`, `totalValueCents`, `termYears`, `aavCents`, `valid`, nullable
`validationCode`, nullable integer `rank`, and `outcomeCode`.
`outcomeCode` is exactly `pending`, `winner`, `lost_lower_total`,
`lost_lower_aav`, `restricted_tied`, or `invalid`. While an allocation remains
`pending`, every immutable snapshot offer uses `rank = null` and
`outcomeCode = pending`; `decisionCode`, `winner`, `restricted`, `fallback`,
`recoveryStatus`, and `resolvedAtMs` are null and `draws[]` is empty. The
endpoint never predicts the eventual deterministic transaction result.

`winner` is null or contains
`teamId`, nullable `snapshotEntryId`, `contractId`, `ownershipId`, `slotKey`,
`totalValueCents`, `termYears`, and `aavCents`. `restricted` is null or contains
nullable `auctionId`, shared restricted-result `status`,
`participantTeamIds[]`, `minimumTotalValueCents`, `minimumTermYears`, and
`minimumAavCents`. `fallback` is null or contains `auctionId`, status,
`minimumTotalValueCents`, nullable winning bid/contract/ownership IDs, and
nullable terminal `noWinnerReason`.

`winner.snapshotEntryId` is non-null for an automatic or restricted result
that originates from a Candidate snapshot offer. It is null only for a
league-wide fallback winner that did not originate from a Candidate snapshot.

Every `draws[]` item belongs to one terminal FAD auction and contains
`auctionId`, `auctionType`, `drawCommitment`, and nullable `drawReveal`.
`auctionType` is exactly the shared persisted context value `fad_restricted`
or `fad_open_rapid`.
`drawReveal` contains exactly `algorithmVersion`, `nonceHex`,
`selectionUsed`, `orderedBidIds[]`, `counter`, `digestHex`, `selectedIndex`,
`selectedBidId`, and `selectedTeamId`.

Every FAD auction linked to the allocation appears in `draws[]`, including a
restricted no-improvement close or fallback no-bid result. `drawReveal` is null
only while that auction is `correction_required` without a semantic terminal
outcome. Otherwise it is present and proves the original commitment.
`selectionUsed = false`, an empty ordered-bid array, and null selection fields
prove that no random winner was chosen. When `selectionUsed = true`, every
selection field is non-null and agrees with the persisted draw evidence.

While a restricted auction is active, `rankedOffers[]` shows immutable
Candidate minimums only; they are not active bids or leaders. `restricted`
omits every current active-improvement value and term. Revealed draw evidence
appears only after terminal resolution.

`T-140` accepts only `q`, `status`, `cursor`, and `limit`. `status` is one
allocation status or omitted; `q` is bounded normalized player text; default
limit is 50 and maximum is 100. It returns the shared collection envelope with
the result rows above under `data[]`, plus exactly `page.nextCursor`,
`page.hasMore`, and `meta.requestId`. Ordering is normalized player name then
stable player ID.

---

## Candidate Command Bodies

Add:

```json
{
  "playerId": "opaque-uuid",
  "totalValueCents": 600,
  "termYears": 2
}
```

Edit:

```json
{
  "totalValueCents": 900,
  "termYears": 3
}
```

Move:

```json
{
  "slotKey": "B02"
}
```

Delete has no request body.

Revision preview accepts exactly one of these four discriminated bodies:

```json
{
  "action": {
    "type": "add",
    "slotKey": "F04",
    "playerId": "opaque-uuid",
    "totalValueCents": 600,
    "termYears": 2
  }
}
```

```json
{
  "action": {
    "type": "edit",
    "entryId": "opaque-uuid",
    "totalValueCents": 900,
    "termYears": 3
  }
}
```

```json
{
  "action": {
    "type": "move",
    "entryId": "opaque-uuid",
    "slotKey": "B02"
  }
}
```

```json
{
  "action": {
    "type": "remove",
    "entryId": "opaque-uuid"
  }
}
```

No other action fields are accepted.

`T-134` returns exactly:

```text
baseCardVersion
action                         exact accepted discriminated object
projectedCard
projectedSlot                  nullable exact slot DTO
warnings[]
```

`projectedCard` uses the Candidate Card DTO with preview-only capabilities
disabled. It uses the hypothetical `baseCardVersion + 1`, uses
`visibilityMode = private_read_only`, and every card- and slot-level action
capability is exactly `{allowed: false, reasonCode: "PREVIEW_ONLY"}`. It does
not describe whether the corresponding command would survive a later freeze,
deadline, authority, version, or resource change.

`baseCardVersion` equals the current persisted version; the projected version
does not advance persistence. For an add, the projected candidate has
`entryVersion = 1` and the deterministic preview-only
UUID defined above. Existing entries retain their IDs; an edit or move projects
the next entry version. `projectedSlot` is null for a remove. Otherwise it is
the complete slot DTO for the action's destination: the requested slot for add
or move and the entry's current intended slot for edit. When that candidate is
unplaced because a carryover owns the intended slot, the returned slot may show
the carryover while the projected candidate remains in
`projectedCard.conflicts`.

Warnings are exact diagnostics and are sorted by ascending `code`, then
nullable `resourceId` with null first. They contain no completeness warning.
The closed preview catalogue is:

| Condition | `code` | `message` | `resourceId` |
| --- | --- | --- | --- |
| One or more carried-roster structural conflicts | `CANDIDATE_CARD_STRUCTURAL_CONFLICT` | `The projected Candidate Card has an unresolved carried-roster structural conflict.` | Card ID |
| Whole-card maximum winning outcome exceeds the salary cap | `CANDIDATE_CARD_OVER_CAP` | `The projected Candidate Card exceeds the salary cap.` | Card ID |
| A projected candidate has `eligibilityStatus = warning` | That entry's safe `validationCode` | `The projected Candidate entry requires attention.` | Projected entry ID |

Duplicate `(code, resourceId)` diagnostics collapse to one. The response is
advisory and does not supply a token that bypasses command-time revalidation.
Candidate writes remain allowed while the card is conflicted or over cap;
authoritative deadline reconciliation determines allocation eligibility.

After transport and exact-input validation, T-134 establishes current
exact-card private authority before revealing lifecycle state. An authorized
request checks published/closed phase before deadline, then entry/resource and
business validity. League freeze does not reject this read-only preview. T-134
has no `412`, `423`, or idempotency-conflict path.

`T-135` through `T-138` return exactly:

```text
card
revisionId
changedEntryId
```

`card` is the complete authoritative private Candidate Card after the command.
`changedEntryId` is null after removal. The add response's `201` reflects the
created entry; edit, move, and removal return `200`.

---

## Eligible-Player Search

Supported query parameters:

```text
slotKey
q
cursor
limit
```

`slotKey` is required. `q`, `cursor`, and `limit` are optional and use the exact
normalization and cursor rules in the endpoint catalogue. Default limit is 50
and maximum is 100.

The query returns only server-confirmed candidates for that card and slot. It:

* does not reveal whether another team nominated a player;
* excludes players already on the same card;
* carries no active competing values;
* is disabled after the deadline.

Each collection item contains exactly:

```text
player
effectivePositionGroup
activeState
benchEligible
eligibilityCode
contractLimits
```

`player` uses the exact shared FAD player shape. `effectivePositionGroup` is
`F` or `D`; `activeState` is `active`; `benchEligible` is boolean;
`eligibilityCode` is `eligible`. `contractLimits` is exactly:

```text
allowedTermsYears               [1, 2, 3]
minimumTotalValueCentsByTerm    {"1": 100, "2": 200, "3": 300}
maximumBenchAavCents            400 for B slot, otherwise null
```

An ineligible player is omitted rather than returned with a reason that could
disclose another league-scoped transaction. The endpoint returns the shared
collection envelope with these items under `data[]`, plus exactly
`page.nextCursor`, `page.hasMore`, and `meta.requestId`. The cursor is bound to
the exact card, slot, normalized `q`, and limit.

---

## Help Command Body

```json
{
  "message": "Optional private message or null"
}
```

The body may be `{}`, may contain `message: null`, or may contain one string
message. A string is trimmed, must contain no control characters, and is bounded
at 500 Unicode code points; a whitespace-only string normalizes to null. Missing
JSON, a non-object body, malformed JSON, unknown fields, or any other message
type is `400`.

The request requires `Idempotency-Key`. `If-Match` is forbidden because the
help grant does not replace card content.

`T-139` returns exactly:

```text
helpRequestId
leagueId
seasonId
fadId
cardId
teamId
status
message
requestedByUserId
requestedByDisplayName
requestedAtMs
expiresAtMs
version
```

The private message is returned only to the requesting team's current managers
and the current active help authority. Other commissioner summaries expose only
status and timestamp.

---

## Recovery Command Body

```json
{
  "action": "retry_allocation",
  "resourceId": "opaque-uuid",
  "reason": "Retry the failed automatic allocation."
}
```

`resourceId` identifies the action's allocation, nomination queue, auction, or
rollover. It is null only for
`retry_deadline` or `complete_fad` when the FAD is the complete target.

The command requires `Idempotency-Key`.

`T-141` returns exactly:

```text
fad
deadlineOperation
allocationOperations[]
rapidOperations[]
completionOperation
rollovers[]
recoveries[]
availableActions[]
```

`fad` contains exactly:

```text
leagueId
seasonId
fadId
version
status
phase
openedAtMs
reminderAtMs
helpOpensAtMs
candidateDeadlineAtMs
deadlineLockedAtMs
allocationCompletedAtMs
nextRolloverAtMs
frozenFadFirstMatchupStartsAtMs
competitionFirstMatchupStartsAtMs
scheduleRecoveryOperationId
completedAtMs
counts
```

`openedAtMs`, `reminderAtMs`, `helpOpensAtMs`, `candidateDeadlineAtMs`, and
`frozenFadFirstMatchupStartsAtMs` are non-null.
`competitionFirstMatchupStartsAtMs` is the current schedule value and may
differ only after committed server-owned recovery.
`scheduleRecoveryOperationId` is null until such a recovery commits.
`deadlineLockedAtMs`,
`allocationCompletedAtMs`, and `completedAtMs` are null until their milestone
commits. `nextRolloverAtMs` is null only when no persisted incomplete initial
or extension rollover remains.
`counts` contains the T-129 coarse-count shape plus commissioner-only
`queuedNominations`: `participatingTeams`,
`cardsLocked`, `allocationsPending`, `allocationsAutomatic`,
`restrictedPending`, `restrictedFallbackPending`, `rapidAuctionsOpen`,
`queuedNominations`, `rolloversPersisted`, `rolloversCompleted`, and
`recoveriesOpen`.

`deadlineOperation` is null only before its durable occurrence exists.
Otherwise it, every `allocationOperations[]` row, every `rapidOperations[]`
row, and the nullable `completionOperation` use this
exact operation DTO:

```text
operationId
operationKind
resourceId
occurrenceKey
status
attemptCount
scheduledForMs
nextAttemptAtMs                 nullable
leaseExpiresAtMs                nullable
startedAtMs                     nullable
completedAtMs                   nullable
lastErrorCode                   nullable
recoveryId                      nullable
blocksCompletion                boolean
version
```

`operationKind` is exactly `deadline`, `allocation`,
`restricted_activation`, `queued_nomination_activation`,
`fallback_activation`, `auction_resolution`, or `completion`.
`status` is exactly `pending`, `leased`, `running`, `succeeded`, or `failed`.
`resourceId` is the FAD ID for `deadline`, the allocation ID for `allocation`
and `restricted_activation`, the nomination queue ID for
`queued_nomination_activation`, the allocation ID for `fallback_activation`,
the auction ID for `auction_resolution`, and the FAD ID for `completion`.
`deadlineOperation` can contain only `deadline`; `allocationOperations[]` can
contain only `allocation` or `restricted_activation`; `rapidOperations[]` can
contain only `queued_nomination_activation`, `fallback_activation`, or
`auction_resolution`; and the nullable completion singleton matches its name.
Rollover job state is represented by the exact `rollovers[]` DTO.
`scheduledForMs` is always present.
Lease time is non-null only while leased/running. Completion time is non-null
only for succeeded/failed. `lastErrorCode` and `recoveryId` are non-null only
when such evidence exists.

Every `rollovers[]` row contains exactly:

```text
rolloverId
sequence
opensAtMs
creationCutoffAtMs
rollsOverAtMs
status
processingStartedAtMs           nullable
completedAtMs                   nullable
lastErrorCode                   nullable
recoveryIds[]
blocksCompletion                boolean
version
```

`sequence` is any integer greater than or equal to 1. Sequences 1 through 7
are mandatory initial rows; higher contiguous values are extension rows.
Status is exactly `scheduled`,
`processing`, `completed`, or `recovery_required`. Processing time is non-null
after processing starts; completion time is non-null only for `completed` or
`recovery_required`. Every recovery ID is a same-FAD row causally linked to the
rollover.

Every `recoveries[]` row contains exactly:

```text
recoveryId
kind
status
playerId                        nullable
allocationId                    nullable
rolloverId                      nullable
auctionId                       nullable
jobRunId                        nullable
nominationQueueId               nullable
earliestActivationAtMs          nullable
targetResolutionAtMs            nullable
lastErrorCode                   nullable
commissionerReason              nullable
createdByOperationId            nullable
resolvedByUserId                nullable
resolvedByMembershipId          nullable
resolvedAuthority               nullable
createdAtMs
updatedAtMs
resolvedAtMs                    nullable
version
```

`kind` uses the persisted recovery enum exactly: `deadline_retry`,
`allocation_retry`, `restricted_activation`, `queued_nomination_activation`,
`fallback_activation`, `auction_resolution`, `rollover_finalize`,
or `completion`. `status` is
exactly `pending`, `ready`, `running`, `resolved`, or
`correction_required`. `resolvedAuthority` is null, `system`, `commissioner`,
or `platform_administrator_as_commissioner`; user and membership IDs are both
null for system resolution and both non-null for either user authority.
Player-specific recoveries include `playerId`; each other linked ID is non-null
only when that domain resource is causal. `resolvedAtMs` and resolving-actor
fields are null until resolved. Commissioner reason is a bounded safe string
or null.

Each `availableActions[]` row contains exactly:

```text
action
resourceId                      nullable
enabled                         boolean
reasonCode                      nullable
```

`action` uses exactly `retry_deadline`, `retry_allocation`,
`activate_restricted`, `activate_queued_nomination`, `activate_fallback`,
`retry_auction_resolution`, `finalize_rollover`, or
`complete_fad`. `resourceId` is null only for `retry_deadline` and
`complete_fad`; it is the exact allocation, queue, auction, rollover, or job
resource ID otherwise.
`reasonCode` is null when enabled and otherwise uses the closed shared
action-capability reason-code enum. Capabilities are derived from current state
and do not let the client construct a different operation.

When a schedule recovery exists, `T-141` also returns
`scheduleRecoveryEvidence` with exactly `operationId`, `status = succeeded`,
`oldWeek1StartsAtMs`, `newWeek1StartsAtMs`, `oldScheduleVersion`,
`newScheduleVersion`, `removedWeekIds[]`, `removedMatchupIds[]`,
`replacedJobs[]`, `completedAtMs`, and `version`. Each `replacedJobs[]` row
contains the old job ID/occurrence key and its new job ID/occurrence key. This
evidence can be inserted only inside the FAD completion transaction and is
immutable after success. It cannot exist unless FAD status, both FAD/season
completion timestamps, current Week 1, schedule version, and every replacement
job committed in that same transaction. A failed completion attempt creates
only a `completion` recovery outside the rolled-back transaction and never a
partially successful schedule operation.

This public DTO is closed and unchanged by internal cancellation evidence:
`replacedJobs[]` contains only actual old/new pairs. Jobs belonging solely to
removed weeks remain durable in internal recovery evidence with disposition
`cancelled`; `T-141` adds no `cancelledJobs` field and never manufactures a
replacement pair for them.

No recovery projection includes Candidate entries, help messages, a draw
nonce, active blind bid values, or the player/bid content of a still-private
nomination queue.

`T-142` returns:

```text
operationId
occurrenceKey
action
resourceId
status
acceptedAtMs
pollDescriptor
```

`pollDescriptor` is exactly kind `fad_recovery` plus league and FAD IDs.
`status` is `pending` or `already_succeeded`. The accepted command never claims
that downstream state changed before the durable operation commits.

---

## Correction Bodies

Preview:

```json
{
  "mode": "recompute_locked_snapshot"
}
```

Apply:

```json
{
  "mode": "recompute_locked_snapshot",
  "previewFingerprint": "sha256-hex",
  "reason": "Reconcile the result to the locked Candidate Card snapshot.",
  "confirmation": "APPLY FAD CORRECTION"
}
```

Apply requires allocation-version `If-Match` and `Idempotency-Key`.

`T-143` returns exactly:

```text
allocationId
allocationVersion
previewFingerprint
reversible
currentDecision
recomputedDecision
deltas[]
warnings[]
blockers[]
confirmationText
```

`currentDecision` and `recomputedDecision` each use exactly:

```text
status
decisionCode
rankedOffers[]
winner                          nullable
restricted                      nullable
recoveryStatus                  nullable
```

`status` and `decisionCode` use the allocation enums in Part 5.
`rankedOffers[]`, `winner`, `restricted`, and `recoveryStatus` reuse the exact
T-140 nested shapes and nullability. A preview therefore cannot silently use a
different ranking or restricted-auction representation from the published
result endpoint.

Every `deltas[]` row contains exactly:

```text
resourceType
resourceId                      nullable
action
beforeVersion                   nullable
afterSummary
```

`resourceType` is exactly `allocation`, `auction`, `contract`, `ownership`,
`roster_entry`, `activity`, or `recovery`. `action` is exactly `create`,
`update`, `cancel`, `remove`, `assign`, `release`, `append`, or `resolve`.
`resourceId` is null only when the preview would create or append a resource
that does not exist yet; it is non-null for every existing resource.
`beforeVersion` is null only for `create` and `append`.

`afterSummary` is always present and contains exactly these nullable fields:

```text
status
team
player
contractId
ownershipId
auctionId
totalValueCents
termYears
aavCents
rosterCategory
```

`team` and `player` are null or the exact safe shared projections.
`rosterCategory` is null, `Active`, `Bench`, or `Injured Reserve`. A non-null
`status` uses the exact public enum for its `resourceType`: allocation status,
auction public status, contract `Active`/`Expired`/`Bought Out`, ownership
`rostered`/`released`, roster entry `assigned`/`removed`, activity `appended`,
or recovery status. Money and term are non-null only for a contract-bearing
effect. IDs are non-null only when the summarized effect links those resources.

Every warning or blocker uses the shared diagnostic shape exactly: `code`,
`message`, and nullable `resourceId`. No decision, delta, or diagnostic exposes
arbitrary SQL or editable persistence fields.

`T-144` returns exactly:

```text
correctionId
allocation
appliedDeltas[]
activityId
completedAtMs
```

`allocation` is the exact new authoritative T-140 allocation result projection.
Every `appliedDeltas[]` row uses the exact preview-delta shape, but
`resourceId` is non-null for every committed resource and `beforeVersion` keeps
the preview value. The response identifies the same bounded effects as the
accepted preview, retains links to original and correction events, and never
replaces original history.

---

## Stable FAD Errors

Required public codes include:

```text
FREE_AGENT_DRAFT_NOT_FOUND
FAD_READINESS_NOT_READY
FAD_READINESS_PRECONDITION_FAILED
FREE_AGENT_DRAFT_REQUEST_TOO_LARGE
FAD_ALREADY_EXISTS
FAD_PHASE_CONFLICT
FAD_DEADLINE_PASSED
FAD_CARDS_NOT_PUBLISHED
CANDIDATE_CARD_NOT_FOUND
CANDIDATE_CARD_ENTRY_NOT_FOUND
CANDIDATE_CARD_PRECONDITION_FAILED
CANDIDATE_SLOT_INVALID
CANDIDATE_SLOT_OCCUPIED
CANDIDATE_CARRYOVER_LOCKED
CANDIDATE_PLAYER_INELIGIBLE
CANDIDATE_PLAYER_DUPLICATE
CANDIDATE_CONTRACT_INVALID
CANDIDATE_BENCH_AAV_EXCEEDED
FAD_HELP_WINDOW_CLOSED
FAD_BINDING_ILLEGALITY_CONFIRMATION_REQUIRED
FAD_ALLOCATION_QUARANTINED
FAD_RESTRICTED_TEAM_INELIGIBLE
FAD_RECOVERY_ACTION_INVALID
FAD_CORRECTION_NOT_APPLICABLE
```

Authorization failures follow the shared `401`, `403`, and side-channel-safe
`404` rules. A private card outside the caller's authorized scope returns
`404`; it never returns a redacted competitor card.

Exact FAD status mapping is:

| HTTP status | Codes or condition |
| --- | --- |
| `400` | Malformed JSON, unknown fields, invalid ID/header syntax, unsupported query combination, or missing required `If-Match`/idempotency header |
| `401` | Shared unauthenticated-session code |
| `403` | Authenticated role/team denial when existence is safe to reveal; `FAD_RESTRICTED_TEAM_INELIGIBLE` after Candidate publication |
| `404` | `FREE_AGENT_DRAFT_NOT_FOUND`, `CANDIDATE_CARD_NOT_FOUND`, `CANDIDATE_CARD_ENTRY_NOT_FOUND`, cross-league resource, or private out-of-scope card |
| `409` | `FAD_READINESS_NOT_READY`, `FAD_ALREADY_EXISTS`, `FAD_PHASE_CONFLICT`, `FAD_DEADLINE_PASSED`, `FAD_CARDS_NOT_PUBLISHED`, `CANDIDATE_SLOT_OCCUPIED`, `CANDIDATE_CARRYOVER_LOCKED`, `CANDIDATE_PLAYER_DUPLICATE`, `FAD_HELP_WINDOW_CLOSED`, `FAD_ALLOCATION_QUARANTINED`, `FAD_CORRECTION_NOT_APPLICABLE`, or shared idempotency conflict |
| `412` | `FAD_READINESS_PRECONDITION_FAILED`, `CANDIDATE_CARD_PRECONDITION_FAILED`, or stale allocation/season `If-Match` using the shared precondition code |
| `413` | `FREE_AGENT_DRAFT_REQUEST_TOO_LARGE` when a FAD JSON body exceeds the canonical `16 KiB` limit |
| `422` | `CANDIDATE_SLOT_INVALID`, `CANDIDATE_PLAYER_INELIGIBLE`, `CANDIDATE_CONTRACT_INVALID`, `CANDIDATE_BENCH_AAV_EXCEEDED`, `FAD_BINDING_ILLEGALITY_CONFIRMATION_REQUIRED`, `FAD_RECOVERY_ACTION_INVALID`, or another well-formed exact feature validation error |
| `423` | Shared league operational freeze code for blocked manager writes |
| `429` | Shared authenticated rate-limit code |
| `500` | Unexpected internal failure after rollback |
| `503` | Required database/job dependency temporarily unavailable |

`CANDIDATE_CARD_PRECONDITION_FAILED` exposes only safe details
`{currentVersion, refetch: true}`. Candidate entry absence and every
cross-card, cross-team, or cross-league entry reference use the same
side-channel-safe `404 CANDIDATE_CARD_ENTRY_NOT_FOUND` result.

The response always uses the shared error envelope. A T-128 stale-version
response includes exactly `details.currentVersion` as a positive safe integer
and `details.refetch = true`; no other repository detail is projected. Other
safe `details` may identify
the current card/allocation version, current phase, authoritative deadline, or
validation codes; it never contains another team's private offer or an active
blind bid.

---

# Part 10 - Activity, Notifications, and Realtime

## League Activity

Approved FAD event types include:

```text
free_agent_draft_started
free_agent_draft_cards_published
free_agent_draft_player_awarded
free_agent_draft_restricted_created
free_agent_draft_restricted_fallback_opened
free_agent_draft_auction_no_winner
free_agent_draft_player_invalid
free_agent_draft_corrected
free_agent_draft_week1_recovered
free_agent_draft_completed
fad_setup_exemption_authorized
```

Pre-deadline manager edits and help messages do not enter League Activity.
Neither does a still-private final-hour nomination queue. Its auction becomes
ordinary published FAD activity only when the rollover opening transaction
commits.

`fad_setup_exemption_authorized` is the explicit eleventh type. It uses summary
`Initial Season 2 Free Agent Draft exemption authorized.`, relates to the target
season, and its metadata contains exactly `exemptionId`, `seasonId`, and
`migrationReportId`. The private exemption reason is excluded.

Post-deadline result activity includes enough safe metadata to explain total
ranking, AAV ranking, exact tie, winning contract, ownership, and general
illegality without embedding internal revisions or current blind bids.

---

## Notifications

Required deduplicated notification types are:

```text
fad_cards_opened
fad_readiness_blocked
fad_deadline_approaching
fad_help_requested
fad_cards_locked
fad_automatic_result
fad_restricted_eligible
fad_restricted_fallback_opened
fad_rapid_auction_result
fad_correction_required
fad_week1_recovered
fad_completed
fad_setup_exemption_authorized
```

The one approaching-deadline notification is scheduled 72 elapsed hours before
the deadline and contains only that manager's team completeness and a deep
link. The help capability appears separately at the 48-hour boundary.

Recipients are resolved from active memberships and assignments in the
triggering transaction. A later assignment change does not transfer an old
user notification, but the new manager sees authoritative current state.

Recipient resolution is exact:

| Type | Recipients |
| --- | --- |
| `fad_cards_opened` | The current accepted manager of each participating team, once per manager/team pair |
| `fad_readiness_blocked` | The league's current commissioner user for the blocked readiness operation |
| `fad_deadline_approaching` | The current accepted manager of each participating team at reminder execution, once per manager/team pair |
| `fad_help_requested` | The league's current commissioner user and every current platform administrator with active league membership, once per authorized user for that exact help request |
| `fad_cards_locked` | Every user with one active league membership at publication, once per user |
| `fad_automatic_result` | The current accepted manager of the subject team, once for that manager/team aggregate |
| `fad_restricted_eligible` | The current accepted manager of each allowlisted team, once per manager/team/allocation |
| `fad_restricted_fallback_opened` | The current accepted manager of each participating team, once per manager/team/fallback auction |
| `fad_rapid_auction_result` | The current accepted manager of every team with a bid participating in the terminal auction, once per manager/team/auction |
| `fad_correction_required` | The league's current commissioner user for the recovery |
| `fad_week1_recovered` | Every user with one active league membership, once per user/recovery operation |
| `fad_completed` | Every user with one active league membership at completion, once per user |
| `fad_setup_exemption_authorized` | Exactly the current active commissioner user selected by `leagues.commissioner_membership_id`, with current commissioner permission category and an active user, once for the exemption |

A user managing multiple teams receives the team-scoped notification for each
team. A user with more than one qualifying authority receives only one
league-wide notification. Inactive memberships, ended assignments, former
commissioners, nonparticipating teams, and league members who never
participated in a rapid auction do not receive the corresponding scoped
notification. A rapid auction with no participating bid creates no
`fad_rapid_auction_result` notification.

For `fad_setup_exemption_authorized`, current means the same-league membership
has `status = active`, `permission_category = commissioner`,
`joined_at_ms <= authorizedAtMs`, and `ended_at_ms IS NULL`, and its user has
`status = active`. The authorizing platform administrator receives no separate
copy unless they are also that exact current commissioner user.

Only the current accepted manager of the corresponding participating team may
receive `fad_cards_opened`. Non-managers receive no Candidate Card notification;
they retain only the normal authorized League Activity view of
`free_agent_draft_started`. A notification never grants card access, and its
destination reauthorizes current team/card scope when followed.

For `fad_help_requested`, the recipient snapshot includes every user who can
actually exercise the exact-card help grant at creation: the current
commissioner and every platform administrator whose active league membership
inherits commissioner authority. The deduplication key permits one copy per
authorized user. Later loss of authority does not expose the card when the
destination is followed because the read reauthorizes current scope.

No pre-deadline notification reveals a player, total, term, slot, or help
message outside the authorized team/help audience.

Every FAD notification `messageData` contains one exact destination descriptor,
never a frontend URL:

| Type | Exact additional `messageData` fields | `destination.kind` and IDs |
| --- | --- | --- |
| `fad_cards_opened` | `leagueId`, `seasonId`, `fadId`, `teamId`, `cardId`, `candidateDeadlineAtMs` | `private_card`; league/FAD/team/card |
| `fad_readiness_blocked` | `leagueId`, `seasonId`, `readinessOperationId`, `errorCodes[]` | `commissioner_fad`; league/season |
| `fad_deadline_approaching` | fields above plus `completenessCode`, `missingMandatoryCount` | `private_card`; league/FAD/team/card |
| `fad_help_requested` | `leagueId`, `seasonId`, `fadId`, `teamId`, `cardId`, `helpRequestId`, `requestingUserId`, `requestingDisplayName` | `private_card`; league/FAD/team/card |
| `fad_cards_locked` | `leagueId`, `seasonId`, `fadId` | `fad_results`; league/FAD |
| `fad_automatic_result` | `leagueId`, `seasonId`, `fadId`, `teamId`, `automaticWins`, `losses`, `restrictedPending`, `invalidOffers` | `fad_results`; league/FAD |
| `fad_restricted_eligible` | `leagueId`, `seasonId`, `fadId`, `teamId`, `allocationId`, `auctionId`, `playerId` | `auction`; league/auction |
| `fad_restricted_fallback_opened` | `leagueId`, `seasonId`, `fadId`, `teamId`, `allocationId`, `auctionId`, `playerId`, `resolvesAtMs` | `auction`; league/auction |
| `fad_rapid_auction_result` | `leagueId`, `seasonId`, `fadId`, `teamId`, nullable `allocationId`, `auctionId`, `playerId`, `outcomeCode` | `auction`; league/auction |
| `fad_correction_required` | `leagueId`, `seasonId`, `fadId`, nullable `allocationId`, nullable `auctionId`, `recoveryId`, `playerId`, `errorCode` | `fad_recovery`; league/FAD/recovery |
| `fad_week1_recovered` | `leagueId`, `seasonId`, `fadId`, `scheduleRecoveryOperationId`, `competitionFirstMatchupStartsAtMs` | `fad_overview`; league/FAD |
| `fad_completed` | `leagueId`, `seasonId`, `fadId`, `completedAtMs` | `fad_overview`; league/FAD |
| `fad_setup_exemption_authorized` | `leagueId`, `seasonId`, `exemptionId` | `commissioner_fad`; league/season |

The destination object contains only `kind` and the IDs listed in its table
row. `routePaths.js` converts it to a route after rechecking current access.
The help destination carries no help message. Restricted player identity is
sent only after Candidate publication. `fad_correction_required` is
commissioner-only. Its `allocationId` and `auctionId` cannot both be null; each
non-null ID must be linked to the named player and recovery in the same FAD.

`fad_rapid_auction_result.outcomeCode` is exactly `won`, `lost`, `invalid`,
`removed`, `no_winner`, `cancelled`, or `correction_required`, evaluated for
the notification's `teamId`.

`fad_correction_required.errorCode` is a safe stable machine code matching
`^[A-Z][A-Z0-9_]{0,63}$`. It is never an exception message, provider response,
SQL detail, path, or active-bid value. The notification list validates the
code but does not turn it into user-facing prose.

`notificationContracts.js` validates every FAD type exhaustively, and the
notification UI uses this exact copy table rather than falling back to
humanizing the type string:

| Type | User-facing list copy |
| --- | --- |
| `fad_cards_opened` | `Your Candidate Card is ready.` |
| `fad_readiness_blocked` | `Free Agent Draft readiness requires commissioner attention.` |
| `fad_deadline_approaching` | `Your Candidate Card deadline is approaching.` |
| `fad_help_requested` | `A manager has requested Candidate Card help.` |
| `fad_cards_locked` | `Candidate Cards are locked and results are available.` |
| `fad_automatic_result` | `Your Candidate Card results are available.` |
| `fad_restricted_eligible` | `You are eligible to bid in a restricted FAD auction.` |
| `fad_restricted_fallback_opened` | `A league-wide Free Agent Draft fallback auction is open.` |
| `fad_rapid_auction_result` | `A Free Agent Draft auction has finished.` |
| `fad_correction_required` | `Free Agent Draft recovery requires commissioner attention.` |
| `fad_week1_recovered` | `Week 1 moved to complete the Free Agent Draft fairly.` |
| `fad_completed` | `The Free Agent Draft is complete.` |
| `fad_setup_exemption_authorized` | `Initial Season 2 Free Agent Draft exemption authorized.` |

Counts and outcome details may be rendered from the validated fields beside
this copy, but the `errorCode` is diagnostic metadata and is shown only in the
authorized commissioner recovery panel.

Destination-to-route mapping is exact:

| `destination.kind` | Frontend route helper |
| --- | --- |
| `private_card` | `routePaths.freeAgentDraftCard(leagueId, fadId, teamId)` |
| `commissioner_fad` | `routePaths.leagueCommissioner(leagueId)` |
| `fad_results` | `routePaths.freeAgentDraftResults(leagueId, fadId)` |
| `auction` | `routePaths.auctionDetail(leagueId, auctionId)`; active and terminal detail are both readable |
| `fad_recovery` | `routePaths.commissionerFadRecovery(leagueId, fadId, recoveryId)` on the always-discoverable commissioner page |
| `fad_overview` | `routePaths.freeAgentDraft(leagueId, fadId)` |

The destination contract validator rejects missing, extra, or cross-kind IDs.
Following a destination always rechecks current membership and scoped
authority; a notification never grants access by itself.

Deduplication keys use:

```text
fad:<fadId>:cards-opened:<teamId>:<userId>
fad-readiness:<seasonId>:blocked:<operationId>:<userId>
fad:<fadId>:deadline-reminder:<teamId>:<userId>
fad:<fadId>:help-requested:<helpRequestId>:<userId>
fad:<fadId>:cards-locked:<userId>
fad:<fadId>:automatic-result:<teamId>:<userId>
fad:<fadId>:restricted-eligible:<allocationId>:<teamId>:<userId>
fad:<fadId>:fallback-opened:<auctionId>:<teamId>:<userId>
fad:<fadId>:rapid-result:<auctionId>:<teamId>:<userId>
fad:<fadId>:correction-required:<recoveryId>:<userId>
fad:<fadId>:week1-recovered:<scheduleRecoveryOperationId>:<userId>
fad:<fadId>:completed:<userId>
fad_setup_exemption_authorized:<leagueId>:<seasonId>:<exemptionId>:<userId>
```

---

## Socket.IO Events and Audiences

Add event families:

```text
free_agent_draft.changed
candidate_card.changed
candidate_card_help.changed
fad_nomination_queue.changed
```

Continue to use:

```text
auction.changed
roster.changed
contract.changed
league.changed
team.changed
activity.created
notification.created
```

Events contain only:

```text
eventId
type
leagueId
resourceId
version
reasonCode
occurredAt
related
```

`resourceId` identifies the authoritative resource named by the event, and
`version` is that exact resource's authoritative current version in the
committed domain transaction. It is never the mutable outbox-row version, a
delivery-attempt counter, a related child-resource version, or a guessed
fallback. A writer fails closed when it cannot prove the committed resource
version.

For `free_agent_draft.changed` allocation events, `resourceId` is the FAD ID,
`version` is the committed `free_agent_drafts.version`, and
`related.allocationId` identifies the affected allocation. The allocation
resource or version never replaces the FAD resource/version pair.

`related` always contains exactly these nullable stable IDs:

```text
fadId
teamId
cardId
allocationId
auctionId
recoveryId
nominationQueueId
scheduleRecoveryOperationId
```

FAD writers populate every applicable ID; unrelated event families leave them
null. This metadata contains no player, offer, contract value, help message, or
bid. It lets authorized clients identify the affected cache without fetching
private content.

The FAD-consumed reason codes are exactly:

```text
membership_changed
commissioner_assignment_changed
manager_assignment_changed
card_changed
help_changed
cards_opened
cards_published
allocation_changed
correction_applied
completed
nomination_queued
nomination_opened
fallback_opened
week1_recovered
auction_changed
roster_changed
contract_changed
setup_exemption_authorized
```

At opening, the successful readiness transaction publishes exactly:

* `free_agent_draft.changed/cards_opened` to the league room as a
  metadata-only FAD invalidation;
* `activity.created/cards_opened` to the league room for the existing
  `free_agent_draft_started` activity;
* one `candidate_card.changed/card_changed` event per card to that card's team
  room; and
* one `notification.created/cards_opened` event per `fad_cards_opened`
  notification to that notification's exact recipient user room.

`fad_cards_opened` remains the notification type only and is never an outbox
event type. The league-scoped FAD invalidation does not constitute a card
notification or grant card access. Non-managers receive no team/user opening
event and see only normal League Activity. No opening publication includes
card contents, players, offers, slots, contract values, help data, or bids.

Authorizing the initial-Season-2 setup exemption publishes exactly three
metadata-only events in the committing transaction: league-audience
`league.changed/league_changed`, league-audience
`activity.created/setup_exemption_authorized`, and exact-current-commissioner
user-audience `notification.created/setup_exemption_authorized`. The Activity
and notification use their persisted resource IDs and version `1`; the league
event uses the committed league resource/version. All eight `related` IDs are
null. The private exemption reason is never published.

Before the deadline:

* `candidate_card.changed` goes to the team room and, only with an active help
  grant, the current commissioner user room and every current inherited
  member-platform-administrator user room;
* `candidate_card_help.changed` goes to that team, the current commissioner
  user room, and every current inherited member-platform-administrator user
  room;
* no card change goes to the league room.

Before a queued nomination opens:

* `fad_nomination_queue.changed` goes only to the nominating team room and any
  exact current protected recovery-authority user room;
* the event identifies only the queue/FAD/team resources and carries no player
  or contract value;
* no league-room FAD or auction event is emitted until the queued nomination's
  auction actually opens; and
* when it opens, the normal authorized league-auction publication occurs while
  the private queue projection is removed.

At publication:

* `free_agent_draft.changed` with reason `cards_published` goes to the league
  room;
* clients remove private-card query caches before loading history;
* later result, fallback, opened-queue auction, no-winner, and schedule
  recovery invalidations use the league room.

No event carries card contents, offers, validation details, messages, or bids.

---

## Presentation Video Boundary

When a later approved presentation provider is enabled, allocation completion
creates a `fad.presentation.requested` outbox event.

The consumer:

* reads only authoritative published FAD result projections;
* runs asynchronously;
* records safe pending, ready, or failed presentation status;
* cannot write allocations, auctions, contracts, ownership, cards, rollovers,
  or completion;
* cannot block any FAD or matchup operation.

Season 2 may leave the provider disabled. Provider, accessibility, storage,
retention, playback, cost, and disclosure design require the separate
Season 3 presentation specification.

---

# Part 11 - Frontend Contract

## Feature Module

Create:

```text
src/features/freeAgentDraft/
  freeAgentDraftContracts.js
  freeAgentDraftQueries.js
  freeAgentDraftInvalidation.js
  FreeAgentDraftPage.jsx
  CandidateCard.jsx
  CandidateCardResults.jsx
  CommissionerFadPanel.jsx
  FreeAgentDraftPage.module.css
```

Tests live beside the feature.

The dormant legacy `src/pages/FreeAgentsPage.jsx` is not reused. It contains
client-side timing and calculations that are not authoritative.

---

## Existing Frontend Seams

Implementation connects through the current modern seams:

* `src/App.jsx` lazy-loads the FAD pages and declares the routes;
* `src/app/routePaths.js` adds encoded stable-ID FAD and auction-detail helpers;
* `src/components/TopBar.jsx` adds the conditional link, page labels, and
  prefix-aware nested-route activity;
* `src/app/AppProviders.jsx` continues to own the authenticated Query, session,
  CSRF, action-token, and realtime providers;
* `src/shared/api/httpClient.js` remains the only FAD HTTP boundary;
* `src/features/rosters/TeamRosterPage.jsx` and the league roster composition
  consume the server-authored FAD link descriptor;
* `src/features/competition/CompetitionPages.jsx` adds
  `CommissionerFadPanel` to the existing always-discoverable
  `/leagues/:leagueId/commissioner` page;
* `src/features/players/playerQueries.js` may supply shared search primitives,
  but its generic `auctionEligible` projection is not Candidate eligibility;
* `src/features/notifications/notificationContracts.js` validates FAD
  notification payloads and deep links;
* `src/shared/hundoFormat.js` gains one league-timezone formatter with an
  explicit timezone label.

The existing global `TransactionInvalidationProvider` is generalized into the
target application `RealtimeProvider`; FAD does not create another Socket.IO
client.

---

## Frontend Routes

Add:

```text
/leagues/:leagueId/free-agent-draft
/leagues/:leagueId/free-agent-draft/:fadId
/leagues/:leagueId/free-agent-draft/:fadId/results
/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId
/leagues/:leagueId/auctions/:auctionId
```

The current route uses the navigation descriptor. Stable FAD and team routes
support notification, commissioner-help, and historical roster links.

A user managing more than one team receives a team selector. The frontend does
not assume one global "my team."

The existing commissioner page remains the entry point when normal FAD
navigation is hidden. Before automatic opening it exposes the read-only
`T-127` readiness state and safe blockers. It exposes `T-128` only as an
idempotent retry when a persisted blocked operation is currently retryable;
there is no commissioner-created opening form or opening confirmation. After
FAD completion it continues to link to `T-141` recovery/history evidence.
`CommissionerFadPanel` never relies on the conditional main-menu link.

---

## Navigation

`TopBar` uses the navigation endpoint, not local deadline inference.

* Main navigation appears only when the backend returns
  `showMainNavigation = true`.
* Nested FAD routes use prefix-aware active-route matching.
* Before the current competition Week 1 start, the link remains visible while
  the FAD is nonterminal, including every extension rollover, delayed
  restricted path, fallback, queue, and recovery. It disappears at the earlier
  of FAD completion or the exact current competition Week 1 start. Recovery
  after that boundary remains reachable from roster history and commissioner
  controls, not the seasonal main menu.
* Roster pages choose the server-authored `rosterLinks[]` descriptor matching
  the viewed season and team.
* Public roster pages do not expose Candidate Cards.

---

## Query Keys

Required roots include:

```js
["league", leagueId, "free-agent-draft", "navigation",
  { rosterSeasonId, rosterTeamId }]
["league", leagueId, "free-agent-draft", "readiness", seasonId]
["league", leagueId, "free-agent-draft", fadId, "overview"]
["league", leagueId, "free-agent-draft", fadId, "private-card", teamId]
["league", leagueId, "free-agent-draft", fadId, "history-cards", { limit }]
["league", leagueId, "free-agent-draft", fadId, "history-card", teamId]
["league", leagueId, "free-agent-draft", fadId, "eligible-players", teamId, slotKey, filters]
["league", leagueId, "free-agent-draft", fadId, "results", filters]
["league", leagueId, "auctions", filters]
```

Private and historical cards never share a cache key.
Auction filters include FAD and source context so ordinary and rapid result
sets cannot collide in one cache entry.

The navigation scope object always contains both keys: both are null for the
unscoped top bar and both are stable IDs for a roster-scoped read. A scoped
roster descriptor can therefore never overwrite the unscoped navigation
response.

`history-cards` is an infinite query. Its cursor is `pageParam`, not part of
the base key, and it has no filter beyond validated limit. `results` is also an
infinite query; its base key includes normalized `q`, status, and limit while
cursor remains `pageParam`.

Every authenticated FAD query includes this exact TanStack Query metadata
base:

```js
meta: { private: true, leagueId }
```

This reuses the application-wide private-query cleanup: `private` means the
cache depends on an authenticated session, not that every such response
contains unpublished Candidate data. Private-card and eligible-player queries
add exactly these fields to that same object:

```js
meta: {
  private: true,
  leagueId,
  teamId,
  authorizationScope,
  authorizationEvidence
}
```

`authorizationScope` is exactly `team_manager`,
`help_grant_commissioner`, or
`help_grant_platform_administrator`. `authorizationEvidence` is the exact
`{ kind, id }` object returned by the private-card projection and contains the
stable team-manager assignment ID or help-request ID. Safe league-member
navigation, overview, published history, results, and auction queries retain
only the common `private: true` and `leagueId` metadata; they never carry a
help- or assignment-authorization scope.

---

## Cache Eviction

The application-level session cleanup removes every query with
`private: true` when the user signs out or the authenticated session is
replaced. Exact-card authorization cleanup removes private-card and
eligible-player queries when:

* league membership ends;
* team manager assignment ends;
* a help grant expires;
* a commissioner replacement removes the former commissioner's help-derived
  scope;
* the deadline publishes cards;
* a protected request returns `403`, side-channel-safe `404`, or
  `409 FAD_PHASE_CONFLICT`/`FAD_DEADLINE_PASSED`.

At publication, private card queries are removed, not merely invalidated.

Exact realtime cleanup triggers are:

* `league.changed/membership_changed`;
* `league.changed/commissioner_assignment_changed`;
* `team.changed/manager_assignment_changed`;
* `candidate_card_help.changed/help_changed`;
* `free_agent_draft.changed/cards_published`;
* authenticated Socket reconnect, which revalidates all retained private query
  metadata before rendering.

Every navigation or overview response also runs an authorization-sensitive
sweep: a private-card or eligible-player query whose assignment/help evidence
is absent, whose FAD phase is no longer
`cards_open`/`help_window`/`deadline_processing`, or whose deadline has passed
is removed even when a realtime event was missed. At the measured server-offset
deadline, the client immediately hides, cancels, and removes private-card
queries while it refetches authoritative phase. This is conservative cache
privacy, not local publication or deadline processing.

Candidate Cards, offers, help messages, unsaved contract intents, and private
Query Client state are never written to local or session storage.

---

## Realtime Invalidation Matrix

The locked snapshot rows never change, but published outcome projections remain
live through rapid auctions and corrections. The frontend applies:

| Event/reason | Query action |
| --- | --- |
| `candidate_card.changed/card_changed` before publication | Use `related` IDs to invalidate the authorized matching private card, its eligible-player searches, overview, and navigation |
| `candidate_card_help.changed/help_changed` | Revalidate/remove exact help-scoped private card; invalidate overview and navigation |
| `free_agent_draft.changed/cards_published` | Remove every private-card and private eligible-player query for the FAD; invalidate history-card lists/details, results, overview, and navigation |
| `free_agent_draft.changed/allocation_changed` | Invalidate history-card lists/details, results, and overview |
| `fad_nomination_queue.changed/nomination_queued` | Invalidate only the exact authorized manager's overview/navigation and private queue projection |
| `fad_nomination_queue.changed/nomination_opened` | Remove the exact private queue projection, then invalidate matching auction lists/detail, overview, and navigation |
| `free_agent_draft.changed/fallback_opened` | Invalidate results, FAD auction lists, overview, navigation, and the linked allocation history |
| `free_agent_draft.changed/week1_recovered` | Invalidate overview, navigation, recovery, competition schedule, matchup jobs, and standings schedule projections |
| `auction.changed/auction_changed` with non-null `related.fadId` | Invalidate matching auction list/detail, history-card lists/details, results, overview, and navigation |
| `free_agent_draft.changed/correction_applied` | Invalidate history-card lists/details, results, recovery, overview, activity, rosters, and contracts |
| `free_agent_draft.changed/completed` | Invalidate every FAD query, FAD auction list/detail, navigation, and relevant roster links |
| scoped `roster.changed` or `contract.changed` before deadline | Invalidate authorized affected private cards, eligible-player searches, overview, and navigation |

Reconnect invalidates every active FAD query after authorization cleanup. This
matrix prevents an immutable snapshot from being confused with its changing
allocation/auction outcome projection.

---

## HTTP and Mutations

The feature reuses the shared credentialed HTTP client for:

* CSRF;
* exact envelopes;
* abort signals;
* `If-Match`;
* idempotency keys;
* `ApiError`.

Critical writes use a shared fail-closed `crypto.randomUUID()` intent-key
helper. They never fall back to `Date.now()` or `Math.random()`.

Candidate mutations do not use optimistic cache replacement. They show pending
state, accept the authoritative result, and invalidate the narrow affected
keys.

Candidate Card UI always renders all 12 Forward, 6 Defence, and 4 neutral
Bench slots. Carryover identity and contract controls are locked, while a
compatible Active/Bench move remains available before the deadline. The cap
panel uses server-authored `capStatus`, `allocationEligibility`, and
`allocationExclusionReason`. A carried-roster-conflicted or over-cap card
remains editable and receives a prominent warning that every new Candidate
offer will be excluded if the illegality remains at locking; no acknowledgement
checkbox can override that rule. A conflict-free incomplete, cap-compliant card
explains that each individually valid filled offer will still participate. A
candidate-only conflict is shown as an individual invalid offer and never as a
whole-card structural exclusion.

On `412`, the UI:

* preserves unsaved field input where safe;
* refetches the card;
* explains the conflict;
* requires explicit review and resubmission.

---

## Clock Display

Responses provide `serverNowMs`, persisted boundaries, and league timezone.
They display both the immutable FAD-anchoring Week 1 and the current
competition Week 1 whenever schedule recovery made them differ.

The browser may tick a display countdown from a measured server offset. At a
boundary it:

* disables no authority solely from local time;
* conservatively hides/removes already-fetched private card data at the
  measured Candidate deadline;
* invalidates and refetches;
* shows `Awaiting server confirmation` until phase changes.

It never locally locks, publishes, opens, closes, assigns, or resolves.

---

## Auction UI

The existing transaction feature is extended to:

* render ordinary, open rapid, and restricted context;
* show target rollover and creation cutoff;
* display original restricted Candidate minimums and allowlisted teams without
  presenting those minimums as bids or leaders;
* keep edited competing values blind;
* render every `viewerTeams[]` row, including eligible no-bid and ineligible
  managed teams;
* use per-team join/edit and collection `startTeams[]` capabilities;
* return a private queued-nomination receipt during the final hour and keep it
  visible only to the nominating team's current manager until opening;
* show the league-wide fallback as a fresh auction with its tied-contract
  floor and no initial leader;
* require the binding-illegality confirmation on every FAD start, join, and
  edit, explain that no cap/slot/player resource is reserved, and never show a
  manager withdrawal control;
* explain that every otherwise valid concurrent win will complete
  independently and that the resolver will not ask again;
* deep-link to auction detail.

Starting-auction controls are not shown merely because a managed team exists.
That team's `startAuction` action capability is authoritative.

---

## Accessibility and Responsive Behavior

Candidate slots and auction controls require:

* semantic headings and grouped regions;
* persistent text labels;
* keyboard-operable add, edit, move, remove, help, and bid controls;
* visible focus;
* screen-reader error association;
* non-colour locked, invalid, empty, winning, losing, and tied indicators;
* usable narrow-screen ordering without horizontal action loss;
* timezone labels on deadlines and rollovers.

---

# Part 12 - Security and Privacy

## Read Projection Boundary

Repositories must select only fields authorized for the requested projection.
They must not load all private league cards into a route and filter them only
after serialization.

Pre-deadline projections are:

| Viewer | Allowed information |
| --- | --- |
| Team manager | Complete assigned-team card |
| Help-authorized commissioner/admin | Complete requesting-team card only |
| Commissioner without help | Team completion/help/health summary only |
| Other league member | FAD timing and own authorized summaries only |
| Public/anonymous | No FAD data |

Post-deadline active league members receive published history.

---

## Logging

Application and operational logs may include:

* request ID;
* league, FAD, card, allocation, auction, and job IDs;
* safe status and error code;
* timing and attempt count.

They never include a help message, active edited auction bid/value/term, draw
nonce, or private before/after revision JSON.

Before Candidate publication they also must not include:

* nominated player;
* total, term, or AAV;
* slot;

Until a private nomination queue row opens, logs for that row may contain only
its queue/FAD/job IDs, safe status/error code, timing, and attempt count. They
must not contain or correlate its player, nominating team/user, total, term,
AAV, or binding bid.

---

## Rate and Body Limits

FAD JSON routes use a `16 KiB` body limit.

Eligible-player search and the read-only Candidate revision preview follow the
shared authenticated read limits. The shared security limiter applies both the
per-session and per-league ceiling for each FAD write profile:

| Profile | Per-session ceiling | Per-league ceiling | Window |
| --- | ---: | ---: | ---: |
| `fad_candidate_write` for T-135 through T-138 | `120` | `600` | `15 elapsed minutes` |
| `fad_help_write` for T-139 | `5` | `25` | `60 elapsed minutes` |
| `fad_operational_write` for FAD operational commands | `30` | `120` | `15 elapsed minutes` |

Exceeding either applicable ceiling returns `429` without a domain write.
These limits are server authority and are not delegated to the client.

---

# Part 13 - Migration and Compatibility

## Migration Shape

Schema 22 is current at approval time. The implementation uses the next
available ordered migration after the then-current schema and may split the
target into small ordered migrations for:

1. verified season-key uniqueness, league-season rollover evidence, committed
   legacy migration-report evidence, and shared auction/outbox prerequisites;
2. core FAD and Candidate Card tables;
3. allocation, rollover, and recovery tables;
4. auction context, restricted participant, and draw tables;
5. scoped outbox audiences and notification deduplication;
6. canonical final-standings provenance; and
7. lifecycle-transition idempotency back-links, immutable source-readiness
   and response/effect manifest evidence, and exemption report/bootstrap
   evidence;
8. durable automatic-readiness operations/blockers, private nomination queue,
   participant-minimum-without-seed constraints, generalized FAD draw
   evidence, allocation-linked fallback origin, contiguous extension
   rollovers, card-wide allocation eligibility, and atomic schedule-recovery
   evidence;
9. immutable auction-administration command results for exact `T-080` through
   `T-083` replay; and
10. immutable readiness-attempt projection evidence and immutable T-128 retry
    receipts.

The work plan allocates the completed FAD foundation as `0023` through `0027`,
canonical finalization as `0028_add_final_standings_provenance.sql`, and this
T-037 hardening as `0029_add_lifecycle_transition_evidence.sql`.

The locked pre-staging decision-package migration adds
`auction_administration_command_results` as one logical table. The final exact
local migration-0030 candidate contains `124` application tables, `125` tables
including `schema_migrations`, `124` matching repository-catalog entries, `42`
post-reset require-empty tables, `82` signed-reset-policy tables, and `60`
installed `BEFORE DELETE` guards. After the pre-staging T-145 current-
generation compatibility correction, migration `0030` is `636,077` bytes
with lowercase SHA-256
`6f46b7a8c52108adfc0b51dc1eb9cdcab0ed274482ca396a31f7d45e42c07184`.
Exact Node `24.14.1` fresh `1 -> 30`, explicit `22 -> 30`, locked-amendment,
repository-catalog, signed-reset-policy, and reset-trigger tests reproduce this
inventory with `integrity_check = ok` and zero foreign-key violations. Any
migration-byte change invalidates this freeze and requires the complete package
to be rerun before shared staging.

That corrected migration-0030 file and hash are the frozen pre-staging
baseline. The FAD-08 schema boundary is an additive schema-31 migration whose
new feature objects are only
`free_agent_draft_readiness_attempts` and
`free_agent_draft_readiness_retry_receipts` plus their required indexes and
immutability/same-league guards. Of the schema-30 objects, migration 0031
replaces only `free_agent_draft_readiness_operations_forward_update`. Its
replacement retains every existing transition and additionally permits only
the receipt-backed T-128 transition that keeps status `blocked`, keeps attempt
count and blocker state unchanged, advances the readiness version exactly one,
and atomically requeues the same canonical job. The later worker claim remains
the sole `blocked`-to-`running` transition. No schema-30 table definition or
other schema-30 trigger is rewritten; only normal schema-version metadata
advances.

The finalized migration `0031` is `46,693` bytes with lowercase SHA-256
`f2c5104f2eb06e261cc902067bd4623b841f2c37a04f73d27487863077b2662a`.
Its exact local schema-31 inventory is `126` application tables, `127` tables
including `schema_migrations`, `126` repository-catalog entries, `44`
post-reset require-empty tables, `82` signed-reset-policy tables, and `62`
installed `BEFORE DELETE` guards. Fresh `1 -> 31` and exact `30 -> 31`
verification must reproduce those values while migration `0030` remains
byte-for-byte unchanged.

The finalized FAD-08 runtime impact-audit migration is additive migration
`0032`; it leaves pinned migrations `0030` and `0031` byte-for-byte unchanged
and creates no table or index. It adds only
`free_agent_draft_readiness_job_reclaim_guard` for the job-side old-state and
one-version CAS, and replaces only the existing
`free_agent_draft_readiness_operations_forward_update`. That replacement
retains every schema-31 branch and adds only the guarded
`running`-to-`running` expired-lease handoff described above, bound to the
already-reclaimed same canonical `fad_readiness` job and its fresh bounded
lease.
Migration `0032` is finalized at `27,882` bytes with lowercase SHA-256
`ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`.
Fresh `1 -> 32` plus exact `31 -> 32` verification passes and reproduces the
unchanged table, catalog, reset-policy, and delete-guard inventory.

The T-095 corrective-prerequisite impact audit requires additive migration
`0033_add_fad_readiness_corrective_requeues.sql`. It preserves
the exact bytes of migrations `0030` through `0032`, adds only the immutable
`free_agent_draft_readiness_corrective_requeues` evidence table and its
indexes/guards, adds a job-side evidence guard for the exact failed-to-pending
corrective reset, and replaces only the readiness-operation forward trigger to
retain every schema-32 branch plus the evidence-backed blocked-to-blocked
corrective branch. The migration may not synthesize a readiness occurrence or
corrective row for preexisting data. The finalized migration is `56,084` bytes
with lowercase SHA-256
`93714178a4c89687578ca340afbe69c317239118cb50765838e6123ff6faf7f1`.
Its schema-33 inventory is `127` application tables, `128` tables including
`schema_migrations`, `127` repository-catalog entries, `45` post-reset
require-empty tables, `82` signed-reset-policy tables, and `63` installed
`BEFORE DELETE` guards. The fresh/upgrade schema, database-identity, catalog,
reset-manifest, and reset-bootstrap package passes `64/64` while preserving
migrations `0030` through `0032` byte-for-byte.

Additive migration
`0034_add_candidate_eligibility_search_indexes.sql` preserves every schema-33
table, trigger, guard, reset policy, repository-catalog entry, and row. It adds
only these three indexes plus the `application_metadata.data_model_version`
advance from `33` to `34`:

* non-partial `free_agent_draft_recoveries_league_player_status` on
  `(league_id ASC, player_id ASC, status ASC)` supports league-isolated,
  player-specific recovery-quarantine probes;
* partial `ownership_events_candidate_release_by_player` on
  `(league_id ASC, player_id ASC, occurred_at_ms DESC, id DESC)` where
  `event_type IN ('fantasy_elc_declined',
  'unsigned_prospect_rights_released')` limits the index to Candidate-blocking
  events and supplies deterministic newest-first order without a temporary
  sort B-tree; and
* partial `draft_eligible_players_rights_release_reentry` on
  `(league_id ASC, player_id ASC, rights_release_event_id ASC,
  eligibility_snapshot_id ASC)` where
  `eligibility_reason = 'rights_release_reentry'` supports the correlated
  same-league, same-player, exact-release approval lookup and snapshot join.

Migration `0034` is finalized at `1,158` bytes with lowercase SHA-256
`9347331419ada113707a4e71ef87c578ddd3cd0bd4ddb9578164f08b3307bb36`.
Because it adds no table or trigger, the schema-33 inventory remains `127`
application tables, `128` tables including `schema_migrations`, `127`
repository-catalog entries, `45` post-reset require-empty tables, `82`
signed-reset-policy tables, and `63` installed `BEFORE DELETE` guards. Fresh
`1 -> 34` and exact `33 -> 34` verification must reproduce those counts,
the three exact index definitions and their query-plan use, with
`integrity_check = ok` and zero foreign-key violations.

Additive migration `0035_add_candidate_card_help_command_results.sql` preserves
migrations `0030` through `0034` byte-for-byte and adds the immutable
`candidate_card_help_command_results` evidence needed to distinguish a newly
created help request from an already-active request while retaining exact
idempotent status and response replay. It is finalized at `10,981` bytes with
lowercase SHA-256
`cbbaf5322c111f3d13659cf6adc1a5046c8b49ba0ab84c3541d770a1dae3b669`.

The FAD-09 local target was schema version `36`. Additive migration
`0036_add_fad_eligibility_revalidation_occurrences.sql` preserves every prior
migration byte and adds the immutable
`free_agent_draft_eligibility_revalidation_occurrences` evidence described
above. Each row binds the exact player/FAD/source-operation semantic delta,
before/after player and effective-position evidence, canonical delta hash,
pending shared-lease job, and occurrence key. The global
`player_catalog_applied` event seals the complete batch, referenced evidence is
immutable, and the deadline status-transition barrier requires every bound job
to be `succeeded` or `skipped`. Migration `0036` is finalized at `22,871`
bytes with lowercase SHA-256
`1351e25758d7192ab804214f0abeb696a9b0a9b3509e81dcd276ac7570fbb1f6`.
The exact schema-36 inventory is `129` application tables, `130` tables
including `schema_migrations`, `129` repository-catalog entries, `47`
post-reset require-empty tables, `82` signed-reset-policy tables, and `69`
installed `BEFORE DELETE` guards. Fresh `1 -> 36` and exact `35 -> 36`
verification preserve every earlier ledger identity and application row and
finish with `integrity_check = ok` and zero foreign-key violations.

The FAD-10 deadline transaction requires additive migration
`0037_allow_atomic_fad_deadline_allocations.sql`. It preserves every earlier
migration identity and replaces only the pending-allocation insert guard so a
pending allocation may be inserted while the root FAD is still `cards_open`
only when the same transaction carries the exact live claimed
`fad_deadline` occurrence witness. Fabricated, stale, mismatched, or unrelated
writes remain rejected. Migration `0037` is finalized at `4,142` bytes with
lowercase SHA-256
`33b8e7c3479f9a3dc64011a29ced6421a5cc59eca62da8b8144cf82b1d0d80b3`.

The FAD-10 local target was schema version `38`. Additive migration
`0038_allow_pre_fad12_restricted_scheduling.sql` preserves every prior
migration identity and replaces only the allocation forward-update guard. An
exact Candidate tie may become `restricted_scheduled` only for the next
complete rapid rollover; pre-FAD-12 execution cannot activate the restricted
auction early. Fabricated context, mismatched rollover identity, and past-due
scheduling remain rejected, and ordinary weekly-auction behavior is unchanged.
Migration `0038` is finalized at `17,157` bytes with lowercase SHA-256
`b4567d087b31ff70dfa2776f2a15e6d22e182600d3dd5e5446a169bb64bb5ac5`.

Migrations `0037` and `0038` add no application table, catalog entry, reset-
policy entry, or immutable-delete guard. The exact schema-38 inventory remains
`129` application tables, `130` tables including `schema_migrations`, `129`
repository-catalog entries, `47` post-reset require-empty tables, `82` signed-
reset-policy tables, and `69` installed `BEFORE DELETE` guards. Fresh `1 ->
38` and exact upgrade verification preserve all prior rows and ledger
identities and finish with `integrity_check = ok` and zero foreign-key
violations. None of migrations `0023` through `0038` had reached shared staging
or production at FAD-10 closure.

FAD-11 adds migration `0039_add_fad_recovery_correction_evidence.sql`. It
preserves every prior migration identity and adds immutable T-142 recovery-
action and T-144 allocation-correction command results, exact queue-acceptance
and recovery causality, restricted-fallback guard support, and their replay/
immutability constraints. It is finalized at `201,713` bytes with lowercase
SHA-256
`a176479f3eb3fc1183c595a68026a2e5b73d6b975b66b6bcab5de4954945ae6f`.

The FAD-11 local target was schema version `40`. Additive migration
`0040_allow_atomic_fad_restricted_fallback_overlap.sql` replaces the combined
one-active-auction index with separate one-open and one-resolving indexes. It
admits an open fallback beside one resolving restricted source only inside the
exact live, due, no-current-bid, allocation-linked handoff and requires the
fallback context to cover one complete target rollover window. Every unrelated
overlap remains rejected. Migration `0040` adds no application table or catalog
entry and is finalized at `9,449` bytes with lowercase SHA-256
`cff71c33b628504d38b53cfe1621363740791c119c5b214d7d11e10f216a5a92`.

The schema-40 inventory is `131` application tables, `132` tables including
`schema_migrations`, and `131` repository-catalog entries.

The FAD-12 local target was schema version `43`. Migration
`0041_allow_fad_auction_resolution_recovery_resume.sql` adds only the exact
decision-derived allocation resume branch for a failed auction backed by its
latest failure and completed T-142 receipt. It is finalized at `35,525` bytes
with lowercase SHA-256
`00d6926934d46089df6581a8c3edc296394ce57958155e36da7d15b2be61111b`.
Migration `0042_use_current_aav_for_restricted_participant_floor.sql` replaces
only the restricted-participant forward trigger so an equal-total improvement
uses current rounded AAV rather than historical lowest-offered AAV. It is
finalized at `9,326` bytes with lowercase SHA-256
`4269c4a0c320364b65d20c01b167ff8738f1a67c7e4d52160e6e2245e201e537`.

Migration `0043_allow_repeat_fad_auction_resolution_recovery.sql` preserves one
causal recovery across repeated automatic terminal failures, selects the
latest exact failure event and completed retry receipt for allocation resume
and delayed rollover evidence, and permits system winner/no-winner settlement
of a running open-rapid recovery only with the exact terminal allocation,
auction, result, v2 draw, live job, cleared error, and receipt evidence. It
preserves the commissioner recovery-cancellation branch with the same latest-
failure semantics. It is finalized at `92,011` bytes with lowercase SHA-256
`1623d40ffaa477e3ba0be6bdd7c831f3d16489b53e4befc03eb7aa0e6efa6ae3`.

Schema 43 adds no application table or repository-catalog entry. Its inventory
remained `131` application tables, `132` tables including `schema_migrations`,
and `131` repository-catalog entries at FAD-12 closure.

The FAD-13 local target was schema version `47`. Migration
`0044_allow_immediate_fad_open_rapid_starts.sql` admits the exact immediate
manager/commissioner open-rapid starter without weakening queued or ordinary
paths. It is finalized at `32,654` bytes with lowercase SHA-256
`79f759030c01281f4a21aeba0584a3681d0ae84982d2b7a48dfcd7a5bf0274ee`.
Migration `0045_allow_restart_safe_fad_queued_nomination_activation.sql`
binds delayed and reclaimed activation to its exact live job, rollover, queue,
player, and starter evidence. It is finalized at `74,289` bytes with lowercase
SHA-256
`cd2a7d3059b6ab0f484267b6999cbadd6db1a86114fcdb67e4220296dca9ae37`.
Migration `0046_bind_fad_open_rapid_starter_edit_limit.sql` binds the ordinary
starter edit allowance to immutable auction-start evidence and, for a queued
starter, its exact queue backlink. It is finalized at `18,329` bytes with
lowercase SHA-256
`78626350a1efa3e76b09f3ba2dc812b135b1e2d19dd2c01d2e973a57a6a884bb`.
Migration `0047_allow_restart_safe_fad_rollover_finalization.sql` admits only
the exact T-142 retry transition from `recovery_required` to completed or a
repeated terminal recovery-required result under the same canonical rollover
job, recovery, latest failure, and receipt. It is finalized at `14,129` bytes
with lowercase SHA-256
`bdabbcff52cd87c932c3f2e067d825786fd6dac6354ea4a3a90396ec972b0b2b`.

Migrations `0044` through `0047` add no application table or repository-
catalog entry. Schema 47 remains the historical FAD-13 checkpoint at `131`
application tables, `132` tables including `schema_migrations`, and `131`
repository-catalog entries.

FAD-14 adds trigger-only migration
`0048_require_canonical_fad_realtime_evidence.sql`, pinned at `73,524` bytes,
`1,490` lines, and lowercase SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`.
It replaces only the two live head-47 automatic-award/opening evidence triggers
and preserves schema `48` as the intermediate canonical realtime checkpoint.
Trigger-only reconciliation migration
`0049_require_canonical_fad_setup_exemption_publications.sql` is pinned at
`29,571` bytes, `748` lines, and lowercase SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`.
It replaces only the live head-48 setup-exemption insert trigger. Schema `49`
is current locally with the same `131` application tables, `132` including the
ledger, and `131` repository-catalog entries. None of migrations `0023`
through `0049` has reached shared staging or production.

Before any of migrations `0023` through `0029` reaches shared staging, the
implementation performs a line-by-line impact audit against this amended
contract. Because those migrations are still local and unpromoted, they may
be amended in place where their old constraints would encode manual setup,
seed bids, seven-only rollovers, restricted-only draws, deferred weekly
recovery, mutable Week 1 assumptions, or incomplete lifecycle evidence. The
audit and focused migration tests must prove both the retained foundations and
every amendment; no compensating post-staging migration is used to preserve an
obsolete local design.

Because current operating mode is `OFFSEASON_RESET`, FAD migrations may be
developed and tested only against disposable databases until the approved
Season 1 reset has completed and its verification evidence is recorded. The
FAD migration is applied to shared staging and later environments only after
that reset boundary. This avoids adding `auction_contexts` and
`outbox_event_audiences` children before the reset removes or preserves their
parents; the approved reset manifest is not silently amended.

Migrations:

* run only through the explicit migration command;
* are transactional;
* update `application_metadata.data_model_version`;
* update `repositoryCatalog.js`;
* preserve all existing rows and constraints;
* pass foreign-key and integrity checks;
* require a verified staging backup before application.

The schema-version update is not limited to `repositoryCatalog.js`. The
implementation must update every hard-coded schema assertion and fixture,
including initial-schema and repository tests, staging-import verification,
cutover rehearsal, release-QA fixture creation, and release-QA runtime
verification. Any fixture that creates an auction or league-scoped realtime
outbox event must also create its context or audience through the same shared
writer. The work plan records the exact then-current schema version rather than
assuming schema 22 remains available.

---

## Existing Data

Migration does not create FAD rows from
`seasons.free_agent_draft_completed_at_ms`.

Existing seasons with that marker retain their ordinary-auction compatibility
behavior. They have no fabricated Candidate Cards or history.

Every existing auction receives one `ordinary_weekly` context during migration.
Existing league-scoped realtime outbox rows receive one league audience;
global/account/security/email rows remain unchanged and audience-free. Existing
notifications keep null deduplication keys.

No migration:

* opens Candidate Cards;
* creates no-draft exemptions;
* changes league or season lifecycle;
* rewrites ownership or contracts;
* starts jobs;
* sends notifications.

---

## Deployment Boundary

Implementation and release proceed:

1. temporary-database migration and repository tests;
2. local integrated runtime;
3. isolated staging migration after verified backup;
4. staging API, browser, scheduler, restart, and recovery proof;
5. release checklist evidence;
6. explicit separate production authorization.

The approved product and technical specifications do not authorize production
migration, reset, deployment, or live league mutation.

---

# Part 14 - Required Testing

## Domain Tests

Pure tests cover:

* slot-key parsing and F/D/B compatibility;
* contract precision, AAV rounding, minimum AAV, and Bench limit;
* completeness and maximum-cap projection, including negative cap space,
  card-wide over-cap exclusion, and incomplete-but-eligible cards;
* normal and fantasy-ELC carryover from Active, Bench, and Injured Reserve;
* compatible carryover rearrangement between Active and Bench with immutable
  player/contract identity;
* Active retained-contract owner amount after cumulative retention, separate
  responsible-team retention, and Active-only player-amount cap treatment;
* total-first ranking;
* equal-total AAV ranking;
* exact total-and-term tie detection;
* restricted active-improvement validation and regular auction edit/cooldown
  inheritance;
* total-first/AAV-second restricted and fallback floor comparison across
  different terms;
* FAD open and restricted AAV/term/draw ranking while ordinary weekly tie
  behavior remains unchanged;
* canonical draw framing and fixed test vectors;
* unbiased deterministic rejection sampling;
* anti-bluff plus original-total floor;
* exact cutoff comparisons and final-hour queue discrimination;
* first-valid-Monday readiness and overrun-recovery calculations, including
  167- and 169-elapsed-hour pairs of consecutive local Mondays across DST.

---

## Repository and Transaction Tests

Tests prove:

* every same-league foreign key and uniqueness constraint;
* one FAD per season, card per team, player per card, placed entry per slot,
  allocation per player, and context per auction;
* automatic readiness all-or-nothing behavior, persisted blockers, retry, and
  exact 22-card-slot creation per participating team;
* Entry Draft completion and each approved no-draft transition atomically
  creating exactly one `fad_readiness` operation/job, including the canonical
  `Inaugural league season.` reason;
* one immutable, canonically hashed readiness-attempt snapshot per completed
  worker attempt, with a successful attempt inside the opening commit and a
  blocked attempt/notification only after complete opening rollback;
* a blocked attempt committing no FAD, card, schedule, deadline/reminder job,
  activity, opening notification, or any of the four approved opening-
  publication outbox states;
* one immutable, canonically hashed T-128 receipt per accepted idempotency
  intent and one atomic blocked-to-blocked version advance plus same-job
  requeue, followed only later by the worker's blocked-to-running claim;
* exact scheduled Entry Draft-start rollover occurrence, commissioner retry,
  replay, rollback, and FAD evidence predicate;
* atomic rollover plus trading unlock plus Entry Draft `Live`/first-clock
  transition;
* contract, ownership, retention, buyout, trade, and season advancement in
  one rollover transaction;
* one-time Season 2 no-draft exemption authorization and consumption;
* exact original-league migration-report predicate and ambiguity rejection;
* summer transaction plus carryover synchronization rollback;
* one-player league-wide Candidate eligibility revalidation;
* T-133 and authoritative save sharing the event-bound rights-release
  re-entry predicate, including earlier approval plus newer unapproved release;
* T-133 query plans using all three schema-34 Candidate lookup indexes, with
  the ordered release lookup avoiding a temporary sort B-tree;
* deadline snapshot all-or-nothing behavior;
* one-player allocation isolation;
* exact requested-slot assignment;
* no duplicate contract, ownership, activity, notification, auction, or
  result on replay;
* restricted creation plus participant minimums, no seed bids/leaders,
  allowlist, and nonce commitment atomicity;
* zero-current-improvement restricted resolution plus atomic league-wide
  fallback creation;
* league-wide final-hour queue uniqueness, private opening, original
  submission cooldown anchor, and invalidation;
* cross-team queue collision returning generic quarantine without exposing
  queue/team/bid cause, plus invalid-row reason/terminal evidence;
* generalized FAD draw evidence for open and restricted auctions;
* no-bid unclaimed release and allocation-linked fallback no-winner;
* no reservation plus independent concurrent binding wins even when aggregate
  legality is exceeded;
* restricted bid removal/cancellation plus linked allocation atomicity;
* initial seven plus contiguous extension constraints;
* immutable T-095/T-096 schedule-command results and exact idempotent replay
  after a later schedule generation;
* schedule-generation bindings for every dependent job and stale-generation
  rejection inside the worker write transaction;
* completion timestamp agreement and atomic Week 1 schedule recovery,
  removed-week/matchup, replaced/cancelled-job, and canonical digest evidence;
* fixed `canonical-json-v1` input and SHA-256 output vectors for schedule
  recovery, sealed player-game stat observation sets, NHL game observation
  snapshots, and sealed late-lock exclusions.

---

## Time and Job Tests

Use injected clocks. Cover:

* before, exactly at, and after help opening;
* before, exactly at, and after deadline;
* persisted Week 1 producing the derived deadline/help/reminder/rollovers,
  including whole-Monday advancement when Entry Draft completion is late;
* Candidate Cards opening with fewer than 48 hours remaining makes help
  immediately available;
* before, exactly at, and after each 60-minute cutoff;
* before, exactly at, and after each rollover;
* seven initial exact 24-hour elapsed intervals plus one and multiple
  contiguous extension intervals;
* a DST transition in `America/Vancouver`;
* league-local Monday recovery across both DST directions without an elapsed
  `604800000` divisibility assumption;
* process restart before and after each commit;
* lease expiry, stale lease token, retry timestamp, and deployment overlap;
* exact `fad_readiness`, `fad_deadline_reminder`, and `fad_deadline` job types,
  with FAD-08 executing only readiness while FAD-10 executes reminder/deadline;
* 72-hour reminder due-immediately behavior, recipient resolution, and
  deduplication;
* same-cycle allocation lifecycle ordering as coordinator -> per-player runner
  -> coordinator, including the zero-allocation direct-to-`rapid` path;
* provider-import eligibility revalidation occurrence replay;
* delayed restricted activation plus complete FAD extension windows;
* queued nomination and no-improvement fallback activation around every
  boundary;
* final completion at/after Week 1 atomically moving schedule/jobs to the
  first valid later Monday;
* competition jobs rejecting incomplete FAD or a stale schedule version;
* late legal matchup lock using sufficiently fresh authoritative game state,
  atomically persisting the durable observation snapshot, immutable
  player/game/scheduled-start/source children, sealed exclusion root, snapshot,
  and baseline, excluding the entire already-underway NHL game including
  post-baseline events, rejecting any later child insertion, and converging
  under replay and racing legality-restoration attempts.

---

## Permission and Privacy Tests

Use at least two leagues and cover:

* manager access only to assigned cards;
* multiple managed teams;
* commissioner denial without help;
* exact one-card access after help;
* platform administrator without league membership denied;
* inherited platform administrator with active league membership receiving the
  exact commissioner T-127/T-128/T-129 projections and capabilities;
* current commissioner change;
* manager assignment transfer;
* help expiry;
* published commissioner-intervention attribution after a later manager edit;
* pre-deadline route, error, log, notification, outbox, and Socket.IO leakage;
* post-deadline league-only publication;
* cross-league IDs returning side-channel-safe results;
* GET and preview table-hash proof.

---

## Allocation and Auction Tests

Cover:

* sole offer;
* unique highest total;
* equal total with unique highest AAV;
* exact total and term tie;
* invalid top offer and next valid outcome;
* all offers invalid;
* concurrent ownership change;
* binding bid-time general-illegality confirmation;
* 14-day buyout lock;
* restricted allowlist denial;
* zero-bid restricted opening, ordinary manager edit limit/cooldown, and no
  manager withdrawal;
* below-ordinary-minimum Candidate floor plus minimum-enforced first
  improvement;
* original total/AAV floor across a term change;
* zero eligible current improvement after invalidation or commissioner
  removal opening fallback without a draw;
* fallback equal-floor acceptance and same-total/lower-AAV rejection;
* open and restricted draw commitment, reveal, replay, and audit evidence;
* no-bid, no-improvement, and non-tied terminal commitment reveal with
  `selectionUsed = false` and no selected bid;
* restricted commissioner edit, participant removal, cancellation, no-winner,
  correction, and recovery transitions;
* allocation quarantine and failed-open-rapid recovery quarantine across FAD
  completion and ordinary weekly creation;
* explicit no-winner cancellation as the only release for an unrecoverable
  failed open rapid auction;
* final-hour private nomination queue and post-rollover starter bid;
* open rapid ordinary edit/cooldown rules and FAD equal-chance tie override;
* no-bid close, unclaimed return, and later renomination;
* multiple concurrent wins completing independently without resource
  reservation or resolver confirmation;
* context-aware target season;
* no active rapid auction at completion;
* one immutable administration result for every successful `T-080` through
  `T-083` request and none for any failed request;
* fixed `canonical-json-v1` request and response SHA-256 vectors;
* exact replay after later bid, auction, correction, and job-state changes,
  including preservation of the original HTTP status and `T-083` descriptor;
  and
* update/delete rejection for every administration result and its completed
  idempotency back-link.

---

## HTTP Contract Tests

Every `T-126` through `T-144` endpoint proves:

* exact route registration;
* authentication and authority;
* exact input shape;
* target envelope and status;
* stable IDs and integer units;
* `If-Match` and idempotency where applicable;
* safe errors;
* no cross-league access;
* no private fields;
* no read side effects.

Focused T-126 through T-129 contract cases additionally prove:

* T-126's absent-or-complete roster query pair, T-127's exact `seasonId`
  query, and T-129's no-query shape reject every unknown, partial, duplicate,
  or malformed query with `400` before repository access;
* T-127 returns nullable Week 1 projections, empty rollovers before a persisted
  clock and exactly seven afterward, exact prior-rollover/team shapes, and the
  latest immutable attempt snapshot without invoking preflight;
* byte and semantic table-hash checks independently prove that T-127 and the
  internal preflight perform no writes; there is no readiness-preview route;
* T-128 returns side-channel-safe `404` for missing/cross-scope readiness,
  `409 FAD_READINESS_NOT_READY` for same-league nonblocked or unavailable-job
  state, and `412 FAD_READINESS_PRECONDITION_FAILED` for stale `If-Match`;
* T-128 exact replay preserves canonical response `data` and its stored hash
  after later readiness changes, performs no write, and uses the replay
  request's current `meta.requestId`;
* T-129 always returns all three viewer arrays, uses empty unauthorized arrays,
  exposes only `participatingTeams` numerically to a prepublication
  noncommissioner, and applies the exact three capability rules;
* T-129 exposes completion-overrun recovery only, while T-127 retains pre-open
  Week 1 attempt evidence; and
* the schema-31 migration leaves the exact migration-0030 bytes/hash unchanged,
  creates only the two readiness evidence tables and their support objects,
  replaces only the approved readiness forward-update trigger, and passes
  fresh/upgrade integrity, foreign-key, immutability, and replay tests;
* finalized schema-32 migration `0032`, pinned at `27,882` bytes and SHA-256
  `ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`,
  leaves migrations 0030 and 0031 byte-for-byte unchanged, creates no table or
  index, adds only the job-side reclaim guard, and permits only an expired
  readiness lease's atomic
  `running`-to-`running` handoff with a fresh token, unchanged synchronized
  job/operation attempt counts, and unchanged original start timestamps; and
* fresh, blocked-retry, and expired-running claims prove all-or-none job and
  readiness-operation writes, live-lease rejection, old-token fencing,
  rollback injection, and terminal evidence at the retained attempt number
  without inventing a separate attempt for the abandoned lease.

FAD-08 local closure evidence recorded on `2026-08-08` covers the internal
handoff and real trigger callers, readiness execution and carryover opening,
and the composed T-126 through T-129 repository/service/HTTP/runtime boundary.
Its behavior gate passes `336/336`, including exact original-receipt T-128
replay with zero writes after terminal readiness success; the independent
schema package passes `64/64`. This evidence does not expose the frontend or
authorize shared staging.

FAD-09 local closure evidence recorded on `2026-08-08` covers the composed
T-130 and T-133 through T-139 repository, service, HTTP, target-runtime, shared
limiter, summer-synchronization, provider-occurrence, shared-worker, and final
deadline-reconciliation boundaries. The target endpoint inventory is exactly
`110`. The provider occurrence/job/deadline selection passes `60/60`, the
complete summer-writer selection passes `262/262`, direct Candidate HTTP passes
`36/36`, composed runtime passes `66/66`, the local staging verifier passes
`9/9`, and reset bootstrap passes `8/8`, with no failure or skip. This is local
evidence only: no frontend caller is connected, shared staging is not deployed
or verified, and production remains untouched.

FAD-10 local closure evidence recorded on `2026-08-09` covers the composed
deadline-reminder, exact deadline transaction, immutable 22-slot publication,
whole-card disposition, T-131/T-132/T-140 read contracts, independent player
allocation, correction quarantine, and allocation-lifecycle coordinator. The
target endpoint inventory is exactly `113`. The scheduler executes coordinator
-> per-player allocation -> coordinator in the same cycle before ordinary
auction resolution, including the zero-allocation direct-to-`rapid` path and
one aggregate automatic-result notification per current manager/team pair.

The exact FAD-10 closure matrix passes `200/200` across `23` suites. Separate
recorded gates pass `4/4` composed-runtime tests, `18/18` coordinator tests,
`103/103` shared-auction regression tests, and `7/7` post-amendment reminder
tests. Pending published results retain the null/pending semantics defined
above. Exact Candidate ties remain scheduled or quarantined until the future
restricted-auction privacy and activation gate. This is local evidence only:
there is no frontend caller, shared staging was not deployed or verified, and
production remains untouched.

FAD-11 local closure evidence recorded on `2026-08-10` covers T-141 through
T-144, the FAD-linked T-080 through T-083 administration paths, atomic FAD
completion, and the shared transaction-owned restricted no-improvement
fallback. The local target runtime inventory remains exactly `117`.

Separate recorded FAD-11 gates pass `197/197` broader recovery/correction/
administration tests, `96/96` schema/runtime tests, `62/62` ordinary-auction
compatibility tests, and `40/40` complete administration-repository tests on
exact Node.js `24.14.1`. At that checkpoint the scheduled FAD resolver and
future restricted/fallback activation remained FAD-12/FAD-13 work.

FAD-12 local closure gates on exact Node.js `24.14.1` pass `52/52` resolver
policy/persistence/shared fallback, `15/15` application service/runner,
`71/71` activation/job-repository, `50/50` bid/HTTP/read capability, `170/170`
ordinary auction/administration compatibility, `303/303` schema-43/current-
head, and `94/94` final scheduler/runtime/deployment/ordinary compatibility tests. The
resolver atomically persists winner or fallback/no-winner evidence, records
only classified deterministic terminal failure, leaves transient exceptions
for expired reclaim, resumes exact T-142 recovery, and retries winner late-lock
from immutable replay without repeating database writes.

There was no frontend caller; shared staging was not deployed or verified, and
production remained untouched. At that checkpoint, direct and queued rapid
auctions, private final-hour nomination queueing, extension rollovers, and
completion recovery remained FAD-13 work.

FAD-13 local closure evidence recorded on `2026-08-10` covers server-derived
immediate and private queued starts, atomic queued activation, direct/queued
rapid bid and read behavior, exact-top and no-bid resolution, allocation-null
settlement, seven initial plus contiguous extension rollovers, restart-safe
finalization/recovery, atomic FAD and whole-Monday Week 1 completion, the
matchup-start guard, and the ordinary weekly-auction handoff. The rollover
runner first ensures canonical missing jobs, then uses the shared due, claim,
lease, exact-expiry reclaim, and retry path. The local target remains `117`
endpoint contracts on schema `47`.

Separate, overlapping Node.js `24.14.1` milestones pass `11/11` start-decision
policy, `10/10` immediate-start writer, `23/23` FAD start/lifecycle, `12/12`
ordinary creation compatibility, `125/125` queued activation, `22/22` focused
allocation-null resolution writer, `18/18` focused resolution service/runner,
`73/73` broader allocation-null resolution, and `122/122` bid/read
compatibility. Final gates pass `280/280` schema-47/current-head, `42/42`
rollover policy/writer/service/runner, `31/31` completion, `77/77` runtime
composition, and `15/15` matchup-start guard tests. These overlapping records
are not summed into one aggregate. No frontend, shared staging, or production
environment was opened, migrated, deployed, or changed.

FAD-14 local closure evidence recorded on `2026-08-11` covers the complete
eleven-type Activity registry, thirteen-type notification registry, four exact
Candidate Card opening publications, canonical eight-related-ID envelopes,
automatic-readiness and private queued-nomination audiences, publication
invalidation, reconnect reauthorization, and the setup-exemption exact current-
commissioner destination/deduplication and three-publication transaction. The
local target remains `117` endpoint contracts on schema `49`.

Separate pinned Node.js `24.14.1` gates pass `1,294/1,294` focused core tests
across `142` suites and `110` unique files, `95/95` production JavaScript
syntax checks, `265/265` schema-49 pin/runtime/reset/release/staging-verifier
tests, and `189/189` former-failure consolidation tests. The authoritative full
backend gate records `3,266` tests across `436` suites: `3,264` passed, zero
failed, cancelled, or todo, and two intentional Windows link-capability skips
(`symlink` and `target`) in
`sportsDataIoLiveCapabilityArtifactFoundation.test.js`, in about
`30m03.603s`. There is no FAD frontend caller, and no shared staging or
production environment was opened, migrated, deployed, or changed.

Existing auction rows `T-076` through `T-083` gain ordinary, open rapid, and
restricted context cases.

---

## Frontend and Browser Tests

Cover:

* inactive and active main navigation;
* nested route active state;
* roster active and historical links;
* multiple managed teams;
* private manager card;
* commissioner denial and exact help access;
* carried locked slots, IR projection, conflicts, and selectable entries;
* cents, term, AAV, live cap warning, deadline card-wide exclusion, and no
  Candidate cap-acknowledgement control;
* stale card behavior;
* deadline crossing with authoritative refetch;
* private-cache removal at assignment, help expiry, and publication;
* published league cards and outcomes;
* open, restricted-minimum, and fallback auction capabilities;
* binding warning, ordinary edit/cooldown limit, and absent manager withdrawal;
* 60-minute cutoff returning a private queued receipt rather than an error;
* queued-nomination private cache and invalidation;
* frozen FAD Week 1 versus recovered competition Week 1;
* notification deep links;
* realtime invalidation and reconnect;
* no hidden private content in DOM, storage, event payload, or inaccessible
  Query cache;
* keyboard and narrow-screen use.

---

## Required Evidence

Before FAD is launch-ready:

* focused backend suites pass;
* complete backend suite passes;
* focused frontend suites pass;
* complete frontend suite and build pass;
* temporary migration and deterministic fixture reset pass;
* two-league isolation passes;
* connected browser workflow passes;
* restart, delayed-job, recovery, and completion rehearsals pass;
* endpoint checklist rows reach `STAGING VERIFIED`;
* manual QA and release evidence are recorded.
* the persisted player catalogue supplies every Candidate and Entry Draft
  identity/position/eligibility input without consulting statistics, with
  live-statistics provider composition and the complete automatic matchup-
  occurrence runner disabled; the separate statistics follow-up owns
  implementation of the approved zero-season baseline and deliberate runner
  restoration/splitting;
* FAD, Entry Draft, auction, trade, and outbox workers remain available subject
  to their own activation and safety gates.

No result is reported as passing unless the command or workflow was actually
run.

---

# Part 15 - Approved Decisions

- [x] Candidate Cards are a dedicated aggregate, not roster state.
- [x] Contract years remain `Pending Rollover` after competition ends and
  advance only in the scheduled Entry Draft-start transaction.
- [x] The scheduled rollover reuses the prepared target season and commits
  atomically with trading unlock, Entry Draft `Live`, and the first pick clock;
  a failure exposes blockers and keeps draft/trading locked.
- [x] Entry Draft completion or the approved no-draft equivalent invokes one
  all-or-none automatic readiness operation; no commissioner manually creates
  a FAD or a subset of cards.
- [x] Persisted Week 1 anchors the immutable Candidate deadline and initial
  seven-day FAD clock; no fixed annual date is used.
- [x] Late Entry Draft completion advances Week 1 by whole league-local Mondays
  until the deadline is future-facing and the complete initial FAD window fits.
- [x] Carryovers are materialized and transactionally synchronized while cards
  are open; their identity/contract is locked but compatible Active/Bench
  rearrangement is allowed.
- [x] Each card always has 12 Forward, 6 Defence, and 4 optional neutral Bench
  slots; Bench has its separate AAV limit and cap exemption.
- [x] Deadline reconciliation is whole-card and strict: a card with an
  unresolved carried-roster structural conflict or an over-cap projection
  keeps carryovers but excludes every new Candidate offer, while a conflict-
  free incomplete, cap-compliant card contributes each individually valid
  filled offer.
- [x] The card version is the stale-write boundary.
- [x] Private and published card reads use separate paths and frontend cache
  keys.
- [x] Help is available for the last 48 hours or all remaining time when cards
  open later; asking grants the current commissioner exact-card view/edit
  authority until the deadline.
- [x] The original-league Season 2 no-draft exemption has one explicit
  authorized lifecycle writer.
- [x] Setup-exemption authorization preserves the exact eleventh FAD Activity,
  thirteenth FAD notification, current commissioner recipient, safe
  `commissioner_fad` destination, deduplication identity, and exact three-event
  metadata-only publication set; the private reason is absent from every
  Activity, notification, and realtime payload.
- [x] The deadline reminder has a durable occurrence and recipient-level
  deduplication.
- [x] The deadline creates immutable snapshots and per-player durable work.
- [x] Allocation is independent, atomic, idempotent, total-first, and
  AAV-second.
- [x] Automatic winners use the exact requested Candidate slot.
- [x] One auction engine uses server-owned context.
- [x] Open rapid auctions reuse ordinary auction behavior with persisted daily
  timing, regular edit limits/cooldowns, and no manager withdrawal.
- [x] Restricted participants begin with immutable Candidate minimums but no
  active bids or leaders; only a current strict improvement can contend.
- [x] Zero current restricted improvements opens a fresh league-wide 24-hour
  fallback at the tied floor and performs no draw.
- [x] A final-hour nomination is accepted privately, opens at rollover with
  its binding starter bid, and resolves at the following rollover.
- [x] FAD queues and bids reserve no cap, roster, position, player, or other
  auction resource; every valid concurrent win commits independently without
  a second resolver confirmation.
- [x] A no-bid FAD auction closes without a winner and returns the player to
  the unclaimed pool for later renomination.
- [x] Exact top ties in open and restricted FAD auctions use the committed
  auditable equal-chance draw; ordinary weekly tie rules remain unchanged.
- [x] The draw uses one canonical versioned byte encoding.
- [x] Restricted commissioner administration updates the linked FAD allocation
  atomically or creates explicit correction recovery.
- [x] Delayed restricted, queued, fallback, and recovery work remains FAD work
  and creates contiguous extension rollovers; nothing is deferred to an
  ordinary weekly auction.
- [x] Private realtime delivery uses explicit outbox audiences.
- [x] Candidate Card opening publishes only the four approved metadata-only
  family/reason sets: league `free_agent_draft.changed/cards_opened`, league
  `activity.created/cards_opened`, per-card team
  `candidate_card.changed/card_changed`, and exact-recipient user
  `notification.created/cards_opened`; `fad_cards_opened` remains only the
  notification type.
- [x] Realtime `related` contains exactly eight nullable stable IDs, including
  nomination-queue and schedule-recovery-operation identity, and private
  queued-nomination events remain limited to the nominating team and exact
  recovery authority until auction opening.
- [x] FAD and season completion timestamps commit together only after every
  initial/extension rollover and downstream path is terminal.
- [x] If FAD completion reaches or overruns Week 1, schedule/job recovery and
  FAD completion commit atomically; matchup jobs require the completed FAD
  gate and matching schedule version. For the preseason FAD-only candidate,
  those automatic matchup occurrences remain disabled even after that gate;
  the future provider-neutral slice must restore or split their runner.
- [x] FAD completion does not require a full/legal roster. A late legal
  matchup snapshot scores only forward and excludes an already-underway NHL
  game in full.
- [x] Existing live rows are preserved and no historical FAD is fabricated.
- [x] Prior-season statistic rows are historical/source evidence only and never
      populate a new season's player, roster, FAD, Entry Draft, matchup, or
      standings totals.
- [x] FAD-18 has no paid-provider credential, probe-manifest, live-observation,
      or signed-capability-artifact gate.
- [x] The Season 2 presentation provider may remain disabled and nonblocking.
- [x] Migrations 0023 through 0029 require pre-staging impact audit and
  amendment plus acceptance evidence for every rule above.

---

# Definition of Done

This technical design is implemented only when:

* the approved work plan is complete;
* the target schema and repository catalog agree;
* scheduled rollover, automatic readiness, cards, carryover, help, deadline,
  allocation, rapid/restricted/fallback auctions, private queue, extension
  rollovers, recovery, and atomic schedule-aware completion operate through
  the approved module boundaries;
* exact API and frontend contracts are connected;
* privacy and league isolation are proven;
* scheduled work survives restart and replay;
* all required test and staging evidence passes;
* no production action occurs without explicit authorization.

---

# Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/OPERATING_MODE.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/FREE_AGENT_DRAFT.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/07-testing/RELEASE_CHECKLIST.md
```
