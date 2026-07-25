# Hundo Leago - Backend Endpoint Checklist

## Document Status

`APPROVED`

## Checklist Status

`ACTIVE`

This testing document defines:

* the exact current 34-route compatibility inventory;
* the complete approved Season 2 target endpoint catalogue;
* the evidence required before an endpoint is connected to the frontend, staged, or used in production;
* authentication, permission, league-isolation, validation, read-only, transaction, idempotency, concurrency, privacy, Socket.IO, and activity checks;
* technical checklist decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the endpoint-checklist decisions and approved adoption of the resulting checklist on 2026-07-18.

---

## Testing Purpose

An endpoint is not complete because:

* its route exists;
* one happy-path request returned `200`;
* the frontend appeared to update;
* a database row changed;
* a Socket.IO event arrived.

Each endpoint must prove the full approved contract, including what it must refuse and what it must not change.

This checklist makes that evidence visible feature by feature.

---

## Out of Scope

This checklist does not:

* implement an endpoint;
* change an API contract;
* authorize production requests that mutate data;
* replace feature specifications;
* replace automated test source;
* treat a checked box as evidence without a command and result;
* permit debug or recovery routes in production;
* require all target endpoints for the initial Season 2 launch when the roadmap explicitly defers the feature.

`API_CONTRACTS.md` remains the contract authority. This file tracks implementation and proof.

---

# Part 1 - Authority

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/DEPLOYMENT.md
docs/07-testing/TESTING_STRATEGY.md
```

When this checklist and API Contracts differ, stop and reconcile the documents before implementation continues.

---

## Reviewed Basis

The compatibility inventory was reviewed from:

```text
Backend branch: stage2
Review date:    2026-07-18
```

Approved count:

```text
34 current route registrations
6 conditional debug routes
28 routes when MATCHUPS_DEBUG is disabled
```

The target catalogue is approved design. A target row marked `PLANNED` does not claim that code exists.

---

# Part 2 - Status Model

## Allowed Endpoint Statuses

| Status | Meaning |
| --- | --- |
| `PLANNED` | Approved contract exists; implementation has not started |
| `CHARACTERIZED` | Current compatibility behavior has automated evidence |
| `IMPLEMENTED` | Route and application path exist locally |
| `CONTRACT TESTED` | Request, response, error, permission, and safety tests pass |
| `FRONTEND CONNECTED` | Approved frontend caller uses the endpoint |
| `STAGING VERIFIED` | Deployed staging contract and security checks pass |
| `PRODUCTION VERIFIED` | Authorized read-only smoke or real workflow evidence passes |
| `RETIRED` | Compatibility endpoint is removed after every approved caller moved |
| `BLOCKED` | A named dependency or conflict prevents safe progress |

Only evidence-backed status changes are allowed.

---

## Current Inventory Status

Current compatibility rows begin as:

```text
EXISTS / CHARACTERIZATION REQUIRED
```

This records the reviewed route registration without falsely marking the endpoint tested.

---

## Target Inventory Status

Target rows begin as:

```text
PLANNED
```

Implementation proceeds in roadmap order, not table order.

---

# Part 3 - Evidence Required Per Endpoint

## Evidence Record

Each endpoint status update records:

```text
endpoint ID
method and path
repository
branch
commit or working-tree identity
implementation work-plan ID
test files
commands
passed, failed, and skipped counts
fixture and database identity
authorized actor
league and second-league fixture IDs
before/after data proof
response-schema evidence
Socket.IO or outbox evidence when applicable
frontend caller path when applicable
staging deploy ID when applicable
known risks
status
review date
```

Do not place cookies, CSRF values, passwords, tokens, active bid values, or secrets in the evidence record.

---

## Minimum Automated Proof

Every implemented endpoint tests the applicable items:

- [ ] Exact method and path are registered.
- [ ] Success status and response envelope match API Contracts.
- [ ] Required fields, types, units, and stable IDs match.
- [ ] Unknown fields and malformed input are rejected.
- [ ] Safe stable error code and request ID are returned.
- [ ] Unauthenticated access returns the approved result.
- [ ] Authorized role succeeds.
- [ ] Unauthorized role fails.
- [ ] Cross-league access fails without disclosing resource existence.
- [ ] Frozen-league behavior matches the feature.
- [ ] `If-Match` behavior passes when the aggregate is versioned.
- [ ] Idempotency replay and mismatched replay pass when required.
- [ ] Database changes are atomic.
- [ ] Failure and rollback leave state unchanged.
- [ ] Outbox and Socket.IO occur only after commit.
- [ ] Response and logs exclude secrets and private fields.
- [ ] Read behavior is proven not to mutate domain data.

`Not applicable` requires a short reason in the evidence.

---

## GET and HEAD Safety

For every read endpoint:

- [ ] No league-domain table changes.
- [ ] No file normalization or rewrite.
- [ ] No backup, snapshot, import, refresh, repair, or migration starts.
- [ ] No job occurrence advances.
- [ ] No League Activity entry is created.
- [ ] No outbox message or Socket.IO invalidation is emitted.
- [ ] The narrowly approved session `lastUsedAt` refresh, when present, remains separate from league-domain proof.

Before SQLite cutover, compare protected file hashes.

After SQLite cutover, compare domain transaction state or semantic table hashes.

---

## Material Write Safety

For every material write:

- [ ] CSRF is required for browser session requests.
- [ ] Actor identity and role come from the session and database.
- [ ] Body-supplied team, role, league, or ownership claims are ignored as authority.
- [ ] Validation finishes before mutation.
- [ ] Approved optimistic version is enforced.
- [ ] Approved idempotency key is scoped to actor, league, route, and payload.
- [ ] All related writes use one SQLite transaction.
- [ ] Constraint or service failure rolls back every change.
- [ ] Activity, Security Audit, notification, and outbox records follow their separate approved rules.
- [ ] One committed domain change produces at most one scoped invalidation.

---

# Part 4 - Current Compatibility Inventory

## Compatibility Gate

Compatibility endpoints preserve reviewed behavior during the backend refactor.

Characterization is not permission to expose them indefinitely. Current security gaps remain launch blockers until target endpoints replace them.

| ID | Method and path | Class | Current state | Required focused proof |
| --- | --- | --- | --- | --- |
| `C-001` | `GET /` | Public read | Exists; characterization required | Plain-text compatibility and no writes |
| `C-002` | `GET /health` | Public operational read | Exists; characterization required | Shape, no writes, document current path disclosure |
| `C-003` | `GET /api/league` | Broad public read | Exists; characterization required | Complete normalized shape and protected-file hash proof |
| `C-004` | `POST /api/league` | Broad compatibility write | Exists; characterization required | Shape, wipe/freeze guards, save behavior, event attempt, failure atomicity |
| `C-005` | `GET /api/players` | Public read | Exists; characterization required | Query and limit boundaries, response shape, no file change |
| `C-006` | `GET /api/players/debug` | Public debug read | Exists; characterization required | Exact current exposure and no writes |
| `C-007` | `GET /api/players/:id` | Public read | Exists; characterization required | Valid, malformed, missing ID, stable shape |
| `C-008` | `POST /api/players/reload` | Compatibility operation | Exists; characterization required | Cache replacement, source preservation, failure behavior |
| `C-009` | `GET /api/stats` | Public read | Exists; characterization required | Empty-cache, full-cache, one-player forms and no writes |
| `C-010` | `POST /api/stats/refresh` | Token operation | Exists; characterization required | Token rejection, last-valid-cache protection, failure atomicity |
| `C-011` | `GET /api/stats/debug` | Public debug read | Exists; characterization required | Exact current exposure and no writes |
| `C-012` | `GET /api/stats/debug-localpath` | Public debug read | Exists; characterization required | Exact current exposure and no writes |
| `C-013` | `GET /api/matchups/current` | Public calculated read | Exists; characterization required | Current week boundaries, server time, no writes |
| `C-014` | `GET /api/matchups/standings` | Public calculated read | Exists; characterization required | Current derived sort/result behavior and no writes |
| `C-015` | `GET /api/matchups/locks` | Public read | Exists; characterization required | Lock metadata shape and no writes |
| `C-016` | `GET /api/matchups/locks/preview` | Public preview | Exists; characterization required | Preview determinism and no lock mutation |
| `C-017` | `GET /api/matchups/baseline/preview` | Public preview | Exists; characterization required | Sample and readiness behavior, no baseline mutation |
| `C-018` | `GET /api/matchups/baseline/status` | Public read | Exists; characterization required | Gate state and no writes |
| `C-019` | `GET /api/matchups/scoring/preview` | Public preview | Exists; characterization required | Current baseline calculation and no writes |
| `C-020` | `GET /api/matchups/rollover/status` | Public read | Exists; characterization required | Eligibility/result state and no rollover |
| `C-021` | `POST /api/matchups/schedule/generate` | Compatibility write | Exists; characterization required | Role metadata, replacement/clear behavior, invalid request rollback |
| `C-022` | `POST /api/matchups/schedule/updateWeek` | Compatibility write | Exists; characterization required | Boundary validation, future-week constraints, failure rollback |
| `C-023` | `POST /api/matchups/schedule/shiftFrom` | Compatibility write | Exists; characterization required | Deterministic shift, preserved earlier weeks, failure rollback |
| `C-024` | `GET /api/matchups/debug/stateSummary` | Conditional debug read | Exists only with flag; characterization required | Registration count, safe fixture only, no writes |
| `C-025` | `POST /api/matchups/debug/resetLocks` | Conditional destructive debug | Exists only with flag; characterization required | Isolated fixture, exact clearing behavior, never production |
| `C-026` | `POST /api/matchups/debug/resetBaselineForWeek` | Conditional destructive debug | Exists only with flag; characterization required | Isolated fixture, exact week deletion, never production |
| `C-027` | `POST /api/matchups/debug/captureBaselineNow` | Conditional debug job | Exists only with flag; characterization required | Job invocation and idempotency on fixture, never production |
| `C-028` | `POST /api/matchups/debug/runLockNow` | Conditional debug job | Exists only with flag; characterization required | Job invocation and idempotency on fixture, never production |
| `C-029` | `POST /api/matchups/debug/setTeamRosterEmpty` | Conditional destructive debug | Exists only with flag; characterization required | Fixture mutation boundaries and never production |
| `C-030` | `GET /api/snapshots` | Public operational read | Exists; characterization required | Listing shape, no writes, current exposure |
| `C-031` | `POST /api/snapshots/create` | Public compatibility operation | Exists; characterization required | Snapshot name, contents, failure behavior, source unchanged |
| `C-032` | `POST /api/snapshots/restore` | Public destructive operation | Exists; characterization required | Isolated fixture only, restore/activity/event behavior, pre/post hashes |
| `C-033` | `GET /api/backups?limit=50` | Public operational read | Exists; characterization required | Limit/list shape, current path exposure, no writes |
| `C-034` | `POST /api/backups/restore` | Compatibility destructive operation | Exists; characterization required | Isolated fixture only, role metadata, restore/save/activity/event behavior |

---

## BR-00 Compatibility Completion

Backend Refactor `BR-00` may mark a compatibility row `CHARACTERIZED` only when:

* its route registration is in the exact manifest;
* a representative success response passes;
* applicable failure behavior passes;
* GET/read file-hash proof passes;
* write tests use explicit temporary fixture paths;
* no current production or repository data changes.

Debug rows also prove:

```text
MATCHUPS_DEBUG=false -> 28 registered routes
MATCHUPS_DEBUG=true  -> 34 registered routes
```

---

# Part 5 - Target Session Endpoints

All target rows in Parts 5 through 17 begin `PLANNED`.

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-001` | `POST /api/v1/accounts` | Rate limits, matching password fields, unique normalized email/display name, no granted membership | `PLANNED` |
| `T-002` | `POST /api/v1/accounts/email-verifications` | Single-use token, expiry, atomic activation and initial session | `PLANNED` |
| `T-003` | `POST /api/v1/accounts/email-verification-requests` | Non-enumeration, replacement invalidates prior live link, rate limit | `PLANNED` |
| `T-004` | `POST /api/v1/session` | Generic failure, rate limit, password verification, one active session | `PLANNED` |
| `T-005` | `GET /api/v1/session` | Safe user and membership bootstrap, CSRF bootstrap, no credential fields | `PLANNED` |
| `T-006` | `DELETE /api/v1/session` | Current session revoked, cookie cleared, Socket.IO disconnected | `PLANNED` |
| `T-007` | `POST /api/v1/session/password` | Current-password check, matching new fields, all sessions revoked, signed-out response | `PLANNED` |
| `T-008` | `POST /api/v1/password-reset-requests` | Non-enumeration, 30-minute single-use token, rate limit | `PLANNED` |
| `T-009` | `POST /api/v1/password-resets` | Token expiry/use, matching password fields, session revocation, no automatic sign-in | `PLANNED` |
| `T-010` | `PATCH /api/v1/account` | `If-Match`, unique display name, safe self-only fields | `PLANNED` |
| `T-011` | `POST /api/v1/account/deactivation` | Current password, typed confirmation, membership effects, session revocation | `PLANNED` |
| `T-012` | `POST /api/v1/account/reactivation-requests` | Non-enumeration, rate limit, single live link | `PLANNED` |
| `T-013` | `POST /api/v1/account/reactivations` | Token and current password, no session creation, restored allowed state only | `PLANNED` |

---

# Part 6 - Target Platform Administration Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-014` | `GET /api/v1/admin/users` | Platform administrator only, pagination/search, no credential hashes | `PLANNED` |
| `T-015` | `POST /api/v1/admin/users` | Unique identity, no operator-known password, audited creation | `PLANNED` |
| `T-016` | `GET /api/v1/admin/users/:userId` | Safe profile only, malformed/missing ID behavior | `PLANNED` |
| `T-017` | `PATCH /api/v1/admin/users/:userId` | Approved fields, version conflict, status invariants | `PLANNED` |
| `T-018` | `POST /api/v1/admin/users/:userId/credential-setup-requests` | 72-hour single-use link, replacement, no password disclosure | `PLANNED` |
| `T-019` | `POST /api/v1/admin/users/:userId/password-reset-requests` | Admin initiates email only, cannot set/view password | `PLANNED` |
| `T-020` | `POST /api/v1/admin/leagues` | League and initial season atomic, unique stable IDs, creator receives no hidden membership | `PLANNED` |
| `T-021` | `POST /api/v1/admin/leagues/:leagueId/commissioner-assignments` | Existing user, proposal not active authority, notification/outbox | `PLANNED` |
| `T-022` | `DELETE /api/v1/admin/leagues/:leagueId` | Protected request, typed confirmation, backup, idempotent approved workflow | `PLANNED` |
| `T-023` | `GET /api/v1/admin/requests` | Safe pagination and status filter, no protected payload leakage | `PLANNED` |
| `T-024` | `GET /api/v1/admin/requests/:requestId` | Safe review context and inaccessible-resource behavior | `PLANNED` |
| `T-025` | `POST /api/v1/admin/requests/:requestId/approve` | Strong reauthentication, status race, one execution, Security Audit | `PLANNED` |
| `T-026` | `POST /api/v1/admin/requests/:requestId/decline` | Recorded reason, final-state race, notification | `PLANNED` |
| `T-027` | `GET /api/v1/admin/security-audit` | Platform-only pagination, safe metadata, read-only proof | `PLANNED` |

---

# Part 7 - Target League Discovery and Settings Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-028` | `GET /api/v1/public/leagues` | Active discoverable leagues only, public projection, noindex metadata | `PLANNED` |
| `T-029` | `GET /api/v1/public/leagues/:leagueId` | Discoverability rule, public fields only, missing/private behavior | `PLANNED` |
| `T-030` | `GET /api/v1/public/leagues/:leagueId/teams` | Public team projection only, no membership data | `PLANNED` |
| `T-031` | `GET /api/v1/leagues` | Only caller-visible leagues, no cross-user leakage | `PLANNED` |
| `T-032` | `GET /api/v1/leagues/:leagueId` | Membership authorization, safe active season summary | `PLANNED` |
| `T-033` | `GET /api/v1/leagues/:leagueId/settings` | Effective settings, member-only, no secret configuration | `PLANNED` |
| `T-034` | `PATCH /api/v1/leagues/:leagueId/settings` | Platform admin only, commissioners denied, `If-Match`, editable allowlist | `PLANNED` |
| `T-035` | `PUT /api/v1/leagues/:leagueId/setup/trade-deadline` | Commissioner during Setup only, informational setting, no hidden event | `PLANNED` |
| `T-036` | `POST /api/v1/leagues/:leagueId/start` | Minimum four teams, invitation readiness, one atomic transition | `PLANNED` |
| `T-037` | `POST /api/v1/leagues/:leagueId/lifecycle-transitions` | Transition-specific role and state machine, idempotency | `PLANNED` |
| `T-038` | `POST /api/v1/leagues/:leagueId/freeze` | Commissioner, approved write families blocked, activity/audit rules | `PLANNED` |
| `T-039` | `DELETE /api/v1/leagues/:leagueId/freeze` | Commissioner, exact prior state, idempotent unfreeze | `PLANNED` |

---

# Part 8 - Target Membership and Team Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-040` | `GET /api/v1/leagues/:leagueId/memberships` | Commissioner only, safe user projection, league isolation | `PLANNED` |
| `T-041` | `POST /api/v1/leagues/:leagueId/invitations` | Existing user, no premature authority, expiry and notification | `PLANNED` |
| `T-042` | `GET /api/v1/league-invitations/:invitationId` | Invited user only, safe league/team context | `PLANNED` |
| `T-043` | `POST /api/v1/league-invitations/:invitationId/accept` | One use, membership/team workflow atomic, conflict behavior | `PLANNED` |
| `T-044` | `POST /api/v1/league-invitations/:invitationId/decline` | Invited user only, final status, no membership | `PLANNED` |
| `T-045` | `PATCH /api/v1/leagues/:leagueId/memberships/:membershipId` | Commissioner, approved status/role fields, last-commissioner protection | `PLANNED` |
| `T-046` | `DELETE /api/v1/leagues/:leagueId/memberships/:membershipId` | Product constraints, assignment effects, session authorization refresh | `PLANNED` |
| `T-047` | `GET /api/v1/leagues/:leagueId/teams` | Member-only list, stable IDs, league isolation | `PLANNED` |
| `T-048` | `POST /api/v1/leagues/:leagueId/teams` | Commissioner, non-live-season restriction, stable identity | `PLANNED` |
| `T-049` | `GET /api/v1/leagues/:leagueId/teams/:teamId` | Safe member projection, team belongs to league | `PLANNED` |
| `T-050` | `PATCH /api/v1/leagues/:leagueId/teams/:teamId` | Manager field allowlist versus commissioner fields, `If-Match` | `PLANNED` |
| `T-125` | `GET /api/v1/leagues/:leagueId/teams/:teamId/logo` | Member-only exact-team BLOB read, inspected media, no-store, strictly read-only | `PLANNED` |
| `T-051` | `POST /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment` | Commissioner, one active assignment, user membership constraints | `PLANNED` |
| `T-052` | `DELETE /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment` | Commissioner, no unauthorized team control remains | `PLANNED` |
| `T-053` | `DELETE /api/v1/leagues/:leagueId/teams/:teamId` | Commissioner request plus admin approval, no live-season deletion, backup | `PLANNED` |
| `T-054` | `GET /api/v1/commissioner-assignments/:assignmentId` | Proposed user only, safe details | `PLANNED` |
| `T-055` | `POST /api/v1/commissioner-assignments/:assignmentId/accept` | One use, commissioner membership/role atomic | `PLANNED` |
| `T-056` | `POST /api/v1/commissioner-assignments/:assignmentId/decline` | Proposed user only, no authority granted | `PLANNED` |

---

# Part 9 - Target Player and Statistics Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-057` | `GET /api/v1/players` | Cursor pagination, query/filter limits, stable provider mapping | `PLANNED` |
| `T-058` | `GET /api/v1/players/:playerId` | Stable global player identity, no league-private fields | `PLANNED` |
| `T-059` | `GET /api/v1/players/:playerId/statistics` | Season totals and integer-hundredths FP, last-valid data | `PLANNED` |
| `T-060` | `GET /api/v1/leagues/:leagueId/players/:playerId` | League ownership/eligibility/contract projection, cross-league denial | `PLANNED` |
| `T-061` | `POST /api/v1/operations/players/import` | Platform admin, durable/idempotent import, validation report, provider failure | `PLANNED` |
| `T-062` | `POST /api/v1/operations/statistics/refresh` | Platform admin, durable occurrence, last-valid-cache preservation | `PLANNED` |
| `T-063` | `GET /api/v1/operations/statistics/refreshes/:jobId` | Platform admin, safe job state, no provider-secret leakage | `PLANNED` |

---

# Part 10 - Target Roster and Cap Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-064` | `GET /api/v1/public/leagues/:leagueId/teams/:teamId/roster` | Exact public projection, no private fields, no normalization write | `PLANNED` |
| `T-065` | `GET /api/v1/leagues/:leagueId/teams/:teamId/roster` | Groups, slots, ownership, contracts, cap and legality reconcile | `PLANNED` |
| `T-066` | `GET /api/v1/leagues/:leagueId/teams/:teamId/roster/legality` | Complete authoritative reasons, strictly read-only | `PLANNED` |
| `T-067` | `POST /api/v1/leagues/:leagueId/teams/:teamId/roster-moves` | Team control, group/slot rules, prospect no-return rule, warning behavior | `PLANNED` |
| `T-068` | `POST /api/v1/leagues/:leagueId/teams/:teamId/prospects/:playerId/sign` | Drafted/right eligibility, `$3/3y` ELC, off-cap prospect retention | `PLANNED` |
| `T-069` | `POST /api/v1/leagues/:leagueId/teams/:teamId/prospects/:playerId/decline` | Eligible signed prospect and irreversible approved result | `PLANNED` |
| `T-070` | `DELETE /api/v1/leagues/:leagueId/teams/:teamId/prospect-rights/:playerId` | Rights ownership, player release, pending-asset effects | `PLANNED` |

---

# Part 11 - Target Contract, Retention, and Buyout Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-071` | `GET /api/v1/leagues/:leagueId/teams/:teamId/contracts` | Current contracts only, integer money, remaining years | `PLANNED` |
| `T-072` | `GET /api/v1/leagues/:leagueId/contracts/:contractId` | League ownership and remaining schedule, no expired/bought-out display | `PLANNED` |
| `T-073` | `GET /api/v1/leagues/:leagueId/teams/:teamId/cap-obligations` | Retention and buyout schedules reconcile by season | `PLANNED` |
| `T-074` | `POST /api/v1/leagues/:leagueId/contracts/:contractId/buyout` | Owner, 14-day lock, 25% full AAV schedule, release and trade cancellation atomic | `PLANNED` |
| `T-075` | `POST /api/v1/leagues/:leagueId/contracts/:contractId/corrections` | Commissioner, explicit before/after version, no hidden extension | `PLANNED` |

---

# Part 12 - Target Auction and Bid Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-076` | `GET /api/v1/leagues/:leagueId/auctions` | Active only, own safe state, no competing values | `PLANNED` |
| `T-077` | `POST /api/v1/leagues/:leagueId/auctions` | Monday-through-Thursday creation window, eligibility, initiating minimum | `PLANNED` |
| `T-078` | `GET /api/v1/leagues/:leagueId/auctions/:auctionId` | Timing and own bid only, commissioner sees no bid values | `PLANNED` |
| `T-079` | `PUT /api/v1/leagues/:leagueId/auctions/:auctionId/bids/mine` | Team control, joining minimum by term, cooldown/edit rules, no withdrawal | `PLANNED` |
| `T-080` | `PATCH /api/v1/leagues/:leagueId/auctions/:auctionId/bids/:bidId` | Commissioner identifies bid without reading stored value/term, logged replacement | `PLANNED` |
| `T-081` | `DELETE /api/v1/leagues/:leagueId/auctions/:auctionId/bids/:bidId` | Commissioner confirmation, stable bid ID, no value disclosure | `PLANNED` |
| `T-082` | `POST /api/v1/leagues/:leagueId/auctions/:auctionId/cancel` | Commissioner confirmation, unresolved only, notification/activity | `PLANNED` |
| `T-083` | `POST /api/v1/leagues/:leagueId/auctions/:auctionId/resolve` | Durable job/recovery authority, anti-bluff price, contract/ownership/activity atomic, one resolution | `PLANNED` |

---

# Part 13 - Target Trade Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-084` | `GET /api/v1/leagues/:leagueId/trades` | Authorized team views, allowed league views, private proposal isolation | `PLANNED` |
| `T-085` | `POST /api/v1/leagues/:leagueId/trades` | Typed assets, no premature reservation, deadline and ownership validation | `PLANNED` |
| `T-086` | `GET /api/v1/leagues/:leagueId/trades/:tradeId` | Participant or commissioner safe view, no cross-team private leakage | `PLANNED` |
| `T-087` | `POST /api/v1/leagues/:leagueId/trades/:tradeId/accept` | Receiver only, full in-transaction revalidation, atomic transfer and invalidations | `PLANNED` |
| `T-088` | `POST /api/v1/leagues/:leagueId/trades/:tradeId/decline` | Receiver only, final state and notification | `PLANNED` |
| `T-089` | `POST /api/v1/leagues/:leagueId/trades/:tradeId/cancel` | Proposer only, completed/final-state conflict behavior | `PLANNED` |

---

# Part 14 - Target Matchup and Standings Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-090` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks` | Persisted schedule only, season/league match, read-only | `PLANNED` |
| `T-091` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/current` | Server-authoritative week and boundaries, read-only | `PLANNED` |
| `T-092` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId` | Pairings, status, stable IDs, read-only | `PLANNED` |
| `T-093` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId/matchups/:matchupId` | Matchup-period G/A/points/FP from zero baseline only | `PLANNED` |
| `T-094` | `GET /api/v1/leagues/:leagueId/seasons/:seasonId/standings` | Finalized results only, approved sorting, no write/rebuild | `PLANNED` |
| `T-095` | `POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-schedules` | Commissioner before season, balanced schedule, no live-team changes | `PLANNED` |
| `T-096` | `PATCH /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId` | Commissioner future timing/pairing constraints, `If-Match` | `PLANNED` |
| `T-097` | `POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-results/:resultId/corrections` | Commissioner, append version, attributable, no League Activity | `PLANNED` |
| `T-098` | `POST /api/v1/leagues/:leagueId/seasons/:seasonId/standings/rebuilds` | Commissioner recovery, official result versions only, no League Activity | `PLANNED` |

---

# Part 15 - Target Entry Draft Endpoints

These endpoints are approved in-season work and are not required for the initial Season 2 launch unless the roadmap promotes them.

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-099` | `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId` | Safe configuration/status, league isolation | `PLANNED` |
| `T-100` | `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/order` | One immutable four-round order and fixed finalist positions | `PLANNED` |
| `T-101` | `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligible-players` | Confirmed eligibility snapshot, F/D only, search pagination | `PLANNED` |
| `T-102` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligibility-snapshots` | Commissioner import/preview, versioned pool, no live replacement | `PLANNED` |
| `T-103` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligibility-snapshots/:snapshotId/confirm` | Commissioner, one frozen pool, validation report | `PLANNED` |
| `T-104` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/lottery-runs` | Commissioner, secure randomness evidence, two draws, one immutable result | `PLANNED` |
| `T-105` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/start` | Commissioner, confirmed order/pool, one transition | `PLANNED` |
| `T-106` | `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/queue` | Manager sees only own team queue | `PLANNED` |
| `T-107` | `PUT /api/v1/leagues/:leagueId/entry-drafts/:draftId/queue` | Own team only, ordered replacement, `If-Match` | `PLANNED` |
| `T-108` | `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/selections` | On-clock manager or timeout job, immutable selection, auto-BPA, clock-reset rules | `PLANNED` |

---

# Part 16 - Target Activity and Notification Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-109` | `GET /api/v1/leagues/:leagueId/activity` | Cursor pagination, approved event types, no matchup/standings entries | `PLANNED` |
| `T-110` | `GET /api/v1/leagues/:leagueId/security-audit` | Approved league-member safe view, protected metadata, read-only | `PLANNED` |
| `T-111` | `GET /api/v1/notifications` | Caller-owned notifications only, listing does not mark read | `PLANNED` |
| `T-112` | `POST /api/v1/notifications/:notificationId/read` | Owner only, idempotent read transition | `PLANNED` |
| `T-113` | `POST /api/v1/notifications/read-all` | Caller scope only, bounded update, idempotent | `PLANNED` |

---

# Part 17 - Target Operations, Backup, and Recovery Endpoints

| ID | Method and path | Key proof beyond global matrix | Status |
| --- | --- | --- | --- |
| `T-114` | `GET /api/v1/health/live` | Minimal public process liveness, no dependency details | `PLANNED` |
| `T-115` | `GET /api/v1/health/ready` | Minimal readiness, no paths/secrets/private state | `PLANNED` |
| `T-116` | `GET /api/v1/operations/health` | Platform admin, safe build/schema/job/backup details, read-only | `PLANNED` |
| `T-117` | `GET /api/v1/operations/backups` | Platform admin, safe metadata, no raw paths or keys | `PLANNED` |
| `T-118` | `POST /api/v1/operations/backups` | Platform admin, online verified encrypted offsite backup, idempotent job | `PLANNED` |
| `T-119` | `POST /api/v1/operations/restores` | Platform admin plus approved plan, maintenance and pre-restore backup | `PLANNED` |
| `T-120` | `GET /api/v1/operations/restores/:restoreId` | Platform admin, safe status and verification, no artifact access | `PLANNED` |
| `T-121` | `GET /api/v1/leagues/:leagueId/recovery` | Commissioner, safe league context only, read-only | `PLANNED` |
| `T-122` | `POST /api/v1/leagues/:leagueId/backups` | Commissioner request, platform-level artifact hidden, verified status | `PLANNED` |
| `T-123` | `POST /api/v1/leagues/:leagueId/restoration-requests` | Commissioner request only, awaiting administrator approval, no mutation | `PLANNED` |
| `T-124` | `POST /api/v1/leagues/:leagueId/recovery/actions` | Commissioner approved action allowlist, explicit correction/audit boundaries | `PLANNED` |

---

# Part 18 - Cross-Cutting Contract Matrices

## Authentication Matrix

For each authorization class:

| Class | Required checks |
| --- | --- |
| Public | Rate limit where applicable, generic errors, no private data, Origin policy where applicable |
| Authenticated | Missing, expired, replaced, revoked, deactivated, and valid session |
| League member | No membership, inactive membership, other league, active membership |
| Team manager | Wrong team, ended assignment, commissioner without team control, correct assignment |
| Commissioner | Other league, inactive commissioner, permitted operation, manager-only boundary |
| Platform administrator | Normal user denied, active admin allowed, league membership still required for internal league operation |
| System job | No browser invocation, occurrence identity, lease, idempotency, recovery authority |

---

## League-Isolation Matrix

Every private league endpoint uses at least two fixture leagues with:

* the same team display name;
* the same player pool;
* overlapping user display names;
* similar contracts and transactions;
* different stable IDs.

Tests attempt:

- [ ] League A session with League B URL.
- [ ] League A resource ID under League B URL.
- [ ] Team A ID under League B.
- [ ] Season A ID under League B.
- [ ] Guessable and malformed IDs.
- [ ] Body-supplied League A ID with League B URL.
- [ ] Socket room subscription to League B.
- [ ] notification or request ID owned by another user.

Private-resource probing returns the approved `404` without disclosing existence.

---

## Response Matrix

Every target response proves:

- [ ] `camelCase`.
- [ ] integer cents for money.
- [ ] integer hundredths for persisted fantasy points.
- [ ] epoch milliseconds for instants.
- [ ] stable opaque IDs.
- [ ] `data` plus safe `meta` success envelope.
- [ ] stable error code, safe message, optional safe details, and request ID.
- [ ] no credential hashes or account-action tokens.
- [ ] no internal paths or stack traces.
- [ ] no active competing auction-bid values.
- [ ] correct `Cache-Control`.
- [ ] cursor pagination where catalogued.

---

## Concurrency Matrix

Applicable endpoints test:

- [ ] Two writers using the same version.
- [ ] Stale `If-Match`.
- [ ] Same idempotency key and same payload.
- [ ] Same idempotency key and different payload.
- [ ] Duplicate request after response loss.
- [ ] Concurrent auction resolution.
- [ ] Concurrent trade acceptance for overlapping assets.
- [ ] Concurrent job lease acquisition.
- [ ] Transaction rollback before outbox commit.
- [ ] Socket.IO event count after commit and rollback.

---

# Part 19 - Feature Completion Gate

## Ready for Frontend

An endpoint may be marked `FRONTEND CONNECTED` only when:

* service and repository behavior is implemented;
* contract tests pass;
* authorization and two-league isolation pass;
* error codes are stable;
* response projection is approved;
* frontend HTTP client uses the target path;
* frontend does not reproduce authorization or authoritative calculations;
* compatibility rollback remains available.

---

## Ready for Staging

An endpoint may be marked `STAGING VERIFIED` only when:

* exact backend and frontend deploy IDs are recorded;
* real deployed CORS, cookies, CSRF, and Socket.IO pass;
* staging database and environment identity are correct;
* two-league tests pass;
* affected Playwright workflow passes;
* provider, email, job, backup, or recovery integration passes when applicable;
* no production resource is reachable.

---

## Ready for Production

An endpoint may be marked `PRODUCTION VERIFIED` only when:

* release authority exists;
* release checklist passes;
* staging evidence applies to the exact commits;
* production automated smoke remains read-only;
* any real write is an authorized normal user or administrator action;
* monitoring and rollback evidence are recorded.

---

## Compatibility Retirement

A current endpoint may be marked `RETIRED` only when:

* every caller moved to target endpoints;
* frontend fallback is disabled and verified in staging;
* no job, script, or operations tool still uses it;
* target behavior has production evidence;
* rollback no longer requires the compatibility route;
* API Contracts and this checklist are updated;
* route, service glue, tests, and exposed configuration are removed in a focused cleanup.

Debug mutation routes are removed rather than promoted to production.

---

# Part 20 - Checklist Maintenance

## Update Procedure

At the end of an endpoint work-plan step:

1. update only the affected rows;
2. link the exact automated-test evidence;
3. record frontend and staging evidence when applicable;
4. keep unrelated rows unchanged;
5. reconcile any contract change with `API_CONTRACTS.md`;
6. report remaining failed, skipped, or untested cases;
7. review the next active work-plan item.

Do not mark an entire feature family complete because one endpoint passed.

---

## Adding an Endpoint

A new endpoint requires:

1. approved product need;
2. API Contracts update;
3. stable method, path, authorization, request, response, errors, idempotency, and version rules;
4. a new permanent checklist ID;
5. tests;
6. frontend and deployment order when applicable.

Removed IDs are not reused.

---

## Count Verification

Current compatibility inventory:

```text
C-001 through C-034 = 34 routes
C-024 through C-029 = 6 conditional debug routes
```

Target catalogue:

```text
T-001 through T-125 = 125 approved target routes
```

Count changes require a matching API Contracts review.

---

# Part 21 - Completion Criteria

The endpoint foundation is complete for initial launch when:

* every launch-critical target row has at least `STAGING VERIFIED`;
* every active compatibility endpoint is characterized;
* every retired compatibility endpoint meets the retirement gate;
* public endpoints expose only approved fields;
* private endpoints pass authentication and two-league isolation;
* manager, commissioner, platform-administrator, and system-job boundaries pass;
* reads are proven read-only;
* material writes are transactional, versioned, and idempotent where required;
* active bids remain secret;
* matchup and standings operations remain outside League Activity;
* Socket.IO invalidation follows commit and stays league-scoped;
* debug and destructive compatibility routes are unavailable in production;
* no unexplained skipped launch-critical endpoint test remains.

Entry Draft rows may remain `PLANNED` for the initial release because that feature is approved for in-season completion.

---

# Verification

Documentation verification:

```powershell
Get-Content docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
Select-String -Path docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md -Pattern '^`APPROVED`$','C-034','T-125','GET and HEAD Safety','Compatibility Retirement','Count Verification'
```

Future compatibility manifest verification:

```powershell
# Backend repository
npm run test:characterization
```

Future full backend verification:

```powershell
# Backend repository
npm test
```

Expected:

* the current manifest proves 34 routes with debug enabled and 28 without it;
* target endpoint status changes include actual commands and results;
* all fixtures and databases are synthetic or temporary;
* no test reads from or writes to production storage.
