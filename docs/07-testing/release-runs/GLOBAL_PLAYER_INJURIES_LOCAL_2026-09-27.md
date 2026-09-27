# Global player injuries — local verification, September 27, 2026

Status: local candidate only. No commits, pushes, deployments, production migrations, provider activation, or live league-data writes.

## Scope and locations

- Frontend: E:/hundo-leago/.hundo.local/roster-visuals-20260927, branch codex/roster-visuals-20260927. Preserves prior approved trade-block gradient and expanding action controls.
- Backend: E:/hundo-leago-backend/.hundo.local/player-injuries-20260927, branch codex/player-injuries-20260927.
- Main working folders contain unrelated edits and were not used for application changes.
- Preview: http://127.0.0.1:5174/e2e/fixtures/player-injuries.html. Real React components with fictional statuses and an in-memory API fixture; reloading resets changes. This is not a signed-in production session or a live provider report.

## Delivered behavior

Global administrator panel on Your leagues searches players and records injured, healthy, or unknown status, a required reason, actor, time, and before/after audit evidence. Optimistic versions prevent stale saves. Commissioners and managers cannot edit the global register.

Roster table and line names display injury red; the IR action is highlighted. Injury red overrides trade-block gold. Catalogue and player detail names also receive injury styling. Confirmed healthy players on fantasy IR create a named illegal-roster warning. Unknown status never proves recovery. The existing legacy eligibility fallback remains for unknown players. Ownership, salaries, contracts, roster slots, and already locked matchups are not changed by admin injury decisions.

Future matchup legality includes healthy players still on IR. The healthy-IR count participates in the existing active-lineup fingerprint to protect the asynchronous lock boundary. Existing locked evidence remains unchanged.

Schema 65 adds four injury tables without modifying existing table data. Historical reset protections require these tables to be empty rather than allowing their records to be discarded. Reads and runtime construction do not initialize or mutate injury state.

No provider is composed into the runtime. There are no import/settings/mapping HTTP routes and no scheduled injury job. Experimental ESPN adapter code is isolated and tested with synthetic data only during this milestone; its reuse entitlement and production reliability remain unverified. No missing report or estimated return date may automatically establish healthy status.

## Verification

All commands ran against local worktrees and isolated test data. Temporary backend data stayed under the backend worktree on E:.

- node --test test/foundation/playerInjuryFoundation.test.js test/foundation/playerInjuryIntegrationFoundation.test.js: 9 passed. Covers mapping, incomplete/stale input, failed refresh preservation, absent-player review, permissions, CSRF, stale saves, disabled imports, global status in two leagues, clearing uncertainty, and identical fingerprints for every non-injury table, plus foreign-key integrity.
- node --test test/foundation/teamWorkspaceFoundation.test.js: passed after adding schema65 to the fixture verifier's supported list.
- node --test test/foundation/rosterActionLateLockHttpFoundation.test.js: 7 passed, including actual Move to IR acceptance/rejection using global injury status against contradictory legacy data.
- League player read suite passed all 12 tests; matchup legality suite passed except an instrumented database wrapper missing pragma. That wrapper was corrected and its guard-first test passed on rerun. No application guard was weakened.
- Target runtime exact-dispatch and construction selection: 8 passed. Updated stale endpoint/schema assertions to actual 130 routes/schema65. Completed NHL statistics composition also passed. Runtime construction proves no writes/listening.
- Frontend focused injury admin, roster, catalogue, and player detail tests: 37 passed. Additional leagues/admin-recovery/player-detail selection: 56 passed (overlaps player-detail tests). Checks include no mount writes, required reason, global save contract, and conflict recovery.
- Vite build passed; existing advisory about a chunk larger than 500 kB remains.
- Chromium interactive injury preview: verified red name takes priority over gold, red IR control, admin healthy decision immediately updates sample roster warning and normal name treatment; no page errors or page overflow at 390/768/1024/1440 widths.
- Existing action expansion browser check: all 27 columns present at 390/768/1024/1440/1920; no action/stat overlap, desktop labels unclipped, keyboard focus supported.
- git diff --check passed in both worktrees.

Initial failures were corrected: fixture schema allowlist, historical reset table inventory, instrumented database pragma, old target endpoint/schema assertions, and CSS specificity where gold initially overrode injury red. This was focused verification, not the entire backend or frontend suite.

Screenshots: E:/hundo-leago/.hundo.local/injury-roster-preview.png and E:/hundo-leago/.hundo.local/injury-admin-preview.png. Browser script: E:/hundo-leago/.hundo.local/check-player-injuries.mjs.

## Remaining release boundaries

Verify a permitted free source before enabling imports. Publishing requires a separately authorized coordinated frontend/backend release, schema65 migration, preservation/backup checks, and signed-in staging review. The strict older player-response validator requires coordination with the new additive injury projection. No source-selection or hosted acceptance claim follows from this local milestone.

## Follow-up: combined injury and trade-block names

User deferred injury automation and requested a gold-to-red name gradient for players with both statuses. The shared name helper now adds a combined-status class and accessible title; CSS blends the existing gold (#dcc57e) into injury red (#ee999e) from left to right. This supersedes the earlier solid-red precedence described above. Table and hockey-lines previews passed, including forced-colour fallback and the existing responsive injury/recovery browser check. Single-status styling and action-button colours are preserved. No backend or deployment changes.
