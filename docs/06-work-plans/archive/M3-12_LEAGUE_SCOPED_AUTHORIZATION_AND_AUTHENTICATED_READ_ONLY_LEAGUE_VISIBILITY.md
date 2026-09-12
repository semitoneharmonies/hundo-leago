# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-12
```

## Active Step

```text
League-Scoped Authorization and Authenticated Read-Only League Visibility
```

Grae authorized continuous technical and documentation work through
Milestone M3 unless an important application behavior decision is not
settled by the approved documents. M3-11 is complete. M3-12 proceeded under
Permissions, Leagues and Teams, Data Model, API Contracts, Security, and
this plan.

---

# Part 1 - Intended Outcome

M3-12 establishes the backend-derived league boundary required before broader
membership, team, manager, and feature work:

1. every protected league read reloads the authenticated active user, target
   league, and current active membership from SQLite;
2. commissioner reads additionally prove that the current membership is the
   league's referenced active commissioner membership;
3. platform-administrator authority alone grants no private league access;
4. an authenticated user sees only leagues where that user has an active
   membership;
5. league summary, current season, fixed settings, and commissioner membership
   reads are safe and read-only;
6. cross-league, inactive-membership, deleted-league, unknown-league, and stale
   client authority all fail without revealing private league existence;
7. same or similar display data never substitutes for stable user, membership,
   league, or season IDs.

This step creates reusable authorization and repository foundations. It does
not add a new mutation, invitation, team, manager assignment, automatic
commissioner reassignment, or runtime mount.

---

# Part 2 - Exact API Scope

The contained target contracts are:

```text
GET /api/v1/leagues
Authorization: authenticated active user
Returns: only leagues with the caller's active membership

GET /api/v1/leagues/:leagueId
Authorization: active membership in the requested league
Returns: safe league identity, lifecycle, current season, and caller membership

GET /api/v1/leagues/:leagueId/settings
Authorization: active membership in the requested league
Returns: safe effective fixed settings

GET /api/v1/leagues/:leagueId/memberships
Authorization: referenced active commissioner membership in the requested league
Returns: safe current and historical membership records with user display identity
```

All IDs come from persisted stable identifiers. No endpoint accepts a role,
membership, commissioner, platform-administrator, selected-league, or user
claim from the client.

Signed-out requests return `401`. An authenticated caller without visibility
receives the same `404` as an unknown or deleted league. A visible member who
is not the current commissioner receives `403` for the membership list.
Malformed stable IDs return `400` before repository access.

---

# Part 3 - Authorization Model

The league authorization service must:

* accept only the internal authenticated session resolution;
* prove the internal user and session user IDs match;
* reload the user and require current `active` status;
* reload the target league by stable ID and reject `deleted` leagues;
* load the caller's single active membership by stable user and league IDs;
* require matching league and user IDs and current `active` membership status;
* return only safe immutable authority metadata;
* for commissioner actions, require permission category `commissioner` and
  exact equality with `leagues.commissioner_membership_id`;
* never infer authority from display names, frontend state, a platform role,
  an invitation, an ended or suspended membership, or another league.

Platform administrators use the same membership rule for private league data.
Platform authority remains separate and is neither loaded nor accepted by the
league read boundary.

---

# Part 4 - Read Model

The specialized SQLite read repository owns explicit, league-scoped queries:

* list visible leagues for one active user through active memberships;
* find one active membership for one user and league;
* read one league with its current season;
* read one league's fixed settings;
* list membership history for one league joined to safe user display identity.

Visible league lists are stable-ID ordered and include safe league identity,
status, timezone, current season identity, and caller membership identity,
permission category, and version. They do not include other users, email,
credentials, sessions, invitations, Security Audit, private activity, or
complete persisted rows.

Membership lists include stable membership and user IDs, display name,
permission category, membership status, lifecycle timestamps, and version.
They exclude email, account status, credentials, sessions, platform roles,
invitations, and unrelated leagues.

All queries are plain `SELECT` operations. The read service may not call an
immediate write transaction, update session activity, normalize stored data,
create a default selection, write an audit record, or emit a notification.

---

# Part 5 - Isolation and Safety

Tests use at least two synthetic leagues and multiple synthetic users. They
must prove that one league's membership cannot authorize another league and
that overlapping season labels or other display data do not cross scopes.

Before and after every GET, complete table counts and semantic hashes for the
temporary database remain identical. Cross-user and cross-league reads return
no private data. The commissioner list cannot be obtained through a
client-supplied category or platform role.

The target router remains isolated from the compatibility application. No
migration, package, runtime composition, local staging, Render staging,
production data, frontend source, external provider, deployment, commit, push,
or merge is part of this step.

---

# Part 6 - Verification

Focused verification must prove:

1. league authorization reloads current user, league, and active membership
   for every protected operation;
2. commissioner authorization also reloads and matches the league's exact
   referenced commissioner membership;
3. platform authority without an active league membership grants no private
   access;
4. visible-league listing returns only the caller's active memberships in a
   deterministic order;
5. one league, current season, settings, and membership list response exposes
   only approved safe fields;
6. inactive users, invited/ended/suspended memberships, deleted leagues,
   cross-league IDs, cross-user IDs, unknown IDs, and stale commissioner state
   fail closed;
7. another active member receives `403` only after league visibility is
   established, while nonmembers and unknown leagues share `404`;
8. malformed IDs and internal authentication mismatch are rejected without a
   database write or private response;
9. every GET leaves every application table byte-semantically unchanged;
10. isolated HTTP status, envelope, CORS, no-store, no-cookie, session, Origin,
    and safe Fetch Metadata behavior matches API Contracts;
11. at least two isolated leagues with overlapping display context do not leak
    membership, settings, season, or commissioner data;
12. no runtime mount, migration change, package change, external call,
    repository artifact, protected-hash change, or compatibility-route
    inventory change occurs.

Run the focused M3-12 suite, combined M3 account/security/administration
suites, cumulative foundation suite, complete backend suite, all-source syntax
and whitespace checks, runtime-isolation and artifact scans, and protected-hash
checks under Node `24.14.1`.

---

# Part 7 - Completion Boundary

M3-12 completed locally on 2026-07-21 after every verification above passed.
Completion does not authorize mutations, invitations, team creation
or editing, manager assignment, commissioner replacement or automatic
reassignment, league activation, Socket.IO rooms, frontend work,
provider-backed email, deployment, or the next M3 step.

The implementation added a SELECT-only SQLite league-access repository,
backend-derived active-member and current-commissioner authorization, safe
league read projections, and an isolated GET-only router. It covers visible
leagues, one league/current season, fixed settings, and commissioner-only safe
membership history. Platform authority without active league membership grants
no private access. Two-league tests prove stable-ID isolation and complete
application-table semantic immutability across every GET.

Completion evidence under Node `24.14.1`:

* focused M3-12 tests: `10/10` passing;
* combined M3 account/security/administration tests: `174/174` passing;
* cumulative foundation tests: `263/263` passing;
* complete backend tests: `436/436` passing;
* repository JavaScript syntax: `198/198` parsing after the temporary verifier
  was removed;
* compatibility endpoint inventory: exactly `34` unchanged routes;
* runtime mount matches: `0`;
* repository artifacts and secret-pattern matches: `0`;
* migrations: exactly `2`, both protected hashes unchanged;
* package lock, protected JSON, staging migration evidence, and selected
  frontend protected hashes: unchanged;
* backend and canonical-document whitespace checks: passing.

All tests used fresh temporary SQLite databases and synthetic identities. No
local staging, Render staging, production data, frontend source, external
provider, deployment, commit, push, or merge occurred.

Detailed M3-11 evidence is archived at:

`docs/06-work-plans/archive/M3-11_INITIAL_COMMISSIONER_PROPOSAL_ACCEPTANCE_AND_ACTIVE_MEMBERSHIP.md`
