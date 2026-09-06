# M7-26 staging completion — 6 September 2026

## Current authority

Graem explicitly authorized: "you have my approval to keep working until the update is finished, committed and pushed so i can try it out on the staging website."

This is the current continuation for the M7-26 UI update. It authorizes necessary local fixes and tests, separate repository commits and pushes, verification and private backup of the existing recovered staging database, isolated staging deployment, controlled reopening for authenticated testing, and final staging acceptance. Production remains untouched. It authorizes no reset, reseed, restore over existing data, or unrelated league mutation.

The V1–V10 attempts and frozen files remain historical evidence. V10's successful diagnostic and full verification were followed by a binding failure. A mismatched inherited V8 result label in the local scripts was confirmed by a focused regression check. V10 remains retired and is not retried or edited. This continuation replaces the failed wrapper/binding procedure with direct, reviewed checks of the actual staging runtime and data; no old gate is retrospectively marked passed.

## Fixed targets

- Render workspace: tea-d4prbj7diees738tmg90
- Staging backend: srv-d9eo2turnols73ekb830, branch staging
- Netlify staging site: 95af8aa7-0b13-4954-af6d-855762acb147
- User testing URL: https://staging.hundoleago.com
- Backend commit: 6359ec9997f90dddf17ba2c9b07481746ae171bb
- Existing frontend application artifact: 4dfe12d1366314e3d9df722c50771324647743c9
- Selected database: /opt/render/project/data/hundo-staging/sqlite/hundo-leago-schema54-strict-restore-HL-20260823-1.sqlite3
- Expected database: 37105664 bytes, SHA-256 cf3ca07d0500888edf60f2742541ace6f5b7db0e1f2fd9b57f00db56aacacabc
- Expected activation receipt: 4991 bytes, SHA-256 24adf2d36c1adae8674552d44fc99fb43fd875dd58be85008f0c00b35450e8c8

## Ordered checks and actions

1. Verify staging provider identity, deployed commits, full maintenance hold, actual runtime versions and protected database fingerprints.
2. Run the reviewed verifier in release-tools/HL-20260906-1/verify-held-database.cjs against private copies only. Preserve source main/WAL/SHM, target and receipt; require stable hashes/metadata, zero open descriptors, correct schema/identity/migration checksums, expected recovery semantics, zero active sessions and no failed-fixture remnants.
3. After successful semantics, create and verify one private encrypted incident-preservation backup using the existing configured backup implementation. Preserve an attempt/result receipt. Reconcile uncertain outcomes before considering another operation.
4. Finish frontend checks and browser acceptance. Complete backend verification without changing database durability.
5. Commit and push reviewed changes, keeping repositories separate. Publish the verified frontend to the existing staging site; keep the backend on its staging branch.
6. Reopen only STAGING_MAINTENANCE_HOLD=false, LEAGUE_WRITE_MODE=open, FREE_AGENT_DRAFT_ROUTES_ENABLED=true. Keep scheduled jobs, email delivery, debug routes, backup scheduling and paid/live provider requests disabled. Preserve the database and all credentials.
7. Verify the sole live deployment, health, signed-out protection, authenticated desktop/mobile workflows, league isolation and manager/commissioner/admin controls. Use disposable local fixtures for destructive or large scenario tests; do not replay the retired hosted manager-transfer fixture.
8. Record results and exact commits/deploys, then provide the staging URL for Graem to test. Full-season launch gaps remain separate from completion of this UI update.

If a safety or data check fails, retain the hold, preserve evidence, and diagnose it. Failure is not permission to reset data or bypass authentication.

## Results

- Provider identity and existing deploys: verified 6 September; Render live dep-da7d857avr4c73bnna90 and Netlify ready 6a8e6c8fae36273a816a7539.
- Runtime at 2026-09-06T11:42:58.449Z: Node v24.14.1, npm 11.11.0, exact staging identity and target; full hold present.
- Target and receipt: fingerprints match; target WAL, SHM and journal absent.
- Ordinary frontend unit-test command after discovery correction: 58 files, 388 tests passed.
- Ordinary frontend lint command: passed.
- Private-copy semantics: passed at 2026-09-06T11:53:47.521Z. Both databases passed integrity, foreign-key, identity and schema-54/migration-checksum checks. Recovery classification and credential receipt matched. All 11 failed-fixture artifact counts and active sessions were zero in the recovered target.
- Original files: identical across four boundaries (snapshot SHA-256 cb6880054c273d6745d75c3ec158fcdc688fb96bd004ca6a38fbce22304903f6); zero holders in both complete descriptor scans. Only private copies were opened with SQLite; private scratch removed.
- Verifier regression: all 11 source pins checked against exact approved backend Git objects; three tests passed. The initial pre-copy rejection revealed one historical CRLF/Linux byte mismatch. Only the new helper's pin was corrected to the same unchanged Git blob; the retired verifier remains unchanged.
- Fresh encrypted backup: created and privately restored/verified once at 2026-09-06T11:58:03.516Z. Backup b82bb975-75a8-447e-aa49-09dc689e0267; manifest staging/backups/hundo-leago_staging_20260906T115757928Z_b82bb975-75a8-447e-aa49-09dc689e0267.manifest.json; manifest SHA-256 90436f8eba19a316f1d185d18e3508bec73304686af6f6f258f3e30f426577ce. Integrity passed, foreign-key violations zero, recovered target hash unchanged. The completed backup must not be rerun.
- Browser setup: e2e/support/localStack.js now builds once per worker and serves the bundled app using Vite preview. Builds are preserved under .hundo.local/browser-builds on E:. Cold Vite source transforms exceeded page assertion deadlines after relocation; normal sign-in and API calls succeeded in those preserved failed attempts. No product assertion or database durability setting was weakened.
- Focused browser regression: desktop sign-in/league/draft workflow and ten-page layout/accessibility review both passed against the built app (2 tests, 1.3 minutes).
- Final lint and browser-authority check: passed, including 20 compatibility files and 164 shipped source files.
- Staging-configured build: passed using only explicit staging API/socket origins, application source build ID 4dfe12d1366314e3d9df722c50771324647743c9. Application source and package locks are unchanged from that commit. Local-default validation output is not a release artifact.
- Local full backend run: stopped incomplete to resolve disk contention; no failure records at stop. It is not counted as a full pass. The unchanged backend's full suite is required by the Render build command before the next deployment can become live.
- Full release browser suite: 45/45 passed in 9.0 minutes, with no retries, across desktop/mobile Chromium, Firefox and desktop/mobile WebKit. All ten reviewed surfaces, keyboard/accessibility checks, private-card authorization, cross-league denial, help grants, deep links, sign-out and session replacement passed. Publication and staging reopening remain pending.

Detailed local evidence is retained on E: under .hundo.local/launch-resume-20260906, excluded from builds and source control.

## Original review scope audit — 6 September 2026

Graem confirmed the prepared upload conditionally on the work from his 20 August review and its implementation follow-ups being finished for staging testing. The original page-by-page brief was recovered from task 01a02163-e6e7-7900-b68d-448bc468af61 and compared with the approved M7-26 checkpoints, current source, existing focused test cases, and the fresh frontend/browser results above.

The broad implementation is present in frontend d82583dea2132d94e53a60853da6dddc549a0126 and backend ac1e12baadce4fcc08b6fb680b34db6992a4f891. The subsequent privacy changes in frontend c119f119ffd4aa96635fe382792e704d535a7cbd, diagnostic fixes through frontend F, and backend recovery fixes through B2 are also present. No missing implementation item was found in this review-scope comparison. Hosted release acceptance is still a separate unfinished gate.

| Review area | Current implementation and verification evidence |
| --- | --- |
| Shared wording, errors and team identity | HundoUi, TeamMark and shared styles; safe error text; uploaded logos and colour-mark fallback; component tests and all browser page reviews passed. |
| Dashboard, Teams and Matchups | LeagueDashboard and LeaguePages use league-owned season data and shared TradeBlockPanel; matchup layout and Monday copy are implemented; desktop/mobile overflow and accessibility checks passed. |
| Rosters and hockey lines | TeamRosterPage has NHL-team fields, compact actions and horizontal muted Bench cards; existing Active cards and trade actions retained. Unit coverage includes manager/commissioner distinction, prospect signing/promotion and drag ordering; backend coverage includes IR-to-Active and signed-Prospect activation with atomic rollback. |
| Drafts and private results | Concise selected-team results, stable legacy redirect and no original-card link; selected-team offer projection, authority-change cache eviction and expiry withholding are implemented and covered by the passing frontend/browser checks. |
| Players | Server filters precede LIMIT in SqlitePlayerRepository; query keys include filters; autocomplete overflow and Favorites are retained. Filter/pagination frontend and backend cases are present. |
| Auctions | Read-only total contract value from AAV and term; phase-aware full Free Agent Draft labels; existing bid boundaries remain. Auction UI and contract tests are in the passing frontend suite. |
| Trades | Player combines the relevant contract/prospect inputs; retained salary is nested on its player; future-consideration acceptance waits for commissioner preview/approval. Frontend tests passed; backend cases cover replay, manager-only authority, inherited admin approval, revalidation and rollback. |
| Trade block and Activity | Shared detailed roster-style Trade block rows include fantasy team, salary, age, NHL team and stats. Activity formats participants/assets and filters routine lineup events; focused frontend/backend cases cover these projections. |
| Standings | Compact team-colour rows and weekly-score copy; contextual commissioner correction previews standings impact and applies it atomically. The separate normal rebuild/correction panels are removed; recovery backend capability is retained. |
| Notifications | Unread-first mounted batch, explicit idempotent acknowledgement after rendering, Previous notifications and safe error handling. Read endpoints remain read-only. Frontend tests and browser deep-link/privacy cases passed. |
| Rules and account navigation | LeagueRulesDropdown was reconciled with canonical rules and has its focused component test; duplicate Notifications account-menu link removed; approved settings preserved. |
| Commissioner tools | Collapsible draft panel, named teams and live roster-slot projections, plain recovery presentation, named-week selection and usable preview/blocker messages; focused component cases passed. |
| Administrator and commissioner authority | Backend protection against commissioner changes to administrator membership/team access, protected admin access to leagues, unique active commissioner index and explicit transfer. Schema 54 is verified in the recovered staging target; no duplicate-commissioner cleanup was required at its recorded migration boundary. |
| Work after the review | Privacy/cache/session follow-ups and exact backend recovery code are included. Migration, source/target preservation and fresh encrypted backup/restore checks passed. Release publication and final hosted acceptance are being completed under the current continuation. |

Approved scope qualifications remain explicit:
- Collectible player hockey cards and removal of the standalone player-detail page were expressly post-launch in the original review.
- The original review allowed retaining Correct roster if it served an essential distinct purpose. It is retained as Move or re-slot player for the approved transfer/category/position/slot corrections.
- Season labels follow the authoritative league season; a browser calendar change does not silently advance league data.
- Interactive staging has live/paid statistics requests, scheduled jobs and outbound email disabled. Completing this UI update does not complete the separately documented launch work on session bootstrap, proactive socket revocation, statistics/matchup job operation, late-legal game handling, the signed-Prospect buyout/trade-cancellation limitation, or production rollout.

The user should be told the site is ready to test only after publication, reopening, public health, and hosted account checks succeed. The passing 45-case local browser suite is not presented as a hosted sign-in result.

## Publication and additional role-page acceptance

The exact original artifact was published to Netlify staging as deploy 6a9d5fa1d0aeb949e48eb445 at 2026-09-06T12:42:27Z. All 64 public asset byte/hash checks across its staging and immutable URLs passed, together with the existing security and no-store headers. The earlier automatic approval-review rejection was resolved by Graem's explicit conditional confirmation of the exact payload and destination.

A fresh protected-data and completed-backup precheck passed at 12:44:28Z. The three approved staging access settings were merged once at 12:45:11Z, automatically creating Render deploy dep-daem0luq1p3s739tru3g on unchanged backend B2. No separate deploy trigger was issued. The build is running its required npm ci, check and full test suite; its final result is not yet verified.

Additional real-browser coverage was added in e2e/ui-review-role-pages.spec.js for commissioner competition and roster tools, protected administrator membership, both administrator leagues and league creation controls, denied manager controls, account settings and League Rules. The first run found a critical aria-required-attr defect in the commissioner free-agent input: a native input/datalist was redundantly declared as a custom combobox without managed expansion state.

The correction in src/features/commissioner/CommissionerRosterPage.jsx removes the redundant custom role, autocomplete and controls attributes, retaining the named native input and its datalist association. Player matching, roster preview, writes, permissions and league data behavior are unchanged. Native semantics follow [W3C ARIA in HTML](https://www.w3.org/TR/html-aria/#el-input-text-list). This supersedes the former frontend application F for the next publication; frozen historical helpers and receipts retain their original identities.

Verification after the correction:
- Existing CommissionerRosterPage component cases: 8/8 passed.
- ESLint on the exact changed component and new browser file: passed.
- Added role-page acceptance: 15/15 passed in 7.5 minutes, no retries, across desktop/mobile Chromium, Firefox and desktop/mobile WebKit.
- The earlier 45-case release suite remains recorded against the prior application source. The expanded 15-case run directly covers the sole changed component and all the added role pages.
- The new staging-configured artifact and its public hashes must be verified before calling the correction published. Backend full-suite completion and hosted authenticated acceptance remain pending.

Graem subsequently authorized continued unattended work while away for several hours, without repeated approval requests. Necessary staging fixes, commits, pushes and deployment checks remain authorized. [The short staging test tour](M7_STAGING_TEST_TOUR_2026-09-06.md) is prepared for his review.

## Corrected frontend published; final backend deployment queued — 2026-09-06 13:08Z

Frontend application commit 7d87fd285defe5a38060648d4d26fe5488ac60e8 is committed, pushed and verified at origin/staging. The corrected artifact contains 33 public files / 1,931,846 bytes with unchanged security configuration. Netlify deploy 6a9d654e4f3ec47cb82c27c2 published at 13:06:41.769Z. All 64 asset byte/hash checks across the staging and immutable origins passed at 13:07:41.839Z. Receipt: staging-a11y-publication-verified.json.

FRONTEND_BUILD_ID alone was merged to the corrected frontend commit at 13:08Z, preserving all credentials, data paths and other settings. Render accepted the automatic deployment request and subsequently created dep-daembf79r02s73ep1t80, exact unchanged backend B2. It is queued behind the initial reopening build dep-daem0luq1p3s739tru3g. Both deployment requests are accounted for; do not submit another trigger or repeat either environment mutation.

Current completion boundary: corrected frontend publication and local acceptance passed; backend full-suite/live verification and hosted account checks are pending. Production is unchanged. Once the final deployment is live, verify its actual runtime identity and flags, run the prepared read-only .hundo.local/launch-resume-20260906/verify-hosted-public.cjs, and inspect the staging browser. Existing credentials must be preserved; if sign-in needs Graem, complete the independent checks and record that specific remaining item.
