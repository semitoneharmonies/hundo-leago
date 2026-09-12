# Hundo Leago - Active Work Plan

## Document Status

`COMPLETE`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M3-10
```

## Active Step

```text
Platform-Administrator Authorization and Administrative League Creation
```

Grae authorized continuous technical and documentation work through
Milestone M3 unless an important application behavior decision is not
settled by the approved documents. M3-10 was completed under Permissions,
Leagues and Teams, Data Model, API Contracts, Security, SQLite Migration,
and this plan.

---

# Part 1 - Intended Outcome

M3-10 adds the first authenticated platform-administration command:

1. derive platform-administrator authority from the current authenticated
   user and active SQLite platform-role record for every request;
2. expose isolated `POST /api/v1/admin/leagues` with the approved session,
   CSRF, exact Origin, JSON, Fetch Metadata, and no-store boundaries;
3. accept only a league name plus the required `Idempotency-Key` header;
4. atomically create a stable league in `setup`, its planned current season,
   current fixed league settings, idempotency result, League Activity, and
   Security Audit evidence;
5. return the same authoritative created representation for an exact
   idempotent replay and reject a mismatched replay;
6. deny signed-out, inactive-user, absent-role, ended-role, malformed, and
   duplicate-name requests without partial league state.

League creation creates no membership, commissioner assignment, team,
manager assignment, invitation, or active league. Those remain in the next
feature-order item.

---

# Part 2 - Exact Product and API Scope

The contained target contract is:

```text
POST /api/v1/admin/leagues
Authorization: authenticated active platform administrator
Required header: Idempotency-Key
Exact JSON body: { "name": "Unique league name" }
Success: 201 for creation, 200 for exact replay
```

The name is trimmed for display and normalized for platform-wide uniqueness.
The request accepts no client-supplied actor, role, user, league ID, status,
timezone, season, settings, commissioner, membership, or team authority.

The backend supplies:

* a cryptographically random stable league ID and season ID;
* lifecycle state `setup`;
* timezone `America/Vancouver`;
* the server-configured current season year and NHL season key;
* salary cap `10000` cents;
* maximum teams `20`;
* 12 active forward, 6 active defence, 4 bench, and 4 injured-reserve slots;
* maximum bench AAV `400` cents and unlimited eligible prospect slots;
* current scoring-rule and standings-rule versions;
* no commissioner membership and no trade deadline.

The existing schema's 120-character storage bound is enforced as a technical
representability limit, not a product moderation rule. Empty, control-
character, non-string, over-storage-limit, or extra-field input is rejected
before any write.

---

# Part 3 - Implementation Scope

Expected contained backend work includes:

* a platform-authorization service or policy that reloads current user and
  platform-role authority rather than trusting session or request claims;
* specialized SQLite league, league-settings, season, idempotency, League
  Activity, and existing Security Audit repository operations needed by this
  command;
* an atomic administrative league-creation service;
* canonical request hashing that includes the normalized semantic request but
  no secret or session material;
* an isolated target administration router composed with the existing target
  request-security and session lifecycle boundaries;
* focused temporary-SQLite, service, concurrency, idempotency, authorization,
  and loopback-HTTP tests.

No migration or package change is planned. Migration `0002` already exposes
the approved schema required by this step.

---

# Part 4 - Authorization, Atomicity, and Audit Rules

* Authentication alone is insufficient; the user must be active and have a
  current active `platform_administrator` role.
* The role is loaded for every protected action. An ended role loses
  permission immediately without requiring session revocation.
* Body, query, and header role claims are ignored or rejected and never grant
  authority.
* League creation itself is platform-level and does not require league
  membership because the target league does not yet exist.
* Creation and idempotency completion occur in one immediate transaction.
* A failed settings, season, pointer, activity, audit, or idempotency write
  rolls back every row from the request.
* The initial season is `planned`; the league remains `setup` and is not
  publicly discoverable.
* League Activity identifies the administrator, authority used, league,
  season, and creation result with a safe display summary.
* Security Audit separately records the protected platform action and outcome.
* No password, credential hash, raw session, CSRF value, privacy key, or
  request body is stored in either audit surface.

---

# Part 5 - Idempotency and Failure Behavior

* The opaque idempotency key is required, trimmed only for validation, bounded,
  and scoped by actor plus operation before the league ID exists.
* The canonical request hash is SHA-256 over the operation version and
  normalized league name.
* Exact replay returns the originally created safe league representation and
  creates no second row or audit event.
* Reusing the same actor-scoped key for a different semantic request returns
  `409 IDEMPOTENCY_KEY_REUSED`.
* A different administrator may use the same client key without collision.
* Concurrent exact requests have one creator and one replay result.
* Duplicate normalized league names return a safe `409` conflict and never
  disclose private league data.
* Missing session returns `401`; authenticated non-administrator returns
  `403`; malformed input returns `400`; valid but conflicting state returns
  `409`; unexpected failures use the approved safe target error envelope.

---

# Part 6 - Safety Boundary

Development and tests use only fresh temporary SQLite databases and synthetic
identities, league names, idempotency keys, and sessions.

The target administration router remains isolated from the current
compatibility runtime. No local staging, Render staging, production data,
external provider, frontend source, deployment, commit, push, merge,
membership, commissioner assignment, team creation, or later authorization
conversion is part of this step.

Migration `0001`, migration `0002`, package metadata, protected JSON, and the
34-route compatibility inventory must remain unchanged.

---

# Part 7 - Verification

Focused verification must prove:

1. current active user and role authority is reloaded for every request;
2. signed-out, inactive, non-administrator, and ended-role requests write
   nothing;
3. exact request and idempotency-header validation rejects unknown fields and
   client authority claims before mutation;
4. one atomic league, planned season, fixed settings row, current-season
   pointer, League Activity row, Security Audit row, and completed idempotency
   row are created;
5. no membership, commissioner, team, manager, invitation, notification, or
   public-active state is created;
6. exact replay returns the original representation with no extra write;
7. mismatched replay and duplicate names return safe conflicts;
8. concurrent requests produce one league and deterministic replay behavior;
9. every injected write failure rolls the complete transaction back;
10. response and audit serialization expose no session, CSRF, secret,
    credential, raw idempotency hash input, or private database state;
11. isolated HTTP security, status, envelope, no-store, and no-cookie behavior
    match API Contracts;
12. no runtime mount, migration change, external call, repository artifact,
    protected-hash change, or compatibility-route inventory change occurs.

Run the focused M3-10 suite, combined M3 account/security/administration
suites, cumulative foundation suite, complete backend suite, syntax and
whitespace checks, runtime-isolation and artifact scans, and protected-hash
checks under Node `24.14.1`.

---

# Part 8 - Completion Boundary

M3-10 is complete only when every verification above passes and evidence is
archived. Completion does not authorize runtime mounting, administrator user
management, commissioner assignment, memberships, teams, manager assignments,
league activation, frontend work, provider-backed email, deployment, or the
next M3 step.

---

# Part 9 - Completion Evidence

M3-10 completed locally on 2026-07-20.

Implemented behavior includes:

* backend-derived platform-administrator authorization that reloads the
  current user and active role for every protected command;
* an isolated `POST /api/v1/admin/leagues` target contract protected by the
  existing session, CSRF, exact Origin, JSON, Fetch Metadata, CORS, security
  header, and no-store boundaries;
* exact league-name and opaque idempotency-key validation with no accepted
  client authority claims;
* atomic creation of one `setup` league, one planned current season, the
  approved fixed settings, League Activity, Security Audit, and completed
  idempotency evidence;
* exact replay returning the persisted original aggregate with no additional
  write, mismatched replay conflict, normalized-name conflict, and one-winner
  simultaneous submissions;
* rollback at every individual repository write seam and at Security Audit;
* no membership, commissioner assignment, invitation, team, manager
  assignment, notification, active league, or public discovery state.

Verification completed under Node `24.14.1`:

* `18/18` focused M3-10 tests passed;
* `148/148` combined M3 account, security, bootstrap, and administration
  tests passed;
* `237/237` cumulative foundation tests passed;
* `410/410` complete backend tests passed;
* all `184` JavaScript source, script, and test files passed syntax checks;
* the exact compatibility route inventory remained `34` total routes;
* whitespace, secret-field, runtime-isolation, and artifact checks passed;
* no database, WAL, SQLite, temporary, or backup artifact remained;
* package-lock, migrations `0001` and `0002`, protected JSON, and protected
  sibling frontend hashes remained unchanged.

The target router and SQLite league authority remain isolated from the
compatibility runtime. No local staging, Render staging, production data,
external provider, frontend source, deployment, commit, push, or merge
occurred.

Detailed M3-09 evidence is archived at:

`docs/06-work-plans/archive/M3-09_ONE_TIME_FIRST_PLATFORM_ADMINISTRATOR_BOOTSTRAP_AND_CREDENTIAL_SETUP.md`
