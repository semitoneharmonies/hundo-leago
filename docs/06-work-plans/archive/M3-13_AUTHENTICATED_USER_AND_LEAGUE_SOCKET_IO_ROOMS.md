# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-13
```

## Active Step

```text
Authenticated User and League Socket.IO Rooms
```

Grae authorized continuous technical and documentation work through
Milestone M3 unless an important application behavior decision is not settled
by the approved documents. M3-12 is complete. M3-13 was completed under
Security, Permissions, Leagues and Teams, API Contracts, Data Model, and this
plan.

---

# Part 1 - Intended Outcome

M3-13 established the backend-authoritative Socket.IO room boundary required
before private realtime invalidation can be enabled:

1. a Socket.IO handshake is accepted only from an exactly allowed Origin with
   a valid opaque session cookie for a current active user;
2. the backend derives the caller's stable user room and currently visible
   active-membership league rooms from SQLite;
3. no client-supplied user, league, role, membership, selected-league, or room
   claim grants access;
4. opening or reauthorizing a socket does not refresh session activity or
   extend session expiry;
5. session revocation, expiry, user inactivation, or loss of all authorized
   rooms is detected on reauthorization and disconnects the socket;
6. league membership changes are applied by an explicit reauthorization hook
   that leaves stale rooms and joins newly authorized rooms;
7. protected realtime events carry invalidation metadata only, and clients
   refetch authoritative HTTP data after connect or reconnect.

This step creates an isolated Socket.IO authorization and room-management
foundation. It does not mount Socket.IO in the compatibility runtime or add
team-room authority before manager assignments exist.

---

# Part 2 - Room Scope

The contained room names are:

```text
user:{userId}
league:{leagueId}
```

The user room is derived only from the resolved server-side session. League
rooms are derived only from current active memberships returned by the
league-access repository. Stable persisted identifiers are used verbatim only
after their server-side records and relationships have been validated.

`team:{teamId}` rooms are deliberately deferred. A team room cannot be
authorized until team records and current manager assignments exist, and
neither a league membership nor a frontend-selected team is a substitute for
that authority.

Room membership grants permission to receive safe invalidation metadata. It
does not grant HTTP authority, reveal complete records, or replace the normal
authorization check and refetch performed by each HTTP request.

---

# Part 3 - Handshake and Session Rules

The Socket.IO authorization service must:

* use the same opaque cookie name and persisted session model as protected
  HTTP requests;
* reject a missing or non-exact Origin before resolving private authority;
* extract the cookie server-side without accepting an authentication token in
  the query string, auth payload, room request, or event payload;
* resolve the session without updating `last_activity_at`, expiry, version, or
  any other persisted field;
* reload the current user and require `active` account status;
* derive the one user room and all active-membership league rooms in a stable
  order;
* retain no raw session token in socket data, logs, events, errors, or returned
  safe authority metadata;
* fail closed and disconnect after authentication or reauthorization failure.

Socket connection is not user activity for idle-session purposes. HTTP
activity governed by the approved session policy remains the only activity
refresh path in this step.

---

# Part 4 - Reauthorization and Event Boundary

The isolated transport adapter exposes explicit authentication and
reauthorization operations. Authentication joins only backend-derived managed
rooms. Reauthorization recomputes the complete managed-room set from current
SQLite state, leaves rooms no longer authorized, joins newly authorized
rooms, and disconnects if the session or active user is no longer valid.

Application services that later change membership or session state may call
this hook after their transaction commits. M3-13 proves the hook behavior but
does not add a new membership mutation, session mutation, process-wide socket
registry, or runtime event wiring.

Private Socket.IO events are invalidation signals only. They may contain an
event type, affected stable scope ID, and version or timestamp metadata needed
to decide what to refetch. They must not contain private league state, user
records, email, credentials, session data, action tokens, invitations,
Security Audit details, or raw database rows.

Clients must refetch through authorized HTTP reads after connecting or
reconnecting because missed socket events are not replayed as authoritative
state.

---

# Part 5 - Isolation and Safety

Tests use synthetic sessions, users, and at least two leagues. They prove that
room membership follows current backend authority and that one league never
authorizes another. They also compare complete table counts and semantic
hashes before and after handshakes and reauthorization so socket connection
cannot silently refresh a session or mutate league state.

The target middleware and room manager remain isolated from the compatibility
application. No migration, package, runtime composition, local staging,
Render staging, production data, frontend source, external provider,
deployment, commit, push, or merge is part of this step.

Tests use an isolated socket double around the middleware contract. Adding a
new client runtime dependency solely for tests is outside this step.

---

# Part 6 - Verification

Focused verification must prove:

1. missing, malformed, or disallowed Origin and missing or invalid session
   cookies fail before any protected room is joined;
2. authentication resolves the current session without refreshing its
   activity or expiry and reloads the current active user;
3. the authenticated user joins exactly `user:{userId}` plus current
   active-membership `league:{leagueId}` rooms in deterministic order;
4. client-supplied user, league, membership, permission, selected-league, and
   room claims cannot add or retain authority;
5. invited, suspended, ended, other-user, other-league, and deleted-league
   records do not create rooms;
6. a platform administrator without an active league membership receives no
   private league room;
7. reauthorization leaves a removed league room and joins a newly authorized
   league room using current SQLite state;
8. revoked or expired sessions and inactive users disconnect on
   reauthorization without leaking private data;
9. the socket data and all returned errors and authority metadata omit the raw
   cookie, raw session token, credentials, email, and private database rows;
10. complete table counts and semantic hashes remain unchanged through every
    handshake and reauthorization read;
11. safe invalidation envelopes contain metadata only and make HTTP refetch,
    including reconnect refetch, the authoritative recovery path;
12. no team room, runtime mount, migration change, package change, external
    call, repository artifact, protected-hash change, or compatibility-route
    inventory change occurs.

Run the focused M3-13 suite, combined M3 account/security/authorization suites,
cumulative foundation suite, complete backend suite, all-source syntax and
whitespace checks, runtime-isolation and artifact scans, and protected-hash
checks under Node `24.14.1`.

---

# Part 7 - Completion Boundary

M3-13 is complete. Its read-only session resolution, exact Origin and cookie
authentication, backend-derived user and league rooms, explicit
reauthorization, safe disconnection, and metadata-only invalidation boundary
passed `15/15` focused, `190/190` combined M3, `279/279` cumulative
foundation, and `452/452` complete backend tests under Node `24.14.1`.

All `202` project JavaScript files passed syntax checks. The compatibility
inventory remained `34` routes. Static scans found zero runtime mounts, team
rooms, secret-literal patterns, temporary/database artifacts, package or
migration changes, and whitespace errors. Both migrations remained the only
migrations. Protected package, migration, backend data, and frontend component
hashes remained unchanged. Nothing was deployed, mounted, committed, pushed,
merged, or changed in production.

Completion does not authorize team rooms, private state in socket
events, general invitations, team creation or editing, manager assignment,
commissioner replacement or automatic reassignment, league activation,
runtime mounting, frontend work, provider-backed email, deployment, or the
next M3 step.

Detailed M3-12 evidence is archived at:

`docs/06-work-plans/archive/M3-12_LEAGUE_SCOPED_AUTHORIZATION_AND_AUTHENTICATED_READ_ONLY_LEAGUE_VISIBILITY.md`
