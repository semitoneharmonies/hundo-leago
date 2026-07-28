# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY (2026-07-27)`

## Work Plan ID

```text
M7-22
```

## Work Item

```text
Mobile-safe same-site staging sessions
```

## Authority and Boundary

Grae reported on `2026-07-27` that mobile sign-in immediately loses both new
and fixture-account sessions and asked Codex to correct the defect.

This plan permits a staging-only same-site frontend/API domain pair, explicit
session-cookie site policy, matching frontend and backend environment changes,
focused and complete authentication regression coverage, exact staging
commits, hosted deployment, and mobile-compatible session acceptance.

This plan does not authorize production-domain changes, production
environment changes, authentication tokens in browser storage or URLs,
weakened CSRF/CORS/origin protections, wildcard origins, database changes,
fixture resets, force-push, or a merge to `main`.

## Approved Scope

1. Use `staging.hundoleago.com` for the Netlify staging frontend.
2. Use `api-staging.hundoleago.com` for the Render staging API and Socket.IO
   service.
3. Add an explicit deployed `SESSION_COOKIE_SAME_SITE` contract.
4. Configure the same-site staging pair to use `SameSite=Lax`, `Secure`,
   `HttpOnly`, `Path=/`, and no `Domain` attribute.
5. Preserve exact credentialed CORS, Origin validation, session-bound CSRF,
   Fetch Metadata checks, and backend authorization.
6. Keep the prior Netlify and Render service URLs available for rollback while
   directing the staging application to the same-site pair.
7. Add focused configuration, cookie, runtime, and deployment regression
   coverage.
8. Run complete frontend and backend verification.
9. Publish and deploy only the exact verified staging commits.
10. Verify login, authenticated bootstrap, credentialed API access, and the
    authenticated Socket.IO path on the hosted same-site domains.

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

## Completion Evidence

- Frontend application commit
  `66986b9c7592176228854f6d4c6d1f7c97a7b783` configures the custom
  staging API and Socket.IO origins and permits them in the deployed CSP.
- Frontend routing commit
  `8c96e71a85b8d6a68099e29968ea13a732f4aff6` permanently redirects the
  former Netlify staging hostname, including deep links, to the custom
  staging hostname.
- Backend commit `d04f18f8212750ea0180b806480ecea6203582f3` makes the
  deployed cookie site policy explicit and uses that policy in the session
  runtime.
- Netlify staging deploy `6a68164f5056482991266e18` is ready at
  `https://staging.hundoleago.com`.
- Render staging deploy `dep-d9k11ltbedkc738pf5d0` is live at
  `https://api-staging.hundoleago.com`.
- The deployed session cookie is host-only and includes `Path=/`,
  `HttpOnly`, `Secure`, and `SameSite=Lax`.
- Hosted sign-in reached the authenticated league dashboard, a full reload
  retained the session, and an old-host deep link redirected to the same
  authenticated custom-domain path without a session-expired message.
- Credentialed login and the immediately following authenticated session
  request both returned HTTP `200`.
- An authenticated Socket.IO client connected successfully through
  `api-staging.hundoleago.com` with the exact custom frontend Origin.
- Public liveness and readiness both returned HTTP `200`.
- Exact Origin/CORS, CSRF, Fetch Metadata, HttpOnly, Secure, host-only, and
  backend authorization protections remain in place.
- Complete frontend and backend verification passed. The detailed evidence,
  deployment notes, rollback, and remaining manual mobile acceptance item are
  recorded in
  `docs/07-testing/release-runs/M7_MOBILE_SAME_SITE_SESSIONS_2026-07-27.md`.

## Rollback

- Restore the staging frontend API and Socket.IO origins to the Render
  `onrender.com` hostname.
- Restore the backend public frontend origin and exact allowlist to the
  Netlify hostname.
- Set `SESSION_COOKIE_SAME_SITE=none` only while those staging hosts are
  cross-site.
- Redeploy the prior known-good frontend and backend staging commits.
- Leave both custom-domain DNS records in place unless a separate cleanup is
  approved; they do not alter production.
- Do not rewrite history, reset the database, or change production.

## Completion Conditions

This plan is complete only when:

1. frontend and backend staging use the same registrable domain;
2. the deployed cookie site policy is explicit and accurately configured;
3. mobile-compatible login retains the backend-managed session;
4. CSRF, exact Origin/CORS, HttpOnly, Secure, and host-only safeguards remain;
5. authenticated Socket.IO still connects through the same-site API host;
6. complete verification passes in both repositories;
7. exact commits are pushed and hosted deploys are healthy; and
8. documentation records the evidence, rollback, and production boundary.
