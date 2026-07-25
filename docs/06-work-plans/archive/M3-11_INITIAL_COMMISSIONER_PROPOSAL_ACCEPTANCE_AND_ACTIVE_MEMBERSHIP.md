# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-11
```

## Active Step

```text
Initial Commissioner Proposal, Acceptance, and Active Membership
```

Grae authorized continuous technical and documentation work through
Milestone M3 unless an important application behavior decision is not
settled by the approved documents. M3-10 is complete. M3-11 proceeded under
Permissions, Leagues and Teams, Data Model, API Contracts, Security, and
this plan.

---

# Part 1 - Intended Outcome

M3-11 implements the approved initial-commissioner workflow for a newly
created setup league:

1. an authenticated platform administrator proposes one existing active user
   as commissioner;
2. the backend creates a pending commissioner assignment, invited membership,
   basic notification, audit evidence, and idempotency result atomically;
3. only the proposed user may read, accept, or decline the safe assignment;
4. acceptance atomically activates the commissioner membership, links it as
   the league commissioner, closes the proposal, and records both audit
   surfaces;
5. decline closes the proposal without granting membership or commissioner
   authority;
6. current user, platform role, assignment ownership, league, and membership
   state are reloaded for every protected action.

This step covers only a league with no existing commissioner. Commissioner
replacement, automatic reassignment, general invitations, teams, manager
assignments, and broader league authorization remain later contained work.

---

# Part 2 - Exact API Scope

The contained target contracts are:

```text
POST /api/v1/admin/leagues/:leagueId/commissioner-assignments
Authorization: active platform administrator
Required header: Idempotency-Key
Exact JSON body: { "userId": "stable-user-id" }

GET /api/v1/commissioner-assignments/:assignmentId
Authorization: authenticated proposed user

POST /api/v1/commissioner-assignments/:assignmentId/accept
Authorization: authenticated proposed user with CSRF
Exact JSON body: {}

POST /api/v1/commissioner-assignments/:assignmentId/decline
Authorization: authenticated proposed user with CSRF
Exact JSON body: {}
```

The assignment ID is the stable invitation record ID at this contained schema
boundary. The linked invited membership's `permission_category` is
`commissioner`, which distinguishes this workflow from later ordinary league
invitations without adding an ambiguous parallel record.

Cross-user or unknown assignment reads and writes return `404`. Signed-out
requests return `401`; an authenticated non-administrator proposal returns
`403`; malformed input returns `400`; state and idempotency conflicts return
`409`.

---

# Part 3 - Persistence Model

The approved existing schema is sufficient:

* `league_invitations` stores the stable proposal, target user and email,
  proposing administrator, linked invited membership, and pending/accepted/
  cancelled lifecycle;
* `league_memberships` stores the proposed commissioner's invited then active
  commissioner membership;
* `leagues.commissioner_membership_id` remains null until acceptance;
* `notifications` stores the basic in-app proposal notification;
* `idempotency_requests` prevents duplicate proposal effects;
* `league_activity` and `security_audit_events` retain separate product and
  security evidence.

No migration or package change is planned. A pending proposal creates an
`invited` membership with no joined timestamp. Acceptance changes it to
`active` and sets `joined_at_ms`. Decline changes it to `ended` without a
joined or ended timestamp, preserving that it never became an active member,
while the invitation becomes `cancelled`.

At most one pending commissioner-category proposal may exist for one league.
At most one active commissioner membership may be linked by a league.

---

# Part 4 - Proposal Rules

* The target league must exist, remain `setup`, and have no commissioner.
* The proposed user is selected by stable user ID and must currently be
  `active`.
* The administrator may propose themself; platform authority and league
  membership remain separate.
* The request accepts no email, display name, role, membership, status, or
  actor claim from the client.
* A different pending commissioner proposal for the same league is a conflict.
* An exact actor-scoped idempotent replay returns the persisted original
  proposal and creates no second membership, invitation, notification, or
  audit event.
* Reusing the key for another league or user is a mismatched replay conflict.
* The basic notification contains only safe assignment and league identity;
  it contains no credential, session, CSRF, email-delivery secret, or private
  league state.

---

# Part 5 - Acceptance and Decline Rules

Acceptance revalidates inside one immediate transaction:

* the authenticated user is still active and is the proposed user;
* the invitation remains pending and references the commissioner-category
  invited membership;
* the membership belongs to the same user and league and remains invited;
* the league remains `setup` and still has no commissioner;
* no other active commissioner membership is linked.

Acceptance then activates the membership, sets the league commissioner
pointer, accepts the invitation, records League Activity and Security Audit,
and returns the authoritative safe assignment, membership, and league IDs.
No new session or platform role is created.

Decline performs the same ownership and state checks, cancels the invitation,
ends the never-active invited membership, records safe audit evidence, and
creates no league membership authority. A simultaneous accept/decline race has
one terminal winner.

Exact acceptance replay by the same user returns the accepted safe result
without another write. Decline replay returns the terminal declined result.
The opposite terminal action returns a safe conflict.

---

# Part 6 - Safety Boundary

Development and tests use only fresh temporary SQLite databases and synthetic
users, sessions, leagues, proposals, idempotency keys, and notifications.

The target routers remain isolated from the current compatibility runtime.
No local staging, Render staging, production data, external email, provider,
frontend source, deployment, commit, push, merge, commissioner replacement,
automatic reassignment, team, manager assignment, or league activation is
part of this step.

Migrations, package metadata, protected JSON, and the 34-route compatibility
inventory must remain unchanged.

---

# Part 7 - Verification

Focused verification must prove:

1. platform administrator, target active user, stable league, and setup-state
   checks occur inside the proposal transaction;
2. proposal creates exactly one invited commissioner membership, pending
   invitation, safe notification, League Activity, Security Audit, and
   completed idempotency row;
3. exact replay and simultaneous proposal requests create no duplicate effect;
4. mismatched replay, another pending proposal, inactive target user, active
   commissioner pointer, and non-setup league write nothing;
5. only the proposed active user may read, accept, or decline; other users and
   unknown IDs receive the same `404` behavior;
6. acceptance activates one membership and sets one commissioner pointer in
   the same transaction;
7. decline grants no authority and preserves attributable proposal history;
8. simultaneous accept/decline has one terminal winner and no partial state;
9. every injected write failure rolls the complete relevant transaction back;
10. client-supplied roles, users outside the assignment, cross-league IDs,
    credentials, secrets, and raw session or CSRF values cannot affect or
    appear in stored/returned state;
11. isolated HTTP status, envelope, CORS, no-store, no-cookie, session, CSRF,
    Origin, JSON, and Fetch Metadata behavior matches API Contracts;
12. no runtime mount, migration change, external call, repository artifact,
    protected-hash change, or compatibility-route inventory change occurs.

Run the focused M3-11 suite, combined M3 account/security/administration
suites, cumulative foundation suite, complete backend suite, syntax and
whitespace checks, runtime-isolation and artifact scans, and protected-hash
checks under Node `24.14.1`.

---

# Part 8 - Completion Boundary

M3-11 completed locally on 2026-07-20 after every verification above passed.
Completion does not authorize runtime mounting, commissioner
replacement, automatic commissioner reassignment, general invitations, teams,
manager assignments, league activation, frontend work, provider-backed email,
deployment, or the next M3 step.

The implementation added an exact commissioner-assignment policy, a specialized
SQLite repository, an atomic proposal/read/accept/decline service, and an
isolated target router. It reused the approved invitation, membership,
notification, activity, Security Audit, and idempotency tables without a new
migration. Proposal and acceptance revalidate current platform, user, league,
membership, and commissioner state inside immediate transactions. Cross-user
and unknown assignment access share the same safe not-found behavior.

Completion evidence under Node `24.14.1`:

* focused M3-11 tests: `16/16` passing;
* combined M3 account/security/administration tests: `164/164` passing;
* cumulative foundation tests: `253/253` passing;
* complete backend tests: `426/426` passing;
* repository JavaScript syntax: `193/193` parsing after the temporary verifier
  was removed;
* compatibility endpoint inventory: exactly `34` unchanged routes;
* runtime mount matches: `0`;
* repository artifacts and secret-pattern matches: `0`;
* migrations: exactly `2`, both protected hashes unchanged;
* package lock, protected JSON, staging migration evidence, and selected
  frontend protected hashes: unchanged;
* backend and canonical-document whitespace checks: passing.

All tests used fresh temporary SQLite databases and synthetic identities. No
local staging, Render staging, production data, external provider, frontend
source, deployment, commit, push, or merge occurred.

Detailed M3-10 evidence is archived at:

`docs/06-work-plans/archive/M3-10_PLATFORM_ADMINISTRATOR_AUTHORIZATION_AND_ADMINISTRATIVE_LEAGUE_CREATION.md`
