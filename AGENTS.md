# Hundo Leago Frontend — Agent Instructions

## Repository Purpose

This repository contains the Hundo Leago frontend.

Primary technology:

* React
* Vite
* JavaScript
* Socket.IO client
* Netlify deployment

The frontend displays league information, accepts user actions, and communicates with the backend API.

The frontend is not the authoritative source of mutable league state.

---

## Shared Project Documentation

The canonical shared Hundo Leago documentation is stored in this repository under:

```text
docs/
```

Before planning a meaningful change, read:

```text
docs/README.md
```

Use the documentation index to identify the specific project, rule, product, technical, testing, and operations documents required for the task.

Do not rely on:

* old chat history;
* memory from previous sessions;
* archived documents;
* duplicated root-level documents;
* assumptions about intended behaviour.

---

## Required Foundation Reading

For meaningful feature or architectural work, read:

```text
docs/01-project/NORTH_STAR.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
```

Read:

```text
docs/01-project/GLOSSARY.md
```

when project terminology affects correctness.

Small formatting or typo fixes do not require reading every foundation document.

---

## Operating Mode

Before work involving significant behaviour, persistent data, deployment, migration, authentication, or production risk, read:

```text
docs/01-project/OPERATING_MODE.md
```

Do not infer the operating mode from:

* the date;
* hockey season timing;
* website traffic;
* previous conversations.

An off-season does not automatically make production data disposable.

Do not edit the operating-mode document unless Grae explicitly asks for that change.

---

## Production Safety

The production frontend is deployed from the approved production branch.

Do not:

* deploy unverified work;
* silently change production environment variables;
* point development or staging at production storage;
* expose secrets;
* remove existing features without approval;
* bypass backend authorization through frontend logic;
* assume that an inactive website is safe to break in production.

Temporary instability is acceptable only where permitted by the current operating mode and the approved work plan.

Prefer:

* local development;
* feature branches;
* staging;
* small reviewable commits;
* reversible changes.

---

## Frontend and Backend Responsibilities

The backend is the authoritative source for:

* users;
* permissions;
* leagues;
* teams;
* rosters;
* contracts;
* cap calculations;
* auctions;
* trades;
* buyouts;
* matchups;
* standings;
* activity history;
* persistent state.

The frontend may:

* display backend values;
* collect user input;
* validate basic input for usability;
* submit authorized requests;
* display errors;
* react to Socket.IO updates.

The frontend must not independently recreate authoritative league calculations when the backend already provides them.

Examples include:

* salary-cap totals;
* roster legality;
* winning auction bids;
* trade validity;
* matchup results;
* standings.

Frontend validation improves usability but does not replace backend validation.

---

## Backend Repository

The backend is stored in a separate sibling repository:

```text
../hundo-leago-backend/
```

In the shared VS Code workspace, both repositories may be available.

Do not edit the backend repository unless:

* the task explicitly requires backend work; or
* the approved work plan clearly includes coordinated frontend and backend changes.

When a task spans both repositories:

1. Identify the required change in each repository.
2. Preserve the separation between frontend and backend responsibilities.
3. Verify each repository independently.
4. Keep Git commits separate by repository.
5. Report the files changed in each repository.

The repositories have independent Git histories and deployments.

---

## Scope Control

Implement only:

* work explicitly requested by Grae;
* behaviour defined in approved specifications;
* work included in the active roadmap or work plan;
* necessary supporting changes directly required by the task.

Do not silently add adjacent features.

Examples of prohibited scope expansion include:

* adding public registration while implementing administrator-created accounts;
* adding user-created leagues while implementing administrator-created leagues;
* redesigning unrelated pages during a targeted bug fix;
* changing scoring rules while adjusting a standings display;
* changing contract rules during a visual contract-page update.

Report useful adjacent ideas separately instead of implementing them without approval.

---

## Existing Behaviour

Inspect the current implementation before editing it.

Do not assume:

* a feature is missing because documentation is incomplete;
* old documentation accurately describes current code;
* existing code automatically represents approved behaviour;
* a frontend calculation is authoritative;
* an API response has a particular shape without checking it.

When code and approved documentation disagree:

1. Identify the disagreement.
2. Determine whether the code is outdated or the documentation is outdated.
3. Stop and report the conflict when approved behaviour is unclear.
4. Do not silently choose one version.

---

## Change Size

Prefer small, contained changes that can be reviewed and verified independently.

A larger coordinated change is permitted only when:

* the operating mode allows it;
* an approved specification exists;
* an approved work plan defines the steps;
* verification and rollback are included.

Do not perform an uncontrolled rewrite merely because the project is in the off-season.

Do not change unrelated files for cleanup unless the task explicitly includes that cleanup.

---

## Read-Only Behaviour

A read-only frontend action must not trigger a hidden write request.

Examples of read-only actions include:

* opening a page;
* viewing standings;
* viewing a player;
* previewing matchup information;
* searching players;
* viewing league history.

Do not add hidden writes for:

* initialization;
* automatic correction;
* reseeding;
* cache refresh;
* migration;
* state normalization.

Any required write must use an explicit approved backend endpoint and user action or scheduled process.

---

## Authentication and Permissions

Do not treat frontend visibility as security.

Hiding a button does not authorize or prevent an action.

For authenticated features:

* use the approved backend authentication system;
* send requests using the approved session mechanism;
* handle unauthorized responses;
* avoid storing raw passwords;
* do not expose tokens or secrets;
* display only leagues and teams returned for the authenticated user.

All meaningful authorization must be enforced by the backend.

---

## League Isolation

Every league-specific page, request, and displayed record must use the correct league context.

Do not:

* assume one global league;
* infer league identity only from a team name;
* reuse one league’s cached data for another;
* combine records from different leagues;
* allow stale selected-league state to affect another account.

When league context is missing or ambiguous, report the problem rather than defaulting to the original league.

---

## Stable Identifiers

Use stable identifiers for:

* users;
* leagues;
* teams;
* players;
* contracts;
* transactions;
* matchup weeks.

Do not rely on display names as unique identifiers.

Names may change.

---

## API Use

Before changing API assumptions, read the applicable API documentation when it exists:

```text
docs/04-technical-specs/API_CONTRACTS.md
```

Also inspect the current backend implementation when available.

For API changes:

* preserve existing contracts unless an approved change requires otherwise;
* handle loading, success, empty, and error states;
* do not hide backend errors;
* do not convert failed writes into apparent success;
* avoid duplicate submissions;
* keep read-only requests read-only.

---

## Socket.IO

The frontend currently receives backend updates through Socket.IO.

The general league update event is:

```text
league:updated
```

When changing live updates:

* avoid duplicate event listeners;
* remove listeners during component cleanup;
* avoid repeated fetch loops;
* confirm the update is scoped to the correct league;
* preserve normal page loading when Socket.IO is unavailable.

Socket.IO updates do not replace authoritative API responses.

---

## User Interface Work

For user-interface changes:

* preserve existing functionality;
* support desktop and mobile layouts;
* display understandable errors;
* use consistent terminology from the Glossary;
* avoid exposing internal IDs when a user-facing name is appropriate;
* preserve accessibility where practical;
* do not bury commissioner actions among normal manager actions;
* keep destructive actions clearly identified.

Do not perform a broad visual redesign during an unrelated functional task.

---

## Error Handling

Do not fail silently.

The frontend should distinguish between:

* loading;
* empty results;
* unauthorized access;
* validation failure;
* backend error;
* network failure;
* unavailable external data.

User-facing messages should explain what happened without exposing secrets or unnecessary internal implementation details.

---

## Testing and Verification

Every code change requires an appropriate verification step.

Common frontend verification commands include:

```bash
npm run lint
npm run build
```

When a development server is required:

```bash
npm run dev
```

Also perform a focused browser check for the affected workflow.

A successful build alone does not prove feature behaviour is correct.

For changes involving API data, verify the relevant backend endpoint or response shape.

For changes involving multiple leagues, test with at least two separate league contexts.

---

## Required Completion Report

After making a change, report:

1. The exact files changed.
2. What behaviour changed.
3. What behaviour was intentionally preserved.
4. The verification commands run.
5. The verification results.
6. Any tests that were not run.
7. Any remaining risks or follow-up work.
8. Whether documentation should be updated.

Do not claim a test passed unless it was actually run.

---

## Git Safety

Do not:

* commit unrelated local changes;
* discard uncommitted work without explicit approval;
* force-push;
* rewrite shared history;
* merge into `main` without approval;
* commit secrets or environment files;
* combine frontend and backend commits.

Before staging files, inspect:

```bash
git status --short
```

Stage only the files belonging to the approved task.

---

## Documentation Updates

Update documentation when approved behaviour changes.

Possible affected documents include:

```text
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/
docs/05-roadmap/
docs/07-testing/
docs/10-decisions/
docs/11-notes/
```

Do not rewrite canonical documentation merely to justify accidental code behaviour.

---

## Decision Authority

Grae has final authority over:

* product scope;
* league rules;
* operating mode;
* destructive production operations;
* launch decisions;
* material architecture decisions;
* changes to canonical specifications.

When a required decision is missing, report the decision clearly instead of inventing it.
