# M3-16 - Authenticated Team Reads and Setup Team Creation

## Document Status

`COMPLETE`

## Completion Date

`2026-07-20`

## Approved Product Contract

M3-16 implemented the settled team read and direct Setup-creation boundary:

1. active league members may list and read safe same-league team summaries;
2. reads are strictly SELECT-only and hide erased and cross-league teams;
3. safe summaries contain stable identity, name, status, nullable colours and
   logo reference, version, and the safe current-manager summary;
4. only the current league commissioner may directly create a team;
5. direct creation is permitted only while the league remains in Setup;
6. input is exactly `{name}`, trimmed and limited to 35 Unicode code points;
7. normalized team names are unique within a league;
8. the current configured maximum-team count is revalidated in the write
   transaction;
9. the new team starts in `setup` with null colours/logo and no implicit
   manager assignment;
10. creation, League Activity, Security Audit, and idempotency complete or
    roll back together.

## Files Changed

### Domain, repositories, and services

* `src/domain/leagues/teamPolicy.js`
* `src/infrastructure/persistence/sqlite/SqliteTeamReadRepository.js`
* `src/infrastructure/persistence/sqlite/SqliteTeamCreationRepository.js`
* `src/application/services/leagues/createTeamReadService.js`
* `src/application/services/leagues/createTeamCreationService.js`

The read repository exposes only `listTeams` and `findTeam`. Team creation
uses current backend commissioner authority and one immediate SQLite
transaction. It handles normalized-name races through the database constraint,
replays completed results safely, and never accepts client-supplied authority,
status, colours, logo, or manager identity.

### Isolated HTTP contract

* `src/transport/http/createTeamRouter.js`

The isolated router defines:

```text
GET  /api/v1/leagues/:leagueId/teams
GET  /api/v1/leagues/:leagueId/teams/:teamId
POST /api/v1/leagues/:leagueId/teams
```

It uses the exact credentialed Origin, session, CSRF, JSON, Fetch Metadata,
request-ID, idempotency, safe-envelope, and audit-privacy boundaries. It
remains unmounted.

### Tests

* `test/foundation/teamManagementFoundation.test.js`

Tests cover exact policy validation, cross-league isolation, database-byte
immutability for reads, safe current-manager summaries, commissioner authority,
Setup-only creation, maximum-team and duplicate-name conflicts, race-time
constraint mapping, null profile fields, no implicit assignment, idempotent
replay, atomic activity/audit evidence, rollback seams, and isolated browser
HTTP failures.

## Verification Evidence

All verification used Node `24.14.1` unless stated otherwise.

```text
Focused M3-16 service/HTTP: 9/9 passed
Cumulative M3 identity and authorization: 223/223 passed
Cumulative foundation: 312/312 passed
Complete backend suite: 485/485 passed
Project JavaScript syntax: 218/218 parsed
Local import and cutover rehearsal: 20/20 passed
Compatibility route inventory: 34 total, 6 debug, 28 non-debug
M3-16 runtime mounts: 0
Generated SQLite/database artifacts: 0
Secret-literal matches in M3-16 files: 0
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
edited by M3-16, and no commit or push was performed.
