# M3-21 - Provider-Backed Account Email and Required Notifications

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Approved Boundary

M3-21 connected the existing durable account-email outbox to a validated,
production-capable Resend adapter without creating a provider account,
configuring DNS, sending a real email, or enabling the target runtime in
shared staging or production.

The completed boundary:

1. selects Resend for transactional account email because its HTTPS API
   supports send-only keys, provider idempotency keys, explicit error classes,
   and non-delivering test recipients;
2. permits only capture or disabled mode in local/test, capture or sandbox in
   staging, and send in production;
3. keeps `RESEND_API_KEY` non-enumerable, separately scoped, environment-local,
   and inside the structured logger's redaction boundary;
4. renders verification, administrator setup, password reset, reactivation,
   and all six implemented security-notification messages in plain text and
   dependency-free HTML;
5. sends the stable outbox event ID as `Idempotency-Key` and classifies network,
   timeout, rate-limit, concurrent-idempotency, provider, and terminal errors;
6. forces staging sandbox provider requests to `delivered@resend.dev` instead
   of the account address;
7. composes capture/provider delivery behind the existing encrypted-envelope
   outbox service; and
8. adds an explicit recover, bounded batch, non-overlap, unreferenced timer,
   safe failure, and awaited shutdown lifecycle that remains stopped by
   default.

Official provider references reviewed for the selection:

* [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
* [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
* [Resend errors](https://www.resend.com/docs/api-reference/errors)
* [Resend send-only API-key permission](https://resend.com/docs/api-reference/api-keys/create-api-key)
* [Resend test recipients](https://resend.com/docs/dashboard/emails/send-test-emails)

## Files Changed

### Configuration and redaction

* `src/config/loadSecurityConfig.js`
* `src/bootstrap/createSecurityFoundations.js`
* focused configuration fixtures and tests

### Provider, rendering, and adapter selection

* `src/infrastructure/email/renderAccountEmail.js`
* `src/infrastructure/email/createResendEmailAdapter.js`
* `src/infrastructure/email/createConfiguredAccountEmailAdapter.js`
* `src/infrastructure/email/createCaptureEmailAdapter.js`

### Durable delivery lifecycle and target composition

* `src/application/services/accounts/createAccountEmailDeliveryJob.js`
* `src/bootstrap/createTargetRuntime.js`
* `src/bootstrap/createTargetHttpServer.js`
* `test/foundation/accountEmailProviderFoundation.test.js`
* `test/foundation/targetRuntimeFoundation.test.js`

### Canonical configuration and security contracts

* `docs/04-technical-specs/SECURITY.md`
* `docs/04-technical-specs/ENVIRONMENT_SETUP.md`

## Verification Evidence

All Node verification used Node `24.14.1`.

```text
Focused provider/rendering/job foundation: 12/12 passed
Provider/configuration/target-runtime slice: 50/50 passed
Complete backend suite: 546/546 passed across 136 suites
Frontend regression: 57/57 passed
Frontend lint: passed
Frontend production build: passed
Repository JavaScript syntax: 236/236 parsed
Backend and frontend diff checks: passed
Production target mount markers: 0
Generated SQLite/database artifacts: 0
Actual private-key/provider-token markers in runtime source: 0
```

The apparent provider-token static match was inspected and proved to be the
existing non-secret status string `pre_cutover_backup_verified`.

Protected backend package, migration, and compatibility JSON hashes remained
byte-for-byte equal to the M3-20 gate values.

## Safety Result

No live provider request occurred. No API key, provider account, sending
domain, DNS record, email recipient, shared database, deployment, production
mount, commit, or push was created or changed. The existing compatibility
runtime remains authoritative in production.
