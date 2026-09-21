# M7 Frontend Release-Readiness and Accessibility Hardening

## Run Summary

- Date: `2026-07-27`
- Work plan: `M7-19`
- Environment: isolated Netlify and Render staging resources
- Result: ready for Grae's manual staging testing
- Production changes: none
- Backend, database, fixture, provider, email, and job changes: none

## Published Source

Frontend `staging` commit:

```text
d16ade0
```

Frontend Netlify deploy:

```text
6a676a67f354847de9aa60ac
https://hundoleago-staging.netlify.app
```

Netlify reported the deploy ready, processed all redirect and header rules
without errors, and found no secret-scan match across `413` scanned files.

## Changes Verified

### Commissioner action identity

When a commissioner or inherited platform administrator can edit another
team's roster, the roster now displays a visible **Commissioner action mode**
notice. It explains that changes are recorded under commissioner authority,
not as actions by the team's manager. The manager viewing their own roster
does not receive that notice.

Backend authorization, actor identity, audit behavior, and roster command
contracts did not change.

### Sort state

The player catalog and roster statistic tables now expose the active sort
direction through `aria-sort`. The attribute moves to the newly selected
column when a user changes the sort.

### Keyboard table access

Horizontal table wrappers are now reusable, named, keyboard-focusable regions.
The shared treatment is applied to:

- player catalog;
- legacy player search results;
- active, Bench, injured-reserve, and Prospect roster tables when populated;
- matchup player scoring;
- league standings; and
- projected standings in commissioner previews.

At narrow widths the table itself scrolls horizontally while the document
does not acquire whole-page horizontal overflow.

### Dashboard copy

Auction participation now uses `1 bidder` and pluralizes every other count as
`bidders`.

## Automated Verification

Frontend:

```text
npm run lint
PASS

npm test -- --run
23 files, 129 tests passed

VITE_API_BASE_URL=https://hundo-leago-backend-staging.onrender.com
VITE_APP_ENV=staging
npm run build
PASS: 1,757 modules transformed

npm run verify:m3-browser-authority
PASS: 15 compatibility files and 100 shipped source files inventoried

npm ls --all
PASS

git diff --check
PASS
```

Focused regression:

```text
4 files, 36 tests passed
```

Backend safety baseline:

```text
npm run check
PASS

npm test
983 tests: 982 passed, 1 known workstation-runtime assertion
Actual workstation Node: 24.11.1
Pinned runtime: 24.14.1

npm ls --all
PASS

git diff --check
PASS
```

The backend worktree remained clean and no backend deployment occurred.

## Hosted Acceptance

The deployed site was exercised with the administrator and the Riddles manager
test accounts.

At a `390`-pixel viewport:

- the player catalog exposed the named focusable region;
- the default FP header exposed `aria-sort="descending"`;
- selecting FPG moved `aria-sort="descending"` to FPG and removed it from FP;
- the catalog scrolled inside its region without document overflow;
- the administrator saw **Commissioner action mode** on the managed Riddles
  roster;
- the active-roster table was focusable and internally scrollable;
- selecting GP exposed `aria-sort="descending"`; and
- the Riddles manager's own roster did not display commissioner mode.

At a `1280`-pixel viewport:

- the administrator commissioner notice remained visible and fit its
  container;
- the roster did not cause document overflow;
- matchup player scoring and league standings exposed named focusable regions;
  and
- the manager dashboard displayed `1 bidder`.

Backend liveness returned `200`. The inspected Render window from
`2026-07-27T13:30:00Z` through `2026-07-27T14:35:00Z` contained no application
error and no `5xx` request.

## Intentionally Preserved

- The backend remains authoritative for roster legality, cap, permissions, and
  writes.
- No roster move, trade, auction, commissioner correction, invitation, or
  other league-state mutation was performed.
- League isolation and stable identifiers remain unchanged.
- The existing 100-player cursor pagination remains unchanged.
- Production, the backend service, staging data, fixture, email configuration,
  provider state, and scheduled jobs remain untouched.

## Tests Not Performed

- No native pointer drag gesture was executed.
- No destructive or state-changing roster action was submitted.
- No true mobile device or assistive technology was used; the mobile check
  used an explicit `390`-pixel browser viewport.
- The browser controller did not provide a final console-log stream. Every
  tested route completed without an error boundary or application error state,
  and the inspected backend log window was clean.
- A registry-backed `npm audit` was not run.

## Remaining Risks and Follow-up

1. Native pointer drag and real assistive-technology behavior remain manual
   acceptance items.
2. The workstation Node patch remains older than the pinned backend runtime;
   this pass made no backend change.
3. The future Free Agent Draft still requires its own approved product and
   technical specification before implementation begins.

## Documentation Decision

This run record, the M7-19 completion evidence, and the factual current-state
entry document the change. Product rules, API contracts, permission rules, and
the operating mode did not change.
