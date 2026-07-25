# M3-15 - Invitation Acceptance and Initial-Team Workflow

## Document Status

`COMPLETE`

## Completion Date

`2026-07-20`

## Approved Product Contract

Grae approved Option 1 on 2026-07-20:

1. `create_team` invitations contain an existing user ID and no team ID;
2. their acceptance requires one valid team name and atomically activates the
   invited membership, creates the Setup team, and accepts its manager
   assignment;
3. `manage_team` invitations contain an existing user ID and one same-league
   unassigned team ID;
4. their acceptance uses an empty body and atomically activates the invited
   membership and accepts the manager assignment for that exact team;
5. existing active members use the separate manager-assignment workflow;
6. initial team colours and logo are `null`;
7. general invitations use the non-expiring timestamp sentinel;
8. decline ends the never-active membership and grants no authority.

## Files Changed

### Persistence

* `database/migrations/0003_add_league_invitation_team_workflow.sql`
* `src/infrastructure/migration/rehearseStagingCutover.js`
* `src/infrastructure/migration/verifyStagingImport.js`

Migration 0003 rebuilds `league_invitations` with nullable workflow and team
intent while preserving every existing commissioner proposal as
`workflow = NULL` and `team_id = NULL`. It enforces the approved workflow/team
combinations and a same-league composite team foreign key. Accepted
`create_team` invitations retain the authoritative created team ID for safe
replay. Both invitation indexes are restored and `data_model_version` advances
to `3`.

### Domain, repository, and service

* `src/domain/leagues/leagueInvitationPolicy.js`
* `src/infrastructure/persistence/sqlite/SqliteLeagueInvitationRepository.js`
* `src/application/services/leagues/createLeagueInvitationService.js`

The implementation validates exact request shapes, stable IDs, opaque
idempotency keys, and the approved 35-code-point team-name limit. It reloads
current commissioner or invited-user authority, rejects active-member
invitations, validates same-league unassigned teams, revalidates maximum team
count and conflicts at acceptance, and saves each command in one immediate
SQLite transaction. Notification, League Activity, Security Audit, and
idempotency evidence share the transaction. Reads are SELECT-only and expose no
email, session, token, credential, digest, or client-supplied authority.

### Isolated HTTP contract

* `src/transport/http/createLeagueInvitationRouter.js`

The isolated router defines:

```text
POST /api/v1/leagues/:leagueId/invitations
GET  /api/v1/league-invitations/:invitationId
POST /api/v1/league-invitations/:invitationId/accept
POST /api/v1/league-invitations/:invitationId/decline
```

It uses the exact credentialed Origin, session, CSRF, JSON, Fetch Metadata,
request-ID, safe-envelope, and audit-privacy boundaries. It remains unmounted.

### Tests and schema consumers

* `test/foundation/leagueInvitationWorkflowMigrationFoundation.test.js`
* `test/foundation/leagueInvitationFoundation.test.js`
* `test/foundation/jsonImportDryRun.test.js`
* `test/foundation/sqliteInitialSchema.test.js`
* `test/foundation/sqliteRepositoryFoundation.test.js`

Schema-version consumers now expect version `3`. Tests cover upgrade
compatibility, workflow constraints, cross-league rejection, exact bodies,
current authority, idempotent creation and terminal replay, private safe reads,
both acceptance workflows, decline without authority, race/conflict
revalidation, and rollback at every invitation, acceptance, decline, and
Security Audit seam.

## Verification Evidence

All verification used Node `24.14.1` unless stated otherwise.

```text
Focused M3-15 migration/service/HTTP: 17/17 passed
Cumulative M3 identity and authorization: 214/214 passed
Cumulative foundation: 303/303 passed
Complete backend suite: 476/476 passed
Project JavaScript syntax: 211/211 parsed
Compatibility route inventory: 34 total, 6 debug, 28 non-debug
M3-15 runtime mounts: 0
Generated SQLite/database artifacts: 0
Secret-literal matches in M3-15 files: 0
```

The local import and cutover-rehearsal compatibility gate also passed `20/20`
against schema version `3`.

Protected hashes remained unchanged:

```text
package-lock.json
F1EC83DBB0841B3598353D061A014D5D37D4530FD07232EA8EA2F1AD3401F067

database/migrations/0001_initial.sql
344D2E896A7E33481389DB6856674F8BBBFBE6A207BFB4D3A8878CB06DBE01B5

database/migrations/0002_add_pending_credential_setup_user_status.sql
938D1B5361CB90A7D970A163479B3E6296A84934568B40E308D718F4C3A8B373

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

New immutable migration checksum:

```text
database/migrations/0003_add_league_invitation_team_workflow.sql
96252BDC4A9C92B4053CEB657ACF41769B4BDFD0D64F5206A4D4AAC3C92950F1
```

## Safety Result

No route was mounted, no server was started outside isolated tests, no shared
database was migrated, no staging or production service was changed, no email
was sent, no frontend source was edited, and no commit or push was performed.
