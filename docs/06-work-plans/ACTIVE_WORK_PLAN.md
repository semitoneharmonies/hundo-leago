# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`IN PROGRESS - STAGING ONLY`

## Work Plan ID

```text
M7-16
```

## Work Item

```text
Staging trade navigation, roster asset shortcuts, draft-pick identity,
and commissioner matchup motion
```

## Authority and Boundary

Grae authorized this frontend follow-up on `2026-07-26` after a
screenshot-supported staging review and directed that the completed batch be
pushed to the existing staging site for testing.

This plan permits scoped frontend changes, tests, documentation, a staging
branch push, and publication to the existing Netlify staging site. It does not
authorize production deployment, backend or database changes, force-pushing,
or unrelated product work.

## Approved Scope

1. Highlight a pending proposal on the Trades page when the signed-in
   receiving manager is expected to respond.
2. Link a received-trade notification directly to that proposal and open its
   backend-authoritative acceptance preview.
3. Animate the commissioner dashboard's five-second matchup rotation from
   right to left, with reduced-motion support.
4. Apply the approved team-stripe identity treatment to player cards in the
   roster hockey-lines view, retaining a dark-blue name area.
5. Replace the Players-page favourite helmet with a simple hockey-stick icon.
6. Provide another team's players and owned draft picks as stable-ID trade
   request shortcuts that open the proposal builder with the receiving side
   preloaded.
7. Present owned draft picks in a four-year, four-round matrix using each
   pick's original-team logo or team-colour fallback.
8. Add focused coverage, run the complete frontend gates, publish the exact
   committed build to staging, and perform connected-browser acceptance.

## Authority Reconciliation

The attached visual reference contained seven round columns. The approved Entry
Draft product specification defines four linear rounds, so this implementation
uses the reference's matrix and original-owner identity treatment while
displaying the authoritative four rounds. All preloaded trade assets use stable
backend IDs; display names and team colours are presentation only.

## Verification Gates

```text
npm run lint
npm test -- --run
npm run build
git diff --check
```

Focused browser acceptance must cover:

- receiving-manager trade-list highlighting;
- notification-to-acceptance-preview navigation;
- player and draft-pick request shortcuts with the correct proposal side;
- the four-round draft-pick matrix and original-team identity;
- hockey-line team stripes;
- the hockey-stick favourite action; and
- commissioner matchup rotation motion.

## Rollback

- Redeploy the previous known-good Netlify staging release.
- Revert only the scoped M7-16 frontend commits; do not rewrite history.
- No backend or data rollback is expected because this work creates no backend,
  migration, fixture, or persistent-data change.

## Completion Conditions

This plan is complete only when:

1. all approved items are implemented;
2. focused and complete frontend gates pass;
3. canonical documentation matches the shipped behavior;
4. the scoped staging commit is pushed;
5. the exact committed build is published to Netlify staging;
6. focused hosted acceptance passes; and
7. no known release-blocking defect remains in this batch.

## Completion Evidence

Pending staging publication and hosted acceptance.
