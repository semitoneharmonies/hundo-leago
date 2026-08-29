# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

## Work Plan ID

```text
M7-07
```

## Work Item

```text
Integrated Local Release Rehearsal and Hosted-Staging Preflight
```

# Objective

Run the deterministic M7 fixture through the real target backend and frontend
on loopback, complete the automatable release and browser checks, rehearse
local recovery/failure paths, and produce exact evidence identifying what is
ready versus what still requires hosted-staging authority.

# Authority and Boundary

Grae requested continued M7 implementation on `2026-07-22`. This plan
authorizes local source changes, loopback services, synthetic test identities,
temporary databases, capture-only email, disabled scheduled jobs, local
frontend/backend builds, automated browser control, and temporary backup/
restore/failure rehearsal.

It does not authorize committing, pushing, deploying, changing Render or
Netlify configuration, importing a real source bundle, applying the production
reset, using production data or secrets, sending real email, enabling hosted
jobs, opening traffic, or performing a production operation.

# Scope

1. Inventory exact frontend/backend branch, dirty-state, runtime, package,
   configuration, and release-contract inputs without changing either remote.
2. Add a loopback-only M7 release-QA launcher that creates the M7-06 fixture,
   opens it through the real target runtime, uses capture-only email, keeps
   scheduled jobs disabled, and deletes only its own temporary state at clean
   shutdown.
3. Add a non-browser full-stack verifier for public health, authentication,
   role/account states, two-league visibility/isolation, representative safe
   reads, write authorization, CSRF/session behavior, maintenance closure, and
   no cross-league disclosure.
4. Run the actual frontend against the loopback target runtime and complete the
   automatable desktop/mobile, navigation, refresh, reconnect, role, two-league,
   privacy, keyboard, responsive, and failure-state checks from Manual QA.
5. Run complete frontend tests, lint, and production build plus the complete
   backend suite and syntax checks.
6. Rehearse temporary-database backup/restore, code/config rollback inputs,
   provider failure, scheduler-disabled behavior, and clean teardown without
   activating a restored database.
7. Record a safe local release-rehearsal report and an explicit hosted-staging
   preflight matrix. Mark every hosted, physical-device, real-email, real-
   provider, commit, push, and deployment check as unverified rather than
   inferring success.

# Expected Files

```text
hundo-leago-backend/scripts/start-m7-release-qa.js
hundo-leago-backend/scripts/verify-m7-release-qa.js
hundo-leago-backend/scripts/rehearse-m7-release-qa-recovery.js
hundo-leago-backend/scripts/rehearse-m7-integrated-local.js
hundo-leago-backend/scripts/release-candidate-preflight.js
hundo-leago-backend/src/operations/release/createReleaseQaRuntime.js
hundo-leago-backend/src/operations/release/rehearseReleaseQaRecovery.js
hundo-leago-backend/src/operations/release/verifyReleaseQaRuntime.js
hundo-leago-backend/src/operations/release/createReleaseCandidatePreflight.js
hundo-leago-backend/test/foundation/releaseCandidatePreflightFoundation.test.js
hundo-leago-backend/test/foundation/releaseQaRecoveryFoundation.test.js
hundo-leago-backend/test/foundation/releaseQaRuntimeFoundation.test.js
hundo-leago-backend/package.json
docs/07-testing/release-runs/M7_LOCAL_RELEASE_REHEARSAL.md
```

# Completion Gate

M7-07 completes only when the real target runtime opens the deterministic
fixture on loopback, automated full-stack and browser checks pass, temporary
recovery/failure drills reconcile, frontend and backend complete gates pass,
protected hashes and process/artifact baselines remain safe, and the evidence
clearly separates local proof from hosted/manual work.

# Execution Checkpoint - 2026-07-22

The loopback target runtime, external full-stack verifier, real Vite server,
two-league fixture, capture-only email, disabled scheduler, provider-failure
containment, encrypted private-object backup, wrong-key rejection, clean-path
restore, and cleanup checks pass. A one-command manual-QA launcher now starts
both repositories, prints all nine synthetic identities without printing their
password, and cleans up its disposable fixture at shutdown. Its focused and
integrated-environment gate passes `7/7`. The fail-closed release-candidate
preflight gate is `5/5`; the complete backend gate is `893/893` across 228
suites under Node `24.14.1`; JavaScript syntax is `436/436`. The frontend passes
`95/95` tests across 19 files, lint, production build, and the integrated Vite
serve check. The production build lazy-loads canonical authenticated feature
routes, excludes the backend-session-disabled legacy root dashboard from the
active build, emits a `363.86 kB` initial JavaScript chunk, and does not trigger
Vite's `500 kB` chunk-size advisory. Legacy quote storage, league
loading, and Socket.IO effects now refuse before starting without their
disabled compatibility backend session. The current-scope M3 browser-authority
verifier enforces those guards and passes across 15 compatibility files while
inventorying all 86 shipped source files.

The read-only candidate preflight correctly blocks the current source: the
frontend is not on `staging`, both fully enumerated worktrees are dirty, and no
exact candidate commits were supplied. It performs no mutation, grants no
authority, and cannot freeze, commit, push, or deploy a candidate.

Rendered loopback desktop, mobile, reload, sign-out, and two-league isolation
checks pass. Grae's manual local run also passed keyboard navigation, visible
focus, Enter submission, and the rendered reconnect procedure. The zoom run
exposed visual and navigation defects. Functional navigation, six-team
standings, player, auction, matchup, and team-link corrections pass focused
automated tests. Compatibility entrances for Players, Matchups, and Standings
now redirect through one league-scoped implementation for single- and
multi-league accounts; authenticated root entry redirects to league selection;
the logo stays in responsive layout flow; and Escape closes the primary menu
with focus restoration. The recent focused frontend gate is `38/38` across
seven files. Theme A - Midnight Rink is implemented across the authenticated
shell, account flows, real-data dashboard, league/team/roster, player,
transaction, matchup, standings, activity, notification, and commissioner
routes. The documented local Theme A desktop/mobile/zoom acceptance now
passes.

Grae's Theme A Tours 1 and 2 pass, and Tour 3 proves Beta auction persistence
plus Alpha/Beta isolation. Tour 4 exposed a release-QA fixture mismatch: the
platform administrator was promised both leagues but had no explicit
memberships. The local fixture now grants explicit `member` memberships in
both leagues, backend reads project inherited platform authority only after
membership authorization, and the frontend exposes the administrator label
and Commissioner tools. Platform role without membership remains denied. The
fix passes `19/19` focused backend tests, `26/26` focused frontend tests, the
complete backend and frontend gates, lint, build, and browser-authority
verification. On `2026-07-24`, Grae reported all six focused administrator,
commissioner, manager-isolation, no-membership, and inactive-account checks
passing with the simplified fixture accounts. Combined with the earlier Theme
A tours and automated authenticated-route reload evidence, the required local
rendered matrix passes.

The post-change complete backend gate passes `893/893` across 228 suites under
the approved Node `24.14.1` runtime. The synchronized `E:` frontend passes
`95/95` tests across 19 files, lint, and a production build with 1,746
transformed modules and a `363.86 kB` initial JavaScript chunk.

Hosted staging, real providers, physical mobile QA, commit/push, candidate
freeze, deployment, and production remain unverified or unauthorized. Exact
evidence is recorded in
`docs/07-testing/release-runs/M7_LOCAL_RELEASE_REHEARSAL.md`.

Plan status is `COMPLETE`; its local completion gate passed on `2026-07-24`.
This does not authorize or claim any hosted or production result.

# Next Step Boundary

After M7-07, hosted staging still requires exact source commits and explicit
commit, push, deployment, provider, and environment authority. Production reset,
migration, maintenance, traffic, and job actions remain separately blocked
until Grae explicitly authorizes their exact scope.
