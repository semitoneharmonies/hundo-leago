# Hundo Leago — Operating Mode

## Current Mode

`OFFSEASON_RESET`

## Effective Date

2026-07-14

## Purpose

This document defines the current operating condition of Hundo Leago.

The operating mode determines:

* how much development risk is acceptable;
* whether temporary instability is permitted;
* which production data must be preserved;
* which records may be intentionally reset;
* what safeguards Codex and contributors must follow.

An inactive league does not automatically mean that production data is disposable.

Codex must use the operating mode recorded in this document. It must not infer the mode from the date, hockey calendar, application traffic, or previous conversations.

---

## Available Operating Modes

### `IN_SEASON`

The fantasy season is actively operating.

#### Development policy

* Stability takes priority over new features.
* Changes should be small, targeted, and reversible.
* Major architectural changes should normally wait until the off-season.
* Established league behaviour must not change unexpectedly.
* Production fixes require verification and a rollback path.
* Database migrations require a verified backup and staging test.
* Read-only endpoints must remain read-only.

#### Data policy

All production data must be preserved unless Grae explicitly authorizes a specific correction.

---

### `OFFSEASON_PRESERVE`

The fantasy season is inactive, but league information must carry into the next season.

Examples of information that may need to survive include:

* users;
* leagues;
* memberships;
* teams;
* player ownership;
* contracts;
* retained salary;
* buyout penalties;
* draft picks;
* player rights;
* league configuration;
* historical records.

#### Development policy

* Larger refactors and migrations are permitted.
* Temporary instability is acceptable in local development or staging.
* Production should not be intentionally left broken.
* Major changes require an approved technical specification and work plan.
* Migrations must be tested against a copy of production data.
* Record totals and important values must be compared before and after migration.

#### Data policy

Production data is not disposable.

A verified season-end snapshot must be created before major structural work.

---

### `OFFSEASON_RESET`

The fantasy season is inactive, and selected seasonal league information is intentionally being reset before the next season.

#### Development policy

* Major coordinated changes are permitted when documented and planned.
* Larger refactors may be completed during the off-season.
* Temporary breakage is acceptable in local development, feature branches, and staging.
* Production should not be intentionally left broken.
* A backup or rollback point is required before destructive production work.
* Codex may reset only records explicitly listed as resettable.
* Unlisted records must be treated as protected.

#### Data policy

Some league records may be reset, but the entire system is not disposable.

---

### `DEVELOPMENT_TEST`

The application is running locally or in staging using disposable test data.

#### Development policy

* Destructive testing is permitted.
* Test data may be repeatedly created, edited, migrated, and reset.
* Matchup weeks and scheduled jobs may be simulated or accelerated.
* Test clocks may be used.
* Large changes may be tested before production deployment.

#### Data policy

This mode must never use production storage, production databases, or the production persistent disk.

---

## Current Situation

Hundo Leago is currently in the 2026 off-season.

The league is not actively being used by managers.

A clean league reset is planned before the 2026–27 season. Major work planned during this period includes:

* documentation consolidation;
* backend refactoring;
* SQLite migration;
* user accounts and authentication;
* multi-league support;
* league and team administration;
* contract-system improvements;
* matchup and standings improvements;
* staging and testing infrastructure.

Temporary instability is permitted only outside production.

Production deployment must still follow documented verification and release procedures.

---

## Records Approved for Reset Before the 2026–27 Season

The following existing Season 1 league records may be reset when the approved reset procedure is performed:

* existing league teams;
* existing rosters;
* existing contracts;
* existing retained-salary records;
* existing buyout records;
* existing trades;
* existing auction history;
* existing matchup results;
* existing standings;
* other Season 1 competition records explicitly included in the approved reset plan.

This list authorizes a future controlled reset. It does not authorize Codex to reset these records during unrelated development work.

---

## Protected Information

The following must remain protected unless Grae explicitly approves a specific change:

* player records and stable player identifiers;
* application source code;
* Git history;
* environment variables and secrets;
* Render and Netlify deployment configuration;
* persistent-disk backups;
* documentation;
* migration tools;
* production recovery information;
* new user-account records created for the 2026–27 system;
* any data not explicitly included in the approved reset list.

---

## Required Safeguards

Every major structural change must include:

1. A documented objective and scope.
2. Identification of affected files and data.
3. A backup or rollback point.
4. Testing outside production.
5. Verification commands or requests.
6. A summary of changed files and behaviour.
7. Confirmation that protected data was not unintentionally modified.
8. Documentation updates when approved behaviour changes.

A code change being permitted during the off-season does not mean it should be performed as one uncontrolled rewrite.

Large work should still be divided into understandable and verifiable steps.

---

## Authority

Only Grae may approve:

* a change to the current operating mode;
* additions to the resettable-data list;
* destructive production operations;
* the start of the production season;
* the transition into `IN_SEASON`.

Codex must not edit this document unless Grae explicitly requests a change to the operating mode or its policies.

When this document conflicts with a task prompt, Codex must stop and report the conflict rather than silently bypassing the documented safeguards.
