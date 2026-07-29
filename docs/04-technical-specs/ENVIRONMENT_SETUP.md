# Hundo Leago - Environment Setup

## Document Status

`APPROVED`

This technical specification defines:

* the local, automated-test, staging, and production environments;
* frontend and backend runtime, branch, hosting, storage, and configuration boundaries;
* the authoritative environment-variable names and validation rules;
* secret handling, persistent storage, email, NHL-data, job, debug, and observability behavior;
* setup and promotion safeguards that prevent one environment from reaching another environment's data;
* technical environment decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the environment-setup decisions and approved adoption of the resulting design on 2026-07-18.

---

## Technical Purpose

Hundo Leago currently has local development and live Netlify and Render deployments, but it does not yet have a fully isolated and reproducible staging environment.

Season 2 adds:

* secure user accounts;
* multiple leagues;
* SQLite authority;
* scheduled jobs;
* email delivery;
* encrypted backups;
* coordinated frontend and backend releases.

Those systems cannot safely depend on implicit defaults or a developer remembering which files belong to which environment.

Every running process must know its environment, use only that environment's resources, and fail before accepting traffic when required configuration is missing or contradictory.

---

## Out of Scope

This specification does not:

* create or change a Netlify site;
* create or change a Render service or persistent disk;
* read, copy, rotate, or reveal an existing secret;
* deploy either repository;
* migrate production JSON to SQLite;
* restore or reset production data;
* define the complete deployment procedure;
* select a commercial email or object-storage vendor;
* authorize coding beyond the active work plan.

Provider setup and production changes require their own contained work plan and verification.

---

# Part 1 - Authority and Operating Context

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/SQLITE_MIGRATION.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/07-testing/TESTING_STRATEGY.md
docs/08-operations/BACKUP_AND_RESTORE.md
```

Security owns secrets, cookies, browser protections, authentication, and authorization. SQLite Migration owns database initialization and migration. Backup and Restore owns backup artifacts and recovery. This document owns environment identity and resource separation.

---

## Reviewed Operating Mode

```text
OFFSEASON_RESET
```

Local and staging setup may proceed through approved work plans. Production data, secrets, services, and domains remain protected.

Nothing in this document authorizes changing the current live environment.

---

## Reviewed Hosting

```text
Frontend: React 19 + Vite 7 on Netlify
Backend:  Node.js + Express + Socket.IO on Render
Database: SQLite on a Render persistent disk
```

The initial backend remains one Node process and one Render service instance.

This is required because a Render persistent disk is attached to one service instance and the approved SQLite design has one application writer.

---

# Part 2 - Environment Topology

## Approved Environments

Hundo Leago has exactly four application environment classes:

| Environment | Purpose | Mutable data | Real users | External email | Scheduled jobs |
| --- | --- | --- | --- | --- | --- |
| `local` | Developer implementation and focused manual checks | Local disposable or copied data only | No | Captured or disabled | Disabled by default |
| `test` | Automated unit, integration, contract, migration, and browser tests | Temporary synthetic data only | No | Captured in memory or temporary files | Controlled explicitly by tests |
| `staging` | Integrated release rehearsal and recovery drills | Staging-only persistent data | Test accounts only | Capture, sandbox, allowlist, or explicitly approved staging send | Enabled only for the scenario under test |
| `production` | Live Hundo Leago leagues | Production persistent data | Yes | Send mode | Enabled as approved |

`development`, `preview`, `demo`, and a developer's machine name are not additional environment classes.

A Netlify deploy preview is a build context, not an authorized Hundo Leago backend environment.

---

## Isolation Rule

Every environment has its own:

* frontend origin;
* backend origin;
* configuration;
* secrets;
* database path;
* persistent files;
* encryption keys;
* backup namespace;
* users and sessions;
* leagues and teams;
* email-delivery mode;
* job enablement;
* logs and alerts.

Production and staging must never share:

* a Render service;
* a Render persistent disk;
* a SQLite database;
* an object-storage prefix;
* an authentication secret;
* a rate-limit secret;
* an audit-metadata secret;
* a backup-encryption key;
* an email API credential;
* an administrator bootstrap token.

Changing a URL does not make shared storage safe.

---

## No Cross-Environment Fallback

The application must not fall back from a missing local or staging resource to:

* a production URL;
* a production database;
* a production backup bucket or prefix;
* a production secret;
* a production email provider configuration.

Missing required configuration causes startup or build failure.

---

# Part 3 - Repositories, Branches, and Promotion

## Repositories

```text
Frontend and documentation: hundo-leago
Backend:                    hundo-leago-backend
```

The repositories remain independently buildable and deployable.

Release compatibility is coordinated through API contracts and a release plan, not by copying one repository into the other.

---

## Long-Lived Deployment Branches

Target branch ownership:

| Branch | Purpose | Automatic deployment |
| --- | --- | --- |
| `main` | Production release history | Production only |
| `staging` | Integrated release-candidate history | Staging only |
| focused work branch | One reviewed change or contained plan | No persistent environment by default |

The current backend `stage2` branch remains a temporary refactor branch. It does not become a production or staging deployment authority merely because it exists.

The current frontend `docs/summer-2026-foundation` branch remains a documentation work branch.

---

## Promotion Rule

Normal promotion is:

```text
focused branch -> reviewed merge to staging -> staging verification
staging-approved commits -> reviewed production release to main
```

The frontend and backend release record must identify both commit SHAs.

Production does not receive:

* an unreviewed work branch;
* a developer's local build;
* staging data;
* a different untested source commit;
* a database file bundled into an application build.

Where a platform rebuild is unavoidable, the source commit, lockfile, runtime version, build command, and environment contract must remain identical to the tested release candidate.

---

## Preview Builds

Netlify branch deploys and deploy previews may build the frontend.

They do not automatically receive:

* credentialed access to staging;
* an added CORS origin;
* staging cookies;
* production API access;
* private environment variables.

A preview requiring live backend interaction needs an explicitly reviewed origin and disposable test context. Otherwise it uses mocks or remains a static visual review.

Preview origins are removed from any allowlist when the preview is no longer needed.

---

# Part 4 - Runtime and Dependency Foundation

## Node Version

Both repositories target:

```text
Node.js 24.14.1
```

The backend additionally pins:

```text
better-sqlite3 12.11.1
```

Each repository must contain:

```text
.node-version
package.json engines.node: >=24.14.1 <25
```

The exact backend SQLite driver version belongs in the lockfile and package manifest without a floating range.

Local development, tests, Netlify builds, and Render builds must use the same Node major and approved version.

---

## Package Installation

CI and hosted builds use:

```powershell
npm ci
```

`npm install` is used only when intentionally changing dependencies and the lockfile.

A dependency or lockfile change is reviewed as part of the focused implementation step.

---

## Ports

Local defaults:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

Render supplies the deployed backend `PORT`.

The backend must bind to the provider-supplied port and must not require a hard-coded production port.

---

# Part 5 - Local Environment

## Local Repository Files

Safe local configuration files:

```text
hundo-leago/.env.local
hundo-leago-backend/.env.local
```

Safe committed templates:

```text
hundo-leago/.env.example
hundo-leago-backend/.env.example
```

The templates contain:

* variable names;
* safe local examples;
* comments describing purpose;
* no production domain unless it is intentionally public;
* no password, token, private key, access key, or real email credential.

`.env`, `.env.*`, and `*.local` remain ignored except for deliberately unignored example templates.

---

## Local Storage

Target local mutable storage:

```text
hundo-leago-backend/.data/local/hundo-leago.sqlite3
hundo-leago-backend/.data/local/backups/
hundo-leago-backend/.data/local/email-capture/
```

The backend `.gitignore` must ignore:

```text
.data/
*.sqlite3
*.sqlite3-shm
*.sqlite3-wal
```

Local storage is not production authority.

A copied production artifact must be:

* explicitly authorized;
* encrypted in transit;
* placed outside Git;
* treated as sensitive;
* sanitized when practical;
* deleted through the applicable recovery or testing work plan.

Normal development uses synthetic data.

---

## Local Startup

Target commands:

```powershell
# Backend repository
npm ci
npm run dev

# Frontend repository
npm ci
npm run dev
```

The backend development command loads `.env.local` through the approved Node startup script or an equivalent explicit local launcher.

Production must not depend on a committed `.env` file or on a local-only dotenv side effect.

---

## One-Command Disposable Manual-QA Site

For local feature and browser testing against the deterministic M7 fixture,
start both repositories from one PowerShell terminal:

```powershell
Set-Location E:\hundo-leago-backend
$env:M7_RELEASE_QA_PASSWORD = 'choose a local test-only password'
npm.cmd run release:qa:site
```

Use `npm.cmd` on Windows so a PowerShell execution policy that blocks
`npm.ps1` does not block the command.

The launcher:

* creates a unique synthetic SQLite fixture below the operating-system
  temporary directory;
* starts the target backend on an available loopback port;
* starts the sibling Vite frontend at `http://127.0.0.1:5173`;
* prints all nine test-account email addresses and their expected access;
* uses the value of `M7_RELEASE_QA_PASSWORD` for every fixture account without
  printing that value;
* keeps scheduled jobs disabled, email capture-only, and the NHL provider
  disabled;
* does not read or modify local, staging, or production league storage.

Keep the terminal open while testing. Press `Ctrl+C` once when finished. The
launcher closes the frontend and backend and deletes only its own temporary
fixture directory.

If port `5173` is already in use, stop the other local frontend and run the
command again. A startup failure closes any resource the launcher already
opened.

This command is for disposable local QA only. Its password is not a production
secret and must not be committed to Git.

---

# Part 6 - Automated-Test Environment

## Test Storage

Every test run creates a unique directory under the operating system temporary directory.

The test process supplies explicit paths for:

* SQLite;
* JSON compatibility fixtures;
* backups;
* captured email;
* generated reports.

Tests must not infer storage from the current working directory.

Tests must refuse a path that:

* resolves to a configured production or staging database;
* is outside the created temporary test root;
* uses an environment marked `production` or `staging`;
* contains the production environment identity.

---

## Test Process Defaults

```text
APP_ENV=test
NODE_ENV=test
EMAIL_DELIVERY_MODE=capture
ACCOUNT_EMAIL_DELIVERY_ENABLED=false
SESSION_COOKIE_SAME_SITE=lax
SCHEDULED_JOBS_ENABLED=false
DEBUG_ROUTES_ENABLED=false
```

Individual job and debug tests enable only the exact capability they exercise.

Time, randomness, provider responses, and email are controlled by the test harness.

Playwright starts dedicated local frontend and backend processes against synthetic temporary state.

---

# Part 7 - Staging Environment

## Required Staging Resources

Staging requires:

* a dedicated Netlify site;
* a dedicated Render web service;
* one dedicated Render persistent disk;
* a staging-only SQLite database;
* a staging-only offsite-backup namespace;
* staging-only secrets;
* test users and test leagues;
* staging-only account-email configuration;
* staging logs and alerts.

The staging Render service must not have the production disk attached and must not possess production storage credentials.

---

## Staging Data

Staging normally uses:

* deterministic synthetic fixtures;
* two or more test leagues;
* duplicate display names across leagues;
* representative rosters, contracts, auctions, trades, matchups, jobs, and recovery state.

When a production-shaped migration rehearsal is required, it uses an explicitly approved, encrypted copy and the migration plan's handling rules.

Staging data is never promoted into production.

---

## Staging Integrations

Default behavior:

```text
Email:       capture, sandbox, or allowlist; approved public sign-up testing may use staging send
NHL data:    recorded fixtures or controlled cache
Jobs:        disabled unless a scenario enables them
Debug routes: disabled unless a focused test enables them
Backups:     staging namespace and staging key only
```

A focused staging smoke may call the real public NHL data provider, but failure of that provider must not erase the last valid cache.

Staging must not send bulk or system-initiated email to production user lists.
User-initiated staging account flows may send only to addresses submitted or
verified in staging.

---

# Part 8 - Production Environment

## Required Production Resources

Production requires:

* a dedicated Netlify production site and domain;
* a dedicated Render production web service;
* one paid Render persistent disk;
* the production SQLite database under that disk's mount;
* production-only managed secrets;
* encrypted offsite backup storage;
* production email credentials;
* production logs, health monitoring, and alerts.

Only the approved production service can access the production disk.

---

## Production Disk Layout

Approved mount:

```text
/opt/render/project/data
```

Approved application paths:

```text
/opt/render/project/data/hundo/hundo-leago.sqlite3
/opt/render/project/data/hundo/backups/
/opt/render/project/data/hundo/operations/
```

`DATABASE_PATH` is:

```text
/opt/render/project/data/hundo/hundo-leago.sqlite3
```

SQLite `-wal` and `-shm` sidecars reside beside the database.

Only paths under the disk mount survive Render restarts and deploys. Source, temporary build files, and paths elsewhere in the runtime filesystem are ephemeral.

---

## Single-Instance Rule

The production backend starts as one instance.

Do not increase the Render instance count while SQLite and the attached persistent disk remain authoritative.

Jobs run inside the same backend process through durable occurrence, lease, and idempotency records.

A future multi-instance design requires a separately approved storage and job architecture.

---

# Part 9 - Frontend Configuration Contract

## Approved Vite Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_APP_ENV` | Yes | Public environment label: `local`, `staging`, or `production` |
| `VITE_API_ORIGIN` | Yes | Absolute backend HTTP origin, with no path suffix |
| `VITE_SOCKET_ORIGIN` | Yes | Absolute Socket.IO origin; normally the same backend origin |
| `VITE_BUILD_ID` | Deployed builds | Public frontend commit or release identifier |

All `VITE_` values are public and may be embedded in browser assets.

No secret may use a `VITE_` prefix.

---

## Frontend Validation

The frontend validates configuration once before rendering.

Validation requires:

* a recognized environment;
* absolute `http://` or `https://` origins;
* HTTPS outside local development;
* no trailing API route such as `/api`;
* no production backend origin in a non-production build;
* no local backend origin in a deployed build;
* a build ID in staging and production.

Invalid configuration renders a non-sensitive startup error and does not issue feature requests.

---

## Compatibility Variables

Current variables:

```text
VITE_API_URL
VITE_SOCKET_URL
VITE_STATS_URL
VITE_DISABLE_AUTOSAVE
```

are compatibility inputs only.

They must be inventoried during `FE-00`, mapped deliberately where still required, and removed after all callers use the approved configuration module.

`VITE_DISABLE_AUTOSAVE` must not survive as a production safety boundary. The target frontend does not broadly autosave an authoritative league object.

---

# Part 10 - Backend Configuration Contract

## Core Runtime Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_ENV` | Yes | `local`, `test`, `staging`, or `production` |
| `NODE_ENV` | Yes | Node runtime mode; `production` for staging and production hosted services |
| `APP_BUILD_ID` | Deployed services | Backend commit or release identifier |
| `FRONTEND_BUILD_ID` | Deployed services | Exact compatible frontend commit or release identifier |
| `APP_ENVIRONMENT_ID` | Deployed services | Opaque immutable environment identity expected in SQLite |
| `DATABASE_ID` | SQLite environments | Opaque immutable database identity expected in SQLite |
| `PORT` | Hosted service | HTTP listener port supplied by Render |
| `DATABASE_PATH` | SQLite environments | Absolute SQLite database path |
| `PERSISTENT_DATA_ROOT` | Deployed services | Absolute persistent-disk root containing the database |
| `CURRENT_SEASON_LABEL` | Yes | Four-digit current fantasy-season start year |
| `CURRENT_NHL_SEASON_KEY` | Yes | Eight-digit NHL season key matching the current-season label |
| `PUBLIC_FRONTEND_ORIGIN` | Yes | Canonical browser origin used in links and security decisions |
| `FRONTEND_ORIGINS` | Yes | Comma-separated exact allowed browser origins |
| `LOG_LEVEL` | Yes | Approved structured-log threshold |
| `SESSION_COOKIE_SAME_SITE` | Yes | Explicit `lax` or `none`; must match the deployed frontend/API site relationship |
| `ACCOUNT_EMAIL_DELIVERY_ENABLED` | Yes | Explicit `true` or `false`; controls only the durable account-email worker |
| `SCHEDULED_JOBS_ENABLED` | Yes | Explicit `true` or `false`; no truthy string coercion |
| `DEBUG_ROUTES_ENABLED` | Yes | Explicit `true` or `false` |
| `EMAIL_DELIVERY_MODE` | Yes | `disabled`, `capture`, `sandbox`, `allowlist`, or `send` |
| `STAGING_EMAIL_RECIPIENT_ALLOWLIST` | Staging allowlist mode only | Comma-separated exact test recipients approved to receive staging account email |
| `SPORTSDATAIO_NHL_API_KEY` | Staging-only managed secret | SportsDataIO Discovery Lab server credential; never exposed to the browser or logs |
| `SPORTSDATAIO_NHL_LAST_SEASON_START_YEAR` | Required when the SportsDataIO staging secret is set | Four-digit start year for the approved last-season dataset |
| `SPORTSDATAIO_NHL_API_ORIGIN` | Optional staging-only non-secret | Canonical SportsDataIO Discovery Lab NHL fantasy origin; defaults to `https://api.sportsdata.io/api/nhl/fantasy` |

Whitespace is trimmed. Empty required values are invalid.

Boolean values accept only `true` or `false`.

Unknown enum values fail startup.

---

## Security Variables

| Variable | Environment | Purpose |
| --- | --- | --- |
| `RATE_LIMIT_KEY_SECRET` | Staging and production | HMAC key for privacy-preserving durable rate-limit keys |
| `AUDIT_METADATA_SECRET` | Staging and production | HMAC key for protected audit metadata |
| `ACTION_TOKEN_DELIVERY_KEY` | Staging and production | Versioned 32-byte AES-256-GCM key for short-lived encrypted account-link outbox envelopes |
| `RESEND_API_KEY` | Staging sandbox/allowlist/send and production send modes | Environment-specific send-only Resend authentication |
| backup variables defined by Backup and Restore | Staging and production | Encryption and offsite storage |

Secrets:

* are generated independently per environment;
* are stored in Render's managed environment configuration or an approved secret store;
* are never logged;
* are never returned by health endpoints;
* are never placed in Netlify browser variables;
* are never committed to Git;
* have documented rotation and previous-key handling where required.

`ACTION_TOKEN_DELIVERY_KEY` is an unpadded canonical base64url value that
decodes to exactly 32 bytes. It is generated independently per environment.
Its initial key version is `1`; a rotation that introduces another version
requires an explicit key-ring transition and proof that no pending envelope
still needs a removed version.

---

## Email Variables

The email adapter owns provider-specific credentials.

Portable application configuration includes:

```text
EMAIL_DELIVERY_MODE
ACCOUNT_EMAIL_DELIVERY_ENABLED
EMAIL_FROM
EMAIL_REPLY_TO
RESEND_API_KEY
STAGING_EMAIL_RECIPIENT_ALLOWLIST
PUBLIC_FRONTEND_ORIGIN
ACTION_TOKEN_DELIVERY_KEY
```

Rules:

* Resend is the approved transactional provider;
* `ACCOUNT_EMAIL_DELIVERY_ENABLED` controls only delivery of durable account
  email and does not enable auction, trade, matchup, or league-outbox jobs;
* `production` requires `send` with a verified sender and a send-only
  `RESEND_API_KEY`;
* `staging` may use `capture`, `sandbox`, `allowlist`, or explicitly approved
  `send`; staging send uses staging-only credentials, a verified staging
  sender, durable public-endpoint rate limits, and actual staging-account
  addresses;
* `local` and `test` use `capture` or `disabled`;
* `EMAIL_FROM` is required in `sandbox`, `allowlist`, and `send`; `EMAIL_REPLY_TO` is
  optional but validated when present;
* a missing or malformed provider credential in `sandbox`, `allowlist`, or `send` fails
  startup, while a provider credential in `capture` or `disabled` also fails
  closed;
* staging `sandbox` sends every provider request to Resend's non-delivering
  `delivered@resend.dev` test address rather than the account address;
* staging `allowlist` sends only when the normalized account address exactly
  matches `STAGING_EMAIL_RECIPIENT_ALLOWLIST`; every other recipient fails
  closed before a provider request;
* staging `send` requires `STAGING_EMAIL_RECIPIENT_ALLOWLIST` to be absent and
  sends only account messages produced by approved staging account workflows;
* every provider request carries the durable outbox event ID as its
  `Idempotency-Key`;
* captured email is stored only in that environment's temporary or persistent test area;
* account links use `PUBLIC_FRONTEND_ORIGIN`, never a request-supplied Host header;
* pending account-action links are recoverable only through the approved
  encrypted outbox envelope and are cleared after terminal delivery.

---

## Backup Variables

The authoritative names are defined in `docs/08-operations/BACKUP_AND_RESTORE.md`.

The deployed backend requires and validates:

```text
BACKUP_LOCAL_DIR
BACKUP_OBJECT_ENDPOINT
BACKUP_OBJECT_REGION
BACKUP_OBJECT_BUCKET
BACKUP_OBJECT_PREFIX
BACKUP_OBJECT_ACCESS_KEY_ID
BACKUP_OBJECT_SECRET_ACCESS_KEY
BACKUP_ENCRYPTION_KEY_VERSION
BACKUP_ENCRYPTION_KEY
BACKUP_SCHEDULE_ENABLED
```

`BACKUP_LOCAL_DIR` is a normalized child of `PERSISTENT_DATA_ROOT` and is not
the live database directory. `BACKUP_OBJECT_ENDPOINT` is one canonical HTTPS
origin. The private object prefix is environment-specific, relative, and ends
with `/`; for staging the Blueprint value is `hundo-leago/staging/`.

`BACKUP_ENCRYPTION_KEY` is exactly 32 random bytes encoded as 43-character
unpadded base64url. It must be supplied as a managed secret because a generic
provider-generated string is not guaranteed to have that format. Access-key,
secret-access-key, and encryption-key values are non-enumerable in validated
configuration and must never appear in logs or JSON output.

The explicit non-interactive command surfaces are:

```powershell
npm run db:backup -- --reason manual-platform-operation
npm run db:backup:verify -- --manifest-object-key <manifestObjectKey>
npm run db:restore-verify -- --manifest-object-key <manifestObjectKey> --target <newCleanDatabasePath>
```

The existing temporary-path M2 verification arguments remain test-only
compatibility seams. A deployed restore-verification target must be a new path
inside `PERSISTENT_DATA_ROOT`; these commands do not activate or overwrite the
live database.

Production cannot start backup scheduling with staging credentials or a staging namespace.
Staging and production keep `BACKUP_SCHEDULE_ENABLED=false` until the matching
environment has produced and clean-restored a verified encrypted offsite
artifact through an approved deployment work plan.

---

## Current Backend Compatibility Variables

The current backend contains compatibility configuration including:

```text
LEAGUE_FILE
SNAPSHOT_DIR
PLAYERS_FILE
STATS_FILE
BACKUPS_DIR
MAX_BACKUPS
MATCHUPS_DEBUG
MATCHUPS_ENABLED
SNAPSHOTS_ENABLED
AUCTIONS_ENABLED
STATS_REFRESH_TOKEN
```

These variables remain under the behavior-preserving refactor until their callers move.

Rules during migration:

1. record current values by variable name only;
2. never print or copy secret values into documentation or test evidence;
3. supply explicit temporary paths in tests;
4. do not change production defaults as part of documentation work;
5. replace compatibility flags through focused feature work;
6. remove `STATS_REFRESH_TOKEN` only after secure administrator authorization replaces it;
7. remove JSON paths only after verified SQLite cutover and rollback boundaries.

Compatibility variables do not define the target environment contract.

---

# Part 11 - Startup Validation and Environment Identity

## Central Configuration Module

The backend loads environment input once into a validated immutable configuration object.

Routes, services, repositories, jobs, and adapters receive approved configuration through bootstrap. They do not read `process.env` independently.

The frontend follows the same principle through its approved configuration module.

---

## Startup Order

The backend startup sequence is:

1. parse and validate environment variables;
2. resolve canonical filesystem paths;
3. verify environment and path guards;
4. open SQLite through the approved connection factory;
5. verify database environment identity and schema compatibility;
6. initialize repositories and services;
7. acquire or resume approved job scheduling;
8. start the HTTP and Socket.IO listener;
9. report readiness.

The process must not accept application traffic before steps 1 through 7 succeed.

---

## Database Environment Identity

Each initialized SQLite database stores immutable environment metadata including:

```text
environmentId
createdAt
databaseId
```

Approved identities are environment-specific opaque values, not merely the string `production`.

At startup:

* configured identity must match stored identity;
* production refuses an uninitialized database;
* staging refuses a production database;
* test refuses staging and production databases;
* local use of a copied protected database requires an explicit recovery or migration procedure.

The identity is also included in backup manifests.

---

## Filesystem Guards

In staging and production:

* `DATABASE_PATH` must be absolute;
* the database and local backup staging directory must resolve under the approved persistent-disk mount;
* the database cannot be inside the source directory;
* the backup staging directory cannot equal the live database directory;
* symlink or traversal resolution cannot escape the approved root;
* required directories are created with restrictive permissions where the platform permits;
* the process fails if the disk is missing or not writable.

In tests, all mutable paths must resolve under the unique temporary root.

---

## Production Required-Value Rule

Production has no development fallback for:

* database path;
* frontend origin;
* CORS origins;
* environment identity;
* security secrets;
* backup encryption;
* offsite backup destination;
* email credentials when sending;
* build identity.

A configuration error blocks readiness.

---

# Part 12 - Browser and Network Boundaries

## Origin Sets

Expected origin policy:

| Environment | Allowed credentialed frontend origins |
| --- | --- |
| Local | Exact approved localhost development origin |
| Test | Exact Playwright frontend origin |
| Staging | Dedicated staging Netlify origin and any explicitly approved temporary test origin |
| Production | Canonical production frontend origin only, plus a deliberately approved custom-domain transition origin |

Wildcards are prohibited for credentialed requests.

An arbitrary Netlify preview URL is not accepted.

---

## Cookies and Proxy Handling

Cookie behavior is derived and validated according to Security:

* production cookie name uses the approved `__Host-` form;
* `Secure` is required outside local HTTP development;
* `HttpOnly` is always required;
* `SameSite=Lax` is preferred for an approved same-site topology;
* `SameSite=None; Secure` is used only when the deployed Netlify/Render topology is cross-site;
* cookie Domain is not set for a `__Host-` cookie;
* trusted proxy behavior is enabled only for the reviewed Render topology.

`SESSION_COOKIE_SAME_SITE` is required explicitly in staging and production.
Local and test runtimes use `lax`. The current staging pair is
`https://staging.hundoleago.com` and
`https://api-staging.hundoleago.com`, so staging uses `lax`. The underlying
Netlify and Render service domains remain rollback addresses, not the
application's primary browser/API pair.

These protections are not casual environment toggles.

Deployment verification must prove the actual cookie and Origin behavior from the real browser origins.

---

# Part 13 - Jobs, Debugging, and External Services

## Scheduled Jobs

`SCHEDULED_JOBS_ENABLED` is explicit in every environment.

Rules:

* local defaults to false;
* tests default to false and invoke jobs directly;
* staging enables jobs only for an owned scenario or release rehearsal;
* production enables the approved scheduler;
* durable occurrence and lease records still prevent duplicate execution;
* a second accidental process must not silently perform the same work.

Disabling scheduling does not erase pending job state.

Account-email delivery is independently controlled by
`ACCOUNT_EMAIL_DELIVERY_ENABLED`. Staging may enable that worker while
`SCHEDULED_JOBS_ENABLED=false` only under an approved plan. The plan may use
an exact-recipient `allowlist` or approved public-account `send` mode with
staging-only provider credentials and the durable authentication rate limits.
This email-only mode must not run league jobs.

---

## Debug Routes

`DEBUG_ROUTES_ENABLED` defaults to false everywhere.

Focused local or staging work may enable reviewed debug routes when:

* authentication and authorization remain enforced;
* the route cannot reach production data;
* the enablement is time-bounded;
* verification records that it was disabled afterward.

Production debug routes remain unregistered.

---

## NHL Data

The approved M7-10 staging provider is SportsDataIO Discovery Lab. Its key is
backend-only: no browser asset receives provider credentials or makes
authoritative provider requests.

Environment behavior:

* test uses fixtures;
* local normally uses fixtures or an explicitly refreshed cache;
* staging may use the explicit, maintenance-gated SportsDataIO last-season
  import after its staging-only key is configured;
* production has no SportsDataIO authorization under M7-10 and the legacy
  undocumented NHL adapter is not a deployed runtime path.

The staging importer rejects catalog or statistics responses below 800 players.
Provider failure must not replace valid cached statistics with empty or partial
data.

---

# Part 14 - Health, Logs, and Build Identity

## Public Health

The public liveness endpoint returns only enough information to prove that the process is alive.

It does not expose:

* secrets;
* filesystem paths;
* database filenames;
* user or league data;
* stack traces;
* provider credentials.

---

## Readiness

Readiness is false when:

* configuration is invalid;
* the database cannot open;
* environment identity mismatches;
* schema is newer than the application;
* an approved required migration has not been run;
* required production backup protection is unavailable at a release gate.

An authenticated operational view may expose safe values such as:

```text
environment
frontendBuildId
backendBuildId
schemaVersion
databaseId suffix
jobScheduler status
last successful backup time
last successful statistics refresh time
```

---

## Structured Logs

Every deployed log includes:

* environment;
* backend build ID;
* request or correlation ID when applicable;
* safe event name;
* safe actor and league identifiers when permitted;
* outcome and duration.

Logs must not contain:

* passwords;
* session or CSRF tokens;
* email-verification or reset tokens;
* bid values before auction resolution;
* private trade details outside authorized records;
* encryption keys;
* full backup manifests containing sensitive metadata;
* raw secret environment values.

---

# Part 15 - Setup Sequence

## Local Setup Sequence

1. Install Node `24.14.1`.
2. Clone or open both repositories.
3. Confirm the intended branches and review working-tree changes.
4. Run `npm ci` in each repository.
5. Copy `.env.example` to `.env.local` in each repository.
6. Enter local-only non-secret values and generate local-only secrets where required.
7. Confirm every mutable backend path resolves under `.data/local`.
8. Initialize or migrate only the local database through the approved command.
9. Start the backend and verify liveness and readiness.
10. Start the frontend and verify it targets only the local backend.
11. Run focused tests before making behavior changes.

Both canonical repositories pin Node through a root `.node-version` file and
the matching `package.json` engine range. On the canonical Windows workstation,
the ignored verified runtime is stored at:

```text
E:\hundo-leago\.tools\node-v24.14.1-win-x64
```

Run npm with that exact runtime from either repository through:

```powershell
E:\hundo-leago\scripts\npm-approved.cmd <npm arguments>
```

The old `C:\Users\graem\Desktop\...` repository copies are not development,
candidate, staging, or production inputs.

Do not use production values to make local startup convenient.

---

## Staging Setup Sequence

1. Approve a focused staging-infrastructure work plan.
2. Create the dedicated Netlify staging site.
3. Create the dedicated Render staging service.
4. Attach a new staging-only disk at `/opt/render/project/data`.
5. Create staging-only managed secrets and environment identity.
6. Configure the staging frontend and exact CORS origins.
7. Configure capture, sandbox, allowlist, or explicitly approved staging-send email.
8. Configure a staging-only encrypted backup namespace.
9. Deploy the reviewed staging commits.
10. Initialize a new staging database through an explicit migration command.
11. Load deterministic staging fixtures or run the approved copied-data rehearsal.
12. Verify path, identity, schema, security, job, email, and backup behavior.
13. Perform the staging restore drill defined by Backup and Restore.
14. Record service identifiers, origins, commit SHAs, schema version, and evidence without recording secrets.

---

## Production Setup Sequence

Production setup occurs only through the approved Deployment specification and a production work plan.

At minimum it must:

1. identify the currently live frontend, backend, domains, and data paths;
2. create or verify the dedicated production disk;
3. establish production-only secrets and environment identity;
4. establish verified encrypted offsite backup;
5. prove a clean staging release and restore;
6. create a pre-change production backup;
7. enter the approved maintenance window;
8. perform deterministic migration and reconciliation;
9. deploy the exact approved frontend and backend commits;
10. verify sessions, permissions, league isolation, jobs, email, statistics, and read-only health;
11. open traffic only after the release gate passes;
12. retain rollback authority until the first-write boundary is explicitly accepted.

This document does not grant that authority.

---

# Part 16 - Failure and Stop Conditions

Setup or deployment stops when:

* an environment cannot be identified unambiguously;
* staging can reach production storage;
* a non-production process contains production secrets;
* a database identity mismatches configuration;
* a mutable production path resolves outside the persistent disk;
* a secret appears in Git, build output, browser assets, or logs;
* a preview origin has broad credentialed CORS access;
* Node or the SQLite driver differs from the approved version;
* a hosted build uses a different lockfile from the reviewed commit;
* production email credentials or the production sender are enabled in staging;
* scheduled jobs can execute concurrently without durable protection;
* backup verification has not passed before a risky data operation;
* an unrelated working-tree change would be included.

The failure is corrected through a contained plan. It is not bypassed with a permissive default.

---

# Part 17 - Completion Criteria

The environment foundation is complete when:

* all four environment classes have validated configuration;
* both repositories use Node `24.14.1`;
* the backend uses exact `better-sqlite3` `12.11.1`;
* local and test storage are disposable and path-guarded;
* staging has separate Netlify, Render, disk, SQLite, secrets, users, email, and backup resources;
* production mutable data resides only under its persistent-disk mount;
* environment identity prevents cross-environment database use;
* frontend Vite configuration contains no secrets;
* backend secrets are managed outside Git;
* exact CORS and cookie behavior passes in the deployed topology;
* jobs and debug routes are explicitly controlled;
* build and schema identities are visible safely;
* staging backup and restore has been rehearsed;
* no production service or data was changed by writing this specification.

---

# External Platform References

The implementation must re-check current provider behavior when the environment is created:

* [Render persistent disks](https://render.com/docs/disks)
* [Render environment variables and secrets](https://render.com/docs/configure-environment-variables)
* [Render Node.js versions](https://render.com/docs/node-version)
* [Netlify deploy contexts](https://docs.netlify.com/build/configure-builds/file-based-configuration/#deploy-contexts)
* [Netlify build environment variables](https://docs.netlify.com/build/configure-builds/environment-variables/)
* [Netlify Node.js dependencies and versions](https://docs.netlify.com/build/configure-builds/manage-dependencies/#node-js-and-javascript)

Provider documentation describes platform capability. This specification remains the Hundo Leago policy.

---

# Verification

Documentation verification:

```powershell
Get-Content docs/04-technical-specs/ENVIRONMENT_SETUP.md
Select-String -Path docs/04-technical-specs/ENVIRONMENT_SETUP.md -Pattern '^`APPROVED`$','APP_ENV','DATABASE_PATH','VITE_API_ORIGIN','Database Environment Identity','No Cross-Environment Fallback'
```

Future local implementation verification:

```powershell
node --version
npm ci
npm test
```

Expected:

* Node reports `v24.14.1`;
* configuration validation fails closed on a cross-environment path or identity;
* automated tests use temporary synthetic storage;
* no command reads from or writes to production data.
