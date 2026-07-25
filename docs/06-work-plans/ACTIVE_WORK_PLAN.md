# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`ACTIVE`

## Work Plan ID

```text
M7-08
```

## Work Item

```text
Exact Candidate Freeze and Staging Branch Publication
```

# Objective

Convert the fully audited canonical `E:` frontend and backend working trees
into exact, reproducible M7 staging-candidate commits. Run the complete local
release gates under Node `24.14.1`, preserve all intentional M3-M7 work,
exclude secrets and generated runtime artifacts, publish only the staging
branches, and record the immutable source identities required before hosted
staging configuration or deployment begins.

# Authority and Boundary

Grae authorized the M7 staging workflow, intentional scoped commits, staging
branch creation, and staging-branch pushes on `2026-07-24`.

This plan authorizes:

* changes in only `E:\hundo-leago` and `E:\hundo-leago-backend`;
* the Node-version and ignore protections required for reproducible gates;
* canonical documentation updates required to identify the active M7 step;
* complete local frontend and backend verification;
* creation or use of a frontend `staging` branch;
* continued use of the backend `staging` branch;
* scoped staging and separate commits in the two repositories;
* pushes of only the resulting staging/candidate branches.

This plan does not authorize:

* use of any legacy `C:` Hundo Leago copy;
* a Netlify or Render configuration change or deployment;
* staging database initialization, migration, fixture load, or restore;
* a real provider call or email;
* production reset, migration, deployment, restart, traffic, jobs, or writes;
* a merge to either production `main` branch;
* a force-push, history rewrite, stash, discard, or destructive Git command;
* a pull request unless Grae separately requests one.

# Canonical Repositories

```text
Frontend and documentation: E:\hundo-leago
Backend:                    E:\hundo-leago-backend
Workspace:                  E:\hundo-leago.code-workspace
```

The old `C:\Users\graem\Desktop` copies are not inputs.

# Candidate Scope

The candidate boundary is the complete audited M3-M7 working-tree state in the
two canonical repositories, including:

```text
Frontend:
  docs/
  scripts/
  src/
  .gitignore
  .node-version
  .npmrc
  package.json
  package-lock.json
  vite.config.js

Backend:
  database/migrations/
  database/reset-manifests/2026-season-1-reset.json
  scripts/
  src/
  test/
  .gitignore
  .node-version
  .npmrc
  package.json
  render.yaml
  server.js
  server-compatibility.js
```

The audited inventory contains no candidate database, `.env` file, secret,
log, cache, backup artifact, coverage output, build output, binary, symlink, or
unrelated path.

# Required Sequence

1. Reinspect both statuses and confirm the exact audited path inventory.
2. Verify Node `24.14.1`, npm engine enforcement, exact package metadata, and
   backend SQLite driver `12.11.1`.
3. Run frontend clean install, lint, complete tests, browser-authority
   verification, and production build through the approved runtime.
4. Run backend clean install, check command, complete tests, characterization
   tests, release-QA focused gates, JavaScript syntax inventory, and candidate
   preflight through the approved runtime.
5. Confirm no protected runtime data, generated artifacts, or secrets were
   created or added to the candidate.
6. Create or switch the frontend to `staging` without discarding any audited
   work; confirm the backend remains on `staging`.
7. Stage only the audited candidate paths in each repository and review the
   complete cached file inventory and diff checks.
8. Create one intentional frontend/documentation candidate commit and one
   intentional backend candidate commit.
9. Record full commit SHAs, lockfile SHA-256 values, Node/npm versions, schema
   version, migration checksum-set evidence, and local gate results.
10. Run the fail-closed candidate preflight against the exact clean commits.
11. Push only the frontend and backend staging branches to their existing
    GitHub remotes.
12. Verify the remote staging refs equal the recorded local commits.

# Verification Commands

Use the approved Node runtime:

```powershell
E:\hundo-leago\scripts\npm-approved.cmd ci
E:\hundo-leago\scripts\npm-approved.cmd run lint
E:\hundo-leago\scripts\npm-approved.cmd test
E:\hundo-leago\scripts\npm-approved.cmd run verify:m3-browser-authority
E:\hundo-leago\scripts\npm-approved.cmd run build

E:\hundo-leago-backend\scripts\npm-approved.cmd ci
E:\hundo-leago-backend\scripts\npm-approved.cmd run check
E:\hundo-leago-backend\scripts\npm-approved.cmd test
E:\hundo-leago-backend\scripts\npm-approved.cmd run test:characterization
```

Also run the implemented M7 focused release commands and the repository-wide
JavaScript syntax inventory. Do not claim checklist commands that are not
implemented in the package manifests.

# Commit and Push Rules

* Inspect `git status --short` immediately before staging.
* Stage explicit audited paths only; do not use an unreviewed broad add.
* Inspect `git diff --cached --stat`, `git diff --cached --name-status`, and
  `git diff --cached --check`.
* Keep frontend/documentation and backend commits separate.
* Do not amend or rewrite either candidate after evidence is recorded.
* Push only `staging`; do not push or merge `main`.
* A push does not authorize a deployment.

# Rollback

Before commit, correct candidate problems through contained edits while
preserving all intentional work.

After commit, correct a candidate problem with a new staging commit. Do not
reset, amend, force-push, or discard evidence.

Because this plan does not deploy or change hosted configuration or data, its
rollback is source-only and does not involve Netlify, Render, SQLite, disks,
providers, or production.

# Stop Conditions

Stop before publication when:

* either repository contains an unexplained or unaudited path;
* Node is not exactly `24.14.1`;
* `npm ci`, a required local gate, or candidate preflight fails;
* a secret, database, backup, log, cache, or generated build artifact enters
  the candidate;
* frontend and backend contracts are incompatible;
* a migration checksum or schema expectation differs;
* either commit contains an unrelated change;
* the intended remote or branch is ambiguous;
* publication would update `main` or a production-connected branch.

# Completion Gate

M7-08 completes only when:

* the frontend and backend staging branches are clean;
* both exact candidate commits and lockfile hashes are recorded;
* complete required local gates pass under Node `24.14.1`;
* candidate preflight accepts the exact clean commits;
* each remote staging ref equals its recorded local commit;
* no hosted service, database, provider, or production resource changed;
* remaining hosted-staging gates are explicitly recorded as not yet run.

# Next Step Boundary

After M7-08, the next bounded plan is isolated hosted-staging configuration,
deployment, database identity initialization, deterministic fixture loading,
and deployed acceptance. It may modify only the dedicated Netlify staging site
and Render service `hundo-leago-backend-staging`.

Production remains blocked until Grae tests hosted staging and gives separate
explicit authorization.
