# Hundo Leago - Archived Work Plan

## Document Status

`APPROVED`

## Plan Status

`COMPLETE`

Completed: `2026-07-19`

## Work Plan ID

```text
M3-01
```

## Active Step

```text
Identity and Multi-League Core Step 1 - Disable Browser-Authoritative Login
```

Grae requested Milestone M3 execution on 2026-07-19. That request
activates this one contained step only. It does not pre-authorize
M3-02, backend authentication, a frontend or backend deployment, a
database-authority change, or a production change.

During the start precondition review, `CommissionerPanel.jsx` was found
to contain three additional browser-side write requests and a hard-coded
commissioner actor claim. Grae approved adding that file to the exact
M3-01 scope on 2026-07-19. The verifier must not be weakened to ignore
those paths.

---

## Objective

Remove the shipped hard-coded frontend credentials and every browser
path that treats a selected team, plaintext password comparison, or
local-storage user object as authenticated identity.

Until the approved backend session system exists, the compatibility
frontend must fail closed as an anonymous read-only interface:

* league, player, statistics, matchup, and standings reads may continue;
* no manager, commissioner, or platform-administrator authority exists;
* no compatibility league write may be initiated by the frontend;
* the interface must state that secure accounts are being enabled and
  that the current view is read-only.

This step removes an insecure authority path. It does not claim to
implement secure authentication or to secure the still-existing
compatibility backend endpoints.

---

# Part 1 - Authority and Preconditions

## Required Reading

```text
AGENTS.md
docs/README.md
docs/01-project/NORTH_STAR.md
docs/01-project/OPERATING_MODE.md
docs/01-project/CURRENT_STATE.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/GLOSSARY.md
docs/02-rules/PERMISSIONS.md
docs/03-product-specs/USER_ACCOUNTS.md
docs/03-product-specs/LEAGUES_AND_TEAMS.md
docs/04-technical-specs/ARCHITECTURE.md
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/05-roadmap/ACTIVE_ROADMAP.md
docs/07-testing/TESTING_STRATEGY.md
```

## Operating Mode

The operating mode remains:

```text
OFFSEASON_RESET
```

Reset authority is not used. No persistent data is modified.

## Repositories and Branches

Primary implementation repository:

```text
C:\Users\graem\Desktop\hundo-leago
```

Current reviewed branch:

```text
docs/summer-2026-foundation
```

Focused implementation branch to create before editing:

```text
m3-01-browser-authority
```

The branch is created from the reviewed documentation branch without
discarding, stashing, staging, or committing unrelated work. It is not a
deployment branch.

The backend remains:

```text
Repository: C:\Users\graem\Desktop\hundo-leago-backend
Branch:     staging
Commit:     734c52f865e1407dcd21fcc9ffa891ca4c022fb2
```

No backend source file changes in M3-01.

## Reviewed Current Facts

At plan creation:

* the frontend ships seven plaintext credential entries in
  `src/App.jsx`;
* the browser compares the submitted password with those entries;
* the browser constructs manager or commissioner identity;
* the browser stores and restores that claimed identity under
  `hundo_currentUser` in local storage;
* the browser sends `actorRole` and `actorTeam` as compatibility write
  metadata;
* the broad compatibility autosave can issue `POST /api/league`;
* an automatic trade-cancellation effect can enter the same local
  compatibility-write path;
* `src/components/CommissionerPanel.jsx` contains direct snapshot
  restore, snapshot create, and matchup-schedule update `POST` requests;
* the matchup-schedule update supplies a hard-coded
  `actorRole: "commissioner"` claim;
* the backend has no active secure account or session route;
* M2 already created the approved account, credential, token, session,
  role, audit, league, membership, team, and assignment tables, but they
  are not application authority;
* unrelated local work exists in
  `src/components/TeamToolsPanel.jsx` and must remain untouched.

These are current implementation facts, not approved security
behaviour.

## Start Preconditions

Before editing:

1. Confirm the frontend worktree and branch.
2. Confirm the only existing frontend source modification is preserved
   and does not overlap the exact M3-01 files.
3. Create the focused branch without cleaning or stashing the worktree.
4. Record SHA-256 hashes for protected backend JSON files.
5. Confirm no frontend development server from this step is already
   running.
6. Confirm no command targets production, Render, Netlify, or a
   persistent disk.
7. Stop if removing browser authority requires a temporary credential,
   a fake authenticated user, or an unapproved backend change.

---

# Part 2 - Exact Scope

## Modify

```text
src/App.jsx
src/components/CommissionerPanel.jsx
src/components/TopBar.jsx
package.json
```

## Add

```text
scripts/verify-m3-browser-authority.mjs
```

## Preserve Unchanged

```text
package-lock.json
src/components/TeamToolsPanel.jsx
all backend source files
all repository JSON data
all environment and deployment configuration
```

No dependency is added.

---

# Part 3 - Required Behaviour

## Remove Shipped Credentials

`src/App.jsx` must no longer contain:

* the hard-coded `managers` credential array;
* any embedded manager or commissioner password;
* browser password comparison;
* login form state used to authenticate;
* browser-created manager or commissioner identity.

No replacement credential, temporary password, environment-embedded
password, or test credential may be placed in shipped source.

## Remove Local-Storage Identity

The frontend must no longer:

* read `hundo_currentUser`;
* write `hundo_currentUser`;
* restore a role or team from local storage;
* treat any local-storage value as identity or authorization.

Unrelated local-storage view preferences, such as a quote index, remain
out of scope and may continue when they do not grant authority.

## Fail Closed as Read-Only

Until a backend session is implemented:

* `currentUser` remains unauthenticated;
* `canManageTeam` remains false;
* commissioner controls remain unavailable;
* manager controls remain unavailable;
* `commitLeagueUpdate` refuses before invoking its updater;
* the autosave effect cancels and returns before an HTTP write;
* the automatic trade-cancellation path cannot mutate local state or
  cause a compatibility write;
* no `actorRole` or `actorTeam` claim is sent by the browser.

The frontend must not show a local mutation as successful when no
authoritative backend write occurred.

## Fail Closed in the Commissioner Panel

`CommissionerPanel.jsx` must:

* require the explicit backend-session state before treating
  `currentUser` as a commissioner;
* return before its snapshot restore, snapshot create, or matchup
  schedule update request when that session state is false;
* avoid loading the private snapshot list while no backend session
  exists;
* remove the browser-supplied commissioner actor claim.

The dormant compatibility handlers remain only for later replacement by
approved authenticated endpoints. They must be unreachable and
fail-closed during this transition.

## Preserve Read-Only Compatibility

The existing read-only interface remains available for:

* the compatibility league read;
* player reads and search;
* statistics reads;
* matchup reads;
* standings reads;
* Socket.IO `league:updated` invalidation followed by a read refetch.

Opening or refreshing any view must not write.

## Top-Bar State

`TopBar.jsx` must:

* remove the team/commissioner selector;
* remove the password input;
* remove the browser login submit handler;
* remove local browser logout controls tied to the old identity;
* display a concise read-only transition message;
* preserve the Hundo Leago logo and safe public navigation needed for
  the reviewed read-only interface.

This step does not add the final sign-in or sign-up form. Those forms
arrive only with the approved backend account endpoints.

---

# Part 4 - Verification Script

`scripts/verify-m3-browser-authority.mjs` uses Node built-ins only.

It must fail when shipped frontend source contains:

* a credential object with a `password` field;
* the `hundo_currentUser` storage key;
* the old `managers` credential list;
* `loginPassword`;
* `handleLogin`;
* browser-supplied `actorRole` or `actorTeam`;
* a password input in the compatibility top bar.

It must also prove:

* the expected read-only transition message is present;
* the application has an explicit unauthenticated current-user state;
* the compatibility commit path refuses before invoking an updater;
* autosave refuses before any write request when no authenticated
  backend session exists;
* each remaining direct commissioner write refuses before `fetch` while
  the explicit backend-session state is false;
* the verifier scans every shipped `.js` and `.jsx` file under `src/`;
* it never prints a discovered credential value.

Add:

```json
{
  "scripts": {
    "verify:m3-browser-authority": "node scripts/verify-m3-browser-authority.mjs"
  }
}
```

All existing package scripts and dependency declarations remain
unchanged.

---

# Part 5 - Safety Rules

* Do not add users, credentials, hashes, sessions, cookies, CSRF, CORS,
  account tokens, rate limits, memberships, leagues, teams, or roles.
* Do not add a placeholder login or a temporary browser role selector.
* Do not expose a production, staging, or test password.
* Do not change backend compatibility endpoint behaviour.
* Do not enable SQLite application authority.
* Do not modify `package-lock.json`.
* Do not modify the unrelated `TeamToolsPanel.jsx` work.
* Do not change league, scoring, roster, contract, auction, trade,
  matchup, or standings rules.
* Do not deploy, merge, migrate, reset, seed, restore, or change
  environment variables.
* Do not weaken an existing frontend or backend check.
* Preserve production `main` and the deployed production service.

---

# Part 6 - Execution Sequence

1. Record both repository worktrees and protected backend JSON hashes.
2. Create `m3-01-browser-authority` from the reviewed frontend branch.
3. Add the source verifier and its package script.
4. Remove the hard-coded credential list and browser password
   comparison from `App.jsx`.
5. Remove local-storage login restore and persistence.
6. Make every compatibility mutation and autosave path fail closed.
7. Make the three direct `CommissionerPanel.jsx` write handlers
   explicitly fail closed and remove its browser actor claim.
8. Remove the compatibility login form from `TopBar.jsx` and add the
   read-only transition message.
9. Run the focused verifier.
10. Run frontend lint and production build.
11. Run the existing complete backend test and syntax gates to prove the
    untouched backend remains valid.
12. Start the frontend and backend only with local or isolated test
    configuration and perform the focused browser/network check.
13. Reconcile protected hashes, built artifacts, processes, and both
    worktrees.
14. Record completion evidence and stop before M3-02.

---

# Part 7 - Verification

From the frontend repository:

```powershell
npm.cmd run verify:m3-browser-authority
npm.cmd run lint
npm.cmd run build
rg -n "hundo_currentUser|loginPassword|handleLogin|actorRole|actorTeam" src
git diff --check
git status --short --branch
```

The `rg` command must return no match.

From the backend repository:

```powershell
npm.cmd test
npm.cmd run check
git diff --check
git status --short --branch
```

Focused local browser verification must prove:

1. The frontend shows no team/commissioner credential selector.
2. The frontend shows no password field.
3. The read-only transition message is visible.
4. League, player, statistics, matchup, and standings reads still load.
5. Manager and commissioner controls are unavailable.
6. Loading, navigation, Socket.IO refetch, and waiting through the old
   autosave interval produce no `POST`, `PUT`, `PATCH`, or `DELETE`.
7. No `hundo_currentUser` key is created or consumed.

Required final evidence:

* focused verifier passes;
* frontend lint passes;
* frontend production build passes;
* complete backend tests and syntax check pass;
* protected backend JSON hashes remain unchanged;
* only the five exact frontend files belong to M3-01;
* the unrelated `TeamToolsPanel.jsx` modification is unchanged;
* no production, staging, deployment, data, schema, secret, or
  application-authority change occurred.

---

# Part 8 - Stop Conditions

Stop and report when:

* the frontend cannot remain safely readable without a broader rewrite;
* a write can still occur without a backend-authenticated session;
* removing browser identity requires adding a new credential or role
  claim;
* the unrelated `TeamToolsPanel.jsx` change overlaps required edits;
* lint, build, verifier, backend tests, or protected hashes fail for a
  reason requiring broader work;
* a required change extends beyond the five exact frontend files;
* implementation would require backend account or session work;
* rollback cannot be limited to the exact M3-01 files.

A stop condition is not permission to broaden the step.

---

# Part 9 - Rollback

Rollback removes only:

```text
scripts/verify-m3-browser-authority.mjs
```

and restores only the M3-01 changes within:

```text
src/App.jsx
src/components/CommissionerPanel.jsx
src/components/TopBar.jsx
package.json
```

Do not restore, discard, stash, stage, or otherwise alter
`src/components/TeamToolsPanel.jsx`, canonical documentation work, or
backend M2 work.

No data rollback is required because M3-01 changes no persisted data.

---

# Part 10 - Completion Checklist

M3-01 completes only when:

* every shipped hard-coded credential is removed;
* browser password comparison is absent;
* local storage no longer carries identity or authority;
* the old browser login form is absent;
* the compatibility frontend is explicitly anonymous and read-only;
* all compatibility write and autosave paths fail closed;
* read-only compatibility views still work;
* focused, lint, build, browser/network, backend, whitespace, status,
  and protected-hash gates pass;
* exact evidence is recorded;
* work stops before M3-02.

No secure authentication claim is made by this step.

---

# Part 11 - Next-Step Boundary

After M3-01 completes, the next proposed work item is:

```text
M3-02 - Security Configuration, Clock, Randomness, and Redacted Logging Foundations
```

M3-02 must receive its own exact approved work plan. It may not begin
from this plan.

---

# Part 12 - Current Implementation and Verification Record

M3-01 was implemented locally on 2026-07-19 on:

```text
m3-01-browser-authority
```

The implementation is not deployed, merged, committed, or complete.

Passed evidence:

* the focused whole-source verifier passed across all 17 shipped
  `.js` and `.jsx` files;
* the forbidden-marker scan found no `hundo_currentUser`,
  `loginPassword`, `handleLogin`, `actorRole`, or `actorTeam`;
* the frontend production build passed with 84 transformed modules;
* focused lint comparison found no new lint rule or message in any
  changed source file relative to `HEAD`;
* `TopBar.jsx` removed three baseline unused-prop errors;
* `App.jsx` removed one baseline autosave dependency warning;
* `CommissionerPanel.jsx` retained its baseline finding set without a
  new finding;
* the complete backend suite passed 261 of 261 tests under the approved
  Node 24.14.1 runtime;
* the backend syntax check passed;
* isolated local HTTP reads for the frontend routes, league, players,
  statistics, current matchup, and standings returned `200`;
* the isolated league and player copies remained byte-identical after
  those reads;
* all five protected backend JSON hashes remained unchanged;
* `package-lock.json` and the unrelated `TeamToolsPanel.jsx` change
  remained unchanged;
* no repository database artifact, deployment, migration, secret,
  production, or application-authority change occurred.

The lint gate was resolved by the authorized Part 13 remediation:

* `npm.cmd run lint` now passes the complete frontend repository with
  zero ESLint errors and zero ESLint warnings;
* the focused security verifier still passes all 17 shipped source
  files;
* the production build still passes with 84 transformed modules;
* `package-lock.json` and all protected backend JSON hashes remain
  unchanged.

One required gate remains unsatisfied. The connected browser runtime
again reported no available browser after the lint remediation. The
required visual, interactive, network-timeline, and local-storage checks
therefore remain unverified. The successful HTTP checks are supporting
evidence, not a substitute for the browser gate.

M3-01 must remain open. Do not archive this plan or begin M3-02 until
the remaining browser gate is resolved and the completion checklist
passes.

---

# Part 13 - Authorized Lint-Baseline Remediation

Grae authorized continuous technical and documentation work through
Milestone M3 on 2026-07-19. Clearing the existing frontend lint baseline
is therefore an active M3-01 verification-remediation step.

Exact source scope:

```text
src/App.jsx
src/components/CommissionerPanel.jsx
src/components/TeamRosterPanel.jsx
src/components/TeamToolsPanel.jsx
src/leagueUtils.js
src/pages/FreeAgentsPage.jsx
src/pages/MatchupsPage.jsx
```

Permitted changes are behavior-preserving only:

* delete unused imports, props, local variables, helpers, and style
  objects;
* remove unused eslint-suppression comments;
* move a render-local stat-arrow component to stable module scope;
* make hook dependencies explicit or remove unnecessary dependencies;
* derive reset state without a synchronous state-setting effect;
* preserve current matchup, roster, auction, trade, player, and
  statistics behavior;
* preserve the existing `TeamToolsPanel.jsx` removal of the invalid
  `fontWeight: 1200` declaration.

This remediation must not:

* alter API requests or response handling;
* re-enable authentication or browser write authority;
* change league calculations, sorting results, display strings, user
  actions, or navigation;
* change dependencies or `package-lock.json`;
* expand beyond the seven exact source files.

Required verification:

```powershell
npm.cmd run verify:m3-browser-authority
npm.cmd run lint
npm.cmd run build
git diff --check
```

The complete lint command must pass with zero errors and zero warnings.
The focused security verifier and production build must continue to
pass. Protected backend data, `package-lock.json`, and all files outside
the exact scope must remain unchanged.

---

# Part 14 - Lint-Remediation Verification Record

The Part 13 remediation was implemented and verified locally on
2026-07-19.

Changed source files:

```text
src/App.jsx
src/components/CommissionerPanel.jsx
src/components/TeamRosterPanel.jsx
src/components/TeamToolsPanel.jsx
src/leagueUtils.js
src/pages/FreeAgentsPage.jsx
src/pages/MatchupsPage.jsx
```

Verification evidence:

* `npm.cmd run lint` passed the complete repository with zero ESLint
  errors and zero ESLint warnings;
* `npm.cmd run verify:m3-browser-authority` passed across all 17 shipped
  `.js` and `.jsx` files;
* `npm.cmd run build` passed with 84 transformed modules;
* targeted `git diff --check` passed;
* `package-lock.json` retained SHA-256
  `82895DBB16FF657FF4A450863209F5DBA288E5C62861854D6134447197C9F92C`;
* the five protected backend JSON hashes remained unchanged;
* no backend data, schema, dependency, deployment, environment, secret,
  production, or application-authority change occurred.

The connected browser was retried after these gates passed and again
returned no available browser. M3-01 therefore remains
`IMPLEMENTED / VERIFICATION BLOCKED` solely on the required browser
gate.

---

# Part 15 - Connected-Browser Completion Record

The remaining M3-01 connected-browser gate passed locally on
2026-07-19.

The connected in-app browser opened the isolated local frontend at
`http://127.0.0.1:5173`. The frontend used an isolated backend on
`http://127.0.0.1:4000` whose league, player, statistics, snapshot,
backup, and lock paths were all below the operating-system temporary
directory. No repository or deployed data path was used by the local
runtime.

Visual and interactive evidence:

* the top bar displayed
  `Secure accounts are being enabled. This view is read-only.`;
* the rendered top bar contained no input and no select element;
* no team or commissioner credential selector and no password field
  were present;
* no commissioner workspace or commissioner action control was
  available;
* the remaining free-agent auction affordance made no visible state
  change when clicked without a backend-authenticated session;
* league rosters and activity loaded;
* player and statistics reads loaded;
* the current matchup view loaded;
* the standings view loaded.

Network and realtime evidence:

* the isolated backend recorded every browser-originated request method;
* every recorded request was `GET`;
* observed read paths included `/api/league`, `/api/players`,
  `/api/players/:id`, `/api/stats`, `/api/matchups/current`, and
  `/api/matchups/standings`;
* no `POST`, `PUT`, `PATCH`, or `DELETE` was recorded during loading,
  navigation, interaction, or the observation interval;
* an isolated synthetic `league:updated` Socket.IO notification caused
  the connected browser to log `league updated -> reloading`;
* each resulting invalidation request was `GET /api/league`;
* the copied league and player files remained byte-identical to their
  repository sources after the browser run.

Local-storage authority evidence:

* the focused verifier scanned all 17 shipped `.js` and `.jsx` source
  files and found no `hundo_currentUser` key or legacy login marker;
* fresh connected-browser navigation and reload remained anonymous and
  displayed the read-only transition state;
* the browser-control surface did not expose arbitrary storage
  contents, so the whole-source absence proof and connected anonymous
  runtime state jointly establish that shipped code neither creates nor
  consumes the legacy identity key.

Final reconciliation:

* `npm.cmd run verify:m3-browser-authority` passed across all 17 shipped
  source files;
* the forbidden-marker scan returned no match;
* frontend and backend `git diff --check` passed;
* `package-lock.json` retained SHA-256
  `82895DBB16FF657FF4A450863209F5DBA288E5C62861854D6134447197C9F92C`;
* `src/components/TeamToolsPanel.jsx` retained SHA-256
  `8778C39DDF44C9A3C5240FF5F85311A924EFC985975579D41908AF48B6D99C4F`;
* the five protected backend JSON hashes remained:
  * `league-state.json`:
    `FE8017B2C0FA8244EFDBD8836CBD0DD023216CF5E4392DD0AA46C7EC66741024`;
  * `players.json`:
    `C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1`;
  * `league.json`:
    `D1ECA60BD28BAF13EF964DC2E0066D62D53C4D8A1F2364E022C3D7F2F8239148`;
  * `league_dump.json`:
    `CF0579B71E977FC7BC8B5C34A691FAEDFB2CDD2C46A4F7DF7835A3449325E607`;
  * `league_with_meta.json`:
    `1B11A2ABECF7088AF82818924CC7D54B5E9E0C809961F0C11B91E3BC2872C343`;
* the isolated browser processes and temporary runtime were removed;
* no production, staging, deployment, migration, schema, secret,
  dependency, or application-authority change occurred.

M3-01 is `COMPLETE`. Work stops before M3-02 as required by this plan.
