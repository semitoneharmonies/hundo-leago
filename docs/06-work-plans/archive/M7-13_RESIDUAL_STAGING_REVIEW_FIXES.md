# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE — STAGING ONLY`

## Work Plan ID

```text
M7-13
```

## Work Item

```text
Residual staging review fixes for commissioner workflow density, horizontal
team stripes, roster readability, and reliable pointer/touch ordering
```

## Authority and Boundary

Grae authorized this work on `2026-07-26` after reviewing the M7-12 staging
result and directing that every remaining item in the immediate-fix review be
addressed before the next manual test.

This plan permits frontend changes in the canonical `E:\hundo-leago`
repository, disposable local browser testing, and publication to the existing
dedicated Netlify staging site after the full local gate passes and the site is
positively re-identified.

It does not authorize production deployment, production data or configuration
changes, a staging fixture reset, new league rules, arbitrary or partial
buyout transfers, provider imports, scheduled jobs, or unrelated redesigns.

## Approved Scope

1. Re-audit every item in Grae's immediate-fix review against the deployed
   M7-12 application and current code, treating already-correct behavior as
   regression requirements rather than assuming the review is obsolete.
2. Replace the team-directory card's subtle diagonal colour treatment with
   clear horizontal bands using each team's configured primary and secondary
   stripe colours, while preserving logo, name, manager, and managed-team
   status.
3. Simplify Commissioner Roster Operations by presenting one selected
   correction workflow at a time and placing supporting cap and staging-reset
   information in clearly labelled disclosures. Preserve every preview,
   confirmation, activity, permission, and staging-only safeguard.
4. Replace reliance on native row/card drag behavior with an explicit
   mouse-and-touch pointer handle that identifies the drop target and saves the
   authoritative display order. Preserve native drag fallback, keyboard
   controls, position-group boundaries, optimistic feedback, and backend
   concurrency validation.
5. Increase roster player and statistics typography, retain the default
   forward-then-defence descending-AAV order, and keep sortable GP, G, A, P,
   FP, and FPG columns without inline stat labels.
6. Reverify commissioner role separation, five roster-finance cards,
   retention-slot use, team switching, draft picks, player FPG and assignment
   filters, favourites, auction handoff, optional contract retention, Future
   Considerations notes, specific whole-buyout transfers, full-season matchup
   selection, completed-week reads, varied fixture totals, and current
   scheduled/live team names.
7. Add focused automated coverage for the residual changes and update
   canonical staging evidence after hosted acceptance.

## Required Verification

* Focused frontend tests for commissioner workflow selection and disclosures,
  horizontal team stripes, pointer/touch roster ordering, keyboard fallback,
  default AAV ordering, and roster statistic presentation.
* Existing focused frontend tests for every already-correct review item.
* Complete frontend test, lint, production-build, and browser-authority gates.
* Focused local desktop and narrow-layout browser checks for commissioner,
  teams, roster table, hockey lines, players, trades, and matchups.
* Staging-only publication after a separate verified frontend commit and
  positive Netlify staging-site identification.
* Hosted platform-administrator and Alpha Ravens manager acceptance before
  Grae's next manual test.

## Stop Conditions

Stop before any production action. Stop if a requested change would weaken
backend authority, league isolation, preview-and-confirm safeguards, or
buyout-obligation integrity. Stop a hosted write if the target cannot be
positively identified as the dedicated staging application.

## Completion Gate

M7-13 is complete only when the residual visual and ordering fixes pass the
full local gate, every immediate-review item has explicit regression evidence,
the exact staging application commit is published and hosted acceptance
passes, residual manual-only checks are recorded, and production remains
untouched.

## Completion Evidence

M7-13 completed on `2026-07-26`.

```text
Release ID:                  HL-20260726-4
Frontend application commit: 51f9c22c8127dcc992ca35ffcb9bdd10c14d3634
Frontend Netlify deploy:      6a666d6791675949811e06c9
Frontend Netlify build:       6a666d6791675949811e06c7
Backend application commit:   a821a95a267a370d7f3fe3ef0b8cfdacea83aea5 (unchanged)
Fixture build:                m7-release-qa-fixture-v8 (unchanged)
```

The complete frontend gate passed `115/115` tests across 23 files, lint,
production build, browser-authority verification across 15 compatibility
files and 98 shipped source files, and `git diff --check`.

Disposable local and hosted platform-administrator/Alpha Ravens manager
acceptance confirmed:

* one selected commissioner correction workflow at a time, collapsed cap and
  staging-reset supporting panels, no Import health pane, and corrected
  narrow-layout spacing;
* strong horizontal team-colour bands, five authoritative finance cards,
  `1/3` retention-slot use, larger sortable roster statistics, four years of
  picks, and table/hockey-line ordering controls;
* real provider-backed player names, FPG, Favourites and assignment filters,
  and stable player-to-auction handoff with the manager's team implicit;
* optional contract retention, notes-only Future Considerations, named whole
  buyout obligations, and readable pending-trade details;
* all 22 matchup weeks, usable completed Week 1 and scheduled future weeks,
  varied fixture totals, and current scheduled/live team names; and
* immediate team-name propagation into Matchups and the dashboard, followed by
  restoration of the original Alpha Ravens name.

The temporary roster display-order change and temporary team-name change used
for hosted acceptance were restored. No auction, trade, commissioner
correction, fixture reset, backend deployment, or production action occurred.
Manual native pointer dragging remains an explicit Grae acceptance check
because the connected browser's raw drag synthesis does not activate the
application gesture; mouse/touch pointer paths and saved payloads pass focused
automated coverage, and the hosted keyboard path persisted authoritatively.
