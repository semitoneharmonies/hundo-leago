# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE — STAGING ONLY`

## Work Plan ID

```text
M7-12
```

## Work Item

```text
Hosted staging acceptance fixes for commissioner context, roster presentation
and ordering, player discovery, trade composition, and season matchup browsing
```

## Authority and Boundary

Grae authorized this work on `2026-07-26` after testing the M7-11 staging
deployment.

This plan permits coordinated frontend and backend changes in the canonical
`E:\hundo-leago` and `E:\hundo-leago-backend` repositories, disposable local
or test databases, and the existing dedicated staging services after the full
local gate passes and those services are positively re-identified.

It does not authorize a production deployment, production data or
configuration changes, scheduled jobs, a provider import, a new provider
entitlement, or unrelated rule changes.

## Approved Scope

1. Remove provider import health from Commissioner Roster Operations and
   improve that page's hierarchy and presentation without weakening
   preview-and-confirm safeguards.
2. Keep commissioner authority separate from team-manager assignment on the
   dashboard. Show personal-team language only for an explicit current team
   assignment, including accounts that independently hold both roles.
3. Apply each team's logo and two-colour stripe identity to the team index.
4. Remove the salary-cap Limit card from the roster finance summary, preserve
   authoritative cap values, and improve active-roster ordering and
   presentation.
5. Default active rosters to forwards followed by defence, with each group
   ordered by descending AAV and then player name when no manager order is
   stored. Make table and hockey-line drag-and-drop usable while preserving
   keyboard reordering and position-group boundaries.
6. Present roster statistics in sortable GP, G, A, P, FP, and FPG columns
   rather than inline labelled text.
7. Add FPG to the player catalog and comparison table. Replace the assignment
   filter with All Players, Free Agents, Favourites, each league team, and
   Prospects, while continuing to hide unavailable provider records.
8. Let a selected contract include an optional retained-AAV subfield. Present
   Future Considerations as a plain-language notes field. Identify each
   tradeable buyout by bought-out player, annual penalty, and remaining term,
   and transfer the selected obligation's complete remaining schedule without
   splitting or changing it.
9. Replace matchup-week tabs with a season week selector, fix completed-week
   response validation, expose the complete generated season schedule, and
   resolve current team names in non-historical matchup projections.
10. Update focused automated coverage, API/product documentation where
    approved behavior changed, manual QA evidence, and current-state records.

## Required Verification

* Focused frontend tests for commissioner roster operations, dashboard role
  separation, team stripes, roster ordering/stat sorting/dragging, player
  filters/FPG, trade composition, and matchup navigation.
* Focused backend tests for current team-name projection and full release-QA
  season scheduling.
* Complete frontend test, lint, production-build, and browser-authority gates.
* Complete backend syntax, repository, and test gates under the
  repository-approved Node version.
* Focused desktop and narrow-mobile browser checks for every affected page.
* Staging-only publication and hosted smoke only after separate verified
  frontend/backend commits and positive staging-service identification.

## Stop Conditions

Stop before any production action. Stop a hosted mutation if the target cannot
be positively identified as the dedicated staging application and database.
Stop if a requested buyout action would split or change an existing
obligation, invent a cash-like asset, or weaken authoritative cap and trade
validation.

## Completion Gate

M7-12 is complete only when all unambiguous acceptance fixes pass the full
local gate, the browser workflows are usable on desktop and mobile, exact
changed-file and residual-risk evidence is recorded, the dedicated staging
deployment is verified if performed, and production remains untouched.

## Completion Evidence

M7-12 completed on staging on `2026-07-26`.

```text
Release ID:                    HL-20260726-3
Frontend application commit:   7146bd042fd86f11dd4f1226c61d879f4956f358
Frontend Netlify deploy:        6a66610577aa69f808ad00a9
Frontend Netlify build:         6a66610477aa69f808ad00a7
Backend application commit:     a821a95a267a370d7f3fe3ef0b8cfdacea83aea5
Backend Render deploy:          dep-d9j5vnt8nd3s73asjkn0
Preflight report checksum:      d92192498d533c90ea160867c7b1c5378324c2c1c2b1d40aec47b2a309d68d06
Fixture build:                  m7-release-qa-fixture-v8
Reset backup:                   backup-v1-d90df160904d8d36441233bffc6037207fa4bb666677798557f82a4a07412ca1
```

The complete frontend gate passes `115/115` tests across 23 files, lint,
production build, and browser-authority verification across 15 compatibility
files and 98 shipped source files. The complete backend gate passes `968/968`
tests across 232 suites under Node `24.14.1`, plus the repository check.

Render reported the backend deploy `live`; public liveness returned `live`
and readiness returned `ready`. Netlify reported the frontend deploy `ready`,
processed both redirects, and found no secret-scan matches. The protected
reset created the verified backup above, invalidated prior staging sessions,
installed fixture v8, and preserved all `3,154` provider-catalog players.

Hosted administrator and Alpha Ravens manager checks confirmed the requested
commissioner context, roster presentation and ordering, player discovery,
trade composition, specific whole-buyout transfer, full-season matchup
browsing, auction handoff, readable activity, and account access. No trade or
auction was submitted during acceptance. The connected-browser environment
verified a narrow `667`-pixel layout without whole-page horizontal overflow;
focused responsive styles and component coverage also passed.

The connected browser cannot synthesize a native HTML pointer drag. Focused
frontend coverage proves the DOM drag handler and saved-order request, while
hosted keyboard ordering persisted and was restored. Native pointer drag
remains a user-acceptance check rather than an implementation blocker.

Production remained untouched.
