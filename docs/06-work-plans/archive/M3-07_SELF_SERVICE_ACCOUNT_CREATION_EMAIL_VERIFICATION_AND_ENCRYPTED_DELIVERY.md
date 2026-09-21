# M3-07 - Self-Service Account Creation, Email Verification, and Encrypted Delivery

## Status

`COMPLETE`

Completed locally on 2026-07-20. No runtime mount, external email,
deployment, commit, push, merge, or production action occurred.

---

# Outcome

M3-07 implemented the approved self-service account boundary:

* exact email and display-name normalization and validation;
* matching-password validation through the existing password policy;
* atomic pending user, active credential, 24-hour token digest, Security
  Audit, and encrypted outbox creation;
* identical public acceptance for a new registration and a duplicate email
  or display name;
* AES-256-GCM delivery envelopes under the dedicated versioned
  `ACTION_TOKEN_DELIVERY_KEY`;
* associated-data binding to outbox event, user, token, purpose, canonical
  frontend origin, envelope version, and key version;
* post-commit provider-independent capture delivery with idempotency,
  bounded retry, interrupted-claim recovery, expiry handling, and terminal
  ciphertext clearing;
* generic verification resend that replaces the token and clears the old
  encrypted outbox payload;
* atomic single-use verification, pending-to-active transition, initial
  opaque session, Security Audit, and pending-envelope clearing;
* isolated target HTTP contracts for registration, verification, and
  resend with exact Origin, JSON, Fetch Metadata, credentialed CORS,
  security headers, durable-rate-limit seams, request IDs, target
  envelopes, and the secure session cookie.

Registration creates no league, membership, role, team, commissioner, or
platform-administrator authority. Security Audit remains separate from
League Activity.

---

# Files

Changed:

* `src/config/loadSecurityConfig.js`
* `src/bootstrap/createSecurityFoundations.js`
* `src/application/services/accounts/createAccountActionTokenService.js`
* `src/transport/http/createTargetRequestSecurity.js`
* `test/foundation/securityFoundations.test.js`

Added:

* `src/domain/accounts/accountRegistrationPolicy.js`
* `src/infrastructure/security/createActionTokenDeliveryEnvelope.js`
* `src/infrastructure/persistence/sqlite/SqliteOutboxEventRepository.js`
* `src/infrastructure/email/createCaptureEmailAdapter.js`
* `src/application/services/accounts/createSelfServiceAccountService.js`
* `src/application/services/accounts/createEmailVerificationService.js`
* `src/application/services/accounts/createEmailVerificationRequestService.js`
* `src/application/services/accounts/createAccountEmailDeliveryService.js`
* `src/transport/http/createAccountRegistrationRouter.js`
* `test/foundation/actionTokenDeliveryEnvelopeFoundation.test.js`
* `test/foundation/accountRegistrationFoundation.test.js`

Canonical technical and environment specifications were amended before
implementation to record Grae's approved encrypted-envelope decision.

---

# Verification

The host default Node `24.11.1` correctly failed the repository's pinned
runtime assertion. The final gates used the required Node `24.14.1`
runtime through the cached `node@24.14.1` executable.

```text
Focused M3-07:             18/18 tests, 6/6 suites
Combined M3 account/security:
                           80/80 tests, 26/26 suites
Cumulative foundation:  169/169 tests, 40/40 suites
Complete backend:       342/342 tests, 81/81 suites
```

Additional gates passed:

* syntax checks for every affected source and test file;
* pure-domain and directional architecture checks;
* exact 34-route compatibility inventory preservation;
* no M3-07 runtime import or route registration;
* no trailing whitespace;
* no database, key, environment, migration-report, or source-bundle
  artifact in the repository;
* no external email or network call from the implemented adapter;
* unchanged initial migration and package lockfile;
* unchanged protected backend JSON and protected sibling frontend files.

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

---

# Preserved Boundary

The M3-07 router and capture adapter remain isolated. Real provider
selection, provider credentials, runtime route mounting, frontend account
pages, deployment, and production authority remain later explicitly gated
work.
