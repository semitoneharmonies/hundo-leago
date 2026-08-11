# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`ACTIVE - FAD-18 AUTHORIZED ISOLATED SHARED-STAGING GATE`

## Fresh-Chat Handoff

The former FAD-11 safe-checkpoint handoff is retained at
`docs/06-work-plans/archive/FAD-11_SAFE_PAUSE_HANDOFF_2026-08-10.md` as a
retired historical record only. Its resume instructions and schema-39 status
are superseded and must not be followed. This active plan, Current State,
Active Roadmap, Testing Strategy, and Backend Endpoint Checklist are
authoritative for the current FAD-18 isolated-staging gate. Production remains
a separate unauthorized decision.

## Work Plan ID

```text
M7-25
```

## Work Item

```text
Annual Free Agent Draft implementation sequence
```

## Authority and Execution Boundary

Grae asked Codex on `2026-07-28` to formalize the implementation sequence for
the approved annual Free Agent Draft and Candidate Card system.

On `2026-07-29`, Grae approved the consolidated FAD lifecycle amendment and
instructed Codex to continue through the isolated staging deployment unless
asked to pause. That instruction authorizes the isolated `FAD-18` staging gate
after every prerequisite in this plan passes. It does not authorize production,
skip the migration/reset/backup gates, or permit use of production data or
storage.

This document approves the sequence, dependency gates, migration allocation,
verification standards, and rollback boundaries needed to begin implementation.
It does not, by itself, authorize any implementation slice.

Implementation begins only after Grae separately asks to execute a named slice
or clearly asks to start building the system. Only one slice may be active at a
time. At the end of every slice, Codex must report the exact files changed,
behavior changed or preserved, commands run, actual results, remaining risks,
and the next eligible slice, then stop.

Grae's later continue-through-isolated-staging instruction recorded above
authorizes Codex to advance automatically to the next dependency-eligible slice
after recording each completed gate. The reporting requirement remains in
force; the mandatory stop does not while that continuation instruction remains
active.

Grae paused that continuation instruction on `2026-07-29`. No implementation,
verification, integration, or deployment work may resume until Grae explicitly
asks Codex to continue.

Grae explicitly resumed the work on `2026-08-01` and restored the instruction
to continue through the verified isolated staging deployment unless asked to
stop. The dependency, safety, reporting, and production boundaries above remain
unchanged.

Grae later asked Codex to stop at the next safe milestone. That pause is
preserved below as historical restart evidence. Grae's latest instruction is
to continue from that checkpoint through the verified isolated staging gate
unless asked to pause; production remains unauthorized.

On `2026-08-09`, Grae again asked Codex to stop at the next safe milestone.
Work was paused at the exact local FAD-11 checkpoint below. No T-082, T-083,
restricted-fallback, later FAD slice, staging, or production work may begin
until Grae explicitly asks Codex to continue.

Grae explicitly resumed that work on `2026-08-10`, then asked Codex to pause at
the next safe checkpoint. T-082 and T-083 were completed and verified locally.
Work is now paused before the shared restricted no-improvement fallback
primitive. No fallback implementation, FAD-12 work, staging, or production
work may begin until Grae explicitly asks Codex to continue again.

Grae then explicitly resumed the work and restored the instruction to continue
until the approved isolated staging deployment is finished or Grae asks Codex
to pause. FAD-11 through FAD-17 have since completed locally. FAD-18 is now the
sole active isolated-staging slice; production remains unauthorized.

## Current Continuation Checkpoint - FAD-18 Active after FAD-17 Local Closure

`FAD-01` through `FAD-10` are complete locally. `FAD-08` closed with the
transaction-bound readiness handoff, real T-036/T-037/T-095 caller composition,
automatic readiness execution, all-or-none carryover/card opening, and composed
T-126 through T-129 service, HTTP, privacy, error, and no-write contracts.
`FAD-09` closed locally with T-130 and T-133 through T-139 jointly exposed in
the local target runtime, complete summer synchronization, durable semantic
provider revalidation, and atomic deadline reconciliation. `FAD-10` closed
locally with the reminder, deadline, publication, independent allocation, and
allocation-lifecycle runtime composed. `FAD-11`, `FAD-12`, `FAD-13`, and
`FAD-14` are complete locally. FAD-15, FAD-16, and FAD-17 have also closed
locally, and FAD-18 is the sole active isolated-staging slice.

The completed FAD-11 local closure includes:

- final additive migration `0039` at `201,713` bytes and SHA-256
  `a176479f3eb3fc1183c595a68026a2e5b73d6b975b66b6bcab5de4954945ae6f`,
  with the schema-39 recovery, correction, queue-acceptance, restricted-
  fallback, and immutable command-result guards adopted by the current schema,
  reset, import, release, and staging-cutover verification surfaces;
- additive migration `0040_allow_atomic_fad_restricted_fallback_overlap.sql`
  at `9,449` bytes and SHA-256
  `cff71c33b628504d38b53cfe1621363740791c119c5b214d7d11e10f216a5a92`.
  Schema `40` is current locally. It replaces the one combined active-auction
  index with separate one-open and one-resolving indexes and permits only the
  exact transaction-bound restricted-source/fallback overlap with a complete
  24-hour target window; it adds no table or repository-catalog entry;
- T-141 through T-144 recovery read/action and deterministic correction
  preview/apply services, repositories, HTTP contracts, privacy, no-write,
  idempotency, current-authority, rollback, and immutable replay evidence;
- atomic FAD completion, including Week 1 recovery or prior-recovery no-op,
  composed through the lifecycle dispatcher and target scheduler;
- exact target-runtime composition with `117` unique endpoint contracts and a
  `36/36` full runtime foundation gate on Node.js `24.14.1`; the same gate
  executes a non-empty Candidate Card through schema-39 deadline publication,
  allocation, contract/ownership creation, and the transition to `rapid`;
- FAD-linked T-080 commissioner bid edit and T-081 commissioner bid removal.
  T-080 preserves the immutable Candidate floor and participant/history,
  bypasses manager edit consumption, and reanchors the participant cooldown.
  T-081 writes the removal event, withdraws the exact bid, permanently removes
  the participant, preserves the allocation/minimum/history, and does not
  resolve early or create a fallback. Current commissioner and inherited
  member-platform-administrator authority are revalidated before replay;
- T-082 restricted cancellation as one final-schema transaction: physical
  cancelled/failed resolution, allocation `correction_required`, exact linked
  failed target job and recovery, current-version allocation events, immutable
  Candidate/draw/participant evidence, no winner/fallback/resources, exact
  replay, and full late rollback;
- T-082 failed direct open-rapid recovery cancellation: exact causal failed
  job/recovery/event validation, leased recovery execution, cancelled/recovered
  resolution, empty v2 no-selection draw reveal, resolved recovery, succeeded
  canonical job result, derived quarantine release, and healthy-open rejection;
  and
- T-083 durable manual resolution requests for restricted and open-rapid FAD
  contexts. They create or reuse the exact `auction.resolve.target` occurrence,
  never resolve inline, preserve unchanged auction-version evidence, replay an
  immutable original `pending` response after later cancellation, reuse live
  and genuinely succeeded jobs, retry only nonterminal failed jobs, keep
  physical failed FAD auctions on T-142 recovery, and remain invisible to the
  ordinary-only resolver;
- the shared caller-transaction-owned restricted no-improvement fallback
  primitive. It revalidates the source auction, allocation, draw, contender,
  target rollover, lease, and any required recovery/retry evidence; invalidates
  ineligible active offers; closes the restricted source without a winner;
  creates the fresh league-wide fallback immediately or schedules its exact
  future activation; preserves the full 24-hour fair-access window; publishes
  immediate activity, notifications, and scoped outbox evidence only when the
  fallback is actually open; resolves a linked running recovery when present;
  and provides exact replay, collision isolation, and rollback; and
- the integrated FAD-11 closure audit and canonical documentation update.

All recorded FAD-11 gates pass on exact Node.js `24.14.1`: the broader
recovery/correction/administration matrix is `197/197`, the schema/runtime
matrix is `96/96`, the ordinary-auction compatibility matrix is `62/62`, and
the complete administration repository is `40/40`. Syntax checks pass. The
local target runtime remains at `117` unique endpoint contracts. No frontend,
shared database, staging, or production environment was changed.

The completed FAD-12 local closure includes:

- additive migration `0041_allow_fad_auction_resolution_recovery_resume.sql`
  at `35,525` bytes and SHA-256
  `00d6926934d46089df6581a8c3edc296394ce57958155e36da7d15b2be61111b`;
- additive migration
  `0042_use_current_aav_for_restricted_participant_floor.sql` at `9,326` bytes
  and SHA-256
  `4269c4a0c320364b65d20c01b167ff8738f1a67c7e4d52160e6e2245e201e537`;
- additive migration
  `0043_allow_repeat_fad_auction_resolution_recovery.sql` at `92,011` bytes
  and SHA-256
  `1623d40ffaa477e3ba0be6bdd7c831f3d16489b53e4befc03eb7aa0e6efa6ae3`.
  Schema `43` was current locally at FAD-12 closure with `131` application
  tables, `132` tables including `schema_migrations`, and `131` repository-
  catalog entries;
- the FAD-only resolution decision and one-transaction writer for exact
  Candidate-tie restricted auctions and allocation-linked
  `restricted_no_improvement_fallback` auctions. Current eligible bids rank by
  AAV, then shorter term, and only an exact top tie uses the committed FAD draw.
  A sole/non-tied winner and both no-contender outcomes use the auditable
  no-selection reveal. Restricted no-improvement opens the shared full-window
  league-wide fallback, while an allocation-linked fallback with no contender
  closes without a winner;
- normal anti-bluff pricing, the sole-bid persisted second-price sentinel `0`,
  restricted Candidate-floor protection, binding contract/ownership/roster
  persistence, summer synchronization, allocation/activity/outbox evidence,
  exact replay, and winner-only post-commit late-lock coordination;
- deterministic terminal resolution failures recorded atomically as one causal
  recovery/correction chain, transient lease failures left for expired reclaim,
  T-142 physical retry resume, repeated-failure reuse of the same recovery, and
  exact latest-failure/receipt guards through successful automatic settlement;
- delayed restricted and fallback activation workers plus server-derived
  restricted/fallback manager bidding, immutable idempotent replay, and
  read/edit-limit projection. The allocation coordinator now permits immediate
  restricted activation only because the complete resolver, administration,
  recovery, and activation chain is composed;
- target scheduler order `free_agent_draft_auction_resolution` ->
  `free_agent_draft_restricted_activation` ->
  `free_agent_draft_fallback_activation` -> ordinary `auction_resolution` ->
  `free_agent_draft_completion`, preserving the ordinary-only repository and
  ordinary weekly-auction behavior; and
- exact Node.js `24.14.1` gates: `52/52` resolver policy/persistence/shared
  fallback, `15/15` application service and durable runner, `71/71`
  activation/job-repository, `50/50` bid/HTTP/read capability, `170/170`
  ordinary auction/administration compatibility, `303/303` schema-43/current-
  head, and `94/94` final scheduler/runtime/deployment/ordinary compatibility
  tests.

No frontend, shared database, staging, or production environment was opened,
migrated, deployed, or changed. At that checkpoint, FAD-12 deliberately
rejected direct and queued open-rapid resolution; those paths, final-hour
private queueing, extensions, and completion recovery remained FAD-13 work.

The completed FAD-13 local closure includes:

- additive migration `0044_allow_immediate_fad_open_rapid_starts.sql` at
  `32,654` bytes and SHA-256
  `79f759030c01281f4a21aeba0584a3681d0ae84982d2b7a48dfcd7a5bf0274ee`;
- additive migration
  `0045_allow_restart_safe_fad_queued_nomination_activation.sql` at `74,289`
  bytes and SHA-256
  `cd2a7d3059b6ab0f484267b6999cbadd6db1a86114fcdb67e4220296dca9ae37`;
- additive migration `0046_bind_fad_open_rapid_starter_edit_limit.sql` at
  `18,329` bytes and SHA-256
  `78626350a1efa3e76b09f3ba2dc812b135b1e2d19dd2c01d2e973a57a6a884bb`;
- additive migration
  `0047_allow_restart_safe_fad_rollover_finalization.sql` at `14,129` bytes
  and SHA-256
  `bdabbcff52cd87c932c3f2e067d825786fd6dac6354ea4a3a90396ec972b0b2b`.
  Schema `47` was current at FAD-13 closure with `131` application tables,
  `132` tables including `schema_migrations`, and `131` repository-catalog
  entries;
- server-derived T-077 immediate open-rapid starts with more than 60 minutes
  remaining and private queued starts at the cutoff, with the exact binding
  starter, no-reservation confirmation, idempotent response, and rollover
  identities;
- atomic queued activation at the exact target rollover for one complete
  following cycle, including extension creation, delayed/reclaimed execution,
  and immutable queue/start evidence;
- direct and queued open-rapid bid/edit/read behavior plus one shared FAD
  resolver for exact-top, allocation-null winner, and no-bid unclaimed
  outcomes, deterministic recovery, transient reclaim, and exact T-142 retry;
- a rollover finalizer that first ensures missing canonical jobs, then uses the
  shared due, claim, lease, exact-expiry reclaim, and retry path for seven
  initial and all required contiguous extension boundaries;
- atomic FAD completion and whole-Monday Week 1 recovery/future-job replacement,
  a transaction-time matchup-start guard, and ordinary weekly auctions only
  after both season start and FAD completion while preserving quarantine; and
- target scheduler order `free_agent_draft_auction_resolution` ->
  `free_agent_draft_restricted_activation` ->
  `free_agent_draft_fallback_activation` ->
  `free_agent_draft_queued_nomination_activation` ->
  `free_agent_draft_rollover_finalization` -> ordinary `auction_resolution` ->
  `free_agent_draft_completion`.

Separate, overlapping Node.js `24.14.1` milestones pass `11/11` start-decision
policy, `10/10` immediate-start writer, `23/23` FAD start/lifecycle, `12/12`
ordinary creation compatibility, `125/125` queued activation, `22/22` focused
allocation-null resolution writer, `18/18` focused resolution service/runner,
`73/73` broader allocation-null resolution, and `122/122` bid/read
compatibility. Final closure gates pass `280/280` schema-47/current-head,
`42/42` rollover policy/writer/service/runner, `31/31` completion, `77/77`
runtime composition, and `15/15` matchup-start guard tests. These records
overlap and are not added into one aggregate total. The canonical writer-to-
shared-JobRepository list/claim/exact-expiry-reclaim integration passes `1/1`;
the complete rollover writer passes `13/13`; and the shared JobRepository
passes `28/28` without a production repository change.

That schema-`47` record remains the historical FAD-13 checkpoint. FAD-14 then
added trigger-only migration
`0048_require_canonical_fad_realtime_evidence.sql` at `73,524` bytes, `1,490`
lines, and SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`, followed
by trigger-only reconciliation migration
`0049_require_canonical_fad_setup_exemption_publications.sql` at `29,571`
bytes, `748` lines, and SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`.
Schema `48` is the preserved intermediate realtime checkpoint; schema `49` is
current locally with `131` application tables, `132` including the ledger, and
`131` repository-catalog entries.

No FAD frontend, shared database, staging, or production environment was
opened, migrated, deployed, or changed. Migrations `0023` through `0049`
remain local only, and the target endpoint inventory remains `117`.

Continue with FAD-18 exactly as specified in its slice below without changing
the completed frontend or backend FAD Activity, notification, realtime, rapid-
auction, rollover, completion, restricted/fallback, or ordinary weekly-auction
behavior. Do not weaken any provider, backup, reset, migration, isolation, or
production-authority gate to make staging proceed.

The completed FAD-08 foundation at this checkpoint is:

- `freeAgentDraftReadinessPolicy.js` owns the three exact automatic trigger
  plans, canonical pending `fad_readiness` descriptor, exact T-128 request
  representation/hash, immutable canonical `202` retry receipt, immutable
  readiness-attempt creation/validation, canonical internal diagnostic order,
  and exact corresponding public diagnostic projection;
- additive migration `0031` creates immutable readiness-attempt and retry-
  receipt evidence and their support guards, and replaces only
  `free_agent_draft_readiness_operations_forward_update` to admit the exact
  receipt-backed blocked-to-blocked version advance. Application transactions,
  not hidden schema side effects, own job/operation creation, claims, attempts,
  terminal job coordination, and T-128;
- additive migration `0032` adds only the job-side expired-readiness-lease
  reclaim guard and replaces only the readiness-operation forward trigger. It
  preserves attempt counts, original start timestamps, and all result evidence
  while advancing both aligned versions once and fencing the old token;
- `SqliteFreeAgentDraftRepository.js` atomically creates the pending job and
  readiness operation, coordinates immutable blocked and successful terminal
  attempts with the canonical job, enforces exact attempt replay, and
  deduplicates blocker notifications by current commissioner;
- `SqliteFreeAgentDraftJobRepository.js` atomically claims or expired-lease
  reclaims the aligned readiness operation/job, excludes failed readiness from
  ordinary due work, and implements the complete T-128 repository transaction:
  current authority, actor-scoped idempotency, no-write immutable replay,
  same-job clean requeue, immutable receipt, aligned one-version readiness
  advance, exact postconditions, and rollback at all five writes plus the final
  commit hook;
- the repository catalog and post-reset policy include both schema-31 tables
  as required-league, require-empty evidence without changing the signed reset
  JSON policy.

The completed runtime composes the FAD router, read and retry services, and the
readiness worker in the canonical scheduler order. Exact T-128 replay returns
the original immutable `202` receipt without a write after both later blocking
and terminal readiness success.

Migration `0030` is re-frozen after the pre-staging T-145 current-generation
compatibility correction at `636,077` bytes and SHA-256
`6f46b7a8c52108adfc0b51dc1eb9cdcab0ed274482ca396a31f7d45e42c07184`.
Migration `0031` is finalized locally at `46,693` bytes and SHA-256
`f2c5104f2eb06e261cc902067bd4623b841f2c37a04f73d27487863077b2662a`.
Migration `0032` is finalized locally at `27,882` bytes and SHA-256
`ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`.
Migration `0033` is finalized locally at `56,084` bytes and SHA-256
`93714178a4c89687578ca340afbe69c317239118cb50765838e6123ff6faf7f1`.
Migration `0034` is finalized locally at `1,158` bytes and SHA-256
`9347331419ada113707a4e71ef87c578ddd3cd0bd4ddb9578164f08b3307bb36`.
It adds only the three Candidate eligibility-search indexes, including the
recovery index dropped by the 0030 table rebuild; it changes no application
table, trigger, view, catalog, reset policy, or delete guard. The
then-current schema/import/reset/release bookkeeping advanced to schema `34`: `127`
application tables, `128` including the migration ledger, `127` catalog
entries, `45` require-empty tables, `82` signed-policy tables, and `63` delete
guards. The historical schema-33 package remains `64/64`; the focused
schema-34 exact upgrade/fresh-install, identity, preservation, integrity,
foreign-key, exact-index, and real-query-plan gate passes `10/10` while every
earlier migration identity remains unchanged.

Migration `0035` is finalized locally at `10,981` bytes and SHA-256
`cbbaf5322c111f3d13659cf6adc1a5046c8b49ba0ab84c3541d770a1dae3b669`. It adds immutable
Candidate Card help-command results. Migration `0036` is finalized locally at
`22,871` bytes and SHA-256
`1351e25758d7192ab804214f0abeb696a9b0a9b3509e81dcd276ac7570fbb1f6`. It adds
immutable provider-catalog eligibility-revalidation occurrences, seals each
semantic player/FAD delta to its exact shared-lease job and catalog event, and
enforces the deadline barrier. The schema-36 inventory is `129`
application tables, `130` including the migration ledger, `129` repository-
catalog entries, `47` post-reset require-empty tables, `82` signed-reset-policy
tables, and `69` immutable-delete guards.

Migration `0037_allow_atomic_fad_deadline_allocations.sql` is finalized locally
at `4,142` bytes and SHA-256
`33b8e7c3479f9a3dc64011a29ced6421a5cc59eca62da8b8144cf82b1d0d80b3`.
It permits only the exact pending allocation insert performed under the live
claimed deadline occurrence while the root remains
`cards_open`. Migration `0038_allow_pre_fad12_restricted_scheduling.sql` is
finalized locally at `17,157` bytes and SHA-256
`b4567d087b31ff70dfa2776f2a15e6d22e182600d3dd5e5446a169bb64bb5ac5`.
It keeps pre-FAD-12 exact Candidate ties `restricted_scheduled` for the next
complete rapid rollover rather than allowing premature activation, without
changing ordinary-auction behavior. Schema `38` is current and retains the
schema-36 inventory: `129` application tables, `130` including the migration
ledger, `129` repository-catalog entries, `47` post-reset require-empty tables,
`82` signed-reset-policy tables, and `69` immutable-delete guards.

The worker claim/reclaim, terminal-attempt, and T-128 repository seams are
resolved and focused locally. Full T-128 job-repository regression passes
`26/26`; schema-31/schema-32 persistence and reclaim regression passes `16/16`.
Schema 33 adds distinct immutable T-095 corrective-requeue evidence rather
than impersonating an actor-scoped T-128 receipt or weakening the existing
guards.

The FAD-08 schedule-recovery impact audit found one pre-staging compatibility
defect in the previously completed T-145 foundation. T-145 still counted every
historical succeeded `schedule_generate` operation and required the original
T-095 actor/metadata shape, while T-096 and FAD recovery correctly preserve a
superseded immutable root and create a distinct current generation with
source-specific provenance. The corrective seam binds T-145 to
exactly one current `season_matchup_schedule_generations` row, validates the
initial, T-096, or FAD-recovery provenance branch exactly, preserve every
superseded root, and fail closed on malformed lineage. Because no FAD migration
has reached staging, the affected migration-0028/schema-30 guards were amended
and re-pinned locally before FAD-08 closure. The corrected current hashes above
are authoritative; the separately labelled pre-amendment audit table below is
retained only as historical impact-audit evidence.

This is the FAD-08 local closure. Its uninterrupted behavior gate passes
`336/336`, and its independent schema gate passes `64/64`, with no failure,
cancellation, or skip. Full T-108 selection, forfeiture, timeout, and UI remain
correctly M8-deferred. No shared-staging or production database was opened or
changed.

The completed FAD-09 foundation at this checkpoint is:

- T-130 and T-133 through T-139 are jointly exposed in the local target
  runtime, increasing the target endpoint inventory from `102` to `110`;
- Candidate reads, previews, writes, carryover moves, deletes, and help enforce
  exact current-card authority, privacy, concurrency, immutable original-
  response replay, and transaction-bound side effects;
- every authoritative roster, contract, trade, buyout, prospect, correction,
  position, retention, auction-allocation, and player-state summer writer calls
  the same synchronizer inside its existing transaction;
- semantic provider-catalog changes create one immutable occurrence and exact
  shared-lease job per affected player/open FAD, and the worker synchronizes the
  affected cards before committing the terminal job state;
- deadline reconciliation performs one final authoritative card sync,
  terminalizes outstanding occurrence-bound jobs as `deadline_reconciled`, and
  fences stale workers;
- `fad_candidate_write` allows `120` attempts per session and `600` per league
  per `15` elapsed minutes, `fad_help_write` allows `5` per session and `25` per
  league per elapsed hour, and `fad_operational_write` allows `30` per session
  and `120` per league per `15` elapsed minutes; and
- closure gates pass `60/60` provider occurrence/job/deadline tests, `262/262`
  summer-writer tests, `36/36` direct Candidate HTTP-boundary tests, `66/66`
  composed-runtime tests, `9/9` local staging-verifier regression tests, and
  `8/8` reset-bootstrap tests.

The completed FAD-10 foundation at this checkpoint is:

- the deadline reminder resolves current recipients at execution, deduplicates
  per manager/team occurrence, and never sends after the deadline;
- the deadline transaction performs final eligibility reconciliation, locks
  every card, expires help, seals every immutable 22-slot snapshot, creates
  every distinct-player allocation and job, moves the root to
  `deadline_locked`, and publishes the league view in one outer transaction;
- T-131, T-132, and T-140 are composed and contract-tested locally, increasing
  target endpoint inventory from `110` to `113`; pending allocation reads keep
  decisions, ranks, outcomes, and Candidate-slot results explicitly null or
  `pending` until durable allocation evidence exists;
- each player allocation claims and resolves independently, creates an exact
  requested-slot award or explicit `correction_required` recovery, and records
  complete offer evidence without rolling another player's result back;
- the allocation lifecycle coordinator drives `deadline_locked` to
  `allocating`, or directly to `rapid` for zero allocations, and later drives
  `allocating` to `rapid` only after every allocation leaves `pending`, with
  one aggregate result notification per current manager/team pair; and
- one scheduler cycle runs coordinator -> per-player allocation -> coordinator
  before ordinary auction resolution. Exact Candidate ties remain scheduled or
  quarantined until the future restricted-auction privacy and activation gate.

FAD-10 closure passes the exact `200/200` matrix across `23` suites, `4/4`
composed-runtime tests, `18/18` coordinator tests, `103/103` shared-auction
regression tests, and `7/7` post-amendment reminder tests. These are separate
recorded gates, not one invented aggregate. No frontend caller was connected,
and no shared staging or production environment was opened or changed.

The dependency order recorded at that checkpoint was:

1. FAD-11 through FAD-13 are complete locally, including the shared restricted
   no-improvement fallback, every rapid-auction path, rollover finalization,
   completion, and the ordinary-auction handoff.
2. FAD-15 through FAD-17 were to continue in dependency order, with each local
   acceptance gate recorded before advancing.
3. Shared staging was to remain closed until the later FAD-17 and FAD-18 reset,
   backup, rollback, migration, and isolated-deployment gates passed.

Those local FAD-15 through FAD-17 gates are now complete. FAD-18 is the sole
active isolated-staging slice and cannot deploy until its current named
external prerequisites are satisfied.

## Historical User Pause Checkpoint - 2026-07-29

This checkpoint was the authoritative restart record on `2026-07-29`; it is
retained as history and is superseded by the current checkpoint above. At that
time, both repositories remained on
`staging` with extensive intentional, uncommitted FAD and prerequisite work.
Nothing is staged, committed, pushed, or deployed. No shared-staging or
production database was opened or changed.

The last fully closed implementation checkpoint is the FAD auction
administration HTTP/runtime boundary:

- `T-080` through `T-083` are composed through the new auction-administration
  service and SQLite repository;
- manager bid withdrawal remains prohibited and FAD auction contexts fail
  closed;
- admin edit, remove, cancel, and resolution-request commands enforce their
  authority, precondition, idempotency, cooldown, and durable-resolution-job
  rules;
- the focused policy/repository/service gate passed `33/33`, the auction HTTP
  gate passed `8/8`, and the final target-runtime gate passed `24/24`, including
  the exact `98`-endpoint inventory; and
- the service currently samples the server clock before repository replay
  discovery. This does not change state or replay representation, but a future
  strict zero-clock-sampling replay requirement would need a lazy-clock or
  replay-probe interface.

The FAD-07 foundation is intentionally paused at the following exact boundary:

- Candidate Card, allocation, exact-top draw, schedule-recovery, Candidate Card
  repository, and FAD lifecycle repository foundations previously passed a
  combined `74/74`;
- `SqliteCandidateAllocationRepository.js` and its foundation test now encode
  immediate `restricted_active` creation when more than 60 minutes remain and
  `restricted_scheduled` creation during the final hour. Exact lease expiry is
  also rejected. These latest amendments still require their integrated rerun
  against the amended migration;
- `0030_apply_locked_fad_decision_package.sql` now contains the restored
  deadline, allocation, automatic-award, auction-completion, final-completion,
  and resolution-job barriers; Active/Bench/IR carryover support; and the
  immediate-active versus final-hour-scheduled restricted-auction distinction.
  Migrations `0001` through `0030` apply cleanly in the focused canonical
  migration test, but the new behavioral acceptance cases and full regression
  gate have not been run;
- `SqliteFreeAgentDraftJobRepository.js` exists and is syntax-valid, prepares
  against schema 30, and returns an empty due list on a disposable database.
  Its behavior-level foundation test does not yet exist, so the repository must
  not be integrated; and
- the Candidate Card opening writer and its foundation test do not yet exist.
  Discovery is complete. The writer must consume the lifecycle `openAll`
  participants, project deterministic Active/Bench/IR carryovers, reserve
  compatible slots, and preserve conflicts. The approved version-1
  `card_opened` revision must be written atomically with the cards and entries;
  this resolves the earlier bounded-task seam that had excluded revision
  writes.

Resume in this exact order after Grae explicitly says to continue:

1. Inspect both dirty worktrees and reread this checkpoint; preserve every
   unrelated or pre-existing change.
2. Finish only the migration-0030 acceptance package in
   `freeAgentDraftLockedDecisionPackageAmendmentFoundation.test.js`: trigger
   inventory; Active-to-IR-to-Active carryover; behavioral rejection for every
   restored barrier; immediate restricted activation before cutoff; scheduled
   activation at or after cutoff; conditional activation-job evidence; and
   semantic resolution-job versus cancellation/recovery evidence.
3. Run the full locked-amendment and locked-migration suites, then the Candidate
   Card, lifecycle, and Candidate allocation repository suites. Review the
   allocation ranking aggregate and the recovered restricted-cancellation
   blind-draw exception against real fixtures before accepting the gate.
4. Review `SqliteFreeAgentDraftJobRepository.js`, confirm every physical job
   type against the approved occurrence contract, add
   `freeAgentDraftJobRepositoryFoundation.test.js`, and prove all ten bindings,
   no-write discovery, scope rejection, claim/reclaim, exact live lease,
   stale-token/version rejection, retry timing, canonical result, replay, and
   rollback.
5. Implement `SqliteCandidateCardOpeningWriter.js` and its foundation test.
   Re-prove the frozen participants, current accepted managers, and exact FAD
   clock; create deterministic cards, entries, summaries, conflicts, and the
   version-1 `card_opened` revision in the lifecycle transaction; prove exact
   replay and rollback.
6. Run and record the integrated FAD-07 migration/policy/repository gate. Only
   after it is green, reconcile the slice register and current-state documents,
   then resume the unfinished dependency-prior FAD-05 schedule-recovery, job,
   and late-lock work; FAD-08 is not eligible before FAD-05 closes.
7. Continue through the remaining launch-grade slices and integrated local
   verification. Do not enter the isolated FAD-18 staging gate until every
   local, reset, backup, migration, rollback, and acceptance prerequisite in
   this plan passes.

### Resumed FAD-07 Acceptance Audit Amendment - 2026-08-01

The locked `0030` amendment and migration behavior gate now passes `34/34`, and
the complete pre-`0030` plus `0030` migration group passes `95/95` locally. The
Candidate Card opening writer and all ten FAD-07 policy/repository suites also
received an initial integrated green run. No shared database was used.

The final read-only FAD-07 audit keeps this slice open until all of the
following are proved against real repositories and transactions:

- opening independently verifies the exact team-card set, mandatory version-1
  `card_opened` revision, and authoritative carryover-entry coverage;
- opening rejects invalid carried normal and fantasy-ELC contract semantics;
- Candidate add and edit derive player eligibility and position from
  authoritative state, including released or declined prospect rights, rather
  than trusting client-supplied validation fields;
- manager access requires manager authority, while commissioner authority
  requires that exact card's active help grant;
- advisory warning state can be saved without a manager acknowledgement field
  or control; immutable revisions retain diagnostics while the retired legacy
  acknowledgement flag remains exactly zero; and
- the persisted whole-card rule treats either an unresolved carried-roster
  structural conflict or an over-cap projection as exclusion of every new
  offer. Structural conflict is the deterministic exclusion reason when both
  exist, while cap status independently reports the overage.

Conflict-only, over-cap-only, both-illegalities, candidate-only conflict, and
conflict-free incomplete fixtures are mandatory before FAD-07 can close. The
total conflict count must cover every unplaced entry while the carried-roster
subset alone drives whole-card exclusion. After FAD-07 closes, the dependency
map requires resuming the unfinished server-owned FAD-05 schedule-recovery,
job, and late-lock boundary before FAD-08 becomes eligible.

### FAD-07 Closure Record - 2026-08-01

FAD-07 is complete locally. The final independent read-only audit found no P1
or P2 blocker, and the complete amended migration, policy, repository, schema,
and reset-compatibility gate passed `276/276` tests across `33` suites on exact
Node `24.14.1`. A separate post-change schema, reset, and target-runtime safety
gate passed `56/56` tests across `10` suites and retained the exact `98`-endpoint
inventory with no composed FAD route or job. These gates include the automatic
all-team opening writer, authoritative Candidate add/edit validation, help-
gated dual-role authority, normal and fantasy-ELC carryover semantics, separate
total and carried-roster conflict counts, candidate-only individual exclusion,
whole-card structural and cap exclusion, total-first/AAV-second allocation,
exact tie activation, job leasing, lifecycle evidence, and rollback behavior.
They also prove a real Candidate-conflict snapshot's complete blocking-
validation count, exclusion of `row_kind = conflict` from allocation ranking,
nonempty Candidate-conflict synchronization, nonzero published total/carried
counter mapping, and the deferred current-Week-1 and recovery foreign keys
required for atomic schedule recovery.

The closure retains the intentional runtime boundary: no FAD HTTP route or
worker is composed yet, and league-wide deadline locking remains unexposed.
Those are planned work in the dependent lifecycle slices, not FAD-07 defects.
At that checkpoint, FAD-05 became the sole active slice and FAD-08 remained
ineligible until FAD-05 closed. The later FAD-05 closure record below now
satisfies that dependency; FAD-06 is active before FAD-08 begins.

This plan does not authorize:

- a production code, data, schema, configuration, or deployment change;
- a production reset or any staging reset outside the exact isolated
  `FAD-18` fixture procedure;
- a shared-staging migration before the reset, backup, and evidence gates in
  this plan are satisfied;
- staging deployment merely because a partial local gate passes;
- a commit, push, merge, or release without separate instruction;
- Entry Draft implementation;
- Season 2 personalized FAD video implementation;
- unrelated auction, roster, matchup, contract, or interface redesign.

The Season 2 presentation video remains optional and nonblocking. Its provider
integration and generated media remain separate Season 3 readiness work. No
video failure may delay FAD results, auction operation, completion, or Week 1.

## Objective

Implement the approved annual Free Agent Draft as one authoritative,
league-isolated workflow that:

1. runs later-season rollover automatically at the scheduled Entry Draft start
   and blocks drafting and trading until that rollover succeeds;
2. opens every Candidate Card automatically and atomically after Entry Draft
   completion or the approved one-time inaugural exemption when all readiness
   prerequisites pass;
3. derives its initial clock from the explicitly selected Week 1 matchup start
   and uses server-owned whole-Monday recovery when late draft or FAD work would
   otherwise overlap competition;
4. creates private 22-slot Candidate Cards with locked contractual carryovers;
5. supports private manager editing and commissioner help for the final 48
   hours, or the entire remaining preparation period when cards open later;
6. locks and publishes cards at the exact deadline, excluding every new offer
   on a card with an unresolved carried-roster structural conflict or an over-
   cap projection while preserving carryovers and valid entries on a conflict-
   free incomplete, cap-compliant card;
7. allocates each player by highest total contract value, then highest AAV;
8. creates restricted auctions only for exact total-and-term allocation ties,
   treating tied Candidate offers as minimums rather than active bids;
9. requires a current strict improvement to win a restricted auction and opens
   a fresh league-wide fallback auction when no eligible improvement remains;
10. uses the FAD-only auditable equal-chance draw for exact top ties in both
    restricted and open FAD auctions;
11. runs seven initial exact 24-hour rapid-auction rollovers plus every
    contiguous extension required by queued nominations, fallback, or recovery;
12. privately queues final-hour nominations with binding starter bids, closes
    no-bid open auctions unclaimed, and reserves no cap or roster capacity for
    outstanding bids;
13. provides durable recovery, correction, activity, notification, and realtime
    behavior; and
14. completes only after every FAD path is terminal, atomically recovering Week
    1 when required before ordinary weekly auctions begin; and
15. preserves matchup integrity when an illegal team becomes legal late by
    atomically recording immutable player/game exclusion evidence and omitting
    every already-underway NHL game in full.

The backend remains authoritative for timing, permissions, roster and contract
legality, allocation, auction participation, auction results, recovery, and
completion. The frontend renders server-authored state and capabilities.

## Governing Sources

Implementation must conform to the following canonical documents:

```text
docs/01-project/NORTH_STAR.md
docs/01-project/OPERATING_MODE.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/02-rules/SCORING_RULES.md
docs/03-product-specs/FREE_AGENT_DRAFT.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/MATCHUPS.md
docs/04-technical-specs/FREE_AGENT_DRAFT.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/07-testing/RELEASE_CHECKLIST.md
```

When code and an approved document disagree, implementation stops for an
authority check. Code must not silently redefine an approved rule.

## Recorded Planning Baseline

The planning baseline recorded on `2026-07-28` is:

- frontend and canonical documentation repository:
  `E:\hundo-leago`, branch `staging`;
- backend repository: `E:\hundo-leago-backend`, branch `staging`;
- operating mode: `OFFSEASON_RESET`;
- required Node version in both repositories: exact `24.14.1`;
- current backend schema version: `22`;
- immutable existing migration range: `0001` through `0022`;
- backend status at the audit: clean;
- frontend status at the audit: contains the intentional, uncommitted FAD
  documentation set, which must be preserved;
- FAD implementation status: no Candidate Card persistence, FAD routes, FAD
  jobs, FAD frontend, or FAD state machine exists;
- existing `seasons.free_agent_draft_completed_at_ms` is a compatibility
  marker only and must not be treated as implemented FAD history;
- the existing ordinary auction, season, schedule, contract, activity,
  notification, outbox, and scheduler modules are foundations, not evidence
  that the FAD workflow exists.

Every implementation slice must recheck both repository statuses, the migration
ledger, and the exact hashes/application history of reserved migrations `0023`
through `0029`. If another approved change consumes a reserved or next
migration number, or any reserved migration has been committed or applied since
the last check, stop and reconcile this plan before editing schema. Do not
silently renumber or rewrite a migration after it has been committed or applied.

## Approved 2026-07-29 Amendment and Restart Boundary

The amendment replaces the earlier assumptions of commissioner-created FAD
setup, fixed seven-only rollover completion, seeded active restricted bids,
restricted-only draw handling, rejected final-hour nominations, deferred weekly
tie recovery, nonbinding aggregate auction exposure, and a Week 1 clock that
could never move.

The approved replacement requires:

- scheduled Entry Draft-start rollover with a durable blocked-attempt retry
  path;
- automatic all-or-none Candidate Card readiness after Entry Draft completion
  or the approved no-draft path, with no commissioner opening parameters;
- server-owned whole-Monday Week 1 recovery before opening when the draft is
  late and atomically with completion when FAD work overruns;
- adaptive commissioner-help timing and strict whole-card structural/cap
  exclusion;
- restricted minima that cannot win without an eligible current strict
  improvement, followed by a fresh league-wide fallback when none remains;
- the auditable equal-chance draw for exact top ties in both open and
  restricted FAD auctions;
- private final-hour nomination queueing, no-bid return to the unclaimed pool,
  no cap/slot reservation, and binding outcomes even when a team wins more than
  it can immediately roster legally; and
- seven initial rapid boundaries plus as many contiguous FAD extension
  boundaries as terminal processing requires.

`FAD-01` through `FAD-03` remain completed local baseline evidence; they are not
discarded or silently rewritten. Their migration, repository, outbox, and
contract-planner evidence must be revalidated against this amendment before the
next slice can pass.

At amendment approval time, the earliest affected implementation slice was
`FAD-04`. This historical restart and its migration impact audit are complete.
Any pre-amendment `T-037` route, service, migration, or test work was retained
only as audit input. No later FAD slice could begin until the `FAD-04`
lifecycle restart, the migration `0023` through `0029` impact audit, the
amendment acceptance tests, and the integrated `FAD-01` through `FAD-04`
regression gate passed. Those gates are now historical prerequisites; `FAD-10`
through `FAD-17` have also closed locally, and `FAD-18` is the current active
isolated-staging slice.

## Required Pre-FAD Composition

The following target contracts are mandatory implementation prerequisites:

1. `T-035` persists the commissioner-configured creation-time trade deadline.
   `T-036` then atomically activates every setup team plus the initial setup
   league and its sole planned current season only after complete settings,
   manager, and invitation validation. For later seasons, `T-037` prepares the
   transition, executes contract/ownership rollover automatically at the
   persisted Entry Draft start, records exact blockers, exposes only the
   idempotent retry of a blocked scheduled attempt, and prevents the Entry Draft
   and trading from opening until rollover succeeds. `T-037` also owns the
   audited one-time original-league Season 2 no-Entry-Draft exemption.
2. A committed writer and verifier for the one exact succeeded
   `migration_reports` row required by that exemption. JSON or Markdown import
   artifacts are not sufficient evidence.
3. Authoritative rollover of contracts, ownership, retention, buyouts, and
   trade effects before later-season carryovers are materialized.
4. A shared canonical-NHL-season-key `ContractSeasonPlanner`, used by ordinary
   auctions and FAD, with uniqueness on `(league_id, nhl_season_key)`.
5. `T-095`, which accepts the authorized actor's explicit complete
   NHL/playoff calendar plus `firstWeekStartsAtMs`. It atomically persists the
   calendar when the initial/reset-created season has an all-null tuple, or
   requires an exact match for a T-037-created later season, then persists the
   selected schedule. Any NHL-derived date is a recommendation only.
6. `T-096` and the shared schedule-regeneration service, which preserve frozen
   historical FAD timestamps while allowing only the approved server-owned
   whole-Monday recovery: before automatic card opening when a late Entry Draft
   leaves no future deadline/full seven-day period, and atomically with FAD
   completion when remaining FAD work would overlap Week 1.
7. `T-081`, `T-082`, and `T-083` commissioner or inherited member-platform-
   administrator bid removal, auction cancellation, and durable manual
   resolution.
8. Context-aware platform-administrator auction authority with durable actor
   attribution, concurrency, idempotency, and immutable exact-response command
   results for `T-080` through `T-083`.
9. Scoped outbox audiences, a shared atomic league outbox writer, audience-
   aware delivery, and notification deduplication before any private Candidate
   Card route is exposed to a shared environment.

Automatic FAD readiness cannot be composed until lifecycle, rollover,
contract-planning, Week 1 recovery, and private-delivery prerequisites are
composed. A restricted or fallback auction cannot become `Active` until all
required administration and recovery routes are composed and tested.

## Reserved Migration Allocation and Amendment Audit

The following filenames are reserved from the current schema-22 baseline:

```text
0023_add_fad_lifecycle_prerequisites.sql
0024_add_free_agent_draft_candidate_cards.sql
0025_add_free_agent_draft_allocations_rollovers_recoveries.sql
0026_add_fad_auction_contexts_participants_and_draws.sql
0027_add_scoped_outbox_audiences_and_notification_deduplication.sql
```

Their responsibilities are:

| Migration | Responsibility |
| --- | --- |
| `0023` | verified season-key uniqueness, scheduled Entry Draft-start rollover/blocker/retry and exemption evidence, and shared lifecycle/contract-planning prerequisites |
| `0024` | automatic FAD-readiness, participating-team, Candidate Card, slot, entry, revision, adaptive help, whole-card legality, and immutable snapshot storage |
| `0025` | allocation, initial and extension rapid rollovers, private nomination queue, fallback, job occurrence, schedule recovery, correction, quarantine, and completion storage |
| `0026` | ordinary/FAD auction contexts, restricted minimums and participants, fallback contexts, requested-slot links, no-bid outcomes, and open/restricted committed-draw evidence |
| `0027` | scoped league/team/user outbox audiences and nullable notification deduplication keys with the approved partial uniqueness rule |

Two additional prerequisite allocations were reserved during
`FAD-04` after those five files were completed:

```text
0028_add_final_standings_provenance.sql
0029_add_lifecycle_transition_evidence.sql
```

| Migration | Responsibility |
| --- | --- |
| `0028` | immutable canonical standings-finalization and result-correction provenance required by T-037 |
| `0029` | scheduled T-037 attempt/blocker/retry evidence, idempotency back-links and guards, immutable source-readiness IDs/projection/hash, released-ownership-safe auction/FAD history links, complete rollover-effect manifest/hash/event linkage, immutable target response/calendar evidence, exemption report/bootstrap hashes, and linked audit/activity/notification/outbox evidence |

Before any `FAD-04` implementation resumes, perform and record a read-only
impact audit of all seven local migration files:

| Migration | Mandatory amendment impact question |
| --- | --- |
| `0023` | Can one scheduled Entry Draft-start transition persist preparation, due occurrence, blockers, exact retry identity, draft/trading gates, and successful rollover without a general manual execution path? |
| `0024` | Can one all-or-none readiness operation create every card together, record exact blockers/retry, support adaptive help, and persist strict whole-card structural/cap legality without a commissioner setup aggregate? |
| `0025` | Can the model represent contiguous rollover extensions, private queued nominations, restricted fallback, no-bid outcomes, and atomic pre-open/completion Week 1 recovery plus future-job replacement? |
| `0026` | Are Candidate offers stored as restricted minimums rather than active bids, are fallback contexts explicit, and can one FAD-only exact-top draw serve both restricted and open FAD auctions? |
| `0027` | Can queued-nomination privacy, readiness/blocker notices, fallback events, schedule recovery, and recipient deduplication use scoped metadata-only delivery? |
| `0028` | Does scheduled rollover consume canonical final-standings provenance without creating, repairing, or rewriting it when a later schedule is regenerated? |
| `0029` | Does lifecycle evidence bind scheduled execution, durable blocker/retry history, exact source/target state, and the complete rollover manifest under replay and crash recovery? |

The audit must:

1. inventory each migration's tables, columns, checks, indexes, triggers,
   backfills, repository-catalog entries, schema constants, fixtures, and tests;
2. map every approved amendment acceptance case to an owning migration or
   explicitly record `no schema change`;
3. verify from the migration ledger and environment evidence whether any file
   in `0023` through `0029` has been applied outside an explicitly disposable
   local database;
4. record a per-file disposition: unchanged, revised before first shared
   application, or superseded by a newly allocated corrective migration;
5. rerun fresh-schema and `22 -> latest` upgrade, integrity, foreign-key,
   deterministic fixture, reset, backup/restore, and repository-catalog proof;
6. stop and amend this plan before allocating a corrective migration if any
   durable/shared application is discovered; an applied migration must never be
   edited in place.

At this checkpoint, all seven files exist only as uncommitted local work and no
shared-staging or production application is recorded. That fact must be
reverified at the start of the audit. The word `immutable` applies only after
the amended migration set has passed this audit and its exact hashes are
recorded.

### Recorded 2026-07-29 Migration Impact Audit and Corrective Allocation

The read-only `FAD-04R` audit reverified that migrations `0023` through `0029`
are all untracked local files on the backend `staging` worktree, none is present
in the tracked branch history, the recorded shared schema ledger remains at
`0022`, and no shared-staging or production application is recorded. The
audited pre-amendment hashes are:

| Migration | Bytes | Audited local SHA-256 |
| --- | ---: | --- |
| `0023` | 11,207 | `18D13850EA972784E2CFFC63BA47BD8559C180C35B28DEE18FDCF850B01DB6F2` |
| `0024` | 98,762 | `906C4F13C85E52B1DD0FBA9BD5466CE859E1F4C10A2CC5701E00C4A1FB8AD96B` |
| `0025` | 219,874 | `58757C41B08110758B18EF71E1E51A8D4F60B922F42647EBDB8F8FA7F3B2D802` |
| `0026` | 234,905 | `012EA6A5A50EA2DE8BE622DE3C232AAE9484FDCEE455469705C8F8C4EF1A345B` |
| `0027` | 3,959 | `C8171F1FB530A83A52A11301D1BCF549337234241E8B58FF6CE9F625AFC2CC28` |
| `0028` | 102,076 | `C4587236B7AC2E567850488FA3196D12BC3C3C331A90A6D925C3639077814C93` |
| `0029` | 535,587 | `ECCDBD2D14B4A73FCCF0929591AD373E47B0E44D17840DBB1141CB0AC7A70141` |

The audited dispositions are:

| Migration | Disposition | Audit result |
| --- | --- | --- |
| `0023` | superseded by `0030` before first shared application | The current schema supports a commissioner-owned general rollover, not one persisted scheduled Entry Draft-start attempt with blocker history, same-occurrence retry, target/draft binding, and atomic draft/trading gates. |
| `0024` | superseded by `0030` before first shared application | The current schema models commissioner opening, a fixed help window and per-entry acknowledgement; it does not model automatic all-team readiness, adaptive help, authoritative carryover moves, or whole-card structural/cap eligibility and exclusion. |
| `0025` | superseded by `0030` before first shared application | The current schema fixes exactly seven rollovers and deferred weekly recovery; it lacks extension cycles, the private final-hour queue, fresh restricted fallback, no-bid return, and atomic Week 1 schedule recovery. |
| `0026` | superseded by `0030` before first shared application | The current schema turns Candidate minima into seeded bids with an edit/cooldown and restricts committed draws to restricted auctions; it lacks strict-improvement opening semantics, explicit fallback provenance, and terminal commitment/reveal evidence for every FAD auction. |
| `0027` | unchanged DDL; retained and extended by runtime acceptance tests | Its scoped audience and nullable deduplication primitives remain valid. Queue privacy, metadata-only payloads, canonical keys, recipient snapshots and retries belong to the shared writer/FAD producer tests; the protected-table inventory must include the queue. |
| `0028` | later amended before first shared application | Its immutable final-standings provenance remains canonical. The later FAD-08 recovery audit isolates the schema-28 one-root rule in a named trigger so corrected migration `0030` can replace it only after schedule-generation lineage exists. |
| `0029` | superseded by `0030` before first shared application | The current lifecycle evidence and FAD completion barrier preserve the manual execution and fixed-seven assumptions and omit durable scheduled attempts, queue/extensions/fallback/draw terminal proof, schedule recovery, and atomic draft/trading activation. |

The pre-correction focused migration baseline passed `58/60` tests. The two
failures are test-harness defects that must be corrected as part of this audit:
the `0028` upgrade helper accidentally includes later migration `0029` while
asserting schema version `28`, and the `0029` foreign-key expectation omits the
second composite reference from `season_rollover_ownership_effects` to
`player_ownerships`. They are not accepted as waivers and the complete amended
gate must pass.

This plan now allocates:

```text
0030_apply_locked_fad_decision_package.sql
```

Migration `0030` is the single pre-staging corrective boundary for the approved
decision package. It must:

- refuse to run if any pre-amendment FAD or lifecycle-transition business row
  exists, while preserving ordinary-auction and unrelated historical data;
- transactionally replace or extend the empty local-only FAD/lifecycle
  structures with the canonical readiness, Candidate Card, allocation,
  rollover-extension, private queue, fallback, all-FAD draw, schedule-recovery,
  scheduled-rollover, blocker/retry, Entry Draft/trading-gate, completion, and
  late-snapshot game-exclusion evidence plus immutable auction-administration
  command results;
- update the repository catalog, schema constants, fixtures, backup/restore,
  reset, upgrade and deployment verification surfaces to version `30`; and
- apply in the same controlled migration batch as `0023` through `0029`.

### Recorded 2026-07-30 FAD-05 Schedule/Schema Impact Audit

The read-only FAD-05 audit of the matchup schedule policy, application service,
repository, router, occurrence-job stack, late-lock/scoring path, foundation
tests, and local migration `0030` is complete. No code or migration was changed
by that audit. It found the following corrections that remain part of the
single `0030` pre-staging boundary:

- validate whole league-local Mondays in Node using the persisted IANA timezone
  and remove every SQL assumption that their elapsed difference is divisible by
  `604800000`;
- preserve immutable recovery children for both removed weeks and removed
  matchups;
- bind every dependent matchup job durably to its exact schedule generation,
  including generation identity in stale/current execution checks;
- distinguish actual old/new job replacements from cancellation-only evidence
  for unexecuted removed-week jobs, and permit a replacement to retain the same
  scheduled instant;
- persist immutable T-095/T-096 schedule-command results linked to the exact
  idempotency request/hash so replay never reconstructs history from a later
  generation;
- persist the authoritative NHL provider/source observation snapshot used for
  late-lock legality;
- seal each late-lock exclusion root with the exact child count and digest so
  no exclusion can be appended after the atomic transaction; and
- define and verify the versioned `canonical-json-v1` SHA-256 preimages for
  schedule recovery, NHL game observations, and late-lock exclusions.

These corrections do not alter any approved product outcome or public response.
In particular, T-141 remains exact: `replacedJobs[]` contains only real old/new
pairs, while cancellation-only evidence remains internal durable state.
Migration `0030` must be corrected and its fixed-vector, upgrade, integrity,
backup/restore, and rollback gates must pass before any shared-staging
application.

### Recorded 2026-07-30 T-095 Local Completion Checkpoint

The explicit-calendar preview and confirmed matchup-schedule command are
complete locally. `T-095` now:

- requires the exact four NHL/playoff calendar instants, explicit
  `firstWeekStartsAtMs`, and six-field confirmation body;
- keeps preview read-only and requires neither `If-Match` nor
  `Idempotency-Key`;
- applies confirmed generation inside one immediate transaction with season
  compare-and-swap, all-null or exact-equal calendar handling, one season
  version increment, balanced weeks/pairings/byes, generation one, six
  dependent occurrences per week, and one binding per occurrence;
- stores the immutable scalar `201` response and exact request hash, completes
  idempotency last, and replays without reading mutable schedule context,
  sampling the clock, or allocating identifiers;
- stores inherited member-platform-administrator authority as
  `platform_administrator_as_commissioner`; and
- fails closed on invalid input, authority, league/season scope, conflict,
  stale precondition, incomplete replay state, mismapped replay evidence, and
  every injected transaction seam.

The exact pinned-Node gate passed `94/94` tests across `14` suites. It includes
fixed canonical request/response SHA-256 vectors, real confirmed HTTP
`201/400/403/404/409/412` cases, all-null and exact-equal calendar persistence,
alternate Week 1 selection, complete job-binding reconciliation, runtime
composition, migration `0030`, architecture, and rollback coverage. Scoped
syntax and diff checks passed, and the legacy `persistSchedule` writer and
deprecated confirmation path are absent.

The cross-step proof that the original `T-095` response still replays after a
genuine later schedule generation remains an explicit `T-096` acceptance case.
The surviving generic matchup-job writer must also become generation-aware in
the later FAD-05 job-execution slice before staging. No shared database,
commit, push, or deployment was reached.

### Recorded 2026-07-30 FAD-06 Auction Replay Impact Audit

The read-only FAD-06 audit found that `T-080` through `T-083` cannot satisfy
the shared exact-idempotency contract by re-reading a later mutable auction,
bid, or resolution job. The single pre-staging `0030` correction therefore
adds `auction_administration_command_results` with:

- exactly one immutable version-1 row per successful administration
  idempotency request;
- action `edit_bid`, `remove_bid`, `cancel_auction`, or
  `request_resolution`;
- exact actor user, active membership, and actual commissioner or inherited
  member-platform-administrator authority;
- exact request hash, bid-or-auction precondition,
  `expected_resource_version`, `resulting_resource_version`, original HTTP
  status, canonical response `data`, and lowercase response SHA-256;
- exact idempotency operations `edit_bid` = `auction.bid.put`, `remove_bid` =
  `auction.bid.remove`, `cancel_auction` = `auction.cancel`, and
  `request_resolution` = `auction.resolve.request`;
- nullable `job_run_id`, required only for `request_resolution` and otherwise
  null, bound to the exact `auction.resolve.target` occurrence
  `auction:<auctionId>:<resolvesAtMs>` whose durable job supplies response
  `operationId` and `occurrenceKey`; and
- immutable update/delete and completed-idempotency back-link guards.

Fresh success commits command effects, result evidence, and idempotency
completion atomically. Exact replay returns the stored status and
representation even after later auction or job changes. Within league
isolation, replay is scoped by exact operation, actor user, and client key and
must select the completed request's immutable result. Any unsuccessful fresh
request writes neither a new idempotency row nor a result row.

The stored version relationship is exact: edit and removal result in
`expected + 1`; cancellation results in a version greater than expected so its
atomic internal progression is preserved; resolution request leaves the
auction version unchanged. Replay preserves that expected/resulting evidence
and the stored representation instead of substituting current state.

The final migration-0030 inventory for this exact local launch candidate is
schema version `30`: `124` application tables, `125` tables including
`schema_migrations`, and `124` matching repository-catalog entries.
Reset/import/release verification reconciles `42` post-reset require-empty
tables, `82` tables classified by the signed reset policy, and `60` installed
`BEFORE DELETE` guards. The signed and post-reset policies classify every one
of the `124` application tables exactly once.

The final frozen local migration set is:

| Migration | Bytes | Final local SHA-256 |
| --- | ---: | --- |
| `0023` | 11,207 | `18d13850ea972784e2cffc63ba47bd8559c180c35b28dee18fdcf850b01db6f2` |
| `0024` | 98,741 | `38dda0b2785c0247ca9fb87a57cd93dbf741fa118bf49f211bf04b6cfe2fd2b7` |
| `0025` | 219,874 | `58757c41b08110758b18ef71e1e51a8d4f60b922f42647ebdb8f8fa7f3b2d802` |
| `0026` | 234,905 | `012ea6a5a50ea2de8be622de3c232aae9484fdcee455469705c8f8c4ef1a345b` |
| `0027` | 3,959 | `c8171f1fb530a83a52a11301d1bcf549337234241e8b58ff6ce9f625afc2cc28` |
| `0028` | 102,560 | `4307b151beb2a2c29968f257400b716424906ddf5ab2d102e8f37cc5e8074d4e` |
| `0029` | 535,587 | `eccdbd2d14b4a73fccf0929591ad373e47b0e44d17840dbb1141cb0ac7a70141` |
| `0030` | 636,077 | `6f46b7a8c52108adfc0b51dc1eb9cdcab0ed274482ca396a31f7d45e42c07184` |

These hashes freeze only the recorded uncommitted local review set. Any byte
change to `0023` through `0030` invalidates this freeze and requires the full
inventory, checksum, fresh-schema, upgrade, reset, and integrity package to be
rerun before staging. The FAD-18 release gate must still recompute and match the
exact deployed files rather than copying this table blindly.

Exact Node `24.14.1` final-freeze evidence applied canonical migrations `0001`
through `0030` to a new disposable database and independently observed
`user_version = 30`, `application_metadata.data_model_version = 30`, `30`
exact migration-ledger rows, `integrity_check = ok`, and zero foreign-key
violations. The fresh `1 -> 30` schema/checksum/integrity suite passed `8/8`,
the explicit `22 -> 30` upgrade/integrity suite passed `6/6`, the complete
locked-amendment schema suite passed `45/45`, and the repository-catalog,
signed-reset-policy, and fixture-reset trigger package passed `32/32`. The
schema-30 cutover/rollback rehearsal passed `5/5`. The
fresh-schema test now freezes the exact filename, byte length, and checksum for
every migration from `0023` through `0030`, plus the application-table,
including-`schema_migrations`, and delete-guard counts; the existing repository
and reset tests freeze the catalog and reset-policy counts.
Every database used for this evidence was disposable and removed afterward;
no shared database, staging migration, commit, push, or deployment occurred.

### Recorded 2026-07-30 Migration-0030 Candidate/Fallback Amendment

The post-T-096 impact audit found two migration-trigger seams where the local
schema did not yet enforce the already-approved Candidate allocation rules:

- restricted tie-auction participant creation accepted only `valid` Candidate
  offers even though `warning` offers remain eligible to compete and can tie;
  and
- a fresh no-improvement fallback bid was checked against its Candidate floor
  on insert, but a later permitted bid edit was not checked against that same
  floor using the edited contract's current rounded AAV.

The subsequent FAD-06 replay audit found one additional evidence seam:
`auction_administration_command_results` stored the expected resource version
but not the contract-required `precondition_kind`. Migration `0030` now stores
`bid` for edit/removal and `auction` for cancellation/resolution requests, and
its table constraint rejects every action/kind mismatch. The then-local-only
T-080 adapter wrote and verified the literal `bid` value. `FAD-06` has since
replaced it locally with the canonical administration service; the adapter
never reached a shared environment.

Migration `0030` now admits both `valid` and `warning` snapshot offers when
their allocation eligibility is `eligible`, and every active fallback bid edit
must remain above the Candidate total floor or meet the Candidate rounded-AAV
floor at equal total. It does not use the historical lowest-offered AAV for
this check. No migration from `0023` through `0029` changed.

The exact Node `24.14.1` amendment, migration, and legacy-auction-adapter gate
passes `34/34` tests across five suites. The schema identity, reset-manifest, fresh-schema, and
cutover-rehearsal gate passes `27/27` tests across four suites. FAD-07/FAD-11
must add behavior-level acceptance for warning-offer exact ties and rejection
of a fallback edit below its Candidate floor before a FAD auction can be
enabled. No shared database, commit, push, or deployment was reached.

Migrations `0023` through `0029` remain forward-only, transactional local
baseline input. They are not independently authoritative and must never be
applied piecemeal to shared staging. Migration `0030` may transactionally
rebuild only guarded, empty, pre-amendment FAD/lifecycle structures because no
shared application exists; any discovery of durable rows or application
evidence stops the migration and requires a new reconciliation rather than
destructive conversion.

Migration implementation must:

- update `application_metadata.data_model_version`;
- update `src/infrastructure/persistence/sqlite/repositoryCatalog.js`;
- update every hard-coded schema assertion and fresh-schema, upgrade,
  staging-import, cutover, fixture, release-QA, and runtime verifier;
- preserve existing rows and same-league constraints;
- give every existing auction exactly one `ordinary_weekly` context;
- give every existing league-scoped realtime outbox row exactly one league
  audience;
- leave global, account, security, and email events audience-free;
- leave existing notification deduplication keys null;
- never create a FAD, Candidate Card, exemption, lifecycle transition, job,
  activity item, or notification;
- never infer FAD history from the legacy season completion timestamp;
- never convert Candidate Card restricted minimums into active auction bids;

The FAD-04 regression adapter for the already-existing ordinary commissioner
bid-edit path was local compatibility evidence only. Migration `0030` required
that such an edit link one immutable result instead of failing its new
idempotency guards, so the adapter preserved the blind legacy response and
exact replay while that slice remained disposable. `FAD-06` replaced that
representation locally with the approved safe auction-detail DTO, exact
preconditions, inherited member-platform-administrator authority, and the
complete ordinary-context `T-080` through `T-083` boundary. The legacy adapter
never reached a shared environment.
- never synthesize nomination-queue, extension-rollover, fallback, draw, or
  schedule-recovery history for existing data;
- make every amendment-owned state explicit rather than encoding it in
  free-form metadata; and
- pass foreign-key and integrity checks.

On a shared environment, the context/audience backfills, retrofit writers, and
audience-enforcing publisher must deploy inside one quiesced write boundary so
old writers cannot create incompatible rows between migration and runtime
activation.

## Expected Affected Areas

The exact file list must be narrowed and reported before each slice. Planned
areas include:

Backend:

```text
database/migrations/0023_add_fad_lifecycle_prerequisites.sql
database/migrations/0024_add_free_agent_draft_candidate_cards.sql
database/migrations/0025_add_free_agent_draft_allocations_rollovers_recoveries.sql
database/migrations/0026_add_fad_auction_contexts_participants_and_draws.sql
database/migrations/0027_add_scoped_outbox_audiences_and_notification_deduplication.sql
database/migrations/0028_add_final_standings_provenance.sql
database/migrations/0029_add_lifecycle_transition_evidence.sql
src/domain/freeAgentDraft/
src/application/services/freeAgentDraft/
src/infrastructure/persistence/sqlite/SqliteFreeAgentDraftRepository.js
src/infrastructure/persistence/sqlite/SqliteCandidateCardRepository.js
src/infrastructure/persistence/sqlite/SqliteFreeAgentDraftJobRepository.js
src/jobs/definitions/*FreeAgentDraft*.js
src/transport/http/createFreeAgentDraftRouter.js
src/bootstrap/createTargetRuntime.js
src/infrastructure/persistence/sqlite/repositoryCatalog.js
src/domain/auctions/
src/application/services/auctions/
src/infrastructure/persistence/sqlite/SqliteAuction*.js
src/application/services/matchups/
src/domain/contracts/
test/foundation/
test/characterization/
scripts/
```

Frontend:

```text
src/features/freeAgentDraft/
src/app/router.jsx
src/app/routePaths.js
src/App.jsx
src/components/TopBar.jsx
src/components/NotificationBell.jsx
src/features/transactions/TransactionInvalidationProvider.jsx
src/features/rosters/TeamRosterPage.jsx
src/features/competition/CompetitionPages.jsx
src/features/notifications/NotificationsPage.jsx
corresponding focused test files
```

Canonical documentation and evidence:

```text
docs/01-project/CURRENT_STATE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/07-testing/RELEASE_CHECKLIST.md
docs/07-testing/release-runs/
```

The dormant legacy `src/pages/FreeAgentsPage.jsx` must not become an
authoritative client-side FAD calculator. It may be removed, redirected, or
left untouched only through an explicitly reviewed frontend slice.

## Execution Protocol

For every implementation slice:

1. confirm the slice has been explicitly activated;
2. read the current work plan and the governing spec sections;
3. inspect both repository statuses and preserve unrelated changes;
4. state every exact file path intended to change and the exact purpose;
5. make only the current slice's change;
6. use injected clocks and explicit disposable databases where applicable;
7. run the narrowest meaningful focused verification;
8. run the slice's regression gate;
9. inspect both repository statuses after the change;
10. report files, behavior, preserved behavior, commands, results, omitted
    tests, risks, and the next eligible slice;
11. stop without starting the next slice.

No read route may repair, initialize, normalize, or otherwise mutate league
state. Preview routes must be proved read-only. No route may be exposed before
its downstream failure and recovery behavior exists.

## Dependency Map

```text
FAD-01 -> FAD-02, FAD-03, FAD-07
FAD-01 + FAD-02 + FAD-03 -> FAD-04R amendment/migration impact audit
FAD-04R -> FAD-04 restarted lifecycle implementation
FAD-02 + FAD-04 + FAD-05 + FAD-07 -> FAD-08
FAD-08 -> FAD-09 -> FAD-10 -> FAD-11 -> FAD-12 -> FAD-13 -> FAD-14
FAD-06 -> FAD-11, FAD-12, FAD-13
FAD-14 -> FAD-15 -> FAD-16 -> FAD-17
FAD-17 + approved reset/evidence boundary -> FAD-18
```

Independent prerequisites may be implemented in either order only after the
current slice has stopped and the next slice has been explicitly activated.

## Slice Register

| Slice | Work item | Status |
| --- | --- | --- |
| `FAD-00` | planning baseline and dependency freeze | `COMPLETE - DOCS ONLY (2026-07-28)` |
| `FAD-01` | schema 23-27 and repository foundation | `COMPLETE - LOCAL; AMENDMENT REVALIDATED (2026-07-30)` |
| `FAD-02` | scoped outbox and notification reliability | `COMPLETE - LOCAL; AMENDMENT REVALIDATED (2026-07-30)` |
| `FAD-03` | shared ContractSeasonPlanner | `COMPLETE - LOCAL; AMENDMENT REVALIDATED (2026-07-30)` |
| `FAD-04` | reset evidence, T-036 activation, and scheduled T-037 rollover | `COMPLETE - LOCAL; AMENDMENT REVALIDATED (2026-07-30)` |
| `FAD-05` | explicit Week 1 selection and server-owned schedule recovery | `COMPLETE - LOCAL; FULL RECOVERY/JOB/LATE-LOCK AND MIGRATION FREEZE GATES (2026-08-01)` |
| `FAD-06` | auction contexts, reads, and T-081-T-083 | `COMPLETE - LOCAL ONLY (2026-08-02); FAD-LINKED CASES DEFERRED TO FAD-11` |
| `FAD-07` | pure FAD domain and repositories | `COMPLETE - LOCAL; FINAL 276/276 GATE AND INDEPENDENT AUDIT (2026-08-01)` |
| `FAD-08` | automatic readiness, navigation, and carryovers | `COMPLETE - LOCAL ONLY; FINAL 336/336 BEHAVIOR AND 64/64 SCHEMA GATES (2026-08-08)` |
| `FAD-09` | Candidate Card editing, help, and synchronization | `COMPLETE - LOCAL ONLY; 60/60 PROVIDER, 262/262 WRITER, 36/36 DIRECT HTTP, AND 66/66 RUNTIME GATES (2026-08-08)` |
| `FAD-10` | deadline, whole-card legality, publication, and allocation | `COMPLETE - LOCAL ONLY; 200/200 CLOSURE MATRIX, 4/4 RUNTIME, 18/18 COORDINATOR, 103/103 AUCTION REGRESSION, AND 7/7 REMINDER GATES (2026-08-09)` |
| `FAD-11` | recovery, correction, and FAD auction administration | `COMPLETE - LOCAL ONLY; SCHEMA 40 AND CLOSURE AUDIT (2026-08-10)` |
| `FAD-12` | restricted improvement, fallback, and exact-top draw | `COMPLETE - LOCAL ONLY; SCHEMA 43 AND COMPOSED RESOLUTION/ACTIVATION GATES (2026-08-10)` |
| `FAD-13` | open/queued rapid auctions, extension scheduler, and completion recovery | `COMPLETE - LOCAL ONLY; SCHEMA 47 AND RAPID/ROLLOVER/COMPLETION GATES (2026-08-10)` |
| `FAD-14` | activity, notifications, and realtime privacy | `COMPLETE - LOCAL ONLY; SCHEMA 49 AND PRIVACY/PUBLICATION GATES (2026-08-11)` |
| `FAD-15` | frontend Candidate Card preparation workflow | `COMPLETE - LOCAL ONLY (2026-08-11)` |
| `FAD-16` | frontend results, auctions, recovery, and notifications | `COMPLETE - LOCAL ONLY (2026-08-11)` |
| `FAD-17` | integrated local launch-candidate proof | `COMPLETE - LOCAL ONLY (2026-08-11)` |
| `FAD-18` | authorized isolated shared-staging gate after reset | `ACTIVE; DEPLOYMENT BLOCKED BY NAMED EXTERNAL PREREQUISITES` |

`FAD-01` through `FAD-14` are complete locally. `FAD-07` closed after its final
`276/276` acceptance gate and independent audit. `FAD-06` closed after its
`161/161` auction-family gate across `22` suites in `17` files, post-gate
`10/10` administration check, and full-migration composed GET proof. The one
terminal player-source P2 raised during independent review was corrected; no
P1/P2 issue remains. Its FAD-linked stop condition remained in force until
FAD-11 closed. FAD-08 closed after its `336/336` behavior and `64/64` schema gates.
FAD-09 closed after its provider, summer-writer, direct HTTP, composed-runtime,
local staging-verifier, and reset-bootstrap gates. FAD-10 closed after its
deadline, publication, allocation, coordinator, runtime, shared-auction, and
reminder gates. FAD-11 closed after its recovery, correction, FAD-linked auction
administration, shared restricted no-improvement fallback, schema-40, and
integrated closure gates. FAD-12 closed after its restricted/fallback bidding,
draw, resolution, recovery, activation, schema-43, runtime, and ordinary-
compatibility gates. FAD-13 closed after its direct/queued start, activation,
resolution, rollover, completion, schema-47, runtime, and matchup-start gates.
FAD-14 closed after its Activity/notification registries, exact metadata-only
publication and audience-privacy gates, schema-48 realtime evidence, schema-49
setup-exemption reconciliation, and full regression proof. FAD-15 and FAD-16
closed after the complete frontend feature, privacy, realtime, accessibility,
test, lint, build, dependency, and browser-authority gates. FAD-17 closed after
the exact migration, two-league, backend acceptance, frontend coverage, and
five-project browser gates. `FAD-18` is the sole active isolated-staging slice.

## FAD-00 - Planning Baseline and Dependency Freeze

### Result

This documentation step:

- records the approved product and technical authority;
- reserves migrations `0023` through `0027`;
- identifies the missing lifecycle, schedule, auction, privacy, and recovery
  prerequisites;
- defines the dependency-ordered implementation slices;
- preserves the completed M7-24 plan in the archive;
- changes no application code, data, schema, job, environment, or deployment.

### Verification

Verify documentation links, work-plan status references, exact archive
preservation, whitespace, and both repository statuses. No application suite
is required because this slice changes documentation only.

## FAD-01 - Schema 23-27 and Repository Foundation

### Change

Implement the five reserved additive migrations and their persistence
catalog/fixture assertions against explicit disposable databases only.

Work one migration at a time in filename order and stop for review after each
substep. Migration tests must cover fresh installation and the then-current
upgrade path. The slice is not complete until the complete `22 -> 27` path
passes as one sequence.

### Substep Record - FAD-01.1

`COMPLETE - LOCAL ONLY (2026-07-28)`

Migration `0023_add_fad_lifecycle_prerequisites.sql`:

- advances disposable local databases from schema `22` to `23`;
- enforces one NHL season key per league;
- adds immutable succeeded season-rollover evidence;
- adds one-time initial-Season-2 FAD setup exemption evidence whose
  authorization fields are immutable and whose only permitted update is one
  correctly timed consumption transition;
- registers both tables in the repository catalog;
- preserves the signed version-1 reset manifest byte-for-byte and classifies
  the two schema-23 tables separately as required-empty during local reset
  simulations;
- creates no rollover, exemption, FAD, Candidate Card, activity,
  notification, or other domain row.

Recorded local verification under exact Node `24.14.1`:

- focused migration coverage passes `4/4`;
- combined migration, schema, repository, and reset coverage passes `28/28`;
- the complete backend suite passes `991/991` across `235` suites with no
  failures, cancellations, skips, or todos;
- `npm run check` passes;
- an explicit disposable database applies exactly `23` migrations, reports
  schema `23`, passes integrity and foreign-key checks, and contains zero
  rollover or exemption rows;
- whitespace validation passes and the signed reset manifest has no diff.

No migration was applied to shared staging or production. No custom FAD
repository, lifecycle writer, route, job, FAD, or Candidate Card behavior was
added. At the `FAD-01.1` stop, substep `FAD-01.2` and migration `0024` remained
unstarted.

### Substep Record - FAD-01.2

`COMPLETE - LOCAL ONLY (2026-07-28)`

Migration `0024_add_free_agent_draft_candidate_cards.sql`:

- advances disposable local databases from schema `23` to `24`;
- adds annual FAD roots and immutable participating-team commitments;
- adds versioned Candidate Cards, immutable revisions, current carryover and
  selectable-candidate entries, and the manager-requested commissioner-help
  grant;
- adds immutable deadline card and 22-slot entry snapshots without fabricating
  historical FAD state;
- derives the Candidate deadline from the persisted Week 1 start and enforces
  the exact 48-hour help window;
- enforces completed-Entry-Draft, inaugural, and one-time initial-Season-2
  setup evidence without allowing the reset-created original league to bypass
  its exemption;
- enforces locked carryover evidence, selectable contract totals and rounded
  AAV, Bench limits, actor scope, candidate conflicts, validation
  acknowledgements, and pre-deadline manager writes;
- permits controlled system reconciliation at the deadline while manager and
  help-authorized writes remain closed;
- requires contiguous immutable revisions, exact participant/card coverage,
  authoritative cap and blocking-validation summaries, and complete immutable
  snapshots before deadline publication;
- registers all eight new tables in the repository catalog and reset policy;
- updates fresh-schema, upgrade, staging-import, cutover, fixture, release-QA,
  and runtime schema assertions to schema `24`.

Verification:

- focused migration coverage passes `6/6`;
- combined migration, schema, repository, reset, import, and runtime coverage
  passes `107/107` across `18` suites;
- the complete backend suite passes `997/997` across `236` suites with no
  failures, cancellations, skips, or todos;
- `npm run check` passes;
- disposable fresh and populated-upgrade proofs apply exactly `24` migrations,
  report schema and data-model version `24`, preserve existing rows, pass
  integrity and foreign-key checks, and leave all eight new FAD/Candidate Card
  tables empty;
- whitespace validation passes and the signed reset manifest has no diff.

No migration was applied to shared staging or production. No FAD repository,
lifecycle writer, route, job, live FAD, Candidate Card, activity, notification,
or historical row was created. At the `FAD-01.2` stop, substep `FAD-01.3` and
migration `0025` remained unstarted.

### Substep Record - FAD-01.3

`COMPLETE - LOCAL ONLY (2026-07-28)`

Migration `0025_add_free_agent_draft_allocations_rollovers_recoveries.sql`:

- advances disposable local databases from schema `24` to `25`;
- adds deterministic per-player allocation aggregates and immutable ranked
  offer/result events;
- adds seven exact rapid-rollover rows and explicit durable recovery evidence;
- enforces total-value-first, AAV-second ranking and exact-tie restricted paths;
- requires complete automatic-award contract, ownership, and contract-year
  evidence without inventing a winner;
- preserves failed, cancelled, deferred, and correction-required work as
  quarantined explicit recovery instead of releasing a player silently;
- requires canonical deadline, allocation, rollover, recovery, and completion
  job occurrence evidence, including exact causal errors, leases, and
  chronology;
- atomically completes the FAD and matching season marker without moving Week
  1, including the zero-Candidate path;
- registers all four new tables in the repository catalog and reset policy;
- updates fresh-schema, upgrade, staging-import, cutover, fixture, release-QA,
  and runtime schema assertions to schema `25`.

Verification under exact Node `24.14.1`:

- focused migration coverage passes `20/20`;
- combined migration, schema, repository, reset, import, and runtime coverage
  passes `150/150` across `25` suites;
- the complete backend suite passes `1017/1017` across `237` suites with no
  failures, cancellations, skips, or todos;
- `node --check server.js` passes;
- disposable fresh and populated `24 -> 25` proofs report schema and data-model
  version `25`, preserve existing rows, and pass integrity and foreign-key
  checks;
- whitespace validation passes;
- an independent completion/recovery audit found no remaining launch blocker.

No migration was applied to shared staging or production. No live FAD,
Candidate Card, allocation, rollover, recovery, contract, ownership, job,
activity, notification, or historical row was created. Substep `FAD-01.4` and
migration `0026` are now active.

### Substep Record - FAD-01.4

`COMPLETE - LOCAL ONLY (2026-07-28)`

Migration `0026_add_fad_auction_contexts_participants_and_draws.sql`:

- advances disposable local databases from schema `25` to `26`;
- adds immutable ordinary, open-rapid, and restricted auction contexts with an
  exact conservative backfill for existing ordinary auctions;
- adds the pre-amendment restricted-auction participants, Candidate seed
  provenance, one-edit/removal evidence, and restricted-only committed draw
  that `FAD-04R` must replace before staging;
- enforces same-league context, exact activation timing, genuine bid
  eligibility, winner-first terminalization, anti-bluff pricing, Candidate
  total floors, contract/ownership provenance, and resolver-job evidence;
- records operational resolution failure without fabricating a semantic result
  and preserves deterministic restricted retry;
- requires a failed open-rapid recovery to write its exact recovered
  cancellation before the recovery and job can finish;
- permits a cancelled restricted T-082 recovery to resolve later only after an
  indexed commissioner allocation correction and its exact immutable event;
- registers all three new tables in the repository catalog and reset policy;
- updates fresh-schema, upgrade, staging-import, cutover, fixture, release-QA,
  and runtime schema assertions to schema `26`;
- makes ordinary auction creation write its context atomically; and
- preserves schema immutability during the separately authorized, staging-only
  fixture reset by restoring and verifying the exact protected trigger set.

Verification under exact Node `24.14.1`:

- focused migration coverage passes `11/11`;
- combined migrations `0023` through `0026` pass `41/41`;
- the complete backend suite passes `1028/1028` across `238` suites with no
  failures, cancellations, skips, or todos;
- `node --check server.js` passes;
- fresh and populated `25 -> 26` proofs preserve existing rows and pass
  integrity and foreign-key checks;
- repository whitespace validation passes;
- migration SHA-256 is
  `012EA6A5A50EA2DE8BE622DE3C232AAE9484FDCEE455469705C8F8C4EF1A345B`; and
- an independent adversarial audit found no remaining core blocker.

No migration was applied to shared staging or production. No live FAD,
Candidate Card, allocation, rollover, recovery, contract, ownership, job,
activity, notification, or historical row was created. Substep `FAD-01.5` and
migration `0027` are now active.

### Substep Record - FAD-01.5

`COMPLETE - LOCAL ONLY (2026-07-28)`

Migration
`0027_add_scoped_outbox_audiences_and_notification_deduplication.sql`:

- advances disposable local databases from schema `26` to `27`;
- adds strict league, team, and user outbox audiences with exact target
  cardinality and same-league foreign keys;
- requires an active exact same-league membership when a user audience is
  inserted or identity-updated;
- deterministically backfills one league audience for every existing
  league-scoped outbox event while leaving global event pipelines
  audience-free;
- adds bounded nullable notification deduplication keys with uniqueness scoped
  to user, event type, and non-null key;
- registers the audience table in the repository catalog and reset policy;
- updates fresh-schema, upgrade, import, cutover, release-QA, fixture-reset,
  identity, commissioner-correction, and deployed-runtime assertions to schema
  `27`;
- requires release-QA fixtures to seed and independently verify the exact
  public audience for every fixture league event; and
- preserves delete-based staging-fixture reset behavior without weakening
  insertion or identity-update enforcement.

Verification under exact Node `24.14.1`:

- focused migration coverage passes `5/5`;
- combined migrations `0023` through `0027` pass `46/46`;
- catalog, reset, schema, migration, import, release-QA, runtime, and
  staging-reset regression matrices pass `141/141`;
- the deployed target runtime matrix passes `38/38`;
- the complete backend suite passes `1033/1033` across `239` suites with no
  failures, cancellations, skips, or todos;
- `node --check server.js` passes;
- repository whitespace validation passes;
- migration SHA-256 is
  `C8171F1FB530A83A52A11301D1BCF549337234241E8B58FF6CE9F625AFC2CC28`; and
- an independent privacy, temporal-membership, integrity, rollback, backfill,
  and deduplication audit found no remaining schema blocker.

No migration was applied to shared staging or production. No live FAD,
Candidate Card, allocation, rollover, recovery, contract, ownership, job,
activity, notification, or historical row was created. `FAD-01` is complete
locally and `FAD-02` is now active.

### Gate

- fresh schema and `22 -> 27` upgrade both pass;
- foreign-key and integrity checks pass;
- protected existing row counts are unchanged except for exact context and
  audience backfills;
- every existing auction has exactly one `ordinary_weekly` context;
- existing league realtime events have exactly one league audience;
- non-league event pipelines remain audience-free;
- notification deduplication keys remain null;
- no FAD, exemption, lifecycle transition, job, activity, or notification is
  fabricated;
- every schema-version assertion reports `27`.

### Amendment Revalidation

The substep records above are preserved as truthful pre-amendment evidence, not
as final schema acceptance. In particular, the `0025` seven-only rollover and
no-Week-1-movement assumptions and the `0026` seeded-bid/restricted-only draw
assumptions are superseded. `FAD-04R` must audit and revise the local,
never-shared migration set as justified, then replace this gate with fresh and
`22 -> latest` evidence plus the exact post-amendment hashes.

### Stop Condition

Do not apply these migrations to shared staging and do not compose the new
repositories into the runtime.

## FAD-02 - Scoped Outbox and Notification Reliability

### Change

Create one atomic league outbox writer, retrofit every existing league
realtime writer, require explicit league/team/user audiences, enforce audiences
in the publisher, and add notification deduplication behavior.

### Completion Record

`COMPLETE - LOCAL ONLY (2026-07-28)`

This slice:

- adds `SqliteLeagueOutboxWriter` as the only application path for atomically
  committing a league-scoped outbox event with its exact persisted audience;
- defaults ordinary public league events to exactly one league audience while
  requiring explicit same-league team or active-user audiences for narrow
  delivery and rejecting any league-plus-narrower audience mixture;
- retrofits auction resolution and trade proposal, expiry, and reversal
  writers without changing their existing public event contracts;
- loads persisted audiences during publication, fails malformed or missing
  audiences closed, reauthorizes a user audience against current active
  unended membership immediately before synchronous room emission, and never
  derives routing authority from event payloads;
- adds `SqliteNotificationWriter` with strict nullable deduplication semantics:
  null keys preserve existing distinct notification behavior, exact keyed
  replays return the original row, and divergent collisions fail;
- retrofits commissioner assignments, league invitations, team-manager
  assignments, and trade proposals through one shared notification writer;
- composes exactly one of each writer in the target runtime and keeps the
  release-QA fixture on the same atomic paths;
- adds source-level composition guards against future direct insert bypasses;
  and
- documents the required quiesced schema-23-through-27 and runtime deployment
  boundary in `docs/04-technical-specs/DEPLOYMENT.md`.

Backend files changed for this slice:

```text
src/application/services/activity/createLeagueOutboxPublicationService.js
src/bootstrap/createTargetRuntime.js
src/infrastructure/persistence/sqlite/SqliteAuctionResolutionRepository.js
src/infrastructure/persistence/sqlite/SqliteCommissionerAssignmentRepository.js
src/infrastructure/persistence/sqlite/SqliteLeagueInvitationRepository.js
src/infrastructure/persistence/sqlite/SqliteLeagueOutboxRepository.js
src/infrastructure/persistence/sqlite/SqliteLeagueOutboxWriter.js
src/infrastructure/persistence/sqlite/SqliteNotificationWriter.js
src/infrastructure/persistence/sqlite/SqliteTeamManagerAssignmentRepository.js
src/infrastructure/persistence/sqlite/SqliteTradeExpiryRepository.js
src/infrastructure/persistence/sqlite/SqliteTradeProposalRepository.js
src/infrastructure/persistence/sqlite/SqliteTradeReversalRepository.js
src/infrastructure/socket/createSocketIoInvalidationPublisher.js
src/operations/release/createReleaseQaFixture.js
test/foundation/activityNotificationFoundation.test.js
test/foundation/leagueOutboxAudiencePublicationFoundation.test.js
test/foundation/leagueOutboxWriterFoundation.test.js
test/foundation/leagueReliabilityCompositionFoundation.test.js
test/foundation/sqliteNotificationWriterFoundation.test.js
```

Recorded local verification under exact Node `24.14.1`:

- the affected assignment, invitation, trade, auction, publication, runtime,
  and release-QA matrix passes `157/157` across `36` suites;
- the writer-composition guard passes `3/3`;
- the complete backend suite passes `1051/1051` across `243` suites with no
  failures, cancellations, skips, or todos;
- `node --check server.js` passes;
- repository whitespace validation passes; and
- source inspection finds no application notification insert outside
  `SqliteNotificationWriter` and no league outbox writer bypass.

No Candidate Card route, private projection, FAD job, or FAD domain event was
exposed. No database migration or application write was performed against
shared staging or production. Existing global account, security, and email
outbox behavior remains separate and audience-free. New FAD producers must use
these writers. Final Candidate Card cache, activity, notification, and
reconnect privacy was the blocking `FAD-14` gate and is now satisfied locally;
shared-environment proof remains reserved for the later staging gate.

### Gate

- a scoped event cannot commit without a valid same-league audience;
- league, team, and user delivery is isolated across at least two leagues;
- global, account, security, and email event behavior is unchanged;
- existing auction, trade, roster, contract, activity, notification, matchup,
  and scheduler regressions pass;
- no private payload is logged or broadcast to a league-wide room.

### Amendment Revalidation

Rerun this slice with automatic-readiness blockers, private queued nominations,
fallback, exact-top draw, and schedule-recovery audience/deduplication cases.
The existing scoped writer foundation remains accepted only when those new
producer paths cannot bypass it or leak competitive data.

### Stop Condition

Do not expose Candidate Card data. Document the quiesced shared-environment
migration/writer/publisher deployment procedure for `FAD-18`.

## FAD-03 - Shared ContractSeasonPlanner

### Change

Extract the existing auction-only contract-season planning into one shared
canonical-NHL-season-key planner and use it in ordinary auction completion
before FAD calls it.

### Completion Record

`COMPLETE - LOCAL ONLY (2026-07-28)`

This slice:

- adds the Contracts-owned `planContractSeasons` as the single shared planner
  intended for ordinary auctions, automatic FAD awards, restricted FAD
  auctions, and open rapid FAD auctions;
- derives all contract-year chronology from canonical consecutive
  `YYYYYYYY` NHL season keys and never parses a season display label;
- preserves a legacy or canonical display label on the active target season
  while requiring every later required season to use canonical `YYYY-YY`;
- creates only missing future rows as immutable planned output with all
  calendar fields and the FAD completion marker null;
- reuses exact canonical planned future seasons without mutating lifecycle,
  version, dates, identity, or `leagues.current_season_id`;
- rejects malformed or exhausted keys, cross-league input, duplicate IDs,
  keys, or labels, non-planned future rows, ambiguous key/label matches, and
  generated-ID collisions before any persistence effect;
- refactors ordinary auction completion to invoke the shared planner as the
  first winner-persistence action inside its existing immediate transaction;
- preserves auction pricing, cap and roster legality, contract, ownership,
  activity, scoped outbox, replay, and late-failure rollback behavior; and
- removes the obsolete Auctions-owned `auctionCompletionPolicy` after a
  repository-wide search proved no remaining consumer.

Files changed for this slice:

```text
src/domain/auctions/auctionCompletionPolicy.js (removed)
src/domain/contracts/contractSeasonPlanner.js
src/infrastructure/persistence/sqlite/SqliteAuctionResolutionRepository.js
test/foundation/auctionCompletionFoundation.test.js
test/foundation/contractSeasonPlannerFoundation.test.js
```

Recorded local verification under exact Node `24.14.1`:

- shared planner and atomic ordinary-auction completion pass `21/21`;
- planner, auction creation/bidding/resolution/jobs, contracts, cap,
  lifecycle-migration, and scoped-outbox coverage passes `81/81` across `17`
  suites;
- target-runtime and release-QA compatibility passes `49/49` across `6`
  suites;
- the complete backend suite passes `1060/1060` across `243` suites with no
  failures, cancellations, skips, or todos;
- a repository-level canonical key/label collision leaves the complete
  semantic database hash unchanged;
- matching planned seasons are reused byte-for-byte and the league current
  season pointer remains unchanged;
- `node --check server.js`, stale-import inspection, and repository whitespace
  validation pass; and
- an independent transaction and compatibility audit found no remaining code
  blocker.

No migration, route, frontend behavior, database row, shared-staging state, or
production state changed. The isolated-staging preflight must inventory and
fail closed on any future row retained from the old planner with a legacy
label such as `2027` for key `20272028`; the approved reset is expected to
remove that incompatible future state, but this has not yet been asserted
against shared staging.

### Gate

- fixed one-, two-, and three-year contract plans pass;
- malformed, duplicate, or colliding season keys fail before contract effects;
- planned future seasons never change `current_season_id`;
- ordinary auction contract creation, completion, cap, and rollback behavior
  remains unchanged;
- a planner failure rolls back every related write.

### Amendment Revalidation

Rerun the planner and ordinary-auction matrix after scheduled Entry Draft-start
rollover and the amended FAD auction contexts are composed. The planner remains
complete only if target-season binding, no-reservation/binding wins, and
ordinary weekly compatibility still pass without a second contract-year path.

## FAD-04 - Reset Evidence, T-036 Activation, and Scheduled T-037 Rollover

### Pause Checkpoint - 2026-07-28

Grae requested a pause at the next safe checkpoint. The checkpoint is after
the complete local verification and documentation of `FAD-03` and before any
`FAD-04` implementation edit.

Recorded state:

- `FAD-01`, `FAD-02`, and `FAD-03` are complete locally;
- the latest complete backend suite passes `1060/1060` across `243` suites;
- `node --check server.js`, stale planner-import inspection, and repository
  whitespace validation pass;
- `FAD-04` received read-only source/specification analysis only;
- no `FAD-04` domain, repository, service, route, test, fixture, migration,
  reset, database, environment, or deployment change has begun;
- all read-only `FAD-04` analysis agents were stopped at the pause request;
- shared staging and production remain unchanged; and
- no commit, push, merge, migration application, reset, or deployment occurred.

The exact resume point is the start of `FAD-04`: recheck both worktrees and the
canonical operating mode, finish reconciling the reset-report writer/verifier
with the `T-037` exemption and rollover transaction boundaries, then begin one
small reviewed implementation substep. The current dirty worktrees contain
the intentional cumulative FAD documentation and local backend work and must
not be reset, stashed, overwritten, or partially discarded.

### Resume Record - 2026-07-29

The persistent implementation goal resumed from the checkpoint above.
Re-entry inspection confirmed both repositories remain on `staging`, the
operating mode remains `OFFSEASON_RESET`, the migration ledger still ends at
`0027`, exact Node `24.14.1` is available, and the cumulative dirty worktrees
match the recorded FAD work. `FAD-04` was briefly reactivated; no database or
environment action occurred during re-entry.

### Second Pause Record - 2026-07-29

Grae requested another pause before any `FAD-04` implementation began. The
only work after the prior checkpoint was read-only re-entry validation,
reactivating this status record, and briefly resuming the three read-only
analysis tasks. Those tasks were interrupted again before producing or editing
implementation artifacts.

The safe state remains:

- `FAD-01` through `FAD-03` complete locally;
- latest complete backend verification `1060/1060` across `243` suites;
- `FAD-04` implementation not started;
- no backend code, test, fixture, migration, database, reset, environment,
  deployment, Git history, staging, or production change since the first
  pause; and
- continuation is prohibited until Grae explicitly says to continue.

### Second Resume Record - 2026-07-29

Grae explicitly said to continue. Re-entry inspection confirmed the backend
and frontend repositories remain on `staging`, the operating mode remains
`OFFSEASON_RESET`, the migration ledger still ends at `0027`, exact Node
`24.14.1` remains available, and both cumulative dirty worktrees still match
the recorded FAD work. No database, reset, environment, deployment, Git
history, shared-staging, or production action occurred during re-entry.

`FAD-04` is active at the recorded boundary. Work resumes with the read-only
reset-evidence and lifecycle transaction audit before the first small,
reviewable implementation substep.

### Closed-Write Handoff Progress - 2026-07-29

The reset-evidence portion of `FAD-04` is complete locally. It now includes:

- a full-payload content-addressed private verification artifact with a
  separately named independent import-verifier hash;
- crash-recoverable, owner-bound create-new publication locking;
- exact first-administrator and reset-original-league bootstrap continuity;
- a transaction-bound, one-use migration-report commit capability;
- insert-only exact-one report persistence with full rollback;
- fresh-connection, single-snapshot post-commit verification; and
- simultaneous-command convergence on one durable commit plus one read-only
  replay.

Focused artifact, bootstrap, continuity, report, and command verification
passes `34/34`; focused insert-only report-repository verification passes
`8/8`. `T-036` is also contract-tested locally: its real SQLite and rollback
suite passes `16/16`, its isolated HTTP contract passes `5/5`, and the combined
runtime gate passes `44/44`. It activates every setup team plus the sole
planned season and setup league in one transaction, with durable replay,
activity, Security Audit, and one scoped outbox invalidation. It rejects
incomplete settings, including a missing commissioner-configured trade
deadline. `T-035` is now contract-tested locally as the operational path that
fills that prerequisite: its real SQLite suite passes `9/9`, the shared
T-035/T-036 HTTP suite passes `8/8`, and the combined lifecycle/runtime gate
passes `56/56` across 92 unique target endpoints. It performs dual settings
and league compare-and-swap, durable replay, activity, Security Audit, and one
scoped outbox invalidation without creating a job, notification, FAD, or
scheduled event. An independent launch-grade review found no blocker, P1, or
P2. The next `T-037` prerequisite is explicit canonical final-standings
finalization with exact result-version provenance; season rollover must verify
that evidence and never create or repair it. Shared staging and production
remain unchanged.

### Canonical Finalization and Recovery Progress - 2026-07-29

`T-145` is complete locally. Migration `0028`, the canonical result-set hash,
strict schedule-generation root, application service, SQLite repository,
isolated route, runtime composition, immutable final snapshot/rows/links and
team identities, Security Audit, deduplicated member notifications, scoped
metadata-only outbox, season compare-and-swap, and idempotency-last replay are
implemented and verified. Corrected result history requires an exact direct
version chain plus one immutable succeeded `result_correct` operation for
every correction version. The independent final review found no remaining
blocker, P1, or P2. The final focused gates pass `90/90`, the adjacent
matchup/recovery/reset gates pass `49/49`, and the post-review service gate
passes `11/11`.

`T-098` exact replay hardening is also complete locally. A rebuild is bound to
its original command, scope, actor, reason, expected version, snapshot,
source-result version, complete standings rows, sorted team IDs, and row
evidence digest. Changed input or altered evidence fails closed without a
write. Fresh rebuilds are blocked by any canonical finalization history,
including a superseded generation, while legacy `final` derived history
without canonical provenance remains noncanonical. Recovery and HTTP tests
pass `25/25`, and migration-compatibility tests pass `11/11`.

`T-097` is complete locally. Its policy, application service, immediate SQLite
repository, HTTP route, target runtime composition, immutable replay, paired
`correction_required` recovery repair, historical completed-season path,
conditional member notification, Security Audit, scoped outbox, and
idempotency-last behavior are implemented. A pre-final correction replay
remains its original null-replacement result even after later `T-145`
finalization only when the initial finalization immutably links that correction
or a later direct descendant; an earlier link rejects missing replacement
evidence. Focused migration/repository/policy/service gates pass `33/33`,
adjacent HTTP/recovery/finalization/runtime gates pass `92/92`, syntax and
diff checks pass, and independent review found no blocker, P1, or P2.

The pre-amendment active work was `T-037`: implement the one-time
initial-Season-2 no-draft exemption and the complete continuing-season rollover
transaction. Shared staging and production remain unchanged.

### Amendment Restart Checkpoint - 2026-07-29

The approved lifecycle amendment changes the execution contract early enough
that `FAD-04` must restart before further implementation. Completed
`T-145`, `T-098`, and `T-097` evidence remains historical local evidence, but
it must be rerun after the lifecycle and migration changes. Any partial
`T-037` implementation is not accepted merely because its pre-amendment tests
passed.

The restart begins with `FAD-04R`:

1. freeze further lifecycle implementation while preserving every unrelated
   dirty-worktree change;
2. audit migrations `0023` through `0029` under the per-file matrix above;
3. inventory the current `T-037` policy, service, repository, route, job,
   runtime, and test behavior against the scheduled Entry Draft-start contract;
4. write or revise focused acceptance tests for the scheduled due occurrence,
   exact blocker persistence, retry-only-after-blockage, crash/restart replay,
   atomic rollover, and the requirement that drafting and trading remain closed
   until success;
5. implement the smallest migration and lifecycle changes justified by that
   evidence; and
6. rerun the complete `FAD-01` through `FAD-04` migration, repository,
   lifecycle, outbox, contract-planner, finalization, correction, restart, and
   rollback regression matrix before `FAD-05` becomes eligible.

This restart does not authorize deleting, stashing, or resetting completed
local work. It does not change shared staging or production.

### Computer-Restart Pause Checkpoint - 2026-07-29

Work is deliberately `PAUSED BY USER` at a safe local checkpoint. All
subagents are stopped. No commit, push, shared-staging migration, deployment,
production action, or live-data mutation occurred.

Verified immediately before the pause:

- the corrected pre-`0030` migration baseline passes `60/60` across migrations
  `0023` through `0029`;
- the scheduled-rollover job and lease repository foundations pass `12/12`;
- the retry-only lifecycle HTTP route and no-GET-writer suite pass `14/14`;
- the new strict Entry Draft schedule/reschedule policy passes `6/6`;
- `createLeagueLifecycleTransitionService.js` passes syntax validation with
  the required Node `24.14.1`; and
- the amended FAD technical/API/data-model documents pass `git diff --check`.

The saved lifecycle service now removes the superseded commissioner-authored
target/calendar rollover path and retains the scheduled occurrence plus
same-occurrence retry core. Its old pre-amendment focused service test has not
yet been rewritten or run. The exact production lifecycle SQLite repository
does not yet exist.

Migration `0030_apply_locked_fad_decision_package.sql` has **not** been created.
Its completed design checkpoint requires:

- stable draft-level `entry_draft_rollover_bindings`;
- separate immutable `season_rollover_occurrences`, so rescheduling preserves
  old occurrence history while replacing only the current unexecuted
  occurrence;
- distinct `binding_id` and `rollover_occurrence_id` throughout attempts,
  retry, successful rollover, API, and jobs;
- both binding and occurrence evidence to freeze target schedule ID/version,
  Week 1 matchup-week ID/start, and scheduling-time source-season,
  target-season, and Entry Draft versions;
- `season_rollover_attempts` to derive the latest attempt from the maximum
  attempt number for one occurrence rather than store a drift-prone
  `latest_attempt_id`;
- the approved readiness, private nomination queue, pick-clock, and late-game
  exclusion tables/guards; and
- predictable immutable-delete trigger names reported before the staging
  fixture-reset trigger catalogue is changed.

Because separate occurrence and on-clock-trade-use tables were added at this
checkpoint, the prior prepared repository-catalog/schema expectation of `107`
tables is provisional and must be reconciled to the actual `0030` schema
(currently at least `109`, subject to the migration's exact final inventory).
The composed runtime currently fails closed with
`REPOSITORY_SCHEMA_INCOMPATIBLE` because the pre-`0030` database has `101`
tables while the prepared catalog has `107`.

Resume from exactly here:

1. inspect both dirty worktrees and reread this checkpoint; do not discard,
   stash, stage, or rewrite unrelated work;
2. create `0030` and its focused migration test from the frozen design above,
   without applying it to shared staging;
3. inspect the exact final table, column, foreign-key, index, and trigger
   inventory, then update catalog/schema/reset/import/release expectations from
   evidence rather than the provisional count;
4. run the fresh and `22 -> 30` migration gates, foreign-key/integrity checks,
   reset-trigger proof, and all seven predecessor migration suites;
5. align the saved lifecycle service projections to the final schema, replace
   `leagueLifecycleTransitionServiceFoundation.test.js`, and run it with Node
   `24.14.1`;
6. implement the production lifecycle repository factory, then compose the
   scheduled worker/runtime and rerun the router, job, repository, runtime,
   restart, and rollback gates; and
7. complete the Entry Draft schedule service from the preserved repository
   contract (`findIdempotency`, `findScheduleResult`, `readScheduleContext`,
   and atomic `applySchedulePlan`) before exposing its route.

Do not begin `FAD-05` or any shared-staging action until the complete
`FAD-01` through `FAD-04` amended regression gate passes.

### Post-Restart Resume Checkpoint - 2026-07-29

The user resumed launch-grade implementation through isolated staging. The
pause checkpoint above remains historical evidence and is no longer the
current operating state. No commit, push, shared-staging migration,
deployment, production action, or live-data mutation has occurred.

Completed and reverified since resumption:

- the Entry Draft schedule/reschedule policy, application service, strict
  route, lifecycle policy/route, scheduled rollover worker, and rollover-job
  policy pass one combined `62/62` focused gate;
- rollover-worker timestamp overflow now fails closed and its focused gate
  passes `8/8`;
- the rollover job repository follows the binding's exact current occurrence
  and job, preserves blocked/succeeded crash replay, rejects superseded
  occurrences, and passes `7/7`;
- the canonical FAD technical spec, data model, and API contract now define
  immutable `entry_draft_schedule_operations`, atomic setup confirmation,
  exact replay, and normalized skipped-job evidence; and
- migration `0030_apply_locked_fad_decision_package.sql` now exists as
  uncommitted local work and is undergoing final table/trigger/acceptance-test
  reconciliation. Its table count, hash, and migration evidence remain
  provisional and must not be copied into catalog, reset, release, or staging
  expectations until the focused migration gate is stable.

Current work resumes at the earliest affected `FAD-04` seam:

1. finish and independently audit `0030`, including immutable schedule
   results, exact occurrence/job rescheduling, rollover root/manifest,
   pick-clock ownership, FAD extension/queue/fallback/draw/recovery, schedule
   generation, and late-game exclusion invariants;
2. run fresh and `22 -> 30` migration, rollback, integrity, foreign-key,
   predecessor, and guarded-data tests;
3. derive the final catalog/reset/import/release inventory from the verified
   schema;
4. finish the lifecycle service test rewrite and production lifecycle and
   Entry Draft schedule repositories;
5. compose the routes, worker, and runtime and pass the complete amended
   `FAD-01` through `FAD-04` regression gate; and
6. only then begin `FAD-05`.

### Change

Implement:

- the create-new private canonical verification-artifact publisher required
  before the original-league bootstrap changes the pristine imported database;
- the post-bootstrap continuity verifier with an exact reviewed delta,
  protected imported-table hash continuity, and crash-safe replay;
- the committed reset/cutover `migration_reports` writer and exact verifier;
- `T-035` commissioner setup-only trade-deadline persistence;
- `T-036` initial setup-league and sole planned-season activation;
- `authorize_initial_season2_no_draft`;
- preparation of the later-season transition and automatic
  `execute_scheduled_entry_draft_rollover` execution at the persisted Entry
  Draft start;
- durable scheduled-attempt blocker evidence and
  `retry_scheduled_entry_draft_rollover` for the same failed occurrence;
- migration `0029_add_lifecycle_transition_evidence.sql`;
- durable reverse-linked idempotency, `season_rollovers`, normalized immutable
  effect-manifest/hash/event evidence, and exemption report/bootstrap evidence;
- the atomic contract, ownership, retention, buyout, trade, and current-season
  transition required to create authoritative later-season carryovers.

### Gate

- zero, multiple, failed, wrong-manifest, or wrong-league report rows reject
  the original-league exemption;
- an inaugural league requires no fabricated report;
- the one-time exemption cannot be reused;
- no synthetic Season 1 is created;
- a replay returns the same durable result;
- the immutable pristine-verification artifact survives a stop between import
  verification and report commit, and recovery re-verifies continuity before
  returning the same durable row;
- the canonical evidence payload plus separate byte-length/SHA-256 manifest
  bind the exact staging descriptor and database resource identity;
- continuity verification rejects any database change outside the exact
  first-administrator and reset-original-league command projections;
- report commit accepts the explicit `setup` league plus sole `planned`
  `20262027` current season boundary without silently activating either one;
- `T-035` persists the informational deadline with optimistic concurrency,
  idempotency, activity, Security Audit, and scoped outbox evidence but creates
  no scheduled event;
- `T-036` atomically activates every setup team plus that initial setup league
  and its sole planned current season only after complete settings, team,
  manager, and invitation prerequisites pass;
- injected failure leaves all participating tables unchanged;
- read and setup routes never create or repair lifecycle evidence;
- no normal commissioner command can execute a not-yet-due later-season
  rollover, and retry rejects unless the same scheduled attempt is durably
  blocked;
- trading and the Entry Draft remain closed until the scheduled rollover
  transaction succeeds;
- due-job crash, process restart, lease loss, duplicate delivery, and retry
  converge on one transition and one immutable attempt history;
- the source requires one exact completed FAD, resolved recoveries, terminal
  allocations/rollovers/auctions/jobs/matchups/trades, and one current
  provenance-complete finalization lineage rooted in T-145;
- target key and canonical label resolve to the same one clean planned season
  already bound to the persisted Entry Draft, complete calendar, and approved
  prebuilt schedule; an absent target or calendar override rejects;
- all mutable parent rows use exact version/timestamp advancement, every year
  update asserts its old predicate/count, and the total contract/ownership/
  prospect/obligation matrix holds before and after;
- the immutable per-effect manifest, linked events/activity, canonical hash,
  and all nine counts reconcile; later valid summer descendants remain
  acceptable without rewriting historical rollover evidence;
- exact replay runs before mutable lifecycle checks and returns the original
  response without duplicate effects, including an authorization-time
  unconsumed exemption after later FAD consumption;
- backup/restore and table-reconciliation rehearsal passes on a disposable
  copy;
- the migration-impact dispositions for `0023` through `0029` and exact
  post-amendment hashes for `0023` through `0030` are recorded; and
- the integrated `FAD-01` through `FAD-04` regression gate passes before
  `FAD-05` starts.

### Risk Boundary

This is the highest data-corruption-risk slice. It remains local and
disposable until the integrated and staging gates.

### Completion Record - 2026-07-30

`FAD-04` is `COMPLETE - LOCAL ONLY`. The amendment impact audit, corrective
migration, lifecycle implementation, and complete local regression gate passed:

- schema version `30` contains `123` application tables and `124` tables
  including `schema_migrations`;
- reset/import/release evidence reconciles `41` require-empty tables, `82`
  signed-reset-policy tables, and `59` guarded deletes;
- the complete migration matrix passes `79/79`;
- catalog/reset/import/release verification passes `57/57`;
- reset-import artifact verification passes `34/34`;
- lifecycle, Entry Draft schedule, job, and router verification passes `89/89`;
- auction and locked-decision compatibility verification passes `76/76`;
- transition and cutover verification passes `14/14`, including the `5/5`
  cutover rehearsal;
- pure-domain hashing and architecture verification passes `59/59`; and
- the exact Node `24.14.1` full backend suite passes `1364/1364` tests across
  `283` suites with zero failures.

No migration, reset, commit, push, or deployment reached shared staging or
production at that checkpoint. The `T-080` legacy response adapter was
explicitly local-only and has since been replaced by the canonical safe result
in `FAD-06`; it never reached a shared-staging gate.

## FAD-05 - Explicit Week 1 Selection and Server-Owned Schedule Recovery

### Change

Implement `T-095` and `T-096`:

- read-only schedule preview with an explicit complete NHL/playoff calendar
  and selected `firstWeekStartsAtMs`;
- confirmed persistence by an authorized commissioner or inherited
  member-platform-administrator;
- atomic first-calendar persistence for an all-null inaugural/reset-created
  season, and exact calendar equality for a later T-037-created season;
- immutable T-095/T-096 command results linked to their exact idempotency
  requests and replayed independently of later schedule generations;
- automatic pre-open whole-Monday advancement when Entry Draft completion is at
  or after the derived deadline or a full initial seven-day period would not
  fit;
- DST-safe local-Monday selection in Node without an elapsed
  `604800000`-divisibility assumption;
- atomic completion-time advancement to the first valid league-local Monday
  strictly after proposed FAD completion when active, queued, fallback, or
  recovery work overruns Week 1;
- fixed NHL regular-season and four-playoff-week endings, fair regeneration of
  remaining regular-season pairings/byes, durable removed-week/matchup
  evidence, and replacement or explicit cancellation of dependent unexecuted
  jobs inside the same transaction;
- durable schedule-generation bindings for each dependent job and
  current-generation/FAD-completion revalidation inside its write transaction;
- permanent protection of historical Candidate deadline and FAD rollover
  instants as soon as any FAD exists;
- the amended late-legality integration: a late snapshot atomically persists
  its durable NHL game observation, baseline, sealed exclusion root, and
  immutable player/game/start/source children, and excludes every selected
  player's already-underway NHL game in full;
- an independently digested, immutable live-source coverage manifest that
  accounts for the exact server-required player set, proves authoritative
  `expected_game`, `no_due_game`, or `no_team` dispositions, and seals
  atomically with the exact observation identity set;
- canonical-json-v1 recovery, coverage, observation, and exclusion digests with
  fixed SHA-256 test vectors.

### Gate

- two explicit Week 1 values produce two distinct authoritative schedules and
  FAD anchors;
- the initial/reset-created season is reachable from all-null calendar through
  the confirmed command, and later seasons reject a mismatched tuple;
- no NHL opening date, playoff date, or annual default silently replaces a
  supplied or missing value;
- preview table hashes prove no writes;
- exact T-095/T-096 idempotent replay returns the immutable original response
  after a later schedule shift or recovery;
- one- and multi-Monday pre-open recovery produce a future-facing deadline and
  complete initial seven-day period;
- both DST directions accept valid consecutive league-local Mondays separated
  by 167 or 169 elapsed hours;
- completion before Week 1 leaves the schedule unchanged, while completion at
  or after Week 1 chooses the first valid Monday strictly after completion;
- shifting fixes the NHL/playoff ending, regenerates remaining pairings and
  byes fairly, records removed week and matchup IDs, distinguishes paired
  replacements from cancellation-only job evidence, and does not change
  Candidate/FAD history;
- every matchup-start/baseline occurrence is bound to one schedule generation,
  and a stale binding cannot mutate state even when its scheduled instant
  matches a replacement;
- simultaneous completion and matchup-start attempts converge atomically with
  no partial schedule, job, or completion state;
- late-snapshot detection uses the authoritative NHL schedule/source version,
  excludes post-baseline events from every already-underway player/game pair,
  and replay or racing legality-restoration attempts preserve one durable
  observation and immutable sealed snapshot/baseline/exclusion set;
- the live adapter receives and returns the exact required player identity set,
  binds coverage and observations to one provider capture and `sourceVersion`,
  and exact `expected_game` player/game identities equal exact observation
  identities with no missing-as-zero fallback;
- late-lock game-state requirements derive from sealed coverage for every
  selected player, while a missing current observation for any excluded pair
  leaves scoring and finalization `awaiting_data`;
- fixed canonical preimage/hash vectors pass, exclusion child insertion after
  sealing fails, and T-141 projects only actual `replacedJobs[]` pairs;
- the read-only provider-capability command and sanitized evidence contract are
  locally fail-closed and ready for FAD-18, where isolated staging must prove
  authoritative `expected_game`, `no_due_game`, `no_team`, explicit-zero,
  exact-set, and shared-`sourceVersion` semantics without changing shared
  league data; missing credentials or unsupported semantics blocks staging
  acceptance;
- incomplete or illegal team rosters never trigger schedule recovery; and
- ordinary manager/commissioner schedule writes that would move historical FAD
  instants fail after card opening.

### Recorded 2026-07-30 T-096 Local Checkpoint

The exact `shift_week_one` command is complete locally through its domain,
application, immediate SQLite, HTTP, and target-runtime boundaries. It:

- requires the exact three-field body, Week 1 `If-Match`, opaque
  `Idempotency-Key`, and current commissioner or inherited member-platform-
  administrator authority;
- shifts every persisted regular-season boundary and six dependent job
  occurrences per week atomically while preserving approved matchup and bye
  identities;
- supersedes the prior schedule generation, writes only generation-qualified
  replacement occurrence keys, and safely accepts migration-shaped legacy
  source keys;
- supports collision-free `A -> B -> A` generations, immutable T-095/T-096
  replay after later generations, and exact rollback at all nine injected
  transaction seams;
- rejects any new shift after a FAD exists with safe
  `409 FAD_WEEK_ONE_FROZEN`; and
- returns the exact ten-field `200` data representation while preserving the
  older `{confirmed}` week-transition contract.

Focused exact Node `24.14.1` verification passes `38/38` core tests across
five suites and `46/46` HTTP/runtime tests across seven suites. An independent
expanded core audit passes `61/61` across nine suites. Syntax and
`git diff --check` gates are clean. No shared database, migration execution,
commit, push, or deployment occurred at this checkpoint.

### Recorded 2026-07-30 Late-Lock Scoring-Source Impact Audit

The post-T-096 read-only audit found that the existing target statistics path
stores only cumulative `player_stat_totals`, while the configured
SportsDataIO adapter is explicitly last-season-only. The current scoring model
therefore cannot prove or calculate the locked rule that an already-underway
NHL game is excluded in full, including events received after the late
baseline, while a later game in the same fantasy week still scores.

The canonical Data Model, FAD technical specification, Glossary, and Testing
Strategy now require:

- one sealed, content-addressed player/game observation set for every refresh
  eligible for live matchup scoring;
- immutable per-player/per-NHL-game statistics, including explicit zero rows;
- an exact baseline player/game observation link on every whole-game
  exclusion;
- current-minus-baseline per-game delta subtraction with strict
  provider/refresh lineage; and
- fail-closed `awaiting_data` behavior for missing, stale, regressed,
  cross-provider, partial, or unsealed evidence.

Before late-lock implementation can begin, amend local-only migration `0030`
with the two provider-neutral observation tables and the exclusion link,
update catalog/reset/import/cutover inventories and checksums, and add a
current-season live provider contract. The existing last-season discovery
adapter remains valid for catalog/history import but cannot be composed into
matchup jobs. Automated tests use synthetic recorded feeds; the isolated
staging gate must separately prove configured feed access and freshness.

This is a technical correction to enforce the already-approved scoring
outcome. It does not change League Rules or permit a whole-week player
exclusion, partial-game subtraction, or missing-as-zero fallback.

### Recorded 2026-08-01 Player-Game Coverage Integrity Amendment

The FAD-05 observation audit found a second missing-as-zero seam: the live
adapter can return only player/game rows present in the provider response, and
the late-lock path can then derive required games from those rows. A selected
player omitted by the provider would disappear from the required set rather
than fail closed.

The approved technical integrity correction is:

- the server supplies the adapter's exact required stable-player/provider-
  player identity set for the refresh scope;
- the adapter returns that exact set with mutually exclusive affirmative
  `expected_game`, `no_due_game`, or `no_team` coverage;
- a local omission or unresolved identity never creates a terminal
  disposition, and an expected pair requires an explicit row even when its
  values are zero;
- migration `0030` adds immutable coverage children plus root counts, schema,
  and a separate canonical coverage digest while preserving the existing
  observation schema-version-1 preimage unchanged;
- coverage and observations stage before one atomic seal, use one provider
  capture and `sourceVersion`, and have exactly equal expected player/game
  identity sets;
- late-lock game-state requirements derive from coverage for every selected
  player, not from returned observations; and
- scoring and finalization stay `awaiting_data` when an excluded pair lacks a
  compatible, non-regressed current observation.

Local FAD-05 acceptance requires pure exact-set/disposition/digest vectors,
migration count/foreign-key/trigger/immutability tests,
adapter/service/repository rollback and replay tests, late-lock and finalization
missing-pair tests, and the implemented fail-closed capability-check command
and sanitized evidence contract specified in Testing Strategy. FAD-18 must
execute that check with the configured isolated-staging live source and prove
its actual semantics without shared league writes, synthetic fallback,
credential disclosure, or raw-payload retention. An unavailable credential or
unsupported semantic blocks the staging gate.

This is a technical integrity clarification of the existing whole-game
exclusion and absent-is-not-zero rules. It changes no League Rule or product
outcome. `FAD-05` remains active until the implementation and local gates,
including the fail-closed capability command, pass. The real-provider execution
remains a mandatory FAD-18 staging gate, not a prerequisite that blocks
subsequent local slices. Migration `0030` remains local-only. Its exact final
inventory and checksum are frozen in the migration evidence above; any later
migration-byte change voids that freeze and requires the complete package to be
rerun.

### Recorded 2026-08-01 Late-Lock Coordination and Replay Defaults

The approved implementation defaults that must be fixed before late-lock
coding are:

- late-lock replay is semantic reconstruction from committed evidence. Newly
  proposed generated child UUID differences are ignored, but timestamp,
  statistics or game-state source lineage, selected-roster, sealed-coverage,
  or exclusion differences conflict. Stored digests still include and verify
  their committed IDs. No request-ID or idempotency-request schema is added;
- every current and future roster writer is named in one table-driven registry
  and calls one shared, never-rejecting post-commit coordinator. One committed
  batch groups unique ownership witnesses by affected league, season, and team;
  a deleted ownership uses its last committed pre-delete version. The mutation
  kind must be an exact registry member. An affected team may carry an empty
  witness array only when its durable committed result proves a legality change
  without an ownership-tenure mutation, including cap-only, contract-only,
  effective-position, or truly empty-roster effects. Writers never invent an
  unchanged or synthetic witness. The registry covers moves, buyouts/releases,
  ordinary and FAD auction wins, Candidate allocation/carryover movement, trade
  acceptance/reversal, commissioner changes, contract transitions, prospect
  operations, effective-position corrections, and later equivalent writers;
- a player or prospect-right team transfer closes the source ownership tenure
  and creates a distinct destination ownership at version `1`, while stable
  player and contract IDs remain unchanged. The command durably maps old to new
  ownership IDs; reversal closes that destination tenure and creates another
  new source tenure. Source and destination therefore contribute globally
  unique deleted and present witnesses, and exact replay never repeats or
  resurrects an ownership mutation;
- the coordinator never reruns, compensates, reverses, or rolls back the
  committed mutation. Original-command replay may re-evaluate the committed
  batch but never repeats ownership, contract, activity, or outbox effects.
  Any coordinator validation or runtime failure after commit safely maps to
  `awaiting_data` and cannot reject the successful command;
- successful roster-mutation responses expose only
  `lateLock: {status, lockId?}`, where status is `completed`, `awaiting_data`,
  `still_illegal`, or `not_applicable`. Delayed evidence preserves mutation
  success and leaks no source, roster, coverage, baseline, or exclusion detail;
- multi-team response aggregation uses exact priority `awaiting_data`,
  `still_illegal`, `completed`, `not_applicable`; `lockId` appears only when
  exactly one safely identifiable completed lock applies to the whole batch;
- the entire immediate command batch may run at most one server-owned live
  refresh and retry once. Each later successful scheduled live refresh invokes
  retry only after persistence from the occurrence handler. The hook is
  isolated from the successful refresh result and retries eligible records
  independently without recursive refresh or repeated roster mutation;
- the exact closed staging fixture reset and provider catalog import are the
  only explicit coordinator exclusions. They require closed writes, disabled
  jobs, and no live or correction matchup; otherwise approved bulk legality
  reconciliation is required before writes or jobs reopen;
- affirmative exact selected-player coverage is a late-lock rule only. Normal
  scheduled lock behavior and availability remain unchanged;
- verified sealed `expected_game` coverage selects the exact distinct in-week
  due-game request for the selected roster. A separate exact NHL game-state
  read observed at or before the late snapshot and no more than `300000`
  milliseconds earlier decides underway state;
- the statistics refresh and game-state read keep separate independently
  digested `sourceVersion` lineages. Their providers must be compatible, but
  their versions need not be equal;
- replay, every evidence use, scoring, and finalization recompute all four
  roots: coverage `coverageSha256`, player-game observation `evidenceSha256`,
  game-state `observationSha256`, and exclusion `evidenceSha256`; and
- exclusion creation requires exact baseline `expected_game` coverage and its
  observation. Scoring/finalization require exact current `expected_game`
  coverage and current observation for every excluded pair plus compatible,
  non-regressed source-update lineage; otherwise they remain `awaiting_data`.

The local FAD-05 acceptance implication is exact. Before this slice closes,
tests must prove:

1. equivalent replay with regenerated candidate child IDs returns one existing
   lock/evidence set, while separate timestamp, source, roster, coverage, and
   exclusion mutations each conflict without partial writes;
2. no migration, repository, request, or route adds late-lock request-ID state;
3. a table-driven registry covers every current and future roster-mutating
   writer plus the two exact staging maintenance exclusions;
4. one committed batch groups and stable-orders affected teams and ownership
   witnesses, including the last committed version of a deleted ownership;
   unregistered mutation kinds reject, while cap-only, contract-only,
   effective-position, and truly empty-roster committed results may identify an
   affected team with an empty witness array and never invent an unchanged or
   synthetic witness;
5. trade acceptance, reversal, and commissioner team transfer close the source
   ownership tenure, create a distinct destination tenure at version `1`,
   persist the exact old-to-new mapping, and supply both globally unique team
   witnesses; replay returns the same mapping without repeating the transfer;
6. single-team, multiple-ownership, and multi-team commands invoke each
   mutation once, aggregate status in the approved priority, and expose
   `lockId` only for one safely identifiable completed lock;
7. coordinator validation, repository, provider, and runtime failures after
   commit all return only the safe `awaiting_data` projection, while original
   command replay never repeats the mutation;
8. delayed evidence leaves the committed mutation successful, the entire
   immediate batch refreshes/retries no more than once, and the occurrence
   handler invokes isolated nonrecursive retry only after scheduled refresh
   persistence succeeds;
9. exclusion tests require closed writes, disabled jobs, and no live/correction
   matchup for fixture reset or catalog import, and require bulk reconciliation
   when those preconditions do not hold;
10. a normal scheduled lock succeeds without selected-player coverage or a
   fresh game-state request;
11. exact in-week due-game selection, missing/extra game rejection, future
   observation rejection, the inclusive five-minute boundary, and stale
   observation rejection pass fixed-clock tests;
12. compatible providers with unequal source versions succeed and incompatible
   providers fail;
13. independent fixed vectors and tamper cases recompute and enforce all four
   digests and exact counts on replay, use, scoring, and finalization; and
14. missing or terminal current coverage, a missing current observation, or a
   regressed source-update time blocks scoring/finalization until exact current
   evidence exists.

These defaults amend the active late-lock implementation boundary only. They do
not reopen T-095/T-096, change the normal lock, authorize provider fallback,
or move the real-provider capability proof out of FAD-18.

### Recorded 2026-08-01 Historical Player-Game Requirement Amendment

The pre-coding audit found that a rolling live-provider date window cannot
retain an excluded NHL game through a two-week Final, a long
`awaiting_data` delay, correction re-entry, or a later trade/team change.
Polling the full NHL season on every refresh is not approved.

Because no shared environment has received this contract, the existing
player-game coverage requirement schema version `1` is corrected in place:

- its canonical preimage adds sorted exact `requiredPlayerGames[]`; each item
  is exactly `playerId`, `providerPlayerId`, `providerTeamId`, `nhlGameId`, and
  `nhlGameScheduledStartsAtMs`, and references its exact `requiredPlayers`
  identity;
- the server derives bindings from sealed baseline `expected_game` coverage
  linked by exclusions in weeks currently `live`, `awaiting_data`, or
  `correction_required`; `final` removes the binding and
  `correction_required` restores it;
- required games and their parent players participate in the exact request,
  requirements digest, completion compare-and-swap, and live-provider request.
  Any relevant mutation or week-status race rejects completion;
- adapter dates are the sorted deduplicated union of the rolling current-game
  dates and provider-Eastern dates for exact retained games, not a full-season
  horizon;
- targeted schedule data must affirm exact game, scheduled start, and bound
  home/away team, and targeted PlayerGame data must affirm the exact
  player/game/team with an explicit row;
- response parents continue to affirm current membership through Players or
  FreeAgents, while each expected game carries its own provider team. Old-team
  and current-team games may coexist, and a currently free-agent player may
  retain an old-team required game;
- disposition is `expected_game` whenever a required historical or current due
  game exists; terminal `no_due_game`/`no_team` requires neither;
- every historical binding is an exact-value subset of flat expected coverage,
  and all flat expected coverage continues to equal observations exactly;
- the result `provider` equals the configured live-statistics provider, and
  `sourceVersion` binds the requested player/game requirements, Players and
  FreeAgents membership, targeted schedules, and normalized PlayerGame rows;
  and
- the FAD-18 capability gate must prove exhaustive Players, FreeAgents,
  targeted historical schedule, and targeted PlayerGame access with the real
  configured credentials before live jobs are enabled.

FAD-05 cannot close until focused policy, adapter, service, repository,
late-lock, scoring, finalization, migration, and composition tests prove:

1. fixed schema-version-1 requirement ordering/hash vectors, exact parent
   identity, duplicate rejection, and required-game subset equality;
2. retention across both weeks of the two-week Final and an
   `awaiting_data` overrun outside the rolling adapter horizon;
3. finalized scope removal and exact `correction_required` re-entry;
4. a traded-away or released snapshot player retaining the historical
   player/game/team/start binding after ownership or provider-team change;
5. one player carrying old-team and current-team games together, and a
   currently free-agent player carrying a historical old-team game;
6. the exact rolling-plus-provider-Eastern date union without full-season
   polling;
7. fail-closed missing/wrong historical schedule, team, start, game, or
   explicit PlayerGame-row cases;
8. exact configured-provider enforcement and source-version changes for each
   bound request, membership, schedule, and row input; and
9. completion CAS rejection for roster, mapping, exclusion, sealed-baseline,
   required-game, or week-status races while the prior successful refresh
   remains authoritative.

This schema-v1 correction is included in the final migration-0030 freeze and
its migration-specific gates above. Application behavior gates remain owned by
FAD-05 and later slices. This amendment changes no deployed compatibility
contract and authorizes no synthetic fallback.

### Recorded 2026-08-01 Signed Live-Provider Capability Gate

FAD-05 local closure now includes an implemented, fail-closed capability
command and verifier; the real-provider execution remains in FAD-18. The
approved contract is:

- live mode is exactly `disabled`, `probe`, or `required`;
- only `SPORTSDATAIO_NHL_LIVE_API_KEY` can bind live evidence; the legacy
  staging-import key is never a fallback;
- `disabled` and `probe` compose no application live adapter;
- the probe publishes a canonical signed artifact beneath the validated
  persistent root, bound to the exact credential by a domain-separated HMAC
  with an independent capability secret;
- the artifact is valid for exactly 24 elapsed hours and is bound to the
  environment, exact backend build, origin, configured current season,
  version-controlled probe manifest, credential version, request, sanitized
  capture, endpoint proofs, explicit-zero pair, omission proof, and assertion
  set;
- no credential or raw provider payload is persisted, logged, serialized, or
  emitted; endpoint evidence retains only scope, HTTP status, row count, and
  exact-response-byte SHA-256;
- the offseason-safe manifest uses the immediately previous completed NHL
  season for totals plus one exact zero-stat historical schedule/PlayerGame,
  while current Players and FreeAgents prove `no_due_game` and `no_team`;
- an in-memory controlled omission of that zero-stat PlayerGame must fail as
  incomplete;
- atomic publication uses an owned exclusive lock, mode-0700 directory,
  mode-0600 same-directory temporary file, fsync, atomic rename, and final
  reread verification while preserving any prior valid artifact on failure;
  and
- `required` synchronously verifies every binding before SQLite open and
  composes exactly one live adapter only after success.

### Recorded 2026-08-11 FAD-18 Provider Tool Addendum

This addendum records the provider tool interfaces and local evidence only. It
does not define a shorter deployment path. The authoritative operational order
is the FAD-18 maintenance-hold sequence below and the linked hosted runbook:
auxiliary bridge held on the old schema-22 path; read-only discovery from a
verified private OS-temporary copy with the persisted hold inherited; operator-
reviewed manifest commit; final-candidate preflight; exact final build deployed
held for old-path backup, distinct inactive clean-restore proof, and complete
fresh-path reset/import at a different path; the same final build activated
hold-false in `probe` on only the new schema-49 path; check; per-process required
verifier while the service remains `probe`; then persistent `required` startup.
Build, pre-deploy, Render one-off-job, and start-command probes remain
prohibited.

Local acceptance adds fixed digest/HMAC vectors, closed-schema and tamper
matrices, historical-offseason and controlled-omission fixtures, no-artifact
provider-failure cases, secret/raw-payload non-disclosure, atomic publication
and filesystem-attack cases, all three composition modes, pre-database startup
failure, legacy-key isolation, cross-environment rejection, and Render
blueprint assertions.

The read-only discovery command passes its focused foundation, the
independent artifact verifier passes its focused `6/6`, and their focused
combined gate is recorded in the current FAD-18 section. The complete six-file
provider-capability family is also recorded there. These green local tools do
not themselves prove or commit the real provider manifest, supply the paid key,
isolated database, disk, signing configuration, operator access, or release/
deploy identities. Those external inputs remain FAD-18 blockers. Production
remains unauthorized.

### FAD-05 Closure Record - 2026-08-01

FAD-05 is complete locally. The implementation now includes explicit Week 1
selection, pre-open and completion-time whole-Monday recovery, generation-bound
matchup jobs, sealed player-game coverage/observation/exclusion evidence,
generation-safe scoring/finalization/correction, and one closed-batch,
never-rejecting post-commit late-lock coordinator across every current
authoritative roster-legality writer.

Trade acceptance, reversal, and commissioner transfers close the source
ownership tenure, create a distinct destination tenure at version `1`, and
persist exact old-to-new evidence. The table-driven writer audit explicitly
classifies trade-block updates as legality-neutral metadata outside the
coordinator. The only maintenance exclusions remain the exact closed staging
fixture reset and provider-catalog import; both reassert identity, closed writes,
disabled jobs, and no live/correction matchup through every persistence and
failure-bookkeeping boundary. Real HTTP composition tests prove the routes are
absent outside those exact conditions and reject live/correction state without
writes.

The `0023` through `0029` impact audit is complete: `0027` remains compatible
unchanged; `0028` preserves its schema-28 one-root behavior in a named trigger
that corrected migration `0030` replaces after generation lineage exists;
and `0023`, `0024`, `0025`, `0026`, and `0029` are safe only as pre-`0030`
scaffolding in one controlled `22 -> 30` batch. Migration `0030` supersedes
those terminal shapes, refuses pre-amendment business rows, and is locally
frozen at `636,077` bytes and SHA-256
`6f46b7a8c52108adfc0b51dc1eb9cdcab0ed274482ca396a31f7d45e42c07184`.
The final schema inventory is `124` application tables, `125` including the
migration ledger, `124` repository-catalog entries, `42` post-reset require-
empty tables, `82` signed-reset-policy tables, and `60` immutable-delete guards.

Focused gates include `242/242` matchup/statistics tests, `196/196` migration
and amendment tests, `31/31` deployed-runtime tests, `3/3` writer-registry
tests, and `36/36` reset/import-artifact tests. The staging-only
migration-report command now raises and read-back verifies a command-scoped,
bounded `60000` millisecond lock wait on both connections; the ordinary
application default remains `5000` milliseconds. A deterministic writer-lock
hold beyond five seconds proves two real command processes still converge on
one commit and one read-only replay. The complete stable backend tree then
passed in one exact Node `24.14.1` bounded-concurrency run: `2,145` tests across
`337` suites, `2,143` passed, zero failed, and two Windows link-capability
subtests skipped because symlink/file-link creation was unavailable. Their
fail-closed paths passed. The real signed SportsDataIO capability execution
remains an explicit FAD-18 isolated-staging gate; it does not block subsequent
local slices.

No shared database was opened, no staging or production change occurred, and
no FAD Candidate/auction HTTP route or worker was enabled at this closure.
At this `FAD-05` closure, `FAD-06` became the sole active slice; it has since
closed locally under the result recorded below.

## FAD-06 - Auction Contexts, Reads, and T-081-T-083

### Result

`COMPLETE - LOCAL ONLY (2026-08-02)`

`T-076` and `T-078` now provide exact read-only, league-isolated active and
terminal auction projections with deterministic normalized SQL selection and
no competing active-bid values. Ordinary-context `T-080` through `T-083` use
one canonical administration service and immutable original-response
idempotency evidence. The real composed `T-083` route creates the exact
durable target job, and the shared worker commits one ordinary resolution,
contract, ownership, activity item, and league-scoped outbox event.

The final auction-family gate passed `161/161` across `22` suites in `17`
files; the final projector-alignment repository check passed `10/10`; and the
fresh full-migration composed runtime proved authenticated paging, own-bid
visibility, cross-manager value privacy, exact envelopes, and zero GET writes.
The terminal player-source P2 raised during independent review was corrected,
and refreshed verification leaves no remaining P1 or P2 issue. No shared
database was opened and no staging or production change occurred. The stop
condition below remains authoritative. At that historical closure, `FAD-08`
became the sole active slice; `FAD-08` through `FAD-14` have since closed
locally. `FAD-15` through `FAD-17` have also since closed locally, and
`FAD-18` is now the sole active slice.

### Change

Add server-owned auction contexts, safe active and terminal read contracts,
ordinary context compatibility, commissioner/member-platform-administrator bid
removal, auction cancellation, and durable due-only manual resolution. The
scheduled resolver and manual resolver must call the same application service.
Every successful `T-080` through `T-083` HTTP command persists one immutable
original-response result linked to its idempotency request.

### Gate

- request/response bodies, status codes, `If-Match`, idempotency, and actor
  attribution match the approved API contract;
- `edit_bid`/`auction.bid.put`, `remove_bid`/`auction.bid.remove`,
  `cancel_auction`/`auction.cancel`, and
  `request_resolution`/`auction.resolve.request` each persist exactly one
  version-1 result for a successful operation + actor + client-key scope,
  while every failure persists neither a new idempotency request nor a result;
- only `request_resolution` requires `job_run_id`, bound to the exact
  `auction.resolve.target` occurrence
  `auction:<auctionId>:<resolvesAtMs>`; its response `operationId` and
  `occurrenceKey` come from that durable job, and all other actions require the
  link null;
- fixed `canonical-json-v1` request/response SHA-256 vectors pass, result and
  completed-idempotency evidence reject update/delete, and changed-input key
  reuse leaves the original pair untouched;
- version constraints prove edit/removal = expected + 1, cancellation >
  expected, and resolution request = expected, with replay retaining the
  stored representation and version evidence;
- exact replay after later bid, auction, correction, or job-state changes
  returns the stored original HTTP status and response `data`, including the
  originally accepted `T-083` status;
- active reads reveal no competing active bid value, including through the
  real authenticated target-runtime route on a freshly fully migrated schema;
- opaque cursor paging is bounded and stable, and both collection and detail
  GETs leave SQLite `total_changes` unchanged;
- terminal detail remains directly readable after conflicting provider
  positions and after the preferred current player-source row is replaced;
- restricted `eligibleTeams[]` preserves the original Candidate-tie allowlist
  while `viewerTeams[]` independently reports a later participant removal;
- ordinary weekly ranking, pricing, timing, and assignment are unchanged;
- manual resolve cannot resolve an auction before it is due;
- all ordinary auction HTTP, domain, repository, job, and characterization
  suites pass.

### Stop Condition

FAD-linked removal, cancellation, and resolution cases remain blocked until
`FAD-11`. No restricted auction may become `Active`.

## FAD-07 - Pure FAD Domain and Repositories

### Result

`COMPLETE - LOCAL ONLY (2026-08-01)`

The final acceptance gate passed `276/276` tests across `33` suites on exact
Node `24.14.1`, and an independent read-only audit found no P1/P2 blocker. No
FAD HTTP route or worker was composed, no shared database was opened, and no
staging or production change occurred.

### Change

Implement the approved backend module boundary without exposing an HTTP
workflow:

```text
src/domain/freeAgentDraft/
  freeAgentDraftPolicy.js
  candidateCardPolicy.js
  candidateAllocationPolicy.js
  freeAgentDraftAuctionDrawPolicy.js
  freeAgentDraftScheduleRecoveryPolicy.js

src/application/services/freeAgentDraft/
src/infrastructure/persistence/sqlite/SqliteFreeAgentDraftRepository.js
src/infrastructure/persistence/sqlite/SqliteCandidateCardRepository.js
src/infrastructure/persistence/sqlite/SqliteFreeAgentDraftJobRepository.js
```

Cover status transitions, 22 canonical slots, carryovers, strict whole-card
structural/cap and contract validation, allocation ranking, strict-improvement/fallback rules,
deterministic draw framing, nomination queueing, schedule recovery, and
repositories for readiness, cards, snapshots, allocations, initial/extension
rollovers, recovery, participants, fallback, queues, and draws.

### Gate

- all same-league and uniqueness constraints pass;
- exact cents, AAV, minimum AAV, Bench limit, and negative cap-space cases
  pass;
- normal and fantasy-ELC Active/Bench/Injured Reserve carryovers pass;
- allocation is highest total, then highest AAV;
- only equal total and equal term is an exact allocation tie;
- an unresolved carried-roster structural conflict or an over-cap projection
  excludes every new offer, while individually valid entries on a conflict-
  free incomplete, cap-compliant card participate;
- a seeded restricted minimum is not an active bid and cannot win without a
  current strict improvement;
- no-improvement fallback, open no-bid, no-reservation, and binding over-win
  policies pass;
- exact top ties in restricted and open FAD auctions use the same approved
  draw;
- canonical draw vectors and unbiased rejection sampling pass;
- pure policies use no clock, network, or database;
- no runtime route or job is composed.

## FAD-08 - Automatic Readiness, Navigation, and Carryovers

### Change

Implement the amended `T-126` through `T-129` boundary: viewer-filtered
navigation and overview, read-only automatic-readiness/blocker projection,
idempotent retry of the same blocked readiness occurrence, Entry Draft
completion/no-draft transaction-bound handoff primitive, T-036/T-037 trigger
composition, T-095 same-occurrence corrective requeue, participating-team and
Week 1 snapshots, 22-slot cards with version-one open revisions, seven initial
rollover records, durable jobs, and authoritative carryover materialization.
Full T-108 selection, forfeiture, timeout, and Entry Draft UI remain M8-deferred;
FAD-08 proves only the reusable internal handoff with a simulated final caller.
There is no commissioner FAD setup command or client-supplied opening clock.

### Gate

- T-127 GET and the internal readiness preflight independently prove no writes;
  there is no readiness-preview route;
- readiness is all-or-nothing and replay-safe, so every participating card
  opens in one commit or none opens;
- a commissioner retry accepts no setup path, opening time, Entry Draft
  override, team list, or no-draft reason and can only re-enqueue the same
  durably blocked operation;
- only a completed Entry Draft, an inaugural league, or the exact one-time
  Season 2 exemption qualifies;
- the future final T-108 selection or confirmed-forfeiture transaction commits
  Entry Draft `Complete` and the exact `entry_draft_completed` handoff together;
  there is no standalone/manual completion or handoff route;
- the shared primitive requires the caller's transaction, validates the real
  trigger source, creates one canonical pair, and rolls back with the caller;
- T-036 and T-037 own their exact no-draft triggers, while confirmed T-095 may
  evidence/requeue only the same blocked genuine-inaugural occurrence after
  supplying its missing schedule;
- deadline equals exactly `firstWeekStartsAtMs - 168 elapsed hours`;
- help opens exactly 48 elapsed hours before deadline or at card opening when
  less than 48 hours remain;
- reminder is exactly 72 elapsed hours before deadline;
- seven initial rollover records use exact elapsed boundaries; later extension
  records are created only by durable queued/fallback/recovery work;
- participating teams, Candidate deadline, and FAD rollover history are frozen;
  competition Week 1 may move only through the approved server-owned recovery;
- only approved Active/Bench/Injured Reserve normal and fantasy-ELC
  carryovers materialize;
- prospect rights, retention, buyouts, and other obligations do not consume
  Candidate slots;
- pre-deadline overview and navigation reveal no other team's players,
  contracts, help message, or private counts.

### Result

`COMPLETE - LOCAL ONLY (2026-08-08)`. The composed readiness worker/runtime,
all-or-none carryover opening, shared internal handoff and real caller
integrations, and T-126 through T-129 pass the final `336/336` behavior gate.
The schema-33 package passes `64/64`; migration `0033` is pinned at `56,084`
bytes and SHA-256
`93714178a4c89687578ca340afbe69c317239118cb50765838e6123ff6faf7f1`.
The T-128 acceptance path proves the original receipt remains exact and
write-free after later terminal success. Shared staging and production were not
opened or changed.

### Stop Condition

Do not expose the workflow to shared staging.

## FAD-09 - Candidate Card Editing, Help, and Synchronization

### Status

`COMPLETE - LOCAL ONLY (2026-08-08)`

### Completed Impact Audit

The FAD-09 impact audit and T-130/T-133-through-T-139 implementation are
complete. Route scope resolves the authoritative hidden season/card; the exact
22-slot private DTO, manager-first authority, normalized card-bound search,
pure preview, authoritative writes, carryover movement, delete, and help are
composed through the Candidate repository, service, HTTP router, and target
runtime. The eight routes were exposed together only after their complete
write/help/synchronization boundary passed.

The completed mandatory pre-exposure seams are:

- Candidate replay re-establishes current exact-card authority before receipt
  lookup, precedes later mutable validation, and returns the immutable original
  status and representation;
- T-137 supports candidates and compatible carryovers, with carryover movement
  updating authoritative roster position and card revision in one transaction;
- T-139 persists the normalized optional message and immutable command result
  with private audit, current-authority notifications, and scoped outbox effects;
- every authoritative summer writer uses the same transaction-bound Candidate
  synchronizer; and
- semantic bulk provider changes create durable per-player/per-open-FAD
  occurrences and shared-lease jobs, while deadline reconciliation performs the
  final sync, terminalizes outstanding work as `deadline_reconciled`, and fences
  stale workers.

The canonical FAD technical specification, shared API contracts, testing
strategy, and endpoint checklist record these seam decisions. Migrations `0023`
through `0029` and completed local FAD foundations were audited before staging.
The T-133 query-plan audit required additive index-only migration `0034`;
immutable help-result evidence required additive migration `0035`; and semantic
provider eligibility occurrence/job/event sealing required additive migration
`0036`. The current target is schema `36`, with `129` application tables and
`130` including the migration ledger. Frozen identity, fresh/upgrade, catalog,
reset-policy, delete-guard, staging-verifier, and reset-bootstrap gates pass.

### Change

Implement the private Candidate Card projections, eligible-player search,
preview/add/edit/move/delete commands, aggregate concurrency and idempotency,
authoritative advisory carried-roster structural-conflict and whole-card cap
projection with no manager acknowledgement control, adaptive help
request/grant beginning at `max(openedAtMs, deadlineAtMs - 48 hours)`, and
transactional summer synchronization hooks for roster, contract, trade,
buyout, prospect, correction, and player-state changes.

### Gate

- two-league, two-team privacy tests pass;
- T-130 returns the exact private root and all 22 canonical slots, remains
  read-only during deadline processing, rejects every private route after
  publication, and performs no write or side effect;
- a commissioner cannot read or edit a manager's card without that exact
  team's active help grant;
- authorization records exact assignment, grant, actor, and expiry evidence;
- carryover slots cannot be removed or edited;
- stale writes return the approved concurrency failure and replays do not
  duplicate revisions;
- current exact-card authority is checked before replay lookup; exact replay is
  checked before later phase, deadline, freeze, version, resource, and business
  validation and returns the immutable original status/representation;
- eligible-player search normalization, ordering, cursor binding, and privacy
  pass malformed, stale, cross-filter, cross-slot, cross-card, and two-league
  cases;
- revision preview ignores supplied concurrency/idempotency headers and is
  proven byte-for-byte and semantically read-only and incapable of creating a
  durable identity or command token;
- candidate commands return the complete current card; compatible carryover
  movement changes authoritative roster position atomically, while cross-scope
  entries use the safe Candidate entry-not-found result;
- cap and legality projections are backend-authored;
- help is available only in
  `[max(openedAtMs, deadlineAtMs - 48 hours), deadlineAtMs)`;
- a card opened with exactly or less than 48 hours remaining exposes help
  immediately;
- help messages do not leak into activity, logs, outbox, or other projections;
- help accepts the exact empty/null/normalized message grammar, preserves fresh
  `201`, existing-active new-key `200`, and exact-replay original status, and
  atomically writes only the approved private evidence and audiences;
- each affected summer mutation and its card revision commit or roll back
  together;
- deadline processing consumes any outstanding eligibility revalidation.

### Result

`COMPLETE - LOCAL ONLY (2026-08-08)`. T-130 and T-133 through T-139 are
jointly exposed in the local target runtime, increasing the target endpoint
inventory from `102` to `110`. Candidate writes, help, authoritative summer
mutations, semantic provider revalidation, shared-lease worker execution, and
deadline reconciliation use the transaction-bound Candidate synchronizer.

The launch defaults are `fad_candidate_write` at `120` per session and `600`
per league per `15` elapsed minutes, `fad_help_write` at `5` per session and
`25` per league per elapsed hour, and `fad_operational_write` at `30` per
session and `120` per league per `15` elapsed minutes. Closure gates pass
`60/60` provider occurrence/job/deadline tests, `262/262` summer-writer tests,
`36/36` direct Candidate HTTP-boundary tests, `66/66` composed-runtime tests,
`9/9` local staging-verifier regression tests, and `8/8` reset-bootstrap tests.
No shared staging or production environment was opened or changed.

## FAD-10 - Deadline, Whole-Card Legality, Publication, and Allocation

### Status

`COMPLETE - LOCAL ONLY (2026-08-09)`

### Change

Implement reminder and deadline jobs, immutable 22-slot snapshots, per-player
allocation occurrences, strict whole-card structural/cap disposition, independent
deterministic allocation, exact requested-slot contract/ownership placement and
lock, publication, results, and aggregate team notifications.

### Gate

- before, exactly at, and after deadline behavior passes with injected clocks;
- DST, lease, restart, and replay cases pass;
- no overdue reminder is sent;
- writes reject immediately at deadline;
- no card publishes before the complete league snapshot commits;
- every new offer on a card with an unresolved carried-roster structural
  conflict or an over-cap projection is excluded as one deterministic card-
  wide outcome, with carryovers preserved and no arbitrary valid subset;
- conflict-only, over-cap-only, both-illegalities, and reason-precedence cases
  pass while cap status independently reports any overage;
- total conflict count matches every unplaced entry, carried-roster conflict
  count matches only unplaced carryovers, and a candidate-only conflict is
  excluded individually without disqualifying other valid offers;
- individually valid offers on a conflict-free incomplete, cap-compliant card
  participate while missing or invalid entries remain empty;
- sole candidate, highest total, equal-total highest-AAV, exact tie,
  all-invalid, and ownership-race cases pass;
- one player's failure does not roll back another player's valid result;
- replay creates no duplicate contract, ownership, revision, activity,
  notification, result, or auction;
- private card reads reject after publication and published history rejects
  before publication;
- exact ties remain scheduled or quarantined and cannot activate prematurely.

### Result

The deadline reminder, final reconciliation and lock, immutable 22-slot
publication, whole-card disposition, T-131/T-132/T-140 reads, independent
per-player awards and correction quarantine, aggregate automatic results, and
allocation lifecycle are composed locally. One scheduler cycle runs the
coordinator before the per-player runner and again afterward, before ordinary
auction resolution. The zero-allocation path uses the same coordinator-owned
direct transition to `rapid`. Exact ties remain scheduled or quarantined for
the future restricted-auction privacy and activation gate.

### Verification

- FAD-10 closure matrix: `200/200` across `23` suites;
- composed target-runtime gate: `4/4`;
- allocation coordinator gate: `18/18`;
- shared auction regression: `103/103`; and
- post-amendment deadline-reminder gate: `7/7`.

The target endpoint inventory is `113`. No frontend caller is connected. No
shared staging or production environment was opened, migrated, or changed.

## FAD-11 - Recovery, Correction, and FAD Auction Administration

### Status

`COMPLETE - LOCAL ONLY (2026-08-10)`

### Change

Implement `T-141` through `T-144` and complete the FAD-linked cases for
`T-080` through `T-083`: safe recovery reads and actions, deterministic
fingerprinted correction, linked bid removal, cancellation, durable manual
resolution, queued-nomination activation recovery, fallback reconciliation,
completion-bound schedule recovery, and persistent quarantine. There is no
standalone `recover_schedule` action: only `complete_fad` may re-enter the one
transaction that commits the completed FAD gate, both completion timestamps,
Week 1/schedule/job changes, and immutable recovery evidence.

### Gate

- recovery GET and preview hashes prove no writes;
- recovery retries the same scheduled application service;
- `recover_schedule` is absent/rejected, and no schedule-recovery evidence can
  commit outside the successful `complete_fad` transaction;
- a correction cannot choose a different valid winner;
- correction performs one atomic historical reconciliation;
- restricted participant removal is permanent;
- removing the last eligible restricted improvement follows the same
  no-improvement fallback path as scheduled resolution;
- restricted cancellation always enters explicit `correction_required`
  quarantine without selecting a winner or creating a fallback;
- failed open-rapid cancellation is terminal and releases a player only when
  no other block exists;
- neither a manager nor a commissioner can cancel a valid queued nomination;
  activation retry and objective invalidation preserve its private player/bid
  payload until opening;
- quarantine survives FAD completion and ordinary weekly auction creation.

### Result

T-141 through T-144, the FAD-linked T-080 through T-083 administration cases,
atomic FAD completion, and the shared transaction-owned restricted
no-improvement fallback primitive are complete locally. Migration `0040`
advances the current local schema to `40` and admits only the exact temporary
restricted-source/fallback overlap required by that atomic handoff. The local
target runtime exposes `117` unique endpoint contracts.

FAD resolution execution and future fallback/restricted activation are not yet
composed into the scheduler. Those boundaries remain explicitly owned by
FAD-12 and FAD-13.

### Verification

- broader recovery/correction/administration matrix: `197/197`;
- schema/runtime matrix: `96/96`;
- ordinary-auction compatibility matrix: `62/62`;
- complete administration repository: `40/40`; and
- JavaScript syntax checks: passed.

All recorded commands used exact Node.js `24.14.1`. No frontend, shared
staging, or production environment was opened, migrated, or changed.

## FAD-12 - Restricted Improvement, Fallback, and Exact-Top Draw

### Status

`COMPLETE - LOCAL ONLY (2026-08-10)`

### Result

Restricted strict-improvement bidding, read capability, exact-top committed
draw, no-improvement fallback, allocation-linked fallback resolution, delayed
activation, deterministic failure recovery, transient reclaim, repeated T-142
retry, winner persistence, and post-commit late-lock coordination are composed
and verified locally through schema `43`. Direct and queued open-rapid auction
resolution was rejected at this boundary and remained FAD-13 work at that
checkpoint. No shared staging or production environment changed.

### Change

Implement allowlists, equal system minimums that are not active bids, immutable
public minimum evidence, a private strict opening improvement plus the ordinary
joining-team edit allowance, the ordinary 75-minute bid-activity cooldown, the
total-first/AAV-second cross-term floor, committed FAD-only draw evidence,
delayed activation, and a fresh league-wide 24-hour fallback with no leader
when no eligible current improvement remains.

### Gate

- nonparticipants cannot read private actions or bid;
- every tied participant receives the same system minimum but no bid, edit
  count, leader, or cooldown; its strict improvement is an opening bid and
  then receives the ordinary joining-team one-edit allowance;
- every active restricted bid ranks strictly above the Candidate floor under
  total-first/AAV-second comparison;
- an invalidated or commissioner-removed improvement does not count at
  resolution;
- no current eligible improvement closes the restricted auction without a
  winner or draw and opens a new league-wide 24-hour fallback with no leader;
- fallback bids may equal the floor but cannot submit the same total at a lower
  AAV;
- one or more improvements rank by AAV, then term, then the committed
  equal-chance draw among only the exact top tie;
- commitment hides the nonce and reveal reproduces fixed test vectors;
- open FAD exact-top ties use the same draw contract, while ordinary weekly
  auction tie behavior remains unchanged;
- activation occurs only with more than 60 minutes of fair access;
- otherwise activation uses the next contiguous FAD rollover, creating an
  extension when required; no restricted or fallback path is deferred into the
  ordinary weekly auction schedule;
- every restricted `T-076` through `T-083` case passes.

### Hard Gate

No restricted or fallback auction may become `Active` until `T-081`, `T-082`,
`T-083`, and `T-141` through `T-144` behavior is composed and verified.

## FAD-13 - Open/Queued Rapid Auctions, Extension Scheduler, and Completion

### Status

`COMPLETE - LOCAL ONLY (2026-08-10)`

### Result

Server-derived immediate and private queued starts, queued activation, direct
and queued rapid resolution, allocation-null and no-bid outcomes, contiguous
extension rollover finalization/recovery, atomic completion and whole-Monday
Week 1 recovery, matchup-start fencing, and ordinary weekly-auction handoff are
composed and verified locally through schema `47`. The target endpoint
inventory remains `117`. No frontend or shared environment changed.

### Change

Implement server-derived `fad_open_rapid` and restricted-fallback auctions,
private final-hour nomination queueing, context-aware no-bid and exact-top-draw
resolution, ordered and leased FAD jobs, seven initial rollover finalizations
plus contiguous extensions, restart-safe recovery, no-reservation/binding-win
semantics, atomic FAD completion and Week 1 recovery, and transition to ordinary
weekly auctions.

### Gate

- more than 60 minutes remaining permits new open-rapid auctions;
- exactly or less than 60 minutes privately queues a valid nomination and
  binding starter bid for opening at rollover, while existing auctions remain
  open for permitted bids and edits;
- a queued nomination opens atomically at rollover for the following full
  24-hour cycle, including an extension boundary when required;
- an open auction with no eligible bid closes without a winner and returns the
  player to the unclaimed pool for later renomination;
- outstanding bids reserve no cap, position, or roster capacity; every valid
  win binds even when combined wins make the roster illegal, and resolution
  never waits for a second prompt;
- seven exact initial 24-hour elapsed boundaries plus all required contiguous
  extension boundaries pass across DST and restart;
- transient work blocks rollover; terminal failure requires linked recovery;
- completion has no active, pending, queued, fallback, resolving, or
  correction-required FAD path;
- every allocation is in an approved accounted-for state;
- FAD completion and any required whole-Monday Week 1 recovery, schedule
  regeneration, and future-job replacement agree in one transaction;
- incomplete or illegal rosters do not create extensions or move Week 1;
- matchup start cannot commit while FAD processing remains unfinished and
  atomically revalidates against completion-time schedule recovery;
- ordinary weekly auctions open only after both season start and FAD
  completion and continue to honor quarantine.

### Verification

The following exact Node.js `24.14.1` records are separate and overlapping;
they must not be summed into one aggregate total:

- start-decision policy: `11/11`;
- immediate-start writer: `10/10`;
- FAD start/lifecycle: `23/23`;
- ordinary creation compatibility: `12/12`;
- queued activation: `125/125`;
- focused allocation-null resolution writer: `22/22`;
- focused resolution service/runner: `18/18`;
- broader allocation-null resolution: `73/73`;
- bid/read compatibility: `122/122`;
- schema-47/current-head: `280/280`;
- rollover policy/writer/service/runner: `42/42`;
- completion: `31/31`;
- runtime composition: `77/77`; and
- matchup-start guard: `15/15`.

The canonical writer-to-shared-JobRepository integration passes `1/1`, the
complete rollover writer passes `13/13`, and the shared JobRepository passes
`28/28`; these are supporting overlapping repository gates, not an additional
aggregate. At this historical FAD-13 checkpoint, migrations `0023` through
`0047` remained local only. No frontend, shared staging, or production
environment was opened, migrated, deployed, or changed.

## FAD-14 - Activity, Notifications, and Realtime Privacy

### Status

`COMPLETE - LOCAL ONLY (2026-08-11)`

### Approved Contract Decision - 2026-08-10

Grae confirmed that Candidate Cards become fillable only after Entry Draft
completion, or the already-approved no-draft equivalent, and successful atomic
readiness commit. Every current accepted manager receives one private
`fad_cards_opened` notification for each participating team/card they manage.
Non-managers receive no Candidate Card notification and retain only normal
League Activity visibility. No opening event may carry card, player, offer,
slot, contract-value, help-message, or bid data.

The successful opening transaction must create exactly these metadata-only
realtime publications:

- league `free_agent_draft.changed/cards_opened`;
- league `activity.created/cards_opened` for the existing
  `free_agent_draft_started` activity;
- per-card team `candidate_card.changed/card_changed`; and
- exact-recipient user `notification.created/cards_opened` for each
  `fad_cards_opened` notification.

`fad_cards_opened` is a notification type only, never an outbox event type.
The shared event family list includes `fad_nomination_queue.changed`, and
`related` contains exactly eight nullable stable IDs: `fadId`, `teamId`,
`cardId`, `allocationId`, `auctionId`, `recoveryId`, `nominationQueueId`, and
`scheduleRecoveryOperationId`. A queued nomination remains visible only to the
nominating team and exact protected recovery authority until its auction
opens, at which point normal authorized league-auction publication begins.

This decision resolved the FAD-14 contract ambiguity. Its implementation,
privacy, compatibility, and verification gates are now complete locally.

The approved FAD-14 closure also preserves
`fad_setup_exemption_authorized` as the explicit eleventh FAD Activity and
thirteenth FAD notification. Exactly the current eligible commissioner receives
the notification at destination
`{kind: commissioner_fad, leagueId, seasonId}` with deduplication identity
`fad_setup_exemption_authorized:<leagueId>:<seasonId>:<exemptionId>:<userId>`
and safe copy
`Initial Season 2 Free Agent Draft exemption authorized.` The committing
transaction publishes exactly league-audience `league.changed/league_changed`,
league-audience `activity.created/setup_exemption_authorized`, and
exact-recipient user `notification.created/setup_exemption_authorized`; all
eight `related` IDs are null and the private exemption reason is excluded.

### Change

Complete the approved event taxonomy, recipient and deduplication matrix,
notification destinations, metadata-only related IDs and reason codes,
league/team/user audiences, automatic-readiness blockers, private nomination
queueing, fallback and schedule-recovery events, publication invalidation, and
reconnect reauthorization.

### Gate

- Candidate Cards remain unavailable for editing until the complete readiness
  transaction commits after Entry Draft completion or its approved no-draft
  equivalent;
- opening creates only the four approved family/reason and audience sets, and
  `fad_cards_opened` remains notification-only;
- every current accepted manager receives the exact private notification per
  managed participating team/card, while non-managers receive none;
- every realtime event contains exactly the eight approved nullable `related`
  IDs, and `cards_opened` is an approved exact reason;
- every envelope `version` is the committed authoritative version of its
  `resourceId`, never an outbox version or guessed fallback; a
  `free_agent_draft.changed` allocation event names the FAD as `resourceId`
  and identifies the allocation only through `related.allocationId`;
- every approved notification type has exact recipients, one deduplication
  key, safe copy, and a valid destination;
- setup-exemption authorization preserves its exact safe Activity, resolves
  only the current eligible commissioner recipient, and commits the approved
  three-event metadata-only publication set;
- multi-team recipients deduplicate correctly;
- no pre-deadline player, offer, slot, help message, or active edited bid
  appears in errors, logs, activity, notifications, outbox payloads, or socket
  events;
- a queued nomination remains private until its auction opens, and readiness
  blockers expose no competitive card data;
- `cards_published` removes private caches;
- reconnect repeats authorization rather than trusting a stale subscription;
- all existing realtime invalidation behavior remains functional.

### Result

The approved Activity and notification registries, exact recipient and
deduplication matrix, safe destination validation, canonical eight-related-ID
Socket.IO envelopes, opening and setup-exemption publication sets, private
queued-nomination audiences, automatic-readiness blockers, cache invalidation,
and reconnect reauthorization are implemented and verified locally. The setup
exemption remains the explicit eleventh FAD Activity and thirteenth FAD
notification and commits only its exact current-commissioner-safe metadata.

Migration `0048_require_canonical_fad_realtime_evidence.sql` is frozen at
`73,524` bytes, `1,490` lines, and SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`.
It is the preserved schema-48 intermediate checkpoint. Migration
`0049_require_canonical_fad_setup_exemption_publications.sql` is frozen at
`29,571` bytes, `748` lines, and SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`.
Schema `49` is current locally with `131` application tables, `132` including
the ledger, and `131` repository-catalog entries. The target endpoint inventory
remains exactly `117`.

### Verification

Separate evidence on pinned Node.js `24.14.1` records:

- focused FAD-14 core: `1,294/1,294` tests across `142` suites and `110`
  unique test files, with zero failure, cancellation, skip, or todo;
- production JavaScript syntax: `95/95` files;
- schema-49 pin/runtime/reset/release/staging-verifier selection: `265/265`;
- former-failure consolidation: `189/189`; and
- authoritative full backend: `3,266` tests across `436` suites, `3,264`
  passed, zero failed, cancelled, or todo, and two intentional Windows link-
  capability skips in
  `sportsDataIoLiveCapabilityArtifactFoundation.test.js`, in about
  `30m03.603s`.

The two skipped cases are specifically `symlink` because symlink creation is
unavailable and `target` because file links are unavailable. Their fail-closed
paths remain covered. Migrations `0023` through `0049` remain local only. No
FAD frontend, shared database, staging, or production environment was opened,
migrated, deployed, or changed.

### Stop Condition

The local privacy gate is complete. No backend FAD workflow is shared-
environment launchable until the later frontend, integrated-local, reset,
migration, backup, and isolated-staging gates are complete.

## FAD-15 - Frontend Candidate Card Preparation Workflow

### Status

`COMPLETE - LOCAL ONLY (2026-08-11)`

### Change

Create `src/features/freeAgentDraft/` and implement server-directed navigation,
automatic-readiness status and exact blocker/retry controls, private Candidate
Card building, multi-team selection, eligible-player search, adaptive help
request and help-authorized editing, roster entry points, authoritative clocks,
query metadata/evidence, keyboard behavior, and narrow-screen layouts. The
frontend must not present a manual FAD setup form or opening-time control.

### Gate

- main navigation appears only from server-authored capabilities;
- readiness retry sends no setup path, opening time, team list, Entry Draft
  override, or no-draft reason;
- readiness retry binds the exact blocked operation version and canonical job,
  writes one immutable `202` receipt with the guarded requeue, advances a real
  repeated-blocker attempt, returns that same receipt on exact replay after
  later success, and rejects stale `If-Match` with
  `FAD_READINESS_PRECONDITION_FAILED`;
- the three readiness triggers use completed Entry Draft ID, inaugural target
  season ID, or initial-Season-2 exemption ID as their exact occurrence
  resource, and opening writes `free_agent_draft_started` League Activity
  separately from `fad_cards_opened` notification evidence and the four
  approved metadata-only opening-publication sets;
- there is no global inferred "my team";
- private card and published history use separate query keys;
- assignment, help, publication, and deadline evidence clears unauthorized
  private queries and rendered data;
- no Candidate Card data is persisted in local or session storage;
- a concurrency failure preserves only safe unsaved input;
- the frontend does not calculate locks, cap authority, eligibility, or timing;
- desktop, narrow-screen, keyboard, focus, and accessibility tests pass.

### Result

The server-directed navigation, readiness/retry, multi-team private Candidate
Card builder, eligible-player search, adaptive help, help-authorized editing,
roster entry points, authoritative clock presentation, query isolation,
concurrency handling, keyboard/focus, and responsive workflows are complete
locally. No manual opening parameter or client-authoritative FAD calculation
was added.

## FAD-16 - Frontend Results, Auctions, Recovery, and Notifications

### Status

`COMPLETE - LOCAL ONLY (2026-08-11)`

### Change

Implement published cards and results, open and restricted auction views,
restricted-minimum/improvement and league-wide fallback explanations, private
queued-nomination confirmation, terminal no-bid/draw detail, an
always-discoverable commissioner recovery panel, schedule-recovery state,
notification destinations, and the complete audience-aware realtime refresh
matrix.

### Gate

- active and terminal deep links resolve after refresh;
- server capabilities control every action;
- edited competing active bids never render;
- queued nominations expose only the submitting team's private confirmation
  until opening;
- the UI distinguishes a restricted minimum from an active improvement and
  explains the no-improvement fallback;
- no-bid unclaimed, exact-top draw, extension rollover, and moved-Week-1
  outcomes render from server-authored evidence;
- correction, recovery, and historical results refresh correctly;
- notification links reauthorize before displaying private data;
- reconnect and cross-league cache isolation pass;
- focused tests and the complete frontend lint, test, build, browser-authority,
  and dependency gates pass.

### Result

Published cards and results, direct/restricted/fallback auction presentation,
private queued nomination confirmation, no-bid and draw evidence, commissioner
recovery, schedule-recovery state, notification destinations, active and
terminal deep links, audience-aware realtime refresh, reconnect
reauthorization, and cross-league cache removal are complete locally. Competing
sealed bid values remain absent from rendered, cached, and reconnect state.

The combined FAD-15/FAD-16 frontend gate on exact Node.js `24.14.1` passes
`316/316` tests across `52` files, repository-wide lint, the production build
across `1,782` transformed modules, dependency inspection, and browser-authority
verification across `19` compatibility files and `154` shipped source files.
The build reports only the existing advisory for one minified chunk above
`500 kB`. V8 coverage for `src/features/freeAgentDraft/` records
`1,754/2,012` statements (`87.17%`) and `1,262/1,577` branches (`80.02%`).

## FAD-17 - Integrated Local Launch-Candidate Proof

### Status

`COMPLETE - LOCAL ONLY (2026-08-11)`

### Change

Run the complete workflow on deterministic disposable local databases with at
least two isolated leagues, accelerated clocks, injected delays and failures,
process restarts, recovery actions, and browser coverage.

### Gate

- the recorded historical `0023` through `0029` impact audit is complete and
  fresh plus exact `22 -> 49` and fresh-schema-49 migration rehearsals pass
  with exact ledger, integrity, foreign-key, and catalog agreement;
- deterministic reset/cutover rehearsal passes without modifying the approved
  reset manifest;
- all focused and complete backend gates pass;
- all focused and complete frontend gates pass;
- `T-126` through `T-144` and FAD cases for `T-076` through `T-083` are marked
  `LOCAL VERIFIED` only from recorded evidence;
- GET and preview table-hash checks prove read-only behavior;
- two-league, assignment, help, commissioner, member-platform-admin, and
  anonymous boundaries pass;
- scheduled Entry Draft-start rollover, automatic all-or-none readiness, two
  Week 1 choices, pre-open and completion-time schedule recovery, DST, restart,
  lease, quarantine, correction, extension cycles, and ordinary-auction
  transition pass;
- desktop, mobile, keyboard, accessibility, cache removal, and reconnect pass;
- no unexplained skipped test remains.

### Mandatory 2026-07-29 Amendment Acceptance Package

`FAD-17` cannot pass from generic suite success alone. Recorded automated and
integrated evidence must prove, at minimum:

1. the Entry Draft-start job, not an ordinary commissioner action, runs the
   rollover; a durable blocked attempt retries idempotently and drafting/trading
   remain closed until success;
2. Entry Draft completion or the approved no-draft path opens all cards in one
   readiness transaction only when every prerequisite passes, with exact
   blockers and a parameter-free retry when it does not;
3. card opening with more than, exactly, and less than 48 hours remaining
   derives the approved adaptive help window;
4. a late Entry Draft advances Week 1 by one and multiple whole Mondays until a
   future deadline and full initial seven-day period fit;
5. a card with an unresolved carried-roster structural conflict or an over-cap
   projection preserves carryovers but excludes every new offer, while a
   conflict-free incomplete, cap-compliant card submits each individually
   valid offer;
6. tied Candidate offers are minimums rather than active leaders; no eligible
   current strict improvement produces no restricted winner/draw and creates a
   fresh league-wide full-cycle fallback with no leader;
7. exact top ties in both restricted and open FAD auctions use the same
   auditable equal-chance draw and stable replay, while every non-tied,
   no-bid, and no-improvement terminal FAD auction reveals the original
   commitment with `selectionUsed = false` and no selected bid/team;
8. nominations committed more than, exactly, and less than 60 minutes before a
   rollover follow the open-or-private-queue boundary, and queued starter bids
   open atomically for the following full cycle without privacy leakage; a
   cross-team collision returns only generic quarantine state and discloses no
   queue, player, team, bid, or timing cause;
9. open auctions with no eligible bid close unclaimed and permit later
   renomination;
10. simultaneous independent bids reserve no cap or roster capacity, every
    valid win binds, and scheduled resolution never waits for another
    confirmation even when aggregate wins make the roster illegal;
11. the first seven daily boundaries and more-than-seven extension cycles
    remain contiguous and restart-safe until queued, fallback, delayed, and
    recovery work is terminal;
12. FAD completion before Week 1 leaves the schedule unchanged, while
    completion at or after Week 1 atomically chooses the first valid later
    Monday, regenerates the remaining schedule, replaces future jobs, and wins
    any race with matchup start without partial state;
13. late/incomplete team roster legality does not itself extend FAD or move
    Week 1; and
14. a late legal matchup snapshot atomically persists immutable
    player/game/start/source evidence, excludes an already-underway NHL game in
    full including post-baseline events, and converges under replay and races;
    and
15. ordinary weekly auction ranking, pricing, tie handling, and history remain
    backward compatible after FAD completes.

Season 2 video generation stays disabled and nonblocking during this gate.

### Result

The mandatory local package is complete on exact Node.js `24.14.1`:

- schema-22-to-49, fresh-schema-49, repository-catalog, reset/cutover, and real
  two-league fixture gate: `28/28`, with no failure, cancellation, or skip;
- affected FAD resolution service, real SQLite writer, and durable job gate:
  `49/49`, with no failure, cancellation, or skip;
- representative amendment policy, writer, late-lock, and ordinary-auction
  compatibility gate: `202/202`, with no failure, cancellation, or skip; and
- real disposable two-league browser release matrix: `40/40` across desktop
  Chromium, mobile Chromium, desktop Firefox, desktop WebKit, and mobile WebKit,
  with zero retries.

The explicit acceptance gaps are closed: exact schema `22 -> 49` agrees with a
fresh schema; a no-bid player can be renominated under a distinct auction ID;
simultaneous bids reserve no capacity and all three scheduled resolutions plus
durable replay commit while two `$50` wins exceed a `$100` aggregate; video is
absent from the endpoint/service inventory and cannot block the real fixture;
and the two browser leagues use distinct Week 1 starts and distinct adaptive-
help chronology. GET/preview no-write, two-league authorization/privacy,
restart, lease, recovery, draw, queue, rollover, schedule, late-lock, and
ordinary-auction compatibility evidence also pass. T-076 through T-083 and
T-126 through T-144 are `LOCAL VERIFIED` from this evidence. No shared staging
or production resource was changed.

## FAD-18 - Authorized Isolated Shared-Staging Gate Through Maintenance Hold

### Status

`ACTIVE - ISOLATED STAGING AUTHORITY RECORDED; DEPLOYMENT BLOCKED`

Grae's `2026-07-29` instruction to continue until paused or staging deployment
authorizes this isolated staging gate once the conditions below pass. It does
not authorize production, use of production storage, or bypass of a verified
staging backup and rollback rehearsal.

### Deployment Unblocking Conditions

The externally mutating staging sequence may begin only after:

1. `FAD-17` is complete;
2. the historical `0023` through `0029` amendment impact audit, exact
   migrations `0023` through `0049`, and mandatory acceptance package are
   complete;
3. the staging resource identity is confirmed isolated from every production
   database, disk, secret, user, and league;
4. the auxiliary bridge commit and deploy identity are recorded and the
   disk-backed service is persistently configured with
   `STAGING_MAINTENANCE_HOLD=true` against the existing schema-22 path;
5. the stopped old instance, exact hold prerequisites, health-only surface,
   absence of database/application runtime composition, and attached-service
   shell reachability are verified;
6. the read-only discovery has run from that shell with the deployed hold value
   inherited rather than overridden, opened only a verified private OS-
   temporary copy of the sidecar-free guarded source, removed that copy before
   output, the operator has reviewed and committed its exact sanitized manifest,
   and final-candidate preflight passes with the checked-in hold default `false`;
7. that exact final candidate commit and build has been deployed once against
   the old path with the persisted hold still `true` before any disk mutation;
8. a current backup of the untouched schema-22 database is created and
   independently verified, then `db:restore-verify` passes against and records a
   distinct previously absent clean path that remains inactive;
9. the approved Season 1 reset/import creates a new schema-49 database at a
   distinct previously absent path, then the complete closed-write handoff
   publishes the reset/import verification artifact, creates the first platform
   administrator and reset original league in their approved order, commits
   and verifies one exact succeeded `migration_reports` row, and initializes
   the new database's deployed identity;
10. the old and new database paths and identities, backup, release, deploy,
    prior-deploy, activation, and rollback identities are recorded; and
11. the same exact final candidate can start on only the new path with
   `STAGING_MAINTENANCE_HOLD=false` in provider `probe` mode with jobs, FAD
   enablement, email delivery, league writes, and the application live adapter
   disabled.

Conditions 1 and 2 are complete locally. The local release preflight proves a
contiguous base-22-to-target-49 source with `49` migrations (`27` post-base),
migration checksum-set SHA-256
`6df4e827296ef3e63a143fb932f557b410511813ea421177afb7908fda15d636`,
`131` repository-catalog entries with SHA-256
`89b4eb536aef7c4c6d1519c5311f94c449109a55d8b71d130e5b952a157b49ff`,
`49` post-reset require-empty tables with policy SHA-256
`52d2d5ba6faaad9cc877132ad0153d8e52665b8aa0ae05394b685c9e48267808`,
valid reset-policy coverage, and a quiesced Render probe blueprint. Its focused
and adjacent gate discovered `158` tests: `156` passed, zero failed, and two
intentional Windows link-capability cases skipped; syntax, JSON, source check,
and whitespace checks pass. The provider discovery tool additionally passes
`14/14` focused tests, the independent verifier passes `6/6`, and their focused
combined gate passes `20/20`. The complete six-file provider-capability family
discovers `106` tests: `104` passed, zero failed, cancelled, or todo, and two
intentional Windows link-capability skips.
The hold/discovery/publisher/verifier transition passes `35/35`; the broader
nine-file entrypoint, Render, preflight, target-runtime, hold, and provider
matrix passes `125/125`, with zero fail, cancel, skip, or todo.

### Pre-Mutation Hosted Identity Checkpoint - 2026-08-11

A read-only hosting inspection records the current isolated staging rollback
inputs before any FAD-18 mutation:

```text
Render workspace:                         tea-d4prbj7diees738tmg90
Render staging service:                   srv-d9eo2turnols73ekb830
Render staging disk:                      dsk-d9eo2u6rnols73ekb8t0
Current live Render rollback deploy:      dep-d9kmv0ijobas73fsp8kg
Current live Render rollback commit:      fa85e75c904389284a030459cd8a68f452cdac02
Existing database path:                   /opt/render/project/data/hundo-staging/sqlite/hundo-leago.sqlite3
Existing database schema:                 22
Current ready Netlify rollback deploy:    6a6bede0e1742b6b750017cb
Published frontend source head:           29d4d89ea6def41464fc48b6390e7f567c480039
Bridge implementation commit:             1ad052300ef00e82c16e6abfe2d0f1cc5a15dfbd
Published backend bridge source head:      26cf9606b8ee1f33efeb9e667cd265f947bc5387
Auxiliary bridge deploy identity:          pending; not deployed
Final backend candidate commit/build:      pending provider-manifest commit
Final candidate held deploy identity:      pending; not deployed
```

The Render workspace also contains production resources, so every future
mutation must remain pinned to the exact staging service and disk above.
Inspection changed no environment value, deploy, disk, database, Netlify site,
or production resource. The existing deploy/commit remains the pre-FAD staging
rollback identity; it is not evidence that either published FAD source head was
deployed.

Deployment remains blocked by these exact prerequisites:

- the operator-reviewed provider-manifest commit, exact final backend candidate,
  and its release, deploy, prior-deploy, and rollback identities;
- successful auxiliary-bridge and exact-final-build-held Render deploys on the
  isolated persistent disk, proof that the old instance stopped before each
  replacement, and attached-service shell access;
- a live discovery against the quiesced isolated staging database, operator
  review and commit of the real
  `config/provider-capability/sportsdataio-live-probe-v1.json`, the dedicated
  paid-provider credential/signing configuration, and a successful disk-backed
  capability observation plus independent artifact verification;
- confirmed isolated Render, Netlify, database, disk, provider, secret, test-
  user, and league resources plus the required operator access;
- offsite object-storage and encryption configuration, a current encrypted
  backup, and a verified clean restore; and
- the approved isolated-staging reset/import, one exact succeeded schema-49
  migration report, new database identity, reconciliation evidence, explicit
  old/new path activation pair, and rollback record.

### Change

Deploy the schema-agnostic health-only bridge on the existing schema-22 disk,
run read-only discovery, commit the manifest, and preflight the final candidate.
Then deploy that exact final build still held, back up the untouched old path,
verify its restore at a distinct inactive clean path, build and verify the
approved reset/import at a different fresh schema-49 path, and explicitly
activate the same final build with the hold `false` in provider `probe`. The in-
place `db:migrate` route is excluded unless its persistent-root enforcement is
first hardened and accepted. Perform the mandatory amendment
acceptance package through browser, scheduler, Entry Draft lifecycle, restart,
recovery, migration, schedule, and league-isolation workflows.

### Gate

- schema metadata, migration ledger, and repository catalog agree;
- foreign-key and integrity checks pass;
- protected table counts and hashes reconcile;
- no writer can create a league event without a valid audience;
- scheduled Entry Draft-start rollover, automatic readiness, strict card
  legality, restricted fallback/draw, final-hour queue, extension cycles, and
  Week 1 recovery all pass against isolated staging resources;
- Render's persistent-disk replacement has stopped the old instance before the
  bridge starts, and the bridge's ready response proves only its generic
  maintenance listener, not application or database readiness;
- the bridge imports and opens no target/database runtime and composes no
  application route, job, Socket.IO, or email surface;
- the exact-argument read-only discovery runs first against a private OS-
  temporary copy of the quiesced, sidecar-free guarded old schema-22 database
  in `probe`, inherits persisted deployed `STAGING_MAINTENANCE_HOLD=true`, never
  uses an inline spoof, and removes the copy before output; the operator reviews
  and commits the sanitized manifest, and final-candidate preflight requires the
  checked-in hold default `false`;
- the exact final build is then deployed in hold for the verified old-path
  backup and distinct clean-restore proof, fresh-path reset/import, complete
  closed-write evidence/bootstrap/report handoff, and new database identity
  initialization; the old schema-22 file remains untouched, and activation and
  rollback record both database paths and build identities;
- transition out of the hold is explicit: only the same final build on the
  verified new schema-49 path starts with the hold `false` in `probe`;
- the zero-argument dedicated live-provider check passes from the disk-backed
  service in `probe`, publishes its sanitized 24-hour signed artifact, and
  controlled omission fails closed without shared league writes; it rejects
  before manifest/provider/artifact work unless the persisted hold is `false`
  and every normal-probe gate is quiesced;
- the zero-argument independent verifier passes once with required-mode
  verification configuration from the exact per-process invocation
  `SPORTSDATAIO_NHL_LIVE_MODE=required npm run data:verify:sportsdataio-live:staging`
  while the service remains in `probe`; the staging-only command requires the
  same hold-false write/job/FAD/email/debug/backup-schedule boundary with
  capture-only email before artifact read and does not persist the override;
- the same backend build then restarts in deployed `required` mode, re-verifies
  the artifact before database open, and composes one live adapter before any
  FAD route or job enablement;
- a restart between every durable job stage converges without duplicate or
  partial effects;
- all applicable endpoint rows reach `STAGING VERIFIED`;
- the manual QA and release checklists have recorded evidence;
- exact deploy IDs, commits, backup identity, migration evidence, and rollback
  state are recorded;
- production remains untouched.

Completion of `FAD-18` does not authorize production. Production migration and
deployment require a later explicit work plan or amendment and separate Grae
authorization.

## Verification Commands

Use exact Node `24.14.1`.

Focused backend examples:

```text
node --test test/foundation/<focused-test>.test.js
npm run check
npm test
git diff --check
```

Focused frontend examples:

```text
npm test -- <focused-test-paths>
npx vitest run <focused-test-paths>
npm run lint
npm test
npm run build
npm run verify:m3-browser-authority
npm ls --all
git diff --check
```

Migration commands must name an explicit disposable path:

```text
npm run db:migrate -- --database <absolute-disposable-db-path> --build <build-id>
```

The following is a command inventory, not an executable sequence. Use each
only at its numbered gate in the FAD-18 maintenance-hold procedure and hosted
runbook; the omitted bridge, final-held backup/reset, path activation, and
rollback steps must never be inferred away:

```text
npm run db:validate-reset
npm run data:discover:sportsdataio-live:staging -- --historical-date YYYY-MM-DD
npm run release:candidate:preflight
npm run data:check:sportsdataio-live:staging
SPORTSDATAIO_NHL_LIVE_MODE=required npm run data:verify:sportsdataio-live:staging
npm run release:qa:fixture
npm run release:qa:local
npm run release:qa:verify
```

The discovery command runs only from a deployed held service, copies the
sidecar-free guarded old schema-22 database to a verified private OS-temporary
snapshot, opens only that copy in `probe`, removes it before output, and inherits
the persisted exact hold value `true`. The provider check runs only after the
same exact final build
activates on the verified new schema-49 path with the persisted hold `false`.
The zero-argument verifier then runs once with required-mode verification
configuration through the exact per-process prefix above without persisting or
changing the deployed service mode. Both post-hold commands require hold
`false`, closed writes, disabled jobs, FAD/email/debug/backup scheduling, and
capture-only email before any provider, manifest, or artifact I/O. These are
staged operational gates, not a generic local command bundle.

Do not run a bare migration command against an ambiguous database. Do not
claim a command passed unless its output was actually recorded for that slice.

## Cross-Cutting Test Matrix

Across the sequence, evidence must cover:

- inaugural and continuing-season setup paths;
- exact one-time original-league Season 2 exemption;
- scheduled Entry Draft-start rollover, durable blockers, retry, and
  draft/trading gates;
- automatic all-or-none readiness with no commissioner setup command;
- two leagues and users with multiple managed teams;
- manager, help-authorized commissioner, commissioner without help,
  member-platform-administrator, unrelated member, and anonymous viewers;
- all 22 slots, carryovers, normal contracts, fantasy ELCs, cap limits,
  negative cap space, strict whole-card structural/cap exclusion, conflict-free
  incomplete cap-compliant cards, position changes, and summer synchronization;
- two distinct commissioner-selected Week 1 starts;
- before, exactly at, and after every help, deadline, cutoff, rollover, and
  completion boundary;
- adaptive help when cards open within 48 hours;
- `America/Vancouver` DST transition;
- process restart, lease loss, retry, replay, duplicate occurrence, delayed
  job, and partial per-player failure;
- sole candidates, total wins, AAV wins, exact ties, invalid offers, ownership
  races, restricted minimums, strict improvements, cross-term floors,
  no-improvement fallback, exact-top open/restricted draws, no-bid unclaimed
  results, cancellation, quarantine, correction, and recovery;
- final-hour private nomination queueing, no-reservation/binding aggregate
  wins, seven initial plus extension rollovers, and privacy before opening;
- one- and multi-Monday pre-open recovery plus atomic completion-time schedule
  recovery and matchup-start races;
- late legal snapshot/baseline creation with authoritative underway-game
  detection, immutable player/game/start/source evidence, full exclusion of
  post-baseline events for that game, replay, and racing restoration attempts;
- ordinary weekly auction backward compatibility;
- private projection, cache, activity, notification, log, outbox, and socket
  isolation;
- desktop, mobile, keyboard, focus, and accessible labels;
- an incomplete or illegal roster not delaying Week 1, while non-terminal FAD
  work invokes only the approved server-owned schedule recovery.

## Primary Risks

1. The amendment could leave `0023` through `0029` internally inconsistent or
   tempt an unsafe rewrite after application; the impact audit and ledger proof
   must precede any migration edit.
2. The reset/schema interlock could place new child rows on the wrong side of
   the approved Season 1 reset.
3. A partial scheduled `T-037` transition could corrupt contracts, ownership,
   obligations, the Entry Draft/trading gate, or the current-season pointer.
4. Contract planner or context refactoring could regress ordinary auctions.
5. A missed summer synchronization hook could leave a locked carryover or
   candidate eligibility projection stale.
6. Private card or queued-nomination data could leak through repository
   projections, logs, activity, notifications, outbox payloads, socket rooms,
   or frontend caches.
7. Deadline, DST, restart, lease, queue, or extension behavior could duplicate
   or skip work.
8. Restricted minimum/improvement, fallback floor, or open/restricted draw
   handling could violate fairness.
9. Reservation logic or a second confirmation could improperly suppress a
   binding multi-auction win.
10. Recovery could release a quarantined player or rewrite valid history.
11. Schedule recovery could alter the NHL/playoff ending, corrupt pairings or
    jobs, or race matchup start outside one transaction.
12. Completion logic could move Week 1 for an illegal roster or treat
    unresolved queued/fallback work as terminal.
13. A migration number collision could invalidate the reserved ledger.

Each slice must fail closed and retain a safe retry or recovery path.

## Rollback and Recovery

Local code rollback is limited to the current slice's own changes and must
preserve all unrelated work. Never use destructive Git commands to obtain a
clean tree.

Disposable database rollback may recreate only the exact disposable database
whose absolute path was recorded for the slice. Never point cleanup, reset, or
migration commands at an ambiguous or shared path.

Migrations are forward-only:

- before any shared post-migration write, a failed staging transition may
  restore the verified pre-migration backup and previous exact deploy;
- after a successful shared post-migration write, correct forward rather than
  pretending a code rollback reverses the schema;
- FAD jobs remain disabled and FAD routes unexposed until the applicable
  runtime and recovery gates pass;
- a failed allocation or auction remains quarantined and visible to authorized
  recovery instead of being silently released;
- no rollback may rewrite Candidate deadlines or historical FAD rollovers; a
  staging restore returns both competition schedule and FAD evidence to the
  exact verified pre-transition state.

Production has no rollback procedure in this plan because production work is
not authorized.

## Completion Conditions

M7-25 is complete only when:

1. every slice through `FAD-18` is complete with recorded evidence;
2. the historical amendment impact audit records a disposition for migrations
   `0023` through `0029`, and the resulting exact `0023` through `0049`
   migration set is immutable, hashed, and verified;
3. all required endpoint rows are `STAGING VERIFIED`;
4. the complete backend, frontend, migration, browser, scheduler, privacy,
   restart, recovery, and compatibility gates pass;
5. every mandatory 2026-07-29 amendment acceptance case passes locally and in
   isolated staging;
6. the reset, backup, migration, deploy, and rollback evidence is recorded;
7. Current State, roadmap, endpoint, manual-QA, release, and release-run
   documents reflect verified facts only;
8. the completed plan is moved to
   `docs/06-work-plans/archive/M7-25_FREE_AGENT_DRAFT_IMPLEMENTATION_SEQUENCE.md`;
9. a new active plan is selected deliberately; and
10. production remains untouched.

Until then, the truthful status is:

```text
M7-25 ACTIVE - 2026-08-11 FAD-18 AUTHORIZED ISOLATED SHARED-STAGING GATE
FAD-01 THROUGH FAD-17 COMPLETE LOCALLY
SCHEMA 49 LOCAL ONLY; MIGRATIONS 0023 THROUGH 0049 LOCAL ONLY
131 APPLICATION TABLES; 132 INCLUDING THE LEDGER; 131 CATALOG ENTRIES
FAD-15/FAD-16 FRONTEND: 316/316, LINT, BUILD, DEPENDENCIES,
BROWSER AUTHORITY 19/154, FAD COVERAGE 87.17% STATEMENTS / 80.02% BRANCHES
FAD-17 BACKEND ACCEPTANCE: 28/28, 49/49, AND 202/202; NO SKIPS
FAD-17 PLAYWRIGHT: 40/40, FIVE PROJECTS, ZERO RETRIES
T-076 THROUGH T-083 AND T-126 THROUGH T-144 LOCAL VERIFIED
FAD-18 LOCAL PREFLIGHT: 156 PASS / 2 INTENTIONAL WINDOWS LINK SKIPS OF 158
FAD-18 HOLD/PROVIDER TRANSITION: 35/35; PROVIDER FAMILY: 104 PASS / 2 SKIP OF 106
PUBLISHED SOURCE HEADS: FRONTEND 29D4D89; BACKEND BRIDGE SOURCE 26CF960
PRE-FAD RENDER ROLLBACK: DEP-D9KMV0IJOBAS73FSP8KG / FA85E75; NO FAD DEPLOY
FAD-18 DEPLOYMENT BLOCKED BY REAL PROVIDER MANIFEST/LIVE OBSERVATION,
ISOLATED RESOURCES/OPERATOR/SHELL ACCESS, BRIDGE AND FINAL-HELD DEPLOYS,
OFFSITE BACKUP/CLEAN RESTORE, FRESH RESET/IMPORT/SCHEMA-49 REPORT,
FINAL BACKEND CANDIDATE, DATABASE-PATH ACTIVATION, AND DEPLOY/ROLLBACK IDENTITIES
PRODUCTION UNAUTHORIZED, BLOCKED, AND UNTOUCHED
```
