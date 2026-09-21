# M7 Local Release Rehearsal

## Record Status

`LOCAL REHEARSAL COMPLETE - HOSTED, PROVIDER, PHYSICAL-DEVICE, CANDIDATE, AND DEPLOYMENT GATES OPEN`

Initial date: `2026-07-22`

Latest local update: `2026-07-24`

Operating mode: `OFFSEASON_RESET`

Work plan: `M7-07 Integrated Local Release Rehearsal and Hosted-Staging Preflight`

This record is evidence for a local synthetic rehearsal. It is not a release
candidate freeze, hosted-staging result, production authorization, or launch
record.

## Authority Boundary

The rehearsal used only loopback services, a deterministic test-only SQLite
fixture below the operating-system temporary directory, capture-only email,
disabled scheduled jobs, a deliberately disabled NHL provider, and in-memory
private object storage. No commit, push, deployment, provider configuration,
real source import, reset, production data, real email, traffic change, or job
activation occurred.

## Candidate Inventory

| Component | Branch | Committed HEAD | Working tree | Status |
| --- | --- | --- | --- | --- |
| Backend | `staging` | `734c52f865e1407dcd21fcc9ffa891ca4c022fb2` | 354 fully enumerated porcelain entries | Not frozen |
| Frontend | `m3-01-browser-authority` | `8ff255348a10039eb9e3e4c72da3be570c6b1860` | 202 fully enumerated porcelain entries | Not frozen |

The listed commits do not contain the complete local M2-M7 candidate because
both repositories contain preserved uncommitted work. They therefore cannot be
used as staging deploy identities. The current committed parents available for
code rollback inventory are backend
`843e7126c9e503ef696c3348e8ee955658448d4a` and frontend
`2f693752d02913a73284c1f1ac1f52b1c5cc6eb9`; provider rollback was not run.

The read-only candidate preflight now requires both repositories on `staging`,
zero fully enumerated dirty entries, Node `24.14.1`, a canonical release ID, and
both explicitly supplied candidate commits matching the inspected HEADs. Its
actual inspection correctly returned `blocked` with:

```text
FRONTEND_BRANCH_NOT_STAGING
FRONTEND_WORKTREE_DIRTY
BACKEND_WORKTREE_DIRTY
EXACT_CANDIDATE_INPUT_REQUIRED
```

Preflight report checksum:

```text
d5702287a40785d49ff08c2f102a934f9db7f708f1d50e83f7ebd21aa1e14d4f
```

The preflight performed no mutation and granted no authority.

The `2026-07-24` candidate-source audit found no untracked database, log,
archive, private-key, environment, or other large generated artifact and no
secret-like value in candidate source outside test and documentation fixtures.
Repository-wide tracked diff checks pass. Before E-drive canonicalization, the
legacy C-drive and canonical E-drive copies matched across 726 relevant
non-generated files; only the E-drive copies received the subsequent runtime,
path, and evidence updates. The exact E-local Node `24.14.1` runtime then passed
the complete frontend `95/95` gate, lint, production build, browser-authority
verification, and the complete backend `893/893` gate across 228 suites.

Input checksums:

| Input | SHA-256 |
| --- | --- |
| Backend `package-lock.json` | `F1EC83DBB0841B3598353D061A014D5D37D4530FD07232EA8EA2F1AD3401F067` |
| Frontend `package-lock.json` | `F5F569ACDC609B5B5DBE404E18BDFA172E8E3B41C473F99EDAFE10D6B10578BA` |
| Backend `render.yaml` | `5C19D0028CE9A25DD764FCEE31A3FC345E45AA86301AF7056778ADA2389206A7` |

## Deterministic Fixture

The fixture contained two six-team leagues with overlapping team names and
global player identities, nine account/role states, current and historical
contracts, active/bench/injured-reserve/prospect/free-agent coverage, retention,
buyout, a sealed auction with an own bid, simultaneous trades on one asset,
live and final matchups, standings, activity, notification, and capture-only
email evidence. The platform administrator has explicit active `member`
memberships in both fixture leagues, allowing inherited platform authority
without granting implicit access from the platform role alone.

Fixture semantic checksum:

```text
6ae04870c33a6b723a0f53c604a3c964773b8e6fb6b7f10ed4e1ac5bbfd9c98c
```

## Automated Evidence

### Backend

| Gate | Result |
| --- | --- |
| M7 fixture/runtime/recovery/deploy/scheduler/backup focused gate | `59/59 PASS` |
| Release-candidate provenance preflight focused gate | `5/5 PASS` |
| One-command manual-QA launcher and integrated-environment gate | `7/7 PASS` |
| Administrator membership, inherited authority, and release-QA focused gate | `19/19 PASS` |
| Recent league/player/matchup/runtime contract gate | `56/56 PASS` |
| Complete Node test gate | `893/893 PASS` across 228 suites under Node `24.14.1` |
| JavaScript syntax gate | `436/436 PASS` |
| Backend diff check | `PASS` |

The real loopback target runtime verified public health, origin denial,
account states, authentication and session lifecycle, CSRF, role authorization,
two-league membership and record isolation, sealed-bid privacy, representative
auction/trade/matchup/standings/activity/notification reads, manager and
commissioner boundaries, platform-administrator behavior, and closed-write
maintenance behavior.

### Frontend

| Gate | Result |
| --- | --- |
| Recent account/navigation/player/transaction/competition/league gate | `38/38 PASS` across 7 files |
| Administrator navigation and commissioner workspace gate | `26/26 PASS` across 3 files |
| Complete Vitest gate | `95/95 PASS` across 19 files |
| ESLint | `PASS` |
| Production Vite build | `PASS` with 1,746 transformed modules and route-level chunks |
| Integrated Vite root and `/src/main.jsx` entry served | `PASS` |
| Rendered loopback desktop/mobile/navigation/reload/isolation QA | `PASS` for the local acceptance matrix |

The production build now lazy-loads canonical authenticated feature modules.
The legacy root dashboard is retained only behind its disabled compatibility
backend-session gate and is absent from the active build. The initial
JavaScript chunk is approximately `363.86 kB` after minification, with
canonical feature modules emitted as route-level chunks. Vite's `500 kB`
chunk-size advisory does not appear.

### Rendered Loopback Browser Matrix - 2026-07-22

The mandated in-app browser runtime was restored and exercised only against the
synthetic loopback fixture. Its scheduler remained disabled throughout.

| Check | Evidence | Result |
| --- | --- | --- |
| Desktop viewport | `1440 x 900`; sign-in as League A Manager One, Alpha-only league shell, standings navigation | `PASS` |
| Route reload | Reloading the authenticated Alpha standings route preserved the route and rendered official standings | `PASS` |
| Mobile viewport | `390 x 844`; authenticated standings rendered with document `scrollWidth === clientWidth === 390` | `PASS` |
| Two-league isolation | Signing out then signing in as League B Manager One rendered Beta only, never Alpha | `PASS` |
| Protected-route sign-out | Initial run exposed an indefinite `Checking secure league access…` state after sign-out from a nested route; the route gates now redirect unauthenticated users before considering a disabled league query | `FIXED AND PASS` |
| Focusable shell control | The Hundo Leago home link received keyboard focus in the in-app browser | `PASS` |
| Grae's keyboard and focus run | Refresh on the sign-in page remained stable; Tab and Shift+Tab navigation, visible focus outlines, Enter credential submission, and ordinary focus behavior worked | `PASS FOR TESTED CONTROLS` |
| Grae's 200% zoom run | Zoom, sign-in, sign-out, and no whole-page horizontal overflow worked. The header image overlapped controls, the top navigation could move out of frame, legacy and target navigation were mixed, and the observed standings rendered only two teams | `DEFECTS FOUND - RETEST REQUIRED` |
| Rendered Socket.IO reconnect | After detailed DevTools instructions, Grae reported that the complete reconnect procedure worked without issue. The existing automated authorization/reconnect gates also pass; no retained browser-network capture was produced | `PASS - USER-REPORTED LOCAL EVIDENCE` |
| Theme A Tours 1 and 2 | Grae reported primary navigation, dashboard, team links, Players, Auctions, Matchups, and six-team Standings looked good | `PASS - USER-REPORTED LOCAL EVIDENCE` |
| Theme A Tour 3 | A Beta auction persisted across sign-out/sign-in and remained invisible to the Alpha manager | `PASS - USER-REPORTED LOCAL EVIDENCE` |
| Theme A Tour 4 | Manager/commissioner visibility passed. The administrator initially had no visible leagues because the fixture omitted its promised memberships | `FIXED AND PASS - USER-REPORTED RETEST` |
| Theme A Tour 5 | Desktop/mobile, 200% zoom, menu, keyboard, and Enter submission passed; reconnect and authenticated route reload have matching user or automated evidence | `PASS FOR LOCAL MATRIX` |
| Simplified account and authority retest - 2026-07-24 | Grae reported all six focused checks passing: administrator, commissioner, Alpha manager, Beta manager, no-membership, and the matching generic pending/deactivated rejection | `PASS - USER-REPORTED LOCAL EVIDENCE` |

Regression coverage was added for signed-out competition and transaction
routes. Subsequent functional work made the target league-scoped top-bar menu
the only primary navigation, unified the matchup route, added the target player
page and auction player search/dollar display, exposed matchup player
breakdowns, returned complete season participants for standings, and corrected
safe team-link projections. The old direct player, matchup, and standings URLs
now redirect to the single canonical league-scoped feature, including explicit
league selection without a preference and remembered authorized-league
behavior. Authenticated root entry redirects to league selection. The top-bar
logo no longer carries the obsolete absolute 100-pixel inline layout, and
Escape closes the main menu while returning focus to its trigger. The old root
dashboard is now hidden behind its already-disabled compatibility
backend-session flag. Its old quote storage, league `GET`, and Socket.IO
connection refuse before starting without that session. The current-scope M3
browser-authority verifier enforces these boundaries and passes across 15
compatibility files while inventorying all 86 shipped source files.
The recent focused frontend gate passes `38/38` across seven files and the
matching backend gate passes `56/56`. The complete frontend suite now passes
`95/95` across 19 files. ESLint and the production build pass. Route-level code
splitting plus the inactive legacy root reduce the initial JavaScript chunk to
approximately `363.86 kB` and keep it below the chunk-size advisory.

Theme A - Midnight Rink is now implemented across the account, league,
dashboard, roster, player, transaction, competition, activity, notification,
and commissioner routes. It uses one responsive top-bar menu, shared page and
state primitives, a real-data league dashboard, a distinct Teams index, the
canonical side-by-side matchup comparison, and the authoritative standings
table. Grae's Theme A tours accepted the implemented desktop, narrow-mobile,
200% zoom, navigation, role, and isolation matrix. This local acceptance does
not substitute for physical-device, multi-browser, screen-reader, or hosted
staging evidence.

The administrator finding from Tour 4 is corrected locally. The deterministic
fixture now creates explicit memberships in both leagues, the backend derives
`effectiveAuthority: "platform_administrator"` only after membership
authorization, commissioner-gated reads accept that inherited authority, and
the frontend exposes the administrator label and Commissioner tools. Platform
role without membership remains denied. Pending-verification and deactivated
sign-in continue returning the same intentional generic invalid-credentials
response.

HTTP and component-test success is not treated as physical-device, hosted, or
fully rendered keyboard/reconnect evidence.

## One-Command Manual-QA Workflow

The disposable local site now starts from one PowerShell terminal:

```powershell
Set-Location E:\hundo-leago-backend
$env:M7_RELEASE_QA_PASSWORD = 'hundo'
npm.cmd run release:qa:site
```

It starts the target backend on an available loopback port and Vite at
`http://127.0.0.1:5173`, prints the nine account identities and expected
access, keeps scheduled jobs disabled, and removes its own temporary fixture
after `Ctrl+C`. The password is not printed or passed to the Vite child.

The command passed a live startup smoke against the public readiness endpoint
and frontend document, then left zero port-5173 listeners and zero owned M7
temporary roots.

## Integrated Loopback Result

The real target backend and real sibling Vite server ran together on loopback.
The external full-stack verifier passed, Vite served the application entry,
scheduled jobs remained disabled, and the injected NHL provider failure was
contained and recorded without erasing last-valid data.

The Vite child receives only an allowlist of OS launch variables and public
`VITE_*` configuration. The fixture password, backup key, and other parent
secrets are excluded by a focused regression test.

Integrated report checksum:

```text
3f6fb23a61dea481905444d389afa1ff1ee2804ee47072e2836ec730ba355071
```

Backend verifier checksum:

```text
7e16d5bc81092f6e9cd72620e73321aaa04a2b83f5ac40835ddb72e9775986d5
```

## Recovery and Failure Rehearsal

The exact fixture was backed up online, compressed, encrypted with AES-256-GCM,
stored as two private in-memory objects, and remotely checksum-verified through
the object-storage adapter. A wrong-key restore failed authentication and
created no target. A correct restore wrote only a new clean path, passed SQLite
integrity, foreign-key, identity, migration, checksum, and semantic fixture
verification, and did not activate the restored database. The source database
remained byte-identical and all rehearsal artifacts were removed.

Recovery report checksum:

```text
77a592e026adea629da5c0c81163c1355584703e01d12cf87518cddc42af6f3c
```

This proves the local application boundary only. Real S3-compatible storage,
provider retention, provider disk snapshots, hosted restore duration, staging
maintenance, session/token revocation after restore, and post-restore external
effect reconciliation remain unverified.

## Protected-State and Cleanup Evidence

| Check | Result |
| --- | --- |
| `players.json` SHA-256 | `C590874F90A826F170ACEBABBE3C12161B4096E8FAE57BD3703941C1D54173A1` unchanged |
| Reset manifest SHA-256 | `0EB27C50031EEF21C9E70684416ED5B435F7C9ED357B7953718614D6C2E21491` expected |
| SQLite artifacts in backend worktree | `0` |
| Owned `hundo-m7-release-qa-*` temp roots | `0` |
| Node processes after rehearsal | Baseline PIDs `3284`, `4936` only |
| Real email | None |
| Hosted object | None |
| Production or staging data mutation | None |

One temporary fixture root was left when an initial sandbox-blocked Vite launch
required terminating its backend process. Its exact owned OS-temp path and the
associated `.m7-local-run` logs were verified and deleted before the successful
integrated run.

## Hosted-Staging Preflight Matrix

| Release area | Local evidence | Hosted status |
| --- | --- | --- |
| Exact frontend/backend commits | Branches and current HEADs inventoried | `BLOCKED` - candidate is uncommitted and unfrozen |
| Separate staging resources and secrets | Runtime config rejects missing/mismatched identity | `UNVERIFIED` |
| Staging database and disk identity | Deployed-runtime identity tests pass | `UNVERIFIED` |
| Copied source import and approved reset | Existing dry-run/reconciliation tests pass | `UNVERIFIED` - no real source authority |
| Two-league roles and workflows | Synthetic full-stack gate passes | `UNVERIFIED` on hosted staging |
| CORS, cookies, CSRF, Socket.IO | Local target gates pass | `UNVERIFIED` on deployed HTTPS origins |
| Account email | Capture adapter and retry tests pass | `UNVERIFIED` with staging provider/sandbox |
| NHL provider | Failure containment passes | `UNVERIFIED` for hosted provider success/rate limits |
| Scheduled jobs and restart | Disabled/lease/restart tests pass | `UNVERIFIED` on hosted scheduler |
| Offsite backup and clean restore | Local encrypted drill passes | `UNVERIFIED` with real object storage |
| Frontend/backend rollback | Commit/config inputs inventoried | `UNVERIFIED` on Render/Netlify |
| Manual desktop/mobile QA | Loopback desktop/mobile core matrix, Theme A tours, simplified account/authority retest, keyboard, zoom, reload, and reconnect paths pass | `LOCAL PASS` - hosted and broader browser/accessibility coverage remain open |
| Physical mobile browser | None | `NOT RUN` |
| Candidate freeze | None | `BLOCKED` - dirty worktrees and no commit authority |

No item in this matrix may be upgraded from local proof to hosted proof by
inference.

## Release Checklist Disposition

The local automated portions of the staging, backup, security, isolation, and
runtime gates have supporting evidence. The following launch-critical release
checklist areas remain open:

* exact committed candidate and provider deploy IDs;
* isolated current hosted staging;
* real copied-source import/reset reconciliation;
* deployed HTTPS/browser/Socket.IO/email/provider/job behavior;
* complete dialog-keyboard, screen-reader, Firefox, and WebKit QA;
* at least one physical mobile browser;
* provider-backed restore and exact deployment/config/database rollback drills;
* candidate freeze and issue review;
* explicit production reset, migration, deployment, maintenance, traffic, and
  job authority;
* production execution, closed smoke, reopen, monitoring, and launch record.

Manual QA recommendation: `LOCAL LOOPBACK PASS; HOSTED RELEASE QA INCOMPLETE`

M7-07 status: `COMPLETE LOCALLY - PHYSICAL, HOSTED, PROVIDER, CANDIDATE, AND DEPLOYMENT GATES REMAIN OUTSIDE THIS WORK ITEM`

M7 status: `ACTIVE`

M8 status: `NOT STARTED`

## Next Authorized Boundary

The next boundary is to define the exact frontend/backend candidate source,
review the dirty worktrees, and prepare an isolated hosted-staging publication
plan. Grae must explicitly authorize commit/push plus isolated staging/provider
access before hosted checks can begin. Complete dialog-keyboard, screen-reader,
Firefox, WebKit, and physical-device coverage remains open. Production remains
a later, exact, separately authorized operation.
