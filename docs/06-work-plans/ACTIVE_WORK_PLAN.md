# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY`

## Work Plan ID

```text
M7-14
```

## Work Item

```text
Final staged product-review batch for team identity, roster actions, player
favourites and search, matchup presentation, and commissioner administration
```

## Authority and Boundary

Grae authorized this coordinated frontend and backend work on `2026-07-26`
after completing a screenshot-supported staging review and directing that all
items in that review be addressed before the next manual test.

This plan permits changes in the canonical frontend repository and the sibling
backend repository, a forward-only SQLite migration, disposable local browser
testing, separate frontend and backend commits, and publication to the existing
dedicated staging services only after the full local gates pass and both
staging targets are positively re-identified.

It does not authorize production deployment, production data or configuration
changes, a staging fixture reset, arbitrary member deletion, changes to league
scoring or roster rules, or unrelated redesigns.

## Approved Scope

1. Support either two or three team colours. Two colours render as equal top
   and bottom bands; three colours use the approved three-band pattern.
   Preserve readable team names and logos with a consistent contrast treatment
   on directory cards and roster identity headers.
2. Simplify roster ordering to the drag handle while preserving an accessible
   keyboard path. Add compact expanding row actions for whole-contract buyout,
   eligible Active-to-IR movement, trade-composer handoff, and the approved
   informational trade block.
3. Persist trade-block state authoritatively in SQLite, enforce league and team
   authority in the backend, clear stale flags when ownership changes, expose
   the state through stable API contracts, and display it without affecting
   transaction or approval rules.
4. Replace Players-page comparison controls with colour-changing helmet
   favourite controls, remove the duplicated selected-player table, and add a
   selectable player-name autocomplete without introducing hidden writes.
5. Present matchup week labels as human-readable week numbers and date ranges,
   add games played to both player-score tables, and apply each team's colour
   bands to the matchup score headers.
6. Replace commissioner dashboard manager-empty states with league-level
   auction, trade, membership, and rotating matchup information. Add
   commissioner invitation and member-removal controls with explicit
   confirmations and understandable errors.
7. Add a platform-administrator section to league selection for creating a
   league and assigning its commissioner through existing protected endpoints.
8. Add focused backend and frontend coverage, update canonical product/API/data
   documentation, and record local and hosted staging acceptance evidence.

## Data and Migration Safety

The backend migration must be forward-only and additive. Existing two-colour
teams remain valid with no tertiary colour. Existing roster ownership,
contracts, memberships, and league records must be preserved. Trade-block rows
must reference stable ownership/team/league identifiers and be removed when the
underlying ownership is transferred, released, or otherwise ceases to be held
by the flagged team.

Before any staging backend publication, create and verify the standard staging
database backup and confirm migration readiness against a disposable database.
No production database may be opened or modified.

## Required Verification

* Focused backend tests for team-profile third-colour validation and
  persistence; trade-block authorization, lifecycle cleanup, isolation, and
  read shape; and the unchanged invitation, membership, league creation, and
  commissioner-assignment protections.
* Focused frontend tests for two/three-colour identity treatments, roster
  action availability and handoffs, helmet favourites and autocomplete,
  matchup labels/GP/colour headers, commissioner dashboard rotation and member
  controls, and administrator league creation/commissioner assignment.
* Complete backend test and syntax gates.
* Complete frontend test, lint, production-build, browser-authority, and
  `git diff --check` gates.
* Disposable local desktop and narrow-layout browser acceptance for manager,
  commissioner, and platform-administrator roles.
* Separate backend and frontend commits followed by staging-only publication,
  migration verification, health checks, and hosted role acceptance.

## Stop Conditions

Stop before any production action. Stop if a requested UI shortcut would bypass
backend authorization, execute an irreversible action without confirmation,
weaken league isolation, or conflict with an approved league rule. Stop a
hosted write if the target cannot be positively identified as the dedicated
staging service or if a verified database backup is unavailable.

## Completion Gate

M7-14 is complete only when every screenshot-review item has focused automated
evidence, both full local gates pass, the exact backend and frontend commits are
published to their dedicated staging services, migration and health checks
pass, manager/commissioner/administrator hosted acceptance passes, canonical
evidence is current, and production remains untouched.

## Completion Evidence

M7-14 completed on staging on `2026-07-26`.

The implementation was published as frontend application commit
`ae7cb7d0dc5d9cba14b8f5d8b080aa3eb932eeb9` in Netlify deploy
`6a669ac2e7798097bd3f111c` and backend application commit
`9b1b89aebcd79ced9343eb1cde68543fa80023f3` in Render deploy
`dep-d9j98evaqgkc73b587mg`. The backend migrated from schema `19` to schema
`20` only after verified staging backup
`backup-v1-02af141187ca38d6746b3d85bd4351cc045639c2755dd5a22af639c7a0a536ed`
was created. Migration-ledger, SQLite integrity, foreign-key, liveness, and
readiness checks passed.

The complete frontend gate passed `118/118` tests across 23 files, lint,
configured production build, browser-authority verification across 15
compatibility files and 99 shipped source files, and `git diff --check`. The
complete backend gate passed `974/974` tests across 234 suites under Node
`24.14.1`, syntax verification, and `git diff --check`.

Hosted administrator, commissioner, and manager acceptance confirmed the
two/three-colour identity treatments, roster actions and handoffs, helmet
favourites and player autocomplete, matchup presentation, commissioner
workspace, member invitation and removal controls, administrator league
creation controls, and actionable invitation notifications. A temporary
staging manager-membership removal performed during the confirmation check was
repaired through the normal invitation and acceptance workflow; the Alpha
Wolves manager assignment is restored and the resulting plain-language
activity entries intentionally remain.

No staging fixture reset occurred. Production remained untouched.
