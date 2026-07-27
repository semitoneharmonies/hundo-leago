# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`IN PROGRESS - STAGING ONLY`

## Work Plan ID

```text
M7-17
```

## Work Item

```text
Trade-preview contract and requested-retention presentation
```

## Authority and Boundary

Grae authorized this frontend follow-up on `2026-07-26` after hosted manual
testing. This plan permits a scoped trade-detail presentation change, focused
and complete frontend verification, documentation, a staging branch push, and
publication to the existing Netlify staging site.

This plan does not authorize a trade-contract change, backend or database
change, email-environment change, production deployment, force-push, or
unrelated transaction redesign.

## Approved Scope

1. Pair a requested-retention asset with its matching included player contract
   using the stable contract ID.
2. Render that contract and requested retention in one trade-preview card with
   player name, contract AAV and term, roster category, and retained AAV.
3. Keep draft picks and every other independent tradeable asset in separate
   cards.
4. Preserve unmatched or independently tradeable retention obligations rather
   than hiding them.
5. Add focused coverage, run the complete frontend gates, publish the exact
   committed build to staging, and perform hosted browser acceptance.
6. Report the existing account-email environment boundary and recommended
   sender/reply-to setup without changing email delivery.

## Verification Gates

```text
npm run lint
npm test -- --run
npm run build
git diff --check
```

## Rollback

- Redeploy the previous known-good Netlify staging release.
- Revert only the scoped M7-17 frontend commits; do not rewrite history.
- No backend or data rollback is expected.

## Completion Conditions

This plan is complete only when:

1. matching requested retention renders within its contract card;
2. draft picks and independent assets remain separate;
3. focused and complete frontend gates pass;
4. the exact committed build is published to staging;
5. hosted acceptance passes; and
6. no known release-blocking defect remains in this adjustment.

## Completion Evidence

Pending staging publication and hosted acceptance.
