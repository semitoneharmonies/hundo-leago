# Hundo Leago - Manual QA Checklist

## Document Status

`APPROVED`

## Checklist Status

`ACTIVE`

This testing document defines:

* repeatable manual acceptance testing for local feature work and staging release candidates;
* the required desktop, mobile, keyboard, responsive, failure, reconnect, and cross-feature checks;
* launch-critical workflows for accounts, leagues, teams, rosters, contracts, auctions, trades, matchups, standings, commissioner tools, activity, notifications, and recovery;
* evidence, defect, stop, retest, and sign-off rules;
* manual-testing decisions delegated to and resolved by Codex from the approved project requirements.

Grae delegated the manual-QA decisions and approved adoption of the resulting checklist on 2026-07-18.

---

## Testing Purpose

Automated tests prove rules and repeatability.

Manual QA proves that a person can understand and use the integrated application through real browser behavior.

Manual QA focuses on:

* wording and feedback;
* navigation and state continuity;
* keyboard and focus behavior;
* responsive layout;
* loading, empty, conflict, and error states;
* confirmations and irreversible actions;
* browser cookie, reconnect, and refresh behavior;
* interactions between features.

It spot-checks authoritative calculations but does not replace backend domain, transaction, migration, security, or job tests.

---

## Out of Scope

This checklist does not:

* authorize a production deployment;
* use production as disposable test data;
* perform destructive production QA;
* replace automated security testing;
* replace the Backend Endpoint Checklist;
* require the deferred Entry Draft for the initial Season 2 launch;
* treat a screenshot as proof that backend permissions work;
* permit a tester to repair data manually in SQLite or JSON;
* approve a failed or blocked release.

Production verification follows the read-only smoke boundary in Deployment and the Release Checklist.

---

# Part 1 - Authority and Scope

## Required Documents

```text
AGENTS.md
../hundo-leago-backend/AGENTS.md
docs/README.md
docs/01-project/PROJECT_SCOPE.md
docs/01-project/OPERATING_MODE.md
docs/02-rules/
docs/03-product-specs/
docs/04-technical-specs/API_CONTRACTS.md
docs/04-technical-specs/SECURITY.md
docs/04-technical-specs/FRONTEND_STRUCTURE.md
docs/04-technical-specs/ENVIRONMENT_SETUP.md
docs/04-technical-specs/DEPLOYMENT.md
docs/07-testing/TESTING_STRATEGY.md
docs/07-testing/BACKEND_ENDPOINT_CHECKLIST.md
docs/08-operations/BACKUP_AND_RESTORE.md
```

Approved rules and product specifications own expected behavior. This checklist owns human verification and evidence.

---

## Execution Levels

| Level | Use | Required scope |
| --- | --- | --- |
| `FOCUSED` | One work-plan step or defect fix | Affected workflow, adjacent states, and regression risk |
| `MILESTONE` | Completion of a roadmap feature family | Complete applicable feature section plus shared shell/security checks |
| `RELEASE` | Staging release candidate | Every launch-critical section and required browser/device matrix |
| `IN-SEASON FEATURE` | Deferred feature before its calendar deadline | Feature section, cross-feature regression, release subset |

The run header identifies one level.

---

## Initial Launch Scope

Initial release QA includes:

* public roster;
* self-service user accounts and approved recovery;
* administrative league creation;
* memberships, commissioner assignment, teams, and managers;
* players and statistics;
* rosters, prospects, injured reserve, contracts, cap, retention, and buyouts;
* auctions and trades;
* regular-season matchups and standings;
* commissioner tools;
* League Activity, Security Audit, and notifications;
* staging, backups, restore rehearsal, and deployment behavior.

Entry Draft is tested before its later in-season release, not as an opening-day blocker.

Playoff behavior follows its later in-season release gate if it is not part of the initial release candidate.

---

# Part 2 - Run Record

## Run Header

Complete before testing:

```text
Run ID:
Execution level:
Release ID or work-plan ID:
Environment:
Frontend origin:
Backend origin:
Frontend commit:
Frontend deploy ID:
Backend commit:
Backend deploy ID:
API contract version:
Schema version:
Database ID suffix:
Fixture version:
Operating mode:
Tester:
Started at:
Completed at:
Browsers/devices:
Sections in scope:
Sections explicitly deferred:
Known issues at start:
```

Do not record:

* passwords;
* session cookies;
* CSRF tokens;
* verification or reset tokens;
* secret environment values;
* active competing bid values.

---

## Test Result Values

Use exactly:

```text
PASS
FAIL
BLOCKED
NOT APPLICABLE
DEFERRED
NOT RUN
```

Rules:

* `PASS` requires observed expected behavior.
* `FAIL` requires a defect record.
* `BLOCKED` identifies the blocking condition and owner.
* `NOT APPLICABLE` explains why the case cannot apply to this release type.
* `DEFERRED` cites approved Project Scope or roadmap authority.
* `NOT RUN` is never treated as passed.

---

## Defect Severity

| Severity | Meaning | Release effect |
| --- | --- | --- |
| `CRITICAL` | Security breach, cross-league access, unrecoverable data loss/corruption, destructive unauthorized action | Immediate stop; release blocked |
| `HIGH` | Launch-critical workflow unusable, wrong authoritative result, permission bypass, repeatable major mobile/accessibility blocker | Release blocked |
| `MEDIUM` | Important degradation with safe workaround and no data/security risk | Requires explicit release disposition |
| `LOW` | Cosmetic or minor usability problem | May be scheduled with recorded owner |

An issue is classified by impact, not the apparent size of its code fix.

---

## Defect Record

```text
Defect ID:
Test case ID:
Severity:
Environment and build IDs:
Browser/device:
Account role:
League/team fixture:
Precondition:
Exact steps:
Expected:
Actual:
Request ID:
Screenshot/video:
Console/network evidence:
Data effect:
Reproducibility:
Workaround:
Owner:
Status:
Retest evidence:
```

Redact private and secret values from artifacts.

---

# Part 3 - Environment and Fixture Preconditions

## Environment Preconditions

- [ ] `MQ-ENV-001` Environment is local, test, or dedicated staging—not production.
- [ ] `MQ-ENV-002` Frontend and backend origins match the run header.
- [ ] `MQ-ENV-003` Frontend and backend build IDs match the intended release.
- [ ] `MQ-ENV-004` Backend reports the expected environment and schema through authorized operational health.
- [ ] `MQ-ENV-005` Database identity is staging-only.
- [ ] `MQ-ENV-006` Staging cannot reach the production disk, database, users, email credentials, or backup prefix.
- [ ] `MQ-ENV-007` Email uses capture or provider sandbox mode.
- [ ] `MQ-ENV-008` Debug routes are disabled unless the focused run explicitly owns them.
- [ ] `MQ-ENV-009` Scheduled jobs are disabled unless the scenario owns the test clock and occurrences.
- [ ] `MQ-ENV-010` Browser console is clear of unexpected startup errors.
- [ ] `MQ-ENV-011` No unrelated deployment or fixture mutation is in progress.
- [ ] `MQ-ENV-012` A known fixture reset procedure exists and does not touch production.

---

## Two-League Fixture

Release QA requires at least:

```text
League A: six teams and complete launch-critical feature state
League B: six teams and overlapping display names/player pool
```

Required accounts:

```text
platform administrator
League A commissioner
League B commissioner
League A manager 1
League A manager 2
League B manager 1
verified user with no membership
pending-verification user
deactivated user
```

Required representative player/asset state:

```text
free-agent F
free-agent D
active F and D
bench player at and below the $4.00 AAV limit
injured-reserve player
unsigned prospect
signed prospect still in prospects
one-to-three-year contracts
retention obligation
buyout penalty
active auction with own bid
simultaneous trade proposals involving one asset
current matchup week and finalized prior result
notifications and approved activity
```

Fixture display names deliberately overlap across leagues. Stable IDs remain different.

---

## Fixture Preconditions

- [ ] `MQ-FIX-001` Both leagues load independently.
- [ ] `MQ-FIX-002` League A and League B share at least one team display name.
- [ ] `MQ-FIX-003` Both leagues reference overlapping global players.
- [ ] `MQ-FIX-004` Every test account has a documented expected role and team.
- [ ] `MQ-FIX-005` Money, cap, roster, contract, matchup, and standings expected values are recorded.
- [ ] `MQ-FIX-006` Captured email can be inspected without sending externally.
- [ ] `MQ-FIX-007` Fixed or accelerated time is documented for time-window workflows.
- [ ] `MQ-FIX-008` The fixture can be recreated from a test-only command rather than a production HTTP seed route.

---

# Part 4 - Browser, Device, and Accessibility Matrix

## Required Release Matrix

| Matrix ID | Browser/device | Viewport or device | Required use |
| --- | --- | --- | --- |
| `M-01` | Current Chrome or Edge on Windows | At least `1440 x 900` | Complete primary release run |
| `M-02` | Current Firefox on desktop | At least `1366 x 768` | Shared shell plus every affected feature |
| `M-03` | Mobile Chromium | Approximately `390 x 844`, physical preferred | Complete mobile-critical run |
| `M-04` | WebKit/iOS Safari behavior | Approximately `390 x 844` | Automated WebKit plus manual physical device when available |
| `M-05` | Desktop Chromium at 200% zoom | `1280 x 720` or larger before zoom | Shared shell and critical manager/commissioner workflows |

At least one real physical mobile browser is required before initial launch.

If physical iOS Safari is unavailable, Playwright WebKit evidence is required and the missing physical coverage is recorded as release risk. It is not silently marked passed.

---

## Input and Assistive Checks

Release QA includes:

* mouse or touch;
* keyboard-only navigation;
* visible focus;
* browser zoom;
* reduced-motion preference;
* Windows screen-reader spot checks using NVDA or an available equivalent for sign-in, navigation, form errors, and one data table.

This is critical usability verification, not a claim of a formal accessibility certification.

---

# Part 5 - Application Shell and Shared Behavior

## Startup and Navigation

- [ ] `MQ-SHL-001` Application loads without a blank screen.
- [ ] `MQ-SHL-002` Invalid frontend configuration shows a safe startup error and issues no feature requests.
- [ ] `MQ-SHL-003` Browser refresh preserves the current public or authorized route safely.
- [ ] `MQ-SHL-004` Direct navigation to a valid nested route works through Netlify SPA routing.
- [ ] `MQ-SHL-005` Unknown route shows an understandable not-found view.
- [ ] `MQ-SHL-006` Navigation identifies the active section.
- [ ] `MQ-SHL-007` Back and forward navigation restore route state without displaying another league's cached data.
- [ ] `MQ-SHL-008` Switching leagues updates the URL and clears prior league presentation.
- [ ] `MQ-SHL-009` Page title identifies the current area.
- [ ] `MQ-SHL-010` Header, navigation, dialogs, tables, and primary controls remain usable on mobile.

---

## Shared States

- [ ] `MQ-SHL-011` Initial loading state is visible and does not flash unauthorized data.
- [ ] `MQ-SHL-012` Empty state explains what is empty and what authorized action is available.
- [ ] `MQ-SHL-013` Backend validation appears near the relevant input.
- [ ] `MQ-SHL-014` Safe unexpected error includes a request ID without stack trace.
- [ ] `MQ-SHL-015` Double-clicking a material action does not submit twice.
- [ ] `MQ-SHL-016` Disabled controls explain timing or permission when explanation is useful.
- [ ] `MQ-SHL-017` A stale `If-Match` conflict preserves user context and offers/refetches current data safely.
- [ ] `MQ-SHL-018` A `401` removes private presentation and returns to sign-in.
- [ ] `MQ-SHL-019` A `403` does not render the protected data.
- [ ] `MQ-SHL-020` A cross-league private resource displays safe not-found behavior.

---

## Refresh and Reconnect

- [ ] `MQ-SHL-021` Temporary offline mode shows recoverable network feedback.
- [ ] `MQ-SHL-022` Reconnection reauthenticates Socket.IO.
- [ ] `MQ-SHL-023` Reconnection refetches authoritative HTTP data.
- [ ] `MQ-SHL-024` Repeated reconnect does not duplicate visible notifications or actions.
- [ ] `MQ-SHL-025` A session revoked in another browser disconnects private realtime access.
- [ ] `MQ-SHL-026` A newly deployed incompatible build prompts a safe reload rather than continuing with corrupt assumptions.

---

# Part 6 - Public Views

- [ ] `MQ-PUB-001` Discoverable active leagues appear using public identity fields only.
- [ ] `MQ-PUB-002` Setup, archived, deleted, or non-discoverable leagues do not appear.
- [ ] `MQ-PUB-003` Public league page shows only approved league and team identity.
- [ ] `MQ-PUB-004` Public team roster shows approved players, roster category, contract summary, cap totals, and available statistics.
- [ ] `MQ-PUB-005` Public roster excludes accounts, memberships, login history, bids, trades, private activity, corrections, and operational metadata.
- [ ] `MQ-PUB-006` Public roster refresh does not trigger a save, repair, initialization, statistics refresh, or activity event.
- [ ] `MQ-PUB-007` Public pages emit approved `noindex, nofollow` metadata.
- [ ] `MQ-PUB-008` Private/nonexistent league and team URLs do not reveal private existence.
- [ ] `MQ-PUB-009` Public roster remains readable on mobile without clipped essential data.

---

# Part 7 - Accounts and Sessions

## Sign-Up and Verification

- [ ] `MQ-ACT-001` New user can submit valid unique email, display name, and matching password fields.
- [ ] `MQ-ACT-002` Duplicate normalized email receives the approved safe response.
- [ ] `MQ-ACT-003` Duplicate display name receives understandable validation.
- [ ] `MQ-ACT-004` Password boundary messages are understandable without exposing security internals.
- [ ] `MQ-ACT-005` Pending user receives captured verification email with correct staging frontend origin.
- [ ] `MQ-ACT-006` Verification link is single-use and activates the account.
- [ ] `MQ-ACT-007` Expired or replaced verification link fails safely.
- [ ] `MQ-ACT-008` Resend response does not reveal whether an arbitrary account exists.
- [ ] `MQ-ACT-009` New verified user has no league, role, team, or commissioner authority.

---

## Sign-In and Session

- [ ] `MQ-ACT-010` Valid user signs in.
- [ ] `MQ-ACT-011` Unknown email and wrong password show the same safe public failure.
- [ ] `MQ-ACT-012` Session survives a normal refresh.
- [ ] `MQ-ACT-013` Signing in from a second browser replaces the prior active session.
- [ ] `MQ-ACT-014` Replaced session loses HTTP and Socket.IO access.
- [ ] `MQ-ACT-015` Sign-out clears private UI and browser session state.
- [ ] `MQ-ACT-016` Back navigation after sign-out does not redisplay private cached data.
- [ ] `MQ-ACT-017` Session idle/absolute expiry shows safe sign-in transition.
- [ ] `MQ-ACT-018` Cookie is not readable through ordinary frontend JavaScript.

---

## Password and Account State

- [ ] `MQ-ACT-019` Password change requires current password and matching new fields.
- [ ] `MQ-ACT-020` Successful password change revokes sessions and requires sign-in.
- [ ] `MQ-ACT-021` Password-reset request uses a generic response and captured email.
- [ ] `MQ-ACT-022` Reset link expires after the approved period and is single-use.
- [ ] `MQ-ACT-023` Successful reset does not sign the user in automatically.
- [ ] `MQ-ACT-024` Display-name edit handles uniqueness and stale version conflict.
- [ ] `MQ-ACT-025` Deactivation requires current password and typed confirmation.
- [ ] `MQ-ACT-026` Deactivation revokes sessions and removes active access.
- [ ] `MQ-ACT-027` Reactivation requires approved token and current password and does not create a session.
- [ ] `MQ-ACT-028` Account rate limits provide understandable retry behavior without enumeration.

---

# Part 8 - League, Membership, and Team Administration

## Platform Administration

- [ ] `MQ-LGT-001` Normal user cannot access platform administration.
- [ ] `MQ-LGT-002` Platform administrator can search users without seeing credential hashes.
- [ ] `MQ-LGT-003` Administrator-created user receives credential-setup email; administrator never sets or sees password.
- [ ] `MQ-LGT-004` Administrator creates league and initial season atomically.
- [ ] `MQ-LGT-005` Newly created league is not publicly discoverable before activation.
- [ ] `MQ-LGT-006` Commissioner assignment is a proposal, not immediate authority.
- [ ] `MQ-LGT-007` Proposed commissioner can accept or decline.
- [ ] `MQ-LGT-008` Platform administrator without active league membership cannot perform ordinary internal league operations merely because they are administrator.

---

## Commissioner Setup

- [ ] `MQ-LGT-009` Commissioner sees only leagues where assignment is active.
- [ ] `MQ-LGT-010` Commissioner can invite an existing user.
- [ ] `MQ-LGT-011` Invitation details are visible only to the invited user.
- [ ] `MQ-LGT-012` Acceptance creates/activates the approved membership/team workflow exactly once.
- [ ] `MQ-LGT-013` Decline grants no membership or team control.
- [ ] `MQ-LGT-014` Commissioner can create teams only before the live season.
- [ ] `MQ-LGT-015` Manager assignment grants control of the intended team only.
- [ ] `MQ-LGT-016` Ended assignment removes control after authorization refresh.
- [ ] `MQ-LGT-017` Team and membership changes cannot target League B from League A.
- [ ] `MQ-LGT-018` League start is blocked below four teams.
- [ ] `MQ-LGT-019` League start is blocked by incomplete launch invitation requirements.
- [ ] `MQ-LGT-020` Successful start performs one visible lifecycle transition.
- [ ] `MQ-LGT-021` Team addition/removal is unavailable during a live season.
- [ ] `MQ-LGT-022` Protected team or league deletion requires the administrator approval workflow and current backup.

---

## League Use

- [ ] `MQ-LGT-023` Authenticated user sees only their available leagues.
- [ ] `MQ-LGT-024` League chooser handles one, multiple, and zero memberships.
- [ ] `MQ-LGT-025` Manager cannot select or impersonate another team by editing URL, storage, or request data.
- [ ] `MQ-LGT-026` Commissioner can freeze and unfreeze only the approved manager writes.
- [ ] `MQ-LGT-027` Freeze state is clear to affected managers.
- [ ] `MQ-LGT-028` League settings show effective values and commissioner cannot edit platform-admin-only settings.
- [ ] `MQ-LGT-029` Setup trade deadline can be recorded only in the approved phase.

---

# Part 9 - Players, Statistics, Rosters, and Cap

## Players and Statistics

- [ ] `MQ-ROS-001` Player search handles name, position, NHL team, pagination, and empty results.
- [ ] `MQ-ROS-002` C/LW/RW display as F and LD/RD display as D.
- [ ] `MQ-ROS-003` No goalie appears as an eligible Hundo Leago roster player.
- [ ] `MQ-ROS-004` Player detail uses stable identity when names overlap.
- [ ] `MQ-ROS-005` Season totals and fantasy points display approved units and rounding.
- [ ] `MQ-ROS-006` Failed or partial NHL refresh preserves the last valid statistics.
- [ ] `MQ-ROS-007` Statistics refresh is unavailable to managers and commissioners without approved platform authority.

---

## Roster Display

- [ ] `MQ-ROS-008` Roster clearly separates active, bench, injured reserve, and prospects.
- [ ] `MQ-ROS-009` Active capacity shows exactly 12 F and 6 D.
- [ ] `MQ-ROS-010` Bench shows four slots and the `$4.00 AAV` maximum.
- [ ] `MQ-ROS-011` Injured reserve shows four slots.
- [ ] `MQ-ROS-012` Prospects allow unlimited eligible entries.
- [ ] `MQ-ROS-013` Empty roster slots are represented without inventing players.
- [ ] `MQ-ROS-014` Cap shows only active-player AAV, retained salary, and buyout penalties.
- [ ] `MQ-ROS-015` Signed prospect remaining in prospects does not affect cap.
- [ ] `MQ-ROS-016` Legality reasons are understandable and agree across roster surfaces.
- [ ] `MQ-ROS-017` Roster and cap totals remain readable on mobile.

---

## Roster Actions

- [ ] `MQ-ROS-018` Manager moves an owned player between allowed groups/slots.
- [ ] `MQ-ROS-019` Manager cannot move a player owned by another team or league.
- [ ] `MQ-ROS-020` Bench move above `$4.00 AAV` is rejected.
- [ ] `MQ-ROS-021` Active move respects F/D capacity and no-goalie rule.
- [ ] `MQ-ROS-022` Approved transaction-created illegality completes with warning rather than false failure.
- [ ] `MQ-ROS-023` Signed prospect may remain in prospects off cap.
- [ ] `MQ-ROS-024` After a prospect enters active, bench, or injured reserve, the player cannot return to prospects.
- [ ] `MQ-ROS-025` Prospect rights release makes the player available under approved rules.
- [ ] `MQ-ROS-026` Manual injured-reserve placement and return follow current approved eligibility workflow.
- [ ] `MQ-ROS-027` Concurrent roster edit produces a safe stale-version conflict rather than lost update.

---

# Part 10 - Contracts, Retention, and Buyouts

- [ ] `MQ-CON-001` Contract duration is one to three years.
- [ ] `MQ-CON-002` Contract total and AAV display and reconcile in cents.
- [ ] `MQ-CON-003` Years remaining includes the current season.
- [ ] `MQ-CON-004` No contract-extension action exists.
- [ ] `MQ-CON-005` Prospect ELC creates `$3` over three years at `$1 AAV`.
- [ ] `MQ-CON-006` Contract list excludes expired and bought-out contracts as approved.
- [ ] `MQ-CON-007` Retention shows AAV and remaining yearly schedule.
- [ ] `MQ-CON-008` Recipient contract view shows original contract and reduced paid AAV clearly.
- [ ] `MQ-CON-009` Buyout is unavailable during the 14-day auction-signing lock.
- [ ] `MQ-CON-010` Buyout confirmation explains player release and 25% full-AAV yearly penalty.
- [ ] `MQ-CON-011` Completed buyout eliminates contract, releases player, and creates correct penalty.
- [ ] `MQ-CON-012` Existing retained salary remains unchanged after buyout.
- [ ] `MQ-CON-013` Pending trades involving bought-out player become cancelled/declined as approved.
- [ ] `MQ-CON-014` Commissioner correction shows explicit before/after and attribution.
- [ ] `MQ-CON-015` Cap surfaces agree after retention, buyout, and correction.

---

# Part 11 - Auctions

## Visibility and Timing

- [ ] `MQ-AUC-001` Managers see active auctions only in normal auction UI.
- [ ] `MQ-AUC-002` Resolved auction results appear in League Activity.
- [ ] `MQ-AUC-003` Auction creation is available Monday `12:00 AM` through Thursday `11:59 PM` Pacific.
- [ ] `MQ-AUC-004` Auction creation is unavailable outside that window.
- [ ] `MQ-AUC-005` Auctions are closed at playoff start and remain closed until after the next season's Free Agent Draft.
- [ ] `MQ-AUC-006` User-facing deadlines use Pacific time unambiguously.

---

## Bid Privacy and Actions

- [ ] `MQ-AUC-007` Starting bid validates eligible free agent and initiating minimum.
- [ ] `MQ-AUC-008` Joining minimums enforce `$1.50/1y`, `$3/2y`, and `$5/3y`.
- [ ] `MQ-AUC-009` Total bid and term produce valid whole-number total constraints and approved AAV rounding.
- [ ] `MQ-AUC-010` Manager sees own active bid value and term.
- [ ] `MQ-AUC-011` Manager cannot see competing bid values.
- [ ] `MQ-AUC-012` Commissioner cannot see active bid values.
- [ ] `MQ-AUC-013` Browser network response and page source do not contain competing values.
- [ ] `MQ-AUC-014` Bid edit and cooldown behavior are clear.
- [ ] `MQ-AUC-015` No manager bid-withdrawal action exists.
- [ ] `MQ-AUC-016` Commissioner bid replacement identifies stable bid without first disclosing stored value/term.
- [ ] `MQ-AUC-017` Commissioner bid removal and auction cancellation require confirmation and logging.

---

## Resolution

- [ ] `MQ-AUC-018` Resolution executes once at the approved deadline.
- [ ] `MQ-AUC-019` Winning price follows approved anti-bluff contract pricing.
- [ ] `MQ-AUC-020` Ownership, contract, placement, activity, and notifications appear together.
- [ ] `MQ-AUC-021` A winning illegal roster is allowed with warning.
- [ ] `MQ-AUC-022` Manager sees resolved result through activity, not resolved-bid UI.
- [ ] `MQ-AUC-023` Restart or repeated resolution does not award twice.
- [ ] `MQ-AUC-024` Mid-season auction contract still expires/rolls at normal season boundary.

---

# Part 12 - Trades

- [ ] `MQ-TRD-001` Manager can propose approved typed assets.
- [ ] `MQ-TRD-002` Player, prospect rights, draft picks, retention, buyout penalties, and Future Considerations render clearly.
- [ ] `MQ-TRD-003` Existing contract AAV and remaining years transfer unchanged.
- [ ] `MQ-TRD-004` Draft pick identifies draft year, round, original team, and current owner.
- [ ] `MQ-TRD-005` Current, future, and on-clock draft picks can be represented as approved.
- [ ] `MQ-TRD-006` Multiple simultaneous proposals may reference one asset.
- [ ] `MQ-TRD-007` Proposal does not reserve the asset prematurely.
- [ ] `MQ-TRD-008` Only receiving manager can accept or decline.
- [ ] `MQ-TRD-009` Only proposing manager can cancel.
- [ ] `MQ-TRD-010` Commissioner safe view does not grant execution authority.
- [ ] `MQ-TRD-011` Acceptance revalidates ownership, obligations, deadline, and proposal status.
- [ ] `MQ-TRD-012` Successful acceptance applies every transfer atomically.
- [ ] `MQ-TRD-013` Failed acceptance changes nothing.
- [ ] `MQ-TRD-014` Completing one overlapping proposal cancels or invalidates affected proposals.
- [ ] `MQ-TRD-015` Trade deadline closes trading and Entry Draft start reopens it.
- [ ] `MQ-TRD-016` Resulting illegal roster is allowed with warning where approved.
- [ ] `MQ-TRD-017` Completed trade appears once in League Activity and sends expected notifications.
- [ ] `MQ-TRD-018` Cross-league team, player ownership, proposal, and pick IDs fail safely.
- [ ] `MQ-TRD-019` Trade builder and proposal detail remain usable on mobile.

---

# Part 13 - Matchups and Standings

## Schedule and Lock

- [ ] `MQ-MAT-001` Week 1 begins on the first full NHL schedule week unless commissioner-adjusted.
- [ ] `MQ-MAT-002` Pairings are as even as possible.
- [ ] `MQ-MAT-003` Commissioner can adjust only approved future schedule boundaries/pairings.
- [ ] `MQ-MAT-004` Current week is chosen by backend time, not browser clock.
- [ ] `MQ-MAT-005` Monday `4:00 PM Pacific` lock is displayed unambiguously.
- [ ] `MQ-MAT-006` Locked matchup roster remains unchanged by normal roster moves after lock.
- [ ] `MQ-MAT-007` Team illegal at lock scores zero until approved legal baseline creation.
- [ ] `MQ-MAT-008` Midweek normal-roster illegality after a legal lock does not change that matchup.

---

## Matchup Display and Results

- [ ] `MQ-MAT-009` Matchup player values begin at zero for the matchup period.
- [ ] `MQ-MAT-010` Matchup page shows G, A, points, and fantasy points accumulated during that period.
- [ ] `MQ-MAT-011` Season totals remain on roster/player surfaces rather than being substituted into matchup values.
- [ ] `MQ-MAT-012` Approved scoring is goals × `1.25` plus assists.
- [ ] `MQ-MAT-013` Live updates refetch correct matchup without moving locked players.
- [ ] `MQ-MAT-014` Finalization occurs once.
- [ ] `MQ-MAT-015` Commissioner correction creates a visible versioned result without League Activity entry.
- [ ] `MQ-MAT-016` Reconnect or refresh does not double-count fantasy points.
- [ ] `MQ-MAT-017` Matchup tables/cards remain understandable on mobile.

---

## Standings

- [ ] `MQ-MAT-018` Standings use finalized authoritative results only.
- [ ] `MQ-MAT-019` Wins, losses, ties, standings points, FP for/against, and differential reconcile.
- [ ] `MQ-MAT-020` Sorting follows standings points, FP differential, FP for, then team name.
- [ ] `MQ-MAT-021` Standings page view does not trigger rebuild or write.
- [ ] `MQ-MAT-022` Commissioner rebuild uses official result versions and creates no League Activity entry.
- [ ] `MQ-MAT-023` League A standings never show League B teams/results.

---

# Part 14 - Commissioner Tools, Activity, Audit, and Notifications

## Commissioner Tools

- [ ] `MQ-COM-001` Manager cannot open or invoke commissioner operations.
- [ ] `MQ-COM-002` Commissioner sees only operations permitted in the current league and phase.
- [ ] `MQ-COM-003` Destructive or protected actions explain consequence and require confirmation.
- [ ] `MQ-COM-004` Commissioner can request an immediate backup without receiving artifact access.
- [ ] `MQ-COM-005` Commissioner restoration request enters awaiting-administrator state and does not restore data.
- [ ] `MQ-COM-006` Platform administrator can approve/decline protected request with recorded outcome.
- [ ] `MQ-COM-007` League-specific correction is preferred over whole-database restore.
- [ ] `MQ-COM-008` Debug controls are absent from production-target presentation.
- [ ] `MQ-COM-009` Commissioner operation failure leaves prior data intact and shows request ID.

---

## League Activity and Security Audit

- [ ] `MQ-COM-010` Approved roster, contract, auction, trade, buyout, and commissioner actions appear once in League Activity.
- [ ] `MQ-COM-011` Matchup schedule, lock, baseline, result, correction, rollover, and standings events do not appear in League Activity.
- [ ] `MQ-COM-012` Resolved auction result is understandable without exposing losing sealed bid values.
- [ ] `MQ-COM-013` Activity pagination does not reorder or duplicate entries.
- [ ] `MQ-COM-014` Security Audit remains visually and conceptually separate from League Activity.
- [ ] `MQ-COM-015` Audit views do not expose password material, session tokens, action tokens, or private metadata.
- [ ] `MQ-COM-016` League A member cannot retrieve League B activity or audit.

---

## Notifications

- [ ] `MQ-COM-017` User sees only own notifications.
- [ ] `MQ-COM-018` Listing notifications does not mark them read.
- [ ] `MQ-COM-019` Mark-one-read updates only the selected owned notification.
- [ ] `MQ-COM-020` Mark-all-read affects only the caller.
- [ ] `MQ-COM-021` Socket invalidation/refetch does not create duplicate notification rows.
- [ ] `MQ-COM-022` Notification links open an authorized stable-ID route and fail safely after access changes.

---

# Part 15 - Failures, Conflicts, Jobs, and Recovery

## Network and Server Failure

- [ ] `MQ-ERR-001` Slow request shows loading state without duplicate action.
- [ ] `MQ-ERR-002` Timeout permits safe retry with the same user intent/idempotency key.
- [ ] `MQ-ERR-003` New user intent uses a new idempotency key.
- [ ] `MQ-ERR-004` `500` response shows safe message and request ID.
- [ ] `MQ-ERR-005` Malformed server response does not render stale success.
- [ ] `MQ-ERR-006` Frontend does not silently fall back to another environment origin.
- [ ] `MQ-ERR-007` Browser console/log display contains no secret or raw stack.

---

## Concurrency

- [ ] `MQ-ERR-008` Two roster edits from separate browsers produce one commit and one safe conflict.
- [ ] `MQ-ERR-009` Two accept attempts on overlapping trades do not partially transfer.
- [ ] `MQ-ERR-010` Repeated auction resolve invocation does not duplicate winner or contract.
- [ ] `MQ-ERR-011` Repeated matchup finalization does not duplicate result.
- [ ] `MQ-ERR-012` Duplicate browser submission after lost response returns prior committed result safely.

---

## Jobs and Provider

- [ ] `MQ-ERR-013` Paused scheduler state is visible to authorized operations.
- [ ] `MQ-ERR-014` Restart recovers stale lease without double execution.
- [ ] `MQ-ERR-015` Missed occurrence is evaluated once.
- [ ] `MQ-ERR-016` NHL timeout/rate limit preserves last valid data and reports stale status.
- [ ] `MQ-ERR-017` Email-provider failure retains outbox for safe retry.
- [ ] `MQ-ERR-018` No staging job sends production email.

---

## Backup and Restore Drill

- [ ] `MQ-ERR-019` Authorized staging backup reaches verified offsite status.
- [ ] `MQ-ERR-020` Commissioner cannot download or decrypt the artifact.
- [ ] `MQ-ERR-021` Restore plan is read-only and displays expected loss window safely.
- [ ] `MQ-ERR-022` Approved staging restore enters maintenance and pauses jobs/outbox.
- [ ] `MQ-ERR-023` Restored data matches selected backup reconciliation.
- [ ] `MQ-ERR-024` Restored sessions and account-action tokens are revoked.
- [ ] `MQ-ERR-025` Held email/outbox and jobs do not duplicate external effects.
- [ ] `MQ-ERR-026` Two-league isolation still passes after restore.
- [ ] `MQ-ERR-027` New post-restore backup reaches verified status.

---

# Part 16 - Responsive and Accessibility Checks

## Layout

- [ ] `MQ-ACC-001` No essential content is hidden by fixed headers, dialogs, or mobile browser chrome.
- [ ] `MQ-ACC-002` No unintended whole-page horizontal scroll occurs at mobile width.
- [ ] `MQ-ACC-003` Wide data tables use intentional horizontal handling with visible labels.
- [ ] `MQ-ACC-004` Touch targets for primary actions are usable without precision tapping.
- [ ] `MQ-ACC-005` Text remains readable at 200% zoom.
- [ ] `MQ-ACC-006` Long player, team, league, and user display names wrap or truncate without hiding identity.
- [ ] `MQ-ACC-007` Loading, empty, warning, and error states fit small screens.
- [ ] `MQ-ACC-008` Dialogs fit the viewport and keep actions reachable.

---

## Keyboard and Focus

- [ ] `MQ-ACC-009` Every interactive control is reachable by keyboard.
- [ ] `MQ-ACC-010` Tab order follows visual/logical order.
- [ ] `MQ-ACC-011` Visible focus is never removed without replacement.
- [ ] `MQ-ACC-012` Opening dialog moves focus into it.
- [ ] `MQ-ACC-013` Focus remains trapped in modal dialog.
- [ ] `MQ-ACC-014` Escape closes a dismissible dialog without submitting.
- [ ] `MQ-ACC-015` Closing dialog returns focus to invoking control.
- [ ] `MQ-ACC-016` Route change places focus at a useful page heading or main region.
- [ ] `MQ-ACC-017` Disabled controls are not misleadingly focusable unless needed for explanation.

---

## Names, Labels, and Announcements

- [ ] `MQ-ACC-018` Form controls have persistent labels.
- [ ] `MQ-ACC-019` Validation identifies the field and corrective action.
- [ ] `MQ-ACC-020` Required state is communicated without color alone.
- [ ] `MQ-ACC-021` Buttons have understandable accessible names.
- [ ] `MQ-ACC-022` Icon-only controls have labels/tooltips where appropriate.
- [ ] `MQ-ACC-023` Table headers are associated with data.
- [ ] `MQ-ACC-024` Status, legality, warning, and winner states do not rely on color alone.
- [ ] `MQ-ACC-025` Important asynchronous success/error feedback is announced.
- [ ] `MQ-ACC-026` Reduced-motion preference avoids unnecessary animation.
- [ ] `MQ-ACC-027` Screen-reader spot checks can identify sign-in form, navigation, errors, and one feature table.

---

# Part 17 - Security and Privacy Spot Checks

Manual security checks supplement automated Security tests.

- [ ] `MQ-SEC-001` Browser storage contains no password, session token, CSRF token persistence, or claimed authoritative role.
- [ ] `MQ-SEC-002` URL and browser history contain no password, action token after consumption, active bid value, or private payload.
- [ ] `MQ-SEC-003` Network requests use HTTPS in deployed staging.
- [ ] `MQ-SEC-004` Cross-origin credential request from an unapproved origin fails.
- [ ] `MQ-SEC-005` State-changing request without valid CSRF fails.
- [ ] `MQ-SEC-006` Editing role/team/league fields in a request does not grant authority.
- [ ] `MQ-SEC-007` Cross-league stable IDs fail without disclosing existence.
- [ ] `MQ-SEC-008` Active competing bids are absent from responses for managers and commissioners.
- [ ] `MQ-SEC-009` Public health exposes no path, database filename, secret, or private state.
- [ ] `MQ-SEC-010` Production-target build has no debug route or debug navigation.
- [ ] `MQ-SEC-011` Private responses are not visibly served from another user's browser cache after sign-out.
- [ ] `MQ-SEC-012` Error pages and toasts contain no raw stack or SQL detail.

Do not perform uncontrolled penetration testing against production.

---

## M7-11 Staging Usability Retest

- [ ] `MQ-M711-001` Dashboard and roster show provider-backed NHL player names after the staging reset when the retained provider catalog is present.
- [ ] `MQ-M711-002` Alpha Ravens cap usage equals active net AAV plus retained salary and buyout penalties, and retained salary shows slots used out of three.
- [ ] `MQ-M711-003` Team roster switcher changes teams without leaving the selected league; striped identity, logo fallback, readable statistics, and four years of owned picks render.
- [ ] `MQ-M711-004` Table/lines toggle works; same-position drag ordering and keyboard ordering persist after reload without changing authoritative roster categories or cap.
- [ ] `MQ-M711-005` Players hides unavailable provider records, defaults to descending total FP, sorts each data column, filters correctly, and builds/clears a comparison list.
- [ ] `MQ-M711-006` Starting an auction from a free agent opens the selected league auction page with that player prefilled; one-team managers are not asked to choose their own team.
- [ ] `MQ-M711-007` Trade asset editors offer only approved plain-language asset types and authoritative team choices; pending trade panels contain no raw JSON.
- [ ] `MQ-M711-008` League Activity defaults to a concise summary, time, resolved team name, and approved details; optional technical IDs remain collapsed.
- [ ] `MQ-M711-009` Account settings update display name and authorized team name, colours, and logo; email is read-only and password change explains/signals session revocation.
- [ ] `MQ-M711-010` The preceding workflows remain usable at desktop width and narrow mobile width, including keyboard focus and no whole-page horizontal overflow.
- [ ] `MQ-M711-011` A second league and a non-manager account cannot read or mutate another league's private workspace or team settings.
- [ ] `MQ-M711-012` No production service, data, environment variable, job, branch, or deployment changes during the M7-11 run.

---

# Part 18 - Deferred and In-Season Feature QA

## Entry Draft

Before the Entry Draft is released in-season, execute a dedicated run covering:

- [ ] `MQ-DRF-001` Four-round immutable order.
- [ ] `MQ-DRF-002` Winner last, losing finalist second-last, remaining order and two weighted draws.
- [ ] `MQ-DRF-003` Current plus three future draft classes.
- [ ] `MQ-DRF-004` Confirmed F/D eligibility snapshot and approved re-entry.
- [ ] `MQ-DRF-005` Private manager queue isolation.
- [ ] `MQ-DRF-006` Five-minute clock.
- [ ] `MQ-DRF-007` Timeout selects queue first, then approved best player available.
- [ ] `MQ-DRF-008` No skipped pick and no selection undo.
- [ ] `MQ-DRF-009` Traded on-clock pick resets clock.
- [ ] `MQ-DRF-010` Completed selection is immutable and creates prospect rights.
- [ ] `MQ-DRF-011` Activity contains draft started, lottery result, and draft ended—not every selection.
- [ ] `MQ-DRF-012` Mobile draft room remains usable.

---

## Playoffs and Season Rollover

Before their calendar deadlines:

- [ ] `MQ-SEA-001` Three playoff rounds use one week, one week, then final two NHL regular-season weeks.
- [ ] `MQ-SEA-002` Real NHL playoff games do not affect Hundo Leago.
- [ ] `MQ-SEA-003` Bracket advancement and finalist result are deterministic.
- [ ] `MQ-SEA-004` End-of-season contract decrement/expiration occurs at approved boundary.
- [ ] `MQ-SEA-005` Expired player is removed and immediately becomes free agent.
- [ ] `MQ-SEA-006` No expiring player re-sign opportunity appears.
- [ ] `MQ-SEA-007` Auction contracts end or roll with normal season boundary.
- [ ] `MQ-SEA-008` Trading reopens at Entry Draft start.
- [ ] `MQ-SEA-009` Historical season results remain readable.
- [ ] `MQ-SEA-010` Rollover backup and reconciliation pass.

---

# Part 19 - Retest and Regression

## Defect Retest

For every fixed `CRITICAL`, `HIGH`, or `MEDIUM` issue:

1. run the original reproduction;
2. record the fixed commit and deploy ID;
3. confirm expected result;
4. run the nearest preceding and following workflow;
5. run affected role and second-league denial;
6. update defect status and artifacts.

A code change without retest is not a closed QA defect.

---

## Focused Regression Selection

At minimum, choose regression based on changed boundaries:

| Changed area | Required adjacent regression |
| --- | --- |
| Session/security | All roles, logout/cache, Socket.IO reauthorization |
| League/membership | League chooser, team control, cross-league denial |
| Roster/contract/cap | Auctions, trades, buyouts, public roster |
| Auctions | Contracts, ownership, cap, activity, notifications |
| Trades | Ownership, contracts, obligations, proposals, activity |
| Statistics | Players, matchup display, last-valid cache |
| Matchups | Locks, roster snapshots, corrections, standings |
| Jobs/outbox | Restart, duplicate, provider/email failure |
| Migration/restore | Authentication, two leagues, financial reconciliation, jobs |
| Frontend shell | Direct routes, refresh, mobile, keyboard, error states |

---

# Part 20 - Exit Gate

## Required Completion

A release-level manual QA run passes only when:

* run header is complete;
* every launch-critical case is `PASS` or valid `NOT APPLICABLE`;
* every `DEFERRED` case cites approved scope;
* required browser/device matrix is complete;
* at least one physical mobile browser is tested;
* keyboard and accessibility spot checks pass;
* two-league isolation spot checks pass;
* no `CRITICAL` or `HIGH` defect is open;
* every `MEDIUM` defect has explicit release disposition;
* all blocked and not-run cases are visible;
* affected fixes are retested;
* artifacts contain no secrets;
* tester signs the result.

---

## Run Summary

```text
Total cases in scope:
Passed:
Failed:
Blocked:
Not applicable:
Deferred:
Not run:
Critical defects open:
High defects open:
Medium defects open:
Low defects open:
Physical mobile evidence:
Keyboard/accessibility evidence:
Two-league evidence:
Recommendation: PASS / FAIL / INCOMPLETE
Tester:
Date:
```

`PASS` is evidence for the Release Checklist. It is not production authority.

---

## Stop Conditions

Stop the run and protect evidence when:

* production data or secrets appear in staging;
* cross-league private access succeeds;
* active competing bids are exposed;
* a read triggers an unexpected domain write;
* a write partially commits;
* repeated action duplicates a transaction;
* a destructive operation lacks confirmation or authorization;
* fixture reset would target a protected path;
* the intended build IDs change during the run;
* another deployment invalidates the evidence;
* tester cannot distinguish expected behavior because approved documents conflict.

Report the condition. Do not repair protected data manually.

---

# Verification

Documentation verification:

```powershell
Get-Content docs/07-testing/MANUAL_QA_CHECKLIST.md
Select-String -Path docs/07-testing/MANUAL_QA_CHECKLIST.md -Pattern '^`APPROVED`$','MQ-ENV-001','MQ-ACT-001','MQ-AUC-001','MQ-MAT-001','Required Release Matrix','Exit Gate'
```

Expected:

* checklist status is approved and active;
* production is excluded from destructive QA;
* every run records builds, environment, tester, browser/device, results, and defects;
* initial-release and deferred feature scopes remain distinct.
