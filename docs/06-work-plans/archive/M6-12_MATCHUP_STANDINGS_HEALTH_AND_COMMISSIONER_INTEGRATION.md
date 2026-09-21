# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-12
```

## Work Item

```text
Matchup, Standings, Health, and Commissioner HTTP/Frontend Integration
```

# Objective

Expose the approved authenticated matchup and standings contract through the
target backend and connect manager and commissioner frontend surfaces with safe
health, loading, empty, stale, error, preview, and confirmation states.

# Exact Scope

M6-12 may compose nine approved routes: schedule list, current matchup, week
detail, matchup detail/live score, standings, schedule generation, explicit week
transition, result correction, and standings rebuild. It may add scoped read
repositories/services, safe error mapping, CSRF-protected writes, target runtime
composition, frontend API hooks/pages/navigation, and focused backend/frontend
tests. Commissioner writes must use the M6 preview/version/confirmation
contracts.

# Contract and Safety

Every route is authenticated and league/season scoped. Reads remain SELECT-only.
Writes require CSRF and current commissioner authority where applicable. Health
exposes freshness/status only, never raw provider payloads. Matchup and standings
events remain outside League Activity. The target runtime remains absent from
the production entrypoint; no deployment, commit, push, or production job
startup occurs.

# Completion Gate

M6-12 completes only after all nine backend contracts, authentication, CSRF,
scope, safe errors, read-only GETs, commissioner previews/writes, frontend
manager/commissioner states, navigation, lint, tests, and production build pass.
Completion archives this plan and begins the full M6 milestone gate.

# Completion Evidence

M6-12 is complete locally. The isolated target runtime exposes exactly the nine
approved authenticated league/season matchup and standings routes. All GETs are
read-only; writes require CSRF, current commissioner authority, preview,
matching version, and explicit confirmation. The frontend now provides safe
matchup, live/final score, standings, source-health, empty, stale, error, and
commissioner recovery states through the target session and React Query
boundaries.

```text
Required backend runtime: Node 24.14.1
Focused M6-12 backend/runtime gate: 30/30 passed across 7 suites
Focused M6-12 frontend/navigation gate: 15/15 passed across 3 files
Complete backend suite: 826/826 passed across 224 suites
Backend JavaScript syntax: 386/386 parsed
Complete frontend suite: 75/75 passed across 17 files
Frontend lint: passed
Frontend production build: passed (172 modules; bundle-size advisory only)
Protected players.json SHA-256:
C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1
Protected reset manifest SHA-256:
0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491
Generated database artifacts: 0
Additional Node processes: 0
Production target-runtime references: 0
Backend and frontend diff checks: passed apart from existing line-ending advisories
```

No compatibility authority, shared data, production entrypoint, deployment,
commit, or push changed. Completion archives this plan and closes the M6 gate.
