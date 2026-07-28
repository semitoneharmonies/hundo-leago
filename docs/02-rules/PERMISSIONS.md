# Hundo Leago — Permissions

## Document Status

`APPROVED`

This document consolidates:

* approved Season 2 account and permission boundaries;
* permission rules shared by multiple features;
* current implementation gaps that must not be mistaken for approved security;
* approved boundaries for implementation details that belong in more specific product and technical specifications.

Grae approved the Season 2 permission baseline recorded in this document on 2026-07-18.

---

## Document Purpose

This document defines who may view or change Hundo Leago information and how every protected action must be authorized.

It is intended to prevent accounts, leagues, teams, rosters, auctions, trades, contracts, matchups, standings, drafts, history, and commissioner tools from implementing different permission models.

This document defines:

* platform-level and league-level authority;
* the relationship between users, memberships, roles, and team assignments;
* minimum backend authorization requirements;
* approved role boundaries;
* shared read and write rules;
* commissioner-correction safeguards;
* activity and security-audit requirements;
* decisions that must be resolved before feature implementation.

This document does not define:

* password-hashing libraries;
* session-cookie implementation;
* database table names;
* exact API request and response shapes;
* page layouts;
* every feature workflow;
* production secret values;
* deployment steps.

Those subjects belong in the User Accounts, Commissioner Tools, feature product specifications, Data Model, API Contracts, Deployment, testing, and operations documents.

---

# Part 1 — Permission Authority

## Backend Authority

The backend is authoritative for authentication and authorization.

The frontend may:

* hide controls that the current user cannot use;
* explain why an action is unavailable;
* provide early validation for usability;
* submit authenticated requests.

The frontend must not:

* grant authority by displaying a button;
* trust a role selected in the browser;
* trust a team name supplied by the browser as proof of team control;
* treat locally stored user data as an authenticated session;
* perform a protected write merely because the interface allowed it.

Every protected backend action must independently identify the authenticated user and verify permission.

---

## Existing Behaviour Is Not Permission

Current code may contain:

* frontend-only login behaviour;
* hard-coded role or team assumptions;
* client-supplied actor metadata;
* frontend visibility checks;
* single-league shortcuts;
* commissioner checks that do not verify a secure session.

These behaviours describe the current implementation only.

They are not approved Season 2 authentication or authorization.

Secure backend authentication and league-scoped authorization are launch-critical.

No future specification may preserve an insecure shortcut merely because current code depends on it.

---

## Deny by Default

A protected action is denied unless the backend can positively determine:

1. who the user is;
2. which league the action belongs to;
3. whether the user has an active membership in that league when membership is required;
4. which role or permissions apply;
5. which team assignment applies when the action is team-specific;
6. whether the target records belong to the same league;
7. whether the action is permitted in the current league and season state.

Missing or ambiguous authorization must fail without changing state.

The system must not silently fall back to:

* the original Hundo Leago league;
* the first league returned;
* the first team returned;
* a team inferred from a display name;
* a commissioner role claimed by the client;
* a platform-administrator role claimed by the client.

---

## Authentication Is Not Authorization

A valid login proves the user’s identity.

It does not automatically authorize the user to:

* access every league;
* manage a team;
* act as commissioner;
* create a league;
* use platform-administration tools.

Authorization must use persisted account, membership, role, and team-assignment records.

---

## League Isolation

Permissions are league-scoped unless a deliberately approved platform-level action requires otherwise.

A user authorized in one league must not automatically receive access in another league.

Every league-specific read and write must verify the requested league.

The system must prevent:

* reading another league’s private information;
* modifying another league’s records;
* combining memberships from different leagues;
* using a team assignment from one league in another;
* using commissioner authority outside the assigned league;
* leaking one league’s private Socket.IO events to another league.

---

# Part 2 — Permission Model

## User

A user is a person with one Hundo Leago account and a stable user ID.

A user may participate in more than one league when authorized.

An account alone does not establish league access or team control.

---

## Membership

A membership connects:

* one user;
* one league;
* a league role or approved permission set;
* an active or inactive status;
* team assignments where applicable.

The backend must use stable user and league IDs.

Display names, email addresses, league names, and team names must not be used as the sole permission key.

---

## Team Assignment

A team assignment authorizes a user to manage a particular team within a particular league.

A manager may act only for teams covered by an active assignment.

Changing a request’s team ID or team name must not allow a manager to act for another team.

One team may have only one assigned manager at a time.

Team control may be transferred from one user to another through an explicit authorized assignment change.

One manager may control more than one team in the same league.

If future functionality permits multiple managers on one team, those managers must have identical authority.

---

## Initial Roles

The initial permission model distinguishes:

* platform administrator;
* league commissioner;
* team manager;
* unauthenticated visitor.

A role describes a category of possible authority.

The requested action must still be checked against:

* league context;
* membership;
* team assignment;
* feature state;
* record ownership;
* current league or season restrictions.

---

## Role Combination

One user may hold more than one role in the same league.

A commissioner may simultaneously manage a team in that league.

The system must preserve the distinction between roles and record which authority was used for each protected action.

A platform administrator is not automatically the same thing as a league commissioner.

A commissioner is not automatically the manager of every team.

Each league has exactly one commissioner.

---

# Part 3 — Platform Administrator

## Approved Boundary

Platform-administrator authority applies across the Hundo Leago platform.

The initial platform administrator is Grae.

For the initial Season 2 release:

* only Grae or another explicitly authorized platform administrator may create a league;
* normal users may not create leagues;
* public self-service league creation is not required;
* users may create their own account through the sign-up form on the home page;
* platform-administrator actions must be authenticated, explicit, and logged.

---

## Platform-Level Responsibilities

Approved platform-administrator responsibilities include:

* creating user accounts through an approved administrative workflow;
* creating and managing leagues;
* assigning league commissioners;
* performing all platform-level recovery operations unless a specific operation is also granted to commissioners;
* accessing platform tools unavailable to normal commissioners.

Only a platform administrator may assign or remove a league commissioner.

A platform administrator may perform commissioner actions without taking the commissioner role, but must have an explicit active membership in the affected league.

A platform administrator may deactivate or delete a league after an explicit `Are you sure?` confirmation. The action requires administrator approval and must follow the applicable backup, audit, and production-safety requirements.

---

## Platform-Administrator Limits

Platform-level authority must not become untraceable unrestricted access.

Platform-administrator actions must:

* identify the administrator;
* identify the affected league or platform record;
* use an explicit write operation;
* validate the resulting state;
* preserve audit information;
* follow production-safety and recovery requirements.

A platform administrator may not view or operate inside a league without an explicit active membership in that league.

---

# Part 4 — League Commissioner

## Approved Boundary

A commissioner administers only the leagues they are authorized to manage.

Commissioner authority must not cross league boundaries unless the user separately holds platform-administrator authority for an approved platform-level action.

Commissioner actions must be:

* authenticated;
* explicit;
* authorized by league membership;
* logged;
* visible in league history when appropriate and when the action is not a matchup or standings operation;
* limited to approved tools.

---

## Commissioner Administration

The Season 2 platform requires commissioner tools for league operation and recovery.

For the commissioner’s assigned league, the commissioner may:

* add, rename, deactivate, and remove teams;
* assign and remove team managers;
* perform ordinary roster moves for any team;
* submit, edit, and remove auction bids;
* resolve auctions manually;
* propose, accept, reject, cancel, and reverse trades;
* execute buyouts for teams;
* correct contracts, retained salary, and buyout penalties;
* make draft selections for teams;
* correct matchup locks, scoring baselines, and results;
* manage matchup schedules;
* freeze or reopen manager actions;
* initiate a backup or snapshot restoration, subject to platform-administrator approval.

Commissioners may not change league settings in the initial release.

Future features may allow commissioners to choose from limited league-setup options. Those options must be deliberately approved and must not permit changes during an active season.

---

## Commissioner Corrections

Every commissioner correction must:

1. identify the authenticated commissioner;
2. identify the league;
3. identify the affected records;
4. verify commissioner authority in that league;
5. accept an optional correction reason when one is provided;
6. preserve useful before-and-after information;
7. validate the resulting league state;
8. save the complete correction atomically when multiple records are involved;
9. create an activity record unless the correction affects only matchup or standings records;
10. return the authoritative resulting state.

A matchup or standings correction must be preserved in the applicable result or correction records, but it must not appear in league activity history.

A commissioner correction must not be triggered by:

* opening a page;
* viewing a record;
* refreshing data;
* calling a read-only endpoint.

---

## Commissioner Is Not an Invisible Manager

The frontend may provide commissioner-specific controls, but commissioner authority must remain visibly distinct from normal manager actions.

If a commissioner is permitted to act for a team:

* the interface must identify the action as a commissioner action;
* the backend must record the commissioner as the actor;
* league history must not make the action appear to have been performed by the team’s manager;
* the reason requirement must follow the approved correction policy.

A commissioner may perform ordinary team transactions for any team in the commissioner’s league.

The interface and activity record must continue to identify the commissioner as the actor.

No commissioner action requires a written reason.

---

# Part 5 — Team Manager

## Approved Boundary

A manager controls only teams covered by an active team assignment.

A manager must not:

* act for another team by changing request data;
* obtain commissioner authority through frontend state;
* change platform-level settings;
* create a league;
* directly edit authoritative matchup results or standings;
* perform hidden recovery or migration actions;
* bypass a league freeze or other approved restriction.

---

## Manager Team Actions

For each assigned team, a manager may:

* perform every normal roster move supported by the approved roster workflow;
* make all manual prospect-signing decisions until approved real-life contract detection and automatic execution are implemented;
* submit and edit auction bids, but not withdraw them;
* propose, accept, reject, and cancel trades where the assigned team is an authorized party;
* buy out eligible players;
* edit the team name, team colours, pattern template, and team logo.

The legal active roster locks automatically for matchups. Managers do not submit a separate matchup lineup.

The feature rules determine whether an authorized action is valid.

This permission document determines whether the manager may attempt it.

---

## Asset and Record Ownership

For every team-specific action, the backend must verify that:

* the team belongs to the requested league;
* the user is assigned to that team;
* every affected player, contract, bid, trade, draft pick, prospect right, or other asset belongs to the expected league;
* the team owns or controls each asset where ownership is required;
* any other participating team belongs to the same league;
* the action is permitted in the current workflow state.

Possession of an object ID is not authorization to modify the object.

---

# Part 6 — Unauthenticated Visitor

## Approved Boundary

An unauthenticated visitor may access only:

* login-related functionality;
* information deliberately approved as public.

An unauthenticated visitor may not perform a league write.

The system must not treat an absent session as:

* a manager;
* a commissioner;
* a platform administrator;
* a default public league member.

Unauthenticated visitors may view rosters from every league through read-only access.

No other league information is public in the initial permission baseline.

---

## Login and Recovery

Login and account-recovery endpoints must expose only the information needed for their approved purpose.

They must not reveal:

* stored password information;
* session secrets;
* whether a private league record exists when that disclosure is not approved;
* private membership or team-assignment information;
* internal recovery credentials.

Advanced public account recovery may remain deferred if a safe administrator-managed process is approved and documented.

---

# Part 7 — Shared Read Rules

## Read-Only Means Read-Only

A read-only request must not:

* create or repair records;
* assign a user or team;
* change a role;
* refresh or normalize authoritative state through a hidden write;
* resolve an auction;
* change a trade;
* alter a roster;
* finalize a matchup;
* change standings;
* migrate or reseed data.

Any required mutation must use an explicit authorized write operation.

---

## Authenticated Reads

For private league information, the backend must verify:

* the authenticated user;
* an active membership in the requested league;
* any feature-specific visibility rule.

Membership in one league must not authorize private reads from another.

---

## Public Reads

Every league’s rosters are public and read-only.

Unauthenticated visitors may not use public roster access to view:

* league standings;
* matchup results;
* private player or contract information not included in the approved roster response;
* auction information;
* trade information;
* league activity history;
* account or security information.

The API Contracts specification must define the exact public roster response and ensure the request has no hidden write.

---

## Private Competitive Information

Every authenticated user with an active membership in a league may view that league’s:

* active auction player, participating teams, bid count, and deadlines;
* that user’s own active bid amount and contract term;
* resolved auction bids and contract terms through League Activity;
* pending trade proposals;
* rejected, cancelled, and expired trade proposals through League Activity;
* full activity history;
* commissioner correction notes;
* league-scoped login and security-audit information.

Commissioner correction reasons, when one is provided, are visible to all users in the league.

Platform administrators may view platform-wide login and security-audit information.

Unauthenticated visitors may not view login or security-audit information.

Passwords, password-reset secrets, session tokens, recovery secrets, and other credentials are never visible through these permissions.

No user, including a commissioner, may view a competing active bid amount or contract term. Commissioner bid-administration authority does not include an active-bid reveal.

The frontend and backend must use these same visibility rules.

---

# Part 8 — Shared Write Rules

## Authorization Sequence

Every protected write should follow this order:

1. authenticate the user;
2. identify the league from a stable league ID;
3. load the user’s active membership and role;
4. load team assignments when the action is team-specific;
5. load the affected records using the same league ID;
6. verify the exact action permission;
7. validate feature and league rules;
8. calculate the complete resulting state;
9. save atomically;
10. create required activity history unless the write affects only matchup or standings records;
11. return the authoritative result.

Authorization must occur before state changes.

---

## Client-Supplied Identity

The backend must not trust client-supplied values such as:

* actor role;
* actor team;
* actor display name;
* commissioner flag;
* administrator flag;
* team ownership claim.

Client requests may identify a target league or team, but authority must come from the authenticated server-side user and persisted permission records.

---

## No Partial Authorization

A multi-record action must be authorized as a whole.

Examples include:

* a trade between teams;
* an auction resolution;
* a commissioner roster correction;
* a league-season rollover;
* a backup restoration;
* a multi-record membership change.

The backend must not change some records and then discover that the user lacked authority for the remaining records.

---

## Manager Write Freeze

A league freeze blocks every manager write in that league.

Every commissioner and platform-administrator action remains available during the freeze, subject to its normal permission and validation rules.

Activating a freeze does not require a written reason or a league activity record.

A freeze must be stored per league and must not accidentally freeze unrelated leagues.

Destructive or wide-reaching actions require platform-administrator approval.

A commissioner may initiate a backup or season-snapshot restoration, but the restoration may proceed only after platform-administrator approval.

---

# Part 9 — Permission Matrix

The following matrix records the approved Season 2 permission baseline.

| Action | Platform administrator | League commissioner | Team manager | Unauthenticated visitor |
| --- | --- | --- | --- | --- |
| Create own user account through sign-up | Yes | Yes | Yes | Yes |
| Log in and log out | Own account | Own account | Own account | Login only |
| Create a league | Yes | No, unless separately a platform administrator | No | No |
| Assign or remove a league commissioner | Yes | No | No | No |
| View private league data | With active league membership | Assigned league | Member league | No |
| View public league rosters | Yes | Yes | Yes | Yes |
| Edit league settings | Platform administration only | No in initial release | No | No |
| Add, rename, deactivate, or remove teams | Yes | Assigned league | No | No |
| Assign managers to teams | Yes | Assigned league | No | No |
| Manage a team roster | With active membership and administrative authority | Any team in assigned league | Assigned team | No |
| Submit or edit auction bids | With active membership and administrative authority | Any team in assigned league | Assigned team | No |
| Withdraw an auction bid | With active membership and administrative authority | Assigned league | No | No |
| Resolve auctions manually | With active membership and administrative authority | Assigned league | No | No |
| Propose, accept, reject, or cancel a trade | With active membership and administrative authority | Any team in assigned league | Assigned team where authorized | No |
| Reverse a trade | With active membership and administrative authority | Assigned league | No | No |
| Buy out a player | With active membership and administrative authority | Any team in assigned league | Assigned owning team | No |
| Correct contracts or cap obligations | With active membership and administrative authority | Assigned league | No | No |
| Configure matchup schedules | With active membership and administrative authority | Assigned league | No | No |
| Correct matchup locks, baselines, or results | With active membership and administrative authority | Assigned league | No | No |
| Directly edit standings | No hidden edit | No hidden edit | No | No |
| Rebuild standings from corrected results | With active membership and administrative authority | Assigned league | No | No |
| Initiate backup or snapshot restoration | Yes | Assigned league | No | No |
| Approve backup or snapshot restoration | Yes | No | No | No |
| View league activity, bids, trades, and correction reasons | Member league | Assigned league | Member league | No |
| View league-scoped login or security audit | Member league | Assigned league | Member league | No |
| View platform-wide login or security audit | Yes | No | No | No |

---

# Part 10 — Feature Permission Boundaries

## Accounts

The User Accounts specification must define:

* sign-in and sign-up forms on the home page;
* optional administrator-created accounts;
* safe password creation;
* user-controlled password changes;
* password reset;
* user-controlled account deactivation and reactivation;
* session invalidation;
* protection against account enumeration;
* audit requirements.

Passwords must never be stored in plain text.

Passwords and session secrets must not be written to activity history.

---

## Leagues and Teams

The Leagues and Teams specification must define:

* platform-administrator-only league creation;
* platform-administrator-only commissioner assignment;
* the absence of commissioner-controlled settings in the initial release;
* commissioner authority to add, rename, deactivate, and remove teams;
* commissioner authority to assign and remove managers;
* the one-manager-at-a-time team rule;
* manager-assignment transfers;
* one manager controlling multiple teams;
* how memberships are deactivated;
* how historical records remain attributable after assignments change.

---

## Rosters and Contracts

The Roster and Contract specifications must distinguish:

* normal manager roster moves;
* manager contract decisions;
* commissioner corrections;
* automated scheduled changes;
* platform-level recovery.

Commissioner corrections must not be recorded as normal manager moves.

---

## Auctions

The Auction specification must define:

* manager authority to submit and edit bids for assigned teams;
* the prohibition on manager bid withdrawal;
* commissioner authority to submit, edit, remove, and manually resolve bids;
* blindness of competing active bid amounts and contract terms, including from commissioners;
* visibility of resolved bids and terms to authenticated league users through League Activity;
* scheduled and commissioner-triggered resolution;
* audit and privacy rules.

---

## Trades

The Trade specification must define:

* manager authority to propose, accept, reject, and cancel for assigned teams;
* commissioner authority to propose, accept, reject, cancel, and reverse for any team in the assigned league;
* visibility of pending proposals in the normal proposal interface;
* visibility of completed, rejected, expired, and cancelled proposals through League Activity.

The normal manager trade workflow requires authorization from each participating team. A commissioner may complete or correct both sides through a clearly identified commissioner action.

---

## Matchups and Standings

The Matchup specification must define:

* automatic locking of each legal active roster without separate manager lineup submission;
* commissioner lock and baseline recovery authority;
* commissioner result-correction authority;
* correction-record requirements.

Standings must remain read-only for managers.

Standings changes must derive from authoritative matchup results or an explicit approved correction workflow.

---

## Entry Draft

The Entry Draft specification must define:

* commissioner draft configuration;
* manager selections for assigned teams;
* automatic timeout selections and commissioner pause, resume, and technical-recovery authority;
* commissioner authority to select for any team;
* the absence of skipped picks and selection undo;
* completed-selection immutability;
* draft-history visibility;
* how traded pick ownership is authorized and validated.

---

## Commissioner Tools

The Commissioner Tools specification must define every commissioner action explicitly.

There must not be a generic unrestricted “edit all league JSON” permission in the normal product.

High-risk tools must identify:

* required role;
* affected league;
* required confirmation;
* optional reason when one is provided;
* required platform-administrator approval for destructive or wide-reaching actions;
* validation;
* audit record;
* rollback or recovery path.

---

# Part 11 — Authentication and Session Requirements

## Secure Authentication

Season 2 requires:

* sign-in and sign-up forms on the home page;
* secure password storage;
* backend login verification;
* backend-managed authenticated sessions;
* logout;
* user-controlled password changes;
* password reset;
* user-controlled account deactivation and reactivation;
* session expiration;
* a single active session per user;
* protection against client role impersonation;
* safe failure responses;
* non-production test accounts for testing.

The exact mechanism belongs in the technical specifications.

---

## Session-Derived Identity

Protected endpoints must derive the acting user from the authenticated session.

The session should provide or resolve a stable user ID.

League memberships, roles, and team assignments must be loaded from authoritative persisted data rather than copied permanently into browser state.

---

## Session Revocation

Sessions are invalidated after:

* logout;
* password reset;
* account deactivation;
* a new login by the same user.

Concurrent sessions are not permitted. A successful new login invalidates the user’s previous session.

Membership and role changes do not revoke the authenticated session.

The backend must load current membership, role, and team-assignment authority for every protected action. A user whose membership or role was removed therefore loses the related permission immediately even though the login session remains authenticated.

Exact session duration belongs in the technical specification.

---

# Part 12 — Activity and Security Audit

## Required Actor Information

A protected activity record should identify:

* stable activity ID;
* actor user ID;
* actor role used for the action;
* league ID;
* affected team IDs;
* action type;
* timestamp;
* relevant record IDs;
* human-readable summary;
* useful before-and-after information when appropriate.

The activity record must not trust an actor name supplied by the client.

---

## Administrative Activity

Commissioner and platform-administrator writes must be logged, except that activating a league freeze does not require a league activity-history record.

Matchup and standings writes must not create league activity-history entries. Their required schedules, locks, baselines, results, corrections, rollovers, standings calculations, and operational evidence belong in separate matchup, result, correction, or operational records.

High-risk administrative actions should also record:

* optional reason when one is provided;
* confirmation;
* platform-administrator approval when required;
* recovery reference when applicable;
* whether the action was performed as a correction, recovery, or normal administration.

---

## Security Audit Data

Security audit data may include:

* successful and failed login events;
* session revocation;
* role changes;
* membership changes;
* team-assignment changes;
* denied high-risk actions;
* account recovery.

The exact retention and visibility policy belongs in the User Accounts, Testing, and Operations documents.

Security logs must not contain passwords, session tokens, or secrets.

---

# Part 13 — Error and Failure Behaviour

## Authorization Failure

An authorization failure must:

* change no state;
* return a clear safe error;
* avoid exposing secrets;
* avoid confirming private records unnecessarily;
* be distinguishable from normal validation failure where safe;
* be logged when the denied action is security-sensitive.

The API Contracts specification must define consistent unauthenticated and unauthorized responses.

---

## Missing League Context

When a protected action lacks an unambiguous league ID, the backend must fail without:

* defaulting to another league;
* reading private league data;
* changing state.

---

## Stale Permission State

If a user’s browser contains stale role or team information, the backend’s current persisted permission state wins.

The frontend must handle the denial and refresh its account and membership context.

---

## External and Internal Failures

An authentication, permission-store, or database failure must not become authorization.

The safe default is denial without mutation.

---

# Part 14 — Testing Requirements

## Minimum Permission Tests

At minimum, test:

* unauthenticated access to every protected write;
* manager access to the manager’s assigned team;
* manager access attempts against another team;
* commissioner access inside the assigned league;
* commissioner access attempts against another league;
* platform-administrator-only actions;
* inactive memberships;
* removed team assignments;
* role changes during an existing session;
* client-modified role and team claims;
* record IDs belonging to another league;
* read-only endpoints for hidden writes;
* audit creation for commissioner and administrator actions;
* league freeze behaviour;
* Socket.IO league isolation;
* authorization failure with no state change.

---

## Multi-League Verification

Permission testing must use at least two separate leagues.

Single-league testing cannot prove league isolation.

Tests must verify that:

* records from league A cannot be read through league B;
* records from league A cannot be modified through league B;
* commissioner authority in league A grants no authority in league B;
* a team assignment in league A grants no authority over a similarly named team in league B.

---

## Browser Controls Are Not Sufficient Tests

A hidden or disabled frontend button is useful user-interface behaviour.

It is not proof of backend authorization.

Every meaningful permission must be tested by calling the backend with:

* an authorized session;
* an unauthorized session;
* no session;
* altered target identifiers where relevant.

---

# Part 15 — Approval Checklist

Grae approved the following Season 2 permission decisions on 2026-07-18.

## Approved Foundation

- [x] The initial roles are platform administrator, league commissioner, team manager, and unauthenticated visitor.
- [x] Backend authorization is required; frontend visibility is not security.
- [x] The initial platform administrator is Grae.
- [x] Only an explicitly authorized platform administrator may create a league in the initial release.
- [x] Public self-service league creation is not required for the initial release.
- [x] Managers may act only for teams they are authorized to control.
- [x] Commissioner authority is limited to leagues the commissioner is authorized to manage.
- [x] Users may participate in more than one league when authorized.
- [x] An unauthenticated visitor may not perform league writes.
- [x] Commissioner and platform-administrator actions must be explicit and logged except for the approved freeze-history exception.
- [x] Read-only endpoints must remain read-only.
- [x] Missing or ambiguous permission must fail without changing state.
- [x] Client-supplied role or team claims are not proof of authority.
- [x] League-specific access must use stable league, user, membership, and team identifiers.

## Role Structure

- [x] One user may hold more than one role in the same league.
- [x] A commissioner may simultaneously manage a team in that league.
- [x] A platform administrator needs an explicit league membership to view or operate inside a league.
- [x] Each league has exactly one commissioner.
- [x] Each team has exactly one manager at a time, and the assignment may be transferred.
- [x] One manager may control more than one team in the same league.
- [x] If multiple managers are supported in the future, managers assigned to the same team have identical authority.

## Platform Administrator

- [x] An authorized platform administrator may create user accounts.
- [x] Users may also create their own accounts through the home-page sign-up form.
- [x] A league commissioner may not create user accounts.
- [x] Only a platform administrator may assign or remove league commissioners.
- [x] A platform administrator may perform commissioner actions without taking the commissioner role, but requires an active membership in the league.
- [x] Every platform-level recovery action is administrator-only unless a specific action is also granted to commissioners.
- [x] A platform administrator may deactivate or delete a league after an `Are you sure?` confirmation and administrator approval.

## Commissioner

- [x] Commissioners may add, rename, deactivate, and remove teams in their league.
- [x] Commissioners may assign and remove team managers in their league.
- [x] Commissioners may not change league settings in the initial release.
- [x] Future commissioner setup options must be limited and may not change during an active season.
- [x] Commissioners may perform ordinary roster moves for any team in their league.
- [x] Commissioners may submit, edit, and remove auction bids in their league.
- [x] Commissioners may resolve auctions manually.
- [x] Commissioners may propose, accept, reject, cancel, and reverse trades.
- [x] Commissioners may execute buyouts for teams.
- [x] Commissioners may correct contracts, retained salary, and buyout penalties.
- [x] Commissioners may make draft selections for teams.
- [x] Commissioners may correct matchup locks, baselines, and results.
- [x] Commissioners may initiate backup or snapshot restoration, subject to platform-administrator approval.
- [x] No commissioner action requires a written reason.
- [x] Matchup and standings actions do not create league activity-history entries.

## Manager

- [x] Managers may perform every approved normal roster move for their assigned teams.
- [x] Managers have complete manual authority over prospect signing decisions until automatic real-life contract detection and execution are implemented.
- [x] Managers may submit and edit auction bids but may not withdraw them.
- [x] Managers may propose, accept, reject, and cancel trades for their assigned teams.
- [x] Managers may buy out eligible players owned by their assigned teams.
- [x] The legal active roster locks automatically; managers do not submit a separate matchup lineup.
- [x] Managers may edit their team name, team colours, pattern template, and team logo.

## Visibility

- [x] Unauthenticated visitors have read-only access to approved public information.
- [x] Rosters from every league are public; no other league information is public in the initial release.
- [x] Every authenticated user in a league may view active auction identity, participants, bid count, deadlines, and only that user’s own bid amount and term.
- [x] No user, including a commissioner, may view a competing active bid amount or term.
- [x] Every authenticated user in a league may view resolved bid amounts and terms through League Activity.
- [x] Every authenticated user in a league may view that league’s pending trade proposals.
- [x] Every authenticated user in a league may view rejected, cancelled, and expired trade proposals through League Activity rather than the normal proposal interface.
- [x] Every authenticated user in a league may view that league’s full activity history.
- [x] Commissioner correction reasons, when provided, are visible to every user in the league.
- [x] Every authenticated league user may view league-scoped login and security-audit information; platform administrators may view platform-wide audit information.

## Accounts and Sessions

- [x] Sign-in and sign-up forms are available on the home page, and users choose credentials through the sign-up workflow.
- [x] Users may change their own passwords.
- [x] Account recovery uses password reset.
- [x] Each user may deactivate and reactivate their own account.
- [x] Membership and role changes never revoke the authenticated session; current permissions are still reloaded for every protected action.
- [x] Concurrent sessions are not permitted; a new login invalidates the previous session.

## League Freeze and High-Risk Actions

- [x] A league freeze blocks every manager write.
- [x] Every normally authorized commissioner and platform-administrator action remains available during a freeze.
- [x] Freeze activation requires neither a written reason nor a league activity-history record.
- [x] Destructive or wide-reaching actions require platform-administrator approval.
- [x] Backup or season-snapshot restoration requires platform-administrator approval, even when a commissioner initiates it.

## Approval

- [x] Remaining implementation details are assigned to the appropriate product and technical specifications.
- [x] Grae approves this document as the Season 2 permission baseline.
- [x] Document status is `APPROVED`.

---

## Definition of Done

The rule-approval phase for this document is complete because:

* Grae has approved or revised every material permission decision;
* no unresolved implementation detail is presented as approved behaviour;
* every protected feature can identify the role and scope required for each action;
* platform-administrator, commissioner, manager, and unauthenticated access have clear boundaries;
* public and private information categories are unambiguous;
* commissioner corrections and recovery actions have explicit safeguards;
* the User Accounts, feature product specifications, Data Model, and API Contracts can implement one consistent authorization model.

The planned product and technical specifications must define the remaining workflow, data, API, password-reset, confirmation, and session implementation details without changing these approved permission boundaries.

---

## Related Documents

```text
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/07-testing/TESTING_STRATEGY.md
docs/08-operations/PRODUCTION_RUNBOOK.md
docs/10-decisions/DECISION_LOG.md
```
