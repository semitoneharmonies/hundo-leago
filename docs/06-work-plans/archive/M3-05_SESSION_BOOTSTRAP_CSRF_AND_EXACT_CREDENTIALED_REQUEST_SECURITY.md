# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-05
```

## Active Step

```text
Session Bootstrap CSRF and Exact Credentialed Request Security
```

Grae approved the reload and multi-tab behavior on 2026-07-20:
derive a stable session-bound CSRF token from the opaque random session
secret with versioned cryptographic purpose separation.

This plan activates one small verified backend step. It does not
authorize sign-in, sign-out, public account routes, runtime mounting,
Socket.IO authentication, a schema change, deployment, production
changes, or SQLite application authority.

---

# Part 1 - Objective

Build isolated request-security and session-bootstrap foundations that:

1. validate exact configured frontend origins;
2. derive a stable 32-byte CSRF token from each random session token;
3. preserve digest-only SQLite storage;
4. reconstruct safe CSRF bootstrap material without a database write;
5. verify CSRF values in constant time for authenticated unsafe
   requests;
6. enforce exact credentialed CORS, bounded preflight, Origin, JSON
   content type, supplementary Fetch Metadata, and required API
   security headers.

No target route is mounted in the shipped compatibility runtime during
this step.

---

# Part 2 - Exact Source Scope

Existing files that may change:

```text
src/config/loadSecurityConfig.js
src/infrastructure/security/createSessionSecrets.js
src/application/services/accounts/createSessionService.js
test/foundation/securityFoundations.test.js
test/foundation/sessionFoundation.test.js
```

New files:

```text
src/transport/http/createTargetRequestSecurity.js
test/foundation/requestSecurityFoundation.test.js
```

No other backend source, schema, migration, package, route, bootstrap,
compatibility, frontend, or persisted-data file may change in M3-05.

---

# Part 3 - Exact Origin Configuration

`loadSecurityConfig.js` must:

* require `PUBLIC_FRONTEND_ORIGIN` and `FRONTEND_ORIGINS`;
* accept only canonical complete `http` or `https` origins with no
  path, credentials, query, fragment, wildcard, blank entry, or
  duplicate;
* require the public frontend origin to appear in the exact allowlist;
* require HTTPS for every production origin;
* preserve an immutable ordered allowlist;
* expose an exact membership predicate that returns false for missing,
  malformed, suffix-matched, or unlisted origins;
* never fall back to the compatibility Netlify suffix rule.

Local and test fixtures use explicit exact origins. Staging and
production still require their deployed values.

---

# Part 4 - Approved CSRF Derivation

`createSessionSecrets.js` must:

* continue generating one canonical opaque 32-byte session token;
* derive a separate 32-byte CSRF token with HMAC-SHA-256 using the raw
  session bytes as key material and the exact versioned label
  `hundo-leago:csrf:v1`;
* store only SHA-256 digests in the existing session row;
* reconstruct the same CSRF token from a valid raw session token;
* verify canonical presented CSRF material and the stored digest with
  equal-length constant-time comparisons;
* return one safe invalid result for malformed, wrong, cross-session,
  or digest-integrity failures;
* expose no raw token through enumeration, JSON serialization, logs,
  errors, URLs, or artifacts;
* use no global signing secret and add no dependency.

The approved derivation replaces M3-04's separately generated random
CSRF value. A new session still produces a new unlinkable CSRF token.

---

# Part 5 - Session-Service Bootstrap Boundary

`createSessionService.js` must preserve `issueForUser`, `resolve`, and
`revoke`, and add internal boundaries that:

* bootstrap only a current active session and active user;
* return safe user and session identity plus non-enumerable raw CSRF
  material for the future HTTP serializer;
* perform no write merely to bootstrap;
* authenticate an unsafe request only when the session and
  session-bound CSRF value are both valid;
* distinguish invalid session from invalid CSRF with safe stable result
  codes so future HTTP transport can return `401` or `403`;
* preserve five-minute activity persistence and all expiry behavior;
* never expose the stored session or CSRF digest publicly.

No membership, role, league, or team claim is added in this step.

---

# Part 6 - Target Request-Security Foundation

`createTargetRequestSecurity.js` must provide composable Express
middleware without creating or mounting an application.

Exact credentialed CORS:

* echo only an exact approved Origin;
* set `Access-Control-Allow-Credentials: true`;
* append `Origin` to `Vary`;
* allow only `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS`;
* allow only `Content-Type`, `X-CSRF-Token`, `If-Match`, and
  `Idempotency-Key`;
* bound successful preflight caching to 600 seconds;
* return no allow-origin header for missing, malformed, wildcard,
  suffix-matched, or unlisted origins;
* reject invalid preflight methods or headers.

Browser request enforcement:

* target browser endpoints require an exact approved Origin;
* authenticated unsafe requests require a valid session cookie and
  matching `X-CSRF-Token`;
* unsafe JSON endpoints accept `application/json` with an optional
  charset and reject HTML form types or absent content type;
* present Fetch Metadata must be compatible with CORS or same-origin
  API requests; absent metadata does not replace Origin or CSRF;
* raw cookie and CSRF values remain behind non-enumerable internal
  request state.

Required API response headers:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store
```

HSTS and frontend CSP remain deployment-gated as required by Security.

---

# Part 7 - Tests

Focused tests must cover:

* canonical local, test, staging, and production origin configuration;
* missing, duplicate, wildcard, path-bearing, credential-bearing,
  suffix-lookalike, insecure-production, and unlisted origins;
* deterministic domain-separated CSRF derivation, per-session
  separation, digest-only storage, reload stability, and multiple-tab
  stability;
* malformed, wrong, cross-session, expired-session, revoked-session,
  inactive-user, and stored-digest-integrity failures;
* no database write on bootstrap;
* exact allowed and denied credentialed CORS;
* valid and invalid preflight methods and headers;
* `Vary: Origin`, credentials, and 600-second maximum age;
* missing and wrong Origin, CSRF, content type, and Fetch Metadata;
* required security headers on success and safe failures;
* raw tokens absent from serialized responses, errors, captured logs,
  SQLite rows, and filesystem artifacts;
* no league-domain row or protected JSON change.

---

# Part 8 - Verification

Run under Node 24.14.1:

```text
node --test test/foundation/requestSecurityFoundation.test.js
node --test test/foundation/securityFoundations.test.js test/foundation/sessionFoundation.test.js test/foundation/requestSecurityFoundation.test.js
node --test test/foundation/*.test.js
node --test
npm run check
node --check on every changed or added M3-05 file
git diff --check
```

Also verify:

* no M3-05 module is imported by `server.js`,
  `createCompatibilityRuntime.js`, `createApplication.js`, or a shipped
  compatibility router;
* migration `0001_initial.sql`, `package-lock.json`, five protected JSON
  files, frontend dependency lock, and protected frontend source retain
  their baseline hashes;
* no repository SQLite database, sidecar, log, cookie, or token artifact
  remains;
* both repository statuses contain only understood work.

---

# Part 9 - Stop Conditions

Stop and preserve evidence if:

* HMAC derivation requires a global secret or a recoverable CSRF field;
* the existing session row cannot preserve digest integrity;
* exact Origin enforcement would require changing current compatibility
  behavior in this step;
* a schema, package, shipped route, real account, deployment, or
  environment mutation becomes necessary;
* raw token material reaches a public object, log, error, URL, database
  field, or artifact;
* a test writes outside its unique temporary root;
* a protected hash changes.

---

# Part 10 - Completion Boundary

M3-05 completes only when focused, combined security, cumulative
foundation, complete backend, syntax, whitespace, isolation,
no-secret, no-artifact, schema, and protected-hash gates pass and exact
evidence is archived.

Completion does not claim that target account routes, sign-in,
sign-out, account-action tokens, rate limits, Security Audit, email,
memberships, authorization, league isolation, runtime mounting, or
authenticated Socket.IO exist.

The next proposed work item is:

```text
M3-06 - Account Action Token, Security Audit, and Durable Rate-Limit Foundations
```

M3-06 must receive its own exact active plan.

---

# Part 11 - Completion Evidence

M3-05 completed locally on 2026-07-20.

Files changed:

```text
src/config/loadSecurityConfig.js
src/infrastructure/security/createSessionSecrets.js
src/application/services/accounts/createSessionService.js
test/foundation/securityFoundations.test.js
test/foundation/sessionFoundation.test.js
```

Files added:

```text
src/transport/http/createTargetRequestSecurity.js
test/foundation/requestSecurityFoundation.test.js
```

Verified behavior:

* frontend-origin configuration accepts only canonical exact origins,
  rejects wildcard and suffix matching, and requires production HTTPS;
* the stable CSRF token is HMAC-SHA-256 domain-separated with
  `hundo-leago:csrf:v1` from each opaque random session token;
* SQLite retains only token digests, repeated bootstrap reconstructs
  the same CSRF value, and bootstrap performs no session or domain
  write even at the activity-refresh boundary;
* wrong, malformed, cross-session, revoked, expired, inactive-user,
  and digest-integrity failures fail closed;
* credentialed CORS, exact Origin, bounded preflight, JSON content
  type, supplementary Fetch Metadata, session cookie, CSRF, and
  required API security headers pass;
* the safe bootstrap transport may explicitly serialize the raw CSRF
  token, but never the raw session token; other responses and errors
  expose neither token;
* no M3-05 module is mounted or imported by the shipped compatibility
  runtime;
* schema, dependencies, protected JSON, and protected frontend hashes
  remain unchanged.

Verification results:

```text
Focused request-security suite:      5/5 tests, 1/1 suite
Session and request-security suite: 23/23 tests, 6/6 suites
Combined M3 security suite:         39/39 tests, 11/11 suites
Cumulative foundation suite:      143/143 tests, 30/30 suites
Complete backend suite:           316/316 tests, 71/71 suites
npm run check:                     PASS
node --check on every M3-05 file:  PASS
whitespace and isolation scans:    PASS
logging and artifact scans:        PASS
protected-hash comparison:         PASS
```

No commit, push, deployment, production change, schema change, target
route mount, or SQLite application authority change occurred.
