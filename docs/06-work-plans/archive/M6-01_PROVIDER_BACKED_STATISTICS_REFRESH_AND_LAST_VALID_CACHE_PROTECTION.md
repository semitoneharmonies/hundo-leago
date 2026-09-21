# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-01
```

## Work Item

```text
Provider-Backed Statistics Refresh and Last-Valid Cache Protection
```

# Objective

Add the target SQLite statistics refresh boundary using the approved global
player identities and NHL provider identifiers. A successful refresh appends a
complete normalized source-season set, while a provider, validation, mapping,
or transaction failure preserves the prior successful totals as the last-valid
cache.

# Exact Scope

M6-01 may:

1. add a strict statistics policy for NHL season keys, raw integer categories,
   source timestamps, and fantasy-point hundredths;
2. add a SQLite statistics repository over the existing `stat_sources`,
   `stat_refreshes`, `player_stat_totals`, and `player_external_ids` schema;
3. record every refresh attempt with safe success, failure, or rejection state;
4. map every accepted provider player ID to one stable global player ID and
   reject the complete candidate set when any identity is unknown or duplicated;
5. persist one successful refresh and all normalized totals atomically;
6. read the latest successful season totals without using failed or rejected
   attempts; and
7. add deterministic provider, policy, repository, service, rollback,
   last-valid, and schema-compatibility tests.

# Explicit Boundaries

M6-01 does not:

* call the real NHL provider from automated tests;
* overwrite or delete a prior successful refresh or total;
* treat a missing, malformed, partial, or undersized provider response as a
  successful zero-player refresh;
* add matchup snapshots, schedules, locks, live scoring, results, standings,
  durable job scheduling, commissioner recovery, or frontend screens;
* modify compatibility JSON statistics authority or production data;
* deploy, commit, push, or change production authority.

# Refresh Contract

The provider fetch occurs before the success transaction. The repository first
records a safe `started` attempt. A provider failure records only a sanitized
failure code. Candidate rows must contain a unique provider player ID and
non-negative integer games played, goals, and assists. NHL points are derived
as goals plus assists, and fantasy points are stored exactly as:

```text
goals * 125 + assists * 100
```

The success transaction resolves every provider ID through the approved NHL
external-ID mapping, inserts all totals, and marks the refresh `succeeded`.
Any failure rolls back those totals and marks the attempt `rejected` or
`failed`; the latest earlier successful refresh remains authoritative.

# Verification

Completion must prove:

* exact normalization and fantasy-point hundredths;
* duplicate, malformed, unknown-player, wrong-season, partial, and undersized
  candidate rejection;
* provider failure and late transaction failure preserve last-valid totals;
* a successful refresh becomes the new authoritative season set atomically;
* latest reads ignore later failed or rejected attempts;
* no source payload, stack trace, secret, or compatibility-file write occurs;
* focused tests, the complete backend suite, JavaScript syntax, protected
  hashes, database-artifact checks, process checks, and diff checks pass.

# Expected Files

```text
src/domain/statistics/statisticsPolicy.js
src/infrastructure/persistence/sqlite/SqliteStatisticsRepository.js
src/application/services/statistics/createTargetStatisticsService.js
test/foundation/statisticsPolicyFoundation.test.js
test/foundation/statisticsRefreshFoundation.test.js
test/foundation/sqliteInitialSchema.test.js
test/foundation/sqliteRepositoryFoundation.test.js
../hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

# Completion Gate

M6-01 completes only when the last-valid guarantee and atomic success boundary
are proven. Completion archives this plan and activates M6-02; it does not
authorize adjacent M6 behavior.

---

# Completion Record

Completed locally on `2026-07-22`.

## Behavior Delivered

* Provider rows are normalized to stable NHL identifiers, integer G/A/GP,
  derived NHL points, and exact fantasy-point hundredths.
* Every attempt is recorded safely; successful season sets append atomically.
* Failed, rejected, undersized, malformed, duplicate, or unmapped refreshes do
  not replace or partially modify the latest successful season set.
* Latest-season reads select successful refreshes only and remain byte-for-byte
  read-only.

## Files Changed

```text
src/domain/statistics/statisticsPolicy.js
src/infrastructure/persistence/sqlite/SqliteStatisticsRepository.js
src/application/services/statistics/createTargetStatisticsService.js
test/foundation/statisticsPolicyFoundation.test.js
test/foundation/statisticsRefreshFoundation.test.js
```

## Verification Result

```text
Focused M6-01 and schema/repository gate: 25/25 passed across 4 suites
Complete backend suite: 766/766 passed across 198 suites
Backend JavaScript syntax: 335/335 parsed under Node 24.14.1
Protected players.json SHA-256:
C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1
Protected reset manifest SHA-256:
0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491
Generated database artifacts: 0
Additional Node processes: 0
Backend diff check: passed apart from existing line-ending advisories
```

No compatibility JSON, deployment, production authority, commit, or push was
changed. M6-02 schedule generation is the next bounded checkpoint.
