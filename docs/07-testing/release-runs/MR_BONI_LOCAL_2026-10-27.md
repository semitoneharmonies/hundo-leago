# Mr. Boni integration — local verification, 27 October 2026

## Status and source

This is a local integration record, not a hosted release or physical-device acceptance. The Mr. Boni candidate has not been deployed, and schema 96 has not been applied to production by this work. Source commits/publication and production activation remain separate operations.

Frontend candidate:

`E:/hundo-leago/.hundo.local/codex-documents/2026-10-25/i-x20/work/mr-boni-hundo-20261026/frontend`

It is based on accepted frontend commit `761c2ad81ab7e7251c660dbd1e875d8439cfc9e1`, including the public Tip Jar release and the later automatic IR-import skip explanation. At baseline discovery, the accepted Netlify deploy was `6ae01ff8fa78e08b5253644e`. The accepted backend preflight/backup source was `a9ff043d8697fbe6d52a51cf9fa3b3185c6a7194`, schema 95. Revalidate provider and database identities immediately before any future activation.

Private receipts and logs are in the candidate's sibling `../release/` and `../evidence/` directories. `../release/frontend-source-manifest.json` lists the exact modified and added frontend source paths with current byte counts and SHA-256 hashes. It excludes generated `.tmp`, `dist`, dependency, browser-output and provider-cache directories. It is a source inventory, not permission to publish or a frozen deployment receipt.

## Requested behavior implemented

- **Mini Games** replaces the single Tip Jar navigation entry and offers Tip Jar and Mr. Boni on desktop and mobile. Existing league-title switching remains intact.
- The sign-in page and unavailable-session fallback offer public Mr. Boni play without an account, beside Tip Jar.
- Public route `/games/mr-boni` and league route `/leagues/:leagueId/mr-boni` load a separate, lazy game wrapper and asset package.
- League and Hundo-wide leaderboards rank highest completed level first, then fastest cumulative time through that level. Rows explicitly show Level 1, 2 or 3 completed. An unfinished later level does not add time to the saved result.
- Each completed level checkpoints an immutable transcript. The backend derives results by replaying controls; the iframe never receives account credentials or the guest capability.
- A qualifying guest can explicitly name their public entry. Guest scores never enter league boards. Game and browser-recovery keys are separate from Tip Jar.
- Opening a page remains read-only even when older progress is pending. Retry submits that progress; Play saves the older prefix before creating the next run. Save failures remain visible and retryable.
- Fullscreen preserves the same iframe, forwards save status, and allows Times to pause/exit and reveal the boards. A read-only hello/ready handshake handles reconnecting an already loaded frame.
- Only `/games/mr-boni/resurface-v1/*` receives same-origin framing permission. The public wrapper keeps the normal API policy and no-store cache headers.

See [Mr. Boni specification](../../03-product-specs/MR_BONI.md) for the detailed product/API boundary. The standalone snow, pump, smearing, vehicle and mobile-control behavior is retained in the integrated package; engine optimization is subject to the separate replay/parity evidence, not inferred from frontend build success.

## Frontend automated verification

Commands were run from the candidate using Node `E:/hundo-tools/node-v24.14.1-win-x64/node.exe` and the existing E: dependency directory through a local junction. `--configLoader runner` avoids trying to write Vite configuration bundles through that dependency junction.

| Check | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run src/features/mrBoni src/features/tipJar src/components/TopBar.test.jsx src/features/accounts/AccountHome.test.jsx --no-cache --configLoader runner` | **106/106 tests passed in 15 files**, final run 27 October, 11.50 seconds. Earlier 105-test run passed before the readiness-handshake regression was added. |
| Focused ESLint over all changed frontend application, navigation, account, game-wrapper, fixture and test files | Passed. A later `eslint src/features/mrBoni` check also passed after the expanded recovery tests. |
| `git diff --check` | Passed; Git emitted only its CRLF normalization notices. |
| `node node_modules/vite/bin/vite.js build --configLoader runner` | Passed initially in 9.44 seconds. The release owner's later production build passed in 8.96 seconds, as recorded in `../evidence/frontend-production-build.log`; that log precedes the final hello/ready adjustment and must be superseded by a final release build. Existing large-chunk warning remains. |
| Unfiltered full ESLint | Failed: 473 reported problems. The release owner traced every offending path to generated `.tmp/mr-boni-vite-cache/deps/` files or unchanged bundled Tip Jar assets. The failed log is retained at `../evidence/frontend-lint.log`; this is not a full-lint pass. |
| Full authored-source ESLint excluding those generated/unchanged bundle paths | **Passed, exit 0**, confirmed by the release owner. Command: `eslint . --ignore-pattern '.tmp/**' --ignore-pattern 'public/games/tip-jar/campaign-v1/assets/**'`; log: `../evidence/frontend-source-lint.log`. The failed unfiltered check remains documented above. |

The test set covers two synthetic leagues, account/league replacement, unauthorized access, public read-only viewing, pending-record GET-only reopening, explicit Retry/Play ordering, guest naming and storage denial, exact-prefix retries, bounded outbox capacity, stale responses, cumulative-time display and API validation. It also compares wrapper command validation byte-for-byte against the actual packaged recorder/validator, tests exact command/tick limits and rejects rewritten prefixes.

A real-app dialog test executes the packaged `app.js` and `index.html` with renderer/audio stubs and a shortened recorder limit. It verifies that recording-limit Escape/cancel cannot falsely resume play and that starting a new shift requests a new server run. The release owner fixed that dialog issue during independent review. The frame brand was changed to a non-navigation element to avoid accidentally leaving a league run for guest play.

## Local browser checks

The release owner performed these checks against local frontend/backend test services, including the real packaged iframe. These are local browser observations, not production writes or authenticated hosted acceptance:

- Public guest entry, server-issued start, fullscreen introduction, snow-dump introduction, driving, pausing and Times navigation.
- Synthetic manager sign-in, Mini Games navigation and Mr. Boni league entry.
- A 390-pixel mobile viewport for the Mini Games menu and fullscreen introduction. `../evidence/mobile-mini-games.png` records the mobile menu.

The reusable synthetic wrapper fixture is `/e2e/fixtures/mr-boni-games.html`, with `?member=1` for two league contexts. It uses the actual iframe and a local mock client; checkpoint controls replay locally. It never contacts production storage. Unit/synthetic results do not establish physical-phone, WebKit, hosted authenticated or complete manual three-level gameplay acceptance.

## Protected source and data

Git comparison against `761c2ad81ab7e7251c660dbd1e875d8439cfc9e1` showed no source changes under `src/features/tipJar`, `public/games/tip-jar` or `src/features/injuries` (51 tracked paths across those directories). The Tip Jar product note and existing browser navigation test changed only to describe/open the requested submenu. No frontend authentication mechanism, fantasy calculation, league mutation or injury-import workflow was replaced. Final artifact byte preservation must still be checked against the accepted deployment when the release is frozen.

The production backup receipt `../release/production-backup.json` is `verified` at `2026-10-27T07:11:23.127Z`:

- Backup ID `84b574d4-9ff6-4eb4-9520-c95bbca6812e`; encrypted offsite backup and isolated restore verified.
- Source schema 95; integrity `ok`; zero foreign-key violations.
- Zero live league-data writes and zero session writes by the backup operation.
- Restored size 143,441,920 bytes, SHA-256 `28c54acf44a72dbca68f4f34ee121aad210efbf4335ec78e92b887e6600745db`.

`../release/restore-downloaded.json` verifies that same byte count/hash in isolated local E: storage. The local migration receipt `../release/migration-rehearsal.json` is `verified` at `2026-10-27T07:14:30.222Z`:

| Rehearsal property | Verified result |
| --- | --- |
| Migration | Schema 95 → 96; checksum `869749e9a59f58ac1940a31f6fdd5fba9b0cc18e74c8de9dea430885e8908709` |
| Existing tables / protected tables | 178 / 176 |
| Protected rows | Preserved |
| Prior migration ledger, schema and other metadata | Preserved |
| Rollback and idempotency | Verified |
| Recovery source compatibility | Verified |
| Integrity / foreign-key violations | `ok` / 0 |
| Live database changed | False |

This is an isolated migration rehearsal. It does not establish a production migration, production postflight preservation or a successful hosted deployment. Keep the current live database; never restore an older whole database over newer manager activity or game scores as a code rollback.

## Remaining release boundaries

No Mr. Boni hosted deployment, source publication or production schema activation is claimed here. Final source/artifact binding, post-handshake production build, current-provider revalidation, any required activation checks and live preservation review remain release work. Physical-device and cross-browser WebKit testing have not been performed in this task. No synthetic scores or imports have been submitted to production as a test.
