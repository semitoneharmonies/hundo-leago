# M3-08 - Sign-In, Sign-Out, Password Lifecycle, Deactivation, and Reactivation

## Status

`COMPLETE`

Completed locally on 2026-07-20. No runtime mount, external email,
deployment, commit, push, merge, or production action occurred.

## Work Plan ID

```text
M3-08
```

## Active Step

```text
Sign-In, Sign-Out, Password Lifecycle, Deactivation, and Reactivation
```

Grae authorized continuous technical and documentation work through
Milestone M3 unless an important application behavior decision is not
settled by the approved documents. M3-07 is complete. M3-08 proceeds under
User Accounts, Security, API Contracts, Data Model, and this plan.

---

# Part 1 - Intended Outcome

M3-08 adds the remaining approved self-service account lifecycle:

1. backend password sign-in with one active opaque session;
2. authenticated session bootstrap and explicit sign-out;
3. current-password-verified password change followed by sign-out;
4. generic password-reset request and single-use 30-minute completion;
5. authenticated confirmed self-deactivation;
6. generic reactivation request and single-use 30-minute reactivation
   requiring the current password;
7. required Security Audit and provider-independent notification outbox
   records;
8. exact Origin, JSON, CSRF, cookie, generic-response, and durable-rate-limit
   behavior for every endpoint.

Password reset and password change revoke all sessions and require normal
sign-in afterward. Reactivation creates no session and restores no league
membership, role, or team assignment.

---

# Part 2 - Exact Endpoint Scope

The isolated target router implements:

* `POST /api/v1/session`;
* `GET /api/v1/session`;
* `DELETE /api/v1/session`;
* `POST /api/v1/session/password`;
* `POST /api/v1/password-reset-requests`;
* `POST /api/v1/password-resets`;
* `POST /api/v1/account/deactivation`;
* `POST /api/v1/account/reactivation-requests`;
* `POST /api/v1/account/reactivations`.

Public request and completion flows use generic responses and the approved
M3-06 durable rate limits. Authenticated unsafe flows require the M3-05
session-derived CSRF token and exact Origin boundary.

---

# Part 3 - Implementation Scope

Expected contained source work includes:

* a credential-authentication service with bounded dummy `scrypt` for an
  unknown or ineligible account;
* atomic sign-in session replacement, Security Audit, and replacement
  notification outbox work;
* repository support for revoking the one active session and invalidating
  active action tokens within larger transactions;
* password change and reset services using the existing credential
  replacement boundary;
* deactivation and reactivation services using optimistic user status
  transitions;
* purpose-general encrypted action-link outbox payloads for password reset
  and reactivation;
* provider-independent capture notifications for approved request and
  completion events;
* an isolated lifecycle router composed from the existing request-security,
  rate-limit, cookie, session, and audit foundations;
* focused temporary-SQLite and loopback-HTTP tests.

Exact paths are selected one contained slice at a time after inspecting the
existing specialized repositories. No schema or package change is planned.

---

# Part 4 - Product Rules

* Sign-in accepts verified-email login only and returns one generic failure
  for unknown email, wrong password, and ineligible status.
* Failed sign-in creates no session and does not revoke an existing session.
* Successful sign-in replaces the earlier session atomically.
* Password change requires the current password, matching new password,
  and a new password different from the current password.
* Password reset request never reveals account existence; completion does
  not sign the user in.
* Deactivation requires the authenticated user's current password and an
  explicit confirmation, preserves attribution, and revokes the session.
* Reactivation requires its one-time link plus the current password, creates
  no session, and restores no authority.
* Passwords, raw action tokens, raw session tokens, CSRF tokens, and
  encryption keys never enter SQLite plaintext, logs, public errors,
  Security Audit, League Activity, or ordinary response bodies.

---

# Part 5 - Safety Boundary

M3-08 uses only fresh temporary SQLite databases and synthetic addresses in
tests. The initial migration, package lockfile, repository JSON, staging and
production data, and sibling frontend source remain unchanged.

No provider selection, provider credential, external email, runtime mount,
deployment, commit, push, merge, production write, first-administrator
bootstrap, league authority, or frontend implementation is authorized by
this step.

---

# Part 6 - Verification

Focused verification must prove:

1. generic constant-work sign-in failures and durable network/account rate
   limits;
2. successful atomic session replacement, cookie transport, audit, and
   notification outbox behavior;
3. read-only session bootstrap and authoritative sign-out;
4. password-change current-password check, difference rule, atomic
   credential replacement, session revocation, audit, notification, and
   rollback;
5. reset and reactivation token replacement, encrypted delivery, expiry,
   wrong-purpose, replay, concurrent single winner, and terminal clearing;
6. deactivation confirmation, status transition, session revocation,
   preserved historical relationships, and rollback;
7. reactivation without session or restored authority;
8. exact Origin, JSON, Fetch Metadata, CSRF, CORS, request ID, target
   envelope, cookie-clear, and safe-error behavior;
9. Security Audit remains separate from League Activity;
10. no runtime registration, external call, artifact, schema change,
    protected-hash change, or compatibility-route inventory change.

Run the focused M3-08 suites, combined M3 account/security suites,
cumulative foundation suite, complete backend suite, static architecture
checks, runtime-isolation scans, artifact scans, and protected-hash checks
under Node `24.14.1`.

---

# Part 7 - Completion Boundary

M3-08 is complete only when every verification above passes and evidence is
archived. Completion does not authorize runtime mounting or the next
platform-administration and multi-league step.

Detailed M3-07 evidence is archived at:

`docs/06-work-plans/archive/M3-07_SELF_SERVICE_ACCOUNT_CREATION_EMAIL_VERIFICATION_AND_ENCRYPTED_DELIVERY.md`

---

# Completion Evidence

M3-08 added credential authentication, sign-in, sign-out, read-only
session bootstrap, password change, password reset, self-deactivation,
and self-reactivation behind an isolated target router. It generalized the
encrypted action-link outbox for password-reset and reactivation links and
added provider-independent security notifications. All state transitions
are transactional; replay, expiry, rollback, concurrency, generic public
responses, session revocation, and no-authority-restoration behavior are
covered by temporary-SQLite and loopback-HTTP tests.

Final Node `24.14.1` evidence:

```text
Focused M3-08 plus adjacent regression: 50/50 tests, 14/14 suites
Combined M3 account/security:          116/116 tests, 32/32 suites
Cumulative foundation:                 205/205 tests, 46/46 suites
Complete backend:                      378/378 tests, 87/87 suites
```

Additional gates passed:

* syntax checks for all 43 new M3 source files;
* exact 34-route compatibility inventory preservation;
* no target account-router runtime import or registration;
* no database, SQLite sidecar, temporary, backup, or migration artifact;
* unchanged initial migration, package lockfile, and protected JSON;
* Security Audit remains separate from League Activity;
* no schema, package, provider, deployment, or sibling frontend source
  change.

Protected hashes:

```text
package-lock.json
F1EC83DBB0841B3598353D061A014D5D37D4530FD07232EA8EA2F1AD3401F067

database/migrations/0001_initial.sql
344D2E896A7E33481389DB6856674F8BBBFBE6A207BFB4D3A8878CB06DBE01B5

league-state.json
FE8017B2C0FA8244EFDBD8836CBD0DD023216CF5E4392DD0AA46C7EC66741024

players.json
C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1

league.json
D1ECA60BD28BAF13EF964DC2E0066D62D53C4D8A1F2364E022C3D7F2F8239148

league_dump.json
CF0579B71E977FC7BC8B5C34A691FAEDFB2CDD2C46A4F7DF7835A3449325E607

league_with_meta.json
1B11A2ABECF7088AF82818924CC7D54B5E9E0C809961F0C11B91E3BC2872C343
```

The target routers remain unmounted. Runtime composition, provider-backed
email, frontend integration, deployment, and production activation remain
later separately gated work.
