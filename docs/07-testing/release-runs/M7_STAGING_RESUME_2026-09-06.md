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
