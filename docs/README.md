# Hundo Leago Documentation

## Purpose

This directory contains the canonical documentation for the Hundo Leago project.

The documentation is shared by both repositories:

* `hundo-leago` — React and Vite frontend;
* `hundo-leago-backend` — Node.js and Express backend.

The canonical documents live in the frontend repository so there is only one approved copy of each shared project rule.

Codex and contributors should use this index to find the documents relevant to a task.

Do not rely on old chat history, memory, archived files, or assumptions when an approved document exists.

---

# Quick Start

Before planning a meaningful change:

1. Read the applicable repository’s `AGENTS.md`.
2. Read this documentation index.
3. Read the project foundation documents required by the task.
4. Read the relevant league rules.
5. Read the relevant product specification.
6. Read the relevant technical specification.
7. Inspect the existing code and tests.
8. Make the smallest safe change that satisfies the approved task.
9. Run the required verification.
10. Report changed files, results, risks, and documentation effects.

Codex should not read every project document for every task.

Use the routing guidance in this file to load only the relevant context.

---

# Document Authority

When approved documents conflict, use the following authority order:

1. Production and data-safety requirements
2. Current operating mode
3. Approved league and scoring rules
4. Approved product specifications
5. Approved technical specifications
6. Current project scope
7. North Star
8. Active roadmap
9. Active work plan
10. Existing code
11. Known issues
12. Future backlog
13. Ideas and archived documents

Existing code is evidence of current implementation, but it is not automatically proof of approved behaviour.

Old or archived documents must not override active canonical documents.

When two authoritative documents contradict one another:

1. Stop before changing dependent behaviour.
2. Identify the exact documents and conflicting statements.
3. Explain how the conflict affects the task.
4. Ask Grae to approve the correct rule.
5. Update the documentation before continuing implementation.

Do not silently choose the easiest rule to implement.

---

# Project Foundation

Directory:

```text
docs/01-project/
```

These documents describe the overall product, present condition, approved scope, operating safety, and terminology.

## North Star

Path:

```text
docs/01-project/NORTH_STAR.md
```

Defines:

* what Hundo Leago is;
* the product’s identity;
* the product-season direction;
* Season 2’s broad capabilities;
* non-negotiable principles;
* long-term product direction.

Read when:

* beginning a new major feature;
* making an architectural decision;
* evaluating whether work fits the product;
* writing a new product or technical specification.

Do not use the North Star as the source for exact league formulas or implementation steps.

## Current State

Path:

```text
docs/01-project/CURRENT_STATE.md
```

Defines:

* what is currently implemented;
* current repositories and hosting;
* existing features;
* incomplete systems;
* known technical limitations;
* current development branches and risks.

Read when:

* beginning work in an unfamiliar area;
* planning a migration or refactor;
* determining whether a feature already exists;
* comparing planned behaviour with current behaviour.

Update when a major milestone materially changes the actual implementation.

## Project Scope

Path:

```text
docs/01-project/PROJECT_SCOPE.md
```

Defines:

* launch-critical Season 2 work;
* work required later during the season;
* optional work;
* explicitly deferred work;
* rules preventing uncontrolled feature expansion.

Read when:

* deciding whether work is currently approved;
* planning the active roadmap;
* considering extra features adjacent to a task;
* reviewing whether a change is required for launch.

Codex must not implement deferred or optional features merely because they seem useful.

## Operating Mode

Path:

```text
docs/01-project/OPERATING_MODE.md
```

Defines:

* whether the project is in-season or off-season;
* acceptable development risk;
* production-data preservation requirements;
* resettable records;
* protected records;
* destructive-operation authority.

Read before:

* database work;
* production deployment;
* data migration;
* reset operations;
* major refactors;
* backup or restoration work;
* any task that could modify persistent data.

Never infer the operating mode from the date.

## Glossary

Path:

```text
docs/01-project/GLOSSARY.md
```

Defines canonical project terminology.

Read when:

* designing database tables;
* defining APIs;
* writing product specifications;
* writing technical specifications;
* a task uses ambiguous project language;
* terms such as membership, season, roster, contract, lock, snapshot, or rollover affect implementation.

The Glossary does not need to be read in full for every small task.

Use it when terminology affects correctness.

---

# League Rules

Directory:

```text
docs/02-rules/
```

These documents define rules shared across several features.

Planned documents include:

```text
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/SCORING_RULES.md
docs/02-rules/PERMISSIONS.md
```

## League Rules

Will define shared rules such as:

* salary cap;
* roster limits;
* positional minimums;
* injured reserve;
* retention limits;
* buyout rules;
* transaction timing;
* season-wide restrictions.

Read when a task affects multiple league features.

## Scoring Rules

Will define:

* fantasy-point formulas;
* standings points;
* matchup ties;
* position treatment;
* result calculations;
* standings sorting.

Read for statistics, matchups, standings, and playoff work.

## Permissions

Will define:

* platform-administrator authority;
* commissioner authority;
* manager authority;
* unauthenticated access;
* backend authorization requirements.

Read for accounts, leagues, teams, commissioner tools, and every write endpoint.

---

# Product Specifications

Directory:

```text
docs/03-product-specs/
```

Product specifications define **what a feature must do** from the user and league perspective.

Planned specifications include:

```text
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/ROSTERS.md
docs/03-product-specs/CONTRACTS.md
docs/03-product-specs/AUCTIONS.md
docs/03-product-specs/TRADES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/STANDINGS.md
docs/03-product-specs/ENTRY_DRAFT.md
docs/03-product-specs/COMMISSIONER_TOOLS.md
```

Read the matching product specification whenever changing user-visible behaviour or league rules for that feature.

A product specification should define:

* purpose;
* users and permissions;
* normal workflow;
* business rules;
* validation;
* timing;
* edge cases;
* commissioner controls;
* user-interface expectations;
* definition of done.

Product specifications should not unnecessarily dictate JavaScript function names or exact file organization.

---

# Technical Specifications

Directory:

```text
docs/04-technical-specs/
```

Technical specifications define **how the system is built or changed**.

Planned specifications include:

```text
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/DEPLOYMENT.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
```

## Architecture

Will describe:

* frontend and backend responsibilities;
* repository boundaries;
* data flow;
* Socket.IO;
* persistence;
* hosting;
* external data dependencies.

## Data Model

Will define:

* database entities;
* fields;
* relationships;
* stable identifiers;
* league isolation;
* season relationships;
* constraints.

## API Contracts

Will define each important endpoint’s:

* method;
* path;
* purpose;
* authentication;
* authorization;
* request;
* response;
* errors;
* read-only or write behaviour;
* affected state.

Read-only endpoints must remain read-only.

## Backend Refactor

Will define:

* current backend organization;
* target folder structure;
* behaviour-preservation requirements;
* extraction sequence;
* verification after each step;
* completion criteria.

## SQLite Migration

Will define:

* target schema;
* JSON migration;
* backup;
* rollback;
* migration reports;
* verification;
* production safeguards.

---

# Roadmap

Directory:

```text
docs/05-roadmap/
```

Planned active files:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/05-roadmap/FUTURE_BACKLOG.md
```

Historical roadmaps belong in:

```text
docs/05-roadmap/archive/
```

## Active Roadmap

Defines the current sequence of milestones and priorities.

It does not define every feature rule or implementation detail.

## Future Backlog

Stores possible future work that is not currently approved.

Items in the future backlog must not be implemented unless Grae deliberately moves them into the current scope and active roadmap.

## Archived Roadmaps

Archived roadmaps are historical records.

They may explain why old code exists, but they are not current instructions.

---

# Work Plans

Directory:

```text
docs/06-work-plans/
```

Active execution plan:

```text
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Completed plans belong in:

```text
docs/06-work-plans/archive/
```

A work plan is used for a contained current task such as:

* completing one backend-refactor step;
* migrating one data area;
* introducing authentication;
* converting one feature to league-scoped storage.

A work plan should contain:

* objective;
* prerequisites;
* affected files;
* exact steps;
* risks;
* rollback;
* verification;
* completion checklist.

A work plan cannot override product rules or safety requirements.

---

# Testing

Directory:

```text
docs/07-testing/
```

Planned documents include:

```text
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/07-testing/RELEASE_CHECKLIST.md
```

Testing documents define how approved behaviour is verified.

Read when:

* adding or changing behaviour;
* performing a migration;
* preparing staging;
* preparing a release;
* correcting a production problem.

Every coding task must include an appropriate verification command, request, or manual check.

---

# Operations

Directory:

```text
docs/08-operations/
```

Planned documents include:

```text
docs/08-operations/PRODUCTION_RUNBOOK.md
docs/08-operations/BACKUP_AND_RESTORE.md
docs/08-operations/STAGING_ENVIRONMENT.md
docs/08-operations/INCIDENT_RECOVERY.md
```

Operations documents cover running the real application.

Read for:

* Render;
* Netlify;
* deployment;
* persistent storage;
* environment variables;
* backups;
* restoration;
* scheduled jobs;
* outages;
* staging;
* production recovery.

Do not place secrets in these documents.

---

# Team Workflow

Directory:

```text
docs/09-team/
```

Planned documents include:

```text
docs/09-team/DEVELOPMENT_WORKFLOW.md
docs/09-team/GRAE_ROLE.md
docs/09-team/MARTY_ROLE.md
docs/09-team/PARKER_ROLE.md
```

These documents will explain:

* branch workflow;
* commits;
* pull requests;
* testing handoffs;
* role responsibilities;
* review expectations;
* deployment authority.

---

# Decisions

Directory:

```text
docs/10-decisions/
```

Canonical file:

```text
docs/10-decisions/DECISION_LOG.md
```

The decision log records important approved choices and why they were made.

Examples:

* only administrators may create leagues initially;
* SQLite will replace JSON for mutable league data;
* shared documentation lives in the frontend repository;
* product development uses product seasons rather than stages.

Read when a current task may revisit an earlier architectural or product choice.

---

# Notes and Issues

Directory:

```text
docs/11-notes/
```

Planned files include:

```text
docs/11-notes/IDEAS_INBOX.md
docs/11-notes/KNOWN_ISSUES.md
```

## Ideas Inbox

Contains incomplete or unapproved ideas.

Ideas are not requirements.

## Known Issues

Contains confirmed current problems with:

* symptoms;
* reproduction steps;
* severity;
* affected area;
* current status.

Known issues describe problems. They do not automatically authorize large redesigns.

---

# Archive

General archive directory:

```text
docs/archive/
```

Use the archive for replaced documents that do not belong in a more specific archive folder.

An archived document should clearly state:

```text
ARCHIVED — Not an active source of current requirements.
```

Do not delete historical documents until:

1. their useful content has been moved into canonical documents;
2. the replacement documents have been reviewed;
3. the archive move is committed;
4. recovery through Git history has been verified.

---

# Task Routing Examples

## Backend refactor

Read:

```text
AGENTS.md
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/OPERATING_MODE.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/BACKEND_REFACTOR.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Then inspect the affected backend code and verification commands.

## Auction change

Read:

```text
AGENTS.md
docs/README.md
docs/01-project/PROJECT_SCOPE.md
docs/02-rules/LEAGUE_RULES.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/AUCTIONS.md
docs/04-technical-specs/API_CONTRACTS.md
```

Read contract and data-model specifications when the change affects salaries or contract creation.

## Matchup bug

Read:

```text
AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/02-rules/SCORING_RULES.md
docs/03-product-specs/MATCHUPS.md
docs/03-product-specs/STANDINGS.md
docs/04-technical-specs/API_CONTRACTS.md
docs/11-notes/KNOWN_ISSUES.md
```

Reproduce the problem before changing code.

## Database migration

Read:

```text
AGENTS.md
docs/README.md
docs/01-project/OPERATING_MODE.md
docs/01-project/CURRENT_STATE.md
docs/04-technical-specs/DATA_MODEL.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/08-operations/BACKUP_AND_RESTORE.md
docs/07-testing/TESTING_STRATEGY.md
```

Never use production data as disposable test data.

## Frontend display change

Read:

```text
AGENTS.md
docs/README.md
relevant product specification
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
```

Confirm that the frontend is displaying authoritative backend values rather than recreating business calculations.

---

# Documentation Update Rules

Update documentation when:

* approved feature behaviour changes;
* a technical design changes;
* a milestone is completed;
* the operating mode changes;
* project scope changes;
* a material decision is approved;
* an endpoint contract changes;
* a migration changes stored data;
* a known issue is confirmed or resolved.

Do not update canonical rules merely to match an accidental code change.

When code and approved documentation disagree:

1. determine whether the code is wrong or the documentation is outdated;
2. obtain Grae’s approval when behaviour is ambiguous;
3. correct both as part of an intentional change.

---

# Current Canonical Foundation Documents

The following foundation documents currently exist:

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/01-project/GLOSSARY.md
```

Other document paths listed in this index are planned and will be created as the documentation foundation develops.

Do not assume a planned document exists without checking the repository.
