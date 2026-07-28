# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY (2026-07-27)`

## Work Plan ID

```text
M7-23
```

## Work Item

```text
Mobile matchup and transaction-layout polish
```

## Authority and Boundary

Grae asked Codex on `2026-07-27` to correct the matchup player layout on
small screens, emphasize each player's matchup fantasy points, review the
existing uncommitted mobile transaction and table styling, and publish the
verified result to staging.

This plan permits the requested frontend presentation changes, focused and
complete frontend regression coverage, exact staging commits, hosted Netlify
deployment, and responsive acceptance at phone and desktop widths.

This plan does not authorize backend, API, scoring-rule, auction-rule,
database, fixture, email, scheduled-job, production-environment, or
production-deployment changes.

## Approved Scope

1. At phone width, show each matchup player's complete name above that
   player's GP, G, A, PTS, and FP values.
2. Keep home and away players aligned for direct comparison without
   horizontal scrolling.
3. Display valid player FP values in the same orange accent as team matchup
   totals and use a bold weight on phone and desktop layouts.
4. Preserve one semantic scoring table and backend-authoritative score data.
5. Complete the pre-existing phone-width roster and player-table density,
   compact action-control, and auction/bid form layout work.
6. Preserve auction input rules, submission handlers, API payloads, and
   authorization.
7. Run focused and complete frontend verification.
8. Publish and deploy only the exact verified staging commits.
9. Verify the affected hosted workflows at `390`- and `1280`-pixel widths.

## Verification Gates

```text
npm run lint
npm test -- --run
npm run build
npm run verify:m3-browser-authority
npm ls --all
git diff --check
```

Focused suites:

```text
src/features/competition/CompetitionPages.test.jsx
src/features/transactions/TransactionPages.test.jsx
```

## Completion Evidence

- Frontend application commit
  `a3f4015bf7a07738bbcdb14e7f4cc5300e538263` contains the bounded
  matchup, transaction-form, roster-table, and player-table presentation
  changes.
- Follow-up CSS commits `a1da43312beb41937d26b6b608fa40b2e29fae1a`
  and `d45373ddda7c85211e4ea0feb21179898221b12b` resolve the legacy
  percentage-width interaction found during hosted responsive inspection.
- Netlify staging deploy `6a6823aaa8f41d9b53c1ca0d` is ready at
  `https://staging.hundoleago.com`.
- Netlify processed all redirect and header rules without errors and reported
  no secret-scan match across `479` scanned files.
- The focused competition and transaction suites pass `24/24`.
- The complete frontend suite passes `132/132` across `24` files.
- Lint, the staging-configured production build, browser-authority
  verification, dependency-tree validation, and whitespace validation pass.
- Hosted acceptance confirms complete matchup names above evenly divided
  stat rows, orange bold player FP, no matchup or page overflow, compact
  player and roster actions, internal table scrolling, and responsive
  auction/bid controls.
- The detailed release evidence and remaining manual items are recorded in
  `docs/07-testing/release-runs/M7_MOBILE_LAYOUT_POLISH_2026-07-27.md`.

## Rollback

1. Restore the previous known-good Netlify staging deploy
   `6a68164f5056482991266e18`.
2. Revert the M7-23 frontend commits through normal Git history if the change
   must be removed from the `staging` branch.
3. Do not force-push, rewrite shared history, change backend configuration,
   reset fixture data, or alter production.

## Completion Conditions

This plan is complete because:

1. the phone matchup table presents complete names above stats;
2. player FP is orange and bold on phone and desktop;
3. the requested earlier mobile-layout changes were reviewed and preserved;
4. focused and complete frontend verification passes;
5. the exact commits are published on `origin/staging`;
6. the final Netlify staging deploy is ready and passed hosted acceptance;
7. no backend-authoritative calculation or transaction behavior changed; and
8. production and all out-of-scope systems remain untouched.
