# Hundo Leago - Active Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE - STAGING ONLY (2026-07-27)`

## Work Plan ID

```text
M7-24
```

## Work Item

```text
Team identity template catalog and manager settings
```

## Authority and Boundary

Grae asked Codex on `2026-07-27` to collect the approved stripe and decorative
templates into the manager's Account and Team Settings page and then asked for
the verified result to be deployed to the staging website for testing.

This plan permits the bounded frontend and backend implementation, additive
schema migration `0022`, exact staging commits, the existing staging-only
migration bridge procedure, publication to the dedicated Render and Netlify
staging services, and focused hosted manager acceptance.

This plan does not authorize a fixture reset, unrelated staging data changes,
production code or database changes, production deployment, provider changes,
or scheduled league-job activation.

## Approved Scope

1. Replace the separate two-/three-colour selector with one approved template
   picker.
2. Retain the two- and three-stripe even splits.
3. Offer the deduplicated hockey stripe catalog and approved decorative
   patterns, excluding zebra.
4. Give each template a fixed two- or three-colour requirement and show only
   the matching colour inputs.
5. Persist the selected template and expose it through authenticated team,
   workspace, and public-roster reads.
6. Preserve existing two-colour teams as `even-two` and existing teams with a
   tertiary colour as `even-three`.
7. Render the selected template through the shared team-identity treatment.
8. Update canonical product, API, data-model, permission, and current-state
   documentation.
9. Publish only the exact verified commits to the dedicated staging services.

## Data and Migration Safety

Migration `0022` is forward-only and additive. Before it runs on staging, the
temporary bridge must:

1. verify `APP_ENV=staging`;
2. verify environment identity `test:release-qa`;
3. verify database identity `m7-release-qa-fixture`;
4. require the exact schema transition `21 -> 22`;
5. create and verify a new on-disk pre-migration backup;
6. apply only the committed migration set;
7. verify schema `22` before target startup.

The bridge must be removed and its confirmation value disabled in the final
backend staging commit. No fixture reset is permitted.

## Verification Gates

Frontend:

```text
npm run lint
npm test
VITE_APP_ENV=staging
VITE_API_ORIGIN=https://api-staging.hundoleago.com
VITE_SOCKET_ORIGIN=https://api-staging.hundoleago.com
VITE_BUILD_ID=<exact application commit>
npm run build
npm run verify:m3-browser-authority
npm ls --all
git diff --check
```

Backend:

```text
npm run check
npm test
git diff --check
```

The backend suite must run under exact Node `24.14.1`. Focused coverage must
include team-profile validation and persistence, migration `0022`, public and
authenticated projections, release fixture/runtime schema checks, and the
temporary staging migration bridge.

## Deployment Procedure

1. Commit and push the exact frontend and backend application changes.
2. Add, verify, and push the temporary backend migration bridge.
3. Set only the exact staging migration confirmation value.
4. Trigger the manual Render staging deploy and record backup/migration
   evidence.
5. Remove the bridge, disable its confirmation value, and deploy the exact
   final backend commit.
6. Build the exact frontend application commit with staging origins and upload
   the prebuilt artifact to the linked staging Netlify project.
7. Verify public liveness/readiness and authenticated manager template
   selection without submitting a hosted profile write; use the automated
   service and repository coverage for persistence and reload behavior.
8. Record exact commits, deploy IDs, schema/backup evidence, and rollback.

## Completion Evidence

- Frontend application commit
  `e6f4a8f8c02831bf5a1fcc75cca0fef2c9ddb22a` and backend application
  commit `5bf977289cf5be4d831109275935b1ddb596b2d1` contain the bounded
  implementation.
- Backend migration-bridge commit
  `14112acf5b0a6d8492645a177235a8a94cf04b54` produced verified backup
  `backup-v1-5d25e421cf21b9f59342f8fb08b16701311d98729f6fa907ff9b592eeed33b4a`
  with manifest checksum
  `2ce977668bc9e9309fa75f55267c7d051bb73dfda6bb3db4a616f4ed978ea0cf`,
  then migrated staging from schema `21` to `22`.
- Migration deploy `dep-d9k49glbedkc73900d0g` completed live.
- Final backend commit
  `02324cca72e3a8305a5c4dd939126450f5ae2f01` removes the bridge and is
  live in deploy `dep-d9k4b7favr4c73a5ts8g` with the confirmation value
  disabled.
- Netlify deploy `6a6845cd5e20aa47c911e71b` is ready at
  `https://staging.hundoleago.com` and contains the prebuilt artifact for the
  exact frontend application commit.
- The complete frontend suite passes `135/135` across `25` files. Lint, the
  staging-configured production build, browser-authority verification,
  dependency-tree validation, and whitespace validation pass under exact Node
  `24.14.1`.
- The backend migration build passes `989/989`; the final bridge-free Render
  build passes `986/986`, and backend syntax and whitespace validation pass.
- Public HTTP acceptance reports frontend `200`, backend `live`, and backend
  `ready`.
- Authenticated hosted acceptance confirms all `35` template options, Tiger's
  two-colour form, the three-colour gradient form and preview, restoration of
  the original client-side selection, and no console errors. No profile write
  was submitted.
- Detailed release evidence is recorded in
  `docs/07-testing/release-runs/M7_TEAM_IDENTITY_TEMPLATES_2026-07-27.md`.

## Rollback

Before the first post-migration write, restore the verified pre-migration
backup and the previous Render deploy if migration or startup verification
fails. After a successful write on schema `22`, use a forward correction;
ordinary code rollback does not roll the database back.

The frontend may be rolled back to Netlify deploy
`6a6823aaa8f41d9b53c1ca0d`. The previous backend deploy is
`dep-d9k11ltbedkc738pf5d0`.

## Completion Conditions

M7-24 is complete only when:

1. exact frontend and backend commits are published on `origin/staging`;
2. staging has a verified schema-21 pre-migration backup;
3. migration `0022` is the twenty-second ledger entry and integrity checks
   pass;
4. the final backend deploy is live without the bridge;
5. the Netlify staging deploy is ready and embeds the exact application build;
6. hosted manager acceptance confirms selection and fixed colour counts while
   automated service/repository coverage confirms persistence and reload;
7. release evidence and current state are updated; and
8. production remains untouched.
