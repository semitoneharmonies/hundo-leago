# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-10
```

## Work Item

```text
Commissioner Matchup and Standings Recovery Tools
```

# Objective

Give the current commissioner explicit preview-and-confirm recovery tools to
route a matchup into correction-required state and rebuild a persisted standings
snapshot from authoritative current result versions.

# Exact Scope

M6-10 may add read-only recovery previews; require current commissioner,
bounded reason, exact expected versions, and explicit confirmation; atomically
mark a matchup and week correction-required with durable operation evidence;
atomically supersede the current standings snapshot and insert a fully rebuilt
version and rows; replay exact commands; and add authority, conflict, rollback,
isolation, and no-activity tests.

# Safety Contract

Recovery never edits a prior result version or calculates alternative standings
rules. Matchup routing moves no player, score, or result pointer. Standings
rebuild consumes the M6-08 projection exactly. Every write is attributable to
the current commissioner and one operation ID, and preview remains read-only.

# Explicit Boundaries

M6-10 does not deploy, start jobs, expose frontend behavior, silently run on a
GET, or write League Activity or notifications.

# Completion Gate

M6-10 completes only after read-only previews, explicit confirmation, current-
commissioner authority, compare-and-set routing, exact authoritative rebuild,
superseded snapshot preservation, idempotent replay, rollback, isolation, and
attribution are proven. Completion archives this plan and activates M6-11.

# Completion Evidence

M6-10 is complete locally. Current-commissioner previews remain read-only.
Explicit confirmed matchup recovery atomically routes only matchup/week state
to correction-required with attributable operation evidence. Explicit standings
rebuild consumes the M6-08 projection exactly, supersedes rather than deletes
the previous snapshot, inserts a complete current version, and attributes the
operation. Both paths replay exactly and roll back late failure.

Verification under Node `24.14.1` passed `17/17` focused tests, the complete
backend suite passed `813/813` across 220 suites, and syntax passed `374/374`.
Protected hashes, artifacts, processes, and diff checks stayed clean.
