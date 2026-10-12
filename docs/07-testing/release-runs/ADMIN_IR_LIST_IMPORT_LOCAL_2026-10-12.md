# Admin injury-list import — local verification, 12 October 2026

## Approved behavior

The platform administrator copies the complete PuckPedia injury table and pastes it into **Platform administration → Player injuries → Update IR list**. Preview shows additions, detail updates, removals, unchanged players, unmatched names and affected players already occupying IR slots. Explicit confirmation applies the reviewed list across all leagues.

All uniquely matched listed players become injured/IR-eligible, irrespective of the source designation (including OUT). Prior injured players absent from the replacement become healthy. This never moves roster slots. Existing commissioner individual roster corrections remain unchanged.

Injured names retain existing red styling and red IR actions. Timeline, source status and reason appear in the name tooltip and player card. Recovery clears these fields and removes the display. No scraping, scheduled import, external API, AI dependency or source-site request is added.

## Implementation locations

- Frontend worktree: `E:/hundo-leago/.hundo.local/admin-ir-import-20261012/frontend`, branch `codex/admin-ir-import-20261012`, based on release commit `2a2a761`.
- Backend worktree: `E:/hundo-leago-backend/.hundo.local/admin-ir-import-20261012/backend`, same branch name, based on release commit `ef9ec30`.
- Root worktrees and their unrelated edits preserved. Nothing committed or pushed.
- Backend: `src/domain/players/injuryListPolicy.js`, `src/infrastructure/persistence/sqlite/SqliteInjuryListOperations.js`, existing injury repository/service/router/policy, additive migration `0091_add_manual_injury_details.sql`.
- Frontend: `src/features/injuries/InjuryListImport.jsx`, existing admin panel, `src/shared/playerInjury.js`, player card and scoped stylesheet additions.
- Focused backend and frontend tests added/extended; release-QA schema allowlist extended for versions 90 and 91. Existing lineup test fixture now supplies the player identities required by current lineup policy.

## Contract and safeguards

`POST /api/v1/admin/injuries/preview-list`: `{ text, resolutions? }`.

`POST /api/v1/admin/injuries/apply-list`: same input plus `{ expectedRevision, confirmReplacement: true }`.

Both routes require an authenticated platform administrator and existing CSRF/origin protections. Preview is read-only. Apply rederives matches and preview hash inside an immediate transaction, checks for stale catalogue/injury/IR-roster context, then writes audited injury decisions atomically. Other database records remain untouched.

Up to 500 rows / 100,000 characters; accepts the three provided historical clipboard formats, including wrapped rows and known rows with absent status. Empty, malformed, duplicate or unresolved input cannot apply. Known name variants and normalized accents match; ambiguous names require explicit resolution. Missing catalogue players require explicit skip. At least one matched player is required; an empty paste cannot clear everyone.

New nullable fields on `player_injury_status`: `timeline`, `designation`, `injury_reason`. Public injury projections expose optional `details` only while injured; existing fields retain their contracts. Individual healthy/unknown decisions also clear the details. Previous values remain in existing audit history.

## Verification performed

All commands below ran against these isolated worktrees. TEMP/TMP pointed to `E:/hundo-leago-backend/.hundo.local/admin-ir-import-20261012/tmp`.

- Backend: `node --test test/foundation/injuryListImportFoundation.test.js test/foundation/playerInjuryFoundation.test.js test/foundation/playerInjuryIntegrationFoundation.test.js` — 11 passed before the final migration test was added. Includes HTTP commissioner denial, admin CSRF requirement, read-only preview, atomic failure rollback, stale rejection, audit attribution, metadata projection across two leagues, recovery, and exact preservation of every non-injury table.
- Final added migration test: `node --test --test-name-pattern="schema 90 upgrade" test/foundation/injuryListImportFoundation.test.js` — 1 passed. Real schema 90 existing player/injury rows remain identical after migration 91, with null new fields and no foreign-key errors. Total backend coverage executed: 12 passing tests.
- Frontend: `node node_modules/vitest/vitest.mjs run src/features/injuries src/shared/playerInjury.test.js src/features/players/PlayerHockeyCard.test.jsx` — 19 passed. Local Vite environment variables set explicitly.
- Scoped ESLint on every touched JS/JSX file, including the new browser fixture — passed.
- `node node_modules/vite/bin/vite.js build` — passed, 1,899 modules; existing large-chunk advisory remains. Local API configuration was used; this output is not a production deploy artifact.
- `git diff --check` in both worktrees — passed (line-ending notices only).
- Supplied clipboard lists parse as 123, 128 and 134 records. Parsing did not update production data.
- Chromium browser check used the real parser, service and SQLite repository through a loopback-only synthetic API. Verified paste/preview/confirmation/apply, red name and hover details, red/enabled IR action, player card details, replacement recovery, disabled IR action after recovery, phone panel bounds and no browser errors. Desktop width 1440; mobile width 390. Visually inspected screenshots and corrected mobile grid overflow/checkbox alignment.

## Local preview and evidence

Support files: `E:/hundo-leago-backend/.hundo.local/admin-ir-import-20261012/`.

- `preview-server.cjs`: loopback API on 4198, isolated synthetic release-QA database, never production. Its fake administrator bypass is confined to this support script; actual HTTP auth was tested separately.
- `browser-check.cjs`: reproducible Chromium workflow check, seeds only that synthetic API.
- `admin-review-desktop.png`, `admin-review-mobile.png`, `injury-card-desktop.png`, `recovered-card-mobile.png`.
- Frontend fixture: `e2e/fixtures/injury-list.html` and `.jsx`, served by Vite on `http://127.0.0.1:5178/e2e/fixtures/injury-list.html` while running. Fixture requires the local support API. It is not an authenticated production preview.

## Release status and limits

Local implementation complete. No staging/production deployment, shared league-data write, source commit or source push occurred. No signed-in hosted acceptance, Firefox or WebKit check was performed. The local Node executable was v24.11.1; the repository release engine requires >=24.14.1 <25, so release verification must use the supported runtime.

Release requires coordinated backend migration 91 and frontend publication under separately authorized production procedures, including fresh backup/restore and preservation checks. Recheck migration numbering against any intervening releases. Manual injury imports update readers through their normal request/refresh cycle; this feature adds no realtime broadcast. The parser intentionally rejects unfamiliar table formats for review rather than guessing. Commissioner controls were preserved, not expanded.
