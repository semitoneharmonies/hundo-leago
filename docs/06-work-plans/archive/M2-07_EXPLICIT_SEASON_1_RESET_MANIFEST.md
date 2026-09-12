# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-07
```

## Active Step

```text
SQLite Foundation and Migration Step 7 - Explicit Season 1 Reset Manifest
```

Grae approved continuous technical execution through the M2 gate on 2026-07-19. M2-06 passed every gate, so this exact plan activates M2-07 without another continuation prompt.

M2-07 defines and validates the approved Season 1 omission boundary. It does not execute a reset, inspect or classify current source records, transform data, import into SQLite, select application authority, or access staging or production.

---

## Objective

Commit one canonical, versioned, checksummed reset manifest and add a reusable fail-closed validator plus an explicit validation-only CLI. The manifest must name every data family that a later import may omit, every table that family can affect, how records must be proven to belong to Season 1, how counts must reconcile, and the data families that must be preserved.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/01-project/PROJECT_SCOPE.md
../hundo-leago/docs/01-project/GLOSSARY.md
../hundo-leago/docs/04-technical-specs/SQLITE_MIGRATION.md
../hundo-leago/docs/06-work-plans/archive/M2-06_SOURCE_INVENTORY_AND_BUNDLE_HASHING.md
```

Operating mode must be supplied explicitly and must equal `OFFSEASON_RESET`. Validation authority comes from the approved operating-mode reset scope; reset-execution authority is not included.

Before editing:

1. Confirm backend `stage2`, cumulative M1 through M2-06 work, and both worktrees.
2. Confirm protected JSON hashes and the absence of repository database and bundle artifacts.
3. Confirm the exact schema table catalog from migration `0001_initial.sql`.
4. Use only committed manifest metadata and synthetic temporary test manifests.
5. Stop if the step requires classifying actual records, applying omissions, importing, staging, production, or frontend work.

---

# Part 2 - Exact Scope

Create:

```text
database/reset-manifests/2026-season-1-reset.json
scripts/db-validate-reset.js
src/infrastructure/migration/resetManifest.js
test/foundation/resetManifest.test.js
```

Modify:

```text
database/README.md
package.json
```

Canonical completion records:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/06-work-plans/archive/M2-07_EXPLICIT_SEASON_1_RESET_MANIFEST.md
```

No schema, migration runner, repository, source inventory, protected JSON, import, application bootstrap, or frontend source is in scope.

---

# Part 3 - Manifest Identity and Validation Context

The committed manifest contract is:

```text
manifestId: 2026-season-1-reset-v1
manifestVersion: 1
applicableSourceBundleManifestVersion: 1
requiredOperatingMode: OFFSEASON_RESET
approvalAuthority: Grae
approvalReference: docs/01-project/OPERATING_MODE.md
approvalDate: 2026-07-14
```

The manifest checksum is lower-case SHA-256 over the canonical JSON payload with the checksum field omitted. The committed file is canonical JSON with one final newline.

Validation requires the caller to provide:

* the operating mode;
* the source-bundle manifest version;
* the manifest path for the CLI.

A mismatch fails before the manifest can be used.

---

# Part 4 - Exact Season 1 Omission Allowlist

Every omission family uses:

```text
selectionRule: source_records_explicitly_classified_as_season_1_by_the_import_transform
countTreatment: source_count_equals_reported_omitted_count
targetTreatment: do_not_insert
```

This rule is deliberately fail-closed: M2-07 does not classify records, and a later transform must prove Season 1 membership before omission.

The only allowed omission families and target tables are:

1. `season_1_season_containers`: `seasons`
2. `season_1_teams`: `teams`, `team_manager_assignments`, `team_events`
3. `season_1_rosters`: `player_ownerships`, `ownership_events`
4. `season_1_contracts`: `contracts`, `contract_years`, `contract_events`
5. `season_1_retention`: `retention_obligations`, `retention_years`
6. `season_1_buyouts`: `buyout_obligations`, `buyout_years`
7. `season_1_trades`: `trades`, `trade_assets`, `trade_events`, `future_considerations`
8. `season_1_auctions`: `auctions`, `auction_bids`, `auction_events`, `auction_resolutions`
9. `season_1_matchups`: `matchup_weeks`, `matchups`, `matchup_byes`, `matchup_roster_locks`, `matchup_roster_players`, `matchup_results`, `matchup_result_versions`, `matchup_operations`, `stat_snapshots`, `stat_snapshot_players`
10. `season_1_standings`: `standings_snapshots`, `standings_rows`, `standings_operations`
11. `season_1_competition_activity`: `league_activity`
12. `season_1_competition_operations`: `idempotency_requests`, `job_runs`, `outbox_events`, `notifications`, `operational_events`

Every family includes a non-empty reason tied to the approved clean Season 2 reset. The exact family IDs, table lists, rules, treatments, and reasons form the immutable version-1 policy. Broad families such as `all_old_data`, wildcard table names, or unlisted tables are invalid.

---

# Part 5 - Exact Preservation Policy

The manifest must explicitly preserve:

1. `player_identity`: `players`, `player_external_ids`, `player_names`, `player_source_state`
2. `league_identity_and_configuration`: `leagues`, `league_settings`
3. `player_position_corrections`: `league_player_positions`
4. `draft_assets_and_rights`: `draft_eligibility_snapshots`, `draft_eligible_players`, `draft_events`, `draft_lottery_results`, `draft_lottery_runs`, `draft_pick_ownership_events`, `draft_picks`, `draft_queue_items`, `draft_selections`, `entry_drafts`
5. `global_statistics`: `stat_sources`, `stat_refreshes`, `player_stat_totals`
6. `season_2_accounts_and_security`: `account_action_tokens`, `account_events`, `authentication_rate_limits`, `platform_roles`, `security_audit_events`, `sessions`, `user_credentials`, `users`
7. `season_2_league_access_and_controls`: `administrator_requests`, `commissioner_corrections`, `league_freezes`, `league_invitations`, `league_memberships`
8. `recovery_and_migration_evidence`: `application_metadata`, `backup_catalog`, `migration_reports`, plus source bundles, backups, snapshots, documentation, migration records, and recovery information outside the imported table set
9. `unlisted_data`: every source record or target table not explicitly allowed by one omission family

Table-backed protected families use `preserve_or_stop`. The external evidence named by `recovery_and_migration_evidence` uses `preserve_external_evidence`. Unlisted data uses `preserve_or_stop`.

The manifest also names hard-coded frontend credentials as `never_import` source material. They are not user accounts, are not migrated, and cannot authorize a reset.

---

# Part 6 - Validator Contract

`resetManifest.js` must:

* expose the immutable version-1 policy;
* reject missing, extra, malformed, duplicated, reordered, or type-invalid fields;
* reject unknown omission or protected families;
* reject changed table mappings, selection rules, count treatments, target treatments, reasons, approval metadata, or never-import declarations;
* reject overlap between omission and table-backed protected lists;
* confirm every named table exists in the current repository catalog;
* reject wildcard or broad-reset vocabulary;
* verify canonical serialization and checksum;
* require exact operating-mode and source-bundle-version context;
* return a defensive immutable result;
* use stable public error codes without manifest contents in messages.

Stable error categories include:

```text
RESET_MANIFEST_ARGUMENT_INVALID
RESET_MANIFEST_PARSE_FAILED
RESET_MANIFEST_SHAPE_INVALID
RESET_MANIFEST_CHECKSUM_MISMATCH
RESET_MANIFEST_POLICY_MISMATCH
RESET_MANIFEST_OPERATING_MODE_MISMATCH
RESET_MANIFEST_SOURCE_VERSION_MISMATCH
RESET_MANIFEST_NONCANONICAL
```

---

# Part 7 - Explicit Validation-Only Command

The command contract is:

```powershell
npm run db:validate-reset -- `
  --manifest database/reset-manifests/2026-season-1-reset.json `
  --operating-mode OFFSEASON_RESET `
  --source-bundle-version 1
```

Rules:

* all three arguments are required;
* unknown or repeated arguments fail;
* success prints only manifest ID, version, checksum, and family counts;
* failure prints a stable code and safe message;
* the command never reads source league files, opens SQLite, or applies the manifest.

---

# Part 8 - Test Assertions

Focused synthetic tests must prove:

* the committed manifest is canonical, checksummed, exact-policy compliant, and valid in the approved context;
* checksum, content, approval, family, table, rule, treatment, reason, and ordering tampering fail closed;
* a broad family, wildcard, unlisted table, omission/protection overlap, missing protected family, duplicate item, or extra key fails;
* wrong operating mode and wrong source-bundle version fail;
* noncanonical JSON and malformed JSON fail safely;
* returned objects cannot mutate validator policy or later results;
* the CLI requires explicit context and reports only safe summary fields;
* the validation command cannot modify the manifest, protected JSON, or create a database/bundle artifact.

---

# Part 9 - Safety Rules

* Do not execute, simulate, or preview a reset against current source data.
* Do not read current protected JSON to classify records.
* Do not permit a broad, implicit, wildcard, or inferred omission.
* Do not omit players or stable player identifiers.
* Do not import hard-coded frontend credentials.
* Do not alter schema, migration, repository, source bundle, or application authority.
* Do not access staging or production.
* Preserve all prior and unrelated work.
* Do not commit, push, merge, deploy, reset, or cut over.

---

# Part 10 - Execution Sequence

1. Activate M2-07 and record safety baselines.
2. Add the exact canonical reset manifest and reusable validator.
3. Add the explicit validation-only CLI and package script.
4. Document the manifest and validation boundary.
5. Add policy, tamper, context, immutability, CLI, and non-mutation tests.
6. Run focused reset-manifest and cumulative foundation suites.
7. Run characterization and complete Node suites plus syntax and whitespace checks.
8. Reconcile protected hashes, artifacts, processes, and both worktrees.
9. Archive M2-07 and activate M2-08 deterministic ID and pure transform work.

---

# Part 11 - Verification

```powershell
node --test test/foundation/resetManifest.test.js
node --test test/foundation/*.test.js
npm.cmd run db:validate-reset -- --manifest database/reset-manifests/2026-season-1-reset.json --operating-mode OFFSEASON_RESET --source-bundle-version 1
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
git diff --check
git status --short
```

Required:

* the committed manifest and all fail-closed policy assertions pass;
* all existing tests pass;
* protected JSON hashes remain unchanged;
* no repository source bundle or database artifact appears;
* no reset, source classification, transform, import, bootstrap selection, application authority, staging, production, frontend-source, commit, push, merge, deployment, or cutover change occurs.

---

# Part 12 - Stop Conditions

Stop when:

* the approved reset scope cannot be represented as exact immutable families;
* any omitted record could bypass explicit Season 1 classification;
* the policy would omit player identities, new Season 2 accounts, recovery evidence, or unlisted data;
* a manifest change could pass without a new checksum;
* validation requires current source interpretation or reset execution;
* a fix requires schema, import, staging, production, or frontend work;
* a protected hash or unrelated local modification changes.

---

# Part 13 - Rollback

Remove only:

```text
database/reset-manifests/2026-season-1-reset.json
scripts/db-validate-reset.js
src/infrastructure/migration/resetManifest.js
test/foundation/resetManifest.test.js
```

Restore only M2-07 changes within:

```text
database/README.md
package.json
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Do not alter cumulative M1 through M2-06 or unrelated frontend work. No data rollback should be required because this step validates metadata only.

---

# Part 14 - Completion Checklist

M2-07 completes only when:

* the exact Season 1 omission allowlist is canonical, versioned, checksummed, and fail-closed;
* player identity, league identity, new Season 2 security/access data, recovery evidence, and all unlisted data are protected;
* hard-coded frontend credentials are explicitly never imported;
* the validation-only command requires approved context and cannot execute a reset;
* existing suites and safety gates pass;
* completion evidence is archived;
* work transitions to M2-08 deterministic IDs and pure transforms.

No reset execution, current-source classification, transformation, import, bootstrap selection, application authority, staging, production, frontend-source, commit, push, merge, deployment, or cutover authority is included.

---

# Completion Evidence

Completed on 2026-07-19.

Implemented:

* canonical manifest `2026-season-1-reset-v1`;
* checksum `55b4a039cb7ff6c9070822fe05c56dcb71d20508e111a14ca20c978ff2d34ffc`;
* 12 exact Season 1 omission families covering 40 target tables;
* 9 protected families covering the other 36 application tables;
* explicit preservation of all unlisted data and explicit rejection of hard-coded frontend credential material;
* reusable validation plus an explicit validation-only CLI.

Verification results:

* focused M2-07 suite: `8/8` tests passed;
* cumulative M2 foundation suite: `44/44` tests passed;
* characterization suite: `164/164` tests passed;
* complete Node suite: `216/216` tests passed across `47` suites;
* the explicit validation command, syntax checks, `git diff --check`, protected JSON hashes, artifact scan, process reconciliation, and both-worktree inspection passed.

The manifest classifies all `76` application tables exactly once. No protected JSON was read for classification or modified. No source bundle, database, reset execution, transform, import, staging, production, frontend-source, commit, push, merge, deployment, or cutover action occurred.
