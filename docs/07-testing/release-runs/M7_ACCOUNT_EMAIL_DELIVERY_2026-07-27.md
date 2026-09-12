# M7-21 Isolated Account-Email Delivery Release Run

## Result

`PASS - STAGING ONLY`

## Date

`2026-07-27`

## Objective

Enable durable account-verification email delivery on staging without enabling
the general scheduler or any auction, trade, matchup, backup, fixture, or
league-outbox job.

## Safety Boundary

- The current operating mode is `OFFSEASON_RESET`.
- The change is limited to the isolated backend staging service and its
  existing exact recipient allowlist.
- `SCHEDULED_JOBS_ENABLED` remains `false`.
- Production, the production sender, database contents, fixture state, and
  league data are untouched.
- No provider key, recipient address, verification token, or other secret is
  recorded in this document.

## Backend Feature Commit

Commit:

```text
dfee0a0622e44a33b9e885c190ae9f53919a5b51
```

Files:

- `render.yaml`
- `src/application/services/operations/createRuntimeHealthService.js`
- `src/application/services/operations/createTargetScheduler.js`
- `src/bootstrap/openDeployedTargetRuntime.js`
- `src/config/loadTargetRuntimeConfig.js`
- `src/operations/release/createReleaseQaRuntime.js`
- `test/foundation/renderStagingBlueprint.test.js`
- `test/foundation/targetDeploymentRuntimeFoundation.test.js`
- `test/foundation/targetSchedulerFoundation.test.js`

## Implemented Behavior

1. `ACCOUNT_EMAIL_DELIVERY_ENABLED` is a required exact deployed-runtime
   boolean.
2. The durable account-email worker starts, recovers, and closes independently
   from the general league scheduler.
3. Email-only startup performs no auction, trade, matchup, league-outbox, or
   other league-job run and creates no league scheduler interval.
4. Existing disabled and maintenance-paused scheduler result shapes remain
   unchanged when email delivery is off.
5. Safe operations health reports only whether isolated account-email delivery
   is enabled.
6. The staging Blueprint enables the account-email worker while preserving
   `SCHEDULED_JOBS_ENABLED=false`.
7. Local release-QA runtime keeps account-email delivery disabled.

## Local Verification

Runtime:

```text
Node 24.14.1
```

Commands and results:

```text
Focused scheduler and deployment foundation tests
25/25 passed

npm run check
passed

npm test
985/985 passed across 234 suites

npm ls --all
passed

JavaScript syntax sweep
467 files passed

git diff --check
passed
```

Optional native dependencies reported by the dependency tree remained normal
optional packages and did not fail validation.

## Hosted Staging Acceptance

Final Render deploy:

```text
dep-d9jve7dbedkc738lrmpg
```

Deployed commit:

```text
dfee0a0
```

Acceptance evidence:

- the deploy reached `live`;
- public `/api/v1/health/live` returned `live`;
- public `/api/v1/health/ready` returned `ready`;
- the persisted staging sender uses the verified
  `notify.hundoleago.com` domain;
- `ACCOUNT_EMAIL_DELIVERY_ENABLED` is `true`;
- `SCHEDULED_JOBS_ENABLED` is `false`;
- a fresh exact-allowlist verification request returned HTTP `202` with
  `accepted=true`;
- Resend recorded the verification message as `delivered`; and
- the short-lived local recipient handoff file was removed after submission.

An earlier acceptance attempt exposed a stale placeholder sender still saved
in Render and Resend rejected that provider request as an unverified domain.
The sender and reply-to settings were corrected to the already verified
staging domain, their persisted values were rechecked, the same tested commit
was redeployed, and acceptance was repeated with a fresh verification request.

## Behavior Intentionally Preserved

- The general league scheduler remains disabled.
- Auction resolution, trade expiry, matchup jobs, league-outbox delivery,
  backup schedules, and fixture jobs remain disabled.
- The exact staging recipient allowlist remains authoritative.
- Account-email queue durability, retry classification, and generic public
  response behavior remain unchanged.
- Frontend behavior and API response contracts remain unchanged.
- No database migration or fixture reset occurred.

## Tests Not Run

- No production send or production deployment was attempted.
- The verification link was not opened, because provider delivery was the
  acceptance target and opening it would mutate account state.
- Mail-client rendering across multiple providers was not tested.

## Remaining Risk and Follow-up

- Grae should complete one manual staging verification-link flow when account
  creation testing begins.
- Production remains intentionally disabled and requires its own approved
  sender, recipient policy, environment review, and release plan before launch.
- The earlier rejected provider event is retained in Resend logs as expected
  operational evidence; the later fresh request supersedes its verification
  token.

## Rollback

1. Set `ACCOUNT_EMAIL_DELIVERY_ENABLED=false` on the Render staging service.
2. Leave `SCHEDULED_JOBS_ENABLED=false`.
3. Redeploy the prior known-good staging commit only if a code rollback is
   required.
4. Do not rewrite Git history, reset the database, or change production.
