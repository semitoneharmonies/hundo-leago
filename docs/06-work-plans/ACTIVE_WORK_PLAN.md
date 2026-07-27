# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`IN PROGRESS - STAGING ONLY`

## Work Plan ID

```text
M7-18
```

## Work Item

```text
Staging hardening and regression pass
```

## Authority and Boundary

Grae authorized a thorough hardening and regression pass on `2026-07-27`,
including any necessary staging-branch fixes and staging publication.

This plan permits read-only hosted inspection, local automated verification,
scoped fixes for confirmed defects, regression coverage, exact staging-branch
commits, and deployment to the existing isolated Netlify and Render staging
resources.

This plan does not authorize production changes, fixture reset, destructive
database work, scheduled-job activation, provider refresh, outbound email,
secret changes, force-push, or merge to `main`.

## Approved Scope

1. Exercise administrator, commissioner, manager, account, league-isolation,
   team, player, roster, auction, trade, matchup, standings, activity, and
   notification workflows on hosted staging.
2. Run complete frontend and backend automated gates, dependency-tree checks,
   secret-pattern scans, unsafe-browser-API scans, and build verification.
3. Fix confirmed staging defects that conflict with approved specifications:
   inherited platform-administrator competition authority and raw technical
   commissioner previews.
4. Remove leftover client diagnostic logging that exposes transaction, player,
   auction, or backend response details.
5. Add static hosting security headers without changing application data or
   API authorization.
6. Add focused regression coverage and extend the release-QA verifier for
   inherited administrator competition authority.
7. Publish the exact verified commits to staging and complete hosted acceptance.

## Verification Gates

Frontend:

```text
npm run lint
npm test -- --run
npm run build
npm run verify:m3-browser-authority
npm ls --all
git diff --check
```

Backend:

```text
npm run check
npm test
npm ls --all
git diff --check
```

The backend suite must also pass in the Render build under the pinned Node
runtime. A local failure solely because the workstation Node patch version
does not match the pinned runtime must be reported explicitly and must not be
present in the Render build.

## Rollback

- Redeploy the prior known-good Netlify staging deploy.
- Redeploy the prior known-good Render staging deploy.
- Revert only the M7-18 commits in their respective repositories.
- Do not rewrite history or restore a database; this work contains no schema or
  persistent-data migration.

## Completion Conditions

This plan is complete only when:

1. both confirmed defects are fixed with regression coverage;
2. client diagnostic payload logging is removed;
3. hosting security headers are present on the public staging response;
4. complete local gates pass except for any explicitly isolated workstation
   runtime mismatch;
5. the Render build passes under the pinned Node runtime;
6. exact commits are published to both staging services;
7. hosted role, isolation, preview, console, and health checks pass; and
8. no known release-blocking regression remains in the tested scope.

## Completion Evidence

To be recorded after staging deployment and hosted acceptance.
