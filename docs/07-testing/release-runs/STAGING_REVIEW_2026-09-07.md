# Staging review implementation — 7 September 2026

## Authority and boundaries

Grae requested implementation of the supplied page-by-page review brief and deployment to staging, with unattended approval for necessary work and milestone updates. Both E: repositories are in scope. Production deployments, data, schedules and jobs are excluded. Preserve all Keep items, unrelated work, existing staging data, backend authorization, league isolation and read-only requests.

Starting clean revisions: frontend `227675231f539da5890be578532bd1b592163f61`; backend `6359ec9997f90dddf17ba2c9b07481746ae171bb`. Work uses small verified steps followed by separate repository commits and staging publication. Existing source revisions remain rollback points; any staging data/configuration change requires a recorded before-state and verification.

## Weighted milestones

| Milestone | Weight | Status |
| --- | ---: | --- |
| Audit brief, code and staging | 10% | 100% |
| Trades, rosters and commissioner workflows | 25% | 95% - exact trade and Future Considerations copy rehearsal passed |
| Auctions, drafts, matchups and standings | 25% | 85% - deployment/configuration pending |
| Notifications, league hub, rules and page polish | 20% | 95% - hosted review pending |
| Verification, staging deployment and browser review | 20% | 55% - backend staging build in progress |

Weighted total: approximately **78%**. These percentages include deployment and hosted acceptance; implemented source changes alone do not count as hosted completion.

## Review checklist

- [ ] Trades: valid Rust/pick/Bedard/retention proposal; useful validation errors; Trade block proposal action; receiving-manager acceptance then commissioner approval for Future Considerations.
- [ ] Dashboard season range; unchanged dashboard and Teams layouts.
- [ ] Prospects empty copy; Fantasy ELC rules retained in League Rules.
- [ ] Hockey Lines exact slot swaps, including Suzuki/Hintz same-column regression.
- [ ] Free Agent Draft selected-year read-only archive and deadline year; future Entry Draft archive requirement documented.
- [ ] Players compact Start auction action; eligible nominations work; useful unavailable reasons.
- [ ] Auction cap preview after interaction; staging daily rollover and complete workflow; production Sunday 4 PM Pacific preserved.
- [ ] Immutable weekly roster/scoring snapshots; multi-week staging simulation; Week 1 unchanged after Week 2 changes.
- [ ] Standings compact separated rows, sortable statistics, correct simulated two-game standings.
- [ ] Activity compact filter; one completed Candidate allocation event, ordinary auction signings preserved.
- [ ] Notification filters, meaningful details, exact authorized destinations, expired-target handling, inline completed-auction results.
- [ ] Pending commissioner assignment review/acceptance, named notification and league hub consistency.
- [ ] Your league hub displays all active memberships and pending invitations/assignments.
- [ ] League Rules complete concise feature/rule audit with existing compact menu and quick reference retained.
- [ ] Unified Team logo control with preview/replace/remove.
- [ ] Commissioner competition hierarchy, collapsible deduplicated actionable issues, plain recovery guidance and correction links.
- [ ] Schedule preview prerequisites and read-only success; confirmed staging creation.
- [ ] Edit matchup week date-range chooser with review/confirmation.
- [ ] Commissioner Add/Correct contract AAV and term; calculated total; Move/re-slot cannot change actual position.
- [ ] Separate manager, receiver, commissioner and administrator accounts; at least two leagues; page-by-page Keep/read-only verification.
- [ ] Focused tests, lint/build, integrated verification, staging deployment and hosted acceptance recorded.

## Audit observations

- Canonical operating mode remains `OFFSEASON_RESET`; the current September staging record supersedes retired August release wrappers.
- Render staging `srv-d9eo2turnols73ekb830` uses `staging`, with automatic deployment disabled and a build that runs the backend suite. Netlify staging site is `95af8aa7-0b13-4954-af6d-855762acb147`.
- Live auction cadence is explicitly Sunday **4:00 PM Pacific** in the approved Auctions specification. The requested approximately daily cadence is staging only.
- Future Considerations already has an implemented receiver-acceptance and commissioner-approval lifecycle; it needs regression and hosted verification alongside the proposal failure.
- Hockey Lines currently uses insertion ordering, which shifts intervening players into other columns instead of swapping source and target.

## Verification results

### Completed source and focused checks

- Frontend: **401 tests in 60 files passed**; ESLint passed; Vite production build passed. Vite retains a non-blocking warning for the main bundle above 500 kB.
- Browser: **eight desktop/mobile role and page checks passed**, counting the successful desktop rerun after one local sign-in timeout. Pages covered Dashboard, Teams, roster, Players, Auctions, Trades, Matchups, Standings, Activity, Notifications, account/rules and commissioner tools. Distinct manager, commissioner and administrator fixture accounts were used across two leagues. These checks use the local integrated backend/frontend fixture, not the unchanged hosted release.
- Backend: 50 existing trade workflow tests passed; 27 contract/commissioner tests passed; 20 recovery capability tests passed; 18 auction projection/trade error tests passed; two daily-mode configuration/scheduler tests passed. Notification filters, FAD navigation, roster position guards and focused competition checks were also exercised. A prior competition run's obsolete expectation for per-player Candidate activity was corrected to match the approved suppression.
- The scheduler guard test opens the actual deployed runtime, executes an empty cycle, and confirms exactly `free_agent_draft_auction_resolution`, `auction_resolution`, and `league_outbox`, with no database changes.
- The archive regression switches between 2026 and 2027 and verifies that the selected team, player search and results reset to the selected draft.
- An additional two-pass desktop/mobile capture run preserved page screenshots under `visual-review/`. Visual inspection confirmed separated standings rows and the compact activity filter. The visible `Filter league events` label was restored after that inspection; all 16 transaction-page tests and final lint passed afterward.
- Full backend verification: the initial local concurrent run was stopped after excessive runtime. A concurrent isolated Linux run lost its SSH connection before a final result. A bounded single-worker run is in progress in the isolated directory recorded below; no complete-suite pass is claimed yet.

### Staging database rehearsals

All rehearsal source databases were opened read-only and copied using SQLite backup. No test modified the served staging database.

1. Contract precision/recovery: the approved quarter-dollar AAV rule exposed a legacy whole-total restriction. With the fix, Alpha's seven pending automatic allocations and two failed auction resolutions completed on a copy; foreign-key verification passed. Alpha's later phase remains constrained by its already-past frozen Week 1 date. It was not silently rescheduled or forced into rapid auctions.
2. Weekly simulation: a separate four-team league in a staging copy locked 18 active players per team in two weeks. Each team exchanged an active forward and a bench forward before Week 2. Week 1 scores were 1.25–2.50 and 3.75–5.00; Week 2 scores were 6.25–8.75 and 7.50–10.00. Week 1 historical projections remained identical. All teams had GP=2; W+L+T=GP, standings points, percentage, PF, PA, DIFF and rank agreed with the results. Foreign-key verification passed.
3. Schedule: an unused synthetic future season in an Alpha copy produced a read-only preview, then **23 weeks and 92 matchups for eight teams** through explicit confirmation. Every lock was Monday 4 PM America/Vancouver, including timezone transitions. The synthetic dates are test inputs, not an asserted NHL calendar.
4. Daily auction: on a Gamma copy using the proposed code, one manager nominated A.J. Greer at $1.25 AAV for two years; a different manager bid $1.50 AAV for two years. Resolution completed within the daily window, awarded ownership to the second team, and persisted a $3 total / two-year / $1.50 AAV contract. Foreign-key verification passed.

Local logs and rehearsal scripts: `E:\hundo-leago\.hundo.local\review-20260907\`.

Preserved remote evidence under `/opt/render/project/data/hundo-staging/review-20260907/`:

- `two-week-simulation-8dc9f010-b000-4a31-8744-0979cdc3f975.sqlite3`, simulation league `84f7a89f-93c8-47ed-a680-fd9206bea84b`.
- `schedule-rehearsal-63c44c94-f41d-4bf3-9c75-a4f0c4826ae1.sqlite3`, synthetic season `0da21081-c3a1-4ad9-8232-7063d99b1f65`.
- `daily-auction-05ee4d6d-151b-44a8-ae65-c4ced4540908.sqlite3`, auction `2a2268f4-93ea-4c74-8066-102303558b3b`.
- `verification-source-0907/` and `backend-full-serial.log`. The initial source snapshot predates the additional scheduler guard test and approved inaugural trading changes. Those focused tests passed separately; the two trade source files were updated in the isolated source for the successful exact-trade rehearsal. The full serial suite lost its SSH connection without a final result; no full-suite pass is claimed. Render runs the full suite against the committed revision.

### Approved decisions and release work

- **Explicit staging commit/push approval:** Grae replied "approve both", authorizing staging commits/pushes and the inaugural trading rule. Backend commit `73b25f56d63b5b650badb4cc912403bc47b28c58` was pushed only to staging; Render deployment `dep-dafd9767bikc7385ahg0` is building.
- **Inaugural trading rule:** the approved current-season no-draft inaugural FAD opening now opens trading. Nine focused foundation tests passed. An Alpha copy rehearsal created the exact Rust + original 2026 second-round pick / Bedard with $1 retained proposal. Its Future Considerations variant reached Awaiting Commissioner Approval on receiving-manager acceptance with all ownerships, contracts and picks unchanged; commissioner approval transferred the assets correctly. Foreign keys passed. Receipt: `approved-trade-09f00240-63fa-4c0a-bb51-ea9aac9ea9ef.sqlite3`; served staging data was not changed by this rehearsal.
- Publish the coordinated changes to staging after explicit approval and required checks. Render's build command remains `npm ci && npm run check && npm test`.
- Set only staging `STAGING_DAILY_AUCTIONS_ENABLED=true` and `SCHEDULED_JOBS_ENABLED=true` when the proposed scheduler filter is in the deployed revision. Preserve disabled provider, matchup and email settings. The legacy `AUCTIONS_ENABLED` flag is not the target-runtime control.
- Verify the deployed build identities, health, pending Giggles commissioner assignment, eligible nominations and every reviewed page on the hosted site. Do not treat local browser or isolated-copy checks as hosted acceptance.
- Alpha's past Week 1 / unfinished FAD phase requires its supported schedule/draft recovery decision before nomination can become available there. The Gamma completed-FAD rehearsal verifies the ordinary auction path without changing Alpha's historical calendar.

### Production and rollback evidence

Backend staging publication is in progress. No production change, served staging data change or staging environment-variable change has occurred so far. Staging readiness was checked successfully after the interrupted verification run.

Remote branches verified during preparation:

| Repository | Staging | Production main |
| --- | --- | --- |
| Frontend | `227675231f539da5890be578532bd1b592163f61` | `6f7d166eb931fb4202c4eb93a50fad3ef569bfb7` |
| Backend | `6359ec9997f90dddf17ba2c9b07481746ae171bb` | `bff785e047817686ccf094a4032e04bab10197c1` |

The initial Netlify staging deploy remains `6a9e800d70febe09a46a4d33`; Render staging remains on the starting backend revision with auto-deploy off. Scheduled jobs remain disabled on the served staging runtime. Recheck these drift-prone values immediately before publication.
