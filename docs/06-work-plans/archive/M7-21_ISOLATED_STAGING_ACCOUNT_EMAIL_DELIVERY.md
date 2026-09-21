# Hundo Leago - Work Plan Archive

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY`

## Work Plan ID

```text
M7-21
```

## Work Item

```text
Isolated staging account-email delivery
```

## Authority and Boundary

Grae explicitly approved this staging implementation and deployment on
`2026-07-27`.

This plan permits one independently controlled account-email worker, focused
backend tests, the matching environment contract and Blueprint update, an
exact backend staging commit, a Render staging deployment, and one
allowlisted verification-email acceptance check through the configured Resend
provider.

This plan does not authorize global scheduled jobs, auction resolution, trade
expiry, matchup processing, backup scheduling, production changes, database
reset or reseeding, secret disclosure, force-push, or a merge to `main`.

## Approved Scope

1. Add an explicit `ACCOUNT_EMAIL_DELIVERY_ENABLED` deployed-runtime setting.
2. Start and stop the durable account-email worker independently from the
   league scheduler.
3. Keep `SCHEDULED_JOBS_ENABLED=false` on staging.
4. Keep email delivery restricted to the existing staging recipient allowlist.
5. Add focused configuration, scheduler, runtime, and Blueprint regression
   coverage.
6. Document the separate scheduler and email-delivery controls.
7. Run the complete backend verification gate.
8. Publish only the exact verified backend commit to staging.
9. Configure only the new staging switch, deploy, and verify one queued or
   newly requested allowlisted verification email in Resend.

## Verification Gates

```text
npm run check
npm test
npm ls --all
git diff --check
```

Hosted acceptance must additionally prove:

- the Render deploy reaches `live`;
- liveness and readiness remain healthy;
- the general league scheduler is still disabled;
- an allowlisted account-email event is accepted by Resend; and
- no auction, trade, matchup, backup, fixture, or production job was enabled.

## Rollback

- Set `ACCOUNT_EMAIL_DELIVERY_ENABLED=false` on the Render staging service.
- Redeploy the prior known-good backend staging commit if code rollback is
  required.
- Leave `SCHEDULED_JOBS_ENABLED=false`.
- Do not rewrite history, reset the database, or change production.

## Completion Conditions

This plan is complete only when:

1. account-email delivery has an explicit switch independent from league jobs;
2. email-only startup cannot run auction, trade, matchup, or league-outbox
   jobs;
3. shutdown drains and closes the email worker;
4. focused and complete backend verification passes;
5. the exact backend commit is pushed to `staging`;
6. the Render staging deploy is live and healthy;
7. Resend records the allowlisted verification message; and
8. documentation records the exact evidence and remaining production boundary.

## Completion Evidence

- Backend commit `dfee0a0` was pushed to `staging`.
- Render deploy `dep-d9jve7dbedkc738lrmpg` reached `live` with the verified
  `notify.hundoleago.com` sender persisted.
- Public liveness and readiness both returned their healthy status.
- `ACCOUNT_EMAIL_DELIVERY_ENABLED=true` runs only the durable account-email
  worker while `SCHEDULED_JOBS_ENABLED=false` keeps league jobs disabled.
- A fresh allowlisted verification request returned `202 Accepted`; Resend
  recorded the message as `delivered`.
- The focused scheduler and deployment foundation run passed `25/25` tests.
- The complete backend gate passed `985/985` tests across 234 suites,
  `npm run check`, dependency-tree validation, a 467-file JavaScript syntax
  sweep under Node `24.14.1`, and whitespace validation.
- No production, database, fixture, auction, trade, matchup, backup, or
  league-outbox setting was changed.
- The detailed run record is
  `docs/07-testing/release-runs/M7_ACCOUNT_EMAIL_DELIVERY_2026-07-27.md`.
