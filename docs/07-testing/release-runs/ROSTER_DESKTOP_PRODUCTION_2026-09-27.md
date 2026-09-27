# Roster and desktop production release — September 27, 2026

Graem explicitly authorized carefully releasing this desktop-layout conversation and Roster Page Edits to live. This record describes the prepared release; final hosted receipts are recorded separately after publication.

## Scope and isolation

Isolated production-based release worktrees: `E:/hundo-leago-backend/.hundo.local/roster-desktop-production-20260927/{frontend,backend}`. Baselines: frontend `65e1b67715f8352aa9487da1374a3af20ec69343`, backend `73204baad55a15e9f6b455127a9255fc62588700`. Sources are the original production-based roster/injury feature worktrees, staged NHL palette/alias fixes, earlier full-stat header spacing, and the four desktop layout iterations. Staging was not copied wholesale: production auction/FAD/trade/timing fixes and migration history are preserved. Unrelated root work remains untouched.

Included: roster status colouring and expanding actions, removal of Hockey lines/redundant roster copy, concise lock/legality messages and larger counts; compact shared player cards with original signing and completed-trade history, team branding and optional NHL jersey numbers; administrator global injury decisions and healthy-IR legality; NHL team alias matching; full desktop width, larger player text/actions, taller headers, larger navigation/menus/standings/matchup controls/rules and dashboard grid rearrangement. All advanced-stat columns remain. Injury imports and automatic injury jobs remain disabled.

## Verification before publication

- Exact lockfile dependency installs using Node 24.14.1.
- Frontend full Vitest: 774/774 passed across 91 files. ESLint and production build passed; existing bundle-size advisory remains.
- Backend focused checks: 161 unique tests across 15 files. Initial 155 passed and six stale schema expectations failed; corrected assertions passed in the 27-test schema recheck and final two-test rerun. These cover cards, injury decisions, permissions, league isolation, roster/IR actions, matchup legality, runtime construction/HTTP, catalogue filters, migration/repository/reset protections and Cap outlook. Server syntax passed. The entire backend suite was not rerun; the earlier staging release's full-suite evidence is separate.
- Eight roster/card/action browser scripts passed, including five-width 27-column retention and card keyboard/focus, viewport and scoped accessibility checks. Desktop React pages passed 18 viewport cases. Six player-row preservation comparisons and three commissioner/menu keyboard cases passed. Final shared stylesheet matches the reviewed staging stylesheet after line-ending normalization.
- Fresh encrypted backup `050efcff-a2d8-4af9-bcc3-7b926299c348` was restored and verified before release. No older backup was restored over live data.
- Restored-backup schema64-to65 rehearsal passed: all 136 existing data-table fingerprints, prior migration ledger and unrelated metadata preserved; four empty injury tables added; integrity and foreign keys passed. Migration hash `6226d1e53f3228478933944159e9fc0ff1a6c39032b4ddae2523f130034d53cb`.
- Compatible backend rollback branch retains prior live application behavior plus the identical additive migration/catalog protections; runtime construction passed on schema65 with no writes or listening.

## Publication and rollback plan

Preserve current Render settings, jobs, instance, disk and write mode; only update APP_BUILD_ID with the exact release commit. Apply the rehearsed additive migration with preservation assertions inside its immediate transaction, then deploy the backend. Verify deployed source, schema, injury automation state and read-only roster/card projections before publishing the frontend. Hash every public asset, check API readiness/authentication/CORS and desktop/mobile startup, and record availability samples.

Frontend rollback is Netlify deployment `6ab794f07d349f938ae1463e` on production site `33dfbd4b-5e14-442b-8b78-a6191af03533`. Backend rollback must use the prepared schema65-compatible rollback commit, not an unmigrated old commit. Never drop injury tables or restore an old database over later manager activity. Main branches are not moved.

Fresh signed-in hosted feature acceptance has not been performed; local synthetic browser checks and deployed read-only repository checks are distinct evidence. Detailed scripts, source manifests, test output and final deployment receipts remain in the isolated release directory on E:.
