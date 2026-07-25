# M3-19 - Local Target-Runtime Composition and API Integration

## Document Status

`COMPLETE`

## Completion Date

`2026-07-20`

## Approved Boundary

M3-19 composed the completed account, authorization, league, team, and
team-profile slices into one explicit local/test target runtime without
changing compatibility or production authority.

The completed boundary:

1. validates the exact migration ledger before constructing target
   dependencies and never migrates during ordinary startup;
2. opens only an explicitly named local or test SQLite database and closes it
   on composition failure or shutdown;
3. constructs the approved repositories, services, request-security boundary,
   routers, application, session cookie, Socket.IO authorization, and room
   manager from explicit dependencies;
4. declares and mounts all 36 implemented `/api/v1` method/path contracts
   exactly once through a method-aware dispatcher;
5. prevents an unrelated router's body parser or middleware from handling a
   different target endpoint;
6. attaches authenticated Socket.IO middleware once with the exact runtime
   origin configuration;
7. closes Socket.IO, HTTP, and owned SQLite resources even when another close
   operation fails;
8. remains absent from the production `server.js`, starts no jobs, and never
   reads or writes compatibility JSON.

## Files Changed

### Runtime composition

* `src/bootstrap/createTargetRuntime.js`
* `src/bootstrap/createTargetHttpServer.js`

`createTargetRuntime` performs exact-schema composition without opening,
migrating, listening, or starting jobs. `openTargetRuntime` owns an explicit
local/test connection and releases it idempotently. `createTargetHttpServer`
adds the local HTTP and authenticated Socket.IO lifecycle while requiring the
same origin configuration used to build the runtime.

### Integrated verification

* `test/foundation/targetRuntimeFoundation.test.js`

The integrated suite proves:

* all 36 target endpoints are unique and installed exactly once;
* target modules and `/api/v1` remain absent from production `server.js`;
* incompatible schema and missing independent security configuration fail
  closed;
* self-registration, real-scrypt sign-in, read-only session bootstrap, CSRF,
  sign-out, and durable sign-in rate limiting work through composed HTTP;
* two-league visibility hides an existing unauthorized league;
* commissioner team creation, idempotent replay, manager invitation read and
  acceptance, active membership, and resulting manager authority work through
  the composed routers;
* current manager profile mutation, stale-version rejection, safe BLOB-backed
  logo serving, and read-only binary delivery retain their contracts;
* authenticated sockets join only their backend-derived user, visible-league,
  and managed-team rooms;
* startup failure and shutdown release HTTP, Socket.IO, and owned SQLite;
* target requests leave every compatibility JSON file byte-for-byte unchanged.

## Verification Evidence

All Node verification used Node `24.14.1`.

```text
Focused M3-19 composition/integration: 21/21 passed
Cumulative M3 identity and authorization: 271/271 passed
Cumulative foundation: 360/360 passed
Complete backend suite: 533/533 passed across 133 suites
Project JavaScript syntax: 230/230 parsed
Compatibility characterization: 164/164 passed
Compatibility route inventory: 34 total, 6 debug, 28 non-debug
Target endpoint inventory: 36 total, each mounted exactly once locally
Migration/reset/import/cutover rehearsal selection: 43/43 passed
Production target mount markers: 0
Generated SQLite/database artifacts: 0
Private-key/provider-token markers: 0
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

database/migrations/0005_add_team_logo_objects.sql
18B6252000EE7BA7AE4706700171B0721F98E1709E217C0BAF7960030DD94E2B

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

No target route was mounted in the production process, no shared database was
migrated or opened, no job started, no compatibility response changed, no
frontend source was edited by M3-19, no provider email was sent, no deployment
occurred, and no commit or push was performed.
