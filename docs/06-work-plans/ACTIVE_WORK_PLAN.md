# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE — STAGING ONLY`

## Work Plan ID

```text
M7-10
```

## Work Item

```text
SportsDataIO catalog integration, deterministic staging fixture remediation,
and manual-acceptance defect repair
```

## Authority and Boundary

Grae authorized this staging-only remediation on `2026-07-25`.

This plan permits changes only in the canonical `E:\hundo-leago` and
`E:\hundo-leago-backend` repositories, local/test databases, and the existing
Netlify and Render staging services after verification. It does not authorize
any production data, deployment, configuration, domain, branch, traffic, or
provider action.

The undocumented NHL endpoints previously used by legacy scripts remain
disabled. They must not be called by this plan.

## Provider Decision

SportsDataIO Discovery Lab is the approved staging source for real last-season
NHL data under Grae's personal-project entitlement. The provider integration:

* runs only on the backend;
* requires `SPORTSDATAIO_NHL_API_KEY` from secure staging configuration;
* sends the key only as the documented subscription-key request header;
* is disabled and fails closed when the key is absent;
* never stores or returns the key; and
* does not make a live import until the key is configured separately.

Free-tier data is last-season and must be labelled as such. It is not live
current-season data, commercial redistribution, or a production authorization.

## Staging-Only Provider Operation Guide

Configure these values only on Render service
`hundo-leago-backend-staging`:

| Variable | Classification | Required value or rule |
| --- | --- | --- |
| `SPORTSDATAIO_NHL_API_KEY` | Render managed secret | The Discovery Lab key; never place it in Git, a browser variable, or test evidence. |
| `SPORTSDATAIO_NHL_LAST_SEASON_START_YEAR` | Non-secret staging setting | `2025` for the 2025-26 last-season dataset. |
| `SPORTSDATAIO_NHL_API_ORIGIN` | Optional non-secret staging setting | Omit to use `https://api.sportsdata.io/api/nhl/fantasy`; any override must be the same canonical HTTPS API path. |

The local last-season start year remains `2025` for league key `20252026`.
SportsDataIO identifies that regular season as `2026REG`; the adapter derives
that provider value and rejects non-regular-season totals.

The import is an explicit maintenance operation, not startup behavior or a
scheduled job. The hosted route is intentionally composed only while staging
writes are closed. The required deployment sequence is:

1. positively identify `hundo-leago-backend-staging`, set
   `LEAGUE_WRITE_MODE=closed`, keep `SCHEDULED_JOBS_ENABLED=false`, and deploy;
2. authenticate as the Release-QA platform administrator and run the explicit
   protected staging import once with its exact confirmation phrase and
   idempotency key;
3. verify the imported catalog count, last-season totals, provider health,
   audit evidence, and retained last-valid data;
4. set `LEAGUE_WRITE_MODE=open`, keep scheduled jobs disabled, and redeploy the
   same verified source so commissioner roster writes are available; and
5. verify the import route is absent in the final open runtime before hosted
   commissioner and manual-acceptance testing.

The equivalent service-environment CLI remains available only for isolated
staging maintenance:

```text
npm run data:import:sportsdataio:staging -- --confirm-staging-sportsdataio-import
```

The command verifies the staging database identity and exact migrations before
writing. It requires at least 800 distinct catalog players and 800 mapped
last-season statistics rows, persists the catalog before totals, and fails
without replacing the previous valid statistics refresh when provider data is
missing, malformed, or too short. The administrator-only operations-health
response reports whether the last successful SportsDataIO import is stale; it
never returns the key.

## Implementation and Verification Evidence

The implementation, deployment, provider import, and focused hosted retest are
complete on the dedicated staging resources. This is staging evidence only and
does not authorize a production action.

* `SPORTSDATAIO_NHL_API_KEY` is the only required secret. Configure it only
  on Render service `hundo-leago-backend-staging`; no frontend, Git, chat,
  test fixture, or production configuration receives it.
* The player and matchup read paths prefer `sportsdataio-discovery-lab` and
  expose its data as last-season data. They fall back only to a visibly
  labelled `release_qa_fixture` source when real imported data is absent.
* Release-QA fixture `m7-release-qa-fixture-v6` is deterministic and
  staging-identity-gated. It has two distinct six-team leagues, distributed
  Active/Bench/IR/Prospect rosters, Alpha/Beta commissioner accounts,
  no-membership/pending/deactivated accounts, player totals, snapshot locks,
  and player rows for matchup displays. Its trade evidence includes pending,
  accepted, rejected, simultaneous-asset, and explicitly synthetic
  invalid-cap-preview states.
* The platform-administrator-only reset creates and verifies a pre-reset
  backup, rechecks exact staging environment/database identity and authority,
  resets only Release-QA fixture state transactionally, preserves imported
  provider catalog/statistics plus provider audit/idempotency evidence,
  invalidates fixture sessions, and returns a sanitized one-time receipt.
* The commissioner workspace and protected add, remove, move, salary, and term
  commands are complete in the backend and frontend. Previews are unsafe/CSRF
  protected but read-only; confirmed commands enforce optimistic versions,
  idempotency, authorization, league scope, authoritative F/D eligibility,
  roster/cap warnings, and atomic correction/activity evidence.
* Player details are league-scoped and show ownership, contract, and
  last-season statistics; matchup player lists/statistics use the retained
  provider source or visibly synthetic fallback; Socket.IO reconnect refetches
  active league queries without losing the selected route.
* League Activity renders actor authority and identifier, league/season/team/
  player scope, action result, correction metadata, reason, and timestamp
  without exposing unsafe internal snapshots.

The final backend suite passes `962/962` on the approved Node `24.14.1`.
The final frontend suite passes `106/106`; lint, production build, and the
browser-authority verifier also pass. The provider-contract correction passes
its focused `32/32` gate.

## Hosted Completion Evidence

The dedicated staging application is live at
`https://hundoleago-staging.netlify.app` with:

* frontend application commit
  `84bb957ff75c351e2c55238bacb982f8dcf8b46b` and Netlify deploy
  `6a64b810e7798072d13f104e`;
* backend commit `0e97b056a3946bcbaeb782d23d849bb2b508a125`
  and Render deploy `dep-d9ib71l8nd3s739k1v60`;
* `LEAGUE_WRITE_MODE=open` and scheduled jobs disabled on the dedicated
  staging service; and
* no production deployment, configuration, data, job, or branch change.

The explicit closed-mode SportsDataIO import succeeded with `3,154` catalog
players and `1,091` mapped 2025-26 regular-season statistics rows. The final
open-mode provider-health view reports
`sportsdataio-discovery-lab`, import enabled, the same catalog count, and the
same successful import. A real Connor McDavid player-detail page displayed 82
games, 48 goals, 90 assists, and 138 points with the required last-season
label.

Hosted commissioner testing previewed and applied add, Active/Bench/IR/Prospect
moves, salary/term correction, and removal against Alpha Foxes. Cap totals,
exception warnings, and League Activity entries matched after every command;
the imported player ended as a free agent and Alpha Foxes returned to its
fixture cap. Alpha manager authority was denied, and the Beta commissioner
could not address the Alpha league.

The post-reset fixture contains six distinct Alpha teams and six distinct Beta
teams. Fixture Player 19 is Bench on Alpha Owls but Bench on Beta Vipers.
Three pending, one accepted, and one rejected trade are restored. The
invalid-cap preview reports `SALARY_CAP_EXCEEDED` and the approved general
illegality warning; it was not accepted. Matchup player lists and per-player
statistics are populated. After a staging backend restart, the selected
matchup route remained stable and its 20 table rows remained populated without
a manual refresh.

The final administrator reset created verified backup
`backup-v1-14c101189ceadd0de55d7cffd6b0727ddb2e43af820968804b525f9756fe4215`,
invalidated fixture sessions, restored fixture
`m7-release-qa-fixture-v6`, and preserved all `3,154` provider catalog players
plus the successful `1,091`-player import record.

## Scope

1. Add a validated SportsDataIO NHL adapter, durable normalized catalog and
   statistics import boundary, last-valid retention, and safe provider-health
   observability.
2. Add a deterministic, idempotent synthetic staging fixture/reset workflow
   that preserves the imported full catalog, leaves unassigned catalog players
   available as league free agents, and creates two visibly distinct six-team
   leagues with deliberately different Active/Bench/IR/Prospect rosters,
   contracts, salaries, terms, cap states, and Alpha/Beta team names. It must
   include Alpha and Beta commissioners plus no-membership,
   pending-verification, and deactivated accounts; non-zero locked matchup
   player rows/statistics; and pending, accepted, rejected, and real
   invalid-cap-preview trade scenarios. Synthetic fixture data must never be
   represented as provider data.
3. Expose league-scoped commissioner tools through protected backend routes and
   the target frontend to add or remove a player, move Active/Bench/IR/Prospect,
   and correct salary and term. Each tool must provide authoritative source
   data, explicit preview and confirmation, cap impact, roster/cap validation,
   optimistic concurrency and idempotency protection, actor/scope
   authorization, correction evidence, and League Activity.
4. Repair player-detail navigation, matchup player-stat presentation, and
   Socket.IO reconnect refetch/preserved-view behaviour found during manual
   staging acceptance.
5. Update the canonical operation guide, manual test guide, work-plan evidence,
   and release evidence with source, refresh cadence, safe configuration, and
   remaining limitations.
6. Add a platform-administrator-only staging reset action and a protected,
   sanitized provider-health view. The reset must be a confirmed unsafe command
   that positively checks environment and database identity, creates a backup,
   records audit evidence, and has no production route or runtime capability.

## Required Verification

* provider-adapter parsing, key absence, failure, and last-valid tests;
* deterministic fixture/reset verification, integrity, foreign keys, account
  states, league isolation, and trade-state coverage;
* authorization, CSRF, optimistic-version, roster/cap, activity, player-detail,
  matchup, and reconnect tests;
* backend syntax and complete suite; frontend tests, lint, and build;
* staging-only deployment and focused hosted smoke only after exact scoped
  commits pass local verification and the staging target is re-identified.

## Stop Conditions

Stop before any provider import when the SportsDataIO key is missing, its tier
does not permit the required NHL endpoint, a response is not last-season data,
or data rights are ambiguous. Stop all hosted mutation if staging cannot be
positively identified or an action could affect production.

## Completion Gate

M7-10 is complete only when all scoped changes have recorded test evidence,
the staging fixture is visibly synthetic or lawfully provider-backed as
labelled, hosted smoke passes, the accepted manual-test failures are retested,
and production remains blocked.
