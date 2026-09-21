# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-14
```

## Active Step

```text
Team-Scoped Manager Authorization and Authenticated Team Socket.IO Rooms
```

Grae authorized continuous technical and documentation work through
Milestone M3 unless an important application behavior decision is not settled
by the approved documents. M3-13 is complete. M3-14 was completed under
Security, Permissions, Leagues and Teams, API Contracts, Data Model, and this
plan.

---

# Part 1 - Intended Outcome

M3-14 established the backend-derived current-manager boundary required
before manager writes or team-scoped realtime invalidation can be enabled:

1. current team-manager authority is proved from the authenticated active
   user, active league membership, target team, and one accepted unended
   manager assignment in SQLite;
2. team, membership, assignment, user, and league IDs must all belong to the
   same league-scoped relationship;
3. one user may receive authority for multiple teams without an ambiguous
   `my team` assumption;
4. a commissioner does not silently receive manager authority and a platform
   administrator does not receive team authority from the platform role;
5. authenticated sockets join `team:{teamId}` only for current accepted
   assignments derived by the backend;
6. reauthorization leaves team rooms after assignment end, membership loss,
   team erasure, user inactivation, session revocation, or session expiry;
7. pending, declined, ended, cross-league, other-user, and client-claimed
   assignments never create manager authority or team rooms.

This step creates reusable SELECT-only team-authority and room foundations. It
does not create, edit, invite, assign, transfer, remove, deactivate, erase, or
activate any league, membership, team, or manager assignment.

---

# Part 2 - Current Manager Authority

The specialized team-authority repository owns explicit reads for:

* one team by exact league and team ID;
* one current accepted assignment by exact league, team, user, and active
  membership IDs;
* all current accepted team assignments for one user, joined through that
  user's current active membership and non-erased teams in non-deleted
  leagues.

The authorization service first uses the approved league authorization
boundary to reload the current active user and membership. It then reloads the
target team and assignment. Manager authority exists only when:

* the target team belongs to the requested league and is not erased;
* the assignment belongs to that exact league and team;
* assignment user and membership IDs match the current authenticated user and
  active membership;
* assignment status is `accepted`, `accepted_at_ms` is present, and
  `ended_at_ms` is absent.

No display name, normalized name, commissioner category, platform role,
browser-selected team, cached assignment, or client-supplied role value may
substitute for those relationships.

---

# Part 3 - Team Room Scope

M3-14 extends the isolated socket authority result with:

```text
team:{teamId}
```

Team rooms are derived only from the specialized current-assignment query for
the authenticated user. The user and league rooms established by M3-13 remain
unchanged. Room ordering is deterministic: user room, sorted league rooms,
then sorted team rooms.

Every team room must correspond to a non-erased team and an accepted unended
assignment linked to the user's active membership in that same league. A
socket cannot request, retain, or switch a team room through its handshake,
query, auth payload, local storage, selected-team state, or an event.

Reauthorization recomputes the full set from current SQLite state. It removes
stale team rooms without ending the valid session and joins newly authorized
team rooms only after their assignment is accepted.

---

# Part 4 - Isolation and Failure Behavior

Cross-league and hidden-team failures use one safe not-found response at the
authorization-service boundary. A visible team without a current assignment
uses a safe manager-authority-required response. Internal relationship or
schema inconsistencies fail closed and return no private record.

Socket middleware continues to return safe connection errors and disconnect
after failed reauthorization. It stores no raw session token, cookie,
credential, email, private assignment row, or complete team record in socket
data or errors.

All new repository operations are plain `SELECT` queries. They do not refresh
session activity, expire a persisted session, normalize stored rows, write an
audit or activity record, emit an event, or repair inconsistent state.

---

# Part 5 - Verification

Focused verification must prove:

1. exact current active user and league membership are reloaded before team
   manager authority is considered;
2. exact stable league, team, user, membership, and assignment relationships
   are required;
3. accepted unended assignments grant authority while pending, declined,
   ended, other-user, inactive-membership, erased-team, deleted-league, and
   cross-league records fail closed;
4. commissioner and platform-administrator authority alone grant no manager
   authority or team room;
5. one current manager may receive multiple distinct team rooms in one or
   multiple visible leagues without state leakage;
6. socket room ordering remains deterministic and ignores every client team,
   manager, membership, and role claim;
7. reauthorization leaves ended or erased team rooms and joins a team room
   only after the current accepted assignment exists;
8. session revocation or expiry and user or membership inactivation continue
   to disconnect without a hidden write;
9. same-named teams in two leagues remain isolated by stable league and team
   IDs;
10. complete table counts and semantic hashes remain unchanged through every
    authorization, handshake, and reauthorization read;
11. no private team or assignment row appears in authority metadata, socket
    data, errors, logs, or invalidation events;
12. no runtime mount, HTTP route, migration change, package change, external
    call, repository artifact, protected-hash change, or compatibility-route
    inventory change occurs.

Run the focused M3-14 suite, combined M3 account/security/authorization suites,
cumulative foundation suite, complete backend suite, all-source syntax and
whitespace checks, runtime-isolation and artifact scans, and protected-hash
checks under Node `24.14.1`.

---

# Part 6 - Completion Boundary

M3-14 is complete. Its SELECT-only team-authority repository, exact current
manager authorization, same-named cross-league isolation, multi-team support,
backend-derived team rooms, current-state reauthorization, and full-database
immutability checks passed `7/7` focused, `197/197` combined M3, `286/286`
cumulative foundation, and `459/459` complete backend tests under Node
`24.14.1`.

All `205` project JavaScript files passed syntax checks. The compatibility
inventory remained `34` routes. Static scans found zero runtime mounts,
secret-literal patterns, temporary/database artifacts, package or migration
changes, and whitespace errors. Both migrations remained the only migrations.
Protected package, migration, backend data, and frontend component hashes
remained unchanged. Nothing was deployed, mounted, committed, pushed, merged,
or changed in production.

Completion does not authorize team or membership HTTP mutations,
invitations, team creation or profile response contracts, colour or logo
representation, manager proposal/acceptance/transfer/removal endpoints,
commissioner replacement or automatic reassignment, league activation,
runtime mounting, frontend work, provider-backed email, deployment, or the
next M3 step.

Detailed M3-13 evidence is archived at:

`docs/06-work-plans/archive/M3-13_AUTHENTICATED_USER_AND_LEAGUE_SOCKET_IO_ROOMS.md`
