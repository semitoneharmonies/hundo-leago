# IR importer: unrelated first names sharing a surname

Status: locally implemented and verified. No commit, push, deployment, live injury update or automated feed activation.

## Report and diagnosis

The user's screenshot showed 137 names: 133 matched, two skipped, and two separate unresolved entries (Jake O'Brien and Patrick Thomas). The prior automatic-skip change only skipped zero-candidate names. When no exact/approved-alias match existed, every active catalogue player with the same final surname became a candidate, regardless of first name. This could hold an unknown Jake O'Brien for Liam O'Brien, or Patrick Thomas for Robert Thomas. Those catalogue pairs were reproduced synthetically; the user's live candidate dropdowns/catalogue were not accessed.

A read-only Render lookup confirmed production backend `4fd3aa385ba6a3b2f524d36a268ffb8246d87ea5`, deploy `dep-dbgaon4s728c73ds8a5g`, still live. The reviewed matching file is unchanged from original importer commit `a9ff043d8697fbe6d52a51cf9fa3b3185c6a7194`. The earlier skip fix was present; its surname fallback was too broad for this case.

The user explicitly chose: **Automatically skip clearly different first names; still review similar or ambiguous names.**

## Resulting behavior

- Full-name exact matching and the existing approved full-name aliases retain precedence. Duplicate exact matches still require resolution.
- Same-surname fallback candidates must now have a plausible given name: prefixes/initials, close spellings (including adjacent transpositions), recognized nickname families or matching hyphenated given-name components. These fallbacks only request review; they never automatically identify a player.
- Close spelling uses edit distance at most two for names at least five characters, or same-initial names at least four characters; otherwise at most one. Two capital initials with a matching first initial remain reviewable. Review-only nickname families cover common short forms such as Bill/William, Jake/Jacob, Bob/Robert, Danny/Daniel, Nick/Nicolas and Sasha/Alexander.
- Jake/Liam and Patrick/Robert are skipped; Jordyn/Jordan, Jake/Jack, Henry/Harry, initials and the tested nickname/compound cases still require review. If an exact Jake or Patrick exists, that exact identity wins instead of skipping.
- The UI separately counts unresolved names, so a preview can read `137 names · 133 matched · 2 skipped · 2 need review` rather than leaving the total unexplained. The introduction and review text explain the new distinction.
- Existing replacement semantics remain: recognized listed players become eligible; previously injured players omitted from the final matched set appear as proposed returns to regular status. A fresh preview and explicit replacement confirmation are still required. An entirely skipped list cannot apply. Authorization, stale-preview protection, transaction rollback, audit events, IR-slot warnings and roster preservation remain enforced.

## Exact files

Frontend root: `E:/hundo-leago/.hundo.local/loading-menu-20261027/frontend` (accepted base `9955d66a84799539c08d8fb52f1b30d2aa8cb9ec`).

- `src/features/injuries/InjuryListImport.jsx`: preview copy and unresolved count.
- `src/features/injuries/InjuryListImport.test.jsx`: skipped versus review count regression.
- `e2e/injury-import.spec.js` (new), `e2e/fixtures/injury-import.html` (new), `e2e/fixtures/injury-import.jsx` (new): isolated UI checks that load the actual paired backend matching policy and intercept all fixture requests locally.
- `playwright.loading-menu.config.js`: includes this focused browser spec.
- This record and the combined local record.

Backend root: `E:/hundo-leago/.hundo.local/loading-menu-20261027/backend` (accepted base `4fd3aa385ba6a3b2f524d36a268ffb8246d87ea5`).

- `src/domain/players/injuryListPolicy.js`: narrower same-surname candidate selection.
- `test/foundation/injuryListImportFoundation.test.js`: matching and current-schema replacement/preservation regressions.

Earlier page-loading, Mini Games/logo and announcement changes in the same candidates were preserved. Both branches remain `codex/loading-menu-20261027`. Original dirty application roots and accepted release sources were not changed by this fix.

## Verification actually run

All commands used `E:/hundo-tools/node-v24.14.1-win-x64/node.exe`, with TEMP/TMP inside the relevant candidate `.tmp` directory.

1. Backend: `node --test test/foundation/injuryListImportFoundation.test.js` — **5/5 passed**, final frozen policy, 14.74 seconds. Covers unrelated first names, same-initial unrelated names, near names, aliases, initials, compounds, nickname families, duplicate exact matches, mixed candidates, forged resolutions, admin authorization, read-only previews, confirmed replacement, rollback, stale preview, all-skipped rejection, two-league unrelated-record preservation and unchanged rosters. An already-injured William remains injured when Bill is unresolved; attempted apply rejects without changing serialized database bytes.
2. Frontend: `node node_modules/vitest/vitest.mjs run src/features/injuries/InjuryListImport.test.jsx --configLoader runner --no-cache` — **6/6 passed**.
3. Browser: set `HUNDO_IR_BACKEND_ROOT=E:/hundo-leago/.hundo.local/loading-menu-20261027/backend` and `PLAYWRIGHT_BROWSERS_PATH=E:/Codex/cache/ms-playwright`, then `node node_modules/@playwright/test/cli.js test --config playwright.loading-menu.config.js e2e/injury-import.spec.js --workers=1 --output ../ir-import-browser-results` — **8/8 passed**, desktop/mobile Chromium/WebKit. Actual backend matching code feeds the real frontend component. The synthetic Jake/Patrick case proceeds after confirmation; a close spelling still requires resolution and another preview. No real API or database writes occur in these browser checks.
4. Focused ESLint for all new/changed IR JavaScript/JSX, backend `node --check`, and both repositories' `git diff --check` — **passed**.
5. `node node_modules/vite/bin/vite.js build --configLoader runner` — **passed**, production configuration with local build ID `loading-menu-local-20261027`. Existing large-chunk advisory remains. No deployment.

Screenshots are under `E:/hundo-leago/.hundo.local/loading-menu-20261027/ir-import-<project>.png`; mobile Chromium was visually inspected. Results/traces are in sibling `ir-import-browser-results`.

## Initial test issue and limits

The initial unchanged importer suite passed two of three tests; its integration case failed before import logic because the shared release fixture verifier supports schema 95 while current migrations reach 96. The test now builds and verifies the supported schema-95 synthetic fixture, migrates that fixture to 96, and then exercises the importer. No production migration or shared fixture verifier was modified.

No live catalogue dropdown inspection, real pasted-list submission, authenticated hosted acceptance, physical-device or full repository suite was performed. These checks establish local correctness for the defined matching policy and cases, not certainty about every possible nickname/transliteration. Unusual variants can still need review; only exact/approved-alias matches are automatic identities.

This correction is part of the prepared, undeployed frontend/backend candidate. Its announcement follow-up requires backend-first publication because of the additive announcement version field; see `ANNOUNCEMENT_REMOVAL_LOCAL_2026-10-27.md`. A future release requires separate authorization and refreshed production continuity/preservation checks. The user must preview their current complete IR list again after release before applying it.
