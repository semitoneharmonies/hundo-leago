# Hundo Leago — Leagues and Teams

## Document Status

`APPROVED`

This product specification consolidates:

* approved Season 2 league and team requirements;
* approved permission boundaries affecting leagues, memberships, commissioners, managers, and public roster access;
* the user-visible workflows required for league and team administration;
* current implementation limitations that must not be treated as approved multi-league behaviour;
* approved boundaries for details that belong in more specific product and technical specifications.

Grae approved the Season 2 Leagues and Teams product specification recorded in this document on 2026-07-18.

Grae approved the FAD readiness and participating-team amendments on 2026-07-27.

Grae approved the automatic Candidate Card opening amendment on 2026-07-29.

---

## Product Purpose

Hundo Leago must support multiple independent fantasy hockey leagues.

This specification defines how:

* a platform administrator creates and manages a league;
* a commissioner is assigned to a league;
* teams are created and administered;
* users become league members;
* one manager at a time is assigned to each team;
* team control is transferred;
* league and team identity remain stable when names change;
* public visitors view league rosters;
* inactive, removed, or deleted records are handled safely;
* league and team actions remain isolated and auditable.

The goal is one understandable league and team workflow that every later feature can rely on.

---

## Out of Scope

This document does not define:

* password creation, login, password reset, or session implementation;
* exact roster-move workflows;
* contract formulas;
* auction bidding rules;
* trade validation;
* scoring formulas;
* matchup scheduling algorithms;
* standings calculations;
* entry-draft operation;
* database tables;
* exact API request and response shapes;
* deployment or migration steps.

Those subjects belong in the related rule, product, technical, testing, and operations documents.

---

# Part 1 — Product Authority

## Source Documents

This specification depends on:

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
```

When this product specification conflicts with an approved shared rule, the approved shared rule remains authoritative until the conflict is deliberately resolved.

---

## Existing Behaviour Is Not the Target Model

The current application was designed around one primary league and six original teams.

Current code may contain:

* one global league-state object;
* team-name-based identity;
* a globally selected team;
* frontend-only login assumptions;
* commissioner controls built for the original league;
* file-backed JSON records without league relationships.

These behaviours describe current implementation only.

They are not the approved Season 2 multi-league product model.

---

## Backend Authority

The backend is authoritative for:

* league identity;
* league lifecycle state;
* league membership;
* commissioner assignment;
* team identity;
* manager assignment;
* team profile information;
* league settings;
* league and team activity records.

The frontend may display and submit information, but it must not independently decide membership, team control, commissioner authority, or league settings.

---

## League Isolation

Every league-specific record must belong to exactly one league.

This includes:

* memberships;
* teams;
* rosters;
* contracts;
* auctions and bids;
* trades;
* buyouts and retained salary;
* draft picks and prospect rights;
* matchup schedules and locks;
* results and standings;
* league settings;
* activity history.

The system must not:

* combine information from different leagues;
* use one league’s settings in another;
* infer league identity from a team name;
* reuse stale selected-league state;
* fall back to the original Hundo Leago league when league context is missing.

Missing or ambiguous league context must fail clearly without changing state.

---

# Part 2 — Product Actors

## Platform Administrator

Only an authenticated platform administrator may create a league.

The platform administrator may:

* create and manage leagues;
* assign or replace the league commissioner;
* create an active membership permitting the administrator to operate inside a league;
* configure approved initial league information;
* deactivate or delete a league after the approved confirmation and safety checks.

A platform administrator requires an explicit active membership to view or operate inside a league.

---

## Commissioner

Each league has exactly one commissioner.

The commissioner must have:

* a user account;
* an active membership in the league;
* the commissioner role for that league.

Within the assigned league, the commissioner may:

* add, rename, deactivate, and remove teams;
* assign and remove team managers;
* transfer team management;
* perform the other approved commissioner actions defined in Permissions.

The commissioner may simultaneously manage a team.

Commissioners may not change league settings in the initial release.

Future approved features may expose limited setup options, but those options may not change during an active season.

---

## Team Manager

A manager controls only teams covered by an active assignment.

One team may have only one assigned manager at a time.

One manager may control more than one team in the same league.

For an assigned team, the manager may edit:

* team name;
* team colours;
* team logo.

The manager’s other team actions are defined in the applicable feature specifications.

---

## Unauthenticated Visitor

An unauthenticated visitor may view public rosters from every league.

Public access is read-only.

No other league information is public in the initial permission baseline.

The approved public roster fields are defined in Part 10. API Contracts must expose those fields as read-only data without adding private or write-capable fields.

---

# Part 3 — Core Product Records

## League

A league is an independent fantasy hockey competition with a stable league ID.

A league has its own:

* name;
* season context;
* lifecycle state;
* commissioner;
* memberships;
* teams;
* settings;
* scoring configuration;
* matchup schedule;
* activity and historical records.

Renaming a league must not change its league ID.

---

## Membership

A membership connects:

* one user;
* one league;
* an active or inactive status;
* one or more league roles where approved;
* team assignments where applicable.

A user account alone does not grant access to private league information.

Membership records must remain attributable after roles or assignments change.

---

## Team

A team is a fantasy hockey organization belonging to exactly one league.

A team has a stable team ID.

A team may have:

* a mutable name;
* approved team colours;
* a logo;
* one current manager assignment;
* rosters;
* contracts;
* cap obligations;
* auction and trade records;
* draft assets;
* matchup results;
* standings history.

Renaming a team must not change its team ID or detach historical records.

---

## Team Assignment

A team assignment connects:

* one user;
* one league;
* one team;
* an active period;
* assignment history.

A transfer changes which user may manage the team without changing:

* team identity;
* roster ownership;
* contracts;
* cap obligations;
* draft assets;
* transaction history;
* matchup results;
* standings history.

---

## League Settings

League settings are configuration belonging to one league.

The rule model must be capable of representing the approved league and scoring values required by the canonical rules.

Settings must not be scattered as unrelated frontend and backend constants.

Unsupported settings must not appear as functional options.

League settings must not silently change during an active season.

---

# Part 4 — League Creation

## Approved Creation Boundary

League creation is an administrative function.

Only a platform administrator may create a league.

The initial release does not support:

* manager-created leagues;
* commissioner-created leagues unless the user separately has platform-administrator authority;
* public self-service league creation;
* payment or subscription onboarding.

---

## Required Creation Information

The only required league field entered when the platform administrator creates the league is:

* league name;

League names must be unique across the platform.

There is no product-level league-name length, character, or moderation restriction.

The league season is identified and displayed by year.

The default timezone is:

```text
America/Vancouver
```

All new leagues use the currently approved fixed league and scoring settings. Different setting options must not be offered until new options are deliberately implemented in future updates.

---

## Creation Workflow

The approved workflow is:

1. An authenticated platform administrator opens the league-creation tool.
2. The administrator enters the unique league name.
3. The backend creates the league in `Setup` using the current approved fixed settings and `America/Vancouver`.
4. The administrator selects one existing user as the proposed commissioner.
5. The proposed commissioner receives a basic notification and accepts the assignment.
6. The system creates the commissioner’s active league membership.
7. The commissioner invites users to create the initial teams.
8. Each invited user accepts the invitation and creates a team.
9. The commissioner records the trade-deadline date and time.
10. When at least four teams exist and every launch invitation has been accepted, the commissioner presses `Start League`.
11. The backend validates the complete proposed league.
12. The league becomes `Active`.
13. Administrative and league activity records are created where required.
14. The backend returns the authoritative league.

No partial league should appear active when creation fails.

---

## Duplicate Submission

A repeated create request caused by a timeout, retry, or double-click must not create duplicate leagues, commissioner memberships, or teams.

The technical specification must define the idempotency mechanism.

---

## Commissioner Assignment During Creation

The selected commissioner must:

* have an existing user account;
* be eligible for an active membership;
* not already be the commissioner of the same league record;
* receive a basic assignment notification;
* accept the assignment;
* become the league’s single commissioner after acceptance.

The league remains in `Setup` until commissioner acceptance and the remaining start requirements are satisfied.

---

## Creation-Time Trade Deadline

Approved League Rules state:

```text
The commissioner sets the trade deadline during league creation.
```

Approved Permissions also state:

```text
Commissioners may not change league settings in the initial release.
```

These rules operate together as follows:

* the selected commissioner enters the trade deadline during the league-creation setup workflow;
* this is a narrow creation-time responsibility, not general permission to change league settings;
* the trade deadline is stored as an informational date and time;
* after creation, the commissioner may not change the trade deadline or other league settings in the initial release;
* a correction or future-season change requires the approved administrator workflow.

The creation interface must clearly separate the platform administrator’s creation authority from the commissioner’s limited setup input.

In the initial release, the stored trade deadline does not:

* automatically close trading;
* cancel or expire trade proposals;
* trigger a scheduled event;
* reopen trading.

Automated trade-deadline behaviour is deferred to a future update.

---

# Part 5 — League Lifecycle

## Lifecycle States

The persisted league lifecycle states are:

* `Setup`;
* `Active`;
* `Inactive`;
* `Completed`;
* `Deactivated`;
* `Archived`.

Every lifecycle state may transition to any other lifecycle state through an authorized explicit action.

The system must not infer lifecycle state only from the current date.

---

## Active-Season Protection

League settings may not silently change during an active season.

Any approved material rule change requires:

* Grae’s approval;
* an authoritative documentation update;
* an effective date or season;
* affected-data review;
* migration planning where needed;
* verification;
* activity or decision history where appropriate.

---

## Deactivation

Only a platform administrator may deactivate a league.

Deactivation requires:

* an explicit action;
* an `Are you sure?` confirmation;
* administrator approval;
* preservation of required historical data;
* an administrative record.

When a league is `Deactivated`:

* authenticated league users retain read-only private access;
* its rosters are no longer publicly visible;
* scheduled jobs are disabled;
* pending transactions are disabled and cannot be acted upon;
* no normal league write may complete until the league transitions to another permitted state.

---

## Deletion

Only a platform administrator may delete a league.

Deletion requires:

* an explicit `Are you sure?` confirmation;
* platform-administrator approval;
* compliance with the current operating mode;
* clear identification of all affected records;
* an administrative audit record.

A production league may be permanently deleted.

League deletion is permanent and unrecoverable.

No deleted-league recovery, restoration, retained backup, or product-level recovery workflow is available in the initial release.

---

# Part 6 — Commissioner Assignment

## Single Commissioner

Each league has exactly one commissioner.

The system must not leave an operational league with:

* zero commissioners;
* multiple commissioners;
* a commissioner membership belonging to another league;
* a commissioner identified only by display name.

---

## Commissioner Replacement

Only a platform administrator may assign or remove a commissioner.

The replacement workflow is:

1. The administrator selects the league.
2. The administrator selects an eligible replacement user.
3. The system shows the current and proposed commissioner.
4. The administrator confirms the replacement.
5. The proposed replacement receives a basic notification.
6. The proposed replacement accepts.
7. The backend validates both memberships and the target league.
8. The old commissioner role is removed.
9. The replacement commissioner role is created.
10. Both changes save atomically.
11. The action is recorded.

If a commissioner account or membership becomes inactive, the system automatically reassigns the commissioner role to another active manager in the same league.

The selection must use one deterministic rule defined in the User Accounts and technical specifications.

The automatically selected replacement receives a basic notification.

---

## Commissioner as Manager

A commissioner may manage a team in the same league.

Commissioner and manager authority must remain distinguishable.

When the user performs a protected action, the interface and activity record must identify whether it was:

* a normal manager action for the assigned team;
* a commissioner action.

---

# Part 7 — Team Creation and Administration

## Team Creation

During initial setup, invited users create their own teams after accepting commissioner invitations.

After league startup, a commissioner may create a team within the assigned
league only during an approved season-setup window.

A platform administrator with an active league membership may perform the same action through approved administrative authority.

For a season with an Entry Draft, a normal upcoming-season team creation must
finish before Entry Draft setup confirmation freezes the draft's participating
teams. No normal team may be added after that point for the same season because
it would have missed its draft rights.

For an approved no-draft transition, normal team creation remains available
only until the automatic all-or-none readiness transition opens every
Candidate Card.

Creating a team must:

1. identify the league by stable league ID;
2. verify the actor’s authority;
3. validate the team profile;
4. create a stable team ID;
5. attach the team to exactly one league;
6. create no roster, contract, or asset records that were not explicitly approved;
7. create required activity history;
8. return the authoritative team.

Each league may have:

```text
Minimum teams: 4
Maximum teams: 20
```

An even number of teams is not required.

A team may exist temporarily without a manager during setup.

For an upcoming season, the final participating team set freezes atomically
when the automatic all-or-none readiness transition opens every Candidate
Card. No commissioner confirmation or reversible setup toggle opens only some
cards. A normal team erasure or deactivation must fail from that instant
through FAD completion and the live season. Normal team creation has already
closed at the applicable earlier cutoff. Exceptional recovery requires its
separately approved explicit workflow and does not silently add a team to an
active draft or schedule.

---

## Team Name

Team names are mutable display values.

Changing a team name must not change:

* team ID;
* league ID;
* current manager assignment;
* roster or contracts;
* transaction ownership;
* draft assets;
* matchup or standings history.

Team names must be unique within their league.

Maximum team-name length:

```text
35 characters
```

There are no additional product-level character or moderation restrictions.

---

## Team Colours and Patterns

A manager may edit the assigned team's colours and pattern template.

A commissioner may edit colours and the pattern template for any team in the
assigned league through commissioner authority.

Each approved template has a fixed requirement of either two or three
selectable colours. Choosing a template determines how many colour inputs the
manager receives; there is no separate two-colour or three-colour selector.

The approved catalog includes the existing two-stripe and three-stripe even
splits, deduplicated hockey stripe arrangements, animal and geometric
patterns, and two- and three-colour gradients. Templates that produce the same
arrangement are represented once.

The selected colours do not need to satisfy contrast or league-uniqueness
rules. Team-name and logo treatments must add a neutral readability layer so
the identity remains legible regardless of the selected colours.

The selected template remains visible across the containing team surface.
Where it passes behind a team name or logo, it may fade toward the standard
dark-blue application background to preserve readability. This treatment
applies consistently to the team index, the dashboard league-teams panel,
matchup score headers, the roster identity header, and player cards in the
roster hockey-lines view.

The technical specification must define the stored colour and template
representations.

---

## Team Logo

A manager may edit the assigned team’s logo.

A commissioner may edit the logo for any team in the assigned league through commissioner authority.

There are no product-level logo file-type, file-size, dimension, cropping, or fallback requirements.

The technical specification must still define safe storage, upload handling, replacement, removal, and minimum security protections.

---

## Team Deactivation, Removal, and Deletion

There is no product distinction between team deactivation, removal from competition, and permanent deletion.

The action permanently erases the team from the league.

It may occur only during the approved off-season window:

```text
after Entry Draft completion, or an approved no-draft transition,
and before the automatic all-or-none readiness transition opens Candidate Cards
```

When the team is erased:

* every rostered player immediately becomes a free agent;
* contracts are erased;
* cap obligations are erased;
* draft assets are erased;
* pending transactions are erased;
* matchup and standings records belonging to the team are erased;
* team history is erased;
* the manager assignment ends;
* the public roster disappears.

A league-level administrative record of the commissioner’s erase action must remain so the destructive action is attributable.

---

## Team-Erase Authorization

A commissioner may initiate and confirm the team erase in the assigned league.

Because the action is destructive and wide-reaching, the platform-administrator approval required by Permissions still applies before execution.

The action must fail without changing state outside the approved off-season window.

---

# Part 8 — Manager Assignment and Transfer

## One Manager at a Time

A team may have only one assigned manager at a time.

A team assignment must use stable user, league, and team IDs.

The system must not authorize team control from:

* matching display names;
* a browser-selected team;
* a stale local-storage value;
* client-supplied role metadata.

---

## Manager Assignment

A commissioner may assign a user to manage a team in the commissioner’s league.

A platform administrator with an active league membership may perform the same action through approved administrative authority.

The backend must verify that:

* the user exists;
* the user is eligible for an active league membership;
* the team belongs to the league;
* the team does not already have another active manager assignment unless the action is an approved transfer;
* the assignment does not create duplicate active records.

The proposed manager receives a basic notification and must accept before the assignment becomes active.

---

## Manager Transfer

Team management may be transferred from one user to another.

The transfer must:

1. identify the current manager;
2. identify the replacement manager;
3. identify the league and team;
4. verify commissioner or administrator authority;
5. send the replacement manager a basic notification;
6. wait for the replacement manager to accept;
7. preserve historical assignment records;
8. end the old assignment;
9. create the new assignment;
10. save atomically;
11. return the authoritative membership and team state.

The transfer becomes effective immediately after acceptance and successful atomic save.

Open forms and in-progress browser state are not proactively changed when authority is removed. Any later submission must use current backend authorization and must fail safely if the former manager no longer has authority.

The replacement manager inherits authority over the team’s existing pending bids and trades.

---

## Multiple Team Assignments

One manager may control more than one team in the same league.

The interface must:

* clearly show which team is currently being acted for;
* require every write to identify the intended team;
* avoid applying one team’s cached state to another;
* prevent ambiguous “my team” assumptions when the user controls multiple teams.

The backend must authorize each team-specific action independently.

---

## Assignment Removal

A commissioner may remove a manager assignment.

Removing an assignment must immediately remove the user’s authority to perform new protected actions for that team.

The authenticated session itself remains active under Permissions.

Existing pending bids, trades, and other team records remain with the team rather than the former manager.

---

# Part 9 — Membership and League Access

## Membership Creation

Users may create accounts through the home-page sign-up form.

Account creation does not automatically create a league membership.

A commissioner invites a user to join the league and create or manage a team.

The user receives a basic notification.

Acceptance creates or activates the league membership and completes the associated team workflow.

---

## Membership Removal

A commissioner may remove an active or invited non-commissioner membership
from the assigned league after an explicit confirmation.

Removal:

* immediately ends the membership and any current team-manager assignment tied
  to it;
* does not sign the user out of the account or affect memberships in another
  league;
* does not delete the team, transactions, activity history, or other
  authoritative league records; and
* cannot remove the league's current commissioner membership or be used as a
  substitute for the separately protected commissioner-replacement workflow.

---

## Private League Access

Private league information requires:

* an authenticated user;
* an active membership in the requested league;
* any additional feature-specific permission.

A platform administrator also requires an active membership to view private league information.

---

## League Selection

An authenticated user participating in more than one league must be able to select the intended league.

League selection must:

* use stable league ID;
* display enough information to distinguish leagues;
* update all league-specific views;
* avoid leaking previously selected league data;
* fail clearly if access was removed.

The frontend must not treat selected league state as proof of permission.

---

## Inactive Membership

An inactive membership does not authorize private league access or league writes.

Changing a membership or role does not revoke the authenticated session, but the backend must reload current permission state for every protected action.

Only the league commissioner may reactivate an inactive league membership.

---

# Part 10 — Public League Roster Access

## Public Scope

Rosters from every league are public and read-only.

An unauthenticated visitor may not use public access to view:

* standings;
* matchup results;
* auctions or bids;
* trades;
* activity history;
* login or security-audit information;
* private league settings.

---

## Public Roster Fields

The public roster response exposes every read-only roster field, including:

* league name;
* team name;
* team colours;
* team logo;
* player name;
* player position;
* active, bench, injured-reserve, and prospect category;
* fantasy salary or AAV;
* contract years.

Public access does not make write controls, account data, security data, private settings, bids, trades, matchups, standings, or activity history public.

---

## Public League Discovery

Unauthenticated visitors may find an active league through:

* a public league directory;
* a direct public league link;

Inactive, deactivated, and archived leagues are not publicly discoverable.

Public league and team pages must instruct search engines not to index them.

---

## Public Read Safety

Opening a public roster must not:

* create a league;
* create a membership;
* select a default private league;
* refresh or normalize authoritative data through a hidden write;
* expose non-public league information.

---

# Part 11 — League Settings and Setup

## Initial Release Boundary

Commissioners may not change league settings in the initial release.

Platform administrators configure approved initial settings.

The initial release must not display unsupported settings as editable commissioner options.

---

## Required Setting Capability

The league setting model must be capable of representing approved values for:

* salary cap;
* active-roster limits;
* bench limit and salary eligibility;
* prospect rules;
* injured-reserve limit;
* contract-term and precision rules;
* retained-salary limits;
* buyout rules;
* transaction deadlines;
* scoring weights;
* matchup timing;
* league timezone.

In the initial release, every league uses the current approved values.

The values must still be stored in a league-scoped model so future updates can add deliberately approved options without redesigning league identity.

---

## Defaults and Templates

Every new league receives the current approved Hundo Leago baseline.

The initial release provides:

* no alternate templates;
* no custom setting selection;
* no commissioner setting options.

Future updates may add new options only after the related rules, product behaviour, and migration requirements are approved.

---

## Setting Changes

The product must distinguish:

* initial setup;
* correction of an incorrectly entered setting before activation;
* an approved future-season rule change;
* a prohibited active-season rule change.

The administrator interface and API Contracts must implement these distinctions without exposing alternate league settings in the initial release.

---

# Part 12 — User-Interface Requirements

## Platform Administrator Interface

The administrator interface must provide:

* league creation;
* league identity and lifecycle display;
* commissioner assignment and replacement;
* initial approved settings;
* league deactivation;
* league deletion with `Are you sure?` confirmation;
* clear warnings for destructive or wide-reaching actions;
* authoritative success and error results.

The interface must not expose private league data unless the administrator has an active membership in that league.

---

## Commissioner Interface

The commissioner interface must provide, for the assigned league:

* team creation;
* team profile administration;
* team deactivation and removal controls;
* manager assignment, transfer, and removal;
* clear separation between commissioner and manager actions;
* no editable league settings in the initial release.

Commissioner controls must not appear to grant authority in another league.

---

## Manager Interface

For every assigned team, the manager interface must provide:

* clear team identity;
* team-name editing;
* team-colour editing;
* team-logo editing;
* a clear team switcher when the manager controls multiple teams;
* understandable permission and validation errors.

Changing the selected team must not change another team’s state.

---

## Public Interface

The public interface must:

* provide read-only roster access;
* make the current league and team unambiguous;
* display only approved public fields;
* avoid controls that imply unauthenticated write access;
* handle missing, inactive, or unavailable leagues safely.

---

## Loading and Error States

Every league and team workflow must distinguish:

* loading;
* success;
* empty state;
* validation failure;
* unauthenticated access;
* unauthorized access;
* record not found;
* network failure;
* backend failure.

A failed write must not appear successful.

---

# Part 13 — Validation and Edge Cases

## Stable Identity

League and team writes must use stable IDs.

The system must not treat names as unique permanent identity.

Renames must preserve relationships and history.

---

## Cross-League Validation

The backend must reject:

* a commissioner from another league;
* a manager assignment connecting a user and team through different leagues;
* a team created under the wrong league;
* a membership attached to a nonexistent league;
* a team asset from another league;
* a request combining IDs from multiple leagues.

---

## Concurrent Changes

The product and technical specifications must handle:

* two administrators attempting to replace a commissioner;
* two commissioner actions assigning different managers to one team;
* a manager editing a team while the assignment is removed;
* a team rename during another team-specific transaction;
* league deactivation during a pending write;
* retries after a timeout.

No race may create multiple active commissioners or multiple active managers for one team.

---

## In-Progress Transactions

Removing or transferring a manager must not silently change ownership of:

* pending bids;
* pending trades;
* roster state;
* contracts;
* draft assets.

Those records belong to the team and league, not the former manager.

The replacement manager inherits authority over the team’s existing pending bids, trades, and other team-owned actions.

---

## Inactive Records

Inactive leagues, memberships, and assignments must remain distinguishable from deleted records.

The system must not silently reactivate them merely because a related page is opened.

---

# Part 14 — Activity and Audit

## Required League and Team Activity

The applicable activity or administrative audit record must preserve:

* league creation;
* league rename;
* lifecycle changes;
* commissioner assignment or replacement;
* team creation;
* team rename;
* team deactivation or removal;
* manager assignment, transfer, or removal;
* administrative setting changes;
* league deletion or archival actions.

Ordinary manager edits to team colours and logos do not appear in league activity history.

---

## Actor Attribution

Activity must identify the authenticated actor.

Commissioner actions performed for a team must not appear to have been performed by the team manager.

Historical records must remain attributable after:

* a user changes display information;
* a league is renamed;
* a team is renamed;
* commissioner replacement;
* manager transfer.

---

# Part 15 — Commissioner and Administrator Controls

## Commissioner Controls

Commissioner controls must be limited to the assigned league.

Approved team-level commissioner controls include:

* create team;
* rename team;
* edit team colours and logo;
* deactivate team;
* remove team;
* assign manager;
* transfer manager assignment;
* remove manager assignment.

Team erase is available only during the approved off-season window and remains subject to platform-administrator approval.

---

## Administrator Controls

Approved platform-administrator controls include:

* create league;
* assign or replace commissioner;
* configure approved initial league information;
* deactivate league;
* delete league after explicit confirmation and safety checks.

Operating inside the league still requires an active membership.

---

## Confirmation

League deletion requires an `Are you sure?` confirmation.

Destructive or wide-reaching actions require platform-administrator approval.

Confirmation authority is:

* team erase: commissioner confirmation, followed by required platform-administrator approval;
* league deactivation: platform administrator;
* commissioner replacement: platform administrator, followed by replacement acceptance;
* manager transfer: commissioner, followed by replacement-manager acceptance.

---

# Part 16 — Testing Requirements

## Minimum Workflow Tests

At minimum, test:

* administrator creates a league successfully;
* non-administrator cannot create a league;
* duplicate creation request does not duplicate records;
* commissioner is attached to the correct league;
* a league cannot have two commissioners;
* commissioner authority does not cross leagues;
* commissioner creates, renames, deactivates, and removes a team according to approved consequences;
* one team cannot have two active managers;
* manager assignment transfers between users;
* one manager controls multiple teams without state leakage;
* manager edits only assigned teams;
* team rename preserves stable identity and related records;
* inactive membership loses private access;
* platform administrator without membership cannot view private league data;
* unauthenticated visitor can read approved roster fields;
* unauthenticated visitor cannot write or view private league information;
* league deletion requires the approved confirmation and authorization;
* read-only requests create no hidden writes.

---

## Multi-League Isolation Tests

Use at least two leagues with:

* different commissioners;
* different teams;
* different manager assignments;
* similarly named teams where useful;
* different league settings.

Verify that:

* league A records never appear in league B;
* actions in league A never change league B;
* commissioner A has no commissioner authority in league B;
* manager A cannot act for a team in league B;
* team-name similarity does not affect identity;
* Socket.IO updates are league-scoped.

---

## Accelerated and Failure Testing

Tests must be able to simulate:

* concurrent assignment attempts;
* retries and timeouts;
* membership removal;
* commissioner replacement;
* team deactivation;
* league deactivation;
* failed atomic saves.

Testing must not require modifying production data.

---

# Part 17 — Approval Checklist

Grae approved the original Season 2 Leagues and Teams product decisions on
2026-07-18 and the FAD-related amendments on 2026-07-27.

## Approved Foundation

- [x] Season 2 supports multiple independent leagues.
- [x] Every league-specific record belongs to exactly one league.
- [x] Only a platform administrator may create a league.
- [x] Public self-service league creation is not available in the initial release.
- [x] Each league has exactly one commissioner.
- [x] Only a platform administrator may assign or remove a commissioner.
- [x] A platform administrator needs an active membership to view or operate inside a league.
- [x] A commissioner may simultaneously manage a team.
- [x] Commissioners may add, rename, deactivate, and remove teams in their league.
- [x] Commissioners may assign and remove team managers.
- [x] Commissioners may not change league settings in the initial release.
- [x] Future commissioner setup options must be limited and may not change during an active season.
- [x] One team has one assigned manager at a time.
- [x] Team management may be transferred between users.
- [x] One manager may control more than one team in the same league.
- [x] Managers may edit assigned team names, colours, and logos.
- [x] Every league’s rosters are public and read-only.
- [x] League and team identity use stable IDs rather than names.
- [x] A platform administrator may deactivate or delete a league after an `Are you sure?` confirmation and administrator approval.
- [x] Destructive or wide-reaching actions require platform-administrator approval.

## League Creation

- [x] League name is the only required league field entered during initial creation.
- [x] League names are unique across the platform.
- [x] League names have no product-level length, character, or moderation restrictions.
- [x] League seasons are identified and displayed by year.
- [x] New leagues use `America/Vancouver`.
- [x] New leagues use the current approved fixed settings with no alternate options until future updates implement them.
- [x] Initial teams are created by users who accept commissioner invitations.
- [x] The selected commissioner must accept the assignment.
- [x] The commissioner records an informational trade-deadline date and time during setup.
- [x] The trade-deadline date and time triggers no automated event until a future update.
- [x] A league requires at least four teams and acceptance of every launch invitation before the commissioner may press `Start League`.

## League Lifecycle

- [x] Lifecycle states are `Setup`, `Active`, `Inactive`, `Completed`, `Deactivated`, and `Archived`.
- [x] Every lifecycle state may transition to every other lifecycle state through an authorized explicit action.
- [x] A deactivated league provides authenticated members with read-only private access.
- [x] A deactivated league has no public roster visibility.
- [x] Scheduled jobs and pending transactions are disabled while a league is deactivated.
- [x] A production league may be permanently deleted.
- [x] Permanent league deletion is unrecoverable and provides no deleted-league recovery in the initial release.

## Commissioner Assignment

- [x] A replacement commissioner must accept the assignment.
- [x] Commissioner replacement atomically removes the former commissioner and assigns the replacement after acceptance.
- [x] If the commissioner account or membership becomes inactive, the system automatically reassigns the role to another active manager in the league.
- [x] Commissioner assignment and replacement use a basic notification.

## Teams

- [x] A league has a minimum of `4` teams.
- [x] A league has a maximum of `20` teams.
- [x] An even number of teams is not required.
- [x] A team may exist temporarily without a manager during setup.
- [x] Team names must be unique within their league.
- [x] Team names have a maximum of `35` characters and no additional product-level character or moderation rules.
- [x] Each team selects an approved pattern template whose fixed definition requires two or three colours.
- [x] The template catalog retains the two- and three-stripe even splits and does not duplicate equivalent hockey stripe arrangements.
- [x] Team colours have no product-level contrast or uniqueness requirement; the interface adds its own neutral identity treatment for readability.
- [x] Team logos have no product-level file-type, size, dimension, cropping, or fallback requirements.
- [x] In a season with an Entry Draft, normal team creation closes when Entry Draft setup confirmation freezes participating teams; on a no-draft path it closes when the automatic all-or-none readiness transition opens Candidate Cards.
- [x] Team deactivation permanently erases the team only after Entry Draft completion, or an approved no-draft transition, and before the automatic all-or-none readiness transition opens Candidate Cards.
- [x] The final participating team set freezes when Candidate Cards open; normal team creation has already closed, and erasure and deactivation then remain unavailable through the live season.
- [x] There is no distinction between team deactivation, removal from competition, and permanent deletion.
- [x] Team-bound players, contracts, cap obligations, draft assets, pending transactions, matchups, standings, and history are erased; rostered players become free agents.

## Manager Assignment

- [x] A manager must accept an initial assignment.
- [x] A replacement manager must accept a transfer.
- [x] A manager transfer becomes effective immediately after acceptance and atomic save.
- [x] Assignments and transfers use a basic notification.
- [x] Open forms and in-progress browser state are not proactively changed when authority is removed.
- [x] A newly assigned manager inherits authority over the team’s existing pending bids and trades.
- [x] The commissioner may reactivate an inactive league membership.

## Public Rosters

- [x] Public rosters show every read-only roster field.
- [x] Public rosters show salaries, AAV, and contract years.
- [x] Public rosters show active, bench, injured-reserve, and prospect categories.
- [x] Public visitors may find leagues through both a directory and direct links.
- [x] Inactive, deactivated, and archived leagues are not publicly discoverable.
- [x] Public league and team pages may not be indexed by search engines.

## Activity and Confirmation

- [x] Ordinary manager edits to team colours and logos do not appear in league activity history.
- [x] Team erase requires commissioner confirmation and the platform-administrator approval required for destructive actions.
- [x] League deactivation requires platform-administrator confirmation.
- [x] Commissioner replacement requires platform-administrator confirmation and replacement acceptance.
- [x] Manager transfer requires commissioner confirmation and replacement-manager acceptance.

## Approval

- [x] Remaining implementation details are assigned to the appropriate product and technical specifications.
- [x] Grae approves this document as the Season 2 Leagues and Teams product specification.
- [x] Document status is `APPROVED`.

---

## Definition of Done

The rule-approval phase for this product specification is complete because:

* Grae approved or revised every material product decision;
* no unchecked workflow is presented as final behaviour;
* league creation has an unambiguous normal workflow;
* league lifecycle and deletion behaviour are explicit;
* commissioner assignment and replacement are defined;
* team creation, profile editing, erasure, and manager assignment are defined;
* public roster fields and discovery are defined;
* user-interface expectations and failure states are clear.

The planned Data Model, API Contracts, user-interface, testing, and operations documents must implement these approved workflows without relying on old chat history or single-league assumptions.

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
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/STANDINGS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/FREE_AGENT_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/07-testing/TESTING_STRATEGY.md
docs/08-operations/PRODUCTION_RUNBOOK.md
docs/10-decisions/DECISION_LOG.md
```
