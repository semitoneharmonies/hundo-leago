# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE — STAGING ONLY`

## Work Plan ID

```text
M7-11
```

## Work Item

```text
Staging usability remediation: real fixture players, team workspace, player
discovery, auction handoff, trade presentation, activity summaries, and
account/team settings
```

## Authority and Boundary

Grae authorized this work on `2026-07-25` after independently reviewing the
staging application.

This plan permits coordinated frontend and backend changes in the canonical
`E:\hundo-leago` and `E:\hundo-leago-backend` repositories, disposable local
or test databases, and the existing dedicated staging services after the full
local gate passes and those services are positively re-identified.

It does not authorize a production deployment, production data or
configuration changes, scheduled jobs, a provider import, a new provider
entitlement, or changes to approved league rules.

## Approved Scope

1. Make the release-QA fixture use retained provider-backed NHL player
   identities when the provider catalog is present, with a visibly synthetic
   deterministic fallback for isolated tests. Correct the artificial Alpha
   Ravens cap defect and seed four years of owned draft picks.
2. Add one authenticated team-workspace read projection containing roster,
   contracts, authoritative cap components, retention-slot usage, draft picks,
   friendly trade-asset choices, and a manager-editable roster display order.
   The display order is presentation state only and must not mutate
   authoritative ownership slots.
3. Improve the team roster page with readable cap values, retained-salary slot
   usage, team switching, two-colour striped identity, logo support, four-year
   draft-pick inventory, table and hockey-line views, drag-and-drop ordering,
   and keyboard ordering controls.
4. Hide unavailable player records; default to total fantasy-points sorting;
   make player data columns sortable; add name, position, NHL-team,
   assignment, and games-played filters; retain contract context; and support
   a compare list.
5. Allow an eligible free agent to start an auction directly from the player
   list or detail page and prefill the selected player on the auction page.
   Hide the auction team selector only when the current user has exactly one
   eligible managed team in the selected league.
6. Replace raw trade asset identifiers with authoritative choices for
   Contracts, Prospects, Draft Picks, Buyout Penalty, Retention, and Future
   Considerations. Replace raw proposal JSON with one plain-language panel per
   team while preserving technical recovery evidence behind a disclosure.
7. Simplify League Activity to a summary, time, resolved team name, approved
   human-readable details, and optional collapsed technical record.
8. Add an authenticated Account page for display-name editing, password
   change, and authorized team name, logo, primary-colour, and
   secondary-colour editing. Email remains immutable through this workflow.
9. Update the target API contract, current state, roadmap status, tests, and
   manual QA evidence for the implemented behavior.

## Required Verification

* Backend migration, repository-catalog, reset-manifest, fixture, authority,
  league-isolation, cap, draft-pick, trade-choice, display-order, account, and
  target-runtime tests.
* Complete backend syntax and test suite under the repository-approved Node
  version.
* Frontend component/workflow tests, lint, and production build.
* Focused desktop and narrow-mobile browser checks for dashboard, team roster,
  players, auction prefill, trades, activity, and account settings.
* Staging-only deployment and hosted smoke only after separate verified
  frontend/backend commits and positive staging-service identification.

## Stop Conditions

Stop before any production action. Stop a hosted mutation if the target cannot
be positively identified as the dedicated staging application and database.
Stop if provider-backed fixture selection would overwrite or relabel provider
data, if an API contract conflicts with approved rules, or if a missing product
decision changes manager authority or authoritative league calculations.

## Completion Gate

M7-11 is complete only when the full local gate passes, the browser workflows
are usable on desktop and mobile, exact changed-file and residual-risk evidence
is recorded, the dedicated staging deployment is verified if performed, and
production remains untouched.

## Verification Evidence

On `2026-07-26`, the complete local automated gate passed:

* frontend tests: `110/110` across `22` files;
* frontend lint;
* frontend production build;
* frontend browser-authority verifier across `15` compatibility files and
  `97` shipped source files;
* backend tests: `967/967` across `232` suites under the repository-approved
  Node `24.14.1`;
* backend repository checks;
* focused provider-backed fixture, team-workspace, account-profile, migration,
  reset-manifest, runtime, cap, draft-pick, trade-choice, and display-order
  coverage.

A loopback HTTP/API smoke confirmed that the Alpha Ravens team workspace
reports `$7.25` cap usage as `$6.50` active net AAV plus `$0.75` retained
salary and `$0.00` buyout penalties, one of three retention slots used, and
sixteen owned picks across four draft years.

The connected-browser pass covered the dashboard, team switching, cap and
retention display, chronological four-year draft inventory, table and hockey
line views, persisted keyboard ordering, player filtering/sorting/comparison,
auction prefill, authoritative trade choices, plain-language trade details,
simplified activity, account/team settings, and Alpha/Beta isolation. The
dashboard, roster, players, trades, activity, and account pages had no
whole-page horizontal overflow at a `390 × 844` viewport, and the browser
console had no warnings or errors.

The connected browser could not synthesize a native HTML pointer drag even
from the visible drag handles. A focused DOM drag-event test proves the same-
position handler and saved order payload, and the connected browser proved
the equivalent keyboard order persists after reload. Manual pointer drag
remains an explicit user-acceptance item.

The staging-only candidate was published and verified on `2026-07-26`:

```text
Release ID:                 HL-20260726-2
Frontend application:       1233c3c6185d4f7edfa8dcedc8d59dcedce0f0a5
Netlify deploy:             6a6638fa90a1d936d7ab5426
Backend application:        e7f089ecc81ca9fa17b8b0143949b760668f66d1
Render deploy:              dep-d9j3ghhba33s73821490
Preflight report checksum:  8dcdd49eb3903fb658815cd9460f3dd1fbb04d10736e56b16d526f36a129299a
```

The exact backend deploy reached `live`, public liveness and readiness
returned `live` and `ready`, and schema migration `19` completed with
`integrity_check=ok`, zero foreign-key violations, and all nineteen migration
ledger rows. The verified pre-migration backup is
`backup-v1-81b3ca0f587fc64b24c2dba445e04db156e27f19055de0736f9582536560d7dd`.
The final fixture reset created backup
`backup-v1-4605c937816ac2469b3e62f3a804d236a5c53df6bc7dddcbfaef5bd3c3d353a6`,
installed fixture build `m7-release-qa-fixture-v7`, and preserved the
`3,154`-player catalog and `1,091`-row successful statistics import.

The hosted browser confirmed real provider-backed roster names, the exact
`$7.25` cap projection and `1/3` retention-slot display, sixteen four-year
draft picks, team switching, both roster views, persisted keyboard ordering,
the `3,154`-row available-player catalog, default fantasy-points sort,
column sorting, filters, comparison, player-to-auction prefill, implicit
single-team auction context, authoritative named trade choices, plain-language
trade panels, simplified activity, account/security settings, authorized team
profile settings, and direct Alpha-to-Beta access denial. Dashboard, roster,
players, trades, activity, and account remained contained at `390 × 844`.

Production services, data, configuration, branches, jobs, traffic, and
provider state were not changed.
