# Hundo Leago - Work Plan Archive

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY`

## Work Plan ID

```text
M7-20
```

## Work Item

```text
Legacy hockey quote ticker in the modern top bar
```

## Authority and Boundary

Grae explicitly requested this frontend presentation change on `2026-07-27`
and authorized staging-branch publication.

This plan permits reuse of the existing frontend quote catalog, a contained
modern-header component and styles, focused regression coverage,
documentation, an exact frontend staging commit, and publication to the
existing isolated Netlify staging site.

This plan does not authorize quote-catalog rewriting, backend behavior or data
changes, API changes, email, scheduled jobs, secret changes, production
changes, force-push, or a merge to `main`.

## Approved Scope

1. Reuse the quotes already stored in `src/quotes.js`.
2. Randomize their display order once per page load.
3. Continuously move the sequence from right to left in the open center lane of
   the authenticated top bar.
4. Keep the treatment quiet, clipped, and visually subordinate to navigation.
5. Preserve current location context, navigation, notifications, account
   controls, and responsive behavior.
6. Pause motion for hover or keyboard focus and present a static quote when the
   user requests reduced motion.
7. Add focused frontend regression coverage.
8. Run the complete frontend verification gate.
9. Publish only the exact verified frontend commit to staging and perform
   hosted desktop and narrow-width acceptance.

## Verification Gates

```text
npm run lint
npm test -- --run
npm run build
npm run verify:m3-browser-authority
npm ls --all
git diff --check
```

## Rollback

- Redeploy the prior known-good Netlify staging deploy.
- Revert only the M7-20 frontend commit.
- Do not rewrite history or restore a database; this work has no persistent
  data, API, schema, or backend change.

## Completion Conditions

This plan is complete only when:

1. the legacy quote catalog drives the modern authenticated top-bar ticker;
2. the order changes through an in-memory shuffle without a backend write;
3. the ticker does not displace or cover navigation and account controls;
4. hover, keyboard focus, and reduced-motion behavior are verified;
5. focused and complete frontend verification passes;
6. the exact frontend commit is pushed to `staging`;
7. the Netlify staging deploy is ready;
8. hosted desktop and narrow-width checks pass; and
9. production, backend state, provider services, email, and jobs remain
   untouched.

## Completion Evidence

- Frontend commit `bc42937` was pushed to `staging`.
- Netlify deploy `6a677c25e8319f5595bb8e36` is ready at
  `https://hundoleago-staging.netlify.app`.
- Netlify processed two redirects and three header rules without error and
  found no secret-scan match across 418 files.
- Lint, all `131` tests across 24 files, the staging-configured production
  build, browser-authority verification across 18 compatibility files and 103
  shipped source files, dependency-tree validation, and whitespace checks
  passed.
- Hosted administrator acceptance confirmed randomized reload order, slow
  right-to-left motion, focus pause, 390- and 1280-pixel layout fit, no
  whole-page overflow, and no browser-console error.
- The backend, database, fixtures, email, provider services, scheduled jobs,
  and production were not changed.
- The detailed run record is
  `docs/07-testing/release-runs/M7_QUOTE_TICKER_2026-07-27.md`.
