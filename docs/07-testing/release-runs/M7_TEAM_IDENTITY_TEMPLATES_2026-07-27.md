# M7 Team Identity Templates

## Run Summary

- Date: `2026-07-27`
- Work plan: `M7-24`
- Environment: dedicated Render backend and Netlify frontend staging
- Result: ready for Grae's manual staging testing
- Production changes: none
- Fixture reset, provider, email, and scheduled-job changes: none

## Published Source

Frontend application commit:

```text
e6f4a8f8c02831bf5a1fcc75cca0fef2c9ddb22a
```

Backend commits:

```text
5bf977289cf5be4d831109275935b1ddb596b2d1
14112acf5b0a6d8492645a177235a8a94cf04b54
02324cca72e3a8305a5c4dd939126450f5ae2f01
```

The first backend commit contains the permanent schema, API, persistence, and
read-projection changes. The second adds the one-time guarded staging
migration bridge. The third removes that bridge after the successful schema
upgrade and is the final deployed backend revision.

## Staging Migration

Render migration deploy:

```text
dep-d9k49glbedkc73900d0g
```

Before migrating, the bridge verified:

- `APP_ENV=staging`;
- environment identity `test:release-qa`;
- database identity `m7-release-qa-fixture`;
- exact source schema `21`;
- exact target schema `22`; and
- the explicit one-time staging confirmation value.

The bridge created and verified this on-disk backup:

```text
backup-v1-5d25e421cf21b9f59342f8fb08b16701311d98729f6fa907ff9b592eeed33b4a
```

Backup manifest checksum:

```text
2ce977668bc9e9309fa75f55267c7d051bb73dfda6bb3db4a616f4ed978ea0cf
```

Migration `0022_add_team_pattern_template.sql` completed and the runtime
reported schema `22`. Existing two-colour teams migrated to `even-two`;
existing teams with a tertiary colour migrated to `even-three`.

The bridge was then removed and its confirmation value disabled.

## Final Deployments

Backend:

```text
dep-d9k4b7favr4c73a5ts8g
02324cca72e3a8305a5c4dd939126450f5ae2f01
https://api-staging.hundoleago.com
```

Render reported the bridge-free deployment live and the runtime logged the
exact final backend build ID.

Frontend:

```text
6a6845cd5e20aa47c911e71b
e6f4a8f8c02831bf5a1fcc75cca0fef2c9ddb22a
https://staging.hundoleago.com
```

The frontend artifact was built locally under exact Node `24.14.1` with the
staging API and Socket.IO origins and the exact frontend application commit
as `VITE_BUILD_ID`. Netlify reported the deploy ready, uploaded 17 changed
files, and processed two redirect and three header rules without errors.

## Automated Verification

Frontend:

```text
npm run lint
PASS

npm test
25 files, 135 tests passed

npm run verify:m3-browser-authority
PASS: 18 compatibility files and 105 shipped source files inventoried

npm ls --all
PASS

VITE_APP_ENV=staging
VITE_API_ORIGIN=https://api-staging.hundoleago.com
VITE_SOCKET_ORIGIN=https://api-staging.hundoleago.com
VITE_BUILD_ID=e6f4a8f8c02831bf5a1fcc75cca0fef2c9ddb22a
npm run build
PASS: 1,760 modules transformed

git diff --check
PASS
```

Backend:

```text
npm run check
PASS

npm test
989 tests passed with the migration bridge

Render final build
986 tests passed without the migration bridge

git diff --check
PASS
```

The frontend and backend catalogs contain the same 35 template IDs and fixed
colour counts.

## Hosted Acceptance

Public checks returned:

- frontend HTTP `200`;
- backend liveness `live`; and
- backend readiness `ready`.

The deployed Account and Team Settings page was exercised through an
authenticated manager session:

- the selector exposed exactly 35 template options;
- the existing three-stripe even split loaded as the selected template;
- choosing Tiger displayed exactly two colour inputs;
- choosing the three-colour gradient restored the third colour input;
- the three-colour gradient preview was present;
- the original three-stripe selection was restored in the client;
- the Save Team Profile button was disabled after restoration; and
- the browser console contained no errors.

No profile, account, password, logo, or other state-changing form was
submitted. Persistence and reload behavior are covered by the backend service
and repository tests.

## Rollback

The previous known-good frontend staging deploy is:

```text
6a6823aaa8f41d9b53c1ca0d
```

The previous backend deploy is:

```text
dep-d9k11ltbedkc738pf5d0
```

Because staging is now on schema `22`, ordinary application rollback must not
pretend to reverse the database migration. Before any post-migration write, a
rollback could restore the verified schema-21 backup and previous backend
deploy together. After a schema-22 write, use a forward correction.

## Remaining Manual Acceptance

Grae should test the catalog visually on staging, choose representative
two- and three-colour templates, save a team profile, reload it, and confirm
the selected pattern across team index, dashboard, matchup, roster, and
hockey-lines surfaces.
