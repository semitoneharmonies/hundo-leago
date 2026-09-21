# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-06
```

## Active Step

```text
Account-Action Token, Security Audit, and Durable Rate-Limit Foundations
```

Grae authorized continuous technical and documentation work through
Milestone M3. This plan activates one isolated backend foundation step.
It does not authorize public account routes, email delivery, account
lifecycle changes, runtime mounting, deployment, production changes,
or SQLite application authority.

---

# Part 1 - Objective

Build the durable security-state foundations required before public
account workflows:

1. purpose-bound opaque account-action tokens;
2. digest-only token persistence and atomic single-use transitions;
3. append-only Security Audit persistence separate from League
   Activity;
4. keyed privacy-preserving bucket digests;
5. restart-safe fixed-window authentication rate limits with exact
   approved defaults.

No account is created, verified, reset, deactivated, or reactivated in
this step.

---

# Part 2 - Exact Source Scope

New files:

```text
src/domain/accounts/accountActionTokenPolicy.js
src/domain/accounts/authenticationRateLimitPolicy.js
src/infrastructure/security/createOpaqueActionTokens.js
src/infrastructure/security/createKeyedPrivacyDigest.js
src/infrastructure/persistence/sqlite/SqliteAccountActionTokenRepository.js
src/infrastructure/persistence/sqlite/SqliteSecurityAuditRepository.js
src/infrastructure/persistence/sqlite/SqliteAuthenticationRateLimitRepository.js
src/application/services/accounts/createAccountActionTokenService.js
src/application/services/accounts/createAuthenticationRateLimiter.js
test/foundation/accountSecurityStateFoundation.test.js
```

No existing source, schema, migration, package, route, bootstrap,
compatibility, frontend, or persisted-data file may change in M3-06.

---

# Part 3 - Account-Action Token Policy

Approved purposes and exact lifetimes:

| Purpose | Lifetime |
| --- | --- |
| `email_verification` | 24 hours |
| `administrator_setup` | 72 hours |
| `password_reset` | 30 minutes |
| `self_reactivation` | 30 minutes |

Policy behavior must:

* use safe integer UTC milliseconds;
* treat the exact expiry boundary as expired;
* distinguish only internal active, consumed, invalidated, and expired
  states;
* return one generic public-invalid category for malformed, unknown,
  wrong-purpose, expired, consumed, or invalidated material.

---

# Part 4 - Token Construction and Repository

The token adapter must:

* generate exactly 32 cryptographically random bytes;
* use canonical unpadded base64url encoding;
* store and look up only a SHA-256 digest;
* reject malformed values without echoing them;
* use equal-length constant-time digest comparison where comparison is
  required;
* expose raw issue material only through a non-enumerable internal
  result;
* add no JWT, global signing secret, or dependency.

The specialized SQLite repository must:

* look up by stable ID, exact digest, and active user/purpose;
* replace an active token for the same user and purpose atomically,
  invalidating the prior row;
* preserve one-active-purpose and unique-digest constraints;
* consume, invalidate, expire, and increment failed attempts with
  optimistic version checks;
* support a synchronous transaction hook so later lifecycle, audit,
  session, and outbox changes can commit atomically;
* roll back every partial change when a hook or write fails;
* expose no unrestricted list, delete, raw database, or digest outside
  the sensitive service boundary.

The service may issue, resolve, record a failed attempt, and consume a
token. It performs no account lifecycle transition itself in M3-06.

---

# Part 5 - Keyed Privacy Digests

`createKeyedPrivacyDigest.js` must:

* accept one configured non-enumerable M3-02 secret slot;
* require its positive key version;
* HMAC-SHA-256 a versioned purpose plus one bounded canonical value;
* produce only a lowercase 64-character digest and key version;
* provide separate constructed instances for rate-limit and audit
  purposes;
* never serialize or expose raw email, network, secret, or HMAC input;
* fail startup if a required key is absent.

No raw network or submitted-email value reaches SQLite.

---

# Part 6 - Append-Only Security Audit

`SqliteSecurityAuditRepository.js` must:

* insert only the approved `security_audit_events` schema fields;
* validate safe event type, outcome, IDs, correlation ID, reason code,
  key version, digest, client metadata, and timestamp;
* allow only bounded safe client metadata keys;
* keep league ID optional and never write League Activity;
* expose narrow lookups by stable event ID, actor, or target for future
  authorized diagnosis;
* provide no update, delete, truncate, unrestricted list, or raw
  database access;
* participate in a caller-owned SQLite transaction without starting a
  conflicting nested transaction.

Tests must prove ordinary application code cannot mutate or delete an
inserted audit row through this boundary.

---

# Part 7 - Durable Rate-Limit Policy

Approved defaults:

| Action | Network bucket | Account, target, or user bucket |
| --- | --- | --- |
| `sign_in` | 20 attempts / 15 min | 5 failures / 15 min |
| `sign_up` | 5 attempts / 1 hour | 3 attempts / 1 hour |
| `verification_resend` | 10 attempts / 1 hour | 3 attempts / 1 hour |
| `password_reset_request` | 10 attempts / 1 hour | 3 attempts / 1 hour |
| `reactivation_request` | 10 attempts / 1 hour | 3 attempts / 1 hour |
| `administrator_setup_resend` | deferred to normal admin limit | 3 attempts / 1 hour |
| `action_token_completion` | 20 attempts / 15 min | 5 failures / 15 min |
| `password_change` | deferred to normal authenticated limit | 5 attempts / 1 hour |
| `account_deactivation` | deferred to normal authenticated limit | 5 attempts / 1 hour |

Policy and persistence must:

* use deterministic fixed UTC windows;
* preserve attempts separately from failures;
* block at the exact configured threshold until the window ends;
* return a bounded whole-second `retryAfterSeconds`;
* never reveal whether an account or token exists;
* retain network counters after account sign-in success;
* support clearing only the sign-in account-failure bucket after audit;
* atomically create or update a row under concurrent attempts;
* use optimistic versions and the existing unique window key;
* clean only expired rows in a caller-supplied bounded batch;
* survive database close and reopen.

Undefined “normal admin” and “normal authenticated” network limits are
not invented here; those columns remain delegated to later general API
rate-limit policy while the exact three-per-hour or five-per-hour
target/user buckets are implemented.

---

# Part 8 - Tests

Focused tests must cover:

* every purpose and exact token lifetime;
* canonical random token generation, digest-only rows, replacement,
  wrong purpose, expiry boundary, failed attempts, consumption,
  double-consumption denial, optimistic conflict, rollback, and no
  secret serialization;
* privacy digest separation by purpose, key, and version;
* audit insert validation, bounded metadata, actor/target lookup,
  append-only surface, no League Activity write, and transaction
  rollback;
* every exact rate-limit default, threshold edge, fixed-window rollover,
  retry-after rounding, attempt/failure separation, account-only
  clearing, bounded cleanup, concurrency, and reopen durability;
* generic decisions for unknown account and token buckets;
* all SQLite files under unique operating-system temporary roots;
* no change to league-domain rows or protected JSON.

---

# Part 9 - Verification

Run under Node 24.14.1:

```text
node --test test/foundation/accountSecurityStateFoundation.test.js
node --test test/foundation/securityFoundations.test.js test/foundation/userCredentialFoundation.test.js test/foundation/sessionFoundation.test.js test/foundation/requestSecurityFoundation.test.js test/foundation/accountSecurityStateFoundation.test.js
node --test test/foundation/*.test.js
node --test
npm run check
node --check on every M3-06 file
git diff --check
```

Also verify:

* no M3-06 source is imported by the shipped runtime or compatibility
  routes;
* no raw token, email, network value, HMAC input, or configured secret
  appears in SQLite, logs, errors, JSON, URLs, or artifacts;
* `0001_initial.sql`, `package-lock.json`, five protected JSON files,
  frontend lockfile, and protected frontend source retain their
  baseline hashes;
* no repository SQLite database, sidecar, log, cookie, or token artifact
  remains;
* both repository statuses contain only understood work.

---

# Part 10 - Stop Conditions

Stop and preserve evidence if:

* approved documents conflict on token purpose, lifetime, audit
  separation, threshold, or schema behavior;
* a schema migration, dependency, shipped route, real account, email
  provider, deployment, or environment mutation becomes necessary;
* account lifecycle semantics must be invented before the foundation
  can remain neutral;
* raw sensitive material reaches a public boundary or artifact;
* a test writes outside its unique temporary root;
* a protected hash changes.

---

# Part 11 - Completion Boundary

M3-06 completes only when focused, combined M3 security, cumulative
foundation, complete backend, syntax, whitespace, isolation,
append-only, no-secret, no-artifact, schema, reopen, and protected-hash
gates pass and exact evidence is archived.

Completion does not claim that sign-up, verification, sign-in,
password reset, deactivation, reactivation, email, runtime mounting,
authorization, leagues, teams, memberships, or authenticated Socket.IO
exist.

The next proposed work item is:

```text
M3-07 - Self-Service Account Creation and Email Verification
```

M3-07 must receive its own exact active plan.

---

# Part 12 - Completion Evidence

M3-06 completed locally on 2026-07-20.

Files added:

```text
src/domain/accounts/accountActionTokenPolicy.js
src/domain/accounts/authenticationRateLimitPolicy.js
src/infrastructure/security/createOpaqueActionTokens.js
src/infrastructure/security/createKeyedPrivacyDigest.js
src/infrastructure/persistence/sqlite/SqliteAccountActionTokenRepository.js
src/infrastructure/persistence/sqlite/SqliteSecurityAuditRepository.js
src/infrastructure/persistence/sqlite/SqliteAuthenticationRateLimitRepository.js
src/application/services/accounts/createAccountActionTokenService.js
src/application/services/accounts/createAuthenticationRateLimiter.js
test/foundation/accountSecurityStateFoundation.test.js
```

Verified behavior:

* every exact token purpose and lifetime passes, including expiry at
  the exact boundary;
* opaque 32-byte tokens use canonical base64url and digest-only SQLite
  persistence with constant-time comparison;
* replacement, failed attempts, single consumption, expiry,
  optimistic conflict, transaction-hook rollback, and generic invalid
  results pass;
* keyed HMAC privacy digests separate rate-limit and audit purposes and
  expose no raw input or configured key;
* Security Audit accepts only bounded safe metadata, is append-only
  through its application boundary, supports narrow actor and target
  lookup, rolls back with caller transactions, and never writes League
  Activity;
* every approved authentication rate-limit default, attempt/failure
  separation, threshold edge, fixed-window rollover, account-only
  clearing, delegated normal limits, bounded cleanup, and database
  reopen durability pass;
* no M3-06 module is imported by the shipped runtime;
* schema, dependencies, protected JSON, and protected frontend hashes
  remain unchanged.

Verification results:

```text
Focused M3-06 suite:          8/8 tests, 4/4 suites
Combined M3 security suite: 62/62 tests, 20/20 suites
Cumulative foundation:     151/151 tests, 34/34 suites
Complete backend:          324/324 tests, 75/75 suites
npm run check:             PASS
syntax and whitespace:     PASS
runtime isolation:         PASS
append-only surface scan:  PASS
logging and artifacts:     PASS
protected hashes:          PASS
```

No commit, push, deployment, production change, schema change, route
mount, email delivery, account lifecycle transition, or SQLite
application authority change occurred.
