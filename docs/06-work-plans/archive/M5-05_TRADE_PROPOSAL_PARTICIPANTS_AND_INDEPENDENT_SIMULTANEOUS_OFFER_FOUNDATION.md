# M5-05 - Trade Proposal Participants and Independent Simultaneous-Offer Foundation

## Document Status

`COMPLETE`

## Completion Date

`2026-07-21`

## Approved Boundary

M5-05 established the backend-authoritative, league-scoped participant,
timing, visibility, and concurrency foundation for two-team trade proposals
without persisting an incomplete asset-less proposal.

The completed boundary:

1. validates exact proposing and receiving team inputs, stable identities,
   distinct teams, current season identity, and a backend-controlled clock;
2. derives an exact 168-hour proposal expiry and the earlier effective league
   trade deadline, closed at the exact deadline instant;
3. opens trading only at the current season's ready, active, or completed Entry
   Draft start and fails closed when the required draft or deadline is absent;
4. derives proposing-manager or league-commissioner authority from current
   active membership, team assignment, league, and team state;
5. blocks manager previews during a freeze while preserving explicit
   commissioner administration;
6. gives authenticated active league members SELECT-only pending and terminal
   proposal projections while denying public and cross-league visibility;
7. proves that overdue reads do not expire or otherwise mutate proposals; and
8. creates distinct non-persisted preview identities for simultaneous offers
   without reserving or changing any asset, ownership, contract, cap, roster,
   draft-pick, right, or obligation record.

## Files Changed

```text
src/domain/trades/tradeProposalPolicy.js
src/infrastructure/persistence/sqlite/SqliteTradeProposalRepository.js
src/application/services/trades/createTradeProposalFoundationService.js
src/bootstrap/createTargetRuntime.js
test/foundation/tradeProposalFoundation.test.js
test/foundation/targetRuntimeFoundation.test.js
docs/04-technical-specs/DATA_MODEL.md
```

## Verification Evidence

All authoritative verification used the official Node `24.14.1` Windows
runtime after its SHA-256 matched Node's published manifest.

```text
Official Node archive SHA-256: 6E50CE5498C0CEBC20FD39AB3FF5DF836ED2F8A31AA093CECAD8497CFF126D70
Focused trade and target-runtime slice: 29/29 passed across 7 suites
Complete backend suite: 696/696 passed across 178 suites
Backend runtime-declaration slice: 4/4 passed
Backend JavaScript syntax: 300/300 parsed
Backend and documentation diff checks: passed
Generated repository database artifacts: 0
Protected compatibility-data hash changes: 0
Leaked test Node processes: 0
Temporary Node verification artifacts removed: 3/3
```

## Protected Hash Evidence

```text
players.json: C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1
2026-season-1-reset.json: 0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491
```

## Safety Result

No trade row, asset row, event, reservation, transfer, status mutation, route,
scheduler, public visibility, compatibility-authority change, deployment,
production mutation, commit, or push was added. M5-06 is the next bounded
checkpoint and will add typed-asset validation plus atomic pending-proposal,
asset-snapshot, and creation-event persistence.
