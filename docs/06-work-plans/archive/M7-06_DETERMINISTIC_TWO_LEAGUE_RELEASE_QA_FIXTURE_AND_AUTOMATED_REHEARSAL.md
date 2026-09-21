# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M7-06
```

## Work Item

```text
Deterministic Two-League Release-QA Fixture and Automated Rehearsal
```

# Objective

Create one reproducible test-only command that provisions the approved
two-league release fixture into a new exact-schema SQLite database, records its
expected identities and totals, and runs representative automated workflows
and cross-league denial checks without exposing a seed HTTP route.

# Authority and Boundary

Grae requested continued M7 implementation on `2026-07-22`. This plan
authorized local/test temporary databases and deterministic synthetic records
only.

It did not authorize altering staging or production data, importing a real
source bundle, applying the production reset, creating hosted users, sending
email, enabling jobs, adding a seed/debug HTTP endpoint, deploying, committing,
pushing, or changing production authority. None of those actions occurred.

# Completed Scope

1. Added a test-only builder and CLI that require `environment=test`, a
   brand-new `release-qa*.sqlite3` path, and a physical root below the operating
   system temporary directory.
2. Created two separate six-team leagues with overlapping team names, shared
   global players, different stable league/team/ownership identities, and the
   approved nine-account role/status matrix.
3. Created representative active, bench, injured-reserve, unsigned-prospect,
   signed-prospect, free-agent, contract, retention, buyout, open-auction,
   own-bid, simultaneous-trade, live-matchup, finalized-result, standings,
   activity, notification, and captured-email-envelope state.
4. Added a safe semantic manifest containing only aliases, counts, cap/money
   totals, schema/integrity evidence, scenario flags, and its canonical SHA-256.
   It excludes email addresses, password material, credential hashes, bid
   values, private payloads, and database record IDs.
5. Added exact verification for SQLite integrity, foreign keys, schema version,
   database environment identity, two-league isolation, overlapping identities,
   required fixture state, and fail-closed tamper detection.
6. Recreated the fixture twice and proved byte-equivalent semantic manifests.

# Files Changed

```text
hundo-leago-backend/scripts/create-release-qa-fixture.js
hundo-leago-backend/src/operations/release/createReleaseQaFixture.js
hundo-leago-backend/src/operations/release/releaseQaFixtureContract.js
hundo-leago-backend/src/operations/release/verifyReleaseQaFixture.js
hundo-leago-backend/test/foundation/releaseQaFixtureFoundation.test.js
hundo-leago-backend/package.json
```

# Completion Evidence

Completed locally on `2026-07-22`.

* The new fixture gate passed `4/4` tests.
* The focused fixture, league access, roster privacy, cap, auction/trade/matchup
  HTTP, activity/notification, Socket.IO isolation, and maintenance gate passed
  `68/68` tests.
* The complete backend suite passed `866/866` across `227` suites under Node
  `24.14.1`.
* JavaScript syntax checks passed `418/418`; `git diff --check` passed.
* Protected player/reset hashes matched, no SQLite artifacts remained, and the
  two-process Node baseline was unchanged.
* All fixture databases were created under the operating-system temporary
  directory and removed by the tests. No network, hosted state, real provider,
  production data, commit, push, or deployment was used.

# Next Step Boundary

After M7-06, the next bounded plan may compose the deterministic fixture with
the actual target runtime and frontend for an integrated local release
rehearsal, create hosted-staging preflight evidence, and perform local
browser/device checks. A local fixture does not prove deployed staging and does
not authorize a hosted import, reset, deployment, job startup, or production
operation.
