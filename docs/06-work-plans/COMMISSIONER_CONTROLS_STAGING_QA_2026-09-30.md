# Commissioner controls: staging test handoff

Status: local implementation and verification complete; ready for staging testing.
Nothing in this package has been
committed, pushed, published to staging, or applied to a live league.

## Candidate source

- Backend: `E:/hundo-leago-backend/.hundo.local/commissioner-controls-20260929/backend`
- Frontend: `E:/hundo-leago-backend/.hundo.local/commissioner-controls-20260929/frontend`
- Both branches: `codex/commissioner-controls-20260929` (uncommitted changes).
- Reconciled released source: backend `7c6d820`, frontend `29680a6`.
- Schema: 84; application tables: 159; target endpoints: 191.
- Local evidence: sibling `tmp/`; final synthetic browser preview on port 5190.
- Prepared staging frontend: sibling `staging-web/` and `staging-web.zip`;
  build ID `commissioner-controls-20260930-candidate`. The compiled environment,
  staging API/socket origins, HTML asset references and file hashes are verified
  in `tmp/staging-web-manifest.json`. This artifact has not been uploaded.

The worktrees were created before the released Goon change. Their Git HEADs are
backend `f8ac563` and frontend `2c1ced5`. The candidate includes the released Goon
files and retains migration 66 unchanged. A release must include new files as
well as tracked diffs; a plain diff against HEAD is not a complete package.
Do not replace the dirty root repositories or reuse their unrelated changes.
Before publication, compare the current deployed source with these pinned
baselines and reconcile any intervening release. The local manifest does not
claim that a remote deployment has remained unchanged while this work ran.

## Environment for acceptance

Use an isolated staging database with two disposable leagues and accounts for
a commissioner, a second manager, an administrator, and a user with no access.
The commissioner should also manage a team, so privacy checks exercise the
normal competitive role. Keep email in capture mode and statistics/catalogue
providers in their configured staging mode. Confirm the visible host, account,
league name and role before each destructive fixture action.

Run migrations 67–84 after a fresh staging backup and verified restore to a
separate path. Migration 66 must match its released checksum. Deploy backend
and frontend as one coordinated candidate: the new UI requires the new API.
This document is a testing handoff, not authorization to publish or alter data.

Build the hosted frontend with `VITE_APP_ENV=staging` and both
`VITE_API_ORIGIN` and `VITE_SOCKET_ORIGIN` set to the approved staging API origin.
The local verification build uses loopback origins and must not be uploaded as
the hosted bundle. The separate `staging-web` artifact has the staging values.
Keep the existing backend session/CORS/security configuration
for staging. Retain `ACTION_TOKEN_DELIVERY_KEY` and its key version with reset
archives; do not generate a replacement merely for this update.

Confirm `FREE_AGENT_DRAFT_ROUTES_ENABLED` for FAD acceptance. Automatic deadline
and rollover acceptance also needs the existing scheduled-job runner enabled
for the disposable staging environment. Scoring acceptance should exercise both
the configured scoring mode and its corresponding categories; expanded scoring
depends on the existing completed-game NHL source configuration. Do not switch
providers or enable broad background processing just to obtain a green page.
Record the actual settings and worker observations in the staging test report.

## Website acceptance checklist

Most league tools are on the Commissioner page. FAD target/timing controls also
appear in the draft pages; private reveal and single-auction timing controls are
beside auction administration. Platform health and player catalogue controls
are on the administrator page. Manager help and announcements use the normal
league/member views.

| Area | Test | Expected result |
| --- | --- | --- |
| Candidate progress | Save complete, partial and empty cards from different managers | Commissioner sees manager/team status and counts; no players, offers or card contents in the page or network response |
| Soft deadline | Let the target pass with an unfinished card | Cards remain editable; allocation/rollover holds; status explains the hold |
| Automatic deadline | Have every card complete and valid at the target | Deadline processing runs automatically once; never runs early |
| Held draft | Finish the last card after a hold, then explicitly proceed or reschedule | Saving alone does not release the hold; reviewed commissioner action does |
| Creation timing | Create a short draft with 15-minute rounds and a zero-minute cutoff | Saved schedule and actual workers use those clocks; old defaults remain valid |
| FAD timing | Change eligible round times with an open manager-started auction | Preview lists affected clocks without bid details; bids and original receipts remain; worker resolves once at the new time |
| FAD cutoff | Change the gap before the next unused round | Only eligible unused/future rounds use the new gap; committed rounds retain accepted timing |
| Seasonal auctions | Change recurring close day/time/gap, then one eligible open auction | New starts use the schedule; existing auctions change only through their own reviewed clock edit |
| Private auction edit | Open controls, cancel an accidental auction, then try a selected-bid edit | Cancellation needs no reveal; private identities/offers require a separate scoped, reasoned, audited reveal |
| Calendar | After FAD completion, change future matchup boundaries and playoff dates; separately change a trade deadline | Preview shows affected work; jobs move with dates; overdue unattempted roster locks can be recovered; completed work remains protected |
| Draft-bound calendar | Try general calendar editing before FAD completion | UI explains the dependency and server refuses without writes; draft timing/recovery and eligible pre-card Week 1 controls remain available |
| Week 1 | Before cards open, preview a valid shift that retains the matchup count and complete calendar | All affected weeks are shown; typed confirmation and unchanged preview required; subsequent FAD readiness succeeds |
| Scoring | Reduce hits, choose a future week and preview current/historical scoring | League-only versioned weights apply consistently; completed results require explicit result correction |
| Reminders | Preview recipients, send once, retry the same confirmation | Correct managers receive one in-app notification; no competing private contents |
| Announcements | Publish, pin, expire and archive a message | Member visibility follows dates and archive state; history is retained |
| Readiness/help | Review missing setup items; manager submits a linked help request | Correct existing tools are linked; request is private to requester and current commissioner/admin |
| Pause | Pause, let deadlines pass, review resume | Transactions and scoped workers hold; saved timestamps/bids remain; overdue impact is visible before resume |
| Recovery | Retry supported FAD work and rebuild eligible derived standings | Current authority and dependency checks apply; no duplicate awards or recomputation on accepted retries |
| Picks/reversals | Repair an evidenced missing pick; reverse an eligible roster/contract correction | Existing ownership/history retained; stale or later dependent changes refuse reversal |
| Admin tools | Inspect health; preview one catalogue import/refresh | No secrets or raw errors; stable player identity; no unrelated roster/contract changes |
| Export/season | Export current-season reference data and preview rollover | Competing private cards/bids excluded; contract/pick effects visible; no invented preparation dates |
| Guided reset | Pause an eligible preseason fixture league; review reset manifest; type league phrase | Rehearsal verified before confirmation; league identity/access and other league retained; new dates unset |
| Restore | Restore immediately; repeat with later target-league activity | Exact eligible restore and repeat-safe receipts; later work is never overwritten |
| History | Filter by type, actor/reason and paginate | Correct scoped events, including reveals, scoring, resets and reversals; no private values |

For every write, also exercise manager denial, wrong league, revoked authority,
bad CSRF, changed state after preview, double click and an interrupted response.
Inspect both desktop and phone layouts. A passing synthetic fixture or anonymous
hosted page does not count as authenticated staging acceptance.

## Local verification record

All logs below are in the isolated task's sibling `tmp/` directory. Failed
intermediate runs are retained; a repaired check is identified by its corrected
run, rather than representing an earlier failing log as green.

| Check | Evidence |
| --- | --- |
| Full frontend suite, lockfile-matched dependencies | `frontend-locked-full-regression.log`: all 877 tests in 112 files passed |
| Frontend lint/build | `frontend-locked-lint.log`, `frontend-locked-build.log` pass; existing large-bundle advisory remains |
| Desktop/mobile Chromium | `frontend-locked-browser.log`: all 46 passed on the fresh dependency install/server; includes privacy, communications, calendar, scoring, help, pause, recovery, reset, catalogue, reversals and season preview |
| Backend changed-file regression | `changed-backend-regression.log`: 926 tests executed, 899 initially passed and 27 failed (including two parent tests). Every failure has a passing corrected run below; `verification-summary.json` maps all named failures from this and the target-runtime run to passing evidence, with zero unresolved |
| Target runtime integration | `target-runtime-full.log`: 68/72 passed initially; four migration-scope assertions corrected and all four pass in `migration-scope-regression.log` |
| Whole migration and rollback | `whole-package-migration-fixed.log`: populated schema 66 to 84, old-table hashes, encryption/tamper rejection, isolated restore and unchanged migrated source pass |
| Cancellation compatibility | `auction-receipt-regression-fixed.log`: all 10 repaired SQLite cancellation/recovery/replay/rollback cases pass; `receipt-policy-fixed.log`: 17 passed |
| Cancellation privacy | `auction-service-privacy-final.log`: 20 passed, including participant redaction on fresh and historical responses; `auction-response-contracts-final.log`: 32 frontend tests passed |
| Other regression repairs | `regression-repairs-focused.log`: six corrected privacy/timing/pricing cases pass; its three earlier receipt failures are superseded by the 10-case corrected run above |
| Schema/runtime expectations | `schema84-final-expectations.log`: three passed for the full migration ledger, 159-table catalogue and scoped reads; `schema84-health-final.log` and `schema84-preflight-final.log` each pass for schema reporting and unchanged failed preflight |
| Trade repairs | `trade-regression-final.log`: all 50 HTTP counter/three-team/deadline checks pass. The migration assertion now isolates migration 71 before exercising the latest schema. Three nested-savepoint rollback assertions compare every row, row identity, schema object, version and integrity result; read-only/retry byte comparisons remain |
| Week 1 and calendar workers | `week-one-shift-worker-timetable.log`, `calendar-guard-confirmation.log`, `calendar-lock-final.log` pass; `calendar-ui-final-threads.log`: seven frontend tests passed |
| Source inventory | `staging-release-manifest.json`: final released-base comparison and exact current file hashes; no deleted released files |

The rollback diagnostic confirmed unchanged SQL state despite different
serialized bytes after a failed inner savepoint. This was a test assertion issue;
no trade execution code was changed for that repair. Both trade parent tests and
all their scenarios pass in the corrected run. The first broad run is retained
as failing evidence, not relabelled as a single green run.

Use Node 24.14.1 and each repository's lockfile. In the frontend, the verified
commands are `npm ci --no-audit --no-fund`, `npm run lint`, `npm run build` and
`npm test -- --pool=threads --maxWorkers=2`, with the environment set explicitly.
The earlier shared dependency install had Vitest 4.1.10; final evidence uses the
candidate's pinned 4.1.11 in its own worktree dependency directory.

The backend uses `node --test --test-concurrency=2` with the changed foundation
test files, plus the complete `test/foundation/targetRuntimeFoundation.test.js`
suite and focused corrected reruns. The populated package rehearsal is
`node --test test/foundation/commissionerControlsMigrationFoundation.test.js`.
Set `TEMP` and `TMP` to a disposable E: directory before running backend tests.
Never point tests, fixture builders or rollback rehearsals at a hosted database.

## Deliberate safety boundaries

- Accepted queued nominations, restricted/fallback auction clocks, extension
  recovery and completed/claimed work cannot be rewritten by the general timing
  editor. Their existing recovery workflows remain authoritative. No sealed
  offers or historical acceptance evidence is rewritten to make a date fit.
- Week 1 shifts are available before cards open and must preserve matchup count,
  pairings, the complete calendar through playoffs and a valid FAD timetable.
  After cards open, use the existing FAD schedule-recovery path. General season
  calendar editing waits for FAD completion because readiness and completion
  depend on the confirmed schedule. It cannot replay locks or results. The
  dedicated draft timing, cutoff and trade-deadline controls remain separate.
- Guided reset is for eligible preseason leagues. It refuses played history,
  existing roster locks/results, entry drafts, active processing or unfinished
  delivery. Its synchronous rehearsal is bounded to 256 MB for the database and
  24 MB for the scoped archive. It requires the original delivery encryption key
  for restoration and explicit schema compatibility.
- Scoring changes do not silently rewrite completed results. Trade deadlines
  use future dates; backdated corrections are separate operations.
- Communications currently deliver in-app reminders and announcements. They do
  not send external email or text messages.

## Rollback and preservation

The full local rehearsal migrates a populated two-league schema-66 fixture to
84, compares all pre-existing table hashes, verifies authenticated encryption
and decryption of a verified backup, restores schema 66 to a separate clean
path, and proves the migrated source was not replaced. This is synthetic local
evidence; repeat the approved staging backup/restore process before publication.

Old backend binaries require their matching schema. Do not roll back just the
binary against schema 84. If a rollback needs an older database, stop writes and
account for every change since the backup first. Never restore an old snapshot
over later manager activity. Retain reset archive keys with the matching backup.

Record the exact published commits/build IDs, migration result, staging host,
test account roles, fixture league identifiers, actual worker results and every
remaining failure in the acceptance record. Production release and production
league operations require their own explicit authorization and preservation
checks.
