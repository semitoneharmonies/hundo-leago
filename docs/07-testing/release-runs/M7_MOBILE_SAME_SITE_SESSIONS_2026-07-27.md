# M7-22 Mobile-Safe Same-Site Sessions Release Run

## Result

`PASS - STAGING ONLY`

## Date

`2026-07-27`

## Objective

Correct the mobile login loop caused by the staging frontend and API using
cross-site service-provider hostnames, while preserving server-managed
sessions and every existing authentication safeguard.

## Root Cause

The prior staging frontend used `hundoleago-staging.netlify.app` while the API
used `hundo-leago-backend-staging.onrender.com`. The backend therefore needed
a cross-site `SameSite=None` session cookie. Mobile Safari and privacy-focused
browsers may block that cookie as third-party state, so login could return
success and the immediately following authenticated request would have no
session.

The staging frontend and API now use subdomains of the same registrable domain:

```text
https://staging.hundoleago.com
https://api-staging.hundoleago.com
```

The session remains a backend-managed, host-only, HttpOnly cookie. No token was
moved into JavaScript storage or a URL.

## Safety Boundary

- The operating mode remains `OFFSEASON_RESET`.
- All work is limited to the frontend and backend `staging` branches and their
  staging hosting services.
- Production branches, domains, environment variables, data, and deployments
  are untouched.
- No database migration or fixture reset occurred.
- No credential, session value, CSRF value, provider secret, or account email
  is recorded in this document.

## Frontend Commits

Application/configuration commit:

```text
66986b9c7592176228854f6d4c6d1f7c97a7b783
```

Legacy-host routing commit:

```text
8c96e71a85b8d6a68099e29968ea13a732f4aff6
```

Files:

- `src/config/env.js`
- `src/config/env.test.js`
- `netlify.toml`
- `public/_redirects`
- `docs/04-technical-specs/ENVIRONMENT_SETUP.md`
- `docs/04-technical-specs/SECURITY.md`
- `docs/06-work-plans/ACTIVE_WORK_PLAN.md`
- `docs/06-work-plans/archive/M7-21_ISOLATED_STAGING_ACCOUNT_EMAIL_DELIVERY.md`

Implemented behavior:

1. The staging build uses the custom API and Socket.IO origins.
2. Cross-environment origin guards recognize the approved custom staging and
   production API hosts while continuing to reject mixed environments.
3. The deployed CSP permits HTTPS and WSS connections to the custom staging
   API host.
4. Requests to the former Netlify staging hostname permanently redirect to
   the same path on `staging.hundoleago.com`, preventing old phone bookmarks
   from continuing to use the cross-site topology.

## Backend Commit

```text
d04f18f8212750ea0180b806480ecea6203582f3
```

Files:

- `render.yaml`
- `src/config/loadSecurityConfig.js`
- `src/bootstrap/createTargetRuntime.js`
- `test/foundation/securityFoundations.test.js`
- `test/foundation/targetRuntimeFoundation.test.js`
- `test/foundation/targetDeploymentRuntimeFoundation.test.js`
- `test/foundation/renderStagingBlueprint.test.js`

Implemented behavior:

1. `SESSION_COOKIE_SAME_SITE` is an explicit deployment contract with allowed
   values `lax` and `none`.
2. Staging and production require an explicit value.
3. Local and test runtimes default to `lax` and reject `none`.
4. The runtime applies the configured policy rather than inferring it from the
   environment name.
5. The staging Blueprint uses `SESSION_COOKIE_SAME_SITE=lax`.

## Environment and Domain Configuration

Frontend staging:

```text
VITE_API_ORIGIN=https://api-staging.hundoleago.com
VITE_SOCKET_ORIGIN=https://api-staging.hundoleago.com
```

Backend staging:

```text
PUBLIC_FRONTEND_ORIGIN=https://staging.hundoleago.com
FRONTEND_ORIGINS=https://staging.hundoleago.com
SESSION_COOKIE_SAME_SITE=lax
```

The Netlify DNS zone contains the staging frontend record and the
`api-staging` CNAME for the Render service. The prior Netlify and Render
service hostnames remain available as rollback infrastructure, but ordinary
frontend traffic is directed to the same-site custom pair.

## Local Verification

Runtime:

```text
Node 24.14.1
```

Frontend results:

```text
npm test -- --run
132/132 passed across 24 files

npm run lint
passed

staging-configured npm run build
passed; 1,759 modules transformed

npm run verify:m3-browser-authority
passed across 18 compatibility files and 103 shipped source files

npm ls --all
passed

git diff --check
passed
```

The exact staged application source plus the legacy redirect also completed a
configured production build, and the generated `dist/_redirects` contained the
legacy-host redirect before the SPA rewrite.

Backend results:

```text
focused security/runtime/deployment suites
61/61 passed across 12 suites

npm run check
passed

npm test
complete suite passed

npm ls --all
passed

git diff --check
passed
```

## Hosted Staging Deployment

Netlify:

```text
deploy 6a68164f5056482991266e18
state ready
URL https://staging.hundoleago.com
```

Render:

```text
deploy dep-d9k11ltbedkc738pf5d0
state live
commit d04f18f8212750ea0180b806480ecea6203582f3
URL https://api-staging.hundoleago.com
```

Netlify's remote builder could not install the repository-pinned
Node `24.14.1` runtime. The final frontend was therefore built locally under
that exact runtime from the pushed application commit and uploaded as a
prebuilt static artifact. The ready deploy processed two redirect rules,
three header rules, and reported no secret-scan matches. The failed build
attempts never became live.

## Hosted Acceptance

- Browser sign-in on `staging.hundoleago.com` reached the authenticated league
  dashboard.
- A full reload remained on the authenticated league route.
- No session-expired message appeared after login or reload.
- A deep link on `hundoleago-staging.netlify.app` returned HTTP `301` to the
  same path on `staging.hundoleago.com`.
- Following that redirect in the browser retained the authenticated session
  and displayed the league dashboard.
- A separate credentialed request confirmed the login response sets
  `__Host-hl_session` with `Max-Age=604800`, `Path=/`, `HttpOnly`, `Secure`,
  and `SameSite=Lax`.
- The login request and the immediately following authenticated
  `GET /api/v1/session` both returned HTTP `200`.
- The deployed frontend CSP contains both the HTTPS and WSS custom API
  origins.
- Custom-domain liveness and readiness both returned HTTP `200`.

## Behavior Intentionally Preserved

- Sessions remain backend-managed and opaque to frontend JavaScript.
- Session cookies remain Secure, HttpOnly, host-only, and use the `__Host-`
  prefix.
- Exact credentialed CORS and Origin validation remain authoritative.
- CSRF, Fetch Metadata, rate limiting, session expiry, one-active-session
  behavior, and backend authorization remain unchanged.
- Existing API response contracts and user workflows remain unchanged.
- The backend database, fixture, provider data, league jobs, and account-email
  worker behavior remain unchanged.

## Tests Not Run

- Physical iPhone and Android browser testing was not available to Codex.
- A native mobile browser's privacy settings and home-screen bookmark behavior
  were not directly inspected.
- Production login and production custom domains were not tested or changed.
- No destructive account, league, fixture, or database operation was used.

## Remaining Risk and Follow-up

- Grae should open `https://staging.hundoleago.com` on the affected phone and
  confirm one login plus one refresh. Old bookmarks now redirect automatically.
- If a previously open phone tab has cached the old application shell, close
  that tab or navigate directly to the custom staging URL before retesting.
- Production requires its own approved same-site frontend/API domain pair and
  explicit cookie policy before launch; staging configuration must not be
  copied blindly.
- The Netlify build image currently cannot install pinned Node `24.14.1`.
  Future source-driven staging deploys should either use a supported exact Node
  release approved by the repository or continue the documented prebuilt
  artifact path until Netlify supports that runtime.

## Rollback

1. Restore the Netlify staging API and Socket.IO origins to the Render service
   hostname.
2. Restore the Render frontend origin and exact allowlist to the Netlify
   service hostname.
3. Set `SESSION_COOKIE_SAME_SITE=none` only while those hosts are cross-site.
4. Redeploy the prior known-good frontend and backend staging commits.
5. Leave custom DNS records in place unless a separate cleanup is approved.
6. Do not rewrite Git history, reset the database, or change production.
