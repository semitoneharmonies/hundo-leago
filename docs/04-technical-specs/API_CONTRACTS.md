# Hundo Leago - API Contracts

## Document Status

`APPROVED`

This technical specification defines:

* the HTTP and Socket.IO contract rules for Hundo Leago Season 2;
* the current endpoint inventory that must remain observable during the behaviour-preserving backend refactor;
* the approved target API families for accounts, leagues, rosters, contracts, auctions, trades, matchups, standings, drafts, history, notifications, and operations;
* authentication, authorization, league-isolation, validation, concurrency, idempotency, error, pagination, and compatibility conventions;
* technical decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the API-contract decisions and approved adoption of the resulting design on 2026-07-18.

---

## Technical Purpose

The API is the authoritative boundary between the React frontend and the Node.js backend.

It must prevent:

* browser-controlled authorization;
* complete-league replacement during ordinary feature writes;
* cross-league reads or writes;
* hidden writes during read requests;
* stale updates overwriting newer state;
* duplicate transactions after retries;
* active auction-bid disclosure;
* debug or recovery controls being exposed in production;
* private data being sent through broad Socket.IO messages;
* accidental dependence on undocumented response shapes.

This document is both:

1. a compatibility inventory for the current backend; and
2. the approved contract for the target Season 2 API.

Current endpoints remain current facts until intentionally replaced. Target endpoints are not evidence that they have already been implemented.

---

## Out of Scope

This document does not define:

* exact SQLite DDL;
* password-hashing parameters;
* cookie names or cryptographic secret values;
* database-migration commands;
* visual page layout;
* external NHL provider URLs;
* deployment commands;
* league rules already defined in approved rule and product specifications.

Those details belong in Data Model, Security, SQLite Migration, Frontend Structure, Deployment, Environment Setup, and feature specifications.

---

# Part 1 - Authority and Review Basis

## Source Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
```

Approved product behaviour remains authoritative. The API exposes that behaviour without inventing a second set of league rules.

---

## Code Reviewed

The current contract inventory was derived from the local branches:

```text
Frontend: docs/summer-2026-foundation
Backend:  stage2
```

Primary files reviewed:

```text
hundo-leago/src/App.jsx
hundo-leago/src/components/CommissionerPanel.jsx
hundo-leago/src/pages/MatchupsPage.jsx
hundo-leago/src/pages/StandingsPage.jsx
hundo-leago-backend/server.js
hundo-leago-backend/leagueStore.js
hundo-leago-backend/routes/healthRoutes.js
hundo-leago-backend/routes/leagueReadRoutes.js
hundo-leago-backend/routes/playersReadRoutes.js
```

Review date:

```text
2026-07-18
```

The current backend inventory contains:

```text
34 HTTP route registrations, including 6 conditional matchup-debug routes
1 broad Socket.IO invalidation event name
4 one-minute scheduled polling loops when all features are enabled
1 one-minute weekly-snapshot loop
1 one-minute auction-resolution loop
```

With `MATCHUPS_DEBUG` disabled, the six conditional debug registrations are absent and 28 HTTP endpoints are available.

---

# Part 2 - Contract Layers

## Current Compatibility Layer

Existing unversioned endpoints under `/api/*` are the compatibility layer.

During the behaviour-preserving refactor:

* their methods and paths remain unchanged;
* successful response shapes remain unchanged;
* current error status and body shapes remain unchanged unless a verified defect fix is separately approved;
* read-only endpoints remain read-only;
* existing frontend callers continue to work;
* extracted code must not silently add authentication, league scoping, or new business rules;
* known security and behaviour gaps remain documented and are corrected in deliberate later steps.

Compatibility does not mean the endpoints are suitable for Season 2 production.

---

## Target Season 2 Layer

New target endpoints use:

```text
/api/v1
```

Private league resources use:

```text
/api/v1/leagues/:leagueId/...
```

Platform-administrator resources use:

```text
/api/v1/admin/...
```

Operations resources use:

```text
/api/v1/operations/...
```

The target API is introduced feature by feature. The frontend moves to a target endpoint before the corresponding compatibility write is retired.

There is no permanent mixed-authority state in which both APIs may independently change the same feature without coordination.

---

# Part 3 - General Target Conventions

## Transport

* Production and staging use HTTPS.
* JSON is the normal request and response format.
* UTF-8 is required.
* Request bodies use `Content-Type: application/json`.
* The maximum ordinary JSON body is `1 MiB`.
* Larger approved imports use purpose-specific limits and administrator-only endpoints.
* Compression may be enabled at the HTTP layer but does not change payload meaning.

---

## Resource Identity

* Internal IDs are opaque UUID strings.
* Clients do not derive meaning from an ID.
* Display names are never authorization or relationship keys.
* External NHL IDs are returned in explicit provider fields rather than used as Hundo Leago primary IDs.
* Every league-specific URL includes the stable `leagueId`.
* Team-specific URLs use stable `teamId`.
* Season-dependent resources use stable `seasonId` where the active season cannot be inferred safely.

---

## Field Naming

Target JSON uses `camelCase`.

Examples:

```json
{
  "leagueId": "opaque-uuid",
  "createdAt": 1784371200000,
  "aavCents": 150,
  "fantasyPointsHundredths": 725
}
```

Database column names remain an internal repository concern and may use `snake_case`.

---

## Time

* Event timestamps are UTC Unix milliseconds.
* Persisted schedule boundaries are returned exactly as stored.
* League timezones use IANA names such as `America/Vancouver`.
* The backend performs timezone calculations.
* Clients may format timestamps for display but do not recalculate authoritative boundaries.

---

## Money and Fantasy Points

* Money fields use integer cents.
* Persisted fantasy points use integer hundredths.
* Target write payloads do not accept binary floating-point money as authoritative input.
* Display strings such as `$1.50` may be returned as conveniences but do not replace integer source fields.
* Total contract value, term, and AAV are validated by the backend.

---

## Success Envelopes

A target response returns a resource-specific object under `data`.

Single-resource example:

```json
{
  "data": {
    "id": "opaque-uuid",
    "version": 4
  },
  "meta": {
    "requestId": "opaque-request-id"
  }
}
```

Collection example:

```json
{
  "data": [
    {
      "id": "opaque-uuid"
    }
  ],
  "page": {
    "nextCursor": null,
    "hasMore": false
  },
  "meta": {
    "requestId": "opaque-request-id"
  }
}
```

`204 No Content` may be used for a successful command that has no useful response representation.

---

## Error Envelope

All target errors use:

```json
{
  "error": {
    "code": "ROSTER_ILLEGAL",
    "message": "The roster is illegal.",
    "details": {
      "reasons": []
    },
    "requestId": "opaque-request-id"
  }
}
```

Rules:

* `code` is a stable machine-readable identifier.
* `message` is safe and understandable to a user.
* `details` is optional structured context.
* `requestId` connects the response to safe server logs.
* stack traces, filesystem paths, secrets, password hashes, active competing bids, and private cross-league data are never returned.

---

## HTTP Statuses

| Status | Target meaning |
|---|---|
| `200` | Successful read or command with a response body |
| `201` | Resource created |
| `202` | Durable asynchronous operation accepted |
| `204` | Successful command with no response body |
| `400` | Malformed request or unsupported parameter combination |
| `401` | No valid authenticated session |
| `403` | Authenticated but not authorized |
| `404` | Resource does not exist in the authorized scope |
| `409` | State, idempotency, duplicate, or lifecycle conflict |
| `412` | Optimistic version precondition failed |
| `422` | Well-formed request violates feature validation |
| `423` | League or feature is frozen |
| `429` | Rate limit exceeded |
| `500` | Unexpected internal failure |
| `502` | Required external provider failed |
| `503` | Application or dependency temporarily unavailable |

Cross-league resource probing returns `404` rather than confirming that a private resource exists elsewhere.

---

## Validation

* Unknown top-level write fields are rejected.
* Required strings are trimmed and length-limited.
* Enumerations are allowlisted.
* IDs must be syntactically valid before repository access.
* Numeric values must be finite integers in their documented units.
* Arrays have explicit maximum lengths.
* Validation occurs before any state change.
* Business validation occurs inside the feature service and transaction.
* Frontend validation is only a usability aid.

---

## Authentication and Session Transport

Target browser authentication uses a backend-managed session cookie.

* The cookie is `HttpOnly`, `Secure` in non-local environments, and appropriately `SameSite`.
* Frontend requests use `credentials: "include"`.
* Authorization is derived from the authenticated session and database memberships.
* Roles, team identity, league identity, and actor names supplied in request bodies are never trusted.
* State-changing browser requests use the request-forgery protection defined by Security.
* Public self-service account creation exists, but it creates no league, membership, role, or team.

---

## Authorization

Authorization is checked in this order:

1. authenticate the session;
2. load the requested league;
3. load the user membership;
4. confirm the required platform or league role;
5. confirm team authority where applicable;
6. confirm resource ownership and same-league relationships;
7. execute feature validation.

The response includes only information the caller may view.

Commissioners cannot view active bid values.

---

## Optimistic Concurrency

Mutable aggregate responses include:

```json
{
  "version": 4
}
```

Updates send:

```text
If-Match: "4"
```

The backend:

* updates only when the stored version matches;
* increments the version on success;
* returns `412 PRECONDITION_FAILED` for a stale version;
* returns the current safe version and a refetch instruction;
* never merges a stale complete object over newer state.

Create-only commands do not require `If-Match` unless their parent aggregate requires it.

---

## Idempotency

Retryable target writes use:

```text
Idempotency-Key: client-generated-opaque-value
```

The key is required for:

* account or league creation;
* bids;
* trade proposals and acceptance;
* buyouts;
* draft selections;
* commissioner corrections;
* restore requests;
* manual job execution;
* other writes capable of creating duplicate financial, ownership, or history effects.

The server scopes the key by actor, league, and operation.

Reusing a key with the same request returns the original result. Reusing it with a different request returns `409 IDEMPOTENCY_KEY_REUSED`.

---

## Pagination, Filtering, and Sorting

* Cursor pagination is used for mutable or large collections.
* Default page size is `50`.
* Maximum page size is `100`.
* Player search may use a purpose-specific maximum of `100`.
* Unpaginated player preloading is not part of the target contract.
* Sort keys are allowlisted.
* Default ordering is stable and includes an ID tiebreak.
* Filters do not broaden authorization.

---

## Caching

* Private mutable responses default to `Cache-Control: no-store`.
* Stable public or provider-derived player information may use validated caching.
* Read endpoints may return `ETag`.
* A cache refresh never mutates authoritative league state through a `GET`.

---

## CORS

* Allowed browser origins come from environment configuration.
* Local, staging, and production allowlists are separate.
* Wildcard production origins are prohibited for credentialed requests.
* Netlify preview origins are not automatically trusted in production; approved preview origins are explicit staging configuration.
* No-origin requests do not bypass authentication or authorization.

---

# Part 4 - Current Compatibility Endpoint Inventory

## Public and Health

| Method and path | Current behaviour | Current protection | Target disposition |
|---|---|---|---|
| `GET /` | Returns plain text confirming the backend is running | None | Keep only as minimal liveness or redirect to target liveness |
| `GET /health` | Loads league state and returns schema, storage paths, save metadata, job markers, backup path, and count | None | Replace with minimal public liveness/readiness; move detailed data to authenticated operations health |

`GET /health` is read-only but currently exposes internal paths and operational details. The refactor preserves it until a separately verified compatibility change retires or restricts it.

---

## League State

| Method and path | Current behaviour | Current protection | Target disposition |
|---|---|---|---|
| `GET /api/league` | Returns the complete normalized league-state object | None | Replace with authenticated feature reads scoped by league |
| `POST /api/league` | Replaces broad league arrays and settings, preserves selected backend-owned fields, applies freeze and wipe guards, saves JSON, and attempts `league:updated` | Body-supplied `meta.actorRole` and `meta.actorTeam` | Retire after every ordinary feature has a target command endpoint |

Current `POST /api/league` requires arrays:

```text
teams
freeAgents
leagueLog
tradeProposals
tradeBlock
```

It optionally accepts:

```text
matchups
settings
nextAuctionDeadline
meta.actorRole
meta.actorTeam
meta.clientTs
```

Current responses:

```text
200 { ok: true }
400 invalid shape or wipe protection
423 manager write blocked by freeze
500 failed save
```

Body-supplied role and team fields are compatibility metadata, not secure authorization.

---

## Players

| Method and path | Request | Current response |
|---|---|---|
| `GET /api/players` | Optional `query` and `limit` | `{ ok, players, count, cacheCount, limitUsed }` |
| `GET /api/players/debug` | None | Player file path/stat information and cache count |
| `GET /api/players/:id` | Numeric path ID | `{ ok, player }`, `400`, or `404` |
| `POST /api/players/reload` | None | Reloads the player file into process memory and returns result metadata |

Current limits:

* no-query list maximum: `5000`;
* query list maximum: `100`;
* default query limit: `25`.

Target disposition:

* player reads become paginated target reads;
* debug information moves to protected operations health;
* reload becomes an administrator operation with authentication, audit, idempotency, and environment safeguards.

---

## Statistics

| Method and path | Current behaviour | Protection |
|---|---|---|
| `GET /api/stats` | Returns the complete stats cache, or one player when `playerId` is supplied | None |
| `POST /api/stats/refresh` | Runs the NHL statistics refresh and writes only the stats cache | `x-stats-token` |
| `GET /api/stats/debug` | Returns stats-file path and file metadata | None |
| `GET /api/stats/debug-localpath` | Returns process and local stats paths and existence | None |

Current `GET /api/stats` returns:

```json
{
  "ok": true,
  "ready": false,
  "byPlayerId": {}
}
```

when the cache is absent.

With `playerId`, it returns:

```json
{
  "ok": true,
  "playerId": "provider-id",
  "stats": null
}
```

Target disposition:

* user reads remain read-only;
* refresh becomes an authenticated administrator operation or durable scheduled job;
* raw paths never appear in public responses;
* a failed refresh preserves the last valid snapshot.

---

## Matchup Reads

| Method and path | Current response purpose |
|---|---|
| `GET /api/matchups/current` | Current week identity, window, pairings, and server time |
| `GET /api/matchups/standings` | Standings derived from stored schedule and finalized results |
| `GET /api/matchups/locks` | Current lock time and all team lock metadata |
| `GET /api/matchups/locks/preview` | Teams that would lock if the lock job ran now |
| `GET /api/matchups/baseline/preview` | Baseline readiness and a small calculated sample |
| `GET /api/matchups/baseline/status` | Exact baseline-capture gate state |
| `GET /api/matchups/scoring/preview` | Current weekly FP preview from current stats and stored baseline |
| `GET /api/matchups/rollover/status` | Current rollover eligibility and result state |

All are currently unauthenticated.

They are intended to be read-only. Refactor verification must prove that none changes the league file, stats cache, snapshots, or backups.

Current preview and standings calculations are compatibility behaviour. They do not override approved product specifications when later feature work corrects known gaps.

---

## Matchup Schedule Writes

| Method and path | Current request | Current effect |
|---|---|---|
| `POST /api/matchups/schedule/generate` | Body role plus optional season, week count, start, and lock time | Replaces schedule and clears locks, baselines, results, and rollover marker |
| `POST /api/matchups/schedule/updateWeek` | Body role, week index, stored boundaries, optional non-production force | Updates one future week |
| `POST /api/matchups/schedule/shiftFrom` | Body role, starting index, optional lock time | Rebuilds timing from one week onward |

Current authorization trusts:

```json
{
  "meta": {
    "actorRole": "commissioner"
  }
}
```

The target API derives commissioner authority from the session and membership.

---

## Conditional Matchup Debug Routes

These routes exist only when:

```text
MATCHUPS_DEBUG=true
```

| Method and path | Current effect |
|---|---|
| `GET /api/matchups/debug/stateSummary` | Returns current matchup pointers and result keys |
| `POST /api/matchups/debug/resetLocks` | Clears every team lock |
| `POST /api/matchups/debug/resetBaselineForWeek` | Deletes the current week baseline |
| `POST /api/matchups/debug/captureBaselineNow` | Invokes the current baseline job |
| `POST /api/matchups/debug/runLockNow` | Invokes the current lock job |
| `POST /api/matchups/debug/setTeamRosterEmpty` | Empties a roster or inserts a placeholder player |

The write routes currently trust a body-supplied commissioner role.

Target rules:

* these exact debug mutation routes have no production target;
* destructive fixture manipulation is local or isolated staging only;
* approved commissioner recovery uses explicit recovery endpoints and durable correction records;
* placeholder-player writes never reach production data.

---

## Snapshots and Backups

| Method and path | Current behaviour | Current protection |
|---|---|---|
| `GET /api/snapshots` | Lists snapshot IDs and modification times | None |
| `POST /api/snapshots/create` | Writes the current league object to a named JSON snapshot | None |
| `POST /api/snapshots/restore` | Replaces league state from a snapshot and prepends an activity record | None |
| `GET /api/backups?limit=50` | Lists backup metadata and returns the backup directory path | None |
| `POST /api/backups/restore` | Restores a versioned backup, saves it again, logs restoration, and emits an update | Body-supplied commissioner role |

Restore endpoints are destructive compatibility operations. Their current lack of secure authorization is a launch blocker.

The refactor must preserve behavior while extraction occurs, but production enablement of the target system requires secure administrator approval, commissioner workflow boundaries, pre-restore backup, verification, and audit.

---

# Part 5 - Current Socket.IO and Scheduled Contracts

## Current Frontend Expectation

The frontend opens one Socket.IO connection to the backend origin and listens for:

```text
league:updated
```

On receipt, it refetches:

```text
GET /api/league
```

The event is an invalidation signal; the event payload is not authoritative state.

---

## Current Backend Fact

Current write and job code attempts to retrieve Socket.IO with:

```text
app.get("io")
```

The reviewed `server.js` does not currently register the created Socket.IO instance with:

```text
app.set("io", io)
```

and does not define an authenticated connection handler.

Therefore the event-emission calls may currently be no-ops. This is a documented compatibility defect, not an extraction decision.

It must be reproduced and fixed in a separate, focused step with frontend reconnect and refetch verification.

---

## Current Scheduled Polling

The backend checks enabled jobs once per minute:

* weekly snapshot creation;
* Sunday auction resolution;
* matchup roster locking;
* matchup baseline capture;
* matchup result finalization;
* matchup rollover.

Feature flags:

```text
SNAPSHOTS_ENABLED
AUCTIONS_ENABLED
MATCHUPS_ENABLED
MATCHUPS_DEBUG
```

Current in-memory timers and JSON markers are compatibility behavior.

The target uses durable SQLite job occurrences, leases, idempotency, and post-commit outbox delivery.

---

# Part 6 - Target Endpoint Catalogue

The catalogue defines endpoint ownership and minimum contracts. Exact optional display fields may expand compatibly, but authorization, mutation boundaries, IDs, units, and error meaning may not change silently.

## Session

| Method and path | Authorization | Purpose |
|---|---|---|
| `POST /api/v1/accounts` | Public with rate limit | Create one pending self-service account from email, display name, and matching password fields |
| `POST /api/v1/accounts/email-verifications` | Public with single-use token | Verify email control and create the initial session |
| `POST /api/v1/accounts/email-verification-requests` | Public with rate limit | Replace an outstanding email-verification link using a non-enumerating response |
| `POST /api/v1/session` | Public with rate limit | Log in with normalized email and password |
| `GET /api/v1/session` | Authenticated | Return current user, memberships, selected-safe defaults, and CSRF bootstrap data |
| `DELETE /api/v1/session` | Authenticated | Revoke the current session |
| `POST /api/v1/session/password` | Authenticated | Change the current password and rotate the session |
| `POST /api/v1/password-reset-requests` | Public with rate limit | Send a 30-minute single-use reset link using a non-enumerating response |
| `POST /api/v1/password-resets` | Public with single-use token | Set a matching new password, revoke sessions, and require sign-in |
| `PATCH /api/v1/account` | Authenticated | Change the caller's unique display name using `If-Match` |
| `POST /api/v1/account/deactivation` | Authenticated | Deactivate after current-password and typed confirmation checks |
| `POST /api/v1/account/reactivation-requests` | Public with rate limit | Send a single-use reactivation link using a non-enumerating response |
| `POST /api/v1/account/reactivations` | Public with single-use token and current password | Reactivate without creating a session |

Self-service account creation never creates a league, membership, role, team assignment, or commissioner authority.

Successful password change revokes all sessions and returns a signed-out response; the user signs in again.

---

## Platform Administration

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/admin/users` | Platform administrator | List and search users |
| `POST /api/v1/admin/users` | Platform administrator | Create a user |
| `GET /api/v1/admin/users/:userId` | Platform administrator | Read one user without credential hashes |
| `PATCH /api/v1/admin/users/:userId` | Platform administrator | Update approved profile or status fields |
| `POST /api/v1/admin/users/:userId/credential-setup-requests` | Platform administrator | Send or resend the 72-hour single-use credential-setup link |
| `POST /api/v1/admin/users/:userId/password-reset-requests` | Platform administrator | Send a password-reset link without setting or viewing the password |
| `POST /api/v1/admin/leagues` | Platform administrator | Create a league and initial season atomically |
| `POST /api/v1/admin/leagues/:leagueId/commissioner-assignments` | Platform administrator | Propose an existing user as commissioner |
| `DELETE /api/v1/admin/leagues/:leagueId` | Platform administrator with protected confirmation | Execute the approved permanent league-deletion workflow |
| `GET /api/v1/admin/requests` | Platform administrator | List protected operations awaiting an administrator decision |
| `GET /api/v1/admin/requests/:requestId` | Platform administrator | Read one request and its safe review context |
| `POST /api/v1/admin/requests/:requestId/approve` | Platform administrator | Approve and execute or queue the protected operation |
| `POST /api/v1/admin/requests/:requestId/decline` | Platform administrator | Decline the protected operation with a recorded reason |
| `GET /api/v1/admin/security-audit` | Platform administrator | Read cursor-paginated platform-wide safe security-audit events |

Destructive administration requires idempotency and explicit confirmation fields. It never accepts a complete database object.

---

## League Discovery and Settings

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/public/leagues` | Public | List active discoverable leagues using public identity fields only |
| `GET /api/v1/public/leagues/:leagueId` | Public when discoverable | Return public league identity and team links only |
| `GET /api/v1/public/leagues/:leagueId/teams` | Public when discoverable | Return public team identity and roster links only |
| `GET /api/v1/leagues` | Authenticated | List only leagues visible to the user |
| `GET /api/v1/leagues/:leagueId` | League member | Return safe league summary and current season |
| `GET /api/v1/leagues/:leagueId/settings` | League member | Return effective league settings |
| `PATCH /api/v1/leagues/:leagueId/settings` | Platform administrator | Update approved editable settings using `If-Match`; commissioners cannot edit settings in the initial release |
| `PUT /api/v1/leagues/:leagueId/setup/trade-deadline` | Commissioner while league is in Setup | Record the informational trade deadline without starting an automated event |
| `POST /api/v1/leagues/:leagueId/start` | Commissioner | Validate at least four teams and all launch invitations, then activate atomically |
| `POST /api/v1/leagues/:leagueId/lifecycle-transitions` | Platform administrator or authorized commissioner for the requested transition | Execute one explicit approved lifecycle transition |
| `POST /api/v1/leagues/:leagueId/freeze` | Commissioner | Freeze approved manager writes |
| `DELETE /api/v1/leagues/:leagueId/freeze` | Commissioner | Unfreeze approved manager writes |

Only Active leagues are publicly discoverable. Public league resources return `X-Robots-Tag: noindex, nofollow`; the frontend also emits matching page metadata.

---

## Memberships and Teams

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/memberships` | Commissioner | List league memberships |
| `POST /api/v1/leagues/:leagueId/invitations` | Commissioner | Invite an existing user to join and create or manage a team |
| `GET /api/v1/league-invitations/:invitationId` | Authenticated invited user | Read safe invitation details |
| `POST /api/v1/league-invitations/:invitationId/accept` | Authenticated invited user | Accept and atomically create or activate membership and the associated team workflow |
| `POST /api/v1/league-invitations/:invitationId/decline` | Authenticated invited user | Decline the invitation |
| `PATCH /api/v1/leagues/:leagueId/memberships/:membershipId` | Commissioner | Change approved status or league role |
| `DELETE /api/v1/leagues/:leagueId/memberships/:membershipId` | Commissioner | Deactivate membership under product constraints |
| `GET /api/v1/leagues/:leagueId/teams` | League member | List teams in the league |
| `POST /api/v1/leagues/:leagueId/teams` | Commissioner | Create a team before the live season |
| `GET /api/v1/leagues/:leagueId/teams/:teamId` | League member | Return safe team summary |
| `PATCH /api/v1/leagues/:leagueId/teams/:teamId` | Commissioner or authorized manager for permitted profile fields | Update explicitly editable fields |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment` | Commissioner | Assign a manager |
| `DELETE /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment` | Commissioner | End the active assignment |
| `DELETE /api/v1/leagues/:leagueId/teams/:teamId` | Commissioner plus administrator approval | Execute the protected team-erase workflow |
| `GET /api/v1/commissioner-assignments/:assignmentId` | Authenticated proposed commissioner | Read safe assignment details |
| `POST /api/v1/commissioner-assignments/:assignmentId/accept` | Authenticated proposed commissioner | Accept and atomically activate commissioner membership and role |
| `POST /api/v1/commissioner-assignments/:assignmentId/decline` | Authenticated proposed commissioner | Decline the assignment |

Teams are not added or removed during a live season.

---

## Players and Statistics

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/players` | Authenticated | Cursor-paginated player search and filters |
| `GET /api/v1/players/:playerId` | Authenticated | Stable player details |
| `GET /api/v1/players/:playerId/statistics` | Authenticated | Season totals and calculated FP |
| `GET /api/v1/leagues/:leagueId/players/:playerId` | League member | League-specific ownership, eligibility, and contract summary |
| `POST /api/v1/operations/players/import` | Platform administrator | Run approved player synchronization |
| `POST /api/v1/operations/statistics/refresh` | Platform administrator | Run a durable statistics refresh |
| `GET /api/v1/operations/statistics/refreshes/:jobId` | Platform administrator | Read refresh status |

Provider failures do not erase the last valid statistics.

---

## Rosters and Cap

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/public/leagues/:leagueId/teams/:teamId/roster` | Public when the league is publicly eligible | Return the approved public roster projection only |
| `GET /api/v1/leagues/:leagueId/teams/:teamId/roster` | League member | Return roster groups, slots, ownership, contracts, cap, and legality |
| `GET /api/v1/leagues/:leagueId/teams/:teamId/roster/legality` | League member | Return authoritative legality reasons without writing |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/roster-moves` | Authorized team manager or commissioner correction workflow | Move one owned player between approved groups or slots |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/prospects/:playerId/sign` | Authorized team manager | Create the approved ELC |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/prospects/:playerId/decline` | Authorized team manager | Decline the ELC under approved rules |
| `DELETE /api/v1/leagues/:leagueId/teams/:teamId/prospect-rights/:playerId` | Authorized team manager | Release prospect rights |

Transaction-created roster illegality returns a warning in the successful command response. It is not represented as a false failed transaction when the approved feature permits completion.

The public roster projection contains only:

```text
league: id and public name
season: id and public label
team: id, public name, two colours, and logo reference
players: stable public player reference, name, normalized position, roster category,
         AAV cents, remaining contract years, age, and available season statistics
cap: cap limit cents, cap usage cents, cap space cents,
     retained-salary total cents, and buyout-penalty total cents
updatedAt
```

It excludes memberships, account data, login history, private notes, auction bids, trades, activity, matchups, standings, correction reasons, internal provider state, and operational metadata.

The public roster request is read-only and performs no normalization write, repair, cache refresh, roster reorder, migration, or initialization.

---

## Contracts, Retention, and Buyouts

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/teams/:teamId/contracts` | League member | List current team contracts |
| `GET /api/v1/leagues/:leagueId/contracts/:contractId` | League member | Read one current contract and remaining schedule |
| `GET /api/v1/leagues/:leagueId/teams/:teamId/cap-obligations` | League member | List retention and buyout obligations |
| `POST /api/v1/leagues/:leagueId/contracts/:contractId/buyout` | Contract owner manager | Buy out the player under approved rules |
| `POST /api/v1/leagues/:leagueId/contracts/:contractId/corrections` | Commissioner | Create an explicit versioned correction |

There is no general contract-extension endpoint.

Normal contract creation occurs only through approved feature commands such as an auction win, prospect signing, or commissioner correction.

---

## Auctions and Bids

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/auctions` | League member | List active auctions without competing bid values |
| `POST /api/v1/leagues/:leagueId/auctions` | Authorized team manager | Start an auction with the initiating bid |
| `GET /api/v1/leagues/:leagueId/auctions/:auctionId` | League member | Read safe auction timing and own-bid state |
| `PUT /api/v1/leagues/:leagueId/auctions/:auctionId/bids/mine` | Authorized team manager | Create or replace the caller team's permitted active bid |
| `PATCH /api/v1/leagues/:leagueId/auctions/:auctionId/bids/:bidId` | Commissioner | Replace approved bid fields without first revealing the stored value or term |
| `DELETE /api/v1/leagues/:leagueId/auctions/:auctionId/bids/:bidId` | Commissioner | Remove a stable identified bid through the confirmed logged workflow |
| `POST /api/v1/leagues/:leagueId/auctions/:auctionId/cancel` | Commissioner | Cancel an unresolved auction through the confirmed logged workflow |
| `POST /api/v1/leagues/:leagueId/auctions/:auctionId/resolve` | Durable system job; commissioner recovery only when approved | Resolve idempotently |

Managers see active auctions and their own bid details. Resolved bids are not returned through the normal auction UI; the approved result appears in League Activity.

Commissioners cannot query active bid values.

Managers have no bid-withdrawal endpoint.

---

## Trades

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/trades` | League member | List proposals involving authorized teams plus allowed league views |
| `POST /api/v1/leagues/:leagueId/trades` | Authorized proposing team manager | Create a proposal with typed assets |
| `GET /api/v1/leagues/:leagueId/trades/:tradeId` | Authorized participant or commissioner safe view | Read a proposal |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/accept` | Authorized receiving team manager | Revalidate and complete atomically |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/decline` | Authorized receiving team manager | Decline |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/cancel` | Authorized proposing team manager | Cancel |

Acceptance revalidates ownership, contracts, retention, obligations, picks, rights, deadline, and proposal status inside one transaction.

Multiple simultaneous proposals may reference the same asset. Completion of one cancels or invalidates affected proposals according to the approved trade specification.

---

## Matchups and Standings

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks` | League member | List persisted weeks and pairings |
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/current` | League member | Return authoritative current week |
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId` | League member | Return week, matchup summaries, and status |
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId/matchups/:matchupId` | League member | Return matchup-period G, A, points, and FP from zero baseline |
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/standings` | League member | Return official derived standings and status |
| `POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-schedules` | Commissioner before live season | Generate an approved balanced schedule |
| `PATCH /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId` | Commissioner under timing constraints | Adjust approved future boundaries or pairings |
| `POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-results/:resultId/corrections` | Commissioner | Append a versioned correction |
| `POST /api/v1/leagues/:leagueId/seasons/:seasonId/standings/rebuilds` | Commissioner recovery | Rebuild from official result versions |

Matchup and standings writes never create League Activity entries.

---

## Entry Draft

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId` | League member | Read draft status and safe configuration |
| `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/order` | League member | Read immutable confirmed order |
| `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligible-players` | League member | Search the confirmed eligibility snapshot |
| `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligibility-snapshots` | Commissioner | Import and preview a versioned pool |
| `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/eligibility-snapshots/:snapshotId/confirm` | Commissioner | Freeze the selected pool |
| `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/lottery-runs` | Commissioner | Execute the one immutable secure lottery |
| `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/start` | Commissioner | Start the live draft |
| `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/queue` | Authorized manager | Read only that manager/team private queue |
| `PUT /api/v1/leagues/:leagueId/entry-drafts/:draftId/queue` | Authorized manager | Replace ordered private queue using `If-Match` |
| `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/selections` | Authorized on-clock manager or timeout job | Make one immutable selection |

There is no selection undo endpoint.

---

## Activity and Notifications

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/activity` | League member | Cursor-paginated approved League Activity |
| `GET /api/v1/leagues/:leagueId/security-audit` | League member | Cursor-paginated approved league-scoped login and security events |
| `GET /api/v1/notifications` | Authenticated | List the caller's in-app notifications |
| `POST /api/v1/notifications/:notificationId/read` | Notification owner | Mark one notification read |
| `POST /api/v1/notifications/read-all` | Authenticated | Mark the caller's current notifications read |

Listing notifications is read-only.

Matchup and standings records remain outside League Activity.

---

## Operations, Backup, and Recovery

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/health/live` | Public | Minimal process liveness |
| `GET /api/v1/health/ready` | Public | Minimal dependency readiness without private details |
| `GET /api/v1/operations/health` | Platform administrator | Detailed read-only operational state |
| `GET /api/v1/operations/backups` | Platform administrator | List safe backup metadata without raw paths |
| `POST /api/v1/operations/backups` | Platform administrator | Create and verify a backup |
| `POST /api/v1/operations/restores` | Platform administrator plus approved workflow | Start protected restore |
| `GET /api/v1/operations/restores/:restoreId` | Platform administrator | Read restore and verification status |
| `GET /api/v1/leagues/:leagueId/recovery` | Commissioner | Read safe league recovery status |
| `POST /api/v1/leagues/:leagueId/backups` | Commissioner | Create and verify an immediate league backup or season snapshot |
| `POST /api/v1/leagues/:leagueId/restoration-requests` | Commissioner | Request restoration without changing data |
| `POST /api/v1/leagues/:leagueId/recovery/actions` | Commissioner for approved action types | Run an explicit league-scoped recovery action |

A commissioner restoration request enters `Awaiting Administrator Approval` and does not itself restore data. Administrator approval activates the approved freeze, pre-restore backup, restore, verification, and notification workflow.

Production restore requires the separate authorization and safeguards defined by Backup and Restore. A normal page view never starts backup, restore, reset, repair, or migration work.

---

# Part 7 - Target Command Response

A successful feature command returns:

```json
{
  "data": {
    "operationId": "opaque-uuid",
    "resource": {
      "id": "opaque-uuid",
      "version": 5
    },
    "warnings": [
      {
        "code": "ROSTER_NOW_ILLEGAL",
        "message": "The transaction completed, but the roster is illegal."
      }
    ]
  },
  "meta": {
    "requestId": "opaque-request-id"
  }
}
```

Warnings indicate an approved successful outcome requiring attention. They are not hidden failures.

---

# Part 8 - Socket.IO Target Contract

## Connection

* Socket.IO uses the authenticated browser session.
* Connection authorization resolves the user before rooms are joined.
* The server joins only authorized user, league, and team rooms.
* Membership changes trigger room re-evaluation or disconnect.
* Reconnect always causes the client to refetch authoritative data.

---

## Event Shape

```json
{
  "eventId": "opaque-uuid",
  "type": "roster.changed",
  "leagueId": "opaque-uuid",
  "resourceId": "opaque-uuid",
  "version": 5,
  "occurredAt": 1784371200000
}
```

Events contain invalidation metadata, not complete private records.

Approved event families:

```text
league.changed
team.changed
roster.changed
contract.changed
auction.changed
trade.changed
matchup.changed
standings.changed
draft.changed
activity.created
notification.created
operations.changed
```

Active competing bid values are never emitted.

Events publish only after the authoritative transaction commits, normally through the transactional outbox.

---

# Part 9 - Compatibility and Retirement

## Strangler Sequence

For each feature:

1. characterize current request, response, error, persistence, and event behavior;
2. extract current code without changing the compatibility endpoint;
3. implement the target service and repository boundary;
4. add target endpoint tests;
5. update the frontend caller;
6. observe local and staging behavior;
7. stop ordinary compatibility writes for that feature;
8. retain a temporary read adapter only when required;
9. remove the compatibility endpoint in a separately reviewed cleanup.

---

## Broad League Write Retirement

`POST /api/league` is retired last among current ordinary feature writes.

Before retirement:

* every frontend write has a feature command;
* no page depends on saving a complete league object;
* optimistic versions protect mutable aggregates;
* failed commands leave frontend state consistent with the backend;
* Socket.IO invalidation refetches the correct feature;
* compatibility fallback is disabled in staging and verified;
* production rollback order is documented.

---

## Breaking Changes

A breaking change requires:

* documentation of old and new contracts;
* backend and frontend deployment order;
* compatibility period or coordinated release;
* focused contract tests;
* staging verification;
* rollback steps.

Undocumented response-field removal, status-code change, or authorization broadening is prohibited.

---

# Part 10 - Required Contract Tests

## Current Compatibility Tests

For every current endpoint:

* method and path registration;
* representative success response;
* representative validation and failure response;
* proof that `GET` does not alter league, stats, snapshot, or backup hashes;
* existing frontend caller compatibility where one exists.

---

## Target Tests

Required test categories:

* unauthenticated access;
* authorized role access;
* forbidden role access;
* two-league isolation with identical names and players;
* malformed IDs and unknown fields;
* validation limits;
* stale `If-Match`;
* idempotency replay and mismatched replay;
* freeze behavior;
* transaction rollback;
* active-bid secrecy, including commissioner requests;
* notification ownership;
* read-only hash or transaction proof;
* Socket.IO room scoping and reconnect refetch;
* no event before commit;
* sanitized errors and operational responses;
* compatibility-to-target frontend cutover.

---

# Part 11 - Approval Checklist

## Inherited Constraints

- [x] The backend is authoritative for mutable state and business calculations.
- [x] Read-only endpoints remain read-only.
- [x] Every private league request is authenticated, authorized, and league-scoped.
- [x] Stable IDs replace display names as relationships.
- [x] Ordinary writes do not replace the complete league object.
- [x] Money uses integer cents and persisted FP uses integer hundredths.
- [x] Transactions commit before events and notifications.
- [x] Active competing auction bids remain secret from managers and commissioners.
- [x] Matchup and standings operations remain outside League Activity.
- [x] Debug and destructive controls are unavailable in production except through approved recovery workflows.

## Approved API Decisions

- [x] Target endpoints use `/api/v1`.
- [x] League resources use `/api/v1/leagues/:leagueId`.
- [x] Target JSON uses `camelCase`.
- [x] Success responses use `data` and safe `meta`.
- [x] Errors use stable code, safe message, optional details, and request ID.
- [x] Browser authentication uses a backend-managed secure session cookie.
- [x] Public account creation exists but grants no league, membership, role, team, or commissioner authority.
- [x] Authorization ignores body-supplied roles and team identity.
- [x] Cross-league private-resource probing returns `404`.
- [x] Mutable aggregate updates use integer versions and `If-Match`.
- [x] Retryable material writes use scoped idempotency keys.
- [x] Cursor pagination is the default for large or mutable collections.
- [x] Private mutable responses default to `Cache-Control: no-store`.
- [x] CORS origins are explicit per environment.
- [x] The current unversioned endpoints remain compatibility contracts during behaviour-preserving extraction.
- [x] Known current defects are not silently repaired while code is merely moved.
- [x] `POST /api/league` is retired after feature-specific commands replace every caller.
- [x] Debug mutation routes have no production target.
- [x] Public health exposes no paths, backup locations, secrets, or private league state.
- [x] Socket.IO sends scoped invalidation metadata, not authoritative private state.
- [x] Socket.IO authentication uses the same session and authorized rooms.
- [x] Reconnecting clients refetch authoritative feature data.
- [x] Target feature endpoint families are approved as catalogued in this document.
- [x] Grae approved this document by delegating the technical decisions to Codex.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The API-contract approval phase is complete.

API implementation is complete only when:

* every implemented target endpoint has request, response, permission, error, idempotency, concurrency, and read-only tests;
* current compatibility behavior has characterization coverage before extraction;
* the frontend uses target feature endpoints;
* secure sessions and league isolation are enforced;
* broad league-object writes are retired;
* debug and recovery controls have safe environment and authorization boundaries;
* Socket.IO invalidation is scoped and verified;
* staging contract tests pass.

---

# Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/DEPLOYMENT.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/08-operations/BACKUP_AND_RESTORE.md
```
