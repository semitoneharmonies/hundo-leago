# M4 Gate - League Assets and Cap System

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Gate Result

Milestone M4 is complete locally.

M4-01 through M4-12 now provide the approved authoritative player, corrected
position, ownership, roster-category, roster-movement, contract, fantasy ELC,
retention, buyout, cap-calculation, public-projection, commissioner-correction,
and frontend roster foundations. The target runtime remains isolated from
production authority.

## Required Gate Evidence

1. Normal roster capacity is exactly 12 forwards and 6 defensemen, with no
   goalies and approved position normalization.
2. Bench capacity is four players with a `$4.00 AAV` maximum, injured-reserve
   capacity is four players, and eligible prospects are unlimited.
3. Signed prospects may remain off-cap until moved out of prospects, and a
   player cannot return to prospects after entering active, bench, or injured
   reserve.
4. Contracts are one to three years without extension, and original total,
   rounded AAV, and contract-year schedules reconcile under the approved model.
5. Authoritative cap totals include active-player AAV, retained salary, and
   buyout obligations while excluding approved off-cap categories.
6. Retention and buyout records remain explicit league assets whose yearly
   schedules reconcile by season.
7. Approved transactions may create an illegal normal roster only with an
   explicit warning; ordinary invalid moves fail without partial state.
8. Commissioner roster and contract corrections are authorized, previewed,
   confirmed when warned, version-checked, evidenced, and atomically audited.
9. Public roster reads are read-only, expose only approved fields, and reconcile
   roster, contract, statistics, and cap values before frontend use.
10. Records, reads, corrections, histories, and calculations remain league-
    scoped, including cross-league rejection and hidden targets.

## Final Verification

```text
Required Node runtime: 24.14.1
Cumulative M4 foundation set: 119/119 passed
Complete backend suite: 630/630 passed across 162 suites
Backend architecture suite: 4/4 passed
Backend JavaScript syntax: 277/277 parsed
Complete frontend suite: 61/61 passed across 12 files
Frontend lint: passed
Frontend production build: passed
Backend and frontend diff checks: passed
Generated backend database artifacts: 0
Protected compatibility-data hash changes: 0
```

The frontend build retains one non-blocking advisory for a minified JavaScript
chunk larger than 500 kB.

## Safety Result

Milestone M4 was completed without replacing or reseeding league data, opening
or migrating shared data, enabling the target runtime in production, deploying,
committing, or pushing. M5-01 is the next planning checkpoint; no M5
implementation is active.
