# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-04
```

## Active Step

```text
Opaque Session Repository, Lifecycle, and Cookie Foundation
```

Grae authorized continuous technical and documentation work through
Milestone M3 on 2026-07-19. This plan activates one small verified step.
It does not authorize sign-in routes, CSRF enforcement, Socket.IO
authentication, deployment, production changes, SQLite application
authority, or later M3 work without its own exact active plan.

---

# Part 1 - Objective

Build the backend-managed session foundation against the existing M2
SQLite schema:

1. generate opaque 32-byte session and CSRF secrets;
2. store only SHA-256 digests;
3. enforce one active session per user;
4. enforce seven-day absolute and twelve-hour idle expiry;
5. persist protected-activity refresh no more than every five minutes;
6. support replacement, revocation, expiry, and safe account-status
   checks;
7. serialize, read, and clear the approved HttpOnly session cookie.

This step adds no public endpoint and does not authenticate Socket.IO.

---

# Part 2 - Exact Source Scope

Add:

```text
src/domain/accounts/sessionPolicy.js
src/infrastructure/security/createSessionSecrets.js
src/infrastructure/persistence/sqlite/SqliteSessionRepository.js
src/application/services/accounts/createSessionService.js
src/transport/http/sessionCookie.js
test/foundation/sessionFoundation.test.js
```

No existing source, migration, schema, repository catalog, package
manifest, lockfile, compatibility route, frontend file, Render
blueprint, or persisted data file is changed by this step.

---

# Part 3 - Session Policy

`sessionPolicy.js` must define:

```text
absolute lifetime:          7 days
idle lifetime:              12 hours
persisted refresh interval: 5 minutes
```

It must:

* use injected safe-integer UTC milliseconds;
* create idle and absolute deadlines without overflow;
* cap every idle deadline at the absolute deadline;
* treat `now >= idle_expires_at_ms` or
  `now >= absolute_expires_at_ms` as expired;
* reject revoked, expired, malformed, or time-inconsistent rows;
* distinguish safe internal reason codes without leaking token facts;
* request a persisted refresh only after five minutes;
* never extend the absolute deadline.

This security-metadata refresh creates no League Activity and changes no
league, matchup, or standings state.

---

# Part 4 - Opaque Secrets

`createSessionSecrets.js` must:

* obtain exactly 32 random bytes for the session token and 32 independent
  random bytes for the CSRF token from the M3-02 adapter;
* encode each as canonical unpadded base64url;
* compute lowercase SHA-256 hex digests using Node crypto;
* validate an incoming raw session token as exactly 32 canonical bytes
  before digesting it;
* return no JWT, embedded identity, role, league, team, or expiry claim;
* zero temporary decoded byte buffers where practical;
* never log or place a raw token in an error.

Raw session material may leave the service only for cookie serialization.
Raw CSRF material is reserved for the later authenticated bootstrap
response. Neither is stored in SQLite.

---

# Part 5 - Session Repository

`SqliteSessionRepository.js` must:

* accept only an opened, migrated SQLite database;
* use prepared statements and the approved generic record repository;
* look up by stable session ID, exact token digest, or active user ID;
* insert schema-shaped active rows;
* expose no list-all, delete, or raw database handle;
* replace one user's active session in one immediate transaction;
* revoke the prior active row with reason `replaced_by_login`, set its
  timestamp, and increment its version before inserting the new row;
* revoke or expire one active row with optimistic version checks;
* persist last-used and idle-expiry refresh together with one version
  increment;
* roll back all changes if any transaction write or optional synchronous
  transaction hook fails;
* preserve the schema's one-active-session and unique-digest
  constraints;
* never expose stored token or CSRF digests outside this sensitive
  repository boundary except to the session service.

No raw token is accepted by the repository.

---

# Part 6 - Session Service

`createSessionService.js` must compose the M3-02 clock/randomness,
M3-03 user repository, session-secret adapter, session policy, and
session repository.

It must support internal methods to:

* create or replace a session only for an existing `active` user;
* construct the exact schema row and safe client metadata;
* resolve a raw token to a current active session and active user;
* return a generic invalid-session result for malformed, unknown,
  revoked, expired, idle-expired, or inactive-user cases;
* mark an expired row `expired` where it is still active;
* persist last-used/idle refresh only when the five-minute threshold is
  reached;
* revoke a current session with an approved reason;
* return only safe session identity and deadline fields from resolution;
* keep raw issue-time tokens in one explicitly marked internal result
  that must not be serialized as an API payload.

Issuance is an internal foundation seam only. A later sign-in service
must atomically add credential verification, audit, notification outbox,
rate limiting, and public generic responses before any route uses it.

---

# Part 7 - Cookie Transport

`sessionCookie.js` must:

* use `hl_session` only for exact local development;
* use `__Host-hl_session` for staging and production;
* always set `Path=/`, `HttpOnly`, and `Max-Age=604800`;
* set local `SameSite=Lax` and omit `Secure` only for an explicitly
  approved localhost origin;
* require `Secure` for every non-local environment;
* allow non-local `SameSite=None` only through explicit cross-site
  topology configuration;
* allow non-local `SameSite=Lax` for reviewed same-site topology;
* never add a `Domain` attribute;
* parse only the configured cookie name, reject duplicate values, and
  return null for absence;
* clear the same cookie with `Max-Age=0`;
* never place the token in JSON, a URL, or a non-HttpOnly cookie.

Exact CORS, Origin, Fetch Metadata, and CSRF enforcement belong to the
next request-security step.

---

# Part 8 - Tests

Focused tests must cover:

* exact lifetime and refresh boundaries, absolute capping, invalid time,
  revoked/expired status, and malformed rows;
* independent 32-byte secrets, canonical encoding, digest length,
  digest determinism, malformed raw-token rejection, and raw-token
  absence from rows/errors;
* one active session, unique digest, replacement, optimistic revocation,
  expiry, refresh, transaction-hook rollback, and no list/delete;
* active-user issuance, inactive/missing user denial, token resolution,
  generic invalid outcomes, replacement invalidation, absolute and idle
  expiry, five-minute refresh, and safe result shape;
* local, staging, and production cookie names and attributes;
* local-origin restrictions, required non-local Secure, explicit
  SameSite, duplicate-cookie rejection, clear-cookie behavior, and no
  Domain attribute;
* no session, token, cookie, or security-metadata operation changing any
  league-domain table;
* temporary database cleanup and protected-data preservation.

Existing characterization, migration, security, and credential
foundation tests must remain green.

---

# Part 9 - Verification

Run under exact Node 24.14.1:

```powershell
node --test test/foundation/sessionFoundation.test.js
node --test test/foundation/securityFoundations.test.js test/foundation/userCredentialFoundation.test.js test/foundation/sessionFoundation.test.js
node --test "test/foundation/*.test.js"
npm.cmd test
npm.cmd run check
git diff --check
```

Also verify:

* no dependency, lockfile, schema, or migration checksum change;
* raw session and CSRF tokens appear in no SQLite row, captured log,
  public-shaped result, thrown error, URL, or repository artifact;
* no cookie contains `Domain` or omits required `HttpOnly`, `Path`, or
  non-local `Secure`;
* no shipped route or compatibility runtime imports the foundation yet;
* all SQLite tests use unique operating-system temporary roots;
* all five protected JSON hashes remain unchanged;
* no repository SQLite database, sidecar, log, cookie, or token artifact
  remains;
* frontend source and dependency hashes remain unchanged.

---

# Part 10 - Stop Conditions

Stop and preserve evidence if:

* approved documents conflict on session, cookie, expiry, or schema
  behavior;
* the existing schema cannot satisfy one-active-session or digest-only
  storage;
* a new dependency, migration, real token, real account, or deployment
  configuration becomes necessary;
* a test writes outside its unique temporary root;
* a protected-data hash or compatibility behavior changes;
* production or staging access becomes necessary.

---

# Part 11 - Completion Boundary

M3-04 completes only when focused, combined security, cumulative
foundation, complete backend, syntax, whitespace, status, no-token,
no-artifact, schema-integrity, and protected-hash gates pass and exact
evidence is recorded.

Completion does not claim that sign-in, sign-out, CSRF, CORS/Origin
hardening, account-action tokens, public account flows, rate limits,
Security Audit, email, authorization, league isolation, or
authenticated Socket.IO exist.

After M3-04, the next proposed work item is:

```text
M3-05 - Session Bootstrap CSRF and Exact Credentialed Request Security
```

M3-05 must receive its own exact active plan.

---

# Part 12 - Completion Evidence

M3-04 completed locally on 2026-07-19.

Files added:

```text
src/domain/accounts/sessionPolicy.js
src/infrastructure/security/createSessionSecrets.js
src/infrastructure/persistence/sqlite/SqliteSessionRepository.js
src/application/services/accounts/createSessionService.js
src/transport/http/sessionCookie.js
test/foundation/sessionFoundation.test.js
```

Verified behavior:

* session and CSRF secrets use independent 32-byte randomness and only
  their SHA-256 digests reach SQLite;
* session lookup, one-active-session replacement, expiry, bounded
  activity refresh, revocation, rollback, and inactive-user failure
  paths pass;
* raw session and CSRF values are non-enumerable at their internal
  boundary and appear in no database row, log, error, URL, or worktree
  artifact;
* local and deployed cookie names, `Secure`, `HttpOnly`, `Path=/`,
  `SameSite`, seven-day `Max-Age`, duplicate rejection, clearing, and
  the prohibition on `Domain` pass;
* no M3 session module is imported by the shipped compatibility
  runtime, no public route was added, and no application authority
  changed;
* the initial migration, package lock, five protected JSON files, and
  protected frontend files retain their baseline SHA-256 hashes.

Verification results:

```text
Focused M3-04 suite:                 17/17 tests, 5/5 suites
Combined M3-02 through M3-04 suite:  47/47 tests, 15/15 suites
Cumulative foundation suite:       136/136 tests, 29/29 suites
Complete backend suite:            309/309 tests, 70/70 suites
npm run check:                      PASS
node --check on every M3-04 file:   PASS
git diff --check:                   PASS
runtime-import scan:                PASS
logging and artifact scans:        PASS
protected-hash comparison:          PASS
```

No commit, push, deployment, production change, or SQLite application
authority change occurred.
