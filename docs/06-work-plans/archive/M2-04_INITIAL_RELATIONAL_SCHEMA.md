# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M2-04
```

## Active Step

```text
SQLite Foundation and Migration Step 4 - Initial Relational Schema
```

Grae approved continuous technical execution through the M2 gate on 2026-07-19. M2-03 passed every gate, so this exact plan activates M2-04 without another continuation prompt.

M2-04 implements the approved target relational DDL in one immutable initial migration. It does not convert application repositories, import source JSON, or change runtime persistence authority.

---

## Objective

Implement `database/migrations/0001_initial.sql` for the complete approved Data Model and verify its structure, constraints, relationships, indexes, triggers, ledger checksum, integrity, foreign keys, deterministic rerun, and rejection behavior against disposable databases.

---

# Part 1 - Authority and Preconditions

Required reading:

```text
AGENTS.md
../hundo-leago/AGENTS.md
../hundo-leago/docs/README.md
../hundo-leago/docs/01-project/NORTH_STAR.md
../hundo-leago/docs/01-project/OPERATING_MODE.md
../hundo-leago/docs/01-project/CURRENT_STATE.md
../hundo-leago/docs/01-project/PROJECT_SCOPE.md
../hundo-leago/docs/01-project/GLOSSARY.md
../hundo-leago/docs/02-rules/LEAGUE_RULES.md
../hundo-leago/docs/02-rules/SCORING_RULES.md
../hundo-leago/docs/02-rules/PERMISSIONS.md
../hundo-leago/docs/03-product-specs/
../hundo-leago/docs/04-technical-specs/ARCHITECTURE.md
../hundo-leago/docs/04-technical-specs/DATA_MODEL.md
../hundo-leago/docs/04-technical-specs/SECURITY.md
../hundo-leago/docs/04-technical-specs/SQLITE_MIGRATION.md
../hundo-leago/docs/06-work-plans/archive/M2-03_MIGRATION_ENGINE_AND_LEDGER.md
```

Operating mode remains `OFFSEASON_RESET`; reset authority is not used.

Before editing:

1. Confirm backend `stage2`, cumulative M1 through M2-03 work, and both worktrees.
2. Record protected JSON hashes and confirm no repository database artifact.
3. Confirm Node.js `24.14.1`, driver `12.11.1`, and migration-engine gates.
4. Map every approved Data Model family and Security-owned persistence requirement to DDL.
5. Stop if a documented rule conflicts or requires an unapproved product decision.

---

# Part 2 - Exact Scope

Create:

```text
database/migrations/0001_initial.sql
test/foundation/sqliteInitialSchema.test.js
```

Modify:

```text
database/README.md
```

Canonical completion records:

```text
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
docs/06-work-plans/archive/M2-04_INITIAL_RELATIONAL_SCHEMA.md
```

No application JavaScript source, repository, bootstrap, route, service, JSON source, or frontend source is in scope.

---

# Part 3 - Required Schema Families

The migration must implement:

1. application metadata;
2. users, credentials, account-action tokens, sessions, platform roles, account events, security audit, and durable authentication rate limits;
3. leagues, settings, seasons, memberships, invitations, teams, manager assignments, and team events;
4. global players, provider IDs, aliases, source state, league positions, current ownership, and ownership history;
5. contracts, contract years, contract events, retention, and buyout obligations and schedules;
6. auctions, private bids, auction events, and durable resolution;
7. trades, typed assets, trade events, and Future Considerations;
8. Entry Draft setup, lottery, eligibility, picks, ownership history, selections, queues, and events;
9. statistics sources, refreshes, totals, snapshots, and snapshot players;
10. matchup weeks, pairings, byes, roster locks, locked players, stable results, result versions, and operations;
11. standings snapshots, rows, and operations;
12. League Activity, notifications, commissioner corrections, administrator requests, freezes, and operational events;
13. idempotency, job runs, outbox events, backup catalog, and migration reports.

---

# Part 4 - Required DDL Guarantees

Every target table must:

* use `STRICT`;
* use explicit primary keys and `NOT NULL` where absence is not meaningful;
* use integer cents for money, integer hundredths for persisted FP, and integer UTC Unix milliseconds for instants;
* constrain booleans to `0` or `1`;
* constrain documented status sets where practical;
* use positive aggregate versions;
* avoid hiding core relationships, money, ownership, permission, or status in JSON.

The schema must additionally enforce:

* global normalized email and league-name uniqueness;
* same-league composite foreign keys;
* one active season, membership, manager, owner, contract, auction, and current bid under approved scopes;
* finite roster-slot ranges and collision prevention;
* one-to-three-year contract terms and monetary reconciliation;
* two different teams in trades and matchups;
* exactly one typed trade asset shape;
* one matchup or bye assignment per team and week;
* immutable-selection and result-version identities;
* one pick and player selection per draft;
* non-negative money, statistics, FP, attempts, and schedule values;
* ledger-compatible application metadata;
* indexes beginning with `league_id` for every league-scoped query path;
* no generic cascade that silently implements team erase or league deletion.

Rules that require multi-row workflow state and cannot safely be local constraints must remain explicit service-transaction requirements and be identified by schema comments or tests.

---

# Part 5 - Test Assertions

Focused tests must prove:

* `0001_initial.sql` is discovered, checksummed, applied, and exact on rerun;
* the complete expected table family exists and every application table is `STRICT`;
* `integrity_check` is `ok` and `foreign_key_check` is empty;
* application metadata records the approved model and compatibility versions;
* global uniqueness and partial-current constraints reject duplicates;
* composite foreign keys reject cross-league users, teams, seasons, players, contracts, assets, picks, matchups, and obligations;
* roster categories, positions, slots, and collision rules pass and reject invalid rows;
* contract terms, value/AAV reconciliation, retention, buyout, money, FP, time, status, boolean, and version checks reject invalid values;
* auction, bid, trade-team, typed-asset, matchup-team, bye, draft-pick, draft-selection, and idempotency uniqueness passes;
* matchup-versus-bye cross-table assignment triggers reject conflicts;
* all league-scoped tables expose an index whose first key is `league_id`;
* migration checksum mutation fails closed;
* no repository database artifact remains.

---

# Part 6 - Safety Rules

* Apply the migration only to disposable operating-system temporary databases.
* Do not inspect or import current JSON.
* Do not connect the schema to application bootstrap or repositories.
* Do not add seed users, leagues, teams, players, credentials, or league state.
* Do not encode secrets, production paths, or environment-specific records.
* Do not implement automatic migration.
* Do not access staging or production.
* Preserve all prior and unrelated work.
* Do not commit, push, merge, deploy, reset, or cut over.

---

# Part 7 - Execution Sequence

1. Activate M2-04 and record safety baselines.
2. Add the complete ordered `0001_initial.sql`.
3. Update database source documentation.
4. Add structural, integrity, relationship, uniqueness, and rejection tests.
5. Apply the migration repeatedly to clean temporary files.
6. Run focused foundation tests.
7. Run characterization and complete Node suites plus syntax and whitespace checks.
8. Reconcile protected hashes, database artifacts, processes, and both worktrees.
9. Archive M2-04 and activate M2-05 repository conversion.

---

# Part 8 - Verification

```powershell
node --test test/foundation/sqliteInitialSchema.test.js
node --test test/foundation/nodeRuntimeFoundation.test.js test/foundation/sqliteConnectionFoundation.test.js test/foundation/sqliteMigrationFoundation.test.js test/foundation/sqliteInitialSchema.test.js
npm.cmd run test:characterization
npm.cmd test
npm.cmd run check
git diff --check
git status --short
```

Required:

* all schema, migration, integrity, foreign-key, uniqueness, constraint, index, trigger, checksum, and cleanup assertions pass;
* all existing tests pass;
* protected JSON hashes remain unchanged;
* no repository database artifact remains;
* no repository conversion, source-data import, bootstrap, authority, staging, production, frontend-source, commit, push, merge, deployment, reset, or cutover occurs.

---

# Part 9 - Stop Conditions

Stop when:

* approved documents conflict on a required relationship or invariant;
* the DDL cannot enforce a required local invariant safely;
* migration, integrity, foreign-key, strict-table, index, or rejection checks fail;
* a fix requires application repository or source-data work;
* a protected hash or unrelated local modification changes;
* completion requires staging, production, or frontend changes.

---

# Part 10 - Rollback

Remove only:

```text
database/migrations/0001_initial.sql
test/foundation/sqliteInitialSchema.test.js
```

Restore only M2-04 changes within:

```text
database/README.md
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/06-work-plans/ACTIVE_WORK_PLAN.md
```

Do not alter cumulative M1 through M2-03 or unrelated frontend work. No data rollback should be required because every migrated database is a disposable temporary fixture.

---

# Part 11 - Completion Checklist

M2-04 completes only when:

* the complete approved target schema is versioned in `0001_initial.sql`;
* strictness, relationships, constraints, indexes, triggers, integrity, foreign keys, checksum, rerun, and cleanup gates pass;
* no seed or source data exists;
* application JSON authority and behavior remain unchanged;
* existing suites and safety gates pass;
* completion evidence is archived;
* work transitions to M2-05 SQLite repositories behind existing service interfaces.

No repository conversion, source-data import, bootstrap, application-authority, staging, production, frontend-source, commit, push, merge, deployment, reset, or cutover authority is included.

---

# Part 12 - Completion Evidence

Created:

```text
database/migrations/0001_initial.sql
test/foundation/sqliteInitialSchema.test.js
```

Modified:

```text
database/README.md
```

Verified on 2026-07-19:

* one immutable migration created all 76 approved application tables plus the strict migration ledger;
* every application table and the ledger reported `STRICT`;
* `application_metadata` recorded data-model and application-compatibility version `1`;
* all 13 approved schema families were represented;
* composite same-league foreign keys, partial-current uniqueness, roster-slot constraints, contract reconciliation, typed trade assets, draft identities, matchup/bye triggers, and deferred circular-pointer triggers passed focused rejection tests;
* every table containing `league_id` exposed an index whose first key is `league_id`;
* exact rerun changed neither the schema ledger nor its checksum;
* an exact-byte migration mutation failed with `MIGRATION_CHECKSUM_MISMATCH`;
* `PRAGMA integrity_check` returned exactly `ok`;
* `PRAGMA foreign_key_check` returned zero rows;
* 8 of 8 M2-04 focused schema checks passed;
* 22 of 22 cumulative M2 foundation checks passed;
* 164 of 164 characterization tests passed;
* 194 of 194 complete Node test entries passed across 44 suites;
* syntax, whitespace, protected hashes, temporary cleanup, no-running-process, and no-repository-database-artifact checks passed;
* no application source, repository composition, JSON authority, source import, staging, production, frontend source, commit, push, merge, deployment, reset, or cutover changed.

Outcome:

```text
SQLite Foundation and Migration Step 4: COMPLETE
Milestone M2: IN PROGRESS
Next implementation plan: M2-05
```
