# Hundo Leago - Commissioner Tools

## Document Status

`APPROVED`

This product specification consolidates:

* approved league-scoped commissioner authority;
* approved correction, freeze, activity, and platform-administrator boundaries;
* feature-specific commissioner controls already approved elsewhere;
* current implementation limitations;
* the approved unified commissioner operations and recovery workflow.

Grae approved this specification on 2026-07-18.

---

## Product Purpose

Hundo Leago needs one safe commissioner workspace for operating and recovering a league without direct production JSON, database, or code editing.

This specification defines:

* access to commissioner tools;
* the actions available in each feature;
* ordinary commissioner actions and corrections;
* confirmation, preview, validation, and history;
* league freezes and operational health;
* backup and restoration requests;
* platform-administrator escalation;
* failure handling and testing.

Commissioner authority must be powerful enough to operate the league while remaining explicit, attributable, validated, and league-scoped.

---

## Out of Scope

This document does not define:

* unrestricted JSON, SQL, or file editing;
* platform-wide user-account or password administration;
* league creation, deletion, or commissioner assignment details already owned by other specifications;
* changing league settings in the initial release;
* exact database tables;
* exact API routes or payloads;
* infrastructure-shell access;
* hidden impersonation of managers;
* a generic undo that can reverse any operation.

---

# Part 1 - Product Authority

## Source Documents

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/STANDINGS.md
docs/03-product-specs/ENTRY_DRAFT.md
```

Each feature specification remains authoritative for that feature's business rules.

Commissioner Tools exposes approved actions; it does not create a second version of those rules.

---

## Current Implementation

The current application has a commissioner panel and existing recovery controls, including roster and league adjustments and snapshots.

The panel contains outdated or redundant controls and was built around the original single-league implementation.

Current controls are implementation evidence only. Season 2 requires backend-enforced membership, role, league isolation, safer recovery, and clearer history.

---

## Backend Authority

The backend is authoritative for:

* authenticated actor identity;
* active league membership and commissioner role;
* league and season scope;
* action availability;
* validation and current record versions;
* affected-record previews;
* atomic writes;
* activity, audit, correction, and operational records;
* freeze and recovery status.

The frontend must not grant commissioner authority from a displayed role or team selection.

---

# Part 2 - Approved Permission Boundary

## One Commissioner Per League

Each league has exactly one commissioner.

The commissioner:

* must have an active membership in the league;
* may also manage a team;
* has authority only inside the assigned league;
* is not automatically the manager of every team;
* cannot assign or remove the league commissioner;
* cannot change league settings in the initial release.

Only a platform administrator may assign or remove a commissioner.

---

## Platform Administrator

A platform administrator may perform commissioner actions without taking the commissioner role only when the administrator has an explicit active membership in the affected league.

Platform-administrator-only actions include:

* creating, deactivating, and deleting leagues;
* assigning or removing commissioners;
* approving a team erase;
* approving backup or season-snapshot restoration;
* platform-level recovery not delegated to a commissioner.

Platform authority must remain attributable and may not become hidden cross-league access.

---

## Team Manager

A manager cannot enter the commissioner workspace or call commissioner write operations unless that user separately holds commissioner authority.

When one user is both manager and commissioner, the interface and backend must preserve which authority was used.

---

## Public Viewer

Commissioner tools, operational health, corrections, snapshots, and private league data are unavailable to unauthenticated visitors.

---

# Part 3 - Approved Commissioner Actions

## League and Team Administration

Within the assigned league, a commissioner may:

* add, rename, and permanently erase teams through the approved workflows;
* assign and remove team managers;
* transfer team management;
* reactivate an inactive league membership;
* edit a team's approved profile fields.

Team erase may occur only after the Entry Draft and before the future Free Agent Draft. It requires commissioner confirmation followed by platform-administrator approval.

---

## Rosters

A commissioner may:

* perform ordinary roster moves for any team;
* correct roster category or ownership;
* correct a player's Hundo Leago position when source data is missing or wrong;
* override injured-reserve eligibility;
* make an explicit prospect-right correction;
* save an illegal roster after the same illegality flag and confirmation used by manager workflows.

A commissioner roster correction uses the same slot, position, cap, and ownership calculations as a normal roster action.

It does not change a matchup snapshot unless the commissioner uses the separate Matchups correction workflow.

---

## Contracts and Cap Obligations

A commissioner may:

* execute an approved buyout for a team;
* correct contract value, term, AAV, owner, and state;
* correct retained-salary records;
* correct buyout-penalty records;
* recover a failed atomic contract or cap operation.

Corrections must preserve contract history and may not silently rewrite dependent trades or activity.

---

## Auctions

A commissioner may:

* submit, edit, and remove an auction bid for a team;
* manually trigger or recover an auction resolution;
* remove an invalid bid through an explicit action;
* inspect auction status and failure information.

Commissioner authority does not reveal competing active bid values or terms.

---

## Trades

A commissioner may:

* propose, accept, reject, and cancel a trade for any team;
* complete an explicit commissioner trade action for both sides;
* reverse a completed trade when every affected asset remains in the exact recoverable state;
* route an unsafe reversal to an explicit correction workflow.

The commissioner actor and authority must remain visible. The action must not appear to have been performed by the affected team's manager.

---

## Entry Draft

A commissioner may:

* configure the assigned league's Entry Draft;
* make a selection for any team;
* start, pause, resume, and complete the draft;
* manage pre-draft setup, lottery, order, timing, and technical recovery;
* rely on automatic timeout selections because the Entry Draft has no skipped picks;
* preserve every completed Entry Draft selection without undo or replacement.

The detailed workflow is defined in `ENTRY_DRAFT.md`.

---

## Matchups

A commissioner may:

* preview and adjust the generated schedule;
* correct pairings and week timestamps;
* repair locks and scoring baselines;
* review data discrepancies;
* approve or reject corrected results;
* recover finalization and rollover.

Matchup actions never create League Activity entries. They remain attributable through matchup result, correction, and operational records.

---

## Standings

A commissioner may:

* inspect source-result and completeness health;
* preview and run an explicit standings rebuild;
* recover a failed derived-standings update.

A commissioner may not directly type replacement GP, W, L, T, PTS, PCT, PF, PA, DIFF, or rank.

Standings actions never create League Activity entries. They remain attributable through standings rebuild or correction records.

---

## League Freeze

A commissioner may freeze or reopen manager actions in the assigned league.

During a freeze:

* manager write operations are blocked;
* commissioner and authorized platform-administrator actions remain available under normal validation;
* read-only access remains available;
* the interface clearly shows the freeze;
* merely opening or refreshing a page does not change the freeze.

---

## Backup or Snapshot Restoration

A commissioner may initiate a backup or season-snapshot restoration request.

Restoration may proceed only after platform-administrator approval.

Initiating a request does not itself restore data.

---

# Part 4 - Commissioner Workspace

## Navigation

The Commissioner workspace has these sections:

* Overview;
* Teams and Managers;
* Rosters;
* Contracts and Cap;
* Auctions;
* Trades;
* Entry Draft;
* Matchups;
* Standings;
* League Activity;
* Operations and Recovery.

Only sections relevant to an available league feature are shown.

## League Context

The workspace always shows:

* league name and stable league ID context;
* current season;
* league lifecycle state;
* current commissioner identity;
* freeze state;
* active operational warning count.

A user who commissions more than one league must deliberately select a league before acting.

The backend revalidates league scope on every request.

---

## Overview

The Overview shows:

* roster legality counts;
* active auction and trade counts without hidden competing bid values;
* current draft status;
* current matchup week and finalization state;
* standings completeness;
* failed or delayed job count;
* current freeze state;
* pending administrator approvals;
* recent commissioner actions.

The Overview is read-only and must not repair state while loading.

---

## Search and Filtering

The workspace supports searching or filtering by:

* team;
* user;
* player;
* contract;
* auction;
* trade;
* draft pick or selection;
* matchup week;
* action type;
* date range;
* success, failure, pending, or correction-required state.

Search is read-only.

---

# Part 5 - Proposed Action Model

## Ordinary Action and Correction

The interface distinguishes:

* `Commissioner action`: performing an approved normal feature operation for a team or league;
* `Correction`: repairing an incorrect or failed state;
* `Administrator request`: asking a platform administrator to approve a protected operation.

The backend stores the action type and actor authority used.

## No Impersonation

A commissioner never signs in as, posts as, or silently impersonates a manager.

When acting for a team:

* the commissioner remains the actor;
* the affected team is separately identified;
* activity says the commissioner acted for the team;
* notifications identify the action as commissioner-made.

---

## Preview

The correction workflow requires a read-only preview showing:

* requested action;
* affected league, season, teams, users, and records;
* current values;
* proposed values;
* dependent records;
* validation warnings;
* whether the resulting roster or state is illegal;
* whether platform-administrator approval is required.

Preview creates no mutation or reserved state.

---

## Confirmation

The confirmation levels are:

* ordinary commissioner action: one explicit confirmation;
* multi-record correction: preview plus explicit confirmation;
* destructive or restoration action: typed confirmation plus platform-administrator approval;
* read-only inspection: no confirmation.

The typed phrase contains the league name and action type.

These confirmation levels require approval.

---

## Optional Reason

No commissioner action requires a written reason.

The interface may accept an optional reason and preserve it in the applicable activity, correction, or operational record.

---

## Atomic Save

Every multi-record commissioner write must either:

* save the complete valid result; or
* save nothing.

No correction may leave a partial trade, contract, roster, draft, matchup, standings, or ownership state.

---

## Idempotency and Stale Data

The write model requires:

* an idempotency key for retryable protected operations;
* the current record or aggregate version;
* server-side revalidation immediately before save;
* a conflict response containing the authoritative current state.

A retry must not repeat a completed correction or protected action.

---

## Result

After a successful action, the interface shows:

* success state;
* authoritative resulting values;
* affected records;
* activity or correction reference;
* any remaining warning;
* safe next action.

A failed action clearly says that no state changed, unless the authoritative response identifies an earlier successful retry.

---

# Part 6 - Proposed Correction Records

Every commissioner correction preserves:

* correction ID;
* league and season;
* feature and action type;
* commissioner user ID;
* commissioner role and membership used;
* affected team and record IDs;
* before values;
* requested after values;
* authoritative after values;
* optional reason;
* warnings and confirmations;
* related activity, result, trade, draft, snapshot, or job IDs;
* timestamp and outcome.

Feature-specific history may store the record, but the correction must remain searchable from Commissioner Tools.

---

# Part 7 - Proposed League Freeze Workflow

## Starting a Freeze

The workflow is:

1. The commissioner opens Operations and Recovery.
2. The interface previews the manager actions that will be blocked.
3. The commissioner enters an optional public message and optional expected end time.
4. The commissioner confirms.
5. The backend revalidates authority and atomically activates the freeze.
6. Open clients receive the authoritative freeze state.

No platform-administrator approval is required for a league freeze.

---

## Freeze Effect

The freeze blocks new manager writes and manager attempts to act on already-open forms.

It does not automatically:

* cancel active auctions;
* cancel or expire trades;
* change rosters;
* change matchup snapshots;
* stop read-only pages;
* stop commissioner writes;
* stop scheduled jobs.

Each scheduled operation continues or pauses according to its own approved feature rules.

## Reopening

Reopening requires explicit commissioner confirmation.

The backend removes the freeze atomically, clients receive the new state, and manager writes become available under their normal feature rules.

The system does not replay writes rejected during the freeze.

---

# Part 8 - Proposed Operations and Recovery

## Health View

The health view shows:

* scheduled job name and feature;
* last successful run;
* last attempted run;
* next expected run;
* current status;
* retry count;
* plain-language error summary;
* affected league, season, week, auction, or other record;
* available approved recovery action.

Sensitive infrastructure secrets, tokens, and raw stack traces are not shown.

---

## Recovery Actions

Recovery controls are feature-specific.

Examples include:

* retry auction resolution;
* retry matchup finalization;
* retry standings rebuild;
* resume a paused Entry Draft;
* repair an incomplete atomic operation from its durable recovery marker;
* request snapshot restoration.

There is no generic `Fix Everything` button.

---

## Manual Retry

The manual retry:

* uses the same idempotent operation as the scheduled job;
* shows current state and expected effect;
* requires confirmation;
* does not create duplicate results;
* records the commissioner-triggered attempt;
* returns the authoritative outcome.

---

## Backup Creation

The commissioner may request an immediate league backup or season snapshot.

Backup creation:

* is league-scoped;
* does not require platform-administrator approval;
* records who requested it;
* reports success or failure;
* does not expose raw production storage paths.

## Restoration Request

The restoration workflow is:

1. the commissioner selects an eligible backup or season snapshot;
2. the system shows its league, season, creation time, contents, and validation status;
3. the commissioner previews records that would change;
4. the commissioner enters the typed confirmation;
5. the request becomes `Awaiting Administrator Approval`;
6. a platform administrator with active league membership reviews the same preview;
7. the administrator approves or rejects;
8. approval activates a league freeze and creates a fresh pre-restore backup;
9. restoration runs atomically;
10. validation completes before the league reopens;
11. the operation preserves complete administrative and recovery records.

## Failed Restoration

A failed restoration:

* keeps the league frozen;
* reports that restoration did not complete;
* preserves the pre-restore state or restores it atomically;
* creates no mixed old-and-new state;
* requires platform-administrator review before reopening.

---

# Part 9 - Activity, Audit, and Notifications

## League Activity

Commissioner actions appear in League Activity when the corresponding ordinary feature action or correction belongs there.

League Activity identifies:

* commissioner actor;
* affected team or league;
* action;
* result;
* timestamp;
* optional reason when supplied.

Matchup-only and standings-only actions never enter League Activity.

---

## Administrative and Operational Records

The following use protected administrative or operational history rather than ordinary League Activity:

* commissioner assignment and replacement;
* league deactivation or deletion;
* team-erase approval;
* freeze and reopen;
* backup and restoration;
* failed and retried scheduled operations;
* permissions denials and security-relevant events.

The exact record storage belongs in the technical specifications.

---

## Notifications

The initial release sends in-app notifications for:

* manager assignment or removal;
* a commissioner action performed for a team;
* league freeze or reopen;
* Entry Draft operational events defined in its specification;
* an administrator approval request and decision;
* a team-affecting correction.

Email and push are deferred unless another approved feature specification says otherwise.

The event list and channels require approval.

---

# Part 10 - Safety and Failure Handling

Commissioner Tools must never:

* expose raw active competing auction bids;
* expose passwords, sessions, tokens, or secrets;
* provide unrestricted JSON, SQL, filesystem, or shell editing;
* mutate data from a read-only view;
* bypass league isolation;
* save partial multi-record changes;
* hide the commissioner actor behind a manager;
* silently repair state on page load;
* silently change league settings;
* silently change matchup or standings history;
* automatically approve a protected administrator request.

Every write must verify:

* authenticated actor;
* active membership and role;
* league and season;
* feature-specific authority;
* current record versions;
* required confirmations or approvals;
* complete resulting validity.

---

# Part 11 - Required Testing

Tests must cover:

* commissioner, commissioner-manager, manager, administrator, public, and cross-league access;
* inactive membership and replaced commissioner;
* every approved feature action;
* clear actor and affected-team identity;
* competing-bid blindness;
* read-only Overview, search, preview, health, and history;
* ordinary action, correction, and administrator-request classification;
* optional reasons;
* confirmation levels;
* stale records and simultaneous corrections;
* retries, double-clicks, and idempotency;
* atomic multi-record success and rollback;
* legal and warned-illegal roster results;
* safe and unsafe trade reversal;
* matchup and standings history separation;
* freeze, reopen, open forms, and rejected writes;
* scheduled operations during a freeze;
* manual job retry and duplicate prevention;
* backup request, restoration approval, rejection, success, and failure;
* team erase and league destructive-action boundaries;
* notification delivery;
* secret and raw-data protection;
* proof that every read-only endpoint remains read-only.

---

# Part 12 - Approval Checklist

## Inherited Approved Rules

- [x] Each league has exactly one commissioner.
- [x] Commissioner authority requires an active membership and is limited to the assigned league.
- [x] A commissioner may also manage a team.
- [x] Commissioner and manager authority remain distinguishable.
- [x] Only a platform administrator may assign or remove a commissioner.
- [x] A platform administrator needs an active league membership to operate inside a league.
- [x] Commissioners may not change league settings in the initial release.
- [x] Commissioners may administer teams and manager assignments within approved boundaries.
- [x] Team erase is allowed only after the Entry Draft and before the future Free Agent Draft.
- [x] Team erase requires commissioner confirmation and platform-administrator approval.
- [x] Commissioners may perform ordinary roster moves and approved roster corrections for any team.
- [x] Commissioner roster corrections use normal slot, position, cap, and ownership rules.
- [x] Commissioners may execute buyouts and correct contracts, retentions, and buyout penalties.
- [x] Commissioners may submit, edit, remove, and manually resolve auction bids.
- [x] Commissioners cannot view competing active bid values or terms.
- [x] Commissioners may propose, accept, reject, cancel, complete, safely reverse, and correct trades.
- [x] Commissioners may make Entry Draft selections for any team.
- [x] Commissioners may manage matchup schedules, locks, baselines, results, finalization, and rollover recovery.
- [x] Commissioners may inspect and rebuild standings but cannot directly edit standings-row values.
- [x] Matchup-only and standings-only operations never enter League Activity.
- [x] Commissioners may freeze or reopen manager actions.
- [x] Authorized commissioner and administrator actions remain available during a freeze.
- [x] A commissioner may initiate restoration, but restoration requires platform-administrator approval.
- [x] No commissioner action requires a written reason.
- [x] A provided optional reason may be preserved.
- [x] Every correction identifies actor, league, affected records, before and after state, and resulting validation.
- [x] Multi-record corrections save atomically.
- [x] Read-only views never trigger commissioner corrections.
- [x] Commissioners do not receive unrestricted production-data editing.

## Approved Commissioner Tools Decisions

- [x] Commissioner Tools uses one workspace with Overview, feature, history, and Operations and Recovery sections.
- [x] Unavailable feature sections are hidden.
- [x] The workspace always shows league, season, lifecycle, commissioner, freeze, and warning context.
- [x] A commissioner of multiple leagues must deliberately select a league before acting.
- [x] Overview shows legality, transaction, draft, matchup, standings, job, freeze, approval, and recent-action summaries.
- [x] Overview and all search/filter operations are strictly read-only.
- [x] Search supports team, user, player, contract, auction, trade, draft, matchup, action, date, and outcome filters.
- [x] The interface classifies writes as `Commissioner action`, `Correction`, or `Administrator request`.
- [x] Commissioners never impersonate managers; every action preserves the commissioner as actor.
- [x] Team-affecting notifications identify that the commissioner performed the action.
- [x] Every correction has a read-only affected-record and before/after preview.
- [x] Preview reserves no state and performs no mutation.
- [x] Ordinary commissioner actions require one explicit confirmation.
- [x] Multi-record corrections require preview and explicit confirmation.
- [x] Destructive and restoration actions require a typed league-and-action confirmation plus administrator approval.
- [x] Read-only inspection requires no confirmation.
- [x] Retryable protected writes use idempotency keys and current record versions.
- [x] Stale writes fail with the authoritative current state rather than overwriting newer work.
- [x] Successful results show authoritative values, affected records, history references, warnings, and safe next actions.
- [x] Correction records remain searchable from Commissioner Tools even when detailed history belongs to another feature.
- [x] A league freeze accepts an optional public message and expected end time.
- [x] Starting and ending a league freeze requires commissioner confirmation but not administrator approval.
- [x] A freeze blocks new manager writes and submissions from already-open manager forms.
- [x] A freeze does not cancel auctions, trades, rosters, snapshots, or read-only access.
- [x] Scheduled operations continue or pause according to their feature rules rather than one global freeze rule.
- [x] Reopening never replays writes rejected during the freeze.
- [x] Operations health shows last success, last attempt, next run, status, retry count, plain error, scope, and recovery control.
- [x] Health views exclude secrets, raw tokens, and raw stack traces.
- [x] Recovery controls are feature-specific; there is no generic unrestricted repair control.
- [x] A manual retry uses the same idempotent operation as the scheduled job.
- [x] A commissioner may create an immediate league backup or season snapshot without administrator approval.
- [x] Backup creation is league-scoped, attributable, and hides raw storage paths.
- [x] Restoration selection shows snapshot identity, scope, contents, validation, and affected-record preview.
- [x] Restoration becomes `Awaiting Administrator Approval` after commissioner confirmation.
- [x] The approving administrator must have active membership in the league.
- [x] Approved restoration automatically freezes the league and creates a fresh pre-restore backup.
- [x] Restoration is atomic and the league reopens only after validation.
- [x] Failed restoration keeps the league frozen and cannot leave mixed state.
- [x] Freeze, reopen, backups, restorations, job failures, and permission denials use protected administrative or operational history.
- [x] Initial Commissioner Tools notifications are in-app only.
- [x] Notifications cover manager assignment, commissioner team action, freeze, reopen, approval requests and decisions, and team-affecting corrections.
- [x] Commissioner Tools exposes no raw JSON, SQL, filesystem, shell, password, session, token, or secret controls.
- [x] No read-only Commissioner Tools request creates, repairs, retries, or otherwise mutates state.
- [x] Grae approved this document as the Season 2 Commissioner Tools product specification.
- [x] Document status is `APPROVED`.

---

# Definition of Done

The rule-approval phase is complete.

Implementation is complete only when feature permissions, actor attribution, previews, confirmation, atomicity, activity separation, freezes, health, recovery, backup, restoration, notifications, league isolation, concurrency, security, and read-only-boundary tests pass.

---

# Related Documents

```text
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/STANDINGS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/06-operations/BACKUP_AND_RESTORE.md
docs/07-testing/TESTING_STRATEGY.md
```
