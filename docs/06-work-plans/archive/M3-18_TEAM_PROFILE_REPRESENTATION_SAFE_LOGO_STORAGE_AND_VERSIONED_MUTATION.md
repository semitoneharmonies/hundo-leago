# M3-18 - Team Profile Representation, Safe Logo Storage, and Versioned Mutation

## Document Status

`COMPLETE`

## Completion Date

`2026-07-20`

## Approved Product Contract

M3-18 implemented the settled team-profile workflow:

1. the current accepted manager may edit the assigned team's name, colours,
   and logo;
2. the current league commissioner may edit those fields for any same-league
   team and remains attributed as commissioner;
3. team identity, manager assignment, rosters, contracts, matchups, standings,
   and historical references remain stable;
4. names remain case-insensitively unique within a league and contain at most
   35 Unicode code points;
5. colours are either both absent or an exact canonical lowercase `#rrggbb`
   pair;
6. logos are inspected static PNG, JPEG, or WebP raster bytes stored under a
   backend-generated UUID, never a client filename or path;
7. rename adds League Activity, colour-only and logo-only changes do not, and
   every successful mutation adds separate Security Audit evidence;
8. exact `If-Match`, scoped idempotency, no-op rejection, and safe stale
   version details protect concurrent mutation;
9. member-only logo reads are strictly read-only and expose current binary
   bytes without revealing the storage object key.

## Files Changed

### Technical contract

* `docs/README.md`
* `docs/01-project/CURRENT_STATE.md`
* `docs/04-technical-specs/API_CONTRACTS.md`
* `docs/04-technical-specs/DATA_MODEL.md`
* `docs/04-technical-specs/SECURITY.md`
* `docs/06-work-plans/ACTIVE_WORK_PLAN.md`
* `docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md`

The owning specifications now define exact colours, partial PATCH input,
canonical base64, static raster formats and limits, SQLite BLOB storage,
atomic replacement/removal, safe team representation, binary serving, and
endpoint `T-125`.

### Additive migration and consumers

* `database/migrations/0005_add_team_logo_objects.sql`
* `database/reset-manifests/2026-season-1-reset.json`
* `src/infrastructure/migration/rehearseStagingCutover.js`
* `src/infrastructure/migration/resetManifest.js`
* `src/infrastructure/migration/verifyStagingImport.js`
* `src/infrastructure/persistence/sqlite/repositoryCatalog.js`
* `test/foundation/jsonImportDryRun.test.js`
* `test/foundation/resetManifest.test.js`
* `test/foundation/sqliteInitialSchema.test.js`
* `test/foundation/sqliteRepositoryFoundation.test.js`
* `test/foundation/stagingImportVerification.test.js`
* `test/foundation/teamProfileMigrationFoundation.test.js`

Migration `0005` adds immutable same-league `team_logo_objects` with strict
media metadata, dimensions, digest, exact BLOB length, and generated object
identity. Existing team rows and legacy logo references remain unchanged by
the additive migration. Data-model metadata advances to version `5`, and the
fail-closed reset/import/rehearsal consumers classify the new table.

### Domain, repository, and service

* `src/domain/leagues/teamProfilePolicy.js`
* `src/infrastructure/persistence/sqlite/SqliteTeamProfileRepository.js`
* `src/application/services/leagues/createTeamProfileService.js`
* `src/application/services/leagues/createTeamReadService.js`

The dependency-free domain policy validates exact partial requests and
inspects PNG, JPEG, and WebP structure. The application service derives the
SHA-256 digest, authorizes only the current commissioner or exact current
manager, rejects unchanged requests and duplicate names, and atomically
stores/replaces/removes logo bytes with the versioned team update, rename
activity when applicable, Security Audit, and idempotency evidence. Safe team
reads expose null or the same-league backend logo path and suppress legacy
opaque references.

### Isolated HTTP contract

* `src/transport/http/createTeamProfileRouter.js`

The isolated router defines:

```text
PATCH /api/v1/leagues/:leagueId/teams/:teamId
GET   /api/v1/leagues/:leagueId/teams/:teamId/logo
```

PATCH requires an exact quoted positive-integer `If-Match`, scoped
`Idempotency-Key`, the existing browser-security boundary, and a `768 KiB`
JSON limit. Logo GET returns the exact current bytes with stored
`Content-Type`, exact `Content-Length`, digest-backed `ETag`, `nosniff`, and
`Cache-Control: private, no-store`. The router remains unmounted.

### Tests

* `test/foundation/teamManagementFoundation.test.js`
* `test/foundation/teamProfileFoundation.test.js`
* `test/foundation/teamProfileMigrationFoundation.test.js`

Tests cover exact validation, all supported raster formats, mismatched and
animated content, byte and dimension limits, generated storage identity,
current commissioner and exact-team manager authority, cross-league and
different-team isolation, duplicate names, stale versions, no-ops,
idempotency replay/mismatch, rename-only activity, separate audit,
replacement/removal cleanup, post-logo rollback, legacy-reference privacy,
safe HTTP and browser-security errors, and serialized-database proof that
logo GET performs no writes.

## Verification Evidence

All verification used Node `24.14.1` unless stated otherwise.

```text
Focused M3-18 migration/service/HTTP: 16/16 passed
Cumulative M3 identity and authorization: 250/250 passed
Cumulative foundation: 339/339 passed
Complete backend suite: 512/512 passed
Project JavaScript syntax: 230/230 parsed
Migration/reset/import/cutover rehearsal: 45/45 passed
Compatibility route inventory: 34 total, 6 debug, 28 non-debug
M3-18 runtime mounts: 0
Generated SQLite/database artifacts: 0
Secret-literal matches in M3-18 files: 0
```

The new immutable migration hash is:

```text
database/migrations/0005_add_team_logo_objects.sql
18B6252000EE7BA7AE4706700171B0721F98E1709E217C0BAF7960030DD94E2B
```

Protected hashes remained unchanged:

```text
package-lock.json
F1EC83DBB0841B3598353D061A014D5D37D4530FD07232EA8EA2F1AD3401F067

database/migrations/0001_initial.sql
344D2E896A7E33481389DB6856674F8BBBFBE6A207BFB4D3A8878CB06DBE01B5

database/migrations/0002_add_pending_credential_setup_user_status.sql
938D1B5361CB90A7D970A163479B3E6296A84934568B40E308D718F4C3A8B373

database/migrations/0003_add_league_invitation_team_workflow.sql
96252BDC4A9C92B4053CEB657ACF41769B4BDFD0D64F5206A4D4AAC3C92950F1

database/migrations/0004_add_manager_transfer_intent.sql
9A7A0AD5B70A25C4FEB3E13F2948E58C22E5D5032DE8C61F0CFE892A397DFDC3

league-state.json
FE8017B2C0FA8244EFDBD8836CBD0DD023216CF5E4392DD0AA46C7EC66741024

players.json
C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1

league.json
D1ECA60BD28BAF13EF964DC2E0066D62D53C4D8A1F2364E022C3D7F2F8239148

league_dump.json
CF0579B71E977FC7BC8B5C34A691FAEDFB2CDD2C46A4F7DF7835A3449325E607

league_with_meta.json
1B11A2ABECF7088AF82818924CC7D54B5E9E0C809961F0C11B91E3BC2872C343
```

## Safety Result

No route was mounted, no shared database was migrated, no staging or
production service was changed, no email was sent, no frontend source was
edited by M3-18, and no commit or push was performed.
