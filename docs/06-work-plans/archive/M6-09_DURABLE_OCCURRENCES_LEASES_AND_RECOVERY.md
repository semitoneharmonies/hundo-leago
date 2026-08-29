# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-09
```

## Work Item

```text
Durable Scheduled-Job Occurrences, Leases, and Recovery
```

# Objective

Run statistics, baseline, lock, finalization-retry, and rollover work through
durable deterministic occurrences that cannot execute twice and can recover
after a crashed worker lease expires.

# Exact Scope

M6-09 may add the schema needed for occurrence due time, lease owner/expiry,
attempt count, and terminal evidence; define canonical occurrence keys for the
approved M6 job types; atomically claim one due occurrence; renew, succeed, or
fail only under the current lease token; reclaim expired work; and add a job
runner with bounded registered handlers and focused concurrency/recovery tests.

# Safety Contract

Occurrence identity is stable by job type and league/season/week scope. A
successful occurrence is terminal and never executes again. Only one unexpired
lease owns an occurrence. A failed attempt records safe evidence and becomes
retryable at its explicit next-at time. A crashed running occurrence becomes
claimable only after lease expiry. Reads never create occurrences.

# Explicit Boundaries

M6-09 does not start production scheduling, infer production scope, correct
results, rebuild standings, expose HTTP/frontend behavior, or write League
Activity or notifications.

# Completion Gate

M6-09 completes only after deterministic identity, atomic single claim,
unexpired exclusion, expired takeover, token-guarded completion, retry timing,
handler failure recovery, scope isolation, rollback, and no duplicate effects
are proven. Completion archives this plan and activates M6-10.

# Completion Evidence

M6-09 is complete locally. Schema version `18` extends the shared durable
`job_runs` model with lease tokens and explicit retry time while preserving
existing job APIs. Five scope-complete M6 occurrence types schedule exactly,
claim single-winner, reject unexpired contenders and stale tokens, permit
takeover exactly at expiry, retry only at the recorded instant, and never
re-execute success. The bounded runner is implemented but not started.

Verification under Node `24.14.1` passed `63/63` focused tests across 16 suites,
the complete backend suite passed `809/809` across 218 suites, and syntax
passed `370/370`. Protected hashes, artifacts, processes, and diff checks stayed
clean.
