# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY`

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
   API authorization, and remove the backend framework fingerprint header.
6. Reject staging builds configured for the production backend, and production
   builds configured for the staging backend.
7. Add focused regression coverage and extend the release-QA verifier for
   inherited administrator competition authority.
8. Publish the exact verified commits to staging and complete hosted acceptance.

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
4. cross-environment backend origins are rejected by frontend configuration;
5. complete local gates pass except for any explicitly isolated workstation
   runtime mismatch;
6. the Render build passes under the pinned Node runtime;
7. exact commits are published to both staging services;
8. hosted role, isolation, preview, console, and health checks pass; and
9. no known release-blocking regression remains in the tested scope.

## Completion Evidence

- Frontend commits `82d1e48d8fc9617e174ffd34a77a40fc89c713f4`
  and `07cd689916c8083e84cbfd72281df8cb479699ec` were pushed to
  `staging`.
- Frontend Netlify deploy `6a6713c190a1d98698ab558b` is ready on
  `https://hundoleago-staging.netlify.app`.
- Backend commits `cdcb139b0c2c859abfbf11d8fcedd9a0eecc9f70`,
  `b8f93af412df4d608d8d6f10103fec49edeb3ffa`, and
  `522f0ce2a03428f6ed72f8a504d1b560d012ee35` were pushed to
  `staging`.
- Final Render deploy `dep-d9jhfhsm0tmc73b0jjn0` is live on
  `https://hundo-leago-backend-staging.onrender.com`.
- Frontend lint, all `126` tests, build, M3 verifier, dependency-tree, and
  whitespace gates passed.
- Backend syntax, dependency-tree, whitespace, and focused response-hardening
  gates passed. The complete local suite passed `982/983`; the sole failure was
  the workstation Node `24.11.1` versus pinned `24.14.1` assertion.
- The final Render build used Node `24.14.1` and passed all `983` tests.
- Public liveness and readiness return `200`; the deployed target no longer
  sends `X-Powered-By`.
- Hosted role, league-isolation, page, pagination, deep-link, read-only
  competition-preview, CSP, cache, and console checks passed.
- The detailed run record is
  `docs/07-testing/release-runs/M7_HARDENING_REGRESSION_2026-07-27.md`.
