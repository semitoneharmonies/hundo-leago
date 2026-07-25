# Hundo Leago - Release Checklist

## Document Status

`APPROVED`

## Checklist Status

`ACTIVE`

## Release Readiness

`NOT EVALUATED`

This testing and operations checklist defines:

* the go/no-go gates for staging release candidates and production releases;
* source, scope, documentation, automated testing, endpoint, manual QA, security, environment, database, backup, deployment, smoke, monitoring, rollback, and closeout checks;
* explicit production, reset, migration, and restore authority boundaries;
* release-record and evidence requirements;
* technical release decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the release-checklist decisions and approved adoption of the resulting checklist on 2026-07-18.

Approval of this template does not mark any release ready.

---

## Release Purpose

A production release combines:

* exact source commits;
* exact hosted builds;
* environment configuration;
* API and schema compatibility;
* persistent data;
* external services;
* scheduled work;
* human authorization.

Each part may be correct in isolation while the combined release is unsafe.

This checklist requires evidence that the complete release candidate is compatible, recoverable, and explicitly authorized before production changes.

---

## Out of Scope

This checklist does not:

* authorize a deployment;
* execute a command;
* merge, commit, or push code;
* change Netlify, Render, DNS, secrets, disk, or database state;
* waive an approved rule or security control;
* convert a failed test into an accepted result;
* make production a test fixture;
* make code rollback restore SQLite;
* replace the release-specific work plan.

Every real release receives a completed copy or equivalent release record.

---

# Part 1 - Authority

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
docs/04-technical-specs/DEPLOYMENT.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/07-testing/MANUAL_QA_CHECKLIST.md
docs/08-operations/BACKUP_AND_RESTORE.md
```

Deployment owns release ordering and provider behavior. This checklist decides whether the recorded release satisfies those requirements.

---

## Production Authority

Grae must explicitly authorize the production release.

Separate explicit authorization is required when the release includes:

* production reset;
* JSON-to-SQLite cutover;
* destructive or transforming data migration;
* production restore;
* secret rotation that revokes access;
* disk, domain, or DNS change;
* permanent deletion.

General statements such as “continue,” “looks good,” or approval of this document are not production authority unless they clearly identify the production operation.

---

## Roles

Each release records:

```text
Release requester:
Technical operator:
Manual QA tester:
Release reviewer:
Production approver: Grae
Incident lead if emergency:
```

One person may hold multiple non-approval roles when team size requires it, but every role and piece of evidence remains explicit.

The production approver cannot be inferred from a Git merge.

---

# Part 2 - Release Identity and Status

## Release Record

Safe release records belong under:

```text
docs/08-operations/releases/
```

Suggested filename:

```text
HL-YYYYMMDD-N.md
```

Large logs, videos, traces, database reports, and provider artifacts remain in their private systems. The release record links or identifies them without copying secrets or private production data into Git.

---

## Release Header

```text
Release ID:
Release type:
Purpose:
Requested by:
Technical operator:
Manual QA tester:
Release reviewer:
Production approver:
Frontend commit:
Frontend deploy ID:
Backend commit:
Backend deploy ID:
Node version:
API contract version:
Schema version:
Migration checksum-set ID:
Environment identity:
Database ID suffix:
Backup ID:
Maintenance window:
First-write boundary:
Current status:
Created at:
Updated at:
```

---

## Allowed Release Statuses

```text
DRAFT
STAGING CANDIDATE
NO-GO
READY FOR AUTHORIZATION
GO AUTHORIZED
IN PROGRESS
ROLLED BACK
COMPLETE
FAILED
```

Only Grae's explicit approval changes a production candidate from `READY FOR AUTHORIZATION` to `GO AUTHORIZED`.

---

## Release Types

Use one Deployment type:

| Type | Meaning |
| --- | --- |
| `D0` | Documentation only; no hosted runtime input changes |
| `D1` | Frontend only |
| `D2` | Backend only with no schema change |
| `D3` | Additive API and/or backward-compatible schema change |
| `D4` | Data migration, reset, destructive schema change, or authority cutover |
| `D5` | Emergency code release |

The type controls applicability. It does not weaken safety for affected components.

---

# Part 3 - Gate Rules

## Check Values

Use:

```text
PASS
FAIL
BLOCKED
NOT APPLICABLE
DEFERRED BY APPROVED SCOPE
NOT RUN
```

Every `NOT APPLICABLE` includes the release-type reason.

Every approved deferral cites Project Scope or the Active Roadmap.

`NOT RUN` is not a pass.

---

## Hard Blockers

The release is `NO-GO` when any applicable item has:

* `FAIL`;
* `BLOCKED`;
* unexplained `NOT RUN`;
* missing evidence;
* ambiguous source or environment identity.

There is no conditional go for:

* critical or high-severity security issues;
* cross-league access;
* data corruption or unexplained reconciliation;
* missing verified backup for a data-risking release;
* untested migration;
* incompatible API/frontend/schema;
* production authority not granted.

---

## Known-Issue Rule

Open issues:

* `CRITICAL` or `HIGH`: release blocked;
* `MEDIUM`: explicit owner, workaround, impact, and Grae disposition required;
* `LOW`: owner and planned follow-up required when accepted.

An issue is not low merely because the fix is inconvenient.

---

# Part 4 - Scope and Change Review

- [ ] `RC-SCP-001` Release type is selected and justified.
- [ ] `RC-SCP-002` Release objective is one understandable outcome.
- [ ] `RC-SCP-003` Every changed path belongs to the release scope.
- [ ] `RC-SCP-004` Unrelated local modifications are excluded.
- [ ] `RC-SCP-005` Frontend, backend, documentation, schema, environment, and provider changes are listed separately.
- [ ] `RC-SCP-006` Launch-critical, in-season, optional, and out-of-scope boundaries match Project Scope.
- [ ] `RC-SCP-007` Deferred Entry Draft or playoff work is not accidentally treated as opening-day completion.
- [ ] `RC-SCP-008` No hidden reset, seed, normalization, repair, refresh, backup, or migration side effect exists.
- [ ] `RC-SCP-009` Read-only endpoints remain read-only.
- [ ] `RC-SCP-010` User-visible behavior changes have approved rule/product authority.
- [ ] `RC-SCP-011` Breaking API or data change has explicit compatibility and release order.
- [ ] `RC-SCP-012` Release notes identify manager, commissioner, and administrator effects.

---

## Change Inventory

Complete:

```text
Frontend paths:
Backend paths:
Documentation paths:
Migration files:
Environment-variable names added/changed/removed:
Secret versions changed:
Provider configuration changed:
Persistent paths changed:
API endpoints added/changed/retired:
Socket.IO events changed:
Scheduled jobs changed:
Email templates/events changed:
League Activity event types changed:
Security Audit event types changed:
Known compatibility behavior retained:
```

Secret values are excluded.

---

# Part 5 - Source and Branch Gate

- [ ] `RC-SRC-001` Frontend repository path is the approved `hundo-leago` repository.
- [ ] `RC-SRC-002` Backend repository path is the approved `hundo-leago-backend` repository.
- [ ] `RC-SRC-003` Production source is reviewed on `main` in each changed repository.
- [ ] `RC-SRC-004` Staging source was reviewed on `staging`.
- [ ] `RC-SRC-005` Exact full commit SHAs are recorded.
- [ ] `RC-SRC-006` Commits are reachable from the intended protected branch.
- [ ] `RC-SRC-007` `git status --short` was reviewed before release preparation.
- [ ] `RC-SRC-008` Untracked and modified files not in the release are understood and excluded.
- [ ] `RC-SRC-009` Frontend and backend lockfile hashes are recorded.
- [ ] `RC-SRC-010` No dependency uses an unintended floating or locally linked source.
- [ ] `RC-SRC-011` Node version is exactly `24.14.1`.
- [ ] `RC-SRC-012` Backend SQLite driver is exact approved `12.11.1` when SQLite is implemented.
- [ ] `RC-SRC-013` Build uses the committed lockfile and `npm ci`.
- [ ] `RC-SRC-014` No commit or tag was rewritten after evidence was collected.

---

## Source Evidence Commands

```powershell
# Run in each repository
git branch --show-current
git rev-parse HEAD
git status --short
git diff --stat
git diff --cached --stat
Get-FileHash package-lock.json -Algorithm SHA256
node --version
npm --version
```

Record output safely.

---

# Part 6 - Documentation and Contract Gate

- [ ] `RC-DOC-001` Canonical README points to all applicable approved documents.
- [ ] `RC-DOC-002` Current State accurately describes implemented versus planned behavior.
- [ ] `RC-DOC-003` Active Roadmap status and milestone gate are current.
- [ ] `RC-DOC-004` Active Work Plan or release plan identifies the exact release scope.
- [ ] `RC-DOC-005` Product specifications match visible workflows.
- [ ] `RC-DOC-006` League Rules, Scoring Rules, and Permissions match implementation.
- [ ] `RC-DOC-007` API Contracts include every added, changed, and retired endpoint.
- [ ] `RC-DOC-008` Backend Endpoint Checklist statuses have evidence.
- [ ] `RC-DOC-009` Data Model and SQLite Migration match every schema change.
- [ ] `RC-DOC-010` Security matches session, token, CORS, CSRF, audit, and secret behavior.
- [ ] `RC-DOC-011` Environment Setup matches deployed variable names and topology.
- [ ] `RC-DOC-012` Deployment contains the selected release and rollback pattern.
- [ ] `RC-DOC-013` Backup and Restore matches artifact format and restore tooling.
- [ ] `RC-DOC-014` No contradictory unresolved approval item remains.
- [ ] `RC-DOC-015` Verification commands in changed documents are valid or explicitly future-target commands.

---

# Part 7 - Automated Test Gate

## Frontend

- [ ] `RC-TST-001` Clean frontend install passed.
- [ ] `RC-TST-002` Frontend lint passed.
- [ ] `RC-TST-003` Frontend unit/component tests passed.
- [ ] `RC-TST-004` Frontend production build passed.
- [ ] `RC-TST-005` Affected Playwright Chromium workflows passed.
- [ ] `RC-TST-006` Required Firefox/WebKit automated coverage passed.
- [ ] `RC-TST-007` No unexplained skipped or quarantined launch-critical frontend test exists.
- [ ] `RC-TST-008` Coverage did not regress without approved explanation.

Commands:

```powershell
npm ci
npm run lint
npm test
npm run test:coverage
npm run build
npm run test:e2e
```

Only commands implemented by the release are run; a missing required script blocks the applicable gate.

---

## Backend

- [ ] `RC-TST-009` Clean backend install passed.
- [ ] `RC-TST-010` Backend syntax/check command passed.
- [ ] `RC-TST-011` Backend full test suite passed.
- [ ] `RC-TST-012` Compatibility characterization passed for affected compatibility code.
- [ ] `RC-TST-013` Domain and service tests passed.
- [ ] `RC-TST-014` SQLite repository and transaction tests passed.
- [ ] `RC-TST-015` API contract tests passed.
- [ ] `RC-TST-016` Authentication, authorization, and two-league isolation tests passed.
- [ ] `RC-TST-017` Scheduled-job restart, overlap, lease, and idempotency tests passed.
- [ ] `RC-TST-018` Socket.IO authentication, room, commit, rollback, and reconnect tests passed.
- [ ] `RC-TST-019` NHL provider failure and last-valid-cache tests passed.
- [ ] `RC-TST-020` Email/outbox retry and duplicate-protection tests passed.
- [ ] `RC-TST-021` No unexplained skipped or quarantined launch-critical backend test exists.
- [ ] `RC-TST-022` Coverage did not regress without approved explanation.

Commands:

```powershell
npm ci
npm run check
npm test
npm run test:characterization
npm run test:contract
npm run test:integration
```

---

## Data, Migration, and Recovery Tests

- [ ] `RC-TST-023` Empty-database migration passed.
- [ ] `RC-TST-024` Applied migration checksum refusal test passed.
- [ ] `RC-TST-025` Copied-JSON dry-run/import tests passed when applicable.
- [ ] `RC-TST-026` Repeat-import determinism passed.
- [ ] `RC-TST-027` Count, money, ownership, schedule, and semantic reconciliation passed.
- [ ] `RC-TST-028` `integrity_check` returned `ok`.
- [ ] `RC-TST-029` `foreign_key_check` returned zero rows.
- [ ] `RC-TST-030` Online backup creation and verification passed.
- [ ] `RC-TST-031` Clean-path restore and application startup passed.
- [ ] `RC-TST-032` Session/token, job, outbox, and email post-restore safeguards passed.
- [ ] `RC-TST-033` Accelerated regular season passed.

---

## Test Evidence

```text
Frontend command record:
Backend command record:
Browser report:
Coverage report:
Migration report:
Backup/restore report:
Passed:
Failed:
Skipped:
Flaky:
Tests not run:
Remaining risk:
```

Never copy a prior release's pass without rerunning the applicable exact-commit gate.

---

# Part 8 - Endpoint Gate

- [ ] `RC-END-001` All launch-critical target endpoint rows are at least `STAGING VERIFIED`.
- [ ] `RC-END-002` Every still-active compatibility route is `CHARACTERIZED`.
- [ ] `RC-END-003` Retired routes meet the compatibility retirement gate.
- [ ] `RC-END-004` Current route count matches the intended compatibility state.
- [ ] `RC-END-005` Every changed endpoint has success, validation, error, permission, and league-isolation evidence.
- [ ] `RC-END-006` Every changed read has no-domain-write proof.
- [ ] `RC-END-007` Every material write has transaction, rollback, version, and idempotency proof where applicable.
- [ ] `RC-END-008` Outbox and Socket.IO occur only after commit.
- [ ] `RC-END-009` Active competing bid values remain absent for managers and commissioners.
- [ ] `RC-END-010` Public projections exclude private fields.
- [ ] `RC-END-011` Debug mutation routes are absent from production configuration.
- [ ] `RC-END-012` Frontend fallback to retired broad writes is disabled and staging-verified.

Endpoint checklist evidence:

```text
Compatibility rows complete:
Target launch-critical rows complete:
Rows blocked:
Rows deferred by approved scope:
Evidence location:
```

---

# Part 9 - Manual QA Gate

- [ ] `RC-QA-001` Manual QA run header identifies exact staging deploys.
- [ ] `RC-QA-002` Complete initial-launch scope was tested.
- [ ] `RC-QA-003` Required desktop Chromium run passed.
- [ ] `RC-QA-004` Required Firefox run passed.
- [ ] `RC-QA-005` Required mobile Chromium run passed.
- [ ] `RC-QA-006` WebKit/iOS behavior has required evidence.
- [ ] `RC-QA-007` At least one physical mobile browser passed.
- [ ] `RC-QA-008` 200% zoom checks passed.
- [ ] `RC-QA-009` Keyboard and screen-reader spot checks passed.
- [ ] `RC-QA-010` Two-league manual isolation checks passed.
- [ ] `RC-QA-011` Loading, empty, error, conflict, reconnect, and stale-build states passed.
- [ ] `RC-QA-012` Backup/restore staging drill manual checks passed when applicable.
- [ ] `RC-QA-013` Every fixed critical/high/medium issue was retested.
- [ ] `RC-QA-014` Manual QA recommendation is `PASS`.
- [ ] `RC-QA-015` No critical or high defect remains open.
- [ ] `RC-QA-016` Every accepted medium/low issue has owner and disposition.

Manual QA run ID:

```text
Run ID:
Tester:
Result:
Defects open:
Evidence:
```

---

# Part 10 - Security Gate

- [ ] `RC-SEC-001` Password hashing and credential tests pass.
- [ ] `RC-SEC-002` One-active-session and every revocation trigger pass.
- [ ] `RC-SEC-003` Verification, setup, reset, and reactivation token tests pass.
- [ ] `RC-SEC-004` Public account responses prevent enumeration.
- [ ] `RC-SEC-005` Durable rate limits pass boundary and restart tests.
- [ ] `RC-SEC-006` Exact deployed CORS allows only approved origins.
- [ ] `RC-SEC-007` Origin and CSRF enforcement pass for browser mutations.
- [ ] `RC-SEC-008` Production session cookie attributes match the deployed topology.
- [ ] `RC-SEC-009` Security headers and Content Security Policy pass.
- [ ] `RC-SEC-010` SQL injection strings remain values, and identifiers/sorts use allowlists.
- [ ] `RC-SEC-011` Output encoding prevents stored/reflected script execution.
- [ ] `RC-SEC-012` Logs and audits redact credentials, tokens, bids, and secrets.
- [ ] `RC-SEC-013` First-platform-administrator bootstrap is disabled after use.
- [ ] `RC-SEC-014` Platform administrator still requires league membership for internal league operation.
- [ ] `RC-SEC-015` Socket.IO uses session authentication and authorized league rooms.
- [ ] `RC-SEC-016` No active sealed bid value is visible to a commissioner.
- [ ] `RC-SEC-017` Public health and frontend assets contain no internal path or secret.
- [ ] `RC-SEC-018` Dependency audit is reviewed and every relevant finding has disposition.
- [ ] `RC-SEC-019` No critical or high-severity security defect remains.

Security review:

```text
Reviewer:
Date:
Dependency-audit evidence:
Open findings:
Recommendation:
```

---

# Part 11 - Environment and Infrastructure Gate

- [ ] `RC-ENV-001` Dedicated staging Netlify site exists.
- [ ] `RC-ENV-002` Dedicated staging Render service and disk exist.
- [ ] `RC-ENV-003` Staging database, users, leagues, secrets, email, and backup namespace are separate from production.
- [ ] `RC-ENV-004` Dedicated production Netlify and Render services are identified.
- [ ] `RC-ENV-005` Production SQLite path resolves under the approved persistent disk.
- [ ] `RC-ENV-006` Production backend remains one instance.
- [ ] `RC-ENV-007` Frontend and backend `APP_ENV`/build identities are correct.
- [ ] `RC-ENV-008` Database environment identity matches production.
- [ ] `RC-ENV-009` Required configuration names are present and unknown/empty values fail closed.
- [ ] `RC-ENV-010` No secret uses a `VITE_` variable.
- [ ] `RC-ENV-011` Production origin lists are exact and contain no arbitrary deploy preview.
- [ ] `RC-ENV-012` Production email mode and credentials are correct.
- [ ] `RC-ENV-013` Staging capture/sandbox email cannot send unrestricted production messages.
- [ ] `RC-ENV-014` Scheduled-job enablement is explicit.
- [ ] `RC-ENV-015` Debug-route enablement is false in production.
- [ ] `RC-ENV-016` Disk free space meets migration, backup, WAL, and safety-margin needs.
- [ ] `RC-ENV-017` Health checks use the intended safe endpoint.
- [ ] `RC-ENV-018` Provider notifications and operational alerts are configured.
- [ ] `RC-ENV-019` Environment changes have before/after version records and rollback.
- [ ] `RC-ENV-020` Domain/DNS changes are absent or have a separately approved plan.

Do not paste environment values into the release record.

---

# Part 12 - Database and Migration Gate

## Every SQLite Release

- [ ] `RC-DB-001` Database ID and environment identity are recorded safely.
- [ ] `RC-DB-002` Current schema ledger and checksum set match expectations.
- [ ] `RC-DB-003` Application build supports the current schema.
- [ ] `RC-DB-004` SQLite WAL, foreign keys, busy timeout, and durability settings are verified.
- [ ] `RC-DB-005` No startup, build, GET, or scheduled feature job automatically migrates.
- [ ] `RC-DB-006` Destructive cleanup is separated from expansion release.
- [ ] `RC-DB-007` Old backend rollback compatibility with current schema is known.

---

## Migration Release

For `D3` schema work or `D4`:

- [ ] `RC-DB-008` Migration IDs and exact checksums are recorded.
- [ ] `RC-DB-009` Migration is immutable and reviewed.
- [ ] `RC-DB-010` Staging migration ran against production-shaped data.
- [ ] `RC-DB-011` Migration plan output matches intended changes.
- [ ] `RC-DB-012` Maintenance/write-block procedure is tested.
- [ ] `RC-DB-013` Jobs, email, and outbox pause procedure is tested.
- [ ] `RC-DB-014` Migration command validates environment and database identity.
- [ ] `RC-DB-015` Migration requires explicit production confirmation.
- [ ] `RC-DB-016` Reconciliation queries and expected totals are prepared.
- [ ] `RC-DB-017` First-write boundary and rollback path are explicit.
- [ ] `RC-DB-018` Post-migration backup command and verification are prepared.

---

## JSON-to-SQLite Cutover

Additionally:

- [ ] `RC-DB-019` Immutable source bundle inventory and hashes are complete.
- [ ] `RC-DB-020` Reset manifest contains only explicitly approved Season 1 omissions.
- [ ] `RC-DB-021` Stable player/provider identifiers are preserved.
- [ ] `RC-DB-022` Two deterministic staging imports produced identical semantic results.
- [ ] `RC-DB-023` Reject and quarantine reports contain no unresolved protected record.
- [ ] `RC-DB-024` Counts, money, ownership, schedules, and semantic reconciliation have no unexplained difference.
- [ ] `RC-DB-025` Original JSON remains immutable recovery evidence.
- [ ] `RC-DB-026` No dual-write period exists.
- [ ] `RC-DB-027` Pre-first-write reactivation plan is prepared.
- [ ] `RC-DB-028` Post-first-write recovery uses forward correction or verified restore.

---

# Part 13 - Backup and Recovery Gate

- [ ] `RC-BKP-001` Latest verified production backup is within required RPO.
- [ ] `RC-BKP-002` Pre-change backup is required and identified for data-risking release.
- [ ] `RC-BKP-003` Backup used online SQLite backup API rather than a live main-file copy.
- [ ] `RC-BKP-004` `integrity_check`, `foreign_key_check`, schema, identity, and checksum verification passed.
- [ ] `RC-BKP-005` Encrypted artifact exists outside the Render disk.
- [ ] `RC-BKP-006` Encrypted object size and SHA-256 match.
- [ ] `RC-BKP-007` Required encryption-key version is available.
- [ ] `RC-BKP-008` Staging restore drill passed within the last 30 days or after every material backup/restore change.
- [ ] `RC-BKP-009` Restore drill includes session/token revocation and job/outbox/email reconciliation.
- [ ] `RC-BKP-010` Pre-restore preservation behavior is tested.
- [ ] `RC-BKP-011` Operator knows that Render code rollback does not roll back disk state.
- [ ] `RC-BKP-012` Operator knows that Netlify rollback does not restore backend data.
- [ ] `RC-BKP-013` Provider disk snapshot is secondary, not primary SQLite recovery.
- [ ] `RC-BKP-014` Restore authority remains platform-administrator-only after approved request.
- [ ] `RC-BKP-015` Recovery-time and recovery-point targets are understood.

Backup evidence:

```text
Backup ID:
Created at:
Retention class:
Verification:
Offsite object verification:
Restore drill ID/date:
Restore duration:
Known recovery limitation:
```

---

# Part 14 - Staging Release-Candidate Gate

- [ ] `RC-STG-001` Staging frontend runs the exact proposed frontend commit.
- [ ] `RC-STG-002` Staging backend runs the exact proposed backend commit.
- [ ] `RC-STG-003` Unchanged component commit is explicitly recorded and compatible.
- [ ] `RC-STG-004` Staging schema and migration checksum set match the candidate.
- [ ] `RC-STG-005` Staging environment and database identities are not production.
- [ ] `RC-STG-006` Two-league fixtures and roles are complete.
- [ ] `RC-STG-007` Deployed CORS, cookies, CSRF, and Socket.IO tests pass.
- [ ] `RC-STG-008` Account email capture/sandbox flows pass.
- [ ] `RC-STG-009` NHL provider success/failure behavior passes.
- [ ] `RC-STG-010` Scheduled-job and restart behavior pass.
- [ ] `RC-STG-011` Backup and restore rehearsal pass.
- [ ] `RC-STG-012` Manual QA recommendation is pass.
- [ ] `RC-STG-013` Rollback rehearsal uses exact prior frontend/backend candidates.
- [ ] `RC-STG-014` No staging defect invalidates earlier evidence.
- [ ] `RC-STG-015` Candidate is frozen against unrelated change.

---

# Part 15 - Deployment Plan and Rollback Gate

- [ ] `RC-DPL-001` Exact Netlify site and intended deploy ID are recorded.
- [ ] `RC-DPL-002` Exact Render service and intended commit/deploy are recorded.
- [ ] `RC-DPL-003` Render production auto-deploy is planned `Off`.
- [ ] `RC-DPL-004` Netlify auto-publishing lock procedure is prepared.
- [ ] `RC-DPL-005` Release order matches `D0` through `D5`.
- [ ] `RC-DPL-006` Backend expansion remains compatible with currently published frontend.
- [ ] `RC-DPL-007` New frontend remains compatible with intended backend.
- [ ] `RC-DPL-008` Long-lived previous frontend behavior is handled.
- [ ] `RC-DPL-009` Maintenance requirement is decided.
- [ ] `RC-DPL-010` User communication/maintenance page is prepared when required.
- [ ] `RC-DPL-011` Exact health and read-only smoke requests are prepared.
- [ ] `RC-DPL-012` Exact frontend rollback deploy ID is prepared.
- [ ] `RC-DPL-013` Exact backend rollback deploy/commit is prepared.
- [ ] `RC-DPL-014` Backend rollback is compatible with current schema/data.
- [ ] `RC-DPL-015` Configuration rollback is documented separately.
- [ ] `RC-DPL-016` Database rollback or forward-recovery path is documented.
- [ ] `RC-DPL-017` Rollback triggers and decision owner are explicit.
- [ ] `RC-DPL-018` Sixty-minute observation owner is assigned.
- [ ] `RC-DPL-019` Next affected scheduled-job boundary is identified.

---

## Deployment Order

Complete:

```text
1.
2.
3.
4.
5.

Writes closed at:
Migration step:
Backend step:
Frontend step:
Read-only smoke step:
Writes reopened at:
Jobs resumed at:
First-write boundary crossed at:
Post-change backup:
```

---

## Rollback Plan

```text
Rollback decision owner:
Frontend rollback deploy ID:
Backend rollback deploy ID/commit:
Current schema compatible with old backend: yes/no
Configuration rollback:
Database recovery before first write:
Database recovery after first write:
Job/outbox/email handling:
Session/token handling:
Smoke after rollback:
Communication:
```

---

# Part 16 - Production Authorization Gate

Before authorization:

- [ ] `RC-AUT-001` Every applicable previous section is complete.
- [ ] `RC-AUT-002` Release status is `READY FOR AUTHORIZATION`.
- [ ] `RC-AUT-003` Exact commits, deploy IDs, schema, backup, window, and rollback are summarized for Grae.
- [ ] `RC-AUT-004` Open medium/low issues and limitations are summarized plainly.
- [ ] `RC-AUT-005` Production-changing actions are listed in order.
- [ ] `RC-AUT-006` Reset, migration, restore, secret, disk, domain, or deletion authority is requested separately when applicable.
- [ ] `RC-AUT-007` Grae explicitly authorizes this identified production release.
- [ ] `RC-AUT-008` Approval time and exact scope are recorded.
- [ ] `RC-AUT-009` Release status changes to `GO AUTHORIZED`.

Approval record:

```text
Release ID:
Approved production actions:
Explicit exclusions:
Approved by: Grae
Approval time:
Authority expires or must be reconfirmed when:
```

Material change after approval returns the release to `READY FOR AUTHORIZATION`.

---

# Part 17 - Production Execution Gate

## Before First Change

- [ ] `RC-EXE-001` Current production frontend and backend IDs are recorded.
- [ ] `RC-EXE-002` Current schema, database ID suffix, job state, and health are recorded.
- [ ] `RC-EXE-003` Current backup remains verified.
- [ ] `RC-EXE-004` No overlapping deploy or protected operation is active.
- [ ] `RC-EXE-005` Netlify publishing is locked.
- [ ] `RC-EXE-006` Render auto-deploy is off.
- [ ] `RC-EXE-007` Operator confirms `GO AUTHORIZED`.

---

## Maintenance and Database

When applicable:

- [ ] `RC-EXE-008` Maintenance communication is active.
- [ ] `RC-EXE-009` Backend maintenance/write block is active.
- [ ] `RC-EXE-010` Jobs, auctions, email, and outbox dispatch are paused.
- [ ] `RC-EXE-011` No in-flight mutation remains.
- [ ] `RC-EXE-012` Fresh pre-change backup is verified.
- [ ] `RC-EXE-013` Migration plan matches approved IDs/checksums.
- [ ] `RC-EXE-014` Migration/import executes once.
- [ ] `RC-EXE-015` Ledger, integrity, foreign keys, identity, and reconciliation pass.
- [ ] `RC-EXE-016` Failure has not crossed an undocumented first-write boundary.

---

## Backend

- [ ] `RC-EXE-017` Render deploy targets exact approved backend commit.
- [ ] `RC-EXE-018` Build log shows expected Node, lockfile, and commands.
- [ ] `RC-EXE-019` Persistent-disk service restart completes.
- [ ] `RC-EXE-020` Liveness passes.
- [ ] `RC-EXE-021` Readiness passes with expected environment, build, schema, and database identity.
- [ ] `RC-EXE-022` Writes and jobs remain closed until smoke gate when required.
- [ ] `RC-EXE-023` Old frontend remains contract-compatible.

---

## Frontend

- [ ] `RC-EXE-024` Netlify deploy targets exact approved frontend commit.
- [ ] `RC-EXE-025` Build log shows expected Node, lockfile, and commands.
- [ ] `RC-EXE-026` Built assets contain only approved public configuration.
- [ ] `RC-EXE-027` Exact atomic deploy is published.
- [ ] `RC-EXE-028` Production domain serves expected deploy ID.
- [ ] `RC-EXE-029` Frontend targets approved backend origin.
- [ ] `RC-EXE-030` SPA direct routes and static assets load.

If any required item fails, stop and evaluate rollback before reopening writes.

---

# Part 18 - Production Smoke and Reopen Gate

## Automated Read-Only Smoke

- [ ] `RC-SMK-001` Production frontend root and static assets load.
- [ ] `RC-SMK-002` `GET /api/v1/health/live` returns minimal liveness.
- [ ] `RC-SMK-003` `GET /api/v1/health/ready` returns minimal readiness.
- [ ] `RC-SMK-004` Approved public league metadata loads.
- [ ] `RC-SMK-005` Approved public roster loads.
- [ ] `RC-SMK-006` Public responses contain no internal path, database filename, secret, or private state.
- [ ] `RC-SMK-007` Read-only proof shows no league-domain mutation.
- [ ] `RC-SMK-008` No automated smoke account, bid, trade, activity, job, backup, or restore is created.

Example safe requests:

```powershell
curl.exe -fsS https://<backend-origin>/api/v1/health/live
curl.exe -fsS https://<backend-origin>/api/v1/health/ready
curl.exe -fsS https://<frontend-origin>/
```

The release plan supplies approved public league/team IDs without placing private IDs in a public record.

---

## Closed Authenticated Smoke

When maintenance remains active, an authorized operator verifies:

- [ ] `RC-SMK-009` Fresh sign-in/session bootstrap works.
- [ ] `RC-SMK-010` One representative authorized read per affected feature works.
- [ ] `RC-SMK-011` Cross-league request fails safely.
- [ ] `RC-SMK-012` Socket.IO authenticates and joins only authorized rooms.
- [ ] `RC-SMK-013` Active competing bids are not exposed.
- [ ] `RC-SMK-014` Operational health shows expected build, schema, job, statistics, and backup state.

No fake production mutation is used.

---

## Reopen

- [ ] `RC-SMK-015` Outbox/email dispatch is resumed deliberately.
- [ ] `RC-SMK-016` Scheduled occurrences and stale leases are reconciled.
- [ ] `RC-SMK-017` Jobs resume once without duplicate advancement.
- [ ] `RC-SMK-018` Manager/commissioner writes reopen.
- [ ] `RC-SMK-019` Maintenance mode is disabled.
- [ ] `RC-SMK-020` An authorized normal real-user action is recorded separately when required.
- [ ] `RC-SMK-021` First authoritative post-release write time is recorded.
- [ ] `RC-SMK-022` First-write boundary status is recorded.
- [ ] `RC-SMK-023` Post-migration/post-release backup is created and verified when applicable.

---

# Part 19 - Monitoring and Closeout

## Observation

- [ ] `RC-MON-001` HTTP error rate and latency remain within approved baseline.
- [ ] `RC-MON-002` No unexpected process restart occurs.
- [ ] `RC-MON-003` SQLite busy, transaction, integrity, and disk signals remain healthy.
- [ ] `RC-MON-004` Authentication and rate-limit anomalies are reviewed.
- [ ] `RC-MON-005` Socket.IO connection and authorization failures are normal.
- [ ] `RC-MON-006` Scheduled-job delay, overlap, and failure are normal.
- [ ] `RC-MON-007` Outbox backlog and email failures are normal.
- [ ] `RC-MON-008` NHL refresh remains healthy or preserves last valid data.
- [ ] `RC-MON-009` Latest backup age remains inside RPO.
- [ ] `RC-MON-010` Financial, ownership, matchup, and standings spot totals remain expected.
- [ ] `RC-MON-011` Active observation lasted at least 60 minutes.
- [ ] `RC-MON-012` Next affected scheduled-job boundary passed or has a named follow-up owner.

---

## Closeout

- [ ] `RC-CLS-001` Final frontend/backend deploy IDs are recorded.
- [ ] `RC-CLS-002` Final schema and migration checksum set are recorded.
- [ ] `RC-CLS-003` Final backup ID and verification are recorded.
- [ ] `RC-CLS-004` Maintenance start/end and first-write boundary are recorded.
- [ ] `RC-CLS-005` Production smoke results are recorded.
- [ ] `RC-CLS-006` Open issues and owners are recorded.
- [ ] `RC-CLS-007` Rollback evidence remains retained.
- [ ] `RC-CLS-008` Release notes are understandable to managers/commissioners when needed.
- [ ] `RC-CLS-009` Documentation status is updated when implemented state changed.
- [ ] `RC-CLS-010` Release reviewer confirms record completeness.
- [ ] `RC-CLS-011` Release status changes to `COMPLETE`.

---

## Completion Summary

```text
Release ID:
Outcome: COMPLETE / ROLLED BACK / FAILED
Frontend deploy:
Backend deploy:
Schema:
Backup:
Maintenance duration:
First-write boundary:
Automated smoke:
Authenticated smoke:
Observation duration:
Scheduled-job boundary:
Defects opened:
Defects remaining:
Follow-up owners:
Technical operator:
Release reviewer:
Completed at:
```

---

# Part 20 - Rollback Checklist

## Trigger

- [ ] `RC-RBK-001` Rollback trigger and evidence are recorded.
- [ ] `RC-RBK-002` Writes/jobs/outbox are closed when data safety requires it.
- [ ] `RC-RBK-003` Current failed state is preserved.
- [ ] `RC-RBK-004` First-write boundary is identified.
- [ ] `RC-RBK-005` Rollback decision owner is identified.

---

## Frontend

- [ ] `RC-RBK-006` Netlify publishing remains locked.
- [ ] `RC-RBK-007` Exact prior verified atomic deploy is published.
- [ ] `RC-RBK-008` Prior frontend is compatible with current backend.
- [ ] `RC-RBK-009` Read-only smoke passes.

---

## Backend

- [ ] `RC-RBK-010` Exact prior Render deploy/commit is selected.
- [ ] `RC-RBK-011` Prior backend is compatible with current schema/data/configuration.
- [ ] `RC-RBK-012` Operator does not assume persistent disk is rolled back.
- [ ] `RC-RBK-013` Backend liveness/readiness and old-frontend compatibility pass.

---

## Database and External Effects

- [ ] `RC-RBK-014` Pre-first-write migration rollback follows SQLite Migration.
- [ ] `RC-RBK-015` Post-first-write recovery uses forward correction or Backup and Restore.
- [ ] `RC-RBK-016` No stale JSON is reactivated after new SQLite writes.
- [ ] `RC-RBK-017` Sessions/tokens are revoked when restore requires it.
- [ ] `RC-RBK-018` Jobs, outbox, and email are reconciled.
- [ ] `RC-RBK-019` Configuration is restored separately.
- [ ] `RC-RBK-020` Post-rollback backup and evidence are retained.
- [ ] `RC-RBK-021` Release status changes to `ROLLED BACK`.

---

# Part 21 - Documentation-Only Release

For `D0`, applicable minimum:

- [ ] `RC-D0-001` Diff contains documentation only.
- [ ] `RC-D0-002` No hosted build input, configuration, dependency, source, or data file changed.
- [ ] `RC-D0-003` Markdown structure and local references pass.
- [ ] `RC-D0-004` Status/index/roadmap cross-references are reconciled.
- [ ] `RC-D0-005` No secret-like value is present.
- [ ] `RC-D0-006` Verification commands are accurate.
- [ ] `RC-D0-007` Normal repository review/merge is complete.
- [ ] `RC-D0-008` Netlify and Render deployment is recorded as not required.

The runtime, database, backup, manual QA, and production gates are `NOT APPLICABLE` only because no runtime input changed.

---

# Part 22 - Emergency Release

For `D5`:

- [ ] `RC-EMG-001` Incident ID and production impact are recorded.
- [ ] `RC-EMG-002` Change is the smallest safe correction.
- [ ] `RC-EMG-003` Unrelated cleanup is excluded.
- [ ] `RC-EMG-004` Focused reproduction and regression test pass.
- [ ] `RC-EMG-005` Staging or equivalent isolated verification passes when technically possible.
- [ ] `RC-EMG-006` Current backup is verified when data risk exists.
- [ ] `RC-EMG-007` Security and league-isolation boundaries still pass.
- [ ] `RC-EMG-008` Exact deploy and rollback IDs are recorded.
- [ ] `RC-EMG-009` Grae explicitly authorizes the emergency production action.
- [ ] `RC-EMG-010` Read-only smoke and active observation pass.
- [ ] `RC-EMG-011` Skipped normal evidence has reason, risk, owner, and deadline.
- [ ] `RC-EMG-012` Retrospective review and permanent fix are scheduled.

Emergency does not authorize improvised data repair or restore.

---

# Part 23 - Final Go/No-Go

## Recommendations

```text
Manual QA:         PASS / FAIL / INCOMPLETE
Security review:   PASS / FAIL / INCOMPLETE
Technical review:  PASS / FAIL / INCOMPLETE
Recovery review:   PASS / FAIL / INCOMPLETE
Release reviewer:  GO / NO-GO
Grae authority:    AUTHORIZED / NOT AUTHORIZED
```

---

## Go Conditions

`GO` requires:

* every applicable checklist item passed;
* every non-applicable/deferred item justified;
* no critical/high defect;
* all medium issues explicitly dispositioned;
* exact staging evidence applies to exact production commits;
* backup and restore gates pass;
* migration and rollback boundaries are understood;
* production actions are listed;
* Grae explicitly authorizes the identified release.

---

## No-Go Conditions

Set `NO-GO` when:

* a required test or manual case is missing;
* builds or deploy IDs are ambiguous;
* environment isolation is unproved;
* frontend/backend/schema compatibility is unproved;
* critical/high security or data risk exists;
* backup/restore evidence is insufficient;
* migration reconciliation differs;
* rollback cannot be executed safely;
* production authority is absent or no longer matches the release;
* the release changed after approval.

There is no penalty for a correct no-go decision.

---

## Stop Conditions During Execution

Stop immediately when:

* the wrong service, site, branch, commit, environment, disk, or database is targeted;
* production and staging identity differ from the record;
* an unexpected migration appears;
* a backup or integrity check fails;
* a secret appears in logs or browser assets;
* a cross-league access or permission bypass succeeds;
* writes continue during required maintenance;
* data reconciliation changes unexpectedly;
* jobs, auctions, matchups, outbox, or email duplicate;
* the first-write boundary is crossed unexpectedly;
* a rollback target is incompatible.

Preserve evidence and follow the rollback or incident procedure.

---

# Verification

Documentation verification:

```powershell
Get-Content docs/07-testing/RELEASE_CHECKLIST.md
Select-String -Path docs/07-testing/RELEASE_CHECKLIST.md -Pattern '^`APPROVED`$','^`NOT EVALUATED`$','RC-SRC-001','RC-BKP-001','RC-AUT-001','Production Smoke','Final Go/No-Go'
```

Expected:

* the template is approved and active, but no release is automatically ready;
* production requires Grae's explicit authorization;
* automated production smoke remains read-only;
* code, configuration, and database rollback remain separate;
* documentation creation changes no runtime or production state.
