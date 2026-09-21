# M7-20 Legacy Quote Ticker Release Run

## Result

`PASS - STAGING ONLY`

## Date

`2026-07-27`

## Scope

This run verifies the frontend-only restoration of the existing
`src/quotes.js` catalog in the modern authenticated top bar. The work does not
change the catalog, API contracts, authoritative league state, backend,
database, fixtures, provider services, email, jobs, or production.

## Verified Behavior

1. The modern top bar imports the legacy static quote catalog.
2. A Fisher-Yates shuffle creates a new in-memory order without mutating the
   catalog.
3. Two visual copies of that order form one continuous right-to-left track.
4. The sequence is clipped to the flexible header lane between current
   location and account controls.
5. Quiet typography, `0.62` resting opacity, edge masks, and a catalog-derived
   `632s` staging duration keep movement visually subordinate.
6. Hover or keyboard focus pauses the track; focused opacity settles at
   `0.82`.
7. The reduced-motion rule removes animation and leaves only the first quote
   visible.
8. The ticker is authenticated-shell presentation only and performs no API
   request, mutation, or modern browser-storage write.

## Files in the Feature Commit

- `docs/04-technical-specs/FRONTEND_STRUCTURE.md`
- `docs/06-work-plans/ACTIVE_WORK_PLAN.md`
- `docs/06-work-plans/archive/M7-19_FRONTEND_RELEASE_READINESS_AND_ACCESSIBILITY_HARDENING.md`
- `src/components/QuoteTicker.jsx`
- `src/components/QuoteTicker.test.jsx`
- `src/components/quoteTickerSequence.js`
- `src/components/TopBar.jsx`
- `src/components/TopBar.test.jsx`
- `src/styles/theme-a.css`

## Local Verification

Commands:

```text
npm run lint
npm test -- --run
VITE_APP_ENV=staging
VITE_API_ORIGIN=https://hundo-leago-backend-staging.onrender.com
VITE_SOCKET_ORIGIN=https://hundo-leago-backend-staging.onrender.com
VITE_BUILD_ID=m7-20-precommit
npm run build
npm run verify:m3-browser-authority
npm ls --all
git diff --check
```

Results:

- lint passed;
- `131/131` tests passed across 24 files;
- the staging-configured Vite production build passed with 1,759 transformed
  modules and a `382.06 kB` initial JavaScript asset;
- the browser-authority verifier passed across 18 compatibility files while
  inventorying 103 shipped source files;
- the dependency tree exited successfully; and
- whitespace validation passed.

One earlier full-suite invocation intentionally failed closed because staging
variables were applied to Vitest without the required deployed build ID. The
suite was rerun in its intended test environment and passed completely; the
staging variables plus a build ID were applied only to the production build.

## Hosted Staging Verification

Feature commit:

```text
bc42937
```

Ready Netlify deploy:

```text
6a677c25e8319f5595bb8e36
```

Netlify evidence:

- 16 changed files uploaded;
- two redirect rules processed without error;
- three header rules processed without error;
- no functions or edge functions deployed; and
- no secret-scan match across 418 files.

Signed-in administrator acceptance:

- at 1280px, the ticker occupied 405.75px between the 253.27px current-location
  area and the account controls; the header remained 55px high and page
  scroll width equaled viewport width;
- at 390px, the ticker contracted to 169.47px, navigation and account controls
  retained their complete regions, and page scroll width equaled viewport
  width;
- the first four catalog entries differed after reload, confirming a new
  randomized order;
- normal animation reported `running`;
- keyboard focus reported `paused`, with the focus-within state active;
- the browser console contained no errors.

## Tests Not Run

- A hosted operating-system reduced-motion preference was not emulated by the
  available browser surface. The explicit reduced-motion stylesheet branch and
  its single-static-quote structure were inspected, while normal motion and
  focus pause were exercised live.
- No production acceptance was run.
- No backend test suite was rerun because the approved change is static
  frontend presentation with no backend file, request contract, or service
  deployment.

## Remaining Risk and Follow-up

- The legacy catalog is intentionally preserved verbatim and includes its
  existing uncensored locker-room language. Any future editorial moderation is
  a separate product decision.
- Perceived ticker speed and prominence remain subjective and should receive
  Grae's manual staging review.

## Rollback

Redeploy prior known-good Netlify staging deploy
`6a676a67f354847de9aa60ac` and revert frontend feature commit `bc42937`.
No data restoration is required.
