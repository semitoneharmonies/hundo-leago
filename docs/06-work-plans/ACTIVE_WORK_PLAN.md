# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY`

## Work Plan ID

```text
M7-15
```

## Work Item

```text
Staging review follow-up for roster flexibility, fixture depth, transaction
notifications, commissioner correction workflows, and final visual polish
```

## Authority and Boundary

Grae authorized this coordinated frontend and backend work on `2026-07-26`
after completing a screenshot-supported staging review and directing that all
items be addressed and published to the existing staging site before the next
manual test.

This plan permits changes in the canonical frontend repository and sibling
backend repository, a protected staging backup and fixture reset, separate
frontend and backend commits, and publication to the existing staging services
after all local gates pass.

This plan does not authorize production deployment, production data or
configuration changes, force-pushing, unrelated redesigns, or weakening
identity, ownership, contract, bench-AAV, injured-reserve, or prospect
eligibility rules.

## Approved Scope

1. Create an in-app notification for each active receiving-team manager when a
   trade proposal is created, and visually highlight pending trades involving
   the signed-in manager's team.
2. Replace the Players-page favourite symbol with a recognizable hockey helmet
   and present favourite and start-auction actions as compact icon buttons that
   expand to labelled pills on hover or keyboard focus.
3. Improve team-directory and matchup-header readability by fading team colour
   stripes toward a neutral dark identity area while keeping team colours
   visible at the outer edges.
4. Fit both sides of matchup player statistics without horizontal scrolling or
   clipping.
5. Remove redundant "Starting for" and "Bidding for" team labels from auctions
   while preserving backend-authoritative team context.
6. Support Active-to-Bench and Bench-to-Active moves by row action and drag and
   drop. Active, Bench, IR, and salary-cap overages may persist after an
   explicit warning and must produce an authoritative red illegal-roster flag
   until corrected. Preserve all other roster eligibility rules.
7. Expand the release-QA fixture so every team has 12 active forwards, 6 active
   defence players, 1-4 bench players, selected IR players, and several
   under-19 unsigned or ELC prospects.
8. Present team-colour inputs as compact two- or three-swatch controls.
9. Simplify commissioner roster operations: searchable free-agent selection,
   team-scoped player selection for removal and corrections, automatic
   position/slot handling, and a clean four-operation tab grid.
10. Add focused backend and frontend coverage, update canonical rule,
    product, API, fixture, and release documentation, and record local and
    hosted staging acceptance evidence.

## Roster Rule Reconciliation

This plan changes general legality handling, not player eligibility. A move may
temporarily create too many Active, Bench, or IR players, or exceed the salary
cap, only after the manager confirms the warning. The move then persists and
the backend returns the authoritative illegal-roster state.

The backend must continue to reject:

- unknown or cross-league player ownership;
- actions by an unauthorized user;
- moves without the required contract;
- Bench placement above the approved AAV ceiling;
- IR placement without authoritative IR eligibility;
- invalid prospect placement or activation;
- stale writes and malformed requests.

## Data and Deployment Safety

The fixture change requires a protected reset of the dedicated staging
database. Before the reset:

1. Positively identify the staging Render service and staging database.
2. Create and verify the standard staging backup.
3. Verify fixture apply and verification commands on a disposable local
   database.
4. Publish and migrate only the staging backend.
5. Reset and verify only the staging fixture.

The reset intentionally replaces disposable staging fixture activity,
invitations, transactions, and account state. Production must not be opened or
modified.

## Verification Gates

### Backend

```text
npm run lint
npm test
npm run verify:release-qa-fixture
npm run verify:migration-readiness
npm run verify:staging-backup
```

### Frontend

```text
npm run lint
npm test -- --run
npm run build
```

Focused browser acceptance must cover:

- receiver trade notification and manager trade highlighting;
- player action pills;
- team and matchup gradients;
- matchup width without horizontal scrolling;
- auctions without redundant team pills;
- Active/Bench moves, confirmation, persistence, and illegal-roster flag;
- compact team-colour inputs;
- commissioner add/remove/correct-roster/correct-contract workflows;
- complete fixture roster and prospect depth.

## Rollback

- Frontend: redeploy the previous known-good Netlify staging release.
- Backend: redeploy the previous known-good Render staging build.
- Data: restore the verified staging backup if fixture apply or hosted
  verification fails.
- Source: revert only the separate M7-15 commits; do not rewrite shared history.

## Completion Conditions

This plan is complete only when:

1. all approved items are implemented;
2. focused and full local gates pass;
3. documentation matches shipped behaviour;
4. frontend and backend commits are separate and scoped;
5. both staging branches are pushed;
6. the staging database is backed up, reset, and verified;
7. both hosted services are healthy;
8. focused hosted acceptance passes; and
9. no known release-blocking defect remains in this batch.

## Completion Evidence

M7-15 completed on staging on `2026-07-26`.

- Frontend application commit
  `5cb9f63c1185581eed0687188b9bc25bc885dac2` is published in Netlify
  deploy `6a66c4f9708a1baaa94b6135`.
- Backend application commit
  `d46104e754ffe56d68fc75baa3ec672a17f80d38` is published in Render
  deploy `dep-d9jcs0urnols738i11pg`.
- The dedicated staging database is at schema `21`. Migration `21` followed
  verified backup
  `backup-v1-8fc3212d1387f55cd5ed5f34ab3a017af7d1026b9c058d39e00f12ee78a66fb8`.
- Fixture `m7-release-qa-fixture-v10` remains installed with all `3,154`
  provider-catalog players and the required roster, Bench, injured-reserve,
  and Prospect depth.
- The complete frontend gate passed `119/119` tests across 23 files. The
  complete backend gate passed `976/976` tests across 234 suites under Node
  `24.14.1`.
- Hosted administrator, commissioner, and manager acceptance passed for every
  item listed in this plan. A confirmed Bench-to-Active overage persisted at
  `19/18` with the red authoritative illegal-roster flag, and the correcting
  Active-to-Bench move restored `18/18`.
- Public liveness and readiness both pass. Production branches, services,
  data, configuration, jobs, and traffic were not changed.
- A final identity clarification is published as frontend commit
  `9044974306badd8df192880b5f7b229397d8a685` in ready Netlify deploy
  `6a66d52d249ebdc854dbf6f1`. Hosted visual acceptance confirmed the
  dark-blue fade is limited to the name/logo identity area on the team index,
  dashboard team panel, matchup score headers, and roster header, and that the
  Players favourite action uses a front-facing hockey helmet.
- A final catalog-efficiency follow-up is published as frontend commit
  `72d30d687841196e1cf7e80051eaf0782079c402` in ready Netlify deploy
  `6a66dc51cc47020a84ddc746` and backend commit
  `c1c3a3b53f397747ecf219a8cc4dc7a428339b3b` in live Render deploy
  `dep-d9jdn5vavr4c73caolmg`. The team-index **Your team** badge now has
  colour-independent contrast. The Players catalog loads 100 records at a
  time, preserves default fantasy-points ordering through backend cursor
  support, keeps bounded server-backed autocomplete, and exposes one explicit
  **Load next 100 players** continuation. Hosted acceptance confirmed the
  100-to-200 flow. Follow-up gates passed `120/120` frontend tests and
  `978/978` backend tests under Node `24.14.1`; no migration or data reset was
  required.

The connected browser cannot synthesize a native pointer drag gesture from an
HTML drag handle. Focused automated drag coverage passes, and native pointer
drag remains a clearly recorded item for Grae's independent browser retest;
it is not a known application failure in this batch.
