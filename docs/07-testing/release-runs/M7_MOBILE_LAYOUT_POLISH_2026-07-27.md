# M7 Mobile Layout Polish

## Run Summary

- Date: `2026-07-27`
- Work plan: `M7-23`
- Environment: isolated Netlify frontend staging
- Result: ready for Grae's manual staging testing
- Production changes: none
- Backend, API, database, fixture, provider, email, and job changes: none

## Published Source

Frontend `staging` commits:

```text
a3f4015bf7a07738bbcdb14e7f4cc5300e538263
a1da43312beb41937d26b6b608fa40b2e29fae1a
d45373ddda7c85211e4ea0feb21179898221b12b
```

The final staging artifact was built from:

```text
d45373ddda7c85211e4ea0feb21179898221b12b
```

Frontend Netlify deploy:

```text
6a6823aaa8f41d9b53c1ca0d
https://staging.hundoleago.com
```

Netlify reported the deploy ready, processed two redirect rules and three
header rules without errors, and found no secret-scan match across `479`
scanned files.

## Changes Verified

### Matchup player scoring

The existing backend-authoritative scoring table remains the single data
source. At widths up to `660` pixels, each home and away player name spans
that team's half of the table. GP, G, A, PTS, and FP appear as five evenly
divided cells below the name. Names wrap when required instead of being
ellipsized.

Valid player FP values use `var(--hl-accent)`, the same orange used for team
matchup totals, with font weight `800` on phone and desktop layouts. Missing
player data and empty slots retain their unavailable presentation.

### Auction and bid forms

The Start Auction and Join/Update Bid forms now expose stable class hooks for
responsive layout. At phone width, player and team controls and the submit
button span the form width while total value and term share one row.

The existing minimum values, step values, selected team/player state,
submission handlers, mutation payloads, disabled states, errors, and backend
authorization remain unchanged.

### Roster and player tables

At phone width, roster and player table typography is denser, roster and
player action controls stay icon-sized instead of expanding on hover/focus,
and the drag handle remains usable. Wide tables continue to scroll within
their named table regions instead of creating document-level overflow.

## Automated Verification

Focused frontend suites:

```text
npm test -- --run \
  src/features/competition/CompetitionPages.test.jsx \
  src/features/transactions/TransactionPages.test.jsx

2 files, 24 tests passed
```

Complete frontend gate:

```text
npm run lint
PASS

npm test -- --run
24 files, 132 tests passed

VITE_APP_ENV=staging
VITE_API_ORIGIN=https://api-staging.hundoleago.com
VITE_SOCKET_ORIGIN=https://api-staging.hundoleago.com
VITE_BUILD_ID=d45373d
npm run build
PASS: 1,759 modules transformed

npm run verify:m3-browser-authority
PASS: 18 compatibility files and 103 shipped source files inventoried

npm ls --all
PASS

git diff --check
PASS
```

The matchup regression test now asserts that a player name has the responsive
name class and a valid matchup FP cell has the accent class. Existing
transaction tests continue to exercise Start Auction and Update Bid behavior.

## Hosted Acceptance

The deployed site was exercised through an authenticated manager session.
No auction, bid, roster, trade, or other state-changing action was submitted.

At a `390`-pixel viewport:

- the first home and away player names received `176` and `175` pixels,
  respectively;
- the five stat cells on each side received approximately `35` pixels each;
- the stat row began directly below the player-name row;
- long names, including **Aidan De La Gordendiere**, remained in the
  rendered scoring table;
- the matchup table and document both reported zero horizontal overflow;
- player FP computed to orange `rgb(249, 115, 22)` and font weight `800`;
- auction player/team and submit controls used the full form width while
  total value and term used two equal columns;
- player action controls measured `28 × 28` pixels;
- roster action controls and the drag handle measured `27 × 27` pixels;
- the player and roster tables scrolled within their own table regions; and
- the document reported zero horizontal overflow on the auction, player, and
  roster pages.

At a `1280`-pixel viewport:

- matchup player rows retained the standard one-line desktop table layout;
- player FP remained orange and bold; and
- neither the matchup table nor the document overflowed horizontally.

## Intentionally Preserved

- Backend matchup values remain authoritative.
- Matchup schedule, roster lock, legality, and scoring rules did not change.
- Auction and bid validation rules, payloads, and authorization did not
  change.
- Roster moves, drag persistence, cap logic, player filtering, and
  pagination did not change.
- League isolation and stable identifiers remain unchanged.
- The backend repository and service, database, fixture, email delivery,
  scheduled jobs, and production remain untouched.

## Tests Not Performed

- No physical phone or tablet was used; responsive acceptance used explicit
  `390`- and `1280`-pixel browser viewports.
- No native touch drag gesture was performed.
- No hosted auction, bid, roster, trade, or other state-changing form was
  submitted.
- No registry-backed `npm audit` was run.

## Remaining Risks and Follow-up

1. Grae's physical-phone review remains the final device-specific acceptance
   check.
2. Native touch drag behavior remains a separate manual acceptance item.
3. Future mobile adjustments should preserve internal table scrolling where
   full roster or catalog data cannot fit without losing useful columns.

## Documentation Decision

This run record, the M7-23 work plan, and the factual current-state entry
document the release. Product rules, API contracts, permission rules, and the
operating mode did not change.
