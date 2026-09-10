# NHL statistics and automatic matchups — 8 September 2026

## Scope and status

Graem requested the next work toward launch and then authorized the proposed statistics and automatic matchup implementation: “do it, work until completed.” Graem subsequently approved the prepared commit, push and staging deployment with both new controls kept off: “yes, and continue working.” This record covers implementation, verification, staging publication and identity preparation. Hosted enablement, authenticated acceptance and production launch are separate gates. The operating mode remains `OFFSEASON_RESET`.

**Published and operationally verified on staging:** backend `23709ea093cc393718af49e1207cba5e6291ed43` passed the complete Render gate: **3,566 tests across 443 suites, zero failures or skips**. Both new controls are explicitly false. No authenticated refresh, automatic matchup enablement or production release is claimed. Earlier local counts below are historical checkpoints, not additional unique tests.

**Approved identity updates completed, 9 September UTC:** the initial 2,677 links and separately approved final nine links were added after fresh verified encrypted staging backups. All 132 protected tables and all existing provider IDs were preserved. Independent read-only verification confirms NHL identity coverage for **all 411 rostered players**, with 2,686 mapped catalogue players. Stored names and birth dates remain unchanged. Old-source week safeguards and authenticated acceptance remain separate gates; see the latest checkpoint at the end of this record.

This amendment implements the completed-game model clarified on 11 August. It replaces the deferred provider-neutral implementation clauses in Scoring Rules, Matchups, and API Contracts for this candidate. Historical provider-specific clauses remain evidence of the earlier design. The frontend remains the September UI review release; the backend now serves this statistics candidate with its new controls disabled.

## Statistics source and schedule

- The current-season source is `nhl-completed-games`, using NHL's public HTTPS APIs. Stable player identities use the existing `player_external_ids` namespace `nhl`. Historical SportsDataIO imports remain available.
- The configured eight-digit NHL season key and regular-season game type are checked against every schedule and boxscore response. NHL statistics and SportsDataIO live statistics cannot be selected together.
- Completed-game rows are paginated with a stable player/game ordering, four bounded parallel page reads, exact totals, duplicate checks, per-game coverage checks, and goal/assist/point consistency checks. Required players' current identities and recent completed boxscores are cross-checked. Live game points do not enter completed totals.
- Every mapped catalog player starts at zero for the selected season. Unavailable schedules, missing required identities, inconsistent snapshots, and failed requests remain explicit failures. A failed refresh preserves the last successful sealed snapshot and totals. Current player reads use the selected season and provider, with no prior-season fallback.
- The four routine refresh slots are **18:00, 20:00, 22:00, and 23:45 America/Vancouver**, including daylight-saving transitions. Existing matchup boundary refresh occurrences remain separate.
- `job_runs` stores a durable slot claim, attempt count, completion and safe failure code. A completed slot cannot repeat after restart. A failed slot can retry after 15 minutes; a ten-minute lease protects completion. Startup catches up the latest due slot, rather than replaying every missed evening.
- Provider requests have a twenty-second timeout and at most three attempts. Player and boxscore request starts are spaced by at least 350 ms. HTTP 429 responses respect `Retry-After` seconds or HTTP dates, or wait thirty seconds when that header is unavailable. A provider hold longer than sixty seconds rejects the capture rather than retrying too early. A complete snapshot must fit within five minutes. No schema migration is introduced; this candidate uses schema 55.

Primary contracts checked with read-only requests: [NHL season games](https://api.nhle.com/stats/rest/en/game?cayenneExp=season=20252026%20and%20gameType=2&start=0&limit=2), [NHL individual skater game totals](https://api.nhle.com/stats/rest/en/skater/summary?isAggregate=false&isGame=true&start=0&limit=2&cayenneExp=gameId=2025020001), [NHL boxscore](https://api-web.nhle.com/v1/gamecenter/2025020001/boxscore), and [NHL player identity](https://api-web.nhle.com/v1/player/8478055/landing).

## Matchup behaviour

Monday midnight starts the week, 01:00 captures the baseline, 16:00 locks normal rosters, and the following Monday midnight ends the scoring window. The persisted schedule and league timezone remain authoritative. The existing 12-forward/6-defence legality checks, immutable roster snapshots, result replay protection, and standings services are retained.

NHL scoring sums sealed completed-game goal and assist evidence within the week by scheduled game start, at 1.25 points per goal and 1 point per assist. This keeps a Sunday game in its starting week even when it finishes after Monday's baseline, and excludes next-week games when finalization is delayed. Baselines remain immutable. The existing games-played delta continues to describe the change in cumulative games since the saved baseline; scoring eligibility is determined separately by game evidence.

A team illegal at the normal lock earns no points until a legal late snapshot is saved. Roster changes use recently cached game-state evidence and never fetch statistics. If that evidence is unavailable or over five minutes old, the roster change remains committed and scoring awaits the next statistics refresh. A scheduled refresh retries eligible late locks using the current committed roster. Points begin at the saved late snapshot; an earlier roster-change time is not backdated.

Late snapshots atomically retain the roster, baseline, game observations and immutable whole-game exclusions. NHL scoring includes only games starting at or after the late snapshot, excluding any game identified as already underway. In-progress, completed and historical game identities remain bound to the exact source snapshot. A lookup cannot reuse a pre-game observation after its scheduled start has passed.

An unfinished covered game in the ending week blocks official finalization with `NHL_GAMES_NOT_COMPLETE`. Postponed/cancelled games do not block it. Once complete evidence is available, existing durable matchup occurrences finalize results and update standings. A replay returns the existing result.

## Administrator operations

`POST /api/v1/operations/statistics/refresh` accepts exactly `{}`. It requires a valid session, allowed origin, CSRF proof and current platform-administrator authority, checked again before persistence. It is available only when the NHL source is explicitly enabled, and it obeys the league write gate. The response is HTTP 200 after completion, with `data.jobId`, `status`, `playerCount`, and `capturedAtMs`. Overlapping manual requests return 409. Provider failures return a safe message and preserve prior results.

`GET /api/v1/operations/statistics/refreshes/:jobId` requires a valid administrator session and returns a bounded durable status projection. It performs no refresh or league-state write. Ordinary managers and commissioners have no authority to run these platform operations.

## Staging enablement procedure

1. Publish the reviewed backend candidate through the normal staging release process. Record its exact commit/deployment and health receipt. Publishing and enabling jobs are distinct actions.
2. Run the read-only identity preflight against a verified staging database copy:

   ```powershell
   & 'E:\hundo-tools\node-v24.14.1-win-x64\node.exe' scripts/inspect-nhl-statistics-readiness.js '<E-drive database copy>' 20262027
   ```

   Exit 0 means identity/source prerequisites pass, exit 2 reports readiness blockers, and exit 1 reports an invalid invocation or unreadable/incompatible database. The command never initializes or migrates a database. It reports the catalog threshold, missing current roster identities, coverage requirements, current successful refresh, and unfinished locks using another provider. It does not certify provider availability or hosted acceptance.
3. Resolve reported missing NHL IDs with verified NHL identities attached to the existing player UUIDs. Preserve ownership, contracts, drafts and historical provider data. The refresh does not guess a cross-provider mapping. A live matchup using another source must not have its baseline replaced.
4. Enable `NHL_COMPLETED_STATISTICS_ENABLED=true`, retain `SPORTSDATAIO_NHL_LIVE_MODE=disabled`, and leave `MATCHUP_PROCESSING_ENABLED=false`. Confirm a successful current-season administrator refresh and the expected selected-season player values. `SCHEDULED_JOBS_ENABLED=true` and `LEAGUE_WRITE_MODE=open` are also required for scheduled execution. Existing maintenance holds still apply.
5. Exercise a disposable staging week with normal and late legality, a failed/recovered refresh, unfinished games, result finalization and standings. Check hosted authenticated roles and repeat requests. Then enable `MATCHUP_PROCESSING_ENABLED=true` for the authorized staging scope.
6. Record hosted acceptance separately. Production launch still requires its own release authorization and launch gates.

Both new flags default to false and accept only `true` or `false`. Matchup processing requires the completed-game NHL source. Statistics-only enablement performs no post-roster late locks. The staging daily-auction scheduler filter includes only the newly selected statistics/matchup jobs, alongside its already enabled auction/outbox jobs.

To stop new processing, turn both flags off and restart through the deployment process; preserve all snapshots, claims and results. Changing the source of an unfinished matchup is not a rollback procedure.

## Verification evidence

- Public adapter acceptance: the actual completed 2025–26 season was read in 488 requests in 22,459 ms. One required NHL identity (`8478055`) resolved to 80 games, 2 goals and 26 assists, with 80 game observations. This was a read-only provider check with no database access; it does not establish 2026–27 hosted acceptance.
- Current-season public adapter acceptance: the actual 2026–27 schedule passed in 15 requests in 1,207 ms. The same required identity returned exactly zero games, goals and assists with no completed-game observations. No league database was opened.
- A real in-memory SQLite database was migrated to schema 55 and exercised through a whole simulated week: zero-current-season initialization, baseline capture, a legal normal lock, an illegal opponent, stale late evidence, roster restoration, a successful late snapshot with 18 whole-game exclusions, provider failure/recovery, pending-game finalization, delayed finalization, result replay, official standings and foreign-key checks.
- Added a Sunday game finishing after Monday's baseline. It initially reproduced a 67.50 versus 22.50 scoring error, then passed after game-window scoring. The final expected result remained 40.50–18.00 despite a next-week game already being present in cumulative totals.
- Identity preflight tests compare serialized database contents before and after inspection. Administrator HTTP tests cover session, origin, CSRF, role authority, input validation, concurrent refresh rejection and read-only status.
- Combined regression: **269 passed, 0 failed**, across 24 suites in 865,089 ms. Covered runtime composition and all 125 endpoint contracts, deployment configuration, scheduled jobs, player reads, matchup source health, late locks, statistics persistence, scoring, result finalization, occurrence handlers, normal locks and the new feature checks.
- Final feature verification: **21 passed, 0 failed** after the Sunday/Monday correction and connection-reset/timeout retry check. This overlaps the combined suite and is not an additional unique-test count.

Local receipts live under `E:/hundo-leago-backend/.hundo.local/statistics-matchups-20260908/`: `public-provider-receipt.json`, `public-provider-20262027-receipt.json`, `integration-check.log`, `week-boundaries.log`, `final-regression.log`, `final-feature-checks.log`, `final-runtime-check.log`, and `completion-receipt.json`.

The combined command used Node 24.14.1, `--test --test-concurrency=4`, and the eighteen files named in `completion-receipt.json`. Test temporary files were confined to the receipt directory's `tmp` subdirectory on E:. `git diff --check` passed.

## Changed-file guide

All application changes are in `E:/hundo-leago-backend/`:

| Area | Files |
|---|---|
| NHL source and identity readiness | `src/infrastructure/nhl/NhlCompletedGameAdapter.js`; `src/operations/statistics/inspectNhlStatisticsReadiness.js`; `scripts/inspect-nhl-statistics-readiness.js` |
| Durable evening schedule | `src/jobs/definitions/runCompletedGameStatistics.js`; `src/infrastructure/persistence/sqlite/SqliteStatisticsScheduleRepository.js` |
| Runtime and season selection | `src/bootstrap/createTargetRuntime.js`; `src/bootstrap/openDeployedTargetRuntime.js`; `src/config/loadTargetRuntimeConfig.js`; `src/infrastructure/persistence/sqlite/SqlitePlayerRepository.js`; `src/infrastructure/persistence/sqlite/SqliteStatisticsRepository.js` |
| Late locks and official results | `src/application/services/matchups/createLateLockCoordinator.js`; `src/application/services/matchups/createMatchupScoringService.js`; `src/application/services/matchups/createMatchupResultService.js`; `src/infrastructure/persistence/sqlite/SqliteLateLockCoordinatorRepository.js` |
| Administrator operations | `src/application/services/statistics/createStatisticsOperationsService.js`; `src/transport/http/createStatisticsOperationsRouter.js` |
| Verification | Four new feature test files and focused updates to `lateLockCoordinatorFoundation.test.js`, `targetRuntimeFoundation.test.js`, and `targetDeploymentRuntimeFoundation.test.js` under `test/foundation/` |

Canonical documentation changes are this record and short links from `SCORING_RULES.md`, `MATCHUPS.md`, `API_CONTRACTS.md`, and `ACTIVE_WORK_PLAN.md` in `E:/hundo-leago/docs/`. The private tracker is updated through its validated protocol. Pre-existing edits to both `AGENTS.md` files were preserved.

The original implementation task performed no commit, push, staging deployment, production change or live league-data mutation. The following checkpoint records the subsequent staging preparation separately.

## Staging preparation checkpoint — 8 September, recorded 9 September UTC

Graem requested the next item after local completion. Staging preparation and read-only discovery were completed; publication and enablement remain pending. The currently served backend is still `e3167ec831369478944cdaff9bc0d0aed6558de4`, Render deployment `dep-dafo6s5g1s2s73fd7ig0`, on the staging service `srv-d9eo2turnols73ekb830`. Its ordinary startup is `npm start`; schema 55 is already installed. Neither prior schema recovery nor the Alpha/Beta one-shot recovery should be repeated.

### Verified staging prerequisites

Two SSH inspections opened the identified staging database in SQLite read-only/query-only mode, checked its database identity and schema, and confirmed zero SQL changes. No production database was opened.

| Finding | Verified result |
|---|---|
| Existing player catalogue | 2,807 players; all existing external identities use `sportsdataio-discovery-lab`; no `nhl` mappings |
| Current-season roster coverage | 780 ownership rows covering 411 distinct players |
| Exact NHL matches | 387 players matched by normalized full name, date of birth, NHL ID, skater position and affirmative team/no-team disposition |
| Identity differences | 24 candidate matches need reconciliation: 15 name differences, seven birth-date differences and two missing birth dates |
| Existing statistics evidence requirements | 301 distinct players; NHL requirements currently fail because identities are missing |
| Existing source conflict | 30 `release_qa_fixture` locks across three unfinished weeks, including one live week |
| Queued matchup work | 936 pending occurrences; 51 were overdue at inspection |
| Database integrity | Zero foreign-key violations; preservation fingerprints recorded for eight player, contract and matchup tables |
| New controls | `NHL_COMPLETED_STATISTICS_ENABLED` and `MATCHUP_PROCESSING_ENABLED` are absent, which the candidate interprets as false |

The exact-match audit does not apply identities or edit birth dates. Candidate matches for all 24 differences are saved with their official NHL profile evidence. The current NHL source can represent inactive players and prospects, but it must not guess a cross-provider mapping or treat a disputed identity as verified zero data. Before enablement, attach reviewed NHL IDs to the existing player UUIDs and resolve the documented catalogue differences using a validated additive plan and a fresh staging backup. Preserve ownership, contracts, old provider identities, snapshots and results.

The old-source weeks and their pending jobs also need an explicit preservation plan. Turning on the global matchup flag now could process overdue test weeks. Do not replace their saved baselines, silently skip their jobs, or enable the runner as part of the initial code publication.

### Additional verification and correction

The initial public identity audit encountered NHL HTTP 429 responses. The adapter's request pacing and rate-limit handling were corrected, then checked with simulated concurrent requests, both forms of `Retry-After`, a missing header, and a long provider hold. All **24 focused feature checks passed**, including the whole simulated week, administrator authority, read-only status, durable schedule and identity preflight.

The corrected adapter then fetched the actual 2026–27 season for all **387 exact-match identities**, using **401 public requests in 140,075 ms**. All 387 players had valid zero current-season totals and complete player coverage; there were no completed player-game rows. No database was opened. This is a public-provider capacity check, not a successful refresh of staging's complete roster or authenticated hosted acceptance.

The previous 269-check combined regression remains evidence for the unchanged code. The new 24-check run covers the adapter correction and affected feature workflows. Two additional broad Windows runs were interrupted: the first before correcting the adapter, and the second while progressing through slow unrelated database checks. Neither is a full-suite pass. The complete Render build/test gate remains required after publication is authorized.

### Earlier publication approval boundary — resolved by explicit approval

Automatic approval review rejected committing the 23 backend candidate files. Its stated reason was that proceeding to a staging checkpoint did not satisfy `E:/hundo-leago-backend/AGENTS.md`'s instruction: "Do not commit or push changes unless the user explicitly requests it." The rejected command did not run. No files were staged or committed, and no push, deploy, environment change or league-data mutation followed.

The concrete next release action is to commit the reviewed backend files and shared documentation, push the candidate to staging, run the normal complete build gate, deploy and verify the served commit, with both new controls kept off. Unrelated edits to both `AGENTS.md` files are excluded. Production remains outside this action. Identity reconciliation, current-season administrator refresh, job enablement and authenticated matchup acceptance remain later gates.

Receipts are under `E:/hundo-leago-backend/.hundo.local/statistics-staging-20260908/`: `inspect-staging-identities.receipt.json`, `inspect-staging-readiness.receipt.json`, `nhl-identity-audit.json`, `identity-differences.json`, `catalog-provider-receipt.json`, `rate-limit-checks.log`, `focused-final.log`, and the explicitly interrupted `full-regression*.log` files. Public NHL identity evidence is saved in `nhl-identity-evidence/`. `candidate-review.json` identifies the exact prepared files and verification state. The private tracker retains separate publication and hosted acceptance steps.

## Approved staging release — 9 September 2026 UTC

Graem's explicit approval resolved the preceding commit boundary. The 23 reviewed backend files were committed as `23709ea093cc393718af49e1207cba5e6291ed43` and fast-forward pushed to `staging`. Unrelated `AGENTS.md` edits were excluded. Render deployment `dep-dagb748u01pc73dplfvg` became live at **01:44:12 UTC**. The full build used `npm ci && npm run check && npm test -- --test-concurrency=2`; all **3,566 tests in 443 suites passed**, with zero failures, cancellations or skips, in **1,580,836 ms**. The original build command, `npm ci && npm run check && npm test`, was restored and verified without another deployment. Startup remained `npm start` throughout.

The served environment and read-only database check confirmed the exact commit and `APP_BUILD_ID`, schema 55, `NHL_COMPLETED_STATISTICS_ENABLED=false`, and `MATCHUP_PROCESSING_ENABLED=false`. There were no NHL refresh records. All eight previously recorded player, identity, ownership, contract and matchup table fingerprints matched. The inspections made zero SQL changes and found zero foreign-key violations.

Public verification returned HTTP 200 for liveness, readiness and the staging frontend. Both administrator statistics routes returned HTTP 401 `SESSION_REQUIRED` without a session, with the expected staging CORS origin. This proves public operation and the unsigned-request boundary. It does not prove authenticated administrator or manager acceptance.

The staging frontend remains Netlify deployment `6a9f87db15d51bf8a333a74a`; no frontend application artifact was published by this task. Production branches and services were not changed. No backup recovery, migration, player identity insertion, birth-date change, baseline replacement or job enablement was performed.

### Full player catalogue and additive link preparation

The read-only audit inspected all **2,807** existing player records against the official NHL search index and player landing evidence. It found **2,662 exact unique matches**, 54 unverified name candidates, 89 without a matching skater name, and two local records resolving to one NHL identity. Both duplicate records are excluded from the proposed additions. The earlier 15 reviewed name aliases and nine birth-date review cases produce a broader **2,686-row candidate plan**. Its exact hash is `5bb7b1e53f4f84299eca8062c325743da607111071a2d77232852ea940ccacd2`. Read-only hosted validation found zero conflicts, zero existing NHL links and nine unresolved birth-date reviews.

The proposed first application is the **2,677 verified links only**, covering 402 of the 411 currently rostered players. The other nine are excluded until their identity discrepancy is resolved. This verified subset has hash `1695255c6bee02b316074e6a1ada28ad8233f123535eeb2bceb52e16d805ae7d` and is saved in `identity-link-verified-plan.json`. It adds `nhl` external IDs to existing player UUIDs and one audit event. It preserves names, dates of birth, original provider IDs, player source metadata, ownerships, contracts, weeks, roster locks, exclusions, statistics and jobs.

Six synthetic checks passed for read-only preview, approval and backup guards, stale records, conflicting links, replay and transaction rollback. A separate in-memory schema-55 rehearsal loaded only the previously inspected public player catalogue and legacy IDs, added all 2,677 verified links, then replayed with zero additions. All 2,807 legacy identities and protected fingerprints remained unchanged, with zero foreign-key violations. This was a synthetic fixture, not a copy of the hosted league database. Its placeholder backup and approvals are test inputs, not permission or a valid hosted backup.

Automatic approval review rejected an earlier attempt to export the full staging database because the publication approval did not cover a durable local copy of all league and account data. That command did not run. Preparation continued with public catalogue evidence, synthetic fixtures and read-only hosted validation. No full database export is needed for the proposed next step.

### Remaining gates at publication — identity subset subsequently approved below

1. Approve the concrete 2,677-link staging data plan separately from code publication, then take and verify a fresh encrypted staging backup before any application. Recheck the exact plan, target identity and unchanged player fields. The operation must stop on any mismatch; do not infer permission to alter the nine disputed records.
2. Resolve the nine excluded roster identities using source evidence. After the verified subset alone, statistics readiness still fails for those nine players.
3. Preserve the 30 old-provider locks across three unfinished weeks and explicitly scope any future matchup execution. The 936 pending occurrences, including 51 previously overdue, must not be silently cancelled, replaced or processed by a global enablement.
4. Restore an authorized signed-in administrator browser session for hosted acceptance. The saved QA sign-in returned invalid credentials. Browser runtime setup also failed its trusted-path check. No password was guessed or reset, no account was created, and no browser security configuration was changed. User help was requested while independent work continued.
5. Only after identity/source readiness and the applicable staging authorization: verify an administrator current-season refresh, role boundaries and a disposable normal/late matchup week before automatic processing. Production remains a separate release decision.

Current receipts in the same local directory: `render-live-release-receipt.json`, `build-gate-restore-verified.json`, `inspect-published-staging.receipt.json`, `public-release-checks.json`, `nhl-full-catalog-audit.json`, `identity-link-plan.json`, `inspect-identity-plan-staging.receipt.json`, `identity-link-verified-plan.json`, `identity-link-rehearsal.log`, `catalogue-plan-rehearsal.json`, and `IDENTITY_RECONCILIATION_REVIEW.md`. The local identity scripts are preparation artifacts, not deployed application code.

## Approved identity application — 9 September 2026 UTC

Graem answered “yes continue” to the exact proposal to apply 2,677 verified links after a fresh encrypted staging backup, keeping both jobs off and excluding the nine disputed identities. The plan remained `1695255c6bee02b316074e6a1ada28ad8233f123535eeb2bceb52e16d805ae7d`, operation `fdddaabe-05fd-441b-b643-328a3f4a0132`. All 2,677 evidence files were rechecked against their saved hashes. Fresh hosted preflight found 2,677 additions, zero conflicts, zero existing NHL links and no prior attempt. A new full-catalogue synthetic rehearsal proved the application wrapper preserves all 132 other application tables.

Backup `5e3039ab-b1da-449a-b6d1-ea3dbd6e1f9d` completed before the operation. The private encrypted artifact and manifest were verified, downloaded on the staging server, decrypted in memory, and checked against the plaintext checksum. Its encrypted SHA-256 is `197103c46de2d22f8925b7d898488f7d4e136cee47b8e33a6dea9768a63cbb7a`; manifest checksum is `f4650a8ae5ceb64badfd573c587bd7f6b5e56b871f27633b094b7d09ba5e7166`. No database contents were exported to E:. The existing verified backup process was used without a migration or restore.

The single application succeeded at **02:50:51 UTC**: **2,677 external identity rows and one audit event** were added in one transaction. All **132 protected tables** and all **2,807 original external IDs** remained unchanged. There are now 5,484 external IDs in total. The independent read-only postflight found all approved links, zero remaining approved additions, zero conflicts, no changed protected-table fingerprints, `integrity_check=ok` and zero foreign-key violations. Both new controls remain false, and public staging readiness/frontend checks returned HTTP 200. Backend `23709ea` stayed deployed; no application redeployment or production change occurred. Local and server-side single-attempt receipts are retained; the successful operation must not be rerun.

### Remaining source and execution gates after application

The catalogue-size gate now passes with 2,677 NHL identities, but nine rostered identities remain missing. Fresh public NHL evidence and additional official sources were reviewed for all nine. Eight NHL birth dates have corroborating evidence; this supports review of their identity links without changing stored dates. Anthony Beauregard remains a primary-source discrepancy: NHL reports 14 November 1995, whereas [ECHL's official profile](https://echl.com/players/6458/anthony-beauregard) reports 15 November 1995, matching Hundo's stored value. Do not describe Hundo's date as proven wrong. All nine were explicitly excluded and remain unmodified. The detailed source-by-source review is in the local `IDENTITY_APPLICATION_OUTCOME.md` and `excluded-identity-source-review.json`.

Read-only inspection identified the exact three unfinished old-source weeks: **Gamma League / regular-01** is live with 14 saved locks; **Release QA Alpha League / week-02** is scheduled with six saved locks; **Release QA Beta League / week-02** is scheduled with ten saved locks. All use `release_qa_fixture` baselines. The 936 pending matchup occurrences still include 51 overdue jobs. None was cancelled, replaced, skipped or executed. A future NHL acceptance scope must preserve these weeks and must not silently process their old jobs or substitute new baselines. The current global controls alone are not a verified execution scope.

Authenticated acceptance still requires a working administrator Browser session; the previously reported invalid QA credentials and runtime trust error were not resolved by the identity operation. The next work is to settle the excluded identity links, define and verify a safe matchup scope, and restore hosted session acceptance. No new job enablement is authorized by this completed identity update.

Receipts under `E:/hundo-leago-backend/.hundo.local/statistics-staging-20260908/`: `approved-identity-preflight.receipt.json`, `approved-identity-wrapper-rehearsal.json`, `approved-identity-backup.receipt.json`, `approved-identity-apply.receipt.json`, `approved-identity-postflight.receipt.json`, `inspect-post-link-readiness-context.receipt.json`, `excluded-identity-source-review.json`, `post-identity-public-health.json`, and `identity-application-completion.json`. All operation code is retained locally in the ignored directory; only this shared status record changes in Git.

## Approved final nine identities and unattended continuation — 9 September UTC

Graem explicitly approved all pending questions and requested continued staging work while he sleeps, with genuine user-only questions consolidated for his return. This resolves the separately presented nine-link proposal, whose exact plan SHA-256 is `ca3a070bf28983c2004f80c5941f6f8cbba64732ad2e3a72b968c8e32491c21d`, operation `86e2e1b0-4114-4064-930e-27614462d89f`. The existing nine evidence files and source-review hash were verified again. The synthetic transaction rehearsal and fresh hosted read-only preflight passed before application.

Fresh private encrypted staging backup `540852ad-7134-4919-b334-be49432ac677` passed ciphertext, manifest, in-memory decryption and plaintext checksum verification. Its encrypted SHA-256 is `2d801bf12a5c5dc89558bdfcf26b5e83f2b87918c699df01c92fdae49628b39e`; manifest checksum is `f4f0f778a37b9709dd76e1569cb2689df8143d046599ce7ad3cbf0e63f973e65`. No database copy was exported locally.

The guarded application completed once at **03:25:23 UTC**, adding nine NHL identity rows and one audit event. It preserved all **132 other application tables** and all **5,484 existing identity rows**. No stored name or birth date changed, including Anthony Beauregard's 15 November value. The independent postflight at **03:26:17 UTC** found all nine links, zero conflicts, no changed protected-table fingerprints, database integrity `ok`, zero foreign-key violations and zero SQL changes. There are **5,493 external IDs**, including **2,686 NHL mappings**. All **411 rostered players** are mapped; the 301 player-game coverage identities resolve. Both new controls remain false. Neither completed identity operation may be repeated.

The complete-roster public NHL check then passed **425 requests in 148,212 ms**. All 2,686 catalogue players had valid zero 2026–27 totals, with verified coverage for all 411 rostered players and no completed-game rows. This used public provider data without opening a league database; it is not an authenticated hosted refresh.

### Execution scope safeguard candidate

The backend candidate adds `MATCHUP_PROCESSING_LEAGUE_IDS`, an optional comma-separated list of one to 100 distinct canonical league UUIDs. An absent field retains all-league selection; an empty, malformed or duplicate list is rejected. The two existing enablement flags remain separate. Merely supplying a list does not enable either runner. Scope changes take effect through normal runtime deployment.

When the NHL source is selected, occurrence queries and transactional claims require the configured NHL season and exclude any week with a committed baseline or final snapshot from another provider. The league filter applies before the processing batch limit. All three late-lock entry paths use the same selection rules. Excluded jobs remain pending with their attempts, leases and results unchanged; saved snapshots, locks and results are preserved. The existing FAD, schedule-generation, slot and lease checks still apply.

The read-only readiness helper accepts an optional league list, retains global identity and coverage checks, reports scoped source conflicts and rejects unknown leagues or leagues without the selected NHL season. It detects a conflicting committed baseline even before a roster lock exists. Existing unscoped readiness remains blocked by staging's three old-source weeks.

Five distinct focused checks passed across the initial and expanded runs, covering exact configuration, read-only late-lock exclusions, unclaimed jobs across excluded leagues/seasons/providers, a provider baseline arriving between listing and claiming, batch-limit starvation, unknown scope readiness and runtime composition. The seven-file regression passed **146 tests across 13 suites**, with zero failures, cancellations or skips, in **455,398 ms**. The expanded runtime/batch assertions passed separately after the broader run began. Syntax and diff checks passed.

Candidate read-only hosted preview **v2** passed against the existing staging database without installing code: actual saved job bindings confirm all three known old-source weeks were excluded, their selected scopes correctly reported not ready, unknown scope was rejected, and all 936 pending matchup jobs remained intact. The inspection made zero SQL changes and found zero foreign-key violations. The first preview omitted week IDs from its output; v2 corrects that projection and is the authoritative old-week check. Gamma still has 21 other eligible due jobs, reinforcing the need for a separate isolated acceptance scope. This is preview evidence, not deployed-candidate or enabled-runner acceptance.

The 14 reviewed backend files were committed locally as **`f7ae6791717dbfec4843285de885fc7002e2e019`**. Automatic approval review rejected the staging push, then rejected it again after read-only checks verified that Git origin and Render use the same existing repository. Its stated reason was that exporting private source requires direct user approval naming this payload and destination. Neither rejected command ran. The prepared action is to push this commit to `https://github.com/semitoneharmonies/hundo-leago-backend.git`, branch `staging`, then complete the full staging build and verification with both controls off. Do not retry through another route before that direct approval. No deployment, Render configuration, runtime control or production change followed. Independent launch checks continue while the exact approval is saved for Graem's return.

The next hosted acceptance scope must be a clearly identified isolated test league with verified NHL readiness. Do not point the runner at Gamma, Alpha or Beta as a shortcut or replace their baselines. Actual authenticated administrator/browser acceptance remains pending because the saved QA credential and Browser runtime connection are unavailable. Continue independent authorized work and consolidate this user-only interaction for Graem's return. Production remains untouched.

Current local receipts: `final-nine-wrapper-rehearsal.json`, `final-nine-preflight.receipt.json`, `final-nine-backup.receipt.json`, `final-nine-apply.receipt.json`, `final-nine-postflight.receipt.json`, `complete-roster-provider-receipt.json`, `execution-scope-focused.log`, `execution-scope-final-focused.log`, `execution-scope-regression.log`, `execution-scope-hosted-preview-v2.receipt.json` and `UNATTENDED_CHECKPOINT.md` under the existing statistics-staging receipt directory.
