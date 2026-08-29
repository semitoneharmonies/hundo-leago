# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M7-02
```

## Work Item

```text
Explicit Database Environment Identity Provisioning
```

# Objective

Add the explicit, transaction-safe command that provisions immutable
`environment_id`, `database_id`, and `database_created_at` metadata in an
already migrated SQLite candidate. This supplies the identity required by the
M7-01 deployed opener without allowing build, startup, health, GET, or an
ordinary migration to initialize identity implicitly.

# Authority

Grae requested continued implementation of M7 on `2026-07-22`. This plan
authorizes local code and synthetic temporary-database tests only.

It does not authorize running the command against existing staging or
production data, importing a source bundle, applying the reset manifest,
migrating, deploying, committing, pushing, changing provider configuration,
or enabling jobs.

# Scope

1. Add one database-identity operation that:
   * accepts an explicit environment ID, database ID, creation timestamp, and
     intended application environment;
   * accepts only `staging` or `production`;
   * requires an existing absolute database below an explicit persistent root;
   * verifies the complete immutable migration ledger first;
   * inserts all three metadata keys in one transaction only when all are
     absent;
   * returns an exact no-write replay when all three already match;
   * rejects partial, conflicting, malformed, or duplicate state without
     changing any metadata.
2. Add a CLI wrapper with explicit flags and safe content-free JSON output.
3. Require a separate exact production confirmation flag for a production
   target. This is a technical interlock, not production authority.
4. Add a package command for the controlled operation.
5. Prove startup and all GETs remain unable to initialize identity.

# Expected Files

```text
hundo-leago-backend/package.json
hundo-leago-backend/scripts/db-initialize-environment.js
hundo-leago-backend/src/infrastructure/database/databaseIdentity.js
hundo-leago-backend/test/foundation/databaseIdentityFoundation.test.js
hundo-leago/docs/01-project/CURRENT_STATE.md
hundo-leago/docs/06-work-plans/ACTIVE_WORK_PLAN.md
hundo-leago/docs/06-work-plans/archive/M7-01_DEPLOYED_SQLITE_TARGET_RUNTIME_HEALTH_AND_SHUTDOWN_FOUNDATION.md
hundo-leago/docs/04-technical-specs/ENVIRONMENT_SETUP.md
```

# Safety Boundaries

* Tests use only unique temporary databases.
* The operation does not create a database or apply a migration.
* Production mode requires both exact production targeting and exact
  production confirmation, but this plan never supplies either to real data.
* No identity value or path is inferred from the current working directory.
* No secret or private data appears in command output.
* Existing data, provider resources, branches, and production authority remain
  unchanged.

# Completion Gate

M7-02 is complete only when:

* first initialization, exact replay, and every fail-closed case pass;
* failure after the first insert rolls back all identity keys;
* startup still refuses absent/mismatched identity and never writes it;
* focused and complete backend tests pass;
* all JavaScript syntax passes;
* protected hashes, database-artifact count, and process baseline are unchanged;
* documentation records actual evidence and activates only the next bounded M7
  step.

# Next Step Boundary

After M7-02, the next dependency-safe plan may add explicit maintenance/write
closure. Identity tooling passing does not authorize running it on staging or
production.

# Completion Evidence

Completed locally on `2026-07-22`.

```text
Focused identity and deployed-startup gate: 15/15 passed
Complete backend suite:                     842/842 passed across 226 suites
Backend JavaScript syntax:                  397/397 parsed under Node 24.14.1
Protected hashes:                           unchanged
Generated database artifacts:               0
Additional Node processes:                  0
```

The operation verifies the exact migration ledger, initializes all three
identity fields in one immediate transaction, replays exact input without a
write, rejects partial/conflicting state, rolls back injected late failure, and
requires exact database-ID confirmation in production mode. No real staging or
production command was executed.
