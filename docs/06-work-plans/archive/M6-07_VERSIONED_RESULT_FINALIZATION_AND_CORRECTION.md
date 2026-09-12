# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-07
```

## Work Item

```text
Versioned Matchup Result Finalization and Correction
```

# Objective

Finalize each ended matchup from fresh authoritative statistics into an
immutable official result version, then allow explicit attributable corrections
only by appending a new version.

# Exact Scope

M6-07 may require a successful provider refresh completed at or after the week
end and no more than six hours old; atomically create a committed final source
snapshot, result container, calculated version, current pointer, final matchup
state, and operation evidence; leave insufficient data awaiting; append exact
commissioner correction versions; and finalize the week only after all its
matchups are final.

# Explicit Boundaries

M6-07 does not calculate standings, run retry scheduling, expose HTTP/frontend
behavior, rewrite prior versions, or write League Activity or notifications.

# Version Contract

Initial finalization creates version `1` with `source_type = 'calculated'` and
an outcome derived from exact hundredths. A correction requires current
commissioner authority, the expected result version, bounded reason, and exact
scores; it appends version `N+1` with `source_type = 'correction'`, actor, reason,
and superseded-version link. The current pointer moves atomically and prior
versions remain unchanged.

# Completion Gate

M6-07 completes only after fresh-boundary waiting, exact finalization, multi-
matchup week state, idempotent replay, attributable append-only correction,
stale/conflict denial, rollback, scope isolation, and no-activity behavior are
proven. Completion archives this plan and activates M6-08.

# Completion Evidence

M6-07 is complete locally. Finalization waits without writes for a fresh
successful refresh completed at or after week end, then atomically creates a
committed final source snapshot, official result/version 1, current pointer,
final matchup state, conditional final week state, and durable replay evidence.
Current-commissioner correction appends version N+1 with actor, reason, and
supersedes link; prior versions remain unchanged. Conflicts and late failures
leave no partial effects.

Verification under Node `24.14.1` passed `14/14` focused tests, the complete
backend suite passed `801/801` across 213 suites, and syntax passed `361/361`.
Protected hashes, artifacts, baseline processes, and diff checks remained clean.
