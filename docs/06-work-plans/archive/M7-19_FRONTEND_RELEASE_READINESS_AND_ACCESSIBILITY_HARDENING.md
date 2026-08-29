# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY`

## Work Plan ID

```text
M7-19
```

## Work Item

```text
Frontend release-readiness and accessibility hardening
```

## Authority and Boundary

Grae authorized continued helpful staging-branch work on `2026-07-27` while
the future Free Agent Draft remains paused for its own product and technical
specifications.

This plan permits read-only hosted inspection, frontend accessibility and
presentation fixes for confirmed defects, regression coverage, documentation,
an exact frontend staging commit, and publication to the existing isolated
Netlify staging site.

This plan does not authorize backend behavior changes, database writes,
fixture reset, destructive operations, scheduled-job activation, provider
refresh, outbound email, secret changes, production changes, force-push, or a
merge to `main`.

## Confirmed Findings

1. Commissioner and inherited platform-administrator roster actions use
   approved authority but the ordinary team-roster interface does not identify
   when the action will be performed as a commissioner action.
2. Player-catalog and team-roster sortable columns show arrows visually but do
   not expose the active ascending or descending state through `aria-sort`.
3. Data tables that require horizontal scrolling at narrow widths do not expose
   a named keyboard-focusable scroll region.
4. The commissioner dashboard displays the grammatically incorrect text
   `1 bidders`.

## Approved Scope

1. Visibly identify commissioner-action mode on another team's roster without
   changing backend authority or transaction behavior.
2. Add standards-based sortable-column state to player and roster tables.
3. Make shared horizontal table wrappers named and keyboard-focusable with a
   visible focus treatment.
4. Correct singular and plural bidder copy.
5. Add focused frontend regression coverage for every change.
6. Run the complete frontend gate and the backend baseline safety gate.
7. Publish only the exact verified frontend commit to staging and complete
   read-only hosted desktop and mobile acceptance.

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

Backend safety baseline:

```text
npm run check
npm test
npm ls --all
git diff --check
```

The known workstation-only Node runtime assertion may remain the sole local
backend failure: installed `24.11.1` versus pinned `24.14.1`. No backend file
or hosted backend deployment is expected in this work step.

## Rollback

- Redeploy the prior known-good Netlify staging deploy.
- Revert only the M7-19 frontend commit.
- Do not rewrite history or restore a database; this work has no persistent
  data, API, schema, or backend change.

## Completion Conditions

This plan is complete only when:

1. all four confirmed findings are corrected;
2. focused regression coverage passes;
3. the complete frontend verification gate passes;
4. the backend safety baseline has no new failure;
5. the exact frontend commit is pushed to `staging`;
6. the Netlify staging deploy is ready;
7. hosted administrator and manager roster checks confirm correct action-mode
   presentation;
8. hosted player and roster tables expose sort state and keyboard scroll
   access at narrow width;
9. no hosted route renders an application error state and the inspected
   backend log window contains no application error or `5xx` request; and
10. production, backend state, fixtures, provider, email, and jobs remain
    untouched.

## Completion Evidence

- Frontend commit `d16ade0` was pushed to `staging`.
- Netlify deploy `6a676a67f354847de9aa60ac` is ready on
  `https://hundoleago-staging.netlify.app`.
- Netlify processed the redirect and header rules without errors, uploaded the
  changed Vite bundle, and found no secret-scan match across `413` files.
- Frontend lint, all `129` tests across `23` files, the staging-configured
  production build, the M3 browser-authority verifier across `15`
  compatibility files and `100` shipped source files, dependency-tree
  validation, and whitespace checks passed.
- The backend safety baseline passed syntax and dependency checks. Its complete
  local suite retained only the known workstation runtime assertion:
  Node `24.11.1` installed versus `24.14.1` pinned. No backend file or service
  was changed.
- Hosted checks passed for administrator and manager roster modes, player and
  roster sort direction, keyboard-focusable table regions, matchup and
  standings table regions, singular bidder copy, and no whole-page overflow at
  `390` and `1280` pixels.
- Backend liveness returned `200`; the inspected Render window contained no
  application error and no `5xx` request.
- The detailed run record is
  `docs/07-testing/release-runs/M7_FRONTEND_ACCESSIBILITY_HARDENING_2026-07-27.md`.
