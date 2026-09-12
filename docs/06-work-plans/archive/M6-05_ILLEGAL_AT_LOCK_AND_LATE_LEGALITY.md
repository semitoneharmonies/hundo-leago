# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-05
```

## Work Item

```text
Illegal-at-Lock and Team-Specific Late-Legality Handling
```

# Objective

Make an illegal team score zero at the normal lock without creating a scoring
lineup, then allow exactly one team-specific late lock when that roster first
becomes legal, using a new baseline that excludes all earlier points.

# Exact Scope

M6-05 may validate the exact active roster shape, record idempotent illegal
normal-lock evidence, keep the team without roster-player rows, re-evaluate
legality after lock, and atomically replace that evidence with one immutable
late lock and fresh team-specific baseline. It may add the necessary schema,
policy, repository, service, migration, and focused tests.

# Explicit Boundaries

M6-05 does not calculate live scores, alter the opponent's baseline, finalize
results, update standings, run a scheduler, add HTTP/frontend behavior, or
write League Activity or notifications.

# Legality Contract

A normal legal lineup contains exactly 12 active forwards and 6 active
defencemen in unique approved slots. An illegal team receives a unique normal
lock row with `legal = 0`, no roster-player rows, and explicit reason evidence.
It scores zero while that evidence remains. A later legal roster may convert
once to `lock_type = 'late'`, `legal = 1`; its baseline uses the latest
successful statistics at or before the late-lock instant and therefore awards
no earlier points. The opponent's lock and baseline are never touched.

# Completion Gate

M6-05 completes only after illegal zero state, exact late-legality transition,
fresh late baseline, opponent isolation, idempotency, conflict, and atomic
rollback are proven. Completion archives this plan and activates M6-06.

# Completion Evidence

M6-05 is complete locally. Schema version `17` permits a strictly constrained
illegal normal lock with a reason and no baseline, while every legal normal or
late lock requires a fresh baseline. Exact 12-forward and 6-defenceman slot
legality is enforced. An illegal team receives zero roster-player rows, then a
one-way late conversion snapshots current fresh totals at the conversion time,
awarding no earlier points and leaving the opponent untouched. Replay,
still-illegal rejection, conflict, and late rollback are proven.

Verification under Node `24.14.1` passed `68/68` focused tests across 18 suites,
the complete backend suite passed `791/791` across 209 suites, and syntax
passed `353/353`. Protected hashes, database artifacts, baseline processes, and
`git diff --check` remained clean.
