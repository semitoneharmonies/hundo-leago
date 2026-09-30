# Commissioner and administrator controls — 29 September 2026

Graem approved local development of the complete controls package in the current
chat, conditional on preserving live leagues. This is not deployment authority
or authority to reset, correct, notify, or recalculate a live league.

## Delivery and preservation

Use isolated E: worktrees based on backend `f8ac563` and frontend `2c1ced5`.
Preserve both dirty root checkouts and the separate Goon Spoons work. No commits
or pushes are authorized. Build one reviewable slice at a time, using disposable
local databases and synthetic browser fixtures. Existing controls are reused.
Every write must enforce current league authority on the server, validate before
writing, preserve history, and be safe to retry. Reads never perform repairs.

Graem's latest instruction is to continue through the entire approved package
until it is finished and ready for staging testing, without stopping after each
slice. This does not authorize deployment, commits, pushes or live league writes.
Existing controls must be inventoried and extended rather than duplicated.

## Approved scope and acceptance

Current checkpoint, 30 September: **100% of local staging preparation complete**.
The package is ready for authenticated staging testing within the safeguards
below. Publication, hosted acceptance and production operations have not occurred.

The table below is the current scope summary. Dated checkpoints later in this
file are historical records; their pending lists are superseded by this table
and the [staging handoff](COMMISSIONER_CONTROLS_STAGING_QA_2026-09-30.md).

| Slice | Required outcome | Status |
| --- | --- | --- |
| Communications | Preview targeted reminders; in-app delivery; pinned/expiring announcements; archive without destroying history | Implemented and verified locally |
| Card progress | Count and identify empty/incomplete/complete cards without player or offer disclosure | Implemented and verified locally |
| FAD deadline | At deadline, complete valid cards trigger automatic allocation; unfinished cards hold with editing open; explicit resume/reschedule/override | Hold, editing, explicit proceed and open-card rescheduling implemented and verified locally |
| Calendar | Edit matchup, trade, FAD and playoff dates throughout season; preview dependencies and any reopening/correction | Future season/playoff boundaries and live week end, pending-job coordination, overdue unattempted lock recovery and pre-card Week 1 shift verified; general calendar editing waits for FAD completion; unfinished drafts use their timing/recovery controls; processed boundaries remain protected |
| Auction timing | League-owned FAD and in-season close times and new-auction cutoff gaps | Creation gap, recurring in-season day/time/gap, individual open auction clocks, open-card timing, unused future rapid rounds and eligible active direct-manager clocks verified; accepted queues, restricted/fallback and extension-recovery dependencies remain protected by the general editor and use existing recovery paths |
| Privacy | Administrative actions hide others' private details; cancellation requires no reveal; scoped deliberate audited reveal for a necessary correction | Auction controls implemented and verified locally; existing Candidate Card help stays explicitly scoped |
| Scoring | League-owned category values and bonuses; effective week and current/historical recalculation preview; retain rule versions | Implemented and verified locally; completed results stay protected and use explicit result correction |
| Reset | Guided scoped league/FAD reset with exact preservation manifest, verified recovery and explicit confirmation | Schema83 core/API/UI, populated reset/restore rehearsal, preserved second league, encrypted archive, stale-restore refusal and actual setup/readiness restart verified locally |
| Readiness | Aggregate missing managers/cards/picks, roster issues and calendar conflicts with links to existing tools | Implemented and verified locally; distinguishes preparation from competition and reports all failed-job counts |
| Pause/resume | Explicit scope, preserved bids/history and deadline behavior visible before resume | Implemented and verified locally; holds manager transactions and scoped competition processing, retains timestamps, previews overdue impact before resume |
| Help requests | Manager requests tied to a record; scoped permission without general private-data browsing | Implemented and verified locally; private requester/current commissioner-admin queue, existing explicit Candidate Card grants reused |
| Recovery | Consolidate existing recovery actions; retry only supported failed operations without duplicate awards | Existing guarded FAD retries, trade reversal and result/roster corrections linked in recovery hub; eligible standings rebuild exposed with verified durable retry |
| Missing picks | Add only missing records; preserve existing ownership, trades and seasons | Implemented and verified locally for upcoming drafts with evidenced order and explicitly reviewed owners; started/completed or ambiguous drafts remain protected |
| Reversal | Preview eligible administrative reversals and refuse incompatible subsequent state | Roster/contract reversal previews and atomic inverse corrections verified locally; preserve original history, refuse later dependencies and retain retry receipts |
| Admin health | Email/statistics/job/backup status and supported safe retries without secret disclosure | Read-only status includes account email counts, interrupted/failed jobs, latest verified backup and backup attempt; links existing supported recovery/statistics actions |
| Catalogue | Targeted lookup/import/refresh; stable identities and live league records preserved | Administrator-only single NHL player import/refresh verified locally; duplicate detection, source/state review, stable IDs and immutable receipts |
| Exports | Authorized league exports excluding competing private cards/bids | Explicit current-season reference JSON export implemented and verified locally |
| Season rollover | Preview contracts, draft picks, archived results and next-season preparation | Implemented and verified locally using the existing execution matrix, public-safe effects and unchanged preparation dates |
| Change history | Actor, affected records, before/after, effective scope and relevant notifications | Searchable timeline implemented and verified locally, including private reveals, scoring, reset/restore and reversals |

An already-processed event is not silently replayed by changing its date. Scoring
defaults to a future matchup boundary; changing completed results requires an
explicit impact preview. The conservative deadline default holds incomplete or
invalid cards as well as empty cards. This assumption was stated in the chat;
the optional clarification did not receive a different preference.

## First slice: communications

Only an active commissioner or platform administrator with league access may
preview or publish. Active members may read current announcements. Reminders
are private notifications; announcement history does not expose their contents
or recipients to managers. Recipient groups are derived by the server and shown
before confirmation. If eligibility changes after preview, require a fresh
preview. Use one idempotency key per confirmed send; a network retry cannot send
duplicates. Announcements support optional pinning, expiry and notifications.
Archival hides an announcement while preserving the original message and actor.

Communication writes touch only the new communication records and existing
notification records. No email provider is called in this slice. Saved cards,
bids, rosters, contracts, trades, scores and schedules are not changed.

Verify real authentication/CSRF routing, current authority including revocation,
two-league isolation, privacy, stale-preview rejection, atomic rollback,
duplicate retries, message bounds, expiry, and archived history. Compare every
preexisting table across additive migration and protected league tables across
message operations. Run frontend interaction tests and desktop/mobile browser
checks, then build. Local evidence is not authenticated hosted acceptance.

## Local checkpoint: first slice

Implemented in the isolated backend and frontend worktrees named above.
The technical contract is [League communications](../04-technical-specs/LEAGUE_COMMUNICATIONS.md).

| Check | Actual result |
| --- | --- |
| Communication service, additive migration and preservation | 9 tests pass; old records unchanged except the exact schema metadata advance; send changes only communications and notifications |
| Real session/CSRF HTTP routes | Anonymous and bad-CSRF requests denied; cross-league access denied; authorized preview is read-only; repeated confirmed send creates one set of inbox records |
| Real FAD composition | Both regular and daily-staging fixture variants pass; all four open cards return only status/team/manager metadata; reads and reminder preview leave database bytes unchanged |
| Runtime regression | Initial run passed 52 of 55 tests; the three failures were endpoint/schema expectation assertions, corrected and covered by focused passing reruns; new communication HTTP case also passes |
| Migration/repository/schema/injury regressions | 43 tests across six files verified across the main run and corrected reset-inventory rerun; old reset policy remains signed and new message table requires empty |
| Migration engine | 7 tests pass |
| Frontend interactions and notification contracts | 35 tests pass across four files |
| Browser | 4 Chromium checks pass: commissioner and manager at desktop and phone sizes; recipient confirmation, no private-card/bid requests, no overflow |
| Visual inspection | Desktop and phone fixture screenshots reviewed; panel spacing corrected |
| Build and lint | Vite build and changed-file ESLint pass; existing large-bundle warning remains |

Backend commands use Node 24.14.1 and TEMP/TMP under
`E:/hundo-leago-backend/.hundo.local/commissioner-controls-20260929/tmp`.
The focused suites are `leagueCommunicationFoundation`,
`targetRuntimeFoundation`, `sqliteMigrationFoundation`,
`sqliteRepositoryFoundation`, `sqliteInitialSchema`,
`sqliteMigrationCommandSafetyFoundation`, `playerInjuryFoundation`, and
`resetManifest`. No test command targets hosted services.

Frontend checks use explicit local API/socket origins:
`vitest run src/features/leagues/LeagueDashboard.test.jsx
src/features/commissioner/LeagueCommunications.test.jsx
src/features/notifications/NotificationsPage.test.jsx
src/features/notifications/notificationContracts.test.js`.
Browser checks use `playwright test e2e/league-communications.spec.js
--project=desktop-chromium --project=mobile-chromium` with
`HL_COMMUNICATION_PREVIEW_ORIGIN=http://127.0.0.1:5189`.

The local preview is `/e2e/fixtures/league-communications.html`; all people,
cards and messages there are synthetic. Browser evidence and screenshots live
in the frontend worktree's ignored `test-results` directory.
No live leagues were read or modified, and no real notifications were sent.
Nothing is committed, pushed or deployed. Hosted acceptance, a production-copy
migration rehearsal, rollback rehearsal and all remaining scope rows are pending.

## Local checkpoint: soft deadline holds and explicit processing

Implemented and verified locally. The
[deadline control contract](../04-technical-specs/FAD_DEADLINE_CONTROLS.md)
records the API, persistence, worker and privacy behavior.

Main changed files in the backend worktree:

- `database/migrations/0067_add_fad_deadline_controls.sql`: two new tables and the
  three targeted trigger changes; existing league rows remain intact.
- `src/application/services/freeAgentDraft/createFadDeadlineControlService.js`,
  `src/infrastructure/persistence/sqlite/SqliteFadDeadlineControlRepository.js`
  and `src/transport/http/createFadDeadlineControlRouter.js`: reviewed,
  repeat-safe commissioner/admin authorization with current state checks.
- Existing FAD deadline service/writer/job repository/runner: hold instead of
  locking unfinished cards; suppress dependent work while held; process ready
  cards automatically and recheck manually authorized timing.
- Candidate Card repository and FAD read/policy files: retain current-manager
  editing while open without extending commissioner help grants.
- Runtime route registration, repository inventory and reset inventory: include
  the new controls; disabled FAD routes also disable these endpoints.

Main frontend files are `FadDeadlineControls.jsx`, `FreeAgentDraftPages.jsx`,
`freeAgentDraftContracts.js` and the notification contract/page. The FAD page
shows the target deadline and an authorized review/confirm panel. The manager's
editor follows actual locking and authorization. New inbox notices link to FAD.
Product documentation now explicitly supersedes the older hard-deadline rule.

| Verification | Actual evidence |
| --- | --- |
| Backend regression | 235-case run: 220 initially passed; 15 old hard-deadline/response-shape/schema-inventory assertions corrected; every affected case passes focused reruns |
| Runtime | 49-case run: 46 initially passed; schema assertion and two schema-66 migration fixtures corrected; 12 focused route/runtime tests pass, including an added delayed-worker case |
| New behavior | All 18 mandatory slots saved for each of four teams; automatic lock at target, never early; saving all cards during a hold does not release it; explicit processing succeeds |
| Migration preservation | An already-open schema-66 draft migrates to 67 with every existing league/card/job row unchanged; only the three exact manager-deadline trigger predicates change; migration retry is byte-identical |
| Private access | No hidden player/offer data in status or preview; expired help and wrong-manager access denied; manager editing survives the target and still ends at publication |
| Command safety | Anonymous/manager/bad-CSRF requests denied; GET and preview leave database bytes unchanged; stale previews rejected; accepted retry creates no extra writes |
| Delayed worker | An authorization that no longer leaves the first fair auction window returns to a hold without snapshots or card changes |
| Policy and service edges | 57 tests pass, including malformed inputs, revoked authority, failed/running/missing jobs, frozen league and the exact one-hour boundary |
| Frontend | 70 tests pass across FAD page/control/contracts and notifications |
| Browser and visual | Six Chromium checks pass across desktop and phone; both deadline-preview screenshots inspected; no overflow or private card/bid requests |
| Build/lint/diff | Build and changed frontend lint pass; diff checks clean; pre-existing Vite large-chunk warning remains |

Backend checks use `node --test` with TEMP/TMP under the E: task directory.
The full suite list is the deadline writer/service/runner, FAD job/read
repositories, Candidate Card repository/policies, communication service,
initial schema, repository catalogue, migration command safety, injury and
reset-manifest foundation tests. Additional focused runs use
`--test-name-pattern` for the exact corrected cases; no broad rerun was needed
after those assertion and fixture corrections.

Reviewable logs are under
`E:/hundo-leago-backend/.hundo.local/commissioner-controls-20260929/tmp/`:
`fad-step-foundation.log`, `fad-step-runtime.log`,
`fad-step-runtime-focused.log`, `fad-step-policy.log`,
`fad-step-card-regressions.log`, `fad-step-read-regressions.log` and
`fad-step-schema-read-contracts.log`. The final card-version assertion rerun
also passed in the terminal. Earlier failed logs are retained as evidence.

Frontend commands are `vitest run` for the five FAD/notification files,
`playwright test e2e/league-communications.spec.js --project=desktop-chromium
--project=mobile-chromium`, changed-file `eslint`, and `vite build`.
The synthetic preview remains on port 5189.

Overall local implementation is estimated at 25%. Communications, private card
progress, and hold/proceed are complete; FAD target rescheduling remains pending.
The full FAD deadline row is therefore only partially complete. All remaining
scope rows above retain their pending status. This slice is not a release:
long holds that need new rollover dates require the next coordinated calendar
step. Current help grants still expire at their original deadline.

No live leagues were read or changed. No real notices were sent. Nothing was
committed, pushed or deployed. Root checkouts and the separate Goon work remain
outside these edits.

## Local checkpoint: open-card FAD rescheduling

Commissioner/admin timing controls now provide a before/after preview and
confirmed edit of the Candidate Card target and every existing planned round.
Targets must be future, first rounds leave more than an hour, and the final
round cannot exceed Week 1. Rescheduling releases a hold/earlier authorization;
all-ready cards process automatically at the new target, while unfinished cards
hold again. Nothing is committed, pushed or deployed. No live records were read
or changed and no real notices were sent.

Files added in the backend worktree:

- `database/migrations/0068_add_fad_timing_changes.sql`: additive immutable
  before/after audit and exact exceptions to four existing timing triggers.
- `src/domain/freeAgentDraft/fadTimingChangePolicy.js`: bounded input, phase,
  job, deadline, round ordering and Week 1 validation; dependent clock plan.
- `src/application/services/freeAgentDraft/createFadTimingService.js`: current
  authority, read-only previews, fresh-state confirmation and exact replay.
- `src/infrastructure/persistence/sqlite/SqliteFadTimingRepository.js`: one
  transaction for job/round/root clocks, preserved cards/history and notices.
- `test/foundation/fadTimingChangePolicyFoundation.test.js`: malformed timing,
  busy/failed jobs, revoked authority, stale preview and elapsed-target checks.

Updated backend files: `src/bootstrap/createTargetRuntime.js`,
`src/transport/http/createFadDeadlineControlRouter.js`,
`src/infrastructure/persistence/sqlite/repositoryCatalog.js`,
`src/infrastructure/migration/resetManifest.js`, and the target runtime, initial
schema, repository, reset-manifest, injury schema-version and migration-command
foundation tests. The runtime has 143 routes, including 26 dedicated FAD routes;
the repository catalogue has 145 application tables. Historical reset protocols
require the new audit table to be empty.

Frontend additions: `src/features/freeAgentDraft/FadTimingControls.jsx` and its
test. `FreeAgentDraftPages.jsx` mounts the form under current commissioner/admin
capabilities; `FadDeadlineControls.jsx` explains rescheduling as another way to
release a hold. The existing communications browser fixture/spec now exercise
timing on desktop and phone. The product spec and deadline contract document the
new local behavior and its limits.

| Verification | Actual evidence |
| --- | --- |
| Timing policy/service | Four tests pass covering malformed input, unchanged identities, sent reminders, invalid ordering, Week 1 bounds, busy/failed jobs, stale/revoked/late confirmation and a date-only response contract |
| Real runtime | Both pending-reminder and sent-reminder reschedules pass; an injected root-write failure rolls back all earlier job/round writes; repeated confirmation adds no writes; saved cards, revisions, grants, contracts, teams and original schedule/readiness records remain unchanged |
| Repeat rescheduling | A second edit can assign rounds the former times of later rounds without UNIQUE collisions; both audit receipts remain immutable |
| HTTP authority | Anonymous/manager/bad-CSRF requests rejected; GET/preview/rejected requests leave database bytes unchanged; confirmed HTTP request succeeds; no-store and exact date-only response verified |
| Scheduler | Old deadline does nothing; new deadline holds unfinished cards; explicit processing, allocation-to-rapid and the first revised rollover all succeed; complete cards lock automatically at the revised target |
| Migration | An already-open schema-66 fixture migrates through 67 and 68 preserving original rows. Only the four named timing triggers change at 68; original transition bodies remain verbatim; migration retry is byte-identical; integrity and foreign keys pass |
| Compatibility | 15 targeted schema/catalogue/reset/policy cases pass; the physical staging migration-command fixture reports the complete schema-68 ledger; route dispatch and disabled-FAD boundaries pass |
| Frontend | 38 tests pass across FAD pages, deadline controls and timing controls |
| Browser | Eight desktop/mobile Chromium cases pass across the initial run and the two-case corrected timing rerun; no overflow, private-card/bid requests or page errors; both timing screenshots inspected |
| Build/lint/diff | Build and changed-file ESLint pass; diff checks clean; existing Vite large-chunk warning remains |

Commands: `node --test test/foundation/fadTimingChangePolicyFoundation.test.js`;
focused `node --test --test-name-pattern` runs against `targetRuntimeFoundation`,
`sqliteInitialSchema`, `sqliteRepositoryFoundation`, `resetManifest` and
`sqliteMigrationCommandSafetyFoundation`; `vitest run` for the three FAD page/
control files; Chromium desktop/mobile `playwright test` for
`e2e/league-communications.spec.js`; changed-file `eslint`; `vite build`.
Backend and browser TEMP/TMP remain under the E: task directory.

Reviewable evidence in the existing task `tmp` directory:
`fad-timing-final-runtime.log`, `fad-timing-http-runtime.log`,
`fad-timing-complete-runtime.log`, `fad-timing-repeat.log`,
`fad-timing-schema.log`, `fad-timing-ui.log`,
`fad-timing-browser.log`, `fad-timing-browser-focused.log`, and
`fad-timing-build.log`. Initial test fixture issues and the Playwright
datetime normalization correction are resolved; their original logs are not
evidence of application failure remaining. The final runtime run passes all
three affected scenarios, including downstream rollover.

Overall local package estimate: 33%. Open-card target/round rescheduling is
complete. Next: configurable FAD cutoff gaps and safe timing edits after auctions
start, followed by broader league calendar controls. Existing round count and
the one-hour cutoff are preserved in this slice. All other approved rows retain
their current status. Production-copy rehearsal, hosted acceptance and release
work remain pending.

## Local checkpoint: configurable FAD nomination cutoffs

Overall local package estimate: **38%**. This slice is complete locally; the
broader calendar/auction step remains open. Commissioners/admins can preview and
confirm a whole-minute gap (0..10080, default 60) for unused FAD rounds and future
extensions. Existing auctions, queued nominations and completed rounds keep
their accepted clocks. The preview lists retained rounds and warns of immediate
opening/closing of nominations. The form never loads competing offers or cards.

Backend files added:

- `database/migrations/0069_add_fad_auction_cutoff_controls.sql`
- `src/domain/freeAgentDraft/fadAuctionCutoffPolicy.js`
- `src/application/services/freeAgentDraft/createFadAuctionCutoffService.js`
- `src/infrastructure/persistence/sqlite/SqliteFadAuctionCutoffRepository.js`
- `src/infrastructure/persistence/sqlite/fadAuctionCutoffClock.js`
- `test/foundation/fadAuctionCutoffPolicyFoundation.test.js`

Updated the runtime, deadline-control router, repository catalogue and reset
inventory. Saved cutoff bounds now drive the FAD policy, job/auction readers,
auction resolution and fallback activation. Queued-nomination, rollover-recovery
and restricted fallback extension writers use the new clock helper. Open-card
timing policy/repository preserve the configured gap. Existing test files for
these writers, target runtime, schema, repository, reset and migration-command
checks gained the relevant preservation/compatibility coverage. There are now
146 endpoints (29 dedicated FAD), 147 application tables and 83 immutable delete
guards. The historical signed reset manifest is unchanged; both new tables must
be empty for the old reset protocol.

Frontend files added: `src/features/freeAgentDraft/FadAuctionCutoffControls.jsx`
and its test. Updated `FreeAgentDraftPages.jsx`, the timing preview copy, and
`e2e/fixtures/league-communications.jsx` / `e2e/league-communications.spec.js`.
Updated the FAD and auction product clarifications and deadline technical contract.

| Check | Actual verification |
| --- | --- |
| Policy and service | Four new cases pass: input bounds, exact nomination boundaries, zero/long gaps, retained rounds, immediate effects, authority revocation and stale state/clock previews; 29 existing FAD/timing policy cases also pass |
| Full runtime | Confirmed HTTP edit, no-store, denied manager/anonymous/bad-CSRF requests, byte-identical reads/previews, injected rollback, replay, preserved jobs/cards/auction tables, retained gap after rescheduling, hold/proceed/allocation and rapid-phase changes pass |
| Acceptance and migration | Two populated writer cases pass: schema 68 to 69 preserves every existing auction, bid, queue and receipt; post-migration edits retain committed clocks; custom 30-minute boundary opens immediately one millisecond before and queues exactly at it |
| Extensions | Queued activation, recovery and restricted fallback all use a 30-minute gap and replay safely; custom two-hour final-round activation still passes |
| Regression | Six runtime cases pass: exact endpoint/disabled-feature gates, pending/sent reminder rescheduling, automatic all-ready processing and sticky held cards; migration checks preserve all old rows and change only the named objects |
| Schema | 12 focused schema/catalogue/reset cases pass; the isolated staging migration-command fixture reports the complete schema-69 ledger |
| Website | 37 unit cases pass across cutoff, timing and FAD pages; 10 Chromium desktop/mobile cases pass, with no private-card/bid requests, page errors or horizontal overflow; both cutoff screenshots inspected |
| Build and lint | Changed-file ESLint and Vite build pass; existing large-chunk warning remains; both worktree diff checks pass |

Commands: `node --test test/foundation/fadAuctionCutoffPolicyFoundation.test.js`;
focused `node --test --test-name-pattern` runs for runtime, schema/catalogue/reset,
auction-start, queued activation, fallback administration, rollover writer and
migration-command tests; `vitest run` for cutoff/timing/FAD pages;
`playwright test e2e/league-communications.spec.js --project=desktop-chromium
--project=mobile-chromium`; changed-file `eslint`; `vite build`.
Evidence remains in the E: task `tmp` directory under `fad-cutoff-*.log`.

The first fallback test asserted a clean foreign-key check against a historical
fixture that deliberately omits card/readiness parents. Its focused rerun now
compares before/after violations and passes with no new violations. Complete
runtime/migration fixtures pass clean foreign-key and integrity checks. The
initial failed log is retained alongside `fad-cutoff-fallback-final.log`.

No live/staging services were accessed, no real messages were sent, and no changes
were committed, pushed or deployed. These are synthetic/local checks. Next:
safe active-auction timing and broader calendar edits. Used-round cutoff edits,
creation-form gap configuration, ordinary in-season timing and the remaining
approved controls are still pending. Existing close times and round count remain
unchanged by this cutoff form. A compatible production rollback and rehearsal
remain release work, particularly because older workers reject custom cutoffs.

## Local checkpoint: trade-deadline editing during setup and season

Overall local package estimate: **42%**. Commissioner/admin controls now preview
and confirm a new future trade deadline during setup or an active season,
including reopening after the old deadline. Pending acceptance clocks follow
the revised deadline within the original seven-day limit. Already expired
proposals never revive, including those awaiting the expiry worker. Receiver
acceptance and commissioner approval can continue on an unexpired offer.
Completed trades, assets and historical receipts are preserved.

The [technical contract](../04-technical-specs/TRADE_DEADLINE_CONTROLS.md)
describes the API, privacy and persistence. The preview exposes counts without
loading proposal contents. Confirmation records the actor/reason/old/new dates,
notifies active members in-app and invalidates existing league queries.

Backend files added:

- `database/migrations/0070_add_trade_deadline_changes.sql`
- `src/domain/leagues/tradeDeadlineChangePolicy.js`
- `src/application/services/leagues/createTradeDeadlineChangeService.js`
- `src/infrastructure/persistence/sqlite/SqliteTradeDeadlineChangeRepository.js`
- `src/transport/http/createTradeDeadlineChangeRouter.js`
- `test/foundation/tradeDeadlineChangePolicyFoundation.test.js`

Updated runtime registration, repository catalogue and reset inventory.
Tests changed in `tradeProposalCreationFoundation`, `targetRuntimeFoundation`,
`sqliteInitialSchema`, `sqliteRepositoryFoundation`, `resetManifest`,
`sqliteMigrationCommandSafetyFoundation` and `playerInjuryFoundation`.
The latter schema/count assertions do not alter product behavior.

Frontend files added: `src/features/commissioner/TradeDeadlineControls.jsx`
and its test. Updated `CompetitionPages.jsx` and its fixture tests,
`notificationContracts.js` and its test, `NotificationsPage.jsx`, and the
communications browser fixture/spec. Documentation changed in `TRADES.md`,
the new technical contract, this record and the README index.

| Check | Actual verification |
| --- | --- |
| Policy/service | Four cases pass: bounded future input, exact expiry, seven-day cap, phase/legacy guards, revoked authority, changed proposal and elapsed-expiry preview rejection |
| Real trade flows | Populated migration from 69 to 70 preserves all existing rows and schema objects; deadline extension/shortening, expiry, reopening and later new-trade execution pass; existing completed trade/assets preserved |
| Atomicity/history | Late notification failure rolls back all writes; duplicate confirmation is byte-identical; original proposal receipt remains valid after deadline edits; immutable history rejects alteration |
| Approval flow | Existing receiver acceptance and Future Considerations history retained; commissioner approval after the former deadline succeeds on the extended offer |
| HTTP access | Anonymous, manager and bad-CSRF requests denied; commissioner and inherited admin work during setup/active season; cross-league/missing scope denied; GET/preview read-only; fresh-preview and replay checks pass |
| Runtime/schema | Three route/disabled-FAD checks and seven schema/catalogue/reset/migration-command checks pass; 149 endpoints, 148 application tables, 84 immutable delete guards; clean integrity and foreign-key checks in complete fixtures |
| Frontend | 52 cases pass across deadline controls, competition page and notification tests, including the focused corrected competition-page rerun |
| Browser/visual | 12 desktop/mobile Chromium cases pass; both new deadline-preview screenshots inspected; timezone conversion, no proposal/bid requests, no page errors or horizontal overflow |
| Build/lint | Vite build and changed-file ESLint pass; preexisting large-chunk warning remains |

Commands use the same E: Node and TEMP/TMP as previous checkpoints:

- `node --test test/foundation/tradeDeadlineChangePolicyFoundation.test.js`
- Focused `node --test --test-name-pattern` against trade proposal creation,
  target runtime, initial schema, repository, reset and migration-command tests.
- `vitest run src/features/commissioner/TradeDeadlineControls.test.jsx
  src/features/competition/CompetitionPages.test.jsx
  src/features/notifications/notificationContracts.test.js
  src/features/notifications/NotificationsPage.test.jsx`, followed by the
  corrected competition-page file alone.
- `playwright test e2e/league-communications.spec.js
  --project=desktop-chromium --project=mobile-chromium` with the existing
  synthetic preview origin on port 5189.
- Changed-file `eslint`, `vite build`, and both worktree `git diff --check`.

Reviewable logs are under the existing E: task `tmp` directory:
`trade-deadline-policy-flow.log`, `trade-deadline-flow-final.log`,
`trade-deadline-schema-approval.log`, `trade-deadline-http.log`,
`trade-deadline-routes.log`, `trade-deadline-front-final.log`,
`trade-deadline-competition-fixed.log`, `trade-deadline-browser.log`,
`trade-deadline-lint.log` and `trade-deadline-build.log`.
Earlier failed logs are retained. Resolved test issues were the notification
writer's wrapped constraint error, expiry result field name, missing adjacent
read fixtures and a date-dependent schedule test clock. No observed failures
remain after the focused reruns.

This completes only the current slice. The broad calendar step stays pending:
active-auction clocks, creation-form gaps, ordinary in-season timing, matchup and
playoff dates, immediate closure/backdated corrections, and the other approved
scope rows remain. Legacy/inconsistent proposal clocks require explicit review.
No hosted/live access, real notifications, commits, pushes or deployment occurred.
Production-copy rehearsal, rollback and hosted acceptance remain release work.

## Local checkpoint: individual active in-season auction clocks

Overall local package estimate: **45%**. Commissioner/admin auction pages now
offer a private timing disclosure, read-only before/after preview, reason and
confirmed closing-time change for an open ordinary auction. Changes may extend
or shorten the window while it remains future and before playoffs/season end.
Elapsed clocks, resolution jobs/results and FAD auctions are protected.

The [technical contract](../04-technical-specs/AUCTION_TIMING_CONTROLS.md)
records the scope. The repository reads clock/state metadata only. Bids, original
timestamps, cooldowns, edit limits, original contexts and receipts stay intact.
The normal worker follows the revised clock. History, selected auction clock/
version, public activity, member inbox notices and invalidation commit together.

Backend files added:

- `database/migrations/0071_add_auction_timing_changes.sql`
- `src/domain/auctions/auctionTimingPolicy.js`
- `src/application/services/auctions/createAuctionTimingService.js`
- `src/infrastructure/persistence/sqlite/SqliteAuctionTimingRepository.js`
- `src/transport/http/createAuctionTimingRouter.js`
- `test/foundation/auctionTimingPolicyFoundation.test.js`

Updated `src/bootstrap/createTargetRuntime.js`, repository catalogue and reset
manifest. Existing test files changed: ordinary-auction compatibility, target
runtime, initial schema, repository foundation, reset manifest, migration command
safety and the injury suite's current-schema assertion.

Frontend files added: `src/features/auctions/AuctionTimingControls.jsx` and its
test. Updated `AuctionPages.jsx`, notification contracts/test/page, and the
communications browser fixture/spec. Documentation updated in `AUCTIONS.md`,
the new technical contract, README index and this work plan.

| Verification | Actual result |
| --- | --- |
| Policy/service | Three cases pass: bounded input, shorter/longer clocks, exact expiry, both season boundaries, protected FAD/old-season/jobs/results, revoked authority, changed version and elapsed-clock confirmation |
| Populated migration and worker | One integration case passes: schema 70 to 71 preserves all old rows and objects; read/preview/replay unchanged bytes; late notification failure rolls back; non-target tables preserved; immutable audit |
| Real bid behavior | Manager edit succeeds after old close with original first-bid time retained; original bid-command replay stays read-only after another timing change; no worker resolution before new time; bid denied exactly at new close; worker resolves once and completed state rejects further edits |
| HTTP | One real runtime case passes: session/CSRF/roles, exact response fields, missing scope, read-only reads/previews, duplicate/stale commands, commissioner and inherited admin confirmation, clean FK/integrity |
| Runtime/schema | Three dispatch/disabled-FAD tests and seven schema/catalogue/reset/migration-command checks pass across initial run and corrected sorted-table-list rerun |
| Frontend | 63 tests pass: six new timing interactions, 23 notification cases, 34 existing auction page cases |
| Browser/visual | 14 Chromium desktop/mobile checks pass; both new timing-preview screenshots inspected; no private bid requests, overflow or page errors |
| Build/lint/diff | Changed-file ESLint and Vite build pass; both diff checks clean; preexisting large-bundle warning remains |

Commands: `node --test test/foundation/auctionTimingPolicyFoundation.test.js`;
focused `node --test --test-name-pattern` against ordinary-auction compatibility,
target runtime, schema/catalogue/reset/migration-command tests; `vitest run`
for timing/auction pages and both notification files; existing communications
`playwright test` with desktop/mobile Chromium; changed-file `eslint`;
`vite build`; `git diff --check`. TEMP/TMP and all synthetic artifacts stay
under the E: task directory. The preview remains on loopback port 5189.

Logs in task `tmp`: `auction-timing-flow.log`,
`auction-timing-acceptance-final.log`, `auction-timing-receipt-final.log`, `auction-timing-http.log`,
`auction-timing-schema.log`, `auction-timing-schema-final.log`,
`auction-timing-front.log`, `auction-timing-pages-final.log`,
`auction-timing-browser.log`, `auction-timing-lint.log` and
`auction-timing-build.log`. Earlier failure logs are retained. Resolved issues
were test fixture migration arguments, actual outbox table names, wrapped bid
reason codes, stale-command test input, sorted schema expectations and a duplicate
frontend import. No observed failures remain after focused corrections.

No production/staging access, real notifications, commits, pushes or deployment.
The broad calendar tracker step remains unfinished. Next: coordinated active FAD
round/queue clocks and broader matchup/playoff dates. Recurring league auction
settings, nomination cutoffs, immediate closure/reopening, and all other pending
scope remain separate work. Release rehearsal and hosted acceptance are pending.

## Local checkpoint: unused future rounds during rapid FAD

Overall local package estimate: **46%**; league calendar and auction timing
approximately **65%**. The package remains active and unreleased.

Commissioners/admins can preview and confirm new closing dates for unused
initial rounds that have not opened during rapid FAD. The linked next opening,
configured cutoff, pending rollover occurrence and draft schedule move together.
The locked deadline, completed work, existing auctions, bids and queues remain
unchanged. Accepted queue receipts protect source/opening successors as well
as explicit round references. Changing a preceding close is refused when the
next opening is protected. Confirmation rechecks new dependencies and elapsed
time. Immutable history, changed clocks, activity and notices are atomic.

The rapid results page now mounts the timing and cutoff controls for current
administrative viewers. Protected dates are disabled with an explanation.
Managers do not load the controls. No card or bid contents are requested.
The existing open-card target/hold behavior remains available and verified.

Files changed in the isolated backend:

- New `database/migrations/0072_allow_unused_rapid_fad_timing.sql`.
- `src/domain/freeAgentDraft/fadTimingChangePolicy.js`.
- `src/application/services/freeAgentDraft/createFadTimingService.js`.
- `src/infrastructure/persistence/sqlite/SqliteFadTimingRepository.js`.
- Tests in `test/foundation/`: `fadTimingChangePolicyFoundation.test.js`,
  `targetRuntimeFoundation.test.js`,
  `freeAgentDraftAuctionStartWriterFoundation.test.js`,
  `sqliteInitialSchema.test.js`, `sqliteRepositoryFoundation.test.js`,
  `sqliteMigrationCommandSafetyFoundation.test.js` and
  `playerInjuryFoundation.test.js` (current-schema expectation).

Files changed in the isolated frontend:

- `src/features/freeAgentDraft/FadTimingControls.jsx` and its test.
- `src/features/freeAgentDraft/FreeAgentDraftPages.jsx` and its test.
- `e2e/fixtures/league-communications.jsx` and
  `e2e/league-communications.spec.js`.
- `docs/03-product-specs/FREE_AGENT_DRAFT.md`,
  `docs/04-technical-specs/FAD_DEADLINE_CONTROLS.md` and this work plan.

| Verification | Actual result |
| --- | --- |
| Policy/service | Six cases pass, including shorter/longer dates, fixed locked deadline, protected rounds, recovery/busy jobs, authority/version checks and elapsed confirmation |
| Populated migration | Schema 71 to 72 preserves all existing league rows and original private auction/queue receipts; only four existing triggers change and their lifecycle bodies remain verbatim; retrying migration writes nothing |
| Actual runtime and HTTP | New rapid-round case passes with real accepted auction and queued nomination, stale preview after acceptance, exact safe response fields and byte-identical reads/previews/retry |
| Transaction and database guards | Late notification failure rolls back; forged deadline/help/protected schedule/round/completed-job plans rejected; non-target tables and untouched round rows preserved |
| Worker | Accepted receipts still replay; queue activation, auction resolution and earlier round completion succeed; changed round is not due at its old date and processes once at its new date |
| Regression | Both open-card reminder variants, complete-card automatic processing, held-card editing, cutoff edits, ordinary-auction HTTP controls, schema/catalogue/metadata/migration ledger and runtime composition pass |
| Frontend | 40 unique tests pass: timing and cutoff controls plus full FAD page suite, including new rapid commissioner/manager route coverage |
| Browser | 16 synthetic Chromium desktop/mobile checks pass; both rapid timing screenshots inspected, no hidden-card/bid requests, overflow or page errors |
| Build/lint/diff | Changed-file ESLint, final Vite build and both diff checks pass; existing large-chunk warning remains |

There are **19 unique focused backend tests** across the recorded runs.
Commands: `node --test test/foundation/fadTimingChangePolicyFoundation.test.js`;
focused `node --test --test-name-pattern` for the runtime, populated writer,
schema/catalogue and migration-command checks; `vitest run` for the three
FAD frontend files; `playwright test e2e/league-communications.spec.js
--project=desktop-chromium --project=mobile-chromium`; changed-file
`eslint`; `vite build`; `git diff --check`. TEMP/TMP and synthetic
artifacts remain under the E: task directory.

Logs in task `tmp`: `rapid-timing-policy.log`,
`rapid-timing-backend.log`, `rapid-timing-worker.log`,
`rapid-timing-final.log`, `rapid-timing-schema.log`,
`rapid-timing-front.log`, `rapid-timing-page-final.log`,
`rapid-timing-browser.log`, `rapid-timing-lint-final.log` and
`rapid-timing-build-final.log`. Initial failure logs are retained.
The final reruns resolve assertions for the added response fields, the normal
replay flag and wrapped notification errors. The runtime check also established
that completed deadline authorization/job records must be retained. The
page-level check added the controls to the actual rapid results view.
The migration generator is retained locally as
`tmp/build-rapid-timing-migration.cjs`.

Root checkout changed-path counts remain 39 backend and 94 frontend.
No production/staging access, real notices, commits, pushes or deployment.
Accepted auction/queue clocks, already-open rounds, extensions, new/removed
rounds, broader matchup/playoff dates, recurring auction settings, scoring and
all other unfinished scope remain pending. The next FAD timing step needs an
explicit correction model that preserves original acceptance receipts while
updating the effective clocks across every reader and worker.

## Local checkpoint: open direct-manager FAD auction clocks

Overall local package estimate: **48%**; league calendar and auction timing
approximately **70%**. This slice is complete locally; the package remains
active and unreleased.

This slice adds preview and confirmation for eligible initial rapid-FAD rounds,
including an already-open round whose auctions were started directly by
managers. Moving a close updates every affected auction, pending resolution
job, round cutoff, successor opening, rollover job and planned draft date in
one transaction. The opening of an already-open round remains fixed. Old and
new closes must both be future times. Queued nomination dependencies,
restricted/fallback paths, completed/overdue work and extension rounds remain
protected. The full calendar task is still unfinished.

The preview returns an affected-auction count without loading bid rows or
revealing players, managers or offers. Original bid terms/timestamps, contexts,
draw commitments and acceptance receipts remain intact. Direct-start replay
uses its permanent start event after later bid edits and validates original
versus effective clocks separately. Replay publication checks distinguish
event type/version, allowing a later clock update in the same millisecond.
General notices and auction invalidation signals commit with the correction.

Changed backend paths in the isolated worktree:

- `database/migrations/0073_allow_active_rapid_fad_timing.sql`: empty immutable
  clock audit table, exact receipt guards, two targeted existing trigger changes
  and schema metadata; no prior league rows changed.
- `src/domain/freeAgentDraft/fadTimingChangePolicy.js`,
  `src/application/services/freeAgentDraft/createFadTimingService.js` and
  `src/infrastructure/persistence/sqlite/SqliteFadTimingRepository.js`: eligible
  clock planning, safe count preview and atomic coordinated writes.
- `src/infrastructure/persistence/sqlite/SqliteFreeAgentDraftAuctionStartWriter.js`:
  original receipt replay after clock corrections and opening-bid edits.
- `src/infrastructure/persistence/sqlite/repositoryCatalog.js` and
  `src/infrastructure/migration/resetManifest.js`: audited table inventory.
- `test/foundation/fadTimingChangePolicyFoundation.test.js`,
  `targetRuntimeFoundation.test.js`,
  `freeAgentDraftAuctionStartWriterFoundation.test.js`,
  `sqliteInitialSchema.test.js`, `sqliteRepositoryFoundation.test.js`,
  `sqliteMigrationCommandSafetyFoundation.test.js`, `resetManifest.test.js`
  and `playerInjuryFoundation.test.js` (schema expectation only).

Changed frontend paths in the isolated worktree:

- `src/features/freeAgentDraft/FadTimingControls.jsx` and its test:
  active-round wording, affected count and preserved-receipt explanation.
- `src/features/freeAgentDraft/FreeAgentDraftPages.test.jsx`:
  current timing response and rapid-page button contract.
- `e2e/fixtures/league-communications.jsx` and `e2e/league-communications.spec.js`:
  protected dates, active auction counts, confirmation and private-request checks.
- `docs/03-product-specs/FREE_AGENT_DRAFT.md`,
  `docs/04-technical-specs/FAD_DEADLINE_CONTROLS.md` and this work plan.

| Verification | Actual result |
| --- | --- |
| Policy/service | Eight cases pass; includes active extend/shorten, fixed opening, protected dependencies, claimed/result jobs, stale preview and elapsed confirmation |
| Populated migration | Schema 72 to 73 preserves every prior league row; exactly two existing triggers change, original auction lifecycle body retained; direct/queue receipt replays and repeated migration remain read-only |
| Existing runtime flows | Unused future rapid rounds, both open-card reminder variants, ordinary auction timing HTTP and FAD cutoff controls pass |
| Active clocks and workers | Real session HTTP preview/apply, extend then shorten, a bid edit after the old close, original receipt retry after bid edit, rejection exactly at the new close, single resolution/rollover and completed read/replay all pass |
| Preservation and guards | All non-target tables including contexts/bids/receipts preserved; GET/preview/retries byte-identical; eight forged clock/job/parent plans rejected; notice and outbox failure injection roll back all changes; immutable audit guards and clean FK/integrity checks pass |
| Start/queue authority | Three existing writer cases pass: original direct receipt, revoked/replaced manager authority, current private queue audience; same-millisecond start and correction signals coexist |
| Schema/inventory | Nine focused checks pass including populated migration, strict schema/indexes, historical/current catalogue, signed reset boundary, local migration-command fixture, runtime construction and endpoint inventory |
| Frontend | 41 tests pass across timing, cutoff and full FAD page files |
| Browser/visual | 16 synthetic desktop/mobile Chromium checks pass; two active-count cases pass again after fixture wording correction; both preview sizes inspected |
| Build/lint/diff | Changed-file ESLint and Vite build pass; existing large-chunk warning remains; both diff checks clean |

There are **26 unique focused backend cases** passing across the recorded runs
and corrected final rerun. Logs are under the E: task `tmp` directory:
`active-timing-regressions.log`, `active-timing-schema-final.log`,
`active-timing-acceptance-final.log`, `active-timing-acceptance-corrected.log`,
`active-timing-front-final.log`,
`active-timing-browser.log`, `active-timing-browser-final.log`,
`active-timing-lint.log` and `active-timing-build.log`.
The migration generator is `tmp/build-active-timing-migration.cjs`.
Earlier failed runs are retained for traceability. They exposed the immutable
context's derived clock fields, the actual worker job type, start-replay lookup
after a bid edit, and publication version scoping. These were corrected. The
last rerun corrected a test assertion to the actual service response: original
start retry returns the current auction projection, without a public replay
flag. All fixtures and TEMP/TMP
remain on E:. Root changed-path counts remain 39 backend and 94 frontend.

Commands use `node --test --test-name-pattern` for the named backend cases,
`vitest run` for the three FAD files, `playwright test` for the communications
fixture at loopback port 5189 (desktop/mobile Chromium), changed-file `eslint`,
`vite build` and `git diff --check`.

No live/hosted access, real notices, commits, pushes or deployment. Next work:
coordinated queued/restricted/fallback/extension clock corrections and broader
matchup/playoff dates. Recurring auction settings, creation configuration,
scoring and all other unfinished scope remain pending. Production-copy
rehearsal, rollback review and authenticated hosted acceptance remain separate.

## Local checkpoint: auction privacy and released-base reconciliation

Overall local estimate: **54%**, with the full package still active.
The committed Goon changes (backend 7c6d820, frontend 29680a6) have been merged
into the isolated working files without a commit, push, deployment or live write.
Released migration 0066 remains unchanged. The feature migrations are now
0067 communications, 0068 deadline controls, 0069 timing, 0070 cutoff,
0071 trade deadline, 0072 ordinary auction clocks, 0073 unused rapid clocks,
0074 active rapid clocks and 0075 private reveal audit.
Earlier checkpoint numbers above describe the historical runs before renumbering.

Ordinary auction responses and correction responses omit other bidders.
Cancellation needs no reveal. Explicit review requires current authority, a
reason, confirmation and an immutable audit record. Team identities and one
selected bid's terms are separate requests. The frontend keeps review data
outside its query cache and clears it on hide, expiry, correction, changed
auction version or lost access. Old durable receipts remain intact and their
responses are redacted on replay.

An administrator can explicitly check the existing operations health endpoint.
The panel displays only approved status fields and invokes no background job.
Detailed recovery controls and catalogue administration remain pending.

Verified local evidence in the task tmp directory:

- Auction frontend: 45 tests; service: 19; focused reader: two. Authenticated
  HTTP reveal, immutable audit, retries, denial paths and ordinary GET privacy pass.
- Reconciled runtime: five tests; schema/inventory: eight; clock policies: 25;
  frontend integration: 77; populated-card migration and processing: two.
- A disposable schema66 unscheduled Goon fixture upgrades through schema75 with
  every prior row unchanged, no generated schedule, native 15-minute/zero-gap
  settings retained and a manager still able to save a private Candidate Card.
  Log: reconcile-goon3.log.
- Health panel and existing administration pages: 51 frontend tests.
- Four desktop/mobile synthetic browser checks pass for health and auction
  privacy. Screenshots exposed a muted-label colour error, corrected afterward.
  Final colour verification is recorded with the subsequent checks.

Migration reconciliation snapshots and reports are retained under
tmp/base-reconciliation and tmp/base-reconciliation-frontend. The original
Goon operations module remains pinned to its reviewed schema66 reset boundary.
A new guided reset must provide its own reviewed preservation/recovery contract.
No production-copy rehearsal or authenticated hosted acceptance is claimed.

## Local checkpoint: league calendar and recurring in-season auction schedule

Overall estimate **58%**; full-package implementation continues.
Additive migration 0076 records immutable calendar changes. Migration 0077 records
versioned recurring auction schedules. Existing leagues retain their default
clocks until a commissioner or administrator explicitly changes them.
The runtime now declares 161 endpoints and schema77 has 153 application tables.

Calendar controls on the competition page display league-local season and
playoff dates, plus all scheduled matchup weeks. A reviewed change coordinates
affected unclaimed jobs and their occurrence keys with week dates. Locked
lineups, completed results, unrelated leagues and original schedule generation
records remain intact. Missing, claimed or attempted work requires recovery.
The first-week start remains tied to the explicit FAD schedule-recovery flow.
Preview reports auction-season reopening/closing and rejects a boundary that
would strand an already-open auction. The previous misleading Edit matchup week
label is now Advance matchup week; that existing action changes due status.

Recurring auction controls choose Monday-through-Sunday closing day, league-local
hour/minute and elapsed-minute cutoff gap. Weekly windows open Monday midnight.
Zero gap accepts starts until the close. Spring DST gaps shift a nonexistent local
closing time forward. Untouched leagues keep the exact old weekly or staging-daily
behavior. Reader capabilities and actual auction creation use the same rule.
Already accepted auctions and their receipts retain their original clocks; their
existing individual timing controls remain available.

Both changes require current authority, valid input, a fresh state-bound preview,
reason and repeat-safe confirmation. History, general activity, in-app notices and
league invalidation commit with the change. GET and preview remain read-only.
No private bid or card details are read by these controls.

Verified on disposable E: fixtures:

- Calendar: seven policy cases plus a populated migration/real HTTP case. Original
  rows and schema objects survive migration; non-target tables survive edits;
  a late notification failure rolls back the entire change. Revoked administrator
  access is rejected. Job clocks and occurrence keys match the revised week.
- Recurring schedules: six custom/legacy/DST policy cases, one real writer/reader
  case and two existing auction-creation/retry cases. New starts use revised
  clocks; exact cutoff rejects starts; existing receipts and other leagues remain
  unchanged. Real HTTP covers session/CSRF, authority, expired previews, rollback
  and repeat-safe confirmation. Calendar HTTP passes again on schema77.
- Six schema/catalogue/reset/migration-command checks pass at schema77. Two
  endpoint inventory/installation checks pass. Released migration66 is unchanged.
- Calendar frontend: 39 tests across final reruns. Recurring schedule, competition
  and auction contracts: 50 tests. Desktop and phone browser previews pass; both
  sizes visually inspected. Health-panel label contrast was corrected and its
  final phone screenshot inspected.
- Changed-file lint, Vite builds and focused checks pass. Existing bundle-size
  warning remains. Initial test failures are retained alongside corrected runs.

Evidence: task tmp calendar-* and auction-schedule-* logs. Calendar schema test
needed the expected table inventory reordered; schedule request normalization
was made canonical after testing exposed object-key-order sensitivity. The
elapsed-preview HTTP test renews its synthetic session before testing the later
boundary, so session expiry does not mask the intended stale-preview assertion.

Primary files: LeagueCalendarControls.jsx and LeagueAuctionScheduleControls.jsx,
their domain/service/SQLite/router counterparts, auctionCreationPolicy.js,
leagueAuctionSchedule.js, both auction repositories, runtime/inventories,
competition page, notification contracts, focused tests and calendar fixtures.
All changes remain uncommitted and unpublished. Full remaining scope above,
broader worker acceptance, final release review and staging handoff are pending.

## Local checkpoint: league scoring values and comparisons

Overall local estimate **62%**; full-package implementation continues.
Migration78 adds immutable per-season rules without changing any existing league
records or results. All 13 categories have separate forward/defence weights,
including game-winning bonuses. The default effective week is future; an unfinished
current week can be chosen deliberately. Completed periods cannot be silently
rewritten. Current/historical comparisons preserve original lineups and source
statistics. See [League scoring controls](../04-technical-specs/LEAGUE_SCORING_CONTROLS.md).

Matchups, provider corrections, roster displays and league player rankings use
the appropriate league rules. Ranking/cursor calculations apply weights before
pagination. Global catalogue defaults and original raw statistics stay unchanged.
Manager rules and stat guides display actual values. New responses include the
custom version and complete weight map; contracts verify exact totals.

Verified: four new policy cases; populated migration and real authenticated HTTP
with rollback/retry, scoped ranking and readonly evidence; existing result and
public-roster regression (30 cases); custom/default NHL correction fixtures;
live and historical comparisons without writes; schema/catalogue/reset/runtime
checks and unchanged legacy pagination; release-QA workspace verification at78.
Focused frontend checks cover all changed screens. Two desktop/mobile browser
checks pass; both final screenshots inspected. Changed-file lint and build pass
with the existing chunk warning. Initial syntax/test-fixture failures were fixed
and corresponding checks rerun. The dashboard test fixture now supplies its real
session context and accounts for read-only announcement loading.

Current inventory: schema78,154 application tables,165 endpoints. Exact commands
and logs are retained under task tmp/scoring-*. No live reads/writes, real notices,
commits, pushes or deployment. Remaining scope rows, final broad regression,
production-copy rehearsal and authenticated staging testing remain separate.

## Local checkpoint: reports, pick repair and pause/resume

Overall local estimate **70%**. The package is still being implemented; it has not
been published for staging testing. Schema80 contains155 application tables and
175 declared endpoints. Schema79 adds immutable management receipts; schema80
guards paused job claims and permits the existing reviewed FAD timing operations
while frozen. It preserves every other timing-trigger predicate.

Readiness, searchable change history, explicit reference exports and missing-pick
repair are covered by [League management controls](../04-technical-specs/LEAGUE_MANAGEMENT_CONTROLS.md).
Reports are readonly; history searches before pagination and never reads private
bid/card snapshots. A101-job fixture verifies full counts with100 displayed.
Upcoming-draft repair requires evidenced order and reviewed ownership, preserves
all existing picks, and commits receipts/notices atomically. Started/completed or
ambiguous drafts require their supported recovery rather than guessed picks.

Pause reuses league_freezes. It waits for claimed work to finish; expired leases
also require recovery. Manager auction/trade/card/roster actions stop, as do
automatic FAD, ordinary auction, trade-expiry, matchup and season-rollover work.
Global statistics, messages and backups continue. Reads and supported timing
corrections remain available. Pausing/resuming changes no saved deadline, bid,
card, roster, result or trade. Resume shows overdue counts and explicitly warns
that due work may process immediately. Original setup/active state is restored
from the immutable pause receipt. Unsupported older freezes fail closed.

Evidence on disposable E: fixtures:

- Management real HTTP: authority and revocation, read-only bytes, two-league
  privacy,52-row filtered pagination and101-job totals. Regular/daily FAD progress
  passes. Frontend35 tests pass after fixing a retry assertion that compared
  callback function identity; four desktop/phone browser checks pass and were
  visually inspected. Pick policy5 cases and populated schema78 migration pass.
- Pause real HTTP: current authority/CSRF, busy-job refusal, late-failure rollback,
  preserved tables/clocks, safe retries, paused job insert/update rejection,
  roster-action denial, stale overdue preview and original-state restoration.
  Five composed FAD cases pass, including actual readiness worker holds and
  open-card rescheduling while paused. Active rapid auction timing, paused due
  resolution/rollover, and subsequent once-only resolution pass. Ordinary bids,
  pending trade expiry, matchup work and season-rollover claims are preserved.
- Pause policy4 cases, strict-schema checks, roster/rollover regression14 cases,
  frontend44 tests, two browser checks and both screenshots pass. Changed frontend
  lint and Vite build pass; existing chunk-size warning remains.

Logs: tmp/management-*, pick-repair-*, pause-*. Initial test failures were retained
and corrected: a missing outbox audience in a preservation allowlist, a misplaced
runtime DB reference, a fixture timestamp constant, and the separate FAD auction
resolver scan that also needed the pause filter. Full final regression remains
pending. No commits, pushes, real notifications, live writes or deployment.

## Release gate

Before any proposed publication: review exact changes and migration coverage,
fresh encrypted backup with isolated restore verification, narrow release
manifest, compatible rollback, read-only preservation checks and separate
authenticated acceptance. Never restore an old snapshot over later manager work.

## Local checkpoint: private manager help

Added schema 81 and GET/list/target/detail plus explicit create/event routes under `/leagues/:leagueId/help`. Requests are private to the requester and current commissioner or administrator with league membership. Current managed teams and owned auction/roster/trade records determine selectable targets; listing targets never fetches hidden bid contents. Existing Candidate Card help is linked with its original explicit grant and permission checks. Replies, resolution, withdrawal and reopening retain immutable events, current authority, optimistic versions and stable retry keys. Inbox notices contain no private request text and go only to the other current participant.

Verified real authenticated HTTP: schema-80 populated records and SQL objects preserved, readonly request/target reads, other-manager denial, wrong-team denial, bad-CSRF denial, admin revocation, atomic rollback on notification failure, exact replay and stale-version conflict, retained conversations and integrity checks. Strict schema and signed reset inventory pass after correcting the expected alphabetical table order. 48 frontend checks across help/dashboard/competition/notification contracts pass; both desktop/mobile Chromium checks pass and screenshots were inspected. Changed frontend files lint clean.

Overall local estimate: 73%. No commit, push, staging publication, hosted acceptance or live league action. Guided resets, eligible reversals, catalogue controls, season preview, remaining timing paths and final regression/handoff still pending. Evidence is in the isolated task tmp directory (`help-http-final.log`, `help-schema-final.log`, `help-front.log`, `help-browser.log`, `help-lint.log`).

## Local checkpoint: recovery, health and season preview

Recovery hub lists scoped failures and links existing FAD retries, completed-trade reversal, result correction and roster tools. GET never retries jobs or clears leases. Added a preview/confirm control for the existing eligible derived-standings rebuild; corrected the integration replay path to return the original durable result after its snapshot changes. Finalized standings still require result correction. History includes completed standings rebuilds. Admin health adds bounded email/job counts and latest backup outcome without payloads or raw errors; no-store is explicit.

Season preview uses a new read-only wrapper around the exact existing rollover matrix. It shows contract expiry/continuation, carried/released rights, retention/buyout obligations, affected trade count without proposals, existing next-season pick owners and retained result counts. Missing next-season data and unfinished preparation stay explicit; no placeholder dates or schedules are created.

Evidence: recovery HTTP/regression 16 passing; populated admin health and durable rebuild retry 2 passing; frontend recovery/health/competition 32 passing; desktop/mobile recovery 2 passing and screenshots inspected; build and changed-file lint pass. Season matrix/HTTP scope checks 3 passing; populated full-schema contract projection 1 passing with byte-identical database; frontend season/competition 28 passing; desktop/mobile season preview 2 passing and screenshots inspected. Schema remains 81, with 182 target endpoints.

Overall local estimate: 78%. Remaining: guided reset, eligible administrative reversals, catalogue controls, remaining FAD/creation timing and calendar recovery boundaries, final preservation regression and staging handoff. All evidence is local on E:. No commits, pushes, staging publication or live data changes.

## Local checkpoint: catalogue and administrative reversals

Overall local estimate: **83%**. Schema 82 has 157 application tables and 188 declared endpoints. Targeted administrator catalogue search/import/refresh uses verified single-player NHL responses, rejects ambiguous existing identities, preserves existing IDs and league records, rechecks authority after network requests, and retains atomic immutable receipts. Source/state changes require a new preview; exact retries bypass the provider and return the original saved result.

Eligible roster and contract reversals use the existing correction writer, preserve original evidence, check versions and later player transactions, preview values/warnings, record an inverse correction and notify current members. Unchanged retries are read-only; notification failures roll back the whole correction. Active-team transfers return the player through a new ownership tenure. Add/remove and incompatible later state use the existing specific tools. Post-commit late-lock status is visible when it needs attention.

Verified: catalogue HTTP preservation/authority/CSRF/duplicate/provider-change/replay/rollback; two adapter validation/timeout tests; complete schema and route dispatch tests (11 cases together). Catalogue frontend 25 checks, two desktop/mobile checks, lint and build passed. Reversal real HTTP verifies roster, contract, team-transfer, other-table preservation, stale preview, late transaction, admin revocation, immutable original evidence and rollback/retry; route dispatch plus preservation 8 passing, expanded transfer rerun 1 passing. Reversal frontend/competition/notification 37 passing, final focused frontend 5 passing; combined catalogue/reversal browser 4 passing and screenshots inspected. Logs remain in task tmp under catalogue-*, reversal-*. Initial failures were retained and corrected (stale route counts, settings-table order key, contract-year projection, inactive fixture teams). UI spacing was improved after screenshot review.

Migration 66 is byte-identical to released backend commit 7c6d820: SHA-256 795f5895220874137542fb9fad36c1558d739cf778280e10d1b3b4fa8a28d991. Historical Goon reset guards remain intact. No commit, push, live write or staging publication. Guided resets, remaining timing/creation/calendar paths, broader regression, complete migration/rollback rehearsal and staging handoff still remain.


## Local checkpoint: guided preseason reset

Overall local estimate 86%. Schema83:159 application tables,191 endpoints. Reset/restore is implemented with encrypted retained archives, exact cloned recovery rehearsal, preserved manager access/other leagues, immutable audit and explicit typed confirmation. Actual setup trade-deadline/start/schedule/readiness restart passes. See LEAGUE_MANAGEMENT_CONTROLS.md for limits and evidence. Core/API/crypto3 checks, schema/dispatch17 checks (signed inventory order corrected in a separate passing rerun), frontend42 checks across the initial41-pass run and corrected seven-case setup/reset rerun, browser2 checks and inspected screenshots. Logs: tmp/guided-reset-*. No publication, live operations, commits or pushes. Remaining timing/calendar and broad preservation/regression/handoff continue.


## Local checkpoint: creation cutoff and missed roster lock

Overall estimate88%. Populated reset rehearsal now clears/restores awarded contracts and private bids in a cloned database without changing the source. A discovered reset-boundary error was fixed: eligibility uses the league first matchup, not the NHL regular-season start. Schema84 adds optional creation cutoff configuration without new tables. Real zero-gap15-minute FAD workers pass. Calendar recovery for a never-attempted overdue roster lock passes an actual worker run at the new time; existing locks/results/leases remain protected. Reset, creation and calendar details are in LEAGUE_MANAGEMENT_CONTROLS.md. Remaining: advanced FAD timing paths, Week1 schedule dependency review, final regression/migration/rollback and staging handoff. No publication or live changes.

## Final local checkpoint: ready for staging testing

All approved control groups are implemented within the current scope table's
explicit dependency safeguards. Advanced accepted queue/restricted/fallback and
extension-recovery timing remains with the existing recovery workflows. General
calendar editing waits for FAD completion; pre-card Week 1 changes use a reviewed,
versioned shift that passes the actual readiness worker. These are deliberate
preservation boundaries, not claims of arbitrary historical editing.

Final evidence: all 877 frontend tests in 112 files pass with the pinned Vitest
4.1.11; all 46 desktop/mobile Chromium checks pass on a fresh dependency install;
lint and local/staging builds pass with the existing bundle-size advisory. The
broad backend run executed 926 tests. Its 27 failed results, including two parent
tests, are covered by passing corrected runs; the separate 72-case target-runtime
run's four migration-scope failures also pass after correction. The machine-readable
verification record maps all 29 named failures across both initial runs to passing
evidence, with none unresolved. Populated migration 66-to84, encrypted recovery,
isolated restore, privacy, authority, stale confirmation, retry and actual worker
checks pass. Raw initial failures and diagnostics are retained.

The last repairs retain legacy/current auction receipts, remove participant
identity from restricted cancellation responses, align old schema assertions,
and compare complete SQL state for nested-savepoint rollback. The latter was
verified to preserve every table/row identity/schema/integrity result; read-only
and retry byte assertions remain. No trade execution change was needed.

The staging handoff contains the full acceptance checklist, exact source bases,
configuration, rollback limits and evidence locations. A staging-configured web
bundle and ZIP are prepared with build ID
`commissioner-controls-20260930-candidate`; its origins, assets and hashes are
verified. The final source manifest retains every released-baseline file and
records all additions/modifications. Migration66 remains byte-identical to
released `7c6d820`. Both root checkouts retain their original HEADs and dirty-path
counts (39 backend, 94 frontend); their application files and dependencies were
not edited. Work remains uncommitted, unpushed and unpublished on E:. Live leagues
and real communications were not changed.
