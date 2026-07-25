# Hundo Leago - Active Work Plan

## Document Status

`COMPLETE`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-09
```

## Active Step

```text
One-Time First-Platform-Administrator Bootstrap and Credential Setup
```

Grae authorized continuous technical and documentation work through
Milestone M3 unless an important application behavior decision is not
settled by the approved documents. M3-09 was completed under User Accounts,
Permissions, Security, Data Model, API Contracts, and this plan.

---

# Part 1 - Intended Outcome

M3-09 adds the approved one-time first-platform-administrator bootstrap:

1. an explicit local or Render administrative command, never a public
   bootstrap endpoint;
2. safe protected input for the initial administrator's email and display
   name, with no password accepted on the command line;
3. an atomic pending-credential-setup user, active platform-administrator
   role, 72-hour digest-only setup token, Security Audit event, and
   encrypted delivery outbox record;
4. permanent refusal once any active or ended platform-administrator role
   exists;
5. public single-use credential setup that creates the password, activates
   the account, clears the encrypted setup payload, and requires normal
   sign-in afterward;
6. safe command and HTTP results that expose no password, credential hash,
   token digest, raw token, encryption key, or database contents.

The bootstrap grants platform-administrator authority only. It creates no
league, membership, commissioner role, team, or manager assignment.

---

# Part 2 - Exact Interface Scope

The contained implementation adds:

* `scripts/bootstrap-first-platform-administrator.js`;
* protected environment input for email and display name;
* explicit database-path and environment-confirmation command arguments;
* `POST /api/v1/accounts/credential-setups` on the isolated public account
  router for password selection from the one-time setup link;
* provider-independent delivery through the existing encrypted outbox and
  capture adapter.

The script requires exact environment confirmation. Production requires an
exact production confirmation value in addition to the explicit production
environment and database path. Plaintext passwords and raw setup tokens are
never command-line arguments or console output.

---

# Part 3 - Implementation Scope

Expected contained source work includes:

* a specialized SQLite platform-role repository with safe count and insert
  operations;
* an atomic first-administrator bootstrap service;
* administrator-setup support in the encrypted account-email outbox and
  delivery service;
* a credential-setup completion service using the existing password,
  credential, user-status, token-consumption, audit, and payload-clearing
  boundaries;
* a narrow CLI composition that validates arguments before opening the
  explicit database and prints only safe completion metadata;
* a forward-only `0002` migration that rebuilds only the `users` table
  constraint to add the documented `pending_credential_setup` status while
  preserving every existing row, index, foreign-key relationship, and the
  immutable `0001` migration;
* focused temporary-SQLite, child-process, encrypted-delivery, concurrency,
  upgrade-preservation, and loopback-HTTP tests.

No package change is planned. The approved initial schema already contains
the required account tables, but its `users.status` constraint omitted the
distinct administrator-created pending state required by User Accounts.
Applied migration `0001` remains byte-for-byte immutable; the correction
uses the migration mechanism approved by SQLite Migration.

---

# Part 4 - Product and Security Rules

* The initial platform administrator is Grae.
* The command refuses if any platform-administrator role record already
  exists, including an ended record.
* The initial account begins in `pending_credential_setup` and has no active
  credential or session.
* The 72-hour raw setup token exists only in the encrypted delivery envelope
  and non-enumerable in-process delivery result.
* The one-time bootstrap issues exactly one setup token and permanently
  self-refuses after success. Authenticated resend and replacement for
  administrator-created accounts belongs to the later administrator account
  workflow and must invalidate and clear the earlier encrypted payload.
* Credential setup requires matching new-password fields and consumes the
  token atomically with credential insertion and account activation.
* Credential setup creates no session; Grae signs in normally afterward.
* Actor type `system_bootstrap`, target user, creation method, timestamp, and
  result are recorded in Security Audit, never League Activity.
* Failed, expired, malformed, replayed, unknown, or wrong-purpose setup
  tokens produce the same public failure and change no account state.

---

# Part 5 - Safety Boundary

Development and tests use only fresh temporary SQLite databases and
synthetic addresses. The bootstrap command is tested against temporary
paths only and is not run against local staging, Render staging, or
production data during this step.

The initial migration, package lockfile, repository JSON, sibling frontend
source, deployed services, and production state remain unchanged. Migration
`0002` is exercised only against fresh temporary databases and copied
synthetic pre-`0002` databases in this step. No
provider selection, credential, external email, runtime mount, deployment,
commit, push, merge, league authority, or later administrator workflow is
authorized by this step.

---

# Part 6 - Verification

Focused verification must prove:

1. exact safe CLI arguments, protected input, and environment confirmation;
2. refusal before mutation when any administrator role already exists;
3. one concurrent winner and complete rollback on every failed atomic
   bootstrap dependency;
4. pending user, active role, digest-only 72-hour token, system-bootstrap
   audit, and encrypted outbox state with no credential or session;
5. encrypted fragment-only setup-link delivery, idempotency, retry, expiry,
   and terminal ciphertext clearing;
6. exact password policy, single-use completion, account activation, no
   automatic session, and normal sign-in afterward;
7. generic invalid, expired, replayed, malformed, unknown, and wrong-purpose
   completion behavior;
8. no membership, commissioner, team, manager, or League Activity write;
9. safe stdout, stderr, logs, public errors, SQLite rows, and serialized
   results;
10. forward upgrade preserves every existing row and foreign-key
    relationship, rejects unsupported status values, and leaves `0001`
    unchanged;
11. no runtime registration, external call, repository artifact,
    protected-hash change, or compatibility-route inventory change.

Run the focused M3-09 suite, combined M3 account/security suites, cumulative
foundation suite, complete backend suite, static architecture checks,
runtime-isolation scans, artifact scans, and protected-hash checks under
Node `24.14.1`.

---

# Part 7 - Completion Boundary

M3-09 is complete only when every verification above passes and evidence is
archived. Completion does not authorize runtime mounting, provider-backed
email, deployment, or the next administrative league and multi-league step.

---

# Part 8 - Completion Evidence

M3-09 completed locally on 2026-07-20.

Implemented behavior includes:

* a one-time protected first-platform-administrator command with exact
  environment and production confirmation boundaries;
* atomic creation of the pending identity, active platform role, digest-only
  72-hour action token, encrypted delivery record, and Security Audit event;
* permanent refusal after any active or ended platform-administrator role;
* encrypted fragment-only credential-setup delivery and one-time completion;
* password creation, account activation, completion notification, and normal
  sign-in afterward without automatic session creation;
* migration `0002`, which adds only the approved pending-credential-setup user
  status while preserving existing rows and leaving migration `0001`
  byte-for-byte unchanged;
* safe rollback, replay, expiry, concurrency, wrong-purpose, validation,
  command-output, and isolated HTTP behavior.

Verification completed under Node `24.14.1`:

* `14/14` focused M3-09 migration and bootstrap tests passed;
* `130/130` combined M3 account, security, migration, and bootstrap tests
  passed;
* `219/219` cumulative foundation tests passed;
* `392/392` complete backend tests passed;
* all `178` JavaScript source, script, and test files passed syntax checks;
* the exact compatibility route inventory remained `34` total routes;
* runtime-isolation, secret-output, whitespace, and artifact checks passed;
* no database, WAL, SQLite, temporary, or backup artifact remained;
* package-lock, immutable migration `0001`, and every protected JSON hash
  remained unchanged.

The schema-version compatibility assertions in JSON import, repository,
independent staging verification, and cutover rehearsal were advanced from
data-model version 1 to version 2. Application compatibility remains version
1. Every affected M2 suite passed after that forward-version update.

No target account router, administrator command, or SQLite authority was
mounted in the compatibility runtime. No local staging, Render staging,
production data, external email, deployment, commit, push, or merge occurred.

Detailed M3-08 evidence is archived at:

`docs/06-work-plans/archive/M3-08_SIGN_IN_SIGN_OUT_PASSWORD_LIFECYCLE_DEACTIVATION_AND_REACTIVATION.md`
