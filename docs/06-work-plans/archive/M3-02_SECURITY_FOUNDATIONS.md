# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

Completed: `2026-07-19`

## Work Plan ID

```text
M3-02
```

## Active Step

```text
Security Configuration, Clock, Randomness, and Redacted Logging Foundations
```

Grae authorized continuous technical and documentation work through
Milestone M3 on 2026-07-19. This plan activates one small verified step.
It does not authorize deployment, production changes, SQLite
application authority, account or session endpoints, or later M3 work
without its own exact active plan.

---

# Part 1 - Objective

Add reusable backend security foundations before account data or
authentication behavior exists:

1. parse and validate security-relevant environment configuration
   without printing secret values;
2. provide one injectable UTC clock contract for later session, token,
   audit, and rate-limit expiry decisions;
3. provide cryptographically secure byte, opaque-token, and identifier
   generation through Node built-ins;
4. provide structured JSON logging that redacts secret-bearing keys,
   raw email, credentials, tokens, private payloads, and configured
   secret values;
5. compose those objects behind one explicit bootstrap factory for
   later M3 stages.

This step creates foundations only. It does not make the compatibility
frontend or backend authenticated.

---

# Part 2 - Exact Source Scope

Add:

```text
src/config/loadSecurityConfig.js
src/bootstrap/createSecurityFoundations.js
src/infrastructure/security/createSystemClock.js
src/infrastructure/security/createSecureRandom.js
src/infrastructure/logging/createStructuredLogger.js
test/foundation/securityFoundations.test.js
```

No existing application source, dependency manifest, migration, schema,
route, repository, compatibility runtime, frontend file, Render
blueprint, or persisted data file is changed by this step.

---

# Part 3 - Security Configuration Contract

`loadSecurityConfig` is a pure parser over an explicitly supplied
environment object. It must:

* accept only `local`, `test`, `staging`, or `production` for
  `APP_ENV`;
* require the approved `NODE_ENV` pairing: `production` for staging and
  production, and a non-production value for local and test;
* validate an approved structured `LOG_LEVEL`;
* require a non-placeholder `APP_BUILD_ID` for staging and production;
* require separate non-placeholder `RATE_LIMIT_KEY_SECRET` and
  `AUDIT_METADATA_SECRET` values for staging and production;
* reject identical rate-limit and audit secrets;
* reject empty, whitespace-altered, too-short, or obvious placeholder
  secret values;
* permit local and test construction without deployed secrets while
  preserving explicit absence;
* return deeply frozen configuration;
* expose stable initial key-version metadata without exposing secrets
  through errors or serialization.

The parser must never read or mutate global `process.env` implicitly.
Later startup work will decide when this target configuration replaces
remaining compatibility configuration.

---

# Part 4 - Clock and Randomness Contracts

The clock must:

* return safe-integer UTC milliseconds;
* derive ISO UTC timestamps from the same sampled millisecond;
* accept an injected time source for deterministic tests;
* fail closed for invalid time values;
* expose an immutable interface.

The secure-random adapter must:

* use Node `crypto.randomBytes` for bytes and opaque tokens;
* use Node `crypto.randomUUID` for stable record identifiers;
* encode tokens as canonical unpadded base64url;
* require positive bounded byte lengths;
* verify injected providers return exactly the requested byte count;
* expose an immutable interface;
* never use `Math.random` or invent a cryptographic primitive.

This step does not issue or persist session, CSRF, or account-action
tokens.

---

# Part 5 - Structured Logging Contract

The logger must emit one JSON object per line with:

* UTC timestamp from the injected clock;
* severity;
* safe event name;
* environment;
* backend build ID;
* approved bounded context fields.

It must recursively redact or omit:

* `Cookie`, `Set-Cookie`, and `Authorization`;
* passwords, confirmations, and password hashes;
* session, CSRF, verification, setup, reset, and reactivation tokens;
* raw email addresses;
* secret or credential fields and configured secret values;
* active bid values;
* unrestricted request or response bodies;
* raw URLs, query strings, and fragments;
* circular or unsupported values that cannot be safely serialized.

Redaction must not mutate caller-owned values. Error records may retain
safe name, code, message, and redacted stack information. Invalid event
names or context shapes fail closed before output.

This step does not replace compatibility `console` calls. Later M3
feature code must use this logger, and any compatibility conversion
requires a separately scoped plan.

---

# Part 6 - Bootstrap Boundary

`createSecurityFoundations` must:

1. validate explicitly supplied environment input;
2. create or accept injected clock and secure-random providers;
3. create a structured logger using safe configuration metadata and the
   configured secrets as redaction values;
4. return a deeply frozen object;
5. avoid filesystem, database, network, email, listener, and global
   environment side effects.

The compatibility runtime and production entrypoint remain unchanged.

---

# Part 7 - Tests

Focused tests must cover:

* every environment and `NODE_ENV` pairing;
* missing, malformed, placeholder, whitespace-altered, short, reused,
  and valid deployed secrets without echoing secret values;
* deeply frozen configuration and explicit local/test secret absence;
* deterministic clock sampling and invalid clock output;
* exact secure-random byte lengths, base64url encoding, UUID creation,
  provider failure, and invalid sizes;
* structured log level filtering and required envelope fields;
* recursive secret-shaped key redaction;
* configured-secret substring redaction;
* raw email, URL, query, body, token, credential, hash, and active-bid
  leakage prevention;
* error and circular-value handling;
* input immutability;
* bootstrap composition with no global `process.env`, filesystem,
  database, listener, or network use.

Existing characterization and database-foundation tests must remain
green.

---

# Part 8 - Verification

Run under the approved Node 24.14.1 runtime:

```powershell
node --test test/foundation/securityFoundations.test.js
node --test "test/foundation/*.test.js"
npm.cmd test
npm.cmd run check
git diff --check
```

Also verify:

* no new dependency or lockfile change;
* no `Math.random` in the secure-random foundation;
* no new global `process.env` read outside approved configuration
  boundaries;
* representative passwords, raw emails, tokens, headers, configured
  secrets, bid values, bodies, and URLs do not appear in captured logs
  or thrown error messages;
* all five protected JSON hashes remain unchanged;
* no SQLite database, sidecar, log, token, secret, or other runtime
  artifact remains in the repository;
* frontend status and content remain unchanged by M3-02.

---

# Part 9 - Stop Conditions

Stop and preserve evidence if:

* an approved document conflicts on secret, time, randomness, or logging
  behavior;
* validation would require revealing or copying a real secret;
* a test or implementation writes outside its unique temporary root;
* a protected data hash changes;
* an existing behavior changes outside this exact scope;
* a dependency becomes necessary;
* deployment or production access becomes necessary.

---

# Part 10 - Completion Boundary

M3-02 completes only when its focused, cumulative foundation, complete
backend, syntax, whitespace, status, no-artifact, no-leak, and
protected-hash gates pass and exact evidence is recorded.

Completion does not claim that accounts, credentials, sessions, action
tokens, CSRF, rate limits, Security Audit, authorization, league
isolation, or authenticated Socket.IO exist.

After M3-02, the next proposed work item is:

```text
M3-03 - User and Credential Repositories with Scrypt Password Storage
```

M3-03 must receive its own exact active plan.

---

# Part 11 - Completion Evidence

M3-02 completed locally on 2026-07-19 on backend branch `staging`.

Added:

```text
src/config/loadSecurityConfig.js
src/bootstrap/createSecurityFoundations.js
src/infrastructure/security/createSystemClock.js
src/infrastructure/security/createSecureRandom.js
src/infrastructure/logging/createStructuredLogger.js
test/foundation/securityFoundations.test.js
```

Verification evidence:

* the focused M3-02 suite passed `15/15` tests across `5` suites;
* the cumulative foundation suite passed `104/104` tests across `19`
  suites;
* the complete backend suite passed `276/276` tests across `60` suites
  under exact Node `24.14.1`;
* `npm.cmd run check` and backend and frontend `git diff --check`
  passed;
* the M3-02 source contains no `Math.random` and no global
  `process.env` read;
* representative password, email, header, URL, request-body, token,
  configured-secret, credential, error, and active-bid values were
  absent from captured structured logs;
* no dependency or lockfile changed; backend `package-lock.json`
  retained SHA-256
  `F1EC83DBB0841B3598353D061A014D5D37D4530FD07232EA8EA2F1AD3401F067`;
* no SQLite database, sidecar, log, token, secret, or other runtime
  artifact remained in the repository;
* all five protected backend JSON hashes remained unchanged;
* frontend `package-lock.json` and the preserved
  `TeamToolsPanel.jsx` edit retained their prior exact hashes;
* no compatibility runtime, route, schema, application authority,
  deployment, staging service, or production state changed.

M3-02 is complete. Accounts, credentials, sessions, account-action
tokens, CSRF, rate limits, Security Audit, authorization, league
isolation, and authenticated Socket.IO remain unimplemented.
