# M3-17 - Active-Member Team Manager Assignment, Transfer, and Removal

## Document Status

`COMPLETE`

## Completion Date

`2026-07-20`

## Approved Product Contract

M3-17 implemented the settled team-manager assignment lifecycle:

1. only the current league commissioner may propose or remove an assignment;
2. a proposal targets an existing active same-league member whose permission
   category is manager or commissioner;
3. the proposed member privately reads and accepts or declines the proposal;
4. a proposal grants no authority until acceptance;
5. a transfer records the exact current assignment it intends to replace;
6. the old manager retains authority until the replacement accepts;
7. acceptance revalidates and atomically ends the old assignment before
   accepting the replacement;
8. decline leaves current authority unchanged;
9. removal requires the exact current assignment ID and version, ends only
   that assignment, and leaves the user's session and membership active;
10. one manager may control multiple teams while each team retains at most one
    current accepted assignment.

## Files Changed

### Immutable migration

* `database/migrations/0004_add_manager_transfer_intent.sql`
* `src/infrastructure/database/migrate.js`
* `src/infrastructure/migration/rehearseStagingCutover.js`
* `src/infrastructure/migration/verifyStagingImport.js`
* `test/foundation/jsonImportDryRun.test.js`
* `test/foundation/sqliteInitialSchema.test.js`
* `test/foundation/sqliteRepositoryFoundation.test.js`

Migration `0004` rebuilds `team_manager_assignments` with nullable
`replaces_assignment_id`, a same-league composite self-reference, and a
non-self constraint. Existing records retain null transfer intent. Fresh and
upgrade migration paths, metadata version `4`, import verification, and
cutover rehearsal use the same immutable migration chain.

### Domain, repository, and service

* `src/domain/leagues/teamManagerAssignmentPolicy.js`
* `src/infrastructure/persistence/sqlite/SqliteTeamManagerAssignmentRepository.js`
* `src/application/services/leagues/createTeamManagerAssignmentService.js`

The service implements proposal, private read, acceptance, decline, transfer,
and exact current-assignment removal. Notification, League Activity, Security
Audit, and scoped idempotency evidence are transactional where applicable.
Stale transfers and stale removals write nothing.

### Isolated HTTP contract

* `src/transport/http/createTeamManagerAssignmentRouter.js`

The isolated router defines:

```text
POST   /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment
GET    /api/v1/team-manager-assignments/:assignmentId
POST   /api/v1/team-manager-assignments/:assignmentId/accept
POST   /api/v1/team-manager-assignments/:assignmentId/decline
DELETE /api/v1/leagues/:leagueId/teams/:teamId/manager-assignment
```

Proposal input is exactly `{userId}`; decision input is exactly `{}`. Removal
input is exactly `{assignmentId}` and requires a canonical quoted positive
integer `If-Match`. Stale removal returns `412 PRECONDITION_FAILED` with the
current safe version and a refetch instruction. The router remains unmounted.

### Tests

* `test/foundation/teamManagerAssignmentFoundation.test.js`
* `test/foundation/teamManagerAssignmentMigrationFoundation.test.js`

Tests cover migration preservation and constraints, active-member eligibility,
same-league isolation, current commissioner and proposed-user authority,
unassigned acceptance, old-manager authority until transfer acceptance,
atomic exact-current transfer, stale rejection, decline, multiple-team manager
support, exact removal, session and membership preservation, notification,
activity, audit, idempotency, rollback seams, safe envelopes, and browser
security failures.

## Verification Evidence

All verification used Node `24.14.1` unless stated otherwise.

```text
Focused M3-17 migration/service/HTTP: 11/11 passed
Cumulative M3 identity and authorization: 234/234 passed
Cumulative foundation: 323/323 passed
Complete backend suite: 496/496 passed
Project JavaScript syntax: 224/224 parsed
Local import and cutover rehearsal: 20/20 passed
Compatibility route inventory: 34 total, 6 debug, 28 non-debug
M3-17 runtime mounts: 0
Generated SQLite/database artifacts: 0
Secret-literal matches in M3-17 files: 0
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
edited by M3-17, and no commit or push was performed.
