# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M6-06
```

## Work Item

```text
Read-Only Live Player and Team Result Calculation from Baseline
```

# Objective

Calculate live matchup player and team scores from immutable team-specific
baselines and the latest valid season totals without writing any state.

# Exact Scope

M6-06 may read one league/season/week/matchup, both immutable team locks and
locked players, and the latest successful provider totals; calculate exact
nonnegative player deltas and team sums; return illegal teams as zero; expose
source age/freshness; and add focused calculation, isolation, stale-source,
regression, and read-only tests.

# Explicit Boundaries

M6-06 does not write live-score cache rows, mutate locks, finalize results,
correct data, update standings, run a scheduler, add HTTP/frontend behavior,
or write League Activity or notifications.

# Scoring Contract

Each player score is current cumulative fantasy points hundredths minus that
player's immutable baseline. Goals remain worth `125` hundredths and assists
`100`. Missing current rows mean explicit zero only when the baseline was zero;
any cumulative category below baseline fails closed as source regression. A
team with `legal = 0` always returns zero. Stale last-valid statistics remain
readable with explicit freshness health; failed refreshes never erase them.

# Completion Gate

M6-06 completes only after exact player/team deltas, illegal zero, independent
team baselines, stale last-valid health, source-regression rejection, scope
isolation, and byte-for-byte read-only behavior are proven. Completion archives
this plan and activates M6-07.

# Completion Evidence

M6-06 is complete locally. Its SELECT-only repository reads both immutable team
locks and the latest successful provider refresh. The pure scorer applies exact
`125`-hundredth goal and `100`-hundredth assist deltas independently per team,
returns illegal teams as zero, rejects cumulative regression, ignores newer
failed refresh attempts, and labels stale last-valid data without erasing it.

Verification under Node `24.14.1` passed `18/18` focused tests, the complete
backend suite passed `795/795` across 211 suites, and syntax passed `357/357`.
Protected hashes, artifacts, baseline processes, and `git diff --check` stayed
clean.
