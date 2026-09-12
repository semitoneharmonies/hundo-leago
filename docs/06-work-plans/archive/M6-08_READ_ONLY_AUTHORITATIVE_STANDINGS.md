# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-08
```

## Work Item

```text
Read-Only Standings from Finalized Authoritative Results
```

# Objective

Project deterministic league standings exclusively from each matchup result's
current official or corrected version without writing on reads.

# Exact Scope

M6-08 may read schedule participants and current finalized result versions;
calculate games, wins, losses, ties, standings points, points for/against, and
differential; apply the approved ordering and competition ranking; retain teams
with no finalized games; and add focused tie, correction, incomplete-result,
isolation, and byte-for-byte read-only tests.

# Standings Contract

A win is 2 standings points, a tie 1, and a loss 0. Ordering is standings
points descending, differential descending, and fantasy points for descending.
Rows tied on all three receive the same competition rank and the next rank is
skipped. Stable team display name and ID only make output deterministic; they
do not break a competition-rank tie. Pending, void, missing, and superseded
versions never count.

# Explicit Boundaries

M6-08 does not persist or rebuild standings snapshots, finalize results, run a
scheduler, expose HTTP/frontend behavior, or write League Activity or
notifications.

# Completion Gate

M6-08 completes only after authoritative current-version selection, exact
points and ordering, competition ranks, corrected-result replacement,
incomplete-result exclusion, scope isolation, and read-only behavior are proven.
Completion archives this plan and activates M6-09.

# Completion Evidence

M6-08 is complete locally. A SELECT-only repository chooses only each result
container's current official or corrected version. The pure projection awards
2/1/0 points, calculates exact for/against/differential, retains zero-game
participants, orders by the approved three metrics, and assigns competition
ranks without using display names as tie-breakers. Pending and superseded
versions do not count, and persisted standings tables remain untouched.

Verification under Node `24.14.1` passed `13/13` focused tests, the complete
backend suite passed `804/804` across 215 suites, and syntax passed `365/365`.
Protected hashes, artifacts, processes, and diff checks stayed clean.
