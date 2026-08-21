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

On 2026-08-20, Grae approved the M7-26 full-site UI contract amendment:

* league-player catalog reads accept optional `position=F|D`, canonical NHL
  abbreviation `nhlTeam`, `ownership=all|free|prospects`, and integer
  `minimumGames`; every filter is applied by the repository before cursor
  pagination and the unfiltered page limit remains `100`;
* FAD result and historical-card reads return offer amount/AAV/term only to a
  current manager of the selected team, while other active members receive
  player identity and Signed/Not won/Tied outcome only;
* manager acceptance of a trade containing Future Considerations persists a
  durable acceptance snapshot and returns the projected `Awaiting Commissioner
  Approval` state without transferring assets; storage status remains
  `proposed`;
  commissioner approval revalidates and applies the trade atomically, while
  commissioner authority alone grants no proposal, receiver-response, or
  cancellation write;
* a result-correction preview returns recognizable week/team/matchup context
  and projected standings, and correction confirmation atomically persists the
  result version and rebuilt current standings;
* notification listing accepts `readStatus=all|unread|read`, defaults compatibly
  to `all`, and remains read-only; normal UI uses unread/read views;
  `POST /api/v1/notifications/read-batch` accepts the exact displayed
  notification-ID set and idempotently marks only the caller-owned rows read;
* every active platform administrator is automatically represented by a
  protected active `member` membership in every non-deleted league and may not
  be ended, reclassified, or manager/commissioner-assigned by ordinary writers;
  and
* response `requestId`, stable IDs, versions, and internal error evidence remain
  available to clients/services that need them, but normal UI projections do
  not render those implementation details.

These contracts supersede older visibility, immediate Future Considerations
completion, manual administrator-membership, separate correction/rebuild, and
notification-list grammar where they conflict. Existing endpoints and
historical data remain backward-readable unless an explicit retirement below
says otherwise.

The 2026-08-21 FAD privacy audit narrows the public result contract further.
T-131 is an identity/lifecycle/public-outcome-count selector summary only.
T-132 returns a selected team's result rows, not a Candidate Card or audit
history. T-140 requires `teamId` and returns the same result row shape with
`q`, `status`, `limit`, and cursor pagination. A row is exactly `player`,
`status`, nullable `offer`, and nullable manager-actionable `tieAuctionId`.
`offer` is complete only for the current manager of the exact selected team and
is otherwise `null`; no other card, slot, ranking, winner-resource,
restricted-participant, draw, cap, editor, conflict, intervention, or audit
field is returned. Pending and correction-required allocations produce no final
row or count. Cursors and caches bind the selected team. T-143/T-144 remain
always-money-redacted operational correction responses. Every T-082 stored FAD
cancellation allocation and T-144 stored correction response is reprojected
through the current public redactor before return even when its immutable
stored receipt predates this amendment.

The Free Agent Draft product specification approved on 2026-07-27 and amended
on 2026-07-28 for Candidate Card ranking, tie handling, and the explicitly
selected first-matchup clock is implemented
technically by the approved dedicated amendment at
`docs/04-technical-specs/FREE_AGENT_DRAFT.md`. That amendment adds target routes
`T-126` through `T-144` and extends the auction contracts for FAD context.

On 2026-07-29, Grae approved the consolidated FAD lifecycle amendment:
scheduled Entry Draft-start rollover, automatic all-or-nothing Candidate Card
opening, adaptive help timing, whole-card structural/cap exclusion, improvement-required
restricted ties and fallback, final-hour nomination queueing, FAD-only
equal-chance draws, binding no-reservation wins, and atomic whole-Monday Week 1
recovery. This shared contract incorporates those rules; the dedicated FAD
technical specification controls their exact feature payloads and persistence
boundaries.

On 2026-08-10, Grae approved the FAD-14 opening and realtime clarification.
Candidate Cards become fillable only after Entry Draft completion, or the
already-approved no-draft equivalent, and successful atomic readiness commit.
Each current accepted manager receives one private notification for each
participating team/card they manage. Non-managers receive no Candidate Card
notification and retain only normal League Activity visibility. Opening and
queued-nomination publications carry invalidation metadata only and never card
contents, offers, players, slots, contract values, help messages, or bids.
The same approved FAD-14 reconciliation preserves
`fad_setup_exemption_authorized` as the explicit eleventh FAD Activity and
thirteenth FAD notification. Its exact destination is
`{kind: commissioner_fad, leagueId, seasonId}`, and setup authorization creates
the exact three-event metadata-only publication set defined below.

The explicit final-standings amendment approved on 2026-07-29 adds `T-145`.
It makes one provenance-complete final standings snapshot a required,
independently confirmed prerequisite for later season rollover.

On 2026-08-13, Grae approved the atomic whole-card Candidate Card save as
`T-146`. It adds one route to the approved target catalogue without changing
the existing `T-145` standings-finalization identity.

On 2026-08-11, Grae clarified that FAD and Entry Draft player selection uses
the persisted catalogue only and does not depend on statistics. Every new
season's approved semantic baseline is exactly zero current-season GP, goals,
assists, NHL points, and fantasy points. The current global player API and UI do
not yet provide the final season-explicit projection; that is a recorded gap,
not completed behavior. Prior-season statistics require an explicit historical
season context and never substitute for current-season matchup or roster data.
Paid SportsDataIO capability is removed from FAD-18; provider-neutral post-game
statistics is a separate deferred API amendment. The preseason FAD-only
candidate disables the shared automatic `matchup_occurrences` runner in full,
so statistics-refresh, baseline, normal-lock, finalization, and matchup-week rollover
occurrences do not execute. FAD, Entry Draft, auction, trade, and outbox workers
remain available subject to their own route, authorization, and release gates.

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

For auction-administration commands `T-080` through `T-083`, the original
result is not reconstructed from the current auction or job. One immutable
`auction_administration_command_results` row stores the successful response
`data`, original HTTP status, request hash and precondition, actual actor
authority, and canonical response SHA-256. Replay uses that row after current
identity, league isolation, and administration authority are revalidated, but
before current auction state, version, clock, or new identifiers are sampled.
The response envelope receives the replay request's new `meta.requestId`.
Unsuccessful fresh requests write neither a new idempotency row nor a command
result.

Their exact operation map is `T-080` = `auction.bid.put`, `T-081` =
`auction.bid.remove`, `T-082` = `auction.cancel`, and `T-083` =
`auction.resolve.request`. Within league isolation, exact replay is scoped by
that operation, actor user, and client key, and resolves through the completed
request's immutable result link. Reusing the same client key under a different
operation or actor does not select that result.

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
| `GET /api/v1/account` | Authenticated | Return the caller's safe account profile: stable ID, email, display name, status, and version |
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
| `POST /api/v1/admin/leagues` | Platform administrator | Create a league and initial season atomically and provision protected active `member` memberships for every active platform administrator |
| `POST /api/v1/admin/leagues/:leagueId/commissioner-assignments` | Platform administrator | Propose one eligible non-administrator user as the replacement commissioner; never add a second current commissioner |
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
| `GET /api/v1/leagues/:leagueId/seasons` | League member | List current and historical seasons for season-scoped navigation without mutation |
| `PATCH /api/v1/leagues/:leagueId/settings` | Platform administrator | Update approved editable settings using `If-Match`; commissioners cannot edit settings in the initial release |
| `PUT /api/v1/leagues/:leagueId/setup/trade-deadline` | Commissioner while league is in Setup | Record the informational trade deadline without starting an automated event |
| `POST /api/v1/leagues/:leagueId/start` | Commissioner | Validate complete setup settings including the stored trade deadline, at least four teams, and all launch invitations, then atomically activate every setup team plus the setup league and its sole planned current season |
| `POST /api/v1/leagues/:leagueId/lifecycle-transitions` | Platform administrator or authorized commissioner for the requested transition | Execute one explicit approved lifecycle transition |
| `POST /api/v1/leagues/:leagueId/freeze` | Commissioner | Freeze approved manager writes |
| `DELETE /api/v1/leagues/:leagueId/freeze` | Commissioner | Unfreeze approved manager writes |

### Setup Trade Deadline

`T-035` uses:

```http
PUT /api/v1/leagues/:leagueId/setup/trade-deadline
If-Match: "<current league version>"
Idempotency-Key: <opaque 1-128 character key>
Content-Type: application/json
```

The exact request body is:

```json
{
  "tradeDeadlineAtMs": 1798761600000
}
```

The selected local date and time is interpreted by the client in the league's
stored timezone and sent as one safe UTC epoch-millisecond value. A fresh
request requires the deadline to be strictly in the future. The backend
reauthorizes the current commissioner, or an active league member with
inherited platform-administrator authority, inside one immediate transaction.
It requires the league to remain `setup`, updates both the settings version and
league aggregate version using compare-and-swap, and writes one
commissioner-visible activity record, one Security Audit event, one
league-scoped metadata-only outbox invalidation, and one completed idempotency
record. It does not create a job, notification, scheduled event, FAD, or
automatic trading transition. A later setup-only call with a new current
version may replace the deadline.

The exact success data is:

```json
{
  "code": "LEAGUE_TRADE_DEADLINE_RECORDED",
  "league": {
    "id": "00000000-0000-4000-8000-000000000000",
    "status": "setup",
    "timezone": "America/Vancouver",
    "version": 3
  },
  "settings": {
    "tradeDeadlineAtMs": 1798761600000,
    "version": 2
  },
  "recordedAtMs": 1785292800000
}
```

Fresh success and exact replay both return `200`. Replay is checked before
current lifecycle, version, or clock validation and reconstructs the original
result from durable evidence, so an old key continues to return its original
representation after a later setup replacement or league activation. Reusing
the key for changed input returns `409 IDEMPOTENCY_KEY_REUSED`. A stale
`If-Match` returns `412 LEAGUE_TRADE_DEADLINE_PRECONDITION_FAILED`; missing
visibility returns `404 LEAGUE_NOT_FOUND`; missing authority returns
`403 LEAGUE_COMMISSIONER_REQUIRED`; a non-setup league returns
`409 LEAGUE_TRADE_DEADLINE_NOT_ALLOWED`; missing or inconsistent settings
return `409 LEAGUE_TRADE_DEADLINE_SETTINGS_INVALID`; a current or past fresh
deadline returns `422 LEAGUE_TRADE_DEADLINE_NOT_FUTURE`; malformed input
returns `400 LEAGUE_TRADE_DEADLINE_INPUT_INVALID`; and an oversized body
returns `413 LEAGUE_TRADE_DEADLINE_TOO_LARGE`.

For an ordinary new league, the `T-036` start transaction also creates its
owned `no_draft_inaugural` readiness operation and pending job. For the exact
reset-created original league, `T-036` performs the same setup-team,
sole-season, and league activation but creates no readiness row; `T-037` alone
creates `no_draft_initial_season2` with the audited exemption. Any partial or
ambiguous reset report/bootstrap identity makes the complete `T-036` request
fail with `409 LEAGUE_START_NOT_ALLOWED` and no writes.

The lifecycle-transition route includes the one FAD-specific
`authorize_initial_season2_no_draft` command defined in
`docs/04-technical-specs/FREE_AGENT_DRAFT.md`. It requires a platform
administrator with active membership in the league, exact typed confirmation,
a bounded reason, `seasonId`, and `Idempotency-Key`; `If-Match` is forbidden.
It may create the
one-time original-league Season 2 exemption only when the target is the
league's sole persisted current season because the approved reset omitted the
legacy Season 1 competition container, the league has the exact succeeded
legacy Season 1 reset-manifest migration evidence, and the current active
preseason season has no Entry Draft, FAD, or exemption. The same immediate
snapshot must prove the exact original reset-bootstrap league/season IDs,
`2026`/`20262027` identity, bootstrap idempotency/activity/audit actor and
timestamp continuity, and one active current commissioner notification target.
The transaction records immutable report/bootstrap hashes plus linked
idempotency, audit, activity, notification, and outbox evidence but does not
open Candidate Cards or consume the exemption.
No GET, FAD readiness retry, migration, manual SQL step, or startup path may
create that row.

`T-037` is approved, composed, and verified in the backend; its transition
service owns two HTTP uses:

* `authorize_initial_season2_no_draft`, the one approved initial-transition
  exemption above; and
* `retry_scheduled_entry_draft_rollover`, available only after the persisted
  Entry Draft-start occurrence has failed or blocked.

The normal continuing-season rollover is not a browser command. Entry Draft
scheduling binds one source season, one already-planned target season with its
complete persisted calendar and schedule, one immutable scheduled-start
instant, and one durable occurrence. At that instant, the system job invokes
the same T-037 service internally as
`execute_scheduled_entry_draft_rollover`. A commissioner retry supplies the
persisted draft and occurrence identity, current draft `If-Match`, and
`Idempotency-Key`; it cannot supply a replacement calendar, completion
instant, target season, or manual rollover time.

The commissioner retry contract is exact:

```http
POST /api/v1/leagues/:leagueId/lifecycle-transitions
If-Match: "<current Entry Draft version>"
Idempotency-Key: <opaque 1-128 character key>
Content-Type: application/json

{
  "transitionType": "retry_scheduled_entry_draft_rollover",
  "entryDraftId": "<persisted Entry Draft UUID>",
  "rolloverOccurrenceId": "<persisted scheduled occurrence UUID>"
}
```

Unknown or missing body fields fail closed. `If-Match` compares the Entry
Draft version, not a client-selected source or target season version. Fresh
acceptance and exact replay return `202`; changed-input key reuse returns
`409 IDEMPOTENCY_KEY_REUSED`; a stale draft version returns
`412 SEASON_ROLLOVER_PRECONDITION_FAILED`; an occurrence that is not the exact
blocked occurrence bound to that draft returns `409 SEASON_ROLLOVER_NOT_READY`.
The internal `execute_scheduled_entry_draft_rollover` command uses the same
two persisted UUIDs, is never accepted by this HTTP route, has no browser
actor, `If-Match`, client idempotency key, body-supplied calendar, or typed
confirmation, and deduplicates by the durable occurrence identity.

Both paths preserve an `active` or `frozen` league and any active freeze. The
scheduled path is idempotent by occurrence key and records system authority.
The retry path accepts the current commissioner or inherited member platform
administrator, records that actual authority, returns `202`, and replays by
idempotency key. The no-draft exemption retains its separate `201` response and
shared reverse-idempotency contract.

Before rollover may write, the transaction revalidates the exact completed
source FAD and completion marker, every initial and extension rollover,
allocation, recovery, auction, bid, result, job, matchup, trade, and the
current canonical T-145/T-097 final-standings lineage. Missing, stale, legacy,
incomplete, quarantined, or ambiguous evidence returns
`409 SEASON_ROLLOVER_NOT_READY`; T-037 never repairs, rebuilds, finalizes, or
guesses it.

The target must be the one same-league consecutive `planned` season already
bound to the scheduled Entry Draft. Its NHL/playoff calendar must be complete
and match the draft schedule exactly. At least one valid league-local Monday
Week 1 must remain before playoffs, but rollover does not require a fixed
Candidate preparation lead and does not choose or rewrite Week 1. After Entry
Draft completion, automatic FAD readiness performs any approved whole-Monday
shift needed to make the Candidate deadline future-facing and fit the complete
seven-day FAD period.

One outer immediate transaction advances or expires contract, retention, and
buyout years; carries or releases ownership; cancels affected pending trades;
marks the source season completed and target active; switches the league's
current season; writes the immutable rollover attempt, root, manifest,
activity, audit, and outbox evidence; verifies that evidence; opens target
trading; changes the prepared Entry Draft from `Scheduled` to `Live`; starts
the first pick clock; and commits. Any failure leaves both seasons, every
contract and obligation, trading, and the draft unchanged. A blocked occurrence
returns exact commissioner-visible blockers and is retried only through the
approved T-037 retry command.

Only Active leagues are publicly discoverable. Public league resources return `X-Robots-Tag: noindex, nofollow`; the frontend also emits matching page metadata.

Authenticated league-list and league-detail responses expose both the stored
membership `permissionCategory` and its backend-derived
`effectiveAuthority`. They are normally equal. A platform administrator with
the guaranteed protected active `member` membership retains `permissionCategory: "member"`
and receives `effectiveAuthority: "platform_administrator"`. Platform role
without the required membership is invariant corruption: private access fails
closed until the approved additive reconciliation restores the row.

---

## Memberships and Teams

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/memberships` | Commissioner | List league memberships |
| `GET /api/v1/leagues/:leagueId/invitable-users` | Commissioner | List active existing users who do not already have an active or invited membership |
| `POST /api/v1/leagues/:leagueId/invitations` | Commissioner | Invite an existing user to join and create or manage a team |
| `GET /api/v1/league-invitations/:invitationId` | Authenticated invited user | Read safe invitation details |
| `POST /api/v1/league-invitations/:invitationId/accept` | Authenticated invited user | Accept and atomically create or activate membership and the associated team workflow |
| `POST /api/v1/league-invitations/:invitationId/decline` | Authenticated invited user | Decline the invitation |
| `PATCH /api/v1/leagues/:leagueId/memberships/:membershipId` | Commissioner | Change approved ordinary status or league role; reject protected administrator or current-commissioner mutation |
| `DELETE /api/v1/leagues/:leagueId/memberships/:membershipId` | Commissioner | Deactivate an ordinary membership; reject protected administrator or current-commissioner removal |
| `GET /api/v1/leagues/:leagueId/teams` | League member | List teams in the league |
| `POST /api/v1/leagues/:leagueId/teams` | Commissioner | Create a team before the live season |
| `GET /api/v1/leagues/:leagueId/teams/:teamId` | League member | Return safe team summary |
| `GET /api/v1/leagues/:leagueId/teams/:teamId/logo` | League member | Return the current inspected raster logo bytes without mutation |
| `PATCH /api/v1/leagues/:leagueId/teams/:teamId` | Commissioner or authorized manager for permitted profile fields | Update explicitly editable fields |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment` | Commissioner | Assign an eligible non-administrator manager |
| `DELETE /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment` | Commissioner | End the active assignment without ending a protected administrator membership |
| `DELETE /api/v1/leagues/:leagueId/teams/:teamId` | Commissioner plus administrator approval | Execute the protected team-erase workflow |
| `GET /api/v1/commissioner-assignments/:assignmentId` | Authenticated proposed commissioner | Read safe assignment details |
| `POST /api/v1/commissioner-assignments/:assignmentId/accept` | Authenticated eligible proposed commissioner | Accept the explicit transfer and atomically demote the old commissioner, promote the replacement, and update the league pointer |

Membership removal uses an exact body:

```json
{
  "confirmed": true,
  "expectedVersion": 3
}
```

The current commissioner and a protected administrator membership cannot be
removed through this endpoint.
Removing an active manager membership ends its current team assignment in the
same transaction. The response never exposes the removed user's email or
credential data.
| `POST /api/v1/commissioner-assignments/:assignmentId/decline` | Authenticated proposed commissioner | Decline the assignment |

Commissioner-transfer acceptance rejects an active platform administrator as
the replacement. In one transaction it demotes the old commissioner to
`manager` when an active team assignment remains, otherwise `member`; promotes
the replacement membership; and updates the league pointer. Protected
administrator mutations fail with the stable authorization/state error mapped
by the endpoint, and no related membership or assignment changes partially.

Teams are not added or removed during a live season.

Team-profile mutation sends a canonical quoted team version in `If-Match`, a
scoped `Idempotency-Key`, and an exact JSON object containing at least one of:

```json
{
  "name": "Snow Owls",
  "patternTemplate": "mirrored-centre-band",
  "primaryColour": "#112233",
  "secondaryColour": "#aabbcc",
  "tertiaryColour": "#f97316",
  "logo": {
    "mediaType": "image/png",
    "contentBase64": "canonical-base64"
  }
}
```

Unknown fields are rejected. `name` is trimmed, contains at most 35 Unicode
code points, and remains case-insensitively unique within the league. Primary
and secondary colour fields are optional only as a pair; supplied values match
lowercase `#rrggbb`. `patternTemplate` is optional for a partial update and,
when supplied, must be one of the approved template IDs defined by the data
model. The effective template fixes the colour count: a two-colour template
requires null or omitted `tertiaryColour`, while a three-colour template
requires canonical `#rrggbb` `tertiaryColour`. A request that changes between
two- and three-colour templates therefore supplies the matching colour fields
in the same update. `logo` is optional, is null to remove the current logo, or is
exactly `{mediaType, contentBase64}`. The base64 value is canonical without a
data-URL prefix or whitespace. The decoded static PNG, JPEG, or WebP is at
most `524288` bytes and each inspected dimension is from `1` through `2048`.
The endpoint-specific JSON limit is `768 KiB`.

The safe team response exposes `logoReference` as null or the same-league
backend path `/api/v1/leagues/:leagueId/teams/:teamId/logo`; it never exposes
the object key or raw bytes. Logo reads revalidate active league membership
and exact team scope, perform no writes, return the stored `Content-Type`,
`Content-Length`, a digest-backed `ETag`, `X-Content-Type-Options: nosniff`,
and `Cache-Control: private, no-store`. Binary logo success is an intentional
exception to the JSON success envelope; errors retain the standard JSON error
shape.

An unchanged request is rejected without a version increment. A rename adds
League Activity with the authenticated actor. Colour-only and logo-only edits
do not add League Activity. Every successful profile mutation adds separate
Security Audit and idempotency evidence atomically. A stale version returns
`412 PRECONDITION_FAILED` with the current safe team version and
`refetch: true`.

---

## Players and Statistics

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/players` | Authenticated | Cursor-paginated player search and filters; `leagueId` plus `auctionEligible=true` returns only auction-eligible players after active-membership authorization |
| `GET /api/v1/players/:playerId` | Authenticated | Stable player details |
| `GET /api/v1/leagues/:leagueId/players` | League member | Cursor-paginated global player catalog with current selected-league ownership and active-contract summaries |
| `GET /api/v1/leagues/:leagueId/players/:playerId` | League member | Stable player detail with current selected-league ownership and active-contract summary |
| `POST /api/v1/operations/players/import` | Platform administrator | Run approved player synchronization |
| `POST /api/v1/operations/statistics/refresh` | Platform administrator | Run a durable statistics refresh |
| `GET /api/v1/operations/statistics/refreshes/:jobId` | Platform administrator | Read refresh status |

Provider failures do not erase the last valid statistics.

Any future statistics contract requires exact season context before its
projection can be authoritative. No separate player-statistics endpoint is
approved or claimed here; historical-stat browsing and its eventual API shape
are deferred. Current global player reads still expose latest/last-season data,
and the frontend lacks the required season filter; that is a known follow-up
gap.

Current-season roster and matchup paths must exclude prior-season rows. Before
any current-season game, the approved semantic counters are zero. After a
completed game is due for refresh, absence of current-season data remains
unavailable or stale and must not be silently converted to zero. A future
historical-statistics view may request an older season deliberately, but that
is deferred. FAD and Entry Draft catalogue/search responses require stable
player ID, display name, effective position, and applicable eligibility state
only; absence of statistics or provider credentials cannot make the catalogue
unavailable.

The internal player-game design below is retained for deferred matchup/
statistics work. It is not composed for the provider-independent FAD-18
release, and none of its provider capability, historical binding, artifact, or
credential requirements is a FAD/Entry Draft route prerequisite.

The internal live player-game requirement snapshot remains schema version `1`
because it is local and unshipped. Its exact shape is `schemaVersion`,
`nhlSeasonKey`, `playerIdentityProvider`, sorted `requiredPlayers[]`, sorted
`requiredPlayerGames[]`, and `requirementsSha256`. The normative preimage and
ordering are defined in `FREE_AGENT_DRAFT.md`. Each required-game item is
exactly `{playerId, providerPlayerId, providerTeamId, nhlGameId,
nhlGameScheduledStartsAtMs}` and must reference the exact matching
`requiredPlayers` identity.

The server derives those game bindings from sealed baseline `expected_game`
coverage for whole-game exclusions in matchup weeks whose current status is
`live`, `awaiting_data`, or `correction_required`. A finalized week leaves the
scope and re-enters only if correction moves it back to
`correction_required`. Players referenced only by a retained historical game
remain in `requiredPlayers`, including after a trade, release, team change, or
move to current free agency.

The internal live player-game adapter request is server-authored and contains
the exact refresh scope plus both complete required arrays. Its response must
set `provider` exactly to the configured live-statistics provider, echo the
exact player set, satisfy every required historical binding, and return:

* one coverage disposition per required player: one or more `expected_game`
  entries, one `no_due_game` entry, or one `no_team` entry;
* an affirmative parent current-membership `providerTeamId`, or null only from
  FreeAgents, plus `providerTeamId` on every individual `expected_game` item
  with its exact NHL game identity and scheduled start;
* one explicit player-game observation, including an explicit zero-valued row
  when appropriate, for every and only every `expected_game` pair; and
* one provider, capture identity, and `sourceVersion` shared by the coverage
  manifest and observation rows.

The disposition is `expected_game` whenever the union of required historical
games and current due games is nonempty. Its per-game team may differ from the
parent current-membership team, so one response may carry old-team and
current-team games for the same player. A parent affirmed by FreeAgents may be
null while historical expected games retain their non-null old team.
`no_due_game` and `no_team` are allowed only when that union is empty. The
sealed flat coverage keeps one provider team per expected entry.

The adapter fetches the deduplicated union of its rolling current-game dates
and every required historical game's provider-Eastern calendar date. On those
targeted dates, schedule data must affirm the exact game, start, and bound home
or away team, and PlayerGame data must affirm the exact player/game/team with
an explicit row. Missing or wrong historical team, start, game, or row rejects
the entire response.

The backend rejects the whole refresh when the required-player identity set or
expected player/game identity set differs, when a terminal disposition is not
an affirmative provider result, or when source identity is mixed. Adapter
omission is unavailable data, never an earned zero and never an inferred
`no_due_game` or `no_team`. Coverage entries and observations persist and seal
atomically under independent canonical digests.

Every required historical binding must be an exact-value subset of normalized
flat `expected_game` coverage. All flat expected coverage, including additional
current due games, must still equal the observation identity set. The
`sourceVersion` digest binds both requested arrays, Players and FreeAgents
membership, every requested schedule, and the normalized PlayerGame rows.

The repository rereads the requirement snapshot inside completion and compares
both arrays and `requirementsSha256`. Any concurrent roster, exclusion,
baseline-coverage, identity-mapping, game binding, or matchup-week status
change race-rejects completion and preserves the prior authoritative refresh.

This live-statistics `sourceVersion` is not the source version of a later
late-lock game-state read. Coverage and player-game observations share the
statistics lineage above; the separately requested fresh game-state response
has its own independently digested `sourceVersion`. Late-lock processing
requires compatible providers across the two lineages, not equal source-version
strings.

The previously implemented read-only SportsDataIO capability command is not an
HTTP/browser contract and is no longer a release requirement for FAD. FAD-18
starts with live-statistics adapter composition and the complete automatic
matchup-occurrence runner disabled. It does not require a probe manifest, paid
credential, signed artifact, or required-mode startup. Statistics refresh,
baseline, normal lock, finalization, and matchup-week rollover occurrences all stay off;
FAD, Entry Draft, auction, trade, and outbox workers remain available subject
to their own gates. A later provider-neutral API/runtime amendment must restore
or split automatic matchup processing deliberately.
Those tools may remain unused code until the later provider-neutral statistics
work decides whether to replace or retire them. No route may silently fall back
to synthetic or prior-season scoring data.

The league-scoped player reads require current active membership on every
request and return `404` for another league's private context. They reuse the
global player identity, provider, and statistics projection unchanged, then
add a `league` object containing only the selected league ID, current
ownership kind and roster category, owning team ID and name, and an active
contract summary of original total value, original term, AAV, and remaining
current-or-future league-season years. Ownership and active contract are
independently `null` when absent. League-specific fields are never added to
the global player endpoints or a global player cache.

Both league-scoped player endpoints are strictly read-only. They perform no
import, refresh, normalization, repair, initialization, or other hidden
write.

The league-scoped collection accepts `query`, `status`, `limit`, `cursor`,
and `sort`. `limit` remains bounded at `100`. `sort` defaults to `name`;
`sort=fantasyPoints` is existing legacy behavior over the current global
latest/last-season projection. It is not an authoritative current-season sort.
An exact-season statistics sort is deferred until an explicit season parameter
or endpoint is approved and implemented. Legacy sorting places players without
statistics last and uses normalized player name plus stable player ID as
deterministic tie breakers. A continuation cursor must be reused
with the same query, status, and sort. The authenticated Players catalog
requests one 100-player page at a time in fantasy-points order and follows the
returned cursor only after the user chooses **Load next 100 players**.

Every non-null player `statistics` projection includes its source and exact
season. The prior M7-10 staging source is `sportsdataio-discovery-lab`, whose
Discovery Lab data is labelled last-season data. `release_qa_fixture` is
permitted only as clearly labelled synthetic Release-QA fixture data; it is
never presented as provider-sourced NHL data. Neither source may be projected
as Season 2 current statistics. The existing frontend's last-season section and
fantasy-points-first behavior remain a known presentation gap, not proof of a
current-season API contract.

---

## Rosters and Cap

Grae's 2026-08-11 clarification supersedes the fresh live-provider/game-state
and five-minute mechanism retained later in this section. The whole-game
exclusion outcome remains approved, but late-lock execution and that evidence
mechanism are not composed for the preseason FAD-only candidate. A separate
provider-neutral amendment must define and test the final contract. No roster
route triggers an external refresh; the candidate's full automatic matchup-
occurrence runner is absent.

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/public/leagues/:leagueId/teams/:teamId/roster` | Public when the league is publicly eligible | Return the approved public roster projection only |
| `GET /api/v1/leagues/:leagueId/teams/:teamId/roster` | League member | Return the authenticated team workspace: roster groups, ownership and contract versions, authoritative cap components, retention-slot usage, four-year owned draft picks, friendly trade-asset choices including named buyout annual penalty and remaining term, and saved presentation order |
| `PUT /api/v1/leagues/:leagueId/teams/:teamId/roster-display-order` | Authorized team manager or current commissioner | Save an optimistic, versioned F/D presentation order without changing authoritative ownership slots |
| `PUT /api/v1/leagues/:leagueId/teams/:teamId/roster/:ownershipId/trade-block` | Authorized team manager or current commissioner | Set or clear the versioned informational trade-block flag |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/roster/:ownershipId/move-to-ir` | Authorized team manager or current commissioner | Move an Active provider-eligible player to the first open injured-reserve slot and return the safe post-commit `lateLock` projection |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/roster/:ownershipId/move` | Authorized team manager or current commissioner | Move one owned player to `Active`, `Bench`, or `Injured Reserve` with optimistic ownership versioning, explicit illegal-result confirmation, and the safe post-commit `lateLock` projection |
| `GET /api/v1/leagues/:leagueId/teams/:teamId/roster/legality` | League member | Return authoritative legality reasons without writing |
| `GET /api/v1/leagues/:leagueId/commissioner/roster-workspace` | Current commissioner or platform administrator with active membership | Read-only current teams, seasons, roster, free agents, contracts, cap projections, and provider health |
| `POST /api/v1/leagues/:leagueId/commissioner/roster-additions/previews` | Current commissioner or inherited platform administrator | Read-only preview of adding one free agent or prospect right, including contract, roster, and cap effects |
| `POST /api/v1/leagues/:leagueId/commissioner/roster-additions` | Current commissioner or inherited platform administrator | Confirmed, audited addition with warning confirmation and idempotency |
| `POST /api/v1/leagues/:leagueId/commissioner/roster-removals/previews` | Current commissioner or inherited platform administrator | Read-only preview of removing one ownership and cancelling its active contract when present |
| `POST /api/v1/leagues/:leagueId/commissioner/roster-removals` | Current commissioner or inherited platform administrator | Confirmed, audited removal with optimistic versions, warning confirmation, and idempotency |
| `POST /api/v1/leagues/:leagueId/commissioner/roster-corrections/previews` | Current commissioner or inherited platform administrator | Read-only preview of one existing ownership correction, including cap/legality warnings |
| `POST /api/v1/leagues/:leagueId/commissioner/roster-corrections` | Current commissioner or inherited platform administrator | Confirmed, audited existing-ownership correction with optimistic version and warning confirmation |
| `POST /api/v1/leagues/:leagueId/commissioner/contract-corrections/previews` | Current commissioner or inherited platform administrator | Read-only preview of one existing contract correction, including derived AAV and cap impact |
| `POST /api/v1/leagues/:leagueId/commissioner/contract-corrections` | Current commissioner or inherited platform administrator | Confirmed, audited existing-contract correction with optimistic version and warning confirmation |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/prospects/:playerId/sign` | Authorized team manager | Create the approved ELC |
| `POST /api/v1/leagues/:leagueId/teams/:teamId/prospects/:playerId/decline` | Authorized team manager | Decline the ELC under approved rules |
| `DELETE /api/v1/leagues/:leagueId/teams/:teamId/prospect-rights/:playerId` | Authorized team manager | Release prospect rights |

Prospect signing accepts exactly `destinationCategory` and `expectedVersion`.
The destination is `Prospect`, `Active`, `Bench`, or `Injured Reserve`; the
backend re-derives the current owned right, effective position, first open
slot, fixed `$3` three-season fantasy ELC, current plus next two season IDs,
cap/roster legality, and provider IR eligibility. Signing and the selected
destination commit as one contract/ownership/activity transaction. A signed
player may remain a cap-exempt Prospect, but any normal-roster destination
that is illegal is rejected and cannot be overridden by an illegal-roster
confirmation.

Any signing converts the selected unsigned prospect-right asset by attaching a
fantasy ELC and advancing its ownership version, including when the signed
player remains in `Prospect`. In the same database transaction, every pending
trade containing that previously unsigned player as a `prospect_right` is
changed to cancelled, gets a `proposal_auto_cancelled` trade event and League
Activity entry, and queues the canonical `trade.changed` publication. This
does not prevent a new proposal from trading an already-signed fantasy-ELC
Prospect. The successful signing response returns the affected proposal IDs in
`automaticallyCancelledTradeIds`.

Decline and unsigned-right release each accept exactly `confirmed: true` and
`expectedVersion`, require the current manager of the route team, delete only
that team's current unsigned right, and retain one distinct ownership event
and one League Activity entry atomically. The same transaction cancels and
publishes every pending trade containing the released right; the response
returns those proposal IDs in `automaticallyCancelledTradeIds`. A signed
`fantasy_elc` Prospect is activated through the existing versioned roster-move
route. That activation converts the signed `prospect_right` ownership to
`Rostered` and atomically cancels/publishes pending proposals that still carry
it as a prospect-right asset. Ordinary moves among `Active`, `Bench`, and
`Injured Reserve` do not cancel a proposal. `Prospect` is not an accepted
destination, so activation cannot be reversed back to Prospects.

Transaction-created roster illegality returns a warning in the successful command response. It is not represented as a false failed transaction when the approved feature permits completion.

For a late-legality transition, the roster move may commit while scoring state
reports `awaiting_data`. The future provider-neutral contract must atomically
persist the late roster snapshot, applicable baseline, and immutable whole-game
exclusion evidence before scoring eligibility begins. A selected player whose
game was already underway remains excluded for the entire game, including
events recorded after the late baseline. The exact schedule, evidence,
freshness, replay, and missing-data contract is deferred and cannot be inferred
from the superseded provider clauses below. Missing evidence never becomes
zero.

Every path that commits a roster mutation invokes one shared, never-rejecting
post-commit late-lock coordinator through the canonical writer registry. One
internal committed-mutation batch groups all affected ownership witnesses by
league, season, and team. A surviving ownership supplies its committed version;
a deleted ownership supplies its last committed pre-delete version. The batch
contract is exact in `FREE_AGENT_DRAFT.md` and is not accepted from the browser.

The coordinator rejects any `mutationKind` that is not an exact canonical
registry member. An affected team's `ownershipWitnesses` may be empty only when
the durable committed result proves that the writer changed authoritative
roster legality without changing an ownership tenure, such as a cap-only or
contract-only effect, an effective-position correction, or an effect on a truly
empty roster. The writer derives the affected team from that durable result and
must not substitute an unchanged or synthetic ownership row. Any witness that
is supplied retains the exact committed identity, version, and state rules.

The registry covers current and future roster moves, buyouts and releases,
ordinary and FAD auction wins, automatic Candidate allocations, Candidate
carryover movement, trade acceptance and reversal, commissioner changes,
contract transitions, prospect operations, effective-position corrections,
and every equivalent writer. The coordinator never repeats, compensates,
reverses, or rolls back the mutation. Original-command replay may re-evaluate
the committed receipt but never repeats the original write.

The trade-block endpoint is a legality-neutral metadata exception: it changes
only `trade_blocked`, `updated_at_ms`, and the ownership's optimistic `version`.
It is not a roster-legality writer, is not a registry member, and does not call
the post-commit late-lock coordinator.

For a player or prospect-right team transfer, the internal receipt contains a
deleted source-tenure witness and a distinct present destination-tenure witness
at version `1`. The command's durable result stores the immutable source-to-
destination ownership-ID mapping. Reversal creates and maps a further new
tenure. These internal IDs are not accepted from the browser, and the public
contract continues to expose only the route's approved mutation result and the
safe `lateLock` projection.

After commit, any coordinator input-validation, repository, provider, or
runtime failure maps to `lateLock.status = "awaiting_data"` and cannot reject
the successful command. A roster command never requests or performs an external
statistics refresh. It evaluates only from already committed valid evidence;
otherwise it returns the applicable safe status. A later scheduled provider-
neutral post-game statistics occurrence may start an isolated eligible-lock
retry only after its refresh persists successfully. That retry neither changes
the successful refresh result nor recursively refreshes or repeats a roster
write. The preseason FAD-only candidate omits the complete automatic matchup-
occurrence runner, so neither that refresh nor retry is composed there.

Every successful roster-mutation response includes exactly this additional
safe projection:

```json
{
  "lateLock": {
    "status": "awaiting_data"
  }
}
```

`status` is exactly `completed`, `awaiting_data`, `still_illegal`, or
`not_applicable`. `lockId` is the only optional sibling field and is omitted
unless exactly one safely identifiable completed late lock applies to the
complete command batch. For multiple team results, the public status uses this
exact priority: `awaiting_data`, then `still_illegal`, then `completed`, then
`not_applicable`. The
projection exposes no provider payload, source version, timestamp, selected
roster, coverage, observation, baseline, or exclusion detail. A committed
roster mutation followed by delayed evidence remains an ordinary successful
mutation response with `lateLock.status = "awaiting_data"`; it is not changed
to an HTTP failure. `still_illegal` means the committed roster remains illegal,
and `not_applicable` means no late-lock evaluation applies, including when a
valid lock already exists.

The following replay/evidence details record the superseded provider-specific
design and are non-executable until a provider-neutral amendment explicitly
replaces or adopts them. Late-lock idempotency was semantic reconstruction from committed lock,
baseline, coverage, game-state, and exclusion evidence. Freshly generated
child UUIDs are not compared, but any timestamp, statistics or game-state
source lineage, selected-roster, sealed-coverage, or exclusion difference is a
conflict. No request ID or idempotency-request schema is added for this
internal occurrence. The stored coverage, player-game observation, game-state,
and exclusion digests are each recomputed from their committed IDs and exact
children on replay, use, scoring, and finalization.

Under that superseded design, for a late lock only, sealed affirmative coverage determined the exact
selected-player `expected_game` entries inside the matchup week's
inclusive-start, exclusive-end scoring window. Their distinct NHL games form
the exact request to a separate game-state read observed no more than five
elapsed minutes before the late snapshot; coverage did not itself decide
whether a game is underway. Normal scheduled lock behavior is unchanged and
does not require affirmative selected-player coverage. Exclusion creation and
later finalization require exact current `expected_game` coverage and the
matching observation for each excluded pair, compatible providers, verified
digests/counts, and non-regressed source-update lineage.

The general roster-move request body is exact:

```json
{
  "confirmedIllegal": false,
  "destinationCategory": "Bench",
  "expectedVersion": 7
}
```

When the player is eligible but the projected count or cap result is illegal,
the unconfirmed request returns `409` with code
`ROSTER_ILLEGAL_CONFIRMATION_REQUIRED`, the projected legality details, and no
write. Repeating the same command with `confirmedIllegal: true` persists the
move. Contract, Bench-AAV, injured-reserve eligibility, ownership, authority,
league isolation, malformed input, and stale-version failures remain hard
rejections.

The authenticated team workspace remains a read-only projection. Its salary-cap
usage is the authoritative active-player net AAV plus retained salary and
buyout penalties, and its `legality` object is the authoritative current roster
result. The roster-display-order command accepts the exact current
Active F/D ownership set with ownership versions and an `If-Match`-equivalent
body version. It stores presentation order separately and never changes roster
category, slot, contract, cap, matchup lock, or ownership authority.

Commissioner previews use `POST` because they accept an exact proposed command,
but they run inside a rolled-back transaction and remain byte-for-byte
read-only. Apply commands require `Idempotency-Key`; retrying the same request
returns the original correction and activity evidence without a second
ownership, contract, or activity mutation. Unknown request fields, stale
ownership or contract versions, cross-league IDs, dependent pending trades,
active retained-salary or buyout obligations, and illegal season schedules
fail before durable mutation.

Contract-correction clients submit only `seasonId`, `contractId`, `playerId`,
`expectedVersion`, `correctedOriginalTotalValueCents`,
`correctedOriginalTermYears`, and an optional `reason` (plus
`confirmWarnings` on apply). The backend derives team, contract type, start
season, lifecycle status, buyout lock, AAV, and the complete year schedule
from the authoritative league workspace. Clients cannot author those fields.

Every successful apply atomically records the commissioner correction,
ownership or contract history as applicable, and League Activity with the
authenticated actor, effective authority, selected league, reason, before and
after evidence, warnings, and cap projections. The frontend invalidates the
workspace, player, roster, cap, and activity queries after apply.

The public roster projection contains only:

```text
league: id and public name
season: id and public label
team: id, public name, two required colours, optional third colour, and logo reference
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
| `POST /api/v1/leagues/:leagueId/teams/:teamId/contracts/:contractId/buyout` | Contract owner manager or current commissioner | Buy out the owned player under approved rules and current optimistic versions, then return the safe post-commit `lateLock` projection |
| `POST /api/v1/leagues/:leagueId/contracts/:contractId/corrections` | Commissioner | Create an explicit versioned correction |

There is no general contract-extension endpoint.

The roster shortcuts use only stable league, team, ownership, and contract
identifiers. Trade-block updates require exactly `blocked` and
`expectedVersion`. Active-to-IR requests require exactly `expectedVersion`.
Buyout requests require `confirmed: true`, `expectedContractVersion`, and
`expectedOwnershipVersion`. The backend re-derives authority, current
ownership, provider injury status, available IR capacity, contract state,
buyout lock, and pending-trade conflicts before writing.

The target buyout transaction cancels every pending proposal involving the
player, including a signed player still rostered as `Prospect` whose immutable
trade snapshot uses `prospect_right`. The current staging command misses that
compatibility representation and fails atomically with no partial write. This
is a separate P1 production-promotion follow-up outside the M7-26 isolated-
staging gate; T-074 remains `PLANNED`.

Normal contract creation occurs only through approved feature commands such as
automatic FAD allocation, an auction win, prospect signing, or commissioner
correction. The exact automatic-FAD command and persistence boundary is defined
by the dedicated FAD amendment identified at the start of this document.

---

## Auctions and Bids

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/auctions` | League member | List ordinary or FAD auctions with server context and no competing bid values |
| `POST /api/v1/leagues/:leagueId/auctions` | Authorized team manager or current commissioner | Open an auction or privately queue a final-hour FAD nomination; backend derives ordinary or open-rapid context |
| `GET /api/v1/leagues/:leagueId/auctions/:auctionId` | League member | Read safe context, timing, capabilities, and viewer-managed-team bid state |
| `PUT /api/v1/leagues/:leagueId/auctions/:auctionId/bids/mine` | Authorized team manager | Create or replace the caller team's permitted active bid |
| `PATCH /api/v1/leagues/:leagueId/auctions/:auctionId/bids/:bidId` | Commissioner | Submit or replace approved bid fields without first revealing the stored value or term |
| `DELETE /api/v1/leagues/:leagueId/auctions/:auctionId/bids/:bidId` | Commissioner | Remove a stable identified bid through the confirmed logged workflow |
| `POST /api/v1/leagues/:leagueId/auctions/:auctionId/cancel` | Commissioner | Cancel an unresolved auction through the confirmed logged workflow |
| `POST /api/v1/leagues/:leagueId/auctions/:auctionId/resolve` | Durable system job; commissioner recovery only when approved | Resolve idempotently |

Managers see active auctions and exact `viewerTeams[]` rows for every team they
currently manage. Each row contains per-team eligibility, nullable own bid,
and join/edit capabilities; a missing bid never means an absent team.
Collection `startTeams[]` contains per-managed-team start capability. Resolved
bids are not browsed through the normal auction UI; the complete submitted-bid
and edit history appears in League Activity. A safe terminal-detail summary
remains readable by stable ID for notification, Activity, and recovery links,
as defined by the dedicated FAD amendment.

Both auction GET routes are strictly read-only. Collection search and opaque
cursor pagination use bounded deterministic SQL, and the response never
depends on a write, refresh, or source-row repair. Historical and current bid
rows may coexist: ordinary and open-rapid teams may join again after a
withdrawn or invalid prior bid, while a removed restricted participant remains
ineligible. For restricted auctions, `eligibleTeams[]` is the immutable
original Candidate-tie allowlist; current `viewerTeams[]` eligibility and
participant status report later removal without rewriting that allowlist.
Terminal detail resolves a safe player position from the current league
correction or deterministic source evidence valid when the auction opened,
then current and historical source fallbacks. It therefore remains readable
after later provider conflict or source replacement.

Commissioners cannot query active bid values. Auction list/detail may give
current commissioner authority an `administrativeBids[]` identity projection
whose exact row contains stable bid ID, team ID/projection, bid version/status,
nullable restricted-participant status, and per-bid edit/remove capabilities.
It contains no value, term, AAV, edit history, or minimum offer and exists only
to support explicit bid administration.

For `fad_open_rapid`, an otherwise valid nomination before the creation cutoff
opens the auction. From the cutoff through the final hour before rollover, the
same command accepts the nomination privately and returns the discriminated
result `kind = nomination_queued`; the queue record binds the nominating
team's starter bid and opens at the next fair boundary. No competing manager
may discover that queue record. The immediate-open result uses
`kind = auction_opened`.

Every manager FAD start, queue, join, and permitted edit request carries the
exact binding no-reservation/possible-illegality confirmation. Submission
never reserves cap, position capacity, roster space, player ownership, or any
other bid, but every otherwise-valid winning result creates the contract,
ownership, and roster assignment without a second confirmation, even when
concurrent wins make the aggregate roster illegal. Managers have no
bid-withdrawal endpoint.

Every ordinary or FAD auction offer command accepts `aavCents` and
`termYears`, with any existing team/player/confirmation fields required by the
specific route. `aavCents` must be a safe integer at least `100` and divisible
by `25`; `termYears` is `1`, `2`, or `3`. The backend derives
`totalValueCents = aavCents * termYears` and rejects a client-supplied total as
an unknown field. Start and join floors are evaluated against that derived
total. Safe own-bid and terminal result DTOs continue returning all three
values. Auction ordering is derived total descending, then AAV descending,
followed by the existing context-specific deterministic or committed-draw tie
rule.

For a restricted FAD auction, only a valid current active bid that ranks
strictly above that team's immutable Candidate minimum is a contender.
Commissioner bid removal also permanently marks the linked restricted
participant removed, and the team cannot recreate its bid. If resolution finds
no eligible current active improvement, including after removal or later
invalidity, the transaction closes the restricted auction without a draw and
opens the mandatory fresh league-wide FAD fallback; it does not use generic
`no_winner` handling or release quarantine. The fallback floor is total-first
and AAV-second across terms: total must exceed the tied total, or equal it with
AAV at least the tied AAV. An equal-floor bid may contend.

Cancelling a restricted auction instead moves that allocation to
`correction_required`, creates recovery evidence, and retains player
quarantine. Scheduled and manual resolution use one context-aware transaction
that updates auction and linked FAD allocation together. Any later
restricted-auction correction must do the same or make no partial change and
preserve `correction_required`. Equal terminal offers use an auditable
equal-chance draw only in FAD auction contexts; ordinary weekly auctions retain
their approved deterministic tie rule. Every semantic terminal FAD auction
reveals the nonce behind its pre-resolution commitment; non-tied and no-bid
results expose `selectionUsed = false` with no selected bid, while only an
exact top tie exposes equal-chance selection evidence.

Ordinary-context `T-081` through `T-083` and the FAD-linked `T-080` through
`T-083` administration cases are composed and contract-tested locally with
their exact confirmation bodies, version/idempotency headers, success
representations, and status mapping. T-083 creates or reuses the durable FAD
resolution request but does not resolve a FAD auction inline. FAD-12 composes
that occurrence through the scheduled context-aware resolver for exact
Candidate-tie restricted auctions and allocation-linked restricted-no-
improvement fallbacks. FAD-13 extends the same durable request and resolver to
direct and queued open-rapid auctions without changing the enqueue-only HTTP
response.
Auction services accept inherited platform-administrator
authority with active league membership and persist that actual authority
rather than hard-coding `commissioner`. A system-created restricted Candidate
minimum validates its immutable snapshot/participant evidence and creates no
auction bid, edit count, leader, or cooldown. The participant's first strict
improvement is its ordinary opening bid.

Every successful `T-080` through `T-083` HTTP request writes exactly one
immutable `auction_administration_command_results` row linked one-to-one with
its completed idempotency request:

| Action | Endpoint | Idempotency operation | Stored precondition | Resulting version | Original status |
| --- | --- | --- | --- | --- | --- |
| `edit_bid` | `T-080` | `auction.bid.put` | bid version | expected + 1 | `200` |
| `remove_bid` | `T-081` | `auction.bid.remove` | bid version | expected + 1 | `200` |
| `cancel_auction` | `T-082` | `auction.cancel` | auction version | greater than expected | `200` |
| `request_resolution` | `T-083` | `auction.resolve.request` | auction version | unchanged from expected | `202` |

The row records the league, season, auction, nullable bid, actor user and
membership, actual authority `commissioner` or
`platform_administrator_as_commissioner`, exact request SHA-256, precondition
kind, `expected_resource_version`, `resulting_resource_version`, original
status, `canonical-json-v1` response `data`, and that JSON's lowercase SHA-256.
Edit and removal require resulting = expected + 1; cancellation requires
resulting > expected to permit atomic internal progression; resolution request
requires resulting = expected because it does not mutate the auction. The row
is version `1` and rejects update or delete. For `request_resolution`,
`job_run_id`, a nullable column, is required and references
the exact durable `auction.resolve.target` job occurrence
`auction:<auctionId>:<resolvesAtMs>`; all other actions require `job_run_id`
null. The response `operationId` and `occurrenceKey` come from that durable job.

Fresh success commits the auction changes and history, result row, and
idempotency completion atomically, completing idempotency last. Exact replay
returns the stored status and parses the stored response `data` even after a
later bid edit/removal, auction terminal transition or correction, or job-state
change. Its stored expected/resulting versions remain the immutable version
evidence for that representation; no current version is substituted.
For T-082 only, a nullable stored FAD cancellation allocation is always passed
through the current all-null public allocation projector before fresh return or
replay. A legacy receipt may retain complete internal money and its original
hash, but its public ranked-offer, winner, restricted-minimum, and fallback-
minimum values are null; no other auction state is recomputed.
Therefore a replayed `T-083` keeps its originally accepted `pending` or
`already_succeeded` value rather than projecting the job's current status.
Changed-input key reuse returns `409 IDEMPOTENCY_KEY_REUSED` without altering
the existing request/result pair.

Malformed input, missing or invalid headers, denied authority, invisible or
missing resources, stale preconditions, context/state conflicts, not-due
resolution, and other failed administration requests create neither a new
idempotency request nor a result row. A scheduled system resolution does not
use the commissioner HTTP idempotency contract and creates no administration
result.

M5-02 was the historical baseline that composed the first five routes above.
FAD-06 composed ordinary-context `T-080` through `T-083`, including
commissioner removal, cancellation, and due resolution requests. FAD-11 now
composes their FAD-linked administration, allocation, participant, quarantine,
recovery, and durable-request transactions locally. At FAD-11 closure this did
not yet compose the scheduled FAD resolver or restricted/fallback activation
worker. FAD-12 now composes those workers for the restricted and allocation-
linked fallback contexts while retaining the enqueue-only T-083 response.
FAD-13 composes immediate and queued open-rapid starts, queued activation,
direct/queued resolution, rollover finalization, completion, and the ordinary-
auction handoff behind the same contract boundary.

---

## Trades

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/trades` | League member | List proposals involving authorized teams plus allowed league views |
| `POST /api/v1/leagues/:leagueId/trades` | Authorized proposing team manager | Create a proposal with typed assets |
| `GET /api/v1/leagues/:leagueId/trades/:tradeId` | Authorized participant or commissioner safe view | Read a proposal |
| `GET /api/v1/leagues/:leagueId/trades/:tradeId/acceptance-preview` | Authorized receiving team manager | Revalidate the current proposal and project acceptance effects without writes |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/accept` | Authorized receiving team manager | Revalidate and either complete atomically or persist the acceptance snapshot that projects Awaiting Commissioner Approval when Future Considerations are present |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/decline` | Authorized receiving team manager | Decline |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/cancel` | Authorized proposing team manager | Cancel |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/approve` | Current commissioner or inherited platform administrator | T-148: revalidate and atomically complete only a receiver-accepted Future-Considerations proposal awaiting approval |
| `GET /api/v1/leagues/:leagueId/trades/:tradeId/reversal-preview` | Current commissioner | Preview exact direct-reversal recoverability without writes |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/reverse` | Current commissioner | Reverse atomically only when every asset remains exactly recoverable |
| `POST /api/v1/leagues/:leagueId/trades/:tradeId/correction-required` | Current commissioner | Route an unsafe completed trade to explicit correction recovery without moving assets |

Proposal creation accepts standalone Player (contracted Active/Bench/IR or
prospect right), Draft pick, Buyout obligation, and Future Considerations asset
types. Requested retention is accepted only within an outgoing contracted
Player asset. A standalone retention asset is rejected with
`TRADE_ASSET_TYPE_UNSUPPORTED` on a fresh request. Persisted legacy retention
rows and proposals remain readable and remain executable or reversible when
their recorded model/state permits. An exact retry of an already-completed
proposal-creation idempotency key returns the stored original result before
fresh-request grammar validation; it performs no new write or revalidation.

`accept` and `approve` require `Idempotency-Key` and an empty request body.
Acceptance revalidates ownership, contracts, requested retention, obligations,
picks, rights, deadline, and proposal status inside one transaction. Without
Future Considerations it returns `TRADE_ACCEPTED` and completes. With Future
Considerations it writes the durable acceptance snapshot, moves nothing, and
returns `TRADE_AWAITING_COMMISSIONER_APPROVAL` with presentation status
`Awaiting Commissioner Approval` while storage status remains `proposed`.
Exact acceptance replay returns `TRADE_ACCEPTANCE_REPLAYED` without another
effect.

Approval requires the current commissioner or inherited platform administrator
and the awaiting-approval projection. It revalidates the current proposal and
returns `TRADE_APPROVED` after atomic completion;
`TRADE_APPROVAL_REPLAYED` is the exact idempotent replay. A plain `Pending`
proposal, missing receiver acceptance, terminal state, stale asset, or expired
deadline fails without moving any asset. Commissioner authority alone grants no
proposal, receiver-response, or cancellation write.

No counter endpoint or atomic counter service exists in M7-26. A receiver may
reject and later create an independent reversed-role proposal only when they
hold proposing-team manager authority; documentation and clients must not
present that sequence as atomic countering.

For every transferred player or prospect right, that transaction closes the
source ownership tenure, creates a distinct destination ownership at version
`1`, and stores the exact immutable old-to-new ownership-ID mapping. A reversal
closes that destination tenure and creates a new source tenure. Idempotent
replay returns the original result and mapping without repeating any write.

Multiple simultaneous proposals may reference the same asset. Completion of one cancels or invalidates affected proposals according to the approved trade specification.

An unused on-clock Entry Draft pick may remain in multiple pending proposals.
Creating a proposal does not reserve the pick or pause the clock. Acceptance,
manual selection, and the timeout job therefore race under one
first-commit-wins rule: each transaction revalidates current pick ownership,
proposal status, and the same live clock before committing. A winning
selection consumes the pick and advances to the next clock. A winning trade
records the pick's one allowed on-clock trade, transfers ownership, cancels
proposals made stale by that transfer, and starts a fresh full clock for the
same pick. Each loser rejects without a partial trade, selection, queue, or
clock effect.

Each `buyout_obligation` choice is a stable whole obligation. Its friendly
workspace projection includes the bought-out player's name, annual penalty in
cents, and remaining year count. Trade creation submits only that stable
obligation ID; acceptance transfers the complete unchanged remaining schedule
and never accepts an arbitrary partial amount.

M5-11 composes the seven participant workflow routes above. M5-10 composes the
three current-commissioner recovery routes. Acceptance and reversal previews
remain SELECT-only and never advance proposal state on read.

---

## Matchups and Standings

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks` | League member | List persisted weeks and pairings |
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/current` | League member | Return authoritative current week |
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId` | League member | Return week, matchup summaries, and status |
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId/matchups/:matchupId` | League member | Return matchup-period G, A, points, and FP from the applicable normal or late zero baseline plus safe whole-game exclusion state; count no event from an excluded player/game pair |
| `GET /api/v1/leagues/:leagueId/seasons/:seasonId/standings` | League member | Return official derived standings and status |
| `POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-schedules` | Commissioner or inherited member platform administrator before live season | Persist an explicitly selected Week 1 start and generate the approved balanced schedule |
| `PATCH /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-weeks/:weekId` | Commissioner under timing constraints | Adjust approved future boundaries or pairings |
| `POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-results/:resultId/corrections` | Commissioner or inherited member platform administrator | Append a versioned correction |
| `POST /api/v1/leagues/:leagueId/seasons/:seasonId/standings/rebuilds` | Commissioner or inherited member platform administrator for recovery | Rebuild non-final derived standings from official result versions |
| `POST /api/v1/leagues/:leagueId/seasons/:seasonId/standings/finalizations` | Commissioner or inherited member platform administrator | Explicitly create one provenance-complete canonical final standings snapshot |

Matchup week and detail reads resolve current team names for scheduled and
live rows. Final rows use the stored finalized display context so a later team
rename does not rewrite historical results. A legitimate historical
`not_live` scoring-health state is a valid read projection, not a response
contract failure.

`T-095` accepts exactly:

```json
{
  "nhlRegularSeasonStartsAtMs": 1788246000000,
  "nhlRegularSeasonEndsAtMs": 1804489200000,
  "fantasyPlayoffsStartAtMs": 1802070000000,
  "fantasyPlayoffsEndAtMs": 1804489200000,
  "firstWeekStartsAtMs": 1791183600000,
  "confirmed": false
}
```

The four calendar values and selected Week 1 start are explicit safe-integer
UTC instants. The backend requires
`regular start < playoff start < playoff end = regular end`, exactly 28
elapsed days from playoff start through playoff end, and UTC calendar years
matching the two halves of the season's canonical NHL key. It then validates
the selected Week 1 start against the approved league-timezone week
boundaries, NHL regular-season range, playoff reservation, current server
time, season state, team set, and existing-schedule state. The first full
NHL-season week may be presented as a recommendation, but the backend never
substitutes any missing calendar or Week 1 value.

This is the authoritative calendar path for the inaugural season and the
reset-created original league's initial Season 2, whose four persisted
calendar fields intentionally begin all null. A preview uses the supplied
tuple without writing. A confirmed command accepts the persisted season
calendar only when all four fields are null or all four already equal the
supplied tuple; a partial or conflicting persisted tuple is `409`. In the
all-null case the confirmed transaction persists the exact tuple, Week 1, and
the complete schedule atomically and advances the season version only once.
In the already-equal case it creates only the schedule state and still
advances the season version once. No GET, inferred NHL default, startup path,
or FAD readiness operation may silently populate or repair these fields.

With `confirmed: false`, the command is a read-only preview, does not require
`If-Match` or `Idempotency-Key`, returns `200`, and contains exactly:

```text
code                            MATCHUP_SCHEDULE_PREVIEWED
preview.seasonId
preview.expectedSeasonVersion
preview.nhlRegularSeasonStartsAtMs
preview.nhlRegularSeasonEndsAtMs
preview.fantasyPlayoffsStartAtMs
preview.fantasyPlayoffsEndAtMs
preview.calendarWillBePersisted
preview.firstWeekStartsAtMs
preview.participantCount
preview.weekCount
preview.matchupCount
preview.byeCount
preview.lastWeekEndsAtMs
```

With `confirmed: true`, season-version `If-Match` and `Idempotency-Key` are
required. The same authoritative plan is recalculated inside the write
transaction. Success returns `201` with exactly:

```text
code                            MATCHUP_SCHEDULE_GENERATED
result.operationId
result.seasonId
result.seasonVersion
result.nhlRegularSeasonStartsAtMs
result.nhlRegularSeasonEndsAtMs
result.fantasyPlayoffsStartAtMs
result.fantasyPlayoffsEndAtMs
result.calendarPersisted
result.firstWeekId
result.firstWeekStartsAtMs
result.participantCount
result.weekCount
result.matchupCount
result.byeCount
result.lastWeekEndsAtMs
```

An exact replay returns the original `201` result. Malformed or invalid timing
is `400`; missing league authority is `403`; a cross-league season is
side-channel-safe `404`; an ineligible season or existing schedule is `409`;
and stale season `If-Match` is `412`. Neither mode accepts a missing
`firstWeekStartsAtMs`.

The confirmed command stores one immutable schedule-command result linked to
the exact idempotency request and request hash. That row contains every field
of the original `201` result plus its schedule generation and before/after
aggregate versions. Replay reads this immutable result; a later T-096 shift or
server-owned FAD recovery cannot change the original response. Preview creates
neither an idempotency row nor a schedule-command result.

After persisting that result, confirmed T-095 checks for the exact same-season
genuine-inaugural readiness occurrence. If it is canonically blocked with its
same failed job because the schedule was missing, T-095 inserts one immutable
corrective-requeue row, resets that job cleanly to `pending`, advances the
operation `blocked` to `blocked` by one aligned version without changing its
attempt count or blocker evidence, and completes T-095 idempotency last. No
matching operation, or a pending, running, or succeeded pair, is a no-op.
Malformed split state fails the full schedule command. Exact T-095 replay reads
the original command result and performs no corrective write.

Before automatic Candidate Card opening, an authorized `T-096` schedule edit
may replace Week 1 with another valid explicit start. Once opening readiness
commits, every manager- or commissioner-authored matchup schedule writer
permanently rejects a change to Week 1 because that instant owns the frozen
Candidate deadline and rapid-rollover schedule.

For the FAD clock path, `T-096` targets the persisted sequence-1 `weekId`,
requires that week's `If-Match`, `Idempotency-Key`, and exactly:

```json
{
  "action": "shift_week_one",
  "firstWeekStartsAtMs": 1791788400000,
  "confirmation": "CHANGE WEEK 1 START"
}
```

The immutable idempotency request uses operation
`matchup.schedule.shift_week_one.v1` and canonical precondition kind `week`.
Its request hash covers the exact league, season, Week 1 ID, expected Week 1
version, and three-field body. Actor and client key remain part of the durable
idempotency scope rather than the hashed body. The canonical `200` response
hash covers the ten response fields below and excludes the per-request
`meta.requestId`.

The transaction revalidates the same timing/calendar rules as `T-095`, requires
the old and new Week 1 instants to be in the future, shifts every persisted
regular-season week by the corresponding league-local calendar interval,
recomputes its baseline/lock/end/rollover timestamps and unexecuted job
occurrences, preserves pairings/byes, increments every affected week and season
version, and commits atomically. Success returns `200` with exactly:

```text
operationId
seasonId
seasonVersion
weekId
weekVersion
previousFirstWeekStartsAtMs
firstWeekStartsAtMs
lastWeekEndsAtMs
shiftedWeekCount
replacedJobOccurrenceCount
```

T-096 also persists an immutable schedule-command result linked to the exact
idempotency request, request hash, old/new generation, and old/new
season/Week 1 versions. Exact replay returns the original `200` fields even
after a later approved schedule generation.

The command is denied with `409 FAD_WEEK_ONE_FROZEN` after Candidate Card
opening, even if the FAD is later completed. A live, locked, finalized, or
otherwise non-editable week is `409`; a stale Week 1 version is `412`; and all
other shared validation, authority, isolation, and idempotency rules apply.
Pairing-only schedule edits use their separately approved discriminator and
must leave the persisted Week 1 start unchanged while FAD protection applies.

Automatic readiness after a late Entry Draft may instead advance Week 1 by
whole league-local Mondays and regenerate the not-yet-opened schedule and job
occurrences in the same all-or-none transaction that opens Candidate Cards.
After opening, only the server-owned FAD completion transaction may move Week 1
again: when completion overruns the frozen start, it selects the first valid
league-local Monday after durable FAD completion, removes unavailable early
regular-season weeks, regenerates fair remaining pairings and versioned jobs,
and publishes FAD completion atomically. Matchup-start and baseline jobs require
both the FAD-completion gate and the current matching schedule version. In a
race, the first transaction to commit wins and the loser revalidates without
leaving partial completion, schedule, pairing, or job state.

Recovery audit state durably distinguishes a replaced job from an unexecuted
removed-week job that was cancelled without a successor. The public T-141
`scheduleRecoveryEvidence` contract remains exactly the closed shape in
`FREE_AGENT_DRAFT.md`: `replacedJobs[]` contains only actual old/new pairs.
Cancellation-only evidence is internal and does not add a public
`cancelledJobs` field.

### Official Standings Finalization

`T-145` uses:

```http
POST /api/v1/leagues/:leagueId/seasons/:seasonId/standings/finalizations
If-Match: "<current season version>"
Idempotency-Key: <opaque 1-128 character key>
Content-Type: application/json
```

The exact body is:

```json
{
  "resultSetHash": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "confirmation": "FINALIZE REGULAR SEASON STANDINGS"
}
```

`resultSetHash` is exactly 64 lowercase hexadecimal characters. It is the
SHA-256 digest of the deterministic UTF-8 canonical payload defined in Data
Model for the complete current official result-version set. Unknown fields,
an alternate confirmation, or a malformed hash are rejected.

The backend reauthorizes the current commissioner, or an inherited platform
administrator with active membership in the league, inside one immediate
transaction. A fresh request requires:

* the target to be the league's current active same-league season;
* every expected regular-season week to be terminal and its scoring window to
  have ended;
* every expected non-bye matchup to have exactly one stable result whose
  current version is `official` or approved `corrected`;
* no missing, duplicate, pending, void, cross-league, cross-season,
  wrong-team, invalid-total, invalid-outcome, correction-pending, or ambiguous
  source;
* complete season-participant, scoring-rule, and standings-rule identity;
* the submitted hash to equal the hash recalculated inside the transaction;
* no existing canonical final snapshot for a fresh command.

The transaction recalculates all rows and competition ranks and atomically:

1. inserts one immutable canonical final snapshot;
2. inserts every immutable standings row and exact snapshot-to-result-version
   provenance link;
3. records expected-matchup, included-result, participant, rule-version, hash,
   and finalization evidence;
4. records one succeeded standings-finalization operation and one Security
   Audit event with the actual authority used;
5. creates one deduplicated `standings_finalized` in-app notification for
   every active league member;
6. writes one league-scoped metadata-only `standings.changed` invalidation;
7. increments the season aggregate version and completes idempotency as the
   final write.

It creates no League Activity, email, push message, matchup result, result
correction, scheduled job, season rollover, contract rollover, or FAD write.
No GET, standings rebuild, weekly rollover, season rollover, startup,
migration, or repair path may call this command or synthesize its evidence.

Success returns `201` with exactly:

```text
code                                    STANDINGS_FINALIZED
finalization.operationId
finalization.snapshotId
finalization.snapshotVersion
finalization.leagueId
finalization.seasonId
finalization.seasonVersion
finalization.standingsRuleVersion
finalization.resultSetHash
finalization.expectedMatchupCount
finalization.includedResultCount
finalization.participantCount
finalization.finalizedAtMs
```

An exact idempotent replay returns the original `201` representation from
immutable finalization evidence before checking current season state, version,
or clock. Reusing the key for changed input returns
`409 IDEMPOTENCY_KEY_REUSED`. A simultaneous fresh request has one winner; a
loser with a different key returns `409 STANDINGS_ALREADY_FINALIZED`.

Malformed input or missing required headers returns
`400 STANDINGS_FINALIZATION_INPUT_INVALID`; missing authority returns
`403 LEAGUE_COMMISSIONER_REQUIRED`; an unavailable or cross-league league or
season returns side-channel-safe `404`; unfinished weeks, missing or invalid
results, unresolved corrections, or incomplete rule/participant state returns
`409 STANDINGS_FINALIZATION_NOT_READY`; a changed current result-version set
returns `409 STANDINGS_RESULT_SET_CHANGED`; an existing non-replay canonical
final returns `409 STANDINGS_ALREADY_FINALIZED`; a conflicting legacy
snapshot that cannot be safely classified as noncanonical history returns
`409 STANDINGS_FINALIZATION_LEGACY_CONFLICT`; and stale season `If-Match`
returns `412 STANDINGS_FINALIZATION_PRECONDITION_FAILED`. Every failure before
commit leaves snapshot, result, season, operation, audit, notification,
outbox, and idempotency state unchanged.

A legacy row marked `final`, a `current` rebuild snapshot, or any snapshot
without the complete hash, rule, count, exact result-version links, and
succeeded T-145 evidence never satisfies this contract or T-037 rollover
readiness. A reviewed migration may preserve it as historical derived output;
the application may not infer missing provenance.

Finalization requires exactly one current
`season_matchup_schedule_generations` row for the league-season and the exact
succeeded immutable `schedule_generate` operation named by that generation.
Historical succeeded operations remain valid only behind contiguous
`superseded` generation rows and do not make the current root ambiguous.

The current generation must prove exactly one source: initial T-095 metadata
with the sorted stable `participantTeamIds` array plus participant, week, and
matchup counts; an exact immutable T-096 schedule-command result; or an exact
server-owned FAD pre-open/completion schedule-recovery record. The T-096 and
FAD branches bind their predecessor and resulting current generation and may
use their own canonical actor, reason, and metadata shapes. Every branch must
produce the effective stable team set and counts that exactly match the
terminal schedule being finalized. Missing, cross-scope, split,
noncontiguous, or malformed lineage is `409 STANDINGS_FINALIZATION_NOT_READY`.
A count without the stable ID set remains insufficient because it cannot
detect same-cardinality team substitution.

### Rebuild and Post-Finalization Correction

`T-097` uses:

```http
POST /api/v1/leagues/:leagueId/seasons/:seasonId/matchup-results/:resultId/corrections
Content-Type: application/json
```

A read-only preview accepts either the legacy compatibility body:

```json
{
  "confirmed": false
}
```

or the normal contextual body:

```json
{
  "confirmed": false,
  "homeScoreHundredths": 450,
  "awayScoreHundredths": 375,
  "reason": "Approved official scoring correction"
}
```

The two score fields are required together in the contextual form and `reason`
is optional under the same validation as apply. The legacy body remains
supported for compatibility; the contextual body is the normal UI contract.

It requires neither `If-Match` nor `Idempotency-Key`, performs no write, and
returns `200` with exactly:

```text
code                                      MATCHUP_RESULT_CORRECTION_PREVIEWED
preview.resultId
preview.expectedVersion
preview.weekId
preview.matchupId
preview.currentVersion.id
preview.currentVersion.versionNumber
preview.currentVersion.homeScoreHundredths
preview.currentVersion.awayScoreHundredths
preview.currentVersion.outcome
preview.week.id
preview.week.sequence
preview.week.startsAtMs
preview.week.endsAtMs
preview.matchup.id
preview.matchup.homeTeam.id
preview.matchup.homeTeam.name
preview.matchup.awayTeam.id
preview.matchup.awayTeam.name
preview.proposedVersion.homeScoreHundredths
preview.proposedVersion.awayScoreHundredths
preview.proposedVersion.outcome
preview.standingsImpact.currentRows
preview.standingsImpact.projectedRows
preview.standingsImpact.changedTeamIds
```

The contextual fields are returned for the contextual form; legacy callers keep
their compatible base preview. Preview performs no rebuild and no write.

An apply command requires:

```http
If-Match: "<current matchup-result aggregate version>"
Idempotency-Key: <opaque 1-128 character key>
```

and exactly the three required fields below plus the optional `reason` field:

```json
{
  "confirmed": true,
  "homeScoreHundredths": 450,
  "awayScoreHundredths": 375,
  "reason": "Approved official scoring correction"
}
```

Scores are non-negative safe integers in persisted fantasy-point hundredths.
When supplied, the reason is trimmed, contains no control characters, and is
between 1 and 500 characters. When omitted, the backend records the canonical
correction-type reason `Official matchup result correction`. The idempotency
request hash distinguishes an omitted written reason from an explicitly
supplied reason, including that exact fallback text. Success returns `200`
with exactly:

```text
code                                      MATCHUP_RESULT_CORRECTED
result.resultId
result.resultVersionId
result.resultVersionNumber
result.resultVersion
result.leagueId
result.seasonId
result.weekId
result.matchupId
result.correctedAtMs
result.standingsReplacement               null before canonical finalization
result.standingsReplacement.snapshotId    present after canonical finalization
result.standingsReplacement.snapshotVersion
result.standingsReplacement.resultSetHash
result.standingsReplacement.standingsRowsChanged
```

`resultVersion` is the incremented matchup-result aggregate version used by a
later `If-Match`; `resultVersionNumber` is the appended immutable result
history version. A post-final correction always returns a replacement
projection, including when only provenance changed and
`standingsRowsChanged` is `false`.

Exact replay returns the original `200` representation from immutable
idempotency, result-version, and optional replacement-finalization evidence
before reading mutable matchup/standings state, sampling the clock, or
generating identifiers. Reusing the key with changed scope, expected version,
scores, confirmation, or reason returns `409 IDEMPOTENCY_KEY_REUSED`.
Malformed input or missing apply headers returns `400`; missing authority
returns `403`; an unavailable or cross-league resource returns side-channel-
safe `404`; invalid current state returns `409`; and a stale result version
returns `412` with a refetch instruction. Every failure leaves result,
standings, season, operation, audit, notification, outbox, idempotency, and
League Activity state unchanged.

`T-098` remains an explicit commissioner recovery command for non-final
derived standings. It may preserve and replace derived snapshot versions, but
it never creates, promotes, supersedes, or replaces the canonical final
snapshot and never makes a season rollover-ready. T-098 is absent from the
normal commissioner UI; contextual T-097 correction is the normal workflow.

Before T-145 succeeds, `T-097` appends an approved result version and current
read-derived standings use it normally. After a canonical final snapshot
exists, T-097 is one coupled immediate transaction: it appends and selects the
new official result version, calculates and inserts the complete replacement
canonical snapshot, rows, links, hash and counts, preserves the prior snapshot,
advances the canonical designation, writes matchup and standings operation
evidence plus Security Audit and scoped invalidation, creates deduplicated
member notifications when an official row or rank changes, and completes
idempotency last. A provenance-only change still creates a replacement
snapshot but no member notification.

If approved matchup recovery has moved the target matchup and its week to
`correction_required`, T-097 accepts only that exact paired state. In the same
transaction it compare-and-swaps both rows back to `final` before inserting
replacement result-version links. A mixed matchup/week state rejects without
writes, and every later failure restores the original paired recovery state.

The same replacement contract applies after season rollover. Initial `T-145`
finalization remains limited to the league's active current season. A later
`T-097` correction may instead target that exact completed non-current season,
uses the replaced generation's preserved rule and count basis rather than the
new current season's settings, advances only the historical season aggregate,
and leaves the league's current-season pointer and current season unchanged.

If any replacement calculation, provenance, notification, audit, outbox, or
late persistence seam fails, the result correction also rolls back. T-097 may
never leave a corrected official result paired with a stale final snapshot.
It creates no League Activity.

Every appended correction version has exactly one immutable succeeded
`result_correct` matchup operation with the same league, season, week,
matchup, actor, reason, timestamp, result ID, and result-version ID. T-145
rejects a corrected result chain before writing unless every correction
version has that complete operation evidence.

For both paths, the completed idempotency record uses operation
`matchup.result.correct.v1`, result type `matchup_result_correction`, and
identifies the newly appended `matchup_result_versions` row as its result. The
result-version link supplies the authoritative league and season. If that
season has never had canonical finalization history, completion requires the
new version to be the current official version and requires no linked
correction-propagation finalization. If canonical finalization already existed
when the correction committed, the same idempotency request must also own
exactly one complete `result_correction` replacement finalization whose
snapshot links that new result version.

A correction that genuinely committed before the first canonical finalization
continues to replay its original null-replacement result after later T-145
work. That exception is proven without timestamps: the initial
`regular_season_completion` snapshot must link the correction's result version
or a later version reached through a contiguous direct supersession chain.
If the initial snapshot instead links an earlier or unrelated version, the
correction omitted a required post-final replacement and replay fails closed.

A post-final replacement differs from the prior canonical result-version link
set at exactly one matchup. The replacement link keeps the same week, matchup,
and result IDs; its result-version number is exactly one greater; and the new
version directly supersedes the version linked by the prior snapshot. Every
other result-version link remains identical.

The matchup-detail response includes a nullable `matchup.scoring` projection.
When available, it contains:

* `mode`: `live` or `final`;
* `home` and `away`: the stable `teamId`, locked-roster `legal` flag,
  `scoreHundredths`, and player rows;
* each player row: stable `playerId`, `fullName`, `positionGroup`,
  `slotNumber`, matchup-period `gamesPlayedDelta`, `goalDelta`,
  `assistDelta`, `pointDelta`, `scoreHundredths`, and `dataStatus`.

`pointDelta` equals `goalDelta + assistDelta`. A missing provider row uses
`dataStatus: "missing"` so clients can distinguish unavailable data from an
earned zero. Final player scoring is reconstructed from the exact statistics
refresh associated with the result. If a commissioner correction changes an
official team total, `result.currentVersion` remains authoritative; the
source-snapshot player rows are not presented as a player-level correction.
For a late lock with whole-game exclusions, every excluded player/game pair
must exist in both the sealed baseline and the selected current refresh with
compatible provider/source lineage and non-regressed source-update time.
Otherwise matchup scoring reports `awaiting_data`, and no final result or final
standings lineage may become official from that incomplete score.

Manager views convert `health.scoring` into plain-language delay or
unavailability messages and do not expose provider timestamps as primary UI.
All matchup and season-list reads remain SELECT-only.

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
| `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/schedule` | Commissioner | Persist or replace the confirmed scheduled start and its durable occurrence; does not open the draft |
| `GET /api/v1/leagues/:leagueId/entry-drafts/:draftId/queue` | Authorized manager | Read only that manager/team private queue |
| `PUT /api/v1/leagues/:leagueId/entry-drafts/:draftId/queue` | Authorized manager | Replace ordered private queue using `If-Match` |
| `POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/selections` | Authorized on-clock manager, assigned-league commissioner, or timeout job | Make one immutable selection or confirmed commissioner forfeiture; the final terminal pick completes the draft |

There is no selection undo endpoint.

The action that makes the last unused pick terminal is the only Entry Draft
transaction that changes the draft to `Complete`. Before that same transaction
commits, it invokes the internal `entry_draft_completed` FAD-readiness handoff
and persists the exact canonical operation/job pair. A handoff failure rolls
back the selection or forfeiture, pick state, and draft completion. A later
blocked readiness attempt does not undo the completed draft. There is no
`/complete` route or other standalone manual completion command. T-108 and the
Entry Draft frontend remain M8 `PLANNED`; FAD-08's internal handoff primitive
is not an endpoint and does not change the endpoint inventory.

The Entry Draft scheduling command is exact:

```http
POST /api/v1/leagues/:leagueId/entry-drafts/:draftId/schedule
If-Match: "<current Entry Draft version>"
Idempotency-Key: <opaque 1-128 character key>
Content-Type: application/json

{
  "action": "schedule",
  "scheduledStartsAtMs": 1840780800000,
  "confirmation": "SCHEDULE ENTRY DRAFT",
  "reason": null
}
```

An existing still-scheduled, unexecuted occurrence instead requires
`action = "reschedule"` and
`confirmation = "RESCHEDULE ENTRY DRAFT"`. `reason` is optional; when present
it is a trimmed 1-500 character commissioner note. Unknown or missing fields
fail closed, except that omitted `reason` is equivalent to `null`.

The route accepts the current assigned-league commissioner or inherited
member platform administrator. It derives the source current season, the
draft's already-planned target season, the complete persisted target calendar
and matchup schedule, the actor, and the occurrence key on the server. The
body cannot select or replace any of those values. `scheduledStartsAtMs` is a
future safe-integer UTC instant interpreted for display in the league timezone.
The transaction requires complete normalized setup/order/eligibility/
pick-owner state and the canonical completed-source evidence needed by the
product workflow, while the due job still performs the complete T-037
revalidation. Initial scheduling is the attributable atomic setup
confirmation; it does not assume an earlier hidden confirmation write.

Initial scheduling atomically changes the base draft from `setup` or
`lottery_ready` to `ready`, creates its scheduled rollover binding and pending
`league:entry_draft_rollover` job, records the attributable draft event,
Security Audit, member notification fan-out, and scoped invalidation, and
advances the draft version. It also writes one immutable
`entry_draft_schedule_operations` result linked to the idempotency request.
Rescheduling writes another immutable operation row and may replace only a `scheduled`
binding whose prior job has not begun and for which no rollover attempt or
successful rollover exists. It marks the replaced job occurrence `skipped`
with no lease, attempt, terminal, result, error, or retry payload, updates the
binding to a new occurrence, creates the new pending job, records the bounded
reschedule reason on the immutable schedule operation plus attributable audit
evidence, records the notification, and advances the same draft aggregate
once. It cannot replace a due, leased, running, blocked, or succeeded
occurrence.

Initial success returns `201 ENTRY_DRAFT_SCHEDULED`; reschedule success returns
`200 ENTRY_DRAFT_RESCHEDULED`. Both return exactly:

```text
operationId
entryDraftId
entryDraftVersion
rolloverBindingId
rolloverBindingVersion
rolloverOccurrenceId
scheduledStartsAtMs
jobRunId
action
```

Exact idempotency replay reads the immutable schedule-operation result and
returns the original status and representation; it never reconstructs an old
result from the binding after a later reschedule.
Changed-input key reuse is `409 IDEMPOTENCY_KEY_REUSED`; stale draft version is
`412 ENTRY_DRAFT_SCHEDULE_PRECONDITION_FAILED`; a non-replaceable occurrence,
incomplete setup, invalid source/target/calendar/schedule relationship, or
ineligible lifecycle is `409 ENTRY_DRAFT_SCHEDULE_NOT_ALLOWED`; invalid
timing is `422 ENTRY_DRAFT_SCHEDULE_NOT_FUTURE`; missing authority is `403`;
cross-league or invisible resources are side-channel-safe `404`; and malformed
input is `400 ENTRY_DRAFT_SCHEDULE_INPUT_INVALID`.

Scheduling binds the exact draft, source season, already-planned target season
and calendar, start instant, and one replaceable unexecuted occurrence. At that
instant the scheduler invokes the shared T-037 service; only after its complete
contract/ownership/obligation/season rollover commits may the same outer
transaction open trading, move the draft to `Live`, and start the first unused
pick's full clock. A blocked rollover leaves trading and selections locked and
exposes only the approved idempotent T-037 commissioner retry.

Selection is one shared atomic service for manager, attributable commissioner,
and automatic-timeout sources. A selection cancels every pending proposal that
still contains the pick. Selection and an accepted on-clock trade both
compare-and-swap the same pick, owner, draft, and clock state; the first commit
wins. A successful ownership-changing trade consumes the pick's one allowed
on-clock trade and starts a fresh full clock for the new owner, while every
losing selection, timeout, or trade transaction leaves no partial effect.

---

## Free Agent Draft

The exact request, response, privacy, phase, error, and command bodies are
defined by `docs/04-technical-specs/FREE_AGENT_DRAFT.md`.

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/navigation` | League member | Read safe active or historical navigation state |
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/readiness?seasonId=:seasonId` | Current commissioner or inherited platform administrator with active league membership | Read persisted automatic-opening readiness and blockers without writes |
| `POST /api/v1/leagues/:leagueId/free-agent-drafts/readiness/retries` | Current commissioner or inherited platform administrator with active league membership | Idempotently retry the same blocked automatic-readiness occurrence without opening parameters |
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId` | League member | Read viewer-filtered overview |
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/private` | Team manager or exact active help authority | Read one authorized private card |
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards` | League member after publication | Legacy compatibility read returning viewer-filtered selected-team result summaries; never expose the complete audit cards |
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/history` | League member after publication | Legacy compatibility read of one viewer-filtered selected-team result; normal UI redirects this deep link to results |
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/eligible-players` | Authorized private editor | Search server-confirmed candidates for one slot |
| `PUT /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId` | Authorized private editor | Atomically save the complete 22-slot Candidate Card draft |
| `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/revision-previews` | Authorized private editor | Preview one revision without writes |
| `PUT /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/slots/:slotKey/candidate` | Authorized private editor | Add one candidate |
| `PATCH /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId` | Authorized private editor | Edit one candidate offer |
| `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId/move` | Authorized private editor | Move one candidate or compatible carryover projection |
| `DELETE /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/entries/:entryId` | Authorized private editor | Remove one candidate |
| `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/candidate-cards/:teamId/help-requests` | Team manager during the adaptive help window | Grant exact-card commissioner help |
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/results?teamId=:teamId` | League member after publication | Read paginated viewer-filtered selected-team results |
| `GET /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/recovery` | Commissioner | Read safe FAD operational state |
| `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/recovery/actions` | Commissioner | Retry one allowlisted idempotent operation |
| `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/allocations/:allocationId/correction-previews` | Commissioner | Preview deterministic atomic repair without writes |
| `POST /api/v1/leagues/:leagueId/free-agent-drafts/:fadId/allocations/:allocationId/corrections` | Commissioner | Apply confirmed deterministic repair |

Published FAD reads expose only durable viewer-filtered results. Every T-131
summary row has exactly `leagueId`, `seasonId`, `fadId`, `teamId`, safe `team`,
`lifecycleStatus`, and `outcomeCounts = { signed, notWon, tied }`. T-132 returns
exactly `leagueId`, `seasonId`, `fadId`, `teamId`, safe `team`, and `results[]`;
it is a selected-team compatibility result, not a Candidate Card or audit-
history DTO.

Every T-132 result and T-140 `data[]` row is exactly `player`, `status`,
nullable `offer`, and nullable `tieAuctionId`. Status is the wire value
`signed`, `not_won`, or `tied`. Offer is null or exactly
`{ totalValueCents, aavCents, termYears }`, and it is complete only for the
current manager of the exact selected team. `tieAuctionId` is non-null only for
that manager when a tied row has a currently actionable auction. Every other
active member, including a commissioner, inherited platform administrator, or
manager of another team, receives null offer and tie action. No card, slot,
position, rank, winner resource, participant, draw, cap, editor, conflict,
intervention, recovery, or other audit field exists in these result rows.
Pending and `correction_required` allocations produce no T-131 count and no
T-132/T-140 row.

T-140 requires `teamId`; optional `q`, `status`, `limit`, and `cursor` are the
only other query fields. `status` accepts only the three wire values above.
Default limit is 50 and maximum is 100. Ordering is normalized player name then
stable player ID, and the cursor fingerprint binds league, FAD, selected team,
normalized search, status, and limit.

T-143 and T-144 keep complete monetary evidence inside the repository/policy
boundary for correction recomputation, fingerprint, and persistence checks.
Their public ranked-offer, winner, restricted/fallback-minimum, and delta
`totalValueCents`/`termYears`/`aavCents` fields are always null. Complete-money
and partial-null public correction tuples fail closed. Commissioner, inherited
platform-administrator, manager, or combined authority never widens this
operational correction projection. Every T-144 stored response, including a
legacy full-money receipt, passes through the current all-null projector before
fresh return or replay without rewriting immutable stored or fingerprint
evidence. T-082 applies the same rule to its nullable stored FAD-cancellation
allocation.

The M7-26 staging release gate verifies both immutable receipt families with
the identity- and physical-path-bound read-only command
`npm run db:scan:fad-public-receipts:staging`; it validates canonical
response/hash/identity evidence, runs the current all-null projector and strict
public validator for legacy full-money receipts, and never rewrites them.

Literal `navigation` and `readiness` route families register before `:fadId`.
Private-card reads and legacy viewer-filtered post-publication result reads are
separate resources and must never share a frontend cache key. Result keys bind
the exact selected team, and membership or manager-assignment change cancels
and removes all viewer-sensitive T-131/T-132/T-140 caches for the league before
rendering; invalidation alone is not sufficient.

T-126 accepts no query or exactly the complete
`rosterSeasonId`/`rosterTeamId` pair. T-127 accepts exactly `seasonId`; T-129
accepts no query. Unknown, partial, duplicate, or malformed query shapes are
`400` before repository access. Every league-scoped FAD route requires active
membership. An active platform administrator uses the guaranteed protected
active `member` membership; missing membership is invariant corruption and
grants no inherited access until reconciled.

T-130, T-132, T-134 through T-139, and T-146 accept no query. T-131 accepts
only optional `cursor` and `limit`. T-140 requires `teamId` and accepts only
optional `q`, `status`, `cursor`, and `limit`. T-133 accepts only required
`slotKey` plus optional `q`, `cursor`, and `limit`. Search text collapses
whitespace, trims, lowercases for matching, and is limited to 200 Unicode code
points; deterministic order is normalized player name then player ID. Its
versioned base64url cursor is limited to 1024 characters and binds a filter hash
to the exact card, slot, normalized search, and limit. Cursor or query mismatch
is `400`. T-134 is a read-only preview and ignores supplied concurrency or
idempotency headers. T-135 through T-138 require an exactly quoted positive
integer card `If-Match` plus a trimmed, control-free 1-through-128-code-point
`Idempotency-Key`. T-146 requires the same two headers and treats them as one
whole-card intent. T-139 requires that same key form and forbids `If-Match`.
Its body may be `{}`, `{ "message": null }`, or one trimmed control-free string
of at most 500 Unicode code points; whitespace-only normalizes to null.

T-146 has the exact body `{ "slots": [...] }`. `slots` contains exactly 22
items in canonical `F01` through `F12`, `D01` through `D06`, and `B01` through
`B04` order. Every item is exactly `{ "slotKey": string, "candidate": value }`.
`candidate` is either null or exactly
`{ "playerId": uuid, "aavCents": positive-integer-or-null,
"termYears": 1-or-2-or-3-or-null }`. A null candidate means the editable slot
is empty. A non-null candidate with either contract field absent is a saved
incomplete row, has null derived total, does not participate in allocation, and remains
visible in locked history. A carryover slot requires `candidate: null`; the
server preserves its authoritative carryover occupant and rejects any attempt
to replace or recontract it. Duplicate, missing, extra, out-of-order, or
unknown slots and unknown object fields are `400`. Player duplication,
position incompatibility, ineligibility, present AAV below `100`, present AAV
not divisible by `25`, a completed Bench offer above `400` AAV cents, an
authoritative projected cap above `10000` cents, and other invalid complete
contracts use the normal safe Candidate validation errors. The server derives
each completed row's `totalValueCents` exactly as AAV times term and validates
the entire desired card before one immediate
transaction replaces it, so no prefix of the request can persist.

Every newly accepted T-146 intent advances `cardVersion` once, records one
`candidate_card_saved` revision, and returns exactly
`{ card, revisionId, changedEntryIds }`; `changedEntryIds` is canonically
sorted and may be empty for a logical no-op. Replaying the same idempotency key
and request hash returns its original result without another version or
revision. Reusing the key for a
different request is `409 IDEMPOTENCY_KEY_REUSED`. A stale non-replay is
`412 CANDIDATE_CARD_PRECONDITION_FAILED` with the current version/refetch
detail and no write.

Every FAD JSON request body is limited to `16 KiB`; an oversized body returns
`413 FREE_AGENT_DRAFT_REQUEST_TOO_LARGE` before domain work. Eligible-player
search and T-134's read-only preview use the shared authenticated read limits.
FAD writes must satisfy both ceilings in their shared limiter profile:

| Profile and routes | Per session | Per league | Window |
| --- | ---: | ---: | ---: |
| `fad_candidate_write`, T-135 through T-138 and T-146 | `120` | `600` | `15 elapsed minutes` |
| `fad_help_write`, T-139 | `5` | `25` | `60 elapsed minutes` |
| `fad_operational_write`, FAD operational commands | `30` | `120` | `15 elapsed minutes` |

Exceeding either ceiling returns `429` without a domain write.
The Candidate and help profiles are enforced by the composed FAD-09 router.
The operational profile is configured in the shared policy; each later
operational route must compose it before that endpoint can leave `PLANNED`.

T-133 and Candidate preview/save validation share one exact rights-release
re-entry predicate. Every same-league `fantasy_elc_declined` or
`unsigned_prospect_rights_released` ownership event blocks that player unless
a same-league `draft_eligible_players` row with
`eligibility_reason = rights_release_reentry` binds the exact event through
`rights_release_event_id`, belongs to a confirmed same-league snapshot, and
that snapshot was confirmed strictly after the release occurred. Every release
requires its own later approval, so a newer release blocks again after an
earlier approval. T-133's measured plan must use the schema-34 release-event,
exact re-entry, and recovery-quarantine indexes; its ordered single-player
release lookup must not use a temporary sort B-tree.

T-134 keeps `baseCardVersion` equal to the current persisted version and gives
`projectedCard.cardVersion` the hypothetical next version without advancing
persistence. The projected card is `private_read_only`, and every projected
capability is disabled with `PREVIEW_ONLY`. An add uses a deterministic,
non-persisted preview-only UUID and entry version 1; the authoritative T-135
add creates a different resource identity. A move's `projectedSlot` is its
destination, an edit's is the entry's current intended slot, and a remove's is
null. Preview diagnostics are deduplicated and sorted by code then nullable
resource ID, and use only the structural-conflict, over-cap, and safe
candidate-validation forms defined by the FAD technical specification. The
same authorized preview remains available during a league freeze because it
is read-only, while its projected capabilities remain disabled.

Candidate operations are exactly `candidate_card.add`, `candidate_card.edit`,
`candidate_card.move`, `candidate_card.remove`, and `candidate_card.help`.
Every Candidate replay first re-establishes current exact-card authority. After
that check, exact replay precedes current phase, deadline, freeze, version,
resource, and business validation and returns the immutable original status and
representation. This prevents a former manager or expired help authority from
replaying private data while preserving retry safety after later state changes.

T-126 sets `showMainNavigation = true` only from automatic Candidate Card
opening until the earlier of FAD completion or the current competition Week 1
start. It is false exactly at `competitionFirstMatchupStartsAtMs`, including
when nonterminal recovery remains; roster history and commissioner recovery
controls remain the post-start entry points.

T-141's optional `scheduleRecoveryEvidence` projection is exact and closed as
defined in `FREE_AGENT_DRAFT.md`. Its `removedWeekIds[]` and
`removedMatchupIds[]` come from immutable recovery children, while
`replacedJobs[]` projects only durable `replaced` old/new job pairs. Internal
`cancelled` job effects are intentionally not projected.

FAD-08 supplies one internal readiness-handoff primitive that runs only inside
its caller's existing write transaction. The future final T-108 selection or
confirmed-forfeiture transaction owns `entry_draft_completed`; T-036 owns
`no_draft_inaugural` for an ordinary genuine-inaugural start; and T-037 owns
`no_draft_initial_season2`. The exact reset-origin T-036 branch activates the
league and season without calling the primitive. Each actual handoff caller
atomically creates or idempotently reuses one exact readiness operation and one
pending `fad_readiness` job after validating its authoritative source. Caller
rollback removes both rows, and conflicting trigger evidence fails closed. The
canonical server-owned inaugural reason is exactly `Inaugural league season.`
There is no post-commit in-memory trigger, commissioner-chosen opening time,
separate confirmation command, or public handoff/completion route.

If confirmed T-095 schedule creation supplies the missing calendar for an
already-blocked genuine-inaugural occurrence, the same T-095 transaction may
reset only that occurrence's exact failed job to clean `pending`, preserve its
attempt count and evidence, advance the blocked operation one aligned version,
and persist distinct immutable corrective-requeue evidence. It creates no new
trigger and does not impersonate a T-128 commissioner retry. Absent, pending,
running, or succeeded readiness is a no-op; split or malformed state rolls the
complete T-095 transaction back. Exact T-095 replay still returns its original
immutable schedule-command result without another requeue.

FAD-08 owns readiness-job execution. Its all-or-none opening transaction
revalidates the opening path, current season/rollover evidence, teams and
managers, authoritative carryovers, complete cap/roster structure, and current
schedule. When required it first applies the approved whole-Monday Week 1
rewrite in that transaction, then creates the FAD, all team
snapshots/cards/version-one revisions,
carryovers, seven initial rollovers, `fad_deadline_reminder` and `fad_deadline`
occurrences, activity, notifications, and scoped invalidations. FAD-10 owns
execution of those reminder/deadline occurrences. Any blocker rolls the whole
opening transaction back; the same leased job then records one immutable
blocked attempt and deduplicated commissioner notification in a separate
transaction with no opening or schedule effect.

At the deadline, FAD-10 performs final Candidate synchronization, locks and
revises every card, expires help, seals every immutable 22-slot snapshot,
creates one pending allocation plus `fad_allocation` job per distinct Candidate
player, changes the FAD to `deadline_locked`, and publishes the league view in
one outer transaction. The target runtime then executes allocation coordinator
-> per-player allocation -> allocation coordinator in the same scheduler cycle
before ordinary auction resolution. The first coordinator enters `allocating`
or takes a zero-allocation FAD directly to `rapid`; the second reaches `rapid`
only when no allocation remains pending and creates aggregate manager/team
results. Exact Candidate ties remain scheduled or quarantined until the future
restricted-auction privacy and activation gate.

T-127 reads the operation and latest immutable attempt snapshot; it never runs
preflight and there is no readiness-preview route. Its Week 1 before/after
objects are nullable, and initial rollovers are empty until an attempt persists
a complete clock, then exactly seven. A team projection is exactly `teamId`,
safe `team`, `managerReady`, nullable `managerAssignmentId`, `carryoverCount`,
`openForwardSlots`, `openDefenceSlots`, `openBenchSlots`, and
`structuralConflictCount`. A prior rollover is exactly `rolloverId`,
`fromSeasonId`, `toSeasonId`, `completedAtMs`, and `manifestSha256`.
Every public T-127 blocker or warning is exactly `code`, `message`, and
nullable `resourceId`. The persisted readiness operation's internal blocker
mirror remains exactly `code`, nullable `field`, nullable `resourceType`,
nullable `resourceId`, and `message`; the two internal-only fields are never
projected through T-127.

T-128 can only retry the same persisted blocked occurrence. It requires the
exact readiness-operation version and idempotency key. Its scope is actor user,
league, operation, and client key, and a fresh request has a 24-hour lifetime.
Current authority is revalidated before replay detection; exact replay is then
checked before the service samples time or IDs. Fresh acceptance leaves the
operation blocked, advances it exactly one version, requeues the same job, and
writes one immutable `202` receipt atomically; the worker later performs the
blocked-to-running transition. Exact replay performs no write and returns the
receipt's original canonical `data` even after later readiness changes, while
the envelope uses the current request's `meta.requestId`. Missing or cross-
scope readiness is side-channel-safe `404`; same-league nonblocked or
canonical-job-unavailable state is `409 FAD_READINESS_NOT_READY`; stale
readiness is `412 FAD_READINESS_PRECONDITION_FAILED`.
That `412` includes only safe `details.currentVersion` and
`details.refetch = true`. A body over the shared FAD `16 KiB` limit is
`413 FREE_AGENT_DRAFT_REQUEST_TOO_LARGE`; malformed JSON remains `400`.

Schema 31 adds immutable `free_agent_draft_readiness_attempts` and
`free_agent_draft_readiness_retry_receipts` with canonical response/projection
JSON, hashes, same-league evidence, and immutability guards. Migration 0030
remains byte-for-byte frozen. Migration 0031 replaces only its readiness
forward-update trigger so the exact receipt-backed blocked-to-blocked retry is
legal; no other schema-30 table definition or trigger changes.
Migration `0031` is pinned locally at `46,693` bytes with lowercase SHA-256
`f2c5104f2eb06e261cc902067bd4623b841f2c37a04f73d27487863077b2662a`.

The job and readiness-operation claim are one transaction. Fresh pending and
blocked-retry claims advance both attempt counts once and copy one live lease
identity to both rows. Reclaim at or after an expired `running` lease requires
a fresh fencing token and atomically advances only the versions of the same
job and operation from `running` to `running`; attempt counts, original start
timestamps, and result evidence remain unchanged, and the old token is fenced.
The abandoned lease creates no separate completed-attempt row. A failed
readiness job is not directly claimable; an approved retry or corrective
prerequisite writer first resets that same job cleanly to `pending`. Finalized
additive migration `0032` creates no table or index and replaces only the
readiness forward-update trigger to admit that exact guarded handoff while
leaving migrations `0030` and `0031` byte-for-byte unchanged. It also adds one
job-side reclaim guard that proves the old job/operation lease and version
match, exact job-version advance, and bounded fresh lease before the
operation-side guard accepts the new state. Migration `0032` is pinned at
`27,882` bytes with lowercase SHA-256
`ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`.

Additive migration `0033_add_fad_readiness_corrective_requeues.sql`
preserves migrations `0030` through `0032` byte-for-byte. It adds immutable
`free_agent_draft_readiness_corrective_requeues` evidence, its same-league and
immutability guards, and only the job/readiness trigger branches needed for the
exact T-095 failed-to-pending plus blocked-to-blocked aligned requeue. The row
binds the immutable T-095 command result and new schedule generation to the
same genuine-inaugural operation/job and latest immutable blocked attempt,
unchanged attempt/blocker evidence, retained prior terminal/retry timestamps,
and prior/resulting one-version advances. It is not a T-128 receipt. Migration
or startup code never manufactures a row or readiness occurrence. The
finalized migration is `56,084` bytes with lowercase SHA-256
`93714178a4c89687578ca340afbe69c317239118cb50765838e6123ff6faf7f1`.
Its schema-33 inventory is `127` application tables, `128` including the
migration ledger, `127` repository-catalog entries, `45` post-reset
require-empty tables, `82` signed-reset-policy tables, and `63` delete guards.
The fresh/upgrade schema, identity, catalog, and reset package passes `64/64`
while migrations `0030` through `0032` retain their pinned identities.

Additive migration
`0034_add_candidate_eligibility_search_indexes.sql` is finalized at `1,158`
bytes with lowercase SHA-256
`9347331419ada113707a4e71ef87c578ddd3cd0bd4ddb9578164f08b3307bb36`.
It preserves all schema-33 rows, tables, triggers, guards, reset policy, and
repository-catalog entries; adds only these indexes; and advances
`application_metadata.data_model_version` from `33` to `34`:

* non-partial `free_agent_draft_recoveries_league_player_status` on
  `(league_id ASC, player_id ASC, status ASC)` for correlated recovery
  quarantine;
* partial `ownership_events_candidate_release_by_player` on
  `(league_id ASC, player_id ASC, occurred_at_ms DESC, id DESC)` where
  `event_type IN ('fantasy_elc_declined',
  'unsigned_prospect_rights_released')`, filtering to Candidate-blocking events
  and satisfying stable newest-first release order without a temporary sort;
* partial `draft_eligible_players_rights_release_reentry` on
  `(league_id ASC, player_id ASC, rights_release_event_id ASC,
  eligibility_snapshot_id ASC)` where
  `eligibility_reason = 'rights_release_reentry'`, supporting the correlated
  exact-event approval and confirmed-snapshot join.

Because migration `0034` adds no table or trigger, the schema-33 inventory
remains `127` application tables, `128` including `schema_migrations`, `127`
repository-catalog entries, `45` post-reset require-empty tables, `82`
signed-reset-policy tables, and `63` delete guards. Fresh `1 -> 34` and exact
`33 -> 34` proof must preserve that inventory and reproduce all three index
definitions, the expected T-133 query plans, `integrity_check = ok`, and zero
foreign-key violations.

Additive migration `0035_add_candidate_card_help_command_results.sql` preserves
migrations `0030` through `0034` byte-for-byte and adds immutable
`candidate_card_help_command_results` evidence for exact T-139 status and
response replay, including the distinct newly-created and already-active help
outcomes. It is finalized at `10,981` bytes with lowercase SHA-256
`cbbaf5322c111f3d13659cf6adc1a5046c8b49ba0ab84c3541d770a1dae3b669`.

The FAD-09 local target was schema version `36`. Additive migration
`0036_add_fad_eligibility_revalidation_occurrences.sql` preserves every earlier
migration byte and adds immutable
`free_agent_draft_eligibility_revalidation_occurrences`. A provider catalog
apply creates one row only for each player/open-FAD/source-operation semantic
Candidate-eligibility change: active status or effective F/D position.
Presentation, raw-payload, or source-version-only changes create no occurrence,
and a league position override may mask a source-position change. Each
occurrence binds the exact before/after evidence and delta hash to one pending
`fad_eligibility_revalidation` shared-lease job; one global
`player_catalog_applied` event seals the complete batch in the same transaction.

The leased worker synchronizes matching cards and terminalizes its job in one
transaction. The deadline transaction performs one final authoritative
all-card synchronization, leaves terminal jobs unchanged, and uses exact
compare-and-swap state to consume observed `pending`, `failed`, `leased`, or
`running` jobs as `skipped` with outcome `deadline_reconciled`; stale workers
cannot later commit. The schema rejects `cards_open` to `deadline_locked` until
every bound occurrence job is `succeeded` or `skipped`.

Migration `0036` is finalized at `22,871` bytes with lowercase SHA-256
`1351e25758d7192ab804214f0abeb696a9b0a9b3509e81dcd276ac7570fbb1f6`.
Schema 36 contains `129` application tables, `130` tables including
`schema_migrations`, `129` repository-catalog entries, `47` post-reset
require-empty tables, `82` signed-reset-policy tables, and `69` delete guards.
Fresh `1 -> 36` and exact `35 -> 36` proof preserve every prior ledger identity
and application row and finish with `integrity_check = ok` and zero foreign-key
violations.

Additive migration `0037_allow_atomic_fad_deadline_allocations.sql` permits
only the pending allocation insert owned by the exact live claimed deadline
occurrence while the root FAD is still `cards_open`.
Fabricated, stale, mismatched, or unrelated writes remain rejected. It is
finalized at `4,142` bytes with lowercase SHA-256
`33b8e7c3479f9a3dc64011a29ced6421a5cc59eca62da8b8144cf82b1d0d80b3`.

Schema `38` was the FAD-10 local target. Additive migration
`0038_allow_pre_fad12_restricted_scheduling.sql` replaces only the allocation
forward-update guard so an exact Candidate tie remains
`restricted_scheduled` for the next complete rapid rollover rather than
activating before FAD-12. Mismatched context, rollover identity, or past-due
scheduling remains rejected, and ordinary weekly-auction behavior is
unchanged. It is finalized at `17,157` bytes with lowercase SHA-256
`b4567d087b31ff70dfa2776f2a15e6d22e182600d3dd5e5446a169bb64bb5ac5`.

Neither migration adds an application table, catalog entry, reset-policy
entry, or delete guard. Schema 38 therefore retains `129` application tables,
`130` including `schema_migrations`, `129` repository-catalog entries, `47`
post-reset require-empty tables, `82` signed-reset-policy tables, and `69`
delete guards. Fresh and exact-upgrade proof preserves every earlier ledger
identity and application row with integrity and foreign keys clean. None of
migrations `0023` through `0038` had reached shared staging or production at
FAD-10 closure.

FAD-11 adds migration `0039_add_fad_recovery_correction_evidence.sql`, pinned
at `201,713` bytes with lowercase SHA-256
`a176479f3eb3fc1183c595a68026a2e5b73d6b975b66b6bcab5de4954945ae6f`.
It provides immutable T-142/T-144 command-result, recovery/correction, queue-
acceptance, and supporting guard evidence. Migration
`0040_allow_atomic_fad_restricted_fallback_overlap.sql`, pinned at `9,449`
bytes with lowercase SHA-256
`cff71c33b628504d38b53cfe1621363740791c119c5b214d7d11e10f216a5a92`,
advanced the FAD-11 local target to schema `40`. It admits only the exact
transaction-bound resolving-restricted/open-fallback overlap and exact complete
fallback window; all unrelated active overlap remains rejected.

Schema 40 contains `131` application tables, `132` including
`schema_migrations`, and `131` repository-catalog entries.

FAD-12 adds migration
`0041_allow_fad_auction_resolution_recovery_resume.sql`, pinned at `35,525`
bytes with lowercase SHA-256
`00d6926934d46089df6581a8c3edc296394ce57958155e36da7d15b2be61111b`;
migration `0042_use_current_aav_for_restricted_participant_floor.sql`, pinned
at `9,326` bytes with lowercase SHA-256
`4269c4a0c320364b65d20c01b167ff8738f1a67c7e4d52160e6e2245e201e537`;
and migration `0043_allow_repeat_fad_auction_resolution_recovery.sql`, pinned
at `92,011` bytes with lowercase SHA-256
`1623d40ffaa477e3ba0be6bdd7c831f3d16489b53e4befc03eb7aa0e6efa6ae3`.
Schema 43 was the FAD-12 local target with the same `131` application tables,
`132` including `schema_migrations`, and `131` repository-catalog entries.

FAD-13 adds migration `0044_allow_immediate_fad_open_rapid_starts.sql`, pinned
at `32,654` bytes with lowercase SHA-256
`79f759030c01281f4a21aeba0584a3681d0ae84982d2b7a48dfcd7a5bf0274ee`;
migration
`0045_allow_restart_safe_fad_queued_nomination_activation.sql`, pinned at
`74,289` bytes with lowercase SHA-256
`cd2a7d3059b6ab0f484267b6999cbadd6db1a86114fcdb67e4220296dca9ae37`;
migration `0046_bind_fad_open_rapid_starter_edit_limit.sql`, pinned at `18,329`
bytes with lowercase SHA-256
`78626350a1efa3e76b09f3ba2dc812b135b1e2d19dd2c01d2e973a57a6a884bb`;
and migration
`0047_allow_restart_safe_fad_rollover_finalization.sql`, pinned at `14,129`
bytes with lowercase SHA-256
`bdabbcff52cd87c932c3f2e067d825786fd6dac6354ea4a3a90396ec972b0b2b`.
Schema 47 was the FAD-13 local target at `131` application tables, `132`
including `schema_migrations`, and `131` repository-catalog entries.

FAD-14 adds trigger-only migration
`0048_require_canonical_fad_realtime_evidence.sql`, pinned at `73,524` bytes,
`1,490` lines, and lowercase SHA-256
`c08445d1b3833343f9c276dff3cd9400ebce6e282665179b992f47919feceb21`.
It preserves schema `48` as the intermediate canonical realtime-evidence
checkpoint. Trigger-only migration
`0049_require_canonical_fad_setup_exemption_publications.sql`, pinned at
`29,571` bytes, `748` lines, and lowercase SHA-256
`5109baabaeed39e06498c7c26274a41a48edfbbdee958e7dd6b278021a29ebc6`,
reconciles the setup-exemption Activity, exact commissioner notification, and
three required publications. At that FAD-14 local checkpoint, schema `49` had
`131` application tables, `132` including `schema_migrations`, and `131`
repository-catalog entries. At that checkpoint none of migrations `0023`
through `0049` had reached shared staging or production; these values are
historical evidence rather than the current shared-tree inventory.

T-129 always returns `managedCards`, `commissionerCards`, and
`queuedNominations`; an unauthorized array is empty. Before publication a
caller without commissioner authority receives numeric `participatingTeams`
and null for every other league-wide count. `viewPublishedCards` is a retained
compatibility capability name for the viewer-filtered selected-team result; it
is allowed only after publication and otherwise uses `PHASE_CLOSED`.
`viewRecovery`
requires current commissioner authority and otherwise uses `NOT_AUTHORIZED`.
`completeRecoveryAction` checks authority first, then requires one exact
actionable recovery, using `NOT_AUTHORIZED` or `RECOVERY_NOT_AVAILABLE`
respectively. `presentation` may remain null through FAD-08.
`scheduleRecoveryOperationId` identifies only completion-overrun recovery;
pre-open old/new Week 1 remains T-127 attempt evidence.

As of the FAD-08 local closure on `2026-08-08`, T-126 through T-129 are composed
through their real repository, service, router, target-runtime, and worker
boundaries. Their privacy, exact query/error/cache shapes, read-only GETs, and
immutable T-128 replay after later terminal readiness success pass within the
`336/336` behavior gate. This is local contract evidence only; it does not mean
frontend-connected or staging-verified.

As of the FAD-09 local closure on `2026-08-08`, T-130 and T-133 through T-139
are composed through their real repository, service, router, target-runtime,
shared limiter, summer-writer, provider-revalidation, shared-worker, and final
deadline-reconciliation boundaries. The target endpoint inventory is exactly
`110`. Provider occurrence/job/deadline proof passes `60/60`, the complete
summer-writer selection passes `262/262`, direct Candidate HTTP passes `36/36`,
composed runtime passes `66/66`, the local staging verifier passes `9/9`, and
reset bootstrap passes `8/8`, with no failure or skip. This is local contract
evidence only; there is no frontend caller, shared staging has not been deployed
or verified, and production remains untouched.

As of the FAD-10 local closure on `2026-08-09`, T-131, T-132, and T-140 are
composed through their real read repository, service, router, and target-
runtime boundaries. The target endpoint inventory is exactly `113`. The exact
FAD-10 closure matrix passes `200/200` across `23` suites; separate recorded
gates pass `4/4` composed-runtime tests, `18/18` coordinator tests, `103/103`
shared-auction regression tests, and `7/7` post-amendment reminder tests.

The historical published-read proof at that checkpoint covered the then-current
pending-result shape: T-132 kept Candidate-slot outcomes null until durable
allocation evidence existed, and T-140 returned pending structures without an
invented decision, winner, rank, restricted/fallback state, recovery, resolution
time, or draw. The 2026-08-21 contract supersedes that public shape and now
omits pending rows entirely. This is historical local evidence only. There was
no frontend caller, shared staging deployment/verification, or production
change at that checkpoint.

As of the FAD-11 local closure on `2026-08-10`, T-141 through T-144 and the
FAD-linked T-080 through T-083 administration paths are composed through their
real repository, service, router, and target-runtime boundaries. The local
target endpoint inventory is exactly `117`. The shared restricted
no-improvement fallback is transaction-owned and locally verified, including
immediate and delayed full-window outcomes, exact replay, lease/recovery fences,
privacy-safe publication timing, collision isolation, and rollback.

Separate recorded gates pass `197/197` broader recovery/correction/
administration tests, `96/96` schema/runtime tests, `62/62` ordinary-auction
compatibility tests, and `40/40` complete administration-repository tests on
Node.js `24.14.1`. This is local contract evidence only. At FAD-11 closure the
scheduled resolver still filtered to ordinary auctions and restricted/fallback
activation was not composed. No frontend caller or shared environment changed.

As of the FAD-12 local closure on `2026-08-10`, server-derived restricted/
fallback manager bidding, read/edit-limit projection, current strict-
improvement validation, AAV/term ranking, committed exact-top draw, no-
selection reveal, restricted no-improvement fallback, and allocation-linked
fallback winner/no-winner settlement are composed. The atomic writer owns
normal pricing, contract/ownership/roster persistence, summer synchronization,
allocation/activity/outbox evidence, exact replay, and winner-only post-commit
late-lock coordination. Deterministic failures record one causal recovery;
transient failures remain leased for expired reclaim; T-142 resumes the exact
failed job, auction, allocation, and recovery; and repeated failures bind to
the latest failure event and completed receipt through schema `43`.

At that checkpoint, the target scheduler awaited FAD resolution, restricted
activation, and fallback activation before the preserved ordinary resolver,
then ran FAD completion. Exact Node.js `24.14.1` gates pass `52/52` resolver policy/
persistence/shared fallback, `15/15` service/runner, `71/71` activation/job-
repository, `50/50` bid/HTTP/read capability, `170/170` ordinary auction/
administration compatibility, `303/303` schema-43/current-head, and `94/94`
final scheduler/runtime/deployment/ordinary compatibility tests. T-083 remains a durable
`202` request rather than an inline resolution. At that checkpoint, direct and
queued open-rapid resolution remained FAD-13 work and was rejected by the
FAD-12 decision service.
There was no frontend caller; shared staging and production were not opened,
migrated, deployed, or verified.

As of the FAD-13 local closure on `2026-08-10`, T-077 derives an immediate
open-rapid start with more than 60 minutes remaining or a private queued start
at the cutoff, and the queued starter opens atomically at its exact rollover
for a complete following cycle. T-079 preserves the ordinary starter/non-starter
edit and cooldown rules in both direct and queued open-rapid contexts. T-083
continues to return its durable enqueue-only `202`; the same FAD resolver now
settles direct and queued auctions, including exact-top draw, allocation-null
winner, and no-bid unclaimed outcomes. Restart-safe activation, contiguous
extension rollover finalization, causal recovery, atomic FAD/Week 1 completion,
the matchup-start guard, and the season-start-plus-completion ordinary-auction
handoff are composed locally. The endpoint inventory remains exactly `117`.

Separate, overlapping Node.js `24.14.1` evidence passes `11/11` start-decision
policy, `10/10` immediate-start writer, `23/23` FAD start/lifecycle, `12/12`
ordinary creation compatibility, `125/125` queued activation, `22/22` focused
allocation-null resolution writer, `18/18` focused resolution service/runner,
`73/73` broader allocation-null resolution, and `122/122` bid/read
compatibility. Final closure gates pass `280/280` schema-47/current-head,
`42/42` rollover policy/writer/service/runner, `31/31` completion, `77/77`
runtime composition, and `15/15` matchup-start guard tests. These records are
not added into one aggregate total. There is still no frontend caller; no
shared staging or production environment was opened, migrated, deployed, or
verified.

As of the FAD-14 local closure on `2026-08-11`, the approved Activity and
notification registries, exact four-publication Candidate Card opening,
canonical eight-related-ID envelopes, private queued-nomination audiences,
reconnect reauthorization, and the exact three-publication setup-exemption
contract are composed. `fad_setup_exemption_authorized` remains the explicit
eleventh FAD Activity and thirteenth FAD notification. The local target
endpoint inventory remains exactly `117` on schema `49`.

Separate pinned Node.js `24.14.1` records pass `1,294/1,294` focused core tests
across `142` suites and `110` unique files, `95/95` production JavaScript
syntax checks, `265/265` schema-49 pin/runtime/reset/release/staging-verifier
tests, and `189/189` former-failure consolidation tests. The authoritative full
backend gate records `3,266` tests across `436` suites: `3,264` passed, zero
failed, cancelled, or todo, and two intentional Windows link-capability skips
(`symlink` and `target`) in
`sportsDataIoLiveCapabilityArtifactFoundation.test.js`, in about
`30m03.603s`. No FAD frontend or shared environment changed; migrations `0023`
through `0049` remain local only.

As of the active M7-26 shared tree on `2026-08-20`, the local target is schema
`54` with `54` migration files, `133` application tables and repository-catalog
entries, and `134` physical tables including `schema_migrations`. The composed
runtime inventory is `123` routes. The conceptual endpoint catalogue becomes
`148` entries after T-147 notification batch acknowledgement and T-148 trade
approval; conceptual catalogue count and composed runtime-route count are
different measures. This records current local inventory only. It does not
claim a final full-suite pass, shared-staging migration/deployment, or production
change.

T-130 remains privately readable after the deadline while publication is
pending, but returns phase `deadline_processing`, visibility
`private_read_only`, and denied mutation capabilities. During that interval,
T-133 through T-138 return `409 FAD_DEADLINE_PASSED` and T-139 returns
`409 FAD_HELP_WINDOW_CLOSED`. Every private Candidate path returns
`409 FAD_PHASE_CONFLICT` after publication. Entry absence and cross-card,
cross-team, or cross-league entry references use the same side-channel-safe
`404 CANDIDATE_CARD_ENTRY_NOT_FOUND`. Stale card writes expose only
`details.currentVersion` and `details.refetch = true` with
`412 CANDIDATE_CARD_PRECONDITION_FAILED`.

Each card exposes the full 12-forward, 6-defence, and 4-bench structure.
Carryovers occupy immutable slots. A submitted Candidate offer may remain
stored while the card has an unresolved carried-roster structural conflict or
is over the salary cap, but either illegality excludes every non-carryover
candidate until a later valid revision restores whole-card legality before the
deadline. Structural conflict is the deterministic exclusion reason when both
exist, while cap status still reports the overage. The help window is derived
from the actual available Candidate period, not hard-coded to the final 48
hours.

The initial seven rapid rollover boundaries are extensible, not a maximum.
Queued nominations, delayed restricted activation, mandatory fallback, or
recovery creates the next contiguous fair 24-hour boundary when required. FAD
completion waits for every allocation, queue, rollover, auction, and recovery
to reach its approved terminal state; when completion overruns Week 1, its
server-owned schedule recovery and the completion marker commit together.

---

## Activity and Notifications

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/leagues/:leagueId/activity` | League member | Cursor-paginated approved League Activity |
| `GET /api/v1/leagues/:leagueId/security-audit` | League member | Cursor-paginated approved league-scoped login and security events |
| `GET /api/v1/notifications` | Authenticated | Read-only cursor page for the caller using `cursor`, `limit`, and `readStatus=all|read|unread` |
| `POST /api/v1/notifications/read-batch` | Authenticated notification owner | T-147: transactionally and idempotently mark exactly 1–100 unique caller-owned notification IDs read |
| `POST /api/v1/notifications/:notificationId/read` | Notification owner | Legacy compatibility command to mark one notification read |
| `POST /api/v1/notifications/read-all` | Authenticated | Legacy compatibility command to mark the caller's current notifications read |

Listing notifications is read-only. `readStatus` defaults to compatibility
value `all`; normal UI requests `unread` or `read` explicitly.

T-147 accepts exactly:

```json
{
  "notificationIds": ["notification-id-1", "notification-id-2"]
}
```

The array contains 1–100 unique stable IDs. The repository validates ownership
of the complete set before updating any row; a missing or foreign ID rejects and
rolls back the whole batch. Success returns `NOTIFICATIONS_READ`,
`changedCount`, `readAtMs`, and the exact `notificationIds`. Exact replay is
idempotent and may return `changedCount: 0`. The frontend sends one batch only
after successfully rendering its captured unread page and keeps that rendered
batch visible for the mounted visit even if acknowledgement fails.

Creating a pending trade proposal writes the proposal, proposal history,
outbox evidence, and one `trade_proposal_received` in-app notification for
each active receiving-team manager other than the actor in the same database
transaction. A late notification failure rolls back the proposal rather than
leaving a pending trade without receiver notification.

Matchup and standings records remain outside League Activity.

---

## Operations, Backup, and Recovery

| Method and path | Authorization | Purpose |
|---|---|---|
| `GET /api/v1/health/live` | Public | Minimal process liveness |
| `GET /api/v1/health/ready` | Public | Minimal dependency readiness without private details |
| `GET /api/v1/operations/health` | Platform administrator | Detailed read-only operational state |
| `POST /api/v1/operations/staging-sportsdataio-import` | Platform administrator on the exact closed staging fixture identity only | Explicitly import and audit the approved last-season SportsDataIO catalog and statistics |
| `POST /api/v1/operations/staging-fixture-reset` | Platform administrator on the exact closed staging fixture identity only | Back up and deterministically reseed staging test-league data while preserving the imported provider catalog |
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

The operations-health projection includes sanitized SportsDataIO state:
provider name, enabled state, last-season-only scope, stale threshold, last
successful import summary, and stale status. It never returns an API key,
provider payload, database path, or backup path.

The SportsDataIO staging-import route is constructed only when all staging
fixture identity checks match, the provider is enabled, league writes are
`closed`, and scheduled jobs are disabled. It requires an authenticated
platform-administrator session, an allowed browser origin, compatible Fetch
Metadata, JSON, CSRF protection, and `Idempotency-Key`. Its exact body is:

```json
{
  "confirmation": "IMPORT SPORTSDATAIO STAGING DATA",
  "reason": "Import the approved last-season staging test data."
}
```

`reason` is trimmed, contains no control characters, and is 1-500 characters.
The operation revalidates environment, database, and administrator authority
before and after provider waits and before persistence; serializes concurrent
imports; requires at least 800 mapped catalog players and statistics rows;
retains the prior valid statistics refresh on failure; and records sanitized
success, replay, or failure evidence without returning provider payloads or the
API key. The route is absent after the same staging source is redeployed with
league writes `open`, and it is never constructed for production.

The staging-fixture reset route is composed only when all three identity checks
match: `APP_ENV=staging`, environment identity `test:release-qa`, and database
identity `m7-release-qa-fixture`. League writes must also be `closed`, scheduled
jobs must be disabled, and no matchup may be live or in a correction state. Its
exact JSON command contains the displayed confirmation phrase and a bounded
reason, and it requires CSRF plus `Idempotency-Key`. The command revalidates
database identity, creates and verifies a pre-reset backup, preserves
SportsDataIO catalog and import state, replaces only deterministic fixture
accounts and league-scoped test data, checks foreign keys and provider-row
counts, records operational audit evidence, and invalidates all sessions. The
capability is not constructed for production or any other database identity.

The exact closed staging fixture reset and provider catalog import are the only
named maintenance exclusions from the roster-writer coordinator registry. The
catalog import can change effective roster position, so both exclusions require
closed writes, disabled jobs, and no live or correction matchup. If any
precondition is false, the operation requires approved bulk post-commit
legality reconciliation before writes or jobs reopen.

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
  "reasonCode": "roster_changed",
  "occurredAt": 1784371200000,
  "related": {
    "fadId": null,
    "teamId": "opaque-uuid",
    "cardId": null,
    "allocationId": null,
    "auctionId": null,
    "recoveryId": null,
    "nominationQueueId": null,
    "scheduleRecoveryOperationId": null
  }
}
```

Events contain invalidation metadata, not complete private records.
`reasonCode` is a required stable code approved for the event family.
`resourceId` identifies the authoritative resource named by the event, and
`version` is that exact resource's authoritative current version in the
committed domain transaction. It is never the mutable outbox-row version, a
delivery-attempt counter, a related child-resource version, or a guessed
fallback. A writer that cannot prove the committed resource version fails
closed rather than publishing an invented value.

For a `free_agent_draft.changed` allocation event, `resourceId` is the FAD ID,
`version` is the committed `free_agent_drafts.version`, and
`related.allocationId` identifies the affected allocation. The allocation ID
or version never replaces the FAD resource/version pair in that envelope.

`related` is always present with exactly the eight nullable stable IDs shown
above. A writer populates every applicable ID and uses null for the rest;
non-FAD event families normally leave the FAD-specific IDs null. No event may
put a player, Candidate offer, help message, contract value, or active bid in
this metadata.

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
free_agent_draft.changed
candidate_card.changed
candidate_card_help.changed
fad_nomination_queue.changed
activity.created
notification.created
operations.changed
```

The successful Candidate Card opening transaction emits exactly these
post-commit realtime publications:

* one metadata-only `free_agent_draft.changed/cards_opened` invalidation to the
  league audience;
* one metadata-only `activity.created/cards_opened` invalidation to the league
  audience for the existing `free_agent_draft_started` activity;
* one metadata-only `candidate_card.changed/card_changed` invalidation per card
  to that card's team audience; and
* one metadata-only `notification.created/cards_opened` invalidation per
  `fad_cards_opened` notification to that notification's exact user audience.

`fad_cards_opened` remains the notification type only; it is never an outbox
event type. The league-scoped invalidations neither grant Candidate Card access
nor constitute a card notification. A non-manager sees only the ordinary
League Activity projection allowed by their membership. Every private card
read independently reauthorizes the current team/card scope.

The initial-Season-2 setup-exemption authorization transaction publishes
exactly:

* league-audience `league.changed/league_changed` for the committed league
  resource/version;
* league-audience `activity.created/setup_exemption_authorized` for the
  persisted `fad_setup_exemption_authorized` Activity resource at version `1`;
  and
* exact-current-commissioner user-audience
  `notification.created/setup_exemption_authorized` for the persisted
  notification resource at version `1`.

All eight `related` IDs are null. The notification's safe copy is exactly
`Initial Season 2 Free Agent Draft exemption authorized.` Its message data is
exactly `leagueId`, `seasonId`, `exemptionId`, and destination
`{kind: commissioner_fad, leagueId, seasonId}`. Its deduplication key is
`fad_setup_exemption_authorized:<leagueId>:<seasonId>:<exemptionId>:<userId>`.
The recipient is the active user of the same-league active commissioner
membership named by `leagues.commissioner_membership_id`, with current
`commissioner` permission category, an accepted join at or before the command,
and no ended timestamp. The authorizing platform administrator receives no
extra copy solely for acting. No private exemption reason enters Activity,
notification, or realtime metadata.

Before a queued nomination opens, `fad_nomination_queue.changed` with reason
`nomination_queued` or `nomination_opened` is limited to the nominating team
audience and any exact protected recovery-authority user audience. It carries
no player or contract value, and no corresponding league-room FAD or auction
publication occurs until the auction actually opens. Auction opening then uses
the normal authorized league-auction publication contract.

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
* compatibility-to-target frontend cutover;
* scheduled Entry Draft-start rollover success, blocker persistence, exact
  retry identity, and proof that draft selections and trading remain locked
  until the all-or-none transition commits;
* selection-versus-timeout-versus-on-clock-trade races with one winner, one
  fresh clock where applicable, and no partial loser effects;
* automatic FAD readiness with all-card-or-no-card opening, late-draft
  whole-Monday schedule recovery, and read-only readiness inspection;
* caller-transaction-only Entry Draft/no-draft readiness handoff, exact FAD job
  types, authoritative source validation, exact-trigger deduplication, caller
  rollback, simulated final-T-108 completion atomicity, no public completion
  route, immutable attempt snapshots, blocked rollback-then-record behavior,
  and the canonical inaugural reason;
* ordinary-inaugural T-036 and initial-Season-2 T-037 exact trigger ownership,
  reset-origin T-036 activation without a handoff, and T-095 same-occurrence
  corrective requeue with immutable source-result/generation evidence, no-op
  states, split-state rollback, two-league isolation, and write-free exact
  replay;
* T-127 nullable/empty/exact-seven projection states and independent no-write
  proofs for T-127 plus internal preflight, with no invented preview route;
* T-128 blocked-to-blocked one-version acceptance, same-job requeue, immutable
  response-data hash/replay with current request metadata, safe 404/409/412
  errors, and later worker blocked-to-running transition;
* T-129 exact viewer arrays, prepublication count nulling, capability rules,
  and separation of pre-open versus completion-overrun recovery evidence;
* schema-31 fresh/upgrade, same-league, immutability, replay, and trigger tests
  proving that the frozen migration-0030 bytes and every unrelated schema-30
  object remain unchanged;
* schema-32 fresh/upgrade proof pins migration `0032` at `27,882` bytes and
  SHA-256
  `ec6bf25a00c2a279d5380a11cb99a3f9b8bc22b06e95ff0f2ef58519e786c7f5`,
  proves that it creates no table or index, preserves migrations 0030/0031,
  adds only the job-side reclaim guard, and admits only the atomic
  expired-readiness-lease
  handoff with unchanged synchronized job/operation counts and start times, a
  fresh token, stale-token fencing, and injected rollback;
* schema-33 fresh/upgrade proof preserves migrations `0030` through `0032`,
  adds only immutable `free_agent_draft_readiness_corrective_requeues`
  evidence plus the exact T-095 job/readiness guards, and rejects invalid
  source, generation, version, attempt, blocker, scope, duplicate, mutation,
  replay, and injected-rollback cases;
* schema-34 fresh/upgrade proof pins migration `0034` at `1,158` bytes and
  SHA-256
  `9347331419ada113707a4e71ef87c578ddd3cd0bd4ddb9578164f08b3307bb36`,
  preserves the complete schema-33 inventory, and proves the three exact
  Candidate lookup indexes plus T-133 use of each measured plan;
* T-133 and authoritative Candidate save apply identical event-bound
  rights-release re-entry semantics, including a newer unapproved release
  after an earlier approved release, while the ordered release lookup creates
  no temporary sort B-tree;
* Candidate whole-card carried-roster/cap exclusion, candidate-only individual
  exclusion, and later legal revision;
* final-hour private nomination queueing, binding starter-bid activation, and
  queue privacy;
* restricted-auction strict-improvement eligibility, commissioner-removal
  recomputation, mandatory fallback, exact fallback floor, and FAD-only
  equal-chance draw evidence;
* atomic FAD completion plus Week 1 recovery and matchup/baseline job rejection
  against incomplete FAD state or a stale schedule version.

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
- [x] T-145 explicitly finalizes one provenance-complete immutable regular-
  season standings snapshot; reads, rebuilds, and rollovers never synthesize
  that evidence.
- [x] A post-finalization T-097 correction and its complete replacement final
  snapshot commit atomically or not at all.
- [x] Legacy or incomplete snapshot evidence never satisfies T-145 or season-
  rollover readiness.
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
- [x] Continuing-season contract rollover is scheduled at Entry Draft start;
  neither competition-season end nor a browser command advances contract years.
- [x] Candidate Cards open automatically and all-or-none after Entry Draft
  completion or the approved no-draft path; commissioner retry cannot choose
  opening or schedule parameters.
- [x] Valid final-hour FAD nominations queue privately for the next fair
  boundary instead of being rejected.
- [x] Restricted auctions require a current active improvement; an empty
  contender set creates the mandatory league-wide fallback without a draw.
- [x] Equal-chance terminal draws apply only to FAD auction contexts.
- [x] FAD wins are binding without cap or roster reservation and require no
  second confirmation at resolution.
- [x] FAD completion and any required whole-Monday Week 1 recovery commit
  atomically before matchup and baseline jobs may proceed. This prerequisite is
  necessary but not sufficient: the preseason FAD-only staging candidate keeps
  the shared automatic matchup-occurrence runner disabled.
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
docs/04-technical-specs/FREE_AGENT_DRAFT.md
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
