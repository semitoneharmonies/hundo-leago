# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

Completed: `2026-07-19`

## Work Plan ID

```text
M3-03
```

## Active Step

```text
User and Credential Repositories with Scrypt Password Storage
```

Grae authorized continuous technical and documentation work through
Milestone M3 on 2026-07-19. This plan activates one small verified step.
It does not authorize HTTP account flows, sessions, deployment,
production changes, SQLite application authority, or later M3 work
without its own exact active plan.

---

# Part 1 - Objective

Build the account-storage and password foundation against the existing
M2 SQLite schema:

1. enforce the exact approved password-input and confirmation rules;
2. encode and verify versioned asynchronous Node `scrypt` hashes;
3. bound expensive scrypt concurrency and queueing;
4. add a safe user repository that never selects credential hashes;
5. add a separate credential repository with one-active-credential and
   atomic replacement behavior;
6. add a test-only helper that creates a user and credential atomically
   without granting any league or platform authority.

This step adds no browser or HTTP authentication behavior.

---

# Part 2 - Exact Source Scope

Add:

```text
src/domain/accounts/passwordPolicy.js
src/infrastructure/security/createScryptPasswordHasher.js
src/infrastructure/persistence/sqlite/SqliteUserRepository.js
src/infrastructure/persistence/sqlite/SqliteCredentialRepository.js
test/helpers/createTestAccount.js
test/foundation/userCredentialFoundation.test.js
```

No existing source, migration, schema, repository catalog, package
manifest, lockfile, compatibility route, frontend file, Render
blueprint, or persisted data file is changed by this step.

---

# Part 3 - Password Policy

`passwordPolicy.js` must:

* accept only a JavaScript string;
* preserve the exact submitted value;
* perform no trimming, case folding, or Unicode normalization;
* count Unicode code points, not UTF-16 code units;
* require at least `6` and at most `256` code points;
* require at most `1024` UTF-8 bytes;
* allow spaces and Unicode;
* add no composition or compromised-password-list rule;
* compare required confirmation exactly;
* return safe reason codes without including the password.

Password-policy failures must not log or serialize submitted values.

---

# Part 4 - Scrypt Contract

`createScryptPasswordHasher.js` must use Node built-ins only:

```text
algorithm: scrypt
version:   1
N:         131072
r:         8
p:         1
salt:      16 random bytes
key:       32 derived bytes
maxmem:    268435456 bytes
```

The canonical stored form is:

```text
scrypt$v=1$N=131072,r=8,p=1$<base64url-salt>$<base64url-key>
```

The implementation must:

* obtain every new salt from the injected M3-02 secure-random adapter;
* use asynchronous `crypto.scrypt`;
* parse the encoding strictly and reject unknown algorithms, versions,
  duplicate, missing, reordered, or out-of-bounds parameters;
* require canonical unpadded base64url and exact salt/key lengths;
* compare equal-length derived keys with `crypto.timingSafeEqual`;
* return only safe verification state;
* never expose raw passwords, derived keys, or encoded hashes in errors
  or logs;
* create a fresh salt for every hash and replacement;
* use no application pepper.

At most `2` scrypt operations run concurrently and at most `8` wait in
FIFO order. A full queue fails with a typed generic retryable error, and
every success or failure releases capacity.

Unknown-user dummy verification belongs to the later sign-in service,
where account eligibility and public non-enumeration are composed. No
sign-in claim is made here.

---

# Part 5 - User Repository

`SqliteUserRepository.js` must:

* accept only an opened, migrated SQLite database;
* use prepared statements and the approved generic record repository;
* expose lookup by stable user ID, normalized email, and normalized
  display name;
* require lookup values already be canonical rather than silently
  normalizing them;
* insert schema-shaped user rows;
* expose optimistic versioned updates through the approved boundary;
* select only `users` columns;
* never join or select `user_credentials.password_hash`;
* return null for a missing record and safe mapped repository errors
  for invalid or constrained writes;
* expose no unscoped delete or raw SQL handle.

Public email/display-name validation and normalization remain part of a
later account-creation service.

---

# Part 6 - Credential Repository

`SqliteCredentialRepository.js` is the sensitive storage boundary. It
must:

* accept only an opened, migrated SQLite database;
* look up one credential by stable credential ID;
* look up only the active credential for an explicit stable user ID;
* insert a schema-shaped active credential;
* expose no list-all method;
* replace an active credential in one immediate SQLite transaction;
* mark the prior row `replaced`, set `replaced_at_ms`, increment its
  optimistic version once, and insert the new active row;
* roll back both changes if either write fails;
* preserve the database unique constraint of one active credential per
  user;
* return encoded hashes only to the explicit credential boundary;
* never log, render, or attach hashes to errors.

Session revocation is not present yet and therefore is not part of this
replacement operation.

---

# Part 7 - Test-Only Account Helper

`test/helpers/createTestAccount.js` must:

1. require explicit temporary-database repositories, clock, secure
   randomness, and password hasher;
2. validate and hash the supplied synthetic password before opening the
   SQLite transaction;
3. generate stable UUIDs through the secure-random adapter;
4. insert the user and active credential in one immediate transaction;
5. create no session, token, platform role, league, membership, team,
   event, or notification;
6. roll back the user if credential insertion fails;
7. remain below `test/` and never be imported by shipped application
   code.

It is not an administrator bootstrap and cannot operate against
production.

---

# Part 8 - Tests

Focused tests must cover:

* minimum, maximum, Unicode-code-point, UTF-8-byte, space, no-trim,
  no-normalization, and exact-confirmation password behavior;
* canonical encoding and strict parser rejection for algorithm,
  version, parameter, base64url, salt-length, and key-length defects;
* a real asynchronous Node `scrypt` hash and success/failure
  verification;
* fresh salts and no plaintext or derived-key leakage;
* timing-safe comparison through an injected observation seam;
* two-running/eight-waiting FIFO capacity, overflow, and recovery after
  derivation failure;
* user lookup, insertion, uniqueness, optimistic update, and
  credential-hash separation;
* active-credential lookup, one-active constraint, replacement, stale
  version, and rollback;
* atomic test-account creation and deliberate credential failure;
* zero accidental role, league, membership, team, session, token,
  audit, or notification rows;
* temporary-database cleanup and protected-data preservation.

Existing characterization, migration, and security-foundation tests
must remain green.

---

# Part 9 - Verification

Run under exact Node 24.14.1:

```powershell
node --test test/foundation/userCredentialFoundation.test.js
node --test test/foundation/securityFoundations.test.js test/foundation/userCredentialFoundation.test.js
node --test "test/foundation/*.test.js"
npm.cmd test
npm.cmd run check
git diff --check
```

Also verify:

* no dependency or lockfile change;
* no schema or migration checksum change;
* shipped source never imports the test-only account helper;
* no plaintext password, derived key, encoded hash, or SQLite path
  appears in captured logs, public-shaped output, or safe errors;
* all SQLite tests use unique operating-system temporary roots;
* all five protected JSON hashes remain unchanged;
* no repository SQLite database, sidecar, log, or credential artifact
  remains;
* frontend source and dependency hashes remain unchanged.

---

# Part 10 - Stop Conditions

Stop and preserve evidence if:

* approved documents conflict on password, user, credential, or schema
  behavior;
* the existing schema cannot satisfy the approved repository boundary;
* a new dependency or migration appears necessary;
* a test needs a real account, password, secret, or production artifact;
* a database or protected-data artifact is written outside its unique
  temporary root;
* an existing compatibility behavior changes;
* deployment or production access becomes necessary.

---

# Part 11 - Completion Boundary

M3-03 completes only when focused, combined security, cumulative
foundation, complete backend, syntax, whitespace, status, no-leak,
no-artifact, schema-integrity, and protected-hash gates pass and exact
evidence is recorded.

Completion does not claim that account-action tokens, sessions, CSRF,
HTTP account flows, rate limits, Security Audit, email, authorization,
league isolation, or authenticated Socket.IO exist.

After M3-03, the next proposed work item is:

```text
M3-04 - Opaque Session Repository, Lifecycle, and Cookie Foundation
```

M3-04 must receive its own exact active plan.

---

# Part 12 - Completion Evidence

M3-03 completed locally on 2026-07-19 on backend branch `staging`.

Added:

```text
src/domain/accounts/passwordPolicy.js
src/infrastructure/security/createScryptPasswordHasher.js
src/infrastructure/persistence/sqlite/SqliteUserRepository.js
src/infrastructure/persistence/sqlite/SqliteCredentialRepository.js
test/helpers/createTestAccount.js
test/foundation/userCredentialFoundation.test.js
```

Verification evidence:

* the focused M3-03 suite passed `15/15` tests across `5` suites;
* the combined M3-02/M3-03 security suite passed `30/30` tests across
  `10` suites;
* the cumulative foundation suite passed `119/119` tests across `24`
  suites;
* the complete backend suite passed `292/292` tests across `65` suites
  under exact Node `24.14.1`;
* one real approved-cost Node `scrypt` hash and both successful and
  failed timing-safe verification passed;
* exact password input, strict encoding, fresh salt, FIFO capacity,
  queue overflow, and derivation-failure recovery tests passed;
* user lookups selected no credential field; one-active credential,
  optimistic version, replacement, and rollback tests passed;
* atomic test-account creation produced only one user and credential,
  and deliberate credential failure left no partial user;
* `npm.cmd run check`, backend and frontend `git diff --check`,
  test-helper import isolation, and no-logging scans passed;
* the existing migration and schema were unchanged; migration
  `0001_initial.sql` retained SHA-256
  `344D2E896A7E33481389DB6856674F8BBBFBE6A207BFB4D3A8878CB06DBE01B5`;
* no dependency or lockfile changed;
* no SQLite database, sidecar, log, credential, or other runtime
  artifact remained in the repository;
* all five protected backend JSON hashes and the two protected frontend
  hashes remained unchanged;
* no compatibility route, session, HTTP account flow, application
  authority, deployment, staging service, or production state changed.

M3-03 is complete. No account is yet reachable through an application
endpoint and no session or authorization claim exists.
